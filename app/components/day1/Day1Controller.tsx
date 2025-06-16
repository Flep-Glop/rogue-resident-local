'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import styled from 'styled-components';
import { useGameStore } from '@/app/store/gameStore';
import { useDialogueStore } from '@/app/store/dialogueStore';
import { useResourceStore } from '@/app/store/resourceStore';
import { useLoading } from '@/app/providers/LoadingProvider';
import { Day1SceneId, Day1Scene, Day1State } from '@/app/types/day1';
import { colors, spacing, typography } from '@/app/styles/pixelTheme';
import { day1Scenes } from '@/app/data/day1Scenes';
import SceneRenderer from './SceneRenderer';

const Day1Container = styled.div`
  min-height: 100vh;
  width: 100%;
  position: relative;
  background: ${colors.background};
  color: ${colors.text};
  font-family: ${typography.fontFamily.pixel};
`;

const LocationLabel = styled.div`
  position: absolute;
  top: ${spacing.lg};
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.8);
  color: ${colors.text};
  padding: ${spacing.sm} ${spacing.lg};
  border-radius: ${spacing.xs};
  font-size: ${typography.fontSize.lg};
  font-weight: bold;
  text-align: center;
  z-index: 10;
  border: 2px solid ${colors.highlight};
`;

const TimeIndicator = styled.div`
  position: fixed;
  top: ${spacing.md};
  right: ${spacing.md};
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: ${colors.backgroundAlt};
  border: 2px solid ${colors.highlight};
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 15;
  font-size: ${typography.fontSize.xl};
`;

const DevControls = styled.div`
  position: fixed;
  bottom: ${spacing.md};
  right: ${spacing.md};
  background: rgba(0, 0, 0, 0.8);
  border: 2px solid ${colors.highlight};
  border-radius: ${spacing.xs};
  padding: ${spacing.sm};
  z-index: 20;
  display: flex;
  gap: ${spacing.xs};
`;

const DevButton = styled.button<{ $color?: string }>`
  background: ${props => props.$color || colors.backgroundAlt};
  color: ${colors.text};
  border: none;
  padding: ${spacing.xs} ${spacing.sm};
  border-radius: ${spacing.xs};
  cursor: pointer;
  font-size: ${typography.fontSize.xs};
  
  &:hover {
    background: ${colors.highlight};
  }
  
  &:disabled {
    background: ${colors.inactive};
    cursor: not-allowed;
  }
`;

const SceneStatus = styled.div`
  position: fixed;
  bottom: ${spacing.md};
  left: ${spacing.md};
  background: rgba(0, 0, 0, 0.8);
  border: 2px solid ${colors.highlight};
  border-radius: ${spacing.xs};
  padding: ${spacing.sm};
  z-index: 20;
  font-size: ${typography.fontSize.xs};
  color: ${colors.text};
`;

export const Day1Controller: React.FC = () => {
  // Game state - now using global Day 1 scene state
  const { 
    currentTime, 
    advanceTime, 
    playerName, 
    setPlayerName,
    day1CurrentScene,
    day1CompletedScenes,
    setDay1Scene
  } = useGameStore();
  
  const { startDialogue, activeDialogueId } = useDialogueStore();
  const { momentum, insight } = useResourceStore();
  const { startLoading, stopLoading, isLoading } = useLoading();
  
  // Local Day 1 state for UI management
  const [day1State, setDay1State] = useState<Day1State>({
    currentScene: day1CurrentScene,
    completedScenes: day1CompletedScenes,
    playerName: playerName,
    journalReceived: false,
    hasSeenMomentumUI: false,
    hasSeenInsightUI: false,
    difficultySelected: false
  });
  
  const [showLocationLabel, setShowLocationLabel] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [autoProgress, setAutoProgress] = useState(true); // Toggle for development
  const [pendingNextScene, setPendingNextScene] = useState<Day1SceneId | null>(null);
  
  // Refs to prevent race conditions
  const transitionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastDialogueIdRef = useRef<string | null>(null);
  const isInitializedRef = useRef<boolean>(false);
  const sceneDialogueStartedRef = useRef<string | null>(null);
  
  // Get current scene data from global state
  const currentScene = day1Scenes[day1CurrentScene];
  
  if (!currentScene) {
    console.error('[Day1Controller] No scene data found for:', day1CurrentScene);
    console.error('[Day1Controller] Available scenes:', Object.keys(day1Scenes));
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#000',
        color: '#fff',
        fontSize: '18px'
      }}>
        <div>
          <h2>Day 1 Scene Error</h2>
          <p>Scene "{day1CurrentScene}" not found</p>
          <p>Available scenes: {Object.keys(day1Scenes).join(', ')}</p>
        </div>
      </div>
    );
  }
  
  // Update local state when global scene changes
  useEffect(() => {
    setDay1State(prev => ({
      ...prev,
      currentScene: day1CurrentScene,
      completedScenes: day1CompletedScenes
    }));
  }, [day1CurrentScene, day1CompletedScenes]);
  
  // FIXED: Initialize dialogue for the current scene when component first loads
  // Removed startDialogue from dependency array to prevent race conditions
  useEffect(() => {
    if (!isInitializedRef.current && currentScene?.dialogueId && !activeDialogueId) {
      console.log('[Day1Controller] Starting initial dialogue:', currentScene.dialogueId);
      isInitializedRef.current = true;
      sceneDialogueStartedRef.current = currentScene.dialogueId;
      
      setTimeout(() => {
        startDialogue(currentScene.dialogueId!);
        lastDialogueIdRef.current = currentScene.dialogueId!;
      }, 500);
    }
  }, [currentScene?.dialogueId, activeDialogueId]); // Removed startDialogue from deps
  
  // FIXED: Stable reference for scene completion handler
  const handleSceneCompleteStable = useCallback(() => {
    if (!currentScene?.nextScene) {
      console.log('No next scene defined for', currentScene.id);
      return;
    }
    
    // Mark current scene as completed
    const newCompletedScenes = new Set(day1State.completedScenes);
    newCompletedScenes.add(currentScene.id);
    setDay1State(prev => ({ ...prev, completedScenes: newCompletedScenes }));
    
    if (autoProgress) {
      // Standard progression timing for all scenes
      const delay = 2000; // 2 seconds for all transitions
      
      transitionTimeoutRef.current = setTimeout(() => {
        transitionToScene(currentScene.nextScene!);
      }, delay);
    } else {
      // Store next scene but don't auto-progress
      setPendingNextScene(currentScene.nextScene);
      console.log('Scene complete, next scene ready:', currentScene.nextScene);
    }
  }, [currentScene, autoProgress, day1State.completedScenes]); // Removed transitionToScene from deps
  
  // FIXED: Prevent race conditions in scene transitions
  // Removed startDialogue from dependency array
  const transitionToScene = useCallback(async (sceneId: Day1SceneId) => {
    if (isTransitioning || isLoading) {
      console.log('Transition blocked - already transitioning or loading');
      return;
    }
    
    // Clear any pending timeouts
    if (transitionTimeoutRef.current) {
      clearTimeout(transitionTimeoutRef.current);
      transitionTimeoutRef.current = null;
    }
    
    try {
      setIsTransitioning(true);
      console.log(`Transitioning from ${day1CurrentScene} to ${sceneId}`);
      
      // Normal scene transition with loading for all major scene changes
      await startLoading();
      
      // Execute current scene exit callback
      if (currentScene?.onExit) {
        currentScene.onExit();
      }
      
      // Update global scene state
      setDay1Scene(sceneId);
      
      // Get new scene
      const newScene = day1Scenes[sceneId];
      
      // Show location label for scene changes
      setShowLocationLabel(true);
      setTimeout(() => setShowLocationLabel(false), 3000);
      
      // Advance time
      if (newScene.timeAdvance > 0) {
        advanceTime(newScene.timeAdvance);
      }
      
      // Execute scene enter callback
      if (newScene.onEnter) {
        newScene.onEnter();
      }
      
      // Start dialogue if specified and not already started for this scene
      if (newScene.dialogueId && sceneDialogueStartedRef.current !== newScene.dialogueId) {
        console.log('[Day1Controller] Starting scene dialogue:', newScene.dialogueId);
        sceneDialogueStartedRef.current = newScene.dialogueId;
        setTimeout(() => {
          startDialogue(newScene.dialogueId!);
          lastDialogueIdRef.current = newScene.dialogueId!;
        }, 1000);
      }
      
      await stopLoading();
      setIsTransitioning(false);
      setPendingNextScene(null);
      
    } catch (error) {
      console.error('Error transitioning to scene:', error);
      stopLoading();
      setIsTransitioning(false);
    }
  }, [currentScene, advanceTime, startLoading, stopLoading, setDay1Scene, day1CurrentScene, isTransitioning, isLoading]);
  
  // Handle player name input with state updates
  const handleNameSubmit = useCallback((name: string) => {
    setPlayerName(name);
    setDay1State(prev => ({ ...prev, playerName: name }));
    console.log('Player name set:', name);
  }, [setPlayerName]);
  
  // Handle difficulty selection
  const handleDifficultySelect = useCallback((difficulty: any) => {
    setDay1State(prev => ({ ...prev, difficultySelected: true }));
    console.log('Difficulty selected:', difficulty);
  }, []);
  
  // Manual progression for development
  const handleManualProgress = useCallback(() => {
    if (pendingNextScene) {
      transitionToScene(pendingNextScene);
    }
  }, [pendingNextScene, transitionToScene]);
  
  // FIXED: Handle dialogue completion with proper detection
  // Removed handleSceneComplete from dependency array to prevent race conditions
  useEffect(() => {
    // Only trigger if dialogue actually changed from active to null
    if (lastDialogueIdRef.current && !activeDialogueId && currentScene?.dialogueId === lastDialogueIdRef.current) {
      console.log('Dialogue completed:', lastDialogueIdRef.current);
      lastDialogueIdRef.current = null;
      
      // Add delay before completing scene
      setTimeout(() => {
        handleSceneCompleteStable();
      }, 1000);
    }
  }, [activeDialogueId, currentScene?.dialogueId, handleSceneCompleteStable]); // Now uses stable reference
  
  // Handle momentum UI introduction
  useEffect(() => {
    if (momentum > 0 && !day1State.hasSeenMomentumUI) {
      setDay1State(prev => ({ ...prev, hasSeenMomentumUI: true }));
      console.log('Momentum UI introduced');
    }
  }, [momentum, day1State.hasSeenMomentumUI]);
  
  // Handle insight UI introduction  
  useEffect(() => {
    if (insight > 0 && !day1State.hasSeenInsightUI) {
      setDay1State(prev => ({ ...prev, hasSeenInsightUI: true }));
      console.log('Insight UI introduced');
    }
  }, [insight, day1State.hasSeenInsightUI]);
  
  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }
      // Reset initialization flag on unmount
      isInitializedRef.current = false;
      sceneDialogueStartedRef.current = null;
    };
  }, []);
  
  // Time display logic
  const getTimeIcon = () => {
    const hour = currentTime.hour;
    if (hour >= 6 && hour < 18) {
      return '☀️';
    } else {
      return '🌙';
    }
  };
  
  // Development shortcuts
  const handleSkipToNext = useCallback(() => {
    if (currentScene?.nextScene) {
      transitionToScene(currentScene.nextScene);
    }
  }, [currentScene, transitionToScene]);
  
  const handlePreviousScene = useCallback(() => {
    const sceneOrder = Object.values(Day1SceneId);
    const currentIndex = sceneOrder.indexOf(day1CurrentScene);
    if (currentIndex > 0) {
      transitionToScene(sceneOrder[currentIndex - 1]);
    }
  }, [day1CurrentScene, transitionToScene]);
  
  const handleNextScene = useCallback(() => {
    const sceneOrder = Object.values(Day1SceneId);
    const currentIndex = sceneOrder.indexOf(day1CurrentScene);
    if (currentIndex < sceneOrder.length - 1) {
      transitionToScene(sceneOrder[currentIndex + 1]);
    }
  }, [day1CurrentScene, transitionToScene]);
  
  return (
    <Day1Container>
      {/* Time Indicator - only show for actual Day 1 scenes, not prologue */}
      {!currentScene.id.includes('PROLOGUE') && (
        <TimeIndicator>
          {getTimeIcon()}
        </TimeIndicator>
      )}
      
      {/* Location Label */}
      {showLocationLabel && (
        <LocationLabel>
          {currentScene.location}
        </LocationLabel>
      )}
      
      {/* Development Controls */}
      <DevControls>
        <DevButton 
          onClick={() => setAutoProgress(!autoProgress)}
          $color={autoProgress ? colors.active : colors.error}
        >
          Auto: {autoProgress ? 'ON' : 'OFF'}
        </DevButton>
        <DevButton onClick={handlePreviousScene} disabled={isTransitioning}>
          ← Prev
        </DevButton>
        <DevButton onClick={handleNextScene} disabled={isTransitioning}>
          Next →
        </DevButton>
        {pendingNextScene && !autoProgress && (
          <DevButton onClick={handleManualProgress} $color={colors.highlight}>
            Continue
          </DevButton>
        )}
        {currentScene?.nextScene && (
          <DevButton onClick={handleSkipToNext} disabled={isTransitioning}>
            Skip to Next
          </DevButton>
        )}
      </DevControls>
      
      {/* Scene Status */}
      <SceneStatus>
        Scene: {currentScene.title}
        <br />
        ID: {day1CurrentScene}
        <br />
        Phase: {currentScene.id.includes('PROLOGUE') ? 'Prologue' : 'Day 1'}
        <br />
        Dialogue: {activeDialogueId || 'None'}
        <br />
        Status: {isTransitioning ? 'Transitioning' : pendingNextScene ? 'Ready to Continue' : 'Active'}
        {pendingNextScene && (
          <>
            <br />
            Next: {day1Scenes[pendingNextScene]?.title}
          </>
        )}
      </SceneStatus>
      
      {/* Scene Content */}
      <SceneRenderer 
        scene={currentScene}
        day1State={day1State}
        onSceneComplete={handleSceneCompleteStable}
        onNameSubmit={handleNameSubmit}
      />
    </Day1Container>
  );
};

export default Day1Controller; 