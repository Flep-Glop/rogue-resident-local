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
import KnowledgeSystemDebug from './KnowledgeSystemDebug';
import { 
  ResourceOutcomeService, 
  ResourceTier, 
  getResourceTierForSuccess
} from '@/app/core/resources/ResourceTierSystem';
import KnowledgeDiscoveryDebugger from './KnowledgeDiscoveryDebugger';
import AutoConnectionTester from './AutoConnectionTester';

// Type declarations for window extensions
declare global {
  interface Window {
    __FORCE_REINITIALIZE__?: () => void;
    __TOGGLE_DEBUG_PANEL__?: () => void;
    __INIT_STATE__?: any;
    __GAME_STATE_MACHINE_DEBUG__?: any;
    __DEBUG_COMPONENTS__?: {
      CharacterPortrait?: React.ComponentType<any>;
      [key: string]: any;
    };
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
  const [activeTab, setActiveTab] = useState<'game' | 'map' | 'actions' | 'system' | 'events' | 'constellation' | 'reactions' | 'knowledge' | 'resources' | 'knowledge-discovery' | 'connections'>('game');
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
  
  // Reactions tab state
  const [currentReaction, setCurrentReaction] = useState<'positive' | 'negative' | 'question' | 'surprise' | 'thinking' | 'idea' | null>(null);
  const [isShaking, setIsShaking] = useState(false);
  const [isOscillating, setIsOscillating] = useState(false);
  
  // Resources tab state
  const [resourceTestLog, setResourceTestLog] = useState<string[]>([]);
  
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
    
    // Expose components for debugging
    if (typeof window !== 'undefined') {
      // Create a debug components container if it doesn't exist
      if (!window.__DEBUG_COMPONENTS__) {
        window.__DEBUG_COMPONENTS__ = {};
      }
      
      // Dynamically import the CharacterPortrait component
      import('@/app/components/CharacterPortrait').then(module => {
        window.__DEBUG_COMPONENTS__.CharacterPortrait = module.default;
        console.log('[Debug] CharacterPortrait component loaded for debugging');
      }).catch(error => {
        console.error('[Debug] Failed to load CharacterPortrait:', error);
      });
    }
    
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
  
  // Tab definitions
  const tabs = [
    { id: 'game', label: 'Game' },
    { id: 'map', label: 'Map' },
    { id: 'actions', label: 'Actions' },
    { id: 'system', label: 'System' },
    { id: 'events', label: 'Events' },
    { id: 'constellation', label: 'Constellation' },
    { id: 'reactions', label: 'Reactions' },
    { id: 'knowledge', label: 'Knowledge' },
    { id: 'resources', label: 'Resources' },
    { id: 'knowledge-discovery', label: 'K-Discovery' },
    { id: 'connections', label: 'Connections' },
  ];
  
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
    
    // Define node groups based on actual nodes in the SimplifiedKapoorMap.tsx
    const nodeGroups = [
      {
        title: "Act 1",
        nodes: [
          { id: 'start', label: 'Start', color: 'green' },
          { id: 'path-a1', label: 'Path A1', color: 'green' },
          { id: 'path-a2', label: 'Path A2', color: 'green' },
          { id: 'enc-1', label: 'Encounter 1', color: 'blue' },
          { id: 'enc-3', label: 'Encounter 3', color: 'blue' },
          { id: 'chal-1', label: 'Challenge 1', color: 'purple' },
          { id: 'chal-3', label: 'Challenge 3', color: 'purple' },
          { id: 'hub-1', label: 'Hub 1', color: 'yellow' },
          { id: 'hub-2', label: 'Hub 2', color: 'yellow' },
          { id: 'elite-1', label: 'Elite 1', color: 'red' },
          { id: 'elite-2', label: 'Elite 2', color: 'red' },
          { id: 'path-final-1', label: 'Path Final 1', color: 'green' },
          { id: 'act1-boss', label: 'Act 1 Boss', color: 'orange' }
        ]
      },
      {
        title: "Between Acts",
        nodes: [
          { id: 'treasure', label: 'Treasure', color: 'amber' },
          { id: 'rest', label: 'Rest', color: 'cyan' },
          { id: 'recovery', label: 'Recovery', color: 'lime' }
        ]
      },
      {
        title: "Act 2",
        nodes: [
          { id: 'path-b1', label: 'Path B1', color: 'green' },
          { id: 'path-b2', label: 'Path B2', color: 'green' },
          { id: 'path-b3', label: 'Path B3', color: 'green' },
          { id: 'b-chal-1', label: 'B-Challenge 1', color: 'purple' },
          { id: 'b-chal-3', label: 'B-Challenge 3', color: 'purple' },
          { id: 'b-chal-5', label: 'B-Challenge 5', color: 'purple' },
          { id: 'b-hard-1', label: 'B-Hard 1', color: 'indigo' },
          { id: 'b-hard-3', label: 'B-Hard 3', color: 'indigo' },
          { id: 'b-hard-5', label: 'B-Hard 5', color: 'indigo' },
          { id: 'b-elite-1', label: 'B-Elite 1', color: 'red' },
          { id: 'b-elite-2', label: 'B-Elite 2', color: 'red' },
          { id: 'b-elite-3', label: 'B-Elite 3', color: 'red' },
          { id: 'final-boss', label: 'FINAL BOSS', color: 'rose' }
        ]
      }
    ];
    
    const colorMap = {
      'green': 'bg-green-600 hover:bg-green-500',
      'blue': 'bg-blue-600 hover:bg-blue-500',
      'purple': 'bg-purple-600 hover:bg-purple-500',
      'yellow': 'bg-yellow-600 hover:bg-yellow-500',
      'red': 'bg-red-600 hover:bg-red-500',
      'orange': 'bg-orange-600 hover:bg-orange-500',
      'amber': 'bg-amber-600 hover:bg-amber-500',
      'cyan': 'bg-cyan-600 hover:bg-cyan-500',
      'lime': 'bg-lime-600 hover:bg-lime-500',
      'indigo': 'bg-indigo-600 hover:bg-indigo-500',
      'rose': 'bg-rose-600 hover:bg-rose-500'
    };
    
    // Helper function to get the appropriate color class
    const getColorClass = (color) => colorMap[color] || 'bg-gray-600 hover:bg-gray-500';
    
    return (
      <div className="p-3 bg-gray-800/80 rounded-md">
        <h3 className="font-pixel text-sm mb-2 text-blue-400">Map Status</h3>
        <div className="bg-black/60 p-2 rounded pixel-borders mb-3">
          <div className="flex justify-between mb-1">
            <span>Current Node:</span>
            <span className="font-mono text-xs">{state.currentNodeId || 'none'}</span>
          </div>
          <div className="flex justify-between">
            <span>Completed Nodes:</span>
            <span>{state.completedNodeIds ? state.completedNodeIds.length : 0}</span>
          </div>
        </div>
        
        <div className="flex space-x-2 mb-3">
          <button 
            className="flex-1 px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs pixel-button"
            onClick={refreshMapState}
          >
            Refresh Map
          </button>
          <button 
            className="flex-1 px-2 py-1 bg-gray-600 hover:bg-gray-500 text-white rounded text-xs pixel-button"
            onClick={clearCurrentNode}
            disabled={!state.currentNodeId}
          >
            Clear Selection
          </button>
        </div>
        
        {/* Completed Nodes Collapsible Section */}
        <div className="mb-3">
          <details className="bg-black/60 rounded pixel-borders">
            <summary className="font-pixel text-xs text-yellow-400 p-2 cursor-pointer">
              Completed Nodes ({state.completedNodeIds ? state.completedNodeIds.length : 0})
            </summary>
            <div className="p-2 border-t border-gray-700">
              <div className="text-xs bg-black/50 p-2 rounded max-h-32 overflow-y-auto">
                {state.completedNodeIds ? (
                  state.completedNodeIds.length > 0 ? 
                    state.completedNodeIds.map((id: string) => (
                      <div key={id} className="px-2 py-1 bg-green-900/30 rounded mb-1 flex justify-between">
                        <span>{id}</span>
                        <button 
                          className="text-red-400 hover:text-red-300 text-xs"
                          onClick={(e) => {
                            e.preventDefault();
                            // Add functionality to remove completion if needed
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    )) : 
                    <div className="text-gray-400">No completed nodes</div>
                ) : (
                  <div className="text-gray-400">Loading...</div>
                )}
              </div>
            </div>
          </details>
        </div>
        
        {/* Node Selection with Accordion */}
        <h3 className="font-pixel text-sm mb-2 text-blue-400">Node Selection</h3>
        
        {nodeGroups.map((group, groupIndex) => (
          <details 
            key={groupIndex} 
            className="bg-black/60 rounded pixel-borders mb-2"
            open={groupIndex === 0} // Open the first group by default
          >
            <summary className="font-pixel text-xs text-yellow-400 p-2 cursor-pointer">
              {group.title} ({group.nodes.length} nodes)
            </summary>
            <div className="p-2 border-t border-gray-700 grid grid-cols-2 gap-2">
              {group.nodes.map(node => (
                <button 
                  key={node.id}
                  className={`px-2 py-1 ${getColorClass(node.color)} text-white rounded text-xs pixel-button ${
                    state.currentNodeId === node.id ? 'ring-2 ring-white' : ''
                  } ${state.completedNodeIds?.includes(node.id) ? 'opacity-75' : ''}`}
                  onClick={() => selectNode(node.id)}
                >
                  {node.label}
                  {state.completedNodeIds?.includes(node.id) && 
                    <span className="ml-1 text-yellow-300">✓</span>
                  }
                </button>
              ))}
            </div>
            
            {/* Quick completion actions for this group */}
            <div className="px-2 pb-2 flex justify-end">
              <button 
                className="px-2 py-1 bg-yellow-600 hover:bg-yellow-500 text-white rounded text-xs pixel-button text-xs"
                onClick={() => {
                  // Mark all nodes in this group as completed
                  group.nodes.forEach(node => markNodeCompleted(node.id));
                }}
              >
                Complete All
              </button>
            </div>
          </details>
        ))}
        
        {/* Current node actions */}
        {state.currentNodeId && (
          <div className="mt-3 bg-blue-900/30 p-2 rounded pixel-borders">
            <h4 className="font-pixel text-xs text-blue-300 mb-2">Current Node: {state.currentNodeId}</h4>
            <div className="flex space-x-2">
              <button 
                className="flex-1 px-2 py-1 bg-yellow-600 hover:bg-yellow-500 text-white rounded text-xs pixel-button"
                onClick={completeCurrentNode}
              >
                Complete
              </button>
              <button 
                className="flex-1 px-2 py-1 bg-gray-600 hover:bg-gray-500 text-white rounded text-xs pixel-button"
                onClick={clearCurrentNode}
              >
                Close
              </button>
            </div>
          </div>
        )}
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
          
          <a 
            href="/tools/pixelate" 
            target="_blank" 
            rel="noopener noreferrer"
            className="px-2 py-1 bg-purple-600 text-white text-xs rounded hover:bg-purple-500 text-center transition pixel-button"
          >
            Image Pixelator Tool
          </a>
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
  
  // NEW: Render the reactions tab
  const renderReactionsTab = () => {
    return (
      <div className="p-3 bg-gray-800/80 rounded-md">
        <h3 className="font-pixel text-sm mb-2 text-blue-400">Character Expressions</h3>
        
        {/* Display current reaction state */}
        <div className="bg-black/60 p-2 rounded pixel-borders mb-3">
          <div className="flex justify-between mb-1">
            <span>Current Reaction:</span>
            <span className="font-mono text-xs">{currentReaction || 'none'}</span>
          </div>
          <div className="flex justify-between mb-1">
            <span>Shaking:</span>
            <span className="font-mono text-xs">{isShaking ? 'true' : 'false'}</span>
          </div>
          <div className="flex justify-between">
            <span>Oscillating:</span>
            <span className="font-mono text-xs">{isOscillating ? 'true' : 'false'}</span>
          </div>
        </div>
        
        {/* Character portrait preview */}
        <div className="flex justify-center mb-3">
          <div className="relative w-32 h-32 bg-gray-900/60 rounded-md flex items-center justify-center">
            {/* Import and use CharacterPortrait component here */}
            {
              typeof window !== 'undefined' && (
                <div className="p-2">
                  {/* @ts-ignore - Dynamic import */}
                  {React.createElement(
                    // @ts-ignore
                    window.__DEBUG_COMPONENTS__?.CharacterPortrait || 'div',
                    {
                      characterId: 'kapoor',
                      reaction: currentReaction,
                      size: 'md',
                      shake: isShaking,
                      oscillate: isOscillating,
                    }
                  )}
                </div>
              )
            }
          </div>
        </div>
        
        {/* Reaction buttons */}
        <h3 className="font-pixel text-sm mb-2 text-blue-400">Trigger Reactions</h3>
        <div className="grid grid-cols-3 gap-2 mb-3">
          <button
            className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-500 transition pixel-button"
            onClick={() => setCurrentReaction('positive')}
          >
            Positive ✓
          </button>
          
          <button
            className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-500 transition pixel-button"
            onClick={() => setCurrentReaction('negative')}
          >
            Negative ✗
          </button>
          
          <button
            className="px-2 py-1 bg-yellow-600 text-white text-xs rounded hover:bg-yellow-500 transition pixel-button"
            onClick={() => setCurrentReaction('question')}
          >
            Question ?
          </button>
          
          <button
            className="px-2 py-1 bg-purple-600 text-white text-xs rounded hover:bg-purple-500 transition pixel-button"
            onClick={() => setCurrentReaction('surprise')}
          >
            Surprise !
          </button>
          
          <button
            className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-500 transition pixel-button"
            onClick={() => setCurrentReaction('thinking')}
          >
            Thinking ...
          </button>
          
          <button
            className="px-2 py-1 bg-amber-600 text-white text-xs rounded hover:bg-amber-500 transition pixel-button"
            onClick={() => setCurrentReaction('idea')}
          >
            Idea *
          </button>
          
          <button
            className="px-2 py-1 col-span-3 bg-gray-600 text-white text-xs rounded hover:bg-gray-500 transition pixel-button"
            onClick={() => setCurrentReaction(null)}
          >
            Clear Reaction
          </button>
        </div>
        
        {/* Animation controls */}
        <h3 className="font-pixel text-sm mb-2 text-blue-400 mt-4">Animation Controls</h3>
        <div className="grid grid-cols-2 gap-2 mb-3">
          <button
            className={`px-2 py-1 ${isShaking ? 'bg-red-600 hover:bg-red-500' : 'bg-gray-600 hover:bg-gray-500'} text-white text-xs rounded transition pixel-button`}
            onClick={() => {
              setIsShaking(!isShaking);
              // Auto-reset shake after 500ms if turning it on
              if (!isShaking) {
                setTimeout(() => setIsShaking(false), 500);
              }
            }}
          >
            {isShaking ? 'Stop Shaking' : 'Trigger Shake'}
          </button>
          
          <button
            className={`px-2 py-1 ${isOscillating ? 'bg-blue-600 hover:bg-blue-500' : 'bg-gray-600 hover:bg-gray-500'} text-white text-xs rounded transition pixel-button`}
            onClick={() => setIsOscillating(!isOscillating)}
          >
            {isOscillating ? 'Stop Oscillating' : 'Start Oscillating'}
          </button>
        </div>
        
        {/* Helper text */}
        <div className="text-xs text-gray-400">
          <p>Click a reaction to test facial expressions and hand gestures. Hand gestures appear at the bottom of the portrait.</p>
          <p className="mt-1">Note: The 'idea' reaction has facial animation but no hand gesture as configured.</p>
          <p className="mt-1">Animation Controls: Use the shake button to trigger a brief shake animation. Oscillating makes the portrait float up and down continuously.</p>
        </div>
      </div>
    );
  };
  
  // NEW: Render the resources tab
  const renderResourcesTab = () => {
    // Don't call refreshStateValues during render
    // refreshStateValues();
    const state = stateRef.current || {};
    
    // Add a function to get the full resource store state
    const getFullResourceState = () => {
      const store = useResourceStore.getState();
      const fullState = {
        insight: store.insight,
        insightMax: store.insightMax,
        momentum: store.momentum,
        consecutiveCorrect: store.consecutiveCorrect,
        momentumEffect: store.momentumEffect,
        availableActions: store.availableActions,
        pendingUpdates: store.pendingResourceUpdates,
        lastChange: store.lastResourceChange,
      };
      
      // Log full state to console
      console.log('[ResourceDebug] Full resource state:', fullState);
      
      // Log specific values for momentum tracking
      console.log('[ResourceDebug] Momentum tracking:',
        'Current:', store.momentum,
        'ConsecutiveCorrect:', store.consecutiveCorrect,
        'Effect active:', store.momentumEffect?.active,
        'Effect intensity:', store.momentumEffect?.intensity
      );
      
      // Return a string representation for the log
      setResourceTestLog(prev => [
        `Full state logged to console. Momentum: ${store.momentum}, Consecutive: ${store.consecutiveCorrect}`,
        ...prev
      ]);
      
      return fullState;
    };
    
    // Apply a specific resource tier
    const applyTier = (tier: ResourceTier) => {
      const store = useResourceStore.getState();
      handleAction(
        () => {
          // Log before state
          console.log(`[ResourceDebug] Before applying ${tier} tier:`, 
            'Momentum:', store.momentum, 
            'Consecutive:', store.consecutiveCorrect
          );
          
          ResourceOutcomeService.applyTierOutcome(tier, store, 'debug_panel');
          
          // Log after state
          setTimeout(() => {
            console.log(`[ResourceDebug] After applying ${tier} tier:`, 
              'Momentum:', store.momentum, 
              'Consecutive:', store.consecutiveCorrect
            );
          }, 50);
          
          setResourceTestLog(prev => [
            `Applied ${tier} tier. New momentum: ${store.momentum}`,
            ...prev
          ]);
        },
        `Applying ${tier} tier...`,
        `Applied ${tier} tier outcome`
      );
    };
    
    // Test momentum directly
    const testMomentum = () => {
      const store = useResourceStore.getState();
      
      handleAction(
        () => {
          // Initial state
          console.log('[ResourceDebug] Initial momentum state:', 
            'Momentum:', store.momentum,
            'Consecutive:', store.consecutiveCorrect
          );
          
          // Test increment
          store.incrementMomentum();
          console.log('[ResourceDebug] After increment:', 
            'Momentum:', store.momentum,
            'Consecutive:', store.consecutiveCorrect
          );
          
          // Apply standard tier
          ResourceOutcomeService.applyTierOutcome('STANDARD', store, 'debug_panel');
          console.log('[ResourceDebug] After STANDARD tier:', 
            'Momentum:', store.momentum,
            'Consecutive:', store.consecutiveCorrect
          );
          
          // Test reset
          store.resetMomentum();
          console.log('[ResourceDebug] After reset:', 
            'Momentum:', store.momentum,
            'Consecutive:', store.consecutiveCorrect
          );
          
          // Log results
          setResourceTestLog(prev => [
            'Momentum test complete - check console for detailed results',
            ...prev
          ]);
        },
        'Testing momentum system...',
        'Momentum system test complete'
      );
    };
    
    return (
      <div className="p-3 bg-gray-800/80 rounded-md">
        <h3 className="font-pixel text-sm mb-2 text-blue-400">Resource Testing</h3>
        
        {/* Resource Status */}
        <div className="bg-black/60 p-2 rounded pixel-borders mb-3">
          <div className="flex justify-between mb-1">
            <span>Current Insight:</span>
            <span className="text-blue-300">{state.insight || 0}/100</span>
          </div>
          <div className="flex justify-between mb-1">
            <span>Current Momentum:</span>
            <span className="text-orange-300">{state.momentum || 0}/3</span>
          </div>
          <div className="flex justify-between mb-1">
            <span>Consecutive Correct:</span>
            <span className="text-green-300">{resourceStoreState.consecutiveCorrect || 0}</span>
          </div>
        </div>
        
        {/* Debug Controls */}
        <h3 className="font-pixel text-sm mb-2 text-blue-400">Debug Controls</h3>
        <div className="grid grid-cols-2 gap-2 mb-3">
          <button 
            className="px-2 py-1 bg-purple-600 text-white text-xs rounded hover:bg-purple-500 disabled:opacity-50 transition pixel-button"
            onClick={() => getFullResourceState()}
            disabled={clickPending}
          >
            Dump Full State
          </button>
          
          <button 
            className="px-2 py-1 bg-purple-600 text-white text-xs rounded hover:bg-purple-500 disabled:opacity-50 transition pixel-button"
            onClick={testMomentum}
            disabled={clickPending}
          >
            Run Momentum Test
          </button>
        </div>
        
        {/* Momentum Controls */}
        <h3 className="font-pixel text-sm mb-2 text-blue-400">Momentum Controls</h3>
        <div className="grid grid-cols-2 gap-2 mb-3">
          <button 
            className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-500 disabled:opacity-50 transition pixel-button"
            onClick={() => {
              const store = useResourceStore.getState();
              handleAction(
                () => {
                  store.incrementMomentum();
                  setResourceTestLog(prev => [`Momentum incremented to ${store.momentum}`, ...prev]);
                },
                'Incrementing momentum...',
                'Momentum incremented'
              );
            }}
            disabled={clickPending || (state.momentum || 0) >= 3}
          >
            Increment Momentum
          </button>
          
          <button 
            className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-500 disabled:opacity-50 transition pixel-button"
            onClick={() => {
              const store = useResourceStore.getState();
              handleAction(
                () => {
                  store.resetMomentum();
                  setResourceTestLog(prev => ['Momentum reset to 0', ...prev]);
                },
                'Resetting momentum...',
                'Momentum reset'
              );
            }}
            disabled={clickPending || (state.momentum || 0) === 0}
          >
            Reset Momentum
          </button>
          
          <button 
            className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-500 disabled:opacity-50 transition pixel-button"
            onClick={addInsight}
            disabled={clickPending || (state.insight || 0) >= 100}
          >
            Add +25 Insight
          </button>
          
          <button 
            className="px-2 py-1 bg-yellow-600 text-white text-xs rounded hover:bg-yellow-500 disabled:opacity-50 transition pixel-button"
            onClick={() => {
              const store = useResourceStore.getState();
              handleAction(
                () => {
                  // Direct consecutive updates
                  const currentConsecutive = store.consecutiveCorrect || 0;
                  store.setMomentum(store.momentum, currentConsecutive + 1);
                  setResourceTestLog(prev => [`Consecutive incremented to ${currentConsecutive + 1}`, ...prev]);
                },
                'Incrementing consecutive...',
                'Consecutive incremented'
              );
            }}
            disabled={clickPending}
          >
            Incr. Consecutive
          </button>
        </div>
        
        {/* Resource Tier Testing */}
        <h3 className="font-pixel text-sm mb-2 text-blue-400">Apply Resource Tier</h3>
        <div className="grid grid-cols-2 gap-2 mb-3">
          {(['MINOR', 'STANDARD', 'MAJOR', 'CRITICAL', 'FAILURE'] as ResourceTier[]).map(tier => (
            <button
              key={tier}
              onClick={() => applyTier(tier)}
              disabled={clickPending}
              className={`px-2 py-1 rounded text-xs disabled:opacity-50 transition pixel-button
                ${tier === 'FAILURE' ? 'bg-red-600 hover:bg-red-500' : 
                  tier === 'MINOR' ? 'bg-blue-400 hover:bg-blue-300' :
                  tier === 'STANDARD' ? 'bg-green-600 hover:bg-green-500' :
                  tier === 'MAJOR' ? 'bg-purple-600 hover:bg-purple-500' :
                  'bg-yellow-600 hover:bg-yellow-500'} text-white`}
            >
              {tier}
            </button>
          ))}
        </div>
        
        {/* Results Log */}
        <h3 className="font-pixel text-sm mb-2 text-blue-400">Resource Test Log</h3>
        <div className="bg-black/60 p-2 rounded pixel-borders max-h-40 overflow-y-auto">
          {resourceTestLog.length > 0 ? (
            resourceTestLog.map((item, index) => (
              <div key={index} className="text-xs mb-1">
                {item}
              </div>
            ))
          ) : (
            <div className="text-xs text-gray-500">No resource tests run yet</div>
          )}
        </div>
        
        <button 
          className="mt-2 px-2 py-1 bg-gray-600 hover:bg-gray-500 text-white text-xs rounded transition pixel-button w-full"
          onClick={() => setResourceTestLog([])}
        >
          Clear Log
        </button>
      </div>
    );
  };
  
  // Add a new render function for our knowledge discovery tab
  const renderKnowledgeDiscoveryTab = () => {
    return (
      <div className="p-2">
        <KnowledgeDiscoveryDebugger />
      </div>
    );
  };
  
  // Add a new rendering function for the connections tab
  const renderConnectionsTab = () => {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Connection Mastery Testing</h3>
        <AutoConnectionTester />
      </div>
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
      case 'reactions': return renderReactionsTab();
      case 'knowledge': return <KnowledgeSystemDebug />;
      case 'resources': return renderResourcesTab();
      case 'knowledge-discovery': return renderKnowledgeDiscoveryTab();
      case 'connections': return renderConnectionsTab();
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
            <button
              className={`px-3 py-2 text-xs transition-colors ${activeTab === 'reactions' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-white'}`}
              onClick={() => setActiveTab('reactions')}
            >
              Reactions
            </button>
            <button
              className={`px-3 py-2 text-xs transition-colors ${activeTab === 'knowledge' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-white'}`}
              onClick={() => setActiveTab('knowledge')}
            >
              Knowledge
            </button>
            <button
              className={`px-3 py-2 text-xs transition-colors ${activeTab === 'resources' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-white'}`}
              onClick={() => setActiveTab('resources')}
            >
              Resources
            </button>
            <button
              className={`px-3 py-2 text-xs transition-colors ${activeTab === 'connections' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-white'}`}
              onClick={() => setActiveTab('connections')}
            >
              Connections
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