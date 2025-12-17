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
  hoveredActivity: number | null;
  highlightedActivity: number;
  anthroIntroVisible: boolean;
  anthroIntroFrame: number;
  tbiPositioningVisible: boolean;
  tbiPositioningFrame: number;
  tbiResultVisible: boolean;
  tbiResultFrame: number;
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

// === DEFAULT STATES ===

export const DEFAULT_SPEECH_BUBBLE: SpeechBubbleState = {
  visible: true,
  highlighted: false,
  frame: 1,
};

export const DEFAULT_SPEECH_BUBBLES: SpeechBubblesState = {
  telescope: { ...DEFAULT_SPEECH_BUBBLE },
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
  hoveredActivity: null,
  highlightedActivity: 0,
  anthroIntroVisible: false,
  anthroIntroFrame: 0,
  tbiPositioningVisible: false,
  tbiPositioningFrame: 0,
  tbiResultVisible: false,
  tbiResultFrame: 0,
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

export const ANTHRO_INTRO_TOTAL_FRAMES = 4; // 1200px / 300px = 4 frames
export const TBI_POSITIONING_TOTAL_FRAMES = 16; // 4800px / 300px = 16 frames

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
  "Still unsure what to make of that... Spending some more time studying might help."
];

export const PICO_DIALOGUE_LINES = [
  { speaker: 'Pico', text: 'Did ya know, back in my day we used to just look up at the stars and dream.' },
  { speaker: 'Pico', text: "We didn't have one of those fancy telescopes like ya got upstairs." },
  { speaker: 'Kapoor', text: 'Back in your day, huh? and remind me, how far back are we talking?' },
  { speaker: 'Pico', text: "Ohhh don't worry about that. Mm-mm. Trust me, you couldn' handle the truth kid…" }
];

export const PICO_BLOCKING_DIALOGUE = [
  { speaker: 'Pico', text: 'Oh too good for your old pal Pico huh? Ya getting fresh with me kid?' },
  { speaker: 'Pico', text: 'Come here let me tell you a couple of three things about how things used to be! Back when we used to respect one anotha.' }
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

// === ANIMATION SPEEDS ===

export const WALK_SPEED = 4.0; // pixels per frame
export const CLIMB_SPEED = 4.0; // pixels per frame for climbing
export const FRAME_INTERVAL = 50; // ms between animation frames
export const WALK_SPRITE_FRAME_SPEED = 2; // Update sprite frame every N ticks for walking
export const IDLE_SPRITE_FRAME_SPEED = 12; // Update sprite frame every N ticks for idle (0.25x = 4x slower)
export const CLIMB_SPRITE_FRAME_SPEED = 2; // Update sprite frame every N ticks for climbing
export const BUBBLE_FRAME_SPEED = 150; // ms per frame for speech bubbles

// === CLIMBING CONSTANTS ===

export const CLIMB_X_THRESHOLD = 545; // X position where climbing is allowed
export const CLIMB_DISTANCE = 160; // Total distance to climb
export const CLIMB_X_TOLERANCE = 10; // Allow climbing if within 10px of threshold
export const FLOOR_TOLERANCE = 15; // How close to floor needed to walk/idle

// === CUTSCENE TIMING ===

export const SLOW_SCROLL_DURATION = 5.0; // seconds for dramatic slow scroll
export const DEFAULT_TRANSITION_DURATION = 0.8; // seconds for normal transitions

