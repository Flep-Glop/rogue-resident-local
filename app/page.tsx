'use client';

import React, { useState, useEffect, useRef } from 'react';
import styled, { keyframes } from 'styled-components';
import { TitleScreen } from './components/screens/TitleScreen';
import CombinedHomeScene from './components/game/CombinedHomeScene';
import { useGameStore } from './store/gameStore';

const PageContainer = styled.div`
  min-height: 100vh;
  width: 100%;
`;

// Loading overlay - simple fade to/from black
const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const LoadingOverlay = styled.div<{ $visible: boolean; $fadeOut: boolean }>`
  position: fixed;
  inset: 0;
  background: black;
  z-index: 9999;
  display: flex;
  justify-content: center;
  align-items: center;
  pointer-events: ${props => props.$visible ? 'all' : 'none'};
  opacity: ${props => props.$visible ? 1 : 0};
  transition: opacity 0.3s ease-out;
`;

const LoadingText = styled.div`
  font-family: var(--font-press-start-2p), monospace;
  color: white;
  font-size: 14px;
  animation: ${fadeIn} 0.3s ease-out;
`;

// Game component with built-in loading transition
const Game: React.FC = () => {
  const isPlaying = useGameStore(state => state.isPlaying);
  const [displayState, setDisplayState] = useState<'title' | 'loading' | 'game'>(
    isPlaying ? 'game' : 'title'
  );
  const prevPlayingRef = useRef(isPlaying);

  // Handle transition when isPlaying changes
  useEffect(() => {
    if (prevPlayingRef.current === isPlaying) return;
    prevPlayingRef.current = isPlaying;

    // Show loading screen
    setDisplayState('loading');

    // After brief loading, show target screen
    const timer = setTimeout(() => {
      setDisplayState(isPlaying ? 'game' : 'title');
    }, 800);

    return () => clearTimeout(timer);
  }, [isPlaying]);

  return (
    <>
      {/* Loading overlay */}
      <LoadingOverlay $visible={displayState === 'loading'} $fadeOut={false}>
        <LoadingText>Loading...</LoadingText>
      </LoadingOverlay>

      {/* Render appropriate screen */}
      {displayState === 'title' && <TitleScreen />}
      {displayState === 'game' && <CombinedHomeScene />}
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
