import React, { useState, useEffect, useRef } from 'react';
import styled, { keyframes } from 'styled-components';
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

const pulseTitle = keyframes`
  0% { text-shadow: ${colors.highlight} 0 0 10px, ${typography.textShadow.pixel}; }
  50% { text-shadow: ${colors.highlight} 0 0 20px, ${typography.textShadow.pixel}; }
  100% { text-shadow: ${colors.highlight} 0 0 10px, ${typography.textShadow.pixel}; }
`;

const pulseButton = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.03); }
  100% { transform: scale(1); }
`;

// Styled components
const FullScreenContainer = styled.div`
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: linear-gradient(to bottom, ${colors.background}, ${colors.backgroundAlt});
  font-family: ${typography.fontFamily.pixel};
  color: ${colors.text};
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  margin: 0;
  padding: 0;
  overflow: hidden;
`;

const StarField = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  opacity: 0.4;
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

const StarPoint = styled.div<StarPointProps>`
  position: absolute;
  width: ${props => props.$width};
  height: ${props => props.$height};
  top: ${props => props.$top};
  left: ${props => props.$left};
  opacity: ${props => props.$opacity};
  background-color: ${colors.starGlow};
  box-shadow: ${shadows.glow(colors.starGlow)};
  border-radius: 50%;
  animation: ${twinkle} ${props => props.$duration} ease-in-out infinite;
  animation-delay: ${props => props.$delay};
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
`;

interface TitleProps {
  $animate: boolean;
}

const Title = styled.h1<TitleProps>`
  font-size: 4rem;
  font-weight: bold;
  text-align: center;
  width: 100%;
  margin: 0 auto 20px auto;
  text-shadow: ${colors.highlight} 0 0 10px, ${typography.textShadow.pixel};
  background: linear-gradient(to right, ${colors.treatmentPlanning}, ${colors.highlight});
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  letter-spacing: 0.05em;
  animation: ${props => props.$animate ? pulseTitle : 'none'} 4s ease-in-out infinite;
`;

const Quote = styled.p`
  font-size: ${typography.fontSize.lg};
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

  &:hover {
    transform: ${props => props.$isStarting ? 'translateY(4px)' : 'scale(1.05)'};
    opacity: ${props => props.$isPrimary ? '1' : '0.8'};
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

export const TitleScreen: React.FC = () => {
  const [startingGame, setStartingGame] = useState(false);
  const [loadingDev, setLoadingDev] = useState(false);
  const [stars, setStars] = useState<Star[]>([]);
  const [titleAnimation, setTitleAnimation] = useState(false);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  
  const setPhase = useGameStore(state => state.setPhase);
  const setPlayerName = useGameStore(state => state.setPlayerName);
  const setDifficulty = useGameStore(state => state.setDifficulty);

  // Generate stars only on the client side to avoid hydration mismatch
  useEffect(() => {
    const starCount = 150; // Increased star count for more immersion
    const generatedStars = Array.from({ length: starCount }).map((_, i) => ({
      id: i,
      width: `${Math.random() * 3 + 1}px`,
      height: `${Math.random() * 3 + 1}px`,
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`, // This ensures stars are distributed across the entire width
      opacity: Math.random() * 0.8 + 0.2,
      animation: `twinkle ${Math.random() * 8 + 3}s ease-in-out infinite`,
      animationDelay: `${Math.random() * 5}s`
    }));
    setStars(generatedStars);
    
    // Trigger title animation after a short delay
    setTimeout(() => setTitleAnimation(true), 300);
  }, []);

  const handleStartGame = () => {
    setStartingGame(true);
    
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
    <FullScreenContainer>
      {/* Stars background effect */}
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

      {/* Title and content container */}
      <ContentContainer>
        <Title ref={titleRef} $animate={titleAnimation}>
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
  );
}; 