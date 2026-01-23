import { useEffect, useRef } from 'react';
import {
  StarIdType,
  SkyHighlightType,
  InteractionType,
  ACTIVITY_POSITIONS,
} from './CombinedHomeScene.constants';
import { SfxId } from '@/app/audio/audio.constants';
import { audioManager } from '@/app/audio/AudioManager';

// === STATE FLAGS ===
// Minimal read-only state needed for keyboard decision logic
export interface KeyboardState {
  // View state
  currentView: 'home' | 'sky';
  
  // Comp-sheet state
  compSheetVisible: boolean;
  compSheetPhase: string;
  showAnthroIntro: boolean;
  anthroDialogueIndex: number;
  anthroDialogueLinesLength: number;
  // Book/journal state
  bookVisible: boolean;
  showTbiPositioning: boolean;
  showTbiResult: boolean;
  tbiResultRevealed: boolean;
  tbiResultPassed: boolean;
  tbiResultDialogueIndex: number;
  tbiResultDialogueLinesLength: number; // Length of current result dialogue (fail: 2, pass: 4)
  tbiBeamAnimating: boolean;
  rewardItemsClaiming: boolean; // true during reward claim animation (blocks input)
  journalCollected: boolean; // true after book is first closed (journal in corner)
  highlightedActivity: number;
  
  // Tab navigation state
  currentTab: 'activities' | 'shop';
  tabFocused: boolean;
  highlightedShopItem: number;
  
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
  // Book/journal actions
  openBook: () => void;
  closeBook: () => void;
  shakeBook: () => void;
  openBookFromCorner: () => void; // ESC key opens book when journal is collected
  completeTbiPositioning: () => void;
  advanceResultDialogue: () => void;
  completeResultDialogue: () => void;
  openDesk: () => void;
  selectCompActivity: () => void;
  closeCompSheet: () => void;
  navigateActivity: (direction: 'up' | 'down' | 'left' | 'right') => void;
  
  // Tab navigation actions
  focusTabs: () => void;
  unfocusTabs: () => void;
  switchTab: (tab: 'activities' | 'shop') => void;
  navigateShopItem: (direction: 'left' | 'right') => void;
  
  // Monologue actions
  advanceMonologue: () => void;
  dismissMonologue: () => void;
  
  // Star modal actions
  closeStarModal: () => void;
  openStarModal: (starId: StarIdType) => void;
  
  // Pico actions
  dismissPetDescription: () => void;
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

// Helper function to play sound effects
const playSfx = (id: SfxId) => {
  audioManager.playSfx(id);
};

export function useKeyboardControls({ state, actions, enabled = true }: UseKeyboardControlsProps) {
  // Track if we've already logged state for debugging
  const lastLogRef = useRef<string>('');
  
  // Anti-mashing: Track last input time for cooldown
  const lastInputTime = useRef(0);
  const INPUT_COOLDOWN = 400; // ms - prevents rapid fire through dialogue/animations
  
  // Anti-mashing: Define phases that block ALL input (transition periods)
  const BLOCKING_PHASES = [
    'booting',
    'fading_to_black',
    'intro_fading_to_black',
    'result_fading_to_black',
    'fading_from_black',
    'transitioning',
  ];
  
  useEffect(() => {
    if (!enabled) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      // === ARROW KEYS ===
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
        e.preventDefault(); // Prevent page scrolling
        
        // Block arrow keys during TBI beam animation
        if (state.tbiBeamAnimating) {
          console.log('[useKeyboardControls] Arrow keys blocked during beam animation');
          return;
        }
        
        // Book shake when trying to flip pages (left/right arrows only)
        if (state.bookVisible && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
          console.log('[useKeyboardControls] Book shake - no more pages');
          playSfx('ui_denied');
          actions.shakeBook();
          return;
        }
        
        // Comp-sheet navigation during waiting phase
        if (state.compSheetVisible && state.compSheetPhase === 'waiting') {
          const direction = e.key === 'ArrowLeft' ? 'left' :
                           e.key === 'ArrowRight' ? 'right' :
                           e.key === 'ArrowUp' ? 'up' : 'down';
          
          // Handle tab-focused navigation
          if (state.tabFocused) {
            if (direction === 'up') {
              // Switch to activities tab
              if (state.currentTab !== 'activities') {
                playSfx('ui_hover');
                actions.switchTab('activities');
              }
            } else if (direction === 'down') {
              // Switch to shop tab (only if shop is unlocked)
              if (state.currentTab !== 'shop' && state.hasCompletedFirstActivity) {
                playSfx('ui_hover');
                actions.switchTab('shop');
              } else if (!state.hasCompletedFirstActivity) {
                // Play denied sound when trying to access locked shop
                playSfx('ui_denied');
              }
            } else if (direction === 'right') {
              // Unfocus tabs and enter content area
              playSfx('ui_hover');
              actions.unfocusTabs();
            }
            return;
          }
          
          // Handle shop item navigation
          if (state.currentTab === 'shop') {
            if (direction === 'left') {
              if (state.highlightedShopItem === 0) {
                // At leftmost shop item, focus tabs
                playSfx('ui_hover');
                actions.focusTabs();
              } else {
                playSfx('ui_hover');
                actions.navigateShopItem('left');
              }
            } else if (direction === 'right') {
              if (state.highlightedShopItem < 2) {
                playSfx('ui_hover');
                actions.navigateShopItem('right');
              }
            }
            return;
          }
          
          // Handle activity navigation (existing logic)
          // Check if navigating left from leftmost activities should focus tabs
          if (direction === 'left') {
            const leftmostActivities = [0, 2]; // top-left and bottom-left
            if (leftmostActivities.includes(state.highlightedActivity)) {
              // Focus the tab sidebar
              playSfx('ui_hover');
              actions.focusTabs();
              return;
            }
          }
          
          playSfx('ui_hover');
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
        
        // Anti-mashing: Block input during transition phases
        if (BLOCKING_PHASES.includes(state.compSheetPhase)) {
          console.log('[useKeyboardControls] Input blocked during transition phase:', state.compSheetPhase);
          return;
        }
        
        // Anti-mashing: Cooldown timer for rapid-fire prevention
        const now = Date.now();
        const timeSinceLastInput = now - lastInputTime.current;
        
        // Priority 0a: Advance Anthro intro dialogue (with cooldown)
        // Skip if book is visible (handled separately by book close handler)
        if (state.showAnthroIntro && state.compSheetPhase === 'intro' && !state.bookVisible) {
          if (timeSinceLastInput < INPUT_COOLDOWN) {
            console.log(`[useKeyboardControls] Anthro intro: cooldown active (${timeSinceLastInput}ms < ${INPUT_COOLDOWN}ms)`);
            return;
          }
          
          lastInputTime.current = now;
          playSfx('ui_confirm');
          
          // At dialogue index 2, open book instead of advancing
          if (state.anthroDialogueIndex === 2) {
            console.log('[useKeyboardControls] Opening book at dialogue 2');
            actions.openBook();
          } else if (state.anthroDialogueIndex < state.anthroDialogueLinesLength - 1) {
            actions.advanceAnthroIntro();
          } else {
            actions.completeAnthroIntro();
          }
        }
        // Priority 0b: Complete TBI positioning (with cooldown)
        else if (state.showTbiPositioning && state.compSheetPhase === 'activity') {
          // Block if beam animation is already playing
          if (state.tbiBeamAnimating) {
            console.log('[useKeyboardControls] TBI positioning: blocked during beam animation');
            return;
          }
          
          if (timeSinceLastInput < INPUT_COOLDOWN) {
            console.log(`[useKeyboardControls] TBI positioning: cooldown active (${timeSinceLastInput}ms < ${INPUT_COOLDOWN}ms)`);
            return;
          }
          
          lastInputTime.current = now;
          playSfx('ui_confirm');
          actions.completeTbiPositioning();
        }
        // Priority 0c: Result dialogue screen (gated behind reveal animation) - X key for both pass and fail
        else if (state.showTbiResult && state.compSheetPhase === 'result') {
          // Block input until mask reveal animation completes AND result is revealed
          if (!state.tbiResultRevealed) {
            console.log('[useKeyboardControls] TBI result: blocked until mask reveal completes');
            return;
          }
          
          // Block input during reward claim animation
          if (state.rewardItemsClaiming) {
            console.log('[useKeyboardControls] TBI result: blocked during reward claim animation');
            return;
          }
          
          if (timeSinceLastInput < INPUT_COOLDOWN) {
            console.log(`[useKeyboardControls] TBI result: cooldown active (${timeSinceLastInput}ms < ${INPUT_COOLDOWN}ms)`);
            return;
          }
          
          // X key handles both pass and fail cases
          lastInputTime.current = now;
          playSfx('ui_confirm');
          if (state.tbiResultDialogueIndex < state.tbiResultDialogueLinesLength - 1) {
            actions.advanceResultDialogue();
          } else {
            actions.completeResultDialogue(); // Restart positioning (fail) or complete activity (pass)
          }
        }
        // Priority 1a: Advance/dismiss monologue
        else if (state.showMonologue && state.currentView === 'sky') {
          playSfx('ui_confirm');
          if (state.currentMonologueLineIndex < state.monologueLinesLength - 1) {
            actions.advanceMonologue();
          } else {
            actions.dismissMonologue();
          }
        }
        // Priority 1b: Close star modal
        else if (state.showStarDetail) {
          playSfx('ui_confirm');
          actions.closeStarModal();
        }
        // Priority 2a: Desk interaction
        else if (state.currentView === 'home' && state.activeInteraction === 'desk' && 
                 !state.deskXKeyTriggered && !state.compSheetVisible) {
          playSfx('ui_confirm');
          actions.openDesk();
        }
        // Priority 2b: Select activity in comp-sheet
        else if (state.compSheetVisible && state.compSheetPhase === 'waiting') {
          playSfx('ui_confirm');
          actions.selectCompActivity();
        }
        // Priority 2c: Pico blocking dialogue
        else if (state.showPicoBlockingDialogue) {
          playSfx('ui_confirm');
          if (state.picoBlockingDialogueIndex < state.picoBlockingDialogueLinesLength - 1) {
            actions.advancePicoBlockingDialogue();
          } else {
            actions.dismissPicoBlockingDialogue();
          }
        }
        // Priority 2d: Pico dialogue
        else if (state.showPicoDialogue) {
          playSfx('ui_confirm');
          if (state.picoDialogueIndex < state.picoDialogueLinesLength - 1) {
            actions.advancePicoDialogue();
          } else {
            actions.completePicoDialogue();
          }
        }
        // Priority 2e: Start Pico dialogue
        else if (state.currentView === 'home' && state.activeInteraction === 'pico' && !state.picoInteracted) {
          playSfx('ui_confirm');
          actions.startPicoDialogue();
        }
        // Priority 3: Star interaction in sky view
        else if (state.currentView === 'sky' && !state.showStarDetail && 
                 state.skyHighlight !== 'telescope' && !state.showMonologue) {
          playSfx('ui_confirm');
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
          playSfx('ui_confirm');
          actions.triggerTelescope();
        }
        // Priority 5: Return from sky via telescope
        else if (state.currentView === 'sky' && state.skyHighlight === 'telescope') {
          playSfx('ui_confirm');
          actions.returnFromSkyTelescope();
        }
      }
      
      // === C KEY ===
      if (e.key === 'c' || e.key === 'C') {
        // Priority 0: Close book (whenever visible, not just during anthro intro)
        if (state.bookVisible) {
          console.log('[useKeyboardControls] C key - closing book');
          playSfx('ui_decline');
          actions.closeBook();
          return;
        }
        // Priority 1: Close desk activity (but not during intro/TBI/result phases)
        if (state.compSheetVisible && !state.showAnthroIntro && !state.showTbiPositioning && !state.showTbiResult) {
          playSfx('ui_decline');
          actions.closeCompSheet();
        }
        // Priority 2: Return from sky view
        else if (state.currentView === 'sky' && !state.showStarDetail && !state.isPlayingCutscene) {
          playSfx('ui_decline');
          actions.returnFromSky();
        }
        // Priority 3: Pet Pico
        else if (state.currentView === 'home' && state.isNearPico) {
          playSfx('ui_confirm');
          actions.petPico();
        }
      }
      
      // === ESCAPE KEY ===
      if (e.key === 'Escape') {
        // Open book from corner when journal is collected
        if (state.journalCollected && !state.bookVisible) {
          console.log('[useKeyboardControls] ESC - opening book from corner');
          playSfx('ui_confirm');
          actions.openBookFromCorner();
        }
        // Close book if it's open
        else if (state.bookVisible) {
          console.log('[useKeyboardControls] ESC - closing book');
          playSfx('ui_decline');
          actions.closeBook();
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

