'use client';

import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

/**
 * Defines the possible modes of dialogue presentation
 * Each mode has its own visual styling and animations
 */
export enum DialogueMode {
  NARRATIVE = 'narrative',       // Basic storytelling text
  CHALLENGE_INTRO = 'challenge', // Introduction to a challenge
  QUESTION = 'question',         // A direct question to the player
  INSTRUCTION = 'instruction',   // Guidance or how-to information
  REACTION = 'reaction',         // Feedback or response to player actions
  CRITICAL = 'critical'          // Important information that shouldn't be missed
}

// Styling maps for different dialogue modes
const modeStyles = {
  [DialogueMode.NARRATIVE]: {
    container: 'border-blue-800/60 bg-black/90',
    header: 'bg-blue-900/40 text-blue-300',
    animation: 'dialogue-pulse-blue',
    icon: (
      <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
      </svg>
    )
  },
  [DialogueMode.CHALLENGE_INTRO]: {
    container: 'border-amber-700/70 bg-black/90',
    header: 'bg-amber-900/40 text-amber-300',
    animation: 'dialogue-pulse-amber',
    icon: (
      <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    )
  },
  [DialogueMode.QUESTION]: {
    container: 'border-purple-700/70 bg-black/90',
    header: 'bg-purple-900/40 text-purple-300',
    animation: 'dialogue-pulse-purple',
    icon: (
      <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  },
  [DialogueMode.INSTRUCTION]: {
    container: 'border-green-700/70 bg-black/90',
    header: 'bg-green-900/40 text-green-300',
    animation: 'dialogue-pulse-green',
    icon: (
      <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    )
  },
  [DialogueMode.REACTION]: {
    container: 'border-pink-700/70 bg-black/90',
    header: 'bg-pink-900/40 text-pink-300',
    animation: 'dialogue-pulse-pink',
    icon: (
      <svg className="w-5 h-5 text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  },
  [DialogueMode.CRITICAL]: {
    container: 'border-red-700/70 bg-black/90',
    header: 'bg-red-900/40 text-red-300',
    animation: 'dialogue-pulse-red',
    icon: (
      <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    )
  }
};

interface DialogueContainerProps {
  mode: DialogueMode;
  title?: string;
  children: React.ReactNode;
  className?: string;
  showIcon?: boolean;
  animationEnabled?: boolean;
}

/**
 * DialogueContainer component
 * Provides consistent visual styling for different types of dialogue
 * with animations, icons, and mode-specific color schemes
 */
const DialogueContainer: React.FC<DialogueContainerProps> = ({
  mode = DialogueMode.NARRATIVE,
  title,
  children,
  className = '',
  showIcon = true,
  animationEnabled = true
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const style = modeStyles[mode] || modeStyles[DialogueMode.NARRATIVE];

  // Apply animation class when mounted
  useEffect(() => {
    if (!animationEnabled || !containerRef.current) return;
    
    const container = containerRef.current;
    container.classList.add(`${style.animation}`);
    
    return () => {
      container.classList.remove(`${style.animation}`);
    };
  }, [style.animation, animationEnabled]);

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.3 }}
      className={`${style.container} border-2 rounded-md overflow-hidden shadow-lg mb-4 ${className}`}
      style={{ 
        transition: 'background-color 8s cubic-bezier(0.05, 0.1, 0.3, 1), border-color 8s cubic-bezier(0.05, 0.1, 0.3, 1), box-shadow 8s cubic-bezier(0.05, 0.1, 0.3, 1)'
      }}
    >
      {title && (
        <div className={`${style.header} px-4 py-2 flex items-center`} style={{ transition: 'background-color 8s cubic-bezier(0.05, 0.1, 0.3, 1)' }}>
          {showIcon && <div className="mr-2">{style.icon}</div>}
          <h3 className="text-sm font-pixel">{title}</h3>
        </div>
      )}
      <div className="p-4">
        {children}
      </div>

      {/* Animation styles */}
      <style jsx global>{`
        @keyframes pulse-border-blue {
          0%, 100% { 
            border-color: rgba(59, 130, 246, 0.5);
            box-shadow: 0 0 12px rgba(59, 130, 246, 0.4);
            background-color: rgba(30, 58, 138, 0.85);
          }
          50% { 
            border-color: rgba(59, 130, 246, 0.7);
            box-shadow: 0 0 20px rgba(59, 130, 246, 0.5);
            background-color: rgba(30, 58, 138, 0.9);
          }
        }
        
        @keyframes pulse-border-amber {
          0%, 100% { 
            border-color: rgba(217, 119, 6, 0.5);
            box-shadow: 0 0 12px rgba(217, 119, 6, 0.4);
            background-color: rgba(120, 53, 15, 0.85);
          }
          50% { 
            border-color: rgba(217, 119, 6, 0.7);
            box-shadow: 0 0 20px rgba(217, 119, 6, 0.5);
            background-color: rgba(120, 53, 15, 0.9);
          }
        }
        
        @keyframes pulse-border-purple {
          0%, 100% { 
            border-color: rgba(147, 51, 234, 0.5);
            box-shadow: 0 0 12px rgba(147, 51, 234, 0.4);
            background-color: rgba(88, 28, 135, 0.85);
          }
          50% { 
            border-color: rgba(147, 51, 234, 0.7);
            box-shadow: 0 0 20px rgba(147, 51, 234, 0.5);
            background-color: rgba(88, 28, 135, 0.9);
          }
        }
        
        @keyframes pulse-border-green {
          0%, 100% { 
            border-color: rgba(16, 185, 129, 0.5);
            box-shadow: 0 0 12px rgba(16, 185, 129, 0.4);
            background-color: rgba(6, 95, 70, 0.85);
          }
          50% { 
            border-color: rgba(16, 185, 129, 0.7);
            box-shadow: 0 0 20px rgba(16, 185, 129, 0.5);
            background-color: rgba(6, 95, 70, 0.9);
          }
        }
        
        @keyframes pulse-border-pink {
          0%, 100% { 
            border-color: rgba(236, 72, 153, 0.5);
            box-shadow: 0 0 12px rgba(236, 72, 153, 0.4);
            background-color: rgba(157, 23, 77, 0.85);
          }
          50% { 
            border-color: rgba(236, 72, 153, 0.7);
            box-shadow: 0 0 20px rgba(236, 72, 153, 0.5);
            background-color: rgba(157, 23, 77, 0.9);
          }
        }
        
        @keyframes pulse-border-red {
          0%, 100% { 
            border-color: rgba(239, 68, 68, 0.5);
            box-shadow: 0 0 12px rgba(239, 68, 68, 0.4);
            background-color: rgba(153, 27, 27, 0.85);
          }
          50% { 
            border-color: rgba(239, 68, 68, 0.7);
            box-shadow: 0 0 20px rgba(239, 68, 68, 0.5);
            background-color: rgba(153, 27, 27, 0.9);
          }
        }
        
        .dialogue-pulse-blue {
          animation: pulse-border-blue 15s cubic-bezier(0.05, 0.1, 0.3, 1) infinite;
        }
        
        .dialogue-pulse-amber {
          animation: pulse-border-amber 15s cubic-bezier(0.05, 0.1, 0.3, 1) infinite;
        }
        
        .dialogue-pulse-purple {
          animation: pulse-border-purple 15s cubic-bezier(0.05, 0.1, 0.3, 1) infinite;
        }
        
        .dialogue-pulse-green {
          animation: pulse-border-green 15s cubic-bezier(0.05, 0.1, 0.3, 1) infinite;
        }
        
        .dialogue-pulse-pink {
          animation: pulse-border-pink 15s cubic-bezier(0.05, 0.1, 0.3, 1) infinite;
        }
        
        .dialogue-pulse-red {
          animation: pulse-border-red 15s cubic-bezier(0.05, 0.1, 0.3, 1) infinite;
        }
      `}</style>
    </motion.div>
  );
};

export default DialogueContainer;