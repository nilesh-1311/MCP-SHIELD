import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { REPORTS_DIR } from '@/lib/tools/realReportGenerator';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const file = searchParams.get('file');

  if (!file) {
    return NextResponse.json({ error: 'Missing file parameter' }, { status: 400 });
  }

  // Path traversal prevention
  const cleanFileName = path.basename(file);
  const targetPath = path.join(REPORTS_DIR, cleanFileName);

  if (!fs.existsSync(targetPath)) {
    return NextResponse.json({ error: 'Report file not found' }, { status: 404 });
  }

  try {
    const fileBuffer = fs.readFileSync(targetPath);
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'Content-Disposition': `attachment; filename="${cleanFileName}"`,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: `Failed to read report: ${err.message}` }, { status: 500 });
  }
}
