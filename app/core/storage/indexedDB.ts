'use client';

// Database constants
const DB_NAME = 'RogueResidentDB';
const DB_VERSION = 1;
const SAVE_STORE = 'gameSaves';
const SYNC_STORE = 'syncQueue';

// Open database connection
export function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }

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