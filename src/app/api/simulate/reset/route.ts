import { NextResponse } from 'next/server';
import { db } from '@/lib/db/store';

export const dynamic = 'force-dynamic';

export async function POST() {
  db.seed();
  return NextResponse.json({
    success: true,
    message: 'MCP Shield database reset to baseline trusted state successfully.',
    tools: db.getTools(),
  });
}
