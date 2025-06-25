// Mentor personality configs - no new assets needed, just different text patterns!
export interface MentorPersonality {
  id: string;
  reactionPatterns: {
    correct: string[];
    incorrect: string[];
    brilliant: string[];  // For exceptional answers
    persistent: string[]; // When student tries multiple times
  };
  questionPrefix: string;
  explanationStyle: 'detailed' | 'concise' | 'socratic' | 'encouraging';
  favoriteEmoji: string;
  catchPhrases: string[];
}

export const mentorPersonalities: Record<string, MentorPersonality> = {
  garcia: {
    id: 'garcia',
    reactionPatterns: {
      correct: [
        "Good clinical thinking.",
        "That's the approach I'd take.",
        "Solid reasoning. Patients benefit from this kind of careful analysis.",
        "You're developing good clinical instincts."
      ],
      incorrect: [
        "Let's think through this step by step.",
        "Consider the clinical implications here.",
        "What would be safest for the patient?",
        "Remember, in oncology, precision matters."
      ],
      brilliant: [
        "Excellent! That's exactly the kind of insight we need.",
        "Outstanding analysis. You're thinking like a medical physicist.",
        "That's the level of thinking that makes great physicists."
      ],
      persistent: [
        "I appreciate your persistence. That's important in our field.",
        "Keep working at it. Understanding comes with practice.",
        "Good - don't give up. Complex problems require patience."
      ]
    },
    questionPrefix: "In the clinic, we often encounter situations where",
    explanationStyle: 'detailed',
    favoriteEmoji: '🏥',
    catchPhrases: [
      "Patient safety comes first.",
      "In radiation therapy, precision isn't optional.",
      "Experience teaches us to expect the unexpected."
    ]
  },

  kapoor: {
    id: 'kapoor',
    reactionPatterns: {
      correct: [
        "Correct. Precision is maintained.",
        "Acceptable. Within tolerance.",
        "Yes. The protocol is followed properly.",
        "Accurate. Continue with this methodology."
      ],
      incorrect: [
        "Incorrect. Review the protocol.",
        "Error detected. Recalibrate your approach.",
        "This deviates from standard procedure.",
        "Precision is compromised. Reassess."
      ],
      brilliant: [
        "Exceptional precision. This is the standard.",
        "Perfect execution. Protocol mastery achieved.",
        "Outstanding accuracy. Few demonstrate this level."
      ],
      persistent: [
        "Persistence is required for mastery.",
        "Repetition leads to precision.",
        "Continue. Accuracy improves with practice."
      ]
    },
    questionPrefix: "According to established protocols",
    explanationStyle: 'concise',
    favoriteEmoji: '📊',
    catchPhrases: [
      "Precision cannot be rushed.",
      "The protocol exists for a reason.",
      "Measurement uncertainty must be minimized.",
      "Calibration is not optional."
    ]
  },

  quinn: {
    id: 'quinn',
    reactionPatterns: {
      correct: [
        "Fascinating! You're seeing the patterns.",
        "Excellent connection. The physics is revealing itself.",
        "Yes! There's always an elegant solution.",
        "Beautiful reasoning. I love when the math works out."
      ],
      incorrect: [
        "Interesting approach, but consider the underlying physics...",
        "Not quite, but I like where your mind went.",
        "Close! Think about what the equations are telling us.",
        "The universe is more elegant than that solution suggests."
      ],
      brilliant: [
        "Brilliant! That's the kind of insight that changes everything.",
        "Extraordinary! You've grasped something fundamental.",
        "Remarkable connection. That's true understanding."
      ],
      persistent: [
        "I admire your curiosity. That's the spirit of discovery.",
        "Keep questioning. That's how breakthroughs happen.",
        "Your persistence reminds me of my early research days."
      ]
    },
    questionPrefix: "What if we approached this by considering",
    explanationStyle: 'socratic',
    favoriteEmoji: '✨',
    catchPhrases: [
      "The universe has elegant solutions.",
      "There's always a deeper pattern.",
      "Physics is beautiful when you really see it.",
      "Question everything, especially the obvious."
    ]
  },

  jesse: {
    id: 'jesse',
    reactionPatterns: {
      correct: [
        "Nice! You're getting the hang of this.",
        "Yeah, that's how the real world works.",
        "Good call. I've seen that exact situation before.",
        "Right on. Experience teaches you these things."
      ],
      incorrect: [
        "Nah, think about it practically...",
        "I've seen that mistake before. Here's what really happens:",
        "Real world tip: that approach usually backfires.",
        "Trust me, I've been there. Try this instead:"
      ],
      brilliant: [
        "Whoa! That's some next-level thinking!",
        "Damn, you figured that out fast. Impressive!",
        "That's the kind of insight that saves the day!"
      ],
      persistent: [
        "I like your determination. That's what gets things done.",
        "Keep at it! Every expert was once a beginner.",
        "Hey, we all learn by doing. You're doing great."
      ]
    },
    questionPrefix: "In my experience, when you're dealing with",
    explanationStyle: 'encouraging',
    favoriteEmoji: '🔧',
    catchPhrases: [
      "Real world is messier than textbooks.",
      "If you can't explain it simply, you don't understand it.",
      "Every machine has personality. You'll learn theirs.",
      "Best way to learn is to get your hands dirty."
    ]
  }
};

// Dynamic response generator
export class MentorResponseGenerator {
  static getReaction(mentorId: string, isCorrect: boolean, isExceptional: boolean = false, attemptCount: number = 1): string {
    const personality = mentorPersonalities[mentorId];
    if (!personality) return "Good work.";

    let responses: string[];
    
    if (isExceptional && isCorrect) {
      responses = personality.reactionPatterns.brilliant;
    } else if (isCorrect) {
      responses = personality.reactionPatterns.correct;
    } else if (attemptCount > 2) {
      responses = personality.reactionPatterns.persistent;
    } else {
      responses = personality.reactionPatterns.incorrect;
    }

    return responses[Math.floor(Math.random() * responses.length)];
  }

  static formatQuestionIntro(mentorId: string, baseQuestion: string): string {
    const personality = mentorPersonalities[mentorId];
    if (!personality) return baseQuestion;

    return `${personality.questionPrefix} ${baseQuestion.toLowerCase()}`;
  }

  static addPersonalTouch(mentorId: string, response: string): string {
    const personality = mentorPersonalities[mentorId];
    if (!personality) return response;

    // Occasionally add a catch phrase or emoji
    if (Math.random() < 0.3) {
      const catchPhrase = personality.catchPhrases[Math.floor(Math.random() * personality.catchPhrases.length)];
      return `${response}\n\n${personality.favoriteEmoji} ${catchPhrase}`;
    }

    return response;
  }

  static getEncouragementMessage(mentorId: string): string {
    const personality = mentorPersonalities[mentorId];
    if (!personality) return "Keep learning!";

    const encouragements = personality.reactionPatterns.persistent;
    return encouragements[Math.floor(Math.random() * encouragements.length)];
  }
}

// Room-specific mentor assignment optimization
export const roomMentorSpecialties = {
  'dosimetry-lab': {
    primaryMentor: 'kapoor',
    expertise: 'Precision measurement and calibration protocols',
    secondaryMentors: ['garcia', 'quinn'],
    specialNote: 'Kapoor insists on following TG-51 protocols exactly.'
  },
  'linac-1': {
    primaryMentor: 'garcia',
    expertise: 'Clinical workflow and patient safety',
    secondaryMentors: ['quinn', 'jesse'],
    specialNote: 'Garcia has 15 years of clinical experience.'
  },
  'physics-office': {
    primaryMentor: 'quinn',
    expertise: 'Treatment planning and optimization theory',
    secondaryMentors: ['garcia', 'kapoor'],
    specialNote: 'Quinn loves exploring new planning techniques.'
  },
  'simulation-suite': {
    primaryMentor: 'jesse',
    expertise: 'Practical equipment operation and troubleshooting',
    secondaryMentors: ['kapoor', 'garcia'],
    specialNote: 'Jesse knows every quirk of the equipment.'
  }
}; 