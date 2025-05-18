'use client';

import { useState, useEffect } from 'react';
import { useDialogueStore } from '@/app/store/dialogueStore';
import { DialogueOption } from '@/app/types';
import { useKnowledgeStore } from '@/app/store/knowledgeStore';
import Image from 'next/image';
import SpriteImage from '../ui/SpriteImage';
import { getPortraitCoordinates, SPRITE_SHEETS } from '@/app/utils/spriteMap';

interface DialogueResult {
  dialogueId: string;
  completed: boolean;
}

interface DialogueContainerProps {
  dialogueId: string;
  onComplete?: (results: DialogueResult) => void;
}

export default function DialogueContainer({ dialogueId, onComplete }: DialogueContainerProps) {
  const [initialized, setInitialized] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typedText, setTypedText] = useState('');
  const [currentCharIndex, setCurrentCharIndex] = useState(0);
  const typingSpeed = 30; // ms per character
  
  // Dialogue store selectors
  const {
    startDialogue,
    getCurrentNode,
    getActiveDialogue,
    getAvailableOptions,
    selectOption,
    endDialogue,
    getMentor
  } = useDialogueStore();
  
  // Get current dialogue state
  const currentNode = getCurrentNode();
  const activeDialogue = getActiveDialogue();
  const availableOptions = getAvailableOptions();
  
  // Knowledge store for checking star requirements
  const stars = useKnowledgeStore(state => state.stars);
  
  // Start dialogue when component mounts
  useEffect(() => {
    if (!initialized) {
      startDialogue(dialogueId);
      setInitialized(true);
    }
  }, [dialogueId, initialized, startDialogue]);
  
  // Type out text effect
  useEffect(() => {
    if (!currentNode) return;
    
    setIsTyping(true);
    setTypedText('');
    setCurrentCharIndex(0);
    
    const text = currentNode.text;
    const intervalId = setInterval(() => {
      if (currentCharIndex < text.length) {
        setTypedText(prev => prev + text[currentCharIndex]);
        setCurrentCharIndex(prev => prev + 1);
      } else {
        setIsTyping(false);
        clearInterval(intervalId);
      }
    }, typingSpeed);
    
    return () => clearInterval(intervalId);
  }, [currentNode, currentCharIndex]);
  
  // Handle dialogue completion
  useEffect(() => {
    if (initialized && !currentNode && onComplete) {
      onComplete({
        dialogueId,
        completed: true
      });
    }
  }, [currentNode, dialogueId, initialized, onComplete]);
  
  // Skip typing animation
  const handleSkipTyping = () => {
    if (isTyping && currentNode) {
      setTypedText(currentNode.text);
      setCurrentCharIndex(currentNode.text.length);
      setIsTyping(false);
    }
  };
  
  // Handle selecting an option
  const handleSelectOption = (option: DialogueOption) => {
    if (option.id) {
      selectOption(option.id);
    }
  };
  
  // Cancel dialogue
  const handleCancel = () => {
    endDialogue();
    if (onComplete) {
      onComplete({
        dialogueId,
        completed: false
      });
    }
  };
  
  // Check if option should be disabled
  const isOptionDisabled = (option: DialogueOption) => {
    if (!option.requiredStarId) return false;
    
    const star = stars[option.requiredStarId];
    return !star || !star.active;
  };
  
  // If dialogue not initialized or no current node, show loading
  if (!initialized || !currentNode || !activeDialogue) {
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 max-w-3xl mx-auto shadow-lg animate-pulse">
        <div className="h-6 bg-slate-700 rounded w-3/4 mb-4"></div>
        <div className="h-4 bg-slate-700 rounded w-1/2 mb-2"></div>
        <div className="h-4 bg-slate-700 rounded w-5/6 mb-2"></div>
        <div className="h-4 bg-slate-700 rounded w-2/3 mb-6"></div>
        <div className="h-10 bg-slate-700 rounded w-1/3"></div>
      </div>
    );
  }
  
  // Get the current mentor
  const mentor = getMentor(currentNode.mentorId);
  
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 max-w-3xl mx-auto shadow-lg">
      {/* Dialogue header with mentor info */}
      <div className="flex items-center mb-4">
        {mentor && (
          <>
            <div className="w-12 h-12 rounded-full bg-slate-700 overflow-hidden mr-3 flex items-center justify-center">
              <SpriteImage
                src={SPRITE_SHEETS.detailedPortraits}
                coordinates={getPortraitCoordinates(mentor.id as any, 'detailed')}
                alt={mentor.name}
                scale={1.5}
              />
            </div>
            <div>
              <h3 className="font-bold text-white">{mentor.name}</h3>
              <p className="text-sm text-slate-400">{mentor.title}</p>
            </div>
          </>
        )}
        <div className="ml-auto">
          <span className="text-xs bg-slate-700 px-2 py-1 rounded text-slate-300">
            {activeDialogue.title}
          </span>
        </div>
      </div>
      
      {/* Dialogue text with typing effect */}
      <div 
        className="bg-slate-900 border border-slate-700 rounded-lg p-4 mb-4 min-h-[100px]"
        onClick={handleSkipTyping}
      >
        <p className="text-slate-300 leading-relaxed">
          {typedText}
          {isTyping && <span className="animate-pulse">▋</span>}
        </p>
      </div>
      
      {/* Options */}
      <div className="space-y-2">
        {!isTyping && availableOptions.map((option) => (
          <button
            key={option.id}
            onClick={() => handleSelectOption(option)}
            disabled={isOptionDisabled(option)}
            className={`w-full text-left p-3 rounded-lg border ${
              isOptionDisabled(option)
                ? 'bg-slate-800 border-slate-700 text-slate-500 cursor-not-allowed'
                : 'bg-slate-700 border-slate-600 text-white hover:bg-slate-600 transition-colors'
            }`}
          >
            <div className="flex items-center">
              <span>{option.text}</span>
              {/* Show resource effects if any */}
              <div className="ml-auto flex space-x-2">
                {option.insightChange !== undefined && option.insightChange !== 0 && (
                  <span className={`text-xs px-1 rounded ${
                    option.insightChange > 0 ? 'text-emerald-400' : 'text-red-400'
                  }`}>
                    {option.insightChange > 0 ? '+' : ''}{option.insightChange} ◆
                  </span>
                )}
                {option.momentumChange !== undefined && option.momentumChange !== 0 && (
                  <span className={`text-xs px-1 rounded ${
                    option.momentumChange > 0 ? 'text-amber-400' : 'text-red-400'
                  }`}>
                    {option.momentumChange > 0 ? '+' : ''}{option.momentumChange} ⚡
                  </span>
                )}
                {option.relationshipChange !== undefined && option.relationshipChange !== 0 && (
                  <span className={`text-xs px-1 rounded ${
                    option.relationshipChange > 0 ? 'text-blue-400' : 'text-red-400'
                  }`}>
                    {option.relationshipChange > 0 ? '+' : ''}{option.relationshipChange} 👥
                  </span>
                )}
              </div>
            </div>
            
            {/* Show lock icon for disabled options */}
            {isOptionDisabled(option) && (
              <div className="mt-1 text-xs text-slate-500 flex items-center">
                <span className="mr-1">🔒</span>
                <span>Requires knowledge in this area</span>
              </div>
            )}
          </button>
        ))}
      </div>
      
      {/* Cancel button */}
      <div className="mt-4 text-center">
        <button
          onClick={handleCancel}
          className="text-xs text-slate-400 hover:text-slate-300 transition-colors"
        >
          Cancel dialogue
        </button>
      </div>
    </div>
  );
} 