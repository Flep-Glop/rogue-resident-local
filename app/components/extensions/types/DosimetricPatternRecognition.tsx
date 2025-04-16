// app/components/extensions/types/DosimetricPatternRecognition.tsx
'use client';

/**
 * Dosimetric Pattern Recognition Extension
 * 
 * Allows users to recognize characteristic patterns in dose distributions.
 * Implements Chamber Pattern for performance optimization.
 */

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PixelText, PixelButton } from '../../PixelThemeProvider';
import { usePrimitiveStoreValue, useStableCallback } from '../../../core/utils/storeHooks';
import { ExtensionResult } from '../VisualExtender';
import { safeDispatch } from '../../../core/events/CentralEventBus';
import { GameEventType } from '../../../core/events/EventTypes';

// Type definitions for pattern elements
interface DosePattern {
  id: string;
  name: string;
  description: string;
  isCorrect: boolean;
  image: string;
  characteristics: string[];
  causes?: string[];
  isCritical: boolean;
}

interface PatternFeature {
  id: string;
  name: string;
  description: string;
  isPresent: boolean;
  isSelected?: boolean;
}

interface PatternQuestion {
  id: string;
  text: string;
  options: {
    id: string;
    text: string;
    isCorrect: boolean;
  }[];
}

// Content interface
interface DosimetricPatternContent {
  id: string;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  conceptId: string;
  domain: string;
  doseDist: {
    image: string;
    width: number;
    height: number;
  };
  patterns: DosePattern[];
  features: PatternFeature[];
  questions: PatternQuestion[];
  hint?: string;
}

// Component props
interface DosimetricPatternRecognitionProps {
  content: DosimetricPatternContent;
  characterId: string;
  stageId: string;
  additionalProps?: Record<string, any>;
  onComplete: (result: ExtensionResult) => void;
}

/**
 * Dosimetric Pattern Recognition Component
 * 
 * Provides an interactive interface for recognizing and analyzing
 * characteristic patterns in radiation dose distributions
 */
const DosimetricPatternRecognition: React.FC<DosimetricPatternRecognitionProps> = ({
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
  const animationTimersRef = useRef<NodeJS.Timeout[]>([]);
  
  // Component state
  const [step, setStep] = useState<'pattern-recognition' | 'feature-identification' | 'questions'>('pattern-recognition');
  const [selectedPattern, setSelectedPattern] = useState<string | null>(null);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [questionAnswers, setQuestionAnswers] = useState<Record<string, string | null>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [hintUsed, setHintUsed] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [score, setScore] = useState<{
    patternScore: number;
    featureScore: number;
    questionScore: number;
    total: number;
  }>({
    patternScore: 0,
    featureScore: 0,
    questionScore: 0,
    total: 0
  });
  
  // Animation state
  const [animating, setAnimating] = useState(false);
  const [highlightArea, setHighlightArea] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
    active: boolean;
  }>({
    x: 0, y: 0, width: 0, height: 0, active: false
  });
  
  // Load image
  useEffect(() => {
    if (!isMountedRef.current) return;
    
    const img = new Image();
    img.src = content.doseDist.image;
    
    img.onload = () => {
      if (!isMountedRef.current) return;
      
      imageRef.current = img;
      setLoading(false);
    };
    
    img.onerror = () => {
      if (!isMountedRef.current) return;
      
      setLoading(false);
      setFeedbackMessage('Error loading dose distribution image');
    };
    
    // Initialize questionAnswers with nulls
    const initialAnswers: Record<string, string | null> = {};
    content.questions.forEach(q => {
      initialAnswers[q.id] = null;
    });
    setQuestionAnswers(initialAnswers);
    
    return () => {
      // Clean up image reference
      imageRef.current = null;
      
      // Clear any pending timers
      animationTimersRef.current.forEach(clearTimeout);
    };
  }, [content.doseDist.image, content.questions]);
  
  // Handle pattern selection
  const handlePatternSelect = useCallback((patternId: string) => {
    if (!isMountedRef.current || submitted) return;
    
    setSelectedPattern(patternId);
    setFeedbackMessage(null);
    
    // Find the pattern
    const pattern = content.patterns.find(p => p.id === patternId);
    if (pattern) {
      // Create highlight animation effect for the pattern
      setHighlightArea({
        x: content.doseDist.width * 0.3,
        y: content.doseDist.height * 0.3,
        width: content.doseDist.width * 0.4,
        height: content.doseDist.height * 0.4,
        active: true
      });
      
      // Disable highlight after animation
      const timer = setTimeout(() => {
        if (isMountedRef.current) {
          setHighlightArea(prev => ({ ...prev, active: false }));
        }
      }, 2000);
      
      animationTimersRef.current.push(timer);
    }
  }, [content.patterns, content.doseDist.width, content.doseDist.height, submitted]);
  
  // Handle feature selection
  const handleFeatureToggle = useCallback((featureId: string) => {
    if (!isMountedRef.current || submitted) return;
    
    setSelectedFeatures(prev => {
      if (prev.includes(featureId)) {
        return prev.filter(id => id !== featureId);
      } else {
        return [...prev, featureId];
      }
    });
    setFeedbackMessage(null);
  }, [submitted]);
  
  // Handle question answers
  const handleAnswerSelect = useCallback((questionId: string, answerId: string) => {
    if (!isMountedRef.current || submitted) return;
    
    setQuestionAnswers(prev => ({
      ...prev,
      [questionId]: answerId
    }));
    setFeedbackMessage(null);
  }, [submitted]);
  
  // Handle hint toggle
  const handleToggleHint = useCallback(() => {
    if (!isMountedRef.current || submitted) return;
    
    // Track hint usage
    if (!hintUsed) {
      setHintUsed(true);
      
      // Log hint usage
      safeDispatch(
        GameEventType.EXTENSION_HINT_USED,
        {
          type: 'dosimetric-pattern',
          contentId: content.id,
          characterId,
          stageId
        },
        'DosimetricPatternRecognition'
      );
    }
    
    // Toggle hint visibility
    setShowHint(prev => !prev);
    
    // Show hint message
    if (!showHint) {
      let hintText = content.hint;
      
      if (!hintText) {
        // Generate context-sensitive hint based on current step
        if (step === 'pattern-recognition') {
          hintText = 'Look for characteristic shapes and distributions in the isodose lines. Hot spots appear as concentrated areas of high dose.';
        } else if (step === 'feature-identification') {
          hintText = 'Consider how dose gradients, conformality, and homogeneity appear in the distribution.';
        } else {
          hintText = 'Consider the physical principles behind dose deposition and the effects of beam arrangement.';
        }
      }
      
      setFeedbackMessage(hintText);
    } else {
      setFeedbackMessage(null);
    }
  }, [
    step,
    content.hint, 
    content.id, 
    hintUsed, 
    showHint, 
    submitted,
    characterId,
    stageId
  ]);
  
  // Handle navigation between steps
  const handleNextStep = useCallback(() => {
    if (!isMountedRef.current) return;
    
    if (step === 'pattern-recognition') {
      // Check if pattern selected
      if (!selectedPattern) {
        setFeedbackMessage('Please select a pattern type first');
        return;
      }
      
      setStep('feature-identification');
      setFeedbackMessage(null);
    } else if (step === 'feature-identification') {
      // Check if at least some features selected
      if (selectedFeatures.length === 0) {
        setFeedbackMessage('Please select at least one feature');
        return;
      }
      
      setStep('questions');
      setFeedbackMessage(null);
    }
  }, [step, selectedPattern, selectedFeatures]);
  
  const handlePrevStep = useCallback(() => {
    if (!isMountedRef.current) return;
    
    if (step === 'feature-identification') {
      setStep('pattern-recognition');
      setFeedbackMessage(null);
    } else if (step === 'questions') {
      setStep('feature-identification');
      setFeedbackMessage(null);
    }
  }, [step]);
  
  // Navigate between questions
  const handleNextQuestion = useCallback(() => {
    if (currentQuestionIndex < content.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  }, [currentQuestionIndex, content.questions.length]);
  
  const handlePrevQuestion = useCallback(() => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  }, [currentQuestionIndex]);
  
  // Handle submission
  const handleSubmit = useCallback(() => {
    if (!isMountedRef.current || submitted) return;
    
    try {
      // Check if all steps completed
      if (step !== 'questions') {
        setFeedbackMessage('Please complete all steps before submitting');
        return;
      }
      
      // Check if all questions answered
      const unansweredQuestions = Object.entries(questionAnswers)
        .filter(([, answer]) => answer === null)
        .map(([id]) => content.questions.find(q => q.id === id)?.text || id);
      
      if (unansweredQuestions.length > 0) {
        setFeedbackMessage(`Please answer all questions before submitting`);
        return;
      }
      
      setSubmitted(true);
      
      // Calculate scores for each section
      const selectedPatternData = content.patterns.find(p => p.id === selectedPattern);
      const patternScore = selectedPatternData?.isCorrect ? 1 : 0;
      
      // Calculate feature score (percentage of correct features identified)
      const correctFeatures = content.features.filter(f => f.isPresent);
      const correctlySelected = correctFeatures.filter(f => selectedFeatures.includes(f.id));
      const incorrectlySelected = selectedFeatures
        .filter(id => !correctFeatures.some(f => f.id === id));
      
      // Score is based on correct selections minus incorrect selections, normalized
      const featureScore = Math.max(0, 
        (correctlySelected.length / Math.max(1, correctFeatures.length)) - 
        (incorrectlySelected.length / Math.max(1, content.features.length - correctFeatures.length))
      );
      
      // Calculate question score (percentage of correct answers)
      const questionCount = content.questions.length;
      const correctAnswers = content.questions.filter(q => {
        const selectedAnswerId = questionAnswers[q.id];
        const correctOption = q.options.find(o => o.isCorrect);
        return selectedAnswerId === correctOption?.id;
      }).length;
      
      const questionScore = questionCount > 0 ? correctAnswers / questionCount : 0;
      
      // Weight scores based on importance (pattern recognition most important)
      const totalScore = (patternScore * 0.4) + (featureScore * 0.3) + (questionScore * 0.3);
      
      // Update score state
      setScore({
        patternScore,
        featureScore,
        questionScore,
        total: totalScore
      });
      
      // Determine success threshold
      const isSuccess = totalScore >= 0.7;
      
      // Calculate insight reward based on difficulty and accuracy
      const difficultyMultiplier = 
        content.difficulty === 'easy' ? 1 :
        content.difficulty === 'medium' ? 1.5 :
        2; // hard
      
      const hintPenalty = hintUsed ? 0.7 : 1;
      const baseInsight = isSuccess ? 20 : Math.floor(20 * 0.4);
      const adjustedInsight = Math.floor(baseInsight * totalScore * difficultyMultiplier * hintPenalty);
      
      // Determine momentum effect based on success/failure
      const momentumEffect = isSuccess ? 'increment' : totalScore < 0.4 ? 'reset' : 'maintain';
      
      // Prepare knowledge gained if successful
      const knowledgeGained = isSuccess ? {
        conceptId: content.conceptId,
        amount: Math.ceil(10 * totalScore * difficultyMultiplier * hintPenalty)
      } : undefined;
      
      // Set feedback message based on success
      if (isSuccess) {
        setFeedbackMessage(`Great analysis! Your score: ${Math.round(totalScore * 100)}%. You correctly identified the dose pattern and key features.`);
      } else if (totalScore >= 0.4) {
        setFeedbackMessage(`You've identified some key aspects of the dose distribution. Score: ${Math.round(totalScore * 100)}%.`);
      } else {
        setFeedbackMessage(`Review needed. Score: ${Math.round(totalScore * 100)}%. Focus on identifying characteristic patterns and their features.`);
      }
      
      // Animation and dispatch events before completing
      setAnimating(true);
      
      // Dispatch completion event
      safeDispatch(
        GameEventType.EXTENSION_INTERACTION,
        {
          type: 'dosimetric-pattern',
          contentId: content.id,
          success: isSuccess,
          accuracy: totalScore,
          difficulty: content.difficulty,
          characterId,
          stageId
        },
        'DosimetricPatternRecognition'
      );
      
      // Complete with short delay to allow animation
      setTimeout(() => {
        if (!isMountedRef.current) return;
        
        onComplete({
          success: isSuccess,
          accuracy: totalScore,
          insightGained: adjustedInsight,
          momentumEffect,
          knowledgeGained,
          details: {
            patternScore,
            featureScore,
            questionScore,
            totalScore,
            difficulty: content.difficulty,
            hintUsed
          }
        });
      }, 2000);
    } catch (error) {
      console.error('Error submitting pattern recognition:', error);
      
      // Fallback completion
      onComplete({
        success: false,
        accuracy: 0,
        insightGained: 0,
        momentumEffect: 'maintain'
      });
    }
  }, [
    step,
    submitted,
    selectedPattern,
    selectedFeatures,
    questionAnswers,
    content.conceptId,
    content.difficulty,
    content.features,
    content.id,
    content.patterns,
    content.questions,
    drawCanvas,
    hintUsed,
    onComplete,
    characterId,
    stageId
  ]);
  
  // Draw canvas function for highlighting patterns
  const drawCanvas = useCallback(() => {
    // This could be implemented to highlight specific areas based on pattern selection
    // For now, we'll use CSS-based highlighting via the highlightArea state
    
    // Example implementation:
    // const canvas = canvasRef.current;
    // if (!canvas) return;
    // 
    // const ctx = canvas.getContext('2d');
    // if (!ctx) return;
    // 
    // Draw highlight areas as needed
  }, []);
  
  // Get current question
  const currentQuestion = useMemo(() => {
    return content.questions[currentQuestionIndex] || null;
  }, [content.questions, currentQuestionIndex]);
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      
      // Clear any pending timers
      animationTimersRef.current.forEach(clearTimeout);
    };
  }, []);
  
  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center w-full h-48 bg-black/50 rounded-md p-4">
        <div className="loading-spinner" />
        <p className="ml-3 text-gray-300">Loading dose distribution data...</p>
      </div>
    );
  }
  
  return (
    <div 
      ref={containerRef}
      className="dosimetric-pattern-recognition bg-black/80 border border-blue-900/50 rounded-md p-4"
    >
      {/* Title and description */}
      <div className="mb-4">
        <h3 className="text-blue-300 text-lg mb-1">{content.title}</h3>
        <p className="text-gray-300 text-sm">{content.description}</p>
      </div>
      
      {/* Step indicator */}
      <div className="flex justify-between mb-4 relative">
        <div className="w-full h-1 bg-gray-700 absolute top-1/2 -translate-y-1/2 z-0"></div>
        {['Pattern Recognition', 'Feature Identification', 'Analysis Questions'].map((stepName, index) => {
          const isActive = 
            (index === 0 && step === 'pattern-recognition') ||
            (index === 1 && step === 'feature-identification') ||
            (index === 2 && step === 'questions');
          
          const isCompleted = 
            (index === 0 && (step === 'feature-identification' || step === 'questions')) ||
            (index === 1 && step === 'questions');
            
          return (
            <div 
              key={index}
              className={`flex flex-col items-center justify-center relative z-10 ${isActive ? '' : 'opacity-60'}`}
            >
              <div 
                className={`w-6 h-6 rounded-full flex items-center justify-center
                  ${isCompleted ? 'bg-green-600' : isActive ? 'bg-blue-600' : 'bg-gray-700'}`}
              >
                {isCompleted ? (
                  <span className="text-white text-xs">✓</span>
                ) : (
                  <span className="text-white text-xs">{index + 1}</span>
                )}
              </div>
              <span className="mt-1 text-xs text-gray-300">{stepName}</span>
            </div>
          );
        })}
      </div>
      
      {/* Main content area */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* Dose distribution image area */}
        <div className="flex-1 bg-black/70 border border-blue-900/30 rounded p-2">
          {/* Controls */}
          <div className="flex justify-end mb-2">
            <button
              onClick={handleToggleHint}
              className={`px-2 py-1 rounded text-sm text-white ${showHint ? 'bg-yellow-600' : 'bg-blue-900/50'}`}
              disabled={submitted}
            >
              {showHint ? 'Hide Hint' : 'Show Hint'}
            </button>
          </div>
          
          {/* Dose distribution image with highlight overlay */}
          <div className="relative bg-black rounded overflow-hidden">
            <img 
              src={content.doseDist.image}
              alt="Dose Distribution"
              className="max-w-full h-auto block mx-auto"
            />
            
            {/* Pattern highlight overlay */}
            {highlightArea.active && (
              <div 
                className="absolute border-2 border-yellow-400 bg-yellow-400/10 animate-pulse"
                style={{
                  left: `${(highlightArea.x / content.doseDist.width) * 100}%`,
                  top: `${(highlightArea.y / content.doseDist.height) * 100}%`,
                  width: `${(highlightArea.width / content.doseDist.width) * 100}%`,
                  height: `${(highlightArea.height / content.doseDist.height) * 100}%`
                }}
              />
            )}
            
            {/* Pattern result overlay after submission */}
            {submitted && selectedPattern && (
              <div 
                className={`absolute inset-0 border-4 ${
                  score.patternScore > 0 ? 'border-green-500 bg-green-500/10' : 'border-red-500 bg-red-500/10'
                }`}
              />
            )}
          </div>
          
          {/* Explanation of the dose pattern after submission */}
          {submitted && selectedPattern && (
            <div className="mt-2 p-2 bg-blue-900/20 rounded">
              <h4 className="text-blue-200 text-sm font-bold">
                {content.patterns.find(p => p.id === selectedPattern)?.name}
              </h4>
              <p className="text-gray-300 text-xs mt-1">
                {content.patterns.find(p => p.id === selectedPattern)?.description}
              </p>
              {score.patternScore === 0 && (
                <p className="text-red-300 text-xs mt-1">
                  This is not the correct pattern identification.
                </p>
              )}
            </div>
          )}
        </div>
        
        {/* Interactive panel - changes based on current step */}
        <div className="w-full md:w-64 bg-black/70 border border-blue-900/30 rounded p-2">
          {/* Pattern Recognition Step */}
          {step === 'pattern-recognition' && (
            <div>
              <h4 className="text-blue-200 text-sm mb-2">Identify the Pattern:</h4>
              <div className="space-y-2">
                {content.patterns.map(pattern => (
                  <div
                    key={pattern.id}
                    className={`p-2 rounded border cursor-pointer transition-colors
                      ${selectedPattern === pattern.id 
                        ? 'bg-blue-900/50 border-blue-500' 
                        : 'bg-black/50 border-gray-700 hover:border-blue-400'}
                      ${submitted && pattern.isCorrect ? 'bg-green-900/30 border-green-500' : ''}
                    `}
                    onClick={() => !submitted && handlePatternSelect(pattern.id)}
                  >
                    <div className="text-sm font-medium text-white">{pattern.name}</div>
                    {(submitted || selectedPattern === pattern.id) && (
                      <div className="text-xs text-gray-300 mt-1">{pattern.description}</div>
                    )}
                    {submitted && pattern.isCorrect && (
                      <div className="text-xs text-green-300 mt-1">Correct pattern</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Feature Identification Step */}
          {step === 'feature-identification' && (
            <div>
              <h4 className="text-blue-200 text-sm mb-2">Select Features Present:</h4>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {content.features.map(feature => {
                  const isSelected = selectedFeatures.includes(feature.id);
                  const isCorrect = feature.isPresent === isSelected;
                  
                  return (
                    <div
                      key={feature.id}
                      className={`p-2 rounded border cursor-pointer transition-colors
                        ${isSelected
                          ? 'bg-blue-900/50 border-blue-500' 
                          : 'bg-black/50 border-gray-700 hover:border-blue-400'}
                        ${submitted && isCorrect ? 'bg-green-900/30 border-green-500' : ''}
                        ${submitted && !isCorrect ? 'bg-red-900/30 border-red-500' : ''}
                      `}
                      onClick={() => !submitted && handleFeatureToggle(feature.id)}
                    >
                      <div className="flex justify-between">
                        <div className="text-sm font-medium text-white">{feature.name}</div>
                        {isSelected && (
                          <div className="text-xs bg-blue-500 text-white px-1 rounded">Selected</div>
                        )}
                      </div>
                      {(submitted || isSelected) && (
                        <div className="text-xs text-gray-300 mt-1">{feature.description}</div>
                      )}
                      {submitted && (
                        <div className={`text-xs ${isCorrect ? 'text-green-300' : 'text-red-300'} mt-1`}>
                          {feature.isPresent ? 'Present in image' : 'Not present in image'}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          
          {/* Questions Step */}
          {step === 'questions' && currentQuestion && (
            <div>
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-blue-200 text-sm">Question {currentQuestionIndex + 1}/{content.questions.length}</h4>
                <div className="flex space-x-1">
                  <button
                    onClick={handlePrevQuestion}
                    disabled={currentQuestionIndex === 0 || submitted}
                    className="w-6 h-6 flex items-center justify-center rounded bg-blue-900/50 text-white disabled:opacity-50"
                  >
                    &lt;
                  </button>
                  <button
                    onClick={handleNextQuestion}
                    disabled={currentQuestionIndex === content.questions.length - 1 || submitted}
                    className="w-6 h-6 flex items-center justify-center rounded bg-blue-900/50 text-white disabled:opacity-50"
                  >
                    &gt;
                  </button>
                </div>
              </div>
              
              <div className="p-2 bg-blue-900/20 rounded mb-2">
                <p className="text-white text-sm">{currentQuestion.text}</p>
              </div>
              
              <div className="space-y-2">
                {currentQuestion.options.map(option => {
                  const isSelected = questionAnswers[currentQuestion.id] === option.id;
                  const isCorrect = option.isCorrect;
                  
                  return (
                    <div
                      key={option.id}
                      className={`p-2 rounded border cursor-pointer transition-colors
                        ${isSelected
                          ? 'bg-blue-900/50 border-blue-500' 
                          : 'bg-black/50 border-gray-700 hover:border-blue-400'}
                        ${submitted && isCorrect ? 'bg-green-900/30 border-green-500' : ''}
                        ${submitted && isSelected && !isCorrect ? 'bg-red-900/30 border-red-500' : ''}
                      `}
                      onClick={() => !submitted && handleAnswerSelect(currentQuestion.id, option.id)}
                    >
                      <div className="text-sm text-white">{option.text}</div>
                      {submitted && isCorrect && (
                        <div className="text-xs text-green-300 mt-1">Correct answer</div>
                      )}
                    </div>
                  );
                })}
              </div>
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
      
      {/* Navigation buttons */}
      <div className="flex justify-between mt-4">
        {/* Step navigation or results */}
        {submitted ? (
          <div className="text-sm text-blue-300">
            <div className="font-bold">Final Score: {Math.round(score.total * 100)}%</div>
            <div className="text-xs text-gray-300 mt-1">
              Pattern: {Math.round(score.patternScore * 100)}% | 
              Features: {Math.round(score.featureScore * 100)}% | 
              Questions: {Math.round(score.questionScore * 100)}%
            </div>
          </div>
        ) : (
          <div className="flex space-x-2">
            {step !== 'pattern-recognition' && (
              <button
                className="px-3 py-1 rounded bg-blue-900/50 text-white text-sm"
                onClick={handlePrevStep}
              >
                Previous
              </button>
            )}
            {step !== 'questions' && (
              <button
                className="px-3 py-1 rounded bg-blue-600 text-white text-sm"
                onClick={handleNextStep}
              >
                Next
              </button>
            )}
          </div>
        )}
        
        {/* Submit button or Continue */}
        {step === 'questions' && (
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
            {submitted ? 'Continue' : 'Submit Analysis'}
          </button>
        )}
      </div>
    </div>
  );
};

export default DosimetricPatternRecognition;