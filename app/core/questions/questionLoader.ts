import { KnowledgeDomain } from "../../types";
import {
  CalculationQuestion,
  MatchingBank,
  MatchingQuestion,
  MultipleChoiceQuestion,
  ProceduralBank,
  ProceduralQuestion,
  Question,
  QuestionCollection,
  QuestionType,
  BoastQuestion
} from "../../types/questions";
import fs from "fs/promises";
import path from "path";

// Mapping from KnowledgeDomain to directory names in the public/data/questions folder
const DOMAIN_DIR_NAMES: Record<KnowledgeDomain, string> = {
  [KnowledgeDomain.DOSIMETRY]: "dosimetry",
  [KnowledgeDomain.LINAC_ANATOMY]: "linac-anatomy",
  [KnowledgeDomain.RADIATION_THERAPY]: "radiation-therapy",
  [KnowledgeDomain.TREATMENT_PLANNING]: "treatment-planning",
};

const DIFFICULTY_FILES = {
  beginner: "beginner.json",
  intermediate: "intermediate.json",
  advanced: "advanced.json",
};

const BANKS_FILE = "banks.json";

// Cache for loaded questions
let questionCache: Record<string, QuestionCollection> = {};
let bankCache: Record<string, any> = {}; // Will store both MatchingBank and ProceduralBank

// Helper to read JSON from the public folder (server-side only)
async function readJsonFromPublic(relativePath: string) {
  const filePath = path.join(process.cwd(), "public", relativePath);
  const fileContent = await fs.readFile(filePath, "utf8");
  return JSON.parse(fileContent);
}

/**
 * Load questions for a specific domain and difficulty
 */
export async function loadQuestions(
  domain: KnowledgeDomain,
  difficulty: "beginner" | "intermediate" | "advanced"
): Promise<QuestionCollection> {
  const cacheKey = `${domain}-${difficulty}`;
  
  // Return cached data if available
  if (questionCache[cacheKey]) {
    return questionCache[cacheKey];
  }
  
  try {
    const dirName = DOMAIN_DIR_NAMES[domain];
    const relativePath = path.join("data", "questions", dirName, DIFFICULTY_FILES[difficulty]);
    const questionCollection = await readJsonFromPublic(relativePath) as QuestionCollection;
    
    // Validate the collection
    validateQuestionCollection(questionCollection);
    
    // Cache the data
    questionCache[cacheKey] = questionCollection;
    
    return questionCollection;
  } catch (error) {
    console.error(`Error loading questions for ${domain}/${difficulty}:`, error);
    throw new Error(`Failed to load questions for ${domain}/${difficulty}`);
  }
}

/**
 * Load bank data for a specific domain
 */
export async function loadBanks(domain: KnowledgeDomain): Promise<any> {
  // Return cached data if available
  if (bankCache[domain]) {
    return bankCache[domain];
  }
  
  try {
    const dirName = DOMAIN_DIR_NAMES[domain];
    const relativePath = path.join("data", "questions", dirName, BANKS_FILE);
    const banks = await readJsonFromPublic(relativePath);
    
    // Validate banks
    validateBanks(banks);
    
    // Cache the data
    bankCache[domain] = banks;
    
    return banks;
  } catch (error) {
    console.error(`Error loading banks for ${domain}:`, error);
    throw new Error(`Failed to load banks for ${domain}`);
  }
}

/**
 * Validate a question collection
 */
function validateQuestionCollection(collection: QuestionCollection): void {
  if (!collection.metadata) {
    throw new Error("Question collection missing metadata");
  }
  
  if (!Array.isArray(collection.questions)) {
    throw new Error("Question collection must have a questions array");
  }
  
  // Check each question
  collection.questions.forEach(validateQuestion);
}

/**
 * Validate an individual question
 */
function validateQuestion(question: Question): void {
  if (!question.id) {
    throw new Error("Question missing ID");
  }
  
  if (!question.type) {
    throw new Error(`Question ${question.id} missing type`);
  }
  
  if (!question.tags) {
    throw new Error(`Question ${question.id} missing tags`);
  }
  
  if (!question.feedback || !question.feedback.correct || !question.feedback.incorrect) {
    throw new Error(`Question ${question.id} missing feedback`);
  }
  
  // Type-specific validation
  switch (question.type) {
    case QuestionType.MULTIPLE_CHOICE:
      validateMultipleChoiceQuestion(question as MultipleChoiceQuestion);
      break;
    case QuestionType.MATCHING:
      validateMatchingQuestion(question as MatchingQuestion);
      break;
    case QuestionType.PROCEDURAL:
      validateProceduralQuestion(question as ProceduralQuestion);
      break;
    case QuestionType.CALCULATION:
      validateCalculationQuestion(question as CalculationQuestion);
      break;
    case QuestionType.BOAST:
      validateBoastQuestion(question as BoastQuestion);
      break;
    default:
      throw new Error(`Question ${question.id} has invalid type: ${question.type}`);
  }
}

/**
 * Validate a multiple choice question
 */
function validateMultipleChoiceQuestion(question: MultipleChoiceQuestion): void {
  if (!question.question) {
    throw new Error(`Multiple choice question ${question.id} missing question text`);
  }
  
  if (!Array.isArray(question.options) || question.options.length < 2) {
    throw new Error(`Multiple choice question ${question.id} must have at least 2 options`);
  }
  
  // Check that at least one option is correct
  const hasCorrectOption = question.options.some(option => option.isCorrect);
  if (!hasCorrectOption) {
    throw new Error(`Multiple choice question ${question.id} must have at least one correct option`);
  }
  
  // Validate follow-up if present
  if (question.followUp) {
    if (!question.followUp.question) {
      throw new Error(`Multiple choice question ${question.id} follow-up missing question text`);
    }
    
    if (!Array.isArray(question.followUp.options) || question.followUp.options.length < 2) {
      throw new Error(`Multiple choice question ${question.id} follow-up must have at least 2 options`);
    }
    
    const hasFollowUpCorrectOption = question.followUp.options.some(option => option.isCorrect);
    if (!hasFollowUpCorrectOption) {
      throw new Error(`Multiple choice question ${question.id} follow-up must have at least one correct option`);
    }
  }
}

/**
 * Validate a matching question
 */
function validateMatchingQuestion(question: MatchingQuestion): void {
  if (!question.bankRef) {
    throw new Error(`Matching question ${question.id} missing bankRef`);
  }
  
  if (!Array.isArray(question.includeItems) || question.includeItems.length < 2) {
    throw new Error(`Matching question ${question.id} must include at least 2 items`);
  }
}

/**
 * Validate a procedural question
 */
function validateProceduralQuestion(question: ProceduralQuestion): void {
  if (!question.bankRef) {
    throw new Error(`Procedural question ${question.id} missing bankRef`);
  }
  
  if (!Array.isArray(question.includeSteps) || question.includeSteps.length < 2) {
    throw new Error(`Procedural question ${question.id} must include at least 2 steps`);
  }
}

/**
 * Validate a calculation question
 */
function validateCalculationQuestion(question: CalculationQuestion): void {
  if (!question.question) {
    throw new Error(`Calculation question ${question.id} missing question text`);
  }
  
  if (!Array.isArray(question.variables)) {
    throw new Error(`Calculation question ${question.id} must have variables array`);
  }
  
  if (!Array.isArray(question.solution) || question.solution.length === 0) {
    throw new Error(`Calculation question ${question.id} must have solution steps`);
  }
  
  if (!question.answer || !question.answer.formula) {
    throw new Error(`Calculation question ${question.id} missing answer formula`);
  }
}

/**
 * Validate a boast question (shares structure with multiple choice)
 */
function validateBoastQuestion(question: BoastQuestion): void {
  // Reuse multiple choice validation logic since structure is identical
  validateMultipleChoiceQuestion(question as unknown as MultipleChoiceQuestion);
}

/**
 * Validate banks data
 */
function validateBanks(banks: any): void {
  // Check matching banks
  if (banks.matchingBanks) {
    banks.matchingBanks.forEach(validateMatchingBank);
  }
  
  // Check procedural banks
  if (banks.proceduralBanks) {
    banks.proceduralBanks.forEach(validateProceduralBank);
  }
}

/**
 * Validate a matching bank
 */
function validateMatchingBank(bank: MatchingBank): void {
  if (!bank.bankId) {
    throw new Error("Matching bank missing bankId");
  }
  
  if (!Array.isArray(bank.items) || bank.items.length === 0) {
    throw new Error(`Matching bank ${bank.bankId} must have items array`);
  }
  
  if (!Array.isArray(bank.matches) || bank.matches.length === 0) {
    throw new Error(`Matching bank ${bank.bankId} must have matches array`);
  }
  
  if (!bank.relationships) {
    throw new Error(`Matching bank ${bank.bankId} missing relationships`);
  }
}

/**
 * Validate a procedural bank
 */
function validateProceduralBank(bank: ProceduralBank): void {
  if (!bank.bankId) {
    throw new Error("Procedural bank missing bankId");
  }
  
  if (!bank.title) {
    throw new Error(`Procedural bank ${bank.bankId} missing title`);
  }
  
  if (!Array.isArray(bank.steps) || bank.steps.length < 2) {
    throw new Error(`Procedural bank ${bank.bankId} must have at least 2 steps`);
  }
}

/**
 * Get all questions for a specific domain
 */
export async function getAllDomainQuestions(domain: KnowledgeDomain): Promise<Question[]> {
  try {
    const beginnerCollection = await loadQuestions(domain, "beginner");
    const intermediateCollection = await loadQuestions(domain, "intermediate");
    const advancedCollection = await loadQuestions(domain, "advanced");
    
    return [
      ...beginnerCollection.questions,
      ...intermediateCollection.questions,
      ...advancedCollection.questions,
    ];
  } catch (error) {
    console.error(`Error loading all questions for ${domain}:`, error);
    return [];
  }
}

/**
 * Get questions for a specific star/knowledge node
 */
export async function getQuestionsForStar(starId: string): Promise<Question[]> {
  const allQuestions: Question[] = [];
  
  // Search through all domains and difficulties
  for (const domain of Object.values(KnowledgeDomain)) {
    for (const difficulty of ["beginner", "intermediate", "advanced"] as const) {
      try {
        const collection = await loadQuestions(domain, difficulty);
        
        // Check if this star is included in the collection
        if (collection.metadata.stars.includes(starId)) {
          // Filter questions related to this star
          const starQuestions = collection.questions.filter(
            q => q.tags.knowledgeNode === starId
          );
          
          allQuestions.push(...starQuestions);
        }
      } catch (error) {
        // Skip if this combination doesn't exist or has an error
        continue;
      }
    }
  }
  
  return allQuestions;
}

/**
 * Process a procedural question with its bank data
 * This completes the procedural generation by populating the question with actual steps from the bank
 */
export async function processProceduralQuestion(
  question: ProceduralQuestion,
  domain: KnowledgeDomain
): Promise<ProceduralQuestion> {
  try {
    // Load banks for the domain
    const banks = await loadBanks(domain);
    if (!banks || !banks.proceduralBanks) {
      throw new Error(`No procedural banks found for domain ${domain}`);
    }
    
    // Find the referenced bank
    const bank = banks.proceduralBanks.find((b: ProceduralBank) => b.bankId === question.bankRef);
    if (!bank) {
      throw new Error(`Procedural bank ${question.bankRef} not found in domain ${domain}`);
    }
    
    // Create a processed copy of the question with steps
    const processedQuestion = {
      ...question,
      // Include steps from the bank based on the includeSteps ids
      steps: question.includeSteps.map(stepId => {
        const step = bank.steps.find((s: any) => s.stepId === stepId);
        if (!step) {
          throw new Error(`Step ID ${stepId} not found in bank ${question.bankRef}`);
        }
        return {
          ...step,
          id: stepId  // Ensure the step has its ID for reference
        };
      })
    };
    
    return processedQuestion as ProceduralQuestion;
  } catch (error) {
    console.error(`Error processing procedural question ${question.id}:`, error);
    throw error;
  }
} 