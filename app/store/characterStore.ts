import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  SkinRampId, 
  HairRampId, 
  ClothesRampId 
} from '@/app/character-creator/useRecoloredSprite';

// Re-export types for convenience
export type { SkinRampId, HairRampId, ClothesRampId };

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

// Part IDs matching character-creator/page.tsx
export type PartId = 
  | 'legs' | 'shoes' | 'body' | 'ears' | 'face' | 'nose' 
  | 'eyes' | 'eyebrows' | 'mouth' | 'facial-hair' | 'hair' | 'extras';

// Voice type for player voiceovers
export type VoiceType = 'feminine' | 'masculine';

// ============================================================================
// CHARACTER STATE INTERFACE
// ============================================================================

export interface PlayerCharacter {
  // Character name (max 10 characters)
  name: string;
  // Part variant selections (0 = none for optional parts, 1+ = variant number)
  parts: Record<PartId, number>;
  // Color ramp selections
  skinRamp: SkinRampId;
  hairRamp: HairRampId;
  shirtRamp: ClothesRampId;
  pantsRamp: ClothesRampId;
  // Voice type for player voiceovers
  voiceType: VoiceType;
}

// Default character - matches DEFAULT_SELECTIONS in page.tsx
export const DEFAULT_CHARACTER: PlayerCharacter = {
  name: '',
  parts: {
    'body': 1,
    'legs': 1,
    'shoes': 1,
    'ears': 1,
    'face': 1,
    'nose': 1,
    'eyes': 1,
    'eyebrows': 1,
    'mouth': 1,
    'facial-hair': 0,
    'hair': 1,
    'extras': 0,
  },
  skinRamp: 'pale2',
  hairRamp: 'black',
  shirtRamp: 'black',
  pantsRamp: 'black',
  voiceType: 'feminine',
};

// ============================================================================
// STORE INTERFACE
// ============================================================================

interface CharacterState {
  // Current character configuration
  character: PlayerCharacter;
  
  // Generated sprite sheet (data URL from compositor)
  spriteSheet: string | null;
  
  // Whether character has been created (controls flow)
  hasCreatedCharacter: boolean;
  
  // Actions
  setCharacter: (character: PlayerCharacter) => void;
  setSpriteSheet: (spriteSheet: string) => void;
  setHasCreatedCharacter: (created: boolean) => void;
  resetCharacter: () => void;
}

// ============================================================================
// CREATE STORE WITH PERSISTENCE
// ============================================================================

export const useCharacterStore = create<CharacterState>()(
  persist(
    (set) => ({
      character: DEFAULT_CHARACTER,
      spriteSheet: null,
      hasCreatedCharacter: false,
      
      setCharacter: (character) => {
        console.log('[CharacterStore] Setting character:', character);
        set({ character });
      },
      
      setSpriteSheet: (spriteSheet) => {
        console.log('[CharacterStore] Setting sprite sheet');
        set({ spriteSheet });
      },
      
      setHasCreatedCharacter: (created) => {
        console.log('[CharacterStore] Has created character:', created);
        set({ hasCreatedCharacter: created });
      },
      
      resetCharacter: () => {
        console.log('[CharacterStore] Resetting character');
        set({ 
          character: DEFAULT_CHARACTER, 
          spriteSheet: null, 
          hasCreatedCharacter: false 
        });
      },
    }),
    {
      name: 'observatory-character',
      // Only persist character config, not the sprite sheet (too large)
      partialize: (state) => ({
        character: state.character,
        hasCreatedCharacter: state.hasCreatedCharacter,
      }),
    }
  )
);

// Debug helper
if (typeof window !== 'undefined') {
  (window as any).getCharacterStore = () => useCharacterStore.getState();
}
