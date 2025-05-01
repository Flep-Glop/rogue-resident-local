import { create } from 'zustand';
import { GamePhase, Resources, Season, TimeBlock, Difficulty } from '@/app/types';
import { TimeManager } from '@/app/core/time/TimeManager';
import { centralEventBus } from '@/app/core/events/CentralEventBus';
import { GameEventType } from '@/app/types';

// State interface for the game store
interface GameState {
  // Core game state
  currentPhase: GamePhase;
  currentSeason: Season;
  daysPassed: number;
  playerName: string;
  
  // Time management
  timeManager: TimeManager;
  currentTime: TimeBlock;
  
  // Resources
  resources: Resources;
  
  // Actions
  setPhase: (phase: GamePhase) => void;
  setSeason: (season: Season) => void;
  incrementDay: () => void;
  advanceTime: (minutes: number) => void;
  resetDay: () => void;
  
  // Resource management
  addMomentum: (amount: number) => void;
  resetMomentum: () => void;
  addInsight: (amount: number, source?: string) => void;
  spendInsight: (amount: number) => boolean;
  convertInsightToSP: () => void;
  addStarPoints: (amount: number) => void;
  spendStarPoints: (amount: number) => boolean;
  
  // Difficulty management
  difficulty: Difficulty;
  setDifficulty: (difficulty: Difficulty) => void;
  
  // Player data
  setPlayerName: (name: string) => void;
}

// Create the game store
export const useGameStore = create<GameState>((set, get) => ({
  // Initialize core game state - start with Title screen instead of Day phase
  currentPhase: GamePhase.TITLE,
  currentSeason: Season.SPRING,
  daysPassed: 0,
  playerName: '',
  
  // Initialize time management
  timeManager: new TimeManager(),
  currentTime: { hour: 8, minute: 0 }, // Start at 8:00 AM
  
  // Initialize resources
  resources: {
    momentum: 0, // 0-3 scale
    insight: 0, // 0-100 points
    starPoints: 0,
  },
  
  // Phase management
  setPhase: (phase: GamePhase) => {
    set({ currentPhase: phase });
    
    // Dispatch phase transition event
    if (phase === GamePhase.DAY) {
      centralEventBus.dispatch(
        GameEventType.DAY_PHASE_STARTED,
        { day: get().daysPassed + 1 },
        'gameStore.setPhase'
      );
    } else if (phase === GamePhase.NIGHT) {
      centralEventBus.dispatch(
        GameEventType.NIGHT_PHASE_STARTED,
        { day: get().daysPassed },
        'gameStore.setPhase'
      );
    }
  },
  
  // Season management
  setSeason: (season: Season) => set({ currentSeason: season }),
  
  // Day management
  incrementDay: () => {
    set((state) => ({ daysPassed: state.daysPassed + 1 }));
    
    centralEventBus.dispatch(
      GameEventType.DAY_PHASE_STARTED,
      { day: get().daysPassed + 1 },
      'gameStore.incrementDay'
    );
  },
  
  // Time management
  advanceTime: (minutes: number) => {
    const { timeManager } = get();
    const newTime = timeManager.advanceTime(minutes);
    set({ currentTime: newTime });
    
    // Dispatch time advanced event
    centralEventBus.dispatch(
      GameEventType.TIME_ADVANCED,
      { 
        hour: newTime.hour, 
        minute: newTime.minute,
        minutes: minutes 
      },
      'gameStore.advanceTime'
    );
    
    // Check if day has ended
    if (timeManager.isDayEnded()) {
      set({ currentPhase: GamePhase.NIGHT });
      
      centralEventBus.dispatch(
        GameEventType.END_OF_DAY_REACHED,
        { day: get().daysPassed },
        'gameStore.advanceTime'
      );
      
      centralEventBus.dispatch(
        GameEventType.NIGHT_PHASE_STARTED,
        { day: get().daysPassed },
        'gameStore.advanceTime'
      );
    }
  },
  
  resetDay: () => {
    const { timeManager } = get();
    const newTime = timeManager.resetToStartOfDay();
    
    // Convert any remaining insight to SP before resetting
    get().convertInsightToSP();
    
    set({ 
      currentTime: newTime,
      currentPhase: GamePhase.DAY,
      resources: {
        ...get().resources,
        momentum: 0,
        insight: 0,
      }
    });
    
    // Increment day counter
    set((state) => ({ daysPassed: state.daysPassed + 1 }));
    
    centralEventBus.dispatch(
      GameEventType.DAY_PHASE_STARTED,
      { day: get().daysPassed + 1 },
      'gameStore.resetDay'
    );
  },
  
  // Resource management
  addMomentum: (amount: number) => {
    set((state) => {
      // Calculate new momentum, capped at 3
      const currentMomentum = state.resources.momentum;
      const newMomentum = Math.min(3, Math.max(0, currentMomentum + amount));
      
      // Only dispatch event if there's a change
      if (newMomentum !== currentMomentum) {
        centralEventBus.dispatch(
          GameEventType.MOMENTUM_GAINED,
          { 
            previous: currentMomentum,
            current: newMomentum,
            change: newMomentum - currentMomentum
          },
          'gameStore.addMomentum'
        );
      }
      
      return {
        resources: {
          ...state.resources,
          momentum: newMomentum,
        }
      };
    });
  },
  
  resetMomentum: () => {
    set((state) => {
      const currentMomentum = state.resources.momentum;
      
      if (currentMomentum > 0) {
        centralEventBus.dispatch(
          GameEventType.MOMENTUM_RESET,
          { previous: currentMomentum },
          'gameStore.resetMomentum'
        );
      }
      
      return {
        resources: {
          ...state.resources,
          momentum: 0,
        }
      };
    });
  },
  
  addInsight: (amount: number, source?: string) => {
    set((state) => {
      const currentInsight = state.resources.insight;
      const newInsight = Math.max(0, currentInsight + amount);
      
      // Only dispatch event if there's a change
      if (newInsight !== currentInsight) {
        centralEventBus.dispatch(
          GameEventType.INSIGHT_GAINED,
          { 
            previous: currentInsight,
            current: newInsight,
            change: newInsight - currentInsight,
            source: source || 'unknown'
          },
          'gameStore.addInsight'
        );
      }
      
      return {
        resources: {
          ...state.resources,
          insight: newInsight,
        }
      };
    });
  },
  
  spendInsight: (amount: number) => {
    const { resources } = get();
    if (resources.insight >= amount) {
      set((state) => {
        centralEventBus.dispatch(
          GameEventType.INSIGHT_SPENT,
          { amount },
          'gameStore.spendInsight'
        );
        
        return {
          resources: {
            ...state.resources,
            insight: state.resources.insight - amount,
          }
        };
      });
      return true;
    }
    return false;
  },
  
  convertInsightToSP: () => {
    const { resources } = get();
    const insightToConvert = resources.insight;
    const spGain = Math.floor(insightToConvert / 5); // 5:1 conversion ratio
    
    if (spGain > 0) {
      set((state) => {
        centralEventBus.dispatch(
          GameEventType.INSIGHT_CONVERTED,
          { 
            insightAmount: insightToConvert,
            spGained: spGain
          },
          'gameStore.convertInsightToSP'
        );
        
        return {
          resources: {
            ...state.resources,
            insight: 0, // Reset insight
            starPoints: state.resources.starPoints + spGain,
          }
        };
      });
    }
  },
  
  addStarPoints: (amount: number) => {
    set((state) => {
      const currentSP = state.resources.starPoints;
      const newSP = currentSP + amount;
      
      centralEventBus.dispatch(
        GameEventType.SP_GAINED,
        { 
          previous: currentSP,
          current: newSP,
          change: amount
        },
        'gameStore.addStarPoints'
      );
      
      return {
        resources: {
          ...state.resources,
          starPoints: newSP,
        }
      };
    });
  },
  
  spendStarPoints: (amount: number) => {
    const { resources } = get();
    if (resources.starPoints >= amount) {
      set((state) => {
        centralEventBus.dispatch(
          GameEventType.SP_SPENT,
          { amount },
          'gameStore.spendStarPoints'
        );
        
        return {
          resources: {
            ...state.resources,
            starPoints: state.resources.starPoints - amount,
          }
        };
      });
      return true;
    }
    return false;
  },
  
  // Difficulty management
  difficulty: Difficulty.STANDARD,
  setDifficulty: (difficulty: Difficulty) => set({ difficulty }),
  
  // Player data
  setPlayerName: (name: string) => set({ playerName: name }),
}));

// Make the game store accessible globally
// This function will be available for other parts of the app
// to access the game store
if (typeof window !== 'undefined') {
  (window as any).getGameStore = () => useGameStore.getState();
} 