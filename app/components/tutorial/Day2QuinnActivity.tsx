'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import styled from 'styled-components';
import { useResourceStore } from '@/app/store/resourceStore';
import { useGameStore } from '@/app/store/gameStore';
import { useSceneStore } from '@/app/store/sceneStore';
import { useTutorialStore } from '@/app/store/tutorialStore';
import { useAbilityStore } from '@/app/store/abilityStore';
import { MentorId } from '@/app/types';

import { getPortraitCoordinates, getMediumPortraitSrc, getExpressionCoordinates, SPRITE_SHEETS, ExpressionType } from '@/app/utils/spriteMap';
import { colors, spacing, borders, typography, animation } from '@/app/styles/pixelTheme';
import TypewriterText from '@/app/components/ui/TypewriterText';
import { ExpandableQuestionContainer, CardContainer, ExpandableAnswerContainer, ToastContainer } from '@/app/components/ui/PixelContainer';
import AbilityCardInterface from '@/app/components/scenes/AbilityCardInterface';

// Day 2 Quinn Questions - Advanced Beam Physics
interface Question {
  id: string;
  text: string;
  options: { text: string; isCorrect: boolean; feedback: string }[];
  timeLimit: number;
  momentumPath: 'always' | 'low' | 'medium' | 'high';
}

// Day 2 Questions - More advanced beam physics concepts
const DAY2_QUINN_QUESTIONS: Question[] = [
  // Opening Sequence (Always Shown)
  {
    id: 'q1-beam-hardening',
    text: '"Good morning! Let\'s dive deeper. When a beam passes through tissue, lower energy photons are absorbed first. This is called..."',
    options: [
      { text: 'Beam hardening', isCorrect: true, feedback: 'Exactly! Beam hardening increases the average beam energy as it penetrates tissue.' },
      { text: 'Beam softening', isCorrect: false, feedback: 'Actually, the beam gets "harder" (higher average energy) as low-energy photons are filtered out.' },
      { text: 'Beam scattering', isCorrect: false, feedback: 'Scattering is different - this is about selective absorption changing beam quality.' }
    ],
    timeLimit: 10,
    momentumPath: 'always'
  },
  {
    id: 'q2-inverse-square',
    text: '"Here\'s a fundamental physics principle: As distance from source doubles, dose rate..."',
    options: [
      { text: 'Decreases by factor of 4', isCorrect: true, feedback: 'Perfect! Inverse square law - double distance = 1/4 the dose rate.' },
      { text: 'Decreases by factor of 2', isCorrect: false, feedback: 'That would be linear - but radiation follows inverse square law.' },
      { text: 'Stays the same', isCorrect: false, feedback: 'Distance definitely affects dose rate - inverse square relationship.' }
    ],
    timeLimit: 10,
    momentumPath: 'always'
  },
  
  // Low Momentum Path (Practical Applications)
  {
    id: 'q3a-field-size',
    text: '"Larger radiation fields generally deliver..."',
    options: [
      { text: 'Higher dose to central axis', isCorrect: true, feedback: 'Correct! Larger fields have more scatter contribution, increasing central axis dose.' },
      { text: 'Lower dose to central axis', isCorrect: false, feedback: 'Actually, scatter from larger fields increases the dose at central axis.' },
      { text: 'Same dose regardless', isCorrect: false, feedback: 'Field size definitely affects dose distribution through scatter.' }
    ],
    timeLimit: 8,
    momentumPath: 'low'
  },
  {
    id: 'q4a-tissue-density',
    text: '"Dense bone absorbs radiation differently than soft tissue because..."',
    options: [
      { text: 'Higher atomic number', isCorrect: true, feedback: 'Right! Bone has higher Z elements, leading to more photoelectric absorption.' },
      { text: 'Lower atomic number', isCorrect: false, feedback: 'Bone actually has higher Z elements than soft tissue.' },
      { text: 'Same atomic composition', isCorrect: false, feedback: 'Bone and soft tissue have very different compositions.' }
    ],
    timeLimit: 8,
    momentumPath: 'low'
  },
  
  // Medium Momentum Path (Dose Calculations)
  {
    id: 'q3b-tpr-concept',
    text: '"TPR stands for Tissue-Phantom Ratio. It helps us calculate..."',
    options: [
      { text: 'Dose at depth in tissue', isCorrect: true, feedback: 'Exactly! TPR relates dose at depth to dose at reference depth.' },
      { text: 'Treatment time needed', isCorrect: false, feedback: 'That\'s more about dose rate - TPR is about depth dose relationships.' },
      { text: 'Patient positioning', isCorrect: false, feedback: 'TPR is a dosimetric concept, not about patient setup.' }
    ],
    timeLimit: 10,
    momentumPath: 'medium'
  },
  {
    id: 'q4b-buildup-region',
    text: '"The buildup region in a dose curve represents..."',
    options: [
      { text: 'Electron equilibrium establishing', isCorrect: true, feedback: 'Perfect! Buildup shows electrons reaching equilibrium with increasing depth.' },
      { text: 'Beam energy decreasing', isCorrect: false, feedback: 'Energy loss happens, but buildup is specifically about electron equilibrium.' },
      { text: 'Scatter radiation only', isCorrect: false, feedback: 'Scatter contributes, but buildup is mainly about electron equilibrium.' }
    ],
    timeLimit: 10,
    momentumPath: 'medium'
  },
  
  // High Momentum Path (Advanced Physics)
  {
    id: 'q3c-compton-effect',
    text: '"In the therapeutic energy range, the dominant interaction is..."',
    options: [
      { text: 'Compton scattering', isCorrect: true, feedback: 'Excellent! Compton scattering dominates in the MeV range for soft tissue.' },
      { text: 'Photoelectric effect', isCorrect: false, feedback: 'Photoelectric dominates at lower energies, not in therapeutic range.' },
      { text: 'Pair production', isCorrect: false, feedback: 'Pair production becomes significant only above 1.02 MeV, and even then Compton dominates in tissue.' }
    ],
    timeLimit: 12,
    momentumPath: 'high'
  },
  {
    id: 'q4c-electron-density',
    text: '"When calculating dose in different tissues, we primarily need to know..."',
    options: [
      { text: 'Electron density', isCorrect: true, feedback: 'Correct! For Compton interactions, electron density is the key factor.' },
      { text: 'Physical density only', isCorrect: false, feedback: 'Physical density matters, but electron density is more fundamental for dose.' },
      { text: 'Chemical composition only', isCorrect: false, feedback: 'Composition affects electron density, but electron density itself is what matters for dose.' }
    ],
    timeLimit: 12,
    momentumPath: 'high'
  },
  
  // Final Questions (Always Shown)
  {
    id: 'q9-output-factors',
    text: '"Output factors account for..."',
    options: [
      { text: 'Field size effects on dose rate', isCorrect: true, feedback: 'Perfect! Output factors correct for how field size affects machine output.' },
      { text: 'Patient weight variations', isCorrect: false, feedback: 'Patient factors are separate - output factors are about machine/field characteristics.' },
      { text: 'Room temperature changes', isCorrect: false, feedback: 'Temperature can affect some measurements, but output factors are about field size effects.' }
    ],
    timeLimit: 8,
    momentumPath: 'always'
  },
  {
    id: 'q10-wedge-filters',
    text: '"Wedge filters are used to..."',
    options: [
      { text: 'Create dose gradients', isCorrect: true, feedback: 'Exactly! Wedges modify beam intensity to create desired dose distributions.' },
      { text: 'Increase beam energy', isCorrect: false, feedback: 'Wedges filter the beam but don\'t increase energy - they actually harden it slightly.' },
      { text: 'Reduce treatment time', isCorrect: false, feedback: 'Wedges actually increase treatment time by reducing beam intensity.' }
    ],
    timeLimit: 8,
    momentumPath: 'always'
  },
  {
    id: 'q11-isocenter',
    text: '"The isocenter is..."',
    options: [
      { text: 'Where all beam axes intersect', isCorrect: true, feedback: 'Correct! The isocenter is the mechanical center where all rotation axes meet.' },
      { text: 'The patient entry point', isCorrect: false, feedback: 'Entry points vary with beam angle - isocenter is the rotation center.' },
      { text: 'The dose maximum point', isCorrect: false, feedback: 'Dose maximum depends on depth and energy - isocenter is about geometry.' }
    ],
    timeLimit: 8,
    momentumPath: 'always'
  },
  {
    id: 'q12-next-steps',
    text: '"Now that we\'ve covered beam physics fundamentals, what interests you most for tomorrow?"',
    options: [
      { text: 'Treatment planning systems', isCorrect: true, feedback: 'Great choice! TPS integration brings physics into clinical practice.' },
      { text: 'Advanced imaging techniques', isCorrect: true, feedback: 'Excellent! Imaging is crucial for modern radiation therapy.' },
      { text: 'Quality assurance procedures', isCorrect: true, feedback: 'Perfect! QA ensures everything we\'ve learned works properly in practice.' }
    ],
    timeLimit: 12,
    momentumPath: 'always'
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

const AbilitySlot = styled.div<{ $isPlaceholder?: boolean; $isActive?: boolean; $canActivate?: boolean }>`
  position: relative;
  /* NATIVE ASSET DIMENSIONS - 58×58px for perfect pixel density */
  width: 58px;
  height: 58px;
  
  /* Layout */
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: ${props => 
    props.$isPlaceholder ? 'not-allowed' : 
    props.$canActivate ? 'pointer' : 
    'default'
  };
  transition: all 0.3s ease;
  opacity: ${props => props.$isPlaceholder ? 0.7 : 1};
  overflow: visible;
  z-index: 2; /* Above ability panel background */

  /* Active state for activated abilities */
  filter: ${props => props.$isActive ? 'brightness(1.5) saturate(1.4) drop-shadow(0 0 8px #FFD700)' : 'none'};
  transform: ${props => props.$isActive ? 'scale(1.1)' : 'scale(1)'};

  /* Hover states */
  &:hover {
    ${props => props.$isPlaceholder && `
      opacity: 0.9;
      transform: scale(1.05);
    `}
    ${props => props.$canActivate && !props.$isActive && `
      filter: brightness(1.2);
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

const AbilityIcon = styled.img`
  /* NATIVE ASSET DIMENSIONS for ability icons */
  width: 32px;
  height: 32px;
  position: relative;
  z-index: 3; /* Above background image (z:2) */
  
  /* Pixel perfect rendering */
  image-rendering: pixelated;
  -webkit-image-rendering: pixelated;
  -moz-image-rendering: crisp-edges;
  -ms-interpolation-mode: nearest-neighbor;
`;

const AbilityPlaceholder = styled.div`
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

// Removed ChainIndicator - Fast Learner is now an active ability with visual feedback on ability panel

// Book icon - positioned under star bar using canvas coordinates - now clickable!
const BookIconContainer = styled.div`
  position: absolute;
  top: 10px; /* Top positioning */
  left: 22px; /* Aligned with star bar left edge */
  z-index: 1050; /* Above most other elements */
  cursor: pointer;
  transition: transform 0.3s ease, filter 0.3s ease;
  
  &:hover {
    transform: scale(1.1);
    filter: brightness(1.2) drop-shadow(0 0 4px rgba(255, 215, 0, 0.6));
  }
  
  &:active {
    transform: scale(0.95);
  }
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

interface Day2QuinnActivityProps {
  onComplete?: () => void;
}

export default function Day2QuinnActivity({ onComplete }: Day2QuinnActivityProps) {
  const { insight, momentum: resourceMomentum } = useResourceStore();
  const { playerName, daysPassed } = useGameStore();
  const { completeStep } = useTutorialStore();
  const { getEquippedCards, isCardEquipped, activateAbility, isAbilityActive, deactivateAbility } = useAbilityStore();
  
  // Journal interface state
  const [showAbilityInterface, setShowAbilityInterface] = useState(false);
  
  // === TUTORIAL SCALING SYSTEM ===
  useEffect(() => {
    const updateTutorialScale = () => {
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      const scaleX = viewportWidth / TUTORIAL_INTERNAL_WIDTH;
      const scaleY = viewportHeight / TUTORIAL_INTERNAL_HEIGHT;
      const tutorialScale = Math.min(scaleX, scaleY);
      
      document.documentElement.style.setProperty('--tutorial-scale', tutorialScale.toString());
      
      // Scale calculation: ${tutorialScale.toFixed(3)} (${viewportWidth}x${viewportHeight} → ${TUTORIAL_INTERNAL_WIDTH}x${TUTORIAL_INTERNAL_HEIGHT})
    };
    
    updateTutorialScale();
    window.addEventListener('resize', updateTutorialScale);
    
    return () => {
      window.removeEventListener('resize', updateTutorialScale);
    };
  }, []);
  
  // Activity phase state
  const [activityPhase, setActivityPhase] = useState<'questions' | 'summary'>('questions');
  
  // Question flow states
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentMomentum, setCurrentMomentum] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);

  const [questionsCompleted, setQuestionsCompleted] = useState(0);
  const [totalInsightGained, setTotalInsightGained] = useState(0);
  const [totalMasteryGained, setTotalMasteryGained] = useState(0);
  const [showMasteryPopup, setShowMasteryPopup] = useState(false);
  const [lastMasteryGain, setLastMasteryGain] = useState(0);
  const [masteryAnimating, setMasteryAnimating] = useState(false);

  // Ability states
  const [hoveredAbility, setHoveredAbility] = useState<number | null>(null);

  // Handle ability activation
  const handleAbilityClick = (card: AbilityCard) => {
    if (card.id === 'fast_learner') {
      const success = activateAbility(card.id);
      if (success) {
        console.log(`⚡ Fast Learner activated! Next correct answer after a correct answer = 2x momentum`);
      }
    }
  };
  
  // Check if fast learner is equipped and active
  const isFastLearnerEquipped = isCardEquipped('fast_learner');
  const isFastLearnerActive = isAbilityActive('fast_learner');
  const equippedCards = getEquippedCards();
  
  // Get questions based on momentum - memoized to prevent duplicate key issues
  const getAvailableQuestions = useMemo((): Question[] => {
    const questions: Question[] = [];
    const usedIds = new Set<string>();
    
    // Opening sequence (always shown)
    const openingQuestions = DAY2_QUINN_QUESTIONS.filter(q => 
      q.id === 'q1-beam-hardening' || q.id === 'q2-inverse-square'
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
      momentumQuestions = DAY2_QUINN_QUESTIONS.filter(q => 
        q.id === 'q3a-field-size' || q.id === 'q4a-tissue-density'
      );
    } else if (momentumLevel === 'medium') {
      momentumQuestions = DAY2_QUINN_QUESTIONS.filter(q => 
        q.id === 'q3b-tpr-concept' || q.id === 'q4b-buildup-region'
      );
    } else {
      momentumQuestions = DAY2_QUINN_QUESTIONS.filter(q => 
        q.id === 'q3c-compton-effect' || q.id === 'q4c-electron-density'
      );
    }
    momentumQuestions.forEach(q => {
      if (!usedIds.has(q.id)) {
        questions.push(q);
        usedIds.add(q.id);
      }
    });
    
    // Final questions (always shown)
    const finalQuestions = DAY2_QUINN_QUESTIONS.filter(q => 
      ['q9-output-factors', 'q10-wedge-filters', 'q11-isocenter', 'q12-next-steps'].includes(q.id)
    );
    finalQuestions.forEach(q => {
      if (!usedIds.has(q.id)) {
        questions.push(q);
        usedIds.add(q.id);
      }
    });
    
    // Day 2 Questions selected (${questions.length}): ${questions.map(q => q.id).join(', ')}
    
    return questions;
  }, [currentMomentum]);
  
  const currentQuestions = getAvailableQuestions;
  const currentQuestion = currentQuestions[currentQuestionIndex];
  
  // Handle answer selection with fast learner ability effects
  const handleAnswerSelect = (optionIndex: number) => {
    setSelectedOption(optionIndex);
    
    const isCorrect = currentQuestion.options[optionIndex].isCorrect;
    let newMomentum = currentMomentum;
    let baseInsightGain = 8 + Math.floor(currentMomentum / 2); // 8-13 points based on momentum
    
    if (isCorrect) {
      // Calculate momentum gain with Fast Learner bonus
      let momentumGain = 1; // Base momentum gain
      
      // Fast Learner: 2x momentum if active (simple - just next correct answer)
      if (isFastLearnerActive) {
        momentumGain = 2; // Double momentum!
        console.log(`⚡ Fast Learner ACTIVATED: 2x momentum gain!`);
      }
      
      // Update momentum 
      newMomentum = Math.min(10, currentMomentum + momentumGain);
      setCurrentMomentum(newMomentum);
      console.log(`🔥 MOMENTUM GAIN: ${currentMomentum} → ${newMomentum} (+${momentumGain}${isFastLearnerActive ? ' FAST LEARNER BONUS!' : ''})`);
      
      let finalInsightGain = baseInsightGain;
      
      useResourceStore.getState().updateInsight(finalInsightGain);
      setTotalInsightGained(prev => prev + finalInsightGain);
      console.log(`🎬 Insight gain: +${finalInsightGain} → ${insight + finalInsightGain}`);
      
      // Calculate mastery gain based on momentum level
      const finalMomentumLevel = getMomentumLevel(newMomentum);
      const masteryGain = finalMomentumLevel === 'low' ? 1 : 
                         finalMomentumLevel === 'medium' ? 2 : 3;
      
      console.log(`📚 MASTERY: ${finalMomentumLevel} momentum = +${masteryGain} Advanced Beam Physics`);
      
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
      newMomentum = Math.max(0, currentMomentum - 1);
      setCurrentMomentum(newMomentum);
      console.log(`🔥 MOMENTUM LOSS: ${currentMomentum} → ${newMomentum}`);
    }
    
    // Deactivate Fast Learner after ANY answer (correct or wrong, no refunds)
    if (isFastLearnerActive) {
      deactivateAbility('fast_learner');
      console.log(`🔄 Fast Learner deactivated - ${isCorrect ? 'bonus applied' : 'no refund'}`);
    }
    
    setQuestionsCompleted(prev => prev + 1);
    
    // Auto-advance to next question - normal speed for active ability system
    const advanceDelay = 1000; // Standard progression speed
    setTimeout(() => {
      setSelectedOption(null);
      
      if (currentQuestionIndex < currentQuestions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
      } else {
        // Activity complete
        setActivityPhase('summary');
      }
    }, advanceDelay);
  };
  
  // Memoized question text with story book emblem layout
  const memoizedQuestionText = useMemo(() => {
    if (activityPhase === 'questions' && currentQuestion) {
      return (
        <QuestionText>
          <QuinnEmblem 
            src="/images/characters/portraits/quinn-medium-emblem.png" 
            alt="Dr. Quinn"
          />
          <TypewriterText
            key={`day2-question-${currentQuestion.id}-${currentQuestionIndex}`}
            text={currentQuestion.text}
            speed={25} // Standard typewriter speed for active ability system
            onComplete={() => {}}
            style={{
              fontSize: CanvasFonts.lg,
              lineHeight: typography.lineHeight.tight
            }}
          />
        </QuestionText>
      );
    }
    return null;
  }, [activityPhase, currentQuestion?.id, currentQuestion?.text, currentQuestionIndex, isFastLearnerEquipped]);
  
  const handleComplete = () => {
    console.log('[Day2QuinnActivity] Day 2 morning activity completed!');
    onComplete?.();
  };
  
  // Journal button handlers
  const handleJournalClick = () => {
    console.log('[Day2QuinnActivity] Journal clicked - opening ability card interface');
    setShowAbilityInterface(true);
  };
  
  const handleCloseAbilityInterface = () => {
    setShowAbilityInterface(false);
  };
  
  // Render different phases
  const renderContent = () => {
    switch (activityPhase) {
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
              
              {/* Momentum-Insight combo sprite */}
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
                      ★ DAY 2 COMPLETE ★
                    </div>
                    <div style={{ 
                      fontSize: CanvasFonts.md,
                      color: '#FFD700', 
                      fontWeight: 'bold',
                      fontFamily: typography.fontFamily.pixel
                    }}>
                      +{totalMasteryGained} Advanced Beam Physics!
                    </div>
                    {/* Fast Learner is now an active ability - no passive bonus message */}
                  </div>
                  
                  {/* Continue Button */}
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
                        Continue Day 2
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
  
  // Render abilities bar with equipped cards
  const renderAbilitiesBar = () => {
    return (
      <AbilitiesBarContainer>
        <AbilityBarBackground 
          src="/images/ui/containers/ability-panel-container.png"
          alt="Ability bar background"
        />
        
        {/* Ability slots stacked vertically */}
        {[0, 1, 2].map((slotIndex) => {
          const equippedCard = equippedCards.find(card => card.slotIndex === slotIndex);
          const isActive = equippedCard ? isAbilityActive(equippedCard.id) : false;
          const canActivate = equippedCard && insight >= equippedCard.cost && !isActive;
          
          return (
            <AbilitySlot
              key={slotIndex}
              $isPlaceholder={!equippedCard}
              $isActive={isActive}
              $canActivate={canActivate}
              onClick={() => equippedCard && canActivate && handleAbilityClick(equippedCard)}
              onMouseEnter={() => setHoveredAbility(slotIndex)}
              onMouseLeave={() => setHoveredAbility(null)}
            >
              <AbilitySlotBackground 
                src="/images/ui/containers/ability-slot.png"
                alt={`Ability slot ${slotIndex + 1} background`}
              />
              {equippedCard ? (
                <AbilityIcon 
                  src={equippedCard.iconPath}
                  alt={equippedCard.name}
                />
              ) : (
                <AbilityPlaceholder>?</AbilityPlaceholder>
              )}
              <AbilityTooltip $visible={hoveredAbility === slotIndex}>
                <CanvasTypographyOverride>
                  {equippedCard ? (
                    isActive ? 
                      `${equippedCard.name}: ACTIVE - Next correct answer = 2x momentum!` :
                    canActivate ?
                      `${equippedCard.name}: Click to activate (${equippedCard.cost} insight)` :
                    insight < equippedCard.cost ?
                      `${equippedCard.name}: Need ${equippedCard.cost} insight` :
                      `${equippedCard.name}: ${equippedCard.description}`
                  ) : (
                    `Ability Slot ${slotIndex + 1} - Empty`
                  )}
                </CanvasTypographyOverride>
              </AbilityTooltip>
            </AbilitySlot>
          );
        })}
      </AbilitiesBarContainer>
    );
  };

  return (
    <>
      <Container>
        {/* Book icon - now clickable journal button */}
        <BookIconContainer onClick={handleJournalClick}>
          <BookIconImage 
            src="/images/journal/book-icon.png"
            alt="Journal/Book icon - Click to open"
          />
        </BookIconContainer>
        
        {renderContent()}
        {renderAbilitiesBar()}
        
        {/* Mastery Gain Popup */}
        <MasteryPopupContainer 
          $visible={showMasteryPopup}
          $level={lastMasteryGain}
        >
          <ToastContainer domain="physics" size="xs">
            <CanvasTypographyOverride style={{ fontSize: CanvasFonts.xs }}>
              <MasteryContent $level={lastMasteryGain}>
                {lastMasteryGain} Advanced Beam Physics
              </MasteryContent>
            </CanvasTypographyOverride>
          </ToastContainer>
        </MasteryPopupContainer>
      </Container>
      
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
