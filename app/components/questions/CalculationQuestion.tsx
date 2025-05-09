'use client';

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { CalculationQuestion as CalculationQuestionType, SolutionStep } from '../../types/questions';
import { MentorId } from '../../types';
import { MathJax } from 'better-react-mathjax';

interface Props {
  question: CalculationQuestionType;
  onAnswer: (answer: number) => void;
  disabled?: boolean;
  showFeedback?: boolean;
  feedback?: {
    correct: boolean;
    message: string;
  };
  currentVariables?: Record<string, number>;
}

const QuestionContainer = styled.div`
  background-color: rgba(0, 0, 0, 0.7);
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1rem;
  border: 1px solid #333;
`;

const QuestionText = styled.div`
  font-size: 1.2rem;
  color: #fff;
  margin-bottom: 1.5rem;
`;

const AnswerContainer = styled.div`
  margin-top: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const InputContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const Input = styled.input`
  padding: 0.8rem;
  background-color: rgba(32, 32, 32, 0.8);
  border: 1px solid #555;
  border-radius: 4px;
  color: #fff;
  flex: 1;
  font-size: 1rem;
  
  &:focus {
    outline: none;
    border-color: #77f;
  }
  
  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;

const UnitLabel = styled.div`
  color: #ccc;
  font-size: 1rem;
`;

const Button = styled.button`
  padding: 0.8rem 1.2rem;
  background-color: rgba(64, 64, 224, 0.3);
  border: 1px solid #33f;
  border-radius: 4px;
  color: #fff;
  cursor: pointer;
  transition: all 0.2s;
  margin-top: 0.5rem;
  
  &:hover {
    background-color: rgba(64, 64, 224, 0.5);
  }
  
  &:disabled {
    background-color: rgba(64, 64, 64, 0.3);
    border-color: #555;
    cursor: not-allowed;
  }
`;

const FeedbackContainer = styled.div<{ $correct: boolean }>`
  margin-top: 1.5rem;
  padding: 1rem;
  background-color: ${props => props.$correct ? 'rgba(0, 128, 0, 0.2)' : 'rgba(128, 0, 0, 0.2)'};
  border: 1px solid ${props => props.$correct ? '#0f0' : '#f00'};
  border-radius: 4px;
  color: #fff;
`;

const SolutionContainer = styled.div`
  margin-top: 1.5rem;
  padding: 1rem;
  background-color: rgba(32, 32, 32, 0.8);
  border: 1px solid #555;
  border-radius: 4px;
  color: #fff;
`;

const SolutionTitle = styled.h4`
  font-size: 1.1rem;
  margin-bottom: 1rem;
  border-bottom: 1px solid #555;
  padding-bottom: 0.5rem;
`;

const SolutionStepItem = styled.div`
  margin-bottom: 0.8rem;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
`;

const StepNumber = styled.span`
  font-weight: bold;
  margin-right: 0.5rem;
`;

const FormattedMath = styled.div`
  padding: 0.5rem;
  background-color: rgba(64, 64, 224, 0.1);
  border-radius: 4px;
  margin-top: 0.3rem;
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

const CalculationQuestion: React.FC<Props> = ({
  question,
  onAnswer,
  disabled = false,
  showFeedback = false,
  feedback,
  currentVariables = {}
}) => {
  const [answer, setAnswer] = useState<string>('');
  const [formattedQuestion, setFormattedQuestion] = useState<string>('');
  const [formattedSolution, setFormattedSolution] = useState<SolutionStep[]>([]);
  
  // Format the question by replacing variable placeholders with values
  useEffect(() => {
    let questionText = question.question;
    
    // Replace variable placeholders with actual values
    Object.entries(currentVariables).forEach(([varName, varValue]) => {
      const varRegex = new RegExp(`\\{${varName}\\}`, 'g');
      const unitVar = question.variables.find(v => v.name === varName);
      const valueWithUnit = unitVar ? `${varValue} ${unitVar.unit}` : varValue.toString();
      
      questionText = questionText.replace(varRegex, valueWithUnit);
    });
    
    setFormattedQuestion(questionText);
    
    // Format solution steps if available and showing feedback
    if (question.solution && showFeedback) {
      const formattedSteps = question.solution.map(step => {
        let stepText = step.step;
        
        // Replace variable placeholders in solution steps
        Object.entries(currentVariables).forEach(([varName, varValue]) => {
          const varRegex = new RegExp(`\\{${varName}\\}`, 'g');
          stepText = stepText.replace(varRegex, varValue.toString());
        });
        
        return {
          ...step,
          step: stepText
        };
      });
      
      setFormattedSolution(formattedSteps);
    }
  }, [question, currentVariables, showFeedback]);
  
  // Handle input change
  const handleAnswerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Allow only numbers, decimal point, and minus sign
    const value = e.target.value;
    if (/^-?\d*\.?\d*$/.test(value) || value === '') {
      setAnswer(value);
    }
  };
  
  // Handle submit
  const handleSubmit = () => {
    if (answer.trim() === '') return;
    
    const numericAnswer = parseFloat(answer);
    onAnswer(numericAnswer);
  };
  
  // Get answer unit from the answer formula
  const getAnswerUnit = (): string => {
    if (!question.answer) return '';
    
    // Extract unit from the answer formula text if available
    const unitMatch = question.answer.formula.match(/\s([a-zA-Z]+)$/);
    return unitMatch ? unitMatch[1] : '';
  };
  
  // Get mentor information
  const getMentorInitial = (mentorId: MentorId): string => {
    switch (mentorId) {
      case 'KAPOOR': return 'K';
      case 'JESSE': return 'J';
      case 'GARCIA': return 'G';
      case 'QUINN': return 'Q';
      default: return 'M';
    }
  };
  
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
      
      <QuestionText>
        <MathJax>
          {formattedQuestion}
        </MathJax>
      </QuestionText>
      
      <AnswerContainer>
        <InputContainer>
          <Input
            type="text"
            value={answer}
            onChange={handleAnswerChange}
            placeholder="Enter your answer"
            disabled={disabled}
          />
          <UnitLabel>{getAnswerUnit()}</UnitLabel>
        </InputContainer>
        
        {!disabled && !showFeedback && (
          <Button onClick={handleSubmit} disabled={disabled || answer.trim() === ''}>
            Submit
          </Button>
        )}
      </AnswerContainer>
      
      {showFeedback && feedback && (
        <FeedbackContainer $correct={feedback.correct}>
          {feedback.message}
        </FeedbackContainer>
      )}
      
      {showFeedback && formattedSolution.length > 0 && (
        <SolutionContainer>
          <SolutionTitle>Solution Method</SolutionTitle>
          {formattedSolution.map((step, index) => (
            <SolutionStepItem key={index}>
              <div>
                <StepNumber>Step {index + 1}:</StepNumber>
                {!step.isFormula && step.step}
              </div>
              {step.isFormula && (
                <FormattedMath>
                  <MathJax>{"\\(" + step.step + "\\)"}</MathJax>
                </FormattedMath>
              )}
            </SolutionStepItem>
          ))}
        </SolutionContainer>
      )}
    </QuestionContainer>
  );
};

export default CalculationQuestion; 