/**
 * NodeCompletionHandler - Bridge between node completion events and game state machine
 * 
 * This component ensures that node completion is properly registered in the state machine,
 * regardless of whether it's triggered by the game store, event bus, or custom DOM events.
 */
import { useEffect } from 'react';
import { GameEventType } from './EventTypes';
import { useEventBus } from './CentralEventBus';

// Hook for using the NodeCompletionHandler
export function useNodeCompletionHandler() {
  const eventBus = useEventBus();
  
  useEffect(() => {
    const handleNodeCompleted = (event: any) => {
      try {
        const nodeId = event.payload?.nodeId || event.detail?.nodeId;
        if (!nodeId) {
          console.warn('[NodeCompletionHandler] Missing nodeId in completion event', event);
          return;
        }

        console.log(`[NodeCompletionHandler] Processing node completion for: ${nodeId}`);
        
        // Make sure the state machine is updated
        if (typeof window !== 'undefined' && window.__GAME_STATE_MACHINE_DEBUG__?.getCurrentState) {
          const gameStateMachine = window.__GAME_STATE_MACHINE_DEBUG__.getCurrentState();
          if (gameStateMachine) {
            let isFirstCompletedNode = false;
            
            // Check if this is the first completed node
            if (gameStateMachine.completedNodeIds && 
                Array.isArray(gameStateMachine.completedNodeIds) && 
                gameStateMachine.completedNodeIds.length === 0) {
              isFirstCompletedNode = true;
              console.log('[NodeCompletionHandler] First node completion detected');
            }
            
            if (typeof gameStateMachine.markNodeCompleted === 'function') {
              console.log(`[NodeCompletionHandler] Marking node ${nodeId} as completed in state machine`);
              gameStateMachine.markNodeCompleted(nodeId);
            }
            
            if (typeof gameStateMachine.refreshAvailableNodes === 'function') {
              console.log('[NodeCompletionHandler] Refreshing available nodes');
              gameStateMachine.refreshAvailableNodes();
            }
            
            // Log current state for debugging
            if (gameStateMachine.completedNodeIds) {
              console.log('[NodeCompletionHandler] Updated completed nodes:', 
                gameStateMachine.completedNodeIds);
              
              // Check if this is the first node after the update
              if (!isFirstCompletedNode && 
                  gameStateMachine.completedNodeIds.length === 1 && 
                  gameStateMachine.completedNodeIds.includes(nodeId)) {
                isFirstCompletedNode = true;
                console.log('[NodeCompletionHandler] First node completion detected (after update)');
              }
            }
            
            // Trigger journal acquisition for the first node
            if (isFirstCompletedNode && eventBus && typeof eventBus.dispatch === 'function') {
              console.log('[NodeCompletionHandler] Triggering journal acquisition for first node');
              eventBus.dispatch(
                GameEventType.JOURNAL_ACQUIRED,
                {
                  tier: 'base',
                  character: 'player',
                  source: 'first_node_completion',
                  nodeId: nodeId
                },
                'node_completion_handler'
              );
            }
          }
        }
        
        // Dispatch a map refresh event to force UI update
        if (eventBus && typeof eventBus.dispatch === 'function') {
          eventBus.dispatch(
            GameEventType.NODE_UNLOCKED,
            {
              completedNodeIds: nodeId,
              force: true,
              timestamp: Date.now()
            },
            'node_completion_handler'
          );
        }
      } catch (error) {
        console.error('[NodeCompletionHandler] Error processing completion:', error);
      }
    };
    
    // Set up event listeners
    let unsubscribeFn: (() => void) | null = null;
    
    try {
      // Subscribe to normal event bus events if available
      if (eventBus && typeof eventBus.subscribe === 'function') {
        unsubscribeFn = eventBus.subscribe(
          GameEventType.NODE_COMPLETED,
          handleNodeCompleted
        );
      }
    } catch (err) {
      console.error('[NodeCompletionHandler] Error subscribing to NODE_COMPLETED:', err);
    }
    
    // Listen for DOM custom events (for backward compatibility)
    document.addEventListener('node:completed', handleNodeCompleted);
    
    return () => {
      // Clean up event bus subscription
      if (unsubscribeFn && typeof unsubscribeFn === 'function') {
        try {
          unsubscribeFn();
        } catch (err) {
          console.warn('[NodeCompletionHandler] Error unsubscribing:', err);
        }
      }
      
      // Clean up DOM event listener
      document.removeEventListener('node:completed', handleNodeCompleted);
      console.log('[NodeCompletionHandler] Unmounted');
    };
  }, [eventBus]);
  
  return null;
}

// Component version for direct embedding in component tree
export default function NodeCompletionHandler() {
  useNodeCompletionHandler();
  return null;
} 