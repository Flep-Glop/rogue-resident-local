'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import styled from 'styled-components';
import { Day1Scene, Day1State } from '@/app/types/day1';
import { MentorId, Difficulty } from '@/app/types';
import { useDialogueStore } from '@/app/store/dialogueStore';
import { useGameStore } from '@/app/store/gameStore';
import { colors, spacing, typography, borders, shadows, animation, components, mixins } from '@/app/styles/pixelTheme';
import { getPortraitCoordinates, SPRITE_SHEETS, CharacterId } from '@/app/utils/spriteMap';
import SpriteImage from '@/app/components/ui/SpriteImage';
import Image from 'next/image';

// Import existing dialogue components
import DialogueView from '@/app/components/dialogue/DialogueView';

const SceneContainer = styled.div<{ $background: string }>`
  min-height: 100vh;
  width: 100%;
  background: ${props => props.$background};
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  color: ${colors.text};
  font-family: ${typography.fontFamily.pixel};
  ${mixins.pixelPerfect}
  overflow: hidden;
  
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

const BackgroundOverlay = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  opacity: 0.2;
  z-index: 1;
`;

const CharacterPortrait = styled.div`
  position: absolute;
  bottom: 140px;
  left: 150px;
  width: 384px;
  height: 384px;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2;
`;

const DialogueBox = styled.div<{ $isNameInput?: boolean, $showChoices: boolean, $hasTypewriter?: boolean }>`
  ${components.dialog.container}
  position: relative;
  margin: 0 auto ${spacing.lg};
  width: 83%;
  max-width: 4xl;
  cursor: ${props => (!props.$isNameInput && !props.$showChoices && !props.$hasTypewriter) ? 'pointer' : 'default'};
  z-index: 10;
`;

const DialogueHeader = styled.div`
  ${components.dialog.header}
  font-size: ${typography.fontSize.xl};
  font-weight: medium;
  margin-bottom: ${spacing.xs};
`;

const DialogueContent = styled.div`
  ${components.dialog.content}
  min-height: 3em; // Reserve space for typewriter
`;

// Enhanced Typewriter Effect Styles
const TypewriterText = styled.div`
  .cursor {
    display: inline-block;
    animation: blink 0.8s infinite;
    color: ${colors.highlight};
  }
  
  @keyframes blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0; }
  }
`;

// Enhanced Name Input Styles
const NameInputOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 20;
`;

const NameInputBox = styled.div`
  ${components.dialog.container}
  max-width: 500px;
  width: 90%;
`;

const NameInputTitle = styled.h3`
  font-size: ${typography.fontSize.xl};
  margin-bottom: ${spacing.lg};
  text-align: center;
  color: ${colors.text};
`;

const NameInputForm = styled.form`
  margin-top: ${spacing.md};
  display: flex;
  flex-direction: column;
  gap: ${spacing.sm};
`;

const NameInput = styled.input`
  padding: ${spacing.xs} ${spacing.md};
  background-color: ${colors.backgroundAlt};
  border: ${borders.medium};
  border-radius: ${spacing.xs};
  color: ${colors.text};
  font-family: ${typography.fontFamily.pixel};
  font-size: ${typography.fontSize.md};
  outline: none;
  
  &:focus {
    box-shadow: ${shadows.glow(colors.highlight)};
  }
`;

const SubmitButton = styled.button<{ $hasText: boolean }>`
  ${components.button.base}
  ${components.button.primary}
  align-self: flex-end;
  padding: ${spacing.xs} ${spacing.md};
  border-radius: ${spacing.xs};
  font-size: ${typography.fontSize.md};
  opacity: ${props => !props.$hasText ? 0.5 : 1};
`;

// Difficulty Selection Styles
const DifficultyOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 20;
`;

const DifficultyBox = styled.div`
  ${components.dialog.container}
  max-width: 600px;
  width: 90%;
`;

const DifficultyChoice = styled.div`
  padding: ${spacing.md};
  background-color: ${colors.backgroundAlt};
  ${borders.pixelBorder.outer}
  border-radius: ${spacing.xs};
  cursor: pointer;
  transition: all ${animation.duration.fast} ${animation.easing.pixel};
  margin-bottom: ${spacing.sm};
  
  &:hover {
    ${borders.pixelBorder.active(colors.highlight)}
    background-color: ${colors.highlight};
  }
`;

const BeginnerModeText = styled.span`
  color: #48bb78; /* green-400 */
  font-weight: bold;
`;

const StandardModeText = styled.span`
  color: #ecc94b; /* yellow-400 */
  font-weight: bold;
`;

const ExpertModeText = styled.span`
  color: #f56565; /* red-400 */
  font-weight: bold;
`;

// Enhanced Choice System
const ChoiceContainer = styled.div`
  ${components.dialog.options}
  margin-top: ${spacing.md};
`;

const ChoiceButton = styled.div`
  padding: ${spacing.md};
  background-color: ${colors.backgroundAlt};
  ${borders.pixelBorder.outer}
  border-radius: ${spacing.xs};
  cursor: pointer;
  transition: all ${animation.duration.fast} ${animation.easing.pixel};
  margin-bottom: ${spacing.sm};
  
  &:hover {
    ${borders.pixelBorder.active(colors.highlight)}
    background-color: ${colors.highlight};
  }
`;

const ContinueButton = styled.div`
  ${components.button.base}
  position: absolute;
  bottom: ${spacing.xs};
  right: ${spacing.md};
  padding: ${spacing.xs} ${spacing.md};
  background-color: ${colors.highlight};
  border-radius: ${spacing.xs};
  font-size: ${typography.fontSize.sm};
`;

const InstructionText = styled.div`
  position: absolute;
  bottom: ${spacing.xs};
  right: ${spacing.md};
  font-size: ${typography.fontSize.sm};
  color: ${colors.textDim};
  text-shadow: ${typography.textShadow.pixel};
`;

// Colored Names (from Prologue)
const PlayerName = styled.span`
  color: ${colors.highlight};
  font-weight: bold;
`;

const HospitalName = styled.span`
  color: #4a9eda;
  font-weight: bold;
`;

const DrGarciaName = styled.span`
  color: #ff3399;
  font-weight: bold;
  text-shadow: 0 0 1px rgba(255, 51, 153, 0.5);
`;

const DrKapoorName = styled.span`
  color: #e8945e;
  font-weight: bold;
`;

const DrQuinnName = styled.span`
  color: #5ee89c;
  font-weight: bold;
`;

const JesseName = styled.span`
  color: #e85e8f;
  font-weight: bold;
`;

interface SceneRendererProps {
  scene: Day1Scene;
  day1State: Day1State;
  onSceneComplete: () => void;
  onNameSubmit: (name: string) => void;
}

const SceneRenderer: React.FC<SceneRendererProps> = ({
  scene,
  day1State,
  onSceneComplete,
  onNameSubmit
}) => {
  const { activeDialogueId, getCurrentNode, selectOption, getAvailableOptions, endDialogue } = useDialogueStore();
  const { setDifficulty, playerName } = useGameStore();
  
  // Typewriter states
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const [typingSpeed] = useState(30); // milliseconds per character
  
  // Modal states
  const [showNameInput, setShowNameInput] = useState(false);
  const [playerNameInput, setPlayerNameInput] = useState('');
  const [showDifficultySelection, setShowDifficultySelection] = useState(false);
  const [showChoices, setShowChoices] = useState(false);
  
  const nameInputRef = useRef<HTMLInputElement>(null);
  const currentDialogueNode = getCurrentNode();
  
  // FIXED: Add refs to prevent race conditions
  const sceneCompleteCalledRef = useRef<boolean>(false);
  const lastActiveDialogueRef = useRef<string | null>(null);
  
  // Map MentorId to sprite character ID
  const getCharacterSpriteId = (mentorId: string): CharacterId => {
    switch (mentorId) {
      case MentorId.GARCIA:
        return 'garcia';
      case MentorId.KAPOOR:
        return 'kapoor';
      case MentorId.JESSE:
        return 'jesse';
      case MentorId.QUINN:
        return 'quinn';
      default:
        return 'unknown';
    }
  };
  
  // Get current dialogue text (with variable replacement)
  const getCurrentDialogueText = useCallback(() => {
    if (!currentDialogueNode?.text) return '';
    return currentDialogueNode.text.replace(/\[PLAYER_NAME\]/g, playerName || 'Resident');
  }, [currentDialogueNode?.text, playerName]);
  
  // Reset typewriter when dialogue changes
  useEffect(() => {
    if (scene.hasTypewriter && currentDialogueNode?.text) {
      setDisplayedText('');
      setIsTyping(true);
      setShowChoices(false);
      sceneCompleteCalledRef.current = false; // Reset on new dialogue
    }
  }, [currentDialogueNode?.id, scene.hasTypewriter]);
  
  // Typewriter effect - FIXED: Removed getCurrentDialogueText from deps array
  useEffect(() => {
    if (!scene.hasTypewriter || !isTyping || !currentDialogueNode?.text) return;
    
    const processedText = getCurrentDialogueText();
    
    if (displayedText.length >= processedText.length) {
      setIsTyping(false);
      return;
    }
    
    const timer = setTimeout(() => {
      setDisplayedText(processedText.substring(0, displayedText.length + 1));
    }, typingSpeed);
    
    return () => clearTimeout(timer);
  }, [displayedText, isTyping, scene.hasTypewriter, currentDialogueNode?.text, typingSpeed]); // Removed getCurrentDialogueText
  
  // Show choices after typing completes
  useEffect(() => {
    if (scene.hasTypewriter && !isTyping && currentDialogueNode?.options && scene.hasChoices) {
      console.log('[SceneRenderer] Showing choices for node:', currentDialogueNode.id, 'Options:', currentDialogueNode.options);
      setShowChoices(true);
    }
  }, [isTyping, currentDialogueNode?.id, currentDialogueNode?.options, scene.hasChoices, scene.hasTypewriter]);
  
  // Focus name input
  useEffect(() => {
    if (showNameInput && nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, [showNameInput]);
  
  // Complete typing animation - FIXED: Removed getCurrentDialogueText from deps
  const completeTyping = useCallback(() => {
    if (isTyping && currentDialogueNode?.text) {
      const processedText = getCurrentDialogueText();
      setDisplayedText(processedText);
      setIsTyping(false);
    }
  }, [isTyping, currentDialogueNode?.text]); // Removed getCurrentDialogueText from deps
  
  // Handle name submission
  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (playerNameInput.trim()) {
      onNameSubmit(playerNameInput.trim());
      setShowNameInput(false);
      
      // FIXED: Continue dialogue flow after name input
      const currentNode = getCurrentNode();
      if (currentNode?.options) {
        const nameInputOption = currentNode.options.find((opt: any) => 
          (opt as any).isNameInput
        );
        if (nameInputOption) {
          console.log('[SceneRenderer] Name submitted, continuing dialogue with option:', nameInputOption.id);
          selectOption(nameInputOption.id);
        }
      }
    }
  };
  
  // Handle difficulty selection
  const handleDifficultySelect = (difficulty: Difficulty) => {
    setDifficulty(difficulty);
    setShowDifficultySelection(false);
    
    // FIXED: Continue dialogue flow after difficulty selection
    const currentNode = getCurrentNode();
    if (currentNode?.options) {
      const triggerOption = currentNode.options.find((opt: any) => 
        (opt as any).triggersActivity
      );
      if (triggerOption) {
        console.log('[SceneRenderer] Difficulty selected, continuing dialogue with option:', triggerOption.id);
        selectOption(triggerOption.id);
      }
    }
  };
  
  // FIXED: Handle regular dialogue click - removed unstable function refs from deps
  const handleDialogueClick = useCallback(() => {
    if (scene.hasTypewriter && isTyping) {
      completeTyping();
      return;
    }
    
    // Only progress scene if dialogue has no more options/choices
    const availableOptions = getAvailableOptions();
    const currentNode = getCurrentNode();
    
    if (!currentNode) {
      // No current node means dialogue ended, move to next scene
      if (!sceneCompleteCalledRef.current) {
        sceneCompleteCalledRef.current = true;
        onSceneComplete();
      }
      return;
    }
    
    if (availableOptions.length === 0 && !showChoices && !isTyping) {
      // No options available and not showing choices, dialogue is complete
      endDialogue();
      if (!sceneCompleteCalledRef.current) {
        sceneCompleteCalledRef.current = true;
        onSceneComplete();
      }
    }
  }, [scene.hasTypewriter, isTyping, showChoices, completeTyping]); // Removed unstable function refs
  
  // FIXED: Handle space key for advancement - now uses stable callback ref
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        handleDialogueClick();
      }
    };
    
    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [handleDialogueClick]);
  
  // FIXED: Check for dialogue completion - removed unstable function refs from deps
  useEffect(() => {
    // Track active dialogue changes to detect completion
    if (lastActiveDialogueRef.current && !activeDialogueId && !sceneCompleteCalledRef.current) {
      // Dialogue ended, move to next scene
      console.log('[SceneRenderer] Dialogue ended, completing scene');
      sceneCompleteCalledRef.current = true;
      setTimeout(() => onSceneComplete(), 300);
    }
    
    // Update last active dialogue ref
    lastActiveDialogueRef.current = activeDialogueId;
  }, [activeDialogueId]); // Only depend on activeDialogueId
  
  // Handle option selection within dialogue
  const handleOptionSelect = (optionId: string) => {
    const currentNode = getCurrentNode();
    const selectedOption = currentNode?.options.find((opt: any) => opt.id === optionId);
    
    console.log('[SceneRenderer] Option selected:', optionId, 'Option details:', selectedOption);
    
    if (!selectedOption) {
      console.warn('Selected option not found:', optionId);
      return;
    }
    
    // Handle special option types
    if ((selectedOption as any).isNameInput) {
      console.log('[SceneRenderer] Name input option selected');
      setShowChoices(false);
      setShowNameInput(true);
      return;
    }
    
    if ((selectedOption as any).triggersActivity) {
      console.log('[SceneRenderer] Activity/difficulty selection option selected');
      setShowChoices(false);
      
      // Check if this is in the prologue scene (which should trigger difficulty selection)
      if (scene.id === 'PROLOGUE_INTRO' || scene.hasDifficultySelection) {
        console.log('[SceneRenderer] Triggering difficulty selection modal');
        setShowDifficultySelection(true);
        return;
      }
      
      // For other activity triggers, just continue dialogue - activity system can be added later
      selectOption(optionId);
      return;
    }
    
    // Regular option selection
    console.log('[SceneRenderer] Regular option selected, calling selectOption');
    selectOption(optionId);
    setShowChoices(false);
  };
  
  // Apply colored styling to names
  const getStyledText = (text: string) => {
    const parts = [];
    let remaining = text;
    
    // Define replacements
    const replacements = [
      { pattern: /Dr\. Garcia/g, component: DrGarciaName },
      { pattern: /Dr\. Kapoor/g, component: DrKapoorName },
      { pattern: /Dr\. Quinn/g, component: DrQuinnName },
      { pattern: /Memorial General Hospital/g, component: HospitalName },
      { pattern: /\bJesse\b/g, component: JesseName }
    ];
    
    while (remaining.length > 0) {
      let foundMatch = false;
      
      for (const { pattern, component: Component } of replacements) {
        const match = remaining.match(pattern);
        if (match && match.index !== undefined) {
          // Add text before match
          if (match.index > 0) {
            parts.push(remaining.substring(0, match.index));
          }
          
          // Add styled component
          parts.push(
            <Component key={`styled-${Math.random()}`}>
              {match[0]}
            </Component>
          );
          
          // Update remaining text
          remaining = remaining.substring(match.index + match[0].length);
          foundMatch = true;
          break;
        }
      }
      
      if (!foundMatch) {
        parts.push(remaining);
        break;
      }
    }
    
    return <>{parts}</>;
  };
  
  return (
    <SceneContainer $background={scene.background}>
      {/* Hospital background for prologue scenes */}
      {scene.id.includes('PROLOGUE') && (
        <BackgroundOverlay>
          <Image 
            src="/images/hospital.png" 
            alt="Hospital" 
            fill
            className="object-cover"
            priority
          />
        </BackgroundOverlay>
      )}
      
      {/* Character Portrait */}
      {currentDialogueNode?.mentorId && (
        <CharacterPortrait>
          <div style={{ 
            position: 'relative',
            width: `${42 * 8}px`,
            height: `${42 * 8}px`,
            overflow: 'hidden'
          }}>
            <Image 
              src="/images/characters/sprites/characters-portrait.png"
              alt={`Portrait of ${currentDialogueNode.mentorId}`}
              width={210}
              height={42}
              style={{
                objectFit: 'none',
                objectPosition: `-${3 * 42}px 0px`, // Default to Garcia position
                imageRendering: 'pixelated',
                transform: 'scale(8)',
                transformOrigin: 'top left'
              }}
              unoptimized={true}
            />
          </div>
        </CharacterPortrait>
      )}
      
      {/* Main Dialogue */}
      {activeDialogueId && !showNameInput && !showDifficultySelection && (
        <DialogueBox 
          $hasTypewriter={scene.hasTypewriter}
          $showChoices={showChoices}
          onClick={handleDialogueClick}
        >
          <DialogueHeader>
            {currentDialogueNode?.mentorId === 'garcia' ? 'Dr. Garcia' : 
             currentDialogueNode?.mentorId === 'quinn' ? 'Dr. Quinn' :
             currentDialogueNode?.mentorId === 'kapoor' ? 'Dr. Kapoor' :
             currentDialogueNode?.mentorId === 'jesse' ? 'Jesse' :
             'Narrator'}
          </DialogueHeader>
          
          <DialogueContent>
            {scene.hasTypewriter ? (
              <TypewriterText>
                {getStyledText(displayedText)}
                {isTyping && <span className="cursor">|</span>}
              </TypewriterText>
            ) : (
              <div>{getCurrentDialogueText()}</div>
            )}
          </DialogueContent>
          
          {/* Choice buttons */}
          {showChoices && currentDialogueNode?.options && (
            <ChoiceContainer>
              {currentDialogueNode.options.map((option, index) => (
                <ChoiceButton 
                  key={option.id || index}
                  onClick={() => handleOptionSelect(option.id)}
                >
                  {option.text}
                </ChoiceButton>
              ))}
            </ChoiceContainer>
          )}
          
          {/* Continue button */}
          {!showChoices && !isTyping && (
            <ContinueButton>
              Continue
            </ContinueButton>
          )}
        </DialogueBox>
      )}
      
      {/* Non-typewriter dialogue fallback */}
      {activeDialogueId && !scene.hasTypewriter && !showNameInput && !showDifficultySelection && (
        <DialogueView />
      )}
      
      {/* Name Input Modal */}
      {showNameInput && (
        <NameInputOverlay>
          <NameInputBox>
            <NameInputTitle>What is your name?</NameInputTitle>
            <NameInputForm onSubmit={handleNameSubmit}>
              <NameInput
                ref={nameInputRef}
                type="text"
                value={playerNameInput}
                onChange={(e) => setPlayerNameInput(e.target.value)}
                placeholder="Enter your name"
                maxLength={30}
              />
              <SubmitButton 
                type="submit"
                $hasText={Boolean(playerNameInput.trim())}
                disabled={!playerNameInput.trim()}
              >
                Introduce Yourself
              </SubmitButton>
            </NameInputForm>
          </NameInputBox>
        </NameInputOverlay>
      )}
      
      {/* Difficulty Selection Modal */}
      {showDifficultySelection && (
        <DifficultyOverlay>
          <DifficultyBox>
            <DialogueHeader>Select Your Background</DialogueHeader>
            <DialogueContent>
              Your academic record is impressive. This will help me tailor your residency experience appropriately.
            </DialogueContent>
            <ChoiceContainer>
              <DifficultyChoice onClick={() => handleDifficultySelect(Difficulty.BEGINNER)}>
                I'm fresh out of undergrad with a physics degree. <BeginnerModeText>Beginner Mode</BeginnerModeText>
              </DifficultyChoice>
              <DifficultyChoice onClick={() => handleDifficultySelect(Difficulty.STANDARD)}>
                I just finished my doctorate in medical physics. <StandardModeText>Standard Mode</StandardModeText>
              </DifficultyChoice>
              <DifficultyChoice onClick={() => handleDifficultySelect(Difficulty.EXPERT)}>
                I practiced medical physics in another country. <ExpertModeText>Expert Mode</ExpertModeText>
              </DifficultyChoice>
            </ChoiceContainer>
          </DifficultyBox>
        </DifficultyOverlay>
      )}
      
      <InstructionText>
        {showNameInput ? 'Enter your name' : 
         showDifficultySelection ? 'Select your background' :
         (showChoices ? 'Select a response' : 
          (isTyping ? 'Click to speed up text' : 'Click to continue'))}
      </InstructionText>
    </SceneContainer>
  );
};

export default SceneRenderer; 