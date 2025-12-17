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
  transition: transform ${props => props.$transitionDuration}s cubic-bezier(0.4, 0, 0.2, 1);
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
  transition: transform ${props => props.$transitionDuration}s cubic-bezier(0.4, 0, 0.2, 1);
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
}>`
  position: absolute;
  width: 38px;
  height: 102px;
  background-image: url('/images/characters/sprites/kapoor-home.png');
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

export const KapoorMonologue = styled.div<{ $visible: boolean }>`
  position: absolute;
  width: 140px;
  font-family: 'Aseprite', monospace;
  font-size: 11px;
  color: #e0e0e0;
  line-height: 1.2;
  z-index: 2100;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  padding: 8px 10px;
  border-radius: 3px;
  opacity: ${props => props.$visible ? 1 : 0};
  transition: opacity 0.2s ease;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
`;

export const KapoorSpeakerLabel = styled.div`
  color: #FFD700;
  font-weight: bold;
  margin-bottom: 4px;
  display: block;
`;

export const KapoorContinueHint = styled.div`
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

export const PetDescriptionBox = styled.div<{ $visible: boolean }>`
  position: absolute;
  width: 200px;
  font-family: 'Aseprite', monospace;
  font-size: 10px;
  color: #888;
  font-style: italic;
  line-height: 1.3;
  z-index: 55;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  padding: 8px 10px;
  border-radius: 4px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  opacity: ${props => props.$visible ? 1 : 0};
  pointer-events: none;
  transition: opacity 0.3s ease;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
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

export const CompActivityLayer = styled.div<{ $visible: boolean }>`
  position: absolute;
  width: 300px;
  height: 180px;
  background-image: url('/images/home/comp-activity.png');
  background-size: 300px 180px;
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
  background-image: url('/images/home/comp-activity-options-sheet.png');
  background-size: ${300 * 7}px 180px;
  background-position: ${props => (props.$frame - 1) * -300}px 0px;
  background-repeat: no-repeat;
  image-rendering: pixelated;
  z-index: 303;
  pointer-events: none;
  opacity: ${props => props.$visible ? 1 : 0};
  transition: opacity 0.3s ease;
`;

export const CompOption1Layer = styled.div<{ $frame: number; $visible: boolean }>`
  position: absolute;
  width: 300px;
  height: 180px;
  background-image: url('/images/home/comp-activity-option1-sheet.png');
  background-size: ${300 * 5}px 180px;
  background-position: ${props => (props.$frame - 1) * -300}px 0px;
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
  cursor: pointer;
  pointer-events: all;
  
  ${DEBUG_CLICKBOXES && `
    background: rgba(255, 0, 0, 0.2);
    border: 2px solid rgba(255, 0, 0, 0.5);
  `}
`;

export const AnthroIntroLayer = styled.div<{ $frame: number; $visible: boolean }>`
  position: absolute;
  width: 300px;
  height: 180px;
  background-image: url('/images/home/anthro-intro.png');
  background-size: ${300 * 4}px 180px;
  background-position: ${props => props.$frame * -300}px 0px;
  background-repeat: no-repeat;
  image-rendering: pixelated;
  z-index: 305;
  pointer-events: none;
  opacity: ${props => props.$visible ? 1 : 0};
  transition: opacity 0.3s ease;
`;

export const TbiPositioningLayer = styled.div<{ $frame: number; $visible: boolean }>`
  position: absolute;
  width: 300px;
  height: 180px;
  background-image: url('/images/home/tbi-positioning.png');
  background-size: ${300 * 16}px 180px;
  background-position: ${props => props.$frame * -300}px 0px;
  background-repeat: no-repeat;
  image-rendering: pixelated;
  z-index: 306;
  pointer-events: none;
  opacity: ${props => props.$visible ? 1 : 0};
  transition: opacity 0.3s ease;
`;

export const TbiResultLayer = styled.div<{ $frame: number; $visible: boolean }>`
  position: absolute;
  width: 300px;
  height: 180px;
  background-image: url('/images/home/tbi-positioning-result.png');
  background-size: ${300 * 13}px 180px;
  background-position: ${props => props.$frame * -300}px 0px;
  background-repeat: no-repeat;
  image-rendering: pixelated;
  z-index: 307;
  pointer-events: none;
  opacity: ${props => props.$visible ? 1 : 0};
  transition: opacity 0.3s ease;
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

