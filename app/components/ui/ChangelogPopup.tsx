"use client";

import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { colors, typography, shadows } from '@/app/styles/pixelTheme';
import { CHANGELOG_ENTRIES, type ChangelogEntry } from '@/app/utils/versionManager';

interface ChangelogPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

const slideIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
`;

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(4px);
  z-index: 1000;
  display: flex;
  justify-content: center;
  align-items: center;
  animation: ${fadeIn} 0.3s ease-out;
`;

const PopupContainer = styled.div`
  background: linear-gradient(135deg, ${colors.background} 0%, rgba(18, 22, 32, 0.95) 100%);
  border: 2px solid ${colors.active};
  border-radius: 8px;
  box-shadow: ${shadows.deep}, 0 0 30px rgba(132, 90, 245, 0.3);
  max-width: 600px;
  max-height: 80vh;
  width: 90%;
  overflow: hidden;
  animation: ${slideIn} 0.4s ease-out;
  position: relative;
`;

const Header = styled.div`
  background: linear-gradient(90deg, ${colors.treatmentPlanning}, ${colors.highlight});
  padding: 16px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 2px solid ${colors.active};
`;

const Title = styled.h2`
  color: ${colors.text};
  font-size: ${typography.fontSize.lg};
  font-weight: bold;
  margin: 0;
  text-shadow: ${typography.textShadow.pixel};
  display: flex;
  align-items: center;
  gap: 8px;
  
  &::before {
    content: '📋';
    font-size: 1.2em;
  }
`;

const CloseButton = styled.button`
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid ${colors.active};
  border-radius: 4px;
  color: ${colors.text};
  padding: 8px 12px;
  cursor: pointer;
  font-size: ${typography.fontSize.sm};
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: scale(1.05);
  }
  
  &:active {
    transform: scale(0.95);
  }
`;

const Content = styled.div`
  padding: 0;
  max-height: 60vh;
  overflow-y: auto;
  
  /* Custom scrollbar */
  &::-webkit-scrollbar {
    width: 8px;
  }
  
  &::-webkit-scrollbar-track {
    background: ${colors.background};
  }
  
  &::-webkit-scrollbar-thumb {
    background: ${colors.active};
    border-radius: 4px;
  }
  
  &::-webkit-scrollbar-thumb:hover {
    background: ${colors.highlight};
  }
`;

const VersionSection = styled.div`
  border-bottom: 1px solid rgba(132, 90, 245, 0.2);
  padding: 20px;
  
  &:last-child {
    border-bottom: none;
  }
`;

const VersionHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
`;

const VersionBadge = styled.span<{ $type: 'major' | 'minor' | 'patch' }>`
  background: ${props => 
    props.$type === 'major' ? colors.highlight :
    props.$type === 'minor' ? colors.treatmentPlanning :
    colors.active
  };
  color: ${colors.text};
  padding: 4px 8px;
  border-radius: 4px;
  font-size: ${typography.fontSize.xs};
  font-weight: bold;
  text-transform: uppercase;
`;

const VersionNumber = styled.h3`
  color: ${colors.text};
  font-size: ${typography.fontSize.md};
  margin: 0;
  font-weight: bold;
`;

const VersionDate = styled.span`
  color: ${colors.textDim};
  font-size: ${typography.fontSize.sm};
  margin-left: auto;
`;

const ChangesList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const ChangeItem = styled.li`
  color: ${colors.text};
  font-size: ${typography.fontSize.sm};
  line-height: 1.5;
  padding: 6px 0;
  padding-left: 20px;
  position: relative;
  
  &::before {
    content: '✨';
    position: absolute;
    left: 0;
    top: 6px;
  }
  
  &:nth-child(even)::before {
    content: '🔧';
  }
  
  &:nth-child(3n)::before {
    content: '🎯';
  }
`;

const Footer = styled.div`
  background: rgba(132, 90, 245, 0.1);
  padding: 16px 20px;
  border-top: 1px solid ${colors.active};
  text-align: center;
`;

const FooterText = styled.p`
  color: ${colors.textDim};
  font-size: ${typography.fontSize.sm};
  margin: 0;
  font-style: italic;
`;

// Changelog data is now imported from versionManager

export const ChangelogPopup: React.FC<ChangelogPopupProps> = ({ isOpen, onClose }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      // Prevent body scroll when popup is open
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!mounted || !isOpen) return null;

  return (
    <Overlay onClick={onClose}>
      <PopupContainer onClick={(e) => e.stopPropagation()}>
        <Header>
          <Title>Recent Updates</Title>
          <CloseButton onClick={onClose}>✕ Close</CloseButton>
        </Header>
        
        <Content>
          {CHANGELOG_ENTRIES.map((entry, index) => (
            <VersionSection key={index}>
              <VersionHeader>
                <VersionBadge $type={entry.type}>{entry.type}</VersionBadge>
                <VersionNumber>{entry.version}</VersionNumber>
                <VersionDate>{entry.date}</VersionDate>
              </VersionHeader>
              
              <ChangesList>
                {entry.changes.map((change, changeIndex) => (
                  <ChangeItem key={changeIndex}>{change}</ChangeItem>
                ))}
              </ChangesList>
            </VersionSection>
          ))}
        </Content>
        
        <Footer>
          <FooterText>
            Thank you for playtesting Rogue Resident! Your feedback helps shape the future of medical physics education.
          </FooterText>
        </Footer>
      </PopupContainer>
    </Overlay>
  );
}; 