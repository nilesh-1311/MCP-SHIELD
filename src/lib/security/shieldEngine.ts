import {
  MCPToolDefinition,
  ShieldEvaluationResult,
  MCPToolExecuteRequest,
  MCPToolExecuteResponse,
  SecurityEvent,
  ThreatRecord,
  ShieldDecision,
} from '@/types';
import { db } from '../db/store';
import { verifyToolIntegrity, toSecurityCheckItem } from './integrity';
import { checkAuthorization, toAuthorizationCheckItem } from './authorization';
import { scanToolDescription, toDescriptionCheckItem } from './threatScanner';
import { scanToolRequestParameters, toRequestCheckItem } from './requestScanner';
import { scanAndSanitizeToolOutput, toOutputCheckItem } from './outputScanner';
import { calculateRisk } from './riskEngine';
import { localMcpServer } from '../mcp/server';
import { detectCrossServerHijacking } from './crossServerDetector';
import { detectPermissionEscalation } from './permissionDetector';
import { detectRogueTool } from './rogueToolDetector';
import { detectDataExfiltration } from './exfiltrationDetector';
import { calculateToolTrustScore, TrustScoreBreakdown } from './trustEngine';

export interface UpgradedShieldEvaluationResult extends ShieldEvaluationResult {
  trustScore: TrustScoreBreakdown;
  crossServerCheck?: {
    detected: boolean;
    sourceServer: string;
    targetServer: string;
    message: string;
  };
  permissionEscalationCheck?: {
    detected: boolean;
    escalatedPermissions: string[];
    message: string;
  };
  dataExfiltrationCheck?: {
    detected: boolean;
    sensitiveItems: string[];
    message: string;
  };
}

export class MCPShieldEngine {
  /**
   * Performs the full pre-execution security verification pipeline with advanced detectors
   */
  public evaluate(request: MCPToolExecuteRequest): UpgradedShieldEvaluationResult {
    const { toolName, agentId, parameters, currentToolMetadata } = request;
    const timestamp = new Date().toISOString();

    const registeredTool = db.getToolByName(toolName);
    const isRegistered = !!registeredTool;

    // DETECTOR 1: Rogue Tool Detection
    const rogueCheck = detectRogueTool(toolName, currentToolMetadata, isRegistered);

    // If completely unknown
    if (!isRegistered || !registeredTool) {
      const risk = calculateRisk({
        unregisteredTool: true,
        fingerprintMismatch: false,
        unauthorizedTool: false,
        requiresReview: false,
        suspiciousInstructionDetected: false,
        credentialStealingDetected: false,
        exfiltrationDetected: false,
        dangerousParametersDetected: false,
        maliciousOutputDetected: false,
      });

      return {
        decision: 'BLOCK',
        riskScore: risk.riskScore,
        riskLevel: risk.riskLevel,
        reasons: [`Rogue/Unknown Tool: '${toolName}' is not registered in MCP Shield baseline (+85)`],
        checks: {
          toolExistence: {
            name: 'Tool Identity & Registration Check',
            passed: false,
            scoreImpact: 85,
            message: `UNKNOWN TOOL: '${toolName}' rejected by MCP Shield Zero-Trust policy.`,
          },
          integrity: {
            name: 'Tool Integrity & Fingerprint Verification',
            passed: false,
            scoreImpact: 0,
            message: 'Skipped: Unknown tool has no registered fingerprint.',
          },
          authorization: {
            name: 'Agent Authorization & RBAC Check',
            passed: false,
            scoreImpact: 0,
            message: 'Skipped: Unregistered tool cannot be authorized.',
          },
          descriptionScan: {
            name: 'Tool Description Threat & Injection Scan',
            passed: false,
            scoreImpact: 0,
            message: 'Skipped: Tool not found.',
          },
          requestScan: {
            name: 'Request Parameter & Intent Scan',
            passed: false,
            scoreImpact: 0,
            message: 'Skipped: Unregistered tool.',
          },
        },
        toolName,
        agentId,
        timestamp,
        executionAllowed: false,
        requiresApproval: false,
        trustScore: {
          score: 10,
          level: 'UNTRUSTED',
          factors: [{ name: 'Unknown Rogue Tool', impact: -90, description: 'Tool does not exist in registry' }],
        },
      };
    }

    // CHECK 2: SHA-256 Fingerprint & Integrity Verification
    const integrityResult = verifyToolIntegrity(registeredTool, currentToolMetadata);
    const integrityCheckItem = toSecurityCheckItem(integrityResult);

    // CHECK 3: Agent Authorization & RBAC Matrix
    const policy = db.getPolicy(agentId);
    const authResult = checkAuthorization(agentId, registeredTool, policy);
    const authCheckItem = toAuthorizationCheckItem(authResult);

    // CHECK 4: Tool Description Threat & Injection Scan
    const descriptionToScan = currentToolMetadata?.description || registeredTool.description;
    const threatScanResult = scanToolDescription(descriptionToScan);
    const descriptionCheckItem = toDescriptionCheckItem(threatScanResult);

    // DETECTOR 2: Cross-Server Hijack Detection
    const crossServerResult = detectCrossServerHijacking(toolName, descriptionToScan);

    // DETECTOR 3: Permission Escalation Detection
    const permEscalationResult = detectPermissionEscalation(
      registeredTool.permissions,
      currentToolMetadata?.permissions || registeredTool.permissions
    );

    // DETECTOR 4: Data Exfiltration Detection in Parameters
    const exfilParamResult = detectDataExfiltration(parameters);

    // CHECK 5: Request Parameter & Intent Scan
    const requestScanResult = scanToolRequestParameters(toolName, parameters);
    const requestCheckItem = toRequestCheckItem(requestScanResult);

    // Evaluate Combined Transparent Risk Score
    const hasCredThreat = threatScanResult.threatsDetected.some((t) => t.category === 'CREDENTIAL_THEFT');
    const hasExfilThreat = threatScanResult.threatsDetected.some((t) => t.category === 'EXFILTRATION_ATTEMPT') || exfilParamResult.detected;

    const risk = calculateRisk({
      unregisteredTool: rogueCheck.isRogue && !isRegistered,
      fingerprintMismatch: integrityResult.mismatch,
      unauthorizedTool: authResult.status === 'BLOCKED',
      requiresReview: authResult.status === 'REVIEW_REQUIRED' || permEscalationResult.detected,
      suspiciousInstructionDetected: !threatScanResult.passed || crossServerResult.detected,
      credentialStealingDetected: hasCredThreat,
      exfiltrationDetected: hasExfilThreat,
      dangerousParametersDetected: !requestScanResult.passed,
      maliciousOutputDetected: false,
      agentMaxThreshold: policy?.maxRiskThreshold,
    });

    const reasons = [...risk.reasons];
    if (crossServerResult.detected) reasons.push(crossServerResult.message);
    if (permEscalationResult.detected) reasons.push(permEscalationResult.message);
    if (exfilParamResult.detected) reasons.push(exfilParamResult.message);

    const activeThreats = db.getThreats();
    const trustScore = calculateToolTrustScore(registeredTool, activeThreats);
    if (integrityResult.mismatch) {
      trustScore.score = Math.min(trustScore.score, 28);
      trustScore.level = 'UNTRUSTED';
    }

    const executionAllowed = risk.decision === 'ALLOW' && !crossServerResult.detected && !exfilParamResult.detected;
    const requiresApproval = risk.decision === 'REVIEW' || permEscalationResult.detected;

    return {
      decision: executionAllowed ? 'ALLOW' : (requiresApproval ? 'REVIEW' : 'BLOCK'),
      riskScore: risk.riskScore,
      riskLevel: risk.riskLevel,
      reasons,
      checks: {
        toolExistence: {
          name: 'Tool Identity & Registration Check',
          passed: isRegistered,
          scoreImpact: 0,
          message: `Tool '${toolName}' verified in registry (Status: ${registeredTool.status}).`,
        },
        integrity: integrityCheckItem,
        authorization: authCheckItem,
        descriptionScan: descriptionCheckItem,
        requestScan: requestCheckItem,
      },
      toolName,
      agentId,
      timestamp,
      executionAllowed,
      requiresApproval,
      trustScore,
      crossServerCheck: {
        detected: crossServerResult.detected,
        sourceServer: crossServerResult.sourceServer,
        targetServer: crossServerResult.targetServer,
        message: crossServerResult.message,
      },
      permissionEscalationCheck: {
        detected: permEscalationResult.detected,
        escalatedPermissions: permEscalationResult.escalatedPermissions,
        message: permEscalationResult.message,
      },
      dataExfiltrationCheck: {
        detected: exfilParamResult.detected,
        sensitiveItems: exfilParamResult.sensitivePatternsFound.map((f) => f.category),
        message: exfilParamResult.message,
      },
    };
  }

  /**
   * Main Intercepted Execution Entry Point
   * Strictly enforces security decisions BEFORE execution.
   */
  public async interceptAndExecute(
    request: MCPToolExecuteRequest,
    isPreApproved = false
  ): Promise<MCPToolExecuteResponse> {
    const { toolName, agentId, parameters, currentToolMetadata } = request;
    const evaluation = this.evaluate(request);
    const eventId = `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const tool = db.getToolByName(toolName);

    // Record Detected Threats
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

      if (evaluation.dataExfiltrationCheck?.detected) {
        db.recordThreat({
          id: `thr_${Date.now()}_exfil`,
          toolId: tool?.id || 'unknown',
          toolName,
          agentId,
          type: 'EXFILTRATION_ATTEMPT',
          severity: 'CRITICAL',
          description: evaluation.dataExfiltrationCheck.message,
          evidence: JSON.stringify(parameters),
          status: 'ACTIVE',
          timestamp: evaluation.timestamp,
          actionTaken: 'BLOCK',
        });
      }
    }

    // 1. HARD BLOCK ENFORCEMENT
    if (evaluation.decision === 'BLOCK') {
      db.recordSecurityEvent({
        id: eventId,
        toolId: tool?.id || 'unknown',
        toolName,
        agentId,
        eventType: 'INTEGRITY_VIOLATION',
        riskScore: evaluation.riskScore,
        decision: 'BLOCK',
        reason: `[BLOCKED BEFORE EXECUTION] ${evaluation.reasons.join(' | ')}`,
        details: { parameters, checks: evaluation.checks },
        timestamp: evaluation.timestamp,
        executed: false,
      });

      return {
        success: false,
        decision: 'BLOCK',
        riskScore: evaluation.riskScore,
        executed: false,
        error: `MCP Shield Runtime Interception: Execution BLOCKED. Reasons: ${evaluation.reasons.join('; ')}`,
        evaluation,
        eventId,
      };
    }

    // 2. REVIEW REQUIRED
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

      db.recordSecurityEvent({
        id: eventId,
        toolId: tool?.id || 'unknown',
        toolName,
        agentId,
        eventType: 'UNAUTHORIZED_TOOL',
        riskScore: evaluation.riskScore,
        decision: 'REVIEW',
        reason: `[APPROVAL REQUIRED] Execution paused for developer review. Approval Request: ${approvalId}`,
        details: { parameters, approvalId },
        timestamp: evaluation.timestamp,
        executed: false,
      });

      evaluation.approvalId = approvalId;

      return {
        success: false,
        decision: 'REVIEW',
        riskScore: evaluation.riskScore,
        executed: false,
        error: `MCP Shield Notice: Tool execution requires human/developer approval (ID: ${approvalId}).`,
        evaluation,
        eventId,
      };
    }

    // 3. ALLOWED: Forward to MCP Server
    let rawResult: any;
    try {
      rawResult = await localMcpServer.executeTool(toolName, parameters);
    } catch (err: any) {
      return {
        success: false,
        decision: 'ALLOW',
        riskScore: evaluation.riskScore,
        executed: true,
        error: `MCP Server Execution Error: ${err?.message || 'Unknown error'}`,
        evaluation,
        eventId,
      };
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

      db.recordSecurityEvent({
        id: eventId,
        toolId: tool?.id || 'unknown',
        toolName,
        agentId,
        eventType: 'MALICIOUS_OUTPUT',
        riskScore: 75,
        decision: 'BLOCK',
        reason: `[OUTPUT POISONING DETECTED] Tool output contained malicious payload and was sanitized by Shield before reaching AI Agent.`,
        details: { outputScanResult },
        timestamp: new Date().toISOString(),
        executed: true,
      });

      return {
        success: true,
        decision: 'ALLOW',
        riskScore: 75,
        executed: true,
        result: outputScanResult.cleanOutput,
        evaluation,
        eventId,
      };
    }

    // Safe execution record
    db.recordSecurityEvent({
      id: eventId,
      toolId: tool?.id || 'unknown',
      toolName,
      agentId,
      eventType: 'TOOL_EXECUTION',
      riskScore: evaluation.riskScore,
      decision: 'ALLOW',
      reason: `Tool execution verified and authorized. Zero threats detected.`,
      details: { parameters },
      timestamp: evaluation.timestamp,
      executed: true,
    });

    return {
      success: true,
      decision: 'ALLOW',
      riskScore: evaluation.riskScore,
      executed: true,
      result: rawResult,
      evaluation,
      eventId,
    };
  }
}

export const shieldEngine = new MCPShieldEngine();
