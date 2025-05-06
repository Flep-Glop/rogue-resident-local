'use client';

import { openDatabase, getObjectStore } from './indexedDB';

// Save data structure
export interface SaveData {
  id: number;
  name: string;
  timestamp: number;
  version: string;
  gameState: any;
  screenshot?: string; // Optional base64 thumbnail of game state
  metadata?: {
    dayNumber: number;
    seasonName: string;
    timeOfDay: string;
    location: string;
  };
}

// Save game to a specific slot
export async function saveGame(slotId: number, gameState: any, name?: string): Promise<boolean> {
  try {
    const store = await getObjectStore('gameSaves', 'readwrite');
    
    // Create save data
    const saveData: SaveData = {
      id: slotId,
      name: name || `Save ${slotId}`,
      timestamp: Date.now(),
      version: '0.1.0', // Track for compatibility
      gameState,
      metadata: {
        dayNumber: gameState.currentDay || 1,
        seasonName: gameState.currentSeason || 'spring',
        timeOfDay: gameState.time?.formattedTime || '8:00',
        location: gameState.currentLocation || 'Hospital'
      }
    };
    
    // Store in IndexedDB
    return new Promise((resolve, reject) => {
      const request = store.put(saveData);
      request.onsuccess = () => resolve(true);
      request.onerror = () => {
        console.error('Error saving game:', request.error);
        reject(false);
      };
    });
  } catch (e) {
    console.error('Failed to save game:', e);
    return false;
  }
}

// Load game from a specific slot
export async function loadGame(slotId: number): Promise<any> {
  try {
    const store = await getObjectStore('gameSaves', 'readonly');
    
    return new Promise((resolve, reject) => {
      const request = store.get(slotId);
      request.onsuccess = () => {
        if (request.result) {
          resolve(request.result.gameState);
        } else {
          resolve(null); // No save found
        }
      };
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    console.error('Failed to load game:', e);
    return null;
  }
}

// Get all save slots
export async function getAllSaveSlots(): Promise<SaveData[]> {
  try {
    const store = await getObjectStore('gameSaves', 'readonly');
    
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    console.error('Failed to get save slots:', e);
    return [];
  }
}

// Delete a save slot
export async function deleteSaveSlot(slotId: number): Promise<boolean> {
  try {
    const store = await getObjectStore('gameSaves', 'readwrite');
    
    return new Promise((resolve, reject) => {
      const request = store.delete(slotId);
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(false);
    });
  } catch (e) {
    console.error('Failed to delete save slot:', e);
    return false;
  }
} 