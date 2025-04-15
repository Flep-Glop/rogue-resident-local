import { GameEventType } from './EventTypes';
import { useEventSubscription, safeDispatch } from './CentralEventBus';
import { useEffect } from 'react';

/**
 * JournalEventHandler - Bridge between node completion and journal acquisition
 * 
 * This component listens for NODE_COMPLETED events with isJournalAcquisition flag
 * and dispatches the appropriate JOURNAL_ACQUIRED event for the journal components.
 */
export default function JournalEventHandler() {
  // Listen for node completion events that involve journal acquisition
  useEventSubscription(
    GameEventType.NODE_COMPLETED,
    (event) => {
      const payload = event.payload as any;
      
      // Check if this is a journal acquisition event
      if (payload?.result?.isJournalAcquisition) {
        console.log('[JournalEventHandler] Detected journal acquisition from node completion', payload);
        
        // Extract journal tier or default to 'technical'
        const tier = payload.result.journalTier || 'technical';
        
        // Dispatch the JOURNAL_ACQUIRED event
        safeDispatch(
          GameEventType.JOURNAL_ACQUIRED,
          {
            tier,
            character: payload.character || 'kapoor',
            source: 'node_completion',
            nodeId: payload.nodeId
          },
          'journal_event_handler'
        );
        
        console.log(`[JournalEventHandler] Dispatched JOURNAL_ACQUIRED event with tier: ${tier}`);
      }
    },
    [] // No dependencies
  );
  
  // Component doesn't render anything
  return null;
}

/**
 * Custom hook for using the journal event handler
 * This allows components to easily include the journal event handler logic
 */
export function useJournalEventHandler() {
  useEffect(() => {
    console.log('[JournalEventHandler] Initialized journal event handler');
    
    // Nothing to clean up
    return () => {
      console.log('[JournalEventHandler] Journal event handler unmounted');
    };
  }, []);
} 