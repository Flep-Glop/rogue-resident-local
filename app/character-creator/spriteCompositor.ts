"use client";

import { PlayerCharacter, PartId, SkinRampId, HairRampId, ClothesRampId } from '@/app/store/characterStore';
import { 
  BASE_PALETTES, 
  SKIN_RAMPS, 
  HAIR_RAMPS, 
  CLOTHES_RAMPS,
} from './useRecoloredSprite';
import {
  WALK_ANIMATION_SEQUENCE,
  CLIMB_ANIMATION_SEQUENCE,
  HEAD_LAYER_IDS,
  TORSO_LAYER_IDS,
} from './useIdleAnimation';

// ============================================================================
// CONSTANTS
// ============================================================================

// Sprite dimensions
const SPRITE_WIDTH = 38;
const SPRITE_HEIGHT = 102;

// Total frames in the sprite sheet (matching CharacterSprite expectations)
// 0-3: Front idle, 4-7: Back idle, 8-11: Right idle, 12-15: Left idle
// 16-23: Right walk (8 frames), 24-31: Left walk (8 frames), 32-37: Climb (6 frames)
const TOTAL_FRAMES = 38;

// Idle animation frames (Y-offsets for breathing)
const IDLE_OFFSETS = [
  { head: 0, torso: 0 },   // Frame 0: Neutral
  { head: 1, torso: 0 },   // Frame 1: Head down 1px
  { head: 1, torso: 1 },   // Frame 2: Torso follows 1px
  { head: 0, torso: 0 },   // Frame 3: Return to neutral
];

// Character parts configuration (matching page.tsx)
const CHARACTER_PARTS: Array<{
  id: PartId;
  zIndex: number;
  partType: 'skin' | 'hair' | 'facialHair' | 'shirt' | 'pants' | 'shoes' | 'other';
  hasBack: boolean;
  hasSide: boolean;
  hasWalk: boolean;
  hasClimb: boolean;
}> = [
  { id: 'legs', zIndex: 0, partType: 'pants', hasBack: true, hasSide: true, hasWalk: true, hasClimb: true },
  { id: 'shoes', zIndex: 1, partType: 'shoes', hasBack: true, hasSide: true, hasWalk: true, hasClimb: true },
  { id: 'body', zIndex: 2, partType: 'shirt', hasBack: true, hasSide: true, hasWalk: false, hasClimb: true },
  { id: 'ears', zIndex: 3, partType: 'skin', hasBack: true, hasSide: true, hasWalk: false, hasClimb: false },
  { id: 'face', zIndex: 4, partType: 'skin', hasBack: true, hasSide: true, hasWalk: false, hasClimb: false },
  { id: 'nose', zIndex: 5, partType: 'skin', hasBack: false, hasSide: true, hasWalk: false, hasClimb: false },
  { id: 'eyes', zIndex: 6, partType: 'other', hasBack: false, hasSide: true, hasWalk: false, hasClimb: false },
  { id: 'eyebrows', zIndex: 7, partType: 'hair', hasBack: false, hasSide: true, hasWalk: false, hasClimb: false },
  { id: 'mouth', zIndex: 8, partType: 'skin', hasBack: false, hasSide: true, hasWalk: false, hasClimb: false },
  { id: 'facial-hair', zIndex: 9, partType: 'facialHair', hasBack: false, hasSide: true, hasWalk: false, hasClimb: false },
  { id: 'hair', zIndex: 10, partType: 'hair', hasBack: true, hasSide: true, hasWalk: false, hasClimb: false },
  { id: 'extras', zIndex: 11, partType: 'other', hasBack: true, hasSide: true, hasWalk: false, hasClimb: false },
];

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return [0, 0, 0];
  return [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16),
  ];
}

// Load an image and return it as an HTMLImageElement
async function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load: ${src}`));
    img.src = src;
  });
}

// Build color mappings for a part type
function getColorMappings(
  partType: string,
  skinRamp: SkinRampId,
  hairRamp: HairRampId,
  shirtRamp: ClothesRampId,
  pantsRamp: ClothesRampId
): Array<{ from: [number, number, number]; to: [number, number, number] }> {
  const mappings: Array<{ from: [number, number, number]; to: [number, number, number] }> = [];
  
  if (partType === 'skin') {
    const targetColors = SKIN_RAMPS[skinRamp].colors;
    BASE_PALETTES.skin.forEach((fromColor, index) => {
      mappings.push({ from: hexToRgb(fromColor), to: hexToRgb(targetColors[index + 1]) });
    });
  } else if (partType === 'hair') {
    const rampColors = HAIR_RAMPS[hairRamp].colors;
    if (rampColors.length === 4) {
      mappings.push({ from: hexToRgb(BASE_PALETTES.hair.static), to: hexToRgb(rampColors[0]) });
      BASE_PALETTES.hair.swappable.forEach((fromColor, index) => {
        mappings.push({ from: hexToRgb(fromColor), to: hexToRgb(rampColors[index + 1]) });
      });
    } else {
      BASE_PALETTES.hair.swappable.forEach((fromColor, index) => {
        mappings.push({ from: hexToRgb(fromColor), to: hexToRgb(rampColors[index]) });
      });
    }
  } else if (partType === 'facialHair') {
    const rampColors = HAIR_RAMPS[hairRamp].colors;
    if (rampColors.length === 4) {
      mappings.push({ from: hexToRgb(BASE_PALETTES.facialHair.static), to: hexToRgb(rampColors[0]) });
      const shifted = [rampColors[1], rampColors[1], rampColors[2]];
      BASE_PALETTES.facialHair.swappable.forEach((fromColor, index) => {
        mappings.push({ from: hexToRgb(fromColor), to: hexToRgb(shifted[index]) });
      });
    } else {
      const shifted = [rampColors[0], rampColors[0], rampColors[1]];
      BASE_PALETTES.facialHair.swappable.forEach((fromColor, index) => {
        mappings.push({ from: hexToRgb(fromColor), to: hexToRgb(shifted[index]) });
      });
    }
  } else if (partType === 'shirt') {
    const shirtColors = CLOTHES_RAMPS[shirtRamp].colors;
    BASE_PALETTES.shirt.forEach((fromColor, index) => {
      mappings.push({ from: hexToRgb(fromColor), to: hexToRgb(shirtColors[index]) });
    });
    // Also skin for exposed arms
    const skinColors = SKIN_RAMPS[skinRamp].colors;
    mappings.push({ from: hexToRgb(BASE_PALETTES.bodySkinShadow), to: hexToRgb(skinColors[0]) });
    BASE_PALETTES.skin.forEach((fromColor, index) => {
      mappings.push({ from: hexToRgb(fromColor), to: hexToRgb(skinColors[index + 1]) });
    });
  } else if (partType === 'pants') {
    const pantsColors = CLOTHES_RAMPS[pantsRamp].colors;
    BASE_PALETTES.pants.forEach((fromColor, index) => {
      mappings.push({ from: hexToRgb(fromColor), to: hexToRgb(pantsColors[index]) });
    });
  } else if (partType === 'shoes') {
    const pantsColors = CLOTHES_RAMPS[pantsRamp].colors;
    BASE_PALETTES.shoes.forEach((fromColor, index) => {
      mappings.push({ from: hexToRgb(fromColor), to: hexToRgb(pantsColors[index]) });
    });
  }
  
  return mappings;
}

// Apply color mappings to an image and return canvas
function recolorToCanvas(
  img: HTMLImageElement,
  mappings: Array<{ from: [number, number, number]; to: [number, number, number] }>
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0);
  
  if (mappings.length === 0) return canvas;
  
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    for (const m of mappings) {
      if (r === m.from[0] && g === m.from[1] && b === m.from[2]) {
        data[i] = m.to[0];
        data[i + 1] = m.to[1];
        data[i + 2] = m.to[2];
        break;
      }
    }
  }
  
  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

// ============================================================================
// SPRITE COMPOSITOR
// ============================================================================

interface CompositeFrame {
  direction: 'front' | 'back' | 'left' | 'right';
  idleFrame: number; // 0-3 for idle breathing
  walkFrame?: number; // 0-7 for walk animation sequence index
  climbFrame?: number; // 0-5 for climb animation
  flip?: boolean; // For climb alternation
}

// Define all 38 frames
const FRAME_DEFINITIONS: CompositeFrame[] = [
  // Front idle (0-3)
  { direction: 'front', idleFrame: 0 },
  { direction: 'front', idleFrame: 1 },
  { direction: 'front', idleFrame: 2 },
  { direction: 'front', idleFrame: 3 },
  // Back idle (4-7)
  { direction: 'back', idleFrame: 0 },
  { direction: 'back', idleFrame: 1 },
  { direction: 'back', idleFrame: 2 },
  { direction: 'back', idleFrame: 3 },
  // Right idle (8-11)
  { direction: 'right', idleFrame: 0 },
  { direction: 'right', idleFrame: 1 },
  { direction: 'right', idleFrame: 2 },
  { direction: 'right', idleFrame: 3 },
  // Left idle (12-15)
  { direction: 'left', idleFrame: 0 },
  { direction: 'left', idleFrame: 1 },
  { direction: 'left', idleFrame: 2 },
  { direction: 'left', idleFrame: 3 },
  // Right walk (16-23)
  { direction: 'right', idleFrame: 0, walkFrame: 0 },
  { direction: 'right', idleFrame: 1, walkFrame: 1 },
  { direction: 'right', idleFrame: 2, walkFrame: 2 },
  { direction: 'right', idleFrame: 3, walkFrame: 3 },
  { direction: 'right', idleFrame: 0, walkFrame: 4 },
  { direction: 'right', idleFrame: 1, walkFrame: 5 },
  { direction: 'right', idleFrame: 2, walkFrame: 6 },
  { direction: 'right', idleFrame: 3, walkFrame: 7 },
  // Left walk (24-31)
  { direction: 'left', idleFrame: 0, walkFrame: 0 },
  { direction: 'left', idleFrame: 1, walkFrame: 1 },
  { direction: 'left', idleFrame: 2, walkFrame: 2 },
  { direction: 'left', idleFrame: 3, walkFrame: 3 },
  { direction: 'left', idleFrame: 0, walkFrame: 4 },
  { direction: 'left', idleFrame: 1, walkFrame: 5 },
  { direction: 'left', idleFrame: 2, walkFrame: 6 },
  { direction: 'left', idleFrame: 3, walkFrame: 7 },
  // Climb (32-37)
  { direction: 'back', idleFrame: 0, climbFrame: 0, flip: false },
  { direction: 'back', idleFrame: 0, climbFrame: 1, flip: false },
  { direction: 'back', idleFrame: 0, climbFrame: 2, flip: false },
  { direction: 'back', idleFrame: 0, climbFrame: 3, flip: true },
  { direction: 'back', idleFrame: 0, climbFrame: 4, flip: true },
  { direction: 'back', idleFrame: 0, climbFrame: 5, flip: true },
];

/**
 * Generate a complete sprite sheet from character configuration
 * Returns a data URL of the sprite sheet (1444×102 PNG)
 */
export async function generateSpriteSheet(character: PlayerCharacter): Promise<string> {
  console.log('[SpriteCompositor] Starting sprite sheet generation...');
  
  // Create the output canvas
  const outputCanvas = document.createElement('canvas');
  outputCanvas.width = SPRITE_WIDTH * TOTAL_FRAMES;
  outputCanvas.height = SPRITE_HEIGHT;
  const outputCtx = outputCanvas.getContext('2d')!;
  
  // Cache for loaded and recolored sprites
  const spriteCache = new Map<string, HTMLCanvasElement>();
  
  // Helper to get sprite path
  const getSpritePath = (
    partId: PartId, 
    variant: number, 
    direction: 'front' | 'back' | 'left' | 'right',
    walkSuffix: string = '',
    climbSuffix: string = ''
  ): string => {
    let dirSuffix = '';
    if (direction === 'back') dirSuffix = '-back';
    else if (direction === 'left') dirSuffix = '-left';
    else if (direction === 'right') dirSuffix = '-right';
    
    return `/images/characters/${partId}-${variant}${dirSuffix}${climbSuffix}${walkSuffix}.png`;
  };
  
  // Load and cache a sprite with recoloring
  const loadAndRecolorSprite = async (
    path: string,
    partType: string
  ): Promise<HTMLCanvasElement | null> => {
    const cacheKey = `${path}|${character.skinRamp}|${character.hairRamp}|${character.shirtRamp}|${character.pantsRamp}`;
    
    if (spriteCache.has(cacheKey)) {
      return spriteCache.get(cacheKey)!;
    }
    
    try {
      const img = await loadImage(path);
      const mappings = getColorMappings(
        partType,
        character.skinRamp,
        character.hairRamp,
        character.shirtRamp,
        character.pantsRamp
      );
      const canvas = recolorToCanvas(img, mappings);
      spriteCache.set(cacheKey, canvas);
      return canvas;
    } catch {
      // Sprite doesn't exist for this direction/variant
      return null;
    }
  };
  
  // Render a single composite frame
  const renderFrame = async (frameIndex: number, frameDef: CompositeFrame) => {
    const frameX = frameIndex * SPRITE_WIDTH;
    
    // Collect all parts to render, sorted by z-index
    const partsToRender: Array<{
      canvas: HTMLCanvasElement;
      zIndex: number;
      yOffset: number;
      flip: boolean;
    }> = [];
    
    for (const part of CHARACTER_PARTS) {
      const variant = character.parts[part.id];
      if (variant === 0) continue; // Part is "None"
      
      // Determine if part is visible in this direction
      if (frameDef.direction === 'back' && !part.hasBack) continue;
      if ((frameDef.direction === 'left' || frameDef.direction === 'right') && !part.hasSide) continue;
      
      // Determine sprite path based on animation state
      let walkSuffix = '';
      let climbSuffix = '';
      let useDirection = frameDef.direction;
      
      // Walk animation (only for legs/shoes when walking sideways)
      if (frameDef.walkFrame !== undefined && part.hasWalk) {
        const walkSpriteIndex = WALK_ANIMATION_SEQUENCE[frameDef.walkFrame];
        if (walkSpriteIndex > 0) {
          walkSuffix = `-w${walkSpriteIndex}`;
        }
      }
      
      // Climb animation
      if (frameDef.climbFrame !== undefined && part.hasClimb) {
        const climbConfig = CLIMB_ANIMATION_SEQUENCE[frameDef.climbFrame];
        let suffix = '';
        if (part.id === 'body') suffix = climbConfig.body;
        else if (part.id === 'legs') suffix = climbConfig.legs;
        else if (part.id === 'shoes') suffix = climbConfig.shoes;
        
        if (suffix !== '') {
          climbSuffix = `-${suffix}`;
        }
      }
      
      const spritePath = getSpritePath(part.id, variant, useDirection, walkSuffix, climbSuffix);
      const canvas = await loadAndRecolorSprite(spritePath, part.partType);
      
      if (!canvas) continue;
      
      // Calculate Y offset for idle breathing
      let yOffset = 0;
      if (frameDef.climbFrame === undefined) {
        const idleOffsets = IDLE_OFFSETS[frameDef.idleFrame];
        if ((HEAD_LAYER_IDS as readonly string[]).includes(part.id)) {
          yOffset = idleOffsets.head;
        } else if ((TORSO_LAYER_IDS as readonly string[]).includes(part.id)) {
          yOffset = idleOffsets.torso;
        }
      }
      
      partsToRender.push({
        canvas,
        zIndex: part.zIndex,
        yOffset,
        // Only flip parts that have climbing sprites (body, legs, shoes)
        // Hair, extras, ears, etc. stay static to maintain visual consistency
        flip: part.hasClimb && (frameDef.flip ?? false),
      });
    }
    
    // Sort by z-index and render
    partsToRender.sort((a, b) => a.zIndex - b.zIndex);
    
    for (const { canvas, yOffset, flip } of partsToRender) {
      if (flip) {
        // Flip horizontally for climb alternation
        outputCtx.save();
        outputCtx.translate(frameX + SPRITE_WIDTH, 0);
        outputCtx.scale(-1, 1);
        outputCtx.drawImage(canvas, 0, yOffset);
        outputCtx.restore();
      } else {
        outputCtx.drawImage(canvas, frameX, yOffset);
      }
    }
  };
  
  // Render all 38 frames
  for (let i = 0; i < FRAME_DEFINITIONS.length; i++) {
    await renderFrame(i, FRAME_DEFINITIONS[i]);
  }
  
  console.log('[SpriteCompositor] Sprite sheet generation complete');
  return outputCanvas.toDataURL('image/png');
}
