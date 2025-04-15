'use client';

/**
 * Safely gets state from a store with error handling and default value fallback
 * @param store The Zustand store to access
 * @param selector Selector function to extract specific state
 * @param defaultValue Default value to return if store access fails
 */
export const safeGetState = <T, R>(
  store: { getState?: () => T } | null | undefined,
  selector: (state: T) => R,
  defaultValue: R
): R => {
  try {
    if (!store || typeof store.getState !== 'function') return defaultValue;
    const state = store.getState();
    if (!state) return defaultValue;
    return selector(state) ?? defaultValue;
  } catch (e) {
    console.warn('[Store] Error accessing store state:', e);
    return defaultValue;
  }
};

/**
 * Safely calls a store action with error handling
 * @param store The Zustand store to access
 * @param actionSelector Function to select the action from the store state
 * @param args Arguments to pass to the action
 * @returns The result of the action or undefined if it fails
 */
export const safeStoreAction = <T, A extends (...args: any[]) => any>(
  store: { getState?: () => T } | null | undefined,
  actionSelector: (state: T) => A,
  ...args: Parameters<A>
): ReturnType<A> | undefined => {
  try {
    if (!store || typeof store.getState !== 'function') return undefined;
    const state = store.getState();
    if (!state) return undefined;
    
    const action = actionSelector(state);
    if (typeof action !== 'function') return undefined;
    
    return action(...args);
  } catch (e) {
    console.warn('[Store] Error calling store action:', e);
    return undefined;
  }
};

/**
 * Creates an object with safe methods to access a store
 * @param store The Zustand store
 * @returns An object with safe store access methods
 */
export const createSafeStore = <T>(store: { getState?: () => T } | null | undefined) => {
  return {
    get: <R>(selector: (state: T) => R, defaultValue: R): R => 
      safeGetState(store, selector, defaultValue),
    
    action: <A extends (...args: any[]) => any>(
      actionSelector: (state: T) => A,
      ...args: Parameters<A>
    ): ReturnType<A> | undefined => 
      safeStoreAction(store, actionSelector, ...args),
    
    getState: (): T | undefined => {
      try {
        if (!store || typeof store.getState !== 'function') return undefined;
        return store.getState();
      } catch (e) {
        console.warn('[Store] Error getting full state:', e);
        return undefined;
      }
    }
  };
}; 