// app/components/debug/UnifiedDebugPanel.tsx
'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { usePrimitiveStoreValue, useStableCallback } from '@/app/core/utils/storeHooks';
import useGameStateMachine from '@/app/core/statemachine/GameStateMachine';
import { useDialogueStateMachine } from '@/app/core/dialogue/DialogueStateMachine';
import { useGameStore } from '@/app/store/gameStore';
import { useJournalStore } from '@/app/store/journalStore';
import { useKnowledgeStore } from '@/app/store/knowledgeStore';
import { useResourceStore } from '@/app/store/resourceStore';
import ConstellationDebugControls from './ConstellationDebugControls';
import { safeDispatch } from '@/app/core/events/CentralEventBus';
import { GameEventType } from '@/app/core/events/EventTypes';

// Type declarations for window extensions
declare global {
  interface Window {
    __FORCE_REINITIALIZE__?: () => void;
    __TOGGLE_DEBUG_PANEL__?: () => void;
    __INIT_STATE__?: any;
  }
}

/**
 * Unified Debug Panel
 * 
 * A comprehensive debug interface that combines all debugging features:
 * - Game state and player info
 * - Map debugging and node selection
 * - Action debugging tools
 * - System status
 * - Performance metrics
 * - Constellation visualization controls
 */
export default function UnifiedDebugPanel() {
  // Panel state
  const [isExpanded, setIsExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState<'game' | 'map' | 'actions' | 'system' | 'events' | 'constellation'>('game');
  const [clickPending, setClickPending] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<{message: string, type: 'success'|'error'|'info'|null}>({
    message: '',
    type: null
  });
  const [storageStatus, setStorageStatus] = useState({
    game: false,
    journal: false,
    knowledge: false
  });
  const [clickPosition, setClickPosition] = useState<{x: number, y: number} | null>(null);
  const [clickTarget, setClickTarget] = useState<string>('None');
  const [clickCount, setClickCount] = useState(0);
  const [criticalEvents, setCriticalEvents] = useState<Array<{event: string, timestamp: number}>>([]);
  const [consoleOutput, setConsoleOutput] = useState<string[]>([]);
  
  // Store references - use the actual hooks properly
  // Don't store the hook functions themselves, we need their store objects
  const gameStoreState = useGameStore();
  const journalStoreState = useJournalStore();
  const knowledgeStoreState = useKnowledgeStore();
  const resourceStoreState = useResourceStore();
  const gameStateMachineState = useGameStateMachine();
  
  // Refs
  const mountedRef = useRef(true);
  const panelRef = useRef<HTMLDivElement>(null);
  const eventsEndRef = useRef<HTMLDivElement>(null);
  const initCompletedRef = useRef(false);
  const refreshNeededRef = useRef(false);
  
  // Store getState functions for direct access
  const storeRefs = useRef({
    gameStore: useGameStore,
    journalStore: useJournalStore,
    knowledgeStore: useKnowledgeStore,
    resourceStore: useResourceStore,
    gameStateMachine: useGameStateMachine
  });
  
  // Portal state
  const [portalElement, setPortalElement] = useState<HTMLElement | null>(null);
  
  // Initialize state reference with safe default values to prevent undefined errors
  const stateRef = useRef<any>({
    gamePhase: 'day',
    currentDay: 1,
    currentNodeId: null,
    isTransitioning: false,
    initialized: false,
    renderPhase: 'idle',
    hasJournal: false,
    journalTier: 'base',
    totalMastery: 0,
    discoveredNodeCount: 0,
    insight: 0,
    momentum: 0,
    player: { health: 0, maxHealth: 0 },
    completedNodeIds: [] // Add this for tracking completed nodes
  });
  
  // Helper for safely accessing store state
  function safeGetState<T, K>(
    store: any,
    selector: (state: any) => T,
    defaultValue: K
  ): T | K {
    try {
      if (!store) return defaultValue;
      const state = typeof store === 'function' ? store.getState() : store;
      if (!state) return defaultValue;
      return selector(state);
    } catch (e) {
      console.warn('Error accessing store state:', e);
      return defaultValue;
    }
  }
  
  // Refresh state values from the various stores
  const refreshStateValues = useCallback((
    options?: { force?: boolean, silent?: boolean } 
  ) => {
    if (!refreshNeededRef.current && !options?.force) return;
    
    // Reset the refresh flag
    refreshNeededRef.current = false;
    
    // Access stores via storeRefs for consistency
    const { gameStore, journalStore, knowledgeStore, resourceStore, gameStateMachine } = storeRefs.current;
    
    let hasChanges = false;
    const newState = { ...stateRef.current };
    
    // Helper to check if a value has changed
    const checkAndUpdate = <T,>(key: string, newValue: T): boolean => {
      if (JSON.stringify(newState[key]) !== JSON.stringify(newValue)) {
        newState[key] = newValue;
        return true;
      }
      return false;
    };
    
    stateRef.current = {
      // Game state primitives
      gamePhase: safeGetState(gameStateMachine, state => state?.gamePhase, 'day'),
      currentDay: safeGetState(gameStateMachine, state => state?.currentDay, 1),
      currentNodeId: safeGetState(gameStore, state => state?.currentNodeId, null),
      isTransitioning: safeGetState(gameStore, state => state?.isTransitioning, false),
      initialized: safeGetState(gameStore, state => state?.initialized, false),
      renderPhase: safeGetState(gameStore, state => state?.renderPhase, 'idle'),
      
      // Journal state
      hasJournal: safeGetState(journalStore, state => state?.hasJournal, false),
      journalTier: safeGetState(journalStore, state => state?.currentUpgrade, 'base'),
      
      // Knowledge primitives
      totalMastery: safeGetState(knowledgeStore, state => state?.totalMastery, 0),
      discoveredNodeCount: safeGetState(knowledgeStore, state => {
        if (!state || !state.nodes) return 0;
        return state.nodes.filter((n: any) => n && n.discovered).length;
      }, 0),
      
      // Resource primitives
      insight: safeGetState(resourceStore, state => state?.insight, 0),
      momentum: safeGetState(resourceStore, state => state?.momentum, 0),
      
      // Player data
      player: safeGetState(gameStore, state => state?.player, { health: 0, maxHealth: 0 }),
      
      // Get completed nodes from state machine
      completedNodeIds: safeGetState(gameStateMachine, state => state?.completedNodeIds, [])
    };
  }, []);
  
  // Update state values from all stores without causing a re-render
  const updateStateValues = useCallback(() => {
    try {
      // Call refreshStateValues with the force option
      refreshStateValues({ force: true });
    } catch (error) {
      console.error('Error updating state values:', error);
    }
  }, [refreshStateValues]);
  
  // Initialization effect to run once
  useEffect(() => {
    if (initCompletedRef.current) return;
    
    // Initialize the component once
    console.log('Initializing UnifiedDebugPanel');
    
    // Subscribe to the game store for changes
    const unsubscribe = useGameStore.subscribe(() => {
      // Just mark that we need a refresh, don't update state directly
      refreshNeededRef.current = true;
    });
    
    // Update console output logic
    const originalConsoleLog = console.log;
    const originalConsoleError = console.error;
    const originalConsoleWarn = console.warn;
    
    // Override console methods to capture output
    console.log = (...args) => {
      originalConsoleLog(...args);
      if (mountedRef.current) {
        // Use requestAnimationFrame to avoid setState during render
        requestAnimationFrame(() => {
          if (mountedRef.current) {
            setConsoleOutput(prev => [...prev.slice(-99), args.map(arg => 
              typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
            ).join(' ')]);
          }
        });
      }
    };
    
    console.error = (...args) => {
      originalConsoleError(...args);
      if (mountedRef.current) {
        const message = args.map(arg => 
          typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
        ).join(' ');
        
        // Use requestAnimationFrame to avoid setState during render
        requestAnimationFrame(() => {
          if (mountedRef.current) {
            setConsoleOutput(prev => [...prev.slice(-99), `ERROR: ${message}`]);
            setCriticalEvents(prev => [...prev, { event: `ERROR: ${message}`, timestamp: Date.now() }]);
          }
        });
      }
    };
    
    console.warn = (...args) => {
      originalConsoleWarn(...args);
      if (mountedRef.current) {
        // Use requestAnimationFrame to avoid setState during render
        requestAnimationFrame(() => {
          if (mountedRef.current) {
            setConsoleOutput(prev => [...prev.slice(-99), `WARN: ${args.map(arg => 
              typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
            ).join(' ')}`]);
          }
        });
      }
    };
    
    // Capture initial state values
    try {
      updateStateValues();
    } catch (error) {
      console.error('Error initializing state values:', error);
    }
    
    // Mark initialization as completed
    initCompletedRef.current = true;
    
    // Cleanup function
    return () => {
      console.log = originalConsoleLog;
      console.error = originalConsoleError;
      console.warn = originalConsoleWarn;
      unsubscribe();
    };
  }, [updateStateValues]);
  
  // Auto-refresh effect that runs on an interval instead of on every render
  useEffect(() => {
    // Create a reference to hold the latest state values for stable access
    const stateCache = {
      gameStore: null as any,
      journalStore: null as any,
      knowledgeStore: null as any,
      resourceStore: null as any
    };
    
    // Function to update the cache without causing re-renders
    const updateCache = () => {
      stateCache.gameStore = useGameStore.getState();
      stateCache.journalStore = useJournalStore.getState();
      stateCache.knowledgeStore = useKnowledgeStore.getState();
      stateCache.resourceStore = useResourceStore.getState();
    };
    
    // Create an interval for background refresh without causing re-renders
    const intervalId = setInterval(() => {
      if (refreshNeededRef.current && mountedRef.current) {
        try {
          // Update the cache first
          updateCache();
          
          // Don't trigger React updates here, just update the ref silently
          refreshStateValues({ force: true, silent: true });
          refreshNeededRef.current = false;
        } catch (error) {
          console.error('Error in auto-refresh:', error);
        }
      }
    }, 500); // Update every 500ms if needed
    
    // Do initial cache update
    updateCache();
    
    return () => clearInterval(intervalId);
  }, [refreshStateValues]);
  
  // Track mounted state - keep this simple with no dependencies
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);
  
  // Feedback message timeout
  useEffect(() => {
    if (actionFeedback.type) {
      const timer = setTimeout(() => {
        if (mountedRef.current) {
          setActionFeedback({ message: '', type: null });
        }
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [actionFeedback]);
  
  // Toggle panel expansion with stable references
  const togglePanel = useCallback(() => {
    setIsExpanded(prev => !prev);
    if (!isExpanded) {
      // Only refresh when expanding to avoid constant updates
      updateStateValues();
    }
  }, [isExpanded, updateStateValues]);
  
  // Show action feedback
  const showFeedback = useCallback((message: string, type: 'success'|'error'|'info') => {
    setActionFeedback({ message, type });
  }, []);
  
  // STABLE ACTION HANDLERS
  const handleAction = useStableCallback((action: () => void, pendingMessage: string, successMessage: string) => {
    if (clickPending) return;
    
    setClickPending(true);
    showFeedback(pendingMessage, 'info');
    
    try {
      action();
      showFeedback(successMessage, 'success');
      
      // Use a timeout to avoid render loop issues
      // and ensure state updates are sequential
      setTimeout(() => {
        try {
          updateStateValues();
        } catch (error) {
          console.error('Error updating state after action:', error);
        }
      }, 100);
    } catch (error) {
      console.error('Action error:', error);
      showFeedback('Error: ' + (error instanceof Error ? error.message : 'Unknown error'), 'error');
    } finally {
      // Always clear pending state after a delay
      setTimeout(() => {
        if (mountedRef.current) {
          setClickPending(false);
        }
      }, 500);
    }
  }, [clickPending, showFeedback, updateStateValues]);
  
  // Common actions
  const giveJournal = useCallback(() => {
    const journalStore = useJournalStore.getState();
    
    handleAction(
      () => {
        if (journalStore && journalStore.initializeJournal) {
          journalStore.initializeJournal('technical', 'debug_panel');
        } else {
          throw new Error('Journal initialization not available');
        }
      },
      'Initializing journal...',
      'Journal acquired!'
    );
  }, [handleAction]);
  
  const handleDayTransition = useCallback(() => {
    const currentPhase = stateRef.current.gamePhase;
    
    handleAction(
      () => {
        if (currentPhase === 'day' && gameStateMachineState?.beginDayCompletion) {
          gameStateMachineState.beginDayCompletion();
        } else if (currentPhase === 'night' && gameStateMachineState?.beginNightCompletion) {
          gameStateMachineState.beginNightCompletion();
        } else {
          throw new Error('Cannot transition from current phase');
        }
      },
      'Transitioning...',
      'Phase transition initiated'
    );
  }, [handleAction, gameStateMachineState]);
  
  const addInsight = useCallback(() => {
    const resourceStore = useResourceStore.getState();
    
    handleAction(
      () => {
        if (resourceStore?.updateInsight) {
          resourceStore.updateInsight(25, 'debug_panel');
        } else {
          throw new Error('Resource store not available');
        }
      },
      'Adding insight...',
      '+25 Insight added'
    );
  }, [handleAction]);
  
  const addMomentum = useCallback(() => {
    const resourceStore = useResourceStore.getState();
    const currentMomentum = typeof stateRef.current.momentum === 'number' 
      ? stateRef.current.momentum 
      : 0;
    
    handleAction(
      () => {
        if (resourceStore?.setMomentum) {
          resourceStore.setMomentum(Math.min(3, currentMomentum + 1));
        } else {
          throw new Error('Resource store not available');
        }
      },
      'Adding momentum...',
      `Momentum set to ${Math.min(3, currentMomentum + 1)}`
    );
  }, [handleAction]);
  
  const addKnowledge = useCallback(() => {
    const knowledgeStore = useKnowledgeStore.getState();
    
    handleAction(
      () => {
        if (knowledgeStore?.updateMastery && knowledgeStore?.discoverConcept) {
          knowledgeStore.updateMastery('radiation-dosimetry', 15);
          knowledgeStore.discoverConcept('radiation-dosimetry');
        } else {
          throw new Error('Knowledge store not available');
        }
      },
      'Adding knowledge...',
      'Radiation Dosimetry +15'
    );
  }, [handleAction]);
  
  const resetGame = useCallback(() => {
    if (clickPending) return;
    
    if (typeof window === 'undefined') return;
    
    setClickPending(true);
    
    if (window.confirm('Reset game state? This will clear all progress.')) {
      try {
        showFeedback('Resetting game...', 'info');
        
        // Clear local storage
        localStorage.removeItem('rogue-resident-game-v2');
        localStorage.removeItem('rogue-resident-journal');
        localStorage.removeItem('rogue-resident-knowledge');
        
        // Update storage status
        setStorageStatus({
          game: false,
          journal: false,
          knowledge: false
        });
        
        // Attempt to use the window reset function if available
        if ((window as any).__FORCE_REINITIALIZE__) {
          (window as any).__FORCE_REINITIALIZE__();
          showFeedback('Game reset successfully', 'success');
        } else {
          window.location.reload();
        }
      } catch (error) {
        console.error('Error resetting game:', error);
        showFeedback('Error resetting game', 'error');
      }
    } else {
      showFeedback('Reset cancelled', 'info');
    }
    
    setTimeout(() => {
      if (mountedRef.current) {
        setClickPending(false);
      }
    }, 500);
  }, [clickPending, showFeedback]);
  
  // Node selection actions
  const selectNode = useCallback((nodeId: string) => {
    const gameStore = useGameStore.getState();
    
    handleAction(
      () => {
        if (gameStore?.setCurrentNode) {
          gameStore.setCurrentNode(nodeId);
        } else {
          throw new Error('Game store not available');
        }
      },
      'Selecting node...',
      `Node ${nodeId} selected`
    );
  }, [handleAction]);
  
  // New action to complete current node
  const completeCurrentNode = useCallback(() => {
    const gameStore = useGameStore.getState();
    const currentNodeId = stateRef.current.currentNodeId;
    
    handleAction(
      () => {
        if (!currentNodeId) {
          throw new Error('No node currently selected');
        }
        
        if (gameStore?.completeNode) {
          // Call the game store's complete node function
          gameStore.completeNode(currentNodeId);
          
          // Explicitly mark the node as completed in the state machine
          try {
            if (typeof window !== 'undefined' && window.__GAME_STATE_MACHINE_DEBUG__?.getCurrentState) {
              const gameStateMachine = window.__GAME_STATE_MACHINE_DEBUG__.getCurrentState();
              if (gameStateMachine && typeof gameStateMachine.markNodeCompleted === 'function') {
                console.log(`[Debug] Marking node ${currentNodeId} as completed in state machine`);
                gameStateMachine.markNodeCompleted(currentNodeId);
                
                // Log the updated completedNodeIds array
                if (gameStateMachine.completedNodeIds) {
                  console.log('[Debug] Updated completed nodes:', gameStateMachine.completedNodeIds);
                }
              }
            }
          } catch (err) {
            console.error('[Debug] Error updating state machine:', err);
          }
          
          // Dispatch node completed event for listeners
          safeDispatch(GameEventType.NODE_COMPLETED, { 
            nodeId: currentNodeId,
            character: 'kapoor',
            result: {
              relationshipChange: 1
            }
          });
          
          // After completion, return to map
          setTimeout(() => {
            if (gameStore?.setCurrentNode) {
              gameStore.setCurrentNode(null);
              
              // Force refresh of the game state to ensure UI updates
              refreshNeededRef.current = true;
              updateStateValues();
            }
          }, 500);
        } else {
          throw new Error('Game store not available');
        }
      },
      'Completing current node...',
      `Node ${currentNodeId} completed`
    );
  }, [handleAction, updateStateValues]);
  
  const clearCurrentNode = useCallback(() => {
    const gameStore = useGameStore.getState();
    const currentNodeId = stateRef.current.currentNodeId;
    
    handleAction(
      () => {
        if (!currentNodeId) {
          throw new Error('No node currently selected');
        }
        
        if (gameStore?.setCurrentNode) {
          gameStore.setCurrentNode(null);
        } else {
          throw new Error('Game store not available');
        }
      },
      'Clearing node selection...',
      'Node selection cleared'
    );
  }, [handleAction]);
  
  // Add a new function to refresh map nodes
  const refreshMapState = useCallback(() => {
    handleAction(
      () => {
        // Force refresh of the state machine data
        if (typeof window !== 'undefined' && window.__GAME_STATE_MACHINE_DEBUG__?.getCurrentState) {
          const gameStateMachine = window.__GAME_STATE_MACHINE_DEBUG__.getCurrentState();
          if (gameStateMachine) {
            console.log('[Debug] Refreshing map state...');
            
            // Refresh available nodes
            if (typeof gameStateMachine.refreshAvailableNodes === 'function') {
              gameStateMachine.refreshAvailableNodes();
              console.log('[Debug] Available nodes refreshed.');
            }
            
            // Log completed nodes for verification
            if (gameStateMachine.completedNodeIds) {
              console.log('[Debug] Current completed nodes:', gameStateMachine.completedNodeIds);
            }
          }
        }
        
        // Force UI refresh
        refreshNeededRef.current = true;
        updateStateValues();
        
        // Refresh the map by triggering a state change and then reverting it
        const gameStore = useGameStore.getState();
        const currentNodeId = stateRef.current.currentNodeId;
        
        if (gameStore?.setCurrentNode) {
          // If we're on the map (null), briefly set a node and then revert
          if (currentNodeId === null) {
            // Simulate a node selection and return to map to force refresh
            setTimeout(() => {
              gameStore.setCurrentNode('temp-refresh');
              setTimeout(() => {
                gameStore.setCurrentNode(null);
              }, 50);
            }, 50);
          }
        }
      },
      'Refreshing map state...',
      'Map state refreshed'
    );
  }, [handleAction, updateStateValues]);
  
  // Add a new function to mark specific nodes as completed
  const markNodeCompleted = useCallback((nodeId: string) => {
    handleAction(
      () => {
        if (!nodeId) {
          throw new Error('No node ID provided');
        }
        
        // Update the game store
        const gameStore = useGameStore.getState();
        if (gameStore?.completeNode) {
          gameStore.completeNode(nodeId);
        }
        
        // Explicitly mark the node as completed in the state machine
        try {
          if (typeof window !== 'undefined' && window.__GAME_STATE_MACHINE_DEBUG__?.getCurrentState) {
            const gameStateMachine = window.__GAME_STATE_MACHINE_DEBUG__.getCurrentState();
            if (gameStateMachine && typeof gameStateMachine.markNodeCompleted === 'function') {
              console.log(`[Debug] Manually marking node ${nodeId} as completed`);
              gameStateMachine.markNodeCompleted(nodeId);
              
              // Refresh available nodes
              if (typeof gameStateMachine.refreshAvailableNodes === 'function') {
                gameStateMachine.refreshAvailableNodes();
              }
              
              // Log the updated completedNodeIds array
              if (gameStateMachine.completedNodeIds) {
                console.log('[Debug] Updated completed nodes:', gameStateMachine.completedNodeIds);
              }
            }
          }
        } catch (err) {
          console.error('[Debug] Error updating state machine:', err);
        }
        
        // Dispatch node completed event for listeners
        safeDispatch(GameEventType.NODE_COMPLETED, { 
          nodeId: nodeId,
          character: 'kapoor', 
          result: {
            relationshipChange: 1
          }
        });
        
        // Force UI refresh
        refreshNeededRef.current = true;
        updateStateValues();
        
        // Use the same refresh technique as refreshMapState
        setTimeout(() => refreshMapState(), 100);
      },
      `Marking node ${nodeId} as completed...`,
      `Node ${nodeId} marked as completed`
    );
  }, [handleAction, updateStateValues, refreshMapState]);
  
  // Tab renderers
  const renderGameTab = () => {
    // Don't call refreshStateValues during render
    // refreshStateValues();
    const state = stateRef.current || {};
    const player = state.player || { health: 0, maxHealth: 0 };
    
    return (
      <div className="p-3 bg-gray-800/80 rounded-md">
        <h3 className="font-pixel text-sm mb-2 text-blue-400">Game State</h3>
        <div className="bg-black/60 p-2 rounded pixel-borders">
          <div className="flex justify-between mb-1">
            <span>Phase:</span>
            <span className="text-green-400">{state.gamePhase || 'day'}</span>
          </div>
          <div className="flex justify-between mb-1">
            <span>Day:</span>
            <span>{state.currentDay || 1}</span>
          </div>
          <div className="flex justify-between mb-1">
            <span>Current Node:</span>
            <span className="font-mono text-xs">{state.currentNodeId || 'none'}</span>
          </div>
          <div className="flex justify-between mb-1">
            <span>Journal:</span>
            <span>{state.hasJournal ? state.journalTier : 'none'}</span>
          </div>
          <div className="flex justify-between mb-1">
            <span>Transitioning:</span>
            <span>{state.isTransitioning ? 'Yes' : 'No'}</span>
          </div>
          <div className="flex justify-between">
            <span>Mastery:</span>
            <span>{state.totalMastery || 0}% ({state.discoveredNodeCount || 0} nodes)</span>
          </div>
        </div>
        
        <h3 className="font-pixel text-sm mt-3 mb-2 text-blue-400">Player Stats</h3>
        <div className="bg-black/60 p-2 rounded pixel-borders">
          <div className="flex justify-between mb-1">
            <span>Health:</span>
            <span className="text-red-400">{player.health}/{player.maxHealth}</span>
          </div>
          <div className="flex justify-between mb-1">
            <span>Insight:</span>
            <span className="text-blue-300">{state.insight || 0}/100</span>
          </div>
          <div className="flex justify-between">
            <span>Momentum:</span>
            <span className="text-orange-300">{state.momentum || 0}/3</span>
          </div>
        </div>
        
        <h3 className="font-pixel text-sm mt-3 mb-2 text-blue-400">Storage</h3>
        <div className="text-xs text-gray-400 bg-black/60 p-2 rounded pixel-borders">
          <div>Game: {storageStatus.game ? '✓' : '✗'}</div>
          <div>Journal: {storageStatus.journal ? '✓' : '✗'}</div>
          <div>Knowledge: {storageStatus.knowledge ? '✓' : '✗'}</div>
        </div>
      </div>
    );
  };
  
  const renderMapTab = () => {
    // Don't call refreshStateValues during render
    // refreshStateValues();
    const state = stateRef.current || {};
    
    return (
      <div className="p-3 bg-gray-800/80 rounded-md">
        <h3 className="font-pixel text-sm mb-2 text-blue-400">Map Debug</h3>
        <div className="bg-black/60 p-2 rounded pixel-borders mb-2">
          <div className="flex justify-between mb-1">
            <span>Current Node:</span>
            <span className="font-mono text-xs">{state.currentNodeId || 'none'}</span>
          </div>
          <div className="flex justify-between mb-1">
            <span>Click Count:</span>
            <span>{clickCount}</span>
          </div>
          <div className="flex justify-between mb-1">
            <span>Click Target:</span>
            <span className="text-xs">{clickTarget}</span>
          </div>
          <div className="flex justify-between mb-1">
            <span>Click Position:</span>
            <span>{clickPosition ? `${clickPosition.x.toFixed(0)}, ${clickPosition.y.toFixed(0)}` : 'None'}</span>
          </div>
          <div className="flex justify-between">
            <span>Render Phase:</span>
            <span>{state.renderPhase || 'idle'}</span>
          </div>
        </div>
        
        {/* Node State Management */}
        <h3 className="font-pixel text-sm mb-2 text-blue-400">Node State Management</h3>
        <div className="w-full mb-3 bg-black/60 p-2 rounded pixel-borders">
          <button 
            className="w-full px-2 py-1 mb-2 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs pixel-button"
            onClick={refreshMapState}
          >
            Refresh Map State
          </button>
          <div className="flex justify-between mb-1">
            <button 
              className="px-2 py-1 bg-yellow-600 hover:bg-yellow-500 text-white rounded text-xs pixel-button"
              onClick={completeCurrentNode}
              disabled={!state.currentNodeId}
            >
              Complete Current Node
            </button>
            <button 
              className="px-2 py-1 bg-gray-600 hover:bg-gray-500 text-white rounded text-xs pixel-button"
              onClick={clearCurrentNode}
              disabled={!state.currentNodeId}
            >
              Close Node
            </button>
          </div>
          
          {/* Force Completion Buttons */}
          <div className="mt-2 pt-2 border-t border-gray-700">
            <h4 className="text-xs text-yellow-400 mb-1">Force Node Completion:</h4>
            <div className="flex flex-wrap gap-2">
              <button 
                className="px-2 py-1 bg-red-600 hover:bg-red-500 text-white rounded text-xs pixel-button"
                onClick={() => markNodeCompleted('start')}
              >
                Mark Start Completed
              </button>
              <button 
                className="px-2 py-1 bg-red-600 hover:bg-red-500 text-white rounded text-xs pixel-button"
                onClick={() => markNodeCompleted('path-a1')}
              >
                Mark Path A1 Completed
              </button>
              <button 
                className="px-2 py-1 bg-red-600 hover:bg-red-500 text-white rounded text-xs pixel-button"
                onClick={() => markNodeCompleted('enc-1')}
              >
                Mark Enc-1 Completed
              </button>
              <button 
                className="px-2 py-1 bg-red-600 hover:bg-red-500 text-white rounded text-xs pixel-button"
                onClick={() => markNodeCompleted('chal-1')}
              >
                Mark Chal-1 Completed
              </button>
              <button 
                className="px-2 py-1 bg-red-600 hover:bg-red-500 text-white rounded text-xs pixel-button"
                onClick={() => markNodeCompleted('hub-1')}
              >
                Mark Hub-1 Completed
              </button>
              <button 
                className="px-2 py-1 bg-red-600 hover:bg-red-500 text-white rounded text-xs pixel-button"
                onClick={() => markNodeCompleted('elite-1')}
              >
                Mark Elite-1 Completed
              </button>
            </div>
          </div>
          
          {/* View Completed Nodes */}
          <div className="mt-2 pt-2 border-t border-gray-700">
            <h4 className="text-xs text-yellow-400 mb-1">Completed Nodes:</h4>
            <div className="text-xs bg-black/50 p-2 rounded max-h-20 overflow-y-auto">
              {state.completedNodeIds ? (
                state.completedNodeIds.length > 0 ? 
                  state.completedNodeIds.map((id: string) => (
                    <div key={id} className="px-1 py-0.5 bg-green-900/30 rounded mb-1">
                      {id}
                    </div>
                  )) : 
                  <div className="text-gray-400">No completed nodes</div>
              ) : (
                <div className="text-gray-400">Loading...</div>
              )}
            </div>
          </div>
        </div>
        
        <h3 className="font-pixel text-sm mb-2 text-blue-400">Node Selection</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {/* Kapoor Map Nodes Section */}
          <div className="w-full mb-2">
            <h4 className="text-xs text-yellow-400 mb-1">Map Nodes:</h4>
            <div className="flex flex-wrap gap-2">
              <button 
                className="px-2 py-1 bg-green-600 hover:bg-green-500 text-white rounded text-xs pixel-button"
                onClick={() => selectNode('start')}
              >
                Start Node
              </button>
              
              {/* First Row - Paths */}
              <div className="w-full mt-1 mb-1 border-t border-gray-700"></div>
              <h5 className="text-xs text-blue-300 w-full">First Row:</h5>
              <button 
                className="px-2 py-1 bg-green-600 hover:bg-green-500 text-white rounded text-xs pixel-button"
                onClick={() => selectNode('path-a1')}
              >
                Path A1
              </button>
              <button 
                className="px-2 py-1 bg-green-600 hover:bg-green-500 text-white rounded text-xs pixel-button"
                onClick={() => selectNode('path-a2')}
              >
                Path A2
              </button>
              <button 
                className="px-2 py-1 bg-green-600 hover:bg-green-500 text-white rounded text-xs pixel-button"
                onClick={() => selectNode('path-a3')}
              >
                Path A3
              </button>
              <button 
                className="px-2 py-1 bg-green-600 hover:bg-green-500 text-white rounded text-xs pixel-button"
                onClick={() => selectNode('path-a4')}
              >
                Path A4
              </button>
              
              {/* Second Row - Encounters */}
              <div className="w-full mt-1 mb-1 border-t border-gray-700"></div>
              <h5 className="text-xs text-blue-300 w-full">Second Row:</h5>
              <button 
                className="px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs pixel-button"
                onClick={() => selectNode('enc-1')}
              >
                Encounter 1
              </button>
              <button 
                className="px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs pixel-button"
                onClick={() => selectNode('enc-3')}
              >
                Encounter 3
              </button>
              <button 
                className="px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs pixel-button"
                onClick={() => selectNode('enc-5')}
              >
                Encounter 5
              </button>
              <button 
                className="px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs pixel-button"
                onClick={() => selectNode('enc-6')}
              >
                Encounter 6
              </button>
              
              {/* Third Row - Challenges */}
              <div className="w-full mt-1 mb-1 border-t border-gray-700"></div>
              <h5 className="text-xs text-blue-300 w-full">Third Row:</h5>
              <button 
                className="px-2 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded text-xs pixel-button"
                onClick={() => selectNode('chal-1')}
              >
                Challenge 1
              </button>
              <button 
                className="px-2 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded text-xs pixel-button"
                onClick={() => selectNode('chal-3')}
              >
                Challenge 3
              </button>
              <button 
                className="px-2 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded text-xs pixel-button"
                onClick={() => selectNode('chal-5')}
              >
                Challenge 5
              </button>
              <button 
                className="px-2 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded text-xs pixel-button"
                onClick={() => selectNode('chal-6')}
              >
                Challenge 6
              </button>
              
              {/* Fourth Row - Hubs */}
              <div className="w-full mt-1 mb-1 border-t border-gray-700"></div>
              <h5 className="text-xs text-blue-300 w-full">Fourth Row:</h5>
              <button 
                className="px-2 py-1 bg-yellow-600 hover:bg-yellow-500 text-white rounded text-xs pixel-button"
                onClick={() => selectNode('hub-1')}
              >
                Hub 1
              </button>
              <button 
                className="px-2 py-1 bg-yellow-600 hover:bg-yellow-500 text-white rounded text-xs pixel-button"
                onClick={() => selectNode('hub-2')}
              >
                Hub 2
              </button>
              <button 
                className="px-2 py-1 bg-yellow-600 hover:bg-yellow-500 text-white rounded text-xs pixel-button"
                onClick={() => selectNode('hub-3')}
              >
                Hub 3
              </button>
              <button 
                className="px-2 py-1 bg-yellow-600 hover:bg-yellow-500 text-white rounded text-xs pixel-button"
                onClick={() => selectNode('hub-4')}
              >
                Hub 4
              </button>
              
              {/* Fifth Row - Elites */}
              <div className="w-full mt-1 mb-1 border-t border-gray-700"></div>
              <h5 className="text-xs text-blue-300 w-full">Fifth Row:</h5>
              <button 
                className="px-2 py-1 bg-red-600 hover:bg-red-500 text-white rounded text-xs pixel-button"
                onClick={() => selectNode('elite-1')}
              >
                Elite 1
              </button>
              <button 
                className="px-2 py-1 bg-red-600 hover:bg-red-500 text-white rounded text-xs pixel-button"
                onClick={() => selectNode('elite-2')}
              >
                Elite 2
              </button>
              <button 
                className="px-2 py-1 bg-red-600 hover:bg-red-500 text-white rounded text-xs pixel-button"
                onClick={() => selectNode('elite-3')}
              >
                Elite 3
              </button>
              <button 
                className="px-2 py-1 bg-red-600 hover:bg-red-500 text-white rounded text-xs pixel-button"
                onClick={() => selectNode('elite-4')}
              >
                Elite 4
              </button>
            </div>
          </div>
          
          <div className="w-full mt-2">
            <button 
              className="px-2 py-1 bg-gray-600 hover:bg-gray-500 text-white rounded text-xs pixel-button w-full"
              onClick={clearCurrentNode}
              disabled={!state.currentNodeId}
            >
              Reset Selection
            </button>
          </div>
        </div>
      </div>
    );
  };
  
  const renderActionsTab = () => {
    // Don't call refreshStateValues during render
    // refreshStateValues();
    const state = stateRef.current || {};
    
    return (
      <div className="p-3 bg-gray-800/80 rounded-md">
        <h3 className="font-pixel text-sm mb-2 text-blue-400">Game Actions</h3>
        <div className="grid grid-cols-2 gap-2">
          <button
            className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-500 disabled:opacity-50 transition pixel-button"
            onClick={handleDayTransition}
            disabled={clickPending}
          >
            {state.gamePhase === 'day' ? 'End Day' : 'Start Day'}
          </button>
          
          <button
            className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-500 disabled:opacity-50 transition pixel-button"
            onClick={giveJournal}
            disabled={state.hasJournal || clickPending}
          >
            Give Journal
          </button>
          
          <button
            className="px-2 py-1 bg-yellow-600 text-white text-xs rounded hover:bg-yellow-500 disabled:opacity-50 transition pixel-button"
            onClick={completeCurrentNode}
            disabled={!state.currentNodeId || clickPending}
          >
            Complete Node
          </button>
          
          <button
            className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-500 disabled:opacity-50 transition pixel-button"
            onClick={() => {
              handleAction(
                () => {
                  // Direct localStorage approach to clear journal
                  localStorage.removeItem('rogue-resident-journal');
                  
                  // Refresh state to reflect changes
                  setStorageStatus(prev => ({
                    ...prev,
                    journal: false
                  }));
                  
                  // Force page reload to apply changes
                  setTimeout(() => {
                    window.location.reload();
                  }, 500);
                },
                'Clearing journal...',
                'Journal cleared!'
              );
            }}
            disabled={!state.hasJournal || clickPending}
          >
            Clear Journal
          </button>
          
          <button
            className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-500 disabled:opacity-50 transition pixel-button"
            onClick={addInsight}
            disabled={clickPending || (state.insight || 0) >= 100}
          >
            Add Insight
          </button>
          
          <button
            className="px-2 py-1 bg-orange-600 text-white text-xs rounded hover:bg-orange-500 disabled:opacity-50 transition pixel-button"
            onClick={addMomentum}
            disabled={(state.momentum || 0) >= 3 || clickPending}
          >
            Add Momentum
          </button>
          
          <button
            className="px-2 py-1 bg-purple-600 text-white text-xs rounded hover:bg-purple-500 disabled:opacity-50 transition pixel-button"
            onClick={addKnowledge}
            disabled={clickPending}
          >
            Add Knowledge
          </button>
          
          <button
            className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-500 disabled:opacity-50 transition pixel-button"
            onClick={resetGame}
            disabled={clickPending}
          >
            Reset Game
          </button>
          
          <button
            className="px-2 py-1 col-span-2 bg-green-600 text-white text-xs rounded hover:bg-green-500 disabled:opacity-50 transition pixel-button"
            onClick={() => {
              handleAction(
                () => {
                  safeDispatch(
                    GameEventType.JOURNAL_ACQUIRED,
                    {
                      tier: 'technical',
                      character: 'kapoor',
                      source: 'debug_panel'
                    },
                    'debug_panel'
                  );
                },
                'Triggering journal acquisition...',
                'Journal acquisition event dispatched'
              );
            }}
            disabled={clickPending}
          >
            Manual Journal Acquisition
          </button>
        </div>
      </div>
    );
  };
  
  const renderSystemTab = () => {
    // Don't call refreshStateValues during render
    // refreshStateValues();
    const state = stateRef.current || {};
    
    return (
      <div className="p-3 bg-gray-800/80 rounded-md">
        <h3 className="font-pixel text-sm mb-2 text-blue-400">System Status</h3>
        <div className="bg-black/60 p-2 rounded pixel-borders">
          <div className="flex justify-between mb-1">
            <span>Initialized:</span>
            <span className={state.initialized ? 'text-green-400' : 'text-red-400'}>
              {state.initialized ? 'Yes' : 'No'}
            </span>
          </div>
          <div className="flex justify-between mb-1">
            <span>Render Phase:</span>
            <span>{state.renderPhase || 'idle'}</span>
          </div>
          <div className="flex justify-between mb-1">
            <span>Environment:</span>
            <span>{process.env.NODE_ENV}</span>
          </div>
        </div>
        
        <h3 className="font-pixel text-sm mt-3 mb-2 text-blue-400">API Status</h3>
        <div className="bg-black/60 p-2 rounded pixel-borders">
          <div className="text-xs mb-2">API connection status would go here</div>
        </div>
        
        <h3 className="font-pixel text-sm mt-3 mb-2 text-blue-400">Debug Controls</h3>
        <div className="flex flex-col gap-2">
          <button
            className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-500 disabled:opacity-50 transition pixel-button"
            onClick={() => {
              console.clear();
              showFeedback('Console cleared', 'success');
            }}
          >
            Clear Console
          </button>
        </div>
      </div>
    );
  };
  
  const renderEventsTab = () => {
    return (
      <div className="p-3 bg-gray-800/80 rounded-md">
        <h3 className="font-pixel text-sm mb-2 text-blue-400">Critical Events</h3>
        <div className="bg-black/60 p-2 rounded pixel-borders mb-3 max-h-40 overflow-y-auto">
          {criticalEvents.length > 0 ? (
            criticalEvents.map((item, index) => (
              <div key={index} className="text-xs mb-1">
                <span className="text-gray-400">[{new Date(item.timestamp).toLocaleTimeString()}]</span> {item.event}
              </div>
            ))
          ) : (
            <div className="text-xs text-gray-500">No critical events recorded</div>
          )}
        </div>
        
        <h3 className="font-pixel text-sm mb-2 text-blue-400">Console Output</h3>
        <div className="bg-black/60 p-2 rounded pixel-borders max-h-40 overflow-y-auto">
          {consoleOutput.length > 0 ? (
            consoleOutput.map((item, index) => (
              <div key={index} className="text-xs mb-1 font-mono">
                {item}
              </div>
            ))
          ) : (
            <div className="text-xs text-gray-500">No console output captured</div>
          )}
          <div ref={eventsEndRef} />
        </div>
      </div>
    );
  };
  
  // NEW: Render the constellation tab
  const renderConstellationTab = () => {
    return (
      <ConstellationDebugControls showFeedback={showFeedback} />
    );
  };
  
  // Render active tab content
  const renderTabContent = () => {
    // Don't call refreshStateValues during render
    // refreshStateValues();
    
    switch (activeTab) {
      case 'game': return renderGameTab();
      case 'map': return renderMapTab();
      case 'actions': return renderActionsTab();
      case 'system': return renderSystemTab();
      case 'events': return renderEventsTab();
      case 'constellation': return renderConstellationTab();
      default: return renderGameTab();
    }
  };
  
  // Create portal container on mount
  useEffect(() => {
    // Check if we're in the browser
    if (typeof document !== 'undefined') {
      // Remove any existing portal container first to avoid duplicates
      const existingContainer = document.getElementById('debug-panel-portal');
      if (existingContainer && existingContainer.parentNode) {
        existingContainer.parentNode.removeChild(existingContainer);
      }
      
      // Create a fresh portal container
      const portalContainer = document.createElement('div');
      portalContainer.id = 'debug-panel-portal';
      
      // Style it as a pure overlay container
      const style = portalContainer.style;
      style.position = 'fixed';
      style.top = '0';
      style.left = '0';
      style.width = '100vw';
      style.height = '100vh';
      style.pointerEvents = 'none';
      style.zIndex = '100000';
      style.overflow = 'visible';
      
      // Add it directly to the body
      document.body.appendChild(portalContainer);
      
      // Set it as our portal target
      setPortalElement(portalContainer);
      
      // Cleanup on unmount
      return () => {
        // Ensure we remove our specific container instance
        if (portalContainer.parentNode) {
          portalContainer.parentNode.removeChild(portalContainer);
        }
      };
    }
  }, []);
  
  // Main content to render
  const panelContent = (
    <div 
      ref={panelRef}
      className="fixed transition-all duration-300 pixel-borders"
      style={{
        width: isExpanded ? '350px' : '40px',
        right: '10px',
        bottom: '10px',
        backgroundColor: 'rgba(17, 24, 39, 0.9)', // bg-gray-900/90
        maxHeight: '80vh',
        backdropFilter: 'blur(4px)',
        boxShadow: '0 0 15px rgba(0,0,0,0.7)',
        zIndex: 999999,
        isolation: 'isolate',
        pointerEvents: 'auto', // Make sure it receives mouse events
        margin: 0,
        padding: 0,
        transform: 'translateZ(0)',
        willChange: 'transform',
      }}
    >
      {/* Header with toggle */}
      <div
        className="py-2 px-3 bg-blue-600 flex justify-between items-center cursor-pointer pixel-borders"
        onClick={togglePanel}
      >
        {isExpanded ? (
          <>
            <span className="font-pixel text-sm text-white">Rogue Resident Debug</span>
            <span className="text-white">×</span>
          </>
        ) : (
          <span
            style={{
              writingMode: 'vertical-rl',
              textOrientation: 'mixed',
              transform: 'rotate(180deg)',
              width: '100%',
              textAlign: 'center'
            }}
            className="font-pixel text-white text-sm"
          >
            Debug
          </span>
        )}
      </div>
      
      {/* Expanded content */}
      {isExpanded && (
        <div className="text-white overflow-y-auto" style={{ maxHeight: 'calc(80vh - 40px)' }}>
          {/* Tab navigation */}
          <div className="flex border-b border-gray-700 flex-wrap">
            <button
              className={`px-3 py-2 text-xs transition-colors ${activeTab === 'game' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-white'}`}
              onClick={() => setActiveTab('game')}
            >
              Game
            </button>
            <button
              className={`px-3 py-2 text-xs transition-colors ${activeTab === 'map' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-white'}`}
              onClick={() => setActiveTab('map')}
            >
              Map
            </button>
            <button
              className={`px-3 py-2 text-xs transition-colors ${activeTab === 'actions' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-white'}`}
              onClick={() => setActiveTab('actions')}
            >
              Actions
            </button>
            <button
              className={`px-3 py-2 text-xs transition-colors ${activeTab === 'constellation' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-white'}`}
              onClick={() => setActiveTab('constellation')}
            >
              Constellation
            </button>
            <button
              className={`px-3 py-2 text-xs transition-colors ${activeTab === 'system' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-white'}`}
              onClick={() => setActiveTab('system')}
            >
              System
            </button>
            <button
              className={`px-3 py-2 text-xs transition-colors ${activeTab === 'events' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-white'}`}
              onClick={() => setActiveTab('events')}
            >
              Events
            </button>
          </div>
          
          {/* Tab content */}
          <div className="p-2">
            {renderTabContent()}
          </div>
          
          {/* Action feedback */}
          {actionFeedback.type && (
            <div 
              className={`m-2 p-2 text-sm rounded text-center transition-opacity ${
                actionFeedback.type === 'success' ? 'bg-green-700/70' : 
                actionFeedback.type === 'error' ? 'bg-red-700/70' : 
                'bg-blue-700/70'
              }`}
            >
              {actionFeedback.message}
            </div>
          )}
        </div>
      )}
      
      {/* Optional global pixel styling */}
      <style jsx global>{`
        .pixel-borders {
          image-rendering: pixelated;
          box-shadow: 0 0 0 1px rgba(255,255,255,0.1);
          border: 1px solid rgba(0,0,0,0.4);
        }
        
        .pixel-button {
          image-rendering: pixelated;
          box-shadow: 0 2px 0 0 rgba(0,0,0,0.3);
          border: 1px solid rgba(255,255,255,0.1);
          transition: all 0.1s ease;
        }
        
        .pixel-button:active {
          transform: translateY(1px);
          box-shadow: 0 1px 0 0 rgba(0,0,0,0.3);
        }
        
        .font-pixel {
          font-family: 'Pixeloid Sans', monospace;
          letter-spacing: 0.5px;
        }
      `}</style>
    </div>
  );
  
  // Return the panel content inside a portal when possible
  return portalElement ? createPortal(panelContent, portalElement) : panelContent;
}