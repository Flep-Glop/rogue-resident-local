'use client';

import React from 'react';
import { useSceneStore, sceneSelectors } from '@/app/store/sceneStore';
import TransitionScreen from '@/app/components/ui/TransitionScreen';
import CombinedHomeScene from '@/app/components/scenes/CombinedHomeScene';
import GameDevConsole from '@/app/components/debug/GameDevConsole';

// Main game container that handles scene switching
export default function GameContainer() {
  const currentScene = useSceneStore(sceneSelectors.getCurrentScene);
  const isTransitioning = useSceneStore(sceneSelectors.getIsTransitioning);
  
  // Always render transition screen if transitioning
  if (isTransitioning || currentScene === 'transition') {
    return (
      <>
        <TransitionScreen />
        <GameDevConsole />
      </>
    );
  }
  
  // Render current scene content
  const renderScene = () => {
    switch (currentScene) {
      case 'hospital':
      case 'home':
      case 'observatory':
      default:
        // All scenes now use CombinedHomeScene
        return <CombinedHomeScene />;
    }
  };
  
  return (
    <>
      {/* Main scene content */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        {renderScene()}
      </div>
      
      {/* Game Development Console - F2 to toggle */}
      <GameDevConsole />
    </>
  );
}

// Navigation hook for other components to use
export function useSceneNavigation() {
  const { 
    returnToHospital, 
    returnToPrevious 
  } = useSceneStore();
  
  const canGoBack = useSceneStore(sceneSelectors.getCanGoBack);
  const currentScene = useSceneStore(sceneSelectors.getCurrentScene);
  
  return {
    // Scene transitions
    returnToHospital,
    returnToPrevious,
    
    // State
    canGoBack,
    currentScene,
    
    // Quick navigation helpers
    goToHome: () => useSceneStore.getState().transitionToScene('home'),
  };
}
