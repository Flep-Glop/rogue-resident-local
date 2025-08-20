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
  xxl: '24px'  // For very large star names
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
  
  /* Allow overflow for star glow effects */
  overflow: visible;
`;

// Star sprite - scaled up version of the same sprite used in zoomed-out view
const StarSprite = styled.div<{ $frame: number; $isUnlocked: boolean }>`
  width: 48px;  /* 4x scale from 12px original */
  height: 48px; /* 4x scale from 12px original */
  background-image: url('/images/home/tutorial-star.png');
  background-size: 480px 48px; /* 4x scale: 10 frames × 48px = 480px width */
  background-position: ${props => (props.$frame - 1) * -48}px 0px; /* Frame navigation at 4x scale */
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

// Info section - right column
const InfoSection = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

// Typography override wrapper - maintains canvas scaling like QuinnTutorialActivity
const CanvasTypographyOverride = styled.div`
  /* Override any inherited theme typography for canvas compatibility */
  font-size: ${CanvasFonts.md} !important;
  line-height: 1.4 !important;
  
  /* Ensure all child elements inherit canvas-appropriate sizing */
  * {
    font-size: inherit !important;
    line-height: inherit !important;
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

// Star title - much larger like QuinnTutorialActivity report card
const StarTitle = styled.h1`
  font-size: ${CanvasFonts.xxl}; /* Much larger */
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
  color: ${colors.accent};
`;

// Star point icon (simple pixel-perfect circle)
const StarPointIcon = styled.div`
  width: 8px;
  height: 8px;
  background: ${colors.accent};
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
  onClose: () => void;
  starFrame?: number;      // Current frame from the zoomed-out view
  isUnlocked?: boolean;    // Whether the star has been unlocked
  onStarUnlock?: (newFrame: number) => void; // Callback to sync unlock with parent
  onCardUnlock?: (cardName: string) => void; // Callback to show toast notification
}



export default function StarDetailModal({ 
  onClose, 
  starFrame = 1, 
  isUnlocked: initialUnlocked = false,
  onStarUnlock,
  onCardUnlock
}: StarDetailModalProps) {
  const { starPoints, updateStarPoints } = useResourceStore();
  const { unlockCard } = useAbilityStore();
  const [isUnlocked, setIsUnlocked] = useState(initialUnlocked);
  const [currentFrame, setCurrentFrame] = useState(starFrame);

  
  // Update frame when parent changes it (shimmer animation)
  useEffect(() => {
    if (!isUnlocked) {
      setCurrentFrame(starFrame);
    }
  }, [starFrame, isUnlocked]);
  
  // Mock star data - severely reduced verbosity
  const starData = {
    name: 'Polaris Nova',
    description: 'A mysterious star connected to radiation therapy fundamentals.',
    cost: 1
  };
  
  const canAfford = starPoints >= starData.cost;
  
  const handleUnlock = () => {
    if (!canAfford) return;
    
    if (!isUnlocked) {
      // First unlock: shimmer to solid
      updateStarPoints(-starData.cost, 'star_unlock');
      setIsUnlocked(true);
      setCurrentFrame(8); // Switch to unlocked frame
      
      // Notify parent to sync the zoomed-out view
      if (onStarUnlock) {
        onStarUnlock(8);
      }
      
      console.log(`[StarDetailModal] Unlocked ${starData.name} for ${starData.cost} star points`);
      
      // Special reward for Polaris: unlock Fast Learner ability card
      if (starData.name === 'Polaris Nova') {
        console.log(`⭐ [StarDetailModal] Polaris unlocked - granting Fast Learner ability card!`);
        unlockCard('fast_learner');
        
        // Trigger toast notification in parent
        if (onCardUnlock) {
          onCardUnlock('Fast Learner');
        }
      }
    } else if (currentFrame === 8) {
      // Second click: growth progression
      setCurrentFrame(9);
      if (onStarUnlock) {
        onStarUnlock(9);
      }
      console.log(`[StarDetailModal] Star progressed to growth`);
    } else if (currentFrame === 9) {
      // Third click: mastery progression
      setCurrentFrame(10);
      if (onStarUnlock) {
        onStarUnlock(10);
      }
      console.log(`[StarDetailModal] Star progressed to mastery`);
    }
  };
  
  return (
    <ModalBackdrop onClick={onClose}>
      <Container onClick={(e) => e.stopPropagation()}>
        
        {/* Left column - Star sprite with overflow for glow */}
        <StarSection>
          <StarSprite 
            $frame={currentFrame} 
            $isUnlocked={isUnlocked}
          />
        </StarSection>
        
        {/* Right column - Info panel */}
        <InfoSection>
          {/* Main content container with nested unlock button */}
          <ExpandableQuestionContainer variant="question" size="sm" style={{ position: 'relative' }}>
            <CanvasTypographyOverride>
              <StarTitle>{starData.name}</StarTitle>
              <StarDescription>
                {starData.description}
              </StarDescription>
              
              {/* Nested unlock button inside main panel */}
              {(!isUnlocked || currentFrame < 10) && (
                <div style={{ marginTop: '8px' }}>
                  <ExpandableAnswerContainer 
                    variant="answer" 
                    size="xs"
                    isActive={canAfford}
                    isHovered={false}
                    onClick={handleUnlock}
                    style={{
                      cursor: canAfford ? 'pointer' : 'not-allowed',
                      opacity: canAfford ? 1 : 0.6,
                      maxWidth: '200px' /* Smaller max width */
                    }}
                  >
                    <CanvasTypographyOverride>
                      <PurchaseContent>
                        <UnlockSection>
                          <div style={{ 
                            fontSize: CanvasFonts.xs,
                            fontWeight: 'bold',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            {!isUnlocked ? (canAfford ? (
                              <>
                                <StarPointIcon />
                                Unlock {starData.cost}SP
                              </>
                            ) : 'Locked') :
                             currentFrame === 8 ? 'Enhance' :
                             currentFrame === 9 ? 'Master' :
                             'Mastered'}
                          </div>
                        </UnlockSection>
                      </PurchaseContent>
                    </CanvasTypographyOverride>
                  </ExpandableAnswerContainer>
                </div>
              )}
              
              {/* Success message - nested inside main panel */}
              {isUnlocked && currentFrame === 10 && (
                <div style={{ marginTop: '12px', textAlign: 'center' }}>
                  <div style={{ 
                    color: colors.success, 
                    fontWeight: 'bold', 
                    fontSize: CanvasFonts.xs
                  }}>
                    ✨ Star Mastered!
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
