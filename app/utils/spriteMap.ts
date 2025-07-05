// Sprite sheet coordinate maps for character portraits and UI elements

export type SpriteCoordinates = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type CharacterId = 'garcia' | 'kapoor' | 'jesse' | 'quinn' | 'unknown';
export type PortraitType = 'detailed' | 'simple' | 'chibi' | 'medium';
export type HandGestureType = 'point' | 'open' | 'closed' | 'thumb' | 'peace';
export type ExpressionType = 'neutral' | 'happy' | 'concerned' | 'thinking' | 'encouraging' | 'surprised' | 'confident' | 'focused' | 'amused' | 'serious' | 'proud' | 'curious' | 'disappointed' | 'relieved' | 'determined';

// Character portrait dimensions
const DETAILED_PORTRAIT_WIDTH = 42;
const DETAILED_PORTRAIT_HEIGHT = 42;
const SIMPLE_PORTRAIT_WIDTH = 32;
const SIMPLE_PORTRAIT_HEIGHT = 36;
const CHIBI_PORTRAIT_WIDTH = 32; // 160px wide for 5 characters = 32px per character
const CHIBI_PORTRAIT_HEIGHT = 36; // Full height of the sprite sheet
const MEDIUM_PORTRAIT_WIDTH = 64; // Assuming 64x64 for medium portraits
const MEDIUM_PORTRAIT_HEIGHT = 64;
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
  } else if (type === 'medium') {
    // Medium portraits use individual files, so we return full image coordinates
    return {
      x: 0,
      y: 0,
      width: MEDIUM_PORTRAIT_WIDTH,
      height: MEDIUM_PORTRAIT_HEIGHT
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

// Get medium portrait source path
export const getMediumPortraitSrc = (character: CharacterId): string => {
  return `/images/characters/portraits/${character}-medium.png`;
};

// Facial expression coordinates (for Garcia's expression spritesheet)
// 15 expressions in a row: neutral, happy, concerned, thinking, encouraging, surprised, confident, focused, amused, serious, proud, curious, disappointed, relieved, determined
export const getExpressionCoordinates = (expression: ExpressionType): SpriteCoordinates => {
  const expressions: ExpressionType[] = [
    'neutral', 'happy', 'concerned', 'thinking', 'encouraging', 
    'surprised', 'confident', 'focused', 'amused', 'serious', 
    'proud', 'curious', 'disappointed', 'relieved', 'determined'
  ];
  const expressionIndex = expressions.indexOf(expression);
  
  return {
    x: expressionIndex * 42, // 42px per expression
    y: 0,
    width: 42,
    height: 42
  };
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
  chibiPortraits: '/images/characters/sprites/characters-chibi.png',
  // Medium portraits use individual files - use getMediumPortraitSrc() function instead
  mediumPortraits: {
    garcia: '/images/characters/portraits/garcia-medium.png',
    jesse: '/images/characters/portraits/jesse-medium.png', 
    kapoor: '/images/characters/portraits/kapoor-medium.png',
    quinn: '/images/characters/portraits/quinn-medium.png',
    unknown: '/images/characters/portraits/garcia-medium.png' // Fallback
  },
  // Expression spritesheets
  expressions: {
    garcia: '/images/characters/portraits/garcia-animation.png', // 15 expressions, 42x42 each
    jesse: '/images/characters/portraits/jesse-medium.png' // 15 expressions, 42x42 each (user uploaded sprite sheet to replace static image)
  }
}; 