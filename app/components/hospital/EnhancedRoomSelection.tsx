'use client';

import React, { useState } from 'react';
import styled from 'styled-components';
import Image from 'next/image';
import { RoomProgressionManager, roomProgressions, RoomScenario } from '@/app/data/roomProgressionSystem';
import { useGameStore } from '@/app/store/gameStore';

// Styled Components
const RoomSelectionContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #1e3a8a 0%, #3730a3 50%, #1e1b4b 100%);
  overflow: hidden;
`;

const RoomGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 2rem;
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  height: 100vh;
  align-items: center;
`;

const RoomCard = styled.div<{ $isActive: boolean; $competencyLevel: string }>`
  background: ${props => props.$isActive 
    ? `linear-gradient(135deg, ${getCompetencyColor(props.$competencyLevel)}80 0%, ${getCompetencyColor(props.$competencyLevel)}40 100%)`
    : 'rgba(255, 255, 255, 0.1)'
  };
  border: 2px solid ${props => props.$isActive ? getCompetencyColor(props.$competencyLevel) : 'rgba(255, 255, 255, 0.2)'};
  border-radius: 16px;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
  position: relative;
  overflow: hidden;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    border-color: ${props => getCompetencyColor(props.$competencyLevel)};
  }
`;

const RoomHeader = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 1rem;
`;

const RoomIcon = styled.div`
  width: 48px;
  height: 48px;
  margin-right: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
`;

const RoomTitle = styled.h3`
  color: white;
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
`;

const CompetencyBadge = styled.div<{ $level: string }>`
  background: ${props => getCompetencyColor(props.$level)};
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  margin-left: auto;
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 4px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
  margin: 1rem 0;
  overflow: hidden;
`;

const ProgressFill = styled.div<{ $progress: number; $color: string }>`
  width: ${props => props.$progress}%;
  height: 100%;
  background: ${props => props.$color};
  transition: width 0.3s ease;
`;

const ScenarioList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const ScenarioItem = styled.div<{ $isAvailable: boolean }>`
  padding: 0.75rem;
  background: ${props => props.$isAvailable ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.05)'};
  border-radius: 8px;
  border-left: 3px solid ${props => props.$isAvailable ? '#10B981' : '#6B7280'};
  opacity: ${props => props.$isAvailable ? 1 : 0.6};
`;

const ScenarioTitle = styled.div`
  color: white;
  font-weight: 500;
  font-size: 0.9rem;
  margin-bottom: 0.25rem;
`;

const ScenarioMeta = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.7);
`;

const RewardDisplay = styled.div`
  font-size: 0.8rem;
  color: #FCD34D;
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ScenarioModal = styled.div`
  background: linear-gradient(135deg, #1e3a8a 0%, #3730a3 100%);
  border-radius: 16px;
  padding: 2rem;
  max-width: 500px;
  width: 90%;
  color: white;
`;

const ModalTitle = styled.h3`
  font-size: 1.5rem;
  margin-bottom: 1rem;
  color: white;
`;

const ModalDescription = styled.p`
  margin-bottom: 1.5rem;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.9);
`;

const ModalActions = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
`;

const ActionButton = styled.button<{ $variant: 'primary' | 'secondary' }>`
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  
  ${props => props.$variant === 'primary' ? `
    background: #10B981;
    color: white;
    &:hover { background: #059669; }
  ` : `
    background: rgba(255, 255, 255, 0.1);
    color: white;
    &:hover { background: rgba(255, 255, 255, 0.2); }
  `}
`;

// Helper function for competency colors
function getCompetencyColor(level: string): string {
  switch (level) {
    case 'beginner': return '#10B981';
    case 'intermediate': return '#F59E0B';
    case 'advanced': return '#EF4444';
    case 'expert': return '#8B5CF6';
    default: return '#6B7280';
  }
}

// Room icons mapping
const roomIcons: Record<string, string> = {
  'dosimetry-lab': '🔬',
  'linac-1': '⚡',
  'physics-office': '📊',
  'simulation-suite': '🎮'
};

interface EnhancedRoomSelectionProps {
  onRoomSelected: (roomId: string, scenarioId?: string) => void;
  onBack: () => void;
}

export default function EnhancedRoomSelection({ onRoomSelected, onBack }: EnhancedRoomSelectionProps) {
  const [selectedScenario, setSelectedScenario] = useState<{ roomId: string; scenario: RoomScenario } | null>(null);
  const gameStore = useGameStore();

  const handleRoomClick = (roomId: string) => {
    // For now, just select the room with the first available scenario
    const progression = roomProgressions[roomId];
    const availableScenarios = RoomProgressionManager.getAvailableScenarios(roomId, progression.competencyLevel);
    
    if (availableScenarios.length > 0) {
      setSelectedScenario({ roomId, scenario: availableScenarios[0] });
    } else {
      onRoomSelected(roomId);
    }
  };

  const handleScenarioStart = () => {
    if (selectedScenario) {
      onRoomSelected(selectedScenario.roomId, selectedScenario.scenario.id);
    }
    setSelectedScenario(null);
  };

  const calculateProgress = (roomId: string): number => {
    const progression = roomProgressions[roomId];
    const completed = progression.availableScenarios.filter(s => 
      progression.unlockedFeatures.includes(s.id)
    ).length;
    return (completed / progression.availableScenarios.length) * 100;
  };

  return (
    <RoomSelectionContainer>
      <RoomGrid>
        {Object.entries(roomProgressions).map(([roomId, progression]) => {
          const availableScenarios = RoomProgressionManager.getAvailableScenarios(roomId, progression.competencyLevel);
          const progress = calculateProgress(roomId);
          
          return (
            <RoomCard
              key={roomId}
              $isActive={availableScenarios.length > 0}
              $competencyLevel={progression.competencyLevel}
              onClick={() => handleRoomClick(roomId)}
            >
              <RoomHeader>
                <RoomIcon>{roomIcons[roomId] || '🏥'}</RoomIcon>
                <RoomTitle>{roomId.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}</RoomTitle>
                <CompetencyBadge $level={progression.competencyLevel}>
                  {progression.competencyLevel}
                </CompetencyBadge>
              </RoomHeader>

              <ProgressBar>
                <ProgressFill 
                  $progress={progress} 
                  $color={getCompetencyColor(progression.competencyLevel)} 
                />
              </ProgressBar>

              <ScenarioList>
                {progression.availableScenarios.slice(0, 3).map(scenario => {
                  const isAvailable = RoomProgressionManager.isScenarioUnlocked(
                    scenario, progression.competencyLevel, progression.visitCount
                  );

                  return (
                    <ScenarioItem key={scenario.id} $isAvailable={isAvailable}>
                      <ScenarioTitle>{scenario.title}</ScenarioTitle>
                      <ScenarioMeta>
                        <span>{scenario.estimatedDuration} min</span>
                        <RewardDisplay>⭐ {scenario.rewardsOffered.starPoints}</RewardDisplay>
                      </ScenarioMeta>
                    </ScenarioItem>
                  );
                })}
              </ScenarioList>
            </RoomCard>
          );
        })}
      </RoomGrid>

      {selectedScenario && (
        <ModalOverlay onClick={() => setSelectedScenario(null)}>
          <ScenarioModal onClick={e => e.stopPropagation()}>
            <ModalTitle>{selectedScenario.scenario.title}</ModalTitle>
            <ModalDescription>{selectedScenario.scenario.description}</ModalDescription>
            
            <div style={{ marginBottom: '1rem' }}>
              <strong>Duration:</strong> ~{selectedScenario.scenario.estimatedDuration} minutes<br/>
              <strong>Rewards:</strong> {selectedScenario.scenario.rewardsOffered.starPoints} Star Points, {selectedScenario.scenario.rewardsOffered.insights} Insights
            </div>

            <ModalActions>
              <ActionButton $variant="secondary" onClick={() => setSelectedScenario(null)}>
                Cancel
              </ActionButton>
              <ActionButton $variant="primary" onClick={handleScenarioStart}>
                Start Scenario
              </ActionButton>
            </ModalActions>
          </ScenarioModal>
        </ModalOverlay>
      )}
    </RoomSelectionContainer>
  );
} 