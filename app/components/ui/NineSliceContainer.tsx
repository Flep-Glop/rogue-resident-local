'use client';

import React, { ReactNode } from 'react';
import styled from 'styled-components';
import { colors, spacing, mixins } from '@/app/styles/pixelTheme';

// 9-slice container component - general purpose scalable UI container
export type ContainerSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface NineSliceContainerProps {
  children: ReactNode;
  size?: ContainerSize;
  isActive?: boolean;
  isHovered?: boolean;
  isDisabled?: boolean;
  className?: string;
  onClick?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  style?: React.CSSProperties;
}

// 9-slice configuration
const NINESLICE_CONFIG = {
  nineslice: '/images/ui/containers/window-9slice.png',
  slice: '20 40 20 40',
  borderWidth: '20px 40px 20px 40px',
  minHeight: '60px'
};

// Size configurations
const SIZE_CONFIG = {
  xs: { padding: spacing.xs, minHeight: '32px' },
  sm: { padding: spacing.sm, minHeight: '48px' },
  md: { padding: spacing.md, minHeight: '64px' },
  lg: { padding: spacing.lg, minHeight: '96px' },
  xl: { padding: spacing.xl, minHeight: '128px' }
};

// Expandable container using 9-slice technique
const Container = styled.div<{
  $isActive?: boolean;
  $isHovered?: boolean;
  $isDisabled?: boolean;
}>`
  position: relative;
  ${mixins.pixelPerfect}
  
  /* No background - uses 9-slice only */
  background-image: none;
  
  /* 9-slice border-image setup */
  border-image: url('${NINESLICE_CONFIG.nineslice}') ${NINESLICE_CONFIG.slice};
  border-width: ${NINESLICE_CONFIG.borderWidth};
  border-style: solid;
  min-height: ${NINESLICE_CONFIG.minHeight};
  width: 100%;
  
  /* State-based styling */
  filter: ${({ $isDisabled }) => $isDisabled ? 'grayscale(1) opacity(0.6)' : 'none'};
  
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

// Content wrapper - ensures content appears above border-image
const ContentWrapper = styled.div`
  position: relative;
  z-index: 2;
  flex: 1;
  display: flex;
  flex-direction: column;
  color: ${colors.text};
`;

// Main component
export const NineSliceContainer: React.FC<NineSliceContainerProps> = ({
  children,
  size = 'md',
  isActive = false,
  isHovered = false,
  isDisabled = false,
  className,
  onClick,
  onMouseEnter,
  onMouseLeave,
  style,
}) => {
  const [internalHovered, setInternalHovered] = React.useState(false);
  const effectiveHovered = isHovered || internalHovered;
  
  const handleMouseEnter = () => {
    setInternalHovered(true);
    onMouseEnter?.();
  };
  
  const handleMouseLeave = () => {
    setInternalHovered(false);
    onMouseLeave?.();
  };
  
  return (
    <Container
      $isActive={isActive}
      $isHovered={effectiveHovered}
      $isDisabled={isDisabled}
      className={className}
      onClick={!isDisabled ? onClick : undefined}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={style}
    >
      <ContentWrapper>
        {children}
      </ContentWrapper>
    </Container>
  );
};

// Legacy alias for backwards compatibility
export const ExpandableQuestionContainer = NineSliceContainer;

export default NineSliceContainer;
