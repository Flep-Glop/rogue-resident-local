'use client';

import React, { useRef, useEffect, useState } from 'react';
import styled from 'styled-components';
import * as PIXI from 'pixi.js';
import { useSceneStore } from '@/app/store/sceneStore';
import { useKnowledgeStore } from '@/app/store/knowledgeStore';
import { useGameStore } from '@/app/store/gameStore';
import { colors, spacing, typography } from '@/app/styles/pixelTheme';
import { DomainColors, KnowledgeDomain } from '@/app/types';

// === STYLED COMPONENTS ===

const ConstellationContainer = styled.div`
  width: 100vw;
  height: 100vh;
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, #0a0a1e 0%, #1a1a3a 50%, #2a1a3a 100%);
`;

// Telescope vignette overlay
const TelescopeVignette = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 100;
  background: radial-gradient(
    circle at center,
    transparent 0%,
    transparent 35%,
    rgba(0, 0, 0, 0.1) 45%,
    rgba(0, 0, 0, 0.3) 55%,
    rgba(0, 0, 0, 0.6) 65%,
    rgba(0, 0, 0, 0.8) 75%,
    rgba(0, 0, 0, 0.95) 85%,
    rgba(0, 0, 0, 1) 95%
  );
`;

// Magical PixiJS background - positioned behind everything with styling
const PixiBackgroundContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
  opacity: 0.7; /* Background feel */
  filter: blur(0.5px); /* Subtle blur for depth */
`;

// React UI overlay - clean and modern
const UIOverlayContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 10;
  display: flex;
  flex-direction: column;
  color: ${colors.text};
  font-family: ${typography.fontFamily.pixel};
`;

const MainContent = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
`;

const SingleConstellationCanvas = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
`;

const EmptyState = styled.div`
  text-align: center;
  color: rgba(255, 255, 255, 0.6);
  
  h2 {
    font-size: ${typography.fontSize.xl};
    margin: 0 0 ${spacing.md} 0;
    color: ${colors.textDim};
  }
  
  p {
    font-size: ${typography.fontSize.md};
    line-height: 1.6;
    max-width: 500px;
    margin: 0 auto;
  }
`;

const ReturnHint = styled.div`
  position: absolute;
  bottom: ${spacing.lg};
  right: ${spacing.lg};
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(10px);
  color: rgba(255, 255, 255, 0.6);
  padding: ${spacing.sm} ${spacing.md};
  border-radius: ${spacing.sm};
  font-size: ${typography.fontSize.xs};
  font-family: monospace;
  border: 1px solid rgba(255, 255, 255, 0.1);
  opacity: 0.7;
  transition: opacity 0.3s ease;
  
  &:hover {
    opacity: 1;
  }
`;

// === IMAGE-BASED CONSTELLATION COMPONENTS ===

const ConstellationStarImage = styled.img<{ size: number; color: string; $unlocked: boolean }>`
  position: absolute;
  width: ${({ size }) => size * 3}px;  /* Increased from *2 to *3 for bigger stars */
  height: ${({ size }) => size * 3}px;
  transform: translate(-50%, -50%);  /* Center the image on the position */
  cursor: pointer;
  z-index: 10;
  
  /* Unlocked stars: normal appearance with glow */
  ${({ $unlocked, color }) => $unlocked 
    ? `
      filter: drop-shadow(0 0 12px ${color}) drop-shadow(0 0 18px ${color}80);
      opacity: 1;
      animation: starTwinkle 3s infinite ease-in-out;
    `
    : `
      /* Locked stars: silhouette effect */
      filter: brightness(0) drop-shadow(0 0 6px rgba(100, 100, 100, 0.4));
      opacity: 0.4;
    `
  }
  
  transition: all 0.3s ease;
  
  &:hover {
    transform: translate(-50%, -50%) scale(1.3);
    z-index: 20;
  }
  
  @keyframes starTwinkle {
    0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
    50% { transform: translate(-50%, -50%) scale(1.15); opacity: 0.9; }
  }
`;

const StarTooltip = styled.div<{ x: number; y: number; $visible: boolean; color: string }>`
  position: absolute;
  left: ${({ x }) => x}px;
  top: ${({ y }) => y - 70}px;  /* Adjusted for bigger stars */
  background: linear-gradient(135deg, rgba(0, 0, 0, 0.9) 0%, rgba(30, 30, 30, 0.9) 100%);
  color: ${({ color }) => color};
  padding: ${spacing.sm} ${spacing.md};
  border-radius: ${spacing.sm};
  font-size: ${typography.fontSize.sm};
  font-family: ${typography.fontFamily.pixel};
  border: 1px solid ${({ color }) => color}60;
  box-shadow: 0 0 15px ${({ color }) => color}40;
  white-space: nowrap;
  pointer-events: none;
  z-index: 30;
  transform: translateX(-50%);
  opacity: ${({ $visible }) => $visible ? 1 : 0};
  transition: opacity 0.3s ease;
  
  &::after {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    margin-left: -5px;
    border-width: 5px;
    border-style: solid;
    border-color: ${({ color }) => color}60 transparent transparent transparent;
  }
`;

const ConstellationLine = styled.div<{ 
  x1: number; 
  y1: number; 
  x2: number; 
  y2: number; 
  color: string;
  $unlocked: boolean;
}>`
  position: absolute;
  height: 2px;  /* Slightly thicker lines */
  background: ${({ $unlocked, color }) => $unlocked 
    ? `linear-gradient(90deg, ${color}60, ${color}FF, ${color}60)`
    : 'rgba(100, 100, 100, 0.2)'
  };
  transform-origin: left center;
  opacity: ${({ $unlocked }) => $unlocked ? 1 : 0.3};
  transition: opacity 0.3s ease;
  
  ${({ x1, y1, x2, y2 }) => {
    const length = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    const angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
    return `
      left: ${x1}px;
      top: ${y1}px;
      width: ${length}px;
      transform: rotate(${angle}deg);
    `;
  }}
`;

const ConstellationArea = styled.div`
  position: absolute;
  width: 100%;
  height: 100%;
  cursor: pointer;
`;

// New constellation info panel that appears at bottom center
const ConstellationInfoPanel = styled.div<{ $visible: boolean; color: string }>`
  position: fixed;
  bottom: 80px;
  left: 50%;
  transform: translateX(-50%) translateY(${({ $visible }) => $visible ? '0' : '20px'});
  background: linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(20, 25, 40, 0.95) 100%);
  backdrop-filter: blur(10px);
  border: 2px solid ${({ color }) => color}60;
  border-radius: 12px;
  padding: ${spacing.md} ${spacing.lg};
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6), 0 0 20px ${({ color }) => color}30;
  opacity: ${({ $visible }) => $visible ? 1 : 0};
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  pointer-events: none;
  z-index: 25;
  min-width: 300px;
  text-align: center;
`;

const ConstellationTitle = styled.h3<{ color: string }>`
  margin: 0 0 ${spacing.sm} 0;
  font-size: ${typography.fontSize.xl};
  font-family: ${typography.fontFamily.pixel};
  color: ${({ color }) => color};
  text-shadow: 0 0 10px ${({ color }) => color}80, ${typography.textShadow.pixel};
  letter-spacing: 1px;
`;

const ConstellationDescription = styled.p<{ color: string }>`
  margin: 0 0 ${spacing.sm} 0;
  font-size: ${typography.fontSize.md};
  color: rgba(255, 255, 255, 0.9);
  line-height: 1.4;
`;

const ConstellationProgress = styled.div<{ color: string }>`
  font-size: ${typography.fontSize.sm};
  color: ${({ color }) => color};
  font-weight: bold;
  text-shadow: 0 0 8px ${({ color }) => color}60;
`;

const StarHoverTooltip = styled.div<{ x: number; y: number; $visible: boolean; color: string }>`
  position: absolute;
  left: ${({ x }) => x}px;
  top: ${({ y }) => y - 70}px;
  background: linear-gradient(135deg, rgba(0, 0, 0, 0.9) 0%, rgba(30, 30, 30, 0.9) 100%);
  color: ${({ color }) => color};
  padding: ${spacing.xs} ${spacing.sm};
  border-radius: 6px;
  font-size: ${typography.fontSize.sm};
  font-family: ${typography.fontFamily.pixel};
  border: 1px solid ${({ color }) => color}60;
  box-shadow: 0 0 10px ${({ color }) => color}40;
  white-space: nowrap;
  pointer-events: none;
  z-index: 30;
  transform: translateX(-50%);
  opacity: ${({ $visible }) => $visible ? 1 : 0};
  transition: opacity 0.2s ease;
  
  &::after {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    margin-left: -3px;
    border-width: 3px;
    border-style: solid;
    border-color: ${({ color }) => color}60 transparent transparent transparent;
  }
`;

const AllConstellations: React.FC<{ 
  domainStats: Record<KnowledgeDomain, { unlocked: number; total: number; percentage: number }>;
}> = ({ domainStats }) => {
  const [hoveredStar, setHoveredStar] = useState<{ name: string; x: number; y: number; color: string } | null>(null);
  const [hoveredConstellation, setHoveredConstellation] = useState<{ 
    domain: KnowledgeDomain; 
    name: string; 
    color: string; 
    description: string;
    stats: { unlocked: number; total: number; percentage: number };
  } | null>(null);

  // Constellation descriptions for the info panel
  const constellationDescriptions = {
    [KnowledgeDomain.RADIATION_THERAPY]: "The art and science of delivering therapeutic radiation to treat cancer while protecting healthy tissue.",
    [KnowledgeDomain.TREATMENT_PLANNING]: "Strategic design of radiation therapy treatments, balancing target coverage with normal tissue sparing.",
    [KnowledgeDomain.DOSIMETRY]: "Precise measurement and calculation of radiation dose to ensure accurate and safe treatment delivery.",
    [KnowledgeDomain.LINAC_ANATOMY]: "Understanding the complex technology behind linear accelerators that generate therapeutic radiation beams."
  };

  // Helper function to move stars closer to center
  const moveStarTowardsCenter = (x: number, y: number, factor: number = 0.2) => {
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    const newX = x + (centerX - x) * factor;
    const newY = y + (centerY - y) * factor;
    return { x: newX, y: newY };
  };

  // Define beautiful constellation patterns positioned naturally across the full screen
  const constellationData = {
    [KnowledgeDomain.RADIATION_THERAPY]: {
      name: "Radiation Therapy",
      color: DomainColors[KnowledgeDomain.RADIATION_THERAPY],
      description: constellationDescriptions[KnowledgeDomain.RADIATION_THERAPY],
      // Beautiful flowing pattern - like a galaxy spiral (upper left quadrant) - NUDGED RIGHT
      stars: [
        { x: 590, y: 280, size: 18, name: "Radiation Fundamentals" },   // Nudged right +30
        { x: 530, y: 320, size: 15, name: "Beam Properties" },   // Nudged right +30
        { x: 670, y: 240, size: 14, name: "Dose Distribution" },   // Nudged right +30
        { x: 490, y: 380, size: 13, name: "Fractionation" },   // Nudged right +30
        { x: 710, y: 200, size: 12, name: "Treatment Modalities" },    // Nudged right +30
        { x: 550, y: 420, size: 11, name: "Side Effects" },    // Nudged right +30
        { x: 750, y: 280, size: 11, name: "Quality Assurance" },    // Nudged right +30
      ],
      connections: [
        [0, 1], [0, 2], [1, 3], [2, 4], [3, 5], [4, 6], [1, 2]  // Spiral connections
      ],
    },
    [KnowledgeDomain.DOSIMETRY]: {
      name: "Dosimetry",
      color: DomainColors[KnowledgeDomain.DOSIMETRY],
      description: constellationDescriptions[KnowledgeDomain.DOSIMETRY],
      // Geometric precision pattern - like a crystalline structure (lower left quadrant) - NUDGED RIGHT
      stars: [
        { x: 660, y: 580, size: 17, name: "Dose Measurement" },   // Nudged right +30
        { x: 590, y: 520, size: 15, name: "Detector Systems" },   // Nudged right +30
        { x: 730, y: 520, size: 15, name: "Calibration" },   // Nudged right +30
        { x: 550, y: 600, size: 13, name: "Phantoms" },   // Nudged right +30
        { x: 770, y: 600, size: 13, name: "TLD Systems" },   // Nudged right +30
        { x: 610, y: 680, size: 14, name: "Electronic Dosimetry" },   // Nudged right +30
        { x: 710, y: 680, size: 14, name: "Film Dosimetry" },   // Nudged right +30
      ],
      connections: [
        [0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [0, 6], [5, 6], [1, 3], [2, 4]  // Crystal structure
      ],
    },
    [KnowledgeDomain.TREATMENT_PLANNING]: {
      name: "Treatment Planning",
      color: DomainColors[KnowledgeDomain.TREATMENT_PLANNING],
      description: constellationDescriptions[KnowledgeDomain.TREATMENT_PLANNING],
      // Constellation resembling a complex medical apparatus (upper right quadrant) - NUDGED RIGHT
      stars: [
        { x: 1010, y: 280, size: 16, name: "Planning System" },   // Nudged right +30
        { x: 940, y: 240, size: 14, name: "CT Simulation" },   // Nudged right +30
        { x: 1080, y: 240, size: 14, name: "Contouring" },   // Nudged right +30
        { x: 860, y: 280, size: 13, name: "Beam Angles" },   // Nudged right +30
        { x: 1160, y: 280, size: 13, name: "Dose Optimization" },  // Nudged right +30
        { x: 960, y: 360, size: 12, name: "IMRT Planning" },    // Nudged right +30
        { x: 1060, y: 360, size: 12, name: "VMAT Planning" },    // Nudged right +30
        { x: 1010, y: 420, size: 11, name: "Plan Evaluation" },    // Nudged right +30
      ],
      connections: [
        [0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [0, 6], [5, 7], [6, 7], [1, 3], [2, 4]  // Apparatus structure
      ],
    },
    [KnowledgeDomain.LINAC_ANATOMY]: {
      name: "LINAC Anatomy",
      color: DomainColors[KnowledgeDomain.LINAC_ANATOMY],
      description: constellationDescriptions[KnowledgeDomain.LINAC_ANATOMY],
      // Linear accelerator pattern - like a technological constellation (lower right quadrant) - NUDGED RIGHT
      stars: [
        { x: 860, y: 580, size: 15, name: "Electron Gun" },   // Nudged right +30
        { x: 960, y: 560, size: 14, name: "Waveguide" },   // Nudged right +30
        { x: 1080, y: 540, size: 14, name: "Magnetron" },   // Nudged right +30
        { x: 1180, y: 520, size: 15, name: "Bending Magnet" },   // Nudged right +30
        { x: 1260, y: 500, size: 13, name: "Primary Collimator" },   // Nudged right +30
        { x: 940, y: 680, size: 12, name: "MLC System" },    // Nudged right +30
        { x: 1140, y: 720, size: 11, name: "Patient Couch" },    // Nudged right +30
      ],
      connections: [
        [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6]  // Linear beam path
      ],
    },
  };

  const handleConstellationClick = () => {
    // Trigger star rearrangement when any constellation area is clicked
    const event = new CustomEvent('constellation-rearrange');
    window.dispatchEvent(event);
  };

  return (
    <ConstellationArea onClick={handleConstellationClick}>
      {Object.entries(constellationData).map(([domain, data]) => {
        const stats = domainStats[domain as KnowledgeDomain];
        const hasStars = stats.total > 0;
        
        if (!hasStars) return null;

        const { name, color, stars, connections, description } = data;
        const percentage = Math.round(stats.percentage);

        return (
          <React.Fragment key={domain}>
            {/* Draw connection lines first (behind stars) */}
            {connections.map(([start, end], index) => {
              const star1 = stars[start];
              const star2 = stars[end];
              if (!star1 || !star2) return null;
              
              const bothUnlocked = start < stats.unlocked && end < stats.unlocked;
              
              return (
                <ConstellationLine
                  key={`${domain}-line-${index}`}
                  x1={star1.x}
                  y1={star1.y}
                  x2={star2.x}
                  y2={star2.y}
                  color={color}
                  $unlocked={bothUnlocked}
                />
              );
            })}
            
            {/* Draw stars on top */}
            {stars.map((star, index) => (
              <ConstellationStarImage
                key={`${domain}-star-${index}`}
                src="/images/temp/star.png"
                alt="Star"
                size={star.size}
                color={color}
                $unlocked={index < stats.unlocked}
                onMouseEnter={() => {
                  // Show both individual star tooltip and constellation info
                  setHoveredStar({
                    name: star.name,
                    x: star.x,
                    y: star.y,
                    color: color
                  });
                  setHoveredConstellation({
                    domain: domain as KnowledgeDomain,
                    name,
                    color,
                    description,
                    stats
                  });
                }}
                onMouseLeave={() => {
                  setHoveredStar(null);
                  setHoveredConstellation(null);
                }}
                style={{
                  left: star.x,
                  top: star.y,
                }}
              />
            ))}
          </React.Fragment>
        );
      })}
      
      {/* Individual Star Tooltip - smaller, less prominent */}
      {hoveredStar && (
        <StarHoverTooltip
          x={hoveredStar.x}
          y={hoveredStar.y}
          $visible={!!hoveredStar}
          color={hoveredStar.color}
        >
          {hoveredStar.name}
        </StarHoverTooltip>
      )}

      {/* Constellation Info Panel - main information display */}
      {hoveredConstellation && (
        <ConstellationInfoPanel
          $visible={!!hoveredConstellation}
          color={hoveredConstellation.color}
        >
          <ConstellationTitle color={hoveredConstellation.color}>
            {hoveredConstellation.name}
          </ConstellationTitle>
          <ConstellationDescription color={hoveredConstellation.color}>
            {hoveredConstellation.description}
          </ConstellationDescription>
          <ConstellationProgress color={hoveredConstellation.color}>
            {hoveredConstellation.stats.unlocked} / {hoveredConstellation.stats.total} stars • {Math.round(hoveredConstellation.stats.percentage)}% mastery
          </ConstellationProgress>
        </ConstellationInfoPanel>
      )}
    </ConstellationArea>
  );
};

export default function ConstellationView() {
  const { returnToPrevious } = useSceneStore();
  const pixiContainerRef = useRef<HTMLDivElement>(null);
  const pixiAppRef = useRef<PIXI.Application | null>(null);
  
  // Get data from stores
  const starsObject = useKnowledgeStore(state => state.stars);
  
  // Initialize knowledge store with debugging defaults if empty
  useEffect(() => {
    const initializeIfEmpty = async () => {
      if (Object.keys(starsObject).length === 0) {
        console.log('🌟 [ConstellationView] Knowledge store is empty, initializing with debugging defaults...');
        
        try {
          // Import and initialize the concept data
          const { initializeKnowledgeStore } = await import('@/app/data/conceptData');
          initializeKnowledgeStore(useKnowledgeStore);
          
          // After initialization, unlock a few stars for each domain to avoid blank page
          setTimeout(() => {
            const knowledgeStore = useKnowledgeStore.getState();
            const allStars = Object.values(knowledgeStore.stars);
            
            // Create a copy of the stars object with some unlocked for debugging
            const updatedStars = { ...knowledgeStore.stars };
            
            // Unlock 2-3 stars in each domain for debugging
            const domains = [KnowledgeDomain.TREATMENT_PLANNING, KnowledgeDomain.RADIATION_THERAPY, KnowledgeDomain.LINAC_ANATOMY, KnowledgeDomain.DOSIMETRY];
            domains.forEach(domain => {
              const domainStars = allStars.filter(star => star.domain === domain);
              // Mark first 2 stars as discovered and unlocked for debugging
              if (domainStars.length >= 2) {
                updatedStars[domainStars[0].id] = {
                  ...domainStars[0],
                  discovered: true,
                  unlocked: true,
                  mastery: 25 // 25% mastery for realistic feel
                };
                updatedStars[domainStars[1].id] = {
                  ...domainStars[1],
                  discovered: true,
                  unlocked: true,
                  mastery: 15 // 15% mastery
                };
              }
            });
            
            // Force update the store using the internal Zustand method
            useKnowledgeStore.setState({ stars: updatedStars });
            
            console.log('🌟 [ConstellationView] Debugging defaults applied - you should now see stars in the constellation!');
          }, 100);
        } catch (error) {
          console.error('Failed to initialize knowledge store:', error);
        }
      }
    };
    
    initializeIfEmpty();
  }, [starsObject]);
  
  // Handle escape key to return to previous scene
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        returnToPrevious();
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [returnToPrevious]);
  
  // Calculate domain statistics with debugging defaults
  const domainStats = React.useMemo(() => {
    const stats: Record<KnowledgeDomain, { unlocked: number; total: number; percentage: number }> = {} as any;
    
    Object.values(KnowledgeDomain).forEach(domain => {
      stats[domain] = { unlocked: 0, total: 0, percentage: 0 };
    });
    
    Object.values(starsObject).forEach(star => {
      if (star.domain) {
        stats[star.domain].total++;
        if (star.unlocked) {
          stats[star.domain].unlocked++;
        }
      }
    });
    
    // Calculate percentages for real data
    Object.values(KnowledgeDomain).forEach(domain => {
      const stat = stats[domain];
      stat.percentage = stat.total > 0 ? (stat.unlocked / stat.total) * 100 : 0;
    });
    
    return stats;
  }, [starsObject]);

  // === MAGICAL AUTOMATED PIXI.JS BACKGROUND ===
  useEffect(() => {
    let isMounted = true;
    const currentContainer = pixiContainerRef.current;

    if (!currentContainer || pixiAppRef.current) {
      return;
    }

    const app = new PIXI.Application();
    
    app.init({
        width: window.innerWidth,
        height: window.innerHeight,
        backgroundColor: 0x02001a, // Deep space background
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
    }).then(() => {
        if (!isMounted) {
            app.destroy(true, true);
            return;
        }
        pixiAppRef.current = app;
        currentContainer.appendChild(app.canvas);

        // --- ENHANCED MULTI-LAYER PARALLAX STARFIELD WITH NEBULA CLOUDS ---

        // Create multiple depth layers for incredible space depth
        const depthLayers = [
          { 
            depth: 0.1, 
            starCount: 80, 
            size: 0.8, 
            alpha: 0.25, 
            colors: [0x9bb5ff, 0xa4b5ff, 0xc4d4ff], // Cool distant blues
            speed: 0.0005 
          },
          { 
            depth: 0.25, 
            starCount: 60, 
            size: 1.2, 
            alpha: 0.4, 
            colors: [0xffffff, 0xfff4ea, 0xffcc99], // Neutral mid-distance
            speed: 0.001 
          },
          { 
            depth: 0.5, 
            starCount: 40, 
            size: 1.8, 
            alpha: 0.6, 
            colors: [0xffffff, 0xffeeaa, 0xffddaa], // Warm closer stars
            speed: 0.002 
          },
          { 
            depth: 0.8, 
            starCount: 25, 
            size: 2.5, 
            alpha: 0.8, 
            colors: [0xffffff, 0xffeedd, 0xffcc88], // Bright close stars
            speed: 0.003 
          }
        ];

        // Create nebula cloud layers for atmospheric depth
        const nebulaClouds = [
          { 
            color: 0x2a1a4a, 
            alpha: 0.08, 
            size: 200, 
            count: 8, 
            depth: 0.15,
            driftSpeed: 0.0002
          },
          { 
            color: 0x1a2a4a, 
            alpha: 0.12, 
            size: 150, 
            count: 6, 
            depth: 0.35,
            driftSpeed: 0.0004
          },
          { 
            color: 0x2a4a6a, 
            alpha: 0.18, 
            size: 100, 
            count: 4, 
            depth: 0.6,
            driftSpeed: 0.0006
          }
        ];

        // Create container for all stars and effects
        const starContainer = new PIXI.Container();
        app.stage.addChild(starContainer);

        // Type definitions for our magical elements
        interface EnhancedStar {
          sprite: PIXI.Graphics;
          initialX: number;
          initialY: number;
          depth: number;
          color: number;
          size: number;
          layer: typeof depthLayers[0];
          targetX: number;
          targetY: number;
          twinklePhase: number;
          twinkleSpeed: number;
        }

        interface NebulaCloud {
          sprite: PIXI.Graphics;
          initialX: number;
          initialY: number;
          depth: number;
          targetX: number;
          targetY: number;
          driftSpeed: number;
          driftAngle: number;
        }

        // Create all the magical layers
        const allStars: EnhancedStar[] = [];
        const allClouds: NebulaCloud[] = [];

        // Generate nebula clouds first (behind stars)
        nebulaClouds.forEach(cloudLayer => {
          for (let i = 0; i < cloudLayer.count; i++) {
            const cloud = new PIXI.Graphics();
            
            // Create organic cloud shape
            const cloudSize = cloudLayer.size * (0.5 + Math.random() * 0.5);
            const segments = 8 + Math.floor(Math.random() * 4);
            
            cloud.beginPath();
            for (let j = 0; j < segments; j++) {
              const angle = (j / segments) * Math.PI * 2;
              const variance = 0.3 + Math.random() * 0.4;
              const x = Math.cos(angle) * cloudSize * variance;
              const y = Math.sin(angle) * cloudSize * variance;
              
              if (j === 0) {
                cloud.moveTo(x, y);
              } else {
                cloud.lineTo(x, y);
              }
            }
            cloud.closePath();
            cloud.fill({ color: cloudLayer.color, alpha: cloudLayer.alpha });
            
            // Apply subtle blur for soft edges
            const blurFilter = new PIXI.BlurFilter();
            blurFilter.blur = 3;
            cloud.filters = [blurFilter];
            
            const initialX = Math.random() * (app.screen.width + 400) - 200;
            const initialY = Math.random() * (app.screen.height + 400) - 200;
            cloud.x = initialX;
            cloud.y = initialY;
            
            starContainer.addChild(cloud);
            
            allClouds.push({
              sprite: cloud,
              initialX,
              initialY,
              depth: cloudLayer.depth,
              targetX: initialX,
              targetY: initialY,
              driftSpeed: cloudLayer.driftSpeed,
              driftAngle: Math.random() * Math.PI * 2
            });
          }
        });

        // Generate multi-layer parallax stars
        depthLayers.forEach(layer => {
          for (let i = 0; i < layer.starCount; i++) {
            const graphics = new PIXI.Graphics();
            const size = layer.size * (0.5 + Math.random() * 0.5);
            const color = layer.colors[Math.floor(Math.random() * layer.colors.length)];
            
            // Create different star shapes based on depth
            if (layer.depth > 0.6) {
              // Close stars: more complex shapes
              graphics.star(0, 0, 5, size, size * 0.4);
            } else {
              // Distant stars: simple circles
              graphics.circle(0, 0, size);
            }
            
            graphics.fill({ color: color, alpha: layer.alpha });
            
            const initialX = Math.random() * (app.screen.width + 200) - 100;
            const initialY = Math.random() * (app.screen.height + 200) - 100;
            graphics.x = initialX;
            graphics.y = initialY;

            // Add subtle glow for closer stars (simplified without GlowFilter)
            if (layer.depth > 0.4) {
              // Create a simple glow effect with a larger, more transparent star behind
              const glowStar = new PIXI.Graphics();
              glowStar.circle(0, 0, size * 2);
              glowStar.fill({ color: color, alpha: 0.2 });
              glowStar.x = initialX;
              glowStar.y = initialY;
              starContainer.addChild(glowStar);
            }

            starContainer.addChild(graphics);

            allStars.push({
              sprite: graphics,
              initialX,
              initialY,
              depth: layer.depth,
              color,
              size,
              layer: layer,
              targetX: initialX,
              targetY: initialY,
              twinklePhase: Math.random() * Math.PI * 2,
              twinkleSpeed: 0.02 + Math.random() * 0.03
            });
          }
        });

        // Enhanced connection system between nearby stars
        const connections = new PIXI.Graphics();
        app.stage.addChild(connections);
        
        // Track mouse position for parallax
        let mousePos = { x: app.screen.width / 2, y: app.screen.height / 2 };
        app.stage.eventMode = 'static';
        app.stage.on('pointermove', (event) => {
          mousePos.x = event.global.x;
          mousePos.y = event.global.y;
        });

        // Event-driven rearrange system
        const triggerRearrange = () => {
          // Rearrange stars with depth-appropriate movement
          allStars.forEach(star => {
            const movementRange = 100 + (star.depth * 200); // Closer stars move more
            star.targetX = star.initialX + (Math.random() - 0.5) * movementRange;
            star.targetY = star.initialY + (Math.random() - 0.5) * movementRange;
          });
          
          // Gentle cloud drift changes
          allClouds.forEach(cloud => {
            cloud.driftAngle += (Math.random() - 0.5) * 0.5;
          });
        };
        
        // Listen for rearrange events from React UI
        const handleRearrangeEvent = () => {
          console.log('✨ [ConstellationView] React UI triggered magical star rearrangement!');
          triggerRearrange();
        };
        
        window.addEventListener('constellation-rearrange', handleRearrangeEvent);

        // Main animation loop with enhanced depth effects
        let frame = 0;
        const shootingStars: Array<{
          sprite: PIXI.Graphics;
          trail: PIXI.Graphics;
          glow: PIXI.Graphics;
          startX: number;
          startY: number;
          endX: number;
          endY: number;
          speed: number;
          lifetime: number;
          maxLifetime: number;
          color: number;
        }> = [];
        
        const sparkles: Array<{
          sprite: PIXI.Graphics;
          vx: number;
          vy: number;
          lifetime: number;
          maxLifetime: number;
          color: number;
        }> = [];

        app.ticker.add((ticker) => {
          frame++;
          const deltaTime = ticker.deltaTime;
          
          // ENHANCED DRAMATIC MOUSE PARALLAX! 🖱️✨
          const centerX = app.screen.width / 2;
          const centerY = app.screen.height / 2;
          const mouseOffsetX = (mousePos.x - centerX) / centerX; // Normalized -1 to 1
          const mouseOffsetY = (mousePos.y - centerY) / centerY;
          
          // Animate all stars with DRAMATIC depth-aware parallax
          allStars.forEach(star => {
            // Gentle movement toward target (rearrange effect)
            const dx = star.targetX - star.sprite.x;
            const dy = star.targetY - star.sprite.y;
            const moveSpeed = star.layer.speed * deltaTime;
            star.sprite.x += dx * moveSpeed;
            star.sprite.y += dy * moveSpeed;
            
            // DRAMATICALLY ENHANCED parallax effect! 🚀
            const parallaxStrength = star.depth * 25; // Increased from 0.03 to 25!
            const parallaxX = mouseOffsetX * parallaxStrength;
            const parallaxY = mouseOffsetY * parallaxStrength;
            
            star.sprite.x += parallaxX * 0.02;
            star.sprite.y += parallaxY * 0.02;

            // Enhanced depth-based twinkling with SPARKLE CHANCE! ✨
            star.twinklePhase += star.twinkleSpeed * deltaTime;
            const twinkleIntensity = star.depth * 0.4 + 0.3; // More dramatic twinkling
            const twinkle = 1 + Math.sin(star.twinklePhase) * twinkleIntensity;
            star.sprite.scale.set(twinkle);
            
            // Dramatic alpha variation for depth
            const baseAlpha = star.layer.alpha;
            const alphaTwinkle = baseAlpha + Math.sin(star.twinklePhase * 0.7) * 0.2; // More dramatic
            star.sprite.alpha = Math.max(0.1, alphaTwinkle);
            
            // SPARKLE CREATION! ✨ When stars twinkle brightly, they create sparkles!
            if (star.depth > 0.5 && twinkle > 1.6 && Math.random() < 0.008) {
              const sparkle = new PIXI.Graphics();
              sparkle.star(0, 0, 4, 2, 1);
              sparkle.fill({ color: star.color, alpha: 0.8 });
              sparkle.x = star.sprite.x + (Math.random() - 0.5) * 10;
              sparkle.y = star.sprite.y + (Math.random() - 0.5) * 10;
              
              starContainer.addChild(sparkle);
              
              sparkles.push({
                sprite: sparkle,
                vx: (Math.random() - 0.5) * 2,
                vy: (Math.random() - 0.5) * 2,
                lifetime: 0,
                maxLifetime: 60 + Math.random() * 60,
                color: star.color
              });
            }
            
            // Keep stars within expanded bounds
            if (star.sprite.x < -100) star.targetX = app.screen.width + 100;
            if (star.sprite.x > app.screen.width + 100) star.targetX = -100;
            if (star.sprite.y < -100) star.targetY = app.screen.height + 100;
            if (star.sprite.y > app.screen.height + 100) star.targetY = -100;
          });

          // Animate nebula clouds with ENHANCED parallax
          allClouds.forEach(cloud => {
            // More dramatic parallax for clouds
            const parallaxStrength = cloud.depth * 15; // Enhanced from 0.02
            const parallaxX = mouseOffsetX * parallaxStrength;
            const parallaxY = mouseOffsetY * parallaxStrength;
            
            cloud.sprite.x += parallaxX * 0.01;
            cloud.sprite.y += parallaxY * 0.01;
            
            // Slow organic drift
            cloud.driftAngle += cloud.driftSpeed * deltaTime;
            const driftX = Math.cos(cloud.driftAngle) * 0.3; // Slightly more movement
            const driftY = Math.sin(cloud.driftAngle) * 0.2;
            
            cloud.sprite.x += driftX;
            cloud.sprite.y += driftY;
            
            // Enhanced breathing effect
            const breathPhase = frame * 0.015 + cloud.initialX * 0.001;
            const breath = 1 + Math.sin(breathPhase) * 0.15; // More dramatic breathing
            cloud.sprite.scale.set(breath);
            
            // Wrap around screen
            if (cloud.sprite.x < -300) cloud.sprite.x = app.screen.width + 300;
            if (cloud.sprite.x > app.screen.width + 300) cloud.sprite.x = -300;
            if (cloud.sprite.y < -300) cloud.sprite.y = app.screen.height + 300;
            if (cloud.sprite.y > app.screen.height + 300) cloud.sprite.y = -300;
          });

          // SPECTACULAR SHOOTING STARS! 🌠⭐🚀
          if (Math.random() < 0.003) { // Frequent enough to be exciting!
            const shootingStar = new PIXI.Graphics();
            const trail = new PIXI.Graphics();
            
            // Random shooting star colors - bright and dramatic!
            const colors = [0xffffff, 0xffd700, 0xffaa00, 0xff6b6b, 0x4ecdc4, 0x45b7d1];
            const color = colors[Math.floor(Math.random() * colors.length)];
            
            // Create shooting star entry points
            let startX, startY, endX, endY;
            const side = Math.floor(Math.random() * 4);
            
            if (side === 0) { // Top
              startX = Math.random() * app.screen.width;
              startY = -50;
              endX = startX + (Math.random() * 300 + 200) * (Math.random() > 0.5 ? 1 : -1);
              endY = Math.random() * app.screen.height;
            } else if (side === 1) { // Right
              startX = app.screen.width + 50;
              startY = Math.random() * app.screen.height;
              endX = Math.random() * app.screen.width;
              endY = startY + (Math.random() * 300 + 200) * (Math.random() > 0.5 ? 1 : -1);
            } else if (side === 2) { // Bottom
              startX = Math.random() * app.screen.width;
              startY = app.screen.height + 50;
              endX = startX + (Math.random() * 300 + 200) * (Math.random() > 0.5 ? 1 : -1);
              endY = Math.random() * app.screen.height;
            } else { // Left
              startX = -50;
              startY = Math.random() * app.screen.height;
              endX = Math.random() * app.screen.width;
              endY = startY + (Math.random() * 300 + 200) * (Math.random() > 0.5 ? 1 : -1);
            }
            
            // Create the shooting star head with natural glow
            shootingStar.circle(0, 0, 3);
            shootingStar.fill({ color: color, alpha: 1 });
            
            // Create a simple glow effect
            const glow = new PIXI.Graphics();
            glow.circle(0, 0, 6);
            glow.fill({ color: color, alpha: 0.3 });
            starContainer.addChild(glow);
            glow.x = startX;
            glow.y = startY;
            
            shootingStar.x = startX;
            shootingStar.y = startY;
            
            // Create the spectacular trail
            const angle = Math.atan2(endY - startY, endX - startX);
            const trailLength = 40 + Math.random() * 40;
            
            trail.moveTo(0, 0);
            trail.lineTo(-trailLength, 0);
            trail.stroke({ color: color, alpha: 0.6, width: 6 });
            trail.moveTo(0, 0);
            trail.lineTo(-trailLength * 0.7, 0);
            trail.stroke({ color: 0xffffff, alpha: 0.8, width: 3 });
            
            trail.x = startX;
            trail.y = startY;
            trail.rotation = angle;
            
            starContainer.addChild(trail);
            starContainer.addChild(shootingStar);
            
            shootingStars.push({
              sprite: shootingStar,
              trail: trail,
              glow: glow,
              startX,
              startY,
              endX,
              endY,
              speed: 8 + Math.random() * 6, // Dramatic speed!
              lifetime: 0,
              maxLifetime: 120 + Math.random() * 60,
              color
            });
          }

          // Animate existing shooting stars
          shootingStars.forEach((star, index) => {
            star.lifetime += deltaTime;
            
            const progress = star.lifetime / star.maxLifetime;
            const x = star.startX + (star.endX - star.startX) * progress;
            const y = star.startY + (star.endY - star.startY) * progress;
            
            star.sprite.x = x;
            star.sprite.y = y;
            star.trail.x = x;
            star.trail.y = y;
            star.glow.x = x;
            star.glow.y = y;
            
            // Fade out effect
            const alpha = Math.max(0, 1 - progress);
            star.sprite.alpha = alpha;
            star.trail.alpha = alpha * 0.6;
            star.glow.alpha = alpha * 0.3;
            
            // Remove completed shooting stars
            if (star.lifetime >= star.maxLifetime) {
              star.sprite.destroy();
              star.trail.destroy();
              star.glow.destroy();
              shootingStars.splice(index, 1);
            }
          });

          // Animate sparkles ✨
          sparkles.forEach((sparkle, index) => {
            sparkle.lifetime += deltaTime;
            
            sparkle.sprite.x += sparkle.vx;
            sparkle.sprite.y += sparkle.vy;
            
            // Gentle gravity and fade
            sparkle.vy += 0.05;
            const progress = sparkle.lifetime / sparkle.maxLifetime;
            const alpha = Math.max(0, 1 - progress);
            sparkle.sprite.alpha = alpha;
            
            // Rotate sparkles
            sparkle.sprite.rotation += 0.1;
            
            // Remove completed sparkles
            if (sparkle.lifetime >= sparkle.maxLifetime) {
              sparkle.sprite.destroy();
              sparkles.splice(index, 1);
            }
          });

          // Draw magical connections between nearby stars (depth-aware)
          connections.clear();
          for (let i = 0; i < allStars.length; i++) {
            for (let j = i + 1; j < allStars.length; j++) {
              const star1 = allStars[i];
              const star2 = allStars[j];
              const dist = Math.hypot(star1.sprite.x - star2.sprite.x, star1.sprite.y - star2.sprite.y);
              
              // Connection range based on depth similarity
              const depthDiff = Math.abs(star1.depth - star2.depth);
              const maxDist = 80 + (1 - depthDiff) * 40; // Similar depth stars connect more easily
              
              if (dist < maxDist) {
                const alpha = (1 - dist / maxDist) * 0.15 * Math.min(star1.depth, star2.depth); // Slightly more visible
                const mixedColor = mixColors(star1.color, star2.color, 0.5);
                connections.stroke({ color: mixedColor, alpha, width: 0.8 }); // Slightly thicker
                connections.moveTo(star1.sprite.x, star1.sprite.y);
                connections.lineTo(star2.sprite.x, star2.sprite.y);
              }
            }
          }
        });

        // Stars will only rearrange when triggered by React UI interactions!

        return () => {
            window.removeEventListener('constellation-rearrange', handleRearrangeEvent);
        };
    });

    const handleResize = () => {
        if (pixiAppRef.current) {
            pixiAppRef.current.renderer.resize(window.innerWidth, window.innerHeight);
        }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      isMounted = false;
      window.removeEventListener('resize', handleResize);
      if (pixiAppRef.current) {
        pixiAppRef.current.destroy(true, true);
        pixiAppRef.current = null;
      }
    };
  }, []);

  /**
   * Manually mixes two hex colors for constellation connections.
   */
  function mixColors(color1: number, color2: number, weight: number): number {
      const w1 = weight;
      const w2 = 1 - w1;

      const r1 = (color1 >> 16) & 0xff;
      const g1 = (color1 >> 8) & 0xff;
      const b1 = color1 & 0xff;

      const r2 = (color2 >> 16) & 0xff;
      const g2 = (color2 >> 8) & 0xff;
      const b2 = color2 & 0xff;

      const r = Math.round(r1 * w1 + r2 * w2);
      const g = Math.round(g1 * w1 + g2 * w2);
      const b = Math.round(b1 * w1 + b2 * w2);

      return (r << 16) | (g << 8) | b;
  }

  const totalStars = Object.keys(starsObject).length;
  const unlockedStars = Object.values(starsObject).filter(star => star.unlocked).length;

  // Helper function to trigger rearrangement (Event-driven magic!)
  const triggerStarRearrangement = () => {
    const event = new CustomEvent('constellation-rearrange');
    window.dispatchEvent(event);
  };

  return (
    <ConstellationContainer>
      {/* Magical PixiJS Background */}
      <PixiBackgroundContainer ref={pixiContainerRef} />
      
      {/* Pure Constellation Experience */}
      <UIOverlayContainer>
        <MainContent>
          {totalStars === 0 ? (
            <EmptyState>
              <h2>🌌 The Stars Await</h2>
              <p>
                Begin your journey through the hospital to unlock knowledge stars. 
                Each discovery will illuminate a new constellation in your understanding.
              </p>
            </EmptyState>
          ) : (
            <SingleConstellationCanvas>
              <AllConstellations domainStats={domainStats} />
            </SingleConstellationCanvas>
          )}
        </MainContent>
        
        <ReturnHint>
          Press ESC to return to hospital
        </ReturnHint>
      </UIOverlayContainer>
      
      {/* Telescope Vignette Effect */}
      <TelescopeVignette />
    </ConstellationContainer>
  );
} 