import { NextRequest, NextResponse } from 'next/server';
import { shieldEngine } from '@/lib/security/shieldEngine';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { toolName, agentId, parameters, currentToolMetadata } = body;

    if (!toolName) {
      return NextResponse.json({ error: 'Missing toolName' }, { status: 400 });
    }

    const evaluation = shieldEngine.evaluate({
      toolName,
      agentId: agentId || 'ResearchAgent',
      parameters: parameters || {},
      currentToolMetadata,
    });

    return NextResponse.json({ evaluation });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
