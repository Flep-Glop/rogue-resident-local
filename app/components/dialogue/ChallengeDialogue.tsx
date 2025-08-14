'use client';

import { useState, useEffect, useRef } from 'react';
import { useDialogueStore } from '@/app/store/dialogueStore';
import { DialogueOption } from '@/app/types';
import { useKnowledgeStore } from '@/app/store/knowledgeStore';
import styled, { keyframes } from 'styled-components';
import PortraitImage from '../ui/PortraitImage';
import { CharacterId, isValidCharacterId } from '@/app/utils/portraitUtils';
import { colors, spacing, typography, borders, animation, mixins } from '@/app/styles/pixelTheme';
import { getRoomBackground } from '@/app/utils/roomBackgrounds';
import { useReactionSystem, getPortraitAnimation, PortraitAnimationType, ReactionSymbolType } from '../ui/ReactionSystem';
import ReactionSystemComponent from '@/app/components/ui/ReactionSystem';
import AbilityCardFlip from '@/app/components/ui/AbilityCardFlip';
import { useSceneNavigation } from '@/app/components/scenes/GameContainer';
import { ParsedDialogue } from '@/app/types/dialogue';
import { ExpandableQuestionContainer } from '@/app/components/ui/PixelContainer';

// === INTERNAL RESOLUTION SYSTEM ===
// Dialogue uses 640x360 internal coordinates (matching physics office native resolution)
const DIALOGUE_INTERNAL_WIDTH = 640;
const DIALOGUE_INTERNAL_HEIGHT = 360;

// Keyframe animations
const slideInUp = keyframes`
  from { 
    transform: translateY(20px); 
    opacity: 0; 
  }
  to { 
    transform: translateY(0); 
    opacity: 1; 
  }
`;

const pulse = keyframes`
  0% { opacity: 0.7; }
  50% { opacity: 1; }
  100% { opacity: 0.7; }
`;

const bounceIn = keyframes`
  0% { 
    transform: scale(0.3); 
    opacity: 0; 
  }
  50% { 
    transform: scale(1.1); 
    opacity: 1; 
  }
  100% { 
    transform: scale(1); 
    opacity: 1; 
  }
`;

interface DialogueResult {
  dialogueId: string;
  completed: boolean;
}

interface ChallengeDialogueProps {
  dialogueId: string;
  onComplete?: (results: DialogueResult) => void;
  roomId?: string; // Room context for background selection
}

interface DialogueHistoryItem {
  mentorId: string;
  text: string;
  timestamp: Date;
  isPlayer?: boolean;
}

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
  
  display: flex;
  flex-direction: column;
  font-family: ${typography.fontFamily.pixel};
  color: ${colors.text};
  overflow: hidden;
  
  /* Clean background without filters - let BackgroundLayer handle backgrounds */
  background: transparent;
  
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

// Separate background layer with blur/darken effects
const BackgroundLayer = styled.div<{ $roomId?: string }>`
  position: absolute;
  inset: 0;
  z-index: 0;
  
  ${props => {
    const roomConfig = getRoomBackground(props.$roomId);
    
    if (roomConfig.backgroundImage) {
      return `
        background-image: url('${roomConfig.backgroundImage}');
        background-size: ${DIALOGUE_INTERNAL_WIDTH}px ${DIALOGUE_INTERNAL_HEIGHT}px; /* Native 640x360 size - no scaling */
        background-position: center;
        background-repeat: no-repeat;
        background-color: #1a1a2e; /* Fallback color only */
        
        /* Challenge mode: blur and darken only the background image */
        filter: blur(1px) brightness(0.7) contrast(0.9);
      `;
    }
    
    return `
      background: ${roomConfig.fallbackGradient};
      /* Gradient backgrounds get slight darkening */
      filter: brightness(0.8);
    `;
  }}
`;

// Clean overlay without antiquated gradients
const AtmosphereOverlay = styled.div<{ $roomId?: string }>`
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  
  /* For challenge mode, use minimal darkening without room-specific atmosphere gradients */
  background: rgba(0, 0, 0, 0.15);
`;

const FeedContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: ${spacing.md};
  gap: ${spacing.sm};
  overflow-y: hidden;
  max-height: calc(60vh - 150px); /* Significantly reduced height */
  z-index: 5; /* Above foreground layer (z-index: 3) for challenge mode */
  position: relative;
  margin-bottom: 180px; /* Make room for Quinn's portrait */
  
  /* Hide scrollbars completely */
  ::-webkit-scrollbar {
    display: none;
  }
  -ms-overflow-style: none;
  scrollbar-width: none;
`;

// Character Section for Quinn's portrait at bottom of screen
const CharacterSection = styled.div`
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 280px;
  height: 180px;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 6;
`;

const CharacterPortrait = styled.div<{ $roomId?: string }>`
  width: 233px;
  height: 322px;
  position: relative;
  overflow: visible;
  
  filter: 
    drop-shadow(0 0 15px rgba(0, 0, 0, 0.8))
    brightness(0.92)
    contrast(1.08)
    ${props => {
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
  
  img {
    image-rendering: pixelated;
    -webkit-image-rendering: pixelated; 
    -moz-image-rendering: crisp-edges;
    -ms-interpolation-mode: nearest-neighbor;
  }
  
  ${mixins.pixelPerfect}
`;

const MessageBubble = styled.div<{ $isUser?: boolean; $roomId?: string }>`
  background: ${props => props.$isUser ? colors.highlight : colors.backgroundAlt};
  color: ${props => props.$isUser ? colors.background : colors.text};
  ${borders.pixelBorder.inner}
  border-radius: ${spacing.sm};
  padding: ${spacing.md} ${spacing.lg};
  margin-bottom: ${spacing.sm};
  position: relative;
  word-wrap: break-word;
  font-family: ${typography.fontFamily.pixel};
  box-shadow: 0 4px 0 ${props => props.$isUser ? colors.accent : colors.border};
  
  /* Room-specific styling for mentor messages */
  ${props => !props.$isUser && props.$roomId === 'physics-office' && `
    background: linear-gradient(135deg, 
      ${colors.backgroundAlt} 0%, 
      rgba(59, 130, 246, 0.05) 100%
    );
    border-left: 2px solid rgba(59, 130, 246, 0.3);
  `}
  
  ${props => !props.$isUser && props.$roomId === 'linac-1' && `
    background: linear-gradient(135deg, 
      ${colors.backgroundAlt} 0%, 
      rgba(16, 185, 129, 0.05) 100%
    );
    border-left: 2px solid rgba(16, 185, 129, 0.3);
    
    &::before {
      content: '';
      position: absolute;
      top: 6px;
      right: 8px;
      width: 16px;
      height: 16px;
      background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ctext y='50' font-size='40' fill='%2310b98120'%3E⚕%3C/text%3E%3C/svg%3E");
      opacity: 0.3;
      pointer-events: none;
    }
  `}
  
  ${props => !props.$isUser && props.$roomId === 'linac-2' && `
    background: linear-gradient(135deg, 
      ${colors.backgroundAlt} 0%, 
      rgba(245, 158, 11, 0.06) 100%
    );
    border-left: 2px solid rgba(245, 158, 11, 0.4);
    
    &::before {
      content: '';
      position: absolute;
      top: 6px;
      right: 8px;
      width: 16px;
      height: 16px;
      background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ctext y='50' font-size='40' fill='%23f59e0b20'%3E⚡%3C/text%3E%3C/svg%3E");
      opacity: 0.3;
      pointer-events: none;
    }
  `}
  
  ${props => !props.$isUser && props.$roomId === 'dosimetry-lab' && `
    background: linear-gradient(135deg, 
      ${colors.backgroundAlt} 0%, 
      rgba(236, 72, 153, 0.06) 100%
    );
    border-left: 2px solid rgba(236, 72, 153, 0.4);
    
    &::before {
      content: '';
      position: absolute;
      top: 6px;
      right: 8px;
      width: 16px;
      height: 16px;
      background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ctext y='50' font-size='40' fill='%23ec489920'%3E⚛%3C/text%3E%3C/svg%3E");
      opacity: 0.3;
      pointer-events: none;
    }
  `}
  
  ${props => !props.$isUser && props.$roomId === 'simulation-suite' && `
    border-left: 2px solid rgba(245, 158, 11, 0.3);
  `}
`;

const MessagePanel = styled.div<{ $isPlayer?: boolean }>`
  background: ${props => props.$isPlayer ? '#2a2a3e' : '#3a3a4e'};
  ${borders.pixelBorder.outer}
  border-radius: ${spacing.sm};
  padding: ${spacing.lg};
  display: flex;
  align-items: flex-start;
  gap: ${spacing.md};
  max-width: 80%;
  margin: ${spacing.xs} 0;
  margin-left: ${props => props.$isPlayer ? 'auto' : '0'};
  margin-right: ${props => props.$isPlayer ? '0' : 'auto'};
  box-shadow: 0 4px 0 ${colors.border};
  animation: ${slideInUp} 0.3s ease-out;
`;

const MessageContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
`;

const MessageText = styled.div`
  font-size: ${typography.fontSize.md};
  line-height: 1.4;
  color: ${colors.text};
  margin-bottom: ${spacing.xs};
`;

const MessageMeta = styled.div`
  font-size: ${typography.fontSize.xs};
  color: ${colors.textDim};
  display: flex;
  align-items: center;
  gap: ${spacing.xs};
`;

const PortraitContainer = styled.div`
  flex: 0 0 135px;
  height: 135px;
  position: relative;
  border-radius: ${spacing.xs};
  overflow: hidden;
  background: ${colors.backgroundAlt};
  ${borders.pixelBorder.inner}
  
  /* Enhanced styling for background cohesion */
  filter: 
    brightness(0.92)
    contrast(1.08)
    hue-rotate(-3deg)
    saturate(0.96);
  
  /* Ensure pixel-perfect rendering for portraits */
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

const OptionsSection = styled.div`
  background: ${colors.background};
  border-top: 2px solid ${colors.border};
  padding: ${spacing.md};
  min-height: 80px; /* Reduced from 120px */
  z-index: 5; /* Above foreground layer (z-index: 3) for challenge mode */
  position: relative;
  margin-bottom: 160px; /* Make room for Quinn's portrait */
`;

// New: Foreground layer for depth effect  
const ForegroundLayer = styled.div<{ $roomId?: string }>`
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 3; /* Foreground layer - above background, below challenge UI (z-index: 5) */
  
  ${props => {
    const roomConfig = getRoomBackground(props.$roomId);
    
    if (roomConfig.foregroundImage) {
      return `
        background-image: url('${roomConfig.foregroundImage}');
        background-size: cover;
        background-position: center;
        background-repeat: no-repeat;
        
        /* Challenge mode: blur foreground too for focus */
        filter: blur(1px) brightness(0.8);
      `;
    }
    
    return '';
  }}
`;

const OptionsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${spacing.sm};
  max-width: 600px;
  margin: 0 auto;
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
  background: rgba(0, 0, 0, 0.3);
  color: ${props => {
    switch(props.$type) {
      case 'insight': return colors.insight;
      case 'momentum': return colors.highlight;
      case 'relationship': return '#60a5fa';
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

const TypingIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: ${spacing.xs};
  color: ${colors.textDim};
  font-size: ${typography.fontSize.sm};
  margin: ${spacing.md} 0;
  
  &::after {
    content: '•••';
    animation: ${pulse} 1.5s infinite;
  }
`;

const ReactionOverlay = styled.div<{ $type: 'positive' | 'negative' | 'neutral' }>`
  position: absolute;
  top: -10px;
  right: -10px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: ${props => {
    switch(props.$type) {
      case 'positive': return '#10b981';
      case 'negative': return '#ef4444';
      default: return '#6b7280';
    }
  }};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  animation: ${bounceIn} 0.5s ease-out;
  
  &::before {
    content: '${props => {
      switch(props.$type) {
        case 'positive': return '✓';
        case 'negative': return '✗';
        default: return '○';
      }
    }}';
    color: white;
  }
`;

// Enhanced Resource Display Components using sprite assets (same as ChallengeUI)
const EnhancedResourceDisplay = styled.div`
  position: absolute;
  top: ${spacing.lg};
  right: ${spacing.lg};
  display: flex;
  flex-direction: column;
  gap: ${spacing.md};
  z-index: 10; /* Above all other content */
  background: rgba(15, 23, 42, 0.95);
  padding: ${spacing.md};
  border-radius: ${spacing.xs};
  ${borders.pixelBorder.outer}
  backdrop-filter: blur(4px);
  min-width: 180px;
`;

const ResourceDisplayTitle = styled.div`
  font-size: ${typography.fontSize.xs};
  color: ${colors.textDim};
  text-align: center;
  margin-bottom: ${spacing.xs};
  font-family: ${typography.fontFamily.pixel};
`;

const InsightBarContainer = styled.div`
  position: relative;
  width: 100%;
  height: 32px;
  display: flex;
  align-items: center;
`;

const InsightBarBackground = styled.div<{ $insightLevel: number }>`
  position: relative;
  width: 140px;
  height: 24px;
  background-image: url('/images/ui/insight-bar.png');
  background-size: 600% 100%; /* 6 frames horizontally: 6 * 100% = 600% */
  background-repeat: no-repeat;
  background-position: ${props => {
    // Calculate which frame (0-5) based on insight level
    const frameIndex = Math.min(5, Math.floor((props.$insightLevel / 100) * 6));
    return `${frameIndex * -100}% 0%`; /* Move left by frameIndex * 100% */
  }};
  image-rendering: pixelated;
  margin: 0 auto;
  transition: background-position 0.4s cubic-bezier(0.4, 0, 0.2, 1);
`;

const InsightValueOverlay = styled.div`
  position: absolute;
  top: 50%;
  right: 12px;
  transform: translateY(-50%);
  font-size: 11px;
  font-family: ${typography.fontFamily.pixel};
  color: #ffffff;
  text-shadow: 1px 1px 0px #000, -1px -1px 0px #000, 1px -1px 0px #000, -1px 1px 0px #000;
  font-weight: normal;
  pointer-events: none;
`;

const MomentumContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${spacing.xs};
`;

const MomentumLabel = styled.div`
  font-size: ${typography.fontSize.xs};
  color: ${colors.textDim};
  font-family: ${typography.fontFamily.pixel};
  text-align: center;
`;

const MomentumBlipsContainer = styled.div`
  display: flex;
  gap: 4px;
  align-items: center;
  justify-content: center;
`;

const MomentumBlip = styled.div<{ $momentumState: number; $index: number }>`
  width: 20px;
  height: 20px;
  background-image: url('/images/ui/momentum-blip.png');
  background-size: 400% 100%; /* 4 frames horizontally: 4 * 100% = 400% */
  background-repeat: no-repeat;
  background-position: ${props => {
    // State 0: empty/inactive (frame 0)
    // State 1: low momentum (frame 1) 
    // State 2: medium momentum (frame 2)
    // State 3: high momentum (frame 3)
    const frameIndex = Math.min(3, Math.max(0, props.$momentumState));
    return `${frameIndex * -100}% 0%`; /* Move left by frameIndex * 100% */
  }};
  image-rendering: pixelated;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  transform: ${props => props.$momentumState > 0 ? 'scale(1.1)' : 'scale(1)'};
  
  /* Staggered animation for momentum gain */
  animation: ${props => props.$momentumState > 0 ? `momentumPulse 0.6s ease-out ${props.$index * 0.1}s` : 'none'};
  
  @keyframes momentumPulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.3); filter: brightness(1.3) drop-shadow(0 0 6px #FFD700); }
    100% { transform: scale(1.1); }
  }
`;

const MomentumBonus = styled.div<{ $visible: boolean; $level: number }>`
  font-size: ${typography.fontSize.xs};
  color: ${props => 
    props.$level === 3 ? '#FF6B35' : 
    props.$level === 2 ? '#FFD700' : 
    colors.textDim
  };
  text-align: center;
  font-family: ${typography.fontFamily.pixel};
  opacity: ${props => props.$visible ? 1 : 0};
  transition: opacity 0.3s ease;
  text-shadow: ${props => props.$level > 1 ? '0 0 4px currentColor' : 'none'};
  margin-top: ${spacing.xs};
`;

export default function ChallengeDialogue({ dialogueId, onComplete, roomId }: ChallengeDialogueProps) {
  const [initialized, setInitialized] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typedText, setTypedText] = useState('');
  const [currentCharIndex, setCurrentCharIndex] = useState(0);
  const [currentPortraitAnimation, setCurrentPortraitAnimation] = useState<PortraitAnimationType>('none');
  const [parsedDialogue, setParsedDialogue] = useState<ParsedDialogue>({ stageDirections: [], cleanText: '' });
  const [selectedOptionIndex, setSelectedOptionIndex] = useState(0);
  const [activityTriggered, setActivityTriggered] = useState(false);
  const typingSpeed = 30;
  
  // Scene navigation for challenge activities
  const { enterChallenge } = useSceneNavigation();
  
  // Reaction system
  const containerRef = useRef<HTMLDivElement>(null);
  const { triggerReaction, triggerPortraitAnimation, ReactionSystemComponent } = useReactionSystem(containerRef);

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
      
      console.log(`[ChallengeDialogue] Dialogue scale: ${dialogueScale.toFixed(3)} (${viewportWidth}x${viewportHeight} → ${DIALOGUE_INTERNAL_WIDTH}x${DIALOGUE_INTERNAL_HEIGHT})`);
    };
    
    updateDialogueScale();
    window.addEventListener('resize', updateDialogueScale);
    
    return () => {
      window.removeEventListener('resize', updateDialogueScale);
    };
  }, []);
  
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
  
  // Add new message to history when node changes
  useEffect(() => {
    if (!currentNode) return;
    
    setIsTyping(true);
    
    // Simulate typing delay
    const typingTimer = setTimeout(() => {
      setDialogueHistory(prev => [...prev, {
        mentorId: currentNode.mentorId,
        text: currentNode.text,
        timestamp: new Date(),
        isPlayer: false
      }]);
      setIsTyping(false);
    }, 800);
    
    return () => clearTimeout(typingTimer);
  }, [currentNode?.id]);
  
  // Handle dialogue completion
  useEffect(() => {
    if (initialized && !currentNode && onComplete) {
      onComplete({
        dialogueId,
        completed: true
      });
    }
  }, [currentNode, dialogueId, initialized, onComplete]);

  // Reset selected option when options change
  useEffect(() => {
    setSelectedOptionIndex(0);
  }, [availableOptions.length]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        
        // If there are no options and not typing, complete dialogue
        if (!isTyping && availableOptions.length === 0) {
          if (onComplete) {
            onComplete({
              dialogueId,
              completed: true
            });
          }
        }
        // If there are options, select the highlighted one
        else if (!isTyping && availableOptions.length > 0) {
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
      // Add player response to history
      setDialogueHistory(prev => [...prev, {
        mentorId: 'player',
        text: option.text,
        timestamp: new Date(),
        isPlayer: true
      }]);
      
      // Update resources based on option effects
      if (option.insightChange) {
        setCurrentInsight(prev => Math.max(0, Math.min(100, prev + option.insightChange)));
      }
      if (option.momentumChange) {
        setCurrentMomentum(prev => Math.max(0, Math.min(maxMomentum, prev + option.momentumChange)));
      }
      
      // Show reaction based on option effects
      let reactionType: ReactionSymbolType = '!';
      if (option.insightChange && option.insightChange > 0) {
        setShowReaction('positive');
        reactionType = '💡';
        triggerReaction('💡');
      } else if (option.momentumChange && option.momentumChange < 0) {
        setShowReaction('negative');
        reactionType = '?';
        triggerReaction('?');
      } else {
        setShowReaction('neutral');
        reactionType = '...';
        triggerReaction('...');
      }
      
      // Clear reaction after animation
      setTimeout(() => setShowReaction(null), 2000);
      
      selectOption(option.id);
    }
  };
  
  // Check if option should be disabled
  const isOptionDisabled = (option: DialogueOption) => {
    if (!option.requiredStarId) return false;
    
    const star = stars[option.requiredStarId];
    return !star || !star.active;
  };
  
  // If dialogue not initialized, show loading
  if (!initialized || !activeDialogue) {
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
  
  // Calculate values for sprite displays
  const insightPercentage = Math.min(100, (currentInsight / 100) * 100);
  const momentumLevel = currentMomentum >= 3 ? 3 : currentMomentum >= 2 ? 2 : 1;
  const getBonusText = () => {
    if (currentMomentum >= 3) return 'BOAST UNLOCKED!';
    if (currentMomentum >= 2) return '+25% Insight Bonus';
    return '';
  };

  return (
    <Container ref={containerRef} $roomId={roomId} className="no-scrollbar">
      {/* Background layer with blur/darken effects */}
      <BackgroundLayer $roomId={roomId} />
      
      {/* Clean atmosphere overlay */}
      <AtmosphereOverlay $roomId={roomId} />
      
      {/* Enhanced Resource Display with Beautiful Sprites */}
      <EnhancedResourceDisplay>
        <ResourceDisplayTitle>Resources</ResourceDisplayTitle>
        
        {/* Insight Bar using insight-bar.png sprite sheet */}
        <InsightBarContainer>
          <InsightBarBackground $insightLevel={insightPercentage}>
            <InsightValueOverlay>{currentInsight}</InsightValueOverlay>
          </InsightBarBackground>
        </InsightBarContainer>
        
        {/* Momentum Blips using momentum-blip.png sprite sheet */}
        <MomentumContainer>
          <MomentumLabel>Momentum</MomentumLabel>
          <MomentumBlipsContainer>
            {Array.from({ length: maxMomentum }).map((_, index) => {
              // Each blip shows state based on current momentum level
              // 0: inactive, 1: low, 2: medium, 3: high
              const blipState = index < currentMomentum ? Math.min(3, currentMomentum) : 0;
              return (
                <MomentumBlip
                  key={index}
                  $momentumState={blipState}
                  $index={index}
                />
              );
            })}
          </MomentumBlipsContainer>
          <MomentumBonus $visible={currentMomentum >= 2} $level={momentumLevel}>
            {getBonusText()}
          </MomentumBonus>
        </MomentumContainer>
      </EnhancedResourceDisplay>
      
      {/* Message Feed */}
      <FeedContainer className="no-scrollbar">
        {dialogueHistory.map((message, index) => {
          const mentor = getMentor(message.mentorId);
          return (
                        <MessagePanel key={index} $isPlayer={message.isPlayer}>
              {!message.isPlayer && (
                <PortraitContainer>
                  {mentor && isValidCharacterId(mentor.id) && (
                    <>
                      <PortraitImage
                        characterId={mentor.id as CharacterId}
                        size="medium"
                        alt={mentor.name}
                        scale={3.0}
                        pixelated={true}
                      />
                      {showReaction && index === dialogueHistory.length - 2 && (
                        <ReactionOverlay $type={showReaction} />
                      )}
                    </>
                  )}
                </PortraitContainer>
              )}
              
              <MessageContent>
                <ExpandableQuestionContainer 
                  domain={roomId?.includes('physics') ? 'physics' : 
                         roomId?.includes('dosimetry') ? 'dosimetry' :
                         roomId?.includes('linac') ? 'linac' : 'planning'}
                  isActive={!message.isPlayer}
                  style={{
                    background: message.isPlayer ? colors.highlight : 'transparent',
                    color: message.isPlayer ? colors.background : colors.text,
                    fontSize: typography.fontSize.sm,
                    marginBottom: spacing.sm
                  }}
                >
                  {message.text}
                </ExpandableQuestionContainer>
                <MessageMeta>
                  <span>{message.isPlayer ? 'You' : mentor?.name}</span>
                  <span>•</span>
                  <span>{message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </MessageMeta>
              </MessageContent>
              
              {message.isPlayer && (
                <PortraitContainer>
                  <div style={{
                    width: '100%',
                    height: '100%',
                    background: colors.highlight,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: typography.fontSize.xl,
                    color: colors.background
                  }}>
                    YOU
                  </div>
                </PortraitContainer>
              )}
            </MessagePanel>
          );
        })}
        
        {/* Typing Indicator */}
        {isTyping && (
          <TypingIndicator>
            {getMentor(currentNode?.mentorId || '')?.name} is typing
          </TypingIndicator>
        )}
      </FeedContainer>
      
      {/* Options Section */}
      {!isTyping && availableOptions.length > 0 && (
        <OptionsSection>
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
        </OptionsSection>
      )}
      
      {/* Current Mentor Portrait at Bottom of Screen */}
      <CharacterSection>
        <CharacterPortrait $roomId={roomId}>
          {currentNode?.mentorId && isValidCharacterId(currentNode.mentorId) && (
            <PortraitImage
              characterId={currentNode.mentorId as CharacterId}
              size="detailed"
              alt={getMentor(currentNode.mentorId)?.name || 'Mentor'}
              scale={1.0}
              pixelated={true}
            />
          )}
        </CharacterPortrait>
      </CharacterSection>
      
      {/* Reaction System for floating symbols */}
      <ReactionSystemComponent />
      
      {/* Foreground Layer for Depth Effect */}
      <ForegroundLayer $roomId={roomId} />
    </Container>
  );
} 