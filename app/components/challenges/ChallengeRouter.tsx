// app/components/challenges/ChallengeRouter.tsx
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import { PixelTransition } from '@/app/components/PixelThemeProvider';

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
  const hasAnimatedRef = useRef(false);
  
  // Add ref for tracking transition animation state
  const transitionCompletedRef = useRef(false);
  
  // Add state for tracking the node click position
  const [nodePosition, setNodePosition] = useState({ x: 50, y: 50 });
  
  // Use state for transition control with explicit management
  const [transitionState, setTransitionState] = useState({
    isActive: false,
    isExiting: false
  });
  
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
  
  // ===== TRANSITION HANDLERS =====
  // Handle transition completion when exiting
  const handleTransitionComplete = useStableCallback(() => {
    if (!isMountedRef.current) return;
    
    console.log('[ChallengeRouter] Transition animation completed', { 
      isExiting: transitionState.isExiting,
      currentNodeId
    });
    
    // Mark transition as completed to hide animations
    transitionCompletedRef.current = true;
    
    if (transitionState.isExiting) {
      // Navigate back to map
      const gameStore = useGameStore.getState();
      if (gameStore && gameStore.setCurrentNode) {
        console.log('[ChallengeRouter] Transition exit complete - returning to map');
        gameStore.setCurrentNode(null);
        console.log('✅ Returning to map after transition animation');
        
        // Remove transition classes from body
        if (typeof document !== 'undefined') {
          document.documentElement.classList.remove('black-transition-active');
        }
      }
    } else {
      console.log('[ChallengeRouter] Entrance transition complete - challenge ready');
    }
  }, [transitionState.isExiting, currentNodeId]);
  
  // Start exit transition
  const startExitTransition = useStableCallback(() => {
    if (!isMountedRef.current) return;
    
    setTransitionState({
      isActive: false,
      isExiting: true
    });
    
    // Set document to black
    if (typeof document !== 'undefined') {
      document.documentElement.classList.add('black-transition-active');
    }
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
        
        // Exit after a longer delay for journal acquisition
        setTimeout(() => {
          if (isMountedRef.current) {
            startExitTransition();
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
      
      // Exit after a short delay
      setTimeout(() => {
        if (isMountedRef.current) {
          startExitTransition();
        }
      }, 1500);
    } catch (error) {
      console.error('[ChallengeRouter] Error completing challenge:', error);
      updateLocalState({
        error: error instanceof Error ? error.message : 'Unknown error in completion'
      });
    }
  }, [updateLocalState, hasJournal, currentNodeId, currentCharacterId, startExitTransition]);
  
  // ===== LIFECYCLE EFFECTS =====
  // Reset challenge state when node changes
  useEffect(() => {
    if (currentNodeId) {
      console.log(`[ChallengeRouter] Node changed to: ${currentNodeId}`, { 
        currentNodeId, 
        hasJournal
      });
      updateLocalState({
        challengeComplete: false,
        error: null,
        nodeDetailsFetched: true
      });
      
      // Reset animation tracking
      hasAnimatedRef.current = false;
      
      // Reset the transition state to inactive first
      setTransitionState({
        isActive: false,
        isExiting: false
      });
      
      // Get direct access to game store for debug event
      try {
        const gameStore = useGameStore.getState();
        console.log('[ChallengeRouter] Game store state:', { 
          hasCurrentNode: !!gameStore.currentNodeId,
          currentNodeId: gameStore.currentNodeId,
          hasCharacter: !!gameStore.currentCharacterId,
          characterId: gameStore.currentCharacterId
        });
        
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
      console.log('[ChallengeRouter] Node cleared, resetting state');
      updateLocalState({
        nodeDetailsFetched: false
      });
    }
  }, [currentNodeId, updateLocalState, hasJournal]);
  
  // Important: Separate effect to trigger animation AFTER render
  useEffect(() => {
    // Only trigger animation when we have a node ID and haven't animated yet
    if (currentNodeId && localState.nodeDetailsFetched && !hasAnimatedRef.current) {
      console.log('[ChallengeRouter] Ready for animation, triggering entrance transition');
      
      // Reset the transition completed state
      transitionCompletedRef.current = false;
      
      // Use requestAnimationFrame to ensure we're past initial render
      requestAnimationFrame(() => {
        if (!isMountedRef.current) return;
        
        // Clear any existing fade overlay to ensure we don't get stuck on black
        const existingOverlay = document.getElementById('map-fade-overlay');
        if (existingOverlay && existingOverlay.parentNode) {
          existingOverlay.parentNode.removeChild(existingOverlay);
        }
        
        // Get the node position from global state, if available
        try {
          // Check if we have stored click coordinates
          if (typeof window !== 'undefined' && (window as any).__LAST_NODE_CLICK_POS__) {
            const lastPos = (window as any).__LAST_NODE_CLICK_POS__;
            if (lastPos.x && lastPos.y) {
              setNodePosition({
                x: lastPos.x,
                y: lastPos.y
              });
              console.log(`[ChallengeRouter] Using click position: x=${lastPos.x}, y=${lastPos.y}`);
            }
          }
        } catch (err) {
          console.warn('[ChallengeRouter] Error getting node position:', err);
        }
        
        // Trigger animation in the next tick to ensure DOM is ready
        setTimeout(() => {
          if (isMountedRef.current) {
            console.log('[ChallengeRouter] Activating entrance transition');
            setTransitionState({
              isActive: true,
              isExiting: false
            });
            hasAnimatedRef.current = true;
            
            // Set timeout to remove the transition effects
            setTimeout(() => {
              if (isMountedRef.current) {
                transitionCompletedRef.current = true;
              }
            }, 2500); // Slightly less than the 3000ms transition duration
          }
        }, 50);
      });
    }
  }, [currentNodeId, localState.nodeDetailsFetched]);
  
  // Mount/unmount tracking
  useEffect(() => {
    isMountedRef.current = true;
    console.log('[ChallengeRouter] Mounted');
    
    // Clean up refs and timers
    return () => {
      isMountedRef.current = false;
      hasAnimatedRef.current = false;
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
      <div className="flex items-center justify-center h-full w-full bg-black">
        <div className="text-white">Loading challenge...</div>
      </div>
    );
  }
  
  // Show error state if there was an error
  if (localState.error) {
    return (
      <div className="flex items-center justify-center h-full w-full bg-black">
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
  console.log(`[ChallengeRouter] Rendering ConversationFormat with nodeId: ${currentNodeId}, characterId: ${currentCharacterId}, transitionActive: ${transitionState.isActive}, hasAnimated: ${hasAnimatedRef.current}`);

  // Map specific nodes to their respective characters if not set
  let effectiveCharacterId = currentCharacterId;
  if (!effectiveCharacterId) {
    // Default character mapping based on node ID
    const nodeToCharacterMap: Record<string, string> = {
      'start': 'kapoor',
      'path-a1': 'kapoor',
      'path-a2': 'jesse',
      'path-a3': 'quinn',
      'path-a4': 'garcia'
    };
    
    effectiveCharacterId = nodeToCharacterMap[currentNodeId as string] || 'kapoor';
    console.log(`[ChallengeRouter] Using mapped character: ${effectiveCharacterId} for node: ${currentNodeId}`);
  }

  return (
    <div className="w-full h-full bg-black flex flex-col justify-center items-center">
      <style jsx global>{`
        .black-transition-active {
          background-color: black !important;
        }
        .black-transition-active * {
          background-color: transparent !important;
        }
        .gpu-accelerated {
          transform: translateZ(0);
          will-change: opacity, background-color;
          backface-visibility: hidden;
        }
        
        /* Glowing line animation for transitions */
        @keyframes glowLines {
          0% { transform: translateX(-100%); opacity: 0.2; }
          50% { opacity: 0.8; }
          100% { transform: translateX(100%); opacity: 0.2; }
        }
        
        .transition-glow-line {
          position: absolute;
          height: 1px;
          width: 80%;
          background: linear-gradient(
            90deg, 
            transparent, 
            rgba(64, 156, 255, 0.4), 
            rgba(64, 156, 255, 0.8), 
            rgba(64, 156, 255, 0.4), 
            transparent
          );
          z-index: 999;
          opacity: 0;
          left: 10%;
          transform: translateX(-100%);
          filter: blur(1px);
        }
        
        .transition-glow-line-1 {
          top: 30%;
          animation: glowLines 3s ease-in-out infinite;
          animation-delay: 0.2s;
        }
        
        .transition-glow-line-2 {
          top: 60%;
          animation: glowLines 3s ease-in-out infinite;
          animation-delay: 0.8s;
          background: linear-gradient(
            90deg, 
            transparent, 
            rgba(120, 220, 180, 0.4), 
            rgba(120, 220, 180, 0.8), 
            rgba(120, 220, 180, 0.4), 
            transparent
          );
        }
        
        .transition-glow-line-3 {
          top: 80%;
          animation: glowLines 3s ease-in-out infinite;
          animation-delay: 1.4s;
          background: linear-gradient(
            90deg, 
            transparent, 
            rgba(255, 160, 100, 0.4), 
            rgba(255, 160, 100, 0.8), 
            rgba(255, 160, 100, 0.4), 
            transparent
          );
        }
        
        .transition-effects-fade-out {
          opacity: 0;
          transition: opacity 1s ease-out;
        }
      `}</style>
      
      {/* Animated elements for transitions */}
      <div className={`absolute inset-0 overflow-hidden pointer-events-none ${transitionCompletedRef.current ? 'transition-effects-fade-out' : ''}`}>
        <div className="transition-glow-line transition-glow-line-1"></div>
        <div className="transition-glow-line transition-glow-line-2"></div>
        <div className="transition-glow-line transition-glow-line-3"></div>
      </div>
      
      <PixelTransition
        isActive={transitionState.isActive}
        type="fade-black" 
        duration={3000}
        onAnimationComplete={handleTransitionComplete}
        className="absolute inset-0 flex-grow flex flex-col justify-center items-center"
      >
        <div className="h-full w-full max-w-6xl bg-transparent flex-grow flex flex-col justify-center" style={{ zIndex: 50, position: 'relative', pointerEvents: 'auto' }}>
          <ConversationFormat
            nodeId={currentNodeId}
            characterId={effectiveCharacterId}
            stageId={currentNodeId}
            onComplete={handleConversationComplete}
          />
        </div>
      </PixelTransition>
    </div>
  );
}