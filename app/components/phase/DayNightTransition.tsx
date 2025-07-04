'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useGameStore } from '@/app/store/gameStore';
import { useKnowledgeStore } from '@/app/store/knowledgeStore';
import { useResourceStore } from '@/app/store/resourceStore';
import { GamePhase } from '@/app/types';
import { PhaseManager } from '@/app/core/phase/PhaseManager';
import { centralEventBus } from '@/app/core/events/CentralEventBus';
import { GameEventType } from '@/app/types';
import PixiDayNightAnimation from './PixiDayNightAnimation';
import styled, { keyframes } from 'styled-components';

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
`;

const SummaryCard = styled.div`
  background-color: #1a202c; // bg-gray-900
  border: 1px solid #6366f1; // border-indigo-500
  border-radius: 0.5rem; // rounded-lg
  padding: 1.5rem; // p-6
  width: 24rem; // w-96
  color: white;
  animation: ${fadeIn} 0.5s ease-out forwards;
`;

interface DaySummary {
  dayNumber: number;
  insightGained: number;
  insightRemaining: number;
  insightConverted: number;
  starPointsEarned: number;
  conceptsDiscovered: string[];
  activitiesCompleted: number;
}

interface GameEvent {
  payload: {
    day: number;
    insightBonus?: number;
  };
}

export const DayNightTransition: React.FC = () => {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionDirection, setTransitionDirection] = useState<'to-night' | 'to-day'>('to-night');
  const [showSummary, setShowSummary] = useState(false);
  const [daySummary, setDaySummary] = useState<DaySummary | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  
  console.log('[DayNightTransition] Component state:', { isTransitioning, isAnimating, showSummary });
  
  // Game state - use separate selectors to avoid recreating objects
  const setPhase = useGameStore(state => state.setPhase);
  const insightValue = useResourceStore(state => state.insight);
  const addInsight = useGameStore(state => state.addInsight);
  const convertInsightToSP = useGameStore(state => state.convertInsightToSP);
  
  // Knowledge state
  const discoveredToday = useKnowledgeStore(state => state.discoveredToday);
  const getActiveStars = useKnowledgeStore(state => state.getActiveStars);
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
      
      // Generate day summary
      const summary = PhaseManager.generateDaySummary(
        event.payload.day,
        0, // TODO: Track daily insight gained
        insightValue,
        discoveredToday,
        0 // TODO: Track activities completed
      );
      
      console.log('[DayNightTransition] Generated day summary:', summary);
      setDaySummary(summary);
      
      // Show summary after animation completes
    };
    
    const unsubscribe = centralEventBus.subscribe(GameEventType.END_OF_DAY_REACHED, handleEndOfDay);
    
    return () => {
      console.log('[DayNightTransition] Cleaning up END_OF_DAY_REACHED subscription');
      unsubscribe();
    };
  }, [insightValue, discoveredToday]);
  
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
    setShowSummary(true);
  }, []);
  
  // Handle continue button clicks
  const handleContinue = useCallback(() => {
    if (transitionDirection === 'to-night') {
      // Complete transition to night
      
      // Convert remaining insight to SP
      convertInsightToSP();
      
      // Clear daily discoveries
      clearDailyDiscoveries();
      
      // Update game phase
      setPhase(GamePhase.NIGHT);
      
      // Hide summary and transition
      setShowSummary(false);
      setIsTransitioning(false);
    } else {
      // Complete transition to day
      setPhase(GamePhase.DAY);
      setShowSummary(false);
      setIsTransitioning(false);
    }
  }, [transitionDirection, convertInsightToSP, clearDailyDiscoveries, setPhase]);
  
  if (!isTransitioning) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-1000">
      {isAnimating && (
        <PixiDayNightAnimation 
          key={`animation-${transitionDirection}`}
          transitionTo={transitionDirection === 'to-night' ? 'night' : 'day'} 
          onComplete={handleAnimationComplete} 
        />
      )}
      {showSummary && daySummary && (
        <SummaryCard>
          <h2 className="text-2xl font-bold mb-4 text-center">
            {transitionDirection === 'to-night' 
              ? `Day ${daySummary.dayNumber} Complete` 
              : `Day ${daySummary.dayNumber} Beginning`}
          </h2>
          
          {transitionDirection === 'to-night' ? (
            <>
              <div className="mb-4">
                <h3 className="text-lg font-semibold mb-2 text-indigo-300">Day Summary</h3>
                
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="text-gray-300">Insight Remaining:</div>
                  <div className="text-right font-bold">{daySummary.insightRemaining}</div>
                  
                  <div className="text-gray-300">Converted to SP:</div>
                  <div className="text-right font-bold text-yellow-400">+{daySummary.starPointsEarned}</div>
                  
                  <div className="text-gray-300">Concepts Discovered:</div>
                  <div className="text-right font-bold">{daySummary.conceptsDiscovered.length}</div>
                </div>
              </div>
              
              {daySummary.conceptsDiscovered.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-md font-semibold mb-1 text-indigo-300">Discovered Concepts</h3>
                  <ul className="text-sm max-h-40 overflow-y-auto bg-gray-800 p-2 rounded">
                    {daySummary.conceptsDiscovered.map(conceptId => (
                      <li key={conceptId} className="mb-1 last:mb-0">
                        • {conceptId.replace(/_/g, ' ')}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              <button
                className="w-full py-2 px-4 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors mt-4"
                onClick={handleContinue}
              >
                Continue to Night Phase
              </button>
            </>
          ) : (
            <>
              <div className="mb-4">
                <p className="text-center mb-3">
                  A new day at the hospital awaits. Your knowledge constellation will guide you today.
                </p>
                
                <div className="bg-gray-800 p-3 rounded">
                  <div className="flex justify-between items-center">
                    <span>Active Stars:</span>
                    <span className="font-bold">{getActiveStars().length}</span>
                  </div>
                  
                  <div className="flex justify-between items-center mt-1">
                    <span>Insight Bonus:</span>
                    <span className="font-bold text-blue-400">+{getActiveStars().length}</span>
                  </div>
                </div>
              </div>
              
              <button
                className="w-full py-2 px-4 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors mt-4"
                onClick={handleContinue}
              >
                Start Your Day
              </button>
            </>
          )}
        </SummaryCard>
      )}
    </div>
  );
}; 