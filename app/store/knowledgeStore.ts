import { create } from 'zustand';
import { KnowledgeStar, KnowledgeConnection, KnowledgeDomain, GameEventType } from '@/app/types';
import { centralEventBus } from '@/app/core/events/CentralEventBus';
import { produce } from 'immer';
import { useGameStore } from './gameStore';

// Interface for the knowledge store
interface KnowledgeState {
  // Stars/concepts in the constellation
  stars: Record<string, KnowledgeStar>;
  // Connections between stars
  connections: Record<string, KnowledgeConnection>;
  // Stars discovered during the current day (cleared at day end)
  discoveredToday: string[];
  // Total mastery percentage across all domains
  totalMastery: number;
  
  // Actions
  discoverConcept: (conceptId: string, source?: string) => void;
  unlockStar: (starId: string) => boolean;
  toggleStarActive: (starId: string, active?: boolean) => void;
  increaseMastery: (starId: string, amount: number) => void;
  formConnection: (sourceId: string, targetId: string) => void;
  clearDailyDiscoveries: () => void;
  getMasteryByDomain: (domain: KnowledgeDomain) => number;
  getActiveStars: () => KnowledgeStar[];
  getUnlockedStars: () => KnowledgeStar[];
  getDiscoveredNotUnlocked: () => KnowledgeStar[];
  getTimeReductionForDomain: (domain: KnowledgeDomain) => number;
  hasPattern: (pattern: string) => boolean;
  hasConnection: (star1Id: string, star2Id: string) => boolean;
  getDomainCompletion: (domain: KnowledgeDomain) => number;
  getInsightBonus: () => number;
}

// Create the knowledge store
export const useKnowledgeStore = create<KnowledgeState>((set, get) => ({
  // Initialize state
  stars: {},
  connections: {},
  discoveredToday: [],
  totalMastery: 0,
  
  // Discover a concept (triggered during Day Phase)
  discoverConcept: (conceptId: string, source = 'unknown') => {
    set(produce(state => {
      // If star exists and is not already discovered
      if (state.stars[conceptId] && !state.stars[conceptId].discovered) {
        // Mark as discovered
        state.stars[conceptId].discovered = true;
        
        // Add to discovered today list if not already there
        if (!state.discoveredToday.includes(conceptId)) {
          state.discoveredToday.push(conceptId);
        }
        
        // Dispatch event for other systems
        centralEventBus.dispatch(
          GameEventType.CONCEPT_DISCOVERED,
          { conceptId, source },
          'knowledgeStore.discoverConcept'
        );
      }
    }));
  },
  
  // Unlock a star (spend SP to permanently unlock in Night Phase)
  unlockStar: (starId: string) => {
    const star = get().stars[starId];
    if (!star || star.unlocked) return false;
    
    const starDomain = star.domain;
    const spCost = star.spCost;
    
    // Check if player has enough star points using the imported store
    const gameStore = useGameStore.getState();
    if (!gameStore) return false;
    
    if (!gameStore.spendStarPoints(spCost)) return false;
    
    // Unlock the star
    set(produce(state => {
      state.stars[starId].unlocked = true;
      
      // Auto-form connections to already unlocked stars
      const otherStars = Object.values(state.stars) as KnowledgeStar[];
      otherStars.forEach(otherStar => {
        if (otherStar.id !== starId && otherStar.unlocked) {
          // Check if these should be connected (based on same domain or other rules)
          if (otherStar.domain === starDomain) {
            get().formConnection(starId, otherStar.id);
          }
        }
      });
      
      // Dispatch event
      centralEventBus.dispatch(
        GameEventType.STAR_UNLOCKED,
        { starId, cost: spCost },
        'knowledgeStore.unlockStar'
      );
    }));
    
    return true;
  },
  
  // Toggle a star's active state
  toggleStarActive: (starId: string, active?: boolean) => {
    set(produce(state => {
      const star = state.stars[starId];
      if (!star || !star.unlocked) return;
      
      // If active is provided, use it; otherwise toggle current state
      const newActive = active !== undefined ? active : !star.active;
      state.stars[starId].active = newActive;
      
      // Dispatch appropriate event
      centralEventBus.dispatch(
        newActive ? GameEventType.STAR_ACTIVATED : GameEventType.STAR_DEACTIVATED,
        { starId },
        'knowledgeStore.toggleStarActive'
      );
    }));
  },
  
  // Increase mastery for a star
  increaseMastery: (starId: string, amount: number) => {
    const star = get().stars[starId];
    if (!star || !star.unlocked) return;
    
    const currentMastery = star.mastery;
    
    set(produce(state => {
      const star = state.stars[starId];
      if (!star || !star.unlocked) return;
      
      const newMastery = Math.min(100, currentMastery + amount);
      
      if (newMastery > currentMastery) {
        state.stars[starId].mastery = newMastery;
        
        // Recalculate total mastery
        let totalMastery = 0;
        let unlockedCount = 0;
        
        const allStars = Object.values(state.stars) as KnowledgeStar[];
        allStars.forEach(s => {
          if (s.unlocked) {
            totalMastery += s.mastery;
            unlockedCount++;
          }
        });
        
        state.totalMastery = unlockedCount > 0 ? totalMastery / unlockedCount : 0;
        
        // Dispatch event
        centralEventBus.dispatch(
          GameEventType.MASTERY_INCREASED,
          { 
            starId, 
            previousMastery: currentMastery,
            newMastery,
            increase: newMastery - currentMastery
          },
          'knowledgeStore.increaseMastery'
        );
      }
    }));
  },
  
  // Form a connection between two stars
  formConnection: (sourceId: string, targetId: string) => {
    set(produce(state => {
      // Ensure both stars exist and are unlocked
      const sourceStar = state.stars[sourceId];
      const targetStar = state.stars[targetId];
      
      if (!sourceStar || !targetStar || !sourceStar.unlocked || !targetStar.unlocked) {
        return;
      }
      
      // Generate connection ID (always use alphabetical order for consistency)
      const [first, second] = [sourceId, targetId].sort();
      const connectionId = `${first}-${second}`;
      
      // Check if connection already exists
      if (state.connections[connectionId]) {
        return;
      }
      
      // Create new connection
      state.connections[connectionId] = {
        id: connectionId,
        sourceStarId: first,
        targetStarId: second,
        strength: 10, // Initial strength
        discovered: true
      };
      
      // Update star connections arrays
      if (!sourceStar.connections.includes(targetId)) {
        state.stars[sourceId].connections.push(targetId);
      }
      
      if (!targetStar.connections.includes(sourceId)) {
        state.stars[targetId].connections.push(sourceId);
      }
      
      // Dispatch event
      centralEventBus.dispatch(
        GameEventType.CONNECTION_FORMED,
        { 
          connectionId,
          sourceId,
          targetId
        },
        'knowledgeStore.formConnection'
      );
    }));
  },
  
  // Clear discoveries from today (called at end of day)
  clearDailyDiscoveries: () => {
    set({ discoveredToday: [] });
  },
  
  // Get mastery level by domain
  getMasteryByDomain: (domain: KnowledgeDomain) => {
    const stars = get().stars;
    let domainStars = Object.values(stars).filter(
      star => star.unlocked && star.domain === domain
    );
    
    if (domainStars.length === 0) {
      return 0;
    }
    
    const totalMastery = domainStars.reduce(
      (sum, star) => sum + star.mastery, 0
    );
    
    return totalMastery / domainStars.length;
  },
  
  // Calculate time reduction for activities based on domain mastery
  getTimeReductionForDomain: (domain: KnowledgeDomain): number => {
    const domainMastery = get().getMasteryByDomain(domain);
    
    // No time reduction below 50% mastery
    if (domainMastery < 50) return 0;
    
    // 15 minute reduction at 75% mastery for this domain
    if (domainMastery >= 75) return 15;
    
    // 5 minute reduction at 50% mastery
    return 5;
  },
  
  // Check if specific stars form a pattern
  hasPattern: (pattern: string): boolean => {
    const { stars, connections } = get();
    
    // Triangle pattern requires 3 stars that are all connected to each other
    if (pattern === 'triangle') {
      // Get all active stars
      const activeStars = Object.values(stars).filter(star => star.active);
      
      // Need at least 3 stars for a triangle
      if (activeStars.length < 3) return false;
      
      // Check for triangle pattern
      for (let i = 0; i < activeStars.length - 2; i++) {
        for (let j = i + 1; j < activeStars.length - 1; j++) {
          for (let k = j + 1; k < activeStars.length; k++) {
            // Check if all three stars are connected to each other
            const star1 = activeStars[i];
            const star2 = activeStars[j];
            const star3 = activeStars[k];
            
            const conn1_2 = hasConnectionBetween(star1.id, star2.id);
            const conn1_3 = hasConnectionBetween(star1.id, star3.id);
            const conn2_3 = hasConnectionBetween(star2.id, star3.id);
            
            if (conn1_2 && conn1_3 && conn2_3) {
              // Found a triangle
              return true;
            }
          }
        }
      }
      return false;
    }
    
    return false;
  },
  
  // Check if there's a connection between two stars
  hasConnection: (star1Id: string, star2Id: string): boolean => {
    const { connections } = get();
    
    // Check both directions
    const connectionKey1 = `${star1Id}-${star2Id}`;
    const connectionKey2 = `${star2Id}-${star1Id}`;
    
    return connections[connectionKey1] !== undefined || 
           connections[connectionKey2] !== undefined;
  },
  
  // Calculate domain completion percentage
  getDomainCompletion: (domain: KnowledgeDomain): number => {
    const stars = get().stars;
    
    // Filter stars by domain
    const domainStars = Object.values(stars).filter(
      star => star.domain === domain
    );
    
    if (domainStars.length === 0) return 0;
    
    // Count unlocked stars
    const unlockedCount = domainStars.filter(star => star.unlocked).length;
    
    return (unlockedCount / domainStars.length) * 100;
  },
  
  // Calculate insight bonus based on active stars
  getInsightBonus: (): number => {
    // Each active star provides +1 Insight at day start
    const activeStars = get().getActiveStars();
    return activeStars.length;
  },
  
  // Get all currently active stars
  getActiveStars: () => {
    return Object.values(get().stars).filter(star => star.unlocked && star.active);
  },
  
  // Get all unlocked stars
  getUnlockedStars: () => {
    return Object.values(get().stars).filter(star => star.unlocked);
  },
  
  // Get stars that are discovered but not yet unlocked
  getDiscoveredNotUnlocked: () => {
    return Object.values(get().stars).filter(
      star => star.discovered && !star.unlocked
    );
  }
}));

// Add a helper function for connection checking
const hasConnectionBetween = (star1Id: string, star2Id: string): boolean => {
  const state = useKnowledgeStore.getState();
  const connections = state.connections;
  
  // Check both directions
  const connectionKey1 = `${star1Id}-${star2Id}`;
  const connectionKey2 = `${star2Id}-${star1Id}`;
  
  return connections[connectionKey1] !== undefined || 
         connections[connectionKey2] !== undefined;
}; 