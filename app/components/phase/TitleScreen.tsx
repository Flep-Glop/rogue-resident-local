"use client";

import React, { useState, useEffect, useRef } from 'react';
import styled, { keyframes, css, createGlobalStyle } from 'styled-components';
import { useGameStore } from '@/app/store/gameStore';
import { GamePhase, Difficulty } from '@/app/types';
import { colors, typography, shadows } from '@/app/styles/pixelTheme';

interface Star {
  id: number;
  width: string;
  height: string;
  top: string;
  left: string;
  opacity: number;
  animation: string;
  animationDelay: string;
}

// Define keyframe animations
const twinkle = keyframes`
  0% { opacity: 0.2; }
  50% { opacity: 1; }
  100% { opacity: 0.2; }
`;

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const glitchEffect = keyframes`
  0% {
    text-shadow: 0.05em 0 0 rgba(255,0,255,0.75), -0.05em -0.025em 0 rgba(0,255,255,0.75);
    transform: translate(0);
  }
  14% {
    text-shadow: 0.05em 0 0 rgba(255,0,255,0.75), -0.05em -0.025em 0 rgba(0,255,255,0.75);
  }
  15% {
    text-shadow: -0.05em -0.025em 0 rgba(255,0,255,0.75), 0.025em 0.025em 0 rgba(0,255,255,0.75);
    transform: translate(-2px, 2px);
  }
  49% {
    text-shadow: -0.05em -0.025em 0 rgba(255,0,255,0.75), 0.025em 0.025em 0 rgba(0,255,255,0.75);
  }
  50% {
    text-shadow: 0.025em 0.05em 0 rgba(255,0,255,0.75), 0.05em 0 0 rgba(0,255,255,0.75);
    transform: translate(2px, -1px);
  }
  99% {
    text-shadow: 0.025em 0.05em 0 rgba(255,0,255,0.75), 0.05em 0 0 rgba(0,255,255,0.75);
    transform: translate(0);
  }
  100% {
    text-shadow: -0.025em 0 0 rgba(255,0,255,0.75), -0.025em -0.025em 0 rgba(0,255,255,0.75);
    transform: translate(3px, -3px);
  }
`;

const glitchSlip = keyframes`
  0% {
    clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%);
  }
  2% {
    clip-path: polygon(0 5%, 100% 5%, 100% 100%, 0 100%);
  }
  6% {
    clip-path: polygon(0 10%, 100% 10%, 100% 100%, 0 100%);
  }
  8% {
    clip-path: polygon(0 5%, 100% 5%, 100% 100%, 0 100%);
  }
  9% {
    clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%);
  }
  11% {
    clip-path: polygon(0 0, 100% 0, 100% 85%, 0 85%);
  }
  13% {
    clip-path: polygon(0 15%, 100% 15%, 100% 80%, 0 80%);
  }
  15% {
    clip-path: polygon(0 10%, 100% 10%, 100% 100%, 0 100%);
  }
  20% {
    clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%);
  }
  80% {
    clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%);
  }
  90% {
    clip-path: polygon(0 10%, 100% 10%, 100% 100%, 0 100%);
  }
  92% {
    clip-path: polygon(0 5%, 100% 5%, 100% 100%, 0 100%);
  }
  93% {
    clip-path: polygon(0 0, 100% 0, 100% 90%, 0 90%);
  }
  94% {
    clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%);
  }
  100% {
    clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%);
  }
`;

const pulseTitle = keyframes`
  0% { text-shadow: ${colors.highlight} 0 0 4px, ${typography.textShadow.pixel}; }
  50% { text-shadow: ${colors.highlight} 0 0 8px, ${typography.textShadow.pixel}; }
  100% { text-shadow: ${colors.highlight} 0 0 4px, ${typography.textShadow.pixel}; }
`;

const pulseButton = keyframes`
  0% { transform: scale(1); box-shadow: 0 0 0 rgba(132, 90, 245, 0.4); }
  50% { transform: scale(1.03); box-shadow: 0 0 15px rgba(132, 90, 245, 0.7); }
  100% { transform: scale(1); box-shadow: 0 0 0 rgba(132, 90, 245, 0.4); }
`;

const pulseLargeStar = keyframes`
  0% { transform: translate(-50%, -50%) scale(1); opacity: 0.7; }
  50% { transform: translate(-50%, -50%) scale(1.1); opacity: 0.9; }
  100% { transform: translate(-50%, -50%) scale(1); opacity: 0.7; }
`;

const shootingStar = keyframes`
  0% { transform: translate(0, 0) rotate(45deg) scale(0); opacity: 0; }
  10% { transform: translate(-10%, 10%) rotate(45deg) scale(1); opacity: 1; }
  100% { transform: translate(-120%, 120%) rotate(45deg) scale(0.2); opacity: 0; }
`;

const floatAnimation = keyframes`
  0% { transform: translateY(0px); }
  50% { transform: translateY(-8px); }
  100% { transform: translateY(0px); }
`;

const pixelateIn = keyframes`
  0% { filter: blur(10px); opacity: 0; }
  30% { filter: blur(5px); opacity: 0.5; }
  60% { filter: blur(2px); opacity: 0.8; }
  100% { filter: blur(0); opacity: 1; }
`;

const subtleRotate = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const particleFloat = keyframes`
  0% { transform: translateY(0) translateX(0); opacity: 0; }
  30% { opacity: 1; }
  70% { opacity: 1; }
  100% { transform: translateY(-100px) translateX(20px); opacity: 0; }
`;

// Add this to ensure no scroll bars appear anywhere
const GlobalStyles = css`
  html, body {
    overflow: hidden;
    margin: 0;
    padding: 0;
    height: 100%;
    width: 100%;
  }
`;

// Create global style to prevent flash of unstyled content
const GlobalHydrationFix = createGlobalStyle`
  html.loading * {
    visibility: hidden;
  }
  
  html.loading::before {
    content: '';
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: #090b12;
    z-index: 9999;
    visibility: visible;
  }
`;

// Styled components
const FullScreenContainer = styled.div`
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: linear-gradient(to bottom, #121620, #090b12);
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  margin: 0;
  padding: 0;
  overflow: hidden;
  font-family: ${typography.fontFamily.pixel};
  color: ${colors.text};
  box-sizing: border-box;
  max-width: 100vw;
  max-height: 100vh;
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: 
      radial-gradient(circle at 20% 30%, rgba(76, 0, 255, 0.1) 0%, transparent 40%),
      radial-gradient(circle at 80% 70%, rgba(25, 0, 112, 0.15) 0%, transparent 40%);
    z-index: 0;
  }
`;

const StarField = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  opacity: 0.7;
`;

const VignetteOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: radial-gradient(
    circle at center,
    transparent 20%,
    rgba(6, 8, 15, 0.4) 60%,
    rgba(6, 8, 15, 0.8) 100%
  );
  pointer-events: none;
  z-index: 5;
`;

interface StarPointProps {
  $width: string;
  $height: string;
  $top: string;
  $left: string;
  $opacity: number;
  $delay: string;
  $duration: string;
}

const StarPoint = styled.div.attrs<StarPointProps>(props => ({
  style: {
    width: props.$width,
    height: props.$height,
    top: props.$top,
    left: props.$left,
    opacity: props.$opacity,
    animationDelay: props.$delay
  }
}))<StarPointProps>`
  position: absolute;
  background-color: ${colors.starGlow};
  box-shadow: ${shadows.glow(colors.starGlow)};
  border-radius: 50%;
  animation: ${twinkle} ${props => props.$duration} ease-in-out infinite;
`;

const ContentContainer = styled.div`
  position: relative;
  z-index: 10;
  width: 100%;
  max-width: 600px;
  text-align: center;
  margin: 0 auto;
  padding: 20px;
  animation: ${fadeIn} 1.2s ease-in-out;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

interface TitleProps {
  $animate: boolean;
  $glitchActive: boolean;
}

const Title = styled.h1<TitleProps>`
  font-size: 4rem;
  font-weight: bold;
  text-align: center;
  width: 100%;
  margin: 0 auto 20px auto;
  background: linear-gradient(to right, ${colors.treatmentPlanning}, ${colors.highlight});
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  letter-spacing: 0.05em;
  animation: ${props => props.$animate ? pulseTitle : 'none'} 4s ease-in-out infinite;
  position: relative;
  text-shadow: ${colors.highlight} 0 0 4px, ${typography.textShadow.pixel};
  
  ${props => props.$glitchActive && css`
    &::before, &::after {
      content: 'ROGUE RESIDENT';
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(to right, ${colors.treatmentPlanning}, ${colors.highlight});
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    &::before {
      left: 2px;
      text-shadow: -2px 0 #ff00ff;
      animation: ${glitchEffect} 1.5s infinite linear alternate-reverse;
      clip-path: polygon(0 0, 100% 0, 100% 45%, 0 45%);
    }

    &::after {
      left: -2px;
      text-shadow: 2px 0 #00ffff;
      animation: ${glitchEffect} 2s infinite linear alternate-reverse;
      clip-path: polygon(0 55%, 100% 55%, 100% 100%, 0 100%);
    }
    
    animation: ${glitchSlip} 4s infinite;
  `}
`;

const Quote = styled.p`
  font-size: ${typography.fontSize.md};
  color: ${colors.textDim};
  text-align: center;
  width: 100%;
  max-width: 80%;
  margin: 0 auto 60px auto;
  padding: 0 20px;
  opacity: 0.8;
  font-style: italic;
  line-height: 1.5;
  text-shadow: ${typography.textShadow.pixel};
  animation: ${floatAnimation} 6s ease-in-out infinite;
`;

const MenuContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  justify-content: center;
  align-items: center;
  width: 100%;
  transition: all 0.3s ease-in-out;
`;

interface ButtonProps {
  $isStarting?: boolean;
  $isPrimary?: boolean;
}

const Button = styled.button<ButtonProps>`
  padding: ${props => props.$isPrimary ? '12px 40px' : '8px 24px'};
  font-size: ${props => props.$isPrimary ? '1.5rem' : '1rem'};
  min-width: ${props => props.$isPrimary ? '280px' : '200px'};
  border-radius: 4px;
  transition: all 0.15s ease-in-out;
  background-color: ${props => 
    props.$isStarting 
      ? colors.highlight 
      : props.$isPrimary 
        ? colors.treatmentPlanning 
        : colors.background};
  color: ${colors.text};
  border: ${props => props.$isPrimary ? 'none' : `2px solid ${colors.active}`};
  outline: none;
  box-shadow: ${props => props.$isStarting ? 'none' : `0 ${props.$isPrimary ? '6px' : '4px'} 0 ${colors.background}`};
  cursor: pointer;
  transform: ${props => props.$isStarting ? 'translateY(4px)' : 'translateY(0)'};
  margin: 0 auto;
  opacity: ${props => props.$isPrimary ? '1' : '0.8'};
  animation: ${props => !props.$isStarting && props.$isPrimary ? pulseButton : 'none'} 2s infinite;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
    transform: translate(-100%, -100%);
    opacity: 0;
    transition: transform 0.5s ease-out, opacity 0.3s ease-out;
  }

  &:hover {
    transform: ${props => props.$isStarting ? 'translateY(4px)' : 'scale(1.05)'};
    opacity: ${props => props.$isPrimary ? '1' : '0.9'};
    
    &::before {
      transform: translate(0, 0);
      opacity: 1;
    }
  }

  &:active {
    transform: scale(0.95);
  }
`;

const GameVersion = styled.div`
  position: absolute;
  bottom: 24px;
  width: 100%;
  text-align: center;
  color: ${colors.textDim};
  font-size: ${typography.fontSize.sm};
  text-shadow: ${typography.textShadow.pixel};
  letter-spacing: 0.5px;
  opacity: 0.7;
`;

// New components for enhanced effects
const ParticlesContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  pointer-events: none;
  z-index: 3;
`;

interface ParticleProps {
  $top: string;
  $left: string;
  $size: string;
  $delay: string;
  $duration: string;
  $color: string;
}

const Particle = styled.div<ParticleProps>`
  position: absolute;
  top: ${props => props.$top};
  left: ${props => props.$left};
  width: ${props => props.$size};
  height: ${props => props.$size};
  background-color: ${props => props.$color};
  opacity: 0;
  animation: ${particleFloat} ${props => props.$duration} ease-out infinite;
  animation-delay: ${props => props.$delay};
  box-shadow: 0 0 4px ${props => props.$color};
  clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%);
`;

const PixelOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='4' viewBox='0 0 4 4'%3E%3Cpath fill='%23000000' fill-opacity='0.02' d='M1 3h1v1H1V3zm2-2h1v1H3V1z'%3E%3C/path%3E%3C/svg%3E");
  pointer-events: none;
  z-index: 20;
  opacity: 0.3;
`;

const LargeStar = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  width: 750px;
  height: 750px;
  border-radius: 50%;
  background: radial-gradient(
    circle at center,
    rgba(10, 6, 20, 1) 0%,
    rgba(10, 6, 20, 0.98) 35%,
    rgba(30, 15, 50, 0.95) 50%,
    rgba(132, 90, 245, 0.2) 70%,
    rgba(132, 90, 245, 0.1) 80%,
    transparent 90%
  );
  box-shadow: 0 0 70px 30px rgba(132, 90, 245, 0.3);
  z-index: 1;
  animation: ${pulseLargeStar} 8s ease-in-out infinite;
  pointer-events: none;
  margin: 0;
  padding: 0;
  transform: translate(-50%, -50%);
  will-change: transform, opacity;
  overflow: hidden;
  
  &::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    border: 2px solid rgba(132, 90, 245, 0.1);
    transform: translate(-50%, -50%);
    animation: ${subtleRotate} 60s linear infinite;
    overflow: hidden;
  }
`;

const ShootingStarWrapper = styled.div`
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  overflow: hidden;
  z-index: 3;
  pointer-events: none;
`;

interface ShootingStarProps {
  $top: string;
  $left: string;
  $size: string;
  $delay: string;
  $duration: string;
}

const ShootingStarElement = styled.div<ShootingStarProps>`
  position: absolute;
  top: ${props => props.$top};
  left: ${props => props.$left};
  width: ${props => props.$size};
  height: 2px;
  background: linear-gradient(
    to right,
    rgba(255, 255, 255, 0.8),
    rgba(70, 131, 255, 0.6),
    rgba(70, 131, 255, 0.1)
  );
  box-shadow: 0 0 5px rgba(255, 255, 255, 0.8);
  animation: ${shootingStar} ${props => props.$duration} ease-out infinite;
  animation-delay: ${props => props.$delay};
  opacity: 0;
`;

// Add a loading overlay
const LoadingOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: #090b12;
  z-index: 1000;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: opacity 0.5s ease-out;
  opacity: 1;
  &.loaded {
    opacity: 0;
    pointer-events: none;
  }
`;

export const TitleScreen: React.FC = () => {
  const [startingGame, setStartingGame] = useState(false);
  const [loadingDev, setLoadingDev] = useState(false);
  const [stars, setStars] = useState<Star[]>([]);
  const [titleAnimation, setTitleAnimation] = useState(false);
  const [glitchActive, setGlitchActive] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [shootingStars, setShootingStars] = useState<Array<{
    id: number;
    top: string;
    left: string;
    size: string;
    delay: string;
    duration: string;
  }>>([]);
  const [particles, setParticles] = useState<Array<{
    id: number;
    top: string;
    left: string;
    size: string;
    delay: string;
    duration: string;
    color: string;
  }>>([]);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [hydrated, setHydrated] = useState(false);
  
  const setPhase = useGameStore(state => state.setPhase);
  const setPlayerName = useGameStore(state => state.setPlayerName);
  const setDifficulty = useGameStore(state => state.setDifficulty);

  // Handle hydration completion
  useEffect(() => {
    setHydrated(true);
  }, []);

  // Mark document as loaded after hydration
  useEffect(() => {
    if (hydrated && typeof document !== 'undefined') {
      document.documentElement.classList.remove('loading');
      setTimeout(() => {
        setIsLoaded(true);
      }, 100);
    }
  }, [hydrated]);

  // Generate stars and effects only on the client side after hydration
  useEffect(() => {
    if (!hydrated) return;
    
    const starCount = 350; // Increased star count for more immersion
    const generatedStars: Star[] = [];
    
    // Define exclusion zones for center area (title and menu)
    const centerExclusionZone = {
      top: 25, // % from top
      bottom: 75, // % from top
      left: 32, // % from left
      right: 68, // % from left
    };
    
    // Generate stars avoiding the exclusion zone
    let i = 0;
    while (generatedStars.length < starCount) {
      const top = Math.random() * 100;
      const left = Math.random() * 100;
      
      // Skip if the star would be in the exclusion zone
      if (
        top > centerExclusionZone.top && 
        top < centerExclusionZone.bottom && 
        left > centerExclusionZone.left && 
        left < centerExclusionZone.right
      ) {
        continue;
      }
      
      generatedStars.push({
        id: i++,
        width: `${Math.random() * 4 + 1}px`,
        height: `${Math.random() * 4 + 1}px`,
        top: `${top}%`,
        left: `${left}%`,
        opacity: Math.random() * 0.9 + 0.3,
        animation: `twinkle ${Math.random() * 10 + 2}s ease-in-out infinite`,
        animationDelay: `${Math.random() * 8}s`
      });
    }
    
    setStars(generatedStars);
    
    // Generate shooting stars
    const shootingStarsCount = 5;
    const generatedShootingStars = Array.from({ length: shootingStarsCount }).map((_, i) => ({
      id: i,
      top: `${Math.random() * 50}%`,
      left: `${Math.random() * 80 + 10}%`,
      size: `${Math.random() * 80 + 40}px`,
      delay: `${Math.random() * 15 + 1}s`,
      duration: `${Math.random() * 4 + 3}s`
    }));
    setShootingStars(generatedShootingStars);
    
    // Generate floating pixel particles
    const particleCount = 30;
    const particleColors = [
      'rgba(132, 90, 245, 0.8)', // Purple
      'rgba(255, 255, 255, 0.6)', // White
      'rgba(65, 88, 208, 0.7)',   // Blue
      'rgba(132, 90, 245, 0.5)',  // Light purple
    ];
    
    const generatedParticles = Array.from({ length: particleCount }).map((_, i) => ({
      id: i,
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      size: `${Math.random() * 6 + 2}px`,
      delay: `${Math.random() * 10}s`,
      duration: `${Math.random() * 15 + 10}s`,
      color: particleColors[Math.floor(Math.random() * particleColors.length)]
    }));
    setParticles(generatedParticles);
    
    // Trigger title animation after a short delay
    setTimeout(() => setTitleAnimation(true), 300);
    
    // Occasionally trigger the glitch effect
    const glitchInterval = setInterval(() => {
      const shouldGlitch = Math.random() > 0.6; // Increased frequency (was 0.7)
      if (shouldGlitch) {
        setGlitchActive(true);
        // Randomize the glitch duration between 200ms and 1000ms
        const glitchDuration = Math.random() * 800 + 200;
        setTimeout(() => setGlitchActive(false), glitchDuration);
      }
    }, 3000 + Math.random() * 2000); // Random interval between 3-5 seconds
    
    return () => clearInterval(glitchInterval);
  }, [hydrated]);

  const handleStartGame = () => {
    setStartingGame(true);
    setGlitchActive(true);
    
    if (titleRef.current) {
      titleRef.current.style.transform = 'scale(1.05)';
      titleRef.current.style.transition = 'transform 0.3s ease-in-out';
    }
    
    if (menuRef.current) {
      menuRef.current.style.opacity = '0';
      menuRef.current.style.transition = 'opacity 0.5s ease-in-out';
    }
    
    // Short delay to show button press effect before transitioning
    setTimeout(() => {
      setPhase(GamePhase.PROLOGUE);
    }, 800);
  };

  const handleLoadDev = () => {
    setLoadingDev(true);
    // Set player name to DEVELOPER and skip to DAY phase
    setPlayerName("DEVELOPER");
    setDifficulty(Difficulty.STANDARD);
    
    if (menuRef.current) {
      menuRef.current.style.opacity = '0.5';
      menuRef.current.style.transition = 'opacity 0.3s ease-in-out';
    }
    
    // Short delay to show button press effect before transitioning
    setTimeout(() => {
      setPhase(GamePhase.DAY);
    }, 500);
  };

  return (
    <>
      {/* Add global style to prevent flash of unstyled content */}
      <GlobalHydrationFix />
      
      {/* Apply global styles to prevent scrolling */}
      <style jsx global>{`
        html, body {
          overflow: hidden;
          margin: 0;
          padding: 0;
          height: 100%;
          width: 100%;
        }
        
        * {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        
        *::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      
      {/* Loading overlay */}
      <LoadingOverlay className={isLoaded ? 'loaded' : ''} />
      
      <FullScreenContainer>
        {/* Large glowing star behind everything */}
        <LargeStar />
        
        {/* Stars background effect - only render after hydration */}
        {hydrated && (
          <StarField>
            {stars.map((star) => (
              <StarPoint
                key={star.id}
                $width={star.width}
                $height={star.height}
                $top={star.top}
                $left={star.left}
                $opacity={star.opacity}
                $duration={star.animation.split(' ')[0].replace('twinkle', '')}
                $delay={star.animationDelay}
              />
            ))}
          </StarField>
        )}
        
        {/* Shooting stars - only render after hydration */}
        {hydrated && (
          <ShootingStarWrapper>
            {shootingStars.map((star) => (
              <ShootingStarElement
                key={star.id}
                $top={star.top}
                $left={star.left}
                $size={star.size}
                $delay={star.delay}
                $duration={star.duration}
              />
            ))}
          </ShootingStarWrapper>
        )}
        
        {/* Floating particles - only render after hydration */}
        {hydrated && (
          <ParticlesContainer>
            {particles.map((particle) => (
              <Particle
                key={particle.id}
                $top={particle.top}
                $left={particle.left}
                $size={particle.size}
                $delay={particle.delay}
                $duration={particle.duration}
                $color={particle.color}
              />
            ))}
          </ParticlesContainer>
        )}

        {/* Vignette overlay */}
        <VignetteOverlay />
        
        {/* Pixel texture overlay */}
        <PixelOverlay />

        {/* Title and content container */}
        <ContentContainer>
          <Title ref={titleRef} $animate={titleAnimation} $glitchActive={glitchActive}>
            ROGUE RESIDENT
          </Title>
          
          <Quote>
            &quot;The mind is not a vessel to be filled, but a constellation to be illuminated.&quot;
          </Quote>
          
          {/* Menu container with button layout */}
          <MenuContainer ref={menuRef}>
            <Button 
              onClick={handleStartGame}
              disabled={startingGame || loadingDev}
              $isPrimary
              $isStarting={startingGame}
            >
              {startingGame ? 'Starting...' : 'Begin Residency'}
            </Button>
            
            <Button
              onClick={handleLoadDev}
              disabled={startingGame || loadingDev}
              $isStarting={loadingDev}
            >
              {loadingDev ? 'Loading...' : 'Load Dev'}
            </Button>
          </MenuContainer>
        </ContentContainer>
        
        {/* Game version */}
        <GameVersion>
          Rogue Resident v0.1.0 - Educational Medical Physics Game
        </GameVersion>
      </FullScreenContainer>
    </>
  );
}; 