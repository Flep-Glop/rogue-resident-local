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
import { MultipleChoiceQuestion, Question, Domain, Difficulty } from '@/app/types/questions';
import { selectActivityQuestions } from '@/app/core/questions/questionManager';
import { getPortraitCoordinates, SPRITE_SHEETS } from '@/app/utils/spriteMap';
import SpriteImage from '../ui/SpriteImage';

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
  
  // Add state for matching questions
  const [matchingSelections, setMatchingSelections] = useState<number[]>([]);
  const [matchingComplete, setMatchingComplete] = useState(false);
  
  // Add state for test mode
  const [testModeEnabled, setTestModeEnabled] = useState(TEST_MODE_ENABLED);
  const [testQuestionSet, setTestQuestionSet] = useState(SELECTED_TEST_SET);
  const [testQuestionType, setTestQuestionType] = useState(TEST_QUESTION_TYPE);
  
  // Add state for procedural questions
  const [proceduralOrder, setProceduralOrder] = useState<number[]>([]);
  const [proceduralComplete, setProceduralComplete] = useState(false);
  
  // Add state for calculation questions
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
              const questionTypes = transformedChallenge.questions
                ? transformedChallenge.questions.map((q: any) => q.type).join(', ')
                : 'No questions array found';
              console.log('Question types in challenge:', questionTypes);
              
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
  }, [currentActivity]);
  
  // Modify the fetchQuestionsForActivity function to handle test mode
  const fetchQuestionsForActivity = async (activity: ActivityOption) => {
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
        const questionCount = activity.difficulty === ActivityDifficulty.HARD ? 3 :
                            activity.difficulty === ActivityDifficulty.MEDIUM ? 2 : 1;
        
        // Use the selectActivityQuestions function to get appropriate questions
        // Cast legacy domain back for backward compatibility with the function
        const questions = await selectActivityQuestions(
          legacyDomain as any, // Use legacy domain and cast as any for compatibility
          activity.difficulty,
          questionCount,
          ['multipleChoice'], // Use string literal 'multipleChoice' instead of enum
          activity.mentor // Pass the mentor to help with question selection
        );
        
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
              // Keep this one log for diagnosing mentor replacement issues
              console.log(`Replacing mentor reference from "${mentorName}" to "${activityMentor}" in text`);
              result = result.replace(regex, activityMentor);
            }
          }
        });
        
        return result;
      };
      
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
              calculationQuestions.flatMap(q => 
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
            questions: proceduralQuestions.map(q => {
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
              proceduralQuestions.flatMap(q => 
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
              matchingQuestions.flatMap(q => 
                q.metadata?.knowledgeStars || []
              )
            )) as string[],
            difficulty: activity.difficulty
          };
        }
      }
      
      // Filter to only use multiple choice questions with proper validation
      const multipleChoiceQuestions = apiQuestions.filter(q => {
        if (!q) return false;
        if (q.type !== 'multipleChoice') return false;
        
        // Ensure the question has the required properties
        const mcq = q as any;
        
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
        multipleChoiceQuestions.flatMap(q => 
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
      if (!matchingComplete) return;
      
      const isCorrect = checkCorrectSelections();
      setShowFeedback(true);
      
      // Track answers for multi-question challenges
      if (hasMultipleQuestions) {
        setAllAnswers([...allAnswers, isCorrect]);
      }
      
      // Update resources based on success
      if (isCorrect) {
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
            
            // Use the knowledge store to discover concepts
            const { discoverConcept } = useKnowledgeStore.getState();
            
            // Use the knowledge store to discover concepts
            uniqueConcepts.forEach((conceptId) => {
              // Call the knowledge store method directly
              discoverConcept(conceptId, 'activity_engagement');
            });
          }
        }
        
        // Random chance to earn Star Points directly
        const spChance = usedBoast ? 0.2 : 0.1;
        if (Math.random() < spChance) {
          const spGained = challenge.difficulty === ActivityDifficulty.HARD ? 2 : 1;
          addStarPoints(spGained);
        }
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
        <p style={{ 
          color: 'rgba(255, 255, 255, 0.85)',
          marginBottom: spacing.lg,
          fontSize: typography.fontSize.sm,
          lineHeight: '1.5',
          padding: `${spacing.xs} ${spacing.sm}`,
          backgroundColor: 'rgba(30, 40, 60, 0.3)',
          borderRadius: spacing.xs
        }}>{question.content}</p>
        
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
              {hasMultipleQuestions && !isLastQuestion ? "Next Question →" : "Continue →"}
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
      if (!proceduralComplete) return;
      
      const isCorrect = checkCorrectOrder();
      setShowFeedback(true);
      
      // Track answers for multi-question challenges
      if (hasMultipleQuestions) {
        setAllAnswers([...allAnswers, isCorrect]);
      }
      
      // Update resources based on success
      if (isCorrect) {
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
            
            // Use the knowledge store to discover concepts
            const { discoverConcept } = useKnowledgeStore.getState();
            
            // Use the knowledge store to discover concepts
            uniqueConcepts.forEach((conceptId) => {
              // Call the knowledge store method directly
              discoverConcept(conceptId, 'activity_engagement');
            });
          }
        }
        
        // Random chance to earn Star Points directly
        const spChance = usedBoast ? 0.2 : 0.1;
        if (Math.random() < spChance) {
          const spGained = challenge.difficulty === ActivityDifficulty.HARD ? 2 : 1;
          addStarPoints(spGained);
        }
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
        <p style={{ 
          color: 'rgba(255, 255, 255, 0.85)',
          marginBottom: spacing.lg,
          fontSize: typography.fontSize.sm,
          lineHeight: '1.5',
          padding: `${spacing.xs} ${spacing.sm}`,
          backgroundColor: 'rgba(30, 40, 60, 0.3)',
          borderRadius: spacing.xs
        }}>{question.content || question.text}</p>
        
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
              {hasMultipleQuestions && !isLastQuestion ? "Next Question →" : "Continue →"}
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
      if (!calculationIsValid) return;
      
      const isCorrect = isAnswerCorrect();
      setShowFeedback(true);
      
      // Track answers for multi-question challenges
      if (hasMultipleQuestions) {
        setAllAnswers([...allAnswers, isCorrect]);
      }
      
      // Update resources based on success
      if (isCorrect) {
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
            
            // Use the knowledge store to discover concepts
            const { discoverConcept } = useKnowledgeStore.getState();
            
            // Use the knowledge store to discover concepts
            uniqueConcepts.forEach((conceptId) => {
              // Call the knowledge store method directly
              discoverConcept(conceptId, 'activity_engagement');
            });
          }
        }
        
        // Random chance to earn Star Points directly
        const spChance = usedBoast ? 0.2 : 0.1;
        if (Math.random() < spChance) {
          const spGained = challenge.difficulty === ActivityDifficulty.HARD ? 2 : 1;
          addStarPoints(spGained);
        }
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
        <p style={{ 
          color: 'rgba(255, 255, 255, 0.85)',
          marginBottom: spacing.md,
          fontSize: typography.fontSize.sm,
          lineHeight: '1.5',
          padding: `${spacing.xs} ${spacing.sm}`,
          backgroundColor: 'rgba(30, 40, 60, 0.3)',
          borderRadius: spacing.xs
        }}>{question.content || question.text}</p>
        
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
              {hasMultipleQuestions && !isLastQuestion ? "Next Question →" : "Continue →"}
            </button>
          </div>
        )}
      </div>
    );
  };
  
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
                    <SpriteImage
                      src={SPRITE_SHEETS.chibiPortraits}
                      coordinates={getPortraitCoordinates(mentorToCharacterId[currentActivity.mentor] as any, 'chibi')}
                      alt={currentActivity.mentor}
                      scale={4.5}
                      pixelated={true}
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