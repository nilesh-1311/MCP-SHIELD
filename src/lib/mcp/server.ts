import { readSandboxFile, ensureSandboxFiles } from '../tools/realFileReader';
import { generateRealReport } from '../tools/realReportGenerator';
import { sendRealEmail } from '../tools/realEmailSender';

export interface LocalDocument {
  path: string;
  name: string;
  content: string;
}

export const LOCAL_DEMO_DOCUMENTS: Record<string, string> = {
  '/reports/sales.txt': 'Q3 Sales Performance Summary:\nTotal Revenue: $4,850,000\nGrowth: +23.4% YoY\nTop Category: Cloud Enterprise Security Suite\nRegional Breakdown: NA (45%), EMEA (35%), APAC (20%)\nStatus: Approved by Finance',
  '/reports/quarterly_audit.md': '# Security Audit Q3\n- Multi-factor authentication compliance: 100%\n- MCP Tool Integrity Check Status: All signatures verified\n- Zero unauthorized tool mutations detected in production pipelines\n- Recommended action: Continue automated fingerprint tracking.',
  '/docs/project_overview.md': '# Project Alpha Architecture\nMicroservice topology with automated MCP runtime isolation.\nSecurity boundaries strictly enforced on all AI Agent tool dispatchers.',
  '/config/app_policy.txt': 'Enterprise Security Policy 2026.4\n1. AI Agents must strictly execute verified tools.\n2. Fingerprint deviations require SecOps human approval.\n3. Output inspection is mandatory for all untrusted transports.',
};

export class LocalMCPServer {
  private serverExecutionCounter = 0;
  private serverExecutedLog: Array<{ toolName: string; params: any; timestamp: string }> = [];

  constructor() {
    ensureSandboxFiles();
  }

  public getServerExecutionCount(): number {
    return this.serverExecutionCounter;
  }

  public getServerExecutedLog() {
    return [...this.serverExecutedLog];
  }

  public resetServerMetrics() {
    this.serverExecutionCounter = 0;
    this.serverExecutedLog = [];
  }

  /**
   * Executes a tool with provided parameters.
   * NOTE: In a secure MCP architecture, this is ONLY called after MCP Shield allows it.
   */
  async executeTool(toolName: string, parameters: Record<string, any>): Promise<any> {
    // REAL EXECUTION COUNTER: Increments ONLY when called by Shield ALLOW
    this.serverExecutionCounter++;
    this.serverExecutedLog.unshift({
      toolName,
      params: parameters,
      timestamp: new Date().toISOString(),
    });

    const normalizedName = toolName.toLowerCase();

    switch (normalizedName) {
      case 'file_reader': {
        const filePath = parameters.filePath || parameters.path || parameters.filename || parameters.file || 'sales_q3.txt';
        const fileResult = readSandboxFile(filePath);

        if (!fileResult.success) {
          // Check fallback demo docs
          if (LOCAL_DEMO_DOCUMENTS[filePath]) {
            return {
              status: 'success',
              filePath,
              content: LOCAL_DEMO_DOCUMENTS[filePath],
              bytesRead: Buffer.byteLength(LOCAL_DEMO_DOCUMENTS[filePath], 'utf8'),
              serverExecutionIndex: this.serverExecutionCounter,
              sandboxScope: 'scoped_verified',
            };
          }
          return {
            status: 'error',
            error: fileResult.error || `File access error for '${filePath}'`,
            serverExecutionIndex: this.serverExecutionCounter,
          };
        }

        return {
          status: 'success',
          filePath: fileResult.filePath,
          content: fileResult.content,
          bytesRead: fileResult.bytesRead,
          serverExecutionIndex: this.serverExecutionCounter,
          sandboxScope: 'scoped_verified',
        };
      }

      case 'report_generator': {
        const title = parameters.title || 'Executive Security Overview';
        const format = parameters.format || 'summary';
        const agentId = parameters.agentId || 'ResearchAgent';

        const reportResult = generateRealReport({
          title,
          format,
          agentId,
        });

        return {
          status: 'success',
          reportId: reportResult.reportId,
          title: reportResult.title,
          format: reportResult.format,
          fileName: reportResult.fileName,
          filePath: reportResult.filePath,
          fileSizeBytes: reportResult.fileSizeBytes,
          downloadUrl: reportResult.downloadUrl,
          generatedAt: reportResult.generatedAt,
          summary: reportResult.summary,
          contentPreview: reportResult.content.slice(0, 300) + '...',
          serverExecutionIndex: this.serverExecutionCounter,
        };
      }

      case 'search_tool': {
        const query = (parameters.query || '').toLowerCase();
        const limit = parameters.limit || 5;

        const results = Object.entries(LOCAL_DEMO_DOCUMENTS)
          .filter(([path, content]) => path.toLowerCase().includes(query) || content.toLowerCase().includes(query))
          .slice(0, limit)
          .map(([path, content]) => ({
            filePath: path,
            snippet: content.slice(0, 140) + '...',
            score: 0.96,
          }));

        return {
          status: 'success',
          query,
          matchCount: results.length,
          results: results.length > 0 ? results : [{ message: `No matching items found for '${query}'.` }],
          serverExecutionIndex: this.serverExecutionCounter,
        };
      }

      case 'email_sender': {
        const { recipient, subject, body, agentId } = parameters;
        const emailResult = await sendRealEmail({
          recipient: recipient || 'team@enterprise.internal',
          subject: subject || 'AI Agent Notification',
          body: body || 'Automated MCP Shield verified digest',
          agentId,
        });

        return {
          ...emailResult,
          serverExecutionIndex: this.serverExecutionCounter,
        };
      }

      default:
        throw new Error(`MCP Tool '${toolName}' not found or implemented on local MCP Server.`);
    }
  }
}

export const localMcpServer = new LocalMCPServer();
