import { MentorId } from './mentorVoice';

// Core domain types
export type Domain = 'TREATMENT_PLANNING' | 'RADIATION_THERAPY' | 'LINAC_ANATOMY' | 'DOSIMETRY';
export type Difficulty = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
export type QuestionType = 'multipleChoice' | 'matching' | 'procedural' | 'calculation' | 'boast';

// Metadata for questions
export interface QuestionMetadata {
  domain: Domain;
  difficulty: Difficulty;
  tags: string[];
  knowledgeStars?: string[]; // IDs of related knowledge stars
  connections?: string[];   // IDs of connections this question reinforces
}

// Question templates interface - contains text with placeholder markers
export interface QuestionTemplate {
  textTemplate: string;       // Contains placeholders like {mentorIntro}, {mentorInquiry}, etc.
  correctFeedbackTemplate: string;  // Feedback template for correct answers
  incorrectFeedbackTemplate: string; // Feedback template for incorrect answers
}

// Base Question interface - common to all question types
export interface Question {
  id: string;
  type: QuestionType;
  metadata: QuestionMetadata;
  
  // Either fixed mentor or flexible
  mentor?: MentorId;          // Optional specific mentor
  preferredMentors?: MentorId[]; // Preferred mentors in order
  
  // Choose one of these approaches:
  template?: QuestionTemplate; // For templated approach with mentor voice applied dynamically
  
  // Or traditional fixed text:
  text?: string;              // Fixed question text if not using templates
  correctFeedback?: string;   // Fixed feedback text if not using templates
  incorrectFeedback?: string; // Fixed feedback text if not using templates
}

// Multiple Choice Question
export interface MultipleChoiceQuestion extends Question {
  type: 'multipleChoice';
  options: string[];
  correctOptionIndices: number[]; // Can be multiple for "select all that apply"
}

// Matching Question
export interface MatchingQuestion extends Question {
  type: 'matching';
  items: string[];          // Left-side items to match
  matches: string[];        // Right-side items to match to
  correctMatchIndices: number[]; // Array of indices in matches that correspond to items
  bankId?: string;          // Optional reference to a matching bank
}

// Procedural Question (ordering steps)
export interface ProceduralQuestion extends Question {
  type: 'procedural';
  steps: string[];          // Steps in correct order
  stepExplanations?: string[]; // Optional explanations for each step
  bankId?: string;          // Optional reference to a procedural bank
}

// Calculation Question
export interface CalculationQuestion extends Question {
  type: 'calculation';
  variableRanges?: Record<string, {min: number, max: number, step?: number}>; // For procedurally generated values
  variables?: Record<string, number>; // Fixed variables if not procedurally generated
  formula?: string;         // Text representation of formula
  precision?: number;       // Required precision for the answer (decimal places)
  units?: string;           // Expected units for the answer
  
  // You could have multiple acceptable answer ranges
  acceptableAnswerRanges: Array<{
    min: number;
    max: number;
    feedback?: string; // Specific feedback for this range
  }>;
}

// Boast Question (advanced version of another question)
export interface BoastQuestion extends Question {
  type: 'boast';
  baseQuestionType: Exclude<QuestionType, 'boast'>; // The base question type this extends
  
  // Depending on the base type, include relevant fields from that type
  // For example, for a multiple choice boast:
  options?: string[];
  correctOptionIndices?: number[];
  
  // For matching boast:
  items?: string[];
  matches?: string[];
  correctMatchIndices?: number[];
  
  // For procedural boast:
  steps?: string[];
  
  // For calculation boast:
  variables?: Record<string, number>;
  acceptableAnswerRanges?: Array<{min: number, max: number}>;
  
  // Rewards and penalties
  rewardMultiplier: number; // Multiplier for rewards (e.g., 1.5x normal mastery gain)
  penaltyMultiplier: number; // Multiplier for penalties (e.g., 2x normal mastery loss)
} 