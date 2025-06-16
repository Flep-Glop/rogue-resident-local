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
import { useLoading } from '@/app/providers/LoadingProvider';
import { useResourceStore } from '@/app/store/resourceStore';
// Import question components and types
import { 
  Question, MultipleChoiceQuestion as MultipleChoiceQuestionType,
  ProceduralQuestion as ProceduralQuestionType, ProceduralStep,
  MatchingQuestion as MatchingQuestionType,
  CalculationQuestion as CalculationQuestionType,
  BoastQuestion as BoastQuestionType
} from '@/app/types/questions';
import MultipleChoiceQuestion from '@/app/components/questions/MultipleChoiceQuestion';
import ProceduralQuestion from '@/app/components/questions/ProceduralQuestion';
import MatchingQuestion from '@/app/components/questions/MatchingQuestion';
import CalculationQuestion from '@/app/components/questions/CalculationQuestion';
import BoastQuestion from '@/app/components/questions/BoastQuestion';
import QuestionFeedback from '@/app/components/questions/QuestionFeedback';

// Add Day 1 imports
import { Day1SceneId } from '@/app/types/day1';
import { day1Scenes } from '@/app/data/day1Scenes';

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

// Add a modal styled component for displaying questions
const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
`;

const ModalContainer = styled.div`
  background-color: ${colors.background};
  border-radius: 8px;
  border: ${borders.medium};
  width: 90%;
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
  ${pixelTheme.mixins.scrollable}
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  padding: ${spacing.md};
  border-bottom: ${borders.thin};
`;

const ModalTitle = styled.h3`
  font-size: ${typography.fontSize.lg};
  margin: 0;
`;

const ModalCloseButton = styled.button`
  background: none;
  border: none;
  font-size: ${typography.fontSize.lg};
  cursor: pointer;
  color: ${colors.text};
  
  &:hover {
    color: ${colors.error};
  }
`;

const ModalContent = styled.div`
  padding: ${spacing.md};
`;

// Defines string literal type for question types
type QuestionTypeString = 'multipleChoice' | 'matching' | 'procedural' | 'calculation' | 'boast';

export default function DebugPanel() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedConceptId, setSelectedConceptId] = useState<string>("");
  const [selectedMentorId, setSelectedMentorId] = useState<MentorId>(MentorId.GARCIA);
  const [selectedDialogueId, setSelectedDialogueId] = useState<string>("");
  
  // Add Day 1 state
  const [selectedDay1Scene, setSelectedDay1Scene] = useState<Day1SceneId>(Day1SceneId.ARRIVAL);
  
  // New state for question testing
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [activeQuestionType, setActiveQuestionType] = useState<QuestionTypeString>('multipleChoice');
  const [questionAnswer, setQuestionAnswer] = useState<any>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  
  const { 
    currentPhase, 
    currentSeason,
    daysPassed,
    currentTime,
    resources,
    setPhase,
    setSeason,
    advanceTime,
    addStarPoints,
    resetDay,
    setDay1Scene
  } = useGameStore();
  
  // Import the ResourceStore hooks
  const { 
    momentum, 
    momentumMax,
    insight,
    starPoints,
    incrementMomentum, 
    resetMomentum,
    updateInsight,
    updateStarPoints,
    canBoast,
    _getMomentumLevel
  } = useResourceStore();
  
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

  // Loading transition test
  const { startLoading, stopLoading, isLoading } = useLoading();
  const testLoading = useCallback(async () => {
    console.log('Testing loading transition...');
    await startLoading();
    setTimeout(() => {
      console.log('Stopping test loading after 3 seconds');
      stopLoading();
    }, 3000);
  }, [startLoading, stopLoading]);

  // Phase controls
  const switchToDay = useCallback(() => setPhase(GamePhase.DAY), [setPhase]);
  const switchToNight = useCallback(() => setPhase(GamePhase.NIGHT), [setPhase]);
  
  // Time controls
  const advanceBy60 = useCallback(() => advanceTime(60), [advanceTime]);
  const advanceBy120 = useCallback(() => advanceTime(120), [advanceTime]);
  const jumpToEndOfDay = useCallback(() => advanceTime((17 - currentTime.hour) * 60 - currentTime.minute), [advanceTime, currentTime]);
  
  // Resource controls - use ResourceStore functions
  const addMomentumPoint = useCallback(() => incrementMomentum('debug_panel'), [incrementMomentum]);
  const maxMomentum = useCallback(() => {
    // Add momentum until we reach max
    const currentMomentum = useResourceStore.getState().momentum;
    for (let i = currentMomentum; i < useResourceStore.getState().momentumMax; i++) {
      incrementMomentum('debug_panel');
    }
  }, [incrementMomentum]);
  const clearMomentum = useCallback(() => resetMomentum('debug_panel'), [resetMomentum]);
  
  // Use ResourceStore's updateInsight for insight management
  const add10Insight = useCallback(() => updateInsight(10, 'debug_panel'), [updateInsight]);
  const add25Insight = useCallback(() => updateInsight(25, 'debug_panel'), [updateInsight]);
  const add50Insight = useCallback(() => updateInsight(50, 'debug_panel'), [updateInsight]);
  
  const add1SP = useCallback(() => updateStarPoints(1, 'debug_panel'), [updateStarPoints]);
  const add5SP = useCallback(() => updateStarPoints(5, 'debug_panel'), [updateStarPoints]);
  const add10SP = useCallback(() => updateStarPoints(10, 'debug_panel'), [updateStarPoints]);
  
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
  
  // Question sample data
  const sampleMultipleChoiceQuestion: MultipleChoiceQuestionType = {
    id: "mc1",
    type: 'multipleChoice',
    tags: {
      domain: KnowledgeDomain.RADIATION_THERAPY,
      subtopic: "Radiation Physics",
      difficulty: 2,
      mentor: selectedMentorId,
      knowledgeNode: "radiation_physics"
    },
    question: "Which of the following is a primary mechanism of cell damage from ionizing radiation?",
    options: [
      { text: "Direct damage to cell nucleus", isCorrect: false },
      { text: "DNA double-strand breaks", isCorrect: true },
      { text: "Cell membrane disruption", isCorrect: false },
      { text: "Mitochondrial damage", isCorrect: false }
    ],
    feedback: {
      correct: "Correct! DNA double-strand breaks are the most critical damage caused by ionizing radiation, leading to cell death if not properly repaired.",
      incorrect: "Incorrect. While radiation can cause various cellular damages, DNA double-strand breaks are the most critical damage mechanism."
    }
  };

  const sampleProceduralSteps: ProceduralStep[] = [
    { stepId: 1, stepText: "Position the patient on the treatment table", explanation: "Proper positioning is essential for treatment accuracy" },
    { stepId: 2, stepText: "Align the treatment room lasers with the patient's tattoos or marks", explanation: "Laser alignment ensures the treatment is delivered to the planned location" },
    { stepId: 3, stepText: "Capture verification images", explanation: "Images verify the patient position matches the treatment plan" },
    { stepId: 4, stepText: "Review and approve the position", explanation: "Final check before treatment delivery" },
    { stepId: 5, stepText: "Deliver the prescribed radiation dose", explanation: "Actual treatment delivery" }
  ];

  const sampleProceduralQuestion: ProceduralQuestionType = {
    id: "proc1",
    type: 'procedural',
    tags: {
      domain: KnowledgeDomain.RADIATION_THERAPY,
      subtopic: "Treatment Delivery",
      difficulty: 2,
      mentor: selectedMentorId,
      knowledgeNode: "treatment_delivery"
    },
    bankRef: "treatment_delivery_procedure",
    includeSteps: [1, 2, 3, 4, 5],
    difficulty: "intermediate",
    feedback: {
      correct: "Correct! You've properly sequenced the patient setup and treatment delivery steps.",
      incorrect: "The sequence isn't quite right. Review the proper patient setup and treatment delivery workflow."
    }
  };

  const sampleMatchingQuestion: MatchingQuestionType = {
    id: "match1",
    type: 'matching',
    tags: {
      domain: KnowledgeDomain.DOSIMETRY,
      subtopic: "Radiation Units",
      difficulty: 2,
      mentor: selectedMentorId,
      knowledgeNode: "radiation_units"
    },
    bankRef: "radiation_units",
    includeItems: [
      { itemId: "gray", matchIds: [1] },
      { itemId: "sievert", matchIds: [2] },
      { itemId: "becquerel", matchIds: [3] },
      { itemId: "rad", matchIds: [4] }
    ],
    difficulty: "intermediate",
    feedback: {
      correct: "Excellent! You've correctly matched the radiation units to their definitions.",
      incorrect: "Some matches are incorrect. Review the definitions of radiation measurement units."
    },
    // Additional properties needed for the component to function
    itemsData: [
      { id: "gray", text: "Gray (Gy)" },
      { id: "sievert", text: "Sievert (Sv)" },
      { id: "becquerel", text: "Becquerel (Bq)" },
      { id: "rad", text: "Rad" }
    ],
    matchesMap: {
      "gray": [{ id: 1, text: "Absorbed dose (1 J/kg)" }],
      "sievert": [{ id: 2, text: "Equivalent dose with tissue weighting factor" }],
      "becquerel": [{ id: 3, text: "Radioactivity (1 disintegration/second)" }],
      "rad": [{ id: 4, text: "Older unit of absorbed dose (0.01 Gy)" }]
    }
  };

  const sampleCalculationQuestion: CalculationQuestionType = {
    id: "calc1",
    type: 'calculation',
    tags: {
      domain: KnowledgeDomain.DOSIMETRY,
      subtopic: "Dose Calculations",
      difficulty: 2,
      mentor: selectedMentorId,
      knowledgeNode: "dose_calculation"
    },
    question: "Calculate the total dose received after 25 fractions of {dose} Gy each.",
    variables: [
      { name: "dose", range: [1.8, 2.2], unit: "Gy" }
    ],
    solution: [
      { step: "Multiply the dose per fraction by the number of fractions", isFormula: false },
      { step: "Total Dose = {dose} Gy × 25", isFormula: true },
      { step: "Total Dose = {result} Gy", isFormula: true }
    ],
    answer: {
      formula: "dose * 25 Gy",
      precision: 1
    },
    feedback: {
      correct: "Correct! You've accurately calculated the total dose over the entire treatment course.",
      incorrect: "That's not the correct total dose. Remember to multiply the dose per fraction by the total number of fractions."
    }
  };

  const sampleBoastQuestion: BoastQuestionType = {
    id: "boast1",
    type: 'boast',
    tags: {
      domain: KnowledgeDomain.TREATMENT_PLANNING,
      subtopic: "Treatment Techniques",
      difficulty: 3,
      mentor: selectedMentorId,
      knowledgeNode: "treatment_techniques"
    },
    question: "Which treatment technique is most appropriate for a small, well-defined brain metastasis?",
    options: [
      { text: "3D Conformal Radiation Therapy", isCorrect: false },
      { text: "Intensity Modulated Radiation Therapy (IMRT)", isCorrect: false },
      { text: "Stereotactic Radiosurgery (SRS)", isCorrect: true },
      { text: "Total Body Irradiation", isCorrect: false }
    ],
    feedback: {
      correct: "Excellent! Stereotactic Radiosurgery (SRS) is indeed the gold standard for treating small, well-defined brain metastases due to its high precision and steep dose fall-off.",
      incorrect: "That's not the optimal technique. Stereotactic Radiosurgery (SRS) is the preferred approach for small, well-defined brain metastases due to its precision and minimal damage to surrounding tissue."
    }
  };

  // Question handling functions
  const handleShowQuestion = (type: QuestionTypeString) => {
    setActiveQuestionType(type);
    setQuestionAnswer(null);
    setShowFeedback(false);
    setShowQuestionModal(true);
  };

  const handleQuestionAnswer = (answer: any) => {
    setQuestionAnswer(answer);
    setShowFeedback(true);
  };

  const handleCloseQuestionModal = () => {
    setShowQuestionModal(false);
    setActiveQuestionType('multipleChoice');
    setQuestionAnswer(null);
    setShowFeedback(false);
  };

  const handleContinue = () => {
    setShowFeedback(false);
    setQuestionAnswer(null);
  };

  // Determine if the answer is correct based on question type
  const isAnswerCorrect = () => {
    if (!questionAnswer) return false;

    switch (activeQuestionType) {
      case 'multipleChoice':
        return sampleMultipleChoiceQuestion.options[questionAnswer]?.isCorrect;
      
      case 'procedural':
        // A simple check: are the steps in ascending order?
        return questionAnswer.every((stepId: number, index: number) => 
          index === 0 || stepId > questionAnswer[index - 1]
        );
      
      case 'matching':
        // For this sample, we'll just return true for demo purposes
        return true;
      
      case 'calculation':
        // Using the sample question with dose = 2 Gy
        const expectedAnswer = 2 * 25; // 50 Gy
        return Math.abs(questionAnswer - expectedAnswer) < 0.1;
      
      case 'boast':
        return sampleBoastQuestion.options[questionAnswer]?.isCorrect;
      
      default:
        return false;
    }
  };

  // Generate currentVariables for calculation question
  const getCurrentVariables = () => {
    return { 
      dose: 2.0,
      result: 2.0 * 25
    };
  };

  // Render Question Content
  const renderQuestionContent = () => {
    if (!activeQuestionType) return null;

    switch (activeQuestionType) {
      case 'multipleChoice':
        return showFeedback ? (
          <QuestionFeedback 
            question={sampleMultipleChoiceQuestion}
            isCorrect={isAnswerCorrect()}
            answer={questionAnswer}
            expectedAnswer={sampleMultipleChoiceQuestion.options.findIndex(opt => opt.isCorrect)}
            masteryGained={isAnswerCorrect() ? 5 : 0}
            onContinue={handleContinue}
          />
        ) : (
          <MultipleChoiceQuestion 
            question={sampleMultipleChoiceQuestion}
            onAnswer={handleQuestionAnswer}
            disabled={showFeedback}
            showFeedback={showFeedback}
            feedback={showFeedback ? {
              correct: isAnswerCorrect(),
              message: isAnswerCorrect() 
                ? sampleMultipleChoiceQuestion.feedback.correct 
                : sampleMultipleChoiceQuestion.feedback.incorrect
            } : undefined}
          />
        );
      
      case 'procedural':
        return showFeedback ? (
          <QuestionFeedback 
            question={sampleProceduralQuestion}
            isCorrect={isAnswerCorrect()}
            answer={questionAnswer}
            expectedAnswer={[1, 2, 3, 4, 5]}
            masteryGained={isAnswerCorrect() ? 10 : 0}
            onContinue={handleContinue}
          />
        ) : (
          <ProceduralQuestion 
            question={sampleProceduralQuestion}
            steps={sampleProceduralSteps}
            onAnswer={handleQuestionAnswer}
            disabled={showFeedback}
            showFeedback={showFeedback}
            feedback={showFeedback ? {
              correct: isAnswerCorrect(),
              message: isAnswerCorrect() 
                ? sampleProceduralQuestion.feedback.correct 
                : sampleProceduralQuestion.feedback.incorrect,
              correctOrder: [1, 2, 3, 4, 5]
            } : undefined}
          />
        );
      
      case 'matching':
        return showFeedback ? (
          <QuestionFeedback 
            question={sampleMatchingQuestion}
            isCorrect={isAnswerCorrect()}
            answer={questionAnswer}
            expectedAnswer={{ "gray": 1, "sievert": 2, "becquerel": 3, "rad": 4 }}
            masteryGained={isAnswerCorrect() ? 7 : 0}
            onContinue={handleContinue}
          />
        ) : (
          <MatchingQuestion 
            question={sampleMatchingQuestion}
            onAnswer={handleQuestionAnswer}
            showFeedback={showFeedback}
            isCorrect={isAnswerCorrect()}
          />
        );
      
      case 'calculation':
        return showFeedback ? (
          <QuestionFeedback 
            question={sampleCalculationQuestion}
            isCorrect={isAnswerCorrect()}
            answer={questionAnswer}
            expectedAnswer={50}
            masteryGained={isAnswerCorrect() ? 8 : 0}
            onContinue={handleContinue}
          />
        ) : (
          <CalculationQuestion 
            question={sampleCalculationQuestion}
            onAnswer={handleQuestionAnswer}
            disabled={showFeedback}
            showFeedback={showFeedback}
            feedback={showFeedback ? {
              correct: isAnswerCorrect(),
              message: isAnswerCorrect() 
                ? sampleCalculationQuestion.feedback.correct 
                : sampleCalculationQuestion.feedback.incorrect
            } : undefined}
            currentVariables={getCurrentVariables()}
          />
        );
      
      case 'boast':
        return (
          <BoastQuestion 
            questions={[sampleBoastQuestion as any]}
            onSelectDifficulty={(difficultyLevel: number, riskFactor: number) => {
              // In a real implementation, this would create a challenge with the selected difficulty
              console.log(`Selected difficulty: ${difficultyLevel}, risk factor: ${riskFactor}`);
              // For demo purposes, just show the feedback
              handleQuestionAnswer(2); // Index of the correct answer
            }}
            onSkip={handleCloseQuestionModal}
            playerMastery={65}
          />
        );
      
      default:
        return null;
    }
  };

  // Add Day 1 scene controls
  const jumpToDay1Scene = useCallback(async (sceneId: Day1SceneId) => {
    // Prevent rapid clicking
    if (isLoading) {
      console.log('[DebugPanel] Already loading, ignoring click');
      return;
    }
    
    console.log(`[DebugPanel] Jumping to Day 1 scene: ${sceneId}`);
    
    try {
      // Start loading to prevent conflicts
      await startLoading();
      
      // First ensure we're in day phase
      switchToDay();
      
      // For Day 1, we need to reset time but keep daysPassed at 0
      // Don't use resetDay() as it increments daysPassed
      const { timeManager } = useGameStore.getState();
      const newTime = timeManager.resetToStartOfDay();
      
      // Reset to Day 1 state manually
      useGameStore.setState({ 
        currentTime: newTime,
        currentPhase: GamePhase.DAY,
        daysPassed: 0  // Keep at 0 for Day 1
      });
      
      // Reset momentum and insight for fresh start
      const resourceStore = useResourceStore.getState();
      resourceStore.resetMomentum('debug_panel_day1_reset');
      resourceStore.updateInsight(0 - resourceStore.insight, 'debug_panel_day1_reset'); // Clear existing insight
      
      // Clear any active dialogues to prevent conflicts
      const dialogueStore = useDialogueStore.getState();
      if (dialogueStore.activeDialogueId) {
        dialogueStore.endDialogue();
      }
      
      // Use the Day 1 scene setter from the hook
      setDay1Scene(sceneId);
      
      // Wait a moment for state to settle
      await new Promise(resolve => setTimeout(resolve, 500));
      
      console.log(`[DebugPanel] Day 1 scene set to: ${sceneId}`);
      
      await stopLoading();
    } catch (error) {
      console.error('Error jumping to Day 1 scene:', error);
      stopLoading();
    }
  }, [switchToDay, setDay1Scene, startLoading, stopLoading, isLoading]);

  // If panel is collapsed, just show the toggle button
  if (!isExpanded) {
    return (
      <DebugButton onClick={togglePanel}>
        🛠️ Debug
      </DebugButton>
    );
  }
  
  return (
    <>
      <PanelContainer>
        <PanelHeader>
          <PanelTitle>Debug Panel</PanelTitle>
          <CloseButton onClick={togglePanel}>
            ✕
          </CloseButton>
        </PanelHeader>
        
        <SectionsContainer>
          {/* System Tests Section */}
          <Section>
            <SectionTitle>System Tests</SectionTitle>
            <ButtonRow>
              <PixelButton onClick={testLoading} $color={colors.primary}>
                Test Loading
              </PixelButton>
              <PixelButton 
                onClick={() => {
                  console.log('[DebugPanel] Simple phase test - setting to DAY');
                  const gameStore = useGameStore.getState();
                  console.log('[DebugPanel] Current phase before:', gameStore.currentPhase);
                  gameStore.setPhase(GamePhase.DAY);
                  console.log('[DebugPanel] Current phase after:', useGameStore.getState().currentPhase);
                }}
                $color={colors.highlight}
              >
                Test Phase → DAY
              </PixelButton>
            </ButtonRow>
          </Section>
          
          {/* New Questions Section */}
          <Section>
            <SectionTitle>Questions</SectionTitle>
            <ButtonGrid>
              <PixelButton 
                onClick={() => handleShowQuestion('multipleChoice')} 
                $color={colors.radiationTherapy}
              >
                Multiple Choice
              </PixelButton>
              <PixelButton 
                onClick={() => handleShowQuestion('matching')} 
                $color={colors.linacAnatomy}
              >
                Matching
              </PixelButton>
              <PixelButton 
                onClick={() => handleShowQuestion('procedural')} 
                $color={colors.treatmentPlanning}
              >
                Procedural
              </PixelButton>
              <PixelButton 
                onClick={() => handleShowQuestion('calculation')} 
                $color={colors.dosimetry}
              >
                Calculation
              </PixelButton>
              <PixelButton 
                onClick={() => handleShowQuestion('boast')} 
                $color={colors.highlight}
                $fullWidth
              >
                Boast Challenge
              </PixelButton>
            </ButtonGrid>
          </Section>
          
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
              <StatusValue $color={colors.momentum}>{momentum}/{momentumMax}</StatusValue>
            </StatusRow>
            <StatusRow>
              <StatusLabel>Momentum Level:</StatusLabel>
              <StatusValue $color={colors.momentum}>{_getMomentumLevel()}</StatusValue>
            </StatusRow>
            <StatusRow>
              <StatusLabel>Insight:</StatusLabel>
              <StatusValue $color={colors.insight}>{insight}</StatusValue>
            </StatusRow>
            <StatusRow>
              <StatusLabel>Star Points:</StatusLabel>
              <StatusValue $color={colors.starPoints}>{starPoints}</StatusValue>
            </StatusRow>
            <StatusRow>
              <StatusLabel>Can Boast:</StatusLabel>
              <StatusValue $color={canBoast() ? colors.active : colors.error}>{canBoast() ? 'Yes' : 'No'}</StatusValue>
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
          
          {/* Day 1 Controls Section */}
          <Section>
            <SectionTitle>Day 1 Controls</SectionTitle>
            
            <SelectWrapper>
              <SelectLabel>Quick Navigation:</SelectLabel>
              <ButtonGrid>
                <PixelButton 
                  onClick={() => jumpToDay1Scene(Day1SceneId.PROLOGUE_INTRO)}
                  $color={colors.highlight}
                >
                  Start Prologue
                </PixelButton>
                <PixelButton 
                  onClick={() => jumpToDay1Scene(Day1SceneId.ARRIVAL)}
                  $color={colors.treatmentPlanning}
                >
                  Start Day 1
                </PixelButton>
              </ButtonGrid>
            </SelectWrapper>
            
            <SelectWrapper>
              <SelectLabel>Prologue Scene:</SelectLabel>
              <ButtonGrid>
                <PixelButton 
                  onClick={() => jumpToDay1Scene(Day1SceneId.PROLOGUE_INTRO)}
                  $color={colors.radiationTherapy}
                >
                  Complete Prologue
                </PixelButton>
              </ButtonGrid>
            </SelectWrapper>
            
            <SelectWrapper>
              <SelectLabel>Hospital Scenes:</SelectLabel>
              <ButtonGrid>
                <PixelButton 
                  onClick={() => jumpToDay1Scene(Day1SceneId.ARRIVAL)}
                  $color={colors.treatmentPlanning}
                >
                  Arrival
                </PixelButton>
                <PixelButton 
                  onClick={() => jumpToDay1Scene(Day1SceneId.BRIEF_TOUR)}
                  $color={colors.treatmentPlanning}
                >
                  Tour
                </PixelButton>
                <PixelButton 
                  onClick={() => jumpToDay1Scene(Day1SceneId.FIRST_PATIENT)}
                  $color={colors.treatmentPlanning}
                >
                  First Patient
                </PixelButton>
                <PixelButton 
                  onClick={() => jumpToDay1Scene(Day1SceneId.MEETING_JESSE)}
                  $color={colors.linacAnatomy}
                >
                  Meet Jesse
                </PixelButton>
                <PixelButton 
                  onClick={() => jumpToDay1Scene(Day1SceneId.MEETING_KAPOOR)}
                  $color={colors.dosimetry}
                >
                  Meet Kapoor
                </PixelButton>
                <PixelButton 
                  onClick={() => jumpToDay1Scene(Day1SceneId.QUINN_INTRODUCTION)}
                  $color={colors.highlight}
                >
                  Meet Quinn
                </PixelButton>
                <PixelButton 
                  onClick={() => jumpToDay1Scene(Day1SceneId.AFTERNOON_WITH_QUINN)}
                  $color={colors.highlight}
                >
                  Afternoon
                </PixelButton>
                <PixelButton 
                  onClick={() => jumpToDay1Scene(Day1SceneId.HILL_HOUSE_ARRIVAL)}
                  $color={colors.starGlow}
                >
                  Hill House
                </PixelButton>
                <PixelButton 
                  onClick={() => jumpToDay1Scene(Day1SceneId.FIRST_NIGHT)}
                  $color={colors.starGlow}
                >
                  First Night
                </PixelButton>
              </ButtonGrid>
            </SelectWrapper>
            
            <SmallText>
              Click any scene to jump directly there. The prologue is now a single scene with natural dialogue flow including name input and difficulty selection.
            </SmallText>
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

      {/* Question Modal */}
      {showQuestionModal && (
        <ModalOverlay>
          <ModalContainer>
            <ModalHeader>
              <ModalTitle>
                {activeQuestionType === 'multipleChoice' && "Multiple Choice Question"}
                {activeQuestionType === 'matching' && "Matching Question"}
                {activeQuestionType === 'procedural' && "Procedural Question"}
                {activeQuestionType === 'calculation' && "Calculation Question"}
                {activeQuestionType === 'boast' && "Boast Challenge"}
              </ModalTitle>
              <ModalCloseButton onClick={handleCloseQuestionModal}>✕</ModalCloseButton>
            </ModalHeader>
            <ModalContent>
              {renderQuestionContent()}
            </ModalContent>
          </ModalContainer>
        </ModalOverlay>
      )}
    </>
  );
} 