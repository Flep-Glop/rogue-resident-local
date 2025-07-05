'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { colors, spacing, typography, borders, animation } from '@/app/styles/pixelTheme';
import SpriteImage from './SpriteImage';
import { getPortraitCoordinates, getMediumPortraitSrc, getExpressionCoordinates, SPRITE_SHEETS, ExpressionType } from '@/app/utils/spriteMap';
import { ActivityOption, MentorId, ActivityDifficulty } from '@/app/types';
import { useResourceStore } from '@/app/store/resourceStore';
import { useActivityStore } from '@/app/store/activityStore';
import BoastButton from './BoastButton';
import { selectActivityQuestions } from '@/app/core/questions/questionManager';
import { Question, MultipleChoiceQuestion } from '@/app/types/questions';
import { KnowledgeDomain } from '@/app/types';
import { QUESTION_BANK } from '@/app/data/questionBank';
import TypewriterText from './TypewriterText';

interface TwitterStyleActivityProps {
  currentActivity: ActivityOption;
  onComplete: () => void;
}

interface Message {
  id: string;
  type: 'mentor' | 'player';
  content: string;
  timestamp: Date;
  isTyping?: boolean;
  feedback?: string;
  isCorrect?: boolean;
}

// Sample patient data for transition
const SAMPLE_PATIENTS: Record<string, any> = {
  'patient_case_review': {
    name: 'Maria Rodriguez',
    age: 67,
    gender: 'Female',
    diagnosis: 'Hepatocellular Carcinoma',
    lesionDetails: '4.2 cm lesion in right hepatic lobe, segment VI',
    additionalInfo: [
      'Recent weight loss: 8 lbs over 3 months',
      'Previous surgery: Cholecystectomy (2019)',
      'Comorbidities: Hypertension, Type 2 diabetes'
    ]
  },
  'morning_rounds': {
    name: 'James Thompson',
    age: 72,
    gender: 'Male',
    diagnosis: 'Prostate Adenocarcinoma (T2N0M0)',
    lesionDetails: 'Gleason 7 (3+4), PSA 12.4 ng/mL',
    additionalInfo: [
      'Stage II, intermediate risk',
      'Simulation completed yesterday',
      'Started hormone therapy 2 months ago'
    ]
  },
  'qa_protocol_review': {
    name: 'Sarah Chen',
    age: 54,
    gender: 'Female',
    diagnosis: 'Left Breast Cancer (T1N1M0)',
    lesionDetails: 'IDC, 2.1 cm with axillary lymph node involvement',
    additionalInfo: [
      'Post-lumpectomy radiation therapy',
      'ER+/PR+, HER2-',
      'Receiving concurrent chemotherapy'
    ]
  },
  'treatment_planning_session': {
    name: 'Robert Davis',
    age: 58,
    gender: 'Male',
    diagnosis: 'Lung Adenocarcinoma (T3N2M0)',
    lesionDetails: '5.8 cm RUL mass with mediastinal involvement',
    additionalInfo: [
      'Stage IIIA non-small cell lung cancer',
      'Concurrent chemoradiation planned',
      'Respiratory motion: 1.2 cm SI direction'
    ]
  }
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
    }, 150); // Slower animation - 150ms per frame for smoother rotation
    
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

// Mentor Portrait Component with Expressions
const MentorPortrait: React.FC<{ 
  mentorId: MentorId, 
  expression?: ExpressionType,
  size?: number,
  useExpressions?: boolean,
  isAnimating?: boolean
}> = ({ mentorId, expression = 'neutral', size = 80, useExpressions = false, isAnimating = false }) => {
  const [currentExpression, setCurrentExpression] = React.useState<ExpressionType>(expression);
  const [bobOffset, setBobOffset] = React.useState(0);

  // Expression cycling during question presentation
  React.useEffect(() => {
    if (!isAnimating || !useExpressions) return;
    
    const expressions: ExpressionType[] = ['thinking', 'focused', 'curious', 'encouraging'];
    let currentIndex = 0;
    
    const cycleInterval = setInterval(() => {
      setCurrentExpression(expressions[currentIndex]);
      currentIndex = (currentIndex + 1) % expressions.length;
    }, 1500); // Change expression every 1.5 seconds
    
    return () => clearInterval(cycleInterval);
  }, [isAnimating, useExpressions]);

  // Bobbing animation
  React.useEffect(() => {
    let animationFrame: number;
    let startTime = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const bobAmount = Math.sin(elapsed * 0.003) * 3; // Gentle 3px bob
      setBobOffset(bobAmount);
      animationFrame = requestAnimationFrame(animate);
    };
    
    animate();
    return () => cancelAnimationFrame(animationFrame);
  }, []);

  // Update expression when not animating
  React.useEffect(() => {
    if (!isAnimating) {
      setCurrentExpression(expression);
    }
  }, [expression, isAnimating]);

  const mentorCharacterId = (() => {
    switch (mentorId) {
      case MentorId.GARCIA: return 'garcia';
      case MentorId.KAPOOR: return 'kapoor';
      case MentorId.QUINN: return 'quinn';
      case MentorId.JESSE: return 'jesse';
      default: return 'garcia';
    }
  })();

  // Use expression spritesheet for Garcia if available and requested
  const hasExpressionSheet = mentorCharacterId === 'garcia' && useExpressions;
  
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
        overflow: 'hidden',
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
          backgroundImage: `url('/images/characters/portraits/garcia-animation.png')`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: `-${expressionCoords.x * scale}px 0px`,
          backgroundSize: `${15 * 42 * scale}px ${42 * scale}px`,
          imageRendering: 'pixelated'
        }} />
        {/* Expression indicator - more subtle for spritesheet version */}
        <div style={{
          position: 'absolute',
          top: '-2px',
          right: '-2px',
          width: '12px',
          height: '12px',
          backgroundColor: colors.highlight,
          borderRadius: '50%',
          border: `1px solid ${colors.border}`,
          opacity: 0.8
        }} />
        {/* Debug overlay */}
        <div style={{
          position: 'absolute',
          bottom: '2px',
          left: '2px',
          fontSize: '10px',
          color: colors.text,
          backgroundColor: 'rgba(0,0,0,0.8)',
          padding: '2px 4px',
          borderRadius: '2px'
        }}>
          {currentExpression}
        </div>
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
      overflow: 'hidden',
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
      {/* Expression indicator */}
      <div style={{
        position: 'absolute',
        bottom: '-2px',
        right: '-2px',
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

export default function TwitterStyleActivity({ currentActivity, onComplete }: TwitterStyleActivityProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);
  const [questionsCompleted, setQuestionsCompleted] = useState(0);
  const [insight, setInsight] = useState(50);
  const [starPoints, setStarPoints] = useState(10);
  const [momentum, setMomentum] = useState(0);
  const [showTypingIndicator, setShowTypingIndicator] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [questions, setQuestions] = useState<Question[]>([]);
  
  // Patient transition states
  const [showPatientTransition, setShowPatientTransition] = useState(false);
  const [animationPhase, setAnimationPhase] = useState<'intro' | 'patient-reveal' | 'slide-to-panel' | 'challenge-ready'>('intro');
  const [showPatientCard, setShowPatientCard] = useState(false);
  const [showBriefContext, setShowBriefContext] = useState(false);
  
  // Mentor expression state
  const [mentorExpression, setMentorExpression] = useState<ExpressionType>('neutral');
  
  // Use ref to prevent race conditions
  const loadingRef = React.useRef(false);
  
  // Store hooks
  const { insight: resourceInsight, starPoints: resourceStarPoints, canBoast, updateInsight, updateStarPoints } = useResourceStore();
  const { completeActivity } = useActivityStore();

  // Check if this activity should have patient transition
  const shouldShowPatientTransition = (activityId: string): boolean => {
    const patientActivities = [
      'patient_case_review',
      'morning_rounds', 
      'afternoon_patient_cases',
      'patient_followup',
      'patient_observation',
      'chart_rounds',
      'complex_case_review',
      'new_patient_orientation'
    ];
    return patientActivities.includes(activityId);
  };

  // Get patient data
  const patientData = SAMPLE_PATIENTS[currentActivity.id] || SAMPLE_PATIENTS['patient_case_review'];
  const hasPatientTransition = shouldShowPatientTransition(currentActivity.id);

  // Mentor mapping
  const mentorToCharacterId: Record<MentorId, string> = {
    [MentorId.GARCIA]: 'garcia',
    [MentorId.KAPOOR]: 'kapoor',
    [MentorId.QUINN]: 'quinn',
    [MentorId.JESSE]: 'jesse',
  };

  // Animation sequence for patient activities
  useEffect(() => {
    if (!hasPatientTransition) {
      setAnimationPhase('challenge-ready');
      return;
    }

    const sequence = async () => {
      // Initialize patient transition state
      setShowPatientTransition(true);
      
      // 1. Brief intro pause
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // 2. Show patient card in center
      setShowPatientCard(true);
      setAnimationPhase('patient-reveal');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // 3. Slide to panel
      setAnimationPhase('slide-to-panel');
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      // 4. Show brief context
      setShowBriefContext(true);
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // 5. Ready for challenge
      setAnimationPhase('challenge-ready');
    };
    
    sequence();
  }, [hasPatientTransition]);

  // Load questions when animation is ready
  useEffect(() => {
    if (animationPhase !== 'challenge-ready') return;
    
    const loadQuestions = async () => {
      // Prevent duplicate loading with multiple checks
      if (loadingRef.current || questions.length > 0) {
        console.log('[TwitterStyleActivity] Skipping load - already loaded');
        return;
      }
      
      try {
        loadingRef.current = true;
        setIsLoading(true);
        console.log(`[TwitterStyleActivity] Loading questions for activity: ${currentActivity.id}`);
        
        const activityQuestions = await selectActivityQuestions(
          currentActivity.domains[0] || KnowledgeDomain.RADIATION_THERAPY, // Use first domain as primary
          currentActivity.difficulty,
          2, // Load 2 questions for now
          ['multipleChoice'], // Only load multiple choice questions for Twitter-style interface
          currentActivity.mentor || 'Kapoor' // Pass mentor for filtering
        );
        
        if (activityQuestions.length > 0) {
          console.log('[TwitterStyleActivity] Loaded questions:', activityQuestions.map(q => ({ id: q.id, type: q.type })));
          setQuestions(activityQuestions);
          // Add initial mentor message with ONLY the first question
          setTimeout(() => {
            console.log('[TwitterStyleActivity] Adding ONLY first question:', activityQuestions[0].id);
            addMentorMessage(activityQuestions[0]);
          }, 800);
        } else {
          // Fallback to sample data if no questions found
          console.log('[TwitterStyleActivity] No questions found, using fallback');
          const fallbackQuestion = {
            id: 'fallback',
            question: `${getMentorName(currentActivity.mentor)} asks: "This is a sample question for ${currentActivity.title}. What would be the best approach for this scenario?"`,
            type: 'multipleChoice',
            options: [
              { text: "Approach A - Conservative method", isCorrect: false },
              { text: "Approach B - Standard protocol", isCorrect: true },
              { text: "Approach C - Aggressive treatment", isCorrect: false }
            ],
            tags: { 
              domain: 'Dosimetry',
              difficulty: 1,
              mentor: currentActivity.mentor 
            },
            feedback: {
              correct: "Excellent work!",
              incorrect: "Not quite right, but good thinking."
            }
          } as any;
          
          setQuestions([fallbackQuestion]);
          setTimeout(() => {
            addMentorMessage(fallbackQuestion);
          }, 800);
        }
      } catch (error) {
        console.error('[TwitterStyleActivity] Error loading questions:', error);
        // Add error message
        const errorQuestion = {
          id: 'error',
          question: `${getMentorName(currentActivity.mentor)} says: "Let's work through this step by step. I'll guide you through the key concepts."`,
          type: 'multipleChoice',
          options: [
            { text: "I'm ready to learn", isCorrect: true },
            { text: "Let me review the basics first", isCorrect: true }
          ],
          tags: { 
            domain: 'Dosimetry',
            difficulty: 1,
            mentor: currentActivity.mentor 
          },
          feedback: {
            correct: "Great attitude!",
            incorrect: "Let's approach this step by step."
          }
        } as any;
        
        setQuestions([errorQuestion]);
        setTimeout(() => {
          addMentorMessage(errorQuestion);
        }, 800);
      } finally {
        setIsLoading(false);
        loadingRef.current = false;
      }
    };

    loadQuestions();
  }, [animationPhase, currentActivity.id]); // Depend on animation phase and activity ID

  // Patient card styles
  const getPatientCardStyle = () => {
    if (!showPatientTransition || !showPatientCard) return { display: 'none' };
    
    const baseStyle = {
      position: 'fixed' as const,
      backgroundColor: colors.background,
      border: `3px solid ${colors.border}`,
      borderRadius: spacing.md,
      padding: spacing.xl,
      boxShadow: `0 8px 0 ${colors.border}, 0 12px 20px rgba(0,0,0,0.5)`,
      fontFamily: typography.fontFamily.pixel,
      transition: `all 1.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)`,
      width: '480px',
      maxHeight: '600px',
      overflow: 'hidden',
      zIndex: animationPhase === 'patient-reveal' ? 1000 : 10
    };

    switch (animationPhase) {
      case 'intro':
        return { ...baseStyle, display: 'none' };
      case 'patient-reveal':
        return {
          ...baseStyle,
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%) scale(1)',
          opacity: 1
        };
      case 'slide-to-panel':
      case 'challenge-ready':
        return {
          ...baseStyle,
          top: '20px',
          right: '20px',
          transform: 'scale(0.85)',
          opacity: 0.95
        };
      default:
        return baseStyle;
    }
  };

  const getMentorName = (mentorId?: MentorId): string => {
    switch (mentorId) {
      case MentorId.GARCIA: return 'Dr. Garcia';
      case MentorId.KAPOOR: return 'Dr. Kapoor';
      case MentorId.QUINN: return 'Dr. Quinn';
      case MentorId.JESSE: return 'Jesse';
      default: return 'Mentor';
    }
  };

  const addMentorMessage = (question: Question) => {
    console.log('[TwitterStyleActivity] Adding mentor message for question:', question.id);
    
    // Get the question text - handle both JSON format and our interface format
    const questionText = (question as any).question || question.text || 'Question text not available';
    
    // Check if this question message already exists to prevent duplicates
    setMessages(prev => {
      const messageExists = prev.some(msg => 
        msg.type === 'mentor' && msg.content === questionText
      );
      
      if (messageExists) {
        console.log('[TwitterStyleActivity] Message already exists, skipping duplicate');
        return prev;
      }
      
      return [...prev, {
        id: `mentor-${question.id}-${Date.now()}-${Math.random()}`, // More unique key
        type: 'mentor',
        content: questionText,
        timestamp: new Date()
      }];
    });
  };

  const addPlayerMessage = (optionText: string, isCorrect: boolean, feedback?: string) => {
    setMessages(prev => [...prev, {
      id: `player-${Date.now()}-${Math.random()}`, // More unique key
      type: 'player',
      content: optionText,
      timestamp: new Date(),
      isCorrect,
      feedback
    }]);
  };

  const handleOptionSelect = (index: number) => {
    if (!mcQuestion) return;
    
    const selectedOption = mcQuestion.options[index];
    const isCorrect = selectedOption.isCorrect || false;
    
    // Update mentor expression based on answer
    setMentorExpression(isCorrect ? 'proud' : 'disappointed');
    
    setShowFeedback(true);
    
    // Add player message
    addPlayerMessage(selectedOption.text, isCorrect, selectedOption.feedback);
    
    // Update game state
    if (isCorrect) {
      const insightGain = getInsightReward();
      setInsight(prev => prev + insightGain);
      setMomentum(prev => Math.min(prev + 1, 5));
      
      // Star point chance
      if (Math.random() < getStarPointChance()) {
        setStarPoints(prev => prev + 1);
      }
    } else {
      setMomentum(prev => Math.max(prev - 1, 0));
    }
    
    // Show feedback after brief delay
    setTimeout(() => {
      addMentorFeedback(isCorrect, selectedOption.feedback);
      setMentorExpression('curious'); // Mentor is curious about next response
    }, 1000);
  };

  const addMentorFeedback = (isCorrect: boolean, feedback?: string) => {
    const mentorName = getMentorName(currentActivity.mentor);
    let feedbackMessage = feedback || (isCorrect ? "Excellent work!" : "Not quite right, but good thinking.");
    
    setMessages(prev => [...prev, {
      id: `feedback-${Date.now()}-${Math.random()}`, // More unique key
      type: 'mentor',
      content: feedbackMessage,
      timestamp: new Date()
    }]);
  };

  const handleContinue = () => {
    const nextQuestionIndex = currentQuestionIndex + 1;
    setQuestionsCompleted(prev => prev + 1);
    
    if (nextQuestionIndex < questions.length) {
      // Move to next question
      setCurrentQuestionIndex(nextQuestionIndex);
      setShowFeedback(false);
      
      // Add next question after a brief delay
      setTimeout(() => {
        addMentorMessage(questions[nextQuestionIndex]);
      }, 500);
    } else {
      // Activity complete
      const mentorName = getMentorName(currentActivity.mentor);
      setMessages(prev => [...prev, {
        id: `completion-${Date.now()}`,
        type: 'mentor',
        content: `Great job completing this session! You've shown solid understanding of ${currentActivity.title}.`,
        timestamp: new Date()
      }]);
      
      // Complete the activity
      setTimeout(() => {
        completeActivity(true);
        onComplete();
      }, 2000);
    }
  };

  const getCurrentQuestion = (): Question | null => {
    return questions[currentQuestionIndex] || null;
  };

  const getInsightReward = (): number => {
    switch (currentActivity.difficulty) {
      case ActivityDifficulty.EASY: return 10;
      case ActivityDifficulty.MEDIUM: return 20;
      case ActivityDifficulty.HARD: return 30;
      default: return 10;
    }
  };

  const getStarPointChance = (): number => {
    const baseChance = 0.1; // 10% base chance
    const momentumBonus = momentum * 0.05; // 5% per momentum
    return Math.min(baseChance + momentumBonus, 0.25); // Cap at 25%
  };

  const handleTangent = () => {
    if (insight >= 25) {
      updateInsight(-25); // Spend 25 insight
      // Add tangent message
      const mentorName = getMentorName(currentActivity.mentor);
      setMessages(prev => [...prev, {
        id: `tangent-${Date.now()}`,
        type: 'mentor',
        content: `${mentorName} shares an interesting tangent about this topic...`,
        timestamp: new Date()
      }]);
    }
  };

  const handleBoastActivate = () => {
    if (momentum >= 3) {
      setMomentum(0); // Spend all momentum
      // Add boast message
      setMessages(prev => [...prev, {
        id: `boast-${Date.now()}`,
        type: 'player',
        content: "I'm feeling confident about this! Let me tackle a harder challenge.",
        timestamp: new Date(),
        isCorrect: true
      }]);
    }
  };

  const currentQuestion = getCurrentQuestion();
  const mcQuestion = currentQuestion?.type === 'multipleChoice' ? currentQuestion as MultipleChoiceQuestion : null;

  // Debug logging - reduced for production
  if (isLoading) {
    console.log('[TwitterStyleActivity] Loading questions...');
  }

  if (isLoading) {
    return (
      <div style={{
        width: '100vw',
        height: '100vh',
        background: '#000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: typography.fontFamily.pixel,
        color: colors.text
      }}>
        <div>Loading questions...</div>
      </div>
    );
  }

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      background: '#000',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: typography.fontFamily.pixel,
      color: colors.text,
      overflow: 'hidden',
      position: 'relative'
    }}>
      {/* Patient Card Overlay (animates within the interface) */}
      {showPatientTransition && (
        <div style={getPatientCardStyle()}>
          {/* Patient Header */}
          <div style={{
            borderBottom: `2px solid ${colors.border}`,
            paddingBottom: spacing.md,
            marginBottom: spacing.lg,
            display: 'flex',
            alignItems: 'center',
            gap: spacing.md
          }}>
            {/* Spinning Patient Icon */}
            <SpinningPatientIcon size={64} />
            
            <div style={{ flex: 1 }}>
              <h2 style={{
                fontSize: typography.fontSize.xl,
                fontWeight: 'bold',
                margin: 0,
                color: colors.text,
                marginBottom: spacing.xs
              }}>
                {patientData.name}
              </h2>
              <div style={{
                fontSize: typography.fontSize.md,
                color: colors.textDim,
                display: 'flex',
                gap: spacing.md
              }}>
                <span>Age: {patientData.age}</span>
                <span>•</span>
                <span>{patientData.gender}</span>
              </div>
            </div>
          </div>

          {/* Primary Case Info - Condensed */}
          <div style={{ marginBottom: spacing.lg }}>
            <h3 style={{
              fontSize: typography.fontSize.lg,
              fontWeight: 'bold',
              color: colors.highlight,
              margin: 0,
              marginBottom: spacing.sm,
              display: 'flex',
              alignItems: 'center',
              gap: spacing.xs
            }}>
              📋 Case Overview
            </h3>
            <div style={{
              backgroundColor: colors.backgroundAlt,
              border: `1px solid ${colors.border}`,
              borderRadius: spacing.xs,
              padding: spacing.md,
              fontSize: typography.fontSize.md,
              color: colors.text,
              lineHeight: '1.4'
            }}>
              <strong>{patientData.diagnosis}</strong>
              <br />
              <span style={{ color: colors.textDim, fontSize: typography.fontSize.sm }}>
                {patientData.lesionDetails}
              </span>
            </div>
          </div>

          {/* Key Notes - Simplified */}
          <div>
            <h3 style={{
              fontSize: typography.fontSize.lg,
              fontWeight: 'bold',
              color: colors.active,
              margin: 0,
              marginBottom: spacing.sm,
              display: 'flex',
              alignItems: 'center',
              gap: spacing.xs
            }}>
              💡 Key Notes
            </h3>
            <div style={{
              fontSize: typography.fontSize.sm,
              color: colors.textDim,
              lineHeight: '1.5'
            }}>
              {patientData.additionalInfo.slice(0, 2).map((info, index) => (
                <div key={index} style={{ 
                  marginBottom: spacing.xs,
                  padding: `${spacing.xs} ${spacing.sm}`,
                  backgroundColor: 'rgba(67, 215, 230, 0.1)',
                  border: `1px solid ${colors.insight}`,
                  borderRadius: spacing.xs,
                  fontSize: typography.fontSize.xs
                }}>
                  • {info}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{
        backgroundColor: colors.background,
        borderBottom: `2px solid ${colors.border}`,
        padding: spacing.md,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'relative',
        zIndex: 5
      }}>
        <div>
          <h2 style={{ 
            fontSize: typography.fontSize.lg, 
            fontWeight: 'bold',
            margin: 0
          }}>{currentActivity.title}</h2>
          <p style={{ 
            color: colors.textDim,
            margin: 0,
            fontSize: typography.fontSize.sm
          }}>with {getMentorName(currentActivity.mentor)} • Questions: {questionsCompleted + 1}/{questions.length || 1}</p>
        </div>
        
        <div style={{ display: 'flex', gap: spacing.sm, alignItems: 'center' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: spacing.xs,
            backgroundColor: 'rgba(67, 215, 230, 0.15)',
            padding: `${spacing.xs} ${spacing.sm}`,
            borderRadius: spacing.xs,
            border: `1px solid ${colors.insight}`
          }}>
            <span style={{ color: colors.insight }}>◆</span>
            <span>{insight}</span>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: spacing.xs,
            backgroundColor: 'rgba(255, 215, 0, 0.15)',
            padding: `${spacing.xs} ${spacing.sm}`,
            borderRadius: spacing.xs,
            border: `1px solid ${colors.highlight}`
          }}>
            <span style={{ color: colors.highlight }}>★</span>
            <span>{starPoints}</span>
          </div>
          {momentum > 0 && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: spacing.xs,
              backgroundColor: 'rgba(34, 197, 94, 0.15)',
              padding: `${spacing.xs} ${spacing.sm}`,
              borderRadius: spacing.xs,
              border: `1px solid #22c55e`
            }}>
              <span style={{ color: '#22c55e' }}>⚡</span>
              <span>{momentum}</span>
            </div>
          )}
        </div>
      </div>

      {/* Mentor Portrait Above Content - Only show when challenge is ready */}
      {animationPhase === 'challenge-ready' && currentActivity.mentor && (
        <div style={{
          position: 'absolute',
          top: '120px', // Move down more to avoid header
          left: '35%', // Shift left from center (50%)
          transform: 'translateX(-50%)',
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: spacing.md
        }}>
          <MentorPortrait 
            mentorId={currentActivity.mentor} 
            expression={mentorExpression}
            size={180} // Much larger
            useExpressions={true}
            isAnimating={true} // Add expression cycling and bobbing
          />
          <div style={{
            backgroundColor: 'rgba(0,0,0,0.9)',
            border: `3px solid ${colors.border}`,
            borderRadius: spacing.md,
            padding: `${spacing.md} ${spacing.lg}`,
            fontSize: typography.fontSize.lg,
            color: colors.text,
            fontWeight: 'bold',
            textAlign: 'center',
            boxShadow: `0 4px 0 ${colors.border}, 0 6px 12px rgba(0,0,0,0.3)`
          }}>
            {getMentorName(currentActivity.mentor)}
          </div>
        </div>
      )}

      {/* Main content area */}
      <div style={{ 
        display: 'flex', 
        flex: 1, 
        position: 'relative', 
        zIndex: 5,
        marginTop: animationPhase === 'challenge-ready' ? '280px' : '0' // Add more space for larger mentor portrait
      }}>
        {/* Message feed */}
        <div style={{ 
          flex: 1, 
          padding: spacing.lg, 
          display: 'flex', 
          flexDirection: 'column',
          overflowY: 'auto',
          gap: spacing.md,
          paddingRight: showPatientTransition && animationPhase !== 'patient-reveal' ? '520px' : spacing.lg
        }}>
          {/* Brief context message during transition */}
          {showBriefContext && animationPhase !== 'challenge-ready' && (
            <div style={{
              backgroundColor: '#3a3a4e',
              border: `2px solid ${colors.border}`,
              borderRadius: spacing.sm,
              padding: spacing.lg,
              display: 'flex',
              alignItems: 'center',
              gap: spacing.md,
              maxWidth: '80%',
              boxShadow: `0 4px 0 ${colors.border}`,
              animation: 'slideInUp 0.6s ease-out'
            }}>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: typography.fontSize.xs,
                  color: colors.textDim,
                  marginBottom: spacing.xs,
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing.xs
                }}>
                  <span>{getMentorName(currentActivity.mentor)}</span>
                  <span>•</span>
                  <span>Now</span>
                </div>
                <div style={{
                  fontSize: typography.fontSize.md,
                  color: colors.text,
                  lineHeight: '1.4'
                }}>
                  Let's review {patientData.name}'s case. I'll guide you through the key clinical decisions...
                </div>
              </div>
              
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: spacing.xs,
                background: colors.highlight,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: typography.fontSize.sm,
                color: colors.background,
                fontWeight: 'bold'
              }}>
                👨‍⚕️
              </div>
            </div>
          )}

          {/* Regular messages - only show when challenge is ready */}
          {animationPhase === 'challenge-ready' && messages.map((message) => (
            <div
              key={message.id}
              style={{
                backgroundColor: message.type === 'mentor' ? '#3a3a4e' : '#2a2a3e',
                border: `2px solid ${colors.border}`,
                borderRadius: spacing.sm,
                padding: spacing.lg,
                display: 'flex',
                alignItems: 'flex-start',
                gap: spacing.md,
                maxWidth: '80%',
                marginLeft: message.type === 'player' ? 'auto' : '0',
                boxShadow: `0 4px 0 ${colors.border}`,
                animation: 'slideInUp 0.3s ease-out'
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: typography.fontSize.md,
                  lineHeight: '1.4',
                  color: message.isCorrect === false ? colors.error : 
                        message.isCorrect === true ? colors.active : colors.text,
                  marginBottom: spacing.xs
                }}>
                  {message.type === 'mentor' && !message.feedback ? (
                    <TypewriterText
                      key={`twitter-message-${message.id}`}
                      text={message.content}
                      speed={30}
                      clickToSkip={true}
                      style={{
                        fontSize: typography.fontSize.md,
                        lineHeight: '1.4',
                        color: message.isCorrect === false ? colors.error : 
                              message.isCorrect === true ? colors.active : colors.text
                      }}
                    />
                  ) : (
                    message.content
                  )}
                </div>
                <div style={{
                  fontSize: typography.fontSize.xs,
                  color: colors.textDim,
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing.xs
                }}>
                  <span>{message.type === 'mentor' ? getMentorName(currentActivity.mentor) : 'YOU'}</span>
                  <span>•</span>
                  <span>{message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  {message.isCorrect !== undefined && (
                    <>
                      <span>•</span>
                      <span style={{ color: message.isCorrect ? colors.active : colors.error }}>
                        {message.isCorrect ? '✓ Correct' : '✗ Incorrect'}
                      </span>
                    </>
                  )}
                </div>
              </div>
              
              {/* Portrait */}
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: spacing.xs,
                overflow: 'hidden',
                background: colors.backgroundAlt,
                border: `1px solid ${colors.border}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {message.type === 'mentor' && currentActivity.mentor ? (
                  <SpriteImage
                    src={SPRITE_SHEETS.chibiPortraits}
                    coordinates={getPortraitCoordinates(mentorToCharacterId[currentActivity.mentor] as any, 'chibi')}
                    alt={getMentorName(currentActivity.mentor)}
                    scale={2}
                    pixelated={true}
                  />
                ) : (
                  <div style={{
                    backgroundColor: colors.highlight,
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: typography.fontSize.sm,
                    color: colors.background,
                    fontWeight: 'bold'
                  }}>
                    YOU
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {showTypingIndicator && (
            <div style={{
              backgroundColor: '#3a3a4e',
              border: `2px solid ${colors.border}`,
              borderRadius: spacing.sm,
              padding: spacing.lg,
              display: 'flex',
              alignItems: 'center',
              gap: spacing.md,
              maxWidth: '80%',
              opacity: 0.7
            }}>
              <div style={{ flex: 1, color: colors.textDim }}>
                {getMentorName(currentActivity.mentor)} is typing...
              </div>
              <div style={{ width: '64px', height: '64px' }}>
                <div style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  animation: 'pulse 1s infinite'
                }}>
                  ⏳
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div style={{
          width: '300px',
          backgroundColor: colors.background,
          borderLeft: `2px solid ${colors.border}`,
          padding: spacing.md,
          display: 'flex',
          flexDirection: 'column',
          gap: spacing.md,
          position: 'relative',
          zIndex: 5
        }}>
          <h3 style={{
            fontSize: typography.fontSize.md,
            fontWeight: 'bold',
            margin: 0,
            borderBottom: `1px dotted ${colors.border}`,
            paddingBottom: spacing.xs
          }}>
            Abilities
          </h3>
          
          {canBoast() && momentum >= 3 && (
            <BoastButton onActivate={handleBoastActivate} />
          )}
          
          <button 
            onClick={handleTangent}
            disabled={insight < 25}
            style={{
              padding: `${spacing.xs} ${spacing.sm}`,
              borderRadius: spacing.xs,
              fontSize: typography.fontSize.xs,
              backgroundColor: insight >= 25 ? 'rgba(45, 156, 219, 0.3)' : 'rgba(100, 100, 100, 0.3)',
              color: insight >= 25 ? colors.text : colors.inactive,
              border: `1px solid ${colors.border}`,
              fontFamily: typography.fontFamily.pixel,
              cursor: insight >= 25 ? 'pointer' : 'not-allowed'
            }}
          >
            <span style={{ color: colors.insight }}>⟲</span> Tangent (25 ◆)
          </button>
        </div>
      </div>

      {/* Options/Response area */}
      {animationPhase === 'challenge-ready' && !showFeedback && mcQuestion && (
        <div style={{
          backgroundColor: colors.background,
          borderTop: `2px solid ${colors.border}`,
          padding: spacing.lg,
          minHeight: '150px',
          position: 'relative',
          zIndex: 5
        }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: spacing.sm,
            maxWidth: '600px',
            margin: '0 auto'
          }}>
            <p style={{ 
              color: colors.textDim, 
              margin: 0, 
              fontSize: typography.fontSize.sm,
              textAlign: 'center'
            }}>
              Choose your response:
            </p>
            {mcQuestion.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleOptionSelect(index)}
                disabled={showFeedback}
                style={{
                  backgroundColor: showFeedback && selectedOption === index ? colors.highlight : colors.backgroundAlt,
                  border: `2px solid ${showFeedback && selectedOption === index ? colors.active : colors.border}`,
                  borderRadius: spacing.xs,
                  padding: `${spacing.md} ${spacing.lg}`,
                  color: showFeedback && selectedOption === index ? colors.background : colors.text,
                  fontFamily: typography.fontFamily.pixel,
                  fontSize: typography.fontSize.sm,
                  textAlign: 'left',
                  cursor: showFeedback ? 'not-allowed' : 'pointer',
                  transition: `all ${animation.duration.fast} ${animation.easing.pixel}`,
                  opacity: showFeedback && selectedOption !== index ? 0.4 : 1,
                  minHeight: '50px', // Ensure buttons are visible
                  transform: showFeedback && selectedOption === index ? 'scale(0.98)' : 'scale(1)',
                  fontWeight: showFeedback && selectedOption === index ? 'bold' : 'normal'
                }}
              >
                {showFeedback && selectedOption === index && '✓ '}{option.text}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Continue button */}
      {animationPhase === 'challenge-ready' && showFeedback && (
        <div style={{
          backgroundColor: colors.background,
          borderTop: `2px solid ${colors.border}`,
          padding: spacing.lg,
          display: 'flex',
          justifyContent: 'center',
          position: 'relative',
          zIndex: 5
        }}>
          <button 
            onClick={handleContinue}
            style={{
              padding: `${spacing.sm} ${spacing.lg}`,
              backgroundColor: colors.highlight,
              color: colors.text,
              border: `2px solid ${colors.border}`,
              borderRadius: spacing.xs,
              cursor: 'pointer',
              fontFamily: typography.fontFamily.pixel,
              fontWeight: 'bold',
              fontSize: typography.fontSize.md
            }}
          >
            {currentQuestionIndex < questions.length - 1 ? 'Next Question →' : 'Complete Activity →'}
          </button>
        </div>
      )}

      <style jsx global>{`
        @keyframes slideInUp {
          from { 
            transform: translateY(20px); 
            opacity: 0; 
          }
          to { 
            transform: translateY(0); 
            opacity: 1; 
          }
        }
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  );
} 