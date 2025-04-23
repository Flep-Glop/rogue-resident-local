import React, { useState, useEffect } from 'react';
import { useKnowledgeStore } from '@/app/store/knowledgeStore';
import { safeDispatch } from '@/app/core/events/CentralEventBus';
import { GameEventType } from '@/app/core/events/EventTypes';

/**
 * Debug component to help diagnose issues with knowledge discovery events
 */
export default function KnowledgeDiscoveryDebugger() {
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [conceptsStatus, setConceptsStatus] = useState<string>('');
  const [eventLog, setEventLog] = useState<string[]>([]);
  
  // Get store functions
  const { 
    nodes, 
    discoverConcept, 
    isConceptDiscovered,
    resetKnowledge 
  } = useKnowledgeStore();

  // Listen for KNOWLEDGE_DISCOVERED events
  useEffect(() => {
    const handleKnowledgeDiscovered = (event: any) => {
      const timestamp = new Date().toISOString().substring(11, 23); // HH:MM:SS.sss
      setEventLog(prev => [
        `[${timestamp}] KNOWLEDGE_DISCOVERED - Concept: ${event.conceptId}, Source: ${event.source || 'unknown'}`,
        ...prev.slice(0, 9) // Keep last 10 events
      ]);
    };

    // Subscribe to event
    window.addEventListener(GameEventType.KNOWLEDGE_DISCOVERED, handleKnowledgeDiscovered);
    
    // Log subscription
    console.log('🧪 [KnowledgeDiscoveryDebugger] Added event listener for KNOWLEDGE_DISCOVERED events');

    // Cleanup
    return () => {
      window.removeEventListener(GameEventType.KNOWLEDGE_DISCOVERED, handleKnowledgeDiscovered);
      console.log('🧪 [KnowledgeDiscoveryDebugger] Removed event listener for KNOWLEDGE_DISCOVERED events');
    };
  }, []);

  // Get discovered concepts
  useEffect(() => {
    const discoveredConcepts = nodes.filter(node => node.discovered);
    setConceptsStatus(`
      Total concepts: ${nodes.length}
      Discovered concepts: ${discoveredConcepts.length}
      
      Domain stars:
      - dosimetry: ${isConceptDiscovered('dosimetry') ? 'Discovered' : 'Undiscovered'}
      - treatment-planning: ${isConceptDiscovered('treatment-planning') ? 'Discovered' : 'Undiscovered'}
      - radiation-therapy: ${isConceptDiscovered('radiation-therapy') ? 'Discovered' : 'Undiscovered'}
      - linac-anatomy: ${isConceptDiscovered('linac-anatomy') ? 'Discovered' : 'Undiscovered'}
      
      Important concepts:
      - output-calibration: ${isConceptDiscovered('output-calibration') ? 'Discovered' : 'Undiscovered'}
      - radiation-dosimetry: ${isConceptDiscovered('radiation-dosimetry') ? 'Discovered' : 'Undiscovered'}
    `);
  }, [nodes, isConceptDiscovered]);

  // Function to force reset knowledge and ensure default state is undiscovered
  const handleResetKnowledge = () => {
    try {
      resetKnowledge();
      setStatusMessage('Knowledge system reset successfully. All concepts should now be undiscovered.');
    } catch (error) {
      setStatusMessage(`Error resetting knowledge: ${error}`);
    }
  };

  // Function to manually discover a concept
  const handleDiscoverConcept = (conceptId: string) => {
    try {
      if (!nodes.some(node => node.id === conceptId)) {
        setStatusMessage(`Error: Concept "${conceptId}" does not exist in the knowledge store`);
        return;
      }

      if (isConceptDiscovered(conceptId)) {
        setStatusMessage(`Concept "${conceptId}" is already discovered. Resetting knowledge system first...`);
        resetKnowledge();
      }

      console.log(`🧪 [KnowledgeDiscoveryDebugger] Manually discovering concept: ${conceptId}`);
      discoverConcept(conceptId);
      setStatusMessage(`Concept "${conceptId}" discovery triggered. Check console for KNOWLEDGE_DISCOVERED event logs.`);
    } catch (error) {
      setStatusMessage(`Error discovering concept: ${error}`);
    }
  };

  // Function to manually dispatch a KNOWLEDGE_DISCOVERED event
  const handleManualDispatch = (conceptId: string) => {
    try {
      console.log(`🧪 [KnowledgeDiscoveryDebugger] Manually dispatching KNOWLEDGE_DISCOVERED event for: ${conceptId}`);
      
      const payload = { 
        conceptId, 
        source: 'KnowledgeDiscoveryDebugger.manualDispatch' 
      };
      
      safeDispatch(
        GameEventType.KNOWLEDGE_DISCOVERED,
        payload,
        'KnowledgeDiscoveryDebugger.manualDispatch'
      );
      
      setStatusMessage(`Manually dispatched KNOWLEDGE_DISCOVERED event for "${conceptId}". Check console for event logs.`);
    } catch (error) {
      setStatusMessage(`Error dispatching event: ${error}`);
    }
  };

  // Add this function to test if the FeedbackSystem responds to KNOWLEDGE_DISCOVERED events
  const testFeedbackSystemIntegration = () => {
    try {
      console.log('🧪 [KnowledgeDiscoveryDebugger] Testing FeedbackSystem integration with KNOWLEDGE_DISCOVERED events');
      
      // First reset knowledge to make sure we start clean
      resetKnowledge();
      
      // Create a custom event that should trigger the feedback system
      const testEvent = new CustomEvent(GameEventType.KNOWLEDGE_DISCOVERED, {
        detail: {
          conceptId: 'radiation-dosimetry',
          source: 'KnowledgeDiscoveryDebugger.testFeedbackSystem'
        }
      });
      
      // Dispatch the event
      console.log('🧪 [KnowledgeDiscoveryDebugger] Dispatching test KNOWLEDGE_DISCOVERED event');
      window.dispatchEvent(testEvent);
      
      setStatusMessage('Test event dispatched directly to window. Check if FeedbackSystem responded in console.');
    } catch (error) {
      setStatusMessage(`Error testing FeedbackSystem integration: ${error}`);
    }
  };

  // Add this function after the testFeedbackSystemIntegration function
  const simulateDialogueOptionSelection = () => {
    try {
      console.log('🧪 [KnowledgeDiscoveryDebugger] Simulating dialogue option selection with discoverConcepts');
      
      // First reset knowledge to make sure we start clean
      resetKnowledge();
      
      // Create a mock dialogue option similar to the kapoor-calibration.ts dialogue
      const mockOption = {
        id: "test-dialogue-option",
        text: "Test option text",
        discoverConcepts: ['output-calibration', 'dosimetry'],
        knowledgeGain: { 
          conceptId: 'electron_equilibrium_understood',
          domainId: 'radiation-physics',
          amount: 15
        }
      };
      
      // Log the mock option
      console.log('🧪 [KnowledgeDiscoveryDebugger] Mock dialogue option:', mockOption);
      
      // Get the knowledge store directly
      const knowledgeStore = useKnowledgeStore.getState();
      
      // Process the discoverConcepts from the option (same code as added to ConversationFormat)
      if (mockOption.discoverConcepts && Array.isArray(mockOption.discoverConcepts)) {
        mockOption.discoverConcepts.forEach(conceptId => {
          if (!conceptId) return;
          
          console.log(`🧪 [KnowledgeDiscoveryDebugger] Attempting to discover concept: ${conceptId}`);
          
          // Check if concept already discovered
          if (!knowledgeStore.isConceptDiscovered(conceptId)) {
            // First make sure the concept exists
            const conceptExists = knowledgeStore.nodes.some(node => node.id === conceptId);
            if (!conceptExists) {
              console.warn(`🧪 [KnowledgeDiscoveryDebugger] Concept ${conceptId} doesn't exist, skipping discovery`);
              return;
            }
            
            // Discover the concept
            knowledgeStore.discoverConcept(conceptId);
            console.log(`🧪 [KnowledgeDiscoveryDebugger] Successfully discovered concept: ${conceptId}`);
          } else {
            console.log(`🧪 [KnowledgeDiscoveryDebugger] Concept already discovered: ${conceptId}`);
          }
        });
      }
      
      setStatusMessage('Dialogue option selection simulated. Check console for logs and if KNOWLEDGE_DISCOVERED events were triggered.');
    } catch (error) {
      setStatusMessage(`Error simulating dialogue option: ${error}`);
    }
  };

  return (
    <div className="p-4 bg-gray-800 text-white rounded-lg max-w-2xl mx-auto my-4">
      <h2 className="text-xl font-bold mb-4">Knowledge Discovery Debugger</h2>
      
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">Concepts Status:</h3>
        <pre className="bg-gray-900 p-3 rounded text-sm whitespace-pre-wrap">
          {conceptsStatus}
        </pre>
      </div>
      
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">KNOWLEDGE_DISCOVERED Event Log:</h3>
        <pre className="bg-gray-900 p-3 rounded text-sm whitespace-pre-wrap h-32 overflow-y-auto">
          {eventLog.length > 0 ? eventLog.join('\n') : 'No events detected yet'}
        </pre>
      </div>
      
      <div className="mb-4 grid grid-cols-1 gap-2">
        <h3 className="text-lg font-semibold">Actions:</h3>
        
        <button 
          onClick={handleResetKnowledge}
          className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
        >
          Reset Knowledge System
        </button>
        
        <h4 className="mt-2">Discover Domain Stars:</h4>
        <div className="grid grid-cols-2 gap-2">
          <button 
            onClick={() => handleDiscoverConcept('dosimetry')}
            className="bg-pink-600 hover:bg-pink-700 text-white font-bold py-2 px-4 rounded"
          >
            Discover "dosimetry"
          </button>
          
          <button 
            onClick={() => handleDiscoverConcept('treatment-planning')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Discover "treatment-planning"
          </button>
        </div>
        
        <h4 className="mt-2">Discover Important Concepts:</h4>
        <div className="grid grid-cols-2 gap-2">
          <button 
            onClick={() => handleDiscoverConcept('output-calibration')}
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
          >
            Discover "output-calibration"
          </button>
          
          <button 
            onClick={() => handleDiscoverConcept('radiation-dosimetry')}
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
          >
            Discover "radiation-dosimetry"
          </button>
        </div>
        
        <h4 className="mt-2">Manual Event Dispatch (Bypass Store):</h4>
        <div className="grid grid-cols-2 gap-2">
          <button 
            onClick={() => handleManualDispatch('dosimetry')}
            className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded"
          >
            Dispatch for "dosimetry"
          </button>
          
          <button 
            onClick={() => handleManualDispatch('output-calibration')}
            className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded"
          >
            Dispatch for "output-calibration"
          </button>
        </div>
        
        <h4 className="mt-2">Test FeedbackSystem Integration:</h4>
        <div className="grid grid-cols-1 gap-2">
          <button 
            onClick={testFeedbackSystemIntegration}
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded"
          >
            Test FeedbackSystem Response
          </button>
        </div>

        <h4 className="mt-2">Test Dialogue Integration:</h4>
        <div className="grid grid-cols-1 gap-2">
          <button 
            onClick={simulateDialogueOptionSelection}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded"
          >
            Simulate Dialogue Option
          </button>
        </div>
      </div>
      
      <div className="mt-4">
        <h3 className="text-lg font-semibold mb-2">Status:</h3>
        <div className="bg-gray-900 p-3 rounded">
          {statusMessage || "No actions performed yet"}
        </div>
      </div>
    </div>
  );
} 