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
    const { currentTime, difficulty, currentSeason } = useGameStore.getState();
    const { getActiveStars } = useKnowledgeStore.getState();
    const timeKey = `${currentTime.hour}:${currentTime.minute}`;
    
    let activities: ActivityOption[] = [];
    
    // Check standard schedule
    if (hospitalSchedule[timeKey]) {
      activities = [...activities, ...hospitalSchedule[timeKey]];
    }
    
    // Add self-study option (always available during the day)
    if (currentTime.hour >= 8 && currentTime.hour < 17 && timeKey !== '12:0') {
      activities.push(generateSelfStudyOption(currentTime));
    }
    
    // Check for triggered special events for the current season
    const seasonEvents = specialEvents[currentSeason] || {};
    const activeStars = getActiveStars();
    
    Object.values(seasonEvents).forEach(event => {
      if (event.requirements) {
        // Check star requirements
        if (event.requirements.stars) {
          const req = event.requirements.stars;
          const matchingStars = activeStars.filter(star => star.domain === req.domain);
          
          if (matchingStars.length >= req.count) {
            // Basic count check passed
            let meetsRequirement = true;
            
            // Check for connectivity if required
            // if (req.connected) { <-- Temporarily removed connectivity check
            //   // Need a new way to check this without getConstellations
            // }
            
            if (meetsRequirement && !get().triggeredSpecialEvents.includes(event.id)) {
              // Add the event if requirements met and not already triggered
              activities.push(event);
            }
          }
        }
        
        // Check time requirement
        if (event.requirements.time && event.requirements.time !== timeKey) {
          // Remove event if time requirement is not met
          activities = activities.filter(a => a.id !== event.id);
        }
      }
    });
    
    // Apply difficulty modifications (if any)
    activities = activities.map(activity => {
      // Adjust difficulty based on global setting
      let adjustedDifficulty = activity.difficulty;
      if (difficulty === Difficulty.HARD && adjustedDifficulty === ActivityDifficulty.MEDIUM) {
        adjustedDifficulty = ActivityDifficulty.HARD;
      } else if (difficulty === Difficulty.EASY && adjustedDifficulty === ActivityDifficulty.MEDIUM) {
        adjustedDifficulty = ActivityDifficulty.EASY;
      }
      return { ...activity, difficulty: adjustedDifficulty };
    });
    
    // Remove networking activities if the player prefers focused work
    // TODO: Implement a setting or state for player preference
    // if (playerPrefersFocus) {
    //   activities = activities.filter(activity => !activity.isNetworking);
    // }

    // Add scheduled appointment if it exists and matches current time
    const scheduled = get().scheduledAppointment;
    if (scheduled && `${scheduled.startTime?.hour}:${scheduled.startTime?.minute}` === timeKey) {
      activities.push(scheduled);
    }
    
    // Update state and mark locations as seen within the same update batch
    set((state) => {
      // Get the action from the other store *inside* the update function
      const { markLocationAsSeen } = useGameStore.getState();
      
      // Perform the side-effect (marking seen)
      activities.forEach(activity => {
        markLocationAsSeen(activity.location);
      });
      
      // Return the new state for this store
      return { availableActivities: activities };
    });
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
    
    // Clear current activity. The useEffect in DayPhase will handle generating new ones.
    set({ currentActivity: null });
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