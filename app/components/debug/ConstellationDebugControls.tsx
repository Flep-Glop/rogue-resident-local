// app/components/debug/ConstellationDebugControls.tsx
import React, { useState, useCallback, useEffect } from 'react';
import useKnowledgeStore, { KNOWLEDGE_DOMAINS, KnowledgeDomain } from '@/app/store/knowledgeStore';
import { useStableCallback } from '@/app/core/utils/storeHooks';
import constellationVisualizationControl from '@/app/components/knowledge/ConstellationVisualizationControl';
import { detectPatterns, ConstellationPattern } from '@/app/components/knowledge/ConstellationPatternSystem';
import { applyOrbitalQuadrantLayout, buildDomainAngles } from '@/app/components/knowledge/ConstellationLayout';

interface ConstellationDebugControlsProps {
  showFeedback: (message: string, type: 'success' | 'error' | 'info') => void;
}

/**
 * Debug controls specifically for manipulating the constellation visualization
 * - Toggle node discovery
 * - Set mastery levels
 * - Create connections
 * - Toggle shooting stars
 */
export default function ConstellationDebugControls({ 
  showFeedback 
}: ConstellationDebugControlsProps) {
  // Local state for preview settings
  const [allDiscovered, setAllDiscovered] = useState(false);
  const [masteryLevel, setMasteryLevel] = useState<number>(0);
  const [allConnections, setAllConnections] = useState(false);
  const [showShootingStars, setShowShootingStars] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState<string>('all');

  // Setup sync with visualization control
  useVisualizationControlSync(
    setAllDiscovered,
    setMasteryLevel,
    setAllConnections,
    setShowShootingStars
  );

  // Handle discovering a specific number of nodes
  const handleDiscoverNodes = useStableCallback((count: number | null) => {
    try {
      const knowledgeStore = useKnowledgeStore.getState();
      const nodes = knowledgeStore.nodes;
      
      // If count is null, we're resetting discoveries
      if (count === null) {
        setAllDiscovered(false);
        constellationVisualizationControl.toggleDiscovery(false);
        knowledgeStore.resetKnowledge();
        showFeedback('Knowledge reset to initial state', 'info');
        return;
      }
      
      // Get undiscovered nodes
      const undiscoveredNodes = nodes.filter(node => !node.discovered);
      
      // If there are no undiscovered nodes, show a message
      if (undiscoveredNodes.length === 0) {
        showFeedback('All nodes are already discovered', 'info');
        return;
      }
      
      // Determine how many nodes to discover
      const nodesToDiscover = count === -1 
        ? undiscoveredNodes 
        : undiscoveredNodes.slice(0, count);
      
      // Discover the nodes
      let discoveredCount = 0;
      
      nodesToDiscover.forEach(node => {
        knowledgeStore.discoverConcept(node.id);
        discoveredCount++;
      });
      
      // If we discovered all nodes, update the state
      if (count === -1 || nodesToDiscover.length === undiscoveredNodes.length) {
        setAllDiscovered(true);
        constellationVisualizationControl.toggleDiscovery(true);
      }
      
      const message = count === -1 
        ? `All nodes discovered (${discoveredCount} new)` 
        : `${discoveredCount} nodes discovered`;
      
      showFeedback(message, 'success');
    } catch (error) {
      console.error('Error discovering nodes:', error);
      showFeedback('Error discovering nodes', 'error');
    }
  });

  // Handle connecting a specific number of node pairs
  const handleConnectNodes = useStableCallback((count: number | null) => {
    try {
      const knowledgeStore = useKnowledgeStore.getState();
      const nodes = knowledgeStore.nodes;
      const connections = knowledgeStore.connections;
      
      // If count is null, we're resetting connections
      if (count === null) {
        setAllConnections(false);
        constellationVisualizationControl.toggleConnections(false);
        knowledgeStore.resetKnowledge();
        showFeedback('Knowledge reset to initial state', 'info');
        return;
      }
      
      // Track pairs to avoid duplicates
      const processedPairs = new Set<string>();
      
      // Get discovered nodes
      const discoveredNodes = nodes.filter(node => node.discovered);
      
      // Create a list of potential connections (node pairs that aren't already connected)
      const potentialConnections: { source: string, target: string }[] = [];
      
      discoveredNodes.forEach(node => {
        discoveredNodes.forEach(targetNode => {
          if (node.id !== targetNode.id) {
            // Create a unique key for the node pair
            const pairKey = [node.id, targetNode.id].sort().join('-');
            
            // Skip if we've already processed this pair
            if (processedPairs.has(pairKey)) return;
            processedPairs.add(pairKey);
            
            // Check if connection already exists
            const connectionExists = connections.some(
              conn => (conn.source === node.id && conn.target === targetNode.id) ||
                     (conn.source === targetNode.id && conn.target === node.id)
            );
            
            // Add to potential connections if not already connected
            if (!connectionExists) {
              potentialConnections.push({ 
                source: node.id, 
                target: targetNode.id 
              });
            }
          }
        });
      });
      
      // If there are no potential connections, show a message
      if (potentialConnections.length === 0) {
        showFeedback('All possible connections already exist', 'info');
        return;
      }
      
      // Determine how many connections to create
      const connectionsToCreate = count === -1 
        ? potentialConnections 
        : potentialConnections.slice(0, count);
      
      // Create the connections
      let connectionCount = 0;
      
      connectionsToCreate.forEach(conn => {
        knowledgeStore.createConnection(conn.source, conn.target);
        connectionCount++;
      });
      
      // If we connected all possible connections, update the state
      if (count === -1 || connectionsToCreate.length === potentialConnections.length) {
        setAllConnections(true);
        constellationVisualizationControl.toggleConnections(true);
      }
      
      const message = count === -1 
        ? `All possible connections created (${connectionCount} new)` 
        : `${connectionCount} connections created`;
      
      showFeedback(message, 'success');
    } catch (error) {
      console.error('Error connecting nodes:', error);
      showFeedback('Error connecting nodes', 'error');
    }
  });

  // State for detected patterns
  const [detectedPatterns, setDetectedPatterns] = useState<ConstellationPattern[]>([]);
  
  // Handle pattern detection
  const handleDetectPatterns = useStableCallback(() => {
    try {
      const knowledgeStore = useKnowledgeStore.getState();
      const { nodes, connections } = knowledgeStore;
      
      // Use the pattern detection system
      const discoveredPatternIds = new Set<string>();
      const { newPatterns, allComplete } = detectPatterns(nodes, connections, discoveredPatternIds);
      
      // Update state with detected patterns
      setDetectedPatterns(allComplete);
      
      if (newPatterns.length > 0) {
        showFeedback(`Detected ${newPatterns.length} new patterns!`, 'success');
      } else if (allComplete.length > 0) {
        showFeedback(`${allComplete.length} patterns complete`, 'info');
      } else {
        showFeedback('No patterns detected', 'info');
      }
    } catch (error) {
      console.error('Error detecting patterns:', error);
      showFeedback('Error detecting patterns', 'error');
    }
  });
  
  // Handle adding Star Points
  const handleAddStarPoints = useStableCallback((amount: number) => {
    try {
      const knowledgeStore = useKnowledgeStore.getState();
      
      // Add the specified amount of star points
      knowledgeStore.addStarPoints(amount);
      
      showFeedback(`Added ${amount} Star Points`, 'success');
    } catch (error) {
      console.error('Error adding star points:', error);
      showFeedback('Error adding star points', 'error');
    }
  });
  
  // Apply orbital-quadrant layout
  const handleApplyLayout = useStableCallback(() => {
    try {
      const knowledgeStore = useKnowledgeStore.getState();
      const { nodes } = knowledgeStore;
      
      // Build domain angles from KNOWLEDGE_DOMAINS
      const domainAngles = buildDomainAngles(KNOWLEDGE_DOMAINS);
      
      // Apply the orbital-quadrant layout to all nodes
      const layoutedNodes = applyOrbitalQuadrantLayout(nodes, domainAngles);
      
      // Import the updated nodes back into the store
      knowledgeStore.importKnowledgeData({ nodes: layoutedNodes });
      
      showFeedback('Applied orbital-quadrant layout', 'success');
    } catch (error) {
      console.error('Error applying layout:', error);
      showFeedback('Error applying layout', 'error');
    }
  });

  // Domain selector
  const renderDomainSelector = () => {
    const domains: string[] = [
      'all',
      // New medical physics domains as per documentation
      'treatment-planning',
      'radiation-therapy',
      'linac-anatomy',
      'dosimetry',
      // Legacy domains kept for backward compatibility
      'radiation-physics', 
      'quality-assurance', 
      'clinical-practice', 
      'radiation-protection', 
      'technical', 
      'theoretical',
      'general'
    ];
    
    return (
      <div className="mb-3">
        <label className="block text-xs mb-1 text-gray-300">Domain Filter:</label>
        <select 
          className="w-full bg-gray-700 text-white text-xs rounded px-2 py-1 border border-gray-600"
          value={selectedDomain}
          onChange={(e) => setSelectedDomain(e.target.value)}
        >
          {domains.map(domain => (
            <option key={domain} value={domain}>
              {domain === 'all' 
                ? 'All Domains' 
                : domain === 'treatment-planning' ? 'Treatment Planning'
                : domain === 'radiation-therapy' ? 'Radiation Therapy'
                : domain === 'linac-anatomy' ? 'Linac Anatomy'
                : domain === 'dosimetry' ? 'Dosimetry'
                : domain.replace('-', ' ')}
            </option>
          ))}
        </select>
      </div>
    );
  };

  return (
    <div className="p-3 bg-gray-800/80 rounded-md">
      <h3 className="font-pixel text-sm mb-2 text-blue-400">Constellation Debug</h3>
      
      {/* Domain selector */}
      {renderDomainSelector()}
      
      {/* Discovery buttons */}
      <div className="mb-3">
        <h4 className="text-xs mb-1 text-gray-300">Discover Stars:</h4>
        <div className="grid grid-cols-4 gap-2">
          <button
            className="px-2 py-1 text-xs rounded pixel-button bg-blue-600 hover:bg-blue-500 text-white"
            onClick={() => handleDiscoverNodes(1)}
          >
            1 Star
          </button>
          <button
            className="px-2 py-1 text-xs rounded pixel-button bg-blue-600 hover:bg-blue-500 text-white"
            onClick={() => handleDiscoverNodes(5)}
          >
            5 Stars
          </button>
          <button
            className="px-2 py-1 text-xs rounded pixel-button bg-blue-600 hover:bg-blue-500 text-white"
            onClick={() => handleDiscoverNodes(10)}
          >
            10 Stars
          </button>
          <button
            className={`px-2 py-1 text-xs rounded pixel-button ${
              allDiscovered ? 'bg-green-600 hover:bg-green-500' : 'bg-blue-600 hover:bg-blue-500'
            } text-white`}
            onClick={() => allDiscovered ? handleDiscoverNodes(null) : handleDiscoverNodes(-1)}
          >
            {allDiscovered ? 'Reset' : 'All'}
          </button>
        </div>
      </div>
      
      {/* Connection buttons */}
      <div className="mb-3">
        <h4 className="text-xs mb-1 text-gray-300">Connect Stars:</h4>
        <div className="grid grid-cols-4 gap-2">
          <button
            className="px-2 py-1 text-xs rounded pixel-button bg-blue-600 hover:bg-blue-500 text-white"
            onClick={() => handleConnectNodes(1)}
          >
            1 Conn
          </button>
          <button
            className="px-2 py-1 text-xs rounded pixel-button bg-blue-600 hover:bg-blue-500 text-white"
            onClick={() => handleConnectNodes(5)}
          >
            5 Conn
          </button>
          <button
            className="px-2 py-1 text-xs rounded pixel-button bg-blue-600 hover:bg-blue-500 text-white"
            onClick={() => handleConnectNodes(10)}
          >
            10 Conn
          </button>
          <button
            className={`px-2 py-1 text-xs rounded pixel-button ${
              allConnections ? 'bg-orange-600 hover:bg-orange-500' : 'bg-blue-600 hover:bg-blue-500'
            } text-white`}
            onClick={() => allConnections ? handleConnectNodes(null) : handleConnectNodes(-1)}
          >
            {allConnections ? 'Reset' : 'All'}
          </button>
        </div>
      </div>
      
      {/* Star Points buttons */}
      <div className="mb-3">
        <h4 className="text-xs mb-1 text-gray-300">Add Star Points (SP):</h4>
        <div className="grid grid-cols-4 gap-2">
          <button
            className="px-2 py-1 text-xs rounded pixel-button bg-yellow-600 hover:bg-yellow-500 text-white"
            onClick={() => handleAddStarPoints(5)}
          >
            +5 SP
          </button>
          <button
            className="px-2 py-1 text-xs rounded pixel-button bg-yellow-600 hover:bg-yellow-500 text-white"
            onClick={() => handleAddStarPoints(15)}
          >
            +15 SP
          </button>
          <button
            className="px-2 py-1 text-xs rounded pixel-button bg-yellow-600 hover:bg-yellow-500 text-white"
            onClick={() => handleAddStarPoints(50)}
          >
            +50 SP
          </button>
          <button
            className="px-2 py-1 text-xs rounded pixel-button bg-yellow-600 hover:bg-yellow-500 text-white"
            onClick={() => handleAddStarPoints(100)}
          >
            +100 SP
          </button>
        </div>
      </div>

      {/* SP Cost Validation Button */}
      <button 
        onClick={() => {
          console.log("Validating SP costs for all concepts...");
          // Get all concepts from the store
          const allConcepts = useKnowledgeStore.getState().nodes;
          // Check for missing or invalid SP costs
          const issuesConcepts = allConcepts.filter(concept => 
            !concept.spCost || isNaN(concept.spCost)
          );
          
          if (issuesConcepts.length === 0) {
            console.log("✅ All concepts have valid SP costs!");
          } else {
            console.warn(`⚠️ Found ${issuesConcepts.length} concepts with missing or invalid SP costs:`);
            issuesConcepts.forEach(concept => {
              console.warn(`- ${concept.name} (${concept.id}): orbit=${concept.orbit}, spCost=${concept.spCost}`);
            });
          }
          
          // Log SP cost distribution by orbit
          const orbitCounts = new Map<number, {count: number, avgCost: number}>();
          allConcepts.forEach(concept => {
            const orbit = concept.orbit || 0;
            if (!orbitCounts.has(orbit)) {
              orbitCounts.set(orbit, {count: 0, avgCost: 0});
            }
            const current = orbitCounts.get(orbit)!;
            current.count++;
            current.avgCost += concept.spCost || 0;
          });
          
          console.log("SP Cost Distribution by Orbit:");
          orbitCounts.forEach((data, orbit) => {
            const avgCost = data.count > 0 ? data.avgCost / data.count : 0;
            console.log(`Orbit ${orbit}: ${data.count} concepts, Avg Cost: ${avgCost.toFixed(1)} SP`);
          });
        }}
        className="px-2 py-1 text-xs bg-blue-600 text-white rounded"
      >
        Validate SP Costs
      </button>
    </div>
  );
}

// Add auto-initialization for the debugging control options
// This ensures we sync our UI state with the visualization control
function useVisualizationControlSync(
  setAllDiscovered: React.Dispatch<React.SetStateAction<boolean>>,
  setMasteryLevel: React.Dispatch<React.SetStateAction<number>>,
  setAllConnections: React.Dispatch<React.SetStateAction<boolean>>,
  setShowShootingStars: React.Dispatch<React.SetStateAction<boolean>>
) {
  useEffect(() => {
    // Get initial state from visualization control
    const options = constellationVisualizationControl.getOptions();
    setAllDiscovered(!!options.showAllDiscovered);
    setMasteryLevel(options.masteryLevel || 0);
    setAllConnections(!!options.showAllConnections);
    setShowShootingStars(!!options.showShootingStars);
    
    // Creates a listener for visualization control events
    const listener = (options: any) => {
      setAllDiscovered(!!options.showAllDiscovered);
      setMasteryLevel(options.masteryLevel || 0);
      setAllConnections(!!options.showAllConnections);
      setShowShootingStars(!!options.showShootingStars);
    };
    
    // Subscribe to all events
    const unsubscribe = constellationVisualizationControl.subscribeToAll(listener);
    
    // Cleanup on unmount
    return unsubscribe;
  }, [setAllDiscovered, setMasteryLevel, setAllConnections, setShowShootingStars]);
}