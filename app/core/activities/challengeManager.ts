import { KnowledgeDomain } from "../../types";
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
  starId?: string;            // Optional specific star to focus on
  questionCount?: number;     // Number of questions (default: based on type)
  timeLimit?: number;         // Time limit in seconds (optional)
  masteryThreshold?: number;  // Mastery threshold for success (default: based on difficulty)
}

// Active challenge state
export interface ActiveChallenge {
  id: string;
  config: ChallengeConfig;
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
 * Create a new challenge based on configuration
 */
export async function createChallenge(config: ChallengeConfig): Promise<ActiveChallenge> {
  // Get the appropriate number of questions based on challenge type
  const questionCount = config.questionCount || getDefaultQuestionCount(config.type);
  
  // Get the master threshold for the player from the star if provided
  const masteryPercentage = config.starId ? await getMasteryForStar(config.starId) : 50;
  
  // Select questions based on domain, star, and mastery
  let questions = await selectQuestions(
    config.domain,
    config.starId,
    masteryPercentage,
    questionCount
  );
  
  // For boss challenges, ensure we have a good mix of question types
  if (config.type === ChallengeType.BOSS) {
    questions = ensureBossChallengeQuestionMix(questions, config.domain, config.starId);
  }
  
  // Adjust difficulty based on challenge difficulty setting
  questions = adjustQuestionsForDifficulty(questions, config.difficulty, masteryPercentage);
  
  // Create the active challenge object
  const challenge: ActiveChallenge = {
    id: generateChallengeId(),
    config,
    questions,
    currentQuestionIndex: 0,
    startTime: Date.now(),
    answers: [],
    masteryGained: 0,
    status: "active"
  };
  
  return challenge;
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

// Ensure a good mix of question types for boss challenges
function ensureBossChallengeQuestionMix(
  questions: Question[],
  domain: KnowledgeDomain,
  starId?: string
): Question[] {
  // This function would ensure we have a good mix of question types for boss challenges
  // In a real implementation, you would:
  // 1. Check what types of questions we currently have
  // 2. Add any missing types to create a good mix
  
  // For now, we'll just return the original questions
  return questions;
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
  
  // Adjust each question based on the adjusted mastery
  return questions.map(question => adjustQuestionDifficulty(question, adjustedMastery));
}

// Mock implementation of answer evaluation (this would call into questionEvaluator)
function evaluateAnswer(question: Question, answer: any): boolean {
  // In a real implementation, this would use the appropriate question evaluator
  // For now, we'll just return a random result
  return Math.random() > 0.5;
} 