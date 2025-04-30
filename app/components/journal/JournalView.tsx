import React, { useState, useCallback, useMemo } from 'react';
import { useJournalStore, JournalEntry, ConceptJournalEntry, MentorJournalEntry } from '@/app/store/journalStore';
import { useKnowledgeStore } from '@/app/store/knowledgeStore';
import { DomainColors, KnowledgeDomain, MentorId } from '@/app/types';
import { JournalEntryEditor } from './JournalEntryEditor';
import { JournalEntryView } from './JournalEntryView';

type JournalTab = 'recent' | 'concepts' | 'mentors' | 'domains';

export const JournalView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<JournalTab>('recent');
  const [selectedDomain, setSelectedDomain] = useState<KnowledgeDomain | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  
  // Journal store - using individual selectors
  const getRecentEntries = useJournalStore(state => state.getRecentEntries);
  const getEntriesByDomain = useJournalStore(state => state.getEntriesByDomain);
  const conceptEntries = useJournalStore(state => state.conceptEntries);
  const mentorEntries = useJournalStore(state => state.mentorEntries);
  const updateConceptEntry = useJournalStore(state => state.updateConceptEntry);
  const updateMentorEntry = useJournalStore(state => state.updateMentorEntry);
  
  // Knowledge store (for concept data)
  const stars = useKnowledgeStore(state => state.stars);
  
  // Get entries based on active tab using useMemo
  const entries = useMemo(() => {
    switch (activeTab) {
      case 'recent':
        return getRecentEntries(20);
      case 'concepts':
        return Object.values(conceptEntries);
      case 'mentors':
        return Object.values(mentorEntries);
      case 'domains':
        return selectedDomain ? getEntriesByDomain(selectedDomain) : [];
      default:
        return [];
    }
  }, [activeTab, conceptEntries, getEntriesByDomain, getRecentEntries, mentorEntries, selectedDomain]);
  
  // Format date for display
  const formatDate = useCallback((date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }, []);
  
  // Check if an entry is a concept entry
  const isConceptEntry = useCallback((entry: JournalEntry): entry is ConceptJournalEntry => {
    return 'conceptId' in entry;
  }, []);
  
  // Check if an entry is a mentor entry
  const isMentorEntry = useCallback((entry: JournalEntry): entry is MentorJournalEntry => {
    return 'mentorId' in entry;
  }, []);
  
  // Get concept name from concept ID
  const getConceptName = useCallback((conceptId: string) => {
    return stars[conceptId]?.name || conceptId;
  }, [stars]);
  
  // Get mentor name from mentor ID
  const getMentorName = useCallback((mentorId: MentorId) => {
    const mentorNames: Record<MentorId, string> = {
      garcia: 'Dr. Garcia',
      kapoor: 'Dr. Kapoor',
      jesse: 'Jesse',
      quinn: 'Dr. Quinn'
    };
    
    return mentorNames[mentorId] || mentorId;
  }, []);
  
  // Handle tab change
  const handleTabChange = useCallback((tab: JournalTab) => {
    setActiveTab(tab);
    setSelectedEntry(null);
    setIsEditing(false);
  }, []);
  
  // Handle domain selection
  const handleDomainChange = useCallback((domain: KnowledgeDomain | null) => {
    setSelectedDomain(domain);
    setSelectedEntry(null);
    setIsEditing(false);
  }, []);
  
  // Handle entry selection
  const handleEntrySelect = useCallback((entry: JournalEntry) => {
    setSelectedEntry(entry);
    setIsEditing(false);
  }, []);
  
  // Handle entry edit
  const handleEditClick = useCallback(() => {
    setIsEditing(true);
  }, []);
  
  // Save edited entry
  const handleSaveEntry = useCallback((content: string) => {
    if (!selectedEntry) return;
    
    if (isConceptEntry(selectedEntry)) {
      updateConceptEntry(selectedEntry.id, content);
    } else if (isMentorEntry(selectedEntry)) {
      updateMentorEntry(selectedEntry.id, content);
    }
    
    setIsEditing(false);
  }, [isConceptEntry, isMentorEntry, selectedEntry, updateConceptEntry, updateMentorEntry]);
  
  // Cancel editing
  const handleCancelEdit = useCallback(() => {
    setIsEditing(false);
  }, []);
  
  return (
    <div className="fixed inset-0 bg-gray-900 text-white overflow-hidden flex">
      {/* Sidebar */}
      <div className="w-80 bg-gray-800 border-r border-gray-700 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-gray-700">
          <h2 className="text-2xl font-bold">Journal</h2>
        </div>
        
        {/* Tabs */}
        <div className="flex border-b border-gray-700">
          <button
            className={`flex-1 py-2 px-4 text-sm font-medium ${activeTab === 'recent' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:bg-gray-700'}`}
            onClick={() => handleTabChange('recent')}
          >
            Recent
          </button>
          <button
            className={`flex-1 py-2 px-4 text-sm font-medium ${activeTab === 'concepts' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:bg-gray-700'}`}
            onClick={() => handleTabChange('concepts')}
          >
            Concepts
          </button>
          <button
            className={`flex-1 py-2 px-4 text-sm font-medium ${activeTab === 'mentors' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:bg-gray-700'}`}
            onClick={() => handleTabChange('mentors')}
          >
            Mentors
          </button>
          <button
            className={`flex-1 py-2 px-4 text-sm font-medium ${activeTab === 'domains' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:bg-gray-700'}`}
            onClick={() => handleTabChange('domains')}
          >
            Domains
          </button>
        </div>
        
        {/* Domain filter (only visible in domains tab) */}
        {activeTab === 'domains' && (
          <div className="p-3 border-b border-gray-700">
            <select
              className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm"
              value={selectedDomain || ''}
              onChange={(e) => handleDomainChange(e.target.value as KnowledgeDomain || null)}
            >
              <option value="">Select Domain...</option>
              {Object.values(KnowledgeDomain).map(domain => (
                <option key={domain} value={domain}>
                  {domain.replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>
        )}
        
        {/* Entry list */}
        <div className="flex-1 overflow-y-auto">
          {entries.length === 0 ? (
            <div className="p-4 text-center text-gray-400">
              {activeTab === 'domains' && !selectedDomain
                ? 'Select a domain to view entries'
                : 'No entries found'}
            </div>
          ) : (
            <div className="divide-y divide-gray-700">
              {entries.map(entry => (
                <div
                  key={entry.id}
                  className={`p-3 cursor-pointer hover:bg-gray-700 transition-colors ${selectedEntry?.id === entry.id ? 'bg-gray-700' : ''}`}
                  onClick={() => handleEntrySelect(entry)}
                >
                  {/* Entry title with appropriate color based on type */}
                  <h3 className="font-medium truncate">
                    {isConceptEntry(entry) && (
                      <span 
                        className="inline-block w-2 h-2 rounded-full mr-2"
                        style={{ backgroundColor: DomainColors[entry.domain] }}
                      />
                    )}
                    {entry.title}
                  </h3>
                  
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    {/* Entry metadata */}
                    <span>
                      {isConceptEntry(entry) && getConceptName(entry.conceptId)}
                      {isMentorEntry(entry) && `${getMentorName(entry.mentorId)}`}
                    </span>
                    <span>{formatDate(entry.updatedAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Main content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {selectedEntry ? (
          <>
            <div className="p-4 border-b border-gray-700 flex justify-between items-center">
              <h2 className="text-xl font-semibold">{selectedEntry.title}</h2>
              
              {!isEditing && (
                <button
                  className="py-1 px-3 bg-indigo-600 hover:bg-indigo-700 rounded text-sm"
                  onClick={handleEditClick}
                >
                  Edit
                </button>
              )}
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              {isEditing ? (
                <JournalEntryEditor
                  initialContent={selectedEntry.content}
                  onSave={handleSaveEntry}
                  onCancel={handleCancelEdit}
                />
              ) : (
                <JournalEntryView entry={selectedEntry} />
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center p-4 text-gray-400">
            <p>Select an entry to view details</p>
          </div>
        )}
      </div>
    </div>
  );
}; 