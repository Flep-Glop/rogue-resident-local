'use client';
import { useState, useCallback, useRef, useEffect } from 'react';
import { useJournalStore } from '@/app/store/journalStore';
import { PixelText, PixelButton } from '@/app/components/PixelThemeProvider';
import { safeDispatch } from '@/app/core/events/CentralEventBus';
import { GameEventType } from '@/app/core/events/EventTypes';
import { usePrimitiveStoreValue, useStableCallback, asJournalValue } from '@/app/core/utils/storeHooks';
import { JournalPageProps, JournalStoreState, JournalEntry } from '@/app/core/utils/journalTypes';
import { playSound } from '@/app/core/sound/SoundManager';

/**
 * Journal Notes Page Component
 * 
 * Allows players to create, view and organize their game notes.
 * Implements Chamber Pattern for performance optimization and
 * proper event handling.
 */
export default function JournalNotesPage({ onElementClick }: JournalPageProps) {
  // DOM refs for direct manipulation
  const notesContainerRef = useRef<HTMLDivElement>(null);
  const animationTimersRef = useRef<Record<string, NodeJS.Timeout>>({});
  
  // Extract primitive values from store with consistent defaults and type helper
  const entriesValue = usePrimitiveStoreValue(
    useJournalStore,
    (state: JournalStoreState) => state.entries || [],
    []
  );
  
  // Use the helper to safely type the value
  const entries = asJournalValue<JournalEntry[]>(entriesValue);
  
  // Get stable references to store actions
  const addEntry = useCallback(() => {
    const journalStore = useJournalStore.getState() as unknown as JournalStoreState;
    if (journalStore.addEntry) {
      return journalStore.addEntry;
    }
    return (entry: JournalEntry) => console.warn('[JournalNotesPage] addEntry function not available');
  }, [])();
  
  // UI state with refs for non-rendered states
  const [isCreatingEntry, setIsCreatingEntry] = useState(false);
  const [newEntryTitle, setNewEntryTitle] = useState('');
  const [newEntryContent, setNewEntryContent] = useState('');
  const [newEntryTags, setNewEntryTags] = useState('');
  const [expandedEntries, setExpandedEntries] = useState<string[]>([]);
  const isAnimatingRef = useRef(false);
  
  // For prototype, we'll use some hardcoded entries if no entries exist yet
  const allEntries: JournalEntry[] = entries && entries.length > 0 ? entries : [
    {
      id: 'entry-1',
      title: 'LINAC Calibration with Dr. Kapoor',
      date: new Date().toISOString(),
      content: 'Today I performed my first LINAC output calibration under Dr. Kapoor\'s supervision. Key learnings:\n\n- Importance of PTP correction factor\n- Electronic equilibrium principles\n- Clinical significance of 1% output error (0.7 Gy in 70 Gy treatment)',
      tags: ['calibration', 'qa', 'kapoor'],
      category: 'Log'
    }
  ];
  
  // Format date for display - stable implementation to avoid rerenders
  const formatDate = useStableCallback((dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  });
  
  // Clear any animation timers on unmount
  useEffect(() => {
    return () => {
      Object.values(animationTimersRef.current).forEach(timer => {
        clearTimeout(timer);
      });
    };
  }, []);
  
  // Toggle entry expanded state with stable callback
  const handleToggleExpanded = useStableCallback((entryId: string) => {
    // Prevent rapid toggling
    if (isAnimatingRef.current) return;
    isAnimatingRef.current = true;
    
    // Dispatch UI event
    safeDispatch(
      GameEventType.UI_BUTTON_CLICKED,
      {
        componentId: 'journalNotes',
        action: 'toggleEntry',
        metadata: { entryId }
      },
      'journalNotesPage'
    );
    
    // Update state
    setExpandedEntries(prev => 
      prev.includes(entryId)
        ? prev.filter(id => id !== entryId)
        : [...prev, entryId]
    );
    
    // Direct DOM manipulation for animation
    if (notesContainerRef.current) {
      const entryElement = notesContainerRef.current.querySelector(`[data-entry-id="${entryId}"]`);
      if (entryElement instanceof HTMLElement) {
        entryElement.classList.add('entry-animating');
        
        animationTimersRef.current.toggleAnimation = setTimeout(() => {
          if (entryElement) {
            entryElement.classList.remove('entry-animating');
            isAnimatingRef.current = false;
          }
        }, 300);
      } else {
        isAnimatingRef.current = false;
      }
    } else {
      isAnimatingRef.current = false;
    }
  });
  
  // Handle creating new entry with UI event
  const handleCreateEntry = useStableCallback(() => {
    if (!newEntryTitle.trim()) return;
    
    // Dispatch UI event
    safeDispatch(
      GameEventType.UI_BUTTON_CLICKED,
      {
        componentId: 'journalNotes',
        action: 'createEntry',
        metadata: { title: newEntryTitle }
      },
      'journalNotesPage'
    );
    
    const newEntry = {
      id: `entry-${Date.now()}`,
      title: newEntryTitle,
      date: new Date().toISOString(),
      content: newEntryContent,
      tags: newEntryTags.split(',').map(tag => tag.trim()).filter(tag => tag),
      category: 'Log'
    };
    
    addEntry(newEntry);
    
    // Reset form
    setNewEntryTitle('');
    setNewEntryContent('');
    setNewEntryTags('');
    setIsCreatingEntry(false);
    
    // Play success sound
    playSound('success');
    
    // Animate the container
    if (notesContainerRef.current) {
      notesContainerRef.current.classList.add('container-updated');
      
      animationTimersRef.current.createAnimation = setTimeout(() => {
        if (notesContainerRef.current) {
          notesContainerRef.current.classList.remove('container-updated');
        }
      }, 500);
    }
  });
  
  // Toggle creating entry mode
  const toggleCreatingEntry = useStableCallback(() => {
    // Dispatch UI event
    safeDispatch(
      GameEventType.UI_BUTTON_CLICKED,
      {
        componentId: 'journalNotes',
        action: 'toggleCreatingEntry',
        metadata: { isCreating: !isCreatingEntry }
      },
      'journalNotesPage'
    );
    
    setIsCreatingEntry(prev => !prev);
  });
  
  // Form field handlers
  const handleTitleChange = useStableCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setNewEntryTitle(e.target.value);
  });
  
  const handleContentChange = useStableCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewEntryContent(e.target.value);
  });
  
  const handleTagsChange = useStableCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setNewEntryTags(e.target.value);
  });
  
  // Cancel form handler
  const handleCancelForm = useStableCallback(() => {
    // Dispatch UI event
    safeDispatch(
      GameEventType.UI_BUTTON_CLICKED,
      {
        componentId: 'journalNotes',
        action: 'cancelEntryForm'
      },
      'journalNotesPage'
    );
    
    setIsCreatingEntry(false);
  });
  
  // Stop propagation helper
  const stopPropagation = useStableCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  });
  
  return (
    <div 
      ref={notesContainerRef}
      onClick={onElementClick} 
      className="page-container relative"
    >
      <div className="flex justify-between items-center mb-4">
        <PixelText className="text-2xl">Journal Entries</PixelText>
        {!isCreatingEntry && (
          <PixelButton 
            className="bg-clinical text-white text-sm px-3 py-1 relative z-20"
            onClick={toggleCreatingEntry}
          >
            New Entry
          </PixelButton>
        )}
      </div>
      
      {/* New entry form with explicit event handling */}
      {isCreatingEntry && (
        <div 
          className="mb-6 p-4 bg-surface-dark pixel-borders-thin relative z-10"
          onClick={stopPropagation}
        >
          <PixelText className="text-lg text-clinical-light mb-2">Create New Entry</PixelText>
          
          <div className="mb-3">
            <PixelText className="text-sm mb-1">Title:</PixelText>
            <input
              className="w-full bg-surface p-2 text-sm font-pixel border border-border"
              value={newEntryTitle}
              onChange={handleTitleChange}
              placeholder="Entry title..."
              onClick={stopPropagation}
            />
          </div>
          
          <div className="mb-3">
            <PixelText className="text-sm mb-1">Content:</PixelText>
            <textarea
              className="w-full h-32 bg-surface p-2 text-sm font-pixel border border-border"
              value={newEntryContent}
              onChange={handleContentChange}
              placeholder="Record your observations here..."
              onClick={stopPropagation}
            />
          </div>
          
          <div className="mb-3">
            <PixelText className="text-sm mb-1">Tags (comma separated):</PixelText>
            <input
              className="w-full bg-surface p-2 text-sm font-pixel border border-border"
              value={newEntryTags}
              onChange={handleTagsChange}
              placeholder="calibration, qa, kapoor..."
              onClick={stopPropagation}
            />
          </div>
          
          <div className="flex justify-end space-x-2">
            <PixelButton 
              className="bg-surface text-sm px-3 py-1 relative z-20"
              onClick={handleCancelForm}
            >
              Cancel
            </PixelButton>
            <PixelButton 
              className="bg-clinical text-white text-sm px-3 py-1 relative z-20"
              onClick={handleCreateEntry}
              disabled={!newEntryTitle.trim()}
            >
              Save Entry
            </PixelButton>
          </div>
        </div>
      )}
      
      {/* Entry list with explicit event handling */}
      <div className="space-y-4">
        {allEntries.length === 0 ? (
          <div className="p-4 bg-surface-dark text-center">
            <PixelText className="text-text-secondary">
              No journal entries yet. Create your first entry to start documenting your journey.
            </PixelText>
          </div>
        ) : (
          allEntries
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) // Sort newest first
            .map(entry => (
              <div 
                key={entry.id} 
                data-entry-id={entry.id}
                className="p-4 bg-surface-dark pixel-borders-thin relative z-10"
                onClick={stopPropagation}
              >
                <div className="flex justify-between items-center">
                  <button 
                    className="flex-1 flex justify-between items-center text-left relative z-20"
                    onClick={() => handleToggleExpanded(entry.id)}
                  >
                    <PixelText className="text-lg text-clinical-light">{entry.title}</PixelText>
                    <div className="flex items-center">
                      <PixelText className="text-sm text-text-secondary mr-2">{formatDate(entry.date)}</PixelText>
                      <span>{expandedEntries.includes(entry.id) ? '▼' : '►'}</span>
                    </div>
                  </button>
                </div>
                
                {expandedEntries.includes(entry.id) && (
                  <>
                    <div className="p-3 bg-surface my-2 min-h-[80px] whitespace-pre-line">
                      <PixelText className="text-sm">{entry.content}</PixelText>
                    </div>
                    
                    <div className="flex items-center">
                      <PixelText className="text-sm text-text-secondary mr-2">Tags:</PixelText>
                      <div className="flex flex-wrap">
                        {entry.tags && entry.tags.map(tag => (
                          <span 
                            key={tag} 
                            className="px-2 py-0.5 bg-clinical/20 text-clinical-light text-xs mr-1 mb-1"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))
        )}
      </div>
      
      {/* Global animations */}
      <style jsx>{`
        .entry-animating {
          transition: all 0.3s ease-in-out;
        }
        .container-updated {
          animation: flash 0.5s ease-in-out;
        }
        @keyframes flash {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
      `}</style>
    </div>
  );
}