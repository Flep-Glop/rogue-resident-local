'use client';

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useTutorialStore } from '@/app/store/tutorialStore';

// Card interface uses 640x360 internal coordinates (matching other game components)
const CARD_INTERFACE_INTERNAL_WIDTH = 640;
const CARD_INTERFACE_INTERNAL_HEIGHT = 360; // Perfect fit for 576x329px journal

const InterfaceOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(5px);
`;

const CardInterfaceContainer = styled.div`
  /* Modal scaling pattern - matches NarrativeDialogue architecture */
  width: ${CARD_INTERFACE_INTERNAL_WIDTH}px;
  height: ${CARD_INTERFACE_INTERNAL_HEIGHT}px;
  transform-origin: center center;
  transform: scale(var(--interface-scale));
  
  /* Interface styling */
  background-image: url('/images/journal/large-journal-bg.png');
  background-size: 576px 329px; /* Native 576x329 size, centered in container */
  background-position: center;
  background-repeat: no-repeat;
  image-rendering: pixelated;
  
  /* Layout */
  display: flex;
  position: relative;
  align-items: center;
  justify-content: center;
  
  /* Visual effects */
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  overflow: visible;
`;



const LeftPage = styled.div`
  /* Card slots area - left 60% of 640px = 384px */
  width: 384px;
  height: 100%;
  background: transparent;
  display: flex;
  flex-direction: column;
  position: relative;
  justify-content: center;
  align-items: center;
  padding: 20px;
`;

const RightPage = styled.div`
  /* Progress area - right 40% of 640px = 256px */
  width: 256px;
  height: 100%;
  background: transparent;
  display: flex;
  flex-direction: column;
  position: relative;
  justify-content: center;
  align-items: center;
  padding: 20px;
`;

// Removed unused styled components - interface now uses pure PNG backgrounds

// Pure PNG interface - no card data needed

interface AbilityCardInterfaceProps {
  onClose: () => void;
}

export default function AbilityCardInterface({ onClose }: AbilityCardInterfaceProps) {
  // Pure PNG interface - no card interactions needed
  const { currentStep, completeStep } = useTutorialStore();

  // === INTERFACE SCALING SYSTEM ===
  // Modal scaling pattern - matches NarrativeDialogue architecture
  useEffect(() => {
    const updateScale = () => {
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      const scaleX = viewportWidth / CARD_INTERFACE_INTERNAL_WIDTH;
      const scaleY = viewportHeight / CARD_INTERFACE_INTERNAL_HEIGHT;
      
      // Modal interface scaling - fits 640x360 canvas to viewport
      const interfaceScale = Math.min(scaleX, scaleY) * 0.8; // 0.8 for comfortable modal size
      
      document.documentElement.style.setProperty('--interface-scale', interfaceScale.toString());
      console.log(`[AbilityCardInterface] Interface scale: ${interfaceScale.toFixed(3)} (${viewportWidth}x${viewportHeight} → ${CARD_INTERFACE_INTERNAL_WIDTH}x${CARD_INTERFACE_INTERNAL_HEIGHT})`);
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  // Card interactions removed - pure PNG interface

  const handleSleep = () => {
    // Complete the tutorial step if this is part of abilities_desk_intro
    if (currentStep === 'abilities_desk_intro') {
      completeStep('abilities_desk_intro');
    }
    
    // Close the interface and transition to day 2
    onClose();
    
    // TODO: This will trigger day 2 transition in Phase 3
    console.log('[AbilityCardInterface] Sleep transition - Ready for Day 2!');
  };

  // Card variables removed - pure PNG interface

  return (
    <>
      <InterfaceOverlay onClick={onClose}>
        <CardInterfaceContainer onClick={(e) => e.stopPropagation()}>
          
          {/* Left Page - Display Quinn's card */}
          <LeftPage>
            {/* Quinn's Beginner's Focus card */}
            <div style={{
              width: '60px',
              height: '90px',
              backgroundImage: 'url(/images/journal/fast-learner.png)',
              backgroundSize: 'contain',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              imageRendering: 'pixelated',
              position: 'absolute',
              left: '80px',
              top: '140px',
              cursor: 'pointer'
            }} />
          </LeftPage>

          {/* Right Page - Clean PNG background only */}
          <RightPage>
            {/* Very small continue button */}
            <button 
              onClick={handleSleep}
              style={{
                position: 'absolute',
                bottom: '20px',
                right: '20px',
                padding: '2px 6px',
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.2)',
                color: 'rgba(255,255,255,0.6)',
                cursor: 'pointer',
                fontFamily: 'monospace',
                fontSize: '10px'
              }}
            >
              →
            </button>
          </RightPage>
          

          
        </CardInterfaceContainer>
      </InterfaceOverlay>
    </>
    );
} 