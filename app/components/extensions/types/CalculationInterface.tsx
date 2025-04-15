// app/components/extensions/types/CalculationInterface.tsx
'use client';

/**
 * Calculation Interface Extension
 * 
 * Provides an interactive calculation interface for physics problems.
 * Implements Chamber Pattern for performance optimization.
 */

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PixelText, PixelButton, PixelBox } from '../../PixelThemeProvider';
import { usePrimitiveStoreValue, useStableCallback } from '../../../core/utils/storeHooks';
import { ExtensionResult } from '../VisualExtender';
import { safeDispatch } from '../../../core/events/CentralEventBus';
import { GameEventType } from '../../../core/events/EventTypes';
import { useResourceStore } from '../../../store/resourceStore';

interface FormulaVariable {
  id: string;
  label: string;
  value: number | null;
  unit: string;
  isInput: boolean;
  isTarget: boolean;
  hint?: string;
  range?: {
    min: number;
    max: number;
  };
}

interface CalculationContent {
  id: string;
  title: string;
  description: string;
  formula: {
    display: string;
    variables: FormulaVariable[];
    steps?: {
      id: string;
      description: string;
      hint?: string;
    }[];
  };
  conceptId: string;
  difficulty: 'easy' | 'medium' | 'hard';
  domain: string;
  solutions?: {
    label: string;
    value: number;
    unit: string;
    isValid: boolean;
    insightValue: number;
  }[];
}

interface CalculationInterfaceProps {
  content: CalculationContent;
  characterId: string;
  stageId: string;
  additionalProps?: Record<string, any>;
  onComplete: (result: ExtensionResult) => void;
}

/**
 * Calculation Interface Component
 * 
 * Provides a physics calculator with formula visualization and step-by-step guidance
 */
const CalculationInterface: React.FC<CalculationInterfaceProps> = ({
  content,
  characterId,
  stageId,
  additionalProps,
  onComplete
}) => {
  // Mount tracking ref
  const isMountedRef = useRef(true);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Component state
  const [inputValues, setInputValues] = useState<Record<string, number | null>>(() => {
    const initialValues: Record<string, number | null> = {};
    content.formula.variables.forEach(variable => {
      initialValues[variable.id] = variable.isInput ? null : variable.value;
    });
    return initialValues;
  });
  
  const [calculationResult, setCalculationResult] = useState<number | null>(null);
  const [showSolution, setShowSolution] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [hintUsed, setHintUsed] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  
  // Get momentum from store as primitive
  const momentum = usePrimitiveStoreValue(useResourceStore, state => state.momentum, 0);
  
  // Track UI animations
  const [animating, setAnimating] = useState(false);
  
  // Get target variable (the one we're solving for)
  const targetVariable = useMemo(() => {
    return content.formula.variables.find(v => v.isTarget);
  }, [content.formula.variables]);
  
  // Memoize steps from content
  const steps = useMemo(() => {
    return content.formula.steps || [];
  }, [content.formula.steps]);
  
  // Calculate the solution value
  const calculateSolution = useCallback(() => {
    // This is a simplified calculator - in a real implementation,
    // we would use a math evaluation library to calculate based on the formula
    
    // For now, just demonstrate the capability with a mock calculation
    try {
      // Check if we have all required input values
      const missingInputs = content.formula.variables
        .filter(v => v.isInput && inputValues[v.id] === null)
        .map(v => v.label);
      
      if (missingInputs.length > 0) {
        setFeedbackMessage(`Please enter values for: ${missingInputs.join(', ')}`);
        return null;
      }
      
      // In a real implementation, this would use the formula to calculate
      // For demonstration, we'll just implement some common formulas
      
      // For HVL calculation (common medical physics calculation)
      if (content.id.includes('hvl')) {
        const I0 = inputValues['I0'] as number;
        const I = inputValues['I'] as number;
        const μ = inputValues['mu'] as number;
        
        if (targetVariable?.id === 'x') {
          // HVL formula: I = I0 * e^(-μx)
          // Solving for x: x = -ln(I/I0)/μ
          return -Math.log(I / I0) / μ;
        }
      }
      
      // For monitor unit calculation
      if (content.id.includes('monitor_units')) {
        const dose = inputValues['dose'] as number;
        const calibration = inputValues['calibration'] as number;
        const tpr = inputValues['tpr'] as number;
        const scatter = inputValues['scatter'] as number;
        
        if (targetVariable?.id === 'mu') {
          // MU = Dose / (Calibration * TPR * Scatter)
          return dose / (calibration * tpr * scatter);
        }
      }
      
      // Generic calculation fallback - use the provided solution
      // In a real implementation, this would evaluate the formula
      if (targetVariable && content.solutions) {
        const solution = content.solutions.find(s => s.isValid);
        return solution?.value || null;
      }
      
      return null;
    } catch (error) {
      console.error('Calculation error:', error);
      setFeedbackMessage('Error calculating result');
      return null;
    }
  }, [content.id, content.formula.variables, content.solutions, inputValues, targetVariable]);
  
  // Handle input change
  const handleInputChange = useCallback((variableId: string, value: string) => {
    if (!isMountedRef.current) return;
    
    // Clear feedback when user starts typing
    if (feedbackMessage) {
      setFeedbackMessage(null);
    }
    
    // Parse numeric value
    const numericValue = value === '' ? null : parseFloat(value);
    
    // Update input values
    setInputValues(prev => ({
      ...prev,
      [variableId]: numericValue
    }));
  }, [feedbackMessage]);
  
  // Handle calculation attempt
  const handleCalculate = useCallback(() => {
    if (!isMountedRef.current) return;
    
    const result = calculateSolution();
    setCalculationResult(result);
    
    if (result !== null) {
      // Check against target variable range if it exists
      if (targetVariable?.range) {
        const { min, max } = targetVariable.range;
        if (result < min || result > max) {
          setFeedbackMessage(`The result seems out of the expected range (${min}${targetVariable.unit} to ${max}${targetVariable.unit})`);
        } else {
          setFeedbackMessage(null);
        }
      } else {
        setFeedbackMessage(null);
      }
    }
  }, [calculateSolution, targetVariable]);
  
  // Handle submission
  const handleSubmit = useCallback(() => {
    if (!isMountedRef.current || submitted) return;
    
    try {
      // Calculate final result
      const finalResult = calculateSolution();
      
      if (finalResult === null) {
        setFeedbackMessage('Please complete the calculation first');
        return;
      }
      
      setSubmitted(true);
      setShowSolution(true);
      
      // Find expected solution
      const targetSolution = content.solutions?.find(s => s.isValid);
      
      if (!targetSolution) {
        console.error('No valid solution found in content');
        onComplete({
          success: false,
          accuracy: 0,
          insightGained: 0,
          momentumEffect: 'maintain'
        });
        return;
      }
      
      // Calculate accuracy (how close the answer is to the correct one)
      // For simplicity, we use a basic proximity calculation
      const result = finalResult;
      const expected = targetSolution.value;
      
      // Calculate accuracy as a percentage difference
      const percentageDiff = Math.abs((result - expected) / expected) * 100;
      const accuracyScore = Math.max(0, 1 - (percentageDiff / 20)); // 20% diff = 0 accuracy, 0% diff = 1.0 accuracy
      
      // Determine success/failure
      const isSuccess = accuracyScore > 0.8; // 80% accuracy or higher is success
      
      // Calculate insight reward based on difficulty and accuracy
      const difficultyMultiplier = 
        content.difficulty === 'easy' ? 1 :
        content.difficulty === 'medium' ? 1.5 :
        2; // hard
      
      const hintPenalty = hintUsed ? 0.7 : 1;
      const baseInsight = isSuccess ? targetSolution.insightValue : Math.floor(targetSolution.insightValue * 0.3);
      const adjustedInsight = Math.floor(baseInsight * accuracyScore * difficultyMultiplier * hintPenalty);
      
      // Determine momentum effect based on success/failure
      const momentumEffect = isSuccess ? 'increment' : 'reset';
      
      // Prepare knowledge gained if successful
      const knowledgeGained = isSuccess ? {
        conceptId: content.conceptId,
        amount: Math.ceil(10 * accuracyScore * difficultyMultiplier * hintPenalty)
      } : undefined;
      
      // Set feedback message
      if (isSuccess) {
        setFeedbackMessage(`Great! Your calculation of ${result.toFixed(2)}${targetVariable?.unit || ''} is correct.`);
      } else {
        setFeedbackMessage(`Not quite right. The expected result is ${expected.toFixed(2)}${targetVariable?.unit || ''}.`);
      }
      
      // Animation and dispatch events before completing
      setAnimating(true);
      
      // Dispatch calculation completion event
      safeDispatch(
        GameEventType.EXTENSION_INTERACTION,
        {
          type: 'calculation',
          contentId: content.id,
          success: isSuccess,
          accuracy: accuracyScore,
          difficulty: content.difficulty,
          hintUsed,
          characterId,
          stageId
        },
        'CalculationInterface'
      );
      
      // Complete with short delay to allow animation
      setTimeout(() => {
        if (!isMountedRef.current) return;
        
        onComplete({
          success: isSuccess,
          accuracy: accuracyScore,
          insightGained: adjustedInsight,
          momentumEffect,
          knowledgeGained,
          details: {
            expected,
            result,
            difficulty: content.difficulty,
            hintUsed
          }
        });
      }, 2000);
    } catch (error) {
      console.error('Error submitting calculation:', error);
      
      // Fallback completion
      onComplete({
        success: false,
        accuracy: 0,
        insightGained: 0,
        momentumEffect: 'maintain'
      });
    }
  }, [
    calculateSolution, 
    content.conceptId, 
    content.difficulty, 
    content.id, 
    content.solutions, 
    hintUsed, 
    onComplete, 
    submitted, 
    targetVariable?.unit,
    characterId,
    stageId
  ]);
  
  // Handle showing a hint
  const handleHint = useCallback(() => {
    if (!isMountedRef.current || hintUsed) return;
    
    setHintUsed(true);
    
    // Find hint for current step if available
    const currentStepHint = steps[currentStep]?.hint;
    
    if (currentStepHint) {
      setFeedbackMessage(currentStepHint);
    } else if (targetVariable?.hint) {
      setFeedbackMessage(targetVariable.hint);
    } else {
      setFeedbackMessage("Try substituting the known values into the formula and solve for the unknown.");
    }
    
    // Track hint usage
    safeDispatch(
      GameEventType.EXTENSION_HINT_USED,
      {
        type: 'calculation',
        contentId: content.id,
        characterId,
        stageId
      },
      'CalculationInterface'
    );
  }, [
    content.id, 
    currentStep, 
    hintUsed, 
    steps, 
    targetVariable?.hint,
    characterId,
    stageId
  ]);
  
  // Handle next step in calculation
  const handleNextStep = useCallback(() => {
    if (!isMountedRef.current || currentStep >= steps.length - 1) return;
    
    setCurrentStep(prev => prev + 1);
    setFeedbackMessage(null);
  }, [currentStep, steps.length]);
  
  // Handle previous step in calculation
  const handlePrevStep = useCallback(() => {
    if (!isMountedRef.current || currentStep === 0) return;
    
    setCurrentStep(prev => prev - 1);
    setFeedbackMessage(null);
  }, [currentStep]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  
  // DOM-based animation for formula highlighting
  useEffect(() => {
    if (!containerRef.current || !isMountedRef.current) return;
    
    // Add highlight class to the selected formula elements
    const highlightElements = () => {
      if (!containerRef.current) return;
      
      // Find formula elements
      const formulaEl = containerRef.current.querySelector('.formula-display');
      if (!formulaEl) return;
      
      // Add highlight animation
      formulaEl.classList.add('formula-highlight');
      
      // Remove after animation completes
      setTimeout(() => {
        if (formulaEl && isMountedRef.current) {
          formulaEl.classList.remove('formula-highlight');
        }
      }, 1500);
    };
    
    // Trigger highlight on mount and when current step changes
    highlightElements();
    
    // Cleanup
    return () => {
      if (containerRef.current) {
        const formulaEl = containerRef.current.querySelector('.formula-display');
        if (formulaEl) {
          formulaEl.classList.remove('formula-highlight');
        }
      }
    };
  }, [currentStep]);
  
  // Parse and display formula with variable highlighting
  const renderFormula = useMemo(() => {
    const formula = content.formula.display;
    
    // Simple renderer for now - in a production app, we'd use a proper
    // math rendering library like KaTeX or MathJax
    return formula.split(/(\$[a-zA-Z0-9_]+\$)/).map((part, index) => {
      // Check if this part is a variable (enclosed in $)
      const variableMatch = part.match(/\$([a-zA-Z0-9_]+)\$/);
      
      if (variableMatch) {
        const varId = variableMatch[1];
        const variable = content.formula.variables.find(v => v.id === varId);
        
        if (variable) {
          // Highlight the target variable
          const isTarget = variable.isTarget;
          // Highlight filled inputs
          const isFilledInput = variable.isInput && inputValues[variable.id] !== null;
          
          return (
            <span 
              key={index}
              className={`formula-variable ${isTarget ? 'formula-target' : ''} ${isFilledInput ? 'formula-filled' : ''}`}
              data-variable-id={variable.id}
            >
              {variable.label}
            </span>
          );
        }
      }
      
      // Return regular text
      return <span key={index}>{part}</span>;
    });
  }, [content.formula.display, content.formula.variables, inputValues]);
  
  return (
    <div 
      ref={containerRef}
      className="calculation-interface bg-black/80 border border-blue-900/50 rounded-md p-4"
    >
      {/* Title and description */}
      <div className="mb-4">
        <h3 className="text-blue-300 text-lg mb-1">{content.title}</h3>
        <p className="text-gray-300 text-sm">{content.description}</p>
      </div>
      
      {/* Formula display with highlighting */}
      <div className="formula-display bg-black/70 p-3 rounded border border-blue-800/30 mb-4 text-center">
        {renderFormula}
      </div>
      
      {/* Step-by-step guidance if available */}
      {steps.length > 0 && (
        <div className="step-guidance mb-4">
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-blue-200 text-sm">Step {currentStep + 1} of {steps.length}</h4>
            <div className="flex space-x-2">
              <button
                className="text-sm px-2 py-1 bg-blue-900/50 rounded disabled:opacity-50"
                onClick={handlePrevStep}
                disabled={currentStep === 0}
              >
                Previous
              </button>
              <button
                className="text-sm px-2 py-1 bg-blue-900/50 rounded disabled:opacity-50"
                onClick={handleNextStep}
                disabled={currentStep >= steps.length - 1}
              >
                Next
              </button>
            </div>
          </div>
          <div className="bg-blue-900/20 p-2 rounded text-sm text-white">
            {steps[currentStep]?.description || "Follow the steps to solve the problem."}
          </div>
        </div>
      )}
      
      {/* Input fields for variables */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
        {content.formula.variables.filter(v => v.isInput).map((variable) => (
          <div key={variable.id} className="input-field">
            <label className="block text-gray-300 text-sm mb-1">
              {variable.label} {variable.unit && `(${variable.unit})`}
            </label>
            <input
              type="number"
              value={inputValues[variable.id] === null ? '' : inputValues[variable.id]}
              onChange={(e) => handleInputChange(variable.id, e.target.value)}
              className="w-full bg-black/50 border border-blue-800/50 rounded p-2 text-white"
              placeholder={`Enter ${variable.label}`}
              disabled={submitted}
            />
          </div>
        ))}
      </div>
      
      {/* Target calculation result */}
      {targetVariable && (
        <div className="target-result mb-4">
          <div className="flex justify-between items-center mb-1">
            <label className="block text-gray-300 text-sm">
              {targetVariable.label} {targetVariable.unit && `(${targetVariable.unit})`}
            </label>
            <button
              className="text-xs px-2 py-1 bg-blue-700 rounded"
              onClick={handleCalculate}
              disabled={submitted}
            >
              Calculate
            </button>
          </div>
          <div className="relative">
            <input
              type="number"
              value={calculationResult === null ? '' : calculationResult}
              readOnly
              className="w-full bg-black/70 border border-blue-800 rounded p-2 text-white"
              placeholder={`Calculate ${targetVariable.label}`}
            />
            {showSolution && targetVariable.isTarget && content.solutions && (
              <div className="absolute right-2 top-2 text-xs">
                {content.solutions.find(s => s.isValid)?.value.toFixed(2) || 'N/A'}
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Feedback message */}
      <AnimatePresence>
        {feedbackMessage && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="feedback-message mb-4 p-2 bg-blue-900/30 rounded text-sm text-white"
          >
            {feedbackMessage}
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Action buttons */}
      <div className="flex justify-between">
        <button
          className="px-3 py-1 bg-blue-800/50 rounded text-white text-sm disabled:opacity-50"
          onClick={handleHint}
          disabled={hintUsed || submitted}
        >
          Show Hint
        </button>
        <button
          className={`px-4 py-2 rounded text-white ${submitted ? 'bg-green-700' : 'bg-blue-700'}`}
          onClick={submitted ? () => onComplete({
            success: true,
            accuracy: 1,
            insightGained: 0,
            momentumEffect: 'maintain'
          }) : handleSubmit}
          disabled={animating}
        >
          {submitted ? 'Continue' : 'Submit Answer'}
        </button>
      </div>
      
      {/* Styled animations */}
      <style jsx>{`
        .formula-display {
          font-family: monospace;
          font-size: 1.1rem;
          letter-spacing: 0.05rem;
          transition: background-color 0.3s ease;
        }
        
        .formula-highlight {
          background-color: rgba(30, 64, 175, 0.3);
        }
        
        .formula-variable {
          color: #90cdf4;
          padding: 0 2px;
          border-radius: 3px;
          transition: all 0.3s ease;
        }
        
        .formula-target {
          color: #f6ad55;
          font-weight: bold;
        }
        
        .formula-filled {
          background-color: rgba(49, 130, 206, 0.2);
          padding: 0 4px;
        }
      `}</style>
    </div>
  );
};

export default CalculationInterface;