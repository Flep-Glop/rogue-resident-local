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
    { id: 'path-a1', x: 350, y: 220, label: 'Path A1', type: 'qa', connections: ['enc-1'], data: {} },
    { id: 'path-a2', x: 500, y: 220, label: 'Path A2', type: 'educational', connections: ['enc-3'], data: {} },
    { id: 'path-a3', x: 700, y: 220, label: 'Path A3', type: 'clinical', connections: ['enc-5', 'enc-6'], data: {} },
    { id: 'path-a4', x: 850, y: 220, label: 'Path A4', type: 'calibration', connections: ['enc-7', 'enc-8'], data: {} },
    
    // Act 1 - Second row of encounters (streamlined)
    { id: 'enc-1', x: 250, y: 320, label: 'Encounter 1', type: 'educational', connections: ['chal-1'], data: {} },
    { id: 'enc-3', x: 450, y: 320, label: 'Encounter 3', type: 'qa', connections: ['chal-3'], data: {} },
    { id: 'enc-5', x: 650, y: 320, label: 'Encounter 5', type: 'educational', connections: ['chal-5'], data: {} },
    { id: 'enc-6', x: 750, y: 320, label: 'Encounter 6', type: 'clinical', connections: ['chal-6'], data: {} },
    { id: 'enc-7', x: 850, y: 320, label: 'Encounter 7', type: 'qa', connections: ['chal-7'], data: {} },
    { id: 'enc-8', x: 950, y: 320, label: 'Encounter 8', type: 'educational', connections: ['chal-8'], data: {} },
    
    // Act 1 - Third row of challenges (streamlined)
    { id: 'chal-1', x: 225, y: 420, label: 'Challenge 1', type: 'qa', connections: ['hub-1'], data: {} },
    { id: 'chal-3', x: 425, y: 420, label: 'Challenge 3', type: 'educational', connections: ['hub-2'], data: {} },
    { id: 'chal-5', x: 625, y: 420, label: 'Challenge 5', type: 'qa', connections: ['hub-3'], data: {} },
    { id: 'chal-6', x: 725, y: 420, label: 'Challenge 6', type: 'clinical', connections: ['hub-3'], data: {} },
    { id: 'chal-7', x: 825, y: 420, label: 'Challenge 7', type: 'educational', connections: ['hub-4'], data: {} },
    { id: 'chal-8', x: 925, y: 420, label: 'Challenge 8', type: 'calibration', connections: ['hub-4'], data: {} },
    
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
    
    // Special nodes between acts - restored connections to Act 2
    { id: 'treasure', x: 500, y: 870, label: 'Treasure', type: 'calibration', connections: ['path-b1'], data: {} },
    { id: 'rest', x: 600, y: 870, label: 'Rest', type: 'qa', connections: ['path-b2'], data: {} },
    { id: 'recovery', x: 700, y: 870, label: 'Recovery', type: 'educational', connections: ['path-b3'], data: {} },
    
    // Act 2 - First row (streamlined paths after beating boss)
    { id: 'path-b1', x: 400, y: 920, label: 'Path B1', type: 'qa', connections: ['b-chal-1'], data: {} },
    { id: 'path-b2', x: 600, y: 920, label: 'Path B2', type: 'educational', connections: ['b-chal-3'], data: {} },
    { id: 'path-b3', x: 800, y: 920, label: 'Path B3', type: 'calibration', connections: ['b-chal-5'], data: {} },
    
    // Act 2 - Second row of challenges (reduced number)
    { id: 'b-chal-1', x: 350, y: 1020, label: 'B-Challenge 1', type: 'educational', connections: ['b-hard-1'], data: {} },
    { id: 'b-chal-3', x: 600, y: 1020, label: 'B-Challenge 3', type: 'qa', connections: ['b-hard-3'], data: {} },
    { id: 'b-chal-5', x: 850, y: 1020, label: 'B-Challenge 5', type: 'clinical', connections: ['b-hard-5'], data: {} },
    
    // Act 2 - Third row of hard challenges (reduced and simplified)
    { id: 'b-hard-1', x: 350, y: 1120, label: 'B-Hard 1', type: 'qa', connections: ['b-elite-1'], data: {} },
    { id: 'b-hard-3', x: 600, y: 1120, label: 'B-Hard 3', type: 'educational', connections: ['b-elite-2'], data: {} },
    { id: 'b-hard-5', x: 850, y: 1120, label: 'B-Hard 5', type: 'qa', connections: ['b-elite-3'], data: {} },
    
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
    
    // Subscribe to completion events to update map in real-time
    const unsubscribe = useGameStore.subscribe((state, prevState) => {
      if (isMountedRef.current) {
        try {
          // Check if we need to fetch updated completion status
          // This happens when returning to the map or when a node is completed
          if (prevState.currentNodeId !== null && state.currentNodeId === null) {
            console.log('[MAP] Returning to map from a node, refreshing completed nodes');
            fetchCompletedNodes();
          }
        } catch (err) {
          console.error('[MAP] Error in store subscription:', err);
        }
      }
    });
    
    // Set up event listener for node completion events
    const handleNodeCompleted = (event: any) => {
      if (!isMountedRef.current) return;
      
      console.log('[MAP] Received node:completed event:', event);
      fetchCompletedNodes();
    };
    
    // Add event listener for node completion
    document.addEventListener('node:completed', handleNodeCompleted);
    
    // Initial fetch of completed nodes
    fetchCompletedNodes();
    
    isMountedRef.current = true;
    
    return () => {
      console.log('[MAP] Component unmounted');
      isMountedRef.current = false;
      animationTimeoutRefs.current.forEach(clearTimeout);
      animationTimeoutRefs.current = [];
      unsubscribe();
      document.removeEventListener('node:completed', handleNodeCompleted);
    };
  }, []);
  
  // Function to fetch completed nodes from game state machine
  const fetchCompletedNodes = useCallback(() => {
    try {
      if (typeof window !== 'undefined' && window.__GAME_STATE_MACHINE_DEBUG__?.getCurrentState) {
        const gameStateMachine = window.__GAME_STATE_MACHINE_DEBUG__.getCurrentState();
        if (gameStateMachine && gameStateMachine.completedNodeIds) {
          const updatedCompletedNodes = [...gameStateMachine.completedNodeIds];
          console.log('[MAP] Found completed nodes:', updatedCompletedNodes);
          setCompletedNodes(updatedCompletedNodes);
        }
      }
    } catch (error) {
      console.warn('[MAP] Error getting completed nodes:', error);
    }
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
    } else {
      // When returning to map (currentNodeId becomes null), refresh completed nodes
      console.log('[MAP] Returning to map, refreshing completed nodes');
      fetchCompletedNodes();
    }
  }, [currentNodeId, fetchCompletedNodes]);
  
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
  
  // Subscribe directly to the state machine to catch all node completions
  useEffect(() => {
    // Create an interval to periodically check for updates to completed nodes
    // This ensures we catch updates from the debug panel or other sources
    const intervalId = setInterval(() => {
      if (isMountedRef.current) {
        try {
          if (typeof window !== 'undefined' && window.__GAME_STATE_MACHINE_DEBUG__?.getCurrentState) {
            const gameStateMachine = window.__GAME_STATE_MACHINE_DEBUG__.getCurrentState();
            if (gameStateMachine && gameStateMachine.completedNodeIds) {
              // Compare current completed nodes with what we have
              const stateCompletedNodes = gameStateMachine.completedNodeIds;
              if (stateCompletedNodes.length !== completedNodes.length || 
                  !stateCompletedNodes.every((id: string) => completedNodes.includes(id))) {
                console.log('[MAP] Detected change in completed nodes from state machine');
                setCompletedNodes([...stateCompletedNodes]);
              }
            }
          }
        } catch (error) {
          console.warn('[MAP] Error in state machine monitoring:', error);
        }
      }
    }, 1000); // Check every second
    
    return () => clearInterval(intervalId);
  }, [completedNodes]);
  
  // ===== VISUAL ENHANCEMENT FUNCTIONS =====
  
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
    
    // Map node IDs to appropriate dialogue nodes
    // This mapping helps link map nodes to dialogue content
    const nodeToDialogueMapping: Record<string, string> = {
      'start': 'kapoor-1', // Link start node to first Kapoor dialogue
      'path-a1': 'kapoor-2', // Link path-a1 to second Kapoor dialogue
      // Add more mappings as needed for other nodes
    };
    
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
      
      // Map node IDs to dialogue node IDs
      const nodeToDialogueMapping: Record<string, string> = {
        'start': 'kapoor-1', // First Kapoor node
        'path-a1': 'kapoor-2', // Second Kapoor node
        // Add more mappings as needed
      };
      
      // Use the mapped dialogue ID if available, otherwise use the node ID directly
      const dialogueNodeId = nodeToDialogueMapping[nodeId] || nodeId;
      
      // Set the node in the store
      const gameStore = useGameStore.getState();
      if (isMountedRef.current) {
        setDebugInfo(prev => ({ 
          ...prev, 
          storeAvailable: !!gameStore 
        }));
      }
      
      if (gameStore && gameStore.setCurrentNode) {
        // Pass the map node ID to the store
        gameStore.setCurrentNode(nodeId);
        
        // But include dialogueNodeId in the event dispatch for other listeners
        safeDispatch(GameEventType.UI_NODE_SELECTED, { 
          nodeId, 
          dialogueNodeId,
          source: 'map' 
        });
        
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
        
        // Get the source node for coloring
        const sourceNode = nodes.find(n => n.id === node.id);
        
        // Use type-based colors for paths
        const nodeType = sourceNode?.type || 'default';
        
        const pathColor = 
          nodeType === 'calibration' ? 'rgba(120, 120, 255, 0.8)' :
          nodeType === 'qa' ? 'rgba(255, 180, 100, 0.8)' :
          nodeType === 'clinical' ? 'rgba(100, 255, 150, 0.8)' :
          'rgba(255, 130, 170, 0.8)'; // educational or default
          
        const pathGlowColor = 
          nodeType === 'calibration' ? 'rgba(120, 120, 255, 0.3)' :
          nodeType === 'qa' ? 'rgba(255, 180, 100, 0.3)' :
          nodeType === 'clinical' ? 'rgba(100, 255, 150, 0.3)' :
          'rgba(255, 130, 170, 0.3)'; // educational or default
        
        // Calculate a curved path instead of straight line
        // Control point offset - make it more pronounced for longer lines
        const dx = endCoords.x - startCoords.x;
        const dy = endCoords.y - startCoords.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const controlPointOffset = Math.min(distance * 0.3, 50);
        
        // Random offset for control point to create variety in paths
        const randomOffsetX = ((node.id.charCodeAt(0) + targetId.charCodeAt(0)) % 20) - 10;
        const randomOffsetY = ((node.id.charCodeAt(1) + targetId.charCodeAt(1)) % 10);
        
        // Calculate control point
        const midX = (startCoords.x + endCoords.x) / 2 + randomOffsetX;
        const midY = (startCoords.y + endCoords.y) / 2 - controlPointOffset - randomOffsetY;
        
        // Create path data for curved line
        const pathData = `M ${startCoords.x} ${startCoords.y} Q ${midX} ${midY} ${endCoords.x} ${endCoords.y}`;
        
        return (
          <g key={`${node.id}-${targetId}`}>
            {/* Enhanced glow for active paths */}
            {isActivePath && (
              <path
                d={pathData}
                stroke={pathGlowColor}
                strokeWidth={8}
                fill="none"
                filter="blur(4px)"
                pointerEvents="none"
              />
            )}
            
            {/* Base path with better styling */}
            <path
              d={pathData}
              stroke={isActivePath 
                ? pathColor 
                : isAvailablePath 
                  ? (pathColor.replace('0.8', '0.5')) 
                  : "rgba(100, 100, 100, 0.3)"}
              strokeWidth={isActivePath ? 4 : 3}
              strokeDasharray={isHovered ? "none" : (isAvailablePath ? "5,5" : "3,8")}
              fill="none"
              className={isActivePath ? "animate-pulse-path" : ""}
              pointerEvents="none"
            />
            
            {/* Direction indicator */}
            <circle
              cx={endCoords.x}
              cy={endCoords.y}
              r={3}
              fill={isActivePath 
                ? pathColor 
                : isAvailablePath 
                  ? (pathColor.replace('0.8', '0.5')) 
                  : "rgba(100, 100, 100, 0.3)"}
              pointerEvents="none"
              className={isActivePath ? "animate-pulse-slow" : ""}
            />
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
      
      // Get color based on node type
      const nodeTypeColor = 
        node.type === 'calibration' ? 'rgba(120, 120, 255, 0.8)' :
        node.type === 'qa' ? 'rgba(255, 180, 100, 0.8)' :
        node.type === 'clinical' ? 'rgba(100, 255, 150, 0.8)' :
        'rgba(255, 130, 170, 0.8)'; // educational or default
      
      const nodeTypeGlowColor = 
        node.type === 'calibration' ? 'rgba(120, 120, 255, 0.4)' :
        node.type === 'qa' ? 'rgba(255, 180, 100, 0.4)' :
        node.type === 'clinical' ? 'rgba(100, 255, 150, 0.4)' :
        'rgba(255, 130, 170, 0.4)'; // educational or default

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
          {/* Enhanced Node Background for better visibility */}
          <circle
            cx={node.x}
            cy={node.y}
            r={size + 5}
            fill="rgba(0, 10, 30, 0.7)"
            stroke="none"
          />
          
          {/* Type-based glow behind node */}
          <circle
            cx={node.x}
            cy={node.y}
            r={size + 3}
            fill={nodeTypeGlowColor}
            filter="blur(2px)"
          />
        
          {/* Status circle for better visibility */}
          <circle
            cx={node.x}
            cy={node.y}
            r={size + 2}
            fill="none"
            stroke={nodeStatus === NodeStatus.LOCKED ? statusStyle.borderColor : nodeTypeColor}
            strokeWidth={statusStyle.borderWidth}
            filter={isHovered ? "drop-shadow(0 0 3px rgba(255,255,255,0.5))" : "none"}
          />

          {/* Glow effect based on status */}
          {(nodeStatus === NodeStatus.CURRENT || isHovered) && (
            <circle
              cx={node.x}
              cy={node.y}
              r={size + 8}
              fill="none"
              stroke={nodeStatus === NodeStatus.LOCKED ? statusStyle.glowColor : nodeTypeColor}
              strokeWidth={3}
              filter="blur(3px)"
              className="animate-pulse-in-place"
            />
          )}

          {/* Node image with status-based filter and enhanced shadow */}
          <image
            href={getNodeImage(node.type)}
            x={node.x - size}
            y={node.y - size}
            width={size * 2}
            height={size * 2}
            style={{
              filter: `${statusStyle.filter} drop-shadow(0 0 2px rgba(0,0,0,0.5))`,
              imageRendering: 'pixelated',
              shapeRendering: 'crispEdges'
            }}
            className={nodeStatus === NodeStatus.CURRENT ? "animate-pulse-slow" : ""}
          />

          {/* Node label with better typography */}
          <text
            x={node.x + size + 5}
            y={node.y}
            fill={nodeStatus === NodeStatus.LOCKED ? "rgba(200,200,200,0.6)" : "white"}
            fontSize={12}
            fontWeight={nodeStatus === NodeStatus.CURRENT ? "bold" : "normal"}
            className="pixel-text"
            style={{ 
              filter: nodeStatus === NodeStatus.CURRENT 
                ? "drop-shadow(0 0 2px rgba(255,255,255,0.5))" 
                : "drop-shadow(1px 1px 1px rgba(0,0,0,0.7))",
              letterSpacing: "0.5px",
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
      <div className="absolute bottom-8 left-8 z-20 bg-gray-900/90 backdrop-blur-sm rounded-md p-3 shadow-lg border border-blue-900/50 text-white">
        <h3 className="text-white text-sm font-medium mb-2 tracking-wide">Map Legend</h3>
        <div className="space-y-2">
          {legendItems.map(item => {
            const style = nodeStatusStyles[item.status];
            return (
              <div key={item.status} className="flex items-center gap-2">
                <div 
                  className="w-4 h-4 rounded-full"
                  style={{ 
                    background: 'rgba(0, 10, 30, 0.5)',
                    border: `${style.borderWidth}px solid ${style.borderColor}`,
                    boxShadow: '0 0 3px rgba(0, 0, 0, 0.3)'
                  }}
                ></div>
                <span className="text-white text-xs tracking-wide">{item.label}</span>
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
      {/* Enhanced Background with cohesive visual effects */}
      <div className="fixed inset-0 z-0">
        {/* Deep space background with subtle gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-gray-950 via-blue-950 to-gray-950" />
        
        {/* Simplified starfield with fewer stars */}
        <div className="absolute inset-0 starfield-bg-sparse" />
        <div className="absolute inset-0 starfield-bg-medium" />
        
        {/* Very subtle nebula effect */}
        <div className="absolute inset-0 nebula-effect-subtle" />
        
        {/* Minimal noise texture overlay */}
        <div className="absolute inset-0 pixel-noise opacity-3" />
      </div>
      
      {/* Map container with expanded dimensions */}
      <div className="relative z-10 w-full" style={{ height: "1700px" }}>
        <svg 
          ref={svgRef}
          width="100%" 
          height="100%" 
          viewBox="0 0 1200 1700"
          preserveAspectRatio="xMidYMin slice"
          className={isAnimating ? 'animate-map-click' : ''}
          data-testid="kapoor-map-svg"
        >
          {/* Grid pattern definition */}
          <defs>
            <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
              <path d="M 50 0 L 0 0 0 50" fill="none" stroke="rgba(100, 120, 255, 0.05)" strokeWidth="0.5"/>
            </pattern>
            
            {/* Simplified grid */}
            <pattern id="enhanced-grid" width="100" height="100" patternUnits="userSpaceOnUse">
              <rect width="100" height="100" fill="transparent"/>
              <path d="M 100 0 L 0 0 0 100" fill="none" stroke="rgba(100, 120, 255, 0.05)" strokeWidth="0.5"/>
            </pattern>
            
            {/* Glow filter for nodes */}
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2.5" result="blur"/>
              <feMerge>
                <feMergeNode in="blur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
            
            {/* More intense glow for active elements */}
            <filter id="active-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" result="blur"/>
              <feMerge>
                <feMergeNode in="blur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          
          {/* Very subtle grid background */}
          <rect width="100%" height="100%" fill="url(#enhanced-grid)" pointerEvents="none" fillOpacity="0.7" />
          
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
        
        /* Keyframes for in-place pulse animation */
        @keyframes pulse-in-place {
          0%, 100% { opacity: 0.7; }
          50% { opacity: 1; }
        }
        
        /* Keyframes for very slow pulse animation */
        @keyframes pulse-very-slow {
          0%, 100% { opacity: 0.7; }
          50% { opacity: 1; }
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
        
        .animate-pulse-in-place {
          animation: pulse-in-place 2s infinite ease-in-out;
        }
        
        .animate-pulse-very-slow {
          animation: pulse-very-slow 8s infinite ease-in-out;
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
        
        /* Simplified starfield background */
        .starfield-bg-sparse {
          background-image: radial-gradient(
            circle at center,
            rgba(255, 255, 255, 0.3) 1px,
            transparent 1px
          );
          background-size: 80px 80px;
        }
        
        .starfield-bg-medium {
          background-image: radial-gradient(
            circle at center,
            rgba(255, 255, 255, 0.4) 1.5px,
            transparent 1.5px
          );
          background-size: 200px 200px;
        }
        
        /* Subtle nebula effect */
        .nebula-effect-subtle {
          background: radial-gradient(
            circle at 70% 60%,
            rgba(30, 64, 175, 0.08) 0%,
            rgba(30, 64, 175, 0.02) 40%,
            transparent 70%
          );
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