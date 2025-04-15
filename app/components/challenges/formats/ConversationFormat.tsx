// app/components/challenges/formats/ConversationFormat.tsx
'use client';
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../../store/gameStore';
import { useResourceStore, StrategicActionType } from '../../../store/resourceStore';
import { useDialogueFlow, DialogueStage, DialogueOptionView } from '../../../hooks/useDialogueFlow';
import { useTypewriter } from '../../../hooks/useTypewriter';
import { PixelButton, PixelText, PixelBox } from '../../PixelThemeProvider';
import { safeDispatch } from '../../../core/events/CentralEventBus';
import { GameEventType } from '../../../core/events/EventTypes';
import InsightMeter from '../../gameplay/InsightMeter';
import MomentumCounter from '../../gameplay/MomentumCounter';
import { StrategicActionsContainer } from '../../gameplay/StrategicActions';
import { applyStrategicAction, enhanceDialogueOptions } from '../../../core/dialogue/ActionIntegration';
import { usePrimitiveStoreValue, useStableStoreValue } from '../../../core/utils/storeHooks';
import { NodeType } from '../../../types/game';
import { getCharacterData } from '../../../data/characters';

// Import the kapoor dialogue content
import kapoorCalibrationDialogue from '../../../data/dialogues/calibrations/kapoor-calibration';

// ===== TYPES =====

// Result type for completion callback
export interface InteractionResults {
  insightGained: number;
  relationshipChange: number;
  knowledgeGained: Record<string, number>;
  journalTier?: 'base' | 'technical' | 'annotated';
  actionsUsed?: StrategicActionType[];
}

// Character metadata
interface CharacterData {
  name: string;
  title: string;
  sprite: string;
  primaryColor: string;
  textClass: string;
  bgClass: string;
}

// Component props
interface ConversationFormatProps {
  character?: string;
  characterId?: string; // Alternative prop name
  nodeId?: string;
  dialogueStages?: DialogueStage[];
  dialogueId?: string;
  onComplete?: (results: InteractionResults) => void;
  onOptionSelected?: (option: DialogueOptionView, stageId: string) => void;
  onStageChange?: (newStageId: string, prevStageId: string) => void;
  stateMachineEnabled?: boolean;
}

/**
 * ConversationFormat - Optimized with Chamber Pattern
 * 
 * This component applies the Chamber Transition Pattern:
 * 1. Uses primitive values instead of objects for rendering
 * 2. Ensures stable function references
 * 3. Decouples animations from state updates
 * 4. Makes state updates atomically
 */
function ConversationFormat({
  character,
  characterId,
  nodeId,
  dialogueStages,
  dialogueId,
  onComplete,
  onOptionSelected,
  onStageChange,
  stateMachineEnabled = false
}: ConversationFormatProps) {
  // Normalize character ID (support both property names for flexibility)
  const normalizedCharacterId = characterId || character || '';
  
  // Get game state
  const gameStore = useGameStore();
  const currentNodeId = usePrimitiveStoreValue(
    useGameStore,
    (state: any) => state.currentNodeId,
    null
  );
  const storeNodeId = nodeId || currentNodeId;
  
  // Get resource store for insight and momentum
  const { updateInsight, incrementMomentum, resetMomentum } = useResourceStore();
  
  // ===== REFS =====
  // Track component mount state
  const isMountedRef = useRef(true);
  // Animation container refs
  const characterRef = useRef<HTMLDivElement>(null);
  const dialogueContainerRef = useRef<HTMLDivElement>(null);
  const optionsContainerRef = useRef<HTMLDivElement>(null);
  
  // ===== LOCAL STATE =====
  // State for dialogue flow
  const [currentStageId, setCurrentStageId] = useState<string>('intro');
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null);
  const [showResponse, setShowResponse] = useState(false);
  const [responseText, setResponseText] = useState<string>('');
  const [results, setResults] = useState<InteractionResults>({
    insightGained: 0,
    relationshipChange: 0,
    knowledgeGained: {},
  });
  
  // Use the proper dialogue content from imported file
  const dialogueContent = useMemo(() => {
    // For now we're just using kapoor dialogue, but this could be expanded to use dialogueStages prop
    // or select different dialogues based on character/nodeId
    return kapoorCalibrationDialogue;
  }, []);
  
  // Get current dialogue stage
  const currentStage = useMemo(() => {
    return dialogueContent.find(stage => stage.id === currentStageId) || dialogueContent[0];
  }, [dialogueContent, currentStageId]);
  
  // Character data
  const charData = useMemo<CharacterData>(() => {
    return getCharacterData(normalizedCharacterId);
  }, [normalizedCharacterId]);
  
  // ===== HANDLERS =====
  // Handle option selection
  const handleOptionClick = useCallback((optionIndex: number) => {
    if (!currentStage || !currentStage.options || selectedOptionIndex !== null) return;
    
    const selectedOption = currentStage.options[optionIndex];
    if (!selectedOption) return;
    
    setSelectedOptionIndex(optionIndex);
    setShowResponse(true);
    
    // Show response text if available
    if (selectedOption.responseText) {
      setResponseText(selectedOption.responseText);
    }
    
    // Track insight/relationship changes
    let insightGained = selectedOption.insightGain || 0;
    let relationshipChange = selectedOption.relationshipChange || 0;
    
    // Update insight
    if (insightGained > 0) {
      updateInsight(insightGained);
      setResults(prev => ({
        ...prev,
        insightGained: prev.insightGained + insightGained
      }));
    }
    
    // Track momentum for correct answers
    if (selectedOption.isCriticalPath) {
      incrementMomentum();
    }
    
    // Track knowledge gain
    if (selectedOption.knowledgeGain) {
      setResults(prev => ({
        ...prev,
        knowledgeGained: {
          ...prev.knowledgeGained,
          [selectedOption.knowledgeGain?.conceptId || 'unknown']: 
            (prev.knowledgeGained[selectedOption.knowledgeGain?.conceptId || 'unknown'] || 0) + 
            (selectedOption.knowledgeGain?.amount || 0)
        }
      }));
    }
    
    // Handle callbacks
    if (onOptionSelected) {
      onOptionSelected(selectedOption, currentStage.id);
    }
    
    // Move to next stage after delay
    setTimeout(() => {
      if (selectedOption.nextStageId) {
        // Special case for pre-journal-presentation
        if (selectedOption.nextStageId === 'pre-journal-presentation') {
          console.log('[ConversationFormat] Pre-journal stage selected, will transition to journal-presentation');
          
          // First move to the pre-journal stage
          setCurrentStageId('pre-journal-presentation');
          
          // After a delay, move to journal-presentation
          setTimeout(() => {
            if (isMountedRef.current) {
              console.log('[ConversationFormat] Now transitioning from pre-journal to journal-presentation');
              setCurrentStageId('journal-presentation');
            }
          }, 3000);
          
          setShowResponse(false);
          setResponseText('');
          setSelectedOptionIndex(null);
          return;
        }
        
        // Direct jump to journal presentation - special case
        if (selectedOption.nextStageId === 'journal-presentation') {
          console.log('[ConversationFormat] Direct jump to journal presentation detected');
          // Update the results to include journal tier
          setResults(prev => ({
            ...prev,
            journalTier: 'technical'
          }));
          
          // Special handling for journal acquisition
          console.log('[ConversationFormat] Triggering journal acquisition');
          const characterForDispatch = normalizedCharacterId || 'kapoor';
          console.log(`[ConversationFormat] Using character ID for journal acquisition: ${characterForDispatch}`);
          
          safeDispatch(GameEventType.NODE_COMPLETED, {
            nodeId: storeNodeId,
            character: characterForDispatch,
            result: {
              isJournalAcquisition: true,
              journalTier: 'technical',
              relationshipChange: 0
            }
          });
          
          // Direct dispatch of journal acquired event to trigger animation
          safeDispatch(GameEventType.JOURNAL_ACQUIRED, {
            tier: 'technical',
            character: characterForDispatch,
            source: 'dialogue_completion',
            nodeId: storeNodeId
          });
          console.log('[ConversationFormat] Directly dispatched JOURNAL_ACQUIRED event');
          
          // Transition to the journal presentation stage
          setCurrentStageId('journal-presentation');
          
          // Call onComplete with updated results
          if (onComplete) {
            onComplete({
              ...results,
              journalTier: 'technical'
            });
          }
          
          setShowResponse(false);
          setResponseText('');
          setSelectedOptionIndex(null);
          return;
        }
        
        // Check if this is a conclusion (end of dialogue)
        const nextStage = dialogueContent.find(stage => stage.id === selectedOption.nextStageId);
        
        if (nextStage && nextStage.isConclusion) {
          // Special handling for journal acquisition
          if (nextStage.id === 'journal-presentation') {
            console.log('[ConversationFormat] Journal presentation node reached, triggering journal acquisition');
            // Use 'kapoor' as fallback if normalized character ID is empty
            const characterForDispatch = normalizedCharacterId || 'kapoor';
            console.log(`[ConversationFormat] Using character ID for journal acquisition: ${characterForDispatch}`);
            
            safeDispatch(GameEventType.NODE_COMPLETED, {
              nodeId: storeNodeId,
              character: characterForDispatch,
              result: {
                isJournalAcquisition: true,
                journalTier: 'technical',
                relationshipChange: 0
              }
            });
            
            // Direct dispatch of journal acquired event to trigger animation
            safeDispatch(GameEventType.JOURNAL_ACQUIRED, {
              tier: 'technical',
              character: characterForDispatch,
              source: 'dialogue_completion',
              nodeId: storeNodeId
            });
            console.log('[ConversationFormat] Directly dispatched JOURNAL_ACQUIRED event from conclusion path');
            
            setResults(prev => ({
              ...prev,
              journalTier: 'technical'
            }));
          }
          
          // Complete node and call onComplete
          if (gameStore.completeNode && storeNodeId) {
            gameStore.completeNode(storeNodeId);
          }
          
          if (onComplete) {
            onComplete(results);
          }
        } else {
          // Move to next stage
          setCurrentStageId(selectedOption.nextStageId);
          if (onStageChange) {
            onStageChange(selectedOption.nextStageId, currentStage.id);
          }
        }
      }
      
      setShowResponse(false);
      setResponseText('');
      setSelectedOptionIndex(null);
    }, 1500);
  }, [currentStage, selectedOptionIndex, updateInsight, incrementMomentum, gameStore, 
      storeNodeId, onComplete, results, onOptionSelected, onStageChange, dialogueContent]);
  
  // Handle special stages that need automatic transitions
  useEffect(() => {
    // Handle pre-journal stage to journal stage transition
    if (currentStageId === 'pre-journal-presentation' && !selectedOptionIndex) {
      console.log('[ConversationFormat] Pre-journal stage detected in special stages effect');
      
      // Add a delay before transitioning to journal-presentation
      const timer = setTimeout(() => {
        if (isMountedRef.current) {
          console.log('[ConversationFormat] Auto-transitioning from pre-journal to journal-presentation');
          setCurrentStageId('journal-presentation');
        }
      }, 4000);
      
      return () => clearTimeout(timer);
    }
  }, [currentStageId, selectedOptionIndex]);
  
  // Direct journal acquisition when journal-presentation stage is reached
  useEffect(() => {
    if (currentStageId === 'journal-presentation' && !results.journalTier) {
      console.log('[ConversationFormat] Journal presentation stage reached, ensuring acquisition is triggered');
      
      // Update results to include journal tier
      setResults(prev => ({
        ...prev,
        journalTier: 'technical'
      }));
      
      // Directly dispatch events to ensure acquisition flow
      const characterForDispatch = normalizedCharacterId || 'kapoor';
      
      // Always use store nodeId if available, fallback to provided nodeId
      const nodeIdForDispatch = storeNodeId || nodeId || 'start';
      console.log(`[ConversationFormat] Using nodeId for completion: ${nodeIdForDispatch}`);
      
      // Explicitly mark the node as completed both ways
      try {
        const gameStore = useGameStore.getState();
        if (gameStore && gameStore.completeNode) {
          gameStore.completeNode(nodeIdForDispatch);
          console.log(`[ConversationFormat] ✅ Explicitly marked node ${nodeIdForDispatch} as completed via gameStore`);
        }
        
        // Also directly mark in state machine for redundancy
        if (typeof window !== 'undefined' && window.__GAME_STATE_MACHINE_DEBUG__?.getCurrentState) {
          window.__GAME_STATE_MACHINE_DEBUG__.getCurrentState().markNodeCompleted(nodeIdForDispatch);
          console.log(`[ConversationFormat] ✅ Explicitly marked node ${nodeIdForDispatch} as completed in state machine`);
        }
      } catch (err) {
        console.error('[ConversationFormat] Error marking node as completed:', err);
      }
      
      safeDispatch(GameEventType.NODE_COMPLETED, {
        nodeId: nodeIdForDispatch,
        character: characterForDispatch,
        result: {
          isJournalAcquisition: true,
          journalTier: 'technical',
          relationshipChange: 0
        }
      });
      
      safeDispatch(GameEventType.JOURNAL_ACQUIRED, {
        tier: 'technical',
        character: characterForDispatch,
        source: 'stage_reached',
        nodeId: nodeIdForDispatch
      });
      console.log('[ConversationFormat] Journal presentation stage: Directly dispatched events');
      
      // If there's an onComplete callback, call it
      if (onComplete) {
        onComplete({
          ...results,
          journalTier: 'technical'
        });
      }
      
      // Return to map after a delay
      setTimeout(() => {
        if (gameStore && gameStore.setCurrentNode) {
          console.log('[ConversationFormat] Returning to map after journal acquisition');
          gameStore.setCurrentNode(null);
        }
      }, 5000); // Use 5 seconds to allow animations to complete
    }
  }, [currentStageId, results.journalTier, normalizedCharacterId, storeNodeId, nodeId, onComplete, results, gameStore]);
  
  // ===== COMPONENT LIFECYCLE =====
  
  // Handle component mount/unmount
  useEffect(() => {
    isMountedRef.current = true;
    
    console.log(`[ConversationFormat] Component mounted. Dialogue content length: ${dialogueContent?.length || 0}`);
    console.log(`[ConversationFormat] Current stage ID: ${currentStageId}, Character ID: ${normalizedCharacterId}`);
    
    if (currentStage) {
      console.log(`[ConversationFormat] Current stage: ${currentStage.id}`, currentStage);
    } else {
      console.error('[ConversationFormat] No current stage found!');
    }
    
    if (!dialogueContent || dialogueContent.length === 0) {
      console.error('[ConversationFormat] No dialogue content loaded!');
    }
    
    // Check if we received the expected props
    console.log(`[ConversationFormat] nodeId: ${storeNodeId}, character: ${normalizedCharacterId}`);
    
    // Check if the character data is loaded correctly
    console.log(`[ConversationFormat] Character data:`, charData);
    
    // Debug props and character ID issue
    console.log(`[ConversationFormat] DEBUG: Props received - nodeId=${nodeId}, character=${character}, characterId=${characterId}`);
    
    // Check if character is properly set in game store
    try {
      const gameStoreState = useGameStore.getState();
      const currentCharFromStore = gameStoreState.currentCharacterId;
      console.log(`[ConversationFormat] DEBUG: Current character from store: ${currentCharFromStore}`);
    } catch (err) {
      console.error('[ConversationFormat] Failed to access game store:', err);
    }
    
    return () => {
      isMountedRef.current = false;
      console.log('[ConversationFormat] Component unmounted');
    };
  }, []);
  
  // ===== RENDER =====
  
  // Render the conversation UI
  return (
    <div className="relative w-full h-full flex flex-col">
      {/* Deep space background with subtle grid */}
      <div className="absolute inset-0 bg-[#080d17] z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(20,30,60,0.3)_0%,rgba(8,13,23,0.95)_70%)]">
          {/* Subtle grid with depth */}
          <div 
            className="absolute inset-0 opacity-8" 
            style={{ 
              backgroundImage: 'linear-gradient(to right, rgba(59,130,246,0.07) 1px, transparent 1px), linear-gradient(to bottom, rgba(59,130,246,0.05) 1px, transparent 1px)',
              backgroundSize: '40px 40px',
              transform: 'perspective(1000px) rotateX(5deg)',
              transformOrigin: 'center top' 
            }}
          />
        </div>
      </div>
      
      {/* Minimal ambient particles */}
      <div className="absolute inset-0 overflow-hidden z-10 pointer-events-none">
        {Array.from({ length: 15 }).map((_, i) => {
          const size = 0.7 + Math.random() * 1.3;
          return (
            <div 
              key={i}
              className="absolute rounded-full animate-pulse-slow"
              style={{ 
                top: `${Math.random() * 100}%`, 
                left: `${Math.random() * 100}%`,
                width: `${size}px`,
                height: `${size}px`,
                backgroundColor: i % 3 === 0 ? 'rgba(59,130,246,0.2)' : 'rgba(96,165,250,0.15)',
                animationDuration: `${4 + Math.random() * 5}s`,
                animationDelay: `${Math.random() * 2}s`
              }}
            />
          );
        })}
      </div>

      {/* Clean two-column layout */}
      <div className="w-full h-full flex z-10">
        {/* Left panel - character area */}
        <div className="w-[28%] py-8 px-6 flex flex-col">
          {/* Character container */}
          <div className="relative mb-3">
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="bg-[#0f1623]/80 rounded-md overflow-hidden border border-[#243455] pixel-borders"
            >
              {/* Character portrait */}
              <div className="aspect-square w-full flex items-center justify-center overflow-hidden p-3">
                <img
                  src={charData.sprite}
                  alt={charData.name}
                  className="w-full h-full object-contain pixelated"
                  style={{ 
                    imageRendering: 'pixelated'
                  }}
                />
              </div>
            </motion.div>
            
            {/* Character name label - positioned below portrait */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mt-2 bg-[#1e3a5f] rounded-sm p-2"
            >
              <div className="flex items-center">
                <div className="w-2 h-2 rounded-full bg-blue-400 mr-2"></div>
                <h3 className={`text-lg font-pixel text-blue-200`}>Dr. Kapoor</h3>
              </div>
              <p className="text-xs text-gray-400 font-pixel">Chief Medical Physicist</p>
            </motion.div>
          </div>
          
          {/* LINAC Information Panel */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-4 bg-[#0f1623]/80 border border-[#243455] rounded-sm p-3"
          >
            <h4 className="text-sm text-blue-300 font-pixel mb-1">Linear Accelerator</h4>
            <p className="text-xs text-gray-300">LINAC 2, the Varian TrueBeam used primarily for head and neck treatments.</p>
          </motion.div>
          
          {/* Insight & Momentum UI at bottom */}
          <div className="mt-auto">
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="space-y-4"
            >
              <InsightMeter />
              <MomentumCounter />
            </motion.div>
          </div>
        </div>
        
        {/* Main content area - conversation */}
        <div className="flex-1 h-full flex flex-col justify-center p-8">
          {/* Top context caption - subtle blue accent */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.9 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="self-end mb-8 px-4 py-3 bg-black/25 border-l border-blue-500/40 rounded-sm max-w-lg"
          >
            <p className="text-sm text-blue-300/90 font-pixel italic">
              Kapoor adjusts the ionization chamber position with methodical precision, not looking up as you enter.
            </p>
          </motion.div>
          
          {/* Main dialogue section */}
          <div className="flex-1 flex flex-col">
            {/* Primary dialogue box */}
            <motion.div
              ref={dialogueContainerRef}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="w-full max-w-3xl mx-auto mb-4"
            >
              <div className="bg-black/90 border border-[#243455] rounded-sm overflow-hidden">
                {/* Main dialogue text */}
                <div className="p-6">
                  <p className="text-lg font-pixel text-white leading-relaxed">
                    {showResponse && responseText ? responseText : currentStage.text}
                  </p>
                </div>

                {/* Response options with clean styling */}
                {!showResponse && currentStage.options && (
                  <div 
                    ref={optionsContainerRef}
                    className="p-4 border-t border-[#243455] space-y-3 bg-black/70"
                  >
                    {currentStage.options.map((option, index) => (
                      <motion.button
                        key={index}
                        initial={{ opacity: 0, x: -5 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 + index * 0.1 }}
                        onClick={() => handleOptionClick(index)}
                        disabled={selectedOptionIndex !== null}
                        className={`
                          w-full text-left p-3 
                          font-pixel text-sm leading-relaxed
                          ${selectedOptionIndex === index 
                            ? 'bg-blue-900/50 text-white border-l-4 border-blue-400' 
                            : 'bg-black/60 text-gray-300 hover:bg-[#162642]/80 hover:text-white border-l-4 border-transparent hover:border-blue-500/50'}
                          transition-all duration-200
                          flex items-start group
                        `}
                      >
                        <span className="mr-2 opacity-60 group-hover:opacity-100 group-hover:text-blue-400 transition-all duration-300">{'>'}</span>
                        <span className="flex-1">{option.text}</span>
                      </motion.button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Subtle scanline effect */}
      <div className="absolute inset-0 pointer-events-none z-50 scanlines opacity-3"></div>
      
      {/* Subtle vignette for focus */}
      <div 
        className="absolute inset-0 pointer-events-none z-40" 
        style={{ 
          background: 'radial-gradient(circle at center, transparent 40%, rgba(0,0,0,0.4) 100%)',
          mixBlendMode: 'multiply'
        }}
      ></div>
    </div>
  );
}

export default ConversationFormat;

// Global CSS additions for the animations
// Add this to your global CSS or use CSS modules
// If you're using tailwind.config.js, add these custom animations:
/*
module.exports = {
  theme: {
    extend: {
      animation: {
        'float-slow': 'float 3s ease-in-out infinite',
        'pulse-slow': 'pulse 4s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        }
      }
    }
  }
}
*/

