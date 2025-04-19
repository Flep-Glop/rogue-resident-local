'use client';

import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import useKnowledgeStore, { KnowledgeDomain } from '@/app/store/knowledgeStore';
import { SIMPLE_PATTERNS } from './SimplePatterns';
import { DOMAIN_COLORS } from '@/app/core/themeConstants';

interface Node {
  id: string;
  name: string;
  x: number;
  y: number;
  z: number;
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

// Component for D3 visualization of patterns with 2.5D effects
const ConstellationD3Visualization: React.FC = () => {
  const { nodes: storeNodes, connections, discoverConcept } = useKnowledgeStore();
  const svgRef = useRef<SVGSVGElement>(null);
  const [activePattern, setActivePattern] = useState<string | null>(null);
  const [simulationNodes, setSimulationNodes] = useState<Node[]>([]);
  const [simulationLinks, setSimulationLinks] = useState<Link[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  
  // Function to unlock all stars
  const unlockAllStars = () => {
    // Find all locked nodes and discover them
    const lockedNodes = storeNodes.filter(n => !n.discovered);
    lockedNodes.forEach(node => {
      discoverConcept(node.id);
    });
  };
  
  // Function to handle node selection
  const handleNodeSelect = (nodeId: string) => {
    // Toggle selection if clicking the same node
    setSelectedNodeId(prevId => prevId === nodeId ? null : nodeId);
  };
  
  // Get selected node data
  const getSelectedNode = () => {
    if (!selectedNodeId) return null;
    return storeNodes.find(n => n.id === selectedNodeId);
  };
  
  // Get connections for a selected node
  const getNodeConnections = (nodeId: string) => {
    return connections.filter(c => 
      c.discovered && (c.source === nodeId || c.target === nodeId)
    );
  };
  
  // Prepare data for D3 simulation
  useEffect(() => {
    // Get only discovered nodes or nodes that are part of patterns
    const patternNodeIds = SIMPLE_PATTERNS.flatMap(p => p.starIds);
    const filteredNodes = storeNodes.filter(n => 
      n.discovered || patternNodeIds.includes(n.id)
    );
    
    // Transform to simulation nodes with 3D coordinates
    const nodes: Node[] = filteredNodes.map(node => {
      // Find which patterns this node belongs to
      const nodePatterns = SIMPLE_PATTERNS
        .filter(p => p.starIds.includes(node.id))
        .map(p => p.id);
      
      // Calculate a more structured initial position
      let x = 0;
      let y = 0;
      
      // Place nodes in a more structured way based on patterns they belong to
      if (nodePatterns.length > 0) {
        // Use the first pattern to determine initial position
        const patternFormation = SIMPLE_PATTERNS.find(p => p.id === nodePatterns[0])?.formation || 'circuit';
        const patternIndex = SIMPLE_PATTERNS.findIndex(p => p.id === nodePatterns[0]);
        const angleOffset = (patternIndex / SIMPLE_PATTERNS.length) * Math.PI * 2;
        
        if (patternFormation === 'circuit' || patternFormation === 'triangle') {
          const nodeIndex = SIMPLE_PATTERNS.find(p => p.id === nodePatterns[0])?.starIds.indexOf(node.id) || 0;
          const totalNodes = SIMPLE_PATTERNS.find(p => p.id === nodePatterns[0])?.starIds.length || 3;
          const angle = (nodeIndex / totalNodes) * Math.PI * 2 + angleOffset;
          const radius = 150;
          x = Math.cos(angle) * radius;
          y = Math.sin(angle) * radius;
        } else if (patternFormation === 'chain') {
          const nodeIndex = SIMPLE_PATTERNS.find(p => p.id === nodePatterns[0])?.starIds.indexOf(node.id) || 0;
          const totalNodes = SIMPLE_PATTERNS.find(p => p.id === nodePatterns[0])?.starIds.length || 4;
          x = ((nodeIndex / (totalNodes - 1)) * 300 - 150) * Math.cos(angleOffset);
          y = ((nodeIndex / (totalNodes - 1)) * 300 - 150) * Math.sin(angleOffset);
        }
      } else {
        // Random position for nodes not in patterns
        x = (Math.random() - 0.5) * 300;
        y = (Math.random() - 0.5) * 300;
      }
      
      return {
        id: node.id,
        name: node.name,
        x: x,
        y: y,
        z: 0, // Remove z variance since we're not doing 3D rotation
        radius: node.discovered ? 
          Math.max(10, 5 + (node.mastery / 10)) : 
          7,
        domain: node.domain,
        discovered: node.discovered,
        mastery: node.mastery,
        patterns: nodePatterns
      };
    });
    
    // Transform connections to links
    const discoveredConnections = connections.filter(c => c.discovered);
    const links: Link[] = discoveredConnections.map(conn => {
      // Find which patterns this connection belongs to
      const connPatterns: string[] = [];
      
      for (const pattern of SIMPLE_PATTERNS) {
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
    
    setSimulationNodes(nodes);
    setSimulationLinks(links);
  }, [storeNodes, connections]);
  
  // D3 visualization
  useEffect(() => {
    if (!svgRef.current || simulationNodes.length === 0) return;
    
    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;
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
      .attr('width', 32)  // Fixed width instead of using d.radius
      .attr('height', 32) // Fixed height instead of using d.radius
      .attr('preserveAspectRatio', 'xMidYMid slice')
      .attr('image-rendering', 'pixelated'); // Keep pixel art sharp

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
    SIMPLE_PATTERNS.forEach(pattern => {
      const patternGlow = defs.append('filter')
        .attr('id', `glow-${pattern.id}`)
        .attr('x', '-50%')
        .attr('y', '-50%')
        .attr('width', '200%')
        .attr('height', '200%');
        
      patternGlow.append('feGaussianBlur')
        .attr('stdDeviation', '4')
        .attr('result', 'blur');
        
      patternGlow.append('feFlood')
        .attr('flood-color', getPatternColor(pattern.id))
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
        .attr('stroke', 'rgba(100, 100, 255, 0.1)')
        .attr('stroke-width', 0.5);
    }
    
    for (let y = -gridSize/2; y <= gridSize/2; y += gridStep) {
      grid.append('line')
        .attr('x1', -gridSize/2)
        .attr('y1', y)
        .attr('x2', gridSize/2)
        .attr('y2', y)
        .attr('stroke', 'rgba(100, 100, 255, 0.1)')
        .attr('stroke-width', 0.5);
    }
    
    // Add pattern shapes before links
    if (activePattern) {
      const pattern = SIMPLE_PATTERNS.find(p => p.id === activePattern);
      if (pattern) {
        const patternShape = container.append('g')
          .attr('class', 'pattern-shape')
          .attr('opacity', 0.2);
          
        // Different shape based on formation type
        if (pattern.formation === 'triangle') {
          // Create triangle shape connecting the nodes
          const patternNodes = simulationNodes.filter(n => n.patterns.includes(activePattern));
          if (patternNodes.length >= 3) {
            patternShape.append('polygon')
              .attr('points', '0,0 0,0 0,0') // Will be updated in tick
              .attr('fill', 'none')
              .attr('stroke', getPatternColor(activePattern))
              .attr('stroke-width', 2)
              .attr('stroke-dasharray', '5,3')
              .attr('opacity', 0.7);
          }
        } else if (pattern.formation === 'circuit') {
          // Create circle/polygon shape connecting the nodes
          const patternNodes = simulationNodes.filter(n => n.patterns.includes(activePattern));
          if (patternNodes.length >= 3) {
            patternShape.append('polygon')
              .attr('points', '0,0 0,0 0,0') // Will be updated in tick
              .attr('fill', getPatternGlowColor(activePattern))
              .attr('stroke', getPatternColor(activePattern))
              .attr('stroke-width', 2)
              .attr('opacity', 0.3);
          }
        } else if (pattern.formation === 'chain') {
          // Create a path connecting the nodes in sequence
          patternShape.append('path')
            .attr('d', 'M0,0 L0,0') // Will be updated in tick
            .attr('fill', 'none')
            .attr('stroke', getPatternColor(activePattern))
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
        if (activePattern && d.patternIds.includes(activePattern)) {
          return getPatternColor(activePattern);
        }
        // Default link color based on connection strength
        return `rgba(180, 180, 255, ${0.3 + (d.strength / 200)})`;
      })
      .attr('stroke-width', d => {
        // Thicker lines for pattern links when a pattern is active
        if (activePattern && d.patternIds.includes(activePattern)) {
          return 3;
        }
        return 1.5;
      })
      .attr('opacity', d => {
        // Full opacity for active pattern links
        if (activePattern && d.patternIds.includes(activePattern)) {
          return 1;
        }
        return 0.6;
      });
      
    // Add light glow to links
    linkGroup.selectAll('line')
      .each(function(d: any) {
        if (activePattern && d.patternIds.includes(activePattern)) {
          d3.select(this).attr('filter', `url(#glow-${activePattern})`);
        }
      });
    
    // Process nodes
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
        if (activePattern && d.patterns.includes(activePattern)) {
          return `url(#glow-${activePattern})`;
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
        handleNodeSelect(d.id);
      });
    
    // Highlight connections for selected node
    if (selectedNodeId) {
      linkElements.style('stroke-width', d => {
        const isSelected = d.source === selectedNodeId || d.target === selectedNodeId;
        return isSelected ? 1.2 : d.patternIds.includes(activePattern!) ? 3 : 1.5;
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
        if (activePattern && d.patternIds.includes(activePattern)) {
          return getPatternColor(activePattern);
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
    } else {
      // Reset node styling when nothing is selected
      nodeElements
        .style('opacity', (d: Node) => d.discovered ? 1 : 0.5)
        .style('filter', (d: Node) => {
          if (activePattern && d.patterns.includes(activePattern)) {
            return `url(#glow-${activePattern})`;
          }
          return 'url(#glow)';
        });
    }
    
    // Click on background to deselect
    svg.on('click', () => {
      setSelectedNodeId(null);
    });
    
    // Node labels
    const nodeLabels = nodeGroup.selectAll('text')
      .data(simulationNodes)
      .enter()
      .append('text')
      .text(d => d.name)
      .attr('font-size', '10px')
      .attr('font-family', 'Inter, system-ui, sans-serif')
      .attr('fill', d => {
        if (activePattern && d.patterns.includes(activePattern)) {
          return '#ffffff';
        }
        return d.discovered ? 'rgba(255, 255, 255, 0.8)' : 'rgba(150, 150, 200, 0.4)';
      })
      .attr('text-anchor', 'middle')
      .attr('dy', d => -d.radius - 5)
      .style('pointer-events', 'none')
      .style('text-shadow', '0px 1px 2px rgba(0,0,0,0.8)')
      .style('opacity', d => {
        // Only show labels for selected node and its connections
        if (selectedNodeId) {
          // This is the selected node
          if (d.id === selectedNodeId) return 1;
          
          // Check if this node is connected to the selected node
          const isConnected = simulationLinks.some(link => 
            (link.source === selectedNodeId && link.target === d.id) || 
            (link.target === selectedNodeId && link.source === d.id)
          );
          
          return isConnected ? 1 : 0;
        }
        
        // When no node is selected and a pattern is active
        if (activePattern && d.patterns.includes(activePattern)) {
          return 1;
        }
        
        // Default: hide all labels when nothing is selected
        return 0;
      });
    
    // Force simulation with stronger centering
    const simulation = d3.forceSimulation()
      .force('link', d3.forceLink()
        .id((d: any) => d.id)
        .distance(d => {
          // Shorter distances for active pattern links
          if (activePattern && (d as any).patternIds?.includes(activePattern)) {
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
      
    // Custom force to create space around selected node
    if (selectedNodeId) {
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
        
        // Also adjust the custom repulsion force to create more dramatic space near selected node
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
            const repulsionRadius = 200; // Increased from 120 for wider effect
            
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
    if (activePattern) {
      const pattern = SIMPLE_PATTERNS.find(p => p.id === activePattern);
      
      if (pattern?.formation === 'triangle') {
        // Triangle formation - push nodes toward triangle vertices
        const patternNodes = simulationNodes.filter(n => n.patterns.includes(activePattern));
        if (patternNodes.length === 3) {
          // Add radial force to form triangle
          simulation.force('radial', d3.forceRadial(120).strength((d: any) => {
            return d.patterns.includes(activePattern) ? 0.3 : 0.05;
          }));
        }
      } else if (pattern?.formation === 'circuit') {
        // Circuit formation - arrange in a circle
        simulation.force('radial', d3.forceRadial(100).strength((d: any) => {
          return d.patterns.includes(activePattern) ? 0.5 : 0.05;
        }));
      } else if (pattern?.formation === 'chain') {
        // Chain formation - strengthen link force for chain nodes
        const linkForce = simulation.force('link') as d3.ForceLink<any, any>;
        if (linkForce) {
          linkForce.strength((d: any) => d.patternIds?.includes(activePattern) ? 1.0 : 0.7);
        }
      }
    }
    
    // Use a custom tick function to handle our nodes
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
      
      // Update nodes
      nodeElements
        .attr('x', (d: Node) => d.x - d.radius)
        .attr('y', (d: Node) => d.y - d.radius);
      
      // Update labels
      nodeLabels
        .attr('x', d => d.x)
        .attr('y', d => d.y);
        
      // Update pattern shapes
      if (activePattern) {
        const patternShape = container.select('.pattern-shape');
        const patternNodes = simulationNodes.filter(n => n.patterns.includes(activePattern));
        const pattern = SIMPLE_PATTERNS.find(p => p.id === activePattern);
        
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
      
      // Keep center point centered
      if (activePattern) {
        const patternNodes = simulationNodes.filter(n => n.patterns.includes(activePattern));
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
    });
    
    // Apply shadow effect to the selected node
    if (selectedNodeId) {
      const selectedNodeElement = nodeElements.filter((d: Node) => d.id === selectedNodeId);
      // Add shadow underneath the selected star for 3D effect
      selectedNodeElement
        .style('filter', 'url(#glow) drop-shadow(0 4px 6px rgba(0, 0, 0, 0.8)) drop-shadow(0 0 8px rgba(255, 255, 255, 0.8))');
    }
    
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
    
    // Add node dragging capability
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
    
    // Cleanup
    return () => {
      simulation.stop();
    };
  }, [simulationNodes, simulationLinks, activePattern, selectedNodeId]);
  
  // Helper function to get color for a pattern
  const getPatternColor = (patternId: string): string => {
    const colorMap: Record<string, string> = {
      'simple-alara-triangle': '#2ecc71', // Green
      'simple-treatment-chain': '#3498db', // Blue
      'simple-qa-circle': '#9b59b6',      // Purple
      'simple-plan-optimization': '#e74c3c' // Red
    };
    
    return colorMap[patternId] || '#f1c40f'; // Default yellow
  };
  
  // Helper function to get lighter version of pattern color (for glows)
  const getPatternGlowColor = (patternId: string): string => {
    const colorMap: Record<string, string> = {
      'simple-alara-triangle': 'rgba(46, 204, 113, 0.5)', // Green glow
      'simple-treatment-chain': 'rgba(52, 152, 219, 0.5)', // Blue glow
      'simple-qa-circle': 'rgba(155, 89, 182, 0.5)',      // Purple glow
      'simple-plan-optimization': 'rgba(231, 76, 60, 0.5)' // Red glow
    };
    
    return colorMap[patternId] || 'rgba(241, 196, 15, 0.5)'; // Default yellow glow
  };
  
  // Get pattern name from ID
  const getPatternName = (patternId: string): string => {
    const pattern = SIMPLE_PATTERNS.find(p => p.id === patternId);
    return pattern ? pattern.name : patternId;
  };
  
  // Element to display selected node information
  const SelectedNodeInfo = () => {
    const selectedNode = getSelectedNode();
    if (!selectedNode) return null;
    
    const nodeConnections = getNodeConnections(selectedNode.id);
    const connectedNodes = nodeConnections.map(conn => {
      const otherId = conn.source === selectedNode.id ? conn.target : conn.source;
      const otherNode = storeNodes.find(n => n.id === otherId);
      return {
        id: otherId,
        name: otherNode?.name || 'Unknown',
        strength: conn.strength,
        domain: otherNode?.domain || 'treatment-planning'  // Use a default domain
      };
    });
    
    return (
      <div className="absolute right-3 top-3 w-64 bg-gray-900 bg-opacity-90 p-3 rounded-md shadow-lg border border-gray-700 text-sm">
        <div className="flex justify-between items-center mb-2">
          <h4 className="font-bold text-md">{selectedNode.name}</h4>
          <button 
            className="text-gray-400 hover:text-white"
            onClick={() => setSelectedNodeId(null)}
          >
            ✕
          </button>
        </div>
        
        <div className="text-xs mb-2 flex items-center">
          <div 
            className="w-3 h-3 rounded-full mr-1" 
            style={{ backgroundColor: DOMAIN_COLORS[selectedNode.domain as KnowledgeDomain] }}
          ></div>
          <span>{selectedNode.domain.replace(/-/g, ' ')}</span>
          <span className="ml-auto">{selectedNode.mastery}% mastery</span>
        </div>
        
        <div className="mt-3">
          <h5 className="text-xs font-bold mb-1 text-gray-400">CONNECTIONS ({connectedNodes.length})</h5>
          {connectedNodes.length > 0 ? (
            <div className="max-h-48 overflow-y-auto space-y-1">
              {connectedNodes.map(node => (
                <div key={node.id} className="flex items-center p-1 hover:bg-gray-800 rounded">
                  <div 
                    className="w-2 h-2 rounded-full mr-1" 
                    style={{ backgroundColor: DOMAIN_COLORS[node.domain as KnowledgeDomain] }}
                  ></div>
                  <span>{node.name}</span>
                  <span className="ml-auto text-xs text-gray-400">{Math.round(node.strength)}%</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-gray-500">No connections</div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="mt-4 bg-gray-800 p-3 rounded-md">
      <h3 className="font-bold mb-2">2.5D Pattern Visualization</h3>
      
      <div className="flex flex-wrap gap-2 mb-3">
        <button
          className={`px-3 py-1 text-sm rounded bg-gray-700 hover:bg-gray-600`}
          onClick={() => setActivePattern(null)}
        >
          Show All Patterns
        </button>
        
        {SIMPLE_PATTERNS.map(pattern => (
          <button
            key={pattern.id}
            className={`px-3 py-1 text-sm rounded ${
              activePattern === pattern.id 
                ? 'ring-2 ring-white' 
                : 'hover:bg-opacity-80'
            }`}
            style={{ backgroundColor: getPatternColor(pattern.id) }}
            onClick={() => setActivePattern(pattern.id)}
          >
            {pattern.name}
          </button>
        ))}

        <button 
          className="px-3 py-1 text-sm rounded ml-auto bg-yellow-600 hover:bg-yellow-500"
          onClick={unlockAllStars}
        >
          Unlock All Stars
        </button>
      </div>
      
      <div className="relative">
        <svg 
          ref={svgRef} 
          width="100%" 
          height="400" 
          className="bg-gray-900 rounded-md"
        ></svg>
        
        {activePattern && (
          <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
            {getPatternName(activePattern)}
          </div>
        )}
        
        {/* Display selected node info */}
        <SelectedNodeInfo />
      </div>
      
      <div className="mt-2 text-xs text-gray-400 flex flex-wrap gap-4">
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
    </div>
  );
};

export default ConstellationD3Visualization; 