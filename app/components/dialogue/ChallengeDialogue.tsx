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
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  font-family: ${typography.fontFamily.pixel};
  color: ${colors.text};
  overflow: hidden;
  position: relative;
  
  /* Clean background without filters - filters will be applied to individual background layers */
  ${props => {
    const roomConfig = getRoomBackground(props.$roomId);
    
    if (roomConfig.backgroundImage) {
      return `
        background: transparent; /* No background - let BackgroundLayer handle it */
      `;
    }
    
    return `
      background: transparent; /* Let BackgroundLayer handle gradients too */
    `;
  }}
  
  /* Comprehensive scrollbar hiding */
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
        background-size: cover;
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
  padding: ${spacing.lg};
  gap: ${spacing.md};
  overflow-y: hidden;
  max-height: calc(100vh - 200px);
  z-index: 5; /* Above foreground layer (z-index: 3) for challenge mode */
  position: relative;
  
  /* Hide scrollbars completely */
  ::-webkit-scrollbar {
    display: none;
  }
  -ms-overflow-style: none;
  scrollbar-width: none;
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
  padding: ${spacing.lg};
  min-height: 120px;
  z-index: 5; /* Above foreground layer (z-index: 3) for challenge mode */
  position: relative;
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

const OptionButton = styled.button<{ $disabled?: boolean }>`
  background: ${props => props.$disabled ? colors.backgroundAlt : colors.backgroundAlt};
  ${borders.pixelBorder.outer}
  border-radius: ${spacing.xs};
  padding: ${spacing.md} ${spacing.lg};
  color: ${props => props.$disabled ? colors.textDim : colors.text};
  font-family: ${typography.fontFamily.pixel};
  font-size: ${typography.fontSize.sm};
  text-align: left;
  cursor: ${props => props.$disabled ? 'not-allowed' : 'pointer'};
  transition: all ${animation.duration.fast} ${animation.easing.pixel};
  opacity: ${props => props.$disabled ? 0.6 : 1};
  
  &:hover {
    ${props => !props.$disabled && `
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

export default function ChallengeDialogue({ dialogueId, onComplete, roomId }: ChallengeDialogueProps) {
  const [initialized, setInitialized] = useState(false);
  const [dialogueHistory, setDialogueHistory] = useState<DialogueHistoryItem[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [showReaction, setShowReaction] = useState<'positive' | 'negative' | 'neutral' | null>(null);
  
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
  
  return (
    <Container ref={containerRef} $roomId={roomId} className="no-scrollbar">
      {/* Background layer with blur/darken effects */}
      <BackgroundLayer $roomId={roomId} />
      
      {/* Clean atmosphere overlay */}
      <AtmosphereOverlay $roomId={roomId} />
      
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
                <MessageBubble $isUser={message.isPlayer} $roomId={roomId}>
                  {message.text}
                </MessageBubble>
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
            {availableOptions.map((option) => (
              <OptionButton
                key={option.id}
                onClick={() => handleSelectOption(option)}
                disabled={isOptionDisabled(option)}
                $disabled={isOptionDisabled(option)}
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
      
      {/* Reaction System for floating symbols */}
      <ReactionSystemComponent />
      
      {/* Foreground Layer for Depth Effect */}
      <ForegroundLayer $roomId={roomId} />
    </Container>
  );
} 