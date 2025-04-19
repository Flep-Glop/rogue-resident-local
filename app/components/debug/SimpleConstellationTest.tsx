'use client';

import React, { useState, useEffect, useRef } from 'react';
import useKnowledgeStore, { KnowledgeDomain } from '@/app/store/knowledgeStore';
import { detectPatterns } from '@/app/components/knowledge/ConstellationPatternSystem';
import { DOMAIN_COLORS } from '@/app/core/themeConstants';
import { SIMPLE_PATTERNS } from './SimplePatterns';
import ConstellationD3Visualization from './ConstellationD3Visualization';

/**
 * A minimal constellation system test component
 * Strips down functionality to test core mechanics in isolation
 */
export default function SimpleConstellationTest() {
  // Use store and state
  const {
    nodes,
    connections,
    discoverConcept,
    updateMastery,
    createConnection,
    addStarPoints,
    resetConnections: storeResetConnections,
    starPoints
  } = useKnowledgeStore();

  const [testLog, setTestLog] = useState<string[]>([]);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [connectionSource, setConnectionSource] = useState<string | null>(null);
  const [patternStats, setPatternStats] = useState<{
    id: string;
    name: string;
    completions: number;
    spEarned: number;
  }[]>(SIMPLE_PATTERNS.map(p => ({
    id: p.id,
    name: p.name,
    completions: 0,
    spEarned: 0
  })));

  // Log function for test results - expanded capacity
  const log = (message: string) => {
    setTestLog(prev => [message, ...prev.slice(0, 29)]); // Keep last 30 messages instead of 10
  };

  // Clear log function
  const clearLog = () => {
    setTestLog([]);
    log('Log cleared');
  };

  // Get only core stars (orbit 0) and first level stars (orbit 1)
  const simplifiedNodes = nodes.filter(n => n.orbit === 0 || n.orbit === 1);
  
  // Group by domain for organization
  const nodesByDomain: Record<KnowledgeDomain, typeof nodes> = {
    'treatment-planning': [],
    'radiation-therapy': [],
    'linac-anatomy': [],
    'dosimetry': []
  };
  
  simplifiedNodes.forEach(node => {
    if (nodesByDomain[node.domain]) {
      nodesByDomain[node.domain].push(node);
    }
  });

  // Simple custom pattern detection test
  const testPatternDetection = () => {
    const discoveredNodes = nodes.filter(n => n.discovered);
    
    // Check if any of our simplified patterns are complete
    const completePatterns = [];
    
    for (const pattern of SIMPLE_PATTERNS) {
      // Check if all stars in the pattern are discovered
      const allStarsDiscovered = pattern.starIds.every(id => 
        discoveredNodes.some(n => n.id === id)
      );
      
      // Check if all stars are connected in some way
      let allConnected = true;
      if (allStarsDiscovered) {
        // For each pair of stars, check if they're connected
        for (let i = 0; i < pattern.starIds.length; i++) {
          const source = pattern.starIds[i];
          const target = pattern.starIds[(i + 1) % pattern.starIds.length];
          
          const connected = connections.some(c => 
            (c.source === source && c.target === target) || 
            (c.source === target && c.target === source)
          );
          
          if (!connected) {
            allConnected = false;
            break;
          }
        }
      } else {
        allConnected = false;
      }
      
      if (allStarsDiscovered && allConnected) {
        completePatterns.push(pattern);
      }
    }
    
    if (completePatterns.length > 0) {
      log(`✅ Custom pattern detected: ${completePatterns.map(p => p.name).join(', ')}`);
      // Award SP for each pattern
      completePatterns.forEach(pattern => {
        if (pattern.reward.type === 'sp') {
          const spAmount = Number(pattern.reward.value);
          addStarPoints(spAmount, 'pattern');
          log(`Awarded ${spAmount} SP for completing pattern: ${pattern.name}`);
          
          // Update pattern stats
          setPatternStats(prev => prev.map(stat => 
            stat.id === pattern.id 
              ? {
                  ...stat,
                  completions: stat.completions + 1,
                  spEarned: stat.spEarned + spAmount
                }
              : stat
          ));
        }
      });
    } else {
      log('❌ No custom patterns detected');
    }
  };

  // Test the SP economy
  const testAddSP = () => {
    const amount = 10;
    addStarPoints(amount, 'test');
    log(`Added ${amount} SP. Total: ${starPoints + amount}`);
  };

  // Check which patterns are potentially formable with discovered nodes
  const analyzePotentialPatterns = () => {
    const discoveredNodes = nodes.filter(n => n.discovered);
    const discoveredNodeIds = discoveredNodes.map(n => n.id);
    
    // Check each pattern to see how close we are to completing it
    const potentialPatterns = SIMPLE_PATTERNS.map(pattern => {
      const requiredStars = pattern.starIds;
      const discoveredRequiredStars = requiredStars.filter(id => 
        discoveredNodeIds.includes(id)
      );
      
      const progress = discoveredRequiredStars.length / requiredStars.length;
      const missingStars = requiredStars.filter(id => !discoveredNodeIds.includes(id));
      
      return {
        patternId: pattern.id,
        name: pattern.name,
        progress: Math.round(progress * 100),
        discovered: discoveredRequiredStars.length,
        required: requiredStars.length,
        missing: missingStars.map(id => {
          const node = nodes.find(n => n.id === id);
          return node ? node.name : id;
        })
      };
    });
    
    // Sort by completeness (most complete first)
    potentialPatterns.sort((a, b) => b.progress - a.progress);
    
    // Log the patterns
    if (potentialPatterns.length > 0) {
      potentialPatterns.forEach(p => {
        log(`Pattern "${p.name}": ${p.progress}% complete (${p.discovered}/${p.required} stars)`);
        if (p.missing.length > 0) {
          log(`Missing: ${p.missing.join(', ')}`);
        }
      });
    } else {
      log('No patterns configured in the system');
    }
  };

  // Handle node discovery
  const handleDiscover = (nodeId: string) => {
    discoverConcept(nodeId);
    log(`Discovered node: ${nodes.find(n => n.id === nodeId)?.name}`);
  };

  // Handle mastery update
  const handleUpdateMastery = (nodeId: string, amount: number) => {
    updateMastery(nodeId, amount);
    const newMastery = nodes.find(n => n.id === nodeId)?.mastery;
    log(`Updated mastery for ${nodes.find(n => n.id === nodeId)?.name} to ${newMastery}%`);
  };

  // Handle connection creation
  const handleConnection = (nodeId: string) => {
    if (!connectionSource) {
      setConnectionSource(nodeId);
      log(`Selected source: ${nodes.find(n => n.id === nodeId)?.name}`);
    } else if (connectionSource !== nodeId) {
      createConnection(connectionSource, nodeId);
      log(`Connected: ${nodes.find(n => n.id === connectionSource)?.name} → ${nodes.find(n => n.id === nodeId)?.name}`);
      setConnectionSource(null);
    } else {
      setConnectionSource(null);
      log('Connection canceled');
    }
  };

  // Create a test pattern by connecting the core nodes for ALARA safety triangle
  const setupTestPattern = () => {
    // Get the node IDs for the ALARA safety triangle
    const alaraPattern = SIMPLE_PATTERNS.find(p => p.id === 'simple-alara-triangle');
    
    if (!alaraPattern) {
      log('ALARA pattern definition not found');
      return;
    }
    
    const patternNodeIds = alaraPattern.starIds;
    const patternNodes = patternNodeIds
      .map(id => nodes.find(n => n.id === id))
      .filter(n => n !== undefined);
    
    if (patternNodes.length !== patternNodeIds.length) {
      log('Some nodes for ALARA pattern not found in the system:');
      patternNodeIds.forEach(id => {
        const exists = nodes.some(n => n.id === id);
        log(`Node ${id}: ${exists ? 'Found' : 'Not found'}`);
      });
      return;
    }
    
    // Discover all pattern nodes first if not already discovered
    patternNodes.forEach(node => {
      if (node && !node.discovered) {
        discoverConcept(node.id);
        log(`Discovered node: ${node.name}`);
      }
    });
    
    // Set mastery to enable connections
    patternNodes.forEach(node => {
      if (node && node.mastery < 25) {
        updateMastery(node.id, 25);
        log(`Set mastery for ${node.name} to at least 25%`);
      }
    });
    
    // Connect all nodes in the pattern in a circuit
    if (patternNodes.length >= 3) {
      for (let i = 0; i < patternNodes.length; i++) {
        const source = patternNodes[i];
        const target = patternNodes[(i + 1) % patternNodes.length]; // Loop back to first node
        
        if (source && target) {
          // Check if connection already exists
          const connectionExists = connections.some(
            c => (c.source === source.id && c.target === target.id) || 
                 (c.source === target.id && c.target === source.id)
          );
          
          if (!connectionExists) {
            createConnection(source.id, target.id);
            log(`Created connection: ${source.name} → ${target.name}`);
          }
        }
      }
      
      log('ALARA pattern setup complete - check pattern detection');
    } else {
      log('Not enough nodes for ALARA pattern');
    }
  };

  // Create a test pattern for Quality Verification Circle
  const setupQACirclePattern = () => {
    // Get the node IDs for the QA Circle
    const qaPattern = SIMPLE_PATTERNS.find(p => p.id === 'simple-qa-circle');
    
    if (!qaPattern) {
      log('QA Circle pattern definition not found');
      return;
    }
    
    const patternNodeIds = qaPattern.starIds;
    const patternNodes = patternNodeIds
      .map(id => nodes.find(n => n.id === id))
      .filter(n => n !== undefined);
    
    if (patternNodes.length !== patternNodeIds.length) {
      log('Some nodes for QA Circle pattern not found in the system:');
      patternNodeIds.forEach(id => {
        const exists = nodes.some(n => n.id === id);
        log(`Node ${id}: ${exists ? 'Found' : 'Not found'}`);
      });
      return;
    }
    
    // Discover all pattern nodes first if not already discovered
    patternNodes.forEach(node => {
      if (node && !node.discovered) {
        discoverConcept(node.id);
        log(`Discovered node: ${node.name}`);
      }
    });
    
    // Set mastery to enable connections
    patternNodes.forEach(node => {
      if (node && node.mastery < 25) {
        updateMastery(node.id, 25);
        log(`Set mastery for ${node.name} to at least 25%`);
      }
    });
    
    // Connect all nodes in the pattern in a circuit
    if (patternNodes.length >= 3) {
      for (let i = 0; i < patternNodes.length; i++) {
        const source = patternNodes[i];
        const target = patternNodes[(i + 1) % patternNodes.length]; // Loop back to first node
        
        if (source && target) {
          // Check if connection already exists
          const connectionExists = connections.some(
            c => (c.source === source.id && c.target === target.id) || 
                 (c.source === target.id && c.target === source.id)
          );
          
          if (!connectionExists) {
            createConnection(source.id, target.id);
            log(`Created connection: ${source.name} → ${target.name}`);
          }
        }
      }
      
      log('QA Circle pattern setup complete - check pattern detection');
    } else {
      log('Not enough nodes for QA Circle pattern');
    }
  };

  // Create a test pattern for Treatment Delivery Chain
  const setupTreatmentDeliveryPattern = () => {
    // Get the node IDs for the Treatment Delivery Chain
    const treatmentPattern = SIMPLE_PATTERNS.find(p => p.id === 'simple-treatment-chain');
    
    if (!treatmentPattern) {
      log('Treatment Delivery Chain pattern definition not found');
      return;
    }
    
    setupSpecificPattern(treatmentPattern, 'Treatment Delivery Chain');
  };

  // Create a test pattern for Plan Optimization Diamond
  const setupOptimizationPattern = () => {
    // Get the node IDs for the Plan Optimization Diamond
    const optPattern = SIMPLE_PATTERNS.find(p => p.id === 'simple-plan-optimization');
    
    if (!optPattern) {
      log('Plan Optimization Diamond pattern definition not found');
      return;
    }
    
    setupSpecificPattern(optPattern, 'Plan Optimization Diamond');
  };

  // Generic pattern setup helper
  const setupSpecificPattern = (pattern: SimplePattern, patternName: string) => {
    const patternNodeIds = pattern.starIds;
    const patternNodes = patternNodeIds
      .map(id => nodes.find(n => n.id === id))
      .filter(n => n !== undefined);
    
    if (patternNodes.length !== patternNodeIds.length) {
      log(`Some nodes for ${patternName} pattern not found in the system:`);
      patternNodeIds.forEach(id => {
        const exists = nodes.some(n => n.id === id);
        log(`Node ${id}: ${exists ? 'Found' : 'Not found'}`);
      });
      return;
    }
    
    // Discover all pattern nodes first if not already discovered
    patternNodes.forEach(node => {
      if (node && !node.discovered) {
        discoverConcept(node.id);
        log(`Discovered node: ${node.name}`);
      }
    });
    
    // Set mastery to enable connections
    patternNodes.forEach(node => {
      if (node && node.mastery < 25) {
        updateMastery(node.id, 25);
        log(`Set mastery for ${node.name} to at least 25%`);
      }
    });
    
    // Connect all nodes based on the pattern formation
    if (pattern.formation === 'circuit' || pattern.formation === 'triangle') {
      // For circuits and triangles, connect in a loop
      if (patternNodes.length >= 3) {
        for (let i = 0; i < patternNodes.length; i++) {
          const source = patternNodes[i];
          const target = patternNodes[(i + 1) % patternNodes.length]; // Loop back to first node
          
          if (source && target) {
            createConnectionIfNeeded(source, target);
          }
        }
      }
    } else if (pattern.formation === 'chain') {
      // For chains, connect linearly
      if (patternNodes.length >= 2) {
        for (let i = 0; i < patternNodes.length - 1; i++) {
          const source = patternNodes[i];
          const target = patternNodes[i + 1];
          
          if (source && target) {
            createConnectionIfNeeded(source, target);
          }
        }
      }
    } else if (pattern.formation === 'star') {
      // For stars, connect first node to all others
      if (patternNodes.length >= 2) {
        const center = patternNodes[0];
        for (let i = 1; i < patternNodes.length; i++) {
          const ray = patternNodes[i];
          
          if (center && ray) {
            createConnectionIfNeeded(center, ray);
          }
        }
      }
    }
    
    log(`${patternName} pattern setup complete - check pattern detection`);
  };

  // Helper to create connection if it doesn't exist
  const createConnectionIfNeeded = (source: ConceptNode, target: ConceptNode) => {
    // Check if connection already exists
    const connectionExists = connections.some(
      c => (c.source === source.id && c.target === target.id) || 
           (c.source === target.id && c.target === source.id)
    );
    
    if (!connectionExists) {
      createConnection(source.id, target.id);
      log(`Created connection: ${source.name} → ${target.name}`);
    } else {
      log(`Connection already exists: ${source.name} ↔ ${target.name}`);
    }
  };

  // Add visual representation of connections
  const ConnectionsDisplay = () => {
    const discoveredConnections = connections.filter(c => c.discovered);
    if (discoveredConnections.length === 0) return null;
    
    // Group connections by pattern
    const connectionsByPattern: Record<string, ConceptConnection[]> = {};
    discoveredConnections.forEach(conn => {
      // Try to find which pattern this connection might belong to
      for (const pattern of SIMPLE_PATTERNS) {
        const hasSource = pattern.starIds.includes(conn.source);
        const hasTarget = pattern.starIds.includes(conn.target);
        
        if (hasSource && hasTarget) {
          if (!connectionsByPattern[pattern.id]) {
            connectionsByPattern[pattern.id] = [];
          }
          // Only add if not already in the list
          if (!connectionsByPattern[pattern.id].some(c => 
            (c.source === conn.source && c.target === conn.target) ||
            (c.source === conn.target && c.target === conn.source)
          )) {
            connectionsByPattern[pattern.id].push(conn);
          }
        }
      }
    });
    
    return (
      <div className="mt-4">
        <h3 className="font-bold text-xl mb-2">Connection Graph</h3>
        <div className="space-y-4">
          {Object.entries(connectionsByPattern).map(([patternId, conns]) => {
            const pattern = SIMPLE_PATTERNS.find(p => p.id === patternId);
            if (!pattern) return null;
            
            return (
              <div key={patternId} className="bg-gray-800 p-3 rounded-md">
                <h4 className="font-bold text-md mb-1">{pattern.name}</h4>
                <div className="text-xs text-gray-400 mb-2">Formation: {pattern.formation}</div>
                <div className="flex flex-wrap gap-2">
                  {pattern.starIds.map(id => {
                    const node = nodes.find(n => n.id === id);
                    if (!node) return null;
                    
                    const isDiscovered = node.discovered;
                    return (
                      <div 
                        key={id} 
                        className={`px-2 py-1 rounded ${isDiscovered ? 'bg-blue-900' : 'bg-gray-700 text-gray-400'}`}
                      >
                        {node.name}
                      </div>
                    );
                  })}
                </div>
                <div className="mt-2 text-sm">
                  Completion: {conns.length}/{Math.ceil(pattern.starIds.length * 1.5)} connections
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Show node IDs for debugging - in focused chunks
  const showNodeIds = () => {
    // Check for specific nodes we're interested in for our patterns
    const patternKeyNodes = [
      "treatment-planning", "radiation-therapy", "radiation-dosimetry", 
      "patient-positioning", "output-calibration", "delivery-techniques", 
      "treatment-protocols", "target-volumes", "multi-criteria-optimization",
      "dose-constraints", "plan-evaluation", "dvh-analysis"
    ];
    
    log('--- PATTERN KEY NODES ---');
    patternKeyNodes.forEach(id => {
      const node = nodes.find(n => n.id === id);
      if (node) {
        const status = node.discovered ? 'Discovered' : 'Locked';
        const mastery = node.discovered ? `${node.mastery}%` : 'N/A';
        log(`✓ ${node.name}: "${node.id}" (${status}, Mastery: ${mastery})`);
      } else {
        log(`✗ Missing node: "${id}"`);
      }
    });
    
    // Show discovered nodes and their connections
    const discoveredNodes = nodes.filter(n => n.discovered);
    log(`--- DISCOVERED NODES (${discoveredNodes.length}) ---`);
    discoveredNodes.forEach(node => {
      const connCount = connections.filter(
        c => (c.source === node.id || c.target === node.id) && c.discovered
      ).length;
      log(`${node.name}: "${node.id}" (Mastery: ${node.mastery}%, Connections: ${connCount})`);
    });
  };
  
  // Show detailed domain info for one domain at a time
  const showDomainNodes = (domainKey: KnowledgeDomain) => {
    log(`--- ${domainKey.toUpperCase()} NODES ---`);
    const domainNodes = nodes.filter(n => n.domain === domainKey);
    
    if (domainNodes.length === 0) {
      log(`No nodes found in domain: ${domainKey}`);
      return;
    }
    
    // Group by orbit
    const byOrbit: Record<number, ConceptNode[]> = {};
    domainNodes.forEach(node => {
      if (!byOrbit[node.orbit]) byOrbit[node.orbit] = [];
      byOrbit[node.orbit].push(node);
    });
    
    // Show sorted by orbit
    Object.entries(byOrbit).forEach(([orbit, orbitNodes]) => {
      log(`[Orbit ${orbit}]`);
      orbitNodes.forEach(node => {
        const status = node.discovered ? 'Discovered' : 'Locked';
        const mastery = node.discovered ? `${node.mastery}%` : 'N/A';
        log(`  ${node.name}: "${node.id}" (${status}, Mastery: ${mastery})`);
      });
    });
  };

  // Clear all discovered connections
  const resetConnections = () => {
    // Call the store method to reset connections
    storeResetConnections();
    log('All connections have been reset');
    
    // Refresh the UI to show changes
    analyzePotentialPatterns();
  };

  // Pattern Visualization Component
  const PatternVisualization = () => {
    const [selectedPattern, setSelectedPattern] = useState<string | null>(null);
    
    const getDisplayPattern = () => {
      if (!selectedPattern) return null;
      return SIMPLE_PATTERNS.find(p => p.id === selectedPattern);
    };
    
    const displayPattern = getDisplayPattern();
    
    // Calculate connection status for the selected pattern
    const getPatternConnectionStatus = (pattern: SimplePattern) => {
      const results: {
        nodeId: string;
        nodeName: string;
        discovered: boolean;
        connections: {
          targetId: string;
          targetName: string;
          connected: boolean;
        }[];
      }[] = [];
      
      // For each node in the pattern
      pattern.starIds.forEach(nodeId => {
        const node = nodes.find(n => n.id === nodeId);
        if (!node) return;
        
        const nodeConnections: {
          targetId: string;
          targetName: string;
          connected: boolean;
        }[] = [];
        
        // Check connections to other nodes in the pattern
        pattern.starIds.forEach(targetId => {
          if (nodeId === targetId) return; // Skip self
          
          const targetNode = nodes.find(n => n.id === targetId);
          if (!targetNode) return;
          
          const isConnected = connections.some(c => 
            ((c.source === nodeId && c.target === targetId) || 
             (c.source === targetId && c.target === nodeId)) && c.discovered
          );
          
          nodeConnections.push({
            targetId,
            targetName: targetNode.name,
            connected: isConnected
          });
        });
        
        results.push({
          nodeId,
          nodeName: node.name,
          discovered: node.discovered,
          connections: nodeConnections
        });
      });
      
      return results;
    };
    
    return (
      <div className="mt-4 bg-gray-800 p-3 rounded-md">
        <h3 className="font-bold mb-2">Pattern Visualization</h3>
        
        <div className="flex flex-wrap gap-2 mb-3">
          {SIMPLE_PATTERNS.map(pattern => (
            <button
              key={pattern.id}
              className={`px-3 py-1 text-sm rounded ${
                selectedPattern === pattern.id 
                  ? 'bg-purple-700 ring-2 ring-purple-300' 
                  : 'bg-purple-900 hover:bg-purple-800'
              }`}
              onClick={() => setSelectedPattern(pattern.id)}
            >
              {pattern.name}
            </button>
          ))}
        </div>
        
        {displayPattern && (
          <div className="bg-gray-900 p-3 rounded-md">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h4 className="font-bold text-md">{displayPattern.name}</h4>
                <div className="text-sm text-gray-400">{displayPattern.description}</div>
                <div className="text-xs text-gray-500 mt-1">Formation: {displayPattern.formation}</div>
              </div>
              <div className="bg-purple-900 px-2 py-1 rounded text-xs">
                {displayPattern.reward.value} SP
              </div>
            </div>
            
            <div className="mt-3">
              <h5 className="text-sm font-bold mb-1">Pattern Structure:</h5>
              <div className="space-y-2">
                {getPatternConnectionStatus(displayPattern).map(node => (
                  <div key={node.nodeId} className="bg-gray-800 p-2 rounded-md">
                    <div className={`text-sm font-medium ${node.discovered ? 'text-white' : 'text-gray-500'}`}>
                      {node.nodeName} {!node.discovered && '(Locked)'}
                    </div>
                    
                    {node.connections.length > 0 && (
                      <div className="mt-1 pl-3 space-y-1">
                        {node.connections.map(conn => (
                          <div key={conn.targetId} className="text-xs flex items-center">
                            <span className={`mr-2 ${conn.connected ? 'text-green-400' : 'text-gray-500'}`}>
                              {conn.connected ? '✓' : '○'}
                            </span>
                            <span className="text-gray-300">Connection to {conn.targetName}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Pattern Statistics Component 
  const PatternStats = () => {
    const totalCompletions = patternStats.reduce((sum, stat) => sum + stat.completions, 0);
    const totalSP = patternStats.reduce((sum, stat) => sum + stat.spEarned, 0);
    
    return (
      <div className="mt-4 bg-gray-800 p-3 rounded-md">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-bold">Pattern Completion Statistics</h3>
          <div className="text-xs bg-indigo-900 px-2 py-1 rounded">
            Total: {totalCompletions} completions ({totalSP} SP)
          </div>
        </div>
        
        <div className="space-y-2">
          {patternStats.map(stat => (
            <div key={stat.id} className="bg-gray-900 p-2 rounded-md">
              <div className="flex justify-between items-center">
                <div className="text-sm font-medium">{stat.name}</div>
                <div className="text-xs bg-gray-800 px-2 py-1 rounded">
                  {stat.completions} × {getPatternReward(stat.id)} SP
                </div>
              </div>
              {stat.completions > 0 && (
                <div className="mt-1 h-1 bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-indigo-500 rounded-full"
                    style={{ width: `${Math.min(100, stat.completions * 20)}%` }}
                  ></div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  // Helper to get pattern reward value
  const getPatternReward = (patternId: string): number => {
    const pattern = SIMPLE_PATTERNS.find(p => p.id === patternId);
    return pattern && pattern.reward.type === 'sp' 
      ? Number(pattern.reward.value)
      : 0;
  };

  return (
    <div className="p-4 bg-gray-900 text-white rounded-lg overflow-auto">
      <h2 className="text-xl font-bold mb-4">Simple Constellation Test</h2>
      
      {/* Control Panel */}
      <div className="bg-gray-800 p-3 rounded-md mb-4 flex flex-wrap gap-2">
        <button 
          onClick={testPatternDetection}
          className="px-3 py-1 bg-indigo-600 rounded"
        >
          Test Pattern Detection
        </button>
        <button 
          onClick={testAddSP}
          className="px-3 py-1 bg-yellow-600 rounded"
        >
          Add 10 SP
        </button>
        <button 
          onClick={showNodeIds}
          className="px-3 py-1 bg-gray-600 rounded"
        >
          Show Key Nodes
        </button>
        <button 
          onClick={clearLog}
          className="px-3 py-1 bg-red-600 rounded"
        >
          Clear Log
        </button>
        <button 
          onClick={resetConnections}
          className="px-3 py-1 bg-rose-800 rounded"
        >
          Reset Connections
        </button>
        <div className="px-3 py-1 bg-gray-700 rounded">
          SP: {starPoints}
        </div>
      </div>
      
      {/* Stats & Pattern Management Row */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <PatternStats />
        
        {/* Pattern Setup Panel */}
        <div className="bg-gray-800 p-3 rounded-md">
          <h3 className="font-bold mb-2">Pattern Setup</h3>
          <div className="flex flex-wrap gap-2">
            <button 
              onClick={analyzePotentialPatterns}
              className="px-3 py-1 bg-purple-600 rounded text-sm"
            >
              Analyze All Patterns
            </button>
            <button 
              onClick={setupQACirclePattern}
              className="px-3 py-1 bg-teal-600 rounded text-sm"
            >
              Setup QA Circle
            </button>
            <button 
              onClick={setupTestPattern}
              className="px-3 py-1 bg-green-600 rounded text-sm"
            >
              Setup ALARA Triangle
            </button>
            <button 
              onClick={setupTreatmentDeliveryPattern}
              className="px-3 py-1 bg-blue-600 rounded text-sm"
            >
              Setup Treatment Chain
            </button>
            <button 
              onClick={setupOptimizationPattern}
              className="px-3 py-1 bg-pink-600 rounded text-sm"
            >
              Setup Optimization Circuit
            </button>
          </div>
        </div>
      </div>
      
      {/* Domain inspection */}
      <div className="bg-gray-800 p-3 rounded-md mb-4 flex flex-wrap gap-2">
        <div className="text-sm text-gray-400 mr-2 flex items-center">Domain IDs:</div>
        <button 
          onClick={() => showDomainNodes('treatment-planning')}
          className="px-3 py-1 text-sm rounded"
          style={{ backgroundColor: DOMAIN_COLORS['treatment-planning'] }}
        >
          Treatment Planning
        </button>
        <button 
          onClick={() => showDomainNodes('radiation-therapy')}
          className="px-3 py-1 text-sm rounded"
          style={{ backgroundColor: DOMAIN_COLORS['radiation-therapy'] }}
        >
          Radiation Therapy
        </button>
        <button 
          onClick={() => showDomainNodes('linac-anatomy')}
          className="px-3 py-1 text-sm rounded"
          style={{ backgroundColor: DOMAIN_COLORS['linac-anatomy'] }}
        >
          Linac Anatomy
        </button>
        <button 
          onClick={() => showDomainNodes('dosimetry')}
          className="px-3 py-1 text-sm rounded"
          style={{ backgroundColor: DOMAIN_COLORS['dosimetry'] }}
        >
          Dosimetry
        </button>
      </div>
      
      {/* Status Messages */}
      <div className="mb-4 h-80 overflow-y-auto bg-black/50 p-2 rounded-md text-sm">
        <div className="flex justify-between items-center mb-1">
          <h3 className="font-bold text-gray-400">Test Log:</h3>
          <span className="text-xs text-gray-500">{testLog.length} entries</span>
        </div>
        {testLog.map((msg, i) => (
          <div key={i} className="mb-1 border-b border-gray-800 pb-1">{msg}</div>
        ))}
        {testLog.length === 0 && (
          <div className="text-gray-500">No actions yet</div>
        )}
      </div>
      
      {/* Connection Graph Visualization */}
      <ConstellationD3Visualization />
      
      {/* Connection Graph Display */}
      <ConnectionsDisplay />
      
      {/* Simplified Stars Display */}
      <div className="grid grid-cols-4 gap-4 mt-4">
        {Object.entries(nodesByDomain).map(([domain, domainNodes]) => (
          <div key={domain} className="bg-gray-800 p-3 rounded-md">
            <h3 className="font-bold mb-2" style={{ color: DOMAIN_COLORS[domain as KnowledgeDomain] }}>
              {domain}
            </h3>
            
            <div className="space-y-2">
              {domainNodes.map(node => (
                <div 
                  key={node.id}
                  className={`p-2 rounded-md cursor-pointer text-sm ${
                    node.discovered ? 'bg-gray-700' : 'bg-gray-800 text-gray-500'
                  } ${
                    selectedNode === node.id ? 'ring-2 ring-blue-500' : ''
                  } ${
                    connectionSource === node.id ? 'ring-2 ring-yellow-500' : ''
                  }`}
                  onClick={() => setSelectedNode(node.id)}
                >
                  <div className="flex justify-between">
                    <span>{node.name}</span>
                    <span className="text-xs bg-gray-900 px-1 rounded">
                      {node.discovered ? `${node.mastery}%` : 'Locked'}
                    </span>
                  </div>
                  
                  {selectedNode === node.id && (
                    <div className="mt-2 grid grid-cols-2 gap-1 text-xs">
                      {!node.discovered ? (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDiscover(node.id);
                          }}
                          className="col-span-2 p-1 bg-green-800 rounded hover:bg-green-700"
                        >
                          Discover
                        </button>
                      ) : (
                        <>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUpdateMastery(node.id, 10);
                            }}
                            className="p-1 bg-blue-800 rounded hover:bg-blue-700"
                          >
                            +10% Mastery
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleConnection(node.id);
                            }}
                            className={`p-1 rounded hover:bg-yellow-700 ${
                              connectionSource === node.id ? 'bg-yellow-800' : 'bg-orange-800'
                            }`}
                          >
                            {connectionSource === node.id ? 'Cancel' : 'Connect'}
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      
      {/* Connection Display */}
      <div className="mt-4 bg-gray-800 p-3 rounded-md">
        <h3 className="font-bold mb-2">Connections ({connections.filter(c => c.discovered).length})</h3>
        <div className="grid grid-cols-1 gap-1">
          {connections.filter(c => c.discovered).map(conn => {
            const source = nodes.find(n => n.id === conn.source);
            const target = nodes.find(n => n.id === conn.target);
            
            return (
              <div key={`${conn.source}-${conn.target}`} className="text-sm bg-gray-700 p-2 rounded-md">
                <div className="flex justify-between">
                  <span>{source?.name} → {target?.name}</span>
                  <span className="text-xs bg-gray-900 px-1 rounded">
                    {Math.round(conn.strength)}% strength
                  </span>
                </div>
              </div>
            );
          })}
          
          {connections.filter(c => c.discovered).length === 0 && (
            <div className="text-gray-500 text-sm">No connections yet</div>
          )}
        </div>
      </div>
      
      {/* Pattern Visualization Component */}
      <PatternVisualization />
    </div>
  );
} 