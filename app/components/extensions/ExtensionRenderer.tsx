// app/components/extensions/ExtensionRenderer.tsx
'use client';

/**
 * Extension Renderer Component
 * 
 * Dynamically renders the appropriate extension component based on the extension type.
 * Handles loading extension content and provides error boundaries.
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

// Import extension components
import CalculationInterface from './types/CalculationInterface';
import AnatomicalIdentification from './types/AnatomicalIdentification';
import EquipmentIdentification from './types/EquipmentIdentification';
import MeasurementReading from './types/MeasurementReading';
import ErrorDisplay from './ui/ErrorDisplay';
import { shallow } from 'zustand/shallow';

// Import extension content data
import { getExtensionContent } from './content/extensionContentRegistry';

interface ExtensionRendererProps {
  extension: ExtensionData;
  characterId: string;
  stageId: string;
  onComplete: (result: ExtensionResult) => void;
}

/**
 * Renders the appropriate extension component based on extension type
 * With optimized loading and error states
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
  
  // Safe version of onComplete
  const handleComplete = useCallback((result: ExtensionResult) => {
    if (!isMountedRef.current) return;
    onCompleteRef.current(result);
  }, []);
  
  // While loading, show a loading indicator
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-32 bg-black/30 rounded-md border border-blue-900/30 overflow-hidden">
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
    );
  }
  
  // If there was an error, show error display
  if (error) {
    return (
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
    );
  }
  
  // If no content, show fallback text
  if (!content) {
    return (
      <div className="p-4 bg-black/30 rounded-md text-gray-200 border border-blue-900/30">
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
        <div className="p-4 bg-black/30 rounded-md text-gray-200 border border-blue-900/30">
          <p className="mb-2 text-blue-300 font-pixel">Dosimetric Pattern Recognition</p>
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
        </div>
      );
      
    case 'treatment-plan':
      return (
        <div className="p-4 bg-black/30 rounded-md text-gray-200 border border-blue-900/30">
          <p className="mb-2 text-blue-300 font-pixel">Treatment Plan Optimization</p>
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
        </div>
      );
      
    case 'error-identification':
      return (
        <div className="p-4 bg-black/30 rounded-md text-gray-200 border border-blue-900/30">
          <p className="mb-2 text-blue-300 font-pixel">Error Identification</p>
          <p>This extension is planned for future implementation. It will allow you to spot mistakes in setups or calculations.</p>
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
        </div>
      );
      
    // For unknown types, render a placeholder
    default:
      return (
        <div className="p-4 bg-black/30 rounded-md text-gray-200 border border-blue-900/30">
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
        </div>
      );
  }
};

export default ExtensionRenderer;