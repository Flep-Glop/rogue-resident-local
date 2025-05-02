import { create } from 'zustand';
import { GamePhase, Resources, Season, TimeBlock, Difficulty, MentorId, GameEventType, SEASON_REQUIREMENTS, KnowledgeDomain } from '@/app/types';
import { TimeManager } from '@/app/core/time/TimeManager';
import { centralEventBus } from '@/app/core/events/CentralEventBus';
import { useKnowledgeStore } from '@/app/store/knowledgeStore';
import { useActivityStore } from '@/app/store/activityStore';

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
    relationships: {
      [MentorId.GARCIA]: { level: 0, interactions: 0 },
      [MentorId.KAPOOR]: { level: 0, interactions: 0 },
      [MentorId.JESSE]: { level: 0, interactions: 0 },
      [MentorId.QUINN]: { level: 0, interactions: 0 },
    }
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
    
    // Get the knowledge store to check for active stars and constellation effects
    const knowledgeStore = useKnowledgeStore.getState();
    
    // Calculate insight bonus from active stars
    const insightBonus = knowledgeStore.getInsightBonus();
    
    // Convert any remaining insight to SP before resetting
    get().convertInsightToSP();
    
    set({ 
      currentTime: newTime,
      currentPhase: GamePhase.DAY,
      resources: {
        ...get().resources,
        momentum: 0,
        insight: insightBonus, // Start with bonus from active stars
      }
    });
    
    // If insight bonus was applied, dispatch an event
    if (insightBonus > 0) {
      centralEventBus.dispatch(
        GameEventType.INSIGHT_GAINED,
        { 
          previous: 0,
          current: insightBonus,
          change: insightBonus,
          source: 'active stars bonus'
        },
        'gameStore.resetDay'
      );
    }
    
    // Increment day counter
    set((state) => ({ daysPassed: state.daysPassed + 1 }));
    
    centralEventBus.dispatch(
      GameEventType.DAY_PHASE_STARTED,
      { day: get().daysPassed + 1 },
      'gameStore.resetDay'
    );
    
    // Check for special events based on constellation patterns
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
  
  // Relationship management
  improveRelationship: (mentorId: MentorId, amount: number = 1) => {
    set(state => {
      // Clone current relationships
      const relationships = { ...state.resources.relationships };
      
      if (!relationships[mentorId]) {
        relationships[mentorId] = { level: 0, interactions: 0 };
      }
      
      // Increment interactions count
      relationships[mentorId].interactions += amount;
      
      // Every 3 interactions, increase level (up to max 5)
      const interactionsNeeded = 3;
      if (relationships[mentorId].interactions >= 
          (relationships[mentorId].level + 1) * interactionsNeeded &&
          relationships[mentorId].level < 5) {
        relationships[mentorId].level += 1;
        
        // Dispatch relationship level up event
        centralEventBus.dispatch(
          GameEventType.RELATIONSHIP_LEVEL_UP,
          { 
            mentorId, 
            newLevel: relationships[mentorId].level 
          },
          'gameStore.improveRelationship'
        );
      }
      
      // Dispatch relationship improved event
      centralEventBus.dispatch(
        GameEventType.RELATIONSHIP_IMPROVED,
        { 
          mentorId, 
          amount,
          level: relationships[mentorId].level,
          interactions: relationships[mentorId].interactions
        },
        'gameStore.improveRelationship'
      );
      
      return {
        resources: {
          ...state.resources,
          relationships
        }
      };
    });
  },
  
  getRelationshipLevel: (mentorId: MentorId) => {
    const { resources } = get();
    return resources.relationships?.[mentorId]?.level || 0;
  },
  
  // Check if a specific Progressive Control mechanic is unlocked
  isControlMechanicUnlocked: (mechanic: string): boolean => {
    const state = get();
    const relationships = state.resources.relationships || {};
    
    switch (mechanic) {
      case 'FOCUSED_QUESTION':
        // Level 3 with all mentors required
        return Object.values(relationships).every(r => r.level >= 3);
        
      case 'SCHEDULE_PEEK':
        // Level 4 with any two mentors required
        return Object.values(relationships).filter(r => r.level >= 4).length >= 2;
        
      case 'APPOINTMENT_SETTING':
        // Level 5 with any mentor required
        return Object.values(relationships).some(r => r.level >= 5);
        
      default:
        return false;
    }
  },
  
  // Check if the player meets requirements to advance to the next season
  checkSeasonProgression: () => {
    const state = get();
    const { currentSeason, difficulty } = state;
    const knowledgeStore = useKnowledgeStore.getState();
    
    // Get the requirements for the current season and difficulty
    const requirements = SEASON_REQUIREMENTS[difficulty][currentSeason];
    
    // Get all unlocked stars and calculate average mastery
    const unlockedStars = knowledgeStore.getUnlockedStars();
    const starCount = unlockedStars.length;
    const totalMastery = knowledgeStore.totalMastery;
    
    // Check star count requirement
    if (starCount < requirements.starCount) return false;
    
    // Check average mastery requirement
    if (totalMastery < requirements.averageMastery) return false;
    
    // Check domain requirement if needed
    if (requirements.domainsRequired) {
      const domains = [
        KnowledgeDomain.TREATMENT_PLANNING,
        KnowledgeDomain.RADIATION_THERAPY,
        KnowledgeDomain.LINAC_ANATOMY,
        KnowledgeDomain.DOSIMETRY
      ];
      
      // Ensure at least 2 stars from each domain
      const hasEnoughDomainsRepresented = domains.every(domain => {
        const starsInDomain = unlockedStars.filter(star => star.domain === domain);
        return starsInDomain.length >= 2;
      });
      
      if (!hasEnoughDomainsRepresented) return false;
    }
    
    // Check pattern requirement if needed
    if (requirements.patternRequired) {
      if (!knowledgeStore.hasPattern(requirements.patternRequired)) {
        return false;
      }
    }
    
    // All requirements met
    return true;
  },
  
  // Advance to the next season
  advanceToNextSeason: () => {
    const state = get();
    const { currentSeason } = state;
    let nextSeason: Season;
    
    switch (currentSeason) {
      case Season.SPRING:
        nextSeason = Season.SUMMER;
        break;
      case Season.SUMMER:
        nextSeason = Season.FALL;
        break;
      case Season.FALL:
        nextSeason = Season.WINTER;
        break;
      case Season.WINTER:
        // Winter is the last season, no advancement
        return false;
    }
    
    set({ currentSeason: nextSeason });
    
    centralEventBus.dispatch(
      GameEventType.SEASON_CHANGED,
      { 
        previousSeason: currentSeason, 
        newSeason: nextSeason 
      },
      'gameStore.advanceToNextSeason'
    );
    
    return true;
  },
}));

// Make the game store accessible globally
// This function will be available for other parts of the app
// to access the game store
if (typeof window !== 'undefined') {
  (window as any).getGameStore = () => useGameStore.getState();
} 