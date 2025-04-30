'use client';

import React, { useState, useEffect } from 'react';
import useKnowledgeStore from '@/app/store/knowledgeStore';
import { KnowledgeDomain } from '@/app/store/knowledgeStore';
import { DOMAIN_COLORS } from '@/app/core/themeConstants';
import { findAllPotentialConnections } from '@/app/data/concepts/medical-physics-connections';

/**
 * Test component for the Automatic Connection System.
 * This component allows testing of:
 * - Auto connection creation between unlocked stars
 * - Connection mastery updates and thresholds
 * - Connection visualization
 */
export default function AutoConnectionTester() {
  const { 
    nodes, 
    connections, 
    unlockConcept, 
    setConceptActivation, 
    updateConnectionMastery,
    createConnection,
    isConceptDiscovered,
    isConceptUnlocked,
    isConceptActive,
    discoverConcept
  } = useKnowledgeStore();
  
  const [selectedDomain, setSelectedDomain] = useState<KnowledgeDomain>('dosimetry');
  const [showConnections, setShowConnections] = useState(true);
  const [testMessages, setTestMessages] = useState<string[]>([]);
  
  // Add a test message
  const addMessage = (message: string) => {
    setTestMessages(prev => [message, ...prev].slice(0, 10));
  };
  
  // Get nodes for the selected domain
  const domainNodes = nodes.filter(n => n.domain === selectedDomain);
  
  // Get connections involving nodes in the selected domain
  const domainConnections = connections.filter(conn => {
    const sourceNode = nodes.find(n => n.id === conn.source);
    const targetNode = nodes.find(n => n.id === conn.target);
    return (sourceNode?.domain === selectedDomain || targetNode?.domain === selectedDomain);
  });
  
  // Function to discover multiple concepts at once
  const discoverMultiple = () => {
    // Discover 3 random concepts from the selected domain
    const undiscoveredNodes = domainNodes.filter(n => !n.discovered);
    
    if (undiscoveredNodes.length === 0) {
      addMessage(`All concepts in ${selectedDomain} are already discovered`);
      return;
    }
    
    // Shuffle array and take first 3
    const toDiscover = undiscoveredNodes
      .sort(() => Math.random() - 0.5)
      .slice(0, Math.min(3, undiscoveredNodes.length));
    
    // Discover each one
    toDiscover.forEach(node => {
      discoverConcept(node.id);
    });
    
    addMessage(`Discovered ${toDiscover.length} concepts in ${selectedDomain}`);
  };
  
  // Function to unlock multiple concepts at once
  const unlockMultiple = () => {
    // Unlock 3 random discovered but not unlocked concepts from the selected domain
    const discoverButNotUnlocked = domainNodes.filter(n => n.discovered && !n.unlocked);
    
    if (discoverButNotUnlocked.length === 0) {
      addMessage(`No discovered but unlocked concepts in ${selectedDomain}`);
      return;
    }
    
    // Shuffle array and take first 3
    const toUnlock = discoverButNotUnlocked
      .sort(() => Math.random() - 0.5)
      .slice(0, Math.min(3, discoverButNotUnlocked.length));
    
    // Unlock each one
    let unlockCount = 0;
    toUnlock.forEach(node => {
      if (unlockConcept(node.id)) {
        unlockCount++;
      }
    });
    
    addMessage(`Unlocked ${unlockCount} concepts in ${selectedDomain}`);
    
    // Check for potential connections
    const unlockedNodeIds = nodes.filter(n => n.unlocked).map(n => n.id);
    const potentialConnections = findAllPotentialConnections(unlockedNodeIds);
    
    addMessage(`Found ${potentialConnections.length} potential connections between unlocked stars`);
  };
  
  // Function to modify connection mastery
  const updateRandomConnectionMastery = (amount: number) => {
    if (domainConnections.length === 0) {
      addMessage('No connections available to update');
      return;
    }
    
    // Pick a random connection
    const randomConnection = domainConnections[Math.floor(Math.random() * domainConnections.length)];
    const oldStrength = randomConnection.strength;
    
    // Update its mastery
    updateConnectionMastery(randomConnection.source, randomConnection.target, amount);
    
    // Find node names for better messaging
    const sourceNode = nodes.find(n => n.id === randomConnection.source);
    const targetNode = nodes.find(n => n.id === randomConnection.target);
    
    addMessage(`Updated connection ${sourceNode?.name || randomConnection.source} → ${targetNode?.name || randomConnection.target} from ${oldStrength.toFixed(1)}% to ${Math.min(100, oldStrength + amount).toFixed(1)}%`);
  };
  
  // Function to toggle activation for multiple nodes
  const toggleActivationMultiple = (activate: boolean) => {
    // Activate 3 random unlocked stars
    const unlocked = domainNodes.filter(n => n.unlocked);
    
    if (unlocked.length === 0) {
      addMessage(`No unlocked concepts in ${selectedDomain}`);
      return;
    }
    
    // Shuffle array and take first 3
    const toActivate = unlocked
      .sort(() => Math.random() - 0.5)
      .slice(0, Math.min(3, unlocked.length));
    
    // Set activation state
    toActivate.forEach(node => {
      setConceptActivation(node.id, activate);
    });
    
    addMessage(`${activate ? 'Activated' : 'Deactivated'} ${toActivate.length} concepts in ${selectedDomain}`);
  };
  
  return (
    <div className="p-4 bg-gray-900 rounded-lg shadow-lg">
      <h2 className="text-xl font-bold text-white mb-4">Auto Connection Tester</h2>
      
      <div className="mb-4">
        <label className="block text-gray-300 mb-2">Domain:</label>
        <div className="flex space-x-2">
          {(Object.keys(DOMAIN_COLORS) as KnowledgeDomain[]).map(domain => (
            <button
              key={domain}
              className={`px-3 py-1 rounded ${selectedDomain === domain ? 'bg-blue-600' : 'bg-gray-700'}`}
              onClick={() => setSelectedDomain(domain)}
            >
              {domain.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
            </button>
          ))}
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white mb-2">Concept Actions</h3>
          <div className="space-y-2">
            <button
              className="w-full px-3 py-2 bg-indigo-700 hover:bg-indigo-600 rounded"
              onClick={discoverMultiple}
            >
              Discover Random Concepts
            </button>
            <button
              className="w-full px-3 py-2 bg-indigo-700 hover:bg-indigo-600 rounded"
              onClick={unlockMultiple}
            >
              Unlock Random Concepts
            </button>
            <button
              className="w-full px-3 py-2 bg-green-700 hover:bg-green-600 rounded"
              onClick={() => toggleActivationMultiple(true)}
            >
              Activate Random Stars
            </button>
            <button
              className="w-full px-3 py-2 bg-red-700 hover:bg-red-600 rounded"
              onClick={() => toggleActivationMultiple(false)}
            >
              Deactivate All Stars
            </button>
          </div>
        </div>
        
        <div>
          <h3 className="text-lg font-semibold text-white mb-2">Connection Actions</h3>
          <div className="space-y-2">
            <button
              className="w-full px-3 py-2 bg-purple-700 hover:bg-purple-600 rounded"
              onClick={() => updateRandomConnectionMastery(5)}
            >
              Update Random Connection +5%
            </button>
            <button
              className="w-full px-3 py-2 bg-purple-700 hover:bg-purple-600 rounded"
              onClick={() => updateRandomConnectionMastery(15)}
            >
              Update Random Connection +15%
            </button>
            <button
              className="w-full px-3 py-2 bg-purple-700 hover:bg-purple-600 rounded"
              onClick={() => updateRandomConnectionMastery(30)}
            >
              Update Random Connection +30%
            </button>
            <button
              className="w-full px-3 py-2 bg-blue-700 hover:bg-blue-600 rounded"
              onClick={() => setShowConnections(!showConnections)}
            >
              {showConnections ? 'Hide' : 'Show'} Connections
            </button>
          </div>
        </div>
      </div>
      
      {showConnections && (
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-white mb-2">Domain Connections ({domainConnections.length})</h3>
          <div className="max-h-48 overflow-y-auto bg-gray-800 p-2 rounded">
            {domainConnections.length === 0 ? (
              <p className="text-gray-400">No connections in this domain</p>
            ) : (
              domainConnections.map(conn => {
                const sourceNode = nodes.find(n => n.id === conn.source);
                const targetNode = nodes.find(n => n.id === conn.target);
                if (!sourceNode || !targetNode) return null;
                
                // Get mastery tier
                let masteryTier = "Low";
                let tierColor = "text-gray-400";
                if (conn.strength > 70) {
                  masteryTier = "High";
                  tierColor = "text-green-400";
                } else if (conn.strength > 30) {
                  masteryTier = "Medium";
                  tierColor = "text-blue-400";
                }
                
                return (
                  <div key={`${conn.source}-${conn.target}`} className="mb-1 border-b border-gray-700 pb-1">
                    <div className="flex justify-between">
                      <div className="flex items-center">
                        <div 
                          className="w-2 h-2 rounded-full mr-1" 
                          style={{ backgroundColor: DOMAIN_COLORS[sourceNode.domain] }}
                        ></div>
                        <span className="text-white">{sourceNode.name}</span>
                        <span className="mx-1 text-gray-400">→</span>
                        <div 
                          className="w-2 h-2 rounded-full mr-1" 
                          style={{ backgroundColor: DOMAIN_COLORS[targetNode.domain] }}
                        ></div>
                        <span className="text-white">{targetNode.name}</span>
                      </div>
                      <div className="flex items-center">
                        <span className={`text-xs mr-2 ${tierColor}`}>{masteryTier}</span>
                        <span className="text-gray-300">{Math.round(conn.strength)}%</span>
                      </div>
                    </div>
                    
                    <div className="w-full bg-gray-700 rounded-full h-1 mt-1">
                      <div
                        className={`h-1 rounded-full ${
                          conn.strength > 70 ? 'bg-green-500' : 
                          conn.strength > 30 ? 'bg-blue-500' : 
                          'bg-gray-500'
                        }`}
                        style={{ width: `${Math.round(conn.strength)}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
      
      <div>
        <h3 className="text-lg font-semibold text-white mb-2">Test Messages</h3>
        <div className="bg-black p-2 rounded max-h-32 overflow-y-auto">
          {testMessages.length === 0 ? (
            <p className="text-gray-400">No test activity yet</p>
          ) : (
            testMessages.map((msg, i) => (
              <div key={i} className="text-gray-300 text-sm mb-1">
                {msg}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
} 