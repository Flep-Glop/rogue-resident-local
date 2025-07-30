'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { useDialogueStore } from '@/app/store/dialogueStore';
import { DialogueOption, DialogueMode } from '@/app/types';
import { useKnowledgeStore } from '@/app/store/knowledgeStore';
import PortraitImage from '../ui/PortraitImage';
import { CharacterId, isValidCharacterId } from '@/app/utils/portraitUtils';
import { colors, spacing, typography, borders, animation, shadows } from '@/app/styles/pixelTheme';
import { mixins } from '@/app/styles/pixelTheme';
import { getRoomBackground } from '@/app/utils/roomBackgrounds';
import { useReactionSystem, getPortraitAnimation, PortraitAnimationType, ReactionSymbolType } from '../ui/ReactionSystem';
import { useSceneNavigation } from '../scenes/GameContainer';
import TypewriterText from '@/app/components/ui/TypewriterText';
import { useTutorialStore } from '@/app/store/tutorialStore';
import ReactionSystemComponent from '@/app/components/ui/ReactionSystem';
import AbilityCardFlip from '@/app/components/ui/AbilityCardFlip';
import { ExpandableDialogContainer, CardContainer } from '@/app/components/ui/PixelContainer';

// === INTERNAL RESOLUTION SYSTEM ===
// Dialogue uses 640x360 internal coordinates (matching physics office native resolution)
const DIALOGUE_INTERNAL_WIDTH = 640;
const DIALOGUE_INTERNAL_HEIGHT = 360;

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
  position: relative;
  
  /* Use 640x360 internal coordinate system - scale entire container to fit viewport */
  width: ${DIALOGUE_INTERNAL_WIDTH}px;
  height: ${DIALOGUE_INTERNAL_HEIGHT}px;
  
  /* Center and scale container to fit viewport while maintaining aspect ratio */
  position: fixed;
  top: 50%;
  left: 50%;
  transform-origin: center;
  transform: translate(-50%, -50%) scale(var(--dialogue-scale));
  
  font-family: ${typography.fontFamily.pixel};
  color: ${colors.text};
  overflow: visible; /* Allow portrait to extend beyond dialogue bounds */
  
  /* Dynamic background based on room */
  ${props => {
    const roomConfig = getRoomBackground(props.$roomId);
    
    if (roomConfig.backgroundImage) {
      return `
        background-image: url('${roomConfig.backgroundImage}');
        background-size: ${DIALOGUE_INTERNAL_WIDTH}px ${DIALOGUE_INTERNAL_HEIGHT}px; /* Native 640x360 size - no scaling */
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
  
  /* Pixel perfect rendering */
  image-rendering: pixelated;
  -webkit-image-rendering: pixelated;
  -moz-image-rendering: crisp-edges;
  
  /* Hide scrollbars */
  ::-webkit-scrollbar { display: none; }
  -ms-overflow-style: none;
  scrollbar-width: none;
  
  * {
    ::-webkit-scrollbar { display: none; }
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
`;

const CharacterSection = styled.div`
  /* Position at bottom left side for better balance with right-aligned dialogue */
  position: absolute;
  bottom: 80px; /* Distance from bottom */
  left: 80px; /* Fixed distance from left edge */
  width: 180px; /* Optimized for true 640x360 portrait size (116px + margin) */
  height: 180px; /* Optimized for true 640x360 portrait size (161px + margin) */
  
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 6; /* Above dialogue content */
  overflow: visible; /* Ensure portrait isn't clipped */
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
  /* True size for Quinn detailed portrait - scaled for 640x360 resolution */
  width: 116px;  /* True Quinn detailed width (half of previous 2x scale) */
  height: 161px; /* True Quinn detailed height (half of previous 2x scale) */
  position: relative;
  overflow: visible; /* Allow portrait to display fully */
  flex-shrink: 0; /* Prevent compression */
  
  /* No transform scaling - portraits rendered at native size for 640x360 */
  transform: translate(0, 0); /* Remove all scaling transforms */
  
  filter: 
    drop-shadow(0 0 15px rgba(0, 0, 0, 0.8)) /* Stronger shadow for better visibility */
    brightness(0.92)
    contrast(1.08)
    ${props => {
      // Room-specific character color adjustments
      switch(props.$roomId) {
        case 'physics-office':
          return 'hue-rotate(-3deg) saturate(0.96)';
        case 'linac-1':
          return 'hue-rotate(2deg) saturate(1.02)';
        case 'linac-2':
          return 'hue-rotate(2deg) saturate(1.04)';
        case 'dosimetry-lab':
          return 'hue-rotate(-5deg) saturate(0.94)';
        case 'simulation-suite':
          return 'hue-rotate(1deg) saturate(1.00)';
        default:
          return 'hue-rotate(-3deg) saturate(0.96)';
      }
    }};
  
  /* Pixel perfect rendering */
  img {
    image-rendering: pixelated;
    -webkit-image-rendering: pixelated; 
    -moz-image-rendering: crisp-edges;
    -ms-interpolation-mode: nearest-neighbor;
    width: 100%;
    height: 100%;
    object-fit: contain; /* Ensure full image is visible */
  }
  
  ${mixins.pixelPerfect}
`;

const DialogueSection = styled.div`
  /* Simplified positioning for pixel containers - positioned to the right */
  position: absolute;
  right: 40px; /* Fixed distance from right edge */
  top: 20%; /* Start from top portion of screen */
  bottom: 20%; /* End before bottom portion */
  width: 400px; /* Fixed width for consistent layout */
  max-width: 55vw; /* Responsive max width */
  
  display: flex;
  flex-direction: column;
  justify-content: center; /* Center the dialogue vertically */
  z-index: 5;
  
  /* Overflow containment for pixel containers */
  overflow: visible;
  contain: layout style;
`;



const SpeakerName = styled.div`
  color: ${colors.highlight};
  font-weight: bold;
  font-size: 20px; /* Reduced from 48px (lg) for more compact speaker name */
  margin-bottom: 2px; /* Drastically reduced padding below name */
  margin-top: 0px; /* Pull up to eliminate container padding gap */
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
  font-family: ${typography.fontFamily.pixel};
  font-size: 18px; /* Reduced from 24px (xs) for more compact text */
  line-height: ${typography.lineHeight.tight}; /* Reduced from normal (1.3) to tight (1.1) */
  color: ${colors.text};
  white-space: pre-wrap;
  
  /* Add cursor animation when typing */
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
  margin-top: ${spacing.lg}; /* Add space between question and button */
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

// Option button content styling (CardContainer handles the border/background)
const OptionContent = styled.div<{ $selected: boolean; $disabled?: boolean }>`
  font-family: ${typography.fontFamily.pixel};
  color: ${props => 
    props.$disabled 
      ? colors.textDim
      : colors.text
  };
  font-size: 16px; /* Smaller button text for dialogue options */
  line-height: 1.4;
  text-align: center;
  width: 100%;
  cursor: ${props => props.$disabled ? 'not-allowed' : 'pointer'};
  transition: all ${animation.duration.normal} ease;
  
  /* Minimal padding for button text - CardContainer already provides 8px padding */
  padding: 2px 4px;
  
  /* Add subtle glow effect for selected state */
  ${props => props.$selected && !props.$disabled && `
    text-shadow: 0 0 4px rgba(132, 90, 245, 0.8);
  `}
  
  /* Resource indicators styling */
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

export default function NarrativeDialogue({ dialogueId, onComplete, roomId }: NarrativeDialogueProps) {
  const [initialized, setInitialized] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typedText, setTypedText] = useState('');
  const [currentCharIndex, setCurrentCharIndex] = useState(0);
  const [currentPortraitAnimation, setCurrentPortraitAnimation] = useState<PortraitAnimationType>('none');
  const [parsedDialogue, setParsedDialogue] = useState<ParsedDialogue>({ stageDirections: [], cleanText: '' });
  const [typingSpeed, setTypingSpeed] = useState(10); // Default speed (was 30) - much faster
  const [selectedOptionIndex, setSelectedOptionIndex] = useState(0); // For keyboard nav
  const [activityTriggered, setActivityTriggered] = useState(false); // Prevent multiple activity triggers
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Scene navigation for tutorial activities
  const { enterTutorialActivity } = useSceneNavigation();
  
  // Reaction system
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
  
  // DEBUG: Log dialogue state and check tutorial mode
  console.log('[NarrativeDialogue] Current state:', {
    currentNode: currentNode?.id,
    activeDialogue: activeDialogue?.id,
    availableOptionsCount: availableOptions.length,
    availableOptions: availableOptions,
    isTyping
  });
  
  // DEBUG: Check tutorial state
  import('@/app/store/tutorialStore').then(({ useTutorialStore }) => {
    const tutorialStore = useTutorialStore.getState();
    console.log('[NarrativeDialogue] Tutorial state:', {
      mode: tutorialStore.mode,
      currentStep: tutorialStore.currentStep,
      activeSequence: tutorialStore.activeSequence
    });
    
    // AUTO-START TUTORIAL FOR TESTING - if tutorial not active and we're trying to load tutorial_quinn_intro
    if (dialogueId === 'tutorial_quinn_intro' && tutorialStore.mode !== 'active_sequence') {
      console.log('[NarrativeDialogue] Auto-starting tutorial for testing...');
      tutorialStore.startTutorialSilently('micro_day', 'quinn_intro');
    }
  });
  
  // Knowledge store for checking star requirements
  const stars = useKnowledgeStore(state => state.stars);
  
  // Tutorial overlay state
  const [showTutorialOverlay, setShowTutorialOverlay] = useState(false);
  const [overlayType, setOverlayType] = useState<'activity' | 'cafeteria'>('activity');
  const [overlayTriggered, setOverlayTriggered] = useState(false);
  
  // Ability card flip state
  const [showAbilityCard, setShowAbilityCard] = useState(false);
  const [currentAbilityId, setCurrentAbilityId] = useState<string | null>(null);
  
  // Ability card image mapping
  const ABILITY_CARD_IMAGES: Record<string, { front: string; back: string }> = {
    'pattern_recognition': {
      front: '/images/cards/card-laser-focus.png',
      back: '/images/cards/card-back-orange.png'
    },
    'laser_focus': {
      front: '/images/cards/card-laser-focus.png', 
      back: '/images/cards/card-back-orange.png'
    },
    // Add more abilities as needed - can reuse the orange back for all cards
  };
  
  // === DIALOGUE SCALING SYSTEM ===
  // Calculate scale to fit 640x360 dialogue into viewport while maintaining aspect ratio
  useEffect(() => {
    const updateDialogueScale = () => {
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      const scaleX = viewportWidth / DIALOGUE_INTERNAL_WIDTH;
      const scaleY = viewportHeight / DIALOGUE_INTERNAL_HEIGHT;
      const dialogueScale = Math.min(scaleX, scaleY);
      
      // Set CSS custom property for dialogue scaling
      document.documentElement.style.setProperty('--dialogue-scale', dialogueScale.toString());
      
      console.log(`[NarrativeDialogue] Dialogue scale: ${dialogueScale.toFixed(3)} (${viewportWidth}x${viewportHeight} → ${DIALOGUE_INTERNAL_WIDTH}x${DIALOGUE_INTERNAL_HEIGHT})`);
    };
    
    updateDialogueScale();
    window.addEventListener('resize', updateDialogueScale);
    
    return () => {
      window.removeEventListener('resize', updateDialogueScale);
    };
  }, []);

  // Start dialogue when component mounts
  useEffect(() => {
    if (!initialized) {
      // Reset activity trigger flag for new dialogue
      setActivityTriggered(false);
      
      // Check if this dialogue is already active (e.g., returning from tutorial activity)
      const currentActiveDialogue = getActiveDialogue();
      if (currentActiveDialogue?.id === dialogueId) {
        // Dialogue already active, continuing
        console.log('[NarrativeDialogue] Dialogue already active:', dialogueId);
        setInitialized(true);
      } else {
        console.log('[NarrativeDialogue] Starting new dialogue:', dialogueId);
        startDialogue(dialogueId);
        setInitialized(true);
      }
    }
  }, [dialogueId, initialized, startDialogue, getActiveDialogue]);


  
  // Parse dialogue text and type out effect
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

  // Reset activity trigger flag when dialogue ID changes
  useEffect(() => {
    setActivityTriggered(false);
  }, [dialogueId]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyPress = async (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        // Check if there are any active overlays that prevent space activation
        const { useTutorialStore } = await import('@/app/store/tutorialStore');
        const tutorialStore = useTutorialStore.getState();
        const hasPreventSpaceOverlay = tutorialStore.activeOverlays.some((overlay: any) => overlay.preventSpaceActivation);
        
        if (hasPreventSpaceOverlay) {
          // Space activation is prevented by an active overlay
          return;
        }
        
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
    if (!option.id) return;
    
    // Check if this option grants an ability - show card flip first
    if ((option as any).receivesAbility) {
      console.log('[NarrativeDialogue] Ability received:', (option as any).receivesAbility);
      setCurrentAbilityId((option as any).receivesAbility);
      setShowAbilityCard(true);
      
      // Process the dialogue option but don't continue until card is dismissed
      selectOption(option.id);
      return;
    }
    
    // Check if this is a tutorial activity trigger - launch directly
    if ((option as any).triggersActivity && activeDialogue?.isTutorial) {
      // Prevent multiple triggers of the same activity
      if (activityTriggered) {
        console.log('[NarrativeDialogue] Activity already triggered, ignoring duplicate call');
        return;
      }
      
      console.log('[NarrativeDialogue] Tutorial activity triggered, launching directly');
      setActivityTriggered(true);
      
      // Process option and launch activity immediately (no overlay)
      selectOption(option.id!);
      
      // Dynamic activity parameters based on mentor
      const mentorId = currentNode?.mentorId || 'garcia';
      if (mentorId === 'garcia') {
        enterTutorialActivity('Mrs. Patterson', 'garcia', roomId || 'physics-office');
      } else if (mentorId === 'jesse') {
        enterTutorialActivity('Bertha (LINAC)', 'jesse', roomId || 'linac-1');
      } else if (mentorId === 'kapoor') {
        enterTutorialActivity('Calibration Setup', 'kapoor', roomId || 'dosimetry-lab');
      } else if (mentorId === 'quinn') {
        enterTutorialActivity('Physics Fundamentals', 'quinn', roomId || 'physics-office');
      } else {
        // Default to Garcia for other mentors
        enterTutorialActivity('Mrs. Patterson', 'garcia', roomId || 'physics-office');
      }
      return;
    }
    
    // Regular dialogue option handling - SINGLE selectOption call
    selectOption(option.id);
    
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
  };
  
  // Check if option should be disabled
  const isOptionDisabled = (option: DialogueOption) => {
    if (!option.requiredStarId) return false;
    
    const star = stars[option.requiredStarId];
    return !star || !star.active;
  };
  
  // Handle ability card flip completion
  const handleCardFlipComplete = () => {
    console.log('[NarrativeDialogue] Card flip animation completed');
  };

  // Handle ability card sequence completion
  const handleCardComplete = () => {
    console.log('[NarrativeDialogue] Card sequence completed, continuing dialogue');
    setShowAbilityCard(false);
    setCurrentAbilityId(null);
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
  const mentor = currentNode ? getMentor(currentNode.mentorId) : null;
  

  
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
                scale={1.0}
                pixelated={true}
              />
            </CharacterPortrait>
          </AnimationWrapper>
        )}
      </CharacterSection>
      
      {/* Dialogue Section */}
      <DialogueSection>
        <ExpandableDialogContainer 
          domain="physics"
          onClick={handleSkipTyping}
        >
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

          {/* Options Section - MOVED INSIDE DialogueSection */}
          {!isTyping && availableOptions.length > 0 && (
            <OptionsContainer>
              {availableOptions.map((option, index) => (
                <CardContainer
                  key={option.id}
                  size="xs"
                  domain="physics"
                  isActive={index === selectedOptionIndex}
                  isDisabled={isOptionDisabled(option)}
                  onClick={() => handleSelectOption(option)}
                  style={{ 
                    cursor: isOptionDisabled(option) ? 'not-allowed' : 'pointer',
                    filter: isOptionDisabled(option) 
                      ? 'grayscale(1) opacity(0.6)' 
                      : index === selectedOptionIndex 
                        ? 'brightness(1.2) saturate(1.1)' 
                        : 'none',
                    overflow: 'visible', /* Allow tooltips to extend beyond bounds */
                    contain: 'layout style' /* Prevent layout thrashing */
                  }}
                >
                  <OptionContent $selected={index === selectedOptionIndex} $disabled={isOptionDisabled(option)}>
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
                  </OptionContent>
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
                </CardContainer>
              ))}
            </OptionsContainer>
          )}
        </ExpandableDialogContainer>
      </DialogueSection>
      
      {/* Reaction System for floating symbols */}
      <ReactionSystemComponent />
      
      {/* Foreground Layer for Depth Effect */}
      <ForegroundLayer $roomId={roomId} />
      
      {/* Ability Card Flip Display */}
      {showAbilityCard && currentAbilityId && ABILITY_CARD_IMAGES[currentAbilityId] && (
        <AbilityCardFlip
          cardId={currentAbilityId}
          frontImage={ABILITY_CARD_IMAGES[currentAbilityId].front}
          backImage={ABILITY_CARD_IMAGES[currentAbilityId].back}
          autoFlip={false}
          autoFlipDelay={2000}
          onFlipComplete={handleCardFlipComplete}
          onCardComplete={handleCardComplete}
        />
      )}
    </Container>
  );
}

// Component exported as default above 