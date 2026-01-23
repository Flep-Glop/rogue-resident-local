"use client";

import { useState, useEffect, useRef, useCallback } from 'react';

// ============================================================================
// IDLE ANIMATION CONFIGURATION
// ============================================================================

// Match player's animation timing from CombinedHomeScene.constants.ts
const FRAME_INTERVAL = 50; // ms between ticks (20 FPS base)
const IDLE_FRAME_SPEED = 12; // Update animation frame every N ticks (600ms per frame)
const WALK_FRAME_SPEED = 3; // Faster animation for walking (150ms per frame)

// Layer groups for animation
// These match the CHARACTER_PARTS structure in page.tsx
export const HEAD_LAYER_IDS = [
  'ears', 'face', 'nose', 'eyes', 'eyebrows', 'mouth', 'facial-hair', 'hair', 'extras'
] as const;

// Torso moves with breathing, legs/shoes stay planted
export const TORSO_LAYER_IDS = ['body'] as const;
export const STATIC_LAYER_IDS = ['legs', 'shoes'] as const;

// Parts that have back-facing variants (based on exported assets)
// Parts NOT in this list will be hidden when facing back
export const PARTS_WITH_BACK_VARIANTS = [
  'body', 'ears', 'extras', 'face', 'hair', 'legs', 'shoes'
] as const;

// Parts that have left/right-facing variants (based on exported assets)
// Parts NOT in this list will be hidden when facing left or right
// Note: This is a general list - specific variant availability is controlled in page.tsx sideVariants arrays
export const PARTS_WITH_SIDE_VARIANTS = [
  'body', 'ears', 'extras', 'eyebrows', 'eyes', 'face', 'facial-hair', 'hair', 'legs', 'mouth', 'nose', 'shoes'
] as const;

// Parts that have walking animation frames (frames 4-7 in Aseprite, exported as -w1 through -w4)
export const PARTS_WITH_WALK_FRAMES = ['legs', 'shoes'] as const;

// Parts that have climbing animation frames (frames 8-9 in Aseprite, exported as -back-c1, -back-c2)
// Body has both c1 (hands down) and c2 (arm up)
// Legs and shoes only have c1 (knee up)
export const PARTS_WITH_CLIMB_C1 = ['body', 'legs', 'shoes'] as const;
export const PARTS_WITH_CLIMB_C2 = ['body'] as const;

// 4-frame breathing cycle - Y offset in pixels (positive = down)
// Matches typical idle animation timing (~2.4 second full loop at 600ms/frame)
// Only head and torso move - legs/shoes stay planted for realistic grounding
const IDLE_ANIMATION_FRAMES = [
  { head: 0, torso: 0 },   // Frame 0: Neutral
  { head: 1, torso: 0 },   // Frame 1: Head down 1px (breathing in - compression starts)
  { head: 1, torso: 1 },   // Frame 2: Torso follows 1px (full compression)
  { head: 0, torso: 0 },   // Frame 3: Return to neutral (exhale)
];

// Walking animation pattern for legs/shoes
// Maps to sprite suffixes: 0 = idle (-right/-left), 1-4 = walk frames (-right-w1 through -w4)
// Pattern: idle, w1, w2, w1, idle, w3, w4, w3 (one full walk cycle)
// This creates: neutral → step forward → extend → step back → neutral → other leg forward → extend → back
export const WALK_ANIMATION_SEQUENCE = [0, 1, 2, 1, 0, 3, 4, 3] as const;

// Climbing animation pattern (6 frames total, 3 normal + 3 flipped for other arm/leg)
// Each frame specifies which sprite suffix to use for body/legs/shoes:
//   '' = use regular -back.png sprite
//   'c1' = use -back-c1.png (body: hands down, legs/shoes: knee up)
//   'c2' = use -back-c2.png (body: arm up)
// flip: whether to horizontally flip all sprites (for opposite arm/leg)
export const CLIMB_ANIMATION_SEQUENCE = [
  { body: 'c1', legs: '', shoes: '', flip: false },   // Frame 0: hands down, legs normal
  { body: 'c2', legs: '', shoes: '', flip: false },   // Frame 1: arm up, legs normal
  { body: 'c2', legs: 'c1', shoes: 'c1', flip: false }, // Frame 2: arm up, knee up
  { body: 'c1', legs: '', shoes: '', flip: true },    // Frame 3: hands down, legs normal (flipped)
  { body: 'c2', legs: '', shoes: '', flip: true },    // Frame 4: arm up, legs normal (flipped)
  { body: 'c2', legs: 'c1', shoes: 'c1', flip: true }, // Frame 5: arm up, knee up (flipped)
] as const;

export const CLIMB_FRAME_SPEED = 4; // Climbing animation speed (200ms per frame at 50ms tick)

// Back-facing now uses single static sprite (-back.png)
// No animation frames needed - just one back view per part

export type LayerId = typeof HEAD_LAYER_IDS[number] | typeof TORSO_LAYER_IDS[number] | typeof STATIC_LAYER_IDS[number];
export type Direction = 'front' | 'back' | 'left' | 'right';

// ============================================================================
// IDLE ANIMATION HOOK
// ============================================================================

interface UseIdleAnimationReturn {
  /** Current idle animation frame index (0-3) */
  frame: number;
  /** Current walk animation sequence index (0-7), only used when isWalking */
  walkFrame: number;
  /** Current climb animation sequence index (0-5), only used when isClimbing */
  climbFrame: number;
  /** Get Y-offset in pixels for a specific layer */
  getLayerOffset: (layerId: string) => number;
  /** Whether animation is currently running */
  isAnimating: boolean;
  /** Pause/resume animation */
  setAnimating: (animating: boolean) => void;
  /** Current facing direction */
  direction: Direction;
  /** Set facing direction */
  setDirection: (direction: Direction) => void;
  /** Check if a part should be visible in current direction */
  isPartVisible: (partId: string, hasBackVariant: boolean, hasSideVariant: boolean) => boolean;
  /** Whether character is currently walking (side arrow held) */
  isWalking: boolean;
  /** Set walking state (called by key hold detection) */
  setIsWalking: (walking: boolean) => void;
  /** Get the walk sprite suffix for a part ('' for idle, '-w1' to '-w4' for walk frames) */
  getWalkSpriteSuffix: (partId: string) => string;
  /** Whether character is currently climbing (up arrow held while facing back) */
  isClimbing: boolean;
  /** Set climbing state (called by key hold detection) */
  setIsClimbing: (climbing: boolean) => void;
  /** Get the climb sprite suffix for a part ('' for normal back, '-c1' or '-c2' for climb poses) */
  getClimbSpriteSuffix: (partId: string) => string;
  /** Whether current climb frame should be horizontally flipped */
  shouldFlipClimb: boolean;
}

/**
 * Hook for character idle breathing animation with directional and walking support
 * 
 * Provides Y-offsets for head and body layer groups to create a subtle
 * breathing effect. Matches player's idle animation timing (600ms per frame,
 * ~2.4 second full loop).
 * 
 * When walking (side arrow held), legs and shoes animate through the walk cycle
 * while head/body continue the idle breathing animation.
 * 
 * Usage:
 * ```tsx
 * const { getLayerOffset, direction, isWalking, getWalkSpriteSuffix } = useIdleAnimation();
 * // In render:
 * <SpriteLayer $yOffset={getLayerOffset(part.id)} ... />
 * ```
 */
export function useIdleAnimation(): UseIdleAnimationReturn {
  const [frame, setFrame] = useState(0);
  const [walkFrame, setWalkFrame] = useState(0);
  const [climbFrame, setClimbFrame] = useState(0);
  const [isAnimating, setAnimating] = useState(true);
  const [direction, setDirection] = useState<Direction>('front');
  const [isWalking, setIsWalking] = useState(false);
  const [isClimbing, setIsClimbing] = useState(false);
  
  // Refs for animation loop (avoid stale closures)
  const frameRef = useRef(0);
  const walkFrameRef = useRef(0);
  const climbFrameRef = useRef(0);
  const idleTickRef = useRef(0);
  const walkTickRef = useRef(0);
  const climbTickRef = useRef(0);
  const animationRef = useRef<NodeJS.Timeout | null>(null);
  const isWalkingRef = useRef(false);
  const isClimbingRef = useRef(false);
  
  // Keep refs in sync with state
  useEffect(() => {
    isWalkingRef.current = isWalking;
  }, [isWalking]);
  
  useEffect(() => {
    isClimbingRef.current = isClimbing;
  }, [isClimbing]);

  // Animation loop
  useEffect(() => {
    if (!isAnimating) {
      if (animationRef.current) {
        clearInterval(animationRef.current);
        animationRef.current = null;
      }
      return;
    }

    const animate = () => {
      // Idle animation (always runs for head/body breathing, but paused during climbing)
      if (!isClimbingRef.current) {
        idleTickRef.current++;
        if (idleTickRef.current >= IDLE_FRAME_SPEED) {
          idleTickRef.current = 0;
          frameRef.current = (frameRef.current + 1) % IDLE_ANIMATION_FRAMES.length;
          setFrame(frameRef.current);
        }
      }
      
      // Walk animation (only runs when walking)
      if (isWalkingRef.current) {
        walkTickRef.current++;
        if (walkTickRef.current >= WALK_FRAME_SPEED) {
          walkTickRef.current = 0;
          walkFrameRef.current = (walkFrameRef.current + 1) % WALK_ANIMATION_SEQUENCE.length;
          setWalkFrame(walkFrameRef.current);
        }
      } else {
        // Reset walk animation when not walking
        walkTickRef.current = 0;
        if (walkFrameRef.current !== 0) {
          walkFrameRef.current = 0;
          setWalkFrame(0);
        }
      }
      
      // Climb animation (only runs when climbing)
      if (isClimbingRef.current) {
        climbTickRef.current++;
        if (climbTickRef.current >= CLIMB_FRAME_SPEED) {
          climbTickRef.current = 0;
          climbFrameRef.current = (climbFrameRef.current + 1) % CLIMB_ANIMATION_SEQUENCE.length;
          setClimbFrame(climbFrameRef.current);
        }
      } else {
        // Reset climb animation when not climbing
        climbTickRef.current = 0;
        if (climbFrameRef.current !== 0) {
          climbFrameRef.current = 0;
          setClimbFrame(0);
        }
      }
    };

    animationRef.current = setInterval(animate, FRAME_INTERVAL);

    return () => {
      if (animationRef.current) {
        clearInterval(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [isAnimating]);

  // Get Y-offset for a layer based on its group
  const getLayerOffset = useCallback((layerId: string): number => {
    const currentFrame = IDLE_ANIMATION_FRAMES[frame];
    
    // Check if layer is in head group (moves most)
    if ((HEAD_LAYER_IDS as readonly string[]).includes(layerId)) {
      return currentFrame.head;
    }
    
    // Check if layer is in torso group (follows head)
    if ((TORSO_LAYER_IDS as readonly string[]).includes(layerId)) {
      return currentFrame.torso;
    }
    
    // Static layers (legs, shoes) and unknown layers - no offset
    // Legs and shoes stay planted for realistic grounding
    return 0;
  }, [frame]);

  // Check if a part should be visible based on direction
  const isPartVisible = useCallback((partId: string, hasBackVariant: boolean, hasSideVariant: boolean): boolean => {
    if (direction === 'front') {
      return true; // All parts visible from front
    }
    if (direction === 'back') {
      // From back, only show parts that have back variants
      return hasBackVariant;
    }
    // Left or right - only show parts that have side variants
    return hasSideVariant;
  }, [direction]);
  
  // Get the walk sprite suffix for a part
  // Returns '' for idle, '-w1' to '-w4' for walk frames
  const getWalkSpriteSuffix = useCallback((partId: string): string => {
    // Only legs and shoes have walk frames
    if (!(PARTS_WITH_WALK_FRAMES as readonly string[]).includes(partId)) {
      return '';
    }
    
    // Only show walk frames when actually walking and facing sideways
    if (!isWalking || (direction !== 'left' && direction !== 'right')) {
      return '';
    }
    
    // Get the current walk frame from the sequence
    const walkSpriteIndex = WALK_ANIMATION_SEQUENCE[walkFrame];
    
    // 0 = idle (no suffix), 1-4 = walk frames
    if (walkSpriteIndex === 0) {
      return '';
    }
    
    return `-w${walkSpriteIndex}`;
  }, [isWalking, direction, walkFrame]);
  
  // Get the climb sprite suffix for a part
  // Returns '' for normal back, '-c1' or '-c2' for climb poses
  const getClimbSpriteSuffix = useCallback((partId: string): string => {
    // Only show climb frames when actually climbing and facing back
    if (!isClimbing || direction !== 'back') {
      return '';
    }
    
    // Get the current climb frame configuration
    const climbConfig = CLIMB_ANIMATION_SEQUENCE[climbFrame];
    
    // Determine which suffix to use based on the part
    let suffix = '';
    if (partId === 'body') {
      suffix = climbConfig.body;
    } else if (partId === 'legs') {
      suffix = climbConfig.legs;
    } else if (partId === 'shoes') {
      suffix = climbConfig.shoes;
    }
    
    // Return empty string for normal back, or '-c1'/'-c2' for climb poses
    if (suffix === '') {
      return '';
    }
    return `-${suffix}`;
  }, [isClimbing, direction, climbFrame]);
  
  // Check if current climb frame should be horizontally flipped
  const shouldFlipClimb = isClimbing && direction === 'back' && CLIMB_ANIMATION_SEQUENCE[climbFrame].flip;

  return {
    frame,
    walkFrame,
    climbFrame,
    getLayerOffset,
    isAnimating,
    setAnimating,
    direction,
    setDirection,
    isPartVisible,
    isWalking,
    setIsWalking,
    getWalkSpriteSuffix,
    isClimbing,
    setIsClimbing,
    getClimbSpriteSuffix,
    shouldFlipClimb,
  };
}

// ============================================================================
// ANIMATION TIMING UTILITIES
// ============================================================================

/**
 * Calculate the full loop duration in milliseconds
 * Useful for syncing with other animations or effects
 */
export function getIdleLoopDuration(): number {
  return FRAME_INTERVAL * IDLE_FRAME_SPEED * IDLE_ANIMATION_FRAMES.length;
}

/**
 * Get the number of frames in the idle animation
 */
export function getIdleFrameCount(): number {
  return IDLE_ANIMATION_FRAMES.length;
}

/**
 * Check if a part ID has back-facing variants available
 */
export function hasBackVariant(partId: string): boolean {
  return (PARTS_WITH_BACK_VARIANTS as readonly string[]).includes(partId);
}

/**
 * Check if a part ID has side-facing (left/right) variants available
 */
export function hasSideVariant(partId: string): boolean {
  return (PARTS_WITH_SIDE_VARIANTS as readonly string[]).includes(partId);
}
