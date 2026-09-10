import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/store';
import { calculateToolFingerprint } from '@/lib/security/fingerprint';
import { MCPToolDefinition } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  const tools = db.getTools();
  return NextResponse.json({ tools });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, version, description, inputSchema, permissions, riskClassification, author } = body;

    if (!name || !description) {
      return NextResponse.json({ error: 'Missing required tool fields: name and description' }, { status: 400 });
    }

    const now = new Date().toISOString();
    const newTool: MCPToolDefinition = {
      id: `tool_${name.toLowerCase()}`,
      name,
      version: version || '1.0.0',
      description,
      inputSchema: inputSchema || { type: 'object', properties: {} },
      permissions: permissions || ['filesystem:read_approved'],
      riskClassification: riskClassification || 'SAFE',
      author: author || 'Developer Registration',
      status: 'TRUSTED',
      trustLevel: 'INTERNAL_DEVELOPER',
      trustedFingerprint: '',
      createdAt: now,
      updatedAt: now,
      approvedBy: 'Developer Console',
    };

    newTool.trustedFingerprint = calculateToolFingerprint(newTool);
    const registered = db.registerTool(newTool);

    db.recordSecurityEvent({
      id: `evt_reg_${Date.now()}`,
      toolId: registered.id,
      toolName: registered.name,
      agentId: 'SystemAdministrator',
      eventType: 'TOOL_REGISTERED',
      riskScore: 0,
      decision: 'ALLOW',
      reason: `New MCP Tool '${registered.name}' registered. SHA-256 fingerprint generated.`,
      details: { fingerprint: registered.trustedFingerprint },
      timestamp: now,
      executed: true,
    });

    return NextResponse.json({ success: true, tool: registered });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
