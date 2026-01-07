import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AudioSettings, DEFAULT_AUDIO_SETTINGS } from '../audio/audio.constants';
import { audioManager } from '../audio/AudioManager';

interface AudioStore extends AudioSettings {
  // Actions
  setMasterVolume: (volume: number) => void;
  setSfxVolume: (volume: number) => void;
  setMusicVolume: (volume: number) => void;
  toggleMute: () => void;
  setMuted: (muted: boolean) => void;
  
  // Sync settings to audio manager
  syncToManager: () => void;
}

export const useAudioStore = create<AudioStore>()(
  persist(
    (set, get) => ({
      ...DEFAULT_AUDIO_SETTINGS,

      setMasterVolume: (volume: number) => {
        const clamped = Math.max(0, Math.min(1, volume));
        set({ masterVolume: clamped });
        audioManager.updateSettings({ masterVolume: clamped });
      },

      setSfxVolume: (volume: number) => {
        const clamped = Math.max(0, Math.min(1, volume));
        set({ sfxVolume: clamped });
        audioManager.updateSettings({ sfxVolume: clamped });
      },

      setMusicVolume: (volume: number) => {
        const clamped = Math.max(0, Math.min(1, volume));
        set({ musicVolume: clamped });
        audioManager.updateSettings({ musicVolume: clamped });
      },

      toggleMute: () => {
        const newMuted = audioManager.toggleMute();
        set({ muted: newMuted });
      },

      setMuted: (muted: boolean) => {
        audioManager.setMuted(muted);
        set({ muted });
      },

      // Call this after audio manager initializes to sync persisted settings
      syncToManager: () => {
        const state = get();
        audioManager.updateSettings({
          masterVolume: state.masterVolume,
          sfxVolume: state.sfxVolume,
          musicVolume: state.musicVolume,
          muted: state.muted,
        });
        if (state.muted) {
          audioManager.setMuted(true);
        }
      },
    }),
    {
      name: 'observatory-audio-settings',
      // Only persist volume settings, not actions
      partialize: (state) => ({
        masterVolume: state.masterVolume,
        sfxVolume: state.sfxVolume,
        musicVolume: state.musicVolume,
        muted: state.muted,
      }),
    }
  )
);

// Debug helper
if (typeof window !== 'undefined') {
  (window as unknown as { getAudioStore: () => AudioStore }).getAudioStore = () => useAudioStore.getState();
}

