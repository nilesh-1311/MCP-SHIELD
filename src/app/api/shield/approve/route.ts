import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/store';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { approvalId, decision, decidedBy } = body;

    if (!approvalId || !decision) {
      return NextResponse.json({ error: 'Missing approvalId or decision' }, { status: 400 });
    }

    const updated = db.decideApproval(
      approvalId,
      decision === 'APPROVED' ? 'APPROVED' : 'REJECTED',
      decidedBy || 'Security Administrator'
    );

    if (!updated) {
      return NextResponse.json({ error: 'Approval request not found' }, { status: 404 });
    }

    db.recordSecurityEvent({
      id: `evt_appr_${Date.now()}`,
      toolId: updated.toolId,
      toolName: updated.toolName,
      agentId: decidedBy || 'Security Administrator',
      eventType: decision === 'APPROVED' ? 'APPROVAL_GRANTED' : 'APPROVAL_REJECTED',
      riskScore: updated.riskScore,
      decision: decision === 'APPROVED' ? 'ALLOW' : 'BLOCK',
      reason: `Human review decision '${decision}' by ${decidedBy || 'SecOps Admin'}.`,
      details: { approvalId },
      timestamp: new Date().toISOString(),
      executed: false,
    });

    return NextResponse.json({ success: true, approval: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
