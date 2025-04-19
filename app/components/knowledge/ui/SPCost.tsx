import React from 'react';
import { PixelText } from '../../PixelThemeProvider';

interface SPCostProps {
  amount: number;
  label?: string;
  className?: string;
}

/**
 * Displays a Star Point cost with appropriate styling
 */
const SPCost: React.FC<SPCostProps> = ({ 
  amount, 
  label = 'SP Cost', 
  className = '' 
}) => {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {label && (
        <span className="text-text-secondary text-sm">{label}:</span>
      )}
      <div className="flex items-center">
        <span className="text-star-point font-pixel text-lg">{amount}</span>
        <span className="text-star-point ml-1 text-sm">★</span>
      </div>
    </div>
  );
};

export default SPCost; 