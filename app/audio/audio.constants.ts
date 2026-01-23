// === SOUND EFFECT DEFINITIONS ===

export type SfxId = 
  | 'ui_hover'       // Arrow key navigation / hover
  | 'ui_confirm'     // X key press / confirm action
  | 'ui_decline'     // C key / back / cancel
  | 'ui_denied'      // Trying locked module or invalid action
  | 'footstep';      // Walking (4 variations: a, b, c, d)

// Music tracks
export type MusicId = 
  | 'main_theme';  // The Observatory - loops throughout the game

// Voiceover lines - one-shot dialogue audio
// Naming pattern: voiceover {character}-{line}.mp3
export type VoiceoverId = 
  // Player lines (masc/fem variants)
  | 'player_masc_pico'       // Player responding to Pico
  | 'player_fem_pico'
  | 'player_masc_desk'  // After closing ??? star modal
  | 'player_fem_desk'
  // Anthro intro dialogue (5 lines - ANTHRO_INTRO_DIALOGUE)
  | 'anthro_hello'         // Intro 0: "Hey there! Name's Anthro..."
  | 'anthro_description'   // Intro 1: "I'm basically a practice dummy..."
  | 'anthro_how_it_works'  // Intro 2: "So basically this is how it works, here's a page..."
  | 'anthro_after_page'    // Intro 3: "As you can see from the page, today we're working on TBI..."
  | 'anthro_directions'    // Intro 4: "Use the arrow keys to move me around..."
  // Anthro fail dialogue (2 lines - ANTHRO_FAIL_DIALOGUE)
  | 'anthro_dont_short_me' // Fail 0: "Hey don't short me now!..."
  | 'anthro_try_again'     // Fail 1: "No worries, let's try again."
  // Anthro pass dialogue (4 lines - ANTHRO_PASS_DIALOGUE)
  | 'anthro_great_job'     // Pass 0: "Great job! As you deduced..."
  | 'anthro_explanation'   // Pass 1: "By placing me far enough from the gantry..."
  | 'anthro_rewards'       // Pass 2: "Great work today, here's a couple items..."
  | 'anthro_wrap_up';      // Pass 3: "That funding can be spent in the shop..."

// === SOUND CONFIGURATION ===

export interface SfxConfig {
  path: string;
  volume: number;       // 0-1, relative to master
  cooldown?: number;    // ms - prevent spam (e.g., footsteps)
  variations?: string[];  // Array of variation suffixes (e.g., ['a', 'b', 'c', 'd'])
}

export interface MusicConfig {
  path: string;
  volume: number;
  loop: boolean;
  fadeIn?: number;      // ms
  fadeOut?: number;     // ms
}

export interface VoiceoverConfig {
  path: string;
  volume: number;       // 0-1, relative to master
}

export const SFX_CONFIG: Record<SfxId, SfxConfig> = {
  ui_hover: { 
    path: '/audio/hover.wav', 
    volume: 0.4 
  },
  ui_confirm: { 
    path: '/audio/confirm.wav', 
    volume: 0.5 
  },
  ui_decline: { 
    path: '/audio/decline.wav', 
    volume: 0.4 
  },
  ui_denied: { 
    path: '/audio/denied.wav', 
    volume: 0.4 
  },
  footstep: { 
    path: '/audio/footstep', // Base path, variations append -a.ogg, -b.ogg, etc.
    volume: 0.35, 
    cooldown: 180,
    variations: ['a', 'b', 'c', 'd']
  },
};

// Music config
export const MUSIC_CONFIG: Record<MusicId, MusicConfig> = {
  main_theme: { 
    path: '/audio/The-Observatory.mp3',
    volume: 0.99,  // Background music - not too loud
    loop: true, 
    fadeIn: 2000,  // 2 second fade in
    fadeOut: 1500  // 1.5 second fade out
  },
};

// Voiceover config - one-shot dialogue audio clips
// File naming: "voiceover {character}-{line}.mp3" (space after voiceover for DAW export convenience)
export const VOICEOVER_CONFIG: Record<VoiceoverId, VoiceoverConfig> = {
  // Player lines
  player_masc_pico: {
    path: '/audio/voiceover/voiceover player-masc-pico.mp3',
    volume: 0.4,
  },
  player_fem_pico: {
    path: '/audio/voiceover/voiceover player-fem-pico.mp3',
    volume: 0.4,
  },
  player_masc_desk: {
    path: '/audio/voiceover/voiceover player-masc-desk.mp3',
    volume: 0.4,
  },
  player_fem_desk: {
    path: '/audio/voiceover/voiceover player-fem-desk.mp3',
    volume: 0.4,
  },
  // Anthro intro dialogue (indices match ANTHRO_INTRO_DIALOGUE)
  anthro_hello: {
    path: '/audio/voiceover/voiceover anthro-hello.mp3',
    volume: 0.4,
  },
  anthro_description: {
    path: '/audio/voiceover/voiceover anthro-description.mp3',
    volume: 0.4,
  },
  anthro_explanation: {
    path: '/audio/voiceover/voiceover anthro-explanation.mp3',
    volume: 0.4,
  },
  anthro_how_it_works: {
    path: '/audio/voiceover/voiceover anthro-how-it-works.mp3',
    volume: 0.4,
  },
  // Anthro result feedback
  anthro_great_job: {
    path: '/audio/voiceover/voiceover anthro-great-job.mp3',
    volume: 0.4,
  },
  anthro_try_again: {
    path: '/audio/voiceover/voiceover anthro-try-again.mp3',
    volume: 0.4,
  },
  // Anthro additional lines
  anthro_directions: {
    path: '/audio/voiceover/voiceover anthro-directions.mp3',
    volume: 0.4,
  },
  anthro_dont_short_me: {
    path: '/audio/voiceover/voiceover anthro-dont-short-me.mp3',
    volume: 0.4,
  },
  anthro_rewards: {
    path: '/audio/voiceover/voiceover anthro-rewards.mp3',
    volume: 0.4,
  },
  anthro_wrap_up: {
    path: '/audio/voiceover/voiceover anthro-wrap-up.mp3',
    volume: 0.4,
  },
  anthro_after_page: {
    path: '/audio/voiceover/voiceover anthro-after-page.mp3',
    volume: 0.4,
  },
};

// === DEFAULT AUDIO SETTINGS ===

export interface AudioSettings {
  masterVolume: number;   // 0-1
  sfxVolume: number;      // 0-1
  musicVolume: number;    // 0-1
  muted: boolean;
}

export const DEFAULT_AUDIO_SETTINGS: AudioSettings = {
  masterVolume: 0.8,
  sfxVolume: 1.0,
  musicVolume: 0.8,
  muted: false,
};

