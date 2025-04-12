// app/components/knowledge/ui/ConnectionSuggestionsPanel.tsx
import React from 'react';
import { PixelText } from '../../PixelThemeProvider';
import { ConceptNode } from '../../../store/knowledgeStore';

interface ConnectionSuggestionsPanelProps {
  suggestions: ConceptNode[];
  onSelect: (nodeId: string) => void;
  pendingConnection: string | null;
}

/**
 * Renders a panel with suggested connections for the currently selected node.
 */
export const ConnectionSuggestionsPanel: React.FC<ConnectionSuggestionsPanelProps> = ({
  suggestions,
  onSelect,
  pendingConnection,
}) => {
  // Don't render if there are no suggestions or no pending connection
  if (!pendingConnection || suggestions.length === 0) return null;

  // Handle suggestion click
  const handleSuggestionClick = (node: ConceptNode) => {
    onSelect(node.id);
  };

  return (
    <div className="absolute bottom-4 right-4 z-10">
      <div className="pixel-panel-overlay pixel-borders-thin">
        <PixelText className="text-text-primary mb-1">Suggested Connections</PixelText>
        <div className="max-h-40 overflow-y-auto">
          {suggestions.map(node => (
            <div
              key={node.id}
              className="cursor-pointer p-2 my-1 pixel-borders-thin pixel-panel-darker"
              onClick={() => handleSuggestionClick(node)}
            >
              <div className="text-text-primary">{node.name}</div>
              <div className="text-text-secondary text-xs">{node.domain}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ConnectionSuggestionsPanel;
