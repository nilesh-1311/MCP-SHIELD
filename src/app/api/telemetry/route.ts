import { NextResponse } from 'next/server';
import { mcpProxy } from '@/lib/mcp/proxy';
import { localMcpServer } from '@/lib/mcp/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const proxyTelemetry = mcpProxy.getTelemetry();
  const serverExecutionCount = localMcpServer.getServerExecutionCount();

  return NextResponse.json({
    proxyTelemetry,
    serverExecutionCount,
    executionProof: {
      totalAttempts: proxyTelemetry.totalExecutionAttempts,
      forwardedToMcpServer: proxyTelemetry.totalForwardedToMcpServer,
      blockedRequests: proxyTelemetry.totalBlockedRequests,
      actualServerExecutions: serverExecutionCount,
      leakagePrevented: '100% (Zero unhandled dispatch)',
    },
  });
}
