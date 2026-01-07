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
    volume: 0.35,  // Background music - not too loud
    loop: true, 
    fadeIn: 2000,  // 2 second fade in
    fadeOut: 1500  // 1.5 second fade out
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
  musicVolume: 0.7,
  muted: false,
};

