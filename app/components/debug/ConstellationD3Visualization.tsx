'use client';

import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import useKnowledgeStore from '@/app/store/knowledgeStore';
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
  const { nodes: storeNodes, connections } = useKnowledgeStore();
  const svgRef = useRef<SVGSVGElement>(null);
  const [activePattern, setActivePattern] = useState<string | null>(null);
  const [simulationNodes, setSimulationNodes] = useState<Node[]>([]);
  const [simulationLinks, setSimulationLinks] = useState<Link[]>([]);
  
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
    const nodeElements = nodeGroup.selectAll('circle')
      .data(simulationNodes)
      .enter()
      .append('circle')
      .attr('r', d => d.radius)
      .attr('fill', d => {
        // If we have an active pattern, highlight nodes belonging to it
        if (activePattern && d.patterns.includes(activePattern)) {
          return getPatternColor(activePattern);
        }
        // Default node color based on domain
        return d.discovered ? 
          DOMAIN_COLORS[d.domain] : 
          'rgba(80, 80, 100, 0.5)';
      })
      .attr('stroke', d => {
        if (activePattern && d.patterns.includes(activePattern)) {
          return '#ffffff';
        }
        return d.discovered ? 'rgba(255, 255, 255, 0.4)' : 'rgba(100, 100, 150, 0.3)';
      })
      .attr('stroke-width', 1.5)
      .attr('filter', d => {
        if (activePattern && d.patterns.includes(activePattern)) {
          return `url(#glow-${activePattern})`;
        }
        return 'url(#glow)';
      })
      .style('cursor', 'move');
    
    // Node labels
    const nodeLabels = nodeGroup.selectAll('text')
      .data(simulationNodes)
      .enter()
      .append('text')
      .text(d => d.name)
      .attr('font-size', '11px')
      .attr('fill', d => {
        if (activePattern && d.patterns.includes(activePattern)) {
          return '#ffffff';
        }
        return d.discovered ? 'rgba(255, 255, 255, 0.8)' : 'rgba(150, 150, 200, 0.4)';
      })
      .attr('text-anchor', 'middle')
      .attr('dy', d => -d.radius - 5)
      .style('pointer-events', 'none');
    
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
        .attr('cx', d => d.x)
        .attr('cy', d => d.y);
      
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
    const nodeDrag = d3.drag<SVGCircleElement, any>()
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
  }, [simulationNodes, simulationLinks, activePattern]);
  
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
      </div>
      
      <div className="mt-2 text-xs text-gray-400 flex flex-wrap gap-4">
        <span className="flex items-center">
          <svg viewBox="0 0 24 24" className="w-3 h-3 fill-current mr-1">
            <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
          </svg>
          Nodes: Drag to reposition
        </span>
      </div>
    </div>
  );
};

export default ConstellationD3Visualization; 