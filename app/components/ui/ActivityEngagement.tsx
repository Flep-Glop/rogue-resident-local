'use client';

import React, { useEffect, useState } from 'react';
import { useGameStore } from '@/app/store/gameStore';
import { useActivityStore } from '@/app/store/activityStore';
import { centralEventBus } from '@/app/core/events/CentralEventBus';
import { 
  ActivityDifficulty, 
  GameEventType, 
  KnowledgeDomain, 
  MentorId, 
  DomainColors,
  LocationId,
  ActivityOption
} from '@/app/types';
import { TimeManager } from '@/app/core/time/TimeManager';
import { useKnowledgeStore } from '@/app/store/knowledgeStore';
import pixelTheme, { colors, typography, animation, components, mixins, borders, shadows, spacing } from '@/app/styles/pixelTheme';
import Image from 'next/image';
import { MultipleChoiceQuestion, QuestionType, Question } from '@/app/types/questions';
import { selectActivityQuestions } from '@/app/core/questions/questionManager';

// Mapping from MentorId to chibi image path
const mentorChibiMap: Record<MentorId, string> = {
  [MentorId.GARCIA]: '/images/garcia-simple.png',
  [MentorId.KAPOOR]: '/images/kapoor-simple.png',
  [MentorId.QUINN]: '/images/quinn-simple.png',
  [MentorId.JESSE]: '/images/jesse-simple.png',
};

// Function to check if value is a valid MentorId
const isValidMentor = (value: any): value is MentorId => {
  return Object.values(MentorId).includes(value);
};

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
      return <span style={{ color: colors.starGlow, textShadow: '0px 0px 3px rgba(255, 215, 0, 0.5)' }}>★☆☆</span>;
    case ActivityDifficulty.MEDIUM:
      return <span style={{ color: colors.starGlow, textShadow: '0px 0px 3px rgba(255, 215, 0, 0.5)' }}>★★☆</span>;
    case ActivityDifficulty.HARD:
      return <span style={{ color: colors.starGlow, textShadow: '0px 0px 3px rgba(255, 215, 0, 0.5)' }}>★★★</span>;
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
      // Reset state
      setSelectedOption(null);
      setShowFeedback(false);
      setConceptsDiscovered([]);
      setUsedTangent(false);
      setUsedBoast(false);
      setShowQuote(SAMPLE_CHALLENGES[currentActivity.id]?.type === "lunch_quote");
      
      // Reset question tracking
      setCurrentQuestionIndex(0);
      setAllAnswers([]);

      // For lunch activities or activities with no associated domains, use sample challenges
      if (currentActivity.location === LocationId.CAFETERIA || 
          !currentActivity.domains || 
          currentActivity.domains.length === 0 ||
          currentActivity.id.includes('lunch_')) {
        setChallenge(SAMPLE_CHALLENGES[currentActivity.id] || SAMPLE_CHALLENGES.default);
        return;
      }

      // For all other activities, fetch questions based on associated domain
      const primaryDomain = currentActivity.domains[0]; // Use the first domain as primary
      
      fetchQuestionsForActivity(currentActivity)
        .then(apiQuestions => {
          if (apiQuestions && apiQuestions.length > 0) {
            // Transform API questions to the format expected by the component
            const transformedChallenge = transformQuestionsToChallenge(apiQuestions, currentActivity);
            setChallenge(transformedChallenge);
          } else {
            // Fall back to sample questions if API fails
            setChallenge(SAMPLE_CHALLENGES[currentActivity.id] || SAMPLE_CHALLENGES.default);
          }
        })
        .catch(error => {
          console.error('Error fetching questions:', error);
          // Fall back to sample questions if API fails
          setChallenge(SAMPLE_CHALLENGES[currentActivity.id] || SAMPLE_CHALLENGES.default);
        });
    }
  }, [currentActivity]);
  
  // Function to fetch questions for an activity using the questionManager
  const fetchQuestionsForActivity = async (activity: ActivityOption) => {
    try {
      // Determine primary domain for the activity
      const domain = activity.domains && activity.domains.length > 0 
        ? activity.domains[0] 
        : KnowledgeDomain.RADIATION_THERAPY; // Default fallback
      
      // Determine number of questions based on activity difficulty
      const questionCount = activity.difficulty === ActivityDifficulty.HARD ? 3 :
                           activity.difficulty === ActivityDifficulty.MEDIUM ? 2 : 1;
      
      // Use the selectActivityQuestions function to get appropriate questions
      const questions = await selectActivityQuestions(
        domain,
        activity.difficulty,
        questionCount,
        [QuestionType.MULTIPLE_CHOICE] // Start with multiple choice for now
      );
      
      return questions;
    } catch (error) {
      console.error('Error fetching questions for activity:', error);
      throw error;
    }
  };
  
  // Transform API questions to the challenge format expected by the component
  const transformQuestionsToChallenge = (apiQuestions: Question[], activity: ActivityOption): any => {
    // Filter to only use multiple choice questions
    const multipleChoiceQuestions = apiQuestions.filter(q => q.type === QuestionType.MULTIPLE_CHOICE) as MultipleChoiceQuestion[];
    
    if (multipleChoiceQuestions.length === 0) {
      return SAMPLE_CHALLENGES[activity.id] || SAMPLE_CHALLENGES.default;
    }
    
    // Determine number of questions based on activity difficulty
    const questionCount = activity.difficulty === ActivityDifficulty.HARD ? 3 :
                        activity.difficulty === ActivityDifficulty.MEDIUM ? 2 : 1;
    
    // Transform to the format expected by the component
    const transformedQuestions = multipleChoiceQuestions
      .slice(0, questionCount)
      .map(q => ({
        content: q.question,
        options: q.options.map(option => ({
          text: option.text,
          correct: option.isCorrect,
          feedback: option.isCorrect 
            ? q.feedback?.correct || "Correct answer!"
            : q.feedback?.incorrect || "Incorrect answer."
        }))
    }));
    
    // Collect unique concepts across the selected questions
    const concepts = Array.from(new Set(
      multipleChoiceQuestions.flatMap(q => q.tags?.knowledgeNode ? [q.tags.knowledgeNode] : [])
    )) as string[];

    return {
      questions: transformedQuestions,
      concepts,
      difficulty: activity.difficulty
    };
  };
  
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
        if (challenge.concepts && challenge.concepts.length > 0) {
          // Deduplicate concepts to avoid duplicate React keys and repeated badges
          const uniqueConcepts = Array.from(new Set(challenge.concepts)) as string[];
          setConceptsDiscovered(uniqueConcepts);
          
          // Import knowledge store here
          const { discoverConcept } = useKnowledgeStore.getState();
          
          // Use the knowledge store to discover concepts
          uniqueConcepts.forEach((conceptId) => {
            // Call the knowledge store method directly
            discoverConcept(conceptId, 'activity_engagement');
            
            // Event is now dispatched by the knowledge store itself
          });
        }
      }

      // Random chance to earn Star Points directly (10%, or 20% with Boast)
      const spChance = usedBoast ? 0.2 : 0.1;
      if (Math.random() < spChance) {
        const spGained = challenge.difficulty === ActivityDifficulty.HARD ? 2 : 1;
        addStarPoints(spGained);
        /*
        // TODO: Consolidate GameEventType definition and uncomment when ready
        centralEventBus.dispatch(
          GameEventType.sp_gained,
          { amount: spGained, source: 'activity_bonus' },
          'ActivityEngagement.handleOptionSelect'
        );
        */
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
      success ? GameEventType.ACTIVITY_COMPLETED : GameEventType.ACTIVITY_COMPLETED, // Temporarily using ACTIVITY_COMPLETED for failed case
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
        /*
        // TODO: Consolidate GameEventType definition and uncomment
        centralEventBus.dispatch(
          GameEventType.tangent_used,
          { activityId: currentActivity.id },
          'ActivityEngagement.handleTangent'
        );
        */
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
      /*
      // TODO: Consolidate GameEventType definition and uncomment
      centralEventBus.dispatch(
        GameEventType.boast_used,
        { activityId: currentActivity.id },
        'ActivityEngagement.handleBoast'
      );
      */
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
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      padding: `${spacing.md} 0`,
      background: 'linear-gradient(to bottom, #121620, #090b12)',
      position: 'relative'
    }}>
      {/* Add a background gradient effect similar to TitleScreen */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 
          'radial-gradient(circle at 20% 30%, rgba(76, 0, 255, 0.1) 0%, transparent 40%), ' +
          'radial-gradient(circle at 80% 70%, rgba(25, 0, 112, 0.15) 0%, transparent 40%)',
        zIndex: 0
      }} />
      
      {/* Time header remains at the top */}
      <div style={{
        backgroundColor: colors.background,
        color: colors.text,
        padding: `${spacing.sm} ${spacing.md}`,
        borderRadius: spacing.sm,
        width: '95%',
        maxWidth: '1200px',
        fontFamily: typography.fontFamily.pixel,
        boxShadow: `0 4px 0 ${colors.border}, 0 0 0 4px ${colors.border}, 0 0 0 4px ${colors.border}, 4px 0 0 ${colors.border}`,
        imageRendering: 'pixelated',
        border: `2px solid ${colors.border}`,
        position: 'relative',
        zIndex: 1,
        marginBottom: spacing.md,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h2 style={{ 
            fontSize: typography.fontSize.xl, 
            fontWeight: 'bold',
            textShadow: `${typography.textShadow.pixel}, 0 0 10px rgba(255, 255, 255, 0.1)`,
            margin: 0,
            letterSpacing: '1px'
          }}>{formattedTime}</h2>
          <p style={{ 
            color: 'rgba(255, 255, 255, 0.75)',
            margin: `${spacing.xxs} 0 0 0`,
            fontSize: typography.fontSize.sm
          }}>Activity in progress</p>
        </div>
      </div>
      
      {/* Three-panel layout container */}
      <div style={{
        display: 'flex',
        width: '95%',
        maxWidth: '1200px',
        gap: spacing.md,
        position: 'relative',
        zIndex: 1
      }}>
        {/* Left panel - Activity info and mentor */}
        <div style={{
          backgroundColor: colors.background,
          color: colors.text,
          padding: spacing.md,
          borderRadius: spacing.sm,
          width: '25%',
          fontFamily: typography.fontFamily.pixel,
          boxShadow: `0 4px 0 ${colors.border}, 0 0 0 4px ${colors.border}, 0 0 0 4px ${colors.border}, 4px 0 0 ${colors.border}`,
          imageRendering: 'pixelated',
          border: `2px solid ${colors.border}`,
          display: 'flex',
          flexDirection: 'column',
          gap: spacing.md,
          alignSelf: 'flex-start'
        }}>
          {/* Activity Title */}
          <div style={{
            borderBottom: `1px dotted ${colors.border}`,
            paddingBottom: spacing.sm
          }}>
            <h3 style={{ 
              fontSize: typography.fontSize.lg, 
              fontWeight: 'bold',
              textShadow: `${typography.textShadow.pixel}, 0 0 8px rgba(255, 255, 255, 0.15)`,
              margin: 0,
              letterSpacing: '1px'
            }}>{currentActivity.title}</h3>
            
            {/* Domain tags */}
            <div style={{ 
              display: 'flex', 
              gap: spacing.xs,
              flexWrap: 'wrap',
              marginTop: spacing.xs
            }}>
              {currentActivity.domains.map((domain) => (
                <DomainBadge key={domain} domain={domain} />
              ))}
            </div>
          </div>
          
          {/* Mentor Section */}
          {currentActivity.mentor && (
            <div style={{
              marginTop: 'auto',
              borderTop: `1px dotted ${colors.border}`,
              paddingTop: spacing.md
            }}>
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center'
              }}>
                {/* Mentor image */}
                <div style={{
                  width: '160px',
                  height: '160px',
                  borderRadius: '50%',
                  backgroundColor: colors.highlight,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: spacing.sm,
                  border: `2px solid ${colors.border}`,
                  boxShadow: shadows.md,
                  overflow: 'hidden'
                }}>
                  {currentActivity.mentor && isValidMentor(currentActivity.mentor) && (
                    <Image 
                      src={mentorChibiMap[currentActivity.mentor as MentorId]}
                      alt={currentActivity.mentor}
                      width={150}
                      height={150}
                      style={{ 
                        objectFit: 'contain',
                        imageRendering: 'pixelated',
                        transform: 'translateZ(0)',
                        backfaceVisibility: 'hidden',
                        WebkitFontSmoothing: 'none',
                        MozOsxFontSmoothing: 'none'
                      }}
                      unoptimized={true}
                      priority={true}
                    />
                  )}
                </div>
                
                {/* Mentor name */}
                <h4 style={{ 
                  fontSize: typography.fontSize.md, 
                  fontWeight: 'semibold',
                  margin: 0,
                  textShadow: typography.textShadow.pixel
                }}>
                  {currentActivity.mentor}
                </h4>
              </div>
            </div>
          )}
        </div>
        
        {/* Center panel - Main content (questions and options) */}
        <div style={{
          backgroundColor: colors.background,
          color: colors.text,
          padding: spacing.lg,
          borderRadius: spacing.sm,
          flex: 1,
          fontFamily: typography.fontFamily.pixel,
          boxShadow: `0 4px 0 ${colors.border}, 0 0 0 4px ${colors.border}, 0 0 0 4px ${colors.border}, 4px 0 0 ${colors.border}`,
          imageRendering: 'pixelated',
          border: `2px solid ${colors.border}`,
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Main Activity Container - Enhanced card-like appearance */}
          <div style={{
            backgroundColor: colors.backgroundAlt,
            padding: spacing.lg,
            borderRadius: spacing.sm,
            border: borders.medium,
            boxShadow: `${shadows.md}, 0 0 15px rgba(0, 0, 0, 0.2)`,
            display: 'flex',
            flexDirection: 'column',
            flex: 1
          }}>
            {/* Display lunch quote if it's a lunch activity */}
            {showQuote ? (
              <div style={{
                backgroundColor: 'rgba(20, 25, 35, 0.7)',
                padding: spacing.md,
                borderRadius: spacing.sm,
                marginBottom: spacing.md,
                border: borders.thin,
                boxShadow: shadows.sm,
                height: '100%',
                display: 'flex',
                flexDirection: 'column'
              }}>
                <blockquote style={{
                  fontStyle: 'italic',
                  color: 'rgba(255, 255, 255, 0.85)',
                  borderLeft: `4px solid ${colors.highlight}`,
                  paddingLeft: spacing.md,
                  paddingTop: spacing.xs,
                  paddingBottom: spacing.xs,
                  marginBottom: spacing.md,
                  marginLeft: spacing.sm,
                  marginRight: 0,
                  fontSize: typography.fontSize.sm,
                  lineHeight: '1.6',
                  backgroundColor: 'rgba(30, 40, 60, 0.3)',
                  borderRadius: '0 4px 4px 0',
                  flex: 1
                }}>
                  "{challenge.quote}"
                </blockquote>
                
                {showFeedback ? (
                  <div style={{
                    marginTop: spacing.md,
                    padding: spacing.sm,
                    borderRadius: spacing.sm,
                    backgroundColor: 'rgba(30, 40, 60, 0.5)',
                    border: `1px dashed ${colors.border}`,
                    animation: `fadeIn ${animation.duration.normal} ${animation.easing.pixel}`
                  }}>
                    <p style={{ 
                      color: colors.active,
                      margin: 0,
                      fontSize: typography.fontSize.sm,
                      padding: spacing.xs
                    }}>{challenge.feedback}</p>
                    
                    {/* Continue button - Enhanced button style */}
                    <button 
                      onClick={handleContinue}
                      className="continue-button"
                      style={{
                        marginTop: spacing.sm,
                        padding: `${spacing.sm} ${spacing.lg}`,
                        backgroundColor: colors.highlight,
                        color: colors.text,
                        border: borders.medium,
                        borderRadius: spacing.xs,
                        cursor: 'pointer',
                        fontFamily: typography.fontFamily.pixel,
                        textShadow: typography.textShadow.pixel,
                        boxShadow: `${shadows.md}, 0 0 10px rgba(137, 87, 255, 0.3)`,
                        letterSpacing: '0.5px',
                        fontWeight: 'bold',
                        width: '100%'
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
                      padding: `${spacing.sm} ${spacing.md}`,
                      backgroundColor: colors.highlight,
                      color: colors.text,
                      border: borders.medium,
                      borderRadius: spacing.xs,
                      cursor: 'pointer',
                      width: '100%',
                      fontFamily: typography.fontFamily.pixel,
                      textShadow: typography.textShadow.pixel,
                      transition: `all ${animation.duration.fast} ${animation.easing.pixel}`,
                      boxShadow: `${shadows.md}, 0 0 10px rgba(137, 87, 255, 0.3)`,
                      letterSpacing: '0.5px',
                      fontWeight: 'bold'
                    }}
                  >
                    Continue Conversation
                  </button>
                )}
              </div>
            ) : (
              <div style={{
                backgroundColor: 'rgba(20, 25, 35, 0.7)',
                padding: spacing.lg,
                borderRadius: spacing.sm,
                border: borders.thin,
                boxShadow: shadows.sm,
                height: '100%',
                display: 'flex',
                flexDirection: 'column'
              }}>
                {/* Question Progress Indicator - Enhanced visual cue */}
                {hasMultipleQuestions && (
                  <div style={{
                    marginBottom: spacing.md,
                    fontSize: typography.fontSize.sm,
                    color: 'rgba(255, 255, 255, 0.75)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: 'rgba(30, 40, 60, 0.5)',
                    padding: `${spacing.xs} ${spacing.sm}`,
                    borderRadius: spacing.xs,
                    border: `1px solid ${colors.border}`
                  }}>
                    <span>Question {currentQuestionIndex + 1} of {challenge.questions.length}</span>
                    <div style={{
                      display: 'flex',
                      gap: spacing.xxs,
                      alignItems: 'center'
                    }}>
                      {Array.from({length: challenge.questions.length}, (_, i) => (
                        <div key={i} style={{
                          width: spacing.sm,
                          height: spacing.xs,
                          backgroundColor: i === currentQuestionIndex ? colors.highlight : colors.inactive,
                          borderRadius: spacing.xxs,
                          boxShadow: i === currentQuestionIndex ? '0 0 4px rgba(137, 87, 255, 0.6)' : 'none'
                        }} />
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Question Title and Difficulty - Enhanced visual grouping */}
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  marginBottom: spacing.md,
                  paddingBottom: spacing.sm,
                  borderBottom: `1px dotted ${colors.border}`
                }}>
                  {challenge.difficulty === ActivityDifficulty.HARD && (
                    <span style={{
                      backgroundColor: colors.starGlow,
                      color: colors.text,
                      fontSize: typography.fontSize.xs,
                      padding: `${spacing.xxs} ${spacing.xs}`,
                      borderRadius: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: spacing.xxs,
                      boxShadow: '0 0 8px rgba(255, 215, 0, 0.4)'
                    }}>
                      <DifficultyStars difficulty={ActivityDifficulty.HARD} /> Hard
                    </span>
                  )}
                </div>
                <p style={{ 
                  color: 'rgba(255, 255, 255, 0.85)',
                  marginBottom: spacing.lg,
                  fontSize: typography.fontSize.sm,
                  lineHeight: '1.5',
                  padding: `${spacing.xs} ${spacing.sm}`,
                  backgroundColor: 'rgba(30, 40, 60, 0.3)',
                  borderRadius: spacing.xs
                }}>{currentQuestion.content}</p>
                
                {/* Question Options - Enhanced visual distinction */}
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: spacing.md,
                  marginTop: spacing.lg,
                  flex: 1
                }}>
                  {currentQuestion.options.map((option: any, index: number) => {
                    const isSelected = selectedOption === index;
                    const isCorrect = option.correct;
                    
                    return (
                      <button
                        key={index}
                        className="question-option"
                        style={{
                          padding: spacing.lg,
                          borderRadius: spacing.sm,
                          width: '100%',
                          textAlign: 'left',
                          transition: `all ${animation.duration.fast} ${animation.easing.pixel}`,
                          backgroundColor: isSelected 
                            ? (isCorrect ? 'rgba(39, 174, 96, 0.3)' : 'rgba(231, 76, 60, 0.3)')
                            : 'rgba(30, 40, 60, 0.5)',
                          color: 'rgba(255, 255, 255, 0.9)',
                          border: isSelected 
                            ? `2px solid ${isCorrect ? colors.active : colors.error}` 
                            : borders.medium,
                          cursor: selectedOption !== null ? 'default' : 'pointer',
                          fontFamily: typography.fontFamily.pixel,
                          boxShadow: isSelected ? 'none' : `${shadows.md}, 0 0 5px rgba(0, 0, 0, 0.3)`,
                          transform: isSelected ? 'translateY(2px)' : 'translateY(0)',
                          fontSize: typography.fontSize.sm,
                          position: 'relative',
                          letterSpacing: '0.3px',
                          outline: 'none'
                        }}
                        onClick={() => selectedOption === null && handleOptionSelect(index)}
                        disabled={selectedOption !== null}
                      >
                        {/* Add visual indicator for selected answer */}
                        {isSelected && (
                          <span style={{
                            position: 'absolute',
                            left: spacing.xs,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            fontSize: typography.fontSize.md,
                            color: isCorrect ? colors.active : colors.error,
                            textShadow: `0 0 4px ${isCorrect ? 'rgba(39, 174, 96, 0.6)' : 'rgba(231, 76, 60, 0.6)'}`
                          }}>
                            {isCorrect ? '✓' : '✗'}
                          </span>
                        )}
                        <span style={{ 
                          marginLeft: isSelected ? spacing.lg : 0,
                          display: 'block'
                        }}>
                          {option.text}
                        </span>
                      </button>
                    );
                  })}
                </div>
                
                {/* Feedback Section - Enhanced visual feedback */}
                {showFeedback && selectedOption !== null && (
                  <div style={{
                    marginTop: spacing.lg,
                    padding: spacing.md,
                    borderRadius: spacing.sm,
                    backgroundColor: 'rgba(30, 40, 60, 0.5)',
                    border: `1px dashed ${colors.border}`,
                    animation: `fadeIn ${animation.duration.normal} ${animation.easing.pixel}`,
                    boxShadow: '0 0 10px rgba(0, 0, 0, 0.2)'
                  }}>
                    <p style={{ 
                      color: currentQuestion.options[selectedOption].correct 
                        ? colors.active 
                        : colors.error,
                      margin: 0,
                      fontSize: typography.fontSize.sm,
                      fontWeight: 'bold',
                      padding: spacing.xs,
                      textShadow: currentQuestion.options[selectedOption].correct
                        ? '0 0 5px rgba(39, 174, 96, 0.5)'
                        : '0 0 5px rgba(231, 76, 60, 0.5)'
                    }}>
                      {currentQuestion.options[selectedOption].feedback}
                    </p>
                    
                    {/* Concepts discovered section - Enhanced visual grouping */}
                    {(!hasMultipleQuestions || isLastQuestion) && conceptsDiscovered.length > 0 && (
                      <div style={{ 
                        marginTop: spacing.md,
                        padding: spacing.md,
                        borderTop: `1px dotted ${colors.border}`,
                        paddingTop: spacing.sm,
                        backgroundColor: 'rgba(20, 30, 40, 0.3)',
                        borderRadius: spacing.xs
                      }}>
                        <p style={{ 
                          color: colors.starGlow,
                          margin: `0 0 ${spacing.xs} 0`,
                          fontSize: typography.fontSize.sm,
                          display: 'flex',
                          alignItems: 'center',
                          gap: spacing.xxs,
                          textShadow: '0 0 5px rgba(255, 215, 0, 0.4)'
                        }}>
                          <span style={{ fontSize: typography.fontSize.md }}>✨</span> New concepts discovered:
                        </p>
                        <div style={{ 
                          display: 'flex', 
                          gap: spacing.xs, 
                          marginTop: spacing.xs,
                          flexWrap: 'wrap' 
                        }}>
                          {conceptsDiscovered.map((concept) => (
                            <span key={concept} style={{
                              backgroundColor: 'rgba(40, 50, 70, 0.6)',
                              padding: `${spacing.xs} ${spacing.sm}`,
                              borderRadius: spacing.sm,
                              fontSize: typography.fontSize.xs,
                              border: `1px solid ${colors.border}`,
                              textTransform: 'capitalize',
                              boxShadow: '0 0 4px rgba(255, 215, 0, 0.2)'
                            }}>
                              {concept.replace(/_/g, ' ')}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Continue button - Enhanced button style */}
                    <button 
                      onClick={handleContinue}
                      className="continue-button"
                      style={{
                        marginTop: spacing.md,
                        padding: `${spacing.sm} ${spacing.md}`,
                        backgroundColor: colors.highlight,
                        color: colors.text,
                        border: borders.medium,
                        borderRadius: spacing.xs,
                        cursor: 'pointer',
                        fontFamily: typography.fontFamily.pixel,
                        textShadow: typography.textShadow.pixel,
                        boxShadow: `${shadows.md}, 0 0 10px rgba(137, 87, 255, 0.3)`,
                        letterSpacing: '0.5px',
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: spacing.xs,
                        width: '100%',
                        transition: `all ${animation.duration.fast} ${animation.easing.pixel}`
                      }}
                    >
                      {hasMultipleQuestions && !isLastQuestion ? "Next Question →" : "Continue →"}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* Right panel - Player stats and powers */}
        <div style={{
          backgroundColor: colors.background,
          color: colors.text,
          padding: spacing.sm,
          borderRadius: spacing.sm,
          width: '22%',
          fontFamily: typography.fontFamily.pixel,
          boxShadow: `0 4px 0 ${colors.border}, 0 0 0 4px ${colors.border}, 0 0 0 4px ${colors.border}, 4px 0 0 ${colors.border}`,
          imageRendering: 'pixelated',
          border: `2px solid ${colors.border}`,
          display: 'flex',
          flexDirection: 'column',
          gap: spacing.xs,
          alignSelf: 'flex-start'
        }}>
          {/* Player Stats */}
          <h3 style={{ 
            fontSize: typography.fontSize.md, 
            fontWeight: 'bold',
            textShadow: typography.textShadow.pixel,
            margin: 0,
            borderBottom: `1px dotted ${colors.border}`,
            paddingBottom: spacing.xs
          }}>Player Stats</h3>
            
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            fontSize: typography.fontSize.sm,
            padding: `${spacing.xxs} 0`
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: spacing.xxs }}>
              <span style={{ color: colors.momentum }}>⚡</span> Momentum
            </span>
            <span>{resources.momentum}/3</span>
          </div>
          
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            fontSize: typography.fontSize.sm,
            padding: `${spacing.xxs} 0`
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: spacing.xxs }}>
              <span style={{ color: colors.insight }}>◆</span> Insight
            </span>
            <span>{resources.insight}</span>
          </div>
          
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            fontSize: typography.fontSize.sm,
            padding: `${spacing.xxs} 0`,
            borderBottom: `1px dotted ${colors.border}`,
            paddingBottom: spacing.xs
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: spacing.xxs }}>
              <span style={{ color: colors.highlight }}>★</span> Star Points
            </span>
            <span>{resources.starPoints}</span>
          </div>
          
          {/* Special Abilities */}
          {!showQuote && (
            <>
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: spacing.xs,
                paddingTop: spacing.xxs
              }}>
                <button
                  style={{
                    padding: `${spacing.xs} ${spacing.sm}`,
                    borderRadius: spacing.xs,
                    fontSize: typography.fontSize.xs,
                    backgroundColor: canUseTangent ? 'rgba(45, 156, 219, 0.3)' : 'rgba(50, 50, 60, 0.3)',
                    color: canUseTangent ? colors.text : colors.inactive,
                    opacity: canUseTangent ? 1 : 0.5,
                    cursor: canUseTangent ? 'pointer' : 'not-allowed',
                    border: borders.thin,
                    fontFamily: typography.fontFamily.pixel,
                    display: 'flex',
                    alignItems: 'center',
                    gap: spacing.xs,
                    boxShadow: canUseTangent ? `${shadows.md}, 0 0 8px rgba(45, 156, 219, 0.3)` : 'none',
                    transition: `all ${animation.duration.fast} ${animation.easing.pixel}`
                  }}
                  disabled={!canUseTangent}
                  onClick={handleTangent}
                  title={canUseTangent ? "Change the current question (25 Insight)" : "Not enough Insight or already used"}
                >
                  <span style={{ color: colors.insight }}>⟲</span> Tangent (25 ◆)
                </button>
                
                <button
                  style={{
                    padding: `${spacing.xs} ${spacing.sm}`,
                    borderRadius: spacing.xs,
                    fontSize: typography.fontSize.xs,
                    backgroundColor: canUseBoast ? 'rgba(231, 126, 35, 0.3)' : 'rgba(50, 50, 60, 0.3)',
                    color: canUseBoast ? colors.text : colors.inactive,
                    opacity: canUseBoast ? 1 : 0.5,
                    cursor: canUseBoast ? 'pointer' : 'not-allowed',
                    border: borders.thin,
                    fontFamily: typography.fontFamily.pixel,
                    display: 'flex',
                    alignItems: 'center',
                    gap: spacing.xs,
                    boxShadow: canUseBoast ? `${shadows.md}, 0 0 8px rgba(231, 126, 35, 0.3)` : 'none',
                    transition: `all ${animation.duration.fast} ${animation.easing.pixel}`
                  }}
                  disabled={!canUseBoast}
                  onClick={handleBoast}
                  title={canUseBoast ? "Attempt a harder question for more rewards" : "Not enough Momentum or already used"}
                >
                  <span style={{ color: colors.momentum }}>⤴</span> Boast (⚡⚡⚡)
                </button>
              </div>
              
              {/* Ability usage indicators */}
              {(usedTangent || usedBoast) && (
                <div style={{ 
                  fontSize: typography.fontSize.xs,
                  padding: `${spacing.xxs} ${spacing.xs}`,
                  backgroundColor: 'rgba(30, 40, 60, 0.4)',
                  borderRadius: spacing.xs,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: spacing.sm
                }}>
                  {usedTangent && (
                    <span style={{ color: colors.insight }}>
                      <span>◆</span> Used
                    </span>
                  )}
                  {usedBoast && (
                    <span style={{ color: colors.momentum }}>
                      <span>⚡</span> Used
                    </span>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
      
      {/* Add animations */}
      <style jsx global>{`
        ${animation.keyframes.pulse}
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        button:focus {
          outline: none;
          box-shadow: 0 0 0 2px ${colors.highlight}, 0 0 10px rgba(137, 87, 255, 0.5);
        }
        
        /* Add hover effects that work with dynamic styles */
        button:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3), 0 0 10px rgba(137, 87, 255, 0.3);
        }
        
        button:active:not(:disabled) {
          transform: translateY(1px);
        }
        
        /* Specific button hover effects */
        .question-option:hover:not(:disabled) {
          background-color: rgba(40, 55, 75, 0.7) !important;
          box-shadow: ${shadows.lg}, 0 0 8px rgba(137, 87, 255, 0.2) !important;
        }
        
        .continue-button:hover:not(:disabled) {
          transform: translateY(-2px) !important;
          box-shadow: ${shadows.lg}, 0 0 15px rgba(137, 87, 255, 0.4) !important;
        }
      `}</style>
    </div>
  );
} 