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
import { playSound } from '@/app/core/sound/SoundManager.tsx';

// Debug switch to completely disable this component
const DISABLE_RESOURCE_FEEDBACK = true;

/**
 * ResourceGainFeedback - Enhanced component that shows animated feedback when
 * resources are gained, including particles and popup notifications.
 */
export default function ResourceGainFeedback() {
  // Early return if disabled
  if (DISABLE_RESOURCE_FEEDBACK) {
    return null;
  }

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
    // Disabled console logs
    setInitialized(true);
    return () => {};
  }, []);
  
  // Update insight meter and momentum counter positions on mount and resize
  useEffect(() => {
    const updatePositions = () => {
      // Fallback positions instead of trying to find elements
      insightMeterRef.current = {
        x: window.innerWidth - 100,
        y: 150
      };
      
      momentumCounterRef.current = {
        x: window.innerWidth - 120,
        y: 100
      };
    };
    
    // Immediate update
    updatePositions();
    
    // Update on resize only - no frequent polling
    window.addEventListener('resize', updatePositions);
    
    return () => {
      window.removeEventListener('resize', updatePositions);
    };
  }, []);
  
  // Track UI interactions to capture click positions
  useEventSubscription(
    GameEventType.UI_OPTION_SELECTED,
    (event) => {
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
      return;
    }
    
    // Check for duplicate events
    const lastTimestamp = lastEventTimestampRef.current[type];
    if (eventTimestamp - lastTimestamp < 100) {
      return;
    }
    
    // Update last event timestamp
    lastEventTimestampRef.current[type] = eventTimestamp;
    
    // Set processing lock
    processingRef.current = true;
    
    // Set feedback data
    setFeedbackType(type);
    setFeedbackAmount(amount);
    
    // Play appropriate sound based on type and amount
    if (type === 'insight') {
      playSound('success');
    } else {
      playSound('connection');
    }
    
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
                onComplete={() => {}}
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
                onComplete={() => {}}
              />
            )}
          </AnimatePresence>
        </>
      )}
    </>
  );
} 