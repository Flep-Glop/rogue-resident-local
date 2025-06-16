'use client';

import React, { useRef, useState, useMemo } from 'react';
import styled from 'styled-components';
import { useSceneStore } from '@/app/store/sceneStore';
import { useKnowledgeStore } from '@/app/store/knowledgeStore';
import { useGameStore } from '@/app/store/gameStore';
import { colors, spacing, typography, borders } from '@/app/styles/pixelTheme';
import { DomainColors, KnowledgeDomain } from '@/app/types';

const ConstellationContainer = styled.div`
  width: 100vw;
  height: 100vh;
  background: linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #0f1419 100%);
  display: flex;
  flex-direction: column;
  color: ${colors.text};
  font-family: ${typography.fontFamily.pixel};
  position: relative;
  overflow: hidden;
`;

const BackButton = styled.button`
  position: absolute;
  top: 20px;
  left: 20px;
  background: rgba(0, 0, 0, 0.7);
  color: #fff;
  border: none;
  padding: 10px 15px;
  border-radius: 5px;
  cursor: pointer;
  font-size: 14px;
  font-family: ${typography.fontFamily.pixel};
  z-index: 100;
  
  &:hover {
    background: rgba(0, 0, 0, 0.9);
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

const ConstellationTitle = styled.h1`
  font-size: ${typography.fontSize.xl};
  color: ${colors.highlight};
  margin: 0;
  text-shadow: 0 0 10px rgba(147, 51, 234, 0.5);
`;

const StarPointsDisplay = styled.div`
  display: flex;
  align-items: center;
  gap: ${spacing.sm};
  background: rgba(255, 215, 0, 0.15);
  padding: ${spacing.xs} ${spacing.sm};
  border-radius: ${spacing.xs};
  border: 1px solid ${colors.highlight};
`;

const ConstellationMain = styled.div`
  flex: 1;
  position: relative;
  overflow: hidden;
`;

const StarField = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  
  &::before {
    content: '✦ ✧ ⋆ ✦ ✧ ⭐ ✦ ✧ ⋆ ✦ ✧ ✦ ✧ ⋆ ✦ ✧ ⭐ ✦ ✧ ⋆ ✦ ✧';
    position: absolute;
    top: 20%;
    left: 10%;
    right: 10%;
    font-size: 20px;
    color: rgba(255, 215, 0, 0.3);
    word-spacing: 30px;
    animation: twinkle 3s infinite;
  }
  
  @keyframes twinkle {
    0%, 100% { opacity: 0.3; }
    50% { opacity: 0.8; }
  }
`;

const ConstellationCanvas = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  padding: ${spacing.lg};
`;

const Star = styled.div<{ 
  x: number; 
  y: number; 
  domain: KnowledgeDomain;
  discovered: boolean;
  unlocked: boolean;
  active: boolean;
  mastery: number;
}>`
  position: absolute;
  left: ${({ x }) => x}%;
  top: ${({ y }) => y}%;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  cursor: ${({ unlocked }) => unlocked ? 'pointer' : 'default'};
  transition: all 0.3s ease;
  
  ${({ discovered, unlocked, active, domain, mastery }) => {
    if (!discovered) {
      return `
        background: rgba(100, 100, 100, 0.3);
        border: 2px solid rgba(150, 150, 150, 0.3);
      `;
    }
    
    if (!unlocked) {
      return `
        background: rgba(255, 255, 255, 0.2);
        border: 2px solid rgba(255, 255, 255, 0.4);
        box-shadow: 0 0 8px rgba(255, 255, 255, 0.2);
      `;
    }
    
    const domainColor = DomainColors[domain];
    const intensity = Math.max(0.3, mastery / 100);
    
    return `
      background: radial-gradient(circle, ${domainColor} 0%, rgba(255, 255, 255, 0.8) 100%);
      border: 2px solid ${domainColor};
      box-shadow: 0 0 ${active ? '20px' : '12px'} ${domainColor}${Math.floor(intensity * 255).toString(16).padStart(2, '0')};
      transform: scale(${active ? 1.3 : 1});
    `;
  }}
  
  &:hover {
    transform: scale(${({ unlocked, active }) => unlocked ? (active ? 1.4 : 1.2) : 1.1});
  }
`;

const StarTooltip = styled.div<{ visible: boolean }>`
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.9);
  color: white;
  padding: ${spacing.xs} ${spacing.sm};
  border-radius: ${spacing.xs};
  font-size: ${typography.fontSize.sm};
  white-space: nowrap;
  opacity: ${({ visible }) => visible ? 1 : 0};
  pointer-events: none;
  transition: opacity 0.2s ease;
  z-index: 1000;
  margin-bottom: 8px;
  
  &::after {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    border: 4px solid transparent;
    border-top-color: rgba(0, 0, 0, 0.9);
  }
`;

const DomainStats = styled.div`
  position: absolute;
  top: 20px;
  right: 20px;
  display: flex;
  gap: ${spacing.sm};
  z-index: 100;
`;

const DomainStat = styled.div<{ color: string }>`
  background: rgba(0, 0, 0, 0.7);
  border: 1px solid ${({ color }) => color};
  padding: ${spacing.xs};
  border-radius: ${spacing.xs};
  font-size: ${typography.fontSize.sm};
  color: ${({ color }) => color};
  min-width: 60px;
  text-align: center;
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
  gap: ${spacing.lg};
`;

const EmptyStateTitle = styled.h2`
  font-size: ${typography.fontSize.xl};
  color: ${colors.textDim};
  margin: 0;
`;

const EmptyStateDescription = styled.p`
  font-size: ${typography.fontSize.md};
  color: ${colors.textDim};
  margin: 0;
  max-width: 400px;
  line-height: 1.6;
`;

export default function ConstellationView() {
  const { returnToPrevious } = useSceneStore();
  const [hoveredStar, setHoveredStar] = useState<string | null>(null);
  
  // Get data from stores
  const starsObject = useKnowledgeStore(state => state.stars);
  const starPoints = useGameStore(state => state.resources?.starPoints || 0);
  const unlockStar = useKnowledgeStore(state => state.unlockStar);
  const toggleStarActive = useKnowledgeStore(state => state.toggleStarActive);
  
  // Convert stars object to array and add positions if missing
  const stars = useMemo(() => {
    const starsArray = Object.values(starsObject);
    
    // Add random positions for stars that don't have them
    return starsArray.map((star, index) => {
      if (!star.position || (star.position.x === 0 && star.position.y === 0)) {
        // Generate positions in a circular pattern
        const angle = (index * 2 * Math.PI) / starsArray.length;
        const radius = 30 + (index % 3) * 15; // Vary radius for visual interest
        const centerX = 50;
        const centerY = 50;
        
        return {
          ...star,
          position: {
            x: centerX + Math.cos(angle) * radius,
            y: centerY + Math.sin(angle) * radius
          }
        };
      }
      return star;
    });
  }, [starsObject]);
  
  // Calculate domain statistics
  const domainStats = useMemo(() => {
    const stats: Record<KnowledgeDomain, { unlocked: number; total: number }> = {} as any;
    
    Object.values(KnowledgeDomain).forEach(domain => {
      stats[domain] = { unlocked: 0, total: 0 };
    });
    
    stars.forEach(star => {
      if (star.domain) {
        stats[star.domain].total++;
        if (star.unlocked) {
          stats[star.domain].unlocked++;
        }
      }
    });
    
    return stats;
  }, [stars]);
  
  const handleStarClick = (star: any) => {
    if (!star.discovered) return;
    
    if (!star.unlocked) {
      // Try to unlock if player has enough star points
      unlockStar(star.id);
    } else {
      // Toggle active state
      toggleStarActive(star.id);
    }
  };
  
  const discoveredStars = stars.filter(star => star.discovered);
  
  if (discoveredStars.length === 0) {
    return (
      <ConstellationContainer>
        <StarField />
        <BackButton onClick={returnToPrevious}>
          ← Back to Hospital
        </BackButton>
        
        <EmptyState>
          <EmptyStateTitle>Knowledge Constellation</EmptyStateTitle>
          <EmptyStateDescription>
            Your expertise grows like stars in the night sky. As you progress through your residency and discover new concepts, they will appear here as constellation points, connecting to form patterns of understanding.
          </EmptyStateDescription>
          <EmptyStateDescription>
            <em>Complete activities and challenges to discover your first concepts!</em>
          </EmptyStateDescription>
        </EmptyState>
      </ConstellationContainer>
    );
  }
  
  return (
    <ConstellationContainer>
      <StarField />
      <BackButton onClick={returnToPrevious}>
        ← Back to Hospital
      </BackButton>
      
      <Header>
        <ConstellationTitle>Knowledge Constellation</ConstellationTitle>
        <StarPointsDisplay>
          <span style={{ color: colors.highlight, fontSize: typography.fontSize.lg }}>★</span>
          <span style={{ fontWeight: 'bold' }}>{starPoints}</span>
        </StarPointsDisplay>
      </Header>
      
      <DomainStats>
        {Object.entries(domainStats).map(([domain, stats]) => (
          <DomainStat key={domain} color={DomainColors[domain as KnowledgeDomain]}>
            {domain.replace('_', ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ')}
            <br />
            {stats.unlocked}/{stats.total}
          </DomainStat>
        ))}
      </DomainStats>
      
      <ConstellationMain>
        <ConstellationCanvas>
          {stars.map(star => (
            <Star
              key={star.id}
              x={star.position.x}
              y={star.position.y}
              domain={star.domain}
              discovered={star.discovered}
              unlocked={star.unlocked}
              active={star.active}
              mastery={star.mastery}
              onClick={() => handleStarClick(star)}
              onMouseEnter={() => setHoveredStar(star.id)}
              onMouseLeave={() => setHoveredStar(null)}
            >
              {hoveredStar === star.id && (
                <StarTooltip visible={true}>
                  {star.name} {star.unlocked ? `(${star.mastery}% mastery)` : `(${star.spCost} SP to unlock)`}
                </StarTooltip>
              )}
            </Star>
          ))}
        </ConstellationCanvas>
      </ConstellationMain>
    </ConstellationContainer>
  );
} 