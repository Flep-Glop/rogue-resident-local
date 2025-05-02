import { create } from 'zustand';
import { KnowledgeStar, KnowledgeConnection, KnowledgeDomain, GameEventType } from '@/app/types';
import { centralEventBus } from '@/app/core/events/CentralEventBus';
import { produce } from 'immer';
import { useJournalStore } from './journalStore';
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

// Template entries for generating concept journal entries
const conceptJournalTemplates: Record<KnowledgeDomain, string[]> = {
  [KnowledgeDomain.TREATMENT_PLANNING]: [
    "Today I learned about $CONCEPT. The key insight was understanding how treatment plans need to be tailored to specific patient needs, while still following standardized protocols.",
    "I observed a treatment planning session for $CONCEPT. It's fascinating how much precision goes into every aspect of the plan, with multiple layers of verification."
  ],
  [KnowledgeDomain.RADIATION_THERAPY]: [
    "Participated in a session on $CONCEPT today. The procedures require extreme attention to detail, with safety protocols being a top priority throughout the process.",
    "Made notes on $CONCEPT during today's observation. The technology behind radiation therapy is incredibly sophisticated, yet the human element remains crucial."
  ],
  [KnowledgeDomain.LINAC_ANATOMY]: [
    "Studied the components of $CONCEPT today. The engineering that goes into linear accelerators is remarkable - each piece serves a specific function to ensure accurate treatment delivery.",
    "Today's maintenance session on $CONCEPT revealed how these complex machines require regular calibration. The tolerances are measured in millimeters."
  ],
  [KnowledgeDomain.DOSIMETRY]: [
    "Calculated doses for $CONCEPT today. The balance between delivering sufficient radiation to the target while minimizing exposure to healthy tissue is a constant challenge.",
    "Reviewed quality assurance protocols for $CONCEPT. Dosimetry requires both advanced mathematics and practical problem-solving skills."
  ]
};

// Create the knowledge store
export const useKnowledgeStore = create<KnowledgeState>((set, get) => ({
  // Initialize state
  stars: {},
  connections: {},
  discoveredToday: [],
  totalMastery: 0,
  
  // Discover a concept (triggered during Day Phase)
  discoverConcept: (conceptId: string, source = 'unknown') => {
    // Create a local variable to store star info safely before updating state
    let starName = '';
    let starDomain: KnowledgeDomain | null = null;
    
    set(produce(state => {
      // If star exists and is not already discovered
      if (state.stars[conceptId] && !state.stars[conceptId].discovered) {
        const star = state.stars[conceptId];
        
        // Save star data for use outside of the state update
        starName = star.name;
        starDomain = star.domain;
        
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
    
    // Only proceed with journal entry if we have valid star info
    if (starName && starDomain) {
      // Generate a journal entry for this discovery - after state update
      setTimeout(() => { 
        try {
          const journalStore = useJournalStore.getState();
          
          if (journalStore) {
            // Select a random template for this domain
            const templates = starDomain ? conceptJournalTemplates[starDomain] || [] : [];
            if (templates.length > 0) {
              const randomIndex = Math.floor(Math.random() * templates.length);
              const template = templates[randomIndex];
              
              // Create content with the concept name substituted
              const content = template.replace('$CONCEPT', starName);
              
              // Add the journal entry
              journalStore.addConceptEntry(
                conceptId,
                `Discovered: ${starName}`,
                content,
                starDomain || KnowledgeDomain.TREATMENT_PLANNING // Provide a default domain if null
              );
            }
          }
        } catch (error) {
          console.error('Failed to create journal entry:', error);
        }
      }, 0);
    }
  },
  
  // Unlock a star (spend SP to permanently unlock in Night Phase)
  unlockStar: (starId: string) => {
    const star = get().stars[starId];
    if (!star || star.unlocked) return false;
    
    // Extract star properties we'll need later
    const starName = star.name;
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
      // Use a type assertion for the array elements
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
    
    // Add journal entry for unlocking the star
    setTimeout(() => {
      try {
        const journalStore = useJournalStore.getState();
        
        if (journalStore) {
          journalStore.addConceptEntry(
            starId,
            `Unlocked: ${starName}`,
            `I've officially added ${starName} to my knowledge constellation. This concept is now part of my growing expertise. I should continue to develop my understanding to increase my mastery.`,
            starDomain || KnowledgeDomain.TREATMENT_PLANNING // Provide a default domain if null
          );
        }
      } catch (error) {
        console.error('Failed to create journal entry for unlocking:', error);
      }
    }, 0);
    
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
    
    // Store star data locally
    const starName = star.name;
    const starDomain = star.domain;
    const currentMastery = star.mastery;
    let newMastery = 0;
    
    set(produce(state => {
      const star = state.stars[starId];
      if (!star || !star.unlocked) return;
      
      newMastery = Math.min(100, currentMastery + amount);
      
      if (newMastery > currentMastery) {
        state.stars[starId].mastery = newMastery;
        
        // Recalculate total mastery
        let totalMastery = 0;
        let unlockedCount = 0;
        
        // Use a type assertion for the array elements
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
    
    // If mastery increases significantly (25% increment), add a journal entry
    if (Math.floor(currentMastery / 25) < Math.floor(newMastery / 25)) {
      setTimeout(() => {
        try {
          const journalStore = useJournalStore.getState();
          
          if (journalStore) {
            const masteryLevel = Math.floor(newMastery / 25) * 25;
            journalStore.addConceptEntry(
              starId,
              `Mastery Improved: ${starName}`,
              `I've reached ${masteryLevel}% mastery in ${starName}. My understanding is deepening and I'm becoming more confident in applying this knowledge in clinical settings.`,
              starDomain || KnowledgeDomain.TREATMENT_PLANNING // Provide a default domain if null
            );
          }
        } catch (error) {
          console.error('Failed to create journal entry for mastery:', error);
        }
      }, 0);
    }
  },
  
  // Form a connection between two stars
  formConnection: (sourceId: string, targetId: string) => {
    // Make local copies of star data
    let sourceStarName = '';
    let sourceStarDomain: KnowledgeDomain | null = null;
    let targetStarName = '';
    
    // Check if stars exist first
    const currentState = get();
    const sourceStar = currentState.stars[sourceId];
    const targetStar = currentState.stars[targetId];
    
    if (sourceStar && targetStar) {
      sourceStarName = sourceStar.name;
      sourceStarDomain = sourceStar.domain;
      targetStarName = targetStar.name;
    }
    
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
    
    // Add journal entry for the connection only if we have valid star data
    if (sourceStarName && targetStarName && sourceStarDomain) {
      setTimeout(() => {
        try {
          const journalStore = useJournalStore.getState();
          
          if (journalStore) {
            journalStore.addConceptEntry(
              sourceId,
              `Connected: ${sourceStarName} & ${targetStarName}`,
              `I've made a connection between ${sourceStarName} and ${targetStarName}. These concepts are related and understanding this relationship strengthens my overall comprehension of ${sourceStarDomain.replace('_', ' ')}.`,
              sourceStarDomain
            );
          }
        } catch (error) {
          console.error('Failed to create journal entry for connection:', error);
        }
      }, 0);
    }
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