import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import ExifReader from 'exifreader';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const file = searchParams.get('file');
  if (!file) return NextResponse.json({ error: 'No file specified' }, { status: 400 });
  try {
    const ext = path.extname(file).toLowerCase();
    if ([".jpg", ".jpeg", ".png", ".heic"].includes(ext)) {
      const buffer = fs.readFileSync(file);
      const tags = ExifReader.load(buffer);
      // Try to extract the 'prompt' or any JSON-like tag
      let metadata = null;
      if (tags.prompt && typeof tags.prompt.value === 'string') {
        try {
          metadata = JSON.parse(tags.prompt.value);
        } catch {
          metadata = tags.prompt.value;
        }
      } else {
        // fallback: return all tags
        metadata = tags;
      }
      return NextResponse.json({ metadata });
    } else {
      // For videos or unsupported types, return null
      return NextResponse.json({ metadata: null });
    }
  } catch (e) {
    return NextResponse.json({ error: 'Failed to read metadata' }, { status: 500 });
  }
}
