import { NextResponse } from 'next/server';
import { db } from '@/lib/db/store';

export const dynamic = 'force-dynamic';

export async function GET() {
  const tools = db.getTools();
  const events = db.getSecurityEvents(200);
  const threats = db.getThreats();
  const approvals = db.getApprovals();
  const policies = db.getPolicies();

  const protectedToolsCount = tools.length;
  const threatsDetectedCount = threats.length;
  const blockedActionsCount = events.filter((e) => e.decision === 'BLOCK').length;
  const pendingApprovalsCount = approvals.length;

  // Compute security score: baseline 100 minus weighted active threats
  let securityScore = 100;
  threats.forEach((t) => {
    if (t.status === 'ACTIVE') {
      if (t.severity === 'CRITICAL') securityScore -= 12;
      else if (t.severity === 'HIGH') securityScore -= 8;
      else if (t.severity === 'MEDIUM') securityScore -= 4;
      else securityScore -= 1;
    }
  });
  securityScore = Math.max(Math.min(securityScore, 100), 20);

  // Threat category breakdown
  const threatBreakdown: Record<string, number> = {
    INTEGRITY_VIOLATION: 0,
    MALICIOUS_DESCRIPTION: 0,
    UNAUTHORIZED_TOOL: 0,
    PROMPT_INJECTION: 0,
    MALICIOUS_OUTPUT: 0,
    PATH_TRAVERSAL: 0,
  };
  threats.forEach((t) => {
    threatBreakdown[t.type] = (threatBreakdown[t.type] || 0) + 1;
  });

  return NextResponse.json({
    metrics: {
      protectedTools: protectedToolsCount,
      threatsDetected: threatsDetectedCount,
      blockedActions: blockedActionsCount,
      pendingApprovals: pendingApprovalsCount,
      securityScore,
    },
    tools,
    events,
    recentEvents: events.slice(0, 10),
    activeThreats: threats.slice(0, 8),
    pendingApprovals: approvals,
    policies,
    threatBreakdown,
  });
}
