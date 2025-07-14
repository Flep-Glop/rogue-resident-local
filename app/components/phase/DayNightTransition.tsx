'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useGameStore } from '@/app/store/gameStore';
import { useKnowledgeStore } from '@/app/store/knowledgeStore';
import { useResourceStore } from '@/app/store/resourceStore';
import { GamePhase } from '@/app/types';
import { PhaseManager } from '@/app/core/phase/PhaseManager';
import { centralEventBus } from '@/app/core/events/CentralEventBus';
import { GameEventType } from '@/app/types';
import { useSceneStore } from '@/app/store/sceneStore';




interface GameEvent {
  payload?: {
    day: number;
    insightBonus?: number;
  };
}

export const DayNightTransition: React.FC = () => {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionDirection, setTransitionDirection] = useState<'to-night' | 'to-day'>('to-night');


  const [isAnimating, setIsAnimating] = useState(false);
  const [shouldHide, setShouldHide] = useState(false);
  

  

  
  // Game state - use separate selectors to avoid recreating objects
  const setPhase = useGameStore(state => state.setPhase);
  const insightValue = useResourceStore(state => state.insight);
  const addInsight = useGameStore(state => state.addInsight);
  const convertInsightToSP = useGameStore(state => state.convertInsightToSP);
  
  // Knowledge state
  const clearDailyDiscoveries = useKnowledgeStore(state => state.clearDailyDiscoveries);
  
  // Subscribe to end of day event
  useEffect(() => {
    console.log('[DayNightTransition] Setting up END_OF_DAY_REACHED subscription');
    
    const handleEndOfDay = (event: GameEvent) => {
      console.log('[DayNightTransition] END_OF_DAY_REACHED event received:', event);
      
      if (!event.payload) {
        console.warn('[DayNightTransition] Event has no payload, ignoring');
        return;
      }
      
      console.log('[DayNightTransition] Starting transition to night');
      
      // Start transition to night
      setTransitionDirection('to-night');
      setIsTransitioning(true);
      setIsAnimating(true);
      setShouldHide(false); // Reset hide state for new transition
    };
    
    const unsubscribe = centralEventBus.subscribe(GameEventType.END_OF_DAY_REACHED, handleEndOfDay);
    
    return () => {
      console.log('[DayNightTransition] Cleaning up END_OF_DAY_REACHED subscription');
      unsubscribe();
    };
  }, []);
  
  // Subscribe to day start event
  useEffect(() => {
    const handleDayStart = (event: GameEvent) => {
      if (!event.payload) return;
      
      // Add insight bonus from active stars
      if (event.payload.insightBonus && event.payload.insightBonus > 0) {
        addInsight(event.payload.insightBonus, 'active_stars_bonus');
      }
    };
    
    const unsubscribe = centralEventBus.subscribe(GameEventType.DAY_PHASE_STARTED, handleDayStart);
    
    return () => {
      unsubscribe();
    };
  }, [addInsight]);
  
  const handleAnimationComplete = useCallback(() => {
    setIsAnimating(false);
    
    // Clean up transition state (scene change happens at midpoint)
    setIsTransitioning(false);
    setShouldHide(true);
  }, []);

  // Handle scene change at midpoint of animation (when screen is fully black)
  useEffect(() => {
    if (isAnimating && transitionDirection === 'to-night') {
      // Change scene at 1.5 seconds (midpoint of 3-second animation when fully black)
      const midpointTimer = setTimeout(() => {
        // Convert remaining insight to SP
        convertInsightToSP();
        
        // Clear daily discoveries
        clearDailyDiscoveries();
        
        // Navigate directly to home scene while screen is black
        const { setSceneDirectly } = useSceneStore.getState();
        setSceneDirectly('home');
        
        console.log('[DayNightTransition] Scene changed to home at animation midpoint');
      }, 1500); // 1.5 seconds = midpoint of 3-second animation
      
      return () => clearTimeout(midpointTimer);
    }
  }, [isAnimating, transitionDirection, convertInsightToSP, clearDailyDiscoveries]);
  

  
    if (shouldHide || !isTransitioning) {
    return null;
  }
  
  // Simple fade to black and back
  return (
    <>
      {isAnimating && (
        <div
          key={`animation-${transitionDirection}`}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: '#000',
            zIndex: 1010,  // Increased z-index to ensure it covers everything
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: 'fadeInOut 3s ease-in-out forwards'
          }}
          onAnimationEnd={handleAnimationComplete}
        />
      )}
      <style jsx>{`
        @keyframes fadeInOut {
          0% { opacity: 0; }
          50% { opacity: 1; }
          100% { opacity: 0; }
        }
      `}</style>
    </>
  );
}; 