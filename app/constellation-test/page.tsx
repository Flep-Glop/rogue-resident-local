'use client';

import SimpleConstellationTest from '@/app/components/debug/SimpleConstellationTest';

export default function ConstellationTestPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Constellation System Test</h1>
      <p className="mb-4 text-gray-300">This is a simplified version of the constellation system for testing and debugging.</p>
      
      <SimpleConstellationTest />
    </div>
  );
} 