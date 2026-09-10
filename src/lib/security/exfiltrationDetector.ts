export interface ExfiltrationDetectionResult {
  detected: boolean;
  sensitivePatternsFound: Array<{
    category: string;
    matchedPattern: string;
    riskScore: number;
  }>;
  scoreImpact: number;
  message: string;
}

const SENSITIVE_DATA_PATTERNS = [
  { category: 'API_KEY', regex: /(api[_\s-]?key|apikey|bearer\s+[a-zA-Z0-9_\-\.]{20,}|sk-[a-zA-Z0-9]{20,}|AIzaSy[a-zA-Z0-9_-]{33})/i, score: 35 },
  { category: 'PASSWORD', regex: /(password\s*[:=]\s*['"][^'"]+['"]|passwd\s*[:=]\s*\S+)/i, score: 35 },
  { category: 'SECRET_OR_TOKEN', regex: /(secret[_\s-]?key|client[_\s-]?secret|auth[_\s-]?token|jwt[_\s-]?token)/i, score: 30 },
  { category: 'PRIVATE_KEY', regex: /(-----BEGIN\s+(RSA\s+)?PRIVATE\s+KEY-----|ssh-rsa\s+[A-Za-z0-9+/]+)/i, score: 40 },
  { category: 'CONFIDENTIAL_MARKER', regex: /(CONFIDENTIAL|TOP\s+SECRET|RESTRICTED_INTERNAL_DO_NOT_SHARE)/i, score: 25 },
  { category: 'EXTERNAL_EXFIL_ENDPOINT', regex: /(https?:\/\/(evil|attacker|exfil|pastebin|webhook\.site|ngrok\.io|requestbin))/i, score: 35 },
];

/**
 * Scans parameters or outputs for unauthorized sensitive data exfiltration
 */
export function detectDataExfiltration(payload: any): ExfiltrationDetectionResult {
  if (!payload) {
    return {
      detected: false,
      sensitivePatternsFound: [],
      scoreImpact: 0,
      message: 'No data exfiltration patterns detected.',
    };
  }

  const payloadStr = typeof payload === 'string' ? payload : JSON.stringify(payload);
  const found: ExfiltrationDetectionResult['sensitivePatternsFound'] = [];
  let scoreImpact = 0;

  for (const item of SENSITIVE_DATA_PATTERNS) {
    const match = payloadStr.match(item.regex);
    if (match) {
      found.push({
        category: item.category,
        matchedPattern: match[0],
        riskScore: item.score,
      });
      scoreImpact += item.score;
    }
  }

  if (found.length > 0) {
    return {
      detected: true,
      sensitivePatternsFound: found,
      scoreImpact: Math.min(scoreImpact, 50),
      message: `🚨 DATA EXFILTRATION DETECTED: Payload contains ${found.length} sensitive item(s): [${found.map((f) => f.category).join(', ')}]. Blocked before transfer.`,
    };
  }

  return {
    detected: false,
    sensitivePatternsFound: [],
    scoreImpact: 0,
    message: 'Data payload safe: No sensitive keys or exfiltration endpoints found.',
  };
}
