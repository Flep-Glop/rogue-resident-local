import { Dialogue } from '@/app/data/dialogueData';
import { DialogueMode } from '@/app/types';

/**
 * Tutorial-specific dialogues that advance tutorial progression
 * These are used when tutorial mode is active and replace standard room dialogues
 */
export const tutorialDialogues: Record<string, Dialogue> = {

  // FIRST DAY TUTORIAL SEQUENCE

  /**
   * Morning Arrival - Physics Office (Dr. Garcia)
   * Authentic mentorship conversation with natural activity integration
   */
  'tutorial_physics_office_intro': {
    id: 'tutorial_physics_office_intro',
    title: 'Welcome to Medical Physics',
    description: 'First day at the hospital with Dr. Garcia',
    startNodeId: 'garcia_welcome',
    domain: 'radiation_therapy',
    difficulty: 1,
    mode: DialogueMode.NARRATIVE,
    isTutorial: true,
    nodes: {
      'garcia_welcome': {
        id: 'garcia_welcome',
        mentorId: 'garcia',
        text: `You must be our new resident! I'm Dr. Garcia - grab some coffee if you need it.`,
        options: [
          {
            id: 'excited_to_help',
            text: 'Thank you.',
            nextNodeId: 'garcia_start_activity',
            relationshipChange: 2,
            tutorialStepCompletion: 'first_mentor_intro'
          },
          {
            id: 'grab_two_coffee',
            text: 'I\'ll grab two.',
            nextNodeId: 'garcia_start_activity',
            relationshipChange: 3,
            tutorialStepCompletion: 'first_mentor_intro'
          }
        ]
      },
      'garcia_start_activity': {
        id: 'garcia_start_activity',
        mentorId: 'garcia',
        text: `Let's work through a case together. Ready when you are.`,
        options: [
          {
            id: 'begin_activity',
            text: 'Let\'s do this.',
            nextNodeId: 'garcia_activity_reflection',
            tutorialStepCompletion: 'first_educational_activity',
            triggersActivity: true
          }
        ]
      },

      'garcia_activity_reflection': {
        id: 'garcia_activity_reflection',
        mentorId: 'garcia',
        text: `Nice work! How did that feel?`,
        options: [
          {
            id: 'felt_more_focused',
            text: 'Engaging!',
            nextNodeId: 'garcia_validation',
            relationshipChange: 4,
            insightChange: 5
          },
          {
            id: 'learned_a_lot',
            text: 'Confusing...',
            nextNodeId: 'garcia_encouragement',
            relationshipChange: 2,
            insightChange: 3
          }
        ]
      },
      'garcia_validation': {
        id: 'garcia_validation',
        mentorId: 'garcia',
        text: `You should meet the rest of our team - grab lunch and see who's around.`,
        options: [
          {
            id: 'meet_the_team',
            text: 'Thanks.',
            isEndNode: true,
            relationshipChange: 3,
            insightChange: 3
          }
        ]
      },
      'garcia_encouragement': {
        id: 'garcia_encouragement',
        mentorId: 'garcia',
        text: `That is very understandable, with time you'll find what works for you. Go grab lunch and see who's around.`,
        options: [
          {
            id: 'explore_different_styles',
            text: 'Thanks.',
            isEndNode: true,
            relationshipChange: 3,
            insightChange: 2
          }
        ]
      }
    }
  },

  /**
   * Multi-Character Lunch Scene - Condensed Team Dynamics
   * Streamlined lunch scene preserving character personalities and key story beats
   */
  'tutorial_lunch_dialogue': {
    id: 'tutorial_lunch_dialogue',
    title: 'Cafeteria - Team Dynamics',
    description: 'Condensed lunch scene with authentic colleague relationships',
    startNodeId: 'cafeteria_scene_opening',
    domain: 'general',
    difficulty: 1,
    mode: DialogueMode.NARRATIVE,
    isTutorial: true,
    nodes: {
      'cafeteria_scene_opening': {
        id: 'cafeteria_scene_opening',
        mentorId: 'jesse',
        text: `"Equipment has personality, I'm telling you."`,
        options: [
          {
            id: 'approach_group',
            text: 'Mind if I join?',
            nextNodeId: 'team_introductions'
          }
        ]
      },
      'team_introductions': {
        id: 'team_introductions',
        mentorId: 'kapoor',
        text: `"I'm Dr. Kapoor, dosimetry. You must be our new resident."`,
        options: [
          {
            id: 'nice_to_meet_both',
            text: 'Nice to meet you.',
            nextNodeId: 'quinn_arrives',
            relationshipChange: 2
          }
        ]
      },
      'quinn_arrives': {
        id: 'quinn_arrives',
        mentorId: 'quinn',
        text: `"Alex Quinn, treatment planning. How's your first day going?"`,
        options: [
          {
            id: 'going_well',
            text: 'Learning a lot.',
            nextNodeId: 'quinn_time_pressure',
            relationshipChange: 2,
            tutorialStepCompletion: 'second_mentor_intro'
          }
        ]
      },
      'quinn_time_pressure': {
        id: 'quinn_time_pressure',
        mentorId: 'quinn',
        text: `"Swing by my office around 4:30? I have something for you."`,
        options: [
          {
            id: 'accept_invitation',
            text: 'Sure thing.',
            nextNodeId: 'afternoon_choice_moment',
            relationshipChange: 2
          }
        ]
      },
      'afternoon_choice_moment': {
        id: 'afternoon_choice_moment',
        mentorId: 'jesse',
        text: `"Want to see some troubleshooting or measurement work this afternoon?"`,
        options: [
          {
            id: 'choose_jesse_equipment',
            text: 'Troubleshooting sounds good.',
            isEndNode: true,
            relationshipChange: 3
          },
          {
            id: 'choose_kapoor_precision',
            text: 'I\'d like to see the measurement work.',
            isEndNode: true,
            relationshipChange: 3
          }
        ]
      }
    }
  },

  /**
   * Meeting Dr. Kapoor - Dosimetry Lab
   * The scientific skeptic emphasizes professional standards and measurement precision
   */
  'tutorial_dosimetry_lab_intro': {
    id: 'tutorial_dosimetry_lab_intro',
    title: 'Standards and Precision',
    description: 'Professional conversation with Dr. Kapoor about measurement science',
    startNodeId: 'kapoor_introduction',
    domain: 'dosimetry',
    difficulty: 1,
    mode: DialogueMode.NARRATIVE,
    isTutorial: true,
    nodes: {
      'kapoor_introduction': {
        id: 'kapoor_introduction',
        mentorId: 'kapoor',
        text: `I'm Dr. Kapoor, dosimetry and measurement science. Precision is everything here.`,
        options: [
          {
            id: 'interested_in_approach',
            text: 'I\'d like to learn about measurement science.',
            nextNodeId: 'kapoor_practical_conclusion',
            relationshipChange: 3,
            insightChange: 2,
            tutorialStepCompletion: 'third_mentor_intro'
          }
        ]
      },
      'kapoor_professional_standards': {
        id: 'kapoor_professional_standards',
        mentorId: 'kapoor',
        text: `I focus on what can be measured, verified, and reproduced. Garcia speaks of intuition, Quinn of patterns and connections. These have their place, but in dosimetry, we deal with concrete realities. Patient safety depends on our measurements being exact.`,
        options: [
          {
            id: 'appreciate_concrete_focus',
            text: 'I appreciate the focus on concrete, measurable outcomes.',
            nextNodeId: 'kapoor_measurement_philosophy',
            relationshipChange: 4,
            insightChange: 3
          },
          {
            id: 'ask_about_balance',
            text: 'How do you balance measurement precision with other approaches?',
            nextNodeId: 'kapoor_professional_concerns',
            insightChange: 4
          }
        ]
      },
      'kapoor_measurement_reality': {
        id: 'kapoor_measurement_reality',
        mentorId: 'kapoor',
        text: `Precisely. When we calibrate ion chambers, when we verify dose calculations, when we perform quality assurance - these are not abstract concepts. These measurements determine whether treatments succeed or fail. There is no room for wishful thinking.`,
        options: [
          {
            id: 'understand_responsibility',
            text: 'I understand the enormous responsibility involved.',
            nextNodeId: 'kapoor_measurement_philosophy',
            relationshipChange: 3,
            tutorialStepCompletion: 'third_mentor_intro'
          },
          {
            id: 'ask_about_verification',
            text: 'How do you ensure your measurements are always accurate?',
            nextNodeId: 'kapoor_methods_overview',
            insightChange: 4
          }
        ]
      },
      'kapoor_professional_concerns': {
        id: 'kapoor_professional_concerns',
        mentorId: 'kapoor',
        text: `A fair question. Garcia's empathy guides patient care, Quinn's analysis drives innovation. Both valuable. But someone must maintain standards, ensure protocols are followed. Too much... enthusiasm for novel approaches can compromise patient safety.`,
        options: [
          {
            id: 'value_maintaining_standards',
            text: 'Standards and protocols protect patients. I respect that.',
            nextNodeId: 'kapoor_measurement_philosophy',
            relationshipChange: 4,
            tutorialStepCompletion: 'third_mentor_intro'
          },
          {
            id: 'ask_about_concerns',
            text: 'What concerns you about novel approaches?',
            nextNodeId: 'kapoor_cautionary_wisdom',
            insightChange: 3
          }
        ]
      },
      'kapoor_cautionary_wisdom': {
        id: 'kapoor_cautionary_wisdom',
        mentorId: 'kapoor',
        text: `Over the years, I have seen residents become... overly focused on theoretical pursuits at the expense of practical competence. Measurement science keeps us grounded. What matters is not how elegant your theories are, but whether your patients receive the correct dose.`,
        options: [
          {
            id: 'balance_theory_practice',
            text: 'Balancing theory with practical competence makes sense.',
            nextNodeId: 'kapoor_measurement_philosophy',
            relationshipChange: 3,
            tutorialStepCompletion: 'third_mentor_intro'
          }
        ]
      },
      'kapoor_measurement_philosophy': {
        id: 'kapoor_measurement_philosophy',
        mentorId: 'kapoor',
        text: `In measurement science, uncertainty becomes certainty through rigorous methodology. TG-51 protocols, NIST-traceable standards, comprehensive quality assurance. Each measurement we make is a commitment to our patients. This foundation supports all other learning.`,
        options: [
          {
            id: 'foundation_for_learning',
            text: 'A solid measurement foundation supports everything else.',
            nextNodeId: 'kapoor_practical_conclusion',
            relationshipChange: 4,
            insightChange: 5
          },
          {
            id: 'ask_about_methods',
            text: 'Could you tell me more about these measurement methods?',
            nextNodeId: 'kapoor_methods_overview',
            insightChange: 4
          }
        ]
      },
      'kapoor_methods_overview': {
        id: 'kapoor_methods_overview',
        mentorId: 'kapoor',
        text: `Each method has been validated through decades of research and clinical experience. Ion chamber calibrations follow established protocols. Temperature and pressure corrections ensure accuracy. Every step is documented, every result verified. This is how we ensure patient safety.`,
        options: [
          {
            id: 'impressed_by_thoroughness',
            text: 'The thoroughness of these procedures is impressive.',
            nextNodeId: 'kapoor_practical_conclusion',
            relationshipChange: 3,
            insightChange: 5,
            tutorialStepCompletion: 'third_mentor_intro'
          }
        ]
      },
      'kapoor_practical_conclusion': {
        id: 'kapoor_practical_conclusion',
        mentorId: 'kapoor',
        text: `Maintain your grounding in measurement science. It will serve you well.`,
        options: [
          {
            id: 'grateful_for_perspective',
            text: 'Thanks, Dr. Kapoor.',
            isEndNode: true,
            relationshipChange: 4,
            insightChange: 3
          }
        ]
      }
    }
  },

  /**
   * Jesse Shadow Experience - Equipment Path
   * Hands-on troubleshooting with authentic equipment personalities
   */
  'tutorial_jesse_equipment_path': {
    id: 'tutorial_jesse_equipment_path',
    title: 'Equipment Troubleshooting with Jesse',
    description: 'Hands-on afternoon learning about equipment behavior and practical problem-solving',
    startNodeId: 'jesse_equipment_intro',
    domain: 'linac_anatomy',
    difficulty: 1,
    mode: DialogueMode.NARRATIVE,
    isTutorial: true,
    nodes: {
      'jesse_equipment_intro': {
        id: 'jesse_equipment_intro',
        mentorId: 'jesse',
        text: `"Let's see what the machine's telling us today."`,
        options: [
          {
            id: 'begin_troubleshooting',
            text: 'What should I look for?',
            nextNodeId: 'jesse_activity_complete',
            triggersActivity: true,
            tutorialStepCompletion: 'insight_mechanic_intro'
          }
        ]
      },
      'jesse_activity_complete': {
        id: 'jesse_activity_complete',
        mentorId: 'jesse',
        text: `"Nice work! You've got good instincts. Head to Quinn's office when you're ready - she mentioned wanting to see you before the day ends."`,
        options: [
          {
            id: 'thanks_for_practical_side',
            text: 'Thanks, Jesse.',
            isEndNode: true,
            relationshipChange: 3,
            insightChange: 4,
            tutorialStepCompletion: 'constellation_preview'
          }
        ]
      }
    }
  },

  /**
   * Quinn's Office - Journal Introduction & Tutorial Systems
   * Enhanced tutorial version with insight system explanation and ability card introduction
   */
  'tutorial_quinn_office_journal': {
    id: 'tutorial_quinn_office_journal',
    title: 'Quinn\'s Office - End of Day Tutorial',
    description: 'Dr. Quinn explains the insight system, gives journal, and introduces ability cards',
    startNodeId: 'quinn_office_opening',
    domain: 'treatment_planning',
    difficulty: 1,
    mode: DialogueMode.NARRATIVE,
    isTutorial: true,
    nodes: {
      'quinn_office_opening': {
        id: 'quinn_office_opening',
        mentorId: 'quinn',
        text: `"How was your afternoon? I have something for you."`,
        options: [
          {
            id: 'different_approaches_valuable',
            text: 'Good. What is it?',
            nextNodeId: 'quinn_ability_card_demo',
            relationshipChange: 2,
            tutorialStepCompletion: 'quinn_office_meeting'
          }
        ]
      },
      'quinn_insight_explanation': {
        id: 'quinn_insight_explanation',
        mentorId: 'quinn',
        text: `"That feeling? That's what we call Insight. When you're really engaged with learning, when concepts start clicking together, you build understanding that goes deeper than just memorizing facts. You've been gaining Insight all day - notice how it feels different from just completing tasks?"`,
        options: [
          {
            id: 'insight_feels_different',
            text: 'Yes, it does feel different. More connected somehow.',
            nextNodeId: 'quinn_insight_application',
            insightChange: 3,
            tutorialStepCompletion: 'ability_card_introduction'
          },
          {
            id: 'ask_about_insight_system',
            text: 'How does this Insight system work exactly?',
            nextNodeId: 'quinn_insight_mechanics',
            insightChange: 2,
            tutorialStepCompletion: 'ability_card_introduction'
          }
        ]
      },
      'quinn_insight_mechanics': {
        id: 'quinn_insight_mechanics',
        mentorId: 'quinn',
        text: `"Think of Insight as your growing understanding. The more engaged you are, the more you gain. You can use it to unlock new concepts, deepen relationships with mentors, and develop special abilities. It's not just about knowing facts - it's about truly understanding connections."`,
        options: [
          {
            id: 'understand_connections',
            text: 'Understanding connections... that makes sense.',
            nextNodeId: 'quinn_journal_introduction',
            insightChange: 2
          }
        ]
      },
      'quinn_insight_application': {
        id: 'quinn_insight_application',
        mentorId: 'quinn',
        text: `"Exactly. And here's something that might help you organize those connections..." [Pulls out ornate journal] "This belonged to a former resident - someone who really mastered the art of connecting medical physics concepts."`,
        options: [
          {
            id: 'curious_about_journal',
            text: 'What made them so good at connecting concepts?',
            nextNodeId: 'quinn_journal_introduction',
            relationshipChange: 2
          }
        ]
      },
      'quinn_journal_introduction': {
        id: 'quinn_journal_introduction',
        mentorId: 'quinn',
        text: `"They developed this system for organizing insights and abilities. See these sections? You can place ability cards here - techniques you learn from mentors, special approaches to problems. The journal helps you see patterns across different areas of physics."`,
        options: [
          {
            id: 'journal_system_interesting',
            text: 'This system looks fascinating. How do I use it?',
            nextNodeId: 'quinn_ability_card_demo',
            tutorialStepCompletion: 'journal_system_explanation'
          }
        ]
      },
      'quinn_ability_card_demo': {
        id: 'quinn_ability_card_demo',
        mentorId: 'quinn',
        text: `"Your first ability card and a journal. Use them tonight."`,
        options: [
          {
            id: 'receive_first_ability',
            text: 'Thanks.',
            isEndNode: true,
            receivesAbility: 'pattern_recognition',
            insightChange: 5,
            tutorialStepCompletion: 'night_phase_transition'
          }
        ]
      },
      'quinn_constellation_preview': {
        id: 'quinn_constellation_preview',
        mentorId: 'quinn',
        text: `"One more thing - tonight, try looking up at the stars. Sometimes when you're really focused on learning, you start to see... patterns in unexpected places. The journal will help with that too." [Mysterious smile]`,
        options: [
          {
            id: 'intrigued_by_stars',
            text: 'I\'ll definitely look up tonight. Thank you for everything.',
            nextNodeId: 'quinn_day_conclusion',
            relationshipChange: 3
          }
        ]
      },
      'quinn_day_conclusion': {
        id: 'quinn_day_conclusion',
        mentorId: 'quinn',
        text: `"Go home, organize your thoughts. Use the journal to reflect on today's connections. I might call later - first days here can bring... interesting discoveries. Sweet dreams!" [Winks knowingly]`,
        options: [
          {
            id: 'ready_for_night_exploration',
            text: 'I\'m excited to explore what I\'ve learned today.',
            isEndNode: true,
            relationshipChange: 3,
            tutorialStepCompletion: 'night_phase_transition'
          }
        ]
      }
    }
  },

  // NIGHT PHASE TUTORIAL SEQUENCE

  /**
   * Observatory Phone Call - Night Phase
   * Natural check-in with mystery over exposition approach
   */
  'tutorial_observatory_call': {
    id: 'tutorial_observatory_call',
    title: 'Evening Check-in Call',
    description: 'Dr. Quinn calls to see how your first day is settling in',
    startNodeId: 'quinn_phone_opening',
    domain: 'general',
    difficulty: 1,
    mode: DialogueMode.NARRATIVE,
    isTutorial: true,
    nodes: {
      'quinn_phone_opening': {
        id: 'quinn_phone_opening',
        mentorId: 'quinn',
        text: `"How's your first day settling in? Try the journal tonight."`,
        options: [
          {
            id: 'just_about_to_explore',
            text: 'Will do.',
            isEndNode: true,
            tutorialStepCompletion: 'observatory_introduction'
          }
        ]
      },
      'quinn_discovery_guidance': {
        id: 'quinn_discovery_guidance',
        mentorId: 'quinn',
        text: `"Perfect timing then. Just... browse through it with an open mind. Some residents pick up on patterns others miss. You strike me as someone who might notice connections."`,
        options: [
          {
            id: 'see_what_i_discover',
            text: 'I\'ll see what I can discover.',
            isEndNode: true,
            insightChange: 3,
            tutorialStepCompletion: 'constellation_interface'
          }
        ]
      }
    }
  },

  /**
   * Kapoor Shadow Experience - Precision Path
   * Systematic measurement science and professional standards
   */
  'tutorial_kapoor_precision_path': {
    id: 'tutorial_kapoor_precision_path',
    title: 'Measurement Science with Dr. Kapoor',
    description: 'Systematic afternoon learning about precision, accuracy, and professional standards',
    startNodeId: 'kapoor_precision_intro',
    domain: 'dosimetry',
    difficulty: 1,
    mode: DialogueMode.NARRATIVE,
    isTutorial: true,
    nodes: {
      'kapoor_precision_intro': {
        id: 'kapoor_precision_intro',
        mentorId: 'kapoor',
        text: `"Let's work through a calibration measurement."`,
        options: [
          {
            id: 'begin_calibration',
            text: 'Ready.',
            nextNodeId: 'kapoor_precision_complete',
            triggersActivity: true
          }
        ]
      },
      'kapoor_precision_complete': {
        id: 'kapoor_precision_complete',
        mentorId: 'kapoor',
        text: `"Good work. Go see Dr. Quinn before you leave."`,
        options: [
          {
            id: 'thanks_for_precision',
            text: 'Thanks.',
            isEndNode: true,
            relationshipChange: 4,
            insightChange: 3,
            tutorialStepCompletion: 'quinn_office_meeting'
          }
        ]
      },
      'kapoor_shows_chamber': {
        id: 'kapoor_shows_chamber',
        mentorId: 'kapoor',
        text: `"This ion chamber measures radiation to within 2% accuracy. But only if we follow proper procedures and account for all uncertainty sources. Each measurement we make is a commitment to our patients."`,
        options: [
          {
            id: 'understand_commitment',
            text: 'I can see how each measurement is a responsibility.',
            nextNodeId: 'kapoor_activity_setup',
            insightChange: 2
          },
          {
            id: 'ask_about_procedures',
            text: 'What procedures ensure that accuracy?',
            nextNodeId: 'kapoor_activity_setup',
            momentumChange: 1
          }
        ]
      },
      'kapoor_activity_setup': {
        id: 'kapoor_activity_setup',
        mentorId: 'kapoor',
        text: `"Systematic verification, temperature corrections, pressure adjustments, decay corrections - each step builds confidence in our results. Let us work through a calibration together. You will see how precision emerges from method."`,
        options: [
          {
            id: 'begin_calibration',
            text: 'I\'m ready to learn the systematic approach.',
            nextNodeId: 'kapoor_activity_complete',
            triggersActivity: true
          }
        ]
      },
      'kapoor_activity_complete': {
        id: 'kapoor_activity_complete',
        mentorId: 'kapoor',
        text: `"Methodical work. Very good. You understand that precision is not about perfection - it is about knowing and controlling your uncertainties. This foundation will support everything else you learn here."`,
        options: [
          {
            id: 'measurement_science_critical',
            text: 'I can see why measurement science is so critical.',
            nextNodeId: 'kapoor_end_transition',
            relationshipChange: 4,
            insightChange: 3
          },
          {
            id: 'systematic_reliable',
            text: 'The systematic approach makes everything more reliable.',
            nextNodeId: 'kapoor_end_transition',
            relationshipChange: 3,
            insightChange: 4
          }
        ]
      },
      'kapoor_end_transition': {
        id: 'kapoor_end_transition',
        mentorId: 'kapoor',
        text: `"Dr. Quinn wishes to see you before you leave. She mentioned having documentation that might aid your studies. Quinn's methods are... unconventional, but effective. Remember what you learned here about systematic thinking."`,
        options: [
          {
            id: 'thanks_for_precision',
            text: 'Thank you for showing me how precision actually works.',
            isEndNode: true,
            relationshipChange: 2,
            tutorialStepCompletion: 'first_ability_intro'
          }
        ]
      }
    }
  }
};

// Simplified tutorial dialogue mapping - no complex logic
export const TUTORIAL_DIALOGUE_MAP: Record<string, string> = {
  // First day tutorial sequence
  'physics-office': 'tutorial_physics_office_intro',
  'lunch-room': 'tutorial_lunch_dialogue',
  'dosimetry-lab': 'tutorial_dosimetry_lab_intro',
  // Jesse's specific afternoon location
  'linac-1': 'tutorial_jesse_equipment_path',
  // Lunch can be triggered from any room
  'any-room-lunch': 'tutorial_lunch_dialogue',
  // Quinn's office for end-of-day meeting
  'physics-office-end-day': 'tutorial_quinn_office_journal',
  // Night phase tutorial
  'observatory': 'tutorial_observatory_call'
};

// Tutorial dialogue mapping with proper priority for special cases
export function getTutorialDialogueForRoom(roomId: string, tutorialStep: string | null): string | null {
  // Special case: lunch dialogue can happen in any room during lunch step
  if (tutorialStep === 'lunch_dialogue') {
    return TUTORIAL_DIALOGUE_MAP['any-room-lunch'];
  }
  
  // Special case: Quinn's office dialogue during end-of-day tutorial steps
  if (roomId === 'physics-office' && (
    tutorialStep === 'night_phase_transition' || 
    tutorialStep === 'quinn_office_meeting' ||
    tutorialStep === 'ability_card_introduction' ||
    tutorialStep === 'journal_system_explanation'
  )) {
    return TUTORIAL_DIALOGUE_MAP['physics-office-end-day'];
  }
  
  // Override: Only use Quinn's office dialogue for physics-office during specific end-of-day steps
  if (roomId === 'physics-office' && tutorialStep && [
    'night_phase_transition', 
    'quinn_office_meeting',
    'ability_card_introduction',
    'journal_system_explanation',
    'third_mentor_intro'
  ].includes(tutorialStep)) {
    return TUTORIAL_DIALOGUE_MAP['physics-office-end-day'];
  }
  
  // Special case: Jesse's afternoon tutorial activities
  if (roomId === 'linac-1' && (
    tutorialStep === 'second_mentor_intro' ||  // Guide user to Jesse after lunch
    tutorialStep === 'constellation_preview' || 
    tutorialStep === 'first_ability_intro' ||
    tutorialStep === 'journal_card_explanation'
  )) {
    return 'tutorial_jesse_equipment_path';
  }
  
  if (roomId === 'dosimetry-lab' && (
    tutorialStep === 'constellation_preview' || 
    tutorialStep === 'first_ability_intro' ||
    tutorialStep === 'journal_card_explanation'
  )) {
    return 'tutorial_kapoor_precision_path';
  }
  
  // Direct room mapping as fallback
  if (TUTORIAL_DIALOGUE_MAP[roomId]) {
    return TUTORIAL_DIALOGUE_MAP[roomId];
  }
  
  return null;
}

// Helper function to check if a dialogue is tutorial-specific
export function isTutorialDialogue(dialogueId: string): boolean {
  return tutorialDialogues.hasOwnProperty(dialogueId);
}

/**
 * Tutorial Step to Room Availability Mapping
 * Defines which rooms should be available (clickable) at each tutorial step
 * This prevents choice paralysis by restricting options to tutorial-relevant actions
 */
export const TUTORIAL_STEP_ROOM_AVAILABILITY: Record<string, {
  availableRooms: string[];
  recommendedRoom?: string; // The room the player should click next
  allowedRooms?: string[]; // Additional rooms that can be clicked but aren't the main focus
  description: string; // What the player should do at this step
}> = {
  // First Day Tutorial Steps
  'morning_arrival': {
    availableRooms: ['physics-office'],
    recommendedRoom: 'physics-office', 
    description: 'Visit the Physics Office to meet Dr. Garcia'
  },
  
  'hospital_tour': {
    availableRooms: ['physics-office', 'linac-1', 'dosimetry-lab', 'linac-2', 'simulation-suite'],
    recommendedRoom: 'physics-office',
    allowedRooms: ['linac-1', 'dosimetry-lab', 'linac-2', 'simulation-suite'],
    description: 'Explore the hospital rooms or return to Physics Office to continue with Dr. Garcia'
  },
  
  'first_mentor_intro': {
    availableRooms: ['physics-office'],
    recommendedRoom: 'physics-office',
    description: 'Continue conversation with Dr. Garcia in the Physics Office'
  },
  
  'first_educational_activity': {
    availableRooms: ['physics-office'],
    recommendedRoom: 'physics-office',
    description: 'Return to Dr. Garcia for your first learning activity'
  },
  
  'insight_mechanic_intro': {
    availableRooms: ['physics-office'],
    recommendedRoom: 'physics-office', 
    description: 'Complete the activity with Dr. Garcia to learn about Insight points'
  },
  
  'lunch_dialogue': {
    availableRooms: ['lunch-room'],
    recommendedRoom: 'lunch-room',
    description: 'Head to the lunch-room for lunch with the team'
  },
  
  'second_mentor_intro': {
    availableRooms: ['linac-1', 'dosimetry-lab'],
    recommendedRoom: 'linac-1',
    description: 'Choose between Jesse in LINAC Room 1 (troubleshooting "Bertha") or Dr. Kapoor in the Dosimetry Lab (calibration work)'
  },
  
  'constellation_preview': {
    availableRooms: ['linac-1', 'dosimetry-lab'],
    recommendedRoom: 'linac-1',
    description: 'Choose between Jesse in LINAC Room 1 (troubleshooting "Bertha") or Dr. Kapoor in the Dosimetry Lab (calibration work)'
  },
  
  'first_ability_intro': {
    availableRooms: ['linac-1', 'dosimetry-lab'],
    recommendedRoom: 'linac-1',
    description: 'Choose between Jesse in LINAC Room 1 (troubleshooting "Bertha") or Dr. Kapoor in the Dosimetry Lab (calibration work)'
  },
  
  'journal_card_explanation': {
    availableRooms: ['linac-1', 'dosimetry-lab'],
    recommendedRoom: 'linac-1',
    description: 'Choose between Jesse in LINAC Room 1 (troubleshooting "Bertha") or Dr. Kapoor in the Dosimetry Lab (calibration work)'
  },
  
  'night_phase_transition': {
    availableRooms: ['physics-office'],
    recommendedRoom: 'physics-office',
    description: 'Visit Quinn\'s office to end your first day and receive guidance for tonight'
  },
  
  'third_mentor_intro': {
    availableRooms: ['dosimetry-lab'],
    recommendedRoom: 'dosimetry-lab',
    description: 'Visit the Dosimetry Lab to meet Dr. Kapoor'
  },
  
  // Night Phase Tutorial Steps
  'observatory_introduction': {
    availableRooms: [],
    description: 'You are now in your observatory - no hospital rooms available'
  },
  
  'constellation_interface': {
    availableRooms: [],
    description: 'Explore the Knowledge Constellation interface'
  },
  
  'star_selection_tutorial': {
    availableRooms: [],
    description: 'Practice selecting and unlocking stars'
  },
  
  'journal_system_intro': {
    availableRooms: [],
    description: 'Learn to organize your journal'
  },
  
  'card_placement_tutorial': {
    availableRooms: [],
    description: 'Practice placing ability cards in your journal'
  },
  
  'phone_call_system': {
    availableRooms: [],
    description: 'Receive mentor guidance call'
  },
  
  'mentor_night_guidance': {
    availableRooms: [],
    description: 'Continue mentor conversation'
  },
  
  // Advanced Tutorial Steps - Allow normal gameplay
  'mentor_relationship_tracking': {
    availableRooms: ['physics-office', 'linac-1', 'dosimetry-lab', 'linac-2', 'simulation-suite'],
    description: 'Practice building relationships with mentors'
  },
  
  'advanced_dialogue_options': {
    availableRooms: ['physics-office', 'linac-1', 'dosimetry-lab', 'linac-2', 'simulation-suite'],
    description: 'Explore advanced conversation options'
  },
  
  'special_abilities_unlock': {
    availableRooms: ['physics-office', 'linac-1', 'dosimetry-lab', 'linac-2', 'simulation-suite'],
    description: 'Discover special abilities through gameplay'
  },
  
  'boss_encounter_prep': {
    availableRooms: ['physics-office', 'linac-1', 'dosimetry-lab', 'linac-2', 'simulation-suite'],
    description: 'Prepare for challenging scenarios'
  },

  // New tutorial steps for Quinn's office meeting
  'quinn_office_meeting': {
    availableRooms: ['physics-office'],
    recommendedRoom: 'physics-office',
    description: 'Meet with Dr. Quinn in her office to wrap up your first day'
  },

  'ability_card_introduction': {
    availableRooms: ['physics-office'],
    recommendedRoom: 'physics-office',
    description: 'Receive your first ability card from Dr. Quinn'
  },

  'journal_system_explanation': {
    availableRooms: ['physics-office'],
    recommendedRoom: 'physics-office',
    description: 'Learn about the journal system from Dr. Quinn'
  }
};

/**
 * Check if a room is available during the current tutorial step
 */
export function isRoomAvailableInTutorial(roomId: string, tutorialStep: string | null): boolean {
  if (!tutorialStep) return true; // No tutorial step = all rooms available
  
  const stepConfig = TUTORIAL_STEP_ROOM_AVAILABILITY[tutorialStep];
  if (!stepConfig) return true; // Unknown step = allow all rooms
  
  return stepConfig.availableRooms.includes(roomId);
}

/**
 * Check if a room is the recommended next action during tutorial
 */
export function isRecommendedTutorialRoom(roomId: string, tutorialStep: string | null): boolean {
  if (!tutorialStep) return false;
  
  const stepConfig = TUTORIAL_STEP_ROOM_AVAILABILITY[tutorialStep];
  return stepConfig?.recommendedRoom === roomId;
}

/**
 * Get tutorial guidance for the current step
 */
export function getTutorialStepGuidance(tutorialStep: string | null): string {
  if (!tutorialStep) return '';
  
  const stepConfig = TUTORIAL_STEP_ROOM_AVAILABILITY[tutorialStep];
  return stepConfig?.description || '';
}

/**
 * Get all available rooms for the current tutorial step
 */
export function getAvailableRoomsForStep(tutorialStep: string | null): string[] {
  if (!tutorialStep) return ['physics-office', 'linac-1', 'dosimetry-lab', 'linac-2', 'simulation-suite'];
  
  const stepConfig = TUTORIAL_STEP_ROOM_AVAILABILITY[tutorialStep];
  return stepConfig?.availableRooms || [];
} 