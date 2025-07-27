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
    }

    // HEIC conversion
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

    const range = req.headers.get('range');
    const fileSize = stat.size;

    // Handle Range Requests (for video)
    if (range && contentType.startsWith('video/')) {
      const bytesPrefix = 'bytes=';
      if (!range.startsWith(bytesPrefix)) {
        return new Response('Invalid range', { status: 416 });
      }

      const [startStr, endStr] = range.substring(bytesPrefix.length).split('-');
      const start = parseInt(startStr, 10);
      const end = endStr ? parseInt(endStr, 10) : fileSize - 1;

      if (isNaN(start) || isNaN(end) || start > end || end >= fileSize) {
        return new Response('Invalid range', {
          status: 416,
          headers: {
            'Content-Range': `bytes */${fileSize}`
          }
        });
      }

      const chunkSize = end - start + 1;
      const stream = fs.createReadStream(file, { start, end });

      return new Response(stream as unknown as ReadableStream, {
        status: 206,
        headers: {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunkSize.toString(),
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=31536000, immutable'
        }
      });
    }

    // Default (non-range, non-video or static download)
    const stream = fs.createReadStream(file);
    return new Response(stream as unknown as ReadableStream, {
      headers: {
        'Content-Type': contentType,
        'Content-Length': fileSize.toString(),
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'public, max-age=31536000, immutable'
      }
    });
  } catch (e) {
    console.error('Failed to load file:', e);
    return new Response('Failed to load file', { status: 500 });
  }
}
