'use client';

import React from 'react';
import styled from 'styled-components';
import { Question, QuestionType } from '../../types/questions';
import { MathJax } from 'better-react-mathjax';

interface Props {
  question: Question;
  isCorrect: boolean;
  answer?: any;
  expectedAnswer?: any;
  masteryGained?: number;
  onContinue: () => void;
}

const FeedbackContainer = styled.div`
  background-color: rgba(0, 0, 0, 0.8);
  border-radius: 8px;
  padding: 1.5rem;
  margin: 1rem 0;
  border: 1px solid #444;
  max-width: 800px;
`;

const FeedbackHeader = styled.div<{ $correct: boolean }>`
  display: flex;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid ${props => props.$correct ? '#4ade80' : '#f87171'};
`;

const FeedbackIcon = styled.div<{ $correct: boolean }>`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background-color: ${props => props.$correct ? 'rgba(0, 128, 0, 0.2)' : 'rgba(128, 0, 0, 0.2)'};
  border: 1px solid ${props => props.$correct ? '#4ade80' : '#f87171'};
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 1rem;
  font-size: 1.5rem;
`;

const FeedbackTitle = styled.h3<{ $correct: boolean }>`
  font-size: 1.5rem;
  color: ${props => props.$correct ? '#4ade80' : '#f87171'};
  margin: 0;
`;

const FeedbackMessage = styled.div<{ $correct: boolean }>`
  padding: 1rem;
  background-color: ${props => props.$correct ? 'rgba(0, 128, 0, 0.1)' : 'rgba(128, 0, 0, 0.1)'};
  border: 1px solid ${props => props.$correct ? '#4ade80' : '#f87171'};
  border-radius: 4px;
  color: #fff;
  margin-bottom: 1.5rem;
`;

const AnswerSection = styled.div`
  margin-bottom: 1.5rem;
  padding: 1rem;
  background-color: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
`;

const AnswerRow = styled.div`
  display: flex;
  margin-bottom: 0.5rem;
  align-items: flex-start;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const AnswerLabel = styled.div`
  width: 120px;
  font-weight: bold;
  color: #ccc;
`;

const AnswerValue = styled.div<{ $correct?: boolean; $incorrect?: boolean }>`
  flex: 1;
  color: ${props => 
    props.$correct ? '#4ade80' : 
    props.$incorrect ? '#f87171' : 
    '#fff'
  };
`;

const MasterySection = styled.div`
  background-color: rgba(59, 130, 246, 0.1);
  border: 1px solid #3b82f6;
  border-radius: 4px;
  padding: 1rem;
  margin-bottom: 1.5rem;
`;

const MasteryTitle = styled.h4`
  color: #3b82f6;
  margin-top: 0;
  margin-bottom: 0.5rem;
`;

const MasteryBarContainer = styled.div`
  height: 24px;
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  overflow: hidden;
  margin: 0.5rem 0;
`;

const MasteryBar = styled.div<{ width: string }>`
  height: 100%;
  width: ${props => props.width};
  background-color: #3b82f6;
  border-radius: 12px;
  transition: width 1s ease-out;
`;

const MasteryValue = styled.div`
  color: #3b82f6;
  font-weight: bold;
`;

const Button = styled.button`
  padding: 0.8rem 1.5rem;
  background-color: rgba(59, 130, 246, 0.3);
  border: 1px solid #3b82f6;
  border-radius: 4px;
  color: #fff;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background-color: rgba(59, 130, 246, 0.5);
  }
`;

const QuestionFeedback: React.FC<Props> = ({
  question,
  isCorrect,
  answer,
  expectedAnswer,
  masteryGained = 0,
  onContinue
}) => {
  const message = isCorrect ? question.feedback.correct : question.feedback.incorrect;
  
  // Format the user's answer based on question type
  const formatUserAnswer = () => {
    if (!answer) return 'No answer provided';
    
    switch (question.type) {
      case QuestionType.MULTIPLE_CHOICE:
        // For multiple choice, answer might be the index or the text
        return typeof answer === 'number' 
          ? `Option ${answer + 1}` 
          : answer;
          
      case QuestionType.MATCHING:
        // For matching, answer is usually an object mapping item IDs to match IDs
        return (
          <div>
            {Object.entries(answer).map(([itemId, matchId]) => (
              <div key={itemId}>Item {itemId} → Match {matchId}</div>
            ))}
          </div>
        );
        
      case QuestionType.PROCEDURAL:
        // For procedural, answer is usually an array of step IDs
        return (
          <div>
            {answer.map((stepId: number, index: number) => (
              <div key={index}>Step {index + 1}: ID {stepId}</div>
            ))}
          </div>
        );
        
      case QuestionType.CALCULATION:
        // For calculation, answer is usually a number
        return (
          <MathJax>{answer.toString()}</MathJax>
        );
        
      default:
        return JSON.stringify(answer);
    }
  };
  
  // Format the expected answer based on question type
  const formatExpectedAnswer = () => {
    if (!expectedAnswer) return 'Not provided';
    
    switch (question.type) {
      case QuestionType.MULTIPLE_CHOICE:
        // For multiple choice, expected answer might be the index or the text
        return typeof expectedAnswer === 'number' 
          ? `Option ${expectedAnswer + 1}` 
          : expectedAnswer;
          
      case QuestionType.MATCHING:
        // For matching, expected is usually an object mapping item IDs to match IDs
        return (
          <div>
            {Object.entries(expectedAnswer).map(([itemId, matchId]) => (
              <div key={itemId}>Item {itemId} → Match {matchId}</div>
            ))}
          </div>
        );
        
      case QuestionType.PROCEDURAL:
        // For procedural, expected is usually an array of step IDs
        return (
          <div>
            {expectedAnswer.map((stepId: number, index: number) => (
              <div key={index}>Step {index + 1}: ID {stepId}</div>
            ))}
          </div>
        );
        
      case QuestionType.CALCULATION:
        // For calculation, expected is usually a number
        return (
          <MathJax>{expectedAnswer.toString()}</MathJax>
        );
        
      default:
        return JSON.stringify(expectedAnswer);
    }
  };
  
  return (
    <FeedbackContainer>
      <FeedbackHeader $correct={isCorrect}>
        <FeedbackIcon $correct={isCorrect}>
          {isCorrect ? '✓' : '✗'}
        </FeedbackIcon>
        <FeedbackTitle $correct={isCorrect}>
          {isCorrect ? 'Correct!' : 'Incorrect'}
        </FeedbackTitle>
      </FeedbackHeader>
      
      <FeedbackMessage $correct={isCorrect}>
        {message}
      </FeedbackMessage>
      
      <AnswerSection>
        <AnswerRow>
          <AnswerLabel>Your Answer:</AnswerLabel>
          <AnswerValue $correct={isCorrect} $incorrect={!isCorrect}>
            {formatUserAnswer()}
          </AnswerValue>
        </AnswerRow>
        
        {!isCorrect && expectedAnswer && (
          <AnswerRow>
            <AnswerLabel>Correct Answer:</AnswerLabel>
            <AnswerValue $correct>
              {formatExpectedAnswer()}
            </AnswerValue>
          </AnswerRow>
        )}
      </AnswerSection>
      
      {masteryGained > 0 && (
        <MasterySection>
          <MasteryTitle>
            Knowledge Mastery Gained
          </MasteryTitle>
          <MasteryBarContainer>
            <MasteryBar width={`${Math.min(masteryGained * 5, 100)}%`} />
          </MasteryBarContainer>
          <MasteryValue>+{masteryGained.toFixed(1)}%</MasteryValue>
        </MasterySection>
      )}
      
      <Button onClick={onContinue}>
        Continue
      </Button>
    </FeedbackContainer>
  );
};

export default QuestionFeedback; 