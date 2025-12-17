import { useEffect, useRef } from 'react';
import {
  StarIdType,
  SkyHighlightType,
  InteractionType,
  ACTIVITY_POSITIONS,
} from './CombinedHomeScene.constants';

// === STATE FLAGS ===
// Minimal read-only state needed for keyboard decision logic
export interface KeyboardState {
  // View state
  currentView: 'home' | 'sky';
  
  // Comp-sheet state
  compSheetVisible: boolean;
  compSheetPhase: string;
  showAnthroIntro: boolean;
  anthroIntroFrame: number;
  anthroIntroTotalFrames: number;
  showTbiPositioning: boolean;
  showTbiResult: boolean;
  highlightedActivity: number;
  
  // Dialogue state
  showMonologue: boolean;
  currentMonologueLineIndex: number;
  monologueLinesLength: number;
  showPicoDialogue: boolean;
  picoDialogueIndex: number;
  picoDialogueLinesLength: number;
  showPicoBlockingDialogue: boolean;
  picoBlockingDialogueIndex: number;
  picoBlockingDialogueLinesLength: number;
  
  // Interaction state
  showStarDetail: boolean;
  skyHighlight: SkyHighlightType;
  activeInteraction: InteractionType;
  deskXKeyTriggered: boolean;
  xKeyTriggered: boolean;
  picoInteracted: boolean;
  isNearPico: boolean; // Pre-calculated in parent
  
  // Cutscene state
  hasCompletedFirstActivity: boolean;
  hasSeenConstellationCutscene: boolean;
  isPlayingCutscene: boolean;
}

// === ACTIONS ===
// Callbacks for each possible keyboard action
export interface KeyboardActions {
  // Comp-sheet actions
  advanceAnthroIntro: () => void;
  completeAnthroIntro: () => void;
  completeTbiPositioning: () => void;
  completeActivityFromResult: () => void;
  openDesk: () => void;
  selectCompActivity: () => void;
  closeCompSheet: () => void;
  navigateActivity: (direction: 'up' | 'down' | 'left' | 'right') => void;
  
  // Monologue actions
  advanceMonologue: () => void;
  dismissMonologue: () => void;
  
  // Star modal actions
  closeStarModal: () => void;
  openStarModal: (starId: StarIdType) => void;
  
  // Pico actions
  advancePicoBlockingDialogue: () => void;
  dismissPicoBlockingDialogue: () => void;
  advancePicoDialogue: () => void;
  completePicoDialogue: () => void;
  startPicoDialogue: () => void;
  petPico: () => void;
  
  // Telescope actions
  triggerTelescope: () => void;
  returnFromSkyTelescope: () => void;
  
  // Sky view actions
  returnFromSky: () => void;
  
  // Movement actions
  addMovementKey: (key: string) => void;
  removeMovementKey: (key: string) => void;
}

interface UseKeyboardControlsProps {
  state: KeyboardState;
  actions: KeyboardActions;
  enabled?: boolean;
}

export function useKeyboardControls({ state, actions, enabled = true }: UseKeyboardControlsProps) {
  // Track if we've already logged state for debugging
  const lastLogRef = useRef<string>('');
  
  useEffect(() => {
    if (!enabled) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      // === ARROW KEYS ===
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
        e.preventDefault(); // Prevent page scrolling
        
        // Comp-sheet activity navigation
        if (state.compSheetVisible && state.compSheetPhase === 'waiting') {
          const direction = e.key === 'ArrowLeft' ? 'left' :
                           e.key === 'ArrowRight' ? 'right' :
                           e.key === 'ArrowUp' ? 'up' : 'down';
          actions.navigateActivity(direction);
        }
        // Home view: add to movement keys
        else if (state.currentView === 'home') {
          actions.addMovementKey(e.key);
        }
      }
      
      // === X KEY ===
      if (e.key === 'x' || e.key === 'X') {
        // Debug logging (only log when state changes)
        const stateKey = `${state.currentView}-${state.compSheetPhase}-${state.showStarDetail}`;
        if (stateKey !== lastLogRef.current) {
          console.log('[useKeyboardControls] X key pressed', {
            currentView: state.currentView,
            compSheetPhase: state.compSheetPhase,
            showStarDetail: state.showStarDetail,
            activeInteraction: state.activeInteraction,
          });
          lastLogRef.current = stateKey;
        }
        
        // Priority 0a: Advance Anthro intro dialogue
        if (state.showAnthroIntro && state.compSheetPhase === 'intro') {
          if (state.anthroIntroFrame < state.anthroIntroTotalFrames - 1) {
            actions.advanceAnthroIntro();
          } else {
            actions.completeAnthroIntro();
          }
        }
        // Priority 0b: Complete TBI positioning
        else if (state.showTbiPositioning && state.compSheetPhase === 'activity') {
          actions.completeTbiPositioning();
        }
        // Priority 0c: Complete activity from result screen
        else if (state.showTbiResult && state.compSheetPhase === 'result') {
          actions.completeActivityFromResult();
        }
        // Priority 1a: Advance/dismiss monologue
        else if (state.showMonologue && state.currentView === 'sky') {
          if (state.currentMonologueLineIndex < state.monologueLinesLength - 1) {
            actions.advanceMonologue();
          } else {
            actions.dismissMonologue();
          }
        }
        // Priority 1b: Close star modal
        else if (state.showStarDetail) {
          actions.closeStarModal();
        }
        // Priority 2a: Desk interaction
        else if (state.currentView === 'home' && state.activeInteraction === 'desk' && 
                 !state.deskXKeyTriggered && !state.compSheetVisible) {
          actions.openDesk();
        }
        // Priority 2b: Select activity in comp-sheet
        else if (state.compSheetVisible && state.compSheetPhase === 'waiting') {
          actions.selectCompActivity();
        }
        // Priority 2c: Pico blocking dialogue
        else if (state.showPicoBlockingDialogue) {
          if (state.picoBlockingDialogueIndex < state.picoBlockingDialogueLinesLength - 1) {
            actions.advancePicoBlockingDialogue();
          } else {
            actions.dismissPicoBlockingDialogue();
          }
        }
        // Priority 2d: Pico dialogue
        else if (state.showPicoDialogue) {
          if (state.picoDialogueIndex < state.picoDialogueLinesLength - 1) {
            actions.advancePicoDialogue();
          } else {
            actions.completePicoDialogue();
          }
        }
        // Priority 2e: Start Pico dialogue
        else if (state.currentView === 'home' && state.activeInteraction === 'pico' && !state.picoInteracted) {
          actions.startPicoDialogue();
        }
        // Priority 3: Star interaction in sky view
        else if (state.currentView === 'sky' && !state.showStarDetail && 
                 state.skyHighlight !== 'telescope' && !state.showMonologue) {
          if (state.skyHighlight === 'star') {
            actions.openStarModal('star');
          } else {
            const constellationStarIds: StarIdType[] = ['tbi', 'tbi_patient_setup'];
            if (constellationStarIds.includes(state.skyHighlight as StarIdType)) {
              actions.openStarModal(state.skyHighlight as StarIdType);
            }
          }
        }
        // Priority 4: Telescope interaction
        else if (state.currentView === 'home' && state.activeInteraction === 'telescope' && !state.xKeyTriggered) {
          actions.triggerTelescope();
        }
        // Priority 5: Return from sky via telescope
        else if (state.currentView === 'sky' && state.skyHighlight === 'telescope') {
          actions.returnFromSkyTelescope();
        }
      }
      
      // === C KEY ===
      if (e.key === 'c' || e.key === 'C') {
        // Priority 0: Close desk activity (but not during intro/TBI/result phases)
        if (state.compSheetVisible && !state.showAnthroIntro && !state.showTbiPositioning && !state.showTbiResult) {
          actions.closeCompSheet();
        }
        // Priority 1: Return from sky view
        else if (state.currentView === 'sky' && !state.showStarDetail && !state.isPlayingCutscene) {
          actions.returnFromSky();
        }
        // Priority 2: Pet Pico
        else if (state.currentView === 'home' && state.isNearPico) {
          actions.petPico();
        }
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      actions.removeMovementKey(e.key);
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [state, actions, enabled]);
}

// === HELPER: Activity Navigation ===
// Exported for use in action handlers
export function calculateActivityNavigation(
  currentActivity: number,
  direction: 'up' | 'down' | 'left' | 'right'
): number | null {
  const currentPos = ACTIVITY_POSITIONS[currentActivity];
  
  // Direction vector
  const directionX = direction === 'left' ? -1 : direction === 'right' ? 1 : 0;
  const directionY = direction === 'up' ? -1 : direction === 'down' ? 1 : 0;
  
  // Find best target using spatial navigation
  let bestTarget: { id: number; score: number } | null = null;
  
  for (const target of ACTIVITY_POSITIONS) {
    if (target.id === currentActivity) continue;
    
    const dx = target.x - currentPos.x;
    const dy = target.y - currentPos.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Alignment: dot product of direction vector with target vector
    const alignment = (dx * directionX + dy * directionY) / distance;
    
    // Only consider targets in pressed direction (alignment > 0.3)
    if (alignment > 0.3) {
      // Square alignment to favor well-aligned targets
      const score = distance / (alignment * alignment);
      
      if (!bestTarget || score < bestTarget.score) {
        bestTarget = { id: target.id, score };
      }
    }
  }
  
  return bestTarget?.id ?? null;
}

