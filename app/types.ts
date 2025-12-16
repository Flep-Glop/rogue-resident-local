export enum GamePhase {
  TITLE = 'TITLE',
  NIGHT = 'NIGHT',
}

export enum Difficulty {
  BEGINNER = 'BEGINNER',    // "Fresh out of undergrad"
  STANDARD = 'STANDARD',    // "Finished doctorate"
  EXPERT = 'EXPERT'         // "Practiced in another country"
}

export enum KnowledgeDomain {
  TREATMENT_PLANNING = 'TREATMENT_PLANNING',
  RADIATION_THERAPY = 'RADIATION_THERAPY',
  LINAC_ANATOMY = 'LINAC_ANATOMY',
  DOSIMETRY = 'DOSIMETRY',
}

export enum GameEventType {
  // Phase transitions
  NIGHT_PHASE_STARTED = 'NIGHT_PHASE_STARTED',
  
  // Resource events
  STAR_POINTS_GAINED = 'STAR_POINTS_GAINED',
  STAR_POINTS_SPENT = 'STAR_POINTS_SPENT',
  
  // Knowledge events
  CONCEPT_DISCOVERED = 'CONCEPT_DISCOVERED',
  STAR_UNLOCKED = 'STAR_UNLOCKED',
  STAR_ACTIVATED = 'STAR_ACTIVATED',
  STAR_DEACTIVATED = 'STAR_DEACTIVATED',
  MASTERY_INCREASED = 'MASTERY_INCREASED',
  CONNECTION_FORMED = 'CONNECTION_FORMED',
  PATTERN_FORMED = 'PATTERN_FORMED',
  
  // Activity events
  ACTIVITY_STARTED = 'ACTIVITY_STARTED',
  ACTIVITY_COMPLETED = 'ACTIVITY_COMPLETED',
  
  // Ability card events
  ABILITY_CARD_UNLOCKED = 'ABILITY_CARD_UNLOCKED',
  ABILITY_CARD_EQUIPPED = 'ABILITY_CARD_EQUIPPED',
  ABILITY_CARD_UNEQUIPPED = 'ABILITY_CARD_UNEQUIPPED',
}

export interface KnowledgeConnection {
  id: string;
  sourceStarId: string;
  targetStarId: string;
  strength: number; // 0-100%
  discovered: boolean;
}

export interface KnowledgeStar {
  id: string;
  name: string;
  description: string;
  domain: KnowledgeDomain;
  position: { x: number; y: number };
  mastery: number; // 0-100%
  connections: string[]; // IDs of connected stars
  prerequisites?: string[]; // Star IDs required before this can be discovered
  discovered: boolean;
  unlocked: boolean;
  active: boolean;
  spCost: number; // Star Points cost to unlock
}
