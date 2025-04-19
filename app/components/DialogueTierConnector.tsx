'use client';

import { useCallback } from 'react';
import { useResourceStore } from '../store/resourceStore';
import { 
  ResourceOutcomeService, 
  ResourceTier, 
  getResourceTierForSuccess
} from '../core/resources/ResourceTierSystem';

/**
 * DialogueTierConnector - Hook that connects dialogue scoring to resource tiers
 * This is a minimally invasive way to add resource tier handling to dialogues
 * without modifying existing dialogue components directly
 */
export function useDialogueTierConnector() {
  const resourceStore = useResourceStore();
  
  /**
   * Process a dialogue option selection with standardized resource outcomes
   * @param score Score from 0-100 representing success level
   * @param hasMomentumRisk Whether momentum can be lost (defaults to true)
   * @returns The applied resource tier
   */
  const processOptionOutcome = useCallback((
    score: number, 
    hasMomentumRisk: boolean = true
  ): ResourceTier => {
    // Determine tier based on score (0-100)
    const tier = getResourceTierForSuccess(score, hasMomentumRisk);
    
    // Apply the resource outcome
    ResourceOutcomeService.applyTierOutcome(
      tier, 
      resourceStore, 
      'dialogue_choice'
    );
    
    return tier;
  }, [resourceStore]);
  
  return {
    processOptionOutcome
  };
}

/**
 * Test function for verifying momentum in development
 */
export function testMomentumSystem() {
  const store = useResourceStore.getState();
  
  // Test momentum increase
  console.log('Current momentum:', store.momentum);
  store.incrementMomentum();
  console.log('After increment:', store.momentum);
  
  // Test momentum reset
  store.resetMomentum();
  console.log('After reset:', store.momentum);
  
  // Test ResourceOutcomeService integration
  ResourceOutcomeService.applyTierOutcome('STANDARD', store, 'system');
  console.log('After STANDARD tier:', store.momentum);
  
  ResourceOutcomeService.applyTierOutcome('FAILURE', store, 'system');
  console.log('After FAILURE tier:', store.momentum);
  
  return 'Momentum test complete - check console for results';
} 