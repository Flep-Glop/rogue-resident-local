'use client';

/**
 * @deprecated This component uses mock data and is not connected to the knowledge store.
 * Please use @/app/components/phase/NightPhase.tsx instead which properly integrates with the knowledge store.
 */

import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useGameStore } from '@/app/store/gameStore';
import { centralEventBus, useEventSubscription } from '@/app/core/events/CentralEventBus';
import { GameEventType, GamePhase, KnowledgeDomain, KnowledgeStar } from '@/app/types';

// Mock data for discovered concepts during the day
const MOCK_DISCOVERED_CONCEPTS: Record<string, Partial<KnowledgeStar>> = {
  'IMRT_fundamentals': {
    id: 'IMRT_fundamentals',
    name: 'IMRT Fundamentals',
    description: 'Basic principles of Intensity Modulated Radiation Therapy.',
    domain: KnowledgeDomain.RADIATION_THERAPY,
    position: { x: 100, y: 150 },
    mastery: 0,
    connections: ['head_neck_treatment'],
    spCost: 2,
  },
  'head_neck_treatment': {
    id: 'head_neck_treatment',
    name: 'Head & Neck Treatment',
    description: 'Approaches to treating cancers in the head and neck region.',
    domain: KnowledgeDomain.TREATMENT_PLANNING,
    position: { x: 200, y: 120 },
    mastery: 0,
    connections: ['IMRT_fundamentals'],
    spCost: 3,
  },
  'qa_protocols': {
    id: 'qa_protocols',
    name: 'QA Protocols',
    description: 'Standard quality assurance protocols for radiation therapy equipment.',
    domain: KnowledgeDomain.DOSIMETRY,
    position: { x: 150, y: 250 },
    mastery: 0,
    connections: ['isocenter_verification'],
    spCost: 2,
  },
  'isocenter_verification': {
    id: 'isocenter_verification',
    name: 'Isocenter Verification',
    description: 'Methods to verify the accuracy of the radiation isocenter.',
    domain: KnowledgeDomain.LINAC_ANATOMY,
    position: { x: 250, y: 280 },
    mastery: 0,
    connections: ['qa_protocols'],
    spCost: 2,
  },
};

// Domain color mapping
const domainColors: Record<KnowledgeDomain, string> = {
  [KnowledgeDomain.TREATMENT_PLANNING]: '#3b82f6', // Blue
  [KnowledgeDomain.RADIATION_THERAPY]: '#10b981', // Green
  [KnowledgeDomain.LINAC_ANATOMY]: '#f59e0b', // Amber
  [KnowledgeDomain.DOSIMETRY]: '#ec4899', // Pink
};

// Styled Components
const Container = styled.div`
  background-color: #0f172a; /* bg-slate-900 */
  color: white;
  min-height: 100vh;
  padding: 1.5rem;
`;

const Content = styled.div`
  max-width: 64rem; /* max-w-4xl */
  margin: 0 auto;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
`;

const Title = styled.h1`
  font-size: 1.875rem; /* text-3xl */
  font-weight: bold;
`;

const ActionBar = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const StarPointBadge = styled.div`
  padding: 0.25rem 0.75rem;
  background-color: #1e293b; /* bg-slate-800 */
  border-radius: 0.375rem;
  display: flex;
  align-items: center;
`;

const StarIcon = styled.span`
  color: #c084fc; /* text-purple-400 */
  margin-right: 0.25rem;
`;

const ReturnButton = styled.button`
  padding: 0.5rem 1rem;
  background-color: #2563eb; /* bg-blue-600 */
  border-radius: 0.375rem;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: #1d4ed8; /* bg-blue-700 */
  }
`;

const GridLayout = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
  
  @media (min-width: 1024px) {
    grid-template-columns: 1fr 1fr;
  }
`;

const ConstellationPanel = styled.div`
  background-color: #1e293b; /* bg-slate-800 */
  border-radius: 0.5rem;
  padding: 1rem;
  height: 500px;
  position: relative;
  overflow: hidden;
`;

const PanelTitle = styled.h2`
  font-size: 1.25rem; /* text-xl */
  font-weight: 600;
  margin-bottom: 0.75rem;
`;

const ConstellationView = styled.div`
  position: absolute;
  inset: 0;
  margin-top: 3rem;
  background-color: #0f172a; /* bg-slate-900 */
  border-radius: 0.5rem;
  padding: 1rem;
`;

interface StarDotProps {
  x: number;
  y: number;
  color: string;
  isActive: boolean;
}

const StarDot = styled.div<StarDotProps>`
  position: absolute;
  width: 1.5rem; /* w-6 */
  height: 1.5rem; /* h-6 */
  border-radius: 9999px;
  cursor: pointer;
  transition: all 0.2s;
  left: ${props => props.x}px;
  top: ${props => props.y}px;
  background-color: ${props => props.color};
  box-shadow: ${props => props.isActive ? `0 0 15px 5px ${props.color}` : 'none'};
  ${props => props.isActive && `
    ring: 2px;
    ring-color: white;
    ring-opacity: 0.5;
  `}
`;

const ConstellationFooter = styled.div`
  position: absolute;
  bottom: 1rem;
  left: 1rem;
`;

const HelpText = styled.p`
  font-size: 0.875rem; /* text-sm */
  color: #94a3b8; /* text-slate-400 */
`;

const EmptyState = styled.div`
  background-color: #1e293b; /* bg-slate-800 */
  border-radius: 0.5rem;
  padding: 1rem;
  color: #94a3b8; /* text-slate-400 */
`;

const ConceptList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const ConceptCard = styled.div<{ borderColor: string }>`
  background-color: #1e293b; /* bg-slate-800 */
  border-radius: 0.5rem;
  padding: 1rem;
  border-left: 4px solid ${props => props.borderColor};
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const ConceptInfo = styled.div``;

const ConceptTitle = styled.h3`
  font-weight: 500;
`;

const ConceptMeta = styled.div`
  margin-top: 0.25rem;
`;

const DomainBadge = styled.span<{ bgColor: string, textColor: string }>`
  display: inline-block;
  padding: 0 0.5rem;
  font-size: 0.75rem;
  border-radius: 0.25rem;
  background-color: ${props => props.bgColor};
  color: ${props => props.textColor};
`;

const UnlockButton = styled.button`
  padding: 0.5rem 1rem;
  background-color: #4f46e5; /* bg-indigo-600 */
  border-radius: 0.375rem;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: #4338ca; /* bg-indigo-700 */
  }
  
  &:disabled {
    background-color: #4b5563; /* bg-gray-600 */
    cursor: not-allowed;
    opacity: 0.7;
  }
`;

const CostBadge = styled.span`
  background-color: rgba(255, 255, 255, 0.2);
  padding: 0.125rem 0.375rem;
  border-radius: 9999px;
  font-size: 0.75rem;
`;

const ActiveStarList = styled.div`
  margin-top: 1.5rem;
`;

const ActiveStarTitle = styled.h2`
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
`;

const NoActiveStar = styled.div`
  background-color: #1e293b; /* bg-slate-800 */
  border-radius: 0.5rem;
  padding: 1rem;
  color: #94a3b8; /* text-slate-400 */
  font-style: italic;
`;

const ActiveStarItem = styled.div<{ borderColor: string }>`
  background-color: #1e293b; /* bg-slate-800 */
  border-radius: 0.5rem;
  padding: 0.75rem 1rem;
  border-left: 4px solid ${props => props.borderColor};
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
`;

const DeactivateButton = styled.button`
  padding: 0.25rem 0.75rem;
  background-color: #475569; /* bg-slate-600 */
  border-radius: 0.25rem;
  font-size: 0.75rem;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: #334155; /* bg-slate-700 */
  }
`;

// The main NightPhase component
export default function NightPhase() {
  const { currentPhase, resources, setPhase, spendStarPoints, resetDay } = useGameStore();
  
  // Discovered concepts during the day
  const [discoveredConcepts, setDiscoveredConcepts] = useState<Record<string, Partial<KnowledgeStar>>>({});
  
  // Unlocked stars in the constellation
  const [unlockedStars, setUnlockedStars] = useState<Record<string, Partial<KnowledgeStar>>>({});
  
  // Active stars (toggled on for next day)
  const [activeStars, setActiveStars] = useState<Record<string, boolean>>({});
  
  // Listen for concept discovery events
  useEventSubscription<{ conceptId: string }>(
    GameEventType.CONCEPT_DISCOVERED,
    (event) => {
      if (!event.payload?.conceptId) return;
      
      const conceptId = event.payload.conceptId;
      
      // Add to discovered concepts if in our mock data
      if (MOCK_DISCOVERED_CONCEPTS[conceptId]) {
        setDiscoveredConcepts(prev => ({
          ...prev,
          [conceptId]: MOCK_DISCOVERED_CONCEPTS[conceptId]
        }));
      }
    },
    []
  );
  
  // For demo purposes, populate with some discovered concepts
  useEffect(() => {
    if (currentPhase === GamePhase.NIGHT && Object.keys(discoveredConcepts).length === 0) {
      // Add one random concept for demo
      const concepts = Object.values(MOCK_DISCOVERED_CONCEPTS);
      const randomConcept = concepts[Math.floor(Math.random() * concepts.length)];
      
      setDiscoveredConcepts({
        [randomConcept.id!]: randomConcept
      });
    }
  }, [currentPhase, discoveredConcepts]);
  
  // Handle unlocking a star
  const handleUnlockStar = (conceptId: string) => {
    const concept = discoveredConcepts[conceptId];
    if (!concept) return;
    
    const cost = concept.spCost || 2;
    
    // Check if player has enough SP
    if (spendStarPoints(cost)) {
      // Add to unlocked stars
      setUnlockedStars(prev => ({
        ...prev,
        [conceptId]: {
          ...concept,
          unlocked: true,
        }
      }));
      
      // Remove from discovered concepts
      setDiscoveredConcepts(prev => {
        const newDiscovered = { ...prev };
        delete newDiscovered[conceptId];
        return newDiscovered;
      });
      
      // Dispatch event
      centralEventBus.dispatch(
        GameEventType.STAR_UNLOCKED,
        { conceptId, name: concept.name },
        'NightPhase.handleUnlockStar'
      );
    }
  };
  
  // Handle toggling a star's active state
  const handleToggleStar = (conceptId: string) => {
    setActiveStars(prev => ({
      ...prev,
      [conceptId]: !prev[conceptId]
    }));
    
    // Dispatch event
    centralEventBus.dispatch(
      activeStars[conceptId] ? GameEventType.STAR_DEACTIVATED : GameEventType.STAR_ACTIVATED,
      { conceptId },
      'NightPhase.handleToggleStar'
    );
  };
  
  // Handle returning to day phase
  const handleReturnToDay = () => {
    // Convert remaining Insight to SP
    // This would normally be in gameStore
    const insightToConvert = resources.insight;
    const spGained = Math.floor(insightToConvert / 5); // 5:1 conversion ratio
    
    if (spGained > 0) {
      centralEventBus.dispatch(
        GameEventType.INSIGHT_CONVERTED,
        { amount: insightToConvert, spGained },
        'NightPhase.handleReturnToDay'
      );
    }
    
    // Reset day and go back to day phase
    resetDay();
    setPhase(GamePhase.DAY);
    
    centralEventBus.dispatch(
      GameEventType.DAY_PHASE_STARTED,
      { day: 2 },
      'NightPhase.handleReturnToDay'
    );
  };
  
  // Don't render if not in night phase
  if (currentPhase !== GamePhase.NIGHT) {
    return null;
  }
  
  return (
    <Container>
      <Content>
        <Header>
          <Title>Night Reflection</Title>
          <ActionBar>
            <StarPointBadge>
              <StarIcon>★</StarIcon>
              <span>{resources.starPoints}</span>
            </StarPointBadge>
            <ReturnButton onClick={handleReturnToDay}>
              Return to Hospital
            </ReturnButton>
          </ActionBar>
        </Header>
        
        <GridLayout>
          {/* Left side - Constellation View */}
          <ConstellationPanel>
            <PanelTitle>Knowledge Constellation</PanelTitle>
            <ConstellationView>
              {/* Simple placeholder visualization */}
              {Object.values(unlockedStars).map(star => (
                <StarDot 
                  key={star.id}
                  x={star.position?.x || 0}
                  y={star.position?.y || 0}
                  color={domainColors[star.domain!]}
                  isActive={activeStars[star.id!]}
                  onClick={() => handleToggleStar(star.id!)}
                  title={star.name}
                />
              ))}
            </ConstellationView>
            <ConstellationFooter>
              <HelpText>
                Click on stars to activate/deactivate them for the next day.
                <br />
                Active stars provide +1 Insight at the start of each day.
              </HelpText>
            </ConstellationFooter>
          </ConstellationPanel>
          
          {/* Right side - Discovered Concepts */}
          <div>
            <PanelTitle>Discovered Concepts</PanelTitle>
            
            {Object.keys(discoveredConcepts).length === 0 ? (
              <EmptyState>
                No new concepts discovered today.
              </EmptyState>
            ) : (
              <ConceptList>
                {Object.values(discoveredConcepts).map(star => (
                  <ConceptCard 
                    key={star.id} 
                    borderColor={domainColors[star.domain!]}
                  >
                    <ConceptInfo>
                      <ConceptTitle>{star.name}</ConceptTitle>
                      <ConceptMeta>
                        <DomainBadge 
                          bgColor={`${domainColors[star.domain!]}33`}
                          textColor={domainColors[star.domain!]}
                        >
                          {star.domain!.replace('_', ' ')}
                        </DomainBadge>
                      </ConceptMeta>
                    </ConceptInfo>
                    
                    <UnlockButton
                      onClick={() => handleUnlockStar(star.id!)}
                      disabled={resources.starPoints < (star.spCost || 0)}
                    >
                      Unlock
                      <CostBadge>{star.spCost} SP</CostBadge>
                    </UnlockButton>
                  </ConceptCard>
                ))}
              </ConceptList>
            )}
            
            {/* Active Stars Section */}
            <ActiveStarList>
              <ActiveStarTitle>Active Stars</ActiveStarTitle>
              
              {Object.entries(activeStars).filter(([_, isActive]) => isActive).length === 0 ? (
                <NoActiveStar>
                  No active stars. Activate stars to gain bonuses for the next day.
                </NoActiveStar>
              ) : (
                Object.entries(activeStars)
                  .filter(([_, isActive]) => isActive)
                  .map(([id]) => {
                    const star = unlockedStars[id];
                    return (
                      <ActiveStarItem 
                        key={id}
                        borderColor={domainColors[star.domain!]}
                      >
                        <div>
                          <div>{star.name}</div>
                          <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                            +1 Insight per day
                          </div>
                        </div>
                        <DeactivateButton onClick={() => handleToggleStar(id)}>
                          Deactivate
                        </DeactivateButton>
                      </ActiveStarItem>
                    );
                  })
              )}
            </ActiveStarList>
          </div>
        </GridLayout>
      </Content>
    </Container>
  );
} 