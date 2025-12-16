'use client';

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useSceneStore } from '@/app/store/sceneStore';
import { useGameStore } from '@/app/store/gameStore';
import { useResourceStore } from '@/app/store/resourceStore';

// Simplified debug console - press F2 to toggle
// Most scenarios removed during cleanup - see CLEANUP_PLAN.md

const ConsoleOverlay = styled.div<{ $visible: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  z-index: 10000;
  display: ${props => props.$visible ? 'flex' : 'none'};
  flex-direction: column;
  padding: 20px;
  font-family: monospace;
  color: #00ff00;
`;

const Title = styled.h1`
  margin: 0 0 20px 0;
  font-size: 24px;
  color: #00ff00;
`;

const Section = styled.div`
  margin-bottom: 20px;
`;

const SectionTitle = styled.h2`
  font-size: 16px;
  margin: 0 0 10px 0;
  color: #ffff00;
`;

const Button = styled.button`
  background: #333;
  color: #00ff00;
  border: 1px solid #00ff00;
  padding: 8px 16px;
  margin: 4px;
  cursor: pointer;
  font-family: monospace;

  &:hover {
    background: #00ff00;
    color: #000;
  }
`;

const Info = styled.div`
  font-size: 12px;
  color: #888;
  margin-top: 20px;
`;

export default function GameDevConsole() {
  const [visible, setVisible] = useState(false);
  
  // Toggle with F2
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        setVisible(v => !v);
      }
      if (e.key === 'Escape' && visible) {
        setVisible(false);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [visible]);
  
  const handleBeforeDesk = () => {
    localStorage.setItem('debug_skip_to_desk', 'true');
    localStorage.removeItem('debug_skip_to_cutscene');
    localStorage.removeItem('debug_after_cutscene');
    window.location.reload();
  };
  
  const handleBeforeCutscene = () => {
    localStorage.removeItem('debug_skip_to_desk');
    localStorage.setItem('debug_skip_to_cutscene', 'true');
    localStorage.removeItem('debug_after_cutscene');
    window.location.reload();
  };
  
  const handleAfterCutscene = () => {
    localStorage.removeItem('debug_skip_to_desk');
    localStorage.removeItem('debug_skip_to_cutscene');
    localStorage.setItem('debug_after_cutscene', 'true');
    window.location.reload();
  };
  
  const handleClearDebug = () => {
    localStorage.removeItem('debug_skip_to_desk');
    localStorage.removeItem('debug_skip_to_cutscene');
    localStorage.removeItem('debug_after_cutscene');
    console.log('Debug flags cleared');
  };
  
  const handleAddResources = () => {
      const resourceStore = useResourceStore.getState();
    resourceStore.updateInsight(100, 'debug');
    resourceStore.updateStarPoints(50, 'debug');
    console.log('Added 100 insight, 50 star points');
  };
  
  const handleResetGame = () => {
    handleClearDebug();
    window.location.reload();
  };
  
  if (!visible) return null;

  return (
    <ConsoleOverlay $visible={visible}>
      <Title>🎮 Game Dev Console (F2 to toggle)</Title>
      
      <Section>
        <SectionTitle>Debug States (will reload page)</SectionTitle>
        <Button onClick={handleBeforeDesk}>Before Desk</Button>
        <Button onClick={handleBeforeCutscene}>Before Cutscene</Button>
        <Button onClick={handleAfterCutscene}>After Cutscene</Button>
      </Section>
      
      <Section>
        <SectionTitle>Quick Actions</SectionTitle>
        <Button onClick={handleAddResources}>Add Resources (+100 insight, +50 SP)</Button>
        <Button onClick={handleClearDebug}>Clear Debug Flags</Button>
        <Button onClick={handleResetGame}>Reset Game</Button>
      </Section>
      
      <Section>
        <SectionTitle>Current State</SectionTitle>
        <div>Phase: {useGameStore.getState().currentPhase}</div>
        <div>Scene: {useSceneStore.getState().currentScene}</div>
        <div>Insight: {useResourceStore.getState().insight}</div>
        <div>Star Points: {useResourceStore.getState().starPoints}</div>
        <div>First Activity: {useGameStore.getState().hasCompletedFirstActivity ? '✅' : '❌'}</div>
        <div>Seen Cutscene: {useGameStore.getState().hasSeenConstellationCutscene ? '✅' : '❌'}</div>
      </Section>
      
      <Info>
        Press ESC to close • Debug scenarios set localStorage flags and reload
      </Info>
    </ConsoleOverlay>
  );
}
