import { create } from 'zustand';
import { GamePhase, Season, TimeBlock, Difficulty, MentorId, GameEventType, SEASON_REQUIREMENTS, KnowledgeDomain, LocationId, Resources } from '@/app/types';
import { TimeManager } from '@/app/core/time/TimeManager';
import { centralEventBus } from '@/app/core/events/CentralEventBus';
import { useKnowledgeStore } from '@/app/store/knowledgeStore';
import { useActivityStore } from '@/app/store/activityStore';
import { useResourceStore } from '@/app/store/resourceStore';


// State interface for the game store
interface GameState {
  // Core game state
  currentPhase: GamePhase;
  currentSeason: Season;
  daysPassed: number;
  playerName: string;
  seenLocations: Set<LocationId>;
  
  // Day 1 state
  day1CurrentScene: string;
  day1CompletedScenes: Set<string>;
  setDay1Scene: (sceneId: string) => void;
  
  // Time management
  timeManager: TimeManager;
  currentTime: TimeBlock;
  
  // Relationships are still part of GameState, nested under a 'resources' like structure for now
  // or we can flatten it if preferred. For minimal changes to relationship logic:
  relationships: Resources['relationships']; 
  
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
  setSeason: (season: Season) => void;
  incrementDay: () => void;
  advanceTime: (minutes: number) => void;
  resetDay: () => void;
  
  // Resource management (These are now primarily proxies to resourceStore)
  addMomentum: (amount: number) => void; // Proxies to resourceStore
  resetMomentum: () => void; // Proxies to resourceStore
  addInsight: (amount: number, source?: string) => void; // Proxies to resourceStore
  spendInsight: (amount: number) => boolean; // Proxies to resourceStore
  convertInsightToSP: () => void; // Proxies to resourceStore
  addStarPoints: (amount: number) => void; // Proxies to resourceStore
  spendStarPoints: (amount: number) => boolean; // Proxies to resourceStore
  
  // Location tracking
  markLocationAsSeen: (locationId: LocationId) => void;
  
  // Difficulty management
  difficulty: Difficulty;
  setDifficulty: (difficulty: Difficulty) => void;
  
  // Player data
  setPlayerName: (name: string) => void;
  
  // Relationship management
  improveRelationship: (mentorId: MentorId, amount: number) => void;
  getRelationshipLevel: (mentorId: MentorId) => number;
  isControlMechanicUnlocked: (mechanic: string) => boolean;
  
  // Check if the player meets requirements to advance to the next season
  checkSeasonProgression: () => boolean;
  
  // Advance to the next season
  advanceToNextSeason: () => boolean;
}

// Create the game store
export const useGameStore = create<GameState>((set, get) => ({
  // Initialize core game state
  currentPhase: GamePhase.TITLE,
  currentSeason: Season.SPRING,
  daysPassed: 0,
  playerName: '',
  
  // Initialize Day 1 state
  day1CurrentScene: 'ARRIVAL',
  day1CompletedScenes: new Set<string>(),
  setDay1Scene: (sceneId: string) => {
    console.log(`[GameStore] Setting Day 1 scene to: ${sceneId}`);
    set({ day1CurrentScene: sceneId });
  },
  
  // Initialize time management
  timeManager: new TimeManager(),
  currentTime: { hour: 8, minute: 0 }, 
  
  // Initialize phase tracking
  hasVisitedNightPhase: false,
  setHasVisitedNightPhase: (visited: boolean) => set({ hasVisitedNightPhase: visited }),
  
  // Initialize constellation cutscene tracking
  hasCompletedFirstActivity: false,
  hasSeenConstellationCutscene: false,
  setHasCompletedFirstActivity: (completed: boolean) => set({ hasCompletedFirstActivity: completed }),
  setHasSeenConstellationCutscene: (seen: boolean) => set({ hasSeenConstellationCutscene: seen }),
  
  // Initialize relationships (insight, momentum, starPoints are now in resourceStore)
  relationships: {
    [MentorId.GARCIA]: { level: 0, interactions: 0 },
    [MentorId.KAPOOR]: { level: 0, interactions: 0 },
    [MentorId.JESSE]: { level: 0, interactions: 0 },
    [MentorId.QUINN]: { level: 0, interactions: 0 },
  },
  
  // Initialize seen locations
  seenLocations: new Set<LocationId>(),
  
  // Phase management
  setPhase: (phase: GamePhase) => {
    const currentPhase = get().currentPhase;
    console.log(`[GameStore] Phase change: ${currentPhase} → ${phase}`);
    
    set({ currentPhase: phase });
    if (phase === GamePhase.NIGHT) {
      centralEventBus.dispatch(GameEventType.NIGHT_PHASE_STARTED, { day: get().daysPassed }, 'gameStore.setPhase');
    }
  },
  setSeason: (season: Season) => set({ currentSeason: season }),
  incrementDay: () => {
    set((state) => ({ daysPassed: state.daysPassed + 1 }));
  },
  advanceTime: (minutes: number) => {
    const { timeManager } = get();
    const newTime = timeManager.advanceTime(minutes);
    set({ currentTime: newTime });
    centralEventBus.dispatch(GameEventType.TIME_ADVANCED, { hour: newTime.hour, minute: newTime.minute, minutes: minutes }, 'gameStore.advanceTime');
  },
  
  resetDay: () => {
    const { timeManager } = get();
    const newTime = timeManager.resetToStartOfDay();
    const knowledgeStore = useKnowledgeStore.getState();
    const insightBonus = knowledgeStore.getInsightBonus();

    get().convertInsightToSP();

    const resourceStore = useResourceStore.getState();
    resourceStore.resetMomentum('gameStore.resetDay');
    resourceStore.updateInsight(0 - resourceStore.insight, 'gameStore.resetDay.clear');
    if (insightBonus > 0) {
      resourceStore.updateInsight(insightBonus, 'active stars bonus');
    }

    set({
      currentTime: newTime,
      currentPhase: GamePhase.NIGHT
    });

    set((state) => ({ daysPassed: state.daysPassed + 1 }));
    centralEventBus.dispatch(GameEventType.NIGHT_PHASE_STARTED, { day: get().daysPassed }, 'gameStore.resetDay');

    setTimeout(() => {
      try {
        const activityStore = useActivityStore.getState();
        if (activityStore) {
          activityStore.checkSpecialEventRequirements();
        }
      } catch (error) {
        console.error('Failed to check special event requirements:', error);
      }
    }, 0);
  },
  
  // Resource management - Now purely proxies to resourceStore
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
      centralEventBus.dispatch(GameEventType.INSIGHT_SPENT, { amount }, 'gameStore.spendInsight'); // Kept for compatibility
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
      centralEventBus.dispatch(GameEventType.INSIGHT_CONVERTED, { insightAmount: insightToConvert, spGained: spGain }, 'gameStore.convertInsightToSP'); // Kept for compatibility
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
      centralEventBus.dispatch(GameEventType.SP_SPENT, { amount }, 'gameStore.spendStarPoints'); // Kept for compatibility
      return true;
    }
    return false;
  },
  
  // Location tracking
  markLocationAsSeen: (locationId: LocationId) => {
    set((state) => {
      if (!state.seenLocations.has(locationId)) {
        const newSeenLocations = new Set(state.seenLocations);
        newSeenLocations.add(locationId);
        return { seenLocations: newSeenLocations };
      }
      return {}; 
    });
  },
  
  // Difficulty management
  difficulty: Difficulty.STANDARD,
  setDifficulty: (difficulty: Difficulty) => set({ difficulty }),
  
  // Player data
  setPlayerName: (name: string) => set({ playerName: name }),
  
  // Relationship management
  improveRelationship: (mentorId: MentorId, amount: number = 1) => {
    set(state => {
      const newRelationships = { ...state.relationships };
      if (!newRelationships[mentorId]) {
        newRelationships[mentorId] = { level: 0, interactions: 0 };
      }
      newRelationships[mentorId].interactions += amount;
      const interactionsNeeded = 3;
      if (newRelationships[mentorId].interactions >= (newRelationships[mentorId].level + 1) * interactionsNeeded && newRelationships[mentorId].level < 5) {
        newRelationships[mentorId].level += 1;
        centralEventBus.dispatch(GameEventType.RELATIONSHIP_LEVEL_UP, { mentorId, newLevel: newRelationships[mentorId].level }, 'gameStore.improveRelationship');
      }
      centralEventBus.dispatch(GameEventType.RELATIONSHIP_IMPROVED, { mentorId, amount, level: newRelationships[mentorId].level, interactions: newRelationships[mentorId].interactions }, 'gameStore.improveRelationship');
      return { relationships: newRelationships };
    });
  },
  getRelationshipLevel: (mentorId: MentorId) => {
    const { relationships } = get();
    return relationships?.[mentorId]?.level || 0;
  },
  isControlMechanicUnlocked: (mechanic: string): boolean => {
    const state = get();
    const relationships = state.relationships || {}; // Uses local relationships
    switch (mechanic) {
      case 'FOCUSED_QUESTION': return Object.values(relationships).every(r => r.level >= 3);
      case 'SCHEDULE_PEEK': return Object.values(relationships).filter(r => r.level >= 4).length >= 2;
      case 'APPOINTMENT_SETTING': return Object.values(relationships).some(r => r.level >= 5);
      default: return false;
    }
  },
  
  // Season progression
  checkSeasonProgression: () => {
    const state = get();
    const { currentSeason, difficulty } = state;
    const knowledgeStore = useKnowledgeStore.getState();
    const requirements = SEASON_REQUIREMENTS[difficulty][currentSeason];
    const unlockedStars = knowledgeStore.getUnlockedStars();
    const starCount = unlockedStars.length;
    const totalMastery = knowledgeStore.totalMastery;
    if (starCount < requirements.starCount) return false;
    if (totalMastery < requirements.averageMastery) return false;
    if (requirements.domainsRequired) {
      const domains = [KnowledgeDomain.TREATMENT_PLANNING, KnowledgeDomain.RADIATION_THERAPY, KnowledgeDomain.LINAC_ANATOMY, KnowledgeDomain.DOSIMETRY];
      const hasEnoughDomainsRepresented = domains.every(domain => unlockedStars.filter(star => star.domain === domain).length >= 2);
      if (!hasEnoughDomainsRepresented) return false;
    }
    if (requirements.patternRequired) {
      if (!knowledgeStore.hasPattern(requirements.patternRequired)) return false;
    }
    return true;
  },
  advanceToNextSeason: () => {
    const state = get();
    const { currentSeason } = state;
    let nextSeason: Season;
    switch (currentSeason) {
      case Season.SPRING: nextSeason = Season.SUMMER; break;
      case Season.SUMMER: nextSeason = Season.FALL; break;
      case Season.FALL: nextSeason = Season.WINTER; break;
      case Season.WINTER: return false;
      default: return false; // Should not happen
    }
    set({ currentSeason: nextSeason });
    centralEventBus.dispatch(GameEventType.SEASON_CHANGED, { previousSeason: currentSeason, newSeason: nextSeason }, 'gameStore.advanceToNextSeason');
    return true;
  },
}));

if (typeof window !== 'undefined') {
  (window as any).getGameStore = () => useGameStore.getState();
} 