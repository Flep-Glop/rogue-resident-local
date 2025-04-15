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

// Define node status types for visual feedback
enum NodeStatus {
  LOCKED = 'locked',
  AVAILABLE = 'available',
  CURRENT = 'current',
  COMPLETED = 'completed'
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
 * 6. Added node status system with visual indicators
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
  // Enhanced static map nodes data with more complex slay-the-spire inspired paths
  const [nodes, setNodes] = useState<MapNode[]>([
    // Starting node (Act 1)
    { id: 'start', x: 600, y: 120, label: 'Start', type: 'calibration', connections: ['path-a1', 'path-a2', 'path-a3', 'path-a4'], data: {} },
    
    // Act 1 - First row of choices
    { id: 'path-a1', x: 350, y: 220, label: 'Path A1', type: 'qa', connections: ['enc-1', 'enc-2'], data: {} },
    { id: 'path-a2', x: 500, y: 220, label: 'Path A2', type: 'educational', connections: ['enc-3', 'enc-4'], data: {} },
    { id: 'path-a3', x: 700, y: 220, label: 'Path A3', type: 'clinical', connections: ['enc-5', 'enc-6'], data: {} },
    { id: 'path-a4', x: 850, y: 220, label: 'Path A4', type: 'calibration', connections: ['enc-7', 'enc-8'], data: {} },
    
    // Act 1 - Second row of encounters
    { id: 'enc-1', x: 250, y: 320, label: 'Encounter 1', type: 'educational', connections: ['chal-1'], data: {} },
    { id: 'enc-2', x: 350, y: 320, label: 'Encounter 2', type: 'clinical', connections: ['chal-2'], data: {} },
    { id: 'enc-3', x: 450, y: 320, label: 'Encounter 3', type: 'qa', connections: ['chal-3'], data: {} },
    { id: 'enc-4', x: 550, y: 320, label: 'Encounter 4', type: 'calibration', connections: ['chal-4'], data: {} },
    { id: 'enc-5', x: 650, y: 320, label: 'Encounter 5', type: 'educational', connections: ['chal-5'], data: {} },
    { id: 'enc-6', x: 750, y: 320, label: 'Encounter 6', type: 'clinical', connections: ['chal-6'], data: {} },
    { id: 'enc-7', x: 850, y: 320, label: 'Encounter 7', type: 'qa', connections: ['chal-7'], data: {} },
    { id: 'enc-8', x: 950, y: 320, label: 'Encounter 8', type: 'educational', connections: ['chal-8'], data: {} },
    
    // Act 1 - Third row of challenges (staggered pattern)
    { id: 'chal-1', x: 225, y: 420, label: 'Challenge 1', type: 'qa', connections: ['hub-1'], data: {} },
    { id: 'chal-2', x: 325, y: 420, label: 'Challenge 2', type: 'clinical', connections: ['hub-1'], data: {} },
    { id: 'chal-3', x: 425, y: 420, label: 'Challenge 3', type: 'educational', connections: ['hub-2'], data: {} },
    { id: 'chal-4', x: 525, y: 420, label: 'Challenge 4', type: 'calibration', connections: ['hub-2'], data: {} },
    { id: 'chal-5', x: 625, y: 420, label: 'Challenge 5', type: 'qa', connections: ['hub-3'], data: {} },
    { id: 'chal-6', x: 725, y: 420, label: 'Challenge 6', type: 'clinical', connections: ['hub-3'], data: {} },
    { id: 'chal-7', x: 825, y: 420, label: 'Challenge 7', type: 'educational', connections: ['hub-4'], data: {} },
    { id: 'chal-8', x: 925, y: 420, label: 'Challenge 8', type: 'calibration', connections: ['hub-4'], data: {} },
    
    // Mystery encounters branching from regular paths
    { id: 'mystery-1', x: 300, y: 345, label: 'Mystery 1', type: 'qa', connections: ['side-1'], data: {} },
    { id: 'mystery-2', x: 400, y: 345, label: 'Mystery 2', type: 'clinical', connections: ['side-2'], data: {} },
    { id: 'mystery-3', x: 600, y: 345, label: 'Mystery 3', type: 'calibration', connections: ['side-3'], data: {} },
    { id: 'mystery-4', x: 700, y: 345, label: 'Mystery 4', type: 'educational', connections: ['side-4'], data: {} },
    { id: 'mystery-5', x: 800, y: 345, label: 'Mystery 5', type: 'qa', connections: ['side-5'], data: {} },
    { id: 'mystery-6', x: 900, y: 345, label: 'Mystery 6', type: 'clinical', connections: ['side-6'], data: {} },
    
    // Side paths
    { id: 'side-1', x: 275, y: 445, label: 'Side 1', type: 'educational', connections: ['hub-1'], data: {} },
    { id: 'side-2', x: 375, y: 445, label: 'Side 2', type: 'qa', connections: ['hub-1'], data: {} },
    { id: 'side-3', x: 575, y: 445, label: 'Side 3', type: 'clinical', connections: ['hub-2'], data: {} },
    { id: 'side-4', x: 675, y: 445, label: 'Side 4', type: 'calibration', connections: ['hub-3'], data: {} },
    { id: 'side-5', x: 775, y: 445, label: 'Side 5', type: 'educational', connections: ['hub-4'], data: {} },
    { id: 'side-6', x: 875, y: 445, label: 'Side 6', type: 'qa', connections: ['hub-4'], data: {} },
    
    // Act 1 - Fourth row (converging paths to hubs)
    { id: 'hub-1', x: 275, y: 520, label: 'Hub 1', type: 'educational', connections: ['elite-1'], data: {} },
    { id: 'hub-2', x: 475, y: 520, label: 'Hub 2', type: 'qa', connections: ['elite-2'], data: {} },
    { id: 'hub-3', x: 675, y: 520, label: 'Hub 3', type: 'calibration', connections: ['elite-3'], data: {} },
    { id: 'hub-4', x: 875, y: 520, label: 'Hub 4', type: 'clinical', connections: ['elite-4'], data: {} },
    
    // Act 1 - Fifth row (elite encounters)
    { id: 'elite-1', x: 275, y: 620, label: 'Elite 1', type: 'clinical', connections: ['path-final-1'], data: {} },
    { id: 'elite-2', x: 475, y: 620, label: 'Elite 2', type: 'educational', connections: ['path-final-1'], data: {} },
    { id: 'elite-3', x: 675, y: 620, label: 'Elite 3', type: 'qa', connections: ['path-final-2'], data: {} },
    { id: 'elite-4', x: 875, y: 620, label: 'Elite 4', type: 'calibration', connections: ['path-final-2'], data: {} },

    // Act 1 - Sixth row (converging to act boss)
    { id: 'path-final-1', x: 375, y: 720, label: 'Path Final 1', type: 'educational', connections: ['act1-boss'], data: {} },
    { id: 'path-final-2', x: 775, y: 720, label: 'Path Final 2', type: 'qa', connections: ['act1-boss'], data: {} },
    
    // Act 1 - Boss encounter
    { id: 'act1-boss', x: 600, y: 820, label: 'Act 1 Boss', type: 'clinical', connections: ['treasure', 'rest', 'recovery'], data: {} },
    
    // Special nodes between acts
    { id: 'treasure', x: 500, y: 870, label: 'Treasure', type: 'calibration', connections: ['path-b1'], data: {} },
    { id: 'rest', x: 600, y: 870, label: 'Rest', type: 'qa', connections: ['path-b2'], data: {} },
    { id: 'recovery', x: 700, y: 870, label: 'Recovery', type: 'educational', connections: ['path-b3'], data: {} },
    
    // Act 2 - First row (choose path after beating boss)
    { id: 'path-b1', x: 400, y: 920, label: 'Path B1', type: 'qa', connections: ['b-chal-1', 'b-chal-2'], data: {} },
    { id: 'path-b2', x: 600, y: 920, label: 'Path B2', type: 'educational', connections: ['b-chal-3', 'b-chal-4'], data: {} },
    { id: 'path-b3', x: 800, y: 920, label: 'Path B3', type: 'calibration', connections: ['b-chal-5', 'b-chal-6'], data: {} },
    
    // Act 2 - Second row of challenges
    { id: 'b-chal-1', x: 350, y: 1020, label: 'B-Challenge 1', type: 'educational', connections: ['b-hard-1'], data: {} },
    { id: 'b-chal-2', x: 450, y: 1020, label: 'B-Challenge 2', type: 'clinical', connections: ['b-hard-2'], data: {} },
    { id: 'b-chal-3', x: 550, y: 1020, label: 'B-Challenge 3', type: 'qa', connections: ['b-hard-3'], data: {} },
    { id: 'b-chal-4', x: 650, y: 1020, label: 'B-Challenge 4', type: 'educational', connections: ['b-hard-4'], data: {} },
    { id: 'b-chal-5', x: 750, y: 1020, label: 'B-Challenge 5', type: 'clinical', connections: ['b-hard-5'], data: {} },
    { id: 'b-chal-6', x: 850, y: 1020, label: 'B-Challenge 6', type: 'calibration', connections: ['b-hard-6'], data: {} },
    
    // Act 2 Secret challenges
    { id: 'b-secret-1', x: 400, y: 1070, label: 'Secret 1', type: 'calibration', connections: ['b-hard-2'], data: {} },
    { id: 'b-secret-2', x: 500, y: 1070, label: 'Secret 2', type: 'qa', connections: ['b-hard-3'], data: {} },
    { id: 'b-secret-3', x: 700, y: 1070, label: 'Secret 3', type: 'clinical', connections: ['b-hard-4'], data: {} },
    { id: 'b-secret-4', x: 800, y: 1070, label: 'Secret 4', type: 'educational', connections: ['b-hard-5'], data: {} },
    
    // Act 2 - Third row of hard challenges
    { id: 'b-hard-1', x: 350, y: 1120, label: 'B-Hard 1', type: 'qa', connections: ['b-elite-1'], data: {} },
    { id: 'b-hard-2', x: 450, y: 1120, label: 'B-Hard 2', type: 'clinical', connections: ['b-elite-1'], data: {} },
    { id: 'b-hard-3', x: 550, y: 1120, label: 'B-Hard 3', type: 'educational', connections: ['b-elite-2'], data: {} },
    { id: 'b-hard-4', x: 650, y: 1120, label: 'B-Hard 4', type: 'calibration', connections: ['b-elite-2'], data: {} },
    { id: 'b-hard-5', x: 750, y: 1120, label: 'B-Hard 5', type: 'qa', connections: ['b-elite-3'], data: {} },
    { id: 'b-hard-6', x: 850, y: 1120, label: 'B-Hard 6', type: 'clinical', connections: ['b-elite-3'], data: {} },
    
    // Act 2 - Fourth row (converging to final boss elites)
    { id: 'b-elite-1', x: 400, y: 1220, label: 'B-Elite 1', type: 'educational', connections: ['final-boss'], data: {} },
    { id: 'b-elite-2', x: 600, y: 1220, label: 'B-Elite 2', type: 'qa', connections: ['final-boss'], data: {} },
    { id: 'b-elite-3', x: 800, y: 1220, label: 'B-Elite 3', type: 'calibration', connections: ['final-boss'], data: {} },
    
    // Final boss node
    { id: 'final-boss', x: 600, y: 1320, label: 'FINAL BOSS', type: 'clinical', connections: [], data: {} },
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

  // Define colors for node status visual feedback
  const nodeStatusStyles = {
    [NodeStatus.LOCKED]: {
      filter: 'grayscale(100%) brightness(40%)',
      borderColor: 'rgba(100, 100, 100, 0.5)',
      borderWidth: 1,
      glowColor: 'rgba(100, 100, 100, 0.3)'
    },
    [NodeStatus.AVAILABLE]: {
      filter: 'brightness(100%)',
      borderColor: 'rgba(120, 255, 120, 0.8)',
      borderWidth: 2,
      glowColor: 'rgba(120, 255, 120, 0.3)'
    },
    [NodeStatus.CURRENT]: {
      filter: 'brightness(130%)',
      borderColor: 'rgba(120, 160, 255, 0.8)',
      borderWidth: 3,
      glowColor: 'rgba(120, 160, 255, 0.5)'
    },
    [NodeStatus.COMPLETED]: {
      filter: 'brightness(100%)',
      borderColor: 'rgba(255, 215, 0, 0.8)',
      borderWidth: 2,
      glowColor: 'rgba(255, 215, 0, 0.4)'
    }
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
    } else {
      // When returning to map (currentNodeId becomes null), refresh completed nodes
      console.log('[MAP] Returning to map, refreshing completed nodes');
      try {
        if (typeof window !== 'undefined' && window.__GAME_STATE_MACHINE_DEBUG__?.getCurrentState) {
          const gameStateMachine = window.__GAME_STATE_MACHINE_DEBUG__.getCurrentState();
          if (gameStateMachine && gameStateMachine.completedNodeIds) {
            console.log('[MAP] Found completed nodes:', gameStateMachine.completedNodeIds);
            setCompletedNodes(gameStateMachine.completedNodeIds);
          }
        }
      } catch (error) {
        console.warn('[MAP] Error refreshing completed nodes:', error);
      }
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
  
  // ===== NODE STATUS DETERMINATION =====
  // Get node status (locked, available, current, completed)
  const getNodeStatus = useCallback((nodeId: string): NodeStatus => {
    // First check if it's the current node
    if (nodeId === currentNodeId) {
      return NodeStatus.CURRENT;
    }
    
    // Check if it's a completed node
    if (completedNodes.includes(nodeId)) {
      return NodeStatus.COMPLETED;
    }
    
    // Start node is always available
    if (nodeId === 'start') {
      return NodeStatus.AVAILABLE;
    }
    
    // Check if it's available (connected to a completed node)
    const isAvailable = nodes.some(node => 
      completedNodes.includes(node.id) && 
      node.connections.includes(nodeId)
    );
    
    return isAvailable ? NodeStatus.AVAILABLE : NodeStatus.LOCKED;
  }, [nodes, currentNodeId, completedNodes]);

  // Check if a node is interactive
  const isNodeInteractive = useCallback((nodeId: string): boolean => {
    const status = getNodeStatus(nodeId);
    return status === NodeStatus.AVAILABLE || status === NodeStatus.CURRENT;
  }, [getNodeStatus]);
  
  // ===== NODE CLICK HANDLING =====
  // Node click handler
  const handleNodeClick = useCallback((nodeId: string) => {
    // Only proceed if the component is still mounted
    if (!isMountedRef.current) return;
    
    // Check if node is interactive
    if (!isNodeInteractive(nodeId)) {
      // Show feedback that node is locked
      console.log(`Node ${nodeId} is locked. Complete connected nodes to unlock it.`);
      return;
    }
    
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
  }, [nodes, triggerSelectionAnimation, isNodeInteractive]);
  
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
        const startNodeStatus = getNodeStatus(node.id);
        const endNodeStatus = getNodeStatus(targetId);
        const isActivePath = currentNodeId === node.id || currentNodeId === targetId;
        const isHovered = hoveredNodeId === node.id || hoveredNodeId === targetId;
        const isAvailablePath = startNodeStatus !== NodeStatus.LOCKED && endNodeStatus !== NodeStatus.LOCKED;
        
        return (
          <g key={`${node.id}-${targetId}`}>
            {/* Base line */}
            <line
              x1={startCoords.x}
              y1={startCoords.y}
              x2={endCoords.x}
              y2={endCoords.y}
              stroke={isActivePath 
                ? "rgba(120, 160, 255, 0.8)" 
                : isAvailablePath 
                  ? "rgba(100, 100, 255, 0.5)" 
                  : "rgba(100, 100, 100, 0.3)"}
              strokeWidth={isActivePath ? 4 : 3}
              strokeDasharray={isHovered ? "none" : "5,5"}
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
  }, [nodes, getNodeCoords, currentNodeId, hoveredNodeId, getNodeStatus]);
  
  // Node renderer with enhanced visuals
  const renderNodes = useCallback(() => {
    return nodes.map(node => {
      const nodeStatus = getNodeStatus(node.id);
      const isHovered = node.id === hoveredNodeId;
      const isClicked = node.id === clickedNodeId;
      const size = 22; // Reduced by 2x from 45
      const isInteractive = isNodeInteractive(node.id);
      
      // Get styles based on node status
      const statusStyle = nodeStatusStyles[nodeStatus];

      return (
        <g 
          key={node.id}
          onClick={() => handleNodeClick(node.id)}
          onMouseEnter={() => setHoveredNodeId(node.id)}
          onMouseLeave={() => setHoveredNodeId(null)}
          style={{ 
            cursor: isInteractive ? 'pointer' : 'not-allowed',
            opacity: nodeStatus === NodeStatus.LOCKED ? 0.6 : 1
          }}
          className={`node-group ${nodeStatus.toLowerCase()}-node ${isHovered ? 'hovered-node' : ''}`}
        >
          {/* Status circle for better visibility */}
          <circle
            cx={node.x}
            cy={node.y}
            r={size + 2}
            fill="none"
            stroke={statusStyle.borderColor}
            strokeWidth={statusStyle.borderWidth}
            filter={isHovered ? "drop-shadow(0 0 3px rgba(255,255,255,0.5))" : "none"}
          />

          {/* Glow effect based on status */}
          {(nodeStatus === NodeStatus.CURRENT || isHovered) && (
            <circle
              cx={node.x}
              cy={node.y}
              r={size + 5}
              fill="none"
              stroke={statusStyle.glowColor}
              strokeWidth={2}
              filter="blur(3px)"
            />
          )}

          {/* Node image with status-based filter */}
          <image
            href={getNodeImage(node.type)}
            x={node.x - size}
            y={node.y - size}
            width={size * 2}
            height={size * 2}
            style={{
              filter: statusStyle.filter,
              imageRendering: 'pixelated',
              shapeRendering: 'crispEdges'
            }}
            className={nodeStatus === NodeStatus.CURRENT ? "animate-pulse-slow" : ""}
          />

          {/* Node label */}
          <text
            x={node.x + size + 5}
            y={node.y}
            fill={nodeStatus === NodeStatus.LOCKED ? "rgba(200,200,200,0.6)" : "white"}
            fontSize={12}
            className="pixel-text"
            style={{ 
              filter: nodeStatus === NodeStatus.CURRENT 
                ? "drop-shadow(0 0 2px rgba(255,255,255,0.5))" 
                : "none",
              pointerEvents: "none"
            }}
          >
            {node.label}
          </text>
        </g>
      );
    });
  }, [nodes, hoveredNodeId, clickedNodeId, handleNodeClick, getNodeStatus, isNodeInteractive]);
  
  // ===== LEGEND COMPONENT =====
  const renderLegend = useMemo(() => {
    const legendItems = [
      { status: NodeStatus.CURRENT, label: 'Current' },
      { status: NodeStatus.COMPLETED, label: 'Completed' },
      { status: NodeStatus.AVAILABLE, label: 'Available' },
      { status: NodeStatus.LOCKED, label: 'Locked' }
    ];
    
    return (
      <div className="absolute bottom-8 left-8 z-20 bg-gray-900/80 backdrop-blur-sm rounded-md p-3 shadow-lg border border-blue-900 text-white">
        <h3 className="text-white text-sm font-medium mb-2">Map Legend</h3>
        <div className="space-y-2">
          {legendItems.map(item => {
            const style = nodeStatusStyles[item.status];
            return (
              <div key={item.status} className="flex items-center gap-2">
                <div 
                  className="w-4 h-4 rounded-full"
                  style={{ 
                    background: 'transparent',
                    border: `${style.borderWidth}px solid ${style.borderColor}` 
                  }}
                ></div>
                <span className="text-white text-xs">{item.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }, []);
  
  // ===== MAIN RENDER =====
  return (
    <div 
      ref={containerRef}
      className="w-full h-full bg-gray-900 overflow-auto"
      data-testid="kapoor-map-container"
      onClick={handleContainerClick}
    >
      {/* Background elements */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 starfield-bg" />
        <div className="absolute inset-0 bg-gradient-radial from-blue-900/10 via-purple-900/10 to-blue-900/30" />
        <div className="absolute inset-0 pixel-noise opacity-10" />
      </div>
      
      {/* Map container with expanded dimensions */}
      <div className="relative z-10 w-full" style={{ height: "1800px" }}>
        <svg 
          ref={svgRef}
          width="100%" 
          height="100%" 
          viewBox="0 0 1200 1800"
          preserveAspectRatio="xMidYMin slice"
          className={isAnimating ? 'animate-map-click' : ''}
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
      </div>
      
      {/* Map Legend */}
      {renderLegend}
      
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
        
        /* Node status-specific styles */
        .locked-node {
          cursor: not-allowed;
        }
        
        .completed-node .node-label {
          text-decoration: line-through;
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