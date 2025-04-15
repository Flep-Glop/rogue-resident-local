// app/components/journal/Journal.tsx
'use client';
import React, { useCallback, useEffect, useRef } from 'react';
import { useJournalStore } from '@/app/store/journalStore';
import { useGameStore } from '@/app/store/gameStore';
import { useEventSubscription } from '@/app/core/events/CentralEventBus';
import { GameEventType } from '@/app/core/events/EventTypes';
import { PixelText } from '../PixelThemeProvider';

// Import optimized hooks for primitive extractions
import {
  usePrimitiveStoreValue,
  useStableStoreValue,
  createStableSelector,
  useStableCallback
} from '@/app/core/utils/storeHooks';

// Define valid page types to ensure type safety across the UI
export type JournalPageType = 'knowledge' | 'characters' | 'notes' | 'references';
export type JournalTier = 'base' | 'technical' | 'annotated';

// Type definitions for store states
interface JournalState {
  hasJournal: boolean;
  isJournalOpen: boolean;
  currentUpgrade: JournalTier;
  currentPage: JournalPageType;
  initializeJournal?: (tier: JournalTier) => void;
  toggleJournal: () => void;
  setJournalOpen: (isOpen: boolean) => void;
  setCurrentPage: (page: JournalPageType) => void;
  [key: string]: any;
}

interface GameState {
  gamePhase: string;
  [key: string]: any;
}

// Simple placeholder components for the missing journal pages
const JournalKnowledgePage = () => (
  <div className="p-4">
    <h2 className="text-2xl mb-4">Knowledge</h2>
    <p className="text-gray-300">Knowledge entries will appear here as you discover them.</p>
  </div>
);

const JournalCharactersPage = () => (
  <div className="p-4">
    <h2 className="text-2xl mb-4">Characters</h2>
    <p className="text-gray-300">Character information will be recorded here.</p>
  </div>
);

const JournalNotesPage = () => (
  <div className="p-4">
    <h2 className="text-2xl mb-4">Notes</h2>
    <p className="text-gray-300">Your research notes will be collected here.</p>
  </div>
);

const JournalReferencesPage = () => (
  <div className="p-4">
    <h2 className="text-2xl mb-4">References</h2>
    <p className="text-gray-300">Reference materials will be cataloged here.</p>
  </div>
);

/**
 * Journal Component - Refactored with Chamber Transition Pattern
 * 
 * Follows key architectural principles:
 * 1. Uses primitive value extraction for store data
 * 2. DOM-based animations instead of React state
 * 3. Stable function references with minimal dependencies
 * 4. Refs for non-rendered state
 * 
 * FIXES:
 * 1. CRITICAL: Using consistent default values to prevent hydration mismatch
 * 2. Improved error handling for missing methods
 * 3. Enhanced stability with better refs tracking
 * 4. Added explicit logging for debugging
 */
export default function Journal() {
  // PATTERN: DOM refs for direct manipulation
  const journalContainerRef = useRef<HTMLDivElement>(null);
  const particlesContainerRef = useRef<HTMLDivElement>(null);
  const floatingButtonRef = useRef<HTMLDivElement>(null);
  
  // PATTERN: Refs for internal state
  const isMountedRef = useRef(true);
  const animationTimersRef = useRef<Record<string, NodeJS.Timeout>>({});
  const internalStateRef = useRef({
    isAnimating: false,
    showFloatingButton: false,
    journalAnimating: false,
    originalBodyOverflow: ''
  });
  
  // PATTERN: Extract primitive values with CONSISTENT DEFAULTS to prevent hydration mismatch
  const hasJournal = usePrimitiveStoreValue(
    useJournalStore,
    (state: JournalState) => state.hasJournal,
    false
  );
  
  const isJournalOpen = usePrimitiveStoreValue(
    useJournalStore,
    (state: JournalState) => state.isJournalOpen,
    false
  );
  
  // CRITICAL FIX: Always use 'base' as default for consistent hydration
  const currentUpgrade = usePrimitiveStoreValue(
    useJournalStore,
    (state: JournalState) => state.currentUpgrade,
    'base' as JournalTier
  );
  
  const currentPage = usePrimitiveStoreValue(
    useJournalStore,
    (state: JournalState) => state.currentPage, 
    'knowledge' as JournalPageType
  );
  
  // PATTERN: Extract game state primitives
  const gamePhase = usePrimitiveStoreValue(
    useGameStore,
    (state: GameState) => state.gamePhase,
    'day'
  );
  
  // PATTERN: Safe store actions extraction with fallbacks
  const toggleJournal = useCallback(() => {
    console.log('[Journal] Toggling journal open/closed');
    try {
      const journalStore = useJournalStore.getState();
      if (journalStore.toggleJournal) {
        journalStore.toggleJournal();
      } else if (journalStore.setJournalOpen) {
        // Fallback if toggleJournal is unavailable
        journalStore.setJournalOpen(!isJournalOpen);
      } else {
        console.warn('[Journal] Journal toggle functions not available');
      }
    } catch (e) {
      console.error('[Journal] Error toggling journal:', e);
    }
  }, [isJournalOpen]);
  
  const setCurrentPage = useCallback((page: JournalPageType) => {
    console.log(`[Journal] Setting page to: ${page}`);
    try {
      const journalStore = useJournalStore.getState();
      if (journalStore.setCurrentPage) {
        journalStore.setCurrentPage(page);
      } else {
        console.warn('[Journal] setCurrentPage function not available');
      }
    } catch (e) {
      console.error('[Journal] Error setting journal page:', e);
    }
  }, []);
  
  // PATTERN: Cleanup timers helper with stable reference
  const clearAllTimers = useCallback(() => {
    Object.values(animationTimersRef.current).forEach(timer => {
      clearTimeout(timer);
    });
    animationTimersRef.current = {};
  }, []);
  
  // PATTERN: DOM-based animation helpers
  const startJournalAnimation = useCallback(() => {
    console.log('[Journal] Starting journal animation');
    if (!journalContainerRef.current) {
      console.warn('[Journal] Cannot start animation - container ref is null');
      return;
    }
    
    const container = journalContainerRef.current;
    internalStateRef.current.isAnimating = true;
    
    // Add animation class
    container.classList.add('journal-animating');
    
    // Remove after animation completes
    animationTimersRef.current.journalAnimation = setTimeout(() => {
      if (isMountedRef.current && container) {
        container.classList.remove('journal-animating');
        internalStateRef.current.isAnimating = false;
      }
    }, 300);
  }, []);
  
  const startParticleEffects = useCallback(() => {
    if (!particlesContainerRef.current) return;
    
    const container = particlesContainerRef.current;
    
    // Show particles container
    container.style.display = 'block';
    
    // Add animation classes to particles
    const particleElements = container.querySelectorAll('.particle');
    particleElements.forEach((particle, index) => {
      setTimeout(() => {
        if (particle instanceof HTMLElement) {
          particle.classList.add('particle-animate');
        }
      }, index * 100); // Stagger start times
    });
    
    // Hide after animation completes
    animationTimersRef.current.particleEffect = setTimeout(() => {
      if (isMountedRef.current && container) {
        container.style.display = 'none';
        
        // Reset particle animations
        particleElements.forEach(particle => {
          if (particle instanceof HTMLElement) {
            particle.classList.remove('particle-animate');
          }
        });
      }
    }, 5000);
  }, []);
  
  const showFloatingButton = useCallback(() => {
    console.log('[Journal] Showing floating button');
    if (!floatingButtonRef.current) {
      console.warn('[Journal] Cannot show floating button - ref is null');
      return;
    }
    
    const button = floatingButtonRef.current;
    
    // Show the button
    button.style.display = 'block';
    button.classList.add('animate-float');
    
    // Update internal state
    internalStateRef.current.showFloatingButton = true;
  }, []);
  
  // PATTERN: Handle body overflow when journal is open
  useEffect(() => {
    if (isJournalOpen) {
      console.log('[Journal] Journal opened - locking body scroll');
      // Store original overflow
      internalStateRef.current.originalBodyOverflow = document.body.style.overflow;
      
      // Lock the background
      document.body.style.overflow = 'hidden';
      
      // Start open animation
      startJournalAnimation();
    } else {
      // Restore original overflow
      document.body.style.overflow = internalStateRef.current.originalBodyOverflow;
    }
    
    // Unlock when closing
    return () => {
      if (isJournalOpen) {
        document.body.style.overflow = internalStateRef.current.originalBodyOverflow;
      }
    };
  }, [isJournalOpen, startJournalAnimation]);
  
  // PATTERN: Night phase particle effects
  useEffect(() => {
    if (isJournalOpen && gamePhase === 'night') {
      startParticleEffects();
    }
  }, [isJournalOpen, gamePhase, startParticleEffects]);
  
  // PATTERN: Event subscription for journal acquisition
  useEventSubscription(
    GameEventType.JOURNAL_ACQUIRED,
    useCallback((event) => {
      console.log('[Journal] Received JOURNAL_ACQUIRED event', event);
      
      if (!isMountedRef.current) {
        console.warn('[Journal] Ignoring journal acquired event - component not mounted');
        return;
      }
      
      const payload = event.payload as any;
      if (payload) {
        // Check if journal is already initialized
        const journalStore = useJournalStore.getState();
        if (!journalStore.hasJournal && journalStore.initializeJournal) {
          console.log(`[Journal] Initializing journal with tier: ${payload.tier || 'base'}`);
          journalStore.initializeJournal(payload.tier || 'base');
        }
        
        // Mark journal as animating
        internalStateRef.current.journalAnimating = true;
        
        // Show animation in DOM directly
        if (document.getElementById('journal-acquisition-overlay')) {
          const overlay = document.getElementById('journal-acquisition-overlay');
          if (overlay) {
            console.log('[Journal] Showing acquisition overlay');
            overlay.style.display = 'flex';
            
            // Add animation class
            overlay.classList.add('journal-acquisition-active');
          }
        }
        
        // Show floating button after animation completes
        animationTimersRef.current.journalAcquisition = setTimeout(() => {
          if (isMountedRef.current) {
            console.log('[Journal] Journal acquisition animation completed');
            // Reset animation state
            internalStateRef.current.journalAnimating = false;
            
            // Hide animation overlay
            if (document.getElementById('journal-acquisition-overlay')) {
              const overlay = document.getElementById('journal-acquisition-overlay');
              if (overlay) {
                overlay.style.display = 'none';
                overlay.classList.remove('journal-acquisition-active');
              }
            }
            
            // Show floating button
            showFloatingButton();
          }
        }, 3000);
      }
    }, [showFloatingButton])
  );
  
  // Special effect to ensure floating button shows even if animation was missed
  useEffect(() => {
    if (hasJournal && !isJournalOpen && !internalStateRef.current.showFloatingButton) {
      console.log('[Journal] Journal exists but floating button not shown - showing now');
      const timer = setTimeout(() => {
        if (isMountedRef.current) {
          internalStateRef.current.showFloatingButton = true;
          if (floatingButtonRef.current) {
            floatingButtonRef.current.style.display = 'block';
          }
        }
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [hasJournal, isJournalOpen]);
  
  // PATTERN: Component lifecycle
  useEffect(() => {
    // Mark as mounted
    isMountedRef.current = true;
    console.log('[Journal] Component mounted, hasJournal:', hasJournal);
    
    // Add global CSS for animations
    const styleId = 'journal-animations';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.innerHTML = `
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }

        @keyframes ping {
          75%, 100% {
            transform: scale(2);
            opacity: 0;
          }
        }

        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        
        .journal-animating {
          transform: scale(0.95);
          opacity: 0.9;
          transition: transform 0.3s, opacity 0.3s;
        }
        
        .particle-animate {
          animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) forwards;
        }
        
        .animate-pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        
        .journal-acquisition-active {
          animation: fadeIn 0.5s forwards;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `;
      document.head.appendChild(style);
    }
    
    return () => {
      // Mark as unmounted
      isMountedRef.current = false;
      console.log('[Journal] Component unmounted');
      
      // Clear all timers
      clearAllTimers();
      
      // Don't remove the style as other components might be using it
    };
  }, [clearAllTimers, hasJournal]);
  
  // DEBUGGING: Log key states to help track hydration mismatches
  useEffect(() => {
    console.log('[Journal] Render with tier:', currentUpgrade, 'hasJournal:', hasJournal, 'isOpen:', isJournalOpen);
  }, [currentUpgrade, hasJournal, isJournalOpen]);
  
  // Don't render anything if player doesn't have journal or it's not open
  if (!hasJournal || !isJournalOpen) {
    if (!hasJournal) {
      console.log('[Journal] Not rendering - player doesn\'t have journal yet');
    } else if (!isJournalOpen) {
      console.log('[Journal] Not rendering - journal is not open');
    }
    return null;
  }
  
  console.log('[Journal] Rendering open journal');
  
  // Determine journal cover style based on upgrade level
  const getJournalCoverStyle = () => {
    switch(currentUpgrade) {
      case 'base': return 'bg-gradient-to-b from-amber-800 to-amber-900';
      case 'technical': return 'bg-gradient-to-b from-clinical-dark to-clinical';
      case 'annotated': return 'bg-gradient-to-b from-clinical-dark to-clinical-light';
      default: return 'bg-gradient-to-b from-amber-800 to-amber-900'; // Fallback to base
    }
  };
  
  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-[9999] bg-black/70"
      onClick={(e) => {
        e.stopPropagation();
        toggleJournal();
      }}
      style={{ touchAction: 'none' }} // Prevent scroll on mobile
    >
      {/* Main journal container */}
      <div
        ref={journalContainerRef}
        className={`
          journal-container
          relative w-[900px] h-[650px]
          ${getJournalCoverStyle()}
          pixel-borders
          transform transition-all duration-300
        `}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Journal cover decoration */}
        <div className="absolute inset-2 border border-amber-500/30 pointer-events-none"></div>

        {/* Night phase knowledge transfer particles */}
        <div 
          ref={particlesContainerRef}
          className="absolute inset-0 overflow-hidden pointer-events-none z-50"
          style={{ display: 'none' }}
        >
          <div className="absolute inset-0 bg-educational/10 animate-pulse"></div>
          <div className="particle absolute top-0 left-1/2 w-1 h-1 bg-educational rounded-full"></div>
          <div className="particle absolute top-0 left-1/3 w-2 h-2 bg-clinical rounded-full" style={{ animationDelay: '100ms' }}></div>
          <div className="particle absolute top-0 right-1/4 w-1 h-1 bg-qa rounded-full" style={{ animationDelay: '300ms' }}></div>
          <div className="particle absolute top-0 left-2/3 w-2 h-2 bg-educational-light rounded-full" style={{ animationDelay: '500ms' }}></div>
          <div className="particle absolute top-0 right-1/3 w-1 h-1 bg-clinical-light rounded-full" style={{ animationDelay: '700ms' }}></div>
        </div>

        {/* Close button */}
        <div
          role="button"
          tabIndex={0}
          className="absolute -top-4 -right-4 w-8 h-8 bg-surface pixel-borders-thin flex items-center justify-center hover:bg-clinical transition-colors z-[100] cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            toggleJournal();
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.stopPropagation();
              toggleJournal();
            }
          }}
          aria-label="Close journal"
        >
          <span>✕</span>
        </div>

        {/* Journal content */}
        <div className="flex h-full journal-content relative z-10" onClick={(e) => e.stopPropagation()}>
          {/* Tabs sidebar with simplified buttons */}
          <div className="w-[200px] bg-surface-dark border-r border-border relative z-20">
            <div className="p-4">
              <PixelText className="text-xl mb-4 text-center">Journal</PixelText>

              <div className="space-y-2">
                {/* Tab buttons */}
                {['knowledge', 'characters', 'notes', 'references'].map((tabId) => (
                  <div
                    key={tabId}
                    className={`w-full cursor-pointer transition-colors relative z-30 ${currentPage === tabId ? 'bg-clinical text-white' : 'hover:bg-surface'}`}
                    role="button"
                    tabIndex={0}
                    onClick={() => setCurrentPage(tabId as JournalPageType)}
                  >
                    <div className="p-2">
                      <PixelText>{tabId.charAt(0).toUpperCase() + tabId.slice(1)}</PixelText>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Journal quality indicator */}
            <div className="absolute bottom-4 left-4 w-[180px]">
              <div className="p-2 bg-surface-dark/70 text-center">
                <PixelText className="text-xs">
                  {currentUpgrade === 'base' && "Basic Notebook"}
                  {currentUpgrade === 'technical' && "Technical Journal"}
                  {currentUpgrade === 'annotated' && "Annotated Journal"}
                </PixelText>
              </div>
            </div>
          </div>

          {/* Journal pages */}
          <div
            className="flex-1 bg-surface overflow-y-auto p-6 relative z-20"
            onClick={(e) => e.stopPropagation()}
          >
            {currentPage === 'knowledge' && <JournalKnowledgePage />}
            {currentPage === 'characters' && <JournalCharactersPage />}
            {currentPage === 'notes' && <JournalNotesPage />}
            {currentPage === 'references' && <JournalReferencesPage />}
          </div>
        </div>
      </div>

      {/* Hidden journal acquisition overlay for animations */}
      <div 
        id="journal-acquisition-overlay"
        className="fixed inset-0 bg-black/80 z-[10000] flex items-center justify-center"
        style={{ display: 'none' }}
      >
        <div className="text-center">
          <div className="text-4xl mb-6 animate-pulse">✨</div>
          <PixelText className="text-2xl mb-4">Journal Acquired!</PixelText>
          <p className="text-gray-300 mb-8">This will be essential for tracking your learning journey.</p>
          <div className="w-64 h-64 mx-auto border-4 border-clinical pixel-borders flex items-center justify-center animate-float">
            <PixelText className="text-xl">Medical Physics Journal</PixelText>
          </div>
        </div>
      </div>
    </div>
  );
}