import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/store';
import { shieldEventBus } from '@/lib/events/eventBus';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const id = body.requestId || body.approvalId || body.id;
    const isApproved = body.approved === true || body.approved === 'true' || body.decision === 'APPROVED';

    const status = isApproved ? 'APPROVED' : 'REJECTED';
    
    // Update approval status in DB if ID provided
    if (id) {
      db.decideApproval(id, status, 'Security Admin');
    } else {
      // If no ID passed, decide all pending approvals
      const pending = db.getApprovals();
      pending.forEach((p) => db.decideApproval(p.id, status, 'Security Admin'));
    }

    const evt = db.recordSecurityEvent({
      id: `evt_app_${Date.now()}`,
      toolId: 'tool_email_sender',
      toolName: 'email_sender',
      agentId: 'McpClientAgent',
      eventType: 'HUMAN_APPROVAL',
      riskScore: isApproved ? 0 : 80,
      decision: isApproved ? 'ALLOW' : 'BLOCK',
      reason: isApproved
        ? 'Human approval granted by Security Administrator. Action executed.'
        : 'Human approval rejected by Security Administrator. Execution blocked.',
      details: { requestId: id, isApproved },
      executed: isApproved,
      timestamp: new Date().toISOString(),
    });

    shieldEventBus.emitShieldEvent(evt);

    if (isApproved) {
      return NextResponse.json({
        status: 'ALLOWED',
        result: 'Human approval granted. Action executed successfully.',
      });
    } else {
      return NextResponse.json({
        status: 'BLOCKED',
        reason: 'Human approval rejected by Security Administrator.',
      });
    }
  } catch (err: any) {
    return NextResponse.json({ status: 'BLOCKED', reason: `Internal Error: ${err.message}` }, { status: 500 });
  }
}
