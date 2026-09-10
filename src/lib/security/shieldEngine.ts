import {
  MCPToolDefinition,
  ShieldEvaluationResult,
  MCPToolExecuteRequest,
  MCPToolExecuteResponse,
  SecurityEvent,
  ThreatRecord,
  ShieldDecision,
  ToolCapability,
} from '@/types';
import { db } from '../db/store';
import { verifyToolIntegrity, toSecurityCheckItem } from './integrity';
import { checkAuthorization, toAuthorizationCheckItem } from './authorization';
import { scanToolDescription, toDescriptionCheckItem } from './threatScanner';
import { scanToolRequestParameters, toRequestCheckItem } from './requestScanner';
import { calculateRisk, combine3LayerRiskGate } from './riskEngine';
import { detectCrossServerHijacking } from './crossServerDetector';
import { detectPermissionEscalation } from './permissionDetector';
import { detectRogueTool } from './rogueToolDetector';
import { detectDataExfiltration } from './exfiltrationDetector';
import { calculateToolTrustScore, TrustScoreBreakdown } from './trustEngine';
import { evaluateOfflineJudge, LLMJudgeResult } from './llmJudge';
import { evaluateToolCall } from './evaluator';

export interface UpgradedShieldEvaluationResult extends ShieldEvaluationResult {
  trustScore: TrustScoreBreakdown;
  capability?: ToolCapability;
  policyFloor?: number;
  judgeResult?: LLMJudgeResult;
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

export interface ShieldEvaluationOptions {
  judgeResult?: LLMJudgeResult;
  userPrompt?: string;
}

export class MCPShieldEngine {
  /**
   * Performs the full pre-execution security verification pipeline with 3-Layer Gate
   */
  public evaluate(
    request: MCPToolExecuteRequest,
    options?: ShieldEvaluationOptions
  ): UpgradedShieldEvaluationResult {
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

    // LAYER 1: Capability & Hard Policy Floor
    const capability: ToolCapability = (currentToolMetadata?.capability || registeredTool.capability || 'read-only') as ToolCapability;
    const policyFloor = (capability === 'destructive' || capability === 'exfiltration-capable') ? 70 : 0;
    const policyFloorReason = policyFloor > 0
      ? `Tool capability '${capability}' mandates a hard minimum baseline policy floor of 70 (REVIEW).`
      : undefined;

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

    // LAYER 2: LLM-Judge Layer
    const judgeResult: LLMJudgeResult = options?.judgeResult || evaluateOfflineJudge({
      userPrompt: options?.userPrompt,
      toolName,
      arguments: parameters,
      toolCapability: capability,
      toolDescription: descriptionToScan,
      agentRole: agentId,
    });

    // LAYER 3: Heuristic Threat Scanners
    const hasCredThreat = threatScanResult.threatsDetected.some((t) => t.category === 'CREDENTIAL_THEFT');
    const hasExfilThreat = threatScanResult.threatsDetected.some((t) => t.category === 'EXFILTRATION_ATTEMPT') || exfilParamResult.detected;

    const heuristicRisk = calculateRisk({
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

    const heuristicReasons = [...heuristicRisk.reasons];
    if (crossServerResult.detected) heuristicReasons.push(crossServerResult.message);
    if (permEscalationResult.detected) heuristicReasons.push(permEscalationResult.message);
    if (exfilParamResult.detected) heuristicReasons.push(exfilParamResult.message);

    // COMBINE 3-LAYER GATE (Non-Additive: max(policyFloor, judgeScore, heuristicScore))
    const combinedGate = combine3LayerRiskGate({
      policyFloor,
      policyFloorReason,
      judgeScore: judgeResult.riskScore,
      judgeReasoning: judgeResult.reasoning,
      judgeThreatCategory: judgeResult.threatCategory,
      judgeFactors: judgeResult.factors,
      heuristicScore: heuristicRisk.riskScore,
      heuristicReasons,
      heuristicDecision: heuristicRisk.decision,
      hasMaliciousThreats: !integrityResult.passed || rogueCheck.isRogue || hasCredThreat || hasExfilThreat || crossServerResult.detected,
      agentMaxThreshold: policy?.maxRiskThreshold,
    });

    const activeThreats = db.getThreats();
    const trustScore = calculateToolTrustScore(registeredTool, activeThreats);
    if (integrityResult.mismatch) {
      trustScore.score = Math.min(trustScore.score, 28);
      trustScore.level = 'UNTRUSTED';
    }

    const executionAllowed = combinedGate.decision === 'ALLOW' && !crossServerResult.detected && !exfilParamResult.detected;
    const requiresApproval = combinedGate.decision === 'REVIEW' || permEscalationResult.detected;

    return {
      decision: combinedGate.decision,
      riskScore: combinedGate.finalRiskScore,
      riskLevel: combinedGate.riskLevel,
      reasons: combinedGate.reasons,
      checks: {
        toolExistence: {
          name: 'Tool Identity & Registration Check',
          passed: isRegistered,
          scoreImpact: 0,
          message: `Tool '${toolName}' verified in registry (Status: ${registeredTool.status}, Capability: ${capability}).`,
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
      capability,
      policyFloor,
      judgeResult,
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
   * Strictly delegates to the central evaluateToolCall interceptor.
   */
  public async interceptAndExecute(
    request: MCPToolExecuteRequest,
    isPreApproved = false,
    options?: ShieldEvaluationOptions
  ): Promise<MCPToolExecuteResponse> {
    return evaluateToolCall(
      request.agentId,
      request.toolName,
      request.parameters,
      {
        currentToolMetadata: request.currentToolMetadata,
        isPreApproved,
        userPrompt: options?.userPrompt,
        judgeResult: options?.judgeResult,
      }
    );
  }
}

export const shieldEngine = new MCPShieldEngine();
