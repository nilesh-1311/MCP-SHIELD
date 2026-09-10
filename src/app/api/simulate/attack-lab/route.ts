import { NextRequest, NextResponse } from 'next/server';
import { attackLab } from '@/lib/security/attackLab';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { scenarioId } = body;

    const result = await attackLab.runScenario(scenarioId || 'manifest_tampering');
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
