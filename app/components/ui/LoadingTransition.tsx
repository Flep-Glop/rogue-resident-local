'use client';

import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { useLoading } from '@/app/providers/LoadingProvider';

// Styled components for the loading overlay
const LoadingOverlay = styled.div<{ $visible: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: black;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  opacity: ${props => props.$visible ? 1 : 0};
  pointer-events: ${props => props.$visible ? 'all' : 'none'};
  transition: opacity 0.3s ease-in-out;
`;

const SpriteContainer = styled.div`
  width: 64px;    /* Actual width of a single frame */
  height: 64px;   /* Actual height of a single frame */
  overflow: hidden;
  position: relative;
`;

const SpriteImage = styled.div`
  width: 1408px; /* Total width = frame width * total frames */
  height: 64px;  /* Height of a single frame */
  background-image: url('/images/ui/loading-Sheet.png');
  background-repeat: no-repeat;
  background-size: cover;
  position: absolute;
  top: 0;
  left: 0;
`;

const LoadingText = styled.div`
  font-family: var(--font-press-start-2p);
  color: white;
  font-size: 14px;
  margin-top: 20px;
`;

export default function LoadingTransition() {
  const { isLoading } = useLoading();
  const spriteRef = useRef<HTMLDivElement>(null);
  const [loadingText, setLoadingText] = useState("Loading...");
  const animationRef = useRef<number | null>(null);
  const frameRef = useRef(0);
  const directionRef = useRef(1); // 1 for forward, -1 for backward
  const frameDelayRef = useRef(0); // Counter for slowing down animation

  // Animation parameters
  const totalFrames = 22; // Total frames in spritesheet
  const frameWidth = 64;  // Width of each frame in pixels
  const frameDelay = 8;   // Frames to wait before moving to next sprite frame
  
  // Handle loading text animation
  useEffect(() => {
    if (!isLoading) return;
    
    const interval = setInterval(() => {
      setLoadingText(prev => {
        if (prev === "Loading...") return "Loading";
        if (prev === "Loading") return "Loading.";
        if (prev === "Loading.") return "Loading..";
        return "Loading...";
      });
    }, 500);
    
    return () => clearInterval(interval);
  }, [isLoading]);

  // Handle sprite animation
  useEffect(() => {
    if (!isLoading) {
      // Stop animation if not loading
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      return;
    }
    
    // Reset animation state
    frameRef.current = 0;
    directionRef.current = 1;
    frameDelayRef.current = 0;
    
    // Animation function
    const animate = () => {
      if (!spriteRef.current || !isLoading) return;
      
      // Slow down animation using frame delay
      frameDelayRef.current++;
      if (frameDelayRef.current < frameDelay) {
        animationRef.current = requestAnimationFrame(animate);
        return;
      }
      frameDelayRef.current = 0;
      
      // Update frame position with ping-pong effect
      frameRef.current += directionRef.current;
      
      // Reverse direction at edges
      if (frameRef.current >= totalFrames - 1) {
        frameRef.current = totalFrames - 1;
        directionRef.current = -1; // Go backward
      } else if (frameRef.current <= 0) {
        frameRef.current = 0;
        directionRef.current = 1; // Go forward
      }
      
      // Apply position
      const posX = -(frameRef.current * frameWidth);
      spriteRef.current.style.transform = `translateX(${posX}px)`;
      
      // Continue animation
      animationRef.current = requestAnimationFrame(animate);
    };
    
    // Start animation
    animationRef.current = requestAnimationFrame(animate);
    
    // Cleanup
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [isLoading]);

  return (
    <LoadingOverlay $visible={isLoading}>
      <SpriteContainer>
        <SpriteImage ref={spriteRef} />
      </SpriteContainer>
      <LoadingText>{loadingText}</LoadingText>
    </LoadingOverlay>
  );
} 