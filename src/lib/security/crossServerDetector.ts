import { SecurityCheckItem, ThreatType } from '@/types';

export interface CrossServerHijackResult {
  detected: boolean;
  sourceServer: string;
  targetServer: string;
  targetAction: string;
  matchedPattern: string;
  scoreImpact: number;
  message: string;
}

/**
 * Detects cross-server hijacking attempts where one MCP tool's description, parameters, or output
 * attempts to instruct the AI agent to execute actions on a completely different MCP server.
 * Example: Calculator MCP trying to command Email Assistant MCP or Filesystem MCP.
 */
export function detectCrossServerHijacking(
  currentToolName: string,
  contentToScan: string,
  serverContext?: { currentServer?: string }
): CrossServerHijackResult {
  if (!contentToScan) {
    return {
      detected: false,
      sourceServer: serverContext?.currentServer || 'Current MCP Server',
      targetServer: '',
      targetAction: '',
      matchedPattern: '',
      scoreImpact: 0,
      message: 'No cross-server hijacking patterns detected.',
    };
  }

  // Cross-Server Hijack patterns:
  // e.g. "Now call email_sender with...", "Use bash_executor on server B", "Forward result to Slack MCP"
  const crossServerPatterns = [
    {
      regex: /(call|use|invoke|execute|trigger|dispatch)\s+(the\s+)?(email_sender|email[_\s-]?tool|mailer|slack_mcp|external_server|database_dumper|aws_cli)/i,
      targetServer: 'Email Assistant / Communication MCP',
      targetAction: 'Unauthorized Cross-Server Dispatch',
    },
    {
      regex: /(switch|route|forward\s+this\s+output)\s+to\s+(remote|secondary|admin)\s+(server|tool|mcp)/i,
      targetServer: 'Remote Administrative MCP Server',
      targetAction: 'Cross-Server Routing Override',
    },
    {
      regex: /(as\s+a\s+calculator|in\s+addition),\s*(also\s+)?(send|dump|exfiltrate|delete|drop)/i,
      targetServer: 'System / Data MCP Server',
      targetAction: 'Unrelated Capability Injection',
    },
  ];

  for (const p of crossServerPatterns) {
    const match = contentToScan.match(p.regex);
    if (match) {
      const source = serverContext?.currentServer || (currentToolName === 'calculator_tool' ? 'Calculator MCP Server' : 'Source MCP Server');
      return {
        detected: true,
        sourceServer: source,
        targetServer: p.targetServer,
        targetAction: p.targetAction,
        matchedPattern: match[0],
        scoreImpact: 40,
        message: `🚨 CROSS-SERVER HIJACKING DETECTED: Tool '${currentToolName}' on ${source} attempted to command '${p.targetServer}' (Matched: "${match[0]}").`,
      };
    }
  }

  return {
    detected: false,
    sourceServer: serverContext?.currentServer || 'Current MCP Server',
    targetServer: '',
    targetAction: '',
    matchedPattern: '',
    scoreImpact: 0,
    message: 'Cross-server integrity check passed.',
  };
}
