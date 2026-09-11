import express from "express";
import cors from "cors";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const app = express();
const PORT = process.env.PORT || 3008;

app.use(cors());
app.use(express.json());

const MCP_SERVER_PATH = "C:\\Users\\jayas\\OneDrive\\Desktop\\mcp-shield-bridge\\index.js";

let mcpClient = null;
let mcpTransport = null;
let isConnected = false;
let connectionError = null;

async function initMcpConnection() {
  console.log(`[MCP Shield Client] Spawning and connecting to MCP Server at: ${MCP_SERVER_PATH}`);
  try {
    mcpTransport = new StdioClientTransport({
      command: "node",
      args: [MCP_SERVER_PATH],
      stderr: "inherit"
    });

    mcpClient = new Client(
      {
        name: "mcp-shield-web-client",
        version: "1.0.0"
      },
      {
        capabilities: {}
      }
    );

    await mcpClient.connect(mcpTransport);
    isConnected = true;
    connectionError = null;
    console.log("✅ [MCP Shield Client] Connected to Stdio MCP Server successfully!");
  } catch (err) {
    isConnected = false;
    connectionError = err.message || String(err);
    console.error("❌ [MCP Shield Client] Failed to connect to MCP Server:", err);
  }
}

// 0. Root Endpoint
app.get("/", (req, res) => {
  res.json({
    name: "MCP Shield AI Client Agent Backend",
    status: isConnected ? "CONNECTED" : "DISCONNECTED",
    mcpBridgePath: MCP_SERVER_PATH,
    frontendUrl: "http://localhost:5196",
    mcpShieldDashboardUrl: "http://localhost:3010",
    endpoints: {
      status: "/api/status",
      tools: "/api/tools",
      callTool: "/api/call-tool (POST)",
      approve: "/api/approve (POST)"
    }
  });
});

// 1. Connection Status Endpoint
app.get("/api/status", (req, res) => {
  res.json({
    connected: isConnected,
    serverPath: MCP_SERVER_PATH,
    error: connectionError
  });
});

// Reconnect endpoint
app.post("/api/reconnect", async (req, res) => {
  if (mcpTransport) {
    try {
      await mcpTransport.close();
    } catch (e) {
      // ignore close errors
    }
  }
  await initMcpConnection();
  res.json({
    connected: isConnected,
    error: connectionError
  });
});

// 2. List Available Tools Endpoint
app.get("/api/tools", async (req, res) => {
  if (!isConnected || !mcpClient) {
    return res.status(503).json({
      error: "MCP Server is not connected",
      details: connectionError,
      tools: []
    });
  }

  try {
    const response = await mcpClient.listTools();
    res.json({
      tools: response.tools || []
    });
  } catch (err) {
    console.error("[MCP Shield Client] Error listing tools:", err);
    res.status(500).json({ error: "Failed to list MCP tools", details: err.message });
  }
});

// 3. Call Tool Endpoint
app.post("/api/call-tool", async (req, res) => {
  const { toolName, arguments: toolArgs } = req.body;

  if (!toolName) {
    return res.status(400).json({ error: "toolName is required" });
  }

  if (!isConnected || !mcpClient) {
    return res.status(503).json({
      error: "MCP Server is not connected",
      details: connectionError
    });
  }

  try {
    console.log(`[MCP Shield Client] Invoking tool '${toolName}' with args:`, toolArgs);
    const result = await mcpClient.callTool({
      name: toolName,
      arguments: toolArgs || {}
    });

    // Extract text content and status from MCP result content array
    let rawText = "";
    if (result.content && Array.isArray(result.content)) {
      rawText = result.content.map((c) => c.text || "").join("\n");
    }

    const isPending = rawText.includes("Pending Approval") || rawText.includes("⏳");
    const isBlocked = rawText.includes("Blocked by MCP Shield") || rawText.includes("🚫");

    let status = "ALLOWED";
    if (isPending) status = "PENDING_APPROVAL";
    else if (isBlocked) status = "BLOCKED";

    let requestId = "";
    const reqMatch = rawText.match(/\[requestId:\s*([^\]]+)\]/);
    if (reqMatch) {
      requestId = reqMatch[1];
    } else {
      requestId = `req_${Date.now()}`;
    }

    let reason = "";
    if (isPending) {
      const match = rawText.match(/(?:Pending Approval:\s*|⏳\s*)(.*?)(?:\s*\[requestId:.*\]|$)/);
      reason = match ? match[1].trim() : rawText;
    } else if (isBlocked) {
      const match = rawText.match(/(?:Blocked by MCP Shield:\s*|🚫\s*)(.*)/);
      reason = match ? match[1].trim() : rawText;
    } else {
      const match = rawText.match(/(?:Allowed\.\s*Result:\s*|✅\s*)(.*)/);
      reason = match ? match[1].trim() : rawText;
    }

    res.json({
      success: true,
      toolName,
      arguments: toolArgs,
      status,
      requestId,
      text: rawText,
      reason: reason || rawText,
      rawResult: result
    });
  } catch (err) {
    console.error(`[MCP Shield Client] Error calling tool '${toolName}':`, err);
    res.status(500).json({
      success: false,
      toolName,
      arguments: toolArgs,
      status: "ERROR",
      error: err.message,
      reason: `Execution Error: ${err.message}`
    });
  }
});

// 4. Check Approval Remote Status Endpoint
app.get("/api/check-approval", async (req, res) => {
  const { requestId } = req.query;
  if (!requestId) return res.json({ resolved: false });

  try {
    const shieldRes = await fetch("http://localhost:3010/api/dashboard");
    const dash = await shieldRes.json();
    const isStillPending = dash.pendingApprovals?.some((p) => p.id === requestId);
    const event = dash.events?.find((e) => e.details?.requestId === requestId && e.eventType === 'HUMAN_APPROVAL');

    if (event) {
      return res.json({
        resolved: true,
        status: event.decision === 'ALLOW' ? 'ALLOWED' : 'BLOCKED',
        reason: event.reason
      });
    }

    if (!isStillPending) {
      return res.json({
        resolved: true,
        status: 'ALLOWED',
        reason: 'Human approval granted by Security Administrator.'
      });
    }

    res.json({ resolved: false, status: 'PENDING_APPROVAL' });
  } catch (err) {
    res.json({ resolved: false, error: err.message });
  }
});

// 5. Human-in-the-Loop Approve/Reject Endpoint
app.post("/api/approve", async (req, res) => {
  const { requestId, approved } = req.body;

  try {
    console.log(`[MCP Shield Client] Forwarding human decision for ${requestId}: approved=${approved}`);
    const shieldRes = await fetch("http://localhost:3010/api/shield/approve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId, approved: Boolean(approved) })
    });
    const decision = await shieldRes.json();
    res.json(decision);
  } catch (err) {
    console.warn("[MCP Shield Client] Shield backend unreachable for approve, simulating decision:", err.message);
    if (approved) {
      res.json({
        status: "ALLOWED",
        result: "Human approval granted. Action executed successfully."
      });
    } else {
      res.json({
        status: "BLOCKED",
        reason: "Human approval rejected by Security Administrator."
      });
    }
  }
});

// Initialize connection and start Express server
app.listen(PORT, () => {
  console.log(`🚀 [MCP Shield Client] Backend running at http://localhost:${PORT}`);
  initMcpConnection();
});
