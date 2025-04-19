// app/components/knowledge/ConstellationView.tsx
'use client';
/**
 * Enhanced ConstellationView with improved visualization using D3
 * 
 * Simplified version based on SimpleConstellationTest implementation
 */
import React, { useState, useEffect, useRef } from 'react';
import useKnowledgeStore, { KnowledgeDomain } from '../../store/knowledgeStore';
import { DOMAIN_COLORS } from '../../core/themeConstants';
import { GameEventType } from '@/app/core/events/EventTypes';
import { safeDispatch, useEventBus } from '@/app/core/events/CentralEventBus';
import * as d3 from 'd3';

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
  mastery: number;
  patterns: string[];
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
}

interface Link {
  source: string;
  target: string;
  strength: number;
  discovered: boolean;
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

  // ========= STORE ACCESS =========
  const { 
    nodes, 
    connections, 
    discoverConcept, 
    updateMastery, 
    createConnection,
    addStarPoints,
    starPoints
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
    
    // Filter nodes to include
    const filteredNodes = nodes.filter(n => 
      n.discovered || (interactive && patternNodeIds.includes(n.id))
    );
    
    // Transform to simulation nodes
    const d3Nodes: Node[] = filteredNodes.map(node => {
      // Find which patterns this node belongs to
      const nodePatterns = patterns
        .filter(p => p.starIds.includes(node.id))
        .map(p => p.id);
      
      // Use node position if available, or calculate initial position
      const x = node.position?.x || (Math.random() - 0.5) * 500;
      const y = node.position?.y || (Math.random() - 0.5) * 500;
      
      return {
        id: node.id,
        name: node.name,
        x: x,
        y: y,
        radius: node.discovered ? 
          Math.max(10, 5 + (node.mastery / 10)) : 
          7,
        domain: node.domain,
        discovered: node.discovered,
        mastery: node.mastery,
        patterns: nodePatterns
      };
    });
    
    // Transform connections to links - using discoveredConnections from the memoized value
    const d3Links: Link[] = discoveredConnections.map(conn => {
      // Find which patterns this connection belongs to
      const connPatterns: string[] = [];
      
      for (const pattern of patterns) {
        const sourceInPattern = pattern.starIds.includes(conn.source);
        const targetInPattern = pattern.starIds.includes(conn.target);
        
        if (sourceInPattern && targetInPattern) {
          connPatterns.push(pattern.id);
        }
      }
      
      return {
        source: conn.source,
        target: conn.target,
        strength: conn.strength,
        discovered: conn.discovered,
        patternIds: connPatterns
      };
    });
    
    setSimulationNodes(d3Nodes);
    setSimulationLinks(d3Links);
  }, [nodes, connections, interactive]); // Remove discoveredConnections as it's derived from connections

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
    
    // Process links
    const linkElements = linkGroup.selectAll('line')
      .data(simulationLinks)
      .enter()
      .append('line')
      .attr('stroke', d => {
        // If we have an active pattern, highlight links belonging to it
        if (activePatternId && d.patternIds.includes(activePatternId)) {
          return getPatternColor(activePatternId);
        }
        // Default link color based on connection strength
        return `rgba(180, 180, 255, ${0.3 + (d.strength / 200)})`;
      })
      .attr('stroke-width', d => {
        // Thicker lines for pattern links when a pattern is active
        if (activePatternId && d.patternIds.includes(activePatternId)) {
          return 3;
        }
        return 1.5;
      })
      .attr('opacity', d => {
        // Full opacity for active pattern links
        if (activePatternId && d.patternIds.includes(activePatternId)) {
          return 1;
        }
        return 0.6;
      });
    
    // Add light glow to links
    linkGroup.selectAll('line')
      .each(function(d: any) {
        if (activePatternId && d.patternIds.includes(activePatternId)) {
          d3.select(this).attr('filter', `url(#glow-${activePatternId})`);
        }
      });
    
    // Process nodes - use image elements instead of circles
    const nodeElements = nodeGroup.selectAll('image')
      .data(simulationNodes)
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
        // Increase size for domain stars
        return d.id === d.domain ? d.radius * 3 : d.radius * 2;
      })
      .attr('height', (d: Node) => {
        // Increase size for domain stars
        return d.id === d.domain ? d.radius * 3 : d.radius * 2;
      })
      .attr('x', (d: Node) => {
        // Adjust position for increased size of domain stars
        return d.id === d.domain ? -d.radius * 1.5 : -d.radius;
      })
      .attr('y', (d: Node) => {
        // Adjust position for increased size of domain stars
        return d.id === d.domain ? -d.radius * 1.5 : -d.radius;
      })
      .attr('image-rendering', 'pixelated') // Ensure pixel art stays sharp
      .style('filter', (d: Node) => {
        // Add stronger glow effect for selected node
        if (d.id === selectedNodeId) {
          return 'url(#glow) drop-shadow(0 0 8px rgba(255, 255, 255, 0.8))';
        }
        if (activePatternId && d.patterns.includes(activePatternId)) {
          return `url(#glow-${activePatternId})`;
        }
        return 'url(#glow)';
      })
      .style('cursor', 'pointer')
      .style('opacity', (d: Node) => {
        // Full opacity for selected node
        if (d.id === selectedNodeId) return 1;
        // Normal opacity rules for other nodes
        return d.discovered ? 1 : 0.5;
      })
      .on('click', (event: any, d: Node) => {
        event.stopPropagation(); // Prevent SVG background click
        if (interactive) {
          setSelectedNodeId(prev => prev === d.id ? null : d.id);
          
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
          if (activePatternId && d.patterns.includes(activePatternId)) {
            return '#ffffff';
          }
          return d.discovered ? 'rgba(255, 255, 255, 0.8)' : 'rgba(150, 150, 200, 0.4)';
        })
        .attr('text-anchor', 'middle')
        .attr('dy', d => -d.radius - 5)
        .style('pointer-events', 'none')
        .style('text-shadow', '0px 1px 2px rgba(0,0,0,0.8)')
        .style('opacity', d => {
          // Show labels for selected node and in active patterns
          if (d.id === selectedNodeId) return 1;
          if (activePatternId && d.patterns.includes(activePatternId)) return 1;
          return showLabels ? 0.7 : 0; // Show all labels if enabled
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
      .force('collision', d3.forceCollide().radius((d: any) => d.radius + 15));
    
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
    connections
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
        {interactive && onClose && (
          <button 
            onClick={onClose}
            className="bg-gray-800 hover:bg-gray-700 text-white p-2 rounded-full"
          >
            ✕
          </button>
        )}
      </div>
      
      {/* Pattern Selection - only if we have patterns */}
      {patterns.length > 0 && (
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
        <div className="absolute right-4 top-16 w-64 bg-gray-900 bg-opacity-90 p-3 rounded-md shadow-lg border border-gray-700">
          <div className="flex justify-between items-center mb-2">
            <h4 className="font-bold text-white">{selectedNode.name}</h4>
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
          
          {interactive && (
            <div className="mt-2 grid grid-cols-2 gap-1">
              <button 
                onClick={() => updateMastery(selectedNode.id, 10)}
                className="p-1 bg-blue-800 rounded hover:bg-blue-700 text-white text-sm"
              >
                +10% Mastery
              </button>
              <button 
                onClick={() => {
                  // Show a simplified connection UI
                  alert('Connection feature would go here');
                }}
                className="p-1 bg-orange-800 rounded hover:bg-orange-700 text-white text-sm"
              >
                Connect
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}