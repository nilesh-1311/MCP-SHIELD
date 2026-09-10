import { NextResponse } from 'next/server';
import { agentEngine } from '@/lib/agent/agentEngine';

export const dynamic = 'force-dynamic';

export async function GET() {
  const status = agentEngine.getProviderStatus();
  return NextResponse.json(status);
}
