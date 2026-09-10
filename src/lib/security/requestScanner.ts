import { SecurityCheckItem, ThreatType } from '@/types';

export interface RequestScanResult {
  passed: boolean;
  scoreImpact: number;
  threats: Array<{
    category: ThreatType;
    parameter: string;
    reason: string;
  }>;
  message: string;
}

/**
 * Scans incoming execution parameters for path traversal, injection payloads, or dangerous arguments
 */
export function scanToolRequestParameters(
  toolName: string,
  parameters: Record<string, any>
): RequestScanResult {
  const threats: RequestScanResult['threats'] = [];
  let scoreImpact = 0;

  for (const [key, value] of Object.entries(parameters || {})) {
    if (typeof value === 'string') {
      // Check 1: Directory traversal
      if (value.includes('../') || value.includes('..\\') || value.startsWith('/etc/') || value.includes('c:\\windows\\system32')) {
        threats.push({
          category: 'PATH_TRAVERSAL',
          parameter: key,
          reason: `Potential path traversal attempt detected in '${key}': "${value}"`,
        });
        scoreImpact += 30;
      }

      // Check 2: Prompt injection strings in arguments
      if (/(ignore\s+previous\s+instructions|system\s+prompt|reveal\s+credentials|dump\s+env)/i.test(value)) {
        threats.push({
          category: 'PROMPT_INJECTION',
          parameter: key,
          reason: `Prompt injection pattern detected inside parameter '${key}'`,
        });
        scoreImpact += 30;
      }

      // Check 3: Suspicious shell characters
      if (/[;&|`$]/.test(value) && !['report_generator', 'search_tool'].includes(toolName)) {
        threats.push({
          category: 'MALICIOUS_DESCRIPTION',
          parameter: key,
          reason: `Suspicious shell control character in parameter '${key}'`,
        });
        scoreImpact += 15;
      }
    }
  }

  const passed = threats.length === 0;

  return {
    passed,
    scoreImpact: Math.min(scoreImpact, 40),
    threats,
    message: passed
      ? 'Request parameters validated: No traversal or parameter injections detected.'
      : `Dangerous Request Parameters Detected: ${threats.map((t) => t.reason).join(', ')}`,
  };
}

export function toRequestCheckItem(result: RequestScanResult): SecurityCheckItem {
  return {
    name: 'Request Parameter & Intent Scan',
    passed: result.passed,
    scoreImpact: result.scoreImpact,
    message: result.message,
    details: {
      threats: result.threats,
    },
  };
}
