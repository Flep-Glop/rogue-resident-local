// app/components/extensions/types/MeasurementReading.tsx
'use client';

/**
 * Measurement Reading Extension
 * 
 * Provides an interactive interface for reading and interpreting measurement devices.
 * Implements Chamber Pattern for performance optimization.
 */

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PixelText, PixelButton } from '../../PixelThemeProvider';
import { usePrimitiveStoreValue, useStableCallback } from '../../../core/utils/storeHooks';
import { ExtensionResult } from '../VisualExtender';
import { safeDispatch } from '../../../core/events/CentralEventBus';
import { GameEventType } from '../../../core/events/EventTypes';

interface MeasurementData {
  id: string;
  value: number;
  unit: string;
  label: string;
  type: 'digital' | 'analog';
  isTarget: boolean;
  tolerance?: {
    min: number;
    max: number;
  };
}

interface MeasurementReadingContent {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  measurements: MeasurementData[];
  targetQuestion: string;
  correctAnswer: number;
  acceptableDeviation: number; // Percentage
  conceptId: string;
  difficulty: 'easy' | 'medium' | 'hard';
  domain: string;
  hint?: string;
}

interface MeasurementReadingProps {
  content: MeasurementReadingContent;
  characterId: string;
  stageId: string;
  additionalProps?: Record<string, any>;
  onComplete: (result: ExtensionResult) => void;
}

/**
 * Measurement Reading Component
 * 
 * Provides an interactive interface for reading measurement devices
 */
const MeasurementReading: React.FC<MeasurementReadingProps> = ({
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
  const [userAnswer, setUserAnswer] = useState<number | null>(null);
  const [userReadings, setUserReadings] = useState<Record<string, number | null>>({});
  const [showHint, setShowHint] = useState(false);
  const [hintUsed, setHintUsed] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Animation state
  const [animating, setAnimating] = useState(false);
  
  // Initialize readings state
  useEffect(() => {
    if (!isMountedRef.current) return;
    
    // Set initial reading values
    const initialReadings: Record<string, number | null> = {};
    content.measurements.forEach(m => {
      initialReadings[m.id] = null;
    });
    
    setUserReadings(initialReadings);
    
    // Mark as loaded (no image loading here, but following same pattern)
    setLoading(false);
  }, [content.measurements]);
  
  // Handle reading input change
  const handleReadingChange = useCallback((measurementId: string, value: string) => {
    if (!isMountedRef.current || submitted) return;
    
    // Parse numeric value
    const numericValue = value === '' ? null : parseFloat(value);
    
    // Update reading value
    setUserReadings(prev => ({
      ...prev,
      [measurementId]: numericValue
    }));
    
    // Clear feedback
    if (feedbackMessage) {
      setFeedbackMessage(null);
    }
  }, [feedbackMessage, submitted]);
  
  // Handle answer input change
  const handleAnswerChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isMountedRef.current || submitted) return;
    
    // Parse numeric value
    const value = e.target.value;
    const numericValue = value === '' ? null : parseFloat(value);
    
    // Update answer
    setUserAnswer(numericValue);
    
    // Clear feedback
    if (feedbackMessage) {
      setFeedbackMessage(null);
    }
  }, [feedbackMessage, submitted]);
  
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
          type: 'measurement-reading',
          contentId: content.id,
          characterId,
          stageId
        },
        'MeasurementReading'
      );
    }
    
    // Toggle hint visibility
    setShowHint(prev => !prev);
    
    // Show hint message
    if (!showHint) {
      setFeedbackMessage(content.hint || 'Pay careful attention to the units and scale of each measurement.');
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
      // Check if answer is provided
      if (userAnswer === null) {
        setFeedbackMessage('Please enter your answer.');
        return;
      }
      
      // Check if all readings are complete (for validation)
      const missingReadings = Object.entries(userReadings)
        .filter(([id, value]) => value === null)
        .map(([id]) => content.measurements.find(m => m.id === id)?.label || id);
      
      if (missingReadings.length > 0) {
        setFeedbackMessage(`Please complete all readings: ${missingReadings.join(', ')}`);
        return;
      }
      
      setSubmitted(true);
      
      // Calculate accuracy of answer
      const percentageError = Math.abs((userAnswer - content.correctAnswer) / content.correctAnswer) * 100;
      const isWithinTolerance = percentageError <= content.acceptableDeviation;
      
      // Calculate accuracy score (0-1)
      const accuracyScore = Math.max(0, 1 - (percentageError / (content.acceptableDeviation * 2)));
      
      // Determine success
      const isSuccess = isWithinTolerance;
      
      // Calculate insight reward based on difficulty and accuracy
      const difficultyMultiplier = 
        content.difficulty === 'easy' ? 1 :
        content.difficulty === 'medium' ? 1.5 :
        2; // hard
      
      const hintPenalty = hintUsed ? 0.7 : 1;
      const baseInsight = isSuccess ? 15 : Math.floor(15 * 0.4);
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
        setFeedbackMessage(`Correct! Your answer of ${userAnswer} is within the acceptable range.`);
      } else {
        setFeedbackMessage(`Your answer of ${userAnswer} is outside the acceptable range. The correct answer is ${content.correctAnswer}.`);
      }
      
      // Animation and dispatch events before completing
      setAnimating(true);
      
      // Dispatch completion event
      safeDispatch(
        GameEventType.EXTENSION_INTERACTION,
        {
          type: 'measurement-reading',
          contentId: content.id,
          success: isSuccess,
          accuracy: accuracyScore,
          difficulty: content.difficulty,
          hintUsed,
          characterId,
          stageId
        },
        'MeasurementReading'
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
            userAnswer,
            correctAnswer: content.correctAnswer,
            percentageError,
            acceptableDeviation: content.acceptableDeviation,
            difficulty: content.difficulty,
            hintUsed
          }
        });
      }, 2000);
    } catch (error) {
      console.error('Error submitting measurement reading:', error);
      
      // Fallback completion
      onComplete({
        success: false,
        accuracy: 0,
        insightGained: 0,
        momentumEffect: 'maintain'
      });
    }
  }, [
    content.acceptableDeviation, 
    content.conceptId, 
    content.correctAnswer, 
    content.difficulty, 
    content.id, 
    content.measurements, 
    hintUsed, 
    onComplete, 
    submitted, 
    userAnswer, 
    userReadings,
    characterId,
    stageId
  ]);
  
  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center w-full h-48 bg-black/50 rounded-md p-4">
        <div className="loading-spinner" />
        <p className="ml-3 text-gray-300">Loading measurement interface...</p>
      </div>
    );
  }
  
  return (
    <div 
      ref={containerRef}
      className="measurement-reading bg-black/80 border border-blue-900/50 rounded-md p-4"
    >
      {/* Title and description */}
      <div className="mb-4">
        <h3 className="text-blue-300 text-lg mb-1">{content.title}</h3>
        <p className="text-gray-300 text-sm">{content.description}</p>
      </div>
      
      {/* Main content area */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* Measurement device image */}
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
          
          {/* Measurement device image */}
          <div className="bg-black/80 rounded overflow-hidden">
            <img 
              src={content.imageUrl}
              alt="Measurement Device"
              className="max-w-full h-auto block mx-auto"
            />
          </div>
        </div>
        
        {/* Readings and input panel */}
        <div className="w-full md:w-64 bg-black/70 border border-blue-900/30 rounded p-3">
          <h4 className="text-blue-200 text-sm mb-2">Instrument Readings:</h4>
          
          {/* Reading input fields */}
          <div className="space-y-2 mb-4">
            {content.measurements.map(measurement => (
              <div key={measurement.id} className="reading-input">
                <label className="block text-gray-300 text-sm mb-1">
                  {measurement.label} {measurement.unit && `(${measurement.unit})`}
                </label>
                <div className="flex">
                  <input
                    type="number"
                    value={userReadings[measurement.id] === null ? '' : userReadings[measurement.id]}
                    onChange={e => handleReadingChange(measurement.id, e.target.value)}
                    className="w-full bg-black/50 border border-blue-800/50 rounded p-2 text-white"
                    placeholder={`Enter ${measurement.label}`}
                    disabled={submitted}
                  />
                  {showHint && measurement.isTarget && (
                    <div className="ml-2 text-yellow-400 flex items-center text-xl">⟂</div>
                  )}
                </div>
                
                {showHint && measurement.tolerance && (
                  <div className="text-xs text-yellow-400 mt-1">
                    Expected range: {measurement.tolerance.min} - {measurement.tolerance.max} {measurement.unit}
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {/* Answer section */}
          <div className="mt-5 pt-3 border-t border-blue-900/30">
            <h4 className="text-blue-200 text-sm mb-2">Final Result:</h4>
            <p className="text-gray-300 text-sm mb-2">{content.targetQuestion}</p>
            
            <div className="flex">
              <input
                type="number"
                value={userAnswer === null ? '' : userAnswer}
                onChange={handleAnswerChange}
                className="w-full bg-black/70 border border-blue-800 rounded p-2 text-white"
                placeholder="Enter your answer"
                disabled={submitted}
              />
              
              {submitted && (
                <div className={`ml-2 flex items-center text-xl ${
                  Math.abs((userAnswer || 0) - content.correctAnswer) <= content.acceptableDeviation
                  ? 'text-green-400' : 'text-red-400'
                }`}>
                  {Math.abs((userAnswer || 0) - content.correctAnswer) <= content.acceptableDeviation
                    ? '✓' : '✗'}
                </div>
              )}
            </div>
            
            {submitted && (
              <div className={`text-sm mt-1 ${
                Math.abs((userAnswer || 0) - content.correctAnswer) <= content.acceptableDeviation
                ? 'text-green-400' : 'text-red-400'
              }`}>
                Correct answer: {content.correctAnswer}
              </div>
            )}
          </div>
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
      <div className="flex justify-end mt-4">
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
          {submitted ? 'Continue' : 'Submit Reading'}
        </button>
      </div>
    </div>
  );
};

export default MeasurementReading;