"use client";

import { useState, useEffect, useRef } from 'react';

// ============================================================================
// TEMPLATE PALETTES - The exact colors used in sprite PNGs
// ============================================================================

export const BASE_PALETTES = {
  // Skin uses 3 shades (all get swapped) for face/ears/nose/mouth
  skin: ['#341c27', '#602c2c', '#84412a'],
  // Body sprite has an extra dark shadow shade for torso shading
  bodySkinShadow: '#241527',
  
  // Hair uses 4 shades - darkest is static by default, top 3 get swapped
  // If hair ramp provides 4 colors, static shade also gets recolored to shadow color
  hair: {
    static: '#10141f',  // Stays unchanged unless ramp has 4th shadow color
    swappable: ['#151d28', '#394a50', '#577277'],  // Always get recolored
  },
  
  // Facial hair uses different 4 shades - same logic as hair
  // Facial hair colors are shifted one shade darker than head hair
  facialHair: {
    static: '#10141f',  // Stays unchanged unless ramp has 4th shadow color
    swappable: ['#151d28', '#202e37', '#394a50'],  // Always get recolored (shifted darker)
  },
  
  // Clothes templates
  shirt: ['#090a14', '#10141f', '#151d28', '#202e37'],  // 4 shades
  pants: ['#090a14', '#10141f', '#151d28'],  // 3 shades
  shoes: ['#090a14', '#10141f'],  // 2 shades
};

// ============================================================================
// COLOR RAMPS FOR PLAYER SELECTION
// ============================================================================

// Each ramp has 4 colors: [bodyShadow, shadow, mid, highlight]
// bodyShadow is used for deep body shadows (torso), the other 3 map to regular skin template
export const SKIN_RAMPS = {
  cool1: { name: 'Cool Light', colors: ['#7a6a5f', '#9d8878', '#c4a99a', '#dcc9bd'] },
  pale2: { name: 'Light', colors: ['#856d55', '#a88b70', '#d7b594', '#ead3bf'] },
  warm1: { name: 'Warm Light', colors: ['#5a3530', '#7a4841', '#ad7757', '#d7b594'] },
  warm3: { name: 'Warm Dark', colors: ['#3a1f25', '#4d2b32', '#7a4841', '#ad7757'] },
  brown1: { name: 'Brown', colors: ['#3a1f25', '#4d2b32', '#6b3d2e', '#8b5a3c'] },
  brown2: { name: 'Medium Brown', colors: ['#2a1510', '#3d1f1a', '#5a3525', '#7a4841'] },
  deep1: { name: 'Deep', colors: ['#241527', '#341c27', '#4d2b32', '#6b3d2e'] },
  deep2: { name: 'Very Deep', colors: ['#150a0d', '#1f1315', '#341c27', '#4d2b32'] },
};

// Hair ramps - 3 colors for swappable shades, optional 4th for shadow (darkest static shade)
// If 4 colors provided: [shadow, dark, mid, light] - shadow replaces static template shade
// If 3 colors provided: [dark, mid, light] - static template shade stays unchanged
export const HAIR_RAMPS = {
  brown: { name: 'Brown', colors: ['#3d1a0e', '#62291a', '#9c4d2c', '#e69867'] },  // Has shadow
  black: { name: 'Black', colors: ['#090a14', '#151d28', '#394a50', '#577277'] },  // Has shadow (default/template)
  blonde: { name: 'Blonde', colors: ['#884b2b', '#de9e41', '#e8c170'] },  // No shadow - too light
  red: { name: 'Red', colors: ['#4a1525', '#752438', '#a53030', '#cf573c'] },  // Has shadow
  blue: { name: 'Blue', colors: ['#151d2e', '#253a5e', '#4f8fba', '#73bed3'] },  // Has shadow
  purple: { name: 'Purple', colors: ['#251535', '#402751', '#7a367b', '#c65197'] },  // Has shadow
  green: { name: 'Green', colors: ['#0d1f18', '#19332d', '#468232', '#a8ca58'] },  // Has shadow
  gray: { name: 'Gray', colors: ['#394a50', '#819796', '#c7cfcc'] },  // No shadow - grays look fine without
  white: { name: 'White', colors: ['#577277', '#a8b5b2', '#ebede9'] },  // No shadow - too light
};

// Clothes ramps - 4 colors each (dark to light), subsets used for pants (3) and shoes (2)
export const CLOTHES_RAMPS = {
  black: { name: 'Black', colors: ['#090a14', '#10141f', '#151d28', '#202e37'] },  // Default/template
  navy: { name: 'Navy', colors: ['#0a1628', '#152b4a', '#1f4068', '#2d5a87'] },
  gray: { name: 'Gray', colors: ['#2a2a3a', '#3d3d50', '#525266', '#6b6b80'] },
  brown: { name: 'Brown', colors: ['#2d1a0e', '#4a2c1a', '#6b4030', '#8b5a42'] },
  green: { name: 'Green', colors: ['#0a1f14', '#153a28', '#1f5538', '#2d7050'] },
  red: { name: 'Maroon', colors: ['#1f0a14', '#3a1528', '#551f38', '#702d50'] },
  purple: { name: 'Purple', colors: ['#1a0a28', '#2d154a', '#401f6b', '#552d8b'] },
  teal: { name: 'Teal', colors: ['#0a1f1f', '#153a3a', '#1f5555', '#2d7070'] },
  white: { name: 'White', colors: ['#8090a0', '#a0b0c0', '#c0d0e0', '#e0e8f0'] },
};

export type SkinRampId = keyof typeof SKIN_RAMPS;
export type HairRampId = keyof typeof HAIR_RAMPS;
export type ClothesRampId = keyof typeof CLOTHES_RAMPS;

// ============================================================================
// RECOLORING UTILITIES
// ============================================================================

// Convert hex to RGB
function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return [0, 0, 0];
  return [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16),
  ];
}

// Check if two RGB colors match (exact match for pixel art)
function colorsMatch(r1: number, g1: number, b1: number, r2: number, g2: number, b2: number): boolean {
  return r1 === r2 && g1 === g2 && b1 === b2;
}

// Recolor an image by swapping palette colors
async function recolorImage(
  imageSrc: string,
  colorMappings: Array<{ from: string; to: string }>
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      
      // Draw original image
      ctx.drawImage(img, 0, 0);
      
      // Get pixel data
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      // Pre-convert all color mappings to RGB for performance
      const mappings = colorMappings.map(m => ({
        from: hexToRgb(m.from),
        to: hexToRgb(m.to),
      }));
      
      // Process each pixel
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        // const a = data[i + 3]; // Alpha - we don't change this
        
        // Check against each mapping
        for (const mapping of mappings) {
          if (colorsMatch(r, g, b, mapping.from[0], mapping.from[1], mapping.from[2])) {
            data[i] = mapping.to[0];
            data[i + 1] = mapping.to[1];
            data[i + 2] = mapping.to[2];
            break; // Found a match, stop checking
          }
        }
      }
      
      // Put modified pixels back
      ctx.putImageData(imageData, 0, 0);
      
      // Return as data URL
      resolve(canvas.toDataURL('image/png'));
    };
    
    img.onerror = () => {
      reject(new Error(`Failed to load image: ${imageSrc}`));
    };
    
    img.src = imageSrc;
  });
}

// ============================================================================
// RECOLORED SPRITE HOOK
// ============================================================================

interface RecolorOptions {
  skinRamp?: SkinRampId;
  hairRamp?: HairRampId;
}

// Cache for recolored images to avoid re-processing
const recolorCache = new Map<string, string>();

function getCacheKey(src: string, options: RecolorOptions): string {
  return `${src}|skin:${options.skinRamp || 'default'}|hair:${options.hairRamp || 'default'}`;
}

export function useRecoloredSprite(
  originalSrc: string,
  partType: 'skin' | 'hair' | 'facialHair' | 'other',
  options: RecolorOptions
): string {
  const [recoloredSrc, setRecoloredSrc] = useState<string>(originalSrc);
  const processingRef = useRef<string | null>(null);
  
  useEffect(() => {
    // If no recoloring needed, use original
    if (partType === 'other') {
      setRecoloredSrc(originalSrc);
      return;
    }
    
    const cacheKey = getCacheKey(originalSrc, options);
    
    // Check cache first
    if (recolorCache.has(cacheKey)) {
      setRecoloredSrc(recolorCache.get(cacheKey)!);
      return;
    }
    
    // Prevent duplicate processing
    if (processingRef.current === cacheKey) return;
    processingRef.current = cacheKey;
    
    // Build color mappings based on part type
    const mappings: Array<{ from: string; to: string }> = [];
    
    if (partType === 'skin' && options.skinRamp) {
      const targetColors = SKIN_RAMPS[options.skinRamp].colors;
      BASE_PALETTES.skin.forEach((fromColor, index) => {
        mappings.push({ from: fromColor, to: targetColors[index] });
      });
    }
    
    if (partType === 'hair' && options.hairRamp) {
      const rampColors = HAIR_RAMPS[options.hairRamp].colors;
      
      // If ramp has 4 colors, first is shadow for static shade, rest are for swappable
      // If ramp has 3 colors, static shade stays unchanged, all 3 map to swappable
      if (rampColors.length === 4) {
        // Map static shade to shadow color
        mappings.push({ from: BASE_PALETTES.hair.static, to: rampColors[0] });
        // Map swappable shades to remaining 3 colors
        BASE_PALETTES.hair.swappable.forEach((fromColor, index) => {
          mappings.push({ from: fromColor, to: rampColors[index + 1] });
        });
      } else {
        // No shadow color - static shade stays as-is, map swappable to all 3 colors
        BASE_PALETTES.hair.swappable.forEach((fromColor, index) => {
          mappings.push({ from: fromColor, to: rampColors[index] });
        });
      }
    }
    
    if (partType === 'facialHair' && options.hairRamp) {
      const rampColors = HAIR_RAMPS[options.hairRamp].colors;
      
      // Facial hair is shifted one shade darker than regular hair
      // For 4-color ramps: shadow goes to static, and swappable uses [0,0,1] of the main 3
      // For 3-color ramps: static unchanged, swappable uses [0,0,1] of the 3 colors
      if (rampColors.length === 4) {
        // Map static shade to shadow color
        mappings.push({ from: BASE_PALETTES.facialHair.static, to: rampColors[0] });
        // Shift swappable one shade darker: use [1,1,2] from the 4-color ramp
        const shiftedColors = [rampColors[1], rampColors[1], rampColors[2]];
        BASE_PALETTES.facialHair.swappable.forEach((fromColor, index) => {
          mappings.push({ from: fromColor, to: shiftedColors[index] });
        });
      } else {
        // No shadow color - static stays as-is
        // Shift swappable one shade darker: use [0,0,1] from the 3-color ramp
        const shiftedColors = [rampColors[0], rampColors[0], rampColors[1]];
        BASE_PALETTES.facialHair.swappable.forEach((fromColor, index) => {
          mappings.push({ from: fromColor, to: shiftedColors[index] });
        });
      }
    }
    
    // If no mappings needed, use original
    if (mappings.length === 0) {
      setRecoloredSrc(originalSrc);
      processingRef.current = null;
      return;
    }
    
    // Perform recoloring
    recolorImage(originalSrc, mappings)
      .then(dataUrl => {
        recolorCache.set(cacheKey, dataUrl);
        setRecoloredSrc(dataUrl);
        processingRef.current = null;
      })
      .catch(err => {
        console.error('Recoloring failed:', err);
        setRecoloredSrc(originalSrc);
        processingRef.current = null;
      });
  }, [originalSrc, partType, options.skinRamp, options.hairRamp]);
  
  return recoloredSrc;
}

// Batch recolor multiple sprites at once (for character preview)
export function useRecoloredCharacter(
  parts: Array<{ src: string; partType: 'skin' | 'hair' | 'facialHair' | 'other' }>,
  options: RecolorOptions
): string[] {
  const [recoloredSrcs, setRecoloredSrcs] = useState<string[]>(parts.map(p => p.src));
  
  useEffect(() => {
    const processAll = async () => {
      const results = await Promise.all(
        parts.map(async (part) => {
          if (part.partType === 'other') return part.src;
          
          const cacheKey = getCacheKey(part.src, options);
          if (recolorCache.has(cacheKey)) {
            return recolorCache.get(cacheKey)!;
          }
          
          const mappings: Array<{ from: string; to: string }> = [];
          
          if (part.partType === 'skin' && options.skinRamp) {
            const targetColors = SKIN_RAMPS[options.skinRamp].colors;
            BASE_PALETTES.skin.forEach((fromColor, index) => {
              mappings.push({ from: fromColor, to: targetColors[index] });
            });
          }
          
          if (part.partType === 'hair' && options.hairRamp) {
            const rampColors = HAIR_RAMPS[options.hairRamp].colors;
            
            // If ramp has 4 colors, first is shadow for static shade, rest are for swappable
            // If ramp has 3 colors, static shade stays unchanged, all 3 map to swappable
            if (rampColors.length === 4) {
              // Map static shade to shadow color
              mappings.push({ from: BASE_PALETTES.hair.static, to: rampColors[0] });
              // Map swappable shades to remaining 3 colors
              BASE_PALETTES.hair.swappable.forEach((fromColor, index) => {
                mappings.push({ from: fromColor, to: rampColors[index + 1] });
              });
            } else {
              // No shadow color - static shade stays as-is, map swappable to all 3 colors
              BASE_PALETTES.hair.swappable.forEach((fromColor, index) => {
                mappings.push({ from: fromColor, to: rampColors[index] });
              });
            }
          }
          
          if (part.partType === 'facialHair' && options.hairRamp) {
            const rampColors = HAIR_RAMPS[options.hairRamp].colors;
            
            // Facial hair is shifted one shade darker than regular hair
            if (rampColors.length === 4) {
              // Map static shade to shadow color
              mappings.push({ from: BASE_PALETTES.facialHair.static, to: rampColors[0] });
              // Shift swappable one shade darker: use [1,1,2] from the 4-color ramp
              const shiftedColors = [rampColors[1], rampColors[1], rampColors[2]];
              BASE_PALETTES.facialHair.swappable.forEach((fromColor, index) => {
                mappings.push({ from: fromColor, to: shiftedColors[index] });
              });
            } else {
              // No shadow color - static stays as-is
              // Shift swappable one shade darker: use [0,0,1] from the 3-color ramp
              const shiftedColors = [rampColors[0], rampColors[0], rampColors[1]];
              BASE_PALETTES.facialHair.swappable.forEach((fromColor, index) => {
                mappings.push({ from: fromColor, to: shiftedColors[index] });
              });
            }
          }
          
          if (mappings.length === 0) return part.src;
          
          try {
            const dataUrl = await recolorImage(part.src, mappings);
            recolorCache.set(cacheKey, dataUrl);
            return dataUrl;
          } catch {
            return part.src;
          }
        })
      );
      
      setRecoloredSrcs(results);
    };
    
    processAll();
  }, [parts, options.skinRamp, options.hairRamp]);
  
  return recoloredSrcs;
}
