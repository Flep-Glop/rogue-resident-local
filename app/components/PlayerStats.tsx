'use client';
import { useEffect, useState } from 'react';
import { useGameStore } from '@/app/store/gameStore';
import useGameStateMachine from '@/app/core/statemachine/GameStateMachine';
import { useKnowledgeStore } from '@/app/store/knowledgeStore';
import { useJournalStore } from '@/app/store/journalStore';
import { useResourceStore } from '@/app/store/resourceStore';
import InsightMeter from './gameplay/InsightMeter';
import MomentumCounter from './gameplay/MomentumCounter';
import ResidentPortrait from './ResidentPortrait';
import { motion, AnimatePresence } from 'framer-motion';
import { PixelBox, PixelButton } from './PixelThemeProvider';

// Import our improved store hooks
import { 
  createStableSelector, 
  usePrimitiveStoreValue, 
  useStableStoreValue 
} from '@/app/core/utils/storeHooks';

/**
 * PlayerStats - Enhanced player stats sidebar with character representation
 * 
 * This component creates a cohesive "character sheet" that reinforces the game's
 * knowledge acquisition loop through visual design and clear information hierarchy.
 */
export default function PlayerStats() {
  // Global state with safety fallbacks and stable subscriptions
  const player = useStableStoreValue(
    useGameStore, 
    (state: any) => state.player || { insight: 0, momentum: 0, maxMomentum: 3 }
  );

  // FIXED: Use primitive selector for string values
  const currentNodeId = usePrimitiveStoreValue(useGameStore, (state: any) => state.currentNodeId, null);
  
  // FIXED: Access gamePhase directly from the state machine store with primitive selector
  const gamePhase = usePrimitiveStoreValue(
    useGameStateMachine, 
    (state: any) => state.gamePhase,
    'day' // Fallback to day if we get a non-string value
  );
  
  // FIXED: Access dayCount directly and safely
  const dayCount = usePrimitiveStoreValue(
    useGameStateMachine, 
    (state: any) => state.currentDay,
    1 // Fallback to day 1 if undefined
  );
  
  // Use stable selectors to prevent unnecessary re-renders
  const { totalMastery, newlyDiscovered } = useKnowledgeStore(
    createStableSelector(['totalMastery', 'newlyDiscovered'])
  );
  
  // Journal functions and state with careful destructuring
  const journalState = useJournalStore(
    createStableSelector(['hasJournal', 'currentUpgrade'])
  );
  
  // Direct function access with type safety
  const toggleJournal = useStableStoreValue(
    useJournalStore,
    (state: any) => state.setJournalOpen || (
      // Fallback implementation if function is missing
      ((isOpen: boolean) => console.warn("Journal toggle not available"))
    )
  );
  
  // Destructure with safe defaults
  const { hasJournal = false, currentUpgrade = 'base' } = journalState;
  
  // Local state for animations
  const [showInsightAnimation, setShowInsightAnimation] = useState(false);
  const [showJournalButtonAnimation, setShowJournalButtonAnimation] = useState(false);
  
  // Determine when to use full body portrait
  const shouldShowFullBody = 
    gamePhase === 'night' || // Always show full body at night
    (!currentNodeId && gamePhase === 'day'); // Show full body on the map screen
  
  // Animate insight changes
  useEffect(() => {
    if (player?.insight > 50 && !showInsightAnimation) {
      setShowInsightAnimation(true);
      
      // Reset animation after delay
      const timer = setTimeout(() => {
        setShowInsightAnimation(false);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [player?.insight, showInsightAnimation]);
  
  // Show journal button animation when journal is first acquired
  useEffect(() => {
    if (hasJournal) {
      setShowJournalButtonAnimation(true);
      const timer = setTimeout(() => {
        setShowJournalButtonAnimation(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [hasJournal]);
  
  // Determine phase color for theming elements
  const getPhaseColor = () => {
    return gamePhase === 'night' ? 'educational' : 'clinical';
  };
  
  return (
    <div className="p-3 h-full flex flex-col space-y-4 player-stats-panel">
      {/* 1. Character Identity Block - Always visible, defines player identity */}
      <PixelBox className="p-4 flex items-center relative">
        <ResidentPortrait 
          showFullBody={shouldShowFullBody}
          size="md"
          className="mr-4"
        />
        <div>
          <h2 className="text-lg font-pixel font-bold">Medical Physics Resident</h2>
          <div className="flex items-center gap-2 mt-1">
            <div className={`w-3 h-3 rounded-full bg-${getPhaseColor()}-light animate-pulse`}></div>
            <div className="text-sm text-text-secondary font-pixel">
              Day {dayCount} | {gamePhase === 'day' ? 'Hospital' : 'Hill Home'}
            </div>
          </div>
        </div>
      </PixelBox>
      
      {/* 2. Core Resources Block - Tactical resources for challenges */}
      <div className="flex flex-col gap-4">
        {/* Insight meter */}
        <PixelBox 
          className="p-4" 
          variant={gamePhase === 'day' ? 'clinical' : 'default'}
        >
          <div className="font-pixel text-sm text-text-secondary mb-1">INSIGHT</div>
          <InsightMeter 
            className=""
            size="md"
            showLabel={false}
            showAnimation={showInsightAnimation}
          />
        </PixelBox>
        
        {/* Momentum counter */}
        <PixelBox 
          className="p-4" 
          variant={(player?.momentum || 0) >= 2 ? 'dark' : 'default'}
        >
          <div className="font-pixel text-sm text-text-secondary mb-1">MOMENTUM</div>
          <MomentumCounter 
            level={player?.momentum || 0} 
            consecutiveCorrect={(player?.momentum || 0) * 2} // Approximation
            compact={true}
            showLabel={false}
            className="w-full"
          />
        </PixelBox>
      </div>
      
      {/* 3. Knowledge Progression Block - Strategic long-term resources */}
      <PixelBox 
        className="p-4 relative" 
        variant={newlyDiscovered?.length > 0 ? 'educational' : 'default'}
      >
        {/* Journal Icon - Only shown if journal is acquired */}
        {hasJournal && (
          <div 
            className={`absolute top-4 right-5 w-10 h-10 cursor-pointer transition-transform hover:scale-110 ${showJournalButtonAnimation ? 'animate-bounce-subtle' : ''}`}
            onClick={() => toggleJournal(true)}
            title={`${currentUpgrade === 'base' ? 'Basic Notebook' : currentUpgrade === 'technical' ? 'Technical Journal' : 'Annotated Journal'}`}
          >
            <div className="w-full h-full relative">
              <img 
                src="/icons/educational.png"
                alt="Journal"
                className="w-full h-full object-contain"
                style={{ 
                  imageRendering: 'pixelated',
                  filter: 'brightness(1.2) contrast(1.1)' 
                }}
              />
              {/* Visual indicator for journal upgrades */}
              {currentUpgrade !== 'base' && (
                <div className={`absolute bottom-0 right-0 w-2 h-2 rounded-full ${
                  currentUpgrade === 'technical' ? 'bg-clinical-light' : 'bg-educational-light'
                }`}></div>
              )}
            </div>
          </div>
        )}
        <div className="text-sm text-text-secondary font-pixel mb-2 font-bold">Knowledge Mastery</div>
        <div className="flex items-center">
          <div className={`text-${getPhaseColor()}-light text-xl font-pixel font-bold`}>
            {totalMastery || 0}%
          </div>
          
          {/* Visual progress bar - pixel style */}
          <div className="ml-3 flex-grow h-3 bg-surface-dark rounded-none overflow-hidden">
            <motion.div 
              className={`h-full bg-${getPhaseColor()}`}
              initial={{ width: 0 }}
              animate={{ 
                width: `${totalMastery || 0}%`,
                transition: { type: 'spring', damping: 15 }
              }}
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='4' height='4' viewBox='0 0 4 4' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='4' height='4' fill='%23${gamePhase === 'day' ? '4f6bbb' : '2c9287'}'/%3E%3Crect width='1' height='1' fill='%23${gamePhase === 'day' ? '2a3a66' : '1f6e66'}'/%3E%3Crect x='2' y='2' width='1' height='1' fill='%23${gamePhase === 'day' ? '2a3a66' : '1f6e66'}'/%3E%3C/svg%3E")`,
                backgroundSize: '4px 4px',
                imageRendering: 'pixelated'
              }}
            />
          </div>
        </div>
        
        {/* Newly discovered animation */}
        <AnimatePresence>
          {newlyDiscovered?.length > 0 && (
            <motion.div 
              className="mt-3 text-sm text-educational font-pixel"
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <div className="flex items-center">
                <div className="w-3 h-3 bg-educational-light mr-2 animate-pulse"></div>
                <span className="font-bold">{newlyDiscovered.length}</span> new concept{newlyDiscovered.length !== 1 ? 's' : ''} discovered
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </PixelBox>
      
      {/* 5. Expandable Debug Panel - Only in dev mode */}
      {process.env.NODE_ENV !== 'production' && (
        <div className="mt-auto bg-black/30 p-2 rounded text-xs font-mono">
          <details>
            <summary className="cursor-pointer hover:text-blue-300">Debug Info</summary>
            <div className="pt-1 space-y-1">
              <div>Phase: {gamePhase}</div>
              <div>Day: {dayCount}</div>
              <div>Insight: {player?.insight || 0}</div>
              <div>Momentum: {player?.momentum || 0}/{player?.maxMomentum || 3}</div>
              <div>Node: {currentNodeId && typeof currentNodeId === 'string' ? currentNodeId.substring(0, 8) + '...' : 'none'}</div>
            </div>
          </details>
        </div>
      )}
      
      {/* Custom animations */}
      <style jsx>{`
        @keyframes pulse-subtle {
          0%, 100% { box-shadow: 0 0 0 0 rgba(55, 145, 216, 0.4); }
          50% { box-shadow: 0 0 0 4px rgba(55, 145, 216, 0.4); }
        }
        
        @keyframes bounce-subtle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
        
        .animate-pulse-subtle {
          animation: pulse-subtle 2s infinite;
        }
        
        .animate-bounce-subtle {
          animation: bounce-subtle 2s infinite;
        }
        
        .pixel-button {
          position: relative;
          image-rendering: pixelated;
          border: none;
          border-top: 1px solid rgba(255,255,255,0.3);
          border-left: 1px solid rgba(255,255,255,0.3);
          border-right: 1px solid rgba(0,0,0,0.2);
          border-bottom: 1px solid rgba(0,0,0,0.2);
        }
        
        .pixel-button:active {
          transform: translateY(1px);
          border-top: 1px solid rgba(0,0,0,0.2);
          border-left: 1px solid rgba(0,0,0,0.2);
          border-right: 1px solid rgba(255,255,255,0.3);
          border-bottom: 1px solid rgba(255,255,255,0.3);
        }
      `}</style>
    </div>
  );
}