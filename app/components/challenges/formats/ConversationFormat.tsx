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
  // State for Dr. Kapoor's calibration dialogue
  const [dialogueStage, setDialogueStage] = useState(0);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null);
  const [showResponse, setShowResponse] = useState(false);
  const [results, setResults] = useState<InteractionResults>({
    insightGained: 0,
    relationshipChange: 0,
    knowledgeGained: {},
  });
  
  // Sample dialogue for Dr. Kapoor's calibration node
  const kapoorDialogue = useMemo(() => [
    {
      text: "Welcome to the calibration lab. Today we'll be checking the linear accelerator output calibration.",
      options: ["I'm ready to begin, Dr. Kapoor.", "What exactly will we be calibrating?"]
    },
    {
      text: "Excellent. First, what's the standard unit we use to measure absorbed dose?",
      options: ["Gray (Gy)", "Sievert (Sv)", "Becquerel (Bq)"]
    },
    {
      text: "Correct! The Gray is our standard unit for absorbed dose. Now, when we calibrate the linac, which device do we primarily use?",
      options: ["Ionization chamber", "TLD", "Film dosimeter"]
    },
    {
      text: "Very good. For your records, I've prepared this calibration journal. You should document all your findings in it.",
      options: ["Thank you, I'll keep detailed notes.", "Is this part of standard protocol?"]
    },
    {
      text: "That's all for today's calibration. The equipment is operating within acceptable parameters.",
      options: ["Return to hospital map"]
    }
  ], []);
  
  // Character data
  const charData = useMemo<CharacterData>(() => {
    // Default character data if none provided
    return {
      name: "Dr. Kapoor",
      title: "Chief Medical Physicist",
      sprite: "/images/characters/kapoor.png",
      primaryColor: "#3498db",
      textClass: "text-blue-500",
      bgClass: "bg-blue-900"
    };
  }, [normalizedCharacterId]);
  
  // ===== HANDLERS =====
  // Handle option selection
  const handleOptionClick = useCallback((optionIndex: number) => {
    setSelectedOptionIndex(optionIndex);
    setShowResponse(true);
    
    // First question - just advance
    if (dialogueStage === 0) {
      setTimeout(() => {
        setDialogueStage(1);
        setShowResponse(false);
        setSelectedOptionIndex(null);
      }, 1000);
    }
    // Gray (correct answer)
    else if (dialogueStage === 1 && optionIndex === 0) {
      incrementMomentum();
      updateInsight(10);
      setResults(prev => ({
        ...prev,
        insightGained: prev.insightGained + 10
      }));
      setTimeout(() => {
        setDialogueStage(2);
        setShowResponse(false);
        setSelectedOptionIndex(null);
      }, 1000);
    }
    // Wrong answers
    else if (dialogueStage === 1) {
      // No momentum gain
      updateInsight(2); // Small insight for trying
      setResults(prev => ({
        ...prev,
        insightGained: prev.insightGained + 2
      }));
      setTimeout(() => {
        setDialogueStage(2);
        setShowResponse(false);
        setSelectedOptionIndex(null);
      }, 1000);
    }
    // Ionization chamber (correct answer)
    else if (dialogueStage === 2 && optionIndex === 0) {
      incrementMomentum();
      updateInsight(10);
      setResults(prev => ({
        ...prev,
        insightGained: prev.insightGained + 10
      }));
      setTimeout(() => {
        setDialogueStage(3);
        setShowResponse(false);
        setSelectedOptionIndex(null);
      }, 1000);
    }
    // Wrong answers
    else if (dialogueStage === 2) {
      // No momentum gain
      updateInsight(2);
      setResults(prev => ({
        ...prev,
        insightGained: prev.insightGained + 2
      }));
      setTimeout(() => {
        setDialogueStage(3);
        setShowResponse(false);
        setSelectedOptionIndex(null);
      }, 1000);
    }
    // Journal acquisition
    else if (dialogueStage === 3) {
      // Trigger journal acquisition
      safeDispatch(GameEventType.NODE_COMPLETED, {
        nodeId: storeNodeId,
        result: {
          isJournalAcquisition: true
        }
      });
      setTimeout(() => {
        setDialogueStage(4);
        setShowResponse(false);
        setSelectedOptionIndex(null);
      }, 1000);
    }
    // End conversation
    else if (dialogueStage === 4) {
      // Complete the node challenge
      if (gameStore.completeNode && storeNodeId) {
        gameStore.completeNode(storeNodeId);
      }
      
      // Call onComplete if provided
      if (onComplete) {
        onComplete(results);
      }
    }
  }, [dialogueStage, incrementMomentum, updateInsight, storeNodeId, gameStore, onComplete, results]);
  
  // ===== COMPONENT LIFECYCLE =====
  
  // Handle component mount/unmount
  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  
  // ===== RENDER =====
  
  // Get current dialogue content
  const currentDialogue = kapoorDialogue[dialogueStage];
  
  // Render the conversation UI
  return (
    <div className="flex flex-col h-full w-full bg-gray-900 text-white p-4">
      <div className="flex mb-4">
        <div className="w-1/3">
          {/* Character portrait */}
          <div className={`w-32 h-32 ${charData.bgClass} rounded-lg mb-2`}></div>
          <div className="text-lg">{charData.name}</div>
          <div className="text-sm text-gray-400">{charData.title}</div>
        </div>
        <div className="w-2/3 p-4 bg-gray-800 rounded-lg">
          {currentDialogue.text}
        </div>
      </div>
      
      <div className="mt-auto">
        <div className="flex flex-col space-y-2">
          {currentDialogue.options.map((option, index) => (
            <button
              key={index}
              className={`p-2 bg-blue-700 hover:bg-blue-600 rounded-lg text-left ${
                selectedOptionIndex === index ? 'ring-2 ring-yellow-400' : ''
              }`}
              onClick={() => handleOptionClick(index)}
              disabled={showResponse}
            >
              {option}
            </button>
          ))}
        </div>
      </div>
      
      {/* Resource meters */}
      <div className="absolute top-4 right-4 flex flex-col items-end space-y-2">
        <InsightMeter />
        <MomentumCounter />
      </div>
    </div>
  );
}

export default ConversationFormat;

// Helper function to get character data
function getCharacterData(characterId: string): CharacterData {
  // Default character data
  const defaultData: CharacterData = {
    name: "Unknown",
    title: "Character",
    sprite: "/images/characters/default.png",
    primaryColor: "#cccccc",
    textClass: "text-gray-200",
    bgClass: "bg-gray-700"
  };
  
  // Character-specific data
  switch (characterId) {
    case 'kapoor':
      return {
        name: "Dr. Kapoor",
        title: "Chief Medical Physicist",
        sprite: "/images/characters/kapoor.png",
        primaryColor: "#3498db",
        textClass: "text-blue-500",
        bgClass: "bg-blue-900"
      };
    default:
      return defaultData;
  }
}

