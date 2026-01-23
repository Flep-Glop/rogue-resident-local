'use client';

import React, { useState, useEffect, useRef } from 'react';
import styled, { keyframes } from 'styled-components';
import { TitleScreen } from './components/screens/TitleScreen';
import { CharacterCreatorScreen } from './components/screens/CharacterCreatorScreen';
import CombinedHomeScene from './components/game/CombinedHomeScene';
import { useGameStore, GamePhase } from './store/gameStore';

const PageContainer = styled.div`
  min-height: 100vh;
  width: 100%;
`;

// Loading overlay - simple fade to/from black
const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const LoadingOverlay = styled.div<{ $visible: boolean }>`
  position: fixed;
  inset: 0;
  background: black;
  z-index: 9999;
  display: flex;
  justify-content: center;
  align-items: center;
  pointer-events: ${props => props.$visible ? 'all' : 'none'};
  opacity: ${props => props.$visible ? 1 : 0};
  transition: opacity 0.5s ease-out;
`;

const LoadingText = styled.div`
  font-family: var(--font-press-start-2p), monospace;
  color: white;
  font-size: 14px;
  animation: ${fadeIn} 0.3s ease-out;
`;

// Game component with built-in loading transition
const Game: React.FC = () => {
  const gamePhase = useGameStore(state => state.gamePhase);
  const [displayPhase, setDisplayPhase] = useState<GamePhase | 'loading'>(gamePhase);
  const prevPhaseRef = useRef(gamePhase);

  // Handle transition when gamePhase changes
  useEffect(() => {
    if (prevPhaseRef.current === gamePhase) return;
    const prevPhase = prevPhaseRef.current;
    prevPhaseRef.current = gamePhase;

    // Character creator handles its own fade transitions
    // Only show loading overlay for title <-> playing transitions
    if (gamePhase === 'character_creator' || prevPhase === 'character_creator') {
      // Direct transition - character creator handles its own fade
      setDisplayPhase(gamePhase);
    } else {
      // Show loading screen for other transitions
      setDisplayPhase('loading');
      const timer = setTimeout(() => {
        setDisplayPhase(gamePhase);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [gamePhase]);

  return (
    <>
      {/* Loading overlay */}
      <LoadingOverlay $visible={displayPhase === 'loading'}>
        <LoadingText>Loading...</LoadingText>
      </LoadingOverlay>

      {/* Render appropriate screen */}
      {displayPhase === 'title' && <TitleScreen />}
      {displayPhase === 'character_creator' && <CharacterCreatorScreen />}
      {displayPhase === 'playing' && <CombinedHomeScene />}
    </>
  );
};

export default function Home() {
  return (
    <PageContainer>
      <Game />
    </PageContainer>
  );
}
