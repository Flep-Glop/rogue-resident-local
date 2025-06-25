import { Day1Scene, Day1SceneId } from '@/app/types/day1';

export const day1Scenes: Record<Day1SceneId, Day1Scene> = {
  // Consolidated Prologue Scene
  [Day1SceneId.PROLOGUE_INTRO]: {
    id: Day1SceneId.PROLOGUE_INTRO,
    title: "Welcome to Memorial General",
    location: "Memorial General Hospital",
    timeAdvance: 0, // No time advance for prologue
    background: "linear-gradient(to bottom, #121620, #090b12)",
    dialogueId: 'prologue_complete_conversation', // Single comprehensive dialogue
    hasTypewriter: true,
    hasChoices: true,
    nextScene: Day1SceneId.ARRIVAL, // Skip directly to Day 1
    onEnter: () => {
      console.log('Starting comprehensive prologue conversation...');
    },
    onExit: () => {
      console.log('Prologue complete! Starting Day 1...');
    }
  },

  // Remove separate prologue scenes - they're now handled in the single dialogue
  // [Day1SceneId.PROLOGUE_NAME_INPUT] - REMOVED
  // [Day1SceneId.PROLOGUE_BACKGROUND] - REMOVED  
  // [Day1SceneId.PROLOGUE_MENTORS] - REMOVED
  // [Day1SceneId.PROLOGUE_QUESTIONS] - REMOVED
  // [Day1SceneId.PROLOGUE_COMPLETE] - REMOVED

  [Day1SceneId.ARRIVAL]: {
    id: Day1SceneId.ARRIVAL,
    title: "Hospital Entrance",
    location: "Northwestern Memorial Hospital",
    timeAdvance: 5, // 5 minutes
    background: "linear-gradient(135deg, #4A90E2 0%, #7BB3E8 100%)", // Blue morning gradient
    dialogueId: 'day1_arrival',
    hasTypewriter: true,
    hasChoices: true,
    nextScene: Day1SceneId.BRIEF_TOUR,
    onEnter: () => {
      console.log('Day 1 begins - Welcome to the hospital!');
    }
  },
  
  [Day1SceneId.BRIEF_TOUR]: {
    id: Day1SceneId.BRIEF_TOUR,
    title: "Hospital Main Corridor",  
    location: "Hospital Main Corridor",
    timeAdvance: 5, // 5 minutes
    background: "linear-gradient(135deg, #4A90E2 0%, #7BB3E8 100%)", // Same gradient
    dialogueId: 'day1_tour',
    hasTypewriter: true,
    hasChoices: true,
    nextScene: Day1SceneId.FIRST_PATIENT,
  },
  
  [Day1SceneId.FIRST_PATIENT]: {
    id: Day1SceneId.FIRST_PATIENT,
    title: "LINAC Room 1",
    location: "LINAC Room 1", 
    timeAdvance: 15, // 15 minutes
    background: "linear-gradient(135deg, #10B981 0%, #34D399 100%)", // Clinical green
    dialogueId: 'day1_first_patient',
    hasTypewriter: true,
    hasChoices: true,
    activityConfig: {
      questionCount: 3,
      difficulty: 'easy',
      domains: ['RADIATION_THERAPY']
    },
    introducesUI: ['momentum'],
    particleEffect: 'momentum',
    nextScene: Day1SceneId.MEETING_JESSE,
  },
  
  [Day1SceneId.MEETING_JESSE]: {
    id: Day1SceneId.MEETING_JESSE,
    title: "LINAC Maintenance Area",
    location: "LINAC Maintenance Area",
    timeAdvance: 10, // 10 minutes  
    background: "linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%)", // Amber/mechanical
    dialogueId: 'day1_jesse_meeting',
    hasTypewriter: true,
    hasChoices: true,
    nextScene: Day1SceneId.MEETING_KAPOOR,
  },
  
  [Day1SceneId.MEETING_KAPOOR]: {
    id: Day1SceneId.MEETING_KAPOOR,
    title: "Dosimetry Lab",
    location: "Dosimetry Lab",
    timeAdvance: 15, // 15 minutes
    background: "linear-gradient(135deg, #EC4899 0%, #F472B6 100%)", // Pink gradient
    dialogueId: 'day1_kapoor_meeting',
    hasTypewriter: true,
    hasChoices: true,
    activityConfig: {
      questionCount: 2,
      difficulty: 'easy', 
      domains: ['DOSIMETRY']
    },
    introducesUI: ['insight'],
    particleEffect: 'insight',
    nextScene: Day1SceneId.QUINN_INTRODUCTION,
  },
  
  [Day1SceneId.QUINN_INTRODUCTION]: {
    id: Day1SceneId.QUINN_INTRODUCTION,
    title: "Hospital Cafeteria",
    location: "Hospital Cafeteria",
    timeAdvance: 20, // 20 minutes - brings us to 12:30pm
    background: "linear-gradient(135deg, #F97316 0%, #FB923C 100%)", // Warm orange
    dialogueId: 'day1_quinn_intro',
    hasTypewriter: true,
    hasChoices: true,
    introducesUI: ['journal'],
    nextScene: Day1SceneId.AFTERNOON_WITH_QUINN,
    requirements: {
      playerNamed: true
    },
    onEnter: () => {
      console.log('Time for lunch and meeting Dr. Quinn!');
    }
  },
  
  [Day1SceneId.AFTERNOON_WITH_QUINN]: {
    id: Day1SceneId.AFTERNOON_WITH_QUINN,
    title: "Treatment Planning Room",
    location: "Treatment Planning Room", 
    timeAdvance: 20, // 20 minutes - brings us to ~2:50pm
    background: "linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%)", // Blue/tech gradient
    dialogueId: 'day1_afternoon_quinn',
    activityConfig: {
      questionCount: 4,
      difficulty: 'medium',
      domains: ['TREATMENT_PLANNING', 'DOSIMETRY']
    },
    nextScene: Day1SceneId.HILL_HOUSE_ARRIVAL,
    requirements: {
      journalReceived: true
    }
  },
  
  [Day1SceneId.HILL_HOUSE_ARRIVAL]: {
    id: Day1SceneId.HILL_HOUSE_ARRIVAL,
    title: "Hill House",
    location: "Hill House - Your Residence",
    timeAdvance: 240, // 4 hours - jump to 6:30pm
    background: "linear-gradient(135deg, #7C3AED 0%, #A855F7 100%)", // Purple evening
    dialogueId: 'day1_hill_house',
    nextScene: Day1SceneId.FIRST_NIGHT,
    onEnter: () => {
      console.log('First day complete - time to explore your new home!');
    }
  },
  
  [Day1SceneId.FIRST_NIGHT]: {
    id: Day1SceneId.FIRST_NIGHT,
    title: "Hill House Interior",
    location: "Hill House Interior",
    timeAdvance: 0, // No time advance - night activities
    background: "linear-gradient(135deg, #1E1B4B 0%, #312E81 100%)", // Dark purple/navy
    dialogueId: 'day1_night_exploration',
    onEnter: () => {
      console.log('Time to explore the house and discover the journal secrets...');
    },
    onExit: () => {
      console.log('Day 1 complete! Transitioning to night phase...');
      // Could trigger transition to regular night phase here
    }
  }
}; 