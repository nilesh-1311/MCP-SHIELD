import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/store';
import { shieldEventBus } from '@/lib/events/eventBus';
import { SecurityEvent } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  const policies = db.getPolicies();
  return NextResponse.json({ policies });
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const agentId = body.agentId || body.policy?.agentId;
    const agentName = body.agentName || body.policy?.agentName;
    const role = body.role || body.policy?.role;
    const allowedTools = body.allowedTools || body.policy?.allowedTools;
    const reviewRequiredTools = body.reviewRequiredTools || body.policy?.reviewRequiredTools;
    const blockedTools = body.blockedTools || body.policy?.blockedTools;
    const maxRiskThreshold = body.maxRiskThreshold ?? body.policy?.maxRiskThreshold;

    if (!agentId) {
      return NextResponse.json({ error: 'Missing agentId' }, { status: 400 });
    }

    const updated = db.updatePolicy(agentId, {
      agentName,
      role,
      allowedTools: Array.isArray(allowedTools) ? allowedTools : [],
      reviewRequiredTools: Array.isArray(reviewRequiredTools) ? reviewRequiredTools : [],
      blockedTools: Array.isArray(blockedTools) ? blockedTools : [],
      maxRiskThreshold: typeof maxRiskThreshold === 'number' ? maxRiskThreshold : 60,
    });

    const secEvent: SecurityEvent = {
      id: `evt_pol_${Date.now()}`,
      toolId: 'all_tools',
      toolName: 'policy_manager',
      agentId: agentId || 'AdminConsole',
      eventType: 'TOOL_UPDATED',
      riskScore: 0,
      decision: 'ALLOW',
      reason: `RBAC Access Policy updated for agent '${updated.agentName || agentId}' (Threshold: ${updated.maxRiskThreshold}/100, Allowed: ${updated.allowedTools.length}, Blocked: ${updated.blockedTools.length}).`,
      details: { policy: updated },
      timestamp: new Date().toISOString(),
      executed: true,
    };

    db.recordSecurityEvent(secEvent);
    shieldEventBus.emitShieldEvent(secEvent);

    return NextResponse.json({
      success: true,
      policy: updated,
      policies: db.getPolicies(),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  return PUT(req);
}

