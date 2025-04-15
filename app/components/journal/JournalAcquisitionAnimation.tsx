// app/components/journal/JournalAcquisitionAnimation.tsx
/**
 * JournalAcquisitionAnimation - Enhanced with Chamber Pattern
 * 
 * Improvements:
 * 1. DOM-based animations instead of React state
 * 2. Refs for tracking animation state
 * 3. Stable callbacks for event handling
 * 4. Primitive value extraction from store
 * 5. Proper cleanup on unmount
 * 6. Enhanced debug logging
 */
import React, { useRef, useEffect } from 'react';
import { useJournalStore } from '../../store/journalStore';
import { useEventSubscription } from '../../core/events/CentralEventBus';
import { GameEventType } from '../../core/events/EventTypes';
import { usePrimitiveStoreValue, useStableCallback } from '../../core/utils/storeHooks';

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
  const particlesRef = useRef<HTMLDivElement>(null);
  
  // Refs for state tracking that don't trigger re-renders
  const isVisibleRef = useRef(false);
  const animationPhaseRef = useRef<'fadeIn' | 'display' | 'fadeOut'>('fadeIn');
  const journalTierRef = useRef<'base' | 'technical' | 'annotated'>('base');
  const timerRefs = useRef<NodeJS.Timeout[]>([]);
  const isMountedRef = useRef(true);
  
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
  
  // Stable callback for starting the animation
  const startAnimation = useStableCallback((tier: 'base' | 'technical' | 'annotated' = 'base') => {
    console.log(`[JournalAnimation] Starting animation with tier: ${tier}`);
    
    if (!containerRef.current || !journalRef.current || !isMountedRef.current) {
      console.warn('[JournalAnimation] Cannot start animation - missing refs or not mounted');
      return;
    }
    
    // Set internal state
    journalTierRef.current = tier;
    isVisibleRef.current = true;
    animationPhaseRef.current = 'fadeIn';
    
    // Make container visible
    containerRef.current.style.display = 'flex';
    
    // Force reflow for animation
    void containerRef.current.offsetWidth;
    
    // Start fade in
    containerRef.current.classList.add('animate-fadeIn');
    containerRef.current.classList.remove('animate-fadeOut');
    
    // Journal bounce in animation
    if (journalRef.current) {
      journalRef.current.classList.add('animate-bounce-in-intense');
    }
    
    // Start particle effects
    if (particlesRef.current) {
      const particles = particlesRef.current.querySelectorAll('.particle');
      particles.forEach((p, i) => {
        const particle = p as HTMLElement;
        particle.style.animationDelay = `${i * 0.05}s`;
        particle.classList.add('animate-particle');
      });
    }
    
    // Create sparkle elements - MORE OF THEM!
    if (journalRef.current) {
      for (let i = 0; i < 30; i++) {
        const sparkle = document.createElement('div');
        sparkle.className = 'sparkle absolute';
        
        // Random positioning around the journal
        const size = Math.random() * 5 + 2;
        sparkle.style.width = `${size}px`;
        sparkle.style.height = `${size}px`;
        sparkle.style.left = `${Math.random() * 200 - 50}%`;
        sparkle.style.top = `${Math.random() * 200 - 50}%`;
        sparkle.style.backgroundColor = ['#FFD700', '#FFEC8B', '#E6E6FA', '#87CEFA', '#00FFFF', '#FF00FF'][Math.floor(Math.random() * 6)];
        sparkle.style.borderRadius = '50%';
        sparkle.style.opacity = '0';
        sparkle.style.animationDelay = `${Math.random() * 1.5}s`;
        sparkle.style.animationDuration = `${Math.random() * 1 + 1}s`;
        sparkle.classList.add('animate-sparkle-intense');
        
        journalRef.current.appendChild(sparkle);
      }
    }
    
    // Create shock wave effect
    if (journalRef.current) {
      const shockWave = document.createElement('div');
      shockWave.className = 'absolute inset-0 rounded-full animate-shockwave';
      shockWave.style.border = '2px solid rgba(255, 255, 255, 0.7)';
      journalRef.current.appendChild(shockWave);
      
      // Add a second shock wave with delay
      const shockWave2 = document.createElement('div');
      shockWave2.className = 'absolute inset-0 rounded-full animate-shockwave';
      shockWave2.style.border = '2px solid rgba(124, 191, 253, 0.7)';
      shockWave2.style.animationDelay = '0.5s';
      journalRef.current.appendChild(shockWave2);
    }
    
    // Transition to display phase after fade in
    const displayTimer = setTimeout(() => {
      if (!isMountedRef.current) return;
      
      animationPhaseRef.current = 'display';
      if (containerRef.current) {
        containerRef.current.classList.remove('animate-fadeIn');
      }
      
      // Add pulse effect to title after initial animation
      const titleEl = document.querySelector('.journal-title');
      if (titleEl) {
        titleEl.classList.add('animate-pulse-glow-intense');
      }
    }, 800); // Faster transition
    
    timerRefs.current.push(displayTimer);
  }, []);
  
  // Handle animation completion
  const handleClose = useStableCallback(() => {
    console.log('[JournalAnimation] Closing animation');
    
    if (!containerRef.current || !isMountedRef.current) {
      console.warn('[JournalAnimation] Cannot close animation - missing refs or not mounted');
      return;
    }
    
    animationPhaseRef.current = 'fadeOut';
    
    // Start fade out animation
    containerRef.current.classList.add('animate-fadeOut');
    containerRef.current.classList.remove('animate-fadeIn');
    
    // Hide component after fade out
    const hideTimer = setTimeout(() => {
      if (!isMountedRef.current) return;
      
      isVisibleRef.current = false;
      
      if (containerRef.current) {
        containerRef.current.style.display = 'none';
      }
      
      console.log('[JournalAnimation] Animation completed, calling onComplete');
      if (onComplete) {
        onComplete();
      }
    }, 800); // Faster transition
    
    timerRefs.current.push(hideTimer);
  }, [onComplete]);
  
  // Handle journal open button
  const handleOpenJournal = useStableCallback(() => {
    console.log('[JournalAnimation] Opening journal');
    toggleJournal();
    handleClose();
  }, [toggleJournal, handleClose]);
  
  // Listen for journal acquisition events
  useEventSubscription(
    GameEventType.JOURNAL_ACQUIRED,
    (event) => {
      console.log('[JournalAnimation] Received JOURNAL_ACQUIRED event', event);
      
      if (!isMountedRef.current) {
        console.warn('[JournalAnimation] Ignoring event - component not mounted');
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
    console.log('[JournalAnimation] Component mounted');
    
    // Hide container initially to avoid flash
    if (containerRef.current) {
      containerRef.current.style.display = 'none';
    }
    
    // Cleanup function
    return () => {
      isMountedRef.current = false;
      console.log('[JournalAnimation] Component unmounted');
      
      // Clear all pending timers
      timerRefs.current.forEach(timer => clearTimeout(timer));
      timerRefs.current = [];
    };
  }, []);
  
  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 items-center justify-center z-[1000] bg-black/80"
      style={{ display: 'none' }} // Initially hidden
    >
      <div className="max-w-md text-center">
        {/* Journal icon */}
        <div className="w-32 h-40 mx-auto mb-6 relative">
          <div ref={journalRef} className="w-full h-full relative flex items-center justify-center animate-float-intense">
            <div className="absolute inset-0 rounded-sm bg-blue-400/30 animate-pulse-intense"></div>
            <div className="relative w-20 h-20">
              <svg width="100%" height="100%" className="animate-tilt-oscillate">
                <image 
                  href="/icons/educational.png"
                  width="100%" 
                  height="100%" 
                  className="z-10"
                  style={{ 
                    imageRendering: 'pixelated',
                    shapeRendering: 'crispEdges', 
                    filter: 'brightness(1.2) contrast(1.1)' 
                  }}
                />
              </svg>
            </div>
            
            {/* Particle effects container */}
            <div ref={particlesRef} className="absolute -inset-12 pointer-events-none">
              {[...Array(20)].map((_, i) => (
                <div 
                  key={i}
                  className={`particle absolute w-${Math.floor(Math.random() * 3) + 1} h-${Math.floor(Math.random() * 3) + 1} bg-${['clinical', 'educational', 'qa', 'amber-500', 'blue-400', 'cyan-300', 'purple-400'][Math.floor(Math.random() * 7)]} rounded-full opacity-90`}
                  style={{
                    top: `${Math.random() * 100}%`,
                    left: `${Math.random() * 100}%`,
                  }}
                ></div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Title with glow effect */}
        <h2 
          className="journal-title text-3xl font-pixel text-white mb-4 animate-glow-intense transition-all"
        >
          Journal Acquired!
        </h2>
        
        {/* Description based on tier */}
        <p className="text-gray-300 mb-6 journal-description animate-fade-in-up-fast">
          You've received a notebook to record your observations.
        </p>
        
        {/* Buttons */}
        <div className="flex justify-center space-x-4">
          <button
            className="px-6 py-2 bg-clinical hover:bg-clinical-light text-white font-pixel transition-colors animate-fade-in-left-fast"
            onClick={handleOpenJournal}
          >
            Open Journal
          </button>
          
          <button
            className="px-6 py-2 bg-surface hover:bg-surface-dark text-white font-pixel transition-colors animate-fade-in-right-fast"
            onClick={handleClose}
          >
            Continue
          </button>
        </div>
      </div>
      
      {/* CSS for animations - using global style for animation definitions */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes fadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }
        
        @keyframes floatIntense {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-15px); }
        }
        
        @keyframes tiltOscillate {
          0%, 100% { transform: rotate(-15deg); }
          50% { transform: rotate(15deg); }
        }
        
        @keyframes pulseGlowIntense {
          0%, 100% { text-shadow: 0 0 12px rgba(255, 255, 255, 0.8), 0 0 20px rgba(124, 191, 253, 0.7), 0 0 30px rgba(0, 191, 255, 0.5); }
          50% { text-shadow: 0 0 25px rgba(255, 255, 255, 1), 0 0 40px rgba(124, 191, 253, 0.9), 0 0 60px rgba(0, 191, 255, 0.7); }
        }
        
        @keyframes pulseIntense {
          0%, 100% { opacity: 0.4; transform: scale(0.98); }
          50% { opacity: 0.9; transform: scale(1.05); }
        }
        
        @keyframes bounceInIntense {
          0% { transform: scale(0); opacity: 0; }
          40% { transform: scale(0.6); }
          60% { transform: scale(1.3); }
          80% { transform: scale(0.9); }
          90% { transform: scale(1.1); }
          100% { transform: scale(1); opacity: 1; }
        }
        
        @keyframes fadeInUpFast {
          0% { opacity: 0; transform: translateY(30px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes fadeInLeftFast {
          0% { opacity: 0; transform: translateX(-30px); }
          100% { opacity: 1; transform: translateX(0); }
        }
        
        @keyframes fadeInRightFast {
          0% { opacity: 0; transform: translateX(30px); }
          100% { opacity: 1; transform: translateX(0); }
        }
        
        @keyframes sparkleIntense {
          0% { transform: scale(0); opacity: 0; }
          50% { transform: scale(1.5); opacity: 1; filter: drop-shadow(0 0 5px currentColor); }
          100% { transform: scale(0); opacity: 0; }
        }
        
        @keyframes shockwave {
          0% { transform: scale(0.5); opacity: 1; }
          100% { transform: scale(2.5); opacity: 0; }
        }
        
        @keyframes particle1Intense {
          0% { transform: translate(0, 0) rotate(0deg); opacity: 1; }
          100% { transform: translate(-80px, -100px) rotate(720deg); opacity: 0; }
        }
        
        @keyframes particle2Intense {
          0% { transform: translate(0, 0) rotate(0deg); opacity: 1; }
          100% { transform: translate(100px, -120px) rotate(-720deg); opacity: 0; }
        }
        
        @keyframes particle3Intense {
          0% { transform: translate(0, 0) rotate(0deg); opacity: 1; }
          100% { transform: translate(-70px, 130px) rotate(360deg); opacity: 0; }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.7s forwards;
        }
        
        .animate-fadeOut {
          animation: fadeOut 0.7s forwards;
        }
        
        .animate-float-intense {
          animation: floatIntense 3s ease-in-out infinite;
        }
        
        .animate-tilt-oscillate {
          animation: tiltOscillate 2.5s ease-in-out infinite;
          transform-origin: center center;
        }
        
        .animate-pulse-glow-intense {
          animation: pulseGlowIntense 1.5s ease-in-out infinite;
        }
        
        .animate-pulse-intense {
          animation: pulseIntense 2s ease-in-out infinite;
        }
        
        .animate-bounce-in-intense {
          animation: bounceInIntense 0.8s cubic-bezier(0.215, 0.610, 0.355, 1.000) forwards;
        }
        
        .animate-fade-in-up-fast {
          animation: fadeInUpFast 0.4s ease-out forwards;
          animation-delay: 0.2s;
          opacity: 0;
        }
        
        .animate-fade-in-left-fast {
          animation: fadeInLeftFast 0.4s ease-out forwards;
          animation-delay: 0.3s;
          opacity: 0;
        }
        
        .animate-fade-in-right-fast {
          animation: fadeInRightFast 0.4s ease-out forwards;
          animation-delay: 0.4s;
          opacity: 0;
        }
        
        .animate-sparkle-intense {
          animation: sparkleIntense 2s ease-in-out infinite;
        }
        
        .animate-shockwave {
          animation: shockwave 1.5s ease-out forwards;
        }
        
        .animate-particle:nth-child(3n+1) {
          animation: particle1Intense 1.8s ease-out infinite;
        }
        
        .animate-particle:nth-child(3n+2) {
          animation: particle2Intense 2s ease-out infinite;
        }
        
        .animate-particle:nth-child(3n) {
          animation: particle3Intense 2.2s ease-out infinite;
        }
        
        .animate-glow-intense {
          text-shadow: 0 0 12px rgba(255, 255, 255, 0.8), 0 0 20px rgba(124, 191, 253, 0.7);
        }
      `}</style>
      
      {/* Script for updating description text based on journal tier */}
      <script dangerouslySetInnerHTML={{
        __html: `
          document.addEventListener('DOMContentLoaded', function() {
            const updateDescription = function() {
              const descriptionEl = document.querySelector('.journal-description');
              if (!descriptionEl) return;
              
              const journalEl = document.querySelector('#journalRef');
              if (!journalEl) return;
              
              // Determine tier from journal class
              let tier = 'base';
              if (journalEl.classList.contains('bg-clinical-light')) {
                tier = 'annotated';
              } else if (journalEl.classList.contains('bg-clinical')) {
                tier = 'technical';
              }
              
              // Update text based on tier
              if (tier === 'base') {
                descriptionEl.textContent = "You've received a basic notebook to record your observations.";
              } else if (tier === 'technical') {
                descriptionEl.textContent = "You've received a technical journal with specialized sections for medical physics notes.";
              } else {
                descriptionEl.textContent = "You've received an annotated journal with expert guidance and reference sections!";
              }
            };
            
            // Run initially and set a mutation observer to check for changes
            updateDescription();
            
            const observer = new MutationObserver(updateDescription);
            observer.observe(document.body, { subtree: true, attributes: true, attributeFilter: ['class'] });
          });
        `
      }} />
    </div>
  );
}