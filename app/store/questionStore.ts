import { create } from 'zustand';
import { 
  Question, 
  QuestionType, 
  CalculationQuestion,
  MatchingQuestion,
  MultipleChoiceQuestion,
  ProceduralQuestion
} from '../types/questions';
import { KnowledgeDomain } from '../types';
import { selectQuestions } from '../core/questions/questionManager';
import { 
  generateCalculationQuestion,
  generateMatchingQuestion
} from '../core/questions/questionGenerator';
import { processProceduralQuestion } from '../core/questions/questionLoader';
import { 
  evaluateMultipleChoiceQuestion, 
  evaluateMatchingQuestion, 
  evaluateProceduralQuestion, 
  evaluateCalculationQuestion 
} from '../core/questions/questionEvaluator';
import {
  updateKnowledgeFromQuestion,
  calculateMasteryGain,
  canDiscoverStar
} from '../core/knowledge/knowledgeIntegration';
import {
  createChallenge,
  answerChallengeQuestion,
  getChallengeSummary,
  ChallengeType,
  ChallengeDifficulty,
  ActiveChallenge
} from '../core/activities/challengeManager';

interface QuestionHistoryItem {
  questionId: string;
  timestamp: number;
  wasCorrect: boolean;
  masteryGain: number;
  starId: string;
}

interface ChallengeSummary {
  id: string;
  type: ChallengeType;
  domain: KnowledgeDomain;
  starId?: string;
  totalQuestions: number;
  correctAnswers: number;
  totalMasteryGained: number;
  timeTaken: number;
  isPassed: boolean;
  completedAt: number;
}

interface QuestionState {
  // Current question state
  currentQuestion: Question | null;
  isLoading: boolean;
  error: string | null;
  userAnswer: any;
  isCorrect: boolean | null;
  showFeedback: boolean;
  masteryGain: number;
  
  // Challenge state
  currentChallenge: ActiveChallenge | null;
  challengeHistory: ChallengeSummary[];
  
  // Question history
  questionHistory: QuestionHistoryItem[];
  
  // Function to load questions
  loadQuestion: (
    domain: KnowledgeDomain,
    starId?: string,
    masteryPercentage?: number,
    questionType?: QuestionType
  ) => Promise<void>;
  
  // Function to answer the current question
  answerQuestion: (answer: any) => Promise<void>;
  
  // Function to reset the current question state
  resetQuestion: () => void;
  
  // Function to start a new challenge
  startChallenge: (
    type: ChallengeType,
    difficulty: ChallengeDifficulty,
    domain: KnowledgeDomain,
    starId?: string,
    questionCount?: number
  ) => Promise<void>;
  
  // Function to answer a challenge question
  answerChallengeQuestion: (answer: any, riskFactor?: number) => Promise<void>;
  
  // Function to complete and get results for the current challenge
  completeChallenge: () => ChallengeSummary | null;

  // Function to check if a star can be discovered
  canDiscoverStar: (domain: KnowledgeDomain, starId: string) => Promise<boolean>;
  
  // Function to get mastery data for a specific star
  getMasteryForStar: (starId: string) => number;
  
  // Function to get recent questions for a specific star
  getRecentQuestionsForStar: (starId: string, limit?: number) => QuestionHistoryItem[];
}

const useQuestionStore = create<QuestionState>((set, get) => ({
  // Initial state
  currentQuestion: null,
  isLoading: false,
  error: null,
  userAnswer: null,
  isCorrect: null,
  showFeedback: false,
  masteryGain: 0,
  
  currentChallenge: null,
  challengeHistory: [],
  
  questionHistory: [],
  
  // Load a single question
  loadQuestion: async (
    domain: KnowledgeDomain,
    starId?: string,
    masteryPercentage = 0,
    questionType?: QuestionType
  ) => {
    try {
      set({ isLoading: true, error: null });
      
      // Clear previous question state
      get().resetQuestion();
      
      // Select questions based on domain, star, and mastery
      const questionTypes = questionType ? [questionType] : undefined;
      const selectedQuestions = await selectQuestions(
        domain,
        starId,
        masteryPercentage,
        1,  // Get just one question
        questionTypes
      );
      
      if (selectedQuestions.length === 0) {
        throw new Error('No questions available for the selected criteria');
      }
      
      let question = selectedQuestions[0];
      
      // Process the question based on its type
      switch (question.type) {
        case QuestionType.CALCULATION:
          // Generate calculation with random variables
          question = generateCalculationQuestion(question as CalculationQuestion);
          break;
          
        case QuestionType.MATCHING:
          // Generate matching question with items from bank
          question = await generateMatchingQuestion(question as MatchingQuestion, domain);
          break;
          
        case QuestionType.PROCEDURAL:
          // Process procedural question with steps from bank
          question = await processProceduralQuestion(question as ProceduralQuestion, domain);
          break;
          
        // Multiple choice questions don't need additional processing
      }
      
      set({ currentQuestion: question, isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to load question',
        isLoading: false 
      });
    }
  },
  
  // Answer the current question
  answerQuestion: async (answer: any) => {
    const { currentQuestion } = get();
    
    if (!currentQuestion) {
      set({ error: 'No active question to answer' });
      return;
    }
    
    // Evaluate the answer based on question type
    let isCorrect = false;
    let masteryGain = 0;
    
    try {
      switch (currentQuestion.type) {
        case QuestionType.MULTIPLE_CHOICE:
          const mcResult = evaluateMultipleChoiceQuestion(
            currentQuestion as MultipleChoiceQuestion,
            answer
          );
          isCorrect = mcResult.isCorrect;
          masteryGain = mcResult.masteryGain;
          break;
          
        case QuestionType.MATCHING:
          const matchingResult = await evaluateMatchingQuestion(
            currentQuestion as MatchingQuestion,
            answer
          );
          isCorrect = matchingResult.isCorrect;
          masteryGain = matchingResult.masteryGain;
          break;
          
        case QuestionType.PROCEDURAL:
          const proceduralResult = await evaluateProceduralQuestion(
            currentQuestion as ProceduralQuestion,
            answer
          );
          isCorrect = proceduralResult.isCorrect;
          masteryGain = proceduralResult.masteryGain;
          break;
          
        case QuestionType.CALCULATION:
          const calcResult = evaluateCalculationQuestion(
            currentQuestion as CalculationQuestion,
            answer
          );
          isCorrect = calcResult.isCorrect;
          masteryGain = calcResult.masteryGain;
          break;
          
        default:
          throw new Error(`Unsupported question type: ${currentQuestion.type}`);
      }
      
      // Get the star ID from the question
      const starId = currentQuestion.tags.knowledgeNode;
      
      // Record this question in history
      const historyItem: QuestionHistoryItem = {
        questionId: currentQuestion.id,
        timestamp: Date.now(),
        wasCorrect: isCorrect,
        masteryGain,
        starId
      };
      
      // Update the knowledge system
      await updateKnowledgeFromQuestion(currentQuestion, isCorrect, masteryGain);
      
      set({
        userAnswer: answer,
        isCorrect,
        showFeedback: true,
        masteryGain,
        questionHistory: [...get().questionHistory, historyItem]
      });
      
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to evaluate answer' 
      });
    }
  },
  
  // Reset the current question state
  resetQuestion: () => {
    set({
      currentQuestion: null,
      userAnswer: null,
      isCorrect: null,
      showFeedback: false,
      masteryGain: 0,
      error: null
    });
  },
  
  // Start a new challenge
  startChallenge: async (
    type: ChallengeType,
    difficulty: ChallengeDifficulty,
    domain: KnowledgeDomain,
    starId?: string,
    questionCount?: number
  ) => {
    try {
      set({ isLoading: true, error: null });
      
      // Create a new challenge
      const challenge = await createChallenge({
        type,
        difficulty,
        domain,
        starId,
        questionCount
      });
      
      // Set the current challenge
      set({ 
        currentChallenge: challenge,
        currentQuestion: challenge.questions[0],
        isLoading: false 
      });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to start challenge',
        isLoading: false 
      });
    }
  },
  
  // Answer a challenge question
  answerChallengeQuestion: async (answer: any, riskFactor = 1.0) => {
    const { currentChallenge } = get();
    
    if (!currentChallenge) {
      set({ error: 'No active challenge' });
      return;
    }
    
    try {
      // Process the answer using the challenge manager
      const result = await answerChallengeQuestion(
        currentChallenge,
        answer,
        riskFactor
      );
      
      // Store the question in the history
      const currentQuestion = currentChallenge.questions[currentChallenge.currentQuestionIndex];
      const historyItem: QuestionHistoryItem = {
        questionId: currentQuestion.id,
        timestamp: Date.now(),
        wasCorrect: result.isCorrect,
        masteryGain: result.masteryGain,
        starId: currentQuestion.tags.knowledgeNode
      };
      
      // Update the store
      set({
        currentChallenge: result.challenge,
        currentQuestion: result.isComplete 
          ? null 
          : result.challenge.questions[result.challenge.currentQuestionIndex],
        isCorrect: result.isCorrect,
        showFeedback: true,
        masteryGain: result.masteryGain,
        questionHistory: [...get().questionHistory, historyItem]
      });
      
      // If the challenge is complete, generate the summary
      if (result.isComplete) {
        get().completeChallenge();
      }
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to process answer',
      });
    }
  },
  
  // Complete and get results for the current challenge
  completeChallenge: () => {
    const { currentChallenge } = get();
    
    if (!currentChallenge || currentChallenge.status !== 'completed') {
      return null;
    }
    
    // Get the challenge summary
    const summary = getChallengeSummary(currentChallenge);
    
    // Create the summary object
    const challengeSummary: ChallengeSummary = {
      id: currentChallenge.id,
      type: currentChallenge.config.type,
      domain: currentChallenge.config.domain,
      starId: currentChallenge.config.starId,
      totalQuestions: summary.totalQuestions,
      correctAnswers: summary.correctAnswers,
      totalMasteryGained: summary.totalMasteryGained,
      timeTaken: summary.timeTaken,
      isPassed: summary.isPassed,
      completedAt: Date.now()
    };
    
    // Add to history and clear current challenge
    set({
      challengeHistory: [...get().challengeHistory, challengeSummary],
      currentChallenge: null
    });
    
    return challengeSummary;
  },
  
  // Check if a star can be discovered
  canDiscoverStar: async (domain: KnowledgeDomain, starId: string) => {
    return await canDiscoverStar(domain, starId);
  },
  
  // Get mastery for a specific star
  getMasteryForStar: (starId: string) => {
    const { questionHistory } = get();
    
    // Filter history to only include questions for this star
    const starQuestions = questionHistory.filter(item => item.starId === starId);
    
    if (starQuestions.length === 0) {
      return 0; // No questions answered for this star
    }
    
    // Calculate the total mastery gain
    const totalMasteryGain = starQuestions.reduce(
      (total, item) => total + item.masteryGain, 
      0
    );
    
    // In a real implementation, this would integrate with the knowledge system
    // to get the actual current mastery level
    // For now, we're just returning a value based on question history
    
    return Math.min(1.0, Math.max(0, 0.5 + totalMasteryGain)); // Clamp between 0-100%
  },
  
  // Get recent questions for a specific star
  getRecentQuestionsForStar: (starId: string, limit = 10) => {
    const { questionHistory } = get();
    
    // Filter and sort by timestamp (most recent first)
    return questionHistory
      .filter(item => item.starId === starId)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }
}));

export default useQuestionStore; 