'use client';

import { useState, useEffect } from 'react';
import { useDialogueStore } from '@/app/store/dialogueStore';
import { DialogueOption, DialogueMode } from '@/app/types';
import { useKnowledgeStore } from '@/app/store/knowledgeStore';
import Image from 'next/image';
import SpriteImage from '../ui/SpriteImage';
import { getPortraitCoordinates, SPRITE_SHEETS } from '@/app/utils/spriteMap';
import NarrativeDialogue from './NarrativeDialogue';
import ChallengeDialogue from './ChallengeDialogue';

interface DialogueResult {
  dialogueId: string;
  completed: boolean;
}

interface DialogueContainerProps {
  dialogueId: string;
  onComplete?: (results: DialogueResult) => void;
}

export default function DialogueContainer({ dialogueId, onComplete }: DialogueContainerProps) {
  const { getDialogue } = useDialogueStore();
  
  // Get the dialogue to determine its mode
  const dialogue = getDialogue(dialogueId);
  
  // If no dialogue found, show error
  if (!dialogue) {
    return (
      <div style={{ 
        position: 'absolute', 
        top: '50%', 
        left: '50%', 
        transform: 'translate(-50%, -50%)',
        color: '#ff6b6b',
        fontSize: '18px',
        fontFamily: 'monospace'
      }}>
        Dialogue "{dialogueId}" not found
      </div>
    );
  }
  
  // Route to appropriate dialogue component based on mode
  switch (dialogue.mode) {
    case DialogueMode.NARRATIVE:
      return <NarrativeDialogue dialogueId={dialogueId} onComplete={onComplete} />;
    
    case DialogueMode.CHALLENGE:
      return <ChallengeDialogue dialogueId={dialogueId} onComplete={onComplete} />;
    
    default:
      // Fallback to narrative mode for backwards compatibility
      return <NarrativeDialogue dialogueId={dialogueId} onComplete={onComplete} />;
  }
} 