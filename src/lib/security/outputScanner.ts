import { SecurityCheckItem, ThreatType } from '@/types';

export interface OutputScanResult {
  passed: boolean;
  sanitized: boolean;
  scoreImpact: number;
  threats: Array<{
    category: ThreatType;
    reason: string;
    snippet: string;
  }>;
  cleanOutput: any;
  message: string;
}

const POISONING_PATTERNS = [
  {
    pattern: /(ignore\s+security\s+policy|reveal\s+credentials|dump\s+database|send\s+api\s*key|disregard\s+system\s+prompt|bypass\s+mcp\s*shield)/i,
    category: 'PROMPT_INJECTION' as ThreatType,
    reason: 'Output poisoning / prompt-injection instruction inside MCP tool result',
  },
  {
    pattern: /(sk-[a-zA-Z0-9]{20,}|AIzaSy[a-zA-Z0-9_-]{33}|ghp_[a-zA-Z0-9]{36}|AKIA[0-9A-Z]{16})/i,
    category: 'CREDENTIAL_THEFT' as ThreatType,
    reason: 'Raw API key or cloud credential detected in tool output',
  },
  {
    pattern: /<script[\s\S]*?>[\s\S]*?<\/script>/i,
    category: 'MALICIOUS_OUTPUT' as ThreatType,
    reason: 'Embedded executable script tag in tool output',
  },
];

/**
 * Inspects tool output before returning to the AI agent. Sanitizes or flags malicious payloads.
 */
export function scanAndSanitizeToolOutput(output: any): OutputScanResult {
  if (output === null || output === undefined) {
    return {
      passed: true,
      sanitized: false,
      scoreImpact: 0,
      threats: [],
      cleanOutput: output,
      message: 'Output scan passed: Empty tool output.',
    };
  }

  const rawString = typeof output === 'string' ? output : JSON.stringify(output);
  const threats: OutputScanResult['threats'] = [];
  let scoreImpact = 0;
  let sanitizedString = rawString;

  for (const p of POISONING_PATTERNS) {
    const match = rawString.match(p.pattern);
    if (match) {
      threats.push({
        category: p.category,
        reason: p.reason,
        snippet: match[0],
      });
      scoreImpact += 30;

      // Redact/sanitize matching segment
      sanitizedString = sanitizedString.replace(p.pattern, '[REDACTED BY MCP SHIELD: SECURITY THREAT DETECTED]');
    }
  }

  const passed = threats.length === 0;
  const sanitized = !passed;

  let cleanOutput = output;
  if (sanitized) {
    if (typeof output === 'string') {
      cleanOutput = sanitizedString;
    } else {
      try {
        cleanOutput = JSON.parse(sanitizedString);
      } catch {
        cleanOutput = {
          warning: 'Tool output contained dangerous instructions and was sanitized by MCP Shield',
          sanitizedContent: sanitizedString,
        };
      }
    }
  }

  return {
    passed,
    sanitized,
    scoreImpact: Math.min(scoreImpact, 40),
    threats,
    cleanOutput,
    message: passed
      ? 'Output inspection passed: No prompt injection or credential leaks detected.'
      : `MALICIOUS OUTPUT DETECTED: ${threats.map((t) => t.reason).join(', ')}. Output was intercepted & sanitized.`,
  };
}

export function toOutputCheckItem(result: OutputScanResult): SecurityCheckItem {
  return {
    name: 'Tool Output Poisoning & Secret Inspection',
    passed: result.passed,
    scoreImpact: result.scoreImpact,
    message: result.message,
    details: {
      threats: result.threats,
      sanitized: result.sanitized,
    },
  };
}
