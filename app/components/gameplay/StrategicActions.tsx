// app/components/gameplay/StrategicActions.tsx
'use client';

import React, { useRef, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useResourceStore, StrategicActionType } from '../../store/resourceStore';
import { usePrimitiveStoreValue, useStableStoreValue } from '../../core/utils/storeHooks';
import { PixelText } from '../PixelThemeProvider';
import { playSound } from '../../core/sound/SoundManager.js';

// Type definitions
type ActionTypeProp = StrategicActionType;

interface StrategicActionsProps {
  characterId: string;
  stageId: string;
  className?: string;
  onActionActivate?: (actionType: ActionTypeProp) => void;
  onActionComplete?: (actionType: ActionTypeProp, successful: boolean) => void;
  onActionCancel?: (actionType: ActionTypeProp) => void;
}

// ======== CONSTANTS ========

// insight cost thresholds
const INSIGHT_COSTS: Record<StrategicActionType, number> = {
  tangent: 25,
  reframe: 50,
  peer_review: 75,
  boast: 0 // Boast uses momentum instead of insight
};

// Momentum requirements
const MOMENTUM_REQUIREMENTS: Record<StrategicActionType, number> = {
  tangent: 0,
  reframe: 2,
  peer_review: 0,
  boast: 3 // Max momentum assumed to be 3
};

/**
 * Strategic Actions Component - Refactored with Pattern Implementation
 * 
 * Improvements:
 * - Primitive value extraction
 * - DOM-based hover state
 * - Memoized definitions
 * - Stable references for callbacks
 */
export default function StrategicActions({
  characterId,
  stageId,
  className = '',
  onActionActivate,
  onActionComplete,
  onActionCancel
}: StrategicActionsProps) {
  // Refs for hover tracking via DOM
  const hoveredActionRef = useRef<StrategicActionType | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  
  // PATTERN: Extract primitive values using specialized hooks
  const insight = usePrimitiveStoreValue(useResourceStore, (state: any) => state.insight, 0);
  const activeAction = usePrimitiveStoreValue(
    useResourceStore, 
    (state: any) => state.activeAction as StrategicActionType | null, 
    null
  );
  
  // PATTERN: Extract available actions with stable reference
  const availableActions = useStableStoreValue(
    useResourceStore,
    (state: any) => state.availableActions || {
      tangent: false,
      reframe: false,
      peer_review: false,
      boast: false
    }
  );
  
  // PATTERN: Memoize action definitions for stable reference
  const actionDefinitions = useMemo<Record<StrategicActionType, {
    label: string;
    description: string;
    cost: number;
    bgClass: string;
    borderClass: string;
    iconPath: string;
  }>>(() => ({
    tangent: {
      label: 'Tangent',
      description: 'Swap the current question for a different concept',
      cost: INSIGHT_COSTS.tangent,
      bgClass: 'bg-blue-800',
      borderClass: 'border-blue-900',
      iconPath: "M4,5 L12,13 M12,5 L4,13" // X-shape for swap
    },
    reframe: {
      label: 'Reframe',
      description: 'Change the context of the current problem',
      cost: INSIGHT_COSTS.reframe,
      bgClass: 'bg-purple-800',
      borderClass: 'border-purple-900',
      iconPath: "M4,4 H12 M4,8 H12 M4,12 H10" // Simple text-line icon SVG path
    },
    peer_review: {
      label: 'Peer-Review',
      description: 'Summon a different mentor for a helpful hint',
      cost: INSIGHT_COSTS.peer_review,
      bgClass: 'bg-green-700',
      borderClass: 'border-green-900',
      iconPath: "M5,5 L8,3 L11,5 M8,3 V9 M5,11 L8,13 L11,11" // Person icon
    },
    boast: {
      label: 'Challenge',
      description: 'Take on a high-difficulty alternative',
      cost: INSIGHT_COSTS.boast, // Uses momentum instead
      bgClass: 'bg-orange-700',
      borderClass: 'border-orange-800',
      iconPath: "M8,3 L12,7 L8,11 L4,7 Z" // Diamond shape
    }
  }), []);
  
  // PATTERN: Stable callback for action activation
  const handleActionActivate = useCallback((type: StrategicActionType) => {
    if (onActionActivate) onActionActivate(type);
  }, [onActionActivate]);
  
  // PATTERN: Stable callback for action cancellation  
  const handleActionCancel = useCallback((type: StrategicActionType) => {
    if (onActionCancel) onActionCancel(type);
  }, [onActionCancel]);
  
  // PATTERN: Handle hover state via DOM
  const handleActionHover = useCallback((type: StrategicActionType | null) => {
    // Only update if changed
    if (type === hoveredActionRef.current) return;
    
    hoveredActionRef.current = type;
    
    // Update tooltip visibility via DOM
    if (tooltipRef.current) {
      if (type) {
        const def = actionDefinitions[type];
        tooltipRef.current.innerHTML = `
          <div class="p-3">
            <div class="text-sm font-pixel text-white mb-1">${def.label}</div>
            <div class="text-xs text-gray-300">${def.description}</div>
            ${def.cost > 0 ? 
              `<div class="text-xs mt-1 ${insight >= def.cost ? 'text-blue-300' : 'text-red-300'}">
                Cost: ${def.cost} Insight
              </div>` : 
              `<div class="text-xs mt-1 text-orange-300">
                Requires max momentum
              </div>`
            }
          </div>
        `;
        tooltipRef.current.classList.add('tooltip-visible');
        
        // Position tooltip relative to hovered button
        const buttonEl = document.querySelector(`[data-action-id="${type}"]`);
        if (buttonEl) {
          const rect = buttonEl.getBoundingClientRect();
          tooltipRef.current.style.top = `${rect.bottom + 8}px`;
          tooltipRef.current.style.left = `${rect.left + rect.width/2}px`;
        }
      } else {
        tooltipRef.current.classList.remove('tooltip-visible');
      }
    }
  }, [actionDefinitions, insight]);
  
  // PATTERN: SVG icon component (stable)
  const PixelIcon = useMemo(() => 
    ({ path, className = '' }: { path: string, className?: string }) => (
      <svg 
        width="16" 
        height="16" 
        viewBox="0 0 16 16" 
        fill="none" 
        className={`stroke-white stroke-[1.5px] ${className}`}
        style={{ imageRendering: 'pixelated' }}
      >
        <path d={path} strokeLinecap="square" />
      </svg>
    ),
  []);
  
  // PATTERN: Button component with DOM-based hover handling
  const ActionButton = useMemo(() => 
    ({ type, isAvailable }: { type: StrategicActionType, isAvailable: boolean }) => {
      const def = actionDefinitions[type];
      const isActive = activeAction === type;
      const affordabilityClass = def.cost > 0 && insight < def.cost ? 'opacity-50' : '';
      
      return (
        <motion.button
          data-action-id={type}
          className={`
            w-16 h-16 relative 
            ${def.bgClass} ${def.borderClass}
            border-2 box-content
            flex items-center justify-center
            transition-colors duration-150
            ${isActive ? 'ring-1 ring-white' : ''}
            ${isAvailable ? '' : 'opacity-40'}
            ${affordabilityClass}
            pixel-borders
            action-button
          `}
          disabled={!isAvailable || (def.cost > 0 && insight < def.cost)}
          onClick={() => {
            if (isAvailable) {
              if (def.cost > 0 && insight < def.cost) {
                playSound('error');
              } else {
                handleActionActivate(type);
              }
            } else {
              playSound('error');
            }
          }}
          onMouseEnter={() => handleActionHover(type)}
          onMouseLeave={() => handleActionHover(null)}
          whileHover={{ y: isAvailable ? -2 : 0 }}
          whileTap={{ y: isAvailable ? 1 : 0 }}
          initial={{ scale: 1 }}
          animate={isActive ? { 
            scale: [1, 1.05, 1],
            transition: { repeat: Infinity, duration: 1.5 }
          } : { scale: 1 }}
        >
          <PixelIcon path={def.iconPath} className="w-8 h-8" />
          
          {/* Cost indicator */}
          {def.cost > 0 && (
            <div className="absolute -bottom-1 -right-1 text-sm bg-black/80 px-1 rounded-sm">
              {def.cost}◆
            </div>
          )}
          
          {/* Active indicator pulse */}
          {isActive && (
            <motion.div 
              className="absolute inset-0 bg-white"
              initial={{ opacity: 0 }}
              animate={{ 
                opacity: [0, 0.3, 0],
                transition: { repeat: Infinity, duration: 2 }
              }}
            />
          )}
        </motion.button>
      );
    },
  [actionDefinitions, activeAction, insight, handleActionActivate, handleActionHover, PixelIcon]);
  
  // Clear hover state on unmount
  useEffect(() => {
    return () => {
      hoveredActionRef.current = null;
    };
  }, []);
  
  return (
    <div className={`flex items-center gap-3 ${className} relative`}>
      {availableActions.tangent && <ActionButton type="tangent" isAvailable={availableActions.tangent} />}
      {availableActions.reframe && <ActionButton type="reframe" isAvailable={availableActions.reframe} />}
      {availableActions.peer_review && <ActionButton type="peer_review" isAvailable={availableActions.peer_review} />}
      {availableActions.boast && <ActionButton type="boast" isAvailable={availableActions.boast} />}
      
      {/* Tooltip using DOM-based positioning */}
      <div 
        ref={tooltipRef}
        className="absolute z-50 w-48 bg-gray-900/95 border border-gray-700 pixel-borders-thin shadow-lg transform -translate-x-1/2 tooltip"
      ></div>
      
      {/* Expanded state panel - shows when an action is active */}
      <AnimatePresence>
        {activeAction && (
          <motion.div
            className="absolute top-full right-0 mt-3 bg-gray-900/90 border border-gray-700 
                      pixel-borders shadow-lg z-50"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <div className="p-3 w-48">
              <PixelText className="text-sm mb-2 text-white">
                {activeAction === 'reframe' && 'Reframing Conversation'}
                {activeAction === 'boast' && 'Challenge Mode Active'}
              </PixelText>
              
              <div className="text-xs text-gray-300">
                {activeAction === 'reframe' && 'Simpler topics now available.'}
                {activeAction === 'boast' && 'Expert-level questions with higher rewards.'}
              </div>
              
              {/* Optional cancel button */}
              <button 
                className="mt-2 text-xs text-gray-400 hover:text-white"
                onClick={() => handleActionCancel(activeAction)}
              >
                Cancel (recover cost)
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* CSS for tooltip */}
      <style jsx>{`
        .tooltip {
          opacity: 0;
          visibility: hidden;
          pointer-events: none;
          transform: translate(-50%, 0.5rem) scale(0.95);
          transition: opacity 0.15s ease, transform 0.15s ease, visibility 0.15s;
        }
        
        .tooltip-visible {
          opacity: 1;
          visibility: visible;
          transform: translate(-50%, 0) scale(1);
        }
        
        /* Interactive feedback */
        .action-button {
          position: relative;
        }
        
        .action-button::after {
          content: '';
          position: absolute;
          inset: -2px;
          z-index: -1;
          opacity: 0;
          transition: opacity 0.15s ease;
          border-radius: 2px;
        }
        
        .action-button:not(:disabled):hover::after {
          opacity: 0.3;
          box-shadow: 0 0 12px 4px currentColor;
        }
      `}</style>
    </div>
  );
}

/**
 * Container version with expanded state support
 */
export function StrategicActionsContainer(props: StrategicActionsProps) {
  // PATTERN: Extract primitive value for active action
  const activeAction = usePrimitiveStoreValue(
    useResourceStore, 
    (state: any) => state.activeAction as StrategicActionType | null, 
    null
  );
  
  return (
    <div className="relative">
      <StrategicActions {...props} />
    </div>
  );
}