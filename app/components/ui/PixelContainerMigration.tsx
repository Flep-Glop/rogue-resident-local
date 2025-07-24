'use client';

/**
 * PixelContainerMigration.tsx
 * Migration utilities and examples for converting CSS containers to pixel art containers
 */

import React from 'react';
import styled from 'styled-components';
import { PixelContainer, QuestionContainer, CardContainer, DialogContainer } from './PixelContainer';

// Legacy styled component (BEFORE)
const LegacyQuestionContainer = styled.div`
  background-color: rgba(0, 0, 0, 0.7);
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1rem;
  border: 1px solid #333;
`;

// Migration wrapper for gradual transition
export const PixelMigrationWrapper: React.FC<{
  children: React.ReactNode;
  variant?: 'legacy' | 'pixel';
  containerType?: 'question' | 'card' | 'dialog' | 'panel';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  domain?: 'physics' | 'dosimetry' | 'linac' | 'planning';
  isActive?: boolean;
  className?: string;
}> = ({ 
  children, 
  variant = 'pixel', 
  containerType = 'card',
  size = 'md',
  domain,
  isActive = false,
  className 
}) => {
  // Allow fallback to legacy during transition period
  if (variant === 'legacy') {
    return (
      <LegacyQuestionContainer className={className}>
        {children}
      </LegacyQuestionContainer>
    );
  }

  // Use new pixel container system
  return (
    <PixelContainer
      variant={containerType}
      size={size}
      domain={domain}
      isActive={isActive}
      className={className}
    >
      {children}
    </PixelContainer>
  );
};

// Example migration patterns for common components

// BEFORE: Multiple styled components for question interface
const LegacyOverallContainer = styled.div`
  display: flex;
  gap: 1.5rem;
  background-color: rgba(17, 24, 39, 0.9);
  border-radius: 10px;
  padding: 1.5rem;
  border: 1px solid #2c3a50;
  box-shadow: 0 5px 10px rgba(0, 0, 0, 0.3);
  max-width: 1000px;
  margin: auto;
  font-family: 'VT323', monospace;
`;

const LegacyPanel = styled.div`
  background-color: rgba(30, 41, 59, 0.8);
  padding: 1.25rem;
  border-radius: 8px;
  border: 1px solid #374151;
  box-shadow: 0 2px 4px rgba(0,0,0,0.25);
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
`;

// AFTER: Pixel container equivalent
export const PixelQuestionInterface: React.FC<{ 
  children: React.ReactNode;
  domain?: 'physics' | 'dosimetry' | 'linac' | 'planning';
}> = ({ children, domain }) => {
  return (
    <PixelContainer
      variant="question"
      size="xl"
      domain={domain}
      style={{
        display: 'flex',
        gap: '1.5rem',
        maxWidth: '1000px',
        margin: 'auto',
        fontFamily: 'VT323, monospace'
      }}
    >
      {children}
    </PixelContainer>
  );
};

// Pixel side panels for the question interface
export const PixelSidePanel: React.FC<{ 
  children: React.ReactNode;
  domain?: 'physics' | 'dosimetry' | 'linac' | 'planning';
  width?: string;
}> = ({ children, domain, width = '180px' }) => {
  return (
    <PixelContainer
      variant="panel"
      size="md"
      domain={domain}
      style={{
        flex: `0 0 ${width}`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center'
      }}
    >
      {children}
    </PixelContainer>
  );
};

// Example migration for ability card
const LegacyAbilityCard = styled.div<{ $affordable?: boolean; $active?: boolean }>`
  background-color: ${props => props.$affordable ? 'rgba(64, 64, 224, 0.3)' : 'rgba(64, 64, 64, 0.3)'};
  border: 1px solid ${props => props.$affordable ? '#33f' : '#555'};
  border-radius: 4px;
  padding: 0.8rem 1.2rem;
  cursor: ${props => props.$affordable ? 'pointer' : 'not-allowed'};
  transition: all 0.2s;
  
  &:hover {
    background-color: ${props => props.$affordable ? 'rgba(64, 64, 224, 0.5)' : 'rgba(64, 64, 64, 0.3)'};
  }
`;

// AFTER: Pixel ability card
export const PixelAbilityCard: React.FC<{
  children: React.ReactNode;
  affordable?: boolean;
  active?: boolean;
  domain?: 'physics' | 'dosimetry' | 'linac' | 'planning';
  onClick?: () => void;
}> = ({ children, affordable = true, active = false, domain, onClick }) => {
  return (
    <PixelContainer
      variant="ability"
      size="sm"
      domain={domain}
      isActive={active}
      isDisabled={!affordable}
      onClick={onClick}
    >
      {children}
    </PixelContainer>
  );
};

// Migration helper for tooltip components
export const PixelTooltip: React.FC<{
  children: React.ReactNode;
  position?: { x: number; y: number };
  visible?: boolean;
}> = ({ children, position, visible = true }) => {
  return (
    <PixelContainer
      variant="tooltip"
      size="xs"
      style={{
        position: 'absolute',
        left: position?.x || 0,
        top: position?.y || 0,
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.2s ease',
        zIndex: 1000,
        pointerEvents: 'none'
      }}
    >
      {children}
    </PixelContainer>
  );
};

// Demonstration component showing before/after comparison
export const MigrationDemo: React.FC = () => {
  return (
    <div style={{ padding: '2rem', backgroundColor: '#0f172a' }}>
      <h2 style={{ color: 'white', marginBottom: '2rem' }}>Container Migration Demo</h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        {/* BEFORE */}
        <div>
          <h3 style={{ color: '#94a3b8', marginBottom: '1rem' }}>BEFORE: CSS Styled</h3>
          <LegacyQuestionContainer>
            <p style={{ color: 'white', margin: 0 }}>
              Legacy container with CSS background, border-radius, and box-shadow
            </p>
          </LegacyQuestionContainer>
        </div>
        
        {/* AFTER */}
        <div>
          <h3 style={{ color: '#94a3b8', marginBottom: '1rem' }}>AFTER: Pixel Art</h3>
          <QuestionContainer size="md" domain="physics">
            <p style={{ color: 'white', margin: 0 }}>
              Pixel container with PNG background, borders, and corners
            </p>
          </QuestionContainer>
        </div>
      </div>
      
      {/* Ability Card Examples */}
      <div style={{ marginTop: '3rem' }}>
        <h3 style={{ color: '#94a3b8', marginBottom: '1rem' }}>Ability Card States</h3>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <PixelAbilityCard affordable={true} domain="physics">
            <span style={{ color: 'white' }}>Affordable</span>
          </PixelAbilityCard>
          
          <PixelAbilityCard affordable={false} domain="dosimetry">
            <span style={{ color: 'white' }}>Not Affordable</span>
          </PixelAbilityCard>
          
          <PixelAbilityCard affordable={true} active={true} domain="linac">
            <span style={{ color: 'white' }}>Active</span>
          </PixelAbilityCard>
        </div>
      </div>
    </div>
  );
};

// Export all migration utilities
export default {
  PixelMigrationWrapper,
  PixelQuestionInterface,
  PixelSidePanel,
  PixelAbilityCard,
  PixelTooltip,
  MigrationDemo
}; 