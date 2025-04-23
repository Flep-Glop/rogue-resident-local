'use client';
import { useState, useRef, useCallback, useEffect } from 'react';
import { useJournalStore } from '@/app/store/journalStore';
import { PixelText } from '@/app/components/PixelThemeProvider';
import Image from 'next/image';
import { safeDispatch } from '@/app/core/events/CentralEventBus';
import { GameEventType } from '@/app/core/events/EventTypes';
import { usePrimitiveStoreValue, useStableCallback, useStableStoreValue, asJournalValue } from '@/app/core/utils/storeHooks';
import { JournalPageProps, JournalStoreState, JournalCharacterNote } from '@/app/core/utils/journalTypes';
import { useSpring, animated } from '@react-spring/web';
import CharacterLogButton from './CharacterLogButton';
import DossierHeader from './DossierHeader';
import { motion } from 'framer-motion';
import classNames from 'classnames';

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
  badge?: string;
  pattern?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
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
  const characterNotesValue = useStableStoreValue(
    useJournalStore,
    (state: JournalStoreState) => state.characterNotes || []
  );
  
  // Use type helper to safely type the value
  const characterNotes = asJournalValue<JournalCharacterNote[]>(characterNotesValue || []);
  
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
      description: 'Methodical and precise. Values technical accuracy and careful documentation.',
      badge: '⚕️',
      pattern: 'clinical-pattern',
      primaryColor: 'rgba(29, 91, 89, 0.95)', // darker teal
      secondaryColor: 'rgba(19, 61, 59, 0.97)', // even darker teal
      accentColor: 'rgba(49, 151, 149, 0.8)' // slightly darker accent teal
    },
    {
      id: 'quinn',
      name: 'Dr. Quinn',
      title: 'Experimental Researcher',
      imageSrc: '/characters/quinn.png',
      colorClass: 'border-educational',
      bgClass: 'bg-educational',
      textClass: 'text-educational-light',
      unlocked: false,
      description: 'Innovative and unconventional. Approaches problems with creative solutions.',
      badge: '🧪',
      pattern: 'educational-pattern',
      primaryColor: 'rgba(94, 58, 165, 0.95)', // darker purple
      secondaryColor: 'rgba(74, 38, 145, 0.97)', // even darker purple
      accentColor: 'rgba(124, 78, 195, 0.8)' // slightly darker accent purple
    },
    {
      id: 'jesse',
      name: 'Technician Jesse',
      title: 'Equipment Specialist',
      imageSrc: '/characters/jesse.png',
      colorClass: 'border-qa',
      bgClass: 'bg-qa',
      textClass: 'text-qa-light',
      unlocked: false,
      description: 'Practical and resourceful. Focuses on hands-on solutions to technical problems.',
      badge: '🔧',
      pattern: 'qa-pattern',
      primaryColor: 'rgba(185, 129, 41, 0.95)', // darker orange
      secondaryColor: 'rgba(155, 99, 21, 0.97)', // even darker orange
      accentColor: 'rgba(215, 159, 61, 0.8)' // slightly darker accent orange
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
      description: '',
      badge: '⚛️',
      pattern: 'clinical-alt-pattern',
      primaryColor: 'rgba(39, 90, 176, 0.95)', // darker blue
      secondaryColor: 'rgba(29, 70, 146, 0.97)', // even darker blue
      accentColor: 'rgba(59, 120, 206, 0.8)' // slightly darker accent blue
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
      className="page-container relative pb-3"
    >
      <PixelText className="text-2xl mb-3 glitch-text text-center">Character Files</PixelText>
      
      <div className="space-y-6">
        {characters.map(character => (
          <div 
            key={character.id} 
            data-character-id={character.id}
            className={`abstract-card pixel-borders-thin relative z-10 ${!character.unlocked ? 'opacity-60 grayscale' : character.id + '-card'}`}
            style={{
              backgroundColor: character.unlocked ? character.primaryColor : 'rgba(30, 30, 40, 0.8)',
              overflow: 'hidden',
              minHeight: '230px'
            }}
            onClick={stopPropagation}
          >
            {/* Background patterns */}
            {character.unlocked && (
              <>
                <div className="absolute inset-0 w-full h-full character-bill-pattern" 
                  style={{ 
                    backgroundImage: `repeating-linear-gradient(45deg, ${character.secondaryColor} 0px, ${character.secondaryColor} 1px, transparent 1px, transparent 10px), 
                                     repeating-linear-gradient(-45deg, ${character.secondaryColor} 0px, ${character.secondaryColor} 1px, transparent 1px, transparent 10px)`,
                    opacity: 0.5
                  }}>
                </div>
                
                {/* Textured background elements */}
                <div className="absolute inset-0 opacity-25">
                  <div className="absolute top-0 left-0 w-full h-full grid-texture"
                    style={{ 
                      backgroundImage: `linear-gradient(0deg, ${character.secondaryColor} 1px, transparent 1px),
                                      linear-gradient(90deg, ${character.secondaryColor} 1px, transparent 1px)`,
                      backgroundSize: '20px 20px',
                      opacity: 0.6
                    }}
                  ></div>
                  <div className="absolute top-0 left-0 w-full h-full circuit-texture"
                    style={{ 
                      backgroundImage: `radial-gradient(circle at 50% 50%, ${character.secondaryColor} 1px, transparent 1px)`,
                      backgroundSize: '15px 15px',
                      opacity: 0.5
                    }}
                  ></div>
                  <div className="absolute top-0 left-0 w-full h-full hex-texture"
                    style={{ 
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 20 20'%3E%3Cpath fill='none' stroke='${encodeURIComponent(character.secondaryColor || '#ffffff')}' stroke-width='0.5' d='M10,1 L17,5.5 L17,14.5 L10,19 L3,14.5 L3,5.5 Z'/%3E%3C/svg%3E")`,
                      backgroundSize: '20px 20px',
                      opacity: 0.25
                    }}
                  ></div>
                  <div className="absolute bottom-0 right-0 w-full h-full noise-texture"
                    style={{ opacity: 0.08 }}
                  ></div>
                </div>
                
                <div className="absolute top-0 right-0 w-40 h-40 opacity-25" style={{ filter: 'blur(30px)', background: character.accentColor, borderRadius: '50%' }}></div>
                <div className="absolute bottom-0 left-0 w-40 h-40 opacity-25" style={{ filter: 'blur(30px)', background: character.accentColor, borderRadius: '50%' }}></div>
                
                {/* Watermarks */}
                <div className="absolute top-1/4 left-1/4 text-6xl opacity-10 character-watermark" style={{ color: character.accentColor }}>
                  {character.badge}
                </div>
                <div className="absolute bottom-1/4 right-1/4 text-6xl opacity-10 character-watermark" style={{ color: character.accentColor }}>
                  {character.badge}
                </div>
                <div className="absolute inset-0 flex justify-center items-center">
                  <div className="text-8xl opacity-10 character-watermark rotate-12" style={{ color: character.accentColor }}>
                    {character.id.substring(0,1).toUpperCase()}
                  </div>
                </div>
                <div className="absolute inset-0 large-watermark" style={{ 
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='40' fill='none' stroke='${encodeURIComponent(character.accentColor || '#ffffff')}' stroke-width='1' stroke-dasharray='5,5' /%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'center',
                  backgroundSize: '70%',
                  opacity: 0.15
                }}></div>
                
                {/* Microscopic text decoration */}
                <div className="absolute bottom-8 left-0 right-0 microtext" style={{ color: `${character.accentColor}aa` }}>
                  {Array(80).fill(character.id.toUpperCase()).join(' ')}
                </div>
              </>
            )}
            
            {/* Main grid container */}
            <div className="grid grid-cols-7 h-full">
              {/* Left panel - Character info */}
              <div className="col-span-2 py-2 px-3 flex flex-col h-full relative z-10">
                {character.unlocked ? (
                  <>
                    <div>
                      <div className="mb-0.5 character-name-badge" style={{ color: character.secondaryColor }}>
                        {character.badge}
                      </div>
                      <PixelText 
                        className="text-xl text-white mb-0.5"
                      >
                        {character.name}
                      </PixelText>
                      <PixelText className="text-white/80 text-sm mb-2">
                        {character.title}
                      </PixelText>
                      
                      <div className="mb-2">
                        <PixelText className="text-sm text-white mb-0.5 flex items-center">
                          <span className="inline-block w-2 h-2 bg-white mr-1 pulse-slow"></span>
                          Relationship
                        </PixelText>
                        <div className="relationship-gauge">
                          {[...Array(5)].map((_, i) => (
                            <div 
                              key={i}
                              className="relationship-segment"
                              style={{
                                backgroundColor: i < getRelationshipLevel(character.id) 
                                  ? character.accentColor 
                                  : 'rgba(255,255,255,0.2)',
                                borderColor: i < getRelationshipLevel(character.id)
                                  ? 'rgba(255,255,255,0.5)'
                                  : 'rgba(255,255,255,0.1)'
                              }}
                            ></div>
                          ))}
                        </div>
                        <div className="text-white/70 text-xs mt-0.5 text-right">
                          <PixelText>Level {getRelationshipLevel(character.id)}/5</PixelText>
                        </div>
                      </div>
                    </div>
                    
                    <div className="character-description-box py-1 px-2" style={{ backgroundColor: character.secondaryColor, borderLeft: `3px solid ${character.accentColor}` }}>
                      <PixelText className="text-sm text-white/95 leading-tight">
                        {character.description}
                      </PixelText>
                    </div>
                    
                    {/* Additional details section */}
                    <div className="character-details mt-2">
                      <div className="flex justify-between text-xs text-white/80">
                        <PixelText>Clearance:</PixelText>
                        <PixelText className={`text-[${character.accentColor}]`}>Level 3</PixelText>
                      </div>
                      <div className="flex justify-between text-xs text-white/80">
                        <PixelText>Status:</PixelText>
                        <PixelText className="status-active">Active</PixelText>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="h-full flex flex-col justify-center items-center">
                    <div className="locked-symbol text-4xl">?</div>
                    <PixelText className="text-white/70 text-xs mt-1.5">Unidentified</PixelText>
                    <PixelText className="text-white/50 text-xs mt-0.5 locked-text">Not yet encountered</PixelText>
                  </div>
                )}
              </div>
              
              {/* Center panel - Character portrait */}
              <div className="col-span-3 relative central-portrait">
                {character.unlocked ? (
                  <>
                    <div className="absolute inset-0 flex items-end justify-center z-10 portrait-container">
                      <div className="portrait-frame">
                        <Image 
                          src={character.imageSrc}
                          alt={character.name}
                          width={600}
                          height={600}
                          className="portrait-image"
                          style={{
                            objectFit: 'contain',
                            objectPosition: 'bottom'
                          }}
                        />
                      </div>
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center character-seal" 
                      style={{ border: `1px dashed ${character.secondaryColor}` }}>
                    </div>
                    <div className="absolute inset-x-0 top-0 h-6 central-ribbon" style={{ backgroundColor: character.secondaryColor }}></div>
                    <div className="absolute inset-x-0 bottom-0 h-6 central-ribbon" style={{ backgroundColor: character.secondaryColor }}></div>
                    
                    {/* Portrait accents */}
                    <div className="absolute top-12 left-0 w-full pointer-events-none">
                      <div className="scan-line"></div>
                    </div>
                    <div className="absolute top-1/2 left-0 right-0 flex justify-center">
                      <div className="targeting-reticle" style={{ borderColor: character.accentColor, borderWidth: "1.5px" }}></div>
                    </div>
                  </>
                ) : (
                  <div className="absolute inset-0 flex items-end justify-center">
                    <div className="flex items-center justify-center silhouette-container">
                      <div className="w-full h-full absolute black-silhouette"></div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Right panel - Notes */}
              <div className="col-span-2 py-1.5 px-3 flex flex-col justify-between h-full relative z-10">
                {character.unlocked ? (
                  <>
                    <div>
                      <div className="flex justify-between items-center mb-0.5">
                        <PixelText className="text-sm text-white">Notes</PixelText>
                        <button 
                          className="edit-note-btn"
                          style={{ background: character.secondaryColor }}
                          onClick={() => editingNotes[character.id] !== undefined 
                            ? handleSaveNotes(character.id) 
                            : handleEditClick(character.id, getCharacterNotes(character.id))}
                        >
                          {editingNotes[character.id] !== undefined ? 'Save' : 'Edit'}
                        </button>
                      </div>
                      
                      {editingNotes[character.id] !== undefined ? (
                        <div className="note-area" style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}>
                          <textarea
                            className="note-textarea"
                            value={editingNotes[character.id]}
                            onChange={(e) => handleNoteChange(character.id, e)}
                            placeholder="Add observations..."
                            onClick={stopPropagation}
                            style={{ borderColor: character.secondaryColor }}
                          />
                          <button 
                            className="cancel-btn"
                            onClick={() => handleCancelEdit(character.id)}
                            style={{ color: character.accentColor }}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="note-display" style={{ 
                          backgroundColor: 'rgba(0,0,0,0.4)', 
                          backgroundImage: `linear-gradient(135deg, transparent 15px, rgba(0,0,0,0.15) 15px, rgba(0,0,0,0.15) 20px, transparent 20px)`,
                          backgroundSize: '30px 30px',
                          backgroundRepeat: 'no-repeat',
                          backgroundPosition: 'top right'
                        }}>
                          <PixelText className="text-sm text-white/95">
                            {getCharacterNotes(character.id) || 
                              <span className="text-white/60 italic">No notes recorded</span>
                            }
                          </PixelText>
                        </div>
                      )}
                    </div>
                    
                    <div className="interaction-info" style={{ 
                      backgroundColor: character.secondaryColor,
                      backgroundImage: `linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.15) 50%, transparent 100%)`
                    }}>
                      <div className="text-xs text-white/95 flex items-center">
                        <span className="inline-block w-1 h-1 bg-white mr-1 blink"></span>
                        <PixelText>Last: {getLastInteraction(character.id)}</PixelText>
                      </div>
                    </div>
                    
                    {/* Binary signature data */}
                    <div className="binary-signature text-xxs mt-1 text-right" style={{ color: character.accentColor, opacity: 0.8 }}>
                      <PixelText>01010011 01001001 01000111</PixelText>
                    </div>
                  </>
                ) : (
                  <div className="h-full flex flex-col justify-center items-center">
                    <div className="encrypted-data"></div>
                    <PixelText className="text-white/70 text-xs mt-1.5">Data Encrypted</PixelText>
                  </div>
                )}
              </div>
            </div>
            
            {/* Border frame */}
            {character.unlocked && (
              <>
                <div className="absolute inset-0 border-frame" style={{ borderColor: character.secondaryColor }}></div>
                
                {/* Corner decorations */}
                <div className="absolute top-0 left-0 w-3 h-3 corner-decoration" style={{ borderTop: `2px solid ${character.accentColor}`, borderLeft: `2px solid ${character.accentColor}` }}></div>
                <div className="absolute top-0 right-0 w-3 h-3 corner-decoration" style={{ borderTop: `2px solid ${character.accentColor}`, borderRight: `2px solid ${character.accentColor}` }}></div>
                <div className="absolute bottom-0 left-0 w-3 h-3 corner-decoration" style={{ borderBottom: `2px solid ${character.accentColor}`, borderLeft: `2px solid ${character.accentColor}` }}></div>
                <div className="absolute bottom-0 right-0 w-3 h-3 corner-decoration" style={{ borderBottom: `2px solid ${character.accentColor}`, borderRight: `2px solid ${character.accentColor}` }}></div>
                
                {/* Edge accents */}
                <div className="absolute top-4 left-0 w-1 h-8" style={{ backgroundColor: character.accentColor, opacity: 0.5 }}></div>
                <div className="absolute bottom-4 right-0 w-1 h-8" style={{ backgroundColor: character.accentColor, opacity: 0.5 }}></div>
              </>
            )}
            
            {/* Security elements */}
            {character.unlocked && (
              <>
                <div className="absolute top-0.5 left-1 security-element" style={{ color: character.secondaryColor }}>
                  <PixelText className="text-xxs">//SEC-{Math.random().toString(36).substring(2, 6).toUpperCase()}</PixelText>
                </div>
                <div className="absolute bottom-0.5 right-1 security-element" style={{ color: character.secondaryColor }}>
                  <PixelText className="text-xxs">ID:{character.id.substring(0,1).toUpperCase()}{Math.random().toString(36).substring(2, 5).toUpperCase()}</PixelText>
                </div>
                
                {/* Additional security markings */}
                <div className="absolute bottom-0.5 left-10 security-barcode" style={{ color: character.secondaryColor, opacity: 0.5 }}>
                  <PixelText className="text-xxs">|||||||||||||||</PixelText>
                </div>
                <div className="absolute top-0.5 right-6 security-marking" style={{ color: character.secondaryColor, opacity: 0.5 }}>
                  <PixelText className="text-xxs">••••</PixelText>
                </div>
                
                {/* Fingerprint */}
                <div className="absolute bottom-10 left-3 fingerprint-mark" style={{ opacity: 0.2 }}>
                  <div className="inner-print" style={{ borderColor: character.secondaryColor }}></div>
                </div>
              </>
            )}
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
        
        .black-silhouette {
          background-color: black;
          box-shadow: 0 0 0 5px black;
          mask-image: url('/characters/silhouette.svg');
          mask-size: 80%;
          mask-repeat: no-repeat;
          mask-position: center;
        }
        
        /* Fallback if SVG isn't available */
        @supports not (mask-image: url('/characters/silhouette.svg')) {
          .black-silhouette:after {
            content: '???';
            color: white;
            font-size: 2rem;
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
          }
        }
        
        .abstract-card {
          border-radius: 2px;
          transition: all 0.3s ease;
          transform: perspective(1000px) rotateX(0);
          position: relative;
          box-shadow: 0 3px 10px rgba(0, 0, 0, 0.2);
        }
        
        .abstract-card:hover {
          transform: perspective(1000px) rotateX(3deg);
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
        }
        
        .abstract-card:hover .character-seal {
          animation-duration: 40s;
        }
        
        .abstract-card:hover .portrait-image {
          transform: scale(2.55);
        }
        
        .central-portrait {
          overflow: hidden;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .portrait-container {
          height: 100%;
          width: 100%;
        }
        
        .portrait-frame {
          height: 100%;
          width: 100%;
          overflow: visible;
          position: relative;
          display: flex;
          align-items: flex-end;
          justify-content: center;
          margin-bottom: -6px; /* Adjusted to align with bottom edge */
        }
        
        .portrait-image {
          height: auto;
          max-width: 250%;
          transform: scale(2.5);
          transform-origin: bottom center;
        }
        
        .silhouette-container {
          width: 100%;
          height: 75%;
          background: black;
          position: relative;
          margin-bottom: -6px;
        }
        
        .character-seal {
          width: 250px;
          height: 250px;
          border-radius: 50%;
          animation: rotate 60s linear infinite;
          pointer-events: none;
          border-width: 1.5px;
        }
        
        .central-ribbon {
          opacity: 0.75;
          position: relative;
          overflow: hidden;
        }
        
        .central-ribbon:after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-image: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%);
        }
        
        .relationship-gauge {
          display: flex;
          gap: 2px;
        }
        
        .relationship-segment {
          flex: 1;
          height: 10px;
          border: 1px solid;
          position: relative;
        }
        
        .relationship-segment:after {
          content: '';
          position: absolute;
          top: 1px;
          left: 1px;
          right: 1px;
          height: 2px;
          background: rgba(255, 255, 255, 0.2);
          opacity: 0.7;
        }
        
        .character-name-badge {
          font-size: 1.4rem;
          line-height: 1.1;
        }
        
        .character-description-box {
          border-radius: 2px;
          max-height: 40px;
          overflow: hidden;
          position: relative;
        }
        
        .character-description-box:after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 8px;
          background: linear-gradient(to top, rgba(0,0,0,0.3), transparent);
          pointer-events: none;
        }
        
        .note-area {
          border-radius: 2px;
          padding: 1px;
          min-height: 75px;
        }
        
        .note-textarea {
          width: 100%;
          height: 62px;
          background: rgba(0,0,0,0.3);
          border: 1px solid;
          color: white;
          padding: 4px;
          font-size: 0.75rem;
          resize: none;
          font-family: 'VT323', monospace;
        }
        
        .note-display {
          border-radius: 2px;
          padding: 4px;
          min-height: 75px;
          max-height: 75px;
          overflow: hidden;
          position: relative;
        }
        
        .note-display:after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 8px;
          background: linear-gradient(to top, rgba(0,0,0,0.4), transparent);
          pointer-events: none;
        }
        
        .edit-note-btn {
          padding: 0px 5px;
          font-size: 0.7rem;
          color: white;
          border: none;
          cursor: pointer;
          font-family: 'VT323', monospace;
          line-height: 1.3;
          position: relative;
          overflow: hidden;
        }
        
        .edit-note-btn:after {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
          animation: shine 2s infinite;
        }
        
        @keyframes shine {
          0% { left: -100%; }
          20% { left: 100%; }
          100% { left: 100%; }
        }
        
        .cancel-btn {
          padding: 0px 5px;
          font-size: 0.7rem;
          background: transparent;
          border: none;
          cursor: pointer;
          font-family: 'VT323', monospace;
          margin-top: 2px;
          text-align: right;
          display: block;
          margin-left: auto;
        }
        
        .interaction-info {
          padding: 3px 5px;
          border-radius: 2px;
          font-size: 0.7rem;
        }
        
        .locked-symbol {
          font-size: 3.5rem;
          font-weight: bold;
          color: rgba(255,255,255,0.3);
        }
        
        .security-element {
          font-family: monospace;
          font-size: 0.58rem;
          opacity: 0.5;
        }
        
        .security-barcode {
          font-family: 'Courier New', monospace;
          font-size: 0.5rem;
          letter-spacing: -1px;
        }
        
        .security-marking {
          font-family: 'Courier New', monospace;
          font-size: 0.5rem;
          letter-spacing: 1px;
        }
        
        .encrypted-data {
          width: 100px;
          height: 60px;
          background-image: 
            repeating-linear-gradient(0deg, rgba(255,255,255,0.1) 0px, rgba(255,255,255,0.1) 1px, transparent 1px, transparent 5px);
          position: relative;
          overflow: hidden;
        }
        
        .encrypted-data:after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-image: 
            repeating-linear-gradient(90deg, rgba(255,255,255,0.1) 0px, rgba(255,255,255,0.1) 1px, transparent 1px, transparent 5px);
        }
        
        .noise-texture {
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
          width: 100%;
          height: 100%;
        }
        
        .character-watermark {
          transform: rotate(-30deg);
          font-family: sans-serif;
          user-select: none;
        }
        
        .large-watermark {
          animation: slow-pulse 8s infinite ease-in-out;
        }
        
        @keyframes slow-pulse {
          0%, 100% { opacity: 0.12; }
          50% { opacity: 0.18; }
        }
        
        .glitch-text {
          position: relative;
        }
        
        .glitch-text:after {
          content: 'Character Files';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          clip-path: inset(50% 0 0 0);
          background: rgba(var(--primary-rgb), 0.5);
          mix-blend-mode: overlay;
          transform: translateX(-2px);
          opacity: 0.1;
        }
        
        .pulse-slow {
          animation: pulse-slow 4s infinite;
        }
        
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.7; }
          50% { opacity: 1; }
        }
        
        @keyframes rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        .locked-text {
          max-width: 150px;
          text-align: center;
          position: relative;
          overflow: hidden;
        }
        
        .locked-text:before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
          animation: scan-locked 2s infinite;
        }
        
        @keyframes scan-locked {
          0% { left: -100%; }
          100% { left: 100%; }
        }
        
        .blink {
          animation: blink 2s infinite;
        }
        
        @keyframes blink {
          0%, 100% { opacity: 0; }
          50% { opacity: 1; }
        }
        
        .hologram-text {
          position: relative;
          color: rgba(255,255,255,0.6);
          font-family: monospace;
          text-shadow: 0 0 2px rgba(255,255,255,0.3);
          transform: rotate(-15deg);
          animation: hologram-flicker 5s infinite;
        }
        
        .microtext {
          font-size: 3px;
          opacity: 0.3;
          white-space: nowrap;
          overflow: hidden;
          font-family: monospace;
          transform: scale(0.8);
          transform-origin: center;
        }
        
        .scan-line {
          width: 100%;
          height: 2px;
          background: rgba(255, 255, 255, 0.15);
          animation: scan-down 4s linear infinite;
        }
        
        .reticle-overlay {
          border: 1px dashed;
          border-radius: 50%;
          animation: reticle-pulse 3s infinite;
        }
        
        .hologram-circle {
          position: absolute;
          width: 100%;
          height: 100%;
          border: 1px solid;
          border-radius: 50%;
          animation: hologram-rotate 8s linear infinite;
        }
        
        .character-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 1.2rem;
          margin-top: 1rem;
        }
        
        .character-card {
          position: relative;
          border-radius: 0.5rem;
          height: 240px;
          overflow: hidden;
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08);
          transition: all 0.3s ease;
          cursor: pointer;
        }
        
        .targeting-reticle {
          position: absolute;
          width: 70px;
          height: 70px;
          border-radius: 50%;
          border: 1px dashed;
          opacity: 0.7;
        }
      `}</style>
    </div>
  );
}