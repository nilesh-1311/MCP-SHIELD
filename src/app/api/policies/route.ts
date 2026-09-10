import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/store';

export const dynamic = 'force-dynamic';

export async function GET() {
  const policies = db.getPolicies();
  return NextResponse.json({ policies });
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { agentId, allowedTools, reviewRequiredTools, blockedTools, maxRiskThreshold } = body;

    if (!agentId) {
      return NextResponse.json({ error: 'Missing agentId' }, { status: 400 });
    }

    const updated = db.updatePolicy(agentId, {
      allowedTools,
      reviewRequiredTools,
      blockedTools,
      maxRiskThreshold,
    });

    if (!updated) {
      return NextResponse.json({ error: `Policy for agent '${agentId}' not found` }, { status: 404 });
    }

    db.recordSecurityEvent({
      id: `evt_pol_${Date.now()}`,
      toolId: 'all_tools',
      toolName: 'policy_manager',
      agentId: 'AdminConsole',
      eventType: 'TOOL_UPDATED',
      riskScore: 0,
      decision: 'ALLOW',
      reason: `Policy updated for agent '${agentId}'.`,
      timestamp: new Date().toISOString(),
      executed: true,
    });

    return NextResponse.json({ success: true, policy: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
