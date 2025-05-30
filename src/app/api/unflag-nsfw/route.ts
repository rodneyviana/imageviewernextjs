import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';

export async function POST(req: NextRequest) {
  const { file } = await req.json();
  if (!file) return NextResponse.json({ error: 'No file specified' }, { status: 400 });
  try {
    fs.unlinkSync(file + '.nsfw');
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to unflag NSFW' }, { status: 500 });
  }
}
