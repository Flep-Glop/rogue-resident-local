'use client';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export type ReactionType = 'positive' | 'negative' | 'question' | 'surprise' | 'thinking' | 'idea' | null;

interface MentorReactionProps {
  reaction: ReactionType;
  intensity?: 'low' | 'medium' | 'high';
  duration?: number;
  color?: string;
  className?: string;
}

/**
 * MentorReaction component - Displays emotional reactions above mentor portraits
 * 
 * Follows Chamber Pattern for performance optimization:
 * - Uses refs for DOM-based animations
 * - Minimizes state changes
 * - Self-contained animation timing
 */
const MentorReaction: React.FC<MentorReactionProps> = ({
  reaction,
  intensity = 'medium',
  duration = 1000,
  color,
  className = '',
}) => {
  // Mounted ref for preventing memory leaks
  const isMountedRef = useRef(true);
  
  // Animation timing refs
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Local display state - kept minimal per Chamber Pattern
  const [isVisible, setIsVisible] = useState(false);
  
  // Clear timers on unmount
  useEffect(() => {
    // Set mounted flag
    isMountedRef.current = true;
    
    // Cleanup function
    return () => {
      isMountedRef.current = false;
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);
  
  // Handle reaction changes
  useEffect(() => {
    // If reaction changes to a new value, ensure visibility
    if (reaction !== null) {
      setIsVisible(true);
      
      // Auto-hide after duration
      timerRef.current = setTimeout(() => {
        if (isMountedRef.current) {
          setIsVisible(false);
        }
      }, duration);
    } else {
      setIsVisible(false);
      
      // Clear any existing timer
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    }
    
    // Clear timer on reaction change
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [reaction, duration]);
  
  // Map reaction types to emoji/symbols
  const getReactionSymbol = () => {
    switch (reaction) {
      case 'positive':
        return '✓';
      case 'negative':
        return '✗';
      case 'question':
        return '?';
      case 'surprise':
        return '!';
      case 'thinking':
        return '...';
      case 'idea':
        return '*';
      default:
        return '';
    }
  };
  
  // Determine if reaction should have abrupt or gentle entrance
  const isAbruptReaction = () => {
    return ['negative', 'surprise', 'positive'].includes(reaction || '');
  };
  
  // Map intensity to animation properties
  const getIntensityScale = () => {
    switch (intensity) {
      case 'low':
        return 1.0;
      case 'medium':
        return 1.2;
      case 'high':
        return 1.5;
      default:
        return 1.2;
    }
  };
  
  // Get color based on reaction
  const getReactionColor = () => {
    if (color) return color;
    
    switch (reaction) {
      case 'positive':
        return 'text-green-400';
      case 'negative':
        return 'text-red-400';
      case 'question':
        return 'text-yellow-400';
      case 'surprise':
        return 'text-purple-400';
      case 'thinking':
        return 'text-blue-400';
      case 'idea':
        return 'text-amber-400';
      default:
        return 'text-white';
    }
  };
  
  // Animation variants with different behaviors for abrupt vs gentle reactions
  const containerVariants = {
    hidden: { opacity: 0, y: 10, scale: 0.5 },
    visibleAbrupt: { 
      opacity: 1, 
      y: 0, 
      scale: getIntensityScale(),
      transition: { 
        type: 'spring',
        stiffness: 500,
        damping: 15
      }
    },
    visibleGentle: { 
      opacity: 1, 
      y: 0, 
      scale: getIntensityScale(),
      transition: { 
        type: 'tween',
        duration: 0.6,
        ease: 'easeOut'
      }
    },
    exit: { 
      opacity: 0, 
      y: -10, 
      scale: 0.5,
      transition: { duration: 0.6 }
    }
  };
  
  // Return null when no reaction to avoid unnecessary DOM
  if (reaction === null && !isVisible) return null;
  
  return (
    <AnimatePresence mode="wait">
      {isVisible && (
        <motion.div
          className={`absolute pointer-events-none font-pixel text-3xl font-bold z-[999] ${getReactionColor()} ${className}`}
          style={{ 
            top: '10px',
            left: '65%', 
            transform: 'translateX(-50%) translateY(-50%)',
            textShadow: '0 0 8px rgba(0,0,0,1), 0 0 12px rgba(0,0,0,0.8)',
            padding: '0.25rem 0.5rem',
            background: 'rgba(0,0,0,0.9)',
            borderRadius: '6px',
            border: '1px solid rgba(255,255,255,0.5)',
            boxShadow: '0 0 15px rgba(0,0,0,0.9)',
            marginTop: '0px'
          }}
          variants={containerVariants}
          initial="hidden"
          animate={isAbruptReaction() ? "visibleAbrupt" : "visibleGentle"}
          exit="exit"
        >
          {getReactionSymbol()}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MentorReaction; 