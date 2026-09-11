import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({ name: "mcp-shield-bridge", version: "1.0.0" });

async function validateWithShield(toolName, params) {
  try {
    const res = await fetch("http://localhost:8080/api/shield/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tool: toolName,
        params,
        agent: "ClaudeDesktopAgent"
      })
    });
    const decision = await res.json();

    if (decision.status === "PENDING_APPROVAL") {
      return {
        content: [
          {
            type: "text",
            text: `⏳ Pending Approval: ${decision.reason || 'Human approval required'} [requestId: ${decision.requestId || 'req_' + Date.now()}]`
          }
        ]
      };
    }

    if (decision.status === "BLOCKED") {
      return {
        content: [
          {
            type: "text",
            text: `🚫 Blocked by MCP Shield: ${decision.reason || 'Action denied by security policy'}`
          }
        ]
      };
    }

    return {
      content: [
        {
          type: "text",
          text: `✅ Allowed. Result: ${decision.result || 'Executed successfully'}`
        }
      ]
    };
  } catch (err) {
    return {
      content: [
        {
          type: "text",
          text: `🚫 Blocked by MCP Shield: Connection error to shield backend (${err.message})`
        }
      ]
    };
  }
}

// Tool 1: file_reader
server.tool(
  "file_reader",
  { filepath: z.string() },
  async ({ filepath }) => {
    return await validateWithShield("file_reader", { filepath });
  }
);

// Tool 2: report_generator
server.tool(
  "report_generator",
  { topic: z.string() },
  async ({ topic }) => {
    return await validateWithShield("report_generator", { topic });
  }
);

// Tool 3: email_sender
server.tool(
  "email_sender",
  { recipient: z.string(), subject: z.string(), body: z.string() },
  async ({ recipient, subject, body }) => {
    return await validateWithShield("email_sender", { recipient, subject, body });
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);