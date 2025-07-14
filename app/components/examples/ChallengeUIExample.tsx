'use client';

import React, { useState } from 'react';
import styled from 'styled-components';
import ChallengeUI from '@/app/components/questions/ChallengeUI';
import { ActivityDifficulty, MentorId } from '@/app/types';

const SAMPLE_CHALLENGE = {
  title: "Enhanced Resource Display Test",
  difficulty: ActivityDifficulty.MEDIUM,
  mentor: MentorId.GARCIA,
  questions: [
    {
      content: "Watch the beautiful sprite-based resource displays! The insight bar fills dynamically and momentum blips light up with gorgeous animations. Which feature do you like most?",
      options: [
        { text: "The insight bar with animated fill and glow effects", correct: true, feedback: "Great choice! The insight bar uses your sprite asset with smooth animations." },
        { text: "The momentum blips with staggered pulse animations", correct: true, feedback: "Excellent! Each momentum blip has individual animations and effects." },
        { text: "The dynamic bonus text that changes with momentum level", correct: true, feedback: "Perfect! The bonus text shows when special abilities unlock." },
        { text: "All of them - this looks amazing!", correct: true, feedback: "That's the spirit! The enhanced UI brings your assets to life." }
      ]
    },
    {
      content: "Test the momentum system! Notice how the blips light up with golden glow effects and the bonus text changes dynamically. What happens at momentum level 3?",
      options: [
        { text: "Boast ability unlocks with special effects", correct: true, feedback: "Exactly! Level 3 momentum unlocks the powerful Boast ability." },
        { text: "The insight bar starts glowing", correct: false, feedback: "Close! The insight bar glows when it's 75%+ full, regardless of momentum." },
        { text: "All blips turn golden", correct: false, feedback: "The blips do get golden effects, but that happens at any active level." }
      ]
    }
  ]
};

const PageContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 2rem;
  background-color: #0f172a;
  min-height: 100vh;
`;

const MainContentContainer = styled.div`
  max-width: 1200px;
  width: 100%;
`;

const PageTitle = styled.h1`
  color: #e5e7eb;
  margin-bottom: 1.5rem;
  font-weight: 700;
  font-size: 2rem;
  text-align: center;
  font-family: 'VT323', monospace;
`;

const ControlPanel = styled.div`
  background: rgba(30, 41, 59, 0.8);
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  border: 1px solid #374151;
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: center;
  justify-content: center;
`;

const ControlGroup = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
`;

const ControlLabel = styled.label`
  color: #94a3b8;
  font-size: 0.9rem;
  font-family: 'VT323', monospace;
`;

const ControlButton = styled.button`
  padding: 0.5rem 1rem;
  background: rgba(59, 130, 246, 0.3);
  border: 1px solid #3b82f6;
  border-radius: 4px;
  color: #e2e8f0;
  font-family: 'VT323', monospace;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(59, 130, 246, 0.5);
    transform: translateY(-1px);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const StatusDisplay = styled.div`
  background: rgba(0, 0, 0, 0.5);
  padding: 0.5rem 1rem;
  border-radius: 4px;
  color: #e2e8f0;
  font-family: 'VT323', monospace;
  font-size: 1.1rem;
`;

const ChallengeUIExample: React.FC = () => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [allAnswers, setAllAnswers] = useState<boolean[]>([]);
  const [usedTangent, setUsedTangent] = useState(false);
  const [usedBoost, setUsedBoost] = useState(false);
  
  // Enhanced state for testing the new displays
  const [insight, setInsight] = useState(50);
  const [momentum, setMomentum] = useState(1);

  const handleOptionSelect = (index: number) => {
    setSelectedOption(index);
    setShowFeedback(true);
    const isCorrect = SAMPLE_CHALLENGE.questions[currentQuestionIndex].options[index].correct;
    setAllAnswers([...allAnswers, isCorrect]);
    
    // Demonstrate momentum system
    if (isCorrect) {
      setMomentum(prev => Math.min(3, prev + 1));
      setInsight(prev => Math.min(100, prev + 15));
    } else {
      setMomentum(0); // Reset on wrong answer
    }
  };

  const handleContinue = () => {
    const nextQuestionIndex = currentQuestionIndex + 1;
    if (nextQuestionIndex < SAMPLE_CHALLENGE.questions.length) {
      setCurrentQuestionIndex(nextQuestionIndex);
      setSelectedOption(null);
      setShowFeedback(false);
    } else {
      // Demo complete, reset
      setCurrentQuestionIndex(0);
      setSelectedOption(null);
      setShowFeedback(false);
      setAllAnswers([]);
    }
  };

  const handleTangent = () => {
    if (insight >= 25) {
      setUsedTangent(true);
      setInsight(prev => prev - 25);
    }
  };

  const handleBoost = () => {
    if (momentum > 0) {
      setUsedBoost(true);
      setInsight(prev => Math.min(100, prev + 10));
    }
  };

  // Control functions for testing
  const addInsight = (amount: number) => {
    setInsight(prev => Math.max(0, Math.min(100, prev + amount)));
  };

  const setMomentumLevel = (level: number) => {
    setMomentum(Math.max(0, Math.min(3, level)));
  };

  const resetDemo = () => {
    setInsight(50);
    setMomentum(1);
    setCurrentQuestionIndex(0);
    setSelectedOption(null);
    setShowFeedback(false);
    setAllAnswers([]);
    setUsedTangent(false);
    setUsedBoost(false);
  };

  return (
    <PageContainer>
      <MainContentContainer>
        <PageTitle>Enhanced Challenge UI with Sprite Assets</PageTitle>
        
        {/* Interactive Controls for Testing */}
        <ControlPanel>
          <ControlGroup>
            <ControlLabel>Insight Controls</ControlLabel>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <ControlButton onClick={() => addInsight(-10)}>-10</ControlButton>
              <StatusDisplay>{insight}/100</StatusDisplay>
              <ControlButton onClick={() => addInsight(10)}>+10</ControlButton>
            </div>
          </ControlGroup>
          
          <ControlGroup>
            <ControlLabel>Momentum Controls</ControlLabel>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {[0, 1, 2, 3].map(level => (
                <ControlButton 
                  key={level}
                  onClick={() => setMomentumLevel(level)}
                  style={{ 
                    background: momentum === level ? 'rgba(255, 215, 0, 0.3)' : 'rgba(59, 130, 246, 0.3)',
                    borderColor: momentum === level ? '#FFD700' : '#3b82f6'
                  }}
                >
                  {level}
                </ControlButton>
              ))}
            </div>
          </ControlGroup>
          
          <ControlGroup>
            <ControlLabel>Demo Controls</ControlLabel>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <ControlButton onClick={resetDemo}>Reset Demo</ControlButton>
              <ControlButton onClick={() => addInsight(25)}>Fill Insight Bar</ControlButton>
              <ControlButton onClick={() => setMomentumLevel(3)}>Max Momentum</ControlButton>
            </div>
          </ControlGroup>
        </ControlPanel>
        
        <ChallengeUI
          title={SAMPLE_CHALLENGE.title}
          questions={SAMPLE_CHALLENGE.questions}
          currentQuestionIndex={currentQuestionIndex}
          selectedOption={selectedOption}
          allAnswers={allAnswers}
          difficulty={SAMPLE_CHALLENGE.difficulty}
          mentor={SAMPLE_CHALLENGE.mentor}
          showFeedback={showFeedback}
          usedTangent={usedTangent}
          usedBoost={usedBoost}
          insight={insight}
          momentum={momentum}
          maxMomentum={3}
          onOptionSelect={handleOptionSelect}
          onContinue={handleContinue}
          onTangent={handleTangent}
          onBoost={handleBoost}
        />
      </MainContentContainer>
    </PageContainer>
  );
};

export default ChallengeUIExample; 