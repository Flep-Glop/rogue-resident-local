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
// Import theme components
import { PixelBox, PixelButton, PixelText } from '../PixelThemeProvider'; 
// Import theme utilities
import { getExtensionClasses } from '@/app/utils/themeUtils';

// Types for the extension data
export interface ExtensionData {
  type: ExtensionType;
  contentId: string;
  interactionRequired?: boolean;
  fallbackText?: string;
  additionalProps?: Record<string, any>;
  conversationText?: string; // The conversation text to display in the ceremony
  dialogueMode?: DialogueMode; // Add support for DialogueMode
  onCompleteStageId?: string; // Stage ID to navigate to when extension completes
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

      // Check if we need to auto-navigate to the next stage
      const extension = (props as any).extension;
      if (extension && extension.onCompleteStageId) {
        // Use the dialogue state machine to navigate
        const dialogueStateMachine = require('../../core/dialogue/DialogueStateMachine');
        if (dialogueStateMachine && dialogueStateMachine.useDialogueFunctions) {
          const { navigateToState } = dialogueStateMachine.useDialogueFunctions.getState();
          if (typeof navigateToState === 'function') {
            navigateToState(extension.onCompleteStageId);
          }
        }
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

  // Get extension theme classes
  const themeClasses = getExtensionClasses(extension.type);

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
          initial={{ opacity: 0, y: 0 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 0 }}
          transition={{ duration: 0.3 }}
          className={`extension-container p-0 m-0 ${className}`}
          style={{ 
            marginTop: -10, // Increase negative margin to eliminate the space
            paddingTop: 0,
            position: 'relative',
            zIndex: 20
          }}
        >
          <ExtensionRenderer
            extension={extension}
            characterId={characterId}
            stageId={stageId}
            onComplete={onComplete}
          />
          
          <style jsx>{`
            .extension-container {
              background: transparent;
              position: relative;
              transition: all 0.3s ease;
              margin: 0;
              padding: 0;
            }
            
            .extension-entrance {
              animation: pulse-border 1.5s ease-in-out;
            }
            
            @keyframes pulse-border {
              0%, 100% { box-shadow: 0 0 0 0 ${themeClasses.accent}00; }
              50% { box-shadow: 0 0 20px 2px ${themeClasses.accent}30; }
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
  // Get theme classes for styling the indicator
  const themeClasses = getExtensionClasses(extensionType);
  
  return (
    <button 
      onClick={onClick}
      className={`
        flex items-center justify-center
        w-9 h-9 rounded-full
        ${themeClasses.bgColor} text-white
        ${active ? 'animate-pulse' : ''}
        shadow-lg transition-all duration-300
        hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
      `}
      style={{ backgroundColor: themeClasses.accent }}
    >
      <span className="sr-only">Interactive Challenge Available</span>
    </button>
  );
};

export default withVisualExtender;