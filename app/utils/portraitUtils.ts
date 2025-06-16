// Portrait utility for individual character portrait files
// Replaces sprite system for cleaner asset management

export type CharacterId = 'garcia' | 'kapoor' | 'quinn' | 'jesse';
export type PortraitSize = 'detailed' | 'medium';

// Portrait file paths
const PORTRAIT_BASE_PATH = '/images/characters/portraits';

export const PORTRAIT_DIMENSIONS = {
  detailed: { width: 208, height: 300 },
  medium: { width: 45, height: 45 }
};

// Get portrait file path for a character
export function getPortraitPath(characterId: CharacterId, size: PortraitSize): string {
  return `${PORTRAIT_BASE_PATH}/${characterId}-${size}.png`;
}

// Get portrait dimensions
export function getPortraitDimensions(size: PortraitSize) {
  return PORTRAIT_DIMENSIONS[size];
}

// Character display names
export const CHARACTER_NAMES: Record<CharacterId, string> = {
  garcia: 'Dr. Garcia',
  kapoor: 'Dr. Kapoor', 
  quinn: 'Dr. Quinn',
  jesse: 'Jesse Martinez'
};

// Get character display name
export function getCharacterName(characterId: CharacterId): string {
  return CHARACTER_NAMES[characterId] || characterId;
}

// Validate character ID
export function isValidCharacterId(id: string): id is CharacterId {
  return ['garcia', 'kapoor', 'quinn', 'jesse'].includes(id);
}

// React component helper for portrait images
export interface PortraitImageProps {
  characterId: CharacterId;
  size: PortraitSize;
  alt?: string;
  className?: string;
  style?: React.CSSProperties;
}

// Get props for an img element
export function getPortraitProps(characterId: CharacterId, size: PortraitSize, alt?: string) {
  const dimensions = getPortraitDimensions(size);
  return {
    src: getPortraitPath(characterId, size),
    alt: alt || `${getCharacterName(characterId)} ${size} portrait`,
    width: dimensions.width,
    height: dimensions.height
  };
} 