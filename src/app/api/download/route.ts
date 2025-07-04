import { NextRequest } from 'next/server';
import fs from 'fs';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const file = searchParams.get('file');
  if (!file) return new Response('No file specified', { status: 400 });
  try {
    const stat = fs.statSync(file);
    if (!stat.isFile()) return new Response('Not a file', { status: 400 });
    const stream = fs.createReadStream(file);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return new Response(stream as any, {
      headers: {
        'Content-Disposition': `attachment; filename="${encodeURIComponent(file.split(/[\\/]/).pop()!)}"`
      }
    });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    return new Response('Failed to download', { status: 500 });
  }
}
