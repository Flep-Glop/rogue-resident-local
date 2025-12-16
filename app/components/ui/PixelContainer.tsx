'use client';

import React, { ReactNode } from 'react';
import styled from 'styled-components';
import { colors, spacing, mixins } from '@/app/styles/pixelTheme';

// Container variant types
export type ContainerVariant = 
  | 'dialog'           // For dialogue boxes and main panels
  | 'card'            // For smaller cards and buttons
  | 'panel'           // For side panels and overlays
  | 'tooltip'         // For tooltips and small popups
  | 'modal'           // For modal dialogs
  | 'question'        // For question containers
  | 'resource'        // For resource displays
  | 'ability'         // For ability cards
  | 'answer'          // For answer option buttons
  | 'toast'           // For small notifications and brief popups
  | 'window';         // For quiz windows and content frames

// Container size presets
export type ContainerSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

// Props interface
interface PixelContainerProps {
  children: ReactNode;
  variant?: ContainerVariant;
  size?: ContainerSize;
  domain?: 'physics' | 'dosimetry' | 'linac' | 'planning'; // Knowledge domain theming
  isActive?: boolean;
  isHovered?: boolean;
  isDisabled?: boolean;
  expandable?: boolean; // NEW: For typewriter containers that need to expand
  className?: string;
  onClick?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  style?: React.CSSProperties;
}

// PNG asset mapping for each variant
const CONTAINER_ASSETS = {
  dialog: {
    background: '/images/ui/containers/dialog-bg.png',
    border: '/images/ui/containers/dialog-border.png',
    corners: '/images/ui/containers/dialog-corners.png',
    nineslice: '/images/ui/containers/dialog-9slice.png'
  },
  card: {
    background: '/images/ui/containers/card-bg.png',
    border: '/images/ui/containers/card-border.png',
    corners: '/images/ui/containers/card-corners.png',
    nineslice: '/images/ui/containers/card-9slice.png'
  },
  panel: {
    background: '/images/ui/containers/panel-bg.png',
    border: '/images/ui/containers/panel-border.png',
    corners: '/images/ui/containers/panel-corners.png',
    nineslice: '/images/ui/containers/panel-9slice.png'
  },
  tooltip: {
    background: '/images/ui/containers/tooltip-bg.png',
    border: '/images/ui/containers/tooltip-border.png',
    tail: '/images/ui/containers/tooltip-tail.png',
    nineslice: '/images/ui/containers/tooltip-9slice.png'
  },
  modal: {
    background: '/images/ui/containers/modal-bg.png',
    border: '/images/ui/containers/modal-border.png',
    corners: '/images/ui/containers/modal-corners.png',
    nineslice: '/images/ui/containers/modal-9slice.png'
  },
  question: {
    background: '',  // No background - uses 9-slice only
    border: '',      // No border overlay
    corners: '',     // No corners overlay
    nineslice: '/images/ui/containers/window-9slice.png'  // Share with window variant
  },
  resource: {
    background: '/images/ui/containers/resource-bg.png',
    border: '/images/ui/containers/resource-border.png',
    frame: '/images/ui/containers/resource-frame.png',
    nineslice: '/images/ui/containers/resource-9slice.png'
  },
  ability: {
    background: '/images/ui/containers/ability-bg.png',
    border: '/images/ui/containers/ability-border.png',
    glow: '/images/ui/containers/ability-glow.png',
    nineslice: '/images/ui/containers/ability-9slice.png'
  },
  answer: {
    background: '/images/ui/containers/answer-bg.png',  // Optional fallback
    border: '/images/ui/containers/answer-border.png',  // Optional fallback  
    corners: '/images/ui/containers/answer-corners.png', // Optional fallback
    nineslice: '/images/ui/containers/answer-9slice.png' // Primary asset for expandable system
  },
  toast: {
    background: '/images/ui/containers/tooltip-bg.png',  // Fallback to tooltip
    border: '/images/ui/containers/tooltip-border.png',  // Fallback to tooltip
    nineslice: '/images/ui/containers/toast-9slice.png'  // Primary asset for toast notifications
  },
  window: {
    background: '',  // No background - uses 9-slice only
    border: '',      // No border overlay  
    nineslice: '/images/ui/containers/window-9slice.png'  // Primary asset for quiz windows (240×80px)
  }
};

// 9-slice configuration for expandable containers
const NINESLICE_CONFIG = {
  dialog: {
    slice: '25 30 25 30', // top right bottom left
    borderWidth: '25px 30px 25px 30px',
    minHeight: '60px'
  },
  card: {
    slice: '15 20 15 20',
    borderWidth: '15px 20px 15px 20px', 
    minHeight: '40px'
  },
  panel: {
    slice: '20 25 20 25',
    borderWidth: '20px 25px 20px 25px',
    minHeight: '80px'
  },
  tooltip: {
    slice: '12 16 12 16',
    borderWidth: '12px 16px 12px 16px',
    minHeight: '32px'
  },
  modal: {
    slice: '30 40 30 40',
    borderWidth: '30px 40px 30px 40px',
    minHeight: '100px'
  },
  question: {
    slice: '20 40 20 40', // Based on 240×80px template
    borderWidth: '20px 40px 20px 40px',
    minHeight: '60px'
  },
  resource: {
    slice: '10 15 10 15',
    borderWidth: '10px 15px 10px 15px',
    minHeight: '30px'
  },
  ability: {
    slice: '15 20 15 20',
    borderWidth: '15px 20px 15px 20px',
    minHeight: '50px'
  },
  answer: {
    slice: '10 10 10 10 fill',   // Compact 10px borders all around + fill center
    borderWidth: '10px 10px 10px 10px',
    minHeight: '35px'             // Perfect for single line, auto-expands for more
  },
  toast: {
    slice: '6 8 6 8',            // Adjusted for 60×20 asset (proportional borders)
    borderWidth: '6px 8px 6px 8px',
    minHeight: '20px'             // Native height matching 60×20 asset
  },
  window: {
    slice: '20 40 20 40 fill',   // Based on 240×80px asset + fill center
    borderWidth: '20px 40px 20px 40px',
    minHeight: '60px'             // Min height allowing content expansion
  }
};

// Size configurations
const SIZE_CONFIG = {
  xs: { padding: spacing.xs, minHeight: '32px' },
  sm: { padding: spacing.sm, minHeight: '48px' },
  md: { padding: spacing.md, minHeight: '64px' },
  lg: { padding: spacing.lg, minHeight: '96px' },
  xl: { padding: spacing.xl, minHeight: '128px' }
};

// Toast-specific size override (minimal padding for compact notifications)
const TOAST_SIZE_CONFIG = {
  xs: { padding: spacing.xxs, minHeight: '20px' },  // 4px padding, native 20px height
  sm: { padding: spacing.xxs, minHeight: '20px' },  // Keep minimal for all toast sizes
  md: { padding: spacing.xs, minHeight: '24px' },   // Slightly larger for multi-line
  lg: { padding: spacing.xs, minHeight: '28px' },
  xl: { padding: spacing.sm, minHeight: '32px' }
};

// Domain color mapping
const DOMAIN_COLORS = {
  physics: colors.treatmentPlanning,
  dosimetry: colors.dosimetry, 
  linac: colors.linacAnatomy,
  planning: colors.radiationTherapy
};

// Main container with pixel art background layers
const Container = styled.div<{
  $variant: ContainerVariant;
  $size: ContainerSize;
  $domain?: string;
  $isActive?: boolean;
  $isHovered?: boolean;
  $isDisabled?: boolean;
}>`
  position: relative;
  display: flex;
  flex-direction: column;
  ${mixins.pixelPerfect}
  
  /* Size configuration - use toast-specific sizing for toast variant */
  padding: ${({ $size, $variant }) => 
    $variant === 'toast' ? TOAST_SIZE_CONFIG[$size].padding : SIZE_CONFIG[$size].padding
  };
  min-height: ${({ $size, $variant }) => 
    $variant === 'toast' ? TOAST_SIZE_CONFIG[$size].minHeight : SIZE_CONFIG[$size].minHeight
  };
  
  /* Background layer */
  background-image: url('${({ $variant }) => CONTAINER_ASSETS[$variant]?.background}');
  background-size: 100% 100%;
  background-repeat: no-repeat;
  ${mixins.pixelPerfect}
  
  /* State-based styling */
  filter: ${({ $isDisabled, $isHovered, $isActive, $domain }) => {
    if ($isDisabled) return 'grayscale(1) opacity(0.6)';
    if ($isActive && $domain) return `drop-shadow(0 0 8px ${DOMAIN_COLORS[$domain as keyof typeof DOMAIN_COLORS]})`;
    if ($isHovered) return 'brightness(1.1) contrast(1.1)';
    return 'none';
  }};
  
  transition: filter 0.2s ease;
  cursor: ${({ onClick, $isDisabled }) => {
    if ($isDisabled) return 'not-allowed';
    if (onClick) return 'pointer';
    return 'default';
  }};
  
  /* Ensure children don't overflow */
  overflow: visible;
  
  /* Border overlay layer */
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-image: url('${({ $variant }) => CONTAINER_ASSETS[$variant]?.border}');
    background-size: 100% 100%;
    background-repeat: no-repeat;
    pointer-events: none;
    z-index: 1;
    ${mixins.pixelPerfect}
  }
  
  /* Corner decoration layer */
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-image: url('${({ $variant }) => (CONTAINER_ASSETS[$variant] as any)?.corners || ''}');
    background-size: 100% 100%;
    background-repeat: no-repeat;
    pointer-events: none;
    z-index: 2;
    ${mixins.pixelPerfect}
    
    /* Domain color tinting for corners */
    ${({ $domain, $isActive }) => 
      $isActive && $domain ? 
        `filter: sepia(1) hue-rotate(0deg) saturate(2) brightness(1.2);` : 
        ''
    }
  }
`;

// Content wrapper ensures proper z-index layering
const ContentWrapper = styled.div`
  position: relative;
  z-index: 3;
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100%; /* Ensure content wrapper fills the container */
  /* No padding - Container already applies SIZE_CONFIG padding */
`;

// Expandable container using 9-slice technique for typewriter containers
const ExpandableContainer = styled.div<{
  $variant: ContainerVariant;
  $domain?: string;
  $isActive?: boolean;
  $isHovered?: boolean;
  $isDisabled?: boolean;
}>`
  position: relative;
  /* REMOVED FLEX PROPERTIES - This container is now only for the border-image */
  ${mixins.pixelPerfect}
  
  /* Background fill for container - skip for window variant (uses transparent 9-slice) */
  /* For answer variant: use sprite sheet with frame positioning - NO 9-SLICE */
  ${({ $variant, $isHovered, $isActive }) => {
    if ($variant === 'answer') {
      // 3-frame sprite sheet: 60x35 each frame = 180x35 total
      // But we ONLY show ONE frame at a time using background-position
      // Frame 1 (default): 0px, Frame 2 (hover): 60px, Frame 3 (selected): 120px
      const frameOffset = $isActive ? 120 : ($isHovered ? 60 : 0);
      return `
        background-image: url('${CONTAINER_ASSETS.answer.nineslice}');
        background-size: auto 35px;
        background-position: -${frameOffset}px 0px;
        background-repeat: no-repeat;
        width: auto;
        min-width: 60px;
        height: 35px;
        padding: 8px 16px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
      `;
    } else {
      return `
        background-image: ${$variant === 'window' ? 'none' : `url('${CONTAINER_ASSETS[$variant]?.background}')`};
        background-size: 100% 100%;
        background-repeat: no-repeat;
      `;
    }
  }}
  
  /* 9-slice border-image setup - FIXED: Removed 'fill' keyword to prevent text invisibility */
  /* Skip border-image for answer variant (using sprite sheet instead) */
  ${({ $variant }) => $variant !== 'answer' ? `
    border-image: url('${CONTAINER_ASSETS[$variant]?.nineslice}') 
                  ${NINESLICE_CONFIG[$variant]?.slice};
    border-width: ${NINESLICE_CONFIG[$variant]?.borderWidth};
    border-style: solid;
    min-height: ${NINESLICE_CONFIG[$variant]?.minHeight};
    width: 100%;
  ` : ''}
  
  /* State-based styling */
  filter: ${({ $isDisabled, $isActive, $domain }) => {
    if ($isDisabled) return 'grayscale(1) opacity(0.6)';
    if ($isActive && $domain) return `drop-shadow(0 0 8px ${DOMAIN_COLORS[$domain as keyof typeof DOMAIN_COLORS]})`;
    return 'none';
  }};
  
  transition: filter 0.2s ease, background-position 0.15s ease;
  cursor: ${({ onClick, $isDisabled }) => {
    if ($isDisabled) return 'not-allowed';
    if (onClick) return 'pointer';
    return 'default';
  }};
  
  /* Pixel art rendering */
  image-rendering: pixelated;
  image-rendering: crisp-edges;
  image-rendering: -moz-crisp-edges;
  image-rendering: -webkit-crisp-edges;
`;

// Expandable content wrapper - ensures content appears above border-image
const ExpandableContentWrapper = styled.div<{
  $variant: ContainerVariant;
  $isActive?: boolean;
}>`
  position: relative;
  z-index: 2; /* Higher z-index to ensure content appears above border-image */
  flex: 1;
  display: flex;
  flex-direction: column;
  /* FIXED: Removed hardcoded 1rem padding to respect SIZE_CONFIG system */
  color: ${colors.text};
  
  /* Answer variant: no transform (removed to prevent scrollbar) */
`;

// Sprite Button Container - for multi-frame sprite sheets WITH 9-slice
// Uses multiple layers (one per frame) with visibility toggling
const SpriteButtonContainer = styled.div<{
  $spriteUrl: string;
  $frameWidth: number;
  $frameHeight: number;
  $currentFrame: number;
  $isDisabled?: boolean;
}>`
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  
  /* Container expands to fit text content */
  width: auto;
  min-width: ${props => props.$frameWidth}px;
  height: ${props => props.$frameHeight}px;
  
  /* Pixel art rendering */
  ${mixins.pixelPerfect}
  
  /* State styling */
  filter: ${props => props.$isDisabled ? 'grayscale(1) opacity(0.6)' : 'none'};
  cursor: ${props => props.$isDisabled ? 'not-allowed' : 'pointer'};
`;

// Individual frame layer with 9-slice support
const SpriteFrameLayer = styled.div<{
  $imageUrl: string;
  $isVisible: boolean;
}>`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  
  /* Instant visibility toggle - NO transitions for instant frame switching */
  display: ${props => props.$isVisible ? 'block' : 'none'};
  pointer-events: none;
  
  /* 9-slice border image - elegant expansion */
  border-image-source: url('${props => props.$imageUrl}');
  border-image-slice: 10 10 10 10 fill;
  border-image-width: 10px;
  border-image-outset: 0;
  border-image-repeat: stretch;
  border-style: solid;
  
  /* Pixel art rendering */
  ${mixins.pixelPerfect}
`;

const SpriteButtonContent = styled.div<{ $isActive?: boolean }>`
  position: relative;
  z-index: 2;
  color: ${colors.text};
  padding: 8px 16px;
  
  /* No transform (removed to prevent scrollbar) */
`;

// Special effect overlays for active states
const EffectOverlay = styled.div<{
  $variant: ContainerVariant;
  $isActive?: boolean;
  $domain?: string;
}>`
  position: absolute;
  top: -4px;
  left: -4px;
  right: -4px;
  bottom: -4px;
  opacity: ${({ $isActive }) => $isActive ? 1 : 0};
  transition: opacity 0.3s ease;
  pointer-events: none;
  z-index: 0;
  
  /* Glow effect for ability cards */
  ${({ $variant, $domain }) => $variant === 'ability' && $domain ? `
    background-image: url('${CONTAINER_ASSETS.ability.glow}');
    background-size: 100% 100%;
    background-repeat: no-repeat;
    filter: hue-rotate(${$domain === 'physics' ? '200deg' : 
                        $domain === 'dosimetry' ? '300deg' :
                        $domain === 'linac' ? '60deg' : '120deg'});
    animation: pulse 2s ease-in-out infinite;
  ` : ''}
  
  @keyframes pulse {
    0% { opacity: 0.6; transform: scale(1); }
    50% { opacity: 1; transform: scale(1.02); }
    100% { opacity: 0.6; transform: scale(1); }
  }
`;

// Main component
export const PixelContainer: React.FC<PixelContainerProps> = ({
  children,
  variant = 'card',
  size = 'md',
  domain,
  isActive = false,
  isHovered = false,
  isDisabled = false,
  expandable = false,
  className,
  onClick,
  onMouseEnter,
  onMouseLeave,
  style,
  ...props
}) => {
  const [internalHovered, setInternalHovered] = React.useState(false);
  
  // Use external isHovered if provided, otherwise use internal state
  const effectiveHovered = isHovered || internalHovered;
  
  const handleMouseEnter = (e: React.MouseEvent) => {
    setInternalHovered(true);
    onMouseEnter?.();
  };
  
  const handleMouseLeave = (e: React.MouseEvent) => {
    setInternalHovered(false);
    onMouseLeave?.();
  };
  
  // Special handling for answer variant - use 3 separate 9-slice layers
  if (expandable && variant === 'answer') {
    // Calculate which frame to show: 1 = default, 2 = hover/highlighted, 3 = selected
    const currentFrame = isActive ? 3 : (effectiveHovered ? 2 : 1);
    
    return (
      <SpriteButtonContainer
        $spriteUrl="/images/ui/containers/answer-default.png"
        $frameWidth={60}
        $frameHeight={35}
        $currentFrame={currentFrame}
        $isDisabled={isDisabled}
        className={className}
        onClick={!isDisabled ? onClick : undefined}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={style}
        {...props}
      >
        {/* Frame 1: Default */}
        <SpriteFrameLayer 
          $imageUrl="/images/ui/containers/answer-default.png"
          $isVisible={currentFrame === 1}
        />
        
        {/* Frame 2: Hover/Highlighted */}
        <SpriteFrameLayer 
          $imageUrl="/images/ui/containers/answer-hover.png"
          $isVisible={currentFrame === 2}
        />
        
        {/* Frame 3: Selected */}
        <SpriteFrameLayer 
          $imageUrl="/images/ui/containers/answer-selected.png"
          $isVisible={currentFrame === 3}
        />
        
        <SpriteButtonContent $isActive={isActive}>
          {children}
        </SpriteButtonContent>
      </SpriteButtonContainer>
    );
  }
  
  // Use expandable container for typewriter content
  if (expandable) {
    return (
      <ExpandableContainer
        $variant={variant}
        $domain={domain}
        $isActive={isActive}
        $isHovered={effectiveHovered}
        $isDisabled={isDisabled}
        className={className}
        onClick={!isDisabled ? onClick : undefined}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={style}
        {...props}
      >
        <ExpandableContentWrapper 
          $variant={variant}
          $isActive={isActive}
        >
          {children}
        </ExpandableContentWrapper>
      </ExpandableContainer>
    );
  }

  // Use fixed-size container for static content
  return (
    <Container
      $variant={variant}
      $size={size}
      $domain={domain}
      $isActive={isActive}
      $isHovered={effectiveHovered}
      $isDisabled={isDisabled}
      className={className}
      onClick={!isDisabled ? onClick : undefined}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={style}
      {...props}
    >
      <EffectOverlay
        $variant={variant}
        $isActive={isActive}
        $domain={domain}
      />
      <ContentWrapper>
        {children}
      </ContentWrapper>
    </Container>
  );
};

// Convenience wrapper components for common use cases
export const DialogContainer: React.FC<Omit<PixelContainerProps, 'variant'>> = (props) => (
  <PixelContainer variant="dialog" expandable {...props} />
);

export const CardContainer: React.FC<Omit<PixelContainerProps, 'variant'>> = (props) => (
  <PixelContainer variant="card" {...props} />
);

export const PanelContainer: React.FC<Omit<PixelContainerProps, 'variant'>> = (props) => (
  <PixelContainer variant="panel" {...props} />
);

export const QuestionContainer: React.FC<Omit<PixelContainerProps, 'variant'>> = (props) => (
  <PixelContainer variant="question" expandable {...props} />
);

export const AbilityContainer: React.FC<Omit<PixelContainerProps, 'variant'>> = (props) => (
  <PixelContainer variant="ability" {...props} />
);

export const AnswerContainer: React.FC<Omit<PixelContainerProps, 'variant'>> = (props) => (
  <PixelContainer variant="answer" {...props} />
);

// Expandable container wrappers for typewriter content
export const ExpandableDialogContainer: React.FC<Omit<PixelContainerProps, 'variant' | 'expandable'>> = (props) => (
  <PixelContainer variant="dialog" expandable {...props} />
);

export const ExpandableQuestionContainer: React.FC<Omit<PixelContainerProps, 'variant' | 'expandable'>> = (props) => (
  <PixelContainer variant="question" expandable {...props} />
);

export const ExpandableCardContainer: React.FC<Omit<PixelContainerProps, 'variant' | 'expandable'>> = (props) => (
  <PixelContainer variant="card" expandable {...props} />
);

export const ExpandableAnswerContainer: React.FC<Omit<PixelContainerProps, 'variant' | 'expandable'>> = (props) => (
  <PixelContainer variant="answer" expandable {...props} />
);

// Tooltip container for popups and overlays
export const TooltipContainer: React.FC<Omit<PixelContainerProps, 'variant'>> = (props) => (
  <PixelContainer variant="tooltip" {...props} />
);

// Toast container for small notifications (uses 9-slice for pixel art borders)
export const ToastContainer: React.FC<Omit<PixelContainerProps, 'variant' | 'expandable'>> = (props) => (
  <PixelContainer variant="toast" expandable {...props} />
);

// Window container for quiz windows and content frames (uses 9-slice for pixel art borders)
export const WindowContainer: React.FC<Omit<PixelContainerProps, 'variant' | 'expandable'>> = (props) => (
  <PixelContainer variant="window" expandable {...props} />
);

export default PixelContainer; 