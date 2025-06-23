'use client';

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useSceneStore } from '@/app/store/sceneStore';
import { useTutorialStore } from '@/app/store/tutorialStore';
import { useDialogueStore } from '@/app/store/dialogueStore';
import { useGameStore } from '@/app/store/gameStore';
import { useKnowledgeStore } from '@/app/store/knowledgeStore';

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
  // Tutorial Testing Scenarios
  {
    id: 'tutorial_first_day_start',
    name: 'First Day Tutorial - Start',
    description: 'Clean start of first day tutorial with Dr. Garcia',
    category: 'tutorial',
    setup: () => {
      const tutorialStore = useTutorialStore.getState();
      const sceneStore = useSceneStore.getState();
      
      tutorialStore.resetTutorialProgress();
      tutorialStore.startTutorial('first_day', 'morning_arrival');
      sceneStore.transitionToScene('hospital');
    }
  },
  {
    id: 'tutorial_lunch_dialogue',
    name: 'Tutorial - Lunch Scene',
    description: 'Jump directly to Dr. Quinn lunch dialogue',
    category: 'tutorial',
    setup: () => {
      const tutorialStore = useTutorialStore.getState();
      const dialogueStore = useDialogueStore.getState();
      const sceneStore = useSceneStore.getState();
      
      tutorialStore.startTutorial('first_day', 'lunch_dialogue');
      dialogueStore.startDialogue('tutorial_lunch_dialogue');
      sceneStore.transitionToScene('narrative', { 
        mentorId: 'quinn', 
        dialogueId: 'tutorial_lunch_dialogue', 
        roomId: 'cafeteria' 
      });
    }
  },
  {
    id: 'tutorial_constellation_intro',
    name: 'Tutorial - Constellation Intro',
    description: 'Night phase constellation tutorial',
    category: 'tutorial',
    setup: () => {
      const tutorialStore = useTutorialStore.getState();
      const sceneStore = useSceneStore.getState();
      
      tutorialStore.startTutorial('night_phase', 'constellation_interface');
      sceneStore.transitionToScene('constellation');
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
    id: 'tutorial_mid_sequence',
    name: 'Tutorial - Mid Sequence',
    description: 'Jump to middle of tutorial for testing specific steps',
    category: 'tutorial',
    setup: () => {
      const tutorialStore = useTutorialStore.getState();
      
      tutorialStore.startTutorial('first_day', 'insight_mechanic_intro');
      tutorialStore.completeStep('morning_arrival');
      tutorialStore.completeStep('first_mentor_intro');
      tutorialStore.completeStep('hospital_tour');
      console.log('⏭️ Tutorial jumped to insight mechanic introduction');
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

// Styled components for the console UI
const ConsoleContainer = styled.div<{ $isOpen: boolean }>`
  position: fixed;
  top: ${({ $isOpen }) => $isOpen ? '0' : '-100%'};
  left: 0;
  right: 0;
  height: 70vh;
  background: linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.95));
  border-bottom: 2px solid #3B82F6;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(10px);
  z-index: 9999;
  transition: top 0.3s ease;
  display: flex;
  flex-direction: column;
  font-family: 'Courier New', monospace;
`;

const ConsoleHeader = styled.div`
  display: flex;
  justify-content: between;
  align-items: center;
  padding: 12px 20px;
  background: rgba(59, 130, 246, 0.1);
  border-bottom: 1px solid rgba(59, 130, 246, 0.3);
`;

const ConsoleTitle = styled.h2`
  margin: 0;
  color: #3B82F6;
  font-size: 18px;
  font-weight: bold;
`;

const ConsoleContent = styled.div`
  flex: 1;
  display: flex;
  overflow: hidden;
`;

const ScenarioPanel = styled.div`
  flex: 1;
  padding: 20px;
  overflow-y: auto;
`;

const CategorySection = styled.div`
  margin-bottom: 24px;
`;

const CategoryTitle = styled.h3`
  color: #E2E8F0;
  font-size: 14px;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 12px;
  border-bottom: 1px solid rgba(226, 232, 240, 0.2);
  padding-bottom: 4px;
`;

const ScenarioCard = styled.div`
  background: rgba(51, 65, 85, 0.5);
  border: 1px solid rgba(100, 116, 139, 0.3);
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(59, 130, 246, 0.1);
    border-color: rgba(59, 130, 246, 0.5);
    transform: translateY(-1px);
  }
`;

const ScenarioName = styled.div`
  color: #F1F5F9;
  font-weight: bold;
  font-size: 14px;
  margin-bottom: 4px;
`;

const ScenarioDescription = styled.div`
  color: #94A3B8;
  font-size: 12px;
  line-height: 1.4;
`;

const ControlPanel = styled.div`
  width: 300px;
  background: rgba(30, 41, 59, 0.5);
  border-left: 1px solid rgba(100, 116, 139, 0.3);
  padding: 20px;
  overflow-y: auto;
`;

const ControlSection = styled.div`
  margin-bottom: 20px;
`;

const ControlTitle = styled.h4`
  color: #E2E8F0;
  font-size: 12px;
  font-weight: bold;
  text-transform: uppercase;
  margin-bottom: 8px;
`;

const ActionButton = styled.button<{ $variant?: 'primary' | 'success' | 'warning' | 'danger' }>`
  width: 100%;
  background: ${({ $variant }) => {
    switch ($variant) {
      case 'primary': return '#3B82F6';
      case 'success': return '#10B981';
      case 'warning': return '#F59E0B';
      case 'danger': return '#EF4444';
      default: return '#475569';
    }
  }};
  color: white;
  border: none;
  border-radius: 6px;
  padding: 8px 12px;
  margin-bottom: 6px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }

  &:disabled {
    background: #374151;
    color: #6B7280;
    cursor: not-allowed;
    transform: none;
  }
`;

const StatusDisplay = styled.div`
  background: rgba(15, 23, 42, 0.8);
  border: 1px solid rgba(59, 130, 246, 0.3);
  border-radius: 6px;
  padding: 12px;
  margin-bottom: 12px;
`;

const StatusItem = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 6px;
  font-size: 11px;

  &:last-child {
    margin-bottom: 0;
  }
`;

const StatusLabel = styled.span`
  color: #94A3B8;
`;

const StatusValue = styled.span`
  color: #F1F5F9;
  font-weight: bold;
`;

// Main Game Dev Console Component
const GameDevConsole: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
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

  // Group scenarios by category
  const groupedScenarios = GAME_SCENARIOS.reduce((acc, scenario) => {
    if (!acc[scenario.category]) {
      acc[scenario.category] = [];
    }
    acc[scenario.category].push(scenario);
    return acc;
  }, {} as Record<string, GameScenario[]>);

  // Execute a scenario
  const executeScenario = (scenario: GameScenario) => {
    console.log(`🎮 Executing scenario: ${scenario.name}`);
    
    try {
      // Run teardown of previous scenario if needed
      // (You could track current scenario and run its teardown)
      
      // Execute the scenario setup
      scenario.setup();
      
      console.log(`✅ Scenario "${scenario.name}" executed successfully`);
    } catch (error) {
      console.error(`❌ Failed to execute scenario "${scenario.name}":`, error);
    }
  };

  // Quick actions
  const quickActions = {
    resetAllStores: () => {
      console.log('🔄 Resetting all stores to initial state');
      useTutorialStore.getState().resetTutorialProgress();
    },
    
    unlockAll: () => {
      console.log('🔓 Unlocking all content for testing - gameStore methods need implementation');
      // Note: gameStore methods need to be checked/implemented
    },
    
    jumpToNight: () => {
      console.log('🌙 Jumping to night phase');
      useSceneStore.getState().transitionToScene('constellation');
    },
    
    jumpToHospital: () => {
      console.log('🏥 Jumping to hospital');
      useSceneStore.getState().transitionToScene('hospital');
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
          top: '10px',
          right: '10px',
          zIndex: 10000,
          background: 'rgba(59, 130, 246, 0.9)',
          color: 'white',
          padding: '8px 12px',
          borderRadius: '6px',
          fontSize: '12px',
          fontWeight: 'bold',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
        }}
        onClick={() => setIsOpen(!isOpen)}
      >
        🎮 Dev Console (F2)
      </div>

      {/* Main Console */}
      <ConsoleContainer $isOpen={isOpen}>
        <ConsoleHeader>
          <ConsoleTitle>🎮 Game Development Console</ConsoleTitle>
          <div style={{ color: '#94A3B8', fontSize: '12px' }}>
            Press F2 to toggle • ESC to close
          </div>
        </ConsoleHeader>

        <ConsoleContent>
          {/* Scenario Selection Panel */}
          <ScenarioPanel>
            <div style={{ marginBottom: '20px' }}>
              <input
                type="text"
                placeholder="Search scenarios..."
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  background: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  borderRadius: '6px',
                  color: '#F1F5F9',
                  fontSize: '12px'
                }}
              />
            </div>

            {Object.entries(groupedScenarios).map(([category, scenarios]) => (
              <CategorySection key={category}>
                <CategoryTitle>
                  {category.charAt(0).toUpperCase() + category.slice(1)} ({scenarios.length})
                </CategoryTitle>
                {scenarios.map((scenario) => (
                  <ScenarioCard
                    key={scenario.id}
                    onClick={() => executeScenario(scenario)}
                  >
                    <ScenarioName>{scenario.name}</ScenarioName>
                    <ScenarioDescription>{scenario.description}</ScenarioDescription>
                  </ScenarioCard>
                ))}
              </CategorySection>
            ))}
          </ScenarioPanel>

          {/* Control Panel */}
          <ControlPanel>
            {/* Current Status */}
            <ControlSection>
              <ControlTitle>Current Status</ControlTitle>
              <StatusDisplay>
                <StatusItem>
                  <StatusLabel>Scene:</StatusLabel>
                  <StatusValue>{currentScene}</StatusValue>
                </StatusItem>
                <StatusItem>
                  <StatusLabel>Tutorial:</StatusLabel>
                  <StatusValue>{tutorialMode}</StatusValue>
                </StatusItem>
                <StatusItem>
                  <StatusLabel>Step:</StatusLabel>
                  <StatusValue>{currentStep || 'None'}</StatusValue>
                </StatusItem>
                <StatusItem>
                  <StatusLabel>Status:</StatusLabel>
                  <StatusValue>Ready</StatusValue>
                </StatusItem>
              </StatusDisplay>
            </ControlSection>

            {/* Quick Actions */}
            <ControlSection>
              <ControlTitle>Quick Actions</ControlTitle>
              <ActionButton $variant="primary" onClick={quickActions.jumpToHospital}>
                🏥 Jump to Hospital
              </ActionButton>
              <ActionButton $variant="success" onClick={quickActions.jumpToNight}>
                🌙 Jump to Night Phase
              </ActionButton>
              <ActionButton $variant="warning" onClick={quickActions.unlockAll}>
                🔓 Unlock All Content
              </ActionButton>
              <ActionButton $variant="danger" onClick={quickActions.resetAllStores}>
                🔄 Reset All Stores
              </ActionButton>
            </ControlSection>

            {/* Save States */}
            <ControlSection>
              <ControlTitle>Save States</ControlTitle>
              <ActionButton>💾 Quick Save State</ActionButton>
              <ActionButton>📁 Load Last State</ActionButton>
              <ActionButton>📋 Manage Save States</ActionButton>
            </ControlSection>

            {/* Testing Tools */}
            <ControlSection>
              <ControlTitle>Testing Tools</ControlTitle>
              <ActionButton>🔧 Performance Monitor</ActionButton>
              <ActionButton>📊 Store Inspector</ActionButton>
              <ActionButton>🎯 UI Boundary Box</ActionButton>
            </ControlSection>
          </ControlPanel>
        </ConsoleContent>
      </ConsoleContainer>
    </>
  );
};

export default GameDevConsole; 