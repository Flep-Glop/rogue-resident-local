'use client';

import React, { useRef, useState, useCallback, useMemo } from 'react';
import { useKnowledgeStore } from '@/app/store/knowledgeStore';
import { DomainColors, KnowledgeDomain } from '@/app/types';
import { useGameStore } from '@/app/store/gameStore';
import { Star } from './Star';
import { Connection } from './Connection';
import { ConstellationControls } from './ConstellationControls';

export const ConstellationView: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  // Get stars and connections from store - using individual selectors
  const starsObject = useKnowledgeStore(state => state.stars);
  const connectionsObject = useKnowledgeStore(state => state.connections);
  const unlockStar = useKnowledgeStore(state => state.unlockStar);
  const toggleStarActive = useKnowledgeStore(state => state.toggleStarActive);
  const discoveredTodayIds = useKnowledgeStore(state => state.discoveredToday);
  
  // Convert objects to arrays using useMemo to prevent recalculation on every render
  const stars = useMemo(() => Object.values(starsObject), [starsObject]);
  const connections = useMemo(() => Object.values(connectionsObject), [connectionsObject]);
  
  // Get resources for UI display
  const starPoints = useGameStore(state => state.resources.starPoints);
  
  // Filter stars based on discovery status - using useMemo
  const discoveredStars = useMemo(() => 
    stars.filter(star => star.discovered), 
  [stars]);
  
  const unlockedStars = useMemo(() => 
    stars.filter(star => star.unlocked), 
  [stars]);
  
  const activeStars = useMemo(() => 
    stars.filter(star => star.unlocked && star.active), 
  [stars]);
  
  // Group stars by domain for the domain summary - using useMemo
  const domainStats = useMemo(() => {
    return Object.values(KnowledgeDomain).reduce((acc, domain) => {
      const domainStars = stars.filter(star => star.domain === domain);
      const unlocked = domainStars.filter(star => star.unlocked).length;
      const total = domainStars.length;
      const avgMastery = domainStars.length > 0 
        ? domainStars.reduce((sum, s) => sum + (s.unlocked ? s.mastery : 0), 0) / total 
        : 0;
      
      acc[domain] = { unlocked, total, avgMastery };
      return acc;
    }, {} as Record<KnowledgeDomain, { unlocked: number; total: number; avgMastery: number }>);
  }, [stars]);
  
  // Handle pan/zoom interactions with useCallback
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  }, []);
  
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    
    setOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
    setDragStart({ x: e.clientX, y: e.clientY });
  }, [isDragging, dragStart]);
  
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);
  
  const handleZoom = useCallback((direction: 'in' | 'out') => {
    setScale(prev => {
      if (direction === 'in' && prev < 2) return prev + 0.1;
      if (direction === 'out' && prev > 0.5) return prev - 0.1;
      return prev;
    });
  }, []);
  
  // Handle star selection/activation
  const handleStarClick = useCallback((starId: string) => {
    const star = stars.find(s => s.id === starId);
    if (!star) return;
    
    if (star.unlocked) {
      toggleStarActive(starId);
    } else if (star.discovered) {
      unlockStar(starId);
    }
  }, [stars, toggleStarActive, unlockStar]);
  
  // Memoize the rendered connections to prevent unnecessary recalculations
  const renderedConnections = useMemo(() => {
    return connections.map(connection => {
      const sourceId = connection.sourceId;
      const targetId = connection.targetId;
      const source = stars.find(s => s.id === sourceId);
      const target = stars.find(s => s.id === targetId);
      
      if (!source || !target) return null;
      
      return (
        <Connection 
          key={connection.id}
          connection={connection}
          sourcePosition={source.position}
          targetPosition={target.position}
          domain={source.domain}
        />
      );
    });
  }, [connections, stars]);
  
  // Memoize the rendered stars to prevent unnecessary recalculations
  const renderedStars = useMemo(() => {
    return stars.map(star => {
      // Only show discovered or unlocked stars
      if (!star.discovered && !star.unlocked) return null;
      
      return (
        <Star 
          key={star.id}
          star={star}
          onClick={() => handleStarClick(star.id)}
          isNewlyDiscovered={discoveredTodayIds.includes(star.id)}
        />
      );
    });
  }, [stars, handleStarClick, discoveredTodayIds]);
  
  return (
    <div className="fixed inset-0 bg-gray-900 p-4 text-white">
      <h2 className="text-2xl font-bold mb-4">Knowledge Constellation</h2>
      
      {/* Domain stats and controls */}
      <div className="mb-4 flex justify-between items-center">
        <div className="flex space-x-4">
          {Object.entries(domainStats).map(([domain, stats]) => (
            <div 
              key={domain} 
              className="px-3 py-1 rounded-full" 
              style={{ backgroundColor: DomainColors[domain as KnowledgeDomain] + '33' }}
            >
              <span className="font-medium">{domain.replace('_', ' ')}</span>
              <span className="ml-2 text-sm opacity-80">{stats.unlocked}/{stats.total}</span>
            </div>
          ))}
        </div>
        
        <div className="flex items-center">
          <span className="mr-2">Star Points:</span>
          <span className="px-2 py-1 bg-yellow-500 text-black rounded-md font-bold">
            {starPoints}
          </span>
          
          <ConstellationControls 
            onZoomIn={() => handleZoom('in')}
            onZoomOut={() => handleZoom('out')}
          />
        </div>
      </div>
      
      {/* Main constellation view */}
      <div 
        ref={containerRef}
        className="w-full h-[calc(100vh-280px)] bg-gray-950 rounded-lg overflow-hidden cursor-move relative"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Render connections */}
        <svg 
          className="absolute inset-0 w-full h-full" 
          style={{ 
            transform: `scale(${scale}) translate(${offset.x}px, ${offset.y}px)`,
            transformOrigin: 'center'
          }}
        >
          {renderedConnections}
        </svg>
        
        {/* Render stars */}
        <div 
          className="absolute inset-0" 
          style={{ 
            transform: `scale(${scale}) translate(${offset.x}px, ${offset.y}px)`,
            transformOrigin: 'center' 
          }}
        >
          {renderedStars}
        </div>
      </div>
    </div>
  );
}; 