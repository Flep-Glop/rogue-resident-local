// Sprite sheet coordinate maps for character portraits and UI elements

export type SpriteCoordinates = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type CharacterId = 'garcia' | 'kapoor' | 'jesse' | 'quinn' | 'unknown';
export type PortraitType = 'detailed' | 'simple' | 'chibi';
export type HandGestureType = 'point' | 'open' | 'closed' | 'thumb' | 'peace';

// Character portrait dimensions
const DETAILED_PORTRAIT_WIDTH = 42;
const DETAILED_PORTRAIT_HEIGHT = 42;
const SIMPLE_PORTRAIT_WIDTH = 32;
const SIMPLE_PORTRAIT_HEIGHT = 36;
const CHIBI_PORTRAIT_WIDTH = 32; // 160px wide for 5 characters = 32px per character
const CHIBI_PORTRAIT_HEIGHT = 36; // Full height of the sprite sheet
const HAND_GESTURE_WIDTH = 10;
const HAND_GESTURE_HEIGHT = 15;

// Character indexes in the sprite sheet (left-to-right order)
const CHARACTER_ORDER: CharacterId[] = ['kapoor', 'jesse', 'unknown', 'garcia', 'quinn'];

// Generate sprite coordinates for portraits
export const getPortraitCoordinates = (character: CharacterId, type: PortraitType): SpriteCoordinates => {
  const characterIndex = CHARACTER_ORDER.indexOf(character);
  if (characterIndex === -1) return { x: 0, y: 0, width: 0, height: 0 };
  
  if (type === 'detailed') {
    return {
      x: characterIndex * DETAILED_PORTRAIT_WIDTH,
      y: 0,
      width: DETAILED_PORTRAIT_WIDTH,
      height: DETAILED_PORTRAIT_HEIGHT
    };
  } else if (type === 'chibi') {
    return {
      x: characterIndex * CHIBI_PORTRAIT_WIDTH,
      y: 0,
      width: CHIBI_PORTRAIT_WIDTH,
      height: CHIBI_PORTRAIT_HEIGHT
    };
  } else { // simple
    return {
      x: characterIndex * SIMPLE_PORTRAIT_WIDTH,
      y: 0,
      width: SIMPLE_PORTRAIT_WIDTH,
      height: SIMPLE_PORTRAIT_HEIGHT
    };
  }
};

// Map for hand gestures (assuming 5 types in each row)
export const getHandGestureCoordinates = (index: number): SpriteCoordinates => {
  const col = index % 5;
  const row = Math.floor(index / 5);
  
  return {
    x: col * HAND_GESTURE_WIDTH,
    y: row * HAND_GESTURE_HEIGHT,
    width: HAND_GESTURE_WIDTH,
    height: HAND_GESTURE_HEIGHT
  };
};

// Sprite sheet URLs
export const SPRITE_SHEETS = {
  detailedPortraits: '/images/characters/sprites/characters-portrait.png',
  simplePortraits: '/images/characters/sprites/characters-portrait.png', // Fallback to existing portrait sheet
  handGestures: '/images/characters/sprites/characters-hands.png',
  chibiPortraits: '/images/characters/sprites/characters-chibi.png'
}; 