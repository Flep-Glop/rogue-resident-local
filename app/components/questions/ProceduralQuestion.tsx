'use client';

import React, { useState, useEffect } from 'react';
import { ProceduralQuestion as ProceduralQuestionType } from '../../types/questions';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { TouchBackend } from 'react-dnd-touch-backend';
import { isMobile } from 'react-device-detect';

interface ProceduralQuestionProps {
  question: ProceduralQuestionType;
  onAnswer: (answer: number[]) => void;
  showFeedback?: boolean;
  isCorrect?: boolean;
}

// Item type for drag and drop
const ItemTypes = {
  PROCEDURE_STEP: 'procedureStep',
};

// Drag-and-drop step component
const DraggableStep = ({ step, index, moveStep }: any) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.PROCEDURE_STEP,
    item: { index, id: step.id || step.stepId },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  const [, drop] = useDrop(() => ({
    accept: ItemTypes.PROCEDURE_STEP,
    hover: (item: any) => {
      if (item.index !== index) {
        moveStep(item.index, index);
        // Update the dragged item's index
        item.index = index;
      }
    },
  }));

  return (
    <div
      ref={(node) => drag(drop(node))}
      className={`cursor-move p-4 mb-2 rounded-md border transition-all ${
        isDragging ? 'opacity-50' : 'opacity-100'
      } bg-blue-50 border-blue-300 shadow-sm`}
    >
      <div className="font-medium text-blue-800 mb-1">Step {index + 1}</div>
      <div>{step.stepText}</div>
    </div>
  );
};

// Mobile-friendly version with up/down buttons
const MobileProcedureStep = ({ step, index, onMoveUp, onMoveDown, isFirst, isLast }: any) => {
  return (
    <div className="relative p-4 mb-4 rounded-md border bg-blue-50 border-blue-300">
      <div className="flex justify-between items-center mb-2">
        <div className="font-medium text-blue-800">Step {index + 1}</div>
        <div className="flex space-x-2">
          <button
            onClick={() => onMoveUp(index)}
            disabled={isFirst}
            className={`p-1 rounded ${
              isFirst ? 'text-gray-400 cursor-not-allowed' : 'text-blue-600 hover:bg-blue-200'
            }`}
            aria-label="Move step up"
          >
            ↑
          </button>
          <button
            onClick={() => onMoveDown(index)}
            disabled={isLast}
            className={`p-1 rounded ${
              isLast ? 'text-gray-400 cursor-not-allowed' : 'text-blue-600 hover:bg-blue-200'
            }`}
            aria-label="Move step down"
          >
            ↓
          </button>
        </div>
      </div>
      <div>{step.stepText}</div>
    </div>
  );
};

const ProceduralQuestion: React.FC<ProceduralQuestionProps> = ({
  question,
  onAnswer,
  showFeedback = false,
  isCorrect,
}) => {
  const [steps, setSteps] = useState<any[]>([]);

  useEffect(() => {
    if (question.steps) {
      // Shuffle the steps for the question
      const shuffledSteps = [...question.steps].sort(() => Math.random() - 0.5);
      setSteps(shuffledSteps);
    }
  }, [question]);

  // Update the answer whenever steps order changes
  useEffect(() => {
    if (steps.length > 0) {
      const currentOrder = steps.map(step => step.id || step.stepId);
      onAnswer(currentOrder);
    }
  }, [steps, onAnswer]);

  // Move a step from one position to another
  const moveStep = (fromIndex: number, toIndex: number) => {
    const updatedSteps = [...steps];
    const [movedStep] = updatedSteps.splice(fromIndex, 1);
    updatedSteps.splice(toIndex, 0, movedStep);
    setSteps(updatedSteps);
  };

  // Mobile handlers for moving steps up/down
  const handleMoveUp = (index: number) => {
    if (index > 0) {
      moveStep(index, index - 1);
    }
  };

  const handleMoveDown = (index: number) => {
    if (index < steps.length - 1) {
      moveStep(index, index + 1);
    }
  };

  // Determine what backend to use based on device
  const dndBackend = isMobile ? TouchBackend : HTML5Backend;

  if (!question.steps || steps.length === 0) {
    return <div>Loading question...</div>;
  }

  return (
    <div className="w-full max-w-3xl mx-auto p-4 bg-white rounded-lg shadow">
      <h3 className="text-xl font-semibold mb-4">Arrange the steps in the correct order:</h3>
      
      {showFeedback && (
        <div
          className={`mb-4 p-3 rounded-md ${
            isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}
        >
          {isCorrect ? question.feedback.correct : question.feedback.incorrect}
        </div>
      )}

      <div className="mb-6 p-4 bg-gray-50 rounded-md border border-gray-300">
        <h4 className="font-medium mb-2">Process: {question.title || 'Procedure Steps'}</h4>
        <p className="text-gray-700">{question.description || 'Arrange the steps in the correct order to complete the procedure.'}</p>
      </div>

      {isMobile ? (
        <div className="space-y-2">
          {steps.map((step, index) => (
            <MobileProcedureStep
              key={step.id || step.stepId || index}
              step={step}
              index={index}
              onMoveUp={handleMoveUp}
              onMoveDown={handleMoveDown}
              isFirst={index === 0}
              isLast={index === steps.length - 1}
            />
          ))}
        </div>
      ) : (
        <DndProvider backend={dndBackend}>
          <div className="space-y-2">
            {steps.map((step, index) => (
              <DraggableStep
                key={step.id || step.stepId || index}
                step={step}
                index={index}
                moveStep={moveStep}
              />
            ))}
          </div>
        </DndProvider>
      )}
      
      <div className="mt-4 text-sm text-gray-600">
        {isMobile ? 'Use the up and down arrows to reorder steps.' : 'Drag and drop to reorder steps.'}
      </div>
    </div>
  );
};

export default ProceduralQuestion; 