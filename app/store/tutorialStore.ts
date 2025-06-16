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
}

// Tutorial state interface
interface TutorialState {
  // Core tutorial state
  isActive: boolean;
  currentSequence: TutorialSequence | null;
  currentStep: TutorialStep | null;
  completedSteps: Set<TutorialStep>;
  completedSequences: Set<TutorialSequence>;
  
  // Overlay management
  activeOverlays: TutorialOverlay[];
  overlayHistory: TutorialOverlay[];
  
  // Progress tracking
  sequenceProgress: Record<TutorialSequence, number>; // 0-1 completion percentage
  totalProgress: number; // Overall tutorial completion percentage
  
  // Settings
  tutorialMode: boolean; // Toggle tutorial hints on/off
  skipRemaining: boolean; // Skip all remaining tutorials
  autoAdvance: boolean; // Auto-advance through steps
  
  // Debug and testing
  debugMode: boolean;
  allowStepSkipping: boolean;
}

// Tutorial actions interface
interface TutorialActions {
  // Core tutorial flow
  startTutorial: (sequence: TutorialSequence, step?: TutorialStep) => void;
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
  isActive: false,
  currentSequence: null,
  currentStep: null,
  completedSteps: new Set(),
  completedSequences: new Set(),
  activeOverlays: [],
  overlayHistory: [],
  sequenceProgress: {
    first_day: 0,
    night_phase: 0,
    mentor_relationships: 0,
    advanced_systems: 0
  },
  totalProgress: 0,
  tutorialMode: true, // Default to enabled for new players
  skipRemaining: false,
  autoAdvance: true,
  debugMode: process.env.NODE_ENV === 'development',
  allowStepSkipping: process.env.NODE_ENV === 'development'
};

// Tutorial step sequences for progress calculation
const TUTORIAL_SEQUENCES: Record<TutorialSequence, TutorialStep[]> = {
  first_day: [
    'morning_arrival',
    'first_mentor_intro',
    'hospital_tour',
    'first_educational_activity',
    'insight_mechanic_intro',
    'lunch_dialogue',
    'second_mentor_intro',
    'constellation_preview',
    'first_ability_intro',
    'journal_card_explanation',
    'night_phase_transition',
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
      title: 'Welcome to Your First Day!',
      content: 'Look around the hospital entrance. You\'ll meet Dr. Garcia, your first mentor, who will introduce you to the department.',
      position: { x: 200, y: 100 },
      dismissable: true,
      autoAdvance: 8
    },
    'first_mentor_intro': {
      id: 'guide_first_mentor',
      type: 'spotlight',
      title: 'Meeting Dr. Garcia',
      content: 'Dr. Garcia is the lead radiation oncologist. Pay attention to their teaching style - they focus on patient-centered care and clinical insight.',
      targetElement: '.mentor-portrait, .dialogue-view',
      dismissable: true
    },
    'hospital_tour': {
      id: 'guide_hospital_tour',
      type: 'tooltip',
      title: 'Hospital Navigation',
      content: 'Click on the glowing room indicators to explore different areas. Each room has unique equipment and learning opportunities.',
      position: { x: 300, y: 200 },
      dismissable: true,
      autoAdvance: 6
    },
    'first_educational_activity': {
      id: 'guide_first_activity',
      type: 'modal',
      title: 'Your First Learning Activity',
      content: 'You\'re about to engage in your first educational activity! Answer questions thoughtfully to gain Insight points, which unlock new knowledge in your constellation.',
      dismissable: true
    },
    'insight_mechanic_intro': {
      id: 'guide_insight_mechanic',
      type: 'tooltip',
      title: 'Insight Points System',
      content: 'Insight points (IP) are your learning currency. Earn them by engaging with activities and use them to unlock new knowledge stars.',
      position: { x: 150, y: 50 },
      dismissable: true,
      autoAdvance: 5
    },
    'lunch_dialogue': {
      id: 'guide_lunch_dialogue',
      type: 'tooltip',
      title: 'Cafeteria Interactions',
      content: 'Informal conversations with mentors are just as valuable as formal activities. They build relationships and provide career insights.',
      position: { x: 250, y: 150 },
      dismissable: true
    },
    'second_mentor_intro': {
      id: 'guide_second_mentor',
      type: 'spotlight',
      title: 'Meeting Dr. Quinn',
      content: 'Dr. Quinn heads Treatment Planning and loves the physics behind radiation therapy. They\'ll introduce you to advanced concepts.',
      targetElement: '.mentor-portrait, .dialogue-view',
      dismissable: true
    },
    'constellation_preview': {
      id: 'guide_constellation_preview',
      type: 'modal',
      title: 'Knowledge Constellation Preview',
      content: 'Dr. Quinn just mentioned the Knowledge Constellation - this is where you\'ll visualize and connect the concepts you learn. You\'ll explore it tonight!',
      dismissable: true
    },
    'first_ability_intro': {
      id: 'guide_first_ability',
      type: 'modal',
      title: 'Journal Cards & Abilities',
      content: 'You\'ve received your first ability card! These represent techniques and insights you can apply in future activities. Check your journal tonight to organize them.',
      dismissable: true
    },
    'journal_card_explanation': {
      id: 'guide_journal_explanation',
      type: 'tooltip',
      title: 'Journal System',
      content: 'Your journal is where abilities and insights are stored. During night phases, you can review and organize your learning for maximum effectiveness.',
      position: { x: 200, y: 100 },
      dismissable: true,
      autoAdvance: 7
    },
    'night_phase_transition': {
      id: 'guide_night_transition',
      type: 'modal',
      title: 'Transitioning to Night Phase',
      content: 'Your first day is ending! Tonight you\'ll explore your knowledge constellation, organize your journal, and reflect on what you\'ve learned.',
      dismissable: true
    },
    'third_mentor_intro': {
      id: 'guide_third_mentor',
      type: 'spotlight',
      title: 'Meeting Dr. Kapoor',
      content: 'Dr. Kapoor is your dosimetry and measurement science expert. They emphasize precision and scientific rigor in everything they do.',
      targetElement: '.mentor-portrait, .dialogue-view',
      dismissable: true
    },

    // Night Phase Tutorial Steps
    'observatory_introduction': {
      id: 'guide_observatory',
      type: 'modal',
      title: 'Your Personal Observatory',
      content: 'Welcome to your hillside observatory! This is where you\'ll explore your knowledge constellation and organize your learning each night.',
      dismissable: true
    },
    'constellation_interface': {
      id: 'guide_constellation_interface',
      type: 'tooltip',
      title: 'Constellation Interface',
      content: 'Each glowing star represents a concept you\'ve discovered. Click stars to unlock them using Star Points, or explore connections between related concepts.',
      position: { x: 400, y: 200 },
      dismissable: true
    },
    'star_selection_tutorial': {
      id: 'guide_star_selection',
      type: 'guided_interaction',
      title: 'Select a Star',
      content: 'Try clicking on one of the glowing stars to unlock it. You\'ll need Star Points (SP) which you earn through daily activities.',
      targetElement: '.knowledge-star, .constellation-star',
      dismissable: false,
      actionRequired: { type: 'click', target: '.knowledge-star, .constellation-star' }
    },
    'journal_system_intro': {
      id: 'guide_journal_system',
      type: 'modal',
      title: 'Journal Organization',
      content: 'Your journal contains ability cards and insights from your daily experiences. Organize them strategically to enhance your learning efficiency.',
      dismissable: true
    },
    'card_placement_tutorial': {
      id: 'guide_card_placement',
      type: 'guided_interaction',
      title: 'Organize Your Cards',
      content: 'Try placing an ability card in your journal. You can categorize them by domain or priority to optimize your learning strategy.',
      targetElement: '.journal-card, .ability-card',
      dismissable: false,
      actionRequired: { type: 'click', target: '.journal-card, .ability-card' }
    },
    'phone_call_system': {
      id: 'guide_phone_system',
      type: 'tooltip',
      title: 'Mentor Guidance Calls',
      content: 'Your mentors may call during night phases to provide guidance, encouragement, or additional insights about your learning progress.',
      position: { x: 300, y: 100 },
      dismissable: true,
      autoAdvance: 6
    },
    'mentor_night_guidance': {
      id: 'guide_mentor_guidance',
      type: 'modal',
      title: 'Mentor Support System',
      content: 'Your mentors are here to support your learning journey. Their guidance helps you make connections between concepts and apply knowledge effectively.',
      dismissable: true
    },

    // Advanced Tutorial Steps (minimal for now)
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
        state.isActive = true;
        state.currentSequence = sequence;
        state.currentStep = step || TUTORIAL_SEQUENCES[sequence][0];
        state.skipRemaining = false;
        
        // Clear any existing overlays
        state.activeOverlays = [];
        
        // Show welcome overlay for the sequence
        const welcomeOverlay = {
          id: `welcome_${sequence}`,
          type: 'modal' as const,
          title: `${sequence === 'first_day' ? 'First Day Tutorial' : 
                   sequence === 'night_phase' ? 'Night Phase Tutorial' :
                   sequence === 'mentor_relationships' ? 'Mentor Relationships Tutorial' :
                   'Advanced Systems Tutorial'}`,
          content: `Welcome to the ${sequence.replace(/_/g, ' ')} tutorial sequence! This will guide you through ${
            sequence === 'first_day' ? 'your first day at the hospital, meeting mentors and learning the basics' :
            sequence === 'night_phase' ? 'the knowledge constellation system and journal mechanics' :
            sequence === 'mentor_relationships' ? 'building deeper relationships with your mentors' :
            'advanced gameplay systems and special abilities'
          }. Click Continue to begin!`,
          dismissable: true
        };
        state.activeOverlays.push(welcomeOverlay);
      });
    },

    // Complete a tutorial step and advance
    completeStep: (step: TutorialStep) => {
      set(state => {
        const currentSequence = state.currentSequence;
        if (!currentSequence) return;
        
        // Mark step as completed
        state.completedSteps.add(step);
        
        // Calculate sequence progress
        const sequenceSteps = TUTORIAL_SEQUENCES[currentSequence];
        const completedInSequence = sequenceSteps.filter(s => state.completedSteps.has(s)).length;
        state.sequenceProgress[currentSequence] = completedInSequence / sequenceSteps.length;
        
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
          state.currentSequence = null;
          state.currentStep = null;
          state.isActive = false;
          
          // Show completion overlay
          const completionOverlay = {
            id: `completion_${currentSequence}`,
            type: 'modal' as const,
            title: 'Tutorial Sequence Complete!',
            content: `Congratulations! You've completed the ${currentSequence.replace(/_/g, ' ')} tutorial sequence. You've gained valuable knowledge and can now apply these skills in the game.`,
            dismissable: true
          };
          state.activeOverlays.push(completionOverlay);
        }
        
        // Update total progress
        const totalSteps = Object.values(TUTORIAL_SEQUENCES).flat().length;
        state.totalProgress = state.completedSteps.size / totalSteps;
      });
    },

    // Skip directly to a specific step (debug utility)
    skipToStep: (step: TutorialStep) => {
      if (!get().allowStepSkipping) return;
      
      set(state => {
        // Find which sequence this step belongs to
        for (const [sequence, steps] of Object.entries(TUTORIAL_SEQUENCES)) {
          if (steps.includes(step)) {
            state.currentSequence = sequence as TutorialSequence;
            state.currentStep = step;
            state.isActive = true;
            break;
          }
        }
      });
    },

    // Complete entire tutorial sequence
    completeTutorialSequence: (sequence: TutorialSequence) => {
      set(state => {
        const steps = TUTORIAL_SEQUENCES[sequence];
        steps.forEach(step => state.completedSteps.add(step));
        state.completedSequences.add(sequence);
        state.sequenceProgress[sequence] = 1;
        
        // Update total progress
        const totalSteps = Object.values(TUTORIAL_SEQUENCES).flat().length;
        state.totalProgress = state.completedSteps.size / totalSteps;
        
        // If this was the current sequence, end tutorial
        if (state.currentSequence === sequence) {
          state.currentSequence = null;
          state.currentStep = null;
          state.isActive = false;
        }
      });
    },

    // Skip tutorial sequence without marking as completed
    skipTutorialSequence: (sequence: TutorialSequence) => {
      set(state => {
        if (state.currentSequence === sequence) {
          state.currentSequence = null;
          state.currentStep = null;
          state.isActive = false;
        }
      });
    },

    // Overlay management
    showOverlay: (overlay: TutorialOverlay) => {
      set(state => {
        // Remove any existing overlay with same id
        state.activeOverlays = state.activeOverlays.filter(o => o.id !== overlay.id);
        // Add new overlay
        state.activeOverlays.push(overlay);
        // Add to history
        state.overlayHistory.push(overlay);
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
        state.tutorialMode = true;
        state.skipRemaining = false;
        
        // Show tutorial mode enabled overlay
        const welcomeOverlay = {
          id: 'tutorial_mode_enabled',
          type: 'modal' as const,
          title: 'Tutorial Mode Enabled!',
          content: 'Tutorial mode is now active. You\'ll see helpful hints and guidance as you explore the game. Click the "🎓 Start Tutorial" button to begin the guided first day experience, or use the tutorial controls (bottom left) to test different features.',
          dismissable: true
        };
        state.activeOverlays.push(welcomeOverlay);
      });
    },

    disableTutorialMode: () => {
      set(state => {
        state.tutorialMode = false;
        state.activeOverlays = [];
        state.isActive = false;
      });
    },

    toggleTutorialMode: () => {
      const current = get().tutorialMode;
      if (current) {
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
        state.sequenceProgress = {
          first_day: 0,
          night_phase: 0,
          mentor_relationships: 0,
          advanced_systems: 0
        };
        state.totalProgress = 0;
        state.currentSequence = null;
        state.currentStep = null;
        state.isActive = false;
        state.activeOverlays = [];
        state.overlayHistory = [];
      });
    },

    skipAllRemaining: () => {
      set(state => {
        state.skipRemaining = true;
        state.tutorialMode = false;
        state.isActive = false;
        state.activeOverlays = [];
      });
    },

    getTutorialProgress: () => {
      return get().totalProgress;
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
        state.debugMode = true;
        state.allowStepSkipping = true;
      });
    },

    disableDebugMode: () => {
      set(state => {
        state.debugMode = false;
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
  getIsActive: (state: TutorialStore) => state.isActive,
  getCurrentSequence: (state: TutorialStore) => state.currentSequence,
  getCurrentStep: (state: TutorialStore) => state.currentStep,
  getActiveOverlays: (state: TutorialStore) => state.activeOverlays,
  getTutorialMode: (state: TutorialStore) => state.tutorialMode,
  getTotalProgress: (state: TutorialStore) => state.totalProgress,
  getSequenceProgress: (state: TutorialStore, sequence: TutorialSequence) => 
    state.sequenceProgress[sequence],
  getDebugMode: (state: TutorialStore) => state.debugMode,
  canSkipSteps: (state: TutorialStore) => state.allowStepSkipping
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

  const isActive = useTutorialStore(tutorialSelectors.getIsActive);
  const currentStep = useTutorialStore(tutorialSelectors.getCurrentStep);
  const currentSequence = useTutorialStore(tutorialSelectors.getCurrentSequence);
  const tutorialMode = useTutorialStore(tutorialSelectors.getTutorialMode);

  return {
    // State
    isActive,
    currentStep,
    currentSequence,
    tutorialMode,

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
      active: useTutorialStore.getState().isActive,
      sequence: useTutorialStore.getState().currentSequence,
      step: useTutorialStore.getState().currentStep,
      mode: useTutorialStore.getState().tutorialMode,
      progress: useTutorialStore.getState().totalProgress
    })
  };
} 