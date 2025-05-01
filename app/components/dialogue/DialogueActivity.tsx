'use client';

import React from 'react';
import { styled } from 'styled-components';
import DialogueContainer from './DialogueContainer';
import { useGameStore } from '@/app/store/gameStore';
import { centralEventBus } from '@/app/core/events/CentralEventBus';
import { GameEventType } from '@/app/types';

interface DialogueResult {
  responses: Record<string, string>;
  choices: Record<string, string>;
}

interface DialogueActivityProps {
  activityId: string;
  dialogueId: string;
  duration: number;
  onComplete?: (results: DialogueResult) => void;
}

const DialogueActivityContainer = styled.div`
  width: 100%;
  height: 100%;
  position: relative;
`;

export const DialogueActivity: React.FC<DialogueActivityProps> = ({ 
  activityId, 
  dialogueId, 
  duration, 
  onComplete 
}) => {
  // Get advanceTime function from gameStore
  const advanceTime = useGameStore(state => state.advanceTime);
  
  // Handle dialogue completion
  const handleDialogueComplete = (results: DialogueResult) => {
    // Advance time when dialogue is complete
    advanceTime(duration);
    
    // Dispatch activity completed event
    centralEventBus.dispatch(
      GameEventType.ACTIVITY_COMPLETED,
      {
        activityId,
        dialogueId,
        results
      },
      'DialogueActivity.handleDialogueComplete'
    );
    
    // Call onComplete callback
    if (onComplete) {
      onComplete(results);
    }
  };
  
  return (
    <DialogueActivityContainer>
      <DialogueContainer 
        dialogueId={dialogueId}
        onComplete={handleDialogueComplete}
      />
    </DialogueActivityContainer>
  );
}; 