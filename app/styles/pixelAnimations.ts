/**
 * pixelAnimations.ts
 * Utility functions and constants for pixel-perfect animations
 * to be used with the pixelTheme system.
 */
import pixelTheme from './pixelTheme';

// Define keyframes for pixel animations
export const keyframes = {
  // Star twinkle animation
  twinkle: `
    @keyframes twinkle {
      0% { opacity: 1; filter: brightness(1); }
      50% { opacity: 0.7; filter: brightness(1.3); }
      100% { opacity: 1; filter: brightness(1); }
    }
  `,
  
  // Button press animation
  press: `
    @keyframes press {
      0% { transform: translateY(0); }
      100% { transform: translateY(4px); }
    }
  `,
  
  // Pulse animation for highlights
  pulse: `
    @keyframes pulse {
      0% { transform: scale(1); filter: brightness(1); }
      50% { transform: scale(1.05); filter: brightness(1.1); }
      100% { transform: scale(1); filter: brightness(1); }
    }
  `,
  
  // Text reveal, character by character
  typewriter: `
    @keyframes typewriter {
      from { width: 0; }
      to { width: 100%; }
    }
  `,
  
  // Cursor blink for typewriter effect
  cursorBlink: `
    @keyframes cursorBlink {
      from { border-right-color: ${pixelTheme.colors.text}; }
      to { border-right-color: transparent; }
    }
  `,
  
  // Bounce animation for attention
  bounce: `
    @keyframes bounce {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-6px); }
    }
  `,
  
  // Resource gain animation
  resourceGain: `
    @keyframes resourceGain {
      0% { transform: scale(1); filter: brightness(1); }
      40% { transform: scale(1.3); filter: brightness(1.5); }
      100% { transform: scale(1); filter: brightness(1); }
    }
  `,
  
  // Fade in animation
  fadeIn: `
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
  `,
  
  // Slide up animation
  slideUp: `
    @keyframes slideUp {
      from { transform: translateY(20px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
  `,
  
  // Pixel glitch effect
  glitch: `
    @keyframes glitch {
      0% {
        clip-path: inset(40% 0 61% 0);
        transform: translate(-2px, 2px);
      }
      20% { 
        clip-path: inset(92% 0 1% 0);
        transform: translate(1px, 3px);
      }
      40% {
        clip-path: inset(43% 0 1% 0);
        transform: translate(-1px, -3px);
      }
      60% {
        clip-path: inset(25% 0 58% 0);
        transform: translate(3px, 2px);
      }
      80% {
        clip-path: inset(54% 0 7% 0);
        transform: translate(-2px, -4px);
      }
      100% {
        clip-path: inset(58% 0 43% 0);
        transform: translate(2px, -1px);
      }
    }
  `,
  
  // Star connection animation
  connectStars: `
    @keyframes connectStars {
      0% { stroke-dashoffset: 100; opacity: 0; }
      100% { stroke-dashoffset: 0; opacity: 1; }
    }
  `,
  
  // Night phase transition (stars appearing)
  nightTransition: `
    @keyframes nightTransition {
      0% { opacity: 0; transform: scale(0.8); }
      100% { opacity: 1; transform: scale(1); }
    }
  `,
};

// Animation utility functions
export const animations = {
  // Apply twinkle animation to stars
  twinkle: (duration = '2s', timing = 'infinite') => `
    animation: twinkle ${duration} ${pixelTheme.animation.easing.smooth} ${timing};
  `,
  
  // Apply press animation to buttons
  press: (duration = '150ms') => `
    animation: press ${duration} ${pixelTheme.animation.easing.pixel} forwards;
  `,
  
  // Apply pulse animation for highlighting
  pulse: (duration = '1s', timing = 'infinite') => `
    animation: pulse ${duration} ${pixelTheme.animation.easing.smooth} ${timing};
  `,
  
  // Apply typewriter animation to text
  typewriter: (duration = '2s', delay = '0s', steps = 40) => `
    white-space: nowrap;
    overflow: hidden;
    border-right: 2px solid ${pixelTheme.colors.text};
    width: 0;
    animation: 
      typewriter ${duration} steps(${steps}, end) ${delay} forwards,
      cursorBlink 750ms ${pixelTheme.animation.easing.smooth} infinite;
  `,
  
  // Apply bounce animation
  bounce: (duration = '0.8s', timing = 'ease-in-out') => `
    animation: bounce ${duration} ${timing} infinite;
  `,
  
  // Apply resource gain animation
  resourceGain: (duration = '500ms') => `
    animation: resourceGain ${duration} ${pixelTheme.animation.easing.smooth} forwards;
  `,
  
  // Apply fade in animation
  fadeIn: (duration = '300ms', delay = '0s') => `
    animation: fadeIn ${duration} ${pixelTheme.animation.easing.smooth} ${delay} forwards;
  `,
  
  // Apply slide up animation
  slideUp: (duration = '300ms', delay = '0s') => `
    animation: slideUp ${duration} ${pixelTheme.animation.easing.smooth} ${delay} forwards;
  `,
  
  // Apply glitch animation
  glitch: (duration = '300ms', timing = '1') => `
    position: relative;
    
    &::before,
    &::after {
      content: attr(data-text);
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
    }
    
    &::before {
      left: 2px;
      text-shadow: -2px 0 ${pixelTheme.colors.highlight};
      animation: glitch ${duration} ${pixelTheme.animation.easing.pixel} ${timing};
    }
    
    &::after {
      left: -2px;
      text-shadow: 2px 0 ${pixelTheme.colors.error};
      animation: glitch ${duration} ${pixelTheme.animation.easing.pixel} ${timing} reverse;
    }
  `,
  
  // Apply star connection animation
  connectStars: (duration = '1s', delay = '0s') => `
    stroke-dasharray: 100;
    stroke-dashoffset: 100;
    animation: connectStars ${duration} ${pixelTheme.animation.easing.smooth} ${delay} forwards;
  `,
  
  // Apply night transition animation
  nightTransition: (duration = '1s', delay = '0s', staggerIndex = 0) => `
    opacity: 0;
    animation: nightTransition ${duration} ${pixelTheme.animation.easing.smooth} ${delay} forwards;
    animation-delay: calc(${delay} + ${staggerIndex * 100}ms);
  `,
};

// Function to generate global keyframes CSS
export const generateGlobalKeyframes = () => {
  return Object.values(keyframes).join('\n');
};

// Function to apply multiple animations
export const combineAnimations = (...animationFunctions: string[]) => {
  return animationFunctions.join('\n');
};

// Create a named export object
export const pixelAnimations = {
  keyframes,
  animations,
  generateGlobalKeyframes,
  combineAnimations
};

export default pixelAnimations; 