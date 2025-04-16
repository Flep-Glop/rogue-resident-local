// app/components/extensions/types/CalculationInterface.tsx
'use client';

/**
 * Calculation Interface Extension
 * 
 * Provides an interactive calculation interface for physics problems with character integration.
 * Implements Chamber Pattern for performance optimization.
 * Enhanced with improved transitions and professional mentor tone.
 */

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PixelText, PixelButton, PixelBox } from '../../PixelThemeProvider';
import { usePrimitiveStoreValue, useStableCallback } from '../../../core/utils/storeHooks';
import { ExtensionResult } from '../VisualExtender';
import { safeDispatch } from '../../../core/events/CentralEventBus';
import { GameEventType } from '../../../core/events/EventTypes';
import { useResourceStore } from '../../../store/resourceStore';

// Interface definitions for the calculation system
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

interface CalculationStep {
  id: string;
  type: 'FORMULA_RECOGNITION' | 'PARAMETER_IDENTIFICATION' | 'CALCULATION_EXECUTION' | 'CLINICAL_JUDGMENT';
  prompt: string;
  kapoorText?: string; // Character dialogue
  options?: {
    text: string;
    correct: boolean;
    feedback?: string;
  }[];
  hint?: string;
  answer?: number;
  tolerance?: number;
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
  educationalSteps?: CalculationStep[];
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
 * Provides physics calculator with simplified, character-driven interaction
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
  
  // Get additional scenario props if available
  const scenarioInfo = additionalProps?.scenario || null;
  const prefilledValues = additionalProps?.prefilledValues || {};
  
  // Component state
  const [inputValues, setInputValues] = useState<Record<string, number | null>>(() => {
    const initialValues: Record<string, number | null> = {};
    content.formula.variables.forEach(variable => {
      // Use prefilled values if available, otherwise use the default values
      if (prefilledValues && prefilledValues[variable.id] !== undefined) {
        initialValues[variable.id] = prefilledValues[variable.id];
      } else {
        initialValues[variable.id] = variable.isInput ? null : variable.value;
      }
    });
    return initialValues;
  });
  
  // Simplified state management for streamlined interface
  const [currentStage, setCurrentStage] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [feedbackType, setFeedbackType] = useState<'success' | 'error'>('success');
  const [stageCompleted, setStageCompleted] = useState<boolean[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [hintUsed, setHintUsed] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  
  // Animation states
  const [animating, setAnimating] = useState(false);
  const [activeHighlight, setActiveHighlight] = useState<string | null>(null);
  
  // Get momentum and insight from store as primitives
  const momentum = usePrimitiveStoreValue(useResourceStore, state => (state as any).momentum, 0);
  const insight = usePrimitiveStoreValue(useResourceStore, state => (state as any).insight, 0);
  
  // Function to highlight elements on success using Chamber Pattern
  const highlightElements = useCallback(() => {
    if (!containerRef.current) return;
    
    // Add a success class to the container for styling
    containerRef.current.classList.add('calculation-success');
    
    // Remove the class after animation completes
    setTimeout(() => {
      if (containerRef.current && isMountedRef.current) {
        containerRef.current.classList.remove('calculation-success');
      }
    }, 1500);
  }, []);
  
  // Get target variable (the one we're solving for)
  const targetVariable = useMemo(() => {
    return content.formula.variables.find(v => v.isTarget);
  }, [content.formula.variables]);
  
  // Generate character-driven educational steps if not provided
  const educationalSteps = useMemo(() => {
    // If content has predefined educational steps, use those
    if (content.educationalSteps && content.educationalSteps.length > 0) {
      return content.educationalSteps;
    }
    
    // Otherwise, generate default educational steps with Dr. Kapoor's character
    const defaultSteps: CalculationStep[] = [
      {
        id: 'formula-recognition',
        type: 'FORMULA_RECOGNITION',
        kapoorText: "Let's start with the formula we need for this calculation. Precision in our approach is essential.",
        prompt: `What's the formula we need for ${targetVariable?.label || 'this calculation'}?`,
        options: [
          { 
            text: content.formula.display.replace(/\$/g, ''),
            correct: true,
            feedback: "Correct. A solid foundation is essential for reliable results."
          },
          { 
            text: content.formula.display.replace(/\//g, '×').replace(/\$/g, ''),
            correct: false,
            feedback: "That's not correct. Remember that mathematical operations matter. Take another look at how these variables relate."
          },
          { 
            text: content.formula.display.replace(/\×/g, '+').replace(/\$/g, ''),
            correct: false,
            feedback: "Incorrect. Addition and multiplication produce fundamentally different results. Let's be precise about how these variables interact."
          }
        ],
        hint: "Consider the units and relationships between the variables. How do they need to combine mathematically?"
      },
      {
        id: 'parameter-identification',
        type: 'PARAMETER_IDENTIFICATION',
        kapoorText: "Now, which parameters do we need to measure for this calculation? Identifying the right inputs is crucial.",
        prompt: "Which measurements are required for this calculation?",
        options: [
          { 
            text: `${content.formula.variables.filter(v => v.isInput).map(v => v.label).join(', ')}`,
            correct: true,
            feedback: "Correct. You've identified all the necessary parameters."
          },
          { 
            text: `Just ${content.formula.variables.filter(v => v.isInput).slice(0, 1).map(v => v.label).join(', ')}`,
            correct: false,
            feedback: "Incomplete. This calculation requires more parameters than that. Consider all variables in the formula."
          },
          { 
            text: `Everything plus patient demographics`,
            correct: false,
            feedback: "Not quite. While patient context is important clinically, this specific calculation only requires the physical parameters in our formula."
          }
        ],
        hint: "Review the formula we established and identify each variable that needs a measured value."
      },
      {
        id: 'calculation-execution',
        type: 'CALCULATION_EXECUTION',
        kapoorText: "Let's proceed with the calculation. Precision at this stage directly impacts treatment quality.",
        prompt: `What's your calculated result? Show your work.`,
        hint: "Apply the values to the formula we've established. Make sure to maintain proper units throughout your calculation.",
        answer: content.solutions?.[0]?.value || 0,
        tolerance: (content.solutions?.[0]?.value || 0) * 0.01 // 1% tolerance
      },
      {
        id: 'clinical-judgment',
        type: 'CLINICAL_JUDGMENT',
        kapoorText: "Beyond the mathematics, let's consider the clinical significance. How does this result impact patient care?",
        prompt: "What's the clinical significance of this calculation?",
        options: [
          { 
            text: `It ensures the precise prescribed dose reaches the tumor while sparing healthy tissue.`,
            correct: true,
            feedback: "Excellent. You're thinking like a clinical physicist now, connecting the mathematics to patient outcomes."
          },
          { 
            text: `It helps with treatment efficiency.`,
            correct: false,
            feedback: "While efficiency matters, the primary purpose is clinical accuracy and safety. Our calculations directly impact treatment efficacy and patient outcomes."
          },
          { 
            text: `It's mainly for documentation purposes.`,
            correct: false,
            feedback: "Documentation is important, but these calculations directly determine treatment parameters. There's a direct line between our work and patient care."
          }
        ],
        hint: "Consider the consequences of calculation errors. What aspects of treatment depend on this value?"
      }
    ];
    
    return defaultSteps;
  }, [content.educationalSteps, content.formula.display, content.formula.variables, content.solutions, targetVariable]);
  
  // Initialize stage completion tracking
  useEffect(() => {
    if (educationalSteps && educationalSteps.length > 0) {
      setStageCompleted(new Array(educationalSteps.length).fill(false));
    }
  }, [educationalSteps]);
  
  // Determine current educational step
  const currentEducationalStep = useMemo(() => {
    return educationalSteps[currentStage] || null;
  }, [educationalSteps, currentStage]);
  
  // Scenario hints if available
  const scenarioHints = useMemo(() => {
    return scenarioInfo?.hints || [];
  }, [scenarioInfo]);
  
  // Get correct calculation solution
  const getCorrectSolution = useCallback(() => {
    if (content.solutions && content.solutions.length > 0) {
      const validSolution = content.solutions.find(s => s.isValid);
      if (validSolution) {
        return validSolution.value;
      }
    }
    
    // Otherwise calculate it based on formula
    try {
      if (content.id.includes('monitor_units') && targetVariable?.id === 'mu') {
        const dose = inputValues['dose'] as number;
        const calibration = inputValues['calibration'] as number;
        const tpr = inputValues['tpr'] as number;
        const scatter = inputValues['scatter'] as number;
        
        // MU = Dose / (Calibration * TPR * Scatter)
        return dose / (calibration * tpr * scatter);
      }
      
      // For other calculation types, implement as needed
      return null;
    } catch (error) {
      console.error('Error calculating solution:', error);
      return null;
    }
  }, [content.id, content.solutions, inputValues, targetVariable]);
  
  // Handle parameter highlighting
  const handleParameterHover = useCallback((paramId: string) => {
    setActiveHighlight(paramId);
  }, []);
  
  const handleParameterLeave = useCallback(() => {
    setActiveHighlight(null);
  }, []);
  
  // Handle option selection for multiple choice stages
  const handleOptionSelect = useCallback((option: any, index: number) => {
    if (!isMountedRef.current || animating || submitted) return;
    
    setAnimating(true);
    setSelectedAnswer(index);
    setShowFeedback(true);
    setFeedbackMessage(option.feedback || (option.correct ? 'Correct!' : 'Incorrect. Try again.'));
    setFeedbackType(option.correct ? 'success' : 'error');
    
    // Simulate Dr. Kapoor thinking
    setIsThinking(true);
    
    setTimeout(() => {
      if (isMountedRef.current) {
        setIsThinking(false);
        
        // Update stage completion
        if (option.correct) {
          setStageCompleted(prev => {
            const updated = [...prev];
            updated[currentStage] = true;
            return updated;
          });
          
          // Apply momentum effect for correct answer
          safeDispatch(
            GameEventType.RESOURCE_CHANGED,
            {
              resourceType: 'momentum',
              changeType: 'increment'
            },
            'CalculationInterface'
          );
          
          // Use Chamber Pattern for animation
          highlightElements();
          
          // Proceed to next stage after delay
          setTimeout(() => {
            if (isMountedRef.current) {
              setShowFeedback(false);
              setSelectedAnswer(null);
              setAnimating(false);
              
              // Move to next stage if this one is completed
              if (currentStage < educationalSteps.length - 1) {
                setCurrentStage(prev => prev + 1);
              } else {
                // All stages completed
                handleCompletion();
              }
            }
          }, 1500);
        } else {
          // Apply momentum effect for incorrect answer
          safeDispatch(
            GameEventType.RESOURCE_CHANGED,
            {
              resourceType: 'momentum',
              changeType: 'reset'
            },
            'CalculationInterface'
          );
          
          // For incorrect answers, clear after delay
          setTimeout(() => {
            if (isMountedRef.current) {
              setShowFeedback(false);
              setSelectedAnswer(null);
              setAnimating(false);
            }
          }, 1500);
        }
      }
    }, 800); // Brief "thinking" delay
    
  }, [currentStage, educationalSteps.length, animating, submitted, highlightElements]);
  
  // Handle calculation submission
  const handleCalculationSubmit = useCallback(() => {
    if (!isMountedRef.current || animating || submitted) return;
    if (!currentEducationalStep?.answer) return;
    
    const numericValue = parseFloat(userAnswer);
    
    if (isNaN(numericValue)) {
      setFeedbackMessage("Please enter a valid numeric value.");
      setFeedbackType('error');
      setShowFeedback(true);
      
      setTimeout(() => {
        if (isMountedRef.current) {
          setShowFeedback(false);
        }
      }, 1500);
      
      return;
    }
    
    setAnimating(true);
    setShowFeedback(true);
    
    // Simulate Dr. Kapoor checking the work
    setIsThinking(true);
    
    setTimeout(() => {
      if (isMountedRef.current) {
        setIsThinking(false);
        
        // Check if answer is within tolerance
        const tolerance = currentEducationalStep.tolerance || 0.01;
        const correctAnswer = currentEducationalStep.answer || 0;
        const isCorrect = Math.abs(numericValue - correctAnswer) <= tolerance;
        
        setFeedbackMessage(isCorrect 
          ? "Correct. Your calculation shows good command of the principles involved."
          : `Incorrect. The answer is ${correctAnswer}. Take care with your calculations as they directly impact treatment parameters.`
        );
        setFeedbackType(isCorrect ? 'success' : 'error');
        
        // Update stage completion
        if (isCorrect) {
          setStageCompleted(prev => {
            const updated = [...prev];
            updated[currentStage] = true;
            return updated;
          });
          
          // Apply momentum effect for correct calculation
          safeDispatch(
            GameEventType.RESOURCE_CHANGED,
            {
              resourceType: 'momentum',
              changeType: 'increment'
            },
            'CalculationInterface'
          );
          
          // Use Chamber Pattern for animation
          highlightElements();
          
          // Proceed to next stage after delay
          setTimeout(() => {
            if (isMountedRef.current) {
              setShowFeedback(false);
              setUserAnswer('');
              setAnimating(false);
              
              // Move to next stage if this one is completed
              if (currentStage < educationalSteps.length - 1) {
                setCurrentStage(prev => prev + 1);
              } else {
                // All stages completed
                handleCompletion();
              }
            }
          }, 1500);
        } else {
          // Apply momentum effect for incorrect calculation
          safeDispatch(
            GameEventType.RESOURCE_CHANGED,
            {
              resourceType: 'momentum',
              changeType: 'reset'
            },
            'CalculationInterface'
          );
          
          // For incorrect answers, clear after delay
          setTimeout(() => {
            if (isMountedRef.current) {
              setShowFeedback(false);
              setAnimating(false);
            }
          }, 1500);
        }
      }
    }, 800); // Slight delay to simulate checking
    
  }, [currentStage, educationalSteps.length, animating, submitted, userAnswer, currentEducationalStep, highlightElements]);
  
  // Handle completion of all stages
  const handleCompletion = useCallback(() => {
    if (!isMountedRef.current || submitted) return;
    
    setSubmitted(true);
    
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
    
    // Calculate metrics based on performance
    const stagesCompleted = stageCompleted.filter(Boolean).length;
    const totalStages = educationalSteps.length;
    const accuracy = Math.min(1, stagesCompleted / totalStages);
    
    // Base insight multiplied by performance
    const baseInsight = targetSolution.insightValue || 10;
    const insightMultiplier = 1 + (momentum * 0.2); // 20% bonus per momentum level
    const hintPenalty = hintUsed ? 0.8 : 1.0; // 20% reduction if hints used
    const insightGained = Math.round(baseInsight * accuracy * insightMultiplier * hintPenalty);
    
    // Determine momentum effect
    const momentumEffect = accuracy > 0.7 ? 'increment' : (accuracy > 0.3 ? 'maintain' : 'reset');
    
    // Track calculation completion
    safeDispatch(
      GameEventType.EXTENSION_INTERACTION,
      {
        type: 'calculation',
        contentId: content.id,
        characterId,
        stageId,
        accuracy,
        hintUsed
      },
      'CalculationInterface'
    );
    
    // Apply final animation before completion
    highlightElements();
    setAnimating(true);
    
    setTimeout(() => {
      if (isMountedRef.current) {
        setAnimating(false);
        
        // Call completion callback
        onComplete({
          success: accuracy > 0.5,
          accuracy,
          insightGained,
          momentumEffect,
          knowledgeGained: {
            conceptId: content.conceptId,
            amount: Math.max(1, Math.round(accuracy * 10))
          }
        });
      }
    }, 1500);
  }, [
    submitted,
    content.solutions,
    content.id,
    content.conceptId,
    stageCompleted,
    educationalSteps.length,
    momentum,
    hintUsed,
    characterId,
    stageId,
    onComplete,
    highlightElements
  ]);
  
  // Show hint
  const handleShowHint = useCallback(() => {
    if (!isMountedRef.current) return;
    
    setHintUsed(true);
    setShowHint(!showHint);
  }, [showHint]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  
  // Enhanced rendering of variables with color-coded distinct styling
  const renderRelevantVariables = useCallback(() => {
    if (!currentEducationalStep) return null;
    if (currentEducationalStep.type !== 'CALCULATION_EXECUTION') return null;
    
    const relevantVariables = content.formula.variables.filter(v => v.isInput && !v.isTarget);
    
    // Color mapping for different parameter types
    const getColorForParam = (paramId: string) => {
      const colorMap: Record<string, string> = {
        'dose': 'text-yellow-300',
        'calibration': 'text-cyan-300',
        'tpr': 'text-green-300',
        'scatter': 'text-purple-300',
        'output_factor': 'text-cyan-300'
      };
      
      return colorMap[paramId] || 'text-blue-300';
    };
    
    return (
      <div className="my-4 p-3 bg-gradient-to-b from-gray-800/90 to-gray-900/90 rounded-lg border border-blue-900/70 shadow-lg">
        <div className="mb-3 text-sm font-medium uppercase tracking-wider text-blue-400/90 border-b border-blue-900/50 pb-1">
          Calculation Parameters
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {relevantVariables.map(variable => (
            <div 
              key={variable.id} 
              className={`
                flex flex-col justify-center items-center p-2 
                bg-gray-900/80 rounded-md 
                border ${activeHighlight === variable.id ? 'border-' + getColorForParam(variable.id).replace('text-', '') : 'border-gray-700/60'} 
                hover:border-blue-700/60 transition-colors shadow-inner
                ${activeHighlight === variable.id ? 'ring-2 ring-' + getColorForParam(variable.id).replace('text-', '') + '/50' : ''}
              `}
              onMouseEnter={() => handleParameterHover(variable.id)}
              onMouseLeave={handleParameterLeave}
            >
              <div className={`text-sm font-medium ${getColorForParam(variable.id)} mb-1`}>{variable.label}</div>
              <div className="flex items-baseline">
                <span className={`text-xl font-mono font-semibold ${getColorForParam(variable.id)}`}>
                  {inputValues[variable.id] !== null ? inputValues[variable.id] : '—'}
                </span>
                {variable.unit && (
                  <span className="ml-1 text-xs text-gray-400 font-normal">
                    {variable.unit}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-3 pt-2 border-t border-gray-700/40">
          <div className="text-xs text-gray-400 italic">
            Use these values in the formula: 
            <span className="font-mono text-blue-300 font-medium ml-1">
              MU = Dose / (Cal × TPR × Scatter)
            </span>
          </div>
        </div>
      </div>
    );
  }, [currentEducationalStep, content.formula.variables, inputValues, activeHighlight, handleParameterHover, handleParameterLeave]);
  
  // Render the conversation-style calculation interface
  return (
    <div 
      ref={containerRef}
      className="bg-gray-900/90 text-white rounded-lg overflow-hidden"
    >
      {/* Main calculation area */}
      <div className="p-3">
        {/* Calculation parameters when needed */}
        {currentEducationalStep && currentEducationalStep.type === 'CALCULATION_EXECUTION' && renderRelevantVariables()}
        
        {/* Current question directly without character avatar */}
        {currentEducationalStep && !showFeedback && !isThinking && (
          <div className="mb-4">
            <p className="text-white mb-3">
              {currentEducationalStep.prompt}
            </p>
          </div>
        )}
        
        {/* Thinking indicator */}
        {isThinking && (
          <div className="text-gray-400 py-3">
            <span className="inline-block animate-pulse">.</span>
            <span className="inline-block animate-pulse animation-delay-200">.</span>
            <span className="inline-block animate-pulse animation-delay-400">.</span>
          </div>
        )}
        
        {/* Feedback message */}
        {showFeedback && feedbackMessage && (
          <div className={`mb-4 py-2 ${
            feedbackType === 'success'
              ? 'text-green-300'
              : 'text-red-300'
          }`}>
            {feedbackMessage}
          </div>
        )}
        
        {/* User response area */}
        {!showFeedback && currentEducationalStep && !isThinking && (
          <div className="mt-2">
            {currentEducationalStep.type === 'CALCULATION_EXECUTION' ? (
              <div className="flex items-center space-x-3">
                <input
                  type="number"
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  className="bg-gray-800 border border-gray-700 rounded-md p-2 flex-1 font-mono text-white"
                  step="any"
                  placeholder={`Your answer${targetVariable?.unit ? ` (${targetVariable.unit})` : ''}`}
                  disabled={animating || submitted}
                />
                <button
                  onClick={handleCalculationSubmit}
                  className="px-3 py-2 bg-blue-700 hover:bg-blue-600 text-white rounded-md transition-colors"
                  disabled={animating || submitted || !userAnswer}
                >
                  Submit
                </button>
              </div>
            ) : currentEducationalStep.options ? (
              <div className="space-y-2">
                {currentEducationalStep.options.map((option, index) => (
                  <button
                    key={index}
                    className={`w-full text-left p-2 rounded-md transition-colors ${
                      selectedAnswer === index 
                        ? (option.correct ? 'bg-green-900 text-green-100' : 'bg-red-900 text-red-100')
                        : 'bg-gray-800 hover:bg-gray-700 text-white'
                    }`}
                    onClick={() => handleOptionSelect(option, index)}
                    disabled={animating || submitted}
                  >
                    {option.text}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        )}
        
        {/* Hint section */}
        {!showFeedback && currentEducationalStep?.hint && !isThinking && (
          <div className="mt-3 text-right">
            <button
              onClick={handleShowHint}
              className="text-gray-400 hover:text-gray-300 text-sm"
              disabled={animating || submitted}
            >
              {showHint ? "Hide hint" : "Need a hint?"}
            </button>
            
            {showHint && (
              <div className="mt-2 p-2 bg-gray-800/80 rounded-md text-sm text-gray-400 italic text-left">
                {currentEducationalStep.hint}
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Subtle progress indicator at the bottom */}
      <div className="bg-gray-800/50 px-3 py-1 border-t border-gray-700/50 flex justify-between items-center text-xs text-gray-500">
        <div className="flex space-x-1 items-center">
          <div className="flex space-x-1">
            {educationalSteps.map((_, index) => (
              <div 
                key={index}
                className={`h-1 w-3 rounded-sm ${
                  index === currentStage
                    ? 'bg-blue-500'
                    : stageCompleted[index]
                      ? 'bg-green-500/70'
                      : 'bg-gray-700'
                }`}
              ></div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Add animations and styles */}
      <style jsx>{`
        .calculation-success {
          animation: success-pulse 1.5s ease-in-out;
        }
        
        @keyframes success-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
          50% { box-shadow: 0 0 10px 2px rgba(34, 197, 94, 0.2); }
        }
        
        .animation-delay-200 {
          animation-delay: 200ms;
        }
        
        .animation-delay-400 {
          animation-delay: 400ms;
        }
        
        input::-webkit-outer-spin-button,
        input::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        
        input[type=number] {
          -moz-appearance: textfield;
        }
      `}</style>
    </div>
  );
};

export default CalculationInterface;