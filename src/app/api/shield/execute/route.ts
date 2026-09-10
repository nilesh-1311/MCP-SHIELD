import { NextRequest, NextResponse } from 'next/server';
import { shieldEngine } from '@/lib/security/shieldEngine';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { toolName, agentId, parameters, currentToolMetadata, isPreApproved } = body;

    if (!toolName) {
      return NextResponse.json({ error: 'Missing toolName' }, { status: 400 });
    }

    const response = await shieldEngine.interceptAndExecute(
      {
        toolName,
        agentId: agentId || 'ResearchAgent',
        parameters: parameters || {},
        currentToolMetadata,
      },
      !!isPreApproved
    );

    return NextResponse.json(response);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
