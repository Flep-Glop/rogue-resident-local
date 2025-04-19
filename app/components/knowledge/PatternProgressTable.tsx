'use client';

import React, { useState } from 'react';
import useKnowledgeStore from '@/app/store/knowledgeStore';
import { detectPatterns, PatternFormation, ConstellationPattern } from './ConstellationPatternSystem';
import { PixelText, PixelButton } from '../PixelThemeProvider';

interface PatternProgressTableProps {
  onPatternSelect?: (patternId: string) => void;
}

export default function PatternProgressTable({ onPatternSelect }: PatternProgressTableProps) {
  const { nodes, connections, starPoints } = useKnowledgeStore();
  
  // State for selected pattern
  const [selectedPatternId, setSelectedPatternId] = useState<string | null>(null);
  
  // Get all patterns using the detection system
  const patterns = React.useMemo(() => {
    const result = detectPatterns(nodes, connections, new Set()).allComplete;
    return result;
  }, [nodes, connections]);
  
  // Function to calculate pattern completion percentage
  const getPatternCompletion = (pattern: ConstellationPattern): number => {
    // Check which nodes in the pattern are discovered
    const discoveredCount = pattern.starIds.reduce((count, id) => {
      const node = nodes.find(n => n.id === id);
      return count + (node?.discovered ? 1 : 0);
    }, 0);
    
    // Check which connections are discovered
    let totalConnections = 0;
    let discoveredConnections = 0;
    
    // For each star in the pattern, check connections to other stars in pattern
    for (let i = 0; i < pattern.starIds.length; i++) {
      for (let j = i + 1; j < pattern.starIds.length; j++) {
        const sourceId = pattern.starIds[i];
        const targetId = pattern.starIds[j];
        
        // Check if this connection exists in the pattern
        const connection = connections.find(
          c => (c.source === sourceId && c.target === targetId) || 
               (c.source === targetId && c.target === sourceId)
        );
        
        if (connection) {
          totalConnections++;
          if (connection.discovered) {
            discoveredConnections++;
          }
        }
      }
    }
    
    // Calculate overall completion based on nodes and connections
    const nodeWeight = 0.5; // 50% of completion is discovering nodes
    const connectionWeight = 0.5; // 50% is making connections
    
    const nodeCompletion = discoveredCount / pattern.starIds.length;
    const connectionCompletion = totalConnections > 0 
      ? discoveredConnections / totalConnections 
      : 0;
    
    return Math.round(
      (nodeCompletion * nodeWeight + connectionCompletion * connectionWeight) * 100
    );
  };
  
  // Function to handle pattern selection
  const handlePatternSelect = (patternId: string) => {
    setSelectedPatternId(prev => prev === patternId ? null : patternId);
    if (onPatternSelect) {
      onPatternSelect(patternId);
    }
  };
  
  // Function to get color based on pattern formation
  const getPatternColor = (formation: PatternFormation): string => {
    switch (formation) {
      case 'triangle':
        return 'bg-green-900 text-green-100';
      case 'chain':
        return 'bg-blue-900 text-blue-100';
      case 'circuit':
        return 'bg-purple-900 text-purple-100';
      default:
        return 'bg-gray-900 text-gray-100';
    }
  };
  
  // Function to get a readable formation name
  const getFormationName = (formation: PatternFormation): string => {
    switch (formation) {
      case 'triangle':
        return 'Triangle';
      case 'chain':
        return 'Chain';
      case 'circuit':
        return 'Circle';
      default:
        return 'Unknown';
    }
  };
  
  // Function to check if a connection between stars exists and is discovered
  const isConnectionDiscovered = (sourceId: string, targetId: string): boolean => {
    const connection = connections.find(
      c => (c.source === sourceId && c.target === targetId) || 
           (c.source === targetId && c.target === sourceId)
    );
    
    return connection?.discovered || false;
  };
  
  // Function to check if a node is discovered
  const isNodeDiscovered = (nodeId: string): boolean => {
    const node = nodes.find(n => n.id === nodeId);
    return node?.discovered || false;
  };
  
  return (
    <div className="pattern-progress-table mt-4 font-pixel">
      <PixelText className="font-bold mb-2">Pattern Visualization</PixelText>
      
      {/* Pattern Selection Tabs */}
      <div className="pattern-tabs flex flex-wrap gap-2 mb-4">
        {patterns.map(pattern => (
          <PixelButton
            key={pattern.id}
            size="sm"
            className={`rounded ${
              selectedPatternId === pattern.id 
                ? 'ring-2 ring-white ' 
                : ''
            } ${getPatternColor(pattern.formation)}`}
            onClick={() => handlePatternSelect(pattern.id)}
          >
            {pattern.name}
          </PixelButton>
        ))}
      </div>
      
      {/* Selected Pattern Details */}
      {selectedPatternId && (
        <div className="selected-pattern">
          {patterns
            .filter(p => p.id === selectedPatternId)
            .map(pattern => (
              <div key={pattern.id} className="pattern-detail bg-gray-900 bg-opacity-50 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <PixelText className="font-bold text-white">{pattern.name}</PixelText>
                  <span className="text-sm text-purple-300 font-medium">{pattern.reward.value} SP</span>
                </div>
                
                <p className="text-sm text-gray-300 mb-2">{pattern.description}</p>
                <p className="text-xs text-gray-400 mb-4">Formation: {getFormationName(pattern.formation)}</p>
                
                {/* Pattern Structure */}
                <div className="pattern-structure">
                  <PixelText className="text-sm font-bold mb-2">Pattern Structure:</PixelText>
                  
                  {/* List nodes needed for pattern */}
                  {pattern.starIds.map(nodeId => {
                    const node = nodes.find(n => n.id === nodeId);
                    if (!node) return null;
                    
                    return (
                      <div key={nodeId} className="pattern-node mb-4">
                        <PixelText className="text-white font-medium">{node.name}</PixelText>
                        
                        {/* Connection Status */}
                        <div className="connections ml-2 mt-1">
                          {/* For each node, show its connections to other nodes in the pattern */}
                          {pattern.starIds
                            .filter(targetId => targetId !== nodeId)
                            .map(targetId => {
                              const targetNode = nodes.find(n => n.id === targetId);
                              if (!targetNode) return null;
                              
                              const isConnected = isConnectionDiscovered(nodeId, targetId);
                              
                              return (
                                <div 
                                  key={`${nodeId}-${targetId}`} 
                                  className="flex items-center text-xs my-1"
                                >
                                  <span className={`mr-2 ${isConnected ? 'text-green-400' : 'text-gray-500'}`}>
                                    {isConnected ? '✓' : '○'}
                                  </span>
                                  <span>Connection to {targetNode.name}</span>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {/* Progress Bar */}
                <div className="mt-4">
                  <div className="flex justify-between text-xs mb-1">
                    <span>Progress</span>
                    <span>{getPatternCompletion(pattern)}%</span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${getPatternCompletion(pattern)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}
      
      {/* No Pattern Selected State */}
      {!selectedPatternId && patterns.length > 0 && (
        <div className="text-center p-4 bg-gray-900 bg-opacity-50 rounded-lg">
          <PixelText className="text-gray-400">Select a pattern above to view details</PixelText>
        </div>
      )}
      
      {/* No Patterns Available State */}
      {patterns.length === 0 && (
        <div className="text-center p-4 bg-gray-900 bg-opacity-50 rounded-lg">
          <PixelText className="text-gray-400">No patterns discovered yet</PixelText>
        </div>
      )}
    </div>
  );
} 