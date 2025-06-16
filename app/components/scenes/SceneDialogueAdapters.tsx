'use client';

import React from 'react';
import NarrativeDialogue from '@/app/components/dialogue/NarrativeDialogue';
import ChallengeDialogue from '@/app/components/dialogue/ChallengeDialogue';
import { useSceneStore } from '@/app/store/sceneStore';

// Adapter for NarrativeDialogue to work with scene system
interface SceneNarrativeDialogueProps {
  mentorId?: string;
  dialogueId?: string;
  roomId?: string;
}

export function SceneNarrativeDialogue({ mentorId, dialogueId, roomId }: SceneNarrativeDialogueProps) {
  const { returnToPrevious } = useSceneStore();
  
  // Generate a dialogue ID if not provided - prioritize room-specific dialogues
  const effectiveDialogueId = dialogueId || `${roomId}-intro` || `${mentorId}_intro` || 'default_narrative';
  
  const handleComplete = (results: any) => {
    console.log('[SceneNarrativeDialogue] Dialogue completed:', results);
    // Return to previous scene (hospital)
    returnToPrevious();
  };
  
  // If no dialogue exists, show a placeholder
  if (!effectiveDialogueId) {
    return (
      <div style={{
        width: '100vw',
        height: '100vh',
        background: 'linear-gradient(to bottom, #1a1a2e, #16213e, #0f3460)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#e0e6ed',
        fontFamily: 'monospace',
        fontSize: '18px',
        textAlign: 'center'
      }}>
        <div>
          <h2>Narrative Scene</h2>
          <p>Mentor: {mentorId || 'Unknown'}</p>
          <p>Dialogue: {dialogueId || 'Not specified'}</p>
          <button 
            onClick={returnToPrevious}
            style={{
              marginTop: '20px',
              padding: '10px 20px',
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            Return to Hospital
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <NarrativeDialogue 
      dialogueId={effectiveDialogueId}
      onComplete={handleComplete}
      roomId={roomId}
    />
  );
}

// Adapter for ChallengeDialogue to work with scene system  
interface SceneChallengeDialogueProps {
  activityId?: string;
  mentorId?: string;
  roomId?: string;
}

export function SceneChallengeDialogue({ activityId, mentorId, roomId }: SceneChallengeDialogueProps) {
  const { returnToPrevious } = useSceneStore();
  
  // Generate a dialogue ID based on activity - prioritize room-specific challenges
  const effectiveDialogueId = activityId ? `${activityId}_challenge` : `${roomId}-activity_challenge` || `${mentorId}_challenge` || 'default_challenge';
  
  const handleComplete = (results: any) => {
    console.log('[SceneChallengeDialogue] Challenge completed:', results);
    // Return to previous scene (hospital)
    returnToPrevious();
  };
  
  // If no activity, show a placeholder
  if (!effectiveDialogueId) {
    return (
      <div style={{
        width: '100vw',
        height: '100vh',
        background: '#000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#e0e6ed',
        fontFamily: 'monospace',
        fontSize: '18px',
        textAlign: 'center'
      }}>
        <div>
          <h2>Challenge Scene</h2>
          <p>Activity: {activityId || 'Unknown'}</p>
          <p>Mentor: {mentorId || 'Unknown'}</p>
          <button 
            onClick={returnToPrevious}
            style={{
              marginTop: '20px',
              padding: '10px 20px',
              background: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            Return to Hospital
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <ChallengeDialogue 
      dialogueId={effectiveDialogueId}
      onComplete={handleComplete}
      roomId={roomId}
    />
  );
} 