'use client';

import { useEffect, useState } from 'react';
import KnowledgeFlowTest from './knowledge-flow-test';
import { initializeKnowledgeStore } from '@/app/data/conceptData';
import { useKnowledgeStore } from '@/app/store/knowledgeStore';

export default function TestPage() {
  const [initialized, setInitialized] = useState(false);

  // Force initialization of knowledge store when the test page loads
  useEffect(() => {
    // Force initialize the knowledge store with all concepts
    initializeKnowledgeStore(useKnowledgeStore);
    setInitialized(true);
  }, []);

  if (!initialized) {
    return <div className="p-6 bg-gray-900 text-white">Initializing knowledge store...</div>;
  }

  return <KnowledgeFlowTest />;
} 