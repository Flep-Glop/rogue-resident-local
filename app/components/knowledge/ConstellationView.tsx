// app/components/knowledge/ConstellationView.tsx
'use client';
/**
 * Enhanced ConstellationView with improved visualization and debug features
 * 
 * Changes from original:
 * 1. Support for hybrid orbital-quadrant layout
 * 2. Enhanced particle system with shooting stars
 * 3. Connection to debug visualization controls
 * 4. Improved interaction patterns following Chamber Pattern
 * 5. Integration with the comprehensive medical physics concept data
 */
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { usePrimitiveStoreValue, useStableCallback } from '../../core/utils/storeHooks';
import { useKnowledgeStore, ConceptNode, ConceptConnection, KnowledgeState } from '../../store/knowledgeStore';
import { DOMAIN_COLORS, DOMAIN_COLORS_LIGHT } from '../../core/themeConstants';
import { GameEventType } from '@/app/core/events/EventTypes';
import { safeDispatch, useEventBus, GameEvent } from '@/app/core/events/CentralEventBus';

// Import the enhanced particle system
import {
  ParticleEffect,
  ShootingStarParticle,
  updateParticles,
  drawParticles,
  createConnectionParticles,
  createShootingStar,
  createRandomShootingStars,
  generateVisualizationParticles
} from './ConstellationParticleSystem';

// Import visualization control
import constellationVisualizationControl, { ConstellationDebugOptions } from './ConstellationVisualizationControl';

// Import pattern detection system
import { detectPatterns, ConstellationPattern } from './ConstellationPatternSystem';

// Import drawing utilities
import {
  drawStarryBackground,
  drawConnections,
  drawNodes,
  drawPendingConnection,
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
  debugOptions?: ConstellationDebugOptions; // For debug visualization controls
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
  showLabels = true,
  debugOptions
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
  const [shootingStarReward, setShootingStarReward] = useState<{
    message: string;
    type: string;
    value: number;
    active: boolean;
  } | null>(null);
  const [detectedPatterns, setDetectedPatterns] = useState<ConstellationPattern[]>([]);
  
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
  const { nodes, connections } = useKnowledgeStore();
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
      
      // Update particles using the enhanced particle system
      if (particleEffectsRef.current.length > 0) {
        particleEffectsRef.current = updateParticles(particleEffectsRef.current);
        interactionStateRef.current.renderNeeded = true;
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
      // Always use viewport dimensions for fullscreen mode
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      });
      
      // Update canvas dimensions directly
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
      }
      
      debugLog('Dimensions updated', { 
        width: window.innerWidth, 
        height: window.innerHeight 
      });
      
      // Force a render update
      interactionStateRef.current.renderNeeded = true;
      scheduleRender();
    };
    
    // Update dimensions initially and when component mounts
    updateDimensions();
    
    // Update dimensions on window resize
    window.addEventListener('resize', updateDimensions);
    
    return () => window.removeEventListener('resize', updateDimensions);
  }, [debugLog, scheduleRender]);

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

  // Center all stars on screen after layout and whenever window resizes
  useEffect(() => {
    if (!isComponentMountedRef.current || discoveredNodes.length === 0) return;
    
    // Calculate the bounding box of all nodes
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    
    discoveredNodes.forEach(node => {
      if (!node.position) return;
      
      minX = Math.min(minX, node.position.x);
      minY = Math.min(minY, node.position.y);
      maxX = Math.max(maxX, node.position.x);
      maxY = Math.max(maxY, node.position.y);
    });
    
    // Calculate the center of the bounding box
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    
    // Center camera on the stars
    setCameraPosition({ x: -centerX, y: -centerY });
    
    debugLog('Centered constellation on screen', { centerX, centerY });
    
    // Force a render update
    interactionStateRef.current.renderNeeded = true;
    scheduleRender();
  }, [discoveredNodes, dimensions, debugLog, scheduleRender]);

  // Handler for debug visualization features
  const handleDebugVisualization = useCallback((options: ConstellationDebugOptions) => {
    if (!isComponentMountedRef.current) return;
    
    debugLog('Debug visualization options updated', options);
    
    // Process the debug visualization options
    const { showAllDiscovered, masteryLevel, showAllConnections, showShootingStars } = options;
    
    // Clear existing debug visualization particles to prevent accumulation
    particleEffectsRef.current = particleEffectsRef.current.filter(p => 
      p.type !== 'debug-discovery' && 
      p.type !== 'debug-mastery' && 
      p.type !== 'debug-connection'
    );
    
    // Only process if we have debug options enabled
    if (showAllDiscovered || masteryLevel !== undefined || showAllConnections || showShootingStars) {
      // Create debug visualization particles
      if (showAllDiscovered) {
        // Generate discovery particles
        const discoveryParticles = generateVisualizationParticles(nodes, 'discovery', 30);
        particleEffectsRef.current = [...particleEffectsRef.current, ...discoveryParticles];
      }
      
      if (masteryLevel !== undefined && masteryLevel > 0) {
        // Generate mastery particles - limit quantity based on mastery level
        const particleCount = Math.min(30 + masteryLevel, 150);
        const masteryParticles = generateVisualizationParticles(nodes, 'mastery', particleCount);
        particleEffectsRef.current = [...particleEffectsRef.current, ...masteryParticles];
        
        // Apply mastery styling to nodes if needed
        // This directly updates the rendering without modifying the store
        debugLog(`Applying mastery level styling: ${masteryLevel}%`);
      }
      
      if (showAllConnections) {
        // Generate connection particles
        const connectionParticles = generateVisualizationParticles(nodes, 'connection', 50);
        particleEffectsRef.current = [...particleEffectsRef.current, ...connectionParticles];
      }
      
      if (showShootingStars) {
        // Generate random shooting stars - limit to a reasonable number
        const existingShootingStars = particleEffectsRef.current.filter(p => p.type === 'shootingStar').length;
        if (existingShootingStars < 5) {
          const shootingStars = createRandomShootingStars(dimensions.width, dimensions.height, 2);
          particleEffectsRef.current = [...particleEffectsRef.current, ...shootingStars];
        }
      }
      
      // Request render to show particles
      interactionStateRef.current.renderNeeded = true;
      scheduleRender();
    }
  }, [nodes, dimensions.width, dimensions.height, scheduleRender, debugLog]);

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
      testImage.onload = () => {
        console.log('✅ Star image exists at /icons/star.png');
        console.log(`Star image dimensions: ${testImage.width}x${testImage.height}`);
        
        // Create a temporary canvas to check if the image has transparency
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        if (tempCtx) {
          tempCanvas.width = testImage.width;
          tempCanvas.height = testImage.height;
          tempCtx.drawImage(testImage, 0, 0);
          
          // Check for transparency by sampling the corners
          let hasTransparency = false;
          [
            tempCtx.getImageData(0, 0, 1, 1),
            tempCtx.getImageData(testImage.width-1, 0, 1, 1),
            tempCtx.getImageData(0, testImage.height-1, 1, 1),
            tempCtx.getImageData(testImage.width-1, testImage.height-1, 1, 1)
          ].forEach(pixel => {
            if (pixel.data[3] < 255) hasTransparency = true;
          });
          
          console.log(`Star image has transparency: ${hasTransparency}`);
        }
        
        // Initialize all images only after verifying the star image exists
        initializeImages();
        
        // Force a render update to ensure stars are displayed
        interactionStateRef.current.renderNeeded = true;
        scheduleRender();
      };
      testImage.onerror = () => {
        console.error('❌ Star image not found at /icons/star.png - check file path');
        // Try alternate path as fallback
        console.log('Trying fallback path /public/icons/star.png');
        const fallbackImage = new Image();
        fallbackImage.onload = () => {
          console.log('✅ Star image found at fallback location');
          initializeImages();
          interactionStateRef.current.renderNeeded = true;
          scheduleRender();
        };
        fallbackImage.onerror = () => {
          console.error('❌ All star image paths failed, using fallback circles');
          // Still initialize other images
          initializeImages();
          interactionStateRef.current.renderNeeded = true;
          scheduleRender();
        };
        fallbackImage.src = '/public/icons/star.png';
      };
      testImage.src = '/icons/star.png';
    }
    
    // Subscribe to visualization control events
    const unsubscribe = constellationVisualizationControl.subscribeToAll(handleDebugVisualization);
    
    // Add event listeners for critical events to avoid console warnings
    const eventHandlers = {
      [GameEventType.TRANSITION_TO_NIGHT_COMPLETED]: (event: GameEvent<any>) => {
        debugLog('Night transition completed, updating constellation view');
        // Request a render update when night transition completes
        interactionStateRef.current.renderNeeded = true;
        scheduleRender();
      },
      [GameEventType.UI_NODE_SELECTED]: (event: GameEvent<{nodeId: string}>) => {
        debugLog('Node selected via event', event.payload);
        // Find the node and select it if it exists and is discovered
        const node = nodes.find(n => n.id === event.payload.nodeId && n.discovered);
        if (node) {
          setSelectedNode(node);
        }
      }
    };
    
    // Register event handlers
    const eventUnsubscribes = Object.entries(eventHandlers).map(([eventType, handler]) => {
      return useEventBus.getState().subscribe(eventType as GameEventType, handler);
    });
    
    return () => {
      debugLog('Component unmounting');
      isComponentMountedRef.current = false;
      
      // Cancel any pending animation frames
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      
      // Unsubscribe from visualization control
      unsubscribe();
      
      // Unsubscribe from all event handlers
      eventUnsubscribes.forEach(unsubFn => unsubFn());
    };
  }, [debugLog, handleDebugVisualization, nodes, scheduleRender]);

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
          const color = DOMAIN_COLORS[node.domain] || '#ffffff';
          
          newParticles.push({
            id: `particle-${nodeId}-${i}-${Date.now()}`,
            type: 'discovery',
            conceptId: node.id,
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

  // Effect to process debugOptions prop when it changes
  useEffect(() => {
    if (debugOptions && isComponentMountedRef.current) {
      handleDebugVisualization(debugOptions);
    }
  }, [debugOptions, handleDebugVisualization]);

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
  const createConnectionParticlesEffect = useStableCallback((
    sourceNode: ConceptNode, 
    targetNode: ConceptNode
  ) => {
    if (!sourceNode.position || !targetNode.position || !isComponentMountedRef.current) return;
    
    // Use the function from the enhanced particle system
    const newParticles = createConnectionParticles(sourceNode, targetNode);
    
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

  // Function to handle shooting star clicks
  const handleShootingStarClick = useCallback((star: ShootingStarParticle) => {
    if (!star.reward || star.wasClicked) return;
    
    debugLog('Shooting star clicked with reward:', star.reward);
    
    // Mark the star as clicked
    star.wasClicked = true;
    
    // Process the reward
    const reward = star.reward; // Create local reference to guarantee it's defined
    
    switch (reward.type) {
      case 'sp':
        // Add star points
        useKnowledgeStore.getState().addStarPoints(reward.value, 'shooting-star');
        break;
      case 'mastery':
        // Find a random discovered node to boost mastery
        const nodesForMastery = discoveredNodes.filter(n => n.mastery < 100);
        if (nodesForMastery.length > 0) {
          const randomNode = nodesForMastery[Math.floor(Math.random() * nodesForMastery.length)];
          useKnowledgeStore.getState().updateMastery(randomNode.id, reward.value);
          // Update the reward message to include the affected node
          reward.message = `${reward.value}% Mastery gained for ${randomNode.name}!`;
          reward.targetId = randomNode.id;
        }
        break;
      case 'discovery':
        // Find a random undiscovered node
        const undiscoveredNodes = nodes.filter(n => !n.discovered);
        if (undiscoveredNodes.length > 0) {
          const randomNode = undiscoveredNodes[Math.floor(Math.random() * undiscoveredNodes.length)];
          useKnowledgeStore.getState().discoverConcept(randomNode.id);
          // Update the message to include the discovered node
          reward.message = `New concept discovered: ${randomNode.name}!`;
          reward.targetId = randomNode.id;
        }
        break;
    }
    
    // Show reward notification
    setShootingStarReward({
      message: reward.message,
      type: reward.type,
      value: reward.value,
      active: true
    });
    
    // Hide notification after a delay
    setTimeout(() => {
      setShootingStarReward(prev => prev ? { ...prev, active: false } : null);
    }, 3000);
    
    // Add visual effect for the reward
    if (reward.targetId) {
      const targetNode = nodes.find(n => n.id === reward.targetId);
      if (targetNode?.position) {
        // Create particles flowing to the target node
        const rewardParticles: ParticleEffect[] = [];
        for (let i = 0; i < 20; i++) {
          rewardParticles.push({
            id: `reward-${star.id}-${i}`,
            type: 'reward',
            x: star.x,
            y: star.y,
            targetX: targetNode.position.x,
            targetY: targetNode.position.y,
            color: DOMAIN_COLORS[targetNode.domain],
            size: Math.random() * 3 + 1,
            life: 60,
            maxLife: 60
          });
        }
        particleEffectsRef.current = [...particleEffectsRef.current, ...rewardParticles];
      }
    }
    
    // Request render update
    interactionStateRef.current.renderNeeded = true;
    scheduleRender();
  }, [nodes, discoveredNodes, debugLog, scheduleRender]);

  // Enhanced node interaction handler with shooting star detection
  const handleNodeInteraction = useStableCallback((clientX: number, clientY: number) => {
    if (!interactive || !isComponentMountedRef.current) return;
    
    try {
      // Get scene coordinates for hit testing
      const { x: sceneX, y: sceneY } = getSceneCoordinates(clientX, clientY);
      
      // First check if we clicked a shooting star
      const shootingStar = particleEffectsRef.current.find(p => 
        p.type === 'shootingStar' && 
        !((p as ShootingStarParticle).wasClicked) &&
        Math.sqrt(Math.pow(p.x - sceneX, 2) + Math.pow(p.y - sceneY, 2)) < 20
      ) as ShootingStarParticle | undefined;
      
      if (shootingStar) {
        handleShootingStarClick(shootingStar);
        return;
      }
      
      // Original node interaction logic
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
          createConnectionParticlesEffect(sourceNode, clickedNode);
          
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

  // Add an effect to manually add a passive: false wheel event listener
  useEffect(() => {
    // Only add listeners if the component is mounted and canvas exists
    if (!canvasRef.current || !isComponentMountedRef.current || !interactive) return;
    
    const canvas = canvasRef.current;
    
    // Add wheel event listener with passive: false to allow preventDefault
    const wheelHandler = (e: WheelEvent) => {
      if (!isComponentMountedRef.current) return;
      
      e.preventDefault();
      
      // Calculate zoom change
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      
      // Update zoom within bounds
      setZoomLevel(prev => Math.max(0.5, Math.min(2, prev + delta)));
      
      // Request render update
      interactionStateRef.current.renderNeeded = true;
      scheduleRender();
    };
    
    // Add event listener with passive: false
    canvas.addEventListener('wheel', wheelHandler, { passive: false });
    
    // Clean up event listener on unmount
    return () => {
      canvas.removeEventListener('wheel', wheelHandler);
    };
  }, [interactive, setZoomLevel, scheduleRender]);

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

  // Add helper function to visualize patterns
  const visualizePattern = useCallback((pattern: ConstellationPattern) => {
    if (!isComponentMountedRef.current) return;
    
    debugLog('Visualizing pattern:', pattern.name);
    
    // Find all nodes in this pattern
    const patternNodes = pattern.starIds
      .map(id => nodes.find(n => n.id === id))
      .filter(n => n?.position) as ConceptNode[];
    
    if (patternNodes.length < 2) return;
    
    // Create visual connection particles between all nodes in the pattern
    let newParticles: ParticleEffect[] = [];
    
    // Create line particles connecting nodes in a pattern-specific formation
    for (let i = 0; i < patternNodes.length; i++) {
      const source = patternNodes[i];
      
      // Connect to the next node in sequence (circular for all patterns)
      const target = patternNodes[(i + 1) % patternNodes.length];
      
      // Add extra visual effects
      if (source.position && target.position) {
        // Add connection particles
        const connectionParticles = createConnectionParticles(source, target);
        newParticles = [...newParticles, ...connectionParticles];
      }
    }
    
    // Add a shooting star to celebrate the pattern discovery
    const centerX = patternNodes.reduce((sum, n) => sum + (n.position?.x || 0), 0) / patternNodes.length;
    const centerY = patternNodes.reduce((sum, n) => sum + (n.position?.y || 0), 0) / patternNodes.length;
    
    // Create a shooting star that crosses near the pattern center
    const angle = Math.random() * Math.PI * 2;
    const distance = 200;
    const startX = centerX + Math.cos(angle) * distance;
    const startY = centerY + Math.sin(angle) * distance;
    
    // Create shooting star with SP reward
    const shootingStar = createShootingStar(startX, startY, angle + Math.PI, 5, 60, {
      type: 'sp',
      value: Number(pattern.reward.value) || 20,
      message: `Pattern Discovered: ${pattern.name} (+${pattern.reward.value} SP)`,
      targetId: patternNodes[0].id
    });
    
    newParticles.push(shootingStar);
    
    // Update particle effects and request render
    particleEffectsRef.current = [...particleEffectsRef.current, ...newParticles];
    interactionStateRef.current.renderNeeded = true;
    scheduleRender();
    
    // Show notification
    setShootingStarReward({
      message: `Pattern Discovered: ${pattern.name}!`,
      type: 'sp',
      value: Number(pattern.reward.value) || 20,
      active: true
    });
    
    // Hide notification after a delay
    setTimeout(() => {
      setShootingStarReward(prev => prev ? { ...prev, active: false } : null);
    }, 5000);
    
  }, [nodes, debugLog, scheduleRender]);

  // Add effect to detect patterns whenever connections change
  useEffect(() => {
    if (!isComponentMountedRef.current || !interactive) return;
    
    // Use detected pattern IDs to avoid redundant animations
    const knownPatternIds = new Set(detectedPatterns.map(p => p.id));
    
    // Run pattern detection
    const { newPatterns, allComplete } = detectPatterns(
      nodes, 
      connections, 
      knownPatternIds
    );
    
    // Update patterns state
    if (allComplete.length !== detectedPatterns.length) {
      setDetectedPatterns(allComplete);
    }
    
    // Visualize any newly discovered patterns
    if (newPatterns.length > 0) {
      debugLog('New patterns discovered:', newPatterns.map(p => p.name));
      
      // Visualize each new pattern (staggered for visual effect)
      newPatterns.forEach((pattern, index) => {
        setTimeout(() => {
          visualizePattern(pattern);
          
          // Award SP for pattern discovery
          useKnowledgeStore.getState().addStarPoints(
            Number(pattern.reward.value) || 20,
            `pattern-${pattern.id}`
          );
        }, index * 2000); // 2 second delay between pattern celebrations
      });
      
      // Emit pattern discovery event
      safeDispatch(
        GameEventType.KNOWLEDGE_GAINED, 
        { 
          patterns: newPatterns.map(p => p.id)
        }, 
        'constellation'
      );
    }
  }, [nodes, connections, detectedPatterns, interactive, visualizePattern, debugLog]);

  // ========= COMPONENT RENDER =========
  return (
    <div
      ref={containerRef}
      className="relative bg-black pixel-borders constellation-fullscreen"
      style={{
        width: '100vw',
        height: '100vh',
        maxWidth: '100vw',
        maxHeight: '100vh',
        margin: 0,
        padding: 0,
        overflow: 'hidden',
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 50
      }}
      data-component="constellation-view"
      data-interactive={interactive.toString()}
    >
      {/* Main Canvas */}
      <canvas
        ref={canvasRef}
        width={window.innerWidth}
        height={window.innerHeight}
        className="w-full h-full"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          display: 'block'
        }}
        // Attach interaction handlers
        onMouseMove={handleMouseMove}
        onClick={handleClick}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onContextMenu={(e) => e.preventDefault()}
        data-element="constellation-canvas"
      />

      {/* Shooting Star Reward Notification */}
      {shootingStarReward && shootingStarReward.active && (
        <div className="absolute top-1/4 left-1/2 transform -translate-x-1/2 -translate-y-1/2 
                       bg-black/80 text-white px-6 py-3 rounded-lg border border-yellow-500/50
                       animate-fadeIn">
          <div className="text-center">
            <div className="text-xl mb-1">
              {shootingStarReward.type === 'sp' && <span className="text-yellow-400">✦</span>}
              {shootingStarReward.type === 'mastery' && <span className="text-blue-400">★</span>}
              {shootingStarReward.type === 'discovery' && <span className="text-green-400">✧</span>}
            </div>
            <div className="font-bold">{shootingStarReward.message}</div>
          </div>
        </div>
      )}

      {/* UI Sub-components */}
      <ConstellationInfoPanel
        discoveredNodes={discoveredNodes}
        totalNodes={nodeCount}
        discoveredConnections={discoveredConnections}
        totalMastery={totalMastery}
        domainMastery={domainMastery}
      />

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