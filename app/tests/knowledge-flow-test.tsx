'use client';

/**
 * Test utility to verify the knowledge discovery flow
 * This is for developer testing only - not part of the game
 */

import React, { useEffect, useState } from 'react';
import { useKnowledgeStore } from '@/app/store/knowledgeStore';
import { ActivityOption, GameEventType, KnowledgeDomain } from '@/app/types';
import { centralEventBus } from '@/app/core/events/CentralEventBus';
import { initializeKnowledgeStore } from '@/app/data/conceptData';

// List of concept IDs used in activities
const ACTIVITY_CONCEPTS = [
  "IMRT_fundamentals",
  "head_neck_treatment",
  "treatment_planning_constraints", 
  "critical_organ_sparing",
  "adaptive_radiotherapy",
  "qa_protocols",
  "isocenter_verification",
  "qa_equipment",
  "SBRT_quality_assurance",
  "small_field_dosimetry",
  "general_knowledge"
];

const KnowledgeFlowTest = () => {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [discoveredConcepts, setDiscoveredConcepts] = useState<string[]>([]);
  
  // Get stars from knowledge store
  const stars = useKnowledgeStore(state => state.stars);
  const discoveredToday = useKnowledgeStore(state => state.discoveredToday);
  const discoverConcept = useKnowledgeStore(state => state.discoverConcept);
  
  // Run the test
  const runConceptTest = () => {
    setTestResults([]);
    
    // Check if all concepts exist in the store
    const results: string[] = [];
    
    results.push(`Knowledge store has ${Object.keys(stars).length} total concepts`);
    results.push("Checking if activity concepts exist in knowledge store...");
    
    ACTIVITY_CONCEPTS.forEach(id => {
      if (stars[id]) {
        results.push(`✅ Concept "${id}" exists in the knowledge store`);
      } else {
        results.push(`❌ Concept "${id}" is missing from the knowledge store`);
      }
    });
    
    setTestResults(results);
  };
  
  // Test concept discovery
  const testDiscoverConcept = (conceptId: string) => {
    if (!stars[conceptId]) {
      setTestResults(prev => [...prev, `❌ Cannot discover "${conceptId}" - not in knowledge store`]);
      return;
    }
    
    // Directly call the knowledge store's discoverConcept method
    discoverConcept(conceptId, 'manual_test');
    
    setDiscoveredConcepts(prev => [...prev, conceptId]);
    setTestResults(prev => [...prev, `✅ Discovered concept "${conceptId}" - check the night phase to verify`]);
  };
  
  // Force initialize the knowledge store
  const forceInitialize = () => {
    initializeKnowledgeStore(useKnowledgeStore);
    setTestResults(prev => [...prev, "🔄 Force initialized knowledge store"]);
    setTimeout(() => {
      runConceptTest();
    }, 100);
  };
  
  // Subscribe to concept events
  useEffect(() => {
    const handleConceptDiscovered = (event: any) => {
      console.log('CONCEPT EVENT:', event);
      
      // Get the current stars from the store
      const stars = useKnowledgeStore.getState().stars;
      
      // Check if this is a concept discovery event
      if (event.payload?.conceptId) {
        // Add to log
        setTestResults(prev => [
          ...prev,
          `🔔 Event: Concept discovered - ${event.payload.conceptId} (${stars[event.payload.conceptId]?.name})`
        ]);
      }
    };
    
    const unsubscribe = centralEventBus.subscribe(
      GameEventType.CONCEPT_DISCOVERED,
      handleConceptDiscovered
    );
    
    return () => unsubscribe();
  }, []);
  
  // Display the current discovered today list
  useEffect(() => {
    setTestResults(prev => [
      ...prev,
      `Current "discoveredToday" list has ${discoveredToday.length} concepts`
    ]);
  }, [discoveredToday]);
  
  return (
    <div className="p-6 bg-gray-900 text-white min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Knowledge Flow Test</h1>
      
      <div className="mb-6">
        <button 
          className="px-4 py-2 bg-blue-600 rounded-md mr-4"
          onClick={runConceptTest}
        >
          Verify Concepts
        </button>
        
        <button 
          className="px-4 py-2 bg-red-600 rounded-md mr-4"
          onClick={forceInitialize}
        >
          Force Initialize
        </button>
        
        <button 
          className="px-4 py-2 bg-indigo-600 rounded-md"
          onClick={() => testDiscoverConcept('IMRT_fundamentals')}
        >
          Discover IMRT Fundamentals
        </button>
      </div>
      
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">All Activity Concepts</h2>
        <div className="grid grid-cols-2 gap-4">
          {ACTIVITY_CONCEPTS.map(id => (
            <button 
              key={id}
              className={`px-3 py-1 rounded-md text-sm ${
                discoveredConcepts.includes(id) 
                  ? 'bg-green-800' 
                  : 'bg-gray-700 hover:bg-gray-600'
              }`}
              onClick={() => testDiscoverConcept(id)}
            >
              {stars[id]?.name || id}
            </button>
          ))}
        </div>
      </div>
      
      <div className="mt-6">
        <h2 className="text-xl font-semibold mb-2">Test Results</h2>
        <div className="bg-gray-800 p-4 rounded-md h-96 overflow-y-auto">
          {testResults.map((result, index) => (
            <div key={index} className="mb-1 font-mono text-sm">
              {result}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default KnowledgeFlowTest; 