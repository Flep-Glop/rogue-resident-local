// === TYPE DEFINITIONS ===

export type StarIdType = 
  | 'star' 
  | 'tbi' 
  | 'tbi_patient_setup' 
  | 'planet_1' 
  | 'planet_2' 
  | 'planet_3' 
  | 'planet_4' 
  | 'planet_5' 
  | 'planet_6' 
  | 'planet_7';

export type SkyHighlightType = 
  | 'star' 
  | 'tbi' 
  | 'tbi_patient_setup' 
  | 'telescope' 
  | 'planet_1' 
  | 'planet_2' 
  | 'planet_3' 
  | 'planet_4' 
  | 'planet_5' 
  | 'planet_6' 
  | 'planet_7';

export type InteractionType = 'telescope' | 'desk' | 'pico' | null;

// === GROUPED STATE INTERFACES ===

/** Speech bubble state - used for telescope, star, desk, pico */
export interface SpeechBubbleState {
  visible: boolean;
  highlighted: boolean;
  frame: number;
}

/** All speech bubbles in the scene */
export interface SpeechBubblesState {
  telescope: SpeechBubbleState;
  telescopeExclamation: SpeechBubbleState;
  star: SpeechBubbleState;
  desk: SpeechBubbleState;
  pico: SpeechBubbleState;
}

/** Pico companion character state */
export interface PicoState {
  frame: number;
  isTalking: boolean;
  interacted: boolean;
  showDialogue: boolean;
  dialogueIndex: number;
  showPetDescription: boolean;
  hasPetted: boolean; // Track if Pico has been petted this playthrough
  showBlockingDialogue: boolean;
  blockingDialogueIndex: number;
  hasShownFirstBlockingMessage: boolean;
}

/** Computer/desk activity system state */
export interface CompActivityState {
  visible: boolean;
  phase: 'idle' | 'booting' | 'booting_fade_in' | 'waiting' | 'transitioning' | 'fading_to_black' | 'intro' | 'intro_fading_to_black' | 'fading_from_black' | 'activity' | 'result_fading_to_black' | 'result_fading_from_black' | 'result';
  optionsFrame: number;
  option1Frame: number;
  selectedActivity: number | null;
  highlightedActivity: number;
  anthroIntroVisible: boolean;
  anthroIntroFrame: number; // Animation frame (0-7: idle, 8-11: raise hand, 12-15: wave)
  anthroAnimPhase: 'idle' | 'raising' | 'waving'; // Current animation phase
  anthroDialogueIndex: number; // Track dialogue progression
  tbiPositioningVisible: boolean;
  tbiAnthroX: number; // Anthro horizontal position in pixels (within TBI_ANTHRO_MIN_X to TBI_ANTHRO_MAX_X)
  tbiAnthroFrame: number; // 8-frame idle animation loop (0-7)
  tbiResultVisible: boolean;
  tbiResultMaskFrame: number; // 0=full coverage, 10=no coverage (reveal animation)
  tbiResultRevealed: boolean; // true after mask animation + 350ms delay completes
  tbiResultPassed: boolean; // true if player passed (≥8 green segments), false if failed
  tbiBeamVisible: boolean; // Beam animation overlay
  tbiBeamFrame: number; // Current frame (0-10)
  tbiBeamLoopCount: number; // How many times the loop (frames 6-11) has played
  tbiBeamAnimating: boolean; // true during beam animation
}

/** Cutscene star data */
export interface CutsceneStar {
  x: number;
  y: number;
  frame: number;
  opacity: number;
  frameOffset: number;
  opacityOffset: number;
}

/** Constellation star/planet data */
export interface ConstellationBody {
  id: string;
  x: number;
  y: number;
  frame: number;
  angle?: number;
  distance?: number;
  parentId?: string;
  scale?: number;
  opacity?: number;
  zIndex?: number;
}

/** Constellation cutscene state */
export interface CutsceneState {
  isPlaying: boolean;
  isScrolling: boolean;
  phase: 'stars-appearing' | 'building-tension' | 'boom' | 'final-constellation' | 'complete';
  stars: CutsceneStar[];
  starOpacity: number;
  showBoomEffect: boolean;
  showFinalConstellation: boolean;
  constellationBodies: ConstellationBody[];
}

/** Player interaction UI state */
export interface InteractionUIState {
  active: InteractionType;
  xKeyFrame: number;
  cKeyFrame: number;
  contextLabel: string;
  upArrowFrame: number;
  downArrowFrame: number;
  showUpArrow: boolean;
  showDownArrow: boolean;
}

// === TBI ANTHRO POSITIONING CONSTANTS ===
// (defined before DEFAULT_COMP_ACTIVITY which references them)

// TBI Anthro positioning system (sprite moves over static background)
export const TBI_ANTHRO_FRAME_WIDTH = 31;  // Each frame is 31px wide
export const TBI_ANTHRO_FRAME_HEIGHT = 90; // 90px tall
export const TBI_ANTHRO_TOTAL_FRAMES = 8;  // 8-frame idle animation
export const TBI_ANTHRO_MIN_X = 14;        // Leftmost position (far from gantry) - ADJUSTABLE
export const TBI_ANTHRO_MAX_X = 206;       // Rightmost position (near gantry) - ADJUSTABLE
export const TBI_ANTHRO_START_X = 13;     // Starting position (middle of range)
export const TBI_ANTHRO_STEP = 13;          // Pixels moved per arrow key press - ADJUSTABLE
export const TBI_ANTHRO_Y = 48;            // Fixed Y position within TBI container

/**
 * Converts anthro X position to a position index (0-15) for result lookup
 * @param x - The anthro X position in pixels
 * @returns Position index from 0 (far from gantry, left) to 15 (near gantry, right)
 */
export function getPositionIndexFromX(x: number): number {
  const range = TBI_ANTHRO_MAX_X - TBI_ANTHRO_MIN_X;
  const normalized = (x - TBI_ANTHRO_MIN_X) / range;
  const index = Math.floor(normalized * 16);
  return Math.max(0, Math.min(15, index));
}

// === DEFAULT STATES ===

export const DEFAULT_SPEECH_BUBBLE: SpeechBubbleState = {
  visible: true,
  highlighted: false,
  frame: 1,
};

export const DEFAULT_SPEECH_BUBBLES: SpeechBubblesState = {
  telescope: { ...DEFAULT_SPEECH_BUBBLE },
  telescopeExclamation: { ...DEFAULT_SPEECH_BUBBLE, visible: false }, // Same animation logic as telescope
  star: { ...DEFAULT_SPEECH_BUBBLE },
  desk: { visible: false, highlighted: false, frame: 1 },
  pico: { ...DEFAULT_SPEECH_BUBBLE },
};

export const DEFAULT_PICO_STATE: PicoState = {
  frame: 0,
  isTalking: false,
  interacted: false,
  showDialogue: false,
  dialogueIndex: 0,
  showPetDescription: false,
  hasPetted: false,
  showBlockingDialogue: false,
  blockingDialogueIndex: 0,
  hasShownFirstBlockingMessage: false,
};

export const DEFAULT_COMP_ACTIVITY: CompActivityState = {
  visible: false,
  phase: 'idle',
  optionsFrame: 1,
  option1Frame: 1,
  selectedActivity: null,
  highlightedActivity: 0,
  anthroIntroVisible: false,
  anthroIntroFrame: 0,
  anthroAnimPhase: 'raising', // Start with hand raise on first dialogue
  anthroDialogueIndex: 0,
  tbiPositioningVisible: false,
  tbiAnthroX: TBI_ANTHRO_START_X, // Start at center of range
  tbiAnthroFrame: 0,
  tbiResultVisible: false,
  tbiResultMaskFrame: 0, // Start fully covered
  tbiResultRevealed: false,
  tbiResultPassed: false,
  tbiBeamVisible: false,
  tbiBeamFrame: 0,
  tbiBeamLoopCount: 0,
  tbiBeamAnimating: false,
};

export const DEFAULT_CUTSCENE: CutsceneState = {
  isPlaying: false,
  isScrolling: false,
  phase: 'stars-appearing',
  stars: [],
  starOpacity: 1,
  showBoomEffect: false,
  showFinalConstellation: false,
  constellationBodies: [],
};

export const DEFAULT_INTERACTION_UI: InteractionUIState = {
  active: null,
  xKeyFrame: 1,
  cKeyFrame: 1,
  contextLabel: '',
  upArrowFrame: 1,
  downArrowFrame: 1,
  showUpArrow: false,
  showDownArrow: false,
};

// === POSITION CONSTANTS ===

// Kapoor is 102px tall, Pico is 21px tall
// Kapoor at y:467 has bottom at 467+102=569
// Pico needs y = 569-21 = 548 to align bottoms
export const PICO_POSITION = { x: 330, y: 548 };

export const TELESCOPE_POSITION = { x: 480, y: 310 }; // Second floor
export const DESK_POSITION = { x: 410, y: 495 }; // First floor (shifted 10px right)
export const PRIMAREUS_POSITION = { x: 180, y: 120 }; // ??? star in sky
export const STAR_X_KEY_POSITION = { x: PRIMAREUS_POSITION.x + 20, y: PRIMAREUS_POSITION.y - 5 };

export const KAPOOR_START_POSITION = { x: 150, y: 467 };
export const GROUND_FLOOR_Y = 467;
export const SECOND_FLOOR_Y = 307; // 467 - 160 = 307

// === THRESHOLD CONSTANTS ===

export const PROXIMITY_THRESHOLD = 60; // Show interaction prompt within this distance
export const PICO_PROXIMITY_THRESHOLD = 80; // Horizontal distance for highlighting speech bubble
export const PICO_LEFT_EXTENSION = 60; // Additional distance allowed to the left of Pico

// === FRAME COUNTS ===

// === TBI BEAM ANIMATION ===
export const TBI_BEAM_TOTAL_FRAMES = 11; // 0-10: 11 frames total
export const TBI_BEAM_INTRO_FRAMES = 5; // Frames 0-4: play once
export const TBI_BEAM_LOOP_START_FRAME = 5; // Frame 5: start of loop
export const TBI_BEAM_LOOP_END_FRAME = 10; // Frame 10: end of loop
export const TBI_BEAM_LOOP_COUNT = 4; // Loop frames 5-10 four times
export const TBI_BEAM_FRAME_DURATION = 100; // ms per frame

// === STAR NAMES MAPPING ===

export const STAR_NAMES: Record<StarIdType, string> = {
  star: '???',
  tbi: 'TBI',
  tbi_patient_setup: 'TBI Patient Setup',
  planet_1: 'Planet 1',
  planet_2: 'Planet 2',
  planet_3: 'Planet 3',
  planet_4: 'Planet 4',
  planet_5: 'Planet 5',
  planet_6: 'Planet 6',
  planet_7: 'Planet 7',
};

// === DIALOGUE DATA ===

export const MONOLOGUE_LINES = [
  "Still unsure what to make of that... Spending some time studying at the desk might help."
];

export const PICO_DIALOGUE_LINES = [
  { speaker: 'Pico', text: 'Hey, welcome home!' },
  { speaker: 'Pico', text: "Heading straight for the Telescope? I'll hold it down here." },
  { speaker: 'Kapoor', text: "These stars don't find themselves, thanks Pico." }
];

export const PICO_BLOCKING_DIALOGUE = [
  { speaker: 'Pico', text: 'Hey, welcome home!' },
  { speaker: 'Pico', text: "Heading straight for the Telescope? I'll hold it down here." },
  { speaker: 'Kapoor', text: "These stars don't find themselves, thanks Pico." }
];

export const ANTHRO_INTRO_DIALOGUE = [
  { speaker: 'Anthro', text: 'Hey there! I\'m Anthro, your friendly anthropomorphic phantom.' },
  { speaker: 'Anthro', text: 'I help medical physicists practice radiation treatments without any risk to real patients.' },
  { speaker: 'Anthro', text: 'Today we\'re doing TBI - Total Body Irradiation. Your job is to position me so the beam covers my whole body evenly.' },
  { speaker: 'Anthro', text: 'Use the arrow keys to move me, then press X when you think I\'m positioned correctly. Let\'s do this!' }
];

// === ACTIVITY POSITIONS (for keyboard navigation) ===
// Scaled from 600×360 to 300×180, offset by comp position (170, 90)

export const ACTIVITY_POSITIONS = [
  { id: 0, x: 215, y: 140 },  // top-left (center of region)
  { id: 1, x: 415, y: 140 },  // top-right
  { id: 2, x: 215, y: 220 },  // bottom-left
  { id: 3, x: 310, y: 220 },  // bottom-middle
  { id: 4, x: 415, y: 220 },  // bottom-right
];

// === TBI RESULT SYSTEM ===

/** Segment color: 0=red (miss), 1=yellow (partial), 2=green (hit) */
export type TbiSegmentColor = 0 | 1 | 2;

/** Results for all 10 body segments based on positioning choice */
export interface TbiSegmentResults {
  segments: TbiSegmentColor[]; // Array of 10 segment colors
}

/**
 * Lookup table: position index (0-15) → results for each segment
 * Position index is derived from tbiAnthroX via getPositionIndexFromX()
 * Segments: [head, neck, upperChest, lowerChest, upperAbdomen, lowerAbdomen, upperLegs, knees, lowerLegs, feet]
 */
export const TBI_POSITION_RESULTS: Record<number, TbiSegmentColor[]> = {
  // Position 0-9: Far from gantry to optimal - still in field, all sectors covered
  0:  [2, 2, 2, 2, 2, 2, 2, 2, 2, 2], 
  1:  [2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
  2:  [2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
  3:  [2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
  4:  [2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
  5:  [2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
  6:  [2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
  7:  [2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
  8:  [2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
  9:  [2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
  // Position 10-15: Too close to gantry (right side) - inverse square causes undercoverage at extremities
  10: [1, 2, 2, 2, 2, 2, 2, 2, 2, 1],
  11: [1, 1, 2, 2, 2, 2, 2, 2, 1, 1],
  12: [0, 1, 2, 2, 2, 2, 2, 2, 1, 0],
  13: [0, 1, 1, 2, 2, 2, 2, 1, 1, 0],
  14: [0, 0, 1, 2, 2, 2, 2, 1, 0, 0],
  15: [0, 0, 0, 1, 2, 2, 1, 0, 0, 0], // Very close to gantry - only core covered
};

/** Percentage values for each segment based on position (same lookup structure) */
export const TBI_POSITION_PERCENTAGES: Record<number, number[]> = {
  // Far from gantry to optimal - still in field, good coverage
  0:  [95, 97, 99, 100, 100, 100, 100, 99, 97, 95],
  1:  [96, 98, 99, 100, 100, 100, 100, 99, 98, 96],
  2:  [97, 98, 100, 100, 100, 100, 100, 100, 98, 97],
  3:  [97, 99, 100, 100, 100, 100, 100, 100, 99, 97],
  4:  [98, 99, 100, 100, 100, 100, 100, 100, 99, 98],
  5:  [98, 100, 100, 100, 100, 100, 100, 100, 100, 98],
  6:  [99, 100, 100, 100, 100, 100, 100, 100, 100, 99],
  7:  [100, 100, 100, 100, 100, 100, 100, 100, 100, 100], // Optimal
  8:  [100, 100, 100, 100, 100, 100, 100, 100, 100, 100], // Optimal
  9:  [99, 100, 100, 100, 100, 100, 100, 100, 100, 99],
  // Too close to gantry - inverse square causes undercoverage at extremities
  10: [78, 90, 98, 100, 103, 105, 104, 100, 88, 75],
  11: [72, 85, 94, 98, 102, 104, 102, 96, 82, 68],
  12: [65, 78, 88, 95, 100, 102, 100, 92, 75, 60],
  13: [58, 72, 82, 90, 97, 100, 95, 85, 68, 52],
  14: [52, 62, 75, 85, 92, 98, 90, 78, 58, 42],
  15: [45, 52, 68, 78, 85, 88, 82, 65, 48, 35],
};

/** 
 * Pixel positions for each segment's color bar within the result container
 * Positioned relative to the 300×180 result area
 * [x, y] coordinates for the TOP-LEFT corner of each bar
 * Bars are stacked with no spacing (each bar is flush against the next)
 */
export const TBI_SEGMENT_BAR_POSITIONS: Array<{ x: number; y: number; useSector1: boolean }> = [
  { x: 104, y: 48, useSector1: true },   // 0: head (8px tall, ends at 56)
  { x: 104, y: 56, useSector1: false },  // 1: neck (7px tall, ends at 63)
  { x: 104, y: 63, useSector1: false },  // 2: upperChest (7px tall, ends at 70)
  { x: 104, y: 70, useSector1: false },  // 3: lowerChest (7px tall, ends at 77)
  { x: 104, y: 77, useSector1: false },  // 4: upperAbdomen (7px tall, ends at 84)
  { x: 104, y: 84, useSector1: false },  // 5: lowerAbdomen (7px tall, ends at 91)
  { x: 104, y: 91, useSector1: false },  // 6: upperLegs (7px tall, ends at 98)
  { x: 104, y: 98, useSector1: false },  // 7: knees (7px tall, ends at 105)
  { x: 104, y: 105, useSector1: false }, // 8: lowerLegs (7px tall, ends at 112)
  { x: 104, y: 112, useSector1: false }, // 9: feet (7px tall, ends at 119)
];

/** Position of the mask overlay (absolute positioning to align with bars) */
// Position relative to the result container at (170, 90)
// Bars start at x:100, y:48 within the container
export const TBI_MASK_POSITION = { x: 94, y: 47 };

/** Total frames in the mask reveal animation (0 = full coverage, 10 = no coverage) */
export const TBI_MASK_TOTAL_FRAMES = 11;

/**
 * Position indicator frames in position-indicators.png sprite sheet
 * Frame 0: X (poor)
 * Frame 1: Tilde (suboptimal)
 * Frame 2: Checkmark (optimal)
 */
export const TBI_INDICATOR_FRAMES = {
  OPTIMAL: 2,
  SUBOPTIMAL: 1,
  POOR: 0,
} as const;

/**
 * Pixel positions for each segment's position indicator (checkmark/tilde/X)
 * Positioned to the right of each color bar
 * [x, y] coordinates for the TOP-LEFT corner of each 5×3px indicator
 */
export const TBI_SEGMENT_INDICATOR_POSITIONS: Array<{ x: number; y: number }> = [
  { x: 146, y: 51 },  // 0: head
  { x: 146, y: 58 },  // 1: neck
  { x: 146, y: 65 },  // 2: upperChest
  { x: 146, y: 72 },  // 3: lowerChest
  { x: 146, y: 79 },  // 4: upperAbdomen
  { x: 146, y: 86 },  // 5: lowerAbdomen
  { x: 146, y: 93 },  // 6: upperLegs
  { x: 146, y: 100 }, // 7: knees
  { x: 146, y: 107 }, // 8: lowerLegs
  { x: 146, y: 114 }, // 9: feet
];

/**
 * Maps a color bar frame index (0-2) to an indicator frame (0=checkmark, 1=tilde, 2=X)
 * The mapping is reversed: green bar (2) = checkmark (0), yellow bar (1) = tilde (1), red bar (0) = X (2)
 */
export function getIndicatorFrameFromBarFrame(barFrame: number): number {
  if (barFrame === 2) {
    return TBI_INDICATOR_FRAMES.OPTIMAL;    // Green bar → checkmark
  } else if (barFrame === 1) {
    return TBI_INDICATOR_FRAMES.SUBOPTIMAL; // Yellow bar → tilde
  } else {
    return TBI_INDICATOR_FRAMES.POOR;       // Red bar → X
  }
}

/**
 * Evaluates if a TBI positioning result passes or fails
 * Pass criteria: At least 8 out of 10 segments are green (value 2)
 * @param anthroX - The anthro X position in pixels
 * @returns true if pass, false if fail
 */
export function evaluateTbiPositioning(anthroX: number): boolean {
  const positionIndex = getPositionIndexFromX(anthroX);
  const segments = TBI_POSITION_RESULTS[positionIndex];
  if (!segments) return false;
  
  const greenCount = segments.filter(segment => segment === 2).length;
  return greenCount >= 8;
}

/**
 * Gets the backdrop frame for TBI positioning result
 * Frame 0: Base background (shown during mask animation + 500ms pause)
 * Frame 1: Fail result (shown after reveal delay)
 * Frame 2: Pass result (shown after reveal delay)
 * @param anthroX - The anthro X position in pixels
 * @param resultRevealed - Whether the result reveal delay has completed
 * @returns Backdrop frame index (0 until revealed, 1 for fail, 2 for pass after reveal)
 */
export function getTbiResultBackdropFrame(anthroX: number, resultRevealed: boolean): number {
  // Show base background until result is revealed (after mask animation + 500ms delay)
  if (!resultRevealed) {
    return 0;
  }
  
  // Once revealed, show pass/fail result
  const passed = evaluateTbiPositioning(anthroX);
  return passed ? 2 : 1;
}

// === ANIMATION SPEEDS ===

export const WALK_SPEED = 4.0; // pixels per frame
export const CLIMB_SPEED = 4.0; // pixels per frame for climbing
export const FRAME_INTERVAL = 50; // ms between animation frames
export const WALK_SPRITE_FRAME_SPEED = 1.5; // Update sprite frame every N ticks for walking (1 = fastest)
export const IDLE_SPRITE_FRAME_SPEED = 12; // Update sprite frame every N ticks for idle (0.25x = 4x slower)
export const CLIMB_SPRITE_FRAME_SPEED = 2; // Update sprite frame every N ticks for climbing
export const BUBBLE_FRAME_SPEED = 150; // ms per frame for speech bubbles

// === CLIMBING CONSTANTS ===

export const CLIMB_X_THRESHOLD = 545; // X position where climbing is allowed
export const CLIMB_DISTANCE = 160; // Total distance to climb
export const CLIMB_X_TOLERANCE = 10; // Allow climbing if within 10px of threshold
export const CLIMB_RIGHT_EXTENSION = 15; // Extra pixels to the right beyond SECOND_FLOOR_BOUNDS.right for climbing
export const FLOOR_TOLERANCE = 15; // How close to floor needed to walk/idle

// === CUTSCENE TIMING ===

export const SLOW_SCROLL_DURATION = 4.0; // seconds for dramatic slow scroll
export const DEFAULT_TRANSITION_DURATION = 0.8; // seconds for normal transitions

