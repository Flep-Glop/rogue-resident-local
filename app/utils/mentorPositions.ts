/**
 * Mentor Position Data
 * 
 * Maps mentor IDs to their world coordinates and room associations.
 * These positions are now time-aware and update based on the tutorial time progression.
 */

import { getCurrentTimeOfDay, MENTOR_TIME_SCHEDULE } from '@/app/core/time/TutorialTimeProgression';

export interface MentorPosition {
  mentorId: string;
  worldX: number;
  worldY: number;
  currentRoom: string;
  name: string;
}

export interface MentorScheduleEntry {
  time: number; // Hour of day (0-23)
  worldX: number;
  worldY: number;
  roomId: string;
}

// Mentor name mapping
const MENTOR_NAMES: Record<string, string> = {
  'garcia': 'Dr. Garcia',
  'jesse': 'Dr. Jesse', 
  'kapoor': 'Dr. Kapoor',
  'quinn': 'Dr. Quinn'
};

/**
 * Get current mentor positions based on time of day
 */
export function getCurrentMentorPositions(): Record<string, MentorPosition> {
  const currentTimeOfDay = getCurrentTimeOfDay();
  const mentorSchedule = MENTOR_TIME_SCHEDULE[currentTimeOfDay];
  
  const positions: Record<string, MentorPosition> = {};
  
  Object.entries(mentorSchedule).forEach(([mentorId, schedule]) => {
    positions[mentorId] = {
      mentorId,
      worldX: schedule.worldX,
      worldY: schedule.worldY,
      currentRoom: schedule.roomId,
      name: MENTOR_NAMES[mentorId] || mentorId
    };
  });
  
  return positions;
}

// Legacy constant for backward compatibility (gets current positions)
export const MENTOR_POSITIONS = getCurrentMentorPositions();

// Room to mentor mapping (for determining which mentor is in which room)
export const ROOM_TO_MENTOR: Record<string, string[]> = {
  'physics-office': ['garcia', 'quinn'],
  'linac-1': ['jesse'],
  'linac-2': [],
  'dosimetry-lab': ['kapoor'],
  'simulation-suite': [],
  'lunch-room': [] // Social hub - could have multiple mentors
};

// Future: Mentor schedules throughout the day
// This would enable mentors to move between rooms based on time
export const MENTOR_SCHEDULES: Record<string, MentorScheduleEntry[]> = {
  'garcia': [
    { time: 8, worldX: -400, worldY: -200, roomId: 'physics-office' },
    { time: 12, worldX: -300, worldY: -100, roomId: 'linac-1' }, // Moves for lunch supervision
    { time: 14, worldX: -400, worldY: -200, roomId: 'physics-office' }, // Back to office
    { time: 17, worldX: -400, worldY: -200, roomId: 'physics-office' }  // End of day
  ],
  'jesse': [
    { time: 8, worldX: -820, worldY: 20, roomId: 'linac-1' },
    { time: 12, worldX: -820, worldY: 20, roomId: 'linac-1' }, // Stays at equipment
    { time: 17, worldX: -820, worldY: 20, roomId: 'linac-1' }
  ],
  'kapoor': [
    { time: 8, worldX: 600, worldY: 0, roomId: 'dosimetry-lab' },
    { time: 12, worldX: 600, worldY: 0, roomId: 'dosimetry-lab' },
    { time: 17, worldX: 600, worldY: 0, roomId: 'dosimetry-lab' }
  ],
  'quinn': [
    { time: 8, worldX: 700, worldY: 50, roomId: 'physics-office' },
    { time: 12, worldX: 700, worldY: 50, roomId: 'physics-office' },
    { time: 17, worldX: 700, worldY: 50, roomId: 'physics-office' }
  ]
};

/**
 * Get current mentor position based on time of day
 * For now, returns static positions. Later can implement dynamic scheduling.
 */
export function getMentorPosition(mentorId: string, currentHour: number = 8): MentorPosition | null {
  const mentor = MENTOR_POSITIONS[mentorId];
  if (!mentor) return null;

  // TODO: Implement time-based position lookup using MENTOR_SCHEDULES
  // For now, return static position
  return mentor;
}

/**
 * Get all mentors currently in a specific room
 */
export function getMentorsInRoom(roomId: string, currentHour: number = 8): MentorPosition[] {
  const mentorIds = ROOM_TO_MENTOR[roomId] || [];
  return mentorIds
    .map(id => getMentorPosition(id, currentHour))
    .filter((position): position is MentorPosition => position !== null);
}

/**
 * Get mentor by room (assuming one primary mentor per room for now)
 */
export function getPrimaryMentorForRoom(roomId: string): MentorPosition | null {
  const mentorsInRoom = getMentorsInRoom(roomId);
  return mentorsInRoom.length > 0 ? mentorsInRoom[0] : null;
} 