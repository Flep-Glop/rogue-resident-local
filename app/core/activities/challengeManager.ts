import { KnowledgeDomain, MentorId } from "../../types";
import { Question, QuestionType } from "../../types/questions";
import { selectQuestions } from "../questions/questionManager";
import { adjustQuestionDifficulty } from "../questions/questionGenerator";
import { updateKnowledgeFromQuestion, calculateMasteryGain } from "../knowledge/knowledgeIntegration";

// Challenge types
export enum ChallengeType {
  STANDARD = "standard",      // Normal challenge with questions
  BOSS = "boss",              // Boss encounter with special sequence
  BOAST = "boast",            // Boast challenge with risk/reward
  DISCOVERY = "discovery"     // Challenge that can lead to discovering new knowledge
}

// Challenge difficulty settings
export enum ChallengeDifficulty {
  EASY = "easy",              // Easier than player's level
  BALANCED = "balanced",      // Matched to player's level
  HARD = "hard"               // Harder than player's level
}

// Challenge configuration
export interface ChallengeConfig {
  type: ChallengeType;
  difficulty: ChallengeDifficulty;
  domain: KnowledgeDomain;
  mentor?: MentorId;          // Adding mentor to filter questions by mentor
  subtopic?: string;          // Adding subtopic to create more cohesive challenges
  starId?: string;            // Optional specific star to focus on
  questionCount?: number;     // Number of questions (default: based on type)
  timeLimit?: number;         // Time limit in seconds (optional)
  masteryThreshold?: number;  // Mastery threshold for success (default: based on difficulty)
  title?: string;             // Challenge title (default: generated based on type and mentor)
}

// Challenge Question Filter
export interface QuestionFilter {
  domain: KnowledgeDomain;
  mentor?: MentorId;
  subtopic?: string;
  starId?: string;
  difficulty?: {
    min: number;
    max: number;
  };
  excludeRecent?: boolean;
  preferTypes?: QuestionType[];
  distribution?: Record<QuestionType, number>; // Percentage distribution of question types
}

// Active challenge state
export interface ActiveChallenge {
  id: string;
  config: ChallengeConfig;
  title: string;              // Adding explicit title for display
  questions: Question[];
  currentQuestionIndex: number;
  startTime: number;
  answers: Array<{
    questionId: string;
    answer: any;
    isCorrect: boolean;
    masteryGain: number;
  }>;
  masteryGained: number;
  status: "active" | "completed" | "failed";
}

/**
 * Map mentors to their primary domains
 */
const MENTOR_DOMAIN_MAP: Record<MentorId, KnowledgeDomain> = {
  [MentorId.KAPOOR]: KnowledgeDomain.DOSIMETRY,
  [MentorId.JESSE]: KnowledgeDomain.LINAC_ANATOMY,
  [MentorId.GARCIA]: KnowledgeDomain.RADIATION_THERAPY,
  [MentorId.QUINN]: KnowledgeDomain.TREATMENT_PLANNING
};

/**
 * Challenge titles by type and mentor
 */
const CHALLENGE_TITLES: Record<ChallengeType, Record<MentorId, string[]>> = {
  [ChallengeType.STANDARD]: {
    [MentorId.KAPOOR]: ["Morning Rounds with Dr. Kapoor", "QA Review with Dr. Kapoor", "Dosimetry Discussion"],
    [MentorId.JESSE]: ["Machine Inspection with Dr. Jesse", "Linac Components Review", "Anatomy Quiz with Dr. Jesse"],
    [MentorId.GARCIA]: ["Patient Assessment with Dr. Garcia", "Treatment Strategy Discussion", "Clinical Rounds with Dr. Garcia"],
    [MentorId.QUINN]: ["Planning Session with Dr. Quinn", "Plan Review Meeting", "Treatment Planning Workshop"]
  },
  [ChallengeType.BOSS]: {
    [MentorId.KAPOOR]: ["Comprehensive QA Audit", "Dosimetry Certification Test", "Radiation Safety Inspection"],
    [MentorId.JESSE]: ["Machine Troubleshooting Challenge", "Component Identification Challenge", "Linac Certification Exam"],
    [MentorId.GARCIA]: ["Patient Case Conference", "Tumor Board Presentation", "Clinical Skills Assessment"],
    [MentorId.QUINN]: ["Plan Optimization Challenge", "Critical Case Review", "Treatment Planning Competition"]
  },
  [ChallengeType.BOAST]: {
    [MentorId.KAPOOR]: ["Dosimetry Speed Challenge", "Advanced QA Challenge", "Calibration Mastery Test"],
    [MentorId.JESSE]: ["Rapid Component Identification", "Advanced Machine Knowledge Test", "Linac Expert Challenge"],
    [MentorId.GARCIA]: ["Advanced Clinical Scenario", "Rare Case Analysis", "Treatment Complication Challenge"],
    [MentorId.QUINN]: ["Complex Plan Optimization", "Dose Constraint Challenge", "Critical Structure Sparing Test"]
  },
  [ChallengeType.DISCOVERY]: {
    [MentorId.KAPOOR]: ["Experimental Dosimetry Technique", "New QA Protocol Discussion", "Radiation Measurement Innovation"],
    [MentorId.JESSE]: ["Machine Innovation Workshop", "New Component Testing", "Advanced Imaging Integration"],
    [MentorId.GARCIA]: ["Emerging Treatment Technique", "Novel Protocol Discussion", "New Clinical Approach"],
    [MentorId.QUINN]: ["Experimental Planning Algorithm", "Novel Constraint System", "Adaptive Planning Session"]
  }
};

/**
 * Generate a title for a challenge based on type and mentor
 */
function generateChallengeTitle(type: ChallengeType, mentor?: MentorId): string {
  if (!mentor) {
    return `Challenge: ${type.charAt(0).toUpperCase() + type.slice(1)}`;
  }
  
  const titlesForType = CHALLENGE_TITLES[type][mentor];
  if (!titlesForType || titlesForType.length === 0) {
    return `${mentor} ${type.charAt(0).toUpperCase() + type.slice(1)} Challenge`;
  }
  
  // Select a random title from the available options
  const randomIndex = Math.floor(Math.random() * titlesForType.length);
  return titlesForType[randomIndex];
}

/**
 * Create a new challenge based on configuration
 */
export async function createChallenge(config: ChallengeConfig): Promise<ActiveChallenge> {
  // Get the appropriate number of questions based on challenge type
  const questionCount = config.questionCount || getDefaultQuestionCount(config.type);
  
  // Get the mastery threshold for the player from the star if provided
  const masteryPercentage = config.starId ? await getMasteryForStar(config.starId) : 50;
  
  // Create a question filter based on the challenge config
  const filter: QuestionFilter = {
    domain: config.domain,
    mentor: config.mentor,
    subtopic: config.subtopic,
    starId: config.starId,
    excludeRecent: true
  };
  
  // Add distribution for boss challenges to ensure a good mix of question types
  if (config.type === ChallengeType.BOSS) {
    filter.distribution = {
      [QuestionType.MULTIPLE_CHOICE]: 0.25,
      [QuestionType.MATCHING]: 0.25,
      [QuestionType.PROCEDURAL]: 0.25,
      [QuestionType.CALCULATION]: 0.25,
      [QuestionType.BOAST]: 0
    };
  }
  
  // Select questions based on the filter - mentor filtering is prioritized
  const questions = await selectQuestionsWithFilter(filter, questionCount, masteryPercentage);
  
  // Log warning if not enough questions found
  if (questions.length < questionCount) {
    console.log(`Warning: Only found ${questions.length} questions for challenge configuration. Needed ${questionCount}.`);
  }
  
  // Adjust difficulty based on challenge difficulty setting
  const adjustedQuestions = adjustQuestionsForDifficulty(questions, config.difficulty, masteryPercentage);
  
  // Generate a title if one wasn't provided
  const title = config.title || generateChallengeTitle(config.type, config.mentor);
  
  // Create the active challenge object
  const challenge: ActiveChallenge = {
    id: generateChallengeId(),
    config,
    title,
    questions: adjustedQuestions,
    currentQuestionIndex: 0,
    startTime: Date.now(),
    answers: [],
    masteryGained: 0,
    status: "active"
  };
  
  return challenge;
}

/**
 * Create a thematic challenge focused on a specific topic
 */
export async function createThematicChallenge(
  domain: KnowledgeDomain,
  subtopic: string,
  mentor?: MentorId,
  questionCount: number = 4
): Promise<ActiveChallenge> {
  // If no mentor is specified, select the mentor primarily associated with this domain
  const primaryMentor = mentor || getMentorForDomain(domain);
  
  // Create the challenge config
  const config: ChallengeConfig = {
    type: ChallengeType.STANDARD,
    difficulty: ChallengeDifficulty.BALANCED,
    domain,
    mentor: primaryMentor,
    subtopic,
    questionCount,
    title: `${subtopic} Review with ${getMentorName(primaryMentor)}`
  };
  
  return createChallenge(config);
}

/**
 * Create a boss encounter challenge with a special sequence of questions
 */
export async function createBossEncounter(
  domain: KnowledgeDomain,
  mentor?: MentorId,
  subtopic?: string
): Promise<ActiveChallenge> {
  // If no mentor is specified, select the mentor primarily associated with this domain
  const primaryMentor = mentor || getMentorForDomain(domain);
  
  // Create the challenge config
  const config: ChallengeConfig = {
    type: ChallengeType.BOSS,
    difficulty: ChallengeDifficulty.HARD,
    domain,
    mentor: primaryMentor,
    subtopic,
    questionCount: 8, // Boss encounters have more questions
    title: generateChallengeTitle(ChallengeType.BOSS, primaryMentor)
  };
  
  return createChallenge(config);
}

/**
 * Create a "Morning Rounds" challenge with a specific mentor
 */
export async function createMorningRoundsChallenge(mentor: MentorId): Promise<ActiveChallenge> {
  // Get the domain for this mentor
  const domain = MENTOR_DOMAIN_MAP[mentor];
  
  // Create the challenge config
  const config: ChallengeConfig = {
    type: ChallengeType.STANDARD,
    difficulty: ChallengeDifficulty.BALANCED,
    domain,
    mentor,
    questionCount: 3, // Morning rounds are shorter
    title: `Morning Rounds with ${getMentorName(mentor)}`
  };
  
  return createChallenge(config);
}

/**
 * Select questions with a detailed filter
 */
async function selectQuestionsWithFilter(
  filter: QuestionFilter,
  count: number,
  masteryPercentage: number
): Promise<Question[]> {
  try {
    // Get all questions from the domain first
    let allDomainQuestions = await selectQuestions(
      filter.domain,
      filter.starId,
      masteryPercentage,
      count * 3, // Get more questions to have a better pool to filter from
      filter.preferTypes
    );
    
    // Apply mentor filter FIRST if specified - this is the highest priority
    if (filter.mentor) {
      allDomainQuestions = allDomainQuestions.filter(q => q.tags.mentor === filter.mentor);
      
      // If we don't have enough questions with this mentor, log a warning but DO NOT fall back
      if (allDomainQuestions.length < count) {
        console.log(`Warning: Only found ${allDomainQuestions.length} questions for mentor ${filter.mentor}. Need ${count}.`);
      }
    }
    
    // Apply subtopic filter if specified
    if (filter.subtopic) {
      const subtopicQuestions = allDomainQuestions.filter(q => q.tags.subtopic === filter.subtopic);
      
      // Only use subtopic filter if we have enough questions
      if (subtopicQuestions.length >= count * 0.7) { // At least 70% of requested count
        allDomainQuestions = subtopicQuestions;
      } else {
        console.log(`Not enough questions for subtopic ${filter.subtopic}, using general pool for mentor ${filter.mentor}`);
      }
    }
    
    // Apply difficulty filter if specified
    if (filter.difficulty) {
      const difficultyQuestions = allDomainQuestions.filter(q => 
        q.tags.difficulty >= filter.difficulty.min && 
        q.tags.difficulty <= filter.difficulty.max
      );
      
      // Only use difficulty filter if we have enough questions
      if (difficultyQuestions.length >= count * 0.7) { // At least 70% of requested count
        allDomainQuestions = difficultyQuestions;
      }
    }
    
    // If we have a distribution specified, select according to the distribution
    if (filter.distribution && Object.keys(filter.distribution).length > 0) {
      const questionsByType: Record<QuestionType, Question[]> = {
        [QuestionType.MULTIPLE_CHOICE]: [],
        [QuestionType.MATCHING]: [],
        [QuestionType.PROCEDURAL]: [],
        [QuestionType.CALCULATION]: [],
        [QuestionType.BOAST]: []
      };
      
      // Group questions by type
      allDomainQuestions.forEach(q => {
        const type = q.type as QuestionType;
        if (!questionsByType[type]) {
          questionsByType[type] = [];
        }
        questionsByType[type].push(q);
      });
      
      // Select questions according to the distribution
      const distributedQuestions: Question[] = [];
      for (const [type, percentage] of Object.entries(filter.distribution)) {
        const typeCount = Math.round(count * percentage);
        const availableQuestions = questionsByType[type as QuestionType] || [];
        
        const selected = selectRandomQuestions(availableQuestions, typeCount);
        distributedQuestions.push(...selected);
      }
      
      // If we don't have enough questions, add some random ones to fill the count
      if (distributedQuestions.length < count) {
        const remainingCount = count - distributedQuestions.length;
        const remainingQuestions = allDomainQuestions.filter(q => !distributedQuestions.includes(q));
        const additionalQuestions = selectRandomQuestions(remainingQuestions, remainingCount);
        
        distributedQuestions.push(...additionalQuestions);
      }
      
      return distributedQuestions;
    }
    
    // Shuffle the questions to get a random selection
    const shuffledQuestions = selectRandomQuestions(allDomainQuestions, count);
    
    // Return the selected questions, limited by count
    return shuffledQuestions;
  } catch (error) {
    console.error("Error selecting questions with filter:", error);
    return [];
  }
}

/**
 * Answer the current question in a challenge
 */
export async function answerChallengeQuestion(
  challenge: ActiveChallenge,
  answer: any,
  riskFactor: number = 1.0
): Promise<{
  challenge: ActiveChallenge;
  isCorrect: boolean;
  masteryGain: number;
  isComplete: boolean;
}> {
  // Get the current question
  const currentQuestion = challenge.questions[challenge.currentQuestionIndex];
  if (!currentQuestion) {
    throw new Error("No active question in the challenge");
  }
  
  // Evaluate the answer (this would call into questionEvaluator in a real implementation)
  const isCorrect = evaluateAnswer(currentQuestion, answer);
  
  // Calculate mastery gain
  const starId = currentQuestion.tags.knowledgeNode;
  const masteryGain = calculateMasteryGain(starId, currentQuestion, isCorrect, riskFactor);
  
  // Update the challenge state
  const updatedChallenge = {
    ...challenge,
    answers: [
      ...challenge.answers,
      {
        questionId: currentQuestion.id,
        answer,
        isCorrect,
        masteryGain
      }
    ],
    masteryGained: challenge.masteryGained + masteryGain,
    currentQuestionIndex: challenge.currentQuestionIndex + 1
  };
  
  // Check if the challenge is complete
  const isComplete = updatedChallenge.currentQuestionIndex >= updatedChallenge.questions.length;
  if (isComplete) {
    updatedChallenge.status = "completed";
  }
  
  // Update the knowledge system with the answer results
  await updateKnowledgeFromQuestion(currentQuestion, isCorrect, masteryGain);
  
  return {
    challenge: updatedChallenge,
    isCorrect,
    masteryGain,
    isComplete
  };
}

/**
 * Get the final results of a completed challenge
 */
export function getChallengeSummary(challenge: ActiveChallenge): {
  totalQuestions: number;
  correctAnswers: number;
  totalMasteryGained: number;
  timeTaken: number;
  isPassed: boolean;
} {
  // Calculate the number of correct answers
  const correctAnswers = challenge.answers.filter(answer => answer.isCorrect).length;
  
  // Calculate time taken
  const timeTaken = (challenge.answers.length > 0)
    ? (challenge.answers[challenge.answers.length - 1].answer.timestamp - challenge.startTime) / 1000
    : 0;
  
  // Determine if the challenge was passed
  const masteryThreshold = challenge.config.masteryThreshold || 
    getDefaultMasteryThreshold(challenge.config.difficulty);
  const isPassed = challenge.masteryGained >= masteryThreshold;
  
  return {
    totalQuestions: challenge.questions.length,
    correctAnswers,
    totalMasteryGained: challenge.masteryGained,
    timeTaken,
    isPassed
  };
}

// Helper function to get the default number of questions based on challenge type
function getDefaultQuestionCount(type: ChallengeType): number {
  switch (type) {
    case ChallengeType.STANDARD: return 5;
    case ChallengeType.BOSS: return 8;
    case ChallengeType.BOAST: return 3;
    case ChallengeType.DISCOVERY: return 4;
    default: return 5;
  }
}

// Helper function to get default mastery threshold based on difficulty
function getDefaultMasteryThreshold(difficulty: ChallengeDifficulty): number {
  switch (difficulty) {
    case ChallengeDifficulty.EASY: return 0.1;    // 10% mastery gain
    case ChallengeDifficulty.BALANCED: return 0.2; // 20% mastery gain
    case ChallengeDifficulty.HARD: return 0.3;    // 30% mastery gain
    default: return 0.2;
  }
}

// Generate a unique ID for a challenge
function generateChallengeId(): string {
  return `challenge-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

// Get mastery for a specific star
async function getMasteryForStar(starId: string): Promise<number> {
  // In a real implementation, this would query the knowledge system
  // For now, we'll just return a mock value
  return 50; // 50% mastery
}

// Select random questions
function selectRandomQuestions(questions: Question[], count: number): Question[] {
  if (count <= 0 || questions.length === 0) return [];
  
  const shuffled = [...questions].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, questions.length));
}

// Adjust question difficulty based on challenge difficulty setting
function adjustQuestionsForDifficulty(
  questions: Question[],
  challengeDifficulty: ChallengeDifficulty,
  playerMastery: number
): Question[] {
  // Adjust the apparent mastery level based on challenge difficulty
  let adjustedMastery = playerMastery;
  
  switch (challengeDifficulty) {
    case ChallengeDifficulty.EASY:
      adjustedMastery = Math.min(100, playerMastery + 20); // Make it easier
      break;
    case ChallengeDifficulty.BALANCED:
      // No adjustment needed
      break;
    case ChallengeDifficulty.HARD:
      adjustedMastery = Math.max(0, playerMastery - 20); // Make it harder
      break;
  }
  
  // For each question, adjust difficulty based on the adjusted mastery
  return questions.map(question => adjustQuestionDifficulty(question, adjustedMastery));
}

// Placeholder for answer evaluation
function evaluateAnswer(question: Question, answer: any): boolean {
  // In a real implementation, this would call into questionEvaluator.ts
  // For now, we'll just return a mock value
  return Math.random() > 0.3; // 70% chance of being correct
}

/**
 * Get the mentor primarily associated with a domain
 */
function getMentorForDomain(domain: KnowledgeDomain): MentorId {
  for (const [mentorId, mentorDomain] of Object.entries(MENTOR_DOMAIN_MAP)) {
    if (mentorDomain === domain) {
      return mentorId as MentorId;
    }
  }
  // Default to a random mentor if no match is found
  const mentors = Object.keys(MENTOR_DOMAIN_MAP);
  return mentors[Math.floor(Math.random() * mentors.length)] as MentorId;
}

/**
 * Get mentor name for display
 */
function getMentorName(mentorId: MentorId): string {
  switch (mentorId) {
    case MentorId.KAPOOR: return "Dr. Kapoor";
    case MentorId.JESSE: return "Dr. Jesse";
    case MentorId.GARCIA: return "Dr. Garcia";
    case MentorId.QUINN: return "Dr. Quinn";
    default: return "Mentor";
  }
}

/**
 * Create a challenge with mentor-specific questions only
 */
export async function createMentorSpecificChallenge(
  mentor: MentorId,
  title?: string
): Promise<ActiveChallenge> {
  // Create a challenge config that prioritizes mentor over domain
  const config: ChallengeConfig = {
    type: ChallengeType.STANDARD,
    difficulty: ChallengeDifficulty.BALANCED,
    domain: MENTOR_DOMAIN_MAP[mentor], // Use the mentor's primary domain as default
    mentor: mentor, // Set the mentor explicitly
    questionCount: 5,
    title: title || `Session with ${getMentorName(mentor)}`
  };
  
  return createChallenge(config);
} 