import { KnowledgeDomain, ActivityDifficulty } from "../../types";
import { Question, QuestionType } from "../../types/questions";
import { getAllDomainQuestions, getQuestionsForStar, loadQuestions } from "./questionLoader";

// Difficulty distribution by mastery range
const DIFFICULTY_DISTRIBUTION = {
  NOVICE: { // 0-25% mastery
    beginner: 0.7,
    intermediate: 0.3,
    advanced: 0.0
  },
  DEVELOPING: { // 25-50% mastery
    beginner: 0.3,
    intermediate: 0.5,
    advanced: 0.2
  },
  PROFICIENT: { // 50-75% mastery
    beginner: 0.1,
    intermediate: 0.5,
    advanced: 0.4
  },
  EXPERT: { // 75-100% mastery
    beginner: 0.0,
    intermediate: 0.3,
    advanced: 0.7
  }
};

// Map mastery percentage to difficulty category
function getDifficultyCategory(masteryPercentage: number): keyof typeof DIFFICULTY_DISTRIBUTION {
  if (masteryPercentage < 25) return "NOVICE";
  if (masteryPercentage < 50) return "DEVELOPING";
  if (masteryPercentage < 75) return "PROFICIENT";
  return "EXPERT";
}

// Convert string difficulty to numeric difficulty level
function difficultyToLevel(difficulty: string): number {
  switch (difficulty.toLowerCase()) {
    case "beginner": return 1;
    case "intermediate": return 2;
    case "advanced": return 3;
    default: return 1;
  }
}

// Track questions that have been used recently to avoid repetition
const recentlyUsedQuestions = new Set<string>();
const MAX_RECENT_QUESTIONS = 50; // Maximum number of questions to track

/**
 * Select questions based on domain, star, and mastery level
 */
export async function selectQuestions(
  domain: KnowledgeDomain,
  starId?: string,
  masteryPercentage: number = 0,
  count: number = 5,
  questionTypes?: QuestionType[]
): Promise<Question[]> {
  try {
    // Get appropriate questions
    let availableQuestions: Question[];
    
    if (starId) {
      // If a specific star is provided, get questions for that star
      availableQuestions = await getQuestionsForStar(starId);
    } else {
      // Otherwise, get all questions for the domain
      availableQuestions = await getAllDomainQuestions(domain);
    }
    
    // Filter by question type if specified
    if (questionTypes && questionTypes.length > 0) {
      availableQuestions = availableQuestions.filter(q => 
        questionTypes.includes(q.type as QuestionType)
      );
    }
    
    // Filter out recently used questions
    const freshQuestions = availableQuestions.filter(q => !recentlyUsedQuestions.has(q.id));
    
    // If we don't have enough fresh questions, we'll need to reuse some
    const questionsToSelectFrom = freshQuestions.length >= count ? 
      freshQuestions : availableQuestions;
    
    // Determine the difficulty distribution based on mastery
    const difficultyCategory = getDifficultyCategory(masteryPercentage);
    const distribution = DIFFICULTY_DISTRIBUTION[difficultyCategory];
    
    // Calculate how many questions of each difficulty to select
    const beginnerCount = Math.round(count * distribution.beginner);
    const intermediateCount = Math.round(count * distribution.intermediate);
    const advancedCount = count - beginnerCount - intermediateCount;
    
    // Group questions by difficulty
    const beginnerQuestions = questionsToSelectFrom.filter(q => q.tags.difficulty === 1);
    const intermediateQuestions = questionsToSelectFrom.filter(q => q.tags.difficulty === 2);
    const advancedQuestions = questionsToSelectFrom.filter(q => q.tags.difficulty === 3);
    
    // Select random questions from each difficulty group
    const selected: Question[] = [
      ...selectRandomQuestions(beginnerQuestions, beginnerCount),
      ...selectRandomQuestions(intermediateQuestions, intermediateCount),
      ...selectRandomQuestions(advancedQuestions, advancedCount)
    ];
    
    // If we don't have enough questions of the right difficulties, fill in with whatever is available
    if (selected.length < count) {
      const remaining = count - selected.length;
      const additionalQuestions = selectRandomQuestions(
        questionsToSelectFrom.filter(q => !selected.includes(q)),
        remaining
      );
      selected.push(...additionalQuestions);
    }
    
    // Mark selected questions as recently used
    selected.forEach(q => {
      recentlyUsedQuestions.add(q.id);
      
      // If we have too many recent questions, remove the oldest ones
      if (recentlyUsedQuestions.size > MAX_RECENT_QUESTIONS) {
        const oldestId = recentlyUsedQuestions.values().next().value;
        recentlyUsedQuestions.delete(oldestId);
      }
    });
    
    return selected;
  } catch (error) {
    console.error("Error selecting questions:", error);
    return [];
  }
}

/**
 * Select a random subset of questions
 */
function selectRandomQuestions(questions: Question[], count: number): Question[] {
  if (count <= 0 || questions.length === 0) return [];
  
  const shuffled = [...questions].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, questions.length));
}

/**
 * Select questions for an activity challenge based on activity difficulty
 */
export async function selectActivityQuestions(
  domain: KnowledgeDomain,
  activityDifficulty: ActivityDifficulty,
  count: number = 3,
  questionTypes?: QuestionType[]
): Promise<Question[]> {
  try {
    // Map activity difficulty to mastery percentage and difficulty bias
    let masteryPercentage = 0;
    let difficultyBias = 0;
    
    switch (activityDifficulty) {
      case ActivityDifficulty.EASY:
        masteryPercentage = 25; // Lower mastery = easier questions
        difficultyBias = -10;   // Bias toward easier questions
        break;
      case ActivityDifficulty.MEDIUM:
        masteryPercentage = 50; // Medium mastery = balanced questions
        difficultyBias = 0;     // No bias
        break;
      case ActivityDifficulty.HARD:
        masteryPercentage = 75; // Higher mastery = harder questions
        difficultyBias = 15;    // Bias toward harder questions
        break;
      default:
        masteryPercentage = 40; // Default mastery level
        difficultyBias = 0;     // No bias by default
    }
    
    // Adjust mastery percentage with difficulty bias (clamped to 0-100)
    const adjustedMastery = Math.max(0, Math.min(100, masteryPercentage + difficultyBias));
    
    // Select questions using the main selection function
    return selectQuestions(domain, undefined, adjustedMastery, count, questionTypes);
  } catch (error) {
    console.error("Error selecting activity questions:", error);
    return [];
  }
}

/**
 * Select a boast question (higher difficulty version of a standard question)
 */
export async function selectBoastQuestion(
  domain: KnowledgeDomain,
  starId: string
): Promise<Question | null> {
  try {
    // Get advanced questions for this star
    const starQuestions = await getQuestionsForStar(starId);
    const advancedQuestions = starQuestions.filter(q => q.tags.difficulty === 3);
    
    if (advancedQuestions.length === 0) {
      return null;
    }
    
    // Select a random advanced question
    const randomIndex = Math.floor(Math.random() * advancedQuestions.length);
    return advancedQuestions[randomIndex];
  } catch (error) {
    console.error("Error selecting boast question:", error);
    return null;
  }
} 