import { GamePhase } from '@/app/types';
import { centralEventBus } from '../events/CentralEventBus';
import { GameEventType } from '@/app/types';

/**
 * Manages transitions between Day and Night phases
 */
export class PhaseManager {
  /**
   * Transition from Day Phase to Night Phase
   * Handles end-of-day cleanup and Night Phase initialization
   */
  public static transitionToNightPhase(dayNumber: number, insightRemaining: number) {
    // Track the transition
    centralEventBus.dispatch(
      GameEventType.END_OF_DAY_REACHED,
      { 
        day: dayNumber,
        insightRemaining
      },
      'PhaseManager.transitionToNightPhase'
    );
    
    // Start Night Phase
    centralEventBus.dispatch(
      GameEventType.NIGHT_PHASE_STARTED,
      { day: dayNumber },
      'PhaseManager.transitionToNightPhase'
    );
    
    return GamePhase.NIGHT;
  }
  
  /**
   * Transition from Night Phase to Day Phase
   * Handles start-of-day initialization
   */
  public static transitionToDayPhase(dayNumber: number, activeStarCount: number) {
    // Calculate start-of-day insight bonus
    const insightBonus = activeStarCount; // +1 insight per active star
    
    // Start Day Phase
    centralEventBus.dispatch(
      GameEventType.DAY_PHASE_STARTED,
      { 
        day: dayNumber,
        activeStarCount,
        insightBonus 
      },
      'PhaseManager.transitionToDayPhase'
    );
    
    return GamePhase.DAY;
  }
  
  /**
   * Generate day summary information
   */
  public static generateDaySummary(
    dayNumber: number, 
    insightGained: number, 
    insightRemaining: number,
    conceptsDiscovered: string[],
    activitiesCompleted: number
  ) {
    return {
      dayNumber,
      insightGained,
      insightRemaining,
      insightConverted: Math.floor(insightRemaining / 5),
      starPointsEarned: Math.floor(insightRemaining / 5),
      conceptsDiscovered,
      activitiesCompleted,
    };
  }
} 