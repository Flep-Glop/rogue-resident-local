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

  // Handle discovering all nodes
  const handleDiscoverAll = useStableCallback(() => {
    try {
      const knowledgeStore = useKnowledgeStore.getState();
      const nodes = knowledgeStore.nodes;
      
      // Add debug info
      console.log('DEBUG: Current discovered nodes:', 
        nodes.filter(n => n.discovered).map(n => ({id: n.id, name: n.name, position: n.position}))
      );
      
      // Set to the opposite of current state
      const newState = !allDiscovered;
      setAllDiscovered(newState);
      
      // First update the visualization control
      constellationVisualizationControl.toggleDiscovery(newState);
      
      if (newState) {
        // Discover all nodes
        console.log('DEBUG: Discovering all nodes...');
        let discoveredCount = 0;
        
        nodes.forEach(node => {
          if (!node.discovered) {
            console.log(`DEBUG: Discovering node: ${node.id} - ${node.name}, current position:`, node.position);
            knowledgeStore.discoverConcept(node.id);
            discoveredCount++;
          }
        });
        
        // Log after discovery
        console.log(`DEBUG: Discovered ${discoveredCount} new nodes`);
        console.log('DEBUG: Post-discovery nodes:',
          knowledgeStore.nodes
            .filter(n => n.discovered)
            .map(n => ({id: n.id, name: n.name, position: n.position}))
        );
        
        showFeedback(`All nodes discovered (${discoveredCount} new)`, 'success');
      } else {
        // Reset to original discovered state - this requires reimporting the original data
        knowledgeStore.resetKnowledge();
        showFeedback('Knowledge reset to initial state', 'info');
        
        // Check post-reset
        console.log('DEBUG: After reset, discovered nodes:', 
          knowledgeStore.nodes.filter(n => n.discovered).map(n => n.id)
        );
      }
    } catch (error) {
      console.error('Error toggling node discovery:', error);
      showFeedback('Error toggling node discovery', 'error');
    }
  });

  // Handle setting mastery level for all nodes
  const handleSetMastery = useStableCallback((level: number) => {
    try {
      const knowledgeStore = useKnowledgeStore.getState();
      const nodes = knowledgeStore.nodes;
      
      setMasteryLevel(level);
      
      // Update visualization control first
      constellationVisualizationControl.setMasteryLevel(level);
      
      // Filter nodes by domain if needed
      const nodesToUpdate = selectedDomain === 'all' 
        ? nodes 
        : nodes.filter(node => node.domain === selectedDomain);
      
      // Count how many nodes were updated for feedback
      let updatedCount = 0;
      
      // Update mastery for all filtered nodes
      nodesToUpdate.forEach(node => {
        if (node.discovered) {
          // Calculate difference to reach the desired level
          const diff = level - node.mastery;
          if (diff !== 0) {
            knowledgeStore.updateMastery(node.id, diff);
            updatedCount++;
          }
        }
      });
      
      const domainText = selectedDomain === 'all' ? 'all domains' : selectedDomain;
      showFeedback(`Mastery set to ${level}% for ${updatedCount} nodes in ${domainText}`, 'success');
    } catch (error) {
      console.error('Error setting mastery level:', error);
      showFeedback('Error setting mastery level', 'error');
    }
  });

  // Handle connecting all possible nodes
  const handleConnectAll = useStableCallback(() => {
    try {
      const knowledgeStore = useKnowledgeStore.getState();
      const nodes = knowledgeStore.nodes;
      const connections = knowledgeStore.connections;
      
      // Set to the opposite of current state
      const newState = !allConnections;
      setAllConnections(newState);
      
      // Update visualization control first
      constellationVisualizationControl.toggleConnections(newState);
      
      if (newState) {
        // Track pairs to avoid duplicates
        const processedPairs = new Set<string>();
        
        // Get discovered nodes
        const discoveredNodes = nodes.filter(node => node.discovered);
        
        // Create all possible connections between discovered nodes
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
              
              // Create connection if it doesn't exist
              if (!connectionExists) {
                knowledgeStore.createConnection(node.id, targetNode.id);
              }
            }
          });
        });
        
        showFeedback('All possible connections created', 'success');
      } else {
        // We can't easily revert connections, so we'll reset the knowledge state
        knowledgeStore.resetKnowledge();
        showFeedback('Knowledge reset to initial state', 'info');
      }
    } catch (error) {
      console.error('Error toggling connections:', error);
      showFeedback('Error toggling connections', 'error');
    }
  });

  // Handle toggling shooting stars (simulated - trigger particle effects)
  const handleToggleShootingStars = useStableCallback(() => {
    try {
      // Toggle shooting stars state
      const newState = !showShootingStars;
      setShowShootingStars(newState);
      
      // Update visualization control
      constellationVisualizationControl.toggleShootingStars(newState);
      
      showFeedback(`Shooting stars ${newState ? 'enabled' : 'disabled'}`, 'info');
      
      // The visualization control will handle triggering the actual particle effects
      if (newState) {
        console.log('DEBUG: Shooting stars activated across the constellation');
      }
    } catch (error) {
      console.error('Error toggling shooting stars:', error);
      showFeedback('Error toggling shooting stars', 'error');
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
      
      {/* Discovery toggle */}
      <div className="mb-3">
        <button
          className={`px-2 py-1 w-full text-xs rounded pixel-button ${
            allDiscovered ? 'bg-green-600 hover:bg-green-500' : 'bg-blue-600 hover:bg-blue-500'
          } text-white`}
          onClick={handleDiscoverAll}
        >
          {allDiscovered ? 'Reset Discoveries' : 'Discover All Nodes'}
        </button>
      </div>
      
      {/* Mastery level setter */}
      <div className="mb-3">
        <label className="block text-xs mb-1 text-gray-300">Set Mastery Level:</label>
        <div className="grid grid-cols-5 gap-2">
          {[0, 25, 50, 75, 100].map(level => (
            <button
              key={level}
              className={`px-2 py-1 text-xs rounded pixel-button ${
                masteryLevel === level 
                  ? 'bg-purple-600 hover:bg-purple-500' 
                  : 'bg-gray-600 hover:bg-gray-500'
              } text-white`}
              onClick={() => handleSetMastery(level)}
            >
              {level}%
            </button>
          ))}
        </div>
      </div>
      
      {/* Connection toggle */}
      <div className="mb-3">
        <button
          className={`px-2 py-1 w-full text-xs rounded pixel-button ${
            allConnections ? 'bg-orange-600 hover:bg-orange-500' : 'bg-blue-600 hover:bg-blue-500'
          } text-white`}
          onClick={handleConnectAll}
        >
          {allConnections ? 'Reset Connections' : 'Connect All Nodes'}
        </button>
      </div>
      
      {/* Shooting stars toggle */}
      <div className="mb-3">
        <button
          className={`px-2 py-1 w-full text-xs rounded pixel-button ${
            showShootingStars ? 'bg-yellow-600 hover:bg-yellow-500' : 'bg-blue-600 hover:bg-blue-500'
          } text-white`}
          onClick={handleToggleShootingStars}
        >
          {showShootingStars ? 'Disable Shooting Stars' : 'Enable Shooting Stars'}
        </button>
      </div>
      
      {/* Layout section */}
      <div className="mb-3">
        <button
          className="px-2 py-1 w-full text-xs rounded pixel-button bg-indigo-600 hover:bg-indigo-500 text-white"
          onClick={handleApplyLayout}
        >
          Apply Orbital Layout
        </button>
      </div>
      
      {/* Pattern detection */}
      <div className="mb-3">
        <button
          className="px-2 py-1 w-full text-xs rounded pixel-button bg-teal-600 hover:bg-teal-500 text-white"
          onClick={handleDetectPatterns}
        >
          Detect Patterns
        </button>
        
        {/* Display detected patterns */}
        {detectedPatterns.length > 0 && (
          <div className="mt-2 p-2 bg-gray-700 rounded text-xs">
            <div className="font-semibold mb-1 text-teal-300">Detected Patterns:</div>
            <ul className="list-disc pl-4 space-y-1">
              {detectedPatterns.map(pattern => (
                <li key={pattern.id} className="text-teal-100">
                  {pattern.name}
                  <span className="text-gray-400 ml-1">({pattern.formation})</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      
      {/* Reset all */}
      <div>
        <button
          className="px-2 py-1 w-full text-xs rounded pixel-button bg-red-600 hover:bg-red-500 text-white"
          onClick={() => {
            // Reset all toggles and knowledge state
            setAllDiscovered(false);
            setMasteryLevel(0);
            setAllConnections(false);
            setShowShootingStars(false);
            
            // Reset visualization control
            constellationVisualizationControl.resetOptions();
            
            // Reset knowledge store
            useKnowledgeStore.getState().resetKnowledge();
            showFeedback('All constellation settings reset', 'info');
          }}
        >
          Reset All Settings
        </button>
      </div>
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