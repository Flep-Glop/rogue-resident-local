import { create } from 'zustand';
import { ActivityOption, KnowledgeDomain, LocationId, MentorId, ActivityDifficulty, TimeBlock } from '@/app/types';
import { useGameStore } from './gameStore';
import { TimeManager } from '@/app/core/time/TimeManager';

// Interface for the activity store
interface ActivityState {
  // Currently available activities for this time block
  availableActivities: ActivityOption[];
  
  // Currently selected activity (if any)
  currentActivity: ActivityOption | null;
  
  // Actions
  generateAvailableActivities: () => void;
  selectActivity: (activityId: string) => void;
  completeActivity: (success: boolean) => void;
}

// Create the activity store
export const useActivityStore = create<ActivityState>((set, get) => ({
  // Initialize state
  availableActivities: [],
  currentActivity: null,
  
  // Generate available activities based on current time
  generateAvailableActivities: () => {
    const gameState = useGameStore.getState();
    const currentTime = gameState.currentTime;
    const currentSeason = gameState.currentSeason;
    
    // This is where we'll eventually integrate with a schedule system
    // For now, we'll generate some basic activities based on time of day
    let activities: ActivityOption[] = [];
    
    // Get hour-appropriate activities
    switch (currentTime.hour) {
      case 8: // 8:00 AM
        activities = [
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
        ];
        break;
        
      case 9: // 9:00 AM
        activities = [
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
        ];
        
        // Only sometimes available at 9:00 AM
        if (currentTime.minute < 30) {
          activities.push({
            id: 'patient_positioning_qa',
            title: 'Patient Positioning QA',
            description: 'Observe Dr. Quinn performing quality assurance for patient positioning systems.',
            location: LocationId.TREATMENT_ROOM_3,
            duration: 60,
            mentor: MentorId.QUINN,
            domains: [KnowledgeDomain.RADIATION_THERAPY, KnowledgeDomain.DOSIMETRY],
            difficulty: ActivityDifficulty.MEDIUM,
          });
        }
        break;
        
      case 12: // 12:00 PM (Lunch)
        activities = [
          {
            id: 'lunch_garcia',
            title: 'Lunch with Dr. Garcia',
            description: 'Join Dr. Garcia for lunch in the cafeteria.',
            location: LocationId.CAFETERIA,
            duration: 60,
            mentor: MentorId.GARCIA,
            domains: [],
            difficulty: ActivityDifficulty.NONE,
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
          },
        ];
        break;
        
      default:
        // For other hours, always provide some basic options
        activities = [
          {
            id: `self_study_${currentTime.hour}`,
            title: 'Self Study',
            description: 'Spend time in the library studying medical physics concepts.',
            location: LocationId.LIBRARY,
            duration: 60,
            domains: [], // Player will choose domain during activity
            difficulty: ActivityDifficulty.NONE,
          },
          {
            id: `chart_review_${currentTime.hour}`,
            title: 'Patient Chart Review',
            description: 'Review patient treatment plans and records at your workstation.',
            location: LocationId.WORKSTATION,
            duration: 60,
            domains: [KnowledgeDomain.TREATMENT_PLANNING],
            difficulty: ActivityDifficulty.EASY,
          },
        ];
        
        // Only add these for afternoon times
        if (currentTime.hour >= 13 && currentTime.hour <= 16) {
          activities.push({
            id: `treatment_observation_${currentTime.hour}`,
            title: 'Treatment Observation',
            description: 'Observe patient treatments and learn about treatment delivery.',
            location: LocationId.TREATMENT_ROOM_1,
            duration: 60,
            domains: [KnowledgeDomain.RADIATION_THERAPY],
            difficulty: ActivityDifficulty.EASY,
          });
        }
    }
    
    // Always add a shorter self-study option if we have fewer than 3 activities
    if (activities.length < 3) {
      activities.push({
        id: `quick_study_${currentTime.hour}_${currentTime.minute}`,
        title: 'Quick Study',
        description: 'Take a brief moment to review notes or concepts.',
        location: LocationId.LIBRARY,
        duration: 60,
        domains: [],
        difficulty: ActivityDifficulty.NONE,
      });
    }
    
    // Filter out activities that won't fit in the day
    const timeManager = gameState.timeManager;
    activities = activities.filter(activity => 
      timeManager.canActivityFitInDay(activity.duration)
    );
    
    // Set the available activities
    set({ availableActivities: activities });
  },
  
  // Select an activity
  selectActivity: (activityId: string) => {
    const activity = get().availableActivities.find(a => a.id === activityId);
    
    if (activity) {
      set({ currentActivity: activity });
      
      // Advance time based on activity duration
      const gameState = useGameStore.getState();
      gameState.advanceTime(activity.duration);
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
    
    // Clear current activity and generate new ones
    set({ currentActivity: null });
    get().generateAvailableActivities();
  },
})); 