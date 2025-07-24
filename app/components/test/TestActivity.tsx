'use client';

import React, { useState, useEffect, useMemo } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { colors, spacing, typography, animation, borders } from '@/app/styles/pixelTheme';
import SpriteImage from '../ui/SpriteImage';
import TypewriterText from '../ui/TypewriterText';
import { getMediumPortraitSrc } from '@/app/utils/spriteMap';
import { useSceneStore } from '@/app/store/sceneStore';
import { useResourceStore } from '@/app/store/resourceStore';
import { useGameStore } from '@/app/store/gameStore';
import { MentorId } from '@/app/types';
import TimeDilationEffect from './TimeDilationEffect';
import { 
  QuestionContainer as PixelQuestionContainer, 
  CardContainer, 
  DialogContainer 
} from '@/app/components/ui/PixelContainer';

// Question types for Jesse's encounter
interface QuestionOption {
  text: string;
  isCorrect: boolean;
  feedback: string;
}

interface Question {
  id: string;
  text: string;
  options: QuestionOption[];
  timeLimit: number; // seconds
  momentumPath: 'low' | 'medium' | 'high' | 'always'; // Which momentum level this question appears in
}

// Jesse's Beam Basics Questions from the encounter document
const JESSE_QUESTIONS: Question[] = [
  // Opening Sequence (Always Shown)
  {
    id: 'q1-equipment-id',
    text: '*points at the linear accelerator* "First things first - what are we looking at here?"',
    options: [
      { text: 'Linear accelerator', isCorrect: true, feedback: 'Exactly. Bertha here is our main treatment machine.' },
      { text: 'CT scanner', isCorrect: false, feedback: 'Not quite - that\'s Bertha, our linear accelerator.' },
      { text: 'MRI machine', isCorrect: false, feedback: 'Nope - this is Bertha, our linear accelerator for treatment.' }
    ],
    timeLimit: 3,
    momentumPath: 'always'
  },
  {
    id: 'q2-basic-physics',
    text: '"Bertha shoots high-energy X-rays. Higher energy beams penetrate..."',
    options: [
      { text: 'Deeper into tissue', isCorrect: true, feedback: 'Right! Higher energy, deeper penetration. Physics 101.' },
      { text: 'Less deep into tissue', isCorrect: false, feedback: 'Think about it - more energy should go further, right?' },
      { text: 'Same depth regardless', isCorrect: false, feedback: 'Energy definitely affects penetration depth.' }
    ],
    timeLimit: 6,
    momentumPath: 'always'
  },
  
  // Low Momentum Path (Building Confidence)
  {
    id: 'q3a-safety-basics',
    text: '"Door says \'Radiation On\' in big red letters. You should..."',
    options: [
      { text: 'Stay out', isCorrect: true, feedback: 'Smart! Safety first, always.' },
      { text: 'Go in anyway', isCorrect: false, feedback: 'Whoa there! Red light means danger - stay out.' },
      { text: 'Knock first', isCorrect: false, feedback: 'Ha! Nice try, but when radiation\'s on, nobody goes in.' }
    ],
    timeLimit: 3,
    momentumPath: 'low'
  },
  {
    id: 'q4a-obvious-physics',
    text: '"Lead blocks radiation, right?"',
    options: [
      { text: 'True', isCorrect: true, feedback: 'Yep. Dense materials like lead are great shields.' },
      { text: 'False', isCorrect: false, feedback: 'Actually, lead is one of our best radiation shields!' }
    ],
    timeLimit: 4,
    momentumPath: 'low'
  },
  
  // Medium Momentum Path (Getting Into Flow)
  {
    id: 'q3b-equipment-function',
    text: '"See that flat panel on the wall? That\'s detecting our beam to make sure it\'s..."',
    options: [
      { text: 'The right intensity', isCorrect: true, feedback: 'Exactly! Daily QA checks - gotta make sure our dose is accurate.' },
      { text: 'The right color', isCorrect: false, feedback: 'Ha! X-rays don\'t have color - we\'re checking intensity.' },
      { text: 'Making noise', isCorrect: false, feedback: 'Nope, we\'re measuring dose rate, not sound.' }
    ],
    timeLimit: 7,
    momentumPath: 'medium'
  },
  {
    id: 'q4b-clinical-context',
    text: '"Patient\'s got a surface tumor. Better to use..."',
    options: [
      { text: 'Lower energy (less penetration)', isCorrect: true, feedback: 'Good thinking! Don\'t want to overdose the healthy tissue underneath.' },
      { text: 'Higher energy (more penetration)', isCorrect: false, feedback: 'That would go too deep - we\'d fry healthy tissue below the tumor.' },
      { text: 'No energy (no treatment)', isCorrect: false, feedback: 'Well that wouldn\'t help the patient much!' }
    ],
    timeLimit: 8,
    momentumPath: 'medium'
  },
  
  // High Momentum Path (Expert Mode)
  {
    id: 'q3c-applied-thinking',
    text: '"Patient needs a chest treatment. Better to use higher energy or lower energy for deeper tumors?"',
    options: [
      { text: 'Higher energy (penetrates deeper)', isCorrect: true, feedback: 'Right! Higher energy for deeper targets - that\'s thinking clinically.' },
      { text: 'Lower energy (stays at surface)', isCorrect: false, feedback: 'That won\'t reach a deep chest tumor effectively.' },
      { text: 'Doesn\'t matter', isCorrect: false, feedback: 'Oh it definitely matters! Energy selection is crucial.' }
    ],
    timeLimit: 8,
    momentumPath: 'high'
  },
  {
    id: 'q4c-equipment-context',
    text: '"See those thick concrete walls? They\'re here because..."',
    options: [
      { text: 'Radiation shielding', isCorrect: true, feedback: 'Exactly! Concrete and lead keep radiation where it belongs - in this room.' },
      { text: 'Sound dampening', isCorrect: false, feedback: 'Nope - they\'re thick to block radiation, not sound.' },
      { text: 'Temperature control', isCorrect: false, feedback: 'Not for temperature - these walls are radiation shields.' }
    ],
    timeLimit: 8,
    momentumPath: 'high'
  },
  
  // Final Questions (Always Shown - Questions 9-12)
  {
    id: 'q9-practical-application',
    text: 'Simple question - we measure dose in...',
    options: [
      { text: 'Gray (Gy)', isCorrect: true, feedback: 'That\'s right! Gray is our dose unit - remember that.' },
      { text: 'Pounds (lbs)', isCorrect: false, feedback: 'Nope! Gray (Gy) is our dose unit, not pounds.' },
      { text: 'Degrees (°C)', isCorrect: false, feedback: 'Temperature is in degrees, but dose is in Gray (Gy).' }
    ],
    timeLimit: 6,
    momentumPath: 'always'
  },
  {
    id: 'q9-practical-application-high',
    text: 'Quick check on units - absorbed dose measured in...',
    options: [
      { text: 'Gray (Gy)', isCorrect: true, feedback: 'Correct. Gy for dose, Gy/min for dose rate.' },
      { text: 'Pounds (lbs)', isCorrect: false, feedback: 'Nope! Gray (Gy) is our dose unit, not pounds.' },
      { text: 'Degrees (°C)', isCorrect: false, feedback: 'Temperature is in degrees, but dose is in Gray (Gy).' }
    ],
    timeLimit: 6,
    momentumPath: 'always'
  },
  {
    id: 'q10-safety-scenario',
    text: '"You\'re setting up a treatment and notice the door interlock light is flickering. What\'s your call?"',
    options: [
      { text: 'Stop and check the interlock system', isCorrect: true, feedback: 'Absolutely! Never compromise on safety systems. Patient can wait 5 minutes.' },
      { text: 'Continue if patient is waiting', isCorrect: false, feedback: 'No way! Safety systems come first, always. Patient can wait.' },
      { text: 'Just ignore the flickering', isCorrect: false, feedback: 'Never ignore safety warnings! Stop and check the system.' }
    ],
    timeLimit: 7,
    momentumPath: 'always'
  },
  {
    id: 'q11-equipment-knowledge-low',
    text: '"The part that actually makes the X-rays is called the..."',
    options: [
      { text: 'Target', isCorrect: true, feedback: 'Right! The target is where X-rays are produced.' },
      { text: 'Couch', isCorrect: false, feedback: 'The couch holds the patient - X-rays come from the target.' },
      { text: 'Computer', isCorrect: false, feedback: 'Computer controls things, but X-rays are made at the target.' }
    ],
    timeLimit: 4,
    momentumPath: 'always'
  },
  {
    id: 'q11-equipment-knowledge-high',
    text: '"Primary X-ray production happens in the..."',
    options: [
      { text: 'Target', isCorrect: true, feedback: 'Correct! That\'s where the electron beam hits to produce X-rays.' },
      { text: 'Couch', isCorrect: false, feedback: 'The couch holds the patient - X-rays come from the target.' },
      { text: 'Computer', isCorrect: false, feedback: 'Computer controls things, but X-rays are made at the target.' }
    ],
    timeLimit: 4,
    momentumPath: 'always'
  },
  {
    id: 'q12-future-learning',
    text: '"Next time you\'re here, what would you like to dive deeper into?"',
    options: [
      { text: 'Daily QA procedures', isCorrect: true, feedback: 'Perfect! QA is the foundation of good treatment delivery.' },
      { text: 'Advanced troubleshooting', isCorrect: true, feedback: 'Great choice! Problem-solving keeps treatments running smoothly.' },
      { text: 'Treatment planning integration', isCorrect: true, feedback: 'Excellent! Understanding the planning connection is crucial.' }
    ],
    timeLimit: 6,
    momentumPath: 'always'
  }
];

// Keyframe animations
const pulse = keyframes`
  0% { opacity: 0.7; }
  50% { opacity: 1; }
  100% { opacity: 0.7; }
`;

const slideIn = keyframes`
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
`;

const focusTransition = keyframes`
  0% { transform: scale(1) translateX(-50%) translateY(-50%); }
  100% { transform: scale(1.05) translateX(-50%) translateY(-50%); }
`;

const vignetteIn = keyframes`
  0% { opacity: 0; }
  100% { opacity: 1; }
`;

// Main container matching TutorialActivity style
const TestActivityContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: linear-gradient(145deg, #0f172a 0%, #1e293b 100%);
  color: ${colors.text};
  font-family: ${typography.fontFamily.pixel};
  display: flex;
  flex-direction: column;
  z-index: 1000;
  overflow: visible; /* Ensure no clipping */
`;

// Subtle header section - only visible during intro phase
const TestHeader = styled.div<{ $visible: boolean }>`
  background: ${props => props.$visible ? 'rgba(132, 90, 245, 0.05)' : 'transparent'};
  border-bottom: ${props => props.$visible ? `1px solid rgba(132, 90, 245, 0.2)` : 'none'};
  padding: ${props => props.$visible ? spacing.md : '0'};
  text-align: center;
  transition: all 0.3s ease;
  height: ${props => props.$visible ? 'auto' : '0'};
  overflow: hidden;
  opacity: ${props => props.$visible ? 1 : 0};
`;

const TestTitle = styled.h1<{ $minimal?: boolean }>`
  color: ${colors.textDim};
  font-size: ${props => props.$minimal ? typography.fontSize.sm : typography.fontSize.lg};
  margin: 0;
  text-shadow: none;
  font-weight: normal;
  transition: all 0.3s ease;
`;

const TestSubtitle = styled.p`
  color: ${colors.textDim};
  font-size: ${typography.fontSize.xs};
  margin: ${spacing.xs} 0 0 0;
  font-style: italic;
  opacity: 0.7;
`;

// Main content area
const TestContent = styled.div`
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${spacing.xl};
  padding: ${spacing.xl};
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
  animation: ${slideIn} 0.7s ease-out 0.2s both;
`;

// Jesse portrait section
const MentorSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${spacing.lg};
`;

const MentorPortrait = styled.div`
  width: 200px;
  height: 200px;
  border: 4px solid ${colors.highlight};
  border-radius: ${spacing.sm};
  background: ${colors.backgroundAlt};
  overflow: hidden;
  box-shadow: 0 8px 0 ${colors.border}, 0 12px 20px rgba(0,0,0,0.4);
  animation: ${pulse} 3s infinite;
`;

const MentorDialogue = styled.div`
  background: ${colors.background};
  ${borders.pixelBorder.outer}
  border-radius: ${spacing.sm};
  padding: ${spacing.xl};
  max-width: 400px;
  position: relative;
  box-shadow: 0 8px 0 ${colors.border}, 0 0 0 4px ${colors.border};
`;

const SpeakerName = styled.div`
  color: ${colors.highlight};
  font-weight: bold;
  font-size: ${typography.fontSize.md};
  margin-bottom: ${spacing.xs};
  text-shadow: ${typography.textShadow.pixel};
`;

const DialogueText = styled.div<{ $waitingForClick?: boolean }>`
  font-size: ${typography.fontSize.md};
  line-height: 1.6;
  color: ${colors.text};
  min-height: 60px;
  cursor: ${props => props.$waitingForClick ? 'pointer' : 'default'};
  position: relative;
  
  ${props => props.$waitingForClick && css`
    &::after {
      content: '▶ Click to continue';
      position: absolute;
      bottom: -25px;
      right: 0;
      font-size: ${typography.fontSize.xs};
      color: ${colors.textDim};
      animation: ${pulse} 2s infinite;
      font-style: italic;
    }
  `}
`;

// Test state display section
const TestStateSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${spacing.lg};
`;

const TestStateCard = styled.div`
  background: rgba(132, 90, 245, 0.05);
  border: 2px solid ${colors.highlight};
  border-radius: ${spacing.sm};
  padding: ${spacing.lg};
  box-shadow: 0 4px 0 ${colors.border};
`;

const StateTitle = styled.h3`
  color: ${colors.highlight};
  font-size: ${typography.fontSize.lg};
  margin: 0 0 ${spacing.md} 0;
  text-shadow: ${typography.textShadow.pixel};
`;

const StatItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${spacing.sm} 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  
  &:last-child {
    border-bottom: none;
  }
`;

const StatLabel = styled.span`
  color: ${colors.textDim};
  font-size: ${typography.fontSize.sm};
`;

const StatValue = styled.span`
  color: ${colors.text};
  font-weight: bold;
  font-size: ${typography.fontSize.md};
`;

// Status indicators
const StatusIndicator = styled.div<{ $status: 'ready' | 'active' | 'complete' }>`
  display: inline-block;
  padding: ${spacing.xs} ${spacing.sm};
  border-radius: ${spacing.xs};
  font-size: ${typography.fontSize.xs};
  font-weight: bold;
  text-transform: uppercase;
  background: ${props => 
    props.$status === 'ready' ? colors.active :
    props.$status === 'active' ? colors.highlight :
    colors.active
  };
  color: ${colors.background};
  animation: ${props => props.$status === 'active' ? css`${pulse} 1.5s infinite` : 'none'};
`;

// Control buttons
const ControlsSection = styled.div`
  padding: ${spacing.lg};
  border-top: 2px solid ${colors.border};
  display: flex;
  justify-content: center;
  gap: ${spacing.lg};
  background: rgba(15, 23, 42, 0.8);
`;

const ControlButton = styled.button<{ $variant?: 'primary' | 'secondary' }>`
  background: ${props => props.$variant === 'primary' ? colors.highlight : colors.backgroundAlt};
  color: ${props => props.$variant === 'primary' ? colors.background : colors.text};
  border: 2px solid ${props => props.$variant === 'primary' ? colors.highlight : colors.border};
  border-radius: ${spacing.sm};
  padding: ${spacing.md} ${spacing.lg};
  font-family: ${typography.fontFamily.pixel};
  font-size: ${typography.fontSize.md};
  cursor: pointer;
  transition: all ${animation.duration.fast} ${animation.easing.pixel};
  box-shadow: 0 4px 0 ${props => props.$variant === 'primary' ? colors.border : colors.backgroundAlt};
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 0 ${props => props.$variant === 'primary' ? colors.border : colors.backgroundAlt};
  }
  
  &:active {
    transform: translateY(2px);
    box-shadow: 0 2px 0 ${props => props.$variant === 'primary' ? colors.border : colors.backgroundAlt};
  }
`;

// Question UI Components
const QuestionContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${spacing.xs};
  max-width: 600px;
  margin: 0 auto;
  padding-bottom: 200px; /* More space for abilities bar */
  animation: ${slideIn} 0.5s ease-out;
  min-height: calc(100vh - 160px); /* Ensure full viewport usage */
  overflow: visible;
`;

// Enhanced ability bar with more space for larger bars
const AbilityBarContainer = styled.div`
  position: fixed;
  bottom: 60px; /* Increased for larger bars */
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: flex-end; /* Align to bottom since bars are different heights */
  gap: ${spacing.xl}; /* Increased gap for larger bars */
  z-index: 1000;
  overflow: visible; /* Ensure badges and tooltips can extend */
  /* No background, border, padding, or backdrop-filter to avoid truncation */
`;

const MeterContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${spacing.xs};
  cursor: pointer;
  transition: transform 0.2s ease;
  overflow: visible; /* Ensure no clipping within container */
  
  &:hover {
    transform: scale(1.05);
  }
`;

// NEW: Insight Bar with Frame-to-Frame Animation (spendable resource meter) - SCALED UP
const InsightBarHorizontal = styled.img<{ $frameIndex: number }>`
  width: 16px; /* Original frame width */
  height: 55px; /* Original frame height */
  object-fit: none;
  object-position: ${props => props.$frameIndex * -16}px 0px; /* Discrete frame positioning */
  image-rendering: pixelated;
  transform: scale(3); /* Scale up 3x for visibility */
  transform-origin: bottom center; /* Scale from bottom */
  
  /* NO smooth transitions - instant frame changes for pixel-perfect animation */
  transition: transform 0.2s ease, filter 0.2s ease; /* Only animate scale and filter, not position */
  
  /* Enhance visual feedback for spendable resource */
  filter: ${props => props.$frameIndex >= 25 ? 'brightness(1.1) saturate(1.2)' : 'brightness(0.9)'};
  
  &:hover {
    filter: brightness(1.1) saturate(1.2) drop-shadow(0 0 8px rgba(132, 90, 245, 0.4));
    transform: scale(3.1); /* Slightly larger on hover */
  }
`;

// NEW: Momentum Bar with Frame-to-Frame Animation (flow state progression) - SCALED UP
const MomentumBarHorizontal = styled.img<{ $frameIndex: number }>`
  width: 16px; /* Original frame width */
  height: 48px; /* Original frame height */
  object-fit: none;
  object-position: ${props => props.$frameIndex * -16}px 0px; /* Discrete frame positioning */
  image-rendering: pixelated;
  transform: scale(3); /* Scale up 3x for visibility */
  transform-origin: bottom center; /* Scale from bottom */
  
  /* NO smooth transitions - instant frame changes for pixel-perfect animation */
  transition: transform 0.2s ease, filter 0.2s ease; /* Only animate scale and filter, not position */
  
  /* Subtle visual feedback for flow state */
  filter: ${props => {
    if (props.$frameIndex >= 7) return 'brightness(1.15) saturate(1.2)';
    if (props.$frameIndex >= 4) return 'brightness(1.1) saturate(1.1)';
    if (props.$frameIndex >= 1) return 'brightness(1.05) saturate(1.05)';
    return 'brightness(0.9)';
  }};
  
  &:hover {
    transform: scale(3.1); /* Slightly larger on hover */
    filter: brightness(1.2) saturate(1.2);
  }
`;

const MeterValue = styled.div`
  font-family: ${typography.fontFamily.pixel};
  font-size: ${typography.fontSize.sm}; /* Increased for larger bars */
  color: ${colors.text};
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
  font-weight: bold;
  margin-top: ${spacing.xs};
`;

const AbilitySeparator = styled.div`
  width: 2px;
  height: 48px;
  background: rgba(132, 90, 245, 0.4);
  border-radius: 1px;
  margin: 0 ${spacing.sm};
`;

const AbilityIconContainer = styled.div<{ $available: boolean; $active: boolean }>`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${spacing.xs};
  cursor: ${props => props.$available ? 'pointer' : 'not-allowed'};
  transition: all 0.3s ease;
  overflow: visible; /* Prevent clipping of cost badge */
  
  /* Enhanced "CLICK TO USE" affordance */
  ${props => props.$available && !props.$active && css`
    &::after {
      content: '';
      position: absolute;
      top: -2px;
      left: -2px;
      right: -2px;
      bottom: -2px;
      border: 2px dashed rgba(132, 90, 245, 0.6);
      border-radius: ${spacing.xs};
      opacity: 0;
      animation: clickPrompt 2s infinite;
    }
    
    @keyframes clickPrompt {
      0%, 100% { opacity: 0; }
      50% { opacity: 0.7; }
    }
  `}
  
  &:hover {
    ${props => props.$available && !props.$active && css`
      transform: scale(1.1);
      
      /* Enhanced hover glow for available abilities */
      & > img {
        filter: brightness(1.2) saturate(1.3) drop-shadow(0 0 20px rgba(132, 90, 245, 0.8));
      }
      
      /* Stop the click prompt animation on hover */
      &::after {
        opacity: 1 !important;
        animation: none;
        border-color: rgba(132, 90, 245, 1);
        border-style: solid;
      }
    `}
    
    ${props => !props.$available && css`
      /* Enhanced shake effect for unaffordable abilities */
      animation: shake 0.6s ease-in-out;
      
      & > img {
        filter: brightness(0.3) saturate(0.5);
      }
    `}
  }
  
  /* Enhanced shake animation for unaffordable abilities */
  @keyframes shake {
    0%, 100% { transform: translateX(0) scale(1); }
    15% { transform: translateX(-3px) scale(0.98); }
    30% { transform: translateX(3px) scale(0.98); }
    45% { transform: translateX(-2px) scale(0.99); }
    60% { transform: translateX(2px) scale(0.99); }
    75% { transform: translateX(-1px) scale(1); }
  }
`;

const AbilityImageIcon = styled.img<{ $available: boolean; $active: boolean }>`
  width: 162px; /* Reduced from 216px for better balance with larger bars */
  height: 120px; /* Reduced from 160px for better balance with larger bars */
  object-fit: contain;
  image-rendering: pixelated;
  border-radius: ${spacing.xs};
  transition: all 0.3s ease;
  
  /* Enhanced visual states */
  filter: ${props => {
    let filters = [];
    if (!props.$available) {
      filters.push('grayscale(1)');
      filters.push('brightness(0.4)');
      filters.push('contrast(0.6)');
    } else if (props.$active) {
      filters.push('brightness(1.2)');
      filters.push('saturate(1.3)');
      filters.push('drop-shadow(0 0 20px rgba(34, 197, 94, 0.8))');
      filters.push('drop-shadow(0 0 40px rgba(34, 197, 94, 0.4))');
    } else {
      filters.push('brightness(1.0)');
      filters.push('saturate(1.1)');
    }
    return filters.join(' ');
  }};
  
  opacity: ${props => props.$available ? 1 : 0.5};
  
  /* Active state gets a subtle scale and animated glow */
  transform: ${props => props.$active ? 'scale(1.02)' : 'scale(1)'};
  
  /* Animated glow for active abilities */
  ${props => props.$active && css`
    animation: ${pulse} 2s infinite;
  `}
  
  /* Not affordable gets a subtle red tint */
  ${props => !props.$available && css`
    box-shadow: inset 0 0 20px rgba(239, 68, 68, 0.3);
  `}
  
  /* Available but not active gets subtle highlight */
  ${props => props.$available && !props.$active && css`
    box-shadow: 0 0 8px rgba(132, 90, 245, 0.3);
  `}
`;

// Helper function to get ability icon path
const getAbilityIconPath = (abilityId: string): string => {
  switch (abilityId) {
    case 'perfect_path': return '/images/ui/perfect-path-icon.png';
    case 'laser_focus': return '/images/ui/laser-focus-icon.png';
    case 'fast_learner': return '/images/ui/fast-learner-icon.png';
    default: return '/images/ui/fast-learner-icon.png'; // fallback
  }
};

const AbilityCostBadge = styled.div<{ $affordable: boolean }>`
  position: absolute;
  top: -4px; /* Move slightly down so the full badge is visible */
  right: -8px;
  background: ${props => props.$affordable ? 
    'linear-gradient(135deg, rgba(132, 90, 245, 0.9), rgba(168, 139, 250, 0.9))' : 
    'linear-gradient(135deg, rgba(239, 68, 68, 0.8), rgba(185, 28, 28, 0.8))'
  };
  color: ${colors.text};
  font-family: ${typography.fontFamily.pixel};
  font-size: ${typography.fontSize.xs};
  font-weight: bold;
  padding: 3px 7px;
  border: 2px solid ${props => props.$affordable ? 
    'rgba(132, 90, 245, 0.6)' : 
    'rgba(239, 68, 68, 0.6)'
  };
  border-radius: 3px;
  box-shadow: ${props => props.$affordable ?
    '0 3px 6px rgba(132, 90, 245, 0.4)' :
    '0 3px 6px rgba(239, 68, 68, 0.4)'
  };
  transition: all 0.3s ease;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
  
  /* Subtle pulse for unaffordable abilities */
  ${props => !props.$affordable && css`
    animation: ${pulse} 1.5s infinite;
  `}
`;

const SimpleTooltip = styled.div<{ $visible: boolean; $index: number }>`
  position: fixed; /* Changed from absolute to fixed for viewport positioning */
  bottom: 280px; /* Increased clearance for larger bars */
  left: ${props => {
    if (props.$index === -1) return 'calc(50% - 350px)'; // Insight meter - adjusted for larger spacing
    if (props.$index === -2) return 'calc(50% - 200px)'; // Momentum meter - left of center
    return `calc(50% + ${props.$index * 100 - 150}px)`; // Abilities - adjusted for larger spacing
  }};
  transform: translateX(-50%);
  background: rgba(15, 23, 42, 0.95);
  border: 1px solid rgba(132, 90, 245, 0.6);
  border-radius: ${spacing.xs};
  padding: ${spacing.sm};
  font-family: ${typography.fontFamily.pixel};
  font-size: ${typography.fontSize.xs};
  color: ${colors.text};
  opacity: ${props => props.$visible ? 1 : 0};
  pointer-events: none;
  z-index: 1010;
  max-width: 220px; /* Slightly wider for better text display */
  text-align: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
  
  &::after {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    border: 6px solid transparent;
    border-top-color: rgba(132, 90, 245, 0.6);
  }
`;

// Enhanced Resource Display
const SimpleResourceDisplay = styled.div`
  position: fixed;
  top: 20px;
  right: 20px;
  background: rgba(15, 23, 42, 0.9);
  padding: ${spacing.md};
  border-radius: ${spacing.sm};
  border: 2px solid rgba(132, 90, 245, 0.4);
  backdrop-filter: blur(8px);
  z-index: 1000;
  min-width: 220px;
  font-size: ${typography.fontSize.sm};
  opacity: 0.95;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  
  &:hover {
    opacity: 1;
    transform: scale(1.02);
  }
`;

// NEW: Compact Mastery Counter - Top Right Position
const MasteryCounterContainer = styled.div<{ $visible: boolean }>`
  position: fixed;
  top: 20px;
  right: 240px; /* Position next to existing resource display */
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.85), rgba(255, 193, 7, 0.8));
  border: 2px solid rgba(255, 215, 0, 0.8);
  border-radius: ${spacing.sm};
  padding: ${spacing.sm} ${spacing.md};
  z-index: 1050;
  opacity: ${props => props.$visible ? 0.9 : 0};
  transform: ${props => props.$visible ? 'scale(1)' : 'scale(0.9)'};
  transition: all 0.3s ease;
  box-shadow: 
    0 4px 12px rgba(255, 215, 0, 0.3),
    0 0 0 1px rgba(255, 215, 0, 0.4);
  font-family: ${typography.fontFamily.pixel};
  text-align: center;
  min-width: 180px;
  backdrop-filter: blur(8px);
  
  &:hover {
    opacity: 1;
    transform: scale(1.05);
  }
`;

const MasteryTitle = styled.div`
  color: #8B4513;
  font-size: ${typography.fontSize.xs};
  font-weight: bold;
  margin-bottom: 2px;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
  opacity: 0.9;
`;

const MasteryValue = styled.div<{ $animating?: boolean }>`
  color: #B8860B;
  font-size: ${typography.fontSize.lg};
  font-weight: bold;
  text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.4);
  margin-bottom: 2px;
  transition: all 0.3s ease;
  
  ${props => props.$animating && css`
    transform: scale(1.15);
    color: #FFD700;
    text-shadow: 
      1px 1px 3px rgba(0, 0, 0, 0.4),
      0 0 12px rgba(255, 215, 0, 0.6);
  `}
`;

const MasterySubtitle = styled.div`
  color: #8B4513;
  font-size: ${typography.fontSize.xs};
  opacity: 0.7;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.2);
`;

// NEW: Dramatic Mastery Gain Animation System
const MasteryGainAnimation = styled.div<{ 
  $visible: boolean; 
  $gainAmount: number;
  $position: { x: number; y: number };
}>`
  position: fixed;
  left: ${props => props.$position.x}px;
  top: ${props => props.$position.y}px;
  transform: translateX(-50%);
  pointer-events: none;
  z-index: 1100;
  font-family: ${typography.fontFamily.pixel};
  font-weight: bold;
  opacity: ${props => props.$visible ? 1 : 0};
  
  /* Gain amount determines animation style */
  font-size: ${props => 
    props.$gainAmount === 1 ? typography.fontSize.lg :
    props.$gainAmount === 2 ? typography.fontSize.xl :
    '32px' /* BIG celebration for +3 */
  };
  
  color: ${props => 
    props.$gainAmount === 1 ? '#22C55E' :
    props.$gainAmount === 2 ? '#10B981' :
    '#FFD700' /* Gold for +3 */
  };
  
  text-shadow: ${props => 
    props.$gainAmount === 1 ? '2px 2px 4px rgba(0, 0, 0, 0.5)' :
    props.$gainAmount === 2 ? '2px 2px 6px rgba(0, 0, 0, 0.6), 0 0 10px rgba(16, 185, 129, 0.5)' :
    '3px 3px 8px rgba(0, 0, 0, 0.7), 0 0 20px rgba(255, 215, 0, 0.8), 0 0 40px rgba(255, 215, 0, 0.4)'
  };
  
  animation: ${props => {
    if (props.$gainAmount === 1) return 'masteryGainSmall 1.2s ease-out';
    if (props.$gainAmount === 2) return 'masteryGainMedium 1.5s ease-out';
    return 'masteryGainBig 2.0s ease-out';
  }};
  
  &::before {
    content: '+${props => props.$gainAmount}';
    margin-right: ${spacing.xs};
  }
  
  /* Keyframe animations for different gain amounts */
  @keyframes masteryGainSmall {
    0% { transform: translateX(-50%) translateY(0) scale(0.5); opacity: 0; }
    20% { transform: translateX(-50%) translateY(-20px) scale(1.1); opacity: 1; }
    100% { transform: translateX(-50%) translateY(-60px) scale(0.8); opacity: 0; }
  }
  
  @keyframes masteryGainMedium {
    0% { transform: translateX(-50%) translateY(0) scale(0.3); opacity: 0; }
    15% { transform: translateX(-50%) translateY(-15px) scale(1.2); opacity: 1; }
    30% { transform: translateX(-50%) translateY(-25px) scale(1.0); }
    100% { transform: translateX(-50%) translateY(-80px) scale(0.7); opacity: 0; }
  }
  
  @keyframes masteryGainBig {
    0% { transform: translateX(-50%) translateY(0) scale(0.2); opacity: 0; }
    10% { transform: translateX(-50%) translateY(-10px) scale(1.4); opacity: 1; }
    25% { transform: translateX(-50%) translateY(-20px) scale(1.1); }
    40% { transform: translateX(-50%) translateY(-30px) scale(1.2); }
    100% { transform: translateX(-50%) translateY(-100px) scale(0.6); opacity: 0; }
  }
`;

const ResourceItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${spacing.sm};
  padding: ${spacing.xs} 0;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const ResourceLabel = styled.span`
  color: ${colors.textDim};
  font-size: ${typography.fontSize.sm};
  opacity: 0.9;
  font-weight: 500;
`;

const ResourceValue = styled.span<{ $highlight?: boolean }>`
  color: ${props => props.$highlight ? colors.highlight : colors.text};
  font-weight: bold;
  font-size: ${typography.fontSize.md};
`;

const QuestionHeader = styled.div`
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin-bottom: ${spacing.xs};
  position: relative;
`;

const QuestionProgress = styled.div`
  color: ${colors.textDim};
  font-size: ${typography.fontSize.xs};
  opacity: 0.6;
  position: absolute;
  top: 0;
  right: 0;
  background: rgba(15, 23, 42, 0.8);
  padding: ${spacing.xs} ${spacing.sm};
  border-radius: ${spacing.xs};
  border: 1px solid rgba(132, 90, 245, 0.2);
  backdrop-filter: blur(4px);
`;

const MomentumDisplay = styled.div<{ $level: number }>`
  display: flex;
  align-items: center;
  gap: ${spacing.sm};
  color: ${props => 
    props.$level <= 3 ? colors.textDim :
    props.$level <= 6 ? colors.active :
    colors.highlight
  };
  font-size: ${typography.fontSize.sm};
  font-weight: bold;
`;

// Using PixelQuestionContainer instead of styled QuestionCard

const QuestionText = styled.div`
  font-size: ${typography.fontSize.md};
  line-height: 0.7;
  color: ${colors.text};
  margin-bottom: ${spacing.xs};
  min-height: 40px;
  
  /* Override any TypewriterText line spacing */
  * {
    line-height: inherit !important;
    margin: 0 !important;
    padding: 0 !important;
  }
`;

const OptionsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${spacing.xxs};
`;

// Using CardContainer instead of styled OptionButton

const FeedbackDisplay = styled.div<{ $visible: boolean; $correct: boolean }>`
  background: ${props => props.$correct ? 
    'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)'
  };
  border: 2px solid ${props => props.$correct ? colors.active : colors.highlight};
  border-radius: ${spacing.sm};
  padding: ${spacing.lg};
  margin-top: ${spacing.md};
  opacity: ${props => props.$visible ? 1 : 0};
  transform: ${props => props.$visible ? 'translateY(0)' : 'translateY(-10px)'};
  transition: all 0.3s ease;
  
  font-size: ${typography.fontSize.md};
  color: ${colors.text};
  line-height: 1.6;
`;

const MasteryPopup = styled.div<{ $visible: boolean; $level: number }>`
  position: fixed;
  bottom: 160px;
  right: 24px;
  background: rgba(15, 23, 42, 0.9);
  border: 1px solid ${props => 
    props.$level === 1 ? 'rgba(132, 90, 245, 0.3)' :
    props.$level === 2 ? 'rgba(34, 197, 94, 0.4)' :
    'rgba(255, 215, 0, 0.5)'
  };
  border-radius: ${spacing.xs};
  padding: ${spacing.xs} ${spacing.sm};
  color: ${props => 
    props.$level === 1 ? colors.textDim :
    props.$level === 2 ? colors.active :
    colors.highlight
  };
  font-family: ${typography.fontFamily.pixel};
  font-size: ${typography.fontSize.xs};
  font-weight: normal;
  opacity: ${props => props.$visible ? 0.9 : 0};
  transform: ${props => props.$visible ? 'translateY(0)' : 'translateY(10px)'};
  transition: all 0.2s ease;
  z-index: 1000;
  backdrop-filter: blur(4px);
  
  &::before {
    content: '+';
    margin-right: ${spacing.xs};
    font-weight: bold;
  }
`;

// Subtle momentum visual feedback - much less overwhelming
const MomentumOverlay = styled.div<{ $momentumLevel: 'low' | 'medium' | 'high' }>`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  pointer-events: none;
  z-index: 500;
  transition: all 0.8s ease;
  
  ${props => props.$momentumLevel === 'high' && css`
    background: radial-gradient(
      circle at center,
      transparent 60%,
      rgba(132, 90, 245, 0.03) 90%,
      rgba(132, 90, 245, 0.06) 100%
    );
  `}
`;

const MomentumContentWrapper = styled.div<{ $momentumLevel: 'low' | 'medium' | 'high' }>`
  position: relative;
  transition: all 0.6s ease;
  
  ${props => props.$momentumLevel === 'high' && css`
    filter: contrast(1.05) saturate(1.1) brightness(1.02);
  `}
`;

const MomentumTransitionEffect = styled.div<{ $isTransitioning: boolean; $newLevel: 'low' | 'medium' | 'high' }>`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  pointer-events: none;
  z-index: 600;
  opacity: ${props => props.$isTransitioning ? 0.3 : 0}; // Much more subtle
  background: ${props => 
    props.$newLevel === 'high' ? 'rgba(132, 90, 245, 0.08)' : 'transparent'
  };
  transition: opacity 0.4s ease-out; // Much faster
`;

const MomentumIndicatorEnhanced = styled.div<{ $level: number; $isChanging: boolean }>`
  position: absolute;
  top: 0;
  left: 0;
  display: flex;
  align-items: center;
  gap: ${spacing.xs};
  color: ${props => 
    props.$level <= 3 ? colors.textDim :
    props.$level <= 6 ? colors.active :
    colors.highlight
  };
  font-size: ${typography.fontSize.xs};
  font-weight: normal;
  transition: all 0.5s ease;
  background: rgba(15, 23, 42, 0.8);
  padding: ${spacing.xs} ${spacing.sm};
  border-radius: ${spacing.xs};
  border: 1px solid rgba(132, 90, 245, 0.2);
  backdrop-filter: blur(4px);
  opacity: 0.7;
  
  ${props => props.$isChanging && css`
    opacity: 1;
    transform: scale(1.05);
  `}
  
  ${props => props.$level >= 7 && css`
    opacity: 1;
    box-shadow: 0 0 8px rgba(132, 90, 245, 0.4);
  `}
`;

const AbilityActiveFeedback = styled.div`
  position: fixed;
  bottom: 180px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(34, 197, 94, 0.8);
  color: white;
  padding: ${spacing.xs} ${spacing.sm};
  border-radius: ${spacing.xs};
  font-family: ${typography.fontFamily.pixel};
  font-size: ${typography.fontSize.xs};
  font-weight: normal;
  z-index: 1001;
  backdrop-filter: blur(4px);
  border: 1px solid rgba(34, 197, 94, 0.6);
  opacity: 0.9;
`;

// Tooltip component
const AbilityTooltip = styled.div<{ $visible: boolean }>`
  position: absolute;
  bottom: 115%; /* Slightly more space above the ability slot */
  left: 50%;
  transform: translateX(-50%);
  background: rgba(15, 23, 42, 0.98);
  color: ${colors.text};
  padding: ${spacing.sm} ${spacing.md};
  border-radius: ${spacing.sm};
  font-family: ${typography.fontFamily.pixel};
  font-size: ${typography.fontSize.sm}; /* Slightly larger for better readability */
  white-space: nowrap;
  z-index: 1050; /* Higher z-index to ensure it's above everything */
  border: 2px solid rgba(132, 90, 245, 0.6);
  backdrop-filter: blur(8px);
  opacity: ${props => props.$visible ? 1 : 0};
  visibility: ${props => props.$visible ? 'visible' : 'hidden'};
  transition: all 0.2s ease;
  pointer-events: none;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.6);
  font-weight: bold; /* Make text more prominent */
  
  &::after {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    border: 8px solid transparent;
    border-top-color: rgba(15, 23, 42, 0.98);
  }
`;

// Old styled components removed - replaced with simple PNG-based approach

// Onboarding overlay
const OnboardingOverlay = styled.div<{ $visible: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(4px);
  z-index: 2000;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  opacity: ${props => props.$visible ? 1 : 0};
  pointer-events: ${props => props.$visible ? 'all' : 'none'};
  transition: opacity 0.3s ease;
  gap: 80px; /* Increased from 48px (xxl) to 80px for much more spacing */
`;

const VisualGuideImage = styled.img`
  max-width: 1200px; /* Increased from 960px to 1200px */
  width: 85vw; /* Increased from 80vw to 85vw for larger screens */
  height: auto;
  image-rendering: pixelated;
  border-radius: ${spacing.sm};
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  transform: scale(1.1); /* Increased from 1.2 to 1.5 for much more prominence */
`;

const DismissButton = styled.button`
  width: auto;
  min-width: 300px;
  padding: ${spacing.md} ${spacing.xl};
  background: linear-gradient(135deg, rgba(132, 90, 245, 0.8), rgba(168, 139, 250, 0.8));
  border: 2px solid rgba(132, 90, 245, 0.6);
  border-radius: ${spacing.sm};
  color: ${colors.text};
  font-family: ${typography.fontFamily.pixel};
  font-size: ${typography.fontSize.md};
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: linear-gradient(135deg, rgba(132, 90, 245, 1), rgba(168, 139, 250, 1));
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(132, 90, 245, 0.4);
  }
`;

interface TestActivityProps {
  mentorId?: MentorId;
  onComplete: () => void;
  skipIntro?: boolean; // New prop to skip intro and go directly to questions
}

export default function TestActivity({ mentorId = 'jesse' as MentorId, onComplete, skipIntro = false }: TestActivityProps) {
  const { transitionToScene } = useSceneStore();
  const { insight, momentum: resourceMomentum, starPoints } = useResourceStore();
  const { playerName } = useGameStore();
  
  // Main activity phase - start in questions if skipIntro is true
  const [activityPhase, setActivityPhase] = useState<'intro' | 'questions' | 'summary'>(skipIntro ? 'questions' : 'intro');
  
  // Onboarding overlay state
  const [showOnboarding, setShowOnboarding] = useState(false);
  
  // Intro dialogue states
  const [dialoguePhase, setDialoguePhase] = useState<'intro' | 'ready' | 'coming-soon'>('intro');
  const [showTypewriter, setShowTypewriter] = useState(true);
  const [waitingForClick, setWaitingForClick] = useState(false);
  
  // Question flow states
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentMomentum, setCurrentMomentum] = useState(0); // Local momentum for this activity (0-10)
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [questionsCompleted, setQuestionsCompleted] = useState(0);
  const [totalMasteryGained, setTotalMasteryGained] = useState(0);
  
  // NEW: Mastery animation states for dramatic feedback
  const [showMasteryAnimation, setShowMasteryAnimation] = useState(false);
  const [lastMasteryGain, setLastMasteryGain] = useState(0);
  const [masteryAnimating, setMasteryAnimating] = useState(false);
  
  // NEW: Insight bar animation states
  const [insightAnimating, setInsightAnimating] = useState(false);
  const [insightAnimationFrame, setInsightAnimationFrame] = useState(0);
  
  // Simple abilities for testing
  const [selectedAbility, setSelectedAbility] = useState<number | null>(null);
  const [activeAbilities, setActiveAbilities] = useState<{[key: string]: boolean}>({});
  const [abilityEffects, setAbilityEffects] = useState<{[key: string]: any}>({});
  const [hoveredAbility, setHoveredAbility] = useState<number | null>(null);
  const testAbilities = [
    { id: 'perfect_path', name: 'Perfect Path', icon: '🎯', cost: 20, type: 'insight', 
      description: 'Guarantee correct answer + prevent momentum loss',
      tooltip: 'Force correct answer' },
    { id: 'laser_focus', name: 'Laser Focus', icon: '⚡', cost: 15, type: 'insight', 
      description: 'Double momentum gain on next correct answer',
      tooltip: 'Double momentum gain' },
    { id: 'fast_learner', name: 'Fast Learner', icon: '💡', cost: 10, type: 'insight', 
      description: 'Skip next question with base mastery gain',
      tooltip: 'Skip question for points' }
  ];
  
  // Old generateSmartTooltip function removed - using simple tooltips now
  
  // Momentum visual effects state  
  const [previousMomentumLevel, setPreviousMomentumLevel] = useState<'low' | 'medium' | 'high'>('low');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [momentumChanging, setMomentumChanging] = useState(false);
  
  // Auto-start questions if skipIntro is true
  React.useEffect(() => {
    if (skipIntro && activityPhase === 'questions') {
      console.log('🚀 === AUTO-STARTING JESSE\'S BEAM BASICS (SKIP INTRO) ===');
      console.log(`👤 Player: ${playerName}`);
      console.log(`💰 Starting Insight: ${insight}`);
      console.log(`⭐ Star Points: ${starPoints}`);
      
      // Initialize the same state as handleStartQuestions()
      setCurrentMomentum(1); // Start with 1 momentum as per roadmap
      setPreviousMomentumLevel('low'); // Initialize visual state
      setShowOnboarding(true); // Show onboarding overlay first
      
      // Reset abilities at start
      setActiveAbilities({});
      setAbilityEffects({});
      
      console.log('⚡ INITIAL STATE: Momentum: 1/10 (low tier), Visual Effects: ACTIVE');
    }
  }, [skipIntro, activityPhase, playerName]);
  
  // NEW: Insight bar frame-to-frame animation effect
  React.useEffect(() => {
    if (insightAnimating) {
      let frame = 2; // Start from frame 2 (beginning of animation)
      const animationInterval = setInterval(() => {
        setInsightAnimationFrame(frame);
        console.log(`🎬 INSIGHT FRAME: ${frame}/22 - Traditional pixel animation`);
        frame++;
        if (frame > 22) { // End at frame 22 (end of animation)
          setInsightAnimating(false);
          clearInterval(animationInterval);
          console.log(`✅ INSIGHT ANIMATION COMPLETE: Frames 2→22 finished`);
        }
      }, 80); // 80ms per frame for classic pixel art timing (12.5 FPS)
      
      return () => clearInterval(animationInterval);
    }
  }, [insightAnimating]);
  
  // Get momentum level for question selection
  const getMomentumLevel = (momentum: number): 'low' | 'medium' | 'high' => {
    if (momentum <= 3) return 'low';
    if (momentum <= 6) return 'medium';
    return 'high';
  };
  
  // Get questions based on current momentum and progress
  const getAvailableQuestions = (): Question[] => {
    const questions: Question[] = [];
    
    // Opening Sequence (Questions 1-2) - Always shown first
    const openingQuestions = JESSE_QUESTIONS.filter(q => 
      q.id === 'q1-equipment-id' || q.id === 'q2-basic-physics'
    );
    questions.push(...openingQuestions);
    
    // Momentum-Based Questions (Questions 3-4) - Based on current momentum level
    const momentumLevel = getMomentumLevel(currentMomentum);
    let momentumQuestions: Question[] = [];
    
    if (momentumLevel === 'low') {
      momentumQuestions = JESSE_QUESTIONS.filter(q => 
        q.id === 'q3a-safety-basics' || q.id === 'q4a-obvious-physics'
      );
    } else if (momentumLevel === 'medium') {
      momentumQuestions = JESSE_QUESTIONS.filter(q => 
        q.id === 'q3b-equipment-function' || q.id === 'q4b-clinical-context'
      );
    } else { // high momentum
      momentumQuestions = JESSE_QUESTIONS.filter(q => 
        q.id === 'q3c-applied-thinking' || q.id === 'q4c-equipment-context'
      );
    }
    questions.push(...momentumQuestions);
    
    // Final Questions (Questions 9-12) - Always shown, with momentum-adaptive delivery
    const finalQuestions: Question[] = [];
    
    // Q9 - Momentum adaptive delivery
    const q9 = JESSE_QUESTIONS.find(q => 
      momentumLevel === 'high' ? q.id === 'q9-practical-application-high' : q.id === 'q9-practical-application'
    );
    if (q9) finalQuestions.push(q9);
    
    // Q10 - Safety Scenario (same for all levels)
    const q10 = JESSE_QUESTIONS.find(q => q.id === 'q10-safety-scenario');
    if (q10) finalQuestions.push(q10);
    
    // Q11 - Momentum adaptive delivery  
    const q11 = JESSE_QUESTIONS.find(q => 
      momentumLevel === 'high' ? q.id === 'q11-equipment-knowledge-high' : q.id === 'q11-equipment-knowledge-low'
    );
    if (q11) finalQuestions.push(q11);
    
    // Q12 - Future Learning (same for all levels)
    const q12 = JESSE_QUESTIONS.find(q => q.id === 'q12-future-learning');
    if (q12) finalQuestions.push(q12);
    
    questions.push(...finalQuestions);
    
    return questions;
  };
  
  const currentQuestions = getAvailableQuestions();
  const currentQuestion = currentQuestions[currentQuestionIndex];
  
  // Memoized question text to prevent typewriter restart
  const memoizedQuestionText = useMemo(() => {
    if (activityPhase === 'questions' && currentQuestion) {
      return (
        <QuestionText>
          <TypewriterText
            key={`question-${currentQuestion.id}-${currentQuestionIndex}`}
            text={currentQuestion.text}
            speed={25}
            onComplete={() => {}}
          />
        </QuestionText>
      );
    }
    return null;
  }, [activityPhase, currentQuestion?.id, currentQuestion?.text, currentQuestionIndex]);
  
  // Debug logging when question changes
  React.useEffect(() => {
    if (currentQuestion && activityPhase === 'questions') {
      console.log(`\n📖 === QUESTION ${currentQuestionIndex + 1}/${currentQuestions.length} LOADED ===`);
      console.log(`🏷️  ID: ${currentQuestion.id}`);
      console.log(`📝 Text: "${currentQuestion.text}"`);
      console.log(`🎯 Path: ${currentQuestion.momentumPath} momentum`);
      console.log(`⏱️  Time Limit: ${currentQuestion.timeLimit}s`);
      console.log(`📊 Options: ${currentQuestion.options.length} choices`);
      currentQuestion.options.forEach((option, index) => {
        console.log(`   ${index + 1}. "${option.text}" ${option.isCorrect ? '✅' : '❌'}`);
      });
    }
  }, [currentQuestionIndex, currentQuestion, activityPhase]);

  const mentorName = mentorId === ('jesse' as MentorId) ? 'Jesse' : 'Mentor';
  const portraitSrc = getMediumPortraitSrc(mentorId as any);

  // Dialogue content based on phase
  const getDialogueContent = () => {
    switch (dialoguePhase) {
      case 'intro':
        return `Hey ${playerName}! Welcome to the Test Activity environment. This is where we'll build out Jesse's Beam Basics encounter.`;
      case 'ready':
        return `Perfect timing - I can see you've got ${insight} insight points and ${currentMomentum} momentum to work with. Ready to test the core gameplay loop?`;
      case 'coming-soon':
        return `The full activity system is coming soon! For now, you can test the resource states and UI components. Check out that debug console for more testing options.`;
      default:
        return 'Ready to begin testing!';
    }
  };

  const handleDialogueComplete = () => {
    // Instead of auto-advancing, wait for user click
    setWaitingForClick(true);
  };

  const handleDialogueClick = () => {
    if (!waitingForClick) return;
    
    setWaitingForClick(false);
    
    if (dialoguePhase === 'intro') {
      setDialoguePhase('ready');
      setShowTypewriter(true);
    } else if (dialoguePhase === 'ready') {
      setDialoguePhase('coming-soon');
      setShowTypewriter(true);
    }
    // If already at final phase, do nothing
  };

  // Handle answer selection
  const handleAnswerSelect = (optionIndex: number) => {
    if (selectedOption !== null || showFeedback) return; // Prevent multiple selections
    
    console.log(`\n🎯 === QUESTION ${currentQuestionIndex + 1}/${currentQuestions.length} ANSWERED ===`);
    console.log(`📝 Question: ${currentQuestion.id}`);
    console.log(`💭 Selected: "${currentQuestion.options[optionIndex].text}"`);
    console.log(`⚡ Current Momentum: ${currentMomentum}/10 (${getMomentumLevel(currentMomentum)})`);
    
    setSelectedOption(optionIndex);
    const selectedAnswer = currentQuestion.options[optionIndex];
    
    // Check for ability effects
    let isAnswerCorrect = selectedAnswer.isCorrect || currentQuestion.id === 'q12-future-learning';
    let momentumGainMultiplier = 1;
    const originalAnswer = isAnswerCorrect;
    
    console.log(`✅ Original Answer: ${originalAnswer ? 'CORRECT' : 'WRONG'}`);
    
    // Perfect Path ability: Force correct answer and prevent momentum loss
    if (abilityEffects.perfectPath) {
      isAnswerCorrect = true;
      console.log('🎯 PERFECT PATH ACTIVATED: Answer forced to correct! (was ' + (originalAnswer ? 'already correct' : 'wrong') + ')');
      
      // Consume the ability
      setAbilityEffects(prev => ({ ...prev, perfectPath: false }));
      setActiveAbilities(prev => ({ ...prev, perfect_path: false }));
    }
    
    // Laser Focus ability: Double momentum gain on correct answers
    if (abilityEffects.laserFocus && isAnswerCorrect) {
      momentumGainMultiplier = 2;
      console.log(`⚡ LASER FOCUS ACTIVATED: Momentum gain ×${momentumGainMultiplier}!`);
      
      // Consume the ability
      setAbilityEffects(prev => ({ ...prev, laserFocus: false }));
      setActiveAbilities(prev => ({ ...prev, laser_focus: false }));
    }
    
    // Update momentum based on answer (Q12 is special - all answers are correct)
    const oldMomentum = currentMomentum;
    let newMomentum = oldMomentum;
    
    if (isAnswerCorrect) {
      const momentumGain = 1 * momentumGainMultiplier;
      newMomentum = Math.min(10, oldMomentum + momentumGain); // Cap at 10
      console.log(`📈 MOMENTUM GAIN: +${momentumGain} (${oldMomentum} → ${newMomentum})`);
    } else {
      newMomentum = Math.max(0, oldMomentum - 1); // Floor at 0
      console.log(`📉 MOMENTUM LOSS: -1 (${oldMomentum} → ${newMomentum})`);
    }
    
    const oldLevel = getMomentumLevel(oldMomentum);
    const newLevel = getMomentumLevel(newMomentum);
    
    // Trigger visual transition if momentum level changed
    if (oldLevel !== newLevel) {
      console.log(`🌟 MOMENTUM LEVEL TRANSITION: ${oldLevel} → ${newLevel}`);
      console.log(`   💫 Visual effects changing: ${oldLevel} tier → ${newLevel} tier`);
      setPreviousMomentumLevel(oldLevel);
      setIsTransitioning(true);
      
      // Clear transition after effect completes  
      setTimeout(() => {
        setIsTransitioning(false);
      }, 400); // Reduced duration
    }
    
    // Show momentum changing indicator
    setMomentumChanging(true);
    setTimeout(() => setMomentumChanging(false), 500);
    
    setCurrentMomentum(newMomentum);
    
    // Calculate mastery gain based on momentum level (use NEW momentum level for calculation)
    const finalMomentumLevel = getMomentumLevel(newMomentum);
    const masteryGain = isAnswerCorrect ? 
      (finalMomentumLevel === 'low' ? 1 : finalMomentumLevel === 'medium' ? 2 : 3) : 0;
    
    console.log(`📚 MASTERY CALCULATION: ${isAnswerCorrect ? 'Correct' : 'Wrong'} + ${finalMomentumLevel} momentum = +${masteryGain} Beam Physics`);
    
    // Update mastery with dramatic animation triggers
    if (masteryGain > 0) {
      setLastMasteryGain(masteryGain);
      setShowMasteryAnimation(true);
      setMasteryAnimating(true);
      
      // Trigger mastery counter animation
      setTimeout(() => {
        setMasteryAnimating(false);
      }, 600);
      
      // Clear animation after effect completes
      setTimeout(() => {
        setShowMasteryAnimation(false);
      }, masteryGain === 3 ? 2000 : masteryGain === 2 ? 1500 : 1200);
    }
    
    setTotalMasteryGained(prev => {
      const newTotal = prev + masteryGain;
      console.log(`📊 Total Mastery: ${prev} → ${newTotal} (+${masteryGain})`);
      return newTotal;
    });
    setShowFeedback(true);
    
    console.log(`⏳ Showing feedback for 3 seconds...`);
    
    // Auto-advance after feedback
    setTimeout(() => {
      console.log(`\n🔄 === ADVANCING TO NEXT QUESTION ===`);
      setShowFeedback(false);
      setSelectedOption(null);
      setQuestionsCompleted(prev => {
        const newCompleted = prev + 1;
        console.log(`✅ Questions Completed: ${prev} → ${newCompleted}`);
        return newCompleted;
      });
      
      // Check for Fast Learner ability - skip next question
      if (abilityEffects.fastLearner) {
        console.log('💡 FAST LEARNER ACTIVATED: Skipping next question!');
        
        // Add base mastery value (2 points regardless of momentum)
        setTotalMasteryGained(prev => {
          const bonus = 2;
          const newTotal = prev + bonus;
          console.log(`📚 Fast Learner Bonus: +${bonus} mastery (${prev} → ${newTotal})`);
          return newTotal;
        });
        
        // Skip an additional question
        if (currentQuestionIndex < currentQuestions.length - 2) {
          const skipTo = currentQuestionIndex + 2;
          console.log(`⏭️  SKIPPING: Question ${currentQuestionIndex + 2} → Question ${skipTo + 1}`);
          setCurrentQuestionIndex(skipTo);
        } else {
          // Not enough questions to skip, just advance to summary
          console.log(`⏭️  Not enough questions left to skip - moving to summary`);
          setActivityPhase('summary');
          return;
        }
        
        // Consume the ability
        setAbilityEffects(prev => ({ ...prev, fastLearner: false }));
        setActiveAbilities(prev => ({ ...prev, fast_learner: false }));
        console.log(`🔧 Fast Learner ability consumed`);
      } else {
        // Normal advancement
        if (currentQuestionIndex < currentQuestions.length - 1) {
          const nextIndex = currentQuestionIndex + 1;
          console.log(`➡️  NORMAL ADVANCE: Question ${currentQuestionIndex + 1} → Question ${nextIndex + 1}`);
          setCurrentQuestionIndex(nextIndex);
        } else {
          // Move to summary
          console.log(`🏁 FINAL QUESTION COMPLETED - Moving to summary`);
          setActivityPhase('summary');
        }
      }
    }, 3000); // 3 second feedback display
  };

  // Handle ability activation
  const handleAbilityUse = (abilityIndex: number) => {
    const ability = testAbilities[abilityIndex];
    const { spendInsight } = useGameStore.getState();
    
    console.log(`\n🔮 === ABILITY ACTIVATION ATTEMPT ===`);
    console.log(`🎯 Ability: ${ability.name} (${ability.cost} insight)`);
    console.log(`💰 Current Insight: ${insight}`);
    
    // Check if player can afford the ability
    if (insight < ability.cost) {
      console.log(`❌ CANNOT AFFORD: Need ${ability.cost}, have ${insight} (short by ${ability.cost - insight})`);
      return false;
    }
    
    // Spend insight points using game store method
    if (!spendInsight(ability.cost)) {
      console.log(`❌ FAILED TO SPEND: spendInsight() returned false`);
      return false;
    }
    
    console.log(`💸 INSIGHT SPENT: -${ability.cost} (${insight} → ${insight - ability.cost})`);
    
    // Trigger insight bar animation
    setInsightAnimating(true);
    console.log(`🎬 INSIGHT BAR ANIMATION: Triggered filling animation (frames 2-22)`);
    
    // Activate the ability
    setActiveAbilities(prev => ({ ...prev, [ability.id]: true }));
    console.log(`✨ ABILITY ACTIVATED: ${ability.name} is now ready to trigger!`);
    
    // Set ability effects based on type
    switch (ability.id) {
      case 'perfect_path':
        setAbilityEffects(prev => ({ ...prev, perfectPath: true }));
        console.log(`🎯 Perfect Path ARMED: Next answer will be forced correct`);
        break;
      case 'laser_focus':
        setAbilityEffects(prev => ({ ...prev, laserFocus: true }));
        console.log(`⚡ Laser Focus ARMED: Next correct answer will give 2x momentum`);
        break;
      case 'fast_learner':
        setAbilityEffects(prev => ({ ...prev, fastLearner: true }));
        console.log(`💡 Fast Learner ARMED: Will skip next question after current answer`);
        break;
    }
    
    // Clear selection
    setSelectedAbility(null);
    return true;
  };

  const handleStartQuestions = () => {
    console.log('\n🚀 === STARTING JESSE\'S BEAM BASICS ===');
    console.log(`👤 Player: ${playerName}`);
    console.log(`💰 Starting Insight: ${insight}`);
    console.log(`⭐ Star Points: ${starPoints}`);
    console.log(`🎮 Questions Available: ${getAvailableQuestions().length}`);
    
    const questions = getAvailableQuestions();
    console.log('\n📚 QUESTION SEQUENCE:');
    questions.forEach((q, index) => {
      console.log(`  ${index + 1}. ${q.id} (${q.momentumPath} momentum path)`);
    });
    
    setActivityPhase('questions');
    setCurrentMomentum(1); // Start with 1 momentum as per roadmap
    setPreviousMomentumLevel('low'); // Initialize visual state
    setShowOnboarding(true); // Show onboarding overlay first
    console.log('\n⚡ INITIAL STATE:');
    console.log(`   Momentum: 1/10 (low tier)`);
    console.log(`   Visual Effects: ACTIVE`);
    console.log(`   Abilities: All reset and ready`);
    
    // Reset abilities at start
    setActiveAbilities({});
    setAbilityEffects({});
  };

  const handleDismissOnboarding = () => {
    setShowOnboarding(false);
  };

  const handleReturnToHospital = () => {
    console.log('🏥 Returning to hospital from test activity');
    transitionToScene('hospital');
  };

  const handleStartTesting = () => {
    if (activityPhase === 'intro') {
      handleStartQuestions();
    } else {
      console.log('🧪 Starting test sequence...');
      alert('Additional test features coming soon! 🚀');
    }
  };

  const renderContent = () => {
    if (activityPhase === 'questions' && currentQuestion) {
      const currentMomentumLevel = getMomentumLevel(currentMomentum);
      
      return (
        <MomentumContentWrapper $momentumLevel={currentMomentumLevel}>
          <QuestionContainer>
            <QuestionHeader>
              <QuestionProgress>
                Question {currentQuestionIndex + 1} of {currentQuestions.length}
              </QuestionProgress>
              <MomentumIndicatorEnhanced $level={currentMomentum} $isChanging={momentumChanging}>
                ⚡ Momentum: {currentMomentum}/10
                {currentMomentum >= 7 && <span style={{ marginLeft: spacing.xs }}>🔥</span>}
              </MomentumIndicatorEnhanced>
            </QuestionHeader>

            <PixelQuestionContainer 
              size="xs" 
              domain="physics" 
              isActive={currentMomentum >= 7}
              style={{ padding: '0.75rem !important' }}
            >
              <SpeakerName>{mentorName}</SpeakerName>
              {memoizedQuestionText}

              <OptionsContainer>
                {currentQuestion.options.map((option, index) => {
                  const isSelected = selectedOption === index;
                  const isCorrect = option.isCorrect;
                  const isDisabled = selectedOption !== null;
                  
                  // Determine domain based on answer state
                  let domain: 'physics' | 'dosimetry' | 'linac' | 'planning' = 'physics';
                  if (showFeedback && isCorrect) domain = 'planning'; // Green for correct
                  else if (showFeedback && isSelected && !isCorrect) domain = 'dosimetry'; // Pink for wrong
                  else if (isSelected) domain = 'linac'; // Yellow for selected
                  
                  return (
                    <CardContainer
                      key={index}
                      size="xs"
                      domain={domain}
                      isActive={isSelected}
                      isDisabled={isDisabled}
                      onClick={() => !isDisabled && handleAnswerSelect(index)}
                      style={{ 
                        minHeight: '36px',
                        textAlign: 'left',
                        display: 'flex',
                        alignItems: 'center',
                        padding: '0.5rem 0.75rem !important'
                      }}
                    >
                      {option.text}
                    </CardContainer>
                  );
                })}
              </OptionsContainer>

              {showFeedback && selectedOption !== null && currentQuestion?.options?.[selectedOption] && (
                <FeedbackDisplay 
                  $visible={showFeedback} 
                  $correct={currentQuestion.options[selectedOption].isCorrect}
                >
                  <strong>{mentorName}:</strong> {currentQuestion.options[selectedOption].feedback}
                </FeedbackDisplay>
              )}
            </PixelQuestionContainer>
          </QuestionContainer>
        </MomentumContentWrapper>
      );
    }

    if (activityPhase === 'summary') {
      return (
        <TestContent>
          <MentorSection>
            <MentorPortrait>
              <img 
                src={portraitSrc}
                alt={`${mentorName} portrait`}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  imageRendering: 'pixelated'
                }}
              />
            </MentorPortrait>

            <MentorDialogue>
              <SpeakerName>{mentorName}</SpeakerName>
              <DialogueText>
                <TypewriterText
                  key={`summary-${currentMomentum}-${questionsCompleted}-${totalMasteryGained}`}
                  text={(() => {
                    // Jesse's personality adaptation based on final momentum
                    const momentumLevel = getMomentumLevel(currentMomentum);
                    
                    if (momentumLevel === 'low') {
                      return `Good foundation work today. Mastering the basics is crucial - everything builds from here. You completed ${questionsCompleted} questions and gained ${totalMasteryGained} mastery points.`;
                    } else if (momentumLevel === 'medium') {
                      return `Solid session! You've got good instincts. Keep that curiosity going. You completed ${questionsCompleted} questions and gained ${totalMasteryGained} mastery points.`;
                    } else {
                      return `Impressive! You're ready for some real challenges. Come find me when you want to dive deeper into troubleshooting. You completed ${questionsCompleted} questions and gained ${totalMasteryGained} mastery points.`;
                    }
                  })()}
                  speed={30}
                  onComplete={() => {}}
                />
              </DialogueText>
            </MentorDialogue>
          </MentorSection>

          <TestStateSection>
            <TestStateCard>
              <StateTitle>🏆 Session Complete!</StateTitle>
              <div style={{ 
                textAlign: 'center', 
                marginBottom: spacing.lg,
                padding: spacing.lg,
                background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.15), rgba(255, 193, 7, 0.1))',
                borderRadius: spacing.sm,
                border: '2px solid rgba(255, 215, 0, 0.3)'
              }}>
                <div style={{ 
                  fontSize: '28px', 
                  color: '#FFD700', 
                  fontWeight: 'bold',
                  marginBottom: spacing.sm,
                  textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)'
                }}>
                  +{totalMasteryGained} Beam Physics Mastery!
                </div>
                <div style={{ 
                  color: colors.active, 
                  fontSize: typography.fontSize.md,
                  fontWeight: 'bold'
                }}>
                  {totalMasteryGained >= 15 ? '🎉 Personal Best! Outstanding performance!' :
                   totalMasteryGained >= 10 ? '⭐ Excellent session! Above average mastery gained!' :
                   totalMasteryGained >= 5 ? '✨ Good progress! Solid learning achieved!' :
                   '💪 Keep practicing! Every point builds expertise!'}
                </div>
              </div>
              
              <StatItem>
                <StatLabel>Questions Completed:</StatLabel>
                <StatValue>{questionsCompleted}</StatValue>
              </StatItem>
              <StatItem>
                <StatLabel>Final Momentum:</StatLabel>
                <StatValue style={{ 
                  color: currentMomentum >= 7 ? colors.highlight : 
                        currentMomentum >= 4 ? colors.active : colors.text 
                }}>
                  {currentMomentum}/10
                  {currentMomentum >= 7 && ' 🔥'}
                </StatValue>
              </StatItem>
              <StatItem>
                <StatLabel>Efficiency Rating:</StatLabel>
                <StatValue style={{ 
                  color: totalMasteryGained >= 15 ? '#FFD700' :
                        totalMasteryGained >= 10 ? colors.active : colors.text
                }}>
                  {totalMasteryGained >= 15 ? 'Expert' :
                   totalMasteryGained >= 10 ? 'Proficient' :
                   totalMasteryGained >= 5 ? 'Developing' : 'Beginner'}
                </StatValue>
              </StatItem>
              
              <div style={{ 
                marginTop: spacing.lg, 
                padding: spacing.md,
                background: 'rgba(132, 90, 245, 0.1)',
                borderRadius: spacing.xs,
                border: '1px solid rgba(132, 90, 245, 0.3)',
                textAlign: 'center'
              }}>
                <div style={{ 
                  color: colors.highlight, 
                  fontSize: typography.fontSize.sm,
                  fontWeight: 'bold'
                }}>
                  🎯 Try again to beat your score of {totalMasteryGained}!
                </div>
              </div>
            </TestStateCard>
          </TestStateSection>
        </TestContent>
      );
    }

    // Default intro content
    return (
      <TestContent>
        {/* Jesse Portrait & Dialogue */}
        <MentorSection>
          <MentorPortrait>
            <img 
              src={portraitSrc}
              alt={`${mentorName} portrait`}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                imageRendering: 'pixelated'
              }}
            />
          </MentorPortrait>

          <MentorDialogue>
            <SpeakerName>{mentorName}</SpeakerName>
            <DialogueText 
              $waitingForClick={waitingForClick}
              onClick={handleDialogueClick}
            >
              {showTypewriter ? (
                <TypewriterText
                  key={`dialogue-${dialoguePhase}`}
                  text={getDialogueContent()}
                  speed={30}
                  onComplete={() => {
                    setShowTypewriter(false);
                    handleDialogueComplete();
                  }}
                />
              ) : (
                getDialogueContent()
              )}
            </DialogueText>
          </MentorDialogue>
        </MentorSection>

        {/* Test State Display */}
        <TestStateSection>
          <TestStateCard>
            <StateTitle>🎮 Test Environment Status</StateTitle>
            <StatItem>
              <StatLabel>Player Name:</StatLabel>
              <StatValue>{playerName}</StatValue>
            </StatItem>
            <StatItem>
              <StatLabel>Test Mode:</StatLabel>
              <StatusIndicator $status="active">Active</StatusIndicator>
            </StatItem>
            <StatItem>
              <StatLabel>Core Loop:</StatLabel>
              <StatusIndicator $status={activityPhase === 'intro' ? 'ready' : 'active'}>
                {activityPhase === 'intro' ? 'Ready for Development' : 'Testing Active'}
              </StatusIndicator>
            </StatItem>
          </TestStateCard>

          <TestStateCard>
            <StateTitle>📊 Resource State</StateTitle>
            <StatItem>
              <StatLabel>Insight Points:</StatLabel>
              <StatValue>{insight}</StatValue>
            </StatItem>
            <StatItem>
              <StatLabel>Activity Momentum:</StatLabel>
              <StatValue>{currentMomentum}/10</StatValue>
            </StatItem>
            <StatItem>
              <StatLabel>Star Points:</StatLabel>
              <StatValue>{starPoints}</StatValue>
            </StatItem>
          </TestStateCard>

          <TestStateCard>
            <StateTitle>🔬 Development Progress</StateTitle>
            <div style={{ color: colors.textDim, fontSize: typography.fontSize.sm, lineHeight: 1.6 }}>
              <p>✅ Step 1: Test Activity Button (Complete)</p>
              <p>✅ Step 2: Test Activity Scene (Complete)</p>
              <p>🚧 Step 3: Question Flow Implementation (In Progress)</p>
              <p>⏳ Step 4: Momentum System Integration</p>
              <p>⏳ Step 5: Ability Card System</p>
            </div>
          </TestStateCard>
        </TestStateSection>
      </TestContent>
    );
  };

    const renderOnboardingOverlay = () => (
    <OnboardingOverlay $visible={showOnboarding}>
      <VisualGuideImage 
        src="/images/ui/activity-instructions.png" 
        alt="Strategic gameplay guide showing the relationship between answers, momentum, abilities, and mastery"
      />
      
      <DismissButton onClick={handleDismissOnboarding}>
        🚀 Ready to Begin!
      </DismissButton>
    </OnboardingOverlay>
  );

  return (
    <TestActivityContainer>
      <TestHeader $visible={activityPhase === 'intro'}>
        <TestTitle $minimal={activityPhase !== 'intro'}>
          {activityPhase === 'intro' ? 'Jesse\'s Beam Basics' : ''}
        </TestTitle>
        {activityPhase === 'intro' && (
          <TestSubtitle>
            Core Gameplay Loop Development Environment
          </TestSubtitle>
        )}
      </TestHeader>

      {renderContent()}

      {/* Only show controls during intro and summary phases */}
      {activityPhase !== 'questions' && (
        <ControlsSection>
          <ControlButton $variant="secondary" onClick={handleReturnToHospital}>
            🏥 Return to Hospital
          </ControlButton>
          <ControlButton $variant="primary" onClick={handleStartTesting}>
            {activityPhase === 'intro' ? '🧪 Start Jesse\'s Questions' :
             '🎉 Session Complete!'}
          </ControlButton>
        </ControlsSection>
      )}

      {/* Simple PNG-Based Ability Bar - shown during questions */}
      {activityPhase === 'questions' && (
        <AbilityBarContainer>
          {/* NEW: Insight Bar with Animation Frames - Spendable Resource */}
          <MeterContainer 
            onMouseEnter={() => setHoveredAbility(-1)}
            onMouseLeave={() => setHoveredAbility(null)}
          >
            <InsightBarHorizontal 
              src="/images/ui/insight-bar-vertical.png" 
              alt="Insight meter - spendable resource"
              $frameIndex={(() => {
                // If animating, use animation frames (2-22)
                if (insightAnimating) return insightAnimationFrame;
                
                // Otherwise use static fullness frames (0 = empty, 23-30 = fullness levels)
                if (insight === 0) return 0;
                const fullnessLevel = Math.floor(insight / 12.5); // 100/8 = 12.5 per level
                return Math.min(29, Math.max(23, 23 + fullnessLevel)); // Map to frames 23-30
              })()}
            />
            <MeterValue>{insight}/100</MeterValue>
          </MeterContainer>

          {/* NEW: Momentum Bar - Flow State Progression */}
          <MeterContainer 
            onMouseEnter={() => setHoveredAbility(-2)}
            onMouseLeave={() => setHoveredAbility(null)}
          >
            <MomentumBarHorizontal
              src="/images/ui/momentum-bar.png"
              alt="Momentum bar - flow state progression"
              $frameIndex={Math.min(10, currentMomentum)}
            />
            <MeterValue>{currentMomentum}/10</MeterValue>
          </MeterContainer>

          {/* Separator Line */}
          <AbilitySeparator />

          {/* Ability Icons PNG */}
          {testAbilities.map((ability, index) => {
            const canAfford = insight >= ability.cost;
            const isActive = activeAbilities[ability.id] || false;
            
            return (
              <AbilityIconContainer
                key={ability.id}
                $available={canAfford}
                $active={isActive}
                onMouseEnter={() => setHoveredAbility(index)}
                onMouseLeave={() => setHoveredAbility(null)}
                onClick={() => {
                  if (canAfford && !isActive) {
                    setSelectedAbility(index);
                    handleAbilityUse(index);
                    console.log(`🎯 Activated ability: ${ability.name} (${ability.cost} insight)`);
                  }
                }}
              >
                <AbilityImageIcon 
                  src={getAbilityIconPath(ability.id)}
                  alt={ability.name}
                  $available={canAfford}
                  $active={isActive}
                />
                <AbilityCostBadge $affordable={canAfford}>
                  {ability.cost}
                </AbilityCostBadge>
              </AbilityIconContainer>
            );
          })}

          {/* Simple Tooltips */}
          {hoveredAbility !== null && (
            <SimpleTooltip 
              $visible={true}
              $index={hoveredAbility}
            >
              {hoveredAbility === -1 && `Insight: ${insight}/100 - Spendable resource for abilities`}
              {hoveredAbility === -2 && `Momentum: ${currentMomentum}/10 - Flow state progression`}
              {hoveredAbility >= 0 && (
                <>
                  <strong>{testAbilities[hoveredAbility].name}</strong><br/>
                  {testAbilities[hoveredAbility].description}<br/>
                  <em>Cost: {testAbilities[hoveredAbility].cost} insight</em>
                </>
              )}
            </SimpleTooltip>
          )}
        </AbilityBarContainer>
      )}

      {/* Momentum-based visual overlays - only during questions */}
      {activityPhase === 'questions' && (
        <>
          <MomentumOverlay $momentumLevel={getMomentumLevel(currentMomentum)} />
          <MomentumTransitionEffect 
            $isTransitioning={isTransitioning}
            $newLevel={getMomentumLevel(currentMomentum)}
          />
        </>
      )}

      {/* Mastery gain popup - keep existing popup system */}
      <MasteryPopup 
        $visible={showFeedback && selectedOption !== null && currentQuestion?.options?.[selectedOption]?.isCorrect}
        $level={getMomentumLevel(currentMomentum) === 'low' ? 1 : getMomentumLevel(currentMomentum) === 'medium' ? 2 : 3}
      >
        +{getMomentumLevel(currentMomentum) === 'low' ? 1 : getMomentumLevel(currentMomentum) === 'medium' ? 2 : 3} Beam Physics
      </MasteryPopup>

      {/* Ability activation feedback */}
      {Object.keys(activeAbilities).some(key => activeAbilities[key]) && (
        <AbilityActiveFeedback>
          ✨ Abilities Active: {Object.entries(activeAbilities)
            .filter(([_, active]) => active)
            .map(([key]) => key.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()))
            .join(', ')}
        </AbilityActiveFeedback>
      )}
      


              {/* Prominent Always-Visible Mastery Counter - RuneScape XP feel */}
        {activityPhase === 'questions' && (
          <MasteryCounterContainer $visible={true}>
            <MasteryTitle>Beam Physics Mastery</MasteryTitle>
            <MasteryValue $animating={masteryAnimating}>
              {totalMasteryGained}
            </MasteryValue>
            <MasterySubtitle>Session Total</MasterySubtitle>
          </MasteryCounterContainer>
        )}

        {/* Dramatic Mastery Gain Animation System */}
        {showMasteryAnimation && (
          <MasteryGainAnimation 
            $visible={true}
            $gainAmount={lastMasteryGain}
            $position={{ x: typeof window !== 'undefined' ? window.innerWidth - 150 : 450, y: 80 }}
          >
            Beam Physics
          </MasteryGainAnimation>
        )}

        {/* Onboarding overlay */}
        {renderOnboardingOverlay()}
    </TestActivityContainer>
  );
} 