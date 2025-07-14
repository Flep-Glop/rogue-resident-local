'use client';

import React from 'react';
import styled, { keyframes } from 'styled-components';
import { useSceneStore, sceneSelectors } from '@/app/store/sceneStore';

// Fade animation for transition
const fadeInOut = keyframes`
  0% { opacity: 0; }
  50% { opacity: 1; }
  100% { opacity: 0; }
`;

// Pulse animation for loading indicator
const pulse = keyframes`
  0%, 100% { opacity: 0.4; }
  50% { opacity: 1; }
`;

const TransitionContainer = styled.div.attrs<{ progress: number }>(({ progress }) => ({
  style: {
    opacity: progress <= 50 ? progress / 50 : 1 - ((progress - 50) / 50)
  }
}))<{ progress: number }>`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  transition: opacity 0.1s ease-out;
`;

const LoadingContent = styled.div`
  text-align: center;
  color: #e0e6ed;
`;

const LoadingText = styled.h2`
  font-size: 1.5rem;
  font-weight: 300;
  margin-bottom: 2rem;
  animation: ${pulse} 2s infinite;
`;

const TransitionMessage = styled.p`
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 1rem;
  text-align: center;
  max-width: 400px;
`;

const ProgressBar = styled.div`
  width: 200px;
  height: 4px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 1rem;
`;

const ProgressFill = styled.div.attrs<{ progress: number }>(({ progress }) => ({
  style: {
    width: `${progress}%`
  }
}))<{ progress: number }>`
  height: 100%;
  background: linear-gradient(90deg, #3b82f6, #60a5fa);
  border-radius: 2px;
  transition: width 0.3s ease-out;
`;

const HospitalIcon = styled.div`
  font-size: 3rem;
  margin-bottom: 1rem;
  animation: ${pulse} 1.5s infinite;
`;

export default function TransitionScreen() {
  const transitionProgress = useSceneStore(sceneSelectors.getTransitionProgress);
  const context = useSceneStore(sceneSelectors.getContext);
  
  // Generate contextual messages based on the transition
  const getTransitionMessage = () => {
    const currentScene = useSceneStore(sceneSelectors.getCurrentScene);
    
    // Special message for constellation transitions
    if (currentScene === 'constellation' || context.previousScene === 'constellation') {
      return 'Entering the knowledge constellation...';
    }
    
    if (context.mentorId) {
      const mentorNames = {
        garcia: 'Dr. Garcia',
        kapoor: 'Dr. Kapoor', 
        quinn: 'Dr. Quinn',
        jesse: 'Jesse'
      };
      
      const mentorName = mentorNames[context.mentorId as keyof typeof mentorNames] || context.mentorId;
      
      if (context.dialogueId?.includes('intro')) {
        return `Meeting with ${mentorName}...`;
      } else if (context.activityId?.includes('challenge')) {
        return `Preparing challenge with ${mentorName}...`;
      } else {
        return `Connecting with ${mentorName}...`;
      }
    }
    
    return 'Navigating through the hospital...';
  };
  
  return (
    <TransitionContainer progress={transitionProgress}>
      <LoadingContent>
        <HospitalIcon>🏥</HospitalIcon>
        <LoadingText>Rogue Resident</LoadingText>
        <TransitionMessage>{getTransitionMessage()}</TransitionMessage>
        <ProgressBar>
          <ProgressFill progress={transitionProgress} />
        </ProgressBar>
        <div style={{ fontSize: '0.9rem', color: 'rgba(255, 255, 255, 0.6)' }}>
          {Math.round(transitionProgress)}%
        </div>
      </LoadingContent>
    </TransitionContainer>
  );
} 