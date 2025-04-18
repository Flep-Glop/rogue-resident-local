// app/components/journal/JournalAcquisitionAnimation.tsx
/**
 * JournalAcquisitionAnimation - Optimized for performance
 * 
 * Features:
 * 1. Lightweight DOM-based animations
 * 2. Refs for tracking animation state
 * 3. Stable callbacks for event handling
 * 4. PixelButton components for consistent UI
 * 5. Proper cleanup on unmount
 */
import React, { useRef, useEffect } from 'react';
import { useJournalStore } from '../../store/journalStore';
import { useEventSubscription } from '../../core/events/CentralEventBus';
import { GameEventType } from '../../core/events/EventTypes';
import { usePrimitiveStoreValue, useStableCallback } from '../../core/utils/storeHooks';
import { PixelButton } from '../PixelThemeProvider';

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
    
    // Ensure we have the needed elements
    if (!containerRef.current || !journalRef.current || !isMountedRef.current) {
      console.warn('[JournalAnimation] Cannot start animation - missing refs or not mounted');
      return;
    }
    
    // Set internal state
    journalTierRef.current = tier;
    isVisibleRef.current = true;
    animationPhaseRef.current = 'fadeIn';
    
    // Force the container to be visible and ensure it's using flex display
    containerRef.current.style.display = 'flex';
    
    // Force reflow for animation to take effect
    void containerRef.current.offsetWidth;
    
    // Start fade in
    containerRef.current.classList.add('animate-fadeIn');
    containerRef.current.classList.remove('animate-fadeOut');
    
    // Journal animations
    if (journalRef.current) {
      journalRef.current.classList.add('animate-scale-in');
      
      // Add single glow element that oscillates
      if (glowRef.current) {
        glowRef.current.classList.add('animate-pulse');
      }
    }
    
    // Create a simple border animation (just 1 element)
    if (journalRef.current) {
      const border = document.createElement('div');
      border.className = 'absolute inset-0 border-2 border-blue-400 rounded animate-border-pulse';
      journalRef.current.appendChild(border);
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
        titleEl.classList.add('animate-pulse-glow');
      }
    }, 800);
    
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
    }, 800);
    
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
    
    // Add extra check to ensure we're ready to handle events
    if (containerRef.current) {
      // Initially hidden but ready
      containerRef.current.style.display = 'none';
      console.log('[JournalAnimation] Component ready to handle events');
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
        {/* Journal icon with oscillation */}
        <div className="w-32 h-40 mx-auto mb-6 relative">
          <div 
            ref={journalRef} 
            className="w-full h-full relative flex items-center justify-center animate-float"
          >
            {/* Glow effect */}
            <div 
              ref={glowRef}
              className="absolute inset-0 bg-blue-400/20 rounded-lg blur-sm"
            ></div>
            
            <div className="relative w-20 h-20">
              <svg width="100%" height="100%" className="animate-oscillate">
                <image 
                  href="/icons/educational.png"
                  width="100%" 
                  height="100%" 
                  className="z-10"
                  style={{ 
                    imageRendering: 'pixelated',
                    shapeRendering: 'crispEdges'
                  }}
                />
              </svg>
            </div>
          </div>
        </div>
        
        {/* Title with glow effect */}
        <h2 
          className="journal-title text-3xl font-pixel text-white mb-4 animate-glow transition-all"
        >
          Journal Acquired!
        </h2>
        
        {/* Description based on tier */}
        <p className="text-gray-300 mb-6 journal-description animate-fade-in-up">
          You've received a notebook to record your observations.
        </p>
        
        {/* Buttons using PixelButton */}
        <div className="flex justify-center space-x-4">
          <PixelButton
            variant="clinical"
            onClick={handleOpenJournal}
            className="animate-fade-in-up"
          >
            Open Journal
          </PixelButton>
          
          <PixelButton
            variant="default"
            onClick={handleClose}
            className="animate-fade-in-up"
          >
            Continue
          </PixelButton>
        </div>
      </div>
      
      {/* CSS for optimized animations */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes fadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        
        @keyframes oscillate {
          0%, 100% { transform: rotate(-8deg); }
          50% { transform: rotate(8deg); }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 0.4; transform: scale(0.95); }
          50% { opacity: 0.8; transform: scale(1.05); }
        }
        
        @keyframes pulseGlow {
          0%, 100% { text-shadow: 0 0 8px rgba(255, 255, 255, 0.6); }
          50% { text-shadow: 0 0 15px rgba(255, 255, 255, 0.9), 0 0 20px rgba(124, 191, 253, 0.7); }
        }
        
        @keyframes scaleIn {
          0% { transform: scale(0.5); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        
        @keyframes fadeInUp {
          0% { opacity: 0; transform: translateY(15px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes borderPulse {
          0%, 100% { border-color: rgba(96, 165, 250, 0.4); }
          50% { border-color: rgba(96, 165, 250, 0.9); }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.7s forwards;
        }
        
        .animate-fadeOut {
          animation: fadeOut 0.7s forwards;
        }
        
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        
        .animate-oscillate {
          animation: oscillate 2.5s ease-in-out infinite;
          transform-origin: center center;
        }
        
        .animate-pulse {
          animation: pulse 2s ease-in-out infinite;
        }
        
        .animate-pulse-glow {
          animation: pulseGlow 1.5s ease-in-out infinite;
        }
        
        .animate-scale-in {
          animation: scaleIn 0.8s forwards;
        }
        
        .animate-fade-in-up {
          animation: fadeInUp 0.5s ease-out forwards;
          animation-delay: 0.1s;
          opacity: 0;
        }
        
        .animate-border-pulse {
          animation: borderPulse 1.5s ease-in-out infinite;
        }
        
        .animate-glow {
          text-shadow: 0 0 8px rgba(255, 255, 255, 0.6);
        }
      `}</style>
    </div>
  );
}