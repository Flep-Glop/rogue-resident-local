import styled, { css } from 'styled-components';

// === SHARED CONSTANTS ===
export const HOME_INTERNAL_WIDTH = 640;
export const HOME_INTERNAL_HEIGHT = 360;
export const JUMBO_ASSET_HEIGHT = 585;

export const DEBUG_CLICKBOXES = false;
export const DEBUG_BOUNDARIES = false;

export const FIRST_FLOOR_BOUNDS = {
  left: 58,
  right: 578,
};

export const SECOND_FLOOR_BOUNDS = {
  left: 373,
  right: 545,
};

export const CanvasFonts = {
  xs: '8px',
  sm: '10px',
  md: '12px',
  lg: '14px',
  xl: '16px'
};

// === STYLED COMPONENTS ===

// Typography override wrapper for PixelContainer compatibility with canvas scaling
export const CanvasTypographyOverride = styled.div`
  font-size: ${CanvasFonts.xs} !important;
  line-height: 1.4 !important;
  
  * {
    font-size: inherit !important;
    line-height: inherit !important;
  }
`;

// Viewport container - the 640x360 window
export const JumboViewport = styled.div`
  width: ${HOME_INTERNAL_WIDTH}px;
  height: ${HOME_INTERNAL_HEIGHT}px;
  position: fixed;
  top: 50%;
  left: 50%;
  transform-origin: center;
  transform: translate(-50%, -50%) scale(var(--home-scale));
  overflow: hidden;
  image-rendering: pixelated;
`;

// Star sprite - dual sprite sheet system
export const StarSprite = styled.div<{ $frame: number; $isPlanetarySystem?: boolean }>`
  position: absolute;
  width: 14px;
  height: 14px;
  background-color: transparent;
  background-image: url('${props => props.$isPlanetarySystem ? '/images/home/planetary-sheet.png' : '/images/home/star-sheet.png'}');
  background-size: ${props => props.$isPlanetarySystem 
    ? `${14 * 96}px 14px`
    : `${14 * 40}px 14px`};
  background-position: ${props => props.$isPlanetarySystem
    ? props.$frame * -14
    : (props.$frame - 1) * -14}px 0px;
  background-repeat: no-repeat;
  image-rendering: pixelated;
  cursor: default;
  pointer-events: none;
`;

export const StarNameLabel = styled.div`
  position: absolute;
  font-family: 'Aseprite', monospace;
  font-size: 12px;
  color: #ffffff;
  white-space: nowrap;
  pointer-events: none;
  image-rendering: pixelated;
  z-index: 201;
`;

export const BoomEffectOverlay = styled.div<{ $visible: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(255, 215, 0, 0.6);
  z-index: 9997;
  pointer-events: none;
  opacity: ${props => props.$visible ? 1 : 0};
  transition: opacity 0.2s ease-out;
`;

export const CinematicLetterbox = styled.div<{ $visible: boolean; $position: 'top' | 'bottom' }>`
  position: fixed;
  left: 0;
  width: 100vw;
  background: #000000;
  z-index: 9998;
  pointer-events: none;
  
  ${props => props.$position === 'top' ? css`
    top: 0;
    height: 140px;
    transform: ${props.$visible ? 'translateY(0)' : 'translateY(-100%)'};
  ` : css`
    bottom: 0;
    height: 320px;
    transform: ${props.$visible ? 'translateY(0)' : 'translateY(100%)'};
  `}
  
  transition: transform 7s cubic-bezier(0.15, 0.9, 0.3, 1);
`;

export const CelestialLayer = styled.div<{ $scrollPosition: number; $transitionDuration: number; $elevated?: boolean }>`
  position: absolute;
  top: 0;
  left: 0;
  width: ${HOME_INTERNAL_WIDTH}px;
  height: ${JUMBO_ASSET_HEIGHT}px;
  transform: translateY(${props => props.$scrollPosition}px);
  transition: transform ${props => props.$transitionDuration}s cubic-bezier(0.4, 0, 0.3, 1);
  image-rendering: pixelated;
  z-index: ${props => props.$elevated ? 15 : 14};
  pointer-events: none;
  overflow: visible;
`;

export const ScrollingContent = styled.div<{ $scrollPosition: number; $transitionDuration: number }>`
  position: relative;
  width: ${HOME_INTERNAL_WIDTH}px;
  height: ${JUMBO_ASSET_HEIGHT}px;
  transform: translateY(${props => props.$scrollPosition}px);
  transition: transform ${props => props.$transitionDuration}s cubic-bezier(0.4, 0, 0.3, 1);
  image-rendering: pixelated;
  z-index: 12;
  overflow: visible;
`;

export const ForegroundLayer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 11;
  background-image: url('/images/home/home-sky-combo.png');
  background-size: ${HOME_INTERNAL_WIDTH}px ${JUMBO_ASSET_HEIGHT}px;
  pointer-events: none;
`;

export const ClickableArea = styled.div<{ $isHovered: boolean; $debugColor?: string }>`
  position: absolute;
  cursor: pointer;
  z-index: 100;
  overflow: visible;
  background: ${({ $debugColor }) => {
    if (DEBUG_CLICKBOXES) {
      return $debugColor || 'rgba(255, 0, 0, 0.3)';
    }
    return 'transparent';
  }};
  border: ${({ $debugColor }) => {
    if (DEBUG_CLICKBOXES) {
      return `2px solid ${$debugColor?.replace('0.3', '0.8') || 'rgba(255, 0, 0, 0.8)'}`;
    }
    return '2px solid transparent';
  }};
  transition: all 0.3s ease;
  
  &:hover {
    background: ${({ $debugColor }) => DEBUG_CLICKBOXES ? $debugColor?.replace('0.3', '0.5') : 'transparent'};
    border: ${({ $debugColor }) => DEBUG_CLICKBOXES ? `2px solid ${$debugColor?.replace('0.3', '1')}` : '2px solid transparent'};
  }
`;

export const DebugLabel = styled.div`
  position: absolute;
  top: 2px;
  left: 2px;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 2px 6px;
  font-size: 12px;
  font-family: monospace;
  border-radius: 2px;
  pointer-events: none;
  z-index: 5;
`;

export const ExclamationIndicator = styled.div<{ $size: 'small' | 'large'; $visible: boolean }>`
  position: absolute;
  width: ${props => props.$size === 'small' ? '8px' : '10px'};
  height: ${props => props.$size === 'small' ? '8px' : '10px'};
  background: linear-gradient(135deg, #FFD700, #FFA500);
  border: 1px solid #FFFFFF;
  border-radius: 50%;
  z-index: 201;
  pointer-events: none;
  
  opacity: ${props => props.$visible ? 0.9 : 0};
  transform: ${props => props.$visible ? 'scale(1)' : 'scale(0.5)'};
  transition: opacity 0.3s ease, transform 0.3s ease;
  animation: ${props => props.$visible ? 'exclamationPulse 3s ease-in-out infinite' : 'none'};
  
  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: ${props => props.$size === 'small' ? '1px' : '1.5px'};
    height: ${props => props.$size === 'small' ? '4px' : '5px'};
    background: #000;
    border-radius: 0.5px;
  }
  
  &::after {
    content: '';
    position: absolute;
    bottom: ${props => props.$size === 'small' ? '1.5px' : '2px'};
    left: 50%;
    transform: translateX(-50%);
    width: ${props => props.$size === 'small' ? '1px' : '1.5px'};
    height: ${props => props.$size === 'small' ? '1px' : '1.5px'};
    background: #000;
    border-radius: 50%;
  }
  
  @keyframes exclamationPulse {
    0%, 100% {
      transform: scale(1);
      box-shadow: 0 0 0 0 rgba(255, 215, 0, 0.4);
    }
    50% {
      transform: scale(1.05);
      box-shadow: 0 0 0 3px rgba(255, 215, 0, 0);
    }
  }
`;

export const CharacterSprite = styled.div<{ 
  $frame: number; 
  $direction: 'front' | 'back' | 'right' | 'left';
  $isWalking: boolean;
  $isClimbing: boolean;
  $customSpriteSheet?: string;
}>`
  position: absolute;
  width: 38px;
  height: 102px;
  background-image: ${props => props.$customSpriteSheet 
    ? `url('${props.$customSpriteSheet}')` 
    : `url('/images/characters/sprites/kapoor-home.png')`};
  background-size: ${38 * 38}px 102px;
  background-position: ${props => {
    let frameOffset = 0;
    
    if (props.$isClimbing) {
      frameOffset = 32 + (props.$frame % 6);
    } else if (!props.$isWalking) {
      if (props.$direction === 'front') frameOffset = 0;
      else if (props.$direction === 'back') frameOffset = 4;
      else if (props.$direction === 'right') frameOffset = 8;
      else if (props.$direction === 'left') frameOffset = 12;
      frameOffset += props.$frame % 4;
    } else {
      if (props.$direction === 'right') frameOffset = 16 + (props.$frame % 8);
      else if (props.$direction === 'left') frameOffset = 24 + (props.$frame % 8);
      else if (props.$direction === 'front') frameOffset = 0 + (props.$frame % 4);
      else if (props.$direction === 'back') frameOffset = 4 + (props.$frame % 4);
    }
    
    return `${frameOffset * -38}px 0px`;
  }};
  background-repeat: no-repeat;
  image-rendering: pixelated;
  z-index: 65;
  pointer-events: none;
  transition: left 0.1s linear, top 0.1s linear;
`;

export const ArrowKeysSprite = styled.div<{ $frame: number; $visible: boolean }>`
  position: absolute;
  width: 45px;
  height: 33px;
  background-image: url('/images/ui/arrow-keys.png');
  background-size: ${45 * 8}px 33px;
  background-position: ${props => (props.$frame - 1) * -45}px 0px;
  background-repeat: no-repeat;
  image-rendering: pixelated;
  z-index: 60;
  pointer-events: none;
  
  opacity: ${props => props.$visible ? 1 : 0};
  transform: ${props => props.$visible ? 'scale(1)' : 'scale(0.8)'};
  transition: opacity 0.3s ease, transform 0.3s ease, left 0.1s linear, top 0.1s linear;
`;

export const XKeySprite = styled.div<{ $frame: number; $visible: boolean }>`
  position: absolute;
  width: 15px;
  height: 16px;
  background-image: url('/images/ui/x-key.png');
  background-size: ${15 * 4}px 16px;
  background-position: ${props => (props.$frame - 1) * -15}px 0px;
  background-repeat: no-repeat;
  image-rendering: pixelated;
  z-index: 60;
  pointer-events: none;
  
  opacity: ${props => props.$visible ? 1 : 0};
  transform: ${props => props.$visible ? 'scale(1)' : 'scale(0.8)'};
  transition: opacity 0.3s ease, transform 0.3s ease, left 0.1s linear, top 0.1s linear;
`;

export const CKeySprite = styled.div<{ $frame: number; $visible: boolean }>`
  position: absolute;
  width: 15px;
  height: 16px;
  background-image: url('/images/ui/c-key.png');
  background-size: ${15 * 4}px 16px;
  background-position: ${props => (props.$frame - 1) * -15}px 0px;
  background-repeat: no-repeat;
  image-rendering: pixelated;
  z-index: 60;
  pointer-events: none;
  
  opacity: ${props => props.$visible ? 1 : 0};
  transform: ${props => props.$visible ? 'scale(1)' : 'scale(0.8)'};
  transition: opacity 0.3s ease, transform 0.3s ease, left 0.1s linear, top 0.1s linear;
`;

export const UpArrowSprite = styled.div<{ $frame: number; $visible: boolean }>`
  position: absolute;
  width: 15px;
  height: 16px;
  background-image: url('/images/ui/up-arrow-key.png');
  background-size: ${15 * 4}px 16px;
  background-position: ${props => (props.$frame - 1) * -15}px 0px;
  background-repeat: no-repeat;
  image-rendering: pixelated;
  z-index: 60;
  pointer-events: none;
  
  opacity: ${props => props.$visible ? 1 : 0};
  transform: ${props => props.$visible ? 'scale(1)' : 'scale(0.8)'};
  transition: opacity 0.3s ease, transform 0.3s ease, left 0.1s linear, top 0.1s linear;
`;

export const DownArrowSprite = styled.div<{ $frame: number; $visible: boolean }>`
  position: absolute;
  width: 15px;
  height: 16px;
  background-image: url('/images/ui/down-arrow-key.png');
  background-size: ${15 * 4}px 16px;
  background-position: ${props => (props.$frame - 1) * -15}px 0px;
  background-repeat: no-repeat;
  image-rendering: pixelated;
  z-index: 60;
  pointer-events: none;
  
  opacity: ${props => props.$visible ? 1 : 0};
  transform: ${props => props.$visible ? 'scale(1)' : 'scale(0.8)'};
  transition: opacity 0.3s ease, transform 0.3s ease, left 0.1s linear, top 0.1s linear;
`;

export const ContextLabel = styled.div<{ $visible: boolean }>`
  position: absolute;
  font-family: 'Aseprite', monospace;
  font-size: 10px;
  color: #ffffff;
  white-space: nowrap;
  pointer-events: none;
  image-rendering: pixelated;
  z-index: 60;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
  
  opacity: ${props => props.$visible ? 1 : 0};
  transform: ${props => props.$visible ? 'scale(1)' : 'scale(0.8)'};
  transition: opacity 0.3s ease, transform 0.3s ease, left 0.1s linear, top 0.1s linear;
`;

export const SkyInteractionIndicator = styled.div<{ $visible: boolean }>`
  position: absolute;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  z-index: 100;
  pointer-events: none;
  
  opacity: ${props => props.$visible ? 1 : 0};
  transform: ${props => props.$visible 
    ? 'translateX(-50%) translateY(0)' 
    : 'translateX(-50%) translateY(10px)'};
  transition: opacity 0.3s ease, transform 0.3s ease;
`;

export const SkyKeyRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

export const SkyXKeySprite = styled.div<{ $frame: number }>`
  width: 15px;
  height: 16px;
  background-image: url('/images/ui/x-key.png');
  background-size: ${15 * 4}px 16px;
  background-position: ${props => (props.$frame - 1) * -15}px 0px;
  background-repeat: no-repeat;
  image-rendering: pixelated;
`;

export const SkyCKeySprite = styled.div<{ $frame: number }>`
  width: 15px;
  height: 16px;
  background-image: url('/images/ui/c-key.png');
  background-size: ${15 * 4}px 16px;
  background-position: ${props => (props.$frame - 1) * -15}px 0px;
  background-repeat: no-repeat;
  image-rendering: pixelated;
`;

export const SkyActionLabel = styled.div`
  font-family: 'Aseprite', monospace;
  font-size: 12px;
  color: #ffffff;
  white-space: nowrap;
  image-rendering: pixelated;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
`;

export const DeskInteractionIndicator = styled.div<{ $visible: boolean }>`
  position: absolute;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  z-index: 350;
  pointer-events: none;
  
  opacity: ${props => props.$visible ? 1 : 0};
  transform: ${props => props.$visible 
    ? 'translateX(-50%) translateY(0)' 
    : 'translateX(-50%) translateY(10px)'};
  transition: opacity 0.3s ease, transform 0.3s ease;
`;

export const DeskKeyRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

export const DeskXKeySprite = styled.div<{ $frame: number }>`
  width: 15px;
  height: 16px;
  background-image: url('/images/ui/x-key.png');
  background-size: ${15 * 4}px 16px;
  background-position: ${props => (props.$frame - 1) * -15}px 0px;
  background-repeat: no-repeat;
  image-rendering: pixelated;
`;

export const DeskCKeySprite = styled.div<{ $frame: number }>`
  width: 15px;
  height: 16px;
  background-image: url('/images/ui/c-key.png');
  background-size: ${15 * 4}px 16px;
  background-position: ${props => (props.$frame - 1) * -15}px 0px;
  background-repeat: no-repeat;
  image-rendering: pixelated;
`;

export const DeskActionLabel = styled.div`
  font-family: 'Aseprite', monospace;
  font-size: 12px;
  color: #ffffff;
  white-space: nowrap;
  image-rendering: pixelated;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
`;

// === TBI Positioning Key Instructions ===
export const TbiPositioningIndicator = styled.div<{ $visible: boolean }>`
  position: absolute;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  z-index: 310;
  pointer-events: none;
  
  opacity: ${props => props.$visible ? 1 : 0};
  transform: ${props => props.$visible 
    ? 'translateX(-50%) translateY(0)' 
    : 'translateX(-50%) translateY(10px)'};
  transition: opacity 0.3s ease, transform 0.3s ease;
`;

export const TbiKeyRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

export const LeftRightArrowKeysSprite = styled.div<{ $frame: number }>`
  width: 33px;
  height: 17px;
  background-image: url('/images/ui/left-right-arrow-keys.png');
  background-size: ${33 * 6}px 17px; /* 6 frames: neither, left, right, both, both highlighted, both pressed+highlighted */
  background-position: ${props => (props.$frame - 1) * -33}px 0px;
  background-repeat: no-repeat;
  image-rendering: pixelated;
`;

export const TbiXKeySprite = styled.div<{ $frame: number }>`
  width: 15px;
  height: 16px;
  background-image: url('/images/ui/x-key.png');
  background-size: ${15 * 4}px 16px;
  background-position: ${props => (props.$frame - 1) * -15}px 0px;
  background-repeat: no-repeat;
  image-rendering: pixelated;
`;

export const TbiActionLabel = styled.div`
  font-family: 'Aseprite', monospace;
  font-size: 12px;
  color: #ffffff;
  white-space: nowrap;
  image-rendering: pixelated;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
`;

export const PlayerMonologue = styled.div<{ $visible: boolean }>`
  position: absolute;
  width: 140px;
  font-family: 'Aseprite', monospace;
  font-size: 11px;
  color: #e0e0e0;
  line-height: 1.2;
  z-index: 55;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  padding: 8px 10px;
  border-radius: 3px;
  opacity: ${props => props.$visible ? 1 : 0};
  transition: opacity 0.2s ease;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
`;

export const PlayerSpeakerLabel = styled.div`
  color: #FFD700;
  font-weight: bold;
  margin-bottom: 4px;
  display: block;
`;

export const PlayerContinueHint = styled.div`
  font-size: 9px;
  color: #999;
  margin-top: 8px;
  font-style: italic;
`;

export const PicoSprite = styled.div<{ $frame: number; $isTalking: boolean }>`
  position: absolute;
  width: 28px;
  height: 21px;
  background-image: url('/images/characters/sprites/pico.png');
  background-size: ${28 * 60}px 21px;
  background-position: ${props => {
    const baseFrame = props.$isTalking ? 30 : 0;
    const frameOffset = baseFrame + (props.$frame % 30);
    return `${frameOffset * -28}px 0px`;
  }};
  background-repeat: no-repeat;
  image-rendering: pixelated;
  z-index: 60;
  pointer-events: none;
`;

export const SpeechBubbleSprite = styled.div<{ $frame: number; $visible: boolean; $highlighted: boolean }>`
  position: absolute;
  width: 16px;
  height: 16px;
  background-image: url('/images/ui/speech-bubble.png');
  background-size: ${16 * 8}px 16px;
  background-position: ${props => {
    const baseFrame = props.$highlighted ? 4 : 0;
    const frameIndex = baseFrame + (props.$frame - 1);
    return `${frameIndex * -16}px 0px`;
  }};
  background-repeat: no-repeat;
  image-rendering: pixelated;
  z-index: 46;
  pointer-events: none;
  opacity: ${props => props.$visible ? 1 : 0};
  transform: ${props => props.$visible ? 'scale(1)' : 'scale(0.8)'};
  transition: opacity 0.3s ease, transform 0.3s ease;
`;

// Heart float animation - pops up, floats up while fading
const heartFloatAnimation = css`
  @keyframes heartFloat {
    0% {
      opacity: 0;
      transform: translateY(0) scale(0.5);
    }
    15% {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
    100% {
      opacity: 0;
      transform: translateY(-20px) scale(1);
    }
  }
`;

// Heart bubble - single 16×16px image that floats up and fades
export const HeartBubbleSprite = styled.div<{ $visible: boolean }>`
  ${heartFloatAnimation}
  position: absolute;
  width: 16px;
  height: 16px;
  background-image: url('/images/home/heart.png');
  background-size: 16px 16px;
  background-repeat: no-repeat;
  image-rendering: pixelated;
  z-index: 46;
  pointer-events: none;
  opacity: 0;
  ${props => props.$visible && css`
    animation: heartFloat 1.2s ease-out forwards;
  `}
`;

export const PicoDialogueText = styled.div<{ $visible: boolean }>`
  position: absolute;
  width: 160px;
  font-family: 'Aseprite', monospace;
  font-size: 11px;
  color: #e0e0e0;
  line-height: 1.2;
  z-index: 55;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  padding: 8px 10px;
  border-radius: 4px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  opacity: ${props => props.$visible ? 1 : 0};
  pointer-events: none;
  transition: opacity 0.2s ease, left 0.3s ease, top 0.3s ease;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
`;

export const PicoSpeakerLabel = styled.div`
  color: #FFD700;
  font-weight: bold;
  margin-bottom: 4px;
  display: block;
`;

export const PicoContinueHint = styled.div`
  font-size: 9px;
  color: #999;
  margin-top: 8px;
  font-style: italic;
`;

export const LockedMessageBox = styled.div<{ $visible: boolean }>`
  position: absolute;
  width: 120px;
  font-family: 'Aseprite', monospace;
  font-size: 11px;
  color: #ff6b6b;
  font-style: italic;
  line-height: 1.4;
  z-index: 310; /* Above all comp activity layers (highest is 309) */
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(4px);
  padding: 8px 12px;
  border-radius: 4px;
  border: 1px solid rgba(255, 107, 107, 0.3);
  opacity: ${props => props.$visible ? 1 : 0};
  pointer-events: none;
  transition: opacity 0.3s ease;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
  text-align: center;
`;

// === BOOK/JOURNAL SYSTEM ===

/** Book prompt container - shows "X to open book" with journal icon */
export const BookPromptContainer = styled.div<{ $visible: boolean }>`
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  z-index: 312;
  pointer-events: none;
  opacity: ${props => props.$visible ? 1 : 0};
  transition: opacity 0.3s ease;
`;

/** Small journal icon (16x16) displayed beside the prompt */
export const JournalIcon = styled.div`
  width: 16px;
  height: 16px;
  background-image: url('/images/home/journal.png');
  background-size: 16px 16px;
  background-repeat: no-repeat;
  image-rendering: pixelated;
`;

/** X key sprite for the book prompt */
export const BookXKeySprite = styled.div<{ $frame: number }>`
  width: 15px;
  height: 16px;
  background-image: url('/images/ui/x-key.png');
  background-size: ${15 * 4}px 16px;
  background-position: ${props => (props.$frame - 1) * -15}px 0px;
  background-repeat: no-repeat;
  image-rendering: pixelated;
`;

/** Text label for "Open Book" */
export const BookPromptLabel = styled.div`
  font-family: 'Aseprite', monospace;
  font-size: 11px;
  color: #e0e0e0;
  white-space: nowrap;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
`;

/** Book popup container - slides up from bottom */
export const BookPopupContainer = styled.div<{ $visible: boolean; $shaking: boolean }>`
  position: absolute;
  width: 576px;
  height: 296px;
  left: 50%;
  bottom: 60px;
  transform: translateX(-50%) ${props => props.$visible ? 'translateY(0)' : 'translateY(100%)'};
  background-image: url('/images/home/book-sheet-simple.png');
  background-size: 576px 296px;
  background-repeat: no-repeat;
  image-rendering: pixelated;
  z-index: 320; /* Above everything in the comp activity */
  pointer-events: ${props => props.$visible ? 'all' : 'none'};
  opacity: ${props => props.$visible ? 1 : 0};
  transition: transform 0.35s ease-out, opacity 0.25s ease;
  
  /* Shake animation when trying to flip pages */
  animation: ${props => props.$shaking ? 'bookShake 0.3s ease-in-out' : 'none'};
  
  @keyframes bookShake {
    0%, 100% { transform: translateX(-50%) translateY(0) rotate(0deg); }
    20% { transform: translateX(-50%) translateY(0) translateX(-4px) rotate(-0.5deg); }
    40% { transform: translateX(-50%) translateY(0) translateX(4px) rotate(0.5deg); }
    60% { transform: translateX(-50%) translateY(0) translateX(-3px) rotate(-0.3deg); }
    80% { transform: translateX(-50%) translateY(0) translateX(3px) rotate(0.3deg); }
  }
`;

/** Book instruction bar - shows at bottom when book is open */
export const BookInstructionBar = styled.div<{ $visible: boolean }>`
  position: absolute;
  bottom: 10px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 20px;
  z-index: 321;
  pointer-events: none;
  
  opacity: ${props => props.$visible ? 1 : 0};
  transition: opacity 0.3s ease;
`;

/** Row for each instruction (key sprite + label) */
export const BookKeyRow = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

/** C key sprite for closing the book */
export const BookCKeySprite = styled.div<{ $frame: number }>`
  width: 15px;
  height: 16px;
  background-image: url('/images/ui/c-key.png');
  background-size: ${15 * 4}px 16px;
  background-position: ${props => (props.$frame - 1) * -15}px 0px;
  background-repeat: no-repeat;
  image-rendering: pixelated;
`;

/** Arrow keys sprite for page navigation (shows as disabled/grayed) */
export const BookArrowKeysSprite = styled.div<{ $frame: number }>`
  width: 33px;
  height: 17px;
  background-image: url('/images/ui/left-right-arrow-keys.png');
  background-size: ${33 * 6}px 17px;
  background-position: ${props => (props.$frame - 1) * -33}px 0px;
  background-repeat: no-repeat;
  image-rendering: pixelated;
  opacity: 0.5; /* Grayed out to indicate pages aren't available */
`;

/** Action label for book instructions */
export const BookActionLabel = styled.div`
  font-family: 'Aseprite', monospace;
  font-size: 12px;
  color: #ffffff;
  white-space: nowrap;
  image-rendering: pixelated;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
`;

/** "No more pages" error message - similar to LockedMessageBox */
export const NoMorePagesMessage = styled.div<{ $visible: boolean }>`
  position: absolute;
  font-family: 'Aseprite', monospace;
  font-size: 11px;
  color: #ff9f43;
  font-style: italic;
  line-height: 1.4;
  z-index: 322; /* Above book */
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(4px);
  padding: 8px 12px;
  border-radius: 4px;
  border: 1px solid rgba(255, 159, 67, 0.3);
  opacity: ${props => props.$visible ? 1 : 0};
  pointer-events: none;
  transition: opacity 0.2s ease;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
  text-align: center;
  white-space: nowrap;
  
  /* Position above the book */
  left: 50%;
  bottom: 370px;
  transform: translateX(-50%);
`;

// === REWARD ITEMS SYSTEM ===

/** 
 * Container for reward items - slides to top-right of viewport and fades when claiming.
 * Positioned in viewport coordinates to match anthro dialogue area.
 * Starting position matches book prompt area (left: 200px, top: 230px).
 */
export const RewardItemsContainer = styled.div<{ $visible: boolean; $claiming: boolean }>`
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  z-index: 400; /* Above comp activity layers */
  pointer-events: none;
  
  /* Starting position - matches book prompt and anthro dialogue area */
  left: 200px;
  top: 230px;
  
  /* Visibility and claiming animation - animates to top-right corner */
  opacity: ${props => props.$claiming ? 0 : (props.$visible ? 1 : 0)};
  transform: ${props => props.$claiming 
    ? 'translate(400px, -218px) scale(0.8)' 
    : 'translate(0, 0) scale(1)'};
  transition: ${props => props.$visible 
    ? 'opacity 0.5s ease-out 0.3s, transform 0.6s ease-in-out' 
    : 'opacity 0.3s ease'};
`;

/** Single reward item row (count + sprite) */
export const RewardItem = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

/** Reward count text (e.g., "8" for coins) */
export const RewardCount = styled.div`
  font-family: 'Aseprite', monospace;
  font-size: 12px;
  color: #ffd700;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
  white-space: nowrap;
`;

/** Funding sprite (11x12) - coin icon */
export const FundingSprite = styled.div`
  width: 11px;
  height: 12px;
  background-image: url('/images/home/funding.png');
  background-size: 11px 12px;
  background-repeat: no-repeat;
  image-rendering: pixelated;
`;

/** Page sprite (16x16) - journal page icon */
export const PageSprite = styled.div`
  width: 16px;
  height: 16px;
  background-image: url('/images/home/page.png');
  background-size: 16px 16px;
  background-repeat: no-repeat;
  image-rendering: pixelated;
`;

/** X key sprite for reward claim prompt */
export const RewardXKeySprite = styled.div<{ $frame: number }>`
  width: 15px;
  height: 16px;
  background-image: url('/images/ui/x-key.png');
  background-size: ${15 * 4}px 16px;
  background-position: ${props => (props.$frame - 1) * -15}px 0px;
  background-repeat: no-repeat;
  image-rendering: pixelated;
`;

/** Text label for reward claim action */
export const RewardClaimLabel = styled.div`
  font-family: 'Aseprite', monospace;
  font-size: 11px;
  color: #e0e0e0;
  white-space: nowrap;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
`;

// === JOURNAL CORNER SYSTEM ===

/** 
 * Journal icon that flies to corner when book is first closed.
 * Uses same top/right positioning as corner icon to ensure exact alignment.
 * Animates from center-bottom of screen to top-right corner.
 */
export const JournalFlyingIcon = styled.div<{ $animating: boolean }>`
  position: absolute;
  width: 16px;
  height: 16px;
  background-image: url('/images/home/journal.png');
  background-size: 16px 16px;
  background-repeat: no-repeat;
  image-rendering: pixelated;
  z-index: 400;
  pointer-events: none;
  
  /* Final position matches JournalCornerIcon exactly */
  top: 12px;
  right: 12px;
  
  /* Animation: starts from center-bottom, flies to final position */
  opacity: ${props => props.$animating ? 1 : 0};
  transform: ${props => props.$animating 
    ? 'translate(0, 0) scale(1)' /* Final position - no transform needed */
    : 'translate(-292px, 132px) scale(1)'}; /* Starting position offset */
  transition: ${props => props.$animating 
    ? 'transform 0.5s ease-in-out, opacity 0.1s ease' 
    : 'opacity 0.1s ease'};
`;

/** 
 * Persistent journal icon in top-right corner.
 * Appears after book is first closed (journal collected).
 * Player can press ESC to open book from anywhere.
 */
export const JournalCornerIcon = styled.div<{ $visible: boolean }>`
  position: absolute;
  width: 16px;
  height: 16px;
  top: 12px;
  right: 12px;
  background-image: url('/images/home/journal.png');
  background-size: 16px 16px;
  background-repeat: no-repeat;
  image-rendering: pixelated;
  z-index: 350; /* Above most UI but below modals */
  pointer-events: none;
  
  opacity: ${props => props.$visible ? 1 : 0};
  transform: ${props => props.$visible ? 'scale(1)' : 'scale(0.8)'};
  transition: opacity 0.3s ease, transform 0.3s ease;
`;

// === COMP-SHEET COMPOSITE LAYER SYSTEM ===

export const CompMonitorLayer = styled.div<{ $visible: boolean }>`
  position: absolute;
  width: 300px;
  height: 180px;
  background-image: url('/images/home/comp-monitor.png');
  background-size: 300px 180px;
  background-repeat: no-repeat;
  image-rendering: pixelated;
  z-index: 300;
  pointer-events: ${props => props.$visible ? 'all' : 'none'};
  opacity: ${props => props.$visible ? 1 : 0};
  transform: ${props => props.$visible ? 'scale(1)' : 'scale(0.95)'};
  transition: opacity 0.3s ease, transform 0.3s ease;
`;

export const CompScreenLayer = styled.div<{ $visible: boolean; $variant: 'blue' | 'dark' }>`
  position: absolute;
  width: 300px;
  height: 180px;
  background-image: url(${props => props.$variant === 'blue' 
    ? '/images/home/comp-screen-blue.png' 
    : '/images/home/comp-screen-dark.png'});
  background-size: 300px 180px;
  background-repeat: no-repeat;
  image-rendering: pixelated;
  z-index: 301;
  pointer-events: none;
  opacity: ${props => props.$visible ? 1 : 0};
  transform: ${props => props.$visible ? 'scale(1)' : 'scale(0.95)'};
  transition: opacity 0.3s ease, transform 0.3s ease, background-image 0.3s ease;
`;

/**
 * Consolidated tabs layer - 8 frames showing activity/shop tabs with highlight and lock states
 * Frame 1: Activity tab, no highlight, shop locked
 * Frame 2: Activity tab, activity highlight, shop locked
 * Frame 3: Activity tab, no highlight, shop unlocked
 * Frame 4: Activity tab, activity highlight, shop unlocked
 * Frame 5: Activity tab, shop highlight, shop unlocked
 * Frame 6: Shop tab, no highlight, shop unlocked
 * Frame 7: Shop tab, shop highlight, shop unlocked
 * Frame 8: Shop tab, activity highlight, shop unlocked
 */
export const CompTabsLayer = styled.div<{ $frame: number; $visible: boolean }>`
  position: absolute;
  width: 300px;
  height: 180px;
  background-image: url('/images/home/comp-tabs.png');
  background-size: ${300 * 8}px 180px;
  background-position: ${props => (props.$frame - 1) * -300}px 0px;
  background-repeat: no-repeat;
  image-rendering: pixelated;
  z-index: 302;
  pointer-events: none;
  opacity: ${props => props.$visible ? 1 : 0};
  transition: opacity 0.3s ease;
`;

export const CompOptionsLayer = styled.div<{ $frame: number; $visible: boolean }>`
  position: absolute;
  width: 300px;
  height: 180px;
  background-image: url('/images/home/comp-activity-option-popups-sheet.png');
  background-size: ${300 * 7}px 180px;
  background-position: ${props => (props.$frame - 1) * -300}px 0px;
  background-repeat: no-repeat;
  image-rendering: pixelated;
  z-index: 303;
  pointer-events: none;
  opacity: ${props => props.$visible ? 1 : 0};
  transition: opacity 0.3s ease;
`;

export const CompOptionsStaticLayer = styled.div<{ $visible: boolean }>`
  position: absolute;
  width: 300px;
  height: 180px;
  background-image: url('/images/home/comp-activity-options.png');
  background-size: 300px 180px;
  background-repeat: no-repeat;
  image-rendering: pixelated;
  z-index: 304;
  pointer-events: none;
  opacity: ${props => props.$visible ? 1 : 0};
  transition: opacity 0.3s ease;
`;

// === SHOP TAB LAYERS ===

/** Shop option popups layer - displays selection popups/highlight boxes (4 frames: none, item 1, item 2, item 3) */
export const CompShopPopupsLayer = styled.div<{ $frame: number; $visible: boolean }>`
  position: absolute;
  width: 300px;
  height: 180px;
  background-image: url('/images/home/comp-shop-option-popups-sheet.png');
  background-size: ${300 * 4}px 180px;
  background-position: ${props => (props.$frame - 1) * -300}px 0px;
  background-repeat: no-repeat;
  image-rendering: pixelated;
  z-index: 303;
  pointer-events: none;
  opacity: ${props => props.$visible ? 1 : 0};
  transition: opacity 0.3s ease;
`;

/** Shop options layer - displays shop items with prices (static, on top of popups) */
export const CompShopOptionsLayer = styled.div<{ $visible: boolean }>`
  position: absolute;
  width: 300px;
  height: 180px;
  background-image: url('/images/home/comp-shop-options.png');
  background-size: 300px 180px;
  background-repeat: no-repeat;
  image-rendering: pixelated;
  z-index: 304;
  pointer-events: none;
  opacity: ${props => props.$visible ? 1 : 0};
  transition: opacity 0.3s ease;
`;

export const CompSheetBackdrop = styled.div<{ $visible: boolean }>`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  z-index: 299;
  pointer-events: ${props => props.$visible ? 'all' : 'none'};
  opacity: ${props => props.$visible ? 1 : 0};
  transition: opacity 0.4s ease;
`;

export const ActivityClickRegion = styled.div<{ $active: boolean }>`
  position: absolute;
  z-index: 305;
  pointer-events: none; /* Keyboard navigation only */
  
  ${DEBUG_CLICKBOXES && `
    background: rgba(255, 0, 0, 0.2);
    border: 2px solid rgba(255, 0, 0, 0.5);
  `}
`;

// Anthro Intro - Composite layer system
// Layer 1 (bottom): Container/background
export const AnthroIntroContainer = styled.div<{ $visible: boolean }>`
  position: absolute;
  width: 300px;
  height: 180px;
  background-image: url('/images/home/anthro-intro-container.png');
  background-size: 300px 180px;
  background-position: 0px 0px;
  background-repeat: no-repeat;
  image-rendering: pixelated;
  z-index: 305;
  pointer-events: none;
  opacity: ${props => props.$visible ? 1 : 0};
  transition: opacity 0.3s ease;
`;

// Layer 2 (middle): Dialogue text
export const AnthroDialogueText = styled.div<{ $visible: boolean }>`
  position: absolute;
  width: 240px;
  font-family: 'Aseprite', monospace;
  font-size: 11px;
  color: #e0e0e0;
  line-height: 1;
  z-index: 310;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(4px);
  padding: 10px 12px 10px 12px;
  padding-right: 60px;
  border-radius: 4px;
  border: 1px solid rgba(100, 200, 255, 0.3);
  opacity: ${props => props.$visible ? 1 : 0};
  pointer-events: none;
  transition: opacity 0.2s ease;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
`;

// Layer 3 (top): Anthro character sprite (43-frame animation, 39×82px per frame)
// Frames 0-7: body idle, 8-15: waving, 16-37: transformation, 38-42: slab idle
// Position set via inline style in CombinedHomeScene.tsx
export const AnthroIntroLayer = styled.div<{ $frame: number; $visible: boolean }>`
  position: absolute;
  width: 39px;
  height: 82px;
  background-image: url('/images/home/anthro-intro.png');
  background-size: ${39 * 43}px 82px;
  background-position: ${props => props.$frame * -39}px 0px;
  background-repeat: no-repeat;
  image-rendering: pixelated;
  z-index: 311;
  pointer-events: none;
  opacity: ${props => props.$visible ? 1 : 0};
  transition: opacity 0.3s ease;
`;

export const AnthroSpeakerLabel = styled.div`
  color: #66CCFF;
  font-weight: bold;
  margin-bottom: 4px;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 1px;
`;

export const AnthroDialogueContinueHint = styled.div`
  font-size: 9px;
  color: #999;
  margin-top: 8px;
  font-style: italic;
`;

/** TBI Positioning background - static single frame (300×180px) */
export const TbiPositioningLayer = styled.div<{ $visible: boolean }>`
  position: absolute;
  width: 300px;
  height: 180px;
  background-image: url('/images/home/tbi-positioning.png');
  background-size: 300px 180px;
  background-position: 0px 0px;
  background-repeat: no-repeat;
  image-rendering: pixelated;
  z-index: 306;
  pointer-events: none;
  opacity: ${props => props.$visible ? 1 : 0};
  transition: opacity 0.3s ease;
`;

/** TBI Anthro sprite - 16-frame animation (31×92px per frame), positioned via $x prop
 * Frames 0-7: body idle (not used in positioning), Frames 8-15: slab idle (used for positioning)
 */
export const TbiAnthroSprite = styled.div<{ $frame: number; $x: number; $visible: boolean }>`
  position: absolute;
  width: 31px;
  height: 92px;
  background-image: url('/images/home/anthro-tbi.png');
  background-size: ${31 * 16}px 92px;
  background-position: ${props => props.$frame * -31}px 0px;
  background-repeat: no-repeat;
  image-rendering: pixelated;
  z-index: 306; /* Same as positioning layer - anthro rendered over background */
  pointer-events: none;
  opacity: ${props => props.$visible ? 1 : 0};
  transition: left 0.1s ease-out, opacity 0.3s ease; /* Smooth sliding + fade */
`;

/** Beam-on animation overlay - 11 frames (0-10) at 300×180px per frame */
export const TbiBeamOnLayer = styled.div<{ $frame: number; $visible: boolean }>`
  position: absolute;
  width: 300px;
  height: 180px;
  background-image: url('/images/home/tbi-positioning-beam-on.png');
  background-size: ${300 * 11}px 180px;
  background-position: ${props => props.$frame * -300}px 0px;
  background-repeat: no-repeat;
  image-rendering: pixelated;
  z-index: 307; /* Render above TbiPositioningLayer (306) but below result layers */
  pointer-events: none;
  opacity: ${props => props.$visible ? 1 : 0};
  transition: opacity 0.1s ease; /* Faster transition for beam on/off */
`;

// === TBI MODULAR RESULT SYSTEM ===

/** Backdrop panel - 3 frames: 0=base, 1=fail, 2=pass */
export const TbiResultBackdrop = styled.div<{ $visible: boolean; $frame: number }>`
  position: absolute;
  width: 300px;
  height: 180px;
  background-image: url('/images/home/tbi-positioning-result.png');
  background-size: ${300 * 3}px 180px;
  background-position: ${props => props.$frame * -300}px 0px;
  background-repeat: no-repeat;
  image-rendering: pixelated;
  z-index: 307;
  pointer-events: none;
  opacity: ${props => props.$visible ? 1 : 0};
  transition: opacity 0.3s ease;
`;

/** Container for color bars and percentages - sits between backdrop and anthro base */
export const TbiResultDataLayer = styled.div<{ $visible: boolean }>`
  position: absolute;
  width: 300px;
  height: 180px;
  z-index: 312;
  pointer-events: none;
  opacity: ${props => props.$visible ? 1 : 0};
  transition: opacity 0.3s ease;
`;

/** Individual segment color bar - 51×7px, positioned per segment */
export const TbiColorBar = styled.div<{ $colorFrame: number; $x: number; $y: number }>`
  position: absolute;
  width: 51px;
  height: 7px;
  left: ${props => props.$x}px;
  top: ${props => props.$y}px;
  background-image: url('/images/home/color-bars.png');
  background-size: ${51 * 3}px 7px;
  background-position: ${props => props.$colorFrame * -51}px 0px;
  background-repeat: no-repeat;
  image-rendering: pixelated;
`;

/** Sector 1 (head) color bar - 51×8px (1px taller) */
export const TbiColorBarSector1 = styled.div<{ $colorFrame: number; $x: number; $y: number }>`
  position: absolute;
  width: 51px;
  height: 8px;
  left: ${props => props.$x}px;
  top: ${props => props.$y}px;
  background-image: url('/images/home/color-bars-sector1.png');
  background-size: ${51 * 3}px 8px;
  background-position: ${props => props.$colorFrame * -51}px 0px;
  background-repeat: no-repeat;
  image-rendering: pixelated;
`;

/** Result container frame - sits below bars (65×75px, positioned via props) */
export const TbiResultBase = styled.div<{ $visible: boolean; $x: number; $y: number }>`
  position: absolute;
  width: 65px;
  height: 75px;
  left: ${props => 170 + props.$x}px;
  top: ${props => 90 + props.$y}px;
  background-image: url('/images/home/tbi-positioning-result-base.png');
  background-size: 65px 75px;
  background-repeat: no-repeat;
  image-rendering: pixelated;
  z-index: 311;
  pointer-events: none;
  opacity: ${props => props.$visible ? 1 : 0};
  transition: opacity 0.3s ease;
`;

/** Anthro slab idle - uses frames 38-42 from anthro-intro.png (39×82px per frame, 5 frames) */
export const TbiResultAnthro = styled.div<{ $visible: boolean; $x: number; $y: number; $frame: number }>`
  position: absolute;
  width: 39px;
  height: 82px;
  left: ${props => 170 + props.$x}px;
  top: ${props => 90 + props.$y}px;
  background-image: url('/images/home/anthro-intro.png');
  background-size: ${39 * 43}px 82px;
  background-position: ${props => props.$frame * -39}px 0px;
  background-repeat: no-repeat;
  image-rendering: pixelated;
  z-index: 313;
  pointer-events: none;
  opacity: ${props => props.$visible ? 1 : 0};
  transition: opacity 0.3s ease;
`;

/** Animated mask reveal - 61×72px, 11 frames (0=full, 10=none) */
export const TbiResultMask = styled.div<{ $frame: number; $visible: boolean; $x: number; $y: number }>`
  position: absolute;
  width: 61px;
  height: 72px;
  left: ${props => 170 + props.$x}px;
  top: ${props => 90 + props.$y}px;
  background-image: url('/images/home/tbi-masks-slab.png');
  background-size: ${61 * 11}px 72px;
  background-position: ${props => props.$frame * -61}px 0px;
  background-repeat: no-repeat;
  image-rendering: pixelated;
  z-index: 314;
  pointer-events: none;
  opacity: ${props => props.$visible ? 1 : 0};
  transition: opacity 0.3s ease;
`;

/** Position indicator (checkmark/tilde/X) - 5×3px per frame */
export const TbiPositionIndicator = styled.div<{ $colorFrame: number; $x: number; $y: number }>`
  position: absolute;
  width: 5px;
  height: 3px;
  left: ${props => props.$x}px;
  top: ${props => props.$y}px;
  background-image: url('/images/home/position-indicators.png');
  background-size: ${5 * 3}px 3px;
  background-position: ${props => props.$colorFrame * -5}px 0px;
  background-repeat: no-repeat;
  image-rendering: pixelated;
`;

// === DEBUG BOUNDARY VISUALIZATION ===

export const BoundaryLine = styled.div<{ $color: string }>`
  position: absolute;
  width: 2px;
  height: 100%;
  background-color: ${props => props.$color};
  opacity: 0.6;
  pointer-events: none;
  z-index: 250;
`;

export const BoundaryLabel = styled.div<{ $color: string }>`
  position: absolute;
  background: rgba(0, 0, 0, 0.8);
  color: ${props => props.$color};
  padding: 3px 6px;
  font-size: 10px;
  font-family: monospace;
  border-radius: 2px;
  pointer-events: none;
  z-index: 251;
  border: 1px solid ${props => props.$color};
`;

export const BoundaryFloorIndicator = styled.div<{ $color: string }>`
  position: absolute;
  width: 100%;
  height: 1px;
  background-color: ${props => props.$color};
  opacity: 0.4;
  pointer-events: none;
  z-index: 250;
  
  &::before {
    content: attr(data-label);
    position: absolute;
    left: 5px;
    top: -15px;
    background: rgba(0, 0, 0, 0.8);
    color: ${props => props.$color};
    padding: 2px 5px;
    font-size: 9px;
    font-family: monospace;
    border-radius: 2px;
    border: 1px solid ${props => props.$color};
  }
`;

// Intro fade overlay - fades from black when scene loads
export const IntroFadeOverlay = styled.div<{ $visible: boolean }>`
  position: fixed;
  inset: 0;
  background: black;
  opacity: ${props => props.$visible ? 1 : 0};
  transition: opacity 1.5s ease-out;
  pointer-events: none;
  z-index: 9999;
`;

