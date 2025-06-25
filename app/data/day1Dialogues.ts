import { Dialogue } from './dialogueData';
import { DialogueMode } from '@/app/types';

// Day 1 specific dialogues that integrate with existing dialogue system
export const day1Dialogues: Record<string, Dialogue> = {
  // CONSOLIDATED PROLOGUE DIALOGUE - Handles entire introduction conversation
  'prologue_complete_conversation': {
    id: 'prologue_complete_conversation',
    title: 'Welcome to Memorial General',
    description: 'Complete prologue conversation including name input and difficulty selection',
    startNodeId: 'intro_welcome',
    domain: 'general',
    difficulty: 1,
    mode: DialogueMode.NARRATIVE,
    nodes: {
      'intro_welcome': {
        id: 'intro_welcome',
        mentorId: 'garcia',
        text: `Welcome to Memorial General Hospital! I'm Dr. Garcia, Radiation Oncologist and Education Coordinator. The building might be all straight lines, but in medical physics, rarely is anything so simple.`,
        options: [
          {
            id: 'intro_continue',
            text: 'Thank you for having me.',
            nextNodeId: 'name_request'
          }
        ]
      },
      'name_request': {
        id: 'name_request',
        mentorId: 'garcia',
        text: `I don't believe I caught your name on the paperwork. Could you introduce yourself?`,
        options: [
          {
            id: 'name_input_ready',
            text: '[Enter your name]',
            nextNodeId: 'name_received',
            isNameInput: true
          }
        ]
      },
      'name_received': {
        id: 'name_received',
        mentorId: 'garcia',
        text: `Nice to meet you, [PLAYER_NAME]. We're glad to have you join our team at Memorial General. Your academic record is impressive—quite the constellation of achievements. Before we start, I'd like to know a bit more about your background.`,
        options: [
          {
            id: 'background_ready',
            text: '[Select your background]',
            nextNodeId: 'background_received',
            triggersActivity: true // This will trigger difficulty selection
          }
        ]
      },
      'background_received': {
        id: 'background_received',
        mentorId: 'garcia',
        text: `Excellent. Now let me introduce you to the team you'll be working with during your residency.`,
        options: [
          {
            id: 'meet_team',
            text: 'I\'d love to meet them.',
            nextNodeId: 'mentors_intro'
          }
        ]
      },
      'mentors_intro': {
        id: 'mentors_intro',
        mentorId: 'garcia',
        text: `You'll work with several mentors: myself, Dr. Kapoor—who believes protocols are sacred texts, Jesse—who can diagnose a linac malfunction from the sound it makes, and Dr. Quinn—whose ideas occasionally bend the laws of physics.`,
        options: [
          {
            id: 'mentors_continue',
            text: 'I look forward to working with everyone.',
            nextNodeId: 'time_management'
          }
        ]
      },
      'time_management': {
        id: 'time_management',
        mentorId: 'garcia',
        text: `Time management is crucial here. Unlike subatomic particles, we can't be in two places at once—though Dr. Quinn has a theory about that too. Choose your daily activities wisely.`,
        options: [
          {
            id: 'time_understood',
            text: 'I understand.',
            nextNodeId: 'garcia_transition'
          }
        ]
      },
      'garcia_transition': {
        id: 'garcia_transition',
        mentorId: 'garcia',
        text: `Excellent! Now, let me show you around the hospital and introduce you to your new workspace. We'll start with the main treatment areas - you'll be spending quite a bit of time there.`,
        options: [
          {
            id: 'ready_for_tour',
            text: 'Sounds great, lead the way!',
            nextNodeId: 'prologue_complete'
          }
        ]
      },
      'prologue_complete': {
        id: 'prologue_complete',
        mentorId: 'garcia',
        text: `Perfect! Welcome to Memorial General Hospital's Medical Physics Residency Program, [PLAYER_NAME]. Your journey begins now.`,
        options: [
          {
            id: 'begin_day_one',
            text: 'I\'m ready!',
            isEndNode: true
          }
        ]
      }
    }
  },

  'day1_arrival': {
    id: 'day1_arrival',
    title: 'Hospital Arrival',
    description: 'First meeting with Dr. Garcia at the hospital entrance',
    startNodeId: 'arrival_welcome',
    domain: 'general',
    difficulty: 1,
    mode: DialogueMode.NARRATIVE,
    nodes: {
      'arrival_welcome': {
        id: 'arrival_welcome',
        mentorId: 'garcia',
        text: `You must be our new resident! I'm Dr. Garcia, lead of radiation therapy. Welcome to Northwestern's Medical Physics program.`,
        options: [
          {
            id: 'arrival_welcome_continue',
            text: 'Thank you, I\'m excited to be here.',
            nextNodeId: 'arrival_about_quinn'
          }
        ]
      },
      'arrival_about_quinn': {
        id: 'arrival_about_quinn', 
        mentorId: 'garcia',
        text: `Dr. Quinn specifically selected you for our... unique approach to education. She's eager to meet you, but she's caught in a calibration emergency this morning.`,
        options: [
          {
            id: 'arrival_ask_name',
            text: 'I understand. Should I wait for her?',
            nextNodeId: 'arrival_name_request'
          }
        ]
      },
      'arrival_name_request': {
        id: 'arrival_name_request',
        mentorId: 'garcia', 
        text: `I don't seem to have your name on my sheet. The office mix-up again. Could you tell me your name?`,
        options: [
          {
            id: 'arrival_name_input',
            text: '[Enter your name]',
            nextNodeId: 'arrival_name_response',
            // Special flag for name input - SceneRenderer will handle this
            isNameInput: true
          }
        ]
      },
      'arrival_name_response': {
        id: 'arrival_name_response',
        mentorId: 'garcia',
        text: `Perfect. {playerName}, let's get you started. The first week is orientation. Follow me.`,
        options: [
          {
            id: 'arrival_complete',
            text: 'Lead the way!',
            isEndNode: true,
            relationshipChange: 2
          }
        ]
      }
    }
  },

  'day1_tour': {
    id: 'day1_tour',
    title: 'Hospital Tour',
    description: 'Brief tour of the hospital corridors',
    startNodeId: 'tour_team_intro',
    domain: 'general',
    difficulty: 1,
    mode: DialogueMode.NARRATIVE,
    nodes: {
      'tour_team_intro': {
        id: 'tour_team_intro',
        mentorId: 'garcia',
        text: `Our team is small but exceptional. Dr. Kapoor handles dosimetry - he's... precise. Technician Jesse manages our equipment - you'll like him, everyone does. And of course, Dr. Quinn oversees the educational program.`,
        options: [
          {
            id: 'tour_continue',
            text: 'They sound like an interesting team.',
            nextNodeId: 'tour_evolution'
          }
        ]
      },
      'tour_evolution': {
        id: 'tour_evolution',
        mentorId: 'garcia',
        text: `We've had some remarkable residents come through. Our program has... evolved in recent years.`,
        options: [
          {
            id: 'tour_workspace',
            text: 'What makes your program different?',
            nextNodeId: 'tour_workspace_intro'
          }
        ]
      },
      'tour_workspace_intro': {
        id: 'tour_workspace_intro',
        mentorId: 'garcia',
        text: `This will be your primary workspace today. Let's get started with your first patient simulation.`,
        options: [
          {
            id: 'tour_complete',
            text: 'I\'m ready to begin.',
            isEndNode: true,
            insightChange: 5
          }
        ]
      }
    }
  },

  'day1_first_patient': {
    id: 'day1_first_patient',
    title: 'First Patient Simulation',
    description: 'Introduction to momentum through patient positioning',
    startNodeId: 'patient_setup',
    domain: 'radiation_therapy',
    difficulty: 1,
    mode: DialogueMode.CHALLENGE,
    nodes: {
      'patient_setup': {
        id: 'patient_setup',
        mentorId: 'garcia',
        text: `This is a simulation for a Stage II prostate case. We're adjusting positioning to account for recent weight loss.`,
        options: [
          {
            id: 'patient_continue',
            text: 'What should I focus on?',
            nextNodeId: 'patient_instructions'
          }
        ]
      },
      'patient_instructions': {
        id: 'patient_instructions',
        mentorId: 'garcia',
        text: `Review the current setup and identify any positioning concerns. Take your time - when you're focused on a clinical problem, you'll notice your perception becomes... enhanced.`,
        options: [
          {
            id: 'patient_start_questions',
            text: 'I understand. Let me examine the setup.',
            nextNodeId: 'patient_questions',
            // This will trigger the activity questions in SceneRenderer
            triggersActivity: true
          }
        ]
      },
      'patient_questions': {
        id: 'patient_questions',
        mentorId: 'garcia',
        text: `Good work. As you answered those questions correctly, did you notice the subtle glow around your responses? That's what we call "Momentum" - it represents your focused clinical thinking.`,
        options: [
          {
            id: 'patient_momentum_explanation',
            text: 'I did notice something different...',
            nextNodeId: 'patient_momentum_details'
          }
        ]
      },
      'patient_momentum_details': {
        id: 'patient_momentum_details',
        mentorId: 'garcia',
        text: `When you build momentum, your subsequent insights become more valuable. It's the difference between scattered learning and focused understanding. You'll find this... useful.`,
        options: [
          {
            id: 'patient_complete',
            text: 'Fascinating. What\'s next?',
            isEndNode: true,
            momentumChange: 1,
            relationshipChange: 3
          }
        ]
      }
    }
  },

  'day1_jesse_meeting': {
    id: 'day1_jesse_meeting',
    title: 'Meeting Jesse',
    description: 'First encounter with the maintenance technician',
    startNodeId: 'jesse_intro',
    domain: 'linac_anatomy',
    difficulty: 1,
    mode: DialogueMode.NARRATIVE,
    nodes: {
      'jesse_intro': {
        id: 'jesse_intro',
        mentorId: 'jesse',
        text: `New blood! Thank goodness. Hand me that ion chamber?`,
        options: [
          {
            id: 'jesse_hand_tool',
            text: '[Hand over the ion chamber]',
            nextNodeId: 'jesse_thanks'
          }
        ]
      },
      'jesse_thanks': {
        id: 'jesse_thanks',
        mentorId: 'jesse', 
        text: `Thanks. You're Quinn's new student, huh? Interesting. You've got the look.`,
        options: [
          {
            id: 'jesse_what_look',
            text: 'What look?',
            nextNodeId: 'jesse_cryptic'
          }
        ]
      },
      'jesse_cryptic': {
        id: 'jesse_cryptic',
        mentorId: 'garcia', // Garcia interrupts
        text: `Jesse, maybe save the cryptic comments for day two?`,
        options: [
          {
            id: 'jesse_response',
            text: '[Let Jesse respond]',
            nextNodeId: 'jesse_welcome'
          }
        ]
      },
      'jesse_welcome': {
        id: 'jesse_welcome',
        mentorId: 'jesse',
        text: `No fun, Garcia. Fine. Welcome aboard. Come by anytime - especially if things get weird.`,
        options: [
          {
            id: 'jesse_complete',
            text: 'I will. Thanks, Jesse.',
            isEndNode: true,
            relationshipChange: 3
          }
        ]
      }
    }
  },

  'day1_kapoor_meeting': {
    id: 'day1_kapoor_meeting',
    title: 'Meeting Dr. Kapoor',
    description: 'First encounter with the dosimetry specialist',
    startNodeId: 'kapoor_intro',
    domain: 'dosimetry',
    difficulty: 1,
    mode: DialogueMode.CHALLENGE,
    nodes: {
      'kapoor_intro': {
        id: 'kapoor_intro',
        mentorId: 'kapoor',
        text: `One moment. Precision cannot be rushed.`,
        options: [
          {
            id: 'wait_for_kapoor',
            text: '[Wait patiently]',
            nextNodeId: 'kapoor_welcome'
          }
        ]
      },
      'kapoor_welcome': {
        id: 'kapoor_welcome',
        mentorId: 'kapoor',
        text: `Welcome. I oversee dosimetry and quality assurance. Do you have experience with ion chamber calibration protocols?`,
        options: [
          {
            id: 'some_experience',
            text: 'Some basic experience from coursework.',
            nextNodeId: 'kapoor_challenge'
          },
          {
            id: 'minimal_experience',
            text: 'Very little practical experience.',
            nextNodeId: 'kapoor_challenge'
          }
        ]
      },
      'kapoor_challenge': {
        id: 'kapoor_challenge',
        mentorId: 'kapoor',
        text: `Let us test your understanding with some calibration questions. Observe carefully - correct answers may reveal... insights.`,
        options: [
          {
            id: 'kapoor_start_questions',
            text: 'I\'m ready for the challenge.',
            nextNodeId: 'kapoor_feedback',
            triggersActivity: true
          }
        ]
      },
      'kapoor_feedback': {
        id: 'kapoor_feedback',
        mentorId: 'kapoor',
        text: `Acceptable preliminary knowledge. The fundamentals must be mastered before... other approaches. You may have noticed the pink particles - those represent insights gathering in your mind.`,
        options: [
          {
            id: 'kapoor_complete',
            text: 'I did notice something. Thank you, Dr. Kapoor.',
            isEndNode: true,
            relationshipChange: 2,
            insightChange: 8
          }
        ]
      }
    }
  },

  'day1_quinn_intro': {
    id: 'day1_quinn_intro',
    title: 'Meeting Dr. Quinn',
    description: 'First meeting with the program director and journal handover',
    startNodeId: 'quinn_greeting',
    domain: 'general',
    difficulty: 1,
    mode: DialogueMode.NARRATIVE,
    nodes: {
      'quinn_greeting': {
        id: 'quinn_greeting',
        mentorId: 'quinn',
        text: `At last! Our newest resident arrives. Please, join me for lunch.`,
        options: [
          {
            id: 'join_quinn',
            text: '[Sit down with Dr. Quinn]',
            nextNodeId: 'quinn_morning_check'
          }
        ]
      },
      'quinn_morning_check': {
        id: 'quinn_morning_check',
        mentorId: 'quinn',
        text: `How has your first morning been? Did you notice anything... interesting during your activities?`,
        options: [
          {
            id: 'noticed_effects',
            text: 'There were some unusual visual effects during questions.',
            nextNodeId: 'quinn_journal_intro'
          },
          {
            id: 'seemed_normal',
            text: 'It seemed like normal learning to me.',
            nextNodeId: 'quinn_journal_intro'
          }
        ]
      },
      'quinn_journal_intro': {
        id: 'quinn_journal_intro',
        mentorId: 'quinn',
        text: `Interesting. This is for you - something I provide to residents in my program. It belonged to a previous student who had remarkable success.`,
        options: [
          {
            id: 'accept_journal',
            text: '[Accept the journal]',
            nextNodeId: 'quinn_journal_explanation',
            receivesJournal: true
          }
        ]
      },
      'quinn_journal_explanation': {
        id: 'quinn_journal_explanation',
        mentorId: 'quinn',
        text: `See if it suits your style. The previous owner, Amara, discovered some... innovative approaches to learning. You might find her notes illuminating.`,
        options: [
          {
            id: 'quinn_complete',
            text: 'Thank you. I\'ll study it carefully.',
            isEndNode: true,
            relationshipChange: 5,
            insightChange: 10
          }
        ]
      }
    }
  },

  'day1_afternoon_quinn': {
    id: 'day1_afternoon_quinn',
    title: 'Afternoon with Dr. Quinn',
    description: 'Treatment planning session and full UI introduction',
    startNodeId: 'afternoon_planning',
    domain: 'treatment_planning',
    difficulty: 2,
    mode: DialogueMode.CHALLENGE,
    nodes: {
      'afternoon_planning': {
        id: 'afternoon_planning',
        mentorId: 'quinn',
        text: `Now let's see how you approach treatment planning. This is where your morning's learning comes together.`,
        options: [
          {
            id: 'ready_for_planning',
            text: 'I\'m ready to apply what I\'ve learned.',
            nextNodeId: 'quinn_ui_introduction'
          }
        ]
      },
      'quinn_ui_introduction': {
        id: 'quinn_ui_introduction',
        mentorId: 'quinn',
        text: `As you work through these planning challenges, you'll see your progress more clearly. We call that focused state "Momentum" - it represents your cognitive flow.`,
        options: [
          {
            id: 'start_planning_activity',
            text: 'Let me focus on these cases.',
            nextNodeId: 'quinn_insight_explanation',
            triggersActivity: true
          }
        ]
      },
      'quinn_insight_explanation': {
        id: 'quinn_insight_explanation',
        mentorId: 'quinn',
        text: `Excellent work. Those particles flowing to your journal represent meaningful insights you've gathered. Notice how your journal seems to collect and organize your learning?`,
        options: [
          {
            id: 'understand_system',
            text: 'This is a remarkable way to visualize learning.',
            nextNodeId: 'quinn_afternoon_complete'
          }
        ]
      },
      'quinn_afternoon_complete': {
        id: 'quinn_afternoon_complete',
        mentorId: 'quinn',
        text: `You're adapting well to our methods. Your first day is nearly complete - I think you'll find your new residence quite... educational as well.`,
        options: [
          {
            id: 'afternoon_complete',
            text: 'Thank you for everything today, Dr. Quinn.',
            isEndNode: true,
            relationshipChange: 5,
            insightChange: 15
          }
        ]
      }
    }
  },

  'day1_hill_house': {
    id: 'day1_hill_house',
    title: 'Hill House Arrival',
    description: 'Arriving at your new residence and finding Dr. Quinn\'s note',
    startNodeId: 'hill_house_arrival',
    domain: 'general',
    difficulty: 1,
    nodes: {
      'hill_house_arrival': {
        id: 'hill_house_arrival',
        mentorId: 'narrator', // No specific mentor for this scene
        text: `You arrive at Hill House as the evening light fades. The Victorian building looks charming yet mysterious in the twilight. A small note is tucked under the front door.`,
        options: [
          {
            id: 'read_note',
            text: '[Read the note]',
            nextNodeId: 'quinn_note'
          }
        ]
      },
      'quinn_note': {
        id: 'quinn_note',
        mentorId: 'narrator',
        text: `The note reads: "Welcome! The key is under the plant pot. Make yourself at home. I think you'll find the house quite... educational. - Dr. Quinn"`,
        options: [
          {
            id: 'enter_house',
            text: '[Find the key and enter]',
            nextNodeId: 'house_interior'
          }
        ]
      },
      'house_interior': {
        id: 'house_interior',
        mentorId: 'narrator',
        text: `The interior is cozy and well-furnished. You notice a study desk, a staircase leading upstairs, and several interesting details that suggest the previous resident was quite scholarly.`,
        options: [
          {
            id: 'hill_house_complete',
            text: 'This feels like home already.',
            isEndNode: true,
            insightChange: 3
          }
        ]
      }
    }
  },

  'day1_night_exploration': {
    id: 'day1_night_exploration',
    title: 'Night Exploration',
    description: 'Exploring Hill House and discovering journal secrets',
    startNodeId: 'night_begin',
    domain: 'general',
    difficulty: 1,
    nodes: {
      'night_begin': {
        id: 'night_begin',
        mentorId: 'narrator',
        text: `With your first day complete, you have time to explore your new home. The study desk beckons, and you're curious about the upstairs area that seemed locked earlier.`,
        options: [
          {
            id: 'examine_journal',
            text: '[Examine the journal Dr. Quinn gave you]',
            nextNodeId: 'journal_discovery'
          }
        ]
      },
      'journal_discovery': {
        id: 'journal_discovery',
        mentorId: 'narrator',
        text: `As you flip through the journal, you notice a folded corner on one of the pages. Unfolding it reveals a handwritten note: "Day 15 - The small observatory upstairs is perfect for visualizing what I'm learning..."`,
        options: [
          {
            id: 'try_upstairs',
            text: '[Try the upstairs door again]',
            nextNodeId: 'observatory_unlocked'
          }
        ]
      },
      'observatory_unlocked': {
        id: 'observatory_unlocked',
        mentorId: 'narrator',
        text: `The door that was locked before now opens easily. You climb the narrow stairs to find a small observatory with star charts, equipment, and a clear view of the night sky. This must be where the previous resident - Amara - did her studies.`,
        options: [
          {
            id: 'night_complete',
            text: 'This is incredible. Tomorrow will bring new discoveries.',
            isEndNode: true,
            insightChange: 5,
            // This should unlock the constellation screen
            unlocksObservatory: true
          }
        ]
      }
    }
  },

  // Scene system compatibility dialogues - these provide the expected IDs
  'dosimetry-lab-activity_challenge': {
    id: 'dosimetry-lab-activity_challenge',
    title: 'Dosimetry Lab Challenge',
    description: 'Technical challenge in the dosimetry laboratory',
    startNodeId: 'dosimetry_challenge_start',
    domain: 'dosimetry',
    difficulty: 2,
    mode: DialogueMode.CHALLENGE,
    nodes: {
      'dosimetry_challenge_start': {
        id: 'dosimetry_challenge_start',
        mentorId: 'kapoor',
        text: `The dosimetry lab requires precision and focus. Let's test your understanding of radiation measurement principles.`,
        options: [
          {
            id: 'begin_dosimetry_challenge',
            text: 'I\'m ready for the challenge.',
            nextNodeId: 'dosimetry_approach_discussion',
            insightChange: 3
          }
        ]
      },
      'dosimetry_approach_discussion': {
        id: 'dosimetry_approach_discussion',
        mentorId: 'kapoor',
        text: `Good. Before we begin technical measurements, tell me - what do you think is the most critical aspect of dosimetry in radiation therapy?`,
        options: [
          {
            id: 'accuracy_response',
            text: 'Accuracy - every measurement must be precise.',
            nextNodeId: 'accuracy_discussion',
            insightChange: 5,
            momentumChange: 1
          },
          {
            id: 'safety_response',
            text: 'Patient safety - protecting from excessive dose.',
            nextNodeId: 'safety_perspective',
            relationshipChange: 2,
            momentumChange: 1
          },
          {
            id: 'reproducibility_response',
            text: 'Reproducibility - consistent results every time.',
            nextNodeId: 'consistency_discussion',
            insightChange: 8
          }
        ]
      },
      'accuracy_discussion': {
        id: 'accuracy_discussion',
        mentorId: 'kapoor',
        text: `Correct thinking. In dosimetry, a 2% error could mean the difference between cure and complication. Our ion chambers must be calibrated to within 0.5% uncertainty. Are you familiar with TG-51 protocols?`,
        options: [
          {
            id: 'familiar_tg51',
            text: 'Yes, I studied the AAPM TG-51 protocol.',
            nextNodeId: 'protocol_details',
            insightChange: 10,
            momentumChange: 1
          },
          {
            id: 'unfamiliar_tg51',
            text: 'I\'ve heard of it but need to learn more.',
            nextNodeId: 'protocol_education',
            insightChange: -2
          }
        ]
      },
      'safety_perspective': {
        id: 'safety_perspective',
        mentorId: 'kapoor',
        text: `An excellent perspective. You understand that dosimetry is ultimately about human lives. When I calibrate equipment, I think of each patient who will receive treatment based on these measurements.`,
        options: [
          {
            id: 'appreciate_responsibility',
            text: 'That responsibility makes the precision even more important.',
            nextNodeId: 'responsibility_acknowledgment',
            relationshipChange: 4,
            momentumChange: 2
          },
          {
            id: 'ask_about_errors',
            text: 'How do you ensure no measurement errors reach patients?',
            nextNodeId: 'error_prevention',
            insightChange: 6
          }
        ]
      },
      'consistency_discussion': {
        id: 'consistency_discussion',
        mentorId: 'kapoor',
        text: `Very good. Reproducibility is often overlooked, but critical. If the same measurement gives different results on different days, how can we trust any single reading?`,
        options: [
          {
            id: 'systematic_approach',
            text: 'It requires systematic procedures and careful documentation.',
            nextNodeId: 'procedures_discussion',
            insightChange: 12,
            momentumChange: 1
          },
          {
            id: 'ask_variability',
            text: 'What causes measurement variability in practice?',
            nextNodeId: 'variability_explanation',
            insightChange: 5
          }
        ]
      },
      'protocol_details': {
        id: 'protocol_details',
        mentorId: 'kapoor',
        text: `Excellent. TG-51 provides the foundation for all our calibrations. The protocol accounts for beam quality, ion recombination, polarity effects, and environmental conditions. Each correction factor has physical meaning.`,
        options: [
          {
            id: 'understand_physics',
            text: 'I find the physics behind each correction fascinating.',
            nextNodeId: 'physics_appreciation',
            insightChange: 15,
            momentumChange: 2
          },
          {
            id: 'practical_application',
            text: 'How do you apply this in daily practice?',
            nextNodeId: 'daily_implementation',
            insightChange: 8
          }
        ]
      },
      'protocol_education': {
        id: 'protocol_education',
        mentorId: 'kapoor',
        text: `No matter. We will learn together. TG-51 is our bible for absolute dose calibration. Every linear accelerator beam is calibrated using these principles. Precision in protocol execution is paramount.`,
        options: [
          {
            id: 'eager_to_learn',
            text: 'I\'m eager to learn the protocol thoroughly.',
            nextNodeId: 'learning_commitment',
            relationshipChange: 3,
            momentumChange: 1
          }
        ]
      },
      'responsibility_acknowledgment': {
        id: 'responsibility_acknowledgment',
        mentorId: 'kapoor',
        text: `Precisely. You understand the weight of our work. When technologists adjust machine output based on our calibrations, they trust our measurements completely. That trust must never be misplaced.`,
        options: [
          {
            id: 'honor_trust',
            text: 'I\'ll work to always honor that trust.',
            nextNodeId: 'dosimetry_complete',
            relationshipChange: 5,
            momentumChange: 2
          }
        ]
      },
      'error_prevention': {
        id: 'error_prevention',
        mentorId: 'kapoor',
        text: `Multiple independent checks. Every calibration is performed twice by different physicists. We compare results from different ion chambers. The treatment planning system flags unusual values. Redundancy prevents catastrophe.`,
        options: [
          {
            id: 'systematic_safety',
            text: 'That systematic approach gives confidence in the results.',
            nextNodeId: 'dosimetry_complete',
            insightChange: 10,
            relationshipChange: 2
          }
        ]
      },
      'procedures_discussion': {
        id: 'procedures_discussion',
        mentorId: 'kapoor',
        text: `Outstanding insight. I maintain detailed logs of temperature, pressure, humidity, and equipment behavior. Patterns in these logs often reveal problems before they affect patient treatments.`,
        options: [
          {
            id: 'data_analysis_interest',
            text: 'Data analysis must reveal important trends.',
            nextNodeId: 'dosimetry_complete',
            insightChange: 12,
            momentumChange: 1
          }
        ]
      },
      'variability_explanation': {
        id: 'variability_explanation',
        mentorId: 'kapoor',
        text: `Environmental conditions - temperature and pressure fluctuations affect air density. Equipment aging changes detector response. Even small vibrations can influence sensitive measurements.`,
        options: [
          {
            id: 'comprehensive_understanding',
            text: 'The measurement environment affects everything.',
            nextNodeId: 'dosimetry_complete',
            insightChange: 8,
            relationshipChange: 1
          }
        ]
      },
      'physics_appreciation': {
        id: 'physics_appreciation',
        mentorId: 'kapoor',
        text: `A kindred spirit! Each correction factor represents years of research into radiation physics. The beauty lies in understanding why, not just following procedures.`,
        options: [
          {
            id: 'physics_connection',
            text: 'Understanding the physics makes the work more meaningful.',
            nextNodeId: 'dosimetry_complete',
            relationshipChange: 5,
            insightChange: 10,
            momentumChange: 2
          }
        ]
      },
      'daily_implementation': {
        id: 'daily_implementation',
        mentorId: 'kapoor',
        text: `Each morning I check machine output using our calibrated ion chamber. Any deviation beyond tolerance triggers recalibration. The protocol guides every decision, ensuring consistency across all machines.`,
        options: [
          {
            id: 'appreciate_rigor',
            text: 'That daily rigor ensures patient safety.',
            nextNodeId: 'dosimetry_complete',
            insightChange: 6,
            relationshipChange: 3
          }
        ]
      },
      'learning_commitment': {
        id: 'learning_commitment',
        mentorId: 'kapoor',
        text: `Good attitude. Protocol mastery requires practice and patience. I will ensure you understand both the theory and practical application. Precision can be taught.`,
        options: [
          {
            id: 'grateful_mentorship',
            text: 'Thank you for your patient teaching.',
            nextNodeId: 'dosimetry_complete',
            relationshipChange: 4,
            momentumChange: 1
          }
        ]
      },
      'dosimetry_complete': {
        id: 'dosimetry_complete',
        mentorId: 'kapoor',
        text: `Excellent work. You show promise for precision dosimetry. Precision in dosimetry ensures patient safety and treatment efficacy. We will continue your education in systematic measurements.`,
        options: [
          {
            id: 'finish_dosimetry',
            text: 'Thank you for this valuable introduction, Dr. Kapoor.',
            isEndNode: true,
            insightChange: 10,
            relationshipChange: 3
          }
        ]
      }
    }
  },

  'linac-1-intro': {
    id: 'linac-1-intro',
    title: 'LINAC Room 1 Clinical Experience',
    description: 'Introduction to clinical treatment delivery with Dr. Garcia',
    startNodeId: 'treatment_room_start',
    domain: 'radiation_therapy',
    difficulty: 1,
    mode: DialogueMode.NARRATIVE,
    nodes: {
      'treatment_room_start': {
        id: 'treatment_room_start',
        mentorId: 'garcia',
        text: `Welcome to where everything we plan becomes reality - LINAC Room 1. This is sacred space where hope meets precision, where the physics equations you'll master serve their ultimate purpose: healing human beings.`,
        options: [
          {
            id: 'ask_about_atmosphere',
            text: 'The room feels different from the others.',
            nextNodeId: 'treatment_atmosphere'
          },
          {
            id: 'ask_clinical_workflow',
            text: 'Walk me through a typical treatment day.',
            nextNodeId: 'daily_clinical_workflow'
          }
        ]
      },
      'treatment_atmosphere': {
        id: 'treatment_atmosphere',
        mentorId: 'garcia',
        text: `You're perceptive. There's a weight to this room - every patient who lies on that table is fighting for their life. The linear accelerator may be an impressive piece of engineering, but what makes it meaningful is the human trust placed in our hands. When Mrs. Chen comes for her brain treatment, she's not thinking about dose gradients - she's thinking about her grandchildren.`,
        options: [
          {
            id: 'ask_patient_perspective',
            text: 'How do you help patients through that fear?',
            nextNodeId: 'patient_care_approach',
            relationshipChange: 3
          },
          {
            id: 'ask_responsibility',
            text: 'How do you handle that level of responsibility?',
            nextNodeId: 'clinical_responsibility',
            insightChange: 5
          }
        ]
      },
      'daily_clinical_workflow': {
        id: 'daily_clinical_workflow',
        mentorId: 'garcia',
        text: `Each day begins at 6 AM with machine warm-up and quality assurance - Jesse handles the technical checks while I review the day's treatment schedule. First patient arrives at 7:30. Setup, image guidance, position verification, treatment delivery, then careful monitoring. We typically see 25-30 patients daily, each requiring 15-45 minutes depending on complexity.`,
        options: [
          {
            id: 'ask_patient_interaction',
            text: 'How much interaction do you have with each patient?',
            nextNodeId: 'patient_interaction_details',
            relationshipChange: 2
          },
          {
            id: 'ask_safety_protocols',
            text: 'What safety protocols guide each treatment?',
            nextNodeId: 'safety_protocol_overview',
            insightChange: 6
          }
        ]
      },
      'patient_care_approach': {
        id: 'patient_care_approach',
        mentorId: 'garcia',
        text: `I explain everything before it happens. "You'll hear the machine move - that's normal. The table might shift slightly - we're just making tiny adjustments for precision." I stay with them during setup, maintain eye contact during positioning, and always ask if they're comfortable. Fear dissolves when patients feel seen and understood.`,
        options: [
          {
            id: 'ask_positioning_process',
            text: 'Tell me about the positioning process.',
            nextNodeId: 'patient_positioning',
            insightChange: 7
          },
          {
            id: 'ask_emotional_challenges',
            text: 'What\'s the most challenging part emotionally?',
            nextNodeId: 'emotional_challenges',
            relationshipChange: 4
          }
        ]
      },
      'clinical_responsibility': {
        id: 'clinical_responsibility',
        mentorId: 'garcia',
        text: `Every treatment decision carries weight. When I verify a plan, I'm not just checking numbers - I'm holding someone's future in my hands. But here's what I've learned: that responsibility, when embraced fully, sharpens your intuition. You start noticing patterns, feeling when something isn't quite right, sensing what each patient needs.`,
        options: [
          {
            id: 'ask_intuition_development',
            text: 'How do you develop that clinical intuition?',
            nextNodeId: 'clinical_intuition',
            insightChange: 8,
            momentumChange: 2
          },
          {
            id: 'ask_decision_making',
            text: 'How do you make difficult treatment decisions?',
            nextNodeId: 'clinical_decision_making',
            relationshipChange: 3
          }
        ]
      },
      'patient_interaction_details': {
        id: 'patient_interaction_details',
        mentorId: 'garcia',
        text: `More than you might expect. I greet each patient personally, review any concerns from their previous session, and check how they're tolerating treatment. Some patients want to chat - distraction helps them relax. Others prefer quiet focus. Reading each person's needs is part of the skill set you'll develop.`,
        options: [
          {
            id: 'ask_individual_needs',
            text: 'How do you adapt to different patient personalities?',
            nextNodeId: 'patient_adaptation',
            relationshipChange: 4
          },
          {
            id: 'continue_workflow',
            text: 'Personalized care within a technical environment.',
            nextNodeId: 'treatment_delivery_process',
            insightChange: 5
          }
        ]
      },
      'safety_protocol_overview': {
        id: 'safety_protocol_overview',
        mentorId: 'garcia',
        text: `Patient safety is paramount. We verify patient identity, review treatment parameters, confirm positioning with imaging, check dose calculations, and monitor throughout delivery. But safety isn't just checklists - it's cultivating awareness, staying present, and never becoming complacent. One distracted moment could have consequences.`,
        options: [
          {
            id: 'ask_imaging_verification',
            text: 'Tell me about the imaging verification process.',
            nextNodeId: 'imaging_verification',
            insightChange: 8
          },
          {
            id: 'ask_staying_present',
            text: 'How do you maintain that level of attention throughout long days?',
            nextNodeId: 'maintaining_focus',
            relationshipChange: 3,
            momentumChange: 1
          }
        ]
      },
      'patient_positioning': {
        id: 'patient_positioning',
        mentorId: 'garcia',
        text: `Positioning is both art and science. We use the immobilization devices from simulation, but each day brings subtle variations - weight changes, medication effects, anxiety levels. I watch for signs of discomfort, adjust padding when needed, and ensure reproducibility without sacrificing compassion. Sometimes an extra pillow makes all the difference.`,
        options: [
          {
            id: 'ask_reproducibility_challenges',
            text: 'How do you balance comfort with reproducibility?',
            nextNodeId: 'comfort_precision_balance',
            insightChange: 7,
            relationshipChange: 2
          },
          {
            id: 'continue_treatment',
            text: 'Small adjustments that honor the person receiving treatment.',
            nextNodeId: 'treatment_delivery_process',
            relationshipChange: 3
          }
        ]
      },
      'emotional_challenges': {
        id: 'emotional_challenges',
        mentorId: 'garcia',
        text: `Watching people you've grown to care about struggle through treatment is hard. Some days you see genuine fear in someone's eyes, or fatigue that goes beyond physical tiredness. But you also witness incredible resilience - patients who crack jokes while getting positioned, families who create small celebrations around treatment milestones. The human spirit is remarkable.`,
        options: [
          {
            id: 'ask_celebrating_progress',
            text: 'How do you celebrate treatment milestones with patients?',
            nextNodeId: 'treatment_milestones',
            relationshipChange: 4
          },
          {
            id: 'ask_coping_strategies',
            text: 'How do you personally cope with the emotional weight?',
            nextNodeId: 'personal_coping',
            relationshipChange: 5,
            insightChange: 5
          }
        ]
      },
      'clinical_intuition': {
        id: 'clinical_intuition',
        mentorId: 'garcia',
        text: `Clinical intuition develops through mindful presence. When you truly focus on each patient - not just the technical task, but the whole person - you start noticing subtle patterns. How someone breathes when anxious, which patients need extra time, when a plan might need adjustment based on patient response. Trust develops between practitioner and patient, and somehow... treatments go more smoothly.`,
        options: [
          {
            id: 'ask_mindful_practice',
            text: 'How do you cultivate that mindful presence?',
            nextNodeId: 'mindful_treatment',
            insightChange: 10,
            momentumChange: 2,
            relationshipChange: 3
          },
          {
            id: 'continue_workflow',
            text: 'There\'s something profound about that connection.',
            nextNodeId: 'treatment_delivery_process',
            relationshipChange: 3
          }
        ]
      },
      'clinical_decision_making': {
        id: 'clinical_decision_making',
        mentorId: 'garcia',
        text: `I consider the whole picture - treatment goals, patient tolerance, quality of life factors, family dynamics. Sometimes the "optimal" plan isn't what a patient needs. A 90-year-old might benefit more from a shorter, gentler treatment than the most aggressive approach. Clinical wisdom means knowing when to prioritize comfort over theoretical perfection.`,
        options: [
          {
            id: 'ask_personalized_care',
            text: 'How do you personalize treatments for individual patients?',
            nextNodeId: 'individualized_approaches',
            insightChange: 8,
            relationshipChange: 3
          },
          {
            id: 'continue_treatment',
            text: 'Wisdom that comes from seeing patients as whole people.',
            nextNodeId: 'treatment_delivery_process',
            relationshipChange: 4
          }
        ]
      },
      'patient_adaptation': {
        id: 'patient_adaptation',
        mentorId: 'garcia',
        text: `Some patients want detailed explanations - they feel more in control when they understand each step. Others prefer minimal information and just want reassurance that we know what we're doing. Anxious patients might need extra time and gentle guidance. Veterans often appreciate efficiency and directness. You learn to read the room quickly.`,
        options: [
          {
            id: 'continue_workflow',
            text: 'Adaptive communication as part of clinical skill.',
            nextNodeId: 'treatment_delivery_process',
            relationshipChange: 3
          }
        ]
      },
      'treatment_delivery_process': {
        id: 'treatment_delivery_process',
        mentorId: 'garcia',
        text: `Once positioning is verified and safety checks complete, we begin treatment delivery. The room clears except for monitoring systems. I watch patient positioning via cameras, monitor vital signs when available, and stay alert for any signs of patient distress. Most treatments take 10-20 minutes, but I remain fully present throughout.`,
        options: [
          {
            id: 'ask_monitoring_systems',
            text: 'What monitoring systems do you use during treatment?',
            nextNodeId: 'patient_monitoring',
            insightChange: 6
          },
          {
            id: 'ask_emergency_procedures',
            text: 'What happens if something goes wrong during treatment?',
            nextNodeId: 'emergency_protocols',
            insightChange: 7
          }
        ]
      },
      'imaging_verification': {
        id: 'imaging_verification',
        mentorId: 'garcia',
        text: `Before each treatment, we acquire verification images - either portal images or cone-beam CT scans. These get compared to the reference images from simulation. If the patient position differs by more than our tolerance limits, we make corrections. It's like GPS for radiation therapy - ensuring we're hitting the intended target.`,
        options: [
          {
            id: 'ask_tolerance_limits',
            text: 'What are typical tolerance limits for positioning?',
            nextNodeId: 'positioning_tolerances',
            insightChange: 7
          },
          {
            id: 'continue_treatment',
            text: 'Daily verification ensures treatment accuracy.',
            nextNodeId: 'treatment_delivery_process',
            relationshipChange: 2
          }
        ]
      },
      'maintaining_focus': {
        id: 'maintaining_focus',
        mentorId: 'garcia',
        text: `Mindful breaks between patients. Even 30 seconds of conscious breathing helps reset your attention. I also remind myself why we're here - each patient represents someone's hope for tomorrow. That purpose keeps me centered. And honestly, patients give energy back - their courage and gratitude fuel my own resilience.`,
        options: [
          {
            id: 'ask_purpose_connection',
            text: 'How does connecting to purpose change your experience of the work?',
            nextNodeId: 'purpose_driven_practice',
            relationshipChange: 4,
            momentumChange: 2
          },
          {
            id: 'continue_workflow',
            text: 'Mutual exchange of strength between practitioner and patient.',
            nextNodeId: 'treatment_delivery_process',
            relationshipChange: 3
          }
        ]
      },
      'comfort_precision_balance': {
        id: 'comfort_precision_balance',
        mentorId: 'garcia',
        text: `A tense, uncomfortable patient will move more during treatment than a relaxed one. So comfort actually serves precision. We use soft padding, adjust room temperature, provide blankets when appropriate. Sometimes accepting a 1-2mm positioning variation is better than having a patient who can't hold still. Clinical judgment means knowing when to prioritize what.`,
        options: [
          {
            id: 'continue_treatment',
            text: 'Practical wisdom that serves both accuracy and humanity.',
            nextNodeId: 'treatment_delivery_process',
            relationshipChange: 3,
            insightChange: 5
          }
        ]
      },
      'treatment_milestones': {
        id: 'treatment_milestones',
        mentorId: 'garcia',
        text: `Small celebrations matter enormously. Halfway through treatment, we might share a high-five or take a progress photo. Last day of treatment often includes the whole team - therapists, nurses, sometimes even doctors. Patients ring our completion bell, and there's genuine joy in that moment. We've shared a journey toward healing.`,
        options: [
          {
            id: 'ask_team_bonding',
            text: 'How do these shared experiences affect the treatment team?',
            nextNodeId: 'team_connection',
            relationshipChange: 4
          },
          {
            id: 'continue_treatment',
            text: 'Creating meaning within the medical process.',
            nextNodeId: 'treatment_delivery_process',
            relationshipChange: 3
          }
        ]
      },
      'personal_coping': {
        id: 'personal_coping',
        mentorId: 'garcia',
        text: `I practice what I call "purposeful witnessing" - staying present to each patient's experience without taking on their suffering as my own. I also maintain perspective by celebrating the healings we facilitate. Some days are heavy, but most patients get better. Focusing on successful outcomes helps balance the difficult moments.`,
        options: [
          {
            id: 'ask_witnessing_practice',
            text: 'Tell me more about purposeful witnessing.',
            nextNodeId: 'witnessing_practice',
            insightChange: 8,
            momentumChange: 2,
            relationshipChange: 4
          },
          {
            id: 'continue_treatment',
            text: 'Holding space without taking on emotional burden.',
            nextNodeId: 'treatment_delivery_process',
            relationshipChange: 3
          }
        ]
      },
      'mindful_treatment': {
        id: 'mindful_treatment',
        mentorId: 'garcia',
        text: `It starts with intention - before each patient, I take a moment to set the purpose of creating healing space. During positioning, I stay aware of my own presence and how it affects the patient. Some patients are sensitive to energy and atmosphere. When you approach treatment with genuine care and focused attention, patients feel it.`,
        options: [
          {
            id: 'ask_energy_awareness',
            text: 'What do you mean by patients being sensitive to energy?',
            nextNodeId: 'energy_sensitivity',
            insightChange: 10,
            relationshipChange: 4,
            momentumChange: 2
          },
          {
            id: 'continue_treatment',
            text: 'Intentional presence as part of therapeutic care.',
            nextNodeId: 'treatment_delivery_process',
            relationshipChange: 3
          }
        ]
      },
      'individualized_approaches': {
        id: 'individualized_approaches',
        mentorId: 'garcia',
        text: `Every patient teaches us something new. A musician might need special attention to preserve hand function. A teacher might prioritize vocal cord sparing. Parents often push through side effects differently than patients without children. The treatment plan provides the framework, but human factors guide the execution.`,
        options: [
          {
            id: 'continue_treatment',
            text: 'Technical excellence serving individual human needs.',
            nextNodeId: 'treatment_delivery_process',
            relationshipChange: 3,
            insightChange: 5
          }
        ]
      },
      'patient_monitoring': {
        id: 'patient_monitoring',
        mentorId: 'garcia',
        text: `Multiple video cameras provide real-time patient observation. Audio monitoring allows communication throughout treatment. Some patients have respiratory gating systems that sync beam delivery with breathing. For longer treatments, we might use pulse oximetry or other vital sign monitors. Technology serves the human connection.`,
        options: [
          {
            id: 'ask_communication_during',
            text: 'How do you communicate with patients during treatment?',
            nextNodeId: 'treatment_communication',
            relationshipChange: 3
          },
          {
            id: 'continue_safety',
            text: 'Comprehensive monitoring for patient safety.',
            nextNodeId: 'emergency_protocols',
            insightChange: 5
          }
        ]
      },
      'emergency_protocols': {
        id: 'emergency_protocols',
        mentorId: 'garcia',
        text: `Multiple safety systems protect patients. If a patient moves unexpectedly, we can pause treatment instantly. Medical emergencies trigger immediate beam termination and rapid room entry. All staff are trained in emergency response. But prevention is key - good patient education and comfort measures minimize emergency situations.`,
        options: [
          {
            id: 'ask_prevention_focus',
            text: 'How does prevention-focused care improve outcomes?',
            nextNodeId: 'prevention_philosophy',
            insightChange: 7,
            relationshipChange: 3
          },
          {
            id: 'finish_comprehensive',
            text: 'Safety through technology and human awareness.',
            nextNodeId: 'treatment_conclusion',
            relationshipChange: 2
          }
        ]
      },
      'positioning_tolerances': {
        id: 'positioning_tolerances',
        mentorId: 'garcia',
        text: `Typical tolerances are 2-3mm for most treatments, though some specialized procedures require sub-millimeter precision. The tolerance reflects the balance between achievable accuracy and clinical necessity. A brain metastasis might need 1mm precision, while a palliative bone treatment might accept 5mm. Clinical context guides technical requirements.`,
        options: [
          {
            id: 'continue_treatment',
            text: 'Precision requirements matched to clinical need.',
            nextNodeId: 'treatment_delivery_process',
            relationshipChange: 2,
            insightChange: 5
          }
        ]
      },
      'purpose_driven_practice': {
        id: 'purpose_driven_practice',
        mentorId: 'garcia',
        text: `When you remember that each calculation might extend someone's life, each positioning adjustment might prevent a complication, the work transforms from technical task to sacred service. That consciousness elevates performance - you notice details more clearly, anticipate problems better, and find energy even during difficult cases.`,
        options: [
          {
            id: 'continue_treatment',
            text: 'Sacred service through technical excellence.',
            nextNodeId: 'treatment_delivery_process',
            relationshipChange: 4,
            momentumChange: 2
          }
        ]
      },
      'team_connection': {
        id: 'team_connection',
        mentorId: 'garcia',
        text: `Shared purpose creates deep bonds. When you've worked together to help someone through treatment, celebrating their recovery becomes meaningful for the whole team. These experiences remind us why we chose this field and strengthen our commitment to excellence. Healing is collaborative work.`,
        options: [
          {
            id: 'continue_treatment',
            text: 'Collective commitment to healing excellence.',
            nextNodeId: 'treatment_delivery_process',
            relationshipChange: 4
          }
        ]
      },
      'witnessing_practice': {
        id: 'witnessing_practice',
        mentorId: 'garcia',
        text: `Purposeful witnessing means staying fully present to someone's experience without trying to fix their emotions or absorb their pain. You offer compassionate attention while maintaining professional boundaries. It's deeply respectful - acknowledging their struggle without diminishing it or taking it on yourself.`,
        options: [
          {
            id: 'continue_treatment',
            text: 'Compassionate presence within professional boundaries.',
            nextNodeId: 'treatment_delivery_process',
            relationshipChange: 4,
            insightChange: 6
          }
        ]
      },
      'energy_sensitivity': {
        id: 'energy_sensitivity',
        mentorId: 'garcia',
        text: `Some patients are particularly sensitive to the emotional atmosphere around them. When staff are stressed or distracted, patients sense it and become more anxious. But when you approach with calm confidence and genuine care, that peaceful energy is palpable. It's not mystical - it's human responsiveness to emotional cues.`,
        options: [
          {
            id: 'continue_treatment',
            text: 'Human connection affecting treatment outcomes.',
            nextNodeId: 'treatment_delivery_process',
            relationshipChange: 4,
            insightChange: 6
          }
        ]
      },
      'treatment_communication': {
        id: 'treatment_communication',
        mentorId: 'garcia',
        text: `We maintain constant communication. "The machine is moving now - everything's normal." "Halfway through this field, you're doing great." For anxious patients, I might count down the remaining time. The goal is ensuring they never feel alone or uncertain about what's happening.`,
        options: [
          {
            id: 'continue_safety',
            text: 'Communication reducing anxiety and improving cooperation.',
            nextNodeId: 'emergency_protocols',
            relationshipChange: 3
          }
        ]
      },
      'prevention_philosophy': {
        id: 'prevention_philosophy',
        mentorId: 'garcia',
        text: `Prevention-focused care means anticipating needs before they become problems. Comfortable patients move less. Well-informed patients cooperate better. Emotionally supported patients tolerate side effects more effectively. When you address the whole person, technical outcomes improve organically.`,
        options: [
          {
            id: 'finish_comprehensive',
            text: 'Holistic care supporting technical excellence.',
            nextNodeId: 'treatment_conclusion',
            relationshipChange: 4,
            insightChange: 7
          }
        ]
      },
      'treatment_conclusion': {
        id: 'treatment_conclusion',
        mentorId: 'garcia',
        text: `This room represents the integration of everything we do - technical precision serving human healing. The physics, the planning, the quality assurance, all culminate here in these moments of therapeutic delivery. When you work in this room, you'll understand that medical physics is ultimately about hope made manifest through scientific precision.`,
        options: [
          {
            id: 'treatment_finish',
            text: 'Thank you, Dr. Garcia. I understand now why this room feels sacred.',
            isEndNode: true,
            relationshipChange: 5,
            insightChange: 10,
            momentumChange: 3
          }
        ]
      }
    }
  },

  'linac-1-activity_challenge': {
    id: 'linac-1-activity_challenge',
    title: 'LINAC Room 1 Challenge',
    description: 'Clinical challenge in LINAC Room 1',
    startNodeId: 'treatment_challenge_start',
    domain: 'radiation_therapy',
    difficulty: 2,
    mode: DialogueMode.CHALLENGE,
    nodes: {
      'treatment_challenge_start': {
        id: 'treatment_challenge_start',
        mentorId: 'quinn',
        text: `LINAC Room 1 is where theory meets practice. Let's see how well you can apply your knowledge to real clinical scenarios.`,
        options: [
          {
            id: 'begin_treatment_challenge',
            text: 'I\'m ready to begin.',
            nextNodeId: 'treatment_complete',
            triggersActivity: true
          }
        ]
      },
      'treatment_complete': {
        id: 'treatment_complete',
        mentorId: 'quinn',
        text: `Well done. Each patient presents unique challenges that require both knowledge and intuition.`,
        options: [
          {
            id: 'finish_treatment',
            text: 'I\'m learning so much.',
            isEndNode: true,
            momentumChange: 2,
            relationshipChange: 3
          }
        ]
      }
    }
  },

  'dosimetry-lab-intro': {
    id: 'dosimetry-lab-intro',
    title: 'Dosimetry Lab Quality Standards',
    description: 'Introduction to precision measurement with Dr. Kapoor',
    startNodeId: 'dosimetry_lab_start',
    domain: 'dosimetry',
    difficulty: 1,
    mode: DialogueMode.NARRATIVE,
    nodes: {
      'dosimetry_lab_start': {
        id: 'dosimetry_lab_start',
        mentorId: 'kapoor',
        text: `Welcome to the dosimetry laboratory. This is where measurement meets certainty, where every dose calculation is validated against absolute standards. In medical physics, precision is not optional - it is the foundation upon which patient safety rests.`,
        options: [
          {
            id: 'ask_precision_standards',
            text: 'What level of precision do you maintain here?',
            nextNodeId: 'precision_standards'
          },
          {
            id: 'ask_lab_equipment',
            text: 'Tell me about the measurement equipment.',
            nextNodeId: 'dosimetry_equipment'
          }
        ]
      },
      'precision_standards': {
        id: 'precision_standards',
        mentorId: 'kapoor',
        text: `We follow TG-51 protocols religiously. Ion chamber calibrations traceable to national standards, with uncertainties below 1.5%. Temperature and pressure corrections applied systematically. Every measurement documented, verified, and cross-checked. There is no room for approximation when radiation dose directly affects patient outcomes.`,
        options: [
          {
            id: 'ask_tg51_details',
            text: 'Explain the TG-51 protocol to me.',
            nextNodeId: 'tg51_protocol',
            insightChange: 8
          },
          {
            id: 'ask_calibration_chain',
            text: 'How do you maintain traceability to national standards?',
            nextNodeId: 'calibration_traceability',
            insightChange: 6
          }
        ]
      },
      'dosimetry_equipment': {
        id: 'dosimetry_equipment',
        mentorId: 'kapoor',
        text: `These ion chambers are calibrated annually at the National Institute of Standards and Technology. The electrometer measures charge to picoampere precision. Our reference-class dosimeters have stability better than 0.3% over time. Each instrument serves a specific purpose in our measurement protocols.`,
        options: [
          {
            id: 'ask_ion_chambers',
            text: 'What makes these ion chambers special?',
            nextNodeId: 'ion_chamber_specifications',
            insightChange: 7
          },
          {
            id: 'ask_stability_maintenance',
            text: 'How do you maintain such precise stability?',
            nextNodeId: 'stability_protocols',
            relationshipChange: 2
          }
        ]
      },
      'tg51_protocol': {
        id: 'tg51_protocol',
        mentorId: 'kapoor',
        text: `TG-51 establishes the foundation for all clinical dosimetry. We measure absorbed dose to water using cavity ionization theory. The calibration coefficient converts ion chamber readings to absorbed dose. Environmental corrections for temperature, pressure, and humidity ensure accuracy. This protocol has served medical physics for decades.`,
        options: [
          {
            id: 'ask_cavity_theory',
            text: 'Explain cavity ionization theory.',
            nextNodeId: 'cavity_theory_explanation',
            insightChange: 10,
            discoversConceptId: 'cavity_theory'
          },
          {
            id: 'ask_environmental_corrections',
            text: 'Why are environmental corrections so critical?',
            nextNodeId: 'environmental_corrections',
            insightChange: 6
          }
        ]
      },
      'calibration_traceability': {
        id: 'calibration_traceability',
        mentorId: 'kapoor',
        text: `Our primary standard ion chamber is calibrated directly at NIST using 60-Co gamma rays. Secondary standards are cross-calibrated against the primary. Field instruments are calibrated against secondaries. This creates an unbroken chain from national standard to clinical measurement. Documentation accompanies every step.`,
        options: [
          {
            id: 'ask_cobalt_standard',
            text: 'Why use 60-Co as the calibration standard?',
            nextNodeId: 'cobalt_standard_explanation',
            insightChange: 8
          },
          {
            id: 'ask_documentation_requirements',
            text: 'What documentation is required for traceability?',
            nextNodeId: 'documentation_protocols',
            relationshipChange: 2
          }
        ]
      },
      'ion_chamber_specifications': {
        id: 'ion_chamber_specifications',
        mentorId: 'kapoor',
        text: `These Farmer-type cylindrical chambers have graphite walls and aluminum electrodes. The sensitive volume is precisely 0.6 cubic centimeters. Response is linear over six orders of magnitude. Temperature coefficient is known to 0.1%/°C. Each chamber has individual calibration factors and correction coefficients.`,
        options: [
          {
            id: 'ask_chamber_design',
            text: 'Why this specific chamber design?',
            nextNodeId: 'chamber_design_rationale',
            insightChange: 7
          },
          {
            id: 'ask_response_linearity',
            text: 'How do you verify response linearity?',
            nextNodeId: 'linearity_testing',
            insightChange: 6
          }
        ]
      },
      'stability_protocols': {
        id: 'stability_protocols',
        mentorId: 'kapoor',
        text: `Daily constancy checks using check sources. Monthly comprehensive testing including leakage, stability, and response verification. Annual calibrations at accredited laboratories. Environmental monitoring with temperature and humidity logging. Any deviation exceeding 1% triggers investigation and recalibration.`,
        options: [
          {
            id: 'ask_constancy_testing',
            text: 'Describe the daily constancy check procedure.',
            nextNodeId: 'constancy_procedures',
            insightChange: 6
          },
          {
            id: 'ask_deviation_investigation',
            text: 'What happens when you find a deviation?',
            nextNodeId: 'deviation_protocols',
            relationshipChange: 2
          }
        ]
      },
      'cavity_theory_explanation': {
        id: 'cavity_theory_explanation',
        mentorId: 'kapoor',
        text: `The ion chamber represents a small cavity in the medium. According to Bragg-Gray theory, the dose to the cavity equals the dose to the medium multiplied by the ratio of mass stopping powers. Spencer-Attix theory refines this for finite cavity sizes. The cavity must be small enough not to perturb the radiation field.`,
        options: [
          {
            id: 'ask_bragg_gray_conditions',
            text: 'What conditions must be met for Bragg-Gray theory?',
            nextNodeId: 'bragg_gray_conditions',
            insightChange: 10,
            discoversConceptId: 'bragg_gray_theory'
          },
          {
            id: 'continue_protocols',
            text: 'The theoretical foundation is elegant.',
            nextNodeId: 'measurement_protocols',
            relationshipChange: 3
          }
        ]
      },
      'environmental_corrections': {
        id: 'environmental_corrections',
        mentorId: 'kapoor',
        text: `Ion chamber response depends on air density in the sensitive volume. Temperature affects gas expansion, pressure affects gas density, humidity affects electron attachment. The kTP correction factor accounts for these variations. Standard conditions are 22°C and 101.3 kPa. Corrections can reach 5% under extreme conditions.`,
        options: [
          {
            id: 'ask_ktp_calculation',
            text: 'How is the kTP correction calculated?',
            nextNodeId: 'ktp_calculation',
            insightChange: 8
          },
          {
            id: 'continue_protocols',
            text: 'Environmental control is crucial for accuracy.',
            nextNodeId: 'measurement_protocols',
            relationshipChange: 2
          }
        ]
      },
      'cobalt_standard_explanation': {
        id: 'cobalt_standard_explanation',
        mentorId: 'kapoor',
        text: `60-Co provides a stable, well-characterized gamma ray spectrum with 1.25 MeV average energy. The half-life of 5.27 years ensures long-term stability. The source geometry is well-defined for primary standardization. Most clinical beams can be referenced back to this 60-Co standard through beam quality conversion factors.`,
        options: [
          {
            id: 'ask_beam_quality_factors',
            text: 'Explain beam quality conversion factors.',
            nextNodeId: 'beam_quality_conversion',
            insightChange: 8
          },
          {
            id: 'continue_protocols',
            text: 'A stable reference point for all measurements.',
            nextNodeId: 'measurement_protocols',
            relationshipChange: 2
          }
        ]
      },
      'documentation_protocols': {
        id: 'documentation_protocols',
        mentorId: 'kapoor',
        text: `Every calibration certificate, every measurement log, every correction factor is preserved. Chain of custody forms accompany instruments during calibration. Environmental conditions are recorded for each measurement. Uncertainty budgets are calculated and documented. Regulatory inspectors must be able to verify our processes years later.`,
        options: [
          {
            id: 'ask_uncertainty_analysis',
            text: 'How do you calculate measurement uncertainties?',
            nextNodeId: 'uncertainty_budgets',
            insightChange: 8
          },
          {
            id: 'continue_protocols',
            text: 'Meticulous documentation ensures scientific integrity.',
            nextNodeId: 'measurement_protocols',
            relationshipChange: 3
          }
        ]
      },
      'chamber_design_rationale': {
        id: 'chamber_design_rationale',
        mentorId: 'kapoor',
        text: `Graphite walls are tissue-equivalent for megavoltage beams. Cylindrical geometry provides uniform response. The 0.6 cc volume is small enough to avoid significant beam attenuation yet large enough for stable readings. Aluminum central electrode minimizes perturbation. Every design element serves measurement accuracy.`,
        options: [
          {
            id: 'ask_tissue_equivalence',
            text: 'What makes graphite tissue-equivalent?',
            nextNodeId: 'tissue_equivalence',
            insightChange: 7
          },
          {
            id: 'continue_testing',
            text: 'Engineering optimized for measurement precision.',
            nextNodeId: 'linearity_testing',
            relationshipChange: 2
          }
        ]
      },
      'linearity_testing': {
        id: 'linearity_testing',
        mentorId: 'kapoor',
        text: `We test linearity using variable dose rate measurements and different source-to-detector distances. Response should be proportional to dose rate across six orders of magnitude. Any non-linearity exceeding 1% indicates chamber problems. Most modern chambers maintain linearity within 0.3% across their full range.`,
        options: [
          {
            id: 'continue_protocols',
            text: 'Comprehensive testing ensures measurement reliability.',
            nextNodeId: 'measurement_protocols',
            relationshipChange: 2
          }
        ]
      },
      'constancy_procedures': {
        id: 'constancy_procedures',
        mentorId: 'kapoor',
        text: `Each morning, we measure a strontium-90 check source with our reference chamber. The reading should be within 1% of the established baseline. We record environmental conditions, calculate any corrections, and document the result. Any deviation triggers immediate investigation before clinical measurements begin.`,
        options: [
          {
            id: 'ask_check_source_choice',
            text: 'Why use strontium-90 for constancy checks?',
            nextNodeId: 'check_source_rationale',
            insightChange: 6
          },
          {
            id: 'continue_protocols',
            text: 'Daily vigilance maintains measurement integrity.',
            nextNodeId: 'measurement_protocols',
            relationshipChange: 2
          }
        ]
      },
      'deviation_protocols': {
        id: 'deviation_protocols',
        mentorId: 'kapoor',
        text: `First, we verify environmental conditions and repeat the measurement. If deviation persists, we test with multiple chambers and check sources. Electrical leakage, temperature effects, and contamination are investigated. The chamber is removed from service until the problem is identified and corrected. Patient safety cannot be compromised.`,
        options: [
          {
            id: 'continue_protocols',
            text: 'Zero tolerance for measurement uncertainty.',
            nextNodeId: 'measurement_protocols',
            relationshipChange: 3
          }
        ]
      },
      'bragg_gray_conditions': {
        id: 'bragg_gray_conditions',
        mentorId: 'kapoor',
        text: `The cavity must be small compared to the range of secondary electrons. Charged particle equilibrium must exist at the cavity location. The cavity should not significantly perturb the radiation field. When these conditions are met, the dose to the gas equals the dose to the surrounding medium times the stopping power ratio.`,
        options: [
          {
            id: 'continue_protocols',
            text: 'Fundamental physics underlying all dosimetry.',
            nextNodeId: 'measurement_protocols',
            relationshipChange: 3,
            insightChange: 5
          }
        ]
      },
      'measurement_protocols': {
        id: 'measurement_protocols',
        mentorId: 'kapoor',
        text: `Our clinical measurement protocol is systematic and thorough. Machine warm-up, environmental recording, chamber setup with precise positioning, multiple readings with statistical analysis, correction factor application, and final dose calculation. Each step is documented and verified. Reproducibility must be within 0.5%.`,
        options: [
          {
            id: 'ask_statistical_analysis',
            text: 'How do you handle statistical variations in readings?',
            nextNodeId: 'statistical_protocols',
            insightChange: 6
          },
          {
            id: 'ask_clinical_implementation',
            text: 'How do these measurements translate to clinical practice?',
            nextNodeId: 'clinical_implementation',
            relationshipChange: 2
          }
        ]
      },
      'ktp_calculation': {
        id: 'ktp_calculation',
        mentorId: 'kapoor',
        text: `kTP equals (273.2 + T)/(273.2 + 22) times 101.3/P, where T is temperature in Celsius and P is pressure in kilopascals. This corrects chamber response to standard conditions. We measure temperature and pressure at each calibration and apply this correction to all dose calculations.`,
        options: [
          {
            id: 'continue_protocols',
            text: 'Precise environmental corrections ensure accuracy.',
            nextNodeId: 'measurement_protocols',
            relationshipChange: 2
          }
        ]
      },
      'beam_quality_conversion': {
        id: 'beam_quality_conversion',
        mentorId: 'kapoor',
        text: `The kQ factor converts from 60-Co calibration to clinical beam quality. It accounts for differences in photon energy spectra between the calibration beam and the clinical beam. Determined by calculating the ratio of chamber responses in the two beam qualities. Typically ranges from 0.99 to 1.04 for clinical beams.`,
        options: [
          {
            id: 'continue_protocols',
            text: 'Bridging calibration standards to clinical reality.',
            nextNodeId: 'measurement_protocols',
            relationshipChange: 2
          }
        ]
      },
      'uncertainty_budgets': {
        id: 'uncertainty_budgets',
        mentorId: 'kapoor',
        text: `We calculate Type A uncertainties from statistical analysis and Type B uncertainties from systematic effects. Calibration uncertainty, positioning uncertainty, environmental corrections, ion recombination, polarity effects - each component is quantified. Combined standard uncertainty is typically 1.5% for clinical dosimetry.`,
        options: [
          {
            id: 'continue_protocols',
            text: 'Rigorous uncertainty analysis ensures scientific credibility.',
            nextNodeId: 'measurement_protocols',
            relationshipChange: 3
          }
        ]
      },
      'tissue_equivalence': {
        id: 'tissue_equivalence',
        mentorId: 'kapoor',
        text: `Graphite has similar atomic composition to tissue for megavoltage photons. The effective atomic number and electron density closely match tissue values. This ensures that the chamber perturbs the radiation field minimally and that dose-to-gas measurements accurately reflect dose-to-tissue.`,
        options: [
          {
            id: 'continue_testing',
            text: 'Material science serving measurement accuracy.',
            nextNodeId: 'linearity_testing',
            relationshipChange: 2
          }
        ]
      },
      'check_source_rationale': {
        id: 'check_source_rationale',
        mentorId: 'kapoor',
        text: `Strontium-90 provides stable beta radiation with a 28-year half-life. The decay is predictable and well-characterized. Beta radiation tests chamber and electrometer response without requiring a radiation vault. Daily constancy checks with Sr-90 detect chamber drift or electronic problems immediately.`,
        options: [
          {
            id: 'continue_protocols',
            text: 'Practical solution for daily quality assurance.',
            nextNodeId: 'measurement_protocols',
            relationshipChange: 2
          }
        ]
      },
      'statistical_protocols': {
        id: 'statistical_protocols',
        mentorId: 'kapoor',
        text: `We take a minimum of ten readings and calculate mean, standard deviation, and standard error. Outliers exceeding two standard deviations are investigated and potentially excluded. The final result includes the mean value with its statistical uncertainty. Reproducibility better than 0.3% indicates proper measurement technique.`,
        options: [
          {
            id: 'ask_qa_philosophy',
            text: 'How do these protocols ensure patient safety?',
            nextNodeId: 'safety_through_precision',
            relationshipChange: 3
          },
          {
            id: 'continue_clinical',
            text: 'Statistical rigor supporting clinical confidence.',
            nextNodeId: 'clinical_implementation',
            insightChange: 5
          }
        ]
      },
      'clinical_implementation': {
        id: 'clinical_implementation',
        mentorId: 'kapoor',
        text: `These measurements directly calibrate the treatment machines. Our dose calculations become the foundation for every treatment plan. When Dr. Garcia delivers 200 cGy to a patient, that dose is traceable through our protocols back to national standards. Measurement precision translates to treatment accuracy.`,
        options: [
          {
            id: 'ask_machine_calibration',
            text: 'How do you calibrate the clinical machines?',
            nextNodeId: 'machine_calibration',
            insightChange: 8
          },
          {
            id: 'finish_comprehensive',
            text: 'Measurement science serving patient care.',
            nextNodeId: 'dosimetry_conclusion',
            relationshipChange: 3
          }
        ]
      },
      'safety_through_precision': {
        id: 'safety_through_precision',
        mentorId: 'kapoor',
        text: `Patient safety depends on dose accuracy. A 5% overdose might cause unnecessary complications. A 5% underdose might compromise tumor control. Our measurement protocols eliminate systematic errors and minimize random uncertainties. When dose delivery matches dose prescription within 2%, we have done our job correctly.`,
        options: [
          {
            id: 'ask_dose_tolerances',
            text: 'What dose delivery tolerances do you maintain?',
            nextNodeId: 'clinical_tolerances',
            insightChange: 6
          },
          {
            id: 'continue_clinical',
            text: 'Precision as the foundation of patient safety.',
            nextNodeId: 'clinical_implementation',
            relationshipChange: 3
          }
        ]
      },
      'machine_calibration': {
        id: 'machine_calibration',
        mentorId: 'kapoor',
        text: `Monthly calibration measurements using our reference dosimetry setup. We measure dose rate, beam flatness, symmetry, and energy consistency. Output is adjusted to maintain 1 cGy per monitor unit at the calibration conditions. Any drift exceeding 2% triggers immediate recalibration before clinical use resumes.`,
        options: [
          {
            id: 'ask_monitor_units',
            text: 'Explain the monitor unit calibration process.',
            nextNodeId: 'monitor_unit_calibration',
            insightChange: 7
          },
          {
            id: 'finish_comprehensive',
            text: 'Regular calibration maintaining clinical accuracy.',
            nextNodeId: 'dosimetry_conclusion',
            relationshipChange: 2
          }
        ]
      },
      'clinical_tolerances': {
        id: 'clinical_tolerances',
        mentorId: 'kapoor',
        text: `We maintain dose delivery within ±2% of prescription for standard treatments. Stereotactic procedures require ±1% accuracy. Calibration uncertainties, daily variations, and patient setup all contribute to the overall uncertainty budget. Our measurement protocols ensure these tolerances are achievable and maintainable.`,
        options: [
          {
            id: 'continue_calibration',
            text: 'Tight tolerances require exceptional measurement control.',
            nextNodeId: 'machine_calibration',
            relationshipChange: 2
          }
        ]
      },
      'monitor_unit_calibration': {
        id: 'monitor_unit_calibration',
        mentorId: 'kapoor',
        text: `We position our calibrated ion chamber at the standard measurement depth in a water phantom. The machine delivers a preset number of monitor units while we measure the actual dose. The calibration factor adjusts monitor unit calculations so that 100 MU delivers exactly 100 cGy under reference conditions.`,
        options: [
          {
            id: 'finish_comprehensive',
            text: 'Direct calibration linking monitor units to delivered dose.',
            nextNodeId: 'dosimetry_conclusion',
            relationshipChange: 2,
            insightChange: 5
          }
        ]
      },
      'dosimetry_conclusion': {
        id: 'dosimetry_conclusion',
        mentorId: 'kapoor',
        text: `This laboratory represents the scientific foundation of medical physics. Every measurement we make, every protocol we follow, every calibration we perform serves one purpose: ensuring that prescribed dose equals delivered dose. Without measurement science, medical physics would be mere speculation. Here, certainty replaces guesswork.`,
        options: [
          {
            id: 'dosimetry_finish',
            text: 'Thank you, Dr. Kapoor. I appreciate the importance of measurement precision.',
            isEndNode: true,
            relationshipChange: 4,
            insightChange: 10,
            momentumChange: 2
          }
        ]
      }
    }
  },

  'simulation-suite-intro': {
    id: 'simulation-suite-intro',
    title: 'CT Simulation Suite Introduction',
    description: 'Introduction to the CT simulation suite with Jesse',
    startNodeId: 'simulation_intro_start',
    domain: 'linac_anatomy',
    difficulty: 1,
    mode: DialogueMode.NARRATIVE,
    nodes: {
      'simulation_intro_start': {
        id: 'simulation_intro_start',
        mentorId: 'jesse',
        text: `Welcome to our CT simulation suite! This is where every radiation therapy patient's journey begins. Think of it as the blueprint room - before we can deliver precise treatments, we need to understand exactly what we're working with.`,
        options: [
          {
            id: 'explore_ct_scanner',
            text: 'Tell me about the CT scanner setup.',
            nextNodeId: 'ct_scanner_overview'
          },
          {
            id: 'ask_patient_process',
            text: 'What\'s the patient process like here?',
            nextNodeId: 'patient_simulation_process'
          }
        ]
      },
      'ct_scanner_overview': {
        id: 'ct_scanner_overview',
        mentorId: 'jesse',
        text: `This CT scanner is specifically designed for radiation therapy planning. See how the bore is extra wide? 85 cm diameter instead of the usual 70. Why? Because patients need to be positioned exactly as they'll be treated - arms up, immobilization devices, breathing apparatus if needed.`,
        options: [
          {
            id: 'ask_positioning_importance',
            text: 'Why is positioning so critical?',
            nextNodeId: 'positioning_precision',
            insightChange: 6
          },
          {
            id: 'ask_immobilization',
            text: 'What kinds of immobilization devices do you use?',
            nextNodeId: 'immobilization_devices',
            momentumChange: 1
          }
        ]
      },
      'patient_simulation_process': {
        id: 'patient_simulation_process',
        mentorId: 'jesse',
        text: `Every patient follows the same workflow: consultation review, custom immobilization fabrication, contrast protocols if needed, then the actual CT acquisition. The whole process takes about 45 minutes to an hour, but it's the foundation for everything that follows.`,
        options: [
          {
            id: 'ask_contrast_protocols',
            text: 'When do you need contrast agents?',
            nextNodeId: 'contrast_discussion',
            insightChange: 5
          },
          {
            id: 'ask_workflow_details',
            text: 'Walk me through a typical simulation.',
            nextNodeId: 'simulation_workflow',
            relationshipChange: 2
          }
        ]
      },
      'positioning_precision': {
        id: 'positioning_precision',
        mentorId: 'jesse',
        text: `Think about it this way - if we scan a patient lying flat but treat them with arms raised, our dose calculations are worthless. The anatomy shifts, organs move, and suddenly that carefully planned 95% target coverage becomes 70%. Reproducible positioning isn't just nice to have, it's the difference between cure and complication.`,
        options: [
          {
            id: 'ask_reproducibility',
            text: 'How do you ensure the same position every treatment?',
            nextNodeId: 'reproducibility_methods',
            insightChange: 8,
            momentumChange: 1
          },
          {
            id: 'continue_equipment_tour',
            text: 'The precision requirements here are incredible.',
            nextNodeId: 'equipment_tour',
            relationshipChange: 2
          }
        ]
      },
      'immobilization_devices': {
        id: 'immobilization_devices',
        mentorId: 'jesse',
        text: `We've got a whole arsenal: thermoplastic masks for head and neck cases - heated and molded directly to the patient's face and shoulders. Alpha cradles for body positioning - vacuum bags that conform to patient contours. Knee sponges, arm boards, bite blocks. Each device serves one purpose: make today's position tomorrow's position.`,
        options: [
          {
            id: 'ask_mask_creation',
            text: 'How do you create those thermoplastic masks?',
            nextNodeId: 'mask_fabrication',
            insightChange: 6
          },
          {
            id: 'ask_comfort_vs_precision',
            text: 'How do you balance patient comfort with precision?',
            nextNodeId: 'comfort_precision_balance',
            relationshipChange: 3
          }
        ]
      },
      'contrast_discussion': {
        id: 'contrast_discussion',
        mentorId: 'jesse',
        text: `Contrast helps us see what we're aiming at. IV contrast lights up blood vessels and enhances tumors. Oral contrast outlines the GI tract. Rectal contrast for prostate cases shows us exactly where the rectum is relative to the target. Without contrast, we're flying blind in some cases.`,
        options: [
          {
            id: 'ask_contrast_timing',
            text: 'How do you time the contrast injection with scanning?',
            nextNodeId: 'contrast_timing',
            insightChange: 7
          },
          {
            id: 'continue_workflow',
            text: 'Contrast really does make targets more visible.',
            nextNodeId: 'simulation_workflow',
            relationshipChange: 1
          }
        ]
      },
      'simulation_workflow': {
        id: 'simulation_workflow',
        mentorId: 'jesse',
        text: `Here's a typical brain case: patient arrives, we review the prescription and setup instructions. Custom thermoplastic mask gets fabricated and fitted. Patient positioned supine, arms at sides, mask secured to the table. We do a quick topogram to verify positioning, then acquire the planning CT with 1.25mm slice thickness.`,
        options: [
          {
            id: 'ask_slice_thickness',
            text: 'Why such thin slices for planning?',
            nextNodeId: 'slice_thickness_importance',
            insightChange: 6
          },
          {
            id: 'ask_next_steps',
            text: 'What happens after the CT acquisition?',
            nextNodeId: 'post_simulation_workflow',
            momentumChange: 2
          }
        ]
      },
      'reproducibility_methods': {
        id: 'reproducibility_methods',
        mentorId: 'jesse',
        text: `Everything gets documented and indexed. We take reference photos, record couch coordinates, note immobilization device settings. Each treatment table has indexing systems - grooves and bars that lock accessories into identical positions. It's like a recipe that must be followed exactly every time.`,
        options: [
          {
            id: 'ask_setup_verification',
            text: 'How do you verify setup accuracy during treatment?',
            nextNodeId: 'daily_setup_verification',
            insightChange: 8
          },
          {
            id: 'continue_tour',
            text: 'The attention to detail is impressive.',
            nextNodeId: 'equipment_tour',
            relationshipChange: 2
          }
        ]
      },
      'equipment_tour': {
        id: 'equipment_tour',
        mentorId: 'jesse',
        text: `Let me show you the planning workstations. These aren't just any computers - they're running treatment planning systems that can model radiation dose distribution down to individual voxels. Dr. Quinn spends hours here optimizing plans, but it all starts with the quality of the simulation data we provide.`,
        options: [
          {
            id: 'ask_data_transfer',
            text: 'How does the simulation data get to planning?',
            nextNodeId: 'data_integration',
            insightChange: 6
          },
          {
            id: 'ask_planning_connection',
            text: 'How does simulation connect to the overall treatment process?',
            nextNodeId: 'treatment_chain',
            momentumChange: 2,
            relationshipChange: 1
          }
        ]
      },
      'mask_fabrication': {
        id: 'mask_fabrication',
        mentorId: 'jesse',
        text: `The thermoplastic comes in perforated sheets. We heat it in a water bath to about 70°C until it becomes pliable, then drape it over the patient's face and gently press it into contours. Takes about 5 minutes to cool and harden. The result is a custom mask that fits only that patient, ensuring identical head position every treatment.`,
        options: [
          {
            id: 'ask_patient_experience',
            text: 'What\'s that like for the patient?',
            nextNodeId: 'patient_experience_discussion',
            relationshipChange: 3
          },
          {
            id: 'continue_devices',
            text: 'Custom fabrication for every patient - that must take significant time.',
            nextNodeId: 'time_investment',
            insightChange: 4
          }
        ]
      },
      'comfort_precision_balance': {
        id: 'comfort_precision_balance',
        mentorId: 'jesse',
        text: `That's the art of this job. A patient who's uncomfortable will move during treatment, so comfort actually serves precision. We explain every step, use padding where possible, and sometimes compromise slightly on the ideal position for something the patient can maintain. A reproducible 99% position beats a perfect position the patient can't hold.`,
        options: [
          {
            id: 'ask_patient_education',
            text: 'How do you help patients understand why positioning matters?',
            nextNodeId: 'patient_education',
            relationshipChange: 4
          },
          {
            id: 'continue_tour',
            text: 'Practical wisdom - perfection that works beats ideal theory.',
            nextNodeId: 'equipment_tour',
            relationshipChange: 3,
            momentumChange: 1
          }
        ]
      },
      'contrast_timing': {
        id: 'contrast_timing',
        mentorId: 'jesse',
        text: `Timing is everything. For IV contrast, we want peak enhancement during scanning - usually 60-90 seconds post-injection for most body sites. We start the injection, count down, then begin the scan sequence. For oral contrast, patients drink it 45-60 minutes before scanning to allow GI tract opacification.`,
        options: [
          {
            id: 'ask_protocol_variations',
            text: 'Do protocols vary by cancer type?',
            nextNodeId: 'protocol_customization',
            insightChange: 7
          },
          {
            id: 'continue_workflow',
            text: 'Precise timing for optimal imaging - makes sense.',
            nextNodeId: 'post_simulation_workflow',
            relationshipChange: 1
          }
        ]
      },
      'slice_thickness_importance': {
        id: 'slice_thickness_importance',
        mentorId: 'jesse',
        text: `Think of it like image resolution. Thicker slices might miss small structures or create stair-step artifacts in 3D reconstructions. With 1.25mm slices, we capture fine anatomical detail and smooth dose gradients. The trade-off is larger file sizes and longer reconstruction times, but when you're targeting a 2cm tumor next to critical structures, that detail matters.`,
        options: [
          {
            id: 'ask_data_size',
            text: 'How do you manage such large datasets?',
            nextNodeId: 'data_management',
            insightChange: 6
          },
          {
            id: 'continue_next_steps',
            text: 'Detail that could save lives - worth the extra processing time.',
            nextNodeId: 'post_simulation_workflow',
            relationshipChange: 2
          }
        ]
      },
      'post_simulation_workflow': {
        id: 'post_simulation_workflow',
        mentorId: 'jesse',
        text: `Once we have clean images, they get transferred to the treatment planning system where Dr. Quinn and the physicians contour target volumes and organs at risk. The simulation coordinates become the reference point for everything - plan optimization, dose calculations, and daily patient setup. We're essentially creating a 3D map of the patient.`,
        options: [
          {
            id: 'ask_coordinate_systems',
            text: 'How do coordinate systems work between simulation and treatment?',
            nextNodeId: 'coordinate_systems',
            insightChange: 8
          },
          {
            id: 'finish_comprehensive',
            text: 'This really is the foundation for the entire treatment process.',
            nextNodeId: 'simulation_conclusion',
            relationshipChange: 3,
            momentumChange: 2
          }
        ]
      },
      'daily_setup_verification': {
        id: 'daily_setup_verification',
        mentorId: 'jesse',
        text: `Every treatment starts with image guidance. We take kV or CBCT images right on the treatment table and compare them to the simulation reference images. Bony anatomy, soft tissue, even implanted fiducial markers can be matched. If setup differs by more than 2-3mm, we shift the patient to match the simulation position exactly.`,
        options: [
          {
            id: 'ask_igrt_technology',
            text: 'Tell me more about image-guided radiation therapy.',
            nextNodeId: 'igrt_explanation',
            insightChange: 10,
            discoversConceptId: 'image_guidance'
          },
          {
            id: 'continue_discussion',
            text: 'Daily verification ensures the simulation accuracy translates to treatment.',
            nextNodeId: 'treatment_chain',
            relationshipChange: 2
          }
        ]
      },
      'data_integration': {
        id: 'data_integration',
        mentorId: 'jesse',
        text: `Everything flows through DICOM - Digital Imaging and Communications in Medicine. The CT images, patient position data, and reference coordinates all get packaged and sent to the treatment planning system. It's like a digital chain of custody, ensuring the plan is based on exactly what we acquired here.`,
        options: [
          {
            id: 'ask_dicom_details',
            text: 'How does DICOM ensure data integrity?',
            nextNodeId: 'dicom_integrity',
            insightChange: 7
          },
          {
            id: 'continue_connection',
            text: 'Seamless data flow from simulation to treatment.',
            nextNodeId: 'treatment_chain',
            relationshipChange: 1
          }
        ]
      },
      'treatment_chain': {
        id: 'treatment_chain',
        mentorId: 'jesse',
        text: `It's all connected. Simulation provides the foundation, planning optimizes the approach, and treatment delivery executes the plan. But here's the thing - garbage in, garbage out. If our simulation isn't precise, if our images aren't clean, if our positioning isn't reproducible, everything downstream suffers. That's why this room is so critical.`,
        options: [
          {
            id: 'ask_quality_control',
            text: 'How do you maintain quality throughout the chain?',
            nextNodeId: 'quality_assurance',
            insightChange: 8
          },
          {
            id: 'finish_comprehensive',
            text: 'Every step builds on the foundation you create here.',
            nextNodeId: 'simulation_conclusion',
            relationshipChange: 3,
            momentumChange: 2
          }
        ]
      },
      'patient_experience_discussion': {
        id: 'patient_experience_discussion',
        mentorId: 'jesse',
        text: `Most patients are nervous about the mask. I explain it like a custom-fitted helmet - it might feel snug, but it's protecting them by ensuring accurate treatment. Some feel claustrophobic initially, but we work with them, maybe make practice masks, or adjust the fitting technique. Patient comfort directly impacts treatment success.`,
        options: [
          {
            id: 'continue_empathy',
            text: 'Your approach shows real understanding of the patient experience.',
            nextNodeId: 'patient_care_philosophy',
            relationshipChange: 4
          }
        ]
      },
      'time_investment': {
        id: 'time_investment',
        mentorId: 'jesse',
        text: `About 15-20 minutes per mask, but it's time well spent. Compare that to the potential consequences of poor positioning - missed targets, overdosed normal tissue, treatment delays. The upfront time investment pays dividends throughout the entire treatment course.`,
        options: [
          {
            id: 'continue_tour',
            text: 'Prevention through preparation - smart approach.',
            nextNodeId: 'equipment_tour',
            relationshipChange: 2
          }
        ]
      },
      'patient_education': {
        id: 'patient_education',
        mentorId: 'jesse',
        text: `I use simple analogies. "We're creating a blueprint for your treatment. Just like building a house, if the foundation is off, everything else is crooked." Most patients understand that precision matters when targeting cancer cells while sparing healthy tissue. Knowledge reduces anxiety.`,
        options: [
          {
            id: 'continue_philosophy',
            text: 'Clear communication builds trust and cooperation.',
            nextNodeId: 'patient_care_philosophy',
            relationshipChange: 3
          }
        ]
      },
      'protocol_customization': {
        id: 'protocol_customization',
        mentorId: 'jesse',
        text: `Absolutely. Prostate protocols include rectal contrast and full bladder. Lung protocols might use 4D-CT to capture breathing motion. Head and neck cases often need dental work evaluation before contrast. Each cancer site has specific imaging requirements based on anatomy and treatment technique.`,
        options: [
          {
            id: 'ask_4d_ct',
            text: 'Tell me about 4D-CT for lung cases.',
            nextNodeId: 'four_d_ct_explanation',
            insightChange: 10,
            discoversConceptId: 'motion_management'
          },
          {
            id: 'continue_workflow',
            text: 'Customized protocols for different treatment sites make sense.',
            nextNodeId: 'post_simulation_workflow',
            relationshipChange: 1
          }
        ]
      },
      'data_management': {
        id: 'data_management',
        mentorId: 'jesse',
        text: `Modern planning CT datasets can be 300-500MB each. We have automated systems for data compression, archival, and backup. DICOM servers handle the traffic, and everything gets backed up to multiple locations. We also maintain audit trails - who accessed what data when. Medical data requires special handling.`,
        options: [
          {
            id: 'continue_next_steps',
            text: 'Robust data management for critical medical information.',
            nextNodeId: 'post_simulation_workflow',
            relationshipChange: 1
          }
        ]
      },
      'coordinate_systems': {
        id: 'coordinate_systems',
        mentorId: 'jesse',
        text: `The simulation CT establishes patient zero - the reference coordinate system. Everything else references back to this: plan isocenter coordinates, beam angles, patient shifts. When we set up for treatment, we're essentially recreating the exact same coordinate space we established here. It's like GPS for radiation therapy.`,
        options: [
          {
            id: 'ask_coordinate_accuracy',
            text: 'What level of coordinate accuracy can you achieve?',
            nextNodeId: 'coordinate_precision',
            insightChange: 8
          },
          {
            id: 'finish_comprehensive',
            text: 'GPS for radiation therapy - perfect analogy.',
            nextNodeId: 'simulation_conclusion',
            relationshipChange: 3,
            momentumChange: 1
          }
        ]
      },
      'igrt_explanation': {
        id: 'igrt_explanation',
        mentorId: 'jesse',
        text: `IGRT lets us see anatomy in real-time on the treatment table. We can verify tumor position, check organ motion, even track breathing patterns. Some systems update the plan in real-time based on anatomy changes. It's the bridge between simulation and reality - ensuring what we planned is what we deliver.`,
        options: [
          {
            id: 'finish_comprehensive',
            text: 'Real-time verification brings simulation full circle.',
            nextNodeId: 'simulation_conclusion',
            relationshipChange: 3,
            insightChange: 5
          }
        ]
      },
      'dicom_integrity': {
        id: 'dicom_integrity',
        mentorId: 'jesse',
        text: `DICOM includes checksums and header verification to detect data corruption. Patient demographics are embedded in every image, preventing mixups. Study and series UIDs create unique identifiers for each dataset. It's like a digital fingerprint ensuring data authenticity throughout the treatment chain.`,
        options: [
          {
            id: 'continue_connection',
            text: 'Built-in safeguards for medical data integrity.',
            nextNodeId: 'treatment_chain',
            relationshipChange: 1
          }
        ]
      },
      'quality_assurance': {
        id: 'quality_assurance',
        mentorId: 'jesse',
        text: `Weekly image quality checks, monthly geometric accuracy verification, daily laser alignment tests. Every component gets tested regularly. We audit simulation-to-treatment coordinate accuracy, verify immobilization device integrity, and track setup reproducibility statistics. Quality assurance isn't just recommended - it's what keeps patients safe.`,
        options: [
          {
            id: 'finish_comprehensive',
            text: 'Comprehensive QA ensures patient safety at every step.',
            nextNodeId: 'simulation_conclusion',
            relationshipChange: 3,
            insightChange: 6
          }
        ]
      },
      'patient_care_philosophy': {
        id: 'patient_care_philosophy',
        mentorId: 'jesse',
        text: `At the end of the day, every scan represents someone fighting for their life. The technical precision matters, but so does treating each patient with dignity and care. When someone trusts you to help save their life, you owe them your absolute best - technically and personally.`,
        options: [
          {
            id: 'continue_tour',
            text: 'Technical excellence and human compassion working together.',
            nextNodeId: 'equipment_tour',
            relationshipChange: 4,
            momentumChange: 1
          }
        ]
      },
      'four_d_ct_explanation': {
        id: 'four_d_ct_explanation',
        mentorId: 'jesse',
        text: `4D-CT captures breathing motion by sorting images based on respiratory phase. We get 10 different CT datasets showing tumor motion throughout the breathing cycle. This lets us create treatment volumes that account for motion, or set up gating systems that only deliver radiation when the tumor is in the right position.`,
        options: [
          {
            id: 'continue_workflow',
            text: 'Capturing motion to improve targeting precision.',
            nextNodeId: 'post_simulation_workflow',
            relationshipChange: 2,
            insightChange: 3
          }
        ]
      },
      'coordinate_precision': {
        id: 'coordinate_precision',
        mentorId: 'jesse',
        text: `Modern systems can achieve sub-millimeter accuracy. Laser alignment systems are calibrated to ±0.5mm, imaging registration typically ±1mm, and overall setup accuracy usually within 2-3mm. When you're targeting a 2cm tumor next to critical structures, every millimeter counts.`,
        options: [
          {
            id: 'finish_comprehensive',
            text: 'Sub-millimeter precision for life-saving treatments.',
            nextNodeId: 'simulation_conclusion',
            relationshipChange: 2,
            insightChange: 5
          }
        ]
      },
      'simulation_conclusion': {
        id: 'simulation_conclusion',
        mentorId: 'jesse',
        text: `You're starting to understand why this room is so critical. Every treatment that happens here starts with the work we do in this suite. Precise imaging, reproducible positioning, quality data - it's the foundation that everything else builds on. Get this right, and you set every patient up for success.`,
        options: [
          {
            id: 'simulation_finish',
            text: 'Thank you, Jesse. This gives me a deep appreciation for the simulation process.',
            isEndNode: true,
            relationshipChange: 4,
            insightChange: 8,
            momentumChange: 2
          }
        ]
      }
    }
  },

  'physics-office-intro': {
    id: 'physics-office-intro',
    title: 'Physics Office Introduction', 
    description: 'Introduction to the physics office',
    startNodeId: 'office_intro_start',
    domain: 'general',
    difficulty: 1,
    mode: DialogueMode.NARRATIVE,
    nodes: {
      'office_intro_start': {
        id: 'office_intro_start',
        mentorId: 'garcia',
        text: `This is the physics office - the nerve center of our operation. Here we plan treatments, analyze data, and coordinate patient care.`,
        options: [
          {
            id: 'explore_office',
            text: 'What do you work on here?',
            nextNodeId: 'office_explanation'
          },
          {
            id: 'ask_about_equipment',
            text: 'What\'s all this equipment for?',
            nextNodeId: 'equipment_explanation'
          }
        ]
      },
      'office_explanation': {
        id: 'office_explanation',
        mentorId: 'garcia',
        text: `Every treatment plan passes through this office. We ensure that each patient receives precisely the dose they need, where they need it. See that treatment planning system? It can calculate millions of dose distributions per minute.`,
        options: [
          {
            id: 'ask_complexity',
            text: 'How do you handle the complexity of all those calculations?',
            nextNodeId: 'complexity_discussion',
            insightChange: 5
          },
          {
            id: 'ask_patient_focus', 
            text: 'How do you keep the patient in mind through all the technical work?',
            nextNodeId: 'patient_focus_discussion',
            momentumChange: 1,
            relationshipChange: 2
          }
        ]
      },
      'equipment_explanation': {
        id: 'equipment_explanation',
        mentorId: 'garcia', 
        text: `These monitors show live treatment data from all our linear accelerators. The planning computers run Monte Carlo simulations, and we have direct links to the dosimetry lab for quality assurance.`,
        options: [
          {
            id: 'impressed_response',
            text: 'The integration is impressive!',
            nextNodeId: 'integration_discussion',
            relationshipChange: 1
          },
          {
            id: 'overwhelmed_response',
            text: 'This seems overwhelming...',
            nextNodeId: 'reassurance_discussion',
            insightChange: -2
          }
        ]
      },
      'complexity_discussion': {
        id: 'complexity_discussion',
        mentorId: 'garcia',
        text: `That's the beauty of modern treatment planning - the computer handles the calculations, but we provide the clinical judgment. Each case is a puzzle where physics meets biology meets human compassion.`,
        options: [
          {
            id: 'understand_balance',
            text: 'I see - it\'s about balancing the technical with the human.',
            nextNodeId: 'wisdom_moment',
            insightChange: 10,
            momentumChange: 1
          },
          {
            id: 'still_confused',
            text: 'I\'m not sure I understand how you make those decisions.',
            nextNodeId: 'learning_reassurance',
            insightChange: -3
          }
        ]
      },
      'patient_focus_discussion': {
        id: 'patient_focus_discussion',
        mentorId: 'garcia',
        text: `Excellent question! Every number on these screens represents someone's life. When I optimize a treatment plan, I think about Mrs. Rodriguez wanting to see her grandson graduate, or Mr. Chen hoping to return to his garden.`,
        options: [
          {
            id: 'moved_response',
            text: 'That\'s a beautiful way to think about the work.',
            nextNodeId: 'shared_philosophy',
            relationshipChange: 5,
            momentumChange: 2
          },
          {
            id: 'practical_question',
            text: 'How do you balance that emotional connection with clinical objectivity?',
            nextNodeId: 'balance_discussion',
            insightChange: 8,
            momentumChange: 1
          }
        ]
      },
      'integration_discussion': {
        id: 'integration_discussion',
        mentorId: 'garcia',
        text: `It took years to build this integrated system. Dr. Quinn pioneered much of the software integration, while Dr. Kapoor ensured every measurement meets the highest standards. Jesse keeps it all running smoothly.`,
        options: [
          {
            id: 'team_appreciation',
            text: 'It sounds like you have an amazing team.',
            nextNodeId: 'team_pride',
            relationshipChange: 3
          },
          {
            id: 'curious_about_roles',
            text: 'How do all these different roles work together?',
            nextNodeId: 'teamwork_explanation',
            insightChange: 6
          }
        ]
      },
      'reassurance_discussion': {
        id: 'reassurance_discussion',
        mentorId: 'garcia',
        text: `Everyone feels that way at first. The key is to start with one system, master it, then gradually expand your understanding. You don't need to learn everything at once.`,
        options: [
          {
            id: 'grateful_response',
            text: 'Thank you, that helps me feel less intimidated.',
            nextNodeId: 'encouragement',
            momentumChange: 1,
            relationshipChange: 2
          },
          {
            id: 'still_worried',
            text: 'What if I make a mistake with someone\'s treatment?',
            nextNodeId: 'safety_discussion',
            momentumChange: -1
          }
        ]
      },
      'wisdom_moment': {
        id: 'wisdom_moment',
        mentorId: 'garcia',
        text: `Exactly! You're already thinking like a medical physicist. The technology serves the patient, not the other way around. That insight will serve you well here.`,
        options: [
          {
            id: 'ready_to_learn',
            text: 'I\'m excited to learn more from you and the team.',
            nextNodeId: 'office_complete',
            relationshipChange: 3,
            momentumChange: 1
          }
        ]
      },
      'learning_reassurance': {
        id: 'learning_reassurance', 
        mentorId: 'garcia',
        text: `That's perfectly normal - these decisions come with experience and mentorship. You'll work closely with us on every case until you develop that clinical intuition. No one expects you to have it all figured out on day one.`,
        options: [
          {
            id: 'appreciate_patience',
            text: 'I appreciate your patience as I learn.',
            nextNodeId: 'mentorship_commitment',
            relationshipChange: 4
          }
        ]
      },
      'shared_philosophy': {
        id: 'shared_philosophy',
        mentorId: 'garcia',
        text: `I can tell you're going to fit in well here. When someone understands that medicine is ultimately about people, the technical aspects fall into place more naturally.`,
        options: [
          {
            id: 'honor_commitment',
            text: 'I promise to keep that perspective throughout my residency.',
            nextNodeId: 'office_complete',
            relationshipChange: 5,
            momentumChange: 2
          }
        ]
      },
      'balance_discussion': {
        id: 'balance_discussion',
        mentorId: 'garcia',
        text: `The emotional connection actually enhances clinical objectivity. When you care deeply about the outcome, you pay closer attention to details, double-check your work, and never settle for 'good enough.'`,
        options: [
          {
            id: 'profound_insight',
            text: 'That\'s a profound way to look at professional practice.',
            nextNodeId: 'professional_growth',
            insightChange: 12,
            momentumChange: 2
          }
        ]
      },
      'team_pride': {
        id: 'team_pride',
        mentorId: 'garcia',
        text: `They really are exceptional. In medical physics, collaboration isn't just helpful - it's essential. Every treatment plan is reviewed by multiple people, every measurement is verified, every decision is discussed.`,
        options: [
          {
            id: 'excited_collaboration',
            text: 'I\'m looking forward to being part of that collaborative process.',
            nextNodeId: 'office_complete',
            relationshipChange: 3,
            momentumChange: 1
          }
        ]
      },
      'teamwork_explanation': {
        id: 'teamwork_explanation',
        mentorId: 'garcia',
        text: `Each person brings unique expertise, but we all speak the same language of precision and patient care. Dr. Quinn provides innovation, Dr. Kapoor ensures accuracy, Jesse maintains reliability, and I try to keep us grounded in clinical reality.`,
        options: [
          {
            id: 'understand_dynamics',
            text: 'I can see how those strengths complement each other.',
            nextNodeId: 'team_synergy',
            insightChange: 8
          }
        ]
      },
      'encouragement': {
        id: 'encouragement',
        mentorId: 'garcia',
        text: `Feeling intimidated shows you understand the responsibility. That's actually a good sign - it means you'll approach this work with the seriousness it deserves.`,
        options: [
          {
            id: 'build_confidence',
            text: 'That gives me confidence to take on the challenge.',
            nextNodeId: 'office_complete',
            momentumChange: 2
          }
        ]
      },
      'safety_discussion': {
        id: 'safety_discussion',
        mentorId: 'garcia',
        text: `Medical physics has multiple safety nets built in. Every plan is independently checked, every measurement is verified, and you'll always have supervision. The system is designed to catch errors before they reach patients.`,
        options: [
          {
            id: 'relieved_response',
            text: 'That\'s reassuring. I want to contribute safely to patient care.',
            nextNodeId: 'safety_commitment',
            relationshipChange: 3
          }
        ]
      },
      'mentorship_commitment': {
        id: 'mentorship_commitment',
        mentorId: 'garcia',
        text: `That's what we're here for. Every expert was once a beginner, and we all learned from dedicated mentors. It's our privilege to pass on that knowledge and support.`,
        options: [
          {
            id: 'grateful_finish',
            text: 'Thank you for your commitment to teaching.',
            nextNodeId: 'office_complete',
            relationshipChange: 4
          }
        ]
      },
      'professional_growth': {
        id: 'professional_growth',
        mentorId: 'garcia',
        text: `You're already developing the mindset of an excellent medical physicist. Balancing technical excellence with compassionate care is the hallmark of our best practitioners.`,
        options: [
          {
            id: 'aspire_excellence',
            text: 'I aspire to that level of professional excellence.',
            nextNodeId: 'office_complete',
            relationshipChange: 4,
            momentumChange: 1
          }
        ]
      },
      'team_synergy': {
        id: 'team_synergy',
        mentorId: 'garcia',
        text: `Exactly! And as you develop your own expertise, you'll find your unique contribution to that synergy. Every resident brings fresh perspectives that make us all better.`,
        options: [
          {
            id: 'excited_contribute',
            text: 'I\'m excited to find my place and contribute.',
            nextNodeId: 'office_complete',
            insightChange: 5,
            relationshipChange: 2
          }
        ]
      },
      'safety_commitment': {
        id: 'safety_commitment',
        mentorId: 'garcia',
        text: `That attitude will serve you well. Patient safety is our highest priority, and having team members who take that seriously makes everyone's job easier and more meaningful.`,
        options: [
          {
            id: 'ready_to_start',
            text: 'I\'m ready to start learning and contributing.',
            nextNodeId: 'office_complete',
            momentumChange: 2,
            relationshipChange: 2
          }
        ]
      },
      'office_complete': {
        id: 'office_complete',
        mentorId: 'garcia',
        text: `I can tell you're going to do well here. Feel free to come by anytime with questions - my door is always open. Now, shall we explore some of the other areas?`,
        options: [
          {
            id: 'finish_office_tour',
            text: 'Thank you for the tour and the insight, Dr. Garcia.',
            isEndNode: true,
            relationshipChange: 2,
            insightChange: 5
          }
        ]
      }
    }
  },

  'linac-2-intro': {
    id: 'linac-2-intro',
    title: 'LINAC Room 2 Introduction',
    description: 'Introduction to LINAC Room 2 technology',
    startNodeId: 'linac_room_intro_start',
    domain: 'linac_anatomy',
    difficulty: 1,
    mode: DialogueMode.NARRATIVE,
    nodes: {
      'linac_room_intro_start': {
        id: 'linac_room_intro_start',
        mentorId: 'jesse',
        text: `Welcome to the heart of radiation therapy - the LINAC room. This beauty here can generate precise radiation beams with energies up to 25 MeV. Every component you see has been engineered for one purpose: delivering life-saving treatments with millimeter precision.`,
        options: [
          {
            id: 'explore_linac',
            text: 'Tell me about the main components.',
            nextNodeId: 'linac_components_overview'
          },
          {
            id: 'ask_about_precision',
            text: 'How do you achieve such precision?',
            nextNodeId: 'precision_explanation'
          }
        ]
      },
      'linac_components_overview': {
        id: 'linac_components_overview',
        mentorId: 'jesse',
        text: `See that massive structure? The gantry can rotate 360 degrees around the patient, allowing us to target tumors from any angle. Inside the treatment head, electrons are accelerated to near light speed, then converted to therapeutic X-rays. The multi-leaf collimator shapes each beam with incredible accuracy.`,
        options: [
          {
            id: 'ask_electron_path',
            text: 'Walk me through the electron path from start to finish.',
            nextNodeId: 'electron_journey',
            insightChange: 8
          },
          {
            id: 'ask_beam_shaping',
            text: 'How does the beam shaping actually work?',
            nextNodeId: 'beam_shaping_details',
            momentumChange: 2,
            relationshipChange: 1
          }
        ]
      },
      'precision_explanation': {
        id: 'precision_explanation',
        mentorId: 'jesse',
        text: `Precision starts with calibration - daily QA checks ensure every parameter is within tolerance. The imaging system lets us see exactly where the patient is positioned. But the real magic happens in the treatment head - those ionization chambers monitor every pulse, ready to shut down the beam in microseconds if anything goes wrong.`,
        options: [
          {
            id: 'ask_qa_details',
            text: 'What kind of QA checks do you run daily?',
            nextNodeId: 'qa_procedures',
            insightChange: 5,
            momentumChange: 1
          },
          {
            id: 'ask_safety_systems',
            text: 'Tell me more about the safety systems.',
            nextNodeId: 'safety_systems_detail',
            relationshipChange: 2
          }
        ]
      },
      'electron_journey': {
        id: 'electron_journey',
        mentorId: 'jesse',
        text: `It starts in the electron gun - a heated cathode emits electrons that get injected into the waveguide. Microwave energy from the klystron accelerates them through a series of copper cavities. Then the bending magnet curves their path 270 degrees before they slam into the tungsten target, creating our therapeutic X-ray beam.`,
        options: [
          {
            id: 'ask_target_details',
            text: 'What happens at the target exactly?',
            nextNodeId: 'bremsstrahlung_explanation',
            insightChange: 10,
            discoversConceptId: 'bremsstrahlung_process'
          },
          {
            id: 'continue_beam_path',
            text: 'What happens to the X-rays after they\'re created?',
            nextNodeId: 'beam_modification',
            momentumChange: 1
          }
        ]
      },
      'beam_shaping_details': {
        id: 'beam_shaping_details',
        mentorId: 'jesse',
        text: `The MLC is like having 120 individual metal fingers that can move independently. Each leaf is made of tungsten and can position itself with sub-millimeter accuracy. During IMRT treatments, these leaves dance in choreographed patterns, creating intensity-modulated fields that conform perfectly to tumor shapes while sparing healthy tissue.`,
        options: [
          {
            id: 'ask_imrt_details',
            text: 'How complex can these IMRT patterns get?',
            nextNodeId: 'imrt_complexity',
            insightChange: 8,
            relationshipChange: 2
          },
          {
            id: 'ask_leaf_precision',
            text: 'How do you maintain such precise leaf positioning?',
            nextNodeId: 'mechanical_precision',
            momentumChange: 2
          }
        ]
      },
      'qa_procedures': {
        id: 'qa_procedures',
        mentorId: 'jesse',
        text: `Every morning before treatments, we run a comprehensive QA suite: beam output, flatness, symmetry, jaw positioning, MLC leaf positions, imaging system alignment. Takes about 30 minutes, but it's non-negotiable. One parameter out of tolerance, and this machine doesn't treat patients until we fix it.`,
        options: [
          {
            id: 'ask_tolerance_levels',
            text: 'What are typical tolerance levels for these checks?',
            nextNodeId: 'tolerance_discussion',
            insightChange: 6
          },
          {
            id: 'continue_exploration',
            text: 'That attention to detail is impressive.',
            nextNodeId: 'linac_conclusion',
            relationshipChange: 3
          }
        ]
      },
      'safety_systems_detail': {
        id: 'safety_systems_detail',
        mentorId: 'jesse',
        text: `Multiple redundant safety systems protect patients and staff. Door interlocks prevent beam-on with the room open. Emergency stops immediately terminate treatments. The beam monitoring system watches output continuously - if dose rate, flatness, or symmetry drift outside limits, the beam shuts off instantly.`,
        options: [
          {
            id: 'ask_interlock_hierarchy',
            text: 'Is there a hierarchy to these safety systems?',
            nextNodeId: 'safety_hierarchy',
            insightChange: 7
          },
          {
            id: 'continue_exploration',
            text: 'Multiple layers of protection - smart design.',
            nextNodeId: 'linac_conclusion',
            relationshipChange: 2
          }
        ]
      },
      'bremsstrahlung_explanation': {
        id: 'bremsstrahlung_explanation',
        mentorId: 'jesse',
        text: `When high-energy electrons hit the tungsten target, they undergo rapid deceleration - "bremsstrahlung" literally means "braking radiation." Only about 3-5% of the electron energy becomes useful X-rays; the rest becomes heat. That's why the target needs water cooling running at 2-3 gallons per minute.`,
        options: [
          {
            id: 'ask_energy_spectrum',
            text: 'What does the resulting X-ray energy spectrum look like?',
            nextNodeId: 'spectrum_discussion',
            insightChange: 12,
            discoversConceptId: 'energy_spectrum'
          },
          {
            id: 'continue_beam_path',
            text: 'What happens to the X-rays after they\'re created?',
            nextNodeId: 'beam_modification',
            momentumChange: 1
          }
        ]
      },
      'beam_modification': {
        id: 'beam_modification',
        mentorId: 'jesse',
        text: `The raw X-ray beam gets filtered and shaped as it travels down the treatment head. Primary collimators remove off-axis radiation, the flattening filter creates a uniform dose profile, and secondary collimators define the basic field size. Finally, the MLC adds the fine detail for conformal treatments.`,
        options: [
          {
            id: 'ask_flattening_filter',
            text: 'How does the flattening filter work exactly?',
            nextNodeId: 'flattening_filter_detail',
            insightChange: 8
          },
          {
            id: 'continue_exploration',
            text: 'That\'s a sophisticated beam modification system.',
            nextNodeId: 'linac_conclusion',
            relationshipChange: 2
          }
        ]
      },
      'imrt_complexity': {
        id: 'imrt_complexity',
        mentorId: 'jesse',
        text: `IMRT plans can have hundreds of segments, each with unique MLC patterns. The treatment planning system calculates optimal leaf positions using inverse optimization - we tell it what dose distribution we want, and it figures out how to deliver it. Some plans require over 1000 monitor units across multiple fields.`,
        options: [
          {
            id: 'ask_optimization',
            text: 'How does the optimization algorithm work?',
            nextNodeId: 'optimization_detail',
            insightChange: 10,
            discoversConceptId: 'inverse_planning'
          },
          {
            id: 'continue_exploration',
            text: 'The computational complexity must be enormous.',
            nextNodeId: 'linac_conclusion',
            relationshipChange: 2
          }
        ]
      },
      'mechanical_precision': {
        id: 'mechanical_precision',
        mentorId: 'jesse',
        text: `Each MLC leaf has optical encoders that report position to within 0.1mm. The control system constantly monitors and adjusts leaf positions during treatment delivery. We perform monthly mechanical QA to verify leaf positioning accuracy - any leaf that's consistently off by more than 1mm gets flagged for maintenance.`,
        options: [
          {
            id: 'ask_maintenance_schedule',
            text: 'What does the maintenance schedule look like?',
            nextNodeId: 'maintenance_discussion',
            insightChange: 6
          },
          {
            id: 'continue_exploration',
            text: 'That level of precision is remarkable.',
            nextNodeId: 'linac_conclusion',
            relationshipChange: 2
          }
        ]
      },
      'tolerance_discussion': {
        id: 'tolerance_discussion',
        mentorId: 'jesse',
        text: `Output must be within ±3% of baseline, flatness and symmetry within ±2%. Jaw positions are checked to ±1mm, MLC leaves to ±1mm. Imaging system alignment tolerance is ±1mm. These might seem like small numbers, but when you're targeting a tumor next to critical structures, precision matters.`,
        options: [
          {
            id: 'continue_exploration',
            text: 'Those tight tolerances make sense for patient safety.',
            nextNodeId: 'linac_conclusion',
            relationshipChange: 3,
            insightChange: 5
          }
        ]
      },
      'safety_hierarchy': {
        id: 'safety_hierarchy',
        mentorId: 'jesse',
        text: `Emergency stops have highest priority - they cut power immediately. Next are the beam monitoring interlocks - if dose rate, symmetry, or flatness fail, beam terminates in milliseconds. Door interlocks prevent beam-on but allow completion of current pulse. Patient motion detection can pause treatment for repositioning.`,
        options: [
          {
            id: 'continue_exploration',
            text: 'Layered safety systems with clear priorities - excellent design.',
            nextNodeId: 'linac_conclusion',
            relationshipChange: 3,
            insightChange: 7
          }
        ]
      },
      'spectrum_discussion': {
        id: 'spectrum_discussion',
        mentorId: 'jesse',
        text: `The bremsstrahlung spectrum is continuous, ranging from low-energy photons up to the maximum electron energy. Most clinical beams are characterized by their peak energy - a 6MV beam has photons ranging from keV to 6MeV, with an average energy around 2MeV. Higher energy beams penetrate deeper but create more neutron contamination.`,
        options: [
          {
            id: 'ask_neutron_contamination',
            text: 'Tell me about neutron contamination in high-energy beams.',
            nextNodeId: 'neutron_discussion',
            insightChange: 10,
            discoversConceptId: 'neutron_activation'
          },
          {
            id: 'continue_exploration',
            text: 'The physics of beam generation is fascinating.',
            nextNodeId: 'linac_conclusion',
            relationshipChange: 2
          }
        ]
      },
      'flattening_filter_detail': {
        id: 'flattening_filter_detail',
        mentorId: 'jesse',
        text: `The flattening filter is a cone-shaped piece of metal - usually lead or tungsten - that preferentially attenuates the central axis where the beam is most intense. It creates a flat dose profile across the field, but also hardens the beam spectrum and reduces dose rate. That's why modern machines offer flattening filter-free modes for faster treatments.`,
        options: [
          {
            id: 'ask_fff_benefits',
            text: 'What are the benefits of flattening filter-free treatments?',
            nextNodeId: 'fff_discussion',
            insightChange: 8,
            discoversConceptId: 'fff_beams'
          },
          {
            id: 'continue_exploration',
            text: 'The trade-offs in beam design are interesting.',
            nextNodeId: 'linac_conclusion',
            relationshipChange: 2
          }
        ]
      },
      'optimization_detail': {
        id: 'optimization_detail',
        mentorId: 'jesse',
        text: `Inverse planning uses iterative optimization algorithms - often simulated annealing or gradient descent. The planner defines objectives like "95% of target gets prescription dose" and constraints like "spinal cord dose <45Gy." The algorithm adjusts beam angles, intensities, and MLC patterns to minimize a cost function that balances all objectives.`,
        options: [
          {
            id: 'continue_exploration',
            text: 'Mathematical optimization applied to medicine - powerful stuff.',
            nextNodeId: 'linac_conclusion',
            relationshipChange: 3,
            insightChange: 8
          }
        ]
      },
      'maintenance_discussion': {
        id: 'maintenance_discussion',
        mentorId: 'jesse',
        text: `We have daily QA, weekly mechanical checks, monthly comprehensive QA, and annual full commissioning measurements. The service engineers visit quarterly for preventive maintenance. Any component showing drift gets attention immediately - we can't afford surprises when treating patients.`,
        options: [
          {
            id: 'continue_exploration',
            text: 'Preventive maintenance is crucial for this level of precision.',
            nextNodeId: 'linac_conclusion',
            relationshipChange: 2,
            insightChange: 5
          }
        ]
      },
      'neutron_discussion': {
        id: 'neutron_discussion',
        mentorId: 'jesse',
        text: `Above 10MV, photodisintegration reactions in the treatment head create neutrons. These neutrons can activate materials in the room and patient, creating radioactive isotopes. We monitor neutron dose and manage activation through shielding design and cooling periods after high-energy treatments.`,
        options: [
          {
            id: 'continue_exploration',
            text: 'Another layer of complexity in high-energy treatments.',
            nextNodeId: 'linac_conclusion',
            relationshipChange: 2,
            insightChange: 8
          }
        ]
      },
      'fff_discussion': {
        id: 'fff_discussion',
        mentorId: 'jesse',
        text: `FFF beams have 2-4x higher dose rates, reducing treatment times and patient motion. The beam profile is more forward-peaked, which can be advantageous for SBRT treatments. The softer spectrum provides better skin sparing. The trade-off is more complex dose calculations and IMRT optimization.`,
        options: [
          {
            id: 'continue_exploration',
            text: 'Each beam type has its clinical applications.',
            nextNodeId: 'linac_conclusion',
            relationshipChange: 2,
            insightChange: 6
          }
        ]
      },
      'linac_conclusion': {
        id: 'linac_conclusion',
        mentorId: 'jesse',
        text: `You're getting a good appreciation for the complexity here. This machine represents decades of engineering innovation, all focused on one goal: precise, safe, and effective cancer treatment. Understanding how it works makes you a better physicist and helps you optimize treatments for every patient.`,
        options: [
          {
            id: 'linac_finish',
            text: 'Thank you, Jesse. This gives me a much deeper understanding of the technology.',
            isEndNode: true,
            relationshipChange: 3,
            insightChange: 5
          }
        ]
      }
    }
  },

  'linac-1-activity_challenge': {
    id: 'linac-1-activity_challenge',
    title: 'LINAC Room 1 Challenge',
    description: 'Technical challenge focusing on linear accelerator components',
    startNodeId: 'linac_intro_1',
    domain: 'linac_anatomy',
    difficulty: 1,
    mode: DialogueMode.CHALLENGE,
    nodes: {
      'linac_intro_1': {
        id: 'linac_intro_1',
        mentorId: 'kapoor',
        text: `Welcome to LINAC Room 1. Today we'll examine the linear accelerator components in detail. What specific aspect would you like to explore?`,
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

// Function to add these to the main dialogue store
export const addDay1Dialogues = (dialogueStore: any) => {
  Object.values(day1Dialogues).forEach(dialogue => {
    dialogueStore.addDialogue(dialogue);
  });
}; 