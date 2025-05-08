'use client';

import React, { useState } from 'react';
import styled, { css, keyframes } from 'styled-components';
import { KnowledgeStar, DomainColors } from '@/app/types';

interface StarProps {
  star: KnowledgeStar;
  onClick: () => void;
  isNewlyDiscovered?: boolean;
}

// Keyframes
const pulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
`;

const bounce = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
`;

// Styled components
const StarContainer = styled.div<{ x: number; y: number }>`
  position: absolute;
  transform: translate(-50%, -50%);
  left: ${props => `${props.x}px`};
  top: ${props => `${props.y}px`};
`;

interface StarDotProps {
  $size: number;
  $color: string;
  $borderColor: string;
  $glow: string;
  $isNewlyDiscovered: boolean;
  $isPulsing: boolean;
}

const StarDot = styled.div<StarDotProps>`
  width: ${props => `${props.$size}px`};
  height: ${props => `${props.$size}px`};
  background-color: ${props => props.$color};
  border: ${props => props.$isNewlyDiscovered 
    ? `3px solid ${props.$borderColor}` 
    : `2px solid ${props.$borderColor}`};
  border-radius: 50%;
  box-shadow: ${props => props.$glow};
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  animation: ${props => props.$isPulsing ? css`${pulse} 2s infinite` : 'none'};
  
  &:hover {
    transform: scale(1.1);
  }
`;

const MasteryText = styled.div<{ $active: boolean }>`
  font-size: 0.75rem;
  font-weight: bold;
  color: ${props => props.$active ? '#fff' : '#eee'};
`;

const NewDiscoveryBadge = styled.div`
  position: absolute;
  top: -16px;
  left: 50%;
  transform: translateX(-50%);
`;

const BadgeText = styled.div`
  display: inline-block;
  padding: 2px 8px;
  background-color: #eab308; /* yellow-500 */
  color: #000;
  font-size: 0.75rem;
  font-weight: bold;
  border-radius: 9999px;
  animation: ${bounce} 1s infinite;
`;

const StarLabel = styled.div<{ $isNewlyDiscovered: boolean; $isUnlocked: boolean }>`
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  margin-top: 4px;
  font-size: 0.75rem;
  white-space: nowrap;
  color: ${props => 
    props.$isNewlyDiscovered 
      ? '#ffcc00' 
      : (props.$isUnlocked ? '#fff' : '#aaa')};
  font-weight: ${props => 
    (props.$isUnlocked || props.$isNewlyDiscovered) ? 'bold' : 'normal'};
`;

const Tooltip = styled.div<{ $domainColor: string }>`
  position: absolute;
  z-index: 10;
  width: 16rem;
  padding: 0.75rem;
  border-radius: 0.375rem;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  background-color: #111;
  border: 1px solid ${props => props.$domainColor};
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  margin-top: 24px;
`;

const TooltipTitle = styled.h3`
  font-weight: bold;
  color: white;
  margin-bottom: 0.25rem;
  display: flex;
  align-items: center;
`;

const NewTag = styled.span`
  margin-left: 0.5rem;
  font-size: 0.75rem;
  background-color: #eab308;
  color: black;
  padding: 0 0.5rem;
  border-radius: 9999px;
`;

const TooltipDescription = styled.p`
  font-size: 0.875rem;
  color: #d1d5db; /* gray-300 */
  margin-bottom: 0.5rem;
`;

const UnlockCost = styled.div`
  font-size: 0.75rem;
  color: #fcd34d; /* yellow-400 */
  font-weight: bold;
  margin-top: 0.5rem;
`;

const MetricRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 0.5rem;
  font-size: 0.75rem;
`;

const ProgressBarContainer = styled.div`
  width: 100%;
  height: 0.5rem;
  background-color: #374151; /* gray-700 */
  border-radius: 9999px;
  margin-top: 0.25rem;
  overflow: hidden;
`;

const ProgressBarFill = styled.div<{ $width: string; $color: string }>`
  height: 100%;
  border-radius: 9999px;
  width: ${props => props.$width};
  background-color: ${props => props.$color};
`;

const StatusText = styled.div`
  font-size: 0.75rem;
  margin-top: 0.5rem;
`;

const ActiveStatus = styled.span`
  color: #4ade80; /* green-400 */
`;

const InactiveStatus = styled.span`
  color: #9ca3af; /* gray-400 */
`;

export const Star: React.FC<StarProps> = ({ star, onClick, isNewlyDiscovered = false }) => {
  const [showDetails, setShowDetails] = useState(false);
  
  // Determine star size based on mastery
  const size = star.unlocked 
    ? Math.max(24, 24 + (star.mastery / 100 * 16)) 
    : 20;
  
  // Determine star appearance based on state
  const getStarColor = () => {
    if (!star.discovered) return '#555';
    if (!star.unlocked) return '#888';
    
    const baseColor = DomainColors[star.domain];
    const alpha = star.active ? 'ff' : '88';
    return `${baseColor}${alpha}`;
  };
  
  const getBorderColor = () => {
    if (!star.unlocked) return isNewlyDiscovered ? '#ffcc00' : '#aaa';
    return star.active ? '#fff' : '#aaa';
  };
  
  const starColor = getStarColor();
  const borderColor = getBorderColor();
  
  // Enhanced glow for newly discovered stars
  const getGlowEffect = () => {
    if (isNewlyDiscovered) {
      return `0 0 20px #ffcc00, 0 0 10px ${DomainColors[star.domain]}`;
    }
    if (star.active && star.unlocked) {
      return `0 0 15px ${starColor}`;
    }
    return 'none';
  };
  
  const glowEffect = getGlowEffect();
  
  // Handle hover to show details
  const handleMouseEnter = () => setShowDetails(true);
  const handleMouseLeave = () => setShowDetails(false);
  
  return (
    <StarContainer 
      x={star.position.x} 
      y={star.position.y}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Star visualization */}
      <StarDot
        $size={size}
        $color={starColor}
        $borderColor={borderColor}
        $glow={glowEffect}
        $isNewlyDiscovered={isNewlyDiscovered}
        $isPulsing={isNewlyDiscovered}
        onClick={onClick}
      >
        {star.unlocked && (
          <MasteryText $active={star.active}>
            {Math.round(star.mastery)}%
          </MasteryText>
        )}
      </StarDot>
      
      {/* New discovery indicator */}
      {isNewlyDiscovered && (
        <NewDiscoveryBadge>
          <BadgeText>New!</BadgeText>
        </NewDiscoveryBadge>
      )}
      
      {/* Star name label */}
      <StarLabel 
        $isNewlyDiscovered={isNewlyDiscovered} 
        $isUnlocked={star.unlocked}
      >
        {star.name}
      </StarLabel>
      
      {/* Tooltip with details */}
      {showDetails && (
        <Tooltip $domainColor={DomainColors[star.domain]}>
          <TooltipTitle>
            {star.name}
            {isNewlyDiscovered && <NewTag>New!</NewTag>}
          </TooltipTitle>
          
          <TooltipDescription>{star.description}</TooltipDescription>
          
          {star.discovered && !star.unlocked && (
            <UnlockCost>
              Cost to unlock: {star.spCost} SP
            </UnlockCost>
          )}
          
          {star.unlocked && (
            <>
              <MetricRow>
                <span>Mastery:</span>
                <span style={{ fontWeight: 'bold' }}>{Math.round(star.mastery)}%</span>
              </MetricRow>
              
              <ProgressBarContainer>
                <ProgressBarFill 
                  $width={`${star.mastery}%`}
                  $color={DomainColors[star.domain]} 
                />
              </ProgressBarContainer>
              
              <StatusText>
                Status: {star.active 
                  ? <ActiveStatus>Active</ActiveStatus> 
                  : <InactiveStatus>Inactive</InactiveStatus>}
              </StatusText>
            </>
          )}
        </Tooltip>
      )}
    </StarContainer>
  );
}; 