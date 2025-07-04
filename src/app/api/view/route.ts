import { NextRequest } from 'next/server';
import fs from 'fs';
import path from 'path';
import convert from 'heic-convert';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const file = searchParams.get('file');
  if (!file) return new Response('No file specified', { status: 400 });
  
  try {
    const stat = fs.statSync(file);
    if (!stat.isFile()) return new Response('Not a file', { status: 400 });
    
    // Get file extension to determine content type
    const ext = path.extname(file).toLowerCase();
    let contentType = 'application/octet-stream';
    
    switch (ext) {
      case '.jpg':
      case '.jpeg':
        contentType = 'image/jpeg';
        break;
      case '.png':
        contentType = 'image/png';
        break;
      case '.gif':
        contentType = 'image/gif';
        break;
      case '.webp':
        contentType = 'image/webp';
        break;
      case '.bmp':
        contentType = 'image/bmp';
        break;
      case '.mp4':
        contentType = 'video/mp4';
        break;
      case '.avi':
        contentType = 'video/x-msvideo';
        break;
      case '.mov':
        contentType = 'video/quicktime';
        break;
      case '.webm':
        contentType = 'video/webm';
        break;
      // HEIC will be handled separately via conversion
    }
    
    // If HEIC, convert to JPEG for browser viewing
    if (ext === '.heic') {
      const inputBuffer = fs.readFileSync(file);
      const outputBuffer = await convert({ buffer: inputBuffer, format: 'JPEG', quality: 1 });
      return new Response(outputBuffer, {
        headers: {
          'Content-Type': 'image/jpeg',
          'Cache-Control': 'public, max-age=31536000, immutable'
        }
      });
    }
    
    const stream = fs.createReadStream(file);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return new Response(stream as any, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable'
      }
    });
  } catch (e) {
    console.error('Failed to load file:', e);
    return new Response('Failed to load file', { status: 500 });
  }
}
