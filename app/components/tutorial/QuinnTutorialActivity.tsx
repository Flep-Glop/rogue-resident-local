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

// Book icon - positioned under star bar using canvas coordinates
const BookIconContainer = styled.div`
  position: absolute;
  top: 40px; /* Below star bar (10px + 40px height + 5px margin) */
  left: 22px; /* Aligned with star bar left edge */
  z-index: 1050; /* Above most other elements */
`;

const BookIconImage = styled.img`
  /* NATIVE ASSET DIMENSIONS - 22×22px for perfect pixel density */
  width: 22px;
  height: 22px;
  
  /* Pixel perfect rendering */
  image-rendering: pixelated;
  -webkit-image-rendering: pixelated;
  -moz-image-rendering: crisp-edges;
  -ms-interpolation-mode: nearest-neighbor;
  
  /* Ensure proper visibility */
  opacity: 1.0;
  filter: contrast(1.1) brightness(1.0);
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

// Momentum-Insight combo - overlaid positioning (single 54x155 composite)
const MomentumInsightComboContainer = styled.div`
  position: fixed; /* Position relative to viewport, not parent container */
  top: 50%; /* Center vertically on screen */
  right: -25px; /* Position from right edge of screen */
  transform: translateY(-50%); /* Center vertically */
  z-index: 1060; /* Above question container */
  pointer-events: none; /* Allow clicks to pass through */
  
  /* Container dimensions match single sprite - both overlay into one */
  width: 54px; /* Single sprite width - both bars composite into this */
  height: 155px;
  /* Removed conflicting position: relative - child sprites use absolute positioning within this fixed container */
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



interface QuinnTutorialActivityProps {
  onComplete?: () => void;
}

export default function QuinnTutorialActivity({ onComplete }: QuinnTutorialActivityProps) {
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
      
      console.log(`[QuinnTutorialActivity] Tutorial scale: ${tutorialScale.toFixed(3)} (${viewportWidth}x${viewportHeight} → ${TUTORIAL_INTERNAL_WIDTH}x${TUTORIAL_INTERNAL_HEIGHT})`);
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

  const [questionsCompleted, setQuestionsCompleted] = useState(0);
  const [totalInsightGained, setTotalInsightGained] = useState(0);
  
  // NEW: Mastery tracking system
  const [totalMasteryGained, setTotalMasteryGained] = useState(0);
  const [showMasteryPopup, setShowMasteryPopup] = useState(false);
  const [lastMasteryGain, setLastMasteryGain] = useState(0);
  const [masteryAnimating, setMasteryAnimating] = useState(false);
  
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
  
  // Get questions based on momentum
  const getAvailableQuestions = (): Question[] => {
    const questions: Question[] = [];
    
    // Opening sequence (always shown)
    questions.push(...QUINN_QUESTIONS.filter(q => 
      q.id === 'q1-beam-delivery' || q.id === 'q2-beam-penetration'
    ));
    
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
    questions.push(...momentumQuestions);
    
    // Final questions (always shown)
    questions.push(...QUINN_QUESTIONS.filter(q => 
      ['q9-dose-units', 'q10-interlock-safety', 'q11-xray-target', 'q12-future-learning'].includes(q.id)
    ));
    
    return questions;
  };
  
  const currentQuestions = getAvailableQuestions();
  const currentQuestion = currentQuestions[currentQuestionIndex];
  
  // Handle answer selection
  const handleAnswerSelect = (optionIndex: number) => {
    setSelectedOption(optionIndex);
    
    const isCorrect = currentQuestion.options[optionIndex].isCorrect;
    
    if (isCorrect) {
      // Update momentum 
      const newMomentum = Math.min(10, currentMomentum + 1);
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
      
      console.log(`📚 MASTERY: ${finalMomentumLevel} momentum = +${masteryGain} Beam Physics`);
      
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
    } else {
      // Handle momentum loss
      const newMomentum = Math.max(0, currentMomentum - 1);
      setCurrentMomentum(newMomentum);
      console.log(`🔥 MOMENTUM LOSS: ${currentMomentum} → ${newMomentum}`);
    }
    
    setQuestionsCompleted(prev => prev + 1);
    
    // Auto-advance to next question immediately
    setTimeout(() => {
      setSelectedOption(null);
      
      if (currentQuestionIndex < currentQuestions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
      } else {
        setActivityPhase('summary');
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
              
              {/* Momentum-Insight combo sprite - side-by-side positioning */}
              <MomentumInsightComboContainer>
                <MomentumBarSprite $momentumLevel={currentMomentum} />
                <InsightBarSprite $insightLevel={insight} />
              </MomentumInsightComboContainer>
            </QuestionContainerWrapper>
          </ContentArea>
        );
        
      case 'summary':
        return (
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
     
         return (
      <Container>
        {/* Star bar - positioned at top left using canvas coordinates */}
        <StarBarContainer>
          <StarBarImage 
            $starLevel={insight} // Use insight progress for testing animation (0-100)
          />
        </StarBarContainer>
        
        {/* Book icon - positioned under star bar using canvas coordinates */}
        <BookIconContainer>
          <BookIconImage 
            src="/images/journal/book-icon.png"
            alt="Journal/Book icon"
          />
        </BookIconContainer>
        
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
    );
  } 