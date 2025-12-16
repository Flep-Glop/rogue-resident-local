import { create } from 'zustand';
import { GamePhase, Difficulty, GameEventType } from '@/app/types';
import { centralEventBus } from '@/app/core/events/CentralEventBus';
import { useKnowledgeStore } from '@/app/store/knowledgeStore';
import { useResourceStore } from '@/app/store/resourceStore';


// State interface for the game store
interface GameState {
  // Core game state
  currentPhase: GamePhase;
  daysPassed: number;
  playerName: string;
  
  // Phase tracking
  hasVisitedNightPhase: boolean;
  setHasVisitedNightPhase: (visited: boolean) => void;
  
  // Constellation cutscene tracking
  hasCompletedFirstActivity: boolean;
  hasSeenConstellationCutscene: boolean;
  setHasCompletedFirstActivity: (completed: boolean) => void;
  setHasSeenConstellationCutscene: (seen: boolean) => void;
  
  // Actions
  setPhase: (phase: GamePhase) => void;
  incrementDay: () => void;
  resetDay: () => void;
  
  // Resource management (proxies to resourceStore)
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
  // Initialize core game state
  currentPhase: GamePhase.TITLE,
  daysPassed: 0,
  playerName: '',
  
  // Initialize phase tracking
  hasVisitedNightPhase: false,
  setHasVisitedNightPhase: (visited: boolean) => set({ hasVisitedNightPhase: visited }),
  
  // Initialize constellation cutscene tracking
  hasCompletedFirstActivity: false,
  hasSeenConstellationCutscene: false,
  setHasCompletedFirstActivity: (completed: boolean) => set({ hasCompletedFirstActivity: completed }),
  setHasSeenConstellationCutscene: (seen: boolean) => set({ hasSeenConstellationCutscene: seen }),
  
  // Phase management
  setPhase: (phase: GamePhase) => {
    const currentPhase = get().currentPhase;
    console.log(`[GameStore] Phase change: ${currentPhase} → ${phase}`);
    
    set({ currentPhase: phase });
    if (phase === GamePhase.NIGHT) {
      centralEventBus.dispatch(GameEventType.NIGHT_PHASE_STARTED, { day: get().daysPassed }, 'gameStore.setPhase');
    }
  },
  
  incrementDay: () => {
    set((state) => ({ daysPassed: state.daysPassed + 1 }));
  },
  
  resetDay: () => {
    const knowledgeStore = useKnowledgeStore.getState();
    const insightBonus = knowledgeStore.getInsightBonus();

    get().convertInsightToSP();

    const resourceStore = useResourceStore.getState();
    resourceStore.resetMomentum('gameStore.resetDay');
    resourceStore.updateInsight(0 - resourceStore.insight, 'gameStore.resetDay.clear');
    if (insightBonus > 0) {
      resourceStore.updateInsight(insightBonus, 'active stars bonus');
    }

    set({ currentPhase: GamePhase.NIGHT });
    set((state) => ({ daysPassed: state.daysPassed + 1 }));
    centralEventBus.dispatch(GameEventType.NIGHT_PHASE_STARTED, { day: get().daysPassed }, 'gameStore.resetDay');
  },
  
  // Resource management - Proxies to resourceStore
  addMomentum: (amount: number) => {
    const resourceStore = useResourceStore.getState();
    for (let i = 0; i < amount; i++) {
      resourceStore.incrementMomentum('gameStore.addMomentum');
    }
  },
  resetMomentum: () => {
    const resourceStore = useResourceStore.getState();
    resourceStore.resetMomentum('gameStore.resetMomentum');
  },
  addInsight: (amount: number, source?: string) => {
    const resourceStore = useResourceStore.getState();
    resourceStore.updateInsight(amount, source || 'gameStore.addInsight');
  },
  spendInsight: (amount: number) => {
    const resourceStore = useResourceStore.getState();
    if (resourceStore.insight >= amount) {
      resourceStore.updateInsight(-amount, 'gameStore.spendInsight');
      return true;
    }
    return false;
  },
  convertInsightToSP: () => {
    const resourceStore = useResourceStore.getState();
    const insightToConvert = resourceStore.insight;
    const spGain = Math.floor(insightToConvert / 5);
    if (spGain > 0) {
      resourceStore.updateInsight(-insightToConvert, 'gameStore.convertInsightToSP');
      resourceStore.updateStarPoints(spGain, 'gameStore.convertInsightToSP');
    }
  },
  addStarPoints: (amount: number) => {
    const resourceStore = useResourceStore.getState();
    resourceStore.updateStarPoints(amount, 'gameStore.addStarPoints');
  },
  spendStarPoints: (amount: number) => {
    const resourceStore = useResourceStore.getState();
    if (resourceStore.starPoints >= amount) {
      resourceStore.updateStarPoints(-amount, 'gameStore.spendStarPoints');
      centralEventBus.dispatch(GameEventType.STAR_POINTS_SPENT, { amount }, 'gameStore.spendStarPoints');
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

if (typeof window !== 'undefined') {
  (window as any).getGameStore = () => useGameStore.getState();
}
