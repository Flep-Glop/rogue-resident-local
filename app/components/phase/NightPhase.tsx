import React, { useState, useCallback, useEffect } from 'react';
import { ConstellationView } from '../constellation/ConstellationView';
import { StarMap } from '../constellation/StarMap';
import { useGameStore } from '@/app/store/gameStore';
import { PhaseManager } from '@/app/core/phase/PhaseManager';
import { useKnowledgeStore } from '@/app/store/knowledgeStore';
import { JournalView } from '../journal/JournalView';
import styled from 'styled-components';
import { DomainColors, KnowledgeStar, KnowledgeDomain } from '@/app/types';
import pixelTheme, { colors, spacing, typography, shadows, borders } from '@/app/styles/pixelTheme';

const NightPhaseContainer = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  padding: ${spacing.lg};
  background: linear-gradient(to bottom, #121620, #090b12);
  color: ${colors.text};
  position: relative;
  ${pixelTheme.mixins.pixelPerfect}
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: 
      radial-gradient(circle at 20% 30%, rgba(76, 0, 255, 0.1) 0%, transparent 40%),
      radial-gradient(circle at 80% 70%, rgba(25, 0, 112, 0.15) 0%, transparent 40%);
    z-index: 0;
    pointer-events: none;
  }
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
  position: relative;
`;

const StarTooltip = styled.div<{ $x: number; $y: number; $visible: boolean }>`
  position: absolute;
  top: ${props => props.$y}px;
  left: ${props => props.$x}px;
  transform: translate(-50%, -100%);
  background-color: rgba(16, 20, 34, 0.95);
  padding: ${spacing.xs};
  border-radius: 4px;
  border: ${borders.medium};
  z-index: 10;
  font-family: ${typography.fontFamily.pixel};
  font-size: ${typography.fontSize.xs};
  min-width: 130px;
  max-width: 180px;
  pointer-events: none;
  opacity: ${props => props.$visible ? 1 : 0};
  transition: opacity 0.15s;
  box-shadow: ${shadows.sm};
  
  &::after {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    margin-left: -4px;
    border-width: 4px;
    border-style: solid;
    border-color: ${colors.backgroundAlt} transparent transparent transparent;
  }
`;

const TooltipTitle = styled.h4<{ $domainColor: string }>`
  font-size: ${typography.fontSize.sm};
  margin: 0 0 ${spacing.xs} 0;
  color: ${props => props.$domainColor};
  text-shadow: ${typography.textShadow.pixel};
`;

const TooltipStatus = styled.div<{ $unlocked: boolean }>`
  margin-top: ${spacing.xs};
  font-size: ${typography.fontSize.xs};
  color: ${props => props.$unlocked ? colors.highlight : colors.textDim};
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
  const [hoveredStar, setHoveredStar] = useState<KnowledgeStar | null>(null);
  const [selectedStar, setSelectedStar] = useState<KnowledgeStar | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  
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
  
  // Handle hovering over a star
  const handleStarHover = useCallback((star: KnowledgeStar | null, x: number, y: number) => {
    setHoveredStar(star);
    if (star) {
      setTooltipPosition({ x, y });
    }
  }, []);
  
  // Handle selecting a star (clicking)
  const handleStarSelect = useCallback((star: KnowledgeStar | null, x: number, y: number) => {
    if (star) {
      if (selectedStar && selectedStar.id === star.id) {
        // If clicking the same star, deselect it
        setSelectedStar(null);
      } else {
        // Select the new star
        setSelectedStar(star);
      }
    }
  }, [selectedStar]);
  
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
            <StarMap 
              onStarHover={handleStarHover}
              onStarSelect={handleStarSelect}
              selectedStarId={selectedStar?.id}
            />
            
            {/* Star tooltip - only shown on hover, not for selected stars */}
            {hoveredStar && (
              <StarTooltip 
                $x={tooltipPosition.x}
                $y={tooltipPosition.y}
                $visible={!!hoveredStar}
              >
                <TooltipTitle 
                  $domainColor={DomainColors[hoveredStar.domain || KnowledgeDomain.TREATMENT_PLANNING]}
                >
                  {hoveredStar.name || ''}
                </TooltipTitle>
                
                <TooltipStatus $unlocked={hoveredStar.unlocked || false}>
                  {hoveredStar.unlocked ? 'Unlocked' : `SP Cost: ${hoveredStar.spCost}`}
                </TooltipStatus>
              </StarTooltip>
            )}
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