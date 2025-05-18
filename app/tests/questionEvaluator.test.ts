import { 
  evaluateMultipleChoiceQuestion, 
  evaluateMatchingQuestion, 
  evaluateProceduralQuestion, 
  evaluateCalculationQuestion 
} from '../core/questions/questionEvaluator';
import { 
  MultipleChoiceQuestion, 
  MatchingQuestion, 
  ProceduralQuestion, 
  CalculationQuestion,
  QuestionType
} from '../types/questions';

describe('Question Evaluator', () => {
  // Test multiple choice question evaluation
  describe('evaluateMultipleChoiceQuestion', () => {
    const mockQuestion: MultipleChoiceQuestion = {
      id: 'test-mc-1',
      type: 'multipleChoice',
      question: 'Which of the following is a linear accelerator component?',
      options: [
        { text: 'Gantry', isCorrect: true },
        { text: 'Cooling Fan', isCorrect: false },
        { text: 'LED Display', isCorrect: false },
        { text: 'Mouse', isCorrect: false }
      ],
      tags: {
        domain: 'LinacAnatomy',
        subtopic: 'Components',
        difficulty: 1,
        mentor: 'Jesse',
        knowledgeNode: 'la-components'
      },
      feedback: {
        correct: 'Correct! The gantry is a major component of a linear accelerator.',
        incorrect: 'Incorrect. The gantry is the correct component of a linear accelerator.'
      }
    };

    test('correctly evaluates a correct answer', () => {
      const result = evaluateMultipleChoiceQuestion(mockQuestion, 0); // Index of correct option
      expect(result.isCorrect).toBe(true);
      expect(result.masteryGain).toBeGreaterThan(0);
    });

    test('correctly evaluates an incorrect answer', () => {
      const result = evaluateMultipleChoiceQuestion(mockQuestion, 1); // Index of incorrect option
      expect(result.isCorrect).toBe(false);
      expect(result.masteryGain).toBeLessThanOrEqual(0);
    });
  });

  // Test matching question evaluation
  describe('evaluateMatchingQuestion', () => {
    const mockQuestion: MatchingQuestion = {
      id: 'test-match-1',
      type: 'matching',
      bankRef: 'test-bank',
      includeItems: [
        { itemId: 'A', matchIds: [1] },
        { itemId: 'B', matchIds: [2] },
        { itemId: 'C', matchIds: [3] }
      ],
      difficulty: 'beginner',
      tags: {
        domain: 'Dosimetry',
        subtopic: 'Calibration',
        difficulty: 1,
        mentor: 'Kapoor',
        knowledgeNode: 'dos-calibration'
      },
      feedback: {
        correct: 'Correct! You matched all items correctly.',
        incorrect: 'Incorrect. Review the matches and try again.'
      },
      // Generated data added by the question generator
      itemsData: [
        { id: 'A', text: 'Ionization Chamber' },
        { id: 'B', text: 'Electrometer' },
        { id: 'C', text: 'Phantom' }
      ],
      matchesMap: {
        'A': [{ id: 1, text: 'Measures radiation dose' }],
        'B': [{ id: 2, text: 'Measures electric charge' }],
        'C': [{ id: 3, text: 'Simulates human tissue' }]
      }
    };

    test('correctly evaluates all matches correct', async () => {
      const userAnswer = {
        'A': 1,
        'B': 2,
        'C': 3
      };
      
      const result = await evaluateMatchingQuestion(mockQuestion, userAnswer);
      expect(result.isCorrect).toBe(true);
      expect(result.masteryGain).toBeGreaterThan(0);
    });

    test('correctly evaluates partially correct matches', async () => {
      const userAnswer = {
        'A': 1, // Correct
        'B': 3, // Incorrect
        'C': 2  // Incorrect
      };
      
      const result = await evaluateMatchingQuestion(mockQuestion, userAnswer);
      expect(result.isCorrect).toBe(false);
      expect(result.masteryGain).toBeLessThanOrEqual(0);
      expect(result.correctMatches).toBe(1);
      expect(result.totalMatches).toBe(3);
    });
  });

  // Test procedural question evaluation
  describe('evaluateProceduralQuestion', () => {
    const mockQuestion: ProceduralQuestion = {
      id: 'test-proc-1',
      type: 'procedural',
      bankRef: 'test-bank',
      includeSteps: [1, 2, 3, 4],
      difficulty: 'beginner',
      tags: {
        domain: 'RadiationTherapy',
        subtopic: 'Radiobiology',
        difficulty: 1,
        mentor: 'Garcia',
        knowledgeNode: 'rt-radiobiology'
      },
      feedback: {
        correct: 'Correct! You ordered the steps correctly.',
        incorrect: 'Incorrect. The steps should be in a different order.'
      },
      // Generated data added during processing
      steps: [
        { id: 1, stepId: 1, stepText: 'Step 1', explanation: 'Explanation 1' },
        { id: 2, stepId: 2, stepText: 'Step 2', explanation: 'Explanation 2' },
        { id: 3, stepId: 3, stepText: 'Step 3', explanation: 'Explanation 3' },
        { id: 4, stepId: 4, stepText: 'Step 4', explanation: 'Explanation 4' }
      ]
    };

    test('correctly evaluates steps in correct order', async () => {
      const userAnswer = [1, 2, 3, 4]; // Correct order
      
      const result = await evaluateProceduralQuestion(mockQuestion, userAnswer);
      expect(result.isCorrect).toBe(true);
      expect(result.masteryGain).toBeGreaterThan(0);
    });

    test('correctly evaluates steps in incorrect order', async () => {
      const userAnswer = [4, 3, 2, 1]; // Reverse order
      
      const result = await evaluateProceduralQuestion(mockQuestion, userAnswer);
      expect(result.isCorrect).toBe(false);
      expect(result.masteryGain).toBeLessThanOrEqual(0);
    });
  });

  // Test calculation question evaluation
  describe('evaluateCalculationQuestion', () => {
    const mockQuestion: CalculationQuestion = {
      id: 'test-calc-1',
      type: 'calculation',
      question: 'Calculate the dose for a patient with the following parameters:',
      variables: [
        { name: 'energy', range: [6, 18], unit: 'MV' },
        { name: 'distance', range: [80, 120], unit: 'cm' },
        { name: 'time', range: [1, 5], unit: 'min' }
      ],
      solution: [
        { step: 'First, determine the dose rate', isFormula: false },
        { step: 'Dose rate = {energy} × 2.5', isFormula: true },
        { step: 'Apply inverse square law correction for distance', isFormula: false },
        { step: 'Correction factor = (100 / {distance})²', isFormula: true },
        { step: 'Calculate total dose', isFormula: false },
        { step: 'Dose = Dose rate × Correction factor × {time}', isFormula: true }
      ],
      answer: {
        formula: '{energy} * 2.5 * Math.pow(100 / {distance}, 2) * {time}',
        precision: 2
      },
      tags: {
        domain: 'Dosimetry',
        subtopic: 'DoseCalculation',
        difficulty: 2,
        mentor: 'Quinn',
        knowledgeNode: 'dos-dose-calculation'
      },
      feedback: {
        correct: 'Correct! Your calculation is accurate.',
        incorrect: 'Incorrect. Check your calculation steps and try again.'
      },
      // Generated values added by the question generator
      generatedValues: {
        energy: 10,
        distance: 100,
        time: 2
      },
      generatedAnswer: 50.0
    };

    test('correctly evaluates exact correct answer', () => {
      const userAnswer = 50.0; // Exact answer
      
      const result = evaluateCalculationQuestion(mockQuestion, userAnswer);
      expect(result.isCorrect).toBe(true);
      expect(result.masteryGain).toBeGreaterThan(0);
    });

    test('correctly evaluates answer within tolerance', () => {
      const userAnswer = 50.01; // Within tolerance
      
      const result = evaluateCalculationQuestion(mockQuestion, userAnswer);
      expect(result.isCorrect).toBe(true);
      expect(result.masteryGain).toBeGreaterThan(0);
    });

    test('correctly evaluates incorrect answer', () => {
      const userAnswer = 55.0; // Outside tolerance
      
      const result = evaluateCalculationQuestion(mockQuestion, userAnswer);
      expect(result.isCorrect).toBe(false);
      expect(result.masteryGain).toBeLessThanOrEqual(0);
    });
  });
}); 