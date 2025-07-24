/**
 * World Coordinate System Utilities
 * 
 * Shared coordinate conversion functions used by both PixiJS (for sprite positioning)
 * and React (for click overlays). This ensures perfect alignment between visual elements
 * and interactive areas.
 */

// World dimensions configuration (matches HospitalBackdrop.tsx)
export const WORLD_WIDTH = 1920;
export const WORLD_HEIGHT = 1080;

/**
 * Calculate the world scale factor based on screen dimensions
 * This determines how world units map to screen pixels
 */
export function calculateWorldScale(screenWidth: number, screenHeight: number): number {
  const scaleX = screenWidth / WORLD_WIDTH;
  const scaleY = screenHeight / WORLD_HEIGHT;
  return Math.min(scaleX, scaleY) * 1; // Same scaling as PixiJS
}

/**
 * Convert world coordinates to screen coordinates
 * This is the exact same conversion used in PixiJS
 */
export function worldToScreen(
  worldX: number, 
  worldY: number, 
  screenWidth: number, 
  screenHeight: number, 
  worldScale?: number
): { x: number; y: number } {
  const scale = worldScale || calculateWorldScale(screenWidth, screenHeight);
  
  return {
    x: (screenWidth * 0.5) + (worldX * scale),
    y: (screenHeight * 0.5) + (worldY * scale)
  };
}

/**
 * Convert screen coordinates back to world coordinates
 * Useful for debugging and reverse calculations
 */
export function screenToWorld(
  screenX: number, 
  screenY: number, 
  screenWidth: number, 
  screenHeight: number, 
  worldScale?: number
): { x: number; y: number } {
  const scale = worldScale || calculateWorldScale(screenWidth, screenHeight);
  
  return {
    x: (screenX - (screenWidth * 0.5)) / scale,
    y: (screenY - (screenHeight * 0.5)) / scale
  };
}

/**
 * Hook to get current screen dimensions and world scale
 * Updates when window resizes
 */
export function useWorldCoordinates() {
  const [screenDimensions, setScreenDimensions] = React.useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1920,
    height: typeof window !== 'undefined' ? window.innerHeight : 1080
  });

  React.useEffect(() => {
    const handleResize = () => {
      setScreenDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const worldScale = calculateWorldScale(screenDimensions.width, screenDimensions.height);

  return {
    screenWidth: screenDimensions.width,
    screenHeight: screenDimensions.height,
    worldScale,
    worldToScreen: (worldX: number, worldY: number) => 
      worldToScreen(worldX, worldY, screenDimensions.width, screenDimensions.height, worldScale)
  };
}

// React import (add at top when using the hook)
import React from 'react'; 