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
    score += 30;
    reasons.push('Credential harvesting / secret exposure intent (+30)');
  }

  if (factors.exfiltrationDetected) {
    score += 25;
    reasons.push('External network exfiltration instruction (+25)');
  }

  if (factors.dangerousParametersDetected) {
    score += 25;
    reasons.push('Dangerous path traversal or injection in parameters (+25)');
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

  // Hard blocking conditions
  if (
    factors.unregisteredTool ||
    factors.credentialStealingDetected ||
    factors.unauthorizedTool ||
    (factors.fingerprintMismatch && factors.suspiciousInstructionDetected) ||
    finalScore >= (factors.agentMaxThreshold || 60)
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
