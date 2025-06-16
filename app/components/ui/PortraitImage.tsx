'use client';

import React from 'react';
import Image from 'next/image';
import { getPortraitPath, getPortraitDimensions, getCharacterName, CharacterId, PortraitSize } from '@/app/utils/portraitUtils';

interface PortraitImageProps {
  characterId: CharacterId;
  size: PortraitSize;
  alt?: string;
  className?: string;
  style?: React.CSSProperties;
  scale?: number;
  pixelated?: boolean;
}

export default function PortraitImage({ 
  characterId, 
  size, 
  alt, 
  className = '', 
  style = {},
  scale = 1,
  pixelated = true
}: PortraitImageProps) {
  const src = getPortraitPath(characterId, size);
  const dimensions = getPortraitDimensions(size);
  const displayName = getCharacterName(characterId);
  
  const finalAlt = alt || `${displayName} ${size} portrait`;
  
  const imageStyle = {
    width: dimensions.width * scale,
    height: dimensions.height * scale,
    imageRendering: pixelated ? 'pixelated' : 'auto',
    WebkitImageRendering: pixelated ? 'pixelated' : 'auto',
    MozImageRendering: pixelated ? 'crisp-edges' : 'auto',
    msInterpolationMode: pixelated ? 'nearest-neighbor' : 'auto',
    filter: pixelated ? 'none' : undefined,
    transform: pixelated ? 'translateZ(0)' : undefined,
    ...style
  } as React.CSSProperties;
  
  return (
    <Image
      src={src}
      alt={finalAlt}
      width={dimensions.width}
      height={dimensions.height}
      style={imageStyle}
      className={`${className} ${pixelated ? 'pixelated' : ''}`}
      priority={size === 'detailed'} // Prioritize loading detailed portraits
      unoptimized={pixelated} // Prevent Next.js optimization for pixel art
      quality={pixelated ? 100 : 75} // Maximum quality for pixel art
    />
  );
} 