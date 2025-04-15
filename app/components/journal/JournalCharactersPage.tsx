'use client';
import { useState, useRef, useCallback, useEffect } from 'react';
import { useJournalStore } from '@/app/store/journalStore';
import { PixelText } from '@/app/components/PixelThemeProvider';
import Image from 'next/image';
import { safeDispatch } from '@/app/core/events/CentralEventBus';
import { GameEventType } from '@/app/core/events/EventTypes';
import { usePrimitiveStoreValue, useStableCallback, asJournalValue } from '@/app/core/utils/storeHooks';
import { JournalPageProps, JournalStoreState, JournalCharacterNote } from '@/app/core/utils/journalTypes';

// Character data structure
interface Character {
  id: string;
  name: string;
  title: string;
  imageSrc: string;
  colorClass: string;
  bgClass: string;
  textClass: string;
  unlocked: boolean;
  description: string;
}

/**
 * Character Journal Page
 * 
 * Displays character relationship tracking and notes.
 * Implements Chamber Pattern for performance and DOM-based
 * animations for smooth transitions.
 */
export default function JournalCharactersPage({ onElementClick }: JournalPageProps) {
  // DOM refs for animations
  const containerRef = useRef<HTMLDivElement>(null);
  const animationTimersRef = useRef<Record<string, NodeJS.Timeout>>({});
  
  // Extract store values with safer typing using helper
  const characterNotesValue = usePrimitiveStoreValue(
    useJournalStore,
    (state: JournalStoreState) => state.characterNotes || [],
    []
  );
  
  // Use type helper to safely type the value
  const characterNotes = asJournalValue<JournalCharacterNote[]>(characterNotesValue);
  
  // Get stable reference to store actions
  const updateCharacterNote = useCallback(() => {
    const journalStore = useJournalStore.getState() as unknown as JournalStoreState;
    if (journalStore.updateCharacterNote) {
      return journalStore.updateCharacterNote;
    }
    return () => console.warn('[JournalCharactersPage] updateCharacterNote function not available');
  }, [])();
  
  // State for editing notes
  const [editingNotes, setEditingNotes] = useState<Record<string, string>>({});
  
  // For the prototype, we'll use some hardcoded character data
  const characters: Character[] = [
    {
      id: 'kapoor',
      name: 'Dr. Kapoor',
      title: 'Chief Medical Physicist',
      imageSrc: '/characters/kapoor.png',
      colorClass: 'border-clinical',
      bgClass: 'bg-clinical',
      textClass: 'text-clinical-light',
      unlocked: true,
      description: 'Methodical and precise. Values technical accuracy and careful documentation.'
    },
    {
      id: 'quinn',
      name: 'Dr. Quinn',
      title: 'Experimental Researcher',
      imageSrc: '/characters/quinn.png',
      colorClass: 'border-educational',
      bgClass: 'bg-educational',
      textClass: 'text-educational-light',
      unlocked: true,
      description: 'Innovative and unconventional. Approaches problems with creative solutions.'
    },
    {
      id: 'jesse',
      name: 'Technician Jesse',
      title: 'Equipment Specialist',
      imageSrc: '/characters/jesse.png',
      colorClass: 'border-qa',
      bgClass: 'bg-qa',
      textClass: 'text-qa-light',
      unlocked: true,
      description: 'Practical and resourceful. Focuses on hands-on solutions to technical problems.'
    },
    {
      id: 'garcia',
      name: 'Dr. Garcia',
      title: 'Radiation Oncologist',
      imageSrc: '/characters/kapoor.png', // Placeholder, would be replaced with actual image
      colorClass: 'border-clinical-alt',
      bgClass: 'bg-clinical-alt-dark',
      textClass: 'text-clinical-light',
      unlocked: false,
      description: ''
    }
  ];
  
  // Cleanup animations on unmount
  useEffect(() => {
    return () => {
      Object.values(animationTimersRef.current).forEach(timer => {
        clearTimeout(timer);
      });
    };
  }, []);
  
  // Handle note change
  const handleNoteChange = useStableCallback((characterId: string, e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditingNotes(prev => ({
      ...prev,
      [characterId]: e.target.value
    }));
  });
  
  // Edit handler
  const handleEditClick = useStableCallback((characterId: string, notes: string) => {
    // Dispatch UI event
    safeDispatch(
      GameEventType.UI_BUTTON_CLICKED,
      {
        componentId: 'journalCharacters',
        action: 'editCharacterNotes',
        metadata: { characterId }
      },
      'journalCharactersPage'
    );
    
    setEditingNotes(prev => ({
      ...prev,
      [characterId]: notes
    }));
    
    // Apply animation
    if (containerRef.current) {
      const characterElement = containerRef.current.querySelector(`[data-character-id="${characterId}"]`);
      if (characterElement instanceof HTMLElement) {
        characterElement.classList.add('character-editing');
        
        // Remove after animation
        animationTimersRef.current.editingAnimation = setTimeout(() => {
          if (characterElement) {
            characterElement.classList.remove('character-editing');
          }
        }, 500);
      }
    }
  });
  
  // Save notes handler
  const handleSaveNotes = useStableCallback((characterId: string) => {
    if (editingNotes[characterId] !== undefined) {
      // Dispatch UI event
      safeDispatch(
        GameEventType.UI_BUTTON_CLICKED,
        {
          componentId: 'journalCharacters',
          action: 'saveCharacterNotes',
          metadata: { 
            characterId,
            notes: editingNotes[characterId]
          }
        },
        'journalCharactersPage'
      );
      
      // Update in store
      updateCharacterNote(characterId, editingNotes[characterId]);
      
      // Remove from editing state
      setEditingNotes(prev => {
        const newNotes = {...prev};
        delete newNotes[characterId];
        return newNotes;
      });
      
      // Apply save animation
      if (containerRef.current) {
        const characterElement = containerRef.current.querySelector(`[data-character-id="${characterId}"]`);
        if (characterElement instanceof HTMLElement) {
          characterElement.classList.add('character-saved');
          
          // Remove after animation
          animationTimersRef.current.savedAnimation = setTimeout(() => {
            if (characterElement) {
              characterElement.classList.remove('character-saved');
            }
          }, 800);
        }
      }
    }
  });
  
  // Cancel edit handler
  const handleCancelEdit = useStableCallback((characterId: string) => {
    // Dispatch UI event
    safeDispatch(
      GameEventType.UI_BUTTON_CLICKED,
      {
        componentId: 'journalCharacters',
        action: 'cancelCharacterNotes',
        metadata: { characterId }
      },
      'journalCharactersPage'
    );
    
    setEditingNotes(prev => {
      const newNotes = {...prev};
      delete newNotes[characterId];
      return newNotes;
    });
  });
  
  // Get relationship level for character
  const getRelationshipLevel = useStableCallback((characterId: string): number => {
    const note = characterNotes.find(note => note.characterId === characterId);
    return note?.relationshipLevel || 0;
  });
  
  // Get notes for character
  const getCharacterNotes = useStableCallback((characterId: string): string => {
    // If currently editing, return from editing state
    if (editingNotes[characterId] !== undefined) {
      return editingNotes[characterId];
    }
    
    // Otherwise get from store
    const note = characterNotes.find(note => note.characterId === characterId);
    return note?.notes || '';
  });
  
  // Format last interaction date
  const formatDate = useStableCallback((dateString?: string): string => {
    if (!dateString) return 'No interaction yet';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  });
  
  // Get last interaction date
  const getLastInteraction = useStableCallback((characterId: string): string => {
    const note = characterNotes.find(note => note.characterId === characterId);
    return formatDate(note?.lastInteraction);
  });
  
  // Handle character click - dispatches node event
  const handleCharacterClick = useStableCallback((characterId: string) => {
    if (!characters.find(c => c.id === characterId)?.unlocked) return;
    
    // Dispatch node event for character interaction
    safeDispatch(
      GameEventType.UI_NODE_CLICKED,
      {
        nodeId: characterId,
        metadata: { 
          type: 'character',
          source: 'journal'
        }
      },
      'journalCharactersPage'
    );
  });
  
  // Stop propagation helper
  const stopPropagation = useStableCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  });
  
  return (
    <div 
      ref={containerRef}
      onClick={onElementClick} 
      className="page-container relative"
    >
      <PixelText className="text-2xl mb-4">Character Notes</PixelText>
      
      <div className="space-y-6">
        {characters.map(character => (
          <div 
            key={character.id} 
            data-character-id={character.id}
            className={`p-4 bg-surface-dark pixel-borders-thin relative z-10 ${!character.unlocked ? 'opacity-50' : ''}`}
            style={{
              borderLeft: character.unlocked ? `4px solid ${character.colorClass.replace('border-', 'var(--')}${character.colorClass.includes('alt') ? '' : '-color'})` : undefined
            }}
            onClick={stopPropagation}
          >
            <div className="flex items-start">
              <div 
                className={`w-20 h-20 mr-4 rounded-full overflow-hidden border-2 ${character.colorClass} flex-shrink-0 ${!character.unlocked ? 'grayscale' : ''} cursor-pointer`}
                onClick={() => handleCharacterClick(character.id)}
              >
                <div className="w-full h-full relative">
                  {character.unlocked ? (
                    <Image 
                      src={character.imageSrc} 
                      alt={character.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-surface-dark">
                      <span className="text-3xl">?</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex-1">
                <div 
                  className="cursor-pointer" 
                  onClick={() => handleCharacterClick(character.id)}
                >
                  <PixelText 
                    className={`text-xl ${character.unlocked ? character.textClass : ''}`}
                  >
                    {character.unlocked ? character.name : 'Unknown Character'}
                  </PixelText>
                </div>
                
                <PixelText className="text-text-secondary text-sm mb-2">
                  {character.unlocked ? character.title : '???'}
                </PixelText>
                
                {character.unlocked && (
                  <>
                    <div className="flex items-center mb-3">
                      <PixelText className="text-sm mr-2">Relationship:</PixelText>
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <div 
                            key={i}
                            className={`w-5 h-2 mx-0.5 ${i < getRelationshipLevel(character.id) ? character.bgClass : 'bg-surface'}`}
                          ></div>
                        ))}
                      </div>
                      <PixelText className={`text-xs ml-2 ${character.textClass}`}>
                        {getRelationshipLevel(character.id)}/5
                      </PixelText>
                    </div>
                    
                    <div className="mb-1">
                      <div className="flex justify-between">
                        <PixelText className="text-sm text-text-secondary">Notes:</PixelText>
                        <PixelText className="text-xs text-text-secondary">
                          Last interaction: {getLastInteraction(character.id)}
                        </PixelText>
                      </div>
                      
                      {editingNotes[character.id] !== undefined ? (
                        <div className="mt-1">
                          <textarea
                            className="w-full h-24 bg-surface p-2 text-sm font-pixel border border-border"
                            value={editingNotes[character.id]}
                            onChange={(e) => handleNoteChange(character.id, e)}
                            placeholder="Add your observations about this character..."
                            onClick={stopPropagation}
                          />
                          <div className="flex justify-end mt-1 space-x-2">
                            <button 
                              className="px-2 py-1 bg-clinical text-white text-xs relative z-30"
                              onClick={() => handleSaveNotes(character.id)}
                            >
                              Save
                            </button>
                            <button 
                              className="px-2 py-1 bg-surface text-xs relative z-30"
                              onClick={() => handleCancelEdit(character.id)}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-1">
                          {getCharacterNotes(character.id) ? (
                            <div className="p-2 bg-surface min-h-[60px]">
                              <PixelText className="text-sm">
                                {getCharacterNotes(character.id)}
                              </PixelText>
                            </div>
                          ) : (
                            <div className="p-2 bg-surface border border-dashed border-border text-text-secondary text-sm italic min-h-[60px]">
                              No notes recorded yet. Add your observations about this character.
                            </div>
                          )}
                          <div className="flex justify-end mt-1">
                            <button 
                              className="px-2 py-1 bg-surface text-xs relative z-30"
                              onClick={() => handleEditClick(character.id, getCharacterNotes(character.id))}
                            >
                              Edit Notes
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Character info summary */}
                    {character.description && (
                      <div className="mt-3 pt-2 border-t border-border">
                        <PixelText className="text-sm">
                          {character.description}
                        </PixelText>
                      </div>
                    )}
                  </>
                )}
                
                {!character.unlocked && (
                  <div className="p-3 bg-surface-dark/50 text-text-secondary text-sm italic">
                    You have not yet met this character.
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* CSS animations */}
      <style jsx>{`
        .character-editing {
          animation: pulse-edit 0.5s ease;
        }
        .character-saved {
          animation: pulse-save 0.8s ease;
        }
        @keyframes pulse-edit {
          0%, 100% { background-color: var(--surface-dark); }
          50% { background-color: rgba(var(--clinical-rgb), 0.1); }
        }
        @keyframes pulse-save {
          0% { background-color: var(--surface-dark); }
          30% { background-color: rgba(var(--clinical-rgb), 0.2); }
          100% { background-color: var(--surface-dark); }
        }
      `}</style>
    </div>
  );
}