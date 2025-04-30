'use client';
import { useEffect, useState, useRef } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import GameContainer from './components/GameContainer';
import JournalAcquisitionAnimation from './components/journal/JournalAcquisitionAnimation';
import { useCoreInitialization } from './core/init';
import ChamberDebugInitializer from './components/debug/ChamberDebugInitializer';
import UnifiedDebugPanel from './components/debug/UnifiedDebugPanel';
import { useKnowledgeStore } from './store/knowledgeStore';
import { GameEventType } from './core/events/EventTypes';
import { safeDispatch } from './core/events/CentralEventBus';

// Debug styles for initialization visualization
const debugStyles = {
  container: "fixed inset-0 bg-black bg-opacity-90 text-white flex flex-col items-center justify-center z-50 p-8",
  header: "text-2xl font-bold mb-6 text-blue-400",
  progressContainer: "w-full max-w-md h-4 bg-gray-800 rounded-full overflow-hidden mb-4",
  progressBar: "h-full transition-all duration-300 ease-out",
  status: "text-lg mb-2",
  phaseText: "text-sm mb-4 text-blue-300",
  errorText: "text-sm text-red-400 mb-4 max-w-md overflow-auto max-h-32 bg-gray-900 p-3 rounded",
  buttonContainer: "flex space-x-4 mt-4",
  button: "px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors",
  systemStatus: "text-xs mt-6 text-left max-w-md",
  systemItem: "flex justify-between mb-1",
  debugInfo: "mt-6 p-3 bg-gray-900 rounded text-xs font-mono max-w-md overflow-auto max-h-40"
};

/**
 * Improved Vertical Slice Entry Point with Enhanced Debugging
 * 
 * This component provides:
 * 1. Detailed visual feedback on initialization status
 * 2. Rich error reporting with stack traces
 * 3. Initialization phase tracking
 * 4. System status overview
 * 5. Unified debug controls for troubleshooting
 */
export default function VerticalSlicePage() {
  // Initialize core systems with enhanced return values
  const { initialized, reinitialize, initError, initPhase, initProgress } = useCoreInitialization();
  
  // Debug state
  const [showDebugPanel, setShowDebugPanel] = useState(true);
  const [debugInfo, setDebugInfo] = useState<any>({});
  const initStartTimeRef = useRef<number>(Date.now());
  const [initDuration, setInitDuration] = useState<number>(0);
  
  // FIX: Use state for system statuses to prevent hydration mismatch
  const [systemStatuses, setSystemStatuses] = useState<Record<string, boolean>>({});
  
  // Update debug info periodically
  useEffect(() => {
    if (!initialized) {
      const timer = setInterval(() => {
        if (typeof window !== 'undefined') {
          setDebugInfo({
            initState: (window as any).__INIT_STATE__ || {},
            lastError: (window as any).__INIT_STATE__?.lastError || null,
            elapsedTime: Date.now() - initStartTimeRef.current
          });
          
          // FIX: Update system statuses from window object
          const initState = (window as any).__INIT_STATE__ || { initSteps: {} };
          setSystemStatuses(initState.initSteps || {});
        }
      }, 200);
      
      return () => clearInterval(timer);
    } else {
      // Set final duration when initialization completes
      setInitDuration(Date.now() - initStartTimeRef.current);
      
      // No longer auto-hiding the debug panel - wait for user to click "Continue to Game"
    }
  }, [initialized]);
  
  // Create refs for the audio elements
  const introMusicRef = useRef<HTMLAudioElement | null>(null);
  const backgroundLoopRef = useRef<HTMLAudioElement | null>(null);
  const fadeIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const crossFadeIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isPlayingRef = useRef<boolean>(false);
  
  // Initialize the audio elements when the component mounts
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Setup intro music
      introMusicRef.current = new Audio('/sounds/rogue.calm-intro.mp3');
      introMusicRef.current.volume = 0.3;
      
      // Setup background loop
      backgroundLoopRef.current = new Audio('/sounds/rogue.background-loop.mp3');
      backgroundLoopRef.current.volume = 0; // Start with volume at 0 for fade-in
      // Not using loop=true because we'll implement our own cross-fade looping
    }
    
    return () => {
      // Clean up audio on unmount
      if (introMusicRef.current) {
        introMusicRef.current.pause();
        introMusicRef.current = null;
      }
      
      if (backgroundLoopRef.current) {
        backgroundLoopRef.current.pause();
        backgroundLoopRef.current = null;
      }
      
      if (fadeIntervalRef.current) {
        clearInterval(fadeIntervalRef.current);
        fadeIntervalRef.current = null;
      }
      
      if (crossFadeIntervalRef.current) {
        clearInterval(crossFadeIntervalRef.current);
        crossFadeIntervalRef.current = null;
      }
    };
  }, []);
  
  // Set up cross-fade looping for background audio
  const handleBackgroundLoop = () => {
    if (!backgroundLoopRef.current) return;
    
    // Save the duration to calculate when to start the crossfade
    const audioDuration = backgroundLoopRef.current.duration;
    const crossFadeDuration = 2; // 2 seconds crossfade
    
    // Calculate when to start preparing the next loop (2 seconds before end)
    const timeToStartCrossfade = audioDuration - crossFadeDuration;
    
    // Set up a timer to check current time and start crossfade when needed
    const checkTime = () => {
      if (backgroundLoopRef.current && backgroundLoopRef.current.currentTime >= timeToStartCrossfade && isPlayingRef.current) {
        // Create new audio element for the next loop while current one is still playing
        const nextLoop = new Audio('/sounds/rogue.background-loop.mp3');
        nextLoop.volume = 0; // Start silent for fade-in
        
        // Start playing the new loop
        nextLoop.play().catch(e => console.warn('Background loop restart failed:', e));
        
        // Crossfade between the two audio elements
        const startFadeTime = Date.now();
        const fadeDuration = crossFadeDuration * 1000; // Convert to milliseconds
        const targetVolume = 0.05;
        
        if (crossFadeIntervalRef.current) {
          clearInterval(crossFadeIntervalRef.current);
        }
        
        crossFadeIntervalRef.current = setInterval(() => {
          // Calculate progress (0 to 1)
          const progress = Math.min((Date.now() - startFadeTime) / fadeDuration, 1);
          
          // Fade out current loop
          if (backgroundLoopRef.current) {
            backgroundLoopRef.current.volume = targetVolume * (1 - progress);
          }
          
          // Fade in next loop
          nextLoop.volume = targetVolume * progress;
          
          // When crossfade is complete
          if (progress >= 1) {
            if (crossFadeIntervalRef.current) {
              clearInterval(crossFadeIntervalRef.current);
              crossFadeIntervalRef.current = null;
            }
            
            // Stop the old audio
            if (backgroundLoopRef.current) {
              backgroundLoopRef.current.pause();
            }
            
            // Replace the reference with the new audio
            backgroundLoopRef.current = nextLoop;
            
            // Set up the next loop check
            setTimeout(checkTime, 100);
          }
        }, 50); // Update every 50ms for smoother crossfade
        
        return;
      }
      
      // Continue checking if not time to crossfade yet
      setTimeout(checkTime, 100);
    };
    
    // Start the loop checking
    isPlayingRef.current = true;
    setTimeout(checkTime, 100);
  };

  // Play intro music function - will be called on user interaction
  const playIntroMusic = () => {
    if (introMusicRef.current) {
      introMusicRef.current.play().catch(e => 
        console.warn('Intro music playback failed:', e)
      );
      
      // Start background loop after 8 seconds with fade-in
      setTimeout(() => {
        if (backgroundLoopRef.current) {
          backgroundLoopRef.current.play().catch(e => 
            console.warn('Background loop playback failed:', e)
          );
          
          // Implement gradual fade-in
          let volume = 0;
          const targetVolume = 0.05; // Target volume (5%)
          const fadeStep = 0.01;
          const fadeInterval = 100; // Increase volume every 100ms
          
          fadeIntervalRef.current = setInterval(() => {
            volume = Math.min(volume + fadeStep, targetVolume);
            if (backgroundLoopRef.current) {
              backgroundLoopRef.current.volume = volume;
            }
            
            // Clear interval when target volume is reached
            if (volume >= targetVolume && fadeIntervalRef.current) {
              clearInterval(fadeIntervalRef.current);
              fadeIntervalRef.current = null;
              
              // Start the cross-fade looping system once initial fade-in is complete
              handleBackgroundLoop();
            }
          }, fadeInterval);
        }
      }, 8000); // 8 seconds after intro music starts
    }
  };
  
  // Make the reinitialize function available globally for emergency recovery
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).__FORCE_REINITIALIZE__ = reinitialize;
      (window as any).__TOGGLE_DEBUG_PANEL__ = () => setShowDebugPanel(prev => !prev);
    }
    
    console.log(`Core systems ${initialized ? 'are initialized' : 'initialization pending'}`);
    
    // Cleanup when component unmounts
    return () => {
      if (typeof window !== 'undefined') {
        delete (window as any).__FORCE_REINITIALIZE__;
        delete (window as any).__TOGGLE_DEBUG_PANEL__;
      }
    };
  }, [initialized, reinitialize]);
  
  // Check for any global errors
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error('Global error caught:', event.error);
      // You could set state here to show error details
    };
    
    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);
  
  // Render initialization status panel
  const renderInitializationStatus = () => {
    // Color based on status
    const getStatusColor = () => {
      if (initError) return 'bg-red-600';
      if (initialized) return 'bg-green-500';
      if (initPhase === 'starting') return 'bg-blue-500';
      return 'bg-yellow-500';
    };
    
    // Status text based on phase
    const getStatusText = () => {
      if (initError) return 'Initialization Failed';
      if (initialized) return 'Initialization Complete';
      return `Initializing: ${initPhase}`;
    };
    
    return (
      <div className={showDebugPanel ? debugStyles.container : 'hidden'}>
        <h1 className={debugStyles.header}>Rogue Resident Initialization</h1>
        
        <div className={debugStyles.progressContainer}>
          <div 
            className={`${debugStyles.progressBar} ${getStatusColor()}`} 
            style={{ width: `${initProgress}%` }}
          ></div>
        </div>
        
        <div className={debugStyles.status}>{getStatusText()}</div>
        <div className={debugStyles.phaseText}>Phase: {initPhase} ({initProgress}%) - {initialized ? `Completed in ${initDuration}ms` : `Elapsed: ${debugInfo.elapsedTime || 0}ms`}</div>
        
        {initError && (
          <div className={debugStyles.errorText}>
            {initError}
            {debugInfo.lastError && debugInfo.lastError !== initError && (
              <div className="mt-2">
                Additional error: {debugInfo.lastError}
              </div>
            )}
          </div>
        )}
        
        <div className={debugStyles.systemStatus}>
          <div className="text-sm font-bold mb-2">System Status:</div>
          {/* FIX: Use client-side only state for system statuses */}
          {Object.entries(systemStatuses).map(([key, value]) => (
            <div key={key} className={debugStyles.systemItem}>
              <span>{key}:</span>
              <span className={value ? 'text-green-400' : 'text-red-400'}>
                {value ? '✓ Ready' : '× Pending'}
              </span>
            </div>
          ))}
        </div>
        
        <div className={debugStyles.buttonContainer}>
          <button 
            className={debugStyles.button}
            onClick={reinitialize}
          >
            Reinitialize
          </button>
          
          <button 
            className={debugStyles.button}
            onClick={() => window.location.reload()}
          >
            Reload Page
          </button>
          
          {initialized && (
            <button 
              className={debugStyles.button}
              onClick={() => {
                playIntroMusic();
                setShowDebugPanel(false);
              }}
            >
              Continue to Game
            </button>
          )}
        </div>
        
        {process.env.NODE_ENV !== 'production' && (
          <div className={debugStyles.debugInfo}>
            <div>Debug Information:</div>
            <pre>{JSON.stringify({
              initialized,
              initPhase,
              initProgress,
              attempts: debugInfo.initState?.attempts || 0,
              inProgress: debugInfo.initState?.inProgress || false,
              completed: debugInfo.initState?.completed || false,
            }, null, 2)}</pre>
          </div>
        )}
      </div>
    );
  };

  // Enhanced error fallback with detailed reporting
  const ErrorFallback = ({ error, resetErrorBoundary }: { 
    error: Error, 
    resetErrorBoundary: () => void 
  }) => (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white p-6">
      <div className="max-w-lg">
        <h1 className="text-2xl font-bold mb-4 text-red-500">Game Error</h1>
        <div className="bg-gray-800 p-4 rounded mb-4 font-mono text-sm overflow-auto max-h-64">
          <div className="font-bold mb-2">{error.message}</div>
          {error.stack && (
            <pre className="text-xs text-gray-400 whitespace-pre-wrap">
              {error.stack}
            </pre>
          )}
        </div>
        
        <div className="mb-4">
          <div className="font-bold text-sm mb-1">Initialization State:</div>
          <pre className="text-xs bg-gray-900 p-2 rounded">
            {JSON.stringify({
              initialized,
              phase: initPhase,
              progress: initProgress,
              error: initError,
              ...(typeof window !== 'undefined' ? (window as any).__INIT_STATE__ || {} : {})
            }, null, 2)}
          </pre>
        </div>
        
        <div className="flex space-x-3">
          <button 
            onClick={() => {
              // First reinitialize core systems
              reinitialize();
              console.log('Core systems reinitialized after error');
              // Then reset the error boundary
              resetErrorBoundary();
            }}
            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded"
          >
            Reinitialize Systems
          </button>
          
          <button 
            onClick={() => window.location.reload()}
            className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded"
          >
            Reload Page
          </button>
          
          {process.env.NODE_ENV !== 'production' && (
            <button 
              onClick={() => console.log('Debug data:', {
                initState: (window as any).__INIT_STATE__,
                error,
                init: { initialized, initPhase, initProgress, initError }
              })}
              className="bg-purple-700 hover:bg-purple-600 text-white px-4 py-2 rounded"
            >
              Log Debug Data
            </button>
          )}
        </div>
      </div>
    </div>
  );

  // Debug tool for knowledge discovery testing
  const { nodes } = useKnowledgeStore(); 
  const testDiscovery = () => {
    // Find an undiscovered concept
    const undiscoveredConcept = nodes.find(node => !node.discovered);
    if (undiscoveredConcept) {
      console.log(`🧪 [DEBUG] Testing concept discovery for: ${undiscoveredConcept.id}`);
      safeDispatch(
        GameEventType.KNOWLEDGE_DISCOVERED,
        { 
          conceptId: undiscoveredConcept.id,
          source: 'page-debug-button'
        },
        'pageDebugButton'
      );
    } else {
      console.log('🧪 [DEBUG] No undiscovered concepts to test with');
    }
  };

  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onReset={() => {
        // Core systems will be reinitialized in the ErrorFallback component
        console.log('Error boundary reset');
      }}
    >
      {/* Initialize Chamber Pattern debug utilities */}
      {process.env.NODE_ENV !== 'production' && <ChamberDebugInitializer />}
      
      {/* Initialization Status Display */}
      {renderInitializationStatus()}
      
      <div className="min-h-screen bg-black text-white">
        {/* Only render game container when initialized */}
        {initialized ? (
          <>
            <GameContainer />
          </>
        ) : null}
      </div>
      
      {/* Debug toggle button for initialization panel only */}
      {process.env.NODE_ENV !== 'production' && !initialized && (
        <button 
          className="fixed bottom-4 right-4 bg-blue-600 text-white px-3 py-2 rounded-full shadow-lg z-50 text-xs pixel-button"
          onClick={() => setShowDebugPanel(prev => !prev)}
        >
          {showDebugPanel ? 'Hide Init Debug' : 'Show Init Debug'}
        </button>
      )}
    </ErrorBoundary>
  );
}