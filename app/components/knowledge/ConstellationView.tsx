// app/components/knowledge/ConstellationView.tsx
'use client';
/**
 * Enhanced ConstellationView with improved visualization using D3
 * 
 * Simplified version based on SimpleConstellationTest implementation
 */
import React, { useState, useEffect, useRef, useMemo, useCallback, startTransition } from 'react';
import useKnowledgeStore, { KnowledgeDomain } from '../../store/knowledgeStore';
import { DOMAIN_COLORS } from '../../core/themeConstants';
import { GameEventType } from '@/app/core/events/EventTypes';
import { safeDispatch, useEventBus } from '@/app/core/events/CentralEventBus';
import * as d3 from 'd3';
import { Connection, predefinedConnections } from '../../data/concepts/medical-physics-connections';

// Import visualization control
import { ConstellationDebugOptions } from './ConstellationVisualizationControl';

// Import pattern detection system
import { detectPatterns, PatternFormation } from './ConstellationPatternSystem';

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

interface Node {
  id: string;
  name: string;
  x: number;
  y: number;
  radius: number;
  domain: string;
  discovered: boolean;
  unlocked: boolean; // New property: whether the node is unlocked after discovery
  active: boolean;   // New property: whether the node is activated
  mastery: number;
  patterns: string[];
  isNewlyDiscovered?: boolean; // Track if node is newly discovered
  hasBeenViewed?: boolean;     // Track if newly discovered node has been viewed
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
  isPotentialConnection: boolean;
}

interface Link {
  source: string;
  target: string;
  strength: number;
  discovered: boolean;
  isActiveConnection?: boolean; // New property to indicate connections between active nodes
  patternIds: string[];
}

// Connection details interface
interface SelectedConnection {
  sourceId: string;
  targetId: string;
  sourceName: string;
  targetName: string;
  strength: number;
  patternIds: string[];
}

/**
 * Enhanced ConstellationView with D3 visualization
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
  // ========= REFS AND STATE =========
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isComponentMountedRef = useRef(true);
  
  // Local state
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [activePatternId, setActivePatternId] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [simulationNodes, setSimulationNodes] = useState<Node[]>([]);
  const [simulationLinks, setSimulationLinks] = useState<Link[]>([]);
  const [showHelp, setShowHelp] = useState(false);
  const [starPoints, setStarPoints] = useState<number>(50); // Default 50 SP
  const [viewedNodes, setViewedNodes] = useState<Set<string>>(new Set()); // Track nodes that have been viewed

  // State for selected connection
  const [selectedConnection, setSelectedConnection] = useState<SelectedConnection | null>(null);
  const [selectedConnectionDescription, setSelectedConnectionDescription] = useState<string>('');

  // ========= STORE ACCESS =========
  const { 
    nodes, 
    connections, 
    discoverConcept, 
    updateMastery, 
    createConnection,
    addStarPoints,
    starPoints: storeStarPoints,
    newlyDiscovered
  } = useKnowledgeStore();
  
  // Derived data - use React.useMemo to prevent recalculations on every render
  const discoveredNodes = React.useMemo(() => 
    nodes.filter(node => node.discovered), 
  [nodes]);
  
  const discoveredConnections = React.useMemo(() => 
    connections.filter(conn => conn.discovered), 
  [connections]);
  
  // Function to get color for a pattern
  const getPatternColor = (patternId: string): string => {
    const colorMap: Record<string, string> = {
      'alara-triangle': '#2ecc71',    // Green
      'treatment-chain': '#3498db',   // Blue
      'qa-circle': '#9b59b6',         // Purple
      'plan-optimization': '#e74c3c'  // Red
    };
    
    return colorMap[patternId] || '#f1c40f'; // Default yellow
  };

  // Function to get lighter version of pattern color (for glows)
  const getPatternGlowColor = (patternId: string): string => {
    const colorMap: Record<string, string> = {
      'alara-triangle': 'rgba(46, 204, 113, 0.5)',    // Green glow
      'treatment-chain': 'rgba(52, 152, 219, 0.5)',   // Blue glow
      'qa-circle': 'rgba(155, 89, 182, 0.5)',         // Purple glow
      'plan-optimization': 'rgba(231, 76, 60, 0.5)'   // Red glow
    };
    
    return colorMap[patternId] || 'rgba(241, 196, 15, 0.5)'; // Default yellow glow
  };
  
  // ========= DIMENSION MANAGEMENT =========
  useEffect(() => {
    if (!isComponentMountedRef.current) return;
    
    const updateDimensions = () => {
      // Always use viewport dimensions for fullscreen mode
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };
    
    // Update dimensions initially and when component mounts
    updateDimensions();
    
    // Update dimensions on window resize
    window.addEventListener('resize', updateDimensions);
    
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // ========= DATA PREPARATION =========
  // Prepare data for D3 simulation
  useEffect(() => {
    // Get pattern information for node classification
    const patterns = detectPatterns(nodes, connections, new Set()).allComplete;
    const patternNodeIds = patterns.flatMap(p => p.starIds);
    
    // Find potentially connectable nodes - undiscovered nodes that could connect to discovered ones
    const discoveredNodeIds = new Set(nodes.filter(n => n.discovered).map(n => n.id));
    const potentiallyConnectable = new Set<string>();
    
    // For each discovered node, find undiscovered nodes it could connect to
    nodes.filter(n => n.discovered).forEach(discoveredNode => {
      // Look at each undiscovered node
      nodes.filter(n => !n.discovered).forEach(undiscoveredNode => {
        // Check if they're in the same domain or have other connection potential
        if (discoveredNode.domain === undiscoveredNode.domain || 
            // Check if they're part of the same pattern
            patterns.some(p => 
              p.starIds.includes(discoveredNode.id) && 
              p.starIds.includes(undiscoveredNode.id)
            )) {
          potentiallyConnectable.add(undiscoveredNode.id);
        }
      });
    });
    
    // Filter nodes to include:
    // 1. All discovered nodes
    // 2. All undiscovered nodes
    // 3. Pattern nodes if in interactive mode
    const filteredNodes = nodes;
    
    // Transform to simulation nodes
    const d3Nodes: Node[] = filteredNodes.map(node => {
      // Find which patterns this node belongs to
      const nodePatterns = patterns
        .filter(p => p.starIds.includes(node.id))
        .map(p => p.id);
      
      // Calculate a more structured initial position based on patterns
      let x, y;
      
      // Place nodes in a more structured way based on patterns they belong to
      if (nodePatterns.length > 0) {
        // Use the first pattern to determine initial position
        const pattern = patterns.find(p => p.id === nodePatterns[0]);
        const patternFormation = pattern?.formation || 'circuit';
        const patternIndex = patterns.findIndex(p => p.id === nodePatterns[0]);
        const angleOffset = (patternIndex / patterns.length) * Math.PI * 2;
        
        if (patternFormation === 'circuit' || patternFormation === 'triangle') {
          const nodeIndex = pattern?.starIds.indexOf(node.id) || 0;
          const totalNodes = pattern?.starIds.length || 3;
          const angle = (nodeIndex / totalNodes) * Math.PI * 2 + angleOffset;
          const radius = 150;
          x = Math.cos(angle) * radius;
          y = Math.sin(angle) * radius;
        } else if (patternFormation === 'chain') {
          const nodeIndex = pattern?.starIds.indexOf(node.id) || 0;
          const totalNodes = pattern?.starIds.length || 4;
          x = ((nodeIndex / (totalNodes - 1)) * 300 - 150) * Math.cos(angleOffset);
          y = ((nodeIndex / (totalNodes - 1)) * 300 - 150) * Math.sin(angleOffset);
        } else {
          // Random position for other formation types
          x = (Math.random() - 0.5) * 300;
          y = (Math.random() - 0.5) * 300;
        }
      } else {
        // Use node position if available, or calculate random position
        x = node.position?.x || (Math.random() - 0.5) * 500;
        y = node.position?.y || (Math.random() - 0.5) * 500;
      }
      
      // Determine if this is a potentially connectable but undiscovered node
      const isPotentialConnection = !node.discovered && potentiallyConnectable.has(node.id);
      
      // Check if node is active (from activeNodes prop or from node.active property)
      const isActive = activeNodes.includes(node.id) || !!node.active;
      
      // Check if this node is newly discovered and hasn't been viewed yet
      const isNewlyDiscovered = newlyDiscovered.includes(node.id);
      const hasBeenViewed = viewedNodes.has(node.id);
      
      return {
        id: node.id,
        name: node.name,
        x: x,
        y: y,
        radius: node.discovered ? 
          Math.max(10, 5 + (node.mastery / 10)) : 
          3, // Smaller radius for undiscovered nodes (3px for the little blips)
        domain: node.domain,
        discovered: node.discovered,
        unlocked: node.unlocked || false, // Default to false if property doesn't exist
        active: isActive, // Use the determined active status
        isPotentialConnection, // Add this flag for rendering
        mastery: node.mastery,
        patterns: nodePatterns,
        isNewlyDiscovered,
        hasBeenViewed
      };
    });
    
    // Transform connections to links - only for discovered and unlocked nodes
    const d3Links: Link[] = discoveredConnections
      .filter(conn => {
        // Get the source and target nodes
        const sourceNode = filteredNodes.find(n => n.id === conn.source);
        const targetNode = filteredNodes.find(n => n.id === conn.target);
        
        // Only include links between discovered nodes, and BOTH must be unlocked
        return sourceNode?.discovered && targetNode?.discovered && 
               sourceNode?.unlocked && targetNode?.unlocked;
      })
      .map(conn => {
        // Find which patterns this connection belongs to
        const connPatterns: string[] = [];
        
        for (const pattern of patterns) {
          const sourceInPattern = pattern.starIds.includes(conn.source);
          const targetInPattern = pattern.starIds.includes(conn.target);
          
          if (sourceInPattern && targetInPattern) {
            connPatterns.push(pattern.id);
          }
        }
        
        // Get the nodes to determine active status
        const sourceNode = filteredNodes.find(n => n.id === conn.source);
        const targetNode = filteredNodes.find(n => n.id === conn.target);
        const isActiveConnection = sourceNode?.active && targetNode?.active;
        
        return {
          source: conn.source,
          target: conn.target,
          strength: conn.strength,
          discovered: conn.discovered,
          isActiveConnection, // Add flag for active connections
          patternIds: connPatterns
        };
      });
    
    setSimulationNodes(d3Nodes);
    setSimulationLinks(d3Links);
  }, [nodes, connections, interactive, activeNodes]); // Added activeNodes as dependency

  // Define gradient for active connections
  const createActiveConnectionGradient = (defs: d3.Selection<SVGDefsElement, unknown, null, undefined>) => {
    // Create a gradient for active connections
    const gradient = defs.append('linearGradient')
      .attr('id', 'activeConnectionGradient')
      .attr('gradientUnits', 'userSpaceOnUse')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '100%')
      .attr('y2', '0%');
      
    // Add gradient stops
    gradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', 'rgba(255, 220, 60, 0.9)');
      
    gradient.append('stop')
      .attr('offset', '50%')
      .attr('stop-color', 'rgba(255, 255, 200, 0.9)');
      
    gradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', 'rgba(255, 220, 60, 0.9)');

    // Animation for gradient
    const animateGradient = () => {
      gradient.attr('x1', '0%')
        .attr('x2', '100%')
        .transition()
        .duration(3000)
        .attr('x1', '100%')
        .attr('x2', '200%')
        .transition()
        .duration(3000)
        .attr('x1', '0%')
        .attr('x2', '100%')
        .on('end', animateGradient);
    };
    
    animateGradient();
  };

  // Add glow filter for active connections
  const createActiveConnectionFilter = (defs: d3.Selection<SVGDefsElement, unknown, null, undefined>) => {
    const activeConnectionGlow = defs.append('filter')
      .attr('id', 'active-connection-glow')
      .attr('x', '-40%')
      .attr('y', '-40%')
      .attr('width', '180%')
      .attr('height', '180%');
      
    activeConnectionGlow.append('feGaussianBlur')
      .attr('stdDeviation', '4')
      .attr('result', 'blur');
      
    activeConnectionGlow.append('feFlood')
      .attr('flood-color', '#ffdc3c')
      .attr('flood-opacity', '0.5')
      .attr('result', 'color');
      
    activeConnectionGlow.append('feComposite')
      .attr('in', 'color')
      .attr('in2', 'blur')
      .attr('operator', 'in')
      .attr('result', 'coloredBlur');
      
    activeConnectionGlow.append('feMerge')
      .html(`
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      `);
  };

  // Add SVG marker for exclamation mark
  const createExclamationMark = (defs: d3.Selection<SVGDefsElement, unknown, null, undefined>) => {
    // Add exclamation mark pattern
    const exclamationPattern = defs.append('pattern')
      .attr('id', 'exclamationPattern')
      .attr('patternUnits', 'objectBoundingBox')
      .attr('width', 1)
      .attr('height', 1);
      
    // Create the exclamation mark
    const g = exclamationPattern.append('g');
    
    // Draw the exclamation mark
    g.append('circle')
      .attr('cx', 12)
      .attr('cy', 12)
      .attr('r', 10)
      .attr('fill', 'rgba(255, 255, 0, 0.8)');
      
    g.append('text')
      .attr('x', 12)
      .attr('y', 16)
      .attr('text-anchor', 'middle')
      .attr('fill', 'black')
      .attr('font-weight', 'bold')
      .attr('font-family', 'Arial')
      .attr('font-size', '16px')
      .text('!');
      
    // Add glow filter for exclamation mark
    const glowFilter = defs.append('filter')
      .attr('id', 'exclamation-glow')
      .attr('x', '-50%')
      .attr('y', '-50%')
      .attr('width', '200%')
      .attr('height', '200%');
      
    glowFilter.append('feGaussianBlur')
      .attr('stdDeviation', '2')
      .attr('result', 'blur');
      
    glowFilter.append('feFlood')
      .attr('flood-color', 'yellow')
      .attr('flood-opacity', '0.7')
      .attr('result', 'color');
      
    glowFilter.append('feComposite')
      .attr('in', 'color')
      .attr('in2', 'blur')
      .attr('operator', 'in')
      .attr('result', 'coloredBlur');
      
    glowFilter.append('feMerge')
      .html(`
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      `);
  };

  // ========= D3 VISUALIZATION =========
  useEffect(() => {
    if (!svgRef.current || simulationNodes.length === 0) return;
    
    const width = dimensions.width;
    const height = dimensions.height;
    const centerX = width / 2;
    const centerY = height / 2;
    
    // Clear previous visualization
    d3.select(svgRef.current).selectAll('*').remove();
    
    // Create SVG and groups
    const svg = d3.select(svgRef.current);
    
    // Add defs for filters and gradients
    const defs = svg.append('defs');
    
    // Add star image pattern for nodes
    defs.append('pattern')
      .attr('id', 'starPattern')
      .attr('patternUnits', 'objectBoundingBox')
      .attr('width', 1)
      .attr('height', 1)
      .append('image')
      .attr('href', '/star.png')
      .attr('width', 32)
      .attr('height', 32)
      .attr('preserveAspectRatio', 'xMidYMid slice')
      .attr('image-rendering', 'pixelated'); // Keep pixel art sharp

    // Add colored star patterns for domain nodes
    const domainImagePatterns = [
      { id: 'tealStarPattern', domain: 'treatment-planning', image: '/teal-star.png' },
      { id: 'purpleStarPattern', domain: 'radiation-therapy', image: '/purple-star.png' },
      { id: 'redStarPattern', domain: 'linac-anatomy', image: '/red-star.png' },
      { id: 'pinkStarPattern', domain: 'dosimetry', image: '/pink-star.png' }
    ];
    
    domainImagePatterns.forEach(pattern => {
      defs.append('pattern')
        .attr('id', pattern.id)
        .attr('patternUnits', 'objectBoundingBox')
        .attr('width', 1)
        .attr('height', 1)
        .append('image')
        .attr('href', pattern.image)
        .attr('width', 32)
        .attr('height', 32)
        .attr('preserveAspectRatio', 'xMidYMid slice')
        .attr('image-rendering', 'pixelated');
    });
    
    // Glow filter for nodes
    const glowFilter = defs.append('filter')
      .attr('id', 'glow')
      .attr('x', '-50%')
      .attr('y', '-50%')
      .attr('width', '200%')
      .attr('height', '200%');
      
    glowFilter.append('feGaussianBlur')
      .attr('stdDeviation', '3')
      .attr('result', 'blur');
      
    glowFilter.append('feComposite')
      .attr('in', 'SourceGraphic')
      .attr('in2', 'blur')
      .attr('operator', 'over');
    
    // Add stronger glow filter for active stars
    const activeGlowFilter = defs.append('filter')
      .attr('id', 'active-glow')
      .attr('x', '-50%')
      .attr('y', '-50%')
      .attr('width', '200%')
      .attr('height', '200%');
      
    activeGlowFilter.append('feGaussianBlur')
      .attr('stdDeviation', '5')
      .attr('result', 'blur');
      
    activeGlowFilter.append('feFlood')
      .attr('flood-color', '#ffcc00')
      .attr('flood-opacity', '0.7')
      .attr('result', 'color');
      
    activeGlowFilter.append('feComposite')
      .attr('in', 'color')
      .attr('in2', 'blur')
      .attr('operator', 'in')
      .attr('result', 'coloredBlur');
      
    activeGlowFilter.append('feMerge')
      .html(`
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      `);
    
    // Add stronger glow filter for domain stars
    const domainGlowFilter = defs.append('filter')
      .attr('id', 'domain-glow')
      .attr('x', '-50%')
      .attr('y', '-50%')
      .attr('width', '200%')
      .attr('height', '200%');
      
    domainGlowFilter.append('feGaussianBlur')
      .attr('stdDeviation', '4')
      .attr('result', 'blur');
      
    domainGlowFilter.append('feComposite')
      .attr('in', 'SourceGraphic')
      .attr('in2', 'blur')
      .attr('operator', 'over');
      
    // Add drop shadow filter for 3D effect
    const dropShadowFilter = defs.append('filter')
      .attr('id', 'drop-shadow')
      .attr('x', '-50%')
      .attr('y', '-50%')
      .attr('width', '200%')
      .attr('height', '200%');
      
    dropShadowFilter.append('feGaussianBlur')
      .attr('in', 'SourceAlpha')
      .attr('stdDeviation', '3')
      .attr('result', 'blur');
      
    dropShadowFilter.append('feOffset')
      .attr('in', 'blur')
      .attr('dx', '0')
      .attr('dy', '4')
      .attr('result', 'offsetBlur');
      
    dropShadowFilter.append('feComponentTransfer')
      .append('feFuncA')
      .attr('type', 'linear')
      .attr('slope', '0.6');
      
    const feMerge = dropShadowFilter.append('feMerge');
    feMerge.append('feMergeNode')
      .attr('in', 'offsetBlur');
    feMerge.append('feMergeNode')
      .attr('in', 'SourceGraphic');

    // Create pattern-specific glow filters
    const uniquePatternIds = Array.from(new Set(
      simulationNodes.flatMap(n => n.patterns)
    ));
    
    uniquePatternIds.forEach(patternId => {
      if (!patternId) return;
      
      const patternGlow = defs.append('filter')
        .attr('id', `glow-${patternId}`)
        .attr('x', '-50%')
        .attr('y', '-50%')
        .attr('width', '200%')
        .attr('height', '200%');
        
      patternGlow.append('feGaussianBlur')
        .attr('stdDeviation', '4')
        .attr('result', 'blur');
        
      patternGlow.append('feFlood')
        .attr('flood-color', getPatternColor(patternId))
        .attr('flood-opacity', '0.3')
        .attr('result', 'color');
        
      patternGlow.append('feComposite')
        .attr('in', 'color')
        .attr('in2', 'blur')
        .attr('operator', 'in')
        .attr('result', 'coloredBlur');
        
      patternGlow.append('feMerge')
        .html(`
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        `);
    });
    
    // Add exclamation mark pattern and filter
    createExclamationMark(defs as d3.Selection<SVGDefsElement, unknown, null, undefined>);
    
    // Add gradient and glow filter for active connections
    createActiveConnectionGradient(defs as d3.Selection<SVGDefsElement, unknown, null, undefined>);
    createActiveConnectionFilter(defs as d3.Selection<SVGDefsElement, unknown, null, undefined>);
    
    // Main visualization container, centered in the SVG
    const container = svg.append('g')
      .attr('class', 'main-container')
      .attr('transform', `translate(${centerX}, ${centerY})`);
    
    // Background grid for depth effect
    const grid = container.append('g').attr('class', 'grid');
    
    // Add subtle grid lines
    const gridSize = 1000;
    const gridStep = 100;
    
    for (let x = -gridSize/2; x <= gridSize/2; x += gridStep) {
      grid.append('line')
        .attr('x1', x)
        .attr('y1', -gridSize/2)
        .attr('x2', x)
        .attr('y2', gridSize/2)
        .attr('stroke', nightMode ? 'rgba(100, 100, 255, 0.1)' : 'rgba(100, 100, 200, 0.05)')
        .attr('stroke-width', 0.5);
    }
    
    for (let y = -gridSize/2; y <= gridSize/2; y += gridStep) {
      grid.append('line')
        .attr('x1', -gridSize/2)
        .attr('y1', y)
        .attr('x2', gridSize/2)
        .attr('y2', y)
        .attr('stroke', nightMode ? 'rgba(100, 100, 255, 0.1)' : 'rgba(100, 100, 200, 0.05)')
        .attr('stroke-width', 0.5);
    }
    
    // Add pattern shapes before links if there's an active pattern
    if (activePatternId) {
      const pattern = patterns.find(p => p.id === activePatternId);
      if (pattern) {
        const patternShape = container.append('g')
          .attr('class', 'pattern-shape')
          .attr('opacity', 0.2);
          
        // Different shape based on formation type
        if (pattern.formation === 'triangle') {
          // Create triangle shape connecting the nodes
          const patternNodes = simulationNodes.filter(n => n.patterns.includes(activePatternId));
          if (patternNodes.length >= 3) {
            patternShape.append('polygon')
              .attr('points', '0,0 0,0 0,0') // Will be updated in tick
              .attr('fill', 'none')
              .attr('stroke', getPatternColor(activePatternId))
              .attr('stroke-width', 2)
              .attr('stroke-dasharray', '5,3')
              .attr('opacity', 0.7);
          }
        } else if (pattern.formation === 'circuit') {
          // Create circle/polygon shape connecting the nodes
          const patternNodes = simulationNodes.filter(n => n.patterns.includes(activePatternId));
          if (patternNodes.length >= 3) {
            patternShape.append('polygon')
              .attr('points', '0,0 0,0 0,0') // Will be updated in tick
              .attr('fill', getPatternGlowColor(activePatternId))
              .attr('stroke', getPatternColor(activePatternId))
              .attr('stroke-width', 2)
              .attr('opacity', 0.3);
          }
        } else if (pattern.formation === 'chain') {
          // Create a path connecting the nodes in sequence
          patternShape.append('path')
            .attr('d', 'M0,0 L0,0') // Will be updated in tick
            .attr('fill', 'none')
            .attr('stroke', getPatternColor(activePatternId))
            .attr('stroke-width', 3)
            .attr('stroke-linecap', 'round')
            .attr('opacity', 0.5);
        }
      }
    }
    
    // Links first (so they're behind nodes)
    const linkGroup = container.append('g').attr('class', 'links');
    const nodeGroup = container.append('g').attr('class', 'nodes');
    // Small dots for undiscovered nodes
    const dotGroup = container.append('g').attr('class', 'undiscovered-dots');
    
    // Process links - only show connections based on their states
    const linkElements = linkGroup.selectAll('line')
      .data(simulationLinks)
      .enter()
      .append('line')
      .attr('stroke', d => {
        // Active connections between two active nodes get special treatment
        const sourceNode = simulationNodes.find(n => n.id === d.source);
        const targetNode = simulationNodes.find(n => n.id === d.target);
        const bothActive = sourceNode?.active && targetNode?.active;
        
        if (bothActive) {
          return 'url(#activeConnectionGradient)'; // Use gradient for connections between active nodes
        }
        // Active connections get special treatment
        if (d.isActiveConnection) {
          return 'rgba(255, 220, 60, 0.8)'; // Bright gold for active connections
        }
        // If we have an active pattern, highlight links belonging to it
        if (activePatternId && d.patternIds.includes(activePatternId)) {
          return getPatternColor(activePatternId);
        }
        // Default link color based on connection strength
        return `rgba(180, 180, 255, ${0.3 + (d.strength / 200)})`;
      })
      .attr('stroke-width', d => {
        // Determine if both nodes are active
        const sourceNode = simulationNodes.find(n => n.id === d.source);
        const targetNode = simulationNodes.find(n => n.id === d.target);
        const bothActive = sourceNode?.active && targetNode?.active;
        
        // Thicker lines for active connections between active nodes
        if (bothActive) {
          return 4;
        }
        // Thicker lines for active connections
        if (d.isActiveConnection) {
          return 3;
        }
        // Thicker lines for pattern links when a pattern is active
        if (activePatternId && d.patternIds.includes(activePatternId)) {
          return 2;
        }
        return 1;
      })
      .attr('opacity', d => {
        // Determine if both nodes are active
        const sourceNode = simulationNodes.find(n => n.id === d.source);
        const targetNode = simulationNodes.find(n => n.id === d.target);
        const bothActive = sourceNode?.active && targetNode?.active;
        
        // Full opacity for connections between active nodes
        if (bothActive) {
          return 1;
        }
        // Full opacity for active connections
        if (d.isActiveConnection) {
          return 1;
        }
        // Full opacity for active pattern links
        if (activePatternId && d.patternIds.includes(activePatternId)) {
          return 0.8;
        }
        return 0.3; // Faded links by default
      })
      .style('transition', 'stroke 0.3s ease, stroke-width 0.3s ease, opacity 0.3s ease')
      .style('filter', d => {
        // Apply glow effect to connections between active nodes
        const sourceNode = simulationNodes.find(n => n.id === d.source);
        const targetNode = simulationNodes.find(n => n.id === d.target);
        const bothActive = sourceNode?.active && targetNode?.active;
        
        if (bothActive) {
          return 'url(#active-connection-glow)';
        }
        return 'none';
      })
      .style('cursor', 'pointer') // Add pointer cursor to show connections are clickable
      .on('click', function(this: SVGLineElement, event: MouseEvent, d: Link) {
        event.stopPropagation(); // Prevent SVG background click
        
        // Find source and target nodes
        const sourceId = typeof d.source === 'string' ? d.source : (d.source as any).id;
        const targetId = typeof d.target === 'string' ? d.target : (d.target as any).id;
        
        const sourceNode = simulationNodes.find(n => n.id === sourceId);
        const targetNode = simulationNodes.find(n => n.id === targetId);
        
        if (!sourceNode || !targetNode) return;
        
        // Show connection info
        setSelectedConnection({
          sourceId: sourceNode.id,
          targetId: targetNode.id,
          sourceName: sourceNode.name,
          targetName: targetNode.name,
          strength: d.strength,
          patternIds: d.patternIds || []
        });
        
        // Find connection from predefined connections to get description
        const connection = predefinedConnections.find((conn: Connection) => 
          (conn.sourceId === sourceNode.id && conn.targetId === targetNode.id) ||
          (conn.sourceId === targetNode.id && conn.targetId === sourceNode.id)
        );
        
        if (connection) {
          setSelectedConnectionDescription(connection.description);
        }
      });
    
    // Instead of manually creating dots for undiscovered nodes,
    // we'll let them participate in the force simulation
    
    // Process discovered nodes - different visualization based on state
    const nodeElements = nodeGroup.selectAll('image')
      .data(simulationNodes.filter(n => n.discovered))
      .enter()
      .append('image')
      .attr('href', (d: Node) => {
        // Only use the colored sprites for the main domain stars
        // These are typically the core stars with ID matching the domain
        if (d.id === d.domain) {
          switch(d.domain) {
            case 'treatment-planning':
              return '/teal-star.png';
            case 'radiation-therapy':
              return '/purple-star.png';
            case 'linac-anatomy':
              return '/red-star.png';
            case 'dosimetry':
              return '/pink-star.png';
          }
        }
        // For all other stars, use the default star
        return '/star.png';
      })
      .attr('width', (d: Node) => {
        // Increase size for domain stars and active stars
        if (d.id === d.domain) return d.radius * 3;
        if (d.active) return d.radius * 2.5;
        return d.radius * 2;
      })
      .attr('height', (d: Node) => {
        // Increase size for domain stars and active stars
        if (d.id === d.domain) return d.radius * 3;
        if (d.active) return d.radius * 2.5;
        return d.radius * 2;
      })
      .attr('x', (d: Node) => {
        // Adjust position for increased size
        if (d.id === d.domain) return -d.radius * 1.5;
        if (d.active) return -d.radius * 1.25;
        return -d.radius;
      })
      .attr('y', (d: Node) => {
        // Adjust position for increased size
        if (d.id === d.domain) return -d.radius * 1.5;
        if (d.active) return -d.radius * 1.25;
        return -d.radius;
      })
      .attr('image-rendering', 'pixelated') // Ensure pixel art stays sharp
      .style('filter', (d: Node) => {
        // Add stronger glow effect for selected node
        if (d.id === selectedNodeId) {
          return 'url(#glow) drop-shadow(0 0 8px rgba(255, 255, 255, 0.8))';
        }
        
        // Active stars get special glow
        if (d.active) {
          return 'url(#active-glow) url(#drop-shadow)';
        }
        
        if (activePatternId && d.patterns.includes(activePatternId)) {
          return `url(#glow-${activePatternId})`;
        }
        
        // Special glow for domain stars
        if (d.id === d.domain && d.unlocked) {
          return 'url(#domain-glow) url(#drop-shadow)';
        }
        
        // Locked stars have reduced effects
        if (!d.unlocked) {
          return 'saturate(30%) brightness(60%)';
        }
        
        // Standard glow for normal stars (no special effect for newly discovered)
        return 'url(#glow)';
      })
      .style('cursor', d => d.discovered ? 'pointer' : 'default') // Allow clicking any discovered node
      .style('opacity', (d: Node) => {
        // Full opacity for selected node
        if (d.id === selectedNodeId) return 1;
        
        // Active stars are fully visible
        if (d.active) return 1;
        
        // Unlocked stars are more visible than locked ones
        if (d.unlocked) return 0.8;
        
        // Locked stars are faded
        return 0.4;
      })
      .style('transition', 'opacity 0.3s ease, filter 0.3s ease')
      .on('click', (event: any, d: Node) => {
        event.stopPropagation(); // Prevent SVG background click
        // Allow clicking any discovered node, regardless of locked status
        if (interactive && d.discovered) {
          setSelectedNodeId(prev => prev === d.id ? null : d.id);
          
          // Mark this node as viewed if it's newly discovered
          if (d.isNewlyDiscovered) {
            setViewedNodes(prev => {
              const newSet = new Set(prev);
              newSet.add(d.id);
              return newSet;
            });
            
            // Update the local simulation nodes to remove the "newly discovered" visual immediately
            setSimulationNodes(prevNodes => 
              prevNodes.map(node => 
                node.id === d.id ? {...node, hasBeenViewed: true} : node
              )
            );
          }
          
          // Dispatch node selection event
          if (d.id !== selectedNodeId) {
            safeDispatch(
              GameEventType.UI_NODE_SELECTED, 
              { nodeId: d.id }, 
              'constellation'
            );
          }
        }
      });
    
    // Add exclamation marks for newly discovered nodes that haven't been viewed
    const exclamationMarks = nodeGroup.selectAll('.exclamation-mark')
      .data(simulationNodes.filter(n => n.discovered && n.isNewlyDiscovered && !n.hasBeenViewed))
      .enter()
      .append('g')
      .attr('class', 'exclamation-mark')
      .attr('transform', d => `translate(${d.x + d.radius*0.8}, ${d.y - d.radius*1.2})`);
      
    exclamationMarks.append('circle')
      .attr('r', 8)
      .attr('fill', 'rgba(255, 255, 0, 0.9)')
      .attr('filter', 'url(#exclamation-glow)');
      
    exclamationMarks.append('text')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central')
      .attr('font-weight', 'bold')
      .attr('font-size', '12px')
      .attr('fill', 'black')
      .text('!');
      
    // Add pulsating animation
    exclamationMarks.each(function() {
      const mark = d3.select(this);
      
      // Apply pulsating animation
      const pulse = () => {
        mark.selectAll('circle')
          .transition()
          .duration(800)
          .attr('r', 10)
          .style('opacity', 1)
          .transition()
          .duration(800)
          .attr('r', 8)
          .style('opacity', 0.7)
          .on('end', pulse);
      };
      
      pulse();
    });
    
    // Add undiscovered node dots to force simulation
    const undiscoveredDots = dotGroup.selectAll('circle')
      .data(simulationNodes.filter(n => !n.discovered))
      .enter()
      .append('circle')
      .attr('r', 1.5) // Tiny pixel-like blips
      .attr('fill', 'rgba(255, 255, 255, 0.8)') // Higher opacity
      .attr('opacity', 0.8) // Higher default opacity
      .style('transition', 'opacity 0.3s ease');
    
    // Highlight connections for selected node
    if (selectedNodeId) {
      linkElements
        .style('stroke-width', d => {
          const isSelected = d.source === selectedNodeId || d.target === selectedNodeId;
          return isSelected ? 2 : d.patternIds.includes(activePatternId!) ? 3 : 1.5;
        })
        .style('opacity', d => {
          const isSelected = d.source === selectedNodeId || d.target === selectedNodeId;
          return isSelected ? 1 : 0.3;
        })
        .style('stroke', d => {
          const isSelected = d.source === selectedNodeId || d.target === selectedNodeId;
          if (isSelected) {
            return 'rgba(255, 255, 255, 0.8)';
          }
          if (activePatternId && d.patternIds.includes(activePatternId)) {
            return getPatternColor(activePatternId);
          }
          return `rgba(180, 180, 255, ${0.3 + (d.strength / 200)})`;
        });
        
      // Apply greying effect to nodes not related to selection
      nodeElements
        .style('opacity', (d: Node) => {
          // Selected node is fully visible
          if (d.id === selectedNodeId) return 1;
          
          // Check if connected to selected node
          const isConnected = simulationLinks.some(link => 
            (link.source === selectedNodeId && link.target === d.id) || 
            (link.target === selectedNodeId && link.source === d.id)
          );
          
          // Connected nodes are fully visible, others are faded
          return isConnected ? 1 : 0.5;
        })
        .style('filter', (d: Node) => {
          // Strong glow for selected node
          if (d.id === selectedNodeId) {
            return 'url(#glow) drop-shadow(0 0 8px rgba(255, 255, 255, 0.8))';
          }
          
          // Normal glow for connected nodes or pattern nodes
          const isConnected = simulationLinks.some(link => 
            (link.source === selectedNodeId && link.target === d.id) || 
            (link.target === selectedNodeId && link.source === d.id)
          );
          
          if (isConnected) {
            return 'url(#glow)';
          }
          
          // Grey out unconnected nodes
          return 'url(#glow) saturate(50%)';
        });
    }

    // Node labels (if enabled)
    if (showLabels) {
      const nodeLabels = nodeGroup.selectAll('text')
        .data(simulationNodes)
        .enter()
        .append('text')
        .text(d => d.name)
        .attr('font-size', '10px')
        .attr('font-family', 'Inter, system-ui, sans-serif')
        .attr('fill', d => {
          if (activePatternId && d.patterns.includes(activePatternId) && d.discovered) {
            return '#ffffff';
          }
          return d.discovered ? 'rgba(255, 255, 255, 0.8)' : 'rgba(150, 150, 200, 0.4)';
        })
        .attr('text-anchor', 'middle')
        .attr('dy', d => -d.radius - 5)
        .style('pointer-events', 'none')
        .style('text-shadow', '0px 1px 2px rgba(0,0,0,0.8)')
        .style('opacity', d => {
          // Never show labels for potential connections
          if (d.isPotentialConnection) return 0;
          
          // Only show labels for selected node and its connections when a node is selected
          if (selectedNodeId) {
            // This is the selected node
            if (d.id === selectedNodeId) return 1;
            
            // Check if this node is connected to the selected node
            const isConnected = simulationLinks.some(link => 
              (link.source === selectedNodeId && link.target === d.id) || 
              (link.target === selectedNodeId && link.source === d.id)
            );
            
            return isConnected && d.discovered ? 1 : 0;
          }
          
          // When no node is selected and a pattern is active
          if (activePatternId && d.patterns.includes(activePatternId) && d.discovered) {
            return 1;
          }
          
          // Default: depend on showLabels setting, but only for discovered nodes
          return d.discovered && showLabels ? 0.7 : 0;
        });
    }
    
    // Force simulation with optimized parameters based on SimpleConstellationTest
    const simulation = d3.forceSimulation()
      .force('link', d3.forceLink()
        .id((d: any) => d.id)
        .distance(d => {
          // Shorter distances for active pattern links
          if (activePatternId && (d as any).patternIds?.includes(activePatternId)) {
            return 80;
          }
          return 120;
        })
        .strength(0.7)
      )
      .force('charge', d3.forceManyBody().strength(-250))
      .force('center', d3.forceCenter(0, 0).strength(0.15))
      .force('x', d3.forceX(0).strength(0.1))
      .force('y', d3.forceY(0).strength(0.1))
      .force('collision', d3.forceCollide().radius((d: any) => {
        // Give undiscovered nodes a smaller collision radius
        if (!d.discovered) {
          return 5;  // Smaller collision radius for undiscovered nodes
        }
        return d.radius + 15;
      }));
    
    // Custom force to create space around selected node
    if (selectedNodeId && interactive) {
      // Find the selected node's position
      const selectedNode = simulationNodes.find(n => n.id === selectedNodeId);
      if (selectedNode) {
        // Strengthen the collision force for better separation
        simulation.force('collision', d3.forceCollide().radius((d: any) => {
          if (d.id === selectedNodeId) {
            return d.radius + 30; // Larger collision radius for selected node
          }
          
          // Direct connections get medium collision radius
          const isConnected = simulationLinks.some(link => 
            (link.source === selectedNodeId && link.target === d.id) || 
            (link.target === selectedNodeId && link.source === d.id)
          );
          
          if (isConnected) {
            return d.radius + 20;
          }
          
          // For unrelated nodes, calculate distance-based collision radius
          // Further nodes get smaller collision radius (can overlap more)
          const dx = d.x - selectedNode.x;
          const dy = d.y - selectedNode.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          // Max influence distance - beyond this, minimum spacing
          const maxDistance = 300;
          // Calculate scaling factor based on distance
          const scaleFactor = Math.max(0.5, 1 - (distance / maxDistance));
          
          // Scale collision radius - closer = bigger radius (more spacing)
          // Further = smaller radius (more dense packing)
          return d.radius + 15 * scaleFactor;
        }).strength(0.8)); // Increase collision strength for better enforcement
        
        // Also add a custom repulsion force to create more dramatic space near selected node
        simulation.force('clearSpace', alpha => {
          for (const node of simulationNodes) {
            // Skip the selected node and its direct connections
            if (node.id === selectedNodeId) continue;
            
            // Check if connected to selected node
            const isConnected = simulationLinks.some(link => 
              (link.source === selectedNodeId && link.target === node.id) || 
              (link.target === selectedNodeId && link.source === node.id)
            );
            
            // Don't repel connected nodes
            if (isConnected) continue;
            
            // Calculate vector from selected node to this node
            const dx = node.x - selectedNode.x;
            const dy = node.y - selectedNode.y;
            
            // Calculate distance
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Define the repulsion radius - larger than normal collision distance
            const repulsionRadius = 200; // Increased for wider effect
            
            // Only repel if within radius
            if (distance < repulsionRadius) {
              // Normalized direction vector
              const unitX = dx / distance || 0;
              const unitY = dy / distance || 0;
              
              // Repulsion strength decreases with distance - sharper falloff
              // Use quadratic falloff for more dramatic near-field effect
              const proximityFactor = 1 - (distance / repulsionRadius);
              const strength = (0.8 * alpha) * proximityFactor * proximityFactor;
              
              // Apply force - stronger when closer
              node.vx = (node.vx || 0) + unitX * strength;
              node.vy = (node.vy || 0) + unitY * strength;
            }
          }
        });
      }
    }
    
    // Add pattern-specific forces
    if (activePatternId) {
      const pattern = patterns.find(p => p.id === activePatternId);
      
      if (pattern?.formation === 'triangle') {
        // Triangle formation - push nodes toward triangle vertices
        const patternNodes = simulationNodes.filter(n => n.patterns.includes(activePatternId));
        if (patternNodes.length === 3) {
          // Add radial force to form triangle
          simulation.force('radial', d3.forceRadial(120).strength((d: any) => {
            return d.patterns.includes(activePatternId) ? 0.3 : 0.05;
          }));
        }
      } else if (pattern?.formation === 'circuit') {
        // Circuit formation - arrange in a circle
        simulation.force('radial', d3.forceRadial(100).strength((d: any) => {
          return d.patterns.includes(activePatternId) ? 0.5 : 0.05;
        }));
      } else if (pattern?.formation === 'chain') {
        // Chain formation - strengthen link force for chain nodes
        const linkForce = simulation.force('link') as d3.ForceLink<any, any>;
        if (linkForce) {
          linkForce.strength((d: any) => d.patternIds?.includes(activePatternId) ? 1.0 : 0.7);
        }
      }
    }
    
    // Add node dragging capability if interactive
    if (interactive) {
      const nodeDrag = d3.drag<SVGImageElement, any>()
        .on('start', (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on('drag', (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on('end', (event, d) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        });
      
      // Apply node dragging to all nodes
      nodeElements.call(nodeDrag as any);
    }
    
    // Click on background to deselect
    svg.on('click', () => {
      if (interactive) {
        setSelectedNodeId(null);
      }
    });
    
    // Use a custom tick function to update positions
    simulation.nodes(simulationNodes as any).on('tick', () => {
      // Update links
      linkElements
        .attr('x1', d => {
          const source = simulationNodes.find(n => n.id === d.source);
          return source ? source.x : 0;
        })
        .attr('y1', d => {
          const source = simulationNodes.find(n => n.id === d.source);
          return source ? source.y : 0;
        })
        .attr('x2', d => {
          const target = simulationNodes.find(n => n.id === d.target);
          return target ? target.x : 0;
        })
        .attr('y2', d => {
          const target = simulationNodes.find(n => n.id === d.target);
          return target ? target.y : 0;
        });
      
      // Update node images
      nodeElements
        .attr('x', (d: Node) => {
          // Adjust position for increased size of domain stars
          const baseOffset = d.id === d.domain ? -d.radius * 1.5 : -d.radius;
          return d.x + baseOffset;
        })
        .attr('y', (d: Node) => {
          // Adjust position for increased size of domain stars
          const baseOffset = d.id === d.domain ? -d.radius * 1.5 : -d.radius;
          return d.y + baseOffset;
        });
      
      // Update undiscovered dots position
      undiscoveredDots
        .attr('cx', d => d.x)
        .attr('cy', d => d.y);
      
      // Update labels if showing
      if (showLabels) {
        nodeGroup.selectAll('text')
          .attr('x', d => d.x)
          .attr('y', d => d.y);
      }
      
      // Update pattern shapes
      if (activePatternId) {
        const patternShape = container.select('.pattern-shape');
        const patternNodes = simulationNodes.filter(n => n.patterns.includes(activePatternId));
        const pattern = patterns.find(p => p.id === activePatternId);
        
        if (pattern?.formation === 'triangle' || pattern?.formation === 'circuit') {
          if (patternNodes.length >= 3) {
            const points = patternNodes.map(n => `${n.x},${n.y}`).join(' ');
            patternShape.select('polygon').attr('points', points);
          }
        } else if (pattern?.formation === 'chain') {
          if (patternNodes.length >= 2) {
            // Sort nodes by chain order
            const orderedNodes = [...patternNodes].sort((a, b) => {
              const patternStarIds = pattern.starIds;
              return patternStarIds.indexOf(a.id) - patternStarIds.indexOf(b.id);
            });
            
            const path = orderedNodes.map((n, i) => 
              (i === 0 ? 'M' : 'L') + `${n.x},${n.y}`
            ).join(' ');
            
            patternShape.select('path').attr('d', path);
          }
        }
      }
      
      // Keep center point centered for patterns
      if (activePatternId) {
        const patternNodes = simulationNodes.filter(n => n.patterns.includes(activePatternId));
        if (patternNodes.length > 0) {
          // Calculate center of pattern
          const centroidX = patternNodes.reduce((sum, n) => sum + n.x, 0) / patternNodes.length;
          const centroidY = patternNodes.reduce((sum, n) => sum + n.y, 0) / patternNodes.length;
          
          // Translate all nodes to keep pattern centered
          if (Math.abs(centroidX) > 10 || Math.abs(centroidY) > 10) {
            simulationNodes.forEach(node => {
              node.x -= centroidX * 0.1;
              node.y -= centroidY * 0.1;
            });
          }
        }
      }
      
      // Update exclamation mark positions
      nodeGroup.selectAll('.exclamation-mark')
        .attr('transform', d => `translate(${d.x + d.radius*0.8}, ${d.y - d.radius*1.2})`);
    });
    
    // Set link force data
    const linkForce = simulation.force('link') as d3.ForceLink<any, any>;
    if (linkForce) {
      linkForce.links(simulationLinks.map(link => {
        const source = simulationNodes.find(n => n.id === link.source);
        const target = simulationNodes.find(n => n.id === link.target);
        if (source && target) {
          return { source, target, ...link };
        }
        return null;
      }).filter(Boolean) as any);
    }
    
    // Apply initial force simulation tick
    // This helps ensure undiscovered nodes start in better positions
    for (let i = 0; i < 50; i++) {
      simulation.tick();
    }
    
    // Apply shadow effect to the selected node
    if (selectedNodeId) {
      const selectedNodeElement = nodeElements.filter((d: Node) => d.id === selectedNodeId);
      // Add shadow underneath the selected star for 3D effect
      selectedNodeElement
        .style('filter', 'url(#glow) drop-shadow(0 4px 6px rgba(0, 0, 0, 0.8)) drop-shadow(0 0 8px rgba(255, 255, 255, 0.8))');
    }
    
    // Cleanup
    return () => {
      simulation.stop();
    };
  }, [
    simulationNodes, 
    simulationLinks, 
    dimensions, 
    selectedNodeId, 
    activePatternId, 
    interactive, 
    showLabels,
    nightMode,
    detectPatterns,
    nodes,
    connections,
    viewedNodes
  ]);

  // ========= LIFECYCLE MANAGEMENT =========
  useEffect(() => {
    isComponentMountedRef.current = true;
    
    // Handle auto-selection of active nodes
    if (activeNodes.length > 0 && interactive) {
      const nodeToFocus = nodes.find(n => n.discovered && activeNodes.includes(n.id));
      if (nodeToFocus) {
        setSelectedNodeId(nodeToFocus.id);
      }
    }
    
    // Subscribe to event bus for UI events
    const eventHandlers = {
      [GameEventType.UI_NODE_SELECTED]: (event: any) => {
        // Find the node and select it if it exists and is discovered
        const node = nodes.find(n => n.id === event.payload.nodeId && n.discovered);
        if (node) {
          setSelectedNodeId(node.id);
        }
      },
      [GameEventType.TRANSITION_TO_NIGHT_COMPLETED]: () => {
        // Ensure we re-render when night transition completes
        if (svgRef.current) {
          // Force re-render of visualization
          const currentNodes = [...simulationNodes];
          setSimulationNodes(currentNodes);
        }
      }
    };
    
    // Register event handlers
    const eventUnsubscribes = Object.entries(eventHandlers).map(([eventType, handler]) => {
      return useEventBus.getState().subscribe(eventType as GameEventType, handler);
    });
    
    // Debug options handling
    if (debugOptions) {
      // Handle debug options
      // This would process showAllDiscovered, masteryLevel, etc.
    }
    
    return () => {
      isComponentMountedRef.current = false;
      
      // Unsubscribe from all event handlers
      eventUnsubscribes.forEach(unsubFn => unsubFn());
    };
  }, [nodes, activeNodes, interactive, debugOptions, simulationNodes]);

  // Function to handle pattern selection
  const handlePatternSelect = (patternId: string | null) => {
    setActivePatternId(patternId);
  };

  // Get details for the selected node
  const selectedNode = selectedNodeId ? nodes.find(n => n.id === selectedNodeId) : null;
  
  // Get all available patterns
  const patterns = React.useMemo(() => 
    detectPatterns(nodes, connections, new Set()).allComplete,
  [nodes, connections]);

  // Add these functions to update node states
  const unlockNode = (nodeId: string) => {
    // Check if we have enough SP
    if (starPoints < 1) {
      // Show feedback that player doesn't have enough SP
      safeDispatch(
        GameEventType.UI_NOTIFICATION,
        { message: "Not enough Star Points to unlock", type: "error" },
        'constellation'
      );
      return;
    }

    // Attempt to spend star points
    const success = useKnowledgeStore.getState().spendStarPoints(1, `unlock_node_${nodeId}`);
    
    if (!success) {
      safeDispatch(
        GameEventType.UI_NOTIFICATION,
        { message: "Failed to unlock node", type: "error" },
        'constellation'
      );
      return;
    }
    
    // Update the simulationNodes directly to see immediate effect
    const updatedNodes = simulationNodes.map(node => {
      if (node.id === nodeId) {
        return { ...node, unlocked: true };
      }
      return node;
    });
    
    // Update the simulation nodes
    setSimulationNodes(updatedNodes);
    
    // Update the actual node in the store
    const storeNodes = useKnowledgeStore.getState().nodes;
    const updatedStoreNodes = storeNodes.map(node => {
      if (node.id === nodeId) {
        return { ...node, unlocked: true };
      }
      return node;
    });
    
    // Update the store with the modified nodes
    useKnowledgeStore.getState().importKnowledgeData({ nodes: updatedStoreNodes });
    
    // Dispatch event for any listeners
    safeDispatch(
      GameEventType.KNOWLEDGE_NODE_UNLOCKED,
      { nodeId, spRemaining: starPoints - 1 },
      'constellation'
    );
  };

  const toggleNodeActive = (nodeId: string, isActive: boolean) => {
    // Update the simulationNodes directly to see immediate effect
    const updatedNodes = simulationNodes.map(node => {
      if (node.id === nodeId) {
        return { ...node, active: isActive };
      }
      return node;
    });
    
    // Update the simulation nodes
    setSimulationNodes(updatedNodes);
    
    // In a real implementation, this would update the store
    // For now, we'll just modify the local nodes state
    const updatedStoreNodes = nodes.map(node => {
      if (node.id === nodeId) {
        return { ...node, active: isActive };
      }
      return node;
    });
    
    // This is simulating what would happen in a real implementation
    safeDispatch(
      GameEventType.KNOWLEDGE_NODE_ACTIVATION_CHANGED, 
      { nodeId, isActive },
      'constellation'
    );
    
    // In a production app, you would call a store method like:
    // useKnowledgeStore.getState().setNodeActive(nodeId, isActive);
  };

  // ========= COMPONENT RENDER =========
  return (
    <div
      ref={containerRef}
      className={`constellation-view relative ${
        fullscreen ? 'constellation-fullscreen fixed inset-0 z-50' : ''
      }`}
      data-testid="constellation-view"
      style={{
        backgroundColor: nightMode ? '#111827' : '#1e293b',
        width: '100%',
        height: '100%'
      }}
    >
      <svg 
        ref={svgRef} 
        width="100%" 
        height="100%" 
        className="w-full h-full"
      ></svg>
      
      {/* Simple UI elements */}
      <div className="absolute top-4 right-4 flex space-x-2">
        {/* SP Currency Display */}
        <div className="bg-gray-800 text-white px-3 py-1 rounded-full flex items-center mr-2">
          <span className="text-yellow-400 mr-1">★</span>
          <span>{starPoints} SP</span>
        </div>
        
        {interactive && onClose && (
          <button 
            onClick={onClose}
            className="bg-gray-800 hover:bg-gray-700 text-white p-2 rounded-full"
          >
            ✕
          </button>
        )}
      </div>
      
      {/* Help text at bottom */}
      {false && (
        <div className="absolute bottom-2 right-2 text-xs text-gray-400 flex flex-wrap gap-4">
          <span className="flex items-center">
            <svg viewBox="0 0 24 24" className="w-3 h-3 fill-current mr-1">
              <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
            </svg>
            Nodes: Drag to reposition
          </span>
          <span className="flex items-center">
            <svg viewBox="0 0 24 24" className="w-3 h-3 fill-current mr-1">
              <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/>
            </svg>
            Click star to view details
          </span>
        </div>
      )}
      
      {/* Pattern Selection - only if we have patterns */}
      {false && patterns.length > 0 && (
        <div className="absolute top-4 left-4 flex flex-wrap gap-2">
          <button
            className={`px-3 py-1 text-sm rounded bg-gray-700 hover:bg-gray-600`}
            onClick={() => handlePatternSelect(null)}
          >
            Show All
          </button>
          
          {patterns.map(pattern => (
            <button
              key={pattern.id}
              className={`px-3 py-1 text-sm rounded ${
                activePatternId === pattern.id 
                  ? 'ring-2 ring-white' 
                  : 'hover:bg-opacity-80'
              }`}
              style={{ backgroundColor: getPatternColor(pattern.id) }}
              onClick={() => handlePatternSelect(pattern.id)}
            >
              {pattern.name}
            </button>
          ))}
        </div>
      )}
      
      {/* Selected Node Info */}
      {selectedNode && (
        <div className="absolute right-4 top-16 w-64 bg-gray-900 bg-opacity-90 p-3 rounded-md shadow-lg border border-gray-700 text-sm">
          <div className="flex justify-between items-center mb-2">
            <h4 className="font-bold text-md text-white">{selectedNode.name}</h4>
            <button 
              className="text-gray-400 hover:text-white"
              onClick={() => setSelectedNodeId(null)}
            >
              ✕
            </button>
          </div>
          
          <div className="text-xs mb-2 flex items-center text-white">
            <div 
              className="w-3 h-3 rounded-full mr-1" 
              style={{ backgroundColor: DOMAIN_COLORS[selectedNode.domain as KnowledgeDomain] }}
            ></div>
            <span>{selectedNode.domain.replace(/-/g, ' ')}</span>
            <span className="ml-auto">{selectedNode.mastery}% mastery</span>
          </div>
          
          {/* Status badges */}
          <div className="flex flex-wrap gap-1 mt-1 mb-2">
            {selectedNode.unlocked ? (
              <span className="px-2 py-0.5 bg-green-800 text-green-100 rounded-full text-xs">Unlocked</span>
            ) : (
              <span className="px-2 py-0.5 bg-gray-700 text-gray-300 rounded-full text-xs">Locked</span>
            )}
            
            {selectedNode.active ? (
              <span className="px-2 py-0.5 bg-yellow-600 text-yellow-100 rounded-full text-xs">Active</span>
            ) : (
              <span className="px-2 py-0.5 bg-gray-700 text-gray-300 rounded-full text-xs">Inactive</span>
            )}
          </div>
          
          <div className="mt-3">
            <h5 className="text-xs font-bold mb-1 text-gray-400">CONNECTIONS ({
              discoveredConnections.filter(conn => 
                conn.source === selectedNode.id || conn.target === selectedNode.id
              ).length
            })</h5>
            
            <div className="max-h-48 overflow-y-auto space-y-1">
              {discoveredConnections
                .filter(conn => conn.source === selectedNode.id || conn.target === selectedNode.id)
                .map(conn => {
                  const connectedNodeId = conn.source === selectedNode.id ? conn.target : conn.source;
                  const connectedNode = nodes.find(n => n.id === connectedNodeId);
                  if (!connectedNode) return null;
                  
                  return (
                    <div 
                      key={connectedNodeId} 
                      className="flex items-center p-1 hover:bg-gray-800 rounded"
                      onClick={() => {
                        // Allow clicking any discovered node, regardless of locked status
                        if (connectedNode.discovered) {
                          setSelectedNodeId(connectedNodeId);
                        }
                      }}
                      style={{ 
                        cursor: connectedNode.discovered ? 'pointer' : 'default',
                        opacity: connectedNode.discovered ? (connectedNode.unlocked ? 1 : 0.7) : 0.3
                      }}
                    >
                      <div 
                        className="w-2 h-2 rounded-full mr-1" 
                        style={{ backgroundColor: DOMAIN_COLORS[connectedNode.domain as KnowledgeDomain] }}
                      ></div>
                      <span className="text-white">{connectedNode.name}</span>
                      <span className="ml-auto text-xs text-gray-400">{Math.round(conn.strength)}%</span>
                    </div>
                  );
                })}
            </div>
          </div>
          
          {interactive && (
            <div className="mt-2 grid grid-cols-2 gap-1">
              <button 
                onClick={() => updateMastery(selectedNode.id, 10)}
                className="p-1 bg-blue-800 rounded hover:bg-blue-700 text-white text-sm"
              >
                +10% Mastery
              </button>
              
              {selectedNode.unlocked ? (
                // For unlocked stars, show activate/deactivate button
                <button 
                  onClick={() => toggleNodeActive(selectedNode.id, !selectedNode.active)}
                  className={`p-1 rounded text-white text-sm ${
                    selectedNode.active 
                      ? 'bg-gray-700 hover:bg-gray-600' 
                      : 'bg-yellow-700 hover:bg-yellow-600'
                  }`}
                >
                  {selectedNode.active ? 'Deactivate' : 'Activate'}
                </button>
              ) : (
                // For locked stars, show unlock button with cost
                <button 
                  onClick={() => unlockNode(selectedNode.id)}
                  className={`p-1 rounded text-white text-sm ${
                    starPoints >= 1 
                      ? 'bg-green-800 hover:bg-green-700' 
                      : 'bg-gray-700 cursor-not-allowed'
                  }`}
                  disabled={starPoints < 1}
                >
                  Unlock (1 SP)
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Add ConnectionDetails component */}
      {selectedConnection && (
        <div className="absolute right-4 top-1/4 bg-gray-800 bg-opacity-90 p-4 rounded-lg shadow-lg border border-gray-600 max-w-xs text-white z-10">
          <div className="flex justify-between mb-2">
            <h3 className="font-semibold text-lg">Connection</h3>
            <button 
              onClick={() => setSelectedConnection(null)} 
              className="text-gray-400 hover:text-white"
            >
              ✕
            </button>
          </div>
          <div className="mb-3">
            <div className="text-sm text-gray-300">Between</div>
            <div className="flex items-center justify-between">
              <div className="font-medium">{selectedConnection.sourceName}</div>
              <div className="mx-2">↔</div>
              <div className="font-medium">{selectedConnection.targetName}</div>
            </div>
          </div>
          <div className="mb-3">
            <div className="text-sm text-gray-300">Description</div>
            <div className="text-sm">{selectedConnectionDescription}</div>
          </div>
          <div className="mb-1">
            <div className="text-sm text-gray-300">Mastery</div>
            <div className="w-full bg-gray-700 h-2 rounded-full">
              <div 
                className="bg-blue-500 h-2 rounded-full" 
                style={{ width: `${selectedConnection.strength}%` }}
              />
            </div>
            <div className="text-xs text-right text-gray-400">{Math.round(selectedConnection.strength)}%</div>
          </div>
          {selectedConnection.patternIds.length > 0 && (
            <div className="mt-2">
              <div className="text-sm text-gray-300">Part of pattern:</div>
              <div className="flex flex-wrap gap-1 mt-1">
                {selectedConnection.patternIds.map(patternId => (
                  <span 
                    key={patternId}
                    className="text-xs bg-indigo-800 px-2 py-1 rounded"
                  >
                    {patternId}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}