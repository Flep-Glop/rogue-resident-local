'use client';

import React, { useState } from 'react';
import styled from 'styled-components';
import { QuestionContainer, CardContainer } from '../ui/PixelContainer';
import { MultipleChoiceQuestion } from '@/app/types/questions';

// === MIGRATION EXAMPLE ===
// This shows how MultipleChoiceQuestion.tsx can be converted to use pixel containers

interface MultipleChoiceQuestionPixelProps {
  question: MultipleChoiceQuestion;
  onAnswer: (selectedOption: string) => void;
  isAnswered?: boolean;
  userAnswer?: string;
  showFeedback?: boolean;
  feedback?: {
    correct: boolean;
    message: string;
  };
}

// BEFORE: CSS styled container
// const QuestionContainer = styled.div`
//   background-color: rgba(0, 0, 0, 0.7);
//   border-radius: 8px;
//   padding: 1.5rem;
//   margin-bottom: 1rem;
//   border: 1px solid #333;
// `;

// AFTER: We use PixelContainer instead, styled sections remain for layout
const QuestionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
`;

const QuestionProgress = styled.div`
  font-size: 1rem;
  color: #ccc;
  font-weight: 500;
`;

const QuestionText = styled.h3`
  font-size: 1.2rem;
  color: #fff;
  margin: 1.5rem 0;
  line-height: 1.4;
`;

const OptionsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  margin-bottom: 1.5rem;
`;

// Option buttons now use CardContainer instead of styled.button
const OptionButton = styled.button<{ 
  $selected?: boolean; 
  $correct?: boolean; 
  $incorrect?: boolean; 
  disabled?: boolean 
}>`
  padding: 1rem 1.2rem;
  background: transparent; /* Let CardContainer handle background */
  border: none;
  color: #fff;
  text-align: left;
  transition: all 0.2s;
  cursor: ${props => props.disabled ? 'default' : 'pointer'};
  font-size: 1rem;
  width: 100%;
  
  /* Remove old CSS styling, let pixel container handle it */
  &:hover {
    /* Hover effects now handled by CardContainer */
  }
`;

const FeedbackText = styled.div`
  color: #fff;
  font-size: 1rem;
  padding: 0; /* CardContainer handles padding */
  margin: 0;
`;

export const MultipleChoiceQuestionPixel: React.FC<MultipleChoiceQuestionPixelProps> = ({
  question,
  onAnswer,
  isAnswered = false,
  userAnswer,
  showFeedback = false,
  feedback
}) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const handleOptionClick = (optionId: string) => {
    if (isAnswered) return;
    
    setSelectedOption(optionId);
    onAnswer(optionId);
  };

  const getOptionState = (optionId: string) => {
    if (!showFeedback || !isAnswered) {
      return selectedOption === optionId ? 'selected' : 'normal';
    }
    
    // Show correct/incorrect states after answering
    if (optionId === question.correctAnswer) {
      return 'correct';
    } else if (optionId === userAnswer && optionId !== question.correctAnswer) {
      return 'incorrect';
    }
    return 'normal';
  };

  const getCardVariant = (state: string) => {
    // Use different container variants based on state
    switch (state) {
      case 'correct': return 'card';
      case 'incorrect': return 'card';
      case 'selected': return 'card';
      default: return 'card';
    }
  };

  const getDomain = (state: string) => {
    // Map states to domain colors for visual feedback
    switch (state) {
      case 'correct': return 'linac'; // Green
      case 'incorrect': return 'dosimetry'; // Pink/Red
      case 'selected': return 'physics'; // Blue
      default: return undefined;
    }
  };

  const getIsActive = (state: string) => {
    return ['correct', 'incorrect', 'selected'].includes(state);
  };

  return (
    {/* MAIN CONTAINER: QuestionContainer (pixel art) instead of styled div */}
    <QuestionContainer 
      size="lg" 
      domain="physics"
      style={{ marginBottom: '1rem' }}
    >
      <QuestionHeader>
        <QuestionProgress>
          Question {question.id}
        </QuestionProgress>
      </QuestionHeader>

      <QuestionText>
        {question.text}
      </QuestionText>

      <OptionsContainer>
        {question.options.map((option) => {
          const state = getOptionState(option.id);
          const variant = getCardVariant(state);
          const domain = getDomain(state);
          const isActive = getIsActive(state);

          return (
            {/* OPTION BUTTONS: CardContainer instead of styled button */}
            <CardContainer
              key={option.id}
              variant={variant}
              size="md"
              domain={domain}
              isActive={isActive}
              isDisabled={isAnswered}
              onClick={() => handleOptionClick(option.id)}
              style={{ 
                cursor: isAnswered ? 'default' : 'pointer',
                width: '100%'
              }}
            >
              <OptionButton
                $selected={selectedOption === option.id}
                $correct={showFeedback && option.id === question.correctAnswer}
                $incorrect={showFeedback && option.id === userAnswer && option.id !== question.correctAnswer}
                disabled={isAnswered}
              >
                {option.text}
              </OptionButton>
            </CardContainer>
          );
        })}
      </OptionsContainer>

      {/* FEEDBACK: CardContainer for feedback display */}
      {showFeedback && feedback && (
        <CardContainer
          variant="card"
          size="md"
          domain={feedback.correct ? 'linac' : 'dosimetry'}
          isActive={true}
          style={{ marginTop: '1.5rem' }}
        >
          <FeedbackText>
            {feedback.message}
          </FeedbackText>
        </CardContainer>
      )}
    </QuestionContainer>
  );
};

// Export migration comparison component
export const MigrationComparison: React.FC = () => {
  const sampleQuestion: MultipleChoiceQuestion = {
    id: '1',
    type: 'multiple-choice',
    text: 'What is the primary purpose of a linear accelerator in radiation therapy?',
    options: [
      { id: 'a', text: 'To produce diagnostic images' },
      { id: 'b', text: 'To deliver precise radiation doses to tumors' },
      { id: 'c', text: 'To measure radiation exposure' },
      { id: 'd', text: 'To cool the treatment room' }
    ],
    correctAnswer: 'b',
    domain: 'radiation-therapy',
    difficulty: 'beginner',
    explanation: 'Linear accelerators (LINACs) are designed to deliver high-energy radiation beams precisely to tumor targets while minimizing exposure to healthy tissue.'
  };

  return (
    <div style={{ padding: '2rem', backgroundColor: '#0f172a', minHeight: '100vh' }}>
      <h2 style={{ color: 'white', textAlign: 'center', marginBottom: '2rem' }}>
        Migration Example: Multiple Choice Question
      </h2>
      
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h3 style={{ color: '#94a3b8', marginBottom: '1rem' }}>
          AFTER: Pixel Container Version
        </h3>
        
        <MultipleChoiceQuestionPixel
          question={sampleQuestion}
          onAnswer={(answer) => console.log('Selected:', answer)}
          isAnswered={false}
        />
        
        <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: 'rgba(59, 130, 246, 0.1)', borderRadius: '8px' }}>
          <h4 style={{ color: '#60a5fa', marginTop: 0 }}>Migration Benefits:</h4>
          <ul style={{ color: '#e2e8f0', lineHeight: 1.6 }}>
            <li><strong>Consistent Pixel Art Style:</strong> All containers use the same visual language</li>
            <li><strong>Domain Color Integration:</strong> Automatic color theming based on knowledge domain</li>
            <li><strong>State Management:</strong> Built-in active/inactive/disabled states</li>
            <li><strong>Modular Design:</strong> Easy to swap container variants (card/panel/dialog)</li>
            <li><strong>Reduced CSS:</strong> No more complex background/border styling needed</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default MultipleChoiceQuestionPixel; 