'use client';

import React from 'react';
import Link from 'next/link';
import styled from 'styled-components';
import { TPSVisualizer } from '../components/tps/TPSVisualizer';
import { TPSControls } from '../components/tps/TPSControls';
import { useTPS } from '../components/tps/useTPS';

const TPSPageContainer = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: #111827;
  color: #e5e7eb;
  padding: 1rem;
  font-family: var(--font-vt323);
`;

const Header = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 1rem;
  border-bottom: 2px solid #4b5563;
  margin-bottom: 1rem;
`;

const Title = styled.h1`
  font-family: var(--font-press-start-2p);
  font-size: 1.5rem;
  color: #60a5fa;
  text-shadow: 2px 2px 0px #1f2937;
`;

const BackLink = styled(Link)`
  font-family: var(--font-press-start-2p);
  font-size: 0.8rem;
  color: #9ca3af;
  text-decoration: none;
  &:hover {
    color: #60a5fa;
  }
`;

const ContentContainer = styled.div`
  display: flex;
  flex-direction: row;
  flex: 1;
  gap: 1rem;
  
  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const VisualizerContainer = styled.div`
  flex: 3;
  background-color: #1f2937;
  border-radius: 0.5rem;
  padding: 1rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  display: flex;
  justify-content: center;
  align-items: center;
`;

const ControlsWrapper = styled.div`
  flex: 1;
  max-width: 320px;
  
  @media (max-width: 768px) {
    max-width: 100%;
  }
`;

const Footer = styled.footer`
  text-align: center;
  padding: 1rem;
  margin-top: 1rem;
  font-size: 0.8rem;
  color: #6b7280;
  border-top: 1px solid #374151;
`;

export default function TPSPage() {
  const { 
    ctData, 
    doseGrid, 
    beams, 
    isCalculating, 
    showIsocenter, 
    showBeams, 
    displayMode,
    addBeam, 
    removeBeam,
    updateBeam,
    toggleIsocenter, 
    toggleBeams,
    toggleDisplayMode
  } = useTPS();

  return (
    <TPSPageContainer>
      <Header>
        <Title>Treatment Planning System</Title>
        <BackLink href="/">← Back to Main</BackLink>
      </Header>
      
      <ContentContainer>
        <VisualizerContainer>
          <TPSVisualizer 
            ctData={ctData}
            doseGrid={doseGrid}
            beams={beams}
            isCalculating={isCalculating}
            showIsocenter={showIsocenter}
            showBeams={showBeams}
            displayMode={displayMode}
          />
        </VisualizerContainer>
        
        <ControlsWrapper>
          <TPSControls 
            beams={beams}
            onAddBeam={addBeam}
            onRemoveBeam={removeBeam}
            onUpdateBeam={updateBeam}
            isCalculating={isCalculating}
            showIsocenter={showIsocenter}
            showBeams={showBeams}
            displayMode={displayMode}
            onToggleIsocenter={toggleIsocenter}
            onToggleBeams={toggleBeams}
            onToggleDisplayMode={toggleDisplayMode}
          />
        </ControlsWrapper>
      </ContentContainer>
      
      <Footer>
        Simplified Treatment Planning System - Educational Demo
      </Footer>
    </TPSPageContainer>
  );
} 