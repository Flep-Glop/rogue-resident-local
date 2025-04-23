'use client';

import { useEffect, useRef } from 'react';
import { create } from 'zustand';

// Define sound types
export type SoundType = 
  | 'select' 
  | 'hover'
  | 'click'
  | 'back'
  | 'success'
  | 'error'
  | 'warning'
  | 'connection'
  | 'challenge-complete'
  | string; // Allow custom paths

// Sound configuration with file paths and default volumes
const SOUND_CONFIG: Record<string, { path: string, volume: number }> = {
  'select': { path: '/sounds/rogue.select.mp3', volume: 0.5 },
  'hover': { path: '/sounds/rogue.select.mp3', volume: 0.2 },
  'click': { path: '/sounds/rogue.select.mp3', volume: 0.4 },
  'back': { path: '/sounds/rogue.select.mp3', volume: 0.3 },
  'success': { path: '/sounds/rogue.select.mp3', volume: 0.6 },
  'error': { path: '/sounds/rogue.wrong.mp3', volume: 0.5 },
  'warning': { path: '/sounds/rogue.wrong-2.mp3', volume: 0.5 },
  'connection': { path: '/sounds/rogue.blip.mp3', volume: 0.4 },
  'challenge-complete': { path: '/sounds/rogue.exclaim.mp3', volume: 0.7 }
};

// Define sound store state
interface SoundState {
  isMuted: boolean;
  volume: number;
  playSound: (type: SoundType) => void;
  setMuted: (muted: boolean) => void;
  setVolume: (volume: number) => void;
}

// Create sound store
export const useSoundStore = create<SoundState>((set, get) => ({
  isMuted: false,
  volume: 0.5,
  playSound: (type: SoundType) => {
    if (typeof window === 'undefined' || get().isMuted) return;
    
    // Check if this is a predefined sound type or a custom path
    const isCustomPath = type.startsWith('/');
    
    if (isCustomPath) {
      // Direct path provided
      const audio = new Audio(type);
      audio.volume = 0.5 * get().volume; // Use default volume for custom sounds
      audio.play().catch(e => console.warn('Audio play failed:', e));
      return;
    }
    
    // Standard sound type
    const config = SOUND_CONFIG[type];
    if (!config) return;
    
    const audio = new Audio(config.path);
    audio.volume = config.volume * get().volume;
    audio.play().catch(e => console.warn('Audio play failed:', e));
  },
  setMuted: (muted: boolean) => set({ isMuted: muted }),
  setVolume: (volume: number) => set({ volume: Math.max(0, Math.min(1, volume)) })
}));

// Play sound function for direct usage
export function playSound(type: SoundType) {
  useSoundStore.getState().playSound(type);
}

// Sound Manager Component
export function SoundManager() {
  const initialized = useRef(false);
  
  // Initialize
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    
    // Initialize from localStorage if available
    if (typeof window !== 'undefined') {
      try {
        const savedMuted = localStorage.getItem('soundMuted');
        const savedVolume = localStorage.getItem('soundVolume');
        
        if (savedMuted !== null) {
          useSoundStore.getState().setMuted(savedMuted === 'true');
        }
        
        if (savedVolume !== null) {
          useSoundStore.getState().setVolume(Number(savedVolume));
        }
      } catch (e) {
        console.warn('Error loading sound settings:', e);
      }
    }
  }, []);
  
  return null;
}

export default SoundManager; 