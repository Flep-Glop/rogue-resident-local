'use client';

import React, { useMemo, useEffect, useState, useRef } from 'react';
import styled from 'styled-components';
import { TitleScreen } from './components/phase/TitleScreen';
import { NightPhase } from './components/phase/NightPhase';
import { useGameStore } from './store/gameStore';
import { GamePhase } from './types';
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
        console.log(`[Page.tsx] Phase transition: ${displayPhase} → ${currentPhase}`);
        await startLoading();
        
        // After loading animation finishes, update the displayed phase
        setDisplayPhase(currentPhase);
        
        // Small delay to ensure component rendering
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Stop loading animation
        stopLoading();
      } catch (error) {
        console.error('[Page.tsx] Error during phase transition:', error);
        stopLoading();
      } finally {
        // Clear flag when done
        phaseChangeInProgressRef.current = false;
      }
    };
    
    handlePhaseChange();
  }, [currentPhase, displayPhase, startLoading, stopLoading]);
  
  // Render the appropriate component based on the current game phase
  switch (displayPhase) {
    case GamePhase.TITLE:
      return <TitleScreen />;
    case GamePhase.NIGHT:
      return <NightPhase />;
    default:
      return <TitleScreen />;
  }
};

export default function Home() {
  return (
    <PageContainer>
      <Game />
    </PageContainer>
  );
}
