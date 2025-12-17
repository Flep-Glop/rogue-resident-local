'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import styled, { css, keyframes } from 'styled-components';
import { useSceneStore } from '@/app/store/sceneStore';
import { useGameStore } from '@/app/store/gameStore';
import { useAbilityStore } from '@/app/store/abilityStore';

import ParallaxRenderer from './ParallaxRenderer';
import { ToastContainer, ExpandableQuestionContainer, ExpandableAnswerContainer, WindowContainer } from '@/app/components/ui/PixelContainer';
import StarDetailModal from '@/app/components/ui/StarDetailModal';

// === JUMBO SCREEN SYSTEM ===
const HOME_INTERNAL_WIDTH = 640;
const HOME_INTERNAL_HEIGHT = 360;
const JUMBO_ASSET_HEIGHT = 585;

const DEBUG_CLICKBOXES = false;
const DEBUG_BOUNDARIES = false; // Toggle visual boundary debugging

// Movement boundaries by floor
const FIRST_FLOOR_BOUNDS = {
  left: 58,
  right: 578,
};

const SECOND_FLOOR_BOUNDS = {
  left: 373, // Second floor only exists on the right side
  right: 545,
};

// Canvas-appropriate typography scale for 640×360 coordinate system
const CanvasFonts = {
  xs: '8px',   // For small tooltips and labels
  sm: '10px',  // For secondary text and values
  md: '12px',  // For primary content text
  lg: '14px',  // For headings and important text
  xl: '16px'   // For major headings
};

// Typography override wrapper for PixelContainer compatibility with canvas scaling
const CanvasTypographyOverride = styled.div`
  font-size: ${CanvasFonts.xs} !important;
  line-height: 1.4 !important;
  
  * {
    font-size: inherit !important;
    line-height: inherit !important;
  }
`;

// Star notification wrapper (positioned within canvas coordinates)
const StarNotificationWrapper = styled.div<{ $visible: boolean; $type: 'discovery' | 'growth' | 'mastery' | 'card' }>`
  position: absolute;
  top: 30px;  // Canvas coordinate positioning
  left: 50%;
  transform: translateX(-50%);
  z-index: 1500;
  
  opacity: ${props => props.$visible ? 1.0 : 0};
  transform: ${props => props.$visible 
    ? 'translateX(-50%) translateY(0px)' 
    : 'translateX(-50%) translateY(-20px)'
  };
  transition: opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1), transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  
  min-width: 160px;
  max-width: 200px;
`;

// Welcome toast wrapper (separate from star notifications for clarity)
const WelcomeToastWrapper = styled.div<{ $visible: boolean }>`
  position: absolute;
  top: 53px;  // Canvas coordinate positioning (consistent with toast templates)
  left: 50%;
  transform: translateX(-50%);
  z-index: 1600;

  opacity: ${props => props.$visible ? 1 : 0};
  transform: ${props => props.$visible
    ? 'translateX(-50%) translateY(0)'
    : 'translateX(-50%) translateY(-10px)'};
  transition: opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1), 
              transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
`;


// Star icon for notifications
const StarIcon = styled.div<{ $type: 'discovery' | 'growth' | 'mastery' | 'card' }>`
  display: inline-block;
  margin-right: 6px;
  font-size: 12px;
  
  &::before {
    content: '${props => 
      props.$type === 'discovery' ? '⭐' :
      props.$type === 'growth' ? '🌟' :
      props.$type === 'card' ? '🃏' :
      '✨'
    }';
  }
`;

// Welcome content wrapper for consistent layout
const WelcomeContent = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
`;

// Notification content styling
const NotificationContent = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
`;

// Viewport container - the 640x360 window
const JumboViewport = styled.div`
  width: ${HOME_INTERNAL_WIDTH}px;
  height: ${HOME_INTERNAL_HEIGHT}px;
  position: fixed;
  top: 50%;
  left: 50%;
  transform-origin: center;
  transform: translate(-50%, -50%) scale(var(--home-scale));
  overflow: hidden; /* Hide scrollbars - clip content to viewport */
  image-rendering: pixelated;
`;

// New Star Component - dual sprite sheet system
// Tutorial star (??? star) uses star-sheet.png frames 1-19 (1-indexed)
// Planetary systems use planetary-sheet.png: 96 frames (14x14 per frame, 0-indexed)
// Planetary sheet organization: 8 sets × 3 types (small moon, normal moon, planet) × 4 sections
// Section 0 (0-23): Default | Section 1 (24-47): Highlighted | Section 2 (48-71): Modal | Section 3 (72-95): Modal highlighted
const StarSprite = styled.div<{ $frame: number; $isPlanetarySystem?: boolean }>`
  position: absolute;
  width: 14px;
  height: 14px;
  background-color: transparent;
  background-image: url('${props => props.$isPlanetarySystem ? '/images/home/planetary-sheet.png' : '/images/home/star-sheet.png'}');
  background-size: ${props => props.$isPlanetarySystem 
    ? `${14 * 96}px 14px` /* 96 frames × 14px = 1344px width */
    : `${14 * 40}px 14px`}; /* 40 frames × 14px = 560px width */
  background-position: ${props => props.$isPlanetarySystem
    ? props.$frame * -14 /* 0-indexed for planetary sheet */
    : (props.$frame - 1) * -14}px 0px; /* 1-indexed for star sheet */
  background-repeat: no-repeat;
  image-rendering: pixelated;
  cursor: default; /* No click interaction - X key only */
  /* z-index set via inline styles: tutorial star at 200, constellation bodies at 2-3 */
  pointer-events: none; /* Disable mouse interaction completely */
`;

// Small text label that appears next to highlighted star
const StarNameLabel = styled.div`
  position: absolute;
  font-family: 'Aseprite', monospace;
  font-size: 12px;
  color: #ffffff;
  white-space: nowrap;
  pointer-events: none;
  image-rendering: pixelated;
  z-index: 201; /* Above stars */
`;

// Tiny star that orbits around HDR star (1x1 pixel)
const TinyStar = styled.div`
  position: absolute;
  width: 1px;
  height: 1px;
  background-image: url('/images/home/tiny-star.png');
  background-size: 1px 1px;
  background-repeat: no-repeat;
  image-rendering: pixelated;
  pointer-events: none;
  z-index: 200; /* Same level as stars */
`;

  // Boom effect overlay (simple screen flash)
const BoomEffectOverlay = styled.div<{ $visible: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(255, 215, 0, 0.6);
  z-index: 9997; /* Below letterbox bars for proper layering during cutscene */
  pointer-events: none;
  opacity: ${props => props.$visible ? 1 : 0};
  transition: opacity 0.2s ease-out;
`;

// Cinematic letterbox bars (top and bottom black bars for cutscenes)
// Asymmetrical design - bottom intrudes more than top
const CinematicLetterbox = styled.div<{ $visible: boolean; $position: 'top' | 'bottom' }>`
  position: fixed;
  left: 0;
  width: 100vw;
  background: #000000;
  z-index: 9998; /* Below boom effect, above everything else */
  pointer-events: none;
  
  ${props => props.$position === 'top' ? css`
    top: 0;
    height: 140px; /* Top bar smaller - less intrusion */
    transform: ${props.$visible ? 'translateY(0)' : 'translateY(-100%)'};
  ` : css`
    bottom: 0;
    height: 320px; /* Bottom bar larger - more dramatic intrusion */
    transform: ${props.$visible ? 'translateY(0)' : 'translateY(100%)'};
  `}
  
  /* Slow, dramatic swelling - takes a long time to reach destination */
  /* Logarithmic easing with extended duration - closes and closes and closessss... */
  transition: transform 7s cubic-bezier(0.15, 0.9, 0.3, 1);
`;

// Connection line between constellation stars
const ConnectionLine = styled.div<{ $x1: number; $y1: number; $x2: number; $y2: number }>`
  position: absolute;
  height: 1px;
  background: linear-gradient(90deg, 
    rgba(255, 215, 0, 0.3) 0%, 
    rgba(255, 215, 0, 0.5) 50%, 
    rgba(255, 215, 0, 0.3) 100%
  );
  transform-origin: left center;
  z-index: 199; /* Below stars but above parallax */
  pointer-events: none;
  
  /* Calculate position and rotation */
  left: ${props => props.$x1}px;
  top: ${props => props.$y1}px;
  width: ${props => {
    const dx = props.$x2 - props.$x1;
    const dy = props.$y2 - props.$y1;
    return Math.sqrt(dx * dx + dy * dy);
  }}px;
  transform: rotate(${props => {
    const dx = props.$x2 - props.$x1;
    const dy = props.$y2 - props.$y1;
    return Math.atan2(dy, dx);
  }}rad);
`;

// Telescope is now integrated into ParallaxRenderer as a layer

// Wrapper that follows the 'stars' parallax layer so the TutorialStar stays anchored relative to the sky
// Removed: StarAnchor to avoid transform-based drift

// Container for celestial bodies (stars/planets/moons) - always renders above abyss layers
// When tutorial star or planet is highlighted, elevates even higher for dramatic effect
const CelestialLayer = styled.div<{ $scrollPosition: number; $transitionDuration: number; $elevated?: boolean }>`
  position: absolute;
  top: 0;
  left: 0;
  width: ${HOME_INTERNAL_WIDTH}px;
  height: ${JUMBO_ASSET_HEIGHT}px;
  transform: translateY(${props => props.$scrollPosition}px);
  transition: transform ${props => props.$transitionDuration}s cubic-bezier(0.4, 0, 0.2, 1);
  image-rendering: pixelated;
  z-index: ${props => props.$elevated ? 15 : 14}; /* Always above abyss/purple-abyss (12-13), elevated (15) when highlighted */
  pointer-events: none; /* No interaction - X key handles star clicks */
  overflow: visible;
`;

// Container for elements that scroll together (foreground + clickable areas)
const ScrollingContent = styled.div<{ $scrollPosition: number; $transitionDuration: number }>`
  position: relative;
  width: ${HOME_INTERNAL_WIDTH}px;
  height: ${JUMBO_ASSET_HEIGHT}px;
  transform: translateY(${props => props.$scrollPosition}px);
  transition: transform ${props => props.$transitionDuration}s cubic-bezier(0.4, 0, 0.2, 1);
  image-rendering: pixelated;
  z-index: 12; /* Above clouds - contains foreground, Kapoor, and UI */
  overflow: visible; /* Allow exclamation marks and effects to extend outside container */
`;

// The static foreground part of the scene
const ForegroundLayer = styled.div`
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 11; /* Sits just behind clickable areas */
    background-image: url('/images/home/home-sky-combo.png');
    background-size: ${HOME_INTERNAL_WIDTH}px ${JUMBO_ASSET_HEIGHT}px;
    pointer-events: none; /* Allows clicks to pass through */
`;

const ClickableArea = styled.div<{ $isHovered: boolean; $debugColor?: string }>`
  position: absolute;
  cursor: pointer;
  z-index: 100; /* Above all background layers */
  overflow: visible; /* Allow glow effects to extend outside the box */
  background: ${({ $debugColor }) => {
    if (DEBUG_CLICKBOXES) {
      return $debugColor || 'rgba(255, 0, 0, 0.3)';
    }
    return 'transparent'; /* Always transparent for invisible clickboxes */
  }};
  border: ${({ $debugColor }) => {
    if (DEBUG_CLICKBOXES) {
      return `2px solid ${$debugColor?.replace('0.3', '0.8') || 'rgba(255, 0, 0, 0.8)'}`;
    }
    return '2px solid transparent'; /* Always transparent border */
  }};
  transition: all 0.3s ease;
  
  &:hover {
    background: ${({ $debugColor }) => DEBUG_CLICKBOXES ? $debugColor?.replace('0.3', '0.5') : 'transparent'};
    border: ${({ $debugColor }) => DEBUG_CLICKBOXES ? `2px solid ${$debugColor?.replace('0.3', '1')}` : '2px solid transparent'};
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

// Exclamation mark indicator for interactive elements - subtle and smaller
const ExclamationIndicator = styled.div<{ $size: 'small' | 'large'; $visible: boolean }>`
  position: absolute;
  width: ${props => props.$size === 'small' ? '8px' : '10px'};
  height: ${props => props.$size === 'small' ? '8px' : '10px'};
  background: linear-gradient(135deg, #FFD700, #FFA500);
  border: 1px solid #FFFFFF;
  border-radius: 50%;
  z-index: 201; /* Above star */
  pointer-events: none;
  
  opacity: ${props => props.$visible ? 0.9 : 0}; /* Slightly less opaque */
  transform: ${props => props.$visible ? 'scale(1)' : 'scale(0.5)'};
  transition: opacity 0.3s ease, transform 0.3s ease;
  
  /* Gentler pulsing animation */
  animation: ${props => props.$visible ? 'exclamationPulse 3s ease-in-out infinite' : 'none'};
  
  /* Smaller CSS-based exclamation mark */
  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: ${props => props.$size === 'small' ? '1px' : '1.5px'};
    height: ${props => props.$size === 'small' ? '4px' : '5px'};
    background: #000;
    border-radius: 0.5px;
  }
  
  &::after {
    content: '';
    position: absolute;
    bottom: ${props => props.$size === 'small' ? '1.5px' : '2px'};
    left: 50%;
    transform: translateX(-50%);
    width: ${props => props.$size === 'small' ? '1px' : '1.5px'};
    height: ${props => props.$size === 'small' ? '1px' : '1.5px'};
    background: #000;
    border-radius: 50%;
  }
  
  @keyframes exclamationPulse {
    0%, 100% {
      transform: scale(1);
      box-shadow: 0 0 0 0 rgba(255, 215, 0, 0.4); /* Reduced intensity */
    }
    50% {
      transform: scale(1.05); /* Less dramatic scaling */
      box-shadow: 0 0 0 3px rgba(255, 215, 0, 0); /* Smaller glow */
    }
  }
`;

// Animated character sprite component
const CharacterSprite = styled.div<{ 
  $frame: number; 
  $direction: 'front' | 'back' | 'right' | 'left';
  $isWalking: boolean;
  $isClimbing: boolean;
}>`
  position: absolute;
  width: 38px;
  height: 102px;
  background-image: url('/images/characters/sprites/kapoor-home.png');
  background-size: ${38 * 38}px 102px; /* 38 frames × 38px = 1444px width */
  background-position: ${props => {
    // Calculate frame offset based on animation state
    let frameOffset = 0;
    
    if (props.$isClimbing) {
      // Climbing animation (frames 33-38, which is index 32-37)
      frameOffset = 32 + (props.$frame % 6); // 6 frames for climbing
    } else if (!props.$isWalking) {
      // Idle animations
      if (props.$direction === 'front') frameOffset = 0; // frames 1-4
      else if (props.$direction === 'back') frameOffset = 4; // frames 5-8
      else if (props.$direction === 'right') frameOffset = 8; // frames 9-12
      else if (props.$direction === 'left') frameOffset = 12; // frames 13-16
      
      // Add frame cycle within idle range (4 frames per direction)
      frameOffset += props.$frame % 4;
    } else {
      // Walking animations
      if (props.$direction === 'right') frameOffset = 16 + (props.$frame % 8); // frames 17-24 (8 frames)
      else if (props.$direction === 'left') frameOffset = 24 + (props.$frame % 8); // frames 25-32 (8 frames)
      // No walking animations for front/back, use idle
      else if (props.$direction === 'front') frameOffset = 0 + (props.$frame % 4);
      else if (props.$direction === 'back') frameOffset = 4 + (props.$frame % 4);
    }
    
    return `${frameOffset * -38}px 0px`;
  }};
  background-repeat: no-repeat;
  image-rendering: pixelated;
  z-index: 65; /* Above dialogue text (55) so character renders on top */
  pointer-events: none;
  transition: left 0.1s linear, top 0.1s linear;
`;

// Arrow keys tutorial sprite - 8 frames (all up, right, left, up, down, all pushed, all up highlighted, all pushed highlighted)
const ArrowKeysSprite = styled.div<{ $frame: number; $visible: boolean }>`
  position: absolute;
  width: 45px;
  height: 33px;
  background-image: url('/images/ui/arrow-keys.png');
  background-size: ${45 * 8}px 33px; /* 8 frames × 45px = 360px width */
  background-position: ${props => (props.$frame - 1) * -45}px 0px;
  background-repeat: no-repeat;
  image-rendering: pixelated;
  z-index: 60; /* Above character */
  pointer-events: none;
  
  opacity: ${props => props.$visible ? 1 : 0};
  transform: ${props => props.$visible ? 'scale(1)' : 'scale(0.8)'};
  transition: opacity 0.3s ease, transform 0.3s ease, left 0.1s linear, top 0.1s linear;
`;

// X key tutorial sprite - 4 frames (normal, depressed, highlighted, depressed+highlighted)
const XKeySprite = styled.div<{ $frame: number; $visible: boolean }>`
  position: absolute;
  width: 15px;
  height: 16px;
  background-image: url('/images/ui/x-key.png');
  background-size: ${15 * 4}px 16px; /* 4 frames × 15px = 60px width */
  background-position: ${props => (props.$frame - 1) * -15}px 0px;
  background-repeat: no-repeat;
  image-rendering: pixelated;
  z-index: 60; /* Above character */
  pointer-events: none;
  
  opacity: ${props => props.$visible ? 1 : 0};
  transform: ${props => props.$visible ? 'scale(1)' : 'scale(0.8)'};
  transition: opacity 0.3s ease, transform 0.3s ease, left 0.1s linear, top 0.1s linear;
`;

// C key sprite - 4 frames (normal, depressed, highlighted, depressed+highlighted)
const CKeySprite = styled.div<{ $frame: number; $visible: boolean }>`
  position: absolute;
  width: 15px;
  height: 16px;
  background-image: url('/images/ui/c-key.png');
  background-size: ${15 * 4}px 16px; /* 4 frames × 15px = 60px width */
  background-position: ${props => (props.$frame - 1) * -15}px 0px;
  background-repeat: no-repeat;
  image-rendering: pixelated;
  z-index: 60; /* Above character */
  pointer-events: none;
  
  opacity: ${props => props.$visible ? 1 : 0};
  transform: ${props => props.$visible ? 'scale(1)' : 'scale(0.8)'};
  transition: opacity 0.3s ease, transform 0.3s ease, left 0.1s linear, top 0.1s linear;
`;

// Up arrow key sprite - 4 frames (normal, depressed, highlighted, depressed+highlighted)
const UpArrowSprite = styled.div<{ $frame: number; $visible: boolean }>`
  position: absolute;
  width: 15px;
  height: 16px;
  background-image: url('/images/ui/up-arrow-key.png');
  background-size: ${15 * 4}px 16px; /* 4 frames × 15px = 60px width */
  background-position: ${props => (props.$frame - 1) * -15}px 0px;
  background-repeat: no-repeat;
  image-rendering: pixelated;
  z-index: 60; /* Above character */
  pointer-events: none;
  
  opacity: ${props => props.$visible ? 1 : 0};
  transform: ${props => props.$visible ? 'scale(1)' : 'scale(0.8)'};
  transition: opacity 0.3s ease, transform 0.3s ease, left 0.1s linear, top 0.1s linear;
`;

// Down arrow key sprite - 4 frames (normal, depressed, highlighted, depressed+highlighted)
const DownArrowSprite = styled.div<{ $frame: number; $visible: boolean }>`
  position: absolute;
  width: 15px;
  height: 16px;
  background-image: url('/images/ui/down-arrow-key.png');
  background-size: ${15 * 4}px 16px; /* 4 frames × 15px = 60px width */
  background-position: ${props => (props.$frame - 1) * -15}px 0px;
  background-repeat: no-repeat;
  image-rendering: pixelated;
  z-index: 60; /* Above character */
  pointer-events: none;
  
  opacity: ${props => props.$visible ? 1 : 0};
  transform: ${props => props.$visible ? 'scale(1)' : 'scale(0.8)'};
  transition: opacity 0.3s ease, transform 0.3s ease, left 0.1s linear, top 0.1s linear;
`;

// Contextual action label that appears next to interaction keys
const ContextLabel = styled.div<{ $visible: boolean }>`
  position: absolute;
  font-family: 'Aseprite', monospace;
  font-size: 10px;
  color: #ffffff;
  white-space: nowrap;
  pointer-events: none;
  image-rendering: pixelated;
  z-index: 60; /* Same level as keys */
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
  
  opacity: ${props => props.$visible ? 1 : 0};
  transform: ${props => props.$visible ? 'scale(1)' : 'scale(0.8)'};
  transition: opacity 0.3s ease, transform 0.3s ease, left 0.1s linear, top 0.1s linear;
`;

// Sky view interaction indicator - fixed position at bottom center, displays X and C keys vertically
const SkyInteractionIndicator = styled.div<{ $visible: boolean }>`
  position: absolute;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  z-index: 100; /* Above sky elements */
  pointer-events: none;
  
  opacity: ${props => props.$visible ? 1 : 0};
  transform: ${props => props.$visible 
    ? 'translateX(-50%) translateY(0)' 
    : 'translateX(-50%) translateY(10px)'};
  transition: opacity 0.3s ease, transform 0.3s ease;
`;

// Sky key row - horizontal container for key sprite and label
const SkyKeyRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

// Sky view X key sprite
const SkyXKeySprite = styled.div<{ $frame: number }>`
  width: 15px;
  height: 16px;
  background-image: url('/images/ui/x-key.png');
  background-size: ${15 * 4}px 16px; /* 4 frames × 15px = 60px width */
  background-position: ${props => (props.$frame - 1) * -15}px 0px;
  background-repeat: no-repeat;
  image-rendering: pixelated;
`;

// Sky view C key sprite
const SkyCKeySprite = styled.div<{ $frame: number }>`
  width: 15px;
  height: 16px;
  background-image: url('/images/ui/c-key.png');
  background-size: ${15 * 4}px 16px; /* 4 frames × 15px = 60px width */
  background-position: ${props => (props.$frame - 1) * -15}px 0px;
  background-repeat: no-repeat;
  image-rendering: pixelated;
`;

// Sky view action label
const SkyActionLabel = styled.div`
  font-family: 'Aseprite', monospace;
  font-size: 12px;
  color: #ffffff;
  white-space: nowrap;
  image-rendering: pixelated;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
`;

// Desk activity interaction indicator - fixed position at bottom center during desk activities
const DeskInteractionIndicator = styled.div<{ $visible: boolean }>`
  position: absolute;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  z-index: 350; /* Above comp-sheet (z-index 300-303) */
  pointer-events: none;
  
  opacity: ${props => props.$visible ? 1 : 0};
  transform: ${props => props.$visible 
    ? 'translateX(-50%) translateY(0)' 
    : 'translateX(-50%) translateY(10px)'};
  transition: opacity 0.3s ease, transform 0.3s ease;
`;

// Desk key row - horizontal container for key sprite and label
const DeskKeyRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

// Desk view X key sprite
const DeskXKeySprite = styled.div<{ $frame: number }>`
  width: 15px;
  height: 16px;
  background-image: url('/images/ui/x-key.png');
  background-size: ${15 * 4}px 16px; /* 4 frames × 15px = 60px width */
  background-position: ${props => (props.$frame - 1) * -15}px 0px;
  background-repeat: no-repeat;
  image-rendering: pixelated;
`;

// Desk view C key sprite
const DeskCKeySprite = styled.div<{ $frame: number }>`
  width: 15px;
  height: 16px;
  background-image: url('/images/ui/c-key.png');
  background-size: ${15 * 4}px 16px; /* 4 frames × 15px = 60px width */
  background-position: ${props => (props.$frame - 1) * -15}px 0px;
  background-repeat: no-repeat;
  image-rendering: pixelated;
`;

// Desk view action label
const DeskActionLabel = styled.div`
  font-family: 'Aseprite', monospace;
  font-size: 12px;
  color: #ffffff;
  white-space: nowrap;
  image-rendering: pixelated;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
`;

// Kapoor monologue text box - matches Pico dialogue styling but narrower
const KapoorMonologue = styled.div<{ $visible: boolean }>`
  position: absolute;
  width: 140px; /* Narrower than Pico's 160px */
  font-family: 'Aseprite', monospace;
  font-size: 11px;
  color: #e0e0e0;
  line-height: 1.2;
  z-index: 2100; /* Above modal backdrop */
  
  /* Subtle backdrop for better text readability - matching Pico */
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  padding: 8px 10px;
  border-radius: 3px;
  
  opacity: ${props => props.$visible ? 1 : 0};
  transition: opacity 0.2s ease;
  
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
`;

const KapoorSpeakerLabel = styled.div`
  color: #FFD700;
  font-weight: bold;
  margin-bottom: 4px;
  display: block;
`;

const KapoorContinueHint = styled.div`
  font-size: 9px;
  color: #999;
  margin-top: 8px;
  font-style: italic;
`;

// Pico sprite - 60 frames (28x21px each): frames 0-29 normal idle, frames 30-59 talking idle
const PicoSprite = styled.div<{ $frame: number; $isTalking: boolean }>`
  position: absolute;
  width: 28px;
  height: 21px;
  background-image: url('/images/characters/sprites/pico.png');
  background-size: ${28 * 60}px 21px; /* 60 frames × 28px = 1680px width */
  background-position: ${props => {
    // Calculate frame offset based on talking state
    const baseFrame = props.$isTalking ? 30 : 0; // Start at frame 30 for talking
    const frameOffset = baseFrame + (props.$frame % 30); // 30 frames for each animation
    return `${frameOffset * -28}px 0px`;
  }};
  background-repeat: no-repeat;
  image-rendering: pixelated;
  z-index: 60; /* Above dialogue text (55) so character renders on top */
  pointer-events: none;
`;

// Speech bubble sprite - 8 frames (16x16px each): frames 1-4 normal, frames 5-8 highlighted
const SpeechBubbleSprite = styled.div<{ $frame: number; $visible: boolean; $highlighted: boolean }>`
  position: absolute;
  width: 16px;
  height: 16px;
  background-image: url('/images/ui/speech-bubble.png');
  background-size: ${16 * 8}px 16px; /* 8 frames × 16px = 128px width */
  background-position: ${props => {
    // Use frames 5-8 (indices 4-7) when highlighted, frames 1-4 (indices 0-3) otherwise
    const baseFrame = props.$highlighted ? 4 : 0;
    const frameIndex = baseFrame + (props.$frame - 1);
    return `${frameIndex * -16}px 0px`;
  }};
  background-repeat: no-repeat;
  image-rendering: pixelated;
  z-index: 46; /* Below Kapoor (50) but above Pico (45) */
  pointer-events: none;
  
  opacity: ${props => props.$visible ? 1 : 0};
  transform: ${props => props.$visible ? 'scale(1)' : 'scale(0.8)'};
  transition: opacity 0.3s ease, transform 0.3s ease;
`;

// Pico dialogue overlay - simple dialogue box for cat conversation
// Now dynamically positioned based on speaker
const PicoDialogueText = styled.div<{ $visible: boolean }>`
  position: absolute;
  width: 160px; /* Narrower from 220px for tighter text wrapping */
  font-family: 'Aseprite', monospace;
  font-size: 11px;
  color: #e0e0e0;
  line-height: 1.2; /* Tighter line spacing from 1.5 */
  z-index: 55; /* Above Pico and characters */
  
  /* Subtle backdrop for better text readability */
  background: rgba(0, 0, 0, 0.6); /* Semi-transparent dark background */
  backdrop-filter: blur(4px); /* Subtle blur behind text */
  padding: 8px 10px; /* Breathing room around text */
  border-radius: 4px; /* Soft corners */
  border: 1px solid rgba(255, 255, 255, 0.1); /* Very subtle border for definition */
  
  opacity: ${props => props.$visible ? 1 : 0};
  pointer-events: none;
  transition: opacity 0.2s ease, left 0.3s ease, top 0.3s ease; /* Smooth movement between characters */
  
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
`;

const PicoSpeakerLabel = styled.div`
  color: #FFD700;
  font-weight: bold;
  margin-bottom: 4px; /* Space between name and dialogue */
  display: block; /* Force to own line */
`;

const PicoContinueHint = styled.div`
  font-size: 9px;
  color: #999;
  margin-top: 8px;
  font-style: italic;
`;

// Pet description textbox - grey, italicized narrative text
const PetDescriptionBox = styled.div<{ $visible: boolean }>`
  position: absolute;
  width: 200px;
  font-family: 'Aseprite', monospace;
  font-size: 10px;
  color: #888; /* Grey text for narrative description */
  font-style: italic;
  line-height: 1.3;
  z-index: 55; /* Above Pico */
  
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  padding: 8px 10px;
  border-radius: 4px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  
  opacity: ${props => props.$visible ? 1 : 0};
  pointer-events: none;
  transition: opacity 0.3s ease;
  
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
`;

// === COMP-SHEET COMPOSITE LAYER SYSTEM ===
// All layers are 300×180px (half original size)
// Layer 1a: Monitor frame with black fill (base layer) - always visible when comp-sheet is shown
const CompMonitorLayer = styled.div<{ $visible: boolean }>`
  position: absolute;
  width: 300px;
  height: 180px;
  background-image: url('/images/home/comp-monitor.png');
  background-size: 300px 180px;
  background-repeat: no-repeat;
  image-rendering: pixelated;
  z-index: 300; /* Base layer - monitor frame with black screen */
  pointer-events: ${props => props.$visible ? 'all' : 'none'};
  
  opacity: ${props => props.$visible ? 1 : 0};
  transform: ${props => props.$visible ? 'scale(1)' : 'scale(0.95)'};
  transition: opacity 0.3s ease, transform 0.3s ease;
`;

// Layer 1b: Screen color overlay - changes color based on context
// Blue for home menu, dark for TBI activity
const CompScreenLayer = styled.div<{ $visible: boolean; $variant: 'blue' | 'dark' }>`
  position: absolute;
  width: 300px;
  height: 180px;
  background-image: url(${props => props.$variant === 'blue' 
    ? '/images/home/comp-screen-blue.png' 
    : '/images/home/comp-screen-dark.png'});
  background-size: 300px 180px;
  background-repeat: no-repeat;
  image-rendering: pixelated;
  z-index: 301; /* Above monitor base */
  pointer-events: none;
  
  opacity: ${props => props.$visible ? 1 : 0};
  transform: ${props => props.$visible ? 'scale(1)' : 'scale(0.95)'};
  transition: opacity 0.3s ease, transform 0.3s ease, background-image 0.3s ease;
`;

// Layer 2: Activity base (static single frame) - visible until activity selected
const CompActivityLayer = styled.div<{ $visible: boolean }>`
  position: absolute;
  width: 300px;
  height: 180px;
  background-image: url('/images/home/comp-activity.png');
  background-size: 300px 180px;
  background-repeat: no-repeat;
  image-rendering: pixelated;
  z-index: 302;
  pointer-events: none;
  
  opacity: ${props => props.$visible ? 1 : 0};
  transition: opacity 0.3s ease;
`;

// Layer 3: Activity options highlights (7 frames) - visible until activity selected
// Frame 1: none highlighted
// Frame 2: top-left highlighted
// Frame 3: top-right highlighted
// Frame 4: bottom-left highlighted
// Frame 5: bottom-middle highlighted
// Frame 6: bottom-right highlighted
// Frame 7: top-left pressed
const CompOptionsLayer = styled.div<{ $frame: number; $visible: boolean }>`
  position: absolute;
  width: 300px;
  height: 180px;
  background-image: url('/images/home/comp-activity-options-sheet.png');
  background-size: ${300 * 7}px 180px; /* 7 frames × 300px = 2100px width */
  background-position: ${props => (props.$frame - 1) * -300}px 0px;
  background-repeat: no-repeat;
  image-rendering: pixelated;
  z-index: 303;
  pointer-events: none;
  
  opacity: ${props => props.$visible ? 1 : 0};
  transition: opacity 0.3s ease;
`;

// Layer 4: Activity option 1 animation (5 frames - autonomous loop) - visible until activity selected
const CompOption1Layer = styled.div<{ $frame: number; $visible: boolean }>`
  position: absolute;
  width: 300px;
  height: 180px;
  background-image: url('/images/home/comp-activity-option1-sheet.png');
  background-size: ${300 * 5}px 180px; /* 5 frames × 300px = 1500px width */
  background-position: ${props => (props.$frame - 1) * -300}px 0px;
  background-repeat: no-repeat;
  image-rendering: pixelated;
  z-index: 304;
  pointer-events: none;
  
  opacity: ${props => props.$visible ? 1 : 0};
  transition: opacity 0.3s ease;
`;

// Backdrop overlay - darkens and blurs background when comp-sheet is visible
const CompSheetBackdrop = styled.div<{ $visible: boolean }>`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  z-index: 299; /* Just below comp-sheet layers (300+) */
  pointer-events: ${props => props.$visible ? 'all' : 'none'};
  
  opacity: ${props => props.$visible ? 1 : 0};
  transition: opacity 0.4s ease;
`;

// Activity click region - invisible overlay for mouse interaction
const ActivityClickRegion = styled.div<{ $active: boolean }>`
  position: absolute;
  z-index: 305; /* Above all comp-sheet layers */
  cursor: pointer;
  pointer-events: all;
  
  /* Debug visualization (optional) */
  ${DEBUG_CLICKBOXES && `
    background: rgba(255, 0, 0, 0.2);
    border: 2px solid rgba(255, 0, 0, 0.5);
  `}
`;

// Anthro intro layer - 4 frame dialogue sequence before TBI positioning
// 4 frames at 300×180 each (1200×180 total), advanced with X key
const AnthroIntroLayer = styled.div<{ $frame: number; $visible: boolean }>`
  position: absolute;
  width: 300px;
  height: 180px;
  background-image: url('/images/home/anthro-intro.png');
  background-size: ${300 * 4}px 180px; /* 4 frames × 300px = 1200px width */
  background-position: ${props => props.$frame * -300}px 0px;
  background-repeat: no-repeat;
  image-rendering: pixelated;
  z-index: 305; /* Above menu layers, below TBI positioning */
  pointer-events: none;
  
  opacity: ${props => props.$visible ? 1 : 0};
  transition: opacity 0.3s ease;
`;

// TBI Positioning viewer - sprite sheet layer that renders on top of comp-sheet
// 16 frames at 300×180 each (4800×180 total), navigated with left/right arrow keys
const TbiPositioningLayer = styled.div<{ $frame: number; $visible: boolean }>`
  position: absolute;
  width: 300px;
  height: 180px;
  background-image: url('/images/home/tbi-positioning.png');
  background-size: ${300 * 16}px 180px; /* 16 frames × 300px = 4800px width */
  background-position: ${props => props.$frame * -300}px 0px;
  background-repeat: no-repeat;
  image-rendering: pixelated;
  z-index: 306; /* Above all comp-sheet layers and click regions */
  pointer-events: none;
  
  opacity: ${props => props.$visible ? 1 : 0};
  transition: opacity 0.3s ease;
`;

// TBI Result layer - 13 frame animation showing results after positioning
// Frames 0-10 play at 500ms each, then lands on frame 11 or 12
const TbiResultLayer = styled.div<{ $frame: number; $visible: boolean }>`
  position: absolute;
  width: 300px;
  height: 180px;
  background-image: url('/images/home/tbi-positioning-result.png');
  background-size: ${300 * 13}px 180px; /* 13 frames × 300px = 3900px width */
  background-position: ${props => props.$frame * -300}px 0px;
  background-repeat: no-repeat;
  image-rendering: pixelated;
  z-index: 307; /* Above TBI positioning layer */
  pointer-events: none;
  
  opacity: ${props => props.$visible ? 1 : 0};
  transition: opacity 0.3s ease;
`;

// Boundary debug visualization components
const BoundaryLine = styled.div<{ $color: string }>`
  position: absolute;
  width: 2px;
  height: 100%;
  background-color: ${props => props.$color};
  opacity: 0.6;
  pointer-events: none;
  z-index: 250; /* Above everything for visibility */
`;

const BoundaryLabel = styled.div<{ $color: string }>`
  position: absolute;
  background: rgba(0, 0, 0, 0.8);
  color: ${props => props.$color};
  padding: 3px 6px;
  font-size: 10px;
  font-family: monospace;
  border-radius: 2px;
  pointer-events: none;
  z-index: 251;
  border: 1px solid ${props => props.$color};
`;

const BoundaryFloorIndicator = styled.div<{ $color: string }>`
  position: absolute;
  width: 100%;
  height: 1px;
  background-color: ${props => props.$color};
  opacity: 0.4;
  pointer-events: none;
  z-index: 250;
  
  &::before {
    content: attr(data-label);
    position: absolute;
    left: 5px;
    top: -15px;
    background: rgba(0, 0, 0, 0.8);
    color: ${props => props.$color};
    padding: 2px 5px;
    font-size: 9px;
    font-family: monospace;
    border-radius: 2px;
    border: 1px solid ${props => props.$color};
  }
`;

// Tutorial Star moved to ParallaxRenderer for consistent visibility during transitions

// Removed antiquated Tooltip component - was causing UI obstruction

// Removed HoveredArea interface - no longer needed without tooltips


export default function CombinedHomeScene() {
  const { transitionToScene } = useSceneStore();
  const { 
    daysPassed, 
    incrementDay, 
    hasCompletedFirstActivity, 
    hasSeenConstellationCutscene,
    setHasCompletedFirstActivity,
    setHasSeenConstellationCutscene
  } = useGameStore();
  const { unlockCard, getUnlockedCards, getEquippedCards } = useAbilityStore();
  // Removed hoveredArea state - no longer needed without tooltips
  const [showStarDetail, setShowStarDetail] = useState(false);
  type StarIdType = 'star' | 'tbi' | 'tbi_dosimetry' | 'tbi_prescriptions' | 'tbi_commissioning' | 'planet_1' | 'planet_2' | 'planet_3' | 'planet_4' | 'planet_5' | 'planet_6' | 'planet_7';
  const [activeStarId, setActiveStarId] = useState<StarIdType>('star'); // Track which star modal is open
  
  // Star names mapping for text labels (planet and moons)
  const starNames: Record<StarIdType, string> = {
    star: '???',
    tbi: 'TBI',
    tbi_dosimetry: 'TBI Dosimetry',
    tbi_prescriptions: 'TBI Prescriptions',
    tbi_commissioning: 'TBI Commissioning',
    planet_1: 'Planet 1',
    planet_2: 'Planet 2',
    planet_3: 'Planet 3',
    planet_4: 'Planet 4',
    planet_5: 'Planet 5',
    planet_6: 'Planet 6',
    planet_7: 'Planet 7',
  };
  
  // Jumbo screen scroll state
  const [scrollPosition, setScrollPosition] = useState(-(JUMBO_ASSET_HEIGHT - HOME_INTERNAL_HEIGHT)); // Start at bottom (home view)
  const [currentView, setCurrentView] = useState<'home' | 'sky'>('home');
  const [transitionDuration, setTransitionDuration] = useState(0.8); // Default transition duration in seconds
  
  // Tutorial star state - new 19-frame sprite system
  const [tutorialStarFrame, setTutorialStarFrame] = useState(11); // Start with highlighted sparkle (frame 11) - home view default
  const [isRevealAnimating, setIsRevealAnimating] = useState(false);
  const [isPingPongActive, setIsPingPongActive] = useState(false);
  const [starUnlocked, setStarUnlocked] = useState(false); // Track if star has been unlocked (prevents loop restart)
  
  // Sky view highlight system - tracks which element is highlighted
  // After cutscene: all constellation stars or telescope
  // Before cutscene: 'star' (maps to first constellation star) or 'telescope'
  // Debug planetary systems: planet_1 through planet_7
  type SkyHighlightType = 'star' | 'tbi' | 'tbi_dosimetry' | 'tbi_prescriptions' | 'tbi_commissioning' | 'telescope' | 'planet_1' | 'planet_2' | 'planet_3' | 'planet_4' | 'planet_5' | 'planet_6' | 'planet_7';
  const [skyHighlight, setSkyHighlight] = useState<SkyHighlightType>('star'); // Default to star highlighted
  
  // Sky view interaction - X key always for inspecting stars, C key for returning home
  const [skyXKeyFrame] = useState(1); // X key always unhighlighted (highlights on press)
  const [skyCKeyFrame] = useState(1); // C key always unhighlighted (highlights on press)
  
  // Kapoor monologue for ??? star inspection
  // Monologue system - tracks which inspection cycle we're on and current line in that cycle
  const [inspectionCount, setInspectionCount] = useState(0); // 0 = not started, 1 = first time, 2 = second time, 3+ = completed
  const [currentMonologueLineIndex, setCurrentMonologueLineIndex] = useState(0);
  const [showMonologue, setShowMonologue] = useState(false);
  
  // Single monologue line - same every time
  const monologueLines = [
    "Still unsure what to make of that... Spending some more time studying might help."
  ];
  
  // Telescope sprite state (no longer using highlighted frame - always frame 1)
  const [telescopeFrame] = useState(1); // Always normal frame
  
  // Telescope speech bubble state
  const [telescopeSpeechBubbleVisible, setTelescopeSpeechBubbleVisible] = useState(true); // Start visible
  const [telescopeSpeechBubbleHighlighted, setTelescopeSpeechBubbleHighlighted] = useState(false);
  const [telescopeSpeechBubbleFrame, setTelescopeSpeechBubbleFrame] = useState(1);
  
  // Star speech bubble state
  const [starSpeechBubbleVisible, setStarSpeechBubbleVisible] = useState(true); // Always visible
  const [starSpeechBubbleHighlighted, setStarSpeechBubbleHighlighted] = useState(false);
  const [starSpeechBubbleFrame, setStarSpeechBubbleFrame] = useState(1);
  
  // Desk speech bubble state
  const [deskSpeechBubbleVisible, setDeskSpeechBubbleVisible] = useState(false);
  const [deskSpeechBubbleHighlighted, setDeskSpeechBubbleHighlighted] = useState(false);
  const [deskSpeechBubbleFrame, setDeskSpeechBubbleFrame] = useState(1);
  
  // Star notification state
  const [starNotification, setStarNotification] = useState<{
    type: 'discovery' | 'growth' | 'mastery' | 'card';
    message: string;
    visible: boolean;
  } | null>(null);
  

  // Navigation arrow hover states
  const [upperBandHovered, setUpperBandHovered] = useState(false);
  const [skyBandHovered, setSkyBandHovered] = useState(false);
  
  // Exclamation mark tracking states
  const [starNeverClicked, setStarNeverClicked] = useState(true); // Track if star has never been clicked
  const [hasUnequippedCards, setHasUnequippedCards] = useState(false); // Track if user has unlocked but unequipped cards
  
  // Kapoor character animation state
  const [kapoorPosition, setKapoorPosition] = useState({ x: 150, y: 467 }); // Start position (home view coordinates)
  const [kapoorDirection, setKapoorDirection] = useState<'front' | 'back' | 'right' | 'left'>('front');
  const [kapoorFrame, setKapoorFrame] = useState(0);
  const [kapoorIsWalking, setKapoorIsWalking] = useState(false);
  const [kapoorIsClimbing, setKapoorIsClimbing] = useState(false);
  const [climbingStartY, setClimbingStartY] = useState<number | null>(null); // Track where climbing started
  const kapoorAnimationRef = useRef<NodeJS.Timeout | null>(null);
  const kapoorFrameCountRef = useRef(0);
  const kapoorFrameTickRef = useRef(0); // For slowing down sprite animation
  const keysPressed = useRef<Set<string>>(new Set()); // Track which arrow keys are currently pressed
  
  // Pico character animation state
  // Kapoor is 102px tall, Pico is 21px tall
  // Kapoor at y:467 has bottom at 467+102=569
  // Pico needs y = 569-21 = 548 to align bottoms
  const PICO_POSITION = { x: 330, y: 548 }; // Position on first floor, left side, bottom-aligned with Kapoor
  const PICO_PROXIMITY_THRESHOLD = 80; // Horizontal distance threshold for highlighting speech bubble
  const PICO_LEFT_EXTENSION = 60; // Additional distance allowed to the left of Pico
  const [picoFrame, setPicoFrame] = useState(0);
  const [picoIsTalking, setPicoIsTalking] = useState(false);
  const [picoSpeechBubbleVisible, setPicoSpeechBubbleVisible] = useState(true); // Always visible until interaction
  const [picoSpeechBubbleHighlighted, setPicoSpeechBubbleHighlighted] = useState(false); // Highlighted when Kapoor is near
  const [picoSpeechBubbleFrame, setPicoSpeechBubbleFrame] = useState(1); // 1-4: animation frames
  const [picoInteracted, setPicoInteracted] = useState(false); // Track if Pico has been talked to
  const [showPicoDialogue, setShowPicoDialogue] = useState(false); // Show dialogue overlay
  const [picoDialogueIndex, setPicoDialogueIndex] = useState(0); // Current dialogue line (0-3)
  const picoAnimationRef = useRef<NodeJS.Timeout | null>(null);
  const [showPetDescription, setShowPetDescription] = useState(false); // Show pet description textbox
  const [showPicoBlockingDialogue, setShowPicoBlockingDialogue] = useState(false); // Show blocking dialogue when trying to climb without talking
  const [picoBlockingDialogueIndex, setPicoBlockingDialogueIndex] = useState(0); // Current blocking dialogue line (0-1)
  const [hasShownFirstBlockingMessage, setHasShownFirstBlockingMessage] = useState(false); // Track if we've shown the first blocking message
  
  // Centralized interaction system - player-following X/C keys with contextual labels
  type InteractionType = 'telescope' | 'desk' | 'pico' | null;
  const [activeInteraction, setActiveInteraction] = useState<InteractionType>(null); // Which object is closest
  const [interactionFrame, setInteractionFrame] = useState(1); // X key frame (1: normal, 3: highlighted)
  const [cKeyFrame, setCKeyFrame] = useState(1); // C key frame (1: normal, 3: highlighted)
  const [contextLabel, setContextLabel] = useState<string>(''); // Dynamic label text ("Look", "Study", "Talk")
  const [upArrowFrame, setUpArrowFrame] = useState(1); // Up arrow frame (1: unhighlighted by default)
  const [downArrowFrame, setDownArrowFrame] = useState(1); // Down arrow frame (1: unhighlighted by default)
  const [showUpArrow, setShowUpArrow] = useState(false); // Show up arrow when near ladder at ground floor
  const [showDownArrow, setShowDownArrow] = useState(false); // Show down arrow when near ladder at second floor
  const picoFrameCountRef = useRef(0);
  const picoFrameTickRef = useRef(0);
  
  // Pico dialogue lines
  const picoDialogueLines = [
    { speaker: 'Pico', text: 'Did ya know, back in my day we used to just look up at the stars and dream.' },
    { speaker: 'Pico', text: "We didn't have one of those fancy telescopes like ya got upstairs." },
    { speaker: 'Kapoor', text: 'Back in your day, huh? and remind me, how far back are we talking?' },
    { speaker: 'Pico', text: "Ohhh don't worry about that. Mm-mm. Trust me, you couldn' handle the truth kid…" }
  ];
  
  // Pico blocking dialogue - when player tries to climb without talking first
  const picoBlockingDialogue = [
    { speaker: 'Pico', text: 'Oh too good for your old pal Pico huh? Ya getting fresh with me kid?' },
    { speaker: 'Pico', text: 'Come here let me tell you a couple of three things about how things used to be! Back when we used to respect one anotha.' }
  ];
  
  // Tutorial sprite states
  const [arrowKeysVisible, setArrowKeysVisible] = useState(true); // Show for first 10 seconds
  const [arrowKeysFrame, setArrowKeysFrame] = useState(1); // 1-8: all up, right, left, up, down, all pushed, all up highlighted, all pushed highlighted
  const [xKeyTriggered, setXKeyTriggered] = useState(false); // Track if telescope X key interaction was completed (for cutscene trigger)
  const [deskXKeyTriggered, setDeskXKeyTriggered] = useState(false); // Track if desk X key was used
  const [deskXKeyEnabled, setDeskXKeyEnabled] = useState(false); // Track if desk X key system is enabled (star must be viewed first)
  const sceneStartTimeRef = useRef<number>(Date.now()); // Track when scene started
  
  // Comp-sheet animation states
  const [compSheetVisible, setCompSheetVisible] = useState(false); // Show comp-sheet overlay
  const [compOptionsFrame, setCompOptionsFrame] = useState(1); // Options layer frame (1-7)
  const [compOption1Frame, setCompOption1Frame] = useState(1); // Option1 layer frame (1-5) - autonomous animation
  const [compSheetPhase, setCompSheetPhase] = useState<'idle' | 'booting' | 'booting_fade_in' | 'waiting' | 'transitioning' | 'fading_to_black' | 'intro' | 'intro_fading_to_black' | 'fading_from_black' | 'activity' | 'result_fading_to_black' | 'result_fading_from_black' | 'result'>('idle');
  const compSheetAnimationRef = useRef<NodeJS.Timeout | null>(null);
  const compOption1AnimationRef = useRef<NodeJS.Timeout | null>(null);
  
  // Activity selection state (null = no activity selected, 0-4 = activity index)
  // 0: top-left, 1: top-right, 2: bottom-left, 3: bottom-middle, 4: bottom-right
  const [selectedActivity, setSelectedActivity] = useState<number | null>(null);
  const [hoveredActivity, setHoveredActivity] = useState<number | null>(null);
  const [highlightedActivity, setHighlightedActivity] = useState<number>(0); // For keyboard navigation (0-4)
  
  // Anthro intro dialogue state (shown before TBI positioning)
  const [showAnthroIntro, setShowAnthroIntro] = useState(false);
  const [anthroIntroFrame, setAnthroIntroFrame] = useState(0); // 0-3 for 4 frames
  const ANTHRO_INTRO_TOTAL_FRAMES = 4; // 1200px / 300px = 4 frames
  
  // TBI Positioning viewer state (replaces old quiz system)
  const [showTbiPositioning, setShowTbiPositioning] = useState(false);
  const [tbiPositioningFrame, setTbiPositioningFrame] = useState(0); // 0-15 for 16 frames
  const TBI_POSITIONING_TOTAL_FRAMES = 16; // 4800px / 300px = 16 frames
  
  // TBI Result animation state (shown after TBI positioning complete)
  const [showTbiResult, setShowTbiResult] = useState(false);
  const [tbiResultFrame, setTbiResultFrame] = useState(0); // 0-12 for 13 frames
  const tbiResultAnimationRef = useRef<NodeJS.Timeout | null>(null);
  
  // Desk activity key indicator frames (always highlighted frame 3)
  const deskXKeyFrame = 1; // Unhighlighted by default (highlights on press)
  const deskCKeyFrame = 1; // Unhighlighted by default (highlights on press)
  
  // Constellation cutscene states
  const [isPlayingCutscene, setIsPlayingCutscene] = useState(false);
  const [isCutsceneScrolling, setIsCutsceneScrolling] = useState(false); // Track scroll transition phase before cutscene
  const [cutscenePhase, setCutscenePhase] = useState<'stars-appearing' | 'building-tension' | 'boom' | 'final-constellation' | 'complete'>('stars-appearing');
  const [cutsceneStars, setCutsceneStars] = useState<Array<{ x: number; y: number; frame: number; opacity: number; frameOffset: number; opacityOffset: number }>>([]);
  const [cutsceneStarOpacity, setCutsceneStarOpacity] = useState(1); // Opacity oscillation for ??? star during cutscene
  const [showBoomEffect, setShowBoomEffect] = useState(false);
  const [showFinalConstellation, setShowFinalConstellation] = useState(false);
  const [constellationStars, setConstellationStars] = useState<Array<{ id: string; x: number; y: number; frame: number; angle?: number; distance?: number; parentId?: string; scale?: number; opacity?: number; zIndex?: number }>>([]);
  
  // Removed: Tiny star orbital state (no longer needed without HDR star)
  
  // Interactive object positions and thresholds for proximity detection
  const TELESCOPE_POSITION = { x: 480, y: 310 }; // Telescope position on second floor
  const DESK_POSITION = { x: 400, y: 495 }; // Desk position on first floor
  const PROXIMITY_THRESHOLD = 60; // Show interaction prompt when Kapoor is within this distance
  
  // Primareus (???) position - further left than before, higher in sky
  const PRIMAREUS_POSITION = { x: 180, y: 120 };
  
  // Star X key position (next to Primareus in sky view)
  const STAR_X_KEY_POSITION = { x: PRIMAREUS_POSITION.x + 20, y: PRIMAREUS_POSITION.y - 5 }; // Next to Primareus
  
  // Pre-generate random star positions for cutscene (3-6 stars, localized around Primareus)
  const randomCutsceneStars = useMemo(() => {
    const count = Math.floor(Math.random() * 4) + 3; // 3-6 stars
    const stars = [];
    const spreadRadius = 120; // How far stars can appear from Primareus center
    
    for (let i = 0; i < count; i++) {
      // Random angle and distance from Primareus
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * spreadRadius;
      
      stars.push({
        x: PRIMAREUS_POSITION.x + Math.cos(angle) * distance,
        y: PRIMAREUS_POSITION.y + Math.sin(angle) * distance,
        frame: 2 + Math.floor(Math.random() * 3), // Frames 2-4 (sparkle animation)
        opacity: 0.5 + Math.random() * 0.5, // Random starting opacity (0.5-1.0)
        frameOffset: Math.random() * 3, // Random offset for frame animation (0-3)
        opacityOffset: Math.random() * Math.PI * 2, // Random offset for opacity oscillation (0-2π)
      });
    }
    return stars;
  }, []); // Empty dependency array = only generate once
  
  // Track unequipped cards for exclamation indicators - robust checking
  useEffect(() => {
    const checkCardState = () => {
      const unlockedCards = getUnlockedCards();
      const equippedCards = getEquippedCards();
      const hasUnequipped = unlockedCards.length > equippedCards.length;
      // Card state tracking working correctly
      setHasUnequippedCards(hasUnequipped);
    };
    
    // Check immediately
    checkCardState();
    
    // Also check periodically to catch state changes
    const interval = setInterval(checkCardState, 1000);
    
    return () => clearInterval(interval);
  }, [getUnlockedCards, getEquippedCards, starUnlocked]); // Added starUnlocked as dependency
  
  // === HOME SCALING SYSTEM ===
  // Calculate scale to fit 640x360 home into viewport while maintaining aspect ratio
  useEffect(() => {
    let resizeTimeout: NodeJS.Timeout;
    
    const updateHomeScale = () => {
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      const scaleX = viewportWidth / HOME_INTERNAL_WIDTH;
      const scaleY = viewportHeight / HOME_INTERNAL_HEIGHT;
      const homeScale = Math.min(scaleX, scaleY) * 1; // 90% to add margin
      
      // Set CSS custom property for home scaling
      document.documentElement.style.setProperty('--home-scale', homeScale.toString());
      
      // Scale calculation: ${homeScale.toFixed(3)} (${viewportWidth}x${viewportHeight} → ${HOME_INTERNAL_WIDTH}x${HOME_INTERNAL_HEIGHT})
    };
    
    // Debounced resize handler to prevent rapid scale updates
    const debouncedResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(updateHomeScale, 100);
    };
    
    updateHomeScale(); // Initial calculation
    window.addEventListener('resize', debouncedResize);
    
    return () => {
      window.removeEventListener('resize', debouncedResize);
      clearTimeout(resizeTimeout);
    };
  }, []);

  // === CONSTELLATION CUTSCENE ORCHESTRATION ===
  useEffect(() => {
    if (!isPlayingCutscene) return;
    
    console.log('[CombinedHomeScene] Starting constellation cutscene sequence...');
    
    // Phase 1: Stars appearing (0-2 seconds) - gradual appearance with pulsation
    setCutscenePhase('stars-appearing');
    setCutsceneStars(randomCutsceneStars);
    
    // Phase 2: Building tension (2-5 seconds) - faster pulsation
    setTimeout(() => {
      console.log('[CombinedHomeScene] Cutscene: Building tension...');
      setCutscenePhase('building-tension');
    }, 2000);
    
    // Phase 3: Boom effect! (5-5.5 seconds) - screen flash and pulse
    setTimeout(() => {
      console.log('[CombinedHomeScene] Cutscene: BOOM!');
      setCutscenePhase('boom');
      setShowBoomEffect(true);
      
      // Hide boom effect after 500ms
      setTimeout(() => {
        setShowBoomEffect(false);
      }, 500);
    }, 5000);
    
    // Phase 4: Stars disappear, final constellation appears (5.5-6.5 seconds)
    setTimeout(() => {
      console.log('[CombinedHomeScene] Cutscene: Revealing final constellation...');
      setCutsceneStars([]); // Clear random stars
      setCutscenePhase('final-constellation');
      setShowFinalConstellation(true);
      
      // Set up the constellation (TBI planet at center + orbiting moons for subtopics)
      // NOW USES PLANETARY-SHEET.PNG (like debug planetary systems)
      // Planetary sheet: Set 0, Type 0 = small moon (frame 0), Type 1 = normal moon (frame 1), Type 2 = planet (frame 2)
      // Start with frame 0, will animate through 0-2 and land on final frames
      // Planet at center with moons orbiting around it
      // Calculate angle and distance for each moon for orbital animation
      const createMoon = (id: string, offsetX: number, offsetY: number) => {
        const x = PRIMAREUS_POSITION.x + offsetX;
        const y = PRIMAREUS_POSITION.y + offsetY;
        const angle = Math.atan2(offsetY, offsetX); // Calculate initial angle
        const distance = Math.sqrt(offsetX * offsetX + offsetY * offsetY); // Calculate distance from center
        return { id, x, y, frame: 0, angle, distance, parentId: 'tbi' }; // Moons have parentId for orbital logic
      };
      
      setConstellationStars([
        { id: 'tbi', x: PRIMAREUS_POSITION.x, y: PRIMAREUS_POSITION.y, frame: 0 }, // Center planet (TBI) - no angle/distance/parentId
        createMoon('tbi_dosimetry', -20, 0), // Left of center (ultra-tight orbit: 28 → 20)
        createMoon('tbi_prescriptions', 12, 12), // Lower right (ultra-tight orbit: 18,18 → 12,12)
        createMoon('tbi_commissioning', 6, -18), // Upper center (ultra-tight orbit: 8,-26 → 6,-18)
      ]);
      
      // Animate through frames 0-2 and land on final frames (0 for moons, 2 for TBI planet)
      let animationFrame = 0;
      const animationInterval = setInterval(() => {
        animationFrame++;
        
        if (animationFrame <= 2) {
          // Frames 0, 1, 2
          setConstellationStars(prev => prev.map(star => ({
            ...star,
            frame: animationFrame
          })));
        } else {
          // Land on final frames - all moons use frame 0 (small moon), TBI planet uses frame 2 (planet)
          setConstellationStars(prev => prev.map(star => ({
            ...star,
            frame: star.id === 'tbi' ? 2 : 0
          })));
          clearInterval(animationInterval);
        }
      }, 200); // 200ms per frame
    }, 5500);
    
    // Phase 5: Complete - allow navigation (6.5+ seconds)
    setTimeout(() => {
      console.log('[CombinedHomeScene] Cutscene: Complete!');
      setCutscenePhase('complete');
      setIsPlayingCutscene(false);
      // Set TBI as the highlighted planet after cutscene
      setSkyHighlight('tbi');
      // Reset cutscene star opacity to full
      setCutsceneStarOpacity(1);
    }, 6500);
    
  }, [isPlayingCutscene, randomCutsceneStars]);

  // === CUTSCENE ??? STAR OPACITY ANIMATION ===
  useEffect(() => {
    if (!isPlayingCutscene) return;
    
    const speed = cutscenePhase === 'building-tension' ? 100 : 200; // Faster during tension
    let opacityCounter = 0;
    
    const interval = setInterval(() => {
      opacityCounter++;
      // Oscillate opacity between 0.3 and 1.0 using sine wave
      const opacityPhase = (opacityCounter * 0.1) % (Math.PI * 2);
      const newOpacity = 0.3 + 0.7 * Math.abs(Math.sin(opacityPhase));
      setCutsceneStarOpacity(newOpacity);
    }, speed);
    
    return () => clearInterval(interval);
  }, [isPlayingCutscene, cutscenePhase]);

  // === CONSTELLATION ORBITAL ANIMATION (3D EFFECT) ===
  useEffect(() => {
    if (!showFinalConstellation) return;
    
    const ORBIT_SPEED = 0.008; // Radians per frame (slower = more majestic)
    const ELLIPSE_RATIO = 0.5; // Vertical compression for 3D perspective (0.5 = flattened ellipse)
    const MIN_SCALE = 0.7; // Minimum scale when star is farthest (back of orbit)
    const MAX_SCALE = 1.3; // Maximum scale when star is closest (front of orbit)
    const MIN_OPACITY = 0.6; // Minimum opacity when star is farthest
    const MAX_OPACITY = 1.0; // Maximum opacity when star is closest
    
    const interval = setInterval(() => {
      setConstellationStars(prev => {
        // Create lookup map for planet positions
        const planetPositions = new Map<string, { x: number; y: number }>();
        prev.forEach(body => {
          if (!body.parentId) {
            // This is a planet (no parent), store its position
            planetPositions.set(body.id, { x: body.x, y: body.y });
          }
        });
        
        return prev.map(body => {
          // Skip bodies without orbital properties (planets)
          if (!body.angle || !body.distance || !body.parentId) {
            // This is a planet - check if it's highlighted for z-index elevation
            const isHighlighted = skyHighlightRef.current === body.id;
            const planetZIndex = isHighlighted ? 100 : 3; // Elevated planets pop above clouds/abyss
            return {
              ...body,
              zIndex: planetZIndex,
            };
          }
          
          // Find the parent planet's position
          const parentPos = planetPositions.get(body.parentId);
          if (!parentPos) {
            console.warn(`[Orbital Animation] Parent planet "${body.parentId}" not found for moon "${body.id}"`);
            return body;
          }
          
          // Update the angle for this moon
          const newAngle = body.angle + ORBIT_SPEED;
          
          // Calculate new position with elliptical orbit around parent planet
          const newX = parentPos.x + Math.cos(newAngle) * body.distance;
          const newY = parentPos.y + Math.sin(newAngle) * body.distance * ELLIPSE_RATIO;
          
          // Calculate z-depth based on sine of angle (creates front-to-back motion)
          const zDepth = Math.sin(newAngle);
          
          // Map z-depth to scale (closer = bigger)
          const scale = MIN_SCALE + ((zDepth + 1) / 2) * (MAX_SCALE - MIN_SCALE);
          
          // Map z-depth to opacity (closer = more opaque)
          const opacity = MIN_OPACITY + ((zDepth + 1) / 2) * (MAX_OPACITY - MIN_OPACITY);
          
          // Calculate z-index based on parent highlight status and orbital depth
          // If parent planet is highlighted, elevate entire system above abyss/purple-abyss (z-index 100-102)
          // Otherwise, render under clouds (z-index 2-3)
          const isParentHighlighted = skyHighlightRef.current === body.parentId;
          const zIndex = isParentHighlighted 
            ? (zDepth < 0 ? 100 : 102)  // Elevated system: moons behind planet at 100, in front at 102
            : (zDepth < 0 ? 2 : 3);     // Normal system: under clouds
          
          return {
            ...body,
            angle: newAngle,
            x: newX,
            y: newY,
            scale,
            opacity,
            zIndex,
          };
        });
      });
    }, 16); // ~60fps
    
    return () => clearInterval(interval);
  }, [showFinalConstellation]);

  // === REMOVED: TINY STAR ORBITAL ANIMATION ===
  // (Previously orbited around HDR star, no longer needed in planet-and-moons system)

  const handleBedClick = () => {
    console.log(`[CombinedHomeScene] Bed clicked - advancing to day ${daysPassed + 1}`);
    
    // Advance to next day
    incrementDay();
    
    // If this is day 2, unlock the fast learner ability (if not already unlocked)
    if (daysPassed === 0) { // Will be 1 after incrementDay
      console.log('[CombinedHomeScene] Day 2 beginning - unlocking Fast Learner ability');
      unlockCard('fast_learner');
    }
    
    // Transition to hospital for the new day
    transitionToScene('hospital');
  };


  const handleCloseStarDetail = () => {
    setShowStarDetail(false);
    
    // If closing ??? star modal, show monologue immediately (no delay to prevent UI flicker)
    if (activeStarId === 'star') {
      // Increment inspection count and reset to first line
      setInspectionCount(prev => prev + 1);
      setCurrentMonologueLineIndex(0);
      setShowMonologue(true);
    }
  };

  const handleStarUnlock = (newFrame: number) => {
    // Sync the zoomed-out star with the modal unlock
    setTutorialStarFrame(newFrame);
    setStarUnlocked(true);
    
    // Stop any running shimmer animation
    if (pingPongIntervalRef.current) {
      console.log('[CombinedHomeScene] 🛑 Stopping shimmer animation due to unlock');
      clearInterval(pingPongIntervalRef.current);
      pingPongIntervalRef.current = null;
    }
    setIsPingPongActive(false);
    
    console.log('[CombinedHomeScene] Star unlocked from modal, syncing to frame:', newFrame);
  };

  const handleCardUnlock = (cardName: string) => {
    console.log(`[CombinedHomeScene] Card unlocked: ${cardName}`);
    setStarNotification({
      type: 'card',
      message: `${cardName} Card Unlocked!`,
      visible: true
    });
    
    // Auto-hide notification after 3 seconds
    setTimeout(() => {
      setStarNotification(prev => prev ? { ...prev, visible: false } : null);
    }, 3000);
    
    // Clear notification completely after fade out
    setTimeout(() => {
      setStarNotification(null);
    }, 3600);
  };

  const handleStarViewed = () => {
    console.log('[CombinedHomeScene] Star viewed - enabling desk interaction');
    setDeskXKeyEnabled(true);
  };

  // Activity interaction - handle activity selection from comp-sheet
  const handleActivitySelect = (activityIndex: number) => {
    console.log('[CombinedHomeScene] Activity selected:', activityIndex);
    setSelectedActivity(activityIndex);
    setCompSheetPhase('transitioning');
  };
  
  // TBI Positioning viewer - close and complete activity
  const handleActivityComplete = () => {
    console.log('[CombinedHomeScene] Activity complete - closing comp-sheet');
    
    // Mark first activity as completed (for constellation cutscene trigger)
    if (!hasCompletedFirstActivity) {
      console.log('[CombinedHomeScene] First activity completed - enabling constellation cutscene');
      setHasCompletedFirstActivity(true);
    }
    
    // Clear any ongoing result animation
    if (tbiResultAnimationRef.current) {
      clearTimeout(tbiResultAnimationRef.current);
      tbiResultAnimationRef.current = null;
    }
    
    // Hide everything and reset
    setCompSheetVisible(false);
    setShowTbiPositioning(false);
    setShowTbiResult(false);
    
    // Reset all activity state
    setTimeout(() => {
      setTbiPositioningFrame(0); // Reset to first frame
      setTbiResultFrame(0); // Reset result to first frame
      setCompSheetPhase('idle');
      setCompOptionsFrame(1);
      setCompOption1Frame(1);
      setDeskXKeyTriggered(false); // Reset so desk can be used again
      
      // Reset activity selection state
      setSelectedActivity(null);
      setHoveredActivity(null);
      setHighlightedActivity(0);
    }, 300);
  };

  // Scroll functions for jumbo screen navigation
  const scrollToSky = () => {
    console.log('[CombinedHomeScene] Scrolling to sky view - parallax enabled');
    setScrollPosition(0); // Top of the asset (sky view)
    setCurrentView('sky');
  };

  const scrollToSkySlowly = (duration: number) => {
    console.log('[CombinedHomeScene] Scrolling to sky view SLOWLY - parallax enabled');
    setScrollPosition(0); // Top of the asset (sky view)
    // Delay view change until after the slow transition completes
    setTimeout(() => {
      setCurrentView('sky');
    }, duration * 1000); // Convert seconds to milliseconds
  };

  const scrollToHome = () => {
    console.log('[CombinedHomeScene] Scrolling to home view - parallax enabled');
    setScrollPosition(-(JUMBO_ASSET_HEIGHT - HOME_INTERNAL_HEIGHT)); // Bottom of the asset (home view)
    setCurrentView('home');
  };

  const handleTelescopeClick = () => {
    if (currentView === 'home') {
      console.log('[CombinedHomeScene] Telescope clicked - scrolling to sky view');
      scrollToSky();
    } else {
      console.log('[CombinedHomeScene] Telescope clicked - opening constellation view');
      transitionToScene('constellation');
    }
  };

  // New handler for ladder (to scroll back to home from sky)
  const handleLadderClick = () => {
    console.log('[CombinedHomeScene] Ladder clicked - scrolling to home view');
    scrollToHome();
  };

  // Removed hover handlers - no longer needed without tooltips

  // Tutorial: First-time home visit guidance (prevent multiple executions)
  const hasProcessedRef = useRef(false);
  const hasShownWelcomeRef = useRef(false);
  const pingPongIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Ref to track base animation cycle (0, 1, 2 for frames 2, 3, 4)
  const sparkleAnimationCycle = useRef(0);
  
  // Refs to track current view, sky highlight state, and cutscene state for interval access
  const currentViewRef = useRef(currentView);
  const skyHighlightRef = useRef(skyHighlight);
  const isPlayingCutsceneRef = useRef(isPlayingCutscene);
  const isCutsceneScrollingRef = useRef(isCutsceneScrolling);
  const constellationStarsRef = useRef(constellationStars);
  
  // Update refs when states change
  useEffect(() => {
    currentViewRef.current = currentView;
    skyHighlightRef.current = skyHighlight;
    isPlayingCutsceneRef.current = isPlayingCutscene;
    isCutsceneScrollingRef.current = isCutsceneScrolling;
    constellationStarsRef.current = constellationStars;
  }, [currentView, skyHighlight, isPlayingCutscene, isCutsceneScrolling, constellationStars]);
  
  // === DEBUG MODE: Skip to desk interaction ===
  useEffect(() => {
    const debugFlag = localStorage.getItem('debug_skip_to_desk');
    if (debugFlag === 'true') {
      console.log('[CombinedHomeScene] 🧪 Debug mode: Skipping to desk interaction!');
      
      // Clear the flag so it doesn't persist
      localStorage.removeItem('debug_skip_to_desk');
      
      // Skip welcome screen
      hasShownWelcomeRef.current = true;
      
      // Position Kapoor near desk (left side of first floor)
      setKapoorPosition({ x: 200, y: 467 });
      setKapoorDirection('right');
      setKapoorIsWalking(false);
      
      // Enable desk interaction immediately (simulate star having been viewed)
      setDeskXKeyEnabled(true);
      
      // Hide tutorial elements
      setArrowKeysVisible(false);
      
      console.log('[CombinedHomeScene] 🧪 Debug setup complete - desk interaction is active!');
    }
  }, []); // Run once on mount
  
  // === DEBUG MODE: Skip to pre-cutscene (after desk activity) ===
  useEffect(() => {
    const debugFlag = localStorage.getItem('debug_skip_to_cutscene');
    if (debugFlag === 'true') {
      console.log('[CombinedHomeScene] 🧪 Debug mode: Skipping to pre-cutscene state!');
      
      // Clear the flag so it doesn't persist
      localStorage.removeItem('debug_skip_to_cutscene');
      
      // Skip welcome screen
      hasShownWelcomeRef.current = true;
      
      // Position Kapoor near telescope (ground floor, near ladder)
      setKapoorPosition({ x: 480, y: 467 });
      setKapoorDirection('right');
      setKapoorIsWalking(false);
      
      // Mark first activity as completed (enables cutscene trigger)
      setHasCompletedFirstActivity(true);
      
      // Hide tutorial elements
      setArrowKeysVisible(false);
      
      console.log('[CombinedHomeScene] 🧪 Debug setup complete - ready for constellation cutscene on X key press!');
    }
  }, []); // Run once on mount
  
  // === DEBUG MODE: Skip to post-cutscene (after constellation reveal, ready for second activity) ===
  useEffect(() => {
    const debugFlag = localStorage.getItem('debug_after_cutscene');
    if (debugFlag === 'true') {
      console.log('[CombinedHomeScene] 🧪 Debug mode: Skipping to post-cutscene state!');
      
      // Clear the flag so it doesn't persist
      localStorage.removeItem('debug_after_cutscene');
      
      // Skip welcome screen
      hasShownWelcomeRef.current = true;
      
      // Position Kapoor near desk (close enough for X key to show - desk is at x:400, threshold is 60px)
      setKapoorPosition({ x: 360, y: 467 });
      setKapoorDirection('right');
      setKapoorIsWalking(false);
      
      // Mark first activity as completed AND cutscene as seen
      setHasCompletedFirstActivity(true);
      setHasSeenConstellationCutscene(true);
      
      // Show final constellation in sky
      setShowFinalConstellation(true);
      
      // Create constellation manually (skip animation, use final frames)
      // NOW USES PLANETARY-SHEET.PNG: planet frame 2, moons frame 0 (small moon)
      const createMoon = (id: string, offsetX: number, offsetY: number) => {
        const x = PRIMAREUS_POSITION.x + offsetX;
        const y = PRIMAREUS_POSITION.y + offsetY;
        const angle = Math.atan2(offsetY, offsetX);
        const distance = Math.sqrt(offsetX * offsetX + offsetY * offsetY);
        return { id, x, y, frame: 0, angle, distance, parentId: 'tbi' }; // Use planetary-sheet frame 0 (small moon), set parent
      };
      
      setConstellationStars([
        { id: 'tbi', x: PRIMAREUS_POSITION.x, y: PRIMAREUS_POSITION.y, frame: 2 }, // Center planet (TBI) uses planetary-sheet frame 2 (planet)
        createMoon('tbi_dosimetry', -20, 0), // Left of center (ultra-tight orbit: 28 → 20)
        createMoon('tbi_prescriptions', 12, 12), // Lower right (ultra-tight orbit: 18,18 → 12,12)
        createMoon('tbi_commissioning', 6, -18), // Upper center (ultra-tight orbit: 8,-26 → 6,-18)
      ]);
      
      // Enable desk X key system (planet has been "viewed")
      setDeskXKeyEnabled(true);
      // Note: deskXKeyVisible will be set by proximity check when Kapoor gets near desk
      
      // Set initial sky highlight to TBI planet (for second activity focus)
      setSkyHighlight('tbi');
      
      // Hide tutorial elements and ??? star
      setArrowKeysVisible(false);
      
      console.log('[CombinedHomeScene] 🧪 Debug setup complete - constellation created, skyHighlight set to TBI, ready for second desk activity!');
    }
  }, []); // Run once on mount
  
  // === DEBUG MODE: Planetary Systems Showcase ===
  useEffect(() => {
    const debugFlag = localStorage.getItem('debug_planetary_systems');
    if (debugFlag === 'true') {
      console.log('[CombinedHomeScene] 🧪 Debug mode: Creating planetary systems showcase!');
      
      // Clear the flag so it doesn't persist
      localStorage.removeItem('debug_planetary_systems');
      
      // Skip welcome screen
      hasShownWelcomeRef.current = true;
      
      // Position Kapoor on ground floor, far left (out of the way)
      setKapoorPosition({ x: 100, y: 467 });
      setKapoorDirection('right');
      setKapoorIsWalking(false);
      
      // Hide all tutorial/interaction elements
      setArrowKeysVisible(false);
      setDeskXKeyEnabled(false);
      
      // Set initial sky highlight to first planet for navigation
      setSkyHighlight('planet_1'); // Start with planet 1 highlighted
      
      // Create multiple localized planetary systems across the sky
      // Each system has a planet with 3 moons orbiting around IT (not a shared center)
      // NEW SPRITE SHEET: planetary-sheet.png (1344x14, 96 frames total)
      // Organization: 8 sets × 3 types (small moon, normal moon, planet) × 4 sections
      // Section 0 (frames 0-23): Default sprites
      // Section 1 (frames 24-47): Highlighted sprites
      // Section 2 (frames 48-71): Modal detail view
      // Section 3 (frames 72-95): Modal highlighted detail view
      // Frame calculation: frame = (section × 24) + (setIndex × 3) + typeIndex
      // Type 0 = small moon, Type 1 = normal moon, Type 2 = planet
      
      const planetarySystems: Array<{
        id: string;
        x: number;
        y: number;
        frame: number;
        angle?: number;
        distance?: number;
        parentId?: string;
        scale?: number;
        opacity?: number;
        zIndex?: number;
      }> = [];
      
      // Helper to create a moon orbiting a planet
      const createMoon = (moonId: string, planetId: string, planetX: number, planetY: number, frame: number, angle: number, distance: number) => {
        return {
          id: moonId,
          x: planetX + Math.cos(angle) * distance,
          y: planetY + Math.sin(angle) * distance,
          frame,
          angle,
          distance,
          parentId: planetId,
        };
      };
      
      // HEXAGONAL 2-3-2 ARRANGEMENT IN UPPER LEFT
      // Asymmetrical positioning with one system in the middle
      //      S1    S2
      //    S3   S4   S5
      //      S6    S7
      
      // Top row (2 systems)
      // System 1 (set 0) - Top left - planet=2, small moon=0
      const planet1 = { id: 'planet_1', x: 110, y: 65, frame: 2 };
      planetarySystems.push(planet1);
      planetarySystems.push(createMoon('moon_1a', 'planet_1', 110, 65, 0, Math.PI, 22));
      planetarySystems.push(createMoon('moon_1b', 'planet_1', 110, 65, 0, 0, 24));
      planetarySystems.push(createMoon('moon_1c', 'planet_1', 110, 65, 0, Math.PI / 2, 18));
      
      // System 2 (set 1) - Top right - planet=5, small moon=3
      const planet2 = { id: 'planet_2', x: 200, y: 70, frame: 5 };
      planetarySystems.push(planet2);
      planetarySystems.push(createMoon('moon_2a', 'planet_2', 200, 70, 3, -Math.PI / 3, 20));
      planetarySystems.push(createMoon('moon_2b', 'planet_2', 200, 70, 3, Math.PI / 2, 26));
      planetarySystems.push(createMoon('moon_2c', 'planet_2', 200, 70, 3, 2 * Math.PI / 3, 19));
      
      // Middle row (3 systems)
      // System 3 (set 2) - Middle left - planet=8, small moon=6
      const planet3 = { id: 'planet_3', x: 70, y: 130, frame: 8 };
      planetarySystems.push(planet3);
      planetarySystems.push(createMoon('moon_3a', 'planet_3', 70, 130, 6, -Math.PI / 2, 21));
      planetarySystems.push(createMoon('moon_3b', 'planet_3', 70, 130, 6, Math.PI, 28));
      planetarySystems.push(createMoon('moon_3c', 'planet_3', 70, 130, 6, Math.PI / 4, 23));
      
      // System 4 (set 3) - Middle center (featured) - planet=11, small moon=9
      const planet4 = { id: 'planet_4', x: 155, y: 135, frame: 11 };
      planetarySystems.push(planet4);
      planetarySystems.push(createMoon('moon_4a', 'planet_4', 155, 135, 9, 0, 30));
      planetarySystems.push(createMoon('moon_4b', 'planet_4', 155, 135, 9, 2 * Math.PI / 3, 32));
      planetarySystems.push(createMoon('moon_4c', 'planet_4', 155, 135, 9, -2 * Math.PI / 3, 30));
      
      // System 5 (set 4) - Middle right - planet=14, small moon=12
      const planet5 = { id: 'planet_5', x: 235, y: 138, frame: 14 };
      planetarySystems.push(planet5);
      planetarySystems.push(createMoon('moon_5a', 'planet_5', 235, 138, 12, 0, 24));
      planetarySystems.push(createMoon('moon_5b', 'planet_5', 235, 138, 12, Math.PI / 2, 27));
      planetarySystems.push(createMoon('moon_5c', 'planet_5', 235, 138, 12, Math.PI, 25));
      
      // Bottom row (2 systems)
      // System 6 (set 5) - Bottom left - planet=17, small moon=15
      const planet6 = { id: 'planet_6', x: 105, y: 195, frame: 17 };
      planetarySystems.push(planet6);
      planetarySystems.push(createMoon('moon_6a', 'planet_6', 105, 195, 15, Math.PI, 20));
      planetarySystems.push(createMoon('moon_6b', 'planet_6', 105, 195, 15, 0, 22));
      planetarySystems.push(createMoon('moon_6c', 'planet_6', 105, 195, 15, -Math.PI / 2, 18));
      
      // System 7 (set 6) - Bottom right - planet=20, small moon=18
      const planet7 = { id: 'planet_7', x: 190, y: 200, frame: 20 };
      planetarySystems.push(planet7);
      planetarySystems.push(createMoon('moon_7a', 'planet_7', 190, 200, 18, -2 * Math.PI / 3, 23));
      planetarySystems.push(createMoon('moon_7b', 'planet_7', 190, 200, 18, Math.PI / 3, 25));
      planetarySystems.push(createMoon('moon_7c', 'planet_7', 190, 200, 18, Math.PI, 21));
      
      setConstellationStars(planetarySystems);
      setShowFinalConstellation(true);
      
      // Mark cutscene as seen to enable orbital animation
      setHasSeenConstellationCutscene(true);
      
      // Mark first activity as complete so telescope is interactive
      setHasCompletedFirstActivity(true);
      
      // Enable telescope interaction for easy navigation to sky
      setXKeyTriggered(false); // Allow triggering
      
      console.log('[CombinedHomeScene] 🧪 Planetary systems showcase created!');
      console.log('[CombinedHomeScene] 🧪 7 systems (all in upper-left quadrant) with', planetarySystems.length, 'celestial bodies');
      console.log('[CombinedHomeScene] 🧪 Every planet has 3-4 moons orbiting with full 3D effects!');
      console.log('[CombinedHomeScene] 🧪 Press X near telescope to view the living sky!');
    }
  }, []); // Run once on mount
  
  // Star sparkle animation - cycles through sparkle frames (NO highlighting - speech bubble handles that)
  useEffect(() => {
    // Start sparkle loop (only if star hasn't been unlocked yet)
    if (!isPingPongActive && !isRevealAnimating && !starUnlocked) {
      console.log('[CombinedHomeScene] ⭐ Starting sparkle animation!');
      setIsPingPongActive(true);
      
      // Creating star animation interval
      pingPongIntervalRef.current = setInterval(() => {
        // Cycle through 0, 1, 2
        sparkleAnimationCycle.current = (sparkleAnimationCycle.current + 1) % 3;
        
        // Always use base sparkle frames (2, 3, 4) - no highlighting
        // Speech bubble will indicate selection instead
        const frame = sparkleAnimationCycle.current + 2;
        
        setTutorialStarFrame(frame);
      }, 400); // 400ms per frame for clear progression
    }
  }, [isPingPongActive, isRevealAnimating, starUnlocked]);
  
  // === STAR SPEECH BUBBLE VISIBILITY ===
  // Show star speech bubble in sky view when star is visible, hide after first inspection
  useEffect(() => {
    setStarSpeechBubbleVisible(
      currentView === 'sky' && 
      !showFinalConstellation && 
      !isPlayingCutscene && 
      !showStarDetail && // Hide when modal is open
      !showMonologue && // Hide when monologue is showing
      !deskXKeyEnabled // Hide after first inspection (star has been viewed)
    );
  }, [currentView, showFinalConstellation, isPlayingCutscene, showStarDetail, showMonologue, deskXKeyEnabled]);
  
  // === STAR PROXIMITY DETECTION (for speech bubble highlighting in sky view) ===
  useEffect(() => {
    if (currentView !== 'sky' || !starSpeechBubbleVisible) {
      setStarSpeechBubbleHighlighted(false);
      return;
    }
    
    // In sky view, highlight when star is selected in navigation
    setStarSpeechBubbleHighlighted(skyHighlight === 'star');
  }, [currentView, skyHighlight, starSpeechBubbleVisible]);
  
  // === STAR SPEECH BUBBLE ANIMATION ===
  useEffect(() => {
    if (!starSpeechBubbleVisible) return;
    
    const BUBBLE_FRAME_SPEED = 150; // ms per frame
    let bubbleFrameCount = 1;
    
    const animateBubble = () => {
      bubbleFrameCount = (bubbleFrameCount % 4) + 1; // Cycle 1-4
      setStarSpeechBubbleFrame(bubbleFrameCount);
    };
    
    const bubbleInterval = setInterval(animateBubble, BUBBLE_FRAME_SPEED);
    
    return () => clearInterval(bubbleInterval);
  }, [starSpeechBubbleVisible]);
  
  // Comp-sheet options layer animation - show highlighted frame based on hover/highlight state
  useEffect(() => {
    if (compSheetPhase === 'waiting') {
      console.log('[CombinedHomeScene] Comp-sheet waiting - updating options layer frame');
      
      // Check if any activity is hovered/highlighted
      if (hoveredActivity !== null || highlightedActivity !== null) {
        // Show highlighted frame (2-6 based on activity index 0-4)
        const activityIndex = hoveredActivity !== null ? hoveredActivity : highlightedActivity;
        setCompOptionsFrame(2 + activityIndex); // Frames 2-6 for activities 0-4
      } else {
        // No hover/highlight - show frame 1 (none highlighted)
        setCompOptionsFrame(1);
      }
    }
  }, [compSheetPhase, hoveredActivity, highlightedActivity]);
  
  // Comp-sheet option1 layer autonomous animation - loop frames 1-5 with longer linger on frame 1
  useEffect(() => {
    if (compSheetPhase === 'waiting') {
      console.log('[CombinedHomeScene] Starting option1 layer autonomous animation');
      
      let currentFrame = 1;
      setCompOption1Frame(currentFrame);
      
      const animateFrame = () => {
        if (currentFrame === 1) {
          // Linger on frame 1 for 1 second
          compOption1AnimationRef.current = setTimeout(() => {
            currentFrame = 2;
            setCompOption1Frame(currentFrame);
            animateFrame(); // Continue animation
          }, 1000) as unknown as NodeJS.Timeout;
        } else {
          // Advance through frames 2-5 quickly
          compOption1AnimationRef.current = setTimeout(() => {
            currentFrame++;
            if (currentFrame > 5) {
              currentFrame = 1; // Loop back to frame 1
            }
            setCompOption1Frame(currentFrame);
            animateFrame(); // Continue animation
          }, 150) as unknown as NodeJS.Timeout;
        }
      };
      
      animateFrame(); // Start the animation loop
      
      return () => {
        if (compOption1AnimationRef.current) {
          clearTimeout(compOption1AnimationRef.current);
          compOption1AnimationRef.current = null;
        }
      };
    }
  }, [compSheetPhase]);
  
  // Comp-sheet phase transitions - handles boot-up and activity transitions with fade effects
  useEffect(() => {
    // === BOOT-UP PHASES (opening the computer) ===
    // Phase: Booting - monitor visible with black fill, wait briefly then start fade in
    if (compSheetPhase === 'booting') {
      console.log('[CombinedHomeScene] Computer booting - showing black monitor');
      setTimeout(() => {
        console.log('[CombinedHomeScene] Boot fade in - showing blue screen + menu');
        setCompSheetPhase('booting_fade_in');
      }, 300); // Hold on black monitor briefly
    }
    
    // Phase: Booting fade in - screen + menu layers fade in, then ready for interaction
    if (compSheetPhase === 'booting_fade_in') {
      setTimeout(() => {
        console.log('[CombinedHomeScene] Boot complete - ready for interaction');
        setCompSheetPhase('waiting');
      }, 350); // Wait for fade in transition
    }
    
    // === ACTIVITY TRANSITION PHASES (selecting an activity) ===
    if (compSheetPhase === 'transitioning') {
      console.log('[CombinedHomeScene] Starting comp-sheet transition animation');
      
      // Clear any existing animations
      if (compOption1AnimationRef.current) {
        clearTimeout(compOption1AnimationRef.current);
        compOption1AnimationRef.current = null;
      }
      
      // Show pressed state (options layer frame 7) briefly
      setCompOptionsFrame(7);
      
      // After 150ms, start fading to black (menu layers + screen fade out)
      setTimeout(() => {
        console.log('[CombinedHomeScene] Fading to black - hiding menu layers');
        setCompSheetPhase('fading_to_black');
      }, 150);
    }
    
    // Phase: Fading to black - wait for screen to fade out, then show intro
    if (compSheetPhase === 'fading_to_black') {
      setTimeout(() => {
        console.log('[CombinedHomeScene] Fading from black - showing Anthro intro');
        setShowAnthroIntro(true);
        setAnthroIntroFrame(0); // Start at first frame
        setCompSheetPhase('intro');
      }, 350); // Wait for screen layer fade out transition
    }
    
    // Phase: Intro fading to black - after intro complete, fade out then show TBI
    if (compSheetPhase === 'intro_fading_to_black') {
      setTimeout(() => {
        console.log('[CombinedHomeScene] Intro complete - showing TBI positioning');
        setShowAnthroIntro(false); // Hide intro
        setShowTbiPositioning(true);
        setTbiPositioningFrame(0); // Start at first frame
        setCompSheetPhase('fading_from_black');
      }, 350); // Wait for intro fade out transition
    }
    
    // Phase: Fading from black - wait for dark screen + TBI to fade in, then complete
    if (compSheetPhase === 'fading_from_black') {
      setTimeout(() => {
        console.log('[CombinedHomeScene] Transition complete - activity phase');
        setCompSheetPhase('activity');
      }, 350); // Wait for fade in transition
    }
    
    // === RESULT TRANSITION PHASES (after TBI positioning complete) ===
    // Phase: Result fading to black - hide TBI, then show result
    if (compSheetPhase === 'result_fading_to_black') {
      setTimeout(() => {
        console.log('[CombinedHomeScene] TBI faded out - showing result animation');
        setShowTbiPositioning(false); // Hide TBI positioning
        setShowTbiResult(true);
        setTbiResultFrame(0); // Start at first frame
        setCompSheetPhase('result_fading_from_black');
      }, 350); // Wait for TBI fade out transition
    }
    
    // Phase: Result fading from black - wait for result to fade in, then start animation
    if (compSheetPhase === 'result_fading_from_black') {
      setTimeout(() => {
        console.log('[CombinedHomeScene] Result faded in - starting animation');
        setCompSheetPhase('result');
        
        // Start result animation: play frames 0-10 at 500ms each, then land on frame 11
        let currentFrame = 0;
        const animateResult = () => {
          if (currentFrame < 11) {
            // Play frames 0-10
            currentFrame++;
            setTbiResultFrame(currentFrame);
            tbiResultAnimationRef.current = setTimeout(animateResult, 500);
          } else {
            // Animation complete - land on frame 11 (or 12)
            console.log('[CombinedHomeScene] Result animation complete - landed on frame 11');
            setTbiResultFrame(11); // Final frame (can be 11 or 12)
          }
        };
        
        // Start animation after a brief pause
        tbiResultAnimationRef.current = setTimeout(animateResult, 500);
      }, 350); // Wait for fade in transition
    }
  }, [compSheetPhase]);
  
  // Cleanup interval on component unmount
  useEffect(() => {
    return () => {
      if (pingPongIntervalRef.current) {
        // Cleaning up star animation interval
        clearInterval(pingPongIntervalRef.current);
        pingPongIntervalRef.current = null;
      }
      if (kapoorAnimationRef.current) {
        clearInterval(kapoorAnimationRef.current);
        kapoorAnimationRef.current = null;
      }
      if (compOption1AnimationRef.current) {
        clearTimeout(compOption1AnimationRef.current);
        compOption1AnimationRef.current = null;
      }
      if (tbiResultAnimationRef.current) {
        clearTimeout(tbiResultAnimationRef.current);
        tbiResultAnimationRef.current = null;
      }
    };
  }, []);
  
  // Keyboard controls for Kapoor, X key interaction, and sky view navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Handle arrow keys
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
        e.preventDefault(); // Prevent page scrolling
        
        // Comp-sheet activity navigation: spatial navigation based on actual positions
        if (compSheetVisible && compSheetPhase === 'waiting') {
          // Define activity positions (matching ActivityClickRegion coordinates - centers)
          // Scaled from 600×360 to 300×180, offset by comp position (170, 90)
          const activityPositions = [
            { id: 0, x: 215, y: 140 },  // top-left (center of region)
            { id: 1, x: 415, y: 140 },  // top-right
            { id: 2, x: 215, y: 220 },  // bottom-left
            { id: 3, x: 310, y: 220 },  // bottom-middle
            { id: 4, x: 415, y: 220 },  // bottom-right
          ];
          
          const currentPos = activityPositions[highlightedActivity];
          
          // Determine direction vector based on arrow key
          let directionX = 0;
          let directionY = 0;
          
          if (e.key === 'ArrowLeft') directionX = -1;
          if (e.key === 'ArrowRight') directionX = 1;
          if (e.key === 'ArrowUp') directionY = -1;
          if (e.key === 'ArrowDown') directionY = 1;
          
          // Find best target in the pressed direction using spatial navigation
          let bestTarget: { id: number; score: number } | null = null;
          
          for (const target of activityPositions) {
            if (target.id === highlightedActivity) continue; // Skip current activity
            
            const dx = target.x - currentPos.x;
            const dy = target.y - currentPos.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Calculate alignment: dot product of direction vector with target vector
            const alignment = (dx * directionX + dy * directionY) / distance;
            
            // Only consider targets that are in the pressed direction (alignment > 0.3)
            if (alignment > 0.3) {
              // Square alignment to heavily favor well-aligned targets (e.g. directly right/down)
              const score = distance / (alignment * alignment); // Lower score = better target
              
              if (!bestTarget || score < bestTarget.score) {
                bestTarget = { id: target.id, score };
              }
            }
          }
          
          if (bestTarget) {
            setHighlightedActivity(bestTarget.id);
            console.log(`[CombinedHomeScene] Activity navigation: ${highlightedActivity} → ${bestTarget.id}`);
          }
        }
        // In sky view: no arrow key navigation - stars are always highlighted
        // (Navigation removed - C key returns home, X key inspects stars)
        else if (currentView === 'home') {
          // In home view: add to movement keys
          keysPressed.current.add(e.key);
        }
      }
      
      // Handle 'x' key interaction - toggle between sky and home views, or interact with desk/star
      if (e.key === 'x' || e.key === 'X') {
        // Debug: Log all X key states
        console.log('[X Key Debug] Pressed!', {
          currentView,
          showAnthroIntro,
          anthroIntroFrame,
          showTbiPositioning,
          showTbiResult,
          showStarDetail,
          activeInteraction,
          interactionFrame,
          deskXKeyTriggered,
          compSheetVisible,
          compSheetPhase,
          showPicoDialogue,
          picoInteracted
        });
        
        // Priority 0a: Advance Anthro intro dialogue if showing
        if (showAnthroIntro && compSheetPhase === 'intro') {
          if (anthroIntroFrame < ANTHRO_INTRO_TOTAL_FRAMES - 1) {
            // Advance to next frame
            console.log('[CombinedHomeScene] X key pressed - advancing intro frame', anthroIntroFrame + 1);
            setAnthroIntroFrame(prev => prev + 1);
          } else {
            // Last frame - start fade to TBI positioning
            console.log('[CombinedHomeScene] X key pressed - intro complete, fading to TBI');
            setCompSheetPhase('intro_fading_to_black');
          }
        }
        // Priority 0b: Transition to result if TBI positioning is showing (and in activity phase)
        else if (showTbiPositioning && compSheetPhase === 'activity') {
          console.log('[CombinedHomeScene] X key pressed - TBI positioning complete, showing result');
          setCompSheetPhase('result_fading_to_black');
        }
        // Priority 0c: Complete activity if result screen is showing
        else if (showTbiResult && compSheetPhase === 'result') {
          console.log('[CombinedHomeScene] X key pressed - completing activity from result');
          handleActivityComplete();
        }
        // Priority 1a: Advance through Kapoor monologue lines (or dismiss if last line)
        else if (showMonologue && currentView === 'sky') {
          if (currentMonologueLineIndex < monologueLines.length - 1) {
            // Advance to next line in current monologue
            console.log('[CombinedHomeScene] X key pressed - advancing monologue line');
            setCurrentMonologueLineIndex(prev => prev + 1);
          } else {
            // Last line - dismiss monologue and reset star highlight for re-inspection
            console.log('[CombinedHomeScene] X key pressed - closing monologue');
            setShowMonologue(false);
            setSkyHighlight('star'); // Reset to star so player can inspect again
          }
        }
        // Priority 1b: Close star modal if open
        else if (showStarDetail) {
          console.log('[CombinedHomeScene] X key pressed - closing star modal');
          
          // Close modal (monologue will appear in handleCloseStarDetail if it's ??? star)
          handleCloseStarDetail();
        }
        // Priority 2: Desk interaction (new system: when desk is active interaction)
        else if (currentView === 'home' && activeInteraction === 'desk' && !deskXKeyTriggered && !compSheetVisible) {
          console.log('[CombinedHomeScene] Desk X key pressed - showing comp-sheet!');
          
          // Show highlighted frame
          setInteractionFrame(3);
          
          // After brief highlight, show comp-sheet and start boot-up animation
          setTimeout(() => {
            setDeskXKeyTriggered(true);
            setActiveInteraction(null); // Clear active interaction
            setCompSheetVisible(true);
            setCompSheetPhase('booting'); // Start with black monitor, then fade in
            setCompOptionsFrame(1); // Start with no highlight
            setCompOption1Frame(1); // Start option1 animation
            setHighlightedActivity(0); // Default to first activity highlighted
          }, 150); // Brief highlight visual
        }
        // Priority 2b: Comp-sheet X key interaction (when comp-sheet is in waiting phase) - select highlighted activity
        else if (compSheetVisible && compSheetPhase === 'waiting') {
          console.log('[CombinedHomeScene] Comp-sheet X key pressed - selecting activity', highlightedActivity);
          
          // Set selected activity and start transition
          setSelectedActivity(highlightedActivity);
          setCompSheetPhase('transitioning');
        }
        // Priority 2b: Pico blocking dialogue advancement/dismissal (when player tried to climb without talking)
        else if (showPicoBlockingDialogue) {
          console.log('[CombinedHomeScene] X key pressed - advancing/dismissing Pico blocking dialogue', {
            currentIndex: picoBlockingDialogueIndex,
            totalLines: picoBlockingDialogue.length
          });
          
          // Advance to next dialogue line if not on last line
          if (picoBlockingDialogueIndex < picoBlockingDialogue.length - 1) {
            setPicoBlockingDialogueIndex(picoBlockingDialogueIndex + 1);
            console.log('[CombinedHomeScene] Advanced to blocking line', picoBlockingDialogueIndex + 1);
          } else {
            // Last line - close blocking dialogue and allow player to try again (or go talk to Pico)
            console.log('[CombinedHomeScene] Blocking dialogue complete - dismissing');
            setShowPicoBlockingDialogue(false);
            setPicoIsTalking(false);
            setKapoorIsClimbing(false); // Release the freeze
            
            // Mark that player has seen the full blocking sequence (only matters if they started from message 0)
            setHasShownFirstBlockingMessage(true);
            
            // Reset dialogue index after fade animation completes
            setTimeout(() => {
              setPicoBlockingDialogueIndex(0);
              console.log('[CombinedHomeScene] Blocking dialogue closed - player can try again or talk to Pico');
            }, 250);
          }
        }
        // Priority 2c: Pico dialogue advancement (when dialogue is showing)
        else if (showPicoDialogue) {
          console.log('[CombinedHomeScene] X key pressed - advancing Pico dialogue', {
            currentIndex: picoDialogueIndex,
            totalLines: picoDialogueLines.length,
            nextAction: picoDialogueIndex < picoDialogueLines.length - 1 ? 'advance' : 'close'
          });
          
          // Advance to next dialogue line
          if (picoDialogueIndex < picoDialogueLines.length - 1) {
            setPicoDialogueIndex(picoDialogueIndex + 1);
            console.log('[CombinedHomeScene] Advanced to line', picoDialogueIndex + 1);
          } else {
            // End of dialogue - close dialogue and mark as interacted
            console.log('[CombinedHomeScene] Pico dialogue complete!');
            setShowPicoDialogue(false);
            setPicoInteracted(true);
            setPicoIsTalking(false);
            
            // Reset dialogue index after fade animation completes (0.2s transition)
            setTimeout(() => {
              setPicoDialogueIndex(0);
            }, 250);
          }
        }
        // Priority 2d: Pico initial interaction (new system: when pico is active interaction)
        else if (currentView === 'home' && activeInteraction === 'pico' && !picoInteracted) {
          console.log('[CombinedHomeScene] X key pressed near Pico - starting dialogue!');
          
          // Show highlighted frame
          setInteractionFrame(3);
          
          // After brief highlight, start dialogue
          setTimeout(() => {
            setPicoSpeechBubbleVisible(false);
            setShowPicoDialogue(true);
            setPicoDialogueIndex(0);
            setPicoIsTalking(true);
          }, 150);
        }
        // Priority 3: Star X key interaction (when in sky view, constellation stars highlighted)
        else if (currentView === 'sky' && !showStarDetail && skyHighlight !== 'telescope' && !showMonologue) {
          // Check if ??? star (tutorial star) - open modal (monologue will appear on close)
          if (skyHighlight === 'star') {
            console.log(`[CombinedHomeScene] X key pressed on ??? star - opening modal`);
            
            // Open the modal showing "???" and description
            setActiveStarId('star');
            setShowStarDetail(true);
          }
          // Check if any other constellation celestial body is highlighted (TBI planet, or moons)
          else {
            const constellationStarIds: StarIdType[] = ['tbi', 'tbi_dosimetry', 'tbi_prescriptions', 'tbi_commissioning'];
            if (constellationStarIds.includes(skyHighlight as StarIdType)) {
              console.log(`[CombinedHomeScene] X key pressed on ${skyHighlight} - opening star modal!`);
              
              // Trigger star modal immediately (no key depression visual in sky view)
              setActiveStarId(skyHighlight as StarIdType);
              setShowStarDetail(true);
            }
          }
        }
        // Priority 4: Telescope interaction (new system: when telescope is active interaction)
        else if (currentView === 'home' && activeInteraction === 'telescope' && !xKeyTriggered) {
          // Check if we should play the constellation cutscene
          const shouldPlayCutscene = hasCompletedFirstActivity && !hasSeenConstellationCutscene;
          
          console.log(`[CombinedHomeScene] X key pressed - ${shouldPlayCutscene ? 'triggering CUTSCENE' : 'triggering slow scroll to sky'}!`);
          
          // Show highlighted frame
          setInteractionFrame(3);
          
          // After brief highlight, fade away and trigger slow scroll to sky
          setTimeout(() => {
            setActiveInteraction(null); // Clear active interaction
            setXKeyTriggered(true);
            
            // Telescope speech bubble visibility now controlled by useEffect based on game state
            
            // If about to play cutscene, mark that we're in cutscene scroll mode
            if (shouldPlayCutscene) {
              setIsCutsceneScrolling(true);
            } else {
              // If cutscene has been seen, default to TBI planet; otherwise ??? star
              setSkyHighlight(hasSeenConstellationCutscene ? 'tbi' : 'star');
            }
            
            // Set DRASTICALLY slow transition duration
            const slowDuration = 5.0; // 5 seconds for dramatic slow scroll
            setTransitionDuration(slowDuration);
            
            // Trigger slow scroll to sky view (view change delayed until transition completes)
            setTimeout(() => {
              scrollToSkySlowly(slowDuration);
              
              // If cutscene should play, start it after scroll completes
              if (shouldPlayCutscene) {
                setTimeout(() => {
                  console.log('[CombinedHomeScene] Scroll complete - starting constellation cutscene!');
                  setIsCutsceneScrolling(false); // End scroll phase
                  setIsPlayingCutscene(true); // Start cutscene
                  setHasSeenConstellationCutscene(true);
                }, slowDuration * 1000);
              }
              
              // Reset transition duration after scroll completes
              setTimeout(() => {
                setTransitionDuration(0.8);
                // After cutscene ends, TBI is already highlighted by the cutscene code
                // No need to change it here
              }, slowDuration * 1000); // Reset after slow transition completes
            }, 100); // Small delay to ensure transition duration is set first
          }, 150); // Brief highlight visual
        }
        // Priority 5: In sky view telescope - check if telescope is highlighted
        else if (currentView === 'sky' && skyHighlight === 'telescope') {
          console.log('[CombinedHomeScene] X key pressed on highlighted telescope - triggering slow scroll to home!');
          
          // Set DRASTICALLY slow transition duration
          const slowDuration = 5.0; // 5 seconds for dramatic slow scroll
          setTransitionDuration(slowDuration);
          
          // Trigger slow scroll to home view
          setTimeout(() => {
            setScrollPosition(-(JUMBO_ASSET_HEIGHT - HOME_INTERNAL_HEIGHT)); // Bottom position (home view)
            
            // Delay view change until after the slow transition completes
            setTimeout(() => {
              setCurrentView('home');
              // Reset X key triggered state so it can be used again
              setXKeyTriggered(false);
              // Reset transition duration
              setTransitionDuration(0.8);
            }, slowDuration * 1000);
          }, 100);
        }
      }
      
      // Handle 'c' key - in desk activity: close, in sky view: return home, in home view: pet Pico
      if (e.key === 'c' || e.key === 'C') {
        console.log('[C Key Debug] Pressed!', { currentView, cKeyFrame, compSheetVisible, showAnthroIntro, showTbiPositioning, showTbiResult });
        
        // Priority 0: Close desk activity if visible (but not during intro, TBI positioning, or result - use X key for those)
        if (compSheetVisible && !showAnthroIntro && !showTbiPositioning && !showTbiResult) {
          console.log('[CombinedHomeScene] C key pressed - closing desk activity');
          handleActivityComplete();
        }
        // Priority 1: In sky view, return home with slow cinematic transition
        else if (currentView === 'sky' && !showStarDetail && !isPlayingCutscene) {
          console.log('[CombinedHomeScene] C key pressed in sky view - returning home with slow transition');
          const slowDuration = 5.0; // 5 seconds for dramatic slow scroll like telescope return
          setTransitionDuration(slowDuration);
          setScrollPosition(-225); // Return to home position
          
          // Reset states after animation completes
          setTimeout(() => {
            setCurrentView('home');
            setXKeyTriggered(false); // Reset so telescope can be used again
            setTransitionDuration(0.8);
          }, slowDuration * 1000);
        }
        // Priority 2: In home view, pet Pico when in interaction range
        else if (currentView === 'home') {
          const picoHorizontalOffset = kapoorPosition.x - PICO_POSITION.x;
          const picoDistance = Math.abs(picoHorizontalOffset);
          const INTERACTION_RANGE = PROXIMITY_THRESHOLD / 2;
          
          // Pico has extended interaction range to the left
          const picoInteractionRange = picoHorizontalOffset < 0 
            ? INTERACTION_RANGE + PICO_LEFT_EXTENSION // Left of Pico - extended range
            : INTERACTION_RANGE; // Right of Pico - normal range
          
          const isNearPico = picoDistance < picoInteractionRange;
          
          if (isNearPico) {
            console.log('[CombinedHomeScene] C key pressed near Pico - showing pet description!');
            
            // Show highlighted frame
            setCKeyFrame(3);
            
            // After brief highlight, show pet description
            setTimeout(() => {
              setShowPetDescription(true);
              
              // Hide description after 3 seconds
              setTimeout(() => {
                setShowPetDescription(false);
                // Reset C key frame back to normal
                setCKeyFrame(1);
              }, 3000);
            }, 150);
          }
        }
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current.delete(e.key);
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [activeInteraction, interactionFrame, cKeyFrame, xKeyTriggered, currentView, deskXKeyTriggered, skyHighlight, showStarDetail, showMonologue, currentMonologueLineIndex, constellationStars, showFinalConstellation, showAnthroIntro, anthroIntroFrame, ANTHRO_INTRO_TOTAL_FRAMES, showTbiPositioning, showTbiResult, compSheetVisible, compSheetPhase, highlightedActivity, showPicoDialogue, showPicoBlockingDialogue, picoBlockingDialogueIndex, picoDialogueIndex, picoInteracted, kapoorPosition, hasCompletedFirstActivity, hasSeenConstellationCutscene]); // Updated for new interaction system
  
  // Arrow keys visibility timer - hide after 10 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      console.log('[CombinedHomeScene] 10 seconds elapsed - hiding arrow keys tutorial');
      setArrowKeysVisible(false);
    }, 10000);
    
    return () => clearTimeout(timer);
  }, []);

  // TBI Positioning keyboard controls - left/right arrow keys to navigate frames
  useEffect(() => {
    if (!showTbiPositioning) return; // Only active when TBI positioning is showing

    const handleTbiPositioningKeyDown = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        e.stopPropagation(); // Stop from reaching other handlers
      }

      if (e.key === 'ArrowLeft') {
        setTbiPositioningFrame(prev => Math.min(TBI_POSITIONING_TOTAL_FRAMES - 1, prev + 1));
      } else if (e.key === 'ArrowRight') {
        setTbiPositioningFrame(prev => Math.max(0, prev - 1));
      }
    };

    window.addEventListener('keydown', handleTbiPositioningKeyDown, { capture: true }); // Use capture phase for priority
    return () => window.removeEventListener('keydown', handleTbiPositioningKeyDown, { capture: true });
  }, [showTbiPositioning, TBI_POSITIONING_TOTAL_FRAMES]);
  
  // Arrow keys frame animation based on key presses
  // Frames: 1=all up, 2=right only, 3=left only, 4=up only, 5=down only, 6=multiple, 7=all up highlighted, 8=multiple highlighted
  useEffect(() => {
    const updateArrowKeysFrame = () => {
      const keys = keysPressed.current;
      const leftPressed = keys.has('ArrowLeft');
      const rightPressed = keys.has('ArrowRight');
      const upPressed = keys.has('ArrowUp');
      const downPressed = keys.has('ArrowDown');
      
      const pressedCount = (leftPressed ? 1 : 0) + (rightPressed ? 1 : 0) + (upPressed ? 1 : 0) + (downPressed ? 1 : 0);
      
      if (pressedCount === 0) {
        setArrowKeysFrame(1); // All up
      } else if (pressedCount === 1) {
        // Only one key pressed
        if (rightPressed) setArrowKeysFrame(2); // Right only
        else if (leftPressed) setArrowKeysFrame(3); // Left only
        else if (upPressed) setArrowKeysFrame(4); // Up only
        else if (downPressed) setArrowKeysFrame(5); // Down only
      } else {
        // Multiple keys pressed
        setArrowKeysFrame(6); // All pushed
      }
    };
    
    // Check keys every 50ms to stay synced with movement
    const interval = setInterval(updateArrowKeysFrame, 50);
    
    return () => clearInterval(interval);
  }, []);
  
  // Centralized proximity detection - checks all interactive objects and determines closest
  useEffect(() => {
    // Only active in home view
    if (currentView !== 'home') {
      setActiveInteraction(null);
      return;
    }
    
    // Calculate distances to all interactive objects
    const telescopeDistance = Math.sqrt(
      Math.pow(kapoorPosition.x - TELESCOPE_POSITION.x, 2) + 
      Math.pow(kapoorPosition.y - TELESCOPE_POSITION.y, 2)
    );
    
    const deskDistance = Math.sqrt(
      Math.pow(kapoorPosition.x - DESK_POSITION.x, 2) + 
      Math.pow(kapoorPosition.y - DESK_POSITION.y, 2)
    );
    
    // Pico distance with extended range to the left
    const picoHorizontalOffset = kapoorPosition.x - PICO_POSITION.x;
    const picoDistance = Math.abs(picoHorizontalOffset);
    
    // Find closest interactive object within ACTUAL INTERACTION RANGE (not proximity hint range)
    // Keys only show when actually interactable to prevent player confusion
    const INTERACTION_RANGE = PROXIMITY_THRESHOLD / 2; // Half of original proximity threshold
    
    // Pico has extended interaction range to the left
    const picoInteractionRange = picoHorizontalOffset < 0 
      ? INTERACTION_RANGE + PICO_LEFT_EXTENSION // Left of Pico - extended range
      : INTERACTION_RANGE; // Right of Pico - normal range
    
    const interactions: Array<{ type: InteractionType; distance: number; label: string; enabled: boolean; range?: number }> = [
      { type: 'telescope', distance: telescopeDistance, label: 'Look', enabled: !xKeyTriggered },
      { type: 'desk', distance: deskDistance, label: 'Study', enabled: deskXKeyEnabled && !deskXKeyTriggered },
      { type: 'pico', distance: picoDistance, label: 'Talk', enabled: !picoInteracted, range: picoInteractionRange }
    ];
    
    // Filter to only enabled interactions within their respective ranges
    const nearbyInteractions = interactions.filter(i => i.enabled && i.distance < (i.range || INTERACTION_RANGE));
    
    if (nearbyInteractions.length === 0) {
      setActiveInteraction(null);
      return;
    }
    
    // Sort by distance and take closest
    nearbyInteractions.sort((a, b) => a.distance - b.distance);
    const closest = nearbyInteractions[0];
    
    setActiveInteraction(closest.type);
    setContextLabel(closest.label);
    
    // Always show unhighlighted when visible - highlighting happens on key press
    setInteractionFrame(1); // Normal (unhighlighted)
  }, [kapoorPosition, currentView, xKeyTriggered, deskXKeyEnabled, deskXKeyTriggered, picoInteracted]);
  
  // Ladder arrow indicators - show up/down arrows when near ladder
  useEffect(() => {
    // Constants for ladder position (matching movement logic)
    const CLIMB_X_THRESHOLD = 545;
    const CLIMB_X_TOLERANCE = 10;
    const GROUND_FLOOR_Y = 467;
    const SECOND_FLOOR_Y = 307; // 467 - 160 = 307
    const FLOOR_TOLERANCE = 15;
    
    // Check if near ladder horizontally
    const nearLadderX = Math.abs(kapoorPosition.x - CLIMB_X_THRESHOLD) < CLIMB_X_TOLERANCE;
    
    // Check floor positions
    const onGroundFloor = Math.abs(kapoorPosition.y - GROUND_FLOOR_Y) < FLOOR_TOLERANCE;
    const onSecondFloor = Math.abs(kapoorPosition.y - SECOND_FLOOR_Y) < FLOOR_TOLERANCE;
    
    // Show up arrow when near ladder at ground floor
    setShowUpArrow(nearLadderX && onGroundFloor && currentView === 'home');
    
    // Show down arrow when near ladder at second floor
    setShowDownArrow(nearLadderX && onSecondFloor && currentView === 'home');
  }, [kapoorPosition, currentView]);

  // === TELESCOPE SPEECH BUBBLE VISIBILITY ===
  // Show telescope in home view initially only (hide after first inspection)
  useEffect(() => {
    if (currentView === 'home' && !deskXKeyEnabled) {
      // In home view before star has been viewed - show bubble (initial state only)
      setTelescopeSpeechBubbleVisible(true);
    } else {
      // All other cases: hide bubble (after first inspection, in sky view, etc.)
      setTelescopeSpeechBubbleVisible(false);
    }
  }, [currentView, deskXKeyEnabled]);
  
  // === DESK SPEECH BUBBLE VISIBILITY ===
  // Show desk speech bubble after viewing the star, but hide after completing first activity
  useEffect(() => {
    setDeskSpeechBubbleVisible(
      currentView === 'home' && 
      deskXKeyEnabled && 
      !hasCompletedFirstActivity && // Hide after completing first activity
      !compSheetVisible // Hide during comp-sheet activity
    );
  }, [currentView, deskXKeyEnabled, hasCompletedFirstActivity, compSheetVisible]);
  
  // === TELESCOPE PROXIMITY DETECTION (for speech bubble highlighting) ===
  useEffect(() => {
    if (!telescopeSpeechBubbleVisible) {
      setTelescopeSpeechBubbleHighlighted(false);
      return;
    }
    
    if (currentView === 'home') {
      // In home view: highlight when Kapoor is near telescope
      const telescopeDistance = Math.sqrt(
        Math.pow(kapoorPosition.x - TELESCOPE_POSITION.x, 2) + 
        Math.pow(kapoorPosition.y - TELESCOPE_POSITION.y, 2)
      );
      setTelescopeSpeechBubbleHighlighted(telescopeDistance < PROXIMITY_THRESHOLD);
    } else if (currentView === 'sky') {
      // In sky view: highlight when telescope is selected (always highlighted since it's the only "return" option)
      setTelescopeSpeechBubbleHighlighted(true);
    } else {
      setTelescopeSpeechBubbleHighlighted(false);
    }
  }, [currentView, telescopeSpeechBubbleVisible, kapoorPosition]);
  
  // === DESK PROXIMITY DETECTION (for speech bubble highlighting in home view only) ===
  useEffect(() => {
    if (!deskSpeechBubbleVisible || currentView !== 'home') {
      setDeskSpeechBubbleHighlighted(false);
      return;
    }
    
    // In home view: highlight when Kapoor is near desk
    const deskDistance = Math.sqrt(
      Math.pow(kapoorPosition.x - DESK_POSITION.x, 2) + 
      Math.pow(kapoorPosition.y - DESK_POSITION.y, 2)
    );
    setDeskSpeechBubbleHighlighted(deskDistance < PROXIMITY_THRESHOLD);
  }, [currentView, deskSpeechBubbleVisible, kapoorPosition]);
  
  // === TELESCOPE SPEECH BUBBLE ANIMATION ===
  useEffect(() => {
    if (!telescopeSpeechBubbleVisible) return;
    
    const BUBBLE_FRAME_SPEED = 150; // ms per frame
    let bubbleFrameCount = 1;
    
    const animateBubble = () => {
      bubbleFrameCount = (bubbleFrameCount % 4) + 1; // Cycle 1-4
      setTelescopeSpeechBubbleFrame(bubbleFrameCount);
    };
    
    const bubbleInterval = setInterval(animateBubble, BUBBLE_FRAME_SPEED);
    
    return () => clearInterval(bubbleInterval);
  }, [telescopeSpeechBubbleVisible]);
  
  // === DESK SPEECH BUBBLE ANIMATION ===
  useEffect(() => {
    if (!deskSpeechBubbleVisible) return;
    
    const BUBBLE_FRAME_SPEED = 150; // ms per frame
    let bubbleFrameCount = 1;
    
    const animateBubble = () => {
      bubbleFrameCount = (bubbleFrameCount % 4) + 1; // Cycle 1-4
      setDeskSpeechBubbleFrame(bubbleFrameCount);
    };
    
    const bubbleInterval = setInterval(animateBubble, BUBBLE_FRAME_SPEED);
    
    return () => clearInterval(bubbleInterval);
  }, [deskSpeechBubbleVisible]);
  
  // C key (Pet) proximity detection for Pico - only shows when in actual interaction range
  useEffect(() => {
    if (currentView !== 'home') {
      setCKeyFrame(1);
      return;
    }
    
    const picoHorizontalOffset = kapoorPosition.x - PICO_POSITION.x;
    const picoDistance = Math.abs(picoHorizontalOffset);
    const INTERACTION_RANGE = PROXIMITY_THRESHOLD / 2; // Same as X key interaction range
    
    // Pico has extended interaction range to the left
    const picoInteractionRange = picoHorizontalOffset < 0 
      ? INTERACTION_RANGE + PICO_LEFT_EXTENSION // Left of Pico - extended range
      : INTERACTION_RANGE; // Right of Pico - normal range
    
    // Only show C key when in actual interaction range (unhighlighted)
    // Highlighting happens on key press to prevent confusion
    if (picoDistance < picoInteractionRange) {
      setCKeyFrame(1); // Normal (unhighlighted)
    } else {
      setCKeyFrame(1); // Not visible when out of range
    }
  }, [kapoorPosition, currentView]);
  
  // Kapoor movement and animation - keyboard controlled
  useEffect(() => {
    const WALK_SPEED = 4.0; // pixels per frame
    const CLIMB_SPEED = 4.0; // pixels per frame for climbing (faster)
    const FRAME_INTERVAL = 50; // ms between animation frames
    const WALK_SPRITE_FRAME_SPEED = 2; // Update sprite frame every N ticks for walking
    const IDLE_SPRITE_FRAME_SPEED = 12; // Update sprite frame every N ticks for idle (0.25x = 4x slower)
    const CLIMB_SPRITE_FRAME_SPEED = 2; // Update sprite frame every N ticks for climbing (faster animation)
    const CLIMB_X_THRESHOLD = 545; // X position where climbing is allowed (matches second floor right boundary)
    const CLIMB_DISTANCE = 160; // Total distance to climb
    const CLIMB_X_TOLERANCE = 10; // Allow climbing if within 10px of threshold
    const GROUND_FLOOR_Y = 467; // Y position of ground floor
    const SECOND_FLOOR_Y = GROUND_FLOOR_Y - CLIMB_DISTANCE; // Y position of second floor (167)
    const FLOOR_TOLERANCE = 15; // How close to floor needed to walk/idle
    
    const animateKapoor = () => {
      // Disable Kapoor movement when in sky view
      if (currentView === 'sky') {
        return;
      }
      
      const keys = keysPressed.current;
      
      // Check which keys are pressed
      const leftPressed = keys.has('ArrowLeft');
      const rightPressed = keys.has('ArrowRight');
      const upPressed = keys.has('ArrowUp');
      const downPressed = keys.has('ArrowDown');
      
      let isWalking = false;
      let isClimbing = false;
      let isFrozenOnLadder = false; // Track if Kapoor is stopped mid-climb
      
      // Check if Kapoor is near climbing position
      setKapoorPosition(currentPos => {
        // Only allow climbing if within range AND not past the second floor right boundary
        const nearClimbPoint = Math.abs(currentPos.x - CLIMB_X_THRESHOLD) < CLIMB_X_TOLERANCE && 
                               currentPos.x <= SECOND_FLOOR_BOUNDS.right;
        
        // Check if Kapoor is on a valid floor (ground or second floor)
        const onGroundFloor = Math.abs(currentPos.y - GROUND_FLOOR_Y) < FLOOR_TOLERANCE;
        const onSecondFloor = Math.abs(currentPos.y - SECOND_FLOOR_Y) < FLOOR_TOLERANCE;
        const onValidFloor = onGroundFloor || onSecondFloor;
        
        // Handle climbing up
        if (nearClimbPoint && upPressed && !leftPressed && !rightPressed) {
          // PICO BLOCKING: Check if player hasn't talked to Pico yet - freeze and show blocking dialogue
          if (!picoInteracted) {
            console.log('[CombinedHomeScene] Pico blocks ladder - player must talk to Pico first!');
            // Freeze Kapoor at ladder
            isClimbing = true;
            isFrozenOnLadder = true;
            setKapoorIsClimbing(true);
            setKapoorIsWalking(false);
            // Show Pico's blocking dialogue
            // If first time: show message 0 (both messages), otherwise show message 1 (just the demand)
            if (!hasShownFirstBlockingMessage) {
              setPicoBlockingDialogueIndex(0); // Start with first message
            } else {
              setPicoBlockingDialogueIndex(1); // Skip to second message for repeat offenders
            }
            setShowPicoBlockingDialogue(true);
            setPicoIsTalking(true); // Pico starts talking animation
            return currentPos; // Stay at current position
          }
          
          // Check if at ceiling (second floor)
          if (currentPos.y <= SECOND_FLOOR_Y) {
            console.log('[CombinedHomeScene] At ceiling - cannot climb higher, freezing animation');
            // Stay at ceiling, freeze animation
            isClimbing = true;
            isFrozenOnLadder = true;
            setKapoorIsClimbing(true);
            setKapoorIsWalking(false);
            return currentPos;
          }
          
          // Start or continue climbing up
          if (climbingStartY === null) {
            console.log('[CombinedHomeScene] Starting climb UP at y:', currentPos.y);
            setClimbingStartY(currentPos.y);
          }
          
          const distanceClimbed = (climbingStartY || currentPos.y) - currentPos.y;
          
          if (distanceClimbed < CLIMB_DISTANCE) {
            // Continue climbing up
            isClimbing = true;
            setKapoorIsClimbing(true);
            setKapoorIsWalking(false);
            
            const newY = Math.max(SECOND_FLOOR_Y, currentPos.y - CLIMB_SPEED);
            console.log('[CombinedHomeScene] Climbing UP - distance:', distanceClimbed.toFixed(0), 'px');
            return { ...currentPos, y: newY };
          } else {
            // Finished climbing - return to idle
            console.log('[CombinedHomeScene] Climb complete! Returning to idle');
            setKapoorIsClimbing(false);
            setKapoorIsWalking(false);
            setKapoorDirection('front');
            setClimbingStartY(null);
            return currentPos;
          }
        } 
        // Handle climbing down
        else if (nearClimbPoint && downPressed && !leftPressed && !rightPressed) {
          // Check if at floor
          if (currentPos.y >= GROUND_FLOOR_Y) {
            console.log('[CombinedHomeScene] At ground floor - cannot climb lower, freezing animation');
            // Stay at ground floor, freeze animation
            isClimbing = true;
            isFrozenOnLadder = true;
            setKapoorIsClimbing(true);
            setKapoorIsWalking(false);
            return currentPos;
          }
          
          // Climbing down - just loop the animation and move down
          isClimbing = true;
          setKapoorIsClimbing(true);
          setKapoorIsWalking(false);
          
          const newY = Math.min(GROUND_FLOOR_Y, currentPos.y + CLIMB_SPEED);
          console.log('[CombinedHomeScene] Climbing DOWN to y:', newY.toFixed(0));
          return { ...currentPos, y: newY };
        }
        // Handle stopping on the ladder (near climb point but no up/down pressed)
        else if (nearClimbPoint && !upPressed && !downPressed && !leftPressed && !rightPressed) {
          // Freeze on ladder - maintain climbing state and current frame
          console.log('[CombinedHomeScene] Stopped on ladder - freezing climb frame');
          isClimbing = true;
          isFrozenOnLadder = true;
          setKapoorIsClimbing(true);
          setKapoorIsWalking(false);
          // Don't update position or frame - just freeze
          return currentPos;
        }
        else if (climbingStartY !== null && !nearClimbPoint) {
          // Reset climbing if moved away horizontally
          console.log('[CombinedHomeScene] Moved away from ladder - resetting');
          setKapoorIsClimbing(false);
          setClimbingStartY(null);
        }
        
        // Normal movement logic (not climbing)
        if (!isClimbing) {
          setKapoorIsClimbing(false);
          
          // Only allow idle changes and walking when on a valid floor
          if (onValidFloor) {
            // Handle up/down for idle direction changes (not movement) when not near climb point
            if (upPressed && !leftPressed && !rightPressed && !nearClimbPoint) {
              setKapoorDirection('back');
              setKapoorIsWalking(false);
            } else if (downPressed && !leftPressed && !rightPressed && !nearClimbPoint) {
              setKapoorDirection('front');
              setKapoorIsWalking(false);
            }
            
            // Handle left/right for walking movement with floor-specific boundaries
            if (leftPressed && !rightPressed) {
              setKapoorDirection('left');
              
              // Determine boundaries based on current floor
              const bounds = onSecondFloor ? SECOND_FLOOR_BOUNDS : FIRST_FLOOR_BOUNDS;
              
              // Move left with floor-specific boundary check
              const newX = Math.max(bounds.left, currentPos.x - WALK_SPEED);
              
              // Check if we hit the boundary (position didn't change)
              if (newX === currentPos.x) {
                // Hit boundary - transition to idle while facing left
                setKapoorIsWalking(false);
                console.log(`[Movement] Hit left boundary at x=${currentPos.x.toFixed(0)}, transitioning to idle`);
              } else {
                setKapoorIsWalking(true);
                isWalking = true;
              }
              
              return { ...currentPos, x: newX };
            } else if (rightPressed && !leftPressed) {
              setKapoorDirection('right');
              
              // Determine boundaries based on current floor
              const bounds = onSecondFloor ? SECOND_FLOOR_BOUNDS : FIRST_FLOOR_BOUNDS;
              
              // Move right with floor-specific boundary check
              const newX = Math.min(bounds.right, currentPos.x + WALK_SPEED);
              
              // Check if we hit the boundary (position didn't change)
              if (newX === currentPos.x) {
                // Hit boundary - transition to idle while facing right
                setKapoorIsWalking(false);
                console.log(`[Movement] Hit right boundary at x=${currentPos.x.toFixed(0)}, transitioning to idle`);
              } else {
                setKapoorIsWalking(true);
                isWalking = true;
              }
              
              return { ...currentPos, x: newX };
            } else if (!leftPressed && !rightPressed) {
              // No horizontal movement - idle
              setKapoorIsWalking(false);
            }
          } else {
            // Not on a valid floor - keep current idle state but don't allow new movement
            setKapoorIsWalking(false);
            console.log('[CombinedHomeScene] Not on valid floor (y:', currentPos.y.toFixed(0), ') - walking disabled');
          }
        }
        
        return currentPos;
      });
      
      // Update animation frame (use different speeds for different states)
      // Don't update frame when frozen on ladder
      if (!isFrozenOnLadder) {
        const currentSpeed = isClimbing ? CLIMB_SPRITE_FRAME_SPEED : 
                            isWalking ? WALK_SPRITE_FRAME_SPEED : 
                            IDLE_SPRITE_FRAME_SPEED;
        kapoorFrameTickRef.current++;
        if (kapoorFrameTickRef.current >= currentSpeed) {
          kapoorFrameTickRef.current = 0;
          kapoorFrameCountRef.current++;
          setKapoorFrame(kapoorFrameCountRef.current);
        }
      }
    };
    
    // Start animation loop
    kapoorAnimationRef.current = setInterval(animateKapoor, FRAME_INTERVAL);
    
    return () => {
      if (kapoorAnimationRef.current) {
        clearInterval(kapoorAnimationRef.current);
      }
    };
  }, [climbingStartY, currentView, picoInteracted, showPicoBlockingDialogue, hasShownFirstBlockingMessage]); // Depend on climbingStartY, currentView, and Pico interaction state
  
  // === PICO ANIMATION LOOP ===
  useEffect(() => {
    const FRAME_INTERVAL = 16; // ~60fps
    const PICO_IDLE_FRAME_SPEED = 8; // Slower animation for idle
    
    const animatePico = () => {
      // Update animation frame
      picoFrameTickRef.current++;
      if (picoFrameTickRef.current >= PICO_IDLE_FRAME_SPEED) {
        picoFrameTickRef.current = 0;
        picoFrameCountRef.current++;
        setPicoFrame(picoFrameCountRef.current);
      }
    };
    
    // Start animation loop
    picoAnimationRef.current = setInterval(animatePico, FRAME_INTERVAL);
    
    return () => {
      if (picoAnimationRef.current) {
        clearInterval(picoAnimationRef.current);
      }
    };
  }, [picoIsTalking]); // Re-run when talking state changes
  
  // === PICO SPEECH BUBBLE VISIBILITY (always shown until interaction) ===
  useEffect(() => {
    // Show speech bubble if not interacted and in home view
    if (!picoInteracted && currentView === 'home' && !showPicoDialogue) {
      setPicoSpeechBubbleVisible(true);
    } else {
      setPicoSpeechBubbleVisible(false);
    }
  }, [picoInteracted, currentView, showPicoDialogue]);
  
  // === PICO PROXIMITY DETECTION (for speech bubble highlighting) ===
  useEffect(() => {
    if (!picoSpeechBubbleVisible) {
      setPicoSpeechBubbleHighlighted(false);
      return;
    }
    
    const checkPicoProximity = () => {
      // Only check horizontal distance since this is a side-view 2D game
      // (Characters are bottom-aligned but at different y positions)
      const horizontalDistance = Math.abs(kapoorPosition.x - PICO_POSITION.x);
      
      const isNear = horizontalDistance < PICO_PROXIMITY_THRESHOLD;
      
      // Debug logging to verify proximity detection
      if (isNear !== picoSpeechBubbleHighlighted) {
        console.log(`[Pico] Horizontal distance: ${horizontalDistance.toFixed(0)}px, Threshold: ${PICO_PROXIMITY_THRESHOLD}px, Highlighting: ${isNear}`);
      }
      
      setPicoSpeechBubbleHighlighted(isNear);
    };
    
    checkPicoProximity();
  }, [kapoorPosition, picoSpeechBubbleVisible, picoSpeechBubbleHighlighted]);
  
  // === SPEECH BUBBLE ANIMATION ===
  useEffect(() => {
    if (!picoSpeechBubbleVisible) return;
    
    const BUBBLE_FRAME_SPEED = 150; // ms per frame
    let bubbleFrameCount = 1;
    
    const animateBubble = () => {
      bubbleFrameCount = (bubbleFrameCount % 4) + 1; // Cycle 1-4
      setPicoSpeechBubbleFrame(bubbleFrameCount);
    };
    
    const bubbleInterval = setInterval(animateBubble, BUBBLE_FRAME_SPEED);
    
    return () => clearInterval(bubbleInterval);
  }, [picoSpeechBubbleVisible]);
  
  // Simplified tutorial state (no complex guided tour)
  const shownSpotlightsRef = useRef(new Set<string>());

  // Simplified telescope click handler
  const handleTelescopeClickWithTutorial = () => {
    console.log(`[CombinedHomeScene] 🔭 Telescope clicked! currentView=${currentView}`);
    handleTelescopeClick();
  };

  // Simplified bed click handler
  const handleBedClickWithTutorial = () => {
    handleBedClick();
  };

  // Tutorial star interaction handlers
  const handleStarClick = () => {
    console.log('[CombinedHomeScene] ⭐ Star clicked! Opening star detail modal');
    
    // Don't allow clicks during reveal animation
    if (isRevealAnimating) {
      console.log('[CombinedHomeScene] ⭐ Star is animating - click ignored');
      return;
    }
    
    // Mark star as clicked (removes exclamation mark)
    setStarNeverClicked(false);
    
    // Simply open the star detail modal - all unlock logic handled by modal button
    setShowStarDetail(true);
  };

  // Star hover handlers removed - X key only interaction (no mouse events)

  // Ensure body/html overflow is hidden and set background color
  useEffect(() => {
    // Force body and html to have overflow hidden (fixes scrollbar issue)
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    
    // Set background to match title screen
    document.body.style.backgroundColor = '#000';
    
    console.log('[CombinedHomeScene] Body/HTML overflow forced to hidden, background set to black');
    
    return () => {
      // Keep it hidden even on unmount
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    };
  }, []);
  
  return (
    <>
      <JumboViewport>
        {/* The isolated parallax renderer sits here, behind the scrolling content */}
        <ParallaxRenderer 
          scrollPosition={scrollPosition} 
          transitionDuration={transitionDuration}
          telescopeFrame={telescopeFrame}
        />

        {/* Celestial bodies layer - stars, planets, moons (renders below clouds) */}
        {/* Elevate entire layer when tutorial star or planet is highlighted - breaks through clouds/abyss */}
        <CelestialLayer 
          $scrollPosition={scrollPosition} 
          $transitionDuration={transitionDuration}
          $elevated={skyHighlight === 'star' || skyHighlight.startsWith('planet_') || skyHighlight === 'tbi' || skyHighlight.startsWith('tbi_')}
        >
          {/* Telescope speech bubble - shown in home view */}
          <SpeechBubbleSprite
            $frame={telescopeSpeechBubbleFrame}
            $visible={telescopeSpeechBubbleVisible}
            $highlighted={telescopeSpeechBubbleHighlighted}
            style={{
              left: `${TELESCOPE_POSITION.x - 16}px`, // Moved 15px left from original -1px position
              top: `${TELESCOPE_POSITION.y - 20}px`,  // Hover above telescope
            }}
          />
          
          {/* Desk speech bubble - shown in home view after viewing star */}
          <SpeechBubbleSprite
            $frame={deskSpeechBubbleFrame}
            $visible={deskSpeechBubbleVisible}
            $highlighted={deskSpeechBubbleHighlighted}
            style={{
              left: `${DESK_POSITION.x - 1}px`, // Center above desk
              top: `${DESK_POSITION.y - 20}px`,  // Hover above desk
            }}
          />
          
          {/* Star sprite - visible until final constellation replaces it */}
          {!showFinalConstellation && (
            <>
              <StarSprite
                $frame={tutorialStarFrame}
                style={{ 
                  left: `${PRIMAREUS_POSITION.x}px`, 
                  top: `${PRIMAREUS_POSITION.y}px`,
                  opacity: isPlayingCutscene ? cutsceneStarOpacity : 1, // Apply oscillating opacity during cutscene
                }}
              />
              
              {/* Speech bubble above star - shown in sky view */}
              <SpeechBubbleSprite
                $frame={starSpeechBubbleFrame}
                $visible={starSpeechBubbleVisible}
                $highlighted={starSpeechBubbleHighlighted}
                style={{
                  left: `${PRIMAREUS_POSITION.x - 1}px`, // Center above star (14px star - 16px bubble, offset 1px left)
                  top: `${PRIMAREUS_POSITION.y - 20}px`,  // Hover above star
                }}
              />
            </>
          )}

          {/* Final constellation - TBI planet at center with orbiting moons */}
          {showFinalConstellation && constellationStars.map((star) => {
            // Determine if this celestial body should be highlighted (not during cutscene)
            // MOONS cannot be highlighted in sky view (only planets) - checked via parentId
            const canHighlight = !star.parentId; // Only bodies without parentId (planets) can be highlighted
            const isHighlighted = !isPlayingCutscene && canHighlight && skyHighlight === star.id;
            // Frame highlighting logic:
            // - TBI constellation (frames 0-2, NOW using planetary-sheet.png): highlighted versions are +24 frames higher (section 1)
            // - Planetary systems (frames 0-23, using planetary-sheet.png): highlighted versions are +24 frames higher (section 1)
            // Determine which system by checking star ID (planet_* or tbi* = planetary system)
            const isPlanetarySystem = star.id.startsWith('planet_') || star.id.startsWith('moon_') || star.id.startsWith('tbi');
            const displayFrame = isHighlighted 
              ? (isPlanetarySystem ? star.frame + 24 : star.frame)
              : star.frame;
            
            // Orbital animation scale (no base scale difference between planet and moons)
            const finalScale = star.scale ?? 1.0;
            
            return (
              <React.Fragment key={star.id}>
                {/* Layer 1: Blurry base sprite (Section 0 or Section 1 if highlighted) */}
                <StarSprite
                  $frame={displayFrame}
                  $isPlanetarySystem={isPlanetarySystem}
                  style={{
                    left: `${star.x}px`,
                    top: `${star.y}px`,
                    transform: `translate(-50%, -50%) scale(${finalScale})`,
                    opacity: star.opacity ?? 1,
                    zIndex: star.zIndex ?? 3, // Apply dynamic z-index (elevated when highlighted)
                    transition: 'transform 0.016s linear, opacity 0.016s linear', // Smooth interpolation
                  }}
                />
                {/* Layer 2: Non-blurry crisp overlay (Section 2: frames +48) */}
                <StarSprite
                  $frame={star.frame + 48} // Section 2 is always +48 from base frame (no highlighting offset)
                  $isPlanetarySystem={isPlanetarySystem}
                  style={{
                    left: `${star.x}px`,
                    top: `${star.y}px`,
                    transform: `translate(-50%, -50%) scale(${finalScale})`,
                    opacity: star.opacity ?? 1,
                    zIndex: (star.zIndex ?? 3) + 1, // Render above blurry layer
                    transition: 'transform 0.016s linear, opacity 0.016s linear', // Smooth interpolation
                    pointerEvents: 'none', // Pass through to base layer
                  }}
                />
                {/* Show name label next to highlighted star */}
                {isHighlighted && (
                  <StarNameLabel
                    style={{
                      left: `${star.x + 18}px`, // Position to the right of the star
                      top: `${star.y - 7}px`, // Slightly above center
                      zIndex: (star.zIndex ?? 3) + 2, // Name label renders above both sprite layers
                    }}
                  >
                    {starNames[star.id as StarIdType]}
                  </StarNameLabel>
                )}
              </React.Fragment>
            );
          })}
        </CelestialLayer>

        {/* The scrolling content contains the foreground and all interactive elements */}
        <ScrollingContent $scrollPosition={scrollPosition} $transitionDuration={transitionDuration}>
          <ForegroundLayer />
          
          {/* Kapoor animated character - stays visible during scroll transition */}
          <CharacterSprite
                $frame={kapoorFrame}
                $direction={kapoorDirection}
                $isWalking={kapoorIsWalking}
                $isClimbing={kapoorIsClimbing}
                style={{
                  left: `${kapoorPosition.x}px`,
                  // Position relative to ScrollingContent - moves with the home scene during scroll
                  top: `${kapoorPosition.y}px`,
                }}
              />
              
              {/* Pico the cat - idle animation, switches to talking when interacted */}
              <PicoSprite
                $frame={picoFrame}
                $isTalking={picoIsTalking}
                style={{
                  left: `${PICO_POSITION.x}px`,
                  top: `${PICO_POSITION.y}px`,
                }}
              />
              
              {/* Speech bubble above Pico - always visible until interaction, highlights when Kapoor is near */}
              <SpeechBubbleSprite
                $frame={picoSpeechBubbleFrame}
                $visible={picoSpeechBubbleVisible}
                $highlighted={picoSpeechBubbleHighlighted}
                style={{
                  left: `${PICO_POSITION.x + 6}px`, // Center above Pico (28px cat - 16px bubble = 12px / 2 = 6px)
                  top: `${PICO_POSITION.y - 20}px`,  // Hover above Pico's head
                }}
              />
              
              {/* Pico Dialogue Text - Follows the speaking character */}
              <PicoDialogueText 
                $visible={showPicoDialogue}
                style={{
                  // Position text box near the current speaker
                  left: picoDialogueLines[picoDialogueIndex].speaker === 'Pico' 
                    ? `${PICO_POSITION.x + 10}px`  // 10px to the right of Pico
                    : `${kapoorPosition.x - 90}px`, // 90px to the left of Kapoor (160px width - 70px center offset)
                  top: picoDialogueLines[picoDialogueIndex].speaker === 'Pico'
                    ? `${PICO_POSITION.y - 80}px`  // Above Pico's head
                    : `${kapoorPosition.y - 65}px`, // Above Kapoor's head (nudged down from -80)
                }}
              >
                <PicoSpeakerLabel>
                  {picoDialogueLines[picoDialogueIndex].speaker}
                </PicoSpeakerLabel>
                <div>{picoDialogueLines[picoDialogueIndex].text}</div>
                <PicoContinueHint>
                  {picoDialogueIndex < picoDialogueLines.length - 1 ? '(X to continue)' : '(X to close)'}
                </PicoContinueHint>
              </PicoDialogueText>
              
              {/* Pico Blocking Dialogue - When player tries to climb without talking first */}
              <PicoDialogueText 
                $visible={showPicoBlockingDialogue}
                style={{
                  // Always positioned near Pico since blocking dialogue is always from Pico
                  left: `${PICO_POSITION.x + 10}px`,  // 10px to the right of Pico
                  top: `${PICO_POSITION.y - 100}px`,  // Above Pico's head (nudged up from -80)
                }}
              >
                <PicoSpeakerLabel>
                  {picoBlockingDialogue[picoBlockingDialogueIndex].speaker}
                </PicoSpeakerLabel>
                <div>{picoBlockingDialogue[picoBlockingDialogueIndex].text}</div>
                <PicoContinueHint>
                  {picoBlockingDialogueIndex < picoBlockingDialogue.length - 1 ? '(X to continue)' : '(X to close)'}
                </PicoContinueHint>
              </PicoDialogueText>
              
              {/* Arrow keys tutorial - hover over Kapoor for first 20 seconds */}
              <ArrowKeysSprite
                $frame={arrowKeysFrame}
                $visible={arrowKeysVisible}
                style={{
                  left: `${kapoorPosition.x - 4}px`, // Center above Kapoor (38px char - 45px sprite = -7px, +3px adjustment)
                  top: `${kapoorPosition.y - 45}px`,  // Hover above Kapoor's head
                }}
              />
              
              {/* Player-following X key - shows when near interactive objects with contextual labels */}
              <XKeySprite
                $frame={interactionFrame}
                $visible={activeInteraction !== null && currentView === 'home' && !showPicoDialogue && !showPicoBlockingDialogue && !compSheetVisible}
                style={{
                  left: `${kapoorPosition.x + 36}px`, // Upper right of Kapoor
                  top: `${kapoorPosition.y - 5}px`,
                }}
              />
              
              {/* Contextual label for X key - shows what action will be performed */}
              <ContextLabel
                $visible={activeInteraction !== null && currentView === 'home' && !showPicoDialogue && !compSheetVisible}
                style={{
                  left: `${kapoorPosition.x + 55}px`, // Right of X key sprite (30px offset + 15px sprite + 2px gap)
                  top: `${kapoorPosition.y - 5}px`, // Aligned with key sprite
                }}
              >
                {contextLabel}
              </ContextLabel>
              
              {/* C key for petting Pico - shows when in actual interaction range, stacked below X key if both visible */}
              {(() => {
                const picoHorizontalOffset = kapoorPosition.x - PICO_POSITION.x;
                const picoDistance = Math.abs(picoHorizontalOffset);
                const INTERACTION_RANGE = PROXIMITY_THRESHOLD / 2; // Same range as X key interactions
                
                // Pico has extended interaction range to the left
                const picoInteractionRange = picoHorizontalOffset < 0 
                  ? INTERACTION_RANGE + PICO_LEFT_EXTENSION // Left of Pico - extended range
                  : INTERACTION_RANGE; // Right of Pico - normal range
                
                const isNearPico = picoDistance < picoInteractionRange;
                const showCKey = isNearPico && currentView === 'home' && !showPicoDialogue && !showPicoBlockingDialogue && !compSheetVisible;
                const yOffset = (activeInteraction === 'pico' && !picoInteracted) ? 18 : 0; // Stack below X key if Talk is showing
                
                return (
                  <>
                    <CKeySprite
                      $frame={cKeyFrame}
                      $visible={showCKey}
                      style={{
                        left: `${kapoorPosition.x + 36}px`, // Same x position as X key
                        top: `${kapoorPosition.y - 5 + yOffset}px`, // Stack below X key if both showing
                      }}
                    />
                    <ContextLabel
                      $visible={showCKey}
                      style={{
                        left: `${kapoorPosition.x + 55}px`, // Right of C key sprite (30px offset + 15px sprite + 2px gap)
                        top: `${kapoorPosition.y - 5 + yOffset}px`, // Aligned with key sprite
                      }}
                    >
                      Pet
                    </ContextLabel>
                  </>
                );
              })()}
              
              {/* Pet description textbox - appears after petting Pico */}
              <PetDescriptionBox
                $visible={showPetDescription}
                style={{
                  left: `${PICO_POSITION.x + 35}px`, // To the right of Pico
                  top: `${PICO_POSITION.y - 60}px`, // Above Pico
                }}
              >
                Pico though tough on the outside is a softie for a nice head pat
              </PetDescriptionBox>
              
              {/* Up arrow - shows when near ladder at ground floor */}
              <UpArrowSprite
                $frame={upArrowFrame}
                $visible={showUpArrow && !showPicoDialogue && !compSheetVisible}
                style={{
                  left: `${kapoorPosition.x + 36}px`, // Same x position as X key
                  top: `${kapoorPosition.y - 5}px`,
                }}
              />
              <ContextLabel
                $visible={showUpArrow && !showPicoDialogue && !compSheetVisible}
                style={{
                  left: `${kapoorPosition.x + 55}px`,
                  top: `${kapoorPosition.y - 5}px`,
                }}
              >
                Climb
              </ContextLabel>
              
              {/* Down arrow - shows when near ladder at second floor */}
              <DownArrowSprite
                $frame={downArrowFrame}
                $visible={showDownArrow && !showPicoDialogue && !compSheetVisible}
                style={{
                  left: `${kapoorPosition.x + 36}px`, // Same x position as X key
                  top: `${kapoorPosition.y - 5}px`,
                }}
              />
              <ContextLabel
                $visible={showDownArrow && !showPicoDialogue && !compSheetVisible}
                style={{
                  left: `${kapoorPosition.x + 55}px`,
                  top: `${kapoorPosition.y - 5}px`,
                }}
              >
                Descend
              </ContextLabel>
              
              {/* Visual boundary debugging */}
              {DEBUG_BOUNDARIES && (
                <>
                  {/* First floor boundaries */}
                  <BoundaryLine $color="#00FF00" style={{ left: `${FIRST_FLOOR_BOUNDS.left}px` }} />
                  <BoundaryLabel $color="#00FF00" style={{ 
                    left: `${FIRST_FLOOR_BOUNDS.left + 5}px`, 
                    top: `${430}px` 
                  }}>
                    1F Left: {FIRST_FLOOR_BOUNDS.left}
                  </BoundaryLabel>
                  
                  <BoundaryLine $color="#00FF00" style={{ left: `${FIRST_FLOOR_BOUNDS.right}px` }} />
                  <BoundaryLabel $color="#00FF00" style={{ 
                    left: `${FIRST_FLOOR_BOUNDS.right - 80}px`, 
                    top: `${430}px` 
                  }}>
                    1F Right: {FIRST_FLOOR_BOUNDS.right}
                  </BoundaryLabel>
                  
                  {/* Second floor boundaries */}
                  <BoundaryLine $color="#FF6B00" style={{ left: `${SECOND_FLOOR_BOUNDS.left}px` }} />
                  <BoundaryLabel $color="#FF6B00" style={{ 
                    left: `${SECOND_FLOOR_BOUNDS.left + 5}px`, 
                    top: `${270}px` 
                  }}>
                    2F Left: {SECOND_FLOOR_BOUNDS.left}
                  </BoundaryLabel>
                  
                  <BoundaryLine $color="#FF6B00" style={{ left: `${SECOND_FLOOR_BOUNDS.right}px` }} />
                  <BoundaryLabel $color="#FF6B00" style={{ 
                    left: `${SECOND_FLOOR_BOUNDS.right - 80}px`, 
                    top: `${270}px` 
                  }}>
                    2F Right: {SECOND_FLOOR_BOUNDS.right}
                  </BoundaryLabel>
                  
                  {/* Floor level indicators */}
                  <BoundaryFloorIndicator 
                    $color="#00FF00" 
                    style={{ top: `${467}px` }} 
                    data-label="Ground Floor (y=467)"
                  />
                  <BoundaryFloorIndicator 
                    $color="#FF6B00" 
                    style={{ top: `${307}px` }} 
                    data-label="Second Floor (y=307)"
                  />
                  
                  {/* Current position indicator */}
                  <BoundaryLabel 
                    $color="#FFFF00" 
                    style={{ 
                      left: `${kapoorPosition.x}px`, 
                      top: `${kapoorPosition.y - 15}px`,
                      fontSize: '8px'
                    }}
                  >
                    ({kapoorPosition.x.toFixed(0)}, {kapoorPosition.y.toFixed(0)})
                  </BoundaryLabel>
                </>
              )}
          
          {/* === HOME VIEW CLICKABLE AREAS === */}
          {currentView === 'home' && (
            <>
              {/* Upper band - Sky view navigation */}
              <ClickableArea
                data-testid="home-upper-band"
                $isHovered={upperBandHovered}
                $debugColor="rgba(0, 255, 0, 0.3)"
                style={{ left: '0px', top: '220px', width: '640px', height: '180px' }}
                onClick={handleTelescopeClickWithTutorial}
                onMouseEnter={() => setUpperBandHovered(true)}
                onMouseLeave={() => setUpperBandHovered(false)}
              />
              {DEBUG_CLICKBOXES && <DebugLabel style={{ top: '220px', left: '2px' }}>UPPER: Sky View</DebugLabel>}

              {/* Bed area */}
              <ClickableArea
                data-testid="home-bed-area"
                $isHovered={false}
                style={{ left: '460px', top: '525px', width: '160px', height: '54px' }}
                onClick={handleBedClickWithTutorial}
              />
              
              {/* Exclamation mark on bed when player has equipped cards (ready to advance) */}
              <ExclamationIndicator 
                $size="large" 
                $visible={!hasUnequippedCards && getEquippedCards().length > 0}
                style={{
                  left: '615px', // Right edge of bed area
                  top: '520px'   // Slightly above bed area
                }}
              />

              {/* Desk area - X key interaction only (no click handler) */}
              <ClickableArea
                data-testid="home-desk-area"
                $isHovered={false}
                style={{ left: '5px', top: '510px', width: '120px', height: '72px' }}
              />
              
              {/* Exclamation mark on desk when cards need equipping */}
              <ExclamationIndicator 
                $size="large" 
                $visible={hasUnequippedCards}
                style={{
                  left: '120px', // Right edge of desk area
                  top: '505px'    // Slightly above desk area
                }}
              />
              {/* Debug info */}
              {DEBUG_CLICKBOXES && (
                <>
                  <div style={{
                    position: 'absolute',
                    left: '125px',
                    top: '490px',
                    color: 'white',
                    fontSize: '8px',
                    background: 'rgba(0,0,0,0.8)',
                    padding: '2px'
                  }}>
                    Desk: {hasUnequippedCards ? 'SHOW' : 'HIDE'}
                  </div>
                  <div style={{
                    position: 'absolute',
                    left: '620px',
                    top: '505px',
                    color: 'white',
                    fontSize: '8px',
                    background: 'rgba(0,0,0,0.8)',
                    padding: '2px'
                  }}>
                    Bed: {(!hasUnequippedCards && getEquippedCards().length > 0) ? 'SHOW' : 'HIDE'}
                  </div>
                </>
              )}
            </>
          )}

          {/* === SKY VIEW CLICKABLE AREAS === */}
          {currentView === 'sky' && (
            <>
              {/* Full height band - Return to home view */}
              <ClickableArea
                data-testid="sky-return-band"
                $isHovered={skyBandHovered}
                $debugColor="rgba(255, 255, 0, 0.3)"
                style={{ left: '0px', top: '260px', width: '640px', height: '100px' }}
                onClick={handleLadderClick}
                onMouseEnter={() => setSkyBandHovered(true)}
                onMouseLeave={() => setSkyBandHovered(false)}
              />
              {DEBUG_CLICKBOXES && <DebugLabel style={{ top: '260px', left: '2px' }}>FULL: Return Home</DebugLabel>}
            </>
          )}

          {/* Celestial bodies moved to CelestialLayer (separate container below clouds) */}

          {/* Removed antiquated tooltip system - was obstructing interface */}
        </ScrollingContent>
        
        {/* Star Notification - positioned within canvas coordinates */}
        {starNotification && (
          <StarNotificationWrapper 
            $visible={starNotification.visible} 
            $type={starNotification.type}
          >
            <ToastContainer domain="dosimetry" size="xs">
              <CanvasTypographyOverride>
                <NotificationContent>
                  <StarIcon $type={starNotification.type} />
                  {starNotification.message}
                </NotificationContent>
              </CanvasTypographyOverride>
            </ToastContainer>
          </StarNotificationWrapper>
        )}
        
        {/* Star Detail Modal - Rendered within the 640×360 coordinate system */}
        {showStarDetail && (() => {
          // Only show modal for supported star types (not planets)
          const validStarIds = ['star', 'tbi', 'tbi_dosimetry', 'tbi_prescriptions', 'tbi_commissioning'];
          if (!validStarIds.includes(activeStarId)) return null;
          
          // Calculate the current frame for the active celestial body
          // TBI constellation now uses planetary-sheet.png: planet uses frame 2, moons use frame 0 (small moon)
          const currentStarFrame = activeStarId === 'star' ? tutorialStarFrame :
                                   activeStarId === 'tbi' ? 2 : 0;
          
          return (
            <StarDetailModal 
              starId={activeStarId as 'star' | 'tbi' | 'tbi_dosimetry' | 'tbi_prescriptions' | 'tbi_commissioning'}
              onClose={handleCloseStarDetail}
              starFrame={currentStarFrame}
              isUnlocked={starUnlocked}
              onStarUnlock={handleStarUnlock}
              onCardUnlock={handleCardUnlock}
              onStarViewed={handleStarViewed}
            />
          );
        })()}

        {/* Backdrop overlay - darkens and blurs when comp-sheet is visible */}
        <CompSheetBackdrop $visible={compSheetVisible} />

        {/* Comp-sheet composite layer system - appears when desk interaction starts */}
        {compSheetVisible && (
          <>
            {/* Layer 1a: Monitor frame with black fill (base layer) */}
            <CompMonitorLayer
              $visible={compSheetVisible}
              style={{
                left: '170px', // Center horizontally (640 - 300 = 340, 340/2 = 170)
                top: '90px', // Center vertically (360 - 180 = 180, 180/2 = 90)
              }}
            />
            
            {/* Layer 1b: Screen color overlay (blue for menu, dark for activity/intro/result) */}
            {/* Hidden during booting and fading_to_black phases to show black monitor underneath */}
            <CompScreenLayer
              $visible={compSheetPhase !== 'booting' && compSheetPhase !== 'fading_to_black' && compSheetPhase !== 'intro_fading_to_black' && compSheetPhase !== 'result_fading_to_black'}
              $variant={compSheetPhase === 'intro' || compSheetPhase === 'fading_from_black' || compSheetPhase === 'activity' || compSheetPhase === 'result_fading_from_black' || compSheetPhase === 'result' ? 'dark' : 'blue'}
              style={{
                left: '170px',
                top: '90px',
              }}
            />
            
            {/* Layer 2: Activity base (visible during boot fade-in and waiting) */}
            <CompActivityLayer
              $visible={compSheetPhase === 'booting_fade_in' || compSheetPhase === 'waiting'}
              style={{
                left: '170px',
                top: '90px',
              }}
            />
            
            {/* Layer 3: Activity options highlights (visible during boot fade-in, waiting, and transitioning) */}
            <CompOptionsLayer
              $frame={compOptionsFrame}
              $visible={compSheetPhase === 'booting_fade_in' || compSheetPhase === 'waiting' || compSheetPhase === 'transitioning'}
              style={{
                left: '170px',
                top: '90px',
              }}
            />
            
            {/* Layer 4: Activity option 1 animation (visible during boot fade-in and waiting) */}
            <CompOption1Layer
              $frame={compOption1Frame}
              $visible={compSheetPhase === 'booting_fade_in' || compSheetPhase === 'waiting'}
              style={{
                left: '170px',
                top: '90px',
              }}
            />
            
            {/* Activity click regions - only visible during waiting phase */}
            {/* Positions scaled from 600×360 to 300×180, offset by comp position (170, 90) */}
            {compSheetPhase === 'waiting' && (
              <>
                {/* Top-left activity (0) */}
                <ActivityClickRegion
                  $active={highlightedActivity === 0 || hoveredActivity === 0}
                  onMouseEnter={() => setHoveredActivity(0)}
                  onMouseLeave={() => setHoveredActivity(null)}
                  onClick={() => handleActivitySelect(0)}
                  style={{
                    left: '185px',
                    top: '115px',
                    width: '60px',
                    height: '50px',
                  }}
                />
                
                {/* Top-right activity (1) */}
                <ActivityClickRegion
                  $active={highlightedActivity === 1 || hoveredActivity === 1}
                  onMouseEnter={() => setHoveredActivity(1)}
                  onMouseLeave={() => setHoveredActivity(null)}
                  onClick={() => handleActivitySelect(1)}
                  style={{
                    left: '385px',
                    top: '115px',
                    width: '60px',
                    height: '50px',
                  }}
                />
                
                {/* Bottom-left activity (2) */}
                <ActivityClickRegion
                  $active={highlightedActivity === 2 || hoveredActivity === 2}
                  onMouseEnter={() => setHoveredActivity(2)}
                  onMouseLeave={() => setHoveredActivity(null)}
                  onClick={() => handleActivitySelect(2)}
                  style={{
                    left: '185px',
                    top: '195px',
                    width: '60px',
                    height: '50px',
                  }}
                />
                
                {/* Bottom-middle activity (3) */}
                <ActivityClickRegion
                  $active={highlightedActivity === 3 || hoveredActivity === 3}
                  onMouseEnter={() => setHoveredActivity(3)}
                  onMouseLeave={() => setHoveredActivity(null)}
                  onClick={() => handleActivitySelect(3)}
                  style={{
                    left: '280px',
                    top: '195px',
                    width: '60px',
                    height: '50px',
                  }}
                />
                
                {/* Bottom-right activity (4) */}
                <ActivityClickRegion
                  $active={highlightedActivity === 4 || hoveredActivity === 4}
                  onMouseEnter={() => setHoveredActivity(4)}
                  onMouseLeave={() => setHoveredActivity(null)}
                  onClick={() => handleActivitySelect(4)}
                  style={{
                    left: '385px',
                    top: '195px',
                    width: '60px',
                    height: '50px',
                  }}
                />
              </>
            )}
            
            {/* Anthro intro dialogue - 4 frame sequence advanced with X key */}
            <AnthroIntroLayer
              $frame={anthroIntroFrame}
              $visible={showAnthroIntro}
              style={{
                left: '170px', // Same position as comp layers
                top: '90px',
              }}
            />
            
            {/* TBI Positioning viewer - sprite sheet navigation with arrow keys */}
            <TbiPositioningLayer
              $frame={tbiPositioningFrame}
              $visible={showTbiPositioning}
              style={{
                left: '170px', // Same position as comp layers
                top: '90px',
              }}
            />
            
            {/* TBI Result - animated result screen after positioning complete */}
            <TbiResultLayer
              $frame={tbiResultFrame}
              $visible={showTbiResult}
              style={{
                left: '170px', // Same position as comp layers
                top: '90px',
              }}
            />
          </>
        )}
        
        {/* Sky view interaction indicator - fixed at bottom center, shows X (Inspect) and C (Return) keys */}
        <SkyInteractionIndicator $visible={currentView === 'sky' && !showStarDetail && !isPlayingCutscene && !showMonologue}>
          <SkyKeyRow>
            <SkyXKeySprite $frame={skyXKeyFrame} />
            <SkyActionLabel>Inspect</SkyActionLabel>
          </SkyKeyRow>
          <SkyKeyRow>
            <SkyCKeySprite $frame={skyCKeyFrame} />
            <SkyActionLabel>Return</SkyActionLabel>
          </SkyKeyRow>
        </SkyInteractionIndicator>
        
        {/* Desk activity interaction indicator - fixed at bottom center during desk activities */}
        <DeskInteractionIndicator $visible={compSheetVisible}>
          <DeskKeyRow>
            <DeskXKeySprite $frame={deskXKeyFrame} />
            <DeskActionLabel>Select</DeskActionLabel>
          </DeskKeyRow>
          <DeskKeyRow>
            <DeskCKeySprite $frame={deskCKeyFrame} />
            <DeskActionLabel>Close</DeskActionLabel>
          </DeskKeyRow>
        </DeskInteractionIndicator>
        
        {/* Kapoor monologue - appears after closing ??? star modal (positioned relative to Kapoor like Pico dialogue) */}
        {(() => {
          const isLastLine = currentMonologueLineIndex >= monologueLines.length - 1;
          
          return (
            <KapoorMonologue
              $visible={showMonologue && currentView === 'sky'}
              style={{
                left: `${kapoorPosition.x - 70}px`, // Positioned relative to Kapoor (140px width / 2 = 70px center offset)
                top: `${kapoorPosition.y - 120}px`, // Higher up in sky view for better visibility
              }}
            >
              <KapoorSpeakerLabel>Kapoor</KapoorSpeakerLabel>
              <div>{monologueLines[currentMonologueLineIndex]}</div>
              <KapoorContinueHint>
                {isLastLine ? '(X to close)' : '(X to continue)'}
              </KapoorContinueHint>
            </KapoorMonologue>
          );
        })()}
        
      </JumboViewport>

      {/* Boom effect overlay (full-screen flash + pulse during cutscene) */}
      <BoomEffectOverlay $visible={showBoomEffect} />

      {/* Cinematic letterbox bars - slide in AFTER scroll completes, during cutscene only */}
      <CinematicLetterbox $visible={isPlayingCutscene} $position="top" />
      <CinematicLetterbox $visible={isPlayingCutscene} $position="bottom" />

    </>
  );
}