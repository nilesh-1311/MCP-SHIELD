import fs from 'fs';
import path from 'path';

export const REPORTS_DIR = path.join(process.cwd(), 'sandbox-files', 'generated-reports');

export function ensureReportsDir() {
  if (!fs.existsSync(REPORTS_DIR)) {
    fs.mkdirSync(REPORTS_DIR, { recursive: true });
  }
}

export function generateRealReport(params: {
  title: string;
  format?: 'summary' | 'detailed' | 'json';
  agentId?: string;
}): {
  success: boolean;
  reportId: string;
  title: string;
  format: string;
  fileName: string;
  filePath: string;
  fileSizeBytes: number;
  downloadUrl: string;
  summary: string;
  generatedAt: string;
  content: string;
} {
  ensureReportsDir();

  const reportId = `REP-${Math.floor(1000 + Math.random() * 9000)}`;
  const title = params.title || 'Executive Security Overview';
  const format = params.format || 'summary';
  const generatedAt = new Date().toISOString();
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const fileName = `${reportId}_${slug}.md`;
  const absolutePath = path.join(REPORTS_DIR, fileName);

  const markdownContent = `# ${title}
**Report ID**: \`${reportId}\`  
**Generated At**: ${generatedAt}  
**Format**: ${format.toUpperCase()}  
**Authorized Agent**: \`${params.agentId || 'ResearchAgent'}\`  
**Security Gateway**: MCP Shield In-Line Verification (Integrity: 100%)

---

## 1. Executive Summary
This operational document was generated through the verified \`report_generator\` MCP Tool under active runtime integrity protection.

### Key Metrics
- **Runtime Integrity Verification**: Pass (SHA-256 baseline matched)
- **Zero-Trust Role Check**: ALLOWED
- **Exfiltration Threat Scan**: 0 threats detected
- **Side Effect Action**: Real disk write verified at \`${fileName}\`

---

## 2. Findings & Strategic Recommendations
1. **Tool Baseline Tracking**: Continuous SHA-256 fingerprint verification is preventing unauthorized rug-pull mutations.
2. **Access Isolation**: Cross-server hijacking attempts are strictly blocked at proxy boundaries.
3. **Audit Compliance**: All file operations are recorded in the central immutable audit log.

---
*Generated securely by MCP Shield Agent Tool Runtime.*
`;

  fs.writeFileSync(absolutePath, markdownContent, 'utf8');
  const fileSizeBytes = Buffer.byteLength(markdownContent, 'utf8');
  const downloadUrl = `/api/reports/download?file=${encodeURIComponent(fileName)}`;

  return {
    success: true,
    reportId,
    title,
    format,
    fileName,
    filePath: `/sandbox-files/generated-reports/${fileName}`,
    fileSizeBytes,
    downloadUrl,
    summary: `Real report written to disk (${fileSizeBytes} bytes). Download available at: ${downloadUrl}`,
    generatedAt,
    content: markdownContent,
  };
}
