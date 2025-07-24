/**
 * Mentor Content Availability Manager
 * 
 * Determines when mentors have content available and what type of activity indicator to show.
 * This follows the same patterns as the tutorial system but focuses on mentor-based interactions.
 */

import { centralEventBus } from '@/app/core/events/CentralEventBus';
import { GameEventType } from '@/app/types';
import { useTutorialStore } from '@/app/store/tutorialStore';
import { useGameStore } from '@/app/store/gameStore';
import { isRoomAvailableInTutorial, getTutorialDialogueForRoom } from '@/app/data/tutorialDialogues';
import { MENTOR_TIME_SCHEDULE, getCurrentTimeOfDay, type TimeOfDay } from '@/app/core/time/TutorialTimeProgression';
import type { ActivityIndicatorType } from '@/app/components/hospital/MentorClickOverlay';

export interface MentorContentAvailability {
  mentorId: string;
  roomId: string;
  isAvailable: boolean;
  activityType: ActivityIndicatorType;
  priority: number; // Higher priority = more important
  contentId?: string; // Specific dialogue or activity
}

/**
 * Mentor to Room Mapping - defines where each mentor can be found
 * This will eventually support mentor movement between rooms
 */
export const MENTOR_ROOM_MAPPING: Record<string, string[]> = {
  'garcia': ['physics-office', 'linac-1'],
  'jesse': ['linac-1', 'linac-2', 'simulation-suite'],
  'kapoor': ['dosimetry-lab'],
  'quinn': ['physics-office', 'lunch-room'],
};

/**
 * Content Priority System - determines which indicator to show when multiple types are available
 */
const ACTIVITY_PRIORITY: Record<ActivityIndicatorType, number> = {
  'tutorial': 100,      // Highest priority - always show tutorial content first
  'narrative': 80,      // High priority - story progression
  'challenge': 60,      // Medium priority - skill building
  'available': 40,      // Low priority - general availability
  null: 0               // No content
};

/**
 * Determine content availability for a specific mentor in a specific room
 */
export function getMentorContentAvailability(
  mentorId: string, 
  roomId: string,
  tutorialState: { mode: string; currentStep: string | null },
  gameState: { daysPassed: number },
  timeOfDay: TimeOfDay = 'dawn'
): MentorContentAvailability {
  
  const isTutorialActive = tutorialState.mode === 'active_sequence';
  const currentTutorialStep = tutorialState.currentStep;
  
  // Check mentor's time-based schedule first
  const mentorSchedule = MENTOR_TIME_SCHEDULE[timeOfDay];
  const mentorTimeSlot = mentorSchedule[mentorId];
  
  if (!mentorTimeSlot) {
    return {
      mentorId,
      roomId,
      isAvailable: false,
      activityType: null,
      priority: 0
    };
  }
  
  // Check if mentor is in the expected room for this time period
  if (mentorTimeSlot.roomId !== roomId) {
    return {
      mentorId,
      roomId,
      isAvailable: false,
      activityType: null,
      priority: 0
    };
  }
  
  // Check if mentor is marked as available in their schedule
  if (!mentorTimeSlot.available) {
    return {
      mentorId,
      roomId,
      isAvailable: false,
      activityType: null,
      priority: 0
    };
  }
  
  // Priority 1: Tutorial Content (if active)
  if (isTutorialActive && currentTutorialStep) {
    const isRoomAvailable = isRoomAvailableInTutorial(roomId, currentTutorialStep);
    const tutorialDialogue = getTutorialDialogueForRoom(roomId, currentTutorialStep);
    
    if (isRoomAvailable && tutorialDialogue) {
      return {
        mentorId,
        roomId,
        isAvailable: true,
        activityType: 'tutorial',
        priority: ACTIVITY_PRIORITY.tutorial,
        contentId: tutorialDialogue
      };
    }
  }
  
  // Priority 2: Narrative Content (story progression)
  const narrativeContent = checkNarrativeContent(mentorId, roomId, gameState);
  if (narrativeContent.isAvailable) {
    return narrativeContent;
  }
  
  // Priority 3: Challenge Content (skill building)
  const challengeContent = checkChallengeContent(mentorId, roomId, gameState);
  if (challengeContent.isAvailable) {
    return challengeContent;
  }
  
  // Priority 4: General Availability (always available mentors)
  return {
    mentorId,
    roomId,
    isAvailable: true,
    activityType: 'available',
    priority: ACTIVITY_PRIORITY.available,
    contentId: `${roomId}-intro`
  };
}

/**
 * Check for narrative content availability
 */
function checkNarrativeContent(
  mentorId: string, 
  roomId: string, 
  gameState: { daysPassed: number }
): MentorContentAvailability {
  
  // Demo narrative content logic - replace with real story progression
  const narrativeSchedule: Record<string, Record<string, boolean>> = {
    'garcia': {
      'physics-office': gameState.daysPassed === 0, // First day introduction
      'linac-1': gameState.daysPassed >= 1 // Available after first day
    },
    'jesse': {
      'linac-1': gameState.daysPassed >= 0, // Available from start
      'simulation-suite': gameState.daysPassed >= 2 // Unlocked later
    },
    'kapoor': {
      'dosimetry-lab': gameState.daysPassed >= 0 // Always available
    },
    'quinn': {
      'physics-office': gameState.daysPassed >= 1, // Available after introduction
      'lunch-room': gameState.daysPassed === 0 // First day lunch
    }
  };
  
  const hasNarrativeContent = narrativeSchedule[mentorId]?.[roomId] || false;
  
  return {
    mentorId,
    roomId,
    isAvailable: hasNarrativeContent,
    activityType: hasNarrativeContent ? 'narrative' : null,
    priority: hasNarrativeContent ? ACTIVITY_PRIORITY.narrative : 0,
    contentId: hasNarrativeContent ? `${roomId}-narrative` : undefined
  };
}

/**
 * Check for challenge content availability  
 */
function checkChallengeContent(
  mentorId: string,
  roomId: string,
  gameState: { daysPassed: number }
): MentorContentAvailability {
  
  // Demo challenge content logic - replace with real progression system
  const challengeSchedule: Record<string, Record<string, boolean>> = {
    'garcia': {
      'physics-office': gameState.daysPassed >= 1, // Challenges after introduction
    },
    'jesse': {
      'linac-1': gameState.daysPassed >= 1,
      'linac-2': gameState.daysPassed >= 3
    },
    'kapoor': {
      'dosimetry-lab': gameState.daysPassed >= 2 // More advanced content
    }
  };
  
  const hasChallengeContent = challengeSchedule[mentorId]?.[roomId] || false;
  
  return {
    mentorId,
    roomId,
    isAvailable: hasChallengeContent,
    activityType: hasChallengeContent ? 'challenge' : null,
    priority: hasChallengeContent ? ACTIVITY_PRIORITY.challenge : 0,
    contentId: hasChallengeContent ? `${roomId}-challenge` : undefined
  };
}

/**
 * Get content availability for all mentors (used by React components)
 */
export function getAllMentorContentAvailability(timeOfDay: TimeOfDay = 'dawn'): Record<string, MentorContentAvailability> {
  // Get current game state
  const tutorialStore = useTutorialStore.getState();
  const gameStore = useGameStore.getState();
  
  const tutorialState = {
    mode: tutorialStore.mode,
    currentStep: tutorialStore.currentStep
  };
  
  const gameState = {
    daysPassed: gameStore.daysPassed
  };
  
  const availabilityMap: Record<string, MentorContentAvailability> = {};
  
  // Get mentor schedule for current time of day
  const mentorSchedule = MENTOR_TIME_SCHEDULE[timeOfDay];
  
  // Check each mentor in their scheduled location for this time
  Object.entries(mentorSchedule).forEach(([mentorId, schedule]) => {
    availabilityMap[mentorId] = getMentorContentAvailability(
      mentorId,
      schedule.roomId,
      tutorialState,
      gameState,
      timeOfDay
    );
  });
  
  return availabilityMap;
}

/**
 * Event-based content availability updates (fire-and-forget pattern)
 * Components can listen to these events to update their indicators
 */
export function dispatchContentAvailabilityUpdate() {
  const currentTimeOfDay = getCurrentTimeOfDay();
  const contentAvailability = getAllMentorContentAvailability(currentTimeOfDay);
  
  // Fire event for any components listening to content changes
  centralEventBus.dispatch(
    GameEventType.MENTOR_CONTENT_UPDATED, 
    { contentAvailability, timeOfDay: currentTimeOfDay },
    'MentorContentManager'
  );
  
  // Content availability updated (logging removed for cleaner console)
}

/**
 * Initialize the content manager - sets up event listeners for state changes
 */
export function initializeMentorContentManager() {
  // Listen for tutorial progression changes
  centralEventBus.subscribe(GameEventType.TUTORIAL_STEP_COMPLETED, () => {
    setTimeout(dispatchContentAvailabilityUpdate, 100); // Small delay to ensure state is updated
  });
  
  // Listen for day progression changes
  centralEventBus.subscribe(GameEventType.END_OF_DAY_REACHED, () => {
    setTimeout(dispatchContentAvailabilityUpdate, 100);
  });
  
  // Dispatch initial content availability
  dispatchContentAvailabilityUpdate();
  
  // MentorContentManager initialized (logging removed for cleaner console)
} 