'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useGameStore } from '@/app/store/gameStore';
import { useCharacterStore } from '@/app/store/characterStore';

import ParallaxRenderer from './ParallaxRenderer';
import StarDetailModal from '@/app/components/ui/StarDetailModal';

// Import keyboard controls hook
import { useKeyboardControls, calculateActivityNavigation, KeyboardState, KeyboardActions } from './useKeyboardControls';

// Import debug modes hook
import { useDebugModes, DebugModeSetters } from './useDebugModes';

// Import player movement hook
import { usePlayerMovement, PlayerMovementCallbacks } from './usePlayerMovement';

// Import constants and types
import {
  StarIdType,
  SkyHighlightType,
  InteractionType,
  SpeechBubblesState,
  PicoState,
  CompActivityState,
  CutsceneState,
  InteractionUIState,
  DEFAULT_SPEECH_BUBBLES,
  DEFAULT_PICO_STATE,
  DEFAULT_COMP_ACTIVITY,
  DEFAULT_CUTSCENE,
  DEFAULT_INTERACTION_UI,
  PICO_POSITION,
  TELESCOPE_POSITION,
  DESK_POSITION,
  PRIMAREUS_POSITION,
  PLAYER_START_POSITION,
  GROUND_FLOOR_Y,
  SECOND_FLOOR_Y,
  PROXIMITY_THRESHOLD,
  PICO_LEFT_EXTENSION,
  // TBI Anthro positioning system
  TBI_ANTHRO_MIN_X,
  TBI_ANTHRO_MAX_X,
  TBI_ANTHRO_START_X,
  TBI_ANTHRO_STEP,
  TBI_ANTHRO_Y,
  TBI_ANTHRO_TOTAL_FRAMES,
  getPositionIndexFromX,
  STAR_NAMES,
  MONOLOGUE_LINES,
  PICO_DIALOGUE_LINES,
  PICO_BLOCKING_DIALOGUE,
  ANTHRO_INTRO_DIALOGUE,
  ANTHRO_FAIL_DIALOGUE,
  ANTHRO_PASS_DIALOGUE,
  ACTIVITY_POSITIONS,
  WALK_SPEED,
  CLIMB_SPEED,
  FRAME_INTERVAL,
  WALK_SPRITE_FRAME_SPEED,
  IDLE_SPRITE_FRAME_SPEED,
  CLIMB_SPRITE_FRAME_SPEED,
  BUBBLE_FRAME_SPEED,
  CLIMB_X_THRESHOLD,
  CLIMB_DISTANCE,
  CLIMB_X_TOLERANCE,
  CLIMB_RIGHT_EXTENSION,
  FLOOR_TOLERANCE,
  SLOW_SCROLL_DURATION,
  // TBI Result system
  TBI_POSITION_RESULTS,
  TBI_SEGMENT_BAR_POSITIONS,
  TBI_SEGMENT_INDICATOR_POSITIONS,
  TBI_MASK_POSITION,
  TBI_RESULT_BASE_POSITION,
  TBI_RESULT_SLAB_POSITION,
  TBI_MASK_TOTAL_FRAMES,
  // Anthro intro animation
  ANTHRO_INTRO_WAVE_START,
  ANTHRO_INTRO_WAVE_END,
  ANTHRO_INTRO_TRANSFORM_START,
  ANTHRO_INTRO_TRANSFORM_END,
  ANTHRO_INTRO_SLAB_IDLE_START,
  ANTHRO_INTRO_SLAB_IDLE_END,
  // TBI Beam animation
  TBI_BEAM_TOTAL_FRAMES,
  TBI_BEAM_INTRO_FRAMES,
  TBI_BEAM_LOOP_START_FRAME,
  TBI_BEAM_LOOP_END_FRAME,
  TBI_BEAM_LOOP_COUNT,
  TBI_BEAM_FRAME_DURATION,
  getIndicatorFrameFromBarFrame,
  evaluateTbiPositioning,
  getCompTabsFrame,
} from './CombinedHomeScene.constants';

// Import all styled components and constants from styles file
import {
  HOME_INTERNAL_WIDTH,
  HOME_INTERNAL_HEIGHT,
  JUMBO_ASSET_HEIGHT,
  DEBUG_BOUNDARIES,
  FIRST_FLOOR_BOUNDS,
  SECOND_FLOOR_BOUNDS,
  JumboViewport,
  StarSprite,
  StarNameLabel,
  BoomEffectOverlay,
  CinematicLetterbox,
  CelestialLayer,
  ScrollingContent,
  ForegroundLayer,
  CharacterSprite,
  ArrowKeysSprite,
  XKeySprite,
  CKeySprite,
  UpArrowSprite,
  DownArrowSprite,
  ContextLabel,
  SkyInteractionIndicator,
  SkyKeyRow,
  SkyXKeySprite,
  SkyCKeySprite,
  SkyActionLabel,
  DeskInteractionIndicator,
  DeskKeyRow,
  DeskXKeySprite,
  DeskCKeySprite,
  DeskActionLabel,
  TbiPositioningIndicator,
  TbiKeyRow,
  LeftRightArrowKeysSprite,
  TbiXKeySprite,
  TbiActionLabel,
  PlayerMonologue,
  PlayerSpeakerLabel,
  PlayerContinueHint,
  PicoSprite,
  SpeechBubbleSprite,
  PicoDialogueText,
  PicoSpeakerLabel,
  PicoContinueHint,
  HeartBubbleSprite,
  LockedMessageBox,
  // Book/Journal system
  BookPromptContainer,
  JournalIcon,
  BookXKeySprite,
  BookPromptLabel,
  BookPopupContainer,
  BookInstructionBar,
  BookKeyRow,
  BookCKeySprite,
  BookArrowKeysSprite,
  BookActionLabel,
  NoMorePagesMessage,
  RewardItemsContainer,
  RewardItem,
  RewardCount,
  FundingSprite,
  PageSprite,
  RewardXKeySprite,
  RewardClaimLabel,
  JournalFlyingIcon,
  JournalCornerIcon,
  CompMonitorLayer,
  CompScreenLayer,
  CompTabsLayer,
  CompOptionsLayer,
  CompOptionsStaticLayer,
  CompShopOptionsLayer,
  CompShopPopupsLayer,
  CompSheetBackdrop,
  ActivityClickRegion,
  AnthroIntroContainer,
  AnthroIntroLayer,
  AnthroDialogueText,
  AnthroSpeakerLabel,
  AnthroDialogueContinueHint,
  TbiPositioningLayer,
  TbiAnthroSprite,
  TbiBeamOnLayer,
  // TBI Modular Result System
  TbiResultDataLayer,
  TbiColorBar,
  TbiColorBarSector1,
  TbiPositionIndicator,
  TbiResultBase,
  TbiResultAnthro,
  TbiResultMask,
  BoundaryLine,
  BoundaryLabel,
  BoundaryFloorIndicator,
  IntroFadeOverlay,
} from './CombinedHomeScene.styles';

// Import audio system
import { useAudioInit, useVoiceover } from '@/app/audio/useAudio';

export default function CombinedHomeScene() {
// Initialize audio system (backup in case not initialized on title screen)
  useAudioInit();
  const { playVoiceover, stopVoiceover } = useVoiceover();

  const {
    hasCompletedFirstActivity,
    hasSeenConstellationCutscene,
    setHasCompletedFirstActivity,
    setHasSeenConstellationCutscene
  } = useGameStore();
  
  // Get custom character sprite sheet and voice type (if created)
  const { spriteSheet: customSpriteSheet, character } = useCharacterStore();
  const playerVoiceType = character.voiceType;
  
  // Removed hoveredArea state - no longer needed without tooltips
  const [showStarDetail, setShowStarDetail] = useState(false);
  const [activeStarId, setActiveStarId] = useState<StarIdType>('star'); // Track which star modal is open
  
  // Jumbo screen scroll state
  const [scrollPosition, setScrollPosition] = useState(-(JUMBO_ASSET_HEIGHT - HOME_INTERNAL_HEIGHT)); // Start at bottom (home view)
  const [currentView, setCurrentView] = useState<'home' | 'sky'>('home');
  const [transitionDuration, setTransitionDuration] = useState(0.8); // Default transition duration in seconds
  
  // Tutorial star state - new 19-frame sprite system
  const [tutorialStarFrame, setTutorialStarFrame] = useState(11); // Start with highlighted sparkle (frame 11) - home view default
  const [isRevealAnimating, setIsRevealAnimating] = useState(false);
  const [isPingPongActive, setIsPingPongActive] = useState(false);
  const [starUnlocked, setStarUnlocked] = useState(false); // Track if star has been unlocked (prevents loop restart)
  
  // Sky view highlight system - tracks which element is highlighted
  const [skyHighlight, setSkyHighlight] = useState<SkyHighlightType>('star'); // Default to star highlighted
  
  
  // Player monologue for ??? star inspection
  const [inspectionCount, setInspectionCount] = useState(0); // 0 = not started, 1 = first time, 2 = second time, 3+ = completed
  const [currentMonologueLineIndex, setCurrentMonologueLineIndex] = useState(0);
  const [showMonologue, setShowMonologue] = useState(false);
  
  
  // === GROUPED STATE: Speech Bubbles ===
  const [speechBubbles, setSpeechBubbles] = useState<SpeechBubblesState>(DEFAULT_SPEECH_BUBBLES);
  
  // Helper to update a specific bubble
  const updateBubble = useCallback((key: keyof SpeechBubblesState, updates: Partial<SpeechBubblesState[keyof SpeechBubblesState]>) => {
    setSpeechBubbles(prev => ({ ...prev, [key]: { ...prev[key], ...updates } }));
  }, []);
  
  // === INTRO FADE STATE ===
  // Fade from black when scene first loads
  const [introFadeVisible, setIntroFadeVisible] = useState(true);
  
  // Fade out the intro overlay after a brief delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setIntroFadeVisible(false);
    }, 100);
    return () => clearTimeout(timer);
  }, []);
  
  // Keys pressed ref for keyboard controls (shared between keyboard controls and player movement)
  const keysPressed = useRef<Set<string>>(new Set());
  
  // === GROUPED STATE: Pico Character ===
  const [pico, setPico] = useState<PicoState>(DEFAULT_PICO_STATE);
  const picoAnimationRef = useRef<NodeJS.Timeout | null>(null);
  
  // Helper to update pico state
  const updatePico = useCallback((updates: Partial<PicoState>) => {
    setPico(prev => ({ ...prev, ...updates }));
  }, []);
  
  // === PLAYER MOVEMENT HOOK ===
  const playerMovementCallbacks: PlayerMovementCallbacks = useMemo(() => ({
    onClimbBlocked: () => {
      console.log('[CombinedHomeScene] Player climbing without talking - showing remote dialogue');
      // Just trigger the dialogue - don't block climbing
      if (!pico.hasShownFirstBlockingMessage) {
        updatePico({ blockingDialogueIndex: 0, showBlockingDialogue: true, isTalking: true, hasShownFirstBlockingMessage: true });
      }
      // If already shown, don't repeat
    },
  }), [pico.hasShownFirstBlockingMessage, updatePico]);

  const {
    state: playerState,
    setters: playerSetters,
  } = usePlayerMovement({
    keysPressed,
    currentView,
    picoInteracted: pico.interacted,
    isClimbBlocked: pico.showBlockingDialogue,
    hasShownFirstBlockingMessage: pico.hasShownFirstBlockingMessage,
    isDialogueActive: pico.showDialogue || pico.showBlockingDialogue,
    callbacks: playerMovementCallbacks,
  });
  
  // Destructure for convenience throughout component
  const { position: playerPosition, direction: playerDirection, frame: playerFrame, isWalking: playerIsWalking, isClimbing: playerIsClimbing } = playerState;
  const { setPosition: setPlayerPosition, setDirection: setPlayerDirection, setIsWalking: setPlayerIsWalking, setIsClimbing: setPlayerIsClimbing } = playerSetters;
  
  // Get player name from character store (fallback to empty string if not set)
  const playerName = useCharacterStore((state) => state.character.name) || 'Player';
  
  // === GROUPED STATE: Interaction UI ===
  const [interactionUI, setInteractionUI] = useState<InteractionUIState>(DEFAULT_INTERACTION_UI);
  const picoFrameCountRef = useRef(0);
  const picoFrameTickRef = useRef(0);
  
  // Helper to update interaction UI state
  const updateInteractionUI = useCallback((updates: Partial<InteractionUIState>) => {
    setInteractionUI(prev => ({ ...prev, ...updates }));
  }, []);
  
  
  // Tutorial sprite states
  const [arrowKeysVisible, setArrowKeysVisible] = useState(true); // Show for first 10 seconds
  const [arrowKeysFrame, setArrowKeysFrame] = useState(1); // 1-8: all up, right, left, up, down, all pushed, all up highlighted, all pushed highlighted
  const [xKeyTriggered, setXKeyTriggered] = useState(false); // Track if telescope X key interaction was completed (for cutscene trigger)
  const [deskXKeyTriggered, setDeskXKeyTriggered] = useState(false); // Track if desk X key was used
  const [deskXKeyEnabled, setDeskXKeyEnabled] = useState(false); // Track if desk X key system is enabled (star must be viewed first)
  const sceneStartTimeRef = useRef<number>(Date.now()); // Track when scene started
  
  // === GROUPED STATE: Computer/Desk Activity System ===
  const [compActivity, setCompActivity] = useState<CompActivityState>(DEFAULT_COMP_ACTIVITY);
  const compSheetAnimationRef = useRef<NodeJS.Timeout | null>(null);
  const anthroIntroAnimationRef = useRef<NodeJS.Timeout | null>(null);
  const tbiAnthroAnimationRef = useRef<NodeJS.Timeout | null>(null);
  const tbiResultAnimationRef = useRef<NodeJS.Timeout | null>(null);
  const tbiResultAnthroAnimationRef = useRef<NodeJS.Timeout | null>(null);
  const [showLockedMessage, setShowLockedMessage] = useState(false);
  const lockedMessageTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Helper to update comp activity state
  const updateCompActivity = useCallback((updates: Partial<CompActivityState>) => {
    setCompActivity(prev => ({ ...prev, ...updates }));
  }, []);
  
  // Desk activity key indicator frames (always highlighted frame 3)
  const deskXKeyFrame = 1; // Unhighlighted by default (highlights on press)
  const deskCKeyFrame = 1; // Unhighlighted by default (highlights on press)
  
  // TBI positioning key indicator frame (responds to arrow key input)
  const [tbiArrowKeysFrame, setTbiArrowKeysFrame] = useState(1); // 1=neither, 2=right, 3=left, 4=both
  
  // === GROUPED STATE: Constellation Cutscene ===
  const [cutscene, setCutscene] = useState<CutsceneState>(DEFAULT_CUTSCENE);
  
  // Helper to update cutscene state
  const updateCutscene = useCallback((updates: Partial<CutsceneState>) => {
    setCutscene(prev => ({ ...prev, ...updates }));
  }, []);
  
  // Removed: Tiny star orbital state (no longer needed without HDR star)
  
  // Pre-generate random star positions for cutscene (3-6 stars, localized around Primareus)
  const randomCutsceneStars = useMemo(() => {
    const count = Math.floor(Math.random() * 4) + 3; // 3-6 stars
    const stars = [];
    const spreadRadius = 120; // How far stars can appear from Primareus center
    
    for (let i = 0; i < count; i++) {
      // Random angle and distance from Primareus
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * spreadRadius;
      
      stars.push({
        x: PRIMAREUS_POSITION.x + Math.cos(angle) * distance,
        y: PRIMAREUS_POSITION.y + Math.sin(angle) * distance,
        frame: 2 + Math.floor(Math.random() * 3), // Frames 2-4 (sparkle animation)
        opacity: 0.5 + Math.random() * 0.5, // Random starting opacity (0.5-1.0)
        frameOffset: Math.random() * 3, // Random offset for frame animation (0-3)
        opacityOffset: Math.random() * Math.PI * 2, // Random offset for opacity oscillation (0-2π)
      });
    }
    return stars;
  }, []); // Empty dependency array = only generate once
  
  // === KEYBOARD STATE (for useKeyboardControls hook) ===
  // Pre-calculate Pico proximity for keyboard handler
  const picoHorizontalOffset = playerPosition.x - PICO_POSITION.x;
  const picoDistance = Math.abs(picoHorizontalOffset);
  const picoInteractionRange = picoHorizontalOffset < 0 
    ? (PROXIMITY_THRESHOLD / 2) + PICO_LEFT_EXTENSION 
    : (PROXIMITY_THRESHOLD / 2);
  const isNearPico = picoDistance < picoInteractionRange;
  
  const keyboardState: KeyboardState = useMemo(() => ({
    currentView,
    compSheetVisible: compActivity.visible,
    compSheetPhase: compActivity.phase,
    showAnthroIntro: compActivity.anthroIntroVisible,
    anthroDialogueIndex: compActivity.anthroDialogueIndex,
    anthroDialogueLinesLength: ANTHRO_INTRO_DIALOGUE.length,
    bookVisible: compActivity.bookVisible,
    showTbiPositioning: compActivity.tbiPositioningVisible,
    showTbiResult: compActivity.tbiResultVisible,
    tbiResultRevealed: compActivity.tbiResultRevealed,
    tbiResultPassed: compActivity.tbiResultPassed,
    tbiResultDialogueIndex: compActivity.tbiResultDialogueIndex,
    tbiResultDialogueLinesLength: compActivity.tbiResultPassed ? ANTHRO_PASS_DIALOGUE.length : ANTHRO_FAIL_DIALOGUE.length,
    tbiBeamAnimating: compActivity.tbiBeamAnimating,
    rewardItemsClaiming: compActivity.rewardItemsClaiming,
    journalCollected: compActivity.journalCollected,
    highlightedActivity: compActivity.highlightedActivity,
    currentTab: compActivity.currentTab,
    tabFocused: compActivity.tabFocused,
    highlightedShopItem: compActivity.highlightedShopItem,
    showMonologue,
    currentMonologueLineIndex,
    monologueLinesLength: MONOLOGUE_LINES.length,
    showPicoDialogue: pico.showDialogue,
    picoDialogueIndex: pico.dialogueIndex,
    picoDialogueLinesLength: PICO_DIALOGUE_LINES.length,
    showPicoBlockingDialogue: pico.showBlockingDialogue,
    picoBlockingDialogueIndex: pico.blockingDialogueIndex,
    picoBlockingDialogueLinesLength: PICO_BLOCKING_DIALOGUE.length,
    showStarDetail,
    skyHighlight,
    activeInteraction: interactionUI.active,
    deskXKeyTriggered,
    xKeyTriggered,
    picoInteracted: pico.interacted,
    isNearPico,
    hasCompletedFirstActivity,
    hasSeenConstellationCutscene,
    isPlayingCutscene: cutscene.isPlaying,
  }), [
    currentView, compActivity, showMonologue,
    currentMonologueLineIndex, pico, showStarDetail, skyHighlight,
    interactionUI.active, deskXKeyTriggered, xKeyTriggered, isNearPico,
    hasCompletedFirstActivity, hasSeenConstellationCutscene, cutscene.isPlaying,
  ]);
  
  // === KEYBOARD ACTIONS (callbacks for useKeyboardControls hook) ===
  const keyboardActions: KeyboardActions = useMemo(() => ({
    // Comp-sheet actions
    advanceAnthroIntro: () => {
      const nextIndex = compActivity.anthroDialogueIndex + 1;
      console.log('[CombinedHomeScene] Advancing anthro dialogue', nextIndex);
      // Switch to idle animation after first dialogue (was waving)
      if (compActivity.anthroDialogueIndex === 0) {
        updateCompActivity({ 
          anthroDialogueIndex: nextIndex,
          anthroAnimPhase: 'idle',
          anthroIntroFrame: 0
        });
      } else if (nextIndex === 5) {
        // Advancing to "SUPER SLAB MODE!" - trigger transformation animation
        console.log('[CombinedHomeScene] Triggering SUPER SLAB MODE transformation');
        updateCompActivity({ 
          anthroDialogueIndex: nextIndex,
          anthroAnimPhase: 'transforming',
          anthroIntroFrame: ANTHRO_INTRO_TRANSFORM_START
        });
      } else {
        updateCompActivity({ anthroDialogueIndex: nextIndex });
      }
      // Play voiceover for the new dialogue line
      // Note: index 3 ('anthro_journal_tip') has no voiceover yet - will be skipped
      // Index 5 ('anthro_slab_mode') has no voiceover yet - will be skipped
      const anthroIntroVoiceovers = ['anthro_hello', 'anthro_description', 'anthro_how_it_works', 'anthro_journal_tip', 'anthro_after_page', 'anthro_slab_mode', 'anthro_directions'] as const;
      if (nextIndex < anthroIntroVoiceovers.length && anthroIntroVoiceovers[nextIndex] !== 'anthro_journal_tip' && anthroIntroVoiceovers[nextIndex] !== 'anthro_slab_mode') {
        playVoiceover(anthroIntroVoiceovers[nextIndex]);
      }
    },
    completeAnthroIntro: () => {
      console.log('[CombinedHomeScene] Intro complete, fading to TBI');
      updateCompActivity({ phase: 'intro_fading_to_black' });
    },
    // Book/journal actions
    openBook: () => {
      console.log('[CombinedHomeScene] Opening book');
      updateCompActivity({ bookVisible: true });
    },
    closeBook: () => {
      console.log('[CombinedHomeScene] Closing book');
      const isFirstClose = !compActivity.journalCollected;
      
      // Close book
      updateCompActivity({ bookVisible: false });
      
      // First-time close: advance dialogue to journal tip and animate journal to corner
      if (isFirstClose) {
        console.log('[CombinedHomeScene] First book close - showing journal tip dialogue');
        updateCompActivity({ 
          anthroDialogueIndex: 3,
          journalCornerAnimating: true,
        });
        // Note: No voiceover for journal tip line yet (index 3)
        
        // After animation (500ms) + hold (3000ms), mark journal as collected
        // Journal stays visible at corner for 3 seconds before transitioning to permanent icon
        setTimeout(() => {
          updateCompActivity({ 
            journalCornerAnimating: false,
            journalCollected: true,
          });
        }, 3500);
      }
    },
    shakeBook: () => {
      console.log('[CombinedHomeScene] Shaking book - no more pages');
      // Trigger shake animation and show error message
      updateCompActivity({ bookShaking: true, showNoMorePages: true });
      // Reset shake after animation completes (300ms)
      setTimeout(() => {
        updateCompActivity({ bookShaking: false });
      }, 300);
      // Hide error message after a bit longer (1s)
      setTimeout(() => {
        updateCompActivity({ showNoMorePages: false });
      }, 1000);
    },
    openBookFromCorner: () => {
      console.log('[CombinedHomeScene] Opening book from corner (ESC)');
      updateCompActivity({ bookVisible: true });
    },
    completeTbiPositioning: () => {
      console.log('[CombinedHomeScene] TBI positioning complete, starting beam animation');
      // Stop any playing voiceover (anthro directions, etc.)
      stopVoiceover();
      // Start beam animation overlay
      updateCompActivity({ 
        tbiBeamVisible: true, 
        tbiBeamFrame: 0, 
        tbiBeamLoopCount: 0, 
        tbiBeamAnimating: true 
      });
    },
    advanceResultDialogue: () => {
      const currentIndex = compActivity.tbiResultDialogueIndex;
      const nextIndex = currentIndex + 1;
      console.log('[CombinedHomeScene] Advancing result dialogue', nextIndex);
      
      // Special case: when advancing FROM index 2 (reward message) in pass dialogue
      // Trigger claiming animation before advancing
      if (compActivity.tbiResultPassed && currentIndex === 2 && !compActivity.rewardItemsClaiming) {
        console.log('[CombinedHomeScene] Triggering reward claim animation');
        updateCompActivity({ rewardItemsClaiming: true });
        
        // After animation completes, advance dialogue and hide rewards
        setTimeout(() => {
          updateCompActivity({ 
            tbiResultDialogueIndex: nextIndex,
            rewardItemsVisible: false,
            rewardItemsClaiming: false,
          });
          // Play voiceover for dialogue 3
          playVoiceover('anthro_wrap_up');
        }, 500);
        return;
      }
      
      // Normal dialogue advancement
      updateCompActivity({ tbiResultDialogueIndex: nextIndex });
      
      // Show reward items when advancing TO index 2 in pass dialogue
      if (compActivity.tbiResultPassed && nextIndex === 2) {
        updateCompActivity({ rewardItemsVisible: true });
      }
      
      // Play voiceover for the new dialogue line
      if (compActivity.tbiResultPassed) {
        const passVoiceovers = ['anthro_great_job', 'anthro_explanation', 'anthro_rewards', 'anthro_wrap_up'] as const;
        if (nextIndex < passVoiceovers.length) {
          playVoiceover(passVoiceovers[nextIndex]);
        }
      } else {
        const failVoiceovers = ['anthro_dont_short_me', 'anthro_try_again'] as const;
        if (nextIndex < failVoiceovers.length) {
          playVoiceover(failVoiceovers[nextIndex]);
        }
      }
    },
    completeResultDialogue: () => {
      console.log('[CombinedHomeScene] Completing result dialogue');
      // Stop any playing voiceover (anthro result feedback, etc.)
      stopVoiceover();
      if (!compActivity.tbiResultPassed) {
        // Failed - restart positioning
        console.log('[CombinedHomeScene] Failed - restarting TBI positioning');
        updateCompActivity({ phase: 'intro_fading_to_black' });
        setTimeout(() => {
          updateCompActivity({
            tbiResultVisible: false,
            tbiResultRevealed: false,
            tbiResultMaskFrame: 0,
            tbiResultAnthroFrame: 38, // Reset slab idle to start
            tbiResultPassed: false,
            tbiResultDialogueIndex: 0,
            tbiPositioningVisible: true,
            tbiAnthroX: TBI_ANTHRO_START_X,
            tbiAnthroFrame: 8, // Start at slab idle (frames 8-15)
            tbiBeamVisible: false,
            tbiBeamFrame: 0,
            tbiBeamLoopCount: 0,
            tbiBeamAnimating: false,
            phase: 'fading_from_black',
          });
        }, 350);
      } else {
        // Passed - complete activity
        console.log('[CombinedHomeScene] Passed - completing activity');
        handleActivityComplete();
      }
    },
    openDesk: () => {
      console.log('[CombinedHomeScene] Opening desk comp-sheet');
      updateInteractionUI({ xKeyFrame: 3 });
      setTimeout(() => {
        setDeskXKeyTriggered(true);
        updateInteractionUI({ active: null });
        updateCompActivity({
          visible: true,
          phase: 'booting',
          optionsFrame: 1,
          highlightedActivity: 0,
          currentTab: 'activities',
          tabFocused: false,
          highlightedShopItem: 0,
        });
      }, 150);
    },
    selectCompActivity: () => {
      console.log('[CombinedHomeScene] Selecting activity', compActivity.highlightedActivity);
      
      // Only allow activity 0 (TBI module) to be selected
      if (compActivity.highlightedActivity === 0) {
        updateCompActivity({ selectedActivity: compActivity.highlightedActivity, phase: 'transitioning' });
      } else {
        // Activities 1-4 are locked - show message
        console.log('[CombinedHomeScene] Activity locked:', compActivity.highlightedActivity);
        
        // Clear any existing timeout
        if (lockedMessageTimeoutRef.current) {
          clearTimeout(lockedMessageTimeoutRef.current);
        }
        
        // Show locked message
        setShowLockedMessage(true);
        
        // Hide after 2 seconds
        lockedMessageTimeoutRef.current = setTimeout(() => {
          setShowLockedMessage(false);
        }, 2000);
      }
    },
    closeCompSheet: () => {
      console.log('[CombinedHomeScene] Closing desk activity');
      handleActivityComplete();
    },
    navigateActivity: (direction) => {
      const newActivity = calculateActivityNavigation(compActivity.highlightedActivity, direction);
      if (newActivity !== null) {
        console.log(`[CombinedHomeScene] Activity navigation: ${compActivity.highlightedActivity} → ${newActivity}`);
        updateCompActivity({ highlightedActivity: newActivity });
      }
    },
    
    // Tab navigation actions
    focusTabs: () => {
      console.log('[CombinedHomeScene] Focusing tab sidebar');
      updateCompActivity({ tabFocused: true });
    },
    unfocusTabs: () => {
      console.log('[CombinedHomeScene] Unfocusing tab sidebar, entering content area');
      updateCompActivity({ tabFocused: false });
    },
    switchTab: (tab) => {
      console.log(`[CombinedHomeScene] Switching tab to: ${tab}`);
      updateCompActivity({ 
        currentTab: tab,
        // Reset content selection when switching tabs
        highlightedActivity: tab === 'activities' ? 0 : compActivity.highlightedActivity,
        highlightedShopItem: tab === 'shop' ? 0 : compActivity.highlightedShopItem,
      });
    },
    navigateShopItem: (direction) => {
      const newItem = direction === 'left' 
        ? Math.max(0, compActivity.highlightedShopItem - 1)
        : Math.min(2, compActivity.highlightedShopItem + 1);
      console.log(`[CombinedHomeScene] Shop navigation: ${compActivity.highlightedShopItem} → ${newItem}`);
      updateCompActivity({ highlightedShopItem: newItem });
    },
    
    // Monologue actions
    advanceMonologue: () => {
      console.log('[CombinedHomeScene] Advancing monologue line');
      setCurrentMonologueLineIndex(prev => prev + 1);
    },
    dismissMonologue: () => {
      console.log('[CombinedHomeScene] Closing monologue');
      setShowMonologue(false);
      setSkyHighlight('star');
    },
    
    // Star modal actions
    closeStarModal: () => {
      console.log('[CombinedHomeScene] Closing star modal');
      handleCloseStarDetail();
    },
    openStarModal: (starId) => {
      console.log(`[CombinedHomeScene] Opening star modal: ${starId}`);
      setActiveStarId(starId);
      setShowStarDetail(true);
    },
    
    // Pico actions
    advancePicoBlockingDialogue: () => {
      console.log('[CombinedHomeScene] Advancing blocking dialogue');
      const newIndex = pico.blockingDialogueIndex + 1;
      // Play player voiceover when reaching line index 2 (player's response)
      if (newIndex === 2) {
        playVoiceover(playerVoiceType === 'feminine' ? 'player_fem_pico' : 'player_masc_pico');
      }
      updatePico({ blockingDialogueIndex: newIndex });
    },
    dismissPicoBlockingDialogue: () => {
      console.log('[CombinedHomeScene] Dismissing remote dialogue');
      updatePico({ showBlockingDialogue: false, isTalking: false });
      setTimeout(() => updatePico({ blockingDialogueIndex: 0 }), 250);
    },
    advancePicoDialogue: () => {
      console.log('[CombinedHomeScene] Advancing Pico dialogue');
      const newIndex = pico.dialogueIndex + 1;
      // Play player voiceover when reaching line index 2 (player's response)
      if (newIndex === 2) {
        playVoiceover(playerVoiceType === 'feminine' ? 'player_fem_pico' : 'player_masc_pico');
      }
      updatePico({ dialogueIndex: newIndex });
    },
    completePicoDialogue: () => {
      console.log('[CombinedHomeScene] Pico dialogue complete');
      updatePico({ showDialogue: false, interacted: true, isTalking: false });
      setTimeout(() => updatePico({ dialogueIndex: 0 }), 250);
    },
    startPicoDialogue: () => {
      console.log('[CombinedHomeScene] Starting Pico dialogue');
      updateInteractionUI({ xKeyFrame: 3 });
      setTimeout(() => {
        updateBubble('pico', { visible: false });
        updatePico({ showDialogue: true, dialogueIndex: 0, isTalking: true });
      }, 150);
    },
    petPico: () => {
      // Only allow petting if not already petted this playthrough
      if (pico.hasPetted) {
        console.log('[CombinedHomeScene] Pico already petted this playthrough');
        return;
      }
      
      console.log('[CombinedHomeScene] Petting Pico - starting heart animation');
      updateInteractionUI({ cKeyFrame: 3 });
      setTimeout(() => {
        // Start the heart float animation (CSS handles the animation)
        updatePico({ hasPetted: true, heartAnimating: true });
      }, 150);
    },
    dismissPetDescription: () => {
      // No longer needed - heart animation auto-completes
      console.log('[CombinedHomeScene] dismissPetDescription called (no-op)');
    },
    
    // Telescope actions
    triggerTelescope: () => {
      const shouldPlayCutscene = hasCompletedFirstActivity && !hasSeenConstellationCutscene;
      console.log(`[CombinedHomeScene] Telescope triggered - ${shouldPlayCutscene ? 'CUTSCENE' : 'slow scroll'}`);
      
      updateInteractionUI({ xKeyFrame: 3 });
      setTimeout(() => {
        updateInteractionUI({ active: null });
        setXKeyTriggered(true);
        
        if (shouldPlayCutscene) {
          updateCutscene({ isScrolling: true });
        } else {
          setSkyHighlight(hasSeenConstellationCutscene ? 'tbi' : 'star');
        }
        
        const slowDuration = SLOW_SCROLL_DURATION;
        setTransitionDuration(slowDuration);
        
        setTimeout(() => {
          scrollToSkySlowly(slowDuration);
          
          if (shouldPlayCutscene) {
            setTimeout(() => {
              console.log('[CombinedHomeScene] Starting constellation cutscene');
              updateCutscene({ isScrolling: false, isPlaying: true });
              setHasSeenConstellationCutscene(true);
            }, slowDuration * 1000);
          }
          
          setTimeout(() => {
            setTransitionDuration(0.8);
          }, slowDuration * 1000);
        }, 100);
      }, 150);
    },
    returnFromSkyTelescope: () => {
      console.log('[CombinedHomeScene] Returning from sky via telescope');
      const slowDuration = SLOW_SCROLL_DURATION;
      setTransitionDuration(slowDuration);
      
      setTimeout(() => {
        setScrollPosition(-(JUMBO_ASSET_HEIGHT - HOME_INTERNAL_HEIGHT));
        setTimeout(() => {
          setCurrentView('home');
          setXKeyTriggered(false);
          setTransitionDuration(0.8);
        }, slowDuration * 1000);
      }, 100);
    },
    
    // Sky view actions
    returnFromSky: () => {
      console.log('[CombinedHomeScene] Returning from sky view');
      const slowDuration = SLOW_SCROLL_DURATION;
      setTransitionDuration(slowDuration);
      setScrollPosition(-225);
      
      setTimeout(() => {
        setCurrentView('home');
        setXKeyTriggered(false);
        setTransitionDuration(0.8);
      }, slowDuration * 1000);
    },
    
    // Movement actions
    addMovementKey: (key) => keysPressed.current.add(key),
    removeMovementKey: (key) => keysPressed.current.delete(key),
  }), [
    compActivity, pico, hasCompletedFirstActivity, hasSeenConstellationCutscene,
    updateCompActivity, updatePico, updateInteractionUI, updateBubble, updateCutscene,
  ]);
  
  // === USE KEYBOARD CONTROLS HOOK ===
  useKeyboardControls({ state: keyboardState, actions: keyboardActions });
  
  // === HOME SCALING SYSTEM ===
  // Calculate scale to fit 640x360 home into viewport while maintaining aspect ratio
  useEffect(() => {
    let resizeTimeout: NodeJS.Timeout;
    
    const updateHomeScale = () => {
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      const scaleX = viewportWidth / HOME_INTERNAL_WIDTH;
      const scaleY = viewportHeight / HOME_INTERNAL_HEIGHT;
      const homeScale = Math.min(scaleX, scaleY) * 1; // 90% to add margin
      
      // Set CSS custom property for home scaling
      document.documentElement.style.setProperty('--home-scale', homeScale.toString());
      
      // Scale calculation: ${homeScale.toFixed(3)} (${viewportWidth}x${viewportHeight} → ${HOME_INTERNAL_WIDTH}x${HOME_INTERNAL_HEIGHT})
    };
    
    // Debounced resize handler to prevent rapid scale updates
    const debouncedResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(updateHomeScale, 100);
    };
    
    updateHomeScale(); // Initial calculation
    window.addEventListener('resize', debouncedResize);
    
    return () => {
      window.removeEventListener('resize', debouncedResize);
      clearTimeout(resizeTimeout);
    };
  }, []);

  // === CONSTELLATION CUTSCENE ORCHESTRATION ===
  useEffect(() => {
    if (!cutscene.isPlaying) return;
    
    console.log('[CombinedHomeScene] Starting constellation cutscene sequence...');
    
    // Phase 1: Stars appearing (0-2 seconds) - gradual appearance with pulsation
    updateCutscene({ phase: 'stars-appearing', stars: randomCutsceneStars });
    
    // Phase 2: Building tension (2-5 seconds) - faster pulsation
    setTimeout(() => {
      console.log('[CombinedHomeScene] Cutscene: Building tension...');
      updateCutscene({ phase: 'building-tension' });
    }, 2000);
    
    // Phase 3: Boom effect! (5-5.5 seconds) - screen flash and pulse
    setTimeout(() => {
      console.log('[CombinedHomeScene] Cutscene: BOOM!');
      updateCutscene({ phase: 'boom', showBoomEffect: true });
      
      // Hide boom effect after 500ms
      setTimeout(() => {
        updateCutscene({ showBoomEffect: false });
      }, 500);
    }, 5000);
    
    // Phase 4: Stars disappear, final constellation appears (5.5-6.5 seconds)
    setTimeout(() => {
      console.log('[CombinedHomeScene] Cutscene: Revealing final constellation...');
      
      // Set up the constellation (TBI planet at center + orbiting moons for subtopics)
      const createMoon = (id: string, offsetX: number, offsetY: number) => {
        const x = PRIMAREUS_POSITION.x + offsetX;
        const y = PRIMAREUS_POSITION.y + offsetY;
        const angle = Math.atan2(offsetY, offsetX);
        const distance = Math.sqrt(offsetX * offsetX + offsetY * offsetY);
        return { id, x, y, frame: 0, angle, distance, parentId: 'tbi' };
      };
      
      const initialBodies = [
        { id: 'tbi', x: PRIMAREUS_POSITION.x, y: PRIMAREUS_POSITION.y, frame: 0 },
        createMoon('tbi_patient_setup', -20, 0),
      ];
      
      updateCutscene({ 
        stars: [], 
        phase: 'final-constellation', 
        showFinalConstellation: true,
        constellationBodies: initialBodies,
      });
      
      // Animate through frames 0-2 and land on final frames
      let animationFrame = 0;
      const animationInterval = setInterval(() => {
        animationFrame++;
        
        if (animationFrame <= 2) {
          setCutscene(prev => ({
            ...prev,
            constellationBodies: prev.constellationBodies.map(star => ({ ...star, frame: animationFrame }))
          }));
        } else {
          setCutscene(prev => ({
            ...prev,
            constellationBodies: prev.constellationBodies.map(star => ({
              ...star,
              frame: star.id === 'tbi' ? 2 : 0
            }))
          }));
          clearInterval(animationInterval);
        }
      }, 200);
    }, 5500);
    
    // Phase 5: Complete - allow navigation (6.5+ seconds)
    setTimeout(() => {
      console.log('[CombinedHomeScene] Cutscene: Complete!');
      updateCutscene({ phase: 'complete', isPlaying: false, starOpacity: 1 });
      setSkyHighlight('tbi');
    }, 6500);
    
  }, [cutscene.isPlaying, randomCutsceneStars, updateCutscene]);

  // === CUTSCENE ??? STAR OPACITY ANIMATION ===
  useEffect(() => {
    if (!cutscene.isPlaying) return;
    
    const speed = cutscene.phase === 'building-tension' ? 100 : 200;
    let opacityCounter = 0;
    
    const interval = setInterval(() => {
      opacityCounter++;
      const opacityPhase = (opacityCounter * 0.1) % (Math.PI * 2);
      const newOpacity = 0.3 + 0.7 * Math.abs(Math.sin(opacityPhase));
      updateCutscene({ starOpacity: newOpacity });
    }, speed);
    
    return () => clearInterval(interval);
  }, [cutscene.isPlaying, cutscene.phase, updateCutscene]);

  // === CONSTELLATION ORBITAL ANIMATION (3D EFFECT) ===
  useEffect(() => {
    if (!cutscene.showFinalConstellation) return;
    
    const ORBIT_SPEED = 0.008; // Radians per frame (slower = more majestic)
    const ELLIPSE_RATIO = 0.5; // Vertical compression for 3D perspective (0.5 = flattened ellipse)
    const MIN_SCALE = 0.7; // Minimum scale when star is farthest (back of orbit)
    const MAX_SCALE = 1.3; // Maximum scale when star is closest (front of orbit)
    const MIN_OPACITY = 0.6; // Minimum opacity when star is farthest
    const MAX_OPACITY = 1.0; // Maximum opacity when star is closest
    
    const interval = setInterval(() => {
      setCutscene(prev => {
        // Create lookup map for planet positions
        const planetPositions = new Map<string, { x: number; y: number }>();
        prev.constellationBodies.forEach(body => {
          if (!body.parentId) {
            planetPositions.set(body.id, { x: body.x, y: body.y });
          }
        });
        
        const updatedBodies = prev.constellationBodies.map(body => {
          // Skip bodies without orbital properties (planets)
          if (!body.angle || !body.distance || !body.parentId) {
            const isHighlighted = skyHighlightRef.current === body.id;
            const planetZIndex = isHighlighted ? 100 : 3;
            return { ...body, zIndex: planetZIndex };
          }
          
          const parentPos = planetPositions.get(body.parentId);
          if (!parentPos) {
            console.warn(`[Orbital Animation] Parent planet "${body.parentId}" not found for moon "${body.id}"`);
            return body;
          }
          
          const newAngle = body.angle + ORBIT_SPEED;
          const newX = parentPos.x + Math.cos(newAngle) * body.distance;
          const newY = parentPos.y + Math.sin(newAngle) * body.distance * ELLIPSE_RATIO;
          const zDepth = Math.sin(newAngle);
          const scale = MIN_SCALE + ((zDepth + 1) / 2) * (MAX_SCALE - MIN_SCALE);
          const opacity = MIN_OPACITY + ((zDepth + 1) / 2) * (MAX_OPACITY - MIN_OPACITY);
          const isParentHighlighted = skyHighlightRef.current === body.parentId;
          const zIndex = isParentHighlighted 
            ? (zDepth < 0 ? 100 : 102)
            : (zDepth < 0 ? 2 : 3);
          
          return { ...body, angle: newAngle, x: newX, y: newY, scale, opacity, zIndex };
        });
        
        return { ...prev, constellationBodies: updatedBodies };
      });
    }, 16); // ~60fps
    
    return () => clearInterval(interval);
  }, [cutscene.showFinalConstellation]);

  // === REMOVED: TINY STAR ORBITAL ANIMATION ===
  // (Previously orbited around HDR star, no longer needed in planet-and-moons system)



  const handleCloseStarDetail = () => {
    setShowStarDetail(false);

    // If closing ??? star modal, show monologue immediately (no delay to prevent UI flicker)
    if (activeStarId === 'star') {
      // Increment inspection count and reset to first line
      setInspectionCount(prev => prev + 1);
      setCurrentMonologueLineIndex(0);
      setShowMonologue(true);
      // Play "not sure" voiceover using player's selected voice
      playVoiceover(playerVoiceType === 'feminine' ? 'player_fem_desk' : 'player_masc_desk');
    }
  };

  const handleStarUnlock = (newFrame: number) => {
    // Sync the zoomed-out star with the modal unlock
    setTutorialStarFrame(newFrame);
    setStarUnlocked(true);
    
    // Stop any running shimmer animation
    if (pingPongIntervalRef.current) {
      console.log('[CombinedHomeScene] 🛑 Stopping shimmer animation due to unlock');
      clearInterval(pingPongIntervalRef.current);
      pingPongIntervalRef.current = null;
    }
    setIsPingPongActive(false);
    
    console.log('[CombinedHomeScene] Star unlocked from modal, syncing to frame:', newFrame);
  };

  const handleStarViewed = () => {
    console.log('[CombinedHomeScene] Star viewed - enabling desk interaction');
    setDeskXKeyEnabled(true);
  };
  
  // TBI Positioning viewer - close and complete activity
  const handleActivityComplete = () => {
    console.log('[CombinedHomeScene] Activity complete - closing comp-sheet');
    
    // Mark first activity as completed (for constellation cutscene trigger)
    if (!hasCompletedFirstActivity) {
      console.log('[CombinedHomeScene] First activity completed - enabling constellation cutscene');
      setHasCompletedFirstActivity(true);
    }
    
    // Clear any ongoing result animation
    if (tbiResultAnimationRef.current) {
      clearTimeout(tbiResultAnimationRef.current);
      tbiResultAnimationRef.current = null;
    }
    
    // Clear locked message timeout
    if (lockedMessageTimeoutRef.current) {
      clearTimeout(lockedMessageTimeoutRef.current);
      lockedMessageTimeoutRef.current = null;
    }
    setShowLockedMessage(false);
    
    // Hide everything and reset
    updateCompActivity({ visible: false, tbiPositioningVisible: false, tbiResultVisible: false });
    
    // Reset all activity state
    setTimeout(() => {
      updateCompActivity({
        tbiAnthroX: TBI_ANTHRO_START_X,
        tbiAnthroFrame: 8, // Start at slab idle (frames 8-15)
        tbiResultMaskFrame: 0,
        tbiResultAnthroFrame: 38, // Reset slab idle to start
        tbiResultRevealed: false,
        tbiResultPassed: false,
        // Reset beam animation state
        tbiBeamVisible: false,
        tbiBeamFrame: 0,
        tbiBeamLoopCount: 0,
        tbiBeamAnimating: false,
        phase: 'idle',
        optionsFrame: 1,
        selectedActivity: null,
        highlightedActivity: 0,
        // Reset tab/shop state
        currentTab: 'activities',
        tabFocused: false,
        highlightedShopItem: 0,
        shopOptionsFrame: 1,
        shopPopupsFrame: 1,
      });
      setDeskXKeyTriggered(false); // Reset so desk can be used again
    }, 300);
  };

  // Scroll functions for jumbo screen navigation
  const scrollToSky = () => {
    console.log('[CombinedHomeScene] Scrolling to sky view - parallax enabled');
    setScrollPosition(0); // Top of the asset (sky view)
    setCurrentView('sky');
  };

  const scrollToSkySlowly = (duration: number) => {
    console.log('[CombinedHomeScene] Scrolling to sky view SLOWLY - parallax enabled');
    setScrollPosition(0); // Top of the asset (sky view)
    // Delay view change until after the slow transition completes
    setTimeout(() => {
      setCurrentView('sky');
    }, duration * 1000); // Convert seconds to milliseconds
  };

  const scrollToHome = () => {
    console.log('[CombinedHomeScene] Scrolling to home view - parallax enabled');
    setScrollPosition(-(JUMBO_ASSET_HEIGHT - HOME_INTERNAL_HEIGHT)); // Bottom of the asset (home view)
    setCurrentView('home');
  };


  // Tutorial: First-time home visit guidance (prevent multiple executions)
  const hasProcessedRef = useRef(false);
  const hasShownWelcomeRef = useRef(false);
  const pingPongIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Ref to track base animation cycle (0, 1, 2 for frames 2, 3, 4)
  const sparkleAnimationCycle = useRef(0);
  
  // Refs to track current view, sky highlight state, and cutscene state for interval access
  const currentViewRef = useRef(currentView);
  const skyHighlightRef = useRef(skyHighlight);
  const isPlayingCutsceneRef = useRef(cutscene.isPlaying);
  const isCutsceneScrollingRef = useRef(cutscene.isScrolling);
  const constellationStarsRef = useRef(cutscene.constellationBodies);
  
  // Update refs when states change
  useEffect(() => {
    currentViewRef.current = currentView;
    skyHighlightRef.current = skyHighlight;
    isPlayingCutsceneRef.current = cutscene.isPlaying;
    isCutsceneScrollingRef.current = cutscene.isScrolling;
    constellationStarsRef.current = cutscene.constellationBodies;
  }, [currentView, skyHighlight, cutscene.isPlaying, cutscene.isScrolling, cutscene.constellationBodies]);
  
  // === DEBUG MODES HOOK ===
  const debugModeSetters: DebugModeSetters = {
    setPlayerPosition,
    setPlayerDirection,
    setPlayerIsWalking,
    setDeskXKeyEnabled,
    setArrowKeysVisible,
    setHasCompletedFirstActivity,
    setHasSeenConstellationCutscene,
    setShowFinalConstellation: (val: boolean) => updateCutscene({ showFinalConstellation: val }),
    setConstellationStars: (stars: typeof cutscene.constellationBodies) => updateCutscene({ constellationBodies: stars }),
    setSkyHighlight,
    setXKeyTriggered,
    hasShownWelcomeRef,
  };
  useDebugModes(debugModeSetters);
  
  // Star sparkle animation - cycles through sparkle frames (NO highlighting - speech bubble handles that)
  useEffect(() => {
    // Start sparkle loop (only if star hasn't been unlocked yet)
    if (!isPingPongActive && !isRevealAnimating && !starUnlocked) {
      console.log('[CombinedHomeScene] ⭐ Starting sparkle animation!');
      setIsPingPongActive(true);
      
      // Creating star animation interval
      pingPongIntervalRef.current = setInterval(() => {
        // Cycle through 0, 1, 2
        sparkleAnimationCycle.current = (sparkleAnimationCycle.current + 1) % 3;
        
        // Always use base sparkle frames (2, 3, 4) - no highlighting
        // Speech bubble will indicate selection instead
        const frame = sparkleAnimationCycle.current + 2;
        
        setTutorialStarFrame(frame);
      }, 400); // 400ms per frame for clear progression
    }
  }, [isPingPongActive, isRevealAnimating, starUnlocked]);
  
  // === STAR SPEECH BUBBLE VISIBILITY ===
  // Show star speech bubble in sky view when star is visible, hide after first inspection
  useEffect(() => {
    updateBubble('star', {
      visible: currentView === 'sky' && 
        !cutscene.showFinalConstellation && 
        !cutscene.isPlaying && 
        !showStarDetail && 
        !showMonologue && 
        !deskXKeyEnabled
    });
  }, [currentView, cutscene.showFinalConstellation, cutscene.isPlaying, showStarDetail, showMonologue, deskXKeyEnabled, updateBubble]);
  
  // === STAR PROXIMITY DETECTION (for speech bubble highlighting in sky view) ===
  useEffect(() => {
    if (currentView !== 'sky' || !speechBubbles.star.visible) {
      updateBubble('star', { highlighted: false });
      return;
    }
    
    // In sky view, highlight when star is selected in navigation
    updateBubble('star', { highlighted: skyHighlight === 'star' });
  }, [currentView, skyHighlight, speechBubbles.star.visible, updateBubble]);
  
  // === STAR SPEECH BUBBLE ANIMATION ===
  useEffect(() => {
    if (!speechBubbles.star.visible) return;
    
    let bubbleFrameCount = 1;
    
    const animateBubble = () => {
      bubbleFrameCount = (bubbleFrameCount % 4) + 1; // Cycle 1-4
      updateBubble('star', { frame: bubbleFrameCount });
    };
    
    const bubbleInterval = setInterval(animateBubble, BUBBLE_FRAME_SPEED);
    
    return () => clearInterval(bubbleInterval);
  }, [speechBubbles.star.visible, updateBubble]);
  
  // Comp-sheet options layer animation - show highlighted frame based on hover/highlight state
  useEffect(() => {
    if (compActivity.phase === 'waiting' && compActivity.currentTab === 'activities') {
      console.log('[CombinedHomeScene] Comp-sheet waiting - updating options layer frame');
      
      // Check if any activity is highlighted (keyboard navigation only) and tabs not focused
      if (compActivity.highlightedActivity !== null && !compActivity.tabFocused) {
        // Show highlighted frame (2-6 based on activity index 0-4)
        const activityIndex = compActivity.highlightedActivity;
        updateCompActivity({ optionsFrame: 2 + activityIndex });
      } else {
        // No highlight or tabs focused - show frame 1 (none highlighted)
        updateCompActivity({ optionsFrame: 1 });
      }
    }
  }, [compActivity.phase, compActivity.highlightedActivity, compActivity.currentTab, compActivity.tabFocused, updateCompActivity]);
  
  // Anthro intro animation - phase-based (waving, transforming, slab_idle, idle)
  // Frames 0-7: body idle, 8-15: waving, 16-37: transformation, 38-42: slab idle
  useEffect(() => {
    if (!compActivity.anthroIntroVisible) {
      // Clean up animation when intro is hidden
      if (anthroIntroAnimationRef.current) {
        clearInterval(anthroIntroAnimationRef.current);
        anthroIntroAnimationRef.current = null;
      }
      return;
    }
    
    const phase = compActivity.anthroAnimPhase;
    const frame = compActivity.anthroIntroFrame;
    
    anthroIntroAnimationRef.current = setInterval(() => {
      if (phase === 'raising') {
        // Legacy support - transition to waving immediately
        updateCompActivity({ anthroIntroFrame: ANTHRO_INTRO_WAVE_START, anthroAnimPhase: 'waving' });
      } else if (phase === 'waving') {
        // Frames 8-15: loop waving
        const nextFrame = frame < ANTHRO_INTRO_WAVE_END ? frame + 1 : ANTHRO_INTRO_WAVE_START;
        updateCompActivity({ anthroIntroFrame: nextFrame });
      } else if (phase === 'transforming') {
        // Frames 16-37: one-time transformation, then switch to slab_idle
        if (frame < ANTHRO_INTRO_TRANSFORM_END) {
          updateCompActivity({ anthroIntroFrame: frame + 1 });
        } else {
          // Transformation complete - switch to slab idle
          updateCompActivity({ anthroIntroFrame: ANTHRO_INTRO_SLAB_IDLE_START, anthroAnimPhase: 'slab_idle' });
        }
      } else if (phase === 'slab_idle') {
        // Frames 38-42: loop slab idle
        const nextFrame = frame < ANTHRO_INTRO_SLAB_IDLE_END ? frame + 1 : ANTHRO_INTRO_SLAB_IDLE_START;
        updateCompActivity({ anthroIntroFrame: nextFrame });
      } else {
        // 'idle': Frames 0-7 loop
        updateCompActivity({ anthroIntroFrame: (frame + 1) % 8 });
      }
    }, 100); // 100ms per frame = 10fps
    
    return () => {
      if (anthroIntroAnimationRef.current) {
        clearInterval(anthroIntroAnimationRef.current);
        anthroIntroAnimationRef.current = null;
      }
    };
  }, [compActivity.anthroIntroVisible, compActivity.anthroIntroFrame, compActivity.anthroAnimPhase, updateCompActivity]);
  
  // TBI Anthro idle animation - slab idle loop (frames 8-15) during positioning phase
  useEffect(() => {
    if (!compActivity.tbiPositioningVisible) {
      // Clean up animation when positioning is hidden
      if (tbiAnthroAnimationRef.current) {
        clearInterval(tbiAnthroAnimationRef.current);
        tbiAnthroAnimationRef.current = null;
      }
      return;
    }
    
    // Slab idle uses frames 8-15 in anthro-tbi.png
    const SLAB_IDLE_START = 8;
    const SLAB_IDLE_END = 15;
    
    tbiAnthroAnimationRef.current = setInterval(() => {
      const currentFrame = compActivity.tbiAnthroFrame;
      const nextFrame = currentFrame < SLAB_IDLE_END ? currentFrame + 1 : SLAB_IDLE_START;
      updateCompActivity({ tbiAnthroFrame: nextFrame });
    }, 100); // 100ms per frame = 10 fps
    
    return () => {
      if (tbiAnthroAnimationRef.current) {
        clearInterval(tbiAnthroAnimationRef.current);
        tbiAnthroAnimationRef.current = null;
      }
    };
  }, [compActivity.tbiPositioningVisible, compActivity.tbiAnthroFrame, updateCompActivity]);
  
  // TBI Beam animation - plays frames 0-4 once, then loops frames 5-10 four times
  useEffect(() => {
    if (!compActivity.tbiBeamAnimating) return;
    
    console.log('[CombinedHomeScene] Beam animation started');
    
    const animateBeam = () => {
      const currentFrame = compActivity.tbiBeamFrame;
      const currentLoopCount = compActivity.tbiBeamLoopCount;
      
      // Intro phase: frames 0-4 (play once)
      if (currentFrame < TBI_BEAM_INTRO_FRAMES) {
        setTimeout(() => {
          updateCompActivity({ tbiBeamFrame: currentFrame + 1 });
        }, TBI_BEAM_FRAME_DURATION);
      }
      // Loop phase: frames 5-10 (loop 4 times)
      else if (currentLoopCount < TBI_BEAM_LOOP_COUNT) {
        if (currentFrame < TBI_BEAM_LOOP_END_FRAME) {
          // Continue current loop
          setTimeout(() => {
            updateCompActivity({ tbiBeamFrame: currentFrame + 1 });
          }, TBI_BEAM_FRAME_DURATION);
        } else {
          // Loop complete - restart at frame 5 or finish
          const nextLoopCount = currentLoopCount + 1;
          if (nextLoopCount < TBI_BEAM_LOOP_COUNT) {
            console.log(`[CombinedHomeScene] Beam loop ${nextLoopCount + 1}/${TBI_BEAM_LOOP_COUNT}`);
            setTimeout(() => {
              updateCompActivity({ 
                tbiBeamFrame: TBI_BEAM_LOOP_START_FRAME, 
                tbiBeamLoopCount: nextLoopCount 
              });
            }, TBI_BEAM_FRAME_DURATION);
          } else {
            // All loops complete - transition to result
            console.log('[CombinedHomeScene] Beam animation complete, transitioning to result');
            setTimeout(() => {
              updateCompActivity({ 
                tbiBeamVisible: false, 
                tbiBeamAnimating: false,
                phase: 'result_fading_to_black' 
              });
            }, TBI_BEAM_FRAME_DURATION);
          }
        }
      }
    };
    
    animateBeam();
  }, [compActivity.tbiBeamAnimating, compActivity.tbiBeamFrame, compActivity.tbiBeamLoopCount, updateCompActivity]);
  
  // TBI Result Anthro slab idle animation - loops frames 38-42 from anthro-intro.png during result phase
  useEffect(() => {
    if (!compActivity.tbiResultVisible) {
      // Clean up animation when result is hidden
      if (tbiResultAnthroAnimationRef.current) {
        clearInterval(tbiResultAnthroAnimationRef.current);
        tbiResultAnthroAnimationRef.current = null;
      }
      return;
    }
    
    tbiResultAnthroAnimationRef.current = setInterval(() => {
      const currentFrame = compActivity.tbiResultAnthroFrame;
      const nextFrame = currentFrame < ANTHRO_INTRO_SLAB_IDLE_END ? currentFrame + 1 : ANTHRO_INTRO_SLAB_IDLE_START;
      updateCompActivity({ tbiResultAnthroFrame: nextFrame });
    }, 100); // 100ms per frame = 10 fps
    
    return () => {
      if (tbiResultAnthroAnimationRef.current) {
        clearInterval(tbiResultAnthroAnimationRef.current);
        tbiResultAnthroAnimationRef.current = null;
      }
    };
  }, [compActivity.tbiResultVisible, compActivity.tbiResultAnthroFrame, updateCompActivity]);
  
  // Heart animation - CSS handles the float/fade, we just need to end the state after animation completes
  useEffect(() => {
    if (!pico.heartAnimating) return;
    
    // Animation duration is 1.2s (matches CSS animation)
    const timeout = setTimeout(() => {
      console.log('[CombinedHomeScene] Heart animation complete');
      updatePico({ heartAnimating: false });
    }, 1200);
    
    return () => clearTimeout(timeout);
  }, [pico.heartAnimating, updatePico]);
  
  // Comp-sheet phase transitions - handles boot-up and activity transitions with fade effects
  useEffect(() => {
    // === BOOT-UP PHASES (opening the computer) ===
    if (compActivity.phase === 'booting') {
      console.log('[CombinedHomeScene] Computer booting - showing black monitor');
      setTimeout(() => {
        console.log('[CombinedHomeScene] Boot fade in - showing blue screen + menu');
        updateCompActivity({ phase: 'booting_fade_in' });
      }, 300);
    }
    
    if (compActivity.phase === 'booting_fade_in') {
      setTimeout(() => {
        console.log('[CombinedHomeScene] Boot complete - ready for interaction');
        updateCompActivity({ phase: 'waiting' });
      }, 350);
    }
    
    // === ACTIVITY TRANSITION PHASES (selecting an activity) ===
    if (compActivity.phase === 'transitioning') {
      console.log('[CombinedHomeScene] Starting comp-sheet transition animation');
      
      updateCompActivity({ optionsFrame: 7 });
      
      setTimeout(() => {
        console.log('[CombinedHomeScene] Fading to black - hiding menu layers');
        updateCompActivity({ phase: 'fading_to_black' });
      }, 150);
    }
    
    if (compActivity.phase === 'fading_to_black') {
      setTimeout(() => {
        console.log('[CombinedHomeScene] Fading from black - showing Anthro intro');
        updateCompActivity({ anthroIntroVisible: true, anthroIntroFrame: 8, anthroAnimPhase: 'raising', anthroDialogueIndex: 0, phase: 'intro' });
        // Play Anthro's greeting voiceover
        playVoiceover('anthro_hello');
      }, 350);
    }
    
    if (compActivity.phase === 'intro_fading_to_black') {
      setTimeout(() => {
        console.log('[CombinedHomeScene] Intro complete - showing TBI positioning');
        updateCompActivity({ anthroIntroVisible: false, tbiPositioningVisible: true, tbiAnthroX: TBI_ANTHRO_START_X, tbiAnthroFrame: 8, phase: 'fading_from_black' });
      }, 350);
    }
    
    if (compActivity.phase === 'fading_from_black') {
      setTimeout(() => {
        console.log('[CombinedHomeScene] Transition complete - activity phase');
        updateCompActivity({ phase: 'activity' });
      }, 350);
    }
    
    // === RESULT TRANSITION PHASES (after TBI positioning complete) ===
    if (compActivity.phase === 'result_fading_to_black') {
      setTimeout(() => {
        console.log('[CombinedHomeScene] TBI faded out - showing result animation');
        const passed = evaluateTbiPositioning(compActivity.tbiAnthroX);
        updateCompActivity({ 
          tbiPositioningVisible: false, 
          tbiResultVisible: true, 
          tbiResultMaskFrame: 0,
          tbiResultAnthroFrame: 38, // Start slab idle animation
          tbiResultPassed: passed,
          phase: 'result_fading_from_black' 
        });
      }, 350);
    }
    
    if (compActivity.phase === 'result_fading_from_black') {
      setTimeout(() => {
        console.log('[CombinedHomeScene] Result faded in - starting mask reveal animation');
        updateCompActivity({ phase: 'result' });
        
        // Animate mask reveal: 0 (full coverage) → 10 (no coverage)
        let currentMaskFrame = 0;
        const animateMaskReveal = () => {
          if (currentMaskFrame < TBI_MASK_TOTAL_FRAMES - 1) {
            currentMaskFrame++;
            updateCompActivity({ tbiResultMaskFrame: currentMaskFrame });
            tbiResultAnimationRef.current = setTimeout(animateMaskReveal, 150);
          } else {
            console.log('[CombinedHomeScene] Mask reveal complete - waiting 350ms before showing result');
            updateCompActivity({ tbiResultMaskFrame: TBI_MASK_TOTAL_FRAMES - 1 });
            // Add 350ms pause before revealing pass/fail dialogue
            tbiResultAnimationRef.current = setTimeout(() => {
              console.log('[CombinedHomeScene] Result revealed - showing result dialogue');
              updateCompActivity({ tbiResultRevealed: true, tbiResultDialogueIndex: 0 });
              // Play first result voiceover (pass: great_job, fail: dont_short_me)
              const passed = evaluateTbiPositioning(compActivity.tbiAnthroX);
              playVoiceover(passed ? 'anthro_great_job' : 'anthro_dont_short_me');
            }, 350);
          }
        };
        
        tbiResultAnimationRef.current = setTimeout(animateMaskReveal, 400);
      }, 350);
    }
  }, [compActivity.phase, updateCompActivity]);
  
  // Cleanup interval on component unmount
  useEffect(() => {
    return () => {
      if (pingPongIntervalRef.current) {
        // Cleaning up star animation interval
        clearInterval(pingPongIntervalRef.current);
        pingPongIntervalRef.current = null;
      }
      // Note: Player animation is now cleaned up by usePlayerMovement hook
      if (anthroIntroAnimationRef.current) {
        clearInterval(anthroIntroAnimationRef.current);
        anthroIntroAnimationRef.current = null;
      }
      if (tbiAnthroAnimationRef.current) {
        clearInterval(tbiAnthroAnimationRef.current);
        tbiAnthroAnimationRef.current = null;
      }
      if (tbiResultAnimationRef.current) {
        clearTimeout(tbiResultAnimationRef.current);
        tbiResultAnimationRef.current = null;
      }
      if (tbiResultAnthroAnimationRef.current) {
        clearInterval(tbiResultAnthroAnimationRef.current);
        tbiResultAnthroAnimationRef.current = null;
      }
    };
  }, []);
  
  // Arrow keys visibility timer - hide after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      console.log('[CombinedHomeScene] 5 seconds elapsed - hiding arrow keys tutorial');
      setArrowKeysVisible(false);
    }, 5000);
    
    return () => clearTimeout(timer);
  }, []);

  // TBI Positioning keyboard controls - left/right arrow keys to navigate frames
  useEffect(() => {
    if (!compActivity.tbiPositioningVisible) {
      // Reset arrow keys frame when positioning screen is hidden
      setTbiArrowKeysFrame(1);
      return;
    }
    
    // Track which keys are currently pressed for visual indicator
    const pressedKeys = new Set<string>();

    const handleTbiPositioningKeyDown = (e: KeyboardEvent) => {
      // Block positioning during beam animation
      if (compActivity.tbiBeamAnimating) {
        return;
      }
      
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        e.stopPropagation();
        
        // Track pressed key
        pressedKeys.add(e.key);
        
        // Update visual indicator frame based on what's pressed
        // Frames: 1=neither, 2=right, 3=left, 4=both
        const leftPressed = pressedKeys.has('ArrowLeft');
        const rightPressed = pressedKeys.has('ArrowRight');
        
        if (leftPressed && rightPressed) {
          setTbiArrowKeysFrame(4); // Both pressed
        } else if (leftPressed) {
          setTbiArrowKeysFrame(3); // Left pressed - show left arrow (frame 3)
        } else if (rightPressed) {
          setTbiArrowKeysFrame(2); // Right pressed - show right arrow (frame 2)
        }
        
        // Navigation: Left moves away from gantry (decrease X position)
        setCompActivity(prev => ({ ...prev, tbiAnthroX: Math.max(TBI_ANTHRO_MIN_X, prev.tbiAnthroX - TBI_ANTHRO_STEP) }));
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        e.stopPropagation();
        
        // Track pressed key
        pressedKeys.add(e.key);
        
        // Update visual indicator frame based on what's pressed
        const leftPressed = pressedKeys.has('ArrowLeft');
        const rightPressed = pressedKeys.has('ArrowRight');
        
        if (leftPressed && rightPressed) {
          setTbiArrowKeysFrame(4); // Both pressed
        } else if (leftPressed) {
          setTbiArrowKeysFrame(3); // Left pressed - show left arrow (frame 3)
        } else if (rightPressed) {
          setTbiArrowKeysFrame(2); // Right pressed - show right arrow (frame 2)
        }
        
        // Navigation: Right moves toward gantry (increase X position)
        setCompActivity(prev => ({ ...prev, tbiAnthroX: Math.min(TBI_ANTHRO_MAX_X, prev.tbiAnthroX + TBI_ANTHRO_STEP) }));
      }
    };
    
    const handleTbiPositioningKeyUp = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'ArrowRight'].includes(e.key)) {
        // Remove from pressed keys
        pressedKeys.delete(e.key);
        
        // Update visual indicator based on remaining pressed keys
        const leftPressed = pressedKeys.has('ArrowLeft');
        const rightPressed = pressedKeys.has('ArrowRight');
        
        if (leftPressed && rightPressed) {
          setTbiArrowKeysFrame(4); // Both still pressed
        } else if (leftPressed) {
          setTbiArrowKeysFrame(3); // Left still pressed (frame 3)
        } else if (rightPressed) {
          setTbiArrowKeysFrame(2); // Right still pressed (frame 2)
        } else {
          setTbiArrowKeysFrame(1); // Neither pressed
        }
      }
    };

    window.addEventListener('keydown', handleTbiPositioningKeyDown, { capture: true });
    window.addEventListener('keyup', handleTbiPositioningKeyUp, { capture: true });
    return () => {
      window.removeEventListener('keydown', handleTbiPositioningKeyDown, { capture: true });
      window.removeEventListener('keyup', handleTbiPositioningKeyUp, { capture: true });
    };
  }, [compActivity.tbiPositioningVisible, compActivity.tbiBeamAnimating]);
  
  // Arrow keys frame animation based on key presses
  // Frames: 1=all up, 2=right only, 3=left only, 4=up only, 5=down only, 6=multiple, 7=all up highlighted, 8=multiple highlighted
  useEffect(() => {
    const updateArrowKeysFrame = () => {
      const keys = keysPressed.current;
      const leftPressed = keys.has('ArrowLeft');
      const rightPressed = keys.has('ArrowRight');
      const upPressed = keys.has('ArrowUp');
      const downPressed = keys.has('ArrowDown');
      
      const pressedCount = (leftPressed ? 1 : 0) + (rightPressed ? 1 : 0) + (upPressed ? 1 : 0) + (downPressed ? 1 : 0);
      
      if (pressedCount === 0) {
        setArrowKeysFrame(1); // All up
      } else if (pressedCount === 1) {
        // Only one key pressed
        if (rightPressed) setArrowKeysFrame(2); // Right only
        else if (leftPressed) setArrowKeysFrame(3); // Left only
        else if (upPressed) setArrowKeysFrame(4); // Up only
        else if (downPressed) setArrowKeysFrame(5); // Down only
      } else {
        // Multiple keys pressed
        setArrowKeysFrame(6); // All pushed
      }
    };
    
    // Check keys every 50ms to stay synced with movement
    const interval = setInterval(updateArrowKeysFrame, 50);
    
    return () => clearInterval(interval);
  }, []);
  
  // Centralized proximity detection - checks all interactive objects and determines closest
  useEffect(() => {
    // Only active in home view
    if (currentView !== 'home') {
      updateInteractionUI({ active: null });
      return;
    }
    
    // Calculate distances to all interactive objects
    const telescopeDistance = Math.sqrt(
      Math.pow(playerPosition.x - TELESCOPE_POSITION.x, 2) + 
      Math.pow(playerPosition.y - TELESCOPE_POSITION.y, 2)
    );
    
    // Desk uses horizontal-only distance (side-view 2D game)
    const deskDistance = Math.abs(playerPosition.x - DESK_POSITION.x);
    
    // Pico distance with extended range to the left
    const picoHorizontalOffset = playerPosition.x - PICO_POSITION.x;
    const picoDistance = Math.abs(picoHorizontalOffset);
    
    // Find closest interactive object within ACTUAL INTERACTION RANGE (not proximity hint range)
    // Keys only show when actually interactable to prevent player confusion
    const INTERACTION_RANGE = PROXIMITY_THRESHOLD / 2; // Half of original proximity threshold
    
    // Pico has extended interaction range to the left
    const picoInteractionRange = picoHorizontalOffset < 0 
      ? INTERACTION_RANGE + PICO_LEFT_EXTENSION // Left of Pico - extended range
      : INTERACTION_RANGE; // Right of Pico - normal range
    
    const interactions: Array<{ type: InteractionType; distance: number; label: string; enabled: boolean; range?: number }> = [
      { type: 'telescope', distance: telescopeDistance, label: 'Look', enabled: !xKeyTriggered },
      { type: 'desk', distance: deskDistance, label: 'Study', enabled: deskXKeyEnabled && !deskXKeyTriggered },
      { type: 'pico', distance: picoDistance, label: 'Talk', enabled: !pico.interacted, range: picoInteractionRange }
    ];
    
    // Filter to only enabled interactions within their respective ranges
    const nearbyInteractions = interactions.filter(i => i.enabled && i.distance < (i.range || INTERACTION_RANGE));
    
    if (nearbyInteractions.length === 0) {
      updateInteractionUI({ active: null });
      return;
    }
    
    // Sort by distance and take closest
    nearbyInteractions.sort((a, b) => a.distance - b.distance);
    const closest = nearbyInteractions[0];
    
    updateInteractionUI({ active: closest.type, contextLabel: closest.label, xKeyFrame: 1 });
  }, [playerPosition, currentView, xKeyTriggered, deskXKeyEnabled, deskXKeyTriggered, pico.interacted, updateInteractionUI]);
  
  // Ladder arrow indicators - show up/down arrows when near ladder
  // Must match the climbing action zone in usePlayerMovement (includes extended right boundary)
  useEffect(() => {
    const nearLadderX = Math.abs(playerPosition.x - CLIMB_X_THRESHOLD) < CLIMB_X_TOLERANCE &&
                        playerPosition.x <= SECOND_FLOOR_BOUNDS.right + CLIMB_RIGHT_EXTENSION;
    const onGroundFloor = Math.abs(playerPosition.y - GROUND_FLOOR_Y) < FLOOR_TOLERANCE;
    const onSecondFloor = Math.abs(playerPosition.y - SECOND_FLOOR_Y) < FLOOR_TOLERANCE;
    
    updateInteractionUI({
      showUpArrow: nearLadderX && onGroundFloor && currentView === 'home',
      showDownArrow: nearLadderX && onSecondFloor && currentView === 'home',
    });
  }, [playerPosition, currentView, updateInteractionUI]);

  // === TELESCOPE SPEECH BUBBLE VISIBILITY ===
  useEffect(() => {
    // Hide regular telescope bubble after completing first activity (exclamation replaces it)
    updateBubble('telescope', { visible: currentView === 'home' && !deskXKeyEnabled && !hasCompletedFirstActivity });
  }, [currentView, deskXKeyEnabled, hasCompletedFirstActivity, updateBubble]);
  
  // === TELESCOPE EXCLAMATION BUBBLE VISIBILITY ===
  useEffect(() => {
    updateBubble('telescopeExclamation', { 
      visible: hasCompletedFirstActivity && currentView === 'home' 
    });
  }, [currentView, hasCompletedFirstActivity, updateBubble]);
  
  // === DESK SPEECH BUBBLE VISIBILITY ===
  useEffect(() => {
    updateBubble('desk', {
      visible: currentView === 'home' && deskXKeyEnabled && !hasCompletedFirstActivity && !compActivity.visible
    });
  }, [currentView, deskXKeyEnabled, hasCompletedFirstActivity, compActivity.visible, updateBubble]);
  
  // === TELESCOPE PROXIMITY DETECTION (for speech bubble highlighting) ===
  useEffect(() => {
    if (!speechBubbles.telescope.visible) {
      updateBubble('telescope', { highlighted: false });
      return;
    }
    
    if (currentView === 'home') {
      const telescopeDistance = Math.sqrt(
        Math.pow(playerPosition.x - TELESCOPE_POSITION.x, 2) + 
        Math.pow(playerPosition.y - TELESCOPE_POSITION.y, 2)
      );
      const INTERACTION_RANGE = PROXIMITY_THRESHOLD / 2;
      updateBubble('telescope', { highlighted: telescopeDistance < INTERACTION_RANGE });
    } else if (currentView === 'sky') {
      updateBubble('telescope', { highlighted: true });
    } else {
      updateBubble('telescope', { highlighted: false });
    }
  }, [currentView, speechBubbles.telescope.visible, playerPosition, updateBubble]);
  
  // === TELESCOPE EXCLAMATION PROXIMITY DETECTION (for highlighting) ===
  useEffect(() => {
    if (!speechBubbles.telescopeExclamation.visible) {
      updateBubble('telescopeExclamation', { highlighted: false });
      return;
    }
    
    if (currentView === 'home') {
      const telescopeDistance = Math.abs(playerPosition.x - TELESCOPE_POSITION.x);
      const isAtTelescope = playerPosition.y === SECOND_FLOOR_Y;
      const inRange = telescopeDistance < PROXIMITY_THRESHOLD && isAtTelescope;
      updateBubble('telescopeExclamation', { highlighted: inRange });
    } else if (currentView === 'sky') {
      updateBubble('telescopeExclamation', { highlighted: true });
    } else {
      updateBubble('telescopeExclamation', { highlighted: false });
    }
  }, [currentView, speechBubbles.telescopeExclamation.visible, playerPosition, updateBubble]);
  
  // === DESK PROXIMITY DETECTION (for speech bubble highlighting in home view only) ===
  useEffect(() => {
    if (!speechBubbles.desk.visible || currentView !== 'home') {
      updateBubble('desk', { highlighted: false });
      return;
    }
    
    const deskDistance = Math.abs(playerPosition.x - DESK_POSITION.x);
    const INTERACTION_RANGE = PROXIMITY_THRESHOLD / 2;
    updateBubble('desk', { highlighted: deskDistance < INTERACTION_RANGE });
  }, [currentView, speechBubbles.desk.visible, playerPosition, updateBubble]);
  
  // === TELESCOPE SPEECH BUBBLE ANIMATION ===
  useEffect(() => {
    if (!speechBubbles.telescope.visible) return;
    
    let bubbleFrameCount = 1;
    const animateBubble = () => {
      bubbleFrameCount = (bubbleFrameCount % 4) + 1;
      updateBubble('telescope', { frame: bubbleFrameCount });
    };
    
    const bubbleInterval = setInterval(animateBubble, BUBBLE_FRAME_SPEED);
    return () => clearInterval(bubbleInterval);
  }, [speechBubbles.telescope.visible, updateBubble]);
  
  // === TELESCOPE EXCLAMATION BUBBLE ANIMATION ===
  useEffect(() => {
    if (!speechBubbles.telescopeExclamation.visible) return;
    
    let bubbleFrameCount = 1;
    const animateBubble = () => {
      bubbleFrameCount = (bubbleFrameCount % 4) + 1; // Cycle 1-4 (same as telescope bubble)
      updateBubble('telescopeExclamation', { frame: bubbleFrameCount });
    };
    
    const bubbleInterval = setInterval(animateBubble, BUBBLE_FRAME_SPEED);
    return () => clearInterval(bubbleInterval);
  }, [speechBubbles.telescopeExclamation.visible, updateBubble]);
  
  // === DESK SPEECH BUBBLE ANIMATION ===
  useEffect(() => {
    if (!speechBubbles.desk.visible) return;
    
    let bubbleFrameCount = 1;
    const animateBubble = () => {
      bubbleFrameCount = (bubbleFrameCount % 4) + 1;
      updateBubble('desk', { frame: bubbleFrameCount });
    };
    
    const bubbleInterval = setInterval(animateBubble, BUBBLE_FRAME_SPEED);
    return () => clearInterval(bubbleInterval);
  }, [speechBubbles.desk.visible, updateBubble]);
  
  // C key (Pet) proximity detection for Pico - only shows when in actual interaction range
  useEffect(() => {
    if (currentView !== 'home') {
      updateInteractionUI({ cKeyFrame: 1 });
      return;
    }
    
    const picoHorizontalOffset = playerPosition.x - PICO_POSITION.x;
    const picoDistance = Math.abs(picoHorizontalOffset);
    const INTERACTION_RANGE = PROXIMITY_THRESHOLD / 2;
    
    const picoInteractionRange = picoHorizontalOffset < 0 
      ? INTERACTION_RANGE + PICO_LEFT_EXTENSION
      : INTERACTION_RANGE;
    
    if (picoDistance < picoInteractionRange) {
      updateInteractionUI({ cKeyFrame: 1 });
    } else {
      updateInteractionUI({ cKeyFrame: 1 });
    }
  }, [playerPosition, currentView, updateInteractionUI]);
  
  // === PICO ANIMATION LOOP ===
  useEffect(() => {
    const FRAME_INTERVAL = 16;
    const PICO_IDLE_FRAME_SPEED = 8;
    
    const animatePico = () => {
      picoFrameTickRef.current++;
      if (picoFrameTickRef.current >= PICO_IDLE_FRAME_SPEED) {
        picoFrameTickRef.current = 0;
        picoFrameCountRef.current++;
        updatePico({ frame: picoFrameCountRef.current });
      }
    };
    
    picoAnimationRef.current = setInterval(animatePico, FRAME_INTERVAL);
    
    return () => {
      if (picoAnimationRef.current) {
        clearInterval(picoAnimationRef.current);
      }
    };
  }, [pico.isTalking, updatePico]);
  
  // === PICO SPEECH BUBBLE VISIBILITY (always shown until interaction) ===
  useEffect(() => {
    updateBubble('pico', {
      visible: !pico.interacted && currentView === 'home' && !pico.showDialogue
    });
  }, [pico.interacted, currentView, pico.showDialogue, updateBubble]);
  
  // === PICO PROXIMITY DETECTION (for speech bubble highlighting) ===
  useEffect(() => {
    if (!speechBubbles.pico.visible) {
      updateBubble('pico', { highlighted: false });
      return;
    }
    
    const horizontalDistance = Math.abs(playerPosition.x - PICO_POSITION.x);
    const picoHorizontalOffset = playerPosition.x - PICO_POSITION.x;
    const INTERACTION_RANGE = PROXIMITY_THRESHOLD / 2;
    
    const picoInteractionRange = picoHorizontalOffset < 0 
      ? INTERACTION_RANGE + PICO_LEFT_EXTENSION
      : INTERACTION_RANGE;
    
    const isNear = horizontalDistance < picoInteractionRange;
    
    if (isNear !== speechBubbles.pico.highlighted) {
      console.log(`[Pico] Horizontal distance: ${horizontalDistance.toFixed(0)}px, Threshold: ${picoInteractionRange.toFixed(0)}px, Highlighting: ${isNear}`);
    }
    
    updateBubble('pico', { highlighted: isNear });
  }, [playerPosition, speechBubbles.pico.visible, speechBubbles.pico.highlighted, updateBubble]);
  
  // === PICO SPEECH BUBBLE ANIMATION ===
  useEffect(() => {
    if (!speechBubbles.pico.visible) return;
    
    let bubbleFrameCount = 1;
    const animateBubble = () => {
      bubbleFrameCount = (bubbleFrameCount % 4) + 1;
      updateBubble('pico', { frame: bubbleFrameCount });
    };
    
    const bubbleInterval = setInterval(animateBubble, BUBBLE_FRAME_SPEED);
    return () => clearInterval(bubbleInterval);
  }, [speechBubbles.pico.visible, updateBubble]);
  
  // Tutorial state (no complex guided tour)
  const shownSpotlightsRef = useRef(new Set<string>());

  // Tutorial star interaction handlers
  const handleStarClick = () => {
    console.log('[CombinedHomeScene] ⭐ Star clicked! Opening star detail modal');
    
    // Don't allow clicks during reveal animation
    if (isRevealAnimating) {
      console.log('[CombinedHomeScene] ⭐ Star is animating - click ignored');
      return;
    }
    
    // Simply open the star detail modal - all unlock logic handled by modal button
    setShowStarDetail(true);
  };

  // Star hover handlers removed - X key only interaction (no mouse events)

  // Ensure body/html overflow is hidden and set background color
  useEffect(() => {
    // Force body and html to have overflow hidden (fixes scrollbar issue)
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    
    // Set background to match title screen
    document.body.style.backgroundColor = '#000';
    
    console.log('[CombinedHomeScene] Body/HTML overflow forced to hidden, background set to black');
    
    return () => {
      // Keep it hidden even on unmount
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    };
  }, []);
  
  // Cleanup locked message timeout on unmount
  useEffect(() => {
    return () => {
      if (lockedMessageTimeoutRef.current) {
        clearTimeout(lockedMessageTimeoutRef.current);
      }
    };
  }, []);
  
  return (
    <>
      <JumboViewport>
        {/* The isolated parallax renderer sits here, behind the scrolling content */}
        <ParallaxRenderer 
          scrollPosition={scrollPosition} 
          transitionDuration={transitionDuration}
          telescopeFrame={1}
        />

        {/* Celestial bodies layer - stars, planets, moons (renders below clouds) */}
        {/* Elevate entire layer when tutorial star or planet is highlighted - breaks through clouds/abyss */}
        <CelestialLayer 
          $scrollPosition={scrollPosition} 
          $transitionDuration={transitionDuration}
          $elevated={skyHighlight === 'star' || skyHighlight.startsWith('planet_') || skyHighlight === 'tbi' || skyHighlight.startsWith('tbi_')}
        >
          {/* Telescope speech bubble - shown in home view */}
          <SpeechBubbleSprite
            $frame={speechBubbles.telescope.frame}
            $visible={speechBubbles.telescope.visible}
            $highlighted={speechBubbles.telescope.highlighted}
            style={{
              left: `${TELESCOPE_POSITION.x - 16}px`,
              top: `${TELESCOPE_POSITION.y - 20}px`,
            }}
          />
          
          {/* Telescope exclamation indicator - shown after completing first activity, same position as telescope bubble */}
          <SpeechBubbleSprite
            $frame={speechBubbles.telescopeExclamation.frame}
            $visible={speechBubbles.telescopeExclamation.visible}
            $highlighted={speechBubbles.telescopeExclamation.highlighted}
            style={{
              left: `${TELESCOPE_POSITION.x - 16}px`,
              top: `${TELESCOPE_POSITION.y - 20}px`,
            }}
          />
          
          {/* Star sprite - visible until final constellation replaces it */}
          {!cutscene.showFinalConstellation && (
            <>
              <StarSprite
                $frame={tutorialStarFrame}
                style={{ 
                  left: `${PRIMAREUS_POSITION.x}px`, 
                  top: `${PRIMAREUS_POSITION.y}px`,
                  opacity: cutscene.isPlaying ? cutscene.starOpacity : 1,
                }}
              />
              
              {/* Speech bubble above star - shown in sky view */}
              <SpeechBubbleSprite
                $frame={speechBubbles.star.frame}
                $visible={speechBubbles.star.visible}
                $highlighted={speechBubbles.star.highlighted}
                style={{
                  left: `${PRIMAREUS_POSITION.x - 1}px`,
                  top: `${PRIMAREUS_POSITION.y - 20}px`,
                }}
              />
            </>
          )}

          {/* Final constellation - TBI planet at center with orbiting moons */}
          {cutscene.showFinalConstellation && cutscene.constellationBodies.map((star) => {
            const canHighlight = !star.parentId;
            const isHighlighted = !cutscene.isPlaying && canHighlight && skyHighlight === star.id;
            // Frame highlighting logic:
            // - TBI constellation (frames 0-2, NOW using planetary-sheet.png): highlighted versions are +24 frames higher (section 1)
            // - Planetary systems (frames 0-23, using planetary-sheet.png): highlighted versions are +24 frames higher (section 1)
            // Determine which system by checking star ID (planet_* or tbi* = planetary system)
            const isPlanetarySystem = star.id.startsWith('planet_') || star.id.startsWith('moon_') || star.id.startsWith('tbi');
            const displayFrame = isHighlighted 
              ? (isPlanetarySystem ? star.frame + 24 : star.frame)
              : star.frame;
            
            // Orbital animation scale (no base scale difference between planet and moons)
            const finalScale = star.scale ?? 1.0;
            
            return (
              <React.Fragment key={star.id}>
                {/* Layer 1: Blurry base sprite (Section 0 or Section 1 if highlighted) */}
                <StarSprite
                  $frame={displayFrame}
                  $isPlanetarySystem={isPlanetarySystem}
                  style={{
                    left: `${star.x}px`,
                    top: `${star.y}px`,
                    transform: `translate(-50%, -50%) scale(${finalScale})`,
                    opacity: star.opacity ?? 1,
                    zIndex: star.zIndex ?? 3, // Apply dynamic z-index (elevated when highlighted)
                    transition: 'transform 0.016s linear, opacity 0.016s linear', // Smooth interpolation
                  }}
                />
                {/* Layer 2: Non-blurry crisp overlay (Section 2: frames +48) */}
                <StarSprite
                  $frame={star.frame + 48} // Section 2 is always +48 from base frame (no highlighting offset)
                  $isPlanetarySystem={isPlanetarySystem}
                  style={{
                    left: `${star.x}px`,
                    top: `${star.y}px`,
                    transform: `translate(-50%, -50%) scale(${finalScale})`,
                    opacity: star.opacity ?? 1,
                    zIndex: (star.zIndex ?? 3) + 1, // Render above blurry layer
                    transition: 'transform 0.016s linear, opacity 0.016s linear', // Smooth interpolation
                    pointerEvents: 'none', // Pass through to base layer
                  }}
                />
                {/* Show name label next to highlighted star */}
                {isHighlighted && (
                  <StarNameLabel
                    style={{
                      left: `${star.x + 18}px`, // Position to the right of the star
                      top: `${star.y - 7}px`, // Slightly above center
                      zIndex: (star.zIndex ?? 3) + 2, // Name label renders above both sprite layers
                    }}
                  >
                    {STAR_NAMES[star.id as StarIdType]}
                  </StarNameLabel>
                )}
              </React.Fragment>
            );
          })}
        </CelestialLayer>

        {/* The scrolling content contains the foreground and all interactive elements */}
        <ScrollingContent $scrollPosition={scrollPosition} $transitionDuration={transitionDuration}>
          <ForegroundLayer />
          
          {/* Player character - uses custom sprite if created, otherwise default sprite */}
          <CharacterSprite
                $frame={playerFrame}
                $direction={playerDirection}
                $isWalking={playerIsWalking}
                $isClimbing={playerIsClimbing}
                $customSpriteSheet={customSpriteSheet || undefined}
                style={{
                  left: `${playerPosition.x}px`,
                  // Position relative to ScrollingContent - moves with the home scene during scroll
                  top: `${playerPosition.y}px`,
                }}
              />
              
              {/* Pico the cat - idle animation, switches to talking when interacted */}
              <PicoSprite
                $frame={pico.frame}
                $isTalking={pico.isTalking}
                style={{
                  left: `${PICO_POSITION.x}px`,
                  top: `${PICO_POSITION.y}px`,
                }}
              />
              
              {/* Speech bubble above Pico - always visible until interaction, hides during heart animation */}
              <SpeechBubbleSprite
                $frame={speechBubbles.pico.frame}
                $visible={speechBubbles.pico.visible && !pico.heartAnimating}
                $highlighted={speechBubbles.pico.highlighted}
                style={{
                  left: `${PICO_POSITION.x + 6}px`,
                  top: `${PICO_POSITION.y - 20}px`,
                }}
              />
              
              {/* Desk speech bubble - shown in home view after viewing star */}
              <SpeechBubbleSprite
                $frame={speechBubbles.desk.frame}
                $visible={speechBubbles.desk.visible}
                $highlighted={speechBubbles.desk.highlighted}
                style={{
                  left: `${DESK_POSITION.x - 1}px`,
                  top: `${DESK_POSITION.y - 20}px`,
                }}
              />
              
              {/* Pico Dialogue Text - Follows the speaking character */}
              <PicoDialogueText 
                $visible={pico.showDialogue}
                style={{
                  left: PICO_DIALOGUE_LINES[pico.dialogueIndex].speaker === 'Pico' 
                    ? `${PICO_POSITION.x + 10}px`
                    : `${playerPosition.x - 90}px`,
                  top: PICO_DIALOGUE_LINES[pico.dialogueIndex].speaker === 'Pico'
                    ? `${PICO_POSITION.y - 80}px`
                    : `${playerPosition.y - 65}px`,
                }}
              >
                <PicoSpeakerLabel>
                  {PICO_DIALOGUE_LINES[pico.dialogueIndex].speaker === 'player' 
                    ? playerName 
                    : PICO_DIALOGUE_LINES[pico.dialogueIndex].speaker}
                </PicoSpeakerLabel>
                <div>{PICO_DIALOGUE_LINES[pico.dialogueIndex].text}</div>
                <PicoContinueHint>
                  {pico.dialogueIndex < PICO_DIALOGUE_LINES.length - 1 ? '(X to continue)' : '(X to close)'}
                </PicoContinueHint>
              </PicoDialogueText>
              
              {/* Pico Blocking Dialogue - When player tries to climb without talking first */}
              <PicoDialogueText 
                $visible={pico.showBlockingDialogue}
                style={{
                  left: PICO_BLOCKING_DIALOGUE[pico.blockingDialogueIndex].speaker === 'Pico' 
                    ? `${PICO_POSITION.x + 10}px`
                    : `${playerPosition.x - 90}px`,
                  top: PICO_BLOCKING_DIALOGUE[pico.blockingDialogueIndex].speaker === 'Pico'
                    ? `${PICO_POSITION.y - 100}px`
                    : `${playerPosition.y - 65}px`,
                }}
              >
                <PicoSpeakerLabel>
                  {PICO_BLOCKING_DIALOGUE[pico.blockingDialogueIndex].speaker === 'player' 
                    ? playerName 
                    : PICO_BLOCKING_DIALOGUE[pico.blockingDialogueIndex].speaker}
                </PicoSpeakerLabel>
                <div>{PICO_BLOCKING_DIALOGUE[pico.blockingDialogueIndex].text}</div>
                <PicoContinueHint>
                  {pico.blockingDialogueIndex < PICO_BLOCKING_DIALOGUE.length - 1 ? '(X to continue)' : '(X to close)'}
                </PicoContinueHint>
              </PicoDialogueText>
              
              {/* Arrow keys tutorial - hover over player for first 20 seconds */}
              <ArrowKeysSprite
                $frame={arrowKeysFrame}
                $visible={arrowKeysVisible}
                style={{
                  left: `${playerPosition.x - 4}px`, // Center above player (38px char - 45px sprite = -7px, +3px adjustment)
                  top: `${playerPosition.y - 45}px`,  // Hover above player's head
                }}
              />
              
              {/* Player-following X key - shows when near interactive objects with contextual labels */}
              <XKeySprite
                $frame={interactionUI.xKeyFrame}
                $visible={interactionUI.active !== null && currentView === 'home' && !pico.showDialogue && !pico.showBlockingDialogue && !compActivity.visible}
                style={{
                  left: `${playerPosition.x + 36}px`,
                  top: `${playerPosition.y - 5}px`,
                }}
              />
              
              {/* Contextual label for X key - shows what action will be performed */}
              <ContextLabel
                $visible={interactionUI.active !== null && currentView === 'home' && !pico.showDialogue && !compActivity.visible}
                style={{
                  left: `${playerPosition.x + 55}px`,
                  top: `${playerPosition.y - 5}px`,
                }}
              >
                {interactionUI.contextLabel}
              </ContextLabel>
              
              {/* C key for petting Pico - shows when in actual interaction range, stacked below X key if both visible */}
              {(() => {
                const picoHorizontalOffset = playerPosition.x - PICO_POSITION.x;
                const picoDistance = Math.abs(picoHorizontalOffset);
                const INTERACTION_RANGE = PROXIMITY_THRESHOLD / 2;
                
                const picoInteractionRange = picoHorizontalOffset < 0 
                  ? INTERACTION_RANGE + PICO_LEFT_EXTENSION
                  : INTERACTION_RANGE;
                
                const isNearPico = picoDistance < picoInteractionRange;
                const showCKey = isNearPico && currentView === 'home' && !pico.showDialogue && !pico.showBlockingDialogue && !compActivity.visible && !pico.hasPetted;
                const yOffset = (interactionUI.active === 'pico' && !pico.interacted) ? 18 : 0;
                
                return (
                  <>
                    <CKeySprite
                      $frame={interactionUI.cKeyFrame}
                      $visible={showCKey}
                      style={{
                        left: `${playerPosition.x + 36}px`,
                        top: `${playerPosition.y - 5 + yOffset}px`,
                      }}
                    />
                    <ContextLabel
                      $visible={showCKey}
                      style={{
                        left: `${playerPosition.x + 55}px`,
                        top: `${playerPosition.y - 5 + yOffset}px`,
                      }}
                    >
                      Pet
                    </ContextLabel>
                  </>
                );
              })()}
              
              {/* Heart bubble animation - appears above Pico after petting (same position as speech bubble) */}
              <HeartBubbleSprite
                $visible={pico.heartAnimating}
                style={{
                  left: `${PICO_POSITION.x + 6}px`,
                  top: `${PICO_POSITION.y - 20}px`,
                }}
              />
              
              {/* Up arrow - shows when near ladder at ground floor */}
              <UpArrowSprite
                $frame={interactionUI.upArrowFrame}
                $visible={interactionUI.showUpArrow && !pico.showDialogue && !compActivity.visible}
                style={{
                  left: `${playerPosition.x + 36}px`,
                  top: `${playerPosition.y - 5}px`,
                }}
              />
              <ContextLabel
                $visible={interactionUI.showUpArrow && !pico.showDialogue && !compActivity.visible}
                style={{
                  left: `${playerPosition.x + 55}px`,
                  top: `${playerPosition.y - 5}px`,
                }}
              >
                Climb
              </ContextLabel>
              
              {/* Down arrow - shows when near ladder at second floor */}
              <DownArrowSprite
                $frame={interactionUI.downArrowFrame}
                $visible={interactionUI.showDownArrow && !pico.showDialogue && !compActivity.visible}
                style={{
                  left: `${playerPosition.x + 36}px`,
                  top: `${playerPosition.y - 5}px`,
                }}
              />
              <ContextLabel
                $visible={interactionUI.showDownArrow && !pico.showDialogue && !compActivity.visible}
                style={{
                  left: `${playerPosition.x + 55}px`,
                  top: `${playerPosition.y - 5}px`,
                }}
              >
                Descend
              </ContextLabel>
              
              {/* Visual boundary debugging */}
              {DEBUG_BOUNDARIES && (
                <>
                  {/* First floor boundaries */}
                  <BoundaryLine $color="#00FF00" style={{ left: `${FIRST_FLOOR_BOUNDS.left}px` }} />
                  <BoundaryLabel $color="#00FF00" style={{ 
                    left: `${FIRST_FLOOR_BOUNDS.left + 5}px`, 
                    top: `${430}px` 
                  }}>
                    1F Left: {FIRST_FLOOR_BOUNDS.left}
                  </BoundaryLabel>
                  
                  <BoundaryLine $color="#00FF00" style={{ left: `${FIRST_FLOOR_BOUNDS.right}px` }} />
                  <BoundaryLabel $color="#00FF00" style={{ 
                    left: `${FIRST_FLOOR_BOUNDS.right - 80}px`, 
                    top: `${430}px` 
                  }}>
                    1F Right: {FIRST_FLOOR_BOUNDS.right}
                  </BoundaryLabel>
                  
                  {/* Second floor boundaries */}
                  <BoundaryLine $color="#FF6B00" style={{ left: `${SECOND_FLOOR_BOUNDS.left}px` }} />
                  <BoundaryLabel $color="#FF6B00" style={{ 
                    left: `${SECOND_FLOOR_BOUNDS.left + 5}px`, 
                    top: `${270}px` 
                  }}>
                    2F Left: {SECOND_FLOOR_BOUNDS.left}
                  </BoundaryLabel>
                  
                  <BoundaryLine $color="#FF6B00" style={{ left: `${SECOND_FLOOR_BOUNDS.right}px` }} />
                  <BoundaryLabel $color="#FF6B00" style={{ 
                    left: `${SECOND_FLOOR_BOUNDS.right - 80}px`, 
                    top: `${270}px` 
                  }}>
                    2F Right: {SECOND_FLOOR_BOUNDS.right}
                  </BoundaryLabel>
                  
                  {/* Floor level indicators */}
                  <BoundaryFloorIndicator 
                    $color="#00FF00" 
                    style={{ top: `${467}px` }} 
                    data-label="Ground Floor (y=467)"
                  />
                  <BoundaryFloorIndicator 
                    $color="#FF6B00" 
                    style={{ top: `${307}px` }} 
                    data-label="Second Floor (y=307)"
                  />
                  
                  {/* Current position indicator */}
                  <BoundaryLabel 
                    $color="#FFFF00" 
                    style={{ 
                      left: `${playerPosition.x}px`, 
                      top: `${playerPosition.y - 15}px`,
                      fontSize: '8px'
                    }}
                  >
                    ({playerPosition.x.toFixed(0)}, {playerPosition.y.toFixed(0)})
                  </BoundaryLabel>
                </>
              )}
          
          {/* Player monologue - appears after closing ??? star modal (positioned relative to player like Pico dialogue) */}
          {(() => {
            const isLastLine = currentMonologueLineIndex >= MONOLOGUE_LINES.length - 1;
            
            return (
              <PlayerMonologue
                $visible={showMonologue && currentView === 'sky'}
                style={{
                  left: `${playerPosition.x - 95}px`,
                  top: `${playerPosition.y - 62}px`,
                }}
              >
                <PlayerSpeakerLabel>{playerName}</PlayerSpeakerLabel>
                <div>{MONOLOGUE_LINES[currentMonologueLineIndex]}</div>
                <PlayerContinueHint>
                  {isLastLine ? '(X to close)' : '(X to continue)'}
                </PlayerContinueHint>
              </PlayerMonologue>
            );
          })()}
          
          {/* === HOME VIEW - Keyboard-only controls === */}
          {/* All interactions (telescope, desk, bed) now handled via keyboard proximity detection */}
        </ScrollingContent>
        
        {/* Star Detail Modal - Rendered within the 640×360 coordinate system */}
        {showStarDetail && (() => {
          // Only show modal for supported star types (not planets)
          const validStarIds = ['star', 'tbi', 'tbi_patient_setup'];
          if (!validStarIds.includes(activeStarId)) return null;
          
          // Calculate the current frame for the active celestial body
          // TBI constellation now uses planetary-sheet.png: planet uses frame 2, moons use frame 0 (small moon)
          const currentStarFrame = activeStarId === 'star' ? tutorialStarFrame :
                                   activeStarId === 'tbi' ? 2 : 0;
          
          return (
            <StarDetailModal 
              starId={activeStarId as 'star' | 'tbi' | 'tbi_patient_setup'}
              onClose={handleCloseStarDetail}
              starFrame={currentStarFrame}
              isUnlocked={starUnlocked}
              onStarUnlock={handleStarUnlock}
              onStarViewed={handleStarViewed}
            />
          );
        })()}

        {/* Backdrop overlay - darkens and blurs when comp-sheet or book is visible */}
        <CompSheetBackdrop $visible={compActivity.visible || compActivity.bookVisible} />

        {/* Comp-sheet composite layer system - appears when desk interaction starts */}
        {compActivity.visible && (
          <>
            {/* Layer 1a: Monitor frame with black fill (base layer) */}
            <CompMonitorLayer
              $visible={compActivity.visible}
              style={{
                left: '170px',
                top: '90px',
              }}
            />
            
            {/* Layer 1b: Screen color overlay (blue for menu, dark for activity/intro/result) */}
            <CompScreenLayer
              $visible={compActivity.phase !== 'booting' && compActivity.phase !== 'fading_to_black' && compActivity.phase !== 'intro_fading_to_black' && compActivity.phase !== 'result_fading_to_black'}
              $variant={compActivity.phase === 'intro' || compActivity.phase === 'fading_from_black' || compActivity.phase === 'activity' || compActivity.phase === 'result_fading_from_black' || compActivity.phase === 'result' ? 'dark' : 'blue'}
              style={{
                left: '170px',
                top: '90px',
              }}
            />
            
            {/* Layer 2: Tabs layer - consolidated activity/shop tabs with highlight and lock states */}
            <CompTabsLayer
              $frame={getCompTabsFrame(compActivity.currentTab, compActivity.tabFocused, hasCompletedFirstActivity)}
              $visible={compActivity.phase === 'booting_fade_in' || compActivity.phase === 'waiting'}
              style={{
                left: '170px',
                top: '90px',
              }}
            />
            
            {/* Layer 3: Activity options highlights */}
            <CompOptionsLayer
              $frame={compActivity.optionsFrame}
              $visible={compActivity.currentTab === 'activities' && (compActivity.phase === 'booting_fade_in' || compActivity.phase === 'waiting' || compActivity.phase === 'transitioning')}
              style={{
                left: '170px',
                top: '90px',
              }}
            />
            
            {/* Layer 4: Activity options static layer */}
            <CompOptionsStaticLayer
              $visible={compActivity.currentTab === 'activities' && (compActivity.phase === 'booting_fade_in' || compActivity.phase === 'waiting')}
              style={{
                left: '170px',
                top: '90px',
              }}
            />
            
            {/* Activity visual regions - keyboard navigation only (no mouse interaction) */}
            {compActivity.currentTab === 'activities' && compActivity.phase === 'waiting' && (
              <>
                {/* Top-left activity (0) */}
                <ActivityClickRegion
                  $active={compActivity.highlightedActivity === 0 && !compActivity.tabFocused}
                  style={{
                    left: '185px',
                    top: '115px',
                    width: '60px',
                    height: '50px',
                  }}
                />
                
                {/* Top-right activity (1) */}
                <ActivityClickRegion
                  $active={compActivity.highlightedActivity === 1 && !compActivity.tabFocused}
                  style={{
                    left: '385px',
                    top: '115px',
                    width: '60px',
                    height: '50px',
                  }}
                />
                
                {/* Bottom-left activity (2) */}
                <ActivityClickRegion
                  $active={compActivity.highlightedActivity === 2 && !compActivity.tabFocused}
                  style={{
                    left: '185px',
                    top: '195px',
                    width: '60px',
                    height: '50px',
                  }}
                />
                
                {/* Bottom-middle activity (3) */}
                <ActivityClickRegion
                  $active={compActivity.highlightedActivity === 3 && !compActivity.tabFocused}
                  style={{
                    left: '280px',
                    top: '195px',
                    width: '60px',
                    height: '50px',
                  }}
                />
                
                {/* Bottom-right activity (4) */}
                <ActivityClickRegion
                  $active={compActivity.highlightedActivity === 4 && !compActivity.tabFocused}
                  style={{
                    left: '385px',
                    top: '195px',
                    width: '60px',
                    height: '50px',
                  }}
                />
              </>
            )}
            
            {/* === SHOP TAB LAYERS === */}
            {/* Layer 1: Shop option popups (selection highlight boxes) */}
            {/* Frame mapping: tabFocused→frame 1 (none), otherwise highlightedShopItem 0→frame 2, 1→frame 3, 2→frame 4 */}
            <CompShopPopupsLayer
              $frame={compActivity.tabFocused ? 1 : compActivity.highlightedShopItem + 2}
              $visible={compActivity.currentTab === 'shop' && compActivity.phase === 'waiting'}
              style={{
                left: '170px',
                top: '90px',
              }}
            />
            
            {/* Layer 3: Shop options (items with prices - static layer) */}
            <CompShopOptionsLayer
              $visible={compActivity.currentTab === 'shop' && (compActivity.phase === 'booting_fade_in' || compActivity.phase === 'waiting')}
              style={{
                left: '170px',
                top: '90px',
              }}
            />
            
            {/* Anthro intro - Composite 3-layer system */}
            {/* Layer 1 (bottom): Container/background at z-index 305 */}
            <AnthroIntroContainer
              $visible={compActivity.anthroIntroVisible}
              style={{
                left: '170px',
                top: '90px',
              }}
            />
            
            {/* Layer 2 (middle): Dialogue text at z-index 310 */}
            {/* Hide dialogue when book is visible (book takes over the screen) */}
            <AnthroDialogueText
              $visible={compActivity.anthroIntroVisible && !compActivity.bookVisible}
              style={{
                left: '200px',
                top: '110px',
              }}
            >
              <AnthroSpeakerLabel>
                {ANTHRO_INTRO_DIALOGUE[compActivity.anthroDialogueIndex].speaker}
              </AnthroSpeakerLabel>
              <div>{ANTHRO_INTRO_DIALOGUE[compActivity.anthroDialogueIndex].text}</div>
              <AnthroDialogueContinueHint>
                {/* At dialogue 2, show book prompt instead of continue hint */}
                {compActivity.anthroDialogueIndex === 2 
                  ? null  /* Book prompt shown separately below */
                  : (compActivity.anthroDialogueIndex < ANTHRO_INTRO_DIALOGUE.length - 1 ? '(X to continue)' : '(X to close)')}
              </AnthroDialogueContinueHint>
            </AnthroDialogueText>
            
            {/* Book prompt - shows at dialogue index 2 with journal icon */}
            <BookPromptContainer
              $visible={compActivity.anthroIntroVisible && compActivity.anthroDialogueIndex === 2 && !compActivity.bookVisible}
              style={{
                left: '200px',
                top: '230px',
              }}
            >
              <JournalIcon />
              <BookXKeySprite $frame={1} />
              <BookPromptLabel>Open Book</BookPromptLabel>
            </BookPromptContainer>
            
            {/* Layer 3 (top): Anthro character sprite at z-index 311 */}
            {/* Hide anthro sprite when book is visible */}
            {/* Sprite is 39×82px, positioned mid-right within the 300×180 container at (170, 90) */}
            <AnthroIntroLayer
              $frame={compActivity.anthroIntroFrame}
              $visible={compActivity.anthroIntroVisible && !compActivity.bookVisible}
              style={{
                left: '394px',  /* Mid-right: container left (170) + ~180px offset */
                top: '130px',   /* Vertically centered: container top (90) + ~40px offset */
              }}
            />
            
            {/* TBI Positioning viewer - static background with moveable anthro sprite */}
            <TbiPositioningLayer
              $visible={compActivity.tbiPositioningVisible}
              style={{
                left: '170px',
                top: '90px',
              }}
            />
            
            {/* TBI Anthro sprite - 8-frame idle animation, positioned via tbiAnthroX */}
            <TbiAnthroSprite
              $frame={compActivity.tbiAnthroFrame}
              $x={compActivity.tbiAnthroX}
              $visible={compActivity.tbiPositioningVisible}
              style={{
                left: `${170 + compActivity.tbiAnthroX}px`,
                top: `${90 + TBI_ANTHRO_Y}px`,
              }}
            />
            
            {/* TBI Beam-on animation overlay - plays on top of positioning screen */}
            <TbiBeamOnLayer
              $frame={compActivity.tbiBeamFrame}
              $visible={compActivity.tbiBeamVisible}
              style={{
                left: '170px',
                top: '90px',
              }}
            />
            
            {/* TBI Positioning key instructions - show during positioning phase, hide during beam/result */}
            <TbiPositioningIndicator $visible={
              compActivity.tbiPositioningVisible && 
              !compActivity.tbiBeamAnimating &&
              !compActivity.tbiResultVisible
            }>
              <TbiKeyRow>
                <LeftRightArrowKeysSprite $frame={tbiArrowKeysFrame} /> {/* Responds to left/right input */}
                <TbiActionLabel>Position</TbiActionLabel>
              </TbiKeyRow>
              <TbiKeyRow>
                <TbiXKeySprite $frame={1} />
                <TbiActionLabel>Beam On</TbiActionLabel>
              </TbiKeyRow>
            </TbiPositioningIndicator>
            
            {/* TBI Result - Modular layer system with dynamic color bars */}
            {/* Layer 1: Dark backdrop container (same as intro) */}
            <AnthroIntroContainer
              $visible={compActivity.tbiResultVisible}
              style={{
                left: '170px',
                top: '90px',
              }}
            />
            
            {/* Layer 2: Color bars and indicators (positioned per segment, color from lookup table) */}
            <TbiResultDataLayer
              $visible={compActivity.tbiResultVisible}
              style={{
                left: '170px',
                top: '90px',
              }}
            >
              {TBI_SEGMENT_BAR_POSITIONS.map((pos, index) => {
                const positionIndex = getPositionIndexFromX(compActivity.tbiAnthroX);
                const barFrame = TBI_POSITION_RESULTS[positionIndex]?.[index] ?? 0;
                
                if (pos.useSector1) {
                  return (
                    <TbiColorBarSector1
                      key={`sector1-${index}`}
                      $colorFrame={barFrame}
                      $x={pos.x}
                      $y={pos.y}
                    />
                  );
                }
                
                return (
                  <TbiColorBar
                    key={`segment-${index}`}
                    $colorFrame={barFrame}
                    $x={pos.x}
                    $y={pos.y}
                  />
                );
              })}
              
              {/* Position indicators (checkmark/tilde/X) for each segment */}
              {TBI_SEGMENT_INDICATOR_POSITIONS.map((pos, index) => {
                const positionIndex = getPositionIndexFromX(compActivity.tbiAnthroX);
                const barFrame = TBI_POSITION_RESULTS[positionIndex]?.[index] ?? 0;
                const indicatorFrame = getIndicatorFrameFromBarFrame(barFrame);
                
                return (
                  <TbiPositionIndicator
                    key={`indicator-${index}`}
                    $colorFrame={indicatorFrame}
                    $x={pos.x}
                    $y={pos.y}
                  />
                );
              })}
            </TbiResultDataLayer>
            
            {/* Layer 3: Container frame (65×75px positioned sprite, below bars) */}
            <TbiResultBase
              $visible={compActivity.tbiResultVisible}
              $x={TBI_RESULT_BASE_POSITION.x}
              $y={TBI_RESULT_BASE_POSITION.y}
            />
            
            {/* Layer 4: Anthro slab idle (above bars, below mask) - uses frames 38-42 from anthro-intro.png */}
            <TbiResultAnthro
              $visible={compActivity.tbiResultVisible}
              $x={TBI_RESULT_SLAB_POSITION.x}
              $y={TBI_RESULT_SLAB_POSITION.y}
              $frame={compActivity.tbiResultAnthroFrame}
            />
            
            {/* Layer 5: Animated reveal mask */}
            <TbiResultMask
              $frame={compActivity.tbiResultMaskFrame}
              $visible={compActivity.tbiResultVisible}
              $x={TBI_MASK_POSITION.x}
              $y={TBI_MASK_POSITION.y}
            />

            {/* Layer 5: Result dialogue (pass or fail) - appears after mask reveal */}
            <AnthroDialogueText
              $visible={compActivity.tbiResultVisible && compActivity.tbiResultRevealed}
              style={{
                left: '200px',
                top: '110px',
              }}
            >
              <AnthroSpeakerLabel>
                {compActivity.tbiResultPassed 
                  ? ANTHRO_PASS_DIALOGUE[compActivity.tbiResultDialogueIndex]?.speaker 
                  : ANTHRO_FAIL_DIALOGUE[compActivity.tbiResultDialogueIndex]?.speaker}
              </AnthroSpeakerLabel>
              <div>
                {compActivity.tbiResultPassed 
                  ? ANTHRO_PASS_DIALOGUE[compActivity.tbiResultDialogueIndex]?.text 
                  : ANTHRO_FAIL_DIALOGUE[compActivity.tbiResultDialogueIndex]?.text}
              </div>
              <AnthroDialogueContinueHint>
                {compActivity.tbiResultPassed 
                  ? (compActivity.tbiResultDialogueIndex < ANTHRO_PASS_DIALOGUE.length - 1 ? '(X to continue)' : '(X to close)')
                  : (compActivity.tbiResultDialogueIndex < ANTHRO_FAIL_DIALOGUE.length - 1 ? '(X to continue)' : '(X to retry)')}
              </AnthroDialogueContinueHint>
            </AnthroDialogueText>
            
            {/* Locked message - appears when trying to select locked activities */}
            <LockedMessageBox
              $visible={showLockedMessage && compActivity.phase === 'waiting'}
              style={{
                left: '260px',
                top: '180px',
              }}
            >
              Module locked
            </LockedMessageBox>
          </>
        )}
        
        {/* Sky view interaction indicator - fixed at bottom center, shows X (Inspect) and C (Return) keys */}
        <SkyInteractionIndicator $visible={currentView === 'sky' && !showStarDetail && !cutscene.isPlaying && !showMonologue}>
          <SkyKeyRow>
            <SkyXKeySprite $frame={1} />
            <SkyActionLabel>Inspect</SkyActionLabel>
          </SkyKeyRow>
          <SkyKeyRow>
            <SkyCKeySprite $frame={1} />
            <SkyActionLabel>Return</SkyActionLabel>
          </SkyKeyRow>
        </SkyInteractionIndicator>
        
        {/* Desk activity interaction indicator - fixed at bottom center during desk activities */}
        {/* Hidden when TBI activity is in intro, positioning, or result phases */}
        <DeskInteractionIndicator $visible={
          compActivity.visible && 
          !compActivity.anthroIntroVisible && 
          !compActivity.tbiPositioningVisible && 
          !compActivity.tbiResultVisible
        }>
          <DeskKeyRow>
            <DeskXKeySprite $frame={deskXKeyFrame} />
            <DeskActionLabel>Select</DeskActionLabel>
          </DeskKeyRow>
          <DeskKeyRow>
            <DeskCKeySprite $frame={deskCKeyFrame} />
            <DeskActionLabel>Close</DeskActionLabel>
          </DeskKeyRow>
        </DeskInteractionIndicator>
        
        {/* Book popup - slides up from bottom when opened (accessible from anywhere via ESC) */}
        <BookPopupContainer
          $visible={compActivity.bookVisible}
          $shaking={compActivity.bookShaking}
        />
        
        {/* Book instruction bar - shows when book is open */}
        <BookInstructionBar $visible={compActivity.bookVisible}>
          <BookKeyRow>
            <BookArrowKeysSprite $frame={1} />
            <BookActionLabel>Pages</BookActionLabel>
          </BookKeyRow>
          <BookKeyRow>
            <BookCKeySprite $frame={1} />
            <BookActionLabel>Close</BookActionLabel>
          </BookKeyRow>
        </BookInstructionBar>
        
        {/* "No more pages" error message */}
        <NoMorePagesMessage $visible={compActivity.showNoMorePages}>
          No more pages
        </NoMorePagesMessage>
        
        {/* Reward items - shows at pass dialogue index 2, animates to top-right corner */}
        <RewardItemsContainer
          $visible={compActivity.rewardItemsVisible && compActivity.tbiResultPassed && compActivity.tbiResultDialogueIndex === 2}
          $claiming={compActivity.rewardItemsClaiming}
        >
          <RewardItem>
            <RewardCount>8</RewardCount>
            <FundingSprite />
          </RewardItem>
          <RewardItem>
            <PageSprite />
          </RewardItem>
          <RewardXKeySprite $frame={1} />
          <RewardClaimLabel>Claim</RewardClaimLabel>
        </RewardItemsContainer>
        
        {/* Journal flying to corner - animates when book is first closed */}
        <JournalFlyingIcon $animating={compActivity.journalCornerAnimating} />
        
        {/* Persistent journal icon in top-right corner - appears after journal is collected */}
        <JournalCornerIcon $visible={compActivity.journalCollected && !compActivity.bookVisible} />
        
      </JumboViewport>

      {/* Boom effect overlay (full-screen flash + pulse during cutscene) */}
      <BoomEffectOverlay $visible={cutscene.showBoomEffect} />

      {/* Cinematic letterbox bars - slide in AFTER scroll completes, during cutscene only */}
      <CinematicLetterbox $visible={cutscene.isPlaying} $position="top" />
      <CinematicLetterbox $visible={cutscene.isPlaying} $position="bottom" />

      {/* Intro fade overlay - fades from black when scene loads */}
      <IntroFadeOverlay $visible={introFadeVisible} />

    </>
  );
}