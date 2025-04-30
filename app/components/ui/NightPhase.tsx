'use client';

/**
 * @deprecated This component uses mock data and is not connected to the knowledge store.
 * Please use @/app/components/phase/NightPhase.tsx instead which properly integrates with the knowledge store.
 */

import React, { useEffect, useState } from 'react';
import { useGameStore } from '@/app/store/gameStore';
import { centralEventBus, GameEvent, useEventSubscription } from '@/app/core/events/CentralEventBus';
import { GameEventType, GamePhase, KnowledgeDomain, KnowledgeStar } from '@/app/types';

// Mock data for discovered concepts during the day
const MOCK_DISCOVERED_CONCEPTS: Record<string, Partial<KnowledgeStar>> = {
  'IMRT_fundamentals': {
    id: 'IMRT_fundamentals',
    name: 'IMRT Fundamentals',
    description: 'Basic principles of Intensity Modulated Radiation Therapy.',
    domain: KnowledgeDomain.RADIATION_THERAPY,
    position: { x: 100, y: 150 },
    mastery: 0,
    connections: ['head_neck_treatment'],
    spCost: 2,
  },
  'head_neck_treatment': {
    id: 'head_neck_treatment',
    name: 'Head & Neck Treatment',
    description: 'Approaches to treating cancers in the head and neck region.',
    domain: KnowledgeDomain.TREATMENT_PLANNING,
    position: { x: 200, y: 120 },
    mastery: 0,
    connections: ['IMRT_fundamentals'],
    spCost: 3,
  },
  'qa_protocols': {
    id: 'qa_protocols',
    name: 'QA Protocols',
    description: 'Standard quality assurance protocols for radiation therapy equipment.',
    domain: KnowledgeDomain.DOSIMETRY,
    position: { x: 150, y: 250 },
    mastery: 0,
    connections: ['isocenter_verification'],
    spCost: 2,
  },
  'isocenter_verification': {
    id: 'isocenter_verification',
    name: 'Isocenter Verification',
    description: 'Methods to verify the accuracy of the radiation isocenter.',
    domain: KnowledgeDomain.LINAC_ANATOMY,
    position: { x: 250, y: 280 },
    mastery: 0,
    connections: ['qa_protocols'],
    spCost: 2,
  },
};

// Domain color mapping
const domainColors: Record<KnowledgeDomain, string> = {
  [KnowledgeDomain.TREATMENT_PLANNING]: '#3b82f6', // Blue
  [KnowledgeDomain.RADIATION_THERAPY]: '#10b981', // Green
  [KnowledgeDomain.LINAC_ANATOMY]: '#f59e0b', // Amber
  [KnowledgeDomain.DOSIMETRY]: '#ec4899', // Pink
};

// The main NightPhase component
export default function NightPhase() {
  const { currentPhase, resources, setPhase, spendStarPoints, resetDay } = useGameStore();
  
  // Discovered concepts during the day
  const [discoveredConcepts, setDiscoveredConcepts] = useState<Record<string, Partial<KnowledgeStar>>>({});
  
  // Unlocked stars in the constellation
  const [unlockedStars, setUnlockedStars] = useState<Record<string, Partial<KnowledgeStar>>>({});
  
  // Active stars (toggled on for next day)
  const [activeStars, setActiveStars] = useState<Record<string, boolean>>({});
  
  // Listen for concept discovery events
  useEventSubscription<{ conceptId: string }>(
    GameEventType.CONCEPT_DISCOVERED,
    (event) => {
      if (!event.payload?.conceptId) return;
      
      const conceptId = event.payload.conceptId;
      
      // Add to discovered concepts if in our mock data
      if (MOCK_DISCOVERED_CONCEPTS[conceptId]) {
        setDiscoveredConcepts(prev => ({
          ...prev,
          [conceptId]: MOCK_DISCOVERED_CONCEPTS[conceptId]
        }));
      }
    },
    []
  );
  
  // For demo purposes, populate with some discovered concepts
  useEffect(() => {
    if (currentPhase === GamePhase.NIGHT && Object.keys(discoveredConcepts).length === 0) {
      // Add one random concept for demo
      const concepts = Object.values(MOCK_DISCOVERED_CONCEPTS);
      const randomConcept = concepts[Math.floor(Math.random() * concepts.length)];
      
      setDiscoveredConcepts({
        [randomConcept.id!]: randomConcept
      });
    }
  }, [currentPhase, discoveredConcepts]);
  
  // Handle unlocking a star
  const handleUnlockStar = (conceptId: string) => {
    const concept = discoveredConcepts[conceptId];
    if (!concept) return;
    
    const cost = concept.spCost || 2;
    
    // Check if player has enough SP
    if (spendStarPoints(cost)) {
      // Add to unlocked stars
      setUnlockedStars(prev => ({
        ...prev,
        [conceptId]: {
          ...concept,
          unlocked: true,
        }
      }));
      
      // Remove from discovered concepts
      setDiscoveredConcepts(prev => {
        const newDiscovered = { ...prev };
        delete newDiscovered[conceptId];
        return newDiscovered;
      });
      
      // Dispatch event
      centralEventBus.dispatch(
        GameEventType.STAR_UNLOCKED,
        { conceptId, name: concept.name },
        'NightPhase.handleUnlockStar'
      );
    }
  };
  
  // Handle toggling a star's active state
  const handleToggleStar = (conceptId: string) => {
    setActiveStars(prev => ({
      ...prev,
      [conceptId]: !prev[conceptId]
    }));
    
    // Dispatch event
    centralEventBus.dispatch(
      activeStars[conceptId] ? GameEventType.STAR_DEACTIVATED : GameEventType.STAR_ACTIVATED,
      { conceptId },
      'NightPhase.handleToggleStar'
    );
  };
  
  // Handle returning to day phase
  const handleReturnToDay = () => {
    // Convert remaining Insight to SP
    // This would normally be in gameStore
    const insightToConvert = resources.insight;
    const spGained = Math.floor(insightToConvert / 5); // 5:1 conversion ratio
    
    if (spGained > 0) {
      centralEventBus.dispatch(
        GameEventType.INSIGHT_CONVERTED,
        { amount: insightToConvert, spGained },
        'NightPhase.handleReturnToDay'
      );
    }
    
    // Reset day and go back to day phase
    resetDay();
    setPhase(GamePhase.DAY);
    
    centralEventBus.dispatch(
      GameEventType.DAY_PHASE_STARTED,
      { day: 2 },
      'NightPhase.handleReturnToDay'
    );
  };
  
  // Don't render if not in night phase
  if (currentPhase !== GamePhase.NIGHT) {
    return null;
  }
  
  return (
    <div className="bg-slate-900 text-white min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Night Reflection</h1>
          <div className="flex items-center space-x-3">
            <div className="px-3 py-1 bg-slate-800 rounded-md flex items-center">
              <span className="text-purple-400 mr-1">★</span>
              <span>{resources.starPoints}</span>
            </div>
            <button
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md transition"
              onClick={handleReturnToDay}
            >
              Return to Hospital
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left side - Constellation View */}
          <div className="bg-slate-800 rounded-lg p-4 h-[500px] relative overflow-hidden">
            <h2 className="text-xl font-semibold mb-3">Knowledge Constellation</h2>
            <div className="absolute inset-0 mt-12 bg-slate-900 rounded-lg p-4">
              {/* Simple placeholder visualization */}
              {Object.values(unlockedStars).map(star => (
                <div 
                  key={star.id}
                  className={`absolute w-6 h-6 rounded-full cursor-pointer transition-all
                    ${activeStars[star.id!] ? 'ring-2 ring-white ring-opacity-50' : ''}
                  `}
                  style={{
                    left: star.position?.x || 0,
                    top: star.position?.y || 0,
                    backgroundColor: domainColors[star.domain!],
                    boxShadow: activeStars[star.id!] 
                      ? `0 0 15px 5px ${domainColors[star.domain!]}` 
                      : 'none'
                  }}
                  onClick={() => handleToggleStar(star.id!)}
                  title={star.name}
                />
              ))}
            </div>
            <div className="absolute bottom-4 left-4">
              <p className="text-sm text-slate-400">
                Click on stars to activate/deactivate them for the next day.
                <br />
                Active stars provide +1 Insight at the start of each day.
              </p>
            </div>
          </div>
          
          {/* Right side - Discovered Concepts */}
          <div>
            <h2 className="text-xl font-semibold mb-3">Discovered Concepts</h2>
            
            {Object.keys(discoveredConcepts).length === 0 ? (
              <div className="bg-slate-800 rounded-lg p-4 text-slate-400">
                No new concepts discovered today.
              </div>
            ) : (
              <div className="space-y-3">
                {Object.values(discoveredConcepts).map(concept => (
                  <div 
                    key={concept.id} 
                    className="bg-slate-800 rounded-lg p-4 border-l-4"
                    style={{ borderColor: domainColors[concept.domain!] }}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">{concept.name}</h3>
                        <p className="text-sm text-slate-400 mt-1">{concept.description}</p>
                      </div>
                      <button
                        className={`px-3 py-1 rounded text-sm flex items-center
                          ${resources.starPoints >= (concept.spCost || 0) 
                            ? 'bg-purple-600 hover:bg-purple-700' 
                            : 'bg-slate-600 opacity-50 cursor-not-allowed'
                          }`}
                        disabled={resources.starPoints < (concept.spCost || 0)}
                        onClick={() => handleUnlockStar(concept.id!)}
                      >
                        <span className="mr-1">{concept.spCost || 2}</span>
                        <span className="text-purple-300">★</span>
                      </button>
                    </div>
                    <div className="mt-2">
                      <span 
                        className="inline-block px-2 py-0.5 text-xs rounded"
                        style={{ 
                          backgroundColor: `${domainColors[concept.domain!]}33`,
                          color: domainColors[concept.domain!]
                        }}
                      >
                        {concept.domain!.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <h2 className="text-xl font-semibold mt-6 mb-3">Unlocked Stars</h2>
            
            {Object.keys(unlockedStars).length === 0 ? (
              <div className="bg-slate-800 rounded-lg p-4 text-slate-400">
                No stars unlocked yet. Use Star Points to unlock discovered concepts.
              </div>
            ) : (
              <div className="space-y-3">
                {Object.values(unlockedStars).map(star => (
                  <div 
                    key={star.id} 
                    className="bg-slate-800 rounded-lg p-4 border-l-4 flex justify-between items-center"
                    style={{ borderColor: domainColors[star.domain!] }}
                  >
                    <div>
                      <h3 className="font-medium">{star.name}</h3>
                      <div className="mt-1">
                        <span 
                          className="inline-block px-2 py-0.5 text-xs rounded"
                          style={{ 
                            backgroundColor: `${domainColors[star.domain!]}33`,
                            color: domainColors[star.domain!]
                          }}
                        >
                          {star.domain!.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                    <label className="inline-flex items-center cursor-pointer">
                      <span className="text-sm mr-2">
                        {activeStars[star.id!] ? 'Active' : 'Inactive'}
                      </span>
                      <div className="relative">
                        <input
                          type="checkbox"
                          className="sr-only"
                          checked={activeStars[star.id!] || false}
                          onChange={() => handleToggleStar(star.id!)}
                        />
                        <div 
                          className={`block w-10 h-6 rounded-full transition ${
                            activeStars[star.id!] ? 'bg-green-400' : 'bg-slate-600'
                          }`}
                        />
                        <div 
                          className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition transform ${
                            activeStars[star.id!] ? 'translate-x-4' : ''
                          }`}
                        />
                      </div>
                    </label>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 