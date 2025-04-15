// app/components/extensions/types/EquipmentIdentification.tsx
'use client';

/**
 * Equipment Identification Extension
 * 
 * Allows users to identify and interact with medical physics equipment components.
 * Implements Chamber Pattern for performance optimization.
 */

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PixelText, PixelButton } from '../../PixelThemeProvider';
import { usePrimitiveStoreValue, useStableCallback } from '../../../core/utils/storeHooks';
import { ExtensionResult } from '../VisualExtender';
import { safeDispatch } from '../../../core/events/CentralEventBus';
import { GameEventType } from '../../../core/events/EventTypes';

interface EquipmentComponent {
  id: string;
  name: string;
  description: string;
  position: { x: number; y: number; width: number; height: number };
  isCritical: boolean;
  order?: number; // If there's a specific sequence for identification
}

interface EquipmentIdentificationContent {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  imageWidth: number;
  imageHeight: number;
  components: EquipmentComponent[];
  conceptId: string;
  difficulty: 'easy' | 'medium' | 'hard';
  domain: string;
  sequenceRequired?: boolean; // Whether components must be identified in a specific order
  hint?: string;
}

interface EquipmentIdentificationProps {
  content: EquipmentIdentificationContent;
  characterId: string;
  stageId: string;
  additionalProps?: Record<string, any>;
  onComplete: (result: ExtensionResult) => void;
}

/**
 * Equipment Identification Component
 * 
 * Provides an interactive interface for identifying equipment components
 */
const EquipmentIdentification: React.FC<EquipmentIdentificationProps> = ({
  content,
  characterId,
  stageId,
  additionalProps,
  onComplete
}) => {
  // Mount tracking ref
  const isMountedRef = useRef(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  
  // Component state
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null);
  const [identifiedComponents, setIdentifiedComponents] = useState<string[]>([]);
  const [showHint, setShowHint] = useState(false);
  const [hintUsed, setHintUsed] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Animation state
  const [animating, setAnimating] = useState(false);
  
  // Load image
  useEffect(() => {
    if (!isMountedRef.current) return;
    
    const img = new Image();
    img.src = content.imageUrl;
    
    img.onload = () => {
      if (!isMountedRef.current) return;
      
      imageRef.current = img;
      setLoading(false);
    };
    
    img.onerror = () => {
      if (!isMountedRef.current) return;
      
      setLoading(false);
      setFeedbackMessage('Error loading equipment image');
    };
    
    return () => {
      // Clean up image reference
      imageRef.current = null;
    };
  }, [content.imageUrl]);
  
  // Handle component click
  const handleComponentClick = useCallback((componentId: string) => {
    if (!isMountedRef.current || submitted) return;
    
    // Check if it's already identified
    if (identifiedComponents.includes(componentId)) {
      setSelectedComponentId(componentId);
      return;
    }
    
    const component = content.components.find(c => c.id === componentId);
    if (!component) return;
    
    // Check if we need to follow sequence
    if (content.sequenceRequired && component.order) {
      // Get expected next component in sequence
      const expectedNextOrder = identifiedComponents.length + 1;
      
      if (component.order !== expectedNextOrder) {
        setFeedbackMessage(`Incorrect sequence. You need to identify components in the proper order.`);
        return;
      }
    }
    
    // Mark component as identified
    setIdentifiedComponents(prev => [...prev, componentId]);
    setSelectedComponentId(componentId);
    
    // Show feedback
    setFeedbackMessage(`Identified: ${component.name}`);
  }, [content.components, content.sequenceRequired, identifiedComponents, submitted]);
  
  // Handle image map click for regions
  const handleImageClick = useCallback((e: React.MouseEvent<HTMLImageElement>) => {
    if (!isMountedRef.current || submitted || !imageRef.current) return;
    
    // Get click coordinates relative to image
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width * content.imageWidth;
    const y = (e.clientY - rect.top) / rect.height * content.imageHeight;
    
    // Check if click is within any component region
    let foundComponent = false;
    
    for (const component of content.components) {
      const { position } = component;
      
      if (
        x >= position.x && 
        x <= position.x + position.width &&
        y >= position.y && 
        y <= position.y + position.height
      ) {
        handleComponentClick(component.id);
        foundComponent = true;
        break;
      }
    }
    
    if (!foundComponent) {
      setFeedbackMessage('No component identified at this location.');
      setSelectedComponentId(null);
    }
  }, [content.components, content.imageWidth, content.imageHeight, handleComponentClick, submitted]);
  
  // Toggle hint
  const handleToggleHint = useCallback(() => {
    if (!isMountedRef.current || submitted) return;
    
    // Track hint usage
    if (!hintUsed) {
      setHintUsed(true);
      
      // Log hint usage
      safeDispatch(
        GameEventType.EXTENSION_HINT_USED,
        {
          type: 'equipment-identification',
          contentId: content.id,
          characterId,
          stageId
        },
        'EquipmentIdentification'
      );
    }
    
    // Toggle hint visibility
    setShowHint(prev => !prev);
    
    // Show hint message
    if (!showHint) {
      setFeedbackMessage(content.hint || 'Look for highlighted components and identify them in the proper sequence.');
    } else {
      setFeedbackMessage(null);
    }
  }, [
    content.hint, 
    content.id, 
    hintUsed, 
    showHint, 
    submitted,
    characterId,
    stageId
  ]);
  
  // Handle submission
  const handleSubmit = useCallback(() => {
    if (!isMountedRef.current || submitted) return;
    
    try {
      setSubmitted(true);
      
      // Calculate results
      const totalComponents = content.components.length;
      const criticalComponents = content.components.filter(c => c.isCritical).length;
      
      const identifiedCount = identifiedComponents.length;
      const identifiedCriticalCount = content.components
        .filter(c => c.isCritical && identifiedComponents.includes(c.id))
        .length;
      
      // Calculate accuracy scores
      const overallScore = totalComponents > 0 ? identifiedCount / totalComponents : 0;
      const criticalScore = criticalComponents > 0 ? identifiedCriticalCount / criticalComponents : 1;
      
      // Weight critical components more heavily
      const accuracyScore = criticalComponents > 0 
        ? (overallScore * 0.4) + (criticalScore * 0.6)
        : overallScore;
      
      // Determine success (must identify all critical components and 70% overall)
      const isSuccess = criticalScore === 1 && overallScore >= 0.7;
      
      // Calculate insight reward based on difficulty and accuracy
      const difficultyMultiplier = 
        content.difficulty === 'easy' ? 1 :
        content.difficulty === 'medium' ? 1.5 :
        2; // hard
      
      const hintPenalty = hintUsed ? 0.7 : 1;
      const baseInsight = isSuccess ? 15 : Math.floor(15 * 0.4);
      const adjustedInsight = Math.floor(baseInsight * accuracyScore * difficultyMultiplier * hintPenalty);
      
      // Determine momentum effect based on success/failure
      const momentumEffect = isSuccess ? 'increment' : criticalScore < 1 ? 'reset' : 'maintain';
      
      // Prepare knowledge gained if successful
      const knowledgeGained = isSuccess ? {
        conceptId: content.conceptId,
        amount: Math.ceil(10 * accuracyScore * difficultyMultiplier * hintPenalty)
      } : undefined;
      
      // Set feedback message
      if (isSuccess) {
        setFeedbackMessage(`Great! You identified ${identifiedCount} out of ${totalComponents} components, including all critical ones.`);
      } else if (criticalScore < 1) {
        setFeedbackMessage(`You missed some critical components. The highlighted components are essential for proper operation.`);
      } else {
        setFeedbackMessage(`You identified ${identifiedCount} out of ${totalComponents} components. Try to be more thorough next time.`);
      }
      
      // Animation and dispatch events before completing
      setAnimating(true);
      
      // Dispatch completion event
      safeDispatch(
        GameEventType.EXTENSION_INTERACTION,
        {
          type: 'equipment-identification',
          contentId: content.id,
          success: isSuccess,
          accuracy: accuracyScore,
          difficulty: content.difficulty,
          identifiedCount,
          totalComponents,
          characterId,
          stageId
        },
        'EquipmentIdentification'
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
            identifiedCount,
            totalComponents,
            criticalScore,
            overallScore,
            difficulty: content.difficulty,
            hintUsed
          }
        });
      }, 2000);
    } catch (error) {
      console.error('Error submitting identification:', error);
      
      // Fallback completion
      onComplete({
        success: false,
        accuracy: 0,
        insightGained: 0,
        momentumEffect: 'maintain'
      });
    }
  }, [
    content.components, 
    content.conceptId, 
    content.difficulty, 
    content.id, 
    hintUsed, 
    identifiedComponents, 
    onComplete, 
    submitted,
    characterId,
    stageId
  ]);
  
  // Component list for UI
  const componentList = useMemo(() => {
    return content.components.map(component => ({
      ...component,
      isIdentified: identifiedComponents.includes(component.id),
      isSelected: selectedComponentId === component.id
    })).sort((a, b) => {
      // Sort by identified status first, then by order if available
      if (a.isIdentified !== b.isIdentified) {
        return a.isIdentified ? -1 : 1;
      }
      return (a.order || 0) - (b.order || 0);
    });
  }, [content.components, identifiedComponents, selectedComponentId]);
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  
  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center w-full h-48 bg-black/50 rounded-md p-4">
        <div className="loading-spinner" />
        <p className="ml-3 text-gray-300">Loading equipment image...</p>
      </div>
    );
  }
  
  return (
    <div 
      ref={containerRef}
      className="equipment-identification bg-black/80 border border-blue-900/50 rounded-md p-4"
    >
      {/* Title and description */}
      <div className="mb-4">
        <h3 className="text-blue-300 text-lg mb-1">{content.title}</h3>
        <p className="text-gray-300 text-sm">{content.description}</p>
      </div>
      
      {/* Main content area with image and controls */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* Interactive equipment image */}
        <div className="flex-1 bg-black/70 border border-blue-900/30 rounded p-2">
          {/* Image controls */}
          <div className="flex justify-end mb-2">
            <button
              onClick={handleToggleHint}
              className={`px-2 py-1 rounded text-sm text-white ${showHint ? 'bg-yellow-600' : 'bg-blue-900/50'}`}
              disabled={submitted}
            >
              {showHint ? 'Hide Hint' : 'Show Hint'}
            </button>
          </div>
          
          {/* Equipment image with interactive regions */}
          <div className="relative bg-black/80 rounded overflow-hidden" style={{ maxWidth: '100%' }}>
            {/* Main image */}
            <img 
              src={content.imageUrl}
              alt={content.title}
              className="max-w-full h-auto block mx-auto"
              onClick={handleImageClick}
              style={{ cursor: submitted ? 'default' : 'pointer' }}
            />
            
            {/* Overlay for component highlights */}
            <div className="absolute inset-0 pointer-events-none">
              {content.components.map(component => {
                const isIdentified = identifiedComponents.includes(component.id);
                const isSelected = selectedComponentId === component.id;
                const showInHint = showHint && component.isCritical && !isIdentified;
                
                const highlightStyle = {
                  left: `${(component.position.x / content.imageWidth) * 100}%`,
                  top: `${(component.position.y / content.imageHeight) * 100}%`,
                  width: `${(component.position.width / content.imageWidth) * 100}%`,
                  height: `${(component.position.height / content.imageHeight) * 100}%`,
                };
                
                return (
                  <div
                    key={component.id}
                    className={`absolute border-2 rounded transition-all duration-200 ${
                      isIdentified ? 'border-green-500/70 bg-green-500/20' :
                      isSelected ? 'border-blue-500/70 bg-blue-500/20' :
                      showInHint ? 'border-yellow-500/70 bg-yellow-500/20 animate-pulse' :
                      submitted ? 'border-red-500/70 bg-red-500/20' : 'border-transparent'
                    }`}
                    style={highlightStyle}
                  >
                    {(isIdentified || submitted) && (
                      <div className="absolute top-0 left-0 right-0 bg-black/70 text-xs p-1 text-center overflow-hidden text-ellipsis whitespace-nowrap">
                        {component.name}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            
            {/* Instructions overlay */}
            {!submitted && identifiedComponents.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60 pointer-events-none">
                <p className="text-white text-center px-4">
                  Click on equipment components to identify them
                  {content.sequenceRequired && " in the correct sequence"}
                </p>
              </div>
            )}
          </div>
        </div>
        
        {/* Component list and details */}
        <div className="w-full md:w-64 bg-black/70 border border-blue-900/30 rounded p-2">
          <h4 className="text-blue-200 text-sm mb-2">Components:</h4>
          
          {/* List of components */}
          <div className="max-h-64 overflow-y-auto mb-4">
            <ul className="space-y-1">
              {componentList.map(component => (
                <li 
                  key={component.id}
                  className={`px-2 py-1 rounded text-sm cursor-pointer flex justify-between items-center
                    ${component.isIdentified ? 'text-white bg-blue-900/50' : (submitted ? 'text-red-300' : 'text-gray-400')}
                    ${component.isSelected ? 'border border-blue-400' : 'border border-transparent'}
                    ${component.isCritical && !component.isIdentified && submitted ? 'bg-red-900/30 border-red-500/50' : ''}
                    hover:bg-blue-900/20
                  `}
                  onClick={() => {
                    if (component.isIdentified || submitted) {
                      setSelectedComponentId(component.id);
                    }
                  }}
                >
                  <span>
                    {component.name}
                    {component.isCritical && !submitted && (
                      <span className="text-yellow-400 ml-1">*</span>
                    )}
                  </span>
                  
                  {component.isIdentified && (
                    <span className="text-green-400">✓</span>
                  )}
                  
                  {content.sequenceRequired && component.order && !submitted && (
                    <span className="text-xs text-gray-500 ml-1">{component.order}</span>
                  )}
                </li>
              ))}
            </ul>
            
            {!submitted && (
              <div className="mt-2 pt-2 border-t border-blue-900/30 text-xs text-gray-400">
                <p>* Indicates critical components</p>
                {content.sequenceRequired && <p>Numbers indicate required sequence</p>}
              </div>
            )}
          </div>
          
          {/* Selected component details */}
          {selectedComponentId && (
            <div className="mt-2 p-2 bg-blue-900/20 rounded">
              <h4 className="text-blue-200 text-sm font-bold">
                {content.components.find(c => c.id === selectedComponentId)?.name}
              </h4>
              <p className="text-gray-300 text-xs mt-1">
                {content.components.find(c => c.id === selectedComponentId)?.description}
              </p>
            </div>
          )}
        </div>
      </div>
      
      {/* Feedback message */}
      <AnimatePresence>
        {feedbackMessage && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="feedback-message mt-3 p-2 bg-blue-900/30 rounded text-sm text-white"
          >
            {feedbackMessage}
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Action buttons */}
      <div className="flex justify-between mt-4">
        <div>
          <span className="text-sm text-blue-300">
            Identified: {identifiedComponents.length}/{content.components.length}
          </span>
        </div>
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
          {submitted ? 'Continue' : 'Submit Identification'}
        </button>
      </div>
    </div>
  );
};

export default EquipmentIdentification;