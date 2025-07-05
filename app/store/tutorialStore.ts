import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { enableMapSet } from 'immer';

// Enable MapSet plugin for Immer to handle Sets properly
enableMapSet();

// Tutorial sequence definitions
export type TutorialSequence = 
  | 'first_day'           // Complete first day onboarding
  | 'night_phase'         // Knowledge constellation introduction
  | 'mentor_relationships'// Deep mentor interaction tutorial
  | 'advanced_systems';   // Journal cards, special abilities

// Specific tutorial steps within sequences
export type TutorialStep = 
  // First Day Tutorial Steps
  | 'morning_arrival'
  | 'first_mentor_intro'
  | 'hospital_tour'
  | 'first_educational_activity'
  | 'insight_mechanic_intro'
  | 'lunch_dialogue'
  | 'second_mentor_intro'
  | 'constellation_preview'
  | 'first_ability_intro'
  | 'journal_card_explanation'
  | 'night_phase_transition'
  | 'quinn_office_meeting'
  | 'ability_card_introduction'
  | 'journal_system_explanation'
  | 'third_mentor_intro'
  
  // Night Phase Tutorial Steps
  | 'observatory_introduction'
  | 'constellation_interface'
  | 'star_selection_tutorial'
  | 'journal_system_intro'
  | 'card_placement_tutorial'
  | 'phone_call_system'
  | 'mentor_night_guidance'
  
  // Advanced Tutorial Steps
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
  first_day: [
    'morning_arrival',
    'hospital_tour',
    'first_mentor_intro',
    'first_educational_activity',
    'lunch_dialogue',
    'second_mentor_intro',
    'constellation_preview',
    'first_ability_intro',
    'insight_mechanic_intro',
    'journal_card_explanation',
    'night_phase_transition',
    'quinn_office_meeting',
    'ability_card_introduction',
    'journal_system_explanation',
    'third_mentor_intro'
  ],
  night_phase: [
    'observatory_introduction',
    'constellation_interface',
    'star_selection_tutorial',
    'journal_system_intro',
    'card_placement_tutorial',
    'phone_call_system',
    'mentor_night_guidance'
  ],
  mentor_relationships: [
    'mentor_relationship_tracking',
    'advanced_dialogue_options'
  ],
  advanced_systems: [
    'special_abilities_unlock',
    'boss_encounter_prep'
  ]
};

// Helper function to get step-specific guidance overlays
function getStepGuidanceOverlay(step: TutorialStep): TutorialOverlay | null {
  const stepGuidance: Record<TutorialStep, TutorialOverlay | null> = {
    // First Day Tutorial Steps
    'morning_arrival': {
      id: 'guide_morning_arrival',
      type: 'tooltip',
      title: 'First Day!',
      content: 'Meet Dr. Garcia, your first mentor.',
      position: { x: 200, y: 100 },
      dismissable: true,
      autoAdvance: 5
    },
    'first_mentor_intro': {
      id: 'guide_first_mentor',
      type: 'spotlight',
      title: 'Dr. Garcia',
      content: 'Lead oncologist. Focus on patient-centered care.',
      targetElement: '.mentor-portrait, .dialogue-view',
      dismissable: true
    },
    'hospital_tour': {
      id: 'guide_hospital_tour',
      type: 'tooltip',
      title: 'Navigation',
      content: 'Click glowing rooms to explore. Each offers unique learning.',
      position: { x: 300, y: 200 },
      dismissable: true
    },
    'first_educational_activity': null, // Shown manually in NarrativeDialogue when activity triggers
    'insight_mechanic_intro': {
      id: 'guide_insight_intro',
      type: 'modal',
      title: 'Insight Points',
      content: 'IP is your learning currency. Earn from activities, unlock stars.',
      dismissable: true
    }, // Introduced after first activity for better pacing
    'lunch_dialogue': null, // Will be shown when returning to hospital map
    'second_mentor_intro': {
      id: 'guide_second_mentor',
      type: 'spotlight',
      title: 'Dr. Quinn',
      content: 'Treatment Planning head. Physics expert.',
      targetElement: '.mentor-portrait, .dialogue-view',
      dismissable: true
    },
    'constellation_preview': null, // Moved to Quinn's office meeting at end of day
    'first_ability_intro': null, // Moved to Quinn's office meeting at end of day
    'journal_card_explanation': null, // Moved to Quinn's office meeting at end of day
    'night_phase_transition': null, // Moved to Quinn's office meeting at end of day
    'third_mentor_intro': {
      id: 'guide_third_mentor',
      type: 'spotlight',
      title: 'Dr. Kapoor',
      content: 'Dosimetry expert. Precision-focused.',
      targetElement: '.mentor-portrait, .dialogue-view',
      dismissable: true
    },

    // Night Phase Tutorial Steps
    'observatory_introduction': {
      id: 'guide_observatory',
      type: 'modal',
      title: 'Your Observatory',
      content: 'Explore your constellation and organize learning each night.',
      dismissable: true
    },
    'constellation_interface': {
      id: 'guide_constellation_interface',
      type: 'tooltip',
      title: 'Constellation',
      content: 'Each star is a concept. Click to unlock with SP.',
      position: { x: 400, y: 200 },
      dismissable: true
    },
    'star_selection_tutorial': {
      id: 'guide_star_selection',
      type: 'guided_interaction',
      title: 'Select a Star',
      content: 'Click any glowing star. Costs SP from activities.',
      targetElement: '.knowledge-star, .constellation-star',
      dismissable: false,
      actionRequired: { type: 'click', target: '.knowledge-star, .constellation-star' }
    },
    'journal_system_intro': {
      id: 'guide_journal_system',
      type: 'modal',
      title: 'Journal',
      content: 'Store ability cards and insights. Organize strategically.',
      dismissable: true
    },
    'card_placement_tutorial': {
      id: 'guide_card_placement',
      type: 'guided_interaction',
      title: 'Organize Cards',
      content: 'Place an ability card. Categorize by priority.',
      targetElement: '.journal-card, .ability-card',
      dismissable: false,
      actionRequired: { type: 'click', target: '.journal-card, .ability-card' }
    },
    'phone_call_system': {
      id: 'guide_phone_system',
      type: 'tooltip',
      title: 'Mentor Calls',
      content: 'Mentors call with guidance and insights.',
      position: { x: 300, y: 100 },
      dismissable: true,
      autoAdvance: 4
    },
    'mentor_night_guidance': {
      id: 'guide_mentor_guidance',
      type: 'modal',
      title: 'Mentor Support',
      content: 'Mentors help connect concepts and apply knowledge.',
      dismissable: true
    },

    // Advanced Tutorial Steps (minimal for now)
    'mentor_relationship_tracking': null,
    'advanced_dialogue_options': null,
    'special_abilities_unlock': null,
    'boss_encounter_prep': null,

    // Quinn's Office Meeting Tutorial Steps
    'quinn_office_meeting': {
      id: 'guide_quinn_office',
      type: 'tooltip',
      title: 'Day Wrap-up',
      content: 'Dr. Quinn has something important to share.',
      position: { x: 300, y: 150 },
      dismissable: true
    },
    'ability_card_introduction': {
      id: 'guide_constellation_preview',
      type: 'modal',
      title: 'Constellation Preview',
      content: 'Tonight you\'ll visualize and connect concepts.',
      dismissable: true
    },
    'journal_system_explanation': {
      id: 'guide_first_ability',
      type: 'modal',
      title: 'Your First Card',
      content: 'Apply this ability in future activities. Organize tonight.',
      dismissable: true
    },

    // Night phase transition overlay that will appear after Quinn's office meeting
    'night_phase_transition': {
      id: 'guide_night_transition',
      type: 'modal',
      title: 'Night Phase',
      content: 'Day ending. Explore constellation and organize journal.',
      dismissable: true
    }
  };

  return stepGuidance[step] || null;
}

export const useTutorialStore = create<TutorialStore>()(
  immer((set, get) => ({
    ...initialState,

    // Start a tutorial sequence
    startTutorial: (sequence: TutorialSequence, step?: TutorialStep) => {
      console.log(`🎓 [TUTORIAL] Starting tutorial sequence: ${sequence}`);
      
      set(state => {
        state.mode = 'active_sequence';
        state.activeSequence = sequence;
        state.currentStep = step || TUTORIAL_SEQUENCES[sequence][0];
        
        console.log(`📍 [TUTORIAL] Current step set to: ${state.currentStep}`);
        
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
        
        console.log(`🎉 [TUTORIAL POPUP] Welcome overlay shown: "${welcomeOverlay.title}" (${welcomeOverlay.type})`);
      });
    },

    // Start tutorial silently without welcome overlay (for debug)
    startTutorialSilently: (sequence: TutorialSequence, step?: TutorialStep) => {
      console.log(`🤫 [TUTORIAL] Starting tutorial sequence silently: ${sequence}`);
      
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
      console.log(`✅ [TUTORIAL] Completing step: ${step}`);
      
      set(state => {
        const currentSequence = state.activeSequence;
        if (!currentSequence) {
          console.log(`⚠️ [TUTORIAL] No active sequence, cannot complete step ${step}`);
          return;
        }
        
        // Mark step as completed
        state.completedSteps.add(step);
        console.log(`📋 [TUTORIAL] Step marked complete: ${step}`);
        
        // Calculate sequence progress
        const sequenceSteps = TUTORIAL_SEQUENCES[currentSequence];
        const completedInSequence = sequenceSteps.filter(s => state.completedSteps.has(s)).length;
        console.log(`📊 [TUTORIAL] Progress: ${completedInSequence}/${sequenceSteps.length} steps in ${currentSequence}`);
        
        // Find next step in sequence
        const currentIndex = sequenceSteps.indexOf(step);
        const nextStep = sequenceSteps[currentIndex + 1];
        
        if (nextStep) {
          state.currentStep = nextStep;
          console.log(`➡️ [TUTORIAL] Advancing to next step: ${nextStep}`);
          
          // Show step-specific guidance overlay
          const stepGuidance = getStepGuidanceOverlay(nextStep);
          if (stepGuidance) {
            state.activeOverlays.push(stepGuidance);
            console.log(`💡 [TUTORIAL POPUP] Step guidance shown: "${stepGuidance.title}" (${stepGuidance.type}) for step ${nextStep}`);
            
            if (stepGuidance.autoAdvance) {
              console.log(`⏰ [TUTORIAL] Auto-advance in ${stepGuidance.autoAdvance} seconds`);
            }
          } else {
            console.log(`ℹ️ [TUTORIAL] No guidance overlay configured for step: ${nextStep}`);
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
      
      console.log(`⏭️ [TUTORIAL] Skipping to step: ${step}`);
      
      set(state => {
        // Find which sequence this step belongs to
        for (const [sequence, steps] of Object.entries(TUTORIAL_SEQUENCES)) {
          if (steps.includes(step)) {
            state.activeSequence = sequence as TutorialSequence;
            state.currentStep = step;
            state.mode = 'active_sequence';
            console.log(`🎯 [TUTORIAL] Jumped to sequence: ${sequence}, step: ${step}`);
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
      console.log(`🎪 [TUTORIAL POPUP] Showing overlay: "${overlay.title}" (${overlay.type}) - ID: ${overlay.id}`);
      
      if (overlay.position) {
        console.log(`📍 [TUTORIAL POPUP] Overlay position: x=${overlay.position.x}, y=${overlay.position.y}`);
      }
      
      if (overlay.targetElement) {
        console.log(`🎯 [TUTORIAL POPUP] Overlay targets element: ${overlay.targetElement}`);
      }
      
      if (overlay.autoAdvance) {
        console.log(`⏰ [TUTORIAL POPUP] Auto-advance in ${overlay.autoAdvance} seconds`);
      }
      
      set(state => {
        // Remove any existing overlay with same id
        const existingCount = state.activeOverlays.length;
        state.activeOverlays = state.activeOverlays.filter(o => o.id !== overlay.id);
        
        if (existingCount !== state.activeOverlays.length) {
          console.log(`🔄 [TUTORIAL POPUP] Replaced existing overlay with ID: ${overlay.id}`);
        }
        
        // Add new overlay
        state.activeOverlays.push(overlay);
        console.log(`➕ [TUTORIAL POPUP] Active overlays count: ${state.activeOverlays.length}`);
      });
    },

    dismissOverlay: (overlayId: string) => {
      console.log(`❌ [TUTORIAL POPUP] Dismissing overlay: ${overlayId}`);
      
      set(state => {
        const beforeCount = state.activeOverlays.length;
        state.activeOverlays = state.activeOverlays.filter(o => o.id !== overlayId);
        const afterCount = state.activeOverlays.length;
        
        if (beforeCount !== afterCount) {
          console.log(`✅ [TUTORIAL POPUP] Overlay dismissed. Active overlays: ${afterCount}`);
        } else {
          console.log(`⚠️ [TUTORIAL POPUP] Overlay not found: ${overlayId}`);
        }
      });
    },

    dismissAllOverlays: () => {
      const currentCount = get().activeOverlays.length;
      console.log(`🧹 [TUTORIAL POPUP] Dismissing all overlays (${currentCount} active)`);
      
      set(state => {
        state.activeOverlays = [];
      });
      
      console.log(`✅ [TUTORIAL POPUP] All overlays dismissed`);
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