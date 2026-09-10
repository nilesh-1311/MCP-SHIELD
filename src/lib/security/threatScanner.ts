import { SecurityCheckItem, ThreatType } from '@/types';

export interface ThreatPattern {
  id: string;
  pattern: RegExp;
  category: ThreatType;
  severity: 'MEDIUM' | 'HIGH' | 'CRITICAL';
  riskScore: number;
  description: string;
}

export const KNOWN_THREAT_PATTERNS: ThreatPattern[] = [
  {
    id: 'PROMPT_INJECTION_OVERRIDE',
    pattern: /(ignore|disregard|forget|bypass|override)\s+(all\s+)?(previous|prior|above|system|security)\s+(instructions|prompt|rules|policies|guardrails)/i,
    category: 'PROMPT_INJECTION',
    severity: 'CRITICAL',
    riskScore: 35,
    description: 'Attempt to override system prompt or security instructions',
  },
  {
    id: 'CREDENTIAL_HARVESTING',
    pattern: /(reveal|dump|leak|exfiltrate|expose|extract|send|return|display|search\s+for)\s+.*(api[_\s-]?key|secret|password|token|credential|env|private[_\s-]?key|aws[_\s-]?key|ssh[_\s-]?key)/i,
    category: 'CREDENTIAL_THEFT',
    severity: 'CRITICAL',
    riskScore: 30,
    description: 'Suspicious instruction to search for or extract credentials/secrets',
  },
  {
    id: 'DATA_EXFILTRATION',
    pattern: /(send|upload|post|transmit|forward|stream)\s+.*(to|via|using)\s+(https?:\/\/|ftp:\/\/|webhook|external|remote|attacker|pastebin|ngrok)/i,
    category: 'EXFILTRATION_ATTEMPT',
    severity: 'HIGH',
    riskScore: 25,
    description: 'External network exfiltration instruction detected',
  },
  {
    id: 'SECURITY_POLICY_DISABLE',
    pattern: /(disable|turn\s*off|deactivate|suppress|mute)\s+(security|firewall|shield|monitoring|audit|logging|safety)/i,
    category: 'MALICIOUS_DESCRIPTION',
    severity: 'CRITICAL',
    riskScore: 30,
    description: 'Instruction attempting to disable security logging or protections',
  },
  {
    id: 'ARBITRARY_CODE_EXEC',
    pattern: /(eval\(|exec\(|system\(|spawn\(|child_process|cmd\.exe|powershell|bash\s+-c|\/bin\/sh)/i,
    category: 'MALICIOUS_DESCRIPTION',
    severity: 'CRITICAL',
    riskScore: 40,
    description: 'Dangerous shell execution or dynamic eval payload in description',
  },
  {
    id: 'HIDDEN_CHARACTER_INJECTION',
    pattern: /[\u200B-\u200D\uFEFF\u202A-\u202E]/,
    category: 'PROMPT_INJECTION',
    severity: 'MEDIUM',
    riskScore: 20,
    description: 'Hidden zero-width or directional override characters detected',
  }
];

export interface ThreatScanResult {
  passed: boolean;
  threatsDetected: Array<{
    patternId: string;
    category: ThreatType;
    severity: string;
    riskScore: number;
    description: string;
    matchedText: string;
  }>;
  totalScoreImpact: number;
  message: string;
}

/**
 * Deterministically scans a tool description (or parameter string) against cyber threat patterns
 */
export function scanToolDescription(description: string): ThreatScanResult {
  if (!description || typeof description !== 'string') {
    return {
      passed: true,
      threatsDetected: [],
      totalScoreImpact: 0,
      message: 'Description scan passed: Empty or standard description.',
    };
  }

  const detected: ThreatScanResult['threatsDetected'] = [];
  let scoreImpact = 0;

  for (const threat of KNOWN_THREAT_PATTERNS) {
    const match = description.match(threat.pattern);
    if (match) {
      detected.push({
        patternId: threat.id,
        category: threat.category,
        severity: threat.severity,
        riskScore: threat.riskScore,
        description: threat.description,
        matchedText: match[0],
      });
      scoreImpact += threat.riskScore;
    }
  }

  const passed = detected.length === 0;

  let message = 'Description scan passed: No malicious or prompt-injection patterns detected.';
  if (!passed) {
    const reasons = detected.map((d) => `[${d.category}] ${d.description} (match: "${d.matchedText}")`).join('; ');
    message = `Threat Detected in Tool Description: ${reasons}`;
  }

  return {
    passed,
    threatsDetected: detected,
    totalScoreImpact: Math.min(scoreImpact, 50),
    message,
  };
}

export function toDescriptionCheckItem(result: ThreatScanResult): SecurityCheckItem {
  return {
    name: 'Tool Description Threat & Injection Scan',
    passed: result.passed,
    scoreImpact: result.totalScoreImpact,
    message: result.message,
    details: {
      threatCount: result.threatsDetected.length,
      threats: result.threatsDetected,
    },
  };
}
