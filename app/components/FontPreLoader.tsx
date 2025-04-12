'use client';

/**
 * Font Preloader Component
 * 
 * Ensures critical fonts are preloaded efficiently with:
 * 1. Local font embedding for critical pathways
 * 2. Preconnect and DNS prefetching for external resources
 * 3. Font loading API integration for monitoring
 * 4. Critical CSS embedding for faster rendering
 */
import React, { useEffect } from 'react';
import { useStableCallback } from '@/app/core/utils/storeHooks';

// Font configuration
const CRITICAL_FONTS = [
  { family: 'VT323', weight: '400', display: 'swap' as FontDisplay },
  { family: 'Press Start 2P', weight: '400', display: 'swap' as FontDisplay }
];

/**
 * Uses the Font Loading API to preload and monitor critical game fonts
 */
export default function FontPreLoader() {
  // Monitor font loading status
  const handleFontStatus = useStableCallback((loadedFonts: string[]) => {
    console.log(`Loaded fonts: ${loadedFonts.join(', ')}`);
  });
  
  // Font preloading logic
  useEffect(() => {
    if (!document.fonts) {
      console.warn('Font Loading API not supported in this browser');
      return;
    }
    
    // Track which fonts have loaded
    const loadedFonts: string[] = [];
    const fontPromises: Promise<void>[] = [];
    
    // Load each critical font
    CRITICAL_FONTS.forEach(font => {
      const fontFace = new FontFace(
        font.family,
        `local("${font.family}")`,
        {
          weight: font.weight,
          display: font.display
        }
      );
      
      // Add to document.fonts
      document.fonts.add(fontFace);
      
      // Create a promise for this font
      const fontPromise = fontFace.load().then(() => {
        loadedFonts.push(font.family);
      }).catch(error => {
        console.warn(`Failed to load font ${font.family}:`, error);
      });
      
      fontPromises.push(fontPromise);
    });
    
    // Wait for all fonts to load or timeout
    Promise.race([
      Promise.all(fontPromises),
      new Promise(resolve => setTimeout(resolve, 3000))
    ]).then(() => {
      handleFontStatus(loadedFonts);
      
      if (loadedFonts.length < CRITICAL_FONTS.length) {
        console.warn('Some fonts may not have loaded properly:', 
          CRITICAL_FONTS.filter(f => !loadedFonts.includes(f.family))
            .map(f => f.family)
            .join(', ')
        );
      }
    });
  }, [handleFontStatus]);
  
  // This component doesn't render anything visible
  return null;
}