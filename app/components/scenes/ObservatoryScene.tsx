'use client';

import React, { useState } from 'react';
import styled from 'styled-components';
import { useSceneStore } from '@/app/store/sceneStore';

// Add debug mode toggle - set to true to see clickboxes
const DEBUG_CLICKBOXES = false;

const ObservatoryContainer = styled.div`
  width: 100vw;
  height: 100vh;
  position: relative;
  overflow: hidden;
  background: #0a0a1e;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ObservatoryImageContainer = styled.div`
  position: relative;
  width: 100vw;  /* Full viewport width */
  height: 100vh; /* Full viewport height */
  background-image: url('/images/home/observatory.png');
  background-size: contain;  /* Scale to fit while maintaining aspect ratio */
  background-position: center;
  background-repeat: no-repeat;
  image-rendering: pixelated; /* Maintain pixel art crispness */
`;

const ClickableArea = styled.div<{ $isHovered: boolean; $debugColor?: string }>`
  position: absolute;
  cursor: pointer;
  background: ${({ $isHovered, $debugColor }) => {
    if (DEBUG_CLICKBOXES) {
      return $debugColor || 'rgba(255, 0, 0, 0.3)';
    }
    return $isHovered ? 'rgba(255, 255, 255, 0.2)' : 'transparent';
  }};
  border: ${({ $isHovered, $debugColor }) => {
    if (DEBUG_CLICKBOXES) {
      return `2px solid ${$debugColor?.replace('0.3', '0.8') || 'rgba(255, 0, 0, 0.8)'}`;
    }
    return $isHovered ? '2px solid rgba(255, 255, 255, 0.5)' : '2px solid transparent';
  }};
  transition: all 0.3s ease;
  
  &:hover {
    background: ${({ $debugColor }) => DEBUG_CLICKBOXES ? $debugColor?.replace('0.3', '0.5') : 'rgba(255, 255, 255, 0.2)'};
    border: ${({ $debugColor }) => DEBUG_CLICKBOXES ? `2px solid ${$debugColor?.replace('0.3', '1')}` : '2px solid rgba(255, 255, 255, 0.5)'};
  }
`;

const DebugLabel = styled.div`
  position: absolute;
  top: 2px;
  left: 2px;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 2px 6px;
  font-size: 12px;
  font-family: monospace;
  border-radius: 2px;
  pointer-events: none;
  z-index: 5;
`;

const Tooltip = styled.div<{ x: number; y: number; $visible: boolean }>`
  position: absolute;
  left: ${({ x }) => x}px;
  top: ${({ y }) => y - 40}px;
  background: rgba(0, 0, 0, 0.9);
  color: white;
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 14px;
  font-family: monospace;
  pointer-events: none;
  z-index: 10;
  transform: translateX(-50%);
  opacity: ${({ $visible }) => $visible ? 1 : 0};
  transition: opacity 0.3s ease;
  
  &::after {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    margin-left: -5px;
    border-width: 5px;
    border-style: solid;
    border-color: rgba(0, 0, 0, 0.9) transparent transparent transparent;
  }
`;

interface HoveredArea {
  name: string;
  x: number;
  y: number;
}

export default function ObservatoryScene() {
  const { transitionToScene } = useSceneStore();
  const [hoveredArea, setHoveredArea] = useState<HoveredArea | null>(null);

  const handleLadderDownClick = () => {
    console.log('[ObservatoryScene] Ladder down clicked - going back to home');
    transitionToScene('home');
  };

  const handleTelescopeClick = () => {
    console.log('[ObservatoryScene] Telescope clicked - opening constellation view');
    transitionToScene('constellation');
  };

  const handleAreaHover = (area: string, event: React.MouseEvent) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setHoveredArea({
      name: area,
      x: rect.left + rect.width / 2,
      y: rect.top
    });
  };

  const handleAreaLeave = () => {
    setHoveredArea(null);
  };

  return (
    <ObservatoryContainer>
      <ObservatoryImageContainer>
        {/* Ladder area - left side, going down */}
        <ClickableArea
          $isHovered={hoveredArea?.name === 'Ladder'}
          $debugColor="rgba(255, 165, 0, 0.3)" // Orange for ladder
          style={{
            right: '41%',
            bottom: '10%',
            width: '10%',
            height: '36%'
          }}
          onClick={handleLadderDownClick}
          onMouseEnter={(e) => handleAreaHover('Ladder', e)}
          onMouseLeave={handleAreaLeave}
        >
          {DEBUG_CLICKBOXES && <DebugLabel>LADDER<br/>R:41%,B:10%<br/>10%×36%</DebugLabel>}
        </ClickableArea>

        {/* Telescope area - center/right side */}
        <ClickableArea
          $isHovered={hoveredArea?.name === 'Telescope'}
          $debugColor="rgba(128, 0, 128, 0.3)" // Purple for telescope
          style={{
            right: '61%',
            top: '31%',
            width: '14%',
            height: '60%'
          }}
          onClick={handleTelescopeClick}
          onMouseEnter={(e) => handleAreaHover('Telescope', e)}
          onMouseLeave={handleAreaLeave}
        >
          {DEBUG_CLICKBOXES && <DebugLabel>TELESCOPE<br/>R:61%,31%<br/>14%×60%</DebugLabel>}
        </ClickableArea>
      </ObservatoryImageContainer>

      {/* Tooltip */}
      {hoveredArea && (
        <Tooltip
          x={hoveredArea.x}
          y={hoveredArea.y}
          $visible={!!hoveredArea}
        >
          {hoveredArea.name === 'Ladder' && 'Go back downstairs'}
          {hoveredArea.name === 'Telescope' && 'View Constellations'}
        </Tooltip>
      )}
    </ObservatoryContainer>
  );
} 