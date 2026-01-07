import { create } from 'zustand';

// State interface for the game store
interface GameState {
  // Core game state - simplified to boolean
  isPlaying: boolean;
  
  // Constellation cutscene tracking
  hasCompletedFirstActivity: boolean;
  hasSeenConstellationCutscene: boolean;
  setHasCompletedFirstActivity: (completed: boolean) => void;
  setHasSeenConstellationCutscene: (seen: boolean) => void;
  
  // Actions
  startGame: () => void;
  returnToTitle: () => void;
}

// Create the game store
export const useGameStore = create<GameState>((set, get) => ({
  // Initialize core game state
  isPlaying: false,
  
  // Initialize constellation cutscene tracking
  hasCompletedFirstActivity: false,
  hasSeenConstellationCutscene: false,
  setHasCompletedFirstActivity: (completed: boolean) => set({ hasCompletedFirstActivity: completed }),
  setHasSeenConstellationCutscene: (seen: boolean) => set({ hasSeenConstellationCutscene: seen }),
  
  // Game state management
  startGame: () => {
    console.log('[GameStore] Starting game');
    set({ isPlaying: true });
  },
  
  returnToTitle: () => {
    console.log('[GameStore] Returning to title');
    set({ isPlaying: false });
  },
}));

if (typeof window !== 'undefined') {
  (window as any).getGameStore = () => useGameStore.getState();
}
