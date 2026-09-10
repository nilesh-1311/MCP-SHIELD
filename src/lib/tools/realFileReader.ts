import fs from 'fs';
import path from 'path';

export const SANDBOX_DIR = path.join(process.cwd(), 'sandbox-files');

/**
 * Ensures sandbox files directory exists with baseline demo files
 */
export function ensureSandboxFiles() {
  if (!fs.existsSync(SANDBOX_DIR)) {
    fs.mkdirSync(SANDBOX_DIR, { recursive: true });
  }

  const defaultFiles: Record<string, string> = {
    'sales_q3.txt': `=====================================================
  ENTERPRISE Q3 FINANCIAL PERFORMANCE REPORT
=====================================================
Total Revenue: $4,850,000 USD
Year-over-Year Growth: +23.4%
Leading Product Line: Cloud AI & MCP Security Gateway
Regional Revenue Distribution:
  - North America: $2,182,500 (45%)
  - Europe / EMEA: $1,697,500 (35%)
  - Asia-Pacific:  $970,000 (20%)

Compliance Clearance: Approved by Corporate Audit Committee.
Generated: 2026-09-10`,

    'security_policy.md': `# Enterprise AI & MCP Tool Policy 2026

1. **Zero-Trust Baseline**: All MCP tools must present a cryptographic SHA-256 fingerprint verified against the SecOps baseline.
2. **Access Control**: Agents must only execute tools authorized for their explicit role profile.
3. **No Exfiltration**: Transmissions to unvetted external hosts are strictly intercepted and dropped.
4. **Approval Required**: Sensitive operations (e.g. Email Dispatch, Permission Escalation) require human sign-off.`,

    'project_alpha.json': JSON.stringify(
      {
        project: 'Project Alpha - Autonomous Agent Fleet',
        version: '2.4.0',
        environment: 'production',
        agents: ['ResearchAgent', 'AdminAgent', 'CustomerSupportAgent'],
        mcpGateway: 'MCP Shield v1.0.0',
        securityLevel: 'STRICT_ENFORCEMENT',
      },
      null,
      2
    ),

    'audit_report.txt': `MCP SECURITY AUDIT — ACTIVE STATUS
- Active Registered Tools: 4
- Baseline Integrity Status: VERIFIED_OFFICIAL
- Unhandled Vulnerabilities: 0
- Real-Time Enforcement: ACTIVE`,
  };

  for (const [filename, content] of Object.entries(defaultFiles)) {
    const filePath = path.join(SANDBOX_DIR, filename);
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, content, 'utf8');
    }
  }
}

/**
 * Safely reads a file strictly scoped inside SANDBOX_DIR
 */
export function readSandboxFile(requestedPath: string): {
  success: boolean;
  filePath: string;
  content?: string;
  bytesRead?: number;
  error?: string;
} {
  ensureSandboxFiles();

  // Normalize requested filename / path
  let cleanName = requestedPath.replace(/^[\/\\]+/, '');
  if (cleanName.startsWith('reports/') || cleanName.startsWith('docs/') || cleanName.startsWith('config/')) {
    cleanName = path.basename(cleanName);
  }

  // Security Traversal check
  if (requestedPath.includes('..') || cleanName.includes('..')) {
    return {
      success: false,
      filePath: requestedPath,
      error: `Access Denied: Path traversal detected outside sandbox scope ('${requestedPath}').`,
    };
  }

  const targetPath = path.join(SANDBOX_DIR, cleanName);

  // Ensure resolved path is strictly inside SANDBOX_DIR
  const relative = path.relative(SANDBOX_DIR, targetPath);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    return {
      success: false,
      filePath: requestedPath,
      error: `Access Denied: Requested path escapes allowed sandbox folder.`,
    };
  }

  if (!fs.existsSync(targetPath)) {
    const available = fs.readdirSync(SANDBOX_DIR);
    return {
      success: false,
      filePath: requestedPath,
      error: `File not found in sandbox directory: '${cleanName}'. Available files: ${available.join(', ')}`,
    };
  }

  try {
    const content = fs.readFileSync(targetPath, 'utf8');
    return {
      success: true,
      filePath: `/sandbox-files/${cleanName}`,
      content,
      bytesRead: Buffer.byteLength(content, 'utf8'),
    };
  } catch (err: any) {
    return {
      success: false,
      filePath: requestedPath,
      error: `Failed to read file: ${err.message}`,
    };
  }
}
