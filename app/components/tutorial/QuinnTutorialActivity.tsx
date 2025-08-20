'use client';

import React, { useState, useEffect, useMemo } from 'react';
import styled from 'styled-components';
import { useResourceStore } from '@/app/store/resourceStore';
import { useGameStore } from '@/app/store/gameStore';
import { useSceneStore } from '@/app/store/sceneStore';
import { useTutorialStore } from '@/app/store/tutorialStore';
import { MentorId } from '@/app/types';

import { getPortraitCoordinates, getMediumPortraitSrc, getExpressionCoordinates, SPRITE_SHEETS, ExpressionType } from '@/app/utils/spriteMap';
import { colors, spacing, borders, typography, animation } from '@/app/styles/pixelTheme';
import TypewriterText from '@/app/components/ui/TypewriterText';
import { ExpandableQuestionContainer, CardContainer, ExpandableAnswerContainer, ToastContainer } from '@/app/components/ui/PixelContainer';

// Quinn's Beam Basics Questions - Simplified from Jesse's original beam basics for first-time players
interface Question {
  id: string;
  text: string;
  options: { text: string; isCorrect: boolean; feedback: string }[];
  timeLimit: number;
  momentumPath: 'always' | 'low' | 'medium' | 'high';
}

// Quinn's Beam Basics Questions - Simplified for first-time player experience
const QUINN_QUESTIONS: Question[] = [
  // Opening Sequence (Always Shown)
  {
    id: 'q1-beam-delivery',
    text: '"Let\'s start with the basics. How do we deliver radiation treatment to patients?"',
    options: [
      { text: 'Linear accelerator', isCorrect: true, feedback: 'Exactly! The linear accelerator is our main tool for delivering precise radiation treatments.' },
      { text: 'CT scanner', isCorrect: false, feedback: 'CT scanners are for imaging - we need something that can deliver therapeutic radiation.' },
      { text: 'MRI machine', isCorrect: false, feedback: 'MRI uses magnetic fields for imaging, not radiation therapy.' }
    ],
    timeLimit: 8,
    momentumPath: 'always'
  },
  {
    id: 'q2-beam-penetration',
    text: '"Here\'s an important concept: Higher energy beams penetrate..."',
    options: [
      { text: 'Deeper into tissue', isCorrect: true, feedback: 'Perfect! Higher energy means better penetration - crucial for treating deep tumors.' },
      { text: 'Less deep into tissue', isCorrect: false, feedback: 'Actually, it\'s the opposite - higher energy penetrates deeper.' },
      { text: 'Same depth regardless', isCorrect: false, feedback: 'Energy definitely affects how deep the beam can reach.' }
    ],
    timeLimit: 8,
    momentumPath: 'always'
  },
  
  // Low Momentum Path (Basic Safety)
  {
    id: 'q3a-radiation-safety',
    text: '"Safety first! A door says \'Radiation On\' in big red letters. You should..."',
    options: [
      { text: 'Stay out', isCorrect: true, feedback: 'Absolutely right! Those warning signs are there to protect us.' },
      { text: 'Go in anyway', isCorrect: false, feedback: 'Never ignore radiation warning signs - safety always comes first!' },
      { text: 'Knock first', isCorrect: false, feedback: 'When radiation is on, the area is off-limits. No exceptions!' }
    ],
    timeLimit: 6,
    momentumPath: 'low'
  },
  {
    id: 'q4a-shielding-basics',
    text: '"Lead blocks radiation, right?"',
    options: [
      { text: 'True', isCorrect: true, feedback: 'Correct! Lead is excellent at stopping radiation - that\'s why we use it for shielding.' },
      { text: 'False', isCorrect: false, feedback: 'Actually, lead is one of our best materials for radiation shielding.' }
    ],
    timeLimit: 6,
    momentumPath: 'low'
  },
  
  // Medium Momentum Path (Quality & Energy)
  {
    id: 'q3b-daily-qa',
    text: '"Daily quality checks ensure our radiation beam has the..."',
    options: [
      { text: 'Right intensity', isCorrect: true, feedback: 'Exactly! We check beam intensity daily to ensure consistent, safe treatments.' },
      { text: 'Right color', isCorrect: false, feedback: 'Radiation doesn\'t have color - we measure energy and intensity instead.' },
      { text: 'Right sound', isCorrect: false, feedback: 'Sound isn\'t what we\'re concerned about with radiation beams.' }
    ],
    timeLimit: 8,
    momentumPath: 'medium'
  },
  {
    id: 'q4b-surface-treatment',
    text: '"Patient\'s got a surface tumor. Better to use..."',
    options: [
      { text: 'Lower energy (less penetration)', isCorrect: true, feedback: 'Smart choice! For surface tumors, lower energy keeps the dose where we want it.' },
      { text: 'Higher energy (more penetration)', isCorrect: false, feedback: 'Higher energy would go too deep for a surface tumor.' },
      { text: 'No energy (no treatment)', isCorrect: false, feedback: 'We definitely need to treat the tumor - just with the right energy!' }
    ],
    timeLimit: 8,
    momentumPath: 'medium'
  },
  
  // High Momentum Path (Clinical Application)
  {
    id: 'q3c-deep-treatment',
    text: '"Patient needs a chest treatment. Better to use higher energy or lower energy for deeper tumors?"',
    options: [
      { text: 'Higher energy (penetrates deeper)', isCorrect: true, feedback: 'Excellent! For deep chest tumors, we need higher energy to reach the target effectively.' },
      { text: 'Lower energy (stays at surface)', isCorrect: false, feedback: 'Lower energy won\'t reach deep enough for chest tumors.' },
      { text: 'Doesn\'t matter', isCorrect: false, feedback: 'Energy selection is crucial for effective treatment delivery!' }
    ],
    timeLimit: 10,
    momentumPath: 'high'
  },
  {
    id: 'q4c-room-shielding',
    text: '"Treatment rooms have thick concrete walls because..."',
    options: [
      { text: 'Radiation shielding', isCorrect: true, feedback: 'Exactly! Those thick walls protect everyone outside the treatment room.' },
      { text: 'Sound dampening', isCorrect: false, feedback: 'While they might reduce sound, the main purpose is radiation protection.' },
      { text: 'Temperature control', isCorrect: false, feedback: 'Temperature isn\'t the concern - it\'s all about radiation safety.' }
    ],
    timeLimit: 10,
    momentumPath: 'high'
  },
  
  // Final Questions (Always Shown)
  {
    id: 'q9-dose-units',
    text: '"We measure radiation dose in..."',
    options: [
      { text: 'Gray (Gy)', isCorrect: true, feedback: 'Perfect! Gray is our standard unit for measuring absorbed radiation dose.' },
      { text: 'Pounds (lbs)', isCorrect: false, feedback: 'Pounds measure weight - we need a radiation-specific unit.' },
      { text: 'Degrees (°C)', isCorrect: false, feedback: 'Degrees measure temperature - radiation dose has its own unit.' }
    ],
    timeLimit: 6,
    momentumPath: 'always'
  },
  {
    id: 'q10-interlock-safety',
    text: '"You\'re setting up a treatment and notice the door interlock light is flickering. What\'s your call?"',
    options: [
      { text: 'Stop and check the interlock system', isCorrect: true, feedback: 'Absolutely right! Never ignore safety system warnings - investigate first.' },
      { text: 'Continue if patient is waiting', isCorrect: false, feedback: 'Patient safety requires working safety systems - always check issues first.' },
      { text: 'Just ignore the flickering', isCorrect: false, feedback: 'Safety systems are critical - never ignore potential malfunctions!' }
    ],
    timeLimit: 8,
    momentumPath: 'always'
  },
  {
    id: 'q11-xray-target',
    text: '"The part that actually makes the X-rays is called the..."',
    options: [
      { text: 'Target', isCorrect: true, feedback: 'Correct! The target is where electrons hit to produce our therapeutic X-rays.' },
      { text: 'Couch', isCorrect: false, feedback: 'The couch holds the patient - the target creates the X-rays.' },
      { text: 'Computer', isCorrect: false, feedback: 'Computers control things, but the target is where X-rays are made.' }
    ],
    timeLimit: 8,
    momentumPath: 'always'
  },
  {
    id: 'q12-future-learning',
    text: '"Next time you\'re here, what would you like to dive deeper into?"',
    options: [
      { text: 'Daily QA procedures', isCorrect: true, feedback: 'Great choice! Quality assurance is essential for safe, effective treatments.' },
      { text: 'Advanced troubleshooting', isCorrect: true, feedback: 'Excellent! Problem-solving skills are invaluable in radiation therapy.' },
      { text: 'Treatment planning integration', isCorrect: true, feedback: 'Perfect! Understanding how planning connects to delivery is key.' }
    ],
    timeLimit: 10,
    momentumPath: 'always'
  }
];

// Test abilities for Quinn tutorial (simplified version)
const testAbilities = [
  {
    id: 'theoretical_insight',
    name: 'Theoretical Insight',
    description: 'Reveal underlying physics principles',
    cost: 25,
    effect: 'Shows additional theoretical context'
  },
  {
    id: 'conceptual_bridge',
    name: 'Conceptual Bridge',
    description: 'Connect concepts across domains',
    cost: 30,
    effect: 'Links current concept to related physics'
  },
  {
    id: 'mathematical_clarity',
    name: 'Mathematical Clarity',
    description: 'Illuminate mathematical relationships',
    cost: 35,
    effect: 'Shows relevant equations and derivations'
  },
  {
    id: 'systems_thinking',
    name: 'Systems Thinking',
    description: 'See the bigger theoretical picture',
    cost: 40,
    effect: 'Reveals how concepts fit in overall framework'
  }
];

// Helper function to determine momentum level
const getMomentumLevel = (momentum: number): 'low' | 'medium' | 'high' => {
  if (momentum <= 3) return 'low';
  if (momentum <= 6) return 'medium';
  return 'high';
};

// === CANVAS SCALING SYSTEM === 
// Tutorial uses 640×360 internal coordinates (matching architecture standard)
const TUTORIAL_INTERNAL_WIDTH = 640;
const TUTORIAL_INTERNAL_HEIGHT = 360;

// Canvas-appropriate typography scale for 640×360 coordinate system
const CanvasFonts = {
  xs: '8px',   // For small tooltips and labels
  sm: '10px',  // For secondary text and values
  md: '12px',  // For primary content text
  lg: '14px',  // For headings and important text
  xl: '16px'   // For major headings (rarely used in UI)
};

const UICoordinates = {
  abilityBar: {
    right: 60,      // Moved further right (reduced from 88)
    gap: 4,         // Spacing in internal coordinates
    padding: '6px 8px', // Padding in internal coordinates
  }
};

// Canvas Scaling System Container - follows NarrativeDialogue pattern
const Container = styled.div`
  /* Use 640×360 internal coordinate system - scale entire container to fit viewport */
  width: ${TUTORIAL_INTERNAL_WIDTH}px;
  height: ${TUTORIAL_INTERNAL_HEIGHT}px;
  
  /* Center and scale container to fit viewport while maintaining aspect ratio */
  position: fixed;
  top: 50%;
  left: 50%;
  transform-origin: center;
  transform: translate(-50%, -50%) scale(var(--tutorial-scale));
  
  /* Background uses native asset dimensions within 640×360 canvas */
  background-image: 
    linear-gradient(rgba(0, 0, 0, 0.8), rgba(0, 0, 0, 0.8)),
    url('/images/hospital/backgrounds/physics-office-blur.png');
  background-size: ${TUTORIAL_INTERNAL_WIDTH}px ${TUTORIAL_INTERNAL_HEIGHT}px; /* Native canvas size */
  background-position: center;
  background-repeat: no-repeat;
  
  font-family: ${typography.fontFamily.pixel};
  color: ${colors.text};
  overflow: visible; /* Allow combo meter and other elements to extend outside */
  
  /* Pixel perfect rendering */
  image-rendering: pixelated;
  -webkit-image-rendering: pixelated;
  -moz-image-rendering: crisp-edges;
  -ms-interpolation-mode: nearest-neighbor;
`;

const ContentArea = styled.div`
  position: absolute;
  top: 50%;
  left: 45%; /* Shifted left from 50% to make more room for ability bar */
  transform: translate(-50%, -50%);
  width: 320px; /* Reduced width to give more room for ability bars */
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px; /* Scaled gap */
  z-index: 10;
  overflow: visible; /* Allow combo meter to extend outside */
`;

// QuestionContainer now uses PixelContainer with 9-slice for authentic pixel art
const QuestionContainerWrapper = styled.div`
  width: 100%;
  text-align: center;
  position: relative; /* Enable absolute positioning for independent combo meter */
  
  /* Allow combo sprite to extend outside without being clipped */
  overflow: visible;
  contain: layout style;
`;

// Quinn emblem for story book layout - positioned absolutely to control text flow precisely
const QuinnEmblem = styled.img`
  /* NATIVE ASSET DIMENSIONS - 64×64px for perfect pixel density */
  width: 64px;
  height: 64px;
  position: absolute;
  top: 0;
  left: 0;
  
  /* Pixel perfect rendering */
  image-rendering: pixelated;
  -webkit-image-rendering: pixelated;
  -moz-image-rendering: crisp-edges;
  -ms-interpolation-mode: nearest-neighbor;
  
  /* Ensure proper visibility and contrast */
  opacity: 1.0;
  filter: contrast(1.1) brightness(1.0);
  
  /* Prevent layout shifts */
  flex-shrink: 0;
  z-index: 1;
`;

const QuestionText = styled.div`
  font-family: ${typography.fontFamily.pixel};
  color: ${colors.text};
  font-size: ${CanvasFonts.md}; /* Standard content text size for canvas */
  line-height: 1.2; /* Tighter line height */
  margin-bottom: 8px; /* Scaled margin for internal coordinates */
  text-align: left;
  position: relative; /* Enable absolute positioning for emblem */
  
  /* Text starts at top line but indented to clear the emblem */
  padding-left: 72px; /* 64px emblem + 8px margin */
  min-height: 64px; /* Ensure container is at least as tall as emblem */
`;

const OptionsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px; /* Scaled gap for 640×360 canvas */
  margin-top: 6px; /* Scaled margin for internal coordinates */
  
  /* Prevent scrollbar flicker from text-shadow effects */
  overflow: hidden;
  contain: layout style; /* Prevent layout shifts from visual effects */
  padding: 0 2px; /* Scaled padding to contain glow effects */
`;

// Typography override wrapper - maintains PNG assets while fixing canvas scaling
const CanvasTypographyOverride = styled.div`
  /* Override any inherited theme typography for canvas compatibility */
  font-size: ${CanvasFonts.md} !important;
  line-height: 1.4 !important;
  
  /* Ensure all child elements inherit canvas-appropriate sizing */
  * {
    font-size: inherit !important;
    line-height: inherit !important;
  }
`;



// Portrait system removed - now using emblem inside question container for story book layout

// Old momentum and insight bar components removed - now using combo sprite overlay



// Ability bar background image - uses IMG element for proper canvas scaling
const AbilityBarBackground = styled.img`
  /* NATIVE ASSET DIMENSIONS - 90×240px for perfect pixel density */
  width: 90px;
  height: 240px;
  position: absolute;
  top: 0;
  left: 0;
  
  /* Pixel perfect rendering */
  image-rendering: pixelated;
  -webkit-image-rendering: pixelated;
  -moz-image-rendering: crisp-edges;
  image-rendering: -webkit-optimize-contrast;
  
  /* Ensure proper visibility and contrast */
  opacity: 1.0;
  filter: contrast(1.1) brightness(1.0);
  
  pointer-events: none; /* Allow clicks through to content */
  z-index: 1;
`;

// Ability bar container - positioned using internal coordinates 
const AbilitiesBarContainer = styled.div`
  position: absolute;
  top: 50%;
  right: ${UICoordinates.abilityBar.right}px;
  transform: translateY(-50%);
  
  /* NATIVE ASSET DIMENSIONS - 90×240px for perfect pixel density */
  width: 90px;  
  height: 240px; 
  
  /* Layout for content within container */
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center; /* Center vertically instead of flex-end */
  gap: ${UICoordinates.abilityBar.gap}px;
  padding: ${UICoordinates.abilityBar.padding};
  padding-bottom: 15px; /* Add extra bottom padding to nudge slots up */
  z-index: 100;
  overflow: visible; /* Allow slots to be visible */
`;

const AbilitySlot = styled.div<{ $isPlaceholder?: boolean }>`
  position: relative;
  /* NATIVE ASSET DIMENSIONS - 58×58px for perfect pixel density */
  width: 58px;
  height: 58px;
  
  /* Layout */
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: ${props => props.$isPlaceholder ? 'not-allowed' : 'pointer'};
  transition: all 0.3s ease;
  opacity: ${props => props.$isPlaceholder ? 0.7 : 1};
  overflow: visible;
  z-index: 2; /* Above ability panel background */

  &:hover {
    ${props => props.$isPlaceholder && `
      opacity: 0.9;
      transform: scale(1.05);
    `}
  }
`;

// Ability slot background - IMG element following architecture guidelines
const AbilitySlotBackground = styled.img`
  /* NATIVE ASSET DIMENSIONS - 58×58px for perfect pixel density */
  width: 58px;
  height: 58px;
  position: absolute;
  top: 0;
  left: 0;
  
  /* Ensure visibility */
  opacity: 1;
  visibility: visible;
  display: block;
  
  /* Pixel perfect rendering following architecture standards */
  image-rendering: pixelated;
  -webkit-image-rendering: pixelated;
  -moz-image-rendering: crisp-edges;
  -ms-interpolation-mode: nearest-neighbor;
  
  pointer-events: none; /* Allow clicks through to slot */
  z-index: 2; /* Above ability panel background (z:1) */
`;

const AbilityIcon = styled.div`
  font-family: ${typography.fontFamily.pixel};
  color: ${colors.textDim};
  font-size: ${CanvasFonts.lg}; /* Heading size for important icons */
  font-weight: bold;
  position: relative;
  z-index: 3; /* Above background image (z:2) */
`;

const AbilityTooltip = styled.div<{ $visible: boolean }>`
  position: absolute;
  left: -50px; /* Properly scaled for 40px ability slots */
  top: 50%;
  transform: translateY(-50%);
  background: rgba(0, 0, 0, 0.9);
  font-family: ${typography.fontFamily.pixel};
  color: ${colors.text};
  font-size: ${CanvasFonts.xs}; /* Small text size for tooltips */
  line-height: 1.2;
  padding: 2px 4px; /* Properly scaled padding */
  border-radius: 2px; /* Properly scaled radius */
  white-space: nowrap;
  visibility: ${props => props.$visible ? 'visible' : 'hidden'};
  opacity: ${props => props.$visible ? 1 : 0};
  transition: all ${animation.duration.fast} ease;
  z-index: 1020; /* Above all other elements */
  pointer-events: none;
  
  &::after {
    content: '';
    position: absolute;
    left: 100%;
    top: 50%;
    transform: translateY(-50%);
    border: 4px solid transparent; /* Slightly bigger arrow */
    border-left-color: rgba(0, 0, 0, 0.9);
  }
`;

const ResourceDisplay = styled.div`
  display: flex;
  align-items: center;
  gap: 6px; /* Smaller gap */
  font-family: ${typography.fontFamily.pixel};
  color: ${colors.textDim};
  font-size: ${CanvasFonts.sm}; /* Secondary text size */
  margin-right: 8px; /* Less margin */
  padding-right: 8px; /* Less padding */
  border-right: 1px solid #3d5a80;
`;

const ResourceValue = styled.span`
  font-family: ${typography.fontFamily.pixel};
  color: ${colors.text};
  font-weight: bold;
  font-size: ${CanvasFonts.sm}; /* Secondary text size */
`;

// Mastery popup component using modern pixel container system
const MasteryPopupContainer = styled.div<{ $visible: boolean; $level: number }>`
  position: absolute;
  top: 53px; /* Canvas coordinate positioning - shifted up 4px from star bar */
  left: 50px; /* Canvas coordinate positioning - avoid book icon overlap */
  z-index: 1000;
  
  /* Modern pixel container animation */
  opacity: ${props => props.$visible ? 1 : 0};
  transform: ${props => props.$visible ? 'translateY(0)' : 'translateY(-10px)'};
  transition: opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1), 
              transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  
  /* Ensure proper visibility and overflow */
  pointer-events: ${props => props.$visible ? 'auto' : 'none'};
  overflow: visible;
`;

// Content wrapper for mastery notification
const MasteryContent = styled.div<{ $level: number }>`
  color: ${props => 
    props.$level === 1 ? colors.textDim :
    props.$level === 2 ? colors.active :
    colors.highlight
  };
  display: flex;
  align-items: center;
  gap: 4px; /* Canvas scaled spacing */
  
  &::before {
    content: '+';
    font-weight: bold;
    font-size: inherit;
  }
`;

// Star bar component - positioned at top left using canvas coordinates
const StarBarContainer = styled.div`
  position: absolute;
  top: 10px; /* Internal coordinate positioning - matches MasteryCounterContainer */
  left: 10px; /* Internal coordinate positioning - small margin from edge */
  z-index: 1050; /* Above most other elements */
`;



// Star bar animation - 81 frames sprite sheet (single row) with in-place fill animation
const StarBarImage = styled.div<{ $starLevel: number }>`
  /* NATIVE ASSET DIMENSIONS - 146×40px for perfect pixel density */
  width: 146px;
  height: 40px;
  position: relative;
  
  /* Base star bar image (empty/full frame for reference) */
  background-image: url('/images/ui/star-bar.png');
  background-size: ${81 * 146}px 40px; /* 81 frames * 146px width each */
  background-repeat: no-repeat;
  background-position: 0px 0px; /* Always show first frame as base */
  
  /* Pixel perfect rendering */
  image-rendering: pixelated;
  -webkit-image-rendering: pixelated;
  -moz-image-rendering: crisp-edges;
  -ms-interpolation-mode: nearest-neighbor;
  
  /* Progressive fill overlay */
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 146px;
    height: 40px;
    
    /* Show the filled frame */
    background-image: url('/images/ui/star-bar.png');
    background-size: ${81 * 146}px 40px;
    background-repeat: no-repeat;
    background-position: ${props => {
      // Show the fully filled frame (frame 80)
      return `${80 * -146}px 0px`;
    }};
    
    /* Clip to show progress from left to right */
    clip-path: ${props => {
      const progressPercent = Math.min(100, Math.max(0, props.$starLevel));
      return `inset(0 ${100 - progressPercent}% 0 0)`;
    }};
    
    /* Smooth animation transitions */
    transition: clip-path 0.6s cubic-bezier(0.4, 0, 0.2, 1);
    
    /* Match parent rendering */
    image-rendering: pixelated;
    -webkit-image-rendering: pixelated;
    -moz-image-rendering: crisp-edges;
    -ms-interpolation-mode: nearest-neighbor;
  }
  
  /* Ensure proper visibility */
  opacity: 1.0;
  filter: contrast(1.1) brightness(1.0);
`;

// === REWARD SEQUENCE COMPONENTS ===

// Animated star bar for reward sequence - simplified version accepting the delay
const RewardStarBarImage = styled.div<{ $starLevel: number; $isAnimating: boolean; $showStarPop: boolean }>`
  /* NATIVE ASSET DIMENSIONS - 146×40px for perfect pixel density */
  width: 146px;
  height: 40px;
  
  /* Base star bar image (empty frame) */
  background-image: url('/images/ui/star-bar.png');
  background-size: ${81 * 146}px 40px; /* 81 frames * 146px width each */
  background-repeat: no-repeat;
  background-position: 0px 0px; /* Empty frame as base */
  
  /* Pixel perfect rendering */
  image-rendering: pixelated;
  -webkit-image-rendering: pixelated;
  -moz-image-rendering: crisp-edges;
  -ms-interpolation-mode: nearest-neighbor;
  
  /* Star pop effect */
  transform: ${props => props.$showStarPop ? 'scale(1.15)' : 'scale(1)'};
  filter: ${props => props.$showStarPop ? 'brightness(1.4) drop-shadow(0 0 12px #FFD700)' : 'contrast(1.1) brightness(1.0)'};
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), 
              filter 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  
  /* Fill overlay using ::after pseudo-element */
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-image: url('/images/ui/star-bar.png');
    background-size: ${81 * 146}px 40px;
    background-repeat: no-repeat;
    background-position: ${80 * -146}px 0px; /* Fully filled frame */
    
    /* Progressive fill using clip-path */
    clip-path: inset(0 ${props => 100 - props.$starLevel}% 0 0);
    transition: clip-path 0.5s cubic-bezier(0.4, 0, 0.2, 1);
    
    /* Match parent rendering */
    image-rendering: pixelated;
    -webkit-image-rendering: pixelated;
    -moz-image-rendering: crisp-edges;
    -ms-interpolation-mode: nearest-neighbor;
  }
`;

// Compact question result indicator for reward sequence - much smaller format
const QuestionResultIndicator = styled.div<{ $isVisible: boolean; $isCorrect: boolean; $animationDelay: number }>`
  display: inline-block;
  padding: 2px 4px; /* Much smaller padding */
  margin: 1px 1px; /* Even tighter margin for closer spacing */
  
  font-family: ${typography.fontFamily.pixel};
  font-size: 8px; /* Even smaller than CanvasFonts.xs */
  line-height: 1.0;
  
  background: ${props => props.$isCorrect ? 'rgba(76, 175, 80, 0.3)' : 'rgba(244, 67, 54, 0.3)'};
  border: 1px solid ${props => props.$isCorrect ? 'rgba(76, 175, 80, 0.6)' : 'rgba(244, 67, 54, 0.6)'};
  border-radius: 2px; /* Smaller radius */
  
  color: ${props => props.$isCorrect ? '#4CAF50' : '#FF5722'};
  font-weight: bold;
  
  /* Animation entrance */
  opacity: ${props => props.$isVisible ? 1 : 0};
  transform: ${props => props.$isVisible ? 'scale(1)' : 'scale(0.5)'};
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  transition-delay: ${props => props.$animationDelay}s;
`;

// Star formation effect overlay
const StarFormationEffect = styled.div<{ $isActive: boolean }>`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
  z-index: 1100;
  
  /* Burst effect */
  &::before {
    content: '★';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    
    font-size: 32px; /* Large star */
    color: #FFD700;
    text-shadow: 0 0 20px #FFD700, 0 0 40px #FFD700;
    
    /* Pop animation */
    opacity: ${props => props.$isActive ? 1 : 0};
    transform: ${props => props.$isActive ? 'translate(-50%, -50%) scale(1.5)' : 'translate(-50%, -50%) scale(0.5)'};
    transition: all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1); /* Bouncy easing */
  }
  
  /* Radiating particles effect */
  &::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    
    width: 80px;
    height: 80px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(255, 215, 0, 0.3) 0%, transparent 70%);
    
    opacity: ${props => props.$isActive ? 1 : 0};
    transform: ${props => props.$isActive ? 'translate(-50%, -50%) scale(1.8)' : 'translate(-50%, -50%) scale(0.2)'};
    transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
  }
`;

// Pulsing text animation for calculating progress
const PulsingText = styled.div<{ $isVisible: boolean; $isAnimating: boolean }>`
  font-size: ${typography.fontSize.sm};
  color: ${colors.textDim};
  font-family: ${typography.fontFamily.pixel};
  text-align: center;
  
  opacity: ${props => props.$isVisible ? (props.$isAnimating ? 1 : 0) : 0};
  animation: ${props => props.$isAnimating ? 'pulse 2s ease-in-out infinite' : 'none'};
  transition: opacity 0.5s ease-out;
  
  @keyframes pulse {
    0%, 100% { opacity: 0.4; }
    50% { opacity: 1; }
  }
`;

// Reward sequence container - centered positioning with narrower width
const RewardSequenceContainer = styled.div<{ $isVisible: boolean }>`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  
  width: 360px; /* Narrower width - reduced from 480px */
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px; /* Canvas scaled spacing */
  
  opacity: ${props => props.$isVisible ? 1 : 0};
  transition: opacity 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  
  z-index: 1000; /* Above other elements */
`;

// Question results list - horizontal layout (left to right)
const QuestionResultsList = styled.div`
  width: 100%;
  max-width: 480px; /* Wider for horizontal layout */
  display: flex;
  flex-wrap: wrap; /* Allow wrapping if needed */
  gap: 4px; /* Reduced from 8px for tighter spacing */
  justify-content: center;
  padding: 12px;
  
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  min-height: 48px; /* Slightly taller for single row */
`;

// Momentum-Insight combo - overlaid positioning (single 54x155 composite)
const MomentumInsightComboContainer = styled.div<{ $isHighlighted?: boolean }>`
  position: fixed; /* Position relative to viewport, not parent container */
  top: 50%; /* Center vertically on screen */
  right: -25px; /* Position from right edge of screen */
  transform: translateY(-50%); /* Center vertically */
  z-index: ${props => props.$isHighlighted ? 1075 : 1060}; /* Much higher when highlighted to appear above backdrop (1065) */
  pointer-events: none; /* Allow clicks to pass through */
  
  /* Container dimensions match single sprite - both overlay into one */
  width: 54px; /* Single sprite width - both bars composite into this */
  height: 155px;
  
  /* Break out of backdrop-filter context when highlighted */
  ${props => props.$isHighlighted && `
    isolation: isolate;
    filter: brightness(1.2) drop-shadow(0 0 12px rgba(255, 215, 0, 0.8));
  `}
`;

// Momentum bar sprite - discrete frame animation (overlaid positioning)
const MomentumBarSprite = styled.div<{ $momentumLevel: number }>`
  position: absolute; /* Overlay positioning */
  top: 0;
  left: 0;
  width: 54px; /* Full native width */
  height: 155px;
  
  /* Discrete frame animation - no smooth transitions for momentum */
  background-image: url('/images/ui/momentum-combo.png');
  background-size: 594px 155px;
  background-repeat: no-repeat;
  background-position: ${props => {
    // Use integer momentum level directly for discrete frames (0-10)
    const momentumFrame = Math.min(10, Math.floor(props.$momentumLevel));
    return `${momentumFrame * -54}px 0px`;
  }};
  
  /* Pixel perfect rendering */
  image-rendering: pixelated;
  -webkit-image-rendering: pixelated;
  -moz-image-rendering: crisp-edges;
  -ms-interpolation-mode: nearest-neighbor;
`;

// Insight bar sprite - full 54px width (native dimensions) - traditional in-place fill animation (overlaid positioning)
const InsightBarSprite = styled.div<{ $insightLevel: number }>`
  position: absolute; /* Overlay positioning */
  top: 0;
  left: 0;
  width: 54px; /* Full native width */
  height: 155px;
  
  /* Base sprite (empty state - frame 0) */
  background-image: url('/images/ui/insight-combo.png');
  background-size: 4374px 155px;
  background-position: 0px 0px; /* Always show frame 0 (empty) as base */
  background-repeat: no-repeat;
  
  /* Pixel perfect rendering */
  image-rendering: pixelated;
  -webkit-image-rendering: pixelated;
  -moz-image-rendering: crisp-edges;
  -ms-interpolation-mode: nearest-neighbor;
  
  /* Fill overlay using ::after pseudo-element */
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 54px;
    height: 155px;
    
    /* Full sprite (filled state - frame 80) */
    background-image: url('/images/ui/insight-combo.png');
    background-size: 4374px 155px;
    background-position: ${80 * -54}px 0px; /* Frame 80 (fully filled) */
    background-repeat: no-repeat;
    
    /* Progressive reveal based on insight level */
    clip-path: ${props => {
      const progressPercent = Math.min(100, (props.$insightLevel / 100) * 100);
      return `inset(${100 - progressPercent}% 0 0 0)`; /* Reveal from bottom to top */
    }};
    
    /* Pixel perfect rendering */
    image-rendering: pixelated;
    -webkit-image-rendering: pixelated;
    -moz-image-rendering: crisp-edges;
    -ms-interpolation-mode: nearest-neighbor;
    
    /* Smooth fill animation */
    transition: clip-path 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  }
`;

// === TUTORIAL OVERLAY SYSTEM ===
// Dark overlay with cutout for meter area
const TutorialOverlayBackdrop = styled.div<{ $isVisible: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1065; /* Above normal UI but below highlighted elements */
  
  /* Simple dark overlay - meters render separately above this */
  background: rgba(0, 0, 0, 0.8);
  
  /* Animation */
  opacity: ${props => props.$isVisible ? 1 : 0};
  visibility: ${props => props.$isVisible ? 'visible' : 'hidden'};
  transition: opacity 0.5s cubic-bezier(0.4, 0, 0.2, 1),
              visibility 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  
  /* Allow clicks only when visible */
  pointer-events: ${props => props.$isVisible ? 'all' : 'none'};
`;

// Tutorial explanation modal - centered on screen
const TutorialExplanationModal = styled.div<{ $isVisible: boolean }>`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 1080; /* Above backdrop */
  
  /* Clean modal styling - no border or background */
  padding: 32px 40px;
  max-width: 500px;
  width: 90%;
  
  /* Smooth fade-in animation */
  opacity: ${props => props.$isVisible ? 1 : 0};
  transform: ${props => props.$isVisible ? 'translate(-50%, -50%)' : 'translate(-50%, -50%)'};
  transition: opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  
  /* Typography */
  font-family: ${typography.fontFamily.pixel};
  color: ${colors.text};
  text-align: center;
`;

// Tutorial modal title
const TutorialModalTitle = styled.h3`
  margin: 0 0 20px 0;
  font-size: 48px; /* Very large for clear visibility */
  font-weight: bold;
  color: #FFD700;
  line-height: 1.2;
  text-shadow: 0 0 8px rgba(255, 215, 0, 0.4);
`;

// Tutorial modal content
const TutorialModalContent = styled.div`
  font-size: 24px; /* Very large for clear readability */
  line-height: 1.4;
  color: ${colors.text};
  margin-bottom: 24px;
  text-align: left;
  
  /* Highlight important terms */
  strong {
    color: #FFD700;
    font-weight: bold;
  }
  
  /* System term styling */
  .system-term {
    color: #4CAF50;
    font-weight: bold;
    text-shadow: 0 0 2px rgba(76, 175, 80, 0.4);
  }
`;

// Continue button for tutorial modal
const TutorialContinueButton = styled.button`
  background: linear-gradient(135deg, #4CAF50, #45A049);
  border: 2px solid #4CAF50;
  border-radius: 8px;
  color: white;
  font-family: ${typography.fontFamily.pixel};
  font-size: 20px; /* Large button text */
  font-weight: bold;
  padding: 16px 32px; /* Larger padding too */
  cursor: pointer;
  
  transition: all 0.3s ease;
  
  &:hover {
    background: linear-gradient(135deg, #45A049, #4CAF50);
    border-color: #45A049;
    transform: scale(1.05);
    box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
  }
  
  &:active {
    transform: scale(0.98);
  }
`;

interface QuinnTutorialActivityProps {
  onComplete?: () => void;
  debugReportCard?: boolean; // Debug flag to skip directly to report card
}

export default function QuinnTutorialActivity({ onComplete, debugReportCard }: QuinnTutorialActivityProps) {
  const { insight, momentum: resourceMomentum } = useResourceStore();
  const { playerName } = useGameStore();
  const { completeStep } = useTutorialStore();
  
  // === TUTORIAL SCALING SYSTEM ===
  // Calculate scale to fit 640×360 tutorial into viewport while maintaining aspect ratio
  useEffect(() => {
    const updateTutorialScale = () => {
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      const scaleX = viewportWidth / TUTORIAL_INTERNAL_WIDTH;
      const scaleY = viewportHeight / TUTORIAL_INTERNAL_HEIGHT;
      const tutorialScale = Math.min(scaleX, scaleY);
      
      // Set CSS custom property for tutorial scaling
      document.documentElement.style.setProperty('--tutorial-scale', tutorialScale.toString());
      
      // Scale calculation: ${tutorialScale.toFixed(3)} (${viewportWidth}x${viewportHeight} → ${TUTORIAL_INTERNAL_WIDTH}x${TUTORIAL_INTERNAL_HEIGHT})
    };
    
    updateTutorialScale();
    window.addEventListener('resize', updateTutorialScale);
    
    return () => {
      window.removeEventListener('resize', updateTutorialScale);
    };
  }, []);
  
  // Activity phase state - skip intro, start directly with questions
  const [activityPhase, setActivityPhase] = useState<'intro' | 'questions' | 'summary'>('questions');
  
  // Question flow states
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentMomentum, setCurrentMomentum] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  
  // Tutorial overlay states
  const [showTutorialOverlay, setShowTutorialOverlay] = useState(false);
  const [tutorialOverlayType, setTutorialOverlayType] = useState<'momentum_insight' | null>(null);
  const [hasShownMomentumInsightTutorial, setHasShownMomentumInsightTutorial] = useState(false);

  const [questionsCompleted, setQuestionsCompleted] = useState(0);
  const [totalInsightGained, setTotalInsightGained] = useState(0);
  
  // NEW: Mastery tracking system
  const [totalMasteryGained, setTotalMasteryGained] = useState(0);
  const [showMasteryPopup, setShowMasteryPopup] = useState(false);
  const [lastMasteryGain, setLastMasteryGain] = useState(0);
  const [masteryAnimating, setMasteryAnimating] = useState(false);

  // NEW: Question performance tracking for reward sequence
  interface QuestionResult {
    questionId: string;
    questionText: string;
    isCorrect: boolean;
    pointsContributed: number;
    momentumLevel: 'low' | 'medium' | 'high';
  }
  const [questionResults, setQuestionResults] = useState<QuestionResult[]>([]);
  
  // Reward sequence states
  const [showRewardSequence, setShowRewardSequence] = useState(false);
  const [rewardAnimationStage, setRewardAnimationStage] = useState<'waiting' | 'showing-results' | 'filling' | 'star-pop' | 'overflow' | 'complete'>('waiting');
  const [animatedStarProgress, setAnimatedStarProgress] = useState(0);
  const [visibleQuestionResults, setVisibleQuestionResults] = useState(0);
  const [rewardSessionId] = useState(() => Date.now()); // Unique ID for this reward session
  
  // Placeholder abilities state
  const [hoveredAbility, setHoveredAbility] = useState<number | null>(null);
  
  // Momentum and insight animations removed - now using static combo sprite overlay  
  // Individual bar state variables no longer needed
  
  // Get momentum level for visual effects
  const getMomentumLevel = (momentum: number): 'low' | 'medium' | 'high' => {
    if (momentum <= 3) return 'low';
    if (momentum <= 6) return 'medium';
    return 'high';
  };
  
  // === REWARD SEQUENCE ANIMATION LOGIC ===
  // Simplified async/await pattern (following TutorialActivity.tsx approach)
  useEffect(() => {
    if (!showRewardSequence) return;
    
    // Capture questionResults at the start to avoid dependency issues
    const currentQuestionResults = questionResults;
    
    const runRewardSequence = async () => {
      const totalStarPoints = currentQuestionResults.reduce((sum, result) => sum + result.pointsContributed, 0);
      const overflowPoints = Math.max(0, totalStarPoints - 100);
      
      console.log(`🌟 New Reward Sequence: ${totalStarPoints} total points, overflow: ${overflowPoints}`);
      
      // PHASE 1: Show all question results quickly (horizontal layout)
      setRewardAnimationStage('showing-results');
      setAnimatedStarProgress(0); // Keep star bar empty
      
      // Show all results at once with quick staggered animation
      for (let i = 0; i < currentQuestionResults.length; i++) {
        setVisibleQuestionResults(i + 1);
        await new Promise(resolve => setTimeout(resolve, 150)); // Quick display
      }
      
      // Brief pause after all results are shown
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // PHASE 2: Animate star bar fill (single smooth animation)
      setRewardAnimationStage('filling');
      const finalProgress = Math.min(100, (totalStarPoints / 100) * 100);
      
      console.log(`🎯 Star bar animating to: ${finalProgress.toFixed(1)}%`);
      setAnimatedStarProgress(finalProgress);
      
      // Wait for star bar animation to complete
      await new Promise(resolve => setTimeout(resolve, 1200)); // Longer for smooth fill
      
      // PHASE 3: Star formation if needed
      if (finalProgress >= 100) {
        await new Promise(resolve => setTimeout(resolve, 300));
        setRewardAnimationStage('star-pop');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Show overflow if any
        if (overflowPoints > 0) {
          setAnimatedStarProgress((overflowPoints / 100) * 100);
          setRewardAnimationStage('overflow');
        } else {
          setRewardAnimationStage('complete');
        }
      } else {
        setRewardAnimationStage('complete');
      }
    };
    
    runRewardSequence();
    
  }, [showRewardSequence]); // Only depend on showRewardSequence to avoid race conditions
  
  // Debug mode: automatically show report card with mock data
  useEffect(() => {
    if (debugReportCard && !showRewardSequence) {
      console.log('🔧 Debug mode: Creating mock question results for report card');
      
      // Set activity phase to summary for proper rendering
      setActivityPhase('summary');
      
      // Create mock question results with varied performance
      const mockResults: QuestionResult[] = [
        { questionId: 'q1-beam-delivery', questionText: 'Beam delivery basics', isCorrect: true, pointsContributed: 15, momentumLevel: 'high' },
        { questionId: 'q2-beam-penetration', questionText: 'Beam penetration depth', isCorrect: true, pointsContributed: 15, momentumLevel: 'high' },
        { questionId: 'q3-dose-calculation', questionText: 'Dose calculation', isCorrect: false, pointsContributed: 0, momentumLevel: 'medium' },
        { questionId: 'q4-treatment-planning', questionText: 'Treatment planning', isCorrect: true, pointsContributed: 10, momentumLevel: 'medium' },
        { questionId: 'q5-safety-protocols', questionText: 'Safety protocols', isCorrect: true, pointsContributed: 10, momentumLevel: 'medium' },
        { questionId: 'q6-quality-assurance', questionText: 'Quality assurance', isCorrect: true, pointsContributed: 15, momentumLevel: 'high' },
        { questionId: 'q7-patient-setup', questionText: 'Patient setup', isCorrect: true, pointsContributed: 15, momentumLevel: 'high' },
        { questionId: 'q8-imaging-guidance', questionText: 'Imaging guidance', isCorrect: true, pointsContributed: 15, momentumLevel: 'high' }
      ];
      
      setQuestionResults(mockResults);
      
      // Show report card after brief delay
      setTimeout(() => {
        setShowRewardSequence(true);
        console.log('🔧 Debug report card activated with mock results');
      }, 500);
    }
  }, [debugReportCard, showRewardSequence]);
  
  // Get questions based on momentum - memoized to prevent duplicate key issues
  const getAvailableQuestions = useMemo((): Question[] => {
    const questions: Question[] = [];
    const usedIds = new Set<string>(); // Track used IDs to prevent duplicates
    
    // Opening sequence (always shown)
    const openingQuestions = QUINN_QUESTIONS.filter(q => 
      q.id === 'q1-beam-delivery' || q.id === 'q2-beam-penetration'
    );
    openingQuestions.forEach(q => {
      if (!usedIds.has(q.id)) {
        questions.push(q);
        usedIds.add(q.id);
      }
    });
    
    // Momentum-based questions
    const momentumLevel = getMomentumLevel(currentMomentum);
    let momentumQuestions: Question[] = [];
    
    if (momentumLevel === 'low') {
      momentumQuestions = QUINN_QUESTIONS.filter(q => 
        q.id === 'q3a-radiation-safety' || q.id === 'q4a-shielding-basics'
      );
    } else if (momentumLevel === 'medium') {
      momentumQuestions = QUINN_QUESTIONS.filter(q => 
        q.id === 'q3b-daily-qa' || q.id === 'q4b-surface-treatment'
      );
    } else {
      momentumQuestions = QUINN_QUESTIONS.filter(q => 
        q.id === 'q3c-deep-treatment' || q.id === 'q4c-room-shielding'
      );
    }
    momentumQuestions.forEach(q => {
      if (!usedIds.has(q.id)) {
        questions.push(q);
        usedIds.add(q.id);
      }
    });
    
    // Final questions (always shown)
    const finalQuestions = QUINN_QUESTIONS.filter(q => 
      ['q9-dose-units', 'q10-interlock-safety', 'q11-xray-target', 'q12-future-learning'].includes(q.id)
    );
    finalQuestions.forEach(q => {
      if (!usedIds.has(q.id)) {
        questions.push(q);
        usedIds.add(q.id);
      }
    });
    
    // Questions selected (${questions.length}): ${questions.map(q => q.id).join(', ')}
    
    // Debug: Check for duplicates
    const uniqueIds = new Set(questions.map(q => q.id));
    if (uniqueIds.size !== questions.length) {
      console.warn(`⚠️ Duplicate question IDs detected! Expected ${questions.length}, got ${uniqueIds.size} unique`);
    }
    
    return questions;
  }, [currentMomentum]); // Only regenerate when momentum changes
  
  const currentQuestions = getAvailableQuestions;
  const currentQuestion = currentQuestions[currentQuestionIndex];
  
  // Handle answer selection
  const handleAnswerSelect = (optionIndex: number) => {
    setSelectedOption(optionIndex);
    
    const isCorrect = currentQuestion.options[optionIndex].isCorrect;
    let newMomentum = currentMomentum;
    let starPointsContributed = 0;
    
    if (isCorrect) {
      // Update momentum 
      newMomentum = Math.min(10, currentMomentum + 1);
      setCurrentMomentum(newMomentum);
      console.log(`🔥 MOMENTUM GAIN: ${currentMomentum} → ${newMomentum}`);
      
      // Add insight points
      const insightGain = 8 + Math.floor(currentMomentum / 2); // 8-13 points based on momentum
      useResourceStore.getState().updateInsight(insightGain);
      setTotalInsightGained(prev => prev + insightGain);
      console.log(`🎬 Insight gain: +${insightGain} → ${insight + insightGain}`);
      
      // NEW: Calculate mastery gain based on momentum level (use NEW momentum level)
      const finalMomentumLevel = getMomentumLevel(newMomentum);
      const masteryGain = finalMomentumLevel === 'low' ? 1 : 
                         finalMomentumLevel === 'medium' ? 2 : 3;
      
      // Calculate star points contribution (used in reward sequence)
      starPointsContributed = finalMomentumLevel === 'low' ? 10 : 
                             finalMomentumLevel === 'medium' ? 15 : 20;
      
      console.log(`📚 MASTERY: ${finalMomentumLevel} momentum = +${masteryGain} Beam Physics, +${starPointsContributed} star points`);
      
      // Update mastery with animation
      setLastMasteryGain(masteryGain);
      setShowMasteryPopup(true);
      setMasteryAnimating(true);
      
      // Clear animations
      setTimeout(() => {
        setMasteryAnimating(false);
      }, 600);
      setTimeout(() => {
        setShowMasteryPopup(false);
      }, 1500);
      
      setTotalMasteryGained(prev => {
        const newTotal = prev + masteryGain;
        console.log(`📊 Total Mastery: ${prev} → ${newTotal} (+${masteryGain})`);
        return newTotal;
      });
      
      // Trigger tutorial overlay after first correct answer
      if (!hasShownMomentumInsightTutorial && currentQuestionIndex === 0) {
        console.log('🎓 [TUTORIAL] Triggering momentum/insight explanation after first correct answer');
        setTimeout(() => {
          setTutorialOverlayType('momentum_insight');
          setShowTutorialOverlay(true);
          setHasShownMomentumInsightTutorial(true);
        }, 800); // Reduced from 2000ms - trigger shortly after mastery popup
      }
    } else {
      // Handle momentum loss
      newMomentum = Math.max(0, currentMomentum - 1);
      setCurrentMomentum(newMomentum);
      starPointsContributed = 2; // Small consolation points for incorrect answers
      console.log(`🔥 MOMENTUM LOSS: ${currentMomentum} → ${newMomentum}, +${starPointsContributed} star points`);
    }
    
    // Track this question's result for reward sequence
    const questionResult: QuestionResult = {
      questionId: currentQuestion.id,
      questionText: currentQuestion.text.replace(/"/g, ''), // Clean up quotes
      isCorrect,
      pointsContributed: starPointsContributed,
      momentumLevel: getMomentumLevel(newMomentum)
    };
    setQuestionResults(prev => [...prev, questionResult]);
    
    setQuestionsCompleted(prev => prev + 1);
    
    // Auto-advance to next question immediately
    setTimeout(() => {
      setSelectedOption(null);
      
      if (currentQuestionIndex < currentQuestions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
      } else {
        // Transition to reward sequence instead of simple summary
        setActivityPhase('summary');
        // Ensure stage is ready to animate before the effect runs
        setRewardAnimationStage('filling');
        setAnimatedStarProgress(0);
        setShowRewardSequence(true);
      }
    }, 1000); // Shortened delay from 3000ms to 1000ms for faster progression
  };
  
  // Memoized question text with story book emblem layout
  const memoizedQuestionText = useMemo(() => {
    if (activityPhase === 'questions' && currentQuestion) {
      return (
        <QuestionText>
          {/* Quinn emblem floated to top left for story book text wrapping */}
          <QuinnEmblem 
            src="/images/characters/portraits/quinn-medium-emblem.png" 
            alt="Dr. Quinn"
          />
          <TypewriterText
            key={`question-${currentQuestion.id}-${currentQuestionIndex}`}
            text={currentQuestion.text}
            speed={25}
            onComplete={() => {}}
            style={{
              fontSize: CanvasFonts.lg, // Increased from md (12px) to lg (14px) for better readability
              lineHeight: typography.lineHeight.tight // Override TypewriterText's default 1.6
            }}
          />
        </QuestionText>
      );
    }
    return null;
  }, [activityPhase, currentQuestion?.id, currentQuestion?.text, currentQuestionIndex]);
  
  const handleStartQuestions = () => {
    setActivityPhase('questions');
  };
  
  const handleComplete = () => {
    completeStep('quinn_activity');
    onComplete?.();
  };
  
  // Handle tutorial overlay dismiss
  const handleTutorialOverlayDismiss = () => {
    setShowTutorialOverlay(false);
    setTutorialOverlayType(null);
  };
  
  // Render tutorial overlay content based on type
  const renderTutorialOverlayContent = () => {
    switch (tutorialOverlayType) {
      case 'momentum_insight':
        return {
          title: "Your Learning Progress",
          content: (
            <>
              Great job on your first correct answer! You're now earning two key resources: <strong>Momentum</strong> <span className="system-term">(Red Bar)</span> shows your confidence level and unlocks more challenging questions with bigger rewards. <strong>Insight</strong> <span className="system-term">(Blue Bar)</span> represents your accumulated knowledge points that you can use to unlock special abilities and deepen your understanding. Watch these meters grow as you answer correctly - they're your path to mastery!
            </>
          )
        };
      default:
        return { title: "Tutorial", content: "Tutorial information" };
    }
  };
  
  // Render different phases
  const renderContent = () => {
    switch (activityPhase) {
      case 'intro':
        return (
          <ContentArea>
            <QuestionContainerWrapper>
              <ExpandableQuestionContainer domain="physics">
                <h2 style={{ color: '#e8f4f8', marginBottom: '20px' }}>
                  Beam Basics
                </h2>
                <p style={{ color: '#98b4c7', fontSize: '16px', lineHeight: '1.6' }}>
                  "Let's start with some essential radiation therapy basics."
                </p>
                <button
                  onClick={handleStartQuestions}
                  style={{
                    background: 'rgba(63, 81, 181, 0.8)',
                    border: '2px solid #3f51b5',
                    color: '#e8f4f8',
                    padding: '15px 30px',
                    borderRadius: '10px',
                    fontSize: '16px',
                    cursor: 'pointer',
                    marginTop: '20px'
                  }}
                >
                  Start Questions
                </button>
              </ExpandableQuestionContainer>
            </QuestionContainerWrapper>
          </ContentArea>
        );
        
      case 'questions':
        return (
          <ContentArea>
            <QuestionContainerWrapper>
              <ExpandableQuestionContainer domain="physics" style={{ position: 'relative' }}>
                {memoizedQuestionText}
                <OptionsContainer>
                  {currentQuestion?.options.map((option, index) => (
                    <ExpandableAnswerContainer
                      key={index}
                      domain="physics"
                      isActive={selectedOption === index}
                      isHovered={false}
                      onClick={() => handleAnswerSelect(index)}
                      style={{ 
                        cursor: 'pointer',
                        filter: selectedOption === index 
                          ? 'brightness(1.2) saturate(1.1)' 
                          : 'none'
                      }}
                    >
                      <CanvasTypographyOverride>
                        {option.text}
                      </CanvasTypographyOverride>
                    </ExpandableAnswerContainer>
                  ))}
                </OptionsContainer>

              </ExpandableQuestionContainer>
              
              {/* Momentum-Insight combo sprite - hidden during tutorial overlay */}
              <MomentumInsightComboContainer 
                $isHighlighted={false}
                style={{ 
                  visibility: showTutorialOverlay && tutorialOverlayType === 'momentum_insight' ? 'hidden' : 'visible'
                }}
              >
                <MomentumBarSprite $momentumLevel={currentMomentum} />
                <InsightBarSprite $insightLevel={insight} />
              </MomentumInsightComboContainer>
            </QuestionContainerWrapper>
          </ContentArea>
        );
        
      case 'summary':
        return (
          <>
            {/* Original simple summary for non-reward mode */}
            {!showRewardSequence && (
              <ContentArea>
                <QuestionContainerWrapper>
                  <ExpandableQuestionContainer domain="physics">
                    <CanvasTypographyOverride>
                      {/* Title Section */}
                      <div style={{ 
                        textAlign: 'center',
                        marginBottom: '20px'
                      }}>
                        <div style={{ 
                          fontSize: CanvasFonts.lg,
                          fontFamily: typography.fontFamily.pixel,
                          color: '#4caf50',
                          fontWeight: 'bold',
                          textShadow: '0 0 6px rgba(76, 175, 80, 0.6)',
                          marginBottom: '8px'
                        }}>
                          ★ BEAM BASICS COMPLETE ★
                        </div>
                        <div style={{ 
                          fontSize: CanvasFonts.md,
                          color: '#FFD700', 
                          fontWeight: 'bold',
                          fontFamily: typography.fontFamily.pixel
                        }}>
                          +{totalMasteryGained} Beam Physics Mastery!
                        </div>
                      </div>
                      
                      {/* Continue Button using ExpandableAnswerContainer */}
                      <div style={{ textAlign: 'center' }}>
                        <ExpandableAnswerContainer
                          domain="physics"
                          isActive={true}
                          isHovered={false}
                          onClick={handleComplete}
                          style={{ 
                            cursor: 'pointer',
                            display: 'inline-block',
                            filter: 'hue-rotate(120deg) saturate(1.3) brightness(1.2)',
                            maxWidth: '280px'
                          }}
                        >
                          <CanvasTypographyOverride>
                            🚀 CONTINUE TO NEXT PHASE
                          </CanvasTypographyOverride>
                        </ExpandableAnswerContainer>
                      </div>
                    </CanvasTypographyOverride>
                  </ExpandableQuestionContainer>
                </QuestionContainerWrapper>
              </ContentArea>
            )}
            
            {/* NEW: Dramatic Reward Sequence */}
            {showRewardSequence && (
              <RewardSequenceContainer $isVisible={showRewardSequence}>
                <ExpandableQuestionContainer domain="physics" style={{ position: 'relative' }}>
                  <CanvasTypographyOverride>
                    {/* Title */}
                    {/* Report Card Title */}
                    <div style={{ 
                      textAlign: 'center',
                      marginBottom: '20px'
                    }}>
                      <div style={{ 
                        fontSize: typography.fontSize.xxl, // Much larger font (72px)
                        fontFamily: typography.fontFamily.pixel,
                        color: colors.text, // Standard text color (light)
                        fontWeight: 'normal',
                        textShadow: typography.textShadow.pixel, // Standard pixel text shadow
                        marginBottom: '12px'
                      }}>
                        Report Card
                      </div>
                    </div>
                    
                    {/* Center Star Bar */}
                    <div style={{ 
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      marginBottom: '16px',
                      position: 'relative'
                    }}>
                      <div style={{ 
                        position: 'relative',
                        marginBottom: '6px' // Reduced from 12px to move text closer to star bar
                      }}>
                        <RewardStarBarImage 
                          $starLevel={animatedStarProgress}
                          $isAnimating={rewardAnimationStage === 'filling'}
                          $showStarPop={rewardAnimationStage === 'star-pop'}
                        />
                        
                        {/* Star Formation Effect */}
                        <StarFormationEffect $isActive={rewardAnimationStage === 'star-pop'} />
                      </div>
                      
                      {/* Calculating Progress Text - Pulsing under star bar */}
                      <PulsingText 
                        $isVisible={rewardAnimationStage === 'showing-results' || rewardAnimationStage === 'filling'}
                        $isAnimating={rewardAnimationStage === 'showing-results'}
                      >
                        Calculating your progress...
                      </PulsingText>
                    </div>
                    
                    {/* Question Results Breakdown - Horizontal Layout (Left to Right) */}
                    {questionResults.length > 0 && (
                      <QuestionResultsList>
                        {questionResults.slice(0, visibleQuestionResults).map((result, index) => {
                          const uniqueKey = `reward-${rewardSessionId}-${result.questionId}-${index}`;
                          const displayText = result.isCorrect ? `${index + 1}. +${result.pointsContributed}` : `${index + 1}. ×`;
                          return (
                            <QuestionResultIndicator
                              key={uniqueKey}
                              $isVisible={index < visibleQuestionResults}
                              $isCorrect={result.isCorrect}
                              $animationDelay={index * 0.05} // Faster staggered animation
                            >
                              {displayText}
                            </QuestionResultIndicator>
                          );
                        })}
                      </QuestionResultsList>
                    )}
                    
                    {/* Continue Button - shown when animation completes */}
                    {(rewardAnimationStage === 'complete' || rewardAnimationStage === 'overflow') && (
                      <div style={{ textAlign: 'center', marginTop: '16px' }}>
                        <ExpandableAnswerContainer
                          domain="physics"
                          isActive={true}
                          isHovered={false}
                          onClick={handleComplete}
                          style={{ 
                            cursor: 'pointer',
                            display: 'inline-block',
                            maxWidth: '280px',
                            boxShadow: 'none', // Remove any glow effects
                            border: '1px solid rgba(255, 255, 255, 0.2)', // Simple border instead of glow
                            filter: 'none' // Remove any filter effects
                          }}
                        >
                          <CanvasTypographyOverride>
                            Continue
                          </CanvasTypographyOverride>
                        </ExpandableAnswerContainer>
                      </div>
                    )}
                  </CanvasTypographyOverride>
                </ExpandableQuestionContainer>
              </RewardSequenceContainer>
            )}
          </>
        );
        
               default:
           return null;
       }
     };
     
     // Render placeholder abilities bar - Simple two-section layout
     const renderPlaceholderAbilities = () => {
       if (activityPhase === 'intro') return null;
       
             return (
        <AbilitiesBarContainer>
          {/* Background image as IMG element for proper canvas scaling */}
          <AbilityBarBackground 
            src="/images/ui/containers/ability-panel-container.png"
            alt="Ability bar background"
          />
          
          {/* Ability slots stacked vertically - IMG elements for proper PNG rendering */}
          {[1, 2, 3].map((slotNumber) => (
            <AbilitySlot
              key={slotNumber}
              $isPlaceholder={true}
              onMouseEnter={() => setHoveredAbility(slotNumber)}
              onMouseLeave={() => setHoveredAbility(null)}
            >
              {/* Background PNG as IMG element for proper canvas scaling */}
              <AbilitySlotBackground 
                src="/images/ui/containers/ability-slot.png"
                alt={`Ability slot ${slotNumber} background`}
              />
              <AbilityIcon>?</AbilityIcon>
              <AbilityTooltip $visible={hoveredAbility === slotNumber}>
                <CanvasTypographyOverride>
                  Ability Slot {slotNumber} - Check back tomorrow!
                </CanvasTypographyOverride>
              </AbilityTooltip>
            </AbilitySlot>
          ))}
           
          {/* Tooltips removed - momentum/insight now on question box overlay */}
         </AbilitiesBarContainer>
       );
     };
     
  // Debug mode: Show report card immediately
  if (debugReportCard && showRewardSequence) {
    return (
      <Container>
        {renderContent()}
      </Container>
    );
  }

  return (
      <>
      <Container>
        {/* Star bar removed from main activity - now only shown in reward sequence */}
        
        {/* Quinn emblem now integrated within question container for story book layout */}
        {renderContent()}
        {renderPlaceholderAbilities()}
        
        {/* Mastery Gain Popup - Modern Pixel Container with Debug Borders */}
        <MasteryPopupContainer 
          $visible={showMasteryPopup}
          $level={lastMasteryGain}
        >
          <ToastContainer domain="physics" size="xs">
            <CanvasTypographyOverride style={{ fontSize: CanvasFonts.xs }}>
              <MasteryContent $level={lastMasteryGain}>
                {lastMasteryGain} Beam Physics
              </MasteryContent>
            </CanvasTypographyOverride>
          </ToastContainer>
        </MasteryPopupContainer>
        
      </Container>
      
      {/* Tutorial Overlay System - Backdrop + separate highlighted meters */}
      {showTutorialOverlay && (
        <>
          <TutorialOverlayBackdrop $isVisible={showTutorialOverlay} />
          
          {/* Highlighted meters rendered outside Container - with proper scaling */}
          {tutorialOverlayType === 'momentum_insight' && (
            <div style={{
              position: 'fixed',
              top: '50%',
              right: '500px',
              transform: 'translateY(-50%) scale(var(--tutorial-scale))',
              transformOrigin: 'center',
              zIndex: 1075,
              pointerEvents: 'none',
              width: '54px',
              height: '155px',
              filter: 'brightness(1.3) drop-shadow(0 0 15px rgba(255, 215, 0, 0.9))',
              imageRendering: 'pixelated'
            } as React.CSSProperties}>
              <div style={{ 
                position: 'absolute', 
                top: 0, 
                left: 0, 
                width: '54px', 
                height: '155px'
              }}>
                <MomentumBarSprite $momentumLevel={currentMomentum} />
                <InsightBarSprite $insightLevel={insight} />
              </div>
            </div>
          )}
          
          <TutorialExplanationModal $isVisible={showTutorialOverlay}>
            {(() => {
              const overlayContent = renderTutorialOverlayContent();
              return (
                <>
                  <TutorialModalTitle>{overlayContent.title}</TutorialModalTitle>
                  <TutorialModalContent>
                    {overlayContent.content}
                  </TutorialModalContent>
                  <TutorialContinueButton onClick={handleTutorialOverlayDismiss}>
                    Got it!
                  </TutorialContinueButton>
                </>
              );
            })()}
          </TutorialExplanationModal>
        </>
      )}
      </>
    );
  }