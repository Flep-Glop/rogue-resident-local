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
  
  
  // === GROUPED STATE: Speech Bubbles ===
  const [speechBubbles, setSpeechBubbles] = useState<SpeechBubblesState>(DEFAULT_SPEECH_BUBBLES);
  
  // Helper to update a specific bubble
  const updateBubble = useCallback((key: keyof SpeechBubblesState, updates: Partial<SpeechBubblesState[keyof SpeechBubblesState]>) => {
    setSpeechBubbles(prev => ({ ...prev, [key]: { ...prev[key], ...updates } }));
  }, []);
  
  // Navigation arrow hover states
  const [upperBandHovered, setUpperBandHovered] = useState(false);
  const [skyBandHovered, setSkyBandHovered] = useState(false);
  
  
  // Keys pressed ref for keyboard controls (shared between keyboard controls and Kapoor movement)
  const keysPressed = useRef<Set<string>>(new Set());
  
  // === GROUPED STATE: Pico Character ===
  const [pico, setPico] = useState<PicoState>(DEFAULT_PICO_STATE);
  const picoAnimationRef = useRef<NodeJS.Timeout | null>(null);
  
  // Helper to update pico state
  const updatePico = useCallback((updates: Partial<PicoState>) => {
    setPico(prev => ({ ...prev, ...updates }));
  }, []);
  
  // === KAPOOR MOVEMENT HOOK ===
  const kapoorMovementCallbacks: KapoorMovementCallbacks = useMemo(() => ({
    onClimbBlocked: () => {
      console.log('[CombinedHomeScene] Pico blocks ladder - showing dialogue');
      if (!pico.hasShownFirstBlockingMessage) {
        updatePico({ blockingDialogueIndex: 0 }); // Start with first message
      } else {
        updatePico({ blockingDialogueIndex: 1 }); // Skip to second message for repeat offenders
      }
      updatePico({ showBlockingDialogue: true, isTalking: true });
    },
  }), [pico.hasShownFirstBlockingMessage, updatePico]);
  
  const {
    state: kapoorState,
    setters: kapoorSetters,
  } = useKapoorMovement({
    keysPressed,
    currentView,
    picoInteracted: pico.interacted,
    isClimbBlocked: pico.showBlockingDialogue,
    hasShownFirstBlockingMessage: pico.hasShownFirstBlockingMessage,
    callbacks: kapoorMovementCallbacks,
  });
  
  // Destructure for convenience throughout component
  const { position: kapoorPosition, direction: kapoorDirection, frame: kapoorFrame, isWalking: kapoorIsWalking, isClimbing: kapoorIsClimbing } = kapoorState;
  const { setPosition: setKapoorPosition, setDirection: setKapoorDirection, setIsWalking: setKapoorIsWalking, setIsClimbing: setKapoorIsClimbing } = kapoorSetters;
  
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
  const compOption1AnimationRef = useRef<NodeJS.Timeout | null>(null);
  const tbiResultAnimationRef = useRef<NodeJS.Timeout | null>(null);
  
  // Helper to update comp activity state
  const updateCompActivity = useCallback((updates: Partial<CompActivityState>) => {
    setCompActivity(prev => ({ ...prev, ...updates }));
  }, []);
  
  // Desk activity key indicator frames (always highlighted frame 3)
  const deskXKeyFrame = 1; // Unhighlighted by default (highlights on press)
  const deskCKeyFrame = 1; // Unhighlighted by default (highlights on press)
  
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
  const picoHorizontalOffset = kapoorPosition.x - PICO_POSITION.x;
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
    anthroIntroFrame: compActivity.anthroIntroFrame,
    anthroIntroTotalFrames: ANTHRO_INTRO_TOTAL_FRAMES,
    showTbiPositioning: compActivity.tbiPositioningVisible,
    showTbiResult: compActivity.tbiResultVisible,
    highlightedActivity: compActivity.highlightedActivity,
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
      console.log('[CombinedHomeScene] Advancing intro frame', compActivity.anthroIntroFrame + 1);
      updateCompActivity({ anthroIntroFrame: compActivity.anthroIntroFrame + 1 });
    },
    completeAnthroIntro: () => {
      console.log('[CombinedHomeScene] Intro complete, fading to TBI');
      updateCompActivity({ phase: 'intro_fading_to_black' });
    },
    completeTbiPositioning: () => {
      console.log('[CombinedHomeScene] TBI positioning complete, showing result');
      updateCompActivity({ phase: 'result_fading_to_black' });
    },
    completeActivityFromResult: () => {
      console.log('[CombinedHomeScene] Completing activity from result');
      handleActivityComplete();
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
          option1Frame: 1,
          highlightedActivity: 0,
        });
      }, 150);
    },
    selectCompActivity: () => {
      console.log('[CombinedHomeScene] Selecting activity', compActivity.highlightedActivity);
      updateCompActivity({ selectedActivity: compActivity.highlightedActivity, phase: 'transitioning' });
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
      updatePico({ blockingDialogueIndex: pico.blockingDialogueIndex + 1 });
    },
    dismissPicoBlockingDialogue: () => {
      console.log('[CombinedHomeScene] Dismissing blocking dialogue');
      updatePico({ showBlockingDialogue: false, isTalking: false, hasShownFirstBlockingMessage: true });
      setKapoorIsClimbing(false);
      setTimeout(() => updatePico({ blockingDialogueIndex: 0 }), 250);
    },
    advancePicoDialogue: () => {
      console.log('[CombinedHomeScene] Advancing Pico dialogue');
      updatePico({ dialogueIndex: pico.dialogueIndex + 1 });
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
      console.log('[CombinedHomeScene] Petting Pico');
      updateInteractionUI({ cKeyFrame: 3 });
      setTimeout(() => {
        updatePico({ showPetDescription: true });
        setTimeout(() => {
          updatePico({ showPetDescription: false });
          updateInteractionUI({ cKeyFrame: 1 });
        }, 3000);
      }, 150);
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
    updateCompActivity({ selectedActivity: activityIndex, phase: 'transitioning' });
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
    updateCompActivity({ visible: false, tbiPositioningVisible: false, tbiResultVisible: false });
    
    // Reset all activity state
    setTimeout(() => {
      updateCompActivity({
        tbiPositioningFrame: 0,
        tbiResultFrame: 0,
        phase: 'idle',
        optionsFrame: 1,
        option1Frame: 1,
        selectedActivity: null,
        hoveredActivity: null,
        highlightedActivity: 0,
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
    setKapoorPosition,
    setKapoorDirection,
    setKapoorIsWalking,
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
    if (compActivity.phase === 'waiting') {
      console.log('[CombinedHomeScene] Comp-sheet waiting - updating options layer frame');
      
      // Check if any activity is hovered/highlighted
      if (compActivity.hoveredActivity !== null || compActivity.highlightedActivity !== null) {
        // Show highlighted frame (2-6 based on activity index 0-4)
        const activityIndex = compActivity.hoveredActivity !== null ? compActivity.hoveredActivity : compActivity.highlightedActivity;
        updateCompActivity({ optionsFrame: 2 + activityIndex });
      } else {
        // No hover/highlight - show frame 1 (none highlighted)
        updateCompActivity({ optionsFrame: 1 });
      }
    }
  }, [compActivity.phase, compActivity.hoveredActivity, compActivity.highlightedActivity, updateCompActivity]);
  
  // Comp-sheet option1 layer autonomous animation - loop frames 1-5 with longer linger on frame 1
  useEffect(() => {
    if (compActivity.phase === 'waiting') {
      console.log('[CombinedHomeScene] Starting option1 layer autonomous animation');
      
      let currentFrame = 1;
      updateCompActivity({ option1Frame: currentFrame });
      
      const animateFrame = () => {
        if (currentFrame === 1) {
          compOption1AnimationRef.current = setTimeout(() => {
            currentFrame = 2;
            updateCompActivity({ option1Frame: currentFrame });
            animateFrame();
          }, 1000) as unknown as NodeJS.Timeout;
        } else {
          compOption1AnimationRef.current = setTimeout(() => {
            currentFrame++;
            if (currentFrame > 5) currentFrame = 1;
            updateCompActivity({ option1Frame: currentFrame });
            animateFrame();
          }, 150) as unknown as NodeJS.Timeout;
        }
      };
      
      animateFrame();
      
      return () => {
        if (compOption1AnimationRef.current) {
          clearTimeout(compOption1AnimationRef.current);
          compOption1AnimationRef.current = null;
        }
      };
    }
  }, [compActivity.phase, updateCompActivity]);
  
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
      
      if (compOption1AnimationRef.current) {
        clearTimeout(compOption1AnimationRef.current);
        compOption1AnimationRef.current = null;
      }
      
      updateCompActivity({ optionsFrame: 7 });
      
      setTimeout(() => {
        console.log('[CombinedHomeScene] Fading to black - hiding menu layers');
        updateCompActivity({ phase: 'fading_to_black' });
      }, 150);
    }
    
    if (compActivity.phase === 'fading_to_black') {
      setTimeout(() => {
        console.log('[CombinedHomeScene] Fading from black - showing Anthro intro');
        updateCompActivity({ anthroIntroVisible: true, anthroIntroFrame: 0, phase: 'intro' });
      }, 350);
    }
    
    if (compActivity.phase === 'intro_fading_to_black') {
      setTimeout(() => {
        console.log('[CombinedHomeScene] Intro complete - showing TBI positioning');
        updateCompActivity({ anthroIntroVisible: false, tbiPositioningVisible: true, tbiPositioningFrame: 0, phase: 'fading_from_black' });
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
        updateCompActivity({ tbiPositioningVisible: false, tbiResultVisible: true, tbiResultFrame: 0, phase: 'result_fading_from_black' });
      }, 350);
    }
    
    if (compActivity.phase === 'result_fading_from_black') {
      setTimeout(() => {
        console.log('[CombinedHomeScene] Result faded in - starting animation');
        updateCompActivity({ phase: 'result' });
        
        let currentFrame = 0;
        const animateResult = () => {
          if (currentFrame < 11) {
            currentFrame++;
            updateCompActivity({ tbiResultFrame: currentFrame });
            tbiResultAnimationRef.current = setTimeout(animateResult, 500);
          } else {
            console.log('[CombinedHomeScene] Result animation complete - landed on frame 11');
            updateCompActivity({ tbiResultFrame: 11 });
          }
        };
        
        tbiResultAnimationRef.current = setTimeout(animateResult, 500);
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
    if (!compActivity.tbiPositioningVisible) return;

    const handleTbiPositioningKeyDown = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        e.stopPropagation();
      }

      if (e.key === 'ArrowLeft') {
        setCompActivity(prev => ({ ...prev, tbiPositioningFrame: Math.min(TBI_POSITIONING_TOTAL_FRAMES - 1, prev.tbiPositioningFrame + 1) }));
      } else if (e.key === 'ArrowRight') {
        setCompActivity(prev => ({ ...prev, tbiPositioningFrame: Math.max(0, prev.tbiPositioningFrame - 1) }));
      }
    };

    window.addEventListener('keydown', handleTbiPositioningKeyDown, { capture: true });
    return () => window.removeEventListener('keydown', handleTbiPositioningKeyDown, { capture: true });
  }, [compActivity.tbiPositioningVisible]);
  
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
  }, [kapoorPosition, currentView, xKeyTriggered, deskXKeyEnabled, deskXKeyTriggered, pico.interacted, updateInteractionUI]);
  
  // Ladder arrow indicators - show up/down arrows when near ladder
  useEffect(() => {
    const nearLadderX = Math.abs(kapoorPosition.x - CLIMB_X_THRESHOLD) < CLIMB_X_TOLERANCE;
    const onGroundFloor = Math.abs(kapoorPosition.y - GROUND_FLOOR_Y) < FLOOR_TOLERANCE;
    const onSecondFloor = Math.abs(kapoorPosition.y - SECOND_FLOOR_Y) < FLOOR_TOLERANCE;
    
    updateInteractionUI({
      showUpArrow: nearLadderX && onGroundFloor && currentView === 'home',
      showDownArrow: nearLadderX && onSecondFloor && currentView === 'home',
    });
  }, [kapoorPosition, currentView, updateInteractionUI]);

  // === TELESCOPE SPEECH BUBBLE VISIBILITY ===
  useEffect(() => {
    updateBubble('telescope', { visible: currentView === 'home' && !deskXKeyEnabled });
  }, [currentView, deskXKeyEnabled, updateBubble]);
  
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
        Math.pow(kapoorPosition.x - TELESCOPE_POSITION.x, 2) + 
        Math.pow(kapoorPosition.y - TELESCOPE_POSITION.y, 2)
      );
      const INTERACTION_RANGE = PROXIMITY_THRESHOLD / 2;
      updateBubble('telescope', { highlighted: telescopeDistance < INTERACTION_RANGE });
    } else if (currentView === 'sky') {
      updateBubble('telescope', { highlighted: true });
    } else {
      updateBubble('telescope', { highlighted: false });
    }
  }, [currentView, speechBubbles.telescope.visible, kapoorPosition, updateBubble]);
  
  // === DESK PROXIMITY DETECTION (for speech bubble highlighting in home view only) ===
  useEffect(() => {
    if (!speechBubbles.desk.visible || currentView !== 'home') {
      updateBubble('desk', { highlighted: false });
      return;
    }
    
    const deskDistance = Math.abs(kapoorPosition.x - DESK_POSITION.x);
    const INTERACTION_RANGE = PROXIMITY_THRESHOLD / 2;
    updateBubble('desk', { highlighted: deskDistance < INTERACTION_RANGE });
  }, [currentView, speechBubbles.desk.visible, kapoorPosition, updateBubble]);
  
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
    
    const picoHorizontalOffset = kapoorPosition.x - PICO_POSITION.x;
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
  }, [kapoorPosition, currentView, updateInteractionUI]);
  
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
    
    const horizontalDistance = Math.abs(kapoorPosition.x - PICO_POSITION.x);
    const picoHorizontalOffset = kapoorPosition.x - PICO_POSITION.x;
    const INTERACTION_RANGE = PROXIMITY_THRESHOLD / 2;
    
    const picoInteractionRange = picoHorizontalOffset < 0 
      ? INTERACTION_RANGE + PICO_LEFT_EXTENSION
      : INTERACTION_RANGE;
    
    const isNear = horizontalDistance < picoInteractionRange;
    
    if (isNear !== speechBubbles.pico.highlighted) {
      console.log(`[Pico] Horizontal distance: ${horizontalDistance.toFixed(0)}px, Threshold: ${picoInteractionRange.toFixed(0)}px, Highlighting: ${isNear}`);
    }
    
    updateBubble('pico', { highlighted: isNear });
  }, [kapoorPosition, speechBubbles.pico.visible, speechBubbles.pico.highlighted, updateBubble]);
  
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
            $frame={speechBubbles.telescope.frame}
            $visible={speechBubbles.telescope.visible}
            $highlighted={speechBubbles.telescope.highlighted}
            style={{
              left: `${TELESCOPE_POSITION.x - 16}px`,
              top: `${TELESCOPE_POSITION.y - 20}px`,
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
                $frame={pico.frame}
                $isTalking={pico.isTalking}
                style={{
                  left: `${PICO_POSITION.x}px`,
                  top: `${PICO_POSITION.y}px`,
                }}
              />
              
              {/* Speech bubble above Pico - always visible until interaction, highlights when Kapoor is near */}
              <SpeechBubbleSprite
                $frame={speechBubbles.pico.frame}
                $visible={speechBubbles.pico.visible}
                $highlighted={speechBubbles.pico.highlighted}
                style={{
                  left: `${PICO_POSITION.x + 6}px`,
                  top: `${PICO_POSITION.y - 20}px`,
                }}
              />
              
              {/* Pico Dialogue Text - Follows the speaking character */}
              <PicoDialogueText 
                $visible={pico.showDialogue}
                style={{
                  left: PICO_DIALOGUE_LINES[pico.dialogueIndex].speaker === 'Pico' 
                    ? `${PICO_POSITION.x + 10}px`
                    : `${kapoorPosition.x - 90}px`,
                  top: PICO_DIALOGUE_LINES[pico.dialogueIndex].speaker === 'Pico'
                    ? `${PICO_POSITION.y - 80}px`
                    : `${kapoorPosition.y - 65}px`,
                }}
              >
                <PicoSpeakerLabel>
                  {PICO_DIALOGUE_LINES[pico.dialogueIndex].speaker}
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
                  left: `${PICO_POSITION.x + 10}px`,
                  top: `${PICO_POSITION.y - 100}px`,
                }}
              >
                <PicoSpeakerLabel>
                  {PICO_BLOCKING_DIALOGUE[pico.blockingDialogueIndex].speaker}
                </PicoSpeakerLabel>
                <div>{PICO_BLOCKING_DIALOGUE[pico.blockingDialogueIndex].text}</div>
                <PicoContinueHint>
                  {pico.blockingDialogueIndex < PICO_BLOCKING_DIALOGUE.length - 1 ? '(X to continue)' : '(X to close)'}
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
                $frame={interactionUI.xKeyFrame}
                $visible={interactionUI.active !== null && currentView === 'home' && !pico.showDialogue && !pico.showBlockingDialogue && !compActivity.visible}
                style={{
                  left: `${kapoorPosition.x + 36}px`,
                  top: `${kapoorPosition.y - 5}px`,
                }}
              />
              
              {/* Contextual label for X key - shows what action will be performed */}
              <ContextLabel
                $visible={interactionUI.active !== null && currentView === 'home' && !pico.showDialogue && !compActivity.visible}
                style={{
                  left: `${kapoorPosition.x + 55}px`,
                  top: `${kapoorPosition.y - 5}px`,
                }}
              >
                {interactionUI.contextLabel}
              </ContextLabel>
              
              {/* C key for petting Pico - shows when in actual interaction range, stacked below X key if both visible */}
              {(() => {
                const picoHorizontalOffset = kapoorPosition.x - PICO_POSITION.x;
                const picoDistance = Math.abs(picoHorizontalOffset);
                const INTERACTION_RANGE = PROXIMITY_THRESHOLD / 2;
                
                const picoInteractionRange = picoHorizontalOffset < 0 
                  ? INTERACTION_RANGE + PICO_LEFT_EXTENSION
                  : INTERACTION_RANGE;
                
                const isNearPico = picoDistance < picoInteractionRange;
                const showCKey = isNearPico && currentView === 'home' && !pico.showDialogue && !pico.showBlockingDialogue && !compActivity.visible;
                const yOffset = (interactionUI.active === 'pico' && !pico.interacted) ? 18 : 0;
                
                return (
                  <>
                    <CKeySprite
                      $frame={interactionUI.cKeyFrame}
                      $visible={showCKey}
                      style={{
                        left: `${kapoorPosition.x + 36}px`,
                        top: `${kapoorPosition.y - 5 + yOffset}px`,
                      }}
                    />
                    <ContextLabel
                      $visible={showCKey}
                      style={{
                        left: `${kapoorPosition.x + 55}px`,
                        top: `${kapoorPosition.y - 5 + yOffset}px`,
                      }}
                    >
                      Pet
                    </ContextLabel>
                  </>
                );
              })()}
              
              {/* Pet description textbox - appears after petting Pico */}
              <PetDescriptionBox
                $visible={pico.showPetDescription}
                style={{
                  left: `${PICO_POSITION.x + 35}px`,
                  top: `${PICO_POSITION.y - 60}px`,
                }}
              >
                Pico though tough on the outside is a softie for a nice head pat
              </PetDescriptionBox>
              
              {/* Up arrow - shows when near ladder at ground floor */}
              <UpArrowSprite
                $frame={interactionUI.upArrowFrame}
                $visible={interactionUI.showUpArrow && !pico.showDialogue && !compActivity.visible}
                style={{
                  left: `${kapoorPosition.x + 36}px`,
                  top: `${kapoorPosition.y - 5}px`,
                }}
              />
              <ContextLabel
                $visible={interactionUI.showUpArrow && !pico.showDialogue && !compActivity.visible}
                style={{
                  left: `${kapoorPosition.x + 55}px`,
                  top: `${kapoorPosition.y - 5}px`,
                }}
              >
                Climb
              </ContextLabel>
              
              {/* Down arrow - shows when near ladder at second floor */}
              <DownArrowSprite
                $frame={interactionUI.downArrowFrame}
                $visible={interactionUI.showDownArrow && !pico.showDialogue && !compActivity.visible}
                style={{
                  left: `${kapoorPosition.x + 36}px`,
                  top: `${kapoorPosition.y - 5}px`,
                }}
              />
              <ContextLabel
                $visible={interactionUI.showDownArrow && !pico.showDialogue && !compActivity.visible}
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
        <CompSheetBackdrop $visible={compActivity.visible} />

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
            
            {/* Layer 2: Activity base (visible during boot fade-in and waiting) */}
            <CompActivityLayer
              $visible={compActivity.phase === 'booting_fade_in' || compActivity.phase === 'waiting'}
              style={{
                left: '170px',
                top: '90px',
              }}
            />
            
            {/* Layer 3: Activity options highlights */}
            <CompOptionsLayer
              $frame={compActivity.optionsFrame}
              $visible={compActivity.phase === 'booting_fade_in' || compActivity.phase === 'waiting' || compActivity.phase === 'transitioning'}
              style={{
                left: '170px',
                top: '90px',
              }}
            />
            
            {/* Layer 4: Activity option 1 animation */}
            <CompOption1Layer
              $frame={compActivity.option1Frame}
              $visible={compActivity.phase === 'booting_fade_in' || compActivity.phase === 'waiting'}
              style={{
                left: '170px',
                top: '90px',
              }}
            />
            
            {/* Activity click regions - only visible during waiting phase */}
            {compActivity.phase === 'waiting' && (
              <>
                {/* Top-left activity (0) */}
                <ActivityClickRegion
                  $active={compActivity.highlightedActivity === 0 || compActivity.hoveredActivity === 0}
                  onMouseEnter={() => updateCompActivity({ hoveredActivity: 0 })}
                  onMouseLeave={() => updateCompActivity({ hoveredActivity: null })}
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
                  $active={compActivity.highlightedActivity === 1 || compActivity.hoveredActivity === 1}
                  onMouseEnter={() => updateCompActivity({ hoveredActivity: 1 })}
                  onMouseLeave={() => updateCompActivity({ hoveredActivity: null })}
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
                  $active={compActivity.highlightedActivity === 2 || compActivity.hoveredActivity === 2}
                  onMouseEnter={() => updateCompActivity({ hoveredActivity: 2 })}
                  onMouseLeave={() => updateCompActivity({ hoveredActivity: null })}
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
                  $active={compActivity.highlightedActivity === 3 || compActivity.hoveredActivity === 3}
                  onMouseEnter={() => updateCompActivity({ hoveredActivity: 3 })}
                  onMouseLeave={() => updateCompActivity({ hoveredActivity: null })}
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
                  $active={compActivity.highlightedActivity === 4 || compActivity.hoveredActivity === 4}
                  onMouseEnter={() => updateCompActivity({ hoveredActivity: 4 })}
                  onMouseLeave={() => updateCompActivity({ hoveredActivity: null })}
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
              $frame={compActivity.anthroIntroFrame}
              $visible={compActivity.anthroIntroVisible}
              style={{
                left: '170px',
                top: '90px',
              }}
            />
            
            {/* TBI Positioning viewer - sprite sheet navigation with arrow keys */}
            <TbiPositioningLayer
              $frame={compActivity.tbiPositioningFrame}
              $visible={compActivity.tbiPositioningVisible}
              style={{
                left: '170px',
                top: '90px',
              }}
            />
            
            {/* TBI Result - animated result screen after positioning complete */}
            <TbiResultLayer
              $frame={compActivity.tbiResultFrame}
              $visible={compActivity.tbiResultVisible}
              style={{
                left: '170px',
                top: '90px',
              }}
            />
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
        <DeskInteractionIndicator $visible={compActivity.visible}>
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
                left: `${kapoorPosition.x - 70}px`,
                top: `${kapoorPosition.y - 120}px`,
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
      <BoomEffectOverlay $visible={cutscene.showBoomEffect} />

      {/* Cinematic letterbox bars - slide in AFTER scroll completes, during cutscene only */}
      <CinematicLetterbox $visible={cutscene.isPlaying} $position="top" />
      <CinematicLetterbox $visible={cutscene.isPlaying} $position="bottom" />

    </>
  );
}