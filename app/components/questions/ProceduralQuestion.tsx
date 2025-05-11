'use client';

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { ProceduralQuestion as ProceduralQuestionType, ProceduralStep } from '../../types/questions';
import { MentorId } from '../../types';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { TouchBackend } from 'react-dnd-touch-backend';
import { isMobile } from 'react-device-detect';

interface Props {
  question: ProceduralQuestionType;
  steps: ProceduralStep[];
  onAnswer: (orderedSteps: number[]) => void;
  disabled?: boolean;
  showFeedback?: boolean;
  feedback?: {
    correct: boolean;
    message: string;
    correctOrder?: number[];
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

const StepsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  margin-bottom: 1rem;
`;

const StepItem = styled.div<{ $isDragging?: boolean; $isCorrect?: boolean; $isIncorrect?: boolean }>`
  padding: 1rem;
  background-color: ${props => 
    props.$isCorrect ? 'rgba(0, 128, 0, 0.2)' : 
    props.$isIncorrect ? 'rgba(128, 0, 0, 0.2)' : 
    'rgba(32, 32, 32, 0.8)'
  };
  border: 1px solid ${props => 
    props.$isCorrect ? '#0f0' : 
    props.$isIncorrect ? '#f00' : 
    '#333'
  };
  border-radius: 4px;
  color: #fff;
  opacity: ${props => props.$isDragging ? 0.5 : 1};
  cursor: ${props => props.$disabled ? 'default' : 'grab'};
  display: flex;
  align-items: center;
`;

const StepNumber = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background-color: rgba(64, 64, 224, 0.2);
  border-radius: 50%;
  margin-right: 0.8rem;
  font-size: 0.9rem;
`;

const StepText = styled.div`
  flex: 1;
`;

const DropArea = styled.div<{ $isOver?: boolean; $canDrop?: boolean }>`
  height: 8px;
  margin: 4px 0;
  background-color: ${props => props.$isOver && props.$canDrop ? 'rgba(64, 64, 224, 0.5)' : 'transparent'};
  border-radius: 4px;
`;

const FeedbackContainer = styled.div<{ $correct: boolean }>`
  margin-top: 1.5rem;
  padding: 1rem;
  background-color: ${props => props.$correct ? 'rgba(0, 128, 0, 0.2)' : 'rgba(128, 0, 0, 0.2)'};
  border: 1px solid ${props => props.$correct ? '#0f0' : '#f00'};
  border-radius: 4px;
  color: #fff;
`;

const ButtonContainer = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 1rem;
`;

const Button = styled.button`
  padding: 0.8rem 1.2rem;
  background-color: rgba(64, 64, 224, 0.3);
  border: 1px solid #33f;
  border-radius: 4px;
  color: #fff;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background-color: rgba(64, 64, 224, 0.5);
  }
  
  &:disabled {
    background-color: rgba(64, 64, 64, 0.3);
    border-color: #555;
    cursor: not-allowed;
  }
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

// Item type for drag and drop
const ItemTypes = {
  STEP: 'step',
};

// Draggable step component
const DraggableStep = ({ step, index, moveStep, disabled, isCorrect, isIncorrect }: any) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.STEP,
    item: { index, id: step.stepId },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
    canDrag: !disabled,
  }));

  // Use a ref callback to apply the drag ref without passing react-dnd props to DOM
  const dragRef = (el: HTMLDivElement | null) => {
    drag(el);
  };

  return (
    <StepItem
      ref={dragRef}
      $isDragging={isDragging}
      $disabled={disabled}
      $isCorrect={isCorrect}
      $isIncorrect={isIncorrect}
    >
      <StepNumber>{index + 1}</StepNumber>
      <StepText>{step.stepText}</StepText>
    </StepItem>
  );
};

// Drop area component
const StepDropArea = ({ index, moveStep }: any) => {
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: ItemTypes.STEP,
    drop: (item: any) => moveStep(item.index, index),
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
      canDrop: !!monitor.canDrop(),
    }),
  });

  // Use a ref callback to apply the drop ref without passing react-dnd props to DOM
  const dropRef = (el: HTMLDivElement | null) => {
    drop(el);
  };

  return <DropArea ref={dropRef} $isOver={isOver} $canDrop={canDrop} />;
};

// Mobile-friendly selection component
const SelectionProcedural = ({ steps, onReorder }: any) => {
  const [orderedSteps, setOrderedSteps] = useState<ProceduralStep[]>(steps);
  const [selectedStep, setSelectedStep] = useState<number | null>(null);

  const moveUp = (index: number) => {
    if (index === 0) return;
    const newOrder = [...orderedSteps];
    [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
    setOrderedSteps(newOrder);
    onReorder(newOrder.map(step => step.stepId));
  };

  const moveDown = (index: number) => {
    if (index === orderedSteps.length - 1) return;
    const newOrder = [...orderedSteps];
    [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    setOrderedSteps(newOrder);
    onReorder(newOrder.map(step => step.stepId));
  };

  return (
    <div className="flex flex-col space-y-2">
      {orderedSteps.map((step, index) => (
        <div key={step.stepId} className="flex items-center border border-gray-300 rounded-md p-3 bg-gray-50">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
            {index + 1}
          </div>
          <div className="flex-1">{step.stepText}</div>
          <div className="flex flex-col ml-2">
            <button 
              onClick={() => moveUp(index)}
              disabled={index === 0}
              className="p-1 text-gray-500 disabled:text-gray-300"
            >
              ↑
            </button>
            <button
              onClick={() => moveDown(index)}
              disabled={index === orderedSteps.length - 1}
              className="p-1 text-gray-500 disabled:text-gray-300" 
            >
              ↓
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

const ProceduralQuestion: React.FC<Props> = ({
  question,
  steps,
  onAnswer,
  disabled = false,
  showFeedback = false,
  feedback
}) => {
  const [orderedSteps, setOrderedSteps] = useState<ProceduralStep[]>([]);
  
  useEffect(() => {
    // Shuffle steps initially
    if (steps.length > 0 && !disabled) {
      const shuffled = [...steps].sort(() => Math.random() - 0.5);
      setOrderedSteps(shuffled);
    } else {
      setOrderedSteps(steps);
    }
  }, [steps, disabled]);
  
  const moveStep = (fromIndex: number, toIndex: number) => {
    if (disabled || fromIndex === toIndex) return;
    
    // Log for debugging
    console.log(`Moving step from index ${fromIndex} to index ${toIndex}`);
    
    setOrderedSteps(prevSteps => {
      const newSteps = [...prevSteps];
      const [movedStep] = newSteps.splice(fromIndex, 1);
      newSteps.splice(toIndex, 0, movedStep);
      return newSteps;
    });
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

  // Check if a step is in the correct position
  const isStepCorrect = (step: ProceduralStep, index: number): boolean => {
    if (!showFeedback || !feedback?.correctOrder) return false;
    return feedback.correctOrder[index] === step.stepId;
  };

  // Check if a step is in the wrong position
  const isStepIncorrect = (step: ProceduralStep, index: number): boolean => {
    if (!showFeedback || !feedback?.correctOrder) return false;
    return feedback.correctOrder[index] !== step.stepId;
  };
  
  // Handle submit button
  const handleSubmit = () => {
    if (disabled) return;
    
    // Validate that all steps are ordered
    if (orderedSteps.length === 0) {
      // No steps to submit
      console.warn("Cannot submit - no steps are ordered");
      return;
    }
    
    // Extract just the stepIds in their current order
    const submittedOrder = orderedSteps.map(step => step.stepId);
    console.log("Submitting step order:", submittedOrder);
    
    // Send answer to the parent component
    onAnswer(submittedOrder);
  };
  
  // Handle shuffling steps
  const handleShuffle = () => {
    if (disabled) return;
    
    // Create a copy to avoid mutating the original
    const shuffled = [...orderedSteps];
    
    // Fisher-Yates shuffle algorithm for more randomness
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    setOrderedSteps(shuffled);
  };
  
  // Determine what backend to use based on device
  const dndBackend = isMobile ? TouchBackend : HTML5Backend;
  
  return (
    <QuestionContainer>
      <MentorContainer>
        <MentorAvatar mentor={question.tags.mentor}>
          {getMentorInitial(question.tags.mentor)}
        </MentorAvatar>
        <MentorName>{getMentorName(question.tags.mentor)}</MentorName>
      </MentorContainer>
      
      <QuestionText>
        Arrange the following steps in the correct order:
      </QuestionText>
      
      {isMobile ? (
        <SelectionProcedural 
          steps={orderedSteps} 
          onReorder={(newOrder: number[]) => onAnswer(newOrder)} 
        />
      ) : (
        <DndProvider backend={dndBackend}>
          <StepsContainer>
            <StepDropArea index={0} moveStep={moveStep} />
            {orderedSteps.map((step, index) => (
              <React.Fragment key={step.stepId}>
                <DraggableStep 
                  step={step} 
                  index={index} 
                  moveStep={moveStep}
                  disabled={disabled}
                  isCorrect={isStepCorrect(step, index)}
                  isIncorrect={isStepIncorrect(step, index)}
                />
                <StepDropArea index={index + 1} moveStep={moveStep} />
              </React.Fragment>
            ))}
          </StepsContainer>
        </DndProvider>
      )}
      
      {!disabled && !showFeedback && (
        <ButtonContainer>
          <Button onClick={handleShuffle} disabled={disabled}>
            Shuffle
          </Button>
          <Button onClick={handleSubmit} disabled={disabled}>
            Submit
          </Button>
        </ButtonContainer>
      )}
      
      {showFeedback && feedback && (
        <FeedbackContainer $correct={feedback.correct}>
          {feedback.message}
        </FeedbackContainer>
      )}
    </QuestionContainer>
  );
};

export default ProceduralQuestion; 