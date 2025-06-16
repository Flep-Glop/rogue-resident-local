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

  'treatment-room-activity_challenge': {
    id: 'treatment-room-activity_challenge',
    title: 'Treatment Room Challenge',
    description: 'Clinical challenge in the treatment room',
    startNodeId: 'treatment_challenge_start',
    domain: 'radiation_therapy',
    difficulty: 2,
    mode: DialogueMode.CHALLENGE,
    nodes: {
      'treatment_challenge_start': {
        id: 'treatment_challenge_start',
        mentorId: 'quinn',
        text: `The treatment room is where theory meets practice. Let's see how well you can apply your knowledge to real clinical scenarios.`,
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

  'simulation-suite-intro': {
    id: 'simulation-suite-intro',
    title: 'Simulation Suite Introduction',
    description: 'Introduction to the simulation suite',
    startNodeId: 'simulation_intro_start',
    domain: 'linac_anatomy',
    difficulty: 1,
    mode: DialogueMode.NARRATIVE,
    nodes: {
      'simulation_intro_start': {
        id: 'simulation_intro_start',
        mentorId: 'jesse',
        text: `Welcome to the simulation suite! This is where we model and test treatment scenarios before they reach real patients.`,
        options: [
          {
            id: 'explore_simulation',
            text: 'What can you show me?',
            nextNodeId: 'simulation_explanation'
          }
        ]
      },
      'simulation_explanation': {
        id: 'simulation_explanation',
        mentorId: 'jesse',
        text: `Here we can simulate patient positioning, beam delivery, and equipment behavior. It's like a flight simulator for medical physics.`,
        options: [
          {
            id: 'finish_simulation',
            text: 'This is fascinating technology.',
            isEndNode: true,
            relationshipChange: 2,
            insightChange: 5
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