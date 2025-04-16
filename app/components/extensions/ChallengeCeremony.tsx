// app/components/extensions/ChallengeCeremony.tsx
'use client';

/**
 * Challenge Ceremony Component
 * 
 * Creates a streamlined transition between dialogue and extension challenges.
 * Provides clear signposting to the player when they're moving from narrative
 * to interactive challenge modes.
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePrimitiveStoreValue } from '../../core/utils/storeHooks';
import { getCharacterData } from '../../data/characters';
import { ExtensionType } from './VisualExtender';
import useTypewriter from '../../hooks/useTypewriter';

// Props for the ceremony component
interface ChallengeCeremonyProps {
  mentor: string; // Mentor character ID
  challengeType: ExtensionType;
  ceremonyText: string; // The challenge introduction text
  onCeremonyComplete: () => void;
  domainColor?: string; // Optional color for domain-specific styling
}

/**
 * Maps extension types to domain colors and icons
 */
const extensionThemes = {
  'calculation': {
    color: '#ec4899', // Dosimetry (Pink)
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 7h16M4 12h16M4 17h10" strokeLinecap="round" />
      </svg>
    ),
    title: 'Calculation Challenge'
  },
  'anatomical-identification': {
    color: '#3b82f6', // Treatment Planning (Blue)
    icon: null,
    title: 'Anatomical Identification'
  },
  'equipment-identification': {
    color: '#f59e0b', // Linac Anatomy (Amber)
    icon: null,
    title: 'Equipment Identification'
  },
  'measurement-reading': {
    color: '#ec4899', // Dosimetry (Pink)
    icon: null,
    title: 'Measurement Reading'
  },
  'dosimetric-pattern': {
    color: '#ec4899', // Dosimetry (Pink)
    icon: null,
    title: 'Dosimetric Pattern Recognition'
  },
  'treatment-plan': {
    color: '#3b82f6', // Treatment Planning (Blue)
    icon: null,
    title: 'Treatment Plan Optimization'
  },
  'error-identification': {
    color: '#10b981', // Radiation Therapy (Green)
    icon: null,
    title: 'Error Identification'
  }
};

/**
 * Ceremony state machine states
 */
enum CeremonyState {
  CeremonyStarted = 'ceremony_started',
  CeremonyComplete = 'ceremony_complete'
}

/**
 * Simplified ChallengeCeremony component 
 */
const ChallengeCeremony: React.FC<ChallengeCeremonyProps> = ({
  mentor,
  challengeType,
  ceremonyText,
  onCeremonyComplete,
  domainColor
}) => {
  // Mount tracking ref
  const isMountedRef = useRef(true);
  
  // Element refs for DOM-based animations
  const containerRef = useRef<HTMLDivElement>(null);
  const dialogueBoxRef = useRef<HTMLDivElement>(null);
  
  // Timer refs for controlling timing of animations
  const timerRefs = useRef<{[key: string]: NodeJS.Timeout | null}>({});
  
  // Get mentor data
  const mentorData = useMemo(() => {
    return getCharacterData(mentor);
  }, [mentor]);
  
  // Get theme data for this challenge type
  const themeData = useMemo(() => {
    return extensionThemes[challengeType] || {
      color: '#3b82f6',
      icon: null,
      title: 'Challenge'
    };
  }, [challengeType]);
  
  // The color to use for this challenge (domain color or extension theme color)
  const activeColor = useMemo(() => {
    return domainColor || themeData.color;
  }, [domainColor, themeData]);
  
  // State for controlling the ceremony flow
  const [ceremonyState, setCeremonyState] = useState<CeremonyState>(CeremonyState.CeremonyStarted);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showContinueButton, setShowContinueButton] = useState(false);
  
  // Use typewriter effect for ceremony text
  const { displayText: typedText, isComplete: typingComplete } = useTypewriter(
    ceremonyText,
    { speed: 25 }
  );
  
  // Process text with custom bracket notation for colored values
  const processFormattedText = useCallback((text: string) => {
    if (!text) return '';
    
    // Replace bracket notation with styled spans
    // Format: [color:text] -> <span className="text-color-value">text</span>
    return text.replace(/\[(\w+):(.*?)\]/g, (match, color, content) => {
      const colorMap: Record<string, string> = {
        yellow: 'text-yellow-300 font-medium',
        cyan: 'text-cyan-300 font-medium',
        green: 'text-green-300 font-medium',
        purple: 'text-purple-300 font-medium',
        red: 'text-red-400 font-medium',
        blue: 'text-blue-300 font-medium'
      };
      
      const colorClass = colorMap[color] || 'text-white';
      return `<span class="${colorClass}">${content}</span>`;
    });
  }, []);
  
  // Function to safely render HTML content
  const renderFormattedText = useCallback((text: string) => {
    const processedText = processFormattedText(text);
    return { __html: processedText };
  }, [processFormattedText]);
  
  // Show continue button when typing is complete
  useEffect(() => {
    if (typingComplete && !showContinueButton) {
      const timer = setTimeout(() => {
        if (isMountedRef.current) {
          setShowContinueButton(true);
        }
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [typingComplete, showContinueButton]);
  
  // Screen shake function for effects
  const applyScreenShake = useCallback(() => {
    if (!isMountedRef.current) return;
    
    // Apply screen shake directly to the DOM element
    const containerElement = containerRef.current;
    if (containerElement) {
      containerElement.classList.add('screen-shake');
      
      // Remove class after animation completes
      setTimeout(() => {
        if (containerElement && isMountedRef.current) {
          containerElement.classList.remove('screen-shake');
        }
      }, 500);
    }
  }, []);
  
  // Pulse dialogue box
  const pulseDialogueBox = useCallback(() => {
    if (!isMountedRef.current) return;
    
    const dialogueBox = dialogueBoxRef.current;
    if (dialogueBox) {
      dialogueBox.classList.add('pulse-glow');
      
      setTimeout(() => {
        if (dialogueBox && isMountedRef.current) {
          dialogueBox.classList.remove('pulse-glow');
        }
      }, 1000);
    }
  }, []);
  
  // Handle continuing after ceremony
  const handleContinue = useCallback(() => {
    if (!isMountedRef.current || isAnimating) return;
    
    setIsAnimating(true);
    setShowContinueButton(false);
    applyScreenShake();
    
    // Proceed to next state
    setCeremonyState(CeremonyState.CeremonyComplete);
    
    // Short delay before completing
    timerRefs.current.completion = setTimeout(() => {
      if (isMountedRef.current) {
        setIsAnimating(false);
        onCeremonyComplete();
      }
    }, 500);
    
  }, [isAnimating, onCeremonyComplete, applyScreenShake]);
  
  // Clean up on unmount
  useEffect(() => {
    // Highlight Kapoor in the sidebar initially
    const highlightEvent = new CustomEvent('kapoor:highlight', { 
      detail: { duration: 1000 }
    });
    window.dispatchEvent(highlightEvent);
    
    // Apply pulse effect to dialogue box after a delay
    const pulseTimer = setTimeout(() => {
      if (isMountedRef.current) {
        pulseDialogueBox();
      }
    }, 1500);
    
    // Hide any other elements to focus attention
    document.body.classList.add('ceremony-active');
    
    return () => {
      isMountedRef.current = false;
      
      // Clear all timers
      Object.values(timerRefs.current).forEach(timer => {
        if (timer) clearTimeout(timer);
      });
      
      clearTimeout(pulseTimer);
      
      // Restore visibility
      document.body.classList.remove('ceremony-active');
    };
  }, [pulseDialogueBox]);
  
  // Main render
  return (
    <motion.div 
      ref={containerRef}
      className="challenge-ceremony w-full h-full fixed inset-0 z-50 flex items-center justify-center"
      style={{
        '--ceremony-accent-color': activeColor,
        '--ceremony-accent-glow': `${activeColor}40`
      } as React.CSSProperties}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Full-screen overlay to dim background and focus attention */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      
      <motion.div 
        className="ceremony-content relative z-10"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div 
          ref={dialogueBoxRef}
          className="dialogue-box"
          style={{ borderColor: activeColor }}
        >
          <p 
            className="typewriter-text font-pixel text-white text-lg"
            dangerouslySetInnerHTML={renderFormattedText(typedText)}
          ></p>
          
          {showContinueButton && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="flex justify-center mt-6"
            >
              <button
                onClick={handleContinue}
                className="px-5 py-2 text-white font-pixel rounded-sm transition-all transform hover:scale-105 active:scale-95"
                style={{ 
                  backgroundColor: `${activeColor}90`,
                  borderColor: activeColor,
                  boxShadow: `0 0 15px ${activeColor}80`
                }}
              >
                Begin Challenge
              </button>
            </motion.div>
          )}
        </div>
      </motion.div>
      
      <style jsx>{`
        @keyframes screen-shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-3px); }
          20%, 40%, 60%, 80% { transform: translateX(3px); }
        }
        
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 20px var(--ceremony-accent-glow); }
          50% { box-shadow: 0 0 30px var(--ceremony-accent-color); }
        }
        
        .screen-shake {
          animation: screen-shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
        }
        
        .pulse-glow {
          animation: pulse-glow 1s ease-in-out;
        }
        
        .challenge-ceremony {
          position: fixed;
          overflow: hidden;
          transition: all 0.5s ease-out;
        }
        
        .ceremony-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          width: 100%;
          max-width: 700px;
          text-align: center;
          z-index: 20;
          padding: 2rem;
        }
        
        .dialogue-box {
          background: rgba(0, 0, 0, 0.85);
          border: 3px solid var(--ceremony-accent-color);
          border-radius: 0.5rem;
          padding: 2rem;
          width: 100%;
          max-width: 650px;
          box-shadow: 0 0 20px var(--ceremony-accent-glow);
        }
        
        .typewriter-text {
          min-height: 3rem;
          line-height: 1.6;
        }
        
        :global(body.ceremony-active) :global(.conversation-controls),
        :global(body.ceremony-active) :global(.dialogue-option) {
          opacity: 0 !important;
          pointer-events: none !important;
          transition: opacity 0.5s ease-out;
        }
      `}</style>
    </motion.div>
  );
};

export default ChallengeCeremony;