// app/components/debug/VerticalSliceDebugPanel.tsx
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { usePrimitiveStoreValue, useStableCallback } from '@/app/core/utils/storeHooks';
import useGameStateMachine from '@/app/core/statemachine/GameStateMachine';
import { useGameStore } from '@/app/store/gameStore';
import { useJournalStore } from '@/app/store/journalStore';
import { useKnowledgeStore } from '@/app/store/knowledgeStore';
import { useResourceStore } from '@/app/store/resourceStore';

/**
 * Enhanced Debug Panel with collapsible UI and more visual polish
 * 
 * Improvements:
 * 1. Collapsible UI that's minimal when collapsed
 * 2. Better visual integration with game aesthetics
 * 3. More responsive action feedback
 * 4. Clearer organization of controls and information
 */
export default function VerticalSliceDebugPanel() {
  // Track component mount for cleanup
  const mountedRef = useRef(true);
  const panelRef = useRef<HTMLDivElement>(null);
  
  // State
  const [expanded, setExpanded] = useState(false);
  const [activeTool, setActiveTool] = useState<'state'|'actions'|'node'|'advanced'>('state');
  const [storageStatus, setStorageStatus] = useState({
    game: false,
    journal: false,
    knowledge: false
  });
  const [clickPending, setClickPending] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<{message: string, type: 'success'|'error'|'info'|null}>({
    message: '',
    type: null
  });
  
  // Extract ONLY primitive values with appropriate fallbacks
  // Game state primitives
  const gamePhase = usePrimitiveStoreValue(
    useGameStateMachine,
    state => state.gamePhase,
    'day'
  );
  
  const currentDay = usePrimitiveStoreValue(
    useGameStateMachine,
    state => state.currentDay,
    1
  );
  
  const currentNodeId = usePrimitiveStoreValue(
    useGameStore,
    state => state.currentNodeId,
    null
  );
  
  // Journal primitives
  const hasJournal = usePrimitiveStoreValue(
    useJournalStore,
    state => state.hasJournal,
    false
  );
  
  const journalTier = usePrimitiveStoreValue(
    useJournalStore,
    state => state.currentUpgrade,
    'base'
  );
  
  // Knowledge primitives
  const totalMastery = usePrimitiveStoreValue(
    useKnowledgeStore,
    state => state.totalMastery,
    0
  );
  
  const discoveredNodeCount = usePrimitiveStoreValue(
    useKnowledgeStore,
    state => {
      if (!state || !state.nodes) return 0;
      return state.nodes.filter(n => n && n.discovered).length;
    },
    0
  );
  
  // Resource primitives
  const insight = usePrimitiveStoreValue(
    useResourceStore,
    state => state.insight,
    0
  );
  
  const momentum = usePrimitiveStoreValue(
    useResourceStore,
    state => state.momentum,
    0
  );
  
  // Check local storage on client side only
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    try {
      // Update storage status
      setStorageStatus({
        game: !!localStorage.getItem('rogue-resident-game-v2'),
        journal: !!localStorage.getItem('rogue-resident-journal'),
        knowledge: !!localStorage.getItem('rogue-resident-knowledge')
      });
    } catch (e) {
      console.error('Storage access error:', e);
    }
  }, []);
  
  // Mount/unmount effect
  useEffect(() => {
    mountedRef.current = true;
    
    // Setup keyboard shortcut (Ctrl+D) to toggle panel
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'd') {
        e.preventDefault();
        setExpanded(prev => !prev);
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    
    return () => {
      mountedRef.current = false;
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, []);
  
  // Handle panel enter/exit animations
  useEffect(() => {
    if (panelRef.current) {
      if (expanded) {
        panelRef.current.style.opacity = '0';
        setTimeout(() => {
          if (panelRef.current && mountedRef.current) {
            panelRef.current.style.opacity = '1';
          }
        }, 10);
      }
    }
  }, [expanded]);
  
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
    setExpanded(prev => !prev);
  }, []);
  
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
  }, [clickPending, showFeedback]);
  
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
        if (gamePhase === 'day' && stateMachine?.beginDayCompletion) {
          stateMachine.beginDayCompletion();
        } else if (gamePhase === 'night' && stateMachine?.beginNightCompletion) {
          stateMachine.beginNightCompletion();
        } else {
          throw new Error(`Cannot toggle from phase: ${gamePhase}`);
        }
      },
      `Transitioning to ${gamePhase === 'day' ? 'night' : 'day'}...`,
      `Beginning ${gamePhase === 'day' ? 'night' : 'day'} phase`
    );
  }, [gamePhase, handleAction]);
  
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
          resourceStore.setMomentum(Math.min(3, momentum + 1));
        } else {
          throw new Error('Resource store not available');
        }
      },
      'Adding momentum...',
      `Momentum set to ${Math.min(3, momentum + 1)}`
    );
  }, [handleAction, momentum]);
  
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
        if (window.__FORCE_REINITIALIZE__) {
          window.__FORCE_REINITIALIZE__();
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
  
  const createTestNode = useCallback(() => {
    handleAction(
      () => {
        const gameStore = useGameStore.getState();
        if (gameStore?.setCurrentNode) {
          gameStore.setCurrentNode('node-1');
        } else {
          throw new Error('Game store not available');
        }
      },
      'Selecting node...',
      'Node 1 selected'
    );
  }, [handleAction]);
  
  const clearCurrentNode = useCallback(() => {
    handleAction(
      () => {
        if (!currentNodeId) {
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
  }, [handleAction, currentNodeId]);

  const renderActiveToolContent = useCallback(() => {
    switch (activeTool) {
      case 'state':
        return (
          <div className="p-3 bg-gray-800/80 rounded-md">
            <h3 className="font-semibold mb-2 text-blue-400">Game State</h3>
            <div className="bg-gray-800 p-2 rounded">
              <div className="flex justify-between mb-1">
                <span>Phase:</span>
                <span className="text-green-400">{gamePhase}</span>
              </div>
              <div className="flex justify-between mb-1">
                <span>Day:</span>
                <span>{currentDay}</span>
              </div>
              <div className="flex justify-between mb-1">
                <span>Current Node:</span>
                <span className="font-mono text-xs">{currentNodeId || 'none'}</span>
              </div>
              <div className="flex justify-between mb-1">
                <span>Journal:</span>
                <span>{hasJournal ? journalTier : 'none'}</span>
              </div>
              <div className="flex justify-between">
                <span>Mastery:</span>
                <span>{totalMastery}% ({discoveredNodeCount} nodes)</span>
              </div>
            </div>
            
            <h3 className="font-semibold mt-3 mb-2 text-blue-400">Resources</h3>
            <div className="bg-gray-800 p-2 rounded">
              <div className="flex justify-between mb-1">
                <span>Insight:</span>
                <span className="text-blue-300">{insight}/100</span>
              </div>
              <div className="flex justify-between">
                <span>Momentum:</span>
                <span className="text-orange-300">{momentum}/3</span>
              </div>
            </div>
            
            <h3 className="font-semibold mt-3 mb-2 text-blue-400">Storage</h3>
            <div className="text-xs text-gray-400 bg-gray-800/60 p-2 rounded">
              <div>Game: {storageStatus.game ? '✓' : '✗'}</div>
              <div>Journal: {storageStatus.journal ? '✓' : '✗'}</div>
              <div>Knowledge: {storageStatus.knowledge ? '✓' : '✗'}</div>
            </div>
          </div>
        );
        
      case 'actions':
        return (
          <div className="p-3 bg-gray-800/80 rounded-md">
            <h3 className="font-semibold mb-2 text-blue-400">Core Actions</h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-500 disabled:opacity-50 transition"
                onClick={togglePhase}
                disabled={clickPending}
              >
                {gamePhase === 'day' ? 'End Day' : 'Start Day'}
              </button>
              
              <button
                className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-500 disabled:opacity-50 transition"
                onClick={giveJournal}
                disabled={hasJournal || clickPending}
              >
                Give Journal
              </button>
              
              <button
                className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-500 disabled:opacity-50 transition"
                onClick={addInsight}
                disabled={clickPending || insight >= 100}
              >
                Add Insight
              </button>
              
              <button
                className="px-2 py-1 bg-orange-600 text-white text-xs rounded hover:bg-orange-500 disabled:opacity-50 transition"
                onClick={addMomentum}
                disabled={momentum >= 3 || clickPending}
              >
                Add Momentum
              </button>
              
              <button
                className="px-2 py-1 bg-purple-600 text-white text-xs rounded hover:bg-purple-500 disabled:opacity-50 transition"
                onClick={addKnowledge}
                disabled={clickPending}
              >
                Add Knowledge
              </button>
              
              <button
                className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-500 disabled:opacity-50 transition"
                onClick={resetGame}
                disabled={clickPending}
              >
                Reset Game
              </button>
            </div>
          </div>
        );
        
      case 'node':
        return (
          <div className="p-3 bg-gray-800/80 rounded-md">
            <h3 className="font-semibold mb-2 text-blue-400">Node Controls</h3>
            <div className="grid grid-cols-1 gap-2">
              <button
                className="px-2 py-1 bg-indigo-600 text-white text-xs rounded hover:bg-indigo-500 disabled:opacity-50 transition"
                onClick={createTestNode}
                disabled={clickPending}
              >
                Select Node 1 (Calibration)
              </button>
              
              <button
                className="px-2 py-1 bg-indigo-600 text-white text-xs rounded hover:bg-indigo-500 disabled:opacity-50 transition"
                onClick={() => {
                  handleAction(
                    () => {
                      const gameStore = useGameStore.getState();
                      if (gameStore?.setCurrentNode) {
                        gameStore.setCurrentNode('node-2');
                      } else {
                        throw new Error('Game store not available');
                      }
                    },
                    'Selecting node...',
                    'Node 2 selected'
                  );
                }}
                disabled={clickPending}
              >
                Select Node 2 (Dosimetry)
              </button>
              
              <button
                className="px-2 py-1 bg-indigo-600 text-white text-xs rounded hover:bg-indigo-500 disabled:opacity-50 transition"
                onClick={() => {
                  handleAction(
                    () => {
                      const gameStore = useGameStore.getState();
                      if (gameStore?.setCurrentNode) {
                        gameStore.setCurrentNode('node-3');
                      } else {
                        throw new Error('Game store not available');
                      }
                    },
                    'Selecting node...',
                    'Node 3 selected'
                  );
                }}
                disabled={clickPending}
              >
                Select Node 3 (Safety)
              </button>
              
              <button
                className="px-2 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-500 disabled:opacity-50 transition mt-2"
                onClick={clearCurrentNode}
                disabled={!currentNodeId || clickPending}
              >
                Clear Node Selection
              </button>
            </div>
          </div>
        );
        
      case 'advanced':
        return (
          <div className="p-3 bg-gray-800/80 rounded-md">
            <h3 className="font-semibold mb-2 text-blue-400">Advanced Tools</h3>
            <div className="grid grid-cols-1 gap-2">
              <button
                className="px-2 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-500 transition"
                onClick={() => {
                  if (typeof window !== 'undefined' && window.__EVENT_SYSTEM_DIAGNOSTICS__) {
                    console.log(window.__EVENT_SYSTEM_DIAGNOSTICS__());
                    showFeedback('Event system diagnostics logged to console', 'success');
                  } else {
                    showFeedback('Event system diagnostics unavailable', 'error');
                  }
                }}
              >
                Event System Diagnostics
              </button>
              
              <button
                className="px-2 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-500 transition"
                onClick={() => {
                  if (typeof window !== 'undefined' && window.__GAME_STATE_MACHINE_DEBUG__) {
                    console.log(window.__GAME_STATE_MACHINE_DEBUG__.getCurrentState());
                    showFeedback('Game state logged to console', 'success');
                  } else {
                    showFeedback('Game state debug unavailable', 'error');
                  }
                }}
              >
                Log Game State
              </button>
              
              <button
                className="px-2 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-500 transition"
                onClick={() => {
                  if (typeof window !== 'undefined' && window.__GAME_STATE_MACHINE_DEBUG__?.checkStuck) {
                    const result = window.__GAME_STATE_MACHINE_DEBUG__.checkStuck();
                    showFeedback(
                      result ? 'Fixed stuck transitions' : 'No stuck transitions found', 
                      result ? 'success' : 'info'
                    );
                  } else {
                    showFeedback('Transition check unavailable', 'error');
                  }
                }}
              >
                Check Stuck Transitions
              </button>
              
              <button
                className="px-2 py-1 bg-yellow-600 text-white text-xs rounded hover:bg-yellow-500 transition mt-2"
                onClick={() => {
                  try {
                    // Clear console
                    console.clear();
                    showFeedback('Console cleared', 'success');
                  } catch (e) {
                    showFeedback('Could not clear console', 'error');
                  }
                }}
              >
                Clear Console
              </button>
            </div>
          </div>
        );
    }
  }, [
    activeTool, 
    gamePhase, 
    currentDay, 
    currentNodeId, 
    hasJournal, 
    journalTier, 
    totalMastery, 
    discoveredNodeCount, 
    insight, 
    momentum, 
    storageStatus, 
    clickPending, 
    togglePhase, 
    giveJournal, 
    addInsight, 
    addMomentum, 
    addKnowledge, 
    resetGame, 
    createTestNode, 
    clearCurrentNode,
    handleAction,
    showFeedback
  ]);
  
  // Don't render in production
  if (process.env.NODE_ENV === 'production') return null;
  
  return (
    <>
      {/* Collapsed state - minimal floating button */}
      {!expanded && (
        <button
          className="fixed top-4 right-4 z-[10000] bg-blue-600/80 hover:bg-blue-500 text-white px-3 py-1 rounded-md text-xs shadow-lg backdrop-blur-sm transition-all duration-200 border border-blue-400/30"
          onClick={togglePanel}
        >
          Debug Tools
        </button>
      )}
      
      {/* Expanded state - full debug panel */}
      {expanded && (
        <div
          ref={panelRef}
          className="fixed top-0 right-0 h-screen w-64 bg-gray-900/90 backdrop-blur-sm text-white z-[10000] shadow-xl border-l border-blue-900/50 transition-opacity duration-300"
          style={{ opacity: 0 }} // Initial opacity managed by useEffect
        >
          {/* Header with close button */}
          <div className="py-2 px-3 bg-blue-900/80 flex justify-between items-center">
            <h2 className="font-semibold pixel-text">Rogue Resident Debug</h2>
            <button
              className="w-6 h-6 rounded hover:bg-blue-800/80 text-white flex items-center justify-center"
              onClick={togglePanel}
            >
              ×
            </button>
          </div>
          
          {/* Tool tabs */}
          <div className="flex border-b border-blue-900/50">
            <button
              className={`px-3 py-1.5 text-xs flex-1 transition-colors ${activeTool === 'state' ? 'bg-blue-900/70 text-white' : 'text-blue-300 hover:bg-blue-900/30'}`}
              onClick={() => setActiveTool('state')}
            >
              State
            </button>
            <button
              className={`px-3 py-1.5 text-xs flex-1 transition-colors ${activeTool === 'actions' ? 'bg-blue-900/70 text-white' : 'text-blue-300 hover:bg-blue-900/30'}`}
              onClick={() => setActiveTool('actions')}
            >
              Actions
            </button>
            <button
              className={`px-3 py-1.5 text-xs flex-1 transition-colors ${activeTool === 'node' ? 'bg-blue-900/70 text-white' : 'text-blue-300 hover:bg-blue-900/30'}`}
              onClick={() => setActiveTool('node')}
            >
              Nodes
            </button>
            <button
              className={`px-3 py-1.5 text-xs flex-1 transition-colors ${activeTool === 'advanced' ? 'bg-blue-900/70 text-white' : 'text-blue-300 hover:bg-blue-900/30'}`}
              onClick={() => setActiveTool('advanced')}
            >
              Advanced
            </button>
          </div>
          
          {/* Action feedback */}
          {actionFeedback.type && (
            <div 
              className={`px-3 py-2 text-xs ${
                actionFeedback.type === 'success' ? 'bg-green-900/50 text-green-300' :
                actionFeedback.type === 'error' ? 'bg-red-900/50 text-red-300' :
                'bg-blue-900/50 text-blue-300'
              } transition-all animate-fade-in`}
            >
              {actionFeedback.message}
            </div>
          )}
          
          {/* Active tool content */}
          <div className="p-3 overflow-y-auto max-h-[calc(100vh-116px)]" style={{ scrollbarWidth: 'thin' }}>
            {renderActiveToolContent()}
            
            {/* Keyboard shortcut info */}
            <div className="mt-4 text-xs text-gray-400 text-center">
              Press <kbd className="px-1 py-0.5 bg-gray-800 rounded">Ctrl</kbd>+<kbd className="px-1 py-0.5 bg-gray-800 rounded">D</kbd> to toggle debug panel
            </div>
          </div>
        </div>
      )}
      
      {/* Add styles for animations */}
      <style jsx global>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
        
        /* Scrollbar styling */
        ::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        
        ::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.1);
        }
        
        ::-webkit-scrollbar-thumb {
          background: rgba(59, 130, 246, 0.5);
          border-radius: 3px;
        }
        
        /* Key styling */
        kbd {
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          font-size: 0.8em;
          border: 1px solid rgba(59, 130, 246, 0.3);
        }
      `}</style>
    </>
  );
}