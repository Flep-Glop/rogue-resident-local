'use client';

import { useGameStore } from '@/app/store/gameStore';
import { GamePhase } from '@/app/types';
import TimeBlock from '@/app/components/ui/TimeBlock';
import DebugPanel from '@/app/components/ui/DebugPanel';
import { NightPhase } from '@/app/components/phase/NightPhase';
import { DayPhase } from '@/app/components/phase/DayPhase';
import { DayNightTransition } from '@/app/components/phase/DayNightTransition';
import { TitleScreen } from '@/app/components/phase/TitleScreen';
import { Prologue } from '@/app/components/phase/Prologue';
import { useEffect, useState } from 'react';
import { initialConceptData, initializeKnowledgeStore } from '@/app/data/conceptData';
import { useKnowledgeStore } from '@/app/store/knowledgeStore';
import { useJournalStore } from '@/app/store/journalStore';
import { initializeJournal } from '@/app/data/journalData';
import { initializeDialogueStore } from '@/app/data/dialogueData';

export default function Home() {
  const [initialized, setInitialized] = useState(false);
  const currentPhase = useGameStore(state => state.currentPhase);
  
  // Initialize knowledge store and journal with concept/mentor data on first load
  useEffect(() => {
    if (!initialized) {
      // Initialize knowledge constellation - use an IIFE to avoid infinite loop
      const knowledgeStoreState = useKnowledgeStore.getState();
      if (Object.keys(knowledgeStoreState.stars).length === 0) {
        initializeKnowledgeStore(useKnowledgeStore);
      }
      
      // Initialize journal with mentor entries
      initializeJournal();
      
      // Initialize dialogue store with mentor data
      initializeDialogueStore();
      
      setInitialized(true);

      // Start with the title screen
      const gameStore = useGameStore.getState();
      gameStore.setPhase(GamePhase.TITLE);
    }
  }, [initialized]);
  
  // Render the appropriate phase component
  const renderPhaseContent = () => {
    switch (currentPhase) {
      case GamePhase.TITLE:
        return <TitleScreen />;
      case GamePhase.PROLOGUE:
        return <Prologue />;
      case GamePhase.DAY:
        return <DayPhase />;
      case GamePhase.NIGHT:
        return <NightPhase />;
      default:
        return null;
    }
  };
  
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-gradient-to-b from-slate-900 to-slate-800">
      {/* Only show title if not on title screen */}
      {currentPhase !== GamePhase.TITLE && currentPhase !== GamePhase.PROLOGUE && (
        <div className="z-10 max-w-5xl w-full items-center justify-center font-mono text-sm mb-8">
          <div className="flex justify-center">
            <span className="text-3xl font-semibold text-white">
              Rogue Resident
            </span>
          </div>
        </div>
      )}

      {renderPhaseContent()}
      
      {/* Phase Transition Component - only show during day/night */}
      {(currentPhase === GamePhase.DAY || currentPhase === GamePhase.NIGHT) && (
        <DayNightTransition />
      )}
      
      {/* Debug Panel - only show during day/night */}
      {(currentPhase === GamePhase.DAY || currentPhase === GamePhase.NIGHT) && (
        <DebugPanel />
      )}
    </main>
  );
}
