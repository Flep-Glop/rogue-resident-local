'use client';

/**
 * UnifiedExtensionContainer
 * 
 * A single cohesive component for extensions that eliminates nested structure.
 * Implements Chamber Pattern principles with optimized rendering and animations.
 * Combines DialogueContainer and extension content into a unified structure.
 * 
 * Implements Chamber Pattern:
 * 1. Uses primitive values for state
 * 2. Stable function references
 * 3. DOM-based animations via refs
 * 4. Atomic state updates
 * 5. Defensive unmount handling
 */

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PixelText, PixelButton, PixelBox } from '../../PixelThemeProvider';
import { usePrimitiveStoreValue } from '../../../core/utils/storeHooks';
import { ExtensionResult, ExtensionType } from '../VisualExtender';
import { safeDispatch } from '../../../core/events/CentralEventBus';
import { GameEventType } from '../../../core/events/EventTypes';
import { useResourceStore } from '../../../store/resourceStore';
import { getExtensionClasses } from '../../../utils/themeUtils';
import { DialogueMode } from '../../dialogue/DialogueContainer';

// Basic interfaces for extension content
interface ExtensionContainerProps {
  extensionType: ExtensionType;
  title?: string;
  characterId: string;
  stageId: string;
  content: any;
  additionalProps?: Record<string, any>;
  onComplete: (result: ExtensionResult) => void;
}

// Header component for the extension
const ExtensionHeader: React.FC<{
  title: string;
  extensionType: ExtensionType;
  characterId: string;
  hideTitle?: boolean;
}> = ({ title, extensionType, characterId, hideTitle }) => {
  // Get theme classes for the extension type
  const themeClasses = getExtensionClasses(extensionType);

  // Return null if title should be hidden
  if (hideTitle) return null;

  return (
    <div 
      className={`px-4 py-2 flex items-center bg-amber-900/40 text-amber-300 border-b border-amber-700/50`}
    >
      <h3 className="text-sm font-pixel">{title}</h3>
    </div>
  );
};

// Footer component for the extension
const ExtensionFooter: React.FC<{
  extensionType: ExtensionType;
  children?: React.ReactNode;
}> = ({ extensionType, children }) => {
  // Get theme classes for the extension type
  const themeClasses = getExtensionClasses(extensionType);

  return (
    <div className={`bg-amber-950/50 px-3 py-1 border-t border-amber-900/50 flex justify-between items-center text-xs text-amber-600`}>
      {children}
    </div>
  );
};

// Unified container for all extensions
const UnifiedExtensionContainer: React.FC<ExtensionContainerProps> = ({
  extensionType,
  title = 'Challenge',
  characterId,
  stageId,
  content,
  additionalProps,
  onComplete
}) => {
  // Mount tracking ref - Chamber Pattern principle #5
  const isMountedRef = useRef(true);
  // Type assertion to fix the ref type
  const containerRef = useRef<HTMLDivElement>(null) as React.RefObject<HTMLDivElement>;
  
  // Get theme classes for the extension type
  const themeClasses = getExtensionClasses(extensionType);
  
  // Animation state
  const [animating, setAnimating] = useState(false);
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  
  // Function to highlight elements on success - Chamber Pattern principle #3
  const highlightElements = useCallback(() => {
    if (!containerRef.current) return;
    
    // Add a success class to the container for styling
    containerRef.current.classList.add('extension-success');
    
    // Remove the class after animation completes
    setTimeout(() => {
      if (containerRef.current && isMountedRef.current) {
        containerRef.current.classList.remove('extension-success');
      }
    }, 1500);
  }, []);
  
  // Main render for calculation interface
  if (extensionType === 'calculation') {
    return <UnifiedCalculationInterface 
      content={content}
      characterId={characterId}
      stageId={stageId}
      additionalProps={additionalProps}
      onComplete={onComplete}
      title={title}
      containerRef={containerRef}
      highlightElements={highlightElements}
      isMountedRef={isMountedRef}
    />;
  }
  
  // Fallback for other types (can be expanded later)
  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, y: 0 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`border-amber-700/70 bg-black/90 border-2 rounded-md overflow-hidden`}
    >
      <ExtensionHeader 
        title={title} 
        extensionType={extensionType}
        characterId={characterId}
      />
      
      <div className="p-0 m-0">
        <PixelText className="p-4">
          This extension type is not yet implemented in the unified container.
        </PixelText>
      </div>
      
      <ExtensionFooter extensionType={extensionType}>
        <div>&nbsp;</div>
      </ExtensionFooter>
      
      <style jsx>{`
        .extension-success {
          animation: success-pulse 1.5s ease-in-out;
        }
        
        @keyframes success-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
          50% { box-shadow: 0 0 10px 2px rgba(34, 197, 94, 0.2); }
        }
      `}</style>
    </motion.div>
  );
};

// The unified calculation interface implementation
const UnifiedCalculationInterface: React.FC<{
  content: any;
  characterId: string;
  stageId: string;
  additionalProps?: Record<string, any>;
  onComplete: (result: ExtensionResult) => void;
  title: string;
  containerRef: React.RefObject<HTMLDivElement>;
  highlightElements: () => void;
  isMountedRef: React.RefObject<boolean>;
}> = ({
  content,
  characterId,
  stageId,
  additionalProps,
  onComplete,
  title,
  containerRef,
  highlightElements,
  isMountedRef
}) => {
  // Get additional scenario props if available
  const scenarioInfo = additionalProps?.scenario || null;
  const prefilledValues = additionalProps?.prefilledValues || {};
  
  // Get theme classes
  const themeClasses = getExtensionClasses('calculation');
  
  // Component state - Chamber Pattern principle #1
  const [inputValues, setInputValues] = useState<Record<string, number | null>>(() => {
    const initialValues: Record<string, number | null> = {};
    content.formula.variables.forEach((variable: any) => {
      // Use prefilled values if available, otherwise use the default values
      if (prefilledValues && prefilledValues[variable.id] !== undefined) {
        initialValues[variable.id] = prefilledValues[variable.id];
      } else {
        initialValues[variable.id] = variable.isInput ? null : variable.value;
      }
    });
    return initialValues;
  });
  
  // Educational steps state
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
  const [activeHighlight, setActiveHighlight] = useState<string | null>(null);
  
  // Get momentum and insight from store as primitives - Chamber Pattern principle #1
  const momentum = usePrimitiveStoreValue(useResourceStore, state => (state as any).momentum, 0);
  const insight = usePrimitiveStoreValue(useResourceStore, state => (state as any).insight, 0);
  
  // Get target variable (the one we're solving for) - Chamber Pattern principle #2
  const targetVariable = useMemo(() => {
    return content.formula.variables.find((v: any) => v.isTarget);
  }, [content.formula.variables]);
  
  // Generate character-driven educational steps if not provided - Chamber Pattern principle #2
  const educationalSteps = useMemo(() => {
    // If content has predefined educational steps, use those
    if (content.educationalSteps && content.educationalSteps.length > 0) {
      return content.educationalSteps;
    }
    
    // Otherwise, generate default educational steps
    const defaultSteps = [
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
            text: `${content.formula.variables.filter((v: any) => v.isInput).map((v: any) => v.label).join(', ')}`,
            correct: true,
            feedback: "Correct. You've identified all the necessary parameters."
          },
          { 
            text: `Just ${content.formula.variables.filter((v: any) => v.isInput).slice(0, 1).map((v: any) => v.label).join(', ')}`,
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
  
  // Handle parameter highlighting - Chamber Pattern principle #2
  const handleParameterHover = useCallback((paramId: string) => {
    setActiveHighlight(paramId);
  }, []);
  
  const handleParameterLeave = useCallback(() => {
    setActiveHighlight(null);
  }, []);
  
  // Handle option selection for multiple choice stages - Chamber Pattern principle #2
  const handleOptionSelect = useCallback((option: any, index: number) => {
    if (!isMountedRef.current || submitted) return;
    
    setSelectedAnswer(index);
    setShowFeedback(true);
    setFeedbackMessage(option.feedback || (option.correct ? 'Correct!' : 'Incorrect. Try again.'));
    setFeedbackType(option.correct ? 'success' : 'error');
    
    // Simulate thinking
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
            'UnifiedCalculationInterface'
          );
          
          // Use Chamber Pattern for animation
          highlightElements();
          
          // Proceed to next stage after delay
          setTimeout(() => {
            if (isMountedRef.current) {
              setShowFeedback(false);
              setSelectedAnswer(null);
              
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
            'UnifiedCalculationInterface'
          );
          
          // For incorrect answers, clear after delay
          setTimeout(() => {
            if (isMountedRef.current) {
              setShowFeedback(false);
              setSelectedAnswer(null);
            }
          }, 1500);
        }
      }
    }, 800); // Brief "thinking" delay
    
  }, [currentStage, educationalSteps.length, submitted, highlightElements, isMountedRef]);
  
  // Handle calculation submission - Chamber Pattern principle #2
  const handleCalculationSubmit = useCallback(() => {
    if (!isMountedRef.current || submitted) return;
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
    
    setShowFeedback(true);
    
    // Simulate checking the work
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
            'UnifiedCalculationInterface'
          );
          
          // Use Chamber Pattern for animation
          highlightElements();
          
          // Proceed to next stage after delay
          setTimeout(() => {
            if (isMountedRef.current) {
              setShowFeedback(false);
              setUserAnswer('');
              
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
            'UnifiedCalculationInterface'
          );
          
          // For incorrect answers, clear after delay
          setTimeout(() => {
            if (isMountedRef.current) {
              setShowFeedback(false);
            }
          }, 1500);
        }
      }
    }, 800); // Slight delay to simulate checking
    
  }, [currentStage, educationalSteps.length, submitted, userAnswer, currentEducationalStep, highlightElements, isMountedRef]);
  
  // Handle completion of all stages - Chamber Pattern principle #2
  const handleCompletion = useCallback(() => {
    if (!isMountedRef.current || submitted) return;
    
    setSubmitted(true);
    
    // Find expected solution
    const targetSolution = content.solutions?.find((s: any) => s.isValid);
    
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
      'UnifiedCalculationInterface'
    );
    
    // Apply final animation before completion
    highlightElements();
    
    setTimeout(() => {
      if (isMountedRef.current) {
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
    content.solutions, content.id, content.conceptId, 
    stageCompleted, educationalSteps.length, momentum, hintUsed,
    characterId, stageId, onComplete, highlightElements, submitted, isMountedRef
  ]);
  
  // Show hint
  const handleShowHint = useCallback(() => {
    if (!isMountedRef.current) return;
    
    setHintUsed(true);
    setShowHint(!showHint);
  }, [showHint, isMountedRef]);
  
  // Enhanced rendering of variables with color-coded distinct styling - Chamber Pattern principle #2
  const renderRelevantVariables = useCallback(() => {
    if (!currentEducationalStep) return null;
    if (currentEducationalStep.type !== 'CALCULATION_EXECUTION') return null;
    
    const relevantVariables = content.formula.variables.filter((v: any) => v.isInput && !v.isTarget);
    
    // Color mapping for different parameter types
    const getColorForParam = (paramId: string) => {
      const colorMap: Record<string, string> = {
        'dose': 'text-amber-300',
        'calibration': 'text-amber-200',
        'tpr': 'text-amber-300',
        'scatter': 'text-amber-200',
        'output_factor': 'text-amber-300'
      };
      
      return colorMap[paramId] || 'text-amber-300';
    };
    
    return (
      <div className="my-4 p-3 bg-amber-950/30 border border-amber-800/60 rounded">
        <PixelText className="mb-3 text-sm font-medium uppercase tracking-wider text-amber-400 border-b border-amber-900/50 pb-1">
          Calculation Parameters
        </PixelText>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {relevantVariables.map((variable: any) => (
            <div 
              key={variable.id} 
              className={`
                flex flex-col justify-center items-center p-2 
                bg-amber-950/60 rounded-md 
                border ${activeHighlight === variable.id ? 'border-amber-500/70' : 'border-amber-900/60'} 
                hover:border-amber-700/80 transition-colors shadow-inner
                ${activeHighlight === variable.id ? 'ring-2 ring-amber-500/30' : ''}
              `}
              onMouseEnter={() => handleParameterHover(variable.id)}
              onMouseLeave={handleParameterLeave}
            >
              <PixelText className={`text-sm font-medium ${getColorForParam(variable.id)} mb-1`}>
                {variable.label}
              </PixelText>
              <div className="flex items-baseline">
                <span className={`text-xl font-mono font-semibold ${getColorForParam(variable.id)}`}>
                  {inputValues[variable.id] !== null ? inputValues[variable.id] : '—'}
                </span>
                {variable.unit && (
                  <span className="ml-1 text-xs text-amber-500/70 font-normal">
                    {variable.unit}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-3 pt-2 border-t border-amber-800/40">
          <PixelText className="text-xs text-amber-400 italic">
            Use these values in the formula: 
            <span className="font-mono text-amber-300 font-medium ml-1">
              MU = Dose / (Cal × TPR × Scatter)
            </span>
          </PixelText>
        </div>
      </div>
    );
  }, [
    currentEducationalStep, content.formula.variables, inputValues, 
    activeHighlight, handleParameterHover, handleParameterLeave
  ]);
  
  // Progress indicators for bottom of interface
  const ProgressIndicators = () => (
    <div className="flex space-x-1 items-center">
      <div className="flex space-x-1">
        {educationalSteps.map((step: any, index: number) => (
          <div 
            key={index}
            className={`h-1 w-3 rounded-sm ${
              index === currentStage
                ? themeClasses.text
                : stageCompleted[index]
                  ? 'bg-green-500/70'
                  : 'bg-amber-800/30'
            }`}
            style={index === currentStage ? { backgroundColor: themeClasses.accent } : undefined}
          ></div>
        ))}
      </div>
    </div>
  );
  
  // Render the unified calculation interface
  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, y: 0 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 0 }}
      transition={{ duration: 0.3 }}
      className="border-amber-700/70 bg-black/90 border-2 rounded-md overflow-hidden"
      style={{ marginTop: -1 }}
    >
      {/* Extension header - only show if we have a meaningful title */}
      <ExtensionHeader 
        title={title || "Calculation"} 
        extensionType="calculation"
        characterId={characterId}
        hideTitle={!title || title === "Calculation" || title === "Challenge"}
      />
      
      {/* Main calculation area */}
      <div className="p-3">
        {/* Calculation parameters */}
        {currentEducationalStep && currentEducationalStep.type === 'CALCULATION_EXECUTION' && renderRelevantVariables()}
        
        {/* Current question */}
        {currentEducationalStep && !showFeedback && !isThinking && (
          <div className="mb-4">
            <PixelText className="text-amber-50">
              {currentEducationalStep.prompt}
            </PixelText>
          </div>
        )}
        
        {/* Thinking indicator */}
        {isThinking && (
          <div className="text-amber-400 py-3">
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
            <PixelText>
              {feedbackMessage}
            </PixelText>
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
                  className="bg-amber-950/60 border border-amber-800/70 rounded-md p-2 flex-1 font-mono text-white"
                  step="any"
                  placeholder={`Your answer${targetVariable?.unit ? ` (${targetVariable.unit})` : ''}`}
                  disabled={submitted}
                />
                <PixelButton
                  onClick={handleCalculationSubmit}
                  variant="primary"
                  disabled={submitted || !userAnswer}
                >
                  Submit
                </PixelButton>
              </div>
            ) : currentEducationalStep.options ? (
              <div className="space-y-2">
                {currentEducationalStep.options.map((option: any, index: number) => (
                  <div 
                    key={index}
                    onClick={() => !submitted && handleOptionSelect(option, index)}
                    className="cursor-pointer"
                  >
                    <div
                      className={`w-full p-2 transition-colors rounded-md ${
                        selectedAnswer === index 
                          ? (option.correct ? 'bg-green-900/80 border border-green-800' : 'bg-red-900/80 border border-red-800')
                          : 'bg-amber-950/60 border border-amber-800/50 hover:bg-amber-900/70 hover:border-amber-700'
                      }`}
                    >
                      <PixelText className={selectedAnswer === index 
                          ? (option.correct ? 'text-green-100' : 'text-red-100')
                          : 'text-amber-100'
                        }>
                        {option.text}
                      </PixelText>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        )}
        
        {/* Hint section */}
        {!showFeedback && currentEducationalStep?.hint && !isThinking && (
          <div className="mt-3 text-right">
            <PixelButton
              onClick={handleShowHint}
              variant="default"
              className="text-sm text-amber-400 hover:text-amber-300"
              disabled={submitted}
            >
              {showHint ? "Hide hint" : "Need a hint?"}
            </PixelButton>
            
            {showHint && (
              <div className="mt-2 p-2 text-sm text-amber-400 italic text-left bg-amber-950/30 border border-amber-900/40 rounded">
                {currentEducationalStep.hint}
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Extension footer with progress indicators */}
      <ExtensionFooter extensionType="calculation">
        <ProgressIndicators />
      </ExtensionFooter>
      
      {/* Add animations and styles */}
      <style jsx>{`
        .extension-success {
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
    </motion.div>
  );
};

export default UnifiedExtensionContainer; 