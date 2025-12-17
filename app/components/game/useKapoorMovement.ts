import { useState, useEffect, useRef, MutableRefObject } from 'react';
import {
  KAPOOR_START_POSITION,
  WALK_SPEED,
  CLIMB_SPEED,
  FRAME_INTERVAL,
  WALK_SPRITE_FRAME_SPEED,
  IDLE_SPRITE_FRAME_SPEED,
  CLIMB_SPRITE_FRAME_SPEED,
  CLIMB_X_THRESHOLD,
  CLIMB_X_TOLERANCE,
  FLOOR_TOLERANCE,
  GROUND_FLOOR_Y,
  SECOND_FLOOR_Y,
  CLIMB_DISTANCE,
} from './CombinedHomeScene.constants';
import {
  FIRST_FLOOR_BOUNDS,
  SECOND_FLOOR_BOUNDS,
} from './CombinedHomeScene.styles';

export type KapoorDirection = 'front' | 'back' | 'right' | 'left';

export interface KapoorState {
  position: { x: number; y: number };
  direction: KapoorDirection;
  frame: number;
  isWalking: boolean;
  isClimbing: boolean;
}

export interface KapoorSetters {
  setPosition: (pos: { x: number; y: number }) => void;
  setDirection: (dir: KapoorDirection) => void;
  setIsWalking: (walking: boolean) => void;
  setIsClimbing: (climbing: boolean) => void;
}

// Callback for when player attempts to climb but is blocked
export interface KapoorMovementCallbacks {
  onClimbBlocked: () => void;
}

interface UseKapoorMovementProps {
  keysPressed: MutableRefObject<Set<string>>;
  currentView: 'home' | 'sky';
  picoInteracted: boolean;
  isClimbBlocked: boolean; // True when Pico blocking dialogue is active
  hasShownFirstBlockingMessage: boolean;
  callbacks: KapoorMovementCallbacks;
}

interface UseKapoorMovementReturn {
  state: KapoorState;
  setters: KapoorSetters;
  animationRef: MutableRefObject<NodeJS.Timeout | null>;
}

/**
 * Hook for Kapoor character movement and animation
 * Handles walking, climbing, and floor boundary detection
 */
export function useKapoorMovement({
  keysPressed,
  currentView,
  picoInteracted,
  isClimbBlocked,
  hasShownFirstBlockingMessage,
  callbacks,
}: UseKapoorMovementProps): UseKapoorMovementReturn {
  // Position and animation state
  const [position, setPosition] = useState(KAPOOR_START_POSITION);
  const [direction, setDirection] = useState<KapoorDirection>('front');
  const [frame, setFrame] = useState(0);
  const [isWalking, setIsWalking] = useState(false);
  const [isClimbing, setIsClimbing] = useState(false);
  const [climbingStartY, setClimbingStartY] = useState<number | null>(null);
  
  // Animation refs
  const animationRef = useRef<NodeJS.Timeout | null>(null);
  const frameCountRef = useRef(0);
  const frameTickRef = useRef(0);
  
  // Movement and animation loop
  useEffect(() => {
    const animateKapoor = () => {
      // Disable movement when in sky view
      if (currentView === 'sky') {
        return;
      }
      
      const keys = keysPressed.current;
      
      // Check which keys are pressed
      const leftPressed = keys.has('ArrowLeft');
      const rightPressed = keys.has('ArrowRight');
      const upPressed = keys.has('ArrowUp');
      const downPressed = keys.has('ArrowDown');
      
      let walking = false;
      let climbing = false;
      let isFrozenOnLadder = false;
      
      // Check if Kapoor is near climbing position
      setPosition(currentPos => {
        // Only allow climbing if within range AND not past the second floor right boundary
        const nearClimbPoint = Math.abs(currentPos.x - CLIMB_X_THRESHOLD) < CLIMB_X_TOLERANCE && 
                               currentPos.x <= SECOND_FLOOR_BOUNDS.right;
        
        // Check if Kapoor is on a valid floor (ground or second floor)
        const onGroundFloor = Math.abs(currentPos.y - GROUND_FLOOR_Y) < FLOOR_TOLERANCE;
        const onSecondFloor = Math.abs(currentPos.y - SECOND_FLOOR_Y) < FLOOR_TOLERANCE;
        const onValidFloor = onGroundFloor || onSecondFloor;
        
        // Handle climbing up
        if (nearClimbPoint && upPressed && !leftPressed && !rightPressed) {
          // PICO BLOCKING: Check if player hasn't talked to Pico yet
          if (!picoInteracted) {
            console.log('[useKapoorMovement] Pico blocks ladder - player must talk to Pico first!');
            climbing = true;
            isFrozenOnLadder = true;
            setIsClimbing(true);
            setIsWalking(false);
            // Trigger callback for blocking dialogue
            callbacks.onClimbBlocked();
            return currentPos;
          }
          
          // Check if at ceiling (second floor)
          if (currentPos.y <= SECOND_FLOOR_Y) {
            console.log('[useKapoorMovement] At ceiling - cannot climb higher, freezing animation');
            climbing = true;
            isFrozenOnLadder = true;
            setIsClimbing(true);
            setIsWalking(false);
            return currentPos;
          }
          
          // Start or continue climbing up
          if (climbingStartY === null) {
            console.log('[useKapoorMovement] Starting climb UP at y:', currentPos.y);
            setClimbingStartY(currentPos.y);
          }
          
          const distanceClimbed = (climbingStartY || currentPos.y) - currentPos.y;
          
          if (distanceClimbed < CLIMB_DISTANCE) {
            // Continue climbing up
            climbing = true;
            setIsClimbing(true);
            setIsWalking(false);
            
            const newY = Math.max(SECOND_FLOOR_Y, currentPos.y - CLIMB_SPEED);
            console.log('[useKapoorMovement] Climbing UP - distance:', distanceClimbed.toFixed(0), 'px');
            return { ...currentPos, y: newY };
          } else {
            // Finished climbing - return to idle
            console.log('[useKapoorMovement] Climb complete! Returning to idle');
            setIsClimbing(false);
            setIsWalking(false);
            setDirection('front');
            setClimbingStartY(null);
            return currentPos;
          }
        } 
        // Handle climbing down
        else if (nearClimbPoint && downPressed && !leftPressed && !rightPressed) {
          // Check if at floor
          if (currentPos.y >= GROUND_FLOOR_Y) {
            console.log('[useKapoorMovement] At ground floor - cannot climb lower, freezing animation');
            climbing = true;
            isFrozenOnLadder = true;
            setIsClimbing(true);
            setIsWalking(false);
            return currentPos;
          }
          
          // Climbing down
          climbing = true;
          setIsClimbing(true);
          setIsWalking(false);
          
          const newY = Math.min(GROUND_FLOOR_Y, currentPos.y + CLIMB_SPEED);
          console.log('[useKapoorMovement] Climbing DOWN to y:', newY.toFixed(0));
          return { ...currentPos, y: newY };
        }
        // Handle stopping on the ladder
        else if (nearClimbPoint && !upPressed && !downPressed && !leftPressed && !rightPressed) {
          console.log('[useKapoorMovement] Stopped on ladder - freezing climb frame');
          climbing = true;
          isFrozenOnLadder = true;
          setIsClimbing(true);
          setIsWalking(false);
          return currentPos;
        }
        else if (climbingStartY !== null && !nearClimbPoint) {
          // Reset climbing if moved away horizontally
          console.log('[useKapoorMovement] Moved away from ladder - resetting');
          setIsClimbing(false);
          setClimbingStartY(null);
        }
        
        // Normal movement logic (not climbing)
        if (!climbing) {
          setIsClimbing(false);
          
          // Only allow idle changes and walking when on a valid floor
          if (onValidFloor) {
            // Handle up/down for idle direction changes when not near climb point
            if (upPressed && !leftPressed && !rightPressed && !nearClimbPoint) {
              setDirection('back');
              setIsWalking(false);
            } else if (downPressed && !leftPressed && !rightPressed && !nearClimbPoint) {
              setDirection('front');
              setIsWalking(false);
            }
            
            // Handle left/right for walking movement with floor-specific boundaries
            if (leftPressed && !rightPressed) {
              setDirection('left');
              
              const bounds = onSecondFloor ? SECOND_FLOOR_BOUNDS : FIRST_FLOOR_BOUNDS;
              const newX = Math.max(bounds.left, currentPos.x - WALK_SPEED);
              
              if (newX === currentPos.x) {
                setIsWalking(false);
                console.log(`[useKapoorMovement] Hit left boundary at x=${currentPos.x.toFixed(0)}`);
              } else {
                setIsWalking(true);
                walking = true;
              }
              
              return { ...currentPos, x: newX };
            } else if (rightPressed && !leftPressed) {
              setDirection('right');
              
              const bounds = onSecondFloor ? SECOND_FLOOR_BOUNDS : FIRST_FLOOR_BOUNDS;
              const newX = Math.min(bounds.right, currentPos.x + WALK_SPEED);
              
              if (newX === currentPos.x) {
                setIsWalking(false);
                console.log(`[useKapoorMovement] Hit right boundary at x=${currentPos.x.toFixed(0)}`);
              } else {
                setIsWalking(true);
                walking = true;
              }
              
              return { ...currentPos, x: newX };
            } else if (!leftPressed && !rightPressed) {
              setIsWalking(false);
            }
          } else {
            setIsWalking(false);
            console.log('[useKapoorMovement] Not on valid floor (y:', currentPos.y.toFixed(0), ') - walking disabled');
          }
        }
        
        return currentPos;
      });
      
      // Update animation frame (don't update when frozen on ladder)
      if (!isFrozenOnLadder) {
        const currentSpeed = climbing ? CLIMB_SPRITE_FRAME_SPEED : 
                            walking ? WALK_SPRITE_FRAME_SPEED : 
                            IDLE_SPRITE_FRAME_SPEED;
        frameTickRef.current++;
        if (frameTickRef.current >= currentSpeed) {
          frameTickRef.current = 0;
          frameCountRef.current++;
          setFrame(frameCountRef.current);
        }
      }
    };
    
    // Start animation loop
    animationRef.current = setInterval(animateKapoor, FRAME_INTERVAL);
    
    return () => {
      if (animationRef.current) {
        clearInterval(animationRef.current);
      }
    };
  }, [climbingStartY, currentView, picoInteracted, isClimbBlocked, hasShownFirstBlockingMessage, callbacks, keysPressed]);
  
  return {
    state: {
      position,
      direction,
      frame,
      isWalking,
      isClimbing,
    },
    setters: {
      setPosition,
      setDirection,
      setIsWalking,
      setIsClimbing,
    },
    animationRef,
  };
}

