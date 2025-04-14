// app/components/map/SimplifiedKapoorMap.tsx
'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useGameStore } from '@/app/store/gameStore';
import { useJournalStore } from '@/app/store/journalStore';
import { useKnowledgeStore } from '@/app/store/knowledgeStore';
import { MapNode, JournalEntry, NodeType } from '@/app/types/game';
import { safeDispatch } from '@/app/core/events/CentralEventBus';
import { GameEventType } from '@/app/core/events/EventTypes';
import { usePrimitiveStoreValue, useStableCallback } from '@/app/core/utils/storeHooks';
import Image from 'next/image';

// Add this at the top level of the file, before the component
declare global {
  interface Window {
    __GAME_STATE_MACHINE_DEBUG__?: {
      getCurrentState: () => any;
    };
  }
}

/**
 * Enhanced SimplifiedKapoorMap Component
 * 
 * Improvements:
 * 1. Removed standalone debug UI (now in UnifiedDebugPanel)
 * 2. Enhanced visuals with subtle animations
 * 3. Improved node interaction feedback
 * 4. Better visual distinction between node types
 * 5. Added ambient elements for visual interest
 */
const SimplifiedKapoorMap: React.FC = () => {
  // ===== DOM REFS =====
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const isMountedRef = useRef(true);
  const animationTimeoutRefs = useRef<NodeJS.Timeout[]>([]);
  
  // ===== DEBUG STATE =====
  const [debugVisible, setDebugVisible] = useState(false);
  const [clickPosition, setClickPosition] = useState<{x: number, y: number} | null>(null);
  const [clickTarget, setClickTarget] = useState<string>('None');
  const [clickCount, setClickCount] = useState(0);
  const [svgBounds, setSvgBounds] = useState<DOMRect | null>(null);
  const [debugState, setDebugState] = useState<any>(null);
  const [debugInfo, setDebugInfo] = useState({
    lastClick: null as string | null,
    lastError: null as string | null,
    storeAvailable: false,
    nodeSelectionState: 'idle'
  });
  
  // ===== PRIMITIVE STORE VALUES =====
  const currentSystem = usePrimitiveStoreValue(
    useGameStore, 
    (state: any) => state.currentSystem,
    'default'
  );
  
  const currentNodeId = usePrimitiveStoreValue(
    useGameStore, 
    (state: any) => state.currentNodeId,
    null
  );
  
  // Direct store reference
  const setCurrentNode = useGameStore(state => state.setCurrentNode);
  const startNodeChallenge = useGameStore(state => state.startNodeChallenge);
  
  // ===== LOCAL COMPONENT STATE =====
  // Enhanced static map nodes data with more visual metadata
  const [nodes, setNodes] = useState<MapNode[]>([
    // Start node
    { id: 'node-1', x: 500, y: 220, label: 'Start', type: 'calibration', connections: ['node-2-1', 'node-2-2', 'node-2-3'], data: {} },
    
    // Level 2 nodes (3 branches from start)
    { id: 'node-2-1', x: 300, y: 320, label: 'Branch A', type: 'qa', connections: ['node-3-1', 'node-3-2'], data: {} },
    { id: 'node-2-2', x: 500, y: 320, label: 'Branch B', type: 'educational', connections: ['node-3-3', 'node-3-4'], data: {} },
    { id: 'node-2-3', x: 700, y: 320, label: 'Branch C', type: 'qa', connections: ['node-3-5', 'node-3-6'], data: {} },
    
    // Level 3 nodes
    { id: 'node-3-1', x: 200, y: 420, label: 'A1', type: 'educational', connections: ['node-4-1'], data: {} },
    { id: 'node-3-2', x: 300, y: 420, label: 'A2', type: 'clinical', connections: ['node-4-2'], data: {} },
    { id: 'node-3-3', x: 400, y: 420, label: 'B1', type: 'qa', connections: ['node-4-3'], data: {} },
    { id: 'node-3-4', x: 500, y: 420, label: 'B2', type: 'calibration', connections: ['node-4-4'], data: {} },
    { id: 'node-3-5', x: 600, y: 420, label: 'C1', type: 'educational', connections: ['node-4-5'], data: {} },
    { id: 'node-3-6', x: 700, y: 420, label: 'C2', type: 'clinical', connections: ['node-4-6'], data: {} },
    
    // Level 4 nodes
    { id: 'node-4-1', x: 150, y: 520, label: 'A1-1', type: 'qa', connections: ['node-5-1'], data: {} },
    { id: 'node-4-2', x: 250, y: 520, label: 'A2-1', type: 'clinical', connections: ['node-5-1'], data: {} },
    { id: 'node-4-3', x: 350, y: 520, label: 'B1-1', type: 'educational', connections: ['node-5-2'], data: {} },
    { id: 'node-4-4', x: 450, y: 520, label: 'B2-1', type: 'calibration', connections: ['node-5-2'], data: {} },
    { id: 'node-4-5', x: 550, y: 520, label: 'C1-1', type: 'qa', connections: ['node-5-3'], data: {} },
    { id: 'node-4-6', x: 650, y: 520, label: 'C2-1', type: 'clinical', connections: ['node-5-3'], data: {} },
    
    // Level 5 nodes (converging paths)
    { id: 'node-5-1', x: 200, y: 620, label: 'Path A', type: 'educational', connections: ['node-6-1'], data: {} },
    { id: 'node-5-2', x: 400, y: 620, label: 'Path B', type: 'qa', connections: ['node-6-2'], data: {} },
    { id: 'node-5-3', x: 600, y: 620, label: 'Path C', type: 'calibration', connections: ['node-6-3'], data: {} },
    
    // Level 6 nodes (pre-boss)
    { id: 'node-6-1', x: 300, y: 720, label: 'Pre-Boss A', type: 'clinical', connections: ['node-boss'], data: {} },
    { id: 'node-6-2', x: 500, y: 720, label: 'Pre-Boss B', type: 'educational', connections: ['node-boss'], data: {} },
    { id: 'node-6-3', x: 700, y: 720, label: 'Pre-Boss C', type: 'qa', connections: ['node-boss'], data: {} },
    
    // Boss node
    { id: 'node-boss', x: 500, y: 820, label: 'BOSS', type: 'clinical', connections: [], data: {} },
  ]);
  
  const [completedNodes, setCompletedNodes] = useState<string[]>([]);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [stageSize, setStageSize] = useState({ width: 800, height: 1000 });
  const [isAnimating, setIsAnimating] = useState(false);
  const [clickedNodeId, setClickedNodeId] = useState<string | null>(null);
  
  // New visual enhancement states
  const [showParticles, setShowParticles] = useState(false);
  const [particleAnimationActive, setParticleAnimationActive] = useState(false);
  
  // Node type to image mapping
  const nodeImages = {
    calibration: '/icons/calibration.png',
    qa: '/icons/qa.png',
    clinical: '/icons/clinical.png',
    educational: '/icons/educational.png',
    default: '/icons/node-default.png'
  };

  const getNodeImage = (nodeType: string): string => {
    return nodeImages[nodeType as keyof typeof nodeImages] || nodeImages.default;
  };
  
  // ===== LIFECYCLE EFFECTS =====
  // Handle component mount/unmount with debug logging
  useEffect(() => {
    console.log('[MAP] Component mounted');
    
    // Check if stores are accessible
    try {
      const gameStore = useGameStore.getState();
      const journalStore = useJournalStore.getState();
      const knowledgeStore = useKnowledgeStore.getState();
      
      setDebugInfo(prev => ({
        ...prev,
        storeAvailable: true
      }));
    } catch (error) {
      console.error('[MAP] Store access error:', error);
      setDebugInfo(prev => ({
        ...prev,
        storeAvailable: false,
        lastError: `Store access error: ${error instanceof Error ? error.message : 'Unknown error'}`
      }));
    }
    
    isMountedRef.current = true;
    
    // Trigger ambient particle animation occasionally
    const intervalId = setInterval(() => {
      if (Math.random() > 0.7) {
        triggerParticleAnimation();
      }
    }, 5000);
    
    // Start with particles to create visual interest
    setTimeout(() => triggerParticleAnimation(), 1000);
    
    return () => {
      console.log('[MAP] Component unmounted');
      isMountedRef.current = false;
      animationTimeoutRefs.current.forEach(clearTimeout);
      animationTimeoutRefs.current = [];
      clearInterval(intervalId);
    };
  }, []);
  
  // Calculate and store SVG bounds for click debugging
  useEffect(() => {
    const updateSvgBounds = () => {
      if (svgRef.current) {
        const bounds = svgRef.current.getBoundingClientRect();
        setSvgBounds(bounds);
      }
    };
    
    updateSvgBounds();
    window.addEventListener('resize', updateSvgBounds);
    
    return () => window.removeEventListener('resize', updateSvgBounds);
  }, []);
  
  // Fetch completed nodes on mount
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.__GAME_STATE_MACHINE_DEBUG__?.getCurrentState) {
        const gameStateMachine = window.__GAME_STATE_MACHINE_DEBUG__.getCurrentState();
        if (gameStateMachine && gameStateMachine.completedNodeIds) {
          setCompletedNodes(gameStateMachine.completedNodeIds);
        }
      }
    } catch (error) {
      console.warn('[MAP] Error getting completed nodes:', error);
    }
  }, []);
  
  // Update the stage size effect
  useEffect(() => {
    const handleResize = () => {
      if (!isMountedRef.current || !containerRef.current) return;
      
      const containerWidth = containerRef.current.clientWidth || window.innerWidth;
      const containerHeight = containerRef.current.clientHeight || window.innerHeight;
      
      // Make sure we have enough space for the nodes and padding
      setStageSize({
        width: containerWidth,
        height: containerHeight
      });
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Track changes to currentNodeId from the store
  useEffect(() => {
    console.log(`[MAP] Current node ID changed to: ${currentNodeId}`);
    
    if (currentNodeId) {
      setDebugInfo(prev => ({
        ...prev,
        nodeSelectionState: 'success'
      }));
      
      // Add special visual effects when node is selected
      triggerParticleAnimation();
    }
  }, [currentNodeId]);
  
  // Update debug state handling
  useEffect(() => {
    const handleDebugToggle = () => {
      const debug = window.__GAME_STATE_MACHINE_DEBUG__;
      setDebugVisible(!!debug);
      if (debug?.getCurrentState) {
        setDebugState(debug.getCurrentState());
      }
    };

    // Initial state
    handleDebugToggle();

    // Listen for debug state changes
    window.addEventListener('debug-toggle', handleDebugToggle);
    return () => window.removeEventListener('debug-toggle', handleDebugToggle);
  }, []);
  
  // ===== VISUAL ENHANCEMENT FUNCTIONS =====
  
  // Trigger ambient particle animation
  const triggerParticleAnimation = () => {
    if (particleAnimationActive) return;
    
    setShowParticles(true);
    setParticleAnimationActive(true);
    
    const timeout = setTimeout(() => {
      if (isMountedRef.current) {
        setShowParticles(false);
        setParticleAnimationActive(false);
      }
    }, 3000);
    
    animationTimeoutRefs.current.push(timeout);
  };
  
  // Trigger selection animation for visual feedback
  const triggerSelectionAnimation = useCallback(() => {
    setIsAnimating(true);
    
    // Reset animation after delay
    const timeout = setTimeout(() => {
      if (isMountedRef.current) {
        setIsAnimating(false);
        setClickedNodeId(null);
      }
    }, 600);
    
    animationTimeoutRefs.current.push(timeout);
  }, []);
  
  // ===== DEBUG HANDLERS =====
  // Container click handler with debugging
  const handleContainerClick = useCallback((event: React.MouseEvent) => {
    // Record click position for debugging (still keeping this for the UnifiedDebugPanel)
    setClickCount(prev => prev + 1);
    
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      setClickPosition({x, y});
      
      if (event.target instanceof Element) {
        setClickTarget(`${event.target.tagName}${event.target.id ? '#'+event.target.id : ''}${
          event.target.classList.length > 0 ? '.'+Array.from(event.target.classList).join('.') : ''
        }`);
      } else {
        setClickTarget('Unknown');
      }
    }
  }, []);
  
  // ===== NODE CLICK HANDLING =====
  // Node click handler
  const handleNodeClick = useCallback((nodeId: string) => {
    // Only proceed if the component is still mounted
    if (!isMountedRef.current) return;
    
    // Track clicks for debugging
    setClickedNodeId(nodeId);
    setDebugInfo(prev => ({
      ...prev,
      lastClick: nodeId,
      nodeSelectionState: 'pending'
    }));
    
    try {
      // Validate node data is available
      const nodeData = nodes.find(n => n.id === nodeId);
      if (!nodeData) {
        if (isMountedRef.current) {
          setDebugInfo(prev => ({
            ...prev,
            lastError: `Invalid node ID: ${nodeId}`,
            nodeSelectionState: 'error'
          }));
        }
        return;
      }
      
      // Set the node in the store
      const gameStore = useGameStore.getState();
      if (isMountedRef.current) {
        setDebugInfo(prev => ({ 
          ...prev, 
          storeAvailable: !!gameStore 
        }));
      }
      
      if (gameStore && gameStore.setCurrentNode) {
        gameStore.setCurrentNode(nodeId);
        // Dispatch centralized event for selection
        safeDispatch(GameEventType.UI_NODE_SELECTED, { nodeId, source: 'map' });
        
        // Trigger visual feedback
        triggerSelectionAnimation();
      } else if (isMountedRef.current) {
        setDebugInfo(prev => ({
          ...prev,
          lastError: 'Game store not available',
          nodeSelectionState: 'error'
        }));
      }
    } catch (error) {
      console.error('Error in node click:', error);
      if (isMountedRef.current) {
        setDebugInfo(prev => ({
          ...prev,
          lastError: error instanceof Error ? error.message : 'Unknown error',
          nodeSelectionState: 'error'
        }));
      }
    }
  }, [nodes, triggerSelectionAnimation]);
  
  // ===== DEBUG FORCE NODE SELECTION =====
  const forceNodeSelection = useCallback((nodeId: string) => {
    try {
      const gameStore = useGameStore.getState();
      
      if (nodeId === 'node-1' && gameStore?.startNodeChallenge) {
        gameStore.startNodeChallenge(nodeId, 'kapoor', NodeType.EDUCATIONAL);
      } else if (gameStore?.setCurrentNode) {
        gameStore.setCurrentNode(nodeId);
      } else {
        console.error('[MAP] No store methods available for forcing node selection');
      }
    } catch (error) {
      console.error('[MAP] Force node selection error:', error);
    }
  }, []);
  
  // ===== MAP ACTION BUTTON =====
  const handleMapAction = useCallback(() => {
    // Refresh completed nodes list
    try {
      if (typeof window !== 'undefined' && window.__GAME_STATE_MACHINE_DEBUG__?.getCurrentState) {
        const gameStateMachine = window.__GAME_STATE_MACHINE_DEBUG__.getCurrentState();
        if (gameStateMachine && gameStateMachine.completedNodeIds) {
          setCompletedNodes(gameStateMachine.completedNodeIds);
        }
      }
    } catch (error) {
      console.warn('[MAP] Error refreshing completed nodes:', error);
    }
    
    // Force refresh game store reference
    try {
      const gameStore = useGameStore.getState();
      const journalStore = useJournalStore.getState();
      const knowledgeStore = useKnowledgeStore.getState();
      
      setDebugInfo(prev => ({
        ...prev,
        storeAvailable: !!(gameStore && journalStore && knowledgeStore),
        nodeSelectionState: 'idle',
        lastError: null
      }));
      
      // Trigger a visual effect to show refresh
      triggerParticleAnimation();
      
    } catch (error) {
      console.error('[MAP] Store refresh error:', error);
    }
  }, []);
  
  // ===== UTILITY FUNCTIONS =====
  // Find node coordinates for drawing lines
  const getNodeCoords = useCallback((nodeId: string): { x: number; y: number } | null => {
    const node = nodes.find(n => n.id === nodeId);
    return node ? { x: node.x, y: node.y } : null;
  }, [nodes]);
  
  // ===== RENDER HELPERS =====
  // Ambient particles renderer - adds visual interest to the scene
  const renderAmbientParticles = useMemo(() => {
    if (!showParticles) return null;
    
    // Generate random particles for visual effect
    const particles = Array.from({ length: 15 }, (_, i) => {
      const x = Math.random() * stageSize.width;
      const y = Math.random() * stageSize.height;
      const size = Math.random() * 3 + 1;
      const duration = Math.random() * 2 + 1;
      const delay = Math.random() * 0.5;
      
      return (
        <circle
          key={`particle-${i}`}
          cx={x}
          cy={y}
          r={size}
          fill="rgba(255, 255, 255, 0.4)"
          className="animate-pulse"
          style={{ 
            animationDuration: `${duration}s`,
            animationDelay: `${delay}s`,
            opacity: Math.random() * 0.5 + 0.2
          }}
        />
      );
    });
    
    return particles;
  }, [showParticles, stageSize]);
  
  // Connection lines renderer with enhanced styling
  const renderConnectionLines = useCallback(() => {
    return nodes.flatMap(node =>
      node.connections.map((targetId: string) => {
        const startCoords = getNodeCoords(node.id);
        const endCoords = getNodeCoords(targetId);
        
        if (!startCoords || !endCoords) return null;
        
        // Enhanced connection styling
        const isActivePath = currentNodeId === node.id || currentNodeId === targetId;
        const isHovered = hoveredNodeId === node.id || hoveredNodeId === targetId;
        
        return (
          <g key={`${node.id}-${targetId}`}>
            {/* Base line */}
            <line
              x1={startCoords.x}
              y1={startCoords.y}
              x2={endCoords.x}
              y2={endCoords.y}
              stroke={isActivePath ? "rgba(120, 160, 255, 0.8)" : "rgba(100, 100, 255, 0.5)"}
              strokeWidth={isActivePath ? 4 : 3}
              strokeDasharray={isHovered ? "5,5" : "none"}
              className={isActivePath ? "animate-pulse-path" : ""}
              pointerEvents="none"
            />
            
            {/* Glow effect for active connections */}
            {isActivePath && (
              <line
                x1={startCoords.x}
                y1={startCoords.y}
                x2={endCoords.x}
                y2={endCoords.y}
                stroke="rgba(120, 160, 255, 0.3)"
                strokeWidth={8}
                filter="blur(4px)"
                pointerEvents="none"
              />
            )}
          </g>
        );
      })
    );
  }, [nodes, getNodeCoords, currentNodeId, hoveredNodeId]);
  
  // Node renderer with enhanced visuals
  const renderNodes = useCallback(() => {
    return nodes.map(node => {
      const isCurrentNode = node.id === currentNodeId;
      const isHovered = node.id === hoveredNodeId;
      const isClicked = node.id === clickedNodeId;
      const isCompleted = completedNodes.includes(node.id);
      const size = 45; // 300% larger than original

      return (
        <g 
          key={node.id}
          onClick={() => handleNodeClick(node.id)}
          onMouseEnter={() => setHoveredNodeId(node.id)}
          onMouseLeave={() => setHoveredNodeId(null)}
          style={{ cursor: 'pointer' }}
          className={`node-group ${isCurrentNode ? 'current-node' : ''} ${isHovered ? 'hovered-node' : ''}`}
        >
          {/* Glow effect for active/hovered nodes */}
          {(isCurrentNode || isHovered) && (
            <circle
              cx={node.x}
              cy={node.y}
              r={size + 5}
              fill="none"
              stroke={isCurrentNode ? "rgba(120, 160, 255, 0.5)" : "rgba(255, 255, 255, 0.3)"}
              strokeWidth={2}
              filter="blur(4px)"
            />
          )}

          {/* Node image */}
          <image
            href={getNodeImage(node.type)}
            x={node.x - size}
            y={node.y - size}
            width={size * 2}
            height={size * 2}
            className={isCurrentNode ? "animate-pulse-slow" : ""}
            style={{
              imageRendering: 'pixelated',
              shapeRendering: 'crispEdges'
            }}
          />

          {/* Node label */}
          <text
            x={node.x + size + 10}
            y={node.y}
            fill="white"
            fontSize={14}
            className="pixel-text"
            style={{ 
              filter: isCurrentNode ? "drop-shadow(0 0 2px rgba(255,255,255,0.5))" : "none",
              pointerEvents: "none"
            }}
          >
            {node.label}
          </text>
        </g>
      );
    });
  }, [nodes, currentNodeId, hoveredNodeId, clickedNodeId, completedNodes, handleNodeClick]);
  
  // ===== MAIN RENDER =====
  return (
    <div 
      ref={containerRef}
      className="w-full h-full flex items-center justify-center bg-gray-900"
      data-testid="kapoor-map-container"
      onClick={handleContainerClick}
    >
      {/* Enhanced background with parallax stars - creates depth and interest */}
      <div className="absolute inset-0 starfield-bg animate-stars" />
      
      {/* Background gradient overlay with enhanced colors */}
      <div className="absolute inset-0 bg-gradient-radial from-blue-900/10 via-purple-900/10 to-blue-900/30" />
      
      {/* Ambient noise overlay for visual texture */}
      <div className="absolute inset-0 pixel-noise opacity-10" />
      
      {/* Main SVG Map */}
      <svg 
        ref={svgRef}
        width="100%"
        height="100%"
        viewBox="0 0 1000 900"
        preserveAspectRatio="xMidYMid meet"
        className={`z-10 ${isAnimating ? 'animate-map-click' : ''}`}
        data-testid="kapoor-map-svg"
      >
        {/* Grid pattern definition */}
        <defs>
          <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
            <path d="M 50 0 L 0 0 0 50" fill="none" stroke="rgba(100, 120, 255, 0.1)" strokeWidth="0.5"/>
          </pattern>
          
          {/* Glow filter for nodes */}
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2.5" result="blur"/>
            <feMerge>
              <feMergeNode in="blur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        {/* Grid background */}
        <rect width="100%" height="100%" fill="url(#grid)" pointerEvents="none" />
        
        {/* Ambient particles for visual interest */}
        {renderAmbientParticles}
        
        {/* Enhanced connection lines */}
        {renderConnectionLines()}
        
        {/* Visually enhanced nodes */}
        {renderNodes()}
      </svg>
      
      {/* Action button with enhanced styling */}
      <div className="fixed bottom-4 right-4 z-10">
        <button
          className="px-4 py-2 bg-blue-800/90 hover:bg-blue-700 text-white rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-lg backdrop-blur-sm transition-all duration-200 enhanced-button"
          onClick={handleMapAction}
        >
          Refresh Map Data
        </button>
      </div>
      
      {/* Add global styles for animations and visual effects */}
      <style jsx global>{`
        /* Keyframes for pulse animation */
        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.3); opacity: 0.7; }
          100% { transform: scale(1); opacity: 1; }
        }
        
        /* Keyframes for pulse path animation */
        @keyframes pulse-path {
          0%, 100% { opacity: 0.7; }
          50% { opacity: 1; }
        }
        
        /* Keyframes for subtle pulse animation */
        @keyframes pulse-slow {
          0%, 100% { transform: scale(1); opacity: 0.9; }
          50% { transform: scale(1.1); opacity: 1; }
        }
        
        /* Animation classes */
        .pulse-animation {
          animation: pulse 0.6s ease-in-out;
        }
        
        .animate-pulse-path {
          animation: pulse-path 2s infinite ease-in-out;
        }
        
        .animate-pulse-path-subtle {
          animation: pulse-path 4s infinite ease-in-out;
        }
        
        .animate-pulse-slow {
          animation: pulse-slow 3s infinite ease-in-out;
        }
        
        .animate-map-click {
          animation: map-click 0.3s ease-in-out;
        }
        
        @keyframes map-click {
          0% { transform: scale(1); }
          50% { transform: scale(0.98); }
          100% { transform: scale(1); }
        }
        
        /* Improved cursor styles */
        .node-circle {
          cursor: pointer;
        }
        
        .node-group {
          cursor: pointer;
        }
        
        /* Enhanced button effect */
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
          transition: all 0.8s ease;
          z-index: 1;
          transform: skewX(-25deg);
        }
        
        .enhanced-button:hover::after {
          left: 100%;
        }
        
        /* Starfield background */
        .starfield-bg {
          background-image: radial-gradient(
            circle at center,
            rgba(255, 255, 255, 0.1) 1px,
            transparent 1px
          );
          background-size: 25px 25px;
        }
        
        /* Pixel noise effect */
        .pixel-noise {
          background-image: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAACXBIWXMAAAsTAAALEwEAmpwYAAADi0lEQVR4nO2ZW2hcVRSGv3WdJgaCaGtFCtJe4oNSLwWtNVPrQy/2SUUFvfhSgjVtKRF8UBIQpeAlPimK1hegT1pTJdCKMVIhVE2jiEgRRIMoFYtWG6KmXpJMlsw0M1mz59hMmMuZZM6ZSOYPCzKXvda/1z5777XXiXCDQXrDh/3BXgE2As0WNZeBS8DCQOfgKFPEpBzpD75qYHMNbvYXtD59cOgkJcJvI/ZsNLLLom5XfvnmJ/q3kCJs2IiIyHwDO4HVFnUvqsomFV2nqutVdLuBH4GfRdjiT3TtcWlTbRsxIm0G3gZWTzVHVS/PmrH+LxF5GdinyiIDNBT0PBvoGhxxYVdtGxGpNbAXaJnqVaH/vWwuP+OTJzz41KXeRkp9JNQevBtYUjI8IsJr6RXpNxu/7DtfmxVVQF0jBvbXlU1m40cGJPVAOvXJJ8K9C0N7Oj91aWfFHjEibQb6gcbikRHg3cbujoOFjXn3zr7Hc/nZr9YflXOVGv2/9YjBvshbAOkLbQ8Xj6uqL3Np7Lv0/JZE8c8n9C6ufhVpqFiPiLSp6rdAT9FQRoRNmf3DHUxC0KjXwCPFQ4ocrM3KKqMcj3iB0jrBV0o2EeyxuL0U3lvCkw40lUelHolJPDKd5xMi34nIMyZwxyoKDhbTcqvF4Vkgbh7KlzJDFdtbBqo93Tc2ySRFMJcMdNRmZZVR9WHIiMSFCT0CkJjTGGw00DMTXEeXVm5W5kwReQ/YP1/GVUQmKfIAcNSB3KpR0Teegf0O5FaNetrIiScGtwCP2dblAtWsiV4Dj1vW5AS29YinRE89C3jTYVE5QvGm5rHs99vC3yTwPgMR8QzhKtlU5Dv92jRpvjswrTfnG5jtddGkYkG7gf0Vur0A3G0p+98c5d6xGG84rmZKYVOP+P4adCjYlehNrL7YCWBgM7Ciagsds9rD7uHSPgtHZ2bqkSQbRn8H3gRmWdQ9AYwCl1VkGPgs0DX4m1Mr67F4frUQkYYZK55g4O4ZKnXoEeX5tdlOq+E5RLUe8crlpNIARETkhWnmVOSRLRHO4BHReaoyPtvIOtqZpKcMtAEpYA4wF1iqwuMK7zYuePDFdw9MlqhrzU1SZEGkH8B6h+hb0TvKE+5H+rZ7+eSvwBJVfSiQTJ6zwBaIjSM1RI39E3yDmjc3/bxUAAAAAElFTkSuQmCC");
          background-size: 4px 4px;
          image-rendering: pixelated;
        }
      `}</style>
    </div>
  );
};

export default SimplifiedKapoorMap;