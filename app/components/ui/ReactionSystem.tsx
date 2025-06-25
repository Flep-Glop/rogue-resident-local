'use client';

import React, { useState, useEffect, useCallback } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { colors, spacing, typography } from '@/app/styles/pixelTheme';

// Animation keyframes for mentor portrait reactions  
// These will be applied to a wrapper, not the positioned portrait
const shakeAnimation = keyframes`
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-3px); }
  20%, 40%, 60%, 80% { transform: translateX(3px); }
`;

const bounceAnimation = keyframes`
  0%, 100% { transform: translateY(0) scale(1); }
  25% { transform: translateY(-6px) scale(1.02); }
  50% { transform: translateY(-3px) scale(1.01); }
  75% { transform: translateY(-1px) scale(1.005); }
`;

const nodAnimation = keyframes`
  0%, 100% { transform: rotate(0deg); }
  25% { transform: rotate(-2deg); }
  75% { transform: rotate(2deg); }
`;

const pulseAnimation = keyframes`
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.03); }
`;

// Floating reaction symbol animations
const symbolBounceIn = keyframes`
  0% { 
    transform: scale(0.3) translateY(20px); 
    opacity: 0; 
  }
  60% { 
    transform: scale(1.1) translateY(-10px); 
    opacity: 1; 
  }
  100% { 
    transform: scale(1) translateY(0); 
    opacity: 1; 
  }
`;

const symbolFloatUp = keyframes`
  0% { 
    transform: translateY(0) scale(1);
    opacity: 1; 
  }
  100% { 
    transform: translateY(-30px) scale(0.8);
    opacity: 0; 
  }
`;

// Portrait animation types
export type PortraitAnimationType = 
  | 'shake'      // Wrong answer, disapproval
  | 'bounce'     // Excitement, correct answer
  | 'nod'        // Agreement, understanding
  | 'pulse'      // Attention, emphasis
  | 'none';

// Reaction symbol types
export type ReactionSymbolType = 
  | '!'          // Surprise/shock
  | '?'          // Confusion/questioning
  | '...'        // Thinking/pondering
  | '💡'         // Eureka/understanding
  | '⭐';        // Success/achievement

// Sprite sheet mapping (125x25, 5 symbols at 25x25 each)
const SYMBOL_SPRITE_MAP: Record<ReactionSymbolType, number> = {
  '!': 0,      // First symbol (0-24px)
  '?': 1,      // Second symbol (25-49px)  
  '...': 2,    // Third symbol (50-74px)
  '💡': 3,     // Fourth symbol (75-99px)
  '⭐': 4      // Fifth symbol (100-124px)
};

// Portrait animation mixin
export const getPortraitAnimation = (type: PortraitAnimationType) => {
  switch (type) {
    case 'shake':
      return css`animation: ${shakeAnimation} 0.6s ease-in-out;`;
    case 'bounce':
      return css`animation: ${bounceAnimation} 0.8s ease-out;`;
    case 'nod':
      return css`animation: ${nodAnimation} 1s ease-in-out;`;
    case 'pulse':
      return css`animation: ${pulseAnimation} 0.4s ease-in-out;`;
    default:
      return css``;
  }
};

// Sprite symbol component for displaying symbols from sprite sheet
const SpriteSymbol = styled.div<{ $symbolIndex: number }>`
  width: 60px;  /* Matching the FloatingSymbol size */
  height: 60px;
  background-image: url('/images/ui/reaction-symbols.png');
  background-size: 300px 60px; /* Scaled sprite sheet to match new size */
  background-position: ${props => -props.$symbolIndex * 60}px 0px;
  background-repeat: no-repeat;
  image-rendering: pixelated;
  image-rendering: -moz-crisp-edges;
  image-rendering: -webkit-crisp-edges;
  image-rendering: crisp-edges;
  -ms-interpolation-mode: nearest-neighbor;
`;

// Floating reaction symbol component
const FloatingSymbol = styled.div<{ 
  $type: ReactionSymbolType; 
  $x: number; 
  $y: number;
  $stage: 'appearing' | 'floating' | 'disappearing';
}>`
  position: absolute;
  left: ${props => props.$x}px;
  top: ${props => props.$y}px;
  width: 60px;  /* Slightly larger for better visibility */
  height: 60px;
  pointer-events: none;
  z-index: 1000; /* Much higher z-index to ensure visibility */
  
  /* Enhanced glow effect for better visibility */
  filter: drop-shadow(0 0 8px rgba(255, 255, 255, 0.8)) drop-shadow(0 0 4px rgba(0, 0, 0, 0.5));
  
  ${props => props.$stage === 'appearing' && css`
    animation: ${symbolBounceIn} 0.4s ease-out forwards;
  `}
  
  ${props => props.$stage === 'floating' && css`
    animation: ${symbolFloatUp} 2s ease-out forwards;
    animation-delay: 0.4s;
  `}
`;

interface FloatingReaction {
  id: string;
  type: ReactionSymbolType;
  x: number;
  y: number;
  stage: 'appearing' | 'floating' | 'disappearing';
  timestamp: number;
}

interface ReactionSystemProps {
  containerRef?: React.RefObject<HTMLElement | HTMLDivElement | null>;
  onAnimationComplete?: () => void;
}

export default function ReactionSystem({ containerRef, onAnimationComplete }: ReactionSystemProps) {
  const [activeReactions, setActiveReactions] = useState<FloatingReaction[]>([]);
  
  // Spawn a floating reaction symbol
  const spawnReaction = useCallback((type: ReactionSymbolType, x?: number, y?: number) => {
    const container = containerRef?.current;
    const containerRect = container?.getBoundingClientRect();
    
    // Default to center-ish if no coordinates provided
    const spawnX = x ?? (containerRect ? containerRect.width * 0.7 : 300);
    const spawnY = y ?? (containerRect ? containerRect.height * 0.3 : 150);
    
    const newReaction: FloatingReaction = {
      id: `reaction-${Date.now()}-${Math.random()}`,
      type,
      x: spawnX,
      y: spawnY,
      stage: 'appearing',
      timestamp: Date.now()
    };
    
    setActiveReactions(prev => [...prev, newReaction]);
    
    // Transition to floating stage
    setTimeout(() => {
      setActiveReactions(prev => 
        prev.map(reaction => 
          reaction.id === newReaction.id 
            ? { ...reaction, stage: 'floating' }
            : reaction
        )
      );
    }, 400);
    
    // Remove after total animation time
    setTimeout(() => {
      setActiveReactions(prev => 
        prev.filter(reaction => reaction.id !== newReaction.id)
      );
      onAnimationComplete?.();
    }, 2800);
  }, [containerRef, onAnimationComplete]);
  
  // Listen for custom events to spawn reactions
  useEffect(() => {
    const handleSpawnReaction = (event: CustomEvent) => {
      const { type, x, y } = event.detail;
      spawnReaction(type, x, y);
    };

    window.addEventListener('spawnReaction', handleSpawnReaction as EventListener);
    
    return () => {
      window.removeEventListener('spawnReaction', handleSpawnReaction as EventListener);
    };
  }, [spawnReaction]);

  // Clean up old reactions
  useEffect(() => {
    const cleanup = setInterval(() => {
      const now = Date.now();
      setActiveReactions(prev => 
        prev.filter(reaction => now - reaction.timestamp < 3000)
      );
    }, 1000);
    
    return () => clearInterval(cleanup);
  }, []);
  
  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      pointerEvents: 'none',
      zIndex: 2000,
    }}>
      {activeReactions.map((reaction) => (
        <FloatingSymbol
          key={reaction.id}
          $type={reaction.type}
          $x={reaction.x}
          $y={reaction.y}
          $stage={reaction.stage}
        >
          <SpriteSymbol $symbolIndex={SYMBOL_SPRITE_MAP[reaction.type]} />
        </FloatingSymbol>
      ))}
    </div>
  );
}

// Hook for using the reaction system
export function useReactionSystem(containerRef?: React.RefObject<HTMLElement | HTMLDivElement | null>) {
  const [reactionSystemKey, setReactionSystemKey] = useState(0);
  
  const triggerReaction = (type: ReactionSymbolType, x?: number, y?: number) => {
    // Force re-render to spawn new reaction
    setReactionSystemKey(prev => prev + 1);
    
    // Use a temporary function to spawn the reaction
    const event = new CustomEvent('spawnReaction', {
      detail: { type, x, y }
    });
    window.dispatchEvent(event);
  };
  
  const triggerPortraitAnimation = (type: PortraitAnimationType) => {
    const event = new CustomEvent('portraitAnimation', {
      detail: { type }
    });
    window.dispatchEvent(event);
  };
  
  return {
    triggerReaction,
    triggerPortraitAnimation,
    ReactionSystemComponent: () => (
      <ReactionSystem 
        key={reactionSystemKey}
        containerRef={containerRef}
      />
    )
  };
}

// Test component for verifying sprite sheet (can be used in development)
export function ReactionSymbolTest() {
  const symbols: ReactionSymbolType[] = ['!', '?', '...', '💡', '⭐'];
  
  return (
    <div style={{ 
      position: 'fixed', 
      top: '20px', 
      right: '20px', 
      display: 'flex', 
      gap: '10px',
      background: 'rgba(0,0,0,0.8)',
      padding: '10px',
      borderRadius: '8px',
      zIndex: 9999
    }}>
      {symbols.map((symbol, index) => (
        <div key={symbol} style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          gap: '5px'
        }}>
          <SpriteSymbol $symbolIndex={SYMBOL_SPRITE_MAP[symbol]} />
          <span style={{ color: 'white', fontSize: '12px' }}>{symbol}</span>
        </div>
      ))}
    </div>
  );
} 