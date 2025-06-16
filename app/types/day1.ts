import { LocationId, MentorId } from '@/app/types';

export enum Day1SceneId {
  // Consolidated Prologue scene
  PROLOGUE_INTRO = 'PROLOGUE_INTRO',
  
  // Day 1 scenes
  ARRIVAL = 'ARRIVAL',
  BRIEF_TOUR = 'BRIEF_TOUR', 
  FIRST_PATIENT = 'FIRST_PATIENT',
  MEETING_JESSE = 'MEETING_JESSE',
  MEETING_KAPOOR = 'MEETING_KAPOOR',
  QUINN_INTRODUCTION = 'QUINN_INTRODUCTION',
  AFTERNOON_WITH_QUINN = 'AFTERNOON_WITH_QUINN',
  HILL_HOUSE_ARRIVAL = 'HILL_HOUSE_ARRIVAL',
  FIRST_NIGHT = 'FIRST_NIGHT'
}

export interface Day1Scene {
  id: Day1SceneId;
  title: string;
  location: string;
  timeAdvance: number;
  background: string;
  
  // Integration with existing systems
  dialogueId?: string;  // Reference to existing dialogue system
  activityConfig?: {
    questionCount: number;
    difficulty: 'easy' | 'medium' | 'hard';
    domains: string[];
  };
  
  // Visual effects
  introducesUI?: ('momentum' | 'insight' | 'journal')[];
  particleEffect?: 'momentum' | 'insight';
  
  // New prologue-specific features
  hasTypewriter?: boolean;  // Enable typewriter effect
  hasNameInput?: boolean;   // Enable name input modal
  hasDifficultySelection?: boolean; // Enable difficulty selection
  hasChoices?: boolean;     // Enable choice system
  
  // Scene flow
  nextScene?: Day1SceneId;
  requirements?: {
    playerNamed?: boolean;
    journalReceived?: boolean;
    difficultySelected?: boolean;
  };
  
  // Callbacks for scene lifecycle
  onEnter?: () => void;
  onExit?: () => void;
}

export interface Day1State {
  currentScene: Day1SceneId;
  completedScenes: Set<Day1SceneId>;
  playerName: string;
  journalReceived: boolean;
  hasSeenMomentumUI: boolean;
  hasSeenInsightUI: boolean;
  difficultySelected: boolean;
} 