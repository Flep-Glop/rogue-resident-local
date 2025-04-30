import { useDialogueStore } from '../store/dialogueStore';

export interface DialogueOption {
  id: string;
  text: string;
  nextNodeId?: string;
  requiredStarId?: string;
  insightChange?: number;
  momentumChange?: number;
  relationshipChange?: number;
  discoversConceptId?: string;
}

export interface DialogueNode {
  id: string;
  mentorId: string;
  text: string;
  options: DialogueOption[];
  isEndNode?: boolean;
}

export interface Dialogue {
  id: string;
  title: string;
  description: string;
  startNodeId: string;
  nodes: Record<string, DialogueNode>;
  domain?: string;
  difficulty: 1 | 2 | 3; // 1-3 stars
}

export interface Mentor {
  id: string;
  name: string;
  title: string;
  specialty: string;
  portrait: string;
  relationship: number; // 0-100
  domains: string[];
}

// Mentor data
export const mentors: Record<string, Mentor> = {
  'garcia': {
    id: 'garcia',
    name: 'Dr. Garcia',
    title: 'Senior Medical Physicist',
    specialty: 'Treatment Planning',
    portrait: '/mentors/garcia.png',
    relationship: 50,
    domains: ['treatment_planning', 'dosimetry']
  },
  'kapoor': {
    id: 'kapoor',
    name: 'Dr. Kapoor',
    title: 'Chief Medical Physicist',
    specialty: 'Radiation Therapy',
    portrait: '/mentors/kapoor.png',
    relationship: 50,
    domains: ['radiation_therapy', 'linac_anatomy']
  }
};

// Example dialogue data
export const dialogues: Record<string, Dialogue> = {
  'intro_treatment_planning': {
    id: 'intro_treatment_planning',
    title: 'Introduction to Treatment Planning',
    description: 'Learn the basics of treatment planning with Dr. Garcia',
    startNodeId: 'tp_intro_1',
    domain: 'treatment_planning',
    difficulty: 1,
    nodes: {
      'tp_intro_1': {
        id: 'tp_intro_1',
        mentorId: 'garcia',
        text: `Welcome to the treatment planning room. Today we'll cover the essential concepts of dose distribution. What would you like to focus on?`,
        options: [
          {
            id: 'tp_1_opt_1',
            text: 'Basic dose calculation principles',
            nextNodeId: 'tp_basic_dose',
            insightChange: 5
          },
          {
            id: 'tp_1_opt_2',
            text: 'Practical cases and examples',
            nextNodeId: 'tp_practical_cases',
            insightChange: 5
          }
        ]
      },
      'tp_basic_dose': {
        id: 'tp_basic_dose',
        mentorId: 'garcia',
        text: `Good choice. Let's start with inverse square law and tissue attenuation. These fundamentals will help you understand how dose is calculated. What question do you have about these concepts?`,
        options: [
          {
            id: 'tp_bd_opt_1',
            text: 'How does inverse square law apply to treatment planning?',
            nextNodeId: 'tp_isl_explanation',
            insightChange: 10,
            momentumChange: 1,
            discoversConceptId: 'inverse_square_law'
          },
          {
            id: 'tp_bd_opt_2',
            text: 'What factors affect tissue attenuation?',
            nextNodeId: 'tp_attenuation_explanation',
            insightChange: 10,
            momentumChange: 1,
            discoversConceptId: 'tissue_attenuation'
          }
        ]
      },
      'tp_isl_explanation': {
        id: 'tp_isl_explanation',
        mentorId: 'garcia',
        text: `Excellent question. The inverse square law tells us that radiation intensity is inversely proportional to the square of the distance from the source. In treatment planning, this means we need to account for how dose changes with depth in the patient. This is one reason why we use multiple beams from different angles - to optimize dose at the target while minimizing dose to surrounding tissues.`,
        options: [
          {
            id: 'tp_isl_opt_1',
            text: `I understand. Let's move on to the next topic.`,
            nextNodeId: 'tp_conclusion',
            insightChange: 5,
            momentumChange: 1,
            relationshipChange: 3
          }
        ]
      },
      'tp_attenuation_explanation': {
        id: 'tp_attenuation_explanation',
        mentorId: 'garcia',
        text: `Good question. Tissue attenuation is affected by several factors: atomic number, density, and thickness of the tissue. Different tissues attenuate radiation differently - bone attenuates more than soft tissue due to its higher density and atomic number. This is why we need CT imaging for treatment planning - to get accurate tissue densities for our dose calculations.`,
        options: [
          {
            id: 'tp_att_opt_1',
            text: 'I see. How do we account for these differences?',
            nextNodeId: 'tp_conclusion',
            insightChange: 5,
            momentumChange: 1,
            relationshipChange: 3
          }
        ]
      },
      'tp_practical_cases': {
        id: 'tp_practical_cases',
        mentorId: 'garcia',
        text: `Let's look at this head and neck case. Notice how we've arranged the beam angles to avoid critical structures. What do you think is the most important consideration for this case?`,
        options: [
          {
            id: 'tp_pc_opt_1',
            text: 'Sparing the parotid glands while maintaining target coverage',
            nextNodeId: 'tp_parotid_explanation',
            insightChange: 10,
            momentumChange: 1,
            discoversConceptId: 'organ_at_risk'
          },
          {
            id: 'tp_pc_opt_2',
            text: 'Ensuring dose homogeneity in the primary tumor volume',
            nextNodeId: 'tp_homogeneity_explanation',
            insightChange: 10,
            momentumChange: 1,
            discoversConceptId: 'dose_homogeneity'
          }
        ]
      },
      'tp_parotid_explanation': {
        id: 'tp_parotid_explanation',
        mentorId: 'garcia',
        text: `Exactly right. Parotid glands are critical organs at risk in head and neck treatments. Excessive radiation can lead to xerostomia (dry mouth), significantly impacting the patient's quality of life. We use specific beam arrangements and sometimes IMRT to create a dose distribution that wraps around these structures.`,
        options: [
          {
            id: 'tp_par_opt_1',
            text: 'I understand the importance of organ sparing.',
            nextNodeId: 'tp_conclusion',
            insightChange: 5,
            momentumChange: 1,
            relationshipChange: 5
          }
        ]
      },
      'tp_homogeneity_explanation': {
        id: 'tp_homogeneity_explanation',
        mentorId: 'garcia',
        text: `Good thinking. Dose homogeneity in the target volume is important, but with head and neck cases, we often prioritize organ sparing over perfect homogeneity. Sometimes we accept slightly less homogeneous dose to the target if it means significant sparing of critical structures.`,
        options: [
          {
            id: 'tp_hom_opt_1',
            text: `That makes sense. It's about clinical priorities.`,
            nextNodeId: 'tp_conclusion',
            insightChange: 5,
            momentumChange: 1,
            relationshipChange: 2
          }
        ]
      },
      'tp_conclusion': {
        id: 'tp_conclusion',
        mentorId: 'garcia',
        text: `You're making good progress. Treatment planning is as much art as science - balancing technical requirements with clinical goals. Continue studying these concepts, and we'll go deeper in our next session.`,
        options: [
          {
            id: 'tp_conc_opt_1',
            text: 'Thank you for your guidance, Dr. Garcia.',
            isEndNode: true,
            relationshipChange: 2
          }
        ]
      }
    }
  },
  'linac_overview': {
    id: 'linac_overview',
    title: 'Linear Accelerator Components',
    description: 'Learn about the key components of a linear accelerator with Dr. Kapoor',
    startNodeId: 'linac_intro_1',
    domain: 'linac_anatomy',
    difficulty: 1,
    nodes: {
      'linac_intro_1': {
        id: 'linac_intro_1',
        mentorId: 'kapoor',
        text: `Welcome to the equipment room. Today we'll examine the linear accelerator components. What specific aspect would you like to explore?`,
        options: [
          {
            id: 'linac_opt_1',
            text: 'Electron gun and acceleration structure',
            nextNodeId: 'linac_electron_gun',
            insightChange: 5
          },
          {
            id: 'linac_opt_2',
            text: 'Bending magnet and beam collimation',
            nextNodeId: 'linac_bending_magnet',
            insightChange: 5
          }
        ]
      },
      'linac_electron_gun': {
        id: 'linac_electron_gun',
        mentorId: 'kapoor',
        text: `Let's start with the electron gun. This is where the electrons are generated before being accelerated. The gun contains a cathode that emits electrons when heated. These electrons are then injected into the acceleration waveguide. What would you like to know about this process?`,
        options: [
          {
            id: 'linac_eg_opt_1',
            text: 'How does the waveguide accelerate the electrons?',
            nextNodeId: 'linac_waveguide_explanation',
            insightChange: 10,
            momentumChange: 1,
            discoversConceptId: 'waveguide_acceleration'
          },
          {
            id: 'linac_eg_opt_2',
            text: 'What energy levels are typically achieved?',
            nextNodeId: 'linac_energy_explanation',
            insightChange: 10,
            momentumChange: 1,
            discoversConceptId: 'electron_energy_spectrum'
          }
        ]
      },
      'linac_waveguide_explanation': {
        id: 'linac_waveguide_explanation',
        mentorId: 'kapoor',
        text: `The waveguide uses microwave energy (typically from a klystron or magnetron) to create electromagnetic fields. These fields accelerate the electrons to near light speed. The waveguide has a series of cavities designed so that as electrons pass through, they experience an accelerating electric field, gaining energy with each cavity they traverse.`,
        options: [
          {
            id: 'linac_wg_opt_1',
            text: `That makes sense. Let's continue.`,
            nextNodeId: 'linac_conclusion',
            insightChange: 5,
            momentumChange: 1,
            relationshipChange: 3
          }
        ]
      },
      'linac_energy_explanation': {
        id: 'linac_energy_explanation',
        mentorId: 'kapoor',
        text: `Clinical linacs typically operate at energies between 4-25 MeV for photon beams. For electron beams, we generally use energies between 4-22 MeV. The specific energy used depends on the treatment requirements - higher energies penetrate deeper into tissue, which is useful for deep-seated tumors.`,
        options: [
          {
            id: 'linac_en_opt_1',
            text: 'How do you select the appropriate energy for treatment?',
            nextNodeId: 'linac_conclusion',
            insightChange: 5,
            momentumChange: 1,
            relationshipChange: 3
          }
        ]
      },
      'linac_bending_magnet': {
        id: 'linac_bending_magnet',
        mentorId: 'kapoor',
        text: `The bending magnet changes the direction of the electron beam, typically by 270 degrees, to direct it toward the target. This bend serves two purposes: it allows for a more compact design and acts as an energy filter. What aspect of beam collimation interests you?`,
        options: [
          {
            id: 'linac_bm_opt_1',
            text: 'How do the primary and secondary collimators work?',
            nextNodeId: 'linac_collimator_explanation',
            insightChange: 10,
            momentumChange: 1,
            discoversConceptId: 'beam_collimation'
          },
          {
            id: 'linac_bm_opt_2',
            text: 'What is the role of the multi-leaf collimator (MLC)?',
            nextNodeId: 'linac_mlc_explanation',
            insightChange: 10,
            momentumChange: 1,
            discoversConceptId: 'multi_leaf_collimator'
          }
        ]
      },
      'linac_collimator_explanation': {
        id: 'linac_collimator_explanation',
        mentorId: 'kapoor',
        text: `Primary collimators are fixed and define the maximum field size. They're usually made of high-density material like tungsten. Secondary collimators are adjustable jaws that can create rectangular fields of various sizes. They move independently to shape the beam according to treatment needs.`,
        options: [
          {
            id: 'linac_col_opt_1',
            text: 'I understand their functions now.',
            nextNodeId: 'linac_conclusion',
            insightChange: 5,
            momentumChange: 1,
            relationshipChange: 3
          }
        ]
      },
      'linac_mlc_explanation': {
        id: 'linac_mlc_explanation',
        mentorId: 'kapoor',
        text: `The MLC consists of many thin, individually movable leaves (typically 40-120) that can create complex field shapes. This is essential for techniques like IMRT and VMAT where we need to conform the dose closely to irregularly shaped targets. Each leaf can move independently, allowing for highly customized field shaping.`,
        options: [
          {
            id: 'linac_mlc_opt_1',
            text: `That's fascinating technology.`,
            nextNodeId: 'linac_conclusion',
            insightChange: 5,
            momentumChange: 1,
            relationshipChange: 4
          }
        ]
      },
      'linac_conclusion': {
        id: 'linac_conclusion',
        mentorId: 'kapoor',
        text: `You're developing a good understanding of linac components. Remember that understanding the equipment is crucial for quality assurance and troubleshooting. We'll explore more detailed aspects in future sessions.`,
        options: [
          {
            id: 'linac_conc_opt_1',
            text: 'Thank you, Dr. Kapoor. This was very informative.',
            isEndNode: true,
            relationshipChange: 2
          }
        ]
      }
    }
  }
};

// Initialize the dialogue store with mentor and dialogue data
export const initializeDialogueStore = () => {
  const dialogueStore = useDialogueStore.getState();
  
  // Add mentors
  Object.values(mentors).forEach(mentor => {
    dialogueStore.addMentor(mentor);
  });
  
  // Add dialogues
  Object.values(dialogues).forEach(dialogue => {
    dialogueStore.addDialogue(dialogue);
  });
}; 