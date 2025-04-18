'use client';

/**
 * Equipment Identification Interface Extension - Simplified
 * 
 * Provides a simple interactive interface for identifying equipment components.
 * Uses a static background image with clickable boxes positioned over components.
 */

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { PixelText, PixelButton, PixelBox } from '../../PixelThemeProvider';
import { usePrimitiveStoreValue, useStableCallback } from '../../../core/utils/storeHooks';
import { ExtensionResult } from '../VisualExtender';
import { safeDispatch } from '../../../core/events/CentralEventBus';
import { GameEventType } from '../../../core/events/EventTypes';
import { useResourceStore } from '../../../store/resourceStore';
import { getExtensionClasses } from '../../../utils/themeUtils';

// Simplified interface definitions
interface EquipmentComponent {
  id: string;
  name: string;
  description: string;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  isCritical: boolean;
  order?: number;
}

interface IdentificationStep {
  id: string;
  type: 'COMPONENT_IDENTIFICATION' | 'FUNCTION_DESCRIPTION' | 'CLINICAL_APPLICATION';
  prompt: string;
  kapoorText?: string; // Character dialogue
  options?: {
    text: string;
    correct: boolean;
    feedback?: string;
  }[];
  component?: string; // ID of component to identify
  hint?: string;
}

interface EquipmentContent {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  imageWidth: number;
  imageHeight: number;
  conceptId: string;
  difficulty: 'easy' | 'medium' | 'hard';
  domain: string;
  components: EquipmentComponent[];
  educationalSteps?: IdentificationStep[];
}

interface EquipmentIdentificationInterfaceProps {
  content: EquipmentContent;
  characterId: string;
  stageId: string;
  additionalProps?: Record<string, any>;
  onComplete: (result: ExtensionResult) => void;
}

/**
 * Simplified Equipment Identification Interface Component
 */
const EquipmentIdentificationInterface: React.FC<EquipmentIdentificationInterfaceProps> = ({
  content,
  characterId,
  stageId,
  additionalProps,
  onComplete
}) => {
  // Mount tracking ref
  const isMountedRef = useRef(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  
  // Component state
  const [currentStage, setCurrentStage] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [selectedComponent, setSelectedComponent] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [feedbackType, setFeedbackType] = useState<'success' | 'error'>('success');
  const [stageCompleted, setStageCompleted] = useState<boolean[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [hintUsed, setHintUsed] = useState(false);
  const [scale, setScale] = useState(1);
  
  // Get theming classes
  const themeClasses = getExtensionClasses('equipment-identification');
  
  // Get momentum and insight from store as primitives
  const momentum = usePrimitiveStoreValue(useResourceStore, state => (state as any).momentum, 0);
  const insight = usePrimitiveStoreValue(useResourceStore, state => (state as any).insight, 0);
  
  // Calculate scale based on container width
  useEffect(() => {
    const updateScale = () => {
      if (imageContainerRef.current && containerRef.current) {
        const containerWidth = containerRef.current.clientWidth - 40; // Subtract padding
        const maxWidth = Math.min(containerWidth, 512); // Cap at 512px
        const newScale = maxWidth / content.imageWidth;
        setScale(newScale);
      }
    };
    
    // Initial calculation
    updateScale();
    
    // Add resize listener
    window.addEventListener('resize', updateScale);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', updateScale);
    };
  }, [content.imageWidth]);
  
  // Generate character-driven educational steps if not provided
  const educationalSteps = useMemo(() => {
    // If content has predefined educational steps, use those
    if (content.educationalSteps && content.educationalSteps.length > 0) {
      return content.educationalSteps;
    }
    
    // Otherwise, generate default educational steps
    const criticalComponents = content.components.filter(c => c.isCritical);
    
    const defaultSteps: IdentificationStep[] = [
      {
        id: 'overview',
        type: 'COMPONENT_IDENTIFICATION',
        kapoorText: "Let's start by identifying the key components. Recognizing equipment is essential for effective clinical practice.",
        prompt: `What are the main components of the ${content.title}?`,
        options: [
          { 
            text: criticalComponents.map(c => c.name).join(', '),
            correct: true,
            feedback: "Correct. Understanding the key components is the first step to mastery."
          },
          { 
            text: criticalComponents.slice(0, Math.max(1, Math.floor(criticalComponents.length / 2))).map(c => c.name).join(', '),
            correct: false,
            feedback: "That's incomplete. There are more critical components you need to identify."
          },
          { 
            text: [...criticalComponents.slice(0, 1).map(c => c.name), "auxiliary power unit", "vertical stabilizer"].join(', '),
            correct: false,
            feedback: "That's not accurate. Some of those components aren't part of this equipment."
          }
        ],
        hint: "Examine the image carefully and look for the major structural elements."
      },
      ...criticalComponents.map((component): IdentificationStep => ({
        id: `identify-${component.id}`,
        type: 'COMPONENT_IDENTIFICATION',
        kapoorText: `Now, please locate the ${component.name} in the diagram. This component is critical to understand.`,
        prompt: `Click on the ${component.name} in the diagram`,
        component: component.id,
        hint: component.description
      })),
      {
        id: 'function-understanding',
        type: 'FUNCTION_DESCRIPTION',
        kapoorText: "Now that you can identify the components, let's discuss their function.",
        prompt: "What is the primary function of this equipment in radiation therapy?",
        options: [
          { 
            text: content.id.includes('linac') 
              ? "To accelerate electrons and produce high-energy X-rays for treating cancer" 
              : "To measure radiation dose accurately for treatment planning and quality assurance",
            correct: true,
            feedback: "Correct. Understanding the function is essential for clinical application."
          },
          { 
            text: "To provide structural support for the patient during treatment",
            correct: false,
            feedback: "That's incorrect. While patient support is important, it's not the primary function of this device."
          },
          { 
            text: "To generate imaging for treatment guidance",
            correct: false,
            feedback: "That's not the primary function, although some of these systems may have imaging capabilities."
          }
        ],
        hint: "Think about the role this equipment plays in the radiation therapy workflow."
      },
      {
        id: 'clinical-application',
        type: 'CLINICAL_APPLICATION',
        kapoorText: "Let's connect this to clinical practice. Understanding the application is crucial for patient care.",
        prompt: "How does proper identification of these components impact clinical practice?",
        options: [
          { 
            text: "It enables proper quality assurance, troubleshooting, and effective communication with technical staff",
            correct: true,
            feedback: "Excellent. Now you're thinking like a clinical professional."
          },
          { 
            text: "It's primarily important for regulatory documentation",
            correct: false,
            feedback: "While documentation matters, the clinical impact goes far beyond paperwork to directly affect patient care."
          },
          { 
            text: "It mainly helps with understanding historical equipment evolution",
            correct: false,
            feedback: "The historical context is interesting, but the immediate clinical application is much more important."
          }
        ],
        hint: "Consider how equipment knowledge translates to clinical decisions and communication."
      }
    ];
    
    return defaultSteps;
  }, [content.educationalSteps, content.components, content.title, content.id]);
  
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
  
  // Handle option selection for multiple choice stages
  const handleOptionSelect = useCallback((option: any, index: number) => {
    if (!isMountedRef.current || submitted) return;
    
    setSelectedAnswer(index);
    setShowFeedback(true);
    setFeedbackMessage(option.feedback || (option.correct ? 'Correct!' : 'Incorrect. Try again.'));
    setFeedbackType(option.correct ? 'success' : 'error');
    
    setTimeout(() => {
      if (isMountedRef.current) {
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
            'EquipmentIdentificationInterface'
          );
          
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
          }, 1000);
        } else {
          // Apply momentum effect for incorrect answer
          safeDispatch(
            GameEventType.RESOURCE_CHANGED,
            {
              resourceType: 'momentum',
              changeType: 'reset'
            },
            'EquipmentIdentificationInterface'
          );
          
          // For incorrect answers, clear after delay
          setTimeout(() => {
            if (isMountedRef.current) {
              setShowFeedback(false);
              setSelectedAnswer(null);
            }
          }, 1000);
        }
      }
    }, 500);
    
  }, [currentStage, educationalSteps.length, submitted]);
  
  // Handle component click during identification stages
  const handleComponentClick = useCallback((componentId: string) => {
    if (!isMountedRef.current || submitted) return;
    if (!currentEducationalStep?.component) return;
    
    setSelectedComponent(componentId);
    setShowFeedback(true);
    
    // Check if the clicked component is the correct one
    const isCorrect = componentId === currentEducationalStep.component;
    
    setFeedbackMessage(isCorrect 
      ? `Correct! You've identified the ${content.components.find(c => c.id === componentId)?.name}.`
      : `That's not the ${content.components.find(c => c.id === currentEducationalStep.component)?.name}. Try again.`
    );
    setFeedbackType(isCorrect ? 'success' : 'error');
    
    setTimeout(() => {
      if (isMountedRef.current) {
        // Update stage completion if correct
        if (isCorrect) {
          setStageCompleted(prev => {
            const updated = [...prev];
            updated[currentStage] = true;
            return updated;
          });
          
          // Apply momentum effect for correct identification
          safeDispatch(
            GameEventType.RESOURCE_CHANGED,
            {
              resourceType: 'momentum',
              changeType: 'increment'
            },
            'EquipmentIdentificationInterface'
          );
          
          // Proceed to next stage after delay
          setTimeout(() => {
            if (isMountedRef.current) {
              setShowFeedback(false);
              setSelectedComponent(null);
              
              // Move to next stage if this one is completed
              if (currentStage < educationalSteps.length - 1) {
                setCurrentStage(prev => prev + 1);
              } else {
                // All stages completed
                handleCompletion();
              }
            }
          }, 1000);
        } else {
          // Apply momentum effect for incorrect identification
          safeDispatch(
            GameEventType.RESOURCE_CHANGED,
            {
              resourceType: 'momentum',
              changeType: 'reset'
            },
            'EquipmentIdentificationInterface'
          );
          
          // For incorrect answers, clear after delay
          setTimeout(() => {
            if (isMountedRef.current) {
              setShowFeedback(false);
              setSelectedComponent(null);
            }
          }, 1000);
        }
      }
    }, 500);
    
  }, [currentStage, educationalSteps.length, submitted, currentEducationalStep, content.components]);
  
  // Handle completion of all stages
  const handleCompletion = useCallback(() => {
    if (!isMountedRef.current || submitted) return;
    
    setSubmitted(true);
    
    // Calculate metrics based on performance
    const stagesCompleted = stageCompleted.filter(Boolean).length;
    const totalStages = educationalSteps.length;
    const accuracy = Math.min(1, stagesCompleted / totalStages);
    
    // Base insight with various multipliers
    const baseInsight = content.difficulty === 'easy' ? 10 : (content.difficulty === 'medium' ? 15 : 20);
    const insightMultiplier = 1 + (momentum * 0.2); // 20% bonus per momentum level
    const hintPenalty = hintUsed ? 0.8 : 1.0; // 20% reduction if hints used
    const insightGained = Math.round(baseInsight * accuracy * insightMultiplier * hintPenalty);
    
    // Determine momentum effect
    const momentumEffect = accuracy > 0.7 ? 'increment' : (accuracy > 0.3 ? 'maintain' : 'reset');
    
    // Track equipment identification completion
    safeDispatch(
      GameEventType.EXTENSION_INTERACTION,
      {
        type: 'equipment_identification',
        contentId: content.id,
        characterId,
        stageId,
        accuracy,
        hintUsed
      },
      'EquipmentIdentificationInterface'
    );
    
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
    }, 1000);
  }, [
    submitted,
    stageCompleted,
    educationalSteps.length,
    momentum,
    hintUsed,
    content.difficulty,
    content.id,
    content.conceptId,
    characterId,
    stageId,
    onComplete
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
  
  // Render the simplified equipment image with clickable areas
  const renderEquipmentImage = useCallback(() => {
    if (!content.imageUrl) return null;
    
    const scaledWidth = Math.round(content.imageWidth * scale);
    const scaledHeight = Math.round(content.imageHeight * scale);
    
    return (
      <div 
        ref={imageContainerRef}
        className="relative mb-4 rounded-md overflow-hidden"
        style={{ 
          width: scaledWidth, 
          height: scaledHeight,
          maxWidth: '100%',
          margin: '0 auto',
          position: 'relative'
        }}
      >
        {/* Base image - always visible */}
        <img
          src={content.imageUrl}
          alt={content.title}
          style={{ 
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            imageRendering: 'pixelated'
          }}
        />
        
        {/* Interactive clickable areas - now invisible */}
        {content.components.map(comp => (
          <div 
            key={`clickable-${comp.id}`}
            style={{
              position: 'absolute',
              left: `${comp.position.x * scale}px`,
              top: `${comp.position.y * scale}px`,
              width: `${comp.position.width * scale}px`,
              height: `${comp.position.height * scale}px`,
              zIndex: 20,
              border: selectedComponent === comp.id 
                ? `3px solid ${feedbackType === 'success' ? 'rgba(34, 197, 94, 0.8)' : 'rgba(239, 68, 68, 0.8)'}`
                : 'none', // Remove border unless selected
              borderRadius: '3px',
              cursor: 'pointer',
              backgroundColor: selectedComponent === comp.id 
                ? (feedbackType === 'success' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)') 
                : 'transparent', // Transparent background unless selected
              transition: 'all 0.2s ease'
            }}
            onClick={() => handleComponentClick(comp.id)}
          >
            {/* Remove component name display */}
          </div>
        ))}
      </div>
    );
  }, [
    content.components, 
    content.imageHeight, 
    content.imageUrl, 
    content.imageWidth, 
    content.title,
    selectedComponent,
    feedbackType,
    handleComponentClick,
    scale
  ]);
  
  // Render the overall interface
  return (
    <div ref={containerRef} className="equipment-identification-container">
      <PixelBox
        variant={themeClasses.variant as any}
        className="text-white overflow-hidden"
        bordered
      >
        {/* Main identification area */}
        <div className="p-3">
          {/* Equipment diagram */}
          {renderEquipmentImage()}
          
          {/* Current question */}
          {currentEducationalStep && !showFeedback && (
            <div className="mb-4">
              <PixelText className="text-blue-50">
                {currentEducationalStep.prompt}
              </PixelText>
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
          
          {/* Multiple choice options for non-identification stages */}
          {!showFeedback && currentEducationalStep && 
           currentEducationalStep.type !== 'COMPONENT_IDENTIFICATION' && 
           currentEducationalStep.options && (
            <div className="space-y-2 mt-2">
              {currentEducationalStep.options.map((option, index) => (
                <div 
                  key={index}
                  onClick={() => !submitted && handleOptionSelect(option, index)}
                  className="cursor-pointer"
                >
                  <PixelBox
                    variant="dark"
                    className={`w-full p-2 transition-colors ${
                      selectedAnswer === index 
                        ? (option.correct ? 'bg-green-900/80 border-green-800' : 'bg-red-900/80 border-red-800')
                        : 'bg-blue-950/60 border-blue-800/50 hover:bg-blue-900/70 hover:border-blue-700'
                    }`}
                    bordered
                  >
                    <PixelText className={selectedAnswer === index 
                        ? (option.correct ? 'text-green-100' : 'text-red-100')
                        : 'text-blue-100'
                      }>
                      {option.text}
                    </PixelText>
                  </PixelBox>
                </div>
              ))}
            </div>
          )}
          
          {/* Hint section */}
          {!showFeedback && currentEducationalStep?.hint && (
            <div className="mt-3 text-right">
              <PixelButton
                onClick={handleShowHint}
                variant="default"
                className="text-sm text-blue-400 hover:text-blue-300"
                disabled={submitted}
              >
                {showHint ? "Hide hint" : "Need a hint?"}
              </PixelButton>
              
              {showHint && (
                <PixelBox variant="dark" className="mt-2 p-2 text-sm text-blue-400 italic text-left bg-blue-950/30 border-blue-900/40">
                  {currentEducationalStep.hint}
                </PixelBox>
              )}
            </div>
          )}
        </div>
        
        {/* Simple progress indicator at the bottom */}
        <div className="bg-blue-950/50 px-3 py-1 border-t border-blue-900/50 flex justify-between items-center text-xs text-blue-600">
          <div className="flex space-x-1 items-center">
            <div className="flex space-x-1">
              {educationalSteps.map((_, index) => (
                <div 
                  key={index}
                  className={`h-1 w-3 rounded-sm ${
                    index === currentStage
                      ? themeClasses.text
                      : stageCompleted[index]
                        ? 'bg-green-500/70'
                        : 'bg-blue-800/30'
                  }`}
                  style={index === currentStage ? { backgroundColor: themeClasses.accent } : undefined}
                ></div>
              ))}
            </div>
          </div>
        </div>
      </PixelBox>
    </div>
  );
};

export default EquipmentIdentificationInterface; 