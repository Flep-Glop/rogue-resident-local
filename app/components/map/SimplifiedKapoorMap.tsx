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
  // Add these refs for animation control
  const nodeAnimationTimerRef = useRef<number | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  
  // Enhance node click handler with animation
  const handleNodeClick = useStableCallback((nodeId: string) => {
    console.log(`[MAP] Starting node selection process for: ${nodeId}`);
    
    // Only proceed if node is interactive
    if (!isNodeInteractive(nodeId)) {
      console.log(`Node ${nodeId} is locked or not interactive`);
      return;
    }
    
    console.log(`[MAP] Node ${nodeId} clicked and is interactive`);
    
    // Track click for debugging
    setClickedNodeId(nodeId);
    setDebugInfo(prev => ({
      ...prev,
      lastClick: nodeId,
      nodeSelectionState: 'pending'
    }));
    
    // Clear any existing animations
    if (nodeAnimationTimerRef.current) {
      clearTimeout(nodeAnimationTimerRef.current);
      nodeAnimationTimerRef.current = null;
    }
    
    // Play selection sound
    if (typeof window !== 'undefined') {
      const audio = new Audio('/sounds/node-select.mp3');
      audio.volume = 0.5;
      audio.play().catch(e => console.warn('Audio play failed:', e));
    }
    
    // Instead, create a more gentle fade overlay directly in this component
    const fadeOverlay = document.createElement('div');
    fadeOverlay.id = 'map-fade-overlay';
    fadeOverlay.style.cssText = `
      position: fixed;
      inset: 0;
      background-color: black;
      opacity: 0;
      transition: opacity 1.5s ease-in;
      pointer-events: none;
      z-index: 5000;
    `;
    document.body.appendChild(fadeOverlay);
    
    // Force reflow
    fadeOverlay.offsetHeight;
    
    // Fade in gradually - not immediately
    setTimeout(() => {
      if (fadeOverlay) {
        fadeOverlay.style.opacity = '0.4';
      }
    }, 100);
    
    setTimeout(() => {
      if (fadeOverlay) {
        fadeOverlay.style.opacity = '0.7';
      }
    }, 600);
    
    setTimeout(() => {
      if (fadeOverlay) {
        fadeOverlay.style.opacity = '1';
      }
    }, 1600);
    
    // Clean up when done
    setTimeout(() => {
      if (fadeOverlay && fadeOverlay.parentNode) {
        fadeOverlay.parentNode.removeChild(fadeOverlay);
      }
    }, 3000);
    
    // Find the clicked node element
    const nodeElement = document.getElementById(`node-${nodeId}`);
    if (nodeElement) {
      // Add enhanced glow effect to the node
      nodeElement.classList.add('node-enhanced-glow-animation');
      
      // Add vignette and radial animations
      document.querySelector('.map-vignette')?.classList.add('map-vignette-active');
      
      // Replace the immediate black overlay with a gradual fade
      const overlay = document.querySelector('.black-overlay');
      if (overlay) {
        overlay.classList.add('black-overlay-fade');
      }
      
      // Limit the number of node animations for better performance
      // Only dim nearby nodes and avoid expensive operations on far-away nodes
      const clickedRect = nodeElement.getBoundingClientRect();
      document.querySelectorAll('.node-group').forEach(node => {
        if (node.id !== `node-${nodeId}`) {
          const rect = node.getBoundingClientRect();
          const distance = Math.sqrt(
            Math.pow(rect.left - clickedRect.left, 2) + 
            Math.pow(rect.top - clickedRect.top, 2)
          );
          
          // Only animate nearby nodes for better performance
          if (distance < 500) {
            node.classList.add('node-dim-animation');
          } else {
            // Just hide far nodes immediately without animation
            (node as HTMLElement).style.opacity = '0.1';
          }
        }
      });
    }
    
    // Step 1: Add zoom/blur effect to the entire map container with longer duration
    if (mapContainerRef.current) {
      console.log('[MAP] Adding map transition effect');
      mapContainerRef.current.classList.add('map-transition-out-extended');
      mapContainerRef.current.style.willChange = 'transform, opacity';
    }
    
    // Map node IDs to dialogue node IDs if needed
    const nodeToDialogueMapping: Record<string, string> = {
      'start': 'kapoor-1', // First Kapoor node
      'path-a1': 'kapoor-2', // Second Kapoor node
      // Add more mappings as needed
    };
    
    // Use the mapped dialogue ID if available, otherwise use the node ID directly
    const dialogueNodeId = nodeToDialogueMapping[nodeId] || nodeId;
    
    console.log(`[MAP] Node ${nodeId} mapped to dialogue ID ${dialogueNodeId}`);
    
    // Step 2: After animation completes, navigate to node
    nodeAnimationTimerRef.current = window.setTimeout(() => {
      if (!isMountedRef.current) return;
      
      // Get store for state updates
      try {
        console.log(`[MAP] Animation complete, now setting current node to ${nodeId}`);
        
        // Actually set the current node
        const gameStore = useGameStore.getState();
        if (gameStore && gameStore.setCurrentNode) {
          console.log(`[MAP] Setting current node to ${nodeId}`);
          gameStore.setCurrentNode(nodeId);
          
          // But include dialogueNodeId in the event dispatch for other listeners
          safeDispatch(GameEventType.UI_NODE_SELECTED, { 
            nodeId, 
            dialogueNodeId,
            source: 'map' 
          });
          
          setDebugInfo(prev => ({ 
            ...prev, 
            nodeSelectionState: 'success' 
          }));
        } else {
          console.error('[MAP] Game store not available for node selection');
          setDebugInfo(prev => ({
            ...prev,
            lastError: 'Game store not available',
            nodeSelectionState: 'error'
          }));
        }
      } catch (error) {
        console.error('[MAP] Error in node selection:', error);
        setDebugInfo(prev => ({
          ...prev,
          lastError: error instanceof Error ? error.message : 'Unknown error',
          nodeSelectionState: 'error'
        }));
      }
    }, 2500); // Slightly shorter to ensure transition completes before node change

    // Store the click position relative to viewport size
    // This will help us animate from the node position
    if (typeof window !== 'undefined') {
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      // Store click position as percentage of viewport
      // Store directly on window for simplicity (avoid complex state management)
      (window as any).__LAST_NODE_CLICK_POS__ = {
        x: (event as MouseEvent).clientX / viewportWidth * 100,
        y: (event as MouseEvent).clientY / viewportHeight * 100,
      };
      
      console.log(`[SimplifiedKapoorMap] Node ${nodeId} clicked at:`, (window as any).__LAST_NODE_CLICK_POS__);
    }
  });
  
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
  
  // Create a new direct node click function for extremely reliable selection
  const handleDirectNodeClick = useStableCallback((nodeId: string) => {
    console.log(`[MAP] Direct node click on ${nodeId}`);
    
    if (!isNodeInteractive(nodeId)) {
      console.log(`[MAP] Node ${nodeId} is not interactive, ignoring click`);
      return;
    }
    
    // Skip animations and directly set the node
    try {
      console.log(`[MAP] Setting current node directly to ${nodeId}`);
      const gameStore = useGameStore.getState();
      if (gameStore && gameStore.setCurrentNode) {
        gameStore.setCurrentNode(nodeId);
        console.log(`[MAP] Successfully set current node to ${nodeId}`);
      } else {
        console.error(`[MAP] Game store not available`);
      }
    } catch (error) {
      console.error(`[MAP] Error setting node:`, error);
    }
  });
  
  // Node renderer with enhanced visuals
  const renderNodes = useCallback(() => {
    console.log(`[MAP] Rendering ${nodes.length} nodes`);
    
    return nodes.map(node => {
      const nodeStatus = getNodeStatus(node.id);
      const isHovered = node.id === hoveredNodeId;
      const isClicked = node.id === clickedNodeId;
      const size = 22; // Reduced by 2x from 45
      const isInteractive = isNodeInteractive(node.id);
      
      // Debug log when rendering the start node
      if (node.id === 'start') {
        console.log(`[MAP] Rendering start node: status=${nodeStatus}, interactive=${isInteractive}`);
      }
      
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
          id={`node-${node.id}`} 
          data-node-id={node.id}
          data-node-type={node.type}
          data-node-status={nodeStatus}
          onClick={() => {
            // Try animated transition first
            handleNodeClick(node.id);
            
            // Set a backup timer to directly set the node if animation fails
            setTimeout(() => {
              const gameStore = useGameStore.getState();
              // If node hasn't changed, try direct selection
              if (gameStore && gameStore.currentNodeId !== node.id && isNodeInteractive(node.id)) {
                console.log(`[MAP] Animation may have failed, attempting direct selection of ${node.id}`);
                handleDirectNodeClick(node.id);
              }
            }, 3500);
          }}
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
          
          {/* Intense glow for clicked node - initially invisible but activated by CSS */}
          <circle
            cx={node.x}
            cy={node.y}
            r={size + 3}
            className="node-glow-ring"
            fill="none"
            stroke={nodeTypeColor}
            strokeWidth="0"
            opacity="0"
          />
          
          {/* Outer glow ring - for growing animation */}
          <circle
            cx={node.x}
            cy={node.y}
            r={size + 3}
            className="node-outer-glow-ring"
            fill="none"
            stroke={nodeTypeColor}
            strokeWidth="0"
            opacity="0"
          />

          {/* Additional radial glow rings - will be animated when node is clicked */}
          <circle
            cx={node.x}
            cy={node.y}
            r={size + 3}
            className="node-radial-ring-1"
            fill="none"
            stroke={nodeTypeColor}
            strokeWidth="0"
            opacity="0"
          />
          
          <circle
            cx={node.x}
            cy={node.y}
            r={size + 3}
            className="node-radial-ring-2"
            fill="none"
            stroke={nodeTypeColor}
            strokeWidth="0"
            opacity="0"
          />
          
          <circle
            cx={node.x}
            cy={node.y}
            r={size + 3}
            className="node-radial-ring-3"
            fill="none"
            stroke={nodeTypeColor}
            strokeWidth="0"
            opacity="0"
          />
          
          {/* Type-based glow behind node - use opacity instead of filter for better performance */}
          <circle
            cx={node.x}
            cy={node.y}
            r={size + 3}
            fill={nodeTypeGlowColor}
            opacity={0.8}
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
      ref={mapContainerRef} 
      className="relative w-full h-full overflow-hidden bg-black"
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
        
        {/* Vignette effect container that will be activated on node selection */}
        <div className="absolute inset-0 map-vignette" />
        
        {/* Additional black overlay for transitions */}
        <div className="absolute inset-0 black-overlay opacity-0 z-50" />
      </div>
      
      {/* Emergency start node button - for debugging */}
      <div className="absolute top-4 right-4 z-50">
        <button 
          className="px-4 py-2 bg-blue-700 text-white font-pixel text-sm rounded shadow-md hover:bg-blue-600 transition-colors"
          onClick={() => {
            console.log("[MAP] Emergency start node button clicked");
            handleDirectNodeClick('start');
          }}
        >
          Start Node
        </button>
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
        
        /* Enhanced Node Glow Animation - optimized for performance */
        @keyframes nodeEnhancedGlow {
          0% { 
            r: 26;
            stroke-width: 2;
            opacity: 0.3;
          }
          50% {
            r: 45;
            stroke-width: 5;
            opacity: 0.7;
          }
          100% {
            r: 90;
            stroke-width: 8;
            opacity: 0.2;
          }
        }
        
        /* Outer Glow Ring Animation - simplified for performance */
        @keyframes nodeOuterGlowRing {
          0% { 
            r: 28;
            stroke-width: 1;
            opacity: 0;
          }
          30% {
            r: 70;
            stroke-width: 3;
            opacity: 0.4;
          }
          100% {
            r: 150;
            stroke-width: 1;
            opacity: 0;
          }
        }
        
        /* Additional Radial Ring Animations - reduced for performance */
        @keyframes nodeRadialRing1 {
          0% { 
            r: 30;
            stroke-width: 1;
            opacity: 0;
          }
          20% {
            r: 75;
            stroke-width: 2;
            opacity: 0.3;
          }
          100% {
            r: 200;
            stroke-width: 1;
            opacity: 0;
          }
        }
        
        @keyframes nodeRadialRing2 {
          0% { 
            r: 30;
            stroke-width: 1;
            opacity: 0;
          }
          10% {
            opacity: 0;
          }
          30% {
            r: 50;
            stroke-width: 3;
            opacity: 0.4;
          }
          100% {
            r: 230;
            stroke-width: 1;
            opacity: 0;
          }
        }
        
        @keyframes nodeRadialRing3 {
          0% { 
            r: 30;
            stroke-width: 1;
            opacity: 0;
          }
          20% {
            opacity: 0;
          }
          40% {
            r: 60;
            stroke-width: 4;
            opacity: 0.5;
          }
          100% {
            r: 260;
            stroke-width: 1;
            opacity: 0;
          }
        }
        
        /* Vignette effect animation - simplified for better performance */
        @keyframes vignetteAnimation {
          0% {
            box-shadow: inset 0 0 0px rgba(0,0,0,0);
          }
          100% {
            box-shadow: inset 0 0 150px rgba(0,0,0,0.7);
          }
        }
        
        /* Map vignette setup */
        .map-vignette {
          pointer-events: none;
          transition: all 0.5s ease;
          box-shadow: inset 0 0 0px rgba(0,0,0,0);
          background: radial-gradient(circle at center, transparent 30%, rgba(0,0,0,0) 70%);
        }
        
        .map-vignette-active {
          animation: vignetteAnimation 2s forwards;
        }
        
        .node-enhanced-glow-animation .node-glow-ring {
          animation: nodeEnhancedGlow 3s ease-in forwards;
        }
        
        .node-enhanced-glow-animation .node-outer-glow-ring {
          animation: nodeOuterGlowRing 3s ease-in forwards;
        }
        
        .node-enhanced-glow-animation .node-radial-ring-1 {
          animation: nodeRadialRing1 2.5s ease-out forwards;
        }
        
        .node-enhanced-glow-animation .node-radial-ring-2 {
          animation: nodeRadialRing2 2.8s ease-out forwards;
        }
        
        .node-enhanced-glow-animation .node-radial-ring-3 {
          animation: nodeRadialRing3 3s ease-out forwards;
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
        
        .node-pulse-animation {
          animation: nodePulse 0.75s ease-out;
          z-index: 10;
          filter: drop-shadow(0 0 10px #fff);
        }
        
        .node-dim-animation {
          animation: nodeDim 1.5s forwards;
        }
        
        .map-transition-out {
          animation: mapZoomBlur 0.75s forwards;
        }
        
        /* Extended transition */
        .map-transition-out-extended {
          animation: mapZoomBlurExtended 3s forwards;
        }
        
        @keyframes nodePulse {
          0% { transform: scale(1); filter: brightness(1); }
          50% { transform: scale(1.5); filter: brightness(1.5) drop-shadow(0 0 15px #fff); }
          100% { transform: scale(1.3); filter: brightness(1.2) drop-shadow(0 0 10px #fff); }
        }
        
        @keyframes nodeDim {
          to { opacity: 0.1; }
        }
        
        /* Style for body during transition */
        .transitioning-to-black {
          background-color: black !important;
        }
        
        /* Performance optimizations */
        .node-group {
          will-change: opacity, transform;
        }
        
        /* Use transform instead of filter for better performance */
        .map-transition-out-extended {
          animation: mapZoomBlurExtended 2.8s forwards;
          will-change: transform, opacity, background-color;
        }
        
        /* Prevent repaints by using opacity instead of filter for animations */
        .node-dim-animation {
          animation: nodeDim 1s forwards;
          will-change: opacity;
        }
        
        /* Force GPU acceleration for all animations */
        .animate-pulse-path,
        .animate-pulse-slow,
        .animate-pulse-in-place,
        .node-glow-ring,
        .node-outer-glow-ring,
        .node-radial-ring-1,
        .node-radial-ring-2,
        .node-radial-ring-3 {
          transform: translateZ(0);
          will-change: opacity, r, stroke-width;
        }
        
        /* Optimize the black overlay - use gradual fade instead of immediate */
        .black-overlay {
          background-color: #000;
          opacity: 0;
          transition: opacity 1.5s ease-in;
          pointer-events: none;
          will-change: opacity;
          z-index: 1000;
        }
        
        .black-overlay-fade {
          opacity: 0.85; /* Not 1, to keep some visibility */
        }
        
        /* Extended zoom blur animation - optimized for performance and gradual fade */
        @keyframes mapZoomBlurExtended {
          0% { 
            transform: translate3d(0,0,0) scale(1); 
            background-color: rgba(0,0,0,0); 
            opacity: 1;
          }
          20% { 
            transform: translate3d(0,0,0) scale(1.02); 
            background-color: rgba(0,0,0,0.2); 
            opacity: 0.95;
          }
          60% { 
            transform: translate3d(0,0,0) scale(1.05); 
            background-color: rgba(0,0,0,0.4); 
            opacity: 0.85;
          }
          100% { 
            transform: translate3d(0,0,0) scale(1.08); 
            background-color: rgba(0,0,0,0.8); 
            opacity: 0.7;
          }
        }
        
        /* Vignette effect animation - more gradual */
        @keyframes vignetteAnimation {
          0% {
            box-shadow: inset 0 0 0px rgba(0,0,0,0);
          }
          100% {
            box-shadow: inset 0 0 100px rgba(0,0,0,0.5);
          }
        }
      `}</style>
    </div>
  );
};

export default SimplifiedKapoorMap;