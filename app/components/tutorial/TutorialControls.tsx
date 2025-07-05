'use client';

import React, { useState } from 'react';
import styled, { css } from 'styled-components';
import { 
  useTutorialStore, 
  useTutorialNavigation,
  tutorialSelectors,
  TutorialSequence,
  TutorialStep 
} from '@/app/store/tutorialStore';
import { useTutorialOverlays } from './TutorialOverlay';

// Styled components for tutorial controls
const ControlsContainer = styled.div<{ $isExpanded: boolean }>`
  position: fixed;
  bottom: 20px;
  left: 20px;
  background: rgba(15, 23, 42, 0.95);
  border: 2px solid rgba(59, 130, 246, 0.6);
  border-radius: 12px;
  backdrop-filter: blur(10px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  z-index: 999;
  transition: all 0.3s ease;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  
  ${({ $isExpanded }) => $isExpanded ? css`
    width: 320px;
    max-height: 400px;
  ` : css`
    width: auto;
    max-height: 60px;
  `}
`;

const ControlsHeader = styled.div`
  padding: 12px 16px;
  border-bottom: 1px solid rgba(59, 130, 246, 0.3);
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  
  &:hover {
    background: rgba(59, 130, 246, 0.1);
  }
`;

const ControlsTitle = styled.span`
  color: #3B82F6;
  font-weight: bold;
  font-size: 14px;
`;

const ExpandIcon = styled.span<{ $isExpanded: boolean }>`
  color: #94A3B8;
  transition: transform 0.3s ease;
  transform: ${({ $isExpanded }) => $isExpanded ? 'rotate(180deg)' : 'rotate(0deg)'};
`;

const ControlsContent = styled.div<{ $isExpanded: boolean }>`
  padding: ${({ $isExpanded }) => $isExpanded ? '16px' : '0'};
  max-height: ${({ $isExpanded }) => $isExpanded ? '320px' : '0'};
  overflow: hidden;
  transition: all 0.3s ease;
`;

const ControlSection = styled.div`
  margin-bottom: 16px;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const SectionTitle = styled.h4`
  margin: 0 0 8px 0;
  color: #E2E8F0;
  font-size: 12px;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const ControlButton = styled.button<{ $variant?: 'primary' | 'success' | 'warning' | 'danger' }>`
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
  padding: 6px 12px;
  margin: 2px 4px 2px 0;
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  }
  
  &:active {
    transform: translateY(0);
  }
  
  &:disabled {
    background: #374151;
    color: #6B7280;
    cursor: not-allowed;
    transform: none;
  }
`;

const StatusIndicator = styled.div<{ $status: 'active' | 'inactive' | 'completed' }>`
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 6px;
  background: ${({ $status }) => {
    switch ($status) {
      case 'active': return '#10B981';
      case 'completed': return '#3B82F6';
      default: return '#6B7280';
    }
  }};
`;

const StatusText = styled.span<{ $status: 'active' | 'inactive' | 'completed' }>`
  color: ${({ $status }) => {
    switch ($status) {
      case 'active': return '#10B981';
      case 'completed': return '#3B82F6';
      default: return '#9CA3AF';
    }
  }};
  font-size: 11px;
`;

const ProgressDisplay = styled.div`
  background: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.3);
  border-radius: 6px;
  padding: 8px;
  margin-top: 8px;
`;

const ProgressBar = styled.div<{ $progress: number }>`
  width: 100%;
  height: 4px;
  background: rgba(59, 130, 246, 0.3);
  border-radius: 2px;
  margin: 4px 0;
  overflow: hidden;
  
  &::after {
    content: '';
    display: block;
    height: 100%;
    width: ${({ $progress }) => $progress}%;
    background: linear-gradient(90deg, #3B82F6, #8B5CF6);
    border-radius: 2px;
    transition: width 0.3s ease;
  }
`;

const SequenceSelector = styled.select`
  background: rgba(15, 23, 42, 0.9);
  color: #E2E8F0;
  border: 1px solid rgba(59, 130, 246, 0.5);
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 11px;
  margin-right: 8px;
  width: 140px;
`;

const StepSelector = styled.select`
  background: rgba(15, 23, 42, 0.9);
  color: #E2E8F0;
  border: 1px solid rgba(59, 130, 246, 0.5);
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 11px;
  margin-right: 8px;
  width: 120px;
`;

// Main tutorial controls component
const TutorialControls: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedSequence, setSelectedSequence] = useState<TutorialSequence>('first_day');
  const [selectedStep, setSelectedStep] = useState<TutorialStep>('morning_arrival');

  const {
    mode,
    currentStep,
    currentSequence,
    startTutorial,
    completeStep,
    skipToStep,
    skipTutorialSequence,
    enableTutorialMode,
    disableTutorialMode,
    toggleTutorialMode,
    startFirstDayTutorial,
    startNightPhaseTutorial,
    completeCurrentStep,
    skipCurrentSequence
  } = useTutorialNavigation();

  const totalProgress = useTutorialStore(state => state.getTutorialProgress());
  const debugMode = useTutorialStore(tutorialSelectors.getDebugMode);
  const activeOverlays = useTutorialStore(tutorialSelectors.getActiveOverlays);
  
  const { resetTutorialProgress, enableDebugMode, disableDebugMode } = useTutorialStore();
  const { 
    showTooltip, 
    showSpotlight, 
    showModal, 
    showGuidedInteraction,
    showProgressIndicator,
    dismissAllOverlays 
  } = useTutorialOverlays();

  // Test overlay functions
  const testTooltip = () => {
    showTooltip(
      'Test Tooltip',
      'This is a test tooltip to demonstrate the overlay system.',
      { x: 100, y: 100 }
    );
  };

  const testSpotlight = () => {
    showSpotlight(
      'Test Spotlight',
      'This spotlight highlights the tutorial controls container.',
      '.tutorial-controls-container'
    );
  };

  const testModal = () => {
    showModal(
      'Test Modal',
      'This is a full-screen modal overlay for important tutorial information.'
    );
  };

  const testGuidedInteraction = () => {
    showGuidedInteraction(
      'Click the Toggle Button',
      'Try clicking the "Toggle Tutorial Mode" button to complete this guided interaction.',
      '[data-testid="toggle-tutorial-mode"]',
      'click'
    );
  };

  const testProgressIndicator = () => {
    showProgressIndicator(
      'Tutorial Progress',
      'This shows your overall tutorial completion progress.'
    );
  };

  // Step sequences for each tutorial
  const STEP_OPTIONS: Record<TutorialSequence, TutorialStep[]> = {
    first_day: [
      'morning_arrival',
      'first_mentor_intro',
      'hospital_tour',
      'first_educational_activity',
      'insight_mechanic_intro',
      'lunch_dialogue',
      'second_mentor_intro',
      'constellation_preview',
      'first_ability_intro',
      'journal_card_explanation',
      'night_phase_transition',
      'third_mentor_intro'
    ],
    night_phase: [
      'observatory_introduction',
      'constellation_interface',
      'star_selection_tutorial',
      'journal_system_intro',
      'card_placement_tutorial',
      'phone_call_system',
      'mentor_night_guidance'
    ],
    mentor_relationships: [
      'mentor_relationship_tracking',
      'advanced_dialogue_options'
    ],
    advanced_systems: [
      'special_abilities_unlock',
      'boss_encounter_prep'
    ]
  };

  const formatStepName = (step: string) => {
    return step.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatSequenceName = (sequence: string) => {
    return sequence.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // Only render in development mode unless tutorial is active
  if (!debugMode && mode === 'disabled') {
    return null;
  }

  return (
    <ControlsContainer 
      $isExpanded={isExpanded} 
      className="tutorial-controls-container"
    >
      <ControlsHeader onClick={() => setIsExpanded(!isExpanded)}>
        <ControlsTitle>
          Tutorial Controls
          {mode === 'active_sequence' && (
            <StatusText $status="active" style={{ marginLeft: '8px' }}>
              • {currentSequence} / {currentStep}
            </StatusText>
          )}
        </ControlsTitle>
        <ExpandIcon $isExpanded={isExpanded}>▼</ExpandIcon>
      </ControlsHeader>

      <ControlsContent $isExpanded={isExpanded}>
        {/* Tutorial Mode Control */}
        <ControlSection>
          <SectionTitle>Tutorial Mode</SectionTitle>
          <div>
            <StatusIndicator $status={mode !== 'disabled' ? 'active' : 'inactive'} />
            <StatusText $status={mode !== 'disabled' ? 'active' : 'inactive'}>
              Mode: {mode}
            </StatusText>
          </div>
          <ControlButton 
            $variant="primary" 
            onClick={toggleTutorialMode}
            data-testid="toggle-tutorial-mode"
          >
            {mode !== 'disabled' ? 'Disable Tutorial' : 'Enable Tutorial'}
          </ControlButton>
        </ControlSection>

        {/* Current Status */}
        <ControlSection>
          <SectionTitle>Current Status</SectionTitle>
          <div>
            <StatusIndicator $status={mode === 'active_sequence' ? 'active' : 'inactive'} />
            <StatusText $status={mode === 'active_sequence' ? 'active' : 'inactive'}>
              Tutorial: {mode === 'active_sequence' ? 'Active' : 'Inactive'}
            </StatusText>
          </div>
          {currentSequence && (
            <div style={{ marginTop: '4px' }}>
              <StatusText $status="active">
                Sequence: {formatSequenceName(currentSequence)}
              </StatusText>
            </div>
          )}
          {currentStep && (
            <div style={{ marginTop: '4px' }}>
              <StatusText $status="active">
                Step: {formatStepName(currentStep)}
              </StatusText>
            </div>
          )}
        </ControlSection>

        {/* Quick Start Tutorials */}
        <ControlSection>
          <SectionTitle>Quick Start</SectionTitle>
          <ControlButton $variant="success" onClick={startFirstDayTutorial}>
            First Day Tutorial
          </ControlButton>
          <ControlButton $variant="success" onClick={startNightPhaseTutorial}>
            Night Phase Tutorial
          </ControlButton>
        </ControlSection>

        {/* Current Tutorial Controls */}
        {mode === 'active_sequence' && (
          <ControlSection>
            <SectionTitle>Current Tutorial</SectionTitle>
            <ControlButton 
              $variant="primary" 
              onClick={completeCurrentStep}
              disabled={!currentStep}
            >
              Complete Current Step
            </ControlButton>
            <ControlButton 
              $variant="warning" 
              onClick={skipCurrentSequence}
              disabled={!currentSequence}
            >
              Skip Sequence
            </ControlButton>
          </ControlSection>
        )}

        {/* Debug Controls (only in debug mode) */}
        {debugMode && (
          <>
            <ControlSection>
              <SectionTitle>Debug Controls</SectionTitle>
              <div style={{ marginBottom: '8px' }}>
                <SequenceSelector 
                  value={selectedSequence} 
                  onChange={(e) => {
                    const sequence = e.target.value as TutorialSequence;
                    setSelectedSequence(sequence);
                    setSelectedStep(STEP_OPTIONS[sequence][0]);
                  }}
                >
                  <option value="first_day">First Day</option>
                  <option value="night_phase">Night Phase</option>
                  <option value="mentor_relationships">Mentor Relationships</option>
                  <option value="advanced_systems">Advanced Systems</option>
                </SequenceSelector>
                <ControlButton 
                  $variant="primary" 
                  onClick={() => startTutorial(selectedSequence)}
                >
                  Start
                </ControlButton>
              </div>
              
              {debugMode && (
                <div style={{ marginBottom: '8px' }}>
                  <StepSelector 
                    value={selectedStep} 
                    onChange={(e) => setSelectedStep(e.target.value as TutorialStep)}
                  >
                    {STEP_OPTIONS[selectedSequence].map(step => (
                      <option key={step} value={step}>
                        {formatStepName(step)}
                      </option>
                    ))}
                  </StepSelector>
                  <ControlButton 
                    $variant="warning" 
                    onClick={() => skipToStep(selectedStep)}
                  >
                    Skip To
                  </ControlButton>
                </div>
              )}
              
              <ControlButton $variant="danger" onClick={resetTutorialProgress}>
                Reset Progress
              </ControlButton>
            </ControlSection>

            {/* Test Overlays */}
            <ControlSection>
              <SectionTitle>Test Overlays ({activeOverlays.length} active)</SectionTitle>
              <ControlButton onClick={testTooltip}>Tooltip</ControlButton>
              <ControlButton onClick={testSpotlight}>Spotlight</ControlButton>
              <ControlButton onClick={testModal}>Modal</ControlButton>
              <ControlButton onClick={testGuidedInteraction}>Guided</ControlButton>
              <ControlButton onClick={testProgressIndicator}>Progress</ControlButton>
              {activeOverlays.length > 0 && (
                <ControlButton $variant="danger" onClick={dismissAllOverlays}>
                  Dismiss All
                </ControlButton>
              )}
            </ControlSection>
          </>
        )}

        {/* Progress Display */}
        <ControlSection>
          <SectionTitle>Overall Progress</SectionTitle>
          <ProgressDisplay>
            <div style={{ fontSize: '11px', color: '#E2E8F0', marginBottom: '4px' }}>
              Tutorial Completion: {Math.round(totalProgress * 100)}%
            </div>
            <ProgressBar $progress={totalProgress * 100} />
          </ProgressDisplay>
        </ControlSection>

        {/* Debug Mode Toggle */}
        {process.env.NODE_ENV === 'development' && (
          <ControlSection>
            <SectionTitle>Development</SectionTitle>
            <StatusText $status={debugMode ? 'active' : 'inactive'}>
              Debug Mode: {debugMode ? 'On' : 'Off'}
            </StatusText>
            <ControlButton 
              $variant={debugMode ? 'danger' : 'success'}
              onClick={debugMode ? disableDebugMode : enableDebugMode}
            >
              {debugMode ? 'Disable Debug' : 'Enable Debug'}
            </ControlButton>
          </ControlSection>
        )}
      </ControlsContent>
    </ControlsContainer>
  );
};

// Simple tutorial mode indicator for the main UI (disabled)
export const TutorialModeIndicator: React.FC = () => {
  // Removed the tutorial mode indicator button
  return null;
};

export default TutorialControls; 