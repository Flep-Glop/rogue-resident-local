export enum GamePhase {
  TITLE = 'TITLE',
  PROLOGUE = 'PROLOGUE',
  DAY = 'DAY',
  NIGHT = 'NIGHT',
}

export enum Difficulty {
  BEGINNER = 'BEGINNER',
  STANDARD = 'STANDARD',
  EXPERT = 'EXPERT',
}

export enum ActivityDifficulty {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD',
  NONE = 'NONE', // For activities like self-study
}

export enum KnowledgeDomain {
  TREATMENT_PLANNING = 'TREATMENT_PLANNING',
  RADIATION_THERAPY = 'RADIATION_THERAPY',
  LINAC_ANATOMY = 'LINAC_ANATOMY',
  DOSIMETRY = 'DOSIMETRY',
}

export enum LocationId {
  TREATMENT_ROOM_1 = 'TREATMENT_ROOM_1',
  TREATMENT_ROOM_2 = 'TREATMENT_ROOM_2',
  TREATMENT_ROOM_3 = 'TREATMENT_ROOM_3',
  PLANNING_ROOM = 'PLANNING_ROOM',
  PHYSICS_LAB = 'PHYSICS_LAB',
  PHYSICS_OFFICE = 'PHYSICS_OFFICE',
  CONFERENCE_ROOM = 'CONFERENCE_ROOM',
  WARD = 'WARD',
  LIBRARY = 'LIBRARY',
  WORKSTATION = 'WORKSTATION',
  CAFETERIA = 'CAFETERIA',
  RESEARCH_LAB = 'RESEARCH_LAB',
  CLINIC = 'CLINIC',
}

export enum MentorId {
  GARCIA = 'GARCIA',
  KAPOOR = 'KAPOOR',
  JESSE = 'JESSE',
  QUINN = 'QUINN',
}

export interface TimeBlock {
  hour: number;
  minute: number;
}

export enum Season {
  SPRING = 'SPRING',
  SUMMER = 'SUMMER',
  FALL = 'FALL',
  WINTER = 'WINTER',
}

export interface Resources {
  momentum: number;
  insight: number;
  starPoints: number;
}

export interface ActivityOption {
  id: string;
  title: string;
  description: string;
  location: LocationId;
  mentor?: MentorId;
  durationMinutes?: number;
  duration: number; // In minutes
  domains: KnowledgeDomain[];
  difficulty: ActivityDifficulty;
  available?: boolean;
  requirements?: {
    starRequirements?: string[];
    relationshipRequirements?: Record<MentorId, number>;
  };
}

export enum GameEventType {
  // Phase transitions
  DAY_PHASE_STARTED = 'DAY_PHASE_STARTED',
  NIGHT_PHASE_STARTED = 'NIGHT_PHASE_STARTED',
  END_OF_DAY_REACHED = 'END_OF_DAY_REACHED',
  
  // Time events
  TIME_ADVANCED = 'TIME_ADVANCED',
  
  // Resource events
  MOMENTUM_GAINED = 'MOMENTUM_GAINED',
  MOMENTUM_RESET = 'MOMENTUM_RESET',
  MOMENTUM_CHANGED = 'MOMENTUM_CHANGED',
  INSIGHT_GAINED = 'INSIGHT_GAINED',
  INSIGHT_SPENT = 'INSIGHT_SPENT',
  INSIGHT_CONVERTED = 'INSIGHT_CONVERTED',
  SP_GAINED = 'SP_GAINED',
  SP_SPENT = 'SP_SPENT',
  
  // Knowledge events
  STAR_DISCOVERED = 'STAR_DISCOVERED',
  STAR_UNLOCKED = 'STAR_UNLOCKED',
  STAR_ACTIVATED = 'STAR_ACTIVATED',
  STAR_DEACTIVATED = 'STAR_DEACTIVATED',
  CONNECTION_FORMED = 'CONNECTION_FORMED',
  
  // Activity events
  ACTIVITY_STARTED = 'ACTIVITY_STARTED',
  ACTIVITY_COMPLETED = 'ACTIVITY_COMPLETED',
  CHALLENGE_SUCCEEDED = 'CHALLENGE_SUCCEEDED',
  CHALLENGE_FAILED = 'CHALLENGE_FAILED',
  ACTIVITY_FAILED = 'ACTIVITY_FAILED',
  TIME_BLOCK_STARTED = 'TIME_BLOCK_STARTED',
  ACTIVITY_SELECTED = 'ACTIVITY_SELECTED',
  DIALOGUE_STARTED = 'DIALOGUE_STARTED',
  DIALOGUE_ENDED = 'DIALOGUE_ENDED',
  CONCEPT_DISCOVERED = 'CONCEPT_DISCOVERED',
  MASTERY_INCREASED = 'MASTERY_INCREASED',
  MENTOR_RELATIONSHIP_CHANGED = 'MENTOR_RELATIONSHIP_CHANGED',
  KNOWLEDGE_DISCOVERED = 'KNOWLEDGE_DISCOVERED',
  TANGENT_USED = 'TANGENT_USED',
  BOAST_USED = 'BOAST_USED',
}

export interface KnowledgeConnection {
  id: string;
  sourceId: string;
  targetId: string;
  strength: number; // 0-100%
  discovered: boolean;
}

export const DomainColors = {
  [KnowledgeDomain.TREATMENT_PLANNING]: '#3b82f6', // Blue
  [KnowledgeDomain.RADIATION_THERAPY]: '#10b981', // Green
  [KnowledgeDomain.LINAC_ANATOMY]: '#f59e0b', // Amber
  [KnowledgeDomain.DOSIMETRY]: '#ec4899', // Pink
}; 

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

export interface DialogueOption {
  text: string;
  nextId?: string;
  effect?: () => void;
  isEndNode?: boolean;
  id?: string;
  nextNodeId?: string;
  requiredStarId?: string;
  insightChange?: number;
  momentumChange?: number;
  relationshipChange?: number;
  discoversConceptId?: string;
} 