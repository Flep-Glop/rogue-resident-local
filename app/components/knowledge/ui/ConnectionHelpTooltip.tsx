import React from 'react';
import { PixelText } from '../../PixelThemeProvider';

interface ConnectionHelpTooltipProps {
  visible: boolean;
  className?: string;
}

/**
 * A tooltip that explains how to create connections between stars in the constellation.
 * This appears when a user is in connection mode or first opens the constellation.
 */
const ConnectionHelpTooltip: React.FC<ConnectionHelpTooltipProps> = ({ 
  visible,
  className = ''
}) => {
  if (!visible) return null;
  
  return (
    <div className={`absolute top-20 left-1/2 transform -translate-x-1/2 z-10 w-96 ${className}`}>
      <div className="pixel-panel-overlay pixel-borders-thin p-3">
        <PixelText className="text-text-primary mb-2">Creating Connections</PixelText>
        <div className="text-text-secondary mb-2">
          <p className="mb-1">Connect stars to form meaningful relationships between concepts.</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><span className="text-white">Shift+Click</span> on a star to start a connection</li>
            <li>Click on another star to connect them</li>
            <li>Creating connections requires Star Points (★)</li>
            <li>Connections within the same domain cost less</li>
          </ul>
        </div>
        <div className="text-text-accent text-sm">
          Connected knowledge provides deeper understanding and unlocks new abilities!
        </div>
      </div>
    </div>
  );
};

export default ConnectionHelpTooltip; 