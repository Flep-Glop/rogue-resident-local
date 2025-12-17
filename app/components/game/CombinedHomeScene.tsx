'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useGameStore } from '@/app/store/gameStore';

import ParallaxRenderer from './ParallaxRenderer';
import StarDetailModal from '@/app/components/ui/StarDetailModal';

// Import keyboard controls hook
import { useKeyboardControls, calculateActivityNavigation, KeyboardState, KeyboardActions } from './useKeyboardControls';

// Import debug modes hook
import { useDebugModes, DebugModeSetters } from './useDebugModes';

// Import Kapoor movement hook
import { useKapoorMovement, KapoorMovementCallbacks } from './useKapoorMovement';

// Import constants and types
import {
  StarIdType,
  SkyHighlightType,
  InteractionType,
  PICO_POSITION,
  TELESCOPE_POSITION,
  DESK_POSITION,
  PRIMAREUS_POSITION,
  KAPOOR_START_POSITION,
  GROUND_FLOOR_Y,
  SECOND_FLOOR_Y,
  PROXIMITY_THRESHOLD,
  PICO_LEFT_EXTENSION,
  ANTHRO_INTRO_TOTAL_FRAMES,
  TBI_POSITIONING_TOTAL_FRAMES,
  STAR_NAMES,
  MONOLOGUE_LINES,
  PICO_DIALOGUE_LINES,
  PICO_BLOCKING_DIALOGUE,
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
  FLOOR_TOLERANCE,
  SLOW_SCROLL_DURATION,
} from './CombinedHomeScene.constants';

// Import all styled components and constants from styles file
import {
  HOME_INTERNAL_WIDTH,
  HOME_INTERNAL_HEIGHT,
  JUMBO_ASSET_HEIGHT,
  DEBUG_CLICKBOXES,
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
  ClickableArea,
  DebugLabel,
  ExclamationIndicator,
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
  KapoorMonologue,
  KapoorSpeakerLabel,
  KapoorContinueHint,
  PicoSprite,
  SpeechBubbleSprite,
  PicoDialogueText,
  PicoSpeakerLabel,
  PicoContinueHint,
  PetDescriptionBox,
  CompMonitorLayer,
  CompScreenLayer,
  CompActivityLayer,
  CompOptionsLayer,
  CompOption1Layer,
  CompSheetBackdrop,
  ActivityClickRegion,
  AnthroIntroLayer,
  TbiPositioningLayer,
  TbiResultLayer,
  BoundaryLine,
  BoundaryLabel,
  BoundaryFloorIndicator,
} from './CombinedHomeScene.styles';

export default function CombinedHomeScene() {
  const { 
    hasCompletedFirstActivity, 
    hasSeenConstellationCutscene,
    setHasCompletedFirstActivity,
    setHasSeenConstellationCutscene
  } = useGameStore();
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
  
  
  // Kapoor monologue for ??? star inspection
  const [inspectionCount, setInspectionCount] = useState(0); // 0 = not started, 1 = first time, 2 = second time, 3+ = completed
  const [currentMonologueLineIndex, setCurrentMonologueLineIndex] = useState(0);
  const [showMonologue, setShowMonologue] = useState(false);
  
  
  // Telescope speech bubble state
  const [telescopeSpeechBubbleVisible, setTelescopeSpeechBubbleVisible] = useState(true); // Start visible
  const [telescopeSpeechBubbleHighlighted, setTelescopeSpeechBubbleHighlighted] = useState(false);
  const [telescopeSpeechBubbleFrame, setTelescopeSpeechBubbleFrame] = useState(1);
  
  // Star speech bubble state
  const [starSpeechBubbleVisible, setStarSpeechBubbleVisible] = useState(true); // Always visible
  const [starSpeechBubbleHighlighted, setStarSpeechBubbleHighlighted] = useState(false);
  const [starSpeechBubbleFrame, setStarSpeechBubbleFrame] = useState(1);
  
  // Desk speech bubble state
  const [deskSpeechBubbleVisible, setDeskSpeechBubbleVisible] = useState(false);
  const [deskSpeechBubbleHighlighted, setDeskSpeechBubbleHighlighted] = useState(false);
  const [deskSpeechBubbleFrame, setDeskSpeechBubbleFrame] = useState(1);
  
  // Navigation arrow hover states
  const [upperBandHovered, setUpperBandHovered] = useState(false);
  const [skyBandHovered, setSkyBandHovered] = useState(false);
  
  
  // Keys pressed ref for keyboard controls (shared between keyboard controls and Kapoor movement)
  const keysPressed = useRef<Set<string>>(new Set());
  
  // Pico character animation state
  const [picoFrame, setPicoFrame] = useState(0);
  const [picoIsTalking, setPicoIsTalking] = useState(false);
  const [picoSpeechBubbleVisible, setPicoSpeechBubbleVisible] = useState(true); // Always visible until interaction
  const [picoSpeechBubbleHighlighted, setPicoSpeechBubbleHighlighted] = useState(false); // Highlighted when Kapoor is near
  const [picoSpeechBubbleFrame, setPicoSpeechBubbleFrame] = useState(1); // 1-4: animation frames
  const [picoInteracted, setPicoInteracted] = useState(false); // Track if Pico has been talked to
  const [showPicoDialogue, setShowPicoDialogue] = useState(false); // Show dialogue overlay
  const [picoDialogueIndex, setPicoDialogueIndex] = useState(0); // Current dialogue line (0-3)
  const picoAnimationRef = useRef<NodeJS.Timeout | null>(null);
  const [showPetDescription, setShowPetDescription] = useState(false); // Show pet description textbox
  const [showPicoBlockingDialogue, setShowPicoBlockingDialogue] = useState(false); // Show blocking dialogue when trying to climb without talking
  const [picoBlockingDialogueIndex, setPicoBlockingDialogueIndex] = useState(0); // Current blocking dialogue line (0-1)
  const [hasShownFirstBlockingMessage, setHasShownFirstBlockingMessage] = useState(false); // Track if we've shown the first blocking message
  
  // === KAPOOR MOVEMENT HOOK ===
  const kapoorMovementCallbacks: KapoorMovementCallbacks = useMemo(() => ({
    onClimbBlocked: () => {
      console.log('[CombinedHomeScene] Pico blocks ladder - showing dialogue');
      if (!hasShownFirstBlockingMessage) {
        setPicoBlockingDialogueIndex(0); // Start with first message
      } else {
        setPicoBlockingDialogueIndex(1); // Skip to second message for repeat offenders
      }
      setShowPicoBlockingDialogue(true);
      setPicoIsTalking(true);
    },
  }), [hasShownFirstBlockingMessage]);
  
  const {
    state: kapoorState,
    setters: kapoorSetters,
  } = useKapoorMovement({
    keysPressed,
    currentView,
    picoInteracted,
    isClimbBlocked: showPicoBlockingDialogue,
    hasShownFirstBlockingMessage,
    callbacks: kapoorMovementCallbacks,
  });
  
  // Destructure for convenience throughout component
  const { position: kapoorPosition, direction: kapoorDirection, frame: kapoorFrame, isWalking: kapoorIsWalking, isClimbing: kapoorIsClimbing } = kapoorState;
  const { setPosition: setKapoorPosition, setDirection: setKapoorDirection, setIsWalking: setKapoorIsWalking, setIsClimbing: setKapoorIsClimbing } = kapoorSetters;
  
  // Centralized interaction system - player-following X/C keys with contextual labels
  const [activeInteraction, setActiveInteraction] = useState<InteractionType>(null); // Which object is closest
  const [interactionFrame, setInteractionFrame] = useState(1); // X key frame (1: normal, 3: highlighted)
  const [cKeyFrame, setCKeyFrame] = useState(1); // C key frame (1: normal, 3: highlighted)
  const [contextLabel, setContextLabel] = useState<string>(''); // Dynamic label text ("Look", "Study", "Talk")
  const [upArrowFrame, setUpArrowFrame] = useState(1); // Up arrow frame (1: unhighlighted by default)
  const [downArrowFrame, setDownArrowFrame] = useState(1); // Down arrow frame (1: unhighlighted by default)
  const [showUpArrow, setShowUpArrow] = useState(false); // Show up arrow when near ladder at ground floor
  const [showDownArrow, setShowDownArrow] = useState(false); // Show down arrow when near ladder at second floor
  const picoFrameCountRef = useRef(0);
  const picoFrameTickRef = useRef(0);
  
  
  // Tutorial sprite states
  const [arrowKeysVisible, setArrowKeysVisible] = useState(true); // Show for first 10 seconds
  const [arrowKeysFrame, setArrowKeysFrame] = useState(1); // 1-8: all up, right, left, up, down, all pushed, all up highlighted, all pushed highlighted
  const [xKeyTriggered, setXKeyTriggered] = useState(false); // Track if telescope X key interaction was completed (for cutscene trigger)
  const [deskXKeyTriggered, setDeskXKeyTriggered] = useState(false); // Track if desk X key was used
  const [deskXKeyEnabled, setDeskXKeyEnabled] = useState(false); // Track if desk X key system is enabled (star must be viewed first)
  const sceneStartTimeRef = useRef<number>(Date.now()); // Track when scene started
  
  // Comp-sheet animation states
  const [compSheetVisible, setCompSheetVisible] = useState(false); // Show comp-sheet overlay
  const [compOptionsFrame, setCompOptionsFrame] = useState(1); // Options layer frame (1-7)
  const [compOption1Frame, setCompOption1Frame] = useState(1); // Option1 layer frame (1-5) - autonomous animation
  const [compSheetPhase, setCompSheetPhase] = useState<'idle' | 'booting' | 'booting_fade_in' | 'waiting' | 'transitioning' | 'fading_to_black' | 'intro' | 'intro_fading_to_black' | 'fading_from_black' | 'activity' | 'result_fading_to_black' | 'result_fading_from_black' | 'result'>('idle');
  const compSheetAnimationRef = useRef<NodeJS.Timeout | null>(null);
  const compOption1AnimationRef = useRef<NodeJS.Timeout | null>(null);
  
  // Activity selection state (null = no activity selected, 0-4 = activity index)
  // 0: top-left, 1: top-right, 2: bottom-left, 3: bottom-middle, 4: bottom-right
  const [selectedActivity, setSelectedActivity] = useState<number | null>(null);
  const [hoveredActivity, setHoveredActivity] = useState<number | null>(null);
  const [highlightedActivity, setHighlightedActivity] = useState<number>(0); // For keyboard navigation (0-4)
  
  // Anthro intro dialogue state (shown before TBI positioning)
  const [showAnthroIntro, setShowAnthroIntro] = useState(false);
  const [anthroIntroFrame, setAnthroIntroFrame] = useState(0); // 0-3 for 4 frames
  
  // TBI Positioning viewer state (replaces old quiz system)
  const [showTbiPositioning, setShowTbiPositioning] = useState(false);
  const [tbiPositioningFrame, setTbiPositioningFrame] = useState(0); // 0-15 for 16 frames
  
  // TBI Result animation state (shown after TBI positioning complete)
  const [showTbiResult, setShowTbiResult] = useState(false);
  const [tbiResultFrame, setTbiResultFrame] = useState(0); // 0-12 for 13 frames
  const tbiResultAnimationRef = useRef<NodeJS.Timeout | null>(null);
  
  // Desk activity key indicator frames (always highlighted frame 3)
  const deskXKeyFrame = 1; // Unhighlighted by default (highlights on press)
  const deskCKeyFrame = 1; // Unhighlighted by default (highlights on press)
  
  // Constellation cutscene states
  const [isPlayingCutscene, setIsPlayingCutscene] = useState(false);
  const [isCutsceneScrolling, setIsCutsceneScrolling] = useState(false); // Track scroll transition phase before cutscene
  const [cutscenePhase, setCutscenePhase] = useState<'stars-appearing' | 'building-tension' | 'boom' | 'final-constellation' | 'complete'>('stars-appearing');
  const [cutsceneStars, setCutsceneStars] = useState<Array<{ x: number; y: number; frame: number; opacity: number; frameOffset: number; opacityOffset: number }>>([]);
  const [cutsceneStarOpacity, setCutsceneStarOpacity] = useState(1); // Opacity oscillation for ??? star during cutscene
  const [showBoomEffect, setShowBoomEffect] = useState(false);
  const [showFinalConstellation, setShowFinalConstellation] = useState(false);
  const [constellationStars, setConstellationStars] = useState<Array<{ id: string; x: number; y: number; frame: number; angle?: number; distance?: number; parentId?: string; scale?: number; opacity?: number; zIndex?: number }>>([]);
  
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
  const picoHorizontalOffset = kapoorPosition.x - PICO_POSITION.x;
  const picoDistance = Math.abs(picoHorizontalOffset);
  const picoInteractionRange = picoHorizontalOffset < 0 
    ? (PROXIMITY_THRESHOLD / 2) + PICO_LEFT_EXTENSION 
    : (PROXIMITY_THRESHOLD / 2);
  const isNearPico = picoDistance < picoInteractionRange;
  
  const keyboardState: KeyboardState = useMemo(() => ({
    currentView,
    compSheetVisible,
    compSheetPhase,
    showAnthroIntro,
    anthroIntroFrame,
    anthroIntroTotalFrames: ANTHRO_INTRO_TOTAL_FRAMES,
    showTbiPositioning,
    showTbiResult,
    highlightedActivity,
    showMonologue,
    currentMonologueLineIndex,
    monologueLinesLength: MONOLOGUE_LINES.length,
    showPicoDialogue,
    picoDialogueIndex,
    picoDialogueLinesLength: PICO_DIALOGUE_LINES.length,
    showPicoBlockingDialogue,
    picoBlockingDialogueIndex,
    picoBlockingDialogueLinesLength: PICO_BLOCKING_DIALOGUE.length,
    showStarDetail,
    skyHighlight,
    activeInteraction,
    deskXKeyTriggered,
    xKeyTriggered,
    picoInteracted,
    isNearPico,
    hasCompletedFirstActivity,
    hasSeenConstellationCutscene,
    isPlayingCutscene,
  }), [
    currentView, compSheetVisible, compSheetPhase, showAnthroIntro, anthroIntroFrame,
    showTbiPositioning, showTbiResult, highlightedActivity, showMonologue,
    currentMonologueLineIndex, showPicoDialogue, picoDialogueIndex,
    showPicoBlockingDialogue, picoBlockingDialogueIndex, showStarDetail, skyHighlight,
    activeInteraction, deskXKeyTriggered, xKeyTriggered, picoInteracted, isNearPico,
    hasCompletedFirstActivity, hasSeenConstellationCutscene, isPlayingCutscene,
  ]);
  
  // === KEYBOARD ACTIONS (callbacks for useKeyboardControls hook) ===
  const keyboardActions: KeyboardActions = useMemo(() => ({
    // Comp-sheet actions
    advanceAnthroIntro: () => {
      console.log('[CombinedHomeScene] Advancing intro frame', anthroIntroFrame + 1);
      setAnthroIntroFrame(prev => prev + 1);
    },
    completeAnthroIntro: () => {
      console.log('[CombinedHomeScene] Intro complete, fading to TBI');
      setCompSheetPhase('intro_fading_to_black');
    },
    completeTbiPositioning: () => {
      console.log('[CombinedHomeScene] TBI positioning complete, showing result');
      setCompSheetPhase('result_fading_to_black');
    },
    completeActivityFromResult: () => {
      console.log('[CombinedHomeScene] Completing activity from result');
      handleActivityComplete();
    },
    openDesk: () => {
      console.log('[CombinedHomeScene] Opening desk comp-sheet');
      setInteractionFrame(3);
      setTimeout(() => {
        setDeskXKeyTriggered(true);
        setActiveInteraction(null);
        setCompSheetVisible(true);
        setCompSheetPhase('booting');
        setCompOptionsFrame(1);
        setCompOption1Frame(1);
        setHighlightedActivity(0);
      }, 150);
    },
    selectCompActivity: () => {
      console.log('[CombinedHomeScene] Selecting activity', highlightedActivity);
      setSelectedActivity(highlightedActivity);
      setCompSheetPhase('transitioning');
    },
    closeCompSheet: () => {
      console.log('[CombinedHomeScene] Closing desk activity');
      handleActivityComplete();
    },
    navigateActivity: (direction) => {
      const newActivity = calculateActivityNavigation(highlightedActivity, direction);
      if (newActivity !== null) {
        console.log(`[CombinedHomeScene] Activity navigation: ${highlightedActivity} → ${newActivity}`);
        setHighlightedActivity(newActivity);
      }
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
      setPicoBlockingDialogueIndex(prev => prev + 1);
    },
    dismissPicoBlockingDialogue: () => {
      console.log('[CombinedHomeScene] Dismissing blocking dialogue');
      setShowPicoBlockingDialogue(false);
      setPicoIsTalking(false);
      setKapoorIsClimbing(false);
      setHasShownFirstBlockingMessage(true);
      setTimeout(() => setPicoBlockingDialogueIndex(0), 250);
    },
    advancePicoDialogue: () => {
      console.log('[CombinedHomeScene] Advancing Pico dialogue');
      setPicoDialogueIndex(prev => prev + 1);
    },
    completePicoDialogue: () => {
      console.log('[CombinedHomeScene] Pico dialogue complete');
      setShowPicoDialogue(false);
      setPicoInteracted(true);
      setPicoIsTalking(false);
      setTimeout(() => setPicoDialogueIndex(0), 250);
    },
    startPicoDialogue: () => {
      console.log('[CombinedHomeScene] Starting Pico dialogue');
      setInteractionFrame(3);
      setTimeout(() => {
        setPicoSpeechBubbleVisible(false);
        setShowPicoDialogue(true);
        setPicoDialogueIndex(0);
        setPicoIsTalking(true);
      }, 150);
    },
    petPico: () => {
      console.log('[CombinedHomeScene] Petting Pico');
      setCKeyFrame(3);
      setTimeout(() => {
        setShowPetDescription(true);
        setTimeout(() => {
          setShowPetDescription(false);
          setCKeyFrame(1);
        }, 3000);
      }, 150);
    },
    
    // Telescope actions
    triggerTelescope: () => {
      const shouldPlayCutscene = hasCompletedFirstActivity && !hasSeenConstellationCutscene;
      console.log(`[CombinedHomeScene] Telescope triggered - ${shouldPlayCutscene ? 'CUTSCENE' : 'slow scroll'}`);
      
      setInteractionFrame(3);
      setTimeout(() => {
        setActiveInteraction(null);
        setXKeyTriggered(true);
        
        if (shouldPlayCutscene) {
          setIsCutsceneScrolling(true);
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
              setIsCutsceneScrolling(false);
              setIsPlayingCutscene(true);
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
    anthroIntroFrame, highlightedActivity, hasCompletedFirstActivity, hasSeenConstellationCutscene,
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
    if (!isPlayingCutscene) return;
    
    console.log('[CombinedHomeScene] Starting constellation cutscene sequence...');
    
    // Phase 1: Stars appearing (0-2 seconds) - gradual appearance with pulsation
    setCutscenePhase('stars-appearing');
    setCutsceneStars(randomCutsceneStars);
    
    // Phase 2: Building tension (2-5 seconds) - faster pulsation
    setTimeout(() => {
      console.log('[CombinedHomeScene] Cutscene: Building tension...');
      setCutscenePhase('building-tension');
    }, 2000);
    
    // Phase 3: Boom effect! (5-5.5 seconds) - screen flash and pulse
    setTimeout(() => {
      console.log('[CombinedHomeScene] Cutscene: BOOM!');
      setCutscenePhase('boom');
      setShowBoomEffect(true);
      
      // Hide boom effect after 500ms
      setTimeout(() => {
        setShowBoomEffect(false);
      }, 500);
    }, 5000);
    
    // Phase 4: Stars disappear, final constellation appears (5.5-6.5 seconds)
    setTimeout(() => {
      console.log('[CombinedHomeScene] Cutscene: Revealing final constellation...');
      setCutsceneStars([]); // Clear random stars
      setCutscenePhase('final-constellation');
      setShowFinalConstellation(true);
      
      // Set up the constellation (TBI planet at center + orbiting moons for subtopics)
      // NOW USES PLANETARY-SHEET.PNG (like debug planetary systems)
      // Planetary sheet: Set 0, Type 0 = small moon (frame 0), Type 1 = normal moon (frame 1), Type 2 = planet (frame 2)
      // Start with frame 0, will animate through 0-2 and land on final frames
      // Planet at center with moons orbiting around it
      // Calculate angle and distance for each moon for orbital animation
      const createMoon = (id: string, offsetX: number, offsetY: number) => {
        const x = PRIMAREUS_POSITION.x + offsetX;
        const y = PRIMAREUS_POSITION.y + offsetY;
        const angle = Math.atan2(offsetY, offsetX); // Calculate initial angle
        const distance = Math.sqrt(offsetX * offsetX + offsetY * offsetY); // Calculate distance from center
        return { id, x, y, frame: 0, angle, distance, parentId: 'tbi' }; // Moons have parentId for orbital logic
      };
      
      setConstellationStars([
        { id: 'tbi', x: PRIMAREUS_POSITION.x, y: PRIMAREUS_POSITION.y, frame: 0 }, // Center planet (TBI) - no angle/distance/parentId
        createMoon('tbi_patient_setup', -20, 0), // Orbiting moon
      ]);
      
      // Animate through frames 0-2 and land on final frames (0 for moons, 2 for TBI planet)
      let animationFrame = 0;
      const animationInterval = setInterval(() => {
        animationFrame++;
        
        if (animationFrame <= 2) {
          // Frames 0, 1, 2
          setConstellationStars(prev => prev.map(star => ({
            ...star,
            frame: animationFrame
          })));
        } else {
          // Land on final frames - all moons use frame 0 (small moon), TBI planet uses frame 2 (planet)
          setConstellationStars(prev => prev.map(star => ({
            ...star,
            frame: star.id === 'tbi' ? 2 : 0
          })));
          clearInterval(animationInterval);
        }
      }, 200); // 200ms per frame
    }, 5500);
    
    // Phase 5: Complete - allow navigation (6.5+ seconds)
    setTimeout(() => {
      console.log('[CombinedHomeScene] Cutscene: Complete!');
      setCutscenePhase('complete');
      setIsPlayingCutscene(false);
      // Set TBI as the highlighted planet after cutscene
      setSkyHighlight('tbi');
      // Reset cutscene star opacity to full
      setCutsceneStarOpacity(1);
    }, 6500);
    
  }, [isPlayingCutscene, randomCutsceneStars]);

  // === CUTSCENE ??? STAR OPACITY ANIMATION ===
  useEffect(() => {
    if (!isPlayingCutscene) return;
    
    const speed = cutscenePhase === 'building-tension' ? 100 : 200; // Faster during tension
    let opacityCounter = 0;
    
    const interval = setInterval(() => {
      opacityCounter++;
      // Oscillate opacity between 0.3 and 1.0 using sine wave
      const opacityPhase = (opacityCounter * 0.1) % (Math.PI * 2);
      const newOpacity = 0.3 + 0.7 * Math.abs(Math.sin(opacityPhase));
      setCutsceneStarOpacity(newOpacity);
    }, speed);
    
    return () => clearInterval(interval);
  }, [isPlayingCutscene, cutscenePhase]);

  // === CONSTELLATION ORBITAL ANIMATION (3D EFFECT) ===
  useEffect(() => {
    if (!showFinalConstellation) return;
    
    const ORBIT_SPEED = 0.008; // Radians per frame (slower = more majestic)
    const ELLIPSE_RATIO = 0.5; // Vertical compression for 3D perspective (0.5 = flattened ellipse)
    const MIN_SCALE = 0.7; // Minimum scale when star is farthest (back of orbit)
    const MAX_SCALE = 1.3; // Maximum scale when star is closest (front of orbit)
    const MIN_OPACITY = 0.6; // Minimum opacity when star is farthest
    const MAX_OPACITY = 1.0; // Maximum opacity when star is closest
    
    const interval = setInterval(() => {
      setConstellationStars(prev => {
        // Create lookup map for planet positions
        const planetPositions = new Map<string, { x: number; y: number }>();
        prev.forEach(body => {
          if (!body.parentId) {
            // This is a planet (no parent), store its position
            planetPositions.set(body.id, { x: body.x, y: body.y });
          }
        });
        
        return prev.map(body => {
          // Skip bodies without orbital properties (planets)
          if (!body.angle || !body.distance || !body.parentId) {
            // This is a planet - check if it's highlighted for z-index elevation
            const isHighlighted = skyHighlightRef.current === body.id;
            const planetZIndex = isHighlighted ? 100 : 3; // Elevated planets pop above clouds/abyss
            return {
              ...body,
              zIndex: planetZIndex,
            };
          }
          
          // Find the parent planet's position
          const parentPos = planetPositions.get(body.parentId);
          if (!parentPos) {
            console.warn(`[Orbital Animation] Parent planet "${body.parentId}" not found for moon "${body.id}"`);
            return body;
          }
          
          // Update the angle for this moon
          const newAngle = body.angle + ORBIT_SPEED;
          
          // Calculate new position with elliptical orbit around parent planet
          const newX = parentPos.x + Math.cos(newAngle) * body.distance;
          const newY = parentPos.y + Math.sin(newAngle) * body.distance * ELLIPSE_RATIO;
          
          // Calculate z-depth based on sine of angle (creates front-to-back motion)
          const zDepth = Math.sin(newAngle);
          
          // Map z-depth to scale (closer = bigger)
          const scale = MIN_SCALE + ((zDepth + 1) / 2) * (MAX_SCALE - MIN_SCALE);
          
          // Map z-depth to opacity (closer = more opaque)
          const opacity = MIN_OPACITY + ((zDepth + 1) / 2) * (MAX_OPACITY - MIN_OPACITY);
          
          // Calculate z-index based on parent highlight status and orbital depth
          // If parent planet is highlighted, elevate entire system above abyss/purple-abyss (z-index 100-102)
          // Otherwise, render under clouds (z-index 2-3)
          const isParentHighlighted = skyHighlightRef.current === body.parentId;
          const zIndex = isParentHighlighted 
            ? (zDepth < 0 ? 100 : 102)  // Elevated system: moons behind planet at 100, in front at 102
            : (zDepth < 0 ? 2 : 3);     // Normal system: under clouds
          
          return {
            ...body,
            angle: newAngle,
            x: newX,
            y: newY,
            scale,
            opacity,
            zIndex,
          };
        });
      });
    }, 16); // ~60fps
    
    return () => clearInterval(interval);
  }, [showFinalConstellation]);

  // === REMOVED: TINY STAR ORBITAL ANIMATION ===
  // (Previously orbited around HDR star, no longer needed in planet-and-moons system)

  const handleBedClick = () => {
    console.log('[CombinedHomeScene] Bed clicked');
    // Bed interaction is currently a no-op - can be extended for sleep/rest mechanics
  };


  const handleCloseStarDetail = () => {
    setShowStarDetail(false);
    
    // If closing ??? star modal, show monologue immediately (no delay to prevent UI flicker)
    if (activeStarId === 'star') {
      // Increment inspection count and reset to first line
      setInspectionCount(prev => prev + 1);
      setCurrentMonologueLineIndex(0);
      setShowMonologue(true);
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

  // Activity interaction - handle activity selection from comp-sheet
  const handleActivitySelect = (activityIndex: number) => {
    console.log('[CombinedHomeScene] Activity selected:', activityIndex);
    setSelectedActivity(activityIndex);
    setCompSheetPhase('transitioning');
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
    
    // Hide everything and reset
    setCompSheetVisible(false);
    setShowTbiPositioning(false);
    setShowTbiResult(false);
    
    // Reset all activity state
    setTimeout(() => {
      setTbiPositioningFrame(0); // Reset to first frame
      setTbiResultFrame(0); // Reset result to first frame
      setCompSheetPhase('idle');
      setCompOptionsFrame(1);
      setCompOption1Frame(1);
      setDeskXKeyTriggered(false); // Reset so desk can be used again
      
      // Reset activity selection state
      setSelectedActivity(null);
      setHoveredActivity(null);
      setHighlightedActivity(0);
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

  const handleTelescopeClick = () => {
    if (currentView === 'home') {
      console.log('[CombinedHomeScene] Telescope clicked - scrolling to sky view');
      scrollToSky();
    }
    // When already in sky view, telescope click does nothing (use ladder to return home)
  };

  // New handler for ladder (to scroll back to home from sky)
  const handleLadderClick = () => {
    console.log('[CombinedHomeScene] Ladder clicked - scrolling to home view');
    scrollToHome();
  };

  // Removed hover handlers - no longer needed without tooltips

  // Tutorial: First-time home visit guidance (prevent multiple executions)
  const hasProcessedRef = useRef(false);
  const hasShownWelcomeRef = useRef(false);
  const pingPongIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Ref to track base animation cycle (0, 1, 2 for frames 2, 3, 4)
  const sparkleAnimationCycle = useRef(0);
  
  // Refs to track current view, sky highlight state, and cutscene state for interval access
  const currentViewRef = useRef(currentView);
  const skyHighlightRef = useRef(skyHighlight);
  const isPlayingCutsceneRef = useRef(isPlayingCutscene);
  const isCutsceneScrollingRef = useRef(isCutsceneScrolling);
  const constellationStarsRef = useRef(constellationStars);
  
  // Update refs when states change
  useEffect(() => {
    currentViewRef.current = currentView;
    skyHighlightRef.current = skyHighlight;
    isPlayingCutsceneRef.current = isPlayingCutscene;
    isCutsceneScrollingRef.current = isCutsceneScrolling;
    constellationStarsRef.current = constellationStars;
  }, [currentView, skyHighlight, isPlayingCutscene, isCutsceneScrolling, constellationStars]);
  
  // === DEBUG MODES HOOK ===
  const debugModeSetters: DebugModeSetters = {
    setKapoorPosition,
    setKapoorDirection,
    setKapoorIsWalking,
    setDeskXKeyEnabled,
    setArrowKeysVisible,
    setHasCompletedFirstActivity,
    setHasSeenConstellationCutscene,
    setShowFinalConstellation,
    setConstellationStars,
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
    setStarSpeechBubbleVisible(
      currentView === 'sky' && 
      !showFinalConstellation && 
      !isPlayingCutscene && 
      !showStarDetail && // Hide when modal is open
      !showMonologue && // Hide when monologue is showing
      !deskXKeyEnabled // Hide after first inspection (star has been viewed)
    );
  }, [currentView, showFinalConstellation, isPlayingCutscene, showStarDetail, showMonologue, deskXKeyEnabled]);
  
  // === STAR PROXIMITY DETECTION (for speech bubble highlighting in sky view) ===
  useEffect(() => {
    if (currentView !== 'sky' || !starSpeechBubbleVisible) {
      setStarSpeechBubbleHighlighted(false);
      return;
    }
    
    // In sky view, highlight when star is selected in navigation
    setStarSpeechBubbleHighlighted(skyHighlight === 'star');
  }, [currentView, skyHighlight, starSpeechBubbleVisible]);
  
  // === STAR SPEECH BUBBLE ANIMATION ===
  useEffect(() => {
    if (!starSpeechBubbleVisible) return;
    
    let bubbleFrameCount = 1;
    
    const animateBubble = () => {
      bubbleFrameCount = (bubbleFrameCount % 4) + 1; // Cycle 1-4
      setStarSpeechBubbleFrame(bubbleFrameCount);
    };
    
    const bubbleInterval = setInterval(animateBubble, BUBBLE_FRAME_SPEED);
    
    return () => clearInterval(bubbleInterval);
  }, [starSpeechBubbleVisible]);
  
  // Comp-sheet options layer animation - show highlighted frame based on hover/highlight state
  useEffect(() => {
    if (compSheetPhase === 'waiting') {
      console.log('[CombinedHomeScene] Comp-sheet waiting - updating options layer frame');
      
      // Check if any activity is hovered/highlighted
      if (hoveredActivity !== null || highlightedActivity !== null) {
        // Show highlighted frame (2-6 based on activity index 0-4)
        const activityIndex = hoveredActivity !== null ? hoveredActivity : highlightedActivity;
        setCompOptionsFrame(2 + activityIndex); // Frames 2-6 for activities 0-4
      } else {
        // No hover/highlight - show frame 1 (none highlighted)
        setCompOptionsFrame(1);
      }
    }
  }, [compSheetPhase, hoveredActivity, highlightedActivity]);
  
  // Comp-sheet option1 layer autonomous animation - loop frames 1-5 with longer linger on frame 1
  useEffect(() => {
    if (compSheetPhase === 'waiting') {
      console.log('[CombinedHomeScene] Starting option1 layer autonomous animation');
      
      let currentFrame = 1;
      setCompOption1Frame(currentFrame);
      
      const animateFrame = () => {
        if (currentFrame === 1) {
          // Linger on frame 1 for 1 second
          compOption1AnimationRef.current = setTimeout(() => {
            currentFrame = 2;
            setCompOption1Frame(currentFrame);
            animateFrame(); // Continue animation
          }, 1000) as unknown as NodeJS.Timeout;
        } else {
          // Advance through frames 2-5 quickly
          compOption1AnimationRef.current = setTimeout(() => {
            currentFrame++;
            if (currentFrame > 5) {
              currentFrame = 1; // Loop back to frame 1
            }
            setCompOption1Frame(currentFrame);
            animateFrame(); // Continue animation
          }, 150) as unknown as NodeJS.Timeout;
        }
      };
      
      animateFrame(); // Start the animation loop
      
      return () => {
        if (compOption1AnimationRef.current) {
          clearTimeout(compOption1AnimationRef.current);
          compOption1AnimationRef.current = null;
        }
      };
    }
  }, [compSheetPhase]);
  
  // Comp-sheet phase transitions - handles boot-up and activity transitions with fade effects
  useEffect(() => {
    // === BOOT-UP PHASES (opening the computer) ===
    // Phase: Booting - monitor visible with black fill, wait briefly then start fade in
    if (compSheetPhase === 'booting') {
      console.log('[CombinedHomeScene] Computer booting - showing black monitor');
      setTimeout(() => {
        console.log('[CombinedHomeScene] Boot fade in - showing blue screen + menu');
        setCompSheetPhase('booting_fade_in');
      }, 300); // Hold on black monitor briefly
    }
    
    // Phase: Booting fade in - screen + menu layers fade in, then ready for interaction
    if (compSheetPhase === 'booting_fade_in') {
      setTimeout(() => {
        console.log('[CombinedHomeScene] Boot complete - ready for interaction');
        setCompSheetPhase('waiting');
      }, 350); // Wait for fade in transition
    }
    
    // === ACTIVITY TRANSITION PHASES (selecting an activity) ===
    if (compSheetPhase === 'transitioning') {
      console.log('[CombinedHomeScene] Starting comp-sheet transition animation');
      
      // Clear any existing animations
      if (compOption1AnimationRef.current) {
        clearTimeout(compOption1AnimationRef.current);
        compOption1AnimationRef.current = null;
      }
      
      // Show pressed state (options layer frame 7) briefly
      setCompOptionsFrame(7);
      
      // After 150ms, start fading to black (menu layers + screen fade out)
      setTimeout(() => {
        console.log('[CombinedHomeScene] Fading to black - hiding menu layers');
        setCompSheetPhase('fading_to_black');
      }, 150);
    }
    
    // Phase: Fading to black - wait for screen to fade out, then show intro
    if (compSheetPhase === 'fading_to_black') {
      setTimeout(() => {
        console.log('[CombinedHomeScene] Fading from black - showing Anthro intro');
        setShowAnthroIntro(true);
        setAnthroIntroFrame(0); // Start at first frame
        setCompSheetPhase('intro');
      }, 350); // Wait for screen layer fade out transition
    }
    
    // Phase: Intro fading to black - after intro complete, fade out then show TBI
    if (compSheetPhase === 'intro_fading_to_black') {
      setTimeout(() => {
        console.log('[CombinedHomeScene] Intro complete - showing TBI positioning');
        setShowAnthroIntro(false); // Hide intro
        setShowTbiPositioning(true);
        setTbiPositioningFrame(0); // Start at first frame
        setCompSheetPhase('fading_from_black');
      }, 350); // Wait for intro fade out transition
    }
    
    // Phase: Fading from black - wait for dark screen + TBI to fade in, then complete
    if (compSheetPhase === 'fading_from_black') {
      setTimeout(() => {
        console.log('[CombinedHomeScene] Transition complete - activity phase');
        setCompSheetPhase('activity');
      }, 350); // Wait for fade in transition
    }
    
    // === RESULT TRANSITION PHASES (after TBI positioning complete) ===
    // Phase: Result fading to black - hide TBI, then show result
    if (compSheetPhase === 'result_fading_to_black') {
      setTimeout(() => {
        console.log('[CombinedHomeScene] TBI faded out - showing result animation');
        setShowTbiPositioning(false); // Hide TBI positioning
        setShowTbiResult(true);
        setTbiResultFrame(0); // Start at first frame
        setCompSheetPhase('result_fading_from_black');
      }, 350); // Wait for TBI fade out transition
    }
    
    // Phase: Result fading from black - wait for result to fade in, then start animation
    if (compSheetPhase === 'result_fading_from_black') {
      setTimeout(() => {
        console.log('[CombinedHomeScene] Result faded in - starting animation');
        setCompSheetPhase('result');
        
        // Start result animation: play frames 0-10 at 500ms each, then land on frame 11
        let currentFrame = 0;
        const animateResult = () => {
          if (currentFrame < 11) {
            // Play frames 0-10
            currentFrame++;
            setTbiResultFrame(currentFrame);
            tbiResultAnimationRef.current = setTimeout(animateResult, 500);
          } else {
            // Animation complete - land on frame 11 (or 12)
            console.log('[CombinedHomeScene] Result animation complete - landed on frame 11');
            setTbiResultFrame(11); // Final frame (can be 11 or 12)
          }
        };
        
        // Start animation after a brief pause
        tbiResultAnimationRef.current = setTimeout(animateResult, 500);
      }, 350); // Wait for fade in transition
    }
  }, [compSheetPhase]);
  
  // Cleanup interval on component unmount
  useEffect(() => {
    return () => {
      if (pingPongIntervalRef.current) {
        // Cleaning up star animation interval
        clearInterval(pingPongIntervalRef.current);
        pingPongIntervalRef.current = null;
      }
      // Note: Kapoor animation is now cleaned up by useKapoorMovement hook
      if (compOption1AnimationRef.current) {
        clearTimeout(compOption1AnimationRef.current);
        compOption1AnimationRef.current = null;
      }
      if (tbiResultAnimationRef.current) {
        clearTimeout(tbiResultAnimationRef.current);
        tbiResultAnimationRef.current = null;
      }
    };
  }, []);
  
  // Arrow keys visibility timer - hide after 10 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      console.log('[CombinedHomeScene] 10 seconds elapsed - hiding arrow keys tutorial');
      setArrowKeysVisible(false);
    }, 10000);
    
    return () => clearTimeout(timer);
  }, []);

  // TBI Positioning keyboard controls - left/right arrow keys to navigate frames
  useEffect(() => {
    if (!showTbiPositioning) return; // Only active when TBI positioning is showing

    const handleTbiPositioningKeyDown = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        e.stopPropagation(); // Stop from reaching other handlers
      }

      if (e.key === 'ArrowLeft') {
        setTbiPositioningFrame(prev => Math.min(TBI_POSITIONING_TOTAL_FRAMES - 1, prev + 1));
      } else if (e.key === 'ArrowRight') {
        setTbiPositioningFrame(prev => Math.max(0, prev - 1));
      }
    };

    window.addEventListener('keydown', handleTbiPositioningKeyDown, { capture: true }); // Use capture phase for priority
    return () => window.removeEventListener('keydown', handleTbiPositioningKeyDown, { capture: true });
  }, [showTbiPositioning, TBI_POSITIONING_TOTAL_FRAMES]);
  
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
      setActiveInteraction(null);
      return;
    }
    
    // Calculate distances to all interactive objects
    const telescopeDistance = Math.sqrt(
      Math.pow(kapoorPosition.x - TELESCOPE_POSITION.x, 2) + 
      Math.pow(kapoorPosition.y - TELESCOPE_POSITION.y, 2)
    );
    
    // Desk uses horizontal-only distance (side-view 2D game)
    const deskDistance = Math.abs(kapoorPosition.x - DESK_POSITION.x);
    
    // Pico distance with extended range to the left
    const picoHorizontalOffset = kapoorPosition.x - PICO_POSITION.x;
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
      { type: 'pico', distance: picoDistance, label: 'Talk', enabled: !picoInteracted, range: picoInteractionRange }
    ];
    
    // Filter to only enabled interactions within their respective ranges
    const nearbyInteractions = interactions.filter(i => i.enabled && i.distance < (i.range || INTERACTION_RANGE));
    
    if (nearbyInteractions.length === 0) {
      setActiveInteraction(null);
      return;
    }
    
    // Sort by distance and take closest
    nearbyInteractions.sort((a, b) => a.distance - b.distance);
    const closest = nearbyInteractions[0];
    
    setActiveInteraction(closest.type);
    setContextLabel(closest.label);
    
    // Always show unhighlighted when visible - highlighting happens on key press
    setInteractionFrame(1); // Normal (unhighlighted)
  }, [kapoorPosition, currentView, xKeyTriggered, deskXKeyEnabled, deskXKeyTriggered, picoInteracted]);
  
  // Ladder arrow indicators - show up/down arrows when near ladder
  useEffect(() => {
    // Check if near ladder horizontally
    const nearLadderX = Math.abs(kapoorPosition.x - CLIMB_X_THRESHOLD) < CLIMB_X_TOLERANCE;
    
    // Check floor positions
    const onGroundFloor = Math.abs(kapoorPosition.y - GROUND_FLOOR_Y) < FLOOR_TOLERANCE;
    const onSecondFloor = Math.abs(kapoorPosition.y - SECOND_FLOOR_Y) < FLOOR_TOLERANCE;
    
    // Show up arrow when near ladder at ground floor
    setShowUpArrow(nearLadderX && onGroundFloor && currentView === 'home');
    
    // Show down arrow when near ladder at second floor
    setShowDownArrow(nearLadderX && onSecondFloor && currentView === 'home');
  }, [kapoorPosition, currentView]);

  // === TELESCOPE SPEECH BUBBLE VISIBILITY ===
  // Show telescope in home view initially only (hide after first inspection)
  useEffect(() => {
    if (currentView === 'home' && !deskXKeyEnabled) {
      // In home view before star has been viewed - show bubble (initial state only)
      setTelescopeSpeechBubbleVisible(true);
    } else {
      // All other cases: hide bubble (after first inspection, in sky view, etc.)
      setTelescopeSpeechBubbleVisible(false);
    }
  }, [currentView, deskXKeyEnabled]);
  
  // === DESK SPEECH BUBBLE VISIBILITY ===
  // Show desk speech bubble after viewing the star, but hide after completing first activity
  useEffect(() => {
    setDeskSpeechBubbleVisible(
      currentView === 'home' && 
      deskXKeyEnabled && 
      !hasCompletedFirstActivity && // Hide after completing first activity
      !compSheetVisible // Hide during comp-sheet activity
    );
  }, [currentView, deskXKeyEnabled, hasCompletedFirstActivity, compSheetVisible]);
  
  // === TELESCOPE PROXIMITY DETECTION (for speech bubble highlighting) ===
  useEffect(() => {
    if (!telescopeSpeechBubbleVisible) {
      setTelescopeSpeechBubbleHighlighted(false);
      return;
    }
    
    if (currentView === 'home') {
      // In home view: highlight when Kapoor is near telescope
      const telescopeDistance = Math.sqrt(
        Math.pow(kapoorPosition.x - TELESCOPE_POSITION.x, 2) + 
        Math.pow(kapoorPosition.y - TELESCOPE_POSITION.y, 2)
      );
      const INTERACTION_RANGE = PROXIMITY_THRESHOLD / 2; // Same as X key interaction range
      setTelescopeSpeechBubbleHighlighted(telescopeDistance < INTERACTION_RANGE);
    } else if (currentView === 'sky') {
      // In sky view: highlight when telescope is selected (always highlighted since it's the only "return" option)
      setTelescopeSpeechBubbleHighlighted(true);
    } else {
      setTelescopeSpeechBubbleHighlighted(false);
    }
  }, [currentView, telescopeSpeechBubbleVisible, kapoorPosition]);
  
  // === DESK PROXIMITY DETECTION (for speech bubble highlighting in home view only) ===
  useEffect(() => {
    if (!deskSpeechBubbleVisible || currentView !== 'home') {
      setDeskSpeechBubbleHighlighted(false);
      return;
    }
    
    // In home view: highlight when Kapoor is near desk (horizontal-only for side-view game)
    const deskDistance = Math.abs(kapoorPosition.x - DESK_POSITION.x);
    const INTERACTION_RANGE = PROXIMITY_THRESHOLD / 2; // Same as X key interaction range
    setDeskSpeechBubbleHighlighted(deskDistance < INTERACTION_RANGE);
  }, [currentView, deskSpeechBubbleVisible, kapoorPosition]);
  
  // === TELESCOPE SPEECH BUBBLE ANIMATION ===
  useEffect(() => {
    if (!telescopeSpeechBubbleVisible) return;
    
    let bubbleFrameCount = 1;
    
    const animateBubble = () => {
      bubbleFrameCount = (bubbleFrameCount % 4) + 1; // Cycle 1-4
      setTelescopeSpeechBubbleFrame(bubbleFrameCount);
    };
    
    const bubbleInterval = setInterval(animateBubble, BUBBLE_FRAME_SPEED);
    
    return () => clearInterval(bubbleInterval);
  }, [telescopeSpeechBubbleVisible]);
  
  // === DESK SPEECH BUBBLE ANIMATION ===
  useEffect(() => {
    if (!deskSpeechBubbleVisible) return;
    
    let bubbleFrameCount = 1;
    
    const animateBubble = () => {
      bubbleFrameCount = (bubbleFrameCount % 4) + 1; // Cycle 1-4
      setDeskSpeechBubbleFrame(bubbleFrameCount);
    };
    
    const bubbleInterval = setInterval(animateBubble, BUBBLE_FRAME_SPEED);
    
    return () => clearInterval(bubbleInterval);
  }, [deskSpeechBubbleVisible]);
  
  // C key (Pet) proximity detection for Pico - only shows when in actual interaction range
  useEffect(() => {
    if (currentView !== 'home') {
      setCKeyFrame(1);
      return;
    }
    
    const picoHorizontalOffset = kapoorPosition.x - PICO_POSITION.x;
    const picoDistance = Math.abs(picoHorizontalOffset);
    const INTERACTION_RANGE = PROXIMITY_THRESHOLD / 2; // Same as X key interaction range
    
    // Pico has extended interaction range to the left
    const picoInteractionRange = picoHorizontalOffset < 0 
      ? INTERACTION_RANGE + PICO_LEFT_EXTENSION // Left of Pico - extended range
      : INTERACTION_RANGE; // Right of Pico - normal range
    
    // Only show C key when in actual interaction range (unhighlighted)
    // Highlighting happens on key press to prevent confusion
    if (picoDistance < picoInteractionRange) {
      setCKeyFrame(1); // Normal (unhighlighted)
    } else {
      setCKeyFrame(1); // Not visible when out of range
    }
  }, [kapoorPosition, currentView]);
  
  // === PICO ANIMATION LOOP ===
  useEffect(() => {
    const FRAME_INTERVAL = 16; // ~60fps
    const PICO_IDLE_FRAME_SPEED = 8; // Slower animation for idle
    
    const animatePico = () => {
      // Update animation frame
      picoFrameTickRef.current++;
      if (picoFrameTickRef.current >= PICO_IDLE_FRAME_SPEED) {
        picoFrameTickRef.current = 0;
        picoFrameCountRef.current++;
        setPicoFrame(picoFrameCountRef.current);
      }
    };
    
    // Start animation loop
    picoAnimationRef.current = setInterval(animatePico, FRAME_INTERVAL);
    
    return () => {
      if (picoAnimationRef.current) {
        clearInterval(picoAnimationRef.current);
      }
    };
  }, [picoIsTalking]); // Re-run when talking state changes
  
  // === PICO SPEECH BUBBLE VISIBILITY (always shown until interaction) ===
  useEffect(() => {
    // Show speech bubble if not interacted and in home view
    if (!picoInteracted && currentView === 'home' && !showPicoDialogue) {
      setPicoSpeechBubbleVisible(true);
    } else {
      setPicoSpeechBubbleVisible(false);
    }
  }, [picoInteracted, currentView, showPicoDialogue]);
  
  // === PICO PROXIMITY DETECTION (for speech bubble highlighting) ===
  useEffect(() => {
    if (!picoSpeechBubbleVisible) {
      setPicoSpeechBubbleHighlighted(false);
      return;
    }
    
    const checkPicoProximity = () => {
      // Only check horizontal distance since this is a side-view 2D game
      // (Characters are bottom-aligned but at different y positions)
      const horizontalDistance = Math.abs(kapoorPosition.x - PICO_POSITION.x);
      const picoHorizontalOffset = kapoorPosition.x - PICO_POSITION.x;
      const INTERACTION_RANGE = PROXIMITY_THRESHOLD / 2; // Same as X key interaction range
      
      // Pico has extended interaction range to the left (matches X key handler)
      const picoInteractionRange = picoHorizontalOffset < 0 
        ? INTERACTION_RANGE + PICO_LEFT_EXTENSION // Left of Pico - extended range
        : INTERACTION_RANGE; // Right of Pico - normal range
      
      const isNear = horizontalDistance < picoInteractionRange;
      
      // Debug logging to verify proximity detection
      if (isNear !== picoSpeechBubbleHighlighted) {
        console.log(`[Pico] Horizontal distance: ${horizontalDistance.toFixed(0)}px, Threshold: ${picoInteractionRange.toFixed(0)}px, Highlighting: ${isNear}`);
      }
      
      setPicoSpeechBubbleHighlighted(isNear);
    };
    
    checkPicoProximity();
  }, [kapoorPosition, picoSpeechBubbleVisible, picoSpeechBubbleHighlighted]);
  
  // === SPEECH BUBBLE ANIMATION ===
  useEffect(() => {
    if (!picoSpeechBubbleVisible) return;
    
    let bubbleFrameCount = 1;
    
    const animateBubble = () => {
      bubbleFrameCount = (bubbleFrameCount % 4) + 1; // Cycle 1-4
      setPicoSpeechBubbleFrame(bubbleFrameCount);
    };
    
    const bubbleInterval = setInterval(animateBubble, BUBBLE_FRAME_SPEED);
    
    return () => clearInterval(bubbleInterval);
  }, [picoSpeechBubbleVisible]);
  
  // Simplified tutorial state (no complex guided tour)
  const shownSpotlightsRef = useRef(new Set<string>());

  // Simplified telescope click handler
  const handleTelescopeClickWithTutorial = () => {
    console.log(`[CombinedHomeScene] 🔭 Telescope clicked! currentView=${currentView}`);
    handleTelescopeClick();
  };

  // Simplified bed click handler
  const handleBedClickWithTutorial = () => {
    handleBedClick();
  };

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
            $frame={telescopeSpeechBubbleFrame}
            $visible={telescopeSpeechBubbleVisible}
            $highlighted={telescopeSpeechBubbleHighlighted}
            style={{
              left: `${TELESCOPE_POSITION.x - 16}px`, // Moved 15px left from original -1px position
              top: `${TELESCOPE_POSITION.y - 20}px`,  // Hover above telescope
            }}
          />
          
          {/* Desk speech bubble - shown in home view after viewing star */}
          <SpeechBubbleSprite
            $frame={deskSpeechBubbleFrame}
            $visible={deskSpeechBubbleVisible}
            $highlighted={deskSpeechBubbleHighlighted}
            style={{
              left: `${DESK_POSITION.x - 1}px`, // Center above desk
              top: `${DESK_POSITION.y - 20}px`,  // Hover above desk
            }}
          />
          
          {/* Star sprite - visible until final constellation replaces it */}
          {!showFinalConstellation && (
            <>
              <StarSprite
                $frame={tutorialStarFrame}
                style={{ 
                  left: `${PRIMAREUS_POSITION.x}px`, 
                  top: `${PRIMAREUS_POSITION.y}px`,
                  opacity: isPlayingCutscene ? cutsceneStarOpacity : 1, // Apply oscillating opacity during cutscene
                }}
              />
              
              {/* Speech bubble above star - shown in sky view */}
              <SpeechBubbleSprite
                $frame={starSpeechBubbleFrame}
                $visible={starSpeechBubbleVisible}
                $highlighted={starSpeechBubbleHighlighted}
                style={{
                  left: `${PRIMAREUS_POSITION.x - 1}px`, // Center above star (14px star - 16px bubble, offset 1px left)
                  top: `${PRIMAREUS_POSITION.y - 20}px`,  // Hover above star
                }}
              />
            </>
          )}

          {/* Final constellation - TBI planet at center with orbiting moons */}
          {showFinalConstellation && constellationStars.map((star) => {
            // Determine if this celestial body should be highlighted (not during cutscene)
            // MOONS cannot be highlighted in sky view (only planets) - checked via parentId
            const canHighlight = !star.parentId; // Only bodies without parentId (planets) can be highlighted
            const isHighlighted = !isPlayingCutscene && canHighlight && skyHighlight === star.id;
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
          
          {/* Kapoor animated character - stays visible during scroll transition */}
          <CharacterSprite
                $frame={kapoorFrame}
                $direction={kapoorDirection}
                $isWalking={kapoorIsWalking}
                $isClimbing={kapoorIsClimbing}
                style={{
                  left: `${kapoorPosition.x}px`,
                  // Position relative to ScrollingContent - moves with the home scene during scroll
                  top: `${kapoorPosition.y}px`,
                }}
              />
              
              {/* Pico the cat - idle animation, switches to talking when interacted */}
              <PicoSprite
                $frame={picoFrame}
                $isTalking={picoIsTalking}
                style={{
                  left: `${PICO_POSITION.x}px`,
                  top: `${PICO_POSITION.y}px`,
                }}
              />
              
              {/* Speech bubble above Pico - always visible until interaction, highlights when Kapoor is near */}
              <SpeechBubbleSprite
                $frame={picoSpeechBubbleFrame}
                $visible={picoSpeechBubbleVisible}
                $highlighted={picoSpeechBubbleHighlighted}
                style={{
                  left: `${PICO_POSITION.x + 6}px`, // Center above Pico (28px cat - 16px bubble = 12px / 2 = 6px)
                  top: `${PICO_POSITION.y - 20}px`,  // Hover above Pico's head
                }}
              />
              
              {/* Pico Dialogue Text - Follows the speaking character */}
              <PicoDialogueText 
                $visible={showPicoDialogue}
                style={{
                  // Position text box near the current speaker
                  left: PICO_DIALOGUE_LINES[picoDialogueIndex].speaker === 'Pico' 
                    ? `${PICO_POSITION.x + 10}px`  // 10px to the right of Pico
                    : `${kapoorPosition.x - 90}px`, // 90px to the left of Kapoor (160px width - 70px center offset)
                  top: PICO_DIALOGUE_LINES[picoDialogueIndex].speaker === 'Pico'
                    ? `${PICO_POSITION.y - 80}px`  // Above Pico's head
                    : `${kapoorPosition.y - 65}px`, // Above Kapoor's head (nudged down from -80)
                }}
              >
                <PicoSpeakerLabel>
                  {PICO_DIALOGUE_LINES[picoDialogueIndex].speaker}
                </PicoSpeakerLabel>
                <div>{PICO_DIALOGUE_LINES[picoDialogueIndex].text}</div>
                <PicoContinueHint>
                  {picoDialogueIndex < PICO_DIALOGUE_LINES.length - 1 ? '(X to continue)' : '(X to close)'}
                </PicoContinueHint>
              </PicoDialogueText>
              
              {/* Pico Blocking Dialogue - When player tries to climb without talking first */}
              <PicoDialogueText 
                $visible={showPicoBlockingDialogue}
                style={{
                  // Always positioned near Pico since blocking dialogue is always from Pico
                  left: `${PICO_POSITION.x + 10}px`,  // 10px to the right of Pico
                  top: `${PICO_POSITION.y - 100}px`,  // Above Pico's head (nudged up from -80)
                }}
              >
                <PicoSpeakerLabel>
                  {PICO_BLOCKING_DIALOGUE[picoBlockingDialogueIndex].speaker}
                </PicoSpeakerLabel>
                <div>{PICO_BLOCKING_DIALOGUE[picoBlockingDialogueIndex].text}</div>
                <PicoContinueHint>
                  {picoBlockingDialogueIndex < PICO_BLOCKING_DIALOGUE.length - 1 ? '(X to continue)' : '(X to close)'}
                </PicoContinueHint>
              </PicoDialogueText>
              
              {/* Arrow keys tutorial - hover over Kapoor for first 20 seconds */}
              <ArrowKeysSprite
                $frame={arrowKeysFrame}
                $visible={arrowKeysVisible}
                style={{
                  left: `${kapoorPosition.x - 4}px`, // Center above Kapoor (38px char - 45px sprite = -7px, +3px adjustment)
                  top: `${kapoorPosition.y - 45}px`,  // Hover above Kapoor's head
                }}
              />
              
              {/* Player-following X key - shows when near interactive objects with contextual labels */}
              <XKeySprite
                $frame={interactionFrame}
                $visible={activeInteraction !== null && currentView === 'home' && !showPicoDialogue && !showPicoBlockingDialogue && !compSheetVisible}
                style={{
                  left: `${kapoorPosition.x + 36}px`, // Upper right of Kapoor
                  top: `${kapoorPosition.y - 5}px`,
                }}
              />
              
              {/* Contextual label for X key - shows what action will be performed */}
              <ContextLabel
                $visible={activeInteraction !== null && currentView === 'home' && !showPicoDialogue && !compSheetVisible}
                style={{
                  left: `${kapoorPosition.x + 55}px`, // Right of X key sprite (30px offset + 15px sprite + 2px gap)
                  top: `${kapoorPosition.y - 5}px`, // Aligned with key sprite
                }}
              >
                {contextLabel}
              </ContextLabel>
              
              {/* C key for petting Pico - shows when in actual interaction range, stacked below X key if both visible */}
              {(() => {
                const picoHorizontalOffset = kapoorPosition.x - PICO_POSITION.x;
                const picoDistance = Math.abs(picoHorizontalOffset);
                const INTERACTION_RANGE = PROXIMITY_THRESHOLD / 2; // Same range as X key interactions
                
                // Pico has extended interaction range to the left
                const picoInteractionRange = picoHorizontalOffset < 0 
                  ? INTERACTION_RANGE + PICO_LEFT_EXTENSION // Left of Pico - extended range
                  : INTERACTION_RANGE; // Right of Pico - normal range
                
                const isNearPico = picoDistance < picoInteractionRange;
                const showCKey = isNearPico && currentView === 'home' && !showPicoDialogue && !showPicoBlockingDialogue && !compSheetVisible;
                const yOffset = (activeInteraction === 'pico' && !picoInteracted) ? 18 : 0; // Stack below X key if Talk is showing
                
                return (
                  <>
                    <CKeySprite
                      $frame={cKeyFrame}
                      $visible={showCKey}
                      style={{
                        left: `${kapoorPosition.x + 36}px`, // Same x position as X key
                        top: `${kapoorPosition.y - 5 + yOffset}px`, // Stack below X key if both showing
                      }}
                    />
                    <ContextLabel
                      $visible={showCKey}
                      style={{
                        left: `${kapoorPosition.x + 55}px`, // Right of C key sprite (30px offset + 15px sprite + 2px gap)
                        top: `${kapoorPosition.y - 5 + yOffset}px`, // Aligned with key sprite
                      }}
                    >
                      Pet
                    </ContextLabel>
                  </>
                );
              })()}
              
              {/* Pet description textbox - appears after petting Pico */}
              <PetDescriptionBox
                $visible={showPetDescription}
                style={{
                  left: `${PICO_POSITION.x + 35}px`, // To the right of Pico
                  top: `${PICO_POSITION.y - 60}px`, // Above Pico
                }}
              >
                Pico though tough on the outside is a softie for a nice head pat
              </PetDescriptionBox>
              
              {/* Up arrow - shows when near ladder at ground floor */}
              <UpArrowSprite
                $frame={upArrowFrame}
                $visible={showUpArrow && !showPicoDialogue && !compSheetVisible}
                style={{
                  left: `${kapoorPosition.x + 36}px`, // Same x position as X key
                  top: `${kapoorPosition.y - 5}px`,
                }}
              />
              <ContextLabel
                $visible={showUpArrow && !showPicoDialogue && !compSheetVisible}
                style={{
                  left: `${kapoorPosition.x + 55}px`,
                  top: `${kapoorPosition.y - 5}px`,
                }}
              >
                Climb
              </ContextLabel>
              
              {/* Down arrow - shows when near ladder at second floor */}
              <DownArrowSprite
                $frame={downArrowFrame}
                $visible={showDownArrow && !showPicoDialogue && !compSheetVisible}
                style={{
                  left: `${kapoorPosition.x + 36}px`, // Same x position as X key
                  top: `${kapoorPosition.y - 5}px`,
                }}
              />
              <ContextLabel
                $visible={showDownArrow && !showPicoDialogue && !compSheetVisible}
                style={{
                  left: `${kapoorPosition.x + 55}px`,
                  top: `${kapoorPosition.y - 5}px`,
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
                      left: `${kapoorPosition.x}px`, 
                      top: `${kapoorPosition.y - 15}px`,
                      fontSize: '8px'
                    }}
                  >
                    ({kapoorPosition.x.toFixed(0)}, {kapoorPosition.y.toFixed(0)})
                  </BoundaryLabel>
                </>
              )}
          
          {/* === HOME VIEW CLICKABLE AREAS === */}
          {currentView === 'home' && (
            <>
              {/* Upper band - Sky view navigation */}
              <ClickableArea
                data-testid="home-upper-band"
                $isHovered={upperBandHovered}
                $debugColor="rgba(0, 255, 0, 0.3)"
                style={{ left: '0px', top: '220px', width: '640px', height: '180px' }}
                onClick={handleTelescopeClickWithTutorial}
                onMouseEnter={() => setUpperBandHovered(true)}
                onMouseLeave={() => setUpperBandHovered(false)}
              />
              {DEBUG_CLICKBOXES && <DebugLabel style={{ top: '220px', left: '2px' }}>UPPER: Sky View</DebugLabel>}

              {/* Bed area */}
              <ClickableArea
                data-testid="home-bed-area"
                $isHovered={false}
                style={{ left: '460px', top: '525px', width: '160px', height: '54px' }}
                onClick={handleBedClickWithTutorial}
              />

              {/* Desk area - X key interaction only (no click handler) */}
              <ClickableArea
                data-testid="home-desk-area"
                $isHovered={false}
                style={{ left: '5px', top: '510px', width: '120px', height: '72px' }}
              />
            </>
          )}

          {/* === SKY VIEW CLICKABLE AREAS === */}
          {currentView === 'sky' && (
            <>
              {/* Full height band - Return to home view */}
              <ClickableArea
                data-testid="sky-return-band"
                $isHovered={skyBandHovered}
                $debugColor="rgba(255, 255, 0, 0.3)"
                style={{ left: '0px', top: '260px', width: '640px', height: '100px' }}
                onClick={handleLadderClick}
                onMouseEnter={() => setSkyBandHovered(true)}
                onMouseLeave={() => setSkyBandHovered(false)}
              />
              {DEBUG_CLICKBOXES && <DebugLabel style={{ top: '260px', left: '2px' }}>FULL: Return Home</DebugLabel>}
            </>
          )}

          {/* Celestial bodies moved to CelestialLayer (separate container below clouds) */}

          {/* Removed antiquated tooltip system - was obstructing interface */}
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

        {/* Backdrop overlay - darkens and blurs when comp-sheet is visible */}
        <CompSheetBackdrop $visible={compSheetVisible} />

        {/* Comp-sheet composite layer system - appears when desk interaction starts */}
        {compSheetVisible && (
          <>
            {/* Layer 1a: Monitor frame with black fill (base layer) */}
            <CompMonitorLayer
              $visible={compSheetVisible}
              style={{
                left: '170px', // Center horizontally (640 - 300 = 340, 340/2 = 170)
                top: '90px', // Center vertically (360 - 180 = 180, 180/2 = 90)
              }}
            />
            
            {/* Layer 1b: Screen color overlay (blue for menu, dark for activity/intro/result) */}
            {/* Hidden during booting and fading_to_black phases to show black monitor underneath */}
            <CompScreenLayer
              $visible={compSheetPhase !== 'booting' && compSheetPhase !== 'fading_to_black' && compSheetPhase !== 'intro_fading_to_black' && compSheetPhase !== 'result_fading_to_black'}
              $variant={compSheetPhase === 'intro' || compSheetPhase === 'fading_from_black' || compSheetPhase === 'activity' || compSheetPhase === 'result_fading_from_black' || compSheetPhase === 'result' ? 'dark' : 'blue'}
              style={{
                left: '170px',
                top: '90px',
              }}
            />
            
            {/* Layer 2: Activity base (visible during boot fade-in and waiting) */}
            <CompActivityLayer
              $visible={compSheetPhase === 'booting_fade_in' || compSheetPhase === 'waiting'}
              style={{
                left: '170px',
                top: '90px',
              }}
            />
            
            {/* Layer 3: Activity options highlights (visible during boot fade-in, waiting, and transitioning) */}
            <CompOptionsLayer
              $frame={compOptionsFrame}
              $visible={compSheetPhase === 'booting_fade_in' || compSheetPhase === 'waiting' || compSheetPhase === 'transitioning'}
              style={{
                left: '170px',
                top: '90px',
              }}
            />
            
            {/* Layer 4: Activity option 1 animation (visible during boot fade-in and waiting) */}
            <CompOption1Layer
              $frame={compOption1Frame}
              $visible={compSheetPhase === 'booting_fade_in' || compSheetPhase === 'waiting'}
              style={{
                left: '170px',
                top: '90px',
              }}
            />
            
            {/* Activity click regions - only visible during waiting phase */}
            {/* Positions scaled from 600×360 to 300×180, offset by comp position (170, 90) */}
            {compSheetPhase === 'waiting' && (
              <>
                {/* Top-left activity (0) */}
                <ActivityClickRegion
                  $active={highlightedActivity === 0 || hoveredActivity === 0}
                  onMouseEnter={() => setHoveredActivity(0)}
                  onMouseLeave={() => setHoveredActivity(null)}
                  onClick={() => handleActivitySelect(0)}
                  style={{
                    left: '185px',
                    top: '115px',
                    width: '60px',
                    height: '50px',
                  }}
                />
                
                {/* Top-right activity (1) */}
                <ActivityClickRegion
                  $active={highlightedActivity === 1 || hoveredActivity === 1}
                  onMouseEnter={() => setHoveredActivity(1)}
                  onMouseLeave={() => setHoveredActivity(null)}
                  onClick={() => handleActivitySelect(1)}
                  style={{
                    left: '385px',
                    top: '115px',
                    width: '60px',
                    height: '50px',
                  }}
                />
                
                {/* Bottom-left activity (2) */}
                <ActivityClickRegion
                  $active={highlightedActivity === 2 || hoveredActivity === 2}
                  onMouseEnter={() => setHoveredActivity(2)}
                  onMouseLeave={() => setHoveredActivity(null)}
                  onClick={() => handleActivitySelect(2)}
                  style={{
                    left: '185px',
                    top: '195px',
                    width: '60px',
                    height: '50px',
                  }}
                />
                
                {/* Bottom-middle activity (3) */}
                <ActivityClickRegion
                  $active={highlightedActivity === 3 || hoveredActivity === 3}
                  onMouseEnter={() => setHoveredActivity(3)}
                  onMouseLeave={() => setHoveredActivity(null)}
                  onClick={() => handleActivitySelect(3)}
                  style={{
                    left: '280px',
                    top: '195px',
                    width: '60px',
                    height: '50px',
                  }}
                />
                
                {/* Bottom-right activity (4) */}
                <ActivityClickRegion
                  $active={highlightedActivity === 4 || hoveredActivity === 4}
                  onMouseEnter={() => setHoveredActivity(4)}
                  onMouseLeave={() => setHoveredActivity(null)}
                  onClick={() => handleActivitySelect(4)}
                  style={{
                    left: '385px',
                    top: '195px',
                    width: '60px',
                    height: '50px',
                  }}
                />
              </>
            )}
            
            {/* Anthro intro dialogue - 4 frame sequence advanced with X key */}
            <AnthroIntroLayer
              $frame={anthroIntroFrame}
              $visible={showAnthroIntro}
              style={{
                left: '170px', // Same position as comp layers
                top: '90px',
              }}
            />
            
            {/* TBI Positioning viewer - sprite sheet navigation with arrow keys */}
            <TbiPositioningLayer
              $frame={tbiPositioningFrame}
              $visible={showTbiPositioning}
              style={{
                left: '170px', // Same position as comp layers
                top: '90px',
              }}
            />
            
            {/* TBI Result - animated result screen after positioning complete */}
            <TbiResultLayer
              $frame={tbiResultFrame}
              $visible={showTbiResult}
              style={{
                left: '170px', // Same position as comp layers
                top: '90px',
              }}
            />
          </>
        )}
        
        {/* Sky view interaction indicator - fixed at bottom center, shows X (Inspect) and C (Return) keys */}
        <SkyInteractionIndicator $visible={currentView === 'sky' && !showStarDetail && !isPlayingCutscene && !showMonologue}>
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
        <DeskInteractionIndicator $visible={compSheetVisible}>
          <DeskKeyRow>
            <DeskXKeySprite $frame={deskXKeyFrame} />
            <DeskActionLabel>Select</DeskActionLabel>
          </DeskKeyRow>
          <DeskKeyRow>
            <DeskCKeySprite $frame={deskCKeyFrame} />
            <DeskActionLabel>Close</DeskActionLabel>
          </DeskKeyRow>
        </DeskInteractionIndicator>
        
        {/* Kapoor monologue - appears after closing ??? star modal (positioned relative to Kapoor like Pico dialogue) */}
        {(() => {
          const isLastLine = currentMonologueLineIndex >= MONOLOGUE_LINES.length - 1;
          
          return (
            <KapoorMonologue
              $visible={showMonologue && currentView === 'sky'}
              style={{
                left: `${kapoorPosition.x - 70}px`, // Positioned relative to Kapoor (140px width / 2 = 70px center offset)
                top: `${kapoorPosition.y - 120}px`, // Higher up in sky view for better visibility
              }}
            >
              <KapoorSpeakerLabel>Kapoor</KapoorSpeakerLabel>
              <div>{MONOLOGUE_LINES[currentMonologueLineIndex]}</div>
              <KapoorContinueHint>
                {isLastLine ? '(X to close)' : '(X to continue)'}
              </KapoorContinueHint>
            </KapoorMonologue>
          );
        })()}
        
      </JumboViewport>

      {/* Boom effect overlay (full-screen flash + pulse during cutscene) */}
      <BoomEffectOverlay $visible={showBoomEffect} />

      {/* Cinematic letterbox bars - slide in AFTER scroll completes, during cutscene only */}
      <CinematicLetterbox $visible={isPlayingCutscene} $position="top" />
      <CinematicLetterbox $visible={isPlayingCutscene} $position="bottom" />

    </>
  );
}