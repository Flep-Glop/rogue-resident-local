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
  starPoints: number;

  // Actions
  updateStarPoints: (amount: number, source?: string) => void;
}

// Create the resource store
export const useResourceStore = create<ResourceState>()(
  immer((set, get) => ({
    // State
    starPoints: 0,

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
    })
  }))
);

// Initialize store with default values (can be called during app initialization)
export function initializeResourceStore(initialValues?: Partial<Omit<ResourceState, Function>>) {
  useResourceStore.setState({
    starPoints: initialValues?.starPoints ?? 0,
  });
} 