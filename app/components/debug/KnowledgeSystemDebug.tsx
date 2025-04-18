'use client';

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import useKnowledgeStore from '@/app/store/knowledgeStore';
import { safeDispatch } from '@/app/core/events/CentralEventBus';
import { GameEventType } from '@/app/core/events/EventTypes';

/**
 * Debug component for testing and monitoring the knowledge system
 * Shows discovered concepts and provides buttons to test concept discovery
 * Optimized for performance and memory usage
 */
export default function KnowledgeSystemDebug() {
  // Local state
  const [testConceptId, setTestConceptId] = useState('');
  const [testAmount, setTestAmount] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDomain, setSelectedDomain] = useState('all');
  const [expandedView, setExpandedView] = useState<string | null>(null);
  
  // Use primitive selectors to reduce rerenders
  const nodes = useKnowledgeStore(state => state.nodes);
  const discoverConcept = useKnowledgeStore(state => state.discoverConcept);
  const updateMastery = useKnowledgeStore(state => state.updateMastery);
  const domainMastery = useKnowledgeStore(state => state.domainMastery);
  const totalMastery = useKnowledgeStore(state => state.totalMastery);
  
  // Calculate derived data with proper memoization
  const discoveredCount = useMemo(() => 
    nodes.filter(node => node.discovered).length, 
  [nodes]);
  
  // Get unique domains to avoid duplicate key errors
  const domains = useMemo(() => {
    const uniqueDomains = new Set<string>();
    nodes.forEach(node => uniqueDomains.add(node.domain));
    return Array.from(uniqueDomains);
  }, [nodes]);
  
  // Filter only undiscovered nodes for dropdown
  const availableConcepts = useMemo(() => 
    nodes
      .filter(node => !node.discovered)
      .slice(0, 100) // Limit to first 100 to avoid memory issues
      .map(node => ({
        id: node.id,
        name: node.name
      })),
  [nodes]);
  
  // Get discovered nodes with filtering
  const discoveredNodes = useMemo(() => {
    const filtered = nodes.filter(node => 
      node.discovered && 
      (searchQuery === '' || 
       node.name.toLowerCase().includes(searchQuery.toLowerCase())) &&
      (selectedDomain === 'all' || node.domain === selectedDomain)
    );
    
    // Sort by mastery and limit to 50
    return filtered
      .sort((a, b) => b.mastery - a.mastery)
      .slice(0, 50);
  }, [nodes, searchQuery, selectedDomain]);
  
  // Get undiscovered nodes with filtering
  const undiscoveredNodes = useMemo(() => {
    if (!searchQuery && selectedDomain === 'all') return []; // Don't load when not searching
    
    const filtered = nodes.filter(node => 
      !node.discovered &&
      (searchQuery === '' || 
       node.name.toLowerCase().includes(searchQuery.toLowerCase())) &&
      (selectedDomain === 'all' || node.domain === selectedDomain)
    );
    
    // Sort alphabetically and limit to 20
    return filtered
      .sort((a, b) => a.name.localeCompare(b.name))
      .slice(0, 20);
  }, [nodes, searchQuery, selectedDomain]);
  
  // Set initial concept if needed
  useEffect(() => {
    if (availableConcepts.length > 0 && !testConceptId) {
      setTestConceptId(availableConcepts[0].id);
    }
  }, [availableConcepts, testConceptId]);

  // Handle concept discovery via event
  const handleDiscoverConcept = useCallback(() => {
    if (!testConceptId) return;
    
    // Check if concept exists
    const conceptExists = nodes.some(node => node.id === testConceptId);
    if (!conceptExists) {
      console.warn(`Concept with ID ${testConceptId} doesn't exist, cannot discover`);
      return;
    }
    
    safeDispatch(
      GameEventType.KNOWLEDGE_GAINED,
      {
        conceptId: testConceptId,
        amount: parseInt(testAmount.toString(), 10) || 0,
        source: 'debug-panel'
      },
      'KnowledgeSystemDebug'
    );
  }, [testConceptId, testAmount, nodes]);

  // Handle direct discovery
  const handleDirectDiscover = useCallback((conceptId: string) => {
    discoverConcept(conceptId);
    setExpandedView(null); // Close expanded view after action
  }, [discoverConcept]);

  // Handle mastery update
  const handleUpdateMastery = useCallback((conceptId: string, amount: number) => {
    updateMastery(conceptId, amount);
  }, [updateMastery]);

  return (
    <div className="p-3 bg-gray-900 text-white rounded-lg max-h-[80vh] overflow-auto text-sm">
      <h2 className="text-lg font-bold mb-3 flex items-center justify-between">
        <span>Knowledge System</span>
        <span className="text-xs bg-blue-900 px-2 py-1 rounded-md">
          {discoveredCount} / {nodes.length}
        </span>
      </h2>
      
      {/* Compact metrics row */}
      <div className="grid grid-cols-5 gap-1 mb-3 text-xs bg-gray-800 p-2 rounded">
        <div className="col-span-1">
          <div className="font-semibold">Total</div>
          <div className="text-green-400">{totalMastery}%</div>
        </div>
        {Object.entries(domainMastery).map(([domain, value], idx) => (
          <div key={`domain-${idx}-${domain}`} className="col-span-1">
            <div className="font-semibold">{domain.split('-')[0]}</div>
            <div className="text-green-400">{value}%</div>
          </div>
        ))}
      </div>
      
      {/* Test tools */}
      <div className="mb-3 bg-gray-800 p-2 rounded">
        <h3 className="text-sm font-semibold mb-1">Test Discovery</h3>
        <div className="grid grid-cols-3 gap-1">
          <select
            value={testConceptId}
            onChange={(e) => setTestConceptId(e.target.value)}
            className="p-1 bg-gray-700 rounded text-xs"
          >
            <option value="">Select concept</option>
            {availableConcepts.map((concept, idx) => (
              <option key={`concept-${idx}-${concept.id}`} value={concept.id}>
                {concept.name}
              </option>
            ))}
          </select>
          
          <input
            type="number"
            value={testAmount}
            onChange={(e) => setTestAmount(parseInt(e.target.value, 10) || 0)}
            placeholder="Mastery"
            className="p-1 bg-gray-700 rounded text-xs"
          />
          
          <button 
            onClick={handleDiscoverConcept} 
            className="p-1 bg-blue-600 rounded hover:bg-blue-700 transition-colors text-xs"
            disabled={!testConceptId}
          >
            Discover
          </button>
        </div>
      </div>
      
      {/* Filter controls */}
      <div className="mb-2 grid grid-cols-4 gap-1">
        <div className="col-span-3">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search concepts..."
            className="p-1 bg-gray-700 rounded w-full text-xs"
          />
        </div>
        
        <div className="col-span-1">
          <select
            value={selectedDomain}
            onChange={(e) => setSelectedDomain(e.target.value)}
            className="p-1 bg-gray-700 rounded w-full text-xs"
          >
            <option value="all">All</option>
            {domains.map((domain, idx) => (
              <option key={`domain-opt-${idx}-${domain}`} value={domain}>
                {domain}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Discovered concepts - using index in keys for safety */}
      {discoveredNodes.length > 0 && (
        <div className="mb-2">
          <h3 className="text-sm font-semibold mb-1 text-green-400">
            Discovered ({discoveredNodes.length})
          </h3>
          <div className="grid grid-cols-1 gap-1 max-h-[25vh] overflow-y-auto pr-1">
            {discoveredNodes.map((node, idx) => (
              <div 
                key={`discovered-${idx}-${node.id}`}
                className={`p-1 bg-gray-800 rounded border cursor-pointer text-xs hover:bg-gray-750 ${
                  expandedView === node.id ? 'border-blue-500' : 'border-green-800'
                }`}
                onClick={() => setExpandedView(expandedView === node.id ? null : node.id)}
              >
                <div className="flex justify-between items-center">
                  <div className="font-medium">{node.name} ({node.mastery}%)</div>
                  <div className="text-xs text-gray-400">{node.domain}</div>
                </div>
                
                {expandedView === node.id && (
                  <div className="mt-1 text-xs bg-gray-850 p-1 rounded">
                    <div className="mb-1 text-gray-300 text-xs">{node.description}</div>
                    <div className="grid grid-cols-3 gap-1 mt-1">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUpdateMastery(node.id, 10);
                        }} 
                        className="p-1 bg-green-900 rounded hover:bg-green-800 transition-colors text-xs"
                      >
                        +10%
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUpdateMastery(node.id, 25);
                        }} 
                        className="p-1 bg-green-900 rounded hover:bg-green-800 transition-colors text-xs"
                      >
                        +25%
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUpdateMastery(node.id, -10);
                        }} 
                        className="p-1 bg-red-900 rounded hover:bg-red-800 transition-colors text-xs"
                      >
                        -10%
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Undiscovered concepts - only when searching or filtering */}
      {undiscoveredNodes.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-1 text-gray-400">
            Undiscovered ({undiscoveredNodes.length})
          </h3>
          <div className="grid grid-cols-1 gap-1 max-h-[15vh] overflow-y-auto pr-1">
            {undiscoveredNodes.map((node, idx) => (
              <div 
                key={`undiscovered-${idx}-${node.id}`}
                className={`p-1 bg-gray-800 rounded border cursor-pointer text-xs hover:bg-gray-750 ${
                  expandedView === node.id ? 'border-blue-500' : 'border-gray-700'
                }`}
                onClick={() => setExpandedView(expandedView === node.id ? null : node.id)}
              >
                <div className="flex justify-between items-center">
                  <div className="font-medium">{node.name}</div>
                  <div className="text-xs text-gray-400">{node.domain}</div>
                </div>
                
                {expandedView === node.id && (
                  <div className="mt-1 text-xs bg-gray-850 p-1 rounded">
                    <div className="mb-1 text-gray-300 text-xs">{node.description}</div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDirectDiscover(node.id);
                      }} 
                      className="mt-1 p-1 bg-blue-900 rounded hover:bg-blue-800 transition-colors text-xs"
                    >
                      Discover
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 