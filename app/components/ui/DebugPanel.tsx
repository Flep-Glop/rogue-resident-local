'use client';

import React, { useState, useCallback, useEffect } from 'react';
import styled from 'styled-components';
import { useGameStore } from '@/app/store/gameStore';
import { centralEventBus } from '@/app/core/events/CentralEventBus';
import { GameEventType, GamePhase, KnowledgeDomain, Season, MentorId } from '@/app/types';
import { useActivityStore } from '@/app/store/activityStore';
import { useKnowledgeStore } from '@/app/store/knowledgeStore';
import { useJournalStore } from '@/app/store/journalStore';
import { useDialogueStore } from '@/app/store/dialogueStore';
import { dialogues } from '@/app/data/dialogueData';
import pixelTheme, { colors, spacing, typography, borders, shadows } from '@/app/styles/pixelTheme';
import { initializeKnowledgeStore } from '@/app/data/conceptData';
import shuffle from 'lodash/shuffle';

// Styled components
const DebugButton = styled.button`
  position: fixed;
  top: ${spacing.md};
  right: ${spacing.md};
  background-color: ${colors.backgroundAlt};
  color: ${colors.text};
  padding: ${spacing.xs} ${spacing.sm};
  font-family: ${typography.fontFamily.pixel};
  font-size: ${typography.fontSize.sm};
  border: none;
  border-radius: 4px;
  box-shadow: ${shadows.pixelDrop};
  cursor: pointer;
  z-index: 50;
  
  &:hover {
    background-color: ${colors.highlight};
  }
`;

const PanelContainer = styled.div`
  position: fixed;
  top: 0;
  right: 0;
  width: 320px;
  height: 100vh;
  background-color: ${colors.background};
  color: ${colors.text};
  overflow-y: auto;
  box-shadow: -4px 0 8px rgba(0, 0, 0, 0.3);
  z-index: 50;
  padding: ${spacing.md};
  ${pixelTheme.mixins.scrollable}
  ${pixelTheme.mixins.pixelPerfect}
  border-left: ${borders.medium};
`;

const PanelHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${spacing.md};
`;

const PanelTitle = styled.h2`
  font-size: ${typography.fontSize.lg};
  font-weight: bold;
  text-shadow: ${typography.textShadow.pixel};
`;

const CloseButton = styled.button`
  background-color: ${colors.backgroundAlt};
  color: ${colors.text};
  padding: ${spacing.xs} ${spacing.sm};
  border: none;
  border-radius: 4px;
  cursor: pointer;
  
  &:hover {
    background-color: ${colors.error};
  }
`;

const SectionsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${spacing.lg};
`;

const Section = styled.section`
  border-bottom: ${borders.thin};
  padding-bottom: ${spacing.md};
  
  &:last-child {
    border-bottom: none;
  }
`;

const SectionTitle = styled.h3`
  font-size: ${typography.fontSize.md};
  font-weight: semibold;
  margin-bottom: ${spacing.sm};
  text-shadow: ${typography.textShadow.pixel};
`;

const StatusRow = styled.div`
  font-size: ${typography.fontSize.sm};
  margin-bottom: ${spacing.xs};
`;

const StatusLabel = styled.span`
  margin-right: ${spacing.xs};
`;

const StatusValue = styled.span<{ $color?: string }>`
  color: ${props => props.$color || colors.highlight};
`;

const ButtonRow = styled.div`
  display: flex;
  gap: ${spacing.xs};
  margin-top: ${spacing.xs};
`;

const ButtonGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${spacing.xs};
`;

const PixelButton = styled.button<{ 
  $color?: string;
  $disabled?: boolean;
  $fullWidth?: boolean;
}>`
  background-color: ${props => 
    props.$disabled 
      ? colors.inactive 
      : props.$color || colors.backgroundAlt
  };
  color: ${colors.text};
  padding: ${spacing.xs} ${spacing.sm};
  font-size: ${typography.fontSize.xs};
  border: none;
  border-radius: 4px;
  cursor: ${props => props.$disabled ? 'not-allowed' : 'pointer'};
  width: ${props => props.$fullWidth ? '100%' : 'auto'};
  transition: background-color 0.2s;
  
  &:hover {
    background-color: ${props => 
      props.$disabled 
        ? colors.inactive 
        : props.$color 
          ? `${props.$color}dd` // Add some transparency for hover effect
          : colors.highlight
    };
  }
`;

const SelectWrapper = styled.div`
  margin-bottom: ${spacing.sm};
`;

const SelectLabel = styled.label`
  display: block;
  font-size: ${typography.fontSize.sm};
  margin-bottom: ${spacing.xs};
`;

const PixelSelect = styled.select`
  width: 100%;
  background-color: ${colors.backgroundAlt};
  color: ${colors.text};
  border: ${borders.thin};
  border-radius: 4px;
  padding: ${spacing.xs};
  font-size: ${typography.fontSize.sm};
  margin-bottom: ${spacing.xs};
  
  &:focus {
    outline: none;
    border-color: ${colors.highlight};
  }
`;

const SmallText = styled.p`
  font-size: ${typography.fontSize.xs};
  margin-top: ${spacing.xs};
  color: ${colors.textDim};
`;

export default function DebugPanel() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedConceptId, setSelectedConceptId] = useState<string>("");
  const [selectedMentorId, setSelectedMentorId] = useState<MentorId>(MentorId.GARCIA);
  const [selectedDialogueId, setSelectedDialogueId] = useState<string>("");
  
  const { 
    currentPhase, 
    currentSeason,
    daysPassed,
    currentTime,
    resources,
    setPhase,
    setSeason,
    advanceTime,
    addMomentum,
    resetMomentum,
    addInsight,
    addStarPoints,
    resetDay
  } = useGameStore();
  
  const { generateAvailableActivities } = useActivityStore();
  
  // Knowledge store state and actions - separate selectors
  const stars = useKnowledgeStore(state => state.stars);
  const discoveredToday = useKnowledgeStore(state => state.discoveredToday);
  const discoverConcept = useKnowledgeStore(state => state.discoverConcept);
  const unlockStar = useKnowledgeStore(state => state.unlockStar);
  const toggleStarActive = useKnowledgeStore(state => state.toggleStarActive);
  const increaseMastery = useKnowledgeStore(state => state.increaseMastery);
  
  // Journal store state and actions
  const addConceptEntry = useJournalStore(state => state.addConceptEntry);
  const addMentorEntry = useJournalStore(state => state.addMentorEntry);
  const conceptEntries = useJournalStore(state => state.conceptEntries);
  const mentorEntries = useJournalStore(state => state.mentorEntries);

  // Dialogue store state and actions
  const startDialogue = useDialogueStore(state => state.startDialogue);
  const mentors = useDialogueStore(state => state.mentors);
  const updateMentorRelationship = useDialogueStore(state => state.updateMentorRelationship);
  
  // Initialize knowledge store when component mounts
  useEffect(() => {
    console.log('DebugPanel: Initializing knowledge store...');
    initializeKnowledgeStore(useKnowledgeStore);
    console.log('DebugPanel: Knowledge store initialized');
    console.log('Stars after initialization:', useKnowledgeStore.getState().stars);
  }, []);
  
  // Toggle debug panel visibility
  const togglePanel = useCallback(() => {
    setIsExpanded(!isExpanded);
  }, [isExpanded]);

  // Phase controls
  const switchToDay = useCallback(() => setPhase(GamePhase.DAY), [setPhase]);
  const switchToNight = useCallback(() => setPhase(GamePhase.NIGHT), [setPhase]);
  
  // Time controls
  const advanceBy60 = useCallback(() => advanceTime(60), [advanceTime]);
  const advanceBy120 = useCallback(() => advanceTime(120), [advanceTime]);
  const jumpToEndOfDay = useCallback(() => advanceTime((17 - currentTime.hour) * 60 - currentTime.minute), [advanceTime, currentTime]);
  
  // Resource controls
  const addMomentumPoint = useCallback(() => addMomentum(1), [addMomentum]);
  const maxMomentum = useCallback(() => addMomentum(3), [addMomentum]);
  const clearMomentum = useCallback(() => resetMomentum(), [resetMomentum]);
  
  const add10Insight = useCallback(() => addInsight(10), [addInsight]);
  const add25Insight = useCallback(() => addInsight(25), [addInsight]);
  const add50Insight = useCallback(() => addInsight(50), [addInsight]);
  
  const add1SP = useCallback(() => addStarPoints(1), [addStarPoints]);
  const add5SP = useCallback(() => addStarPoints(5), [addStarPoints]);
  const add10SP = useCallback(() => addStarPoints(10), [addStarPoints]);
  
  // Knowledge controls
  const discoverSelectedConcept = useCallback(() => {
    console.log('Attempting to discover concept:', selectedConceptId);
    console.log('Current stars object:', stars);
    
    if (selectedConceptId) {
      console.log('Stars object has this ID?', !!stars[selectedConceptId]);
      console.log('Star object:', stars[selectedConceptId]);
      
      // Check if the concept is already discovered
      if (stars[selectedConceptId]?.discovered) {
        console.log('Concept is already discovered:', selectedConceptId);
        console.log(`${stars[selectedConceptId].name} is already discovered!`);
        return;
      }
      
      discoverConcept(selectedConceptId, 'debug_panel');
      
      // Log after discovery attempt
      setTimeout(() => {
        console.log('Post-discovery - Star discovered?', 
          useKnowledgeStore.getState().stars[selectedConceptId]?.discovered);
        console.log(`Discovered: ${stars[selectedConceptId].name}`);
      }, 100);
    }
  }, [selectedConceptId, discoverConcept, stars]);
  
  const unlockSelectedConcept = useCallback(() => {
    if (selectedConceptId) {
      unlockStar(selectedConceptId);
    }
  }, [selectedConceptId, unlockStar]);
  
  const toggleActiveSelectedConcept = useCallback(() => {
    if (selectedConceptId) {
      toggleStarActive(selectedConceptId);
    }
  }, [selectedConceptId, toggleStarActive]);
  
  const increaseMasterySelectedConcept = useCallback((amount: number) => {
    if (selectedConceptId) {
      increaseMastery(selectedConceptId, amount);
    }
  }, [selectedConceptId, increaseMastery]);
  
  // Journal controls
  const addConceptNote = useCallback(() => {
    if (selectedConceptId && stars[selectedConceptId]) {
      const star = stars[selectedConceptId];
      addConceptEntry(
        selectedConceptId,
        `Notes on ${star.name}`,
        `These are my additional notes on ${star.name}. Added via debug panel.`,
        star.domain
      );
    }
  }, [selectedConceptId, stars, addConceptEntry]);
  
  const addMentorNote = useCallback(() => {
    if (selectedMentorId) {
      addMentorEntry(
        selectedMentorId,
        `Notes from meeting with ${getMentorName(selectedMentorId)}`,
        `This is a record of my meeting with ${getMentorName(selectedMentorId)}. Added via debug panel.`
      );
    }
  }, [selectedMentorId, addMentorEntry]);
  
  // Get mentor name from ID
  const getMentorName = (mentorId: MentorId) => {
    const mentorNames: Record<MentorId, string> = {
      [MentorId.GARCIA]: 'Dr. Garcia',
      [MentorId.KAPOOR]: 'Dr. Kapoor',
      [MentorId.JESSE]: 'Jesse',
      [MentorId.QUINN]: 'Dr. Quinn'
    };
    
    return mentorNames[mentorId] || mentorId;
  };
  
  // Season controls
  const cycleSeason = useCallback(() => {
    const seasons = [Season.SPRING, Season.SUMMER, Season.FALL, Season.WINTER];
    const currentIndex = seasons.indexOf(currentSeason);
    const nextIndex = (currentIndex + 1) % seasons.length;
    setSeason(seasons[nextIndex]);
  }, [currentSeason, setSeason]);
  
  // Refresh activities
  const refreshActivities = useCallback(() => {
    generateAvailableActivities();
  }, [generateAvailableActivities]);
  
  // Start selected dialogue
  const startSelectedDialogue = useCallback(() => {
    if (selectedDialogueId) {
      startDialogue(selectedDialogueId);
    }
  }, [selectedDialogueId, startDialogue]);
  
  // Increase mentor relationship
  const increaseMentorRelationship = useCallback((amount: number) => {
    if (selectedMentorId) {
      updateMentorRelationship(selectedMentorId, amount);
    }
  }, [selectedMentorId, updateMentorRelationship]);
  
  // If panel is collapsed, just show the toggle button
  if (!isExpanded) {
    return (
      <DebugButton onClick={togglePanel}>
        🛠️ Debug
      </DebugButton>
    );
  }
  
  return (
    <PanelContainer>
      <PanelHeader>
        <PanelTitle>Debug Panel</PanelTitle>
        <CloseButton onClick={togglePanel}>
          ✕
        </CloseButton>
      </PanelHeader>
      
      <SectionsContainer>
        {/* Game State */}
        <Section>
          <SectionTitle>Game State</SectionTitle>
          <StatusRow>
            <StatusLabel>Phase:</StatusLabel>
            <StatusValue $color={colors.treatmentPlanning}>{currentPhase}</StatusValue>
          </StatusRow>
          <StatusRow>
            <StatusLabel>Season:</StatusLabel>
            <StatusValue $color={colors.radiationTherapy}>{currentSeason}</StatusValue>
          </StatusRow>
          <StatusRow>
            <StatusLabel>Day:</StatusLabel>
            <StatusValue $color={colors.linacAnatomy}>{daysPassed + 1}</StatusValue>
          </StatusRow>
          <StatusRow>
            <StatusLabel>Time:</StatusLabel>
            <StatusValue $color={colors.dosimetry}>
              {currentTime.hour}:{currentTime.minute.toString().padStart(2, '0')}
            </StatusValue>
          </StatusRow>
        </Section>
        
        {/* Resources */}
        <Section>
          <SectionTitle>Resources</SectionTitle>
          <StatusRow>
            <StatusLabel>Momentum:</StatusLabel>
            <StatusValue $color={colors.momentum}>{resources.momentum}/3</StatusValue>
          </StatusRow>
          <StatusRow>
            <StatusLabel>Insight:</StatusLabel>
            <StatusValue $color={colors.insight}>{resources.insight}</StatusValue>
          </StatusRow>
          <StatusRow>
            <StatusLabel>Star Points:</StatusLabel>
            <StatusValue $color={colors.starPoints}>{resources.starPoints}</StatusValue>
          </StatusRow>
        </Section>
        
        {/* Phase Controls */}
        <Section>
          <SectionTitle>Phase Controls</SectionTitle>
          <ButtonRow>
            <PixelButton 
              onClick={switchToDay}
              $color={colors.treatmentPlanning}
              $disabled={currentPhase === GamePhase.DAY}
            >
              Day Phase
            </PixelButton>
            <PixelButton 
              onClick={switchToNight}
              $color={colors.highlight}
              $disabled={currentPhase === GamePhase.NIGHT}
            >
              Night Phase
            </PixelButton>
          </ButtonRow>
        </Section>
        
        {/* Time Controls */}
        <Section>
          <SectionTitle>Time Controls</SectionTitle>
          <ButtonGrid>
            <PixelButton onClick={advanceBy60}>
              +1 hour
            </PixelButton>
            <PixelButton onClick={advanceBy120}>
              +2 hours
            </PixelButton>
            <PixelButton onClick={jumpToEndOfDay}>
              End day
            </PixelButton>
            <PixelButton onClick={resetDay} $color={colors.error}>
              Reset to 8 AM
            </PixelButton>
          </ButtonGrid>
        </Section>
        
        {/* Resource Controls */}
        <Section>
          <SectionTitle>Resource Controls</SectionTitle>
          
          <StatusLabel>Momentum:</StatusLabel>
          <ButtonRow>
            <PixelButton 
              onClick={addMomentumPoint}
              $color={colors.momentum}
            >
              +1
            </PixelButton>
            <PixelButton 
              onClick={maxMomentum}
              $color={colors.momentum}
            >
              Max (3)
            </PixelButton>
            <PixelButton 
              onClick={clearMomentum}
              $color={colors.error}
            >
              Reset
            </PixelButton>
          </ButtonRow>
          
          <StatusLabel>Insight:</StatusLabel>
          <ButtonRow>
            <PixelButton 
              onClick={add10Insight}
              $color={colors.insight}
            >
              +10
            </PixelButton>
            <PixelButton 
              onClick={add25Insight}
              $color={colors.insight}
            >
              +25
            </PixelButton>
            <PixelButton 
              onClick={add50Insight}
              $color={colors.insight}
            >
              +50
            </PixelButton>
          </ButtonRow>
          
          <StatusLabel>Star Points:</StatusLabel>
          <ButtonRow>
            <PixelButton 
              onClick={add1SP}
              $color={colors.starPoints}
            >
              +1
            </PixelButton>
            <PixelButton 
              onClick={add5SP}
              $color={colors.starPoints}
            >
              +5
            </PixelButton>
            <PixelButton 
              onClick={add10SP}
              $color={colors.starPoints}
            >
              +10
            </PixelButton>
          </ButtonRow>
        </Section>
        
        {/* Knowledge Controls */}
        <Section>
          <SectionTitle>Knowledge Controls</SectionTitle>
          
          <SelectWrapper>
            <SelectLabel htmlFor="concept-select">Select Concept:</SelectLabel>
            <PixelSelect
              id="concept-select"
              value={selectedConceptId}
              onChange={(e) => setSelectedConceptId(e.target.value)}
            >
              <option value="">-- Choose a concept --</option>
              {Object.values(stars).map(star => (
                <option key={star.id} value={star.id}>
                  {star.name} ({star.discovered ? 'Discovered' : 'Hidden'})
                </option>
              ))}
            </PixelSelect>
          </SelectWrapper>
          
          <ButtonGrid>
            <PixelButton 
              onClick={discoverSelectedConcept}
              $color={colors.radiationTherapy}
              $disabled={!selectedConceptId || stars[selectedConceptId]?.discovered}
            >
              Discover
            </PixelButton>
            <PixelButton 
              onClick={unlockSelectedConcept}
              $color={colors.treatmentPlanning}
              $disabled={!selectedConceptId}
            >
              Unlock
            </PixelButton>
            <PixelButton 
              onClick={toggleActiveSelectedConcept}
              $color={colors.highlight}
              $disabled={!selectedConceptId}
            >
              Toggle Active
            </PixelButton>
            <PixelButton 
              onClick={() => increaseMasterySelectedConcept(10)}
              $color={colors.dosimetry}
              $disabled={!selectedConceptId}
            >
              +10% Mastery
            </PixelButton>
          </ButtonGrid>
          
          {/* Add new button for discovering multiple stars */}
          <ButtonRow style={{ marginTop: spacing.sm }}>
            <PixelButton 
              onClick={() => {
                // Find all undiscovered stars
                const undiscoveredStars = Object.values(stars).filter(star => !star.discovered);
                
                // If no undiscovered stars, show a message
                if (undiscoveredStars.length === 0) {
                  console.log('All stars have already been discovered!');
                  return;
                }
                
                // Randomly select 3 (or fewer if less are available)
                const starsToDiscover = shuffle(undiscoveredStars).slice(0, 3);
                
                // Discover each selected star
                starsToDiscover.forEach(star => {
                  discoverConcept(star.id, 'debug_panel_bulk');
                });
                
                // Log to console instead of showing alert
                console.log(`Discovered ${starsToDiscover.length} stars: ${starsToDiscover.map(s => s.name).join(', ')}`);
              }}
              $color={colors.starGlow}
              $fullWidth
            >
              Discover 3 Random Stars
            </PixelButton>
          </ButtonRow>
          
          <SmallText>
            Concepts discovered today: {discoveredToday.length}
          </SmallText>
        </Section>
        
        {/* Journal Controls */}
        <Section>
          <SectionTitle>Journal Controls</SectionTitle>
          
          <PixelButton 
            onClick={addConceptNote}
            $color={colors.treatmentPlanning}
            $disabled={!selectedConceptId}
            $fullWidth
          >
            Add Note for Selected Concept
          </PixelButton>
          
          <SelectWrapper>
            <SelectLabel htmlFor="mentor-select">Select Mentor:</SelectLabel>
            <PixelSelect
              id="mentor-select"
              value={selectedMentorId}
              onChange={(e) => {
                const value = e.target.value;
                if (value === MentorId.GARCIA || 
                    value === MentorId.KAPOOR || 
                    value === MentorId.JESSE || 
                    value === MentorId.QUINN) {
                  setSelectedMentorId(value);
                }
              }}
            >
              <option value={MentorId.GARCIA}>Dr. Garcia</option>
              <option value={MentorId.KAPOOR}>Dr. Kapoor</option>
              <option value={MentorId.JESSE}>Jesse</option>
              <option value={MentorId.QUINN}>Dr. Quinn</option>
            </PixelSelect>
          </SelectWrapper>
          
          <PixelButton 
            onClick={addMentorNote}
            $color={colors.radiationTherapy}
            $disabled={!selectedMentorId}
            $fullWidth
          >
            Add Note for Selected Mentor
          </PixelButton>
        </Section>
        
        {/* Dialogue Controls */}
        <Section>
          <SectionTitle>Dialogue Controls</SectionTitle>
          
          {/* Select dialogue */}
          <SelectWrapper>
            <SelectLabel>Select Dialogue:</SelectLabel>
            <PixelSelect
              value={selectedDialogueId}
              onChange={(e) => setSelectedDialogueId(e.target.value)}
            >
              <option value="">-- Select Dialogue --</option>
              {Object.keys(dialogues).map(id => (
                <option key={id} value={id}>{dialogues[id].title}</option>
              ))}
            </PixelSelect>
            <PixelButton
              onClick={startSelectedDialogue}
              $disabled={!selectedDialogueId}
              $color={colors.treatmentPlanning}
              $fullWidth
            >
              Start Dialogue
            </PixelButton>
          </SelectWrapper>
          
          {/* Mentor relationships */}
          <SelectWrapper>
            <SelectLabel>Select Mentor:</SelectLabel>
            <PixelSelect
              value={selectedMentorId}
              onChange={(e) => {
                const value = e.target.value;
                if (value === MentorId.GARCIA || 
                    value === MentorId.KAPOOR || 
                    value === MentorId.JESSE || 
                    value === MentorId.QUINN) {
                  setSelectedMentorId(value);
                }
              }}
            >
              <option value={MentorId.GARCIA}>Dr. Garcia</option>
              <option value={MentorId.KAPOOR}>Dr. Kapoor</option>
              <option value={MentorId.JESSE}>Jesse</option>
              <option value={MentorId.QUINN}>Dr. Quinn</option>
            </PixelSelect>
            <ButtonRow>
              <PixelButton
                onClick={() => increaseMentorRelationship(5)}
                $disabled={!selectedMentorId}
                $color={colors.radiationTherapy}
              >
                +5 Relationship
              </PixelButton>
              <PixelButton
                onClick={() => increaseMentorRelationship(10)}
                $disabled={!selectedMentorId}
                $color={colors.radiationTherapy}
              >
                +10 Relationship
              </PixelButton>
            </ButtonRow>
          </SelectWrapper>
        </Section>
        
        {/* Miscellaneous Controls */}
        <Section>
          <SectionTitle>Misc. Controls</SectionTitle>
          
          <ButtonGrid>
            <PixelButton 
              onClick={cycleSeason}
              $color={colors.radiationTherapy}
            >
              Change Season
            </PixelButton>
            <PixelButton 
              onClick={refreshActivities}
              $color={colors.treatmentPlanning}
            >
              Refresh Activities
            </PixelButton>
            <PixelButton 
              onClick={() => {
                initializeKnowledgeStore(useKnowledgeStore);
                console.log('Knowledge store has been re-initialized!');
              }}
              $color={colors.dosimetry}
            >
              Reset Knowledge
            </PixelButton>
          </ButtonGrid>
        </Section>
      </SectionsContainer>
    </PanelContainer>
  );
} 