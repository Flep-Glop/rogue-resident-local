'use client';

// =============================================================================
// 🎨 VISUAL ENHANCEMENT TARGET: ActivityEngagement System 🎨
// =============================================================================
// STATUS: Active system for educational content - READY FOR RESKIN
// GOAL: Apply beautiful dialogue system visual style to this sophisticated engine
// CONTAINS: Complex question types (matching, procedural, calculation, etc.)
// FEATURES: Dynamic question loading, special abilities (tangent/boast), etc.
// ENHANCEMENT: Keep all functionality, upgrade visual presentation
// TARGET: Make this look as beautiful as the narrative/challenge dialogue modes
// =============================================================================

import React, { useEffect, useState, useCallback, useMemo } from 'react';
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
import { MultipleChoiceQuestion, Question, Domain, Difficulty, QuestionType } from '@/app/types/questions';
import { selectActivityQuestions } from '@/app/core/questions/questionManager';
import { getPortraitCoordinates, SPRITE_SHEETS } from '@/app/utils/spriteMap';
import SpriteImage from '../ui/SpriteImage';
import { useResourceStore } from '@/app/store/resourceStore';
import { useRelationshipStore } from '@/app/store/relationshipStore';
import MomentumIndicator from './MomentumIndicator';
import BoastButton from './BoastButton';
import InsightIndicator from '@/app/components/ui/InsightIndicator';
import ResourceDisplay from '@/app/components/ui/ResourceDisplay';
import TypewriterText from './TypewriterText';

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

// Helper function to convert KnowledgeDomain to Domain
const convertToNewDomain = (legacyDomain: KnowledgeDomain): Domain => {
  // Map from old enum values to new string literals
  const domainMap: Record<KnowledgeDomain, Domain> = {
    [KnowledgeDomain.TREATMENT_PLANNING]: 'TREATMENT_PLANNING',
    [KnowledgeDomain.RADIATION_THERAPY]: 'RADIATION_THERAPY',
    [KnowledgeDomain.LINAC_ANATOMY]: 'LINAC_ANATOMY',
    [KnowledgeDomain.DOSIMETRY]: 'DOSIMETRY'
  };
  
  return domainMap[legacyDomain] || 'RADIATION_THERAPY';
};

// Testing utilities for question implementation
interface TestQuestion {
  text: string;
  options: Array<{
    text: string;
    isCorrect: boolean;
    feedback?: string;
  }>;
  metadata?: {
    knowledgeStars?: string[];
    domain?: Domain;
    difficulty?: Difficulty;
    tags?: string[];
  };
}

interface TestMatchingQuestion {
  text: string;
  items: string[];
  matches: string[];
  correctMatchIndices: number[];
  feedback?: string;
  metadata?: {
    knowledgeStars?: string[];
    domain?: Domain;
    difficulty?: Difficulty;
    tags?: string[];
  };
}

const TEST_QUESTIONS: Record<string, TestQuestion[]> = {
  "test_easy": [
    {
      text: "This is a test EASY question. What is the primary purpose of a multi-leaf collimator (MLC)?",
      options: [
        { text: "To filter the radiation beam", isCorrect: false },
        { text: "To shape the radiation beam", isCorrect: true, feedback: "Correct! MLCs shape the beam to conform to the target volume." },
        { text: "To increase beam energy", isCorrect: false },
        { text: "To rotate the gantry", isCorrect: false }
      ],
      metadata: {
        knowledgeStars: ["IMRT_fundamentals", "beam_shaping"]
      }
    }
  ],
  "test_medium": [
    {
      text: "This is a test MEDIUM question. In IMRT planning, what does DVH stand for?",
      options: [
        { text: "Dose Volume Histogram", isCorrect: true, feedback: "Correct! DVH is a key tool for evaluating treatment plans." },
        { text: "Digital Volume Handling", isCorrect: false },
        { text: "Direct Voltage Hysteresis", isCorrect: false },
        { text: "Declining Volume Hazard", isCorrect: false }
      ],
      metadata: {
        knowledgeStars: ["treatment_planning", "dose_evaluation"]
      }
    },
    {
      text: "A follow-up MEDIUM question. Which of these is NOT typically a critical organ in head and neck radiotherapy?",
      options: [
        { text: "Parotid glands", isCorrect: false },
        { text: "Spinal cord", isCorrect: false },
        { text: "Kidneys", isCorrect: true, feedback: "Correct! Kidneys are not typically critical organs in head and neck radiotherapy." },
        { text: "Larynx", isCorrect: false }
      ],
      metadata: {
        knowledgeStars: ["critical_organs", "treatment_planning"]
      }
    }
  ],
  "test_hard": [
    {
      text: "This is a test HARD question. Which physical effect is primarily responsible for skin sparing in megavoltage photon radiotherapy?",
      options: [
        { text: "Pair production", isCorrect: false },
        { text: "Photoelectric effect", isCorrect: false },
        { text: "Electron buildup", isCorrect: true, feedback: "Correct! The electron buildup effect causes the maximum dose to occur below the skin surface." },
        { text: "Rayleigh scattering", isCorrect: false }
      ],
      metadata: {
        knowledgeStars: ["radiation_physics", "dosimetry", "skin_sparing"]
      }
    },
    {
      text: "A follow-up HARD question. When using VMAT, what parameter most directly affects treatment delivery time?",
      options: [
        { text: "Maximum dose rate", isCorrect: false },
        { text: "Maximum gantry rotation speed", isCorrect: false },
        { text: "Maximum MLC speed", isCorrect: false },
        { text: "All of the above", isCorrect: true, feedback: "Correct! All these factors together determine the delivery time in VMAT." }
      ],
      metadata: {
        knowledgeStars: ["VMAT", "treatment_delivery", "advanced_techniques"]
      }
    }
  ]
};

// Add sample matching questions
const TEST_MATCHING_QUESTIONS: Record<string, TestMatchingQuestion[]> = {
  "matching_easy": [
    {
      text: "Match each radiotherapy term with its correct definition:",
      items: ["Fractionation", "Brachytherapy", "IMRT"],
      matches: [
        "Dividing the total dose into smaller daily doses",
        "Placing radioactive sources directly in or near the tumor",
        "Beam modulation technique that shapes dose to the target volume"
      ],
      correctMatchIndices: [0, 1, 2],
      feedback: "Excellent work! Understanding these fundamental radiotherapy concepts is essential.",
      metadata: {
        knowledgeStars: ["radiation_basics", "treatment_modalities"],
        difficulty: 'BEGINNER'
      }
    }
  ],
  "matching_medium": [
    {
      text: "Match each quality assurance test with its corresponding purpose:",
      items: [
        "Winston-Lutz Test",
        "Picket Fence Test",
        "Star Shot Analysis",
      ],
      matches: [
        "Verifies isocenter alignment accuracy",
        "Checks MLC leaf positioning accuracy",
        "Determines the rotational accuracy of the gantry"
      ],
      correctMatchIndices: [0, 1, 2],
      feedback: "Great job! These QA procedures are critical for ensuring treatment accuracy.",
      metadata: {
        knowledgeStars: ["quality_assurance", "machine_calibration"],
        difficulty: 'INTERMEDIATE'
      }
    }
  ],
  "matching_hard": [
    {
      text: "Match each dosimetric effect with its primary physical interaction:",
      items: [
        "Skin sparing effect",
        "Build-up region",
        "Penumbra",
      ],
      matches: [
        "Energy deposition from secondary electrons",
        "Charged particle equilibrium establishment",
        "Beam divergence and scatter"
      ],
      correctMatchIndices: [0, 1, 2],
      feedback: "Excellent understanding of complex dosimetric concepts!",
      metadata: {
        knowledgeStars: ["radiation_physics", "advanced_dosimetry", "beam_interactions"],
        difficulty: 'ADVANCED'
      }
    }
  ]
};

// Add a toggle for enabling test mode
let TEST_MODE_ENABLED = false;
let SELECTED_TEST_SET = "test_easy";
let TEST_QUESTION_TYPE = "multipleChoice";

// Add sample procedural questions
const TEST_PROCEDURAL_QUESTIONS: Record<string, any[]> = {
  "procedural_easy": [
    {
      text: "Arrange the following steps in the correct order for performing daily linac quality assurance:",
      steps: [
        "Perform mechanical safety checks",
        "Warm up the machine",
        "Check radiation output constancy",
        "Verify laser alignment",
        "Log results in QA system"
      ],
      correctOrder: [1, 0, 3, 2, 4],
      feedback: "Great job! Following this order ensures safe and accurate daily machine operation.",
      metadata: {
        knowledgeStars: ["quality_assurance", "machine_operation"],
        difficulty: 'BEGINNER'
      }
    }
  ],
  "procedural_medium": [
    {
      text: "Arrange the steps in the proper sequence for IMRT patient-specific QA:",
      steps: [
        "Transfer treatment plan to phantom",
        "Deliver the plan to the measurement device",
        "Analyze measurement results against acceptance criteria",
        "Set up measurement equipment",
        "Compare measured vs. calculated dose distribution"
      ],
      correctOrder: [3, 0, 1, 4, 2],
      feedback: "Excellent work! This sequence follows proper IMRT QA protocol.",
      metadata: {
        knowledgeStars: ["quality_assurance", "IMRT_validation", "treatment_delivery"],
        difficulty: 'INTERMEDIATE'
      }
    }
  ],
  "procedural_hard": [
    {
      text: "Arrange the steps in the correct order for commissioning a new treatment planning system algorithm:",
      steps: [
        "Measure basic beam data (PDD, profiles)",
        "Validate with benchmark cases",
        "Configure beam model in planning system",
        "Perform comprehensive end-to-end testing",
        "Compare model with measurements", 
        "Establish institutional tolerances for plan acceptance"
      ],
      correctOrder: [0, 2, 4, 1, 3, 5],
      feedback: "Outstanding! You've correctly sequenced the complex commissioning process.",
      metadata: {
        knowledgeStars: ["commissioning", "beam_modeling", "treatment_planning_systems", "quality_assurance"],
        difficulty: 'ADVANCED'
      }
    }
  ]
};

// Add sample calculation questions
const TEST_CALCULATION_QUESTIONS: Record<string, any[]> = {
  "calculation_easy": [
    {
      text: "Calculate the equivalent square field size for a rectangular field with dimensions 10 cm × 15 cm.",
      correctAnswer: 12.25,
      tolerance: 0.3, // Allow answers within +/- 0.3 of the correct value
      unit: "cm",
      feedback: "Good job! The equivalent square is calculated using the formula: sqrt(length × width).",
      metadata: {
        knowledgeStars: ["field_size_calculations", "treatment_planning_basics"],
        difficulty: 'BEGINNER'
      }
    }
  ],
  "calculation_medium": [
    {
      text: "A prescription calls for 200 cGy per fraction. If the machine calibration is 1 cGy/MU at reference depth, and the plan calculates a value of 0.956 cGy/MU at the prescription point, how many MUs should be delivered?",
      correctAnswer: 209.2,
      tolerance: 1, // Allow answers within +/- 1 MU
      unit: "MU",
      feedback: "Correct! MUs = Dose ÷ (cGy/MU) = 200 ÷ 0.956 = 209.2 MU",
      metadata: {
        knowledgeStars: ["monitor_units", "dose_calculations"],
        difficulty: 'INTERMEDIATE'
      }
    }
  ],
  "calculation_hard": [
    {
      text: "Calculate the EQD2 for a hypofractionation regimen of 55 Gy in 20 fractions, assuming an α/β ratio of 3 for late-responding tissues.",
      correctAnswer: 63.25,
      tolerance: 1.5, // Allow answers within +/- 1.5 Gy
      unit: "Gy",
      formula: "EQD2 = D × (d + α/β) ÷ (2 + α/β)",
      feedback: "Excellent! Using the formula EQD2 = D × (d + α/β) ÷ (2 + α/β), where D is total dose, d is dose per fraction, and α/β = 3.",
      metadata: {
        knowledgeStars: ["radiobiology", "EQD2", "fractionation"],
        difficulty: 'ADVANCED'
      }
    }
  ]
};

export default function ActivityEngagement() {
  // Get needed state/functions from gameStore directly, avoiding the old `resources` object
  const { currentTime, advanceTime } = useGameStore(); 
  const { 
    insight: currentInsight, // Renamed to currentInsight to avoid conflict if insight was a prop
    starPoints: currentStarPoints, 
    incrementMomentum, 
    resetMomentum, 
    updateInsight, 
    updateStarPoints, 
    canBoast, 
    activateBoast 
  } = useResourceStore();
  
  const { currentActivity, completeActivity } = useActivityStore();
  const { discoverConcept } = useKnowledgeStore.getState(); // Get discoverConcept directly
  
  const [challenge, setChallenge] = useState<any>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [conceptsDiscovered, setConceptsDiscovered] = useState<string[]>([]);
  const [usedTangent, setUsedTangent] = useState(false);
  const [usedBoast, setUsedBoast] = useState(false);
  const [showQuote, setShowQuote] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [allAnswers, setAllAnswers] = useState<boolean[]>([]);
  const [matchingSelections, setMatchingSelections] = useState<number[]>([]);
  const [matchingComplete, setMatchingComplete] = useState(false);
  const [testModeEnabled, setTestModeEnabled] = useState(TEST_MODE_ENABLED);
  const [testQuestionSet, setTestQuestionSet] = useState(SELECTED_TEST_SET);
  const [testQuestionType, setTestQuestionType] = useState(TEST_QUESTION_TYPE);
  const [proceduralOrder, setProceduralOrder] = useState<number[]>([]);
  const [proceduralComplete, setProceduralComplete] = useState(false);
  const [calculationAnswer, setCalculationAnswer] = useState<string>('');
  const [calculationIsValid, setCalculationIsValid] = useState(false);
  
  // Character ID mapping for sprites
  const mentorToCharacterId: Record<MentorId, string> = {
    [MentorId.GARCIA]: 'garcia',
    [MentorId.KAPOOR]: 'kapoor',
    [MentorId.QUINN]: 'quinn',
    [MentorId.JESSE]: 'jesse',
  };
  
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
      
      // Add loading state indicator
      console.log(`Loading questions for activity: ${currentActivity.id}, domain: ${primaryDomain}`);
      
      fetchQuestionsForActivity(currentActivity)
        .then(apiQuestions => {
          if (apiQuestions && apiQuestions.length > 0) {
            try {
              // Transform API questions to the format expected by the component
              const transformedChallenge = transformQuestionsToChallenge(apiQuestions, currentActivity);
              console.log('Setting challenge with transformed questions:', transformedChallenge);
              
              // Log the question types for debugging
              // const questionTypes = transformedChallenge.questions
              //   ? transformedChallenge.questions.map((q: any) => q.type).join(', ')
              //   : 'No questions array found';
              // console.log('Question types in challenge:', questionTypes);
              
              setChallenge(transformedChallenge);
            } catch (transformError) {
              console.error('Error transforming questions:', transformError);
              // Fall back to sample questions if transformation fails
              console.log('Falling back to sample challenges due to transformation error');
              setChallenge(SAMPLE_CHALLENGES[currentActivity.id] || SAMPLE_CHALLENGES.default);
            }
          } else {
            // Fall back to sample questions if API returns no results
            console.log('No questions returned from API, using sample challenges');
            setChallenge(SAMPLE_CHALLENGES[currentActivity.id] || SAMPLE_CHALLENGES.default);
          }
        })
        .catch(error => {
          console.error('Error fetching questions:', error);
          // Fall back to sample questions if API fails
          console.log('Error fetching questions, using sample challenges');
          setChallenge(SAMPLE_CHALLENGES[currentActivity.id] || SAMPLE_CHALLENGES.default);
        });
    }
  }, [currentActivity, testModeEnabled, testQuestionSet, testQuestionType]); // Added test mode dependencies
  
  // Modify the fetchQuestionsForActivity function to handle test mode
  const fetchQuestionsForActivity = async (activity: ActivityOption, overrideBoastType?: 'boast' | 'normal') => {
    try {
      // Use test questions if test mode is enabled
      if (testModeEnabled) {
        console.log(`Test mode enabled, using ${testQuestionType} type, ${testQuestionSet} set`);
        
        // Helper function to map ActivityDifficulty to question Difficulty
        const mapDifficulty = (difficulty: ActivityDifficulty): Difficulty => {
          switch(difficulty) {
            case ActivityDifficulty.EASY: return 'BEGINNER';
            case ActivityDifficulty.MEDIUM: return 'INTERMEDIATE';
            case ActivityDifficulty.HARD: return 'ADVANCED';
            default: return 'BEGINNER';
          }
        };
        
        // Handle multiple choice questions
        if (testQuestionType === 'multipleChoice') {
          const testQuestions = TEST_QUESTIONS[testQuestionSet] || TEST_QUESTIONS["test_easy"];
          
          // Transform to match the Question interface
          return testQuestions.map((q, index) => ({
            id: `test-${testQuestionSet}-${index}`,
            type: 'multipleChoice' as const,
            text: q.text,
            options: q.options.map(o => o.text),
            correctOptionIndices: q.options
              .map((option, index) => option.isCorrect ? index : -1)
              .filter(index => index !== -1),
            correctFeedback: q.options.find(o => o.isCorrect)?.feedback || "Correct!",
            incorrectFeedback: "Incorrect. Try again.",
            metadata: {
              domain: activity.domains[0] ? convertToNewDomain(activity.domains[0]) : 'RADIATION_THERAPY',
              difficulty: mapDifficulty(activity.difficulty),
              tags: [],
              knowledgeStars: q.metadata?.knowledgeStars || []
            }
          }));
        }
        
        // Handle matching questions
        if (testQuestionType === 'matching') {
          const testQuestions = TEST_MATCHING_QUESTIONS[testQuestionSet.replace('test_', 'matching_')] || 
                                TEST_MATCHING_QUESTIONS["matching_easy"];
          
          // Transform to match the MatchingQuestion interface
          return testQuestions.map((q, index) => ({
            id: `test-matching-${index}`,
            type: 'matching' as const,
            text: q.text,
            items: q.items,
            matches: q.matches,
            correctMatchIndices: q.correctMatchIndices,
            correctFeedback: q.feedback || "Great job matching these items!",
            incorrectFeedback: "Some matches were incorrect. Try again.",
            metadata: {
              domain: activity.domains[0] ? convertToNewDomain(activity.domains[0]) : 'RADIATION_THERAPY',
              difficulty: q.metadata?.difficulty || mapDifficulty(activity.difficulty),
              tags: q.metadata?.tags || [],
              knowledgeStars: q.metadata?.knowledgeStars || []
            }
          }));
        }
        
        // Handle procedural questions
        if (testQuestionType === 'procedural') {
          const testSetKey = testQuestionSet.replace('test_', 'procedural_');
          console.log(`Loading procedural questions from set: ${testSetKey}`);
          const testQuestions = TEST_PROCEDURAL_QUESTIONS[testSetKey] || 
                              TEST_PROCEDURAL_QUESTIONS["procedural_easy"];
          
          // Transform to match the ProceduralQuestion interface
          return testQuestions.map((q, index) => ({
            id: `test-procedural-${index}`,
            type: 'procedural' as const,
            text: q.text,
            steps: q.steps,
            correctOrder: q.correctOrder,
            correctFeedback: q.feedback || "Great job ordering these steps correctly!",
            incorrectFeedback: "Some steps are in the wrong order. Try again.",
            metadata: {
              domain: activity.domains[0] ? convertToNewDomain(activity.domains[0]) : 'RADIATION_THERAPY',
              difficulty: q.metadata?.difficulty || mapDifficulty(activity.difficulty),
              tags: q.metadata?.tags || [],
              knowledgeStars: q.metadata?.knowledgeStars || []
            }
          }));
        }
        
        // Handle calculation questions
        if (testQuestionType === 'calculation') {
          const testSetKey = testQuestionSet.replace('test_', 'calculation_');
          console.log(`Loading calculation questions from set: ${testSetKey}`);
          const testQuestions = TEST_CALCULATION_QUESTIONS[testSetKey] || 
                              TEST_CALCULATION_QUESTIONS["calculation_easy"];
          
          // Transform to match the CalculationQuestion interface
          return testQuestions.map((q, index) => ({
            id: `test-calculation-${index}`,
            type: 'calculation' as const,
            text: q.text,
            correctAnswer: q.correctAnswer,
            tolerance: q.tolerance || 0.5,
            unit: q.unit || "",
            formula: q.formula || "",
            correctFeedback: q.feedback || "Great job with the calculation!",
            incorrectFeedback: "Your calculation is incorrect. Check your formula and try again.",
            metadata: {
              domain: activity.domains[0] ? convertToNewDomain(activity.domains[0]) : 'RADIATION_THERAPY',
              difficulty: q.metadata?.difficulty || mapDifficulty(activity.difficulty),
              tags: q.metadata?.tags || [],
              knowledgeStars: q.metadata?.knowledgeStars || []
            }
          }));
        }

      }

      if (activity) {
        // Original implementation for fetching questions
        // Determine primary domain for the activity
        const legacyDomain = activity.domains && activity.domains.length > 0 
          ? activity.domains[0] 
          : KnowledgeDomain.RADIATION_THERAPY; // Default fallback
        
        // Convert to our new Domain type for internal use
        const newDomain = convertToNewDomain(legacyDomain);
        
        // Determine question count based on activity difficulty
        let questionCount = activity.difficulty === ActivityDifficulty.HARD ? 3 :
                            activity.difficulty === ActivityDifficulty.MEDIUM ? 2 : 1;
        
              // If boast is activated, we need to get boast-type questions from the advanced difficulty sets
      // CRITICAL FIX: Use the forceBoast parameter instead of relying on usedBoast state
      let actualQuestionTypeToFetchIsBoast: boolean;
      if (overrideBoastType === 'boast') {
        actualQuestionTypeToFetchIsBoast = true;
      } else if (overrideBoastType === 'normal') {
        actualQuestionTypeToFetchIsBoast = false;
      } else { // undefined, so rely on component state usedBoast
        actualQuestionTypeToFetchIsBoast = usedBoast;
      }

      const questionTypes: QuestionType[] = actualQuestionTypeToFetchIsBoast ? ['boast'] : ['multipleChoice'];
      console.log(`[ActivityEngagement] fetchDecision: actualIsBoast=${actualQuestionTypeToFetchIsBoast}. Derived questionTypes=${JSON.stringify(questionTypes)}. Inputs: overrideBoastType='${overrideBoastType}', usedBoastState=${usedBoast}`);
      const difficultyLevel = actualQuestionTypeToFetchIsBoast ? ActivityDifficulty.HARD : activity.difficulty;
      
      // Extra safeguard for boast questions - log detailed state
      // REMOVE THIS BLOCK START
      // if (actualQuestionTypeToFetchIsBoast) {
      //   console.log(`[ActivityEngagement] 🔍 BOAST DEBUG - Requesting boast questions with:`);
      //   console.log(`[ActivityEngagement]   - Domain: ${legacyDomain}`);
      //   console.log(`[ActivityEngagement]   - Question types: ${questionTypes.join(', ')}`);
      //   console.log(`[ActivityEngagement]   - Difficulty level: ${difficultyLevel}`);
      //   console.log(`[ActivityEngagement]   - Question count: ${questionCount}`);
      // }
      // REMOVE THIS BLOCK END
        
        // Log boast status for debugging
        if (actualQuestionTypeToFetchIsBoast) {
          console.log(`[ActivityEngagement] Fetching BOAST questions for domain ${legacyDomain}, difficulty ${difficultyLevel}`);
          // REMOVE: console.log(`[ActivityEngagement] Using questionTypes:`, questionTypes);
          // REMOVE: console.log(`[ActivityEngagement] Domain mapping: ${legacyDomain} -> ${convertToNewDomain(legacyDomain)}`);
        }
        
        // If using boast, we'll get only 1-2 questions to keep challenge reasonable
        if (actualQuestionTypeToFetchIsBoast) {
          questionCount = Math.min(questionCount, 2);
          
          // Look for boast questions in all domains if we're having trouble finding them
          try {
            // REMOVE: console.log('[ActivityEngagement] Attempting to directly load boast questions from advanced difficulty');
            
            // Try each domain to find boast questions
            for (const domain of Object.values(KnowledgeDomain)) {
              // Import the loadQuestions function directly to bypass questionManager
              const { loadQuestions } = await import('@/app/core/questions/questionLoader');
              
              try {
                // Try to load advanced questions for this domain
                const advancedQuestions = await loadQuestions(domain, 'advanced');
                
                // Filter for boast questions
                const boastQuestions = advancedQuestions.questions.filter((q: any) => q.type === 'boast');
                
                // REMOVE: console.log(`[ActivityEngagement] Domain ${domain}: found ${boastQuestions.length} boast questions`);
                
                // If we found boast questions, use them
                if (boastQuestions.length > 0) {
                  // REMOVE: console.log('[ActivityEngagement] Successfully found boast questions');
                  
                  // Return a reasonable number of boast questions
                  const selectedBoastQuestions = boastQuestions.slice(0, questionCount);
                  
                  // If this domain matches the activity domain, prefer mentor-specific questions
                  if (domain === legacyDomain && activity.mentor) {
                    const mentorBoastQuestions = selectedBoastQuestions.filter(
                      (q: any) => q.tags?.mentor === activity.mentor
                    );
                    
                    if (mentorBoastQuestions.length > 0) {
                      console.log(`[ActivityEngagement] Found ${mentorBoastQuestions.length} mentor-specific boast questions`);
                      return mentorBoastQuestions;
                    }
                  }
                  
                  return selectedBoastQuestions;
                }
              } catch (err) {
                console.log(`[ActivityEngagement] Error loading advanced questions for domain ${domain}:`, err);
              }
            }
          } catch (err) {
            console.error('[ActivityEngagement] Error directly loading boast questions:', err);
          }
        }
        
        // Use the selectActivityQuestions function to get appropriate questions
        // Cast legacy domain back for backward compatibility with the function
        const questions = await selectActivityQuestions(
          legacyDomain as any, // Use legacy domain and cast as any for compatibility
          difficultyLevel,
          questionCount,
          questionTypes, // Use boast type for boast questions
          activity.mentor // Pass the mentor to help with question selection
        );
        
        // Log the questions we received for debugging
        if (actualQuestionTypeToFetchIsBoast) {
          console.log(`[ActivityEngagement] Received ${questions.length} BOAST questions.`); // MADE CONCISE
          // REMOVE: questions.map(q => ({ id: q.id, type: q.type, mentor: (q as any).tags?.mentor || 'none' })));
        }
        
        return questions;
      }
      return [];
    } catch (error) {
      console.error('Error fetching questions for activity:', error);
      return []; // Return empty array instead of throwing to allow fallback
    }
  };
  
  // Transform API questions to the challenge format expected by the component
  const transformQuestionsToChallenge = (apiQuestions: Question[], activity: ActivityOption): any => {
    try {
      // Ensure we have an array of questions
      if (!Array.isArray(apiQuestions) || apiQuestions.length === 0) {
        console.warn('No API questions to transform, using sample challenges');
        return SAMPLE_CHALLENGES[activity.id] || SAMPLE_CHALLENGES.default;
      }
      
      // Get the activity mentor for mentor-specific content
      const activityMentor = activity.mentor;
      
      // Create a list of all mentor names for replacement
      const allMentorNames = Object.values(MentorId);
      
      // Helper function to replace any mentor name with the activity's mentor
      const replaceMentorReferences = (text: string): string => {
        if (!activityMentor || !text) return text;
        
        let result = text;
        // Replace all mentor names except the activity mentor
        allMentorNames.forEach(mentorName => {
          if (mentorName !== activityMentor) {
            // Use a regex that matches the mentor name as a whole word
            const regex = new RegExp(`\\b${mentorName}\\b`, 'g');
            if (regex.test(result)) {
              // console.log(`Replacing mentor reference from "${mentorName}" to "${activityMentor}" in text`);
              result = result.replace(regex, activityMentor);
            }
          }
        });
        
        return result;
      };
      
      // Check for boast-type questions first (prioritize these for boast challenges)
      const hasBoastQuestions = apiQuestions.some(q => q.type === 'boast');
      
      if (hasBoastQuestions) {
        // console.log('Found boast-type questions in API response:', 
        //   apiQuestions.filter(q => q.type === 'boast').length);
        
        // Handle boast questions
        const boastQuestions = apiQuestions.filter((q: any) => q.type === 'boast');
        
        if (boastQuestions.length > 0) {
          // try {
          //   // console.log('Sample boast question raw structure:', boastQuestions[0]);
          //   // console.log('Sample boast question type:', boastQuestions[0].type);
          //   // console.log('Sample boast question options structure:', (boastQuestions[0] as any).options);
          //   // 
          //   // // Check specifically for question schema from advanced.json files
          //   // if ((boastQuestions[0] as any).question && (boastQuestions[0] as any).options) {
          //   //   console.log('Found boast question in advanced.json schema format');
          //   // }
          //   // 
          //   // // Check if feedback exists
          //   // if ((boastQuestions[0] as any).feedback) {
          //   //   console.log('Feedback structure:', (boastQuestions[0] as any).feedback);
          //   // }
          // } catch (err) {
          //   // console.error('Error inspecting boast question structure:', err);
          // }
          
          // Transform the boast questions into the challenge format
          const boastChallenge = {
            questions: boastQuestions.map((q: any) => {
              try {
                // Get the question text from the appropriate field
                let questionText = '';
                if ((q as any).question) {
                  questionText = (q as any).question;
                } else if (q.text) {
                  questionText = q.text;
                }
                
                // Replace mentor references in the question text
                questionText = replaceMentorReferences(questionText);
                
                // Get options with proper handling for different formats in advanced.json files
                let options = [];
                
                // Add more detailed logging to debug options processing
                // console.log(`Boast question option processing for question ID: ${(q as any).id}`);
                // console.log(`Options:`, (q as any).options);
                
                // Handle the format found in the advanced.json files
                if (Array.isArray((q as any).options)) {
                  options = (q as any).options.map((opt: any, index: number) => {
                    // console.log(`Processing option ${index}:`, opt);
                    
                    // Handle option structure from advanced.json
                    if (typeof opt === 'object' && opt !== null) {
                      // Check if the option has 'id' and 'text' properties (JSON file format)
                      if (opt.id !== undefined && opt.text) {
                        // console.log(`Option ${index} using JSON format with id=${opt.id}, isCorrect=${!!opt.isCorrect}`);
                        
                        // Get feedback from the question's feedback object
                        let feedback = '';
                        if ((q as any).feedback) {
                          feedback = opt.isCorrect 
                            ? ((q as any).feedback.correct || "Correct!")
                            : ((q as any).feedback.incorrect || "Incorrect!");
                          // console.log(`Using feedback: ${feedback.substring(0, 20)}...`);
                        }
                        
                        return {
                          text: replaceMentorReferences(opt.text),
                          correct: !!opt.isCorrect,
                          feedback: replaceMentorReferences(feedback)
                        };
                      }
                      
                      // Standard object format
                      // console.log(`Option ${index} using standard object format`);
                      return {
                        text: replaceMentorReferences(opt.text || ''),
                        correct: !!opt.isCorrect,
                        feedback: opt.feedback ? replaceMentorReferences(opt.feedback) : ''
                      };
                    } else if (typeof opt === 'string') {
                      // Simple string option (unlikely in boast questions, but handle just in case)
                      // console.log(`Option ${index} is a simple string: ${opt}`);
                      return {
                        text: replaceMentorReferences(opt),
                        correct: false, // Default to false unless we know otherwise
                        feedback: ''
                      };
                    }
                    
                    // Fallback for unknown format
                    return {
                      text: 'Option text missing',
                      correct: false,
                      feedback: ''
                    };
                  });
                }
                
                const result = {
                  content: questionText,
                  options: options
                };
                
                // Log the transformed result for debugging
                // console.log('Transformed boast question:', result);
                
                return result;
              } catch (err) {
                console.error('Error transforming individual boast question:', err);
                // Return a placeholder question if transformation fails
                return {
                  content: "Error loading question",
                  options: [
                    { text: "Error", correct: true, feedback: "Please try again" }
                  ]
                };
              }
            }),
            concepts: Array.from(new Set(
              boastQuestions.flatMap((q: any) => 
                q.metadata?.knowledgeStars || []
              )
            )) as string[],
            difficulty: ActivityDifficulty.HARD // Always set HARD difficulty for boast questions
          };
          
          // console.log("Created boast challenge with HARD difficulty:", boastChallenge.difficulty);
          return boastChallenge;
        }
      }
      
      // Check for calculation questions
      const hasCalculationQuestions = apiQuestions.some(q => q.type === 'calculation');
      
      if (hasCalculationQuestions) {
        // Handle calculation questions
        const calculationQuestions = apiQuestions.filter(q => q.type === 'calculation') as any[];
        
        if (calculationQuestions.length > 0) {
          // Transform the calculation questions into the challenge format
          return {
            questions: calculationQuestions.map(q => {
              const questionText = replaceMentorReferences(q.text || "");
              
              return {
                content: questionText,
                type: 'calculation',
                correctAnswer: q.correctAnswer || 0,
                tolerance: q.tolerance || 0.5,
                unit: q.unit || "",
                formula: q.formula || "",
                feedback: q.correctFeedback || q.feedback || "Great job with the calculation!",
                incorrectFeedback: q.incorrectFeedback || "Your calculation is incorrect. Try again next time!"
              };
            }),
            concepts: Array.from(new Set(
              calculationQuestions.flatMap((q: any) => 
                q.metadata?.knowledgeStars || []
              )
            )) as string[],
            difficulty: activity.difficulty
          };
        }
      }
      
      // Check for procedural questions
      const hasProceduralQuestions = apiQuestions.some(q => q.type === 'procedural');
      
      if (hasProceduralQuestions) {
        // Handle procedural questions
        const proceduralQuestions = apiQuestions.filter(q => q.type === 'procedural') as any[];
        
        if (proceduralQuestions.length > 0) {
          // Transform the procedural questions into the challenge format
          return {
            questions: proceduralQuestions.map((q: any) => {
              const questionText = replaceMentorReferences(q.text || "");
              
              return {
                content: questionText,
                type: 'procedural',
                steps: q.steps || [],
                correctOrder: q.correctOrder || [],
                feedback: q.correctFeedback || "Great job ordering these steps correctly!",
                incorrectFeedback: q.incorrectFeedback || "The steps are not in the correct order."
              };
            }),
            concepts: Array.from(new Set(
              proceduralQuestions.flatMap((q: any) => 
                q.metadata?.knowledgeStars || []
              )
            )) as string[],
            difficulty: activity.difficulty
          };
        }
      }
      
      // Check for matching questions
      const hasMatchingQuestions = apiQuestions.some(q => q.type === 'matching');
      
      if (hasMatchingQuestions) {
        // Handle matching questions
        const matchingQuestions = apiQuestions.filter(q => q.type === 'matching') as any[];
        
        if (matchingQuestions.length > 0) {
          // Transform the matching questions into the challenge format
          return {
            questions: matchingQuestions.map(q => {
              const questionText = replaceMentorReferences(q.text || "");
              
              return {
                content: questionText,
                type: 'matching',
                items: q.items || [],
                matches: q.matches || [],
                correctMatchIndices: q.correctMatchIndices || [],
                feedback: q.correctFeedback || "Great job matching these items!"
              };
            }),
            concepts: Array.from(new Set(
              matchingQuestions.flatMap((q: any) => 
                q.metadata?.knowledgeStars || []
              )
            )) as string[],
            difficulty: activity.difficulty
          };
        }
      }
      
      // Filter to only use multiple choice questions with proper validation
      const multipleChoiceQuestions = apiQuestions.filter((q: Question) => { // Assuming Question type is appropriate here
        if (!q) return false;
        if (q.type !== 'multipleChoice') return false;
        
        // Ensure the question has the required properties
        const mcq = q as any; // Still might need 'as any' for specific property access if not in Question
        
        // Check if the question has options
        if (!Array.isArray(mcq.options) || mcq.options.length === 0) {
          return false;
        }
        
        // Filter based on mentor compatibility if specified
        if (activityMentor && mcq.mentor && mcq.mentor !== activityMentor) {
          return false;
        }
        
        return true;
      }) as MultipleChoiceQuestion[];
      
      if (multipleChoiceQuestions.length === 0) {
        console.warn('No valid multiple choice questions found, using sample challenges');
        return SAMPLE_CHALLENGES[activity.id] || SAMPLE_CHALLENGES.default;
      }
      
      // Determine number of questions based on activity difficulty
      const questionCount = activity.difficulty === ActivityDifficulty.HARD ? 3 :
                          activity.difficulty === ActivityDifficulty.MEDIUM ? 2 : 1;
      
      // Transform to the format expected by the component
      const transformedQuestions = multipleChoiceQuestions
        .slice(0, questionCount)
        .map(q => {
          // Get the question text from the appropriate field - Handle both older and newer schemas
          // In some versions it might be 'text', in others it might be stored in a different property
          let questionText = q.text || 
                           (q as any).question || // Access as any to avoid type errors
                           "";
          
          // Replace mentor references in the question text
          questionText = replaceMentorReferences(questionText);
          
          // Safely extract options with validation
          const options = Array.isArray(q.options) ? q.options : [];
          
          return {
            content: questionText,
            options: options.map((option: any, index) => {
              // Handle both question formats (correctOptionIndices array or isCorrect property on option objects)
              let isCorrect = false;
              
              if (Array.isArray(q.correctOptionIndices)) {
                isCorrect = q.correctOptionIndices.includes(index);
              } else if (typeof option === 'object' && option !== null) {
                isCorrect = !!option.isCorrect;
              }
              
              // Handle different option formats (string or object with text property)
              let optionText = "";
              if (typeof option === 'string') {
                optionText = option;
              } else if (typeof option === 'object' && option !== null) {
                optionText = option.text || option.toString() || "";
              }
              
              // Replace mentor references in option text
              optionText = replaceMentorReferences(optionText);
              
              // Get appropriate feedback
              let feedback = isCorrect 
                ? (q.correctFeedback || "Correct answer!") 
                : (q.incorrectFeedback || "Incorrect answer.");
                
              // Replace mentor references in feedback
              feedback = replaceMentorReferences(feedback);
              
              return {
                text: optionText,
                correct: isCorrect,
                feedback: feedback
              };
            })
          };
        });
      
      // Collect unique concepts across the selected questions
      const concepts = Array.from(new Set(
        multipleChoiceQuestions.flatMap((q: Question) =>  // Explicitly type q as Question
          q.metadata?.knowledgeStars || []
        )
      )) as string[];

      return {
        questions: transformedQuestions,
        concepts,
        difficulty: activity.difficulty
      };
    } catch (error) {
      console.error('Error transforming questions:', error);
      // Fall back to sample challenges on error
      return SAMPLE_CHALLENGES[activity.id] || SAMPLE_CHALLENGES.default;
    }
  };
  
  // Function to get the current question without modifying state
  const getCurrentQuestion = () => {
    if (challenge?.questions && challenge.questions.length > 0) {
      return challenge.questions[currentQuestionIndex];
    }
    // For backward compatibility with single-question challenges
    return challenge;
  };
  
  // Use effect to handle initialization of state based on question type
  useEffect(() => {
    const currentQuestion = getCurrentQuestion();
    if (!currentQuestion) return;
    
    // Reset common state when question changes
    setSelectedOption(null);
    setShowFeedback(false);
    
    // Handle specific question types
    if (currentQuestion.type === 'matching') {
      // Initialize with -1 (no selection) for each item
      const initialSelections = Array(currentQuestion.items?.length || 0).fill(-1);
      setMatchingSelections(initialSelections);
      setMatchingComplete(false);
    }
    else if (currentQuestion.type === 'procedural') {
      // Initialize with shuffled order
      const steps = currentQuestion.steps || [];
      const initialOrder = Array.from({ length: steps.length }, (_, i) => i);
      // Shuffle the array
      for (let i = initialOrder.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [initialOrder[i], initialOrder[j]] = [initialOrder[j], initialOrder[i]];
      }
      setProceduralOrder(initialOrder);
      setProceduralComplete(false);
    }
    else if (currentQuestion.type === 'calculation') {
      // Reset calculation state
      setCalculationAnswer('');
      setCalculationIsValid(false);
    }
  }, [currentQuestionIndex, challenge]);
  
  // No activity to show
  if (!currentActivity || !challenge) {
    return null;
  }
  
  const currentQuestion = getCurrentQuestion();
  const hasMultipleQuestions = challenge.questions && challenge.questions.length > 1;
  const isLastQuestion = !hasMultipleQuestions || currentQuestionIndex === challenge.questions.length - 1;
  
  // Handle option selection
  const handleOptionSelect = (optionIndex: number) => {
    setSelectedOption(optionIndex);
    setShowFeedback(true);
    
    const option = currentQuestion.options[optionIndex];
    const success = option.correct;
    
    // Track answers for multi-question challenges
    if (hasMultipleQuestions) {
      setAllAnswers([...allAnswers, success]);
    }
    
    // Get current momentum level and insight multiplier
    const momentumLevel = useResourceStore.getState()._getMomentumLevel();
    const insightMultiplier = useResourceStore.getState().getInsightMultiplier();
    
    // Update resources based on success
    if (success) {
      // Add momentum for correct answers
      incrementMomentum('correct_answer');
      
      // Add insight based on difficulty
      let baseInsightGain = getInsightRewardForActivity(challenge.difficulty || ActivityDifficulty.EASY);
      
      // Apply momentum multiplier
      let finalInsightGain = Math.round(baseInsightGain * insightMultiplier);
      
      // Apply boast multiplier (if active) on top of momentum multiplier
      if (usedBoast) {
        finalInsightGain = Math.floor(finalInsightGain * 1.5);
        
        // Update mentor relationship points for successful boast
        handleMentorInteraction(currentActivity.mentor, 'boast_success');
        
        // Dispatch boast success event
        centralEventBus.dispatch(
          GameEventType.BOAST_SUCCEEDED,
          {
            insightGained: finalInsightGain,
            mentor: currentActivity.mentor,
            source: 'activity_engagement'
          },
          'activity_engagement.handleOptionSelect'
        );
      }
      
      // Generate reward message
      let rewardMessage = `+${finalInsightGain} Insight`;
      if (momentumLevel > 1) {
        const momentumBonus = Math.round(baseInsightGain * (insightMultiplier - 1));
        rewardMessage += ` (includes +${momentumBonus} from Level ${momentumLevel} Momentum)`;
      }
      
      // Update insight with the total amount
      updateInsight(baseInsightGain, 'activity_correct_answer');
      
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
          });
        }
      }
      
      // Random chance to earn Star Points with momentum-enhanced probability
      const spChance = usedBoast ? 0.2 : getStarPointChance(challenge.difficulty, momentumLevel);
      if (Math.random() < spChance) {
        const spGained = challenge.difficulty === ActivityDifficulty.HARD ? 2 : 1;
        // Use resourceStore for star points
        updateStarPoints(spGained, 'activity_bonus');
      }
      
      // For correct answers, there's a chance to improve mentor relationship
      // This happens regardless of boast status but is handled separately from boast outcomes
      if (!usedBoast) {
        // For general (non-boast) correct answers, log a general mentor interaction
        handleMentorInteraction(currentActivity.mentor, 'general');
      }
    } else {
      // Reset momentum for incorrect answers
      resetMomentum('incorrect_answer');
      
      if (usedBoast) {
        // Update mentor relationship points for failed boast
        handleMentorInteraction(currentActivity.mentor, 'boast_failure');
        
        // If boast was used but answer was wrong, emit failure event
        centralEventBus.dispatch(
          GameEventType.BOAST_FAILED,
          {
            mentor: currentActivity.mentor,
            source: 'activity_engagement'
          },
          'activity_engagement.handleOptionSelect'
        );
      }
    }
  };
  
  // Define helper function to get base insight reward based on activity difficulty
  const getInsightRewardForActivity = (difficulty: ActivityDifficulty): number => {
    switch (difficulty) {
      case ActivityDifficulty.EASY:
        return 10; // Base reward for easy questions
      case ActivityDifficulty.MEDIUM:
        return 20; // Medium difficulty gives more insight
      case ActivityDifficulty.HARD:
        return 30; // Hard questions give the most insight
      default:
        return 10; // Default to easy reward
    }
  };

  // Helper function to determine star point chance based on difficulty and momentum level
  const getStarPointChance = (difficulty: ActivityDifficulty, momentumLevel: number): number => {
    let baseChance = 0;
    
    // Base chance by difficulty
    switch (difficulty) {
      case ActivityDifficulty.EASY:
        baseChance = 0.05; // 5% chance
        break;
      case ActivityDifficulty.MEDIUM:
        baseChance = 0.10; // 10% chance
        break;
      case ActivityDifficulty.HARD:
        baseChance = 0.15; // 15% chance
        break;
      default:
        baseChance = 0.05;
    }
    
    // Momentum level bonus
    if (momentumLevel === 2) {
      baseChance += 0.05; // +5% at level 2
    } else if (momentumLevel === 3) {
      baseChance += 0.10; // +10% at level 3
    }
    
    return baseChance;
  };
  
  // Helper function to track mentor interactions and update relationships
  const handleMentorInteraction = (
    mentorId: MentorId | undefined, 
    interactionType: 'general' | 'boast_success' | 'boast_failure',
    source: string = 'activity_engagement'
  ) => {
    if (!mentorId) {
      return; // No mentor associated with this activity
    }
    
    // Get required methods from relationship store
    const relationshipStore = useRelationshipStore.getState();
    
    // Log the interaction
    relationshipStore.logMentorInteraction(mentorId, source);
    
    // Update relationship points based on interaction type
    switch (interactionType) {
      case 'boast_success':
        relationshipStore.increaseRelationshipOnBoastSuccess(mentorId, source);
        console.log(`[ActivityEngagement] Increased relationship with ${mentorId} for successful boast`);
        break;
      case 'boast_failure':
        relationshipStore.decreaseRelationshipOnBoastFailure(mentorId, source);
        console.log(`[ActivityEngagement] Decreased relationship with ${mentorId} for failed boast`);
        break;
      case 'general':
        // For general interactions, very small chance to gain a point (5%)
        if (Math.random() < 0.05) {
          relationshipStore.updateRelationship(mentorId, 1, source);
          console.log(`[ActivityEngagement] Small relationship gain with ${mentorId} from general interaction`);
        }
        break;
    }
  };
  
  // Add a new handler for continuing after feedback
  const handleContinue = () => {
    setShowFeedback(false);
    
    // If we're in boast mode, we want to reset after ONE question
    const isBoastActive = usedBoast;
    
    // For multi-question challenges that aren't on the last question
    if (hasMultipleQuestions && !isLastQuestion) {
      // If this was a boast question, reset boast mode and reload regular questions
      if (isBoastActive) {
        console.log("[ActivityEngagement] Resetting boast mode after completing one boast question");
        setUsedBoast(false);
        
        // Reload normal questions for the activity
        fetchQuestionsForActivity(currentActivity, 'normal')
          .then(apiQuestions => {
            if (apiQuestions && apiQuestions.length > 0) {
              const transformedChallenge = transformQuestionsToChallenge(apiQuestions, currentActivity);
              setChallenge(transformedChallenge);
              // Reset to first question of the new normal challenge
              setCurrentQuestionIndex(0);
              setSelectedOption(null);
            }
          })
          .catch(error => {
            console.error("Error loading normal questions after boast:", error);
          });
        return;
      }
      
      // Regular case - move to next question
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
    
    // Always reset boast status when completing a question or activity
    setUsedBoast(false);
    
    // Complete the activity
    completeActivity(success);
    
    // Log a mentor interaction for successfully completing an activity 
    if (success && currentActivity.mentor) {
      handleMentorInteraction(currentActivity.mentor, 'general', 'activity_completion');
    }
    
    centralEventBus.dispatch(
      success ? GameEventType.ACTIVITY_COMPLETED : GameEventType.ACTIVITY_COMPLETED, // Temporarily using ACTIVITY_COMPLETED for failed case
      { 
        activityId: currentActivity.id,
        mentor: currentActivity.mentor,
        success: success 
      },
      'ActivityEngagement.handleContinue'
    );
  };
  
  // Handle Tangent ability usage
  const handleTangent = () => {
    if (currentInsight >= 25) { // Check insight from resourceStore
      updateInsight(-25, 'tangent_cost'); // Use resourceStore to spend insight
      
      const tangentChallengeId = `${currentActivity.id}_tangent`;
      const tangentChallenge = SAMPLE_CHALLENGES[tangentChallengeId] || SAMPLE_CHALLENGES.default; // Fallback
      
      setChallenge(tangentChallenge);
      setSelectedOption(null);
      setShowFeedback(false);
      setConceptsDiscovered([]); // Reset concepts for the new tangent challenge
      setUsedTangent(true);
      centralEventBus.dispatch(GameEventType.TANGENT_USED, { activityId: currentActivity.id, newChallengeId: tangentChallengeId, source: 'activity_engagement'}, 'ActivityEngagement.handleTangent');
    }
  };
  
  // Handle Boast ability usage
  const handleBoast = () => {
    if (canBoast()) { // canBoast from resourceStore checks momentum and insight
      console.log("[ActivityEngagement] handleBoast triggered, activating boast");
      
      // IMPORTANT: Don't call activateBoast here - it's already called by BoastButton
      // This prevents double-deduction of insight points
      const boastActivated = true; // Skip calling activateBoast again
      if (boastActivated) {
        console.log("[ActivityEngagement] Boast activation successful, fetching boast questions");
        
        // Set state first
        setUsedBoast(true);
        setSelectedOption(null);
        setShowFeedback(false);
        setConceptsDiscovered([]);
        setCurrentQuestionIndex(0); // Reset to first question
        setAllAnswers([]);
        
        // CRITICAL FIX: Don't rely on usedBoast state - use forceBoast=true parameter
        console.log("[ActivityEngagement] Calling fetchQuestionsForActivity with overrideBoastType='boast'");
        
        // Call fetchQuestionsForActivity with overrideBoastType='boast' to ensure we get boast questions
        fetchQuestionsForActivity(currentActivity, 'boast')
          .then(apiQuestions => {
            console.log("[ActivityEngagement] Boast questions received:", 
              apiQuestions.map((q: any) => ({ id: q.id, type: q.type })));
            
            if (apiQuestions && apiQuestions.length > 0) {
              try {
                const transformedChallenge = transformQuestionsToChallenge(apiQuestions, currentActivity);
                // console.log("[ActivityEngagement] Transformed boast challenge:", transformedChallenge);
                
                // Force HARD difficulty for boast challenges, regardless of original activity difficulty
                transformedChallenge.difficulty = ActivityDifficulty.HARD;
                // console.log("[ActivityEngagement] Setting final boast challenge difficulty to HARD");
                
                setChallenge(transformedChallenge);
              } catch (error) {
                console.error('Error transforming boast questions:', error);
                // Fall back to sample boast if available
                const boastChallengeId = `${currentActivity.id}_boast`;
                const boastChallenge = SAMPLE_CHALLENGES[boastChallengeId] || 
                                     (challenge ? { ...challenge, difficulty: ActivityDifficulty.HARD } : SAMPLE_CHALLENGES.default);
                setChallenge(boastChallenge);
              }
            } else {
              // console.log("[ActivityEngagement] No boast questions received, falling back to sample challenges");
              // Fall back to sample boast
              const boastChallengeId = `${currentActivity.id}_boast`;
              const boastChallenge = SAMPLE_CHALLENGES[boastChallengeId] || 
                                   (challenge ? { ...challenge, difficulty: ActivityDifficulty.HARD } : SAMPLE_CHALLENGES.default);
              setChallenge(boastChallenge);
            }
          })
          .catch(error => {
            console.error('Error fetching boast questions:', error);
            // Fall back to sample boast
            const boastChallengeId = `${currentActivity.id}_boast`;
            const boastChallenge = SAMPLE_CHALLENGES[boastChallengeId] || 
                                 (challenge ? { ...challenge, difficulty: ActivityDifficulty.HARD } : SAMPLE_CHALLENGES.default);
            setChallenge(boastChallenge);
          });
        
        centralEventBus.dispatch(GameEventType.BOAST_ACTIVATED, { activityId: currentActivity.id, source: 'activity_engagement' }, 'ActivityEngagement.handleBoast');
      } else {
        console.log("[ActivityEngagement] Boast activation failed");
      }
    } else {
      // Use resourceStore's values directly for logging
      const { momentum, insight } = useResourceStore.getState();
      console.log("[ActivityEngagement] Cannot boast: momentum=" + momentum + ", insight=" + insight);
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
  const canUseTangent = currentInsight >= 25 && !usedTangent && !usedBoast && !showFeedback; // Use currentInsight
  // Updated to use ResourceStore's canBoast for both momentum level and insight requirements
  const canUseBoastAbility = canBoast() && !usedBoast && !usedTangent && !showFeedback; // Renamed to avoid conflict with `usedBoast` state
  
  // Render matching question UI
  const renderMatchingQuestion = (question: any) => {
    const { items, matches, correctMatchIndices } = question;
    
    // Function to check if all items are matched
    const checkAllMatched = () => matchingSelections.filter(i => i !== -1).length === items.length;
    
    // Function to check if selections are correct
    const checkCorrectSelections = () => {
      return matchingSelections.every((matchIndex, i) => 
        matchIndex === correctMatchIndices[i]
      );
    };
    
    // Handle selection of a match for an item
    const handleMatchSelect = (itemIndex: number, matchIndex: number) => {
      if (showFeedback) return; // Don't allow changes after showing feedback
      
      const newSelections = [...matchingSelections];
      
      // If this match is already selected somewhere else, clear that selection
      const existingItemIndex = newSelections.indexOf(matchIndex);
      if (existingItemIndex !== -1) {
        newSelections[existingItemIndex] = -1;
      }
      
      // Set the new selection
      newSelections[itemIndex] = matchIndex;
      setMatchingSelections(newSelections);
      
      // Check if all items are matched
      if (newSelections.filter(i => i !== -1).length === items.length) {
        setMatchingComplete(true);
      } else {
        setMatchingComplete(false);
      }
    };
    
    // Submit the matching answers
    const handleSubmitMatching = () => {
      if (!matchingComplete) return; // Ensure all items are matched

      const currentQ = getCurrentQuestion();
      if (currentQ.type !== 'matching') return;

      // Check correctness (example: all selections match correctMatchIndices)
      const isCorrect = matchingSelections.every((matchIndex, i) => matchIndex === currentQ.correctMatchIndices[i]);
      
      setShowFeedback(true);
      if (hasMultipleQuestions) {
        setAllAnswers([...allAnswers, isCorrect]);
      }

      if (isCorrect) {
        incrementMomentum('correct_answer');
        let insightGain = challenge.difficulty === ActivityDifficulty.EASY ? 10 :
                          challenge.difficulty === ActivityDifficulty.MEDIUM ? 20 : 30;
        if (usedBoast) insightGain = Math.floor(insightGain * 1.5);
        updateInsight(insightGain, 'activity_correct_answer');

        if ((!hasMultipleQuestions || isLastQuestion) && (currentQ.metadata?.knowledgeStars || challenge.concepts)?.length > 0) {
          const conceptsToDiscover = currentQ.metadata?.knowledgeStars || challenge.concepts || [];
          const uniqueConcepts = Array.from(new Set(conceptsToDiscover)) as string[];
          setConceptsDiscovered(uniqueConcepts);
          uniqueConcepts.forEach(conceptId => discoverConcept(conceptId, 'activity_engagement'));
        }
        if (Math.random() < (usedBoast ? 0.2 : 0.1)) {
          updateStarPoints(challenge.difficulty === ActivityDifficulty.HARD ? 2 : 1, 'activity_bonus');
        }
      } else {
        resetMomentum('incorrect_answer');
        if (usedBoast) centralEventBus.dispatch(GameEventType.BOAST_FAILED, { source: 'activity_engagement' }, 'activity_engagement.handleSubmitMatching');
      }
    };
    
    return (
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
        
        {/* Question text */}
        <div style={{ 
          color: 'rgba(255, 255, 255, 0.85)',
          marginBottom: spacing.lg,
          fontSize: typography.fontSize.sm,
          lineHeight: '1.5',
          padding: `${spacing.xs} ${spacing.sm}`,
          backgroundColor: 'rgba(30, 40, 60, 0.3)',
          borderRadius: spacing.xs
        }}>
          <TypewriterText
            key={`matching-question-${currentQuestionIndex}-${challenge?.id || 'default'}`}
            text={question.content || ''}
            speed={30}
            clickToSkip={true}
            style={{
              fontSize: typography.fontSize.sm,
              lineHeight: '1.5',
              color: 'rgba(255, 255, 255, 0.85)'
            }}
          />
        </div>
        
        {/* Matching interface */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: spacing.md, // Keep existing gap between rows
          flex: 1
        }}>
          {items.map((item: string, itemIndex: number) => (
            <div key={itemIndex} style={{
              display: 'flex',
              alignItems: 'center',
              gap: spacing.sm, // Reduced gap between item/line/dropdown
              padding: `${spacing.xs} ${spacing.sm}`, // Adjusted padding
              backgroundColor: 'rgba(30, 40, 60, 0.5)',
              borderRadius: spacing.sm,
              border: borders.thin
            }}>
              {/* Left side - Item */}
              <div style={{
                flex: 1,
                padding: spacing.sm,
                backgroundColor: 'rgba(20, 30, 50, 0.7)',
                borderRadius: spacing.xs,
                fontWeight: 'bold',
                textAlign: 'right' // Align text to the right for better connection
              }}>
                {item}
              </div>
              
              {/* Connection line */}
              <div style={{
                width: '20px', // Slightly shorter line
                height: '2px',
                backgroundColor: matchingSelections[itemIndex] !== undefined && matchingSelections[itemIndex] !== -1 
                  ? colors.highlight 
                  : colors.inactive,
                borderRadius: '1px' // Rounded ends
              }} />
              
              {/* Right side - Match dropdown */}
              <div style={{
                flex: 1,
                position: 'relative'
              }}>
                <select
                  value={matchingSelections[itemIndex] !== undefined ? matchingSelections[itemIndex] : -1}
                  onChange={(e) => handleMatchSelect(itemIndex, parseInt(e.target.value))}
                  disabled={showFeedback}
                  style={{
                    width: '100%',
                    padding: spacing.sm,
                    backgroundColor: showFeedback 
                      ? (matchingSelections[itemIndex] === correctMatchIndices[itemIndex] 
                          ? 'rgba(39, 174, 96, 0.3)'
                          : 'rgba(231, 76, 60, 0.3)')
                      : 'rgba(20, 30, 50, 0.7)',
                    color: colors.text,
                    border: showFeedback 
                      ? `2px solid ${matchingSelections[itemIndex] === correctMatchIndices[itemIndex] 
                          ? colors.active 
                          : colors.error}` 
                      : borders.medium,
                    borderRadius: spacing.xs,
                    fontFamily: typography.fontFamily.pixel,
                    fontSize: typography.fontSize.sm,
                    cursor: showFeedback ? 'default' : 'pointer',
                    appearance: 'none',
                    overflow: 'hidden', // Helps with text overflow, though limited
                    textOverflow: 'ellipsis' // Standard way to show truncation
                  }}
                >
                  <option value="-1">-- Select a match --</option>
                  {matches.map((match: string, matchIndex: number) => (
                    <option
                      key={matchIndex}
                      value={matchIndex}
                      disabled={showFeedback || (matchingSelections.includes(matchIndex) && matchingSelections[itemIndex] !== matchIndex)}
                      title={match} // Add title attribute for hover text
                    >
                      {match}
                    </option>
                  ))}
                </select>
                
                {/* Feedback indicator */}
                {showFeedback && (
                  <span style={{
                    position: 'absolute',
                    right: spacing.xs,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: typography.fontSize.md,
                    color: matchingSelections[itemIndex] === correctMatchIndices[itemIndex] ? colors.active : colors.error
                  }}>
                    {matchingSelections[itemIndex] === correctMatchIndices[itemIndex] ? '✓' : '✗'}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
        
        {/* Submit button */}
        {!showFeedback && (
          <button
            onClick={handleSubmitMatching}
            className="submit-button"
            disabled={!matchingComplete}
            style={{
              marginTop: spacing.lg,
              padding: `${spacing.sm} ${spacing.md}`,
              backgroundColor: matchingComplete ? colors.highlight : 'rgba(30, 40, 60, 0.5)',
              color: matchingComplete ? colors.text : colors.inactive,
              border: borders.medium,
              borderRadius: spacing.xs,
              cursor: matchingComplete ? 'pointer' : 'not-allowed',
              fontFamily: typography.fontFamily.pixel,
              textShadow: matchingComplete ? typography.textShadow.pixel : 'none',
              letterSpacing: '0.5px',
              fontWeight: 'bold',
              width: '100%',
              opacity: matchingComplete ? 1 : 0.7
            }}
          >
            Submit Matches
          </button>
        )}
        
        {/* Feedback Section */}
        {showFeedback && (
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
              color: checkCorrectSelections() ? colors.active : colors.error,
              margin: 0,
              fontSize: typography.fontSize.sm,
              fontWeight: 'bold',
              padding: spacing.xs,
              textShadow: checkCorrectSelections()
                ? '0 0 5px rgba(39, 174, 96, 0.5)'
                : '0 0 5px rgba(231, 76, 60, 0.5)'
            }}>
              {checkCorrectSelections() 
                ? (question.feedback || "Great job! All matches are correct.") 
                : "Some matches are incorrect. Try again next time!"}
            </p>
            
            {/* Continue button */}
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
              {usedBoast 
                ? "Complete Boast & Return →" 
                : (hasMultipleQuestions && !isLastQuestion ? "Next Question →" : "Continue →")}
            </button>
          </div>
        )}
      </div>
    );
  };
  
  // Add renderProceduralQuestion function
  const renderProceduralQuestion = (question: any) => {
    const { steps, correctOrder } = question;
    
    // Function to check if the order is correct
    const checkCorrectOrder = () => {
      return JSON.stringify(proceduralOrder) === JSON.stringify(correctOrder);
    };
    
    // Handle moving a step up in the order
    const moveStepUp = (index: number) => {
      if (index <= 0 || showFeedback) return;
      
      const newOrder = [...proceduralOrder];
      [newOrder[index], newOrder[index - 1]] = [newOrder[index - 1], newOrder[index]];
      setProceduralOrder(newOrder);
      setProceduralComplete(true); // Always enable submit since any order can be submitted
    };
    
    // Handle moving a step down in the order
    const moveStepDown = (index: number) => {
      if (index >= proceduralOrder.length - 1 || showFeedback) return;
      
      const newOrder = [...proceduralOrder];
      [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
      setProceduralOrder(newOrder);
      setProceduralComplete(true); // Always enable submit since any order can be submitted
    };
    
    // Submit the procedural order
    const handleSubmitProcedural = () => {
      if (!proceduralComplete) return; // Ensure all steps are ordered

      const currentQ = getCurrentQuestion();
      if (currentQ.type !== 'procedural') return;

      // Check correctness (example: proceduralOrder matches correctOrder)
      const isCorrect = JSON.stringify(proceduralOrder) === JSON.stringify(currentQ.correctOrder);
      
      setShowFeedback(true);
      if (hasMultipleQuestions) {
        setAllAnswers([...allAnswers, isCorrect]);
      }

      if (isCorrect) {
        incrementMomentum('correct_answer');
        let insightGain = challenge.difficulty === ActivityDifficulty.EASY ? 10 :
                          challenge.difficulty === ActivityDifficulty.MEDIUM ? 20 : 30;
        if (usedBoast) insightGain = Math.floor(insightGain * 1.5);
        updateInsight(insightGain, 'activity_correct_answer');
        
        if ((!hasMultipleQuestions || isLastQuestion) && (currentQ.metadata?.knowledgeStars || challenge.concepts)?.length > 0) {
          const conceptsToDiscover = currentQ.metadata?.knowledgeStars || challenge.concepts || [];
          const uniqueConcepts = Array.from(new Set(conceptsToDiscover)) as string[];
          setConceptsDiscovered(uniqueConcepts);
          uniqueConcepts.forEach(conceptId => discoverConcept(conceptId, 'activity_engagement'));
        }
        if (Math.random() < (usedBoast ? 0.2 : 0.1)) {
          updateStarPoints(challenge.difficulty === ActivityDifficulty.HARD ? 2 : 1, 'activity_bonus');
        }
      } else {
        resetMomentum('incorrect_answer');
        if (usedBoast) centralEventBus.dispatch(GameEventType.BOAST_FAILED, { source: 'activity_engagement' }, 'activity_engagement.handleSubmitProcedural');
      }
    };
    
    return (
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
        
        {/* Question text */}
        <div style={{ 
          color: 'rgba(255, 255, 255, 0.85)',
          marginBottom: spacing.lg,
          fontSize: typography.fontSize.sm,
          lineHeight: '1.5',
          padding: `${spacing.xs} ${spacing.sm}`,
          backgroundColor: 'rgba(30, 40, 60, 0.3)',
          borderRadius: spacing.xs
        }}>
          <TypewriterText
            key={`procedural-question-${currentQuestionIndex}-${challenge?.id || 'default'}`}
            text={question.content || question.text || ''}
            speed={30}
            clickToSkip={true}
            style={{
              fontSize: typography.fontSize.sm,
              lineHeight: '1.5',
              color: 'rgba(255, 255, 255, 0.85)'
            }}
          />
        </div>
        
        {/* Procedural steps interface */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: spacing.md,
          flex: 1
        }}>
          {proceduralOrder.map((stepIndex, orderIndex) => (
            <div key={orderIndex} style={{
              display: 'flex',
              alignItems: 'center',
              gap: spacing.sm,
              padding: `${spacing.xs} ${spacing.sm}`,
              backgroundColor: showFeedback
                ? (correctOrder[orderIndex] === stepIndex 
                  ? 'rgba(39, 174, 96, 0.2)'
                  : 'rgba(231, 76, 60, 0.2)')
                : 'rgba(30, 40, 60, 0.5)',
              borderRadius: spacing.sm,
              border: showFeedback
                ? (correctOrder[orderIndex] === stepIndex 
                  ? `1px solid ${colors.active}`
                  : `1px solid ${colors.error}`)
                : borders.thin,
              transition: `all ${animation.duration.fast} ease-in-out`,
              position: 'relative'
            }}>
              {/* Step number */}
              <div style={{
                minWidth: '24px',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(20, 30, 50, 0.7)',
                borderRadius: '50%',
                fontWeight: 'bold',
                fontSize: typography.fontSize.xs,
                border: `1px solid ${colors.border}`
              }}>
                {orderIndex + 1}
              </div>
              
              {/* Step content */}
              <div style={{
                flex: 1,
                padding: spacing.sm,
                backgroundColor: 'rgba(20, 30, 50, 0.7)',
                borderRadius: spacing.xs,
                fontSize: typography.fontSize.sm
              }}>
                {steps[stepIndex]}
              </div>
              
              {/* Up/Down controls */}
              {!showFeedback && (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: spacing.xxs
                }}>
                  <button
                    onClick={() => moveStepUp(orderIndex)}
                    disabled={orderIndex === 0}
                    style={{
                      width: '24px',
                      height: '24px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: orderIndex === 0 ? 'rgba(20, 30, 50, 0.4)' : 'rgba(20, 30, 50, 0.7)',
                      border: `1px solid ${orderIndex === 0 ? colors.inactive : colors.border}`,
                      borderRadius: '4px',
                      cursor: orderIndex === 0 ? 'not-allowed' : 'pointer',
                      color: orderIndex === 0 ? colors.inactive : colors.text,
                      fontSize: typography.fontSize.sm
                    }}
                  >
                    ▲
                  </button>
                  <button
                    onClick={() => moveStepDown(orderIndex)}
                    disabled={orderIndex === proceduralOrder.length - 1}
                    style={{
                      width: '24px',
                      height: '24px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: orderIndex === proceduralOrder.length - 1 ? 'rgba(20, 30, 50, 0.4)' : 'rgba(20, 30, 50, 0.7)',
                      border: `1px solid ${orderIndex === proceduralOrder.length - 1 ? colors.inactive : colors.border}`,
                      borderRadius: '4px',
                      cursor: orderIndex === proceduralOrder.length - 1 ? 'not-allowed' : 'pointer',
                      color: orderIndex === proceduralOrder.length - 1 ? colors.inactive : colors.text,
                      fontSize: typography.fontSize.sm
                    }}
                  >
                    ▼
                  </button>
                </div>
              )}
              
              {/* Feedback indicator */}
              {showFeedback && (
                <span style={{
                  fontSize: typography.fontSize.md,
                  color: correctOrder[orderIndex] === stepIndex ? colors.active : colors.error,
                  marginLeft: spacing.xs
                }}>
                  {correctOrder[orderIndex] === stepIndex ? '✓' : '✗'}
                </span>
              )}
            </div>
          ))}
        </div>
        
        {/* Submit button */}
        {!showFeedback && (
          <button
            onClick={handleSubmitProcedural}
            className="submit-button"
            disabled={!proceduralComplete}
            style={{
              marginTop: spacing.lg,
              padding: `${spacing.sm} ${spacing.md}`,
              backgroundColor: proceduralComplete ? colors.highlight : 'rgba(30, 40, 60, 0.5)',
              color: proceduralComplete ? colors.text : colors.inactive,
              border: borders.medium,
              borderRadius: spacing.xs,
              cursor: proceduralComplete ? 'pointer' : 'not-allowed',
              fontFamily: typography.fontFamily.pixel,
              textShadow: proceduralComplete ? typography.textShadow.pixel : 'none',
              letterSpacing: '0.5px',
              fontWeight: 'bold',
              width: '100%',
              opacity: proceduralComplete ? 1 : 0.7
            }}
          >
            Submit Order
          </button>
        )}
        
        {/* Feedback Section */}
        {showFeedback && (
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
              color: checkCorrectOrder() ? colors.active : colors.error,
              margin: 0,
              fontSize: typography.fontSize.sm,
              fontWeight: 'bold',
              padding: spacing.xs,
              textShadow: checkCorrectOrder()
                ? '0 0 5px rgba(39, 174, 96, 0.5)'
                : '0 0 5px rgba(231, 76, 60, 0.5)'
            }}>
              {checkCorrectOrder() 
                ? (question.feedback || "Great job! The steps are in the correct order.") 
                : (question.incorrectFeedback || "The steps are not in the correct order. Try again next time!")}
            </p>
            
            {/* Continue button */}
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
              {usedBoast 
                ? "Complete Boast & Return →" 
                : (hasMultipleQuestions && !isLastQuestion ? "Next Question →" : "Continue →")}
            </button>
          </div>
        )}
      </div>
    );
  };
  
  // Add renderCalculationQuestion function
  const renderCalculationQuestion = (question: any) => {
    // Function to check if answer is correct, considering tolerance
    const isAnswerCorrect = () => {
      const numericAnswer = parseFloat(calculationAnswer);
      if (isNaN(numericAnswer)) return false;
      
      const correctValue = question.correctAnswer;
      const tolerance = question.tolerance || 0.5;
      
      return Math.abs(numericAnswer - correctValue) <= tolerance;
    };
    
    // Cache the answer correctness to avoid recalculating during render
    const isCorrect = calculationIsValid ? isAnswerCorrect() : false;
    
    // Validate answer on input
    const handleAnswerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setCalculationAnswer(value);
      
      // Check if answer is valid (is a number)
      const numericValue = parseFloat(value);
      setCalculationIsValid(!isNaN(numericValue) && value.trim() !== '');
    };
    
    // Submit the calculation answer
    const handleSubmitCalculation = () => {
      if (!calculationIsValid) return; // Ensure answer is valid format

      const currentQ = getCurrentQuestion();
      if (currentQ.type !== 'calculation') return;

      const numericAnswer = parseFloat(calculationAnswer);
      const isCorrect = Math.abs(numericAnswer - currentQ.correctAnswer) <= (currentQ.tolerance || 0.01); // Use specified tolerance or a small default
      
      setShowFeedback(true);
      if (hasMultipleQuestions) {
        setAllAnswers([...allAnswers, isCorrect]);
      }

      if (isCorrect) {
        incrementMomentum('correct_answer');
        let insightGain = challenge.difficulty === ActivityDifficulty.EASY ? 10 :
                          challenge.difficulty === ActivityDifficulty.MEDIUM ? 20 : 30;
        if (usedBoast) insightGain = Math.floor(insightGain * 1.5);
        updateInsight(insightGain, 'activity_correct_answer');

        // For calculation questions, concepts might be in q.metadata.knowledgeStars
        const conceptsToDiscover = currentQ.metadata?.knowledgeStars || challenge.concepts || [];
        if ((!hasMultipleQuestions || isLastQuestion) && conceptsToDiscover.length > 0) {
          const uniqueConcepts = Array.from(new Set(conceptsToDiscover)) as string[];
          setConceptsDiscovered(uniqueConcepts);
          uniqueConcepts.forEach(conceptId => discoverConcept(conceptId, 'activity_engagement'));
        }
        if (Math.random() < (usedBoast ? 0.2 : 0.1)) {
          updateStarPoints(challenge.difficulty === ActivityDifficulty.HARD ? 2 : 1, 'activity_bonus');
        }
      } else {
        resetMomentum('incorrect_answer');
        if (usedBoast) centralEventBus.dispatch(GameEventType.BOAST_FAILED, { source: 'activity_engagement' }, 'activity_engagement.handleSubmitCalculation');
      }
    };
    
    return (
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
        
        {/* Question text */}
        <div style={{ 
          color: 'rgba(255, 255, 255, 0.85)',
          marginBottom: spacing.md,
          fontSize: typography.fontSize.sm,
          lineHeight: '1.5',
          padding: `${spacing.xs} ${spacing.sm}`,
          backgroundColor: 'rgba(30, 40, 60, 0.3)',
          borderRadius: spacing.xs
        }}>
          <TypewriterText
            key={`calculation-question-${currentQuestionIndex}-${challenge?.id || 'default'}`}
            text={question.content || question.text || ''}
            speed={30}
            clickToSkip={true}
            style={{
              fontSize: typography.fontSize.sm,
              lineHeight: '1.5',
              color: 'rgba(255, 255, 255, 0.85)'
            }}
          />
        </div>
        
        {/* Formula hint (if available) */}
        {question.formula && (
          <div style={{
            backgroundColor: 'rgba(30, 40, 60, 0.4)',
            padding: spacing.sm,
            borderRadius: spacing.xs,
            marginBottom: spacing.md,
            borderLeft: `3px solid ${colors.highlight}`,
            fontSize: typography.fontSize.sm
          }}>
            <span style={{ fontWeight: 'bold' }}>Formula: </span>{question.formula}
          </div>
        )}
        
        {/* Calculation input */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: spacing.md,
          flex: 1
        }}>
          <div style={{
            padding: spacing.md,
            backgroundColor: 'rgba(30, 40, 60, 0.5)',
            borderRadius: spacing.sm,
            border: showFeedback 
              ? (isCorrect ? `1px solid ${colors.active}` : `1px solid ${colors.error}`)
              : borders.thin,
            display: 'flex',
            flexDirection: 'column',
            gap: spacing.sm
          }}>
            <label 
              htmlFor="calculation-answer" 
              style={{ 
                fontSize: typography.fontSize.sm,
                marginBottom: spacing.xs
              }}
            >
              Enter your answer:
            </label>
            
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: spacing.xs
            }}>
              <input
                id="calculation-answer"
                type="number"
                value={calculationAnswer}
                onChange={handleAnswerChange}
                disabled={showFeedback}
                step="any"
                placeholder="Enter numerical value"
                style={{
                  flex: 1,
                  padding: spacing.md,
                  backgroundColor: 'rgba(20, 30, 50, 0.7)',
                  color: colors.text,
                  border: borders.thin,
                  borderRadius: spacing.xs,
                  fontFamily: typography.fontFamily.pixel,
                  fontSize: typography.fontSize.md,
                  textAlign: 'center'
                }}
              />
              
              {question.unit && (
                <span style={{
                  fontSize: typography.fontSize.md,
                  paddingLeft: spacing.sm,
                  paddingRight: spacing.sm,
                  color: 'rgba(255, 255, 255, 0.8)'
                }}>
                  {question.unit}
                </span>
              )}
            </div>
            
            {showFeedback && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: spacing.sm,
                backgroundColor: isCorrect ? 'rgba(39, 174, 96, 0.2)' : 'rgba(231, 76, 60, 0.2)',
                padding: spacing.sm,
                borderRadius: spacing.xs,
                marginTop: spacing.sm
              }}>
                <span style={{
                  fontSize: typography.fontSize.md,
                  color: isCorrect ? colors.active : colors.error
                }}>
                  {isCorrect ? '✓' : '✗'}
                </span>
                <span style={{
                  fontSize: typography.fontSize.sm
                }}>
                  Correct answer: {question.correctAnswer} {question.unit}
                  {question.tolerance ? ` (±${question.tolerance})` : ''}
                </span>
              </div>
            )}
          </div>
        </div>
        
        {/* Submit button */}
        {!showFeedback && (
          <button
            onClick={handleSubmitCalculation}
            className="submit-button"
            disabled={!calculationIsValid}
            style={{
              marginTop: spacing.lg,
              padding: `${spacing.sm} ${spacing.md}`,
              backgroundColor: calculationIsValid ? colors.highlight : 'rgba(30, 40, 60, 0.5)',
              color: calculationIsValid ? colors.text : colors.inactive,
              border: borders.medium,
              borderRadius: spacing.xs,
              cursor: calculationIsValid ? 'pointer' : 'not-allowed',
              fontFamily: typography.fontFamily.pixel,
              textShadow: calculationIsValid ? typography.textShadow.pixel : 'none',
              letterSpacing: '0.5px',
              fontWeight: 'bold',
              width: '100%',
              opacity: calculationIsValid ? 1 : 0.7
            }}
          >
            Submit Answer
          </button>
        )}
        
        {/* Feedback Section */}
        {showFeedback && (
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
              color: isCorrect ? colors.active : colors.error,
              margin: 0,
              fontSize: typography.fontSize.sm,
              fontWeight: 'bold',
              padding: spacing.xs,
              textShadow: isCorrect
                ? '0 0 5px rgba(39, 174, 96, 0.5)'
                : '0 0 5px rgba(231, 76, 60, 0.5)'
            }}>
              {isCorrect 
                ? (question.correctFeedback || question.feedback || "Great job with the calculation!") 
                : (question.incorrectFeedback || "Your calculation is incorrect. Try again next time!")}
            </p>
            
            {/* Continue button */}
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
              {usedBoast 
                ? "Complete Boast & Return →" 
                : (hasMultipleQuestions && !isLastQuestion ? "Next Question →" : "Continue →")}
            </button>
          </div>
        )}
      </div>
    );
  };
  
  // Twitter-like messaging interface for educational content
  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      background: '#000',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: typography.fontFamily.pixel,
      color: colors.text,
      overflow: 'hidden'
    }}>
      {/* Background gradient effect */}
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
      
      {/* Add test mode controls */}
      {process.env.NODE_ENV !== 'production' && (
        <div style={{
          position: 'absolute',
          top: spacing.sm,
          left: spacing.sm,
          backgroundColor: 'rgba(20, 25, 35, 0.8)',
          padding: spacing.sm,
          borderRadius: spacing.xs,
          zIndex: 10,
          border: `1px solid ${colors.border}`,
          fontFamily: typography.fontFamily.pixel,
          fontSize: typography.fontSize.xs,
          display: 'flex',
          flexDirection: 'column',
          gap: spacing.xxs
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs }}>
            <input 
              type="checkbox" 
              id="test-mode-toggle"
              checked={testModeEnabled}
              onChange={() => {
                const newValue = !testModeEnabled;
                setTestModeEnabled(newValue);
                TEST_MODE_ENABLED = newValue;
                // Reload questions if the activity is already loaded
                if (currentActivity) {
                  setSelectedOption(null);
                  setShowFeedback(false);
                  setCurrentQuestionIndex(0);
                  setAllAnswers([]);
                  fetchQuestionsForActivity(currentActivity)
                    .then(apiQuestions => {
                      if (apiQuestions && apiQuestions.length > 0) {
                        const transformedChallenge = transformQuestionsToChallenge(apiQuestions, currentActivity);
                        setChallenge(transformedChallenge);
                      }
                    });
                }
              }}
            />
            <label htmlFor="test-mode-toggle">Test Mode</label>
          </div>
          {testModeEnabled && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs }}>
                <label htmlFor="question-type-select" style={{ marginRight: spacing.xxs }}>Type:</label>
                <select
                  id="question-type-select"
                  value={testQuestionType}
                  onChange={(e) => {
                    const newValue = e.target.value;
                    setTestQuestionType(newValue);
                    TEST_QUESTION_TYPE = newValue;
                    // Reload questions with new question type
                    if (currentActivity) {
                      setSelectedOption(null);
                      setShowFeedback(false);
                      setCurrentQuestionIndex(0);
                      setAllAnswers([]);
                      fetchQuestionsForActivity(currentActivity)
                        .then(apiQuestions => {
                          if (apiQuestions && apiQuestions.length > 0) {
                            const transformedChallenge = transformQuestionsToChallenge(apiQuestions, currentActivity);
                            setChallenge(transformedChallenge);
                          }
                        });
                    }
                  }}
                  style={{
                    backgroundColor: 'rgba(30, 40, 60, 0.7)',
                    color: colors.text,
                    border: `1px solid ${colors.border}`,
                    borderRadius: spacing.xxs,
                    padding: `${spacing.xxs} ${spacing.xs}`,
                    fontFamily: typography.fontFamily.pixel,
                    fontSize: typography.fontSize.xs
                  }}
                >
                  <option value="multipleChoice">Multiple Choice</option>
                  <option value="matching">Matching</option>
                  <option value="procedural">Procedural</option>
                  <option value="calculation">Calculation</option>
                </select>
              </div>
              <select
                value={testQuestionSet}
                onChange={(e) => {
                  const newValue = e.target.value;
                  setTestQuestionSet(newValue);
                  SELECTED_TEST_SET = newValue;
                  // Reload questions with new set
                  if (currentActivity) {
                    setSelectedOption(null);
                    setShowFeedback(false);
                    setCurrentQuestionIndex(0);
                    setAllAnswers([]);
                    fetchQuestionsForActivity(currentActivity)
                      .then(apiQuestions => {
                        if (apiQuestions && apiQuestions.length > 0) {
                          const transformedChallenge = transformQuestionsToChallenge(apiQuestions, currentActivity);
                          setChallenge(transformedChallenge);
                        }
                      });
                  }
                }}
                style={{
                  backgroundColor: 'rgba(30, 40, 60, 0.7)',
                  color: colors.text,
                  border: `1px solid ${colors.border}`,
                  borderRadius: spacing.xxs,
                  padding: `${spacing.xxs} ${spacing.xs}`,
                  fontFamily: typography.fontFamily.pixel,
                  fontSize: typography.fontSize.xs
                }}
              >
                <option value="test_easy">Easy Questions</option>
                <option value="test_medium">Medium Questions</option>
                <option value="test_hard">Hard Questions</option>
              </select>
            </>
          )}
        </div>
      )}
      
      {/* Header with time and activity info */}
      <div style={{
        backgroundColor: colors.background,
        borderBottom: `2px solid ${colors.border}`,
        padding: spacing.md,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'relative',
        zIndex: 2
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md }}>
          {/* Activity title and mentor */}
          <div>
            <h2 style={{ 
              fontSize: typography.fontSize.lg, 
              fontWeight: 'bold',
              textShadow: typography.textShadow.pixel,
              margin: 0
            }}>{currentActivity.title}</h2>
            <p style={{ 
              color: colors.textDim,
              margin: 0,
              fontSize: typography.fontSize.sm
            }}>with {currentActivity.mentor} • {formattedTime}</p>
          </div>
          
          {/* Progress indicator for multi-question challenges */}
          {hasMultipleQuestions && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: spacing.xs,
              backgroundColor: colors.backgroundAlt,
              padding: `${spacing.xs} ${spacing.sm}`,
              borderRadius: spacing.xs,
              border: `1px solid ${colors.border}`
            }}>
              <span style={{ fontSize: typography.fontSize.sm }}>
                Question {currentQuestionIndex + 1} of {challenge.questions.length}
              </span>
              <div style={{ display: 'flex', gap: spacing.xxs }}>
                {Array.from({length: challenge.questions.length}, (_, i) => (
                  <div key={i} style={{
                    width: '8px',
                    height: '8px',
                    backgroundColor: i === currentQuestionIndex ? colors.highlight : colors.inactive,
                    borderRadius: '50%'
                  }} />
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* Player stats in header */}
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
            <span>{currentInsight}</span>
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
            <span>{currentStarPoints}</span>
          </div>
        </div>
      </div>
      
      {/* Main content area with message feed layout */}
      <div style={{
        display: 'flex',
        flex: 1,
        position: 'relative',
        zIndex: 1,
        overflow: 'hidden'
      }}>
        {/* Message feed area */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
                      {/* Question as mentor message */}
            <div style={{
              background: colors.background,
              borderRadius: spacing.sm,
              padding: spacing.xl,
              display: 'flex',
              alignItems: 'flex-start',
              gap: spacing.md,
              maxWidth: '80%',
              margin: `${spacing.md} 0`,
              minHeight: '150px',
              position: 'relative',
              boxShadow: `0 8px 0 ${colors.border}, 0 0 0 4px ${colors.border}`,
              animation: 'slideInUp 0.3s ease-out'
            }}>
              {/* Message content */}
              <div style={{ flex: 1 }}>
                {/* Speaker Name - matching NarrativeDialogue style */}
                <div style={{
                  color: colors.highlight,
                  fontWeight: 'bold',
                  fontSize: typography.fontSize.lg,
                  marginBottom: spacing.sm,
                  textShadow: typography.textShadow.pixel
                }}>
                  {currentActivity.mentor === 'garcia' ? 'Dr. Garcia' : 
                   currentActivity.mentor === 'kapoor' ? 'Dr. Kapoor' : 
                   currentActivity.mentor === 'quinn' ? 'Dr. Quinn' : 
                   currentActivity.mentor === 'jesse' ? 'Jesse' : 
                   currentActivity.mentor || 'Mentor'}
                </div>
                
                {/* Dialogue Text - matching NarrativeDialogue style */}
                <div style={{
                  fontSize: typography.fontSize.md,
                  lineHeight: '1.6',
                  color: colors.text,
                  cursor: 'pointer',
                  minHeight: '60px',
                  position: 'relative'
                }}>
                  <TypewriterText
                    key={`mentor-message-${currentQuestionIndex}-${challenge?.id || 'default'}`}
                    text={getCurrentQuestion()?.content || getCurrentQuestion()?.text || challenge?.quote || ''}
                    speed={30}
                    clickToSkip={true}
                    style={{
                      fontSize: typography.fontSize.md,
                      lineHeight: '1.6',
                      color: colors.text
                    }}
                  />
                  
                  {/* Continue prompt - matching NarrativeDialogue style */}
                  {!showFeedback && getCurrentQuestion()?.options && (
                    <div style={{
                      position: 'absolute',
                      bottom: spacing.sm,
                      right: spacing.md,
                      color: colors.textDim,
                      fontSize: typography.fontSize.xs,
                      animation: 'pulse 2s infinite'
                    }}>
                      Choose your response...
                    </div>
                  )}
                </div>
              </div>
              
              {/* Mentor portrait */}
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
                {currentActivity.mentor && isValidMentor(currentActivity.mentor) && (
                  <SpriteImage
                    src={SPRITE_SHEETS.chibiPortraits}
                    coordinates={getPortraitCoordinates(mentorToCharacterId[currentActivity.mentor] as any, 'chibi')}
                    alt={currentActivity.mentor}
                    scale={2}
                    pixelated={true}
                  />
                )}
              </div>
            </div>
            
            {/* Show feedback message if available */}
            {showFeedback && selectedOption !== null && getCurrentQuestion()?.options && (
              <div style={{
                background: colors.backgroundAlt,
                borderRadius: spacing.sm,
                padding: spacing.xl,
                display: 'flex',
                alignItems: 'flex-start',
                gap: spacing.md,
                maxWidth: '80%',
                margin: `${spacing.md} 0`,
                marginLeft: 'auto',
                minHeight: '120px',
                position: 'relative',
                boxShadow: `0 8px 0 ${colors.border}, 0 0 0 4px ${colors.border}`
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: typography.fontSize.md,
                    lineHeight: '1.4',
                    color: getCurrentQuestion().options[selectedOption].correct ? colors.active : colors.error,
                    marginBottom: spacing.xs
                  }}>
                    {getCurrentQuestion().options[selectedOption].feedback}
                  </div>
                  <div style={{
                    fontSize: typography.fontSize.xs,
                    color: colors.textDim
                  }}>
                    {getCurrentQuestion().options[selectedOption].correct ? '✓ Correct' : '✗ Incorrect'}
                  </div>
                  
                  {/* Concepts discovered */}
                  {(!hasMultipleQuestions || isLastQuestion) && conceptsDiscovered.length > 0 && (
                    <div style={{
                      marginTop: spacing.md,
                      padding: spacing.sm,
                      backgroundColor: 'rgba(20, 30, 40, 0.3)',
                      borderRadius: spacing.xs,
                      border: `1px dotted ${colors.border}`
                    }}>
                      <div style={{
                        color: colors.starGlow,
                        fontSize: typography.fontSize.sm,
                        marginBottom: spacing.xs,
                        display: 'flex',
                        alignItems: 'center',
                        gap: spacing.xs
                      }}>
                        <span>✨</span> New concepts discovered:
                      </div>
                      <div style={{ display: 'flex', gap: spacing.xs, flexWrap: 'wrap' }}>
                        {conceptsDiscovered.map((concept) => (
                          <span key={concept} style={{
                            backgroundColor: 'rgba(40, 50, 70, 0.6)',
                            padding: `${spacing.xs} ${spacing.sm}`,
                            borderRadius: spacing.sm,
                            fontSize: typography.fontSize.xs,
                            border: `1px solid ${colors.border}`
                          }}>
                            {concept.replace(/_/g, ' ')}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Player avatar */}
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
                  YOU
                                 </div>
               </div>
             )}
           </div>
           
           {/* Options section at bottom (Twitter-like response area) */}
           {!showQuote && getCurrentQuestion()?.options && !showFeedback && (
             <div style={{
               backgroundColor: colors.background,
               borderTop: `2px solid ${colors.border}`,
               padding: spacing.lg,
               minHeight: '120px'
             }}>
               <div style={{
                 display: 'flex',
                 flexDirection: 'column',
                 gap: spacing.sm,
                                  maxWidth: '600px',
                 margin: '0 auto'
               }}>
                 {/* Question options as response buttons */}
                 {getCurrentQuestion().options.map((option: any, index: number) => (
                   <button
                     key={index}
                     onClick={() => handleOptionSelect(index)}
                     disabled={selectedOption !== null}
                     style={{
                       background: colors.backgroundAlt,
                       borderRadius: spacing.xs,
                       padding: `${spacing.md} ${spacing.lg}`,
                       color: colors.text,
                       fontFamily: typography.fontFamily.pixel,
                       fontSize: typography.fontSize.sm,
                       textAlign: 'left',
                       cursor: selectedOption !== null ? 'not-allowed' : 'pointer',
                       transition: `all ${animation.duration.fast} ${animation.easing.pixel}`,
                       opacity: selectedOption !== null ? 0.6 : 1,
                       boxShadow: `0 4px 0 ${colors.border}, 0 0 0 4px ${colors.border}, 0 0 0 4px ${colors.border}, 4px 0 0 ${colors.border}`,
                       border: 'none'
                     }}
                     onMouseEnter={(e) => {
                       if (selectedOption === null) {
                         e.currentTarget.style.boxShadow = `0 4px 0 ${colors.highlight}, 0 0 0 4px ${colors.highlight}, 0 0 0 4px ${colors.highlight}, 4px 0 0 ${colors.highlight}`;
                         e.currentTarget.style.background = colors.highlight;
                         e.currentTarget.style.color = colors.background;
                       }
                     }}
                     onMouseLeave={(e) => {
                       if (selectedOption === null) {
                         e.currentTarget.style.boxShadow = `0 4px 0 ${colors.border}, 0 0 0 4px ${colors.border}, 0 0 0 4px ${colors.border}, 4px 0 0 ${colors.border}`;
                         e.currentTarget.style.background = colors.backgroundAlt;
                         e.currentTarget.style.color = colors.text;
                       }
                     }}
                   >
                     <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                       <span>{option.text}</span>
                       <div style={{ display: 'flex', alignItems: 'center' }}>
                         {/* Resource indicators */}
                         {option.insightChange !== undefined && option.insightChange !== 0 && (
                           <span style={{
                             fontSize: typography.fontSize.xs,
                             padding: '2px 6px',
                             borderRadius: '3px',
                             marginLeft: spacing.xs,
                             background: 'rgba(0, 0, 0, 0.3)',
                             color: colors.insight
                           }}>
                             ◆ {option.insightChange > 0 ? '+' : ''}{option.insightChange}
                           </span>
                         )}
                       </div>
                     </div>
                   </button>
                 ))}
               </div>
             </div>
           )}
           
           {/* Continue button for feedback state */}
           {showFeedback && (
             <div style={{
               backgroundColor: colors.background,
               borderTop: `2px solid ${colors.border}`,
               padding: spacing.lg,
               display: 'flex',
               justifyContent: 'center'
             }}>
               <button 
                 onClick={handleContinue}
                 style={{
                   padding: `${spacing.sm} ${spacing.lg}`,
                   background: colors.highlight,
                   color: colors.text,
                   border: 'none',
                   borderRadius: spacing.xs,
                   cursor: 'pointer',
                   fontFamily: typography.fontFamily.pixel,
                   textShadow: typography.textShadow.pixel,
                   boxShadow: `0 4px 0 ${colors.border}, 0 0 0 4px ${colors.border}, 0 0 0 4px ${colors.border}, 4px 0 0 ${colors.border}`,
                   letterSpacing: '0.5px',
                   fontWeight: 'bold',
                   fontSize: typography.fontSize.md,
                   transition: `all ${animation.duration.fast} ${animation.easing.pixel}`
                 }}
                 onMouseEnter={(e) => {
                   e.currentTarget.style.transform = 'translateY(-2px)';
                   e.currentTarget.style.boxShadow = `0 6px 0 ${colors.border}, 0 0 0 4px ${colors.border}, 0 0 0 4px ${colors.border}, 4px 0 0 ${colors.border}`;
                 }}
                 onMouseLeave={(e) => {
                   e.currentTarget.style.transform = 'translateY(0)';
                   e.currentTarget.style.boxShadow = `0 4px 0 ${colors.border}, 0 0 0 4px ${colors.border}, 0 0 0 4px ${colors.border}, 4px 0 0 ${colors.border}`;
                 }}
               >
                 {usedBoast 
                   ? "Complete Boast & Return →" 
                   : (hasMultipleQuestions && !isLastQuestion ? "Next Question →" : "Continue →")}
               </button>
             </div>
           )}
           
                   </div>
        
        {/* Sidebar with abilities */}
        <div style={{
          width: '300px',
          backgroundColor: colors.background,
          borderLeft: `2px solid ${colors.border}`,
          padding: spacing.md,
          display: 'flex',
          flexDirection: 'column',
          gap: spacing.md
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
          
          {/* Special abilities */}
          {!showQuote && (
            <>
              {canUseBoastAbility && (
                <BoastButton onActivate={handleBoast} />
              )}
              
              <button
                onClick={handleTangent}
                disabled={!canUseTangent}
                style={{
                  padding: `${spacing.xs} ${spacing.sm}`,
                  borderRadius: spacing.xs,
                  fontSize: typography.fontSize.xs,
                  backgroundColor: canUseTangent ? 'rgba(45, 156, 219, 0.3)' : 'rgba(50, 50, 60, 0.3)',
                  color: canUseTangent ? colors.text : colors.inactive,
                  opacity: canUseTangent ? 1 : 0.5,
                  cursor: canUseTangent ? 'pointer' : 'not-allowed',
                  border: `1px solid ${colors.border}`,
                  fontFamily: typography.fontFamily.pixel,
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing.xs
                }}
              >
                <span style={{ color: colors.insight }}>⟲</span> Tangent (25 ◆)
              </button>
            </>
          )}
        </div>
      </div>
      
      {/* Animations */}
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
          0% { opacity: 0.7; }
          50% { opacity: 1; }
          100% { opacity: 0.7; }
        }
      `}</style>
    </div>
  );
}
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
            ) : currentQuestion?.type === 'matching' ? (
              // Render matching question UI using the helper function
              renderMatchingQuestion(currentQuestion)
            ) : currentQuestion?.type === 'procedural' ? (
              // Render procedural question UI using the helper function
              renderProceduralQuestion(currentQuestion)
            ) : currentQuestion?.type === 'calculation' ? (
              // Render calculation question UI using the helper function
              renderCalculationQuestion(currentQuestion)
            ) : (
              // Original Multiple Choice rendering
              <div style={{
                background: colors.background,
                padding: spacing.xl,
                borderRadius: spacing.sm,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                minHeight: '150px',
                boxShadow: `0 8px 0 ${colors.border}, 0 0 0 4px ${colors.border}`
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
                <div style={{ 
                  color: colors.text,
                  marginBottom: spacing.lg,
                  fontSize: typography.fontSize.md,
                  lineHeight: '1.6',
                  cursor: 'pointer',
                  minHeight: '60px'
                }}>
                  <TypewriterText
                    key={`multiple-choice-question-${currentQuestionIndex}-${challenge?.id || 'default'}`}
                    text={currentQuestion.content || ''}
                    speed={30}
                    clickToSkip={true}
                    style={{
                      fontSize: typography.fontSize.md,
                      lineHeight: '1.6',
                      color: colors.text
                    }}
                  />
                </div>
                
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
                      {usedBoast 
                        ? "Complete Boast & Return →" 
                        : (hasMultipleQuestions && !isLastQuestion ? "Next Question →" : "Continue →")}
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
          
          {/* Use ResourceDisplay for a consistent look */}
          <ResourceDisplay /> 

          {/* Special Abilities */}
          {!showQuote && ( // Don\'t show abilities during quotes
            <>
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: spacing.xs,
                paddingTop: spacing.xxs
              }}>
                {/* Add BoastButton when appropriate */}
                {canUseBoastAbility && <BoastButton onActivate={handleBoast} />}
                
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
                  title={canUseTangent ? "Use Tangent: Switch to a related, potentially easier question (Costs 25 Insight)." : "Tangent unavailable (Need 25 Insight, or already used an ability)."}
                >
                  <span style={{ color: colors.insight }}>⟲</span> Tangent (25 ◆)
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