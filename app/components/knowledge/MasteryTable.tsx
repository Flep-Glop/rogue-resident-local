'use client';

import React, { useState } from 'react';
import useKnowledgeStore, { KnowledgeDomain, ConceptNode } from '@/app/store/knowledgeStore';
import { DOMAIN_COLORS } from '@/app/core/themeConstants';
import { PixelText, PixelButton } from '../PixelThemeProvider';

// Define domain display names to convert kebab-case to readable format
const DOMAIN_DISPLAY_NAMES: Record<KnowledgeDomain, string> = {
  'treatment-planning': 'Treatment Planning',
  'radiation-therapy': 'Radiation Therapy',
  'linac-anatomy': 'Linac Anatomy',
  'dosimetry': 'Dosimetry'
};

interface MasteryTableProps {
  onNodeSelect?: (nodeId: string) => void;
}

export default function MasteryTable({ onNodeSelect }: MasteryTableProps) {
  const { nodes, updateMastery, discoverConcept } = useKnowledgeStore();
  
  // Track expanded domains
  const [expandedDomains, setExpandedDomains] = useState<Record<string, boolean>>({
    'treatment-planning': true,
    'radiation-therapy': true,
    'linac-anatomy': true,
    'dosimetry': true
  });
  
  // Track selected node for highlighting
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  
  // Toggle domain expansion
  const toggleDomain = (domain: string) => {
    setExpandedDomains(prev => ({
      ...prev,
      [domain]: !prev[domain]
    }));
  };
  
  // Group nodes by domain
  const nodesByDomain = React.useMemo(() => {
    const grouped: Record<string, ConceptNode[]> = {};
    
    nodes.forEach(node => {
      if (!grouped[node.domain]) {
        grouped[node.domain] = [];
      }
      grouped[node.domain].push(node);
    });
    
    // Sort domains by predefined order
    return grouped;
  }, [nodes]);
  
  // Calculate domain mastery percentage
  const getDomainMastery = (domain: string): number => {
    const domainNodes = nodesByDomain[domain] || [];
    if (domainNodes.length === 0) return 0;
    
    const totalMastery = domainNodes.reduce((sum, node) => sum + (node.discovered ? node.mastery : 0), 0);
    return Math.round(totalMastery / domainNodes.length);
  };
  
  // Handle node click
  const handleNodeClick = (nodeId: string) => {
    setSelectedNodeId(nodeId);
    if (onNodeSelect) {
      onNodeSelect(nodeId);
    }
  };
  
  // Handle mastery increase - wrapped in a function that doesn't take parameters
  const createMasteryHandler = (nodeId: string) => () => {
    updateMastery(nodeId, 10);
  };
  
  // Handle connect button - wrapped in a function that doesn't take parameters
  const createConnectHandler = (nodeId: string) => () => {
    setSelectedNodeId(nodeId);
    if (onNodeSelect) {
      onNodeSelect(nodeId);
    }
  };
  
  return (
    <div className="mastery-table grid grid-cols-1 lg:grid-cols-4 gap-4 font-pixel">
      {Object.keys(nodesByDomain).map(domain => (
        <div 
          key={domain}
          className="domain-section bg-gray-900 bg-opacity-50 rounded-lg overflow-hidden"
        >
          {/* Domain Header - Always visible */}
          <div 
            className="domain-header p-2 cursor-pointer flex items-center"
            style={{ backgroundColor: `${DOMAIN_COLORS[domain as KnowledgeDomain]}33` }}
            onClick={() => toggleDomain(domain)}
          >
            <div className="flex-1">
              <PixelText 
                className={`text-sm font-medium domain-${domain}`}
              >
                {domain}
              </PixelText>
            </div>
            <span className="text-xs ml-2">
              {expandedDomains[domain] ? '▼' : '►'}
            </span>
          </div>
          
          {/* Domain Content - Collapsible */}
          {expandedDomains[domain] && (
            <div className="domain-content">
              {nodesByDomain[domain].map(node => (
                <div 
                  key={node.id}
                  className={`node-row p-2 flex items-center justify-between hover:bg-gray-800 cursor-pointer ${
                    selectedNodeId === node.id ? 'bg-gray-800' : ''
                  }`}
                  onClick={() => handleNodeClick(node.id)}
                >
                  <PixelText className="node-name text-white">{node.name}</PixelText>
                  
                  <div className="flex items-center">
                    {/* Mastery Percentage */}
                    <div className="percentage-badge bg-gray-950 text-xs font-medium rounded px-1 w-8 text-center">
                      {node.discovered ? `${node.mastery}%` : '0%'}
                    </div>
                    
                    {/* Only show buttons for the selected node */}
                    {selectedNodeId === node.id && (
                      <div className="node-actions flex ml-2">
                        <PixelButton 
                          size="sm"
                          className="bg-blue-800 hover:bg-blue-700 text-white rounded mr-1"
                          onClick={createMasteryHandler(node.id)}
                        >
                          +10%
                        </PixelButton>
                        <PixelButton 
                          size="sm"
                          className="bg-orange-800 hover:bg-orange-700 text-white rounded"
                          onClick={createConnectHandler(node.id)}
                        >
                          Connect
                        </PixelButton>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      {/* Add CSS for domain text colors */}
      <style jsx>{`
        .domain-treatment-planning { color: ${DOMAIN_COLORS['treatment-planning']}; }
        .domain-radiation-therapy { color: ${DOMAIN_COLORS['radiation-therapy']}; }
        .domain-linac-anatomy { color: ${DOMAIN_COLORS['linac-anatomy']}; }
        .domain-dosimetry { color: ${DOMAIN_COLORS['dosimetry']}; }
      `}</style>
    </div>
  );
} 