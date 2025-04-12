// app/components/knowledge/ui/SelectedNodePanel.tsx
import React from 'react';
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
 */
export const SelectedNodePanel: React.FC<SelectedNodePanelProps> = ({
  selectedNode,
  masteryLevel,
  onConnect,
  canConnect,
}) => {
  if (!selectedNode) return null;

  return (
    <div className="absolute top-1/2 right-4 transform -translate-y-1/2 max-w-xs pixel-panel-overlay pixel-borders z-10">
      <PixelText className="text-text-primary mb-1">
        {selectedNode.name}
        <span className="px-2 py-1 text-sm ml-2 flex-shrink-0 pixel-panel-darker">
          {selectedNode.domain}
        </span>
      </PixelText>
      <div className="text-text-secondary mb-3 text-sm">
        {selectedNode.description}
      </div>
      <div className="flex items-center justify-between">
        <div className="text-text-secondary text-sm">
          Mastery: {masteryLevel}%
        </div>
        {canConnect && (
          <button
            onClick={onConnect}
            className="pixel-button text-sm py-1"
            disabled={!canConnect}
          >
            Connect
          </button>
        )}
      </div>
    </div>
  );
};

export default SelectedNodePanel;
