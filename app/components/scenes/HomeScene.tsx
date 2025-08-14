'use client';

import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { useSceneStore } from '@/app/store/sceneStore';
import { useTutorialStore } from '@/app/store/tutorialStore';
import { useTutorialOverlays } from '@/app/components/tutorial/TutorialOverlay';
import AbilityCardInterface from './AbilityCardInterface';

// Add debug mode toggle - set to true to see clickboxes
const DEBUG_CLICKBOXES = false;

const HomeContainer = styled.div`
  width: 100vw;
  height: 100vh;
  position: relative;
  overflow: hidden;
  background: #1a1a2e;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const HomeImageContainer = styled.div`
  position: relative;
  width: 100vw;  /* Full viewport width */
  height: 100vh; /* Full viewport height */
  background-image: url('/images/home/home.png');
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

export default function HomeScene() {
  const { transitionToScene } = useSceneStore();
  const [hoveredArea, setHoveredArea] = useState<HoveredArea | null>(null);
  const [showAbilityInterface, setShowAbilityInterface] = useState(false);
  
  // Tutorial integration
  const currentStep = useTutorialStore(state => state.currentStep);
  const completeStep = useTutorialStore(state => state.completeStep);
  const { showTooltip } = useTutorialOverlays();

  const handleBedClick = () => {
    console.log('[HomeScene] Bed clicked - transitioning to hospital');
    transitionToScene('hospital');
  };

  const handleDeskClick = () => {
    console.log('[HomeScene] Desk clicked - opening journal/ability cards');
    setShowAbilityInterface(true);
  };

  const handleCloseAbilityInterface = () => {
    setShowAbilityInterface(false);
  };

  const handleLadderClick = () => {
    console.log('[HomeScene] Ladder clicked - going up to observatory');
    transitionToScene('observatory');
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

  // Tutorial: First-time home visit guidance (prevent multiple executions)
  const hasProcessedRef = useRef(false);
  
  useEffect(() => {
    if (currentStep === 'night_phase_intro' && !hasProcessedRef.current) {
      // First time arriving home - advance to home_intro step
      console.log('[HomeScene] First-time home visit detected, advancing tutorial');
      hasProcessedRef.current = true;
      completeStep('night_phase_intro');
    }
  }, [currentStep, completeStep]);

  // Tutorial: Enhanced click handlers for guidance
  const handleDeskClickWithTutorial = () => {
    console.log('[HomeScene] Desk clicked');
    if (currentStep === 'home_intro') {
      // Complete home_intro and advance to abilities_desk_intro
      completeStep('home_intro');
    } else if (currentStep === 'abilities_desk_intro') {
      // Tutorial step will be completed inside AbilityCardInterface
      console.log('[HomeScene] Abilities desk intro step - opening interface');
    }
    setShowAbilityInterface(true);
  };

  const handleLadderClickWithTutorial = () => {
    console.log('[HomeScene] Ladder clicked - going up to observatory');
    if (currentStep === 'home_intro') {
      // First complete home intro, then go to constellation
      completeStep('home_intro');
    }
    transitionToScene('observatory');
  };

  return (
    <HomeContainer>
      <HomeImageContainer>
        {/* Bed area - left side */}
        <ClickableArea
          $isHovered={hoveredArea?.name === 'Bed'}
          $debugColor="rgba(255, 0, 0, 0.3)" // Red for bed
          style={{
            left: '61%',
            top: '74%',
            width: '32%',
            height: '22%'
          }}
          onClick={handleBedClick}
          onMouseEnter={(e) => handleAreaHover('Bed', e)}
          onMouseLeave={handleAreaLeave}
        >
          {DEBUG_CLICKBOXES && <DebugLabel>BED<br/>61%,74%<br/>32%×22%</DebugLabel>}
        </ClickableArea>

        {/* Desk area - center */}
        <ClickableArea
          $isHovered={hoveredArea?.name === 'Desk'}
          $debugColor="rgba(0, 255, 0, 0.3)" // Green for desk
          style={{
            left: '7%',
            top: '64%',
            width: '25%',
            height: '30%'
          }}
          onClick={currentStep === 'home_intro' || currentStep === 'abilities_desk_intro' ? handleDeskClickWithTutorial : handleDeskClick}
          onMouseEnter={(e) => handleAreaHover('Desk', e)}
          onMouseLeave={handleAreaLeave}
        >
          {DEBUG_CLICKBOXES && <DebugLabel>DESK<br/>7%,64%<br/>25%×30%</DebugLabel>}
        </ClickableArea>

        {/* Ladder area - right side */}
        <ClickableArea
          $isHovered={hoveredArea?.name === 'Ladder'}
          $debugColor="rgba(0, 0, 255, 0.3)" // Blue for ladder
          style={{
            right: '41%',
            top: '0%',
            width: '10%',
            height: '86%'
          }}
          onClick={currentStep === 'home_intro' ? handleLadderClickWithTutorial : handleLadderClick}
          onMouseEnter={(e) => handleAreaHover('Ladder', e)}
          onMouseLeave={handleAreaLeave}
        >
          {DEBUG_CLICKBOXES && <DebugLabel>LADDER<br/>R:41%,0%<br/>10%×86%</DebugLabel>}
        </ClickableArea>
      </HomeImageContainer>

      {/* Tooltip */}
      {hoveredArea && (
        <Tooltip
          x={hoveredArea.x}
          y={hoveredArea.y}
          $visible={!!hoveredArea}
        >
          {hoveredArea.name === 'Bed' && 'Sleep (Next Day)'}
          {hoveredArea.name === 'Desk' && 'Journal & Ability Cards'}
          {hoveredArea.name === 'Ladder' && 'Go to Observatory'}
        </Tooltip>
      )}

      {/* Ability Card Interface */}
      {showAbilityInterface && (
        <AbilityCardInterface onClose={handleCloseAbilityInterface} />
      )}
    </HomeContainer>
  );
} 