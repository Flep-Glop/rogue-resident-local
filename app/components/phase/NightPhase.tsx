import React, { useState, useCallback } from 'react';
import { ConstellationView } from '../constellation/ConstellationView';
import { useGameStore } from '@/app/store/gameStore';
import { PhaseManager } from '@/app/core/phase/PhaseManager';
import { useKnowledgeStore } from '@/app/store/knowledgeStore';
import { JournalView } from '../journal/JournalView';

export const NightPhase: React.FC = () => {
  const [showJournal, setShowJournal] = useState(false);
  
  const daysPassed = useGameStore(state => state.daysPassed);
  const resetDay = useGameStore(state => state.resetDay);
  
  const getActiveStars = useKnowledgeStore(state => state.getActiveStars);
  const clearDailyDiscoveries = useKnowledgeStore(state => state.clearDailyDiscoveries);
  
  const handleStartNewDay = useCallback(() => {
    const activeStars = getActiveStars();
    
    // Transition to day phase
    PhaseManager.transitionToDayPhase(
      daysPassed + 1,
      activeStars.length
    );
    
    // Clear discoveries from the current day before starting a new day
    clearDailyDiscoveries();
    
    // Reset day state
    resetDay();
  }, [daysPassed, getActiveStars, clearDailyDiscoveries, resetDay]);
  
  const toggleJournal = useCallback(() => {
    setShowJournal(prevState => !prevState);
  }, []);
  
  return (
    <div className="relative">
      {/* Constellation visualization */}
      {!showJournal && <ConstellationView />}
      
      {/* Journal view */}
      {showJournal && <JournalView />}
      
      {/* Button bar */}
      <div className="fixed bottom-4 right-4 flex space-x-4">
        <button
          className="py-3 px-6 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors font-medium"
          onClick={toggleJournal}
        >
          {showJournal ? 'Back to Constellation' : 'Open Journal'}
        </button>
        
        {!showJournal && (
          <button
            className="py-3 px-6 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors font-bold"
            onClick={handleStartNewDay}
          >
            Start New Day
          </button>
        )}
      </div>
    </div>
  );
}; 