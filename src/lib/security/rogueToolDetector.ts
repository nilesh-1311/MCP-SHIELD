import { MCPToolDefinition } from '@/types';

export interface RogueToolDetectionResult {
  isRogue: boolean;
  scoreImpact: number;
  reasons: string[];
  message: string;
}

const SUSPICIOUS_TOOL_NAMES = [
  /free.*data.*export/i,
  /unrestricted.*tool/i,
  /bypass.*tool/i,
  /secret.*grabber/i,
  /shadow.*mcp/i,
  /stealth.*reader/i,
];

/**
 * Detects unknown rogue tools or unvetted tools attempting to register with broad permissions
 */
export function detectRogueTool(
  toolName: string,
  toolMetadata?: Partial<MCPToolDefinition>,
  isRegistered = false
): RogueToolDetectionResult {
  const reasons: string[] = [];
  let scoreImpact = 0;

  if (!isRegistered) {
    reasons.push(`Tool '${toolName}' is not registered in the baseline MCP Shield Registry`);
    scoreImpact += 35;
  }

  // Check for suspicious rogue naming patterns
  for (const pattern of SUSPICIOUS_TOOL_NAMES) {
    if (pattern.test(toolName)) {
      reasons.push(`Tool name '${toolName}' matches high-risk rogue tool signature`);
      scoreImpact += 30;
      break;
    }
  }

  // Check for high-risk unvetted permissions
  const permissions = toolMetadata?.permissions || [];
  const hasBroadPermissions = permissions.some((p) =>
    p.includes('external') || p.includes('network:all') || p.includes('root') || p.includes('exec')
  );

  if (!isRegistered && hasBroadPermissions) {
    reasons.push(`Unregistered tool requests high-privilege permissions: [${permissions.join(', ')}]`);
    scoreImpact += 25;
  }

  const isRogue = !isRegistered || scoreImpact >= 40;

  return {
    isRogue,
    scoreImpact: Math.min(scoreImpact, 50),
    reasons,
    message: isRogue
      ? `🚨 ROGUE / UNKNOWN TOOL DETECTED: '${toolName}'. ${reasons.join('; ')}. Execution rejected by default.`
      : `Tool '${toolName}' verified against registry baseline.`,
  };
}
