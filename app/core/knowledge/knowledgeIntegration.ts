import { KnowledgeDomain } from "../../types";
import { Question, QuestionType } from "../../types/questions";
import { getQuestionsForStar } from "../questions/questionLoader";

// Define mastery gain factors based on difficulty and correctness
const MASTERY_GAIN_FACTORS = {
  CORRECT: {
    1: 0.05,  // 5% gain for correct beginner questions
    2: 0.10,  // 10% gain for correct intermediate questions
    3: 0.15,  // 15% gain for correct advanced questions
  },
  INCORRECT: {
    1: -0.01,  // 1% loss for incorrect beginner questions
    2: -0.02,  // 2% loss for incorrect intermediate questions
    3: -0.03,  // 3% loss for incorrect advanced questions
  }
};

// Define threshold for forming new connections
const CONNECTION_FORMATION_THRESHOLD = 0.65; // 65% mastery required to form connections

/**
 * Calculate mastery increase based on question difficulty and correctness
 * @param starId Knowledge star ID
 * @param question Question that was answered
 * @param isCorrect Whether the answer was correct
 * @param riskFactor Risk factor (for boast challenges)
 * @returns Mastery gain value (can be negative for incorrect answers)
 */
export function calculateMasteryGain(
  starId: string,
  question: Question,
  isCorrect: boolean,
  riskFactor: number = 1.0
): number {
  // Get the difficulty level from the question tags
  const difficultyLevel = question.tags.difficulty;
  
  // Determine base mastery gain based on correctness and difficulty
  const gainFactors = isCorrect ? MASTERY_GAIN_FACTORS.CORRECT : MASTERY_GAIN_FACTORS.INCORRECT;
  const baseMasteryGain = gainFactors[difficultyLevel] || 0;
  
  // Apply risk factor for boast challenges
  const adjustedMasteryGain = baseMasteryGain * riskFactor;
  
  return adjustedMasteryGain;
}

/**
 * Apply mastery gain to a knowledge star
 * @param starId Knowledge star ID
 * @param masteryGain Mastery gain value (can be negative)
 * @returns Updated mastery value
 */
export async function applyMasteryGain(
  starId: string,
  masteryGain: number
): Promise<number> {
  // This will need to integrate with your knowledge system's state management
  // For now, we're just returning a mock result
  
  // In a real implementation:
  // 1. Get the current mastery from the knowledge store
  // 2. Apply the mastery gain (clamping between 0-100%)
  // 3. Update the store with the new mastery value
  // 4. Return the updated mastery
  
  return 0.5 + masteryGain; // Mock implementation
}

/**
 * Check if a new connection should be formed
 * @param sourceStarId Source knowledge star ID
 * @param targetStarId Target knowledge star ID
 * @param sourceMastery Mastery level of the source star
 * @returns Whether a connection should be formed
 */
export function shouldFormConnection(
  sourceStarId: string,
  targetStarId: string,
  sourceMastery: number
): boolean {
  // Only form connections if mastery exceeds the threshold
  return sourceMastery >= CONNECTION_FORMATION_THRESHOLD;
}

/**
 * Check for pattern recognition based on recently answered questions
 * This can be used to automatically form connections between stars
 * @param recentQuestions Array of recently answered questions
 * @param masteryLevels Record of star IDs to mastery levels
 * @returns Array of star ID pairs that should be connected
 */
export function detectKnowledgePatterns(
  recentQuestions: Question[],
  masteryLevels: Record<string, number>
): Array<[string, string]> {
  // Group questions by knowledge node/star
  const starQuestionGroups: Record<string, Question[]> = {};
  
  // Group questions by their knowledge node
  recentQuestions.forEach(question => {
    const starId = question.tags.knowledgeNode;
    if (!starQuestionGroups[starId]) {
      starQuestionGroups[starId] = [];
    }
    starQuestionGroups[starId].push(question);
  });
  
  // Find pairs of stars that had questions answered correctly
  const starIds = Object.keys(starQuestionGroups);
  const connectionCandidates: Array<[string, string]> = [];
  
  // Check all pairs of stars
  for (let i = 0; i < starIds.length; i++) {
    for (let j = i + 1; j < starIds.length; j++) {
      const star1 = starIds[i];
      const star2 = starIds[j];
      
      // Check if both stars have sufficient mastery for connection
      if (
        masteryLevels[star1] >= CONNECTION_FORMATION_THRESHOLD &&
        masteryLevels[star2] >= CONNECTION_FORMATION_THRESHOLD
      ) {
        connectionCandidates.push([star1, star2]);
      }
    }
  }
  
  return connectionCandidates;
}

/**
 * Update knowledge system after a question has been answered
 * @param question Question that was answered
 * @param isCorrect Whether the answer was correct
 * @param masteryGain Mastery gain value
 */
export async function updateKnowledgeFromQuestion(
  question: Question,
  isCorrect: boolean,
  masteryGain: number
): Promise<void> {
  // Get the star ID from the question
  const starId = question.tags.knowledgeNode;
  
  // Apply mastery gain to the star
  const updatedMastery = await applyMasteryGain(starId, masteryGain);
  
  // For correct answers, check if this unlocks any new stars or forms connections
  if (isCorrect && updatedMastery >= CONNECTION_FORMATION_THRESHOLD) {
    // This is where you would integrate with the constellation system
    // to potentially unlock new stars or form connections
  }
}

/**
 * Check if answering a question correctly could lead to star discovery
 * @param domain Knowledge domain
 * @param starId Current star ID
 * @returns Whether a star discovery is possible
 */
export async function canDiscoverStar(
  domain: KnowledgeDomain,
  starId: string
): Promise<boolean> {
  // This function would check if answering questions for this star
  // could potentially lead to discovering new stars
  
  // In a real implementation, you would:
  // 1. Check the constellation data to see if there are undiscovered 
  //    stars connected to this one
  // 2. Check if the current mastery level is close to the threshold
  //    for discovery
  
  return true; // Mock implementation
}

/**
 * Get the potential knowledge gain from a question
 * @param question Question to evaluate
 * @returns Potential mastery gain (maximum possible)
 */
export function getPotentialKnowledgeGain(question: Question): number {
  // Get the difficulty level from the question tags
  const difficultyLevel = question.tags.difficulty;
  
  // Return the maximum possible gain for this difficulty
  return MASTERY_GAIN_FACTORS.CORRECT[difficultyLevel] || 0;
} 