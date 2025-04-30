import { create } from 'zustand';
import { KnowledgeDomain, MentorId } from '@/app/types';
import { produce } from 'immer';

// Journal entry types
export interface ConceptJournalEntry {
  id: string;
  conceptId: string;
  title: string;
  content: string;
  domain: KnowledgeDomain;
  createdAt: Date;
  updatedAt: Date;
}

export interface MentorJournalEntry {
  id: string;
  mentorId: MentorId;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

export type JournalEntry = ConceptJournalEntry | MentorJournalEntry;

// Journal store interface
interface JournalState {
  // Data
  conceptEntries: Record<string, ConceptJournalEntry>;
  mentorEntries: Record<string, MentorJournalEntry>;
  recentEntries: string[]; // IDs of recent entries (most recent first)
  
  // Actions
  addConceptEntry: (conceptId: string, title: string, content: string, domain: KnowledgeDomain) => string;
  addMentorEntry: (mentorId: MentorId, title: string, content: string) => string;
  updateConceptEntry: (entryId: string, content: string) => void;
  updateMentorEntry: (entryId: string, content: string) => void;
  getEntryById: (entryId: string) => JournalEntry | undefined;
  getEntriesByConceptId: (conceptId: string) => ConceptJournalEntry[];
  getEntriesByMentorId: (mentorId: MentorId) => MentorJournalEntry[];
  getRecentEntries: (limit?: number) => JournalEntry[];
  getEntriesByDomain: (domain: KnowledgeDomain) => ConceptJournalEntry[];
}

export const useJournalStore = create<JournalState>((set, get) => ({
  // Initial state
  conceptEntries: {},
  mentorEntries: {},
  recentEntries: [],
  
  // Add a new concept journal entry
  addConceptEntry: (conceptId, title, content, domain) => {
    const entryId = `concept_${conceptId}_${Date.now()}`;
    const now = new Date();
    
    set(produce(state => {
      // Create new entry
      state.conceptEntries[entryId] = {
        id: entryId,
        conceptId,
        title,
        content,
        domain,
        createdAt: now,
        updatedAt: now
      };
      
      // Add to recent entries
      state.recentEntries = [entryId, ...state.recentEntries];
    }));
    
    return entryId;
  },
  
  // Add a new mentor journal entry
  addMentorEntry: (mentorId, title, content) => {
    const entryId = `mentor_${mentorId}_${Date.now()}`;
    const now = new Date();
    
    set(produce(state => {
      // Create new entry
      state.mentorEntries[entryId] = {
        id: entryId,
        mentorId,
        title,
        content,
        createdAt: now,
        updatedAt: now
      };
      
      // Add to recent entries
      state.recentEntries = [entryId, ...state.recentEntries];
    }));
    
    return entryId;
  },
  
  // Update an existing concept entry
  updateConceptEntry: (entryId, content) => {
    set(produce(state => {
      if (state.conceptEntries[entryId]) {
        state.conceptEntries[entryId].content = content;
        state.conceptEntries[entryId].updatedAt = new Date();
        
        // Move to top of recent entries
        state.recentEntries = [
          entryId,
          ...state.recentEntries.filter(id => id !== entryId)
        ];
      }
    }));
  },
  
  // Update an existing mentor entry
  updateMentorEntry: (entryId, content) => {
    set(produce(state => {
      if (state.mentorEntries[entryId]) {
        state.mentorEntries[entryId].content = content;
        state.mentorEntries[entryId].updatedAt = new Date();
        
        // Move to top of recent entries
        state.recentEntries = [
          entryId,
          ...state.recentEntries.filter(id => id !== entryId)
        ];
      }
    }));
  },
  
  // Get an entry by its ID
  getEntryById: (entryId) => {
    const { conceptEntries, mentorEntries } = get();
    
    if (entryId.startsWith('concept_')) {
      return conceptEntries[entryId];
    } else if (entryId.startsWith('mentor_')) {
      return mentorEntries[entryId];
    }
    
    return undefined;
  },
  
  // Get all entries for a specific concept
  getEntriesByConceptId: (conceptId) => {
    const { conceptEntries } = get();
    
    return Object.values(conceptEntries).filter(
      entry => entry.conceptId === conceptId
    );
  },
  
  // Get all entries for a specific mentor
  getEntriesByMentorId: (mentorId) => {
    const { mentorEntries } = get();
    
    return Object.values(mentorEntries).filter(
      entry => entry.mentorId === mentorId
    );
  },
  
  // Get recent entries (limited by count)
  getRecentEntries: (limit = 10) => {
    const { recentEntries, conceptEntries, mentorEntries } = get();
    const limitedIds = recentEntries.slice(0, limit);
    
    return limitedIds.map(id => {
      if (id.startsWith('concept_')) {
        return conceptEntries[id];
      } else {
        return mentorEntries[id];
      }
    }).filter(Boolean);
  },
  
  // Get all entries for a specific domain
  getEntriesByDomain: (domain) => {
    const { conceptEntries } = get();
    
    return Object.values(conceptEntries).filter(
      entry => entry.domain === domain
    );
  }
})); 