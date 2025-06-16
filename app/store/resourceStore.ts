import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { centralEventBus } from '@/app/core/events/CentralEventBus';
import { GameEventType } from '@/app/types';

// Helper function for safe event dispatch
function safeDispatch(eventType: GameEventType, payload?: any, source?: string) {
  try {
    // Directly call dispatch with the proper arguments pattern
    centralEventBus.dispatch(
      eventType,
      payload ? { ...payload, source: source || 'resourceStore' } : { source: source || 'resourceStore' },
      source || 'resourceStore'
    );
  } catch (error) {
    console.error(`Error dispatching ${eventType} event:`, error);
  }
}

// Define ResourceState interface
interface ResourceState {
  // Resources
  insight: number;
  insightMax: number;
  momentum: number;
  momentumMax: number;
  starPoints: number;
  
  // Actions
  updateInsight: (baseAmount: number, source?: string) => void;
  incrementMomentum: (source?: string) => void;
  resetMomentum: (source?: string) => void;
  getInsightMultiplier: () => number;
  updateStarPoints: (amount: number, source?: string) => void;
  canBoast: () => boolean;
  activateBoast: (source?: string) => boolean;
  
  // Internal helpers
  _getMomentumLevel: () => 1 | 2 | 3;
}

// Create the resource store
export const useResourceStore = create<ResourceState>()(
  immer((set, get) => ({
    // State
    insight: 0,
    insightMax: 100,
    momentum: 0,
    momentumMax: 3, // Three levels max
    starPoints: 0,
    
    // Actions
    incrementMomentum: (source?: string) => set(state => {
      const currentValue = state.momentum;
      
      // Already at max, do nothing
      if (currentValue >= state.momentumMax) return;
      
      const newValue = currentValue + 1;
      
      // Log for debugging
      console.log(`[ResourceStore] Incrementing momentum from ${currentValue} to ${newValue}`);
      
      // Dispatch momentum changed event
      safeDispatch(GameEventType.MOMENTUM_GAINED, {
        previousValue: currentValue,
        newValue,
        change: 1,
        source: source || 'incrementMomentum'
      }, 'resourceStore.incrementMomentum');
      
      // Check if we've reached a new level (for level-specific events)
      if (Math.floor(currentValue / 1) < Math.floor(newValue / 1)) {
        const newLevel = Math.floor(newValue / 1);
        safeDispatch(GameEventType.MOMENTUM_LEVEL_REACHED, {
          level: newLevel,
          source: source || 'incrementMomentum'
        }, 'resourceStore.incrementMomentum');
        
        // Log level-specific bonuses for player awareness
        if (newLevel === 2) {
          console.log('[ResourceStore] Reached Momentum Level 2: Answers now worth +25% Insight');
        } else if (newLevel === 3) {
          console.log('[ResourceStore] Reached Momentum Level 3: Boast unlocked and answers worth +50% Insight');
        }
      }
      
      state.momentum = newValue;
    }),
    
    resetMomentum: (source?: string) => set(state => {
      const currentValue = state.momentum;
      const currentLevel = get()._getMomentumLevel();
      
      // Already at zero, do nothing
      if (currentValue === 0) return;
      
      // Log for debugging with info about lost bonuses
      if (currentLevel > 1) {
        console.log(`[ResourceStore] Resetting momentum from ${currentValue} to 0 (Lost Level ${currentLevel} bonuses)`);
        
        // Dispatch an additional event for UI feedback on lost bonuses
        safeDispatch(GameEventType.MOMENTUM_BONUS_LOST, {
          previousLevel: currentLevel,
          bonusLost: currentLevel === 3 ? "Boast and +50% Insight" : "+25% Insight",
          source: source || 'resetMomentum'
        }, 'resourceStore.resetMomentum');
      } else {
        console.log(`[ResourceStore] Resetting momentum from ${currentValue} to 0`);
      }
      
      // Dispatch momentum reset event
      safeDispatch(GameEventType.MOMENTUM_RESET, {
        previousValue: currentValue,
        newValue: 0,
        change: -currentValue,
        source: source || 'resetMomentum'
      }, 'resourceStore.resetMomentum');
      
      state.momentum = 0;
    }),
    
    // Helper for getting current momentum level
    _getMomentumLevel: () => {
      const momentum = get().momentum;
      if (momentum >= 3) return 3;
      if (momentum >= 2) return 2;
      return 1;
    },
    
    // Method to get the insight multiplier based on momentum level
    getInsightMultiplier: () => {
      const momentumLevel = get()._getMomentumLevel();
      
      // Level 3: +50% (1.5x multiplier)
      if (momentumLevel === 3) return 1.5;
      
      // Level 2: +25% (1.25x multiplier)
      if (momentumLevel === 2) return 1.25;
      
      // Level 1: base multiplier (no bonus)
      return 1.0;
    },
    
    // Update insight with momentum multiplier
    updateInsight: (baseAmount: number, source?: string) => set(state => {
      // Apply momentum multiplier
      const multiplier = get().getInsightMultiplier();
      const amount = Math.round(baseAmount * multiplier);
      
      const currentValue = state.insight;
      const newValue = Math.max(0, Math.min(state.insightMax, currentValue + amount));
      const actualChange = newValue - currentValue;
      
      // No change, do nothing
      if (actualChange === 0) return;
      
      // Format the bonus text for logging
      const bonusText = multiplier > 1 
        ? ` (base: ${baseAmount}, momentum bonus: +${Math.round((multiplier-1)*100)}%)` 
        : '';
      
      // Log for debugging
      console.log(`[ResourceStore] Updating insight by ${actualChange}${bonusText}`);
      
      // Dispatch insight gained event
      safeDispatch(GameEventType.INSIGHT_GAINED, {
        resourceType: 'insight',
        previousValue: currentValue,
        newValue,
        baseAmount,
        multiplier,
        actualAmount: amount,
        bonusApplied: multiplier > 1,
        bonusAmount: amount - baseAmount,
        source: source || 'updateInsight'
      }, 'resourceStore.updateInsight');
      
      state.insight = newValue;
    }),
    
    // Update star points
    updateStarPoints: (amount: number, source?: string) => set(state => {
      const currentValue = state.starPoints;
      const newValue = Math.max(0, currentValue + amount);
      const actualChange = newValue - currentValue;
      
      // No change, do nothing
      if (actualChange === 0) return;
      
      // Determine the event type based on gain or loss
      const eventType = actualChange > 0 ? GameEventType.STAR_POINTS_GAINED : GameEventType.STAR_POINTS_SPENT;
      
      // Dispatch the appropriate event
      safeDispatch(eventType, {
        previousValue: currentValue,
        newValue,
        change: actualChange,
        source: source || 'updateStarPoints'
      }, 'resourceStore.updateStarPoints');
      
      state.starPoints = newValue;
    }),
    
    // Check if boast can be activated
    canBoast: () => {
      return get().momentum >= 3 && get().insight >= 50; // Level 3 momentum and at least 50 Insight
    },
    
    // Activate boast
    activateBoast: (source?: string) => {
      const canBoast = get().canBoast();
      
      // Cannot boast, return false
      if (!canBoast) return false;
      
      // Deduct Insight cost
      set(state => {
        state.insight -= 50; // Boast costs 50 Insight
      });
      
      // Log for debugging
      console.log('[ResourceStore] Boast activated, 50 Insight deducted');
      
      // Dispatch boast activation event
      safeDispatch(GameEventType.BOAST_ACTIVATED, {
        source: source || 'activateBoast'
      }, 'resourceStore.activateBoast');
      
      return true;
    }
  }))
);

// Initialize store with default values (can be called during app initialization)
export function initializeResourceStore(initialValues?: Partial<Omit<ResourceState, Function>>) {
  useResourceStore.setState({
    insight: initialValues?.insight ?? 30, // Start with some insight for testing
    momentum: initialValues?.momentum ?? 0,
    starPoints: initialValues?.starPoints ?? 0,
  });
} 