import React from 'react';
import { PixelText } from '../../PixelThemeProvider';

interface ConnectionModeIndicatorProps {
  isActive: boolean;
  sourceNodeName?: string;
  onCancel: () => void;
}

/**
 * Shows an indicator when the user is in connection mode
 */
const ConnectionModeIndicator: React.FC<ConnectionModeIndicatorProps> = ({
  isActive,
  sourceNodeName,
  onCancel
}) => {
  if (!isActive) return null;
  
  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-30 pointer-events-auto">
      <div className="pixel-panel-overlay pixel-borders-thin py-1 px-3 flex items-center gap-2">
        <PixelText className="text-white text-sm">
          Connecting from <span className="text-star-point">{sourceNodeName || 'Selected Node'}</span>
        </PixelText>
        
        <button 
          className="ml-2 text-xs text-danger hover:text-danger-dark"
          onClick={onCancel}
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default ConnectionModeIndicator; 