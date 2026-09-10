/**
 * Verified Baseline Tool Source Code Registry
 * Provides tool source code for runtime integrity verification and SHA-256 fingerprinting.
 * Safe for both Server and Client environments.
 */

export const MCP_TOOL_SOURCES: Record<string, string> = {
  file_reader: `/**
 * MCP Tool: file_reader
 * Version: 1.0.0
 * Purpose: Securely read approved files from project directory
 * Permissions: filesystem:read_approved
 */

export function executeFileReader(params, context) {
  const { filePath } = params || {};
  if (!filePath) {
    throw new Error("Missing required parameter: 'filePath'");
  }

  // Security Check: Path Traversal prevention baseline
  if (filePath.includes('../') || filePath.includes('..\\\\') || filePath.startsWith('/etc/') || filePath.startsWith('C:\\\\Windows')) {
    throw new Error(\`Access Denied: Path traversal detected in '\${filePath}'\`);
  }

  return {
    status: 'success',
    tool: 'file_reader',
    filePath,
    readTimestamp: new Date().toISOString(),
    allowedScope: 'project_root',
  };
}`,

  search_tool: `/**
 * MCP Tool: search_tool
 * Version: 1.0.0
 * Purpose: Searches local vector indexed knowledge base and project documents
 * Permissions: knowledge_base:read
 */

export function executeSearchTool(params, context) {
  const { query, limit = 5 } = params || {};
  if (!query) {
    throw new Error("Missing required parameter: 'query'");
  }

  return {
    status: 'success',
    tool: 'search_tool',
    query,
    limit,
    searchedAt: new Date().toISOString(),
    engine: 'local_vector_index',
  };
}`,

  report_generator: `/**
 * MCP Tool: report_generator
 * Version: 1.0.0
 * Purpose: Generates analytical security and business summaries for authorized agents
 * Permissions: analytics:read, reports:generate
 */

export function executeReportGenerator(params, context) {
  const { title, format = 'summary' } = params || {};
  if (!title) {
    throw new Error("Missing required parameter: 'title'");
  }

  return {
    status: 'success',
    tool: 'report_generator',
    title,
    format,
    generatedAt: new Date().toISOString(),
    complianceScore: 100,
  };
}`,

  email_sender: `/**
 * MCP Tool: email_sender
 * Version: 1.0.0
 * Purpose: Simulates dispatching notification summaries to approved team email distribution lists
 * Permissions: network:email_dispatch_sim
 */

export function executeEmailSender(params, context) {
  const { recipient, subject, body } = params || {};
  if (!recipient || !subject || !body) {
    throw new Error("Missing required parameters: 'recipient', 'subject', or 'body'");
  }

  return {
    status: 'success',
    tool: 'email_sender',
    recipient,
    subject,
    dispatchedAt: new Date().toISOString(),
    deliveryMode: 'internal_agent_notification',
  };
}`,
};

export function getToolSourceCode(toolName: string): string {
  const normalized = toolName.toLowerCase().trim();
  return MCP_TOOL_SOURCES[normalized] || '';
}
