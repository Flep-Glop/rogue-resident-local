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
      options: [
        { text: "I'm ready to begin, Dr. Kapoor.", type: "neutral" },
        { text: "What exactly will we be calibrating?", type: "question" }
      ]
    },
    {
      text: "Excellent. First, what's the standard unit we use to measure absorbed dose?",
      options: [
        { text: "Gray (Gy)", type: "technical" },
        { text: "Sievert (Sv)", type: "technical" },
        { text: "Becquerel (Bq)", type: "technical" }
      ]
    },
    {
      text: "Correct! The Gray is our standard unit for absorbed dose. Now, when we calibrate the linac, which device do we primarily use?",
      options: [
        { text: "Ionization chamber", type: "technical" },
        { text: "TLD", type: "technical" },
        { text: "Film dosimeter", type: "technical" }
      ]
    },
    {
      text: "Very good. For your records, I've prepared this calibration journal. You should document all your findings in it.",
      options: [
        { text: "Thank you, I'll keep detailed notes.", type: "positive" },
        { text: "Is this part of standard protocol?", type: "question" }
      ]
    },
    {
      text: "That's all for today's calibration. The equipment is operating within acceptable parameters.",
      options: [
        { text: "Return to hospital map", type: "neutral" }
      ]
    }
  ], []);
  
  // Character data
  const charData = useMemo<CharacterData>(() => {
    return getCharacterData(normalizedCharacterId);
  }, [normalizedCharacterId]);
  
  // ===== HANDLERS =====
  // Handle option selection
  const handleOptionClick = useCallback((optionIndex: number) => {
    const selectedOption = kapoorDialogue[dialogueStage].options[optionIndex];
    setSelectedOptionIndex(optionIndex);
    setShowResponse(true);
    
    // First question - just advance
    if (dialogueStage === 0) {
      // Extra insight for asking questions
      if (selectedOption.type === 'question') {
        updateInsight(5);
        setResults(prev => ({
          ...prev,
          insightGained: prev.insightGained + 5
        }));
      }
      
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
        insightGained: prev.insightGained + 10,
        knowledgeGained: {
          ...prev.knowledgeGained,
          'radiation_units': (prev.knowledgeGained['radiation_units'] || 0) + 1
        }
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
        insightGained: prev.insightGained + 10,
        knowledgeGained: {
          ...prev.knowledgeGained,
          'calibration_equipment': (prev.knowledgeGained['calibration_equipment'] || 0) + 1
        }
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
      // Extra insight for asking questions
      if (selectedOption.type === 'question') {
        updateInsight(5);
        setResults(prev => ({
          ...prev,
          insightGained: prev.insightGained + 5
        }));
      }
      
      // Trigger journal acquisition
      safeDispatch(GameEventType.NODE_COMPLETED, {
        nodeId: storeNodeId,
        result: {
          isJournalAcquisition: true,
          journalTier: 'technical'
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
        onComplete({
          ...results,
          journalTier: 'technical'
        });
      }
    }
  }, [dialogueStage, incrementMomentum, updateInsight, storeNodeId, gameStore, onComplete, results, kapoorDialogue]);
  
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
    <div className="relative w-full h-full flex flex-col items-center justify-end">
      {/* Background with grid pattern */}
      <div className="absolute inset-0 bg-gray-900 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(25,33,55,0.8)_0%,rgba(10,15,30,1)_100%)]">
          {/* Grid pattern overlay */}
          <div 
            className="absolute inset-0 opacity-20" 
            style={{ 
              backgroundImage: 'linear-gradient(to right, rgba(30,64,175,0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(30,64,175,0.1) 1px, transparent 1px)',
              backgroundSize: '24px 24px' 
            }}
          />
        </div>
      </div>
      
      {/* Scanline effect overlay */}
      <div className="absolute inset-0 pointer-events-none z-50 scanlines opacity-10"></div>
      
      {/* Subtle ambient particles */}
      <div className="absolute inset-0 overflow-hidden z-10 pointer-events-none">
        {Array.from({ length: 10 }).map((_, i) => (
          <div 
            key={i}
            className="absolute w-1 h-1 bg-blue-400/20 rounded-full animate-pulse"
            style={{ 
              top: `${Math.random() * 100}%`, 
              left: `${Math.random() * 100}%`,
              animationDuration: `${3 + Math.random() * 5}s`,
              animationDelay: `${Math.random() * 2}s`
            }}
          />
        ))}
      </div>

      {/* Character Portrait - with subtle floating animation */}
      <div 
        ref={characterRef}
        className="absolute left-16 bottom-48 w-64 h-64 z-20"
      >
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="relative w-full h-full animate-float-slow"
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <img
              src={charData.sprite}
              alt={charData.name}
              className="w-full h-full object-contain pixelated"
              style={{ imageRendering: 'pixelated' }}
            />
          </div>
          
          {/* Subtle glow effect */}
          <div 
            className="absolute inset-0 rounded-full blur-lg opacity-30 -z-10"
            style={{ backgroundColor: charData.primaryColor, transform: 'scale(0.9)' }}
          />
        </motion.div>
      </div>

      {/* Character Name & Title - with pixel border */}
      <div className="absolute left-16 bottom-36 bg-black/80 p-2 rounded z-20 pixel-borders pixel-borders--clinical">
        <h3 className={`text-lg font-pixel ${charData.textClass}`}>{charData.name}</h3>
        <p className="text-sm text-gray-400 font-pixel">{charData.title}</p>
      </div>

      {/* Main Dialogue Box */}
      <div 
        ref={dialogueContainerRef}
        className="w-full max-w-4xl mb-24 px-6 relative z-20"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="relative"
        >
          <div className="bg-black/80 border border-blue-500/30 rounded p-6 shadow-lg pixel-borders pixel-borders--blue">
            {/* Dialogue Text - with subtle text effect */}
            <p className="text-lg font-pixel leading-relaxed text-white mb-6 whitespace-pre-wrap">
              {kapoorDialogue[dialogueStage].text}
            </p>

            {/* Options Container - with improved hover effects */}
            <div 
              ref={optionsContainerRef}
              className="space-y-3"
            >
              {kapoorDialogue[dialogueStage].options.map((option, index) => (
                <motion.button
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => handleOptionClick(index)}
                  disabled={selectedOptionIndex !== null}
                  className={`
                    w-full text-left px-4 py-2 rounded
                    font-pixel text-sm leading-relaxed
                    ${selectedOptionIndex === index 
                      ? 'bg-blue-500/50 text-white shadow-inner shadow-blue-800/50' 
                      : 'bg-black/70 text-gray-300 hover:bg-blue-500/20 hover:text-white hover:shadow-inner hover:shadow-blue-700/20'}
                    ${option.type === 'technical' ? 'text-technical-light border-l-4 border-technical-light/50' : 'border-l-4 border-transparent'}
                    ${option.type === 'question' ? 'text-educational-light border-l-4 border-educational-light/50' : ''}
                    ${option.type === 'positive' ? 'text-qa-light border-l-4 border-qa-light/50' : ''}
                    transition-all duration-200
                    border border-blue-500/30
                    disabled:opacity-50 disabled:cursor-not-allowed
                    flex items-start
                  `}
                >
                  <span className="mr-2 opacity-60">{'>'}</span>
                  <span className="flex-1">{option.text}</span>
                </motion.button>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Insight & Momentum UI */}
      <div className="absolute top-6 right-6 flex flex-col space-y-4 z-20">
        <InsightMeter />
        <MomentumCounter />
      </div>
      
      {/* Scene decoration - lab visual elements */}
      <div className="absolute top-20 left-20 w-16 h-16 opacity-40 z-10">
        <div className="w-full h-full rounded-full bg-blue-500/10 animate-pulse-slow border border-blue-500/20"></div>
      </div>
      <div className="absolute top-40 right-40 w-24 h-24 opacity-30 z-10">
        <div className="w-full h-full rounded-full bg-blue-400/10 animate-pulse-slow border border-blue-400/20" 
            style={{animationDelay: '1s'}}></div>
      </div>
    </div>
  );
}

export default ConversationFormat;

// Helper function to get character data
function getCharacterData(characterId: string): CharacterData {
  const characterData: Record<string, CharacterData> = {
    'kapoor': {
      name: "Dr. Kapoor",
      title: "Chief Medical Physicist",
      sprite: "/characters/kapoor.png",
      primaryColor: "var(--clinical-color)",
      textClass: "text-clinical-light",
      bgClass: "bg-clinical"
    },
    'jesse': {
      name: "Technician Jesse",
      title: "Equipment Specialist",
      sprite: "/characters/jesse.png",
      primaryColor: "var(--qa-color)",
      textClass: "text-qa-light",
      bgClass: "bg-qa"
    },
    'quinn': {
      name: "Dr. Zephyr Quinn",
      title: "Experimental Researcher",
      sprite: "/characters/quinn.png",
      primaryColor: "var(--educational-color)",
      textClass: "text-educational-light",
      bgClass: "bg-educational"
    },
    'garcia': {
      name: "Dr. Garcia",
      title: "Radiation Oncologist",
      sprite: "/characters/garcia.png",
      primaryColor: "var(--clinical-alt-color)",
      textClass: "text-clinical-light",
      bgClass: "bg-clinical"
    }
  };
  return characterData[characterId] || characterData.kapoor;
}

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

