'use client';

import React, { useEffect, useState } from 'react';
import { useGameStore } from '@/app/store/gameStore';
import { useActivityStore } from '@/app/store/activityStore';
import { centralEventBus } from '@/app/core/events/CentralEventBus';
import { ActivityDifficulty, GameEventType, KnowledgeDomain, MentorId, DomainColors } from '@/app/types';
import { TimeManager } from '@/app/core/time/TimeManager';
import { useKnowledgeStore } from '@/app/store/knowledgeStore';
import pixelTheme, { colors, typography, animation, components, mixins, borders, shadows, spacing } from '@/app/styles/pixelTheme';

// Helper to render domain badges
const DomainBadge = ({ domain }: { domain: KnowledgeDomain }) => {
  const color = DomainColors[domain] || '#888888';
  
  return (
    <span style={{
      backgroundColor: color,
      color: 'white',
      fontSize: typography.fontSize.xs,
      padding: `${spacing.xxs} ${spacing.xs}`,
      borderRadius: '16px',
      display: 'inline-block'
    }}>
      {domain.replace('_', ' ')}
    </span>
  );
};

// Helper to render difficulty stars
const DifficultyStars = ({ difficulty }: { difficulty: ActivityDifficulty }) => {
  switch (difficulty) {
    case ActivityDifficulty.EASY:
      return <span style={{ color: colors.starGlow }}>★☆☆</span>;
    case ActivityDifficulty.MEDIUM:
      return <span style={{ color: colors.starGlow }}>★★☆</span>;
    case ActivityDifficulty.HARD:
      return <span style={{ color: colors.starGlow }}>★★★</span>;
    default:
      return <span style={{ color: colors.inactive }}>☆☆☆</span>;
  }
};

// Sample challenge data for different activities
const SAMPLE_CHALLENGES: Record<string, any> = {
  // Morning rounds challenge
  morning_rounds: {
    questions: [
      {
        title: "EASY Challenge - Question 1",
        content: "This is the first EASY question about radiation therapy. Pick the CORRECT answer to gain momentum and insight.",
        options: [
          {
            text: "CORRECT ANSWER - Choose this for success",
            correct: true,
            feedback: "You chose the CORRECT answer! You gain 1 Momentum and 10 Insight."
          },
          {
            text: "WRONG ANSWER - This is incorrect",
            correct: false,
            feedback: "You chose an INCORRECT answer. You lose any momentum you had."
          },
          {
            text: "WRONG ANSWER - Also incorrect",
            correct: false,
            feedback: "You chose an INCORRECT answer. You lose any momentum you had."
          }
        ],
      },
      {
        title: "EASY Challenge - Question 2",
        content: "This is the second EASY question about radiation therapy. Select the CORRECT answer to continue your progress.",
        options: [
          {
            text: "WRONG ANSWER - Not this one",
            correct: false,
            feedback: "Not correct. Keep trying!"
          },
          {
            text: "CORRECT ANSWER - This is the right choice",
            correct: true,
            feedback: "Excellent! You gain additional insight and momentum."
          },
          {
            text: "WRONG ANSWER - Also incorrect",
            correct: false,
            feedback: "That's not right. Better luck on the next question!"
          }
        ],
      }
    ],
    concepts: ["IMRT_fundamentals", "head_neck_treatment"],
    difficulty: ActivityDifficulty.EASY
  },
  
  // Morning rounds challenge (Tangent alternative)
  morning_rounds_tangent: {
    questions: [
      {
        title: "TANGENT Challenge - Question 1",
        content: "This is a TANGENT question (costs 25 Insight). It's still EASY difficulty but gives different concepts.",
        options: [
          {
            text: "CORRECT ANSWER - Pick this one",
            correct: true,
            feedback: "CORRECT! You spent 25 Insight but gained different concepts."
          },
          {
            text: "WRONG ANSWER - Don't pick this",
            correct: false,
            feedback: "INCORRECT! You spent 25 Insight but got no rewards."
          },
          {
            text: "WRONG ANSWER - Also don't pick this",
            correct: false,
            feedback: "INCORRECT! You spent 25 Insight but got no rewards."
          }
        ],
      },
      {
        title: "TANGENT Challenge - Question 2",
        content: "Here's a follow-up question on a different treatment approach.",
        options: [
          {
            text: "WRONG ANSWER - Not this one",
            correct: false,
            feedback: "That's not correct. Consider the treatment constraints more carefully."
          },
          {
            text: "WRONG ANSWER - Try again",
            correct: false,
            feedback: "Not quite right. Think about organ sparing techniques."
          },
          {
            text: "CORRECT ANSWER - This is the right approach",
            correct: true,
            feedback: "Excellent! You've identified the proper method for this scenario."
          }
        ],
      }
    ],
    concepts: ["treatment_planning_constraints", "critical_organ_sparing"],
    difficulty: ActivityDifficulty.EASY
  },
  
  // Morning rounds challenge (Boast version)
  morning_rounds_boast: {
    questions: [
      {
        title: "BOAST Challenge - Question 1",
        content: "This is a HARD (BOAST) question. It costs all 3 momentum but gives 1.5x rewards if correct. You have a higher chance of SP.",
        options: [
          {
            text: "CORRECT ANSWER - Option 1",
            correct: true,
            feedback: "CORRECT! You move to the next challenging question."
          },
          {
            text: "CORRECT ANSWER - Option 2",
            correct: true,
            feedback: "CORRECT! You move to the next challenging question."
          },
          {
            text: "WRONG ANSWER - Don't pick this",
            correct: false,
            feedback: "INCORRECT! This approach wouldn't achieve the desired outcome."
          }
        ],
      },
      {
        title: "BOAST Challenge - Question 2",
        content: "This advanced question tests your understanding of adaptive radiotherapy protocols.",
        options: [
          {
            text: "WRONG ANSWER - This method is insufficient",
            correct: false,
            feedback: "Incorrect. This method doesn't account for anatomical changes adequately."
          },
          {
            text: "CORRECT ANSWER - This adaptive approach is optimal",
            correct: true,
            feedback: "CORRECT! You get 1.5x Insight (45 instead of 30) and have a 20% chance of bonus SP."
          },
          {
            text: "WRONG ANSWER - This could lead to treatment errors",
            correct: false,
            feedback: "Incorrect. This approach could introduce systematic errors."
          }
        ],
      }
    ],
    concepts: ["IMRT_fundamentals", "head_neck_treatment", "adaptive_radiotherapy"],
    difficulty: ActivityDifficulty.HARD
  },
  
  // QA protocol review challenge
  qa_protocol_review: {
    questions: [
      {
        title: "MEDIUM Challenge - Question 1",
        content: "This is a MEDIUM difficulty question about QA protocols. It's worth more Insight (20) than an EASY question.",
        options: [
          {
            text: "WRONG ANSWER - Incorrect option",
            correct: false,
            feedback: "You chose INCORRECTLY. You lose momentum."
          },
          {
            text: "CORRECT ANSWER - This is the right choice",
            correct: true,
            feedback: "CORRECT! You gain 1 Momentum and 20 Insight."
          },
          {
            text: "WRONG ANSWER - Also incorrect",
            correct: false,
            feedback: "INCORRECT. You lose momentum."
          }
        ],
      },
      {
        title: "MEDIUM Challenge - Question 2",
        content: "Now, consider this scenario related to isocenter verification techniques.",
        options: [
          {
            text: "CORRECT ANSWER - This verification method is optimal",
            correct: true,
            feedback: "Exactly right! You've selected the appropriate QA technique."
          },
          {
            text: "WRONG ANSWER - This method has limitations",
            correct: false,
            feedback: "Not the best choice. This method wouldn't provide sufficient accuracy."
          },
          {
            text: "WRONG ANSWER - This would be time-consuming",
            correct: false,
            feedback: "Incorrect. This approach would be inefficient in clinical settings."
          }
        ],
      }
    ],
    concepts: ["qa_protocols", "isocenter_verification"],
    difficulty: ActivityDifficulty.MEDIUM
  },
  
  // QA protocol review (Tangent alternative)
  qa_protocol_review_tangent: {
    questions: [
      {
        title: "TANGENT Medium - Question 1",
        content: "This is a TANGENT question at MEDIUM difficulty. It costs 25 Insight to see this question.",
        options: [
          {
            text: "CORRECT ANSWER - Pick this one",
            correct: true,
            feedback: "CORRECT! You gain 1 Momentum and 20 Insight, plus new concepts."
          },
          {
            text: "WRONG ANSWER - Don't pick this",
            correct: false,
            feedback: "INCORRECT! You spent 25 Insight but gained nothing."
          },
          {
            text: "WRONG ANSWER - Also wrong",
            correct: false,
            feedback: "INCORRECT! You spent 25 Insight but gained nothing."
          }
        ],
      },
      {
        title: "TANGENT Medium - Question 2",
        content: "Let's explore specialized QA equipment for SBRT treatments.",
        options: [
          {
            text: "WRONG ANSWER - This equipment is outdated",
            correct: false,
            feedback: "No, this equipment is still relevant but not optimal for this case."
          },
          {
            text: "CORRECT ANSWER - This specialized phantom is ideal",
            correct: true,
            feedback: "Correct! This specialized equipment provides the necessary precision."
          },
          {
            text: "WRONG ANSWER - This would be inappropriate",
            correct: false,
            feedback: "Incorrect choice. This equipment doesn't meet protocol requirements."
          }
        ],
      }
    ],
    concepts: ["qa_equipment", "isocenter_verification"],
    difficulty: ActivityDifficulty.MEDIUM
  },
  
  // QA protocol review (Boast version)
  qa_protocol_review_boast: {
    questions: [
      {
        title: "BOAST Medium→Hard - Question 1",
        content: "This is a BOAST question, raising difficulty to HARD. It costs all momentum but gives 1.5x rewards.",
        options: [
          {
            text: "CORRECT ANSWER - Option 1",
            correct: true,
            feedback: "CORRECT! Your expertise shows as you progress to the next question."
          },
          {
            text: "CORRECT ANSWER - Option 2",
            correct: true,
            feedback: "CORRECT! Your approach is valid. Let's move to an even harder question."
          },
          {
            text: "WRONG ANSWER - Don't pick this",
            correct: false,
            feedback: "INCORRECT! This approach doesn't meet advanced QA standards."
          }
        ],
      },
      {
        title: "BOAST Medium→Hard - Question 2",
        content: "This challenging question addresses small field dosimetry in SBRT treatments.",
        options: [
          {
            text: "WRONG ANSWER - This detector would be inappropriate",
            correct: false,
            feedback: "Incorrect. This detector has significant volume averaging effects."
          },
          {
            text: "CORRECT ANSWER - This microdosimetry approach is ideal",
            correct: true,
            feedback: "CORRECT! You get 1.5x Insight (45) and have a 20% chance of bonus SP."
          },
          {
            text: "WRONG ANSWER - This method is outdated",
            correct: false,
            feedback: "INCORRECT! While traditional, this method lacks precision for SBRT fields."
          }
        ],
      }
    ],
    concepts: ["qa_protocols", "SBRT_quality_assurance", "small_field_dosimetry"],
    difficulty: ActivityDifficulty.HARD
  },
  
  // Lunch quotes for each mentor
  lunch_garcia: {
    type: "lunch_quote",
    quote: "You know what's wild? Every treatment plan is like a patient's fingerprint. Totally unique! I once had this case where... actually, that story's probably too long for lunch. But remind me later!",
    mentor: MentorId.GARCIA,
    feedback: "You enjoyed lunch with Dr. Garcia. Between the dad jokes and random radiation trivia, you somehow learned something useful."
  },
  
  lunch_kapoor: {
    type: "lunch_quote",
    quote: "So I'm staring at these equations on the board, right? And this first-year walks in and goes 'Is this the cafeteria?' I said 'No, but we're cooking up some serious dose calculations in here!' ...Nobody laughed. Tough crowd.",
    mentor: MentorId.KAPOOR,
    feedback: "Dr. Kapoor's awkward attempt at humor somehow made physics seem more approachable. Plus, their lunch recommendations were surprisingly good."
  },
  
  lunch_jesse: {
    type: "lunch_quote",
    quote: "Listen, these PhDs can talk theory all day, but when the machine goes 'beep-boop-ERROR' at 4:55 on a Friday, guess who they're calling? *points thumbs at self* This guy! And no, turning it off and on again doesn't always work, despite what IT thinks.",
    mentor: MentorId.JESSE,
    feedback: "Jesse's practical stories had you laughing so hard you almost choked on your sandwich. You're definitely going to remember that maintenance checklist now."
  },
  
  lunch_quinn: {
    type: "lunch_quote",
    quote: "You ever notice how the quality assurance team is basically the hospital's paranoid friend? 'Are you SURE that's calibrated? Did you double-check? Triple-check? What about Mercury being in retrograde?' But hey, nobody dies from paranoia, so...*shrugs*",
    mentor: MentorId.QUINN,
    feedback: "Turns out Dr. Quinn has a surprisingly dark sense of humor hiding behind all that precision. Their cafeteria tray was organized with surgical precision, though."
  },
  
  // Default challenge for other activities
  default: {
    title: "Default Challenge",
    content: "This is a fallback question for activities without specific challenges.",
    options: [
      {
        text: "CORRECT ANSWER - Pick this for success",
        correct: true,
        feedback: "CORRECT! You succeed with this activity."
      },
      {
        text: "WRONG ANSWER - Don't pick this",
        correct: false,
        feedback: "INCORRECT! You fail this activity."
      },
      {
        text: "WRONG ANSWER - Also don't pick this",
        correct: false,
        feedback: "INCORRECT! You fail this activity."
      }
    ],
    concepts: ["general_knowledge"],
    difficulty: ActivityDifficulty.EASY
  }
};

export default function ActivityEngagement() {
  const { currentTime, resources, advanceTime, addMomentum, resetMomentum, addInsight, addStarPoints, spendInsight } = useGameStore();
  const { currentActivity, completeActivity } = useActivityStore();
  
  const [challenge, setChallenge] = useState<any>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [conceptsDiscovered, setConceptsDiscovered] = useState<string[]>([]);
  
  // Track if special abilities were used
  const [usedTangent, setUsedTangent] = useState(false);
  const [usedBoast, setUsedBoast] = useState(false);
  
  const [showQuote, setShowQuote] = useState(false);
  
  // Add state for tracking multiple questions
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [allAnswers, setAllAnswers] = useState<boolean[]>([]);
  
  // Initialize challenge data when activity changes
  useEffect(() => {
    if (currentActivity) {
      // Get challenge based on activity ID or use default
      const activityChallenge = 
        SAMPLE_CHALLENGES[currentActivity.id] || 
        SAMPLE_CHALLENGES.default;
      
      setChallenge(activityChallenge);
      setSelectedOption(null);
      setShowFeedback(false);
      setConceptsDiscovered([]);
      setUsedTangent(false);
      setUsedBoast(false);
      setShowQuote(activityChallenge.type === "lunch_quote");
      
      // Reset question tracking
      setCurrentQuestionIndex(0);
      setAllAnswers([]);
    }
  }, [currentActivity]);
  
  // No activity to show
  if (!currentActivity || !challenge) {
    return null;
  }
  
  // Get current question for challenges with multiple questions
  const getCurrentQuestion = () => {
    if (challenge.questions && challenge.questions.length > 0) {
      return challenge.questions[currentQuestionIndex];
    }
    // For backward compatibility with single-question challenges
    return challenge;
  };
  
  const currentQuestion = getCurrentQuestion();
  const hasMultipleQuestions = challenge.questions && challenge.questions.length > 1;
  const isLastQuestion = !hasMultipleQuestions || currentQuestionIndex === challenge.questions.length - 1;
  
  // Handle option selection
  const handleOptionSelect = (optionIndex: number) => {
    // Reset momentum for all answers to fix momentum persistence issue
    resetMomentum();
    
    setSelectedOption(optionIndex);
    setShowFeedback(true);
    
    const option = currentQuestion.options[optionIndex];
    const success = option.correct;
    
    // Track answers for multi-question challenges
    if (hasMultipleQuestions) {
      setAllAnswers([...allAnswers, success]);
    }
    
    // Update resources based on success
    if (success) {
      // Add momentum for correct answers
      addMomentum(1);
      
      // Add insight based on difficulty
      let insightGain = 0;
      if (challenge.difficulty === ActivityDifficulty.EASY) {
        insightGain = 10;
      } else if (challenge.difficulty === ActivityDifficulty.MEDIUM) {
        insightGain = 20;
      } else if (challenge.difficulty === ActivityDifficulty.HARD) {
        insightGain = 30;
      }
      
      // Boast gives 1.5x insight for success
      if (usedBoast) {
        insightGain = Math.floor(insightGain * 1.5);
      }
      
      addInsight(insightGain);
      
      // For single question challenges or the last question of multi-question challenges
      if (!hasMultipleQuestions || isLastQuestion) {
        // Discover concepts
        if (challenge.concepts && challenge.concepts.length > 0) {
          setConceptsDiscovered(challenge.concepts);
          
          // Import knowledge store here
          const { discoverConcept } = useKnowledgeStore.getState();
          
          // Use the knowledge store to discover concepts
          challenge.concepts.forEach((conceptId: string) => {
            // Call the knowledge store method directly
            discoverConcept(conceptId, 'activity_engagement');
            
            // Event is now dispatched by the knowledge store itself
          });
        }
        
        // Random chance to earn SP directly (10%, 20% with Boast)
        const spChance = usedBoast ? 0.2 : 0.1;
        if (Math.random() < spChance) {
          const spGained = challenge.difficulty === ActivityDifficulty.HARD ? 2 : 1;
          addStarPoints(spGained);
          
          centralEventBus.dispatch(
            GameEventType.SP_GAINED,
            { amount: spGained, source: 'activity_bonus' },
            'ActivityEngagement.handleOptionSelect'
          );
        }
      }
    }
  };

  // Add a new handler for continuing after feedback
  const handleContinue = () => {
    setShowFeedback(false);
    
    // For multi-question challenges that aren't on the last question
    if (hasMultipleQuestions && !isLastQuestion) {
      // Move to next question
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedOption(null);
      return;
    }
    
    // Handle lunch quotes differently from challenges with options
    let success = true; // Lunch is always a "success"
    
    if (!showQuote && selectedOption !== null) {
      // For regular challenges, get success from the selected option
      if (hasMultipleQuestions) {
        // For multi-question challenges, success is based on majority correct answers
        const correctAnswers = allAnswers.filter(answer => answer).length;
        success = correctAnswers > allAnswers.length / 2;
      } else {
        success = currentQuestion.options[selectedOption].correct;
      }
    }
    
    // Complete the activity
    completeActivity(success);
    
    centralEventBus.dispatch(
      success ? GameEventType.ACTIVITY_COMPLETED : GameEventType.ACTIVITY_FAILED,
      { activityId: currentActivity.id },
      'ActivityEngagement.handleContinue'
    );
  };
  
  // Handle Tangent ability usage
  const handleTangent = () => {
    if (resources.insight >= 25) {
      // Spend insight
      if (spendInsight(25)) {
        // Find the tangent version of the current challenge
        const tangentChallengeId = `${currentActivity.id}_tangent`;
        const tangentChallenge = SAMPLE_CHALLENGES[tangentChallengeId] || 
                                SAMPLE_CHALLENGES.default;
        
        // Set the new challenge
        setChallenge(tangentChallenge);
        setSelectedOption(null);
        setShowFeedback(false);
        setConceptsDiscovered([]);
        setUsedTangent(true);
        
        // Dispatch event
        centralEventBus.dispatch(
          GameEventType.TANGENT_USED,
          { activityId: currentActivity.id },
          'ActivityEngagement.handleTangent'
        );
      }
    }
  };
  
  // Handle Boast ability usage
  const handleBoast = () => {
    if (resources.momentum >= 3) {
      // Reset momentum (used up by the Boast)
      resetMomentum();
      
      // Find the boast version of the current challenge
      const boastChallengeId = `${currentActivity.id}_boast`;
      const boastChallenge = SAMPLE_CHALLENGES[boastChallengeId] || challenge;
      
      // Ensure the boast challenge is hard difficulty
      boastChallenge.difficulty = ActivityDifficulty.HARD;
      
      // Set the new challenge
      setChallenge(boastChallenge);
      setSelectedOption(null);
      setShowFeedback(false);
      setConceptsDiscovered([]);
      setUsedBoast(true);
      
      // Dispatch event
      centralEventBus.dispatch(
        GameEventType.BOAST_USED,
        { activityId: currentActivity.id },
        'ActivityEngagement.handleBoast'
      );
    }
  };
  
  // Add a new handler for continuing after a lunch quote
  const handleQuoteContinue = () => {
    // Show feedback for the quote
    setShowFeedback(true);
    
    // Add relationship benefits here in the future
    // For now, just complete the activity successfully
    
    centralEventBus.dispatch(
      GameEventType.ACTIVITY_COMPLETED,
      { activityId: currentActivity.id },
      'ActivityEngagement.handleQuoteContinue'
    );
  };
  
  // Format the current time
  const formattedTime = TimeManager.formatTime(currentTime);
  
  // Special abilities availability
  const canUseTangent = resources.insight >= 25 && !usedTangent && !usedBoast && !showFeedback;
  const canUseBoast = resources.momentum >= 3 && !usedBoast && !usedTangent && !showFeedback;
  
  return (
    <div style={{
      backgroundColor: colors.background,
      color: colors.text,
      padding: spacing.md,
      borderRadius: spacing.sm,
      maxWidth: '600px',
      margin: '0 auto',
      fontFamily: typography.fontFamily.pixel,
      boxShadow: `0 4px 0 ${colors.border}, 0 0 0 4px ${colors.border}, 0 0 0 4px ${colors.border}, 4px 0 0 ${colors.border}`,
      imageRendering: 'pixelated'
    }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: spacing.md 
      }}>
        <div>
          <h2 style={{ 
            fontSize: typography.fontSize.xl, 
            fontWeight: 'bold',
            textShadow: typography.textShadow.pixel
          }}>{formattedTime}</h2>
          <p style={{ color: colors.textDim }}>Activity in progress</p>
        </div>
        <div style={{ display: 'flex', gap: spacing.md }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ color: colors.momentum }}>⚡</span>
            <span>{resources.momentum} / 3</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ color: colors.insight }}>◆</span>
            <span>{resources.insight}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ color: colors.highlight }}>★</span>
            <span>{resources.starPoints}</span>
          </div>
        </div>
      </div>
      
      <div style={{
        backgroundColor: colors.backgroundAlt,
        padding: spacing.md,
        borderRadius: spacing.sm,
        marginBottom: spacing.md,
        border: borders.medium
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          marginBottom: spacing.xs 
        }}>
          <h3 style={{ 
            fontSize: typography.fontSize.lg, 
            fontWeight: 'bold',
            textShadow: typography.textShadow.pixel
          }}>{currentActivity.title}</h3>
          <div style={{ display: 'flex', gap: spacing.xs }}>
            {currentActivity.domains.map((domain) => (
              <DomainBadge key={domain} domain={domain} />
            ))}
          </div>
        </div>
        <p style={{ color: colors.textDim, marginBottom: spacing.md }}>{currentActivity.description}</p>
        
        {/* Display lunch quote if it's a lunch activity */}
        {showQuote ? (
          <div style={{
            backgroundColor: colors.background,
            padding: spacing.md,
            borderRadius: spacing.sm,
            marginBottom: spacing.md,
            border: borders.thin
          }}>
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              marginBottom: spacing.md 
            }}>
              {/* Show mentor icon/avatar here if available */}
              <div style={{
                width: spacing.xl,
                height: spacing.xl,
                borderRadius: '50%',
                backgroundColor: colors.highlight,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: spacing.xs,
                fontSize: typography.fontSize.xl
              }}>
                {challenge.mentor === MentorId.GARCIA ? 'G' : 
                 challenge.mentor === MentorId.KAPOOR ? 'K' : 
                 challenge.mentor === MentorId.JESSE ? 'J' : 'Q'}
              </div>
              <h4 style={{ 
                fontSize: typography.fontSize.md, 
                fontWeight: 'semibold' 
              }}>{
                challenge.mentor === MentorId.GARCIA ? 'Dr. Garcia' : 
                challenge.mentor === MentorId.KAPOOR ? 'Dr. Kapoor' : 
                challenge.mentor === MentorId.JESSE ? 'Jesse' : 'Dr. Quinn'
              }</h4>
            </div>
            
            <blockquote style={{
              fontStyle: 'italic',
              color: colors.textDim,
              borderLeft: `4px solid ${colors.highlight}`,
              paddingLeft: spacing.md,
              paddingTop: spacing.xs,
              paddingBottom: spacing.xs,
              marginBottom: spacing.md
            }}>
              "{challenge.quote}"
            </blockquote>
            
            {showFeedback ? (
              <div style={{
                marginTop: spacing.md,
                padding: spacing.sm,
                borderRadius: spacing.sm,
                backgroundColor: colors.backgroundAlt
              }}>
                <p style={{ color: colors.active }}>{challenge.feedback}</p>
                
                {/* Continue button */}
                <button 
                  onClick={handleContinue}
                  style={{
                    marginTop: spacing.sm,
                    padding: `${spacing.xs} ${spacing.md}`,
                    backgroundColor: colors.highlight,
                    color: colors.text,
                    border: borders.medium,
                    borderRadius: spacing.xs,
                    cursor: 'pointer',
                    fontFamily: typography.fontFamily.pixel,
                    textShadow: typography.textShadow.pixel
                  }}
                >
                  Continue
                </button>
              </div>
            ) : (
              <button 
                onClick={handleQuoteContinue}
                style={{
                  marginTop: spacing.sm,
                  padding: `${spacing.xs} ${spacing.md}`,
                  backgroundColor: colors.highlight,
                  color: colors.text,
                  border: borders.medium,
                  borderRadius: spacing.xs,
                  cursor: 'pointer',
                  width: '100%',
                  fontFamily: typography.fontFamily.pixel,
                  textShadow: typography.textShadow.pixel
                }}
              >
                Continue Conversation
              </button>
            )}
          </div>
        ) : (
          <div style={{
            backgroundColor: colors.background,
            padding: spacing.md,
            borderRadius: spacing.sm,
            marginBottom: spacing.md,
            border: borders.thin
          }}>
            {hasMultipleQuestions && (
              <div style={{
                marginBottom: spacing.sm,
                fontSize: typography.fontSize.sm,
                color: colors.textDim
              }}>
                Question {currentQuestionIndex + 1} of {challenge.questions.length}
              </div>
            )}
            
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              marginBottom: spacing.xs 
            }}>
              <h4 style={{ 
                fontSize: typography.fontSize.md, 
                fontWeight: 'semibold',
                textShadow: typography.textShadow.pixel
              }}>{currentQuestion.title}</h4>
              {challenge.difficulty === ActivityDifficulty.HARD && (
                <span style={{
                  backgroundColor: colors.starGlow,
                  color: colors.text,
                  fontSize: typography.fontSize.xs,
                  padding: `${spacing.xxs} ${spacing.xs}`,
                  borderRadius: '16px'
                }}>
                  <DifficultyStars difficulty={ActivityDifficulty.HARD} /> Hard
                </span>
              )}
            </div>
            <p style={{ 
              color: colors.textDim, 
              marginBottom: spacing.md 
            }}>{currentQuestion.content}</p>
            
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: spacing.sm, 
              marginTop: spacing.md 
            }}>
              {currentQuestion.options.map((option: any, index: number) => {
                const isSelected = selectedOption === index;
                const isCorrect = option.correct;
                
                return (
                  <button
                    key={index}
                    style={{
                      padding: spacing.md,
                      borderRadius: spacing.sm,
                      width: '100%',
                      textAlign: 'left',
                      transition: `all ${animation.duration.fast} ${animation.easing.pixel}`,
                      backgroundColor: isSelected 
                        ? (isCorrect ? colors.active : colors.error) 
                        : colors.backgroundAlt,
                      color: colors.text,
                      border: borders.medium,
                      cursor: selectedOption !== null ? 'default' : 'pointer',
                      fontFamily: typography.fontFamily.pixel
                    }}
                    onClick={() => selectedOption === null && handleOptionSelect(index)}
                    disabled={selectedOption !== null}
                  >
                    {option.text}
                  </button>
                );
              })}
            </div>
            
            {showFeedback && selectedOption !== null && (
              <div style={{
                marginTop: spacing.md,
                padding: spacing.sm,
                borderRadius: spacing.sm,
                backgroundColor: colors.backgroundAlt
              }}>
                <p style={{ 
                  color: currentQuestion.options[selectedOption].correct 
                    ? colors.active 
                    : colors.error
                }}>
                  {currentQuestion.options[selectedOption].feedback}
                </p>
                
                {/* Only show concepts discovered on the last question */}
                {(!hasMultipleQuestions || isLastQuestion) && conceptsDiscovered.length > 0 && (
                  <div style={{ marginTop: spacing.xs }}>
                    <p style={{ color: colors.starGlow }}>New concepts discovered:</p>
                    <div style={{ 
                      display: 'flex', 
                      gap: spacing.xs, 
                      marginTop: spacing.xxs, 
                      flexWrap: 'wrap' 
                    }}>
                      {conceptsDiscovered.map((concept) => (
                        <span key={concept} style={{
                          backgroundColor: colors.backgroundAlt,
                          padding: `${spacing.xxs} ${spacing.xs}`,
                          borderRadius: spacing.sm,
                          fontSize: typography.fontSize.sm
                        }}>
                          {concept.replace(/_/g, ' ')}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Update continue button text for multi-question challenges */}
                <button 
                  onClick={handleContinue}
                  style={{
                    marginTop: spacing.sm,
                    padding: `${spacing.xs} ${spacing.md}`,
                    backgroundColor: colors.highlight,
                    color: colors.text,
                    border: borders.medium,
                    borderRadius: spacing.xs,
                    cursor: 'pointer',
                    fontFamily: typography.fontFamily.pixel,
                    textShadow: typography.textShadow.pixel
                  }}
                >
                  {hasMultipleQuestions && !isLastQuestion ? "Next Question" : "Continue"}
                </button>
              </div>
            )}
          </div>
        )}
        
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginTop: spacing.md 
        }}>
          <div style={{ display: 'flex', gap: spacing.sm }}>
            {/* Only show special abilities if not a lunch activity */}
            {!showQuote && (
              <>
                <button
                  style={{
                    padding: `${spacing.xxs} ${spacing.sm}`,
                    borderRadius: spacing.xs,
                    fontSize: typography.fontSize.sm,
                    backgroundColor: canUseTangent ? colors.insight : colors.inactive,
                    color: colors.text,
                    opacity: canUseTangent ? 1 : 0.5,
                    cursor: canUseTangent ? 'pointer' : 'not-allowed',
                    border: borders.thin,
                    fontFamily: typography.fontFamily.pixel
                  }}
                  disabled={!canUseTangent}
                  onClick={handleTangent}
                  title={canUseTangent ? "Change the current question (25 Insight)" : "Not enough Insight or already used"}
                >
                  Tangent (25 ◆)
                </button>
                
                <button
                  style={{
                    padding: `${spacing.xxs} ${spacing.sm}`,
                    borderRadius: spacing.xs,
                    fontSize: typography.fontSize.sm,
                    backgroundColor: canUseBoast ? colors.momentum : colors.inactive,
                    color: colors.text,
                    opacity: canUseBoast ? 1 : 0.5,
                    cursor: canUseBoast ? 'pointer' : 'not-allowed',
                    border: borders.thin,
                    fontFamily: typography.fontFamily.pixel
                  }}
                  disabled={!canUseBoast}
                  onClick={handleBoast}
                  title={canUseBoast ? "Attempt a harder question for more rewards" : "Not enough Momentum or already used"}
                >
                  Boast (⚡⚡⚡)
                </button>
              </>
            )}
          </div>
          
          {currentActivity.mentor && (
            <div style={{ 
              fontSize: typography.fontSize.sm, 
              color: colors.textDim 
            }}>
              with {currentActivity.mentor}
            </div>
          )}
        </div>
        
        {(usedTangent || usedBoast) && (
          <div style={{ 
            marginTop: spacing.sm, 
            fontSize: typography.fontSize.sm 
          }}>
            {usedTangent && (
              <span style={{ color: colors.insight }}>Tangent ability used</span>
            )}
            {usedBoast && (
              <span style={{ color: colors.momentum }}>Boast ability used</span>
            )}
          </div>
        )}
      </div>
      
      {/* Add pulse animation */}
      <style jsx global>{`
        ${animation.keyframes.pulse}
      `}</style>
    </div>
  );
} 