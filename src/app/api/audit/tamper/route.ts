import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/store';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const action = body.action || 'tamper';

    if (action === 'restore') {
      const res = db.restoreAuditLogBaseline();
      const verification = db.verifyAuditChain();
      return NextResponse.json({
        success: true,
        restored: true,
        restoredCount: res.restoredCount,
        verification,
      });
    }

    const tamperRes = db.tamperAuditLogForDemo(body.targetId);
    const verification = db.verifyAuditChain();

    return NextResponse.json({
      success: tamperRes.success,
      tamperedEventId: tamperRes.tamperedEventId,
      originalReason: tamperRes.originalReason,
      tamperedReason: tamperRes.tamperedReason,
      verification,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Failed to execute tamper simulation', details: err.message },
      { status: 500 }
    );
  }
}
