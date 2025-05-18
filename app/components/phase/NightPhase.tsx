'use client';

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { ConstellationView } from '../constellation/ConstellationView';
import { StarMap } from '../constellation/StarMap';
import { useGameStore } from '@/app/store/gameStore';
import { PhaseManager } from '@/app/core/phase/PhaseManager';
import { useKnowledgeStore } from '@/app/store/knowledgeStore';
import { JournalView } from '../journal/JournalView';
import styled, { css } from 'styled-components';
import { DomainColors, KnowledgeStar, KnowledgeDomain } from '@/app/types';
import pixelTheme, { colors, spacing, typography, shadows, borders } from '@/app/styles/pixelTheme';
import Image from 'next/image';
import { components } from '@/app/styles/pixelTheme';

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

const DiscoveryCard = styled.div<{ $domainColor: string; $unlocked: boolean; $isSelected?: boolean; $isActive?: boolean }>`
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
  
  /* Apply grayscale if not unlocked */
  ${props => !props.$unlocked && css`
    filter: grayscale(85%); /* Adjust percentage as needed */
    transition: filter 0.2s, transform 0.2s, box-shadow 0.2s;

    /* Ensure button is not greyscaled - Target UnlockButton component */
    & ${UnlockButton} {
      filter: grayscale(0%);
    }
    /* Ensure title and description are readable */
    & > h4, & > p {
        color: ${colors.textDim}; /* Adjust if needed for readability */
    }
  `}
  
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
  ${props => props.$unlocked && css`
    box-shadow: 0 0 8px ${props.$domainColor};
    border-color: ${props.$domainColor};
    border-width: 3px;
    
    &:hover {
      box-shadow: 0 0 12px ${props.$domainColor};
    }
  `}

  /* Add selected state styling */
  ${props => props.$isSelected && css`
    transform: scale(1.03);
    box-shadow: 0 0 12px ${colors.highlight}, 0 4px 8px rgba(0,0,0,0.4);
    border-color: ${colors.highlight};
    border-width: 2px;
    border-left-width: 4px; /* Keep left border distinct */
    border-left-color: ${props.$domainColor}; /* Keep domain color on left */
    opacity: 1; /* Ensure selected is fully opaque */
    background-color: rgba(30, 35, 55, 0.95); /* Distinct selected background */
    color: ${colors.text}; /* Ensure text is bright when selected */
    ${DiscoveryTitle} { 
      color: ${colors.text}; 
    }
    ${DiscoveryDescription} {
      color: ${colors.textDim}; 
    }

    &:hover {
        transform: scale(1.03); /* Maintain scale on hover when selected */
        box-shadow: 0 0 16px ${colors.highlight}, 0 6px 12px rgba(0,0,0,0.5);
    }
  `}

  /* Add visual distinction for active/inactive unlocked cards */
  ${props => props.$unlocked && css`
    /* Active Card Styling */
    ${props.$isActive && css`
      /* Example: Brighter border and glow */
      border-color: ${props.$domainColor};
      box-shadow: 0 0 12px rgba(255, 255, 255, 0.6), 0 0 6px ${props.$domainColor}; 
      background-color: rgba(25, 30, 45, 0.9); /* Brighter background */
      
      /* Ensure default text is bright */
      color: ${colors.text}; 
      ${DiscoveryTitle} { 
          color: ${colors.text}; 
      }
      ${DiscoveryDescription} {
          color: ${colors.textDim}; 
      }
    `}

    /* Inactive (but unlocked) Card Styling */
    ${!props.$isActive && css`
      /* Example: Significantly dimmed appearance */
      opacity: 0.75; /* Slightly more opaque */
      background-color: rgba(10, 12, 20, 0.8); /* Darker background */
      border-color: rgba(100, 100, 100, 0.4); /* Dimmer border */
      border-left-color: ${props.$domainColor}; /* Keep domain color visible */
      box-shadow: none; /* Remove glow for inactive */
      
      /* Dim the text */
      ${DiscoveryTitle} {
          color: ${colors.textDim}; 
      }
      ${DiscoveryDescription} {
          color: rgba(150, 150, 150, 0.6); /* Even dimmer description */
      }

      &:hover {
        opacity: 1; /* Bring back full opacity on hover */
      }
    `}
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

const UnlockButton = styled.button<{ $disabled: boolean; $unlocked?: boolean; $isActive?: boolean }>`
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
  
  /* Style adjustments for active/inactive states */
  ${props => props.$unlocked && css`
    background-color: ${props.$isActive ? colors.highlight : DomainColors.TREATMENT_PLANNING };
    color: ${colors.background};

    &:hover {
        background-color: ${props.$isActive ? '#fde68a' : colors.highlight }; /* Slightly different hover for activate/deactivate */
    }
  `}

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



// Add Sort controls container and button styles
const SortControls = styled.div`
  display: flex;
  gap: ${spacing.sm};
  margin-bottom: ${spacing.sm};
  padding-bottom: ${spacing.sm};
  border-bottom: 1px solid ${colors.border};
`;

const SortButton = styled.button<{ $active: boolean }>`
  padding: ${spacing.xs} ${spacing.sm};
  background-color: ${props => props.$active ? colors.highlight : colors.backgroundAlt};
  color: ${props => props.$active ? colors.background : colors.text};
  border: ${borders.medium};
  border-radius: 4px;
  cursor: pointer;
  font-family: ${typography.fontFamily.pixel};
  font-size: ${typography.fontSize.xs};
  text-shadow: ${typography.textShadow.pixel};
  transition: all 0.2s;
  opacity: ${props => props.$active ? 1 : 0.7};

  &:hover {
    background-color: ${colors.highlight};
    color: ${colors.background};
    opacity: 1;
  }
`;

// Add Filter controls container and button styles (similar to SortControls)
const FilterControls = styled.div`
  display: flex;
  gap: ${spacing.sm};
  margin-bottom: ${spacing.sm};
`;

const FilterButton = styled.button<{ $active: boolean }>`
  padding: ${spacing.xs} ${spacing.sm};
  background-color: ${props => props.$active ? colors.highlight : colors.backgroundAlt};
  color: ${props => props.$active ? colors.background : colors.text};
  border: ${borders.medium};
  border-radius: 4px;
  cursor: pointer;
  font-family: ${typography.fontFamily.pixel};
  font-size: ${typography.fontSize.xs};
  text-shadow: ${typography.textShadow.pixel};
  transition: all 0.2s;
  opacity: ${props => props.$active ? 1 : 0.7};

  &:hover {
    background-color: ${colors.highlight};
    color: ${colors.background};
    opacity: 1;
  }
`;

export const NightPhase: React.FC = () => {
  const [showJournal, setShowJournal] = useState(false);
  const [, forceUpdate] = useState({});
  const [hoveredStar, setHoveredStar] = useState<KnowledgeStar | null>(null);
  const [selectedStar, setSelectedStar] = useState<KnowledgeStar | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  
  // Sorting state
  type SortByType = 'default' | 'name' | 'domain' | 'unlocked';
  const [sortBy, setSortBy] = useState<SortByType>('default');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  // Filtering state
  type FilterByActiveType = 'all' | 'active' | 'inactive';
  const [filterByActive, setFilterByActive] = useState<FilterByActiveType>('all');
  
  const daysPassed = useGameStore(state => state.daysPassed);
  const resetDay = useGameStore(state => state.resetDay);
  const starPoints = useGameStore(state => state.resources.starPoints);
  const setHasVisitedNightPhase = useGameStore(state => state.setHasVisitedNightPhase);
  
  // Mark the night phase as visited since we removed the tutorial
  useEffect(() => {
    setHasVisitedNightPhase(true);
  }, [setHasVisitedNightPhase]);
  
  const getActiveStars = useKnowledgeStore(state => state.getActiveStars);
  const getUnlockedStars = useKnowledgeStore(state => state.getUnlockedStars);
  const discoveredTodayIds = useKnowledgeStore(state => state.discoveredToday);
  const starsObject = useKnowledgeStore(state => state.stars);
  const unlockStar = useKnowledgeStore(state => state.unlockStar);
  const clearDailyDiscoveries = useKnowledgeStore(state => state.clearDailyDiscoveries);
  const toggleStarActive = useKnowledgeStore(state => state.toggleStarActive); // Get activation function
  
  const newlyDiscoveredStars = discoveredTodayIds
    .map(id => starsObject[id])
    .filter(Boolean);
    
  // Memoized filtered and sorted stars list
  const processedDiscoveredStars = useMemo(() => {
    // 1. Filter
    const filteredStars = newlyDiscoveredStars.filter(star => {
      if (filterByActive === 'all') return true;
      if (filterByActive === 'active') return star.unlocked && star.active;
      if (filterByActive === 'inactive') return star.unlocked && !star.active;
      return true; // Should not happen, but default to showing
    });

    // 2. Sort (using a mutable copy of filtered list)
    const starsToSort = [...filteredStars];
    
    switch (sortBy) {
      case 'name':
        starsToSort.sort((a, b) => 
          sortDirection === 'asc' 
            ? a.name.localeCompare(b.name) 
            : b.name.localeCompare(a.name)
        );
        break;
      case 'domain':
        starsToSort.sort((a, b) => {
          const domainCompare = a.domain.localeCompare(b.domain);
          if (domainCompare !== 0) return sortDirection === 'asc' ? domainCompare : -domainCompare;
          // Secondary sort by name if domains are equal
          return a.name.localeCompare(b.name);
        });
        break;
      case 'unlocked':
        starsToSort.sort((a, b) => {
          const unlockedCompare = (a.unlocked ? 1 : 0) - (b.unlocked ? 1 : 0);
          if (unlockedCompare !== 0) return sortDirection === 'asc' ? unlockedCompare : -unlockedCompare;
           // Secondary sort by name if unlocked status is equal
          return a.name.localeCompare(b.name);
        });
        break;
      case 'default':
      default:
        // Keep original order (based on discoveredTodayIds)
        break;
    }
    return starsToSort;
  }, [newlyDiscoveredStars, sortBy, sortDirection, filterByActive]);
  
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
      // Scroll the discovery panel if the selected star is in the newly discovered list
      if (star && newlyDiscoveredStars.some(ds => ds.id === star.id)) {
        const cardElement = document.getElementById(`discovery-card-${star.id}`);
        cardElement?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [selectedStar, newlyDiscoveredStars]);
  
  // Function to handle star unlocking with a UI update
  const handleUnlockStar = useCallback((starId: string) => {
    // Attempt to unlock the star
    const success = unlockStar(starId);
    
    // Force re-render if successful
    if (success) {
      forceUpdate({});
    }
  }, [unlockStar]);
  
  // Function to handle sorting changes
  const handleSortChange = (newSortBy: SortByType) => {
    if (sortBy === newSortBy) {
      // If clicking the same sort type, toggle direction
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      // Otherwise, set the new sort type and default to ascending
      setSortBy(newSortBy);
      setSortDirection('asc');
    }
  };
  
  // Function to handle filter changes
  const handleFilterChange = (newFilter: FilterByActiveType) => {
    setFilterByActive(newFilter);
  };
  
  // Function to handle toggling star active status
  const handleToggleActive = useCallback((starId: string) => {
    toggleStarActive(starId);
    forceUpdate({}); // Force re-render to reflect active status change immediately
  }, [toggleStarActive]);
  
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
              {/* Filter Controls */} 
              <FilterControls>
                <FilterButton onClick={() => handleFilterChange('all')} $active={filterByActive === 'all'}>All Unlocked</FilterButton>
                <FilterButton onClick={() => handleFilterChange('active')} $active={filterByActive === 'active'}>Active Only</FilterButton>
                <FilterButton onClick={() => handleFilterChange('inactive')} $active={filterByActive === 'inactive'}>Inactive Only</FilterButton>
              </FilterControls>
              {/* Sort Controls */} 
              <SortControls>
                <SortButton onClick={() => handleSortChange('default')} $active={sortBy === 'default'}>Default</SortButton>
                <SortButton onClick={() => handleSortChange('name')} $active={sortBy === 'name'}>A-Z {sortBy === 'name' && (sortDirection === 'asc' ? '▲' : '▼')}</SortButton>
                <SortButton onClick={() => handleSortChange('domain')} $active={sortBy === 'domain'}>Domain {sortBy === 'domain' && (sortDirection === 'asc' ? '▲' : '▼')}</SortButton>
                <SortButton onClick={() => handleSortChange('unlocked')} $active={sortBy === 'unlocked'}>Unlocked {sortBy === 'unlocked' && (sortDirection === 'asc' ? '▲' : '▼')}</SortButton>
              </SortControls>
              <DiscoveryGrid>
                {/* Use processedDiscoveredStars */} 
                {processedDiscoveredStars.map((star: KnowledgeStar) => (
                  <DiscoveryCard 
                    key={star.id}
                    id={`discovery-card-${star.id}`}
                    $domainColor={DomainColors[star.domain]}
                    $unlocked={star.unlocked}
                    $isSelected={star.id === selectedStar?.id}
                    $isActive={star.active}
                  >
                    <DomainIndicator $domainColor={DomainColors[star.domain]} />
                    <DiscoveryTitle>
                      {star.name}
                    </DiscoveryTitle>
                    <DiscoveryDescription>
                      {star.description.substring(0, 100)}
                    </DiscoveryDescription>
                    {star.unlocked ? (
                      // Button for unlocked stars: Activate/Deactivate
                      <UnlockButton 
                        onClick={() => handleToggleActive(star.id)}
                        $disabled={false} 
                        $unlocked={true} 
                        $isActive={star.active}
                      >
                        {star.active ? 'Deactivate' : 'Activate'}
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