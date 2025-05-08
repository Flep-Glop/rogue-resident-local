'use client';

import React, { useState } from 'react';
import { Question, QuestionType } from '../../types/questions';

interface BoastQuestionProps {
  questions: Question[];
  onSelectDifficulty: (difficultyLevel: number, riskFactor: number) => void;
  onSkip: () => void;
  playerMastery?: number; // Current mastery level (0-100)
}

const BoastQuestion: React.FC<BoastQuestionProps> = ({
  questions,
  onSelectDifficulty,
  onSkip,
  playerMastery = 0,
}) => {
  const [selectedDifficulty, setSelectedDifficulty] = useState<number | null>(null);
  const [riskFactor, setRiskFactor] = useState<number>(1.0); // Default risk factor

  // Calculate available difficulty levels based on questions
  const difficultyLevels = [
    { level: 1, label: 'Beginner', reward: '1x', risk: 'Low' },
    { level: 2, label: 'Intermediate', reward: '2x', risk: 'Medium' },
    { level: 3, label: 'Advanced', reward: '3x', risk: 'High' },
  ];

  // Calculate recommended level based on player mastery
  const getRecommendedLevel = () => {
    if (playerMastery < 30) return 1;
    if (playerMastery < 70) return 2;
    return 3;
  };

  const recommendedLevel = getRecommendedLevel();

  // Handle difficulty selection
  const handleDifficultySelect = (level: number) => {
    setSelectedDifficulty(level);
  };

  // Handle risk factor adjustment
  const handleRiskFactorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRiskFactor(parseFloat(e.target.value));
  };

  // Handle final confirmation
  const handleConfirm = () => {
    if (selectedDifficulty) {
      onSelectDifficulty(selectedDifficulty, riskFactor);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4 text-center">Knowledge Boast Challenge</h2>
      
      <div className="mb-6 p-4 bg-blue-50 rounded-md border border-blue-200">
        <h3 className="text-lg font-semibold mb-2">Prove Your Knowledge</h3>
        <p className="text-gray-700">
          Select a difficulty level to challenge yourself. Higher difficulties provide greater 
          mastery rewards but carry more risk of mastery loss if you answer incorrectly.
        </p>
        
        <div className="mt-3 text-sm text-blue-800">
          <span className="font-medium">Current Mastery Level:</span> {playerMastery.toFixed(1)}%
        </div>
      </div>
      
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">Select Difficulty</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {difficultyLevels.map((level) => (
            <div 
              key={level.level}
              onClick={() => handleDifficultySelect(level.level)}
              className={`p-4 border rounded-md cursor-pointer transition-all ${
                selectedDifficulty === level.level 
                  ? 'bg-blue-100 border-blue-400' 
                  : 'bg-gray-50 border-gray-300 hover:bg-gray-100'
              } ${
                level.level === recommendedLevel ? 'ring-2 ring-blue-400' : ''
              }`}
            >
              <div className="font-semibold mb-1 flex justify-between">
                <span>{level.label}</span>
                {level.level === recommendedLevel && (
                  <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded">Recommended</span>
                )}
              </div>
              <div className="text-sm mb-2">Difficulty: {level.level}</div>
              <div className="flex justify-between text-sm">
                <span>Reward: <span className="font-medium text-green-600">{level.reward}</span></span>
                <span>Risk: <span className={`font-medium ${
                  level.level === 1 ? 'text-green-600' : 
                  level.level === 2 ? 'text-yellow-600' : 'text-red-600'
                }`}>{level.risk}</span></span>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {selectedDifficulty && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">Adjust Risk Factor</h3>
          <div className="p-4 bg-gray-50 rounded-md border border-gray-300">
            <div className="flex justify-between mb-2">
              <span>Low Risk/Reward</span>
              <span>High Risk/Reward</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.1"
              value={riskFactor}
              onChange={handleRiskFactorChange}
              className="w-full"
            />
            <div className="mt-3 text-center">
              <span className="font-medium">Current Factor: {riskFactor.toFixed(1)}x</span>
              <div className="text-sm text-gray-600 mt-1">
                Adjust the risk factor to potentially multiply your rewards (and losses)
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="flex justify-between mt-6">
        <button
          onClick={onSkip}
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
        >
          Skip Challenge
        </button>
        
        {selectedDifficulty && (
          <button
            onClick={handleConfirm}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Accept Challenge
          </button>
        )}
      </div>
      
      <div className="mt-4 text-xs text-gray-500 text-center">
        Boast challenges test your confidence in your knowledge.
        Choose wisely based on your actual mastery level.
      </div>
    </div>
  );
};

export default BoastQuestion; 