import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({ name: "mcp-shield-bridge", version: "1.0.0" });

async function validateWithShield(tool, params, agent = "ClaudeDesktopAgent") {
  try {
    const res = await fetch("http://localhost:3010/api/shield/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tool, params, agent })
    });
    const decision = await res.json();

    if (decision.status === "PENDING_APPROVAL") {
      return {
        content: [{
          type: "text",
          text: `⏳ Pending Approval: ${decision.reason || "Human approval required"} [requestId: ${decision.requestId || 'req_' + Date.now()}]`
        }]
      };
    } else if (decision.status !== "ALLOWED") {
      return {
        content: [{
          type: "text",
          text: `🚫 Blocked by MCP Shield: ${decision.reason || "Security policy violation"}`
        }]
      };
    }

    return {
      content: [{
        type: "text",
        text: `✅ Allowed. Result: ${decision.result || "Execution successful"}`
      }]
    };
  } catch (err) {
    return {
      content: [{
        type: "text",
        text: `⚠️ Error connecting to MCP Shield gateway: ${err.message}`
      }]
    };
  }
}

// Tool 1: file_reader
server.tool(
  "file_reader",
  { filepath: z.string() },
  async ({ filepath }) => validateWithShield("file_reader", { filepath })
);

// Tool 2: report_generator
server.tool(
  "report_generator",
  { topic: z.string() },
  async ({ topic }) => validateWithShield("report_generator", { topic })
);

// Tool 3: email_sender
server.tool(
  "email_sender",
  { recipient: z.string(), subject: z.string(), body: z.string() },
  async ({ recipient, subject, body }) => validateWithShield("email_sender", { recipient, subject, body })
);

// Tool 4: bash_executor (High Risk)
server.tool(
  "bash_executor",
  { command: z.string() },
  async ({ command }) => validateWithShield("bash_executor", { command })
);

const transport = new StdioServerTransport();
await server.connect(transport);
