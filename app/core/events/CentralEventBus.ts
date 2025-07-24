'use client';

/**
 * Central Event Bus for Rogue Resident
 * 
 * Provides a robust event dispatching and subscription system
 * that allows decoupled components to communicate.
 */

import { GameEventType } from '@/app/types';

// Define a generic type for event payload
export type EventPayload = Record<string, unknown>;

// Generic event payload interface
export interface GameEvent<T = EventPayload> {
  type: GameEventType;
  payload?: T;
  source?: string;
  timestamp: number;
}

// Subscriber function type
type EventSubscriber<T = EventPayload> = (event: GameEvent<T>) => void;

class CentralEventBus {
  private subscribers: Map<GameEventType, Set<EventSubscriber>> = new Map();
  private eventHistory: GameEvent[] = [];
  private maxHistorySize: number = 100;
  private debug: boolean = process.env.NODE_ENV === 'development';

  /**
   * Dispatch an event to all subscribers
   */
  public dispatch<T extends EventPayload>(type: GameEventType, payload?: T, source?: string): void {
    const event: GameEvent<T> = {
      type,
      payload,
      source,
      timestamp: Date.now(),
    };

    // Log event in development (filter out excessive mentor content updates)
    if (this.debug && type !== 'MENTOR_CONTENT_UPDATED') {
      console.log(`[EVENT] ${type} from ${source || 'unknown'}`, payload);
    }

    // Add to history
    this.addToHistory(event);

    // Notify subscribers
    const eventSubscribers = this.subscribers.get(type);
    if (eventSubscribers) {
      eventSubscribers.forEach(subscriber => {
        try {
          subscriber(event);
        } catch (error) {
          console.error(`Error in event subscriber for ${type}:`, error);
        }
      });
    }
  }

  /**
   * Safe dispatch with additional error handling
   */
  public safeDispatch<T extends EventPayload>(type: GameEventType, payload?: T, source?: string): void {
    try {
      this.dispatch(type, payload, source);
    } catch (error) {
      console.error(`Failed to dispatch event ${type}:`, error);
    }
  }

  /**
   * Subscribe to an event type
   */
  public subscribe<T extends EventPayload>(type: GameEventType, subscriber: EventSubscriber<T>): () => void {
    if (!this.subscribers.has(type)) {
      this.subscribers.set(type, new Set());
    }

    const subscribers = this.subscribers.get(type)!;
    subscribers.add(subscriber as EventSubscriber);

    // Return unsubscribe function
    return () => {
      subscribers.delete(subscriber as EventSubscriber);
      if (subscribers.size === 0) {
        this.subscribers.delete(type);
      }
    };
  }

  /**
   * Unsubscribe from an event type
   */
  public unsubscribe<T extends EventPayload>(type: GameEventType, subscriber: EventSubscriber<T>): void {
    const subscribers = this.subscribers.get(type);
    if (subscribers) {
      subscribers.delete(subscriber as EventSubscriber);
      if (subscribers.size === 0) {
        this.subscribers.delete(type);
      }
    }
  }

  /**
   * Subscribe to multiple event types at once
   */
  public subscribeToMany(
    types: GameEventType[],
    subscriber: EventSubscriber
  ): () => void {
    const unsubscribers = types.map(type => this.subscribe(type, subscriber));
    
    // Return combined unsubscribe function
    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }

  /**
   * Get recent events of a specific type
   */
  public getRecentEvents<T extends EventPayload>(type: GameEventType, limit: number = 10): GameEvent<T>[] {
    return this.eventHistory
      .filter(event => event.type === type)
      .slice(-limit) as GameEvent<T>[];
  }

  /**
   * Add event to history with size limit
   */
  private addToHistory(event: GameEvent): void {
    this.eventHistory.push(event);
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift();
    }
  }

  /**
   * Clear event history
   */
  public clearHistory(): void {
    this.eventHistory = [];
  }
}

// Export singleton instance
export const centralEventBus = new CentralEventBus();

// React hook for subscribing to events with automatic cleanup
import { useEffect } from 'react';

export function useEventSubscription<T extends EventPayload = EventPayload>(
  type: GameEventType | GameEventType[],
  handler: EventSubscriber<T>,
  deps: React.DependencyList = []
): void {
  useEffect(() => {
    let unsubscribe: () => void;

    if (Array.isArray(type)) {
      unsubscribe = centralEventBus.subscribeToMany(type, handler as EventSubscriber);
    } else {
      unsubscribe = centralEventBus.subscribe<T>(type, handler);
    }

    return unsubscribe;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
} 