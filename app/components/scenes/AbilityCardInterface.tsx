'use client';

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useTutorialStore } from '@/app/store/tutorialStore';
import { useAbilityStore, AbilityCard } from '@/app/store/abilityStore';

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

// Card slot styling
const CardSlot = styled.div<{ $isEmpty?: boolean; $isSelected?: boolean }>`
  width: 60px;
  height: 90px;
  border: 2px solid rgba(255,255,255,0.3);
  border-radius: 4px;
  background: ${props => props.$isEmpty ? 'rgba(0,0,0,0.2)' : 'transparent'};
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  position: relative;
`;

const CardImage = styled.div<{ $imagePath: string }>`
  width: 100%;
  height: 100%;
  background-image: url(${props => props.$imagePath});
  background-size: contain;
  background-position: center;
  background-repeat: no-repeat;
  image-rendering: pixelated;
`;

const CardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-bottom: 20px;
`;

const AvailableCardsArea = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  max-height: 200px;
  overflow-y: auto;
  padding: 4px;
`;

const AvailableCard = styled.div<{ $isEquipped?: boolean }>`
  position: relative;
  width: 50px;
  height: 75px;
  background: ${props => props.$isEquipped ? 'rgba(76, 175, 80, 0.2)' : 'transparent'};
  border: 2px solid ${props => props.$isEquipped ? 'rgba(76, 175, 80, 0.8)' : 'rgba(255,255,255,0.3)'};
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  overflow: visible; /* Allow tooltip to extend beyond card */
  
  &:hover {
    border-color: ${props => props.$isEquipped ? 'rgba(76, 175, 80, 1)' : 'rgba(255,255,255,0.6)'};
    transform: scale(1.05);
  }
`;

const AvailableCardImage = styled.div<{ $imagePath: string }>`
  width: 100%;
  height: 100%;
  background-image: url(${props => props.$imagePath});
  background-size: contain;
  background-position: center;
  background-repeat: no-repeat;
  image-rendering: pixelated;
`;

// Hover tooltip for card information
const CardTooltip = styled.div<{ $visible: boolean }>`
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  margin-bottom: 8px;
  width: 160px;
  padding: 8px;
  background: rgba(0, 0, 0, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 4px;
  color: white;
  font-size: 10px;
  text-align: center;
  z-index: 100;
  pointer-events: none;
  
  opacity: ${props => props.$visible ? 1 : 0};
  transform: ${props => props.$visible ? 'translateX(-50%) translateY(0)' : 'translateX(-50%) translateY(5px)'};
  transition: opacity 0.2s ease, transform 0.2s ease;
  
  /* Tooltip arrow */
  &::after {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    border: 4px solid transparent;
    border-top-color: rgba(0, 0, 0, 0.9);
  }
`;

const CardInfo = styled.div`
  flex: 1;
  font-size: 10px;
  color: white;
`;

const SlotLabel = styled.div`
  font-size: 8px;
  color: rgba(255,255,255,0.6);
  text-align: center;
  margin-bottom: 5px;
`;

// Exclamation mark indicator for unequipped cards - smaller and subtler
const CardExclamationIndicator = styled.div<{ $visible: boolean }>`
  position: absolute;
  top: -3px;
  right: -3px;
  width: 8px;
  height: 8px;
  background: linear-gradient(135deg, #FFD700, #FFA500);
  border: 1px solid #FFFFFF;
  border-radius: 50%;
  z-index: 10;
  pointer-events: none;
  
  opacity: ${props => props.$visible ? 0.9 : 0}; /* Slightly less opaque */
  transform: ${props => props.$visible ? 'scale(1)' : 'scale(0.5)'};
  transition: opacity 0.3s ease, transform 0.3s ease;
  
  /* Gentler pulsing animation */
  animation: ${props => props.$visible ? 'cardExclamationPulse 3s ease-in-out infinite' : 'none'};
  
  /* Smaller CSS-based exclamation mark */
  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 1px;
    height: 4px;
    background: #000;
    border-radius: 0.5px;
  }
  
  &::after {
    content: '';
    position: absolute;
    bottom: 1.5px;
    left: 50%;
    transform: translateX(-50%);
    width: 1px;
    height: 1px;
    background: #000;
    border-radius: 50%;
  }
  
  @keyframes cardExclamationPulse {
    0%, 100% {
      transform: scale(1);
      box-shadow: 0 0 0 0 rgba(255, 215, 0, 0.4); /* Reduced intensity */
    }
    50% {
      transform: scale(1.05); /* Less dramatic scaling */
      box-shadow: 0 0 0 2px rgba(255, 215, 0, 0); /* Smaller glow */
    }
  }
`;

interface AbilityCardInterfaceProps {
  onClose: () => void;
}

export default function AbilityCardInterface({ onClose }: AbilityCardInterfaceProps) {
  const { currentStep, completeStep } = useTutorialStore();
  const { getUnlockedCards, getEquippedCards, toggleCard } = useAbilityStore();
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  const unlockedCards = getUnlockedCards();
  const equippedCards = getEquippedCards();

  // === INTERFACE SCALING SYSTEM ===
  useEffect(() => {
    const updateScale = () => {
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      const scaleX = viewportWidth / CARD_INTERFACE_INTERNAL_WIDTH;
      const scaleY = viewportHeight / CARD_INTERFACE_INTERNAL_HEIGHT;
      
      const interfaceScale = Math.min(scaleX, scaleY) * 0.8;
      
      document.documentElement.style.setProperty('--interface-scale', interfaceScale.toString());
      console.log(`[AbilityCardInterface] Interface scale: ${interfaceScale.toFixed(3)}`);
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  const handleCardClick = (card: AbilityCard) => {
    // Simply toggle the card - auto-equip to leftmost slot or unequip
    toggleCard(card.id);
  };

  const handleSleep = () => {
    if (currentStep === 'abilities_desk_intro') {
      completeStep('abilities_desk_intro');
    }
    onClose();
    console.log('[AbilityCardInterface] Sleep transition - Ready for Day 2!');
  };

  // Create array of 3 slots with equipped cards
  const slots = Array.from({ length: 3 }, (_, index) => {
    return equippedCards.find(card => card.slotIndex === index) || null;
  });

  return (
    <>
      <InterfaceOverlay onClick={onClose}>
        <CardInterfaceContainer onClick={(e) => e.stopPropagation()}>
          
          {/* Left Page - Equipment Slots */}
          <LeftPage>
            <div style={{ color: 'white', fontSize: '12px', marginBottom: '10px', textAlign: 'center' }}>
              Equipped Cards
            </div>
            <CardGrid>
              {slots.map((card, index) => (
                <div key={index}>
                  <SlotLabel>Slot {index + 1}</SlotLabel>
                  <CardSlot
                    $isEmpty={!card}
                    $isSelected={false}
                  >
                    {card && <CardImage $imagePath={card.cardImagePath} />}
                    {!card && <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '8px' }}>Empty</div>}
                  </CardSlot>
                </div>
              ))}
            </CardGrid>
          </LeftPage>

          {/* Right Page - Available Cards */}
          <RightPage>
            <div style={{ color: 'white', fontSize: '12px', marginBottom: '10px', textAlign: 'center' }}>
              Available Cards
            </div>
            <AvailableCardsArea>
              {unlockedCards.length === 0 ? (
                <div style={{ 
                  gridColumn: '1 / -1', 
                  color: 'rgba(255,255,255,0.5)', 
                  fontSize: '10px', 
                  textAlign: 'center',
                  padding: '20px'
                }}>
                  No cards unlocked yet.<br/>
                  Unlock stars to get ability cards!
                </div>
              ) : (
                unlockedCards.map(card => (
                  <AvailableCard
                    key={card.id}
                    $isEquipped={card.equipped}
                    onClick={() => handleCardClick(card)}
                    onMouseEnter={() => setHoveredCard(card.id)}
                    onMouseLeave={() => setHoveredCard(null)}
                  >
                    <AvailableCardImage $imagePath={card.cardImagePath} />
                    
                    {/* Hover tooltip with card information */}
                    <CardTooltip $visible={hoveredCard === card.id}>
                      <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{card.name}</div>
                      <div style={{ fontSize: '8px', opacity: 0.8, marginBottom: '4px' }}>
                        Cost: {card.cost} {card.type === 'insight' ? 'Insight' : card.type === 'momentum' ? 'Momentum' : 'Hybrid'}
                      </div>
                      <div style={{ fontSize: '8px', color: card.equipped ? '#4ade80' : '#ffa500' }}>
                        {card.equipped ? `✓ Equipped (Slot ${(card.slotIndex || 0) + 1})` : 'Click to equip'}
                      </div>
                    </CardTooltip>
                    
                    {/* Smaller exclamation mark for unequipped cards */}
                    <CardExclamationIndicator $visible={!card.equipped} />
                  </AvailableCard>
                ))
              )}
            </AvailableCardsArea>
            
            <button 
              onClick={handleSleep}
              style={{
                position: 'absolute',
                bottom: '20px',
                right: '20px',
                padding: '4px 8px',
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: 'white',
                cursor: 'pointer',
                fontFamily: 'monospace',
                fontSize: '10px',
                borderRadius: '2px'
              }}
            >
              Close
            </button>
          </RightPage>
        </CardInterfaceContainer>
      </InterfaceOverlay>
    </>
  );
} 