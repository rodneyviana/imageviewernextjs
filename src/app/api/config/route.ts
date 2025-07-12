import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    // Try multiple config locations in order of preference
    const configPaths = [
      process.env.CONFIG_PATH, // Environment variable override
      path.join(process.cwd(), 'data', 'runtime-config.json'), // Local data directory
      '/etc/imageviewer/config.json', // System-wide config
      path.join(process.cwd(), 'runtime-config.json') // Fallback to root
    ].filter(Boolean);

    let config = null;
    
    for (const configPath of configPaths) {
      if (fs.existsSync(configPath!)) {
        config = JSON.parse(fs.readFileSync(configPath!, 'utf8'));
        break;
      }
    }
    
    if (config) {
      return NextResponse.json(config);
    }
    
    // Fallback to environment variables
    const folders = process.env.FOLDERS?.split(';') || [];
    const folderNames = process.env.FOLDER_NAMES?.split(';') || [];
    
    return NextResponse.json({
      folders,
      folderNames: folderNames.length === folders.length ? folderNames : folders
    });
  } catch (error) {
    console.error('Failed to load configuration:', error);
    return NextResponse.json({ error: 'Failed to load configuration' }, { status: 500 });
  }
}
