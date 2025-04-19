'use client';

import React, { useState } from 'react';
import ConstellationView from '../components/knowledge/ConstellationView';

export default function MasteryDashboardPage() {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedPatternId, setSelectedPatternId] = useState<string | null>(null);
  
  return (
    <div className="mastery-dashboard flex flex-col min-h-screen bg-gray-950 text-white">
      <header className="p-4 bg-black bg-opacity-50">
        <h1 className="text-2xl font-bold">Knowledge Mastery Dashboard</h1>
      </header>
      
      <main className="flex-grow p-4 lg:p-6">
        <div className="h-full relative">
          <ConstellationView 
            fullscreen={false}
            activeNodes={selectedNodeId ? [selectedNodeId] : []}
            nightMode={true}
            showLabels={true}
            interactive={true}
            showKnowledgePanel={true}
          />
        </div>
      </main>
    </div>
  );
} 