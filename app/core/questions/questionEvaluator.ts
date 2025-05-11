import {
  CalculationQuestion,
  MatchingPair,
  MatchingQuestion,
  MultipleChoiceQuestion,
  ProceduralQuestion,
  Question,
  QuestionType,
} from "../../types/questions";
import { loadBanks } from "./questionLoader";

// Constants for mastery gain calculation
const MASTERY_GAIN_RANGES = {
  [QuestionType.MULTIPLE_CHOICE]: { min: 1, max: 4 }, // 1-4% mastery gain
  [QuestionType.MATCHING]: { min: 2, max: 5 },        // 2-5% mastery gain
  [QuestionType.PROCEDURAL]: { min: 3, max: 6 },      // 3-6% mastery gain
  [QuestionType.CALCULATION]: { min: 5, max: 8 },     // 5-8% mastery gain
  [QuestionType.BOAST]: { min: 8, max: 12 },          // 8-12% mastery gain
};

// Difficulty multipliers for mastery gain
const DIFFICULTY_MULTIPLIERS = {
  1: 0.8,  // Beginner: 80% of base
  2: 1.0,  // Intermediate: 100% of base
  3: 1.5   // Advanced: 150% of base
};

/**
 * Result of evaluating a question
 */
export interface QuestionResult {
  correct: boolean;
  masteryGain: number;
  feedback: string;
}

/**
 * Evaluate a multiple choice question
 */
export function evaluateMultipleChoice(
  question: MultipleChoiceQuestion,
  selectedOptionIndex: number
): QuestionResult {
  // Get the selected option
  const selectedOption = question.options[selectedOptionIndex];
  
  if (!selectedOption) {
    return {
      correct: false,
      masteryGain: 0,
      feedback: "Invalid option selected."
    };
  }
  
  // Check if the selected option is correct
  const correct = selectedOption.isCorrect;
  
  // Calculate mastery gain
  const masteryGain = correct ? calculateMasteryGain(question) : 0;
  
  // Get appropriate feedback
  const feedback = correct ? question.feedback.correct : question.feedback.incorrect;
  
  return {
    correct,
    masteryGain,
    feedback
  };
}

/**
 * Evaluate a matching question
 */
export async function evaluateMatching(
  question: MatchingQuestion,
  userMatches: Record<string, number[] | string[] | number | string>
): Promise<QuestionResult> {
  try {
    // Normalize user matches to handle both arrays and single values
    const normalizedUserMatches: Record<string, string[]> = {};
    
    Object.entries(userMatches).forEach(([itemId, matchValue]) => {
      if (Array.isArray(matchValue)) {
        // Convert all IDs to strings for consistent comparison
        normalizedUserMatches[itemId] = matchValue.map(id => String(id));
      } else {
        // Single value case - convert to array of strings
        normalizedUserMatches[itemId] = [String(matchValue)];
      }
    });
    
    // If we're using includeItems directly from the question (more reliable)
    if (question.includeItems && question.includeItems.length > 0) {
      let allCorrect = true;
      
      for (const pair of question.includeItems) {
        // Convert pair matchIds to strings for consistent comparison
        const correctMatchIds = pair.matchIds.map(id => String(id)).sort();
        const userMatchIds = (normalizedUserMatches[pair.itemId] || []).slice().sort();
        
        // Check if arrays are equal
        if (correctMatchIds.length !== userMatchIds.length ||
            !correctMatchIds.every((id, i) => id === userMatchIds[i])) {
          allCorrect = false;
          break;
        }
      }
      
      // Calculate mastery gain
      const masteryGain = allCorrect ? calculateMasteryGain(question) : 0;
      
      // Get appropriate feedback
      const feedback = allCorrect ? question.feedback.correct : question.feedback.incorrect;
      
      return {
        correct: allCorrect,
        masteryGain,
        feedback
      };
    } else {
      // Load the matching bank if needed (fallback to the original approach)
      const banks = await loadBanks(question.tags.domain);
      const matchingBank = banks.matchingBanks.find(
        (bank: any) => bank.bankId === question.bankRef
      );
      
      if (!matchingBank) {
        throw new Error(`Matching bank ${question.bankRef} not found`);
      }
      
      // Check each user match against the correct relationships
      let allCorrect = true;
      
      for (const itemId in normalizedUserMatches) {
        // Get the correct match IDs for this item (converted to strings)
        const correctMatchIds = (matchingBank.relationships[itemId] || []).map(id => String(id)).sort();
        const userMatchIds = normalizedUserMatches[itemId].sort();
        
        // Check if arrays are equal
        if (correctMatchIds.length !== userMatchIds.length ||
            !correctMatchIds.every((id, i) => id === userMatchIds[i])) {
          allCorrect = false;
          break;
        }
      }
      
      // Calculate mastery gain
      const masteryGain = allCorrect ? calculateMasteryGain(question) : 0;
      
      // Get appropriate feedback
      const feedback = allCorrect ? question.feedback.correct : question.feedback.incorrect;
      
      return {
        correct: allCorrect,
        masteryGain,
        feedback
      };
    }
  } catch (error) {
    console.error("Error evaluating matching question:", error);
    return {
      correct: false,
      masteryGain: 0,
      feedback: "An error occurred while evaluating your answer."
    };
  }
}

/**
 * Evaluate a procedural question
 */
export async function evaluateProcedural(
  question: ProceduralQuestion,
  userOrderedSteps: number[]
): Promise<QuestionResult> {
  try {
    // Load the procedural bank
    const banks = await loadBanks(question.tags.domain);
    const proceduralBank = banks.proceduralBanks.find(
      (bank: any) => bank.bankId === question.bankRef
    );
    
    if (!proceduralBank) {
      throw new Error(`Procedural bank ${question.bankRef} not found`);
    }
    
    // The correct order is the same as the includeSteps array
    const correctOrder = [...question.includeSteps];
    
    // Check if user order matches correct order
    const correct = correctOrder.length === userOrderedSteps.length &&
                   correctOrder.every((step, i) => step === userOrderedSteps[i]);
    
    // Calculate mastery gain
    const masteryGain = correct ? calculateMasteryGain(question) : 0;
    
    // Get appropriate feedback
    const feedback = correct ? question.feedback.correct : question.feedback.incorrect;
    
    return {
      correct,
      masteryGain,
      feedback
    };
  } catch (error) {
    console.error("Error evaluating procedural question:", error);
    return {
      correct: false,
      masteryGain: 0,
      feedback: "An error occurred while evaluating your answer."
    };
  }
}

/**
 * Evaluate a calculation question
 */
export function evaluateCalculation(
  question: CalculationQuestion,
  userAnswer: number,
  variables: Record<string, number>
): QuestionResult {
  try {
    // Create a function to evaluate the answer formula with the given variables
    const formula = question.answer.formula;
    const precision = question.answer.precision;
    
    // Replace variable placeholders in the formula
    let processedFormula = formula;
    for (const [name, value] of Object.entries(variables)) {
      const placeholder = new RegExp(`\\$\\{${name}\\}|\\{${name}\\}`, 'g');
      processedFormula = processedFormula.replace(placeholder, value.toString());
    }
    
    // Evaluate the formula using a safer approach than eval
    // Create a safe evaluation context with basic Math functions
    const evalContext: any = {
      ...Math,  // Include all Math functions (sin, cos, etc.)
    };
    
    // Add variables to the context
    Object.entries(variables).forEach(([name, value]) => {
      evalContext[name] = value;
    });
    
    // Create a function with our context that evaluates the formula
    const formula2Evaluate = processedFormula.replace(/\{([^}]+)\}/g, (_, name) => name);
    const evaluator = new Function(...Object.keys(evalContext), `return ${formula2Evaluate};`);
    
    // Calculate the result
    const correctAnswer = evaluator(...Object.values(evalContext));
    
    // Check if user's answer is within acceptable precision
    const tolerance = Math.pow(10, -precision);
    const correct = Math.abs(userAnswer - correctAnswer) <= tolerance;
    
    // Calculate mastery gain
    const masteryGain = correct ? calculateMasteryGain(question) : 0;
    
    // Get appropriate feedback
    const feedback = correct ? question.feedback.correct : question.feedback.incorrect;
    
    return {
      correct,
      masteryGain,
      feedback
    };
  } catch (error) {
    console.error("Error evaluating calculation question:", error);
    return {
      correct: false,
      masteryGain: 0,
      feedback: "An error occurred while evaluating your answer."
    };
  }
}

/**
 * Calculate the mastery gain for a correctly answered question
 */
function calculateMasteryGain(question: Question): number {
  // Get the base mastery gain range for this question type
  const { min, max } = MASTERY_GAIN_RANGES[question.type as QuestionType] || 
                      MASTERY_GAIN_RANGES[QuestionType.MULTIPLE_CHOICE];
  
  // Get the difficulty multiplier
  const difficultyMultiplier = DIFFICULTY_MULTIPLIERS[question.tags.difficulty] || 
                              DIFFICULTY_MULTIPLIERS[1];
  
  // Calculate the base mastery gain
  const baseMasteryGain = min + Math.random() * (max - min);
  
  // Apply the difficulty multiplier
  const masteryGain = baseMasteryGain * difficultyMultiplier;
  
  // Round to one decimal place
  return Math.round(masteryGain * 10) / 10;
}

/**
 * Evaluate any question type
 */
export async function evaluateQuestion(
  question: Question,
  answer: any
): Promise<QuestionResult> {
  try {
    switch (question.type) {
      case QuestionType.MULTIPLE_CHOICE:
        return evaluateMultipleChoice(
          question as MultipleChoiceQuestion,
          answer as number
        );
      
      case QuestionType.MATCHING:
        return await evaluateMatching(
          question as MatchingQuestion,
          answer as Record<string, number[] | string[] | number | string>
        );
      
      case QuestionType.PROCEDURAL:
        return await evaluateProcedural(
          question as ProceduralQuestion,
          answer as number[]
        );
      
      case QuestionType.CALCULATION:
        return evaluateCalculation(
          question as CalculationQuestion,
          answer.userAnswer,
          answer.variables
        );
      
      default:
        throw new Error(`Unsupported question type: ${question.type}`);
    }
  } catch (error) {
    console.error("Error evaluating question:", error);
    return {
      correct: false,
      masteryGain: 0,
      feedback: "An error occurred while evaluating your answer."
    };
  }
}

export function evaluateMultipleChoiceQuestion(
  question: MultipleChoiceQuestion,
  selectedOptionIndex: number
) {
  const base = evaluateMultipleChoice(question, selectedOptionIndex);
  return {
    ...base,
    isCorrect: base.correct,
  };
}

// -----------------------------------------------------------------------------
// Legacy-compat wrapper for matching questions that also returns per-item stats
// -----------------------------------------------------------------------------
export async function evaluateMatchingQuestion(
  question: MatchingQuestion,
  userMatches: Record<string, number[] | number>
) {
  // Normalise user answers to arrays for easier comparison
  const normalisedUserMatches: Record<string, number[]> = {};
  Object.entries(userMatches).forEach(([itemId, val]) => {
    normalisedUserMatches[itemId] = Array.isArray(val) ? val : [val as number];
  });

  // Compute correct/total counters using the data directly on the question
  const totalMatches = question.includeItems.length;
  let correctMatches = 0;
  question.includeItems.forEach((pair) => {
    const userIds = (normalisedUserMatches[pair.itemId] || []).slice().sort();
    const correctIds = [...pair.matchIds].sort();
    if (
      userIds.length === correctIds.length &&
      userIds.every((id, idx) => id === correctIds[idx])
    ) {
      correctMatches += 1;
    }
  });

  // Delegate to the newer evaluator for feedback & mastery calculation
  const base = await evaluateMatching(question, normalisedUserMatches);

  return {
    ...base,
    isCorrect: base.correct,
    correctMatches,
    totalMatches,
  };
}

// -----------------------------------------------------------------------------
export async function evaluateProceduralQuestion(
  question: ProceduralQuestion,
  userOrderedSteps: number[]
) {
  const base = await evaluateProcedural(question, userOrderedSteps);
  return {
    ...base,
    isCorrect: base.correct,
  };
}

// -----------------------------------------------------------------------------
export function evaluateCalculationQuestion(
  question: CalculationQuestion,
  userAnswer: number,
  variables: Record<string, number> = {}
) {
  const base = evaluateCalculation(
    question,
    userAnswer,
    Object.keys(variables).length ? variables : (question as any).generatedValues || {}
  );
  return {
    ...base,
    isCorrect: base.correct,
  };
} 