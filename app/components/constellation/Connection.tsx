import React from 'react';
import { KnowledgeConnection, KnowledgeDomain, DomainColors } from '@/app/types';

interface ConnectionProps {
  connection: KnowledgeConnection;
  sourcePosition: { x: number; y: number };
  targetPosition: { x: number; y: number };
  domain: KnowledgeDomain;
}

export const Connection: React.FC<ConnectionProps> = ({
  connection,
  sourcePosition,
  targetPosition,
  domain
}) => {
  // Determine connection appearance based on strength
  const strength = connection.strength || 10; // Default to 10 if undefined
  const strokeWidth = Math.max(1, Math.min(4, strength / 25)); // Scale 0-100% to 1-4px
  const opacity = Math.max(0.3, Math.min(1, strength / 100)); // Scale opacity
  
  // Get domain color
  const baseColor = DomainColors[domain];
  
  return (
    <line
      x1={sourcePosition.x}
      y1={sourcePosition.y}
      x2={targetPosition.x}
      y2={targetPosition.y}
      stroke={baseColor}
      strokeWidth={strokeWidth}
      strokeOpacity={opacity}
      style={{ transition: 'all 0.3s ease-in-out' }}
    />
  );
}; 