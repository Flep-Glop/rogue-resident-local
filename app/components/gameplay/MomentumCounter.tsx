// app/components/gameplay/MomentumCounter.tsx
'use client';
import React, { useEffect, useRef, useMemo, useCallback } from 'react';
import { useResourceStore } from '../../store/resourceStore';
import { usePrimitiveStoreValue } from '../../core/utils/storeHooks';
import { useEventSubscription } from '../../core/events/CentralEventBus';
import { GameEventType, ResourceChangedPayload } from '../../core/events/EventTypes';

// Constants for max momentum (could eventually be read from store if dynamic)
const MAX_MOMENTUM = 3;

interface MomentumCounterProps {
  showLabel?: boolean;
  className?: string;
  compact?: boolean;
}

/**
 * Momentum Counter Component - Rewritten for Reliability (v2 - Linter Fixes)
 *
 * Focuses on directly reflecting the Zustand store state using primitive values
 * and CSS class manipulation for visual updates, inspired by InsightMeter.tsx.
 * Event subscriptions are used primarily for triggering short visual effects (gain/loss pulse).
 */
export default function MomentumCounter({
  showLabel = true,
  className = '',
  compact = false,
}: MomentumCounterProps) {
  // --- State Reading ---
  const momentum = usePrimitiveStoreValue(useResourceStore, (state: any) => state.momentum, 0);
  const maxMomentum = MAX_MOMENTUM; // Using constant for simplicity

  const pipsContainerRef = useRef<HTMLDivElement>(null);
  const timeoutRefs = useRef<NodeJS.Timeout[]>([]);

  // --- Visual State Update ---
  // This effect directly updates pip classes based on the current momentum state
  useEffect(() => {
    console.log(`[MomentumCounter] useEffect detected momentum change: ${momentum}`);
    const pips = pipsContainerRef.current?.querySelectorAll('.mc-pip');
    if (!pips) return;

    for (let i = 0; i < maxMomentum; i++) {
      const pip = pips[i];
      if (pip) {
        pip.classList.remove('mc-level-0', 'mc-level-1', 'mc-level-2', 'mc-level-3', 'mc-filled', 'mc-empty', 'mc-max');
        if (i < momentum) {
          pip.classList.add('mc-filled');
          pip.classList.add(`mc-level-${i + 1}`);
          if (i === maxMomentum - 1) {
            pip.classList.add('mc-max');
          }
        } else {
          pip.classList.add('mc-empty');
          pip.classList.add('mc-level-0');
        }
      }
    }
    
    if (momentum === 0) {
      console.log('[MomentumCounter] Momentum reset to 0, all pips empty');
    }
  }, [momentum, maxMomentum]); // Rerun whenever momentum changes

  // --- Event-Based Animations ---
  const clearAllTimeouts = useCallback(() => {
    timeoutRefs.current.forEach(clearTimeout);
    timeoutRefs.current = [];
  }, []);

  // Helper to trigger short-lived animation classes
  const triggerPipAnimation = useCallback((pipIndex: number, animationClass: string, duration: number = 500) => {
    const pips = pipsContainerRef.current?.querySelectorAll('.mc-pip');
    if (pips && pipIndex >= 0 && pipIndex < pips.length) {
      const pip = pips[pipIndex];
      if (pip) {
          pip.classList.add(animationClass);
          const timer = setTimeout(() => {
             if (pipsContainerRef.current && pip) {
                 pip.classList.remove(animationClass);
             }
          }, duration);
          timeoutRefs.current.push(timer);
      } else {
           console.warn(`[MomentumCounter] Pip at index ${pipIndex} not found for animation ${animationClass}`);
      }
    }
  }, []);

  // Listen for MOMENTUM_INCREASED to trigger gain animation
  useEventSubscription<ResourceChangedPayload>(
    GameEventType.MOMENTUM_INCREASED,
    (event) => {
      if (!event.payload) return;
      console.log(`[MomentumCounter] Event: MOMENTUM_INCREASED to ${event.payload.newValue}`);
      clearAllTimeouts();
      triggerPipAnimation(event.payload.newValue - 1, 'mc-animate-gain', 500);
    },
    [clearAllTimeouts, triggerPipAnimation]
  );

  // Listen for MOMENTUM_RESET to trigger reset animation
  useEventSubscription<ResourceChangedPayload>(
    GameEventType.MOMENTUM_RESET,
    (event) => {
      if (!event.payload) return;
       console.log(`[MomentumCounter] Event: MOMENTUM_RESET from ${event.payload.previousValue}`);
      clearAllTimeouts();
      for(let i = 0; i < event.payload.previousValue; i++) {
          triggerPipAnimation(i, 'mc-animate-reset', 800);
      }
      const container = pipsContainerRef.current?.parentElement;
       if (container) {
           container.classList.add('mc-animate-container-reset');
           const timer = setTimeout(() => {
               if (pipsContainerRef.current) {
                    container.classList.remove('mc-animate-container-reset');
               }
            }, 800);
           timeoutRefs.current.push(timer);
       }
    },
    [clearAllTimeouts, triggerPipAnimation]
  );

  // Clean up timeouts on unmount
  useEffect(() => {
     console.log('%c[MomentumCounter] MOUNTED', 'color: green; font-weight: bold;');
    return () => {
      console.log('%c[MomentumCounter] UNMOUNTING', 'color: red; font-weight: bold;');
      clearAllTimeouts();
    };
  }, [clearAllTimeouts]);

  // --- Rendering ---
  const pips = useMemo(() => Array.from({ length: maxMomentum }), [maxMomentum]);

  return (
    <div className={`${className} relative mc-counter`} data-testid="momentum-counter">
      {showLabel && (
        <div className="mb-1 font-pixel text-base text-orange-300">
          {!compact ? 'MOMENTUM' : ''}
        </div>
      )}

      <div className="flex space-x-1 items-center" ref={pipsContainerRef}>
        {pips.map((_, index) => (
          <div
            key={`pip-${index}`}
            data-pip-index={index}
            className={`mc-pip mc-level-0 mc-empty ${compact ? 'w-3 h-3' : 'w-4 h-4'}`}
          >
            <div className="mc-inner-pip"></div>
          </div>
        ))}
      </div>

       {momentum === maxMomentum && !compact && (
          <div className="mt-1 text-xs font-pixel text-orange-300 font-bold mc-animate-max-indicator">
            MAX!
          </div>
        )}

      {/* CSS Definitions using unique class names */}
      <style jsx>{`
        .mc-pip {
          border-radius: 50%;
          border: 1px solid #fdba74; /* orange-300 */
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background-color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
        }
        .mc-pip.mc-empty {
          background-color: rgba(0, 0, 0, 0.5); /* Darker empty */
          border-color: #78350f; /* orange-900 */
        }
        .mc-pip.mc-empty .mc-inner-pip {
            background-color: transparent;
        }

        .mc-pip.mc-filled {
          background-color: #ea580c; /* orange-600 */
          border-color: #f97316; /* orange-500 */
          box-shadow: 0 0 4px 1px rgba(251, 146, 60, 0.6); /* orange-400 */
        }
        .mc-pip.mc-filled.mc-level-1 {
           background-color: #c2410c; /* orange-700 */
           border-color: #ea580c; /* orange-600 */
           box-shadow: 0 0 3px 1px rgba(234, 88, 12, 0.5);
        }
         .mc-pip.mc-filled.mc-level-2 {
           background-color: #ea580c; /* orange-600 */
           border-color: #f97316; /* orange-500 */
           box-shadow: 0 0 5px 1px rgba(251, 146, 60, 0.7);
         }
        .mc-pip.mc-filled.mc-level-3 {
          background-color: #f97316; /* orange-500 */
          border-color: #fb923c; /* orange-400 */
          box-shadow: 0 0 8px 2px rgba(253, 186, 116, 0.8); /* orange-300 */
        }
        .mc-pip.mc-filled.mc-max {
            animation: mc-max-pip-pulse 1.5s infinite ease-in-out;
        }

        .mc-inner-pip {
           width: 30%;
           height: 30%;
           border-radius: 50%;
           background-color: rgba(255, 255, 255, 0); /* Transparent initially */
           transition: background-color 0.2s ease;
        }
        .mc-pip.mc-filled .mc-inner-pip {
           background-color: rgba(255, 255, 255, 0.5);
        }
        .mc-pip.mc-filled.mc-level-3 .mc-inner-pip {
           background-color: rgba(255, 255, 255, 0.8);
        }

        /* --- Animations --- */
        @keyframes mc-gain-pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.4); opacity: 0.7; }
          100% { transform: scale(1); opacity: 1; }
        }
        .mc-animate-gain {
          animation: mc-gain-pulse 0.5s ease-out;
        }

        @keyframes mc-reset-flicker {
          0% { opacity: 1; background-color: #c2410c; transform: scale(1); }
          25% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; background-color: #7f1d1d; }
          75% { opacity: 0.5; transform: scale(1.1); }
          100% { opacity: 1; background-color: #c2410c; transform: scale(1); }
        }
       .mc-animate-reset {
          animation: mc-reset-flicker 0.8s ease-in-out;
       }

       @keyframes mc-max-pip-pulse {
          0%, 100% { box-shadow: 0 0 8px 2px rgba(253, 186, 116, 0.8); filter: brightness(1.0); }
          50% { box-shadow: 0 0 14px 4px rgba(253, 186, 116, 1); filter: brightness(1.2); }
       }

        @keyframes mc-max-indicator-pulse {
          0%, 100% { opacity: 0.8; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.05); }
        }
       .mc-animate-max-indicator {
            animation: mc-max-indicator-pulse 1.5s infinite ease-in-out;
       }

       @keyframes mc-container-shake {
         0%, 100% { transform: translateX(0); }
         10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
         20%, 40%, 60%, 80% { transform: translateX(2px); }
       }
       .mc-animate-container-reset {
          animation: mc-container-shake 0.8s cubic-bezier(.36,.07,.19,.97) both;
       }
      `}</style>
    </div>
  );
}