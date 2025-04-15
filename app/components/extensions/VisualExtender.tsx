// app/components/extensions/VisualExtender.tsx
'use client';

/**
 * Visual Extender HOC
 * 
 * A higher-order component that enables visual extensions for conversation formats.
 * Implements Chamber Pattern optimization for performance.
 * 
 * Core Principles:
 * - Dialogue First: Maintain dialogue as the backbone
 * - Progressive Enhancement: Extensions augment rather than replace
 * - Educational Integration: Reinforces specific medical physics concepts
 * - Performance Optimization: Applies Chamber Pattern consistently
 * - Cohesive Experience: Extensions feel like natural parts of mentorship
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useResourceStore } from '../../store/resourceStore';
import { useKnowledgeStore } from '../../store/knowledgeStore';
import { usePrimitiveStoreValue } from '../../core/utils/storeHooks';
import { safeDispatch } from '../../core/events/CentralEventBus';
import { GameEventType } from '../../core/events/EventTypes';
import ExtensionRenderer from './ExtensionRenderer';

// Types for the extension data
export interface ExtensionData {
  type: ExtensionType;
  contentId: string;
  interactionRequired?: boolean;
  fallbackText?: string;
  additionalProps?: Record<string, any>;
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

    // Extract primitive values for resource management
    const insight = usePrimitiveStoreValue(
      useResourceStore,
      state => state.insight,
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
              0%, 100% { border-color: rgba(59, 130, 246, 0.3); }
              50% { border-color: rgba(59, 130, 246, 0.8); }
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

export default withVisualExtender;