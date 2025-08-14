import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

// Scene types for the game
export type GameScene = 
  | 'hospital'           // Main hospital exploration
  | 'narrative'          // Narrative dialogue with mentors
  | 'challenge'          // Challenge dialogue/activities
  | 'tutorial_activity'  // Tutorial-specific activities (simplified)
  | 'test_activity'      // Test activity for core gameplay development
  | 'home'               // Player's combined home and observatory view
  | 'observatory'        // Legacy: redirects to home (combined view)
  | 'constellation'      // Knowledge constellation view
  | 'lunch-room'         // Hospital social hub with chat bubbles
  | 'transition';        // Loading/transition state

// Scene transition context
export interface SceneContext {
  activityId?: string;
  mentorId?: string;
  roomId?: string;
  dialogueId?: string;
  patientName?: string;  // For tutorial activities
  skipIntro?: boolean;   // For test activities to skip intro phase
  previousScene?: GameScene;
  transitionData?: any;
}

// Scene state
export interface SceneState {
  currentScene: GameScene;
  sceneStack: Array<{ scene: GameScene; context: SceneContext }>;
  isTransitioning: boolean;
  transitionProgress: number;
  context: SceneContext;
}

// Scene store actions
interface SceneActions {
  // Core navigation
  transitionToScene: (scene: GameScene, context?: SceneContext) => Promise<void>;
  setSceneDirectly: (scene: GameScene, context?: SceneContext) => void;
  returnToPrevious: () => Promise<void>;
  clearSceneStack: () => void;
  
  // Specific scene transitions
  enterActivity: (activityId: string, mentorId?: string, roomId?: string) => Promise<void>;
  enterNarrative: (mentorId: string, dialogueId?: string, roomId?: string) => Promise<void>;
  enterChallenge: (activityId: string, mentorId?: string, roomId?: string) => Promise<void>;
  enterTutorialActivity: (patientName: string, mentorId: string, roomId: string) => Promise<void>;
  returnToHospital: () => Promise<void>;
  
  // Transition management
  setTransitionProgress: (progress: number) => void;
  completeTransition: () => void;
}

type SceneStore = SceneState & SceneActions;

// Default state
const initialState: SceneState = {
  currentScene: 'hospital',
  sceneStack: [],
  isTransitioning: false,
  transitionProgress: 0,
  context: {}
};

export const useSceneStore = create<SceneStore>()(
  immer((set, get) => ({
    ...initialState,

    // Core scene transition with animation support
    transitionToScene: async (scene: GameScene, context: SceneContext = {}) => {
      const currentState = get();
      
      console.log(`[SceneStore] ${currentState.currentScene} → ${scene}`);
      
      // Don't transition if already transitioning or same scene
      if (currentState.isTransitioning || currentState.currentScene === scene) {
        console.log('[SceneStore] Transition blocked - already transitioning or same scene');
        return;
      }

      // Push current scene to stack (for back navigation)
      if (currentState.currentScene !== 'transition') {
        set(state => {
          state.sceneStack.push({
            scene: state.currentScene,
            context: state.context
          });
        });
      }

      // Start transition
      set(state => {
        state.isTransitioning = true;
        state.transitionProgress = 0;
        state.currentScene = 'transition';
      });

      // Simulate fade out
      await animateTransition(0, 50, (progress) => {
        set(state => {
          state.transitionProgress = progress;
        });
      });

      // Update scene and context
      set(state => {
        state.currentScene = scene;
        state.context = {
          ...context,
          previousScene: currentState.currentScene
        };
      });
      
      // Scene transition completed

      // Simulate fade in
      await animateTransition(50, 100, (progress) => {
        set(state => {
          state.transitionProgress = progress;
        });
      });

      // Complete transition
      set(state => {
        state.isTransitioning = false;
        state.transitionProgress = 100;
      });
    },

    // Direct scene change without loading animation (for special cases like day-night transition)
    setSceneDirectly: (scene: GameScene, context: SceneContext = {}) => {
      const currentState = get();
      
      console.log(`[SceneStore] ${currentState.currentScene} → ${scene} (direct)`);
      
      // Push current scene to stack (for back navigation) - only if not transition
      if (currentState.currentScene !== 'transition') {
        set(state => {
          state.sceneStack.push({
            scene: state.currentScene,
            context: state.context
          });
        });
      }

      // Set scene directly without animation
      set(state => {
        state.currentScene = scene;
        state.context = {
          ...context,
          previousScene: currentState.currentScene
        };
        state.isTransitioning = false;
        state.transitionProgress = 100;
      });
      
      // Scene set directly without animation
    },

    // Return to previous scene in stack
    returnToPrevious: async () => {
      const { sceneStack, currentScene } = get();
      
      console.log(`[SceneStore] returnToPrevious() from ${currentScene}`);
      
      if (sceneStack.length === 0) {
        console.log('[SceneStore] No previous scene, going to hospital');
        // No previous scene, go to hospital
        await get().returnToHospital();
        return;
      }

      // Pop from stack
      const previous = sceneStack[sceneStack.length - 1];
      
      set(state => {
        state.sceneStack.pop();
      });

      // Transition without adding to stack again
      await get().transitionToScene(previous.scene, previous.context);
    },

    // Clear navigation history
    clearSceneStack: () => {
      set(state => {
        state.sceneStack = [];
      });
    },

    // Activity-specific transitions
    enterActivity: async (activityId: string, mentorId?: string, roomId?: string) => {
      // Determine if this is narrative or challenge based on activity
      // This would connect to your activity data
      const activityType = await determineActivityType(activityId);
      
      if (activityType === 'narrative') {
        await get().enterNarrative(mentorId || 'garcia', activityId, roomId);
      } else {
        await get().enterChallenge(activityId, mentorId, roomId);
      }
    },

    enterNarrative: async (mentorId: string, dialogueId?: string, roomId?: string) => {
      await get().transitionToScene('narrative', {
        mentorId,
        dialogueId,
        roomId
      });
    },

    enterChallenge: async (activityId: string, mentorId?: string, roomId?: string) => {
      await get().transitionToScene('challenge', {
        activityId,
        mentorId,
        roomId
      });
    },

    enterTutorialActivity: async (patientName: string, mentorId: string, roomId: string) => {
      const currentContext = get().context;
      await get().transitionToScene('tutorial_activity', {
        patientName,
        mentorId,
        roomId,
        // Preserve the current dialogue context for when we return
        dialogueId: currentContext.dialogueId
      });
    },

    returnToHospital: async () => {
      console.log('[SceneStore] → hospital (home)');
      
      set(state => {
        state.sceneStack = []; // Clear stack when returning to home
      });
      await get().transitionToScene('hospital', {});
    },

    // Transition helpers
    setTransitionProgress: (progress: number) => {
      set(state => {
        state.transitionProgress = Math.max(0, Math.min(100, progress));
      });
    },

    completeTransition: () => {
      set(state => {
        state.isTransitioning = false;
        state.transitionProgress = 100;
      });
    }
  }))
);

// Animation helper
async function animateTransition(
  from: number, 
  to: number, 
  onProgress: (progress: number) => void
): Promise<void> {
  return new Promise((resolve) => {
    const duration = 300; // 300ms transition
    const startTime = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Eased progress
      const easedProgress = easeInOutCubic(progress);
      const currentValue = from + (to - from) * easedProgress;
      
      onProgress(currentValue);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        resolve();
      }
    };
    
    animate();
  });
}

// Easing function for smooth transitions
function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// Helper to determine activity type (placeholder)
async function determineActivityType(activityId: string): Promise<'narrative' | 'challenge'> {
  // This would connect to your activity data system
  // For now, simple heuristic
  if (activityId.includes('narrative') || activityId.includes('story')) {
    return 'narrative';
  }
  return 'challenge';
}

// Selectors for components
export const sceneSelectors = {
  getCurrentScene: (state: SceneStore) => state.currentScene,
  getIsTransitioning: (state: SceneStore) => state.isTransitioning,
  getTransitionProgress: (state: SceneStore) => state.transitionProgress,
  getContext: (state: SceneStore) => state.context,
  getCanGoBack: (state: SceneStore) => state.sceneStack.length > 0,
  getCurrentMentor: (state: SceneStore) => state.context.mentorId,
  getCurrentActivity: (state: SceneStore) => state.context.activityId
};

// Debug utilities (development only)
if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
  (window as any).__SCENE_STORE_DEBUG__ = {
    getState: () => useSceneStore.getState(),
    transitionTo: (scene: GameScene, context?: SceneContext) => 
      useSceneStore.getState().transitionToScene(scene, context),
    goBack: () => useSceneStore.getState().returnToPrevious(),
    clearStack: () => useSceneStore.getState().clearSceneStack(),
    getCurrentScene: () => useSceneStore.getState().currentScene
  };
} 