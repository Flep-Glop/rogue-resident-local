'use client';

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
  onStarHover?: (star: KnowledgeStar | null, x: number, y: number) => void;
  onStarSelect?: (star: KnowledgeStar | null, x: number, y: number) => void;
  selectedStarId?: string | null;
}

// Simplified star data structure for static rendering
interface StaticStarData extends KnowledgeStar {
  x: number; // Scaled screen x
  y: number; // Scaled screen y
}

export const StarMap: React.FC<StarMapProps> = React.memo(({
  width: propWidth,
  height: propHeight,
  onStarHover,
  onStarSelect,
  selectedStarId
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: propWidth || 600, height: propHeight || 400 });
  // Store calculated static positions keyed by star ID
  const staticPositionsRef = useRef<Map<string, { x: number, y: number }>>(new Map());

  // Get stars from the knowledge store
  const starsObject = useKnowledgeStore(state => state.stars);

  // Use ResizeObserver to detect container size changes
  useEffect(() => {
    if (!containerRef.current) return;

    const updateDimensions = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        if (width > 0 && height > 0) {
          setDimensions({ width, height });
          // Note: Positions will recalculate in the main render effect when dimensions change
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
  const { discoveredStars, unlockedStars, activeStars } = useMemo(() => {
    const stars = Object.values(starsObject);
    const discovered = stars.filter(star => star.discovered);
    const unlocked = discovered.filter(star => star.unlocked); // Filter from discovered
    const active = unlocked.filter(star => star.active); // Filter from unlocked
    return {
      discoveredStars: discovered,
      unlockedStars: unlocked,
      activeStars: active
    };
  }, [starsObject]);

  // Main effect for D3 rendering (static layout)
  useEffect(() => {
    if (!svgRef.current || discoveredStars.length === 0) {
      // Clear SVG if no stars or ref not ready
      if (svgRef.current) {
        d3.select(svgRef.current).selectAll('*').remove();
      }
      staticPositionsRef.current.clear(); // Clear positions if no stars
      return;
    }

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove(); // Clear previous render

    const pixelSize = 8;
    const { width, height } = dimensions;

    // --- Calculate Scales ---
    // Use default extents if only one star exists to prevent scale collapsing
    const xCoords = discoveredStars.map(d => d.position.x);
    const yCoords = discoveredStars.map(d => d.position.y);
    const xExtent = d3.extent(xCoords) as [number, number] || [0, 1];
    const yExtent = d3.extent(yCoords) as [number, number] || [0, 1];

    // Add padding to prevent stars touching edges
    const padding = 40;
    const domainXPadding = (xExtent[1] - xExtent[0]) * 0.1 || padding; // Add relative or fixed padding
    const domainYPadding = (yExtent[1] - yExtent[0]) * 0.1 || padding;

    const xScale = d3.scaleLinear()
      .domain([xExtent[0] - domainXPadding, xExtent[1] + domainXPadding])
      .range([padding, width - padding]);

    const yScale = d3.scaleLinear()
      .domain([yExtent[0] - domainYPadding, yExtent[1] + domainYPadding])
      .range([padding, height - padding]);

    // --- Prepare Static Star Data (Calculate screen positions) ---
    staticPositionsRef.current.clear(); // Clear previous calculations
    const staticStarData: StaticStarData[] = discoveredStars.map(star => {
      const x = xScale(star.position.x);
      const y = yScale(star.position.y);
      staticPositionsRef.current.set(star.id, { x, y }); // Store calculated positions
      return {
        ...star,
        x,
        y,
      };
    });

    // --- Render Grid ---
    const gridGroup = svg.append('g').attr('class', 'grid');
    const horizontalGridPath = d3.range(0, height, 20).map(y => `M0,${y}H${width}`).join(' ');
    gridGroup.append('path')
      .attr('d', horizontalGridPath)
      .attr('stroke', colors.border)
      .attr('stroke-width', 0.5)
      .attr('opacity', 0.2)
      .attr('fill', 'none');
    const verticalGridPath = d3.range(0, width, 20).map(x => `M${x},0V${height}`).join(' ');
    gridGroup.append('path')
      .attr('d', verticalGridPath)
      .attr('stroke', colors.border)
      .attr('stroke-width', 0.5)
      .attr('opacity', 0.2)
      .attr('fill', 'none');

    // --- Render Connections ---
    const connections = svg.append('g')
      .attr('class', 'connections');

    const unlockedStaticStars = staticStarData.filter(star => star.unlocked);

    for (let i = 0; i < unlockedStaticStars.length; i++) {
      const sourceStar = unlockedStaticStars[i];
      for (let j = i + 1; j < unlockedStaticStars.length; j++) {
        const targetStar = unlockedStaticStars[j];
        connections.append('line')
          .attr('x1', sourceStar.x)
          .attr('y1', sourceStar.y)
          .attr('x2', targetStar.x)
          .attr('y2', targetStar.y)
          .attr('stroke', colors.starGlow)
          .attr('stroke-width', 1)
          .attr('opacity', 0.4);
      }
    }

    // --- Render Glow Effects ---
    const glowEffects = svg.append('g')
      .attr('class', 'glow-effects');

    // Active star glows
    staticStarData
      .filter(star => star.unlocked && star.active)
      .forEach(star => {
        glowEffects.append('rect')
          .attr('class', 'star-glow')
          .attr('x', star.x - pixelSize)
          .attr('y', star.y - pixelSize)
          .attr('width', pixelSize * 2)
          .attr('height', pixelSize * 2)
          .attr('fill', 'none')
          .attr('stroke', DomainColors[star.domain])
          .attr('stroke-width', 1)
          .attr('opacity', 0.3)
          .attr('shape-rendering', 'crispEdges')
          .style('pointer-events', 'none'); // Ensure glow doesn't interfere with hover/click
      });

    // Selected star glow
    if (selectedStarId) {
      const selectedStarPos = staticPositionsRef.current.get(selectedStarId);
      if (selectedStarPos) {
        glowEffects.append('rect')
          .attr('class', 'selected-glow')
          .attr('x', selectedStarPos.x - pixelSize * 1.5)
          .attr('y', selectedStarPos.y - pixelSize * 1.5)
          .attr('width', pixelSize * 3)
          .attr('height', pixelSize * 3)
          .attr('fill', 'none')
          .attr('stroke', '#ffcc00')
          .attr('stroke-width', 1)
          .attr('opacity', 0.6)
          .attr('shape-rendering', 'crispEdges')
          .style('pointer-events', 'none');
      }
    }

    // --- Render Stars ---
    const starsGroup = svg.append('g')
      .attr('class', 'stars');

    starsGroup
      .selectAll('rect.star')
      .data(staticStarData, d => d.id) // Use key function for data binding
      .enter()
      .append('rect')
      .attr('class', 'star')
      .attr('x', d => d.x - pixelSize / 2)
      .attr('y', d => d.y - pixelSize / 2)
      .attr('width', pixelSize)
      .attr('height', pixelSize)
      .attr('fill', d => {
        // Use the data passed to D3, which reflects the current state
        if (d.unlocked && d.active) {
          return DomainColors[d.domain];
        } else if (d.unlocked) {
          // Use d3.color for opacity modification if needed
          const baseColor = d3.color(DomainColors[d.domain]);
          return baseColor ? baseColor.copy({ opacity: 0.6 }).toString() : colors.inactive;
        } else {
          return colors.inactive;
        }
      })
      .attr('stroke', d => {
        return d.id === selectedStarId ? '#ffcc00' : (d.unlocked ? '#ffffff' : 'none');
      })
      .attr('stroke-width', d => {
        return d.id === selectedStarId ? 2 : (d.unlocked ? 1 : 0);
      })
      .attr('shape-rendering', 'crispEdges')
      .style('cursor', 'pointer') // Change cursor to pointer for clickable items
      .on('mouseover', function (event, d) {
        // Raise the hovered element slightly
        d3.select(this).attr('transform', 'translate(0, -1)');
        if (onStarHover) {
          const pos = staticPositionsRef.current.get(d.id);
          if (pos) {
             onStarHover(d, pos.x, pos.y);
          }
        }
      })
      .on('mouseout', function (event, d) {
        d3.select(this).attr('transform', null); // Reset transform
        if (onStarHover) {
          onStarHover(null, 0, 0);
        }
      })
      .on('click', function (event, d) {
        if (onStarSelect) {
           const pos = staticPositionsRef.current.get(d.id);
          if (pos) {
            onStarSelect(d, pos.x, pos.y);
          }
        }
        // Prevent potential event bubbling issues if needed
        // event.stopPropagation();
      });

    // --- Render Stats Counter ---
    svg.append('text')
      .attr('x', 20)
      .attr('y', 30) // Positioned below legend potential area
      .attr('fill', colors.text)
      .style('font-size', '14px')
      .style('font-family', 'monospace')
      .text(`Active: ${activeStars.length} / Unlocked: ${unlockedStars.length} / Discovered: ${discoveredStars.length}`);

    // No cleanup needed here as we clear the SVG at the start of the effect

  }, [svgRef, dimensions, discoveredStars, unlockedStars, activeStars, selectedStarId, onStarHover, onStarSelect]); // Re-run effect if these change


  return (
    <MapContainer ref={containerRef}>
      <svg
        ref={svgRef}
        width={dimensions.width}
        height={dimensions.height}
        style={{ display: 'block' }} // Prevent extra space below SVG
      />
      <LegendContainer>
        {Object.values(KnowledgeDomain).map((domain, index) => (
          <LegendItem key={domain}> {/* Use domain as key */}
            <LegendColor $bgColor={DomainColors[domain]} />
            <LegendText>{domain.replace(/_/g, ' ')}</LegendText> {/* Replace underscores */}
          </LegendItem>
        ))}
      </LegendContainer>
    </MapContainer>
  );
}); 