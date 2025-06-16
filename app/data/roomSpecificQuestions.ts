// Room-specific question generators that use existing infrastructure
export interface RoomQuestionConfig {
  roomId: string;
  questionStyle: 'clinical' | 'technical' | 'analytical' | 'procedural';
  contextPrefix: string;
  feedbackStyle: string;
  successParticleType: string;
}

export const roomQuestionConfigs: Record<string, RoomQuestionConfig> = {
  'dosimetry-lab': {
    roomId: 'dosimetry-lab',
    questionStyle: 'technical',
    contextPrefix: '📊 CALIBRATION PROTOCOL',
    feedbackStyle: 'precision',
    successParticleType: 'precision'
  },
  'treatment-room': {
    roomId: 'treatment-room', 
    questionStyle: 'clinical',
    contextPrefix: '⚡ PATIENT SAFETY CHECK',
    feedbackStyle: 'safety',
    successParticleType: 'energy'
  },
  'linac-2': {
    roomId: 'linac-2',
    questionStyle: 'technical',
    contextPrefix: '⚡ LINAC SYSTEMS CHECK',
    feedbackStyle: 'technical',
    successParticleType: 'energy'
  },
  'physics-office': {
    roomId: 'physics-office',
    questionStyle: 'analytical',
    contextPrefix: '📈 TREATMENT ANALYSIS',
    feedbackStyle: 'analytical',
    successParticleType: 'insight'
  },
  'simulation-suite': {
    roomId: 'simulation-suite',
    questionStyle: 'procedural', 
    contextPrefix: '🎮 SIMULATION SCENARIO',
    feedbackStyle: 'simulation',
    successParticleType: 'simulation'
  }
};

// Question formatters that make the same content feel different
export class RoomQuestionFormatter {
  static formatQuestion(baseQuestion: string, roomId: string, contextData?: any): string {
    const config = roomQuestionConfigs[roomId];
    if (!config) return baseQuestion;

    switch (config.questionStyle) {
      case 'technical':
        return `${config.contextPrefix}\n\n` +
               `MEASUREMENT CONDITIONS:\n` +
               `• Temperature: 22.1°C ±0.2\n` +
               `• Pressure: 101.3 kPa\n` +
               `• Humidity: 45% RH\n\n` +
               `QUESTION: ${baseQuestion}`;

      case 'clinical':
        return `${config.contextPrefix}\n\n` +
               `PATIENT STATUS:\n` +
               `• Positioned and immobilized ✓\n` +
               `• Setup verification complete ✓\n` +
               `• All interlocks secure ✓\n\n` +
               `CLINICAL DECISION: ${baseQuestion}`;

      case 'analytical':
        return `${config.contextPrefix}\n\n` +
               `CASE OVERVIEW:\n` +
               `• Target volume delineated\n` +
               `• Critical structures identified\n` +
               `• Dose constraints established\n\n` +
               `PLANNING CHALLENGE: ${baseQuestion}`;

      case 'procedural':
        return `${config.contextPrefix}\n\n` +
               `SIMULATION PARAMETERS:\n` +
               `• Monte Carlo engine: READY\n` +
               `• Phantom configuration: LOADED\n` +
               `• Beam model: VALIDATED\n\n` +
               `SCENARIO: ${baseQuestion}`;

      default:
        return baseQuestion;
    }
  }

  static formatFeedback(isCorrect: boolean, explanation: string, roomId: string): string {
    const config = roomQuestionConfigs[roomId];
    if (!config) return explanation;

    const prefix = isCorrect ? '✅ CORRECT' : '❌ INCORRECT';
    
    switch (config.feedbackStyle) {
      case 'precision':
        return `${prefix} - MEASUREMENT VALIDATED\n\n${explanation}\n\n📊 Precision maintained within tolerance.`;
      
      case 'safety':
        return `${prefix} - SAFETY PROTOCOL\n\n${explanation}\n\n🛡️ Patient safety is our highest priority.`;
      
      case 'analytical':
        return `${prefix} - ANALYSIS COMPLETE\n\n${explanation}\n\n📈 Treatment optimization requires careful consideration.`;
      
      case 'simulation':
        return `${prefix} - SIMULATION RESULT\n\n${explanation}\n\n🎯 Virtual validation helps prevent real-world errors.`;
      
      default:
        return `${prefix}\n\n${explanation}`;
    }
  }

  static getSuccessAnimation(roomId: string): string {
    const config = roomQuestionConfigs[roomId];
    return config?.successParticleType || 'default';
  }
}

// Pre-configured question sets that feel room-appropriate
export const roomQuestionBank = {
  'dosimetry-lab': [
    {
      question: "What is the correct ion chamber voltage for TG-51 measurements?",
      options: ["100V", "300V", "500V", "1000V"],
      correct: 1,
      explanation: "TG-51 protocol specifies 300V for cylindrical ion chambers to ensure charge collection efficiency."
    },
    {
      question: "Which correction factor accounts for air density changes?",
      options: ["kQ", "kTP", "kpol", "ks"],
      correct: 1,
      explanation: "kTP corrects for temperature and pressure variations that affect air density in the ion chamber."
    }
  ],
  
  'treatment-room': [
    {
      question: "A patient setup shows 3mm posterior shift on CBCT. What is your immediate action?",
      options: ["Proceed with treatment", "Correct the position", "Contact physician", "Re-scan patient"],
      correct: 1,
      explanation: "Setup errors >2mm typically require position correction to maintain target coverage and organ sparing."
    },
    {
      question: "Which safety interlock has the highest priority?",
      options: ["Door interlock", "Emergency stop", "Beam energy", "Gantry collision"],
      correct: 1,
      explanation: "Emergency stop systems override all other functions and immediately terminate beam delivery."
    }
  ],

  'physics-office': [
    {
      question: "A prostate plan shows V70 to rectum of 18%. The constraint is <15%. What optimization strategy do you recommend?",
      options: ["Increase beam angles", "Add posterior beam avoidance", "Reduce prescription dose", "Accept the plan"],
      correct: 1,
      explanation: "Posterior beam avoidance structures help optimizers preferentially avoid high-dose regions in the rectum."
    }
  ],

  'simulation-suite': [
    {
      question: "Monte Carlo simulation shows 2% difference from measurement. What is the most likely cause?",
      options: ["Statistical uncertainty", "Beam model error", "Detector response", "Temperature drift"],
      correct: 1,
      explanation: "Systematic differences >1% between MC and measurement typically indicate beam model calibration issues."
    }
  ]
};

// Integration helper for existing dialogue system
export function enhanceQuestionWithRoomContext(
  baseQuestion: any, 
  roomId: string, 
  questionIndex: number = 0
): any {
  const roomQuestions = roomQuestionBank[roomId as keyof typeof roomQuestionBank];
  const roomSpecificQ = roomQuestions?.[questionIndex % (roomQuestions?.length || 1)];
  
  if (roomSpecificQ) {
    return {
      ...baseQuestion,
      question: RoomQuestionFormatter.formatQuestion(roomSpecificQ.question, roomId),
      options: roomSpecificQ.options,
      correctAnswer: roomSpecificQ.correct,
      explanation: RoomQuestionFormatter.formatFeedback(true, roomSpecificQ.explanation, roomId)
    };
  }
  
  // Fallback: format existing question with room context
  return {
    ...baseQuestion,
    question: RoomQuestionFormatter.formatQuestion(baseQuestion.question || "Sample question", roomId)
  };
} 