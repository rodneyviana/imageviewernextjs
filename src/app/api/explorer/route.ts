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
    let children: any[] = [];
    try {
      const items = fs.readdirSync(folder, { withFileTypes: true });      children = items.map(item => {
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
        return null;      }).filter(Boolean);
      
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
    } catch (e) {
      // ignore errors for missing folders
    }
    return { type: 'folder', name, path: folder, children };
  });
  return result;
}

export async function GET(req: NextRequest) {
  const folders = process.env.FOLDERS?.split(';') || [];
  const folderNames = process.env.FOLDER_NAMES?.split(';');
  const tree = getFoldersAndFiles(folders, folderNames);
  return NextResponse.json({ tree });
}
