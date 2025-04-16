// app/components/extensions/VisualExtender.tsx
'use client';

/**
 * Visual Extender HOC
 * 
 * A higher-order component that enables visual extensions for conversation formats.
 * Implements Chamber Pattern optimization for performance.
 * Enhanced with ceremonial transitions for better user experience.
 * 
 * Core Principles:
 * - Dialogue First: Maintain dialogue as the backbone
 * - Progressive Enhancement: Extensions augment rather than replace
 * - Educational Integration: Reinforces specific medical physics concepts
 * - Performance Optimization: Applies Chamber Pattern consistently
 * - Cohesive Experience: Extensions feel like natural parts of mentorship
 * - Ceremonial Transitions: Clear signposting between dialogue and challenges
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useResourceStore } from '../../store/resourceStore';
import { useKnowledgeStore } from '../../store/knowledgeStore';
import { usePrimitiveStoreValue } from '../../core/utils/storeHooks';
import { safeDispatch } from '../../core/events/CentralEventBus';
import { GameEventType } from '../../core/events/EventTypes';
import ExtensionRenderer from './ExtensionRenderer';
import DialogueContainer, { DialogueMode } from '../dialogue/DialogueContainer';

// Types for the extension data
export interface ExtensionData {
  type: ExtensionType;
  contentId: string;
  interactionRequired?: boolean;
  fallbackText?: string;
  additionalProps?: Record<string, any>;
  conversationText?: string; // The conversation text to display in the ceremony
  dialogueMode?: DialogueMode; // Add support for DialogueMode
}

// Extension types
export type ExtensionType = 
  | 'calculation'
  | 'anatomical-identification'
  | 'equipment-identification'
  | 'dosimetric-pattern'
  | 'treatment-plan'
  | 'measurement-reading'
  | 'error-identification';

// Result from extension interaction
export interface ExtensionResult {
  success: boolean;
  accuracy: number; // How close to perfect (0-1)
  insightGained: number;
  momentumEffect: 'increment' | 'reset' | 'maintain';
  knowledgeGained?: {
    conceptId: string;
    amount: number;
  };
  message?: string;
  details?: Record<string, any>;
}

// HOC props
export interface VisualExtenderProps {
  characterId: string;
  stageId: string;
  onExtensionComplete?: (result: ExtensionResult) => void;
  onExtensionStart?: () => void;
}

// Component to wrap
export interface WithExtensionProps {
  extension?: ExtensionData;
  extensionResult?: ExtensionResult | null;
  isExtensionActive: boolean;
  onExtensionComplete?: (result: ExtensionResult) => void;
  onExtensionStart?: () => void;
}

// Extension type to DialogueMode mapping
export const extensionTypeToDialogueMode: Record<ExtensionType, DialogueMode> = {
  'calculation': DialogueMode.CHALLENGE_INTRO,
  'anatomical-identification': DialogueMode.CHALLENGE_INTRO,
  'equipment-identification': DialogueMode.CHALLENGE_INTRO,
  'dosimetric-pattern': DialogueMode.CHALLENGE_INTRO,
  'treatment-plan': DialogueMode.CHALLENGE_INTRO,
  'measurement-reading': DialogueMode.CHALLENGE_INTRO,
  'error-identification': DialogueMode.CHALLENGE_INTRO
};

/**
 * Higher-Order Component that adds visual extension capabilities to conversation components
 * Implements Chamber Pattern for optimal performance:
 * 1. Primitive value extraction
 * 2. Stable function references
 * 3. DOM-based animations
 * 4. Atomic state updates
 * 5. Defensive programming
 */
export const withVisualExtender = <P extends object>(
  WrappedComponent: React.ComponentType<P & WithExtensionProps>
) => {
  return function VisualExtenderComponent(props: P & VisualExtenderProps) {
    // Refs for tracking mounted state
    const isMountedRef = useRef(true);
    const previousResultRef = useRef<ExtensionResult | null>(null);
    
    // Local state
    const [isExtensionActive, setIsExtensionActive] = useState(false);
    const [extensionResult, setExtensionResult] = useState<ExtensionResult | null>(null);
    const [showAttentionIndicator, setShowAttentionIndicator] = useState(false);

    // Extract primitive values for resource management
    const insight = usePrimitiveStoreValue(
      useResourceStore,
      (state: any) => state.insight,
      0
    );

    // Function refs to prevent dependency cycles
    const onCompleteRef = useRef(props.onExtensionComplete);
    const onStartRef = useRef(props.onExtensionStart);

    // Update refs when props change
    useEffect(() => {
      onCompleteRef.current = props.onExtensionComplete;
      onStartRef.current = props.onExtensionStart;
    }, [props.onExtensionComplete, props.onExtensionStart]);

    // Handle extension completion
    const handleExtensionComplete = useCallback((result: ExtensionResult) => {
      if (!isMountedRef.current) return;

      // Store result
      setExtensionResult(result);
      setIsExtensionActive(false);
      previousResultRef.current = result;
      
      // Dispatch event
      safeDispatch(
        GameEventType.EXTENSION_COMPLETED,
        {
          characterId: props.characterId,
          stageId: props.stageId,
          success: result.success,
          insightGained: result.insightGained,
          momentumEffect: result.momentumEffect,
          knowledgeGained: result.knowledgeGained
        },
        'VisualExtender'
      );

      // Apply resource effects
      if (result.insightGained > 0) {
        useResourceStore.getState().updateInsight(result.insightGained, 'extension');
      }

      // Apply momentum effect
      if (result.momentumEffect === 'increment') {
        useResourceStore.getState().incrementMomentum();
      } else if (result.momentumEffect === 'reset') {
        useResourceStore.getState().resetMomentum();
      }

      // Apply knowledge gain
      if (result.knowledgeGained) {
        useKnowledgeStore.getState().updateMastery(
          result.knowledgeGained.conceptId,
          result.knowledgeGained.amount
        );
      }

      // Call provided callback if exists
      if (onCompleteRef.current) {
        onCompleteRef.current(result);
      }
    }, [props.characterId, props.stageId]);

    // Handle extension activation
    const handleExtensionStart = useCallback(() => {
      if (!isMountedRef.current) return;
      
      setIsExtensionActive(true);
      setExtensionResult(null);
      
      // Dispatch event
      safeDispatch(
        GameEventType.EXTENSION_STARTED,
        {
          characterId: props.characterId,
          stageId: props.stageId
        },
        'VisualExtender'
      );

      // Call provided callback if exists
      if (onStartRef.current) {
        onStartRef.current();
      }
    }, [props.characterId, props.stageId]);

    // Show attention indicator when an extension is available
    useEffect(() => {
      // Only show the indicator if we have an extension that hasn't been activated yet
      if ((props as any).extension && !isExtensionActive && !extensionResult) {
        setShowAttentionIndicator(true);
        
        // Create a subtle pulse animation for the indicator
        const pulseInterval = setInterval(() => {
          if (isMountedRef.current) {
            setShowAttentionIndicator(false);
            setTimeout(() => {
              if (isMountedRef.current) {
                setShowAttentionIndicator(true);
              }
            }, 500);
          }
        }, 3000);
        
        return () => clearInterval(pulseInterval);
      } else {
        setShowAttentionIndicator(false);
      }
    }, [(props as any).extension, isExtensionActive, extensionResult]);

    // Clean up on unmount
    useEffect(() => {
      return () => {
        isMountedRef.current = false;
      };
    }, []);

    // Pass extended props to wrapped component
    return (
      <WrappedComponent
        {...props}
        isExtensionActive={isExtensionActive}
        extensionResult={extensionResult}
        onExtensionComplete={handleExtensionComplete}
        onExtensionStart={handleExtensionStart}
      />
    );
  };
};

/**
 * ConversationExtension component for rendering visual extensions 
 * within the conversation format
 */
interface ConversationExtensionProps {
  extension: ExtensionData;
  characterId: string;
  stageId: string;
  isActive: boolean;
  className?: string;
  onComplete: (result: ExtensionResult) => void;
}

export const ConversationExtension: React.FC<ConversationExtensionProps> = ({
  extension,
  characterId,
  stageId,
  isActive,
  className = '',
  onComplete
}) => {
  // Mount tracking ref
  const isMountedRef = useRef(true);
  const containerRef = useRef<HTMLDivElement>(null);

  // Get the appropriate DialogueMode for the extension
  const dialogueMode = extension.dialogueMode || extensionTypeToDialogueMode[extension.type] || DialogueMode.CHALLENGE_INTRO;

  // Handle animation transitions with DOM manipulation
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    if (isActive) {
      // Apply entrance animation class
      container.classList.add('extension-entrance');
      
      // Remove class after animation completes
      const timer = setTimeout(() => {
        if (container && isMountedRef.current) {
          container.classList.remove('extension-entrance');
        }
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [isActive]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Insert animation container for extensions
  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          ref={containerRef}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.3 }}
          className={`extension-container ${className}`}
        >
          <ExtensionRenderer
            extension={extension}
            characterId={characterId}
            stageId={stageId}
            onComplete={onComplete}
          />
          
          <style jsx>{`
            @keyframes pulse-border {
              0%, 100% { border-color: rgba(59,130,246,0.3); }
              50% { border-color: rgba(59,130,246,0.8); }
            }
            
            .extension-entrance {
              animation: pulse-border 1.5s ease-in-out;
              box-shadow: 0 0 20px rgba(59, 130, 246, 0.3);
            }
          `}</style>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

/**
 * AttentionIndicator component for signaling the presence of an extension
 */
interface AttentionIndicatorProps {
  extensionType: ExtensionType;
  onClick: () => void;
  active: boolean;
}

export const AttentionIndicator: React.FC<AttentionIndicatorProps> = ({
  extensionType,
  onClick,
  active
}) => {
  // Type-specific styling
  const typeStyles: Record<ExtensionType, { color: string, icon: React.ReactNode }> = {
    'calculation': {
      color: 'bg-pink-500', // Dosimetry (Pink)
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 7h16M4 12h16M4 17h10" strokeLinecap="round" />
        </svg>
      )
    },
    'anatomical-identification': {
      color: 'bg-blue-500', // Treatment Planning (Blue)
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 4v16M20 12H4" strokeLinecap="round" />
          <circle cx="12" cy="12" r="8" strokeDasharray="50.26" strokeDashoffset="25.13" />
        </svg>
      )
    },
    'equipment-identification': {
      color: 'bg-amber-500', // Linac Anatomy (Amber)
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="4" y="4" width="16" height="16" rx="2" />
          <path d="M9 9h6v6H9z" />
          <path d="M4 12h3M17 12h3M12 4v3M12 17v3" strokeLinecap="round" />
        </svg>
      )
    },
    'measurement-reading': {
      color: 'bg-pink-500', // Dosimetry (Pink)
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M2 12h20M12 2v20" strokeDasharray="2" />
          <circle cx="12" cy="12" r="8" />
          <path d="M12 8v4l2 2" strokeLinecap="round" />
        </svg>
      )
    },
    'dosimetric-pattern': {
      color: 'bg-pink-500', // Dosimetry (Pink)
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 4v16h16" strokeLinecap="round" />
          <path d="M7 15c1.5-3 3-4 4-4s2.5 1 4 4c1.5 3 3 4 4 4" strokeLinecap="round" />
        </svg>
      )
    },
    'treatment-plan': {
      color: 'bg-blue-500', // Treatment Planning (Blue)
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M5 7a4 4 0 014-4h6a4 4 0 014 4v10a4 4 0 01-4 4H9a4 4 0 01-4-4V7z" />
          <path d="M8 12h8M8 8h8M8 16h6" strokeLinecap="round" />
        </svg>
      )
    },
    'error-identification': {
      color: 'bg-green-500', // Radiation Therapy (Green)
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 8v4M12 16h.01" strokeLinecap="round" />
        </svg>
      )
    }
  };
  
  const style = typeStyles[extensionType] || typeStyles.calculation;
  
  return (
    <button 
      onClick={onClick}
      className={`
        flex items-center justify-center
        w-9 h-9 rounded-full
        ${style.color} text-white
        ${active ? 'animate-pulse' : ''}
        shadow-lg transition-all duration-300
        hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
      `}
    >
      {style.icon}
      <span className="sr-only">Interactive Challenge Available</span>
    </button>
  );
};

export default withVisualExtender;