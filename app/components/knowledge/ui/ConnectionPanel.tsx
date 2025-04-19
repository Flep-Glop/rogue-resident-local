import React from 'react';
import { PixelText, PixelButton } from '../../PixelThemeProvider';
import { ConceptNode } from '../../../store/knowledgeStore';
import { DOMAIN_COLORS } from '../../../core/themeConstants';
import SPCost from './SPCost';

interface ConnectionPanelProps {
  sourceNode: ConceptNode | null;
  targetNode: ConceptNode | null;
  spCost: number;
  onConfirm: () => void;
  onCancel: () => void;
  canAfford: boolean;
}

/**
 * ConnectionPanel displays UI for confirming or canceling a connection
 * between two concept stars in the constellation.
 */
const ConnectionPanel: React.FC<ConnectionPanelProps> = ({
  sourceNode,
  targetNode,
  spCost,
  onConfirm,
  onCancel,
  canAfford
}) => {
  if (!sourceNode || !targetNode) return null;

  return (
    <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 z-20 w-72">
      <div className="pixel-panel-overlay pixel-borders-thin p-3">
        <PixelText className="text-text-primary mb-2">Create Connection</PixelText>
        
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="bg-surface-dark p-1 rounded-md">
            <span className="text-sm font-pixel" style={{ color: sourceNode.domain ? DOMAIN_COLORS[sourceNode.domain] : '#ffffff' }}>
              {sourceNode.name}
            </span>
          </div>
          
          <div className="text-white font-pixel">→</div>
          
          <div className="bg-surface-dark p-1 rounded-md">
            <span className="text-sm font-pixel" style={{ color: targetNode.domain ? DOMAIN_COLORS[targetNode.domain] : '#ffffff' }}>
              {targetNode.name}
            </span>
          </div>
        </div>
        
        <div className="flex items-center justify-center mb-3">
          <SPCost amount={spCost} />
        </div>
        
        <div className="flex justify-between gap-2">
          <PixelButton
            className="bg-danger hover:bg-danger-dark text-white flex-1"
            onClick={onCancel}
          >
            Cancel
          </PixelButton>
          
          <PixelButton
            className={`${canAfford 
              ? 'bg-success hover:bg-success-dark' 
              : 'bg-surface-dark text-text-secondary cursor-not-allowed'} text-white flex-1`}
            onClick={canAfford ? onConfirm : undefined}
            disabled={!canAfford}
          >
            Confirm
          </PixelButton>
        </div>
      </div>
    </div>
  );
};

export default ConnectionPanel; 