import { NextResponse } from 'next/server';
import { db } from '@/lib/db/store';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const result = db.verifyAuditChain();
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Failed to verify audit chain', details: err.message },
      { status: 500 }
    );
  }
}

export async function POST() {
  return GET();
}
