// Mentor Voice System for Rogue Resident
// This provides type definitions for the mentor voice templating system

import { Domain, Difficulty } from './questions';

// Mentor IDs
export type MentorId = 'Kapoor' | 'Garcia' | 'Jesse' | 'Quinn';

// Context for mentor voice application
export interface MentorVoiceContext {
  domain: Domain;
  difficulty: Difficulty;
  tags: string[];
  isBoast?: boolean;
  questionType: 'multipleChoice' | 'matching' | 'procedural' | 'calculation';
}

// Templates for different speech parts
export interface MentorVoicePatterns {
  // Question presentation patterns
  intros: string[];            // Opening phrases
  inquiries: string[];         // How they ask questions
  challenges: string[];        // How they present challenges
  boastResponses: string[];    // How they respond to boasts
  
  // Feedback patterns
  correctFeedback: string[];   // How they give positive feedback
  incorrectFeedback: string[]; // How they give corrective feedback
  encouragement: string[];     // Encouraging phrases
  
  // Domain-specific patterns
  domainPhrases: {
    [key in Domain]?: string[];
  };
  
  // Difficulty-specific patterns
  difficultyPhrases: {
    [key in Difficulty]?: string[];
  };
  
  // Speech characteristics
  transitions: string[];       // Transitional phrases
  emphasis: string[];          // Emphasis phrases
  conclusions: string[];       // Concluding remarks
}

// Complete mentor voice profile
export interface MentorVoiceProfile {
  id: MentorId;
  name: string;
  patterns: MentorVoicePatterns;
  specialties: Domain[];       // Domains they specialize in
  personalityTraits: string[]; // Characteristic traits
} 