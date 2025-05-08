import { KnowledgeDomain, MentorId } from "../types";

/**
 * Base question tags structure shared by all question types
 */
export interface QuestionTags {
  domain: KnowledgeDomain;
  subtopic: string;
  difficulty: number;  // 1 = beginner, 2 = intermediate, 3 = advanced
  mentor: MentorId;
  knowledgeNode: string;  // ID of the related knowledge star/node
}

/**
 * Base question interface that all question types inherit from
 */
export interface Question {
  id: string;
  type: QuestionType;
  tags: QuestionTags;
  feedback: {
    correct: string;
    incorrect: string;
  };
}

/**
 * Supported question types in the system
 */
export enum QuestionType {
  MULTIPLE_CHOICE = "multipleChoice",
  MATCHING = "matching",
  PROCEDURAL = "procedural",
  CALCULATION = "calculation",
  BOAST = "boast"
}

/**
 * Multiple choice question option
 */
export interface MultipleChoiceOption {
  text: string;
  isCorrect: boolean;
}

/**
 * Multiple choice question format
 */
export interface MultipleChoiceQuestion extends Question {
  type: QuestionType.MULTIPLE_CHOICE;
  question: string;
  options: MultipleChoiceOption[];
  followUp?: {
    question: string;
    options: MultipleChoiceOption[];
  };
}

/**
 * Matching item in a bank
 */
export interface MatchingItem {
  itemId: string;
  itemText: string;
}

/**
 * Matching option in a bank
 */
export interface MatchingOption {
  matchId: number;
  matchText: string;
}

/**
 * Item-match relationship in a question
 */
export interface MatchingPair {
  itemId: string;
  matchIds: number[];
}

/**
 * Matching question format
 */
export interface MatchingQuestion extends Question {
  type: QuestionType.MATCHING;
  bankRef: string;  // Reference to a matching bank
  includeItems: MatchingPair[];  // Which items to include from the bank
  difficulty: "beginner" | "intermediate" | "advanced";
}

/**
 * Procedural step in a bank
 */
export interface ProceduralStep {
  stepId: number;
  stepText: string;
  explanation: string;
}

/**
 * Procedural question format
 */
export interface ProceduralQuestion extends Question {
  type: QuestionType.PROCEDURAL;
  bankRef: string;  // Reference to a procedural bank
  includeSteps: number[];  // Which steps to include from the bank
  difficulty: "beginner" | "intermediate" | "advanced";
}

/**
 * Solution step for calculation questions
 */
export interface SolutionStep {
  step: string;
  isFormula?: boolean;
}

/**
 * Variable definition for calculation questions
 */
export interface CalculationVariable {
  name: string;
  range: [number, number];  // [min, max]
  unit: string;
}

/**
 * Calculation question format
 */
export interface CalculationQuestion extends Question {
  type: QuestionType.CALCULATION;
  question: string;
  variables: CalculationVariable[];
  solution: SolutionStep[];
  answer: {
    formula: string;
    precision: number;
  };
}

/**
 * Matching bank for reusable matching content
 */
export interface MatchingBank {
  bankId: string;
  items: MatchingItem[];
  matches: MatchingOption[];
  relationships: {
    [itemId: string]: number[];  // itemId -> array of match IDs
  };
}

/**
 * Procedural bank for reusable step sequences
 */
export interface ProceduralBank {
  bankId: string;
  title: string;
  description: string;
  steps: ProceduralStep[];
}

/**
 * Question collection metadata
 */
export interface QuestionCollectionMetadata {
  domain: string;
  difficulty: string;
  questionCount: number;
  lastUpdated: string;
  contributors: string[];
  stars: string[];
}

/**
 * Question collection (JSON file structure)
 */
export interface QuestionCollection {
  metadata: QuestionCollectionMetadata;
  contentMap: string[];
  questions: (MultipleChoiceQuestion | MatchingQuestion | ProceduralQuestion | CalculationQuestion | BoastQuestion)[];
}

/**
 * Boast question format (similar to MultipleChoice but with a different type)
 */
export interface BoastQuestion extends Question {
  type: QuestionType.BOAST;
  question: string;
  options: MultipleChoiceOption[];
  followUp?: {
    question: string;
    options: MultipleChoiceOption[];
  };
} 