import { 
  CalculationQuestion, 
  CalculationVariable,
  MatchingBank,
  MatchingPair,
  MatchingQuestion,
  ProceduralQuestion,
  Question,
  SolutionStep
} from "../../types/questions";
import { KnowledgeDomain } from "../../types";
import { loadBanks } from "./questionLoader";

/**
 * Generate a calculation question with random values for variables
 * @param question The template calculation question
 * @returns A new question instance with generated values
 */
export function generateCalculationQuestion(question: CalculationQuestion): CalculationQuestion {
  // Create a copy of the question to avoid modifying the original
  const generatedQuestion: CalculationQuestion = { ...question };
  
  // Generate random values for each variable within its range
  const generatedVariables: { [key: string]: number } = {};
  question.variables.forEach(variable => {
    const min = variable.range[0];
    const max = variable.range[1];
    // Generate a random value within the range with 2 decimal places
    const value = parseFloat((min + Math.random() * (max - min)).toFixed(2));
    generatedVariables[variable.name] = value;
  });
  
  // Add the generated values to the question text
  let questionText = question.question;
  Object.entries(generatedVariables).forEach(([name, value]) => {
    // Replace variable placeholders with actual values
    const regex = new RegExp(`\\{${name}\\}`, 'g');
    const variableDef = question.variables.find(v => v.name === name);
    const unit = variableDef ? variableDef.unit : '';
    questionText = questionText.replace(regex, `${value}${unit ? ' ' + unit : ''}`);
  });
  
  // Update the solution steps with the variable values
  const processedSolution: SolutionStep[] = question.solution.map(step => {
    if (!step.isFormula) return step;
    
    let processedStep = step.step;
    Object.entries(generatedVariables).forEach(([name, value]) => {
      const regex = new RegExp(`\\{${name}\\}`, 'g');
      processedStep = processedStep.replace(regex, value.toString());
    });
    
    return {
      ...step,
      step: processedStep
    };
  });
  
  // Calculate the answer using the formula
  let answerFormula = question.answer.formula;
  Object.entries(generatedVariables).forEach(([name, value]) => {
    const regex = new RegExp(`\\{${name}\\}`, 'g');
    answerFormula = answerFormula.replace(regex, value.toString());
  });
  
  // Use Function constructor to safely evaluate the formula
  // This is a common approach to evaluate mathematical expressions from strings
  try {
    // Create a safe evaluation context with basic Math functions
    const evalContext: any = {
      ...Math,  // Include all Math functions (sin, cos, etc.)
    };
    
    // Add variables to the context
    Object.entries(generatedVariables).forEach(([name, value]) => {
      evalContext[name] = value;
    });
    
    // Create a function with our context that evaluates the formula
    const formula = answerFormula.replace(/\{([^}]+)\}/g, (_, name) => name);
    const evaluator = new Function(...Object.keys(evalContext), `return ${formula};`);
    
    // Calculate the result
    const result = evaluator(...Object.values(evalContext));
    
    // Round to the specified precision
    const precision = question.answer.precision;
    const roundedResult = parseFloat(result.toFixed(precision));
    
    // Update the question with generated values
    generatedQuestion.question = questionText;
    generatedQuestion.solution = processedSolution;
    generatedQuestion.generatedValues = generatedVariables;
    generatedQuestion.generatedAnswer = roundedResult;
    
    return generatedQuestion;
  } catch (error) {
    console.error(`Error evaluating formula for question ${question.id}:`, error);
    throw new Error(`Failed to generate calculation question: ${error}`);
  }
}

/**
 * Generate a matching question with a subset of items from the bank
 * @param question The template matching question
 * @param domain The knowledge domain for loading banks
 * @returns A promise that resolves to a generated matching question
 */
export async function generateMatchingQuestion(
  question: MatchingQuestion,
  domain: KnowledgeDomain
): Promise<MatchingQuestion> {
  try {
    // Load banks for the domain
    const banks = await loadBanks(domain);
    if (!banks || !banks.matchingBanks) {
      throw new Error(`No matching banks found for domain ${domain}`);
    }
    
    // Find the referenced bank
    const bank = banks.matchingBanks.find((b: MatchingBank) => b.id === question.bankRef);
    if (!bank) {
      throw new Error(`Matching bank ${question.bankRef} not found in domain ${domain}`);
    }
    
    // Create a copy of the question
    const generatedQuestion: MatchingQuestion = { ...question };
    
    // Extract the full item and match data from the bank
    const items = bank.items.filter(item => 
      question.includeItems.some(includeItem => includeItem.itemId === item.id)
    );
    
    // Create a map of item IDs to their matching options
    const itemMatchMap: { [itemId: string]: any[] } = {};
    question.includeItems.forEach(includeItem => {
      const itemId = includeItem.itemId;
      const matchIds = includeItem.matchIds;
      
      // Find all matches for this item
      const matches = matchIds.map(matchId => {
        const match = bank.matches.find((m: any) => m.id === matchId);
        if (!match) {
          throw new Error(`Match ID ${matchId} not found in bank ${question.bankRef}`);
        }
        return match;
      });
      
      itemMatchMap[itemId] = matches;
    });
    
    // Add generated data to the question
    generatedQuestion.itemsData = items;
    generatedQuestion.matchesMap = itemMatchMap;
    
    return generatedQuestion;
  } catch (error) {
    console.error(`Error generating matching question ${question.id}:`, error);
    throw error;
  }
}

/**
 * Adjust difficulty of a question dynamically based on mastery level
 * @param question The question to adjust
 * @param masteryPercentage The player's mastery percentage (0-100)
 * @returns An adjusted question with appropriate difficulty
 */
export function adjustQuestionDifficulty(
  question: Question,
  masteryPercentage: number
): Question {
  // Determine appropriate difficulty level based on mastery
  let targetDifficulty: "beginner" | "intermediate" | "advanced";
  
  if (masteryPercentage < 30) {
    targetDifficulty = "beginner";
  } else if (masteryPercentage < 70) {
    targetDifficulty = "intermediate";
  } else {
    targetDifficulty = "advanced";
  }
  
  // Handle different question types
  switch (question.type) {
    case "procedural":
      // For procedural questions, adjust the number of steps
      return adjustProceduralDifficulty(question as ProceduralQuestion, targetDifficulty);
      
    case "matching":
      // For matching questions, adjust the number of items
      return adjustMatchingDifficulty(question as MatchingQuestion, targetDifficulty);
      
    case "calculation":
      // For calculation questions, adjust variable ranges or complexity
      return adjustCalculationDifficulty(question as CalculationQuestion, targetDifficulty);
      
    default:
      // For other question types, return as is
      return question;
  }
}

/**
 * Adjust the difficulty of a procedural question
 */
function adjustProceduralDifficulty(
  question: ProceduralQuestion,
  targetDifficulty: "beginner" | "intermediate" | "advanced"
): ProceduralQuestion {
  // Create a copy of the question to avoid modifying the original
  const variant: ProceduralQuestion = { ...question };
  
  // Adjust difficulty based on requested level
  // For beginner: use fewer steps, for advanced: use more steps
  let includeSteps = [...variant.includeSteps];
  
  // Determine how many steps to include based on difficulty
  let stepCount: number;
  switch (targetDifficulty) {
    case "beginner":
      // For beginners, use 60-80% of steps
      stepCount = Math.max(2, Math.floor(includeSteps.length * (0.6 + Math.random() * 0.2)));
      break;
    case "intermediate":
      // For intermediate, use 80-90% of steps
      stepCount = Math.max(3, Math.floor(includeSteps.length * (0.8 + Math.random() * 0.1)));
      break;
    case "advanced":
      // For advanced, use all steps
      stepCount = includeSteps.length;
      break;
  }
  
  // If we need to reduce steps, remove some randomly
  if (stepCount < includeSteps.length) {
    // Shuffle the steps
    includeSteps.sort(() => Math.random() - 0.5);
    // Take the first stepCount steps
    includeSteps = includeSteps.slice(0, stepCount);
    // Sort them back in the original order
    includeSteps.sort((a, b) => a - b);
  }
  
  // Update the variant with the new step selection
  variant.includeSteps = includeSteps;
  variant.difficulty = targetDifficulty;
  
  return variant;
}

/**
 * Adjust the difficulty of a matching question
 */
function adjustMatchingDifficulty(
  question: MatchingQuestion,
  targetDifficulty: "beginner" | "intermediate" | "advanced"
): MatchingQuestion {
  // Create a copy of the question
  const adjustedQuestion: MatchingQuestion = { ...question };
  
  // Adjust the difficulty based on the target level
  adjustedQuestion.difficulty = targetDifficulty;
  
  // For advanced difficulty, include more items/matches
  // For beginner difficulty, include fewer items/matches
  return adjustedQuestion;
}

/**
 * Adjust the difficulty of a calculation question
 */
function adjustCalculationDifficulty(
  question: CalculationQuestion,
  targetDifficulty: "beginner" | "intermediate" | "advanced"
): CalculationQuestion {
  // Create a copy of the question
  const adjustedQuestion: CalculationQuestion = { ...question };
  
  // For future implementation: adjust variable ranges based on difficulty
  // This could make the calculations harder or easier
  
  return adjustedQuestion;
} 