import { Dialogue, DialogueMode } from '@/app/types';

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
        text: `You must be our new resident! I'm Dr. Garcia - grab some coffee if you need it. We've got Mrs. Chen coming in at 10, and I'd love to get your fresh perspective on her case.`,
        options: [
          {
            id: 'excited_to_help',
            text: 'Thank you. I\'m excited to contribute.',
            nextNodeId: 'garcia_how_are_you',
            relationshipChange: 2,
            tutorialStepCompletion: 'first_mentor_intro'
          },
          {
            id: 'ask_about_mrs_chen',
            text: 'What makes Mrs. Chen\'s case interesting?',
            nextNodeId: 'garcia_patient_story',
            relationshipChange: 3,
            tutorialStepCompletion: 'first_mentor_intro'
          }
        ]
      },
      'garcia_how_are_you': {
        id: 'garcia_how_are_you',
        mentorId: 'garcia',
        text: `Coffee's helping? Good. How are you feeling about starting here? First days can be overwhelming - we try to ease people in, but medicine doesn't always wait for us to be ready.`,
        options: [
          {
            id: 'feeling_ready',
            text: 'I\'m feeling ready. Nervous but excited.',
            nextNodeId: 'garcia_learning_approach',
            insightChange: 2
          },
          {
            id: 'ask_about_support',
            text: 'How do you help new residents adjust?',
            nextNodeId: 'garcia_learning_approach',
            momentumChange: 1
          }
        ]
      },
      'garcia_patient_story': {
        id: 'garcia_patient_story',
        mentorId: 'garcia',
        text: `Mrs. Chen's tumor is close to her heart - we need precision and compassion in equal measure. She's been asking about her prognosis. When you truly understand what we're doing, patients feel that confidence.`,
        options: [
          {
            id: 'understand_connection',
            text: 'I can see how our understanding affects their confidence.',
            nextNodeId: 'garcia_learning_approach',
            insightChange: 4
          },
          {
            id: 'focus_on_precision',
            text: 'The precision required must be incredible.',
            nextNodeId: 'garcia_learning_approach',
            momentumChange: 2
          }
        ]
      },
      'garcia_learning_approach': {
        id: 'garcia_learning_approach',
        mentorId: 'garcia',
        text: `Let's work through this together. I've got a case where the standard approach wasn't quite right - sometimes we need to think differently. Want to take a look at it with me? We'll figure out what Mrs. Patterson needs.`,
        options: [
          {
            id: 'work_together',
            text: 'I\'d like to work through it with you.',
            nextNodeId: 'garcia_activity_transition',
            tutorialStepCompletion: 'first_educational_activity'
          }
        ]
      },
      'garcia_activity_transition': {
        id: 'garcia_activity_transition',
        mentorId: 'garcia',
        text: `Perfect. Take your time - there's no rush. Look at the dose distribution, the organ constraints. How are you feeling about this? When you're really focused on helping someone, you might notice your thinking becomes clearer.`,
        options: [
          {
            id: 'begin_working_together',
            text: 'I\'m ready. Let\'s help Mrs. Patterson.',
            nextNodeId: 'garcia_activity_reflection',
            triggersActivity: true,
            tutorialStepCompletion: 'insight_mechanic_intro'
          }
        ]
      },
      'garcia_activity_reflection': {
        id: 'garcia_activity_reflection',
        mentorId: 'garcia',
        text: `Nice work! How did that feel? Sometimes when we're really focused on helping someone, our thinking gets sharper. Mrs. Patterson's going to benefit from this kind of careful attention.`,
        options: [
          {
            id: 'felt_more_focused',
            text: 'I did feel more focused when thinking about helping her.',
            nextNodeId: 'garcia_validation',
            relationshipChange: 4,
            insightChange: 5
          },
          {
            id: 'learned_a_lot',
            text: 'I learned a lot about the treatment planning process.',
            nextNodeId: 'garcia_encouragement',
            relationshipChange: 2,
            insightChange: 3
          }
        ]
      },
      'garcia_validation': {
        id: 'garcia_validation',
        mentorId: 'garcia',
        text: `That connection you felt? That's what makes the difference. Now, you should meet the rest of our team - grab lunch and see who's around. Quinn's brilliant with optimization, Jesse keeps all our equipment happy, and Kapoor makes sure we're precise. They'll each show you something different.`,
        options: [
          {
            id: 'meet_the_team',
            text: 'I\'d like to meet the team and see their approaches.',
            isEndNode: true,
            relationshipChange: 3,
            insightChange: 3
          }
        ]
      },
      'garcia_encouragement': {
        id: 'garcia_encouragement',
        mentorId: 'garcia',
        text: `Good work. We all approach problems differently here - Quinn loves the math, Jesse trusts his hands, Kapoor lives by the protocols. You'll find what works for you. Go grab lunch and see who's around.`,
        options: [
          {
            id: 'explore_different_styles',
            text: 'I\'ll go see what I can learn from each of them.',
            isEndNode: true,
            relationshipChange: 3,
            insightChange: 2
          }
        ]
      }
    }
  },

  /**
   * Multi-Character Lunch Scene - Authentic Colleague Dynamics
   * All mentors present with established humor and relationship dynamics
   */
  'tutorial_lunch_dialogue': {
    id: 'tutorial_lunch_dialogue',
    title: 'Cafeteria - Team Dynamics',
    description: 'Multi-character lunch scene with authentic colleague relationships',
    startNodeId: 'cafeteria_scene_opening',
    domain: 'general',
    difficulty: 1,
    mode: DialogueMode.NARRATIVE,
    isTutorial: true,
    nodes: {
      'cafeteria_scene_opening': {
        id: 'cafeteria_scene_opening',
        mentorId: 'jesse',
        text: `[Player enters cafeteria after Garcia activity]\n\n"...so I told maintenance it's not broken, it just has opinions." [Jesse says mid-bite of sandwich, talking to Kapoor]`,
        options: [
          {
            id: 'listen_to_conversation',
            text: '[Listen to the ongoing conversation]',
            nextNodeId: 'colleague_banter_begins'
          }
        ]
      },
      'colleague_banter_begins': {
        id: 'colleague_banter_begins',
        mentorId: 'kapoor',
        text: `"You cannot anthropomorphize every piece of equipment, Martinez." [Dr. Kapoor replies with a slight smile]`,
        options: [
          {
            id: 'continue_listening',
            text: '[Continue listening to their debate]',
            nextNodeId: 'jesse_machine_personalities'
          }
        ]
      },
      'jesse_machine_personalities': {
        id: 'jesse_machine_personalities',
        mentorId: 'jesse',
        text: `"Watch me. Bertha's been moody all week, and the new ion chamber definitely has attitude."`,
        options: [
          {
            id: 'approach_group',
            text: '[Approach the group]',
            nextNodeId: 'kapoor_introduces_self'
          }
        ]
      },
      'kapoor_introduces_self': {
        id: 'kapoor_introduces_self',
        mentorId: 'kapoor',
        text: `[Noticing you joining the conversation] "Jesse believes our equipment has personalities. I am Dr. Kapoor, dosimetry."`,
        options: [
          {
            id: 'nice_to_meet_you',
            text: 'Nice to meet you both.',
            nextNodeId: 'ongoing_debate_revealed',
            relationshipChange: 2
          }
        ]
      },
      'ongoing_debate_revealed': {
        id: 'ongoing_debate_revealed',
        mentorId: 'jesse',
        text: `"And Kapoor thinks calibration curves have personalities. We're both right." [Both chuckle - clearly an ongoing friendly debate]`,
        options: [
          {
            id: 'amused_by_debate',
            text: '[Smile at their friendly argument]',
            nextNodeId: 'kapoor_deadpan_response'
          }
        ]
      },
      'kapoor_deadpan_response': {
        id: 'kapoor_deadpan_response',
        mentorId: 'kapoor',
        text: `"Calibration curves are predictable. Unlike your machines." [Deadpan delivery with subtle humor]`,
        options: [
          {
            id: 'enjoy_colleague_humor',
            text: '[Enjoy their collegial back-and-forth]',
            nextNodeId: 'quinn_arrives_rushing'
          }
        ]
      },
      'quinn_arrives_rushing': {
        id: 'quinn_arrives_rushing',
        mentorId: 'quinn',
        text: `[Rushing past, then stopping] "Are you two arguing about machine psychology again?"`,
        options: [
          {
            id: 'watch_interaction',
            text: '[Watch Quinn join the conversation]',
            nextNodeId: 'jesse_explains_argument'
          }
        ]
      },
      'jesse_explains_argument': {
        id: 'jesse_explains_argument',
        mentorId: 'jesse',
        text: `"Kapoor started it by saying the ion chamber readings are 'merely fluctuations.'"`,
        options: [
          {
            id: 'continue_watching',
            text: '[Continue watching their dynamic]',
            nextNodeId: 'quinn_introduces_self'
          }
        ]
      },
      'quinn_introduces_self': {
        id: 'quinn_introduces_self',
        mentorId: 'quinn',
        text: `[Grinning, to player] "Alex Quinn, treatment planning. These two have been having the same argument for three years."`,
        options: [
          {
            id: 'three_years_question',
            text: 'Three years of the same argument?',
            nextNodeId: 'kapoor_philosophical_discussion',
            relationshipChange: 2,
            tutorialStepCompletion: 'second_mentor_intro'
          },
          {
            id: 'impressed_by_team',
            text: 'You all seem to work well together.',
            nextNodeId: 'kapoor_philosophical_discussion',
            relationshipChange: 3,
            tutorialStepCompletion: 'second_mentor_intro'
          }
        ]
      },
      'kapoor_philosophical_discussion': {
        id: 'kapoor_philosophical_discussion',
        mentorId: 'kapoor',
        text: `"It is not an argument. It is a philosophical discussion about the nature of measurement uncertainty."`,
        options: [
          {
            id: 'philosophical_indeed',
            text: '[Nod] That does sound philosophical.',
            nextNodeId: 'quinn_sees_point'
          }
        ]
      },
      'quinn_sees_point': {
        id: 'quinn_sees_point',
        mentorId: 'quinn',
        text: `"See? Philosophical." [Winks at player] "Jesse, did you fix whatever was 'having opinions' this morning?"`,
        options: [
          {
            id: 'curious_about_fix',
            text: '[Listen to Jesse\'s response]',
            nextNodeId: 'jesse_solution'
          }
        ]
      },
      'jesse_solution': {
        id: 'jesse_solution',
        mentorId: 'jesse',
        text: `"Turns out it just needed to be asked nicely. And a firmware update."`,
        options: [
          {
            id: 'amused_by_solution',
            text: '[Smile at the practical solution]',
            nextNodeId: 'quinn_patient_conference'
          }
        ]
      },
      'quinn_patient_conference': {
        id: 'quinn_patient_conference',
        mentorId: 'kapoor',
        text: `"Your 3 o'clock patient conference—" [Kapoor reminds Quinn]`,
        options: [
          {
            id: 'quinn_remembers',
            text: '[Watch Quinn react]',
            nextNodeId: 'quinn_cant_stay_long'
          }
        ]
      },
      'quinn_cant_stay_long': {
        id: 'quinn_cant_stay_long',
        mentorId: 'quinn',
        text: `"Right! Can't stay long." [To player] "First day going well? Garcia's probably got you swimming in radiation safety protocols by now."`,
        options: [
          {
            id: 'team_works_well',
            text: 'She\'s been great. You all seem to work well together.',
            nextNodeId: 'jesse_twenty_years',
            tutorialStepCompletion: 'constellation_preview'
          },
          {
            id: 'equipment_personalities_new',
            text: 'Definitely learning a lot. The equipment personality thing is new to me.',
            nextNodeId: 'jesse_one_week_prediction',
            tutorialStepCompletion: 'constellation_preview'
          }
        ]
      },
      'jesse_twenty_years': {
        id: 'jesse_twenty_years',
        mentorId: 'jesse',
        text: `"Twenty years here, you better work well together."`,
        options: [
          {
            id: 'kapoor_correction',
            text: '[Listen to Kapoor\'s response]',
            nextNodeId: 'kapoor_eight_years'
          }
        ]
      },
      'kapoor_eight_years': {
        id: 'kapoor_eight_years',
        mentorId: 'kapoor',
        text: `"Speak for yourself. I have only been here eight years."`,
        options: [
          {
            id: 'quinn_breaking_in',
            text: '[Watch Quinn\'s reaction]',
            nextNodeId: 'quinn_breaking_him_in'
          }
        ]
      },
      'quinn_breaking_him_in': {
        id: 'quinn_breaking_him_in',
        mentorId: 'quinn',
        text: `"And we're still breaking him in." [Kapoor raises eyebrow, amused]`,
        options: [
          {
            id: 'enjoy_team_dynamic',
            text: '[Enjoy their friendly team dynamic]',
            nextNodeId: 'quinn_office_invitation'
          }
        ]
      },
      'jesse_one_week_prediction': {
        id: 'jesse_one_week_prediction',
        mentorId: 'jesse',
        text: `"Give it a week. You'll start hearing the machines talk back."`,
        options: [
          {
            id: 'kapoor_translation',
            text: '[Listen to Kapoor\'s translation]',
            nextNodeId: 'kapoor_patterns_explanation'
          }
        ]
      },
      'kapoor_patterns_explanation': {
        id: 'kapoor_patterns_explanation',
        mentorId: 'kapoor',
        text: `"What Jesse means is that experience teaches you to recognize patterns in equipment behavior."`,
        options: [
          {
            id: 'jesse_agrees',
            text: '[Watch Jesse\'s response]',
            nextNodeId: 'jesse_thats_what_i_said'
          }
        ]
      },
      'jesse_thats_what_i_said': {
        id: 'jesse_thats_what_i_said',
        mentorId: 'jesse',
        text: `"Right. Patterns. That's what I said."`,
        options: [
          {
            id: 'quinn_translation_humor',
            text: '[Watch Quinn\'s amused reaction]',
            nextNodeId: 'quinn_translation_both_right'
          }
        ]
      },
      'quinn_translation_both_right': {
        id: 'quinn_translation_both_right',
        mentorId: 'quinn',
        text: `[To player] "Translation: they're both right, but Jesse's more fun about it."`,
        options: [
          {
            id: 'appreciate_translation',
            text: '[Appreciate Quinn\'s translation]',
            nextNodeId: 'quinn_office_invitation'
          }
        ]
      },
      'quinn_office_invitation': {
        id: 'quinn_office_invitation',
        mentorId: 'quinn',
        text: `"Listen, I need to prep for this conference, but swing by my office around 4:30? Got something that might help with your week."`,
        options: [
          {
            id: 'accept_invitation',
            text: 'Sounds great, I\'ll stop by.',
            nextNodeId: 'jesse_optimization_poetry',
            relationshipChange: 2
          }
        ]
      },
      'jesse_optimization_poetry': {
        id: 'jesse_optimization_poetry',
        mentorId: 'jesse',
        text: `[As Quinn starts to leave] "Let me guess - another optimization problem that's 'elegantly complex.'"`,
        options: [
          {
            id: 'quinn_poetry_response',
            text: '[Listen to Quinn\'s response]',
            nextNodeId: 'quinn_optimization_is_poetry'
          }
        ]
      },
      'quinn_optimization_is_poetry': {
        id: 'quinn_optimization_is_poetry',
        mentorId: 'quinn',
        text: `[Over shoulder] "Hey, optimization is poetry!"`,
        options: [
          {
            id: 'kapoor_poetry_math',
            text: '[Watch Kapoor\'s reaction]',
            nextNodeId: 'kapoor_poetry_differential_equations'
          }
        ]
      },
      'kapoor_poetry_differential_equations': {
        id: 'kapoor_poetry_differential_equations',
        mentorId: 'kapoor',
        text: `[To Jesse, after Quinn leaves] "Poetry with differential equations."`,
        options: [
          {
            id: 'jesse_see_what_i_mean',
            text: '[Listen to Jesse\'s final comment]',
            nextNodeId: 'jesse_afternoon_choice_setup'
          }
        ]
      },
      'jesse_afternoon_choice_setup': {
        id: 'jesse_afternoon_choice_setup',
        mentorId: 'jesse',
        text: `[To player] "So what's your preference - afternoon with real equipment that has actual personality, or afternoon with Kapoor's perfectly calibrated universe?"`,
        options: [
          {
            id: 'choose_jesse_equipment',
            text: 'I think I\'d like to see how you troubleshoot real equipment.',
            nextNodeId: 'kapoor_mock_offended',
            tutorialStepCompletion: 'first_ability_intro'
          },
          {
            id: 'choose_kapoor_precision',
            text: 'Quantifiable uncertainties sounds like something I should understand.',
            nextNodeId: 'kapoor_mock_offended',
            tutorialStepCompletion: 'first_ability_intro'
          }
        ]
      },
      'kapoor_mock_offended': {
        id: 'kapoor_mock_offended',
        mentorId: 'kapoor',
        text: `[Slightly mock-offended] "My universe is not perfect. It simply has quantifiable uncertainties."`,
        options: [
          {
            id: 'jesse_final_grin',
            text: '[Watch Jesse\'s reaction]',
            nextNodeId: 'jesse_see_what_i_mean_finale'
          }
        ]
      },
      'jesse_see_what_i_mean_finale': {
        id: 'jesse_see_what_i_mean_finale',
        mentorId: 'jesse',
        text: `[Grins] "See what I mean?"`,
        options: [
          {
            id: 'equipment_path_jesse',
            text: 'Let\'s go see what the equipment is really saying.',
            isEndNode: true,
            relationshipChange: 3,
            tutorialStepCompletion: 'journal_card_explanation',
            setsFlag: 'afternoon_choice:jesse'
          },
          {
            id: 'precision_path_kapoor',
            text: 'I want to understand measurement science properly.',
            isEndNode: true,
            relationshipChange: 3,
            tutorialStepCompletion: 'journal_card_explanation',
            setsFlag: 'afternoon_choice:kapoor'
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
        text: `Our new resident. I am Dr. Kapoor, dosimetry and measurement science. I hear you've had quite an... eventful morning with Garcia and Quinn. They each have their approaches to education. Mine is different.`,
        options: [
          {
            id: 'interested_in_approach',
            text: 'I\'d like to understand your approach, Dr. Kapoor.',
            nextNodeId: 'kapoor_professional_standards',
            relationshipChange: 3,
            insightChange: 2
          },
          {
            id: 'value_precision',
            text: 'I can see precision is important in your work.',
            nextNodeId: 'kapoor_measurement_reality',
            relationshipChange: 2,
            momentumChange: 1
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
        text: `Good. Remember this perspective as you progress through the program. Garcia and Quinn will inspire you, challenge you, help you grow. But maintain your grounding in measurement science. It will serve you well throughout your career.`,
        options: [
          {
            id: 'grateful_for_perspective',
            text: 'Thank you for this perspective, Dr. Kapoor. I\'ll remember it.',
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
        text: `"Alright, let's see what Bertha's complaining about today. Come on." [Leads you to Linear Accelerator room]`,
        options: [
          {
            id: 'follow_to_linac',
            text: '[Follow Jesse to the LINAC room]',
            nextNodeId: 'jesse_shows_readout'
          }
        ]
      },
      'jesse_shows_readout': {
        id: 'jesse_shows_readout',
        mentorId: 'jesse',
        text: `"See this readout? Should be steady as a rock, but look..." [Shows fluctuating display] "Kapoor would tell you to check the protocols first. Me? I say listen to what the machine's actually telling you."`,
        options: [
          {
            id: 'ready_to_listen',
            text: 'How do you listen to what it\'s telling you?',
            nextNodeId: 'jesse_activity_setup',
            insightChange: 2
          },
          {
            id: 'observe_patterns',
            text: 'I can see the pattern in these fluctuations.',
            nextNodeId: 'jesse_activity_setup',
            momentumChange: 1
          }
        ]
      },
      'jesse_activity_setup': {
        id: 'jesse_activity_setup',
        mentorId: 'jesse',
        text: `"Exactly! Equipment has its own language. Temperature, humidity, beam current - it all tells a story. Let's work through this together and see what Bertha's really trying to say."`,
        options: [
          {
            id: 'begin_troubleshooting',
            text: 'Let\'s figure out what\'s wrong.',
            nextNodeId: 'jesse_activity_complete',
            triggersActivity: true
          }
        ]
      },
      'jesse_activity_complete': {
        id: 'jesse_activity_complete',
        mentorId: 'jesse',
        text: `"Good instincts! Machine's happy now. You've got a knack for reading what equipment's really doing versus what it's supposed to be doing. That's a gift - most people just look at the numbers."`,
        options: [
          {
            id: 'intuitive_approach',
            text: 'That was more intuitive than I expected.',
            nextNodeId: 'jesse_end_transition',
            relationshipChange: 3,
            insightChange: 4
          },
          {
            id: 'machine_personalities',
            text: 'I can see why you say machines have personalities.',
            nextNodeId: 'jesse_end_transition',
            relationshipChange: 4,
            insightChange: 3
          }
        ]
      },
      'jesse_end_transition': {
        id: 'jesse_end_transition',
        mentorId: 'jesse',
        text: `"Head over to Quinn's office when you're ready. She mentioned having something for you. And don't let her convince you that optimization is actually poetry - some of us have to make the machines actually work with her 'elegant solutions.'" [Grins]`,
        options: [
          {
            id: 'thanks_for_practical_side',
            text: 'Thanks for showing me the practical side of things.',
            isEndNode: true,
            relationshipChange: 2,
            tutorialStepCompletion: 'night_phase_transition'
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
        text: `"Calibration is the foundation of everything we do here. Without precision, treatment becomes guesswork, and patients suffer." [Leads you to Dosimetry Lab]`,
        options: [
          {
            id: 'follow_to_dosimetry',
            text: '[Follow Dr. Kapoor to the Dosimetry Lab]',
            nextNodeId: 'kapoor_shows_chamber'
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
            tutorialStepCompletion: 'night_phase_transition'
          }
        ]
      }
    }
  },

  /**
   * Quinn's Office - Journal Introduction
   * Lore setup with Amara's journal handover, following mystery over exposition approach
   */
  'tutorial_quinn_office_journal': {
    id: 'tutorial_quinn_office_journal',
    title: 'Quinn\'s Office - Research Insights',
    description: 'Private conversation with Dr. Quinn and introduction to former resident\'s journal',
    startNodeId: 'quinn_office_opening',
    domain: 'treatment_planning',
    difficulty: 1,
    mode: DialogueMode.NARRATIVE,
    isTutorial: true,
    nodes: {
      'quinn_office_opening': {
        id: 'quinn_office_opening',
        mentorId: 'quinn',
        text: `"How'd your afternoon go? [Jesse's equipment detective work / Kapoor's precision training] is excellent preparation for the kind of thinking we do here." [Pause, more thoughtful]`,
        options: [
          {
            id: 'valuable_preparation',
            text: 'It was really valuable. Different from what I expected.',
            nextNodeId: 'quinn_thoughtful_pause',
            relationshipChange: 2
          }
        ]
      },
      'quinn_thoughtful_pause': {
        id: 'quinn_thoughtful_pause',
        mentorId: 'quinn',
        text: `"Garcia mentioned you're someone who picks up on patterns quickly. I've got something that might help with that..." [Pulls out journal] "This belonged to a former resident - brilliant student who developed some... interesting approaches to learning medical physics."`,
        options: [
          {
            id: 'ask_about_approaches',
            text: 'What kind of approaches did they develop?',
            nextNodeId: 'quinn_approaches_inquiry',
            insightChange: 2
          },
          {
            id: 'grateful_for_guidance',
            text: 'Thank you. I appreciate the guidance.',
            nextNodeId: 'quinn_grateful_response',
            relationshipChange: 2
          }
        ]
      },
      'quinn_approaches_inquiry': {
        id: 'quinn_approaches_inquiry',
        mentorId: 'quinn',
        text: `"Hard to explain, really. They saw connections between concepts that others missed. Had this way of making everything feel... interconnected. Take it home tonight, see what you think."`,
        options: [
          {
            id: 'explore_tonight',
            text: 'I\'ll definitely explore it tonight.',
            nextNodeId: 'quinn_night_transition',
            receivesAbility: 'spring_journal',
            tutorialStepCompletion: 'journal_introduction'
          }
        ]
      },
      'quinn_grateful_response': {
        id: 'quinn_grateful_response',
        mentorId: 'quinn',
        text: `"Garcia's right about you. Take this home tonight, browse through it. Sometimes the best insights come when you're not trying so hard to learn."`,
        options: [
          {
            id: 'look_tonight',
            text: 'I\'ll take a look tonight. Thank you.',
            nextNodeId: 'quinn_night_transition',
            receivesAbility: 'spring_journal',
            tutorialStepCompletion: 'journal_introduction'
          }
        ]
      },
      'quinn_night_transition': {
        id: 'quinn_night_transition',
        mentorId: 'quinn',
        text: `"Go home, let today settle in. Sometimes the best insights come when you're not trying so hard. I might call later - curious how your first day sits with you."`,
        options: [
          {
            id: 'looking_forward_tomorrow',
            text: 'Thanks for everything. I\'m looking forward to tomorrow.',
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
        text: `"Hope I'm not calling too late - saw your office light was still on. How's your brain feeling? Sometimes first days here are... a lot to process. Notice anything interesting when you got home?"`,
        options: [
          {
            id: 'just_about_to_explore',
            text: 'I was just about to explore the journal you gave me.',
            nextNodeId: 'quinn_discovery_guidance',
            tutorialStepCompletion: 'observatory_introduction'
          },
          {
            id: 'still_processing',
            text: 'Still processing everything. Could you remind me what to look for?',
            nextNodeId: 'quinn_discovery_guidance',
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
  }
};

// Simplified tutorial dialogue mapping - no complex logic
export const TUTORIAL_DIALOGUE_MAP: Record<string, string> = {
  // First day tutorial sequence
  'physics-office': 'tutorial_physics_office_intro',
  'cafeteria': 'tutorial_lunch_dialogue',
  'dosimetry-lab': 'tutorial_dosimetry_lab_intro',
  // Lunch can be triggered from any room
  'any-room-lunch': 'tutorial_lunch_dialogue',
  // Night phase tutorial
  'observatory': 'tutorial_observatory_call'
};

// Simplified helper - no special case logic
export function getTutorialDialogueForRoom(roomId: string, tutorialStep: string | null): string | null {
  // Direct room mapping first
  if (TUTORIAL_DIALOGUE_MAP[roomId]) {
    return TUTORIAL_DIALOGUE_MAP[roomId];
  }
  
  // Special case: lunch dialogue can happen in any room during lunch step
  if (tutorialStep === 'lunch_dialogue') {
    return TUTORIAL_DIALOGUE_MAP['any-room-lunch'];
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
    availableRooms: ['physics-office', 'treatment-room', 'dosimetry-lab', 'linac-2', 'simulation-suite'],
    recommendedRoom: 'physics-office',
    allowedRooms: ['treatment-room', 'dosimetry-lab', 'linac-2', 'simulation-suite'],
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
    availableRooms: ['cafeteria'],
    recommendedRoom: 'cafeteria',
    description: 'Head to the cafeteria for lunch with the team'
  },
  
  'second_mentor_intro': {
    availableRooms: ['physics-office', 'treatment-room', 'dosimetry-lab', 'linac-2', 'simulation-suite'],
    description: 'Continue lunch conversation with Dr. Quinn'
  },
  
  'constellation_preview': {
    availableRooms: ['physics-office', 'treatment-room', 'dosimetry-lab', 'linac-2', 'simulation-suite'],
    description: 'Learn about the Knowledge Constellation from Dr. Quinn'
  },
  
  'first_ability_intro': {
    availableRooms: ['physics-office', 'treatment-room', 'dosimetry-lab', 'linac-2', 'simulation-suite'],
    description: 'Receive your first ability card from Dr. Quinn'
  },
  
  'journal_card_explanation': {
    availableRooms: ['physics-office', 'treatment-room', 'dosimetry-lab', 'linac-2', 'simulation-suite'],
    description: 'Learn about the journal system from Dr. Quinn'
  },
  
  'night_phase_transition': {
    availableRooms: ['physics-office', 'treatment-room', 'dosimetry-lab', 'linac-2', 'simulation-suite'],
    description: 'Prepare to end your first day'
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
    availableRooms: ['physics-office', 'treatment-room', 'dosimetry-lab', 'linac-2', 'simulation-suite'],
    description: 'Practice building relationships with mentors'
  },
  
  'advanced_dialogue_options': {
    availableRooms: ['physics-office', 'treatment-room', 'dosimetry-lab', 'linac-2', 'simulation-suite'],
    description: 'Explore advanced conversation options'
  },
  
  'special_abilities_unlock': {
    availableRooms: ['physics-office', 'treatment-room', 'dosimetry-lab', 'linac-2', 'simulation-suite'],
    description: 'Discover special abilities through gameplay'
  },
  
  'boss_encounter_prep': {
    availableRooms: ['physics-office', 'treatment-room', 'dosimetry-lab', 'linac-2', 'simulation-suite'],
    description: 'Prepare for challenging scenarios'
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
  if (!tutorialStep) return ['physics-office', 'treatment-room', 'dosimetry-lab', 'linac-2', 'simulation-suite'];
  
  const stepConfig = TUTORIAL_STEP_ROOM_AVAILABILITY[tutorialStep];
  return stepConfig?.availableRooms || [];
} 