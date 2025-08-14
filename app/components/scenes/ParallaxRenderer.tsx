'use client';

import React from 'react';
import styled, { css } from 'styled-components';

const HOME_INTERNAL_WIDTH = 640;
const JUMBO_ASSET_HEIGHT = 585;



// All keyframes are defined once in this component to be self-contained
const AnimationKeyframes = css`
  /* Tutorial Star Animations */
  @keyframes hintPulse {
    0%, 100% { 
      opacity: 0.6;
      filter: drop-shadow(0 0 2px rgba(255, 255, 255, 0.3)) 
              drop-shadow(0 0 4px rgba(255, 255, 255, 0.2));
    }
    50% { 
      opacity: 0.9;
      filter: drop-shadow(0 0 4px rgba(255, 255, 255, 0.5)) 
              drop-shadow(0 0 8px rgba(255, 255, 255, 0.4));
    }
  }

  @keyframes starTwinkle {
    0%, 100% { opacity: 0.9; }
    50% { opacity: 1.0; }
  }
  
  @keyframes glowPulse {
    0% { 
      filter: drop-shadow(0 0 4px rgba(255, 255, 255, 0.8)) 
              drop-shadow(0 0 8px rgba(255, 255, 255, 0.6));
    }
    100% { 
      filter: drop-shadow(0 0 8px rgba(255, 255, 255, 1.0)) 
              drop-shadow(0 0 16px rgba(255, 255, 255, 0.8));
    }
  }

  /* Horizontal looping animations - expanded range */
  @keyframes loop-glacial {
    from { background-position-x: 0; }
    to { background-position-x: -1280px; }
  }
  
  @keyframes loop-crawl {
    from { background-position-x: 0; }
    to { background-position-x: -1280px; }
  }
  
  @keyframes loop-drift {
    from { background-position-x: 0; }
    to { background-position-x: -1280px; }
  }
  
  @keyframes loop-float {
    from { background-position-x: 0; }
    to { background-position-x: -1280px; }
  }
  
  @keyframes loop-cruise {
    from { background-position-x: 0; }
    to { background-position-x: -1280px; }
  }
  
  @keyframes loop-breeze {
    from { background-position-x: 0; }
    to { background-position-x: -1280px; }
  }
  
  @keyframes loop-swift {
    from { background-position-x: 0; }
    to { background-position-x: -1280px; }
  }
  
  @keyframes loop-rapid {
    from { background-position-x: 0; }
    to { background-position-x: -1280px; }
  }

  /* Floating animation keyframes - using margin to avoid transform conflicts */
  @keyframes float1 { 0%, 100% { margin-left: 0px; margin-top: 0px; } 50% { margin-left: 2px; margin-top: -2px; } }
  @keyframes float2 { 0%, 100% { margin-left: 0px; margin-top: 0px; } 50% { margin-left: -1px; margin-top: 2px; } }
  @keyframes float3 { 0%, 100% { margin-left: 0px; margin-top: 0px; } 50% { margin-left: 1px; margin-top: 1px; } }
  @keyframes float4 { 0%, 100% { margin-left: 0px; margin-top: 0px; } 50% { margin-left: -2px; margin-top: 1px; } }
  @keyframes float5 { 0%, 100% { margin-left: 0px; margin-top: 0px; } 50% { margin-left: 1px; margin-top: -1px; } }
  @keyframes float6 { 0%, 100% { margin-left: 0px; margin-top: 0px; } 50% { margin-left: -1px; margin-top: -1px; } }
  @keyframes float7 { 0%, 100% { margin-left: 0px; margin-top: 0px; } 50% { margin-left: 2px; margin-top: 0px; } }
  @keyframes float8 { 0%, 100% { margin-left: 0px; margin-top: 0px; } 50% { margin-left: -1px; margin-top: 2px; } }
`;

const ParallaxContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  /* Inject all keyframes */
  ${AnimationKeyframes}
`;

// A single styled component for all layers, configured by props
const Layer = styled.div.attrs<{
  $zIndex: number;
  $parallaxFactor: number;
  $scrollPosition: number;
}>(props => ({
  style: {
    zIndex: props.$zIndex,
    // REMOVE transform from attrs to prevent conflicts with CSS animations
  }
}))<{
  $layer: string;
  $zIndex: number;
  $animationDelay?: number;
  $loopSpeed?: 'glacial' | 'crawl' | 'drift' | 'float' | 'cruise' | 'breeze' | 'swift' | 'rapid';
  $parallaxFactor: number;
  $scrollPosition: number;
  $enableTransitions: boolean;
}>`
  position: absolute;
  top: 0;
  left: 0;
  width: ${HOME_INTERNAL_WIDTH * 2}px;
  height: ${JUMBO_ASSET_HEIGHT}px;
  
  background-image: url('/images/home/${props => props.$layer}.png');
  background-repeat: repeat-x;
  background-size: ${HOME_INTERNAL_WIDTH}px ${JUMBO_ASSET_HEIGHT}px;
  
  image-rendering: pixelated;
  
  /* Apply parallax transform via CSS to work with animations */
  transform: translateY(${props => props.$scrollPosition * props.$parallaxFactor}px);
  
  /* Conditional transition: disabled during startup, enabled for smooth scrolling */
  transition: ${props => props.$enableTransitions ? 'transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)' : 'none'};

  /* Set animation properties based on props */
  animation-name: ${props => {
    const names = [];
    if (props.$loopSpeed) names.push(`loop-${props.$loopSpeed}`);
    if (props.$layer.startsWith('cloud')) names.push(`float${props.$layer.split('-')[1]}`);
    return names.join(', ');
  }};
  animation-duration: ${props => {
    const durations = [];
    if (props.$loopSpeed) {
      // Expanded speed range with slower overall speeds for more atmospheric movement
      const speed = props.$loopSpeed === 'glacial' ? '1000s' :    // Ultra slow (10 minutes)
                   props.$loopSpeed === 'crawl' ? '950s' :      // Very slow (7.5 minutes)  
                   props.$loopSpeed === 'drift' ? '850s' :      // Slow (5.8 minutes)
                   props.$loopSpeed === 'float' ? '750s' :      // Medium-slow (4.2 minutes)
                   props.$loopSpeed === 'cruise' ? '450s' :     // Medium (3 minutes)
                   props.$loopSpeed === 'breeze' ? '320s' :     // Medium-fast (2 minutes)
                   props.$loopSpeed === 'swift' ? '900s' :       // Fast (1.3 minutes)
                   '900s';                                       // Very fast (50 seconds)
      durations.push(speed);
    }
    if (props.$layer.startsWith('cloud')) {
      durations.push(`${20 + (props.$animationDelay || 0)}s`); // Slightly slower floating too
    }
    return durations.join(', ');
  }};
  animation-timing-function: ${props => {
    const functions = [];
    if (props.$loopSpeed) functions.push('linear');
    if (props.$layer.startsWith('cloud')) functions.push('ease-in-out');
    return functions.join(', ');
  }};
  animation-iteration-count: infinite;
  animation-delay: ${props => {
    const delays = [];
    if (props.$loopSpeed) delays.push('0s'); // Loop animations start immediately
    if (props.$layer.startsWith('cloud')) delays.push(`${props.$animationDelay || 0}s`); // Float animations have delay
    return delays.join(', ');
  }};
`;

// Layer definitions with dramatic speed range - slower overall with wide variety
const layers = [
    { name: 'sky', zIndex: 1, loopSpeed: 'glacial', parallaxFactor: 0.1 },        // Ultra slow background
    { name: 'stars', zIndex: 2, loopSpeed: undefined, parallaxFactor: 0.2 },      // Static stars
    { name: 'moon', zIndex: 3, loopSpeed: undefined, parallaxFactor: 0.2 },      // Static moon like stars
    { name: 'cloud-1', zIndex: 4, animationDelay: 0, loopSpeed: 'crawl', parallaxFactor: 0.3 },     // Very slow distant clouds
    { name: 'cloud-2', zIndex: 5, animationDelay: 2, loopSpeed: 'drift', parallaxFactor: 0.35 },    // Slow drifting
    { name: 'cloud-3', zIndex: 6, animationDelay: 4, loopSpeed: 'float', parallaxFactor: 0.4 },     // Medium-slow floating
    { name: 'cloud-4', zIndex: 7, animationDelay: 1, loopSpeed: 'cruise', parallaxFactor: 0.45 },   // Medium cruising
    { name: 'cloud-5', zIndex: 8, animationDelay: 3, loopSpeed: 'breeze', parallaxFactor: 0.5 },    // Medium-fast breeze
    { name: 'cloud-6', zIndex: 9, animationDelay: 5, loopSpeed: 'swift', parallaxFactor: 0.55 },    // Fast movement
    { name: 'cloud-7', zIndex: 10, animationDelay: 2.5, loopSpeed: 'rapid', parallaxFactor: 0.6 },   // Very fast foreground
    { name: 'cloud-8', zIndex: 11, animationDelay: 4.5, loopSpeed: 'rapid', parallaxFactor: 0.65 }, // Very fast close clouds
];

const ParallaxRenderer: React.FC<{ 
  scrollPosition: number;
}> = React.memo(({ scrollPosition }) => {
  // Simple check: if scrollPosition is 0, we're in sky view; otherwise home view
  const isInSkyView = scrollPosition === 0;
  // Track if this is the initial render to disable transitions during startup
  const [isInitialized, setIsInitialized] = React.useState(false);
  
  // Enable transitions after initial animations have started
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialized(true);
    }, 500); // Allow 500ms for animations to initialize
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <ParallaxContainer>
      {layers.map(layer => (
        <Layer
          key={layer.name}
          $layer={layer.name}
          $zIndex={layer.zIndex}
          $animationDelay={layer.animationDelay}
          $loopSpeed={layer.loopSpeed as 'glacial' | 'crawl' | 'drift' | 'float' | 'cruise' | 'breeze' | 'swift' | 'rapid' | undefined}
          $parallaxFactor={layer.parallaxFactor}
          $scrollPosition={scrollPosition}
          $enableTransitions={isInitialized}
        />
      ))}
    </ParallaxContainer>
  );
});

ParallaxRenderer.displayName = 'ParallaxRenderer';

export default ParallaxRenderer;
