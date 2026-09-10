import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/store';
import { shieldEngine } from '@/lib/security/shieldEngine';
import { calculateToolFingerprint, formatFingerprint } from '@/lib/security/fingerprint';

export const dynamic = 'force-dynamic';

/**
 * Standard MCP JSON-RPC 2.0 Protocol Endpoint with MCP Shield in-line protection
 * Compatible with standard MCP clients (Claude Desktop, Cursor, AGY, etc.)
 */
export async function POST(req: NextRequest) {
  try {
    const jsonRpcReq = await req.json();
    const { jsonrpc, id, method, params } = jsonRpcReq;

    if (jsonrpc !== '2.0') {
      return NextResponse.json({
        jsonrpc: '2.0',
        id: id || null,
        error: { code: -32600, message: 'Invalid Request: MCP JSON-RPC 2.0 required' },
      });
    }

    // METHOD 1: tools/list
    if (method === 'tools/list') {
      const registeredTools = db.getTools();
      const mcpTools = registeredTools.map((t) => ({
        name: t.name,
        description: t.description,
        inputSchema: t.inputSchema,
        _mcpShield: {
          version: t.version,
          status: t.status,
          trustedFingerprint: formatFingerprint(t.trustedFingerprint, true),
          riskClassification: t.riskClassification,
        },
      }));

      return NextResponse.json({
        jsonrpc: '2.0',
        id,
        result: { tools: mcpTools },
      });
    }

    // METHOD 2: tools/call
    if (method === 'tools/call') {
      const toolName = params?.name;
      const argumentsPayload = params?.arguments || {};
      const agentId = req.headers.get('x-agent-id') || 'ResearchAgent';

      if (!toolName) {
        return NextResponse.json({
          jsonrpc: '2.0',
          id,
          error: { code: -32602, message: 'Missing tool name parameter in tools/call' },
        });
      }

      // DISPATCH THROUGH IN-LINE MCP SHIELD
      const shieldResult = await shieldEngine.interceptAndExecute({
        toolName,
        agentId,
        parameters: argumentsPayload,
      });

      if (shieldResult.decision === 'BLOCK') {
        return NextResponse.json({
          jsonrpc: '2.0',
          id,
          result: {
            content: [
              {
                type: 'text',
                text: `🛑 [MCP SHIELD SECURITY ENFORCEMENT INTERCEPTION]\nExecution of tool '${toolName}' was strictly BLOCKED before execution.\nReasons: ${shieldResult.evaluation.reasons.join('; ')}\nRisk Score: ${shieldResult.riskScore}/100 (${shieldResult.evaluation.riskLevel})`,
              },
            ],
            isError: true,
            _mcpShield: {
              decision: 'BLOCK',
              riskScore: shieldResult.riskScore,
              eventId: shieldResult.eventId,
              executed: false,
            },
          },
        });
      }

      if (shieldResult.decision === 'REVIEW') {
        return NextResponse.json({
          jsonrpc: '2.0',
          id,
          result: {
            content: [
              {
                type: 'text',
                text: `🟡 [MCP SHIELD APPROVAL REQUIRED]\nTool '${toolName}' requires human authorization (Approval ID: ${shieldResult.evaluation.approvalId}).`,
              },
            ],
            isError: true,
            _mcpShield: {
              decision: 'REVIEW',
              approvalId: shieldResult.evaluation.approvalId,
              executed: false,
            },
          },
        });
      }

      return NextResponse.json({
        jsonrpc: '2.0',
        id,
        result: {
          content: [
            {
              type: 'text',
              text: typeof shieldResult.result === 'string' ? shieldResult.result : JSON.stringify(shieldResult.result, null, 2),
            },
          ],
          _mcpShield: {
            decision: 'ALLOW',
            riskScore: shieldResult.riskScore,
            integrityVerified: true,
            executed: true,
            eventId: shieldResult.eventId,
          },
        },
      });
    }

    // Default method not found
    return NextResponse.json({
      jsonrpc: '2.0',
      id,
      error: { code: -32601, message: `Method '${method}' not found or unsupported by MCP Shield proxy.` },
    });
  } catch (err: any) {
    return NextResponse.json({
      jsonrpc: '2.0',
      id: null,
      error: { code: -32603, message: `Internal JSON-RPC error: ${err?.message}` },
    });
  }
}
