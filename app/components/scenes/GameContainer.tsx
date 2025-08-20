'use client';

import React, { useCallback } from 'react';
import { useSceneStore, sceneSelectors, GameScene } from '@/app/store/sceneStore';
import { useDialogueStore } from '@/app/store/dialogueStore';
import { useGameStore } from '@/app/store/gameStore';
import HospitalBackdrop from '@/app/components/hospital/HospitalBackdrop';
import { SceneNarrativeDialogue, SceneChallengeDialogue } from '@/app/components/scenes/SceneDialogueAdapters';
import TransitionScreen from '@/app/components/ui/TransitionScreen';
import ConstellationView from '@/app/components/knowledge/ConstellationView';
import CombinedHomeScene from '@/app/components/scenes/CombinedHomeScene';
import LunchRoomScene from '@/app/components/scenes/LunchRoomScene';
import RoomUIOverlay from '../rooms/RoomUIOverlays';
import TutorialOverlayManager from '@/app/components/tutorial/TutorialOverlay';
import { TutorialModeIndicator } from '@/app/components/tutorial/TutorialControls';
import TutorialActivity from '@/app/components/tutorial/TutorialActivity';
import QuinnTutorialActivity from '@/app/components/tutorial/QuinnTutorialActivity';
import Day2QuinnActivity from '@/app/components/tutorial/Day2QuinnActivity';

import GameDevConsole from '@/app/components/debug/GameDevConsole';
import { DayNightTransition } from '@/app/components/phase/DayNightTransition';

// Main game container that handles scene switching
export default function GameContainer() {
  const currentScene = useSceneStore(sceneSelectors.getCurrentScene);
  const isTransitioning = useSceneStore(sceneSelectors.getIsTransitioning);
  const context = useSceneStore(sceneSelectors.getContext);
  const { daysPassed } = useGameStore();
  
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
        // Use different Quinn activities based on day, regular TutorialActivity for others
        if (context.mentorId === 'quinn') {
          // Day 2+ uses advanced Quinn activity
          if (daysPassed >= 1) {
            return (
              <Day2QuinnActivity
                onComplete={handleTutorialActivityComplete}
              />
            );
          } else {
            // Day 1 uses original Quinn tutorial
            return (
              <QuinnTutorialActivity
                onComplete={handleTutorialActivityComplete}
                debugReportCard={context.debugReportCard}
              />
            );
          }
        } else {
          return (
            <TutorialActivity
              patientName={context.patientName || 'Mrs. Patterson'}
              mentorId={context.mentorId || 'garcia'}
              roomId={context.roomId || 'physics-office'}
              onComplete={handleTutorialActivityComplete}
            />
          );
        }
        
      case 'test_activity':
        // Test activity has been removed - redirect to hospital
        console.warn('[GameContainer] test_activity scene no longer exists, redirecting to hospital');
        return <HospitalBackdrop />;
        
      case 'home':
        return <CombinedHomeScene />;
        
      case 'observatory':
        // Legacy support: redirect to combined home scene
        return <CombinedHomeScene />;
        
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
    goToObservatory: () => useSceneStore.getState().transitionToScene('home'), // Legacy: redirects to combined home
    
    // Activity shortcuts
    startNarrativeWithGarcia: (dialogueId?: string) => enterNarrative('garcia', dialogueId),
    startNarrativeWithKapoor: (dialogueId?: string) => enterNarrative('kapoor', dialogueId),
    startNarrativeWithQuinn: (dialogueId?: string) => enterNarrative('quinn', dialogueId),
    startNarrativeWithJesse: (dialogueId?: string) => enterNarrative('jesse', dialogueId),
  };
} 