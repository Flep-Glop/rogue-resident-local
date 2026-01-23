import { create } from 'zustand';

// Game phases for managing transitions
export type GamePhase = 'title' | 'character_creator' | 'playing';

// State interface for the game store
interface GameState {
  // Core game state
  isPlaying: boolean;
  gamePhase: GamePhase;
  
  // Constellation cutscene tracking
  hasCompletedFirstActivity: boolean;
  hasSeenConstellationCutscene: boolean;
  setHasCompletedFirstActivity: (completed: boolean) => void;
  setHasSeenConstellationCutscene: (seen: boolean) => void;
  
  // Actions
  startGame: () => void;
  goToCharacterCreator: () => void;
  startFromCharacterCreator: () => void;
  returnToTitle: () => void;
}

// Create the game store
export const useGameStore = create<GameState>((set, get) => ({
  // Initialize core game state
  isPlaying: false,
  gamePhase: 'title',
  
  // Initialize constellation cutscene tracking
  hasCompletedFirstActivity: false,
  hasSeenConstellationCutscene: false,
  setHasCompletedFirstActivity: (completed: boolean) => set({ hasCompletedFirstActivity: completed }),
  setHasSeenConstellationCutscene: (seen: boolean) => set({ hasSeenConstellationCutscene: seen }),
  
  // Game state management
  startGame: () => {
    console.log('[GameStore] Starting game (going to character creator)');
    set({ gamePhase: 'character_creator' });
  },
  
  goToCharacterCreator: () => {
    console.log('[GameStore] Going to character creator');
    set({ gamePhase: 'character_creator' });
  },
  
  startFromCharacterCreator: () => {
    console.log('[GameStore] Starting game from character creator');
    set({ isPlaying: true, gamePhase: 'playing' });
  },
  
  returnToTitle: () => {
    console.log('[GameStore] Returning to title');
    set({ isPlaying: false, gamePhase: 'title' });
  },
}));

if (typeof window !== 'undefined') {
  (window as any).getGameStore = () => useGameStore.getState();
}
