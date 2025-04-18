'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PixelText } from '../PixelThemeProvider';
import { useEventSubscription } from '../../core/events/CentralEventBus';
import { GameEventType } from '../../core/events/EventTypes';
import InsightParticles from '../effects/InsightParticles';
import MomentumParticles from '../effects/MomentumParticles';
import InsightPopup from '../effects/InsightPopup';
import MomentumPopup from '../effects/MomentumPopup';

/**
 * ResourceGainFeedback - Enhanced component that shows animated feedback when
 * resources are gained, including particles and popup notifications.
 */
export default function ResourceGainFeedback() {
  // Debug mode to visualize component loading
  const [initialized, setInitialized] = useState(false);
  
  // Main feedback states
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackType, setFeedbackType] = useState<'insight' | 'momentum'>('insight');
  const [feedbackAmount, setFeedbackAmount] = useState(0);
  const [feedbackPosition, setFeedbackPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  
  // Track click positions for targeted feedback
  const [clickPosition, setClickPosition] = useState<{ x: number; y: number } | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [showParticles, setShowParticles] = useState(false);
  
  // Reference to insight meter for particle target
  const insightMeterRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  
  // Reference to momentum counter for momentum particles
  const momentumCounterRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  
  // Add a processing lock to prevent duplicate handling of the same event
  const processingRef = useRef(false);
  // Track last event timestamp to deduplicate
  const lastEventTimestampRef = useRef<Record<string, number>>({
    insight: 0,
    momentum: 0
  });
  
  // Mark component as initialized to debug lifecycle
  useEffect(() => {
    console.log("[ResourceGainFeedback] Component initialized");
    setInitialized(true);
    return () => console.log("[ResourceGainFeedback] Component unmounted");
  }, []);
  
  // Update insight meter and momentum counter positions on mount and resize
  useEffect(() => {
    const updatePositions = () => {
      // Update insight meter position - try multiple selectors for better targeting
      const insightMeter = document.querySelector('.insight-meter') || 
                           document.querySelector('[data-testid="insight-meter"]') ||
                           document.querySelector('div.p-2 .text-text-secondary+div');
      
      if (insightMeter) {
        const rect = insightMeter.getBoundingClientRect();
        insightMeterRef.current = {
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2
        };
        console.log("[ResourceGainFeedback] Insight meter position updated:", insightMeterRef.current);
      } else {
        console.log("[ResourceGainFeedback] Insight meter not found, using fallback position");
        // Fallback to right panel positioning to aim at player stats area
        const rightPanel = document.querySelector('.w-full.lg\\:w-1\\/5:last-child');
        if (rightPanel) {
          const rect = rightPanel.getBoundingClientRect();
          insightMeterRef.current = {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 3
          };
        } else {
          // Last resort fallback
          insightMeterRef.current = {
            x: window.innerWidth - 100,
            y: 150
          };
        }
      }
      
      // Update momentum counter position
      const momentumCounter = document.querySelector('.momentum-counter');
      if (momentumCounter) {
        const rect = momentumCounter.getBoundingClientRect();
        momentumCounterRef.current = {
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2
        };
        console.log("[ResourceGainFeedback] Momentum counter position updated:", momentumCounterRef.current);
      } else {
        console.log("[ResourceGainFeedback] Momentum counter not found, using fallback position");
        // Fallback to top-right area where momentum pips are displayed
        momentumCounterRef.current = {
          x: window.innerWidth - 120,
          y: 100
        };
      }
    };
    
    // Immediate update, then delayed update to catch post-render positions
    updatePositions();
    
    // Schedule multiple position updates to catch any layout changes
    const timers = [
      setTimeout(updatePositions, 100),
      setTimeout(updatePositions, 500),
      setTimeout(updatePositions, 1000)
    ];
    
    // Update on resize
    window.addEventListener('resize', updatePositions);
    
    // Schedule periodic updates to catch any layout changes
    const intervalId = setInterval(updatePositions, 3000);
    
    return () => {
      window.removeEventListener('resize', updatePositions);
      clearInterval(intervalId);
      timers.forEach(timer => clearTimeout(timer));
    };
  }, []);
  
  // Track UI interactions to capture click positions
  useEventSubscription(
    GameEventType.UI_OPTION_SELECTED,
    (event) => {
      console.log("[ResourceGainFeedback] UI_OPTION_SELECTED event received:", event);
      if (event.payload?.position) {
        setClickPosition(event.payload.position);
      }
    },
    []
  );
  
  // Common feedback animation handler - reusable for both insight and momentum
  const handleResourceFeedback = (type: 'insight' | 'momentum', amount: number, eventTimestamp: number) => {
    // Check if already processing or if this is a duplicate event (within 100ms)
    if (processingRef.current) {
      console.log(`[ResourceGainFeedback] Skipping ${type} event - already processing`);
      return;
    }
    
    // Check for duplicate events
    const lastTimestamp = lastEventTimestampRef.current[type];
    if (eventTimestamp - lastTimestamp < 100) {
      console.log(`[ResourceGainFeedback] Skipping duplicate ${type} event - too close to previous event`);
      return;
    }
    
    // Update last event timestamp
    lastEventTimestampRef.current[type] = eventTimestamp;
    
    // Set processing lock
    processingRef.current = true;
    
    console.log(`[ResourceGainFeedback] Processing ${type} gain event, amount: ${amount}`);
    
    // Set feedback data
    setFeedbackType(type);
    setFeedbackAmount(amount);
    
    // Use tracked click position if available, otherwise use default position
    const position = clickPosition || { 
      x: window.innerWidth / 2, 
      y: window.innerHeight / 2 
    };
    
    // Show popup at click position
    setFeedbackPosition(position);
    setShowPopup(true);
    
    // Show particles with a slight delay
    setTimeout(() => {
      setShowParticles(true);
    }, 200);
    
    // Hide popup after animation
    setTimeout(() => {
      setShowPopup(false);
      
      // Show the floating indicator at target meter
      const targetRef = type === 'insight' ? insightMeterRef : momentumCounterRef;
      setFeedbackPosition({
        x: targetRef.current.x,
        y: targetRef.current.y
      });
      setShowFeedback(true);
    }, 2000);
    
    // Reset click position and feedback after all animations
    setTimeout(() => {
      setClickPosition(null);
      setShowFeedback(false);
      setShowParticles(false);
      // Release processing lock
      processingRef.current = false;
    }, 3000);
  };
  
  // Handle insight gained events with deduplication
  useEventSubscription(
    GameEventType.INSIGHT_GAINED,
    (event) => {
      if (!event.payload || event.payload.change <= 0) return;
      handleResourceFeedback('insight', event.payload.change, event.timestamp || Date.now());
    },
    []
  );
  
  // Listen only to MOMENTUM_INCREASED for momentum feedback
  useEventSubscription(
    GameEventType.MOMENTUM_INCREASED,
    (event) => {
      if (!event.payload || event.payload.change <= 0) return;
      handleResourceFeedback('momentum', event.payload.change, event.timestamp || Date.now());
    },
    []
  );
  
  // Debug trigger for development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      // Add debug controls to window for manual testing
      const debugObj = {
        triggerInsightParticles: (amount = 10) => {
          console.log(`[DEBUG] Manually triggering insight particles with amount: ${amount}`);
          handleResourceFeedback('insight', amount, Date.now());
        },
        
        triggerMomentumParticles: (amount = 1) => {
          console.log(`[DEBUG] Manually triggering momentum particles with amount: ${amount}`);
          handleResourceFeedback('momentum', amount, Date.now());
        }
      };
      
      // @ts-ignore
      window.__RESOURCE_FEEDBACK_DEBUG__ = debugObj;
      
      console.log('[ResourceGainFeedback] Debug helpers available! Use window.__RESOURCE_FEEDBACK_DEBUG__.triggerInsightParticles() or triggerMomentumParticles()');
      
      return () => {
        // @ts-ignore
        delete window.__RESOURCE_FEEDBACK_DEBUG__;
      };
    }
  }, []);
  
  return (
    <>
      {initialized && (
        <>
          {/* Insight popup notification near click */}
          <AnimatePresence>
            {showPopup && clickPosition && feedbackType === 'insight' && (
              <InsightPopup 
                position={clickPosition} 
                amount={feedbackAmount} 
              />
            )}
          </AnimatePresence>
          
          {/* Momentum popup notification near click */}
          <AnimatePresence>
            {showPopup && clickPosition && feedbackType === 'momentum' && (
              <MomentumPopup 
                position={clickPosition} 
                amount={feedbackAmount} 
              />
            )}
          </AnimatePresence>
          
          {/* Floating text at resource meter */}
          <AnimatePresence>
            {showFeedback && (
              <motion.div
                className="fixed z-50 pointer-events-none"
                initial={{ opacity: 0, scale: 0.8, y: 0 }}
                animate={{ opacity: 1, scale: 1, y: -40 }}
                exit={{ opacity: 0, scale: 0.8, y: -80 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                style={{
                  left: feedbackPosition.x,
                  top: feedbackPosition.y,
                  transform: 'translate(-50%, -50%)'
                }}
              >
                <div className="flex items-center justify-center">
                  <PixelText 
                    className={`text-lg font-bold ${
                      feedbackType === 'insight' 
                        ? 'text-educational-light' 
                        : 'text-orange-300'
                    }`}
                  >
                    {feedbackType === 'insight' ? '💡' : '🔥'} +{feedbackAmount}
                  </PixelText>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Insight particle effects */}
          <AnimatePresence>
            {showParticles && clickPosition && feedbackType === 'insight' && (
              <InsightParticles
                sourcePosition={clickPosition}
                targetPosition={insightMeterRef.current}
                amount={feedbackAmount}
                onComplete={() => console.log("[ResourceGainFeedback] Insight particles animation completed")}
              />
            )}
          </AnimatePresence>
          
          {/* Momentum particle effects */}
          <AnimatePresence>
            {showParticles && clickPosition && feedbackType === 'momentum' && (
              <MomentumParticles
                sourcePosition={clickPosition}
                targetPosition={momentumCounterRef.current}
                amount={feedbackAmount}
                onComplete={() => console.log("[ResourceGainFeedback] Momentum particles animation completed")}
              />
            )}
          </AnimatePresence>
        </>
      )}
    </>
  );
} 