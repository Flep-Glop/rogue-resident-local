// app/components/knowledge/ui/SelectedNodePanel.tsx
import React, { useRef, useLayoutEffect } from 'react';
import { PixelText } from '../../PixelThemeProvider';
import { ConceptNode } from '../../../store/knowledgeStore';
import { PANEL_COLORS } from '../../../core/themeConstants';

interface SelectedNodePanelProps {
  selectedNode: ConceptNode | null;
  masteryLevel: number;
  onConnect: () => void;
  canConnect: boolean;
}

/**
 * Displays detailed information about the currently selected node.
 * Positioned below the ConstellationInfoPanel in the top right.
 */
export const SelectedNodePanel: React.FC<SelectedNodePanelProps> = ({
  selectedNode,
  masteryLevel,
  onConnect,
  canConnect,
}) => {
  if (!selectedNode) return null;
  
  const panelRef = useRef<HTMLDivElement>(null);
  
  // Force position the panel under the info panel
  useLayoutEffect(() => {
    if (!panelRef.current) return;
    
    // Try to find the info panel
    const infoPanel = document.querySelector('[data-component="constellation-view"] > div.absolute.top-4.right-4');
    
    if (infoPanel) {
      const infoRect = infoPanel.getBoundingClientRect();
      panelRef.current.style.position = 'absolute';
      panelRef.current.style.top = `${infoRect.bottom + 16}px`;
      panelRef.current.style.right = '16px';
      
      // Log to help debug
      console.log('Positioned SelectedNodePanel below InfoPanel:', infoRect.bottom);
    } else {
      // Fallback if info panel not found
      panelRef.current.style.position = 'absolute';
      panelRef.current.style.top = '160px';
      panelRef.current.style.right = '16px';
      
      console.log('InfoPanel not found, using fallback position');
    }
  }, [selectedNode]);

  return (
    <div ref={panelRef} className="pixel-panel-overlay pixel-borders z-10 max-w-xs">
      <div className="p-3">
        <div className="flex items-center mb-2">
          <div className="w-3 h-3 mr-2 rounded-full" 
            style={{ backgroundColor: getDomainColor(selectedNode.domain) }}></div>
          <PixelText className="text-text-primary">
            {selectedNode.name}
          </PixelText>
        </div>
        
        <div className="px-2 py-1 mb-2 text-xs pixel-panel-darker inline-block">
          {selectedNode.domain}
        </div>
        
        <div className="text-text-secondary mb-3 text-sm bg-black/30 p-2 rounded">
          {selectedNode.description}
        </div>
        
        <div className="flex items-center justify-between">
          <div className="text-text-secondary text-sm flex items-center">
            <div className="w-full h-2 bg-surface-darker rounded-full overflow-hidden mr-2 w-16">
              <div 
                className="h-full bg-blue-500" 
                style={{ width: `${masteryLevel}%`, boxShadow: "0 0 5px rgba(59, 130, 246, 0.5)" }}
              />
            </div>
            <span>{masteryLevel}%</span>
          </div>
          {canConnect && (
            <button
              onClick={onConnect}
              className="pixel-button text-sm py-1 px-3 bg-blue-600 hover:bg-blue-500 text-white"
              disabled={!canConnect}
            >
              Connect
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Helper function to get domain color
const getDomainColor = (domain: string): string => {
  const domainColors: Record<string, string> = {
    'treatment-planning': '#3b82f6', // Blue
    'radiation-therapy': '#10b981',  // Green
    'linac-anatomy': '#f59e0b',      // Amber
    'dosimetry': '#ec4899',          // Pink
    'default': '#8b5cf6'             // Purple (default)
  };
  
  return domainColors[domain] || domainColors.default;
};

export default SelectedNodePanel;
