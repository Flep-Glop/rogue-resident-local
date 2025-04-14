// app/components/knowledge/ConstellationView.tsx
'use client';
/**
 * ConstellationView - Enhanced Interaction Implementation
 * 
 * Improvements:
 * 1. Robust click handling with DOM-based interaction tracking
 * 2. Reduced optimization complexity for more reliable state updates
 * 3. Explicit debugging for interaction flow
 * 4. Better state isolation to prevent rendering issues
 * 5. Maintains Chamber Pattern architectural vision
 * 6. Fixed all TypeScript type issues
 */
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { usePrimitiveStoreValue, useStableCallback } from '../../core/utils/storeHooks';
import { useKnowledgeStore, ConceptNode, ConceptConnection, KnowledgeState } from '../../store/knowledgeStore';
import { DOMAIN_COLORS, DOMAIN_COLORS_LIGHT } from '../../core/themeConstants';
import { GameEventType } from '@/app/core/events/EventTypes';
import { safeDispatch } from '@/app/core/events/CentralEventBus';

// Import Drawing Utilities
import {
  drawStarryBackground,
  drawConnections,
  drawNodes,
  drawPendingConnection,
  drawParticles,
  initializeImages
} from './constellationCanvasUtils';

// Import UI Sub-components
import ConstellationInfoPanel from './ui/ConstellationInfoPanel';
import ConstellationLegend from './ui/ConstellationLegend';
import ConstellationControls from './ui/ConstellationControls';
import ConstellationActions from './ui/ConstellationActions';
import SelectedNodePanel from './ui/SelectedNodePanel';
import ConnectionSuggestionsPanel from './ui/ConnectionSuggestionsPanel';
import JournalOverlay from './ui/JournalOverlay';
import HelpOverlay from './ui/HelpOverlay';

// Re-export Knowledge Domains for external use
export { KNOWLEDGE_DOMAINS } from '../../store/knowledgeStore';

// Helper type for particle effects
type ParticleEffect = {
  id: string;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
  opacity?: number;
  velocity?: { x: number, y: number }
};

interface ConstellationViewProps {
  nightMode?: boolean;
  showLabels?: boolean;
  interactive?: boolean;
  width?: number;
  height?: number;
  onClose?: () => void;
  activeNodes?: string[]; // IDs of nodes to highlight
  fullscreen?: boolean;
  enableJournal?: boolean;
}

/**
 * Enhanced ConstellationView with direct DOM interaction
 */
export default function ConstellationView({
  onClose,
  width,
  height,
  interactive = true,
  enableJournal = true,
  activeNodes = [],
  fullscreen = true,
  nightMode = false,
  showLabels = true
}: ConstellationViewProps) {
  // ========= REFS FOR DOM & ANIMATION STATE =========
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const isComponentMountedRef = useRef(true);
  const particleEffectsRef = useRef<ParticleEffect[]>([]);
  const autoSelectionPerformedRef = useRef(false);
  const interactionStateRef = useRef({
    isDragging: false,
    dragStart: { x: 0, y: 0 },
    dragThreshold: 5,
    lastClickTime: 0,
    clickCoords: { x: 0, y: 0 },
    pendingClick: false,
    lastTouchDistance: 0,
    isMultiTouch: false,
    debugMode: process.env.NODE_ENV !== 'production',
    lastHoveredNodeId: null as string | null,
    renderNeeded: false
  });
  
  // Debug logger function
  const debugLog = useCallback((message: string, ...args: any[]) => {
    if (interactionStateRef.current.debugMode) {
      console.log(`[ConstellationView] ${message}`, ...args);
    }
  }, []);

  // ========= LOCAL COMPONENT STATE =========
  const [activeNode, setActiveNode] = useState<ConceptNode | null>(null);
  const [selectedNode, setSelectedNode] = useState<ConceptNode | null>(null);
  const [pendingConnection, setPendingConnection] = useState<string | null>(null);
  const [journalVisible, setJournalVisible] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(0.8);
  const [cameraPosition, setCameraPosition] = useState({ x: 0, y: 0 });
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [recentInsights, setRecentInsights] = useState<{conceptId: string, amount: number}[]>([]);
  
  // ========= STORE DATA ACCESS =========
  // Extract primitive counts for stable rendering
  const nodeCount = usePrimitiveStoreValue(
    useKnowledgeStore,
    (state: KnowledgeState) => state.nodes.length,
    0
  );
  
  const connectionCount = usePrimitiveStoreValue(
    useKnowledgeStore,
    (state: KnowledgeState) => state.connections.length,
    0
  );
  
  const totalMastery = usePrimitiveStoreValue(
    useKnowledgeStore,
    (state: KnowledgeState) => state.totalMastery,
    0
  );
  
  // Extract full objects using a safe pattern - use shallow equality to prevent excess re-renders
  const nodes = useKnowledgeStore(state => state.nodes);
  const connections = useKnowledgeStore(state => state.connections);
  const domainMastery = useKnowledgeStore(state => state.domainMastery);
  const newlyDiscovered = useKnowledgeStore(state => state.newlyDiscovered);
  const journalEntries = useKnowledgeStore(state => state.journalEntries);
  
  // Directly access needed store functions
  const storeActions = useMemo(() => ({
    createConnection: useKnowledgeStore.getState().createConnection,
    updateMastery: useKnowledgeStore.getState().updateMastery,
    resetNewlyDiscovered: useKnowledgeStore.getState().resetNewlyDiscovered
  }), []);

  // ========= DERIVED DATA =========
  // Filter for discovered nodes and connections - memoize to prevent recalculations
  const discoveredNodes = useMemo(() => 
    nodes.filter(node => node.discovered), 
  [nodes]);
  
  const discoveredConnections = useMemo(() => 
    connections.filter(conn => conn.discovered), 
  [connections]);

  // ========= RENDER SCHEDULING =========
  // Schedule next animation frame for rendering
  const scheduleRender = useCallback(() => {
    if (!isComponentMountedRef.current || animationFrameRef.current !== null) return;
    
    animationFrameRef.current = requestAnimationFrame(() => {
      animationFrameRef.current = null;
      
      if (!isComponentMountedRef.current) return;
      
      // Update particles
      if (particleEffectsRef.current.length > 0) {
        let particlesActive = false;
        
        // Process particles (using ref to avoid state updates)
        particleEffectsRef.current = particleEffectsRef.current
          .map(p => {
            const dx = p.targetX - p.x;
            const dy = p.targetY - p.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist > 5) {
              particlesActive = true;
              return { 
                ...p, 
                x: p.x + dx * 0.05, 
                y: p.y + dy * 0.05, 
                life: p.life - 1 
              };
            } else {
              return { ...p, life: p.life - 3 }; // Decay faster at target
            }
          })
          .filter(p => p.life > 0);
        
        if (particlesActive) {
          interactionStateRef.current.renderNeeded = true;
        }
      }
      
      // Render if needed
      if (interactionStateRef.current.renderNeeded) {
        renderCanvas();
        interactionStateRef.current.renderNeeded = false;
      }
      
      // Continue animation if needed
      if (particleEffectsRef.current.length > 0) {
        scheduleRender();
      }
    });
  }, []);

  // ========= DIMENSION MANAGEMENT =========
  // Initialize and update dimensions based on container size
  useEffect(() => {
    if (!isComponentMountedRef.current) return;
    
    const updateDimensions = () => {
      // In fullscreen mode, use the viewport dimensions
      if (fullscreen) {
        setDimensions({
          width: window.innerWidth,
          height: window.innerHeight
        });
        debugLog('Dimensions updated to fullscreen', { 
          width: window.innerWidth, 
          height: window.innerHeight 
        });
        return;
      }
      
      // For non-fullscreen, use container or provided dimensions
      if (!containerRef.current?.parentElement) return;
      
      const containerWidth = width || containerRef.current.parentElement.clientWidth || 800;
      const containerHeight = height || containerRef.current.parentElement.clientHeight || 600;
      const padding = 24;
      
      setDimensions({
        width: Math.max(800, containerWidth - padding * 2),
        height: Math.max(600, containerHeight - padding * 2)
      });
      
      debugLog('Dimensions updated', { width: containerWidth, height: containerHeight });
    };
    
    updateDimensions();
    
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, [fullscreen, width, height, debugLog]);

  // ========= LIFECYCLE MANAGEMENT =========
  // Component mount/unmount tracking
  useEffect(() => {
    debugLog('Component mounted');
    isComponentMountedRef.current = true;
    autoSelectionPerformedRef.current = false;
    
    // Initialize images on client-side only
    if (typeof window !== 'undefined') {
      // Add extra debugging for image loading
      console.log('Checking for star image file...');
      
      // Check if the file exists by creating a test image
      const testImage = new Image();
      testImage.onload = () => console.log('✅ Star image exists at /icons/star.png');
      testImage.onerror = () => console.error('❌ Star image not found at /icons/star.png - check file path');
      testImage.src = '/icons/star.png';
      
      // Initialize all images
      initializeImages();
    }
    
    return () => {
      debugLog('Component unmounting');
      isComponentMountedRef.current = false;
      
      // Cancel any pending animation frames
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [debugLog]);

  // ========= COORDINATION UPDATES =========
  // Auto-select node only when needed
  useEffect(() => {
    if (!isComponentMountedRef.current || selectedNode || autoSelectionPerformedRef.current) return;
    
    const nodesToFocus = [...activeNodes, ...newlyDiscovered];
    if (nodesToFocus.length === 0) return;
    
    const nodeToFocus = nodes.find(n => n.discovered && nodesToFocus.includes(n.id));
    if (nodeToFocus) {
      debugLog('Auto-selecting highlighted node', nodeToFocus.id);
      autoSelectionPerformedRef.current = true;
      setSelectedNode(nodeToFocus);
    }
  }, [nodes, activeNodes, newlyDiscovered, selectedNode, debugLog]);
  
  // Reset autoSelection flag when selected node changes
  useEffect(() => {
    if (selectedNode === null) {
      autoSelectionPerformedRef.current = false;
    }
  }, [selectedNode]);

  // Highlight active nodes with particle effects - separated from node selection logic
  useEffect(() => {
    if (!isComponentMountedRef.current || nodes.length === 0) return;

    const nodesToHighlight = [...activeNodes, ...newlyDiscovered];
    if (nodesToHighlight.length === 0) return;
    
    debugLog('Highlighting nodes', nodesToHighlight);

    // Generate particle effects for highlighted nodes
    const newParticles: ParticleEffect[] = [];
    
    nodesToHighlight.forEach(nodeId => {
      const node = nodes.find(n => n.id === nodeId);
      if (node?.position) {
        for (let i = 0; i < 15; i++) {
          const angle = Math.random() * Math.PI * 2;
          const distance = Math.random() * 100 + 50;
          const color = DOMAIN_COLORS[node.domain] || DOMAIN_COLORS.general;
          
          newParticles.push({
            id: `particle-${nodeId}-${i}-${Date.now()}`,
            x: node.position.x + Math.cos(angle) * distance,
            y: node.position.y + Math.sin(angle) * distance,
            targetX: node.position.x,
            targetY: node.position.y,
            color: color,
            size: Math.random() * 3 + 1,
            life: 100,
            maxLife: 100
          });
        }
      }
    });

    if (newParticles.length > 0) {
      // Update particle effects and request render
      particleEffectsRef.current = [...particleEffectsRef.current, ...newParticles];
      interactionStateRef.current.renderNeeded = true;
      scheduleRender();
      
      // Dispatch event for externally activated nodes
      if (activeNodes.length > 0) {
        safeDispatch(
          GameEventType.UI_NODE_HIGHLIGHTED, 
          { nodeIds: activeNodes }, 
          'constellation'
        );
      }
    }
  }, [activeNodes, newlyDiscovered, nodes, scheduleRender, debugLog]);

  // Track recent insights for Journal Overlay
  useEffect(() => {
    if (!isComponentMountedRef.current) return;
    
    if (journalEntries.length > 0) {
      const recent = journalEntries
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 5)
        .map(entry => ({ conceptId: entry.conceptId, amount: entry.masteryGained }));
      
      setRecentInsights(recent);
    } else {
      // Placeholder if no entries
      setRecentInsights([
        { conceptId: 'electron-equilibrium', amount: 15 },
        { conceptId: 'radiation-safety', amount: 30 }
      ]);
    }
  }, [journalEntries]);

  // ========= SCENE COORDINATE CALCULATIONS =========
  // Calculate scene coordinates from screen coordinates
  const getSceneCoordinates = useCallback((clientX: number, clientY: number) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const canvasX = (clientX - rect.left);
    const canvasY = (clientY - rect.top);
    
    // Transform screen coordinates to scene coordinates with zoom and camera
    const sceneX = (canvasX - (canvas.width / 2 + cameraPosition.x)) / zoomLevel + canvas.width / 2;
    const sceneY = (canvasY - (canvas.height / 2 + cameraPosition.y)) / zoomLevel + canvas.height / 2;
    
    return { x: sceneX, y: sceneY };
  }, [canvasRef, cameraPosition, zoomLevel]);

  // Find node at given scene coordinates
  const findNodeAtCoordinates = useCallback((sceneX: number, sceneY: number): ConceptNode | null => {
    if (!discoveredNodes.length) return null;
    
    // Find node under cursor using hit detection
    return discoveredNodes.find(node => {
      if (!node.position) return false;
      
      // Size based on mastery level
      const baseSize = 10 + (node.mastery / 100) * 10;
      
      // Calculate distance to node center
      const distance = Math.sqrt(
        Math.pow(node.position.x - sceneX, 2) +
        Math.pow(node.position.y - sceneY, 2)
      );
      
      // Hit detection with slight padding for easier selection
      return distance <= baseSize + 5;
    }) || null;
  }, [discoveredNodes]);

  // ========= CURSOR MANAGEMENT =========
  // Update cursor style via direct DOM manipulation
  const updateCursor = useCallback((style: 'pointer' | 'grab' | 'grabbing' | 'default') => {
    if (!canvasRef.current || !isComponentMountedRef.current) return;
    canvasRef.current.style.cursor = style;
  }, [canvasRef]);

  // ========= RENDERING & ANIMATION =========
  // Render canvas with current state
  const renderCanvas = useCallback(() => {
    if (!canvasRef.current || !isComponentMountedRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Disable image smoothing for pixel-perfect rendering
    ctx.imageSmoothingEnabled = false;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Apply transformations
    ctx.save();
    ctx.translate(canvas.width / 2 + cameraPosition.x, canvas.height / 2 + cameraPosition.y);
    ctx.scale(zoomLevel, zoomLevel);
    ctx.translate(-canvas.width / 2, -canvas.height / 2);

    // Call drawing utilities
    drawStarryBackground(ctx, canvas.width, canvas.height);
    drawConnections(ctx, discoveredConnections, discoveredNodes, selectedNode, pendingConnection);
    drawNodes(ctx, discoveredNodes, activeNode, selectedNode, pendingConnection, activeNodes, newlyDiscovered, showLabels);
    drawPendingConnection(ctx, discoveredNodes, pendingConnection, activeNode);
    drawParticles(ctx, particleEffectsRef.current);

    // Debug overlay in development
    if (process.env.NODE_ENV !== 'production' && activeNode) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.fillText(`Hover: ${activeNode.id}`, 10, 20);
    }

    // Restore transformations
    ctx.restore();
  }, [
    canvasRef,
    discoveredNodes, 
    discoveredConnections, 
    activeNode, 
    selectedNode, 
    pendingConnection,
    activeNodes, 
    newlyDiscovered, 
    zoomLevel, 
    cameraPosition, 
    showLabels,
  ]);

  // Initial render and dimension changes
  useEffect(() => {
    if (!isComponentMountedRef.current) return;
    
    // Just mark that rendering is needed and schedule once
    interactionStateRef.current.renderNeeded = true;
    scheduleRender();
    
    // Don't include scheduleRender in dependencies to avoid cycles
  }, [
    dimensions.width, 
    dimensions.height
  ]);

  // ========= CONNECTION CREATION =========
  // Create particles for connection visualization
  const createConnectionParticles = useStableCallback((
    sourceNode: ConceptNode, 
    targetNode: ConceptNode
  ) => {
    if (!sourceNode.position || !targetNode.position || !isComponentMountedRef.current) return;
    
    // Calculate midpoint for particle effect
    const midX = (sourceNode.position.x + targetNode.position.x) / 2;
    const midY = (sourceNode.position.y + targetNode.position.y) / 2;
    
    // Create particles for connection effect
    const newParticles: ParticleEffect[] = [];
    for (let i = 0; i < 20; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * 30;
      const startDistance = 5;
      
      newParticles.push({
        id: `connection-particle-${i}-${Date.now()}`,
        x: midX + Math.cos(angle) * startDistance,
        y: midY + Math.sin(angle) * startDistance,
        targetX: midX + Math.cos(angle) * distance,
        targetY: midY + Math.sin(angle) * distance,
        color: '#FFFFFF',
        size: Math.random() * 3 + 1,
        life: 50,
        maxLife: 50
      });
    }
    
    // Update particles and request render
    particleEffectsRef.current = [...particleEffectsRef.current, ...newParticles];
    interactionStateRef.current.renderNeeded = true;
    
    // Schedule the render directly with requestAnimationFrame instead of using scheduleRender
    // to avoid circular dependencies
    if (animationFrameRef.current === null) {
      animationFrameRef.current = requestAnimationFrame(() => {
        animationFrameRef.current = null;
        if (isComponentMountedRef.current) {
          scheduleRender();
        }
      });
    }
  });

  // Primary node interaction handler (separated for reuse)
  const handleNodeInteraction = useStableCallback((clientX: number, clientY: number) => {
    if (!interactive || !isComponentMountedRef.current) return;
    
    try {
      // Get scene coordinates for hit testing
      const { x: sceneX, y: sceneY } = getSceneCoordinates(clientX, clientY);
      const clickedNode = findNodeAtCoordinates(sceneX, sceneY);
      
      // Log the interaction attempt
      debugLog('Node interaction', { 
        sceneCoords: { x: sceneX, y: sceneY },
        clickedNode: clickedNode?.id || 'none',
        pendingConnection,
        selectedNode: selectedNode?.id || 'none'
      });
      
      // Skip if no node clicked
      if (!clickedNode) {
        // Clear selection if clicking empty space
        if (selectedNode) {
          setSelectedNode(null);
          safeDispatch(
            GameEventType.UI_NODE_SELECTION_CLEARED, 
            {}, 
            'constellation'
          );
        }
        return;
      }
      
      // Handle connection creation if we have a pending connection
      if (pendingConnection && clickedNode.id !== pendingConnection) {
        // Don't allow self-connections
        const sourceNode = discoveredNodes.find(n => n.id === pendingConnection);
        
        if (sourceNode) {
          // Try to create the connection
          debugLog('Creating connection', { source: sourceNode.id, target: clickedNode.id });
          
          storeActions.createConnection(sourceNode.id, clickedNode.id);
          setPendingConnection(null);
          
          // Visual feedback
          createConnectionParticles(sourceNode, clickedNode);
          
          // Notify about connection creation
          safeDispatch(
            GameEventType.UI_CONNECTION_STARTED, 
            { 
              sourceId: sourceNode.id, 
              targetId: clickedNode.id 
            }, 
            'constellation'
          );
          
          // Increment mastery when making connections
          storeActions.updateMastery(sourceNode.id, 5);
          storeActions.updateMastery(clickedNode.id, 5);
          
          return;
        }
      }
      
      // Default node selection behavior
      setSelectedNode(clickedNode);
      
      // Clear pending connection if selecting a different node
      if (pendingConnection && clickedNode.id !== pendingConnection) {
        setPendingConnection(null);
      }
      
      // Notify about node selection
      safeDispatch(
        GameEventType.UI_NODE_SELECTED, 
        { nodeId: clickedNode.id }, 
        'constellation'
      );
    } catch (err) {
      console.error('Error in node interaction logic:', err);
    }
  });

  // ========= INTERACTION HANDLERS =========
  // Mouse move handler
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !interactive || !isComponentMountedRef.current) return;
    
    const state = interactionStateRef.current;
    
    // Handle dragging
    if (state.isDragging) {
      const dx = e.clientX - state.dragStart.x;
      const dy = e.clientY - state.dragStart.y;
      
      setCameraPosition(prev => ({ x: prev.x + dx, y: prev.y + dy }));
      state.dragStart = { x: e.clientX, y: e.clientY };
      
      updateCursor('grabbing');
      return;
    }
    
    // Find node under cursor
    const { x: sceneX, y: sceneY } = getSceneCoordinates(e.clientX, e.clientY);
    const hoveredNode = findNodeAtCoordinates(sceneX, sceneY);
    
    // Track if hovering changed, dispatch event only on change
    if (hoveredNode?.id !== state.lastHoveredNodeId) {
      state.lastHoveredNodeId = hoveredNode?.id || null;
      
      // Update hover state if changed
      if (hoveredNode !== activeNode) {
        setActiveNode(hoveredNode);
        
        // Dispatch hover event
        if (hoveredNode) {
          safeDispatch(
            GameEventType.UI_NODE_HOVERED, 
            { nodeId: hoveredNode.id }, 
            'constellation'
          );
        }
      }
    }
    
    // Update cursor via DOM
    updateCursor(hoveredNode ? 'pointer' : 'grab');
  }, [
    canvasRef,
    interactive,
    setCameraPosition,
    getSceneCoordinates,
    findNodeAtCoordinates,
    activeNode,
    setActiveNode,
    updateCursor
  ]);

  // Mouse down handler
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !interactive || !isComponentMountedRef.current) return;
    
    const state = interactionStateRef.current;
    
    if (e.button === 0) { // Left click
      if (!activeNode) {
        // Start panning if not over a node
        state.isDragging = true;
        state.dragStart = { x: e.clientX, y: e.clientY };
        updateCursor('grabbing');
      }
      
      // Record click position for later processing in mouseup
      state.clickCoords = { x: e.clientX, y: e.clientY };
      state.lastClickTime = Date.now();
    } else if (e.button === 1 || e.button === 2) { // Middle or right click
      e.preventDefault();
      // Always allow panning with middle/right button
      state.isDragging = true;
      state.dragStart = { x: e.clientX, y: e.clientY };
      updateCursor('grabbing');
    }
  }, [
    canvasRef,
    interactive,
    activeNode,
    updateCursor,
  ]);

  // Mouse up handler with built-in click detection
  const handleMouseUp = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !interactive || !isComponentMountedRef.current) return;
    
    const state = interactionStateRef.current;
    const wasDragging = state.isDragging;
    
    // Reset drag state
    state.isDragging = false;
    
    // Only process as click if left button and not dragging significantly
    if (e.button === 0 && !wasDragging) {
      // Calculate distance moved since mousedown
      const dx = e.clientX - state.clickCoords.x;
      const dy = e.clientY - state.clickCoords.y;
      const moveDistance = Math.sqrt(dx * dx + dy * dy);
      
      // If moved less than threshold, count as a click
      if (moveDistance < state.dragThreshold) {
        debugLog('Click detected', { 
          coords: { x: e.clientX, y: e.clientY },
          moveDistance
        });
        
        // Call our click handler with original coordinates
        handleNodeInteraction(e.clientX, e.clientY);
      }
    }
    
    // Update cursor based on current hover state
    updateCursor(activeNode ? 'pointer' : 'grab');
  }, [
    canvasRef,
    interactive,
    activeNode,
    updateCursor,
    handleNodeInteraction
  ]);

  // Direct click handler (backup for browsers where mouseup/down doesn't work properly)
  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    // Prevent double-processing if we already handled this in mouseUp
    const now = Date.now();
    const state = interactionStateRef.current;
    const timeSinceLastClick = now - state.lastClickTime;
    
    // Skip if we just processed this click in mouseUp (within 50ms)
    if (timeSinceLastClick < 50) {
      debugLog('Skipping redundant click', { timeSinceLastClick });
      return;
    }
    
    // Update last click time
    state.lastClickTime = now;
    
    // Process the click directly
    try {
      if (!state.isDragging) {
        handleNodeInteraction(e.clientX, e.clientY);
      }
    } catch (err) {
      console.error('Error handling constellation click:', err);
      // Recover from error state
      state.isDragging = false;
      updateCursor('grab');
    }
  }, [handleNodeInteraction, updateCursor]);

  // Wheel handler for zooming
  const handleWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    if (!interactive || !isComponentMountedRef.current) return;
    
    e.preventDefault();
    
    // Calculate zoom change
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    
    // Update zoom within bounds
    setZoomLevel(prev => Math.max(0.5, Math.min(2, prev + delta)));
    
    // Request render update
    interactionStateRef.current.renderNeeded = true;
    scheduleRender();
  }, [
    interactive,
    setZoomLevel,
    scheduleRender
  ]);

  // Mouse leave handler
  const handleMouseLeave = useCallback(() => {
    if (!isComponentMountedRef.current) return;
    
    const state = interactionStateRef.current;
    
    // Reset interaction states
    state.isDragging = false;
    state.lastHoveredNodeId = null;
    
    // Clear active node
    if (activeNode) {
      setActiveNode(null);
    }
  }, [activeNode, setActiveNode]);

  // Close handler with cleanup
  const handleClose = useCallback(() => {
    if (!isComponentMountedRef.current || !onClose) return;
    
    // Clean up state
    setSelectedNode(null);
    setActiveNode(null);
    setPendingConnection(null);
    
    // Reset highlights
    storeActions.resetNewlyDiscovered(); 
    
    // Call provided onClose
    onClose();
  }, [onClose, storeActions]);

  // ========= COMPONENT RENDER =========
  return (
    <div
      ref={containerRef}
      className="relative bg-black pixel-borders"
      style={{
        width: fullscreen ? '100vw' : dimensions.width,
        height: fullscreen ? '100vh' : dimensions.height,
        maxWidth: '100%',
        maxHeight: '100%',
        overflow: 'hidden'
      }}
      data-component="constellation-view"
      data-interactive={interactive.toString()}
    >
      {/* Main Canvas */}
      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        className="w-full h-full object-cover"
        // Attach interaction handlers
        onMouseMove={handleMouseMove}
        onClick={handleClick}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onWheel={handleWheel}
        onContextMenu={(e) => e.preventDefault()}
        data-element="constellation-canvas"
      />

      {/* UI Sub-components */}
      <ConstellationInfoPanel
        discoveredNodes={discoveredNodes}
        totalNodes={nodeCount}
        discoveredConnections={discoveredConnections}
        totalMastery={totalMastery}
      />

      <ConstellationLegend domainMastery={domainMastery} />

      <ConstellationControls
        zoomLevel={zoomLevel}
        setZoomLevel={setZoomLevel}
        setCameraPosition={setCameraPosition}
      />

      <ConstellationActions
        enableJournal={enableJournal}
        setJournalVisible={setJournalVisible}
        setShowHelp={setShowHelp}
        onClose={handleClose}
      />

      {selectedNode && (
        <SelectedNodePanel
          selectedNode={selectedNode}
          masteryLevel={selectedNode.mastery || 0}
          onConnect={() => setPendingConnection(selectedNode.id)}
          canConnect={pendingConnection !== selectedNode.id}
        />
      )}

      {interactive && selectedNode && pendingConnection && (
         <ConnectionSuggestionsPanel
           suggestions={discoveredNodes.filter(node => 
             node.id !== selectedNode.id && 
             node.id !== pendingConnection &&
             !discoveredConnections.some(conn => 
               (conn.source === pendingConnection && conn.target === node.id) ||
               (conn.source === node.id && conn.target === pendingConnection)
             )
           )}
           onSelect={(nodeId) => {
             const targetNode = discoveredNodes.find(n => n.id === nodeId);
             if (targetNode && pendingConnection) {
               const sourceNode = discoveredNodes.find(n => n.id === pendingConnection);
               if (sourceNode) {
                 storeActions.createConnection(pendingConnection, nodeId);
                 createConnectionParticles(sourceNode, targetNode);
                 setPendingConnection(null);
               }
             }
           }}
           pendingConnection={pendingConnection}
         />
       )}

      {/* Render Overlays */}
      <JournalOverlay
        journalVisible={journalVisible}
        setJournalVisible={setJournalVisible}
        discoveredNodes={discoveredNodes}
        recentInsights={recentInsights}
      />

      <HelpOverlay
        showHelp={showHelp}
        setShowHelp={setShowHelp}
      />

      {/* Development debug overlay */}
      {process.env.NODE_ENV !== 'production' && (
        <div className="absolute bottom-1 left-1 bg-black/70 text-white text-xs p-1 rounded">
          Nodes: {discoveredNodes.length}/{nodeCount} | 
          Active: {activeNode?.id || 'none'} | 
          Selected: {selectedNode?.id || 'none'} |
          Pending: {pendingConnection || 'none'}
        </div>
      )}
    </div>
  );
}