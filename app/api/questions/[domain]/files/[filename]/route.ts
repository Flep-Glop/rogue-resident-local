import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

import fs from 'fs';
import path from 'path';
import { KnowledgeDomain } from '@/app/types';

export async function GET(
  request: Request,
  { params }: { params: { domain: string, filename: string } }
) {
  try {
    const domainParam = params.domain.toLowerCase();
    const filename = params.filename;
    
    // Map domain param to directory name
    let dirName = '';
    switch(domainParam) {
      case 'dosimetry':
        dirName = 'dosimetry';
        break;
      case 'linac_anatomy':
        dirName = 'linac-anatomy';
        break;
      case 'radiation_therapy':
        dirName = 'radiation-therapy';
        break;
      case 'treatment_planning':
        dirName = 'treatment-planning';
        break;
      default:
        return NextResponse.json({ error: 'Invalid domain' }, { status: 400 });
    }
    
    // Validate filename
    if (!['beginner.json', 'intermediate.json', 'advanced.json', 'banks.json'].includes(filename)) {
      return NextResponse.json({ error: 'Invalid filename' }, { status: 400 });
    }
    
    // Get the absolute path to the question file
    const publicDir = path.join(process.cwd(), 'public');
    const filePath = path.join(publicDir, 'data', 'questions', dirName, filename);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ 
        error: `File not found: ${filePath}` 
      }, { status: 404 });
    }
    
    // Read the file content
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const jsonData = JSON.parse(fileContent);
    
    return NextResponse.json(jsonData);
  } catch (error) {
    console.error(`Error loading question file:`, error);
    return NextResponse.json({ 
      error: `Error loading question file: ${error instanceof Error ? error.message : String(error)}` 
    }, { status: 500 });
  }
} 