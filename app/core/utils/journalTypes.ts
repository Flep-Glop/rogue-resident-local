/**
 * Common Journal Type Definitions
 * 
 * This file defines shared types for journal components to ensure
 * consistency and type safety across the journal system.
 */

// Journal page types
export type JournalPageType = 'knowledge' | 'characters' | 'notes' | 'references';
export type JournalTier = 'base' | 'technical' | 'annotated';

// Journal entry for notes page
export interface JournalEntry {
  id: string;
  title: string;
  date: string;
  content: string;
  tags: string[];
  category: string;
}

// Character note for characters page
export interface JournalCharacterNote {
  characterId: string;
  notes: string;
  relationshipLevel?: number;
  lastInteraction?: string;
}

// Journal store state interface
export interface JournalStoreState {
  // Core state
  hasJournal: boolean;
  isJournalOpen: boolean;
  currentUpgrade: JournalTier;
  currentPage: JournalPageType;
  
  // References page state
  hasKapoorReferenceSheets?: boolean;
  hasKapoorAnnotatedNotes?: boolean;
  
  // Notes page state
  entries?: JournalEntry[];
  
  // Characters page state
  characterNotes?: JournalCharacterNote[];
  
  // Actions
  initializeJournal?: (tier: JournalTier) => void;
  toggleJournal?: () => void;
  setJournalOpen?: (isOpen: boolean) => void;
  setCurrentPage?: (page: JournalPageType) => void;
  addEntry?: (entry: JournalEntry) => void;
  updateCharacterNote?: (characterId: string, notes: string) => void;
  
  // Allow additional properties
  [key: string]: any;
}

// Simple props interface for journal pages
export interface JournalPageProps {
  onElementClick?: (e: React.MouseEvent) => void;
} 