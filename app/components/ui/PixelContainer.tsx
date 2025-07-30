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
  | 'ability';        // For ability cards

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
    background: '/images/ui/containers/question-bg.png',
    border: '/images/ui/containers/question-border.png',
    corners: '/images/ui/containers/question-corners.png',
    nineslice: '/images/ui/containers/question-9slice.png'
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
  
  /* Size configuration */
  padding: ${({ $size }) => SIZE_CONFIG[$size].padding};
  min-height: ${({ $size }) => SIZE_CONFIG[$size].minHeight};
  
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
    background-image: url('${({ $variant }) => CONTAINER_ASSETS[$variant]?.corners || ''}');
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
  $isDisabled?: boolean;
}>`
  position: relative;
  /* REMOVED FLEX PROPERTIES - This container is now only for the border-image */
  ${mixins.pixelPerfect}
  
  /* Background fill for container */
  background-image: url('${({ $variant }) => CONTAINER_ASSETS[$variant]?.background}');
  background-size: 100% 100%;
  background-repeat: no-repeat;
  
  /* 9-slice border-image setup - FIXED: Removed 'fill' keyword to prevent text invisibility */
  border-image: url('${({ $variant }) => CONTAINER_ASSETS[$variant]?.nineslice}') 
                ${({ $variant }) => NINESLICE_CONFIG[$variant]?.slice};
  border-width: ${({ $variant }) => NINESLICE_CONFIG[$variant]?.borderWidth};
  border-style: solid;
  
  /* Natural expansion for typewriter effect */
  min-height: ${({ $variant }) => NINESLICE_CONFIG[$variant]?.minHeight};
  width: 100%;
  /* REMOVED PADDING - Now applied to ContentWrapper */
  
  /* State-based styling */
  filter: ${({ $isDisabled, $isActive, $domain }) => {
    if ($isDisabled) return 'grayscale(1) opacity(0.6)';
    if ($isActive && $domain) return `drop-shadow(0 0 8px ${DOMAIN_COLORS[$domain as keyof typeof DOMAIN_COLORS]})`;
    return 'none';
  }};
  
  transition: filter 0.2s ease;
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
const ExpandableContentWrapper = styled.div`
  position: relative;
  z-index: 2; /* Higher z-index to ensure content appears above border-image */
  flex: 1;
  display: flex;
  flex-direction: column;
  /* FIXED: Removed hardcoded 1rem padding to respect SIZE_CONFIG system */
  color: ${colors.text};
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
  style,
  ...props
}) => {
  // Use expandable container for typewriter content
  if (expandable) {
    return (
      <ExpandableContainer
        $variant={variant}
        $domain={domain}
        $isActive={isActive}
        $isDisabled={isDisabled}
        className={className}
        onClick={!isDisabled ? onClick : undefined}
        style={style}
        {...props}
      >
        <ExpandableContentWrapper>
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
      $isHovered={isHovered}
      $isDisabled={isDisabled}
      className={className}
      onClick={!isDisabled ? onClick : undefined}
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

export default PixelContainer; 