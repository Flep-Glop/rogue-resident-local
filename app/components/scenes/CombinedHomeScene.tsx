'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import styled, { css, keyframes } from 'styled-components';
import { useSceneStore } from '@/app/store/sceneStore';
import { useGameStore } from '@/app/store/gameStore';
import { useAbilityStore } from '@/app/store/abilityStore';
import { useTutorialStore } from '@/app/store/tutorialStore';
import { useTutorialOverlays } from '@/app/components/tutorial/TutorialOverlay';

import AbilityCardInterface from './AbilityCardInterface';
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

// Large text override for welcome panel (bypasses the xs font forcing)
const WelcomeTypographyOverride = styled.div`
  line-height: 1.4 !important;
  
  /* Allow explicit font sizes to work */
  * {
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

// 9-slice welcome panel wrapper positioned in canvas coordinates
const WelcomePanelWrapper = styled.div<{ $visible: boolean }>`
  position: absolute;
  top: 48px;
  left: 50%;
  transform: translateX(-50%);
  width: 380px;  /* Narrower width for natural wrapping */
  z-index: 1600;
  pointer-events: ${props => props.$visible ? 'all' : 'none'}; /* Don't block clicks when hidden */

  opacity: ${props => props.$visible ? 1 : 0};
  transform: ${props => props.$visible ? 'translateX(-50%) translateY(0)' : 'translateX(-50%) translateY(-10px)'};
  transition: opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1), 
              transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
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

// Container for celestial bodies (stars/planets/moons) - renders below clouds but above background
// When tutorial star or planet is highlighted, elevates above clouds/abyss for dramatic effect
const CelestialLayer = styled.div<{ $scrollPosition: number; $transitionDuration: number; $elevated?: boolean }>`
  position: absolute;
  top: 0;
  left: 0;
  width: ${HOME_INTERNAL_WIDTH}px;
  height: ${JUMBO_ASSET_HEIGHT}px;
  transform: translateY(${props => props.$scrollPosition}px);
  transition: transform ${props => props.$transitionDuration}s cubic-bezier(0.4, 0, 0.2, 1);
  image-rendering: pixelated;
  z-index: ${props => props.$elevated ? 15 : 6}; /* Elevated (15) above abyss/purple-abyss (12-13) when highlighted, normal (6) otherwise */
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
  z-index: 50; /* Below UI elements but above background */
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
  transition: opacity 0.3s ease, transform 0.3s ease;
`;

// === COMP-SHEET COMPOSITE LAYER SYSTEM ===
// Layer 1: Window frame (static single frame) - always visible when comp-sheet is shown
const CompWindowLayer = styled.div<{ $visible: boolean }>`
  position: absolute;
  width: 600px;
  height: 360px;
  background-image: url('/images/home/comp-window.png');
  background-size: 600px 360px;
  background-repeat: no-repeat;
  image-rendering: pixelated;
  z-index: 300;
  pointer-events: ${props => props.$visible ? 'all' : 'none'};
  
  opacity: ${props => props.$visible ? 1 : 0};
  transform: ${props => props.$visible ? 'scale(1)' : 'scale(0.95)'};
  transition: opacity 0.3s ease, transform 0.3s ease;
`;

// Layer 2: Activity base (static single frame) - visible until activity selected
const CompActivityLayer = styled.div<{ $visible: boolean }>`
  position: absolute;
  width: 600px;
  height: 360px;
  background-image: url('/images/home/comp-activity.png');
  background-size: 600px 360px;
  background-repeat: no-repeat;
  image-rendering: pixelated;
  z-index: 301;
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
  width: 600px;
  height: 360px;
  background-image: url('/images/home/comp-activity-options-sheet.png');
  background-size: ${600 * 7}px 360px; /* 7 frames × 600px = 4200px width */
  background-position: ${props => (props.$frame - 1) * -600}px 0px;
  background-repeat: no-repeat;
  image-rendering: pixelated;
  z-index: 302;
  pointer-events: none;
  
  opacity: ${props => props.$visible ? 1 : 0};
  transition: opacity 0.3s ease;
`;

// Layer 4: Activity option 1 animation (5 frames - autonomous loop) - visible until activity selected
const CompOption1Layer = styled.div<{ $frame: number; $visible: boolean }>`
  position: absolute;
  width: 600px;
  height: 360px;
  background-image: url('/images/home/comp-activity-option1-sheet.png');
  background-size: ${600 * 5}px 360px; /* 5 frames × 600px = 3000px width */
  background-position: ${props => (props.$frame - 1) * -600}px 0px;
  background-repeat: no-repeat;
  image-rendering: pixelated;
  z-index: 303;
  pointer-events: none;
  
  opacity: ${props => props.$visible ? 1 : 0};
  transition: opacity 0.3s ease;
`;

// Activity click region - invisible overlay for mouse interaction
const ActivityClickRegion = styled.div<{ $active: boolean }>`
  position: absolute;
  z-index: 304; /* Above all comp-sheet layers */
  cursor: pointer;
  pointer-events: all;
  
  /* Debug visualization (optional) */
  ${DEBUG_CLICKBOXES && `
    background: rgba(255, 0, 0, 0.2);
    border: 2px solid rgba(255, 0, 0, 0.5);
  `}
`;

// Pixel art transition keyframes - swap these in QuizOverlay animation property to test different effects
const scanlineWipe = keyframes`
  from {
    clip-path: inset(0 0 100% 0);
  }
  to {
    clip-path: inset(0 0 0 0);
  }
`;

const pixelMaterialize = keyframes`
  0% {
    opacity: 0;
    filter: blur(8px);
    transform: scale(0.95);
  }
  50% {
    filter: blur(4px);
  }
  100% {
    opacity: 1;
    filter: blur(0);
    transform: scale(1);
  }
`;

const slideFromBottom = keyframes`
  from {
    transform: translateY(40px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
`;

const popIn = keyframes`
  0% {
    transform: scale(0.8);
    opacity: 0;
  }
  60% {
    transform: scale(1.05);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
`;

const glitchIn = keyframes`
  0% {
    opacity: 0;
    transform: translateX(-10px);
  }
  20% {
    opacity: 0.5;
    transform: translateX(8px);
  }
  40% {
    opacity: 0.8;
    transform: translateX(-4px);
  }
  60% {
    opacity: 0.9;
    transform: translateX(2px);
  }
  100% {
    opacity: 1;
    transform: translateX(0);
  }
`;

const typeIn = keyframes`
  from {
    clip-path: inset(0 100% 0 0);
  }
  to {
    clip-path: inset(0 0 0 0);
  }
`;

// Create noise pattern for pixel-by-pixel dissolve effect
const createNoisePattern = (density: number, seed: number) => {
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 360;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  
  const imageData = ctx.createImageData(640, 360);
  const data = imageData.data;
  
  // Seeded random for consistent pattern
  let random = seed;
  const seededRandom = () => {
    random = (random * 9301 + 49297) % 233280;
    return random / 233280;
  };
  
  for (let i = 0; i < data.length; i += 4) {
    const value = seededRandom() < density ? 255 : 0;
    data[i] = 255;     // R
    data[i + 1] = 255; // G
    data[i + 2] = 255; // B
    data[i + 3] = value; // Alpha (visible or transparent)
  }
  
  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL();
};

const pixelDissolve = keyframes`
  0% {
    mask-image: none;
    -webkit-mask-image: none;
  }
  20% {
    mask-image: radial-gradient(circle, transparent 20%, black 20%);
    -webkit-mask-image: radial-gradient(circle, transparent 20%, black 20%);
    mask-size: 2px 2px;
    -webkit-mask-size: 2px 2px;
  }
  40% {
    mask-image: radial-gradient(circle, transparent 40%, black 40%);
    -webkit-mask-image: radial-gradient(circle, transparent 40%, black 40%);
    mask-size: 2px 2px;
    -webkit-mask-size: 2px 2px;
  }
  60% {
    mask-image: radial-gradient(circle, transparent 60%, black 60%);
    -webkit-mask-image: radial-gradient(circle, transparent 60%, black 60%);
    mask-size: 2px 2px;
    -webkit-mask-size: 2px 2px;
  }
  80% {
    mask-image: radial-gradient(circle, transparent 80%, black 80%);
    -webkit-mask-image: radial-gradient(circle, transparent 80%, black 80%);
    mask-size: 2px 2px;
    -webkit-mask-size: 2px 2px;
  }
  100% {
    mask-image: radial-gradient(circle, transparent 100%, black 100%);
    -webkit-mask-image: radial-gradient(circle, transparent 100%, black 100%);
    mask-size: 2px 2px;
    -webkit-mask-size: 2px 2px;
  }
`;

const pixelReconstruct = keyframes`
  0% {
    mask-image: radial-gradient(circle, transparent 100%, black 100%);
    -webkit-mask-image: radial-gradient(circle, transparent 100%, black 100%);
    mask-size: 2px 2px;
    -webkit-mask-size: 2px 2px;
    filter: brightness(1.3);
  }
  20% {
    mask-image: radial-gradient(circle, transparent 80%, black 80%);
    -webkit-mask-image: radial-gradient(circle, transparent 80%, black 80%);
    mask-size: 2px 2px;
    -webkit-mask-size: 2px 2px;
    filter: brightness(1.25);
  }
  40% {
    mask-image: radial-gradient(circle, transparent 60%, black 60%);
    -webkit-mask-image: radial-gradient(circle, transparent 60%, black 60%);
    mask-size: 2px 2px;
    -webkit-mask-size: 2px 2px;
    filter: brightness(1.2);
  }
  60% {
    mask-image: radial-gradient(circle, transparent 40%, black 40%);
    -webkit-mask-image: radial-gradient(circle, transparent 40%, black 40%);
    mask-size: 2px 2px;
    -webkit-mask-size: 2px 2px;
    filter: brightness(1.1);
  }
  80% {
    mask-image: radial-gradient(circle, transparent 20%, black 20%);
    -webkit-mask-image: radial-gradient(circle, transparent 20%, black 20%);
    mask-size: 2px 2px;
    -webkit-mask-size: 2px 2px;
    filter: brightness(1.05);
  }
  100% {
    mask-image: none;
    -webkit-mask-image: none;
    filter: brightness(1);
  }
`;

// Quiz overlay - renders on top of comp-sheet frame 1
const QuizOverlay = styled.div<{ $isDissolving?: boolean }>`
  position: absolute;
  width: 600px;
  height: 360px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 305; /* Above all comp-sheet layers and click regions */
  pointer-events: ${props => props.$isDissolving ? 'none' : 'all'}; /* Disable clicks during dissolve */
  
  /* Two states: dissolving (pixelDissolve) or reconstructing (pixelReconstruct) */
  animation: ${props => props.$isDissolving ? pixelDissolve : pixelReconstruct} 
    ${props => props.$isDissolving ? '0.5s' : '0.6s'} 
    cubic-bezier(0.2, 0.8, 0.2, 1);
`;

const QuizQuestion = styled.div`
  font-family: 'Aseprite', monospace;
  font-size: 18px;
  color: #10141f;
  text-align: center;
  margin-bottom: 20px;
  line-height: 1.5;
`;

const QuizOptions = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
  align-items: flex-start; /* Only stretch as wide as content needs */
`;

const QuizOptionText = styled.div<{ $isSelected: boolean }>`
  font-family: 'Aseprite', monospace;
  font-size: 14px;
  color: ${props => props.$isSelected ? '#ebede9' : '#62291a'};
  text-align: left;
`;

const QuizResults = styled.div`
  font-family: 'Aseprite', monospace;
  font-size: 24px;
  color: #FFD700;
  text-align: center;
  padding: 40px;
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
  const [showAbilityInterface, setShowAbilityInterface] = useState(false);
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
  
  // Telescope sprite state
  const [telescopeFrame, setTelescopeFrame] = useState(1); // 1: normal, 2: highlighted
  
  // Star notification state
  const [starNotification, setStarNotification] = useState<{
    type: 'discovery' | 'growth' | 'mastery' | 'card';
    message: string;
    visible: boolean;
  } | null>(null);
  
  // Tutorial integration
  const currentStep = useTutorialStore(state => state.currentStep);
  const completeStep = useTutorialStore(state => state.completeStep);
  const { dismissAllOverlays } = useTutorialOverlays();

  // Welcome panel state
  const [welcomeToastVisible, setWelcomeToastVisible] = useState(false);
  const [welcomeShown, setWelcomeShown] = useState(false);
  const [welcomeDismissed, setWelcomeDismissed] = useState(false);
  
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
  
  // Tutorial sprite states
  const [arrowKeysVisible, setArrowKeysVisible] = useState(true); // Show for first 10 seconds
  const [arrowKeysFrame, setArrowKeysFrame] = useState(1); // 1-8: all up, right, left, up, down, all pushed, all up highlighted, all pushed highlighted
  const [xKeyVisible, setXKeyVisible] = useState(false); // Show when Kapoor is near target
  const [xKeyFrame, setXKeyFrame] = useState(1); // 1: normal, 2: depressed, 3: highlighted, 4: depressed+highlighted
  const [xKeyTriggered, setXKeyTriggered] = useState(false); // Track if X key interaction was completed
  const sceneStartTimeRef = useRef<number>(Date.now()); // Track when scene started
  
  // Desk X key states
  const [deskXKeyVisible, setDeskXKeyVisible] = useState(false); // Show when star is clicked
  const [deskXKeyFrame, setDeskXKeyFrame] = useState(1); // 1: normal, 2: depressed, 3: highlighted, 4: depressed+highlighted
  const [deskXKeyTriggered, setDeskXKeyTriggered] = useState(false); // Track if desk X key was used
  const [deskXKeyEnabled, setDeskXKeyEnabled] = useState(false); // Track if desk X key system is enabled (star must be viewed first)
  
  // Comp-sheet animation states
  const [compSheetVisible, setCompSheetVisible] = useState(false); // Show comp-sheet overlay
  const [compOptionsFrame, setCompOptionsFrame] = useState(1); // Options layer frame (1-7)
  const [compOption1Frame, setCompOption1Frame] = useState(1); // Option1 layer frame (1-5) - autonomous animation
  const [compSheetPhase, setCompSheetPhase] = useState<'idle' | 'waiting' | 'transitioning' | 'activity'>('idle');
  const compSheetAnimationRef = useRef<NodeJS.Timeout | null>(null);
  const compOption1AnimationRef = useRef<NodeJS.Timeout | null>(null);
  
  // Activity selection state (null = no activity selected, 0-4 = activity index)
  // 0: top-left, 1: top-right, 2: bottom-left, 3: bottom-middle, 4: bottom-right
  const [selectedActivity, setSelectedActivity] = useState<number | null>(null);
  const [hoveredActivity, setHoveredActivity] = useState<number | null>(null);
  const [highlightedActivity, setHighlightedActivity] = useState<number>(0); // For keyboard navigation (0-4)
  
  // Quiz states (happens on comp-sheet frame 1)
  const [showQuiz, setShowQuiz] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [userAnswers, setUserAnswers] = useState<number[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [quizAnimationKey, setQuizAnimationKey] = useState(0); // Triggers re-animation on change
  const [isDissolving, setIsDissolving] = useState(false); // Tracks dissolve-out animation between questions
  const [highlightedQuizOption, setHighlightedQuizOption] = useState(0); // Track keyboard-highlighted option (0-2)
  
  // TBI Quiz questions
  const quizQuestions = [
    {
      question: "What is the primary purpose of Total Body Irradiation (TBI)?",
      options: [
        "Conditioning before bone marrow transplant",
        "Treating localized brain tumors",
        "Post-operative pain management"
      ],
      correctAnswer: 0
    },
    {
      question: "What is a major concern when delivering TBI?",
      options: [
        "Dose uniformity across entire body",
        "Patient claustrophobia",
        "Treatment time under 5 minutes"
      ],
      correctAnswer: 0
    }
  ];
  
  // Star X key states (shows next to star when in sky view and star is highlighted)
  const [starXKeyVisible, setStarXKeyVisible] = useState(true); // Show when star is highlighted in sky view
  const [starXKeyFrame, setStarXKeyFrame] = useState(3); // Start highlighted (3: highlighted)
  const [starXKeyTriggered, setStarXKeyTriggered] = useState(false); // Track if star X key was used
  
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
  
  // X key target position (near Kapoor's starting position for easy discovery)
  const X_KEY_TARGET = { x: 480, y: 310 }; // Stationary position in room, near Kapoor
  const X_KEY_PROXIMITY_THRESHOLD = 60; // Show X key when Kapoor is within this distance
  
  // Desk X key target position (moved to the right, above the desk on first floor)
  const DESK_X_KEY_TARGET = { x: 400, y: 495 }; // Moved right, above desk area
  const DESK_X_KEY_PROXIMITY_THRESHOLD = 60; // Show X key when Kapoor is within this distance
  
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

  const handleDeskClick = () => {
    console.log('[CombinedHomeScene] Desk clicked - opening journal/ability cards');
    setShowAbilityInterface(true);
  };

  const handleCloseAbilityInterface = () => {
    setShowAbilityInterface(false);
    // Mark first activity as completed (for constellation cutscene trigger)
    if (!hasCompletedFirstActivity) {
      console.log('[CombinedHomeScene] First activity completed - enabling constellation cutscene');
      setHasCompletedFirstActivity(true);
    }
    
    // Reset desk X key state so it can be used again
    setDeskXKeyTriggered(false);
    console.log('[CombinedHomeScene] Ability interface closed - desk X key reset for next interaction');
  };

  const handleCloseStarDetail = () => {
    setShowStarDetail(false);
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
    console.log('[CombinedHomeScene] Star viewed - showing desk X key');
    setDeskXKeyVisible(true);
  };

  // Activity interaction - handle activity selection from comp-sheet
  const handleActivitySelect = (activityIndex: number) => {
    console.log('[CombinedHomeScene] Activity selected:', activityIndex);
    setSelectedActivity(activityIndex);
    setCompSheetPhase('transitioning');
  };
  
  // Quiz interaction handlers
  const handleOptionSelect = (optionIndex: number) => {
    setSelectedOption(optionIndex);
    setUserAnswers([...userAnswers, optionIndex]);
    
    // Immediate transition to next question
    if (currentQuestionIndex < quizQuestions.length - 1) {
      setIsDissolving(true); // Start dissolve effect
      
      // After dissolve completes (0.5s), show next question
      setTimeout(() => {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        setSelectedOption(null);
        setIsDissolving(false);
        setQuizAnimationKey(prev => prev + 1); // Trigger re-animation
      }, 500); // Match pixelDissolve duration
    } else {
      // Last question - dissolve to results
      setIsDissolving(true);
      setTimeout(() => {
        setShowQuiz(false);
        setShowResults(true);
        setIsDissolving(false);
      }, 500);
    }
  };

  const handleQuizComplete = () => {
    console.log('[CombinedHomeScene] Quiz complete - closing comp-sheet');
    
    // Mark first activity as completed (for constellation cutscene trigger)
    if (!hasCompletedFirstActivity) {
      console.log('[CombinedHomeScene] First activity completed - enabling constellation cutscene');
      setHasCompletedFirstActivity(true);
    }
    
    // Hide everything and reset
    setCompSheetVisible(false);
    setShowResults(false);
    setShowQuiz(false);
    
    // Reset all quiz and activity state
    setTimeout(() => {
      setCurrentQuestionIndex(0);
      setSelectedOption(null);
      setUserAnswers([]);
      setCompSheetPhase('idle');
      setCompOptionsFrame(1);
      setCompOption1Frame(1);
      setDeskXKeyTriggered(false); // Reset so desk can be used again
      setQuizAnimationKey(0); // Reset animation key
      setIsDissolving(false); // Reset dissolve state
      
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
      
      // Enable desk X key immediately (simulate star having been viewed)
      setDeskXKeyEnabled(true);
      setDeskXKeyVisible(true);
      
      // Hide tutorial elements
      setArrowKeysVisible(false);
      setXKeyVisible(false);
      
      console.log('[CombinedHomeScene] 🧪 Debug setup complete - desk X key is active!');
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
      
      // Enable X key near telescope
      setXKeyVisible(true);
      setXKeyFrame(3); // Highlighted state
      
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
      setXKeyVisible(false);
      setDeskXKeyVisible(false);
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
      
      // Enable telescope X key for easy navigation to sky
      setXKeyVisible(true);
      setXKeyFrame(3); // Highlighted state
      setXKeyTriggered(false); // Allow triggering
      
      console.log('[CombinedHomeScene] 🧪 Planetary systems showcase created!');
      console.log('[CombinedHomeScene] 🧪 7 systems (all in upper-left quadrant) with', planetarySystems.length, 'celestial bodies');
      console.log('[CombinedHomeScene] 🧪 Every planet has 3-4 moons orbiting with full 3D effects!');
      console.log('[CombinedHomeScene] 🧪 Press X near telescope to view the living sky!');
    }
  }, []); // Run once on mount
  
  // Tutorial star sparkle animation - cycles through sparkle frames, highlighting based on skyHighlight state
  useEffect(() => {
    console.log('[CombinedHomeScene] 🌟 Star effect check - currentStep:', currentStep, 'isPingPongActive:', isPingPongActive);
    
    // TEMPORARY: Start loop immediately for testing (remove this line when tutorial flow is working)
    const testMode = true;
    
    if (testMode || currentStep === 'constellation_intro' || currentStep === 'constellation_available') {
      // User has completed Quinn tutorial - start sparkle loop (only if star hasn't been unlocked yet)
      if (!isPingPongActive && !isRevealAnimating && !starUnlocked) {
        console.log('[CombinedHomeScene] ⭐ Tutorial completed - starting sparkle animation!');
        setIsPingPongActive(true);
        
        // Creating star animation interval
        pingPongIntervalRef.current = setInterval(() => {
          // Cycle through 0, 1, 2
          sparkleAnimationCycle.current = (sparkleAnimationCycle.current + 1) % 3;
          
          // Determine if we should use highlighted frames (read from refs for current values)
          // In sky view, only highlight if skyHighlight === 'star' AND not playing cutscene
          // During cutscene or cutscene scroll transition, never highlight - just pulse with base frames
          const isInSkyView = currentViewRef.current === 'sky';
          const isCutscenePlaying = isPlayingCutsceneRef.current;
          const isCutsceneScrollingNow = isCutsceneScrollingRef.current;
          const shouldHighlight = !isCutscenePlaying && !isCutsceneScrollingNow && (isInSkyView ? skyHighlightRef.current === 'star' : true);
          
          // Base frames: 2, 3, 4
          // Highlighted frames: 11, 12, 13
          const baseFrame = sparkleAnimationCycle.current + 2;
          const frame = shouldHighlight ? baseFrame + 9 : baseFrame;
          
          setTutorialStarFrame(frame);
        }, 400); // 400ms per frame for clear progression
      }
    }
  }, [currentStep, isPingPongActive, isRevealAnimating, starUnlocked]); // Removed currentView and skyHighlight - using refs instead
  
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
  
  // Comp-sheet transition animation - show pressed state (options frame 7), then hide activity layers and start quiz
  useEffect(() => {
    if (compSheetPhase === 'transitioning') {
      console.log('[CombinedHomeScene] Starting comp-sheet transition animation');
      
      // Clear any existing animations
      if (compOption1AnimationRef.current) {
        clearTimeout(compOption1AnimationRef.current);
        compOption1AnimationRef.current = null;
      }
      
      // Show pressed state (options layer frame 7) briefly
      setCompOptionsFrame(7);
      
      // After 150ms, transition to activity phase (hides activity/options/option1 layers, keeps window)
      setTimeout(() => {
        console.log('[CombinedHomeScene] Transitioning to activity phase - showing quiz');
        setCompSheetPhase('activity');
        setShowQuiz(true);
      }, 150);
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
          // Define activity positions (matching ActivityClickRegion coordinates)
          const activityPositions = [
            { id: 0, x: 110, y: 100 },  // top-left (center of region)
            { id: 1, x: 510, y: 100 },  // top-right
            { id: 2, x: 110, y: 260 },  // bottom-left
            { id: 3, x: 300, y: 260 },  // bottom-middle
            { id: 4, x: 510, y: 260 },  // bottom-right
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
        // In sky view: use arrows to navigate between constellation stars and telescope (spatial navigation)
        else if (currentView === 'sky' && !showStarDetail) {
          const hasConstellation = showFinalConstellation;
          
          if (hasConstellation) {
            // Spatial navigation - find nearest PLANET in the pressed direction (moons not navigable)
            // Build list of all navigable targets with their current positions
            // Filter to only planets (bodies without parentId) - moons are only navigable in modal view
            const planets = constellationStars.filter(body => !body.parentId);
            const targets: Array<{ id: SkyHighlightType; x: number; y: number }> = [
              ...planets.map(planet => ({ id: planet.id as SkyHighlightType, x: planet.x, y: planet.y })),
              { id: 'telescope' as SkyHighlightType, x: 320, y: 520 } // Telescope position (centered, bottom)
            ];
            
            // Find current highlighted target
            let currentTarget = targets.find(t => t.id === skyHighlight);
            
            // If current highlight is invalid (e.g., 'tbi' or 'star' in debug planetary systems), default to first planet
            if (!currentTarget && planets.length > 0) {
              const firstPlanet = planets[0];
              setSkyHighlight(firstPlanet.id as SkyHighlightType);
              currentTarget = targets.find(t => t.id === firstPlanet.id);
              console.log(`[CombinedHomeScene] Invalid skyHighlight "${skyHighlight}" - defaulting to ${firstPlanet.id}`);
            }
            
            if (!currentTarget) return;
            
            // Determine direction vector based on key
            let directionX = 0;
            let directionY = 0;
            if (e.key === 'ArrowLeft') directionX = -1;
            else if (e.key === 'ArrowRight') directionX = 1;
            else if (e.key === 'ArrowUp') directionY = -1;
            else if (e.key === 'ArrowDown') directionY = 1;
            
            // Find the nearest target in the pressed direction
            let bestTarget: SkyHighlightType | null = null;
            let bestScore = Infinity;
            
            for (const target of targets) {
              if (target.id === skyHighlight) continue; // Skip current target
              
              // Calculate vector from current to target
              const dx = target.x - currentTarget.x;
              const dy = target.y - currentTarget.y;
              
              // Check if target is in the general direction we're pressing
              // Dot product with direction vector (positive = same direction)
              const alignment = dx * directionX + dy * directionY;
              if (alignment <= 0) continue; // Not in the right direction
              
              // Calculate distance
              const distance = Math.sqrt(dx * dx + dy * dy);
              
              // Score = distance / alignment (prefer close targets that are well-aligned)
              const score = distance / alignment;
              
              if (score < bestScore) {
                bestScore = score;
                bestTarget = target.id;
              }
            }
            
            if (bestTarget) {
              setSkyHighlight(bestTarget);
              console.log(`[CombinedHomeScene] Sky navigation: moved to planet ${bestTarget}`);
            }
          } else {
            // Original single-star navigation
            if (e.key === 'ArrowUp') {
              setSkyHighlight('star'); // Move highlight to star
              console.log('[CombinedHomeScene] Sky navigation: highlight moved to star');
            } else if (e.key === 'ArrowDown') {
              setSkyHighlight('telescope'); // Move highlight to telescope
              console.log('[CombinedHomeScene] Sky navigation: highlight moved to telescope');
            }
          }
        } else if (currentView === 'home') {
          // In home view: add to movement keys
          keysPressed.current.add(e.key);
        }
      }
      
      // Handle 'x' key interaction - toggle between sky and home views, or interact with desk/star
      if (e.key === 'x' || e.key === 'X') {
        // Priority 0: Complete quiz if showing results
        if (showResults) {
          console.log('[CombinedHomeScene] X key pressed - completing quiz');
          handleQuizComplete();
        }
        // Priority 1: Close star modal if open
        else if (showStarDetail) {
          console.log('[CombinedHomeScene] X key pressed - closing star modal');
          setShowStarDetail(false);
        }
        // Priority 2: Desk X key interaction (when in home view, visible, highlighted, not yet triggered)
        else if (currentView === 'home' && deskXKeyVisible && deskXKeyFrame === 3 && !deskXKeyTriggered && !compSheetVisible) {
          console.log('[CombinedHomeScene] Desk X key pressed - showing comp-sheet!');
          
          // Show depressed+highlighted frame
          setDeskXKeyFrame(4);
          
          // After brief depression, show comp-sheet and start waiting animation
          setTimeout(() => {
            setDeskXKeyTriggered(true);
            setDeskXKeyVisible(false);
            setCompSheetVisible(true);
            setCompSheetPhase('waiting');
            setCompOptionsFrame(1); // Start with no highlight
            setCompOption1Frame(1); // Start option1 animation
            setHighlightedActivity(0); // Default to first activity highlighted
          }, 150); // Brief depression visual
        }
        // Priority 2b: Comp-sheet X key interaction (when comp-sheet is in waiting phase) - select highlighted activity
        else if (compSheetVisible && compSheetPhase === 'waiting') {
          console.log('[CombinedHomeScene] Comp-sheet X key pressed - selecting activity', highlightedActivity);
          
          // Set selected activity and start transition
          setSelectedActivity(highlightedActivity);
          setCompSheetPhase('transitioning');
        }
        // Priority 3: Star X key interaction (when in sky view, constellation stars highlighted)
        else if (currentView === 'sky' && !showStarDetail && skyHighlight !== 'telescope') {
          // Check if any constellation celestial body is highlighted (??? star, TBI planet, or moons)
          const constellationStarIds: StarIdType[] = ['star', 'tbi', 'tbi_dosimetry', 'tbi_prescriptions', 'tbi_commissioning'];
          if (constellationStarIds.includes(skyHighlight as StarIdType)) {
            console.log(`[CombinedHomeScene] X key pressed on ${skyHighlight} - opening star modal!`);
            
            // Show depressed+highlighted frame for X key if it's the original star
            if (skyHighlight === 'star' && starXKeyVisible) {
              setStarXKeyFrame(4);
            }
            
            // After brief depression, trigger star modal
            setTimeout(() => {
              setActiveStarId(skyHighlight as StarIdType);
              setShowStarDetail(true);
              if (skyHighlight === 'star') {
                setStarXKeyTriggered(true);
                setStarXKeyVisible(false);
              }
            }, 150); // Brief depression visual
          }
        }
        // Priority 4: Sky X key interaction (when in home view, visible, highlighted, not yet triggered)
        else if (currentView === 'home' && xKeyVisible && xKeyFrame === 3 && !xKeyTriggered) {
          // Check if we should play the constellation cutscene
          const shouldPlayCutscene = hasCompletedFirstActivity && !hasSeenConstellationCutscene;
          
          console.log(`[CombinedHomeScene] X key pressed - ${shouldPlayCutscene ? 'triggering CUTSCENE' : 'triggering slow scroll to sky'}!`);
          
          // Show depressed+highlighted frame
          setXKeyFrame(4);
          
          // After brief depression, fade away and trigger slow scroll to sky
          setTimeout(() => {
            setXKeyVisible(false);
            setXKeyTriggered(true);
            
            // Unhighlight telescope in home view
            setTelescopeFrame(1);
            
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
          }, 150); // Brief depression visual
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
  }, [xKeyVisible, xKeyFrame, xKeyTriggered, currentView, deskXKeyVisible, deskXKeyFrame, deskXKeyTriggered, starXKeyVisible, starXKeyFrame, starXKeyTriggered, skyHighlight, showStarDetail, constellationStars, showFinalConstellation, showResults, compSheetVisible, compSheetPhase, highlightedActivity]); // Add comp-sheet activity navigation dependencies
  
  // Arrow keys visibility timer - hide after 10 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      console.log('[CombinedHomeScene] 10 seconds elapsed - hiding arrow keys tutorial');
      setArrowKeysVisible(false);
    }, 10000);
    
    return () => clearTimeout(timer);
  }, []);

  // Quiz keyboard controls - arrow keys to navigate options, X to select
  useEffect(() => {
    if (!showQuiz || selectedOption !== null) return; // Only active when quiz is showing and no option selected yet

    const handleQuizKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'x', 'X'].includes(e.key)) {
        e.preventDefault();
        e.stopPropagation(); // Stop from reaching other handlers
      }

      const optionCount = quizQuestions[currentQuestionIndex].options.length;

      if (e.key === 'ArrowUp') {
        setHighlightedQuizOption(prev => Math.max(0, prev - 1));
      } else if (e.key === 'ArrowDown') {
        setHighlightedQuizOption(prev => Math.min(optionCount - 1, prev + 1));
      } else if (e.key === 'x' || e.key === 'X') {
        // Select the highlighted option
        handleOptionSelect(highlightedQuizOption);
      }
    };

    window.addEventListener('keydown', handleQuizKeyDown, { capture: true }); // Use capture phase for priority
    return () => window.removeEventListener('keydown', handleQuizKeyDown, { capture: true });
  }, [showQuiz, selectedOption, highlightedQuizOption, currentQuestionIndex, quizQuestions]);

  // Reset highlighted quiz option when question changes
  useEffect(() => {
    setHighlightedQuizOption(0); // Reset to first option on new question
  }, [currentQuestionIndex]);
  
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
  
  // X key proximity detection
  useEffect(() => {
    // Don't show X key if already triggered
    if (xKeyTriggered) {
      return;
    }
    
    const checkXKeyProximity = () => {
      const distance = Math.sqrt(
        Math.pow(kapoorPosition.x - X_KEY_TARGET.x, 2) + 
        Math.pow(kapoorPosition.y - X_KEY_TARGET.y, 2)
      );
      
      const isNear = distance < X_KEY_PROXIMITY_THRESHOLD;
      setXKeyVisible(isNear);
      
      // Highlight when very close
      if (isNear && distance < X_KEY_PROXIMITY_THRESHOLD / 2) {
        setXKeyFrame(3); // Highlighted - ready for interaction!
      } else if (isNear) {
        setXKeyFrame(1); // Normal - nearby but not close enough
      }
    };
    
    checkXKeyProximity();
  }, [kapoorPosition, xKeyTriggered]);

  // Telescope highlighting logic - synced with X key in home view, or skyHighlight in sky view
  useEffect(() => {
    if (currentView === 'home') {
      // In home view: highlight telescope when X key is highlighted (near telescope position)
      if (xKeyVisible && xKeyFrame === 3) {
        setTelescopeFrame(2); // Highlighted
      } else {
        setTelescopeFrame(1); // Normal
      }
    } else if (currentView === 'sky') {
      // In sky view: highlight telescope when skyHighlight is 'telescope'
      if (skyHighlight === 'telescope') {
        setTelescopeFrame(2); // Highlighted
      } else {
        setTelescopeFrame(1); // Normal
      }
    }
  }, [currentView, xKeyVisible, xKeyFrame, skyHighlight]);

  // Desk X key proximity detection - matches sky X key behavior (show/hide based on distance)
  // When star is viewed, enable the desk X key system
  useEffect(() => {
    if (deskXKeyVisible) {
      setDeskXKeyEnabled(true);
    }
  }, [deskXKeyVisible]);
  
  useEffect(() => {
    // Don't check proximity if not enabled, already triggered, or not in home view
    if (!deskXKeyEnabled || deskXKeyTriggered || currentView !== 'home') {
      setDeskXKeyVisible(false);
      return;
    }
    
    const checkDeskXKeyProximity = () => {
      const distance = Math.sqrt(
        Math.pow(kapoorPosition.x - DESK_X_KEY_TARGET.x, 2) + 
        Math.pow(kapoorPosition.y - DESK_X_KEY_TARGET.y, 2)
      );
      
      const isNear = distance < DESK_X_KEY_PROXIMITY_THRESHOLD;
      setDeskXKeyVisible(isNear); // Show/hide based on proximity
      
      // Highlight when very close
      if (isNear && distance < DESK_X_KEY_PROXIMITY_THRESHOLD / 2) {
        setDeskXKeyFrame(3); // Highlighted - ready for interaction!
      } else if (isNear) {
        setDeskXKeyFrame(1); // Normal - nearby but not close enough
      }
    };
    
    checkDeskXKeyProximity();
  }, [kapoorPosition, deskXKeyEnabled, deskXKeyTriggered, currentView]);
  
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
  }, [climbingStartY, currentView]); // Depend on climbingStartY and currentView to track state changes
  
  // Simplified tutorial state (no complex guided tour)
  const shownSpotlightsRef = useRef(new Set<string>());
  
  // Debug: Track tutorial step changes with deduplication
  const lastLoggedStep = useRef<string | null>(null);
  useEffect(() => {
    if (currentStep && currentStep !== lastLoggedStep.current) {
      console.log(`[CombinedHomeScene] 📚 Tutorial step changed to: ${currentStep}`);
      console.log(`[CombinedHomeScene] 📚 State: currentView=${currentView}, scrollPosition=${scrollPosition}`);
      lastLoggedStep.current = currentStep;
    }
  }, [currentStep, currentView, scrollPosition]);
  
  // Single-source tutorial progression - prevent multiple triggers
  const tutorialProcessingRef = useRef(false);
  useEffect(() => {
    if (currentStep === 'night_phase_intro' && !hasProcessedRef.current && !tutorialProcessingRef.current) {
      // First time arriving home - advance to home_intro step
      console.log('[CombinedHomeScene] 🎯 Processing night_phase_intro transition (single-source)');
      hasProcessedRef.current = true;
      tutorialProcessingRef.current = true;
      
      // Use requestAnimationFrame to ensure DOM is ready
      requestAnimationFrame(() => {
        setTimeout(() => {
          if (tutorialProcessingRef.current) { // Double-check we haven't been cancelled
            console.log('[CombinedHomeScene] 🎯 Completing night_phase_intro');
            completeStep('night_phase_intro');
            tutorialProcessingRef.current = false;
          }
        }, 100);
      });
    }
  }, [currentStep, completeStep]);

  // Show welcome panel when scene loads (only once) - with debouncing
  const welcomeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (currentStep === 'home_intro' && !hasShownWelcomeRef.current) {
      hasShownWelcomeRef.current = true;
      
      // Clear any existing timeout
      if (welcomeTimeoutRef.current) {
        clearTimeout(welcomeTimeoutRef.current);
      }
      
      // Debounce the welcome panel to prevent rapid firing
      welcomeTimeoutRef.current = setTimeout(() => {
        setWelcomeShown(true);
        setWelcomeDismissed(false);
        setWelcomeToastVisible(true);
      }, 200);
    }
    
    return () => {
      if (welcomeTimeoutRef.current) {
        clearTimeout(welcomeTimeoutRef.current);
      }
    };
  }, [currentStep]); // guidedTourStep intentionally excluded to prevent retriggering

  // Tutorial overlay removed - users can explore freely after welcome panel

  // Note: Simplified guided tour - we now go directly to telescope after welcome modal
  // The telescope spotlight is shown in the welcome modal timeout effect above
  // No need for complex multi-step guided tour sequence

  // Simplified desk click handler
  const handleDeskClickWithTutorial = () => {
    handleDeskClick();
  };

  // Simplified telescope click handler
  const handleTelescopeClickWithTutorial = () => {
    console.log(`[CombinedHomeScene] 🔭 Telescope clicked! currentStep=${currentStep}, currentView=${currentView}`);
    
    if (currentStep === 'home_intro') {
      // First time tutorial - scroll to sky view and advance tutorial
      console.log('[CombinedHomeScene] Telescope clicked during home_intro - scrolling to sky view');
      dismissAllOverlays();
      handleTelescopeClick();
      
      // After scroll animation, advance tutorial
      setTimeout(() => {
        const { skipToStep } = useTutorialStore.getState();
        skipToStep('constellation_intro');
      }, 800);
    } else if (currentStep === 'constellation_available') {
      // User is ready for constellation tutorial
      console.log('[CombinedHomeScene] Telescope clicked during constellation_available');
      completeStep('constellation_available');
      handleTelescopeClick();
    } else {
      // Default behavior for all other states
      handleTelescopeClick();
    }
  };

  // Simplified bed click handler
  const handleBedClickWithTutorial = () => {
    if (currentStep === 'home_intro') {
      // Complete home intro tutorial and advance day
      dismissAllOverlays();
      completeStep('home_intro');
    }
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
          {/* Star sprite - visible until final constellation replaces it */}
          {!showFinalConstellation && (
            <StarSprite
              $frame={tutorialStarFrame}
              style={{ 
                left: `${PRIMAREUS_POSITION.x}px`, 
                top: `${PRIMAREUS_POSITION.y}px`,
                opacity: isPlayingCutscene ? cutsceneStarOpacity : 1, // Apply oscillating opacity during cutscene
              }}
            />
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
              
              {/* Arrow keys tutorial - hover over Kapoor for first 20 seconds */}
              <ArrowKeysSprite
                $frame={arrowKeysFrame}
                $visible={arrowKeysVisible}
                style={{
                  left: `${kapoorPosition.x - 4}px`, // Center above Kapoor (38px char - 45px sprite = -7px, +3px adjustment)
                  top: `${kapoorPosition.y - 45}px`,  // Hover above Kapoor's head
                }}
              />
              
              {/* X key tutorial - stationary position, shows when Kapoor is nearby */}
              <XKeySprite
                $frame={xKeyFrame}
                $visible={xKeyVisible}
                style={{
                  left: `${X_KEY_TARGET.x}px`,
                  top: `${X_KEY_TARGET.y - 25}px`, // Hover above target position
                }}
              />
              
              {/* Desk X key - shows after star is clicked, guides player to desk */}
              <XKeySprite
                $frame={deskXKeyFrame}
                $visible={deskXKeyVisible && currentView === 'home'}
                style={{
                  left: `${DESK_X_KEY_TARGET.x}px`,
                  top: `${DESK_X_KEY_TARGET.y}px`,
                }}
              />
              
              {/* Star X key - shows next to star when in sky view and star is highlighted (not during cutscene) */}
              <XKeySprite
                $frame={starXKeyFrame}
                $visible={starXKeyVisible && currentView === 'sky' && skyHighlight === 'star' && !isPlayingCutscene}
                style={{
                  left: `${STAR_X_KEY_POSITION.x}px`,
                  top: `${STAR_X_KEY_POSITION.y}px`,
                }}
              />
              
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

              {/* Desk area */}
              <ClickableArea
                data-testid="home-desk-area"
                $isHovered={false}
                style={{ left: '5px', top: '510px', width: '120px', height: '72px' }}
                onClick={handleDeskClickWithTutorial}
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
        
        {/* Welcome Home 9-slice panel with nested CTA */}
        <WelcomePanelWrapper $visible={welcomeToastVisible}>
          <ExpandableQuestionContainer domain="planning">
            <WelcomeTypographyOverride>
              <div style={{ padding: '6px 8px' }}>
                <div style={{ fontSize: '20px', marginBottom: '8px', fontWeight: 'bold' }}>Welcome Home!</div>
                <div style={{ fontSize: '16px', marginBottom: '10px' }}>
                  Your day at the hospital is complete. Time to explore your personal space!
                </div>
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <ExpandableAnswerContainer 
                    domain="planning" 
                    size="md" 
                    onClick={() => { setWelcomeToastVisible(false); setWelcomeDismissed(true); }}
                  >
                    <WelcomeTypographyOverride>
                      <div style={{ fontSize: '14px', padding: '4px 10px', fontWeight: 'bold' }}>Click to Continue</div>
                    </WelcomeTypographyOverride>
                  </ExpandableAnswerContainer>
                </div>
              </div>
            </WelcomeTypographyOverride>
          </ExpandableQuestionContainer>
        </WelcomePanelWrapper>

        {/* Star Detail Modal - Rendered within the 640×360 coordinate system */}
        {showStarDetail && (() => {
          // Calculate the current frame for the active celestial body
          // TBI constellation now uses planetary-sheet.png: planet uses frame 2, moons use frame 0 (small moon)
          const currentStarFrame = activeStarId === 'star' ? tutorialStarFrame :
                                   activeStarId === 'tbi' ? 2 : 0;
          
          return (
            <StarDetailModal 
              starId={activeStarId}
              onClose={handleCloseStarDetail}
              starFrame={currentStarFrame}
              isUnlocked={starUnlocked}
              onStarUnlock={handleStarUnlock}
              onCardUnlock={handleCardUnlock}
              onStarViewed={handleStarViewed}
            />
          );
        })()}

        {/* Comp-sheet composite layer system - appears when desk interaction starts */}
        {compSheetVisible && (
          <>
            {/* Layer 1: Window frame (always visible when comp-sheet is shown) */}
            <CompWindowLayer
              $visible={compSheetVisible}
              style={{
                left: '20px', // Center horizontally (640 - 600 = 40, 40/2 = 20)
                top: '0px',
              }}
            />
            
            {/* Layer 2: Activity base (visible until activity selected) */}
            <CompActivityLayer
              $visible={compSheetPhase === 'waiting'}
              style={{
                left: '20px',
                top: '0px',
              }}
            />
            
            {/* Layer 3: Activity options highlights (visible until activity selected) */}
            <CompOptionsLayer
              $frame={compOptionsFrame}
              $visible={compSheetPhase === 'waiting' || compSheetPhase === 'transitioning'}
              style={{
                left: '20px',
                top: '0px',
              }}
            />
            
            {/* Layer 4: Activity option 1 animation (visible until activity selected) */}
            <CompOption1Layer
              $frame={compOption1Frame}
              $visible={compSheetPhase === 'waiting'}
              style={{
                left: '20px',
                top: '0px',
              }}
            />
            
            {/* Activity click regions - only visible during waiting phase */}
            {compSheetPhase === 'waiting' && (
              <>
                {/* Top-left activity (0) */}
                <ActivityClickRegion
                  $active={highlightedActivity === 0 || hoveredActivity === 0}
                  onMouseEnter={() => setHoveredActivity(0)}
                  onMouseLeave={() => setHoveredActivity(null)}
                  onClick={() => handleActivitySelect(0)}
                  style={{
                    left: '50px',
                    top: '50px',
                    width: '120px',
                    height: '100px',
                  }}
                />
                
                {/* Top-right activity (1) */}
                <ActivityClickRegion
                  $active={highlightedActivity === 1 || hoveredActivity === 1}
                  onMouseEnter={() => setHoveredActivity(1)}
                  onMouseLeave={() => setHoveredActivity(null)}
                  onClick={() => handleActivitySelect(1)}
                  style={{
                    left: '450px',
                    top: '50px',
                    width: '120px',
                    height: '100px',
                  }}
                />
                
                {/* Bottom-left activity (2) */}
                <ActivityClickRegion
                  $active={highlightedActivity === 2 || hoveredActivity === 2}
                  onMouseEnter={() => setHoveredActivity(2)}
                  onMouseLeave={() => setHoveredActivity(null)}
                  onClick={() => handleActivitySelect(2)}
                  style={{
                    left: '50px',
                    top: '210px',
                    width: '120px',
                    height: '100px',
                  }}
                />
                
                {/* Bottom-middle activity (3) */}
                <ActivityClickRegion
                  $active={highlightedActivity === 3 || hoveredActivity === 3}
                  onMouseEnter={() => setHoveredActivity(3)}
                  onMouseLeave={() => setHoveredActivity(null)}
                  onClick={() => handleActivitySelect(3)}
                  style={{
                    left: '240px',
                    top: '210px',
                    width: '120px',
                    height: '100px',
                  }}
                />
                
                {/* Bottom-right activity (4) */}
                <ActivityClickRegion
                  $active={highlightedActivity === 4 || hoveredActivity === 4}
                  onMouseEnter={() => setHoveredActivity(4)}
                  onMouseLeave={() => setHoveredActivity(null)}
                  onClick={() => handleActivitySelect(4)}
                  style={{
                    left: '450px',
                    top: '210px',
                    width: '120px',
                    height: '100px',
                  }}
                />
              </>
            )}
            
            {/* Quiz overlay - renders on top of comp-sheet when active */}
            {showQuiz && (
              <QuizOverlay 
                key={quizAnimationKey}
                $isDissolving={isDissolving}
                style={{ left: '20px', top: '0px' }}
              >
                <WindowContainer size="lg" style={{ width: '500px', maxWidth: '500px' }}>
                  <QuizQuestion>{quizQuestions[currentQuestionIndex].question}</QuizQuestion>
                  <QuizOptions>
                    {quizQuestions[currentQuestionIndex].options.map((option, index) => (
                      <ExpandableAnswerContainer
                        key={index}
                        domain="planning"
                        size="sm"
                        isActive={selectedOption === index}
                        isHovered={highlightedQuizOption === index && selectedOption === null}
                        onClick={() => handleOptionSelect(index)}
                        style={{ cursor: 'pointer', width: 'fit-content' }}
                      >
                        <QuizOptionText $isSelected={selectedOption === index}>
                          {option}
                        </QuizOptionText>
                      </ExpandableAnswerContainer>
                    ))}
                  </QuizOptions>
                </WindowContainer>
              </QuizOverlay>
            )}
            
            {/* Results screen - shows on comp-sheet after quiz completes */}
            {showResults && (
              <QuizOverlay 
                style={{ left: '20px', top: '0px' }}
              >
                <WindowContainer size="lg" style={{ width: '500px', maxWidth: '500px' }}>
                  <QuizResults>
                    <div style={{ marginBottom: '20px' }}>
                      Quiz Complete!
                    </div>
                    <div style={{ fontSize: '18px' }}>
                      You got {userAnswers.filter((answer, idx) => answer === quizQuestions[idx].correctAnswer).length} out of {quizQuestions.length} correct
                    </div>
                    <div style={{ fontSize: '14px', marginTop: '30px', color: '#999' }}>
                      Press X to continue
                    </div>
                  </QuizResults>
                </WindowContainer>
              </QuizOverlay>
            )}
          </>
        )}
      </JumboViewport>

      {/* Boom effect overlay (full-screen flash + pulse during cutscene) */}
      <BoomEffectOverlay $visible={showBoomEffect} />

      {/* Cinematic letterbox bars - slide in AFTER scroll completes, during cutscene only */}
      <CinematicLetterbox $visible={isPlayingCutscene} $position="top" />
      <CinematicLetterbox $visible={isPlayingCutscene} $position="bottom" />

      {/* Ability Interface Modal - Rendered outside scaled container using portal */}
      {showAbilityInterface && createPortal(
        <AbilityCardInterface
          onClose={handleCloseAbilityInterface}
        />,
        document.body
      )}


    </>
  );
}