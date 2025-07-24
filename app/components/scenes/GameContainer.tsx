'use client';

import React, { useCallback } from 'react';
import { useSceneStore, sceneSelectors, GameScene } from '@/app/store/sceneStore';
import { useDialogueStore } from '@/app/store/dialogueStore';
import HospitalBackdrop from '@/app/components/hospital/HospitalBackdrop';
import { SceneNarrativeDialogue, SceneChallengeDialogue } from '@/app/components/scenes/SceneDialogueAdapters';
import TransitionScreen from '@/app/components/ui/TransitionScreen';
import ConstellationView from '@/app/components/knowledge/ConstellationView';
import HomeScene from '@/app/components/scenes/HomeScene';
import ObservatoryScene from '@/app/components/scenes/ObservatoryScene';
import LunchRoomScene from '@/app/components/scenes/LunchRoomScene';
import RoomUIOverlay from '../rooms/RoomUIOverlays';
import TutorialOverlayManager from '@/app/components/tutorial/TutorialOverlay';
import { TutorialModeIndicator } from '@/app/components/tutorial/TutorialControls';
import TutorialActivity from '@/app/components/tutorial/TutorialActivity';
import TestActivity from '@/app/components/test/TestActivity';
import GameDevConsole from '@/app/components/debug/GameDevConsole';
import { DayNightTransition } from '@/app/components/phase/DayNightTransition';

// Main game container that handles scene switching
export default function GameContainer() {
  const currentScene = useSceneStore(sceneSelectors.getCurrentScene);
  const isTransitioning = useSceneStore(sceneSelectors.getIsTransitioning);
  const context = useSceneStore(sceneSelectors.getContext);
  
  // Stabilize the tutorial activity completion callback - MUST be before any conditional returns
  const handleTutorialActivityComplete = useCallback(() => {
    console.log('[GameContainer] Tutorial activity completed, returning to narrative');
    
    // Get the dialogue store state
    const { continueToPostActivityNode, getActiveDialogue, getCurrentNode } = useDialogueStore.getState();
    
    // Continue to the post-activity dialogue node
    continueToPostActivityNode();
    
    // Check dialogue state immediately and return to the previous scene
    const currentDialogue = getActiveDialogue();
    const currentNode = getCurrentNode();
    
    console.log('[GameContainer] Checking dialogue state before returning to narrative:', {
      hasDialogue: !!currentDialogue,
      hasNode: !!currentNode,
    });
    
    if (currentDialogue && currentNode) {
      // We have a valid dialogue state, so just return to the previous scene (narrative)
      console.log('[GameContainer] Valid dialogue state found, calling returnToPrevious()');
      const { returnToPrevious } = useSceneStore.getState();
      returnToPrevious();
    } else {
      // Something is wrong with the dialogue state, return to hospital as a fallback
      console.warn('[GameContainer] No valid dialogue state after activity, returning to hospital');
      const { returnToHospital } = useSceneStore.getState();
      returnToHospital();
    }
  }, []);
  
  // Always render transition screen if transitioning
  if (isTransitioning || currentScene === 'transition') {
    return (
      <>
        <TransitionScreen />
        <TutorialOverlayManager />
        <TutorialModeIndicator />
        <GameDevConsole />
      </>
    );
  }
  
  // Render current scene content
  const renderScene = () => {
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
        
      case 'tutorial_activity':
        return (
          <TutorialActivity
            patientName={context.patientName || 'Mrs. Patterson'}
            mentorId={context.mentorId || 'garcia'}
            roomId={context.roomId || 'physics-office'}
            onComplete={handleTutorialActivityComplete}
          />
        );
        
      case 'test_activity':
        return (
          <TestActivity
            mentorId={context.mentorId || 'jesse'}
            skipIntro={context.skipIntro || false}
            onComplete={() => {
              console.log('[GameContainer] Test activity completed, returning to hospital');
              const { transitionToScene } = useSceneStore.getState();
              transitionToScene('hospital');
            }}
          />
        );
        
      case 'home':
        return <HomeScene />;
        
      case 'observatory':
        return <ObservatoryScene />;
        
      case 'constellation':
        return <ConstellationView />;
        
      case 'lunch-room':
        return <LunchRoomScene />;
        
      default:
        // Fallback to hospital if unknown scene
        console.warn(`Unknown scene: ${currentScene}, falling back to hospital`);
        return <HospitalBackdrop />;
    }
  };
  
  return (
    <>
      {/* Main scene content - ensure it renders below overlays */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        {renderScene()}
      </div>
      
      {/* Global UI Overlays */}
      <DayNightTransition />
      <TutorialOverlayManager />
      <TutorialModeIndicator />
      
      {/* Game Development Console - F2 to toggle */}
      <GameDevConsole />
    </>
  );
}

// Navigation hook for other components to use
export function useSceneNavigation() {
  const { 
    enterActivity, 
    enterNarrative, 
    enterChallenge, 
    enterTutorialActivity,
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
    enterTutorialActivity,
    returnToHospital,
    returnToPrevious,
    
    // State
    canGoBack,
    currentScene,
    
    // Quick navigation helpers
    goToConstellation: () => useSceneStore.getState().transitionToScene('constellation'),
    goToHome: () => useSceneStore.getState().transitionToScene('home'),
    goToObservatory: () => useSceneStore.getState().transitionToScene('observatory'),
    
    // Activity shortcuts
    startNarrativeWithGarcia: (dialogueId?: string) => enterNarrative('garcia', dialogueId),
    startNarrativeWithKapoor: (dialogueId?: string) => enterNarrative('kapoor', dialogueId),
    startNarrativeWithQuinn: (dialogueId?: string) => enterNarrative('quinn', dialogueId),
    startNarrativeWithJesse: (dialogueId?: string) => enterNarrative('jesse', dialogueId),
  };
} 