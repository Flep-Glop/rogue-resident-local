'use client';

import React, { useState, useEffect } from 'react';
import { CalculationQuestion as CalculationQuestionType } from '../../types/questions';

interface CalculationQuestionProps {
  question: CalculationQuestionType;
  onAnswer: (answer: number) => void;
  showFeedback?: boolean;
  isCorrect?: boolean;
  showSolution?: boolean;
}

const CalculationQuestion: React.FC<CalculationQuestionProps> = ({
  question,
  onAnswer,
  showFeedback = false,
  isCorrect,
  showSolution = false,
}) => {
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showSteps, setShowSteps] = useState<boolean>(false);

  // Reset the form when a new question is loaded
  useEffect(() => {
    setUserAnswer('');
    setSubmitted(false);
    setError(null);
    setShowSteps(false);
  }, [question]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // Only allow numeric input with decimal point and negative sign
    if (/^-?\d*\.?\d*$/.test(value) || value === '') {
      setUserAnswer(value);
      setError(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userAnswer) {
      setError('Please enter an answer');
      return;
    }
    
    const numericAnswer = parseFloat(userAnswer);
    
    if (isNaN(numericAnswer)) {
      setError('Please enter a valid number');
      return;
    }
    
    setSubmitted(true);
    onAnswer(numericAnswer);
  };

  const handleShowSolution = () => {
    setShowSteps(true);
  };

  // Determine if we should add unit display
  const hasUnit = question.variables && question.variables.some(v => v.unit);
  const answerUnit = hasUnit ? question.variables[0]?.unit : '';

  return (
    <div className="w-full max-w-3xl mx-auto p-4 bg-white rounded-lg shadow">
      <h3 className="text-xl font-semibold mb-4">Calculate the answer:</h3>
      
      {/* Question text */}
      <div className="mb-6 p-4 bg-blue-50 rounded-md border border-blue-200">
        <div className="text-lg mb-2">{question.question}</div>
        
        {/* Variables display */}
        {question.variables && question.variables.length > 0 && (
          <div className="mt-4">
            <h4 className="font-medium mb-2">Given:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {question.variables.map((variable, index) => (
                <div key={index} className="bg-white p-2 rounded border">
                  <span className="font-mono">{variable.name} = </span>
                  {question.generatedValues ? (
                    <span className="font-mono font-medium">
                      {question.generatedValues[variable.name]} {variable.unit}
                    </span>
                  ) : (
                    <span className="font-mono font-medium">
                      {variable.range[0]}-{variable.range[1]} {variable.unit}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Feedback message */}
      {showFeedback && (
        <div
          className={`mb-4 p-3 rounded-md ${
            isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}
        >
          {isCorrect ? question.feedback.correct : question.feedback.incorrect}
        </div>
      )}
      
      {/* Solution steps */}
      {(showSolution || showSteps) && question.solution && (
        <div className="mb-6 p-4 bg-yellow-50 rounded-md border border-yellow-200">
          <h4 className="font-medium mb-2">Solution:</h4>
          <div className="space-y-2">
            {question.solution.map((step, index) => (
              <div key={index} className="p-2">
                <div className="font-medium">Step {index + 1}:</div>
                <div className={step.isFormula ? 'font-mono bg-white p-2 rounded' : ''}>
                  {step.step}
                </div>
              </div>
            ))}
          </div>
          
          {question.generatedAnswer && (
            <div className="mt-4 p-2 bg-white rounded border border-yellow-300">
              <div className="font-medium">Answer:</div>
              <div className="font-mono text-lg">
                {question.generatedAnswer} {answerUnit}
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Answer form */}
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="answer" className="block font-medium mb-2">
            Your Answer:
          </label>
          <div className="flex">
            <input
              type="text"
              id="answer"
              value={userAnswer}
              onChange={handleInputChange}
              className={`flex-grow p-2 border rounded-l-md focus:outline-none focus:ring-2 ${
                error ? 'border-red-300 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-200'
              }`}
              placeholder="Enter numerical value"
              disabled={submitted && showFeedback}
            />
            {hasUnit && (
              <div className="bg-gray-100 p-2 border-t border-r border-b rounded-r-md border-gray-300">
                {answerUnit}
              </div>
            )}
          </div>
          {error && <div className="text-red-500 text-sm mt-1">{error}</div>}
          
          <div className="text-sm text-gray-600 mt-1">
            Round to {question.answer.precision} decimal places
          </div>
        </div>
        
        <div className="flex space-x-4">
          <button
            type="submit"
            disabled={submitted && showFeedback}
            className={`px-4 py-2 rounded font-medium ${
              submitted && showFeedback
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            Submit Answer
          </button>
          
          {!showSteps && !showSolution && (
            <button
              type="button"
              onClick={handleShowSolution}
              className="px-4 py-2 bg-gray-200 rounded font-medium hover:bg-gray-300"
            >
              Show Solution
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default CalculationQuestion; 