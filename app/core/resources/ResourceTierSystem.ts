/**
 * Resource Tier System - Standardized resource outcome handling
 * 
 * This system provides a consistent way to handle resource changes
 * across different game actions (dialogue choices, extensions, etc.)
 */

import { safeDispatch } from '../events/CentralEventBus';
import { GameEventType } from '../events/EventTypes';

// ======== TYPE DEFINITIONS ========

export type ResourceTier = 'FAILURE' | 'MINOR' | 'STANDARD' | 'MAJOR' | 'CRITICAL';
export type MomentumEffect = 'maintain' | 'increment' | 'reset';
export type ResourceSource = 
  | 'dialogue_choice'
  | 'extension_completion'
  | 'strategic_action'
  | 'system'
  | 'night_phase';

export interface ResourceOutcome {
  insight: number;
  momentumEffect: MomentumEffect;
  knowledgeGain?: Array<{
    conceptId: string;
    amount: number;
  }>;
  feedbackMessage?: string;
  delayedEffects?: Array<{
    type: 'insight' | 'momentum' | 'knowledge';
    amount: number;
    delay: number; // in milliseconds
    conceptId?: string;
  }>;
}

// ======== RESOURCE TIERS ========

/**
 * Standard resource tier definitions with default values
 */
export const RESOURCE_TIERS: Record<ResourceTier, ResourceOutcome> = {
  MINOR: { 
    insight: 5, 
    momentumEffect: 'maintain',
    feedbackMessage: 'You made a bit of progress.'
  },
  STANDARD: { 
    insight: 10, 
    momentumEffect: 'increment',
    feedbackMessage: 'Good insight!'
  },
  MAJOR: { 
    insight: 15, 
    momentumEffect: 'increment',
    feedbackMessage: 'Excellent deduction!'
  },
  CRITICAL: { 
    insight: 25, 
    momentumEffect: 'increment',
    feedbackMessage: 'Brilliant analysis!'
  },
  FAILURE: { 
    insight: 0, 
    momentumEffect: 'reset',
    feedbackMessage: 'That didn\'t go well...'
  }
};

// ======== SERVICE CLASS ========

/**
 * Service for applying resource outcomes based on tier
 */
export class ResourceOutcomeService {
  /**
   * Apply standardized resource outcome based on tier
   */
  static applyTierOutcome(
    tier: ResourceTier, 
    storeRef: any, 
    source: ResourceSource = 'system', 
    additionalKnowledge?: Array<{conceptId: string, amount: number}>
  ): void {
    const outcome = { ...RESOURCE_TIERS[tier] };
    
    // Add additional knowledge if provided
    if (additionalKnowledge) {
      outcome.knowledgeGain = additionalKnowledge;
    }
    
    // Apply the outcome
    this.applyResourceOutcome(outcome, storeRef, source);
  }
  
  /**
   * Apply a custom resource outcome
   */
  static applyResourceOutcome(
    outcome: ResourceOutcome, 
    storeRef: any, 
    source: ResourceSource = 'system'
  ): void {
    // Apply insight change if defined
    if (outcome.insight !== undefined) {
      // Use store method to update insight
      if (storeRef.updateInsight) {
        storeRef.updateInsight(outcome.insight, source);
      }
    }
    
    // Apply momentum effect based on type
    if (outcome.momentumEffect) {
      switch (outcome.momentumEffect) {
        case 'increment':
          if (storeRef.incrementMomentum) {
            storeRef.incrementMomentum();
          }
          break;
        case 'reset':
          if (storeRef.resetMomentum) {
            storeRef.resetMomentum();
          }
          break;
        // 'maintain' does nothing
      }
      
      // Dispatch momentum effect event for feedback
      safeDispatch(GameEventType.MOMENTUM_EFFECT, {
        effect: outcome.momentumEffect,
        source: source,
        intensity: outcome.insight > 15 ? 'high' : 'medium',
        timestamp: Date.now()
      }, 'resourceTierSystem');
    }
    
    // Apply knowledge mastery updates if provided
    if (outcome.knowledgeGain && storeRef.updateKnowledgeMastery) {
      outcome.knowledgeGain.forEach(gain => {
        storeRef.updateKnowledgeMastery(gain.conceptId, gain.amount, 'knowledge');
      });
    }
    
    // Process delayed effects if present
    if (outcome.delayedEffects && outcome.delayedEffects.length > 0) {
      outcome.delayedEffects.forEach(effect => {
        setTimeout(() => {
          switch (effect.type) {
            case 'insight':
              storeRef.updateInsight(effect.amount, `${source}_delayed`);
              break;
            case 'momentum':
              if (effect.amount > 0) {
                storeRef.incrementMomentum();
              } else if (effect.amount < 0) {
                storeRef.resetMomentum();
              }
              break;
            case 'knowledge':
              if (effect.conceptId) {
                storeRef.updateKnowledgeMastery(effect.conceptId, effect.amount, 'knowledge');
              }
              break;
          }
        }, effect.delay);
      });
    }
    
    // Display feedback message if provided
    if (outcome.feedbackMessage) {
      safeDispatch(GameEventType.FEEDBACK_MESSAGE, {
        message: outcome.feedbackMessage,
        type: 'resource',
        source: source,
        timestamp: Date.now()
      }, 'resourceTierSystem');
    }
    
    // Ensure a centralized resource change event is dispatched for the feedback system
    safeDispatch(GameEventType.RESOURCE_OUTCOME_APPLIED, {
      resourceType: outcome.insight !== undefined ? 'insight' : 'momentum',
      outcomeSource: source,
      outcome: {
        ...outcome,
        timestamp: Date.now()
      }
    }, 'resourceTierSystem');
  }
}

// ======== UTILITY FUNCTIONS ========

/**
 * Helper function to get a resource tier based on success level
 */
export function getResourceTierForSuccess(
  successLevel: number, // 0-100 scale
  hasMomentumRisk: boolean = true
): ResourceTier {
  if (successLevel < 20) return hasMomentumRisk ? 'FAILURE' : 'MINOR';
  if (successLevel < 50) return 'MINOR';
  if (successLevel < 75) return 'STANDARD';
  if (successLevel < 90) return 'MAJOR';
  return 'CRITICAL';
}

/**
 * Create a custom resource outcome with specified parameters
 */
export function createCustomOutcome(
  insightAmount: number,
  momentumEffect: MomentumEffect,
  feedbackMessage?: string,
  knowledgeGain?: Array<{conceptId: string, amount: number}>,
  delayedEffects?: Array<{type: 'insight' | 'momentum' | 'knowledge', amount: number, delay: number, conceptId?: string}>
): ResourceOutcome {
  return {
    insight: insightAmount,
    momentumEffect,
    feedbackMessage,
    knowledgeGain,
    delayedEffects
  };
} 