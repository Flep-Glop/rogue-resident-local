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

interface InsightParticlesProps {
  originPosition: { x: number; y: number } | null;
  targetPosition: { x: number; y: number } | null;
  amount: number;
  onComplete?: () => void;
}

/**
 * InsightParticles - Creates a burst of particles that first explode outward,
 * then converge on the insight meter with a glowing effect.
 * 
 * Updated to use originPosition to match FeedbackSystem naming convention.
 * Added fallback values to handle undefined positions.
 * Fixed infinite render loop with useMemo for stable references.
 */
export default function InsightParticles({ 
  originPosition, 
  targetPosition, 
  amount, 
  onComplete 
}: InsightParticlesProps) {
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
  const savedTargetRef = useRef(safeTarget);
  
  // Save the target position in a ref to ensure it's consistent
  // Use a ref to store the console.log function to avoid it being part of the dependencies
  const logRef = useRef((message: string, data: any) => {
    console.log(`[InsightParticles] ${message}:`, data);
  });
  
  // Update the saved target position only when safeTarget changes reference
  useEffect(() => {
    savedTargetRef.current = safeTarget;
    // Use the ref for logging to avoid it being a dependency
    logRef.current("Target position saved", safeTarget);
  }, [safeTarget]);
  
  // Generate particles only once on mount with stable dependencies
  useEffect(() => {
    // Debug - log both positions via the ref
    logRef.current("Origin position", safeOrigin);
    logRef.current("Target position", safeTarget);
    
    // Only continue if not in completed phase already to prevent re-running
    if (phase === 'completed') return;
    
    const newParticles: Particle[] = [];
    // Revert to original particle count
    const particleCount = Math.min(Math.max(10, Math.floor(amount * 1)), 25);
    
    // Create random particles
    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 5;
      
      newParticles.push({
        id: particleCountRef.current++,
        x: 0,
        y: 0,
        // Larger pixel-sized particles for more visibility (3-6px)
        size: 3 + Math.random() * 3,
        color: getRandomInsightColor(),
        delay: Math.random() * 0.2,
        initialVelocity: {
          x: Math.cos(angle) * speed,
          y: Math.sin(angle) * speed
        }
      });
    }
    
    setParticles(newParticles);
    
    // After explosion phase, transition to flow phase
    const explosionTimer = setTimeout(() => {
      setPhase('flow');
    }, 800);
    
    // Original completion time
    const completionTimer = setTimeout(() => {
      setPhase('completed');
      if (onComplete) onComplete();
    }, 2000);
    
    return () => {
      clearTimeout(explosionTimer);
      clearTimeout(completionTimer);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [amount, onComplete]); // Removed safeOrigin and safeTarget from dependencies to break the loop
  
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
            className="absolute"
            style={{
              backgroundColor: particle.color,
              // Larger pixel style with neon glow effect
              width: particle.size,
              height: particle.size,
              borderRadius: 0,
              boxShadow: `0 0 6px ${particle.color}, 0 0 3px ${particle.color}`,
              // Use CSS to force crisp pixel rendering
              imageRendering: 'pixelated'
            }}
            initial={{ 
              x: safeOrigin.x, 
              y: safeOrigin.y, 
              opacity: 0,
              scale: 0
            }}
            animate={phase === 'explosion' ? {
              x: [
                safeOrigin.x, 
                safeOrigin.x + particle.initialVelocity.x * 20
              ],
              y: [
                safeOrigin.y, 
                safeOrigin.y + particle.initialVelocity.y * 20
              ],
              opacity: [0, 1, 0.9],
              scale: [0, 1, 1],
            } : {
              // Use the saved target position to ensure consistency
              x: savedTargetRef.current.x + (Math.random() * 8 - 4),
              y: savedTargetRef.current.y + (Math.random() * 8 - 4),
              // Fade to 0.3 instead of 0, so particles remain slightly visible
              opacity: [0.9, 0.3],
              scale: [1, 0.5],
            }}
            transition={phase === 'explosion' ? {
              duration: 0.8,
              delay: particle.delay,
              ease: "easeOut"
            } : {
              // Original duration
              duration: 1,
              ease: "easeInOut"
            }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

// Helper to create random insight-themed colors
function getRandomInsightColor() {
  const colors = [
    '#2aeeff', // Light blue
    '#90eeff', // Pale blue
    '#ffffff', // White
    '#eef7ff', // Very pale blue
    '#64d7ff'  // Medium blue
  ];
  return colors[Math.floor(Math.random() * colors.length)];
} 