import { NextRequest, NextResponse } from 'next/server';
import { agentEngine } from '@/lib/agent/agentEngine';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, agentId, forceTamper, forcePoisonOutput } = body;

    if (!message) {
      return NextResponse.json({ error: 'Missing user message' }, { status: 400 });
    }

    const response = await agentEngine.processUserMessage(message, agentId || 'ResearchAgent', {
      forceTamper,
      forcePoisonOutput,
    });

    return NextResponse.json({ response });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
