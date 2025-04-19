'use client';

import React, { useState } from 'react';
import MasteryTable from './MasteryTable';
import PatternProgressTable from './PatternProgressTable';
import { PixelText } from '../PixelThemeProvider';

interface CollapsibleKnowledgePanelProps {
  onNodeSelect?: (nodeId: string) => void;
  onPatternSelect?: (patternId: string) => void;
}

export default function CollapsibleKnowledgePanel({
  onNodeSelect,
  onPatternSelect
}: CollapsibleKnowledgePanelProps) {
  // Track which sections are open
  const [openSections, setOpenSections] = useState({
    mastery: false,
    patterns: false
  });
  
  // Toggle section visibility
  const toggleSection = (section: 'mastery' | 'patterns') => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };
  
  return (
    <div className="collapsible-knowledge-panel bg-gray-900 bg-opacity-80 p-4 rounded-lg font-pixel">
      {/* Mastery Progress Section */}
      <div className="section mb-4">
        <div 
          className="section-header flex items-center justify-between cursor-pointer p-2 bg-gray-800 rounded-md"
          onClick={() => toggleSection('mastery')}
        >
          <PixelText className="text-lg font-bold text-white">Knowledge Mastery</PixelText>
          <span className="text-gray-400">
            {openSections.mastery ? '▼' : '►'}
          </span>
        </div>
        
        {openSections.mastery && (
          <div className="section-content mt-2">
            <MasteryTable onNodeSelect={onNodeSelect} />
          </div>
        )}
      </div>
      
      {/* Patterns Section */}
      <div className="section">
        <div 
          className="section-header flex items-center justify-between cursor-pointer p-2 bg-gray-800 rounded-md"
          onClick={() => toggleSection('patterns')}
        >
          <PixelText className="text-lg font-bold text-white">Constellation Patterns</PixelText>
          <span className="text-gray-400">
            {openSections.patterns ? '▼' : '►'}
          </span>
        </div>
        
        {openSections.patterns && (
          <div className="section-content mt-2">
            <PatternProgressTable onPatternSelect={onPatternSelect} />
          </div>
        )}
      </div>
    </div>
  );
} 