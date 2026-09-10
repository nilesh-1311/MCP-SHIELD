import { NextRequest, NextResponse } from 'next/server';
import { redTeamAgent } from '@/lib/security/redTeamAgent';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const turns = typeof body.turns === 'number' ? body.turns : 4;
    const result = await redTeamAgent.runSimulation(turns);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Red-Team simulation error' }, { status: 500 });
  }
}
