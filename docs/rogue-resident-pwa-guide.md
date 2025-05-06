# Rogue Resident: PWA & IndexedDB Implementation Guide

## Overview

This guide outlines a complete implementation strategy for converting Rogue Resident into a Progressive Web App (PWA) with robust offline support and save functionality using IndexedDB. This approach balances immediate development needs with future extensibility.

## 1. PWA Setup Checklist

### 1.1 Create Web App Manifest
- [ ] Create `public/manifest.json` with proper metadata:
  ```json
  {
    "name": "Rogue Resident",
    "short_name": "Rogue Resident",
    "description": "An educational roguelike for medical physics training",
    "start_url": "/",
    "display": "standalone",
    "background_color": "#121212",
    "theme_color": "#3b82f6",
    "icons": [
      {
        "src": "/icons/icon-192.png",
        "sizes": "192x192",
        "type": "image/png"
      },
      {
        "src": "/icons/icon-512.png",
        "sizes": "512x512",
        "type": "image/png"
      }
    ]
  }
  ```

### 1.2 Link Manifest in HTML
- [ ] Add manifest link to `pages/_document.tsx` (or equivalent):
  ```jsx
  <link rel="manifest" href="/manifest.json" />
  <meta name="theme-color" content="#3b82f6" />
  ```

### 1.3 Create Service Worker
- [ ] Create `public/service-worker.js`:
  ```javascript
  const CACHE_NAME = 'rogue-resident-v1';
  const urlsToCache = [
    '/',
    '/index.html',
    '/static/js/main.chunk.js',
    // Add your CSS, JS, asset files
    '/assets/icons/momentum.png',
    '/assets/icons/insight.png',
    // Add more asset paths
  ];

  // Install event - cache core assets
  self.addEventListener('install', (event) => {
    event.waitUntil(
      caches.open(CACHE_NAME)
        .then((cache) => cache.addAll(urlsToCache))
    );
  });

  // Activate event - clean up old caches
  self.addEventListener('activate', (event) => {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              return caches.delete(cacheName);
            }
          })
        );
      })
    );
  });

  // Fetch event - serve from cache or network
  self.addEventListener('fetch', (event) => {
    event.respondWith(
      caches.match(event.request)
        .then((response) => {
          // Return cached response if found
          if (response) {
            return response;
          }
          
          // Clone the request - can only be used once
          const fetchRequest = event.request.clone();
          
          return fetch(fetchRequest).then((response) => {
            // Check if valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // Clone the response - can only be used once
            const responseToCache = response.clone();
            
            // Cache new resources
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });
            
            return response;
          });
        })
    );
  });

  // Background sync for save data
  self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-game-saves') {
      event.waitUntil(
        // This function will be defined in your save system
        self.syncSavesToCloud && self.syncSavesToCloud()
      );
    }
  });
  ```

### 1.4 Register Service Worker
- [ ] Add registration code to your app entry point:
  ```javascript
  // In _app.tsx or index.js
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/service-worker.js')
        .then(registration => {
          console.log('ServiceWorker registered with scope:', registration.scope);
        })
        .catch(error => {
          console.error('ServiceWorker registration failed:', error);
        });
    });
  }
  ```

### 1.5 Create App Shell
- [ ] Implement a minimal app shell that loads instantly from cache
- [ ] Include core UI components (loading screen, game container)
- [ ] Add offline fallback page

## 2. IndexedDB Implementation

### 2.1 Create Database Module
- [ ] Create `src/core/storage/indexedDB.ts`:
  ```typescript
  // Database constants
  const DB_NAME = 'RogueResidentDB';
  const DB_VERSION = 1;
  const SAVE_STORE = 'gameSaves';
  const SYNC_STORE = 'syncQueue';

  // Open database connection
  export function openDatabase(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      
      // Database upgrade/creation
      request.onupgradeneeded = (event) => {
        const db = request.result;
        
        // Create save slots store
        if (!db.objectStoreNames.contains(SAVE_STORE)) {
          const saveStore = db.createObjectStore(SAVE_STORE, { keyPath: 'id' });
          saveStore.createIndex('timestamp', 'timestamp', { unique: false });
          saveStore.createIndex('dayNumber', 'gameState.currentDay', { unique: false });
          saveStore.createIndex('seasonName', 'gameState.currentSeason', { unique: false });
        }
        
        // Create sync queue store for future cloud sync
        if (!db.objectStoreNames.contains(SYNC_STORE)) {
          const syncStore = db.createObjectStore(SYNC_STORE, { keyPath: 'id', autoIncrement: true });
          syncStore.createIndex('syncStatus', 'syncStatus', { unique: false });
          syncStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  // Generic database operations
  export async function getObjectStore(
    storeName: string, 
    mode: IDBTransactionMode = 'readonly'
  ): Promise<IDBObjectStore> {
    const db = await openDatabase();
    const transaction = db.transaction(storeName, mode);
    return transaction.objectStore(storeName);
  }
  ```

### 2.2 Implement Save Data Interface
- [ ] Create `src/core/storage/saveSystem.ts`:
  ```typescript
  import { openDatabase, getObjectStore } from './indexedDB';
  import { compress, decompress } from 'lz-string'; // You'll need this dependency

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

  // Export save to string
  export async function exportSaveToString(slotId: number): Promise<string> {
    try {
      const saveData = await loadGame(slotId);
      if (!saveData) return '';
      
      // Use compression to make the string shorter
      return compress(JSON.stringify(saveData));
    } catch (e) {
      console.error('Failed to export save:', e);
      return '';
    }
  }

  // Import save from string
  export async function importSaveFromString(saveString: string, slotId: number): Promise<boolean> {
    try {
      const decompressed = decompress(saveString);
      if (!decompressed) return false;
      
      const saveData = JSON.parse(decompressed);
      
      // Validate save data structure
      if (!saveData || typeof saveData !== 'object') {
        console.error('Invalid save data structure');
        return false;
      }
      
      // Save to the specified slot
      return saveGame(slotId, saveData);
    } catch (e) {
      console.error('Failed to import save:', e);
      return false;
    }
  }

  // Auto-migration for save data format changes
  export function migrateSaveData(saveData: any, fromVersion: string): any {
    // Version-specific migrations
    if (fromVersion === '0.0.1' && saveData) {
      // Example migration from v0.0.1 to v0.1.0
      if (!saveData.knowledge) {
        saveData.knowledge = {
          nodes: [],
          connections: [],
          starPoints: 0
        };
      }
      
      // Add other migrations as needed
    }
    
    return saveData;
  }
  ```

### 2.3 Create Autosave System
- [ ] Create `src/core/storage/autosave.ts`:
  ```typescript
  import { saveGame } from './saveSystem';

  // Constants
  const AUTOSAVE_SLOT_ID = 0; // Reserve slot 0 for autosaves
  const AUTOSAVE_EVENTS = [
    'END_OF_DAY_REACHED',
    'NIGHT_PHASE_COMPLETED',
    'SEASON_CHANGED'
  ];

  // Initialize autosave system
  export function initAutosaveSystem(eventBus: any) {
    // Subscribe to game events that should trigger autosave
    AUTOSAVE_EVENTS.forEach(eventType => {
      eventBus.subscribe(eventType, handleAutosaveEvent);
    });
    
    // Listen for page visibility changes (user leaving page)
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', handlePageUnload);
    }
  }

  // Handle autosave events
  async function handleAutosaveEvent(event: any) {
    // Get current game state from stores
    const gameState = collectGameState();
    
    // Create appropriate name for the autosave
    const name = generateAutosaveName(gameState, event);
    
    // Save to the autosave slot
    await saveGame(AUTOSAVE_SLOT_ID, gameState, name);
    console.log(`Autosave created: ${name}`);
  }

  // Handle page unload (emergency save)
  function handlePageUnload(event: BeforeUnloadEvent) {
    // Synchronous save attempt - limited by browser specs
    try {
      const gameState = collectGameState();
      // Use localStorage as fallback for emergency save
      localStorage.setItem('emergency-save', JSON.stringify({
        timestamp: Date.now(),
        gameState
      }));
    } catch (e) {
      console.error('Emergency save failed:', e);
    }
  }

  // Collect game state from all stores
  function collectGameState() {
    // Import your store getter functions
    const { getGameState } = require('../stores/gameStore');
    const { getKnowledgeState } = require('../stores/knowledgeStore');
    const { getTimeState } = require('../stores/timeStore');
    
    // Combine all state into a serializable object
    return {
      game: getGameState(),
      knowledge: getKnowledgeState(),
      time: getTimeState(),
      // Add other stores as needed
    };
  }

  // Generate a descriptive name for the autosave
  function generateAutosaveName(gameState: any, event: any): string {
    const day = gameState.game?.currentDay || 'Day 1';
    const season = gameState.game?.currentSeason || 'Spring';
    const time = gameState.time?.formattedTime || '8:00';
    
    return `Autosave - ${season}, ${day} (${time})`;
  }

  // Check for and recover emergency save
  export async function checkForEmergencySave(): Promise<boolean> {
    if (typeof window === 'undefined') return false;
    
    const emergencySave = localStorage.getItem('emergency-save');
    if (!emergencySave) return false;
    
    try {
      const saveData = JSON.parse(emergencySave);
      
      // Validate save data and timestamp (not too old)
      const timestamp = saveData.timestamp || 0;
      const now = Date.now();
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours
      
      if (now - timestamp > maxAge) {
        // Too old, discard
        localStorage.removeItem('emergency-save');
        return false;
      }
      
      // Ask user if they want to recover
      const confirmRecover = confirm(
        'We found an unsaved game from your last session. Would you like to recover it?'
      );
      
      if (confirmRecover) {
        // Save to a special recovery slot
        await saveGame(999, saveData.gameState, 'Recovered Game');
        localStorage.removeItem('emergency-save');
        return true;
      } else {
        localStorage.removeItem('emergency-save');
        return false;
      }
    } catch (e) {
      console.error('Failed to process emergency save:', e);
      localStorage.removeItem('emergency-save');
      return false;
    }
  }
  ```

## 3. Integration with Store System

### 3.1 Create State Management Integration
- [ ] Create `src/core/storage/storeIntegration.ts`:
  ```typescript
  import { saveGame, loadGame, migrateSaveData } from './saveSystem';
  import { useGameStore } from '../stores/gameStore';
  import { useKnowledgeStore } from '../stores/knowledgeStore';
  import { useTimeStore } from '../stores/timeStore';
  import { useResourceStore } from '../stores/resourceStore';
  import { useRelationshipStore } from '../stores/relationshipStore';

  // Save current game state
  export async function saveCurrentGameState(slotId: number, saveName?: string): Promise<boolean> {
    try {
      // Extract minimal necessary state from each store
      const gameState = useGameStore.getState();
      const knowledgeState = useKnowledgeStore.getState();
      const timeState = useTimeStore.getState();
      const resourceState = useResourceStore.getState();
      const relationshipState = useRelationshipStore.getState();
      
      // Create serializable save state
      const saveableState = {
        version: process.env.NEXT_PUBLIC_GAME_VERSION || '0.1.0',
        
        // Game state - only essential data
        game: {
          gamePhase: gameState.gamePhase,
          currentDay: gameState.currentDay,
          currentSeason: gameState.currentSeason,
          difficulty: gameState.difficulty,
        },
        
        // Knowledge state - only essential data
        knowledge: {
          // Nodes - only store non-derived properties
          nodes: knowledgeState.nodes.map(node => ({
            id: node.id,
            discovered: node.discovered,
            unlocked: node.unlocked,
            active: node.active,
            mastery: node.mastery,
            position: node.position, // Store position for visualization
          })),
          
          // Connections - only store essentials
          connections: knowledgeState.connections.map(conn => ({
            id: conn.id,
            sourceId: conn.sourceId,
            targetId: conn.targetId,
            strength: conn.strength,
          })),
          
          // Other essential knowledge state
          starPoints: knowledgeState.starPoints,
        },
        
        // Time state - only essential data
        time: {
          currentHour: timeState.currentHour,
          currentMinute: timeState.currentMinute,
          dayPhase: timeState.dayPhase,
          scheduledActivities: timeState.scheduledActivities,
          completedActivities: timeState.completedActivities,
        },
        
        // Resource state - only essential data
        resources: {
          insight: resourceState.insight,
          momentum: resourceState.momentum,
          maxInsight: resourceState.insightMax,
          maxMomentum: resourceState.momentumMax,
        },
        
        // Relationship state
        relationships: {
          mentors: relationshipState.mentorRelationships,
        },
        
        // Additional metadata for save display
        meta: {
          saveDate: new Date().toISOString(),
          playerName: gameState.playerName || 'Resident',
        }
      };
      
      // Save using IndexedDB system
      return await saveGame(slotId, saveableState, saveName);
    } catch (e) {
      console.error('Failed to save game state:', e);
      return false;
    }
  }

  // Load saved game state
  export async function loadSavedGameState(slotId: number): Promise<boolean> {
    try {
      // Load saved state
      const savedState = await loadGame(slotId);
      if (!savedState) return false;
      
      // Apply potential migrations
      const migratedState = migrateSaveData(savedState, savedState.version || '0.0.1');
      
      // Reset all stores to initial state
      useGameStore.getState().reset();
      useKnowledgeStore.getState().reset();
      useTimeStore.getState().reset();
      useResourceStore.getState().reset();
      useRelationshipStore.getState().reset();
      
      // Update each store with saved state
      
      // Game store
      const gameStore = useGameStore.getState();
      if (migratedState.game) {
        gameStore.setState({
          gamePhase: migratedState.game.gamePhase,
          currentDay: migratedState.game.currentDay,
          currentSeason: migratedState.game.currentSeason,
          difficulty: migratedState.game.difficulty,
          // Add other game properties
        });
      }
      
      // Knowledge store
      const knowledgeStore = useKnowledgeStore.getState();
      if (migratedState.knowledge) {
        knowledgeStore.setState({
          nodes: migratedState.knowledge.nodes,
          connections: migratedState.knowledge.connections,
          starPoints: migratedState.knowledge.starPoints,
          // Add other knowledge properties
        });
        
        // Rebuild derived data
        knowledgeStore.rebuildDerivedState();
      }
      
      // Time store
      const timeStore = useTimeStore.getState();
      if (migratedState.time) {
        timeStore.setState({
          currentHour: migratedState.time.currentHour,
          currentMinute: migratedState.time.currentMinute,
          dayPhase: migratedState.time.dayPhase,
          scheduledActivities: migratedState.time.scheduledActivities,
          completedActivities: migratedState.time.completedActivities,
          // Add other time properties
        });
      }
      
      // Resource store
      const resourceStore = useResourceStore.getState();
      if (migratedState.resources) {
        resourceStore.setState({
          insight: migratedState.resources.insight,
          momentum: migratedState.resources.momentum,
          insightMax: migratedState.resources.maxInsight,
          momentumMax: migratedState.resources.maxMomentum,
          // Add other resource properties
        });
      }
      
      // Relationship store
      const relationshipStore = useRelationshipStore.getState();
      if (migratedState.relationships) {
        relationshipStore.setState({
          mentorRelationships: migratedState.relationships.mentors,
          // Add other relationship properties
        });
      }
      
      // Fire event to notify system of successful load
      useGameStore.getState().notifyGameLoaded();
      
      return true;
    } catch (e) {
      console.error('Failed to load game state:', e);
      return false;
    }
  }

  // Create a new game with initial state
  export function createNewGame(playerName: string, difficultyLevel: string): boolean {
    try {
      // Reset all stores
      useGameStore.getState().reset();
      useKnowledgeStore.getState().reset();
      useTimeStore.getState().reset();
      useResourceStore.getState().reset();
      useRelationshipStore.getState().reset();
      
      // Set initial game settings
      useGameStore.getState().setPlayerName(playerName);
      useGameStore.getState().setDifficulty(difficultyLevel);
      useGameStore.getState().setCurrentDay(1);
      useGameStore.getState().setCurrentSeason('spring');
      
      // Initialize starting resources
      useResourceStore.getState().setInitialResources();
      
      // Initialize time
      useTimeStore.getState().initializeDaySchedule();
      
      // Initialize initial knowledge
      useKnowledgeStore.getState().initializeStartingKnowledge();
      
      // Start the game
      useGameStore.getState().transitionToPhase('day_selecting');
      
      return true;
    } catch (e) {
      console.error('Failed to create new game:', e);
      return false;
    }
  }
  ```

### 3.2 Add Chamber Pattern Compatibility
- [ ] Update `src/core/architecture/chamber.ts` to work with saved state:
  ```typescript
  // Add methods for handling saved state loading
  export function resetStoreDerivations() {
    // Reset all memoized selectors and derived data
    // This ensures clean state when loading saved games
    clearSelectorCache();
  }

  // Clear selector cache for a fresh start after load
  function clearSelectorCache() {
    // Implementation depends on your specific chamber implementation
    // This is a placeholder for your actual implementation
    Object.keys(SELECTOR_CACHE).forEach(key => {
      delete SELECTOR_CACHE[key];
    });
  }
  ```

## 4. UI Components for Save/Load

### 4.1 Create Save/Load Modal Component
- [ ] Create `src/components/ui/SaveLoadModal.tsx`:
  ```tsx
  import React, { useState, useEffect } from 'react';
  import { getAllSaveSlots, deleteSaveSlot } from '../../core/storage/saveSystem';
  import { saveCurrentGameState, loadSavedGameState } from '../../core/storage/storeIntegration';
  import { useGameStore } from '../../core/stores/gameStore';

  interface SaveSlot {
    id: number;
    name: string;
    timestamp: number;
    metadata?: {
      dayNumber: number;
      seasonName: string;
      timeOfDay: string;
      location: string;
    };
  }

  interface SaveLoadModalProps {
    mode: 'save' | 'load';
    onClose: () => void;
  }

  export default function SaveLoadModal({ mode, onClose }: SaveLoadModalProps) {
    const [saveSlots, setSaveSlots] = useState<SaveSlot[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [newSaveName, setNewSaveName] = useState('');
    const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
    const [importDialogOpen, setImportDialogOpen] = useState(false);
    const [importCode, setImportCode] = useState('');
    const gamePhase = useGameStore(state => state.gamePhase);
    
    // Load save slots on component mount
    useEffect(() => {
      loadSaveSlots();
    }, []);
    
    // Load save slots from IndexedDB
    const loadSaveSlots = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const slots = await getAllSaveSlots();
        // Sort by timestamp (newest first)
        slots.sort((a, b) => b.timestamp - a.timestamp);
        setSaveSlots(slots);
      } catch (e) {
        console.error('Failed to load save slots:', e);
        setError('Failed to load save slots');
      } finally {
        setIsLoading(false);
      }
    };
    
    // Handle save game action
    const handleSaveGame = async (slotId: number) => {
      try {
        setIsLoading(true);
        
        // Check if slot exists
        const existingSlot = saveSlots.find(slot => slot.id === slotId);
        
        // If slot exists and is not the selected slot, confirm overwrite
        if (existingSlot && selectedSlot !== slotId) {
          const confirmOverwrite = confirm(`Overwrite save "${existingSlot.name}"?`);
          if (!confirmOverwrite) {
            setIsLoading(false);
            return;
          }
        }
        
        // Determine save name
        const saveName = newSaveName || 
          generateSaveName(gamePhase, saveSlots.length + 1);
        
        // Save the game
        const success = await saveCurrentGameState(slotId, saveName);
        
        if (success) {
          // Refresh save slots
          await loadSaveSlots();
          // Show success message
          console.log(`Game saved successfully to slot ${slotId}`);
        } else {
          setError('Failed to save game');
        }
      } catch (e) {
        console.error('Error saving game:', e);
        setError('An error occurred while saving');
      } finally {
        setIsLoading(false);
      }
    };
    
    // Handle load game action
    const handleLoadGame = async (slotId: number) => {
      try {
        setIsLoading(true);
        
        // Load the game
        const success = await loadSavedGameState(slotId);
        
        if (success) {
          // Close modal on successful load
          onClose();
        } else {
          setError('Failed to load game');
        }
      } catch (e) {
        console.error('Error loading game:', e);
        setError('An error occurred while loading');
      } finally {
        setIsLoading(false);
      }
    };
    
    // Handle delete save action
    const handleDeleteSave = async (slotId: number) => {
      try {
        // Confirm deletion
        const confirmDelete = confirm('Are you sure you want to delete this save?');
        if (!confirmDelete) return;
        
        setIsLoading(true);
        
        // Delete the save
        const success = await deleteSaveSlot(slotId);
        
        if (success) {
          // Refresh save slots
          await loadSaveSlots();
        } else {
          setError('Failed to delete save');
        }
      } catch (e) {
        console.error('Error deleting save:', e);
        setError('An error occurred while deleting');
      } finally {
        setIsLoading(false);
      }
    };
    
    // Generate default save name
    const generateSaveName = (phase: string, slotNum: number): string => {
      const defaultName = `Save ${slotNum}`;
      const { getCurrentDay, getCurrentSeason } = useGameStore.getState();
      
      // If game is in progress, add more context
      if (phase !== 'title' && phase !== 'new_game') {
        const day = getCurrentDay();
        const season = getCurrentSeason();
        return `${season.charAt(0).toUpperCase() + season.slice(1)} - Day ${day}`;
      }
      
      return defaultName;
    };
    
    // Render
    return (
      <div className="save-load-modal">
        <div className="modal-header">
          <h2>{mode === 'save' ? 'Save Game' : 'Load Game'}</h2>
          <button onClick={onClose}>×</button>
        </div>
        
        {error && (
          <div className="error-message">
            {error}
            <button onClick={() => setError(null)}>Dismiss</button>
          </div>
        )}
        
        {isLoading ? (
          <div className="loading-indicator">Loading...</div>
        ) : (
          <div className="save-slots-container">
            {saveSlots.length === 0 && (
              <div className="empty-state">
                {mode === 'save' 
                  ? 'No saved games yet. Create your first save!' 
                  : 'No saved games found.'}
              </div>
            )}
            
            {saveSlots.map((slot) => (
              <div 
                key={slot.id}
                className={`save-slot ${selectedSlot === slot.id ? 'selected' : ''}`}
                onClick={() => setSelectedSlot(slot.id)}
              >
                <div className="save-slot-info">
                  <div className="save-slot-name">{slot.name}</div>
                  <div className="save-slot-date">
                    {new Date(slot.timestamp).toLocaleDateString()} at
                    {new Date(slot.timestamp).toLocaleTimeString()}
                  </div>
                  {slot.metadata && (
                    <div className="save-slot-details">
                      {slot.metadata.seasonName} - Day {slot.metadata.dayNumber} ({slot.metadata.timeOfDay})
                      <br />
                      Location: {slot.metadata.location}
                    </div>
                  )}
                </div>
                
                <div className="save-slot-actions">
                  {mode === 'save' ? (
                    <button 
                      className="save-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSaveGame(slot.id);
                      }}
                    >
                      Overwrite
                    </button>
                  ) : (
                    <button
                      className="load-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLoadGame(slot.id);
                      }}
                    >
                      Load
                    </button>
                  )}
                  <button
                    className="delete-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteSave(slot.id);
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
            
            {/* New Save Slot */}
            {mode === 'save' && (
              <div className="new-save-slot">
                <input
                  type="text"
                  value={newSaveName}
                  onChange={(e) => setNewSaveName(e.target.value)}
                  placeholder="Enter save name..."
                />
                <button
                  onClick={() => handleSaveGame(saveSlots.length > 0 ? Math.max(...saveSlots.map(s => s.id)) + 1 : 1)}
                >
                  Create New Save
                </button>
              </div>
            )}
          </div>
        )}
        
        <div className="modal-footer">
          <button onClick={() => setImportDialogOpen(true)}>
            Import/Export
          </button>
          <button onClick={onClose}>Cancel</button>
        </div>
        
        {/* Import/Export Dialog */}
        {importDialogOpen && (
          <div className="import-export-dialog">
            <div className="dialog-header">
              <h3>Import/Export Save</h3>
              <button onClick={() => setImportDialogOpen(false)}>×</button>
            </div>
            
            <div className="dialog-content">
              <div className="import-section">
                <h4>Import Save</h4>
                <textarea
                  value={importCode}
                  onChange={(e) => setImportCode(e.target.value)}
                  placeholder="Paste save code here..."
                />
                <button
                  onClick={() => {
                    // Import logic here
                  }}
                >
                  Import
                </button>
              </div>
              
              <div className="export-section">
                <h4>Export Save</h4>
                <select>
                  {saveSlots.map(slot => (
                    <option key={slot.id} value={slot.id}>
                      {slot.name}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => {
                    // Export logic here
                  }}
                >
                  Generate Export Code
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
  ```

### 4.2 Implement Title Screen UI
- [ ] Update `src/components/screens/TitleScreen.tsx`:
  ```tsx
  import React, { useState, useEffect } from 'react';
  import { checkForEmergencySave } from '../../core/storage/autosave';
  import SaveLoadModal from '../ui/SaveLoadModal';
  import { useGameStore } from '../../core/stores/gameStore';
  import { createNewGame } from '../../core/storage/storeIntegration';

  export default function TitleScreen() {
    const [showLoadMenu, setShowLoadMenu] = useState(false);
    const [showNewGameMenu, setShowNewGameMenu] = useState(false);
    const [playerName, setPlayerName] = useState('');
    const [difficulty, setDifficulty] = useState('standard');
    const [hasRecovery, setHasRecovery] = useState(false);
    
    // Check for emergency save on component mount
    useEffect(() => {
      const checkRecovery = async () => {
        const hasEmergencySave = await checkForEmergencySave();
        setHasRecovery(hasEmergencySave);
      };
      
      checkRecovery();
    }, []);
    
    // Handle new game creation
    const handleStartNewGame = () => {
      if (!playerName.trim()) {
        alert('Please enter a name for your character');
        return;
      }
      
      createNewGame(playerName, difficulty);
    };
    
    // Render title screen
    return (
      <div className="title-screen">
        <div className="title-logo">
          <h1>Rogue Resident</h1>
          <p>A medical physics roguelike</p>
        </div>
        
        <div className="main-menu">
          <button onClick={() => setShowNewGameMenu(true)}>
            New Game
          </button>
          
          <button onClick={() => setShowLoadMenu(true)}>
            Load Game
          </button>
          
          {hasRecovery && (
            <button className="recovery-button">
              Recover Unsaved Game
            </button>
          )}
          
          {/* Additional menu options */}
          <button>Options</button>
          <button>Credits</button>
        </div>
        
        {/* New Game Menu */}
        {showNewGameMenu && (
          <div className="new-game-menu">
            <h2>Create New Game</h2>
            
            <div className="input-group">
              <label htmlFor="playerName">Your Name:</label>
              <input
                id="playerName"
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Enter your name"
              />
            </div>
            
            <div className="input-group">
              <label>Background:</label>
              <div className="radio-group">
                <label>
                  <input
                    type="radio"
                    name="difficulty"
                    value="beginner"
                    checked={difficulty === 'beginner'}
                    onChange={() => setDifficulty('beginner')}
                  />
                  Fresh out of undergrad
                </label>
                <label>
                  <input
                    type="radio"
                    name="difficulty"
                    value="standard"
                    checked={difficulty === 'standard'}
                    onChange={() => setDifficulty('standard')}
                  />
                  Finished doctorate
                </label>
                <label>
                  <input
                    type="radio"
                    name="difficulty"
                    value="expert"
                    checked={difficulty === 'expert'}
                    onChange={() => setDifficulty('expert')}
                  />
                  Practiced in another country
                </label>
              </div>
            </div>
            
            <div className="menu-buttons">
              <button onClick={handleStartNewGame}>
                Start Game
              </button>
              <button onClick={() => setShowNewGameMenu(false)}>
                Back
              </button>
            </div>
          </div>
        )}
        
        {/* Load Game Modal */}
        {showLoadMenu && (
          <SaveLoadModal
            mode="load"
            onClose={() => setShowLoadMenu(false)}
          />
        )}
      </div>
    );
  }
  ```

### 4.3 Add Pause Menu With Save Option
- [ ] Create `src/components/ui/PauseMenu.tsx`:
  ```tsx
  import React, { useState } from 'react';
  import SaveLoadModal from './SaveLoadModal';
  import { useGameStore } from '../../core/stores/gameStore';

  export default function PauseMenu({ onClose }) {
    const [showSaveMenu, setShowSaveMenu] = useState(false);
    const returnToTitle = useGameStore(state => state.returnToTitle);
    
    // Handle return to title screen
    const handleReturnToTitle = () => {
      const confirmExit = confirm(
        'Return to title screen? Any unsaved progress will be lost.'
      );
      
      if (confirmExit) {
        returnToTitle();
      }
    };
    
    // Show save menu or close pause menu
    if (showSaveMenu) {
      return (
        <SaveLoadModal
          mode="save"
          onClose={() => setShowSaveMenu(false)}
        />
      );
    }
    
    // Render pause menu
    return (
      <div className="pause-menu">
        <div className="menu-header">
          <h2>Game Paused</h2>
          <button onClick={onClose}>×</button>
        </div>
        
        <div className="menu-options">
          <button onClick={() => setShowSaveMenu(true)}>
            Save Game
          </button>
          <button onClick={onClose}>
            Resume Game
          </button>
          <button onClick={handleReturnToTitle}>
            Exit to Title
          </button>
          
          {/* Additional menu options */}
          <button>Options</button>
          <button>Help</button>
        </div>
      </div>
    );
  }
  ```

## 5. Background Sync for Future Cloud Support

### 5.1 Create Sync Module
- [ ] Create `src/core/storage/syncSystem.ts`:
  ```typescript
  // Configuration state
  let syncEnabled = false;
  let authToken: string | null = null;

  // Configure the sync system
  export function configureSyncSystem(enabled: boolean, token?: string) {
    syncEnabled = enabled;
    authToken = token || null;
    
    // Register for background sync if enabled and supported
    if (enabled && 'serviceWorker' in navigator && 'SyncManager' in window) {
      navigator.serviceWorker.ready.then(registration => {
        registration.sync.register('sync-game-saves');
      });
    }
  }

  // Queue a save for syncing
  export async function queueSaveForSync(saveData: any) {
    if (!syncEnabled) return;
    
    try {
      // Get sync queue store
      const db = await openDatabase();
      const transaction = db.transaction(['syncQueue'], 'readwrite');
      const syncStore = transaction.objectStore('syncQueue');
      
      // Add to sync queue
      await syncStore.add({
        id: Date.now(), // Unique ID
        saveData,
        timestamp: Date.now(),
        syncStatus: 'pending'
      });
      
      // Trigger immediate sync if online
      if (navigator.onLine) {
        syncSavesToCloud();
      }
    } catch (e) {
      console.error('Failed to queue save for sync:', e);
    }
  }

  // Sync saves to cloud
  export async function syncSavesToCloud() {
    if (!syncEnabled || !authToken) return;
    
    try {
      // Get pending syncs
      const db = await openDatabase();
      const transaction = db.transaction(['syncQueue'], 'readonly');
      const syncStore = transaction.objectStore('syncQueue');
      const index = syncStore.index('syncStatus');
      const pendingSyncs = await index.getAll('pending');
      
      for (const syncItem of pendingSyncs) {
        try {
          // Send to backend
          const response = await fetch('/api/save-sync', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(syncItem.saveData)
          });
          
          if (response.ok) {
            // Mark as synced
            const updateTx = db.transaction(['syncQueue'], 'readwrite');
            const updateStore = updateTx.objectStore('syncQueue');
            syncItem.syncStatus = 'completed';
            syncItem.syncedAt = Date.now();
            await updateStore.put(syncItem);
          }
        } catch (e) {
          console.error('Failed to sync save:', e);
          // Will retry on next sync attempt
        }
      }
    } catch (e) {
      console.error('Failed to sync saves to cloud:', e);
    }
  }

  // Initialize the sync system
  export function initSyncSystem() {
    // Add event listeners for online/offline status
    window.addEventListener('online', () => {
      console.log('Back online, triggering sync');
      syncSavesToCloud();
    });
    
    // Listen for sync completion from service worker
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'sync-completed') {
        console.log('Background sync completed');
      }
    });
  }

  // Make sync function available to service worker
  if (typeof window !== 'undefined') {
    window.syncSavesToCloud = syncSavesToCloud;
  }
  ```

### 5.2 Add API Route for Save Sync
- [ ] Create `src/pages/api/save-sync.ts`:
  ```typescript
  import { NextApiRequest, NextApiResponse } from 'next';
  import { getSession } from 'next-auth/react';

  export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    // This is a placeholder for a future implementation
    // When you're ready to implement cloud saves
    
    // Check authentication
    const session = await getSession({ req });
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    // Handle different HTTP methods
    switch (req.method) {
      case 'POST':
        // Save game to cloud
        return handleSaveGame(req, res, session);
      case 'GET':
        // Get saved games from cloud
        return handleGetSavedGames(req, res, session);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  }

  // Handle saving game to cloud
  async function handleSaveGame(req: NextApiRequest, res: NextApiResponse, session: any) {
    try {
      const { saveData } = req.body;
      
      // Validate save data
      if (!saveData) {
        return res.status(400).json({ error: 'Invalid save data' });
      }
      
      // TODO: Save to database
      // This is where you would save the data to your backend database
      // Example:
      // await db.collection('saves').updateOne(
      //   { userId: session.userId, slotId: saveData.id },
      //   { $set: { saveData, updatedAt: new Date() } },
      //   { upsert: true }
      // );
      
      return res.status(200).json({ success: true, message: 'Save synced successfully' });
    } catch (error) {
      console.error('Error saving game to cloud:', error);
      return res.status(500).json({ error: 'Failed to save game' });
    }
  }

  // Handle getting saved games from cloud
  async function handleGetSavedGames(req: NextApiRequest, res: NextApiResponse, session: any) {
    try {
      // TODO: Retrieve from database
      // This is where you would fetch the data from your backend database
      // Example:
      // const savedGames = await db.collection('saves')
      //   .find({ userId: session.userId })
      //   .sort({ updatedAt: -1 })
      //   .toArray();
      
      const savedGames = []; // Placeholder
      
      return res.status(200).json({ success: true, saves: savedGames });
    } catch (error) {
      console.error('Error getting saved games from cloud:', error);
      return res.status(500).json({ error: 'Failed to get saved games' });
    }
  }
  ```

## 6. Testing & Deployment

### 6.1 Testing Checklist
- [ ] Test PWA installation functionality
  - [ ] Test install prompt appears on supported browsers
  - [ ] Verify app can be launched from home screen
  - [ ] Check app opens properly when launched from home screen
- [ ] Test offline functionality
  - [ ] Ensure game works with no internet connection
  - [ ] Verify assets load from cache
  - [ ] Test save/load functions work offline
- [ ] Test IndexedDB operations
  - [ ] Create multiple saves and verify they persist
  - [ ] Load different saves and verify state loads correctly
  - [ ] Test large save files (with many unlocked nodes)
  - [ ] Ensure saves survive browser refresh
- [ ] Test import/export functionality
  - [ ] Export a save and verify it's properly formatted
  - [ ] Import a save and verify it loads correctly
  - [ ] Test with invalid import data
- [ ] Test emergency save recovery
  - [ ] Force page close/refresh during gameplay
  - [ ] Verify emergency save is created
  - [ ] Test recovery process on next load

### 6.2 Lighthouse PWA Score Optimization
- [ ] Run Lighthouse audit in Chrome DevTools
- [ ] Address PWA checklist issues:
  - [ ] Ensure web app manifest is properly configured
  - [ ] Verify service worker registration
  - [ ] Add necessary icons for all sizes
  - [ ] Configure theme color and background color
  - [ ] Add apple-touch-icon for iOS
  - [ ] Ensure all app URLs work offline

### 6.3 Deployment Considerations
- [ ] Configure correct MIME types on server
  - [ ] Ensure .webmanifest is served with application/manifest+json
  - [ ] Verify service worker is served with appropriate cache headers
- [ ] Set up appropriate caching
  - [ ] Cache static assets with long TTL
  - [ ] Use versioned file names for cache busting
- [ ] HTTPS requirements
  - [ ] Ensure the entire site is served over HTTPS
  - [ ] Service workers only work in secure contexts

## 7. Best Practices & Optimization

### 7.1 Performance Optimization
- [ ] Minimize save data size
  - [ ] Only store essential state data
  - [ ] Avoid storing derived or calculated values
- [ ] Lazy load save previews
  - [ ] Load save metadata first, then details on demand
- [ ] Implement progressive enhancement
  - [ ] Ensure basic functionality works without PWA features
  - [ ] Add enhanced features when available

### 7.2 Error Handling
- [ ] Implement robust error boundaries
  - [ ] Catch and log errors during save/load operations
  - [ ] Provide user-friendly error messages
  - [ ] Offer recovery options where possible
- [ ] Add telemetry for save/load errors
  - [ ] Track failed operations for debugging
  - [ ] Capture error context without personal data

### 7.3 Security Considerations
- [ ] Validate all imported data
  - [ ] Check data structure before loading
  - [ ] Sanitize player-provided content
- [ ] Implement version checking
  - [ ] Ensure compatible save format
  - [ ] Handle version migrations gracefully
- [ ] Protect against manipulation
  - [ ] Add basic checksum validation for exported saves
  - [ ] Validate resource values are within expected ranges

### 7.4 Future-Proofing
- [ ] Document save data format
  - [ ] Create schema documentation for save format
  - [ ] Version the schema appropriately
- [ ] Plan for schema evolution
  - [ ] Design data structure to allow for expansion
  - [ ] Create migration paths for future versions

## 8. Backlog (Future Enhancements)

### 8.1 Cloud Save Authentication
- [ ] Implement email magic link authentication
  - [ ] Set up NextAuth.js with Email provider
  - [ ] Create login UI in TitleScreen
  - [ ] Develop account management screens

### 8.2 Cross-Device Synchronization
- [ ] Build real-time sync functionality
  - [ ] Enable real-time save propagation between devices
  - [ ] Handle conflict resolution

### 8.3 Enhanced Save Management
- [ ] Add save screenshots
  - [ ] Capture screenshot of game state when saving
  - [ ] Display thumbnails in load screen
- [ ] Add save categories and tags
  - [ ] Allow players to organize saves by categories
  - [ ] Support filtering and searching saves

### 8.4 Additional Features
- [ ] Save branching/forking
  - [ ] Allow creating branches from existing saves
  - [ ] Visualize save history tree
- [ ] Save sharing
  - [ ] Generate shareable links for saves
  - [ ] Allow importing saves from other players

## Conclusion

By implementing this comprehensive PWA and IndexedDB approach, Rogue Resident will have a robust, future-proof save system that works offline while laying the groundwork for cloud synchronization in the future. This implementation balances immediate development needs with a clear path toward more advanced features as the game evolves.

Remember to approach the implementation incrementally, starting with the core IndexedDB functionality and adding PWA features as development progresses. This modular approach ensures that core game functionality remains stable while enhanced features are layered on top.
