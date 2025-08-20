import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { centralEventBus } from '@/app/core/events/CentralEventBus';
import { GameEventType } from '@/app/types';
import { enableMapSet } from 'immer';

// Enable MapSet plugin for Immer to handle Sets properly
enableMapSet();

// Tutorial sequence definitions
export type TutorialSequence = 
  | 'micro_day'           // Focused Quinn micro day experience
  | 'night_phase'         // Knowledge constellation introduction
  | 'mentor_relationships'// Deep mentor interaction tutorial
  | 'advanced_systems';   // Journal cards, special abilities

// Specific tutorial steps within sequences
export type TutorialStep = 
  // Micro Day Tutorial Steps
  | 'quinn_intro'
  | 'quinn_activity'
  | 'quinn_followup'
  | 'night_phase_intro'
  | 'home_intro'
  | 'abilities_desk_intro'
  | 'constellation_available'
  | 'constellation_intro'
  | 'day_two_start'
  | 'quinn_second_meeting'
  | 'first_ability_use'
  
  // Placeholder for future implementation
  | 'mentor_relationship_tracking'
  | 'advanced_dialogue_options'
  | 'special_abilities_unlock'
  | 'boss_encounter_prep';

// Tutorial overlay types
export type TutorialOverlayType = 
  | 'tooltip'             // Simple informational popup
  | 'spotlight'           // Highlight specific UI element
  | 'modal'               // Full-screen explanation
  | 'guided_interaction'  // Step-by-step interaction guide
  | 'progress_indicator'; // Show completion progress

// Tutorial overlay data structure
export interface TutorialOverlay {
  id: string;
  type: TutorialOverlayType;
  title: string;
  content: string;
  targetElement?: string; // CSS selector for spotlight overlays
  position?: {
    x: number;
    y: number;
  };
  dismissable: boolean;
  autoAdvance?: number; // Auto-advance after X seconds
  actionRequired?: {
    type: 'click' | 'hover' | 'input';
    target: string;
  };
  preventSpaceActivation?: boolean; // Prevent space bar from activating this overlay
}

// Tutorial state should be a single enum, not multiple overlapping booleans
export type TutorialMode = 
  | 'disabled'           // Tutorial completely off
  | 'background_hints'   // Subtle hints only, no active tutorial
  | 'active_sequence'    // Currently in guided tutorial sequence
  | 'debug_mode';        // Development testing mode

// Simplified tutorial state interface
interface TutorialState {
  // SINGLE SOURCE OF TRUTH
  mode: TutorialMode;
  
  // Only relevant when mode === 'active_sequence'
  activeSequence: TutorialSequence | null;
  currentStep: TutorialStep | null;
  
  // Progress tracking (always maintained)
  completedSteps: Set<TutorialStep>;
  completedSequences: Set<TutorialSequence>;
  
  // Overlay management
  activeOverlays: TutorialOverlay[];
  
  // Settings
  autoAdvance: boolean;
  allowStepSkipping: boolean;
}

// Tutorial actions interface
interface TutorialActions {
  // Core tutorial flow
  startTutorial: (sequence: TutorialSequence, step?: TutorialStep) => void;
  startTutorialSilently: (sequence: TutorialSequence, step?: TutorialStep) => void;
  completeStep: (step: TutorialStep) => void;
  skipToStep: (step: TutorialStep) => void;
  completeTutorialSequence: (sequence: TutorialSequence) => void;
  skipTutorialSequence: (sequence: TutorialSequence) => void;
  
  // Overlay management
  showOverlay: (overlay: TutorialOverlay) => void;
  dismissOverlay: (overlayId: string) => void;
  dismissAllOverlays: () => void;
  
  // Tutorial mode control
  enableTutorialMode: () => void;
  disableTutorialMode: () => void;
  toggleTutorialMode: () => void;
  setAutoAdvance: (enabled: boolean) => void;
  
  // Progress and state
  resetTutorialProgress: () => void;
  skipAllRemaining: () => void;
  getTutorialProgress: () => number;
  isStepCompleted: (step: TutorialStep) => boolean;
  isSequenceCompleted: (sequence: TutorialSequence) => boolean;
  
  // Debug utilities
  enableDebugMode: () => void;
  disableDebugMode: () => void;
  setAllowStepSkipping: (enabled: boolean) => void;
}

type TutorialStore = TutorialState & TutorialActions;

  // Default/initial state
  const initialState: TutorialState = {
    mode: 'disabled',
    activeSequence: null,
    currentStep: null,
    completedSteps: new Set(),
    completedSequences: new Set(),
    activeOverlays: [],
    autoAdvance: true,
    allowStepSkipping: process.env.NODE_ENV === 'development',
  };

// Tutorial step sequences for progress calculation
const TUTORIAL_SEQUENCES: Record<TutorialSequence, TutorialStep[]> = {
  micro_day: [
    'quinn_intro',
    'quinn_activity',
    'quinn_followup',
    'night_phase_intro',
    'home_intro',
    'abilities_desk_intro',
    'constellation_available',
    'constellation_intro',
    'day_two_start',
    'quinn_second_meeting',
    'first_ability_use'
  ],
  night_phase: [
    // Placeholder for future night phase tutorial steps
  ],
  mentor_relationships: [
    // Placeholder for future mentor relationship steps
  ],
  advanced_systems: [
    // Placeholder for future advanced system steps
  ]
};

// Helper function to get step-specific guidance overlays
function getStepGuidanceOverlay(step: TutorialStep): TutorialOverlay | null {
  // Generate unique ID for each overlay to prevent React key collisions
  const uniqueId = (baseId: string) => `${baseId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const stepGuidance: Record<TutorialStep, TutorialOverlay | null> = {
    // Micro Day Tutorial Steps - Clean slate for new implementation
    'quinn_intro': null,
    'quinn_activity': null,
    'quinn_followup': null,
    'night_phase_intro': null,
    'home_intro': null,
    'abilities_desk_intro': null, // Removed antiquated popup
    'constellation_available': null, // Passive step - telescope is now available but no auto-trigger
    'constellation_intro': null, // Removed antiquated popup
    'day_two_start': null,
    'quinn_second_meeting': null,
    'first_ability_use': null,

    // Placeholder for future implementation
    'mentor_relationship_tracking': null,
    'advanced_dialogue_options': null,
    'special_abilities_unlock': null,
    'boss_encounter_prep': null
  };

  return stepGuidance[step] || null;
}

export const useTutorialStore = create<TutorialStore>()(
  immer((set, get) => ({
    ...initialState,

    // Start a tutorial sequence
    startTutorial: (sequence: TutorialSequence, step?: TutorialStep) => {
      set(state => {
        state.mode = 'active_sequence';
        state.activeSequence = sequence;
        state.currentStep = step || TUTORIAL_SEQUENCES[sequence][0];
        
        // Clear any existing overlays
        state.activeOverlays = [];
        
        // Show welcome overlay for the sequence
        const welcomeOverlay = {
          id: `welcome_${sequence}`,
          type: 'modal' as const,
          title: `${sequence === 'first_day' ? 'First Day' : 
                   sequence === 'night_phase' ? 'Night Phase' :
                   sequence === 'mentor_relationships' ? 'Mentor Relations' :
                   'Advanced Systems'}`,
          content: `${
            sequence === 'first_day' ? 'Meet mentors and learn basics.' :
            sequence === 'night_phase' ? 'Master constellation and journal.' :
            sequence === 'mentor_relationships' ? 'Deepen mentor bonds.' :
            'Unlock advanced abilities.'
          }`,
          dismissable: true
        };
        state.activeOverlays.push(welcomeOverlay);
      });
    },

    // Start tutorial silently without welcome overlay (for debug)
    startTutorialSilently: (sequence: TutorialSequence, step?: TutorialStep) => {
      set(state => {
        state.mode = 'active_sequence';
        state.activeSequence = sequence;
        state.currentStep = step || TUTORIAL_SEQUENCES[sequence][0];
        
        console.log(`📍 [TUTORIAL] Current step set to: ${state.currentStep}`);
        
        // Clear any existing overlays but don't add welcome overlay
        state.activeOverlays = [];
      });
    },

    // Complete a tutorial step and advance
    completeStep: (step: TutorialStep) => {
      set(state => {
        const currentSequence = state.activeSequence;
        if (!currentSequence) {
          console.log(`⚠️ [TUTORIAL] No active sequence, cannot complete step ${step}`);
          return;
        }
        
        // Mark step as completed
        state.completedSteps.add(step);
        console.log(`[TUTORIAL] ${step} completed`);
        
        // Dispatch step completion event for other systems to react
        centralEventBus.dispatch(
          GameEventType.TUTORIAL_STEP_COMPLETED,
          { step: step, sequence: currentSequence },
          'TutorialStore'
        );
        
        // Calculate sequence progress
        const sequenceSteps = TUTORIAL_SEQUENCES[currentSequence];
        const completedInSequence = sequenceSteps.filter(s => state.completedSteps.has(s)).length;
        // Progress logging removed to reduce console noise
        
        // Find next step in sequence
        const currentIndex = sequenceSteps.indexOf(step);
        const nextStep = sequenceSteps[currentIndex + 1];
        
        if (nextStep) {
          state.currentStep = nextStep;
          
          // Show step-specific guidance overlay
          const stepGuidance = getStepGuidanceOverlay(nextStep);
          if (stepGuidance) {
            state.activeOverlays.push(stepGuidance);
          }
        } else {
          // Sequence completed
          state.completedSequences.add(currentSequence);
          state.activeSequence = null;
          state.currentStep = null;
          state.mode = 'disabled';
          
          console.log(`🏆 [TUTORIAL] Sequence completed: ${currentSequence}`);
          
          // Show completion overlay
          const completionOverlay = {
            id: `completion_${currentSequence}`,
            type: 'modal' as const,
            title: 'Complete!',
            content: `${currentSequence.replace(/_/g, ' ')} mastered. Apply these skills now.`,
            dismissable: true
          };
          state.activeOverlays.push(completionOverlay);
          
          console.log(`🎊 [TUTORIAL POPUP] Completion overlay shown: "${completionOverlay.title}" (${completionOverlay.type})`);
        }
      });
    },

    // Skip directly to a specific step (debug utility)
    skipToStep: (step: TutorialStep) => {
      if (!get().allowStepSkipping) {
        console.log(`🚫 [TUTORIAL] Step skipping not allowed`);
        return;
      }
      
              // Tutorial step skipped (logging removed for cleaner console)
      
      set(state => {
        // Find which sequence this step belongs to
        for (const [sequence, steps] of Object.entries(TUTORIAL_SEQUENCES)) {
          if (steps.includes(step)) {
            state.activeSequence = sequence as TutorialSequence;
            state.currentStep = step;
            state.mode = 'active_sequence';
            // Tutorial sequence jumped (logging removed for cleaner console)
            break;
          }
        }
      });
    },

    // Complete entire tutorial sequence
    completeTutorialSequence: (sequence: TutorialSequence) => {
      console.log(`🏁 [TUTORIAL] Force completing entire sequence: ${sequence}`);
      
      set(state => {
        const steps = TUTORIAL_SEQUENCES[sequence];
        steps.forEach(step => state.completedSteps.add(step));
        state.completedSequences.add(sequence);
        
        console.log(`📋 [TUTORIAL] Marked ${steps.length} steps as completed for ${sequence}`);
        
        // If this was the current sequence, end tutorial
        if (state.activeSequence === sequence) {
          state.activeSequence = null;
          state.currentStep = null;
          state.mode = 'disabled';
          console.log(`🔚 [TUTORIAL] Ended active tutorial sequence`);
        }
      });
    },

    // Skip tutorial sequence without marking as completed
    skipTutorialSequence: (sequence: TutorialSequence) => {
      console.log(`⏭️ [TUTORIAL] Skipping sequence: ${sequence}`);
      
      set(state => {
        if (state.activeSequence === sequence) {
          state.activeSequence = null;
          state.currentStep = null;
          state.mode = 'disabled';
          console.log(`🔚 [TUTORIAL] Tutorial sequence skipped and ended`);
        }
      });
    },

    // Overlay management
    showOverlay: (overlay: TutorialOverlay) => {
      set(state => {
        // Remove any existing overlay with same id to prevent duplicates
        state.activeOverlays = state.activeOverlays.filter(o => o.id !== overlay.id);
        
        // Add new overlay with unique timestamp to ensure uniqueness
        const uniqueOverlay = {
          ...overlay,
          id: `${overlay.id}_${Date.now()}` // Make ID unique to prevent React key conflicts
        };
        state.activeOverlays.push(uniqueOverlay);
      });
    },

    dismissOverlay: (overlayId: string) => {
      set(state => {
        state.activeOverlays = state.activeOverlays.filter(o => o.id !== overlayId);
              });
    },

    dismissAllOverlays: () => {
      set(state => {
        state.activeOverlays = [];
      });
    },

    // Tutorial mode control
    enableTutorialMode: () => {
      set(state => {
        state.mode = 'active_sequence';
      });
    },

    disableTutorialMode: () => {
      set(state => {
        state.mode = 'disabled';
        state.activeOverlays = [];
        state.activeSequence = null;
        state.currentStep = null;
      });
    },

    toggleTutorialMode: () => {
      const current = get().mode;
      if (current === 'active_sequence') {
        get().disableTutorialMode();
      } else {
        get().enableTutorialMode();
      }
    },

    setAutoAdvance: (enabled: boolean) => {
      set(state => {
        state.autoAdvance = enabled;
      });
    },

    // Progress utilities
    resetTutorialProgress: () => {
      set(state => {
        state.completedSteps = new Set();
        state.completedSequences = new Set();
        state.activeSequence = null;
        state.currentStep = null;
        state.mode = 'disabled';
        state.activeOverlays = [];
      });
    },

    skipAllRemaining: () => {
      set(state => {
        state.mode = 'disabled';
        state.activeOverlays = [];
      });
    },

    getTutorialProgress: () => {
      return get().completedSteps.size / Object.values(TUTORIAL_SEQUENCES).flat().length;
    },

    isStepCompleted: (step: TutorialStep) => {
      return get().completedSteps.has(step);
    },

    isSequenceCompleted: (sequence: TutorialSequence) => {
      return get().completedSequences.has(sequence);
    },

    // Debug utilities
    enableDebugMode: () => {
      set(state => {
        state.mode = 'debug_mode';
        state.allowStepSkipping = true;
      });
    },

    disableDebugMode: () => {
      set(state => {
        state.mode = 'disabled';
        state.allowStepSkipping = false;
      });
    },

    setAllowStepSkipping: (enabled: boolean) => {
      set(state => {
        state.allowStepSkipping = enabled;
      });
    }
  }))
);

  // Selectors for components
  export const tutorialSelectors = {
    getMode: (state: TutorialStore) => state.mode,
    getCurrentSequence: (state: TutorialStore) => state.activeSequence,
    getCurrentStep: (state: TutorialStore) => state.currentStep,
    getActiveOverlays: (state: TutorialStore) => state.activeOverlays,
    getAutoAdvance: (state: TutorialStore) => state.autoAdvance,
    getDebugMode: (state: TutorialStore) => state.mode === 'debug_mode',
    getAllowStepSkipping: (state: TutorialStore) => state.allowStepSkipping,
    // Compatibility selectors for components that haven't been updated yet
    getTutorialMode: (state: TutorialStore) => state.mode !== 'disabled',
    getIsActive: (state: TutorialStore) => state.mode === 'active_sequence'
  };

// Tutorial navigation hook for components
export function useTutorialNavigation() {
  const {
    startTutorial,
    completeStep,
    skipToStep,
    skipTutorialSequence,
    enableTutorialMode,
    disableTutorialMode,
    toggleTutorialMode
  } = useTutorialStore();

  const mode = useTutorialStore(tutorialSelectors.getMode);
  const currentStep = useTutorialStore(tutorialSelectors.getCurrentStep);
  const currentSequence = useTutorialStore(tutorialSelectors.getCurrentSequence);

  return {
    // State
    mode,
    currentStep,
    currentSequence,

    // Actions
    startTutorial,
    completeStep,
    skipToStep,
    skipTutorialSequence,
    enableTutorialMode,
    disableTutorialMode,
    toggleTutorialMode,

    // Convenience methods
    startFirstDayTutorial: () => startTutorial('first_day'),
    startNightPhaseTutorial: () => startTutorial('night_phase'),
    completeCurrentStep: () => currentStep && completeStep(currentStep),
    skipCurrentSequence: () => currentSequence && skipTutorialSequence(currentSequence)
  };
}

// Debug utilities (development only)
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).__TUTORIAL_STORE_DEBUG__ = {
    getState: () => useTutorialStore.getState(),
    startFirstDay: () => useTutorialStore.getState().startTutorial('first_day'),
    startNightPhase: () => useTutorialStore.getState().startTutorial('night_phase'),
    completeStep: (step: TutorialStep) => useTutorialStore.getState().completeStep(step),
    skipToStep: (step: TutorialStep) => useTutorialStore.getState().skipToStep(step),
    resetProgress: () => useTutorialStore.getState().resetTutorialProgress(),
    toggleMode: () => useTutorialStore.getState().toggleTutorialMode(),
    showOverlay: (overlay: TutorialOverlay) => useTutorialStore.getState().showOverlay(overlay),
    getCurrentState: () => ({
      mode: useTutorialStore.getState().mode,
      sequence: useTutorialStore.getState().activeSequence,
      step: useTutorialStore.getState().currentStep,
      progress: useTutorialStore.getState().getTutorialProgress()
    })
  };
} 