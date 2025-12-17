"use client";

import React, { useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { colors, typography } from '@/app/styles/pixelTheme';
import { CURRENT_VERSION, CHANGELOG_ENTRIES } from '@/app/utils/versionManager';

interface ChangelogPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
  z-index: 1000;
  display: flex;
  justify-content: center;
  align-items: center;
  animation: ${fadeIn} 0.2s ease-out;
`;

const Popup = styled.div`
  background: ${colors.background};
  border: 2px solid ${colors.active};
  border-radius: 4px;
  max-width: 400px;
  width: 90%;
  padding: 20px;
  animation: ${fadeIn} 0.3s ease-out;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid ${colors.active};
`;

const Title = styled.h2`
  color: ${colors.text};
  font-size: ${typography.fontSize.md};
  margin: 0;
`;

const Version = styled.span`
  color: ${colors.textDim};
  font-size: ${typography.fontSize.sm};
`;

const ChangesList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0 0 16px 0;
`;

const ChangeItem = styled.li`
  color: ${colors.text};
  font-size: ${typography.fontSize.sm};
  line-height: 1.6;
  padding: 4px 0;
  padding-left: 16px;
  position: relative;
  
  &::before {
    content: '•';
    position: absolute;
    left: 0;
    color: ${colors.highlight};
  }
`;

const CloseButton = styled.button`
  background: ${colors.active};
  border: none;
  border-radius: 4px;
  color: ${colors.text};
  padding: 8px 16px;
  cursor: pointer;
  font-size: ${typography.fontSize.sm};
  width: 100%;
  
  &:hover {
    background: ${colors.highlight};
  }
`;

export const ChangelogPopup: React.FC<ChangelogPopupProps> = ({ isOpen, onClose }) => {
  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;
    
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Get latest changelog entry
  const latest = CHANGELOG_ENTRIES[0];
  // Show max 5 changes
  const changes = latest?.changes.slice(0, 5) || [];

  return (
    <Overlay onClick={onClose}>
      <Popup onClick={(e) => e.stopPropagation()}>
        <Header>
          <Title>What&apos;s New</Title>
          <Version>{CURRENT_VERSION.version}</Version>
        </Header>
        
        <ChangesList>
          {changes.map((change, i) => (
            <ChangeItem key={i}>{change}</ChangeItem>
          ))}
        </ChangesList>
        
        <CloseButton onClick={onClose}>Close</CloseButton>
      </Popup>
    </Overlay>
  );
};
