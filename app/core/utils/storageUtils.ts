'use client';

// Storage keys
const STORAGE_KEYS = {
  JOURNAL: 'rogue-resident-journal',
  KNOWLEDGE: 'rogue-resident-knowledge',
  GAME_STATE: 'rogue-resident-game-state',
  GAME_STATE_V2: 'rogue-resident-game-v2',
  INIT_FAILED: 'init-failed',
};

/**
 * Safely gets an item from localStorage with error handling
 */
export const getStorageItem = (key: string): string | null => {
  try {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(key);
  } catch (e) {
    console.warn(`[Storage] Error getting item ${key}:`, e);
    return null;
  }
};

/**
 * Safely sets an item in localStorage with error handling
 */
export const setStorageItem = (key: string, value: string): boolean => {
  try {
    if (typeof window === 'undefined') return false;
    localStorage.setItem(key, value);
    return true;
  } catch (e) {
    console.warn(`[Storage] Error setting item ${key}:`, e);
    return false;
  }
};

/**
 * Safely removes an item from localStorage with error handling
 */
export const removeStorageItem = (key: string): boolean => {
  try {
    if (typeof window === 'undefined') return false;
    localStorage.removeItem(key);
    return true;
  } catch (e) {
    console.warn(`[Storage] Error removing item ${key}:`, e);
    return false;
  }
};

/**
 * Clears all game data from localStorage
 */
export const clearGameData = (): boolean => {
  try {
    if (typeof window === 'undefined') return false;
    
    removeStorageItem(STORAGE_KEYS.JOURNAL);
    removeStorageItem(STORAGE_KEYS.KNOWLEDGE);
    removeStorageItem(STORAGE_KEYS.GAME_STATE);
    removeStorageItem(STORAGE_KEYS.GAME_STATE_V2);
    
    return true;
  } catch (e) {
    console.error('[Storage] Error clearing game data:', e);
    return false;
  }
};

/**
 * Marks initialization as failed
 */
export const markInitFailed = (): void => {
  setStorageItem(STORAGE_KEYS.INIT_FAILED, 'true');
};

/**
 * Clears the initialization failed flag
 */
export const clearInitFailed = (): void => {
  removeStorageItem(STORAGE_KEYS.INIT_FAILED);
};

/**
 * Checks if initialization has failed previously
 */
export const hasInitFailed = (): boolean => {
  return getStorageItem(STORAGE_KEYS.INIT_FAILED) === 'true';
};

/**
 * Performs an emergency reset - clears all game data and init failed flags
 */
export const performEmergencyReset = (): void => {
  clearGameData();
  clearInitFailed();
};

/**
 * Gets the storage state for debugging
 */
export const getStorageState = () => {
  return {
    game: !!getStorageItem(STORAGE_KEYS.GAME_STATE_V2),
    journal: !!getStorageItem(STORAGE_KEYS.JOURNAL),
    knowledge: !!getStorageItem(STORAGE_KEYS.KNOWLEDGE)
  };
};

export { STORAGE_KEYS }; 