'use client';

import React, { useEffect } from 'react';
import { useGameStore } from '@/app/store/gameStore';
import { useSceneStore } from '@/app/store/sceneStore';
import GameContainer from '@/app/components/scenes/GameContainer';

export const NightPhase: React.FC = () => {
  const setHasVisitedNightPhase = useGameStore(state => state.setHasVisitedNightPhase);
  const { setSceneDirectly } = useSceneStore();

  // Initialize the night phase with the home scene
  useEffect(() => {
    setHasVisitedNightPhase(true);
    // Set scene to 'home' which shows the combined home/constellation view
    setSceneDirectly('home');
  }, [setHasVisitedNightPhase, setSceneDirectly]);

  // Render the GameContainer which handles all scene routing
  return <GameContainer />;
};