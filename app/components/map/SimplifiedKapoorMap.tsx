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

/**
 * Enhanced SimplifiedKapoorMap Component
 * 
 * Improvements:
 * 1. Collapsible debug UI
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
  const [debugVisible, setDebugVisible] = useState<boolean>(false);
  const [clickPosition, setClickPosition] = useState<{x: number, y: number} | null>(null);
  const [clickTarget, setClickTarget] = useState<string>('None');
  const [clickCount, setClickCount] = useState(0);
  const [svgBounds, setSvgBounds] = useState<DOMRect | null>(null);
  
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
  const mapNodes = useMemo<MapNode[]>(() => [
    { 
      id: 'node-1', 
      x: 150, 
      y: 150, 
      label: 'Calibration Challenge', 
      type: 'educational', 
      connections: ['node-2'], 
      data: { 
        difficulty: 'beginner',
        imageUrl: '/assets/icons/calibration.png',
        description: 'Learn about basic calibration protocols'
      } 
    },
    { 
      id: 'node-2', 
      x: 350, 
      y: 200, 
      label: 'Dosimetry Principles', 
      type: 'system', 
      connections: ['node-3'], 
      data: { 
        difficulty: 'intermediate',
        imageUrl: '/assets/icons/dosimetry.png',
        description: 'Explore fundamental dosimetry concepts'
      } 
    },
    { 
      id: 'node-3', 
      x: 550, 
      y: 150, 
      label: 'Radiation Safety', 
      type: 'system', 
      connections: [], 
      data: { 
        difficulty: 'advanced',
        imageUrl: '/assets/icons/safety.png',
        description: 'Master radiation safety protocols'
      } 
    },
  ], []);
  
  const [completedNodes, setCompletedNodes] = useState<string[]>([]);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [stageSize, setStageSize] = useState({ width: 800, height: 600 });
  const [isAnimating, setIsAnimating] = useState(false);
  const [clickedNodeId, setClickedNodeId] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState({
    lastClick: null as string | null,
    eventsSent: 0,
    lastError: null as string | null,
    nodeSelectionState: 'idle',
    storeAvailable: false
  });
  
  // New visual enhancement states
  const [showParticles, setShowParticles] = useState(false);
  const [particleAnimationActive, setParticleAnimationActive] = useState(false);
  
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
  
  // Handle window resize for responsive SVG
  useEffect(() => {
    const handleResize = () => {
      if (!isMountedRef.current || !containerRef.current) return;
      
      const containerWidth = containerRef.current.clientWidth || window.innerWidth * 0.8;
      const containerHeight = containerRef.current.clientHeight || window.innerHeight * 0.6;
      
      setStageSize({
        width: Math.max(containerWidth, 400),
        height: Math.max(containerHeight, 300)
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
  
  // ===== DEBUG HANDLERS =====
  // Container click handler with debugging
  const handleContainerClick = useCallback((event: React.MouseEvent) => {
    // Record click position for debugging
    if (debugVisible) {
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
    }
  }, [debugVisible]);
  
  // ===== NODE CLICK HANDLING =====
  // Direct node click handler
  const handleNodeClick = useCallback((nodeId: string, event?: React.MouseEvent) => {
    // Stop propagation to prevent double handling
    event?.stopPropagation();
    
    // Set clicked node for visual feedback
    setClickedNodeId(nodeId);
    setIsAnimating(true);
    
    // Trigger particle animation for visual feedback
    triggerParticleAnimation();
    
    // Update debug state
    setDebugInfo(prev => ({
      ...prev,
      lastClick: nodeId,
      eventsSent: prev.eventsSent + 1,
      nodeSelectionState: 'processing',
      lastError: null
    }));
    
    // Find the clicked node
    const clickedNode = mapNodes.find(n => n.id === nodeId);
    if (!clickedNode) {
      console.error(`[MAP] Node not found: ${nodeId}`);
      setDebugInfo(prev => ({
        ...prev,
        lastError: `Node not found: ${nodeId}`,
        nodeSelectionState: 'error'
      }));
      return;
    }
    
    // Add journal entry
    try {
      const journalStore = useJournalStore.getState();
      if (journalStore && journalStore.addEntry) {
        const newEntry: Partial<JournalEntry> = {
          title: `Visited ${clickedNode.label || nodeId}`,
          content: `Successfully navigated to ${clickedNode.label || nodeId}.`,
          tags: ['map', 'navigation', nodeId],
          category: 'Log',
        };
        
        journalStore.addEntry(newEntry as any);
      }
    } catch (error) {
      console.error('[MAP] Failed to add journal entry:', error);
    }
    
    // DIRECT METHOD CALL
    try {
      // For node-1 (Kapoor's calibration)
      if (nodeId === 'node-1') {
        if (startNodeChallenge) {
          startNodeChallenge(nodeId, 'kapoor', NodeType.EDUCATIONAL);
        } else if (setCurrentNode) {
          setCurrentNode(nodeId);
        } else {
          // Last resort - try direct store access
          const gameStore = useGameStore.getState();
          if (gameStore?.startNodeChallenge) {
            gameStore.startNodeChallenge(nodeId, 'kapoor', NodeType.EDUCATIONAL);
          } else if (gameStore?.setCurrentNode) {
            gameStore.setCurrentNode(nodeId);
          } else {
            throw new Error('No method available to start challenge');
          }
        }
      } else {
        // For other nodes
        if (setCurrentNode) {
          setCurrentNode(nodeId);
        } else {
          // Try direct store access
          const gameStore = useGameStore.getState();
          if (gameStore?.setCurrentNode) {
            gameStore.setCurrentNode(nodeId);
          } else {
            throw new Error('setCurrentNode not available');
          }
        }
      }
    } catch (error) {
      console.error('[MAP] Failed to set node:', error);
      setDebugInfo(prev => ({
        ...prev, 
        lastError: `Node action failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        nodeSelectionState: 'error'
      }));
    }
    
    // Reset animation state after a delay
    const timeout = setTimeout(() => {
      if (isMountedRef.current) {
        setIsAnimating(false);
        setClickedNodeId(null);
      }
    }, 600);
    
    animationTimeoutRefs.current.push(timeout);
  }, [mapNodes, setCurrentNode, startNodeChallenge]);
  
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
    const node = mapNodes.find(n => n.id === nodeId);
    return node ? { x: node.x, y: node.y } : null;
  }, [mapNodes]);
  
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
    return mapNodes.flatMap(node =>
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
            
            {/* Direction indicator */}
            <polygon
              points="0,-4 8,0 0,4"
              fill={isActivePath ? "rgba(120, 160, 255, 0.8)" : "rgba(100, 100, 255, 0.6)"}
              className={isActivePath ? "animate-pulse-path" : ""}
              transform={`translate(${endCoords.x - 10}, ${endCoords.y}) rotate(${Math.atan2(endCoords.y - startCoords.y, endCoords.x - startCoords.x) * 180 / Math.PI})`}
              pointerEvents="none"
            />
          </g>
        );
      })
    );
  }, [mapNodes, getNodeCoords, currentNodeId, hoveredNodeId]);
  
  // Node renderer with enhanced visuals
  const renderNodes = useCallback(() => {
    return mapNodes.map(node => {
      const isCurrentNode = node.id === currentNodeId;
      const isHovered = node.id === hoveredNodeId;
      const isClicked = node.id === clickedNodeId;
      const isCompleted = completedNodes.includes(node.id);
      
      // Determine node colors based on state and type
      let fillColor, strokeColor;
      
      // Node coloring based on type
      switch (node.type) {
        case 'educational':
          fillColor = isCurrentNode ? "rgba(44, 146, 135, 0.9)" : "rgba(44, 146, 135, 0.8)";
          strokeColor = "#3db3a6";
          break;
        case 'system':
          fillColor = isCurrentNode ? "rgba(78, 131, 189, 0.9)" : "rgba(78, 131, 189, 0.8)";
          strokeColor = "#63a0db";
          break;
        default:
          fillColor = isCurrentNode ? "rgba(0, 150, 255, 0.9)" : "rgba(0, 150, 255, 0.8)";
          strokeColor = "rgba(255, 255, 255, 0.7)";
      }
      
      // Adjust for completion state
      if (isCompleted) {
        fillColor = isCurrentNode 
          ? "rgba(0, 200, 100, 0.9)"
          : "rgba(0, 200, 100, 0.8)";
        strokeColor = "rgba(100, 255, 150, 1)";
      }
      
      // Highlight when hovered/clicked
      const highlightStroke = isHovered || isClicked ? "rgba(255, 255, 255, 1)" : strokeColor;
      
      // Determine node animation class
      const animationClass = isCurrentNode 
        ? "animate-pulse-path" 
        : isCompleted
          ? "animate-pulse-path-subtle"
          : "";
      
      return (
        <g 
          key={node.id} 
          className="node-group" 
          onClick={(e) => handleNodeClick(node.id, e)}
          onMouseEnter={() => setHoveredNodeId(node.id)}
          onMouseLeave={() => setHoveredNodeId(null)}
          pointerEvents="all"
          style={{ cursor: 'pointer' }}
        >
          {/* Outer glow for active nodes */}
          {(isCurrentNode || isHovered) && (
            <circle
              cx={node.x}
              cy={node.y}
              r={28}
              fill="none"
              stroke={highlightStroke}
              strokeWidth={1.5}
              opacity={0.5}
              filter="blur(4px)"
              pointerEvents="none"
            />
          )}
          
          {/* Click area (larger than visible node) */}
          <circle
            cx={node.x}
            cy={node.y}
            r={40}
            fill="rgba(255, 255, 255, 0.01)" 
            pointerEvents="all"
            data-node-id={`${node.id}-target`}
          />
          
          {/* Node background glow */}
          <circle
            cx={node.x}
            cy={node.y}
            r={24}
            fill={fillColor}
            opacity={0.3}
            filter="blur(8px)"
            className={animationClass}
            pointerEvents="none"
          />
          
          {/* Main node circle */}
          <circle
            cx={node.x}
            cy={node.y}
            r={20}
            fill={fillColor}
            stroke={highlightStroke}
            strokeWidth={isHovered || isClicked ? 3 : 1.5}
            className={`node-circle ${isClicked ? 'pulse-animation' : ''} ${animationClass}`}
            filter={isCurrentNode ? "drop-shadow(0 0 6px rgba(255,255,255,0.3))" : "none"}
            data-node-id={node.id}
            pointerEvents="all"
          />
          
          {/* Node inner highlight */}
          <circle
            cx={node.x - 5}
            cy={node.y - 5}
            r={10}
            fill="rgba(255, 255, 255, 0.2)"
            pointerEvents="none"
          />
          
          {/* Center dot */}
          <circle
            cx={node.x}
            cy={node.y}
            r={3}
            fill="#fff"
            opacity={0.7}
            pointerEvents="none"
          />
          
          {/* Completion indicator */}
          {isCompleted && (
            <circle
              cx={node.x}
              cy={node.y}
              r={15}
              fill="none"
              stroke="rgba(100, 255, 100, 0.5)"
              strokeWidth={2}
              className="animate-pulse-slow"
              pointerEvents="none"
            />
          )}
          
          {/* Node label with improved styling */}
          <g pointerEvents="none">
            {/* Label background for better readability */}
            <rect
              x={node.x + 25 - 5}
              y={node.y - 8}
              width={node.label.length * 7 + 10} 
              height={20}
              rx={4}
              fill="rgba(0, 0, 0, 0.5)"
              opacity={0.8}
            />
            
            {/* Label text */}
            <text
              x={node.x + 25}
              y={node.y + 5}
              fontSize={14}
              fontWeight={isCurrentNode || isHovered ? "bold" : "normal"}
              fill="#fff"
              filter={isCurrentNode ? "drop-shadow(0 0 2px rgba(255,255,255,0.5))" : "none"}
              className="pixel-text"
            >
              {node.label}
            </text>
          </g>
          
          {/* Node ID (shown only in debug mode) */}
          {debugVisible && (
            <text
              x={node.x}
              y={node.y - 25}
              fontSize={10}
              fill="rgba(255, 255, 255, 0.7)"
              className="debug-id"
              pointerEvents="none"
              textAnchor="middle"
            >
              ID: {node.id}
            </text>
          )}
        </g>
      );
    });
  }, [mapNodes, currentNodeId, hoveredNodeId, clickedNodeId, completedNodes, handleNodeClick, debugVisible]);
  
  // ===== MAIN RENDER =====
  return (
    <div 
      ref={containerRef}
      className={`w-full h-full overflow-hidden relative bg-gray-900 flex items-center justify-center ${isAnimating ? 'animate-map-click' : ''}`}
      data-testid="kapoor-map-container"
      onClick={handleContainerClick}
    >
      {/* Enhanced background with parallax stars - creates depth and interest */}
      <div className="absolute inset-0 starfield-bg animate-stars" />
      
      {/* Background gradient overlay with enhanced colors */}
      <div className="absolute inset-0 bg-gradient-radial from-blue-900/10 via-purple-900/10 to-blue-900/30" />
      
      {/* Ambient noise overlay for visual texture */}
      <div className="absolute inset-0 pixel-noise opacity-10" />
      
      {/* Debug click position indicator (only in debug mode) */}
      {debugVisible && clickPosition && (
        <div 
          className="absolute w-8 h-8 rounded-full border-2 border-red-500 pointer-events-none z-10"
          style={{
            left: clickPosition.x - 16,
            top: clickPosition.y - 16
          }}
        />
      )}
      
      {/* Main SVG Map with enhanced styling */}
      <svg 
        ref={svgRef}
        width={stageSize.width} 
        height={stageSize.height} 
        className="relative z-10"
        data-testid="kapoor-map-svg"
        pointerEvents="all"
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
      
      {/* Collapsible Debug UI - only visible when debugVisible is true */}
      {debugVisible && (
        <div className="absolute top-4 left-4 right-4 bg-black/80 p-3 rounded text-white z-20 text-sm transition-all">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold">DEBUG MODE</h3>
            <button 
              className="px-2 py-0.5 bg-gray-700 hover:bg-gray-600 rounded text-xs"
              onClick={() => setDebugVisible(false)}
            >
              Minimize
            </button>
          </div>
          
          <div className="grid grid-cols-2 gap-2 mt-2">
            <div>
              <p>SVG Size: {stageSize.width}x{stageSize.height}</p>
              <p>Click Count: {clickCount}</p>
              <p>Click Target: {clickTarget}</p>
              <p>Click Position: {clickPosition ? `${clickPosition.x.toFixed(0)}, ${clickPosition.y.toFixed(0)}` : 'None'}</p>
            </div>
            <div>
              <p>Current Node: {currentNodeId || 'None'}</p>
              <p>Last Click: {debugInfo.lastClick || 'None'}</p>
              <p>Store Available: {debugInfo.storeAvailable ? 'Yes' : 'No'}</p>
              <p>Selection State: {debugInfo.nodeSelectionState}</p>
            </div>
          </div>
          
          {/* Direct node select buttons */}
          <div className="mt-3 flex flex-wrap gap-2">
            <button 
              className="px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs"
              onClick={() => forceNodeSelection('node-1')}
            >
              Force Node 1
            </button>
            <button 
              className="px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs"
              onClick={() => forceNodeSelection('node-2')}
            >
              Force Node 2
            </button>
            <button 
              className="px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs"
              onClick={() => forceNodeSelection('node-3')}
            >
              Force Node 3
            </button>
            <button 
              className="px-2 py-1 bg-red-600 hover:bg-red-500 text-white rounded text-xs"
              onClick={() => {
                const gameStore = useGameStore.getState();
                if (gameStore && gameStore.setCurrentNode) {
                  gameStore.setCurrentNode(null);
                }
              }}
            >
              Reset Selection
            </button>
          </div>
          
          {/* Error display */}
          {debugInfo.lastError && (
            <div className="mt-2 p-1 bg-red-900/80 rounded">
              Error: {debugInfo.lastError}
            </div>
          )}
        </div>
      )}
      
      {/* Floating debug toggle button - always visible */}
      <div className="absolute top-4 right-4 z-20">
        <button
          className="px-3 py-1 bg-gray-800/70 hover:bg-gray-700 text-white rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-lg backdrop-blur-sm"
          onClick={() => setDebugVisible(!debugVisible)}
        >
          {debugVisible ? 'Hide Debug' : 'Show Debug'}
        </button>
      </div>
      
      {/* Action button with enhanced styling */}
      <div className="absolute bottom-4 right-4 z-10">
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
          0%, 100% { transform: scale(1); opacity: 0.7; }
          50% { transform: scale(1.1); opacity: 0.9; }
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
          transform: skewX(-25deg);
          transition: all 0.5s ease;
        }
        
        .enhanced-button:hover::after {
          left: 100%;
        }
      `}</style>
    </div>
  );
};

export default SimplifiedKapoorMap;