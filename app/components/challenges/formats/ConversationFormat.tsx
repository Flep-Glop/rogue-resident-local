// app/components/challenges/formats/ConversationFormat.tsx
'use client';
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../../store/gameStore';
import { useResourceStore, StrategicActionType, ResourceTierName, MAX_MOMENTUM_LEVEL } from '../../../store/resourceStore';
import { useDialogueFlow, DialogueStage, DialogueOptionView } from '../../../hooks/useDialogueFlow';
import { useTypewriter } from '../../../hooks/useTypewriter';
import { PixelButton, PixelText, PixelBox } from '../../PixelThemeProvider';
import { safeDispatch } from '../../../core/events/CentralEventBus';
import { GameEventType } from '../../../core/events/EventTypes';
import { StrategicActionsContainer } from '../../gameplay/StrategicActions';
import { applyStrategicAction, enhanceDialogueOptions, useStrategicDialogue } from '../../../core/dialogue/ActionIntegration';
import { usePrimitiveStoreValue, useStableStoreValue, createStableSelector } from '../../../core/utils/storeHooks';
import { NodeType } from '../../../types/game';
import { getCharacterData } from '../../../data/characters';
import useGameStateMachine from '../../../core/statemachine/GameStateMachine';
import { useEventBus } from '../../../core/events/CentralEventBus';
import { withVisualExtender, ConversationExtension, ExtensionData, ExtensionResult } from '../../extensions/VisualExtender';
import DialogueContainer, { DialogueMode } from '../../dialogue/DialogueContainer';
import { getDialogueModeForStage, getStageTitle } from '../../../core/dialogue/DialogueModeHelper';
import CharacterPortrait from '../../CharacterPortrait';
import { ReactionType } from '../../MentorReaction';
import ResidentPortrait from '../../ResidentPortrait';
import InsightMeter from '../../gameplay/InsightMeter';
import MomentumCounter from '../../gameplay/MomentumCounter';
import { useKnowledgeStore } from '../../../store/knowledgeStore';
import { useJournalStore } from '../../../store/journalStore';
import Image from 'next/image';
import GameTooltip from '../../ui/GameTooltip';
import { playSound } from '../../../core/sound/SoundManager';

// Import the dialogue registry instead of individual dialogues
import { getDialogueById, getDialogueByNodeId } from '../../../data/dialogueRegistry';

// For backward compatibility, keep direct imports as fallbacks
import kapoorCalibrationDialogue from '../../../data/dialogues/calibrations/kapoor-calibration';

// Add to the imports
import MomentumParticles from '../../effects/MomentumParticles';

// Add to imports
import { useDialogueStateMachine } from '../../../core/dialogue/DialogueStateMachine';

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

// Add dialogueMode to DialogueStage interface or create an extended version
export interface EnhancedDialogueStage extends DialogueStage {
  dialogueMode?: DialogueMode;
  title?: string;
  shouldImmediatelyShowExtension?: boolean;
  tangentStageId?: string;
  boastStageId?: string; // New property for boast ability
}

// Component props
interface ConversationFormatProps {
  character?: string;
  characterId?: string; // Alternative prop name
  nodeId?: string;
  dialogueStages?: EnhancedDialogueStage[];
  dialogueId?: string;
  onComplete?: (results: InteractionResults) => void;
  onOptionSelected?: (option: DialogueOptionView, stageId: string) => void;
  onStageChange?: (newStageId: string, prevStageId: string) => void;
  stateMachineEnabled?: boolean;
  defaultDialogueMode?: DialogueMode;
  
  // Visual Extension props from HOC
  extension?: ExtensionData;
  extensionResult?: ExtensionResult | null;
  isExtensionActive?: boolean;
  onExtensionComplete?: (result: ExtensionResult) => void;
  onExtensionStart?: () => void;
}

/**
 * ConversationFormat - Optimized with Chamber Pattern
 * Enhanced with Visual Extension support
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
  stateMachineEnabled = false,
  defaultDialogueMode = DialogueMode.NARRATIVE,
  
  // Visual Extension props
  extension,
  extensionResult,
  isExtensionActive = false,
  onExtensionComplete,
  onExtensionStart
}: ConversationFormatProps) {
  // Normalize character ID (support both property names for flexibility)
  const normalizedCharacterId = characterId || character || 'kapoor';
  
  // Player state for player stats panel
  const player = useStableStoreValue(
    useGameStore, 
    (state: any) => state.player || { insight: 0, momentum: 0, maxMomentum: 3 }
  );
  
  // Game phase
  const gamePhase = usePrimitiveStoreValue(
    useGameStateMachine, 
    (state: any) => state.gamePhase,
    'day'
  );
  
  // Journal functionality
  const { hasJournal, currentUpgrade, setJournalOpen } = useJournalStore(
    createStableSelector(['hasJournal', 'currentUpgrade', 'setJournalOpen'])
  );
  
  // Knowledge store
  const { totalMastery, newlyDiscovered } = useKnowledgeStore(
    createStableSelector(['totalMastery', 'newlyDiscovered'])
  );
  
  // State for player UI animations
  const [showInsightAnimation, setShowInsightAnimation] = useState(false);
  
  // Animate insight changes
  useEffect(() => {
    if (player?.insight > 50 && !showInsightAnimation) {
      setShowInsightAnimation(true);
      
      // Reset animation after delay
      const timer = setTimeout(() => {
        setShowInsightAnimation(false);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [player?.insight, showInsightAnimation]);
  
  // Function to toggle journal
  const toggleJournal = () => {
    if (setJournalOpen) {
      setJournalOpen(true);
    }
  };
  
  // Get game state
  const gameStore = useGameStore();
  const currentNodeId = usePrimitiveStoreValue(
    useGameStore,
    (state: any) => state.currentNodeId,
    null
  );
  const storeNodeId = nodeId || currentNodeId;
  
  // Get resource store for insight and momentum
  const { updateInsight, incrementMomentum, resetMomentum, applyStandardizedOutcome } = useResourceStore(createStableSelector(['updateInsight', 'incrementMomentum', 'resetMomentum', 'applyStandardizedOutcome']));
  
  // Add insight value for ability availability check
  const playerInsight = usePrimitiveStoreValue(useResourceStore, (state: any) => state.insight || 0, 0);
  
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
  
  // Add state for handling whisper-to-shout pattern
  const [hoveredAbility, setHoveredAbility] = useState<string | null>(null);
  
  // Character reaction state
  const [mentorReaction, setMentorReaction] = useState<ReactionType>(null);
  const [isShaking, setIsShaking] = useState(false);
  const [isOscillating, setIsOscillating] = useState(false);
  
  // Track timeouts with refs for cleanup
  const reactionTimersRef = useRef<{[key: string]: NodeJS.Timeout | null}>({});
  
  // Check ability availability based on player's insight level
  const abilityAvailability = useMemo(() => {
    const availability = {
      tangent: playerInsight >= 25,
      reframe: playerInsight >= 50,
      peer_review: playerInsight >= 75
    };
    
    console.log(`[ConversationFormat] Ability availability updated: Tangent: ${availability.tangent}, Reframe: ${availability.reframe}, Peer Review: ${availability.peer_review}`);
    console.log(`[ConversationFormat] Current insight: ${playerInsight}`);
    
    return availability;
  }, [playerInsight]);
  
  // Add effect to check ability availability on mount and when insight changes
  useEffect(() => {
    console.log(`[ConversationFormat] Current insight level: ${playerInsight}`);
    console.log(`[ConversationFormat] Tangent available: ${abilityAvailability.tangent}`);
    console.log(`[ConversationFormat] Reframe available: ${abilityAvailability.reframe}`);
    console.log(`[ConversationFormat] Peer Review available: ${abilityAvailability.peer_review}`);
  }, [playerInsight, abilityAvailability]);
  
  // Use the proper dialogue content based on dialogue ID or node ID
  const dialogueContent = useMemo(() => {
    // If dialogueStages were provided as a prop, use those
    if (dialogueStages && dialogueStages.length > 0) {
      return dialogueStages;
    }
    
    // Try to get content from registry using dialogueId
    if (dialogueId) {
      console.log(`[ConversationFormat] Using dialogueId: ${dialogueId}`);
      const registryContent = getDialogueById(dialogueId);
      if (registryContent) {
        return registryContent;
      }
    }
    
    // Try to get content from registry using nodeId
    if (nodeId) {
      console.log(`[ConversationFormat] Using nodeId for dialogue selection: ${nodeId}`);
      const registryContent = getDialogueByNodeId(nodeId);
      if (registryContent) {
        return registryContent;
      }
      
      // Fallbacks for backward compatibility
      if (nodeId === 'start' || nodeId.includes('kapoor-1')) {
        return kapoorCalibrationDialogue;
      }
    }
    
    // Default to kapoor dialogue for backward compatibility
    return kapoorCalibrationDialogue;
  }, [dialogueStages, dialogueId, nodeId]);
  
  // Get current dialogue stage with type safety
  const currentStage = useMemo(() => {
    return (dialogueContent.find((stage: EnhancedDialogueStage) => stage.id === currentStageId) || dialogueContent[0]) as EnhancedDialogueStage;
  }, [dialogueContent, currentStageId]);
  
  // Character data
  const charData = useMemo<CharacterData>(() => {
    return getCharacterData(normalizedCharacterId);
  }, [normalizedCharacterId]);
  
  // Determine dialogue mode for current stage
  const currentDialogueMode = useMemo(() => {
    return getDialogueModeForStage(currentStage, defaultDialogueMode);
  }, [currentStage, defaultDialogueMode]);
  
  // ===== EXTENSION HANDLING =====
  
  // Check if the current stage has an extension
  const currentExtension = useMemo(() => {
    if (!currentStage) return null;
    return currentStage.extension || extension;
  }, [currentStage, extension]);
  
  // Check if we should immediately show the extension
  const shouldImmediatelyShowExtension = useMemo(() => {
    return currentStage?.shouldImmediatelyShowExtension === true;
  }, [currentStage]);
  
  // Handle extension activation
  const handleExtensionStart = useCallback(() => {
    if (onExtensionStart) {
      onExtensionStart();
    }
  }, [onExtensionStart]);
  
  // Auto-activate extensions when they appear
  useEffect(() => {
    if (currentExtension && handleExtensionStart) {
      // If shouldImmediatelyShowExtension is true, show it with minimal delay
      const timer = setTimeout(() => {
        if (isMountedRef.current) {
          handleExtensionStart();
        }
      }, shouldImmediatelyShowExtension ? 50 : 300);
      
      return () => clearTimeout(timer);
    }
  }, [currentExtension, handleExtensionStart, shouldImmediatelyShowExtension]);
  
  // Handle extension completion
  const handleExtensionComplete = useCallback((result: ExtensionResult) => {
    if (!isMountedRef.current) return;
    
    if (onExtensionComplete) {
      onExtensionComplete(result);
    }
    
    // Apply results to gameplay systems
    if (result.success) {
      // Apply standardized outcome based on extension result
      const extensionOutcome = {
        insight: result.insightGained || 0,
        momentumEffect: result.momentumEffect || 'maintain'
      };
      
      applyStandardizedOutcome(extensionOutcome, 'extension_completion');
      
      // Update local tracking for completion results
      if (result.insightGained > 0) {
        setResults(prev => ({
          ...prev,
          insightGained: prev.insightGained + result.insightGained
        }));
      }
      
      // Track knowledge gain
      if (result.knowledgeGained) {
        setResults(prev => ({
          ...prev,
          knowledgeGained: {
            ...prev.knowledgeGained,
            [result.knowledgeGained?.conceptId || 'unknown']: 
              (prev.knowledgeGained[result.knowledgeGained?.conceptId || 'unknown'] || 0) + 
              (result.knowledgeGained?.amount || 0)
          }
        }));
      }
    }
  }, [onExtensionComplete, applyStandardizedOutcome]);
  
  // ===== TEXT FORMATTING =====
  // Process text with custom bracket notation for colored values
  const processFormattedText = useCallback((text: string) => {
    if (!text) return '';
    
    // Replace bracket notation with styled spans
    // Format: [color:text] -> <span className="text-color-value">text</span>
    return text.replace(/\[(\w+):(.*?)\]/g, (match, color, content) => {
      const colorMap: Record<string, string> = {
        yellow: 'text-yellow-300 font-medium',
        cyan: 'text-cyan-300 font-medium',
        green: 'text-green-300 font-medium',
        purple: 'text-purple-300 font-medium',
        red: 'text-red-400 font-medium',
        blue: 'text-blue-300 font-medium'
      };
      
      const colorClass = colorMap[color] || 'text-white';
      return `<span class="${colorClass}">${content}</span>`;
    });
  }, []);
  
  // Function to safely render HTML content
  const renderFormattedText = useCallback((text: string) => {
    const processedText = processFormattedText(text);
    return { __html: processedText };
  }, [processFormattedText]);
  
  // ===== HANDLERS =====
  // Handle option selection with enhanced character reactions
  const handleOptionClick = (index: number, event: React.MouseEvent) => {
    if (selectedOptionIndex !== null || !currentStage?.options) return;
    
    // Get the selected option
    const option = currentStage.options[index];
    
    // Check if option has relationship change or approach
    const relationshipChange = (option as any).relationshipChange || 0;
    
    // Only play select sound for positive/neutral options
    if (relationshipChange >= 0) {
      playRandomBoopSound();
    }
    
    // Record the selection
    setSelectedOptionIndex(index);
    setShowResponse(true);
    
    // Track click position for resource gain feedback
    const clickPosition = {
      x: event.clientX,
      y: event.clientY
    };
    
    // Dispatch UI event for resource gain animations
    safeDispatch(
      GameEventType.UI_OPTION_SELECTED,
      {
        optionIndex: index,
        stageId: currentStage.id,
        position: clickPosition,
        timestamp: Date.now()
      },
      'ConversationFormat'
    );
    
    // Show response text if available
    if (option.responseText) {
      setResponseText(option.responseText);
    }
    
    const approach = (option as any).approach || null;
    
    // Determine resource outcome based on option properties
    let outcomeOrTier: ResourceTierName | { insight: number, momentumEffect: 'increment' | 'reset' | 'maintain' } = 'MINOR'; // Default tier
    let insightGained = 0;
    
    // Direct insight gain specified in the option
    if ((option as any).insightGain !== undefined) {
      insightGained = (option as any).insightGain || 0;
      
      // Map insight gain values to resource tiers
      if (insightGained >= 25) {
        outcomeOrTier = 'CRITICAL';
      } else if (insightGained >= 15) {
        outcomeOrTier = 'MAJOR';
      } else if (insightGained >= 10) {
        outcomeOrTier = 'STANDARD';
      } else if (insightGained > 0) {
        outcomeOrTier = 'MINOR';
      } else {
        outcomeOrTier = 'FAILURE';
      }
    }
    
    // Override tier if option is critical path (guarantees momentum increase)
    if ((option as any).isCriticalPath) {
      // If already using a tier with increment, keep it, otherwise override
      if (outcomeOrTier === 'FAILURE' || outcomeOrTier === 'MINOR') {
        outcomeOrTier = 'STANDARD'; // At minimum guarantee a STANDARD outcome for critical path
      }
    }
    
    // Special case for boast questions that are answered correctly
    if (boastActivated && relationshipChange > 0 && insightGained > 0) {
      console.log('[ConversationFormat] Boast question answered correctly! Boosting insight gain to 40');
      insightGained = 40; // Set insight gain to 40 for correctly answered boast questions
      outcomeOrTier = 'CRITICAL'; // Use the CRITICAL tier to ensure maximum momentum/effect
    }
    
    // Apply the standardized outcome to resources
    applyStandardizedOutcome(outcomeOrTier, `dialogue_option_${currentStage.id}`);
    
    // Update results tracking for completion
    setResults(prev => ({
      ...prev,
      insightGained: prev.insightGained + insightGained
    }));
    
    // Track knowledge gain
    if ((option as any).knowledgeGain) {
      setResults(prev => ({
        ...prev,
        knowledgeGained: {
          ...prev.knowledgeGained,
          [(option as any).knowledgeGain?.conceptId || 'unknown']: 
            (prev.knowledgeGained[(option as any).knowledgeGain?.conceptId || 'unknown'] || 0) + 
            ((option as any).knowledgeGain?.amount || 0)
        }
      }));
    }

    // Handle concept discovery if specified in the option
    if ((option as any).discoverConcepts && Array.isArray((option as any).discoverConcepts)) {
      try {
        const knowledgeStore = useKnowledgeStore.getState();
        console.log(`[ConversationFormat] Discovering concepts:`, (option as any).discoverConcepts);
        
        (option as any).discoverConcepts.forEach((conceptId: string) => {
          if (!conceptId) return;
          
          console.log(`[ConversationFormat] Attempting to discover concept: ${conceptId}`);
          
          // Check if concept already discovered to prevent duplicate events
          if (!knowledgeStore.isConceptDiscovered(conceptId)) {
            // First make sure the concept exists
            const conceptExists = knowledgeStore.nodes.some(node => node.id === conceptId);
            if (!conceptExists) {
              console.warn(`[ConversationFormat] Concept ${conceptId} doesn't exist in the knowledge store, skipping discovery`);
              return;
            }
            
            // Discover the concept
            knowledgeStore.discoverConcept(conceptId);
            console.log(`[ConversationFormat] Successfully discovered concept: ${conceptId}`);
            
            // Add a special log for domain stars
            if (conceptId === 'dosimetry' || conceptId === 'treatment-planning' || 
                conceptId === 'radiation-therapy' || conceptId === 'linac-anatomy') {
              console.log(`[ConversationFormat] 🌟 DOMAIN STAR DISCOVERED: ${conceptId}`);
            }
          } else {
            console.log(`[ConversationFormat] Concept already discovered: ${conceptId}`);
          }
        });
      } catch (error) {
        console.error(`[ConversationFormat] Error discovering concepts:`, error);
      }
    }
    
    // Determine character reaction based on option
    if (relationshipChange > 0) {
      // Positive reaction
      triggerMentorReaction('positive', 3000);
    } else if (relationshipChange < 0) {
      // Negative reaction
      triggerMentorReaction('negative', 3000);
      setIsShaking(true);
      // Play wrong sound for negative dialogue options
      playSound('/sounds/rogue.wrong.mp3');
    } else if (approach === 'question') {
      // Question reaction
      triggerMentorReaction('question', 3000);
    } else if (approach === 'creative') {
      // Surprise reaction
      triggerMentorReaction('surprise', 3000);
    } else if (approach === 'humble') {
      // Positive reaction
      triggerMentorReaction('positive', 3000);
    } else if (Math.random() < 0.3) {
      // Random occasional reaction for options without specific type
      const randomReactions: ReactionType[] = ['thinking', 'question', null];
      triggerMentorReaction(randomReactions[Math.floor(Math.random() * randomReactions.length)], 3000);
    }
    
    // Pass to the dialogue handler
    if (onOptionSelected) {
      onOptionSelected(option, currentStage.id);
    }
    
    // Store the next stage ID for the continue button to use
    if (option.nextStageId) {
      // Check for special stage transitions like journal-presentation
      if (option.nextStageId === 'journal-presentation') {
        console.log('[ConversationFormat] Will move to journal presentation stage on continue');
        // Update the results to include journal tier
        setResults(prev => ({
          ...prev,
          journalTier: 'technical'
        }));
      }
    }
    
    // Reset momentum and deactivate boast mode after answering a boast question
    if (boastActivated) {
      console.log('[ConversationFormat] Resetting momentum and deactivating boast mode after boast question');
      // Reset momentum to 0
      resetMomentum();
      // Deactivate boast mode
      setBoastActivated(false);
    }
  };
  
  // Trigger mentor reaction with automatic clearing
  const triggerMentorReaction = useCallback((reaction: ReactionType, duration = 3000) => {
    // Clear any existing reaction timer
    if (reactionTimersRef.current.reaction) {
      clearTimeout(reactionTimersRef.current.reaction);
      reactionTimersRef.current.reaction = null;
    }
    
    // Set the reaction
    setMentorReaction(reaction);
    
    // Clear reaction after duration
    reactionTimersRef.current.reaction = setTimeout(() => {
      if (isMountedRef.current) {
        setMentorReaction(null);
      }
    }, duration);
  }, [setMentorReaction]);
  
  // Reset shake after animation completes
  useEffect(() => {
    if (isShaking) {
      const timer = setTimeout(() => {
        setIsShaking(false);
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [isShaking]);
  
  // Handle strategic action activation with character reactions
  const handleAbilityActivate = useCallback((abilityType: StrategicActionType) => {
    if (!currentStage) return;
    
    // Check if player has enough insight for this ability
    const requiredInsight = 
      abilityType === 'tangent' ? 25 :
      abilityType === 'reframe' ? 50 :
      abilityType === 'peer_review' ? 75 : 0;
    
    if (playerInsight < requiredInsight) {
      console.log(`[ConversationFormat] Not enough insight for ${abilityType}. Need ${requiredInsight}, have ${playerInsight}`);
      // Play "no" sound effect
      playSound('error');
      return;
    }
    
    // Activate the strategic action with context info
    console.log(`[ConversationFormat] Activating ability: ${abilityType}`);
    
    // Create action context with current dialogue details
    const actionContext = {
      characterId: normalizedCharacterId,
      stageId: currentStage.id,
      dialogueMode: currentDialogueMode
    };
    
    // Trigger different character reactions and execute ability effects based on type
    switch(abilityType) {
      case 'tangent':
        // Apply costs and trigger effects through resource store's standardized system
        const tangentSuccess = applyStandardizedOutcome(
          { 
            insight: -25, // Cost of the ability
            momentumEffect: 'maintain', // Maintain momentum when using ability
          }, 
          'tangent_activation'
        );
        
        // Show thinking reaction
        triggerMentorReaction('thinking', 1500);
        
        // Record ability use in results
        setResults(prev => ({
          ...prev,
          actionsUsed: [...(prev.actionsUsed || []), 'tangent']
        }));
        
        // ACTUAL TANGENT IMPLEMENTATION:
        // 1. Replace current dialogue options with alternative options
        // 2. Or switch to an entirely different stage with related content
        
        // For the vertical slice, we'll implement a basic version:
        // - If the current stage has tangentStageId defined, navigate to that stage
        // - Otherwise, modify the current options to simulate a topic shift
        
        if ((currentStage as any).tangentStageId) {
          // Navigate to the tangent stage
          const tangentStageId = (currentStage as any).tangentStageId;
          console.log(`[ConversationFormat] Tangent: Moving to alternate stage ${tangentStageId}`);
          
          setCurrentStageId(tangentStageId);
          if (onStageChange) {
            onStageChange(tangentStageId, currentStage.id);
          }
        } else if (currentStage.options && currentStage.options.length > 0) {
          // Simulate a tangent by changing the stage context and switching to a related topic
          // This is temporary for the vertical slice demo
          const tangentText = `Interesting observation. That reminds me of a related question - ${
            currentDialogueMode === DialogueMode.QUESTION
              ? "could we consider this from a different theoretical perspective?"
              : "how does this connect to the broader context of medical physics?"
          }`;
          
          // We need to create a modified version of the current stage to show the tangent
          // In a real implementation, we would have predefined tangent content
          const modifiedStage = { ...currentStage };
          // Store original text for reference
          (modifiedStage as any).originalText = modifiedStage.text;
          // Replace with tangent text
          modifiedStage.text = tangentText;
          
          // Update the stage in dialogue content (this is just for visual demonstration)
          // In a full implementation, we would properly swap to alternate content
          const updatedDialogueContent = dialogueContent.map(stage => {
            if (stage.id === currentStage.id) {
              return modifiedStage;
            }
            return stage;
          });
          
          // Force re-render of the current stage with updated text
          // Note: In a real implementation, we would navigate to a different stage
          setCurrentStageId(prevId => {
            // Re-trigger the same stage ID to force a re-render
            const tempId = `${prevId}_temp`;
            setTimeout(() => {
              if (isMountedRef.current) {
                setCurrentStageId(prevId);
              }
            }, 10);
            return tempId;
          });
          
          // Dispatch event for tangent activation
          safeDispatch(
            GameEventType.TANGENT_ACTIVATED,
            {
              originalStageId: currentStage.id,
              characterId: normalizedCharacterId,
              dialogueMode: currentDialogueMode
            },
            'ConversationFormat'
          );
          
          console.log(`[ConversationFormat] Tangent: Modified current dialogue to show tangent`);
        }
        break;
        
      case 'reframe':
        // Apply costs via standardized outcome
        applyStandardizedOutcome(
          { 
            insight: -50, 
            momentumEffect: 'maintain',
          }, 
          'reframe_activation'
        );
        
        // Logic for changing context
        console.log('Changing problem frame of reference');
        // Show idea reaction
        triggerMentorReaction('idea', 1500);
        setIsOscillating(true);
        setTimeout(() => setIsOscillating(false), 1500);
        
        // Record ability use
        setResults(prev => ({
          ...prev,
          actionsUsed: [...(prev.actionsUsed || []), 'reframe']
        }));
        break;
        
      case 'peer_review':
        // Apply costs via standardized outcome
        applyStandardizedOutcome(
          { 
            insight: -75, 
            momentumEffect: 'maintain',
          }, 
          'peer_review_activation'
        );
        
        // Logic for summoning a mentor
        console.log('Summoning another mentor for a hint');
        // Show surprise reaction
        triggerMentorReaction('surprise', 1500);
        
        // Record ability use
        setResults(prev => ({
          ...prev,
          actionsUsed: [...(prev.actionsUsed || []), 'peer_review']
        }));
        break;
    }
  }, [
    currentStage, 
    playerInsight, 
    applyStandardizedOutcome, 
    triggerMentorReaction, 
    setIsOscillating, 
    normalizedCharacterId, 
    currentDialogueMode,
    onStageChange,
    dialogueContent,
    isMountedRef
  ]);
  
  // Clean up timers on component unmount
  useEffect(() => {
    return () => {
      // Clear all reaction timers
      Object.values(reactionTimersRef.current).forEach(timer => {
        if (timer) clearTimeout(timer);
      });
    };
  }, []);
  
  // Handle continue button click
  const handleContinue = useCallback(() => {
    if (!currentStage) return;
    
    // Play random boop sound instead of select sound
    playRandomBoopSound();
    
    // If we're showing a response, move to the nextStageId based on the selected option
    // If we're showing a response, move to the nextStageId based on the selected option
    if (showResponse && selectedOptionIndex !== null && currentStage.options) {
      const selectedOption = currentStage.options[selectedOptionIndex];
      
      if (selectedOption.nextStageId) {
        // Check for special stage transitions
        if (selectedOption.nextStageId === 'journal-presentation') {
          console.log('[ConversationFormat] Moving to journal presentation stage');
          
          // Special handling for journal acquisition
          const characterForDispatch = normalizedCharacterId || 'kapoor';
          
          safeDispatch(GameEventType.NODE_COMPLETED, {
            nodeId: storeNodeId,
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
            source: 'dialogue_completion',
            nodeId: storeNodeId
          });
        }
        
        // Check if next stage is a conclusion
        const nextStage = dialogueContent.find((stage: EnhancedDialogueStage) => 
          stage.id === selectedOption.nextStageId
        );
        
        if (nextStage && nextStage.isConclusion) {
          // Complete node and call onComplete
          if (gameStore && gameStore.completeNode && storeNodeId) {
            gameStore.completeNode(storeNodeId);
          }
          
          if (onComplete) {
            onComplete(results);
          }
        }
        
        // Move to next stage
        setCurrentStageId(selectedOption.nextStageId);
        if (onStageChange) {
          onStageChange(selectedOption.nextStageId, currentStage.id);
        }
      }
      
      setShowResponse(false);
      setResponseText('');
      setSelectedOptionIndex(null);
      return;
    }
    
    // If this is a conclusion, complete the node
    if (currentStage.isConclusion) {
      // Complete node and call onComplete
      if (gameStore && gameStore.completeNode && storeNodeId) {
        gameStore.completeNode(storeNodeId);
      }
      
      if (onComplete) {
        onComplete(results);
      }
      return;
    }
    
    // Handle regular stage transitions
    if (currentStage.nextStageId) {
      setCurrentStageId(currentStage.nextStageId);
      if (onStageChange) {
        onStageChange(currentStage.nextStageId, currentStage.id);
      }
      return;
    }
    
    // If no nextStageId is present but we're at end of dialogue, show a random reaction
    if (!currentStage.nextStageId && !currentStage.options) {
      const randomReactions: ReactionType[] = ['thinking', 'positive', 'question'];
      triggerMentorReaction(randomReactions[Math.floor(Math.random() * randomReactions.length)], 3000);
      
      // Complete node and call onComplete
      if (gameStore && gameStore.completeNode && storeNodeId) {
        gameStore.completeNode(storeNodeId);
      }
      
      if (onComplete) {
        onComplete(results);
      }
    }
  }, [
    currentStage, 
    showResponse,
    selectedOptionIndex,
    storeNodeId, 
    normalizedCharacterId,
    onStageChange, 
    onComplete, 
    results, 
    gameStore, 
    triggerMentorReaction,
    setShowResponse,
    setResponseText,
    setSelectedOptionIndex,
    setCurrentStageId,
    dialogueContent
  ]);
  
  // Get the player's momentum level for Boast ability
  const playerMomentum = usePrimitiveStoreValue(useResourceStore, (state: any) => state.momentum, 0);
  const hasMaxMomentum = useMemo(() => playerMomentum >= MAX_MOMENTUM_LEVEL, [playerMomentum]);
  const [boastActivated, setBoastActivated] = useState(false);
  
  // Add state for particle effects
  const [particleEffectTrigger, setParticleEffectTrigger] = useState<{
    origin: { x: number, y: number } | null;
    target: { x: number, y: number } | null;
    effect: 'increment' | 'reset' | 'maintain';
    amount: number;
    show: boolean;
  }>({
    origin: null,
    target: null,
    effect: 'maintain',
    amount: 0,
    show: false
  });
  
  // Initialize strategic dialogue integration
  const { applyAction } = useStrategicDialogue(normalizedCharacterId, currentStageId);
  
  // Add a new state to track the initial activation shake
  const [boastShakeActive, setBoastShakeActive] = useState(false);
  
  // Modify the handleBoastOption function to add a fallback method
  const handleBoastOption = useCallback(async (event: React.MouseEvent) => {
    // Skip if an option is already selected
    if (selectedOptionIndex !== null) {
      console.log('[ConversationFormat] Cannot boast with option already selected');
      playSound('error');
      return;
    }
    
    // Validate stage
    if (!currentStage) {
      console.error('[ConversationFormat] Cannot boast - no current stage');
      playSound('error');
      return;
    }
    
    // Validate stage ID
    if (!currentStageId) {
      console.error('[ConversationFormat] Cannot boast - no current stage ID');
      playSound('error');
      return;
    }
    
    // Play suspense sound for boast activation
    playSound('/sounds/rogue.suspense.mp3');
    
    // Record activation of boast
    setBoastActivated(true);
    setBoastShakeActive(true);
    // Set a timeout to turn it off after the animation
    setTimeout(() => {
      setBoastShakeActive(false);
    }, 500); // 500ms matches the duration of the shake animation
    
    // Track position for animations
    const clickPosition = {
      x: event.clientX,
      y: event.clientY
    };
    
    // Get location of momentum counter for particles target
    let momentumCounterElement = document.querySelector('.mc-counter');
    let momentumPosition = momentumCounterElement 
      ? { 
          x: momentumCounterElement.getBoundingClientRect().left + (momentumCounterElement.getBoundingClientRect().width / 2),
          y: momentumCounterElement.getBoundingClientRect().top + (momentumCounterElement.getBoundingClientRect().height / 2)
        }
      : null;
    
    // Trigger visual effect for boast activation
    setParticleEffectTrigger({
      origin: clickPosition,
      target: momentumPosition,
      effect: 'maintain', // Use 'maintain' for boast as it doesn't consume momentum
      amount: 3, // Max momentum
      show: true
    });
    
    // Clear particle effect after animation completes
    setTimeout(() => {
      setParticleEffectTrigger(prev => ({ ...prev, show: false }));
    }, 2000);
    
    // Trigger momentum effect animations
    safeDispatch(
      GameEventType.STRATEGIC_ACTION_ACTIVATED,
      {
        actionType: 'boast',
        position: clickPosition,
        timestamp: Date.now()
      },
      'ConversationFormat'
    );
    
    // Trigger mentor reaction
    triggerMentorReaction('surprise', 2000);
    
    // Get the dialogue state and log it
    try {
      const dialogueState = useDialogueStateMachine.getState();
      console.log(`[ConversationFormat] Dialogue state machine state:`, dialogueState);
      console.log(`[ConversationFormat] Our current stage ID: ${currentStageId}`);
    } catch (error) {
      console.error('[ConversationFormat] Error accessing dialogue state:', error);
    }

    // First try the action system approach
    console.log(`[ConversationFormat] Attempting to apply boast action with characterId: ${normalizedCharacterId}, stageId: ${currentStageId}`);
    
    try {
      const success = await applyAction('boast');
      
      if (success) {
        console.log('[ConversationFormat] Boast action applied successfully');
        
        // Update results tracking
        setResults(prev => ({
          ...prev,
          actionsUsed: [...(prev.actionsUsed || []), 'boast']
        }));
        
        // Don't reset momentum here - it should remain until player answers the challenge question
        return; // Exit if successful
      } else {
        console.error('[ConversationFormat] Boast action failed to apply, trying direct approach');
      }
    } catch (error) {
      console.error('[ConversationFormat] Error applying boast action:', error);
    }
    
    // Third, fallback method
    // Check if current stage has a boastStageId
    if (currentStage.boastStageId) {
      const boastStageId = currentStage.boastStageId;
      console.log(`[ConversationFormat] Direct navigation to boast stage: ${boastStageId}`);
      
      // Navigate directly to the boast stage
      setCurrentStageId(boastStageId);
      if (onStageChange) {
        onStageChange(boastStageId, currentStageId);
      }
      
      // Record ability use
      setResults(prev => ({
        ...prev,
        actionsUsed: [...(prev.actionsUsed || []), 'boast']
      }));
    } else {
      console.error(`[ConversationFormat] No boastStageId defined for current stage: ${currentStageId}`);
      playSound('error');
    }
  
    // If we get here, all methods failed
    if (!boastActivated) {
      console.error('[ConversationFormat] All boast activation methods failed');
      setBoastActivated(false); // Reset boast activation
      playSound('error');
    }
  }, [currentStage, currentStageId, selectedOptionIndex, normalizedCharacterId, triggerMentorReaction, applyAction, onStageChange, setCurrentStageId]);
  
  // ===== COMPONENT LIFECYCLE =====
  
  // Handle component mount/unmount
  useEffect(() => {
    isMountedRef.current = true;
    
    console.log(`[ConversationFormat] Component mounted. Dialogue content length: ${dialogueContent?.length || 0}`);
    console.log(`[ConversationFormat] Current stage ID: ${currentStageId}, Character ID: ${normalizedCharacterId}`);
    
    // Debug: Trigger a test reaction
    setTimeout(() => {
      if (isMountedRef.current) {
        triggerMentorReaction('idea', 3000);
        console.log('[ConversationFormat] Test reaction triggered');
      }
    }, 1000);
    
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
    <div 
      className={`relative w-full h-full flex flex-col justify-center items-center overflow-hidden py-4 
        ${boastShakeActive ? 'boast-screen-shake' : ''} 
        ${boastActivated ? 'boast-zoom-effect' : ''}`}
    >
      {/* Replace the solid black background with a dynamic background when boast is active */}
      {boastActivated ? (
        <div className="absolute inset-0 boast-background z-0"></div>
      ) : (
        <div className="absolute inset-0 bg-black z-0"></div>
      )}
      
      {/* Add flash overlay for boast activation */}
      {boastShakeActive && (
        <div className="absolute inset-0 boast-flash-overlay z-40 pointer-events-none"></div>
      )}
      
      {/* Momentum particles effect */}
      <AnimatePresence>
        {particleEffectTrigger.show && (
          <MomentumParticles 
            originPosition={particleEffectTrigger.origin}
            targetPosition={particleEffectTrigger.target}
            effect={particleEffectTrigger.effect}
            amount={particleEffectTrigger.amount}
            onComplete={() => setParticleEffectTrigger(prev => ({ ...prev, show: false }))}
          />
        )}
      </AnimatePresence>
      
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

      {/* Clean two-column layout - centered content */}
      <div 
        className="w-full max-w-5xl flex flex-col lg:flex-row p-0"
        style={{ position: 'relative', zIndex: 45 }}
      >
        {/* Left side - character portrait - collapsed container */}
        <div className="w-full lg:w-1/5 flex flex-col items-center overflow-visible relative">
          {/* Character portrait container with animations - collapsed height */}
          <div 
            ref={characterRef}
            className={`relative ${isShaking ? 'shake-animation' : ''} ${isOscillating ? 'oscillate-animation' : ''}`}
            style={{ width: '180px', height: '150px', overflow: 'visible' }}
          >
            {/* Character Portrait Component */}
            <div className="flex justify-center items-center w-full h-full">
              <CharacterPortrait
                characterId={normalizedCharacterId}
                size="lg"
                reaction={mentorReaction}
                className="transform"
                dialogueMode={currentDialogueMode}
              />
            </div>
          </div>
          
          {/* Character name label - simplified positioning */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="w-full max-w-[180px] relative z-10 mt-2"
          >
            <div className={`rounded-md p-2 shadow-lg ${
              currentDialogueMode === DialogueMode.NARRATIVE ? 'bg-gradient-to-r from-blue-900/40 to-blue-950/60 border-l-4 border-blue-500' :
              currentDialogueMode === DialogueMode.CHALLENGE_INTRO ? 'bg-gradient-to-r from-amber-900/40 to-amber-950/60 border-l-4 border-amber-500' :
              currentDialogueMode === DialogueMode.QUESTION ? 'bg-gradient-to-r from-purple-900/40 to-purple-950/60 border-l-4 border-purple-500' :
              currentDialogueMode === DialogueMode.INSTRUCTION ? 'bg-gradient-to-r from-green-900/40 to-green-950/60 border-l-4 border-green-500' :
              currentDialogueMode === DialogueMode.REACTION ? 'bg-gradient-to-r from-pink-900/40 to-pink-950/60 border-l-4 border-pink-500' :
              currentDialogueMode === DialogueMode.CRITICAL ? 'bg-gradient-to-r from-red-900/40 to-red-950/60 border-l-4 border-red-500' :
              'bg-gradient-to-r from-blue-900/40 to-blue-950/60 border-l-4 border-blue-500'
            }`}>
              <div className="flex items-center">
                <div className={`w-1 h-5 rounded-sm mr-2 ${
                  currentDialogueMode === DialogueMode.NARRATIVE ? 'bg-blue-400' :
                  currentDialogueMode === DialogueMode.CHALLENGE_INTRO ? 'bg-amber-400' :
                  currentDialogueMode === DialogueMode.QUESTION ? 'bg-purple-400' :
                  currentDialogueMode === DialogueMode.INSTRUCTION ? 'bg-green-400' :
                  currentDialogueMode === DialogueMode.REACTION ? 'bg-pink-400' :
                  currentDialogueMode === DialogueMode.CRITICAL ? 'bg-red-400' :
                  'bg-blue-400'
                }`}></div>
                <div>
                  <h3 className={`text-sm font-pixel tracking-wide ${
                    currentDialogueMode === DialogueMode.NARRATIVE ? 'text-blue-100' :
                    currentDialogueMode === DialogueMode.CHALLENGE_INTRO ? 'text-amber-100' :
                    currentDialogueMode === DialogueMode.QUESTION ? 'text-purple-100' :
                    currentDialogueMode === DialogueMode.INSTRUCTION ? 'text-green-100' :
                    currentDialogueMode === DialogueMode.REACTION ? 'text-pink-100' :
                    currentDialogueMode === DialogueMode.CRITICAL ? 'text-red-100' :
                    'text-blue-100'
                  }`}>Medical Physics</h3>
                  <p className={`text-xs font-pixel ${
                    currentDialogueMode === DialogueMode.NARRATIVE ? 'text-blue-300/70' :
                    currentDialogueMode === DialogueMode.CHALLENGE_INTRO ? 'text-amber-300/70' :
                    currentDialogueMode === DialogueMode.QUESTION ? 'text-purple-300/70' :
                    currentDialogueMode === DialogueMode.INSTRUCTION ? 'text-green-300/70' :
                    currentDialogueMode === DialogueMode.REACTION ? 'text-pink-300/70' :
                    currentDialogueMode === DialogueMode.CRITICAL ? 'text-red-300/70' :
                    'text-blue-300/70'
                  }`}>Resident</p>
                </div>
              </div>
            </div>
          </motion.div>
          
          {/* Contextual descriptor - moved under dialogue mode */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.9 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="w-full max-w-[180px] mt-2"
          >
            <div className={`rounded-sm p-2 shadow-md ${
              currentDialogueMode === DialogueMode.NARRATIVE ? 'bg-[#0a1220]/80 border-l-2 border-blue-500/60' :
              currentDialogueMode === DialogueMode.CHALLENGE_INTRO ? 'bg-[#1f1707]/80 border-l-2 border-amber-500/60' :
              currentDialogueMode === DialogueMode.QUESTION ? 'bg-[#150a1f]/80 border-l-2 border-purple-500/60' :
              currentDialogueMode === DialogueMode.INSTRUCTION ? 'bg-[#071b11]/80 border-l-2 border-green-500/60' :
              currentDialogueMode === DialogueMode.REACTION ? 'bg-[#1b0a13]/80 border-l-2 border-pink-500/60' :
              currentDialogueMode === DialogueMode.CRITICAL ? 'bg-[#1b0a0a]/80 border-l-2 border-red-500/60' :
              'bg-[#0a1220]/80 border-l-2 border-blue-500/60'
            }`}>
              <p className={`text-xs font-pixel italic leading-tight ${
                currentDialogueMode === DialogueMode.NARRATIVE ? 'text-blue-300/90' :
                currentDialogueMode === DialogueMode.CHALLENGE_INTRO ? 'text-amber-300/90' :
                currentDialogueMode === DialogueMode.QUESTION ? 'text-purple-300/90' :
                currentDialogueMode === DialogueMode.INSTRUCTION ? 'text-green-300/90' :
                currentDialogueMode === DialogueMode.REACTION ? 'text-pink-300/90' :
                currentDialogueMode === DialogueMode.CRITICAL ? 'text-red-300/90' :
                'text-blue-300/90'
              }`}>
                {currentStage?.contextNote || "Kapoor adjusts the ionization chamber position with methodical precision, not looking up as you enter."}
              </p>
            </div>
          </motion.div>
        </div>
        
        {/* Main content area */}
        <div className="flex-1 flex flex-col justify-center p-0 lg:p-0 lg:pl-4" 
             style={{ position: 'relative', zIndex: 45 }}>
          {/* Boast mode indicator */}
          <AnimatePresence>
            {boastActivated && (
              <BoastModeIndicator />
            )}
          </AnimatePresence>
          
          {/* New dialogue mode indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="mb-2 ml-1 self-start"
          >
            <div className={`font-pixel text-sm ${
              currentDialogueMode === DialogueMode.NARRATIVE ? 'text-blue-400' :
              currentDialogueMode === DialogueMode.CHALLENGE_INTRO ? 'text-amber-400' :
              currentDialogueMode === DialogueMode.QUESTION ? 'text-purple-400' :
              currentDialogueMode === DialogueMode.INSTRUCTION ? 'text-green-400' :
              currentDialogueMode === DialogueMode.REACTION ? 'text-pink-400' :
              currentDialogueMode === DialogueMode.CRITICAL ? 'text-red-400' :
              'text-blue-400'
            }`}>
              {currentDialogueMode}
            </div>
          </motion.div>
          
          {/* Main dialogue section */}
          <div className="flex-1 flex flex-col">
            {/* Primary dialogue box with relative positioning to contain abilities */}
            <motion.div
              ref={dialogueContainerRef}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="w-full max-w-3xl mb-1 relative"
            >
              {/* Replace the old dialogue box with DialogueContainer */}
              <DialogueContainer 
                mode={currentDialogueMode}
                title={getStageTitle(currentStage)}
                className={`w-full max-w-4xl ${boastActivated ? 'boast-mode-container' : ''}`}
              >
                {/* When showing the question text */}
                {!showResponse && !shouldImmediatelyShowExtension && (
                  <p 
                    className={`text-base font-pixel text-white leading-relaxed ${boastActivated ? 'boast-text-style' : ''} ${isExtensionActive ? 'opacity-0 transition-opacity duration-500' : ''}`} 
                    dangerouslySetInnerHTML={renderFormattedText(currentStage.text)} />
                )}
                
                {/* When showing the response text */}
                {showResponse && responseText && (
                  <div className="mb-3">
                    <p className={`text-base font-pixel leading-relaxed ${
                      currentDialogueMode === DialogueMode.NARRATIVE ? 'text-blue-200' :
                      currentDialogueMode === DialogueMode.CHALLENGE_INTRO ? 'text-amber-200' :
                      currentDialogueMode === DialogueMode.QUESTION ? 'text-purple-200' :
                      currentDialogueMode === DialogueMode.INSTRUCTION ? 'text-green-200' :
                      currentDialogueMode === DialogueMode.REACTION ? 'text-pink-200' :
                      currentDialogueMode === DialogueMode.CRITICAL ? 'text-red-200' :
                      'text-blue-200'
                    } px-3 py-2 rounded-md ${
                      currentDialogueMode === DialogueMode.NARRATIVE ? 'bg-blue-800/30 border-l-2 border-blue-500' :
                      currentDialogueMode === DialogueMode.CHALLENGE_INTRO ? 'bg-amber-800/30 border-l-2 border-amber-500' :
                      currentDialogueMode === DialogueMode.QUESTION ? 'bg-purple-800/30 border-l-2 border-purple-500' :
                      currentDialogueMode === DialogueMode.INSTRUCTION ? 'bg-green-800/30 border-l-2 border-green-500' :
                      currentDialogueMode === DialogueMode.REACTION ? 'bg-pink-800/30 border-l-2 border-pink-500' :
                      currentDialogueMode === DialogueMode.CRITICAL ? 'bg-red-800/30 border-l-2 border-red-500' :
                      'bg-blue-800/30 border-l-2 border-blue-500'
                    }`}
                    dangerouslySetInnerHTML={renderFormattedText(responseText)} />
                  </div>
                )}
                
                {/* VISUAL EXTENSION INTEGRATION */}
                {currentExtension && (
                  <div className="mt-3">
                    <ConversationExtension
                      extension={currentExtension}
                      characterId={normalizedCharacterId}
                      stageId={currentStageId}
                      isActive={isExtensionActive || false}
                      className="w-full"
                      onComplete={handleExtensionComplete}
                    />
                  </div>
                )}
                
                {/* Response options with clean styling */}
                {!showResponse && currentStage.options && currentStage.options.length > 0 ? (
                  <div 
                    ref={optionsContainerRef}
                    className="space-y-1 mt-3"
                    style={{ position: 'relative', zIndex: 50 }}
                  >
                    {/* Boast option - only show when player has max momentum and hasn't already activated boast */}
                    {hasMaxMomentum && !boastActivated && (
                      <GameTooltip
                        text="Test your knowledge with more difficult questions. Answer correctly to earn 40 INSIGHT. Be careful - any answer will reset your momentum."
                        title="CHALLENGE MODE"
                        requirementText="Requires max momentum"
                        requirementMet={hasMaxMomentum}
                        style="boast"
                        direction="right"
                        width="md"
                      >
                        <motion.button
                          initial={{ opacity: 0, x: -5 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1 }}
                          onClick={handleBoastOption}
                          disabled={selectedOptionIndex !== null}
                          className={`
                            w-full text-left p-2 
                            font-pixel text-sm leading-relaxed
                            bg-black/60 text-orange-300 hover:bg-orange-900/50 hover:text-white
                            border-l-4 border-orange-500
                            transition-all duration-200
                            flex items-start group
                          `}
                        >
                          <span className="mr-2 text-orange-400 group-hover:text-orange-200 transition-all duration-300 flex items-center">
                            <span className="animate-pulse">★</span>
                          </span>
                          <span className="flex-1">
                            Well, this reminds me of something more advanced...
                            <span className="ml-2 text-xs bg-orange-500/90 text-black px-1 rounded font-bold inline-block">BOAST!</span>
                          </span>
                        </motion.button>
                      </GameTooltip>
                    )}
                    
                    {/* Regular dialogue options */}
                    {currentStage.options.map((option: DialogueOptionView, index: number) => (
                      <motion.button
                        key={index}
                        initial={{ opacity: 0, x: -5 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 + index * 0.1 }}
                        onClick={(event) => handleOptionClick(index, event)}
                        disabled={selectedOptionIndex !== null}
                        className={`
                          w-full text-left p-2 
                          font-pixel text-sm leading-relaxed
                          ${(option as any).boastMode ? 'bg-orange-950/40 text-orange-200 border-l-4 border-orange-400' : ''}
                          ${boastActivated ? 'boast-option-style' : ''}
                          ${selectedOptionIndex === index 
                            ? `${
                                currentDialogueMode === DialogueMode.NARRATIVE ? 'bg-blue-900/50 text-white border-l-4 border-blue-400' :
                                currentDialogueMode === DialogueMode.CHALLENGE_INTRO ? 'bg-amber-900/50 text-white border-l-4 border-amber-400' :
                                currentDialogueMode === DialogueMode.QUESTION ? 'bg-purple-900/50 text-white border-l-4 border-purple-400' :
                                currentDialogueMode === DialogueMode.INSTRUCTION ? 'bg-green-900/50 text-white border-l-4 border-green-400' :
                                currentDialogueMode === DialogueMode.REACTION ? 'bg-pink-900/50 text-white border-l-4 border-pink-400' :
                                currentDialogueMode === DialogueMode.CRITICAL ? 'bg-red-900/50 text-white border-l-4 border-red-400' :
                                'bg-blue-900/50 text-white border-l-4 border-blue-400'
                              }`
                            : `bg-black/60 text-gray-300 hover:${
                                currentDialogueMode === DialogueMode.NARRATIVE ? 'bg-blue-900/50 hover:text-white border-l-4 border-transparent hover:border-blue-400' :
                                currentDialogueMode === DialogueMode.CHALLENGE_INTRO ? 'bg-amber-900/50 hover:text-white border-l-4 border-transparent hover:border-amber-400' :
                                currentDialogueMode === DialogueMode.QUESTION ? 'bg-purple-900/50 hover:text-white border-l-4 border-transparent hover:border-purple-400' :
                                currentDialogueMode === DialogueMode.INSTRUCTION ? 'bg-green-900/50 hover:text-white border-l-4 border-transparent hover:border-green-400' :
                                currentDialogueMode === DialogueMode.REACTION ? 'bg-pink-900/50 hover:text-white border-l-4 border-transparent hover:border-pink-400' :
                                currentDialogueMode === DialogueMode.CRITICAL ? 'bg-red-900/50 hover:text-white border-l-4 border-transparent hover:border-red-400' :
                                'bg-blue-900/50 hover:text-white border-l-4 border-transparent hover:border-blue-400'
                              }`}
                          transition-all duration-200
                          flex items-start group
                        `}
                      >
                        <span className={`mr-2 opacity-60 group-hover:opacity-100 ${
                          currentDialogueMode === DialogueMode.NARRATIVE ? 'group-hover:text-blue-400' :
                          currentDialogueMode === DialogueMode.CHALLENGE_INTRO ? 'group-hover:text-amber-400' :
                          currentDialogueMode === DialogueMode.QUESTION ? 'group-hover:text-purple-400' :
                          currentDialogueMode === DialogueMode.INSTRUCTION ? 'group-hover:text-green-400' :
                          currentDialogueMode === DialogueMode.REACTION ? 'group-hover:text-pink-400' :
                          currentDialogueMode === DialogueMode.CRITICAL ? 'group-hover:text-red-400' :
                          'group-hover:text-blue-400'
                        } transition-all duration-300`}>{'>'}</span>
                        <span className="flex-1">{option.text}</span>
                      </motion.button>
                    ))}
                  </div>
                ) : (
                  /* Continue button for response view or when no options available */
                  (showResponse || (!currentStage.options || currentStage.options.length === 0)) && 
                  (!isExtensionActive || extensionResult) && (  // Only show if no active extension or extension is completed
                    <motion.button
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      onClick={handleContinue}
                      className={`mt-1 px-4 py-1 ${
                        currentDialogueMode === DialogueMode.NARRATIVE ? 'bg-blue-900/60 hover:bg-blue-800/80 border border-blue-500/40 text-blue-200' :
                        currentDialogueMode === DialogueMode.CHALLENGE_INTRO ? 'bg-amber-900/60 hover:bg-amber-800/80 border border-amber-500/40 text-amber-200' :
                        currentDialogueMode === DialogueMode.QUESTION ? 'bg-purple-900/60 hover:bg-purple-800/80 border border-purple-500/40 text-purple-200' :
                        currentDialogueMode === DialogueMode.INSTRUCTION ? 'bg-green-900/60 hover:bg-green-800/80 border border-green-500/40 text-green-200' :
                        currentDialogueMode === DialogueMode.REACTION ? 'bg-pink-900/60 hover:bg-pink-800/80 border border-pink-500/40 text-pink-200' :
                        currentDialogueMode === DialogueMode.CRITICAL ? 'bg-red-900/60 hover:bg-red-800/80 border border-red-500/40 text-red-200' :
                        'bg-blue-900/60 hover:bg-blue-800/80 border border-blue-500/40 text-blue-200'
                      } rounded-sm font-pixel text-sm transition-all duration-200 self-end flex items-center`}
                      style={{ position: 'relative', zIndex: 50 }}
                    >
                      <span>Continue</span>
                      <span className="ml-2 opacity-70">&raquo;</span>
                    </motion.button>
                  )
                )}
              </DialogueContainer>
            </motion.div>
          </div>
        </div>
        
        {/* Right side - Player stats panel */}
        <div className="w-full lg:w-1/5 flex flex-col items-center overflow-visible relative">
          {/* Player Portrait */}
          <div 
            ref={characterRef}
            className={`relative ${isShaking ? 'shake-animation' : ''} ${isOscillating ? 'oscillate-animation' : ''}`}
            style={{ width: '180px', height: '150px', overflow: 'visible' }}
          >
            {/* Resident portrait */}
            <div className="flex justify-center items-center w-full h-full relative">
              <ResidentPortrait
                size="lg"
                className="transform"
                showMasteryGlow={false}
                dialogueMode={currentDialogueMode}
              />
            </div>
          </div>
          
          {/* Player name label */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="w-full max-w-[180px] relative z-10 mt-2"
          >
            <div className={`rounded-md p-2 shadow-lg ${
              currentDialogueMode === DialogueMode.NARRATIVE ? 'bg-gradient-to-r from-blue-900/40 to-blue-950/60 border-r-4 border-blue-500' :
              currentDialogueMode === DialogueMode.CHALLENGE_INTRO ? 'bg-gradient-to-r from-amber-900/40 to-amber-950/60 border-r-4 border-amber-500' :
              currentDialogueMode === DialogueMode.QUESTION ? 'bg-gradient-to-r from-purple-900/40 to-purple-950/60 border-r-4 border-purple-500' :
              currentDialogueMode === DialogueMode.INSTRUCTION ? 'bg-gradient-to-r from-green-900/40 to-green-950/60 border-r-4 border-green-500' :
              currentDialogueMode === DialogueMode.REACTION ? 'bg-gradient-to-r from-pink-900/40 to-pink-950/60 border-r-4 border-pink-500' :
              currentDialogueMode === DialogueMode.CRITICAL ? 'bg-gradient-to-r from-red-900/40 to-red-950/60 border-r-4 border-red-500' :
              'bg-gradient-to-r from-blue-900/40 to-blue-950/60 border-r-4 border-blue-500'
            }`}>
              <div className="flex items-center justify-end">
                <div>
                  <h3 className={`text-sm font-pixel tracking-wide ${
                    currentDialogueMode === DialogueMode.NARRATIVE ? 'text-blue-100' :
                    currentDialogueMode === DialogueMode.CHALLENGE_INTRO ? 'text-amber-100' :
                    currentDialogueMode === DialogueMode.QUESTION ? 'text-purple-100' :
                    currentDialogueMode === DialogueMode.INSTRUCTION ? 'text-green-100' :
                    currentDialogueMode === DialogueMode.REACTION ? 'text-pink-100' :
                    currentDialogueMode === DialogueMode.CRITICAL ? 'text-red-100' :
                    'text-blue-100'
                  }`}>Medical Physics</h3>
                  <p className={`text-xs font-pixel ${
                    currentDialogueMode === DialogueMode.NARRATIVE ? 'text-blue-300/70' :
                    currentDialogueMode === DialogueMode.CHALLENGE_INTRO ? 'text-amber-300/70' :
                    currentDialogueMode === DialogueMode.QUESTION ? 'text-purple-300/70' :
                    currentDialogueMode === DialogueMode.INSTRUCTION ? 'text-green-300/70' :
                    currentDialogueMode === DialogueMode.REACTION ? 'text-pink-300/70' :
                    currentDialogueMode === DialogueMode.CRITICAL ? 'text-red-300/70' :
                    'text-blue-300/70'
                  }`}>Resident</p>
                </div>
                <div className={`w-1 h-5 rounded-sm ml-2 ${
                  currentDialogueMode === DialogueMode.NARRATIVE ? 'bg-blue-400' :
                  currentDialogueMode === DialogueMode.CHALLENGE_INTRO ? 'bg-amber-400' :
                  currentDialogueMode === DialogueMode.QUESTION ? 'bg-purple-400' :
                  currentDialogueMode === DialogueMode.INSTRUCTION ? 'bg-green-400' :
                  currentDialogueMode === DialogueMode.REACTION ? 'bg-pink-400' :
                  currentDialogueMode === DialogueMode.CRITICAL ? 'bg-red-400' :
                  'bg-blue-400'
                }`}></div>
              </div>
            </div>
          </motion.div>
          
          {/* Player abilities section - moved below name */}
          <div className="w-full max-w-[180px] mt-4">
            <div className="bg-black/60 backdrop-blur-sm rounded-md p-2">
              <div className="grid grid-cols-3 gap-2">
                <div className="flex flex-col items-center">
                  <GameTooltip
                    text="Reveals additional dialogue topics to explore, uncovering hidden knowledge paths."
                    title="TANGENT"
                    requirementText="Requires 25 Insight"
                    requirementMet={abilityAvailability.tangent}
                    style="tangent"
                    direction="top"
                  >
                    <div 
                      className={`w-9 h-9 rounded-full flex items-center justify-center ability-icon ${abilityAvailability.tangent && !showResponse && currentStage?.options && currentStage.options.length > 0 ? 'bg-blue-900/70 text-blue-300 ability-available' : 'bg-gray-900/70 text-gray-500'}`}
                      onClick={() => {
                        console.log('[ConversationFormat] Tangent button clicked');
                        if (abilityAvailability.tangent && !showResponse && currentStage?.options && currentStage.options.length > 0) {
                          console.log('[ConversationFormat] Tangent ability is available, activating');
                          handleAbilityActivate('tangent');
                        } else {
                          console.log(`[ConversationFormat] Tangent ability is NOT available. Insight: ${playerInsight}, showResponse: ${showResponse}, options: ${currentStage?.options ? currentStage.options.length : 0}`);
                        }
                      }}
                      role="button"
                      aria-label="Tangent ability"
                      title={!showResponse && currentStage?.options && currentStage.options.length > 0 
                        ? (abilityAvailability.tangent ? "Use Tangent (25◆)" : "Requires 25 Insight") 
                        : "Only available during questions"}
                    >
                      <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M3,8 H13 M13,8 L10,5 M13,8 L10,11" />
                      </svg>
                    </div>
                  </GameTooltip>
                  <span className="text-xs mt-1 font-pixel text-blue-300/80">25◆</span>
                </div>
                
                <div className="flex flex-col items-center">
                  <GameTooltip
                    text="Recontextualizes the current dialogue options for a fresh perspective."
                    title="REFRAME"
                    requirementText="Requires 50 Insight and 2 Momentum"
                    requirementMet={abilityAvailability.reframe}
                    style="reframe"
                    direction="top"
                  >
                    <div 
                      className={`w-9 h-9 rounded-full flex items-center justify-center ability-icon ${abilityAvailability.reframe && !showResponse && currentStage?.options && currentStage.options.length > 0 ? 'bg-purple-900/70 text-purple-300 ability-available' : 'bg-gray-900/70 text-gray-500'}`}
                      onClick={() => {
                        console.log('[ConversationFormat] Reframe button clicked');
                        if (abilityAvailability.reframe && !showResponse && currentStage?.options && currentStage.options.length > 0) {
                          console.log('[ConversationFormat] Reframe ability is available, activating');
                          handleAbilityActivate('reframe');
                        } else {
                          console.log(`[ConversationFormat] Reframe ability is NOT available. Insight: ${playerInsight}, showResponse: ${showResponse}, options: ${currentStage?.options ? currentStage.options.length : 0}`);
                        }
                      }}
                      role="button"
                      aria-label="Reframe ability"
                      title={!showResponse && currentStage?.options && currentStage.options.length > 0 
                        ? (abilityAvailability.reframe ? "Use Reframe (50◆)" : "Requires 50 Insight") 
                        : "Only available during questions"}
                    >
                      <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M3,3 H13 V13 H3 V3 Z M3,7 H13 M7,3 V13" />
                      </svg>
                    </div>
                  </GameTooltip>
                  <span className="text-xs mt-1 font-pixel text-purple-300/80">50◆</span>
                </div>
                
                <div className="flex flex-col items-center">
                  <GameTooltip
                    text="Consult with a colleague to get expert advice on the current options, highlighting the best answer."
                    title="PEER REVIEW"
                    requirementText="Requires 75 Insight"
                    requirementMet={abilityAvailability.peer_review}
                    style="peer_review"
                    direction="top"
                  >
                    <div 
                      className={`w-9 h-9 rounded-full flex items-center justify-center ability-icon ${abilityAvailability.peer_review && !showResponse && currentStage?.options && currentStage.options.length > 0 ? 'bg-green-900/70 text-green-300 ability-available' : 'bg-gray-900/70 text-gray-500'}`}
                      onClick={() => {
                        console.log('[ConversationFormat] Peer Review button clicked');
                        if (abilityAvailability.peer_review && !showResponse && currentStage?.options && currentStage.options.length > 0) {
                          console.log('[ConversationFormat] Peer Review ability is available, activating');
                          handleAbilityActivate('peer_review');
                        } else {
                          console.log(`[ConversationFormat] Peer Review ability is NOT available. Insight: ${playerInsight}, showResponse: ${showResponse}, options: ${currentStage?.options ? currentStage.options.length : 0}`);
                        }
                      }}
                      role="button"
                      aria-label="Peer Review ability"
                      title={!showResponse && currentStage?.options && currentStage.options.length > 0 
                        ? (abilityAvailability.peer_review ? "Use Peer Review (75◆)" : "Requires 75 Insight") 
                        : "Only available during questions"}
                    >
                      <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M5,5 L8,3 L11,5 M8,3 V9 M5,11 L8,13 L11,11" />
                      </svg>
                    </div>
                  </GameTooltip>
                  <span className="text-xs mt-1 font-pixel text-green-300/80">75◆</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Player stats - compact for dialogue interface */}
          <div className="w-full max-w-[180px] space-y-3 mt-4">
            {/* Insight meter */}
            <PixelBox 
              className="p-2" 
              variant="clinical"
            >
              <div className="font-pixel text-xs text-text-secondary mb-1">INSIGHT</div>
              <GameTooltip 
                text={<>Your medical knowledge and expertise. Earn it by selecting situationally appropriate dialogue options. Spend it to use <span className="text-blue-400 font-bold">TANGENT</span>, <span className="text-purple-400 font-bold">REFRAME</span>, and <span className="text-green-400 font-bold">PEER-REVIEW</span>.</>}
                title="INSIGHT"
                style="insight"
                direction="bottom"
              >
                <InsightMeter 
                  className=""
                  size="sm"
                  showLabel={false}
                  showAnimation={showInsightAnimation}
                />
              </GameTooltip>
            </PixelBox>

            {/* === ADDED Momentum Counter === */}
            <PixelBox 
              className="p-2" 
              variant="dark"
            >
              <div className="font-pixel text-xs text-text-secondary mb-1">MOMENTUM</div>
              <GameTooltip 
                text={<>Your conversation flow. Builds when you make good dialogue choices. At maximum momentum, you can activate <span className="text-amber-400 font-bold">BOAST</span> for higher rewards.</>}
                title="MOMENTUM"
                style="momentum"
                direction="bottom"
              >
                <MomentumCounter 
                  className="mx-auto" // Center it within the box
                  compact={true} // Use compact mode if available
                />
              </GameTooltip>
            </PixelBox>
            
            {/* Journal button - Only shown if journal is acquired */}
            {hasJournal && (
              <div className="flex justify-center mt-2">
                <GameTooltip
                  text="Your medical notes collection. Records key concepts and knowledge you've gathered. Upgraded journals provide more detailed information."
                  title={`${currentUpgrade === 'base' ? 'Basic Notebook' : currentUpgrade === 'technical' ? 'Technical Journal' : 'Annotated Journal'}`}
                  style="insight"
                  direction="bottom"
                >
                  <div 
                    className="w-10 h-10 cursor-pointer transition-transform hover:scale-110"
                    onClick={toggleJournal}
                  >
                    <div className="w-full h-full relative">
                      <img 
                        src="/icons/educational.png"
                        alt="Journal"
                        className="w-full h-full object-contain"
                        style={{ 
                          imageRendering: 'pixelated',
                          filter: 'brightness(1.2) contrast(1.1)' 
                        }}
                      />
                      {/* Visual indicator for journal upgrades */}
                      {currentUpgrade !== 'base' && (
                        <div className={`absolute bottom-0 right-0 w-2 h-2 rounded-full ${
                          currentUpgrade === 'technical' ? 'bg-clinical-light' : 'bg-educational-light'
                        }`}></div>
                      )}
                    </div>
                  </div>
                </GameTooltip>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CSS styles for abilities */}
      <style jsx>{`
        .abilities-container {
          display: flex;
          flex-direction: column;
          gap: 12px;
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(4px);
          border-radius: 16px;
          padding: 14px 10px;
          border: 1px solid rgba(59, 130, 246, 0.3);
        }
        
        .abilities-container-mobile {
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(4px);
          border-radius: 16px;
          padding: 8px;
          border: 1px solid rgba(59, 130, 246, 0.3);
        }
        
        .ability-icon {
          cursor: default;
          transition: all 0.2s;
          opacity: 0.7;
          transform: scale(0.95);
        }
        
        .ability-available {
          opacity: 1;
          cursor: pointer;
          transform: scale(1);
          box-shadow: 0 0 8px 2px rgba(59, 130, 246, 0.3);
          animation: pulse-ability 2s infinite;
        }
        
        .ability-available:hover {
          transform: scale(1.1);
          filter: brightness(1.3);
          box-shadow: 0 0 12px 4px rgba(59, 130, 246, 0.5);
        }
        
        @keyframes pulse-ability {
          0%, 100% { 
            box-shadow: 0 0 8px 2px rgba(59, 130, 246, 0.3);
          }
          50% { 
            box-shadow: 0 0 12px 4px rgba(59, 130, 246, 0.5);
          }
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
          20%, 40%, 60%, 80% { transform: translateX(2px); }
        }
        
        .shake-animation {
          animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
        }
        
        @keyframes oscillate {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
        
        .oscillate-animation {
          animation: oscillate 2s ease-in-out infinite;
        }
        
        @keyframes pulse-slow {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        
        .animate-pulse-slow {
          animation: pulse-slow 2s ease-in-out infinite;
        }
        
        .shadow-glow-orange {
          box-shadow: 0 0 4px 1px rgba(249, 115, 22, 0.6);
        }
      `}</style>

      {/* CSS Styles - All global styles consolidated here */}
      <style jsx global>{`
        /* Animation for character feedback */
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
          20%, 40%, 60%, 80% { transform: translateX(2px); }
        }
        
        @keyframes oscillate {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
        
        .shake-animation {
          animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
        }
        
        .oscillate-animation {
          animation: oscillate 1.5s ease-in-out infinite;
        }
        
        /* Shadow glow for boast mode - enhanced version */
        .shadow-glow-orange {
          box-shadow: 0 0 15px 2px rgba(255, 150, 50, 0.5) !important;
        }
      `}</style>

      {/* Boast intensity effects */}
      {boastActivated && (
        <div className="absolute inset-0 z-20 pointer-events-none overflow-hidden">
          {/* Vignette overlay */}
          <div className="absolute inset-0 boast-vignette"></div>
          
          {/* Background particles */}
          <div className="absolute inset-0">
            {Array.from({ length: 10 }).map((_, i) => (
              <div 
                key={`boast-particle-${i}`}
                className="absolute rounded-full boast-particle"
                style={{ 
                  top: `${Math.random() * 100}%`, 
                  left: `${Math.random() * 100}%`,
                  width: `${2 + Math.random() * 3}px`,
                  height: `${2 + Math.random() * 3}px`,
                  animationDelay: `${Math.random() * 2}s`,
                  animationDuration: `${3 + Math.random() * 4}s`
                }}
              />
            ))}
          </div>
        </div>
      )}

      <style jsx global>{`
        /* Animation for character feedback */
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
          20%, 40%, 60%, 80% { transform: translateX(2px); }
        }
        
        @keyframes oscillate {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
        
        .shake-animation {
          animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
        }
        
        .oscillate-animation {
          animation: oscillate 1.5s ease-in-out infinite;
        }
        
        /* Shadow glow for boast mode - enhanced version */
        .shadow-glow-orange {
          box-shadow: 0 0 15px 2px rgba(255, 150, 50, 0.5) !important;
        }
        
        /* Boast mode container effect */
        .boast-mode-container {
          position: relative;
          animation: boast-pulse 2s infinite;
        }
        
        .boast-mode-container::before {
          content: '';
          position: absolute;
          inset: -2px;
          border: 2px solid rgba(234, 88, 12, 0.7);
          z-index: -1;
          border-radius: 4px;
          animation: boast-border-pulse 1.5s infinite;
          pointer-events: none;
        }
        
        @keyframes boast-pulse {
          0%, 100% { transform: scale(1); box-shadow: 0 0 10px 2px rgba(234, 88, 12, 0.3); }
          50% { transform: scale(1.002); box-shadow: 0 0 15px 3px rgba(234, 88, 12, 0.4); }
        }
        
        @keyframes boast-border-pulse {
          0%, 100% { opacity: 0.7; }
          50% { opacity: 0.9; }
        }
        
        /* Boast vignette effect */
        .boast-vignette {
          background: radial-gradient(circle, transparent 60%, rgba(234, 88, 12, 0.15) 100%);
          animation: boast-vignette-pulse 4s infinite;
        }
        
        @keyframes boast-vignette-pulse {
          0%, 100% { opacity: 0.7; }
          50% { opacity: 0.4; }
        }
        
        /* Boast particles */
        .boast-particle {
          background-color: rgba(234, 88, 12, 0.6);
          animation: boast-particle-float 4s infinite ease-in-out;
          opacity: 0.4;
        }
        
        @keyframes boast-particle-float {
          0%, 100% { transform: translateY(0) translateX(0); opacity: 0.4; }
          25% { transform: translateY(-15px) translateX(5px); opacity: 0.6; }
          50% { transform: translateY(-25px) translateX(10px); opacity: 0.2; }
          75% { transform: translateY(-15px) translateX(15px); opacity: 0.5; }
        }
      `}</style>

      {/* Boast mode option styling */}
      <style jsx global>{`
        /* Boast mode option styling */
        .boast-option-style {
          position: relative;
          overflow: hidden;
          border-color: rgba(234, 88, 12, 0.7) !important;
        }

        .boast-option-style::before {
          content: '';
          position: absolute;
          top: 0;
          left: -150%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(234, 88, 12, 0.2), transparent);
          transform: skewX(-20deg);
          animation: boast-option-shimmer 3s infinite;
          pointer-events: none;
          z-index: 1;
        }

        .boast-option-style:hover::before {
          animation: boast-option-shimmer 1.5s infinite;
        }

        @keyframes boast-option-shimmer {
          0% { left: -150%; }
          100% { left: 150%; }
        }

        .boast-option-style > * {
          position: relative;
          z-index: 2;
        }
      `}</style>

      {/* Boast screen shake effect */}
      <style jsx global>{`
        .boast-screen-shake {
          animation: boast-screen-shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
        }

        @keyframes boast-screen-shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
          20%, 40%, 60%, 80% { transform: translateX(4px); }
        }

        /* Boast dialogue text style */
        .boast-text-style {
          color: #fde047 !important; /* Yellow-ish text */
          text-shadow: 0 0 8px rgba(234, 88, 12, 0.7);
          letter-spacing: 0.02em;
          font-weight: 500;
        }
      `}</style>

      {/* Boast zoom effect - enhanced version */}
      <style jsx global>{`
        .boast-zoom-effect {
          animation: boast-zoom 0.8s forwards;
        }

        @keyframes boast-zoom {
          0% { transform: scale(1); }
          40% { transform: scale(1.05); }
          60% { transform: scale(1.03); }
          80% { transform: scale(1.025); }
          100% { transform: scale(1.02); }
        }

        /* Flash overlay effect */
        .boast-flash-overlay {
          background: linear-gradient(to bottom, rgba(255, 140, 50, 0.4), rgba(255, 80, 0, 0.2));
          animation: boast-flash 0.6s forwards;
        }

        @keyframes boast-flash {
          0% { opacity: 0; }
          30% { opacity: 1; }
          100% { opacity: 0; }
        }

        /* Boast dynamic background */
        .boast-background {
          background: radial-gradient(circle at center, #581c0b 0%, #450701 70%, #200000 100%);
          animation: boast-bg-pulse 4s infinite ease-in-out;
          position: relative;
          overflow: hidden;
        }

        /* Add a subtle texture overlay */
        .boast-background::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-image: url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h40v40H0V0zm40 40h-4v-4h4v4zm0-8h-4v-4h4v4zm-8 0h-4v-4h4v4zm-8 0h-4v-4h4v4zm-8 0h-4v-4h4v4zm-8 0H4v-4h4v4zm0-8H4v-4h4v4zm8 0h-4v-4h4v4zm8 0h-4v-4h4v4zm8 0h-4v-4h4v4zm0-8h-4v-4h4v4zm-8 0h-4v-4h4v4zm-8 0h-4v-4h4v4zm-8 0H4v-4h4v4z' fill='%23000000' fill-opacity='0.05' fill-rule='evenodd'/%3E%3C/svg%3E");
          opacity: 0.4;
          pointer-events: none;
        }

        /* Add a moving highlight/glow effect */
        .boast-background::after {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: radial-gradient(circle at center, rgba(255, 100, 50, 0.15) 0%, transparent 30%, transparent 100%);
          animation: boast-bg-glow 10s infinite linear;
          pointer-events: none;
        }

        @keyframes boast-bg-pulse {
          0%, 100% { opacity: 0.9; background-position: 0% 0%; }
          25% { opacity: 0.95; }
          50% { opacity: 1; background-position: 2% 2%; }
          75% { opacity: 0.95; }
        }

        @keyframes boast-bg-glow {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

// Export the wrapped component with visual extension capabilities
export default withVisualExtender(ConversationFormat);

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
/**
 * Simple dialogue box component for basic styling
 */
const SimpleDialogueBox = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => {
  return (
    <div className={`bg-black/70 border border-gray-800/70 p-5 rounded-sm relative overflow-hidden ${className}`}
         style={{ position: 'relative', zIndex: 45 }}>
      <div className="absolute inset-0 bg-gradient-to-b from-blue-900/20 to-black/10 pointer-events-none"></div>
      {children}
    </div>
  );
};

// Add this new component near the bottom of the file
const BoastModeIndicator = () => {
  return (
    <GameTooltip
      text="You're tackling a tougher question for greater rewards! Answer correctly to earn 40 INSIGHT. Answering any question will reset your momentum."
      title="CHALLENGE MODE ACTIVE"
      style="boast"
      direction="bottom"
      width="md"
    >
      <motion.div
        className="absolute top-0 right-0 mr-3 mt-3 z-50 flex items-center space-x-2 bg-orange-950/80 px-3 py-2 border-2 border-orange-500/80 rounded shadow-glow-orange pixel-borders"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
      >
        <span className="text-orange-300 animate-pulse text-xl">★</span>
        <span className="font-pixel text-orange-200 text-xs sm:text-sm uppercase">Challenge Mode Active</span>
        <span className="text-orange-300 animate-pulse text-xl">★</span>
      </motion.div>
    </GameTooltip>
  );
};

// Helper function to play a random boop sound
const playRandomBoopSound = () => {
  const randomNumber = Math.floor(Math.random() * 8) + 1;
  playSound(`/sounds/rogue.boop-${randomNumber}.mp3`);
};
