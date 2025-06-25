'use client';

import React, { useState } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { useSceneNavigation } from '@/app/components/scenes/GameContainer';
import HospitalRoomOverlay from './HospitalRoomOverlay';
import { useTutorialStore } from '@/app/store/tutorialStore';
import { 
  getTutorialDialogueForRoom, 
  isRoomAvailableInTutorial,
  isRecommendedTutorialRoom,
  getTutorialStepGuidance,
  TUTORIAL_STEP_ROOM_AVAILABILITY
} from '@/app/data/tutorialDialogues';
import { useDialogueStore } from '@/app/store/dialogueStore';
import { ReactionSymbolType } from '@/app/components/ui/ReactionSystem';

// Sprite sheet mapping (5 symbols at 35x35 each)
const SYMBOL_SPRITE_MAP: Record<ReactionSymbolType, number> = {
  '!': 0,      // First symbol (0-34px)
  '?': 1,      // Second symbol (35-69px)  
  '...': 2,    // Third symbol (70-104px)
  '💡': 3,     // Fourth symbol (105-139px)
  '⭐': 4      // Fifth symbol (140-174px)
};

// Sprite symbol component for displaying symbols from sprite sheet
const SpriteSymbol = styled.div<{ $symbolIndex: number }>`
  width: 35px;
  height: 35px;
  background-image: url('/images/ui/reaction-symbols.png');
  background-size: 175px 35px; /* 5 symbols * 35px each */
  background-position: ${props => -props.$symbolIndex * 35}px 0px;
  background-repeat: no-repeat;
  image-rendering: pixelated;
  image-rendering: -moz-crisp-edges;
  image-rendering: -webkit-crisp-edges;
  image-rendering: crisp-edges;
  -ms-interpolation-mode: nearest-neighbor;
`;

// Floating reaction animations - ultra snappy!
const symbolBounceIn = keyframes`
  0% { 
    transform: scale(0.1) translateY(10px); 
    opacity: 0; 
  }
  80% { 
    transform: scale(1.1) translateY(-5px); 
    opacity: 1; 
  }
  100% { 
    transform: scale(1) translateY(0); 
    opacity: 1; 
  }
`;

const symbolFloatUp = keyframes`
  0% { 
    transform: translateY(0) scale(1);
    opacity: 1; 
  }
  100% { 
    transform: translateY(-20px) scale(0.7);
    opacity: 0; 
  }
`;

// Floating reaction component
const FloatingReaction = styled.div<{ $stage: 'appearing' | 'floating' }>`
  position: absolute;
  width: 35px;
  height: 35px;
  pointer-events: none;
  z-index: 1000;
  
  ${props => props.$stage === 'appearing' && css`
    animation: ${symbolBounceIn} 0.15s ease-out forwards;
  `}
  
  ${props => props.$stage === 'floating' && css`
    animation: ${symbolFloatUp} 0.8s ease-out forwards;
    animation-delay: 0.15s;
  `}
`;

const HospitalContainer = styled.div`
  width: 100vw;
  height: 100vh;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  
  /* Ensure no scrollbars anywhere */
  ::-webkit-scrollbar {
    display: none;
  }
  -ms-overflow-style: none;
  scrollbar-width: none;
  
  /* Apply to all child elements */
  * {
    ::-webkit-scrollbar {
      display: none;
    }
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
`;

const HospitalBuilding = styled.div`
  width: 95vw;
  height: 95vh;
  background-image: url('/images/hospital/hospital-isometric-base.png');
  background-size: 300%;
  background-repeat: no-repeat;
  background-position: -1900px -600px;
  position: relative;
  cursor: pointer;
`;

// Hospital floor overlay that fades on hover
const HospitalFloorOverlay = styled.div<{ $isHovered: boolean }>`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: url('/images/hospital/hospital-floor-closed.png');
  background-size: 300%;
  background-repeat: no-repeat;
  background-position: -1900px -600px;
  opacity: ${({ $isHovered }) => $isHovered ? 0 : 1};
  transition: opacity 0.5s ease-in-out;
  pointer-events: none;
  z-index: 1;
`;

// Animated ambient sprites (animals, people, etc.)
const AmbientSprite = styled.div<{ 
  $spriteSheet: string;
  $spriteWidth: number;
  $spriteHeight: number;
  $frameCount: number;
  $animationDuration: string;
  $pathDuration: string;
  $startX: number;
  $startY: number;
  $endX: number;
  $endY: number;
  $delay: string;
  $scale: number;
  $creatureId: string; // Add unique ID for keyframe names
}>`
  position: absolute;
  width: ${({ $spriteWidth }) => $spriteWidth}px;
  height: ${({ $spriteHeight }) => $spriteHeight}px;
  background-image: url('${({ $spriteSheet }) => $spriteSheet}');
  background-size: ${({ $spriteWidth, $frameCount }) => $spriteWidth * $frameCount}px ${({ $spriteHeight }) => $spriteHeight}px;
  background-repeat: no-repeat;
  image-rendering: pixelated;
  pointer-events: auto; /* Make clickable */
  cursor: pointer;
  z-index: 0; /* Behind everything else */
  transform: scale(${({ $scale }) => $scale});
  transform-origin: center;
  
  /* Hover effect for interactive feedback */
  &:hover {
    filter: brightness(1.2);
    transform: scale(${({ $scale }) => $scale * 1.1});
    transition: all 0.2s ease;
  }
  
  /* Sprite frame animation with unique keyframe names */
  animation: 
    spriteAnimation-${({ $creatureId }) => $creatureId} ${({ $animationDuration }) => $animationDuration} steps(${({ $frameCount }) => $frameCount}) infinite,
    movePath-${({ $creatureId }) => $creatureId} ${({ $pathDuration }) => $pathDuration} linear infinite ${({ $delay }) => $delay};
  
  /* Movement path */
  left: ${({ $startX }) => $startX}%;
  top: ${({ $startY }) => $startY}%;
  
  @keyframes movePath-${({ $creatureId }) => $creatureId} {
    0% {
      left: ${({ $startX }) => $startX}%;
      top: ${({ $startY }) => $startY}%;
    }
    100% {
      left: ${({ $endX }) => $endX}%;
      top: ${({ $endY }) => $endY}%;
    }
  }
  
  @keyframes spriteAnimation-${({ $creatureId }) => $creatureId} {
    0% { background-position-x: 0; }
    100% { background-position-x: -${({ $spriteWidth, $frameCount }) => $spriteWidth * $frameCount}px; }
  }
`;

// Flying bird sprite (different animation pattern)
const FlyingSprite = styled.div<{ 
  $spriteSheet: string;
  $spriteWidth: number;
  $spriteHeight: number;
  $frameCount: number;
  $animationDuration: string;
  $pathDuration: string;
  $startX: number;
  $startY: number;
  $endX: number;
  $endY: number;
  $delay: string;
  $scale: number;
  $flightPath: string;
}>`
  position: absolute;
  width: ${({ $spriteWidth }) => $spriteWidth}px;
  height: ${({ $spriteHeight }) => $spriteHeight}px;
  background-image: url('${({ $spriteSheet }) => $spriteSheet}');
  background-size: ${({ $spriteWidth, $frameCount }) => $spriteWidth * $frameCount}px ${({ $spriteHeight }) => $spriteHeight}px;
  background-repeat: no-repeat;
  image-rendering: pixelated;
  pointer-events: auto; /* Make clickable */
  cursor: pointer;
  z-index: 0;
  transform: scale(${({ $scale }) => $scale});
  transform-origin: center;
  
  /* Hover effect for interactive feedback */
  &:hover {
    filter: brightness(1.2);
    transform: scale(${({ $scale }) => $scale * 1.1});
    transition: all 0.2s ease;
  }
  
  /* Override movement animation to use flight paths instead of linear movement */
  animation: 
    birdSpriteAnimation ${({ $animationDuration }) => $animationDuration} steps(${({ $frameCount }) => $frameCount}) infinite,
    ${({ $flightPath }) => $flightPath} ${({ $pathDuration }) => $pathDuration} ease-in-out infinite ${({ $delay }) => $delay};
  
  /* Initial position (will be overridden by flight path) */
  left: ${({ $startX }) => $startX}%;
  top: ${({ $startY }) => $startY}%;
  
  @keyframes birdSpriteAnimation {
    0% { background-position-x: 0; }
    100% { background-position-x: -${({ $spriteWidth, $frameCount }) => $spriteWidth * $frameCount}px; }
  }
  
  @keyframes birdFlight1 {
    0% { left: -10%; top: 15%; }
    25% { left: 20%; top: 10%; }
    50% { left: 50%; top: 8%; }
    75% { left: 80%; top: 12%; }
    100% { left: 110%; top: 18%; }
  }
  
  @keyframes birdFlight2 {
    0% { left: 110%; top: 20%; }
    25% { left: 75%; top: 15%; }
    50% { left: 40%; top: 12%; }
    75% { left: 15%; top: 18%; }
    100% { left: -10%; top: 25%; }
  }
  
  @keyframes birdFlight3 {
    0% { left: -10%; top: 8%; }
    50% { left: 60%; top: 5%; }
    100% { left: 110%; top: 12%; }
  }
`;

// Enhanced isometric room area with tutorial-aware visual states
const RoomArea = styled.div<{ 
  x: number; 
  y: number; 
  width: number; 
  height: number; 
  $roomId: string;
  $activityType: 'narrative' | 'challenge';
  $tutorialState?: 'available' | 'recommended' | 'disabled';
  $hospitalHovered: boolean;
}>`
  position: absolute;
  left: ${({ x }) => x}%;
  top: ${({ y }) => y}%;
  width: ${({ width }) => width}%;
  height: ${({ height }) => height}%;
  z-index: 2;
  
  /* Hide room areas when hospital roof is closed */
  opacity: ${({ $hospitalHovered }) => $hospitalHovered ? 1 : 0};
  visibility: ${({ $hospitalHovered }) => $hospitalHovered ? 'visible' : 'hidden'};
  transition: opacity 0.3s ease-in-out, visibility 0.3s ease-in-out;
  
  /* Isometric diamond shape using clip-path */
  clip-path: polygon(
    50% 0%,     /* top point */
    100% 30%,   /* top-right */
    100% 70%,   /* bottom-right */
    50% 100%,   /* bottom point */
    0% 70%,     /* bottom-left */
    0% 30%      /* top-left */
  );
  
  /* Tutorial-aware interactive glow */
  background: ${({ $roomId, $tutorialState }) => {
    const baseColors = {
      'physics-office': 'rgba(59, 130, 246, 0.15)',
      'linac-1': 'rgba(16, 185, 129, 0.15)', 
      'linac-2': 'rgba(245, 158, 11, 0.15)',
      'dosimetry-lab': 'rgba(236, 72, 153, 0.15)',
      'simulation-suite': 'rgba(245, 158, 11, 0.15)',
      'default': 'rgba(124, 58, 237, 0.15)'
    };
    
    const roomColor = baseColors[$roomId as keyof typeof baseColors] || baseColors.default;
    
    // Tutorial state modifications
    if ($tutorialState === 'disabled') {
      return `radial-gradient(ellipse at center, rgba(100, 100, 100, 0.08) 0%, rgba(100, 100, 100, 0.03) 60%, transparent 100%)`;
    } else if ($tutorialState === 'recommended') {
      // Brighter, more prominent for recommended rooms
      const brightColor = roomColor.replace('0.15', '0.25');
      return `radial-gradient(ellipse at center, ${brightColor} 0%, ${roomColor.replace('0.15', '0.08')} 60%, transparent 100%)`;
    }
    
    // Default state
    return `radial-gradient(ellipse at center, ${roomColor} 0%, ${roomColor.replace('0.15', '0.05')} 60%, transparent 100%)`;
  }};
  
  border: 2px solid transparent;
  
  transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  cursor: ${({ $tutorialState }) => $tutorialState === 'disabled' ? 'not-allowed' : 'pointer'};
  
  /* Tutorial-aware animations */
  animation: ${({ $tutorialState }) => {
    if ($tutorialState === 'disabled') return 'none';
    if ($tutorialState === 'recommended') return 'roomPulseRecommended 2s ease-in-out infinite';
    return 'roomPulse 3s ease-in-out infinite';
  }};
  
  /* Tutorial-aware opacity */
  opacity: ${({ $tutorialState }) => $tutorialState === 'disabled' ? 0.3 : 1};
  
  /* Hover effects - completely disabled for disabled rooms */
  &:hover {
    /* Only apply hover effects if not disabled */
    transform: ${({ $tutorialState }) => $tutorialState === 'disabled' ? 'none' : 'scale(1.08)'};
    background: ${({ $roomId, $tutorialState }) => {
      if ($tutorialState === 'disabled') return undefined; // Keep original background
      
      const hoverColors = {
        'physics-office': 'rgba(59, 130, 246, 0.25)',
        'linac-1': 'rgba(16, 185, 129, 0.25)',
        'linac-2': 'rgba(245, 158, 11, 0.25)',
        'dosimetry-lab': 'rgba(236, 72, 153, 0.25)',
        'simulation-suite': 'rgba(245, 158, 11, 0.25)',
        'default': 'rgba(124, 58, 237, 0.25)'
      };
      
      const roomColor = hoverColors[$roomId as keyof typeof hoverColors] || hoverColors.default;
      return `radial-gradient(ellipse at center, ${roomColor} 0%, ${roomColor.replace('0.25', '0.12')} 60%, transparent 100%)`;
    }};
    border-color: ${({ $tutorialState }) => $tutorialState === 'disabled' ? 'transparent' : 'transparent'};
    box-shadow: ${({ $tutorialState, $roomId }) => {
      if ($tutorialState === 'disabled') return undefined; // Keep original shadow
      
      const shadowColors = {
        'physics-office': 'rgba(59, 130, 246, 0.3)',
        'linac-1': 'rgba(16, 185, 129, 0.3)',
        'linac-2': 'rgba(245, 158, 11, 0.3)',
        'dosimetry-lab': 'rgba(236, 72, 153, 0.3)',
        'simulation-suite': 'rgba(245, 158, 11, 0.3)',
        'default': 'rgba(124, 58, 237, 0.3)'
      };
      
      const shadowColor = shadowColors[$roomId as keyof typeof shadowColors] || shadowColors.default;
      return `0 0 20px ${shadowColor}`;
    }};
    animation: ${({ $tutorialState }) => $tutorialState === 'disabled' ? undefined : 'roomPulseHover 1.5s ease-in-out infinite'};
  }
`;

// Enhanced room indicator with tutorial state awareness
const RoomIndicator = styled.div<{ 
  $roomId: string; 
  $tutorialState?: 'available' | 'recommended' | 'disabled';
}>`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 32px;
  height: 32px;
  background: ${({ $roomId, $tutorialState }) => {
    if ($tutorialState === 'disabled') {
      return 'rgba(120, 120, 120, 0.4)';
    }
    
    const baseColors = {
      'physics-office': 'rgba(59, 130, 246, 0.9)',
      'linac-1': 'rgba(16, 185, 129, 0.9)',
      'linac-2': 'rgba(245, 158, 11, 0.9)',
      'dosimetry-lab': 'rgba(236, 72, 153, 0.9)',
      'simulation-suite': 'rgba(245, 158, 11, 0.9)',
      'default': 'rgba(124, 58, 237, 0.9)'
    };
    
    return baseColors[$roomId as keyof typeof baseColors] || baseColors.default;
  }};
  border: 2px solid ${({ $tutorialState }) => $tutorialState === 'disabled' ? 'rgba(150, 150, 150, 0.5)' : 'white'};
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  color: ${({ $tutorialState }) => $tutorialState === 'disabled' ? 'rgba(200, 200, 200, 0.6)' : 'white'};
  font-weight: bold;
  box-shadow: ${({ $tutorialState }) => $tutorialState === 'disabled' ? 'none' : '0 4px 12px rgba(0, 0, 0, 0.3)'};
  animation: ${({ $tutorialState }) => {
    if ($tutorialState === 'disabled') return 'none';
    if ($tutorialState === 'recommended') return 'indicatorBobRecommended 1.5s ease-in-out infinite';
    return 'indicatorBob 2s ease-in-out infinite';
  }};
  pointer-events: none;
  z-index: 5;
  
  ${RoomArea}:hover & {
    animation: ${({ $tutorialState }) => {
      if ($tutorialState === 'disabled') return 'none';
      return 'indicatorBobHover 1s ease-in-out infinite';
    }};
    transform: ${({ $tutorialState }) => 
      $tutorialState === 'disabled' 
        ? 'translate(-50%, -50%)' 
        : 'translate(-50%, -50%) scale(1.1)'
    };
  }
`;

// Temporary placeholder sprite for testing (replace with real sprites later)
const PlaceholderSprite = styled.div<{
  $color: string;
  $pathDuration: string;
  $startX: number;
  $startY: number;
  $endX: number;
  $endY: number;
  $delay: string;
  $scale: number;
  $width: number;
  $height: number;
}>`
  position: absolute;
  width: ${({ $width, $scale }) => $width * $scale}px;
  height: ${({ $height, $scale }) => $height * $scale}px;
  background: ${({ $color }) => $color};
  border-radius: 50%;
  pointer-events: auto; /* Make clickable */
  cursor: pointer;
  z-index: 0;
  
  /* Hover effect for interactive feedback */
  &:hover {
    filter: brightness(1.2);
    transform: scale(1.1);
    transition: all 0.2s ease;
  }
  
  /* Simple pulsing animation to show life */
  animation: 
    placeholderPulse 2s ease-in-out infinite,
    movePath ${({ $pathDuration }) => $pathDuration} linear infinite ${({ $delay }) => $delay};
  
  left: ${({ $startX }) => $startX}%;
  top: ${({ $startY }) => $startY}%;
  
  @keyframes movePath {
    0% {
      left: ${({ $startX }) => $startX}%;
      top: ${({ $startY }) => $startY}%;
    }
    100% {
      left: ${({ $endX }) => $endX}%;
      top: ${({ $endY }) => $endY}%;
    }
  }
  
  @keyframes placeholderPulse {
    0%, 100% { opacity: 0.6; }
    50% { opacity: 1; }
  }
`;

// Flying placeholder with different movement
const FlyingPlaceholder = styled(PlaceholderSprite)<{ $flightPath: string }>`
  border-radius: 20% 80%;
  animation: 
    placeholderPulse 1s ease-in-out infinite,
    ${({ $flightPath }) => $flightPath} ${({ $pathDuration }) => $pathDuration} ease-in-out infinite ${({ $delay }) => $delay};
  
  @keyframes birdFlight1 {
    0% { left: -10%; top: 15%; }
    25% { left: 20%; top: 10%; }
    50% { left: 50%; top: 8%; }
    75% { left: 80%; top: 12%; }
    100% { left: 110%; top: 18%; }
  }
  
  @keyframes birdFlight2 {
    0% { left: 110%; top: 20%; }
    25% { left: 75%; top: 15%; }
    50% { left: 40%; top: 12%; }
    75% { left: 15%; top: 18%; }
    100% { left: -10%; top: 25%; }
  }
  
  @keyframes birdFlight3 {
    0% { left: -10%; top: 8%; }
    50% { left: 60%; top: 5%; }
    100% { left: 110%; top: 12%; }
  }
`;

// Temporary placeholder configurations (easier to test)
const PLACEHOLDER_CREATURES = [
  // Birds (blue circles) - reduced from 3 to 2
  {
    id: 'bird-1',
    type: 'bird',
    color: '#3B82F6',
    width: 16,
    height: 16,
    pathDuration: '25s',
    startX: 0,
    startY: 0,
    endX: 0,
    endY: 0,
    delay: '0s',
    scale: 2,
    flightPath: 'birdFlight1'
  },
  {
    id: 'bird-2', 
    type: 'bird',
    color: '#60A5FA',
    width: 16,
    height: 16,
    pathDuration: '30s',
    startX: 0,
    startY: 0,
    endX: 0,
    endY: 0,
    delay: '8s',
    scale: 1.5,
    flightPath: 'birdFlight2'
  },

  // People (green circles) - reduced from 2 to 1, avoiding lake region
  {
    id: 'person-1',
    type: 'person',
    color: '#10B981',
    width: 16,
    height: 24,
    pathDuration: '45s',
    startX: 5,
    startY: 75,
    endX: 60,
    endY: 65,
    delay: '0s',
    scale: 2
  },

  // Deer (brown circles) - reduced from 2 to 1
  {
    id: 'deer-1',
    type: 'deer',
    color: '#92400E',
    width: 24,
    height: 24,
    pathDuration: '60s',
    startX: 15,
    startY: 15,
    endX: 25,
    endY: 20,
    delay: '5s',
    scale: 1.5
  },

  // Small animals (orange circles) - reduced from 2 to 1, moved higher up
  {
    id: 'small-1',
    type: 'small-animal',
    color: '#F59E0B',
    width: 12,
    height: 12,
    pathDuration: '35s',
    startX: 70,
    startY: 15,
    endX: 80,
    endY: 20,
    delay: '10s',
    scale: 1.5
  }
];

// Render function for placeholder creatures
const renderPlaceholderCreature = (creature: any) => {
  if (creature.type === 'bird' && creature.flightPath) {
    return (
      <FlyingPlaceholder
        key={creature.id}
        $color={creature.color}
        $pathDuration={creature.pathDuration}
        $startX={creature.startX}
        $startY={creature.startY}
        $endX={creature.endX}
        $endY={creature.endY}
        $delay={creature.delay}
        $scale={creature.scale}
        $width={creature.width}
        $height={creature.height}
        $flightPath={creature.flightPath}
      />
    );
  } else {
    return (
      <PlaceholderSprite
        key={creature.id}
        $color={creature.color}
        $pathDuration={creature.pathDuration}
        $startX={creature.startX}
        $startY={creature.startY}
        $endX={creature.endX}
        $endY={creature.endY}
        $delay={creature.delay}
        $scale={creature.scale}
        $width={creature.width}
        $height={creature.height}
      />
    );
  }
};

// Room definitions with isometric click areas and thematic icons
const ROOM_AREAS = [
  {
    id: 'physics-office',
    name: 'Physics Office',
    x: 25, y: 31, width: 10, height: 10,
    mentorId: 'garcia',
    mentorName: 'Dr. Garcia',
    activityType: 'narrative' as const,
    icon: '📊' // Analysis and planning
  },
  {
    id: 'cafeteria',
    name: 'Hospital Cafeteria',
    x: 14, y: 41, width: 12, height: 10,
    mentorId: 'quinn', // Quinn organizes the lunch scene
    mentorName: 'Team Lunch',
    activityType: 'narrative' as const,
    icon: '🍽️' // Dining and team gathering
  },
  {
    id: 'linac-1',
    name: 'LINAC Room 1', 
    x: 56, y: 24, width: 16, height: 18,
    mentorId: 'garcia',
    mentorName: 'Dr. Garcia',
    activityType: 'narrative' as const,
    icon: '⚡' // High-energy equipment
  },
  {
    id: 'linac-2',
    name: 'LINAC Room 2',
    x: 65, y: 32, width: 16, height: 18,
    mentorId: 'jesse',
    mentorName: 'Jesse',
    activityType: 'narrative' as const,
    icon: '⚡' // High-energy equipment
  },
  {
    id: 'dosimetry-lab',
    name: 'Dosimetry Lab',
    x: 75.5, y: 53, width: 12, height: 10,
    mentorId: 'kapoor',
    mentorName: 'Dr. Kapoor',
    activityType: 'narrative' as const,
    icon: '🔬' // Precision measurement
  },
  {
    id: 'simulation-suite',
    name: 'Simulation Suite',
    x: 41, y: 20, width: 19, height: 15,
    mentorId: 'jesse',
    mentorName: 'Jesse',
    activityType: 'narrative' as const,
    icon: '🎯' // Targeting and simulation
  }
];

// Ambient creature configurations
interface AmbientCreature {
  id: string;
  type: 'bird' | 'person' | 'deer' | 'small-animal';
  spriteSheet: string;
  spriteWidth: number;
  spriteHeight: number;
  frameCount: number;
  animationDuration: string;
  pathDuration: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  delay: string;
  scale: number;
  flightPath?: string; // For birds
}

const AMBIENT_CREATURES: AmbientCreature[] = [
  // Flying Birds (reduced from 3 to 2)
  {
    id: 'bird-1',
    type: 'bird',
    spriteSheet: '/images/ambient/birds.png',
    spriteWidth: 16,
    spriteHeight: 16,
    frameCount: 4,
    animationDuration: '0.8s',
    pathDuration: '25s',
    startX: 0,
    startY: 0,
    endX: 0,
    endY: 0,
    delay: '0s',
    scale: 2,
    flightPath: 'birdFlight1'
  },
  {
    id: 'bird-2',
    type: 'bird',
    spriteSheet: '/images/ambient/birds.png',
    spriteWidth: 16,
    spriteHeight: 16,
    frameCount: 4,
    animationDuration: '0.6s',
    pathDuration: '30s',
    startX: 0,
    startY: 0,
    endX: 0,
    endY: 0,
    delay: '8s',
    scale: 1.5,
    flightPath: 'birdFlight2'
  },

  // Mentor-Specific Walking Sprites - Each mentor in their area of expertise
  
  // Dr. Garcia - Walking around LINAC Room 1 and Physics Office (clinical areas)
  {
    id: 'garcia-walking',
    type: 'person',
    spriteSheet: '/images/ambient/garcia-walking.png',
    spriteWidth: 16,
    spriteHeight: 24,
    frameCount: 6,
    animationDuration: '1.1s',
    pathDuration: '50s',
    startX: 50,
    startY: 22,
    endX: 30,
    endY: 35,
    delay: '5s',
    scale: 1.8
  },

  // Jesse - Walking around LINAC Room 2 and Simulation Suite (equipment areas)
  {
    id: 'jesse-walking',
    type: 'person',
    spriteSheet: '/images/ambient/jesse-walking.png',
    spriteWidth: 16,
    spriteHeight: 24,
    frameCount: 6,
    animationDuration: '1.3s',
    pathDuration: '55s',
    startX: 38,
    startY: 18,
    endX: 68,
    endY: 38,
    delay: '12s',
    scale: 1.9
  },

  // Dr. Kapoor - Walking around Dosimetry Lab (precision measurement area)
  {
    id: 'kapoor-walking',
    type: 'person',
    spriteSheet: '/images/ambient/kapoor-walking.png',
    spriteWidth: 16,
    spriteHeight: 24,
    frameCount: 6,
    animationDuration: '1.0s',
    pathDuration: '40s',
    startX: 72,
    startY: 50,
    endX: 80,
    endY: 58,
    delay: '8s',
    scale: 1.7
  },

  // Dr. Quinn - Walking around Physics Office and hospital corridors (administrative/planning)
  {
    id: 'quinn-walking',
    type: 'person',
    spriteSheet: '/images/ambient/quinn-walking.png',
    spriteWidth: 16,
    spriteHeight: 24,
    frameCount: 6,
    animationDuration: '1.15s',
    pathDuration: '48s',
    startX: 20,
    startY: 28,
    endX: 35,
    endY: 45,
    delay: '15s',
    scale: 1.85
  },

  // Deer in forested areas (reduced from 2 to 1)
  {
    id: 'deer-1',
    type: 'deer',
    spriteSheet: '/images/ambient/deer.png',
    spriteWidth: 24,
    spriteHeight: 24,
    frameCount: 4,
    animationDuration: '2.0s',
    pathDuration: '60s',
    startX: 15,
    startY: 15,
    endX: 25,
    endY: 20,
    delay: '5s',
    scale: 1.5
  },

  // Small animals (reduced from 2 to 1, moved higher up)
  {
    id: 'small-animal-1',
    type: 'small-animal',
    spriteSheet: '/images/ambient/small-animals.png',
    spriteWidth: 12,
    spriteHeight: 12,
    frameCount: 3,
    animationDuration: '0.8s',
    pathDuration: '35s',
    startX: 70,
    startY: 15,
    endX: 80,
    endY: 20,
    delay: '10s',
    scale: 1.5
  }
];

// Utility function to render ambient creatures with click handlers
const renderAmbientCreature = (creature: AmbientCreature, handleClick: (creature: AmbientCreature, event: React.MouseEvent) => void) => {
  if (creature.type === 'bird' && creature.flightPath) {
    return (
      <FlyingSprite
        key={creature.id}
        $spriteSheet={creature.spriteSheet}
        $spriteWidth={creature.spriteWidth}
        $spriteHeight={creature.spriteHeight}
        $frameCount={creature.frameCount}
        $animationDuration={creature.animationDuration}
        $pathDuration={creature.pathDuration}
        $startX={creature.startX}
        $startY={creature.startY}
        $endX={creature.endX}
        $endY={creature.endY}
        $delay={creature.delay}
        $scale={creature.scale}
        $flightPath={creature.flightPath}
        onClick={(event) => handleClick(creature, event)}
        title={
          creature.id === 'garcia-walking' ? 'Click Dr. Garcia!' :
          creature.id === 'jesse-walking' ? 'Click Jesse!' :
          creature.id === 'kapoor-walking' ? 'Click Dr. Kapoor!' :
          creature.id === 'quinn-walking' ? 'Click Dr. Quinn!' :
          `Click the ${creature.type}!`
        }
      />
    );
  } else {
    return (
      <AmbientSprite
        key={creature.id}
        $spriteSheet={creature.spriteSheet}
        $spriteWidth={creature.spriteWidth}
        $spriteHeight={creature.spriteHeight}
        $frameCount={creature.frameCount}
        $animationDuration={creature.animationDuration}
        $pathDuration={creature.pathDuration}
        $startX={creature.startX}
        $startY={creature.startY}
        $endX={creature.endX}
        $endY={creature.endY}
        $delay={creature.delay}
        $scale={creature.scale}
        $creatureId={creature.id}
        onClick={(event) => handleClick(creature, event)}
        title={
          creature.id === 'garcia-walking' ? 'Click Dr. Garcia!' :
          creature.id === 'jesse-walking' ? 'Click Jesse!' :
          creature.id === 'kapoor-walking' ? 'Click Dr. Kapoor!' :
          creature.id === 'quinn-walking' ? 'Click Dr. Quinn!' :
          `Click the ${creature.type}!`
        }
      />
    );
  }
};

// Weather/Time Circular UI Window
const WeatherTimeWindow = styled.div`
  position: absolute;
  top: 30px;
  left: 30px;
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: rgba(15, 23, 42, 0.9);
  border: 2px solid rgba(124, 58, 237, 0.5);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 
    0 4px 20px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
  z-index: 10;
  cursor: pointer;
  
  &:hover {
    transform: scale(1.05);
    border-color: rgba(124, 58, 237, 0.8);
    box-shadow: 
      0 6px 25px rgba(0, 0, 0, 0.4),
      0 0 20px rgba(124, 58, 237, 0.3);
  }
`;

const WeatherIcon = styled.div`
  width: 48px;
  height: 48px;
  background-image: url('/images/hospital/time-symbols.png');
  background-size: 550px 50px; /* 275px * 2 for 2x scale, 25px * 2 for 2x scale */
  background-repeat: no-repeat;
  image-rendering: pixelated;
`;

// Tutorial guidance display
const TutorialGuidanceOverlay = styled.div<{ $visible: boolean }>`
  position: absolute;
  top: 20px;
  right: 20px;
  background: rgba(0, 0, 0, 0.85);
  color: white;
  padding: 12px 16px;
  border-radius: 8px;
  max-width: 300px;
  opacity: ${({ $visible }) => $visible ? 1 : 0};
  transform: translateY(${({ $visible }) => $visible ? '0' : '-10px'});
  transition: all 0.3s ease;
  pointer-events: ${({ $visible }) => $visible ? 'auto' : 'none'};
  z-index: 20;
  border-left: 4px solid #10B981;
  
  font-size: 14px;
  line-height: 1.4;
  
  &::before {
    content: '🎓 ';
    font-size: 16px;
    margin-right: 6px;
  }
`;

// Toast notification for user feedback
const ToastNotification = styled.div<{ $visible: boolean }>`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(220, 38, 38, 0.95);
  color: white;
  padding: 16px 24px;
  border-radius: 12px;
  max-width: 400px;
  text-align: center;
  opacity: ${({ $visible }) => $visible ? 1 : 0};
  transform: translate(-50%, -50%) scale(${({ $visible }) => $visible ? 1 : 0.9});
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  pointer-events: none;
  z-index: 30;
  border: 2px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  
  font-size: 16px;
  font-weight: 500;
  line-height: 1.4;
  
  &::before {
    content: '🚫 ';
    font-size: 20px;
    margin-right: 8px;
  }
`;

const BackButton = styled.button`
  position: absolute;
  top: 20px;
  left: 20px;
  background: rgba(0, 0, 0, 0.7);
  color: #fff;
  border: none;
  padding: 10px 15px;
  border-radius: 5px;
  cursor: pointer;
  font-size: 14px;
  
  &:hover {
    background: rgba(0, 0, 0, 0.9);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export default function HospitalBackdrop() {
  const [hoveredRoom, setHoveredRoom] = useState<typeof ROOM_AREAS[0] | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [currentTime, setCurrentTime] = useState(new Date());
  const [debugFrameIndex, setDebugFrameIndex] = useState<number | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isHospitalHovered, setIsHospitalHovered] = useState(false);
  
  // Container ref for reaction system
  const hospitalContainerRef = React.useRef<HTMLDivElement>(null);
  
  // Direct reaction state management (bypass the hook issue)
  const [directReactions, setDirectReactions] = React.useState<Array<{
    id: string;
    type: ReactionSymbolType;
    x: number;
    y: number;
    stage: 'appearing' | 'floating';
    timestamp: number;
  }>>([]);
  
  // Direct trigger function 
  const triggerDirectReaction = (type: ReactionSymbolType, x?: number, y?: number) => {
    const newReaction = {
      id: `direct-${Date.now()}-${Math.random()}`,
      type,
      x: x ?? 300,
      y: y ?? 200,
      stage: 'appearing' as const,
      timestamp: Date.now()
    };
    
    setDirectReactions(prev => [...prev, newReaction]);
    
    // Transition to floating stage after bounce-in animation
    setTimeout(() => {
      setDirectReactions(prev => 
        prev.map(reaction => 
          reaction.id === newReaction.id 
            ? { ...reaction, stage: 'floating' }
            : reaction
        )
      );
    }, 150);
    
    // Remove after total animation time (150ms bounce + 800ms float)
    setTimeout(() => {
      setDirectReactions(prev => prev.filter(r => r.id !== newReaction.id));
    }, 950);
  };
  
  // Test reaction function for debugging
  const testReaction = () => {
    triggerDirectReaction('!', 400, 300); // Fixed position for testing
  };
  
  // Update time every minute for weather icon only
  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);
  
  // Get sprite frame position based on current hour (or debug override)
  const getWeatherIconPosition = () => {
    let frameIndex = 0;
    
    // Use debug frame if set, otherwise calculate from time
    if (debugFrameIndex !== null) {
      frameIndex = debugFrameIndex;
    } else {
      const hour = currentTime.getHours();
      
      if (hour >= 6 && hour < 18) {
        // Daytime - use sun frames (frames 1-5)
        // Map 6-17 hours to frames 1-5
        const dayProgress = (hour - 6) / 12; // 0 to 1
        frameIndex = Math.floor(dayProgress * 5) + 1; // frames 1-5
        frameIndex = Math.min(frameIndex, 5); // cap at frame 5
      } else {
        // Nighttime - use moon frames (frames 6-10)
        // Map 18-5 hours to frames 6-10
        let nightHour = hour >= 18 ? hour - 18 : hour + 6; // 0-11 night hours
        const nightProgress = nightHour / 12; // 0 to 1
        frameIndex = Math.floor(nightProgress * 5) + 6; // frames 6-10
        frameIndex = Math.min(frameIndex, 10); // cap at frame 10
      }
    }
    
    // Each frame is 25px wide, scaled to 50px (2x)
    const xPosition = -frameIndex * 50;
    return `${xPosition}px 0px`;
  };
  
  // Debug function to cycle through frames
  const handleTimeDisplayClick = () => {
    if (debugFrameIndex === null) {
      setDebugFrameIndex(0); // Start with frame 0
    } else if (debugFrameIndex >= 10) {
      setDebugFrameIndex(null); // Reset to automatic after frame 10
    } else {
      setDebugFrameIndex(debugFrameIndex + 1); // Next frame
    }
  };
  
  const { 
    enterNarrative, 
    enterChallenge, 
    returnToPrevious, 
    canGoBack,
    goToConstellation 
  } = useSceneNavigation();
  

  const tutorialStore = useTutorialStore();
  const dialogueStore = useDialogueStore();
  
  // Get tutorial state for room availability
  const currentTutorialStep = tutorialStore.currentStep;
  const tutorialMode = tutorialStore.mode;
  const isTutorialActive = tutorialMode === 'active_sequence';
  
  // Get tutorial guidance text
  const tutorialGuidance = isTutorialActive ? getTutorialStepGuidance(currentTutorialStep) : '';
  
  // Determine tutorial state for each room
  const getRoomTutorialState = (roomId: string): 'available' | 'recommended' | 'disabled' => {
    if (!isTutorialActive) return 'available';
    
    if (!isRoomAvailableInTutorial(roomId, currentTutorialStep)) {
      return 'disabled';
    }
    
    if (isRecommendedTutorialRoom(roomId, currentTutorialStep)) {
      return 'recommended';
    }
    
    return 'available';
  };
  
  const handleRoomClick = (room: typeof ROOM_AREAS[0]) => {
    // Check tutorial availability first
    if (isTutorialActive && !isRoomAvailableInTutorial(room.id, currentTutorialStep)) {
      // Show feedback for unavailable room click
      const stepConfig = currentTutorialStep ? TUTORIAL_STEP_ROOM_AVAILABILITY[currentTutorialStep] : null;
      const message = stepConfig?.description || `Room not available during this tutorial step`;
      
      setToastMessage(`${room.name} is not available right now. ${message}`);
      setTimeout(() => setToastMessage(null), 4000);
      return;
    }
    
    const tutorialMode = tutorialStore.mode;
    
    // Single decision tree based on tutorial mode
    switch (tutorialMode) {
      case 'active_sequence':
        // Try tutorial-specific dialogue first
        if (tutorialStore.currentStep) {
          const tutorialDialogueId = getTutorialDialogueForRoom(room.id, tutorialStore.currentStep);
          if (tutorialDialogueId) {
            dialogueStore.startDialogue(tutorialDialogueId);
            enterNarrative(room.mentorId, tutorialDialogueId, room.id);
            return;
          }
        }
        // Fall through to default if no tutorial dialogue
        break;
        
      case 'background_hints':
        // Show hints but use normal dialogues
        // TODO: Add subtle hint overlays here
        break;
        
      case 'disabled':
      case 'debug_mode':
      default:
        // Normal gameplay
        break;
    }
    
    // Default room behavior (used for all modes if no tutorial override)
    if (room.activityType === 'narrative') {
      enterNarrative(room.mentorId, `${room.id}-intro`, room.id);
    } else {
      enterChallenge(`${room.id}-activity`, room.mentorId, room.id);
    }
  };
  
    const handleRoomHover = (room: typeof ROOM_AREAS[0], event: React.MouseEvent) => {
    // Check if room is disabled in tutorial - don't show tooltip for disabled rooms
    const tutorialState = getRoomTutorialState(room.id);
    if (tutorialState === 'disabled') {
      // Explicitly clear hovered room for disabled rooms to prevent glitches
      setHoveredRoom(null);
      return;
    }
    
    setHoveredRoom(room);
    
    // Calculate position relative to the room area center
    const rect = event.currentTarget.getBoundingClientRect();
    const centerX = rect.left + (rect.width / 2);
    const centerY = rect.top + (rect.height / 2) - 50; // Offset slightly above
    
    setTooltipPosition({ x: centerX, y: centerY });
  };

  const handleRoomLeave = () => {
    // Clear hovered room when leaving any room
    setHoveredRoom(null);
  };

  const handleHospitalHover = () => {
    setIsHospitalHovered(true);
  };

  const handleHospitalLeave = () => {
    setIsHospitalHovered(false);
  };
  
  // Handle creature clicks and spawn reactions
  const handleCreatureClick = (creature: AmbientCreature, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent triggering hospital click
    
    // Get creature's current position for reaction placement
    const rect = event.currentTarget.getBoundingClientRect();
    const containerRect = hospitalContainerRef.current?.getBoundingClientRect();
    
    if (!containerRect) return;
    
    // Calculate position relative to container
    const relativeX = rect.left + rect.width / 2 - containerRect.left;
    const relativeY = rect.top + rect.height / 2 - containerRect.top - 20; // Offset above creature
    
    // Choose reaction based on creature type and specific mentor personalities
    let reactionType: ReactionSymbolType;
    switch (creature.type) {
      case 'bird':
        reactionType = Math.random() > 0.5 ? '!' : '⭐'; // Surprise or delight
        break;
      case 'person':
        // Check if it's a specific mentor
        if (creature.id === 'garcia-walking') {
          reactionType = Math.random() > 0.5 ? '💡' : '...'; // Thoughtful insight or caring contemplation
        } else if (creature.id === 'jesse-walking') {
          reactionType = Math.random() > 0.5 ? '!' : '?'; // Direct surprise or practical questioning
        } else if (creature.id === 'kapoor-walking') {
          reactionType = Math.random() > 0.5 ? '...' : '💡'; // Systematic thinking or precise insight
        } else if (creature.id === 'quinn-walking') {
          reactionType = Math.random() > 0.5 ? '⭐' : '💡'; // Pattern recognition or scientific excitement
        } else {
          reactionType = Math.random() > 0.5 ? '?' : '...'; // Generic confusion or thinking
        }
        break;
      case 'deer':
        reactionType = Math.random() > 0.5 ? '!' : '?'; // Alert or curious
        break;
      case 'small-animal':
        reactionType = Math.random() > 0.5 ? '!' : '💡'; // Startled or clever
        break;
      default:
        reactionType = '!';
    }
    
    // Trigger reaction using the direct reaction system
    triggerDirectReaction(reactionType, relativeX, relativeY);
  };
  
  return (
    <HospitalContainer ref={hospitalContainerRef}>
      {/* Weather/Time Circular UI Window */}
      <WeatherTimeWindow onClick={handleTimeDisplayClick}>
        <WeatherIcon style={{ backgroundPosition: getWeatherIconPosition() }} />
      </WeatherTimeWindow>
      
      {/* Tutorial Guidance Overlay */}
      <TutorialGuidanceOverlay $visible={isTutorialActive && !!tutorialGuidance}>
        {tutorialGuidance}
      </TutorialGuidanceOverlay>
      
      {/* Toast Notification for Tutorial Feedback */}
      <ToastNotification $visible={!!toastMessage}>
        {toastMessage}
      </ToastNotification>
      
      {canGoBack && (
        <BackButton onClick={returnToPrevious}>
          ← Back
        </BackButton>
      )}
      
      <HospitalBuilding
        onMouseEnter={handleHospitalHover}
        onMouseLeave={handleHospitalLeave}
      >
        {/* Hospital floor overlay that fades on hover */}
        <HospitalFloorOverlay $isHovered={isHospitalHovered} />
        
        {ROOM_AREAS.map(room => {
          const tutorialState = getRoomTutorialState(room.id);
          
          return (
            <RoomArea
              key={room.id}
              x={room.x}
              y={room.y} 
              width={room.width}
              height={room.height}
              $roomId={room.id}
              $activityType={room.activityType}
              $tutorialState={tutorialState}
              $hospitalHovered={isHospitalHovered}
              onClick={() => handleRoomClick(room)}
              onMouseEnter={(e: React.MouseEvent) => handleRoomHover(room, e)}
              onMouseLeave={handleRoomLeave}
            >
              <RoomIndicator $roomId={room.id} $tutorialState={tutorialState}>
                {room.icon}
              </RoomIndicator>
            </RoomArea>
          );
        })}
      </HospitalBuilding>
      
      {/* Ambient Creatures - Behind everything but add life to the scene */}
      {/* 
        TESTING: All creature types with proper scaling approach
        - Container: Original sprite dimensions
        - Background-size: Original sprite sheet dimensions  
        - Background-position: Original calculations
        - Visual scaling: CSS transform: scale() applied to whole element
      */}
      
      {/* Real Bird Sprites (fixed scaling conflicts) */}
      {AMBIENT_CREATURES.filter(creature => creature.type === 'bird').map(creature => renderAmbientCreature(creature, handleCreatureClick))}
      
      {/* People sprites (including mentor-specific walking sprites) */}
      {AMBIENT_CREATURES.filter(creature => creature.type === 'person').map(creature => renderAmbientCreature(creature, handleCreatureClick))}
      
      {/* Deer sprites (testing) */}
      {AMBIENT_CREATURES.filter(creature => creature.type === 'deer').map(creature => renderAmbientCreature(creature, handleCreatureClick))}
      
      {/* Small animal sprites (testing) */}
      {AMBIENT_CREATURES.filter(creature => creature.type === 'small-animal').map(creature => renderAmbientCreature(creature, handleCreatureClick))}

      {/* Reaction System for creature interactions */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 1000
      }}>
        {directReactions.map((reaction) => (
          <FloatingReaction
            key={reaction.id}
            $stage={reaction.stage}
            style={{
              left: `${reaction.x - 17.5}px`, // Center the 35px sprite
              top: `${reaction.y - 17.5}px`
            }}
          >
            <SpriteSymbol $symbolIndex={SYMBOL_SPRITE_MAP[reaction.type]} />
          </FloatingReaction>
        ))}
      </div>

      {/* Always render overlay to prevent strobing - control visibility with opacity */}
      <HospitalRoomOverlay
        visible={!!hoveredRoom}
        roomId={hoveredRoom?.id || ''}
        roomName={hoveredRoom?.name || ''}
        mentorName={hoveredRoom?.mentorName || ''}
        activityType={hoveredRoom?.activityType || 'narrative'}
        x={tooltipPosition.x}
        y={tooltipPosition.y}
      />
      
      {/* Quick access buttons */}
      <button
        style={{
          position: 'absolute',
          bottom: '70px',
          right: '20px',
          background: 'rgba(220, 38, 38, 0.8)',
          color: '#fff',
          border: 'none',
          padding: '8px 16px',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '12px'
        }}
        onClick={testReaction}
      >
        🧪 Test Reaction
      </button>
      
      <button
        style={{
          position: 'absolute',
          bottom: '20px',
          right: '20px',
          background: 'rgba(59, 130, 246, 0.8)',
          color: '#fff',
          border: 'none',
          padding: '12px 20px',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '14px'
        }}
        onClick={goToConstellation}
      >
        ⭐ Knowledge Constellation
      </button>
      
      {/* Enhanced CSS Animations with tutorial states */}
      <style jsx global>{`
        @keyframes roomPulse {
          0%, 100% { opacity: 0.8; }
          50% { opacity: 1; }
        }
        
        @keyframes roomPulseRecommended {
          0%, 100% { opacity: 0.9; }
          50% { opacity: 1; }
        }
        
        @keyframes roomPulseHover {
          0%, 100% { opacity: 0.9; }
          50% { opacity: 1; }
        }
        
        @keyframes indicatorBob {
          0%, 100% { 
            transform: translate(-50%, -50%) translateY(0px);
          }
          50% { 
            transform: translate(-50%, -50%) translateY(-3px);
          }
        }
        
        @keyframes indicatorBobRecommended {
          0%, 100% { 
            transform: translate(-50%, -50%) translateY(0px) scale(1.05);
          }
          50% { 
            transform: translate(-50%, -50%) translateY(-5px) scale(1.05);
          }
        }
        
        @keyframes indicatorBobHover {
          0%, 100% { 
            transform: translate(-50%, -50%) scale(1.1) translateY(0px);
          }
          50% { 
            transform: translate(-50%, -50%) scale(1.1) translateY(-5px);
          }
        }
      `}</style>
    </HospitalContainer>
  );
} 