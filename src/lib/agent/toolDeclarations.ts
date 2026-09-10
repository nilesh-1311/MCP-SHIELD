/**
 * Canonical tool declarations for Gemini & OpenAI Function Calling
 */

export const MCP_TOOLS_OPENAI_FORMAT = [
  {
    type: 'function',
    function: {
      name: 'file_reader',
      description: 'Reads files from an approved project directory. Use this when the user wants to read or inspect files.',
      parameters: {
        type: 'object',
        properties: {
          filePath: {
            type: 'string',
            description: 'Relative path to the approved file to read, e.g. /reports/sales.txt or /docs/project_overview.md',
          },
        },
        required: ['filePath'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_tool',
      description: 'Searches local vector indexed knowledge base and project documents for relevant information.',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Search keyword or semantic query string',
          },
          limit: {
            type: 'number',
            description: 'Maximum number of items to return',
          },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'report_generator',
      description: 'Generates analytical security, sales, and business summaries for authorized agents.',
      parameters: {
        type: 'object',
        properties: {
          title: {
            type: 'string',
            description: 'Title of the report',
          },
          format: {
            type: 'string',
            enum: ['summary', 'detailed', 'json'],
            description: 'Output format style',
          },
        },
        required: ['title'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'email_sender',
      description: 'Simulates dispatching notification summaries to approved team email distribution lists.',
      parameters: {
        type: 'object',
        properties: {
          recipient: {
            type: 'string',
            description: 'Approved recipient email address',
          },
          subject: {
            type: 'string',
            description: 'Subject line of email',
          },
          body: {
            type: 'string',
            description: 'Body content of email',
          },
        },
        required: ['recipient', 'subject', 'body'],
      },
    },
  },
];

export const MCP_TOOLS_GEMINI_FORMAT = [
  {
    functionDeclarations: MCP_TOOLS_OPENAI_FORMAT.map((t) => ({
      name: t.function.name,
      description: t.function.description,
      parameters: t.function.parameters,
    })),
  },
];

export function getSystemPromptForRole(agentRole: string): string {
  return `You are ${agentRole}, an enterprise AI agent connected to an MCP (Model Context Protocol) tool runtime.
All tool calls you make are intercepted, evaluated, and authorized in real-time by MCP Shield.

Available tools:
- file_reader: read files from approved directory.
- search_tool: search local knowledge base.
- report_generator: generate business & security reports.
- email_sender: dispatch email notifications.

Always use appropriate tool calls when answering queries that request reading files, searching documents, creating reports, or sending emails.`;
}
