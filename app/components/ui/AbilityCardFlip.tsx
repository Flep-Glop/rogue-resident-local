'use client';

import React, { useState, useEffect } from 'react';
import styled, { keyframes, css } from 'styled-components';

interface AbilityCardFlipProps {
  cardId: string;
  frontImage: string;  // Path to front PNG
  backImage: string;   // Path to back PNG
  autoFlip?: boolean;  // Whether to automatically flip after showing front
  autoFlipDelay?: number; // Delay before auto flip (ms)
  onFlipComplete?: () => void; // Callback when flip animation completes
  onCardComplete?: () => void; // Callback when entire card sequence is done
}

// Optimized keyframes using only transform and opacity
const cardAppear = keyframes`
  0% {
    opacity: 0;
    transform: translateY(50px) scale(0.8);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
`;

// GPU-accelerated glow using transform scale instead of box-shadow
const cardGlow = keyframes`
  0%, 100% {
    transform: scale(1);
    opacity: 0.9;
  }
  50% {
    transform: scale(1.02);
    opacity: 1;
  }
`;

// Optimized shake using only transform
const cardShake = keyframes`
  0%, 100% { transform: translateX(0) scale(1); }
  25% { transform: translateX(-4px) scale(1); }
  75% { transform: translateX(4px) scale(1); }
`;

// Flash effect using opacity instead of background change
const flashEffect = keyframes`
  0% { opacity: 0; }
  50% { opacity: 1; }
  100% { opacity: 0; }
`;

// Container for the entire card
const CardContainer = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 1000;
  animation: ${cardAppear} 0.8s ease-out;
`;

// Optimized card with GPU-accelerated animations
const Card = styled.div<{ $isShaking: boolean; $isFlashing: boolean; $isRevealed: boolean }>`
  position: relative;
  width: 300px;
  height: 450px;
  border-radius: 16px;
  overflow: hidden;
  border: 3px solid #ffd700;
  cursor: ${({ $isRevealed }) => $isRevealed ? 'default' : 'pointer'};
  
  /* Use will-change to promote to GPU layer */
  will-change: transform, opacity;
  
  /* Only animate glow when not doing other animations */
  ${({ $isShaking, $isFlashing }) => !$isShaking && !$isFlashing && css`
    animation: ${cardGlow} 3s ease-in-out infinite;
  `}
  
  /* Shake animation - replaces glow temporarily */
  ${({ $isShaking }) => $isShaking && css`
    animation: ${cardShake} 0.6s ease-in-out;
  `}
  
  /* Flash overlay using pseudo-element with opacity animation */
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 10;
    pointer-events: none;
    background: rgba(255, 255, 255, 1);
    opacity: 0;
    will-change: opacity;
    
    ${({ $isFlashing }) => $isFlashing && css`
      animation: ${flashEffect} 0.4s ease-in-out;
    `}
  }
`;

// Optimized card image with GPU acceleration
const CardImage = styled.img<{ $isRevealed: boolean }>`
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  image-rendering: pixelated;
  image-rendering: -moz-crisp-edges;
  image-rendering: -webkit-crisp-edges;
  image-rendering: crisp-edges;
  -ms-interpolation-mode: nearest-neighbor;
  opacity: 1;
  will-change: opacity;
  /* Remove transition - we handle reveals through parent state changes */
`;

// Optimized overlay without expensive backdrop-filter
const CardOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.8);
  z-index: 999;
  opacity: 0;
  animation: ${cardAppear} 0.5s ease-out forwards;
  will-change: opacity;
`;

// Continue button that appears after reveal
const ContinueButton = styled.button`
  position: fixed;
  bottom: 20%;
  left: 50%;
  transform: translateX(-50%);
  background: linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%);
  color: white;
  border: 2px solid #60A5FA;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  opacity: 0;
  animation: ${cardAppear} 0.5s ease-out 0.5s forwards;
  z-index: 1001;
  
  &:hover {
    background: linear-gradient(135deg, #1D4ED8 0%, #1E40AF 100%);
    transform: translateX(-50%) translateY(-2px);
    box-shadow: 0 8px 25px rgba(59, 130, 246, 0.4);
  }
  
  &:active {
    transform: translateX(-50%) translateY(0);
  }
`;

const AbilityCardFlip: React.FC<AbilityCardFlipProps> = ({
  cardId,
  frontImage,
  backImage,
  autoFlip = false,
  autoFlipDelay = 2000,
  onFlipComplete,
  onCardComplete
}) => {
  const [isShaking, setIsShaking] = useState(false);
  const [isFlashing, setIsFlashing] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);
  const [showContinue, setShowContinue] = useState(false);
  const [currentImage, setCurrentImage] = useState(backImage);

  // Debug logging
  useEffect(() => {
    console.log('🎴 [CardFlip] Component mounted with:', {
      cardId,
      frontImage,
      backImage,
      currentImage
    });
  }, [cardId, frontImage, backImage, currentImage]);

  // Add keyboard event listener to prevent space
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    document.addEventListener('keydown', handleKeyPress, true);
    return () => document.removeEventListener('keydown', handleKeyPress, true);
  }, []);

  const handleCardClick = () => {
    if (isRevealed || isShaking) return;
    
    console.log('🖱️ [CardFlip] Card clicked, starting reveal sequence');
    
    // Start shake animation
    setIsShaking(true);
    
    // After shake, start flash
    setTimeout(() => {
      setIsShaking(false);
      setIsFlashing(true);
    }, 600);
    
    // During flash, swap the image
    setTimeout(() => {
      setCurrentImage(frontImage);
    }, 800);
    
    // After flash, reveal the card
    setTimeout(() => {
      setIsFlashing(false);
      setIsRevealed(true);
      onFlipComplete?.();
    }, 1000);
    
    // Show continue button
    setTimeout(() => {
      setShowContinue(true);
    }, 1500);
  };

  const handleContinue = () => {
    onCardComplete?.();
  };

  const handleImageError = () => {
    console.error('🚨 [CardFlip] Failed to load image:', currentImage);
  };

  const handleImageLoad = () => {
    console.log('✅ [CardFlip] Successfully loaded image:', currentImage);
  };

  return (
    <>
      <CardOverlay />
      <CardContainer>
        <Card 
          $isShaking={isShaking} 
          $isFlashing={isFlashing} 
          $isRevealed={isRevealed}
          onClick={handleCardClick}
        >
          <CardImage 
            src={currentImage}
            alt={`${cardId} ${isRevealed ? 'front' : 'back'}`}
            draggable={false}
            onError={handleImageError}
            onLoad={handleImageLoad}
            $isRevealed={isRevealed}
          />
        </Card>
        
        {showContinue && (
          <ContinueButton onClick={handleContinue}>
            Continue
          </ContinueButton>
        )}
      </CardContainer>
    </>
  );
};

export default AbilityCardFlip; 