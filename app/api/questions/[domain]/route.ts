import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

import { getAllDomainQuestions } from '@/app/core/questions/questionLoader';
import { KnowledgeDomain } from '@/app/types';

export async function GET(
  request: Request,
  { params }: { params: { domain: string } }
) {
  try {
    const domainParam = params.domain.toUpperCase();
    
    // Validate if the domainParam is a valid key in KnowledgeDomain
    if (!(domainParam in KnowledgeDomain)) {
      return NextResponse.json({ error: 'Invalid domain' }, { status: 400 });
    }

    const domain = domainParam as keyof typeof KnowledgeDomain;
    const questions = await getAllDomainQuestions(KnowledgeDomain[domain]);
    
    if (!questions || questions.length === 0) {
      return NextResponse.json({ 
        error: `No questions found for domain: ${domain}`,
        path: `/data/questions/${KnowledgeDomain[domain].toLowerCase().replace(/_/g, '-')}`
      }, { status: 404 });
    }
    
    return NextResponse.json(questions);
  } catch (error) {
    console.error(`Error fetching questions:`, error);
    return NextResponse.json({ 
      error: `Error fetching questions: ${error instanceof Error ? error.message : String(error)}` 
    }, { status: 500 });
  }
} 