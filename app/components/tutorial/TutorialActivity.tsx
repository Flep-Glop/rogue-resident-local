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
  // Animation states
  const [phase, setPhase] = useState<'intro' | 'patient-reveal' | 'slide-to-panel' | 'mentor-entry' | 'questions' | 'complete'>('intro');
  const [showMentorDialogue, setShowMentorDialogue] = useState(false);

  
  // Question states
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [questionsCompleted, setQuestionsCompleted] = useState(0);
  
  // Typing state to control when options appear
  const [isTyping, setIsTyping] = useState(false);
  
  // Mentor expression state
  const [mentorExpression, setMentorExpression] = useState<ExpressionType>('neutral');
  
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
  }, []);

  // Pokemon-style transition sequence
  useEffect(() => {
    const sequence = async () => {
      // 1. Brief intro pause
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // 2. Patient card reveal (time to read patient info)
      setPhase('patient-reveal');
      setMentorExpression('focused');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // 3. Slide to side panel (smooth transition)
      setPhase('slide-to-panel');
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      // 4. Brief pause before questions
      setPhase('mentor-entry');
      setMentorExpression('encouraging');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 5. Insight overlay now handled by tutorial store system
      
      // 6. Begin questions
      setPhase('questions');
      setMentorExpression('serious'); // Ready to teach
    };
    
    sequence();
  }, [mentorId]);

  const handleOptionSelect = (optionIndex: number) => {
    setSelectedOption(optionIndex);
    setShowFeedback(true);
    
    // Update mentor expression based on answer
    if (currentQuestion.options[optionIndex].isCorrect) {
      setMentorExpression('proud');
    } else {
      setMentorExpression('disappointed');
    }
  };

  const handleContinue = () => {
    // Insight overlay now shows at the beginning of Jesse's activity, not on first correct answer
    
    if (currentQuestionIndex < questionSet.length - 1) {
      // Next question
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedOption(null);
      setShowFeedback(false);
      setQuestionsCompleted(questionsCompleted + 1);
      setIsTyping(true); // Reset typing state for new question
      setMentorExpression('curious'); // Mentor is curious about next response
    } else {
      // Complete tutorial activity
      setPhase('complete');
      setMentorExpression('confident');
      setTimeout(() => {
        onComplete();
      }, 2000);
    }
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
          opacity: 0
        };
      case 'patient-reveal':
        return {
          ...baseStyle,
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%) scale(1)',
          opacity: 1,
          zIndex: 10
        };
      case 'slide-to-panel':
      case 'mentor-entry':
      case 'questions':
        return {
          ...baseStyle,
          top: '20px',
          right: '20px',
          transform: 'scale(0.85)',
          opacity: 0.95,
          zIndex: 5
        };
      default:
        return baseStyle;
    }
  };

  if (phase === 'complete') {
    return (
      <div style={{
        width: '100vw',
        height: '100vh',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: typography.fontFamily.pixel,
        color: colors.text,
        textAlign: 'center'
      }}>
        <div>
          <div style={{ fontSize: typography.fontSize.xxl, marginBottom: spacing.lg }}>
            ✨ Excellent Work! ✨
          </div>
          <div style={{ fontSize: typography.fontSize.lg, color: colors.textDim }}>
            {caseData.caseType === 'equipment' 
              ? `You've successfully diagnosed ${caseData.name}'s issues!`
              : `You've successfully helped plan ${caseData.name}'s treatment`
            }
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
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
        transition: 'opacity 1s ease-in-out'
      }} />

      {/* Title banner */}
      {phase !== 'intro' && (
        <div style={{
          position: 'absolute',
          top: '40px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: 'rgba(0,0,0,0.8)',
          border: `2px solid ${colors.border}`,
          borderRadius: spacing.sm,
          padding: `${spacing.sm} ${spacing.lg}`,
          fontFamily: typography.fontFamily.pixel,
          fontSize: typography.fontSize.xl,
          fontWeight: 'bold',
          color: colors.highlight,
          textAlign: 'center',
          animation: phase === 'patient-reveal' ? 'slideDown 0.8s ease-out' : 'none',
          zIndex: 8
        }}>
          🏥 TREATMENT PLANNING SESSION
        </div>
      )}

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
      {phase === 'questions' && currentQuestion && (
        <div style={{
          position: 'absolute',
          top: '100px',
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          zIndex: 6
        }}>
          {/* Character Section - Left Side */}
          <div style={{
            flex: '0 0 400px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            padding: spacing.xl,
            paddingTop: `calc(${spacing.xl} + 20px)`, // More space for bobbing animation
            paddingBottom: `calc(${spacing.xl} + 20px)`, // Space for downward bob too
            position: 'relative',
            overflow: 'visible' // Allow portrait to bob without clipping
          }}>
            {/* Large Mentor Portrait */}
            <div style={{
              marginBottom: spacing.xl
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
            
            {/* Mentor Name Badge */}
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
              marginBottom: spacing.lg
            }}>
              {getMentorName(mentorId || 'garcia')}
            </div>

            {/* Progress indicator */}
            <div style={{
              backgroundColor: 'rgba(0,0,0,0.7)',
              border: `2px solid ${colors.border}`,
              borderRadius: spacing.sm,
              padding: spacing.md,
              fontSize: typography.fontSize.sm,
              color: colors.textDim,
              textAlign: 'center'
            }}>
                                Question {currentQuestionIndex + 1} of {questionSet.length}
            </div>
          </div>

          {/* Dialogue Section - Right Side */}
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            padding: spacing.xl,
            paddingLeft: spacing.lg,
            paddingRight: '540px', // Space for patient card
            overflow: 'hidden',
            scrollbarWidth: 'none', // Firefox
            msOverflowStyle: 'none' // IE/Edge
          }} className="tutorial-dialogue-section">
            {/* Question Dialogue Box */}
            <TutorialDialogueBox onClick={() => isTyping && setIsTyping(false)}>
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

            {/* Options Container */}
            {!isTyping && !showFeedback && (
              <TutorialOptionsContainer style={{ marginTop: spacing.md }}>
                {currentQuestion.options.map((option, index) => (
                  <TutorialOptionButton
                    key={index}
                    onClick={() => handleOptionSelect(index)}
                    $disabled={selectedOption !== null}
                    $selected={selectedOption === index}
                  >
                    {option.text}
                  </TutorialOptionButton>
                ))}
              </TutorialOptionsContainer>
            )}

            {/* Feedback Box */}
            {showFeedback && selectedOption !== null && (
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
  );
}