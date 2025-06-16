import { Dialogue, DialogueMode } from '@/app/types';

/**
 * Tutorial-specific dialogues that advance tutorial progression
 * These are used when tutorial mode is active and replace standard room dialogues
 */
export const tutorialDialogues: Record<string, Dialogue> = {

  // FIRST DAY TUTORIAL SEQUENCE

  /**
   * Morning Arrival - Physics Office (Dr. Garcia)
   * Tutorial Step: first_mentor_intro, hospital_tour
   */
  'tutorial_physics_office_intro': {
    id: 'tutorial_physics_office_intro',
    title: 'Meeting Dr. Garcia - Tutorial',
    description: 'First mentor introduction in tutorial mode',
    startNodeId: 'garcia_welcome',
    domain: 'general',
    difficulty: 1,
    mode: DialogueMode.NARRATIVE,
    isTutorial: true,
    nodes: {
      'garcia_welcome': {
        id: 'garcia_welcome',
        mentorId: 'garcia',
        text: `You must be our new resident! I'm Dr. Garcia, lead radiation oncologist. Welcome to Memorial General! I've been looking forward to meeting you.`,
        options: [
          {
            id: 'enthusiastic_response',
            text: 'Thank you, I\'m excited to be here.',
            nextNodeId: 'garcia_tour_offer',
            relationshipChange: 2,
            tutorialStepCompletion: 'first_mentor_intro'
          },
          {
            id: 'observational_response', 
            text: 'Nice to meet you. This place is impressive.',
            nextNodeId: 'garcia_tour_offer',
            relationshipChange: 1,
            tutorialStepCompletion: 'first_mentor_intro'
          }
        ]
      },
      'garcia_tour_offer': {
        id: 'garcia_tour_offer',
        mentorId: 'garcia',
        text: `We have orientation starting in a bit, but I'd love to show you around first. The hospital has several specialized areas you'll be working in. Would you like a quick tour of the different rooms?`,
        options: [
          {
            id: 'guided_tour',
            text: 'I\'d love a tour of the different areas.',
            nextNodeId: 'garcia_tour_explanation',
            insightChange: 3
          },
          {
            id: 'explore_independently',
            text: 'I\'ll explore a bit on my own first.',
            nextNodeId: 'garcia_independent_exploration',
            momentumChange: 1
          }
        ]
      },
      'garcia_tour_explanation': {
        id: 'garcia_tour_explanation',
        mentorId: 'garcia',
        text: `Perfect! You'll see glowing indicators for each room - they show where different activities and learning opportunities are available. The Physics Office here is where we do planning and analysis. Feel free to explore each area when you're ready.`,
        options: [
          {
            id: 'understand_navigation',
            text: 'I understand. The glowing rooms are interactive areas.',
            nextNodeId: 'garcia_first_activity_intro',
            tutorialStepCompletion: 'hospital_tour'
          }
        ]
      },
      'garcia_independent_exploration': {
        id: 'garcia_independent_exploration',
        mentorId: 'garcia',
        text: `That's the spirit! Look for the glowing room indicators - each one represents a different learning opportunity. Take your time to get familiar with the layout. I'll be here when you're ready for your first activity.`,
        options: [
          {
            id: 'ready_for_activity',
            text: 'Thank you. I\'ll explore and then come back.',
            nextNodeId: 'garcia_first_activity_intro',
            tutorialStepCompletion: 'hospital_tour'
          }
        ]
      },
      'garcia_first_activity_intro': {
        id: 'garcia_first_activity_intro',
        mentorId: 'garcia',
        text: `Now, let's start with your first educational activity. This will help you get your bearings in radiation therapy. As you engage with questions and concepts, you'll gain Insight points - think of them as your learning currency.`,
        options: [
          {
            id: 'ready_for_learning',
            text: 'I\'m ready to start learning.',
            nextNodeId: 'garcia_insight_explanation',
            tutorialStepCompletion: 'first_educational_activity'
          }
        ]
      },
      'garcia_insight_explanation': {
        id: 'garcia_insight_explanation',
        mentorId: 'garcia',
        text: `Excellent! As you answer questions thoughtfully, you'll see your Insight points increase. These points unlock new knowledge in your constellation - a visual map of everything you're learning. Ready to dive in?`,
        options: [
          {
            id: 'begin_activity',
            text: 'Let\'s begin the activity.',
            nextNodeId: 'garcia_activity_complete',
            triggersActivity: true,
            tutorialStepCompletion: 'insight_mechanic_intro'
          }
        ]
      },
      'garcia_activity_complete': {
        id: 'garcia_activity_complete',
        mentorId: 'garcia',
        text: `Outstanding work! Notice how you gained Insight points as you engaged with the material? This is how you'll build your knowledge throughout the residency. Now, why don't you explore the other rooms and meet the rest of the team?`,
        options: [
          {
            id: 'explore_other_rooms',
            text: 'I\'ll go meet the other mentors.',
            isEndNode: true,
            relationshipChange: 3,
            insightChange: 5
          }
        ]
      }
    }
  },

  /**
   * Lunch Break Dialogue - Any Room (Dr. Quinn)
   * Tutorial Step: second_mentor_intro, constellation_preview
   */
  'tutorial_lunch_dialogue': {
    id: 'tutorial_lunch_dialogue',
    title: 'Lunch with Dr. Quinn - Tutorial',
    description: 'Second mentor introduction and constellation preview',
    startNodeId: 'quinn_introduction',
    domain: 'treatment_planning',
    difficulty: 1,
    mode: DialogueMode.NARRATIVE,
    isTutorial: true,
    nodes: {
      'quinn_introduction': {
        id: 'quinn_introduction',
        mentorId: 'quinn',
        text: `Mind if I join you? You must be our new resident! I'm Dr. Quinn, head of Treatment Planning. I've been hearing good things about your morning with Garcia.`,
        options: [
          {
            id: 'polite_response',
            text: 'Nice to meet you, Dr. Quinn.',
            nextNodeId: 'quinn_morning_inquiry',
            relationshipChange: 2
          },
          {
            id: 'informed_response',
            text: 'I\'ve heard about your work in planning optimization.',
            nextNodeId: 'quinn_impressed_response',
            relationshipChange: 3,
            insightChange: 2
          }
        ]
      },
      'quinn_morning_inquiry': {
        id: 'quinn_morning_inquiry',
        mentorId: 'quinn',
        text: `Garcia's probably shown you the clinical side this morning. Treatment planning is where the physics really shines! Tell me, did you notice anything interesting about how your learning is being tracked?`,
        options: [
          {
            id: 'noticed_insight_points',
            text: 'Yes, I noticed the Insight points system.',
            nextNodeId: 'quinn_constellation_preview',
            tutorialStepCompletion: 'second_mentor_intro'
          },
          {
            id: 'ask_about_tracking',
            text: 'What do you mean by learning tracking?',
            nextNodeId: 'quinn_constellation_preview',
            tutorialStepCompletion: 'second_mentor_intro'
          }
        ]
      },
      'quinn_impressed_response': {
        id: 'quinn_impressed_response',
        mentorId: 'quinn',
        text: `Impressive! You've done your homework. Yes, we've developed some innovative approaches to treatment planning here. But there's something even more exciting I want to tell you about...`,
        options: [
          {
            id: 'curious_about_innovation',
            text: 'What kind of innovation?',
            nextNodeId: 'quinn_constellation_preview',
            tutorialStepCompletion: 'second_mentor_intro'
          }
        ]
      },
      'quinn_constellation_preview': {
        id: 'quinn_constellation_preview',
        mentorId: 'quinn',
        text: `Have you heard about our Knowledge Constellation approach? It's a revolutionary way to visualize and connect the concepts you're learning. Each insight you gain creates a star in your personal constellation - and tonight, you'll get to explore it!`,
        options: [
          {
            id: 'intrigued_constellation',
            text: 'No, what\'s that? It sounds fascinating.',
            nextNodeId: 'quinn_constellation_explanation',
            insightChange: 3
          },
          {
            id: 'eager_to_learn',
            text: 'Just briefly. I\'d like to know more.',
            nextNodeId: 'quinn_constellation_explanation',
            momentumChange: 1
          }
        ]
      },
      'quinn_constellation_explanation': {
        id: 'quinn_constellation_explanation',
        mentorId: 'quinn',
        text: `Picture this: every medical physics concept you master becomes a glowing star. Related concepts form connections, creating patterns of understanding. Tonight, in your observatory, you'll use the Star Points you've earned to unlock new knowledge. It's learning made visible!`,
        options: [
          {
            id: 'excited_about_tonight',
            text: 'That sounds amazing! I can\'t wait to try it.',
            nextNodeId: 'quinn_ability_introduction',
            relationshipChange: 3,
            tutorialStepCompletion: 'constellation_preview'
          },
          {
            id: 'thoughtful_response',
            text: 'It\'s an innovative approach to education.',
            nextNodeId: 'quinn_ability_introduction',
            relationshipChange: 2,
            insightChange: 2,
            tutorialStepCompletion: 'constellation_preview'
          }
        ]
      },
      'quinn_ability_introduction': {
        id: 'quinn_ability_introduction',
        mentorId: 'quinn',
        text: `Before you go today, I want to give you something for your journal. I've written down a technique called 'Conceptual Mapping' that might help with your activities. When you get home tonight, add it to your journal, and you can use it tomorrow.`,
        options: [
          {
            id: 'accept_ability_card',
            text: 'Thank you! How does the journal system work?',
            nextNodeId: 'quinn_journal_explanation',
            receivesAbility: 'conceptual_mapping',
            tutorialStepCompletion: 'first_ability_intro'
          }
        ]
      },
      'quinn_journal_explanation': {
        id: 'quinn_journal_explanation',
        mentorId: 'quinn',
        text: `Your journal is where you'll organize the abilities and insights you gather. During night phases, you can arrange them strategically to enhance your learning efficiency. Think of it as your personal toolkit for medical physics mastery.`,
        options: [
          {
            id: 'understand_journal',
            text: 'I understand. Organize abilities for maximum effectiveness.',
            nextNodeId: 'quinn_night_transition',
            insightChange: 5,
            tutorialStepCompletion: 'journal_card_explanation'
          }
        ]
      },
      'quinn_night_transition': {
        id: 'quinn_night_transition',
        mentorId: 'quinn',
        text: `Perfect! Your first day is almost complete. Tonight, you'll explore your constellation, organize your journal, and prepare for tomorrow's challenges. I might give you a call later to see how you're settling in.`,
        options: [
          {
            id: 'looking_forward',
            text: 'I\'m looking forward to tonight\'s exploration.',
            isEndNode: true,
            relationshipChange: 4,
            tutorialStepCompletion: 'night_phase_transition'
          }
        ]
      }
    }
  },

  /**
   * Meeting Dr. Kapoor - Dosimetry Lab
   * Tutorial Step: third_mentor_intro
   */
  'tutorial_dosimetry_lab_intro': {
    id: 'tutorial_dosimetry_lab_intro',
    title: 'Meeting Dr. Kapoor - Tutorial',
    description: 'Third mentor introduction focusing on precision and measurement',
    startNodeId: 'kapoor_introduction',
    domain: 'dosimetry',
    difficulty: 1,
    mode: DialogueMode.NARRATIVE,
    isTutorial: true,
    nodes: {
      'kapoor_introduction': {
        id: 'kapoor_introduction',
        mentorId: 'kapoor',
        text: `Ah, our new resident. I am Dr. Kapoor, dosimetry and measurement science. I trust your first day has been... educational? Precision in measurement leads to precision in treatment.`,
        options: [
          {
            id: 'appreciate_precision',
            text: 'Yes, I can already see how important precision is here.',
            nextNodeId: 'kapoor_measurement_philosophy',
            relationshipChange: 3,
            insightChange: 2
          },
          {
            id: 'eager_to_learn',
            text: 'It has been! I\'m eager to learn about dosimetry.',
            nextNodeId: 'kapoor_measurement_philosophy',
            relationshipChange: 2,
            momentumChange: 1
          }
        ]
      },
      'kapoor_measurement_philosophy': {
        id: 'kapoor_measurement_philosophy',
        mentorId: 'kapoor',
        text: `Good. In medical physics, we deal with quantities that can mean the difference between cure and complication. Every measurement must be traceable, every calibration verified. When you understand measurement science, uncertainty becomes certainty.`,
        options: [
          {
            id: 'understand_importance',
            text: 'I understand. Precise measurements save lives.',
            nextNodeId: 'kapoor_tutorial_conclusion',
            relationshipChange: 4,
            insightChange: 3,
            tutorialStepCompletion: 'third_mentor_intro'
          },
          {
            id: 'ask_about_methods',
            text: 'What measurement methods do you use here?',
            nextNodeId: 'kapoor_methods_overview',
            insightChange: 4
          }
        ]
      },
      'kapoor_methods_overview': {
        id: 'kapoor_methods_overview',
        mentorId: 'kapoor',
        text: `TG-51 protocols for absolute dose calibration, ion chamber measurements with NIST-traceable standards, comprehensive quality assurance procedures. Each method has been validated through rigorous testing. Precision is not optional in this field.`,
        options: [
          {
            id: 'impressed_by_rigor',
            text: 'The scientific rigor here is impressive.',
            nextNodeId: 'kapoor_tutorial_conclusion',
            relationshipChange: 3,
            insightChange: 5,
            tutorialStepCompletion: 'third_mentor_intro'
          }
        ]
      },
      'kapoor_tutorial_conclusion': {
        id: 'kapoor_tutorial_conclusion',
        mentorId: 'kapoor',
        text: `You show promise. Continue to value precision in all your work here. Remember: in medical physics, we measure to heal. Your first day is concluding - use your evening well to consolidate what you have learned.`,
        options: [
          {
            id: 'thank_dr_kapoor',
            text: 'Thank you, Dr. Kapoor. I\'ll remember that.',
            isEndNode: true,
            relationshipChange: 3,
            insightChange: 3
          }
        ]
      }
    }
  },

  // NIGHT PHASE TUTORIAL SEQUENCE (placeholder for future implementation)

  /**
   * Observatory Phone Call - Night Phase
   * Tutorial Step: observatory_introduction, constellation_interface
   */
  'tutorial_observatory_call': {
    id: 'tutorial_observatory_call',
    title: 'Observatory Phone Call - Tutorial',
    description: 'Dr. Quinn guides you through your first constellation experience',
    startNodeId: 'quinn_phone_opening',
    domain: 'general',
    difficulty: 1,
    mode: DialogueMode.NARRATIVE,
    isTutorial: true,
    nodes: {
      'quinn_phone_opening': {
        id: 'quinn_phone_opening',
        mentorId: 'quinn',
        text: `Hope I'm not calling too late! Just wanted to check how your first day went. Have you had a chance to look at the Knowledge Constellation yet?`,
        options: [
          {
            id: 'just_about_to',
            text: 'I was just about to explore it.',
            nextNodeId: 'quinn_constellation_guidance',
            tutorialStepCompletion: 'observatory_introduction'
          },
          {
            id: 'need_reminder',
            text: 'Not yet, could you remind me how it works?',
            nextNodeId: 'quinn_constellation_guidance',
            tutorialStepCompletion: 'observatory_introduction'
          }
        ]
      },
      'quinn_constellation_guidance': {
        id: 'quinn_constellation_guidance',
        mentorId: 'quinn',
        text: `The constellation map should be right in front of you. Those glowing points? Each represents something you learned today. Use the Star Points you earned to unlock them. Start with any star that interests you!`,
        options: [
          {
            id: 'ready_to_explore',
            text: 'I see them! I\'ll start exploring.',
            isEndNode: true,
            insightChange: 3,
            tutorialStepCompletion: 'constellation_interface'
          }
        ]
      }
    }
  }
};

// Helper function to get tutorial dialogue for a room when tutorial is active
export function getTutorialDialogueForRoom(roomId: string, tutorialStep?: string): string | null {
  // Map room IDs to tutorial dialogues based on current tutorial step
  const tutorialRoomMapping: Record<string, string> = {
    'physics-office': 'tutorial_physics_office_intro',
    'dosimetry-lab': 'tutorial_dosimetry_lab_intro',
    // Lunch dialogue can be triggered from any room during appropriate tutorial step
    'treatment-room': tutorialStep === 'lunch_dialogue' ? 'tutorial_lunch_dialogue' : null,
    'linac-2': tutorialStep === 'lunch_dialogue' ? 'tutorial_lunch_dialogue' : null,
    'simulation-suite': tutorialStep === 'lunch_dialogue' ? 'tutorial_lunch_dialogue' : null,
  };

  return tutorialRoomMapping[roomId] || null;
}

// Helper function to check if a dialogue is tutorial-specific
export function isTutorialDialogue(dialogueId: string): boolean {
  return tutorialDialogues.hasOwnProperty(dialogueId);
} 