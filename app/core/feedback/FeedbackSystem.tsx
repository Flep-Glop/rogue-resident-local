'use client';

import React, { useRef, useEffect, useState, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useEventSubscription } from '@/app/core/events/CentralEventBus';
import { GameEventType, FeedbackMessagePayload, ResourceChangedPayload, MomentumEffectPayload } from '@/app/core/events/EventTypes';
import InsightParticles from '@/app/components/effects/InsightParticles';
import MomentumParticles from '@/app/components/effects/MomentumParticles';

export interface FeedbackSystemProps {
  targetInsightRef?: React.RefObject<HTMLElement>;
  targetMomentumRef?: React.RefObject<HTMLElement>;
}

/**
 * Centralized Feedback System
 * 
 * This component listens for resource and feedback events and displays
 * appropriate visual feedback to the player.
 * 
 * Updated to fix infinite loops and properly handle position references.
 */
export default function FeedbackSystem({
  targetInsightRef,
  targetMomentumRef
}: FeedbackSystemProps) {
  // Track message queue to handle multiple messages
  const [messages, setMessages] = useState<Array<{
    id: string;
    message: string;
    type: string;
    timestamp: number;
  }>>([]);
  
  // Track resource effects
  const [insightEffect, setInsightEffect] = useState<{
    active: boolean;
    amount: number;
    source: string;
  }>({ active: false, amount: 0, source: '' });
  
  const [momentumEffect, setMomentumEffect] = useState<{
    active: boolean;
    effect: 'increment' | 'reset' | 'maintain';
    source: string;
  }>({ active: false, effect: 'maintain', source: '' });
  
  // Track positions for effects
  const [clickPosition, setClickPosition] = useState<{ x: number; y: number } | null>(null);
  const [showInsightParticles, setShowInsightParticles] = useState(false);
  const [showMomentumParticles, setShowMomentumParticles] = useState(false);
  
  // Refs for element positions with proper initialization
  const insightPositionRef = useRef<{ x: number; y: number }>({ 
    x: typeof window !== 'undefined' ? window.innerWidth / 2 : 0, 
    y: typeof window !== 'undefined' ? 150 : 0 
  });
  
  const momentumPositionRef = useRef<{ x: number; y: number }>({ 
    x: typeof window !== 'undefined' ? window.innerWidth / 2 : 0, 
    y: typeof window !== 'undefined' ? 100 : 0 
  });
  
  // Default fallback position - memoized to prevent re-creation
  const defaultPosition = useMemo(() => ({ 
    x: typeof window !== 'undefined' ? window.innerWidth / 2 : 0, 
    y: typeof window !== 'undefined' ? window.innerHeight / 2 : 0 
  }), []);

  // Flags to track if we've found UI elements, to prevent unnecessary DOM queries
  const foundInsightMeterRef = useRef(false);
  const foundMomentumCounterRef = useRef(false);
  
  // Initialize element positions - with safeguards to prevent infinite updates
  useEffect(() => {
    const updatePositions = () => {
      let insightUpdated = false;
      let momentumUpdated = false;
      
      // Find insight meter position
      if (targetInsightRef?.current) {
        const rect = targetInsightRef.current.getBoundingClientRect();
        insightPositionRef.current = {
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2
        };
        foundInsightMeterRef.current = true;
        insightUpdated = true;
      } else if (!foundInsightMeterRef.current) {
        // Try to find by class/data-testid
        const insightMeter = document.querySelector('.insight-meter') || 
                            document.querySelector('[data-testid="insight-meter"]');
        if (insightMeter) {
          const rect = insightMeter.getBoundingClientRect();
          insightPositionRef.current = {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2
          };
          foundInsightMeterRef.current = true;
          insightUpdated = true;
        }
      }
      
      // Find momentum counter position
      if (targetMomentumRef?.current) {
        const rect = targetMomentumRef.current.getBoundingClientRect();
        momentumPositionRef.current = {
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2
        };
        foundMomentumCounterRef.current = true;
        momentumUpdated = true;
      } else if (!foundMomentumCounterRef.current) {
        // Try to find by class/data-testid
        const momentumCounter = document.querySelector('.momentum-counter') ||
                              document.querySelector('[data-testid="momentum-counter"]');
        if (momentumCounter) {
          const rect = momentumCounter.getBoundingClientRect();
          momentumPositionRef.current = {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2
          };
          foundMomentumCounterRef.current = true;
          momentumUpdated = true;
        }
      }
      
      // Only log if something actually changed
      if (insightUpdated) {
        console.log("[FeedbackSystem] Insight position updated:", insightPositionRef.current);
      }
      
      if (momentumUpdated) {
        console.log("[FeedbackSystem] Momentum position updated:", momentumPositionRef.current);
      }
    };
    
    // Initial update
    updatePositions();
    
    // Update on resize
    window.addEventListener('resize', updatePositions);
    
    // Set periodic updates at a reasonable interval
    const intervalId = setInterval(updatePositions, 5000);
    
    return () => {
      window.removeEventListener('resize', updatePositions);
      clearInterval(intervalId);
    };
  }, [targetInsightRef, targetMomentumRef]);
  
  // Handle feedback messages
  useEventSubscription<FeedbackMessagePayload>(
    GameEventType.FEEDBACK_MESSAGE,
    (event) => {
      if (!event.payload || !event.payload.message) return;
      
      const newMessage = {
        id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        message: event.payload.message,
        type: event.payload.type || 'resource',
        timestamp: Date.now()
      };
      
      setMessages(prev => [...prev, newMessage]);
      
      // Clean up message after duration
      const duration = event.payload.duration || 3000;
      setTimeout(() => {
        setMessages(prev => prev.filter(m => m.id !== newMessage.id));
      }, duration);
    },
    []
  );
  
  // Handle insight gained events
  useEventSubscription<ResourceChangedPayload>(
    GameEventType.INSIGHT_GAINED,
    (event) => {
      if (!event.payload || event.payload.change <= 0) return;
      
      // Activate insight effect
      setInsightEffect({
        active: true,
        amount: event.payload.change,
        source: event.payload.source || 'unknown'
      });
      
      // Show particles with a slight delay
      setTimeout(() => {
        setShowInsightParticles(true);
      }, 200);
      
      // Reset effect state after animation
      setTimeout(() => {
        setInsightEffect({
          active: false,
          amount: 0,
          source: ''
        });
        setShowInsightParticles(false);
      }, 3000);
    },
    []
  );
  
  // Handle momentum effects
  useEventSubscription<MomentumEffectPayload>(
    GameEventType.MOMENTUM_EFFECT,
    (event) => {
      if (!event.payload) return;
      
      // Activate momentum effect
      setMomentumEffect({
        active: true,
        effect: event.payload.effect,
        source: event.payload.source || 'unknown'
      });
      
      // Show particles for momentum increases
      if (event.payload.effect === 'increment') {
        setTimeout(() => {
          setShowMomentumParticles(true);
        }, 200);
      }
      
      // Reset effect state after animation
      setTimeout(() => {
        setMomentumEffect({
          active: false,
          effect: 'maintain',
          source: ''
        });
        setShowMomentumParticles(false);
      }, 3000);
    },
    []
  );
  
  // Track UI interactions for position
  useEventSubscription(
    GameEventType.UI_OPTION_SELECTED,
    (event) => {
      if (event.payload?.position) {
        setClickPosition(event.payload.position);
      }
    },
    []
  );
  
  // Memoize insight and momentum particle components to avoid unnecessary re-renders
  const insightParticlesComponent = useMemo(() => {
    if (!showInsightParticles) return null;
    
    return (
      <InsightParticles
        originPosition={clickPosition || defaultPosition}
        targetPosition={insightPositionRef.current}
        amount={insightEffect.amount}
      />
    );
  }, [showInsightParticles, clickPosition, defaultPosition, insightEffect.amount]);
  
  const momentumParticlesComponent = useMemo(() => {
    if (!showMomentumParticles) return null;
    
    return (
      <MomentumParticles
        originPosition={clickPosition || defaultPosition}
        targetPosition={momentumPositionRef.current}
        effect={momentumEffect.effect}
      />
    );
  }, [showMomentumParticles, clickPosition, defaultPosition, momentumEffect.effect]);
  
  return (
    <>
      {/* Message feedback display */}
      <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50 pointer-events-none">
        <AnimatePresence>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              className={`mb-4 px-4 py-2 rounded-lg shadow-lg font-pixel text-white text-center
                ${msg.type === 'resource' ? 'bg-blue-600/90' : 
                 msg.type === 'error' ? 'bg-red-600/90' : 
                 msg.type === 'success' ? 'bg-green-600/90' : 
                 msg.type === 'knowledge' ? 'bg-purple-600/90' : 'bg-gray-800/90'}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {msg.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      
      {/* Resource effect animations - use memoized components */}
      {insightParticlesComponent}
      {momentumParticlesComponent}
      
      {/* Debug indicators (dev only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed top-0 right-0 p-2 bg-black/50 text-white text-xs z-50">
          <div>Insight Pos: {JSON.stringify(insightPositionRef.current)}</div>
          <div>Momentum Pos: {JSON.stringify(momentumPositionRef.current)}</div>
        </div>
      )}
    </>
  );
}

/**
 * Hook to get a ref to the FeedbackSystem
 */
export function useFeedbackSystem() {
  const ref = useRef(null);
  return ref;
} 