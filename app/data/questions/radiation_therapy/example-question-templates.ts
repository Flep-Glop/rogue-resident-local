import { 
  MultipleChoiceQuestion, 
  MatchingQuestion,
  ProceduralQuestion,
  CalculationQuestion,
  BoastQuestion,
  QuestionMetadata
} from '../../../types/questions';
import { MentorId } from '../../../types/mentorVoice';

// Common metadata for all questions in this example
const radiationTherapyMetadata: QuestionMetadata = {
  domain: 'RADIATION_THERAPY',
  difficulty: 'INTERMEDIATE',
  tags: ['fractionation', 'clinical', 'treatment-planning']
};

// Example multiple choice question template
export const fractionationQuestion: MultipleChoiceQuestion = {
  id: 'RT-MC-001',
  type: 'multipleChoice',
  metadata: {
    ...radiationTherapyMetadata,
    tags: [...radiationTherapyMetadata.tags, 'hypofractionation'],
    knowledgeStars: ['fractionation-schemes', 'radiobiology']
  },
  // List mentors that can present this question in order of preference
  preferredMentors: ['Garcia', 'Quinn', 'Kapoor'],
  // Question template with placeholders for mentor voice
  template: {
    textTemplate: "{mentorIntro} {mentorInquiry} which of the following dose/fractionation schemes would be considered hypofractionated for breast cancer treatment?",
    correctFeedbackTemplate: "{mentorFeedback} Hypofractionation uses fewer, larger fractions while achieving equivalent biological effect. {mentorTransition} the 40 Gy in 15 fractions scheme has been validated in multiple large randomized trials.",
    incorrectFeedbackTemplate: "{mentorFeedback} conventional fractionation for breast cancer has traditionally been 50 Gy in 25 fractions. {mentorTransition} hypofractionation involves using fewer, larger fractions like 40 Gy in 15 fractions."
  },
  options: [
    "50 Gy in 25 fractions of 2 Gy each",
    "60 Gy in 30 fractions of 2 Gy each",
    "40 Gy in 15 fractions of 2.67 Gy each",
    "45 Gy in 25 fractions of 1.8 Gy each"
  ],
  correctOptionIndices: [2]
};

// Example matching question template
export const radiationDetectorsQuestion: MatchingQuestion = {
  id: 'RT-MATCH-001',
  type: 'matching',
  metadata: {
    ...radiationTherapyMetadata,
    difficulty: 'BEGINNER',
    tags: [...radiationTherapyMetadata.tags, 'detectors', 'QA'],
    knowledgeStars: ['radiation-detectors', 'quality-assurance']
  },
  preferredMentors: ['Kapoor', 'Jesse'],
  template: {
    textTemplate: "{mentorIntro} {mentorInquiry} match each radiation detector with its primary clinical application in radiation therapy.",
    correctFeedbackTemplate: "{mentorFeedback} Understanding the appropriate detector for each application is {mentorEmphasis}. {mentorTransition} each detector has specific properties that make it suited for particular measurements.",
    incorrectFeedbackTemplate: "{mentorFeedback} When selecting detectors, we need to consider detector properties like energy dependence, spatial resolution, and sensitivity. {mentorTransition} let's review the correct pairings."
  },
  items: [
    "Farmer-type ionization chamber",
    "Diode detector",
    "Radiochromic film",
    "Thermoluminescent dosimeter (TLD)"
  ],
  matches: [
    "Reference dosimetry and beam calibration",
    "Small field and high spatial resolution measurements",
    "2D dose distribution verification",
    "In-vivo dose measurements on patients"
  ],
  correctMatchIndices: [0, 1, 2, 3]
};

// Example procedural question template
export const linacWarmupQuestion: ProceduralQuestion = {
  id: 'RT-PROC-001',
  type: 'procedural',
  metadata: {
    ...radiationTherapyMetadata,
    difficulty: 'BEGINNER',
    tags: ['linac', 'QA', 'workflow'],
    knowledgeStars: ['linac-operation', 'daily-qa']
  },
  preferredMentors: ['Jesse', 'Kapoor'],
  template: {
    textTemplate: "{mentorIntro} {mentorInquiry} the correct sequence of steps for performing a morning linac warm-up and daily QA?",
    correctFeedbackTemplate: "{mentorFeedback} Following the correct sequence ensures proper warm-up of the machine components and valid QA results. {mentorTransition} this is a critical part of ensuring safe patient treatments.",
    incorrectFeedbackTemplate: "{mentorFeedback} The warm-up sequence is important for stabilizing the beam output. {mentorTransition} incorrect order can lead to inaccurate QA results or unnecessary troubleshooting."
  },
  steps: [
    "Power on the linac and control systems",
    "Allow the required warm-up time (typically 15-30 minutes)",
    "Select the energy for daily QA (typically 6MV photons first)",
    "Deliver warm-up monitor units for beam stability",
    "Set up the daily QA equipment (e.g., QA phantom and ionization chamber)",
    "Perform output constancy measurements",
    "Check beam flatness and symmetry",
    "Perform mechanical checks (e.g., lasers, optical distance indicator)",
    "Document all results in the QA log"
  ],
  stepExplanations: [
    "Starting the system allows electronics to initialize and stabilize",
    "This allows components (especially magnetron/klystron) to reach stable operating temperature",
    "Beginning with the most commonly used energy is standard practice",
    "Initial beam delivery stabilizes the output before measurements",
    "Proper setup ensures consistent geometry for measurements",
    "Output should be within ±3% of baseline",
    "Flatness and symmetry should be within ±2% of baseline",
    "Mechanical alignment is critical for accurate treatment setup",
    "Documentation is required for regulatory compliance and trend analysis"
  ]
};

// Example calculation question template with variable ranges
export const tprCalculationQuestion: CalculationQuestion = {
  id: 'RT-CALC-001',
  type: 'calculation',
  metadata: {
    ...radiationTherapyMetadata,
    tags: ['dosimetry', 'calculation', 'TPR'],
    knowledgeStars: ['tissue-phantom-ratio', 'dosimetry-protocols']
  },
  preferredMentors: ['Kapoor', 'Quinn'],
  template: {
    textTemplate: "{mentorIntro} {mentorInquiry} the Tissue-Phantom Ratio (TPR) at depth {dmax} cm for a 6 MV beam. The ionization readings are {readingAtDmax} nC at depth {dmax} cm and {readingAtRef} nC at the reference depth of {dref} cm. Both measurements were made with an SSD of 100 cm.",
    correctFeedbackTemplate: "{mentorFeedback} TPR is a critical parameter for dose calculations in radiation therapy. {mentorTransition} TPR is simply the ratio of dose at a given depth to the dose at reference depth in the same geometry.",
    incorrectFeedbackTemplate: "{mentorFeedback} TPR calculation requires careful attention to the measurement geometry. {mentorTransition} the readings must be compared at the same SSD to calculate TPR correctly."
  },
  variableRanges: {
    dmax: { min: 5, max: 15, step: 1 },
    dref: { min: 10, max: 10, step: 1 }, // Fixed at 10 cm
    readingAtDmax: { min: 1.2, max: 2.0, step: 0.01 },
    readingAtRef: { min: 2.0, max: 2.5, step: 0.01 }
  },
  formula: "TPR(dmax) = readingAtDmax / readingAtRef",
  precision: 3,
  units: "",
  acceptableAnswerRanges: [
    { 
      min: 0.6, 
      max: 0.85,
      feedback: "This is the expected range for TPR values at depths between 5-15 cm for 6 MV photons."
    }
  ]
};

// Example boast question template
export const stereotacticRadiosurgeryBoastQuestion: BoastQuestion = {
  id: 'RT-BOAST-001',
  type: 'boast',
  baseQuestionType: 'multipleChoice',
  metadata: {
    ...radiationTherapyMetadata,
    difficulty: 'ADVANCED',
    tags: ['SRS', 'brain', 'advanced-technique'],
    knowledgeStars: ['stereotactic-radiosurgery', 'treatment-planning-advanced']
  },
  preferredMentors: ['Quinn', 'Garcia'],
  template: {
    textTemplate: "{mentorIntro} {mentorInquiry} which of the following statements about single-isocenter multi-target stereotactic radiosurgery for brain metastases is FALSE?",
    correctFeedbackTemplate: "{mentorFeedback} Single-isocenter multi-target SRS is an advanced technique that requires sophisticated understanding of both the benefits and limitations. {mentorTransition} this nuanced understanding is critical for appropriate application of the technique.",
    incorrectFeedbackTemplate: "{mentorFeedback} Single-isocenter multi-target SRS presents a complex balance of efficiency and potential limitations. {mentorTransition} it's important to understand the geometric and dosimetric implications of this advanced approach."
  },
  options: [
    "It reduces treatment time compared to multiple individual isocenters",
    "It can achieve similar target coverage metrics to multiple isocenter techniques",
    "It is insensitive to rotational setup errors for peripheral targets",
    "It typically uses non-coplanar arcs to improve conformity",
    "It may result in increased low-dose spread between targets"
  ],
  correctOptionIndices: [2],
  rewardMultiplier: 1.5,
  penaltyMultiplier: 1.2
};

// Export all templates together
export const exampleTemplates = {
  fractionationQuestion,
  radiationDetectorsQuestion,
  linacWarmupQuestion,
  tprCalculationQuestion,
  stereotacticRadiosurgeryBoastQuestion
}; 