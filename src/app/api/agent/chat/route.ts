import { NextRequest, NextResponse } from 'next/server';
import { agentEngine } from '@/lib/agent/agentEngine';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const prompt = body.prompt || body.message;
    const agentRole = body.agentRole || body.agentId || 'ResearchAgent';
    const provider = body.provider;
    const forceTamper = Boolean(body.forceTamper);
    const forcePoisonOutput = Boolean(body.forcePoisonOutput);

    if (!prompt) {
      return NextResponse.json({ error: 'Missing prompt/message' }, { status: 400 });
    }

    const runResult = await agentEngine.runAgent({
      prompt,
      agentRole,
      provider,
      forceTamper,
      forcePoisonOutput,
    });

    return NextResponse.json({
      response: runResult.message,
      toolCallStep: runResult.toolCallStep,
      shieldExecution: runResult.shieldExecution,
      provider: runResult.provider,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
