'use client';

import React, { useMemo } from 'react';
import styled from 'styled-components';
import { TitleScreen } from './components/phase/TitleScreen';
import { Prologue } from './components/phase/Prologue';
import { DayPhase } from './components/phase/DayPhase';
import { NightPhase } from './components/phase/NightPhase';
import { useGameStore } from './store/gameStore';
import { GamePhase } from './types';
import DebugPanel from './components/ui/DebugPanel';

const PageContainer = styled.div`
  min-height: 100vh;
  width: 100%;
`;

// Game component that renders the appropriate phase based on the game state
const Game: React.FC = () => {
  const currentPhase = useGameStore(state => state.currentPhase);
  
  // Use useMemo to prevent unnecessary re-renders
  return useMemo(() => {
    // Render the appropriate component based on the current game phase
    switch (currentPhase) {
      case GamePhase.TITLE:
        return <TitleScreen />;
      case GamePhase.PROLOGUE:
        return <Prologue />;
      case GamePhase.DAY:
        return <DayPhase />;
      case GamePhase.NIGHT:
        return <NightPhase />;
      default:
        return <TitleScreen />;
    }
  }, [currentPhase]); // Only re-render when currentPhase changes
};

export default function Home() {
  return (
    <PageContainer>
      <Game />
      <DebugPanel />
    </PageContainer>
  );
}
