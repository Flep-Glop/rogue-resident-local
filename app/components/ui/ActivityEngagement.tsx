'use client';

import React, { useEffect, useState } from 'react';
import { useGameStore } from '@/app/store/gameStore';
import { useActivityStore } from '@/app/store/activityStore';
import { centralEventBus } from '@/app/core/events/CentralEventBus';
import { ActivityDifficulty, GameEventType, KnowledgeDomain, MentorId } from '@/app/types';
import { TimeManager } from '@/app/core/time/TimeManager';
import { useKnowledgeStore } from '@/app/store/knowledgeStore';

// Helper to render domain badges
const DomainBadge = ({ domain }: { domain: KnowledgeDomain }) => {
  const colors: Record<KnowledgeDomain, string> = {
    [KnowledgeDomain.TREATMENT_PLANNING]: 'bg-blue-500',
    [KnowledgeDomain.RADIATION_THERAPY]: 'bg-green-500',
    [KnowledgeDomain.LINAC_ANATOMY]: 'bg-amber-500',
    [KnowledgeDomain.DOSIMETRY]: 'bg-pink-500',
  };

  const labels: Record<KnowledgeDomain, string> = {
    [KnowledgeDomain.TREATMENT_PLANNING]: 'Treatment Planning',
    [KnowledgeDomain.RADIATION_THERAPY]: 'Radiation Therapy',
    [KnowledgeDomain.LINAC_ANATOMY]: 'Linac Anatomy',
    [KnowledgeDomain.DOSIMETRY]: 'Dosimetry',
  };

  return (
    <span className={`${colors[domain]} text-white text-xs px-2 py-1 rounded-full`}>
      {labels[domain]}
    </span>
  );
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
    <div className="bg-slate-800 text-white p-6 rounded-lg shadow-lg max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">{formattedTime}</h2>
          <p className="text-slate-300">Activity in progress</p>
        </div>
        <div className="flex space-x-4">
          <div className="flex flex-col items-center">
            <span className="text-yellow-400">⚡</span>
            <span>{resources.momentum} / 3</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-blue-400">◆</span>
            <span>{resources.insight}</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-purple-400">★</span>
            <span>{resources.starPoints}</span>
          </div>
        </div>
      </div>
      
      <div className="bg-slate-700 p-4 rounded-lg mb-4">
        <div className="flex justify-between mb-2">
          <h3 className="text-xl font-bold">{currentActivity.title}</h3>
          <div className="flex space-x-2">
            {currentActivity.domains.map((domain) => (
              <DomainBadge key={domain} domain={domain} />
            ))}
          </div>
        </div>
        <p className="text-slate-300 mb-6">{currentActivity.description}</p>
        
        {/* Display lunch quote if it's a lunch activity */}
        {showQuote ? (
          <div className="bg-slate-800 p-6 rounded-lg mb-4">
            <div className="flex flex-col items-center mb-4">
              {/* Show mentor icon/avatar here if available */}
              <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center mb-2 text-2xl">
                {challenge.mentor === MentorId.GARCIA ? 'G' : 
                 challenge.mentor === MentorId.KAPOOR ? 'K' : 
                 challenge.mentor === MentorId.JESSE ? 'J' : 'Q'}
              </div>
              <h4 className="text-lg font-semibold">{
                challenge.mentor === MentorId.GARCIA ? 'Dr. Garcia' : 
                challenge.mentor === MentorId.KAPOOR ? 'Dr. Kapoor' : 
                challenge.mentor === MentorId.JESSE ? 'Jesse' : 'Dr. Quinn'
              }</h4>
            </div>
            
            <blockquote className="italic text-slate-200 border-l-4 border-blue-500 pl-4 py-2 mb-6">
              "{challenge.quote}"
            </blockquote>
            
            {showFeedback ? (
              <div className="mt-4 p-3 rounded-lg bg-slate-700">
                <p className="text-green-400">{challenge.feedback}</p>
                
                {/* Continue button */}
                <button 
                  onClick={handleContinue}
                  className="mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
                >
                  Continue
                </button>
              </div>
            ) : (
              <button 
                onClick={handleQuoteContinue}
                className="mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md w-full"
              >
                Continue Conversation
              </button>
            )}
          </div>
        ) : (
          <div className="bg-slate-800 p-4 rounded-lg mb-4">
            {hasMultipleQuestions && (
              <div className="mb-3 text-sm text-slate-400">
                Question {currentQuestionIndex + 1} of {challenge.questions.length}
              </div>
            )}
            
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-lg font-semibold">{currentQuestion.title}</h4>
              {challenge.difficulty === ActivityDifficulty.HARD && (
                <span className="bg-amber-600 text-white text-xs px-2 py-1 rounded-full">
                  ★★★ Hard
                </span>
              )}
            </div>
            <p className="text-slate-300 mb-4">{currentQuestion.content}</p>
            
            <div className="space-y-3 mt-4">
              {currentQuestion.options.map((option: any, index: number) => (
                <button
                  key={index}
                  className={`
                    p-4 rounded-lg w-full text-left transition duration-200
                    ${selectedOption === index 
                      ? (option.correct ? 'bg-green-700' : 'bg-red-700') 
                      : 'bg-slate-600 hover:bg-slate-500'}
                    ${selectedOption !== null ? 'cursor-default' : 'cursor-pointer'}
                  `}
                  onClick={() => selectedOption === null && handleOptionSelect(index)}
                  disabled={selectedOption !== null}
                >
                  {option.text}
                </button>
              ))}
            </div>
            
            {showFeedback && selectedOption !== null && (
              <div className="mt-4 p-3 rounded-lg bg-slate-700">
                <p className={currentQuestion.options[selectedOption].correct 
                  ? "text-green-400" 
                  : "text-red-400"
                }>
                  {currentQuestion.options[selectedOption].feedback}
                </p>
                
                {/* Only show concepts discovered on the last question */}
                {(!hasMultipleQuestions || isLastQuestion) && conceptsDiscovered.length > 0 && (
                  <div className="mt-2">
                    <p className="text-yellow-300">New concepts discovered:</p>
                    <div className="flex gap-2 mt-1 flex-wrap">
                      {conceptsDiscovered.map((concept) => (
                        <span key={concept} className="bg-slate-600 px-2 py-1 rounded text-sm">
                          {concept.replace(/_/g, ' ')}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Update continue button text for multi-question challenges */}
                <button 
                  onClick={handleContinue}
                  className="mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
                >
                  {hasMultipleQuestions && !isLastQuestion ? "Next Question" : "Continue"}
                </button>
              </div>
            )}
          </div>
        )}
        
        <div className="flex justify-between items-center mt-6">
          <div className="flex space-x-3">
            {/* Only show special abilities if not a lunch activity */}
            {!showQuote && (
              <>
                <button
                  className={`px-3 py-1 rounded-md text-sm 
                    ${canUseTangent ? 'bg-blue-600 hover:bg-blue-700' : 'bg-slate-600 opacity-50 cursor-not-allowed'}`}
                  disabled={!canUseTangent}
                  onClick={handleTangent}
                  title={canUseTangent ? "Change the current question (25 Insight)" : "Not enough Insight or already used"}
                >
                  Tangent (25 ◆)
                </button>
                
                <button
                  className={`px-3 py-1 rounded-md text-sm 
                    ${canUseBoast ? 'bg-amber-600 hover:bg-amber-700' : 'bg-slate-600 opacity-50 cursor-not-allowed'}`}
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
            <div className="text-sm text-slate-400">
              with {currentActivity.mentor}
            </div>
          )}
        </div>
        
        {(usedTangent || usedBoast) && (
          <div className="mt-3 text-sm">
            {usedTangent && (
              <span className="text-blue-400">Tangent ability used</span>
            )}
            {usedBoast && (
              <span className="text-amber-400">Boast ability used</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 