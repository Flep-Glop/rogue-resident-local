/**
 * Knowledge Event Handler
 * 
 * This module acts as a central integration point between various game events
 * and the knowledge system, ensuring all knowledge-related events properly
 * update the knowledge constellation.
 * 
 * It subscribes to relevant events like dialogue completions, extension interactions,
 * and explicit knowledge gain events, then ensures the knowledge store is updated.
 */

import { useEffect, useRef } from 'react';
import { GameEventType } from './EventTypes';
import useKnowledgeStore from '@/app/store/knowledgeStore';
import { useEventBus } from './CentralEventBus';

// Ensure the knowledge system is properly updated when concepts are discovered
export function useKnowledgeEventHandler() {
  // Use refs to prevent memory leaks and infinite loops
  const handledEvents = useRef<Set<string>>(new Set());
  const isActive = useRef(true);
  
  useEffect(() => {
    // Reset on mount
    handledEvents.current.clear();
    isActive.current = true;
    
    // Get event bus instance
    const eventBus = useEventBus.getState();
    
    // Handle explicit knowledge gain events
    const handleKnowledgeGain = eventBus.subscribe(
      GameEventType.KNOWLEDGE_GAINED,
      (event) => {
        if (!isActive.current) return;
        
        const payload = event.payload as any;
        
        // Skip if no conceptId
        if (!payload?.conceptId) return;
        
        // Create a unique ID for this event to avoid duplicates
        const eventId = `knowledge_${payload.conceptId}_${Date.now()}`;
        if (handledEvents.current.has(eventId)) return;
        handledEvents.current.add(eventId);
        
        // Limit set size to prevent memory growth
        if (handledEvents.current.size > 100) {
          const oldestEvents = Array.from(handledEvents.current).slice(0, 50);
          oldestEvents.forEach(id => handledEvents.current.delete(id));
        }
        
        // Get knowledge store methods and data
        const knowledgeStore = useKnowledgeStore.getState();
        const { nodes, discoverConcept, updateMastery } = knowledgeStore;
        
        // Check if the concept exists before attempting to discover it
        const conceptExists = nodes.some(node => node.id === payload.conceptId);
        if (!conceptExists) {
          console.warn(`[KnowledgeEventHandler] Concept with ID ${payload.conceptId} doesn't exist, skipping discovery`);
          return;
        }
        
        // First ensure the concept is discovered
        try {
          discoverConcept(payload.conceptId);
          
          // Then update mastery if amount is specified
          if (payload.amount && typeof payload.amount === 'number') {
            updateMastery(payload.conceptId, payload.amount);
          }
          
          console.log(`[KnowledgeEventHandler] Recorded concept: ${payload.conceptId}`);
        } catch (err) {
          console.error('[KnowledgeEventHandler] Error handling knowledge gain:', err);
        }
      }
    );
    
    // Handle extension completion events
    const handleExtensionCompleted = eventBus.subscribe(
      GameEventType.EXTENSION_COMPLETED,
      (event) => {
        if (!isActive.current) return;
        
        const payload = event.payload as any;
        
        // Check if knowledge gain data exists
        if (payload?.knowledgeGained?.conceptId) {
          // Create a unique ID for this event to avoid duplicates
          const eventId = `extension_${payload.knowledgeGained.conceptId}_${Date.now()}`;
          if (handledEvents.current.has(eventId)) return;
          handledEvents.current.add(eventId);
          
          const knowledgeStore = useKnowledgeStore.getState();
          const { nodes, discoverConcept, updateMastery } = knowledgeStore;
          
          // Check if the concept exists
          const conceptExists = nodes.some(node => node.id === payload.knowledgeGained.conceptId);
          if (!conceptExists) {
            console.warn(`[KnowledgeEventHandler] Extension concept ${payload.knowledgeGained.conceptId} doesn't exist, skipping discovery`);
            return;
          }
          
          try {
            // Discover the concept
            discoverConcept(payload.knowledgeGained.conceptId);
            
            // Update mastery if amount is provided
            if (payload.knowledgeGained.amount) {
              updateMastery(
                payload.knowledgeGained.conceptId,
                payload.knowledgeGained.amount
              );
            }
            
            console.log(`[KnowledgeEventHandler] Recorded extension concept: ${payload.knowledgeGained.conceptId}`);
          } catch (err) {
            console.error('[KnowledgeEventHandler] Error handling extension completion:', err);
          }
        }
      }
    );
    
    // Handle dialogue option selection with knowledge gain
    const handleDialogueOptionSelected = eventBus.subscribe(
      GameEventType.DIALOGUE_OPTION_SELECTED,
      (event) => {
        if (!isActive.current) return;
        
        const payload = event.payload as any;
        
        // Check if option has knowledge gain data
        if (payload?.option?.knowledgeGain?.conceptId) {
          // Create a unique ID for this event to avoid duplicates
          const eventId = `dialogue_${payload.option.knowledgeGain.conceptId}_${Date.now()}`;
          if (handledEvents.current.has(eventId)) return;
          handledEvents.current.add(eventId);
          
          const knowledgeStore = useKnowledgeStore.getState();
          const { nodes, discoverConcept, updateMastery } = knowledgeStore;
          
          // Check if the concept exists
          const conceptExists = nodes.some(node => node.id === payload.option.knowledgeGain.conceptId);
          if (!conceptExists) {
            console.warn(`[KnowledgeEventHandler] Dialogue concept ${payload.option.knowledgeGain.conceptId} doesn't exist, skipping discovery`);
            return;
          }
          
          try {
            // Discover the concept
            discoverConcept(payload.option.knowledgeGain.conceptId);
            
            // Update mastery if amount is provided
            if (payload.option.knowledgeGain.amount) {
              updateMastery(
                payload.option.knowledgeGain.conceptId,
                payload.option.knowledgeGain.amount
              );
            }
            
            console.log(`[KnowledgeEventHandler] Recorded dialogue concept: ${payload.option.knowledgeGain.conceptId}`);
          } catch (err) {
            console.error('[KnowledgeEventHandler] Error handling dialogue option:', err);
          }
        }
      }
    );
    
    // Clean up subscriptions on unmount
    return () => {
      isActive.current = false;
      handledEvents.current.clear();
      
      handleKnowledgeGain();
      handleExtensionCompleted();
      handleDialogueOptionSelected();
    };
  }, []);
  
  return null;
}

export default useKnowledgeEventHandler; 