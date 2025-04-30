'use client';

import { useState, useEffect } from 'react';
import DialogueContainer from './DialogueContainer';
import { useTimeStore } from '@/app/store/timeStore';
import { centralEventBus } from '@/app/core/events/CentralEventBus';
import { GameEventType } from '@/app/types';

interface DialogueActivityProps {
  dialogueId: string;
  duration?: number; // Default duration in minutes
  onComplete?: (results: any) => void;
}

export default function DialogueActivity({
  dialogueId,
  duration = 60,
  onComplete
}: DialogueActivityProps) {
  const [results, setResults] = useState<any | null>(null);
  const advanceTime = useTimeStore(state => state.advanceTime);
  
  // Handle dialogue completion
  const handleDialogueComplete = (dialogueResults: any) => {
    setResults(dialogueResults);
    
    // Advance time when dialogue is complete
    advanceTime(duration, `dialogue_activity:${dialogueId}`);
    
    // Dispatch activity completed event
    centralEventBus.safeDispatch(
      GameEventType.ACTIVITY_COMPLETED,
      {
        activityType: 'dialogue',
        dialogueId,
        results: dialogueResults
      },
      'DialogueActivity.handleDialogueComplete'
    );
    
    // Call parent onComplete if provided
    if (onComplete) {
      onComplete({
        ...dialogueResults,
        duration
      });
    }
  };
  
  // If we have results, show completion
  if (results) {
    return (
      <div className="animate-fadeIn">
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 max-w-3xl mx-auto shadow-lg text-center">
          <h3 className="text-xl font-semibold text-white mb-2">
            Dialogue Complete
          </h3>
          <p className="text-slate-300 mb-4">
            You've completed this conversation. Time passes...
          </p>
          <div className="text-amber-400 font-mono">
            +{duration} minutes
          </div>
        </div>
      </div>
    );
  }
  
  // Otherwise show dialogue
  return (
    <div className="animate-fadeIn">
      <DialogueContainer
        dialogueId={dialogueId}
        onComplete={handleDialogueComplete}
      />
    </div>
  );
} 