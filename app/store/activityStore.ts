import { create } from 'zustand';
import { 
  ActivityOption, 
  KnowledgeDomain, 
  LocationId, 
  MentorId, 
  ActivityDifficulty, 
  TimeBlock,
  Difficulty,
  Season
} from '@/app/types';
import { useGameStore } from './gameStore';
import { TimeManager } from '@/app/core/time/TimeManager';
import { useKnowledgeStore } from './knowledgeStore';

// Schedule system - mapping time blocks to standard activities
const hospitalSchedule: Record<string, ActivityOption[]> = {
  // 8:00 AM
  '8:0': [
    {
      id: 'morning_rounds',
      title: 'Morning Rounds',
      description: 'Join Dr. Garcia for morning patient rounds in the ward.',
      location: LocationId.WARD,
      duration: 60,
      mentor: MentorId.GARCIA,
      domains: [KnowledgeDomain.RADIATION_THERAPY],
      difficulty: ActivityDifficulty.EASY,
    },
    {
      id: 'qa_protocol_review',
      title: 'QA Protocol Review',
      description: 'Review quality assurance protocols with Dr. Kapoor.',
      location: LocationId.PHYSICS_OFFICE,
      duration: 60,
      mentor: MentorId.KAPOOR,
      domains: [KnowledgeDomain.DOSIMETRY],
      difficulty: ActivityDifficulty.MEDIUM,
    },
    {
      id: 'linac_morning_checkout',
      title: 'Linac Morning Checkout',
      description: 'Assist Jesse with the morning linear accelerator checkout procedures.',
      location: LocationId.TREATMENT_ROOM_1,
      duration: 60,
      mentor: MentorId.JESSE,
      domains: [KnowledgeDomain.LINAC_ANATOMY],
      difficulty: ActivityDifficulty.EASY,
    },
  ],
  
  // 9:00 AM
  '9:0': [
    {
      id: 'patient_case_review',
      title: 'Patient Case Review',
      description: 'Review treatment plans for incoming patients with Dr. Garcia.',
      location: LocationId.CONFERENCE_ROOM,
      duration: 60,
      mentor: MentorId.GARCIA,
      domains: [KnowledgeDomain.TREATMENT_PLANNING],
      difficulty: ActivityDifficulty.MEDIUM,
    },
    {
      id: 'equipment_training',
      title: 'Basic Equipment Training',
      description: 'Learn about essential equipment components with Jesse.',
      location: LocationId.TREATMENT_ROOM_2,
      duration: 60,
      mentor: MentorId.JESSE,
      domains: [KnowledgeDomain.LINAC_ANATOMY],
      difficulty: ActivityDifficulty.EASY,
    },
    {
      id: 'patient_positioning_qa',
      title: 'Patient Positioning QA',
      description: 'Observe Dr. Quinn performing quality assurance for patient positioning systems.',
      location: LocationId.TREATMENT_ROOM_3,
      duration: 60,
      mentor: MentorId.QUINN,
      domains: [KnowledgeDomain.RADIATION_THERAPY, KnowledgeDomain.DOSIMETRY],
      difficulty: ActivityDifficulty.MEDIUM,
    }
  ],
  
  // 12:00 PM (Lunch)
  '12:0': [
    {
      id: 'lunch_garcia',
      title: 'Lunch with Dr. Garcia',
      description: 'Join Dr. Garcia for lunch in the cafeteria.',
      location: LocationId.CAFETERIA,
      duration: 60,
      mentor: MentorId.GARCIA,
      domains: [],
      difficulty: ActivityDifficulty.NONE,
      isNetworking: true
    },
    {
      id: 'lunch_kapoor',
      title: 'Lunch with Dr. Kapoor',
      description: 'Join Dr. Kapoor for lunch in the cafeteria.',
      location: LocationId.CAFETERIA,
      duration: 60,
      mentor: MentorId.KAPOOR,
      domains: [],
      difficulty: ActivityDifficulty.NONE,
      isNetworking: true
    },
    {
      id: 'lunch_jesse',
      title: 'Lunch with Jesse',
      description: 'Join Jesse for lunch in the cafeteria.',
      location: LocationId.CAFETERIA,
      duration: 60,
      mentor: MentorId.JESSE,
      domains: [],
      difficulty: ActivityDifficulty.NONE,
      isNetworking: true
    },
    {
      id: 'lunch_quinn',
      title: 'Lunch with Dr. Quinn',
      description: 'Join Dr. Quinn for lunch in the cafeteria.',
      location: LocationId.CAFETERIA,
      duration: 60,
      mentor: MentorId.QUINN,
      domains: [],
      difficulty: ActivityDifficulty.NONE,
      isNetworking: true
    }
  ],
  
  // 4:00 PM
  '16:0': [
    {
      id: 'end_of_day_rounds',
      title: 'End-of-Day Rounds',
      description: 'Wrap up the day with final patient rounds with Dr. Garcia.',
      location: LocationId.WARD,
      duration: 60,
      mentor: MentorId.GARCIA,
      domains: [KnowledgeDomain.RADIATION_THERAPY],
      difficulty: ActivityDifficulty.EASY,
    },
    {
      id: 'end_of_day_equipment',
      title: 'End-of-Day Equipment Check',
      description: 'Help Jesse with the end-of-day equipment verification.',
      location: LocationId.TREATMENT_ROOM_1,
      duration: 60,
      mentor: MentorId.JESSE,
      domains: [KnowledgeDomain.LINAC_ANATOMY],
      difficulty: ActivityDifficulty.EASY,
    },
    {
      id: 'quick_self_study',
      title: 'Self-Study',
      description: 'End the day with some focused study time in the library.',
      location: LocationId.LIBRARY,
      duration: 60,
      domains: [],
      difficulty: ActivityDifficulty.NONE,
    }
  ]
};

// Special events - triggered by specific constellation patterns
const specialEvents: Record<Season, Record<string, ActivityOption>> = {
  [Season.SPRING]: {
    'new_patient_orientation': {
      id: 'new_patient_orientation',
      title: 'New Patient Orientation',
      description: 'Help introduce a new patient to the treatment process.',
      location: LocationId.CLINIC,
      duration: 60,
      mentor: MentorId.GARCIA,
      domains: [KnowledgeDomain.TREATMENT_PLANNING, KnowledgeDomain.RADIATION_THERAPY],
      difficulty: ActivityDifficulty.MEDIUM,
      requirements: {
        stars: { 
          domain: KnowledgeDomain.TREATMENT_PLANNING,
          count: 3, 
          connected: true 
        }
      }
    }
  },
  [Season.SUMMER]: {
    'complex_case_review': {
      id: 'complex_case_review',
      title: 'Complex Case Review',
      description: 'Collaborate with Dr. Garcia and Dr. Quinn on a challenging patient case.',
      location: LocationId.CONFERENCE_ROOM,
      duration: 90,
      mentors: [MentorId.GARCIA, MentorId.QUINN],
      domains: [KnowledgeDomain.TREATMENT_PLANNING, KnowledgeDomain.RADIATION_THERAPY],
      difficulty: ActivityDifficulty.HARD,
      requirements: {
        stars: { 
          domain: KnowledgeDomain.TREATMENT_PLANNING,
          count: 2,
          minMastery: 60
        }
      }
    }
  },
  [Season.FALL]: {
    'novel_technique_demo': {
      id: 'novel_technique_demo',
      title: 'Novel Technique Demo',
      description: 'Join Dr. Quinn for a demonstration of an experimental treatment technique.',
      location: LocationId.RESEARCH_LAB,
      duration: 60,
      mentor: MentorId.QUINN,
      domains: [KnowledgeDomain.TREATMENT_PLANNING, KnowledgeDomain.RADIATION_THERAPY, KnowledgeDomain.DOSIMETRY],
      difficulty: ActivityDifficulty.HARD,
      requirements: {
        pattern: 'triangle'
      }
    }
  },
  [Season.WINTER]: {
    'ionix_calibration': {
      id: 'ionix_calibration',
      title: 'Ionix Calibration',
      description: 'Work with Dr. Quinn and Dr. Kapoor on calibrating the mysterious Ionix device.',
      location: LocationId.RESEARCH_LAB,
      duration: 90,
      mentors: [MentorId.QUINN, MentorId.KAPOOR],
      domains: [KnowledgeDomain.DOSIMETRY, KnowledgeDomain.LINAC_ANATOMY],
      difficulty: ActivityDifficulty.HARD,
      requirements: {
        stars: {
          domain: KnowledgeDomain.DOSIMETRY,
          minMastery: 75
        }
      }
    }
  }
};

// Generate a basic library self-study option that's always available
const generateSelfStudyOption = (currentTime: TimeBlock): ActivityOption => {
  return {
    id: `self_study_${currentTime.hour}_${currentTime.minute}`,
    title: 'Self Study',
    description: 'Spend time in the library studying medical physics concepts.',
    location: LocationId.LIBRARY,
    duration: 60,
    domains: [], // Player will choose domain during activity
    difficulty: ActivityDifficulty.NONE,
  };
};

// Interface for the activity store
interface ActivityState {
  // Currently available activities for this time block
  availableActivities: ActivityOption[];
  
  // Currently selected activity (if any)
  currentActivity: ActivityOption | null;
  
  // Special events that have been triggered
  triggeredSpecialEvents: string[];
  
  // Actions
  generateAvailableActivities: () => void;
  selectActivity: (activityId: string) => void;
  completeActivity: (success: boolean) => void;
  triggerSpecialEvent: (eventId: string) => void;
  checkSpecialEventRequirements: () => void;
  
  // Progressive control mechanics
  scheduledAppointment: ActivityOption | null;
  scheduleAppointment: (activity: ActivityOption) => boolean;
}

// Create the activity store
export const useActivityStore = create<ActivityState>((set, get) => ({
  // Initialize state
  availableActivities: [],
  currentActivity: null,
  triggeredSpecialEvents: [],
  scheduledAppointment: null,
  
  // Generate available activities based on current time
  generateAvailableActivities: () => {
    const gameState = useGameStore.getState();
    const currentTime = gameState.currentTime;
    const currentSeason = gameState.currentSeason;
    const difficulty = gameState.difficulty;
    
    // Format time block key for lookup in schedule
    const timeKey = `${currentTime.hour}:${currentTime.minute}`;
    
    let activities: ActivityOption[] = [];
    
    // Check if there's a scheduled appointment for this time
    const scheduledAppointment = get().scheduledAppointment;
    if (scheduledAppointment) {
      activities.push(scheduledAppointment);
      set({ scheduledAppointment: null }); // Clear after adding
    }
    
    // Check if this time has standard scheduled activities
    if (hospitalSchedule[timeKey]) {
      activities = [...activities, ...hospitalSchedule[timeKey]];
    }
    
    // Check for any triggered special events
    const specialEventsForSeason = specialEvents[currentSeason];
    const triggeredEvents = get().triggeredSpecialEvents;
    triggeredEvents.forEach(eventId => {
      if (specialEventsForSeason[eventId]) {
        activities.push(specialEventsForSeason[eventId]);
      }
    });
    
    // If we have fewer than 2 activities, always add self-study
    if (activities.length < 2) {
      activities.push(generateSelfStudyOption(currentTime));
    }
    
    // Apply difficulty adjustments
    activities = activities.map(activity => {
      const activityCopy = { ...activity };
      
      // Adjust difficulty based on player's selected difficulty
      if (difficulty === Difficulty.BEGINNER && activity.difficulty === ActivityDifficulty.HARD) {
        activityCopy.difficulty = ActivityDifficulty.MEDIUM;
      } else if (difficulty === Difficulty.EXPERT && activity.difficulty === ActivityDifficulty.EASY) {
        activityCopy.difficulty = ActivityDifficulty.MEDIUM;
      }
      
      // Adjust duration based on relationship levels - high relationship reduces time
      if (activity.mentor) {
        const relationshipLevel = gameState.getRelationshipLevel(activity.mentor);
        if (relationshipLevel >= 4 && activity.duration > 30) {
          // 15 minute reduction for high relationship
          activityCopy.duration = Math.max(30, activity.duration - 15);
        }
      }
      
      return activityCopy;
    });
    
    // Set available activities
    set({ availableActivities: activities });
  },
  
  // Select an activity
  selectActivity: (activityId: string) => {
    const activity = get().availableActivities.find(a => a.id === activityId);
    
    if (activity) {
      set({ currentActivity: activity });
      
      // Bug fix: Don't advance time immediately if this is the last activity
      // The time advancement will happen in completeActivity instead
      const gameState = useGameStore.getState();
      const timeManager = gameState.timeManager;
      
      // Check if this activity would go past end of day
      const endTime = timeManager.calculateEndTime(gameState.currentTime, activity.duration);
      const wouldEndDay = timeManager.isDayEnded(endTime);
      
      // Only advance time immediately if it wouldn't end the day
      if (!wouldEndDay) {
        gameState.advanceTime(activity.duration);
      }
      // Otherwise, the time advancement will happen in completeActivity
    }
  },
  
  // Complete the current activity
  completeActivity: (success: boolean) => {
    const activity = get().currentActivity;
    const gameState = useGameStore.getState();
    
    if (activity && success) {
      // Add resources based on activity
      if (activity.difficulty === ActivityDifficulty.EASY) {
        gameState.addInsight(10);
        gameState.addMomentum(1);
      } else if (activity.difficulty === ActivityDifficulty.MEDIUM) {
        gameState.addInsight(20);
        gameState.addMomentum(1);
      } else if (activity.difficulty === ActivityDifficulty.HARD) {
        gameState.addInsight(30);
        gameState.addMomentum(2);
      }
      
      // If it's a meal, no resources but still counts as success
      if (activity.location === LocationId.CAFETERIA) {
        // No resources, but would update relationship in a relationship store
      }
      
      // Give star points on completion
      gameState.addStarPoints(1);
    } else if (activity) {
      // Failure case - lose momentum
      gameState.resetMomentum();
    }
    
    // Bug fix: Check if we need to advance time now (for end-of-day activities)
    if (activity) {
      const timeManager = gameState.timeManager;
      const currentTime = gameState.currentTime;
      const endTime = timeManager.calculateEndTime(currentTime, activity.duration);
      const wouldEndDay = timeManager.isDayEnded(endTime);
      
      if (wouldEndDay) {
        // Now that the activity is complete, advance time
        gameState.advanceTime(activity.duration);
      }
    }
    
    // Clear current activity and generate new ones
    set({ currentActivity: null });
    get().generateAvailableActivities();
  },
  
  // Trigger a special event
  triggerSpecialEvent: (eventId: string) => {
    set(state => ({
      triggeredSpecialEvents: [...state.triggeredSpecialEvents, eventId]
    }));
  },
  
  // Check if any special events should be triggered based on constellation patterns
  checkSpecialEventRequirements: () => {
    const gameState = useGameStore.getState();
    const currentSeason = gameState.currentSeason;
    const knowledgeState = useKnowledgeStore.getState();
    
    // Get active stars and connections
    const activeStars = knowledgeState.getActiveStars();
    const unlockedStars = knowledgeState.getUnlockedStars();
    
    // Check each special event for the current season
    const seasonEvents = specialEvents[currentSeason];
    Object.entries(seasonEvents).forEach(([eventId, event]) => {
      // Skip already triggered events
      if (get().triggeredSpecialEvents.includes(eventId)) {
        return;
      }
      
      // Check star requirements
      if (event.requirements?.stars) {
        const req = event.requirements.stars;
        let matchingStars = unlockedStars;
        
        // Filter by domain if specified
        if (req.domain) {
          matchingStars = matchingStars.filter(s => s.domain === req.domain);
        }
        
        // Filter by minimum mastery if specified
        if (req.minMastery) {
          matchingStars = matchingStars.filter(s => s.mastery >= req.minMastery);
        }
        
        // Check if we have enough stars
        if (req.count && matchingStars.length < req.count) {
          return;
        }
        
        // Check connection requirement if specified
        if (req.connected) {
          // Complex check for connected stars would go here
          // This is a simplified version
          const connectedCount = matchingStars.filter(s => 
            unlockedStars.some(other => 
              knowledgeState.hasConnection(s.id, other.id)
            )
          ).length;
          
          if (connectedCount < req.count) {
            return;
          }
        }
      }
      
      // Check pattern requirements
      if (event.requirements?.pattern === 'triangle') {
        // Simplified triangle pattern check
        // Would need a more sophisticated implementation
      }
      
      // If we got here, requirements are met
      get().triggerSpecialEvent(eventId);
    });
  },
  
  // Schedule an appointment (Progressive Control mechanic)
  scheduleAppointment: (activity: ActivityOption): boolean => {
    const gameState = useGameStore.getState();
    
    // Check if player has unlocked this control mechanic
    if (!gameState.isControlMechanicUnlocked('APPOINTMENT_SETTING')) {
      return false;
    }
    
    // Set the scheduled appointment
    set({ scheduledAppointment: activity });
    return true;
  }
})); 