import { NextResponse } from 'next/server';

export const runtime = 'edge';

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
    
    // Create the URL to the file in the public directory
    const url = new URL(request.url);
    const baseUrl = `${url.protocol}//${url.host}`;
    const fileUrl = `${baseUrl}/data/questions/${dirName}/${filename}`;
    
    // Fetch the file
    const response = await fetch(fileUrl);
    
    if (!response.ok) {
      return NextResponse.json({ 
        error: `File not found: ${fileUrl}`, 
        status: response.status 
      }, { status: 404 });
    }
    
    // Parse the JSON data
    const jsonData = await response.json();
    
    return NextResponse.json(jsonData);
  } catch (error) {
    console.error(`Error loading question file:`, error);
    return NextResponse.json({ 
      error: `Error loading question file: ${error instanceof Error ? error.message : String(error)}` 
    }, { status: 500 });
  }
} 