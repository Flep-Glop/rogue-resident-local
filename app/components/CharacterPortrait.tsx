'use client';
import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import MentorReaction, { ReactionType } from './MentorReaction';
import { CharacterId, getCharacterData } from '@/app/data/characters';
import { DialogueMode } from './dialogue/DialogueContainer';

interface CharacterPortraitProps {
  characterId: CharacterId | string;
  reaction?: ReactionType;
  shake?: boolean;
  oscillate?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showTitle?: boolean;
  dialogueMode?: DialogueMode;
}

/**
 * Character portrait component with integrated reaction system
 * 
 * Follows the Chamber Pattern:
 * - Uses refs for DOM operations
 * - Minimizes state
 * - Encapsulates animations
 */
const CharacterPortrait: React.FC<CharacterPortraitProps> = ({
  characterId,
  reaction = null,
  shake = false,
  oscillate = false,
  size = 'md',
  className = '',
  showTitle = false,
  dialogueMode = null,
}) => {
  // Mounted ref for preventing memory leaks
  const isMountedRef = useRef(true);
  const portraitRef = useRef<HTMLDivElement>(null);
  
  // Animation timing refs
  const animationTimers = useRef<{[key: string]: NodeJS.Timeout | null}>({});
  
  // Get character data
  const characterData = getCharacterData(characterId);
  
  // Visual effect state
  const [isShaking, setIsShaking] = useState(shake);
  const [isOscillating, setIsOscillating] = useState(oscillate);
  
  // Clear timers on unmount
  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
      // Clean up all timers
      Object.values(animationTimers.current).forEach(timer => {
        if (timer) clearTimeout(timer);
      });
    };
  }, []);
  
  // Handle shake prop changes
  useEffect(() => {
    if (shake && !isShaking) {
      setIsShaking(true);
      
      // Auto-stop shake after 500ms
      animationTimers.current.shake = setTimeout(() => {
        if (isMountedRef.current) {
          setIsShaking(false);
        }
      }, 500);
    } else if (!shake && isShaking) {
      setIsShaking(false);
    }
    
    return () => {
      if (animationTimers.current.shake) {
        clearTimeout(animationTimers.current.shake);
      }
    };
  }, [shake, isShaking]);
  
  // Handle oscillate prop changes
  useEffect(() => {
    setIsOscillating(oscillate);
  }, [oscillate]);
  
  // Size variants for the portrait
  const sizeClasses = {
    sm: 'w-24 h-24',
    md: 'w-32 h-32',
    lg: 'w-40 h-40'
  };

  // Get dialogue mode color classes
  const getModeClasses = () => {
    if (!dialogueMode) return '';
    
    const modeColorMap = {
      'narrative': 'shadow-blue-900/30 portrait-glow-blue portrait-mode-blue',
      'challenge': 'shadow-amber-900/30 portrait-glow-amber portrait-mode-amber',
      'question': 'shadow-purple-900/30 portrait-glow-purple portrait-mode-purple',
      'instruction': 'shadow-green-900/30 portrait-glow-green portrait-mode-green',
      'reaction': 'shadow-pink-900/30 portrait-glow-pink portrait-mode-pink',
      'critical': 'shadow-red-900/30 portrait-glow-red portrait-mode-red',
    };
    
    return modeColorMap[dialogueMode] || '';
  };
  
  return (
    <div className={`relative flex flex-col items-center ${className}`}>
      {/* Mentor reaction indicator - Positioned as a sibling outside the portrait container */}
      <div className="absolute w-full" style={{ right: '-1.5rem', top: '-2rem', zIndex: 100 }}>
        <MentorReaction 
          reaction={reaction} 
          color={characterData.primaryColor}
        />
      </div>
      
      {/* Portrait container */}
      <motion.div
        ref={portraitRef}
        className={`relative ${sizeClasses[size]} overflow-hidden ${characterData.bgClass} ${getModeClasses()}`}
        animate={{
          y: isOscillating ? [0, -5, 0] : 0,
        }}
        transition={
          isOscillating 
            ? { 
                y: { 
                  repeat: Infinity, 
                  duration: 2, 
                  ease: 'easeInOut' 
                }
              } 
            : {}
        }
        style={{
          transition: 'background-color 8s cubic-bezier(0.05, 0.1, 0.3, 1), border-color 8s cubic-bezier(0.05, 0.1, 0.3, 1), box-shadow 8s cubic-bezier(0.05, 0.1, 0.3, 1)',
          borderRadius: '4px'
        }}
      >
        {/* Character image */}
        <div 
          className={`w-full h-full relative ${isShaking ? 'character-shake' : ''}`}
        >
          <Image
            src={characterData.sprite}
            alt={characterData.name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            style={{ objectFit: 'cover' }}
            className="pixel-art"
          />
        </div>
      </motion.div>
      
      {/* Character title if requested */}
      {showTitle && (
        <div 
          className={`text-center ${characterData.textClass} font-pixel`}
          style={{ 
            textShadow: '0 2px 4px rgba(0,0,0,0.5)',
            paddingTop: '2rem',
            marginTop: '2rem'
          }}
        >
          <div className="text-sm font-semibold">{characterData.name}</div>
          <div className="text-xs opacity-80">{characterData.title}</div>
        </div>
      )}

      {/* Add animation styles for dialogue modes */}
      {dialogueMode && (
        <style jsx global>{`
          @keyframes portrait-glow-blue {
            0%, 100% { 
              box-shadow: 0 0 8px rgba(59, 130, 246, 0.4);
              background-color: rgba(30, 58, 138, 0.85);
            }
            50% { 
              box-shadow: 0 0 15px rgba(59, 130, 246, 0.6);
              background-color: rgba(30, 58, 138, 0.9);
            }
          }
          
          @keyframes portrait-glow-amber {
            0%, 100% { 
              box-shadow: 0 0 8px rgba(217, 119, 6, 0.4);
              background-color: rgba(120, 53, 15, 0.85);
            }
            50% { 
              box-shadow: 0 0 15px rgba(217, 119, 6, 0.6);
              background-color: rgba(120, 53, 15, 0.9);
            }
          }
          
          @keyframes portrait-glow-purple {
            0%, 100% { 
              box-shadow: 0 0 8px rgba(147, 51, 234, 0.4);
              background-color: rgba(88, 28, 135, 0.85);
            }
            50% { 
              box-shadow: 0 0 15px rgba(147, 51, 234, 0.6);
              background-color: rgba(88, 28, 135, 0.9);
            }
          }
          
          @keyframes portrait-glow-green {
            0%, 100% { 
              box-shadow: 0 0 8px rgba(16, 185, 129, 0.4);
              background-color: rgba(6, 95, 70, 0.85);
            }
            50% { 
              box-shadow: 0 0 15px rgba(16, 185, 129, 0.6);
              background-color: rgba(6, 95, 70, 0.9);
            }
          }
          
          @keyframes portrait-glow-pink {
            0%, 100% { 
              box-shadow: 0 0 8px rgba(236, 72, 153, 0.4);
              background-color: rgba(157, 23, 77, 0.85);
            }
            50% { 
              box-shadow: 0 0 15px rgba(236, 72, 153, 0.6);
              background-color: rgba(157, 23, 77, 0.9);
            }
          }
          
          @keyframes portrait-glow-red {
            0%, 100% { 
              box-shadow: 0 0 8px rgba(239, 68, 68, 0.4);
              background-color: rgba(153, 27, 27, 0.85);
            }
            50% { 
              box-shadow: 0 0 15px rgba(239, 68, 68, 0.6);
              background-color: rgba(153, 27, 27, 0.9);
            }
          }
          
          .portrait-glow-blue {
            animation: portrait-glow-blue 15s cubic-bezier(0.05, 0.1, 0.3, 1) infinite;
          }
          
          .portrait-glow-amber {
            animation: portrait-glow-amber 15s cubic-bezier(0.05, 0.1, 0.3, 1) infinite;
          }
          
          .portrait-glow-purple {
            animation: portrait-glow-purple 15s cubic-bezier(0.05, 0.1, 0.3, 1) infinite;
          }
          
          .portrait-glow-green {
            animation: portrait-glow-green 15s cubic-bezier(0.05, 0.1, 0.3, 1) infinite;
          }
          
          .portrait-glow-pink {
            animation: portrait-glow-pink 15s cubic-bezier(0.05, 0.1, 0.3, 1) infinite;
          }
          
          .portrait-glow-red {
            animation: portrait-glow-red 15s cubic-bezier(0.05, 0.1, 0.3, 1) infinite;
          }

          /* Portrait background color transitions */
          .portrait-mode-blue::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: rgba(30, 58, 138, 0.6);
            opacity: 0.8;
            z-index: 0;
            pointer-events: none;
            transition: background-color 8s cubic-bezier(0.05, 0.1, 0.3, 1);
          }
          
          .portrait-mode-amber::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: rgba(120, 53, 15, 0.6);
            opacity: 0.8;
            z-index: 0;
            pointer-events: none;
            transition: background-color 8s cubic-bezier(0.05, 0.1, 0.3, 1);
          }
          
          .portrait-mode-purple::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: rgba(88, 28, 135, 0.6);
            opacity: 0.8;
            z-index: 0;
            pointer-events: none;
            transition: background-color 8s cubic-bezier(0.05, 0.1, 0.3, 1);
          }
          
          .portrait-mode-green::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: rgba(6, 95, 70, 0.6);
            opacity: 0.8;
            z-index: 0;
            pointer-events: none;
            transition: background-color 8s cubic-bezier(0.05, 0.1, 0.3, 1);
          }
          
          .portrait-mode-pink::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: rgba(157, 23, 77, 0.6);
            opacity: 0.8;
            z-index: 0;
            pointer-events: none;
            transition: background-color 8s cubic-bezier(0.05, 0.1, 0.3, 1);
          }
          
          .portrait-mode-red::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: rgba(153, 27, 27, 0.6);
            opacity: 0.8;
            z-index: 0;
            pointer-events: none;
            transition: background-color 8s cubic-bezier(0.05, 0.1, 0.3, 1);
          }
        `}</style>
      )}
    </div>
  );
};

export default CharacterPortrait; 