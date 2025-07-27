/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
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
      // If it's a file, return file info with flagged status
      const flagged = fs.existsSync(folder + '.flagged');
      const fileInfo = {
        type: 'file',
        name: path.basename(folder),
        path: folder,
        flagged: flagged,
        birthtime: stat.birthtime
      };
      return NextResponse.json({ children: [fileInfo] });
    }
    const items = fs.readdirSync(folder, { withFileTypes: true });
    const children = items.map(item => {
      const fullPath = path.join(folder, item.name);
      if (item.isDirectory()) {
        const stats = fs.statSync(fullPath);
        return { 
          type: 'folder', 
          name: item.name, 
          path: fullPath, 
          birthtime: stats.birthtime 
        };
      } else if (allowedExtensions.includes(path.extname(item.name).toLowerCase())) {
        // Check if a corresponding .flagged file exists
        const flagged = fs.existsSync(fullPath + '.flagged');
        const stats = fs.statSync(fullPath);
        return { 
          type: 'file', 
          name: item.name, 
          path: fullPath, 
          flagged: flagged,
          birthtime: stats.birthtime
        };
      }
      return null;    }).filter(Boolean);
    
    // Sort children consistently: folders first (by birthtime, most recent first), then files by birthtime (most recent first)
    children.sort((a: any, b: any) => {
      if (a.type === 'folder' && b.type === 'file') return -1;
      if (a.type === 'file' && b.type === 'folder') return 1;
      // Both folders or both files - sort by birthtime (most recent first)
      const dateA = a.birthtime ? new Date(a.birthtime).getTime() : 0;
      const dateB = b.birthtime ? new Date(b.birthtime).getTime() : 0;
      return dateB - dateA; // Most recent first
    });
    
    return NextResponse.json({ children });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to read folder' }, { status: 500 });
  }
}
