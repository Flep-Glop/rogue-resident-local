import { useEffect, useCallback, useRef } from 'react';
import { audioManager } from './AudioManager';
import { SfxId, MusicId, VoiceoverId } from './audio.constants';

/**
 * Hook to initialize audio system on first user interaction
 * Place this in your root game component
 */
export function useAudioInit() {
  const initializedRef = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const initAudio = async () => {
      if (initializedRef.current) return;
      initializedRef.current = true;
      await audioManager.init();
    };

    // Initialize on first user interaction (required by browser autoplay policies)
    const handleInteraction = () => {
      initAudio();
      // Keep listeners for a bit to ensure init completes
      setTimeout(() => {
        window.removeEventListener('click', handleInteraction);
        window.removeEventListener('keydown', handleInteraction);
        window.removeEventListener('touchstart', handleInteraction);
      }, 100);
    };

    window.addEventListener('click', handleInteraction);
    window.addEventListener('keydown', handleInteraction);
    window.addEventListener('touchstart', handleInteraction);

    return () => {
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
    };
  }, []);
}

/**
 * Hook to play sound effects
 * Returns a play function that can be called with a SfxId
 * 
 * @example
 * const { play } = useSound();
 * play('ui_confirm');
 */
export function useSound() {
  const play = useCallback((id: SfxId) => {
    audioManager.playSfx(id);
  }, []);

  return { play };
}

/**
 * Hook to control background music
 * Automatically plays/stops music when trackId changes
 * Retries if audio system isn't ready yet
 * 
 * @param trackId - The music track to play, or null to stop
 * 
 * @example
 * // Play home music
 * useMusic('home_ambient');
 * 
 * // Conditionally play music
 * useMusic(isPlaying ? 'home_ambient' : null);
 */
export function useMusic(trackId: MusicId | null) {
  const prevTrackRef = useRef<MusicId | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Clear any pending retry
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }

    if (trackId === prevTrackRef.current) return;
    prevTrackRef.current = trackId;

    if (trackId) {
      // Try to play, retry if not initialized
      const attemptPlay = (retries = 0) => {
        if (!audioManager.isInitialized() && retries < 10) {
          // Audio not ready, retry after a short delay
          retryTimeoutRef.current = setTimeout(() => attemptPlay(retries + 1), 500);
          return;
        }
        audioManager.playMusic(trackId);
      };
      attemptPlay();
    } else {
      audioManager.stopMusic();
    }

    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [trackId]);
}

/**
 * Hook to play voiceover lines
 * Returns a play function that can be called with a VoiceoverId
 * 
 * @example
 * const { playVoiceover } = useVoiceover();
 * playVoiceover('player_pico_masc');
 */
export function useVoiceover() {
  const play = useCallback((id: VoiceoverId) => {
    audioManager.playVoiceover(id);
  }, []);

  const stop = useCallback(() => {
    audioManager.stopVoiceover();
  }, []);

  return { playVoiceover: play, stopVoiceover: stop };
}

/**
 * Hook for footstep sounds tied to walking/climbing state
 * Automatically plays footstep sounds at regular intervals while moving
 * 
 * @param isWalking - Whether the character is walking
 * @param isClimbing - Whether the character is climbing
 * 
 * @example
 * useFootstepSounds(playerIsWalking, playerIsClimbing);
 */
export function useFootstepSounds(isWalking: boolean, isClimbing: boolean = false) {
  const isMoving = isWalking || isClimbing;
  
  useEffect(() => {
    if (!isMoving) return;

    // Play initial footstep
    audioManager.playSfx('footstep');

    // Continue playing while moving
    const interval = setInterval(() => {
      audioManager.playSfx('footstep');
    }, 220); // Roughly matches walking animation speed

    return () => clearInterval(interval);
  }, [isMoving]);
}

/**
 * Direct access to audio manager for advanced use cases
 * Prefer useSound() for most cases
 */
export function useAudioManager() {
  return audioManager;
}

