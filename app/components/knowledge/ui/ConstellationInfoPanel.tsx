// app/components/knowledge/ui/ConstellationInfoPanel.tsx
import React, { useRef, useEffect } from 'react';
import { PixelText } from '../../PixelThemeProvider';
import { ConceptNode, ConceptConnection, KnowledgeDomain, KNOWLEDGE_DOMAINS } from '../../../store/knowledgeStore';
import { DOMAIN_COLORS } from '../../../core/themeConstants';

interface ConstellationInfoPanelProps {
  discoveredNodes: ConceptNode[];
  totalNodes: number;
  discoveredConnections: ConceptConnection[];
  totalMastery: number;
  domainMastery?: Record<KnowledgeDomain, number>;
}

/**
 * Displays overview information about the constellation.
 */
export const ConstellationInfoPanel: React.FC<ConstellationInfoPanelProps> = ({
  discoveredNodes,
  totalNodes,
  discoveredConnections,
  totalMastery,
  domainMastery = {}
}) => {
  const panelRef = useRef<HTMLDivElement>(null);
  
  // Set CSS variable with the panel height for other components to use
  useEffect(() => {
    if (panelRef.current) {
      const height = panelRef.current.offsetHeight;
      document.documentElement.style.setProperty('--constellation-info-height', `${height}px`);
    }
    
    // Cleanup on unmount
    return () => {
      document.documentElement.style.removeProperty('--constellation-info-height');
    };
  }, [discoveredNodes.length, totalNodes, discoveredConnections.length, totalMastery, domainMastery]);

  return (
    <div className="absolute top-4 right-4 z-10">
      <div ref={panelRef} className="pixel-panel-overlay pixel-borders-thin text-sm">
        <PixelText className="text-text-primary mb-2">Knowledge Constellation</PixelText>
        <div className="text-text-secondary mb-2">
          {/* Display count of discovered nodes vs total nodes */}
          <div>Discovered: {discoveredNodes.length}/{totalNodes}</div>
          {/* Display count of discovered connections */}
          <div>Connections: {discoveredConnections.length}</div>
          {/* Display total mastery percentage */}
          <div>Mastery: {totalMastery}%</div>
        </div>
        
        {/* Domain mastery section */}
        <div className="border-t border-gray-700 pt-2 mt-2">
          <PixelText className="text-text-primary mb-1 text-xs">Domains</PixelText>
          <div className="space-y-1">
            {Object.entries(domainMastery)
              .filter(([_, mastery]) => mastery > 0)
              .map(([key, mastery]) => {
                const domain = KNOWLEDGE_DOMAINS[key as KnowledgeDomain];
                if (!domain) return null;
                
                return (
                  <div key={key} className="flex items-center justify-between text-xs">
                    <div className="flex items-center">
                      <div
                        className="w-2 h-2 mr-1"
                        style={{ backgroundColor: DOMAIN_COLORS[key as KnowledgeDomain] }}
                      ></div>
                      <span className="text-text-secondary">{domain.name}</span>
                    </div>
                    <span className="text-text-secondary">{mastery}%</span>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConstellationInfoPanel;
