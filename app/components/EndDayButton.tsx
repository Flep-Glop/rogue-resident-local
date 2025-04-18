'use client';

import React, { useState, useEffect } from 'react';
import { PixelButton } from './PixelThemeProvider';
import useGameStateMachine from '../core/statemachine/GameStateMachine';
import { motion, AnimatePresence } from 'framer-motion';
import { safeDispatch } from '../core/events/CentralEventBus';
import { GameEventType } from '../core/events/EventTypes';

interface EndDayButtonProps {
  className?: string;
  position?: 'top-right' | 'bottom-right';
}

/**
 * EndDayButton - A UI button that allows the player to end the current day
 * and transition to the night phase.
 */
export default function EndDayButton({ 
  className = '',
  position = 'bottom-right' 
}: EndDayButtonProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isPulsing, setIsPulsing] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);
  
  // Get game state machine methods
  const gameStateMachine = useGameStateMachine();
  const { gamePhase, beginDayCompletion } = gameStateMachine;
  
  // Show button only during day phase
  useEffect(() => {
    setIsVisible(gamePhase === 'day');
    
    // Start pulsing after some time in day phase to draw attention
    let pulseTimer: NodeJS.Timeout | null = null;
    if (gamePhase === 'day') {
      pulseTimer = setTimeout(() => {
        setIsPulsing(true);
      }, 30000); // Start pulsing after 30 seconds in day phase
    } else {
      setIsPulsing(false);
    }
    
    return () => {
      if (pulseTimer) clearTimeout(pulseTimer);
    };
  }, [gamePhase]);
  
  // Position classes based on the position prop
  const positionClasses = {
    'top-right': 'top-4 right-4',
    'bottom-right': 'bottom-16 right-4',
  }[position];
  
  // Handle ending the day
  const handleEndDay = () => {
    if (gamePhase !== 'day') return;
    
    // Animate the button fade out
    setIsFadingOut(true);
    
    // Dispatch UI event for tracking with proper payload format
    safeDispatch(
      GameEventType.UI_END_DAY_CLICKED, 
      {
        componentId: 'EndDayButton',
        action: 'end_day',
        metadata: {
          timestamp: Date.now(),
          gamePhase
        }
      },
      'EndDayButton'
    );
    
    // Short delay for button animation
    setTimeout(() => {
      // Trigger the day completion process
      beginDayCompletion();
    }, 300);
  };
  
  if (!isVisible && !isFadingOut) return null;
  
  return (
    <AnimatePresence>
      <motion.div
        className={`fixed ${positionClasses} z-50 ${className}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ 
          opacity: isFadingOut ? 0 : 1, 
          y: isFadingOut ? -10 : 0,
          scale: isPulsing ? [1, 1.05, 1] : 1 
        }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ 
          duration: 0.3,
          scale: isPulsing ? { 
            repeat: Infinity, 
            repeatType: 'reverse',
            duration: 1.5 
          } : undefined
        }}
      >
        <PixelButton
          variant="educational" // Use the educational color scheme
          size="md"
          onClick={handleEndDay}
          className="shadow-lg"
          icon={<span className="mr-1">🌙</span>}
        >
          End Day
        </PixelButton>
      </motion.div>
    </AnimatePresence>
  );
} 