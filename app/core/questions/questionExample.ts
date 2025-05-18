import { QuestionGenerator } from './questionGenerator';
import { MentorVoiceService } from '../mentors/mentorVoiceService';
import { exampleTemplates } from '../../data/questions/radiation_therapy/example-question-templates';
import { Question, CalculationQuestion } from '../../types/questions';
import { MentorId } from '../../types/mentorVoice';

/**
 * Example of how to use the question generator with mentor voice system
 */
export function demonstrateQuestionGeneration(): void {
  // Initialize services
  const mentorVoiceService = new MentorVoiceService();
  const questionGenerator = new QuestionGenerator(mentorVoiceService);
  
  console.log('=== QUESTION SYSTEM DEMONSTRATION ===');
  
  // Example 1: Generate a multiple choice question with the default mentor
  const mcQuestion = questionGenerator.generateQuestion(exampleTemplates.fractionationQuestion);
  console.log('\n1. Multiple Choice Question with Default Mentor:');
  console.log(`Mentor: ${mcQuestion.mentor}`);
  console.log(`Question: ${mcQuestion.text}`);
  console.log(`Options: ${mcQuestion.options.join(', ')}`);
  console.log(`Correct Feedback: ${mcQuestion.correctFeedback}`);
  
  // Example 2: Generate the same question with a different mentor
  const mcQuestionAlt = questionGenerator.generateQuestion(exampleTemplates.fractionationQuestion, 'Quinn');
  console.log('\n2. Same Question with Different Mentor:');
  console.log(`Mentor: ${mcQuestionAlt.mentor}`);
  console.log(`Question: ${mcQuestionAlt.text}`);
  console.log(`Correct Feedback: ${mcQuestionAlt.correctFeedback}`);
  
  // Example 3: Generate variants for all mentors
  console.log('\n3. Question Variants for All Mentors:');
  const variants = questionGenerator.generateVariants(exampleTemplates.linacWarmupQuestion);
  variants.forEach((variant, index) => {
    console.log(`\nVariant ${index + 1} - Mentor: ${variant.mentor}`);
    console.log(`Question: ${variant.text}`);
  });
  
  // Example 4: Generate a calculation question with random variables
  const calcTemplate = exampleTemplates.tprCalculationQuestion as CalculationQuestion;
  const calculationQuestion = questionGenerator.generateCalculationQuestion(calcTemplate);
  const calculationWithMentor = questionGenerator.generateQuestion(calculationQuestion, 'Kapoor');
  
  console.log('\n4. Calculation Question with Random Variables:');
  console.log(`Mentor: ${calculationWithMentor.mentor}`);
  console.log(`Question: ${calculationWithMentor.text}`);
  console.log(`Variables: ${JSON.stringify(calculationWithMentor.variables)}`);
  
  // Example 5: Generate a boast question
  const boastQuestion = questionGenerator.generateQuestion(exampleTemplates.stereotacticRadiosurgeryBoastQuestion);
  console.log('\n5. Boast Question:');
  console.log(`Mentor: ${boastQuestion.mentor}`);
  console.log(`Question: ${boastQuestion.text}`);
  console.log(`Reward Multiplier: ${boastQuestion.rewardMultiplier}`);
  
  console.log('\n=== END OF DEMONSTRATION ===');
}

/**
 * Example of how to create a new template-based question
 */
export function createNewTemplateExample(): Question {
  const questionGenerator = new QuestionGenerator();
  
  // Create a new multiple choice question template
  const newQuestion = questionGenerator.createMultipleChoiceTemplate(
    'DOS-MC-001', // ID
    {
      domain: 'DOSIMETRY',
      difficulty: 'BEGINNER',
      tags: ['detector', 'calibration', 'absolute-dosimetry']
    },
    // Template with mentor voice placeholders
    "{mentorIntro} {mentorInquiry} which ion chamber is most appropriate for small field absolute dosimetry?",
    [
      "Farmer-type 0.6cc chamber",
      "Scanning 0.13cc chamber",
      "Micro-ionization 0.01cc chamber",
      "Parallel plate chamber for electron dosimetry"
    ],
    [2], // Correct option index
    "{mentorFeedback} Small fields require small volume detectors to minimize volume averaging effects. {mentorTransition} micro-ionization chambers provide a good balance of signal and spatial resolution.",
    "{mentorFeedback} Detector volume is critical for small field dosimetry. {mentorTransition} larger chambers can underestimate dose due to volume averaging in high gradient regions."
  );
  
  return newQuestion;
}

/**
 * Example of how to test if the system works end-to-end
 */
export function testQuestionSystem(): boolean {
  try {
    // 1. Create services
    const mentorVoiceService = new MentorVoiceService();
    const questionGenerator = new QuestionGenerator(mentorVoiceService);
    
    // 2. Generate questions with different mentors
    const mentors: MentorId[] = ['Kapoor', 'Garcia', 'Jesse', 'Quinn'];
    let allSuccessful = true;
    
    // Test each template with each mentor
    Object.values(exampleTemplates).forEach(template => {
      mentors.forEach(mentor => {
        try {
          const question = questionGenerator.generateQuestion(template, mentor);
          
          // Verify question has the expected properties
          if (!question.text || !question.text.length) {
            console.error(`Failed to generate text for question ${template.id} with mentor ${mentor}`);
            allSuccessful = false;
          }
          
          if (question.mentor !== mentor) {
            console.error(`Mentor mismatch for question ${template.id}: expected ${mentor}, got ${question.mentor}`);
            allSuccessful = false;
          }
          
        } catch (error) {
          console.error(`Error generating question ${template.id} with mentor ${mentor}:`, error);
          allSuccessful = false;
        }
      });
    });
    
    // 3. Test calculation question variable generation
    try {
      const calcTemplate = exampleTemplates.tprCalculationQuestion as CalculationQuestion;
      const calculationQuestion = questionGenerator.generateCalculationQuestion(calcTemplate);
      
      if (!calculationQuestion.variables || Object.keys(calculationQuestion.variables).length === 0) {
        console.error('Failed to generate variables for calculation question');
        allSuccessful = false;
      }
    } catch (error) {
      console.error('Error generating calculation question:', error);
      allSuccessful = false;
    }
    
    return allSuccessful;
  } catch (error) {
    console.error('Test failed with error:', error);
    return false;
  }
} 