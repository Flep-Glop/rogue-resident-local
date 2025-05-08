'use client';

import React, { useState } from 'react';
import styled from 'styled-components';
import { MultipleChoiceQuestion as MultipleChoiceQuestionType } from '../../types/questions';
import { MentorId } from '../../types';

interface Props {
  question: MultipleChoiceQuestionType;
  onAnswer: (selectedOptionIndex: number) => void;
  disabled?: boolean;
  showFeedback?: boolean;
  feedback?: {
    correct: boolean;
    message: string;
  };
}

const QuestionContainer = styled.div`
  background-color: rgba(0, 0, 0, 0.7);
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1rem;
  border: 1px solid #333;
`;

const QuestionText = styled.h3`
  font-size: 1.2rem;
  color: #fff;
  margin-bottom: 1.5rem;
`;

const OptionsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
`;

const OptionButton = styled.button<{ selected?: boolean, correct?: boolean, incorrect?: boolean }>`
  padding: 0.8rem 1rem;
  background-color: ${props => 
    props.correct ? 'rgba(0, 128, 0, 0.2)' : 
    props.incorrect ? 'rgba(128, 0, 0, 0.2)' : 
    props.selected ? 'rgba(64, 64, 224, 0.2)' : 
    'rgba(32, 32, 32, 0.8)'
  };
  border: 1px solid ${props => 
    props.correct ? '#0f0' : 
    props.incorrect ? '#f00' : 
    props.selected ? '#00f' : 
    '#333'
  };
  border-radius: 4px;
  color: #fff;
  text-align: left;
  transition: all 0.2s;
  cursor: ${props => props.disabled ? 'default' : 'pointer'};
  
  &:hover {
    background-color: ${props => props.disabled ? 
      (props.correct ? 'rgba(0, 128, 0, 0.2)' : 
       props.incorrect ? 'rgba(128, 0, 0, 0.2)' : 
       props.selected ? 'rgba(64, 64, 224, 0.2)' : 
       'rgba(32, 32, 32, 0.8)')
      : 'rgba(64, 64, 224, 0.3)'
    };
  }
`;

const FeedbackContainer = styled.div<{ correct: boolean }>`
  margin-top: 1.5rem;
  padding: 1rem;
  background-color: ${props => props.correct ? 'rgba(0, 128, 0, 0.2)' : 'rgba(128, 0, 0, 0.2)'};
  border: 1px solid ${props => props.correct ? '#0f0' : '#f00'};
  border-radius: 4px;
  color: #fff;
`;

const MentorContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
`;

const MentorAvatar = styled.div<{ mentor: MentorId }>`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: ${props => {
    switch (props.mentor) {
      case 'KAPOOR': return '#ec4899'; // Pink for Dosimetry
      case 'JESSE': return '#f59e0b';  // Amber for Linac Anatomy
      case 'GARCIA': return '#10b981'; // Green for Radiation Therapy
      case 'QUINN': return '#3b82f6';  // Blue for Treatment Planning
      default: return '#6b7280';       // Gray as fallback
    }
  }};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
`;

const MentorName = styled.span`
  font-weight: bold;
  color: #fff;
`;

const MultipleChoiceQuestion: React.FC<Props> = ({
  question,
  onAnswer,
  disabled = false,
  showFeedback = false,
  feedback
}) => {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  
  const handleOptionClick = (index: number) => {
    if (disabled) return;
    
    setSelectedOption(index);
    onAnswer(index);
  };
  
  // Get first initial of mentor name for avatar
  const getMentorInitial = (mentorId: MentorId): string => {
    switch (mentorId) {
      case 'KAPOOR': return 'K';
      case 'JESSE': return 'J';
      case 'GARCIA': return 'G';
      case 'QUINN': return 'Q';
      default: return 'M';
    }
  };
  
  // Get full mentor name
  const getMentorName = (mentorId: MentorId): string => {
    switch (mentorId) {
      case 'KAPOOR': return 'Dr. Kapoor';
      case 'JESSE': return 'Dr. Jesse';
      case 'GARCIA': return 'Dr. Garcia';
      case 'QUINN': return 'Dr. Quinn';
      default: return 'Mentor';
    }
  };
  
  return (
    <QuestionContainer>
      <MentorContainer>
        <MentorAvatar mentor={question.tags.mentor}>
          {getMentorInitial(question.tags.mentor)}
        </MentorAvatar>
        <MentorName>{getMentorName(question.tags.mentor)}</MentorName>
      </MentorContainer>
      
      <QuestionText>{question.question}</QuestionText>
      
      <OptionsContainer>
        {question.options.map((option, index) => (
          <OptionButton
            key={index}
            selected={selectedOption === index}
            correct={showFeedback && option.isCorrect}
            incorrect={showFeedback && selectedOption === index && !option.isCorrect}
            disabled={disabled}
            onClick={() => handleOptionClick(index)}
          >
            {option.text}
          </OptionButton>
        ))}
      </OptionsContainer>
      
      {showFeedback && feedback && (
        <FeedbackContainer correct={feedback.correct}>
          {feedback.message}
        </FeedbackContainer>
      )}
    </QuestionContainer>
  );
};

export default MultipleChoiceQuestion; 