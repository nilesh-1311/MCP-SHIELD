import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/store';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get('limit') || '100', 10);
  const decision = searchParams.get('decision');
  const tool = searchParams.get('tool');

  let events = db.getSecurityEvents(limit);

  if (decision) {
    events = events.filter((e) => e.decision.toLowerCase() === decision.toLowerCase());
  }

  if (tool) {
    events = events.filter((e) => e.toolName.toLowerCase().includes(tool.toLowerCase()));
  }

  return NextResponse.json({ events });
}
