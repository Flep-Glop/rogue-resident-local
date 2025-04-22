// app/components/journal/JournalAcquisitionAnimation.tsx
/**
 * JournalAcquisitionAnimation - Optimized for performance
 * 
 * Features:
 * 1. Lightweight DOM-based animations
 * 2. Refs for tracking animation state
 * 3. Stable callbacks for event handling
 * 4. Clickable journal icon with tooltip
 * 5. Proper cleanup on unmount
 */
import React, { useRef, useEffect, useState } from 'react';
import { useJournalStore } from '../../store/journalStore';
import { useEventSubscription } from '../../core/events/CentralEventBus';
import { GameEventType } from '../../core/events/EventTypes';
import { usePrimitiveStoreValue, useStableCallback } from '../../core/utils/storeHooks';
import { motion, AnimatePresence } from 'framer-motion';
import { playSound } from '../../core/sound/SoundManager';

interface JournalAcquisitionAnimationProps {
  onComplete?: () => void;
}

interface JournalState {
  hasJournal: boolean;
  initializeJournal?: (tier: 'base' | 'technical' | 'annotated') => void;
  toggleJournal: () => void;
  [key: string]: any;
}

export default function JournalAcquisitionAnimation({ 
  onComplete 
}: JournalAcquisitionAnimationProps) {
  // DOM refs for manipulation
  const containerRef = useRef<HTMLDivElement>(null);
  const journalRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const whiteJournalRef = useRef<HTMLDivElement>(null);
  const colorJournalRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  
  // Animation state
  const [animationStage, setAnimationStage] = useState<'hidden' | 'beams' | 'color' | 'complete'>('hidden');
  const [showTooltip, setShowTooltip] = useState(false);
  
  // --- DEBUG --- Log stage changes
  useEffect(() => {
    console.log(`[JournalAnimation Debug] animationStage changed to: ${animationStage}`);
  }, [animationStage]);
  // --- END DEBUG ---
  
  // Refs for state tracking that don't trigger re-renders
  const isVisibleRef = useRef(false);
  const animationPhaseRef = useRef<'fadeIn' | 'display' | 'fadeOut'>('fadeIn');
  const journalTierRef = useRef<'base' | 'technical' | 'annotated'>('base');
  const timerRefs = useRef<NodeJS.Timeout[]>([]);
  const isMountedRef = useRef(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const instanceId = useRef(Math.random().toString(36).substring(7)); // Simple ID for logging
  
  // Access journal store with primitive extraction
  const hasJournal = usePrimitiveStoreValue(
    useJournalStore,
    (state: JournalState) => state.hasJournal,
    false
  );
  
  const toggleJournal = useStableCallback(() => {
    console.log('[JournalAnimation] Toggling journal via store');
    const journalStore = useJournalStore.getState();
    journalStore.toggleJournal();
  }, []);
  
  // Create and manage beams
  const createBeams = (count: number) => {
    if (!journalRef.current || !isMountedRef.current) return;
    
    const beamsContainer = document.createElement('div');
    beamsContainer.className = 'absolute inset-0 overflow-visible beam-container';
    
    for (let i = 0; i < count; i++) {
      const angle = (i * 360 / count);
      const beam = document.createElement('div');
      beam.className = 'beam absolute bg-white';
      beam.style.transformOrigin = 'center bottom';
      beam.style.width = '2px';
      beam.style.height = '0';
      beam.style.bottom = '50%';
      beam.style.left = '50%';
      beam.style.transform = `translateX(-50%) rotate(${angle}deg)`;
      beam.style.animation = `growBeam 1.8s ease-out forwards ${i * 0.05}s`;
      beamsContainer.appendChild(beam);
    }
    
    journalRef.current.appendChild(beamsContainer);
  };
  
  // Create splash particles effect
  const createSplashEffect = () => {
    if (!journalRef.current || !isMountedRef.current) return;
    
    const splashContainer = document.createElement('div');
    splashContainer.className = 'absolute inset-0 overflow-visible splash-container';
    
    // Create colorful particles
    const colors = ['#61dafb', '#ffd700', '#ff6b6b', '#48bb78', '#9f7aea', '#ed8936'];
    
    for (let i = 0; i < 40; i++) {
      const particle = document.createElement('div');
      const size = Math.random() * 5 + 2;
      const color = colors[Math.floor(Math.random() * colors.length)];
      const angle = Math.random() * 360;
      const distance = Math.random() * 150 + 50;
      
      particle.className = 'absolute rounded-full splash-particle';
      particle.style.width = `${size}px`;
      particle.style.height = `${size}px`;
      particle.style.backgroundColor = color;
      particle.style.top = '50%';
      particle.style.left = '50%';
      particle.style.transform = 'translate(-50%, -50%)';
      particle.style.animation = `splashParticle 0.8s ease-out forwards`;
      particle.style.animationDelay = `${Math.random() * 0.3}s`;
      
      // Set the custom properties for the animation
      particle.style.setProperty('--angle', `${angle}deg`);
      particle.style.setProperty('--distance', `${distance}px`);
      
      splashContainer.appendChild(particle);
    }
    
    journalRef.current.appendChild(splashContainer);
  };
  
  // Stable callback for starting the animation
  const startAnimation = useStableCallback((tier: 'base' | 'technical' | 'annotated' = 'base') => {
    console.log(`[JournalAnimation] Starting animation with tier: ${tier}`);
    
    // Ensure we have the needed elements
    if (!containerRef.current || !journalRef.current || !isMountedRef.current) {
      console.warn('[JournalAnimation] Cannot start animation - missing refs or not mounted');
      return;
    }
    
    // Play whimsical sound and track its duration
    const audio = new Audio('/sounds/rogue.boop-whimsy.mp3');
    audioRef.current = audio;
    
    // Get audio duration and set up the animation sequence
    audio.addEventListener('loadedmetadata', () => {
      const duration = audio.duration * 1000; // convert to ms
      console.log(`[JournalAnimation] Audio duration: ${duration}ms`);
      
      // Schedule color transition near the end of the audio
      // Make the color transition happen a half second sooner
      const colorTransitionTime = Math.max(duration - 700, duration * 0.7);
      
      // Set timeouts based on audio duration
      timerRefs.current.push(setTimeout(() => {
        if (!isMountedRef.current) return;
        setAnimationStage('color');
        createSplashEffect();
      }, colorTransitionTime));
      
      // Show tooltip after animation completes
      timerRefs.current.push(setTimeout(() => {
        if (!isMountedRef.current) return;
        setShowTooltip(true);
      }, duration + 500));
    });
    
    // Set volume to a much lower level (20% of original)
    audio.volume = 0.2;
    
    // Start playing the sound
    audio.play().catch(err => {
      console.error('[JournalAnimation] Failed to play sound:', err);
      // Fallback if audio fails to play
      timerRefs.current.push(setTimeout(() => {
        if (!isMountedRef.current) return;
        setAnimationStage('color');
        createSplashEffect();
      }, 1300)); // Reduced by 500ms to make it happen sooner
      
      // Show tooltip after animation completes (fallback)
      timerRefs.current.push(setTimeout(() => {
        if (!isMountedRef.current) return;
        setShowTooltip(true);
      }, 2000));
    });
    
    // Set internal state
    journalTierRef.current = tier;
    isVisibleRef.current = true;
    animationPhaseRef.current = 'fadeIn';
    
    // Force the container to be visible and ensure it's using flex display
    containerRef.current.style.display = 'flex';
    
    // Force reflow for animation to take effect
    void containerRef.current.offsetWidth;
    
    // Start the animation sequence
    setAnimationStage('beams');
    
    // Create the beam effects
    timerRefs.current.push(setTimeout(() => {
      if (!isMountedRef.current) return;
      createBeams(24); // Create 24 beams around the journal
    }, 300));
    
    // Transition to display phase after animation sequence
    const displayTimer = setTimeout(() => {
      if (!isMountedRef.current) return;
      
      // --- DEBUG --- Log completion timeout firing
      console.log('[JournalAnimation Debug] Display timer fired, setting stage to complete.');
      // --- END DEBUG ---

      animationPhaseRef.current = 'display';
      setAnimationStage('complete');
    }, 5000);
    
    timerRefs.current.push(displayTimer);
  }, []);
  
  // Handle animation completion
  const handleClose = useStableCallback(() => {
    // --- DEBUG --- Log handleClose call
    console.log(`[JournalAnimation Debug] handleClose called. Current stage: ${animationStage}`);
    // --- END DEBUG ---
    console.log('[JournalAnimation] Closing animation');
    
    if (!containerRef.current || !isMountedRef.current) {
      console.warn('[JournalAnimation] Cannot close animation - missing refs or not mounted');
      return;
    }
    
    // Stop audio if playing
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    
    animationPhaseRef.current = 'fadeOut';
    
    // Fade out background only, not the content
    const bgElement = containerRef.current.querySelector('.bg-black\\/80');
    if (bgElement) {
      bgElement.classList.add('animate-fadeOut');
    } else {
      // Fallback if we can't find the background element
      containerRef.current.classList.add('animate-fadeOut');
    }
    
    // Hide component after fade out
    const hideTimer = setTimeout(() => {
      if (!isMountedRef.current) return;
      
      isVisibleRef.current = false;
      
      if (containerRef.current) {
        containerRef.current.style.display = 'none';
      }
      
      console.log('[JournalAnimation] Animation completed, calling onComplete');
      
      // Ensure the journal's floating button is visible
      try {
        const journalStore = useJournalStore.getState();
        // Trigger a store update to make sure Journal component reacts
        if (journalStore.hasJournal === false && journalStore.initializeJournal) {
          journalStore.initializeJournal(journalTierRef.current);
        }
        
        // Find and show the floating button directly if it exists
        const floatingButton = document.querySelector('.fixed.bottom-6.right-6');
        if (floatingButton instanceof HTMLElement) {
          floatingButton.style.display = 'block';
        }
      } catch (error) {
        console.error('[JournalAnimation] Error ensuring floating button is visible:', error);
      }
      
      if (onComplete) {
        onComplete();
      }
    }, 800);
    
    timerRefs.current.push(hideTimer);
  }, [onComplete]);
  
  // Handle journal icon click
  const handleJournalClick = useStableCallback(() => {
    // --- DEBUG --- Log click event regardless of stage
    console.log(`[JournalAnimation Debug] handleJournalClick triggered. Current stage: ${animationStage}`);
    // --- END DEBUG ---
    if (animationStage === 'complete') {
      console.log('[JournalAnimation] Journal icon clicked, opening journal');
      toggleJournal();
      handleClose();
    }
  }, [toggleJournal, handleClose, animationStage]);
  
  // Listen for journal acquisition events
  useEventSubscription(
    GameEventType.JOURNAL_ACQUIRED,
    (event) => {
      // --- DEBUG --- Log event reception with instance ID
      console.log(`[JournalAnimation Debug - Instance ${instanceId.current}] Received JOURNAL_ACQUIRED event`, event);
      // --- END DEBUG ---
      
      if (!isMountedRef.current) {
        console.warn(`[JournalAnimation - Instance ${instanceId.current}] Ignoring event - component not mounted`);
        return;
      }
      
      const payload = event.payload as any;
      const tier = payload?.tier || 'base';
      
      console.log(`[JournalAnimation] Starting animation with tier: ${tier}, payload:`, payload);
      
      // Initialize journal in store if needed
      if (!hasJournal) {
        try {
          const journalStore = useJournalStore.getState();
          if (journalStore.initializeJournal) {
            journalStore.initializeJournal(tier);
            console.log(`[JournalAnimation] Initialized journal with tier: ${tier}`);
          }
        } catch (error) {
          console.error('[JournalAnimation] Error initializing journal:', error);
        }
      }
      
      // Start animation with the appropriate tier
      startAnimation(tier);
    },
    []
  );
  
  // Setup and cleanup
  useEffect(() => {
    isMountedRef.current = true;
    // --- DEBUG --- Log component mount with instance ID
    console.log(`[JournalAnimation Debug - Instance ${instanceId.current}] Component mounted`);
    // --- END DEBUG ---
    
    // Add extra check to ensure we're ready to handle events
    if (containerRef.current) {
      // Initially hidden but ready
      containerRef.current.style.display = 'none';
      console.log('[JournalAnimation] Component ready to handle events');
    }
    
    // Cleanup function
    return () => {
      isMountedRef.current = false;
      // --- DEBUG --- Log component unmount with instance ID
      console.log(`[JournalAnimation Debug - Instance ${instanceId.current}] Component unmounted`);
      // --- END DEBUG ---
      
      // Stop audio if playing
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      
      // Clear all pending timers
      timerRefs.current.forEach(timer => clearTimeout(timer));
      timerRefs.current = [];
    };
  }, []);
  
  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 items-center justify-center z-[1000]"
      style={{ display: 'none' }} // Initially hidden
    >
      {/* Separate background div that can be faded independently */}
      <div className="absolute inset-0 bg-black/80"></div>
      <div className="max-w-md text-center">
        {/* Journal with dramatic grow and beam effects */}
        <div 
          className="w-32 h-40 mx-auto relative"
          style={{ cursor: animationStage === 'complete' ? 'pointer' : 'default' }}
        >
          <motion.div 
            ref={journalRef} 
            className="w-full h-full relative flex items-center justify-center"
            initial={{ scale: 0.2 }}
            animate={{ 
              scale: animationStage === 'hidden' ? 0.2 : 1.2,
              y: animationStage === 'hidden' ? 20 : 0
            }}
            transition={{ 
              type: "spring", 
              duration: 1.2,
              bounce: 0.4
            }}
            onClick={handleJournalClick}
          >
            {/* Growing glow effect */}
            <motion.div 
              className="absolute inset-0 bg-white rounded-lg blur-md"
              animate={{ 
                opacity: animationStage === 'beams' ? 0.9 : 0.3,
                scale: animationStage === 'beams' ? 1.8 : 1.2
              }}
              transition={{ duration: 1.2 }}
            />
            
            {/* White journal (visible during beam phase) */}
            <motion.div 
              ref={whiteJournalRef}
              className="relative w-24 h-24 z-10 white-journal"
              animate={{ 
                opacity: animationStage === 'color' ? 0 : 1
              }}
              transition={{ duration: 0.3 }}
            >
              <svg width="100%" height="100%">
                <image 
                  href="/icons/educational.png"
                  width="100%" 
                  height="100%" 
                  style={{ 
                    imageRendering: 'pixelated',
                    shapeRendering: 'crispEdges',
                    filter: 'brightness(10) saturate(0)' // Make it white
                  }}
                />
              </svg>
            </motion.div>
            
            {/* Colored journal (appears after beam phase) */}
            <motion.div 
              ref={colorJournalRef}
              className="absolute w-24 h-24 z-20"
              animate={{ 
                opacity: animationStage === 'color' || animationStage === 'complete' ? 1 : 0,
                scale: animationStage === 'color' ? [1, 1.3, 1] : 1
              }}
              transition={{ 
                opacity: { duration: 0.2 },
                scale: { duration: 0.5, times: [0, 0.3, 1] }
              }}
            >
              <svg width="100%" height="100%" className={animationStage === 'complete' ? 'animate-gentle-float' : ''}>
                <image 
                  href="/icons/educational.png"
                  width="100%" 
                  height="100%" 
                  style={{ 
                    imageRendering: 'pixelated',
                    shapeRendering: 'crispEdges'
                  }}
                />
              </svg>
            </motion.div>
            
            {/* Tooltip for the journal - appears after animation completes */}
            {showTooltip && animationStage === 'complete' && (
              <div 
                ref={tooltipRef}
                className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 bg-blue-900 border border-blue-400 text-white px-4 py-2 rounded-md shadow-lg tooltip-pulse pointer-events-none"
                style={{ width: 'max-content', minWidth: '140px', zIndex: 30 }}
              >
                <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 border-l-[8px] border-r-[8px] border-b-[8px] border-l-transparent border-r-transparent border-b-blue-900"></div>
                <p className="text-sm font-pixel">Click to open Journal</p>
              </div>
            )}
          </motion.div>
        </div>
      </div>
      
      {/* CSS for enhanced animations */}
      <style jsx global>{`
        @keyframes fadeOut {
          0% { opacity: 0.8; }
          100% { opacity: 0; }
        }
        
        @keyframes pulseGlow {
          0%, 100% { text-shadow: 0 0 8px rgba(255, 255, 255, 0.6); }
          50% { text-shadow: 0 0 15px rgba(255, 255, 255, 0.9), 0 0 20px rgba(124, 191, 253, 0.7); }
        }
        
        @keyframes growBeam {
          0% { height: 0; opacity: 0.3; }
          70% { height: 150px; opacity: 0.9; }
          100% { height: 200px; opacity: 0; }
        }
        
        @keyframes splashParticle {
          0% { transform: translate(-50%, -50%); opacity: 1; }
          100% { 
            transform: translate(calc(-50% + var(--distance) * cos(var(--angle))), 
                      calc(-50% + var(--distance) * sin(var(--angle)))); 
            opacity: 0; 
          }
        }
        
        @keyframes gentleFloat {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          25% { transform: translateY(-5px) rotate(-2deg); }
          75% { transform: translateY(3px) rotate(2deg); }
        }
        
        @keyframes tooltipPulse {
          0% { opacity: 0.8; box-shadow: 0 0 5px rgba(59, 130, 246, 0.6); }
          50% { opacity: 1; box-shadow: 0 0 12px rgba(59, 130, 246, 0.9); }
          100% { opacity: 0.8; box-shadow: 0 0 5px rgba(59, 130, 246, 0.6); }
        }
        
        .animate-fadeOut {
          animation: fadeOut 0.7s forwards;
        }
        
        .animate-pulse-glow {
          animation: pulseGlow 2s ease-in-out infinite;
        }
        
        .animate-gentle-float {
          animation: gentleFloat 4s ease-in-out infinite;
        }
        
        .beam {
          filter: blur(1px);
          box-shadow: 0 0 8px 2px rgba(255, 255, 255, 0.7);
        }
        
        .splash-particle {
          position: absolute;
          box-shadow: 0 0 5px 2px rgba(255, 255, 255, 0.5);
        }
        
        .white-journal {
          filter: drop-shadow(0 0 10px rgba(255, 255, 255, 0.8));
        }
        
        .tooltip-pulse {
          animation: tooltipPulse 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}