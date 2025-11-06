import { GamePhase } from '@/app/types';
import { centralEventBus } from '../events/CentralEventBus';
import { GameEventType } from '@/app/types';

/**
 * Manages Night phase transitions and game cycles
 */
export class PhaseManager {
  /**
   * Transition to Night Phase (home scene)
   * Handles cleanup and Night Phase initialization
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