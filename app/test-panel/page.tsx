'use client';

import React from 'react';
import CollapsibleKnowledgePanel from '../components/knowledge/CollapsibleKnowledgePanel';

export default function TestPanelPage() {
  return (
    <div className="p-8 bg-gray-900 min-h-screen text-white">
      <h1 className="text-2xl font-bold mb-6">Knowledge Panel Test</h1>
      
      <div className="bg-gray-800 p-4 rounded-lg">
        <CollapsibleKnowledgePanel 
          onNodeSelect={(nodeId) => console.log('Node selected:', nodeId)}
          onPatternSelect={(patternId) => console.log('Pattern selected:', patternId)}
        />
      </div>
    </div>
  );
} 