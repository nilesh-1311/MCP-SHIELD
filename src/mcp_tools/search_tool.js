/**
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
}
