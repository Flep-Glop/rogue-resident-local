'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { usePrimitiveStoreValue, useStableCallback } from '@/app/core/utils/storeHooks';
import useGameStateMachine, { useGameState } from '@/app/core/statemachine/GameStateMachine';
import { useDialogueStateMachine } from '@/app/core/dialogue/DialogueStateMachine';
import { useGameStore } from '@/app/store/gameStore';
import { useJournalStore } from '@/app/store/journalStore';
import { useKnowledgeStore } from '@/app/store/knowledgeStore';
import { useResourceStore } from '@/app/store/resourceStore';

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
 */
export default function UnifiedDebugPanel() {
  // Panel state
  const [isExpanded, setIsExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState<'game' | 'map' | 'actions' | 'system' | 'events'>('game');
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
  
  // Refs
  const mountedRef = useRef(true);
  const panelRef = useRef<HTMLDivElement>(null);
  const eventsEndRef = useRef<HTMLDivElement>(null);
  const initCompletedRef = useRef(false);
  const refreshNeededRef = useRef(false);
  
  // Portal state
  const [portalElement, setPortalElement] = useState<HTMLElement | null>(null);
  
  // Use memoization to prevent re-renders and store data in refs
  const stateValues = useMemo(() => {
    // Create a safe accessor function
    const safeGetState = (store: any, selector: (s: any) => any, defaultValue: any) => {
      try {
        if (!store || typeof store.getState !== 'function') return defaultValue;
        const state = store.getState();
        return selector(state) ?? defaultValue;
      } catch (e) {
        console.error('Error accessing store:', e);
        return defaultValue;
      }
    };

    // Game state
    const gameStateMachine = useGameStateMachine;
    const gameStore = useGameStore;
    const journalStore = useJournalStore;
    const knowledgeStore = useKnowledgeStore;
    const resourceStore = useResourceStore;
    
    return {
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
    };
  }, []); // Empty dependency array so this only runs once
  
  // Create refs for the state values to access without triggering re-renders
  const stateRef = useRef(stateValues);
  
  // Store refs for accessing
  const storeRefs = useRef({
    gameStateMachine: useGameStateMachine,
    gameStore: useGameStore,
    journalStore: useJournalStore,
    knowledgeStore: useKnowledgeStore,
    resourceStore: useResourceStore,
  });
  
  // Manual refresh function for when we need updated state
  const refreshStateValues = useCallback(() => {
    if (!mountedRef.current) return;
    
    const safeGetState = (store: any, selector: (s: any) => any, defaultValue: any) => {
      try {
        if (!store || typeof store.getState !== 'function') return defaultValue;
        const state = store.getState();
        return selector(state) ?? defaultValue;
      } catch (e) {
        return defaultValue;
      }
    };
    
    const { gameStateMachine, gameStore, journalStore, knowledgeStore, resourceStore } = storeRefs.current;
    
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
    };
    
  }, []);
  
  // Initialization effect to run once
  useEffect(() => {
    if (initCompletedRef.current) return;
    
    // Initialize the component once
    console.log('Initializing UnifiedDebugPanel');
    
    // Subscribe to the game store
    const unsubscribe = useGameStore.subscribe(() => {
      // Don't update state directly - just mark that we need a refresh
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
    refreshStateValues();
    
    // Mark initialization as completed
    initCompletedRef.current = true;
    
    // Cleanup function
    return () => {
      console.log = originalConsoleLog;
      console.error = originalConsoleError;
      console.warn = originalConsoleWarn;
      unsubscribe();
    };
  }, []);
  
  // Auto-refresh effect that runs on an interval instead of on every render
  useEffect(() => {
    const intervalId = setInterval(() => {
      if (refreshNeededRef.current && mountedRef.current) {
        refreshStateValues();
        refreshNeededRef.current = false;
      }
    }, 500); // Update every 500ms if needed
    
    return () => clearInterval(intervalId);
  }, []);
  
  // Track mounted state
  useEffect(() => {
    mountedRef.current = true;
    
    return () => {
      mountedRef.current = false;
    };
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
  
  // Toggle panel expansion
  const togglePanel = useCallback(() => {
    setIsExpanded(prev => !prev);
    if (!isExpanded) {
      // Refresh state when expanding
      refreshStateValues();
    }
  }, [isExpanded, refreshStateValues]);
  
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
      // Refresh state values after action completes
      setTimeout(() => {
        refreshStateValues();
      }, 100);
    } catch (error) {
      console.error('Action error:', error);
      showFeedback('Error: ' + (error instanceof Error ? error.message : 'Unknown error'), 'error');
    } finally {
      setTimeout(() => {
        if (mountedRef.current) {
          setClickPending(false);
        }
      }, 500);
    }
  }, [clickPending, showFeedback, refreshStateValues]);
  
  // Common actions
  const giveJournal = useCallback(() => {
    handleAction(
      () => {
        const journalStore = useJournalStore.getState();
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
  
  const togglePhase = useCallback(() => {
    handleAction(
      () => {
        const stateMachine = useGameStateMachine.getState();
        if (stateRef.current.gamePhase === 'day' && stateMachine?.beginDayCompletion) {
          stateMachine.beginDayCompletion();
        } else if (stateRef.current.gamePhase === 'night' && stateMachine?.beginNightCompletion) {
          stateMachine.beginNightCompletion();
        } else {
          throw new Error(`Cannot toggle from phase: ${stateRef.current.gamePhase}`);
        }
      },
      `Transitioning to ${stateRef.current.gamePhase === 'day' ? 'night' : 'day'}...`,
      `Beginning ${stateRef.current.gamePhase === 'day' ? 'night' : 'day'} phase`
    );
  }, [handleAction]);
  
  const addInsight = useCallback(() => {
    handleAction(
      () => {
        const resourceStore = useResourceStore.getState();
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
    handleAction(
      () => {
        const resourceStore = useResourceStore.getState();
        if (resourceStore?.setMomentum) {
          resourceStore.setMomentum(Math.min(3, stateRef.current.momentum + 1));
        } else {
          throw new Error('Resource store not available');
        }
      },
      'Adding momentum...',
      `Momentum set to ${Math.min(3, stateRef.current.momentum + 1)}`
    );
  }, [handleAction]);
  
  const addKnowledge = useCallback(() => {
    handleAction(
      () => {
        const knowledgeStore = useKnowledgeStore.getState();
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
    handleAction(
      () => {
        const gameStore = useGameStore.getState();
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
  
  const clearCurrentNode = useCallback(() => {
    handleAction(
      () => {
        if (!stateRef.current.currentNodeId) {
          throw new Error('No node currently selected');
        }
        
        const gameStore = useGameStore.getState();
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
  
  // Tab renderers
  const renderGameTab = () => {
    // Don't call refreshStateValues during render
    // refreshStateValues();
    const state = stateRef.current;
    
    return (
      <div className="p-3 bg-gray-800/80 rounded-md">
        <h3 className="font-pixel text-sm mb-2 text-blue-400">Game State</h3>
        <div className="bg-black/60 p-2 rounded pixel-borders">
          <div className="flex justify-between mb-1">
            <span>Phase:</span>
            <span className="text-green-400">{state.gamePhase}</span>
          </div>
          <div className="flex justify-between mb-1">
            <span>Day:</span>
            <span>{state.currentDay}</span>
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
            <span>{state.totalMastery}% ({state.discoveredNodeCount} nodes)</span>
          </div>
        </div>
        
        <h3 className="font-pixel text-sm mt-3 mb-2 text-blue-400">Player Stats</h3>
        <div className="bg-black/60 p-2 rounded pixel-borders">
          <div className="flex justify-between mb-1">
            <span>Health:</span>
            <span className="text-red-400">{state.player.health}/{state.player.maxHealth}</span>
          </div>
          <div className="flex justify-between mb-1">
            <span>Insight:</span>
            <span className="text-blue-300">{state.insight}/100</span>
          </div>
          <div className="flex justify-between">
            <span>Momentum:</span>
            <span className="text-orange-300">{state.momentum}/3</span>
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
    const state = stateRef.current;
    
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
            <span>{state.renderPhase}</span>
          </div>
        </div>
        
        <h3 className="font-pixel text-sm mb-2 text-blue-400">Node Selection</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          <button 
            className="px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs pixel-button"
            onClick={() => selectNode('node-1')}
          >
            Start
          </button>
          <button 
            className="px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs pixel-button"
            onClick={() => selectNode('node-2-1')}
          >
            Branch A
          </button>
          <button 
            className="px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs pixel-button"
            onClick={() => selectNode('node-2-2')}
          >
            Branch B
          </button>
          <button 
            className="px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs pixel-button"
            onClick={() => selectNode('node-2-3')}
          >
            Branch C
          </button>
          <button 
            className="px-2 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded text-xs pixel-button"
            onClick={() => selectNode('node-5-1')}
          >
            Path A
          </button>
          <button 
            className="px-2 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded text-xs pixel-button"
            onClick={() => selectNode('node-5-2')}
          >
            Path B
          </button>
          <button 
            className="px-2 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded text-xs pixel-button"
            onClick={() => selectNode('node-5-3')}
          >
            Path C
          </button>
          <button 
            className="px-2 py-1 bg-red-600 hover:bg-red-500 text-white rounded text-xs pixel-button"
            onClick={() => selectNode('node-boss')}
          >
            Boss Node
          </button>
          <button 
            className="px-2 py-1 bg-gray-600 hover:bg-gray-500 text-white rounded text-xs pixel-button"
            onClick={clearCurrentNode}
            disabled={!state.currentNodeId}
          >
            Reset Selection
          </button>
        </div>
      </div>
    );
  };
  
  const renderActionsTab = () => {
    // Don't call refreshStateValues during render
    // refreshStateValues();
    const state = stateRef.current;
    
    return (
      <div className="p-3 bg-gray-800/80 rounded-md">
        <h3 className="font-pixel text-sm mb-2 text-blue-400">Game Actions</h3>
        <div className="grid grid-cols-2 gap-2">
          <button
            className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-500 disabled:opacity-50 transition pixel-button"
            onClick={togglePhase}
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
            className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-500 disabled:opacity-50 transition pixel-button"
            onClick={addInsight}
            disabled={clickPending || state.insight >= 100}
          >
            Add Insight
          </button>
          
          <button
            className="px-2 py-1 bg-orange-600 text-white text-xs rounded hover:bg-orange-500 disabled:opacity-50 transition pixel-button"
            onClick={addMomentum}
            disabled={state.momentum >= 3 || clickPending}
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
        </div>
      </div>
    );
  };
  
  const renderSystemTab = () => {
    // Don't call refreshStateValues during render
    // refreshStateValues();
    const state = stateRef.current;
    
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
            <span>{state.renderPhase}</span>
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
          <div className="flex border-b border-gray-700">
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