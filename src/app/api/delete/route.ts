import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const file = searchParams.get('file');
  if (!file) return NextResponse.json({ error: 'No file specified' }, { status: 400 });
  try {
    fs.unlinkSync(file);
    // Also delete NSFW and metadata if present
    try { fs.unlinkSync(file + '.nsfw'); } catch {}
    try { fs.unlinkSync(file + '.json'); } catch {}
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}
