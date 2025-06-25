'use client';

import { useState, useEffect, useRef } from 'react';
import { useDialogueStore } from '@/app/store/dialogueStore';
import { DialogueOption } from '@/app/types';
import { useKnowledgeStore } from '@/app/store/knowledgeStore';
import styled, { keyframes } from 'styled-components';
import PortraitImage from '../ui/PortraitImage';
import { CharacterId, isValidCharacterId } from '@/app/utils/portraitUtils';
import { colors, spacing, typography, borders, animation } from '@/app/styles/pixelTheme';
import { mixins } from '@/app/styles/pixelTheme';
import { getRoomBackground } from '@/app/utils/roomBackgrounds';
import { useReactionSystem, getPortraitAnimation, PortraitAnimationType, ReactionSymbolType } from '../ui/ReactionSystem';

// Keyframe animations
const blink = keyframes`
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
`;

const pulse = keyframes`
  0% { opacity: 0.7; }
  50% { opacity: 1; }
  100% { opacity: 0.7; }
`;

interface DialogueResult {
  dialogueId: string;
  completed: boolean;
}

interface NarrativeDialogueProps {
  dialogueId: string;
  onComplete?: (results: DialogueResult) => void;
  roomId?: string; // Room context for background selection
}

// Add stage direction parsing utility
interface ParsedDialogue {
  stageDirections: string[];
  cleanText: string;
}

const parseDialogueText = (text: string): ParsedDialogue => {
  const stageDirections: string[] = [];
  
  // Extract all text in square brackets
  const stageDirectionRegex = /\[([^\]]+)\]/g;
  let match;
  
  while ((match = stageDirectionRegex.exec(text)) !== null) {
    stageDirections.push(match[1]);
  }
  
  // Remove stage directions from the main text and clean up extra whitespace
  const cleanText = text
    .replace(stageDirectionRegex, '')
    .replace(/\n\s*\n\s*\n/g, '\n\n') // Remove triple+ line breaks
    .replace(/^\s+|\s+$/g, '') // Trim start and end
    .replace(/\n\s*\n/g, '\n\n'); // Normalize double line breaks
  
  return { stageDirections, cleanText };
};

const Container = styled.div<{ $roomId?: string }>`
  width: 100vw;
  height: 100vh;
  display: flex;
  position: relative;
  font-family: ${typography.fontFamily.pixel};
  color: ${colors.text};
  overflow: hidden;
  
  /* Dynamic background based on room */
  ${props => {
    const roomConfig = getRoomBackground(props.$roomId);
    
    if (roomConfig.backgroundImage) {
      return `
        background-image: url('${roomConfig.backgroundImage}');
        background-size: cover;
        background-position: center;
        background-repeat: no-repeat;
        
        &::before {
          content: '';
          position: absolute;
          inset: 0;
          background: ${roomConfig.atmosphere?.overlay || 'rgba(0, 0, 0, 0.3)'};
          pointer-events: none;
          z-index: 1;
        }
      `;
    }
    
    return `
      background: ${roomConfig.fallbackGradient};
      
      &::before {
        content: '';
        position: absolute;
        inset: 0;
        background: ${roomConfig.atmosphere?.overlay || ''};
        pointer-events: none;
        z-index: 1;
      }
    `;
  }}
  
  /* Ensure no scrollbars appear anywhere - comprehensive scrollbar hiding */
  ::-webkit-scrollbar {
    display: none;
  }
  -ms-overflow-style: none;
  scrollbar-width: none;
  
  /* Apply to all child elements as well */
  * {
    ::-webkit-scrollbar {
      display: none;
    }
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
`;

const CharacterSection = styled.div`
  flex: 0 0 40%;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: ${spacing.xl};
  margin-top: -200px; /* Allow character to extend upward beyond section bounds */
  position: relative;
  overflow: visible; /* Allow character to extend beyond bounds */
  z-index: 2; /* Above background overlay, below foreground */
  
  /* Hide any potential scrollbars in character section */
  ::-webkit-scrollbar {
    display: none;
  }
  -ms-overflow-style: none;
  scrollbar-width: none;
`;

// New: Foreground layer for depth effect
const ForegroundLayer = styled.div<{ $roomId?: string }>`
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 3; /* Above everything */
  
  ${props => {
    const roomConfig = getRoomBackground(props.$roomId);
    
    if (roomConfig.foregroundImage) {
      return `
        background-image: url('${roomConfig.foregroundImage}');
        background-size: cover;
        background-position: center;
        background-repeat: no-repeat;
      `;
    }
    
    return '';
  }}
`;

// Animation wrapper that doesn't interfere with positioning
const AnimationWrapper = styled.div<{ $animation?: PortraitAnimationType }>`
  /* Portrait animations applied to wrapper */
  overflow: visible; /* Ensure wrapper doesn't clip character */
  ${props => props.$animation && getPortraitAnimation(props.$animation)}
`;

const CharacterPortrait = styled.div<{ $roomId?: string }>`
  width: 600px;
  height: 600px;
  position: relative;
  overflow: visible; /* Allow character to extend beyond portrait bounds */
  
  /* Enhanced styling for background cohesion */
  transform: scale(1.4) translate(120px, -20px); /* Reduced upward translation to avoid clipping */
  filter: 
    drop-shadow(0 0 20px rgba(0, 0, 0, 0.5))
    brightness(0.92)
    contrast(1.08)
    ${props => {
      // Room-specific character color adjustments
      switch(props.$roomId) {
        case 'physics-office':
          return 'hue-rotate(-3deg) saturate(0.96)'; // Cooler, academic tone
        case 'linac-1':
          return 'hue-rotate(2deg) saturate(1.02)'; // Slightly warmer, clinical
        case 'linac-2':
          return 'hue-rotate(2deg) saturate(1.04)'; // Warmer, technical precision
        case 'dosimetry-lab':
          return 'hue-rotate(-5deg) saturate(0.94)'; // Technical, precise
        case 'simulation-suite':
          return 'hue-rotate(1deg) saturate(1.00)'; // Neutral, high-tech
        default:
          return 'hue-rotate(-3deg) saturate(0.96)';
      }
    }};
  
  /* Ensure pixel-perfect rendering for all images */
  img {
    image-rendering: -moz-crisp-edges;
    image-rendering: -webkit-crisp-edges;
    image-rendering: pixelated;
    image-rendering: crisp-edges;
    -ms-interpolation-mode: nearest-neighbor;
  }
  
  /* Apply pixel perfect rendering from mixins */
  ${mixins.pixelPerfect}
`;

const DialogueSection = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: ${spacing.xl};
  padding-bottom: ${spacing.xxl};
  padding-left: ${spacing.xxl};
  overflow: hidden;
  z-index: 5; /* Above foreground layer (z-index: 3) */
  
  /* Hide scrollbars in dialogue section */
  ::-webkit-scrollbar {
    display: none;
  }
  -ms-overflow-style: none;
  scrollbar-width: none;
`;

const DialogueBox = styled.div<{ $roomId?: string }>`
  background: ${colors.background};
  ${borders.pixelBorder.outer}
  border-radius: ${spacing.sm};
  padding: ${spacing.xl};
  margin-bottom: ${spacing.lg};
  min-height: 150px;
  position: relative;
  box-shadow: 0 8px 0 ${colors.border}, 0 0 0 4px ${colors.border};
  
  ${props => props.$roomId === 'physics-office' && `
    /* Medical chart style for physics office */
    background: linear-gradient(135deg, 
      ${colors.background} 0%, 
      rgba(59, 130, 246, 0.03) 100%
    );
    
    &::before {
      content: '';
      position: absolute;
      top: 8px;
      right: 12px;
      width: 40px;
      height: 40px;
      background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ctext y='50' font-size='30' fill='%23ffffff10'%3E∑%3C/text%3E%3C/svg%3E");
      opacity: 0.1;
      pointer-events: none;
    }
    
    border-left: 3px solid rgba(59, 130, 246, 0.3);
  `}
  
  ${props => props.$roomId === 'linac-1' && `
    /* Clinical style for LINAC Room 1 */
    background: linear-gradient(135deg, 
      ${colors.background} 0%, 
      rgba(16, 185, 129, 0.03) 100%
    );
    
    &::before {
      content: '';
      position: absolute;
      top: 8px;
      right: 12px;
      width: 40px;
      height: 40px;
      background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ctext y='50' font-size='24' fill='%2310b98115'%3E⚕%3C/text%3E%3C/svg%3E");
      opacity: 0.2;
      pointer-events: none;
    }
    
    border-left: 3px solid rgba(16, 185, 129, 0.3);
  `}
  
  ${props => props.$roomId === 'linac-2' && `
    /* Technical equipment style for LINAC Room 2 */
    background: linear-gradient(135deg, 
      ${colors.background} 0%, 
      rgba(245, 158, 11, 0.04) 100%
    );
    
    &::before {
      content: '';
      position: absolute;
      top: 8px;
      right: 12px;
      width: 40px;
      height: 40px;
      background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ctext y='50' font-size='24' fill='%23f59e0b15'%3E⚡%3C/text%3E%3C/svg%3E");
      opacity: 0.2;
      pointer-events: none;
    }
    
    &::after {
      content: '';
      position: absolute;
      bottom: 8px;
      left: 12px;
      width: 30px;
      height: 30px;
      background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ctext y='50' font-size='20' fill='%23f59e0b10'%3E⚙%3C/text%3E%3C/svg%3E");
      opacity: 0.15;
      pointer-events: none;
    }
    
    border-left: 3px solid rgba(245, 158, 11, 0.4);
    box-shadow: 
      0 8px 0 ${colors.border}, 
      0 0 0 4px ${colors.border},
      inset 0 1px 0 rgba(245, 158, 11, 0.1);
  `}
  
  ${props => props.$roomId === 'dosimetry-lab' && `
    /* Technical laboratory style for dosimetry lab */
    background: linear-gradient(135deg, 
      ${colors.background} 0%, 
      rgba(236, 72, 153, 0.04) 100%
    );
    
    &::before {
      content: '';
      position: absolute;
      top: 8px;
      right: 12px;
      width: 40px;
      height: 40px;
      background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ctext y='50' font-size='26' fill='%23ec489915'%3E⚛%3C/text%3E%3C/svg%3E");
      opacity: 0.2;
      pointer-events: none;
    }
    
    &::after {
      content: '';
      position: absolute;
      bottom: 8px;
      left: 12px;
      width: 35px;
      height: 35px;
      background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ctext y='50' font-size='22' fill='%23ec489912'%3E📊%3C/text%3E%3C/svg%3E");
      opacity: 0.15;
      pointer-events: none;
    }
    
    border-left: 3px solid rgba(236, 72, 153, 0.4);
    box-shadow: 
      0 8px 0 ${colors.border}, 
      0 0 0 4px ${colors.border},
      inset 0 1px 0 rgba(236, 72, 153, 0.1);
  `}
  
  ${props => props.$roomId === 'simulation-suite' && `
    /* High-tech style for simulation suite */
    border-left: 3px solid rgba(245, 158, 11, 0.3);
  `}
`;

const SpeakerName = styled.div`
  color: ${colors.highlight};
  font-weight: bold;
  font-size: ${typography.fontSize.lg};
  margin-bottom: ${spacing.sm};
  text-shadow: ${typography.textShadow.pixel};
`;

// Add stage direction styling
const StageDirectionContainer = styled.div`
  margin-bottom: ${spacing.md};
  opacity: 0.8;
`;

const StageDirection = styled.div`
  font-style: italic;
  font-size: ${typography.fontSize.sm};
  color: ${colors.textDim};
  line-height: 1.4;
  margin-bottom: ${spacing.xs};
  padding: ${spacing.xs} ${spacing.sm};
  background: rgba(0, 0, 0, 0.2);
  border-left: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: ${spacing.xs};
  
  &::before {
    content: '※ ';
    opacity: 0.6;
    font-style: normal;
  }
`;

const DialogueText = styled.div<{ $isTyping: boolean }>`
  font-size: ${typography.fontSize.md};
  line-height: 1.6;
  color: ${colors.text};
  cursor: pointer;
  min-height: 60px; // Reduced since stage directions take some space
  
  &::after {
    content: '▋';
    animation: ${blink} 1s infinite;
    margin-left: 4px;
    opacity: ${props => props.$isTyping ? 1 : 0};
  }
`;

const OptionsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${spacing.sm};
`;

const OptionButton = styled.button<{ $disabled?: boolean; $selected?: boolean }>`
  background: ${props => {
    if (props.$disabled) return colors.backgroundAlt;
    if (props.$selected) return colors.highlight;
    return colors.backgroundAlt;
  }};
  ${props => props.$selected ? borders.pixelBorder.active(colors.highlight) : borders.pixelBorder.outer}
  border-radius: ${spacing.xs};
  padding: ${spacing.md} ${spacing.lg};
  color: ${props => {
    if (props.$disabled) return colors.textDim;
    if (props.$selected) return colors.background;
    return colors.text;
  }};
  font-family: ${typography.fontFamily.pixel};
  font-size: ${typography.fontSize.sm};
  text-align: left;
  cursor: ${props => props.$disabled ? 'not-allowed' : 'pointer'};
  transition: all ${animation.duration.fast} ${animation.easing.pixel};
  opacity: ${props => props.$disabled ? 0.6 : 1};
  
  /* Add subtle glow for selected option */
  box-shadow: ${props => props.$selected && !props.$disabled ? `0 0 8px rgba(132, 90, 245, 0.4)` : 'none'};
  
  &:hover {
    ${props => !props.$disabled && !props.$selected && `
      ${borders.pixelBorder.active(colors.highlight)}
      background: ${colors.highlight};
      color: ${colors.background};
    `}
  }
  
  &:disabled {
    cursor: not-allowed;
  }
`;

const ResourceIndicator = styled.span<{ $type: 'insight' | 'momentum' | 'relationship' }>`
  font-size: ${typography.fontSize.xs};
  padding: 2px 6px;
  border-radius: 3px;
  margin-left: ${spacing.xs};
  color: ${props => {
    switch(props.$type) {
      case 'insight': return colors.insight;
      case 'momentum': return colors.highlight;
      case 'relationship': return colors.text;
      default: return colors.text;
    }
  }};
  
  &::before {
    content: '${props => {
      switch(props.$type) {
        case 'insight': return '◆';
        case 'momentum': return '⚡';
        case 'relationship': return '👥';
        default: return '';
      }
    }}';
    margin-right: 2px;
  }
`;

const ContinuePrompt = styled.div`
  position: absolute;
  bottom: ${spacing.sm};
  right: ${spacing.md};
  color: ${colors.textDim};
  font-size: ${typography.fontSize.xs};
  animation: ${pulse} 2s infinite;
`;

export default function NarrativeDialogue({ dialogueId, onComplete, roomId }: NarrativeDialogueProps) {
  const [initialized, setInitialized] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typedText, setTypedText] = useState('');
  const [currentCharIndex, setCurrentCharIndex] = useState(0);
  const [currentPortraitAnimation, setCurrentPortraitAnimation] = useState<PortraitAnimationType>('none');
  const [parsedDialogue, setParsedDialogue] = useState<ParsedDialogue>({ stageDirections: [], cleanText: '' });
  const [selectedOptionIndex, setSelectedOptionIndex] = useState(0); // For arrow key navigation
  const typingSpeed = 30; // ms per character
  
  // Reaction system
  const containerRef = useRef<HTMLDivElement>(null);
  const { triggerReaction, triggerPortraitAnimation, ReactionSystemComponent } = useReactionSystem(containerRef);
  
  // Dialogue store selectors
  const {
    startDialogue,
    getCurrentNode,
    getActiveDialogue,
    getAvailableOptions,
    selectOption,
    endDialogue,
    getMentor
  } = useDialogueStore();
  
  // Get current dialogue state
  const currentNode = getCurrentNode();
  const activeDialogue = getActiveDialogue();
  const availableOptions = getAvailableOptions();
  
  // Knowledge store for checking star requirements
  const stars = useKnowledgeStore(state => state.stars);
  
  // Start dialogue when component mounts
  useEffect(() => {
    if (!initialized) {
      startDialogue(dialogueId);
      setInitialized(true);
    }
  }, [dialogueId, initialized, startDialogue]);
  
  // Parse dialogue text and type out effect - FIXED: Removed currentCharIndex from dependencies
  useEffect(() => {
    if (!currentNode) return;
    
    // Parse the dialogue text to separate stage directions
    const parsed = parseDialogueText(currentNode.text);
    setParsedDialogue(parsed);
    
    setIsTyping(true);
    setTypedText('');
    setCurrentCharIndex(0);
    
    const text = parsed.cleanText;
    let charIndex = 0;
    
    const intervalId = setInterval(() => {
      if (charIndex < text.length) {
        charIndex++;
        setTypedText(text.substring(0, charIndex));
        setCurrentCharIndex(charIndex);
      } else {
        setIsTyping(false);
        clearInterval(intervalId);
      }
    }, typingSpeed);
    
    return () => clearInterval(intervalId);
  }, [currentNode?.id, typingSpeed]); // Only depend on node ID and typing speed
  
  // Handle dialogue completion
  useEffect(() => {
    if (initialized && !currentNode && onComplete) {
      onComplete({
        dialogueId,
        completed: true
      });
    }
  }, [currentNode, dialogueId, initialized, onComplete]);
  
  // Skip typing animation
  const handleSkipTyping = () => {
    if (isTyping && parsedDialogue.cleanText) {
      setTypedText(parsedDialogue.cleanText);
      setCurrentCharIndex(parsedDialogue.cleanText.length);
      setIsTyping(false);
    }
  };

  // Reset selected option when options change
  useEffect(() => {
    setSelectedOptionIndex(0);
  }, [availableOptions.length]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        if (isTyping) {
          handleSkipTyping();
        } else if (availableOptions.length === 0) {
          // If no options and not typing, continue to next dialogue
          if (onComplete) {
            onComplete({
              dialogueId,
              completed: true
            });
          }
        } else if (availableOptions.length > 0) {
          // Select the highlighted option
          const selectedOption = availableOptions[selectedOptionIndex];
          if (selectedOption && !isOptionDisabled(selectedOption)) {
            handleSelectOption(selectedOption);
          }
        }
      } else if (e.code === 'ArrowUp' || e.code === 'ArrowDown') {
        e.preventDefault();
        if (availableOptions.length > 0 && !isTyping) {
          setSelectedOptionIndex(prevIndex => {
            if (e.code === 'ArrowUp') {
              return prevIndex > 0 ? prevIndex - 1 : availableOptions.length - 1;
            } else {
              return prevIndex < availableOptions.length - 1 ? prevIndex + 1 : 0;
            }
          });
        }
      }
    };
    
    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [isTyping, availableOptions, selectedOptionIndex, onComplete, dialogueId]);
  
  // Handle selecting an option
  const handleSelectOption = (option: DialogueOption) => {
    if (option.id) {
      // Trigger reaction based on option effects
      let reactionType: ReactionSymbolType = '!';
      let animationType: PortraitAnimationType = 'nod';
      
      if (option.insightChange && option.insightChange > 0) {
        reactionType = '💡';
        animationType = 'bounce';
      } else if (option.insightChange && option.insightChange < 0) {
        reactionType = '?';
        animationType = 'shake';
      } else if (option.momentumChange && option.momentumChange > 0) {
        reactionType = '⭐';
        animationType = 'bounce';
      } else if (option.momentumChange && option.momentumChange < 0) {
        reactionType = '...';
        animationType = 'shake';
      }
      
      // Trigger portrait animation
      setCurrentPortraitAnimation(animationType);
      
      // Trigger floating reaction symbol
      triggerReaction(reactionType);
      
      // Reset animation after it completes
      setTimeout(() => {
        setCurrentPortraitAnimation('none');
      }, 1200);
      
      selectOption(option.id);
    }
  };
  
  // Check if option should be disabled
  const isOptionDisabled = (option: DialogueOption) => {
    if (!option.requiredStarId) return false;
    
    const star = stars[option.requiredStarId];
    return !star || !star.active;
  };
  
  // If dialogue not initialized or no current node, show loading
  if (!initialized || !currentNode || !activeDialogue) {
    return (
      <Container>
        <div style={{ 
          position: 'absolute', 
          top: '50%', 
          left: '50%', 
          transform: 'translate(-50%, -50%)',
          color: colors.text,
          fontSize: typography.fontSize.lg
        }}>
          Loading...
        </div>
      </Container>
    );
  }
  
  // Get the current mentor
  const mentor = getMentor(currentNode.mentorId);
  
  return (
    <Container ref={containerRef} $roomId={roomId} className="no-scrollbar">
      {/* Character Portrait Section */}
      <CharacterSection className="no-scrollbar">
        {mentor && isValidCharacterId(mentor.id) && (
          <AnimationWrapper $animation={currentPortraitAnimation}>
            <CharacterPortrait $roomId={roomId}>
              <PortraitImage
                characterId={mentor.id as CharacterId}
                size="detailed"
                alt={mentor.name}
                scale={2}
                pixelated={true}
              />
            </CharacterPortrait>
          </AnimationWrapper>
        )}
      </CharacterSection>
      
      {/* Dialogue Section */}
      <DialogueSection>
        <DialogueBox $roomId={roomId} onClick={handleSkipTyping}>
          {mentor && (
            <SpeakerName>{mentor.name}</SpeakerName>
          )}
          
          {/* Stage Directions */}
          {parsedDialogue.stageDirections.length > 0 && (
            <StageDirectionContainer>
              {parsedDialogue.stageDirections.map((direction, index) => (
                <StageDirection key={index}>
                  {direction}
                </StageDirection>
              ))}
            </StageDirectionContainer>
          )}
          
          <DialogueText $isTyping={isTyping}>
            {typedText}
          </DialogueText>
          {!isTyping && availableOptions.length === 0 && (
            <ContinuePrompt>Click to continue...</ContinuePrompt>
          )}
        </DialogueBox>
        
        {/* Options */}
        {!isTyping && availableOptions.length > 0 && (
          <OptionsContainer>
            {availableOptions.map((option, index) => (
              <OptionButton
                key={option.id}
                onClick={() => handleSelectOption(option)}
                disabled={isOptionDisabled(option)}
                $disabled={isOptionDisabled(option)}
                $selected={index === selectedOptionIndex}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>{option.text}</span>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    {option.insightChange !== undefined && option.insightChange !== 0 && (
                      <ResourceIndicator $type="insight">
                        {option.insightChange > 0 ? '+' : ''}{option.insightChange}
                      </ResourceIndicator>
                    )}
                    {option.momentumChange !== undefined && option.momentumChange !== 0 && (
                      <ResourceIndicator $type="momentum">
                        {option.momentumChange > 0 ? '+' : ''}{option.momentumChange}
                      </ResourceIndicator>
                    )}
                    {option.relationshipChange !== undefined && option.relationshipChange !== 0 && (
                      <ResourceIndicator $type="relationship">
                        {option.relationshipChange > 0 ? '+' : ''}{option.relationshipChange}
                      </ResourceIndicator>
                    )}
                  </div>
                </div>
                {isOptionDisabled(option) && (
                  <div style={{ 
                    marginTop: spacing.xs, 
                    fontSize: typography.fontSize.xs, 
                    color: colors.textDim,
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    🔒 Requires knowledge in this area
                  </div>
                )}
              </OptionButton>
            ))}
          </OptionsContainer>
        )}
      </DialogueSection>
      
      {/* Reaction System for floating symbols */}
      <ReactionSystemComponent />
      
      {/* Foreground Layer for Depth Effect */}
      <ForegroundLayer $roomId={roomId} />
    </Container>
  );
}

// Component exported as default above 