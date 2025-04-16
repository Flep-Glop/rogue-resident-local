// app/components/extensions/ExtensionRenderer.tsx
'use client';

/**
 * Extension Renderer Component
 * 
 * Dynamically renders the appropriate extension component based on the extension type.
 * Handles loading extension content and provides error boundaries.
 * Enhanced with Challenge Ceremony for smooth transitions.
 * 
 * Implements Chamber Pattern:
 * 1. Uses primitive values for state
 * 2. Stable function references
 * 3. DOM-based animations via refs
 * 4. Atomic state updates
 * 5. Defensive unmount handling
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ExtensionData, ExtensionResult } from './VisualExtender';
import { motion, AnimatePresence } from 'framer-motion';
import { shallow } from 'zustand/shallow';
import DialogueContainer, { DialogueMode } from '../dialogue/DialogueContainer';

// Import extension components
import CalculationInterface from './types/CalculationInterface';
import AnatomicalIdentification from './types/AnatomicalIdentification';
import EquipmentIdentification from './types/EquipmentIdentification';
import MeasurementReading from './types/MeasurementReading';
import ErrorIdentification from './types/ErrorIdentification';
import ErrorDisplay from './ui/ErrorDisplay';
import ChallengeCeremony from './ChallengeCeremony';

// Import extension content data
import { getExtensionContent } from './content/extensionContentRegistry';

interface ExtensionRendererProps {
  extension: ExtensionData;
  characterId: string;
  stageId: string;
  onComplete: (result: ExtensionResult) => void;
}

/**
 * Ceremonial States for Challenge Ritual
 */
enum CeremonialState {
  Initial = 'initial',
  CeremonyStarted = 'ceremony_started',
  CeremonyComplete = 'ceremony_complete',
  ExtensionActive = 'extension_active',
}

/**
 * Renders the appropriate extension component based on extension type
 * With optimized loading and error states
 * Enhanced with ceremonial transitions
 */
const ExtensionRenderer: React.FC<ExtensionRendererProps> = ({
  extension,
  characterId,
  stageId,
  onComplete
}) => {
  // Mount tracking ref
  const isMountedRef = useRef(true);
  const loadStartTimeRef = useRef(Date.now());
  const animationFrameRef = useRef<number | null>(null);
  
  // Component state
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [content, setContent] = useState<any | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(0);
  
  // Ceremonial state for challenge ritual
  const [ceremonialState, setCeremonialState] = useState<CeremonialState>(CeremonialState.Initial);
  
  // Extract ceremony text from content if available
  const [ceremonyText, setCeremonyText] = useState<string>('');
  
  // Stable onComplete reference
  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);
  
  // Safe setState wrapper functions
  const safeSetIsLoading = useCallback((value: boolean) => {
    if (isMountedRef.current) {
      setIsLoading(value);
    }
  }, []);
  
  const safeSetError = useCallback((value: string | null) => {
    if (isMountedRef.current) {
      setError(value);
    }
  }, []);
  
  const safeSetContent = useCallback((value: any | null) => {
    if (isMountedRef.current) {
      setContent(value);
    }
  }, []);
  
  // Simulate loading progress animation
  const animateLoadingProgress = useCallback(() => {
    if (!isMountedRef.current) return;
    
    const startTime = loadStartTimeRef.current;
    const currentTime = Date.now();
    const elapsed = currentTime - startTime;
    
    // Calculate a non-linear progress that starts fast and slows down
    // This creates a more natural feeling loading animation
    const duration = 2000; // Max loading animation duration
    const progress = Math.min(95, elapsed / duration * 100);
    
    setLoadingProgress(progress);
    
    if (progress < 95) {
      animationFrameRef.current = requestAnimationFrame(animateLoadingProgress);
    }
  }, []);
  
  // Handle error with stable callback
  const handleError = useCallback((err: any) => {
    if (!isMountedRef.current) return;
    
    console.error('Error in ExtensionRenderer:', err);
    safeSetError(`Failed to load extension content: ${err instanceof Error ? err.message : String(err)}`);
    safeSetIsLoading(false);
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, [safeSetError, safeSetIsLoading]);
  
  // Fetch content data
  useEffect(() => {
    if (!isMountedRef.current) return;
    
    // Start loading animation
    loadStartTimeRef.current = Date.now();
    animationFrameRef.current = requestAnimationFrame(animateLoadingProgress);
    
    const fetchContent = async () => {
      try {
        safeSetIsLoading(true);
        safeSetError(null);
        
        // Get content for this extension
        const extensionContent = await getExtensionContent(extension.type, extension.contentId);
        
        if (!isMountedRef.current) return;
        
        if (!extensionContent) {
          throw new Error(`Content not found for ${extension.type}:${extension.contentId}`);
        }
        
        // Extract ceremony text from content if available
        if (extension.conversationText) {
          // If conversation text is provided, use it directly
          setCeremonyText(extension.conversationText);
        } else if (extensionContent.description) {
          setCeremonyText(extensionContent.description);
        } else if (extension.type === 'calculation' && extensionContent.educationalSteps?.length > 0) {
          // For calculations, use the first educational step's kapoorText if available
          setCeremonyText(extensionContent.educationalSteps[0].kapoorText || 
            "Let's solve this calculation problem. Pay careful attention to the values.");
        } else {
          // Default ceremony text by type
          const defaultTexts: Record<string, string> = {
            'calculation': "Let's work through this calculation together. Pay attention to the values and formulas.",
            'anatomical-identification': "Study this anatomical image carefully. Precise identification is essential for effective treatment planning.",
            'equipment-identification': "Identify these components accurately. Understanding our equipment is fundamental to quality assurance.",
            'measurement-reading': "Let's interpret these measurements. Precision in reading values directly impacts treatment quality.",
            'dosimetric-pattern': "Analyze these dosimetric patterns. Recognition of characteristic distributions is a key skill.",
            'treatment-plan': "Evaluate this treatment plan. The balance between target coverage and normal tissue sparing is critical.",
            'error-identification': "Find the errors in this setup. Patient safety depends on our ability to detect and correct mistakes."
          };
          
          setCeremonyText(defaultTexts[extension.type] || "Let's work through this challenge together.");
        }
        
        // Add a minimum loading time to prevent flashing for fast loads
        const loadTime = Date.now() - loadStartTimeRef.current;
        const minLoadTime = 500; // ms
        
        if (loadTime < minLoadTime) {
          await new Promise(resolve => setTimeout(resolve, minLoadTime - loadTime));
        }
        
        if (!isMountedRef.current) return;
        
        // Set loading progress to 100%
        setLoadingProgress(100);
        
        // Small delay before showing content for smooth transition
        setTimeout(() => {
          if (isMountedRef.current) {
            safeSetContent(extensionContent);
            safeSetIsLoading(false);
            
            // Start the ceremony after content is loaded
            setCeremonialState(CeremonialState.CeremonyStarted);
          }
        }, 200);
      } catch (err) {
        handleError(err);
      }
    };
    
    fetchContent();
    
    // Clean up animation frame on unmount
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [extension.type, extension.contentId, animateLoadingProgress, handleError, safeSetContent, safeSetError, safeSetIsLoading]);
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);
  
  // Handle ceremony completion
  const handleCeremonyComplete = useCallback(() => {
    if (!isMountedRef.current) return;
    
    setCeremonialState(CeremonialState.CeremonyComplete);
    
    // Longer delay to ensure smooth transition
    setTimeout(() => {
      if (isMountedRef.current) {
        setCeremonialState(CeremonialState.ExtensionActive);
      }
    }, 800);
  }, []);
  
  // Safe version of onComplete
  const handleComplete = useCallback((result: ExtensionResult) => {
    if (!isMountedRef.current) return;
    onCompleteRef.current(result);
  }, []);
  
  // While loading, show a loading indicator
  if (isLoading) {
    return (
      <DialogueContainer 
        mode={DialogueMode.INSTRUCTION}
        title="Loading Extension"
        className="w-full h-32 overflow-hidden"
      >
        <div className="flex flex-col items-center justify-center">
          <div className="relative w-64 h-2 bg-gray-800 rounded-full mb-3 overflow-hidden">
            <div 
              className="absolute left-0 top-0 bottom-0 bg-blue-500 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${loadingProgress}%` }}
            />
          </div>
          <div className="flex items-center">
            <div className="loading-spinner w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-2" />
            <p className="text-sm text-gray-300 font-pixel">Loading {extension.type.replace('-', ' ')}...</p>
          </div>
        </div>
      </DialogueContainer>
    );
  }
  
  // If there was an error, show error display
  if (error) {
    return (
      <DialogueContainer 
        mode={DialogueMode.CRITICAL}
        title="Extension Error"
        className="w-full overflow-hidden"
      >
        <ErrorDisplay 
          message={error} 
          fallbackText={extension.fallbackText || "Sorry, we couldn't load this visualization."}
          onComplete={() => handleComplete({
            success: false,
            accuracy: 0,
            insightGained: 0,
            momentumEffect: 'maintain'
          })}
        />
      </DialogueContainer>
    );
  }
  
  // If no content, show fallback text
  if (!content) {
    return (
      <DialogueContainer 
        mode={DialogueMode.NARRATIVE}
        title="Extension Unavailable"
        className="w-full overflow-hidden"
      >
        <p>{extension.fallbackText || "Extension content not available."}</p>
        <button 
          className="mt-2 px-3 py-1 bg-blue-700 rounded-sm text-white"
          onClick={() => handleComplete({
            success: false,
            accuracy: 0,
            insightGained: 0,
            momentumEffect: 'maintain'
          })}
        >
          Continue
        </button>
      </DialogueContainer>
    );
  }

  // If we're in the ceremony phase, show the challenge ceremony
  if (ceremonialState === CeremonialState.CeremonyStarted) {
    return (
      <ChallengeCeremony
        mentor={characterId}
        challengeType={extension.type}
        ceremonyText={ceremonyText}
        onCeremonyComplete={handleCeremonyComplete}
        domainColor={content.domain && extension.type === 'calculation' ? getDomainColor(content.domain) : undefined}
      />
    );
  }
  
  // If ceremony is complete but extension isn't active yet, show a placeholder
  if (ceremonialState === CeremonialState.CeremonyComplete) {
    return (
      <div className="w-full h-32 flex items-center justify-center">
        <div className="loading-spinner w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  
  // Determine the component to render based on extension type
  switch (extension.type) {
    case 'calculation':
      return (
        <CalculationInterface
          content={content}
          characterId={characterId}
          stageId={stageId}
          additionalProps={extension.additionalProps}
          onComplete={handleComplete}
        />
      );
      
    case 'anatomical-identification':
      return (
        <AnatomicalIdentification
          content={content}
          characterId={characterId}
          stageId={stageId}
          additionalProps={extension.additionalProps}
          onComplete={handleComplete}
        />
      );
      
    case 'equipment-identification':
      return (
        <EquipmentIdentification
          content={content}
          characterId={characterId}
          stageId={stageId}
          additionalProps={extension.additionalProps}
          onComplete={handleComplete}
        />
      );
      
    case 'measurement-reading':
      return (
        <MeasurementReading
          content={content}
          characterId={characterId}
          stageId={stageId}
          additionalProps={extension.additionalProps}
          onComplete={handleComplete}
        />
      );
    
    case 'dosimetric-pattern':
      return (
        <DialogueContainer 
          mode={DialogueMode.INSTRUCTION}
          title="Dosimetric Pattern Recognition"
          className="w-full overflow-hidden"
        >
          <p>This extension is planned for future implementation. It will allow you to recognize characteristic patterns in dose distributions.</p>
          <button 
            className="mt-3 px-3 py-1 bg-blue-700 rounded-sm text-white"
            onClick={() => handleComplete({
              success: false,
              accuracy: 0,
              insightGained: 0,
              momentumEffect: 'maintain'
            })}
          >
            Continue
          </button>
        </DialogueContainer>
      );
      
    case 'treatment-plan':
      return (
        <DialogueContainer 
          mode={DialogueMode.INSTRUCTION}
          title="Treatment Plan Optimization"
          className="w-full overflow-hidden"
        >
          <p>This extension is planned for future implementation. It will allow you to balance target coverage with healthy tissue sparing.</p>
          <button 
            className="mt-3 px-3 py-1 bg-blue-700 rounded-sm text-white"
            onClick={() => handleComplete({
              success: false,
              accuracy: 0,
              insightGained: 0,
              momentumEffect: 'maintain'
            })}
          >
            Continue
          </button>
        </DialogueContainer>
      );
      
    case 'error-identification':
      return (
        <ErrorIdentification
          content={content}
          characterId={characterId}
          stageId={stageId}
          additionalProps={extension.additionalProps}
          onComplete={handleComplete}
        />
      );
      
    // For unknown types, render a placeholder
    default:
      return (
        <DialogueContainer 
          mode={DialogueMode.CRITICAL}
          title="Unknown Extension Type"
          className="w-full overflow-hidden"
        >
          <p className="mb-2">Extension type '{extension.type}' not recognized.</p>
          <p>{extension.fallbackText || "Please continue with text-based interaction."}</p>
          <button 
            className="mt-3 px-3 py-1 bg-blue-700 rounded-sm text-white"
            onClick={() => handleComplete({
              success: false,
              accuracy: 0,
              insightGained: 0,
              momentumEffect: 'maintain'
            })}
          >
            Continue
          </button>
        </DialogueContainer>
      );
  }
};

/**
 * Helper function to get domain color
 */
function getDomainColor(domain: string): string {
  const domainColors: Record<string, string> = {
    'treatment-planning': '#3b82f6', // Blue
    'radiation-therapy': '#10b981', // Green
    'linac-anatomy': '#f59e0b', // Amber
    'dosimetry': '#ec4899', // Pink
  };
  
  return domainColors[domain] || '#3b82f6';
}

export default ExtensionRenderer;