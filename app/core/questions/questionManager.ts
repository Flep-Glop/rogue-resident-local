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
    // Log the inputs to help debug
    console.log(`[questionManager] selectQuestions called with: domain=${domain}, questionTypes=${JSON.stringify(questionTypes || [])}`);
      // Special handling for boast questions - always get them from advanced difficulty
  if (questionTypes && questionTypes.includes('boast' as QuestionType)) {
    console.log(`[questionManager] Specifically looking for boast questions in ${domain} advanced.json`);
    try {
      // Directly load the advanced difficulty questions for boast type
      const advancedCollection = await loadQuestions(domain, "advanced");
      console.log(`[questionManager] Boast Path - advancedCollection for ${domain}:`, JSON.stringify(advancedCollection.questions.map(q => ({id: q.id, type: q.type, difficulty: q.tags?.difficulty}))));
      
      // Filter for boast-type questions only - check both structure formats
      const boastQuestions = advancedCollection.questions.filter(q => {
        // Log each question's type to debug
        console.log(`Question ${q.id}: type=${q.type}, tags.difficulty=${q.tags?.difficulty}`);
        
        // Both conditions should match boast questions:
        // 1. The question has type 'boast'
        // 2. The question has difficulty 3 (advanced)
        return q.type === 'boast' && q.tags?.difficulty === 3;
      });
      
      console.log(`[questionManager] Found ${boastQuestions.length} boast questions in advanced difficulty`);
      
      if (boastQuestions.length > 0) {
        // Return the boast questions directly - they're always advanced difficulty
        return boastQuestions.slice(0, count);
      }
    } catch (error) {
      console.error(`[questionManager] Error loading boast questions: ${error}`);
      // Continue with normal question selection if this fails
    }
    }
    
    // Regular question selection logic (unchanged)
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
  questionTypes?: QuestionType[],
  activityMentor?: string
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
    
    // Select questions using the main selection function - fetch more than needed to allow for filtering
    let allQuestions = await selectQuestions(domain, undefined, adjustedMastery, count * 3, questionTypes);
    
    // Filter by type if specified
    if (questionTypes && questionTypes.length > 0) {
      allQuestions = allQuestions.filter(q => questionTypes.includes(q.type as QuestionType));
    }
    
    // If we have a mentor specified, prioritize questions for that mentor
    let selectedQuestions: Question[] = [];
    
    if (activityMentor) {
      // Debug: log available mentors in the questions
      const availableMentors = [...new Set(allQuestions.map((q: any) => q.tags?.mentor).filter(Boolean))];
      console.log(`[questionManager] Available mentors in questions:`, availableMentors, `Looking for: ${activityMentor}`);
      
      // First try to find questions specific to this mentor (mentor is in tags)
      const mentorQuestions = allQuestions.filter((q: any) => q.tags?.mentor === activityMentor);
      
      // Then look for questions with no specific mentor (generic)
      const genericQuestions = allQuestions.filter((q: any) => !q.tags?.mentor);
      
      // Finally, use questions with other mentors if needed - these will need mentor replacement
      const otherMentorQuestions = allQuestions.filter((q: any) => 
        q.tags?.mentor && q.tags.mentor !== activityMentor
      );
      
      // Debug logging for mentor filtering results
      console.log(`[questionManager] Mentor filtering results - Specific: ${mentorQuestions.length}, Generic: ${genericQuestions.length}, Other: ${otherMentorQuestions.length}`);
      
      if (mentorQuestions.length === 0) {
        console.log(`[questionManager] No questions found specific to mentor ${activityMentor}, using generic questions`);
      }
      
      // Combine in priority order: specific mentor, generic, then other mentors
      selectedQuestions = [
        ...mentorQuestions,
        ...genericQuestions,
        ...otherMentorQuestions
      ].slice(0, count);
    } else {
      // If no mentor specified, just take the first 'count' questions
      selectedQuestions = allQuestions.slice(0, count);
    }
    
    return selectedQuestions;
  } catch (error) {
    console.error("[questionManager] Error selecting activity questions:", error);
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