import { NextRequest, NextResponse } from 'next/server';
import { agentEngine } from '@/lib/agent/agentEngine';
import { SupportedProvider } from '@/lib/agent/types';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const prompt = body.prompt || body.message;
    const agentRole = body.agentRole || body.agentId || 'ResearchAgent';
    const provider = (body.provider as SupportedProvider) || undefined;
    const forceTamper = Boolean(body.forceTamper);
    const forcePoisonOutput = Boolean(body.forcePoisonOutput);

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'Missing required field: prompt' }, { status: 400 });
    }

    const response = await agentEngine.runAgent({
      prompt,
      agentRole,
      provider,
      forceTamper,
      forcePoisonOutput,
    });

    return NextResponse.json(response);
  } catch (err: any) {
    console.error('Agent run API error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
