"use client";

import React, { useState, useCallback, useEffect, useRef } from 'react';
import styled, { keyframes } from 'styled-components';
import { useGameStore } from '@/app/store/gameStore';
import { useCharacterStore, PlayerCharacter, PartId, VoiceType, DEFAULT_CHARACTER } from '@/app/store/characterStore';
import { generateSpriteSheet } from '@/app/character-creator/spriteCompositor';
import { useIdleAnimation, PARTS_WITH_WALK_FRAMES, PARTS_WITH_CLIMB_C1, PARTS_WITH_CLIMB_C2 } from '@/app/character-creator/useIdleAnimation';
import { 
  SKIN_RAMPS, 
  HAIR_RAMPS, 
  CLOTHES_RAMPS,
  SkinRampId, 
  HairRampId,
  ClothesRampId,
  BASE_PALETTES 
} from '@/app/character-creator/useRecoloredSprite';
import { useSound } from '@/app/audio/useAudio';

// ============================================================================
// CONSTANTS
// ============================================================================

const INTERNAL_WIDTH = 640;
const INTERNAL_HEIGHT = 360;

// Character parts configuration
interface CharacterPart {
  id: PartId;
  label: string;
  zIndex: number;
  variants: number;
  allowNone: boolean;
  partType: 'skin' | 'hair' | 'facialHair' | 'shirt' | 'pants' | 'shoes' | 'other';
  backVariants: number[];
  sideVariants: number[];
}

const CHARACTER_PARTS: CharacterPart[] = [
  { id: 'legs', label: 'Legs', zIndex: 0, variants: 2, allowNone: false, partType: 'pants', backVariants: [1, 2], sideVariants: [1, 2] },
  { id: 'shoes', label: 'Shoes', zIndex: 1, variants: 2, allowNone: false, partType: 'shoes', backVariants: [1, 2], sideVariants: [1, 2] },
  { id: 'body', label: 'Body', zIndex: 2, variants: 2, allowNone: false, partType: 'shirt', backVariants: [1, 2], sideVariants: [1, 2] },
  { id: 'ears', label: 'Ears', zIndex: 3, variants: 3, allowNone: false, partType: 'skin', backVariants: [1, 2, 3], sideVariants: [1, 2, 3] },
  { id: 'face', label: 'Face', zIndex: 4, variants: 2, allowNone: false, partType: 'skin', backVariants: [1, 2], sideVariants: [1, 2] },
  { id: 'nose', label: 'Nose', zIndex: 5, variants: 2, allowNone: false, partType: 'skin', backVariants: [], sideVariants: [1, 2] },
  { id: 'eyes', label: 'Eyes', zIndex: 6, variants: 6, allowNone: false, partType: 'other', backVariants: [], sideVariants: [1, 2, 3, 4, 5, 6] },
  { id: 'eyebrows', label: 'Brows', zIndex: 7, variants: 3, allowNone: false, partType: 'hair', backVariants: [], sideVariants: [1, 2, 3] },
  { id: 'mouth', label: 'Mouth', zIndex: 8, variants: 3, allowNone: false, partType: 'skin', backVariants: [], sideVariants: [1, 2, 3] },
  { id: 'facial-hair', label: 'Facial Hair', zIndex: 9, variants: 3, allowNone: true, partType: 'facialHair', backVariants: [], sideVariants: [1, 2, 3] },
  { id: 'hair', label: 'Hair', zIndex: 10, variants: 7, allowNone: true, partType: 'hair', backVariants: [1, 2, 3, 4, 5, 6, 7], sideVariants: [1, 2, 3, 4, 5, 6, 7] },
  { id: 'extras', label: 'Extras', zIndex: 11, variants: 3, allowNone: true, partType: 'other', backVariants: [1, 2, 3], sideVariants: [1, 2] },
];

const LOCKABLE_PARTS: PartId[] = ['facial-hair', 'extras'];

// Parts that are auto-linked to body selection (hidden from UI)
const BODY_LINKED_PARTS: PartId[] = ['legs', 'shoes'];

// Parts that have climbing animation sprites and should flip during climb animation
// Only these parts should have the horizontal flip applied - all others stay static
const CLIMBING_FLIP_PARTS: PartId[] = ['body', 'legs', 'shoes'];

// Sprite dimensions
const SPRITE_WIDTH = 38;
const SPRITE_HEIGHT = 102;
const SPRITE_SCALE = 2;

// ============================================================================
// STYLED COMPONENTS
// ============================================================================

const FullScreenContainer = styled.div`
  width: 100vw;
  height: 100vh;
  position: fixed;
  top: 0;
  left: 0;
  background: #0a0a12;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
`;

const GameViewport = styled.div<{ $scale: number }>`
  width: ${INTERNAL_WIDTH}px;
  height: ${INTERNAL_HEIGHT}px;
  position: relative;
  background: linear-gradient(180deg, #1a1a2e 0%, #0f0f1a 100%);
  transform-origin: center;
  transform: scale(${props => props.$scale});
  image-rendering: pixelated;
  overflow: hidden;
`;

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const Title = styled.h1`
  position: absolute;
  top: 20px;
  left: 0;
  right: 0;
  text-align: center;
  font-family: 'Aseprite', monospace;
  font-size: 16px;
  color: #fcd34d;
  text-shadow: 2px 2px 0 #000;
  margin: 0;
  animation: ${fadeIn} 0.5s ease-out;
`;

const ContentArea = styled.div`
  position: absolute;
  top: 50px;
  left: 20px;
  right: 20px;
  bottom: 50px;
  display: flex;
  gap: 20px;
`;

// Left panel - Character preview
const PreviewPanel = styled.div`
  width: 160px;
  background: rgba(0, 0, 0, 0.3);
  border: 2px solid #394a50;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px;
`;

const PreviewTitle = styled.div`
  font-family: 'Aseprite', monospace;
  font-size: 10px;
  color: #a8b5b2;
  margin-bottom: 8px;
`;

const SpriteStack = styled.div`
  position: relative;
  width: ${SPRITE_WIDTH * SPRITE_SCALE}px;
  height: ${SPRITE_HEIGHT * SPRITE_SCALE}px;
  flex-shrink: 0;
  image-rendering: pixelated;
`;

const SpriteLayer = styled.img<{ $zIndex: number; $yOffset?: number; $flip?: boolean }>`
  position: absolute;
  top: ${props => props.$yOffset ?? 0}px;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: ${props => props.$zIndex};
  ${props => props.$flip && 'transform: scaleX(-1);'}
  image-rendering: pixelated;
`;

const DirectionHint = styled.div`
  font-family: 'Aseprite', monospace;
  font-size: 8px;
  color: #577277;
  margin-top: 8px;
  text-align: center;
`;

const NameInputContainer = styled.div`
  margin-top: 12px;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const NameLabel = styled.label`
  font-family: 'Aseprite', monospace;
  font-size: 9px;
  color: #a8b5b2;
  margin-bottom: 4px;
`;

const NameInput = styled.input`
  width: 120px;
  padding: 6px 8px;
  font-family: 'Aseprite', monospace;
  font-size: 10px;
  color: #fcd34d;
  background: #151d28;
  border: 2px solid #394a50;
  text-align: center;
  outline: none;
  
  &:focus {
    border-color: #577277;
  }
  
  &::placeholder {
    color: #577277;
  }
`;

// Right panel - Options
const OptionsPanel = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
  overflow: hidden;
`;

const OptionsRow = styled.div`
  display: flex;
  gap: 10px;
  flex: 1;
  min-height: 0;
`;

const OptionSection = styled.div<{ $narrow?: boolean }>`
  ${props => props.$narrow ? 'width: 120px; flex-shrink: 0;' : 'flex: 1;'}
  background: rgba(0, 0, 0, 0.3);
  border: 2px solid #394a50;
  padding: 8px;
  overflow-y: auto;
  
  &::-webkit-scrollbar {
    width: 4px;
  }
  &::-webkit-scrollbar-track {
    background: #1a1a2e;
  }
  &::-webkit-scrollbar-thumb {
    background: #394a50;
  }
`;

const SectionTitle = styled.div`
  font-family: 'Aseprite', monospace;
  font-size: 10px;
  color: #fcd34d;
  margin-bottom: 6px;
  padding-bottom: 2px;
  border-bottom: 1px solid #394a50;
`;

const SelectionRow = styled.div<{ $highlighted?: boolean }>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 2px 4px;
  margin: 0 -4px;
  background: ${props => props.$highlighted ? 'rgba(252, 211, 77, 0.2)' : 'transparent'};
  border-left: ${props => props.$highlighted ? '2px solid #fcd34d' : '2px solid transparent'};
`;

const PartLabel = styled.span`
  font-family: 'Aseprite', monospace;
  font-size: 9px;
  color: #c7cfcc;
`;

const SelectionControls = styled.div`
  display: flex;
  align-items: center;
  gap: 1px;
`;

const ArrowButton = styled.button`
  width: 14px;
  height: 14px;
  background: #151d28;
  border: 1px solid #394a50;
  color: #a8b5b2;
  font-size: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Aseprite', monospace;
  
  &:hover {
    background: #394a50;
    color: #fcd34d;
  }
`;

const VariantDisplay = styled.span`
  font-family: 'Aseprite', monospace;
  font-size: 8px;
  color: #fcd34d;
  min-width: 20px;
  text-align: center;
`;

const ColorLabel = styled.div<{ $highlighted?: boolean }>`
  font-family: 'Aseprite', monospace;
  font-size: 9px;
  color: ${props => props.$highlighted ? '#fcd34d' : '#c7cfcc'};
  margin-top: 4px;
  margin-bottom: 2px;
  padding: 2px 4px;
  margin-left: -4px;
  margin-right: -4px;
  background: ${props => props.$highlighted ? 'rgba(252, 211, 77, 0.2)' : 'transparent'};
  border-left: ${props => props.$highlighted ? '2px solid #fcd34d' : '2px solid transparent'};
`;

const ColorRampRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 2px;
`;

const ColorRampButton = styled.button<{ $selected: boolean }>`
  display: flex;
  padding: 2px;
  background: ${props => props.$selected ? '#394a50' : '#151d28'};
  border: 1px solid ${props => props.$selected ? '#fcd34d' : '#394a50'};
  cursor: pointer;
  
  &:hover {
    border-color: #577277;
  }
`;

const ColorSwatch = styled.div<{ $color: string }>`
  width: 10px;
  height: 10px;
  background: ${props => props.$color};
`;

// Voice selector
const VoiceButtonRow = styled.div`
  display: flex;
  gap: 6px;
  margin-top: 2px;
`;

const VoiceButton = styled.button<{ $selected: boolean }>`
  flex: 1;
  padding: 4px 8px;
  background: ${props => props.$selected ? '#394a50' : '#151d28'};
  border: 1px solid ${props => props.$selected ? '#fcd34d' : '#394a50'};
  color: ${props => props.$selected ? '#fcd34d' : '#a8b5b2'};
  font-family: 'Aseprite', monospace;
  font-size: 8px;
  cursor: pointer;
  
  &:hover {
    border-color: #577277;
  }
`;

// Bottom buttons
const ButtonRow = styled.div`
  position: absolute;
  bottom: 15px;
  left: 20px;
  right: 20px;
  display: flex;
  justify-content: space-between;
  gap: 10px;
`;

const ActionButton = styled.button<{ $primary?: boolean; $highlighted?: boolean }>`
  padding: 8px 20px;
  background: ${props => props.$highlighted ? (props.$primary ? '#8b5cf6' : '#394a50') : (props.$primary ? '#7c3aed' : '#151d28')};
  border: 2px solid ${props => props.$highlighted ? '#fcd34d' : (props.$primary ? '#a78bfa' : '#394a50')};
  color: ${props => props.$primary ? '#fcd34d' : '#a8b5b2'};
  font-family: 'Aseprite', monospace;
  font-size: 11px;
  transform: ${props => props.$highlighted ? 'translateY(-1px)' : 'none'};
  
  &:disabled {
    opacity: 0.5;
  }
`;

// Fade overlay for transitions
const FadeOverlay = styled.div<{ $visible: boolean }>`
  position: absolute;
  inset: 0;
  background: black;
  opacity: ${props => props.$visible ? 1 : 0};
  transition: opacity 0.8s ease-in-out;
  pointer-events: ${props => props.$visible ? 'all' : 'none'};
  z-index: 100;
`;

const LoadingText = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-family: 'Aseprite', monospace;
  font-size: 12px;
  color: #fcd34d;
`;

// ============================================================================
// RECOLORING UTILITIES
// ============================================================================

function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return [0, 0, 0];
  return [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)];
}

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
      if (!ctx) { reject(new Error('No context')); return; }
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      const mappings = colorMappings.map(m => ({ from: hexToRgb(m.from), to: hexToRgb(m.to) }));
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i], g = data[i + 1], b = data[i + 2];
        for (const m of mappings) {
          if (r === m.from[0] && g === m.from[1] && b === m.from[2]) {
            data[i] = m.to[0]; data[i + 1] = m.to[1]; data[i + 2] = m.to[2];
            break;
          }
        }
      }
      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => reject(new Error(`Failed to load: ${imageSrc}`));
    img.src = imageSrc;
  });
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const CharacterCreatorScreen: React.FC = () => {
  const { play: playSound } = useSound();
  const startFromCharacterCreator = useGameStore(state => state.startFromCharacterCreator);
  const { setCharacter, setSpriteSheet, setHasCreatedCharacter } = useCharacterStore();
  
  // Character state
  const [characterName, setCharacterName] = useState('');
  const [selections, setSelections] = useState<Record<PartId, number>>(DEFAULT_CHARACTER.parts);
  const [skinRamp, setSkinRamp] = useState<SkinRampId>('pale2');
  const [hairRamp, setHairRamp] = useState<HairRampId>('black');
  const [shirtRamp, setShirtRamp] = useState<ClothesRampId>('black');
  const [pantsRamp, setPantsRamp] = useState<ClothesRampId>('black');
  const [voiceType, setVoiceType] = useState<VoiceType>('feminine');
  const [lockedToNone, setLockedToNone] = useState<Set<PartId>>(new Set());
  
  // Menu navigation state
  // Sections: 0 = parts, 1 = colors, 2 = bottom buttons
  const [menuSection, setMenuSection] = useState<0 | 1 | 2>(0);
  const [menuRow, setMenuRow] = useState(0); // Which row within current section
  const nameInputRef = useRef<HTMLInputElement>(null);
  
  // Recolored sprites cache
  const [recoloredSprites, setRecoloredSprites] = useState<Record<string, string>>({});
  const [isRecoloring, setIsRecoloring] = useState(true);
  
  // Animation
  const { getLayerOffset, direction, setDirection, getWalkSpriteSuffix, getClimbSpriteSuffix, shouldFlipClimb, isWalking, setIsWalking, isClimbing, setIsClimbing } = useIdleAnimation();
  
  // Transition state
  const [isFading, setIsFading] = useState(true); // Start faded in (black)
  const [isGenerating, setIsGenerating] = useState(false);
  const fadeTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Viewport scaling - calculate scale to fit 640x360 to window while maintaining aspect ratio
  const [viewportScale, setViewportScale] = useState(1);
  
  useEffect(() => {
    const calculateScale = () => {
      const scaleX = window.innerWidth / INTERNAL_WIDTH;
      const scaleY = window.innerHeight / INTERNAL_HEIGHT;
      setViewportScale(Math.min(scaleX, scaleY));
    };
    
    calculateScale();
    window.addEventListener('resize', calculateScale);
    return () => window.removeEventListener('resize', calculateScale);
  }, []);
  
  // Fade in on mount
  useEffect(() => {
    fadeTimerRef.current = setTimeout(() => setIsFading(false), 100);
    return () => { if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current); };
  }, []);
  
  // WASD controls for sprite preview (direction/walking/climbing)
  const climbTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat || isGenerating) return;
      const key = e.key.toLowerCase();
      switch (key) {
        case 'w': 
          setDirection('back'); 
          setIsWalking(false);
          // Start climb timer - if held for 200ms, trigger climbing
          if (!climbTimerRef.current) {
            climbTimerRef.current = setTimeout(() => {
              setIsClimbing(true);
            }, 200);
          }
          break;
        case 's': setDirection('front'); setIsWalking(false); setIsClimbing(false); break;
        case 'a': setDirection('left'); setIsWalking(true); setIsClimbing(false); break;
        case 'd': setDirection('right'); setIsWalking(true); setIsClimbing(false); break;
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key === 'a' || key === 'd') setIsWalking(false);
      if (key === 'w') {
        // Clear climb timer and stop climbing
        if (climbTimerRef.current) {
          clearTimeout(climbTimerRef.current);
          climbTimerRef.current = null;
        }
        setIsClimbing(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (climbTimerRef.current) {
        clearTimeout(climbTimerRef.current);
        climbTimerRef.current = null;
      }
    };
  }, [setDirection, setIsWalking, setIsClimbing, isGenerating]);
  
  // Recolor sprites when colors change
  useEffect(() => {
    let cancelled = false;
    setIsRecoloring(true);
    
    const recolorAll = async () => {
      const newRecolored: Record<string, string> = {};
      for (const part of CHARACTER_PARTS) {
        const variant = selections[part.id];
        if (variant === 0) continue;
        const spriteSources = [`/images/characters/${part.id}-${variant}.png`];
        if (part.backVariants.includes(variant)) {
          spriteSources.push(`/images/characters/${part.id}-${variant}-back.png`);
          if ((PARTS_WITH_CLIMB_C1 as readonly string[]).includes(part.id)) {
            spriteSources.push(`/images/characters/${part.id}-${variant}-back-c1.png`);
          }
          if ((PARTS_WITH_CLIMB_C2 as readonly string[]).includes(part.id)) {
            spriteSources.push(`/images/characters/${part.id}-${variant}-back-c2.png`);
          }
        }
        if (part.sideVariants.includes(variant)) {
          spriteSources.push(`/images/characters/${part.id}-${variant}-left.png`);
          spriteSources.push(`/images/characters/${part.id}-${variant}-right.png`);
          if ((PARTS_WITH_WALK_FRAMES as readonly string[]).includes(part.id)) {
            for (let w = 1; w <= 4; w++) {
              spriteSources.push(`/images/characters/${part.id}-${variant}-left-w${w}.png`);
              spriteSources.push(`/images/characters/${part.id}-${variant}-right-w${w}.png`);
            }
          }
        }
        for (const src of spriteSources) {
          const cacheKey = `${src}|${skinRamp}|${hairRamp}|${shirtRamp}|${pantsRamp}`;
          if (recoloredSprites[cacheKey]) { newRecolored[cacheKey] = recoloredSprites[cacheKey]; continue; }
          const mappings: Array<{ from: string; to: string }> = [];
          if (part.partType === 'skin') {
            const targetColors = SKIN_RAMPS[skinRamp].colors;
            BASE_PALETTES.skin.forEach((fromColor, index) => { mappings.push({ from: fromColor, to: targetColors[index + 1] }); });
          } else if (part.partType === 'hair') {
            const targetColors = HAIR_RAMPS[hairRamp].colors;
            BASE_PALETTES.hair.swappable.forEach((fromColor, index) => { mappings.push({ from: fromColor, to: targetColors[index] }); });
          } else if (part.partType === 'facialHair') {
            const targetColors = HAIR_RAMPS[hairRamp].colors;
            const shiftedColors = [targetColors[0], targetColors[0], targetColors[1]];
            BASE_PALETTES.facialHair.swappable.forEach((fromColor, index) => { mappings.push({ from: fromColor, to: shiftedColors[index] }); });
          } else if (part.partType === 'shirt') {
            const shirtColors = CLOTHES_RAMPS[shirtRamp].colors;
            BASE_PALETTES.shirt.forEach((fromColor, index) => { mappings.push({ from: fromColor, to: shirtColors[index] }); });
            const skinColors = SKIN_RAMPS[skinRamp].colors;
            mappings.push({ from: BASE_PALETTES.bodySkinShadow, to: skinColors[0] });
            BASE_PALETTES.skin.forEach((fromColor, index) => { mappings.push({ from: fromColor, to: skinColors[index + 1] }); });
          } else if (part.partType === 'pants') {
            const pantsColors = CLOTHES_RAMPS[pantsRamp].colors;
            BASE_PALETTES.pants.forEach((fromColor, index) => { mappings.push({ from: fromColor, to: pantsColors[index] }); });
          } else if (part.partType === 'shoes') {
            const pantsColors = CLOTHES_RAMPS[pantsRamp].colors;
            BASE_PALETTES.shoes.forEach((fromColor, index) => { mappings.push({ from: fromColor, to: pantsColors[index] }); });
          }
          if (mappings.length > 0) {
            try { newRecolored[cacheKey] = await recolorImage(src, mappings); } 
            catch { newRecolored[cacheKey] = src; }
          } else { newRecolored[cacheKey] = src; }
        }
      }
      if (!cancelled) {
        setRecoloredSprites(prev => ({ ...prev, ...newRecolored }));
        setIsRecoloring(false);
      }
    };
    recolorAll();
    
    return () => { cancelled = true; };
  }, [selections, skinRamp, hairRamp, shirtRamp, pantsRamp]);
  
  const cycleVariant = useCallback((partId: PartId, dir: 1 | -1) => {
    playSound('ui_hover');
    const part = CHARACTER_PARTS.find(p => p.id === partId);
    if (!part) return;
    setSelections(prev => {
      const current = prev[partId];
      let next = current + dir;
      const min = part.allowNone ? 0 : 1;
      const max = part.variants;
      if (next < min) next = max;
      if (next > max) next = min;
      if (LOCKABLE_PARTS.includes(partId)) {
        if (next === 0) setLockedToNone(p => new Set([...p, partId]));
        else setLockedToNone(p => { const n = new Set(p); n.delete(partId); return n; });
      }
      // Auto-link legs and shoes to body selection
      if (partId === 'body') {
        return { ...prev, [partId]: next, legs: next, shoes: next };
      }
      return { ...prev, [partId]: next };
    });
  }, [playSound]);
  
  const getVariantDisplay = (part: typeof CHARACTER_PARTS[number], variant: number) => {
    if (part.allowNone && variant === 0) return 'None';
    const total = part.allowNone ? part.variants + 1 : part.variants;
    const current = part.allowNone ? variant + 1 : variant;
    return `${current}/${total}`;
  };
  
  const randomizeAll = useCallback(() => {
    playSound('ui_confirm');
    const randomized: Record<PartId, number> = {} as Record<PartId, number>;
    // First, pick a random body variant (legs and shoes will match)
    const bodyPart = CHARACTER_PARTS.find(p => p.id === 'body')!;
    const bodyVariant = Math.floor(Math.random() * bodyPart.variants) + 1;
    CHARACTER_PARTS.forEach(part => {
      // Skip body-linked parts - they'll be set to match body
      if (BODY_LINKED_PARTS.includes(part.id)) {
        randomized[part.id] = bodyVariant;
        return;
      }
      if (part.id === 'body') {
        randomized[part.id] = bodyVariant;
        return;
      }
      if (lockedToNone.has(part.id)) { randomized[part.id] = 0; return; }
      const min = part.allowNone ? 0 : 1;
      const range = part.allowNone ? part.variants + 1 : part.variants;
      randomized[part.id] = Math.floor(Math.random() * range) + min;
    });
    setSelections(randomized);
    const skinKeys = Object.keys(SKIN_RAMPS) as SkinRampId[];
    const hairKeys = Object.keys(HAIR_RAMPS) as HairRampId[];
    const clothesKeys = Object.keys(CLOTHES_RAMPS) as ClothesRampId[];
    setSkinRamp(skinKeys[Math.floor(Math.random() * skinKeys.length)]);
    setHairRamp(hairKeys[Math.floor(Math.random() * hairKeys.length)]);
    setShirtRamp(clothesKeys[Math.floor(Math.random() * clothesKeys.length)]);
    setPantsRamp(clothesKeys[Math.floor(Math.random() * clothesKeys.length)]);
    // Randomize voice type
    setVoiceType(Math.random() < 0.5 ? 'feminine' : 'masculine');
  }, [lockedToNone, playSound]);
  
  const resetAll = useCallback(() => {
    playSound('ui_decline');
    setCharacterName('');
    setSelections(DEFAULT_CHARACTER.parts);
    setSkinRamp('pale2');
    setHairRamp('black');
    setShirtRamp('black');
    setPantsRamp('black');
    setVoiceType('feminine');
    setLockedToNone(new Set());
  }, [playSound]);
  
  const handleContinue = useCallback(async () => {
    playSound('ui_confirm');
    setIsGenerating(true);
    setIsFading(true);
    
    // Build character config
    const character: PlayerCharacter = {
      name: characterName,
      parts: selections,
      skinRamp,
      hairRamp,
      shirtRamp,
      pantsRamp,
      voiceType,
    };
    
    // Generate sprite sheet
    try {
      const spriteSheet = await generateSpriteSheet(character);
      setCharacter(character);
      setSpriteSheet(spriteSheet);
      setHasCreatedCharacter(true);
      
      // Wait for fade to black, then start game
      setTimeout(() => {
        startFromCharacterCreator();
      }, 800);
    } catch (err) {
      console.error('Failed to generate sprite sheet:', err);
      setIsGenerating(false);
      setIsFading(false);
    }
  }, [characterName, selections, skinRamp, hairRamp, shirtRamp, pantsRamp, playSound, setCharacter, setSpriteSheet, setHasCreatedCharacter, startFromCharacterCreator]);
  
  // Menu navigation constants
  const visibleParts = CHARACTER_PARTS.filter(part => !BODY_LINKED_PARTS.includes(part.id));
  const skinRampKeys = Object.keys(SKIN_RAMPS) as SkinRampId[];
  const hairRampKeys = Object.keys(HAIR_RAMPS) as HairRampId[];
  const clothesRampKeys = Object.keys(CLOTHES_RAMPS) as ClothesRampId[];
  // Color rows: 0=skin, 1=hair, 2=shirt, 3=pants, 4=voice
  const colorRowCount = 5;
  // Bottom buttons: 0=reset, 1=randomize, 2=continue
  const bottomButtonCount = 3;
  
  // Arrow key navigation for menu + X to confirm
  useEffect(() => {
    const handleMenuKeyDown = (e: KeyboardEvent) => {
      if (isGenerating) return;
      
      // Skip if name input is focused (let user type)
      if (document.activeElement === nameInputRef.current) {
        if (e.key === 'Escape') {
          nameInputRef.current?.blur();
          e.preventDefault();
        }
        return;
      }
      
      const key = e.key;
      
      // Navigation
      if (key === 'ArrowUp') {
        e.preventDefault();
        if (menuSection === 0) {
          // Parts section
          setMenuRow(prev => Math.max(0, prev - 1));
        } else if (menuSection === 1) {
          // Colors section
          setMenuRow(prev => Math.max(0, prev - 1));
        }
        playSound('ui_hover');
      } else if (key === 'ArrowDown') {
        e.preventDefault();
        if (menuSection === 0) {
          setMenuRow(prev => Math.min(visibleParts.length - 1, prev + 1));
        } else if (menuSection === 1) {
          setMenuRow(prev => Math.min(colorRowCount - 1, prev + 1));
        }
        playSound('ui_hover');
      } else if (key === 'ArrowLeft') {
        e.preventDefault();
        if (menuSection === 0) {
          // Cycle variant left
          const part = visibleParts[menuRow];
          if (part) cycleVariant(part.id, -1);
        } else if (menuSection === 1) {
          // Cycle color left
          playSound('ui_hover');
          if (menuRow === 0) {
            const idx = skinRampKeys.indexOf(skinRamp);
            setSkinRamp(skinRampKeys[(idx - 1 + skinRampKeys.length) % skinRampKeys.length]);
          } else if (menuRow === 1) {
            const idx = hairRampKeys.indexOf(hairRamp);
            setHairRamp(hairRampKeys[(idx - 1 + hairRampKeys.length) % hairRampKeys.length]);
          } else if (menuRow === 2) {
            const idx = clothesRampKeys.indexOf(shirtRamp);
            setShirtRamp(clothesRampKeys[(idx - 1 + clothesRampKeys.length) % clothesRampKeys.length]);
          } else if (menuRow === 3) {
            const idx = clothesRampKeys.indexOf(pantsRamp);
            setPantsRamp(clothesRampKeys[(idx - 1 + clothesRampKeys.length) % clothesRampKeys.length]);
          } else if (menuRow === 4) {
            setVoiceType(voiceType === 'feminine' ? 'masculine' : 'feminine');
          }
        } else if (menuSection === 2) {
          // Navigate between bottom buttons
          setMenuRow(prev => Math.max(0, prev - 1));
          playSound('ui_hover');
        }
      } else if (key === 'ArrowRight') {
        e.preventDefault();
        if (menuSection === 0) {
          // Cycle variant right
          const part = visibleParts[menuRow];
          if (part) cycleVariant(part.id, 1);
        } else if (menuSection === 1) {
          // Cycle color right
          playSound('ui_hover');
          if (menuRow === 0) {
            const idx = skinRampKeys.indexOf(skinRamp);
            setSkinRamp(skinRampKeys[(idx + 1) % skinRampKeys.length]);
          } else if (menuRow === 1) {
            const idx = hairRampKeys.indexOf(hairRamp);
            setHairRamp(hairRampKeys[(idx + 1) % hairRampKeys.length]);
          } else if (menuRow === 2) {
            const idx = clothesRampKeys.indexOf(shirtRamp);
            setShirtRamp(clothesRampKeys[(idx + 1) % clothesRampKeys.length]);
          } else if (menuRow === 3) {
            const idx = clothesRampKeys.indexOf(pantsRamp);
            setPantsRamp(clothesRampKeys[(idx + 1) % clothesRampKeys.length]);
          } else if (menuRow === 4) {
            setVoiceType(voiceType === 'feminine' ? 'masculine' : 'feminine');
          }
        } else if (menuSection === 2) {
          // Navigate between bottom buttons
          setMenuRow(prev => Math.min(bottomButtonCount - 1, prev + 1));
          playSound('ui_hover');
        }
      } else if (key === 'Tab' || key === 'Enter') {
        // Tab/Enter cycles between sections
        e.preventDefault();
        if (key === 'Tab' && e.shiftKey) {
          setMenuSection(prev => prev === 0 ? 2 : prev === 1 ? 0 : 1);
        } else {
          setMenuSection(prev => prev === 0 ? 1 : prev === 1 ? 2 : 0);
        }
        setMenuRow(0);
        playSound('ui_hover');
      } else if (key === 'x' || key === 'X') {
        e.preventDefault();
        // X activates current selection
        if (menuSection === 2) {
          // Bottom buttons
          if (menuRow === 0) resetAll();
          else if (menuRow === 1) randomizeAll();
          else if (menuRow === 2 && characterName.trim()) handleContinue();
          else if (menuRow === 2 && !characterName.trim()) {
            playSound('ui_denied');
          }
        }
      }
    };
    
    window.addEventListener('keydown', handleMenuKeyDown);
    return () => window.removeEventListener('keydown', handleMenuKeyDown);
  }, [isGenerating, menuSection, menuRow, visibleParts, skinRamp, hairRamp, shirtRamp, pantsRamp, voiceType, cycleVariant, resetAll, randomizeAll, handleContinue, characterName, playSound]);
  
  // Variant visibility helpers
  const variantHasBack = (partId: string, variant: number): boolean => {
    const part = CHARACTER_PARTS.find(p => p.id === partId);
    return part ? part.backVariants.includes(variant) : false;
  };
  const variantHasSide = (partId: string, variant: number): boolean => {
    const part = CHARACTER_PARTS.find(p => p.id === partId);
    return part ? part.sideVariants.includes(variant) : false;
  };
  const isPartVisibleInDirection = (partId: string, variant: number): boolean => {
    if (direction === 'front') return true;
    if (direction === 'back') return variantHasBack(partId, variant);
    return variantHasSide(partId, variant);
  };
  const getPartZIndex = (partId: string, baseZIndex: number): number => {
    if ((direction === 'left' || direction === 'right') && partId === 'ears') return 9;
    return baseZIndex;
  };
  
  const getSpriteSrc = (partId: string, variant: number, partType: string): string | null => {
    const walkSuffix = getWalkSpriteSuffix(partId);
    const climbSuffix = getClimbSpriteSuffix(partId);
    let filename: string;
    if (direction === 'back' && variantHasBack(partId, variant)) {
      filename = `${partId}-${variant}-back${climbSuffix}.png`;
    } else if (direction === 'left' && variantHasSide(partId, variant)) {
      filename = `${partId}-${variant}-left${walkSuffix}.png`;
    } else if (direction === 'right' && variantHasSide(partId, variant)) {
      filename = `${partId}-${variant}-right${walkSuffix}.png`;
    } else {
      filename = `${partId}-${variant}.png`;
    }
    const originalSrc = `/images/characters/${filename}`;
    const cacheKey = `${originalSrc}|${skinRamp}|${hairRamp}|${shirtRamp}|${pantsRamp}`;
    // Parts that don't need recoloring (like eyes) use original
    if (partType === 'other') return originalSrc;
    // Only return the sprite if it's been recolored - prevents template flash
    return recoloredSprites[cacheKey] || null;
  };
  
  return (
    <FullScreenContainer>
      <GameViewport $scale={viewportScale}>
        <Title>Create Your Character</Title>
        
        <ContentArea>
          <PreviewPanel>
            <PreviewTitle>Preview</PreviewTitle>
            <SpriteStack>
              {!isRecoloring && CHARACTER_PARTS.map((part) => {
                const variant = selections[part.id];
                if (variant === 0) return null;
                if (!isPartVisibleInDirection(part.id, variant)) return null;
                const spriteSrc = getSpriteSrc(part.id, variant, part.partType);
                // Skip rendering if sprite isn't ready (prevents template flash)
                if (!spriteSrc) return null;
                const walkSuffix = getWalkSpriteSuffix(part.id);
                const climbSuffix = getClimbSpriteSuffix(part.id);
                // Only body, legs, and shoes flip during climbing - all other parts stay static
                const shouldFlipPart = shouldFlipClimb && CLIMBING_FLIP_PARTS.includes(part.id);
                return (
                  <SpriteLayer
                    key={`${part.id}-${variant}-${direction}${walkSuffix}${climbSuffix}-${shouldFlipPart}-${skinRamp}-${hairRamp}-${shirtRamp}-${pantsRamp}`}
                    src={spriteSrc}
                    $zIndex={getPartZIndex(part.id, part.zIndex)}
                    $yOffset={getLayerOffset(part.id) * SPRITE_SCALE}
                    $flip={shouldFlipPart}
                    alt={part.label}
                  />
                );
              })}
            </SpriteStack>
            <DirectionHint>WASD to turn</DirectionHint>
            <NameInputContainer>
              <NameLabel>Name</NameLabel>
              <NameInput
                ref={nameInputRef}
                type="text"
                value={characterName}
                onChange={(e) => setCharacterName(e.target.value.slice(0, 10))}
                placeholder="Enter name"
                maxLength={10}
                disabled={isGenerating}
              />
            </NameInputContainer>
          </PreviewPanel>
          
          <OptionsPanel>
            <OptionsRow>
              <OptionSection $narrow>
                <SectionTitle>Parts</SectionTitle>
                {CHARACTER_PARTS
                  .filter(part => !BODY_LINKED_PARTS.includes(part.id))
                  .map((part, index) => (
                  <SelectionRow key={part.id} $highlighted={menuSection === 0 && menuRow === index}>
                    <PartLabel>{part.label}</PartLabel>
                    <SelectionControls>
                      <ArrowButton>◀</ArrowButton>
                      <VariantDisplay>{getVariantDisplay(part, selections[part.id])}</VariantDisplay>
                      <ArrowButton>▶</ArrowButton>
                    </SelectionControls>
                  </SelectionRow>
                ))}
              </OptionSection>
              
              <OptionSection>
                <SectionTitle>Colors</SectionTitle>
                
                <ColorLabel $highlighted={menuSection === 1 && menuRow === 0}>Skin</ColorLabel>
                <ColorRampRow>
                  {(Object.entries(SKIN_RAMPS) as [SkinRampId, typeof SKIN_RAMPS[SkinRampId]][]).map(([id, ramp]) => (
                    <ColorRampButton key={id} $selected={skinRamp === id} title={ramp.name}>
                      <ColorSwatch $color={ramp.colors[2]} />
                    </ColorRampButton>
                  ))}
                </ColorRampRow>
                
                <ColorLabel $highlighted={menuSection === 1 && menuRow === 1}>Hair</ColorLabel>
                <ColorRampRow>
                  {(Object.entries(HAIR_RAMPS) as [HairRampId, typeof HAIR_RAMPS[HairRampId]][]).map(([id, ramp]) => (
                    <ColorRampButton key={id} $selected={hairRamp === id} title={ramp.name}>
                      <ColorSwatch $color={ramp.colors[ramp.colors.length - 2]} />
                    </ColorRampButton>
                  ))}
                </ColorRampRow>
                
                <ColorLabel $highlighted={menuSection === 1 && menuRow === 2}>Shirt</ColorLabel>
                <ColorRampRow>
                  {(Object.entries(CLOTHES_RAMPS) as [ClothesRampId, typeof CLOTHES_RAMPS[ClothesRampId]][]).map(([id, ramp]) => (
                    <ColorRampButton key={id} $selected={shirtRamp === id} title={ramp.name}>
                      <ColorSwatch $color={ramp.colors[2]} />
                    </ColorRampButton>
                  ))}
                </ColorRampRow>
                
                <ColorLabel $highlighted={menuSection === 1 && menuRow === 3}>Pants</ColorLabel>
                <ColorRampRow>
                  {(Object.entries(CLOTHES_RAMPS) as [ClothesRampId, typeof CLOTHES_RAMPS[ClothesRampId]][]).map(([id, ramp]) => (
                    <ColorRampButton key={id} $selected={pantsRamp === id} title={ramp.name}>
                      <ColorSwatch $color={ramp.colors[1]} />
                    </ColorRampButton>
                  ))}
                </ColorRampRow>
                
                <ColorLabel $highlighted={menuSection === 1 && menuRow === 4}>Voice</ColorLabel>
                <VoiceButtonRow>
                  <VoiceButton $selected={voiceType === 'feminine'}>
                    Voice A
                  </VoiceButton>
                  <VoiceButton $selected={voiceType === 'masculine'}>
                    Voice B
                  </VoiceButton>
                </VoiceButtonRow>
              </OptionSection>
            </OptionsRow>
          </OptionsPanel>
        </ContentArea>
        
        <ButtonRow>
          <div>
            <ActionButton $highlighted={menuSection === 2 && menuRow === 0} disabled={isGenerating}>Reset</ActionButton>
            <ActionButton $highlighted={menuSection === 2 && menuRow === 1} disabled={isGenerating} style={{ marginLeft: 8 }}>Randomize</ActionButton>
          </div>
          <ActionButton $primary $highlighted={menuSection === 2 && menuRow === 2} disabled={isGenerating || !characterName.trim()}>
            {isGenerating ? 'Loading...' : 'Continue →'}
          </ActionButton>
        </ButtonRow>
        
        <FadeOverlay $visible={isFading}>
          {isGenerating && <LoadingText>Creating character...</LoadingText>}
        </FadeOverlay>
      </GameViewport>
    </FullScreenContainer>
  );
};
