// app/components/debug/PerformanceDashboard.tsx
'use client';
/**
 * Optimized Performance Dashboard Component
 * 
 * Improvements:
 * 1. More streamlined and collapsed by default
 * 2. DOM-based animations instead of state-driven for better performance
 * 3. Better visual integration with the game
 * 4. Enhanced metrics display with contextual coloring
 */
import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { usePrimitiveStoreValue, useStableCallback } from '@/app/core/utils/storeHooks';

// Optimized throttling settings
const THROTTLE_MS = 600; // Only update every 600ms
const MAX_ITEMS_TO_RENDER = 3; // Limit number of issues to render
const MEASUREMENT_INTERVAL_MS = 1000; // Take measurements every second

export default function PerformanceDashboard() {
  // ======== REFS (Always first for hook order stability) ========
  const fpsTimestampsRef = useRef<number[]>([]);
  const suspiciousComponentsRef = useRef<any[]>([]);
  const storeIssuesRef = useRef<any[]>([]);
  const memoryUsageRef = useRef<any>(null);
  const currentFpsRef = useRef<number>(0);
  const rafIdRef = useRef<number | null>(null);
  const intervalIdRef = useRef<NodeJS.Timeout | null>(null);
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isExpandedRef = useRef<boolean>(false);
  const activeTabRef = useRef<'renders'|'stores'|'fps'|'memory'>('fps');
  const mountedRef = useRef<boolean>(true);
  const renderCountRef = useRef<number>(0);
  const dashboardRef = useRef<HTMLDivElement>(null);
  
  // ======== STATE (Minimal, only for UI that needs rendering) ========
  const [displayState, setDisplayState] = useState({
    isExpanded: false,
    activeTab: 'fps' as 'renders'|'stores'|'fps'|'memory',
    fps: 0,
    memoryUsage: null as any,
    suspiciousComponents: [] as any[],
    storeIssues: [] as any[]
  });
  
  // ======== STABLE CALLBACKS ========
  // Toggle dashboard expanded state
  const toggleDashboard = useStableCallback(() => {
    // Use the ref to track the current state
    isExpandedRef.current = !isExpandedRef.current;
    
    // Update display state to trigger re-render
    setDisplayState(prev => ({
      ...prev,
      isExpanded: isExpandedRef.current
    }));
    
    // Start or stop measurements based on visibility
    if (isExpandedRef.current) {
      startMeasurements();
    } else {
      stopMeasurements();
    }
    
    // Add visual toggle effect using DOM if possible
    if (dashboardRef.current) {
      dashboardRef.current.style.transition = 'all 0.3s ease';
      dashboardRef.current.style.opacity = isExpandedRef.current ? '1' : '0.9';
    }
  }, []);
  
  // Change active tab
  const changeTab = useStableCallback((tab: 'renders'|'stores'|'fps'|'memory') => {
    // Update the ref
    activeTabRef.current = tab;
    
    // Update display state to trigger re-render
    setDisplayState(prev => ({
      ...prev,
      activeTab: tab
    }));
  }, []);
  
  // Reset all measurements
  const handleReset = useStableCallback(() => {
    // Reset FPS
    fpsTimestampsRef.current = [];
    currentFpsRef.current = 0;
    
    // Reset suspicious components
    suspiciousComponentsRef.current = [];
    
    // Reset store issues
    storeIssuesRef.current = [];
    
    // Reset global tracking if available
    try {
      // Reset Chamber Debug
      if (typeof window !== 'undefined' && window.__CHAMBER_DEBUG__?.resetStats) {
        window.__CHAMBER_DEBUG__.resetStats();
      }
      
      // Reset Store Analyzer
      if (typeof window !== 'undefined' && window.__STORE_ANALYZER__?.reset) {
        window.__STORE_ANALYZER__.reset();
      }
    } catch (e) {
      console.warn('Error resetting debug systems:', e);
    }
    
    // Update display state
    setDisplayState(prev => ({
      ...prev,
      fps: 0,
      suspiciousComponents: [],
      storeIssues: []
    }));
    
    // Add visual cue for reset
    if (dashboardRef.current) {
      dashboardRef.current.classList.add('pulse-reset');
      setTimeout(() => {
        if (dashboardRef.current && mountedRef.current) {
          dashboardRef.current.classList.remove('pulse-reset');
        }
      }, 300);
    }
  }, []);
  
  // ======== MEASUREMENT FUNCTIONS ========
  
  // FPS calculation - optimized with rate limiting
  const calculateFps = useCallback(() => {
    if (!mountedRef.current || !isExpandedRef.current) return;
    
    const now = performance.now();
    
    // Add current timestamp
    fpsTimestampsRef.current.push(now);
    
    // Only keep timestamps from the last second
    while (
      fpsTimestampsRef.current.length > 0 && 
      now - fpsTimestampsRef.current[0] > 1000
    ) {
      fpsTimestampsRef.current.shift();
    }
    
    // Update current FPS in ref only (no re-render)
    currentFpsRef.current = fpsTimestampsRef.current.length;
    
    // Continue measuring if still mounted and expanded
    if (mountedRef.current && isExpandedRef.current) {
      rafIdRef.current = requestAnimationFrame(calculateFps);
    }
  }, []);
  
  // Memory usage measurement
  const measureMemory = useCallback(async () => {
    if (!mountedRef.current || !isExpandedRef.current) return;
    
    try {
      // @ts-ignore - performance.memory is non-standard but available in Chrome
      if (performance.memory) {
        // Calculate values only, don't update state yet
        memoryUsageRef.current = {
          // @ts-ignore
          total: Math.round(performance.memory.totalJSHeapSize / (1024 * 1024)),
          // @ts-ignore
          used: Math.round(performance.memory.usedJSHeapSize / (1024 * 1024)),
          // @ts-ignore
          limit: Math.round(performance.memory.jsHeapSizeLimit / (1024 * 1024))
        };
      } else {
        memoryUsageRef.current = { unsupported: true };
      }
    } catch (e) {
      console.warn('Memory measurement error:', e);
      memoryUsageRef.current = { error: true };
    }
  }, []);
  
  // Check for suspicious components and store issues
  const checkPerformanceIssues = useCallback(() => {
    if (!mountedRef.current || !isExpandedRef.current) return;
    
    try {
      // Check for suspicious components - limit to most problematic
      if (typeof window !== 'undefined' && window.__CHAMBER_DEBUG__?.getSuspiciousComponents) {
        suspiciousComponentsRef.current = window.__CHAMBER_DEBUG__.getSuspiciousComponents()
          .slice(0, MAX_ITEMS_TO_RENDER);
      }
      
      // Check for store issues - limit to most problematic
      if (typeof window !== 'undefined' && window.__STORE_ANALYZER__?.getIssues) {
        storeIssuesRef.current = window.__STORE_ANALYZER__.getIssues()
          .slice(0, MAX_ITEMS_TO_RENDER);
      }
    } catch (e) {
      console.warn('Error checking performance issues:', e);
    }
  }, []);
  
  // ======== MEASUREMENT CONTROLLERS ========
  
  // Start all measurements
  const startMeasurements = useCallback(() => {
    if (!mountedRef.current) return;
    
    // Start FPS measurement
    if (!rafIdRef.current) {
      rafIdRef.current = requestAnimationFrame(calculateFps);
    }
    
    // Start memory and component checks
    if (!intervalIdRef.current) {
      intervalIdRef.current = setInterval(() => {
        measureMemory();
        checkPerformanceIssues();
      }, MEASUREMENT_INTERVAL_MS);
    }
    
    // Start throttled updates for state
    scheduleStateUpdate();
  }, [calculateFps, measureMemory, checkPerformanceIssues]);
  
  // Schedule a state update with throttling
  const scheduleStateUpdate = useCallback(() => {
    if (!mountedRef.current || !isExpandedRef.current) return;
    
    // Clear any existing timeout
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }
    
    // Schedule new update
    updateTimeoutRef.current = setTimeout(() => {
      if (!mountedRef.current || !isExpandedRef.current) return;
      
      // Update state from refs
      setDisplayState(prev => ({
        ...prev,
        fps: currentFpsRef.current,
        memoryUsage: memoryUsageRef.current,
        suspiciousComponents: suspiciousComponentsRef.current,
        storeIssues: storeIssuesRef.current
      }));
      
      // Schedule next update if still expanded
      if (isExpandedRef.current) {
        scheduleStateUpdate();
      }
    }, THROTTLE_MS);
  }, []);
  
  // Stop all measurements
  const stopMeasurements = useCallback(() => {
    // Stop FPS measurement
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
    
    // Stop interval
    if (intervalIdRef.current) {
      clearInterval(intervalIdRef.current);
      intervalIdRef.current = null;
    }
    
    // Stop update timeout
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
      updateTimeoutRef.current = null;
    }
  }, []);
  
  // ======== EFFECTS ========
  
  // Setup and cleanup
  useEffect(() => {
    // Mark as mounted
    mountedRef.current = true;
    renderCountRef.current++;
    
    // Start with the dashboard collapsed by default
    isExpandedRef.current = false;
    
    // Clean up everything on unmount
    return () => {
      mountedRef.current = false;
      stopMeasurements();
    };
  }, [startMeasurements, stopMeasurements]);
  
  // ======== MEMOIZED RENDER HELPERS ========
  
  // Memoize tab content to prevent unnecessary re-renders
  const renderTabContent = useMemo(() => {
    const { 
      activeTab, 
      fps, 
      memoryUsage, 
      suspiciousComponents, 
      storeIssues 
    } = displayState;
    
    switch (activeTab) {
      case 'renders':
        return (
          <div className="p-2">
            <h3 className="text-sm font-semibold mb-1">Component Issues</h3>
            {suspiciousComponents && suspiciousComponents.length > 0 ? (
              <div className="max-h-32 overflow-y-auto text-xs">
                {suspiciousComponents.map((comp, i) => (
                  <div key={i} className="mb-1 p-1 bg-red-900/30 rounded">
                    <div className="font-medium">{comp.componentName}</div>
                    <div className="text-xs opacity-80">
                      Renders: {comp.renderCount} ({comp.suspiciousRenders} suspicious)
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-green-400 py-1 text-center text-xs">
                No render issues found
              </div>
            )}
          </div>
        );
        
      case 'stores':
        return (
          <div className="p-2">
            <h3 className="text-sm font-semibold mb-1">Store Access Issues</h3>
            {storeIssues && storeIssues.length > 0 ? (
              <div className="max-h-32 overflow-y-auto text-xs">
                {storeIssues.map((issue, i) => (
                  <div key={i} className="mb-1 p-1 bg-orange-900/30 rounded">
                    <div className="font-medium">{issue.component}</div>
                    <div className="text-xs opacity-80">
                      {issue.store}: ~{issue.extractSize}b, {issue.subCount} subs
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-green-400 py-1 text-center text-xs">
                No store issues found
              </div>
            )}
          </div>
        );
        
      case 'fps':
        return (
          <div className="p-2">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-sm">FPS:</span>
              <span className={`px-2 py-0.5 rounded text-sm ${
                fps >= 55 ? 'bg-green-900/50 text-green-300' :
                fps >= 30 ? 'bg-yellow-900/50 text-yellow-300' :
                'bg-red-900/50 text-red-300'
              }`}>
                {fps || 0}
              </span>
            </div>
            <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
              <div 
                className={`h-full ${
                  fps >= 55 ? 'bg-green-500' :
                  fps >= 30 ? 'bg-yellow-500' :
                  'bg-red-500'
                }`}
                style={{ width: `${Math.min(100, ((fps || 0) / 60) * 100)}%` }}
              />
            </div>
          </div>
        );
        
      case 'memory':
        return (
          <div className="p-2">
            {memoryUsage ? (
              memoryUsage.unsupported ? (
                <div className="text-yellow-400 py-1 text-center text-xs">
                  Memory metrics unsupported
                </div>
              ) : memoryUsage.error ? (
                <div className="text-red-400 py-1 text-center text-xs">
                  Error measuring memory
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm">Heap:</span>
                    <span className={`px-2 py-0.5 rounded text-xs ${
                      memoryUsage.used < memoryUsage.limit * 0.7 ? 'bg-green-900/50 text-green-300' :
                      memoryUsage.used < memoryUsage.limit * 0.9 ? 'bg-yellow-900/50 text-yellow-300' :
                      'bg-red-900/50 text-red-300'
                    }`}>
                      {memoryUsage.used}MB / {memoryUsage.limit}MB
                    </span>
                  </div>
                  <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all ${
                        memoryUsage.used < memoryUsage.limit * 0.7 ? 'bg-green-500' :
                        memoryUsage.used < memoryUsage.limit * 0.9 ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`}
                      style={{ width: `${(memoryUsage.used / memoryUsage.limit) * 100}%` }}
                    />
                  </div>
                </>
              )
            ) : (
              <div className="py-2 text-center text-xs">
                Loading memory data...
              </div>
            )}
          </div>
        );
        
      default:
        return null;
    }
  }, [displayState]);
  
  // Only render in development
  if (process.env.NODE_ENV === 'production') {
    return null;
  }
  
  // Destructure display state for rendering
  const { isExpanded, activeTab } = displayState;
  
  return (
    <div className="fixed bottom-16 right-4 z-50 flex flex-col items-end">
      {/* Collapsed state - minimal button with FPS display */}
      {!isExpanded && (
        <button
          onClick={toggleDashboard}
          className={`flex items-center gap-1 bg-gray-900/70 backdrop-blur-sm hover:bg-gray-800 text-white px-2 py-1 text-xs rounded shadow-lg border border-gray-700 transition-all duration-200 enhanced-button`}
        >
          <div 
            className={`h-2 w-2 rounded-full ${
              displayState.fps >= 50 ? 'bg-green-500' :
              displayState.fps >= 30 ? 'bg-yellow-500' :
              'bg-red-500'
            }`}
          />
          <span>FPS: {displayState.fps || '--'}</span>
        </button>
      )}
      
      {/* Expanded Dashboard */}
      {isExpanded && (
        <div 
          ref={dashboardRef}
          className="bg-gray-900/80 backdrop-blur-sm border border-purple-900/50 rounded shadow-xl w-60 transition-all duration-200"
        >
          <div className="border-b border-purple-900/50 p-1.5 flex items-center justify-between">
            <h2 className="text-white text-xs font-semibold">Performance Dashboard</h2>
            <div className="flex items-center gap-1">
              <button
                onClick={handleReset}
                className="bg-blue-700/70 hover:bg-blue-600 text-white px-1.5 py-0.5 text-xs rounded"
              >
                Reset
              </button>
              <button
                onClick={toggleDashboard}
                className="bg-gray-700/70 hover:bg-gray-600 text-white px-1.5 py-0.5 text-xs rounded ml-1"
              >
                ×
              </button>
            </div>
          </div>
          
          {/* Navigation Tabs */}
          <div className="flex border-b border-purple-900/50">
            <button
              className={`px-2 py-1 text-xs ${activeTab === 'fps' ? 'bg-purple-900/70 text-white' : 'text-purple-300 hover:bg-purple-900/30'}`}
              onClick={() => changeTab('fps')}
            >
              FPS
            </button>
            <button
              className={`px-2 py-1 text-xs ${activeTab === 'memory' ? 'bg-purple-900/70 text-white' : 'text-purple-300 hover:bg-purple-900/30'}`}
              onClick={() => changeTab('memory')}
            >
              Memory
            </button>
            <button
              className={`px-2 py-1 text-xs ${activeTab === 'renders' ? 'bg-purple-900/70 text-white' : 'text-purple-300 hover:bg-purple-900/30'}`}
              onClick={() => changeTab('renders')}
            >
              Renders
            </button>
            <button
              className={`px-2 py-1 text-xs ${activeTab === 'stores' ? 'bg-purple-900/70 text-white' : 'text-purple-300 hover:bg-purple-900/30'}`}
              onClick={() => changeTab('stores')}
            >
              Stores
            </button>
          </div>
          
          {/* Tab Content */}
          <div className="max-h-48">
            {renderTabContent}
          </div>
        </div>
      )}
      
      {/* Add styles for animations and visual effects */}
      <style jsx global>{`
        @keyframes reset-pulse {
          0% { opacity: 0.7; transform: scale(0.97); }
          50% { opacity: 1; transform: scale(1.02); }
          100% { opacity: 1; transform: scale(1); }
        }
        
        .pulse-reset {
          animation: reset-pulse 0.3s ease-out;
        }
        
        .enhanced-button::after {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(
            to right,
            rgba(255,255,255,0) 0%,
            rgba(255,255,255,0.2) 50%,
            rgba(255,255,255,0) 100%
          );
          transform: skewX(-25deg);
          transition: all 0.5s ease-out;
        }
        
        .enhanced-button:hover::after {
          left: 100%;
        }
      `}</style>
    </div>
  );
}