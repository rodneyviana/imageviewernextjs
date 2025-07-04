import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';

export async function POST(req: NextRequest) {
  const { file } = await req.json();
  if (!file) return NextResponse.json({ error: 'No file specified' }, { status: 400 });
  try {
    fs.writeFileSync(file + '.nsfw', '');
    // Add full path name to the response
    const fullPath = fs.realpathSync(file + '.nsfw');
    return NextResponse.json({ success: true, fullPath: fullPath }, { status: 200 });
  } catch (e) {
    console.error('Failed to flag NSFW:', e);
    return NextResponse.json({ error: 'Failed to flag NSFW' }, { status: 500 });
  }
}
