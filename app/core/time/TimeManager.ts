import { TimeBlock } from "@/app/types";

/**
 * Manages game time during the Day Phase
 * Handles time blocks, advancements, and time-based availability
 */
export class TimeManager {
  // Day starts at 8:00 AM
  private static START_HOUR = 8;
  private static START_MINUTE = 0;
  
  // Day ends at 5:00 PM
  private static END_HOUR = 17;
  private static END_MINUTE = 0;
  
  // Current time
  private currentTime: TimeBlock;
  
  constructor() {
    // Initialize to start of day
    this.currentTime = {
      hour: TimeManager.START_HOUR,
      minute: TimeManager.START_MINUTE
    };
  }
  
  /**
   * Get the current time
   */
  public getCurrentTime(): TimeBlock {
    return { ...this.currentTime };
  }
  
  /**
   * Advance time by specified minutes
   */
  public advanceTime(minutes: number): TimeBlock {
    let { hour, minute } = this.currentTime;
    
    // Add minutes
    minute += minutes;
    
    // Handle hour overflow
    while (minute >= 60) {
      minute -= 60;
      hour += 1;
    }
    
    this.currentTime = { hour, minute };
    return this.getCurrentTime();
  }
  
  /**
   * Check if the day has ended
   */
  public isDayEnded(): boolean {
    const { hour, minute } = this.currentTime;
    
    return (
      hour > TimeManager.END_HOUR || 
      (hour === TimeManager.END_HOUR && minute >= TimeManager.END_MINUTE)
    );
  }
  
  /**
   * Reset time to start of day
   */
  public resetToStartOfDay(): TimeBlock {
    this.currentTime = {
      hour: TimeManager.START_HOUR,
      minute: TimeManager.START_MINUTE
    };
    return this.getCurrentTime();
  }
  
  /**
   * Format time as string (e.g., "8:00 AM")
   */
  public static formatTime(time: TimeBlock): string {
    const { hour, minute } = time;
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12; // Convert 0 to 12 for 12 AM
    const displayMinute = minute.toString().padStart(2, '0');
    
    return `${displayHour}:${displayMinute} ${period}`;
  }
  
  /**
   * Format the current time as string
   */
  public formatCurrentTime(): string {
    return TimeManager.formatTime(this.currentTime);
  }
  
  /**
   * Calculate end time after a duration
   */
  public calculateEndTime(startTime: TimeBlock, durationMinutes: number): TimeBlock {
    let { hour, minute } = { ...startTime };
    
    // Add duration
    minute += durationMinutes;
    
    // Handle hour overflow
    while (minute >= 60) {
      minute -= 60;
      hour += 1;
    }
    
    return { hour, minute };
  }
  
  /**
   * Check if an activity can fit in the remaining day time
   */
  public canActivityFitInDay(durationMinutes: number): boolean {
    const endTime = this.calculateEndTime(this.currentTime, durationMinutes);
    
    return (
      endTime.hour < TimeManager.END_HOUR || 
      (endTime.hour === TimeManager.END_HOUR && endTime.minute <= TimeManager.END_MINUTE)
    );
  }
} 