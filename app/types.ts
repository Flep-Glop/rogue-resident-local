export enum GamePhase {
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
  durationMinutes: number;
  domains: KnowledgeDomain[];
  difficulty: ActivityDifficulty;
  available: boolean;
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