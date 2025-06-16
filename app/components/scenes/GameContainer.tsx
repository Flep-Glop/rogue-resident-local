'use client';

import React from 'react';
import { useSceneStore, sceneSelectors, GameScene } from '@/app/store/sceneStore';
import HospitalBackdrop from '@/app/components/hospital/HospitalBackdrop';
import { SceneNarrativeDialogue, SceneChallengeDialogue } from '@/app/components/scenes/SceneDialogueAdapters';
import TransitionScreen from '@/app/components/ui/TransitionScreen';
import ConstellationView from '@/app/components/knowledge/ConstellationView';
import RoomUIOverlay from '../rooms/RoomUIOverlays';

// Main game container that handles scene switching
export default function GameContainer() {
  const currentScene = useSceneStore(sceneSelectors.getCurrentScene);
  const isTransitioning = useSceneStore(sceneSelectors.getIsTransitioning);
  const context = useSceneStore(sceneSelectors.getContext);
  
  // Always render transition screen if transitioning
  if (isTransitioning || currentScene === 'transition') {
    return <TransitionScreen />;
  }
  
  // Render appropriate scene based on current state
  switch (currentScene) {
    case 'hospital':
      return <HospitalBackdrop />;
      
    case 'narrative':
      return (
        <SceneNarrativeDialogue 
          mentorId={context.mentorId}
          dialogueId={context.dialogueId}
          roomId={context.roomId}
        />
      );
      
    case 'challenge':
      return (
        <SceneChallengeDialogue 
          activityId={context.activityId}
          mentorId={context.mentorId}
          roomId={context.roomId}
        />
      );
      
    case 'constellation':
      return <ConstellationView />;
      
    default:
      // Fallback to hospital if unknown scene
      console.warn(`Unknown scene: ${currentScene}, falling back to hospital`);
      return <HospitalBackdrop />;
  }
}

// Navigation hook for other components to use
export function useSceneNavigation() {
  const { 
    enterActivity, 
    enterNarrative, 
    enterChallenge, 
    returnToHospital, 
    returnToPrevious 
  } = useSceneStore();
  
  const canGoBack = useSceneStore(sceneSelectors.getCanGoBack);
  const currentScene = useSceneStore(sceneSelectors.getCurrentScene);
  
  return {
    // Scene transitions
    enterActivity,
    enterNarrative, 
    enterChallenge,
    returnToHospital,
    returnToPrevious,
    
    // State
    canGoBack,
    currentScene,
    
    // Quick navigation helpers
    goToConstellation: () => useSceneStore.getState().transitionToScene('constellation'),
    
    // Activity shortcuts
    startNarrativeWithGarcia: (dialogueId?: string) => enterNarrative('garcia', dialogueId),
    startNarrativeWithKapoor: (dialogueId?: string) => enterNarrative('kapoor', dialogueId),
    startNarrativeWithQuinn: (dialogueId?: string) => enterNarrative('quinn', dialogueId),
    startNarrativeWithJesse: (dialogueId?: string) => enterNarrative('jesse', dialogueId),
  };
} 