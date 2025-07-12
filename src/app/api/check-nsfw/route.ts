import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const file = searchParams.get('file');
  if (!file) return NextResponse.json({ error: 'No file specified' }, { status: 400 });
  
  try {
    const nsfwFlagged = fs.existsSync(file + '.nsfw');
    return NextResponse.json({ nsfwFlagged });
  } catch (e) {
    console.error('Failed to check NSFW flag:', e);
    return NextResponse.json({ error: 'Failed to check NSFW flag' }, { status: 500 });
  }
}
