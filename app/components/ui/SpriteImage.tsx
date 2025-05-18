'use client';

import Image from 'next/image';
import { SpriteCoordinates } from '@/app/utils/spriteMap';

interface SpriteImageProps {
  src: string;
  coordinates: SpriteCoordinates;
  alt: string;
  className?: string;
  pixelated?: boolean;
  scale?: number;
}

export default function SpriteImage({
  src,
  coordinates,
  alt,
  className = '',
  pixelated = true,
  scale = 1
}: SpriteImageProps) {
  // Container dimensions are the target scaled size
  const containerWidth = coordinates.width * scale;
  const containerHeight = coordinates.height * scale;

  // Image dimensions need to be determined from the source image
  // We can't easily get the source image dimensions here directly.
  // Let's assume the Image component needs the full source dimensions
  // to calculate the objectPosition correctly, or maybe just large enough?
  // For now, let's rely on object-position scaling.

  return (
    <div
      className={`sprite-container ${className}`}
      style={{
        width: `${containerWidth}px`,
        height: `${containerHeight}px`,
        overflow: 'hidden',
        position: 'relative',
        imageRendering: pixelated ? 'pixelated' : 'auto'
      }}
    >
      <Image
        src={src}
        alt={alt}
        fill // Use fill to let the image adapt to the container
        className={pixelated ? 'pixelated' : ''}
        style={{
          objectFit: 'none',
          // Use unscaled coordinates for objectPosition
          objectPosition: `-${coordinates.x}px -${coordinates.y}px`,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          imageRendering: pixelated ? 'pixelated' : 'auto',
          position: 'absolute' // Keep position absolute for fill to work correctly
        }}
        unoptimized={pixelated} // Prevents Next.js from optimizing pixelated images
      />
    </div>
  );
} 