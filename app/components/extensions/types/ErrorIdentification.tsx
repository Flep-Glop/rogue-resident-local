// app/components/extensions/types/ErrorIdentification.tsx
'use client';

/**
 * Error Identification Extension
 * 
 * Allows users to identify errors in medical physics setups, calculations or procedures.
 * Implements Chamber Pattern for performance optimization.
 */

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PixelText, PixelButton } from '../../PixelThemeProvider';
import { usePrimitiveStoreValue, useStableCallback } from '../../../core/utils/storeHooks';
import { ExtensionResult } from '../VisualExtender';
import { safeDispatch } from '../../../core/events/CentralEventBus';
import { GameEventType } from '../../../core/events/EventTypes';

interface ErrorItem {
  id: string;
  description: string;
  position?: { x: number; y: number; width: number; height: number };
  isCritical: boolean;
  hint?: string;
}

interface ErrorIdentificationContent {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  imageWidth: number;
  imageHeight: number;
  scenario: string;
  errors: ErrorItem[];
  conceptId: string;
  difficulty: 'easy' | 'medium' | 'hard';
  domain: string;
  timeLimit?: number; // Optional time limit in seconds
  hint?: string;
  correctMessage?: string;
  incorrectMessage?: string;
}

interface ErrorIdentificationProps {
  content: ErrorIdentificationContent;
  characterId: string;
  stageId: string;
  additionalProps?: Record<string, any>;
  onComplete: (result: ExtensionResult) => void;
}

/**
 * Error Identification Component
 * 
 * Provides an interactive interface for identifying errors in medical physics scenarios
 */
const ErrorIdentification: React.FC<ErrorIdentificationProps> = ({
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
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Component state
  const [identifiedErrors, setIdentifiedErrors] = useState<string[]>([]);
  const [selectedErrorId, setSelectedErrorId] = useState<string | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [hintUsed, setHintUsed] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Timer state for timed scenarios
  const [timeRemaining, setTimeRemaining] = useState<number | null>(
    content.timeLimit ? content.timeLimit : null
  );
  const [timerActive, setTimerActive] = useState(false);
  
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
      
      // Start timer if applicable
      if (content.timeLimit) {
        setTimerActive(true);
      }
    };
    
    img.onerror = () => {
      if (!isMountedRef.current) return;
      
      setLoading(false);
      setFeedbackMessage('Error loading scenario image');
    };
    
    return () => {
      // Clean up image reference
      imageRef.current = null;
    };
  }, [content.imageUrl, content.timeLimit]);
  
  // Timer effect
  useEffect(() => {
    if (!timerActive || timeRemaining === null) return;
    
    timerRef.current = setInterval(() => {
      if (!isMountedRef.current) return;
      
      setTimeRemaining(prev => {
        if (prev === null || prev <= 0) {
          clearInterval(timerRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [timerActive, timeRemaining]);
  
  // Auto-submit when time expires
  useEffect(() => {
    if (timeRemaining === 0 && !submitted) {
      handleSubmit();
    }
  }, [timeRemaining, submitted]);
  
  // Handle error selection
  const handleErrorSelect = useCallback((errorId: string) => {
    if (!isMountedRef.current || submitted) return;
    
    // Check if already identified
    if (identifiedErrors.includes(errorId)) {
      // Deselect error
      setIdentifiedErrors(prev => prev.filter(id => id !== errorId));
      if (selectedErrorId === errorId) {
        setSelectedErrorId(null);
      }
      setFeedbackMessage('Error deselected');
      return;
    }
    
    // Add to identified errors
    setIdentifiedErrors(prev => [...prev, errorId]);
    setSelectedErrorId(errorId);
    
    // Show feedback
    const error = content.errors.find(err => err.id === errorId);
    if (error) {
      setFeedbackMessage(`Identified: ${error.description}`);
    }
  }, [content.errors, identifiedErrors, selectedErrorId, submitted]);
  
  // Handle image click for errors with positions
  const handleImageClick = useCallback((e: React.MouseEvent<HTMLImageElement>) => {
    if (!isMountedRef.current || submitted || !imageRef.current) return;
    
    // Get click coordinates relative to image
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width * content.imageWidth;
    const y = (e.clientY - rect.top) / rect.height * content.imageHeight;
    
    // Check if click is within any error region
    let foundError = false;
    
    for (const error of content.errors) {
      if (!error.position) continue;
      
      const { position } = error;
      
      if (
        x >= position.x && 
        x <= position.x + position.width &&
        y >= position.y && 
        y <= position.y + position.height
      ) {
        handleErrorSelect(error.id);
        foundError = true;
        break;
      }
    }
    
    if (!foundError) {
      setFeedbackMessage('No error identified at this location');
    }
  }, [content.errors, content.imageWidth, content.imageHeight, handleErrorSelect, submitted]);
  
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
          type: 'error-identification',
          contentId: content.id,
          characterId,
          stageId
        },
        'ErrorIdentification'
      );
    }
    
    // Toggle hint visibility
    setShowHint(prev => !prev);
    
    // Show hint message
    if (!showHint) {
      setFeedbackMessage(content.hint || 'Look for discrepancies in the setup, calculations, or procedures');
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
      
      // Stop timer if active
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      // Calculate results
      const totalErrors = content.errors.length;
      const criticalErrors = content.errors.filter(e => e.isCritical).length;
      
      const identifiedCount = identifiedErrors.length;
      
      // Check for false positives (none in this scenario since all selections are valid errors)
      const falsePositives = 0;
      
      // Check for missed critical errors
      const identifiedCriticalCount = content.errors
        .filter(e => e.isCritical && identifiedErrors.includes(e.id))
        .length;
      
      // Calculate accuracy scores
      const overallIdentificationRate = totalErrors > 0 ? identifiedCount / totalErrors : 0;
      const criticalIdentificationRate = criticalErrors > 0 ? identifiedCriticalCount / criticalErrors : 1;
      
      // Weight critical errors more heavily, penalize false positives
      const accuracyScore = Math.max(0, 
        (overallIdentificationRate * 0.4) + 
        (criticalIdentificationRate * 0.6) - 
        (falsePositives * 0.1)
      );
      
      // Determine success (must identify all critical errors and 70% overall with limited false positives)
      const isSuccess = criticalIdentificationRate === 1 && overallIdentificationRate >= 0.7 && falsePositives <= 1;
      
      // Calculate insight reward based on difficulty and accuracy
      const difficultyMultiplier = 
        content.difficulty === 'easy' ? 1 :
        content.difficulty === 'medium' ? 1.5 :
        2; // hard
      
      const hintPenalty = hintUsed ? 0.7 : 1;
      const timerBonus = timeRemaining !== null && timeRemaining > 0 ? 
        1 + (timeRemaining / (content.timeLimit || 60)) * 0.3 : 1;
      
      const baseInsight = isSuccess ? 15 : Math.floor(15 * 0.4);
      const adjustedInsight = Math.floor(baseInsight * accuracyScore * difficultyMultiplier * hintPenalty * timerBonus);
      
      // Determine momentum effect based on success/failure
      const momentumEffect = isSuccess ? 'increment' : criticalIdentificationRate < 1 ? 'reset' : 'maintain';
      
      // Prepare knowledge gained if successful
      const knowledgeGained = isSuccess ? {
        conceptId: content.conceptId,
        amount: Math.ceil(10 * accuracyScore * difficultyMultiplier * hintPenalty)
      } : undefined;
      
      // Set feedback message
      if (isSuccess) {
        setFeedbackMessage(content.correctMessage || 
          `Well done! You identified ${identifiedCount} out of ${totalErrors} errors, including all critical ones.`);
      } else if (criticalIdentificationRate < 1) {
        setFeedbackMessage(content.incorrectMessage || 
          `You missed some critical errors. All highlighted errors in red are essential to catch for patient safety.`);
      } else {
        setFeedbackMessage(`You identified ${identifiedCount} out of ${totalErrors} errors. Try to be more thorough next time.`);
      }
      
      // Animation and dispatch events before completing
      setAnimating(true);
      
      // Dispatch completion event
      safeDispatch(
        GameEventType.EXTENSION_INTERACTION,
        {
          type: 'error-identification',
          contentId: content.id,
          success: isSuccess,
          accuracy: accuracyScore,
          difficulty: content.difficulty,
          identifiedCount,
          totalErrors,
          characterId,
          stageId
        },
        'ErrorIdentification'
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
            totalErrors,
            criticalIdentificationRate,
            overallIdentificationRate,
            difficulty: content.difficulty,
            hintUsed,
            timeRemaining: timeRemaining !== null ? timeRemaining : undefined
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
    content.conceptId,
    content.correctMessage,
    content.difficulty,
    content.errors,
    content.id,
    content.incorrectMessage,
    content.timeLimit,
    hintUsed,
    identifiedErrors,
    onComplete,
    submitted,
    timeRemaining,
    characterId,
    stageId
  ]);
  
  // Error list for UI
  const errorsList = useMemo(() => {
    return content.errors.map(error => ({
      ...error,
      isIdentified: identifiedErrors.includes(error.id),
      isSelected: selectedErrorId === error.id
    }));
  }, [content.errors, identifiedErrors, selectedErrorId]);
  
  // Format time remaining
  const formattedTime = useMemo(() => {
    if (timeRemaining === null) return '';
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  }, [timeRemaining]);
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);
  
  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center w-full h-48 bg-black/50 rounded-md p-4">
        <div className="loading-spinner" />
        <p className="ml-3 text-gray-300">Loading scenario...</p>
      </div>
    );
  }
  
  return (
    <div 
      ref={containerRef}
      className="error-identification bg-black/80 border border-blue-900/50 rounded-md p-4"
    >
      {/* Title and description */}
      <div className="mb-4">
        <div className="flex justify-between items-center">
          <h3 className="text-blue-300 text-lg">{content.title}</h3>
          
          {/* Timer display */}
          {timeRemaining !== null && (
            <div className={`font-mono text-base ${timeRemaining < 10 ? 'text-red-400 animate-pulse' : 'text-blue-200'}`}>
              Time: {formattedTime}
            </div>
          )}
        </div>
        <p className="text-gray-300 text-sm mt-1">{content.description}</p>
      </div>
      
      {/* Scenario description */}
      <div className="mb-4 p-3 bg-blue-900/20 rounded-md">
        <h4 className="text-blue-200 text-sm mb-1">Scenario:</h4>
        <p className="text-gray-300 text-sm">{content.scenario}</p>
      </div>
      
      {/* Main content area with image and controls */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* Image area */}
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
          
          {/* Scenario image with error regions */}
          <div className="relative bg-black/80 rounded overflow-hidden" style={{ maxWidth: '100%' }}>
            {/* Main image */}
            <img 
              src={content.imageUrl}
              alt={content.title}
              className="max-w-full h-auto block mx-auto"
              onClick={handleImageClick}
              style={{ cursor: submitted ? 'default' : 'pointer' }}
            />
            
            {/* Overlay for error highlights */}
            <div className="absolute inset-0 pointer-events-none">
              {content.errors.map(error => {
                if (!error.position) return null;
                
                const isIdentified = identifiedErrors.includes(error.id);
                const isSelected = selectedErrorId === error.id;
                const showInHint = showHint && error.isCritical && !isIdentified;
                
                const highlightStyle = {
                  left: `${(error.position.x / content.imageWidth) * 100}%`,
                  top: `${(error.position.y / content.imageHeight) * 100}%`,
                  width: `${(error.position.width / content.imageWidth) * 100}%`,
                  height: `${(error.position.height / content.imageHeight) * 100}%`,
                };
                
                return (
                  <div
                    key={error.id}
                    className={`absolute border-2 rounded transition-all duration-200 ${
                      isIdentified ? 'border-green-500/70 bg-green-500/20' :
                      isSelected ? 'border-blue-500/70 bg-blue-500/20' :
                      showInHint ? 'border-yellow-500/70 bg-yellow-500/20 animate-pulse' :
                      submitted && error.isCritical ? 'border-red-500/70 bg-red-500/20' :
                      submitted ? 'border-orange-500/70 bg-orange-500/20' : 'border-transparent'
                    }`}
                    style={highlightStyle}
                  />
                );
              })}
            </div>
            
            {/* Instructions overlay */}
            {!submitted && identifiedErrors.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60 pointer-events-none">
                <p className="text-white text-center px-4">
                  Identify errors in the scenario by clicking on them or selecting from the list
                </p>
              </div>
            )}
          </div>
        </div>
        
        {/* Error list and details */}
        <div className="w-full md:w-64 bg-black/70 border border-blue-900/30 rounded p-2">
          <h4 className="text-blue-200 text-sm mb-2">Errors Found: {identifiedErrors.length}</h4>
          
          {/* List of errors */}
          <div className="max-h-64 overflow-y-auto mb-4">
            <ul className="space-y-1">
              {errorsList.map(error => (
                <li 
                  key={error.id}
                  className={`px-2 py-1 rounded text-sm cursor-pointer
                    ${error.isIdentified ? 'text-white bg-blue-900/50' : 'text-gray-400'}
                    ${error.isSelected ? 'border border-blue-400' : 'border border-transparent'}
                    ${error.isCritical && !error.isIdentified && submitted ? 'bg-red-900/30 border-red-500/50' : ''}
                    ${!error.isIdentified && submitted ? 'bg-orange-900/30' : ''}
                    hover:bg-blue-900/20
                  `}
                  onClick={() => handleErrorSelect(error.id)}
                >
                  <div className="flex justify-between items-center">
                    <span className="line-clamp-1">{error.description}</span>
                    {error.isIdentified && (
                      <span className="text-green-400 ml-1 flex-shrink-0">✓</span>
                    )}
                    {error.isCritical && !submitted && (
                      <span className="text-yellow-400 ml-1 flex-shrink-0">*</span>
                    )}
                  </div>
                </li>
              ))}
              
              {/* Empty state */}
              {errorsList.length === 0 && (
                <li className="px-2 py-4 text-center text-gray-400">
                  No errors identified yet
                </li>
              )}
            </ul>
            
            {!submitted && errorsList.some(e => e.isCritical) && (
              <div className="mt-2 pt-2 border-t border-blue-900/30 text-xs text-gray-400">
                <p>* Indicates critical errors</p>
              </div>
            )}
          </div>
          
          {/* Selected error details */}
          {selectedErrorId && (
            <div className="mt-2 p-2 bg-blue-900/20 rounded">
              <h4 className="text-blue-200 text-sm font-bold line-clamp-1">
                {content.errors.find(e => e.id === selectedErrorId)?.description}
              </h4>
              {submitted && (
                <p className="text-xs mt-1 text-gray-300">
                  {content.errors.find(e => e.id === selectedErrorId)?.isCritical
                    ? "This is a critical error that must be identified."
                    : "This error should be identified for optimal safety."}
                </p>
              )}
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
            {submitted 
              ? `${identifiedErrors.length}/${content.errors.length} errors identified`
              : `${identifiedErrors.length} ${identifiedErrors.length === 1 ? 'error' : 'errors'} identified`}
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

export default ErrorIdentification;