import { ThreatSeverity, ShieldDecision } from '@/types';

export interface RiskEvaluation {
  riskScore: number;
  riskLevel: ThreatSeverity;
  decision: ShieldDecision;
  reasons: string[];
}

export interface RiskInputFactors {
  fingerprintMismatch: boolean;
  unauthorizedTool: boolean;
  requiresReview: boolean;
  suspiciousInstructionDetected: boolean;
  credentialStealingDetected: boolean;
  exfiltrationDetected: boolean;
  dangerousParametersDetected: boolean;
  maliciousOutputDetected: boolean;
  unregisteredTool: boolean;
  agentMaxThreshold?: number;
}

/**
 * Deterministic Risk Calculation according to security specifications
 * 0–29: LOW
 * 30–59: MEDIUM
 * 60–79: HIGH
 * 80–100: CRITICAL
 */
export function calculateRisk(factors: RiskInputFactors): RiskEvaluation {
  let score = 0;
  const reasons: string[] = [];

  if (factors.unregisteredTool) {
    score += 85;
    reasons.push('Tool is not registered in the trusted tool registry (+85)');
  }

  if (factors.fingerprintMismatch) {
    score += 40;
    reasons.push('SHA-256 fingerprint mismatch vs trusted baseline (+40)');
  }

  if (factors.unauthorizedTool) {
    score += 35;
    reasons.push('Agent role unauthorized for this tool execution (+35)');
  }

  if (factors.suspiciousInstructionDetected) {
    score += 25;
    reasons.push('Suspicious prompt-injection instructions in tool metadata (+25)');
  }

  if (factors.credentialStealingDetected) {
    score += 35;
    reasons.push('Credential harvesting / secret exposure intent (+35)');
  }

  if (factors.exfiltrationDetected) {
    score += 35;
    reasons.push('External network exfiltration instruction (+35)');
  }

  if (factors.dangerousParametersDetected) {
    score += 30;
    reasons.push('Dangerous path traversal or injection in parameters (+30)');
  }

  if (factors.maliciousOutputDetected) {
    score += 30;
    reasons.push('Malicious payload detected in tool output (+30)');
  }

  if (factors.requiresReview) {
    score += 15;
    reasons.push('Tool permissions require human authorization (+15)');
  }

  // Cap at 100
  const finalScore = Math.min(score, 100);

  // Determine Severity Level
  let riskLevel: ThreatSeverity = 'LOW';
  if (finalScore >= 80) {
    riskLevel = 'CRITICAL';
  } else if (finalScore >= 60) {
    riskLevel = 'HIGH';
  } else if (finalScore >= 30) {
    riskLevel = 'MEDIUM';
  }

  // Determine Policy Decision
  let decision: ShieldDecision = 'ALLOW';

  // Hard blocking conditions: Unregistered, Credential Theft, Exfiltration, Unauthorized, or High Risk Exceeding Threshold
  if (
    factors.unregisteredTool ||
    factors.credentialStealingDetected ||
    factors.exfiltrationDetected ||
    factors.unauthorizedTool ||
    (factors.fingerprintMismatch && factors.suspiciousInstructionDetected) ||
    (typeof factors.agentMaxThreshold === 'number' && finalScore > factors.agentMaxThreshold) ||
    finalScore >= 80
  ) {
    decision = 'BLOCK';
  } else if (factors.requiresReview || factors.fingerprintMismatch || finalScore >= 30) {
    decision = 'REVIEW';
  }

  return {
    riskScore: finalScore,
    riskLevel,
    decision,
    reasons: reasons.length > 0 ? reasons : ['All security integrity and authorization checks passed (0)'],
  };
}

export interface ThreeLayerGateInput {
  policyFloor: number; // e.g. 70 for destructive / exfiltration-capable, 0 otherwise
  policyFloorReason?: string;
  judgeScore: number; // 0-100 from LLM Judge
  judgeReasoning?: string;
  judgeThreatCategory?: string;
  judgeFactors?: {
    destructiveIntent?: boolean;
    dataExfiltration?: boolean;
    privilegeEscalation?: boolean;
    argumentTampering?: boolean;
  };
  heuristicScore: number; // 0-100 from heuristic checks
  heuristicReasons: string[];
  heuristicDecision: ShieldDecision;
  hasMaliciousThreats: boolean; // e.g. fingerprint mismatch + injection, rogue, exfil, credential theft
  agentMaxThreshold?: number;
}

export interface ThreeLayerGateResult {
  finalRiskScore: number;
  riskLevel: ThreatSeverity;
  decision: ShieldDecision;
  reasons: string[];
  policyFloor: number;
  judgeScore: number;
  heuristicScore: number;
}

/**
 * 3-LAYER GATE RISK COMBINATION (Strictly Non-Additive, Max-Based)
 * finalRiskScore = max(policyFloor, judgeScore, heuristicScore)
 */
export function combine3LayerRiskGate(input: ThreeLayerGateInput): ThreeLayerGateResult {
  const {
    policyFloor,
    policyFloorReason,
    judgeScore,
    judgeReasoning,
    judgeFactors,
    heuristicScore,
    heuristicReasons,
    heuristicDecision,
    hasMaliciousThreats,
    agentMaxThreshold,
  } = input;

  // STRICTLY NON-ADDITIVE MAX COMBINATION
  const finalRiskScore = Math.min(100, Math.max(policyFloor, judgeScore, heuristicScore));

  // Determine Severity Level
  let riskLevel: ThreatSeverity = 'LOW';
  if (finalRiskScore >= 80) {
    riskLevel = 'CRITICAL';
  } else if (finalRiskScore >= 60) {
    riskLevel = 'HIGH';
  } else if (finalRiskScore >= 30) {
    riskLevel = 'MEDIUM';
  }

  const combinedReasons: string[] = [];

  if (policyFloor > 0 && policyFloorReason) {
    combinedReasons.push(`[Layer 1: Policy Floor] ${policyFloorReason} (Floor: ${policyFloor})`);
  }

  if (judgeScore > 0 && judgeReasoning) {
    combinedReasons.push(`[Layer 2: LLM Judge] ${judgeReasoning} (Judge Score: ${judgeScore})`);
  }

  if (heuristicScore > 0 && heuristicReasons.length > 0) {
    combinedReasons.push(`[Layer 3: Heuristics] ${heuristicReasons.join('; ')} (Heuristic Score: ${heuristicScore})`);
  }

  // Check if assessed risk exceeds agent's configured max threshold
  const thresholdLimit = typeof agentMaxThreshold === 'number' ? agentMaxThreshold : 70;
  const threatScore = Math.max(judgeScore, heuristicScore);
  const threatExceedsThreshold = typeof agentMaxThreshold === 'number' && threatScore > thresholdLimit;
  const floorExceedsRestrictedThreshold = typeof agentMaxThreshold === 'number' && thresholdLimit <= 50 && finalRiskScore > thresholdLimit;

  if (threatExceedsThreshold || floorExceedsRestrictedThreshold) {
    combinedReasons.push(
      `[RBAC Threshold Exceeded] Evaluated risk score (${finalRiskScore}/100) strictly exceeds agent maximum allowed threshold (${thresholdLimit}/100).`
    );
  }

  if (combinedReasons.length === 0) {
    combinedReasons.push('All 3 security layers verified clean (0)');
  }

  // Decision Logic:
  // - If malicious attacks, integrity violations, prompt injections, or risk exceeding threshold -> BLOCK
  // - If policy floor >= 70 or review required -> REVIEW (human authorization gate)
  // - Otherwise -> ALLOW
  let decision: ShieldDecision = 'ALLOW';

  const isMaliciousAttack =
    hasMaliciousThreats ||
    heuristicDecision === 'BLOCK' ||
    Boolean(judgeFactors?.destructiveIntent) ||
    Boolean(judgeFactors?.dataExfiltration) ||
    Boolean(judgeFactors?.privilegeEscalation) ||
    judgeScore >= 75 ||
    heuristicScore >= 75;

  if (threatExceedsThreshold || floorExceedsRestrictedThreshold || isMaliciousAttack) {
    decision = 'BLOCK';
  } else if (policyFloor >= 70 || heuristicDecision === 'REVIEW' || finalRiskScore >= 40) {
    decision = 'REVIEW';
  } else {
    decision = 'ALLOW';
  }

  return {
    finalRiskScore,
    riskLevel,
    decision,
    reasons: combinedReasons,
    policyFloor,
    judgeScore,
    heuristicScore,
  };
}
