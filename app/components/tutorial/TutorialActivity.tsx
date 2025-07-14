'use client';

import React, { useState, useEffect, useCallback } from 'react';
import styled, { keyframes } from 'styled-components';
import { colors, spacing, typography, animation, borders } from '@/app/styles/pixelTheme';
import SpriteImage from '../ui/SpriteImage';
import TypewriterText from '../ui/TypewriterText';
import { getPortraitCoordinates, getMediumPortraitSrc, getExpressionCoordinates, SPRITE_SHEETS, ExpressionType } from '@/app/utils/spriteMap';
import { useTutorialStore } from '@/app/store/tutorialStore';
import { MentorId } from '@/app/types';

// Keyframe animations
const blink = keyframes`
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
`;

const pulse = keyframes`
  0% { opacity: 0.7; }
  50% { opacity: 1; }
  100% { opacity: 0.7; }
`;

// Styled components matching NarrativeDialogue exactly
const TutorialDialogueBox = styled.div`
  background: ${colors.background};
  ${borders.pixelBorder.outer}
  border-radius: ${spacing.sm};
  padding: ${spacing.xl};
  margin-bottom: ${spacing.lg};
  min-height: 150px;
  position: relative;
  box-shadow: 0 8px 0 ${colors.border}, 0 0 0 4px ${colors.border};
  font-family: ${typography.fontFamily.pixel};
`;

const TutorialSpeakerName = styled.div`
  color: ${colors.highlight};
  font-weight: bold;
  font-size: ${typography.fontSize.lg};
  margin-bottom: ${spacing.sm};
  text-shadow: ${typography.textShadow.pixel};
`;

const TutorialDialogueText = styled.div`
  font-size: ${typography.fontSize.md};
  line-height: 1.6;
  color: ${colors.text};
  cursor: pointer;
  min-height: 60px;
  position: relative;
`;

const TutorialOptionsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${spacing.xs};
`;

const TutorialOptionButton = styled.button<{ $disabled?: boolean; $selected?: boolean }>`
  background: ${props => {
    if (props.$disabled) return colors.backgroundAlt;
    if (props.$selected) return colors.highlight;
    return colors.backgroundAlt;
  }};
  ${props => props.$selected ? borders.pixelBorder.active(colors.highlight) : borders.pixelBorder.outer}
  border-radius: ${spacing.xs};
  padding: ${spacing.md} ${spacing.lg};
  color: ${props => {
    if (props.$disabled) return colors.textDim;
    if (props.$selected) return colors.background;
    return colors.text;
  }};
  font-family: ${typography.fontFamily.pixel};
  font-size: ${typography.fontSize.sm};
  text-align: left;
  cursor: ${props => props.$disabled ? 'not-allowed' : 'pointer'};
  transition: all ${animation.duration.fast} ${animation.easing.pixel};
  opacity: ${props => props.$disabled ? 0.6 : 1};
  min-height: 50px;
  display: flex;
  align-items: center;
  margin-bottom: ${spacing.xs};
  
  /* Subtle border differentiation */
  border: 1px solid ${props => {
    if (props.$selected) return colors.highlight;
    return 'rgba(255, 255, 255, 0.1)';
  }};
  
  /* Add subtle glow for selected option */
  box-shadow: ${props => {
    if (props.$selected && !props.$disabled) return `0 0 8px rgba(132, 90, 245, 0.4)`;
    return '0 2px 4px rgba(0, 0, 0, 0.1)';
  }};
  
  &:hover {
    ${props => !props.$disabled && !props.$selected && `
      ${borders.pixelBorder.active(colors.highlight)}
      background: ${colors.highlight};
      color: ${colors.background};
      border: 1px solid ${colors.highlight};
      box-shadow: 0 0 12px rgba(132, 90, 245, 0.3);
    `}
  }
  
  &:disabled {
    cursor: not-allowed;
  }
`;

const TutorialContinueButton = styled.button`
  background: ${colors.highlight};
  ${borders.pixelBorder.outer}
  border-radius: ${spacing.xs};
  padding: ${spacing.sm} ${spacing.lg};
  color: ${colors.background};
  font-family: ${typography.fontFamily.pixel};
  font-size: ${typography.fontSize.md};
  font-weight: bold;
  cursor: pointer;
  width: 100%;
  transition: all ${animation.duration.fast} ${animation.easing.pixel};
  
  &:hover {
    transform: translateY(-2px);
    ${borders.pixelBorder.active(colors.highlight)}
  }
`;

const TutorialContinuePrompt = styled.div`
  position: absolute;
  bottom: ${spacing.sm};
  right: ${spacing.md};
  color: ${colors.textDim};
  font-size: ${typography.fontSize.xs};
  animation: ${pulse} 2s infinite;
`;

// Enhanced Resource Display Components using sprite assets
const EnhancedResourceDisplay = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${spacing.md};
  background: rgba(15, 23, 42, 0.95);
  padding: ${spacing.md};
  border-radius: ${spacing.xs};
  border: 2px solid ${colors.border};
  backdrop-filter: blur(4px);
  width: 100%;
  max-width: 300px;
`;

const ResourceDisplayTitle = styled.div`
  font-size: ${typography.fontSize.xs};
  color: ${colors.textDim};
  text-align: center;
  margin-bottom: ${spacing.xs};
  font-family: ${typography.fontFamily.pixel};
`;

const InsightBarContainer = styled.div`
  position: relative;
  width: 100%;
  height: 200px; /* Much larger to accommodate 192px sprite */
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: visible; /* Ensure sprite isn't clipped */
`;

const InsightBarBackground = styled.div<{ $insightLevel: number }>`
  position: relative;
  width: 140px;
  height: 24px;
  background-image: url('/images/ui/insight-bar.png');
  background-size: 600% 100%; /* 6 frames horizontally */
  background-repeat: no-repeat;
  background-position-x: ${props => {
    const level = props.$insightLevel || 0;
    // Maps 0-100 to frame 0-5
    const frameIndex = Math.min(5, Math.floor(level / 20));
    return `${frameIndex * -100}%`;
  }};
  image-rendering: pixelated;
  margin: 0 auto;
  transition: background-position-x 0.4s cubic-bezier(0.4, 0, 0.2, 1);
`;

const InsightValueOverlay = styled.div`
  position: absolute;
  top: 50%;
  right: 12px;
  transform: translateY(-50%);
  font-size: 11px;
  font-family: ${typography.fontFamily.pixel};
  color: #ffffff;
  text-shadow: 1px 1px 0px #000, -1px -1px 0px #000, 1px -1px 0px #000, -1px 1px 0px #000;
  font-weight: normal;
  pointer-events: none;
`;

const MomentumContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${spacing.sm};
  padding: ${spacing.md}; /* Extra padding for breathing room */
  min-height: 120px; /* Ensure enough space for momentum display */
`;

const MomentumLabel = styled.div`
  font-size: ${typography.fontSize.xs};
  color: ${colors.textDim};
  font-family: ${typography.fontFamily.pixel};
  text-align: center;
`;

const MomentumBlipsContainer = styled.div`
  display: flex;
  gap: 8px; /* More space between blips */
  align-items: center;
  justify-content: center;
  padding: ${spacing.md}; /* Padding around the blips */
  min-height: 60px; /* Ensure enough vertical space for 40px blips */
`;

const MomentumBlip = styled.div<{ $momentumState: number; $index: number }>`
  width: 40px;
  height: 40px;
  background-image: url('/images/ui/momentum-blip.png');
  background-size: 400% 100%; /* 4 frames horizontally: 4 * 100% = 400% */
  background-repeat: no-repeat;
  background-position-x: ${props => {
    // State 0: empty/inactive (frame 0)
    // State 1: low momentum (frame 1) 
    // State 2: medium momentum (frame 2)
    // State 3: high momentum (frame 3)
    const frameIndex = Math.min(3, Math.max(0, props.$momentumState));
    return `${frameIndex * -100}%`; /* Move left by frameIndex * 100% */
  }};
  image-rendering: pixelated;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  transform: ${props => props.$momentumState > 0 ? 'scale(1.1)' : 'scale(1)'};
  border: 2px solid rgba(255, 255, 255, 0.3); /* More visible border to see sprite boundary */
  background-color: rgba(0, 255, 0, 0.1); /* Debug background to see container */
  
  /* Staggered animation for momentum gain */
  animation: ${props => props.$momentumState > 0 ? `momentumPulse 0.6s ease-out ${props.$index * 0.1}s` : 'none'};
  
  @keyframes momentumPulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.3); filter: brightness(1.3) drop-shadow(0 0 6px #FFD700); }
    100% { transform: scale(1.1); }
  }
`;

const MomentumBonus = styled.div<{ $visible: boolean; $level: number }>`
  font-size: ${typography.fontSize.xs};
  color: ${props => 
    props.$level === 3 ? '#FF6B35' : 
    props.$level === 2 ? '#FFD700' : 
    colors.textDim
  };
  text-align: center;
  font-family: ${typography.fontFamily.pixel};
  opacity: ${props => props.$visible ? 1 : 0};
  transition: opacity 0.3s ease;
  text-shadow: ${props => props.$level > 1 ? '0 0 4px currentColor' : 'none'};
  margin-top: ${spacing.xs};
`;

// Abilities Bar Styled Components
const AbilitiesBarContainer = styled.div<{ $isVisible: boolean; $isActive: boolean }>`
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: ${spacing.md};
  background: rgba(15, 23, 42, 0.95);
  padding: ${spacing.md};
  border-radius: ${spacing.sm};
  border: 2px solid ${props => props.$isActive ? colors.highlight : colors.border};
  backdrop-filter: blur(4px);
  box-shadow: 0 8px 0 ${colors.border}, 0 12px 20px rgba(0,0,0,0.4);
  opacity: ${props => props.$isVisible ? 1 : 0};
  transition: all 0.3s ease;
  z-index: 1025;
  
  ${props => props.$isActive && `
    box-shadow: 0 0 20px rgba(132, 90, 245, 0.5), 0 8px 0 ${colors.highlight}, 0 12px 20px rgba(0,0,0,0.4);
  `}
`;

const AbilitySlot = styled.div<{ $isSelected: boolean; $isAvailable: boolean; $isBoastSlot?: boolean }>`
  width: 80px;
  height: 80px;
  background: ${props => 
    props.$isBoastSlot ? 'rgba(255, 107, 53, 0.1)' : 'rgba(132, 90, 245, 0.1)'
  };
  border: 2px solid ${props => 
    props.$isSelected ? colors.highlight : 
    props.$isAvailable ? colors.border : 
    colors.textDim
  };
  border-radius: ${spacing.sm};
  display: flex;
  flex-direction: column;
  align-items: center;
  justifyContent: center;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  
  ${props => props.$isSelected && `
    transform: scale(1.1);
    box-shadow: 0 0 15px rgba(132, 90, 245, 0.6);
  `}
  
  ${props => !props.$isAvailable && `
    opacity: 0.5;
    filter: grayscale(0.8);
  `}
  
  &:hover {
    transform: ${props => props.$isSelected ? 'scale(1.1)' : 'scale(1.05)'};
  }
`;

const AbilityIcon = styled.div<{ $abilityType: string; $abilityId?: string }>`
  width: 60px;
  height: 42px; /* Scaled down from 120x85 to maintain aspect ratio */
  background: ${props => {
    // Use sprite image for specific abilities, fallback to colored circles
    if (props.$abilityId === 'fast_learner') {
      return `url('/images/ui/ability-icon-fast-learner.png') no-repeat center`;
    }
    return props.$abilityType === 'momentum' ? '#FFD700' :
           props.$abilityType === 'insight' ? '#3B82F6' :
           props.$abilityType === 'hybrid' ? '#8B5CF6' :
           '#FF6B35'; // boast
  }};
  background-size: contain;
  border-radius: ${props => props.$abilityId ? '4px' : '50%'}; /* Rounded corners for sprites, circle for fallback */
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: ${typography.fontSize.sm};
  font-weight: bold;
  color: ${colors.background};
  margin-bottom: ${spacing.xs};
  image-rendering: pixelated;
  border: ${props => props.$abilityId ? `1px solid ${colors.border}` : 'none'};
`;

const AbilityLabel = styled.div`
  font-size: ${typography.fontSize.xs};
  color: ${colors.text};
  text-align: center;
  font-family: ${typography.fontFamily.pixel};
  line-height: 1.2;
`;

const AbilityHotkey = styled.div`
  position: absolute;
  top: 4px;
  right: 4px;
  font-size: ${typography.fontSize.xs};
  color: ${colors.textDim};
  font-family: ${typography.fontFamily.pixel};
  background: rgba(0,0,0,0.7);
  padding: 2px 4px;
  border-radius: 2px;
`;

const AbilityCost = styled.div<{ $canAfford: boolean }>`
  position: absolute;
  bottom: 4px;
  left: 4px;
  font-size: ${typography.fontSize.xs};
  color: ${props => props.$canAfford ? colors.text : '#EF4444'};
  font-family: ${typography.fontFamily.pixel};
  background: rgba(0,0,0,0.7);
  padding: 2px 4px;
  border-radius: 2px;
`;

// Animated Number Component for Summary
const AnimatedNumber: React.FC<{ value: number; duration?: number }> = ({ value, duration = 2000 }) => {
  const [currentValue, setCurrentValue] = useState(0);
  
  useEffect(() => {
    let startTime: number;
    let animationFrame: number;
    
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      setCurrentValue(Math.round(value * easeOutQuart));
      
      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };
    
    animationFrame = requestAnimationFrame(animate);
    
    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [value, duration]);
  
  return <>{currentValue}</>;
};

// Animated Sprite Components for Summary
const SummarySpinningIcon: React.FC<{ spriteUrl: string; size?: number; frameCount?: number; speed?: number }> = ({ 
  spriteUrl, 
  size = 48, 
  frameCount = 16, 
  speed = 120 
}) => {
  const [currentFrame, setCurrentFrame] = useState(0);
  const frameSize = 16; // Each frame is 16x16 pixels
  const scaleFactor = size / frameSize;
  
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFrame(prev => (prev + 1) % frameCount);
    }, speed);
    
    return () => clearInterval(interval);
  }, [frameCount, speed]);
  
  return (
    <div style={{
      width: `${size}px`,
      height: `${size}px`,
      background: `url('${spriteUrl}') no-repeat`,
      backgroundPosition: `-${currentFrame * frameSize * scaleFactor}px 0px`,
      backgroundSize: `${frameCount * frameSize * scaleFactor}px ${size}px`,
      imageRendering: 'pixelated'
    }} />
  );
};

const SummaryInsightBar: React.FC<{ level: number; size?: number }> = ({ level, size = 48 }) => {
  // Use same calculation as the working InsightBarBackground
  const frameIndex = level > 0 
    ? Math.max(1, Math.min(5, Math.floor((level / 100) * 5) + 1))
    : 0;
    
  return (
    <div style={{
      width: `${size * 2.9}px`, // Insight bar is much wider than tall (140px vs 24px ratio)
      height: `${size * 0.5}px`, 
      backgroundImage: `url('/images/ui/insight-bar.png')`,
      backgroundSize: '600% 100%', // 6 frames horizontally
      backgroundRepeat: 'no-repeat',
      backgroundPosition: `${frameIndex * -100}% 0%`,
      imageRendering: 'pixelated'
    }} />
  );
};

const SummaryMomentumBlip: React.FC<{ level: number; size?: number }> = ({ level, size = 48 }) => {
  // Use same calculation as the working MomentumBlip
  const frameIndex = Math.min(3, Math.max(0, level));
  
  return (
    <div style={{
      width: `${size}px`,
      height: `${size}px`,
      backgroundImage: `url('/images/ui/momentum-blip.png')`,
      backgroundSize: '400% 100%', // 4 frames horizontally
      backgroundRepeat: 'no-repeat',
      backgroundPosition: `${frameIndex * -100}% 0%`,
      imageRendering: 'pixelated'
    }} />
  );
};

const SummaryReactionSymbol: React.FC<{ accuracy: number; size?: number }> = ({ accuracy, size = 48 }) => {
  // Choose frame based on accuracy: 0-50% = sad, 51-80% = neutral, 81-100% = happy
  const frameIndex = accuracy >= 81 ? 2 : accuracy >= 51 ? 1 : 0;
  
  return (
    <div style={{
      width: `${size}px`,
      height: `${size}px`,
      backgroundImage: `url('/images/ui/reaction-symbols.png')`,
      backgroundSize: '300% 100%', // Assuming 3 frames horizontally
      backgroundRepeat: 'no-repeat',
      backgroundPosition: `${frameIndex * -100}% 0%`,
      imageRendering: 'pixelated'
    }} />
  );
};

// Summary Page Styled Components
const SummaryCard = styled.div<{ $isVisible: boolean }>`
  background: rgba(15, 23, 42, 0.95);
  border: 3px solid ${colors.border};
  border-radius: ${spacing.lg};
  padding: ${spacing.xxl};
  box-shadow: 0 8px 0 ${colors.border}, 0 12px 20px rgba(0,0,0,0.5);
  max-width: 600px;
  width: 90%;
  text-align: center;
  transform: ${props => props.$isVisible ? 'scale(1)' : 'scale(0)'};
  opacity: ${props => props.$isVisible ? 1 : 0};
  transition: all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
`;

const SummaryTitle = styled.h1`
  font-size: ${typography.fontSize.xxl};
  margin-bottom: ${spacing.xl};
  color: ${colors.highlight};
  text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
`;

const SessionGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${spacing.xl};
  margin: ${spacing.xl} 0;
`;

const StatItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${spacing.md};
  padding: ${spacing.lg};
  background: rgba(0,0,0,0.3);
  border: 2px solid ${colors.border};
  border-radius: ${spacing.md};
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0,0,0,0.3);
  }
`;

const StatIconContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
`;

const StatLabel = styled.div`
  font-size: ${typography.fontSize.sm};
  color: ${colors.textDim};
  margin-bottom: ${spacing.xs};
`;

const StatValue = styled.div`
  font-size: ${typography.fontSize.xl};
  font-weight: bold;
  color: ${colors.text};
`;

const SummaryContinueButton = styled.button`
  margin-top: ${spacing.xl};
  padding: ${spacing.lg} ${spacing.xxl};
  background: ${colors.highlight};
  color: ${colors.background};
  border: none;
  border-radius: ${spacing.md};
  font-family: ${typography.fontFamily.pixel};
  font-size: ${typography.fontSize.lg};
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background: ${colors.text};
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0,0,0,0.3);
  }
  
  &:active {
    transform: translateY(0);
  }
`;

interface TutorialActivityProps {
  patientName?: string;
  mentorId?: MentorId;
  roomId?: string;
  onComplete: () => void;
}

interface TutorialQuestion {
  id: string;
  text: string;
  options: Array<{
    text: string;
    isCorrect: boolean;
    feedback: string;
  }>;
}

// Legacy interface - replaced by CaseInfo
interface PatientInfo {
  name: string;
  age: number;
  gender: string;
  diagnosis: string;
  lesionDetails: string;
  additionalInfo: string[];
}

// Tutorial-specific case data (matches mentor dialogues)
const TUTORIAL_CASES: Record<string, CaseInfo> = {
  'Mrs. Patterson': {
    name: 'Mrs. Patterson',
    age: 58,
    gender: 'Female',
    diagnosis: 'Breast Cancer',
    caseType: 'patient',
    description: 'Complex geometry requiring careful dose optimization',
    additionalInfo: [
      'Previous surgical complications',
      'Requires modified approach per Dr. Garcia',
      'Standard protocols need adjustment'
    ]
  },
  'Bertha (LINAC)': {
    name: 'Bertha',
    caseType: 'equipment',
    diagnosis: 'LINAC Performance Issues',
    description: 'Fluctuating beam output readings',
    additionalInfo: [
      'Temperature fluctuations detected',
      'Beam current variations',
      'Jesse suspects cooling system'
    ]
  },
  'Calibration Setup': {
    name: 'TG-51 Protocol',
    caseType: 'procedure',
    diagnosis: 'Daily QA Calibration',
    description: 'Ion chamber calibration verification',
    additionalInfo: [
      'Temperature: 22.1°C',
      'Pressure: 760.2 mmHg',
      'Dr. Kapoor expects 2% accuracy'
    ]
  }
};

interface CaseInfo {
  name: string;
  age?: number;
  gender?: string;
  caseType: 'patient' | 'equipment' | 'procedure';
  diagnosis: string;
  description: string;
  additionalInfo: string[];
}

// Tutorial questions for different mentors
const TUTORIAL_QUESTIONS: Record<string, TutorialQuestion[]> = {
  garcia: [
    {
      id: 'dose_distribution',
      text: "Looking at Mrs. Patterson's case, what should we consider first when the standard approach isn't quite right?",
      options: [
        {
          text: "The dose distribution around critical organs",
          isCorrect: true,
          feedback: "Exactly! When standard approaches don't work, we need to carefully examine how dose affects surrounding healthy tissue."
        },
        {
          text: "Increasing the beam energy",
          isCorrect: false,
          feedback: "Not quite. Beam energy alone won't solve geometric complexity issues."
        },
        {
          text: "Using a different treatment machine",
          isCorrect: false,
          feedback: "The machine isn't the issue here - it's about adapting our approach to the patient's unique anatomy."
        }
      ]
    },
    {
      id: 'thinking_differently',
      text: "Dr. Garcia mentioned 'thinking differently' - what does this mean in treatment planning?",
      options: [
        {
          text: "Considering the patient as a whole person, not just a diagnosis",
          isCorrect: true,
          feedback: "Perfect! This is what makes good medical physicists - seeing beyond the numbers to the human being we're helping."
        },
        {
          text: "Using the most advanced technology available",
          isCorrect: false,
          feedback: "Technology helps, but the real difference comes from thoughtful, patient-centered planning."
        },
        {
          text: "Following protocols exactly as written",
          isCorrect: false,
          feedback: "Sometimes we need to adapt protocols - that's where clinical judgment becomes crucial."
        }
      ]
    }
  ],
  jesse: [
    {
      id: 'temperature_fluctuation',
      text: "Bertha's beam output is fluctuating. Looking at these readings, what's the most likely cause?",
      options: [
        {
          text: "Temperature variations affecting the magnetron",
          isCorrect: true,
          feedback: "Good instinct! Temperature changes can definitely affect magnetron performance and beam stability."
        },
        {
          text: "The computer software needs updating",
          isCorrect: false,
          feedback: "Software rarely causes this kind of fluctuation pattern. This is more mechanical."
        },
        {
          text: "We need to recalibrate everything",
          isCorrect: false,
          feedback: "Hold on - let's figure out what's actually wrong before we start recalibrating."
        }
      ]
    },
    {
      id: 'practical_solution',
      text: "You're right about the temperature. How should we verify this before taking action?",
      options: [
        {
          text: "Check the cooling system and ambient temperature logs",
          isCorrect: true,
          feedback: "Exactly! Always verify your hypothesis with data. That's how you learn to really listen to what equipment is telling you."
        },
        {
          text: "Replace the magnetron immediately",
          isCorrect: false,
          feedback: "Whoa there! That's a $50,000 part. Let's confirm the problem first."
        },
        {
          text: "Run more beam measurements",
          isCorrect: false,
          feedback: "More measurements won't help if we don't understand what's causing the variation."
        }
      ]
    }
  ]
};

// Spinning Patient Icon Component
const SpinningPatientIcon: React.FC<{ size?: number }> = ({ size = 64 }) => {
  const [currentFrame, setCurrentFrame] = useState(0);
  const frameCount = 16;
  const frameSize = 16; // Each frame is 16x16 pixels
  const scaleFactor = size / frameSize;
  
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFrame(prev => (prev + 1) % frameCount);
    }, 100); // Faster animation - 100ms per frame (1.5x speed increase)
    
    return () => clearInterval(interval);
  }, [frameCount]);
  
  return (
    <div style={{
      width: `${size}px`,
      height: `${size}px`,
      background: `url('/images/ui/patient-rotation.png') no-repeat`,
      backgroundPosition: `-${currentFrame * frameSize * scaleFactor}px 0px`,
      backgroundSize: `${frameCount * frameSize * scaleFactor}px ${size}px`,
      imageRendering: 'pixelated',
      border: `2px solid ${colors.border}`,
      borderRadius: spacing.xs,
      backgroundColor: colors.backgroundAlt
    }} />
  );
};

// Spinning LINAC Icon Component for Equipment Cases
const SpinningLinacIcon: React.FC<{ size?: number }> = ({ size = 64 }) => {
  const [currentFrame, setCurrentFrame] = useState(0);
  const frameCount = 16;
  const frameSize = 16; // Each frame is 16x16 pixels
  const scaleFactor = size / frameSize;
  
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFrame(prev => (prev + 1) % frameCount);
    }, 120); // Slightly slower for mechanical equipment feel
    
    return () => clearInterval(interval);
  }, [frameCount]);
  
  return (
    <div style={{
      width: `${size}px`,
      height: `${size}px`,
      background: `url('/images/ui/linac-rotation.png') no-repeat`,
      backgroundPosition: `-${currentFrame * frameSize * scaleFactor}px 0px`,
      backgroundSize: `${frameCount * frameSize * scaleFactor}px ${size}px`,
      imageRendering: 'pixelated',
      border: `2px solid ${colors.border}`,
      borderRadius: spacing.xs,
      backgroundColor: colors.backgroundAlt
    }} />
  );
};

// Mentor Portrait Component with Expressions
const MentorPortrait: React.FC<{ 
  mentorId: MentorId | string, 
  expression?: ExpressionType,
  size?: number,
  useExpressions?: boolean,
  isAnimating?: boolean,
  isTyping?: boolean
}> = ({ mentorId, expression = 'neutral', size = 80, useExpressions = false, isAnimating = false, isTyping = false }) => {
  const [currentExpression, setCurrentExpression] = React.useState<ExpressionType>(expression);
  const [bobOffset, setBobOffset] = React.useState(0);

  // Expression cycling during question presentation - talking animation
  React.useEffect(() => {
    if (!isAnimating || !useExpressions) return;
    
    // Talking animation: cycle between frames 1, 6, and 11 (neutral, surprised, proud)
    let talkingInterval: NodeJS.Timeout;
    const talkingFrames: ExpressionType[] = ['neutral', 'surprised', 'proud']; // frames 1, 6, 11
    let currentFrameIndex = 0;
    
    if (isTyping) {
      // Start talking animation only while typing
      const startTalking = () => {
        talkingInterval = setInterval(() => {
          // Cycle through the three talking frames
          setCurrentExpression(talkingFrames[currentFrameIndex]);
          currentFrameIndex = (currentFrameIndex + 1) % talkingFrames.length;
        }, 150); // Faster - 150ms per frame change
      };
      
      startTalking();
    } else {
      // Typewriter is done, stop on frame 1 (neutral)
      setCurrentExpression('neutral');
    }
    
    return () => {
      if (talkingInterval) {
        clearInterval(talkingInterval);
      }
    };
  }, [isAnimating, useExpressions, isTyping]); // Add isTyping to dependencies

  // Remove bobbing animation entirely
  React.useEffect(() => {
    // No bobbing animation - keep portrait static
    setBobOffset(0);
  }, []);

  // Update expression when not animating - but don't override talking states
  React.useEffect(() => {
    // Only update expression if we're not in talking animation mode
    if (!isAnimating || !useExpressions) {
      setCurrentExpression(expression);
    }
  }, [expression, isAnimating, useExpressions]);

  // Convert string mentorId to proper type
  const mentorCharacterId = (() => {
    switch (mentorId) {
      case 'garcia': return 'garcia';
      case 'kapoor': return 'kapoor';
      case 'quinn': return 'quinn';
      case 'jesse': return 'jesse';
      default: return 'garcia';
    }
  })();

  // Use expression spritesheet for Garcia and Jesse if available and requested
  const hasExpressionSheet = (mentorCharacterId === 'garcia' || mentorCharacterId === 'jesse') && useExpressions;
  
  if (hasExpressionSheet) {
    const expressionCoords = getExpressionCoordinates(currentExpression);
    const scale = size / 42; // Scale from 42px base size
    
    return (
      <div style={{
        width: `${size}px`,
        height: `${size}px`,
        border: `3px solid ${colors.border}`,
        borderRadius: spacing.sm,
        background: colors.backgroundAlt,
        overflow: 'visible', // Allow shadows and borders to show fully
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: `0 4px 0 ${colors.border}, 0 6px 12px rgba(0,0,0,0.3)`,
        position: 'relative',
        transform: `translateY(${bobOffset}px)`,
        transition: isAnimating ? 'none' : 'transform 0.3s ease'
      }}>
        <div style={{
          width: '100%',
          height: '100%',
          backgroundImage: mentorCharacterId === 'garcia' 
            ? `url('/images/characters/portraits/garcia-animation.png')`
            : `url('/images/characters/portraits/jesse-medium.png?v=${Date.now()}')`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: `-${expressionCoords.x * scale}px 0px`,
          backgroundSize: `${15 * 42 * scale}px ${42 * scale}px`,
          imageRendering: 'pixelated'
        }} />
        {/* Expression indicator - more subtle for spritesheet version */}
        <div style={{
          position: 'absolute',
          top: '2px',
          right: '2px',
          width: '8px',
          height: '8px',
          backgroundColor: colors.highlight,
          borderRadius: '50%',
          border: `1px solid ${colors.border}`,
          opacity: 0.8
        }} />
      </div>
    );
  }

  // Fallback to static portrait for other mentors
  const portraitSrc = getMediumPortraitSrc(mentorCharacterId);
  
  return (
    <div style={{
      width: `${size}px`,
      height: `${size}px`,
      border: `3px solid ${colors.border}`,
      borderRadius: spacing.sm,
      background: colors.backgroundAlt,
      overflow: 'visible', // Allow shadows and borders to show fully
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: `0 4px 0 ${colors.border}, 0 6px 12px rgba(0,0,0,0.3)`,
      position: 'relative',
      transform: `translateY(${bobOffset}px)`
    }}>
      <img 
        src={portraitSrc}
        alt={`${mentorCharacterId} portrait`}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          imageRendering: 'pixelated'
        }}
      />
      {/* Expression indicator (for future use) */}
      <div style={{
        position: 'absolute',
        bottom: '2px',
        right: '2px',
        width: '12px',
        height: '12px',
        backgroundColor: expression === 'happy' ? '#22c55e' : 
                        expression === 'concerned' ? '#ef4444' :
                        expression === 'thinking' ? '#3b82f6' :
                        expression === 'encouraging' ? '#f59e0b' : colors.textDim,
        borderRadius: '50%',
        border: `1px solid ${colors.border}`
      }} />
    </div>
  );
};

export default function TutorialActivity({ patientName, mentorId, roomId, onComplete }: TutorialActivityProps) {
  // Enhanced animation states for self-contained patient card intro
  const [phase, setPhase] = useState<'intro' | 'patient-reveal' | 'fade-to-black' | 'card-zoom-out' | 'activity-zoom-in' | 'questions' | 'activity-zoom-out' | 'summary-zoom-in' | 'summary'>('intro');
  const [showMentorDialogue, setShowMentorDialogue] = useState(false);
  const [showPatientInfo, setShowPatientInfo] = useState(false); // For hover tooltip on small patient icon

  
  // Question states
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number>(0); // Default to first option
  const [showFeedback, setShowFeedback] = useState(false);
  const [questionsCompleted, setQuestionsCompleted] = useState(0);
  
  // Typing state to control when options appear
  const [isTyping, setIsTyping] = useState(false);
  const [showAnswerInterface, setShowAnswerInterface] = useState(false);
  
  // Mentor expression state
  const [mentorExpression, setMentorExpression] = useState<ExpressionType>('neutral');
  
  // Enhanced resource tracking for sprite displays
  const [currentInsight, setCurrentInsight] = useState(50); // Start with 50 insight
  const [currentMomentum, setCurrentMomentum] = useState(1); // Start with 1 momentum
  const maxMomentum = 3;
  
  // Statistics tracking for summary page
  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [insightGained, setInsightGained] = useState(0);
  const [momentumGained, setMomentumGained] = useState(0);
  const [initialInsight] = useState(50);
  const [initialMomentum] = useState(1);
  
  // Summary visibility state
  const [showSummaryCard, setShowSummaryCard] = useState(false);
  
  // Abilities bar state
  const [selectedAbilitySlot, setSelectedAbilitySlot] = useState(0); // 0-2 for abilities, 3 for boast
  const [focusedArea, setFocusedArea] = useState<'dialogue' | 'abilities'>('dialogue');
  
  // Mock equipped abilities (will come from journal/game state later)
  const equippedAbilities = [
    { id: 'fast_learner', name: 'Fast Learner', cost: 1, type: 'insight' },
    { id: 'pattern_recognition', name: 'Pattern Recognition', cost: 2, type: 'momentum' },
    { id: 'clinical_intuition', name: 'Clinical Intuition', cost: 1, type: 'hybrid' }
  ];
  
  const equippedBoastAbility = {
    id: 'flash_of_insight',
    name: 'Flash of Insight',
    momentumCost: 2,
    insightCost: 0,
    description: 'Reveals answer hints'
  };
  
  // Get case and mentor data
  const caseData = TUTORIAL_CASES[patientName || 'Mrs. Patterson'] || TUTORIAL_CASES['Mrs. Patterson'];
  const questionSet = TUTORIAL_QUESTIONS[mentorId || 'garcia'] || TUTORIAL_QUESTIONS['garcia'];
  const currentQuestion = questionSet[currentQuestionIndex];
  
  const getMentorName = (mentorId: string): string => {
    switch (mentorId) {
      case 'garcia': return 'Dr. Garcia';
      case 'kapoor': return 'Dr. Kapoor';
      case 'quinn': return 'Dr. Quinn';
      case 'jesse': return 'Jesse';
      default: return 'Mentor';
    }
  };

  // Memoized callback functions to prevent TypewriterText restart loops
  const handleTypingStart = useCallback(() => {
    setIsTyping(true);
  }, []);

  const handleTypingComplete = useCallback(() => {
    setIsTyping(false);
    // Add buffer time before showing answer interface with zoom animation
    setTimeout(() => {
      setShowAnswerInterface(true);
    }, 800); // 0.8 second buffer
  }, []);

  // Enhanced keyboard controls for compass navigation and abilities bar
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (phase !== 'questions' || !currentQuestion || isTyping || showFeedback) return;
      
      const availableOptions = Math.min(3, currentQuestion.options.length); // Max 3 options
      
      // Handle area switching
      if (event.key === 'ArrowDown' && focusedArea === 'dialogue') {
        event.preventDefault();
        setFocusedArea('abilities');
        return;
      }
      
      if (event.key === 'ArrowUp' && focusedArea === 'abilities') {
        event.preventDefault();
        setFocusedArea('dialogue');
        return;
      }
      
      // Handle dialogue area navigation
      if (focusedArea === 'dialogue') {
        switch (event.key) {
          case 'ArrowUp': // North (index 0)
            event.preventDefault();
            setSelectedOption(0);
            break;
          case 'ArrowRight': // East (index 1)
            event.preventDefault();
            if (availableOptions > 1) setSelectedOption(1);
            break;
          case 'ArrowLeft': // West (index 2)
            event.preventDefault();
            if (availableOptions > 2) setSelectedOption(2);
            break;
          case 'Enter':
          case ' ':
            event.preventDefault();
            handleOptionSelect(selectedOption);
            break;
        }
      }
      
      // Handle abilities area navigation
      if (focusedArea === 'abilities') {
        switch (event.key) {
          case 'ArrowLeft':
            event.preventDefault();
            setSelectedAbilitySlot(prev => Math.max(0, prev - 1));
            break;
          case 'ArrowRight':
            event.preventDefault();
            setSelectedAbilitySlot(prev => Math.min(3, prev + 1)); // 0-3 for 4 slots
            break;
          case '1':
            event.preventDefault();
            setSelectedAbilitySlot(0);
            // TODO: Activate ability slot 0
            break;
          case '2':
            event.preventDefault();
            setSelectedAbilitySlot(1);
            // TODO: Activate ability slot 1
            break;
          case '3':
            event.preventDefault();
            setSelectedAbilitySlot(2);
            // TODO: Activate ability slot 2
            break;
          case 'b':
          case 'B':
            event.preventDefault();
            setSelectedAbilitySlot(3);
            // TODO: Activate boast ability
            break;
          case 'Enter':
          case ' ':
            event.preventDefault();
            // TODO: Activate currently selected ability slot
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [phase, currentQuestion, isTyping, showFeedback, selectedOption, focusedArea, selectedAbilitySlot]);

  // Enhanced Pokemon-style transition sequence with self-contained patient card
  useEffect(() => {
    const sequence = async () => {
      // 1. Immediate fade to black transition (no delay)
      setPhase('fade-to-black');
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // 2. Patient card reveal from black (time to read patient info)
      setPhase('patient-reveal');
      setMentorExpression('focused');
      await new Promise(resolve => setTimeout(resolve, 3500)); // Time to read patient info
      
      // 3. Card zoom out and disappear
      setPhase('card-zoom-out');
      await new Promise(resolve => setTimeout(resolve, 600));
      
      // 4. Activity interface zoom in
      setPhase('activity-zoom-in');
      setMentorExpression('encouraging');
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // 5. Begin questions
      setPhase('questions');
      setMentorExpression('serious'); // Ready to teach
    };
    
    sequence();
  }, [mentorId]);

  const handleOptionSelect = (optionIndex: number) => {
    setShowFeedback(true);
    
    // Track statistics
    setQuestionsAnswered(prev => prev + 1);
    
    // Update resources based on answer correctness
    if (currentQuestion.options[optionIndex].isCorrect) {
      setMentorExpression('proud');
      setCorrectAnswers(prev => prev + 1);
      // Correct answer: gain insight and momentum
      setCurrentInsight(prev => Math.min(100, prev + 15));
      setCurrentMomentum(prev => Math.min(maxMomentum, prev + 1));
    } else {
      setMentorExpression('disappointed');
      // Wrong answer: lose insight, reset momentum
      setCurrentInsight(prev => Math.max(0, prev - 10));
      setCurrentMomentum(0);
    }
  };

  const handleContinue = () => {
    // Insight overlay now shows at the beginning of Jesse's activity, not on first correct answer
    
    if (currentQuestionIndex < questionSet.length - 1) {
      // Next question
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedOption(0); // Reset to first option
      setShowFeedback(false);
      setShowAnswerInterface(false); // Reset answer interface animation
      setQuestionsCompleted(questionsCompleted + 1);
      setIsTyping(true); // Reset typing state for new question
      setMentorExpression('curious'); // Mentor is curious about next response
    } else {
      // Complete tutorial activity - start zoom-out transition
      setMentorExpression('confident');
      startCompletionTransition();
    }
  };

  const startCompletionTransition = async () => {
    // Calculate final statistics
    const finalInsightGained = currentInsight - initialInsight;
    const finalMomentumGained = currentMomentum - initialMomentum;
    
    setInsightGained(finalInsightGained);
    setMomentumGained(finalMomentumGained);
    
    // 1. Activity zoom out of existence
    setPhase('activity-zoom-out');
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // 2. Summary card zoom into existence
    setPhase('summary-zoom-in');
    await new Promise(resolve => setTimeout(resolve, 300));
    setShowSummaryCard(true);
    
    // 3. Show summary state
    setPhase('summary');
  };

  const getPatientCardStyle = () => {
    const baseStyle = {
      position: 'absolute' as const,
      backgroundColor: colors.background,
      border: `3px solid ${colors.border}`,
      borderRadius: spacing.md,
      padding: spacing.xl,
      boxShadow: `0 8px 0 ${colors.border}, 0 12px 20px rgba(0,0,0,0.5)`,
      fontFamily: typography.fontFamily.pixel,
      transition: `all 1.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)`,
      width: '480px',
      maxHeight: '600px',
      overflow: 'hidden'
    };

    switch (phase) {
      case 'intro':
        return {
          ...baseStyle,
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%) scale(0)',
          opacity: 0,
          zIndex: 1015
        };
      case 'fade-to-black':
        return {
          ...baseStyle,
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%) scale(0)',
          opacity: 0,
          zIndex: 1015 // Hidden during black fade
        };
      case 'patient-reveal':
        return {
          ...baseStyle,
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%) scale(1)',
          opacity: 1,
          zIndex: 1015
        };
      case 'card-zoom-out':
        return {
          ...baseStyle,
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%) scale(0)',
          opacity: 0,
          zIndex: 1015
        };
      case 'activity-zoom-in':
      case 'questions':
      case 'activity-zoom-out':
      case 'summary-zoom-in':
      case 'summary':
        return {
          ...baseStyle,
          display: 'none' // Patient card completely hidden during questions and summary
        };
      default:
        return baseStyle;
    }
  };

  // Calculate summary data
  const accuracyPercentage = questionsAnswered > 0 ? Math.round((correctAnswers / questionsAnswered) * 100) : 0;
  
  const getCaseIcon = () => {
    switch (caseData.caseType) {
      case 'equipment':
        return '/images/ui/linac-rotation.png';
      case 'patient':
        return '/images/ui/patient-rotation.png';
      default:
        return '/images/ui/pointer.png';
    }
  };

  return (
    <>
      {/* Background Layer with Blur and Darkening */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundImage: `url('/images/hospital/backgrounds/physics-office-background.png')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        filter: 'blur(2px) brightness(0.3)',
        zIndex: 990
      }} />

      {/* Fade to Black Overlay for Transition */}
      {phase === 'fade-to-black' && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(0, 0, 0, 1)', // Full black for clean transition
          zIndex: 1020, // Higher z-index to cover everything
          transition: 'opacity 0.8s ease-in-out',
          opacity: 1
        }} />
      )}
      
      
      {/* Content Layer - No Filters Applied */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 1000
      }}>
      {/* Background medical overlay */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 
          'radial-gradient(circle at 30% 20%, rgba(59, 130, 246, 0.1) 0%, transparent 50%), ' +
          'radial-gradient(circle at 70% 80%, rgba(16, 185, 129, 0.08) 0%, transparent 50%)',
        opacity: phase === 'intro' ? 0 : 1,
        transition: 'opacity 1s ease-in-out',
        zIndex: 1005
      }} />



      {/* Patient Information Card - Simplified */}
      <div style={getPatientCardStyle()}>
        {/* Patient Header with Spinning Icon */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: spacing.lg
        }}>
          {/* Prominent Spinning Icon - Patient or Equipment based on case type */}
          {caseData.caseType === 'equipment' ? (
            <SpinningLinacIcon size={96} />
          ) : (
            <SpinningPatientIcon size={96} />
          )}
          
          {/* Patient Essential Info */}
          <div style={{ textAlign: 'center' }}>
            <h2 style={{
              fontSize: typography.fontSize.xxl,
              fontWeight: 'bold',
              margin: 0,
              color: colors.text,
              marginBottom: spacing.sm
            }}>
              {caseData.name}
            </h2>
            
            {/* Age and Demographics (only for patient cases) */}
            {caseData.caseType === 'patient' && (
              <div style={{
                fontSize: typography.fontSize.lg,
                color: colors.textDim,
                marginBottom: spacing.md,
                display: 'flex',
                justifyContent: 'center',
                gap: spacing.md
              }}>
                <span>Age: {caseData.age}</span>
                <span>•</span>
                <span>{caseData.gender}</span>
              </div>
            )}
            
            {/* Case Information */}
            <div style={{
              fontSize: typography.fontSize.md,
              color: colors.highlight,
              fontWeight: 'bold',
              padding: `${spacing.sm} ${spacing.lg}`,
              backgroundColor: 'rgba(132, 90, 245, 0.1)',
              border: `2px solid ${colors.highlight}`,
              borderRadius: spacing.md,
              display: 'inline-block'
            }}>
              {caseData.diagnosis}
            </div>
          </div>
        </div>
      </div>

      {/* Insight Points now handled by tutorial store overlay system */}

      {/* Question Interface - Narrative Style Layout */}
      {(phase === 'activity-zoom-in' || phase === 'questions' || phase === 'activity-zoom-out') && currentQuestion && (
        <div style={{
          position: 'absolute',
          top: '10px',
          left: 0,
          right: 0,
          bottom: '20px', // Removed bottom margin since resources moved to right
          display: 'flex',
          transform: phase === 'activity-zoom-in' ? 'scale(0.8)' : 
                     phase === 'activity-zoom-out' ? 'scale(0)' : 'scale(1)',
          opacity: phase === 'activity-zoom-in' ? 0 : 
                   phase === 'activity-zoom-out' ? 0 : 1,
          transition: 'all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          zIndex: 1012
        }}>
          {/* Character Section - Left Side */}
          <div style={{
            flex: '0 0 400px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-start', // Start from top instead of center
            alignItems: 'center',
            padding: spacing.xl,
            paddingTop: '180px', // Moved up from 180px since we removed progress indicator
            paddingBottom: `calc(${spacing.xl} + 20px)`, // Space for downward bob too
            position: 'relative',
            overflow: 'visible' // Allow portrait to bob without clipping
          }}>
            {/* Large Mentor Portrait */}
            <div style={{
              marginBottom: spacing.xs // Even tighter spacing
            }}>
              <MentorPortrait 
                mentorId={mentorId || 'garcia'} 
                expression={mentorExpression}
                size={220} // Even larger for prominence
                useExpressions={true}
                isAnimating={true}
                isTyping={isTyping}
              />
            </div>
            
            {/* Mentor Name Badge - Moved up */}
            <div style={{
              backgroundColor: 'rgba(0,0,0,0.9)',
              border: `3px solid ${colors.border}`,
              borderRadius: spacing.md,
              padding: `${spacing.md} ${spacing.lg}`,
              fontSize: typography.fontSize.xl,
              color: colors.text,
              fontWeight: 'bold',
              textAlign: 'center',
              boxShadow: `0 4px 0 ${colors.border}, 0 6px 12px rgba(0,0,0,0.3)`,
              marginBottom: spacing.xl // More space below name
            }}>
              {getMentorName(mentorId || 'garcia')}
            </div>



             
          </div>

          {/* Dialogue Section - Right Side */}
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-start', // Start from top instead of bottom
            paddingTop: '180px', // Fixed top position with breathing room
            paddingBottom: spacing.xl,
            paddingLeft: spacing.lg,
            paddingRight: '340px', // Space for right-side resource displays
            overflow: 'hidden',
            scrollbarWidth: 'none', // Firefox
            msOverflowStyle: 'none' // IE/Edge
          }} className="tutorial-dialogue-section">
            {/* Question Dialogue Box */}
            <TutorialDialogueBox onClick={() => isTyping && setIsTyping(false)} style={{ position: 'relative' }}>
              {/* Patient Icon in Top Right Corner */}
              <div 
                style={{
                  position: 'absolute',
                  top: spacing.md,
                  right: spacing.md,
                  cursor: 'pointer',
                  zIndex: 1030
                }}
                onMouseEnter={() => setShowPatientInfo(true)}
                onMouseLeave={() => setShowPatientInfo(false)}
              >
                {caseData.caseType === 'equipment' ? (
                  <SpinningLinacIcon size={36} />
                ) : (
                  <SpinningPatientIcon size={36} />
                )}
                
                {/* Patient Info Tooltip - Fixed positioning to escape container */}
                {showPatientInfo && (
                  <div style={{
                    position: 'fixed',
                    top: '150px', // Fixed position relative to dialogue box area
                    right: '190px', // Fixed position from right edge
                    backgroundColor: 'rgba(0,0,0,0.95)',
                    border: `2px solid ${colors.border}`,
                    borderRadius: spacing.sm,
                    padding: spacing.sm,
                    fontSize: typography.fontSize.xs,
                    color: colors.text,
                    whiteSpace: 'normal',
                    zIndex: 9999,
                    boxShadow: `0 4px 0 ${colors.border}, 0 6px 12px rgba(0,0,0,0.3)`,
                    width: '160px',
                    pointerEvents: 'none',
                    textAlign: 'left',
                    lineHeight: '1.3'
                  }}>
                    <div style={{ fontWeight: 'bold', color: colors.highlight, marginBottom: '4px', fontSize: typography.fontSize.sm }}>
                      {caseData.name}
                    </div>
                    {caseData.caseType === 'patient' && (
                      <div style={{ color: colors.textDim, marginBottom: '4px', fontSize: typography.fontSize.xs }}>
                        Age {caseData.age}, {caseData.gender}
                      </div>
                    )}
                    <div style={{ color: colors.text, fontSize: typography.fontSize.xs }}>
                      {caseData.diagnosis}
                    </div>
                    
                    {/* Tooltip Arrow - Right pointing */}
                    <div style={{
                      position: 'absolute',
                      top: '8px', // Near top of tooltip
                      right: '-6px',
                      width: 0,
                      height: 0,
                      borderTop: '6px solid transparent',
                      borderBottom: '6px solid transparent',
                      borderLeft: `6px solid ${colors.border}`,
                      zIndex: 1026
                    }} />
                    <div style={{
                      position: 'absolute',
                      top: '9px',
                      right: '-4px',
                      width: 0,
                      height: 0,
                      borderTop: '5px solid transparent',
                      borderBottom: '5px solid transparent',
                      borderLeft: '5px solid rgba(0,0,0,0.95)',
                      zIndex: 1027
                    }} />
                  </div>
                )}
              </div>
              
              <TutorialSpeakerName>
                {getMentorName(mentorId || 'garcia')}
              </TutorialSpeakerName>
              
              <TutorialDialogueText>
                <TypewriterText
                  key={`tutorial-question-${currentQuestionIndex}`}
                  text={currentQuestion.text}
                  speed={30}
                  clickToSkip={true}
                  onTypingStart={handleTypingStart}
                  onTypingComplete={handleTypingComplete}
                  style={{
                    fontSize: typography.fontSize.md,
                    lineHeight: '1.6',
                    color: colors.text
                  }}
                />
                
                {!isTyping && !showFeedback && (
                  <TutorialContinuePrompt>
                    Choose your response...
                  </TutorialContinuePrompt>
                )}
              </TutorialDialogueText>
            </TutorialDialogueBox>

            {/* Navigation Hint - Always visible during questions */}
            {!isTyping && !showFeedback && (
              <div style={{
                position: 'absolute',
                top: '-40px',
                right: '20px',
                fontSize: typography.fontSize.xs,
                color: focusedArea === 'dialogue' ? colors.highlight : colors.textDim,
                fontFamily: typography.fontFamily.pixel,
                background: 'rgba(0,0,0,0.7)',
                padding: '4px 8px',
                borderRadius: '4px',
                border: `1px solid ${focusedArea === 'dialogue' ? colors.highlight : colors.border}`,
                transition: 'all 0.3s ease'
              }}>
                {focusedArea === 'dialogue' ? '↓ Abilities' : '↑ Dialogue'}
              </div>
            )}

            {/* Radial Compass Selection Interface */}
            {!isTyping && !showFeedback && showAnswerInterface && (
              <div style={{ 
                marginTop: spacing.xxl, // Increased margin to prevent truncation
                paddingTop: spacing.lg, // Additional padding at top
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                animation: 'answerZoomIn 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                transform: 'scale(1)',
                opacity: focusedArea === 'dialogue' ? 1 : 0.6,
                transition: 'opacity 0.3s ease'
              }}>
                {/* Compass Container - Invisible */}
                <div style={{
                  position: 'relative',
                  width: '700px',
                  height: '450px', // Increased height for more spacing
                  backgroundColor: 'transparent', // Invisible container
                  border: 'none', // No border
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {/* Central Arrow Pointer */}
                  <div style={{
                    position: 'absolute',
                    width: '37.5px', // 15px * 2.5
                    height: '37.5px', // 15px * 2.5
                    backgroundImage: `url('/images/ui/pointer.png')`,
                    backgroundSize: '37.5px 37.5px', // Scaled up 2.5x
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'center',
                    imageRendering: 'pixelated',
                    zIndex: 10,
                    transition: 'all 0.4s ease',
                    transformOrigin: '50% calc(100% - 10px)', // Middle horizontally, 10px from bottom (4px * 2.5)
                    transform: (() => {
                      // Only 3 directions: North(0°), East(90°), West(270°)
                      const angles = [0, 90, 270];
                      return `rotate(${angles[selectedOption] || 0}deg)`;
                    })()
                  }} />
                  
                  {/* Compass Options - North, East, West only */}
                  {currentQuestion.options.slice(0, 3).map((option, index) => {
                    // Position options: North(0°), East(90°), West(270°) - skip South
                    const angles = [0, 90, 270]; // North, East, West
                    const angle = angles[index];
                    // Spread west and east further from center
                    const radius = index === 0 ? 140 : 180; // North closer, East/West further
                    const x = Math.cos((angle - 90) * Math.PI / 180) * radius; // -90 to start at top
                    const y = Math.sin((angle - 90) * Math.PI / 180) * radius;
                    
                    return (
                      <div
                        key={index}
                        style={{
                          position: 'absolute',
                          left: '50%',
                          top: '50%',
                          padding: `${spacing.lg} ${spacing.xxl}`, // Much more horizontal padding
                          backgroundColor: selectedOption === index ? 
                            'rgba(132, 90, 245, 0.4)' : 'rgba(0,0,0,0.85)', // Dark background like original container
                          border: `2px solid ${selectedOption === index ? colors.highlight : colors.border}`,
                          borderRadius: spacing.md,
                          color: selectedOption === index ? colors.highlight : colors.text,
                          fontFamily: typography.fontFamily.pixel,
                          fontSize: typography.fontSize.sm,
                          fontWeight: selectedOption === index ? 'bold' : 'normal',
                          textAlign: 'center',
                          width: '280px', // Much wider for breathing room
                          minHeight: '70px',
                          maxWidth: '300px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.3s ease',
                          cursor: 'pointer',
                          lineHeight: '1.4',
                          wordWrap: 'break-word',
                          hyphens: 'auto',
                          transform: selectedOption === index ? 
                            `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) scale(1.05)` :
                            `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) scale(1)`,
                          boxShadow: selectedOption === index ? 
                            `0 0 20px rgba(132, 90, 245, 0.5), 0 8px 0 ${colors.border}, 0 12px 20px rgba(0,0,0,0.4)` :
                            `0 4px 0 ${colors.border}, 0 6px 12px rgba(0,0,0,0.3)` // Box shadow like original container
                        }}
                        onClick={() => handleOptionSelect(index)}
                      >
                        {option.text}
                      </div>
                    );
                  })}
                  

                </div>
              </div>
            )}

            {/* Feedback Box */}
            {showFeedback && (
              <div style={{
                backgroundColor: currentQuestion.options[selectedOption].isCorrect ? 
                  'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                border: `2px solid ${currentQuestion.options[selectedOption].isCorrect ? 
                  '#22c55e' : '#ef4444'}`,
                borderRadius: spacing.md,
                padding: spacing.lg,
                marginTop: spacing.md
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing.sm,
                  marginBottom: spacing.sm
                }}>
                  <span style={{ fontSize: typography.fontSize.lg }}>
                    {currentQuestion.options[selectedOption].isCorrect ? '✅' : '❌'}
                  </span>
                  <span style={{
                    fontSize: typography.fontSize.md,
                    fontWeight: 'bold',
                    color: currentQuestion.options[selectedOption].isCorrect ? '#22c55e' : '#ef4444'
                  }}>
                    {currentQuestion.options[selectedOption].isCorrect ? 'Correct!' : 'Not quite right'}
                  </span>
                </div>
                <div style={{
                  fontSize: typography.fontSize.sm,
                  color: colors.text,
                  lineHeight: '1.4',
                  marginBottom: spacing.md
                }}>
                  {currentQuestion.options[selectedOption].feedback}
                </div>
                
                {/* Continue button */}
                <TutorialContinueButton onClick={handleContinue}>
                  {currentQuestionIndex < questionSet.length - 1 ? 
                    'Next Question →' : 'Complete Session →'}
                </TutorialContinueButton>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Enhanced Resource Display on Right Side - Persistent during questions phase */}
      {phase === 'questions' && (
        <div style={{
          position: 'absolute',
          top: '43%', // Moved up from 50% to 30% to free south area
          right: '20px',
          transform: 'translateY(-50%) scale(1)',
          opacity: 1,
          transition: 'all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          zIndex: 1020,
          animation: 'resourceDisplayZoomIn 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
        }}>
          <EnhancedResourceDisplay style={{
            maxWidth: '350px',
            width: 'auto',
            flexDirection: 'column',
            alignItems: 'stretch',
            gap: spacing.lg,
            padding: `${spacing.lg} ${spacing.md}`,
            minHeight: '350px', /* Slightly reduced since we moved panel up */
            maxHeight: '500px', /* Prevent overflow into south area */
            overflow: 'visible' /* Don't clip content */
          }}>
            <div>
              <ResourceDisplayTitle style={{ marginBottom: spacing.sm, textAlign: 'center' }}>Insight</ResourceDisplayTitle>
              
              {/* Insight bar - scaled up 4x for visibility */}
              <InsightBarContainer>
                <div style={{
                  position: 'relative',
                  width: '64px',   // Scaled up 4x (16px × 4)
                  height: '192px', // Scaled up 4x (48px × 4)
                  backgroundImage: `url('/images/ui/insight-bar.png')`,
                  backgroundRepeat: 'no-repeat',
                  backgroundSize: '384px 192px', // Scaled up 4x (96px×4, 48px×4)
                  backgroundPosition: `${Math.floor(currentInsight / 20) * -64}px 0px`, // Scaled frame movement (16px×4)
                  imageRendering: 'pixelated',
                  transition: 'background-position 0.4s ease'
                }}>
                  <InsightValueOverlay>{currentInsight}</InsightValueOverlay>
                </div>
              </InsightBarContainer>
            </div>
            
            <div>
                              <MomentumContainer>
                  <MomentumLabel>Momentum</MomentumLabel>
                  <MomentumBlipsContainer>
                    {Array.from({ length: maxMomentum }).map((_, index) => {
                      const blipState = index < currentMomentum ? Math.min(3, currentMomentum) : 0;
                      return (
                        <div 
                          key={index}
                          style={{
                            width: '40px',
                            height: '40px',
                            backgroundImage: `url('/images/ui/momentum-blip.png')`,
                            backgroundRepeat: 'no-repeat',
                            backgroundSize: '160px 40px', // 4 frames * 40px each  
                            backgroundPosition: `${blipState * -40}px 0px`, // Move by frame width
                            imageRendering: 'pixelated',
                            transition: 'all 0.3s ease',
                            transform: blipState > 0 ? 'scale(1.1)' : 'scale(1)',
                          }}
                        />
                      );
                    })}
                  </MomentumBlipsContainer>
                <MomentumBonus $visible={currentMomentum >= 2} $level={currentMomentum}>
                  {currentMomentum >= 3 ? 'BOAST UNLOCKED!' : 
                   currentMomentum >= 2 ? '+25% Insight Bonus' : ''}
                </MomentumBonus>
              </MomentumContainer>
            </div>
          </EnhancedResourceDisplay>
        </div>
      )}

      {/* Abilities Bar - Bottom Center - Persistent during questions phase */}
      {phase === 'questions' && (
        <AbilitiesBarContainer 
          $isVisible={true} 
          $isActive={focusedArea === 'abilities'}
        >
          {/* Ability Slots 1-3 */}
          {equippedAbilities.map((ability, index) => {
            const canAfford = ability.type === 'insight' ? currentInsight >= ability.cost * 20 :
                             ability.type === 'momentum' ? currentMomentum >= ability.cost :
                             currentInsight >= ability.cost * 10 && currentMomentum >= ability.cost;
            
            return (
              <AbilitySlot
                key={ability.id}
                $isSelected={selectedAbilitySlot === index && focusedArea === 'abilities'}
                $isAvailable={canAfford}
                onClick={() => {
                  setFocusedArea('abilities');
                  setSelectedAbilitySlot(index);
                }}
              >
                <AbilityHotkey>{index + 1}</AbilityHotkey>
                <AbilityCost $canAfford={canAfford}>
                  {ability.cost}
                  {ability.type === 'insight' ? 'I' : ability.type === 'momentum' ? 'M' : 'H'}
                </AbilityCost>
                <AbilityIcon $abilityType={ability.type} $abilityId={ability.id}>
                  {/* Only show emoji fallback if no sprite available */}
                  {ability.id !== 'fast_learner' && (
                    ability.type === 'insight' ? '💡' : 
                    ability.type === 'momentum' ? '⚡' : '🔮'
                  )}
                </AbilityIcon>
                <AbilityLabel>
                  {ability.name.split(' ').map(word => word.slice(0, 4)).join(' ')}
                </AbilityLabel>
              </AbilitySlot>
            );
          })}
          
          {/* Separator */}
          <div style={{
            width: '2px',
            height: '60px',
            background: colors.border,
            alignSelf: 'center',
            margin: `0 ${spacing.sm}`
          }} />
          
          {/* Boast Slot */}
          <AbilitySlot
            $isSelected={selectedAbilitySlot === 3 && focusedArea === 'abilities'}
            $isAvailable={currentMomentum >= equippedBoastAbility.momentumCost && 
                         currentInsight >= equippedBoastAbility.insightCost}
            $isBoastSlot={true}
            onClick={() => {
              setFocusedArea('abilities');
              setSelectedAbilitySlot(3);
            }}
          >
            <AbilityHotkey>B</AbilityHotkey>
            <AbilityCost $canAfford={currentMomentum >= equippedBoastAbility.momentumCost && 
                                    currentInsight >= equippedBoastAbility.insightCost}>
              {equippedBoastAbility.momentumCost}M
              {equippedBoastAbility.insightCost > 0 && `+${equippedBoastAbility.insightCost}I`}
            </AbilityCost>
            <AbilityIcon $abilityType="boast" $abilityId={equippedBoastAbility.id}>
              {/* Boast abilities use emoji for now */}
              🚀
            </AbilityIcon>
            <AbilityLabel>
              {equippedBoastAbility.name.split(' ').map(word => word.slice(0, 4)).join(' ')}
            </AbilityLabel>
          </AbilitySlot>
        </AbilitiesBarContainer>
      )}

      {/* Session Complete Summary Card */}
      {(phase === 'summary-zoom-in' || phase === 'summary') && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 1030
        }}>
          <SummaryCard $isVisible={showSummaryCard}>
            <SummaryTitle>🎯 Session Complete!</SummaryTitle>
            
            <div style={{ 
              fontSize: typography.fontSize.lg, 
              color: colors.textDim,
              marginBottom: spacing.xl
            }}>
              {caseData.caseType === 'equipment' 
                ? `${caseData.name} Equipment Analysis` 
                : `${caseData.name} Case Review`
              }
            </div>
            
            <SessionGrid>
              <StatItem>
                <StatIconContainer>
                  {caseData.caseType === 'equipment' ? (
                    <SummarySpinningIcon 
                      spriteUrl="/images/ui/linac-rotation.png" 
                      size={56} 
                      frameCount={16} 
                      speed={120} 
                    />
                  ) : (
                    <SummarySpinningIcon 
                      spriteUrl="/images/ui/patient-rotation.png" 
                      size={56} 
                      frameCount={16} 
                      speed={100} 
                    />
                  )}
                </StatIconContainer>
                <StatLabel>Questions Answered</StatLabel>
                <StatValue>
                  <AnimatedNumber value={questionsAnswered} duration={1500} />
                </StatValue>
              </StatItem>
              
              <StatItem>
                <StatIconContainer>
                  <SummaryReactionSymbol accuracy={accuracyPercentage} size={48} />
                </StatIconContainer>
                <StatLabel>Accuracy</StatLabel>
                <StatValue>
                  <AnimatedNumber value={accuracyPercentage} duration={2000} />%
                </StatValue>
              </StatItem>
              
              <StatItem>
                <StatIconContainer>
                  <SummaryInsightBar level={currentInsight} size={48} />
                </StatIconContainer>
                <StatLabel>Insight Gained</StatLabel>
                <StatValue>
                  +<AnimatedNumber value={insightGained} duration={2200} />
                </StatValue>
              </StatItem>
              
              <StatItem>
                <StatIconContainer>
                  <SummaryMomentumBlip level={currentMomentum} size={48} />
                </StatIconContainer>
                <StatLabel>Momentum Gained</StatLabel>
                <StatValue>
                  +<AnimatedNumber value={momentumGained} duration={2500} />
                </StatValue>
              </StatItem>
            </SessionGrid>
            
            <div style={{
              fontSize: typography.fontSize.md,
              color: colors.textDim,
              marginTop: spacing.lg,
              fontStyle: 'italic'
            }}>
              "Great work with {getMentorName(mentorId || 'garcia')}! You're developing real clinical insight."
            </div>
            
            <SummaryContinueButton onClick={onComplete}>
              Continue Journey
            </SummaryContinueButton>
          </SummaryCard>
        </div>
      )}

      <style jsx global>{`
        /* Override global overflow hidden to allow portrait bobbing */
        html, body {
          overflow: visible !important;
        }
        
        @keyframes slideDown {
          from { transform: translate(-50%, -100%); opacity: 0; }
          to { transform: translate(-50%, 0); opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes answerZoomIn {
          from { 
            transform: scale(0); 
            opacity: 0; 
          }
          to { 
            transform: scale(1); 
            opacity: 1; 
          }
        }
        @keyframes resourceDisplayZoomIn {
          from { 
            transform: translateY(-50%) scale(0); 
            opacity: 0; 
          }
          to { 
            transform: translateY(-50%) scale(1); 
            opacity: 1; 
          }
        }
        
        /* Hide scrollbars comprehensively */
        .tutorial-dialogue-section {
          scrollbar-width: none; /* Firefox */
          -ms-overflow-style: none; /* IE/Edge */
        }
        .tutorial-dialogue-section::-webkit-scrollbar {
          display: none; /* Chrome/Safari/WebKit */
          width: 0;
          height: 0;
        }
        .tutorial-dialogue-section::-webkit-scrollbar-track {
          display: none;
        }
        .tutorial-dialogue-section::-webkit-scrollbar-thumb {
          display: none;
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      </div>
    </>
  );
}