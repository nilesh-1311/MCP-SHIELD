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
  private documents: Record<string, string> = { ...LOCAL_DEMO_DOCUMENTS };
  private serverExecutionCounter = 0;
  private serverExecutedLog: Array<{ toolName: string; params: any; timestamp: string }> = [];

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
        const filePath = parameters.filePath || '/reports/sales.txt';
        const doc = this.documents[filePath];
        if (!doc) {
          const matchedKey = Object.keys(this.documents).find((k) => k.endsWith(filePath) || filePath.endsWith(k));
          if (matchedKey) {
            return {
              status: 'success',
              filePath: matchedKey,
              content: this.documents[matchedKey],
              bytesRead: this.documents[matchedKey].length,
              serverExecutionIndex: this.serverExecutionCounter,
            };
          }
          return {
            status: 'error',
            message: `File not found in approved project directory: '${filePath}'. Available: ${Object.keys(this.documents).join(', ')}`,
          };
        }
        return {
          status: 'success',
          filePath,
          content: doc,
          bytesRead: doc.length,
          serverExecutionIndex: this.serverExecutionCounter,
        };
      }

      case 'report_generator': {
        const title = parameters.title || 'Executive Security Overview';
        const format = parameters.format || 'summary';
        return {
          status: 'success',
          reportId: `REP-${Math.floor(1000 + Math.random() * 9000)}`,
          title,
          format,
          generatedAt: new Date().toISOString(),
          summary: `Generated high-fidelity ${format} report for "${title}". All metrics conform to corporate baseline compliance.`,
          sections: [
            { heading: 'Executive Summary', content: 'Operational metrics within normal parameters.' },
            { heading: 'MCP Shield Health', content: 'Runtime verification active with zero unhandled integrity faults.' },
          ],
          serverExecutionIndex: this.serverExecutionCounter,
        };
      }

      case 'search_tool': {
        const query = (parameters.query || '').toLowerCase();
        const limit = parameters.limit || 5;

        const results = Object.entries(this.documents)
          .filter(([path, content]) => path.toLowerCase().includes(query) || content.toLowerCase().includes(query))
          .slice(0, limit)
          .map(([path, content]) => ({
            filePath: path,
            snippet: content.slice(0, 120) + '...',
            score: 0.94,
          }));

        return {
          status: 'success',
          query,
          matchCount: results.length,
          results: results.length > 0 ? results : [{ message: 'No exact matches found in local knowledge base.' }],
          serverExecutionIndex: this.serverExecutionCounter,
        };
      }

      case 'email_sender': {
        const { recipient, subject, body } = parameters;
        return {
          status: 'success',
          simulated: true,
          messageId: `SIM-MSG-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
          recipient,
          subject,
          dispatchedAt: new Date().toISOString(),
          notice: 'Safe mock email dispatch complete. No real network transmission occurred.',
          serverExecutionIndex: this.serverExecutionCounter,
        };
      }

      default:
        throw new Error(`MCP Tool '${toolName}' not found or implemented on local MCP Server.`);
    }
  }
}

export const localMcpServer = new LocalMCPServer();
