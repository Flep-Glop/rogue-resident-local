// app/components/challenges/ChallengeRouter.tsx
'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useGameStore } from '@/app/store/gameStore';
import { useJournalStore } from '@/app/store/journalStore';
import { useKnowledgeStore } from '@/app/store/knowledgeStore';
import { useResourceStore } from '@/app/store/resourceStore';
import { useEventSubscription, safeDispatch } from '@/app/core/events/CentralEventBus';
import { GameEventType } from '@/app/core/events/EventTypes';
import ConversationFormat from './formats/ConversationFormat';
import { createKapoorCalibrationFlow } from '@/app/core/dialogue/DialogueStateMachine';
import kapoorCalibrationDialogue from '@/app/data/dialogues/calibrations/kapoor-calibration';
import { NodeType } from '@/app/types/game';
import { 
  usePrimitiveStoreValue, 
  useStableCallback
} from '@/app/core/utils/storeHooks';

/**
 * Challenge Router - Fully Chamber Pattern Compliant
 * 
 * This component routes the player to the appropriate challenge type
 * based on the selected node. It handles loading dialogue content,
 * tracking challenge completion, and managing journal acquisition.
 */
export default function ChallengeRouter() {
  // Component mount ref to prevent state updates after unmount
  const isMountedRef = useRef(true);
  const initTimeRef = useRef(Date.now());
  
  // ===== PRIMITIVE VALUE EXTRACTION =====
  // Direct primitive value from game store - critical for node selection
  const currentNodeId = usePrimitiveStoreValue(
    useGameStore,
    (state: any) => state.currentNodeId,
    null
  );
  
  const currentCharacterId = usePrimitiveStoreValue(
    useGameStore,
    (state: any) => state.currentCharacterId,
    null
  );
  
  // Check if journal exists
  const hasJournal = usePrimitiveStoreValue(
    useJournalStore,
    (state: any) => state.hasJournal,
    false
  );
  
  // ===== LOCAL STATE =====
  // Use atomic state model for better rendering optimization
  const [localState, setLocalState] = useState({
    challengeComplete: false,
    error: null,
    journalAcquired: false,
    recoveryAttempted: false,
    nodeDetailsFetched: false,
    debugInfo: {
      lastEvent: null,
      eventCount: 0,
      lastAttemptTime: null
    }
  });
  
  // ===== STABLE UPDATE FUNCTION =====
  // Atomic state updates for stability
  const updateLocalState = useCallback((updates: any) => {
    if (!isMountedRef.current) return;
    
    setLocalState(prev => ({
      ...prev,
      ...updates
    }));
  }, []);
  
  // ===== HANDLE COMPLETION =====
  // Stable callback for challenge completion
  const handleConversationComplete = useStableCallback((results: any) => {
    try {
      // Get direct access to all stores for final progression
      const gameStore = useGameStore.getState();
      const resourceStore = useResourceStore.getState();
      const knowledgeStore = useKnowledgeStore.getState();
      const journalStore = useJournalStore.getState();
      
      console.log('Challenge completed with results:', results);
      
      // Apply gained insight
      if (results.insightGained && typeof results.insightGained === 'number') {
        resourceStore.updateInsight(results.insightGained, 'challenge_completion');
        console.log(`✅ Added ${results.insightGained} insight`);
      }
      
      // Apply knowledge gains if any
      if (results.knowledgeGained && typeof results.knowledgeGained === 'object') {
        Object.entries(results.knowledgeGained).forEach(([conceptId, value]) => {
          knowledgeStore.updateMastery(conceptId, value as number);
          console.log(`✅ Increased mastery of ${conceptId} by ${value}`);
        });
      }
      
      // Journal acquisition logic
      if (results.journalTier && !hasJournal) {
        console.log(`Journal acquisition triggered with tier: ${results.journalTier}`);
        console.log(`Journal acquisition character check: currentCharacterId=${currentCharacterId}`);
        
        // Initialize the journal in the journal store
        if (journalStore && journalStore.initializeJournal) {
          journalStore.initializeJournal(results.journalTier);
          console.log(`✅ Journal initialized with tier: ${results.journalTier}`);
        }
        
        // Mark node as completed - important for progression
        if (currentNodeId && gameStore && gameStore.completeNode) {
          gameStore.completeNode(currentNodeId);
          console.log(`✅ Marked node ${currentNodeId} as completed`);
          
          // Extra assurance to mark the node as completed in the game state machine
          try {
            if (typeof window !== 'undefined' && window.__GAME_STATE_MACHINE_DEBUG__?.getCurrentState) {
              window.__GAME_STATE_MACHINE_DEBUG__.getCurrentState().markNodeCompleted(currentNodeId);
              console.log(`✅ Explicitly marked node ${currentNodeId} as completed in state machine`);
            }
          } catch (err) {
            console.error('[ChallengeRouter] Error marking node completed in state machine', err);
          }
        }
        
        updateLocalState({ 
          challengeComplete: true,
          journalAcquired: true 
        });
        
        // Use a consistent character ID for dispatching the event
        const characterForDispatch = currentCharacterId || 'kapoor';
        console.log(`Using character "${characterForDispatch}" for journal acquisition event`);
        
        // Explicitly dispatch the JOURNAL_ACQUIRED event to trigger the animation
        safeDispatch(GameEventType.JOURNAL_ACQUIRED, {
          tier: results.journalTier,
          character: characterForDispatch,
          source: 'node_completion',
          nodeId: currentNodeId
        });
        console.log('✅ Journal acquisition event explicitly dispatched');
        
        // Emit completion event to ensure other systems know
        if (gameStore && gameStore.emit) {
          gameStore.emit(GameEventType.CHALLENGE_COMPLETED, {
            nodeId: currentNodeId,
            journalTier: results.journalTier,
            isJournalAcquisition: true
          });
          console.log('✅ Journal challenge completion event emitted');
        }
        
        // Return to map after a delay to allow animation to complete
        // Use longer delay to ensure NODE_COMPLETED event is fully processed
        setTimeout(() => {
          if (isMountedRef.current && gameStore && gameStore.setCurrentNode) {
            console.log('[ChallengeRouter] Returning to map after journal acquisition animation');
            gameStore.setCurrentNode(null);
          }
        }, 6000);
        
        return; // Stop further processing
      }
      
      // Mark node as completed - important for progression
      if (currentNodeId && gameStore && gameStore.completeNode) {
        gameStore.completeNode(currentNodeId);
        console.log(`✅ Marked node ${currentNodeId} as completed`);
      }
      
      updateLocalState({ challengeComplete: true });
      
      // Emit completion event to ensure other systems know
      if (gameStore && gameStore.emit) {
        gameStore.emit(GameEventType.CHALLENGE_COMPLETED, {
          nodeId: currentNodeId,
          result: results
        });
        console.log('✅ Challenge completion event emitted');
      }
      
      // Return to map after a short delay
      setTimeout(() => {
        if (isMountedRef.current && gameStore && gameStore.setCurrentNode) {
          gameStore.setCurrentNode(null);
          console.log('✅ Returning to map');
        }
      }, 1500);
    } catch (error) {
      console.error('[ChallengeRouter] Error completing challenge:', error);
      updateLocalState({
        error: error instanceof Error ? error.message : 'Unknown error in completion'
      });
    }
  }, [updateLocalState, hasJournal, currentNodeId, currentCharacterId]);
  
  // ===== LIFECYCLE EFFECTS =====
  // Reset challenge state when node changes
  useEffect(() => {
    if (currentNodeId) {
      console.log(`[ChallengeRouter] Node changed to: ${currentNodeId}`);
      updateLocalState({
        challengeComplete: false,
        error: null,
        nodeDetailsFetched: true
      });
      
      // Get direct access to game store for debug event
      try {
        const gameStore = useGameStore.getState();
        
        // If the character is not set but we have a node ID, set the character based on the node
        if (!gameStore.currentCharacterId) {
          let characterToSet = null;
          
          // Map nodes to characters
          if (currentNodeId === 'start') {
            characterToSet = 'kapoor';
          }
          
          if (characterToSet) {
            console.log(`[ChallengeRouter] Character should be "${characterToSet}" for node ID "${currentNodeId}", but cannot set directly.`);
            console.log(`[ChallengeRouter] Will use fallback character ID in render function.`);
          }
        }
        
        if (gameStore && gameStore.emit) {
          gameStore.emit(GameEventType.DEBUG_COMMAND, {
            command: 'challenge:started',
            nodeId: currentNodeId
          });
        }
      } catch (e) {
        console.warn('[ChallengeRouter] Failed to emit debug event:', e);
      }
    } else {
      // Node cleared, reset state
      updateLocalState({
        nodeDetailsFetched: false
      });
    }
  }, [currentNodeId, updateLocalState]);
  
  // Mount/unmount tracking
  useEffect(() => {
    isMountedRef.current = true;
    console.log('[ChallengeRouter] Mounted');
    
    return () => {
      isMountedRef.current = false;
      console.log('[ChallengeRouter] Unmounted');
    };
  }, []);
  
  // ===== RENDER =====
  // Return null if no node is selected
  if (!currentNodeId) {
    return null;
  }
  
  // Show loading state if node details not fetched
  if (!localState.nodeDetailsFetched) {
    return (
      <div className="flex items-center justify-center h-full w-full bg-gray-900">
        <div className="text-white">Loading challenge...</div>
      </div>
    );
  }
  
  // Show error state if there was an error
  if (localState.error) {
    return (
      <div className="flex items-center justify-center h-full w-full bg-gray-900">
        <div className="text-red-500">
          <h3 className="text-xl mb-2">Error Loading Challenge</h3>
          <p>{String(localState.error)}</p>
          <button 
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
            onClick={() => updateLocalState({ error: null })}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }
  
  // Render the appropriate challenge type based on node ID
  // For the vertical slice, we just support ConversationFormat
  console.log(`[ChallengeRouter] Rendering ConversationFormat with nodeId: ${currentNodeId}, characterId: ${currentCharacterId}`);
  return (
    <div className="h-full w-full">
      <ConversationFormat
        nodeId={currentNodeId}
        characterId={currentCharacterId || 'kapoor'}
        onComplete={handleConversationComplete}
      />
    </div>
  );
}