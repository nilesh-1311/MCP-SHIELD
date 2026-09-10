import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/store';

export const dynamic = 'force-dynamic';

export async function GET() {
  const threats = db.getThreats();
  return NextResponse.json({ threats });
}
