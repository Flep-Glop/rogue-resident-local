'use client';

import React, { useEffect, useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  delay: number;
  initialVelocity: { x: number; y: number };
}

interface MomentumParticlesProps {
  originPosition: { x: number; y: number } | null;
  targetPosition: { x: number; y: number } | null;
  effect?: 'increment' | 'reset' | 'maintain';
  amount?: number;
  onComplete?: () => void;
}

/**
 * MomentumParticles - Creates momentum-themed particle effects based on the effect type.
 * 
 * - Increment: Fire-like particles that explode and converge on the momentum counter
 * - Reset: Shattered particles that scatter away from the momentum counter
 * - Maintain: Subtle pulsing effect around the momentum counter
 * 
 * Updated to work with the Resource Tier System
 * Fixed infinite render loops with useMemo for stable references.
 */
export default function MomentumParticles({ 
  originPosition, 
  targetPosition, 
  effect = 'increment',
  amount = 1, 
  onComplete 
}: MomentumParticlesProps) {
  // Memoize fallback positions to prevent infinite render loops
  const fallbackOrigin = useMemo(() => ({ 
    x: typeof window !== 'undefined' ? window.innerWidth / 2 : 0, 
    y: typeof window !== 'undefined' ? window.innerHeight / 2 : 0 
  }), []);
  
  const fallbackTarget = useMemo(() => ({ 
    x: typeof window !== 'undefined' ? window.innerWidth / 2 : 0, 
    y: typeof window !== 'undefined' ? 100 : 0 
  }), []);
  
  // Safe positions that are never undefined - memoized to maintain referential stability
  const safeOrigin = useMemo(() => originPosition || fallbackOrigin, [originPosition, fallbackOrigin]);
  const safeTarget = useMemo(() => targetPosition || fallbackTarget, [targetPosition, fallbackTarget]);
  
  const [particles, setParticles] = useState<Particle[]>([]);
  const [phase, setPhase] = useState<'explosion' | 'flow' | 'completed'>('explosion');
  const particleCountRef = useRef(0);
  
  // Use a ref to store the console.log function to avoid it being part of the dependencies
  const logRef = useRef((message: string, data: any) => {
    console.log(`[MomentumParticles] ${message}:`, data);
  });
  
  // Generate particles only once on mount with stable dependencies
  useEffect(() => {
    // Only continue if not in completed phase already to prevent re-running
    if (phase === 'completed') return;
    
    // Debug logging via ref
    logRef.current("Effect type", effect);
    logRef.current("Origin position", safeOrigin);
    logRef.current("Target position", safeTarget);
    
    const newParticles: Particle[] = [];
    const isIncrement = effect === 'increment';
    const isReset = effect === 'reset';
    
    // Determine particle count based on effect
    let particleCount = isIncrement 
      ? Math.min(Math.max(5, Math.floor(amount * 3)), 25) // More particles for increment
      : isReset 
        ? 30 // Many particles for reset (shattering effect)
        : 10; // Fewer particles for maintain
    
    // Create particles with different behaviors based on effect
    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = isIncrement 
        ? 2 + Math.random() * 5
        : isReset
          ? 5 + Math.random() * 10 // Faster for reset
          : 1 + Math.random() * 2; // Slower for maintain
      
      newParticles.push({
        id: particleCountRef.current++,
        x: 0,
        y: 0,
        size: isIncrement
          ? 3 + Math.random() * 7 // Medium for increment
          : isReset
            ? 2 + Math.random() * 4 // Smaller for reset
            : 4 + Math.random() * 6, // Larger for maintain
        color: isIncrement
          ? getRandomMomentumColor()
          : isReset
            ? getRandomResetColor()
            : getRandomMaintainColor(),
        delay: Math.random() * 0.3,
        initialVelocity: {
          x: Math.cos(angle) * speed,
          y: Math.sin(angle) * speed
        }
      });
    }
    
    setParticles(newParticles);
    
    // After explosion phase, transition to flow phase or completed based on effect
    const explosionTimer = setTimeout(() => {
      if (isReset) {
        // For reset, we don't have a flow phase
        setPhase('completed');
        if (onComplete) onComplete();
      } else {
        setPhase('flow');
      }
    }, isIncrement ? 700 : isReset ? 1200 : 500);
    
    // After flow phase completes (for increment and maintain)
    const completionTimer = setTimeout(() => {
      setPhase('completed');
      if (onComplete) onComplete();
    }, isIncrement ? 1800 : 1500);
    
    return () => {
      clearTimeout(explosionTimer);
      clearTimeout(completionTimer);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [amount, effect, onComplete]); // Removed safeOrigin and safeTarget from dependencies
  
  // Return null when animation is complete
  if (phase === 'completed') return null;
  
  return (
    <div 
      className="fixed pointer-events-none z-50"
      style={{ top: 0, left: 0, width: '100vw', height: '100vh' }}
    >
      <AnimatePresence>
        {particles.map(particle => (
          <motion.div
            key={particle.id}
            className="absolute rounded-full filter"
            style={{
              backgroundColor: particle.color,
              boxShadow: `0 0 10px ${particle.color}`,
              width: particle.size,
              height: particle.size
            }}
            initial={{ 
              x: effect === 'reset' ? safeTarget.x : safeOrigin.x, 
              y: effect === 'reset' ? safeTarget.y : safeOrigin.y, 
              opacity: 0,
              scale: 0
            }}
            animate={phase === 'explosion' ? {
              x: effect === 'reset'
                // For reset: scatter from target
                ? safeTarget.x + particle.initialVelocity.x * 50
                // For others: start at origin, move outward
                : [safeOrigin.x, safeOrigin.x + particle.initialVelocity.x * 25],
              y: effect === 'reset'
                ? safeTarget.y + particle.initialVelocity.y * 50
                : [safeOrigin.y, safeOrigin.y + particle.initialVelocity.y * 25],
              opacity: effect === 'reset' ? [1, 0] : [0, 1, 0.9],
              scale: effect === 'reset' ? [1, 0] : [0, 1.3, 1],
              rotate: effect === 'reset' ? [0, Math.random() * 720 - 360] : 0
            } : {
              // Flow phase (only for increment and maintain)
              x: safeTarget.x,
              y: safeTarget.y,
              opacity: [0.9, 0],
              scale: [1, 0.6],
            }}
            transition={phase === 'explosion' ? {
              duration: effect === 'reset' ? 1.2 : 0.7,
              delay: particle.delay,
              ease: effect === 'reset' ? "easeOut" : "easeOut"
            } : {
              duration: 0.8,
              ease: "easeInOut"
            }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

// Helper to create random momentum-themed colors (orange/red fire effect)
function getRandomMomentumColor() {
  const colors = [
    '#ff8c00', // Dark Orange
    '#ffa500', // Orange
    '#ff6347', // Tomato
    '#ff4500', // OrangeRed
    '#ffe4b5', // Moccasin (light orange/yellow for glow effects)
    '#ffffe0', // Light Yellow
    '#ffdd90', // Light amber
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

// Helper for reset effect (red/dark/broken pieces)
function getRandomResetColor() {
  const colors = [
    '#ff0000', // Red
    '#8b0000', // Dark Red
    '#b22222', // Fire Brick
    '#a50000', // Darker Red
    '#800000', // Maroon
    '#330000', // Very Dark Red
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

// Helper for maintain effect (subtle gold/yellow)
function getRandomMaintainColor() {
  const colors = [
    '#ffd700', // Gold
    '#f0e68c', // Khaki
    '#ffffe0', // Light Yellow
    '#ffff99', // Light Yellow 2
    '#fffacd', // Lemon Chiffon
  ];
  return colors[Math.floor(Math.random() * colors.length)];
} 