// Room Progression System - Unlocks advanced content based on competency
export interface RoomProgression {
  roomId: string;
  visitCount: number;
  competencyLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  unlockedFeatures: string[];
  availableScenarios: RoomScenario[];
}

export interface RoomScenario {
  id: string;
  title: string;
  description: string;
  requiredCompetency: string;
  estimatedDuration: number;
  rewardsOffered: {
    starPoints: number;
    insights: number;
    newConcepts: string[];
  };
}

export const roomProgressions: Record<string, RoomProgression> = {
  'dosimetry-lab': {
    roomId: 'dosimetry-lab',
    visitCount: 0,
    competencyLevel: 'beginner',
    unlockedFeatures: ['basic-calibration'],
    availableScenarios: [
      {
        id: 'ion-chamber-basics',
        title: 'Ion Chamber Fundamentals',
        description: 'Master the basics of ion chamber theory and practical setup',
        requiredCompetency: 'beginner',
        estimatedDuration: 15,
        rewardsOffered: {
          starPoints: 10,
          insights: 5,
          newConcepts: ['ion_chamber_theory', 'electrometer_basics']
        }
      },
      {
        id: 'tg51-protocol',
        title: 'TG-51 Calibration Protocol',
        description: 'Implement AAPM TG-51 calibration procedures step-by-step',
        requiredCompetency: 'intermediate',
        estimatedDuration: 25,
        rewardsOffered: {
          starPoints: 20,
          insights: 15,
          newConcepts: ['tg51_protocol', 'reference_dosimetry', 'beam_quality_factors']
        }
      },
      {
        id: 'advanced-dosimetry',
        title: 'Small Field Dosimetry Challenge',
        description: 'Navigate the complexities of small field and IMRT dosimetry',
        requiredCompetency: 'advanced',
        estimatedDuration: 30,
        rewardsOffered: {
          starPoints: 35,
          insights: 25,
          newConcepts: ['small_field_dosimetry', 'detector_selection', 'monte_carlo_validation']
        }
      }
    ]
  },

  'linac-1': {
    roomId: 'linac-1',
    visitCount: 0,
    competencyLevel: 'beginner',
    unlockedFeatures: ['patient-setup'],
    availableScenarios: [
      {
        id: 'first-patient-setup',
        title: 'Patient Setup Fundamentals',
        description: 'Learn proper patient positioning and immobilization techniques',
        requiredCompetency: 'beginner',
        estimatedDuration: 20,
        rewardsOffered: {
          starPoints: 12,
          insights: 8,
          newConcepts: ['patient_positioning', 'immobilization_devices', 'setup_verification']
        }
      },
      {
        id: 'igrt-workflow',
        title: 'Image-Guided Radiation Therapy',
        description: 'Master CBCT imaging and adaptive positioning workflows',
        requiredCompetency: 'intermediate', 
        estimatedDuration: 25,
        rewardsOffered: {
          starPoints: 25,
          insights: 18,
          newConcepts: ['igrt_concepts', 'cbct_analysis', 'positioning_corrections']
        }
      },
      {
        id: 'emergency-procedures',
        title: 'Emergency Response Scenarios',
        description: 'Handle equipment failures and patient emergencies',
        requiredCompetency: 'advanced',
        estimatedDuration: 20,
        rewardsOffered: {
          starPoints: 30,
          insights: 20,
          newConcepts: ['emergency_protocols', 'radiation_safety', 'patient_care']
        }
      }
    ]
  },

  'physics-office': {
    roomId: 'physics-office',
    visitCount: 0,
    competencyLevel: 'beginner',
    unlockedFeatures: ['basic-planning'],
    availableScenarios: [
      {
        id: 'treatment-planning-intro',
        title: 'Treatment Planning Fundamentals',
        description: 'Create your first treatment plan with guidance',
        requiredCompetency: 'beginner',
        estimatedDuration: 30,
        rewardsOffered: {
          starPoints: 15,
          insights: 12,
          newConcepts: ['target_volumes', 'dose_constraints', 'plan_evaluation']
        }
      },
      {
        id: 'imrt-optimization',
        title: 'IMRT Plan Optimization',
        description: 'Balance competing objectives in intensity-modulated plans',
        requiredCompetency: 'intermediate',
        estimatedDuration: 35,
        rewardsOffered: {
          starPoints: 30,
          insights: 22,
          newConcepts: ['imrt_concepts', 'inverse_planning', 'optimization_algorithms']
        }
      },
      {
        id: 'adaptive-therapy',
        title: 'Adaptive Radiation Therapy',
        description: 'Navigate plan adaptation for anatomical changes',
        requiredCompetency: 'advanced',
        estimatedDuration: 40,
        rewardsOffered: {
          starPoints: 40,
          insights: 30,
          newConcepts: ['adaptive_rt', 'replanning_strategies', 'dose_accumulation']
        }
      }
    ]
  },

  'simulation-suite': {
    roomId: 'simulation-suite',
    visitCount: 0,
    competencyLevel: 'beginner',
    unlockedFeatures: ['equipment-overview'],
    availableScenarios: [
      {
        id: 'linac-components',
        title: 'LINAC Component Deep Dive',
        description: 'Explore linear accelerator subsystems in detail',
        requiredCompetency: 'beginner',
        estimatedDuration: 25,
        rewardsOffered: {
          starPoints: 18,
          insights: 10,
          newConcepts: ['electron_gun', 'waveguide_structure', 'bending_magnet']
        }
      },
      {
        id: 'qa-procedures',
        title: 'Machine QA Implementation',
        description: 'Perform comprehensive linear accelerator quality assurance',
        requiredCompetency: 'intermediate',
        estimatedDuration: 30,
        rewardsOffered: {
          starPoints: 25,
          insights: 20,
          newConcepts: ['machine_qa', 'tg142_protocols', 'qa_trending']
        }
      },
      {
        id: 'commissioning-challenge',
        title: 'New Equipment Commissioning',
        description: 'Commission a new LINAC from acceptance to clinical use',
        requiredCompetency: 'expert',
        estimatedDuration: 45,
        rewardsOffered: {
          starPoints: 50,
          insights: 35,
          newConcepts: ['commissioning_process', 'beam_modeling', 'acceptance_testing']
        }
      }
    ]
  }
};

// Progression Management Functions
export class RoomProgressionManager {
  static getAvailableScenarios(roomId: string, playerCompetency: string): RoomScenario[] {
    const progression = roomProgressions[roomId];
    if (!progression) return [];
    
    return progression.availableScenarios.filter(scenario => 
      this.isScenarioUnlocked(scenario, playerCompetency, progression.visitCount)
    );
  }

  static isScenarioUnlocked(scenario: RoomScenario, playerCompetency: string, visitCount: number): boolean {
    const competencyLevels = ['beginner', 'intermediate', 'advanced', 'expert'];
    const playerLevel = competencyLevels.indexOf(playerCompetency);
    const requiredLevel = competencyLevels.indexOf(scenario.requiredCompetency);
    
    return playerLevel >= requiredLevel;
  }

  static updateRoomProgression(roomId: string, completedScenarioId: string): void {
    const progression = roomProgressions[roomId];
    if (!progression) return;

    progression.visitCount += 1;
    
    // Update competency based on completed scenarios
    const completedScenario = progression.availableScenarios.find(s => s.id === completedScenarioId);
    if (completedScenario) {
      // Logic to advance competency level based on performance
      this.evaluateCompetencyAdvancement(progression, completedScenario);
    }
  }

  private static evaluateCompetencyAdvancement(progression: RoomProgression, scenario: RoomScenario): void {
    const competencyLevels = ['beginner', 'intermediate', 'advanced', 'expert'];
    const currentIndex = competencyLevels.indexOf(progression.competencyLevel);
    const scenarioIndex = competencyLevels.indexOf(scenario.requiredCompetency);
    
    // Advance if player successfully completes scenarios at their current level
    if (scenarioIndex >= currentIndex && currentIndex < competencyLevels.length - 1) {
      progression.competencyLevel = competencyLevels[currentIndex + 1] as any;
      console.log(`🎉 Competency advanced to ${progression.competencyLevel} in ${progression.roomId}!`);
    }
  }
} 