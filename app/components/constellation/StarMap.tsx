import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import * as d3 from 'd3';
import { useKnowledgeStore } from '@/app/store/knowledgeStore';
import { KnowledgeStar, KnowledgeDomain, DomainColors } from '@/app/types';
import styled from 'styled-components';
import pixelTheme, { colors, spacing } from '@/app/styles/pixelTheme';

const MapContainer = styled.div`
  width: 100%;
  height: 100%;
  background-color: ${colors.background};
  border-radius: 8px;
  overflow: hidden;
  ${pixelTheme.mixins.pixelPerfect}
  position: relative;
`;

const LegendContainer = styled.div`
  position: absolute;
  top: 20px;
  right: 20px;
  background-color: rgba(0, 0, 0, 0.7);
  padding: 10px;
  border-radius: 4px;
  z-index: 10;
`;

const LegendItem = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 5px;
`;

const LegendColor = styled.div<{ $bgColor: string }>`
  width: 16px;
  height: 16px;
  background-color: ${props => props.$bgColor};
  margin-right: 8px;
`;

const LegendText = styled.span`
  color: ${colors.text};
  font-size: 12px;
  font-family: monospace;
`;

interface StarMapProps {
  width?: number;
  height?: number;
}

// Extended star data for simulation
interface SimulationStar extends KnowledgeStar {
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
}

export const StarMap: React.FC<StarMapProps> = React.memo(({ 
  width: propWidth, 
  height: propHeight 
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: propWidth || 600, height: propHeight || 400 });
  const starPositionsRef = useRef<{[id: string]: {x: number, y: number}}>({}); // Use ref instead of state
  const simulationRef = useRef<d3.Simulation<SimulationStar, undefined> | null>(null);
  const nodesRef = useRef<SimulationStar[]>([]);
  const draggedNodeRef = useRef<SimulationStar | null>(null);
  const initialized = useRef(false);
  const animationFrameRef = useRef<number | null>(null);
  const lastTickRef = useRef<number>(0);
  const previousDiscoveredCountRef = useRef<number>(0);
  
  // Get stars from the knowledge store
  const starsObject = useKnowledgeStore(state => state.stars);
  const knowledgeStore = useKnowledgeStore();
  
  // Use ResizeObserver to detect container size changes
  useEffect(() => {
    if (!containerRef.current) return;
    
    const updateDimensions = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        if (width > 0 && height > 0) {
          setDimensions({ width, height });
        }
      }
    };
    
    // Initial measurement
    updateDimensions();
    
    // Setup resize observer
    const resizeObserver = new ResizeObserver(updateDimensions);
    resizeObserver.observe(containerRef.current);
    
    return () => {
      resizeObserver.disconnect();
    };
  }, []);
  
  // Memoize derived data to prevent unnecessary recalculations
  const { stars, discoveredStars, unlockedStars, activeStars } = useMemo(() => {
    const stars = Object.values(starsObject);
    return {
      stars,
      discoveredStars: stars.filter(star => star.discovered),
      unlockedStars: stars.filter(star => star.unlocked),
      activeStars: stars.filter(star => star.unlocked && star.active)
    };
  }, [starsObject]);
  
  // Load initial positions from localStorage
  useEffect(() => {
    const loadPositions = async () => {
      try {
        // Use localStorage for persistent positions
        const savedPositions = localStorage.getItem('starPositions');
        if (savedPositions) {
          starPositionsRef.current = JSON.parse(savedPositions);
        }
      } catch (e) {
        console.error("Failed to load star positions:", e);
      }
    };
    
    if (!initialized.current) {
      loadPositions();
      initialized.current = true;
    }
  }, []);
  
  // Store positions persistently but avoid React state updates
  const persistCurrentPositions = useCallback(() => {
    if (!nodesRef.current.length) return;
    
    const newPositions = nodesRef.current.reduce((positions, node) => {
      if (node.x !== undefined && node.y !== undefined && node.id) {
        positions[node.id] = { x: node.x, y: node.y };
      }
      return positions;
    }, {} as {[id: string]: {x: number, y: number}});
    
    // Update ref (doesn't cause re-render)
    starPositionsRef.current = {
      ...starPositionsRef.current,
      ...newPositions
    };
    
    // Debounced localStorage update with throttling
    // Use a smaller, serialized subset of data to reduce storage size
    const throttleMs = 5000; // Only persist at most once every 5 seconds
    const now = Date.now();
    if (now - lastTickRef.current > throttleMs) {
      lastTickRef.current = now;
      try {
        // Only store necessary position data (x,y coordinates only)
        const minimalPositions = Object.entries(starPositionsRef.current).reduce((acc, [id, pos]) => {
          acc[id] = { x: pos.x, y: pos.y };
          return acc;
        }, {} as {[id: string]: {x: number, y: number}});
        
        localStorage.setItem('starPositions', JSON.stringify(minimalPositions));
      } catch (e) {
        console.error("Failed to persist star positions:", e);
      }
    }
  }, []);
  
  // Force simulation recreation when new stars are discovered
  const rebuildSimulationIfNeeded = useCallback(() => {
    const currentDiscoveredCount = discoveredStars.length;
    const currentUnlockedCount = unlockedStars.length;
    const currentActiveCount = activeStars.length;
    
    // Store references to previous counts
    const prevDiscoveredCount = previousDiscoveredCountRef.current;
    
    // Track if we need to rebuild
    const needsRebuild = prevDiscoveredCount !== currentDiscoveredCount || 
                         unlockedStars.some(star => nodesRef.current.some(
                           node => node.id === star.id && !node.unlocked
                         ));

    // Check if discovered count or unlocked count has changed
    if (needsRebuild) {
      console.log("Rebuilding simulation due to star state changes");
      
      // Update the reference count
      previousDiscoveredCountRef.current = currentDiscoveredCount;
      
      // Clean up existing simulation
      if (simulationRef.current) {
        simulationRef.current.stop();
        simulationRef.current = null;
      }
      
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      
      // Force d3 content recreation on next render
      if (svgRef.current) {
        d3.select(svgRef.current).selectAll('*').remove();
      }
    }
  }, [discoveredStars.length, unlockedStars.length, activeStars.length]);
  
  // Setup and update D3 visualization - but make sure it doesn't restart on re-renders
  useEffect(() => {
    if (!svgRef.current) return;
    
    // Check if we need to rebuild the simulation due to new stars
    rebuildSimulationIfNeeded();
    
    // Skip recreation if simulation already exists
    if (simulationRef.current) {
      return;
    }
    
    // Store current discovered count
    previousDiscoveredCountRef.current = discoveredStars.length;
    
    // Clear existing content
    d3.select(svgRef.current).selectAll('*').remove();
    
    // Create SVG
    const svg = d3.select(svgRef.current);
    
    // Define pixel size for stars
    const pixelSize = 8;
    
    // Get current dimensions
    const { width, height } = dimensions;
    
    // Calculate domain ranges
    const xExtent = d3.extent(discoveredStars, d => starPositionsRef.current[d.id]?.x || d.position.x) as [number, number];
    const yExtent = d3.extent(discoveredStars, d => starPositionsRef.current[d.id]?.y || d.position.y) as [number, number];
    
    // Scale functions with padding
    const padding = 40;
    const xScale = d3.scaleLinear()
      .domain([xExtent[0] - padding, xExtent[1] + padding])
      .range([20, width - 20]);
    
    const yScale = d3.scaleLinear()
      .domain([yExtent[0] - padding, yExtent[1] + padding])
      .range([20, height - 20]);
    
    // Inverse scale functions for drag
    const xInverseScale = d3.scaleLinear()
      .domain([20, width - 20])
      .range([xExtent[0] - padding, xExtent[1] + padding]);
      
    const yInverseScale = d3.scaleLinear()
      .domain([20, height - 20])
      .range([yExtent[0] - padding, yExtent[1] + padding]);
    
    // Add background grid more efficiently
    const gridGroup = svg.append('g').attr('class', 'grid');
    
    // Create a single path for horizontal lines instead of multiple elements
    const horizontalGridPath = d3.range(0, height, 20)
      .map(y => `M0,${y}H${width}`)
      .join(' ');
      
    gridGroup.append('path')
      .attr('d', horizontalGridPath)
      .attr('stroke', colors.border)
      .attr('stroke-width', 0.5)
      .attr('opacity', 0.2)
      .attr('fill', 'none');
      
    // Create a single path for vertical lines
    const verticalGridPath = d3.range(0, width, 20)
      .map(x => `M${x},0V${height}`)
      .join(' ');
      
    gridGroup.append('path')
      .attr('d', verticalGridPath)
      .attr('stroke', colors.border)
      .attr('stroke-width', 0.5)
      .attr('opacity', 0.2)
      .attr('fill', 'none');
    
    // Prepare data for force simulation
    const simulationNodes: SimulationStar[] = discoveredStars.map(star => {
      // Use stored position if available, otherwise use original position
      const initialX = xScale(starPositionsRef.current[star.id]?.x || star.position.x);
      const initialY = yScale(starPositionsRef.current[star.id]?.y || star.position.y);
      
      return {
        ...star,
        x: initialX,
        y: initialY,
        vx: 0, // Initial velocity x
        vy: 0  // Initial velocity y
      };
    });
    
    // Store nodes reference
    nodesRef.current = simulationNodes;
    
    // Create force simulation with pool-table physics
    const simulation = d3.forceSimulation<SimulationStar>(simulationNodes)
      .alphaDecay(0.01) // Very slow decay so stars settle naturally
      .velocityDecay(0.4) // Friction - higher = faster damping
      .force('collision', d3.forceCollide().radius(pixelSize * 2).strength(0.8)) // Stronger collision for pool-like bounces
      .force('bounds', () => {
        // Custom force to keep stars within bounds (like pool table bumpers)
        // Only check stars that are close to edges for better performance
        simulationNodes.forEach(node => {
          if (!node.x || !node.y) return;
          
          const r = pixelSize;
          const minX = r;
          const maxX = width - r;
          const minY = r;
          const maxY = height - r;
          
          // Only apply forces if near an edge
          if (node.x < minX + r || node.x > maxX - r || node.y < minY + r || node.y > maxY - r) {
            // Bounce off walls by reversing velocity with some energy loss
            if (node.x < minX) {
              node.x = minX;
              if (node.vx && node.vx < 0) node.vx = -node.vx * 0.7; // 30% energy loss on bounce
            }
            
            if (node.x > maxX) {
              node.x = maxX;
              if (node.vx && node.vx > 0) node.vx = -node.vx * 0.7;
            }
            
            if (node.y < minY) {
              node.y = minY;
              if (node.vy && node.vy < 0) node.vy = -node.vy * 0.7;
            }
            
            if (node.y > maxY) {
              node.y = maxY;
              if (node.vy && node.vy > 0) node.vy = -node.vy * 0.7;
            }
          }
        });
      });

    // Run simulation with adaptive alpha target to save CPU when idle
    simulation.alphaTarget(0.01);
    // Reduce alpha target after initial settling to save CPU
    setTimeout(() => {
      if (simulation && !draggedNodeRef.current) {
        simulation.alphaTarget(0.001); // Lower energy state when idle
      }
    }, 5000);
    
    // Store simulation reference
    simulationRef.current = simulation;
       
    // Create connections container
    const connections = svg.append('g')
      .attr('class', 'connections');
       
    // Create stars container
    const starsGroup = svg.append('g')
      .attr('class', 'stars');
    
    // Create a drag handler with physics-based momentum
    const dragHandler = d3.drag<SVGRectElement, SimulationStar>()
      .on('start', function(event, d) {
        // Highlight the star being dragged
        d3.select(this).raise().attr('stroke', '#ffff00');
        
        // Store the node being dragged
        draggedNodeRef.current = d;
        
        // When dragging starts, fix the node position
        simulation.alphaTarget(0.3); // Increase activity
        
        // Zero out existing velocity
        d.vx = 0;
        d.vy = 0;
        
        // Fix position during drag
        d.fx = d.x;
        d.fy = d.y;
      })
      .on('drag', function(event, d) {
        // Update the fixed position (fx/fy) during drag
        d.fx = event.x;
        d.fy = event.y;
      })
      .on('end', function(event, d) {
        // Reset stroke to original
        d3.select(this).attr('stroke', d.unlocked ? '#ffffff' : 'none');
        
        // Calculate final velocity based on drag movement
        const speedFactor = 0.2; // Adjust this to control how much drag translates to momentum
        
        if (event.dx) d.vx = event.dx * speedFactor;
        if (event.dy) d.vy = event.dy * speedFactor;
        
        // Release the fixed position when drag ends
        d.fx = null;
        d.fy = null;
        
        // Let the simulation cool down gradually
        simulation.alphaTarget(0.1);
        
        // Schedule alpha reduction to low energy state
        setTimeout(() => {
          if (simulation && !draggedNodeRef.current) {
            simulation.alphaTarget(0.001);
          }
        }, 3000);
        
        // Clear the dragged node reference
        draggedNodeRef.current = null;
        
        // Schedule a one-time persistence after drag ends
        setTimeout(() => {
          persistCurrentPositions();
        }, 3000);
      });
      
    // Add stars (pixelated style)
    const starElements = starsGroup
      .selectAll('rect')
      .data(simulationNodes)
      .enter()
      .append('rect')
      .attr('width', pixelSize)
      .attr('height', pixelSize)
      .attr('fill', d => {
        if (d.unlocked && d.active) {
          return DomainColors[d.domain];
        } else if (d.unlocked) {
          return d3.color(DomainColors[d.domain])?.copy({ opacity: 0.6 }) as string;
        } else {
          return colors.inactive;
        }
      })
      .attr('stroke', d => d.unlocked ? '#ffffff' : 'none')
      .attr('stroke-width', 1)
      .attr('shape-rendering', 'crispEdges')
      .style('cursor', 'move'); // Change cursor to indicate draggable
    
    // Set initial positions
    starElements
      .attr('x', d => (d.x || 0) - pixelSize/2)
      .attr('y', d => (d.y || 0) - pixelSize/2);
    
    // Apply drag behavior to stars
    starElements.call(dragHandler);
    
    // Add glow effects group
    const glowEffects = svg.append('g')
      .attr('class', 'glow-effects');
      
    // Memoized active stars object to prevent unnecessary redraws
    let previousActiveStarsMap = new Map<string, SimulationStar>();
    
    // Draw connections function - optimized to avoid unnecessary redraws
    const updateConnections = () => {
      // Clear previous connections
      connections.selectAll('*').remove();
      
      // Get all unlocked stars
      const unlockedNodes = simulationNodes.filter(star => star.unlocked);
      
      // Create connections between all unlocked stars
      for (let i = 0; i < unlockedNodes.length; i++) {
        const sourceStar = unlockedNodes[i];
        
        for (let j = i + 1; j < unlockedNodes.length; j++) {
          const targetStar = unlockedNodes[j];
          
          connections.append('line')
            .attr('x1', sourceStar.x || 0)
            .attr('y1', sourceStar.y || 0)
            .attr('x2', targetStar.x || 0)
            .attr('y2', targetStar.y || 0)
            .attr('stroke', colors.starGlow)
            .attr('stroke-width', 1)
            .attr('opacity', 0.4);
        }
      }
    };
    
    // Previous glow state to prevent unnecessary redraws
    let lastGlowUpdate = 0;
    
    // Draw glow effects function - optimized to redraw less frequently
    const updateGlowEffects = (now: number) => {
      // Only update glows every 100ms to save performance
      if (now - lastGlowUpdate < 100) return;
      lastGlowUpdate = now;
      
      glowEffects.selectAll('*').remove();
      
      simulationNodes
        .filter(star => star.unlocked && star.active)
        .forEach(star => {
          glowEffects.append('rect')
            .attr('class', 'star-glow')
            .attr('x', (star.x || 0) - pixelSize)
            .attr('y', (star.y || 0) - pixelSize)
            .attr('width', pixelSize * 2)
            .attr('height', pixelSize * 2)
            .attr('fill', 'none')
            .attr('stroke', DomainColors[star.domain])
            .attr('stroke-width', 1)
            .attr('opacity', 0.3)
            .attr('shape-rendering', 'crispEdges');
        });
    };
       
    // Initial draw
    updateConnections();
    updateGlowEffects(Date.now());
    
    // Use requestAnimationFrame for more efficient updates
    const updateVisuals = () => {
      if (!simulationRef.current) return;
      
      const now = Date.now();
      
      // Update star positions and appearance
      starElements
        .attr('x', d => (d.x || 0) - pixelSize/2)
        .attr('y', d => (d.y || 0) - pixelSize/2)
        .attr('fill', d => {
          // Re-check the unlocked state from the store data
          const currentStar = starsObject[d.id];
          const isUnlocked = currentStar?.unlocked || false;
          const isActive = currentStar?.active || false;
          
          if (isUnlocked && isActive) {
            return DomainColors[d.domain];
          } else if (isUnlocked) {
            return d3.color(DomainColors[d.domain])?.copy({ opacity: 0.6 }) as string;
          } else {
            return colors.inactive;
          }
        })
        .attr('stroke', d => {
          const currentStar = starsObject[d.id];
          return currentStar?.unlocked ? '#ffffff' : 'none';
        });
      
      // Update connections and glow effects with time-based throttling
      updateConnections();
      updateGlowEffects(now);
      
      // Schedule next frame
      animationFrameRef.current = requestAnimationFrame(updateVisuals);
    };
    
    // Start visual updates loop
    animationFrameRef.current = requestAnimationFrame(updateVisuals);
    
    // Handle simulation ticks separately from visual updates
    simulation.on('tick', () => {
      // The tick function is now empty as visual updates happen in requestAnimationFrame
      // This separation improves performance by decoupling physics from rendering
    });
    
    // Add stats counter
    svg.append('text')
      .attr('x', 20)
      .attr('y', 30)
      .attr('fill', colors.text)
      .style('font-size', '14px')
      .style('font-family', 'monospace')
      .text(`Active: ${activeStars.length} / ${unlockedStars.length} stars`);
    
    // Clean up
    return () => {
      if (simulationRef.current) {
        simulationRef.current.stop();
      }
      
      // Cancel any ongoing animation frame
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      
      // Sync with localStorage on unmount
      if (nodesRef.current.length > 0) {
        persistCurrentPositions();
        
        // We're not using the knowledge store for positions anymore since
        // setStarPositions isn't available. Positions are stored in localStorage.
      }
    };
    
  }, [svgRef, discoveredStars, unlockedStars, activeStars, dimensions, persistCurrentPositions, rebuildSimulationIfNeeded]);
  
  // Check for new stars outside the main effect to ensure detection works
  useEffect(() => {
    rebuildSimulationIfNeeded();
  }, [discoveredStars.length, unlockedStars.length, activeStars.length, rebuildSimulationIfNeeded]);
  
  return (
    <MapContainer ref={containerRef}>
      <svg 
        ref={svgRef}
        width={dimensions.width}
        height={dimensions.height}
        style={{ display: 'block' }}
      />
      <LegendContainer>
        {Object.values(KnowledgeDomain).map((domain, index) => (
          <LegendItem key={index}>
            <LegendColor $bgColor={DomainColors[domain]} />
            <LegendText>{domain.replace('_', ' ')}</LegendText>
          </LegendItem>
        ))}
      </LegendContainer>
    </MapContainer>
  );
}); 