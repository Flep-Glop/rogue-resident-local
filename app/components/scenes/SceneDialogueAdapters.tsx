'use client';

import React, { useCallback, useRef, useEffect } from 'react';
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
  
  // Scene narrative dialogue initialized
  
  // Flag to prevent multiple cafeteria overlay timeouts
  const cafeteriaOverlayTriggered = useRef(false);
  
  // Reset the flag when component unmounts
  useEffect(() => {
    return () => {
      cafeteriaOverlayTriggered.current = false;
    };
  }, []);
  
  // Reset the flag when dialogue changes
  useEffect(() => {
    cafeteriaOverlayTriggered.current = false;
  }, [effectiveDialogueId]);
  
  const handleComplete = useCallback((results: any) => {
    console.log('[SceneNarrativeDialogue] Dialogue completed:', results);
    
    // Check if this was the tutorial physics office dialogue
    if (effectiveDialogueId === 'tutorial_physics_office_intro') {
      // Prevent multiple overlay triggers
      if (cafeteriaOverlayTriggered.current) {
        console.log('[SceneNarrativeDialogue] Cafeteria overlay already triggered, skipping duplicate');
        return;
      }
      
      cafeteriaOverlayTriggered.current = true;
      
      // For tutorial physics office, go directly to hospital (not previous scene)
      console.log('[SceneNarrativeDialogue] Tutorial physics office complete, returning to hospital');
      const { returnToHospital } = useSceneStore.getState();
      returnToHospital();
      
      // Set tutorial step to enable lunch dialogue and show overlay
      import('@/app/store/tutorialStore').then(({ useTutorialStore }) => {
        const tutorialStore = useTutorialStore.getState();
        
        // Short delay to let scene transition complete
        setTimeout(() => {
          // Set the tutorial step to enable lunch dialogue
          console.log('[SceneNarrativeDialogue] Setting tutorial step to lunch_dialogue');
          tutorialStore.skipToStep('lunch_dialogue');
          
          // Show the cafeteria overlay
          tutorialStore.showOverlay({
            id: 'guide_lunch_dialogue',
            type: 'tooltip',
            title: 'Cafeteria Interactions',
            content: 'Informal conversations with mentors are just as valuable as formal activities.',
            position: { x: 500, y: 150 },
            dismissable: true
          });
        }, 1000);
      });
    } else if (effectiveDialogueId === 'tutorial_jesse_equipment_path' || effectiveDialogueId === 'tutorial_kapoor_precision_path') {
      // For Jesse/Kapoor activities, return to hospital - tutorial step will advance automatically
      console.log('[SceneNarrativeDialogue] Tutorial activity path complete, returning to hospital');
      const { returnToHospital } = useSceneStore.getState();
      returnToHospital();
      
      // Don't manually set tutorial step - let the dialogue option tutorialStepCompletion handle it
    } else {
      // For other dialogues, use normal return to previous scene
      returnToPrevious();
    }
  }, [effectiveDialogueId, returnToPrevious]);
  
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
  
  const handleComplete = useCallback((results: any) => {
    console.log('[SceneChallengeDialogue] Challenge completed:', results);
    // Return to previous scene (hospital)
    returnToPrevious();
  }, [returnToPrevious]);
  
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