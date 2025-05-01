import React, { useState, useCallback } from 'react';
import { ConstellationView } from '../constellation/ConstellationView';
import { StarMap } from '../constellation/StarMap';
import { useGameStore } from '@/app/store/gameStore';
import { PhaseManager } from '@/app/core/phase/PhaseManager';
import { useKnowledgeStore } from '@/app/store/knowledgeStore';
import { JournalView } from '../journal/JournalView';
import styled from 'styled-components';
import { DomainColors } from '@/app/types';
import pixelTheme, { colors, spacing, typography, shadows, borders } from '@/app/styles/pixelTheme';

const NightPhaseContainer = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  padding: ${spacing.lg};
  background: linear-gradient(to bottom, ${colors.background}, ${colors.backgroundAlt});
  color: ${colors.text};
  ${pixelTheme.mixins.pixelPerfect}
`;

const ConstellationNav = styled.div`
  position: fixed;
  bottom: ${spacing.md};
  right: ${spacing.md};
  display: flex;
  gap: ${spacing.xs};
  z-index: 10;
`;

const NavButton = styled.button`
  padding: ${spacing.xs} ${spacing.md};
  background-color: ${colors.backgroundAlt};
  color: ${colors.text};
  border: ${borders.medium};
  border-radius: 4px;
  cursor: pointer;
  font-family: ${typography.fontFamily.pixel};
  font-size: ${typography.fontSize.sm};
  text-shadow: ${typography.textShadow.pixel};
  transition: all 0.2s;
  
  &:hover {
    background-color: ${colors.highlight};
    transform: translateY(-2px);
    box-shadow: ${shadows.pixelDrop};
  }
`;

const StartDayButton = styled.button`
  padding: ${spacing.sm} ${spacing.lg};
  background-color: ${colors.highlight};
  color: ${colors.text};
  border: none;
  border-radius: 4px;
  font-family: ${typography.fontFamily.pixel};
  font-size: ${typography.fontSize.md};
  font-weight: 600;
  cursor: pointer;
  box-shadow: ${shadows.md};
  text-shadow: ${typography.textShadow.pixel};
  transition: all 0.2s;
  
  &:hover {
    background-color: ${colors.treatmentPlanning};
    transform: translateY(-2px);
    box-shadow: ${shadows.pixelDrop};
  }
`;

const FlexRow = styled.div`
  display: flex;
  gap: ${spacing.lg};
  margin-bottom: ${spacing.lg};
`;

const FlexColumn = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
`;

const D3Container = styled.div`
  width: 100%;
  height: 500px;
  margin-bottom: ${spacing.md};
  border: ${borders.medium};
  border-radius: 8px;
  overflow: hidden;
`;

const NewDiscoveriesPanel = styled.div`
  background-color: rgba(16, 20, 34, 0.85);
  border-radius: 8px;
  padding: ${spacing.md};
  margin-bottom: ${spacing.md};
  border: ${borders.medium};
  box-shadow: inset 0 0 8px rgba(0, 0, 0, 0.5);
`;

const SectionTitle = styled.h3`
  font-size: ${typography.fontSize.lg};
  font-weight: bold;
  margin-bottom: ${spacing.sm};
  color: ${colors.starGlow};
  text-shadow: ${typography.textShadow.pixel};
  display: flex;
  align-items: center;
  gap: ${spacing.xs};
  
  &::before {
    content: '★';
    color: ${colors.starGlow};
  }
`;

const DiscoveryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: ${spacing.sm};
  max-height: 250px;
  overflow-y: auto;
  ${pixelTheme.mixins.scrollable}
  padding-right: ${spacing.xs};
`;

const DiscoveryCard = styled.div<{ $domainColor: string; $unlocked: boolean }>`
  background-color: rgba(14, 17, 28, 0.8);
  padding: ${spacing.sm};
  border-radius: 6px;
  border-left: 3px solid ${props => props.$domainColor};
  font-size: ${typography.fontSize.sm};
  transition: transform 0.2s, box-shadow 0.2s;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  position: relative;
  overflow: hidden;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0,0,0,0.3);
    
    &::after {
      opacity: 0.1;
    }
  }
  
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, ${props => props.$domainColor}, transparent);
    opacity: 0.05;
    transition: opacity 0.2s;
  }
  
  /* Add glow effect when unlocked */
  ${props => props.$unlocked && `
    box-shadow: 0 0 8px ${props.$domainColor};
    border-color: ${props.$domainColor};
    border-width: 3px;
    
    &:hover {
      box-shadow: 0 0 12px ${props.$domainColor};
    }
  `}
`;

const DomainIndicator = styled.div<{ $domainColor: string }>`
  position: absolute;
  top: 0;
  right: 0;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: ${props => props.$domainColor};
  margin: ${spacing.xs};
  box-shadow: 0 0 4px ${props => props.$domainColor};
`;

const DiscoveryTitle = styled.h4`
  font-size: ${typography.fontSize.sm};
  margin-bottom: ${spacing.xs};
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  color: ${colors.text};
  line-height: 1.2;
  padding-right: ${spacing.sm};
`;

const DiscoveryDescription = styled.p`
  color: ${colors.textDim};
  font-size: ${typography.fontSize.xs};
  line-height: 1.4;
  margin-bottom: ${spacing.sm};
  height: 2.8em;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
`;

const UnlockButton = styled.button<{ $disabled: boolean; $unlocked?: boolean }>`
  padding: ${spacing.xs} ${spacing.sm};
  background-color: ${props => 
    props.$unlocked 
      ? DomainColors.TREATMENT_PLANNING 
      : props.$disabled 
        ? colors.inactive 
        : colors.starGlow
  };
  color: ${props => props.$disabled ? colors.textDim : colors.background};
  border: none;
  border-radius: 4px;
  font-size: ${typography.fontSize.xs};
  cursor: ${props => props.$unlocked ? 'default' : props.$disabled ? 'not-allowed' : 'pointer'};
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: ${props => props.$disabled ? 0.6 : 1};
  transition: all 0.2s;
  width: 100%;
  font-weight: bold;
  box-shadow: ${props => props.$disabled ? 'none' : shadows.sm};
  
  &:hover {
    background-color: ${props => 
      props.$unlocked 
        ? DomainColors.TREATMENT_PLANNING
        : props.$disabled 
          ? colors.inactive 
          : '#fde68a'
    };
    transform: ${props => props.$unlocked || props.$disabled ? 'none' : 'translateY(-1px)'};
  }
  
  &:active {
    transform: ${props => props.$unlocked || props.$disabled ? 'none' : 'translateY(1px)'};
  }
`;

const StarCost = styled.span`
  display: flex;
  align-items: center;
  gap: 2px;
  
  &::after {
    content: '★';
    color: inherit;
    font-size: ${typography.fontSize.xs};
  }
`;

const StatusFooter = styled.div`
  background-color: ${colors.backgroundAlt};
  border-radius: 8px;
  padding: ${spacing.md};
  margin-bottom: ${spacing.md};
  border: ${borders.medium};
  font-family: ${typography.fontFamily.pixel};
  color: ${colors.textDim};
`;

export const NightPhase: React.FC = () => {
  const [showJournal, setShowJournal] = useState(false);
  const [, forceUpdate] = useState({});
  
  const daysPassed = useGameStore(state => state.daysPassed);
  const resetDay = useGameStore(state => state.resetDay);
  const starPoints = useGameStore(state => state.resources.starPoints);
  
  const getActiveStars = useKnowledgeStore(state => state.getActiveStars);
  const getUnlockedStars = useKnowledgeStore(state => state.getUnlockedStars);
  const discoveredTodayIds = useKnowledgeStore(state => state.discoveredToday);
  const starsObject = useKnowledgeStore(state => state.stars);
  const unlockStar = useKnowledgeStore(state => state.unlockStar);
  const clearDailyDiscoveries = useKnowledgeStore(state => state.clearDailyDiscoveries);
  
  const newlyDiscoveredStars = discoveredTodayIds
    .map(id => starsObject[id])
    .filter(Boolean);
    
  const activeStars = getActiveStars();
  const unlockedStars = getUnlockedStars();
  
  const handleStartNewDay = useCallback(() => {
    const activeStars = getActiveStars();
    
    // Transition to day phase
    PhaseManager.transitionToDayPhase(
      daysPassed + 1,
      activeStars.length
    );
    
    // Clear discoveries from the current day before starting a new day
    clearDailyDiscoveries();
    
    // Reset day state
    resetDay();
  }, [daysPassed, getActiveStars, clearDailyDiscoveries, resetDay]);
  
  const toggleJournal = useCallback(() => {
    setShowJournal(prevState => !prevState);
  }, []);
  
  // Function to handle star unlocking with a UI update
  const handleUnlockStar = useCallback((starId: string) => {
    // Attempt to unlock the star
    const success = unlockStar(starId);
    
    // Force re-render if successful
    if (success) {
      forceUpdate({});
    }
  }, [unlockStar]);
  
  if (showJournal) {
    return (
      <NightPhaseContainer>
        <JournalView />
        <ConstellationNav>
          <NavButton onClick={toggleJournal}>
            Back to Constellation
          </NavButton>
        </ConstellationNav>
      </NightPhaseContainer>
    );
  }
  
  return (
    <NightPhaseContainer>
      {/* D3 and Discoveries Section */}
      <FlexRow>
        <FlexColumn>
          {/* D3 Visualization */}
          <D3Container>
            <StarMap />
          </D3Container>
          
          {/* New Discoveries */}
          {newlyDiscoveredStars.length > 0 && (
            <NewDiscoveriesPanel>
              <SectionTitle>New Discoveries!</SectionTitle>
              <DiscoveryGrid>
                {newlyDiscoveredStars.map(star => (
                  <DiscoveryCard 
                    key={star.id}
                    $domainColor={DomainColors[star.domain]}
                    $unlocked={star.unlocked}
                  >
                    <DomainIndicator $domainColor={DomainColors[star.domain]} />
                    <DiscoveryTitle>
                      {star.name}
                    </DiscoveryTitle>
                    <DiscoveryDescription>
                      {star.description.substring(0, 100)}
                    </DiscoveryDescription>
                    {star.unlocked ? (
                      <UnlockButton $disabled={false} $unlocked={true}>
                        Unlocked
                      </UnlockButton>
                    ) : (
                      <UnlockButton 
                        onClick={() => handleUnlockStar(star.id)}
                        $disabled={starPoints < star.spCost}
                      >
                        <StarCost>{star.spCost}</StarCost>
                      </UnlockButton>
                    )}
                  </DiscoveryCard>
                ))}
              </DiscoveryGrid>
            </NewDiscoveriesPanel>
          )}
          
          {/* Status Information */}
          <StatusFooter>
            Unlocked: {unlockedStars.length} / Discovered: {discoveredTodayIds.length + unlockedStars.length} (+{discoveredTodayIds.length} new)
            <br />
            Active Stars: {activeStars.length} (+{activeStars.length} Insight at day start)
          </StatusFooter>
        </FlexColumn>
      </FlexRow>
      
      {/* Button Bar */}
      <ConstellationNav>
        <NavButton onClick={toggleJournal}>
          Open Journal
        </NavButton>
        
        <StartDayButton onClick={handleStartNewDay}>
          Start New Day
        </StartDayButton>
      </ConstellationNav>
    </NightPhaseContainer>
  );
}; 