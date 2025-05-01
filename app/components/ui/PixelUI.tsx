'use client';

/**
 * PixelUI.tsx
 * A collection of reusable pixel-styled UI components
 * based on the pixelTheme for consistent styling across the game.
 */

import React, { ReactNode } from 'react';
import styled from 'styled-components';
import pixelTheme from '@/app/styles/pixelTheme';

// PixelBox - A basic container with pixel styling
interface PixelBoxProps {
  children: ReactNode;
  $pixelBorder?: boolean;
  className?: string;
  $domainColor?: string;
}

export const PixelBox = styled.div<PixelBoxProps>`
  ${props => props.$pixelBorder ? pixelTheme.components.box.pixel : pixelTheme.components.box.base}
  ${props => props.$domainColor && pixelTheme.components.box.active(props.$domainColor)}
`;

// PixelButton - A button with pixel styling
interface PixelButtonProps {
  children: ReactNode;
  onClick?: () => void;
  $primary?: boolean;
  disabled?: boolean;
  $domainColor?: string;
  className?: string;
}

export const PixelButton = styled.button<PixelButtonProps>`
  ${pixelTheme.components.button.base}
  ${props => props.$primary && pixelTheme.components.button.primary}
  ${props => props.disabled && pixelTheme.components.button.disabled}
  ${props => props.$domainColor && pixelTheme.components.button.domain(props.$domainColor)}
`;

// PixelText - Text with pixel styling
interface PixelTextProps {
  children: ReactNode;
  $variant?: 'heading' | 'subheading' | 'body' | 'small';
  $domainColor?: string;
  className?: string;
}

export const PixelText = styled.div<PixelTextProps>`
  ${pixelTheme.components.text.base}
  ${props => {
    switch (props.$variant) {
      case 'heading':
        return pixelTheme.components.text.heading;
      case 'subheading':
        return pixelTheme.components.text.subheading;
      case 'small':
        return pixelTheme.components.text.small;
      case 'body':
      default:
        return pixelTheme.components.text.body;
    }
  }}
  ${props => props.$domainColor && pixelTheme.components.text.domain(props.$domainColor)}
`;

// PixelHeading - A shorthand for heading text
export const PixelHeading = (props: Omit<PixelTextProps, '$variant'>) => (
  <PixelText $variant="heading" {...props} />
);

// PixelSubheading - A shorthand for subheading text
export const PixelSubheading = (props: Omit<PixelTextProps, '$variant'>) => (
  <PixelText $variant="subheading" {...props} />
);

// PixelCard - A card with pixel styling
interface PixelCardProps {
  children: ReactNode;
  onClick?: () => void;
  $selected?: boolean;
  $domainColor?: string;
  className?: string;
}

export const PixelCard = styled.div<PixelCardProps>`
  ${pixelTheme.components.card.base}
  ${props => props.$selected && pixelTheme.components.card.selected}
  ${props => props.$domainColor && pixelTheme.components.card.domain(props.$domainColor)}
`;

// PixelProgressBar - A progress bar with pixel styling
interface PixelProgressBarProps {
  value: number; // 0-100
  color?: string;
  className?: string;
}

const ProgressBarContainer = styled.div`
  ${pixelTheme.components.progressBar.container}
`;

const ProgressBarFill = styled.div<{ $color: string; $percent: number }>`
  ${props => pixelTheme.components.progressBar.fill(props.$color, props.$percent)}
`;

export const PixelProgressBar: React.FC<PixelProgressBarProps> = ({ 
  value, 
  color = pixelTheme.colors.highlight,
  className
}) => {
  // Ensure value is between 0-100
  const clampedValue = Math.max(0, Math.min(100, value));
  
  return (
    <ProgressBarContainer className={className}>
      <ProgressBarFill $color={color} $percent={clampedValue} />
    </ProgressBarContainer>
  );
};

// PixelStar - A star for the Knowledge Constellation
interface PixelStarProps {
  $active?: boolean;
  $domainColor?: string;
  $glow?: boolean;
  $size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
}

export const PixelStar = styled.div<PixelStarProps>`
  ${pixelTheme.components.star.base}
  ${props => !props.$active && pixelTheme.components.star.inactive}
  ${props => props.$domainColor && pixelTheme.components.star.domain(props.$domainColor)}
  ${props => props.$glow && pixelTheme.components.star.glow}
  ${props => {
    switch (props.$size) {
      case 'sm':
        return 'width: 12px; height: 12px;';
      case 'lg':
        return 'width: 24px; height: 24px;';
      case 'md':
      default:
        return 'width: 16px; height: 16px;';
    }
  }}
  cursor: ${props => props.onClick ? 'pointer' : 'default'};
`;

// PixelDialog - A dialog box with pixel styling
interface PixelDialogProps {
  children: ReactNode;
  title?: string;
  className?: string;
}

const DialogContainer = styled.div`
  ${pixelTheme.components.dialog.container}
`;

const DialogHeader = styled.div`
  ${pixelTheme.components.dialog.header}
`;

const DialogContent = styled.div`
  ${pixelTheme.components.dialog.content}
`;

export const PixelDialog: React.FC<PixelDialogProps> = ({ 
  children, 
  title,
  className
}) => {
  return (
    <DialogContainer className={className}>
      {title && <DialogHeader>{title}</DialogHeader>}
      <DialogContent>
        {children}
      </DialogContent>
    </DialogContainer>
  );
};

// PixelTooltip - A tooltip with pixel styling
interface PixelTooltipProps {
  children: ReactNode;
  title?: string;
  $visible: boolean;
  $position?: 'top' | 'right' | 'bottom' | 'left';
  className?: string;
}

export const PixelTooltip = styled.div<PixelTooltipProps>`
  ${pixelTheme.components.tooltip.container}
  display: ${props => props.$visible ? 'block' : 'none'};
  
  ${props => {
    switch (props.$position) {
      case 'top':
        return `
          bottom: 100%;
          left: 50%;
          transform: translateX(-50%);
          margin-bottom: 8px;
          
          &::before {
            bottom: -4px;
            left: 50%;
            transform: translateX(-50%) rotate(45deg);
          }
        `;
      case 'right':
        return `
          left: 100%;
          top: 50%;
          transform: translateY(-50%);
          margin-left: 8px;
          
          &::before {
            left: -4px;
            top: 50%;
            transform: translateY(-50%) rotate(45deg);
          }
        `;
      case 'bottom':
        return `
          top: 100%;
          left: 50%;
          transform: translateX(-50%);
          margin-top: 8px;
          
          &::before {
            top: -4px;
            left: 50%;
            transform: translateX(-50%) rotate(45deg);
          }
        `;
      case 'left':
      default:
        return `
          right: 100%;
          top: 50%;
          transform: translateY(-50%);
          margin-right: 8px;
          
          &::before {
            right: -4px;
            top: 50%;
            transform: translateY(-50%) rotate(45deg);
          }
        `;
    }
  }}
`;

// PixelTooltipContent - A container for tooltip content
export const PixelTooltipTitle = styled.div`
  ${pixelTheme.components.tooltip.title}
`;

export const PixelTooltipContent = styled.div`
  ${pixelTheme.components.tooltip.content}
`;

// MomentumDisplay - A specialized component for showing Momentum resource
interface MomentumDisplayProps {
  value: number; // 0-3
  className?: string;
}

const MomentumContainer = styled.div`
  display: flex;
  gap: ${pixelTheme.spacing.xxs};
`;

const MomentumDot = styled.div<{ $active: boolean }>`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: ${props => props.$active ? pixelTheme.colors.momentum : pixelTheme.colors.inactive};
  box-shadow: ${props => props.$active ? pixelTheme.shadows.glow(pixelTheme.colors.momentum) : 'none'};
`;

export const MomentumDisplay: React.FC<MomentumDisplayProps> = ({ 
  value,
  className
}) => {
  // Ensure value is between 0-3
  const clampedValue = Math.max(0, Math.min(3, value));
  
  return (
    <MomentumContainer className={className}>
      {[...Array(3)].map((_, index) => (
        <MomentumDot key={index} $active={index < clampedValue} />
      ))}
    </MomentumContainer>
  );
};

// Insight Display - A specialized component for showing Insight resource
interface InsightDisplayProps {
  value: number; // 0-100
  className?: string;
}

const InsightContainer = styled.div`
  display: flex;
  align-items: center;
  gap: ${pixelTheme.spacing.xs};
`;

const InsightIcon = styled.div`
  width: 16px;
  height: 16px;
  clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%);
  background-color: ${pixelTheme.colors.insight};
`;

export const InsightDisplay: React.FC<InsightDisplayProps> = ({ 
  value,
  className
}) => {
  return (
    <InsightContainer className={className}>
      <InsightIcon />
      <PixelText $variant="body">{value}</PixelText>
    </InsightContainer>
  );
};

// StarPointsDisplay - A specialized component for showing SP resource
interface StarPointsDisplayProps {
  value: number;
  className?: string;
}

const StarPointsContainer = styled.div`
  display: flex;
  align-items: center;
  gap: ${pixelTheme.spacing.xs};
`;

export const StarPointsDisplay: React.FC<StarPointsDisplayProps> = ({ 
  value,
  className
}) => {
  return (
    <StarPointsContainer className={className}>
      <PixelStar $size="sm" $active $domainColor={pixelTheme.colors.starPoints} />
      <PixelText $variant="body">{value}</PixelText>
    </StarPointsContainer>
  );
};

// Export a collection of components as PixelUI
const PixelUI = {
  Box: PixelBox,
  Button: PixelButton,
  Text: PixelText,
  Heading: PixelHeading,
  Subheading: PixelSubheading,
  Card: PixelCard,
  ProgressBar: PixelProgressBar,
  Star: PixelStar,
  Dialog: PixelDialog,
  Tooltip: PixelTooltip,
  TooltipTitle: PixelTooltipTitle,
  TooltipContent: PixelTooltipContent,
  MomentumDisplay,
  InsightDisplay,
  StarPointsDisplay
};

export default PixelUI; 