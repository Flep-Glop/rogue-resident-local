// Game Phases
export enum GamePhase {
  TITLE = 'title',
  PROLOGUE = 'prologue',
  DAY = 'day',
  NIGHT = 'night',
}

// Game difficulty settings
export enum Difficulty {
  BEGINNER = 'beginner',
  STANDARD = 'standard',
  EXPERT = 'expert',
}

// Game Seasons
export enum Season {
  SPRING = 'spring',
  SUMMER = 'summer',
  FALL = 'fall',
  WINTER = 'winter',
}

// Game Event Types
export enum GameEventType {
  // Time and phase events
  TIME_ADVANCED = 'time_advanced',
  TIME_BLOCK_STARTED = 'time_block_started',
  DAY_PHASE_STARTED = 'day_phase_started',
  NIGHT_PHASE_STARTED = 'night_phase_started',
  END_OF_DAY_REACHED = 'end_of_day_reached',
  DAY_SCHEDULE_UPDATED = 'day_schedule_updated',
  
  // Activity events
  ACTIVITY_OPTIONS_GENERATED = 'activity_options_generated',
  ACTIVITY_SELECTED = 'activity_selected',
  ACTIVITY_STARTED = 'activity_started',
  ACTIVITY_COMPLETED = 'activity_completed',
  ACTIVITY_FAILED = 'activity_failed',
  
  // Resource events
  MOMENTUM_GAINED = 'momentum_gained',
  MOMENTUM_LOST = 'momentum_lost',
  MOMENTUM_RESET = 'momentum_reset',
  MOMENTUM_CHANGED = 'momentum_changed',
  INSIGHT_GAINED = 'insight_gained',
  INSIGHT_SPENT = 'insight_spent',
  INSIGHT_CONVERTED = 'insight_converted',
  SP_GAINED = 'sp_gained',
  SP_SPENT = 'sp_spent',
  
  // Knowledge events
  CONCEPT_DISCOVERED = 'concept_discovered',
  KNOWLEDGE_DISCOVERED = 'knowledge_discovered',
  STAR_UNLOCKED = 'star_unlocked',
  STAR_ACTIVATED = 'star_activated',
  STAR_DEACTIVATED = 'star_deactivated',
  CONNECTION_FORMED = 'connection_formed',
  MASTERY_INCREASED = 'mastery_increased',
  
  // Special ability events
  TANGENT_USED = 'tangent_used',
  BOAST_USED = 'boast_used',
  
  // Mentor events
  RELATIONSHIP_INCREASED = 'relationship_increased',
  MENTOR_RELATIONSHIP_CHANGED = 'mentor_relationship_changed',
  
  // Dialogue events
  DIALOGUE_STARTED = 'dialogue_started',
  DIALOGUE_ENDED = 'dialogue_ended',
  DIALOGUE_OPTION_SELECTED = 'dialogue_option_selected',
  
  // System events
  ERROR_OCCURRED = 'error_occurred',
  GAME_SAVED = 'game_saved',
  GAME_LOADED = 'game_loaded',
}

// Knowledge Domains
export enum KnowledgeDomain {
  TREATMENT_PLANNING = 'treatment_planning',
  RADIATION_THERAPY = 'radiation_therapy',
  LINAC_ANATOMY = 'linac_anatomy',
  DOSIMETRY = 'dosimetry',
}

// Domain colors
export const DomainColors = {
  [KnowledgeDomain.TREATMENT_PLANNING]: '#3b82f6', // Blue
  [KnowledgeDomain.RADIATION_THERAPY]: '#10b981', // Green
  [KnowledgeDomain.LINAC_ANATOMY]: '#f59e0b', // Amber
  [KnowledgeDomain.DOSIMETRY]: '#ec4899', // Pink
};

// Mentor characters
export enum MentorId {
  GARCIA = 'garcia',
  KAPOOR = 'kapoor',
  JESSE = 'jesse',
  QUINN = 'quinn',
}

// Locations
export enum LocationId {
  TREATMENT_ROOM_1 = 'treatment_room_1',
  TREATMENT_ROOM_2 = 'treatment_room_2',
  TREATMENT_ROOM_3 = 'treatment_room_3',
  PLANNING_ROOM = 'planning_room',
  PHYSICS_LAB = 'physics_lab',
  CONFERENCE_ROOM = 'conference_room',
  CAFETERIA = 'cafeteria',
  LIBRARY = 'library',
  WARD = 'ward',
  PHYSICS_OFFICE = 'physics_office',
  RESEARCH_LAB = 'research_lab',
  WORKSTATION = 'workstation',
}

// Activity difficulty
export enum ActivityDifficulty {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard',
  NONE = 'none', // For activities like self-study
}

// Time-related types
export type TimeBlock = {
  hour: number;
  minute: number;
};

// Activity option that player can select
export type ActivityOption = {
  id: string;
  title: string;
  description: string;
  location: LocationId;
  duration: number; // In minutes
  mentor?: MentorId;
  domains: KnowledgeDomain[];
  difficulty: ActivityDifficulty;
  specialEvent?: boolean;
};

// Basic resources
export type Resources = {
  momentum: number; // 0-3 levels
  insight: number; // 0-100 points
  starPoints: number;
};

// Star/concept in the knowledge constellation
export type KnowledgeStar = {
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
};

// Connection between stars in the constellation
export type KnowledgeConnection = {
  id: string;
  sourceStarId: string;
  targetStarId: string;
  strength: number; // 0-100%
  discovered: boolean;
};

// Mentor relationship
export type MentorRelationship = {
  id: MentorId;
  level: number; // 0-5 scale
}; 