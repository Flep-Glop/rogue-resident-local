'use client';

import React, { useMemo, useEffect, useState, useRef } from 'react';
import styled from 'styled-components';
import { TitleScreen } from './components/phase/TitleScreen';
import { Prologue } from './components/phase/Prologue';
import { DayPhase } from './components/phase/DayPhase';
import { NightPhase } from './components/phase/NightPhase';
import { useGameStore } from './store/gameStore';
import { GamePhase } from './types';
import DebugPanel from './components/ui/DebugPanel';
import { useLoading } from './providers/LoadingProvider';

const PageContainer = styled.div`
  min-height: 100vh;
  width: 100%;
`;

// Game component that renders the appropriate phase based on the game state
const Game: React.FC = () => {
  const currentPhase = useGameStore(state => state.currentPhase);
  const { startLoading, stopLoading, isLoading } = useLoading();
  const [displayPhase, setDisplayPhase] = useState<GamePhase>(currentPhase);
  const phaseChangeInProgressRef = useRef(false);
  
  // Handle phase transitions with loading screen
  useEffect(() => {
    // If the current displayed phase is already what we want, do nothing
    if (displayPhase === currentPhase || phaseChangeInProgressRef.current) {
      return;
    }
    
    const handlePhaseChange = async () => {
      try {
        // Set flag to prevent multiple transitions at once
        phaseChangeInProgressRef.current = true;
        
        // Start loading animation and wait for it to complete
        console.log('Starting loading transition for phase change...');
        await startLoading();
        
        // After loading animation finishes, update the displayed phase
        console.log('Setting display phase to:', currentPhase);
        setDisplayPhase(currentPhase);
        
        // Small delay to ensure component rendering
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Stop loading animation
        console.log('Stopping loading transition');
        stopLoading();
      } catch (error) {
        console.error('Error during phase transition:', error);
        stopLoading();
      } finally {
        // Clear flag when done
        phaseChangeInProgressRef.current = false;
      }
    };
    
    handlePhaseChange();
  }, [currentPhase, displayPhase, startLoading, stopLoading]);
  
  // Use useMemo to prevent unnecessary re-renders
  return useMemo(() => {
    // Render the appropriate component based on the current game phase
    switch (displayPhase) {
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
  }, [displayPhase]); // Only re-render when displayPhase changes
};

export default function Home() {
  return (
    <PageContainer>
      <Game />
      <DebugPanel />
    </PageContainer>
  );
}
