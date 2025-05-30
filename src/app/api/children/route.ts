import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const allowedExtensions = [
  '.jpeg', '.jpg', '.png', '.heic', '.wav', '.mp4', '.mpeg'
];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const folder = searchParams.get('folder');  if (!folder) return NextResponse.json({ error: 'No folder specified' }, { status: 400 });
  try {
    const stat = fs.statSync(folder);
    if (!stat.isDirectory()) {
      // If it's a file, return file info with NSFW status
      const nsfwFlagged = fs.existsSync(folder + '.nsfw');
      const fileInfo = {
        type: 'file',
        name: path.basename(folder),
        path: folder,
        nsfwFlagged,
        mtime: stat.mtime
      };
      return NextResponse.json({ children: [fileInfo] });
    }
    const items = fs.readdirSync(folder, { withFileTypes: true });
    const children = items.map(item => {
      const fullPath = path.join(folder, item.name);
      if (item.isDirectory()) {
        return { type: 'folder', name: item.name, path: fullPath };
      } else if (allowedExtensions.includes(path.extname(item.name).toLowerCase())) {
        // Check if a corresponding .nsfw file exists
        const nsfwFlagged = fs.existsSync(fullPath + '.nsfw');
        const stats = fs.statSync(fullPath);
        return { 
          type: 'file', 
          name: item.name, 
          path: fullPath, 
          nsfwFlagged,
          mtime: stats.mtime
        };
      }
      return null;    }).filter(Boolean);
    
    // Sort children consistently: folders first (alphabetically), then files by mtime (most recent first)
    children.sort((a: any, b: any) => {
      if (a.type === 'folder' && b.type === 'file') return -1;
      if (a.type === 'file' && b.type === 'folder') return 1;
      if (a.type === 'file' && b.type === 'file') {
        const dateA = a.mtime ? new Date(a.mtime).getTime() : 0;
        const dateB = b.mtime ? new Date(b.mtime).getTime() : 0;
        return dateB - dateA; // Most recent first
      }
      return a.name.localeCompare(b.name); // Folders alphabetically
    });
    
    return NextResponse.json({ children });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to read folder' }, { status: 500 });
  }
}
