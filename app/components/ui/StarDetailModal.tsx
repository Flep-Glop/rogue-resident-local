'use client';

import React, { useState, useEffect } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { colors, spacing, typography, mixins } from '@/app/styles/pixelTheme';
import { useResourceStore } from '@/app/store/resourceStore';
import { useAbilityStore } from '@/app/store/abilityStore';
import { ExpandableQuestionContainer, ExpandableAnswerContainer } from '@/app/components/ui/PixelContainer';

// === FITS WITHIN EXISTING 640×360 RESOLUTION ===
// This modal fits within CombinedHomeScene's existing internal resolution
// Canvas-appropriate typography scale matching CombinedHomeScene
const CanvasFonts = {
  xs: '8px',   // For small tooltips and labels
  sm: '10px',  // For secondary text and values
  md: '12px',  // For primary content text
  lg: '14px',  // For headings and important text
  xl: '16px',  // For major headings
  xxl: '24px', // For very large star names
  xxxl: '32px' // For extra large titles
};

// Simple fade-in animation - no transform conflicts
const fadeIn = keyframes`
  0% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
`;

// Remove animated star sprite - now using scaled shimmer/solid star

// Modal backdrop - positioned within the existing 640×360 coordinate system with overflow
const ModalBackdrop = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 640px;  /* Full internal width */
  height: 360px; /* Full internal height */
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000; /* Above other home scene elements */
  
  /* Allow overflow for star glow effects */
  overflow: visible;
  
  /* Smooth backdrop fade-in */
  animation: ${fadeIn} 0.15s ease-out;
`;

// Main container - two column layout: star left, info right
const Container = styled.div`
  width: 400px;  /* Wider for two-column layout */
  display: flex;
  flex-direction: row;
  align-items: center; /* Center both columns vertically */
  gap: 12px; /* Space between star and info columns */
  
  font-family: ${typography.fontFamily.pixel};
  color: ${colors.text};
  
  /* Pixel perfect rendering */
  image-rendering: pixelated;
  -webkit-image-rendering: pixelated;
  -moz-image-rendering: crisp-edges;
  
  /* Simple fade-in animation */
  animation: ${fadeIn} 0.2s ease-out;
  
  /* Transparent background - relies on backdrop */
  background: transparent;
  
  /* Allow overflow for star glow effects */
  overflow: visible;
`;

// Star section - left column with overflow for glow effects
const StarSection = styled.div`
  width: 120px; /* Fixed width for left column */
  height: 120px; /* Fixed height for proper centering */
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  flex-shrink: 0; /* Prevent shrinking */
  z-index: 100; /* Render above InfoSection so sprites are visible */
  
  /* Allow overflow for star glow effects */
  overflow: visible;
`;

// Star sprite - scaled up version of the same sprite used in zoomed-out view
// New 40-frame sprite sheet (14x14 per frame, scaled 2x to 28x28)
const StarSprite = styled.div<{ $frame: number; $isUnlocked: boolean }>`
  width: 28px;  /* 2x scale from 14px original */
  height: 28px; /* 2x scale from 14px original */
  background-image: url('/images/home/star-sheet.png');
  background-size: ${14 * 40 * 2}px ${14 * 2}px; /* 2x scale: 40 frames × 28px = 1120px width, 28px height */
  background-position: ${props => (props.$frame - 1) * -28}px 0px; /* Frame navigation at 2x scale (14px * 2 = 28px per frame) */
  background-repeat: no-repeat;
  position: relative;
  
  /* Pixel perfect rendering */
  image-rendering: pixelated;
  image-rendering: crisp-edges;
  image-rendering: -moz-crisp-edges;
  image-rendering: -webkit-crisp-edges;
  
  /* Enhanced glow effects that can extend beyond container */
  filter: ${props => {
    if (!props.$isUnlocked && props.$frame >= 1 && props.$frame <= 4) {
      // Shimmer state: Progressive glow buildup with larger radius
      const intensity = (props.$frame - 1) / 3;
      return `drop-shadow(0 0 ${8 + intensity * 12}px rgba(255, 255, 255, ${0.5 + intensity * 0.4})) 
              drop-shadow(0 0 ${16 + intensity * 16}px rgba(255, 255, 255, ${0.3 + intensity * 0.3}))
              drop-shadow(0 0 ${24 + intensity * 20}px rgba(255, 255, 255, ${0.2 + intensity * 0.2}))`;
    } else if (props.$isUnlocked && props.$frame === 8) {
      // Unlocked: Clear bright glow with extended radius
      return `drop-shadow(0 0 16px rgba(255, 255, 255, 1.0)) 
              drop-shadow(0 0 32px rgba(255, 255, 255, 0.9))
              drop-shadow(0 0 48px rgba(255, 255, 255, 0.6))`;
    } else if (props.$isUnlocked && props.$frame === 9) {
      // Growth: Blue-white glow with extended radius
      return `drop-shadow(0 0 20px rgba(200, 220, 255, 1.0)) 
              drop-shadow(0 0 40px rgba(200, 220, 255, 1.0))
              drop-shadow(0 0 60px rgba(200, 220, 255, 0.7))`;
    } else if (props.$isUnlocked && props.$frame === 10) {
      // Mastery: Golden glow with extended radius
      return `drop-shadow(0 0 24px rgba(255, 215, 0, 1.0)) 
              drop-shadow(0 0 48px rgba(255, 215, 0, 0.9))
              drop-shadow(0 0 72px rgba(255, 215, 0, 0.6))`;
    }
    return 'none';
  }};
  
  /* Subtle animation for unlocked states */
  ${props => props.$isUnlocked && css`
    animation: starTwinkle 3s ease-in-out infinite;
  `}
  
  @keyframes starTwinkle {
    0%, 100% { opacity: 0.9; }
    50% { opacity: 1.0; }
  }
`;

// Moon sprite for orbiting around TBI planet in modal (NOW uses planetary-sheet.png, 2x scale = 28px)
const MoonSprite = styled.div<{ $frame: number }>`
  position: absolute;
  width: 28px;  /* 2x scale to match planet (14px × 2 = 28px) */
  height: 28px;
  background-image: url('/images/home/planetary-sheet.png');
  background-size: ${14 * 96 * 2}px ${14 * 2}px; /* 2x scale matching planetary-sheet (96 frames) */
  background-position: ${props => props.$frame * -28}px 0px; /* Frame navigation at 2x scale (0-indexed) */
  background-repeat: no-repeat;
  image-rendering: pixelated;
  pointer-events: none;
  z-index: 150; /* Above planet */
`;

// Info section - right column
const InfoSection = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
  z-index: 50; /* Below StarSection so sprites remain visible */
`;

// Typography override wrapper - maintains canvas scaling like QuinnTutorialActivity
const CanvasTypographyOverride = styled.div`
  /* Override any inherited theme typography for canvas compatibility */
  font-size: ${CanvasFonts.md} !important;
  line-height: 1.4 !important;
  
  /* Ensure all child elements inherit canvas-appropriate sizing, except StarTitle */
  * {
    font-size: inherit !important;
    line-height: inherit !important;
  }
  
  /* Allow StarTitle to keep its own font size */
  h1 {
    font-size: ${CanvasFonts.xxxl} !important;
  }
`;

// Purchase content wrapper - single line, minimal padding
const PurchaseContent = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 6px 12px; /* Minimal padding for single line */
`;

// Star title - extra large for prominence
const StarTitle = styled.h1`
  font-size: ${CanvasFonts.xxxl}; /* Extra large */
  color: ${colors.text}; /* Standard text color */
  margin: 0 0 4px 0; /* Reduced margin */
  text-shadow: ${typography.textShadow.pixel}; /* Standard pixel text shadow */
  text-align: center;
  font-weight: normal; /* Pixel fonts don't need bold */
`;

// Star subtitle - removed to reduce verbosity

// Star description - severely reduced
const StarDescription = styled.div`
  font-size: ${CanvasFonts.sm};
  line-height: 1.3;
  margin-bottom: 12px;
  text-align: center;
  color: ${colors.textDim};
`;

// Highlighted text for emphasis in description
const HighlightedText = styled.span`
  color: ${colors.highlight} !important;
  font-weight: bold !important;
`;

// Unlock section - single line, minimal styling
const UnlockSection = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
`;

// Star points cost - simplified
const StarPointsCost = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: ${CanvasFonts.sm};
  color: ${colors.starPoints};
`;

// Star point icon (simple pixel-perfect circle)
const StarPointIcon = styled.div`
  width: 8px;
  height: 8px;
  background: ${colors.starPoints};
  border-radius: 50%;
  display: inline-block;
`;

// Unlock button wrapper - will be styled by ExpandableAnswerContainer
const UnlockButtonWrapper = styled.div`
  cursor: pointer;
  display: inline-block;
  max-width: 280px;
`;

// Removed close button - click outside to close

interface StarDetailModalProps {
  starId?: 'star' | 'tbi' | 'tbi_dosimetry' | 'tbi_prescriptions' | 'tbi_commissioning'; // Which celestial body is being viewed (??? star, TBI planet, or moons)
  onClose: () => void;
  starFrame?: number;      // Current frame from the zoomed-out view
  isUnlocked?: boolean;    // Whether the star has been unlocked
  onStarUnlock?: (newFrame: number) => void; // Callback to sync unlock with parent
  onCardUnlock?: (cardName: string) => void; // Callback to show toast notification
  onStarViewed?: () => void; // Callback when star is clicked/viewed
}



export default function StarDetailModal({ 
  starId = 'star',
  onClose, 
  starFrame = 1, 
  isUnlocked: initialUnlocked = false,
  onStarUnlock,
  onCardUnlock,
  onStarViewed
}: StarDetailModalProps) {
  const { starPoints, updateStarPoints } = useResourceStore();
  const { unlockCard } = useAbilityStore();
  const [isUnlocked, setIsUnlocked] = useState(initialUnlocked);
  
  // Convert highlighted frames (11-19) to non-highlighted (2-10) for modal display
  const getNonHighlightedFrame = (frame: number) => {
    return frame >= 11 ? frame - 9 : frame;
  };
  
  const [currentFrame, setCurrentFrame] = useState(getNonHighlightedFrame(starFrame));
  
  // Dynamic focus system - which body is at the center (can be planet or any moon)
  const [focusedBodyId, setFocusedBodyId] = useState<string>(starId || 'tbi');
  
  // All bodies in absolute coordinate system (TBI planet always orbits at origin, moons orbit around it)
  const [allBodies, setAllBodies] = useState<Array<{ id: string; angle: number; absoluteX: number; absoluteY: number; scale: number; opacity: number; zIndex: number }>>([]);

  // Trigger viewed callback when modal opens
  useEffect(() => {
    if (onStarViewed) {
      onStarViewed();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount
  
  // Update frame when parent changes it (shimmer animation) - always use non-highlighted version
  useEffect(() => {
    if (!isUnlocked) {
      setCurrentFrame(getNonHighlightedFrame(starFrame));
    }
  }, [starFrame, isUnlocked]);
  
  // Initialize all bodies in absolute coordinate system (only once)
  useEffect(() => {
    // Only show orbital system for TBI constellation (planet + moons)
    const isTBIConstellation = starId === 'tbi' || starId === 'tbi_dosimetry' || 
                                starId === 'tbi_prescriptions' || starId === 'tbi_commissioning';
    
    if (!isTBIConstellation) return;
    
    // Initialize all 4 bodies with TBI planet at origin (0, 0) and moons orbiting around it
    // Moons start at evenly spaced angles (0°, 120°, 240°)
    const initialBodies = [
      { id: 'tbi', angle: 0, absoluteX: 0, absoluteY: 0, scale: 1, opacity: 1, zIndex: 150 }, // Planet at origin
      { id: 'tbi_dosimetry', angle: 0, absoluteX: 0, absoluteY: 0, scale: 1, opacity: 1, zIndex: 149 },
      { id: 'tbi_prescriptions', angle: (Math.PI * 2) / 3, absoluteX: 0, absoluteY: 0, scale: 1, opacity: 1, zIndex: 149 },
      { id: 'tbi_commissioning', angle: (Math.PI * 4) / 3, absoluteX: 0, absoluteY: 0, scale: 1, opacity: 1, zIndex: 149 },
    ];
    
    setAllBodies(initialBodies);
  }, []); // Only initialize once
  
  // Orbital animation - continuously update absolute positions of all bodies
  useEffect(() => {
    if (allBodies.length === 0) return;
    
    const ORBIT_SPEED = 0.008; // Radians per frame (matches sky view)
    const ORBIT_RADIUS = 40; // Distance from TBI planet (2x sky view radius of 20px due to 2x sprite scaling)
    const ELLIPSE_RATIO = 0.5; // Vertical compression for 3D perspective
    const MIN_SCALE = 0.7;
    const MAX_SCALE = 1.3;
    const MIN_OPACITY = 0.6;
    const MAX_OPACITY = 1.0;
    
    const interval = setInterval(() => {
      setAllBodies(prev => prev.map(body => {
        // TBI planet stays at origin (0, 0)
        if (body.id === 'tbi') {
          return body;
        }
        
        // Moons orbit around TBI planet at origin
        const newAngle = body.angle + ORBIT_SPEED;
        
        // Calculate absolute position with elliptical orbit (compressed Y axis for 3D effect)
        const absoluteX = Math.cos(newAngle) * ORBIT_RADIUS;
        const absoluteY = Math.sin(newAngle) * ORBIT_RADIUS * ELLIPSE_RATIO;
        
        // Calculate z-depth based on sine of angle (front to back motion)
        const zDepth = Math.sin(newAngle);
        
        // Map z-depth to scale and opacity (closer = bigger and more opaque)
        const scale = MIN_SCALE + ((zDepth + 1) / 2) * (MAX_SCALE - MIN_SCALE);
        const opacity = MIN_OPACITY + ((zDepth + 1) / 2) * (MAX_OPACITY - MIN_OPACITY);
        
        // Calculate z-index: bodies behind planet (zDepth < 0) = 149, in front (zDepth >= 0) = 151
        const zIndex = zDepth < 0 ? 149 : 151;
        
        return {
          ...body,
          angle: newAngle,
          absoluteX,
          absoluteY,
          scale,
          opacity,
          zIndex,
        };
      }));
    }, 16); // ~60fps
    
    return () => clearInterval(interval);
  }, [allBodies.length]);
  
  // Arrow key navigation between bodies (spatial navigation in absolute coordinates)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle arrow keys
      if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) return;
      
      e.preventDefault();
      
      // Find current focused body's absolute position
      const focusedBody = allBodies.find(b => b.id === focusedBodyId);
      if (!focusedBody) return;
      
      const currentX = focusedBody.absoluteX;
      const currentY = focusedBody.absoluteY;
      
      // Build list of navigation targets (all bodies except current focus)
      const targets = allBodies
        .filter(body => body.id !== focusedBodyId)
        .map(body => ({
          id: body.id,
          x: body.absoluteX,
          y: body.absoluteY,
        }));
      
      // Determine direction vector based on key press
      let directionX = 0;
      let directionY = 0;
      
      if (e.key === 'ArrowLeft') directionX = -1;
      if (e.key === 'ArrowRight') directionX = 1;
      if (e.key === 'ArrowUp') directionY = -1;
      if (e.key === 'ArrowDown') directionY = 1;
      
      // Find best target in the pressed direction
      let bestTarget: { id: string; score: number } | null = null;
      
      for (const target of targets) {
        const dx = target.x - currentX;
        const dy = target.y - currentY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance === 0) continue; // Skip if same position
        
        // Calculate alignment with pressed direction (dot product)
        const alignment = (dx * directionX + dy * directionY) / distance;
        
        // Only consider targets in the correct direction (alignment > 0)
        if (alignment > 0.3) { // Threshold to allow slightly off-axis targets
          const score = distance / alignment; // Lower is better
          
          if (!bestTarget || score < bestTarget.score) {
            bestTarget = { id: target.id, score };
          }
        }
      }
      
      // Switch focus to best target
      if (bestTarget) {
        setFocusedBodyId(bestTarget.id);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [allBodies, focusedBodyId]);
  
  // Celestial body data (planet and moons)
  const starDataMap: Record<NonNullable<StarDetailModalProps['starId']>, { name: string; description: string; topic: string; cost: number }> = {
    star: {
      name: '???',
      description: 'A vague nebula of uncharted stars. Study and practice to bring clarity to this constellation.',
      topic: 'Radiation Therapy',
      cost: 1
    },
    tbi: {
      name: 'Total Body Irradiation',
      description: 'Whole body radiation therapy for transplant conditioning and systemic treatment.',
      topic: 'TBI',
      cost: 1
    },
    tbi_dosimetry: {
      name: 'TBI Dosimetry',
      description: 'Precise dose measurement and calculation techniques for total body irradiation treatments.',
      topic: 'TBI Dosimetry',
      cost: 1
    },
    tbi_prescriptions: {
      name: 'TBI Prescriptions',
      description: 'Treatment prescription protocols and dose fractionation schedules for TBI.',
      topic: 'TBI Prescriptions',
      cost: 1
    },
    tbi_commissioning: {
      name: 'TBI Commissioning',
      description: 'Quality assurance and commissioning procedures for TBI treatment systems.',
      topic: 'TBI Commissioning',
      cost: 1
    }
  };
  
  // Use focused body data for modal content (changes as user navigates)
  const starData = starDataMap[focusedBodyId as keyof typeof starDataMap] || starDataMap.tbi;
  const canAfford = starPoints >= starData.cost;
  
  const handleUnlock = () => {
    // Only ??? star can be unlocked, constellation stars are informational only
    if (focusedBodyId !== 'star') return;
    if (!canAfford) return;
    
    if (!isUnlocked) {
      // First unlock: sparkle to solid (non-highlighted versions for modal)
      updateStarPoints(-starData.cost, 'star_unlock');
      setIsUnlocked(true);
      setCurrentFrame(8); // Switch to unlocked frame (small star, non-highlighted)
      
      // Notify parent to sync the zoomed-out view with highlighted version
      if (onStarUnlock) {
        onStarUnlock(17); // Parent uses highlighted version (frame 17)
      }
      
      console.log(`[StarDetailModal] Unlocked ${starData.name} for ${starData.cost} star points (modal frame 8, parent frame 17)`);
      
      // Special reward for first star (???): unlock Fast Learner ability card
      if (starData.name === '???') {
        console.log(`⭐ [StarDetailModal] First star unlocked - granting Fast Learner ability card!`);
        unlockCard('fast_learner');
        
        // Trigger toast notification in parent
        if (onCardUnlock) {
          onCardUnlock('Fast Learner');
        }
      }
    } else if (currentFrame === 8) {
      // Second click: growth progression (medium star, non-highlighted in modal)
      setCurrentFrame(9);
      if (onStarUnlock) {
        onStarUnlock(18); // Parent uses highlighted version (frame 18)
      }
      console.log(`[StarDetailModal] Star progressed to growth (modal frame 9, parent frame 18)`);
    } else if (currentFrame === 9) {
      // Third click: mastery progression (big star, non-highlighted in modal)
      setCurrentFrame(10);
      if (onStarUnlock) {
        onStarUnlock(19); // Parent uses highlighted version (frame 19)
      }
      console.log(`[StarDetailModal] Star progressed to mastery (modal frame 10, parent frame 19)`);
    }
  };
  
  // Planet and moons are always "unlocked" and display-only (not the ??? star though)
  const isConstellationStar = focusedBodyId === 'tbi' || focusedBodyId === 'tbi_dosimetry' || 
                               focusedBodyId === 'tbi_prescriptions' || focusedBodyId === 'tbi_commissioning';
  
  return (
    <ModalBackdrop>
      <Container>
        
        {/* Left column - Star sprite with overflow for glow */}
        <StarSection>
          {/* For ??? star: render simple StarSprite */}
          {!isConstellationStar && (
            <StarSprite 
              $frame={currentFrame} 
              $isUnlocked={isUnlocked}
            />
          )}
          
          {/* For TBI constellation: render all bodies with camera translation (focused body becomes center) */}
          {allBodies.map((body) => {
            // Find focused body to calculate camera offset
            const focusedBody = allBodies.find(b => b.id === focusedBodyId);
            if (!focusedBody) return null;
            
            // Translate body position by camera offset (focused body's position)
            const relativeX = body.absoluteX - focusedBody.absoluteX;
            const relativeY = body.absoluteY - focusedBody.absoluteY;
            
            // Determine frame based on body type
            // TBI constellation now uses planetary-sheet.png: planet uses frame 2, moons use frame 0 (small moon)
            const bodyFrame = body.id === 'tbi' ? 2 : 0;
            
            // Focused body is centered and always at base scale/opacity
            const isFocused = body.id === focusedBodyId;
            const displayScale = isFocused ? 1 : body.scale;
            const displayOpacity = isFocused ? 1 : body.opacity;
            const displayZIndex = isFocused ? 150 : body.zIndex;
            
            // Highlighting for focused body (+24 frame offset for Section 1 highlighted sprites)
            const displayFrame = isFocused ? bodyFrame + 24 : bodyFrame;
            
            // Use MoonSprite for all bodies to maintain component identity during focus transitions
            // This prevents React from unmounting/remounting, allowing smooth CSS transitions
            return (
              <React.Fragment key={body.id}>
                {/* Layer 1: Blurry base sprite (Section 0 or Section 1 if focused/highlighted) */}
                <MoonSprite
                  $frame={displayFrame}
                  style={{
                    left: `calc(50% + ${relativeX}px)`,
                    top: `calc(50% + ${relativeY}px)`,
                    transform: `translate(-50%, -50%) scale(${displayScale})`,
                    opacity: displayOpacity,
                    zIndex: displayZIndex,
                    transition: 'left 0.5s ease-out, top 0.5s ease-out, transform 0.5s ease-out, opacity 0.5s ease-out',
                  }}
                />
                {/* Layer 2: Non-blurry crisp overlay (Section 2: frames +48) */}
                <MoonSprite
                  $frame={bodyFrame + 48} // Section 2 is always +48 from base frame (no highlighting offset)
                  style={{
                    left: `calc(50% + ${relativeX}px)`,
                    top: `calc(50% + ${relativeY}px)`,
                    transform: `translate(-50%, -50%) scale(${displayScale})`,
                    opacity: displayOpacity,
                    zIndex: displayZIndex + 1, // Render above blurry layer
                    transition: 'left 0.5s ease-out, top 0.5s ease-out, transform 0.5s ease-out, opacity 0.5s ease-out',
                    pointerEvents: 'none', // Pass through to base layer
                  }}
                />
              </React.Fragment>
            );
          })}
        </StarSection>
        
        {/* Right column - Info panel */}
        <InfoSection>
          {/* Main content container with nested unlock button */}
          <ExpandableQuestionContainer size="sm" style={{ position: 'relative' }}>
            <CanvasTypographyOverride>
              <StarTitle>{starData.name}</StarTitle>
              <StarDescription>
                {starData.description}
                {focusedBodyId === 'star' && (
                  <>
                    <br />
                    (Visit your desk to get started)
                  </>
                )}
              </StarDescription>
              
              {/* Only show mastery for ??? star, constellation stars are display-only */}
              {!isConstellationStar && (
                <>
                  {/* Mastery display */}
                  <div style={{ marginTop: '8px', textAlign: 'center' }}>
                    <div style={{ 
                      fontSize: CanvasFonts.xl,
                      fontWeight: 'bold',
                      color: colors.textDim
                    }}>
                      Mastery 0/100
                    </div>
                  </div>
                  
                  {/* Success message - nested inside main panel */}
                  {isUnlocked && currentFrame === 10 && (
                    <div style={{ marginTop: '12px', textAlign: 'center' }}>
                      <div style={{ 
                        color: colors.active, 
                        fontWeight: 'bold', 
                        fontSize: CanvasFonts.xs
                      }}>
                        ✨ Star Mastered!
                      </div>
                    </div>
                  )}
                </>
              )}
              
              {/* Constellation stars show a message to study them at desk */}
              {isConstellationStar && (
                <div style={{ marginTop: '12px', textAlign: 'center' }}>
                  <div style={{ 
                    color: colors.starPoints, 
                    fontSize: CanvasFonts.sm
                  }}>
                    Visit your desk to study this topic
                  </div>
                </div>
              )}
            </CanvasTypographyOverride>
          </ExpandableQuestionContainer>
        </InfoSection>
      </Container>
    </ModalBackdrop>
  );
}
