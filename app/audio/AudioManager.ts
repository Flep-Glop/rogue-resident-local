import { 
  SfxId, 
  MusicId, 
  VoiceoverId,
  SFX_CONFIG, 
  MUSIC_CONFIG, 
  VOICEOVER_CONFIG,
  AudioSettings, 
  DEFAULT_AUDIO_SETTINGS 
} from './audio.constants';

/**
 * Singleton AudioManager - handles all audio playback
 * Uses Web Audio API for precise control and low latency
 */
class AudioManager {
  private static instance: AudioManager;
  private audioContext: AudioContext | null = null;
  private sfxBuffers: Map<string, AudioBuffer> = new Map();
  private musicElements: Map<MusicId, HTMLAudioElement> = new Map();
  private currentMusic: MusicId | null = null;
  private currentVoiceover: HTMLAudioElement | null = null;
  private settings: AudioSettings = DEFAULT_AUDIO_SETTINGS;
  private lastPlayTime: Map<SfxId, number> = new Map();
  private initialized = false;
  private initPromise: Promise<void> | null = null;

  private constructor() {}

  static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  /**
   * Initialize audio context (must be called after user interaction)
   */
  async init(): Promise<void> {
    if (this.initialized) return;
    if (this.initPromise) return this.initPromise;
    
    this.initPromise = this._doInit();
    return this.initPromise;
  }

  private async _doInit(): Promise<void> {
    try {
      // Create audio context
      this.audioContext = new AudioContext();
      
      // Resume if suspended (browser autoplay policy)
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }
      
      // Preload all sound effects
      await this.preloadSfx();
      
      this.initialized = true;
      console.log('[AudioManager] Initialized successfully');
    } catch (error) {
      console.error('[AudioManager] Failed to initialize:', error);
    }
  }

  /**
   * Preload all sound effects into memory
   */
  private async preloadSfx(): Promise<void> {
    if (!this.audioContext) return;

    const loadPromises = Object.entries(SFX_CONFIG).map(async ([id, config]) => {
      try {
        const variations = config.variations;
        
        if (variations && variations.length > 0) {
          // Load all variations (e.g., footstep-a.ogg, footstep-b.ogg)
          for (const variant of variations) {
            const path = `${config.path}-${variant}.ogg`;
            await this.loadAudioBuffer(path, `${id}_${variant}`);
          }
        } else {
          // Single file
          await this.loadAudioBuffer(config.path, id);
        }
      } catch (error) {
        console.warn(`[AudioManager] Failed to load SFX: ${id}`, error);
      }
    });

    await Promise.all(loadPromises);
    console.log(`[AudioManager] Loaded ${this.sfxBuffers.size} sound effects`);
  }

  /**
   * Load a single audio file into a buffer
   */
  private async loadAudioBuffer(path: string, key: string): Promise<void> {
    if (!this.audioContext) return;
    
    try {
      const response = await fetch(path);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      this.sfxBuffers.set(key, audioBuffer);
    } catch (error) {
      console.warn(`[AudioManager] Failed to load: ${path}`, error);
    }
  }

  /**
   * Play a sound effect
   */
  playSfx(id: SfxId): void {
    if (!this.initialized || !this.audioContext || this.settings.muted) return;

    const config = SFX_CONFIG[id];
    if (!config) {
      console.warn(`[AudioManager] Unknown SFX: ${id}`);
      return;
    }

    // Cooldown check - prevents sound spam
    if (config.cooldown) {
      const lastTime = this.lastPlayTime.get(id) || 0;
      const now = Date.now();
      if (now - lastTime < config.cooldown) {
        return; // Still in cooldown
      }
      this.lastPlayTime.set(id, now);
    }

    // Pick buffer key (random variation if applicable)
    let bufferKey = id as string;
    if (config.variations && config.variations.length > 0) {
      const randomVariant = config.variations[Math.floor(Math.random() * config.variations.length)];
      bufferKey = `${id}_${randomVariant}`;
    }

    const buffer = this.sfxBuffers.get(bufferKey);
    if (!buffer) {
      console.warn(`[AudioManager] Buffer not found: ${bufferKey}`);
      return;
    }

    // Resume context if suspended
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    // Create audio nodes
    const source = this.audioContext.createBufferSource();
    const gainNode = this.audioContext.createGain();
    
    source.buffer = buffer;
    source.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    // Apply volumes: config * sfxVolume * masterVolume
    const volume = config.volume * this.settings.sfxVolume * this.settings.masterVolume;
    gainNode.gain.value = volume;
    
    source.start();
  }

  /**
   * Play background music with crossfade
   */
  playMusic(id: MusicId): void {
    if (this.settings.muted) return;
    if (this.currentMusic === id) return;

    const config = MUSIC_CONFIG[id];
    if (!config) {
      console.warn(`[AudioManager] Unknown music track: ${id}`);
      return;
    }

    // Fade out current music
    if (this.currentMusic) {
      this.stopMusic(this.currentMusic);
    }

    // Create new audio element
    const audio = new Audio(config.path);
    audio.loop = config.loop;
    audio.volume = 0;
    
    this.musicElements.set(id, audio);
    this.currentMusic = id;
    
    console.log(`[AudioManager] Starting music: ${id} from ${config.path}`);
    
    audio.play().then(() => {
      console.log(`[AudioManager] Music playing: ${id}`);
      // Fade in
      const targetVolume = config.volume * this.settings.musicVolume * this.settings.masterVolume;
      this.fadeMusic(id, targetVolume, config.fadeIn || 0);
    }).catch(error => {
      // Music playback often fails due to autoplay policy - this is expected
      console.warn('[AudioManager] Music playback failed:', error.message);
      // Clean up on failure
      this.musicElements.delete(id);
      if (this.currentMusic === id) {
        this.currentMusic = null;
      }
    });
  }

  /**
   * Stop music with fade out
   */
  stopMusic(id?: MusicId): void {
    const targetId = id || this.currentMusic;
    if (!targetId) return;

    const audio = this.musicElements.get(targetId);
    const config = MUSIC_CONFIG[targetId];
    if (!audio || !config) return;

    this.fadeMusic(targetId, 0, config.fadeOut || 500, () => {
      audio.pause();
      audio.src = '';
      this.musicElements.delete(targetId);
      if (this.currentMusic === targetId) {
        this.currentMusic = null;
      }
    });
  }

  /**
   * Play a voiceover line (one-shot dialogue audio)
   * Stops any currently playing voiceover
   */
  playVoiceover(id: VoiceoverId): void {
    if (this.settings.muted) return;

    const config = VOICEOVER_CONFIG[id];
    if (!config) {
      console.warn(`[AudioManager] Unknown voiceover: ${id}`);
      return;
    }

    // Stop any currently playing voiceover
    this.stopVoiceover();

    // Create new audio element
    const audio = new Audio(config.path);
    audio.volume = config.volume * this.settings.sfxVolume * this.settings.masterVolume;
    
    this.currentVoiceover = audio;
    
    console.log(`[AudioManager] Playing voiceover: ${id}`);
    
    audio.play().then(() => {
      console.log(`[AudioManager] Voiceover playing: ${id}`);
    }).catch(error => {
      console.warn('[AudioManager] Voiceover playback failed:', error.message);
      this.currentVoiceover = null;
    });

    // Clean up when voiceover ends
    audio.addEventListener('ended', () => {
      if (this.currentVoiceover === audio) {
        this.currentVoiceover = null;
      }
    });
  }

  /**
   * Stop currently playing voiceover
   */
  stopVoiceover(): void {
    if (this.currentVoiceover) {
      this.currentVoiceover.pause();
      this.currentVoiceover.src = '';
      this.currentVoiceover = null;
    }
  }

  /**
   * Fade music volume over time
   */
  private fadeMusic(
    id: MusicId, 
    targetVolume: number, 
    duration: number, 
    onComplete?: () => void
  ): void {
    const audio = this.musicElements.get(id);
    if (!audio) return;

    if (duration === 0) {
      audio.volume = targetVolume;
      onComplete?.();
      return;
    }

    const startVolume = audio.volume;
    const startTime = Date.now();
    
    const fade = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Ease-out curve for smoother fade
      const eased = 1 - Math.pow(1 - progress, 2);
      audio.volume = startVolume + (targetVolume - startVolume) * eased;
      
      if (progress < 1) {
        requestAnimationFrame(fade);
      } else {
        onComplete?.();
      }
    };
    
    requestAnimationFrame(fade);
  }

  /**
   * Update audio settings
   */
  updateSettings(settings: Partial<AudioSettings>): void {
    this.settings = { ...this.settings, ...settings };
    
    // Update current music volume immediately
    if (this.currentMusic) {
      const audio = this.musicElements.get(this.currentMusic);
      const config = MUSIC_CONFIG[this.currentMusic];
      if (audio && config) {
        audio.volume = config.volume * this.settings.musicVolume * this.settings.masterVolume;
      }
    }
  }

  /**
   * Toggle mute
   */
  toggleMute(): boolean {
    this.settings.muted = !this.settings.muted;
    
    if (this.settings.muted) {
      // Pause all music and stop voiceover
      this.musicElements.forEach(audio => audio.pause());
      this.stopVoiceover();
    } else {
      // Resume current music
      if (this.currentMusic) {
        const audio = this.musicElements.get(this.currentMusic);
        audio?.play().catch(() => {});
      }
    }
    
    return this.settings.muted;
  }

  /**
   * Set muted state directly
   */
  setMuted(muted: boolean): void {
    if (this.settings.muted === muted) return;
    this.toggleMute();
  }

  /**
   * Check if initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Get current settings
   */
  getSettings(): AudioSettings {
    return { ...this.settings };
  }
}

// Export singleton instance
export const audioManager = AudioManager.getInstance();
export default AudioManager;

