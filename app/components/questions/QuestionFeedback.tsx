import React from 'react';
import { Question, QuestionType } from '../../types/questions';

interface QuestionFeedbackProps {
  question: Question;
  isCorrect: boolean;
  masteryGain?: number;
  onContinue: () => void;
  showSolution?: boolean;
}

const QuestionFeedback: React.FC<QuestionFeedbackProps> = ({
  question,
  isCorrect,
  masteryGain = 0,
  onContinue,
  showSolution = false,
}) => {
  return (
    <div className="w-full max-w-3xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className={`p-4 mb-6 rounded-md ${
        isCorrect ? 'bg-green-100 border border-green-300' : 'bg-red-100 border border-red-300'
      }`}>
        <div className="flex items-center mb-3">
          {isCorrect ? (
            <div className="flex items-center">
              <svg className="w-6 h-6 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <h3 className="text-lg font-semibold text-green-800">Correct!</h3>
            </div>
          ) : (
            <div className="flex items-center">
              <svg className="w-6 h-6 text-red-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <h3 className="text-lg font-semibold text-red-800">Incorrect</h3>
            </div>
          )}
        </div>
        
        <p className={isCorrect ? 'text-green-800' : 'text-red-800'}>
          {isCorrect ? question.feedback.correct : question.feedback.incorrect}
        </p>
      </div>
      
      {/* Show mastery gain information if provided */}
      {masteryGain > 0 && (
        <div className="mb-6 p-4 bg-blue-50 rounded-md border border-blue-200">
          <h4 className="font-medium text-blue-800 mb-2">Knowledge Gained</h4>
          <div className="flex items-center">
            <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2">
              <div 
                className="bg-blue-600 h-2.5 rounded-full" 
                style={{ width: `${Math.min(100, masteryGain * 100)}%` }}
              ></div>
            </div>
            <span className="text-sm font-medium text-blue-800">+{(masteryGain * 100).toFixed(1)}%</span>
          </div>
        </div>
      )}
      
      {/* Show question type-specific feedback */}
      {showSolution && (
        <div className="mb-6 p-4 bg-yellow-50 rounded-md border border-yellow-200">
          <h4 className="font-medium mb-2">Solution:</h4>
          {question.type === QuestionType.MULTIPLE_CHOICE && (
            <p>The correct answer was: {(question as any).options.find((o: any) => o.isCorrect)?.text}</p>
          )}
          {question.type === QuestionType.MATCHING && (
            <p>Review the correct matches in the question above.</p>
          )}
          {question.type === QuestionType.PROCEDURAL && (
            <div>
              <p>The correct order is:</p>
              <ol className="list-decimal pl-5 mt-2">
                {(question as any).steps?.map((step: any, index: number) => (
                  <li key={index} className="mb-1">{step.stepText}</li>
                ))}
              </ol>
            </div>
          )}
          {question.type === QuestionType.CALCULATION && (
            <p>
              The correct answer is: {(question as any).generatedAnswer} 
              {(question as any).variables[0]?.unit}
            </p>
          )}
        </div>
      )}
      
      {/* Tags information */}
      <div className="mb-6">
        <h4 className="font-medium mb-2">Question Info:</h4>
        <div className="flex flex-wrap gap-2">
          <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
            {question.tags.domain}
          </span>
          <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
            {question.tags.subtopic}
          </span>
          <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
            Difficulty: {question.tags.difficulty}
          </span>
          <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
            Mentor: {question.tags.mentor}
          </span>
        </div>
      </div>
      
      <div className="flex justify-end">
        <button
          onClick={onContinue}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Continue
        </button>
      </div>
    </div>
  );
};

export default QuestionFeedback; 