'use client';

import React, { useState } from 'react';
import styled from 'styled-components';

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

const JournalContainer = styled.div`
  width: 98vw;
  max-width: 1800px;
  height: 95vh;
  background-image: url('/images/journal/journal-medium.png');
  background-size: contain;  /* Use contain to show full journal including bookmark */
  background-position: center;
  background-repeat: no-repeat;
  image-rendering: pixelated;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  display: flex;
  position: relative;
  overflow: hidden; /* Prevent scrollbars from card scaling */
`;

const CardHoldersOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: url('/images/journal/journal-medium-card-holders.png');
  background-size: contain;
  background-position: center;
  background-repeat: no-repeat;
  image-rendering: pixelated;
  pointer-events: none; /* Don't interfere with card interactions */
  z-index: 50; /* Above cards but below hovered cards */
  transform: none; /* Prevent any movement/dancing */
  will-change: auto; /* Prevent GPU acceleration issues */
`;

const LeftPage = styled.div`
  flex: 1;
  padding: 20px 40px 20px 60px; /* More padding on right and left to move cards right */
  background: transparent;
  display: flex;
  flex-direction: column;
  position: relative;
  justify-content: center;
  overflow: hidden; /* Prevent card overflow from creating scrollbars */
`;

const RightPage = styled.div`
  flex: 1;
  padding: 20px;
  background: transparent;
  display: flex;
  flex-direction: column;
  position: relative;
  justify-content: flex-end;
  align-items: center;
`;

const AbilitySlots = styled.div`
  display: flex;
  flex-direction: row;
  gap: 0px; /* Adjusted gap for smaller cards */
  justify-content: center;
  align-items: center;
  height: 300px; /* Reduced height for smaller cards */
  transform: translateY(-208px) translateX(40px); /* Move cards up and right */
  overflow: visible; /* Allow cards to scale beyond slot bounds */
`;

const AbilitySlot = styled.div<{ $isEmpty: boolean }>`
  width: 230px; /* Adjusted for 10% larger cards */
  height: 325px; /* Adjusted for 10% larger cards */
  border: ${({ $isEmpty }) => $isEmpty ? '2px dashed rgba(139, 69, 19, 0.3)' : 'none'};
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  transition: all 0.3s ease;
  position: relative;
  overflow: visible; /* Allow cards to scale beyond slot bounds */
  margin: 0 -7px; /* Negative margins to bring cards closer together */
  
  &:hover {
    border-color: rgba(139, 69, 19, 0.6);
    background: rgba(139, 69, 19, 0.05);
  }
`;

const CardFan = styled.div`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 370px; /* Adjusted height for 10% larger cards */
  display: flex;
  justify-content: center;
  align-items: flex-end;
  z-index: 1002;
  pointer-events: auto;
`;

const AbilityCard = styled.div<{ 
  $rarity: 'common' | 'rare' | 'epic' | 'legendary';
  $fanIndex?: number;
  $totalCards?: number;
  $isInFan?: boolean;
  $isAnimating?: boolean;
  $animationPhase?: 'slide-down' | 'slide-in' | 'none';
  $targetSlot?: number;
  $image?: string;
}>`
  width: 196px;
  height: 276px;
  background-image: url('${({ $image }) => $image || '/images/cards/card-laser-focus.png'}');
  background-size: contain;
  background-position: center;
  background-repeat: no-repeat;
  image-rendering: pixelated;
  cursor: pointer;
  transition: ${({ $isAnimating }) => $isAnimating ? 'none' : 'all 0.3s ease'};
  position: ${({ $isInFan, $isAnimating }) => ($isInFan || $isAnimating) ? 'absolute' : 'relative'};
  transform-origin: ${({ $isInFan }) => $isInFan ? 'center bottom' : 'center center'};
  z-index: ${({ $isInFan }) => $isInFan ? '10' : '20'}; /* Base z-index for layering */
  ${({ $isInFan, $fanIndex = 0, $totalCards = 1 }) => {
    if (!$isInFan) return '';
    
    const centerIndex = ($totalCards - 1) / 2;
    const rotationFactor = ($fanIndex - centerIndex) * 8; // 8 degrees per card
    const translateX = ($fanIndex - centerIndex) * 81; // Adjusted spacing for 10% larger cards
    const translateY = Math.abs($fanIndex - centerIndex) * 23; // Adjusted curve for 10% larger cards
    
    return `
      transform: translateX(${translateX}px) translateY(${translateY}px) rotate(${rotationFactor}deg);
      z-index: ${$fanIndex + 1};
    `;
  }}
  
  ${({ $isAnimating, $animationPhase, $targetSlot }) => {
    if (!$isAnimating || $animationPhase === 'none') return '';
    
    if ($animationPhase === 'slide-down') {
      return `
        animation: simpleSlideDown 0.4s ease-in forwards;
        z-index: 999;
      `;
    }
    
    if ($animationPhase === 'slide-in') {
      return `
        animation: simplePopIn 0.5s ease-out forwards;
        z-index: 300; /* High z-index to appear above card holders during animation */
      `;
    }
  }}
  
  &:hover {
    transform: ${({ $isInFan, $fanIndex = 0, $totalCards = 1 }) => {
      if (!$isInFan) return 'scale(1.03)'; /* Smaller scale for journal cards to prevent overflow */
      
      const centerIndex = ($totalCards - 1) / 2;
      const rotationFactor = ($fanIndex - centerIndex) * 8;
      const translateX = ($fanIndex - centerIndex) * 81;
      const translateY = Math.abs($fanIndex - centerIndex) * 23;
      
      return `translateX(${translateX}px) translateY(${translateY - 29}px) rotate(${rotationFactor}deg) scale(1.05)`;
    }};
    box-shadow: 0 15px 35px rgba(0, 0, 0, 0.5);
    filter: brightness(1.2);
    z-index: ${({ $isInFan }) => $isInFan ? '999' : '200'}; /* Much higher z-index for journal cards to appear above card holders */
  }
  
  @keyframes simpleSlideDown {
    0% {
      opacity: 1;
      transform: scale(1);
    }
    100% {
      opacity: 0;
      transform: translateY(100px) scale(0.7);
    }
  }
  
  @keyframes simplePopIn {
    0% {
      opacity: 0;
      transform: scale(0.3);
    }
    50% {
      opacity: 1;
      transform: scale(1.1);
    }
    100% {
      opacity: 1;
      transform: scale(1);
    }
  }
`;



const CloseButton = styled.button`
  position: absolute;
  top: 20px;
  right: 20px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 2px solid #8B4513;
  background: #F5F5DC;
  color: #8B4513;
  font-size: 20px;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  
  &:hover {
    background: #8B4513;
    color: #F5F5DC;
    transform: scale(1.1);
  }
`;

interface AbilityCardData {
  id: string;
  name: string;
  description: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  category: string;
  effect: string;
  image: string; // Add image property
}

interface AbilityCardInterfaceProps {
  onClose: () => void;
}

const exampleAbilities: AbilityCardData[] = [
  {
    id: 'laser-focus',
    name: 'Laser Focus',
    description: 'Increases accuracy when answering calculation questions. Your mind becomes razor-sharp for precise dose calculations.',
    rarity: 'rare',
    category: 'Mental',
    effect: '+20% accuracy',
    image: '/images/cards/card-laser-focus.png'
  },
  {
    id: 'perfect-path',
    name: 'Perfect Path',
    description: 'Find the optimal learning sequence for complex topics. Unlock hidden connections between concepts.',
    rarity: 'epic',
    category: 'Learning',
    effect: 'Optimal learning paths',
    image: '/images/cards/card-perfect-path.png'
  },
  {
    id: 'moving-target',
    name: 'Moving Target',
    description: 'Adapt to changing treatment scenarios with precision. Hit every target, no matter how complex the movement.',
    rarity: 'rare',
    category: 'Adaptation',
    effect: '+15% dynamic accuracy',
    image: '/images/cards/card-moving-target.png'
  },
  {
    id: 'fast-learner',
    name: 'Fast Learner',
    description: 'Absorb new knowledge at incredible speed. Your learning accelerates with each discovery.',
    rarity: 'common',
    category: 'Learning',
    effect: '+25% XP gain',
    image: '/images/cards/card-fast-learner.png'
  },
  {
    id: 'deep-insight',
    name: 'Deep Insight',
    description: 'Gain bonus insight points when discovering new knowledge. See connections others miss.',
    rarity: 'epic',
    category: 'Discovery',
    effect: '+25% insight',
    image: '/images/cards/card-laser-focus.png'
  },
  {
    id: 'steady-hands',
    name: 'Steady Hands',
    description: 'Maintain composure under pressure. Reduces mistakes during critical moments.',
    rarity: 'common',
    category: 'Performance',
    effect: 'Reduced penalties',
    image: '/images/cards/card-laser-focus.png'
  }
];

export default function AbilityCardInterface({ onClose }: AbilityCardInterfaceProps) {
  const [equippedAbilities, setEquippedAbilities] = useState<(AbilityCardData | null)[]>([null, null, null]);
  const [animatingCard, setAnimatingCard] = useState<{
    cardId: string;
    phase: 'slide-down' | 'slide-in' | 'none';
    targetSlot: number;
  } | null>(null);

  const handleCardClick = (card: AbilityCardData, event: React.MouseEvent) => {
    // Stop event bubbling to prevent closing the interface
    event.stopPropagation();
    
    // Don't allow clicks during animation
    if (animatingCard) return;
    
    // Find first empty slot
    const emptySlotIndex = equippedAbilities.findIndex(ability => ability === null);
    if (emptySlotIndex !== -1) {
      // Start slide-down animation
      setAnimatingCard({
        cardId: card.id,
        phase: 'slide-down',
        targetSlot: emptySlotIndex
      });
      
      // After slide-down completes, start slide-in
      setTimeout(() => {
        setAnimatingCard(prev => prev ? { ...prev, phase: 'slide-in' } : null);
        
        // After slide-in completes, finalize the card placement
        setTimeout(() => {
          const newEquipped = [...equippedAbilities];
          newEquipped[emptySlotIndex] = card;
          setEquippedAbilities(newEquipped);
          setAnimatingCard(null);
        }, 500); // slide-in duration
      }, 400); // slide-down duration
    }
  };

  const handleSlotClick = (index: number, event: React.MouseEvent) => {
    // Stop event bubbling to prevent closing the interface
    event.stopPropagation();
    
    // Remove ability from slot
    const newEquipped = [...equippedAbilities];
    newEquipped[index] = null;
    setEquippedAbilities(newEquipped);
  };

  const availableCards = exampleAbilities.filter(
    card => !equippedAbilities.some(equipped => equipped?.id === card.id)
  );
  
  // Hide card from fan during any animation phase
  const visibleCards = availableCards.filter(
    card => animatingCard?.cardId !== card.id
  );

  return (
    <>
      <InterfaceOverlay onClick={onClose}>
        <JournalContainer onClick={(e) => e.stopPropagation()}>
          <CloseButton onClick={onClose}>×</CloseButton>
          
          {/* Left Page - Equipped Abilities */}
          <LeftPage>
            <AbilitySlots>
              {equippedAbilities.map((ability, index) => (
                <AbilitySlot 
                  key={index} 
                  $isEmpty={!ability}
                  onClick={(e) => ability && handleSlotClick(index, e)}
                >
                                  {ability && (
                  <AbilityCard 
                    $rarity={ability.rarity}
                    $isInFan={false}
                    $image={ability.image}
                  />
                )}
                
                {/* Show animating card during slide-in phase for this slot */}
                {animatingCard?.phase === 'slide-in' && animatingCard?.targetSlot === index && (
                  <AbilityCard 
                    $rarity={exampleAbilities.find(card => card.id === animatingCard.cardId)?.rarity || 'common'}
                    $isInFan={false}
                    $isAnimating={true}
                    $animationPhase={animatingCard.phase}
                    $targetSlot={animatingCard.targetSlot}
                    $image={exampleAbilities.find(card => card.id === animatingCard.cardId)?.image}
                    onClick={(e) => e.stopPropagation()}
                  />
                )}
                </AbilitySlot>
              ))}
            </AbilitySlots>
          </LeftPage>

          {/* Right Page - Now Empty */}
          <RightPage>
          </RightPage>
          
          {/* Card Holders Overlay - positioned exactly like journal background but on top */}
          <CardHoldersOverlay />
        </JournalContainer>
      </InterfaceOverlay>
      
      {/* Card Fan at Bottom of Screen - Separate from overlay */}
      <CardFan>
        {visibleCards.map((card, index) => {
          const isAnimating = animatingCard?.cardId === card.id;
          return (
            <AbilityCard 
              key={card.id} 
              $rarity={card.rarity}
              $isInFan={true}
              $fanIndex={index}
              $totalCards={visibleCards.length}
              $isAnimating={isAnimating}
              $animationPhase={isAnimating ? animatingCard?.phase : 'none'}
              $targetSlot={isAnimating ? animatingCard?.targetSlot : undefined}
              $image={card.image}
              onClick={(e) => handleCardClick(card, e)}
            />
          );
        })}
        

              </CardFan>
      </>
    );
} 