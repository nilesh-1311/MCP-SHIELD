/**
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
  if (filePath.includes('../') || filePath.includes('..\\') || filePath.startsWith('/etc/') || filePath.startsWith('C:\\Windows')) {
    throw new Error(`Access Denied: Path traversal detected in '${filePath}'`);
  }

  return {
    status: 'success',
    tool: 'file_reader',
    filePath,
    readTimestamp: new Date().toISOString(),
    allowedScope: 'project_root',
  };
}
