// app/core/init.ts
'use client';

/**
 * Optimized Core Systems Initialization with Enhanced Debugging
 * 
 * Features:
 * 1. Phased initialization to prevent circular dependencies
 * 2. Retry and timeout handling with clear error messaging
 * 3. Debug status tracking via window.__INIT_STATE__
 * 4. Comprehensive error handling and reporting
 * 5. Configurable timeouts and retry attempts
 * 6. Store persistence stabilization
 * 7. Fix for store sequence initialization
 */
import { useEffect, useState, useRef, useCallback } from 'react';

// Core System Imports - using consistent pattern
import { useGameStore } from '../store/gameStore';  
import { useGameStateMachine } from './statemachine/GameStateMachine';
import { useJournalStore } from '../store/journalStore';
import { useKnowledgeStore } from '../store/knowledgeStore';
import { useResourceStore } from '../store/resourceStore';
import { useEventBus, safeDispatch } from './events/CentralEventBus';
import { useDialogueStateMachine } from './dialogue/DialogueStateMachine';

// Specific utilities
import CentralEventBus from './events/CentralEventBus';
import { DialogueStateMachine } from './dialogue/DialogueStateMachine';
import { setupGameStateMachine } from './statemachine/GameStateMachine';
import { setupProgressionResolver } from './progression/ProgressionResolver';
import ActionIntegration from './dialogue/ActionIntegration';

// Storage utilities
import { 
  hasInitFailed, 
  clearGameData, 
  clearInitFailed, 
  markInitFailed
} from './utils/storageUtils';

// Chamber Pattern Debugging - only in development
import { createTrackedStores } from '@/app/core/utils/storeAnalyzer';

// Type imports
import type { GameEventType } from './events/EventTypes';

// Development mode detection
const IS_DEV = process.env.NODE_ENV !== 'production';

// Type definition for module hot reloading
interface NodeModule {
  hot?: {
    accept(path?: string, callback?: () => void): void;
    dispose(callback: (data: any) => void): void;
  };
}

// Type extensions for window object
declare global {
  interface Window {
    __FORCE_REINITIALIZE__?: () => void;
    __TOGGLE_DEBUG_PANEL__?: () => void;
    __INIT_STATE__?: any;
    __INIT_LOG__?: Array<{timestamp: number, type: string, message: string}>;
    __CHAMBER_DEBUG__?: {
      resetStats: () => void;
    };
    __STORE_ANALYZER__?: {
      reset: () => void;
    };
    __CORE_SYSTEMS_DEBUG__?: any;
  }
}

declare const module: NodeModule;

// ======== INITIALIZATION CONFIG ========

// Configuration settings
const INIT_CONFIG = {
  MAX_ATTEMPTS: 3,              // Maximum initialization attempts
  RETRY_DELAY: 500,             // Delay between retry attempts (ms)
  CLEANUP_DELAY: 100,           // Small delay before reinitializing
  ERROR_REPORTING_THRESHOLD: 2, // Log first N errors only
  STORE_INIT_DELAY: 100,        // Delay before store initialization to break circular deps
  MAX_INIT_TIME: 10000          // Maximum time allowed for initialization (ms)
};

// Global initialization state tracking - accessible from window
const INIT_STATE: {
  inProgress: boolean;
  completed: boolean;
  attempts: number;
  errorCount: number;
  initSteps: Record<string, boolean>;
  lastError: string | null;
  startTime: number;
  completionTime: number;
} = {
  inProgress: false,
  completed: false,
  attempts: 0,
  errorCount: 0,
  initSteps: {
    eventBus: false,
    dialogueStateMachine: false,
    actionIntegration: false,
    gameStateMachine: false,
    progressionResolver: false,
    resourceStore: false,
    gameStore: false,
    chamberDiagnostics: false
  },
  lastError: null,
  startTime: 0,
  completionTime: 0
};

// Clear any corrupted localStorage state that might be preventing initialization
if (typeof window !== 'undefined') {
  try {
    // Only clear if we've failed previous attempts
    if (hasInitFailed()) {
      console.warn('[Init] Detected previous initialization failure, clearing localStorage state');
      clearGameData();
      clearInitFailed();
    }
  } catch (e) {
    console.warn('[Init] Error accessing localStorage:', e);
  }
  
  // Expose initialization state globally for debugging
  window.__INIT_STATE__ = INIT_STATE;
}

/**
 * Log initialization message with appropriate styling and timestamp
 */
function logInit(message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info'): void {
  if (!IS_DEV) return; // Only log in development
  
  const styles = {
    info: 'color: #3b82f6',
    success: 'color: #10b981; font-weight: bold',
    warning: 'color: #f59e0b',
    error: 'color: #ef4444; font-weight: bold'
  };
  
  const timestamp = new Date().toISOString().substr(11, 8);
  console.log(`%c[${timestamp}][Init] ${message}`, styles[type]);
  
  // Also add to initialization log history in window for debugging
  if (typeof window !== 'undefined') {
    const logHistory = window.__INIT_LOG__ || [];
    logHistory.push({ timestamp: Date.now(), type, message });
    window.__INIT_LOG__ = logHistory.slice(-100); // Keep last 100 logs
  }
}

/**
 * Main initialization hook with enhanced reliability and debugging
 */
export function useCoreInitialization() {
  // Component state
  const [initialized, setInitialized] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const [initProgress, setInitProgress] = useState<number>(0);
  const [initPhase, setInitPhase] = useState<string>('pending');
  
  // Critical references to prevent re-renders
  const gameStoreReady = useRef(true); // Assume ready to avoid circular dep
  
  // Refs for cleanup and tracking
  const initTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const componentMountedRef = useRef(true);
  const errorReportedRef = useRef(0);
  const maxInitTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // ======== CORE INITIALIZATION LOGIC ========
  
  const initializeSystems = useCallback(() => {
    // Skip if already fully initialized at module level
    if (INIT_STATE.completed) {
      logInit("Core systems already fully initialized.", "success");
      setInitialized(true);
      setInitProgress(100);
      setInitPhase('completed');
      return;
    }
    
    // Prevent concurrent initialization
    if (INIT_STATE.inProgress) {
      logInit("Initialization already in progress, waiting...", "warning");
      setInitPhase('in-progress');
      return;
    }
    
    // Track attempts to avoid infinite loops
    INIT_STATE.attempts++;
    INIT_STATE.inProgress = true;
    INIT_STATE.startTime = Date.now();
    
    setInitPhase('starting');
    setInitProgress(5);
    
    // Set a maximum initialization timer
    if (maxInitTimerRef.current) {
      clearTimeout(maxInitTimerRef.current);
    }
    
    maxInitTimerRef.current = setTimeout(() => {
      if (INIT_STATE.inProgress && !INIT_STATE.completed) {
        logInit(`Initialization timed out after ${INIT_CONFIG.MAX_INIT_TIME}ms`, "error");
        
        // Mark initialization as failed for next page load to clear localStorage
        if (typeof window !== 'undefined') {
          try {
            markInitFailed();
          } catch (e) {
            console.warn('[Init] Error setting localStorage:', e);
          }
        }
        
        INIT_STATE.inProgress = false;
        INIT_STATE.lastError = "Initialization timed out";
        setInitError("Initialization timed out");
        setInitPhase('failed');
        
        // Attempt one emergency reset
        if (typeof window !== 'undefined') {
          console.warn('[Init] Attempting emergency reset of all stores');
          try {
            clearGameData();
          } catch (e) {
            console.warn('[Init] Error clearing localStorage:', e);
          }
          
          // Force reload after a small delay
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        }
      }
    }, INIT_CONFIG.MAX_INIT_TIME);
    
    // Check if we've exceeded max attempts
    if (INIT_STATE.attempts > INIT_CONFIG.MAX_ATTEMPTS) {
      const errorMsg = `Max initialization attempts (${INIT_CONFIG.MAX_ATTEMPTS}) exceeded`;
      logInit(errorMsg, "error");
      setInitError(errorMsg);
      setInitialized(false);
      setInitPhase('failed');
      INIT_STATE.inProgress = false;
      INIT_STATE.lastError = errorMsg;
      return;
    }
    
    logInit(`Attempting core system initialization (attempt ${INIT_STATE.attempts}/${INIT_CONFIG.MAX_ATTEMPTS})...`, "info");

    // Reset all init step tracking
    Object.keys(INIT_STATE.initSteps).forEach(key => {
      INIT_STATE.initSteps[key as keyof typeof INIT_STATE.initSteps] = false;
    });

    // TWO-PHASE INITIALIZATION
    // Phase 1: Initialize core systems that don't depend on stores
    initializeCoreSystemsPhase1()
      .then(() => {
        // Phase 2: Initialize stores with a delay to break circular dependencies
        setTimeout(initializeStoresPhase2, INIT_CONFIG.STORE_INIT_DELAY);
      })
      .catch(error => {
        handleInitError(error);
      });
  }, []);
  
  /**
   * Phase 1: Initialize core systems that don't rely on stores
   */
  const initializeCoreSystemsPhase1 = async () => {
    try {
      // 1. Initialize Event Bus
      setInitPhase('event-bus');
      setInitProgress(10);
      logInit("Initializing Event Bus...");
      
      const eventBus = CentralEventBus;
      const eventBusStore = useEventBus.getState();
      
      if (!eventBus || !eventBusStore) {
        throw new Error("Event Bus initialization failed");
      }
      
      // Log all available properties of the event bus for debugging
      logInit(`Event Bus properties: ${Object.keys(eventBusStore).join(', ')}`);
      INIT_STATE.initSteps.eventBus = true;
      logInit("✅ Event Bus initialized");
      setInitProgress(20);

      // 2. Initialize Dialogue State Machine
      setInitPhase('dialogue-system');
      logInit("Initializing Dialogue State Machine...");
      
      const dialogueStateMachine = DialogueStateMachine;
      const dialogueStore = useDialogueStateMachine.getState();
      
      if (!dialogueStateMachine || !dialogueStore) {
        throw new Error("Dialogue State Machine initialization failed");
      }
      
      // Log dialogue state machine properties
      logInit(`Dialogue State Machine properties: ${Object.keys(dialogueStore).join(', ')}`);
      INIT_STATE.initSteps.dialogueStateMachine = true;
      logInit("✅ Dialogue State Machine initialized");
      setInitProgress(30);

      // 3. Reference Action Integration module
      setInitPhase('action-integration');
      logInit("Referencing Action Integration module...");
      
      const actionIntegration = ActionIntegration;
      
      if (!actionIntegration) {
        throw new Error("Action Integration module reference failed");
      }
      
      // Log action integration properties
      logInit(`Action Integration available: ${!!actionIntegration}`);
      INIT_STATE.initSteps.actionIntegration = true;
      logInit("✅ Action Integration module referenced");
      setInitProgress(40);

      // 4. Initialize Game State Machine
      setInitPhase('game-state-machine');
      logInit("Initializing Game State Machine...");
      
      const stateMachine = useGameStateMachine.getState();
      
      if (!stateMachine) {
        throw new Error("Game State Machine reference failed");
      }
      
      // Log state machine properties
      logInit(`Game State Machine properties: ${Object.keys(stateMachine).join(', ')}`);
      INIT_STATE.initSteps.gameStateMachine = true;
      logInit("✅ Game State Machine initialized");
      setInitProgress(50);

      // 5. Reference Progression Resolver
      setInitPhase('progression-resolver');
      logInit("Referencing Progression Resolver...");
      
      const progressionResolver = setupProgressionResolver();
      
      if (!progressionResolver) {
        throw new Error("Progression Resolver reference failed");
      }
      
      // Log progression resolver properties
      logInit(`Progression Resolver available: ${!!progressionResolver}`);
      INIT_STATE.initSteps.progressionResolver = true;
      logInit("✅ Progression Resolver referenced");
      setInitProgress(60);
      
      return true;
    } catch (error) {
      throw error; // Re-throw to be handled by the caller
    }
  };
  
  /**
   * Phase 2: Initialize stores with delay to break circular dependencies
   */
  const initializeStoresPhase2 = async () => {
    try {
      // 6. Initialize Resource Store
      setInitPhase('resource-store');
      setInitProgress(50);
      
      logInit("Phase 2: Initializing resource store...");
      
      // Allow a short delay to break potential dependency cycles
      await new Promise(resolve => setTimeout(resolve, INIT_CONFIG.STORE_INIT_DELAY));
      
      // Get a reference to the resource store
      try {
        useResourceStore.getState();
        INIT_STATE.initSteps.resourceStore = true;
        logInit("Resource store initialized", "success");
      } catch (e) {
        handleInitError(e); 
        return;
      }
      
      // 7. Initialize Game Store
      setInitPhase('game-store');
      setInitProgress(60);
      
      logInit("Phase 2: Initializing game store...");
      
      try {
        const gameStore = useGameStore.getState();
        gameStoreReady.current = true;
        INIT_STATE.initSteps.gameStore = true;
        logInit("Game store initialized", "success");
      } catch (e) {
        handleInitError(e);
        return;
      }
      
      // 8. Initialize Knowledge Store with discovered concepts
      setInitPhase('knowledge-store');
      setInitProgress(70);
      
      logInit("Phase 2: Initializing knowledge store...");
      
      try {
        const knowledgeStore = useKnowledgeStore.getState();
        // Discover core concepts as starting points
        const coreConcepts = ['treatment-planning', 'radiation-therapy', 'linac-anatomy', 'dosimetry'];
        coreConcepts.forEach(conceptId => {
          knowledgeStore.discoverConcept(conceptId);
          // Give some initial mastery
          knowledgeStore.updateMastery(conceptId, 30);
        });
        logInit("Knowledge store initialized with core concepts", "success");
      } catch (e) {
        handleInitError(e);
        return;
      }
      
      // 9. Initialize Chamber Pattern diagnostics in development
      setInitPhase('chamber-diagnostics');
      setInitProgress(80);
      
      if (IS_DEV) {
        logInit("Phase 2: Setting up Chamber Pattern diagnostics...");
        try {
          // Initialize store analyzers for performance monitoring
          createTrackedStores();
          
          // Expose diagnostic reset method to window
          if (typeof window !== 'undefined') {
            window.__CHAMBER_DEBUG__ = {
              resetStats: () => {
                logInit("Resetting Chamber diagnostics", "info");
                window.__STORE_ANALYZER__?.reset();
              }
            };
          }
          
          INIT_STATE.initSteps.chamberDiagnostics = true;
          logInit("Chamber Pattern diagnostics initialized", "success");
        } catch (e) {
          logInit(`Chamber diagnostics initialization error: ${e}`, "warning");
          // Non-critical, continue initialization
        }
      }
      setInitProgress(90);

      // Verify all critical systems
      setInitPhase('verification');
      logInit("Phase 2: Verifying all core systems...");
      
      const criticalSystems = [
        'eventBus', 
        'dialogueStateMachine', 
        'gameStateMachine', 
        'resourceStore', 
        'gameStore'
      ];
      
      const missingSteps = criticalSystems.filter(
        step => !INIT_STATE.initSteps[step]
      );
      
      if (missingSteps.length > 0) {
        const errorMsg = `Initialization incomplete. Missing systems: ${missingSteps.join(', ')}`;
        logInit(errorMsg, "error");
        setInitError(errorMsg);
        INIT_STATE.inProgress = false;
        INIT_STATE.lastError = errorMsg;
        
        // Mark as failed for recovery on next load
        if (typeof window !== 'undefined') {
          try {
            markInitFailed();
          } catch (e) {
            console.warn('[Init] Error setting localStorage:', e);
          }
        }
        
        return;
      }
      
      // Successful initialization
      setInitPhase('completed');
      setInitProgress(100);
      
      INIT_STATE.inProgress = false;
      INIT_STATE.completed = true;
      INIT_STATE.completionTime = Date.now();
      
      logInit(`Core systems initialized in ${INIT_STATE.completionTime - INIT_STATE.startTime}ms`, "success");
      
      // If we get here, we're successfully initialized
      if (maxInitTimerRef.current) {
        clearTimeout(maxInitTimerRef.current);
        maxInitTimerRef.current = null;
      }
      
      // Set initialized state to trigger UI updates
      setInitialized(true);
    } catch (e) {
      handleInitError(e);
    }
  };
  
  /**
   * Handle initialization errors with consistent recovery
   */
  const handleInitError = (error: any) => {
    // Get error message
    const errorMsg = error instanceof Error ? error.message : String(error);
    
    // Update initialization state
    INIT_STATE.inProgress = false;
    INIT_STATE.lastError = errorMsg;
    
    setInitPhase('error');
    setInitProgress(0);
    
    // Only log errors up to threshold to avoid spam
    if (errorReportedRef.current < INIT_CONFIG.ERROR_REPORTING_THRESHOLD) {
      logInit(`❌ Error during core system initialization (${initPhase}): ${errorMsg}`, "error");
      console.error("Full error details:", error);
      errorReportedRef.current++;
    }
    
    // Set error state for UI
    setInitError(errorMsg);
    
    // Report error to event system if available
    try {
      safeDispatch('SYSTEM_ERROR' as any, { 
        component: 'initialization', 
        phase: initPhase,
        message: errorMsg, 
        error 
      });
    } catch (e) {
      // Fallback to console if event system unavailable
      if (errorReportedRef.current < INIT_CONFIG.ERROR_REPORTING_THRESHOLD) {
        console.error("Could not dispatch error event:", e);
      }
    }
    
    // Schedule retry if not too many attempts
    if (INIT_STATE.attempts < INIT_CONFIG.MAX_ATTEMPTS && componentMountedRef.current) {
      logInit(`⏱️ Scheduling initialization retry in ${INIT_CONFIG.RETRY_DELAY}ms...`, "warning");
      
      // Clear any existing timeout
      if (initTimeoutRef.current) {
        clearTimeout(initTimeoutRef.current);
      }
      
      // Schedule retry
      initTimeoutRef.current = setTimeout(() => {
        if (componentMountedRef.current) {
          logInit("🔄 Retrying initialization...", "info");
          INIT_STATE.inProgress = false; // Reset flag to allow retry
          initializeSystems();
        }
      }, INIT_CONFIG.RETRY_DELAY);
    } else {
      // Max attempts reached, mark as not in progress
      INIT_STATE.inProgress = false;
      setInitialized(false);
      
      // Mark as failed for next load
      if (typeof window !== 'undefined') {
        try {
          markInitFailed();
        } catch (e) {
          // Non-critical
        }
      }
    }
  };

  // ======== TEARDOWN LOGIC ========
  
  const teardownSystems = useCallback(() => {
    logInit("🧹 Tearing down core systems...", "info");

    // Cancel any pending initialization retries
    if (initTimeoutRef.current) {
      clearTimeout(initTimeoutRef.current);
      initTimeoutRef.current = null;
    }
    
    // Clear max init timer
    if (maxInitTimerRef.current) {
      clearTimeout(maxInitTimerRef.current);
      maxInitTimerRef.current = null;
    }

    // Reset module-level state for fresh initialization after teardown
    INIT_STATE.inProgress = false;
    INIT_STATE.completed = false;
    INIT_STATE.attempts = 0;
    INIT_STATE.errorCount = 0;
    INIT_STATE.startTime = 0;
    INIT_STATE.completionTime = 0;
    INIT_STATE.lastError = null;

    // Reset all init steps
    Object.keys(INIT_STATE.initSteps).forEach(key => {
      INIT_STATE.initSteps[key as keyof typeof INIT_STATE.initSteps] = false;
    });

    // Reset knowledge store if available
    try {
      const knowledgeStore = useKnowledgeStore.getState();
      if (knowledgeStore && knowledgeStore.resetKnowledge) {
        knowledgeStore.resetKnowledge();
        logInit("✅ Knowledge store reset");
      }
    } catch (e) { console.error("❌ Error resetting knowledge store:", e); }

    // Reset resource store if available
    try {
      const resourceStore = useResourceStore.getState();
      if (resourceStore && resourceStore.resetResources) {
        resourceStore.resetResources();
        logInit("✅ Resource store reset");
      }
    } catch (e) { console.error("❌ Error resetting resource store:", e); }

    // Clear journal store persistence if available
    try {
      const journalStore = useJournalStore;
      if (journalStore && journalStore.persist && journalStore.persist.clearStorage) {
        journalStore.persist.clearStorage();
        logInit("✅ Journal store persistence cleared");
      }
    } catch (e) { console.error("❌ Error clearing journal store persistence:", e); }
    
    // Reset Chamber Pattern diagnostics if available
    if (typeof window !== 'undefined') {
      try {
        if (window.__CHAMBER_DEBUG__?.resetStats) {
          window.__CHAMBER_DEBUG__.resetStats();
          logInit("✅ Chamber debug stats reset");
        }
        if (window.__STORE_ANALYZER__?.reset) {
          window.__STORE_ANALYZER__.reset();
          logInit("✅ Store analyzer reset");
        }
      } catch (e) { console.warn("⚠️ Error resetting Chamber Pattern diagnostics:", e); }
    }

    // Reset component state
    setInitialized(false);
    setInitPhase('reset');
    setInitProgress(0);
    logInit("✅ Core systems teardown complete", "success");
  }, []);

  // ======== REINITIALIZATION LOGIC ========
  
  const reinitialize = useCallback(() => {
    logInit("🔄 Reinitializing core systems...", "info");
    
    // Skip if initialization is already in progress
    if (INIT_STATE.inProgress) {
      logInit("⚠️ Initialization in progress, deferring reinitialization...", "warning");
      return;
    }
    
    // Perform full teardown first
    teardownSystems();
    
    // Reset error state
    setInitError(null);
    
    // Small delay to ensure clean teardown before reinitializing
    setTimeout(() => {
      if (componentMountedRef.current) {
        initializeSystems();
      }
    }, INIT_CONFIG.CLEANUP_DELAY);
  }, [teardownSystems, initializeSystems]);

  // ======== EFFECT FOR LIFECYCLE MANAGEMENT ========
  
  useEffect(() => {
    // Track component mount state
    componentMountedRef.current = true;
    logInit("🚀 Initialization component mounted", "info");
    
    // Initialize if not already done - use requestAnimationFrame for browser stability
    if (!initialized && !INIT_STATE.inProgress) {
      requestAnimationFrame(() => {
        // Small delay to allow store hooks to stabilize
        setTimeout(() => {
          if (componentMountedRef.current && !initialized && !INIT_STATE.inProgress) {
            initializeSystems();
          }
        }, 50);
      });
    }

    // Expose emergency reinitialize function and initialization state
    if (typeof window !== 'undefined') {
      window.__FORCE_REINITIALIZE__ = reinitialize;
      window.__INIT_STATE__ = INIT_STATE;
      
      // Add more comprehensive debug interface
      window.__CORE_SYSTEMS_DEBUG__ = {
        isInitialized: initialized,
        initState: { ...INIT_STATE },
        initError,
        initPhase,
        progress: initProgress,
        reinitialize,
        clearLocalStorage: () => {
          try {
            logInit("Clearing localStorage state...", "warning");
            clearGameData();
            return "LocalStorage cleared";
          } catch (e) {
            return `Error clearing localStorage: ${e}`;
          }
        },
        forceInitialize: () => {
          // Reset module state to force fresh initialization
          Object.keys(INIT_STATE.initSteps).forEach(key => {
            INIT_STATE.initSteps[key as keyof typeof INIT_STATE.initSteps] = false;
          });
          INIT_STATE.inProgress = false;
          INIT_STATE.completed = false;
          INIT_STATE.attempts = 0;
          INIT_STATE.errorCount = 0;
          initializeSystems();
          return "Force initialization triggered";
        },
        diagnostic: {
          hasEventBus: !!CentralEventBus,
          hasDialogueStateMachine: !!DialogueStateMachine,
          hasStateMachine: !!useGameStateMachine,
          hasProgressionResolver: !!setupProgressionResolver(),
          hasActionIntegration: !!ActionIntegration,
          hasResourceStore: !!useResourceStore,
          eventBusState: CentralEventBus?.getInstance()?.getState ? 
                         CentralEventBus.getInstance().getState() : 'Not available',
          gameStoreState: useGameStore.getState ? 
                         { ...useGameStore.getState(), player: 'Omitted for brevity' } : 'Not available'
        }
      };
    }

    // Handle HMR for Next.js - simplified approach
    if (IS_DEV && module.hot) {
      logInit("🔄 Setting up HMR for core systems");
      
      module.hot.accept();
      
      // Store state for HMR recovery
      module.hot.dispose(data => {
        logInit("♻️ HMR disposal - preserving state for refresh");
        data.wasInitialized = initialized;
        data.initState = { ...INIT_STATE };
        
        // Clear pending timeouts
        if (initTimeoutRef.current) {
          clearTimeout(initTimeoutRef.current);
        }
        
        if (maxInitTimerRef.current) {
          clearTimeout(maxInitTimerRef.current);
        }
      });
    }

    // Cleanup function
    return () => {
      logInit("🧹 Cleaning up core systems on unmount");
      componentMountedRef.current = false;
      
      // Clear pending timeouts
      if (initTimeoutRef.current) {
        clearTimeout(initTimeoutRef.current);
        initTimeoutRef.current = null;
      }
      
      if (maxInitTimerRef.current) {
        clearTimeout(maxInitTimerRef.current);
        maxInitTimerRef.current = null;
      }
      
      // Only teardown if we were initialized
      if (initialized) {
        try {
          teardownSystems();
        } catch (error) {
          console.error("❌ Error during core systems cleanup:", error);
        }
      }
    };
  }, [initialized, initializeSystems, reinitialize, teardownSystems, initPhase, initProgress, initError]);

  // Return initialization state and control methods
  return { 
    initialized, 
    reinitialize, 
    initError,
    initPhase,
    initProgress
  };
}