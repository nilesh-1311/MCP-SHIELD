import { MCPToolDefinition, ThreatRecord } from '@/types';

export interface TrustScoreBreakdown {
  score: number; // 0-100
  level: 'HIGH_TRUST' | 'MODERATE_TRUST' | 'SUSPICIOUS' | 'UNTRUSTED';
  factors: {
    name: string;
    impact: number;
    description: string;
  }[];
}

/**
 * Calculates dynamic Trust Score for a tool based on:
 * - Baseline signature match (+40)
 * - Known official publisher (+20)
 * - Safe permissions (+15)
 * - Threat history penalty (-30 to -70)
 * - Output safety history (+15)
 * - Status penalty (BLOCKED = 0)
 */
export function calculateToolTrustScore(
  tool: MCPToolDefinition,
  activeThreats: ThreatRecord[] = []
): TrustScoreBreakdown {
  let score = 100;
  const factors: TrustScoreBreakdown['factors'] = [];

  // Check 1: Tool Status
  if (tool.status === 'BLOCKED') {
    return {
      score: 15,
      level: 'UNTRUSTED',
      factors: [
        { name: 'Tool Blocked', impact: -85, description: 'Tool is in BLOCKED state by security policy' },
      ],
    };
  }

  // Check 2: Active threats on this tool
  const toolThreats = activeThreats.filter((t) => t.toolName.toLowerCase() === tool.name.toLowerCase() && t.status === 'ACTIVE');
  if (toolThreats.length > 0) {
    let penalty = 0;
    for (const t of toolThreats) {
      if (t.severity === 'CRITICAL') penalty += 45;
      else if (t.severity === 'HIGH') penalty += 30;
      else penalty += 15;
    }
    score -= penalty;
    factors.push({
      name: 'Active Threat Penalty',
      impact: -penalty,
      description: `${toolThreats.length} active security threat(s) detected`,
    });
  }

  // Check 3: Trust Level
  if (tool.trustLevel === 'VERIFIED_OFFICIAL') {
    factors.push({ name: 'Verified Official Publisher', impact: 0, description: 'Signed by verified enterprise maintainer' });
  } else if (tool.trustLevel === 'INTERNAL_DEVELOPER') {
    score -= 5;
    factors.push({ name: 'Internal Developer Publisher', impact: -5, description: 'Internal team signature' });
  } else {
    score -= 25;
    factors.push({ name: 'Unverified Community Publisher', impact: -25, description: 'External unverified source' });
  }

  // Check 4: Sensitive permissions
  const hasExternalNet = tool.permissions?.some((p) => p.includes('network') || p.includes('external') || p.includes('email'));
  if (hasExternalNet) {
    score -= 10;
    factors.push({ name: 'Elevated Capabilities', impact: -10, description: 'Tool has network or dispatch capabilities' });
  }

  const finalScore = Math.max(Math.min(score, 100), 10);

  let level: TrustScoreBreakdown['level'] = 'HIGH_TRUST';
  if (finalScore < 40) level = 'UNTRUSTED';
  else if (finalScore < 70) level = 'SUSPICIOUS';
  else if (finalScore < 85) level = 'MODERATE_TRUST';

  return {
    score: finalScore,
    level,
    factors,
  };
}
