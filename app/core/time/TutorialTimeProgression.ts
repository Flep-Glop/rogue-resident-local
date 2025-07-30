/**
 * Tutorial Time Progression System
 * 
 * Manages the 4-stage time progression during the tutorial:
 * Dawn -> Day -> Evening -> Night
 * 
 * Each stage is triggered by specific tutorial step completions and updates
 * visual effects, mentor positions, and game atmosphere.
 */

import { centralEventBus } from '@/app/core/events/CentralEventBus';
import { GameEventType } from '@/app/types';
import { useTutorialStore } from '@/app/store/tutorialStore';
import { dispatchContentAvailabilityUpdate } from '@/app/core/mentors/mentorContentManager';

export type TimeOfDay = 'dawn' | 'day' | 'evening' | 'night';

export interface TimeProgressionState {
  currentTimeOfDay: TimeOfDay;
  hour: number; // 24-hour format
  stageProgress: number; // 0-1 for smooth transitions
}

/**
 * Tutorial Step to Time Progression Mapping
 * Defines when time should advance during the tutorial
 */
const TUTORIAL_TIME_PROGRESSION: Record<string, {
  timeOfDay: TimeOfDay;
  hour: number;
  description: string;
}> = {
  // Start of tutorial - Dawn (Morning)
  'morning_arrival': {
    timeOfDay: 'dawn',
    hour: 6,
    description: 'Early morning arrival at the hospital'
  },
  
  // After Garcia's physics office tutorial - Day (Noon)
  'first_educational_activity': {
    timeOfDay: 'day', 
    hour: 12,
    description: 'Noon after first physics office learning session'
  },
  
  // After lunch dialogue - Evening (Afternoon)
  'second_mentor_intro': {
    timeOfDay: 'evening',
    hour: 16,
    description: 'Afternoon after lunch break and second mentor introduction'
  },
  
  // After Quinn's journal explanation - Night
  'night_phase_transition': {
    timeOfDay: 'night',
    hour: 20,
    description: 'Evening after Quinn meeting and journal introduction'
  }
};

/**
 * Visual settings for each time of day
 */
export const TIME_VISUAL_SETTINGS: Record<TimeOfDay, {
  ambientColor: string;
  backgroundColor: string;
  lightingIntensity: number;
  shadowOpacity: number;
  windowGlowIntensity: number;
  particleColor: string;
  description: string;
}> = {
  dawn: {
    ambientColor: '#FFB366', // Warm orange
    backgroundColor: 'linear-gradient(135deg, #FFB366 0%, #FFCC99 50%, #87CEEB 100%)',
    lightingIntensity: 0.3,
    shadowOpacity: 0.7,
    windowGlowIntensity: 0.2,
    particleColor: '#FFD700',
    description: 'Soft morning light with golden hues'
  },
  day: {
    ambientColor: '#87CEEB', // Sky blue
    backgroundColor: 'linear-gradient(135deg, #87CEEB 0%, #98E4FF 50%, #E0F6FF 100%)',
    lightingIntensity: 1.0,
    shadowOpacity: 0.3,
    windowGlowIntensity: 0.05,
    particleColor: '#FFFFFF',
    description: 'Bright noon daylight with clear blue sky'
  },
  evening: {
    ambientColor: '#FF7F50', // Coral
    backgroundColor: 'linear-gradient(135deg, #FF7F50 0%, #FFB347 50%, #DDA0DD 100%)',
    lightingIntensity: 0.6,
    shadowOpacity: 0.5,
    windowGlowIntensity: 0.7,
    particleColor: '#FFA500',
    description: 'Warm sunset colors with increased window lighting'
  },
  night: {
    ambientColor: '#191970', // Midnight blue
    backgroundColor: 'linear-gradient(135deg, #191970 0%, #483D8B 50%, #2F2F2F 100%)',
    lightingIntensity: 0.2,
    shadowOpacity: 0.8,
    windowGlowIntensity: 1.0,
    particleColor: '#E6E6FA',
    description: 'Deep night with prominent window glow'
  }
};

/**
 * Mentor schedule based on time of day
 * Defines where mentors should be positioned during each time period
 */
export const MENTOR_TIME_SCHEDULE: Record<TimeOfDay, Record<string, {
  roomId: string;
  worldX: number;
  worldY: number;
  available: boolean;
}>> = {
  dawn: {
    'jesse': { roomId: 'linac-1', worldX: -820, worldY: 20, available: false },
    'kapoor': { roomId: 'dosimetry-lab', worldX: 600, worldY: 0, available: false },
    'quinn': { roomId: 'physics-office', worldX: -350, worldY: -145, available: true }
  },
  day: {
    'jesse': { roomId: 'linac-1', worldX: -820, worldY: 20, available: false },
    'kapoor': { roomId: 'dosimetry-lab', worldX: 600, worldY: 0, available: false },
    'quinn': { roomId: 'lunch-room', worldX: -300, worldY: 100, available: true } // Available for lunch dialogue
  },
  evening: {
    'jesse': { roomId: 'linac-1', worldX: -820, worldY: 20, available: true }, // Available for afternoon tutorial
    'kapoor': { roomId: 'dosimetry-lab', worldX: 600, worldY: 0, available: false },
    'quinn': { roomId: 'physics-office', worldX: -350, worldY: -145, available: false }
  },
  night: {
    'jesse': { roomId: 'linac-1', worldX: -820, worldY: 20, available: false },
    'kapoor': { roomId: 'dosimetry-lab', worldX: 600, worldY: 0, available: false },
    'quinn': { roomId: 'physics-office', worldX: -350, worldY: -145, available: true } // Available for final meeting
  }
};

/**
 * Time Progression Manager Class
 */
class TutorialTimeProgressionManager {
  private currentState: TimeProgressionState = {
    currentTimeOfDay: 'dawn',
    hour: 6,
    stageProgress: 0
  };

  private initialized = false;
  private hasDispatchedInitialState = false;

  /**
   * Initialize the time progression system
   */
  public initialize() {
    if (this.initialized) {
      console.log('[TutorialTimeProgression] Already initialized, maintaining current state:', this.currentState.currentTimeOfDay);
      return;
    }

    // Listen for tutorial step completions
    centralEventBus.subscribe(GameEventType.TUTORIAL_STEP_COMPLETED, (event) => {
      const completedStep = event.payload?.step as string;
      this.handleTutorialStepCompletion(completedStep);
    });

    // Only dispatch initial state on first initialization
    if (!this.hasDispatchedInitialState) {
      this.dispatchTimeUpdate();
      console.log('[TutorialTimeProgression] Initialized with dawn setting');
      this.hasDispatchedInitialState = true;
    }
    
    this.initialized = true;
  }

  /**
   * Handle tutorial step completion and check for time progression
   */
  private handleTutorialStepCompletion(completedStep: string) {
    const timeProgression = TUTORIAL_TIME_PROGRESSION[completedStep];
    
    if (timeProgression) {
      console.log(`[TutorialTimeProgression] 🕐 Step "${completedStep}" completed - advancing to ${timeProgression.timeOfDay} (${timeProgression.hour}:00)`);
      console.log(`[TutorialTimeProgression] 🔄 ${timeProgression.description}`);
      this.advanceToTimeOfDay(timeProgression.timeOfDay, timeProgression.hour);
    } else {
      console.log(`[TutorialTimeProgression] ⏸️ Step "${completedStep}" completed - no time progression`);
    }
  }

  /**
   * Advance time to a specific time of day
   */
  private advanceToTimeOfDay(timeOfDay: TimeOfDay, hour: number) {
    const previousTime = this.currentState.currentTimeOfDay;
    
    this.currentState = {
      currentTimeOfDay: timeOfDay,
      hour: hour,
      stageProgress: 1.0 // Full progression to new stage
    };

    // Update global time state for other systems
    updateGlobalTimeOfDay(timeOfDay);

    console.log(`[TutorialTimeProgression] Time advanced: ${previousTime} → ${timeOfDay} (${hour}:00)`);
    
    // Dispatch time update events
    this.dispatchTimeUpdate();
    this.updateMentorAvailability();
  }

  /**
   * Dispatch time update events for visual systems to listen to
   */
  private dispatchTimeUpdate() {
    const visualSettings = TIME_VISUAL_SETTINGS[this.currentState.currentTimeOfDay];
    
    // Fire event for visual systems (PixiJS effects)
    centralEventBus.dispatch(
      GameEventType.TIME_ADVANCED, 
      {
        timeOfDay: this.currentState.currentTimeOfDay,
        hour: this.currentState.hour,
        visualSettings: visualSettings,
        stageProgress: this.currentState.stageProgress
      },
      'TutorialTimeProgression'
    );

    console.log(`[TutorialTimeProgression] 🎨 Visual update: ${this.currentState.currentTimeOfDay} (${this.currentState.hour}:00) - ${visualSettings.description}`);
  }

  /**
   * Update mentor availability based on current time
   */
  private updateMentorAvailability() {
    const mentorSchedule = MENTOR_TIME_SCHEDULE[this.currentState.currentTimeOfDay];
    
    // Fire event for mentor content system to update
    centralEventBus.dispatch(
      GameEventType.MENTOR_CONTENT_UPDATED,
      {
        timeOfDay: this.currentState.currentTimeOfDay,
        mentorSchedule: mentorSchedule
      },
      'TutorialTimeProgression'
    );

    // Also trigger content availability update
    setTimeout(dispatchContentAvailabilityUpdate, 100);
  }

  /**
   * Get current time state (for React components)
   */
  public getCurrentState(): TimeProgressionState {
    return { ...this.currentState };
  }

  /**
   * Get visual settings for current time (for React components)
   */
  public getCurrentVisualSettings() {
    return TIME_VISUAL_SETTINGS[this.currentState.currentTimeOfDay];
  }

  /**
   * Get mentor schedule for current time (for React components)
   */
  public getCurrentMentorSchedule() {
    return MENTOR_TIME_SCHEDULE[this.currentState.currentTimeOfDay];
  }

  /**
   * Force time advancement (for testing)
   */
  public forceAdvanceTime(timeOfDay: TimeOfDay) {
    if (process.env.NODE_ENV === 'development') {
      const hour = TIME_VISUAL_SETTINGS[timeOfDay] ? 
        (timeOfDay === 'dawn' ? 6 : timeOfDay === 'day' ? 12 : timeOfDay === 'evening' ? 18 : 22) : 12;
      this.advanceToTimeOfDay(timeOfDay, hour);
      console.log(`[TutorialTimeProgression] [DEBUG] Forced time advancement to ${timeOfDay}`);
    }
  }
}

// Singleton instance - lazily created to persist across component re-mounts
let tutorialTimeManagerInstance: TutorialTimeProgressionManager | null = null;

export function getTutorialTimeManager(): TutorialTimeProgressionManager {
  if (!tutorialTimeManagerInstance) {
    tutorialTimeManagerInstance = new TutorialTimeProgressionManager();
  }
  return tutorialTimeManagerInstance;
}

// Export for backward compatibility
export const tutorialTimeManager = getTutorialTimeManager();

// Simple state tracking for current time (accessible to other systems)
let currentGlobalTimeOfDay: TimeOfDay = 'dawn';

/**
 * Get the current global time of day (for systems that need it)
 */
export function getCurrentTimeOfDay(): TimeOfDay {
  return currentGlobalTimeOfDay;
}

/**
 * Update the global time of day state (called by the time manager)
 */
export function updateGlobalTimeOfDay(timeOfDay: TimeOfDay) {
  currentGlobalTimeOfDay = timeOfDay;
}

/**
 * Initialize the tutorial time progression system
 * Call this once during app startup
 */
export function initializeTutorialTimeProgression() {
  getTutorialTimeManager().initialize();
}

/**
 * React hook for components to access time progression state
 */
export function useTimeProgression() {
  return {
    getCurrentState: () => getTutorialTimeManager().getCurrentState(),
    getCurrentVisualSettings: () => getTutorialTimeManager().getCurrentVisualSettings(),
    getCurrentMentorSchedule: () => getTutorialTimeManager().getCurrentMentorSchedule(),
    forceAdvanceTime: (timeOfDay: TimeOfDay) => getTutorialTimeManager().forceAdvanceTime(timeOfDay)
  };
}

// Debug utilities (development only)
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).__TIME_PROGRESSION_DEBUG__ = {
    getCurrentState: () => tutorialTimeManager.getCurrentState(),
    forceAdvanceTime: (timeOfDay: TimeOfDay) => tutorialTimeManager.forceAdvanceTime(timeOfDay),
    getVisualSettings: (timeOfDay: TimeOfDay) => TIME_VISUAL_SETTINGS[timeOfDay],
    getMentorSchedule: (timeOfDay: TimeOfDay) => MENTOR_TIME_SCHEDULE[timeOfDay]
  };
} 