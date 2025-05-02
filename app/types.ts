export enum GamePhase {
  TITLE = 'TITLE',
  PROLOGUE = 'PROLOGUE',
  DAY = 'DAY',
  NIGHT = 'NIGHT',
}

export enum Difficulty {
  BEGINNER = 'BEGINNER',    // "Fresh out of undergrad"
  STANDARD = 'STANDARD',    // "Finished doctorate"
  EXPERT = 'EXPERT'         // "Practiced in another country"
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
  relationships?: MentorRelationships;
}

export interface ActivityOption {
  id: string;
  title: string;
  description: string;
  location: LocationId;
  duration: number;
  mentor?: MentorId;
  mentors?: MentorId[];  // Support for multi-mentor activities
  domains: KnowledgeDomain[];
  difficulty: ActivityDifficulty;
  isNetworking?: boolean;  // Flag for social networking activities
  
  // Requirements for special events
  requirements?: {
    // Star pattern requirements
    stars?: {
      domain?: KnowledgeDomain;
      count?: number;
      connected?: boolean;
      minMastery?: number;
    };
    // Constellation pattern requirements
    pattern?: string;
  };
}

export enum GameEventType {
  // Phase transitions
  DAY_PHASE_STARTED = 'DAY_PHASE_STARTED',
  NIGHT_PHASE_STARTED = 'NIGHT_PHASE_STARTED',
  
  // Time events
  TIME_ADVANCED = 'TIME_ADVANCED',
  END_OF_DAY_REACHED = 'END_OF_DAY_REACHED',
  
  // Resource events
  MOMENTUM_GAINED = 'MOMENTUM_GAINED',
  MOMENTUM_RESET = 'MOMENTUM_RESET',
  INSIGHT_GAINED = 'INSIGHT_GAINED',
  INSIGHT_SPENT = 'INSIGHT_SPENT',
  INSIGHT_CONVERTED = 'INSIGHT_CONVERTED',
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
  CHALLENGE_STARTED = 'CHALLENGE_STARTED',
  CHALLENGE_COMPLETED = 'CHALLENGE_COMPLETED',
  
  // Season events
  SEASON_CHANGED = 'SEASON_CHANGED',
  
  // Relationship events
  RELATIONSHIP_IMPROVED = 'RELATIONSHIP_IMPROVED',
  RELATIONSHIP_LEVEL_UP = 'RELATIONSHIP_LEVEL_UP',
  
  // Special events
  SPECIAL_EVENT_TRIGGERED = 'SPECIAL_EVENT_TRIGGERED',
  CONTROL_MECHANIC_UNLOCKED = 'CONTROL_MECHANIC_UNLOCKED',
  EUREKA_MOMENT = 'EUREKA_MOMENT',
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

// Relationship tracking for mentors
export interface MentorRelationship {
  level: number;            // 0-5 scale (0=Unfamiliar, 5=Trusted Colleague)
  interactions: number;     // Number of interactions with this mentor
}

export interface MentorRelationships {
  [MentorId.GARCIA]: MentorRelationship;
  [MentorId.KAPOOR]: MentorRelationship;
  [MentorId.JESSE]: MentorRelationship;
  [MentorId.QUINN]: MentorRelationship;
}

// Season progression requirements by difficulty level
export interface SeasonRequirements {
  starCount: number;
  averageMastery: number;
  domainsRequired?: boolean;
  patternRequired?: string;
}

export const SEASON_REQUIREMENTS: Record<Difficulty, Record<Season, SeasonRequirements>> = {
  [Difficulty.BEGINNER]: {
    [Season.SPRING]: { starCount: 5, averageMastery: 40 },
    [Season.SUMMER]: { starCount: 10, averageMastery: 50, domainsRequired: true },
    [Season.FALL]: { starCount: 15, averageMastery: 60, patternRequired: 'triangle' },
    [Season.WINTER]: { starCount: 20, averageMastery: 70 },
  },
  [Difficulty.STANDARD]: {
    [Season.SPRING]: { starCount: 5, averageMastery: 50 },
    [Season.SUMMER]: { starCount: 10, averageMastery: 60, domainsRequired: true },
    [Season.FALL]: { starCount: 15, averageMastery: 70, patternRequired: 'triangle' },
    [Season.WINTER]: { starCount: 20, averageMastery: 80 },
  },
  [Difficulty.EXPERT]: {
    [Season.SPRING]: { starCount: 5, averageMastery: 60 },
    [Season.SUMMER]: { starCount: 10, averageMastery: 70, domainsRequired: true },
    [Season.FALL]: { starCount: 15, averageMastery: 80, patternRequired: 'triangle' },
    [Season.WINTER]: { starCount: 20, averageMastery: 90 },
  },
}; 