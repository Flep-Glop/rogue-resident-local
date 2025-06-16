import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { centralEventBus } from '@/app/core/events/CentralEventBus';
import { GameEventType, MentorId, MentorRelationship, MentorRelationships } from '@/app/types';

// Helper function for safe event dispatch
function safeDispatch(eventType: GameEventType, payload?: any, source?: string) {
  try {
    centralEventBus.dispatch(
      eventType,
      payload ? { ...payload, source: source || 'relationshipStore' } : { source: source || 'relationshipStore' },
      source || 'relationshipStore'
    );
  } catch (error) {
    console.error(`Error dispatching ${eventType} event:`, error);
  }
}

// Constants for relationship mechanics
const RELATIONSHIP_MAX_LEVEL = 5;
const POINTS_PER_LEVEL = 10; // Points needed to reach the next level (0-50 scale)
const POINTS_FOR_SUCCESS = 1; // Points gained for successful interactions
const POINTS_FOR_FAILURE = -1; // Points lost for failures
const LEVEL_THRESHOLDS = [0, 10, 20, 30, 40, 50]; // Points needed for each level (0-5)

// Define RelationshipState interface
interface RelationshipState {
  // State
  relationships: MentorRelationships;
  
  // Actions
  updateRelationship: (mentorId: MentorId, points: number, source?: string) => void;
  getRelationshipLevel: (mentorId: MentorId) => number;
  getRelationshipPoints: (mentorId: MentorId) => number;
  increaseRelationshipOnBoastSuccess: (mentorId: MentorId, source?: string) => void;
  decreaseRelationshipOnBoastFailure: (mentorId: MentorId, source?: string) => void;
  logMentorInteraction: (mentorId: MentorId, source?: string) => void;
  getRelationshipBonus: (mentorId: MentorId, domain?: string) => number;
}

// Initialize a default relationship (level 0, no interactions)
const createDefaultRelationship = (): MentorRelationship => ({
  level: 0,
  points: 0,
  interactions: 0
});

// Create the initial relationships object with all mentors
const createInitialRelationships = (): MentorRelationships => ({
  [MentorId.GARCIA]: createDefaultRelationship(),
  [MentorId.KAPOOR]: createDefaultRelationship(),
  [MentorId.JESSE]: createDefaultRelationship(),
  [MentorId.QUINN]: createDefaultRelationship()
});

// Create the relationship store
export const useRelationshipStore = create<RelationshipState>()(
  immer((set, get) => ({
    // State
    relationships: createInitialRelationships(),
    
    // Update relationship points
    updateRelationship: (mentorId: MentorId, points: number, source?: string) => set(state => {
      if (!state.relationships[mentorId]) {
        console.error(`[RelationshipStore] Unknown mentor ID: ${mentorId}`);
        return;
      }
      
      const currentRelationship = state.relationships[mentorId];
      const currentPoints = currentRelationship.points || 0;
      const currentLevel = currentRelationship.level;
      
      // Calculate new points (never below 0)
      const newPoints = Math.max(0, currentPoints + points);
      
      // Determine new level based on points
      const newLevel = LEVEL_THRESHOLDS.findIndex((threshold, index) => 
        index === LEVEL_THRESHOLDS.length - 1 || 
        (newPoints >= threshold && newPoints < LEVEL_THRESHOLDS[index + 1])
      );
      
      // Log the change
      console.log(`[RelationshipStore] ${mentorId} relationship: ${currentPoints} → ${newPoints} points (${points > 0 ? '+' : ''}${points})`);
      
      // Check for level up
      if (newLevel > currentLevel) {
        console.log(`[RelationshipStore] ${mentorId} relationship LEVEL UP: ${currentLevel} → ${newLevel}`);
        
        // Dispatch level up event
        safeDispatch(GameEventType.RELATIONSHIP_LEVEL_UP, {
          mentorId,
          previousLevel: currentLevel,
          newLevel,
          source: source || 'updateRelationship'
        });
      }
      
      // Always dispatch relationship changed event
      safeDispatch(GameEventType.RELATIONSHIP_IMPROVED, {
        mentorId,
        previousPoints: currentPoints,
        newPoints,
        change: points,
        previousLevel: currentLevel, 
        newLevel,
        source: source || 'updateRelationship'
      });
      
      // Update the state
      state.relationships[mentorId].points = newPoints;
      state.relationships[mentorId].level = newLevel;
    }),
    
    // Convenience method to get relationship level
    getRelationshipLevel: (mentorId: MentorId) => {
      return get().relationships[mentorId]?.level || 0;
    },
    
    // Convenience method to get relationship points
    getRelationshipPoints: (mentorId: MentorId) => {
      return get().relationships[mentorId]?.points || 0;
    },
    
    // Increase relationship on boast success
    increaseRelationshipOnBoastSuccess: (mentorId: MentorId, source?: string) => {
      get().updateRelationship(mentorId, POINTS_FOR_SUCCESS, source || 'boastSuccess');
    },
    
    // Decrease relationship on boast failure
    decreaseRelationshipOnBoastFailure: (mentorId: MentorId, source?: string) => {
      get().updateRelationship(mentorId, POINTS_FOR_FAILURE, source || 'boastFailure');
    },
    
    // Track mentor interactions (just increments the count)
    logMentorInteraction: (mentorId: MentorId, source?: string) => set(state => {
      if (!state.relationships[mentorId]) {
        console.error(`[RelationshipStore] Unknown mentor ID: ${mentorId}`);
        return;
      }
      
      state.relationships[mentorId].interactions += 1;
      
      console.log(`[RelationshipStore] Logged interaction with ${mentorId} (total: ${state.relationships[mentorId].interactions})`);
    }),
    
    // Get relationship bonus for a mentor 
    // (can be used for domain-specific bonuses once we integrate with domains)
    getRelationshipBonus: (mentorId: MentorId, domain?: string) => {
      const level = get().getRelationshipLevel(mentorId);
      
      // For now, return a simple percentage bonus based on level (0-25%)
      return level * 0.05; // 5% per level, max 25% at level 5
    }
  }))
);

// Initialize store with default values (can be called during app initialization)
export function initializeRelationshipStore(initialValues?: Partial<{ [key in MentorId]: Partial<MentorRelationship> }>) {
  if (!initialValues) return;
  
  const currentRelationships = { ...createInitialRelationships() };
  
  // Update any provided initial values
  Object.entries(initialValues).forEach(([mentorId, relationship]) => {
    if (mentorId in MentorId) {
      currentRelationships[mentorId as MentorId] = {
        ...currentRelationships[mentorId as MentorId],
        ...relationship
      };
    }
  });
  
  useRelationshipStore.setState({ relationships: currentRelationships });
} 