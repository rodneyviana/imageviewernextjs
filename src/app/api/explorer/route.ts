import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const allowedExtensions = [
  '.jpeg', '.jpg', '.png', '.heic', '.wav', '.mp4', '.mpeg'
];

function getFoldersAndFiles(baseFolders: string[], folderNames?: string[]) {
  const result = baseFolders.map((folder, idx) => {
    const name = folderNames && folderNames[idx] ? folderNames[idx] : path.basename(folder);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let children: any[] = [];
    let birthtime: Date | null = null;
    
    try {
      // Get the folder's birthtime for sorting
      const folderStats = fs.statSync(folder);
      birthtime = folderStats.birthtime;
      
      const items = fs.readdirSync(folder, { withFileTypes: true });      children = items.map(item => {
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
            mtime: stats.mtime,
            birthtime: stats.birthtime
          };
        }
        return null;      }).filter(Boolean);
      
      // Sort children consistently: folders first (by birthtime, most recent first), then files by mtime (most recent first)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      children.sort((a: any, b: any) => {
        if (a.type === 'folder' && b.type === 'file') return -1;
        if (a.type === 'file' && b.type === 'folder') return 1;
        if (a.type === 'file' && b.type === 'file') {
          const dateA = a.mtime ? new Date(a.mtime).getTime() : 0;
          const dateB = b.mtime ? new Date(b.mtime).getTime() : 0;
          return dateB - dateA; // Most recent first
        }
        // Both folders - sort by birthtime (most recent first)
        const dateA = a.birthtime ? new Date(a.birthtime).getTime() : 0;
        const dateB = b.birthtime ? new Date(b.birthtime).getTime() : 0;
        return dateB - dateA; // Most recent first
      });
    } catch (e) {
      console.error('Failed to read folder contents:', e);
    }
    return { type: 'folder', name, path: folder, children, birthtime };
  });
  
  // Keep root-level folders in the order specified in environment variables
  // (Do not sort root folders - preserve env var order)
  
  return result;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(req: NextRequest) {
  const folders = process.env.FOLDERS?.split(';') || [];
  const folderNames = process.env.FOLDER_NAMES?.split(';');
  const tree = getFoldersAndFiles(folders, folderNames);
  return NextResponse.json({ tree });
}
