import {
  MCPToolDefinition,
  MCPToolExecuteResponse,
  SecurityEvent,
  ShieldDecision,
} from '@/types';
import { db } from '../db/store';
import { shieldEngine, UpgradedShieldEvaluationResult } from './shieldEngine';
import { localMcpServer } from '../mcp/server';
import { scanAndSanitizeToolOutput, toOutputCheckItem } from './outputScanner';
import { detectDataExfiltration } from './exfiltrationDetector';
import { evaluateWithLLMJudge, LLMJudgeResult } from './llmJudge';
import { shieldEventBus } from '../events/eventBus';

export interface EvaluateToolCallContext {
  currentToolMetadata?: Partial<MCPToolDefinition>;
  isPreApproved?: boolean;
  provider?: string;
  scenarioId?: string;
  simulatedAttack?: boolean;
  rawCallId?: string;
  userPrompt?: string;
  judgeResult?: LLMJudgeResult;
}

/**
 * SHARED INTERCEPTOR & SINGLE SOURCE OF TRUTH
 * Evaluates any tool call across Agent Console, Attack Lab, JSON-RPC Proxy, and Red-Team Agent.
 */
export async function evaluateToolCall(
  agentId: string,
  toolName: string,
  args: Record<string, any> = {},
  context: EvaluateToolCallContext = {}
): Promise<MCPToolExecuteResponse> {
  const { currentToolMetadata, isPreApproved, provider, scenarioId, rawCallId, userPrompt } = context;
  const timestamp = new Date().toISOString();
  const eventId = `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const tool = db.getToolByName(toolName);

  // 1. Run LLM-Judge evaluation (Live or fast semantic evaluator)
  const judgeResult = context.judgeResult || await evaluateWithLLMJudge({
    userPrompt,
    toolName,
    arguments: args,
    toolCapability: (currentToolMetadata?.capability || tool?.capability || 'read-only') as any,
    toolDescription: currentToolMetadata?.description || tool?.description,
    agentRole: agentId,
  });

  // 2. Run full 3-Layer Shield Evaluation Pipeline
  const evaluation = shieldEngine.evaluate(
    {
      toolName,
      agentId,
      parameters: args,
      currentToolMetadata,
    },
    { judgeResult, userPrompt }
  );

  // 3. Record Detected Threats for SOC alerting
  if (evaluation.riskScore >= 30 || evaluation.decision === 'BLOCK') {
    if (!evaluation.checks.integrity.passed) {
      db.recordThreat({
        id: `thr_${Date.now()}_int`,
        toolId: tool?.id || 'unknown',
        toolName,
        agentId,
        type: 'INTEGRITY_VIOLATION',
        severity: evaluation.riskLevel,
        description: evaluation.checks.integrity.message,
        evidence: JSON.stringify({
          trustedFingerprint: evaluation.checks.integrity.details?.trustedFingerprint,
          currentFingerprint: evaluation.checks.integrity.details?.currentFingerprint,
        }),
        status: 'ACTIVE',
        timestamp: evaluation.timestamp,
        actionTaken: evaluation.decision,
      });
    }

    if (evaluation.crossServerCheck?.detected) {
      db.recordThreat({
        id: `thr_${Date.now()}_cross`,
        toolId: tool?.id || 'unknown',
        toolName,
        agentId,
        type: 'UNAUTHORIZED_TOOL',
        severity: 'CRITICAL',
        description: evaluation.crossServerCheck.message,
        evidence: `Source: ${evaluation.crossServerCheck.sourceServer} -> Target: ${evaluation.crossServerCheck.targetServer}`,
        status: 'ACTIVE',
        timestamp: evaluation.timestamp,
        actionTaken: 'BLOCK',
      });
    }

    if (evaluation.dataExfiltrationCheck?.detected || judgeResult.factors.dataExfiltration) {
      db.recordThreat({
        id: `thr_${Date.now()}_exfil`,
        toolId: tool?.id || 'unknown',
        toolName,
        agentId,
        type: 'EXFILTRATION_ATTEMPT',
        severity: 'CRITICAL',
        description: evaluation.dataExfiltrationCheck?.message || judgeResult.reasoning,
        evidence: JSON.stringify(args),
        status: 'ACTIVE',
        timestamp: evaluation.timestamp,
        actionTaken: 'BLOCK',
      });
    }

    if (judgeResult.factors.destructiveIntent) {
      db.recordThreat({
        id: `thr_${Date.now()}_destruct`,
        toolId: tool?.id || 'unknown',
        toolName,
        agentId,
        type: 'DESTRUCTIVE_ACTION',
        severity: 'CRITICAL',
        description: `[DESTRUCTIVE ACTION DETECTED] ${judgeResult.reasoning}`,
        evidence: JSON.stringify({ userPrompt, toolName, parameters: args }),
        status: 'ACTIVE',
        timestamp: evaluation.timestamp,
        actionTaken: evaluation.decision,
      });
    }
  }

  // 3. HARD BLOCK ENFORCEMENT (Zero-Forwarding to MCP Server)
  if (evaluation.decision === 'BLOCK') {
    const secEvent: SecurityEvent = {
      id: eventId,
      toolId: tool?.id || 'unknown',
      toolName,
      agentId,
      eventType: 'INTEGRITY_VIOLATION',
      riskScore: evaluation.riskScore,
      decision: 'BLOCK',
      reason: `[BLOCKED BEFORE EXECUTION] ${evaluation.reasons.join(' | ')}`,
      details: { parameters: args, checks: evaluation.checks, scenarioId, provider, rawCallId },
      timestamp: evaluation.timestamp,
      executed: false,
    };

    db.recordSecurityEvent(secEvent);

    const response: MCPToolExecuteResponse = {
      success: false,
      decision: 'BLOCK',
      riskScore: evaluation.riskScore,
      executed: false,
      error: `MCP Shield Runtime Interception: Execution BLOCKED. Reasons: ${evaluation.reasons.join('; ')}`,
      evaluation,
      eventId,
    };

    // Emit live event over SSE / WebSocket bus
    shieldEventBus.emitShieldEvent(secEvent, response);
    return response;
  }

  // 4. REVIEW REQUIRED (Human-in-the-loop authorization)
  if (evaluation.decision === 'REVIEW' && !isPreApproved) {
    const approvalId = `app_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    db.createApprovalRequest({
      id: approvalId,
      toolId: tool?.id || 'unknown',
      toolName,
      version: tool?.version || '1.0.0',
      requestedBy: agentId,
      agentId,
      proposedFingerprint: evaluation.checks.integrity.details?.currentFingerprint || tool?.trustedFingerprint || '',
      previousFingerprint: tool?.trustedFingerprint,
      changesSummary: evaluation.reasons.join(', '),
      riskScore: evaluation.riskScore,
      status: 'PENDING',
      createdAt: evaluation.timestamp,
    });

    const secEvent: SecurityEvent = {
      id: eventId,
      toolId: tool?.id || 'unknown',
      toolName,
      agentId,
      eventType: 'UNAUTHORIZED_TOOL',
      riskScore: evaluation.riskScore,
      decision: 'REVIEW',
      reason: `[APPROVAL REQUIRED] Execution paused for developer review. Approval Request: ${approvalId}`,
      details: { parameters: args, approvalId, scenarioId, provider, rawCallId },
      timestamp: evaluation.timestamp,
      executed: false,
    };

    db.recordSecurityEvent(secEvent);
    evaluation.approvalId = approvalId;

    const response: MCPToolExecuteResponse = {
      success: false,
      decision: 'REVIEW',
      riskScore: evaluation.riskScore,
      executed: false,
      error: `MCP Shield Notice: Tool execution requires human/developer approval (ID: ${approvalId}).`,
      evaluation,
      eventId,
    };

    shieldEventBus.emitShieldEvent(secEvent, response);
    return response;
  }

  // 5. ALLOWED: Forward to MCP Server
  let rawResult: any;
  try {
    rawResult = await localMcpServer.executeTool(toolName, args);
  } catch (err: any) {
    const errorResponse: MCPToolExecuteResponse = {
      success: false,
      decision: 'ALLOW',
      riskScore: evaluation.riskScore,
      executed: true,
      error: `MCP Server Execution Error: ${err?.message || 'Unknown error'}`,
      evaluation,
      eventId,
    };
    return errorResponse;
  }

  // Check Output Poisoning & Exfiltration in tool return payload
  const outputScanResult = scanAndSanitizeToolOutput(rawResult);
  const outputExfil = detectDataExfiltration(rawResult);
  const outputCheckItem = toOutputCheckItem(outputScanResult);
  evaluation.checks.outputScan = outputCheckItem;

  if (!outputScanResult.passed || outputExfil.detected) {
    db.recordThreat({
      id: `thr_${Date.now()}_out`,
      toolId: tool?.id || 'unknown',
      toolName,
      agentId,
      type: 'MALICIOUS_OUTPUT',
      severity: 'CRITICAL',
      description: outputScanResult.message + (outputExfil.detected ? ` ${outputExfil.message}` : ''),
      evidence: JSON.stringify(rawResult),
      status: 'ACTIVE',
      timestamp: new Date().toISOString(),
      actionTaken: 'BLOCK',
    });

    const poisonedSecEvent: SecurityEvent = {
      id: eventId,
      toolId: tool?.id || 'unknown',
      toolName,
      agentId,
      eventType: 'MALICIOUS_OUTPUT',
      riskScore: 75,
      decision: 'BLOCK',
      reason: `[OUTPUT POISONING DETECTED] Tool output contained malicious payload and was sanitized by Shield before reaching AI Agent.`,
      details: { outputScanResult, scenarioId, provider, rawCallId },
      timestamp: new Date().toISOString(),
      executed: true,
    };

    db.recordSecurityEvent(poisonedSecEvent);

    const poisonedResponse: MCPToolExecuteResponse = {
      success: true,
      decision: 'ALLOW',
      riskScore: 75,
      executed: true,
      result: outputScanResult.cleanOutput,
      evaluation,
      eventId,
    };

    shieldEventBus.emitShieldEvent(poisonedSecEvent, poisonedResponse);
    return poisonedResponse;
  }

  // Safe execution record
  const safeSecEvent: SecurityEvent = {
    id: eventId,
    toolId: tool?.id || 'unknown',
    toolName,
    agentId,
    eventType: 'TOOL_EXECUTION',
    riskScore: evaluation.riskScore,
    decision: 'ALLOW',
    reason: `Tool execution verified and authorized. Zero threats detected.`,
    details: { parameters: args, scenarioId, provider, rawCallId },
    timestamp: evaluation.timestamp,
    executed: true,
  };

  db.recordSecurityEvent(safeSecEvent);

  const safeResponse: MCPToolExecuteResponse = {
    success: true,
    decision: 'ALLOW',
    riskScore: evaluation.riskScore,
    executed: true,
    result: rawResult,
    evaluation,
    eventId,
  };

  shieldEventBus.emitShieldEvent(safeSecEvent, safeResponse);
  return safeResponse;
}
