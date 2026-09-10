import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/store';
import { scanToolDescription } from '@/lib/security/threatScanner';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, version, description, permissions, approvedBy } = body;

    if (!name) {
      return NextResponse.json({ error: 'Missing tool name' }, { status: 400 });
    }

    const existing = db.getToolByName(name);
    if (!existing) {
      return NextResponse.json({ error: `Tool '${name}' not found` }, { status: 404 });
    }

    // Security scan on proposed update
    const proposedDesc = description || existing.description;
    const scanResult = scanToolDescription(proposedDesc);

    if (!scanResult.passed) {
      return NextResponse.json({
        success: false,
        error: `Update Rejected by MCP Shield: ${scanResult.message}`,
        scanResult,
      }, { status: 400 });
    }

    const updated = db.updateToolTrustedBaseline(
      name,
      {
        version: version || existing.version,
        description: proposedDesc,
        permissions: permissions || existing.permissions,
      },
      approvedBy || 'Authorized Developer'
    );

    db.recordSecurityEvent({
      id: `evt_upd_${Date.now()}`,
      toolId: existing.id,
      toolName: existing.name,
      agentId: approvedBy || 'Authorized Developer',
      eventType: 'TOOL_UPDATED',
      riskScore: 0,
      decision: 'ALLOW',
      reason: `Developer updated tool to ${updated?.version}. New SHA-256 fingerprint verified & trusted.`,
      details: { newFingerprint: updated?.trustedFingerprint },
      timestamp: new Date().toISOString(),
      executed: true,
    });

    return NextResponse.json({
      success: true,
      tool: updated,
      message: `Tool '${name}' successfully updated to version ${updated?.version}. New baseline fingerprint active.`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
