'use client';

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useSceneStore } from '@/app/store/sceneStore';
import { useTutorialStore } from '@/app/store/tutorialStore';
import { useDialogueStore } from '@/app/store/dialogueStore';
import { useGameStore } from '@/app/store/gameStore';
import { useKnowledgeStore } from '@/app/store/knowledgeStore';
import { centralEventBus } from '@/app/core/events/CentralEventBus';
import { GameEventType } from '@/app/types';

// Game development scenarios - the core of testing different parts of your game
export interface GameScenario {
  id: string;
  name: string;
  description: string;
  category: 'tutorial' | 'gameplay' | 'dialogue' | 'boss' | 'constellation' | 'custom';
  setup: () => void;
  teardown?: () => void;
  requiredStores?: string[];
}

// Pre-defined scenarios for different testing needs
const GAME_SCENARIOS: GameScenario[] = [
  // First Day Hospital Progression Scenarios
  {
    id: 'hospital_fresh_day',
    name: 'Fresh Day - Start',
    description: 'Clean start of first day tutorial with Dr. Garcia',
    category: 'tutorial',
    setup: () => {
      const tutorialStore = useTutorialStore.getState();
      const sceneStore = useSceneStore.getState();
      const dialogueStore = useDialogueStore.getState();
      
      // Reset everything to fresh state
      tutorialStore.resetTutorialProgress();
      dialogueStore.endDialogue();
      
      // Start tutorial at beginning (silently - no popup)
      tutorialStore.startTutorialSilently('first_day', 'morning_arrival');
      
      // Go to hospital view
      sceneStore.transitionToScene('hospital');
      
      // Clear any overlays that might have been triggered
      tutorialStore.dismissAllOverlays();
      
      console.log('🌅 Fresh day started - all rooms available, tutorial active');
    }
  },
  {
    id: 'hospital_before_lunch',
    name: 'Before Lunch',
    description: 'Hospital view right before lunch scene with Garcia activity completed',
    category: 'tutorial',
    setup: () => {
      const tutorialStore = useTutorialStore.getState();
      const sceneStore = useSceneStore.getState();
      const dialogueStore = useDialogueStore.getState();
      
      // Reset and set up tutorial state
      tutorialStore.resetTutorialProgress();
      dialogueStore.endDialogue();
      
      // Complete initial steps up to lunch (silently - no popup)
      tutorialStore.startTutorialSilently('first_day', 'morning_arrival');
      tutorialStore.completeStep('morning_arrival');
      tutorialStore.completeStep('hospital_tour');
      tutorialStore.completeStep('first_mentor_intro');
      tutorialStore.completeStep('first_educational_activity');
      
      // Set current step to lunch dialogue
      tutorialStore.skipToStep('lunch_dialogue');
      
      // Go to hospital view
      sceneStore.transitionToScene('hospital');
      
      // Clear any overlays that might have been triggered
      tutorialStore.dismissAllOverlays();
      
      console.log('🍽️ Pre-lunch state - Garcia activity completed, about to trigger lunch dialogue');
    }
  },
  {
    id: 'hospital_before_afternoon_choice',
    name: 'Before Jesse/Kapoor Activity',
    description: 'Hospital after lunch, only LINAC-1 and Dosimetry Lab available',
    category: 'tutorial',
    setup: () => {
      const tutorialStore = useTutorialStore.getState();
      const sceneStore = useSceneStore.getState();
      const dialogueStore = useDialogueStore.getState();
      
      // Reset and set up tutorial state
      tutorialStore.resetTutorialProgress();
      dialogueStore.endDialogue();
      
      // Complete steps up to second mentor choice (silently - no popup)
      tutorialStore.startTutorialSilently('first_day', 'morning_arrival');
      tutorialStore.completeStep('morning_arrival');
      tutorialStore.completeStep('hospital_tour');
      tutorialStore.completeStep('first_mentor_intro');
      tutorialStore.completeStep('first_educational_activity');
      tutorialStore.completeStep('lunch_dialogue');
      
      // Set current step to second mentor intro (afternoon choice)
      tutorialStore.skipToStep('second_mentor_intro');
      
      // Go to hospital view (only Jesse's LINAC-1 and Kapoor's dosimetry-lab will be available)
      sceneStore.transitionToScene('hospital');
      
      // Clear any overlays that might have been triggered
      tutorialStore.dismissAllOverlays();
      
      console.log('⚗️ Post-lunch state - Only LINAC-1 and Dosimetry Lab available for afternoon mentor choice');
    }
  },
  {
    id: 'hospital_before_quinn_office',
    name: 'Before Quinn Activity',
    description: 'Hospital with Physics Office available for end-of-day meeting',
    category: 'tutorial',
    setup: () => {
      const tutorialStore = useTutorialStore.getState();
      const sceneStore = useSceneStore.getState();
      const dialogueStore = useDialogueStore.getState();
      
      // Reset and set up tutorial state
      tutorialStore.resetTutorialProgress();
      dialogueStore.endDialogue();
      
      // Complete steps up to night phase transition (silently - no popup)
      tutorialStore.startTutorialSilently('first_day', 'morning_arrival');
      tutorialStore.completeStep('morning_arrival');
      tutorialStore.completeStep('hospital_tour');
      tutorialStore.completeStep('first_mentor_intro');
      tutorialStore.completeStep('first_educational_activity');
      tutorialStore.completeStep('lunch_dialogue');
      tutorialStore.completeStep('second_mentor_intro');
      
      // Set current step to night_phase_transition (makes physics office available but no Hill House button)
      tutorialStore.skipToStep('night_phase_transition');
      
      // Go to hospital view (physics office should be available, no Hill House button yet)
      sceneStore.transitionToScene('hospital');
      
      // Clear any overlays that might have been triggered
      tutorialStore.dismissAllOverlays();
      
      console.log('👩‍⚕️ Pre-Quinn state - Physics Office available, no Hill House button yet');
    }
  },
  {
    id: 'hospital_sunset_hill_house',
    name: 'Before Hill House',
    description: 'Hospital with sunset effects and Hill House button ready',
    category: 'tutorial',
    setup: () => {
      const tutorialStore = useTutorialStore.getState();
      const sceneStore = useSceneStore.getState();
      const dialogueStore = useDialogueStore.getState();
      
      // Reset and set up tutorial state
      tutorialStore.resetTutorialProgress();
      dialogueStore.endDialogue();
      
      // Complete steps up to Quinn office meeting (silently - no popup)
      tutorialStore.startTutorialSilently('first_day', 'morning_arrival');
      tutorialStore.completeStep('morning_arrival');
      tutorialStore.completeStep('hospital_tour');
      tutorialStore.completeStep('first_mentor_intro');
      tutorialStore.completeStep('first_educational_activity');
      tutorialStore.completeStep('lunch_dialogue');
      tutorialStore.completeStep('second_mentor_intro');
      tutorialStore.completeStep('night_phase_transition');
      
      // Set current step to quinn_office_meeting (triggers end of day)
      tutorialStore.skipToStep('quinn_office_meeting');
      
      // Go to hospital view (should show sunset effects and Hill House button)
      sceneStore.transitionToScene('hospital');
      
      // Clear any overlays that might have been triggered
      tutorialStore.dismissAllOverlays();
      
      console.log('🌅 Sunset state - Hospital with beautiful gradient and Hill House button available');
    }
  },

  // Core Gameplay Scenarios
  {
    id: 'hospital_free_roam',
    name: 'Hospital Free Roam',
    description: 'Normal hospital with all rooms unlocked, no tutorial',
    category: 'gameplay',
    setup: () => {
      const tutorialStore = useTutorialStore.getState();
      const sceneStore = useSceneStore.getState();
      const gameStore = useGameStore.getState();
      
      tutorialStore.disableTutorialMode();
      sceneStore.transitionToScene('hospital');
      // Unlock all rooms, max resources for testing (if gameStore has this method)
      console.log('🔓 Setting up free roam with max resources');
    }
  },
  {
    id: 'challenge_dosimetry_hard',
    name: 'Dosimetry Challenge - Hard',
    description: 'Jump to challenging dosimetry questions',
    category: 'gameplay',
    setup: () => {
      const sceneStore = useSceneStore.getState();
      sceneStore.transitionToScene('challenge', {
        activityId: 'dosimetry-advanced-challenge',
        mentorId: 'kapoor',
        roomId: 'dosimetry-lab'
      });
    }
  },

  // Dialogue Testing Scenarios
  {
    id: 'dialogue_garcia_intro',
    name: 'Dr. Garcia Introduction',
    description: 'Test Dr. Garcia physics office dialogue',
    category: 'dialogue',
    setup: () => {
      const dialogueStore = useDialogueStore.getState();
      const sceneStore = useSceneStore.getState();
      
      dialogueStore.startDialogue('physics-office-intro');
      sceneStore.transitionToScene('narrative', {
        mentorId: 'garcia',
        dialogueId: 'physics-office-intro',
        roomId: 'physics-office'
      });
    }
  },
  {
    id: 'dialogue_all_mentors',
    name: 'Mentor Gallery',
    description: 'See all mentors and their relationship status',
    category: 'dialogue',
    setup: () => {
      const sceneStore = useSceneStore.getState();
      sceneStore.transitionToScene('hospital'); // Add mentor gallery scene when available
      console.log('Switch to mentor gallery view');
    }
  },

  // Constellation/Knowledge Testing
  {
    id: 'constellation_full_unlock',
    name: 'Full Constellation',
    description: 'All knowledge stars unlocked for testing connections',
    category: 'constellation',
    setup: () => {
      const sceneStore = useSceneStore.getState();
      
      // Unlock all knowledge concepts
      console.log('🌟 Setting up full constellation view');
      sceneStore.transitionToScene('constellation');
      console.log('All constellation stars unlocked');
    }
  },

  // Boss/Advanced Scenarios
  {
    id: 'boss_final_exam',
    name: 'Final Physics Exam',
    description: 'End-game comprehensive physics challenge',
    category: 'boss',
    setup: () => {
      const sceneStore = useSceneStore.getState();
      
      // Set high-stakes final exam state
      console.log('🔥 Setting up final physics exam');
      sceneStore.transitionToScene('challenge', {
        activityId: 'final-physics-comprehensive',
        mentorId: 'all',
        roomId: 'examination-hall'
      });
    }
  },

  // Additional Custom Scenarios for Advanced Testing
  {
    id: 'stress_test_dialogue',
    name: 'Dialogue Stress Test',
    description: 'Rapidly cycle through all mentor dialogues',
    category: 'custom',
    setup: () => {
      const dialogueStore = useDialogueStore.getState();
      const sceneStore = useSceneStore.getState();
      
      console.log('🔄 Starting dialogue stress test...');
      // This would cycle through dialogues for testing
      sceneStore.transitionToScene('narrative', {
        mentorId: 'garcia',
        dialogueId: 'physics-office-intro',
        roomId: 'physics-office'
      });
    }
  },
  {
    id: 'all_mentors_max_relationship',
    name: 'Max Mentor Relationships',
    description: 'Set all mentor relationships to maximum for testing',
    category: 'custom',
    setup: () => {
      console.log('💕 Setting all mentor relationships to maximum');
      // This would set high relationship values for all mentors
      // You'd implement this based on your relationship store
    }
  },
  {
    id: 'edge_case_empty_state',
    name: 'Edge Case - Empty State',
    description: 'Test game behavior with minimal/empty state',
    category: 'custom',
    setup: () => {
      const tutorialStore = useTutorialStore.getState();
      const sceneStore = useSceneStore.getState();
      
      tutorialStore.resetTutorialProgress();
      tutorialStore.disableTutorialMode();
      sceneStore.transitionToScene('hospital');
      console.log('🔄 Reset to minimal state for edge case testing');
    }
  }
];

// Compact console container - much smaller!
const ConsoleContainer = styled.div<{ $isOpen: boolean }>`
  position: fixed;
  top: ${({ $isOpen }) => $isOpen ? '0' : '-35vh'};
  left: 0;
  right: 0;
  height: 30vh;
  background: linear-gradient(135deg, rgba(15, 23, 42, 0.96), rgba(30, 41, 59, 0.96));
  border-bottom: 2px solid #3B82F6;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(12px);
  z-index: 9999;
  transition: top 0.3s ease;
  display: flex;
  flex-direction: column;
  font-family: 'Courier New', monospace;
`;

const ConsoleHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  background: rgba(59, 130, 246, 0.15);
  border-bottom: 1px solid rgba(59, 130, 246, 0.3);
  min-height: 40px;
`;

const ConsoleTitle = styled.h2`
  margin: 0;
  color: #3B82F6;
  font-size: 14px;
  font-weight: bold;
`;

const ConsoleContent = styled.div`
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr;
  gap: 16px;
  padding: 12px 16px;
  overflow-y: auto;
`;

const ControlSection = styled.div`
  display: flex;
  flex-direction: column;
`;

const SectionTitle = styled.h4`
  color: #E2E8F0;
  font-size: 10px;
  font-weight: bold;
  text-transform: uppercase;
  margin: 0 0 6px 0;
  padding-bottom: 2px;
  border-bottom: 1px solid rgba(226, 232, 240, 0.2);
`;

const CompactButton = styled.button<{ $variant?: 'primary' | 'success' | 'warning' | 'danger' | 'weather' | 'ripple' }>`
  background: ${({ $variant }) => {
    switch ($variant) {
      case 'primary': return '#3B82F6';
      case 'success': return '#10B981';
      case 'warning': return '#F59E0B';
      case 'danger': return '#EF4444';
      case 'weather': return '#8B5CF6';
      case 'ripple': return '#06B6D4';
      default: return '#475569';
    }
  }};
  color: white;
  border: none;
  border-radius: 4px;
  padding: 4px 6px;
  margin-bottom: 3px;
  font-size: 10px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    opacity: 0.9;
  }

  &:disabled {
    background: #374151;
    color: #6B7280;
    cursor: not-allowed;
    transform: none;
  }
`;

const StatusBar = styled.div`
  display: flex;
  gap: 12px;
  font-size: 10px;
  color: #94A3B8;
`;

const StatusItem = styled.span`
  color: #F1F5F9;
  
  strong {
    color: #3B82F6;
  }
`;

// Main Game Dev Console Component
const GameDevConsole: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  
  // Store hooks for status display
  const currentScene = useSceneStore(state => state.currentScene);
  const tutorialMode = useTutorialStore(state => state.mode);
  const currentStep = useTutorialStore(state => state.currentStep);

  // Keyboard shortcut to toggle console (F2 key)
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === 'F2') {
        event.preventDefault();
        setIsOpen(!isOpen);
      }
      // ESC to close
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isOpen]);

  // Quick navigation actions
  const quickActions = {
    // Scene Navigation
    jumpToHospital: () => {
      console.log('🏥 Jumping to hospital');
      useSceneStore.getState().transitionToScene('hospital');
    },
    
    jumpToNight: () => {
      console.log('🌙 Jumping to night phase');
      useSceneStore.getState().transitionToScene('constellation');
    },

    // Tutorial Control
    startFreshDay: () => {
      console.log('🌅 Starting fresh day tutorial');
      const tutorialStore = useTutorialStore.getState();
      const sceneStore = useSceneStore.getState();
      tutorialStore.resetTutorialProgress();
      tutorialStore.startTutorialSilently('first_day', 'morning_arrival');
      sceneStore.transitionToScene('hospital');
    },

    beforeLunch: () => {
      console.log('🍽️ Setting up pre-lunch state');
      const tutorialStore = useTutorialStore.getState();
      const sceneStore = useSceneStore.getState();
      tutorialStore.resetTutorialProgress();
      tutorialStore.startTutorialSilently('first_day', 'morning_arrival');
      tutorialStore.completeStep('morning_arrival');
      tutorialStore.completeStep('hospital_tour');
      tutorialStore.completeStep('first_mentor_intro');
      tutorialStore.completeStep('first_educational_activity');
      tutorialStore.skipToStep('lunch_dialogue');
      sceneStore.transitionToScene('hospital');
    },

    freeRoam: () => {
      console.log('🔓 Enabling free roam');
      const tutorialStore = useTutorialStore.getState();
      const sceneStore = useSceneStore.getState();
      tutorialStore.disableTutorialMode();
      sceneStore.transitionToScene('hospital');
    },

    resetAll: () => {
      console.log('🔄 Resetting all stores');
      useTutorialStore.getState().resetTutorialProgress();
      useDialogueStore.getState().endDialogue();
    },

    // Time Lighting Tests  
    testDawn: () => {
      console.log('🌅 Testing dawn lighting (7 AM)');
      centralEventBus.dispatch(GameEventType.TIME_ADVANCED, { hour: 7, minute: 0 }, 'GameDevConsole');
    },

    testDay: () => {
      console.log('☀️ Testing day lighting (12 PM)');
      centralEventBus.dispatch(GameEventType.TIME_ADVANCED, { hour: 12, minute: 0 }, 'GameDevConsole');
    },

    testEvening: () => {
      console.log('🌆 Testing evening lighting (6 PM)');
      centralEventBus.dispatch(GameEventType.TIME_ADVANCED, { hour: 18, minute: 0 }, 'GameDevConsole');
    },

    testNight: () => {
      console.log('🌃 Testing night lighting (10 PM)');
      centralEventBus.dispatch(GameEventType.TIME_ADVANCED, { hour: 22, minute: 0 }, 'GameDevConsole');
    },

    // Weather Controls
    setClear: () => {
      console.log('☀️ Setting clear weather');
      if (typeof window !== 'undefined' && (window as any).setWeather) {
        (window as any).setWeather('clear');
      }
    },

    setRain: () => {
      console.log('🌧️ Setting rain weather');
      if (typeof window !== 'undefined' && (window as any).setWeather) {
        (window as any).setWeather('rain');
      }
    },

    setStorm: () => {
      console.log('⛈️ Setting storm weather');
      if (typeof window !== 'undefined' && (window as any).setWeather) {
        (window as any).setWeather('storm');
      }
    },

    setSnow: () => {
      console.log('❄️ Setting snow weather');
      if (typeof window !== 'undefined' && (window as any).setWeather) {
        (window as any).setWeather('snow');
      }
    },

    setFog: () => {
      console.log('🌫️ Setting fog weather');
      if (typeof window !== 'undefined' && (window as any).setWeather) {
        (window as any).setWeather('fog');
      }
    },

    // Pond Ripple Controls
    spawnAmbient: () => {
      console.log('🌊 Spawning ambient ripple');
      if (typeof window !== 'undefined' && (window as any).spawnRipple) {
        (window as any).spawnRipple('ambient');
      }
    },

    spawnRain: () => {
      console.log('💧 Spawning rain ripple');
      if (typeof window !== 'undefined' && (window as any).spawnRipple) {
        (window as any).spawnRipple('rain');
      }
    },

    spawnStorm: () => {
      console.log('🌊 Spawning storm ripple');
      if (typeof window !== 'undefined' && (window as any).spawnRipple) {
        (window as any).spawnRipple('storm');
      }
    },

    spawnSparkle: () => {
      console.log('✨ Spawning water sparkle');
      if (typeof window !== 'undefined' && (window as any).spawnRipple) {
        (window as any).spawnRipple('sparkle');
      }
    },

    clearRipples: () => {
      console.log('🧹 Clearing all ripples');
      if (typeof window !== 'undefined' && (window as any).clearRipples) {
        (window as any).clearRipples();
      }
    }
  };

  // Only render in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <>
      {/* Console Toggle Button - Always visible in dev */}
      <div
        style={{
          position: 'fixed',
          top: '20px',
          right: '30px',
          zIndex: 10000,
          fontSize: '24px',
          cursor: 'pointer',
          opacity: 0.7,
          transition: 'opacity 0.3s ease'
        }}
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
        onMouseLeave={(e) => e.currentTarget.style.opacity = '0.7'}
        title="Dev Console (F2)"
      >
        🎮
      </div>

      {/* Compact Console */}
      <ConsoleContainer $isOpen={isOpen}>
        <ConsoleHeader>
          <ConsoleTitle>🎮 Dev Console</ConsoleTitle>
          <StatusBar>
            <StatusItem><strong>Scene:</strong> {currentScene}</StatusItem>
            <StatusItem><strong>Tutorial:</strong> {tutorialMode}</StatusItem>
            <StatusItem><strong>Step:</strong> {currentStep || 'None'}</StatusItem>
          </StatusBar>
          <div style={{ color: '#94A3B8', fontSize: '10px' }}>
            F2 • ESC
          </div>
        </ConsoleHeader>

        <ConsoleContent>
          {/* Scene Navigation */}
          <ControlSection>
            <SectionTitle>🏠 Navigation</SectionTitle>
            <CompactButton $variant="primary" onClick={quickActions.jumpToHospital}>
              🏥 Hospital
            </CompactButton>
            <CompactButton $variant="primary" onClick={quickActions.jumpToNight}>
              🌙 Night Phase
            </CompactButton>
            <CompactButton $variant="warning" onClick={quickActions.freeRoam}>
              🔓 Free Roam
            </CompactButton>
            <CompactButton $variant="danger" onClick={quickActions.resetAll}>
              🔄 Reset All
            </CompactButton>
          </ControlSection>

          {/* Tutorial States */}
          <ControlSection>
            <SectionTitle>📚 Tutorial</SectionTitle>
            <CompactButton $variant="success" onClick={quickActions.startFreshDay}>
              🌅 Fresh Day
            </CompactButton>
            <CompactButton $variant="success" onClick={quickActions.beforeLunch}>
              🍽️ Pre-Lunch
            </CompactButton>
            <CompactButton $variant="warning" onClick={quickActions.testDawn}>
              🌅 Dawn Light
            </CompactButton>
            <CompactButton $variant="warning" onClick={quickActions.testDay}>
              ☀️ Day Light
            </CompactButton>
            <CompactButton $variant="warning" onClick={quickActions.testEvening}>
              🌆 Evening
            </CompactButton>
            <CompactButton $variant="warning" onClick={quickActions.testNight}>
              🌃 Night Light
            </CompactButton>
          </ControlSection>

          {/* Weather Controls */}
          <ControlSection>
            <SectionTitle>🌦️ Weather</SectionTitle>
            <CompactButton $variant="weather" onClick={quickActions.setClear}>
              ☀️ Clear
            </CompactButton>
            <CompactButton $variant="weather" onClick={quickActions.setRain}>
              🌧️ Rain
            </CompactButton>
            <CompactButton $variant="weather" onClick={quickActions.setStorm}>
              ⛈️ Storm
            </CompactButton>
            <CompactButton $variant="weather" onClick={quickActions.setSnow}>
              ❄️ Snow
            </CompactButton>
            <CompactButton $variant="weather" onClick={quickActions.setFog}>
              🌫️ Fog
            </CompactButton>
          </ControlSection>

          {/* Pond Ripples */}
          <ControlSection>
            <SectionTitle>🌊 Pond Ripples</SectionTitle>
            <CompactButton $variant="ripple" onClick={quickActions.spawnAmbient}>
              🌊 Ambient
            </CompactButton>
            <CompactButton $variant="ripple" onClick={quickActions.spawnRain}>
              💧 Rain Drop
            </CompactButton>
            <CompactButton $variant="ripple" onClick={quickActions.spawnStorm}>
              🌊 Storm Wave
            </CompactButton>
            <CompactButton $variant="ripple" onClick={quickActions.spawnSparkle}>
              ✨ Sparkle
            </CompactButton>
            <CompactButton $variant="danger" onClick={quickActions.clearRipples}>
              🧹 Clear All
            </CompactButton>
          </ControlSection>
        </ConsoleContent>
      </ConsoleContainer>
    </>
  );
};

export default GameDevConsole; 