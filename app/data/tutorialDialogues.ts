import { Dialogue } from '@/app/data/dialogueData';
import { DialogueMode } from '@/app/types';

/**
 * Tutorial-specific dialogues for the micro day experience
 * Clean slate implementation for focused Quinn-only tutorial
 */
export const tutorialDialogues: Record<string, Dialogue> = {

  // MICRO DAY TUTORIAL SEQUENCE
  
  /**
   * Quinn's physics office introduction - conceptual approach to learning
   */
  'tutorial_quinn_intro': {
    id: 'tutorial_quinn_intro',
    title: 'Meeting Dr. Quinn',
    description: 'First encounter with Quinn for micro day tutorial',
    startNodeId: 'quinn_welcome',
    domain: 'treatment_planning',
    difficulty: 1,
    mode: DialogueMode.NARRATIVE,
    isTutorial: true,
    nodes: {
      'quinn_welcome': {
        id: 'quinn_welcome',
        mentorId: 'quinn',
        text: `"Welcome! I'll give you some physics questions to start building your knowledge. Ready to begin?"`,
        options: [
          {
            id: 'begin_activity',
            text: 'Ready!',
            nextNodeId: 'quinn_reflection',
            triggersActivity: true,
            tutorialStepCompletion: 'quinn_activity'
          }
        ]
      },
      'quinn_reflection': {
        id: 'quinn_reflection',
        mentorId: 'quinn',
        text: `"Nice work! You've learned the basics."`,
        options: [
          {
            id: 'continue_to_wrap_up',
            text: 'Thanks!',
            nextNodeId: 'quinn_day_conclusion'
          }
        ]
      },
      'quinn_day_conclusion': {
        id: 'quinn_day_conclusion',
        mentorId: 'quinn',
        text: `"Go home and rest. Tomorrow we'll build on what you learned today."`,
        options: [
          {
            id: 'end_micro_day',
            text: 'See you tomorrow!',
            nextNodeId: undefined,
            tutorialStepCompletion: 'quinn_followup'
          }
        ]
      }
    }
  }
  
};

/**
 * Clean slate tutorial room availability system
 * Will be implemented for micro day flow
 */
const TUTORIAL_STEP_ROOM_AVAILABILITY: Record<string, any> = {
  // Placeholder for future implementation
};

/**
 * Get tutorial dialogue for specific room and step
 * Clean slate for micro day implementation
 */
export function getTutorialDialogueForRoom(roomId: string, tutorialStep: string | null): string | null {
  // Clean implementation placeholder
  if (tutorialStep === 'quinn_intro' && roomId === 'physics-office') {
    return 'tutorial_quinn_intro';
  }
  
  return null;
}

/**
 * Check if room is available in current tutorial step
 * Clean slate for micro day implementation
 */
export function isRoomAvailableInTutorial(roomId: string, tutorialStep: string | null): boolean {
  // All rooms available by default for now
  return true;
}

/**
 * Check if room is recommended for current tutorial step
 * Clean slate for micro day implementation
 */
export function isRecommendedTutorialRoom(roomId: string, tutorialStep: string | null): boolean {
  // Physics office recommended for Quinn intro
  if (tutorialStep === 'quinn_intro' && roomId === 'physics-office') {
    return true;
  }
  
  return false;
}

/**
 * Get guidance text for current tutorial step
 * Clean slate for micro day implementation
 */
export function getTutorialStepGuidance(tutorialStep: string | null): string {
  if (tutorialStep === 'quinn_intro') {
    return 'Visit the Physics Office to meet Dr. Quinn';
  }
  
  return '';
}

/**
 * Get available rooms for current tutorial step
 * Clean slate for micro day implementation
 */
export function getAvailableRoomsForStep(tutorialStep: string | null): string[] {
  // All rooms available by default
  return ['physics-office', 'linac-1', 'dosimetry-lab', 'linac-2', 'simulation-suite'];
} 