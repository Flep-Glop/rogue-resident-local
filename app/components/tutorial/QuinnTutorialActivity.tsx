'use client';

import React, { useState, useEffect, useMemo } from 'react';
import styled from 'styled-components';
import { useResourceStore } from '@/app/store/resourceStore';
import { useGameStore } from '@/app/store/gameStore';
import { useSceneStore } from '@/app/store/sceneStore';
import { useTutorialStore } from '@/app/store/tutorialStore';
import { MentorId } from '@/app/types';
import { getPortraitPath } from '@/app/utils/portraitUtils';
import { getPortraitCoordinates, getMediumPortraitSrc, getExpressionCoordinates, SPRITE_SHEETS, ExpressionType } from '@/app/utils/spriteMap';
import { colors, spacing, borders, typography, animation } from '@/app/styles/pixelTheme';
import TypewriterText from '@/app/components/ui/TypewriterText';
import { ExpandableQuestionContainer, CardContainer } from '@/app/components/ui/PixelContainer';

// Quinn's Conceptual Physics Questions - Adapted from Jesse's beam basics
interface Question {
  id: string;
  text: string;
  options: { text: string; isCorrect: boolean; feedback: string }[];
  timeLimit: number;
  momentumPath: 'always' | 'low' | 'medium' | 'high';
}

// Quinn's Physics Fundamentals Questions
const QUINN_QUESTIONS: Question[] = [
  // Opening Sequence (Always Shown)
  {
    id: 'q1-physics-foundation',
    text: '"Let\'s start with the theoretical foundation. In radiation therapy, what fundamental interaction allows us to deposit energy in tissue?"',
    options: [
      { text: 'Photoelectric effect and Compton scattering', isCorrect: true, feedback: 'Precisely! These quantum mechanical interactions are the foundation of everything we do.' },
      { text: 'Nuclear fusion reactions', isCorrect: false, feedback: 'Not quite - we\'re working with electromagnetic radiation, not nuclear reactions.' },
      { text: 'Chemical bond formation', isCorrect: false, feedback: 'Think more fundamentally - we\'re dealing with photon-matter interactions.' }
    ],
    timeLimit: 8,
    momentumPath: 'always'
  },
  {
    id: 'q2-energy-principle',
    text: '"Consider the underlying physics: higher energy photons interact with matter differently. What\'s the key conceptual difference?"',
    options: [
      { text: 'Higher energy penetrates deeper with different interaction probabilities', isCorrect: true, feedback: 'Excellent! You\'re grasping the energy-dependent interaction cross-sections.' },
      { text: 'Higher energy always deposits more dose', isCorrect: false, feedback: 'Think about the physics - energy and dose deposition aren\'t directly proportional.' },
      { text: 'Energy doesn\'t affect penetration', isCorrect: false, feedback: 'The physics tells us otherwise - energy significantly affects attenuation.' }
    ],
    timeLimit: 8,
    momentumPath: 'always'
  },
  
  // Low Momentum Path (Building Conceptual Foundation)
  {
    id: 'q3a-safety-principles',
    text: '"From a physics perspective, what\'s the fundamental principle behind radiation protection?"',
    options: [
      { text: 'Distance reduces exposure via inverse square law', isCorrect: true, feedback: 'Exactly! The inverse square law is a beautiful example of how physics protects us.' },
      { text: 'Radiation always travels in straight lines', isCorrect: false, feedback: 'Consider the mathematical relationship between distance and intensity.' },
      { text: 'Shielding works by reflection', isCorrect: false, feedback: 'Think about the underlying interaction physics rather than reflection.' }
    ],
    timeLimit: 6,
    momentumPath: 'low'
  },
  {
    id: 'q4a-basic-attenuation',
    text: '"Here\'s an elegant concept: exponential attenuation. What does this mathematical relationship tell us?"',
    options: [
      { text: 'Intensity decreases exponentially with material thickness', isCorrect: true, feedback: 'Beautiful! The exponential function perfectly describes photon attenuation.' },
      { text: 'Intensity increases with thickness', isCorrect: false, feedback: 'The mathematics shows the opposite relationship.' },
      { text: 'Intensity remains constant', isCorrect: false, feedback: 'Consider what happens as photons travel through matter.' }
    ],
    timeLimit: 6,
    momentumPath: 'low'
  },
  
  // Medium Momentum Path (Connecting Concepts)
  {
    id: 'q3b-beam-quality',
    text: '"Consider beam quality - a fascinating concept. What does higher beam quality indicate about the photon spectrum?"',
    options: [
      { text: 'Higher average photon energy and better penetration', isCorrect: true, feedback: 'Precisely! Beam quality elegantly characterizes the entire energy spectrum.' },
      { text: 'Lower photon energy', isCorrect: false, feedback: 'Think about what "quality" means in terms of penetrating ability.' },
      { text: 'Uniform photon energy', isCorrect: false, feedback: 'Medical beams are polyenergetic - consider the average energy concept.' }
    ],
    timeLimit: 8,
    momentumPath: 'medium'
  },
  {
    id: 'q4b-dose-calculation',
    text: '"Here\'s where theory meets practice: dose calculation. What\'s the fundamental relationship we\'re computing?"',
    options: [
      { text: 'Energy deposited per unit mass of tissue', isCorrect: true, feedback: 'Excellent! That\'s the elegant definition of absorbed dose.' },
      { text: 'Total energy in the beam', isCorrect: false, feedback: 'Consider what we specifically want to know about the tissue.' },
      { text: 'Photon count per second', isCorrect: false, feedback: 'Think about the biological effect - it\'s about energy deposition.' }
    ],
    timeLimit: 8,
    momentumPath: 'medium'
  },
  
  // High Momentum Path (Advanced Connections)
  {
    id: 'q3c-monte-carlo',
    text: '"Now for something intellectually stimulating: Monte Carlo methods. What fundamental physics principle makes this computational approach so powerful?"',
    options: [
      { text: 'Statistical modeling of individual photon interactions', isCorrect: true, feedback: 'Brilliant! You understand how we harness probability theory to model quantum interactions.' },
      { text: 'Deterministic calculation of beam paths', isCorrect: false, feedback: 'Think about the quantum mechanical nature of photon interactions.' },
      { text: 'Simple geometric projections', isCorrect: false, feedback: 'Monte Carlo is far more sophisticated - it models the stochastic nature of interactions.' }
    ],
    timeLimit: 10,
    momentumPath: 'high'
  },
  {
    id: 'q4c-optimization-theory',
    text: '"Consider the mathematical beauty of treatment planning: we\'re solving a multi-objective optimization problem. What are we fundamentally trying to achieve?"',
    options: [
      { text: 'Maximize dose to target while minimizing dose to normal tissue', isCorrect: true, feedback: 'Exactly! That\'s the elegant mathematical framework underlying all treatment planning.' },
      { text: 'Deliver equal dose everywhere', isCorrect: false, feedback: 'Think about the clinical objectives - we want dose discrimination.' },
      { text: 'Minimize treatment time only', isCorrect: false, feedback: 'Consider the biological objectives, not just logistical ones.' }
    ],
    timeLimit: 10,
    momentumPath: 'high'
  },
  
  // Final Questions (Always Shown - Questions 9-12)
  {
    id: 'q9-dose-units',
    text: '"Let\'s verify understanding of fundamental units. The Gray - an elegant unit - quantifies what physical quantity?"',
    options: [
      { text: 'Absorbed dose (energy per unit mass)', isCorrect: true, feedback: 'Perfect! The Gray elegantly connects energy deposition to biological effect.' },
      { text: 'Activity (decay rate)', isCorrect: false, feedback: 'That would be Becquerels - think about what we measure in tissue.' },
      { text: 'Exposure (ionization in air)', isCorrect: false, feedback: 'Consider what quantity is most relevant for biological effects.' }
    ],
    timeLimit: 6,
    momentumPath: 'always'
  },
  {
    id: 'q10-safety-systems',
    text: '"From a systems theory perspective, interlocks are fascinating. What fundamental principle do they embody?"',
    options: [
      { text: 'Fail-safe design - systems default to safe states', isCorrect: true, feedback: 'Exactly! Fail-safe engineering is a beautiful application of systems theory to safety.' },
      { text: 'Maximum speed operation', isCorrect: false, feedback: 'Consider the priority of safety over efficiency in critical systems.' },
      { text: 'Manual override capability', isCorrect: false, feedback: 'Think about what happens when systems encounter unexpected states.' }
    ],
    timeLimit: 8,
    momentumPath: 'always'
  },
  {
    id: 'q11-photon-production',
    text: '"At the heart of our linac lies elegant physics. What fundamental process creates our therapeutic X-rays?"',
    options: [
      { text: 'Bremsstrahlung radiation from electron deceleration', isCorrect: true, feedback: 'Beautiful! The classical electromagnetic theory of accelerated charges producing radiation.' },
      { text: 'Nuclear decay processes', isCorrect: false, feedback: 'Think about the electron beam interactions, not nuclear processes.' },
      { text: 'Chemical reactions', isCorrect: false, feedback: 'Consider the electromagnetic nature of X-ray production.' }
    ],
    timeLimit: 8,
    momentumPath: 'always'
  },
  {
    id: 'q12-future-concepts',
    text: '"The beauty of physics is how concepts interconnect. What theoretical area would you like to explore next?"',
    options: [
      { text: 'Advanced dose algorithms and their mathematical foundations', isCorrect: true, feedback: 'Fascinating choice! The mathematics behind modern algorithms are truly elegant.' },
      { text: 'Radiobiological modeling and tumor control probability', isCorrect: true, feedback: 'Excellent! The interface between physics and biology is where the real magic happens.' },
      { text: 'Machine learning applications in treatment planning optimization', isCorrect: true, feedback: 'Brilliant! AI is revolutionizing how we approach optimization theory.' }
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

// UI Coordinate System - True pixel perfect positioning (no scaling)
const UICoordinates = {
  mentor: {
    top: 380,       // Moved down from top
    left: 450,      // Moved right from left edge
    size: 80,      // 80px portrait size (much smaller)
    offsetX: 0,    // No offset needed
    offsetY: 0     // No offset needed
  },
  abilityBar: {
    right: 280,     // Nudged further left for better positioning
    gap: 24,       // Increased gap for stacked layout
    padding: '16px 24px', // More padding for larger container
    scale: 1.5,    // Smaller bar scale
    containerHeight: 240, // Increased height for stacked bars
    offsetX: 0,    // No offset needed
    offsetY: 0     // No offset needed
  },
  insightBar: {
    offsetX: 0,   // Move insight bar to the left
    offsetY: -120 // Raise the insight bar higher
  },
  momentumBar: {
    offsetX: 0,   // Move momentum bar to the left
    offsetY: -30    // Move momentum bar up/down
  }
};

// Styled components - True pixel perfect, no scaling
const Container = styled.div`
  position: relative;
  width: 100%;
  height: 100vh;
  background-image: 
    linear-gradient(rgba(0, 0, 0, 0.8), rgba(0, 0, 0, 0.8)),
    url('/images/hospital/backgrounds/physics-office-blur.png');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  font-family: ${typography.fontFamily.pixel};
  color: ${colors.text};
  overflow: hidden;
  
  /* Pixel perfect rendering */
  image-rendering: pixelated;
  -webkit-image-rendering: pixelated;
  -moz-image-rendering: crisp-edges;
`;

const ContentArea = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 600px; /* Fixed compact width */
  max-width: 90%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px; /* Smaller gap */
  z-index: 10;
`;

// QuestionContainer now uses PixelContainer with 9-slice for authentic pixel art
const QuestionContainerWrapper = styled.div`
  width: 100%;
  text-align: center;
  
  /* Prevent visual effects from causing layout shifts */
  overflow: hidden;
  contain: layout style;
`;

const QuestionText = styled.div`
  font-family: ${typography.fontFamily.pixel};
  color: ${colors.text};
  font-size: 14px; /* Much smaller text */
  line-height: 1.2; /* Tighter line height */
  margin-bottom: 12px; /* Less margin */
  text-align: left;
`;

const OptionsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px; /* Smaller gap */
  margin-top: 12px; /* Less margin */
  
  /* Prevent scrollbar flicker from text-shadow effects */
  overflow: hidden;
  contain: layout style; /* Prevent layout shifts from visual effects */
  padding: 0 4px; /* Small padding to contain glow effects */
`;

// Option button content styling (CardContainer handles the border/background)
const OptionContent = styled.div<{ $selected: boolean; $showFeedback: boolean; $isCorrect?: boolean }>`
  font-family: ${typography.fontFamily.pixel};
  color: ${props => 
    props.$showFeedback 
      ? (props.$isCorrect ? '#4caf50' : '#f44336')
      : colors.text
  };
  font-size: 30px;
  line-height: 1.4;
  text-align: left;
  width: 100%;
  cursor: ${props => props.$showFeedback ? 'default' : 'pointer'};
  transition: all ${animation.duration.normal} ease;
  
  /* Minimal padding for button text - CardContainer already provides 8px padding */
  padding: 2px 4px;
  
  /* Add subtle glow effect for selected state - reduced blur to prevent overflow */
  ${props => props.$selected && !props.$showFeedback && `
    text-shadow: 0 0 4px rgba(63, 81, 181, 0.8);
  `}
  
  /* Add success/error glow for feedback - reduced blur to prevent overflow */
  ${props => props.$showFeedback && `
    text-shadow: 0 0 4px ${props.$isCorrect ? 'rgba(76, 175, 80, 0.8)' : 'rgba(244, 67, 54, 0.8)'};
  `}
`;

const FeedbackText = styled.div<{ $isCorrect: boolean }>`
  font-family: ${typography.fontFamily.pixel};
  color: ${props => props.$isCorrect ? '#4caf50' : '#f44336'};
  font-size: 11px; /* Smaller feedback text */
  line-height: 1.3;
  margin-top: 8px;
  padding: 8px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 4px;
  text-align: left;
`;

// Compact portrait container
const PortraitContainer = styled.div`
  position: fixed;
  top: ${UICoordinates.mentor.top}px;
  left: ${UICoordinates.mentor.left}px;
  width: ${UICoordinates.mentor.size}px;
  height: ${UICoordinates.mentor.size}px;
  border-radius: 50%;
  border: 2px solid #3d5a80; /* Thinner border */
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.1);
  z-index: 1000;
`;

// Smaller portrait image
const MentorPortrait = styled.img`
  width: 76px; /* Much smaller */
  height: 76px;
  image-rendering: pixelated;
  object-fit: contain;
`;

// Insight and Momentum Bar System - Now vertical on the right side

const MeterContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px; /* Smaller gap */
  cursor: pointer;
  transition: transform 0.2s ease;
  overflow: visible; /* Allow tooltips to extend outside */
  height: 100%; /* Ensure consistent height */
  justify-content: flex-end; /* Align bars to bottom of container */
  transform: translate(${UICoordinates.momentumBar.offsetX}px, ${UICoordinates.momentumBar.offsetY}px);
  
  &:hover {
    transform: translate(${UICoordinates.momentumBar.offsetX}px, ${UICoordinates.momentumBar.offsetY}px) scale(1.05);
  }
`;

// Compact insight bar container
const InsightBarContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px; /* Smaller gap */
  cursor: pointer;
  transition: transform 0.2s ease;
  overflow: visible;
  height: 100%;
  justify-content: flex-end;
  transform: translate(${UICoordinates.insightBar.offsetX}px, ${UICoordinates.insightBar.offsetY}px);
  
  &:hover {
    transform: translate(${UICoordinates.insightBar.offsetX}px, ${UICoordinates.insightBar.offsetY}px) scale(1.05);
  }
`;

// Simple 1:1 insight bar system (101 frames: 0-100 insight)
const InsightBarDynamic = styled.img<{ $frameIndex: number; $isAnimating: boolean }>`
  width: 32px;
  height: 157px;
  object-fit: none;
  object-position: ${props => props.$frameIndex * -32}px bottom; /* 101 frames at 32px each = 3232px total width */
  image-rendering: pixelated;
  transform: scale(${UICoordinates.abilityBar.scale});
  transform-origin: center;
  
  transition: ${props => props.$isAnimating ? 'none' : 'filter 0.2s ease'};
  filter: ${props => {
    if (props.$isAnimating) {
      return 'brightness(1.2) saturate(1.3) drop-shadow(0 0 6px rgba(132, 90, 245, 0.6))';
    }
    return props.$frameIndex >= 80 ? 'brightness(1.1) saturate(1.2)' : 'brightness(0.9)';
  }};
  
  .hover-target:hover & {
    filter: brightness(1.1) saturate(1.2) drop-shadow(0 0 8px rgba(132, 90, 245, 0.4));
  }
`;

// Dynamic momentum bar with flicker animation system
const MomentumBarHorizontal = styled.img<{ $frameIndex: number; $isFlickering: boolean }>`
  width: 32px; /* Updated for bigger sprite frames */
  height: 108px; /* Updated to match new sprite height */
  object-fit: none;
  object-position: ${props => props.$frameIndex * -32}px 0px; /* Frame mapping for flicker system */
  image-rendering: pixelated;
  transform: scale(${UICoordinates.abilityBar.scale}); /* Scale down the bigger sprite */
  transform-origin: center;
  
  transition: ${props => props.$isFlickering ? 'none' : 'filter 0.2s ease'};
  
  filter: ${props => {
    if (props.$isFlickering) {
      return 'brightness(1.3) saturate(1.4) drop-shadow(0 0 4px rgba(255, 165, 0, 0.6))';
    }
    // Solid momentum levels: frame mapping is momentum * 2
    const momentumLevel = Math.floor(props.$frameIndex / 2);
    if (momentumLevel >= 7) return 'brightness(1.15) saturate(1.2)';
    if (momentumLevel >= 4) return 'brightness(1.1) saturate(1.1)';
    if (momentumLevel >= 1) return 'brightness(1.05) saturate(1.05)';
    return 'brightness(0.9)';
  }};
  
  &:hover {
    filter: brightness(1.2) saturate(1.2);
  }
`;

const MeterValue = styled.div`
  font-family: ${typography.fontFamily.pixel};
  font-size: 10px; /* Much smaller text */
  color: ${colors.text};
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
  font-weight: bold;
  margin-top: 2px; /* Less margin */
  white-space: nowrap;
`;

const SimpleTooltip = styled.div<{ $visible: boolean; $index: number }>`
  position: fixed;
  top: 30%;
  right: 120px; /* Adjusted for compact layout */
  transform: translateY(-50%);
  background: rgba(15, 23, 42, 0.95);
  border: 1px solid rgba(132, 90, 245, 0.6);
  border-radius: 4px; /* Smaller radius */
  padding: 6px 8px; /* Compact padding */
  font-family: ${typography.fontFamily.pixel};
  font-size: 10px; /* Smaller text */
  color: ${colors.text};
  opacity: ${props => props.$visible ? 1 : 0};
  pointer-events: none;
  z-index: 1010;
  max-width: 120px; /* Smaller max width */
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4); /* Smaller shadow */
  white-space: nowrap;
  
  &::after {
    content: '';
    position: absolute;
    left: 100%;
    top: 50%;
    transform: translateY(-50%);
    border: 4px solid transparent; /* Smaller arrow */
    border-left-color: rgba(132, 90, 245, 0.6);
  }
`;

const SummaryContainer = styled.div`
  background: rgba(20, 30, 50, 0.95);
  border: 2px solid #3d5a80;
  border-radius: 8px; /* Smaller radius */
  padding: 20px; /* Compact padding */
  width: 100%;
  max-width: 600px; /* Smaller max width */
  text-align: center;
  font-family: ${typography.fontFamily.pixel};
  color: ${colors.text};
  font-size: 14px; /* Smaller text */
`;

// Pixelated ability bar container
const AbilitiesBarContainer = styled.div`
  position: fixed;
  top: 50%;
  right: ${UICoordinates.abilityBar.right}px;
  transform: translateY(-50%);
  width: 220px;
  height: 450px;
  background-image: url('/images/ui/containers/ability-panel-container.png');
  background-size: 220px 450px;
  background-repeat: no-repeat;
  background-position: center;
  image-rendering: pixelated;
  -webkit-image-rendering: pixelated;
  -moz-image-rendering: crisp-edges;
  display: flex;
  flex-direction: row;
  align-items: flex-end;
  justify-content: center;
  gap: ${UICoordinates.abilityBar.gap}px;
  padding: 20px 16px;
  z-index: 100;
  overflow: visible;
`;

const AbilitySlot = styled.div<{ $isPlaceholder?: boolean }>`
  position: relative;
  width: 96px; /* 3x bigger ability slots */
  height: 96px;
  background: ${props => props.$isPlaceholder ? 'rgba(60, 60, 60, 0.3)' : 'rgba(63, 81, 181, 0.4)'};
  border: 3px solid ${props => props.$isPlaceholder ? '#555' : '#3f51b5'}; /* Thicker border for larger slot */
  border-radius: 12px; /* Larger radius for bigger slot */
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: ${props => props.$isPlaceholder ? 'not-allowed' : 'pointer'};
  transition: all 0.3s ease;
  opacity: ${props => props.$isPlaceholder ? 0.4 : 1};
  overflow: visible;

  &:hover {
    ${props => props.$isPlaceholder && `
      background: rgba(60, 60, 60, 0.5);
      border-color: #666;
    `}
  }
`;

const AbilityIcon = styled.div`
  font-family: ${typography.fontFamily.pixel};
  color: ${colors.textDim};
  font-size: 36px; /* 3x bigger icon text */
  font-weight: bold;
`;

const AbilityTooltip = styled.div<{ $visible: boolean }>`
  position: absolute;
  left: -140px; /* Adjusted for bigger ability slots */
  top: 50%;
  transform: translateY(-50%);
  background: rgba(0, 0, 0, 0.9);
  font-family: ${typography.fontFamily.pixel};
  color: ${colors.text};
  font-size: 12px; /* Slightly bigger tooltip text for larger slots */
  line-height: 1.2;
  padding: 6px 8px; /* More padding for readability */
  border-radius: 4px; /* Slightly larger radius */
  white-space: nowrap;
  visibility: ${props => props.$visible ? 'visible' : 'hidden'};
  opacity: ${props => props.$visible ? 1 : 0};
  transition: all ${animation.duration.fast} ease;
  z-index: 1015;
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
  font-size: 10px; /* Smaller text */
  margin-right: 8px; /* Less margin */
  padding-right: 8px; /* Less padding */
  border-right: 1px solid #3d5a80;
`;

const ResourceValue = styled.span`
  font-family: ${typography.fontFamily.pixel};
  color: ${colors.text};
  font-weight: bold;
  font-size: 10px; /* Smaller text */
`;

interface QuinnTutorialActivityProps {
  onComplete?: () => void;
}

export default function QuinnTutorialActivity({ onComplete }: QuinnTutorialActivityProps) {
  const { insight, momentum: resourceMomentum } = useResourceStore();
  const { playerName } = useGameStore();
  const { completeStep } = useTutorialStore();
  
  // Activity phase state - skip intro, start directly with questions
  const [activityPhase, setActivityPhase] = useState<'intro' | 'questions' | 'summary'>('questions');
  
  // Question flow states
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentMomentum, setCurrentMomentum] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [questionsCompleted, setQuestionsCompleted] = useState(0);
  const [totalInsightGained, setTotalInsightGained] = useState(0);
  
  // Placeholder abilities state
  const [hoveredAbility, setHoveredAbility] = useState<number | null>(null);
  
  // Simple 1:1 insight bar animation states
  const [insightAnimating, setInsightAnimating] = useState(false);
  const [currentInsightFrame, setCurrentInsightFrame] = useState(0);
  const [hoveredMeter, setHoveredMeter] = useState<number | null>(null);
  
  // Track insight animation progression
  const [animationStartInsight, setAnimationStartInsight] = useState(0);
  const [animationTargetInsight, setAnimationTargetInsight] = useState(0);
  
  // Momentum flicker animation states
  const [momentumFlickering, setMomentumFlickering] = useState(false);
  const [currentMomentumFrame, setCurrentMomentumFrame] = useState(0);
  const [flickerStartMomentum, setFlickerStartMomentum] = useState(0);
  const [flickerTargetMomentum, setFlickerTargetMomentum] = useState(0);
  
  // Simple 1:1 insight animation effect
  useEffect(() => {
    if (insightAnimating) {
      const startInsight = animationStartInsight;
      const targetInsight = animationTargetInsight;
      const totalFrames = Math.abs(targetInsight - startInsight);
      let currentFrame = 0;
      
      console.log(`🎬 1:1 INSIGHT ANIMATION: Starting ${startInsight} → ${targetInsight} (${totalFrames} frames)`);
      
      const animationInterval = setInterval(() => {
        const progress = currentFrame / totalFrames;
        const currentInsight = Math.round(startInsight + (targetInsight - startInsight) * progress);
        setCurrentInsightFrame(currentInsight);
        
        console.log(`🎬 Frame ${currentFrame}/${totalFrames}: Insight ${currentInsight}/100`);
        currentFrame++;
        
        if (currentFrame > totalFrames) {
          setInsightAnimating(false);
          setCurrentInsightFrame(targetInsight);
          clearInterval(animationInterval);
          console.log(`✅ 1:1 ANIMATION COMPLETE: Final insight ${targetInsight}/100`);
        }
      }, 40); // 40ms per frame for smooth animation (25 FPS)
      
      return () => clearInterval(animationInterval);
    }
  }, [insightAnimating, animationStartInsight, animationTargetInsight]);
  
  // Initialize current frame to match actual insight
  useEffect(() => {
    if (!insightAnimating) {
      setCurrentInsightFrame(insight);
    }
  }, [insight, insightAnimating]);
  
  // Momentum flicker animation effect
  useEffect(() => {
    if (momentumFlickering) {
      const startMomentum = flickerStartMomentum;
      const targetMomentum = flickerTargetMomentum;
      const startFrame = startMomentum * 2; // Solid frame for current momentum
      const previewFrame = startFrame + 1; // Preview frame for next momentum
      const landingFrame = targetMomentum * 2; // Final solid frame
      
      console.log(`🔥 MOMENTUM FLICKER: ${startMomentum} → ${targetMomentum} (frames: ${startFrame}↔${previewFrame} → ${landingFrame})`);
      
      let step = 0;
      const animationInterval = setInterval(() => {
        if (step < 6) {
          // Flicker phase: alternate between current and preview frames
          const isPreviewFrame = step % 2 === 1;
          setCurrentMomentumFrame(isPreviewFrame ? previewFrame : startFrame);
          console.log(`🔥 Flicker step ${step}: Frame ${isPreviewFrame ? previewFrame : startFrame}`);
        } else if (step < 9) {
          // Linger phase: show preview frame
          setCurrentMomentumFrame(previewFrame);
          console.log(`🔥 Linger step ${step}: Frame ${previewFrame}`);
        } else {
          // Landing phase: show final solid frame
          setCurrentMomentumFrame(landingFrame);
          setMomentumFlickering(false);
          clearInterval(animationInterval);
          console.log(`✅ MOMENTUM COMPLETE: Landed on frame ${landingFrame} (momentum ${targetMomentum})`);
        }
        step++;
      }, 120); // 120ms per step for dramatic flicker timing
      
      return () => clearInterval(animationInterval);
    }
  }, [momentumFlickering, flickerStartMomentum, flickerTargetMomentum]);
  
  // Initialize momentum frame to match current momentum
  useEffect(() => {
    if (!momentumFlickering) {
      setCurrentMomentumFrame(currentMomentum * 2); // Solid frame mapping
    }
  }, [currentMomentum, momentumFlickering]);
  
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
      q.id === 'q1-physics-foundation' || q.id === 'q2-energy-principle'
    ));
    
    // Momentum-based questions
    const momentumLevel = getMomentumLevel(currentMomentum);
    let momentumQuestions: Question[] = [];
    
    if (momentumLevel === 'low') {
      momentumQuestions = QUINN_QUESTIONS.filter(q => 
        q.id === 'q3a-safety-principles' || q.id === 'q4a-basic-attenuation'
      );
    } else if (momentumLevel === 'medium') {
      momentumQuestions = QUINN_QUESTIONS.filter(q => 
        q.id === 'q3b-beam-quality' || q.id === 'q4b-dose-calculation'
      );
    } else {
      momentumQuestions = QUINN_QUESTIONS.filter(q => 
        q.id === 'q3c-monte-carlo' || q.id === 'q4c-optimization-theory'
      );
    }
    questions.push(...momentumQuestions);
    
    // Final questions (always shown)
    questions.push(...QUINN_QUESTIONS.filter(q => 
      ['q9-dose-units', 'q10-safety-systems', 'q11-photon-production', 'q12-future-concepts'].includes(q.id)
    ));
    
    return questions;
  };
  
  const currentQuestions = getAvailableQuestions();
  const currentQuestion = currentQuestions[currentQuestionIndex];
  
  // Handle answer selection
  const handleAnswerSelect = (optionIndex: number) => {
    if (showFeedback) return;
    
    setSelectedOption(optionIndex);
    setShowFeedback(true);
    
    const isCorrect = currentQuestion.options[optionIndex].isCorrect;
    
    if (isCorrect) {
      // Trigger momentum flicker animation before updating
      const newMomentum = Math.min(10, currentMomentum + 1);
      if (newMomentum !== currentMomentum) {
        setFlickerStartMomentum(currentMomentum);
        setFlickerTargetMomentum(newMomentum);
        setMomentumFlickering(true);
        console.log(`🔥 MOMENTUM GAIN: Triggering flicker ${currentMomentum} → ${newMomentum}`);
      } else {
        console.log(`🔄 MOMENTUM MAXED: Already at maximum (${currentMomentum}/10)`);
      }
      setCurrentMomentum(newMomentum);
      
      // Add insight points
      const insightGain = 8 + Math.floor(currentMomentum / 2); // 8-13 points based on momentum
      const newInsightTotal = Math.min(100, insight + insightGain); // Cap at 100
      useResourceStore.getState().updateInsight(insightGain);
      setTotalInsightGained(prev => prev + insightGain);
      
      // Trigger 1:1 insight animation (always animate any gain)
      if (insightGain > 0) {
        setAnimationStartInsight(insight);
        setAnimationTargetInsight(newInsightTotal);
        setInsightAnimating(true);
        console.log(`🎬 1:1 INSIGHT ANIMATION: Triggered ${insight} → ${newInsightTotal} (+${insightGain} points)`);
      }
    } else {
      // Handle momentum loss with flicker animation too
      const newMomentum = Math.max(0, currentMomentum - 1);
      if (newMomentum !== currentMomentum) {
        setFlickerStartMomentum(currentMomentum);
        setFlickerTargetMomentum(newMomentum);
        setMomentumFlickering(true);
        console.log(`🔥 MOMENTUM LOSS: Triggering flicker ${currentMomentum} → ${newMomentum}`);
      } else {
        console.log(`🔄 MOMENTUM BOTTOMED: Already at minimum (${currentMomentum}/10)`);
      }
      setCurrentMomentum(newMomentum);
    }
    
    setQuestionsCompleted(prev => prev + 1);
    
    // Auto-advance after feedback
    setTimeout(() => {
      setSelectedOption(null);
      setShowFeedback(false);
      
      if (currentQuestionIndex < currentQuestions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
      } else {
        setActivityPhase('summary');
      }
    }, 3000);
  };
  
  // Memoized question text
  const memoizedQuestionText = useMemo(() => {
    if (activityPhase === 'questions' && currentQuestion) {
      return (
        <QuestionText>
          <TypewriterText
            key={`question-${currentQuestion.id}-${currentQuestionIndex}`}
            text={currentQuestion.text}
            speed={25}
            onComplete={() => {}}
            style={{
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
                  Physics Questions
                </h2>
                <p style={{ color: '#98b4c7', fontSize: '16px', lineHeight: '1.6' }}>
                  "Answer some physics questions to learn the basics."
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
              <ExpandableQuestionContainer domain="physics">
                {memoizedQuestionText}
                <OptionsContainer>
                  {currentQuestion?.options.map((option, index) => (
                    <CardContainer
                      key={index}
                      size="xs"
                      domain="physics"
                      isActive={selectedOption === index}
                      isHovered={false}
                      onClick={() => handleAnswerSelect(index)}
                      style={{ 
                        cursor: showFeedback ? 'default' : 'pointer',
                        filter: showFeedback 
                          ? (option.isCorrect ? 'hue-rotate(120deg) saturate(1.2)' : 'hue-rotate(0deg) saturate(1.5) brightness(0.8)')
                          : selectedOption === index 
                            ? 'brightness(1.2) saturate(1.1)' 
                            : 'none'
                      }}
                    >
                      <OptionContent
                        $selected={selectedOption === index}
                        $showFeedback={showFeedback}
                        $isCorrect={showFeedback ? option.isCorrect : undefined}
                      >
                        {option.text}
                      </OptionContent>
                    </CardContainer>
                  ))}
                </OptionsContainer>
                {showFeedback && selectedOption !== null && (
                  <FeedbackText $isCorrect={currentQuestion.options[selectedOption].isCorrect}>
                    {currentQuestion.options[selectedOption].feedback}
                  </FeedbackText>
                )}
              </ExpandableQuestionContainer>
            </QuestionContainerWrapper>
          </ContentArea>
        );
        
      case 'summary':
        return (
          <ContentArea>
            <SummaryContainer>
              <h2 style={{ marginBottom: '20px' }}>Theoretical Exploration Complete</h2>
              <p style={{ fontSize: '16px', lineHeight: '1.6', marginBottom: '20px' }}>
                "Excellent work, {playerName}! You've explored the fundamental physics principles 
                that make radiation therapy possible. The way you grasped these conceptual connections 
                was truly elegant."
              </p>
              <div style={{ margin: '20px 0', padding: '20px', background: 'rgba(63, 81, 181, 0.2)', borderRadius: '10px' }}>
                <strong>Session Results:</strong><br/>
                Questions Completed: {questionsCompleted}<br/>
                Final Momentum: {currentMomentum}/10<br/>
                Insight Gained: {totalInsightGained} points<br/>
                {currentMomentum >= 7 ? 'Outstanding theoretical mastery!' : 
                 currentMomentum >= 4 ? 'Solid conceptual understanding!' : 
                 'Good foundation building!'}
              </div>
              <p style={{ fontSize: '16px', color: '#98b4c7', marginBottom: '20px' }}>
                "These fundamental concepts are the building blocks for everything we'll explore together. 
                The beauty of physics is how these principles interconnect to create our therapeutic capabilities."
              </p>
              <button
                onClick={handleComplete}
                style={{
                  background: 'rgba(76, 175, 80, 0.8)',
                  border: '2px solid #4caf50',
                  color: '#e8f4f8',
                  padding: '15px 30px',
                  borderRadius: '10px',
                  fontSize: '16px',
                  cursor: 'pointer'
                }}
              >
                Continue to Next Phase
              </button>
            </SummaryContainer>
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
           {/* Section 1: Bars stacked vertically (insight above momentum) */}
           <div style={{ 
             display: 'flex', 
             flexDirection: 'column', 
             gap: '12px', /* Vertical gap between stacked bars */
             alignItems: 'center',
             height: '240px', /* Increased height for stacked layout */
             justifyContent: 'flex-end',
             overflow: 'visible' /* Allow tooltips to extend outside */
           }}>
                         <InsightBarContainer 
              className="hover-target"
              onMouseEnter={() => setHoveredMeter(-1)}
              onMouseLeave={() => setHoveredMeter(null)}
            >
              <InsightBarDynamic 
                src="/images/ui/insight-bar-static.png" 
                alt="Insight bar (1:1 mapping)"
                $frameIndex={currentInsightFrame}
                $isAnimating={insightAnimating}
              />
              <MeterValue>{insight}/100</MeterValue>
            </InsightBarContainer>
             
             <MeterContainer 
               onMouseEnter={() => setHoveredMeter(-2)}
               onMouseLeave={() => setHoveredMeter(null)}
             >
               <MomentumBarHorizontal
                 src="/images/ui/momentum-bar.png"
                 alt="Momentum bar (flicker system)"
                 $frameIndex={currentMomentumFrame}
                 $isFlickering={momentumFlickering}
               />
               <MeterValue>{currentMomentum}/10</MeterValue>
             </MeterContainer>
           </div>
           
           {/* Section 2: Ability slots stacked */}
           <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
             {[1, 2, 3, 4].map((slotNumber) => (
               <AbilitySlot
                 key={slotNumber}
                 $isPlaceholder={true}
                 onMouseEnter={() => setHoveredAbility(slotNumber)}
                 onMouseLeave={() => setHoveredAbility(null)}
               >
                 <AbilityIcon>?</AbilityIcon>
                 <AbilityTooltip $visible={hoveredAbility === slotNumber}>
                   Ability Slot {slotNumber} - Check back tomorrow!
                 </AbilityTooltip>
               </AbilitySlot>
             ))}
           </div>
           
           {/* Tooltips */}
           {hoveredMeter !== null && (
             <SimpleTooltip 
               $visible={true}
               $index={hoveredMeter}
             >
               {hoveredMeter === -1 && `Learning progress points`}
               {hoveredMeter === -2 && `Question flow state`}
             </SimpleTooltip>
           )}
         </AbilitiesBarContainer>
       );
     };
     
     return (
       <Container>
         {/* Fixed mentor portrait in top left */}
         <PortraitContainer>
           <MentorPortrait src={getPortraitPath('quinn', 'medium')} alt="Dr. Quinn" />
         </PortraitContainer>
         
         {renderContent()}
         {renderPlaceholderAbilities()}
       </Container>
     );
   } 