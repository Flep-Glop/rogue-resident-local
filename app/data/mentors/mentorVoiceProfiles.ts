import { MentorVoiceProfile } from '../../types/mentorVoice';

// Dr. Kapoor - Dosimetry expert (precise, methodical, accuracy-focused)
export const kapoorProfile: MentorVoiceProfile = {
  id: 'Kapoor',
  name: 'Dr. Kapoor',
  specialties: ['DOSIMETRY', 'RADIATION_THERAPY'],
  personalityTraits: ['precise', 'methodical', 'detail-oriented', 'analytical'],
  patterns: {
    intros: [
      "Let's consider the data:",
      "Precisely speaking,",
      "From a dosimetric perspective,",
      "The measurements indicate that",
      "If we analyze this systematically,"
    ],
    inquiries: [
      "Could you determine",
      "Please calculate",
      "How would you measure",
      "What is the precise value of",
      "Can you identify the correct methodology for"
    ],
    challenges: [
      "This requires careful analysis:",
      "Let's approach this methodically:",
      "A challenging measurement scenario:"
    ],
    boastResponses: [
      "Excellent confidence! Let's test the precision of your knowledge.",
      "I appreciate your enthusiasm. This will require exacting analysis.",
      "Very well. This will require attention to detail."
    ],
    correctFeedback: [
      "Precisely correct! The accuracy of your answer is commendable.",
      "Exactly right. Your measurement technique is spot-on.",
      "Perfect calibration! That's the exact approach."
    ],
    incorrectFeedback: [
      "Not quite. Let's recalibrate our thinking:",
      "The measurement is off. Consider:",
      "That's imprecise. The correct approach is:"
    ],
    encouragement: [
      "Precision comes with practice.",
      "Every measurement teaches us something.",
      "Attention to detail will serve you well."
    ],
    domainPhrases: {
      DOSIMETRY: [
        "calibration factor",
        "absolute dosimetry",
        "measurement uncertainty",
        "traceability to standards"
      ],
      RADIATION_THERAPY: [
        "dose verification",
        "quality assurance protocol",
        "measurement accuracy"
      ]
    },
    difficultyPhrases: {
      BEGINNER: [
        "basic measurement principles",
        "standard protocols",
        "fundamental calibration"
      ],
      INTERMEDIATE: [
        "deviation analysis",
        "correction factors",
        "measurement uncertainty"
      ],
      ADVANCED: [
        "systematic error propagation",
        "detector-specific considerations",
        "advanced measurement protocols"
      ]
    },
    transitions: [
      "Furthermore,",
      "Additionally,",
      "Subsequently,",
      "Moreover,",
      "Specifically,"
    ],
    emphasis: [
      "absolutely critical",
      "precisely measured",
      "methodically verified"
    ],
    conclusions: [
      "This confirms our measurement approach.",
      "The data supports this conclusion.",
      "The precision of this method is evident."
    ]
  }
};

// Dr. Garcia - Radiation Therapy expert (warm, patient-centered, clinical)
export const garciaProfile: MentorVoiceProfile = {
  id: 'Garcia',
  name: 'Dr. Garcia',
  specialties: ['RADIATION_THERAPY', 'TREATMENT_PLANNING'],
  personalityTraits: ['warm', 'patient-centered', 'compassionate', 'practical'],
  patterns: {
    intros: [
      "From my clinical experience,",
      "When working with patients,",
      "In treatment scenarios,",
      "For optimal patient care,",
      "From a therapeutic perspective,"
    ],
    inquiries: [
      "How would you approach this patient case?",
      "What's the best way to explain to a patient",
      "How might we improve the therapeutic ratio for",
      "Which treatment approach would you recommend for"
    ],
    challenges: [
      "This patient case presents unique challenges:",
      "Consider this clinical scenario:",
      "Here's a challenging treatment situation:"
    ],
    boastResponses: [
      "I appreciate your confidence! Let's explore a complex patient scenario.",
      "Wonderful! Let's see how you'd handle this challenging clinical case.",
      "Excellent! Here's a situation I encountered recently with a patient."
    ],
    correctFeedback: [
      "Exactly right! That's precisely what would benefit the patient most.",
      "Perfect! Your clinical reasoning will serve your patients well.",
      "Excellent therapeutic approach! The patient outcome would be optimal."
    ],
    incorrectFeedback: [
      "I see your thinking, but consider the patient's perspective:",
      "That approach might lead to complications. Instead, consider:",
      "Let's reconsider with the patient's quality of life in mind:"
    ],
    encouragement: [
      "Your compassion will make you an excellent clinician.",
      "Keep focusing on patient-centered approaches.",
      "Clinical judgment develops with each patient you treat."
    ],
    domainPhrases: {
      RADIATION_THERAPY: [
        "treatment delivery",
        "patient positioning",
        "side effect management",
        "fractionation schedule"
      ],
      TREATMENT_PLANNING: [
        "plan optimization",
        "dose constraints",
        "target coverage"
      ]
    },
    difficultyPhrases: {
      BEGINNER: [
        "standard fractionation",
        "common side effects",
        "typical treatment course"
      ],
      INTERMEDIATE: [
        "alternate fractionation schemes",
        "challenging anatomical sites",
        "concurrent therapy considerations"
      ],
      ADVANCED: [
        "complex re-treatment cases",
        "rare toxicity management",
        "specialized treatment techniques"
      ]
    },
    transitions: [
      "When considering the patient's needs,",
      "From a clinical standpoint,",
      "Looking at quality of life,",
      "To improve patient outcomes,"
    ],
    emphasis: [
      "patient comfort is paramount",
      "clinical outcome depends on",
      "therapeutic benefit outweighs the risk"
    ],
    conclusions: [
      "The patient's wellbeing is our priority.",
      "This approach optimizes therapeutic ratio.",
      "Clinical evidence supports this decision."
    ]
  }
};

// Dr. Jesse - Linac Anatomy expert (practical, hands-on, equipment-focused)
export const jesseProfile: MentorVoiceProfile = {
  id: 'Jesse',
  name: 'Dr. Jesse',
  specialties: ['LINAC_ANATOMY', 'DOSIMETRY'],
  personalityTraits: ['practical', 'hands-on', 'technical', 'direct'],
  patterns: {
    intros: [
      "Let's look at the machine itself,",
      "From a technical standpoint,",
      "When you're working with the equipment,",
      "If you check the linac components,",
      "During routine QA,"
    ],
    inquiries: [
      "How would you troubleshoot",
      "What component is responsible for",
      "Which system controls",
      "How does the machine handle"
    ],
    challenges: [
      "You encounter this error during morning QA:",
      "The machine is showing these interlock messages:",
      "During treatment, this component malfunctions:"
    ],
    boastResponses: [
      "Great! Let's dive into the technical details then.",
      "I like your confidence! Here's a tricky machine problem I encountered.",
      "Perfect! I have just the challenge for someone who knows their way around the equipment."
    ],
    correctFeedback: [
      "Spot on! You'd have that machine back up and running in no time.",
      "Exactly right! That's precisely how the system works.",
      "Perfect! Your technical knowledge is solid."
    ],
    incorrectFeedback: [
      "Not quite. If you check the component diagram,",
      "That would actually cause a different problem. Here's why:",
      "Let's trace the signal path again:"
    ],
    encouragement: [
      "With practice, you'll know these machines inside and out.",
      "Keep getting your hands on the equipment whenever you can.",
      "Technical knowledge comes from practical experience."
    ],
    domainPhrases: {
      LINAC_ANATOMY: [
        "beam steering",
        "waveguide assembly",
        "bending magnet",
        "electron gun"
      ],
      DOSIMETRY: [
        "flatness and symmetry",
        "output calibration",
        "daily QA procedures"
      ]
    },
    difficultyPhrases: {
      BEGINNER: [
        "basic components",
        "common interlocks",
        "standard procedures"
      ],
      INTERMEDIATE: [
        "troubleshooting workflows",
        "component interactions",
        "calibration adjustments"
      ],
      ADVANCED: [
        "upstream component effects",
        "signal processing chain",
        "advanced interlock systems"
      ]
    },
    transitions: [
      "Moving through the system,",
      "Downstream from that,",
      "If you follow the beam path,",
      "When that component activates,"
    ],
    emphasis: [
      "critical to beam stability",
      "directly affects output",
      "key safety system"
    ],
    conclusions: [
      "That's how the machine handles it.",
      "This approach minimizes downtime.",
      "Understanding this keeps treatments running smoothly."
    ]
  }
};

// Dr. Quinn - Treatment Planning expert (conceptual, explores connections)
export const quinnProfile: MentorVoiceProfile = {
  id: 'Quinn',
  name: 'Dr. Quinn',
  specialties: ['TREATMENT_PLANNING', 'LINAC_ANATOMY'],
  personalityTraits: ['conceptual', 'innovative', 'curious', 'theoretical'],
  patterns: {
    intros: [
      "I've been thinking about this fascinating question:",
      "Consider the underlying principles:",
      "There's an elegant concept here:",
      "What's truly interesting is how",
      "The beauty of this problem is"
    ],
    inquiries: [
      "How would you conceptualize",
      "What happens when we consider",
      "How do these elements interact in",
      "What underlying principle explains"
    ],
    challenges: [
      "This reveals a fascinating conceptual challenge:",
      "Consider this theoretical scenario:",
      "Here's where things get intellectually stimulating:"
    ],
    boastResponses: [
      "Ah, confidence! Let's explore a more nuanced scenario then.",
      "Wonderful! Let's delve into the deeper theoretical implications.",
      "Excellent! How about we explore the subtle interconnections in this problem?"
    ],
    correctFeedback: [
      "Yes! The physics—it's about fundamental principles—elegantly connected!",
      "Precisely! You've grasped the conceptual framework beautifully.",
      "Exactly right! The theoretical underpinnings are clear to you."
    ],
    incorrectFeedback: [
      "Almost, but consider the underlying principle:",
      "Interesting approach, but let's reconsider the fundamental concepts:",
      "That's a common misconception. Think about it this way:"
    ],
    encouragement: [
      "Keep exploring these conceptual connections.",
      "Your theoretical understanding is developing nicely.",
      "The beauty of physics reveals itself through these patterns."
    ],
    domainPhrases: {
      TREATMENT_PLANNING: [
        "algorithm convergence",
        "dose calculation model",
        "optimization function",
        "heterogeneity corrections"
      ],
      LINAC_ANATOMY: [
        "beam formation principles",
        "energy selection mechanisms",
        "photon production theory"
      ]
    },
    difficultyPhrases: {
      BEGINNER: [
        "basic principles",
        "fundamental concepts",
        "core theoretical framework"
      ],
      INTERMEDIATE: [
        "competing theoretical models",
        "algorithmic nuances",
        "calculation approximations"
      ],
      ADVANCED: [
        "theoretical limitations",
        "model boundary conditions",
        "advanced implementation challenges"
      ]
    },
    transitions: [
      "What's fascinating is",
      "This connects elegantly with",
      "When we extend this concept,",
      "The underlying principle here,"
    ],
    emphasis: [
      "conceptually transformative",
      "theoretically profound",
      "fundamentally elegant"
    ],
    conclusions: [
      "This reveals the beautiful symmetry in the system.",
      "The theoretical model accounts for these observations perfectly.",
      "The elegance of this solution lies in its simplicity."
    ]
  }
};

// Export all profiles
export const mentorProfiles: {[key: string]: MentorVoiceProfile} = {
  Kapoor: kapoorProfile,
  Garcia: garciaProfile,
  Jesse: jesseProfile,
  Quinn: quinnProfile
}; 