import React, { useState, useEffect, useRef, useCallback } from 'react';
import styled from 'styled-components';
import { useSceneStore } from '@/app/store/sceneStore';
import { useTutorialStore } from '@/app/store/tutorialStore';
import { getTutorialDialogueForRoom } from '@/app/data/tutorialDialogues';
import { colors, spacing, typography } from '@/app/styles/pixelTheme';
import { useSceneNavigation } from '@/app/components/scenes/GameContainer';

interface CharacterData {
  id: string;
  name: string;
  portrait: string; // Keep detailed portrait for close-ups
  x: number; // Percentage position on lunch room background
  y: number;
  clickWidth: number; // Click area width percentage
  clickHeight: number; // Click area height percentage
}

interface ChatBubble {
  id: string;
  characterId: string;
  text: string;
  duration: number;
  phase: 'appearing' | 'visible' | 'disappearing';
  x: number;
  y: number;
}

const LUNCH_ROOM_CHARACTERS: CharacterData[] = [
  {
    id: 'garcia',
    name: 'Dr. Garcia',
    portrait: '/images/characters/portraits/lunch-room-garcia-detailed.png',
    x: 78, // Far left to match reference image
    y: 90, // Shifted up from 100
    clickWidth: 8, // Click area width percentage
    clickHeight: 32 // Double height click area
  },
  {
    id: 'jesse',
    name: 'Jesse',
    portrait: '/images/characters/portraits/lunch-room-jesse-detailed.png',
    x: 71, // Center-left to match reference
    y: 82, // Shifted up from 91
    clickWidth: 8, // Click area width percentage
    clickHeight: 27 // Double height click area
  },
  {
    id: 'kapoor',
    name: 'Dr. Kapoor',
    portrait: '/images/characters/portraits/lunch-room-kapoor-detailed.png',
    x: 16, // Center-right to match reference
    y: 90, // Shifted up from 101
    clickWidth: 8, // Click area width percentage
    clickHeight: 34 // Double height click area
  },
  {
    id: 'quinn',
    name: 'Quinn',
    portrait: '/images/characters/portraits/lunch-room-quinn-detailed.png',
    x: 29, // Far right to match reference
    y: 82, // Shifted up from 90
    clickWidth: 8, // Click area width percentage
    clickHeight: 30 // Double height click area
  }
];

// Expanded chat bubbles with varied content
const SAMPLE_CHATS = [
  // Garcia (empathetic, patient-focused)
  { characterId: 'garcia', text: "Mrs. Patterson is responding well to treatment.", duration: 10000 },
  { characterId: 'garcia', text: "Quality of life is just as important as cure rates.", duration: 11000 },
  { characterId: 'garcia', text: "The patient conference went well this morning.", duration: 9000 },
  { characterId: 'garcia', text: "Always remember the human behind the data.", duration: 10500 },
  
  // Jesse (practical, hands-on)
  { characterId: 'jesse', text: "Fixed the beam alignment this morning.", duration: 8500 },
  { characterId: 'jesse', text: "Bertha's running smooth as silk today.", duration: 8000 },
  { characterId: 'jesse', text: "Anyone else hear that weird humming sound?", duration: 9000 },
  { characterId: 'jesse', text: "Coffee machine's acting up again.", duration: 7500 },
  { characterId: 'jesse', text: "These new protocols are pretty solid.", duration: 8500 },
  
  // Kapoor (precise, methodical)
  { characterId: 'kapoor', text: "Calibration measurements are within tolerance.", duration: 10500 },
  { characterId: 'kapoor', text: "The uncertainty analysis looks correct.", duration: 9500 },
  { characterId: 'kapoor', text: "Quality assurance never takes a day off.", duration: 10000 },
  { characterId: 'kapoor', text: "Precision leads to better patient outcomes.", duration: 11000 },
  { characterId: 'kapoor', text: "Temperature corrections were spot on today.", duration: 9000 },
  
  // Quinn (analytical, innovative)
  { characterId: 'quinn', text: "The optimization algorithm is working well.", duration: 10000 },
  { characterId: 'quinn', text: "Have you seen the new IMRT results?", duration: 8000 },
  { characterId: 'quinn', text: "The dose distribution looks perfect.", duration: 8500 },
  { characterId: 'quinn', text: "Mathematical elegance meets clinical need.", duration: 10500 },
  { characterId: 'quinn', text: "Running some new treatment simulations.", duration: 9000 }
];

const LunchRoomScene: React.FC = () => {
  const [characters, setCharacters] = useState<CharacterData[]>(LUNCH_ROOM_CHARACTERS);
  const [activeBubbles, setActiveBubbles] = useState<ChatBubble[]>([]);
  const [focusedCharacter, setFocusedCharacter] = useState<string | null>(null);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const bubbleIdCounter = useRef(0);
  
  // Tutorial integration
  const tutorialStore = useTutorialStore();
  const { enterNarrative } = useSceneNavigation();
  const isTutorialActive = tutorialStore.mode === 'active_sequence';
  const currentTutorialStep = tutorialStore.currentStep;

  // Set characters and mark as loaded (no individual sprites to load)
  useEffect(() => {
    setCharacters(LUNCH_ROOM_CHARACTERS);
    setImagesLoaded(true);
    console.log('[LunchRoom] Character click areas initialized');
  }, []);

  // Chat bubble system
  const spawnChatBubble = useCallback((characterId: string, text: string, duration: number = 9000) => {
    const character = characters.find(c => c.id === characterId);
    if (!character) return;

    // Character-specific offsets for consistent spacing from heads
    const bubbleOffsets: Record<string, number> = {
      garcia: -25,   // y: 90, bubble at: 65
      jesse: -24,    // y: 82, bubble at: 65 (same visual height as garcia)
      kapoor: -25,   // y: 90, bubble at: 65
      quinn: -24     // y: 82, bubble at: 65 (same visual height as kapoor)
    };

    const bubble: ChatBubble = {
      id: `bubble-${bubbleIdCounter.current++}`,
      characterId,
      text,
      duration,
      phase: 'appearing',
      x: character.x,
      y: character.y + (bubbleOffsets[characterId] || -25)
    };

    setActiveBubbles(prev => [...prev, bubble]);
  }, [characters]);

  // Remove bubble when lifecycle completes
  const removeBubble = useCallback((bubbleId: string) => {
    setActiveBubbles(prev => prev.filter(b => b.id !== bubbleId));
  }, []);

  // Enhanced character focus system with tutorial integration
  const triggerCharacterFocus = useCallback((characterId: string) => {
    console.log('[LunchRoom] Character clicked:', characterId);
    
    // Priority 1: Tutorial mode - start tutorial dialogue
    if (isTutorialActive) {
      const tutorialDialogueId = getTutorialDialogueForRoom('lunch-room', currentTutorialStep);
      if (tutorialDialogueId) {
        console.log('[LunchRoom] Tutorial mode: starting dialogue', tutorialDialogueId);
        enterNarrative(characterId, tutorialDialogueId, 'lunch-room');
        return;
      } else {
        console.log('[LunchRoom] Tutorial mode: no dialogue available for step', currentTutorialStep);
      }
    }
    
    // Priority 2: Normal mode - camera focus
    console.log('[LunchRoom] Normal mode: triggering camera focus on:', characterId);
    
    setIsTransitioning(true);
    
    // Smooth transition timing
    setTimeout(() => {
      setFocusedCharacter(characterId);
      setIsTransitioning(false);
    }, 300); // 300ms transition
    
    // Event-driven communication (surgical hybrid approach)
    window.dispatchEvent(new CustomEvent('lunch-room-focus', {
      detail: { characterId, action: 'zoom-in' }
    }));
  }, [isTutorialActive, currentTutorialStep, enterNarrative]);

  const exitFocus = useCallback(() => {
    console.log('[LunchRoom] Exiting camera focus');
    
    setIsTransitioning(true);
    
    // Smooth exit transition
    setTimeout(() => {
      setFocusedCharacter(null);
      setIsTransitioning(false);
    }, 300); // 300ms transition
    
    window.dispatchEvent(new CustomEvent('lunch-room-focus', {
      detail: { action: 'zoom-out' }
    }));
  }, []);

  // Demo chat system - random bubbles
  const spawnRandomChat = useCallback(() => {
    const randomChat = SAMPLE_CHATS[Math.floor(Math.random() * SAMPLE_CHATS.length)];
    spawnChatBubble(randomChat.characterId, randomChat.text, randomChat.duration);
  }, [spawnChatBubble]);

  // Automatic random chat spawning
  useEffect(() => {
    if (focusedCharacter) return; // Don't spawn chats during focus mode

    const spawnRandomChatBubble = () => {
      // Only spawn if there aren't too many active bubbles
      if (activeBubbles.length < 2) {
        spawnRandomChat();
      }
    };

    // Initial delay before first chat
    const initialDelay = Math.random() * 3000 + 2000; // 2-5 seconds
    const initialTimer = setTimeout(spawnRandomChatBubble, initialDelay);

    // Set up recurring chats with varying intervals
    const recurringTimer = setInterval(() => {
      spawnRandomChatBubble();
    }, Math.random() * 8000 + 4000); // 4-12 seconds between chats

    return () => {
      clearTimeout(initialTimer);
      clearInterval(recurringTimer);
    };
  }, [focusedCharacter, activeBubbles.length, spawnRandomChat]);

  // Navigation back to hospital
  const returnToHospital = useCallback(() => {
    const { setSceneDirectly } = useSceneStore.getState();
    setSceneDirectly('hospital');
  }, []);

  return (
    <LunchRoomContainer>
      {/* Background Layer with transition effects */}
      <LunchRoomBackground $isTransitioning={isTransitioning || !!focusedCharacter} />
      
      {/* Character Click Areas (invisible) */}
      {imagesLoaded && characters.map(character => (
        <CharacterClickArea
          key={character.id}
          $x={character.x}
          $y={character.y}
          $width={character.clickWidth}
          $height={character.clickHeight}
          $isTransitioning={isTransitioning}
          onClick={() => !focusedCharacter && !isTransitioning && triggerCharacterFocus(character.id)}
          title={character.name}
        />
      ))}
      
      {/* Chat Bubbles */}
      {!focusedCharacter && activeBubbles.map(bubble => (
        <ChatBubble
          key={bubble.id}
          bubble={bubble}
          onComplete={() => removeBubble(bubble.id)}
        />
      ))}
      
      {/* Enhanced Camera Focus Overlay */}
      {focusedCharacter && !isTransitioning && (
        <EnhancedCameraFocus 
          character={characters.find(c => c.id === focusedCharacter)!}
          onExit={exitFocus}
        />
      )}
      
      {/* Controls - Tutorial vs Normal Mode */}
      {!focusedCharacter && (
        <DemoControls>
          {isTutorialActive ? (
            <>
              <TutorialIndicator>
                🎓 Tutorial: Click on mentors to chat!
              </TutorialIndicator>
              <DemoButton onClick={returnToHospital}>
                🏥 Back to Hospital
              </DemoButton>
            </>
          ) : (
            <>
              <DemoButton onClick={spawnRandomChat}>
                💬 Random Chat
              </DemoButton>
              <DemoButton onClick={returnToHospital}>
                🏥 Back to Hospital
              </DemoButton>
            </>
          )}
        </DemoControls>
      )}
    </LunchRoomContainer>
  );
};

// Chat Bubble Component with Lifecycle
const ChatBubble: React.FC<{ bubble: ChatBubble; onComplete: () => void }> = ({ bubble, onComplete }) => {
  const [phase, setPhase] = useState<'appearing' | 'visible' | 'disappearing'>('appearing');
  
  useEffect(() => {
    const lifecycle = async () => {
      // Phase 1: Appear (1.8s to match CSS transition)
      setPhase('appearing');
      await new Promise(resolve => setTimeout(resolve, 1800));
      
      // Phase 2: Visible (bubble.duration)
      setPhase('visible');
      await new Promise(resolve => setTimeout(resolve, bubble.duration));
      
      // Phase 3: Disappear (1.8s to match CSS transition)
      setPhase('disappearing');
      await new Promise(resolve => setTimeout(resolve, 1800));
      
      onComplete();
    };
    
    lifecycle();
  }, [bubble.duration, onComplete]);
  
  return (
    <BubbleContainer 
      $x={bubble.x} 
      $y={bubble.y}
      $phase={phase}
    >
      {bubble.text}
    </BubbleContainer>
  );
};

// Enhanced Camera Focus Overlay Component
const EnhancedCameraFocus: React.FC<{ character: CharacterData; onExit: () => void }> = ({ character, onExit }) => {
  return (
    <EnhancedFocusOverlayContainer>
      {/* Blur background */}
      <BlurBackground onClick={onExit} />
      
      {/* Clean portrait and text layout */}
      <CleanPortraitLayout>
        <MassivePortrait src={character.portrait} alt={character.name} />
        <TextContent>
          <CharacterNameLarge>{character.name}</CharacterNameLarge>
          <DialogueText>
            {character.name === 'Dr. Garcia' ? 'Great to see you! How has your training been going?' :
             character.name === 'Jesse' ? 'Hey there! Want to grab some coffee and chat about cases?' :
             character.name === 'Dr. Kapoor' ? 'Excellent work on that last simulation. Ready for the next challenge?' :
             'The new protocols are really making a difference in patient outcomes!'}
          </DialogueText>
        </TextContent>
      </CleanPortraitLayout>
      
      {/* Simple exit button */}
      <SimpleExitButton onClick={onExit}>×</SimpleExitButton>
    </EnhancedFocusOverlayContainer>
  );
};

// Styled Components
const LunchRoomContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 1000;
`;

const LunchRoomBackground = styled.div<{ $isTransitioning: boolean }>`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: url('/images/hospital/backgrounds/lunch-room.png');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  image-rendering: pixelated;
  z-index: 990;
  transition: filter 0.5s ease-in-out; /* Increased from 0.3s to 0.5s for smoother transition */
  filter: ${props => props.$isTransitioning ? 'blur(10px)' : 'blur(0px)'};
`;

const CharacterClickArea = styled.div<{ $x: number; $y: number; $width: number; $height: number; $isTransitioning: boolean }>`
  position: absolute;
  left: ${props => props.$x}%;
  top: ${props => props.$y}%;
  width: ${props => props.$width}%;
  height: ${props => props.$height}%;
  transform: translate(-50%, -75%); /* Extend more upward from character position */
  cursor: pointer;
  background: transparent;
  border: none;
  z-index: 1000;
  opacity: ${props => props.$isTransitioning ? 0.3 : 1};
  transition: opacity 0.5s ease-in-out;
  
  &:hover {
    background: rgba(255, 255, 255, 0.1); /* Subtle hover indication */
  }
`;

const BubbleContainer = styled.div<{ $x: number; $y: number; $phase: string }>`
  position: absolute;
  left: ${props => props.$x}%;
  top: ${props => props.$y}%;
  transform: translateX(-50%) translateY(-100%) ${props => 
    props.$phase === 'appearing' ? 'scale(0.8)' :
    props.$phase === 'disappearing' ? 'scale(0.8)' : 'scale(1)'
  };
  opacity: ${props => 
    props.$phase === 'appearing' || props.$phase === 'disappearing' ? 0 : 1
  };
  transition: all 1.8s cubic-bezier(0.4, 0.0, 0.2, 1.0);
  z-index: 1010;
  
  background: rgba(0, 0, 0, 0.9);
  border: 2px solid ${colors.border};
  border-radius: 12px;
  padding: 16px 20px;
  color: white;
  font-family: ${typography.fontFamily.pixel};
  font-size: ${typography.fontSize.sm};
  max-width: 320px;
  min-height: auto;
  height: auto;
  overflow: visible;
  word-wrap: break-word;
  white-space: normal;
  line-height: 1.4;
  
  /* Chat bubble tail */
  &::after {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    border: 8px solid transparent;
    border-top-color: ${colors.border};
  }
  
  &::before {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    border: 6px solid transparent;
    border-top-color: rgba(0, 0, 0, 0.9);
    z-index: 1;
  }
`;

// Enhanced Camera Focus Components
const EnhancedFocusOverlayContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const BlurBackground = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5); /* Reduced opacity for less harsh darkening */
  backdrop-filter: blur(12px); /* Increased blur for more dramatic effect */
  cursor: pointer;
  transition: all 0.3s ease-in-out; /* Smooth transition */
`;

const CleanPortraitLayout = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  gap: ${spacing.xl};
  /* Removed max-width constraint that was limiting the layout */
  background: transparent; /* Removed purple gradient background */
  border: none; /* Removed purple border */
  border-radius: 0;
  padding: ${spacing.xl};
  backdrop-filter: none; /* Removed blur effect */
  box-shadow: none; /* Removed purple glow */
  z-index: 2010;
`;

const MassivePortrait = styled.img`
  width: 500px; /* Force explicit width instead of max-width */
  height: 500px; /* Force explicit height instead of max-height */
  object-fit: contain; /* Keep aspect ratio while filling the space */
  image-rendering: pixelated;
  border: none; /* Removed border */
  border-radius: 0;
`;

const TextContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${spacing.md};
  color: white; /* Solid white text for contrast */
  font-family: ${typography.fontFamily.pixel};
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.9); /* Strong text shadow for readability */
`;

const CharacterNameLarge = styled.h2`
  font-family: ${typography.fontFamily.pixel};
  font-size: ${typography.fontSize.xxl}; /* Made even bigger */
  color: white; /* Solid white instead of purple */
  margin: 0;
  text-align: left;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.9);
`;

const DialogueText = styled.p`
  font-family: ${typography.fontFamily.pixel};
  font-size: ${typography.fontSize.lg}; /* Increased size */
  color: white; /* Solid white instead of theme color */
  margin: 0;
  text-align: left;
  font-style: italic;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.9);
  max-width: 300px; /* Limit text width for readability */
  line-height: 1.4;
`;

const SimpleExitButton = styled.button`
  position: absolute;
  top: 20px;
  right: 20px;
  width: 40px;
  height: 40px;
  background: rgba(0, 0, 0, 0.8); /* Simple dark background */
  border: 2px solid white; /* Simple white border */
  border-radius: 50%;
  color: white;
  font-size: 24px;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2020;
  text-shadow: none;
  
  &:hover {
    background: rgba(0, 0, 0, 1); /* Darker on hover */
    transform: scale(1.1);
  }
`;

// Demo Controls
const DemoControls = styled.div`
  position: absolute;
  top: 20px;
  left: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  z-index: 1020;
`;

const DemoButton = styled.button`
  background: rgba(132, 90, 245, 0.9);
  border: 2px solid ${colors.highlight};
  border-radius: 6px;
  color: white;
  padding: 8px 12px;
  font-family: ${typography.fontFamily.pixel};
  font-size: ${typography.fontSize.xs};
  cursor: pointer;
  
  &:hover {
    background: ${colors.highlight};
    transform: scale(1.05);
  }
`;

const TutorialIndicator = styled.div`
  background: rgba(16, 185, 129, 0.9);
  border: 2px solid #10b981;
  border-radius: 6px;
  color: white;
  padding: 12px 16px;
  font-family: ${typography.fontFamily.pixel};
  font-size: ${typography.fontSize.sm};
  text-align: center;
  max-width: 200px;
  line-height: 1.3;
  
  &::before {
    content: '';
    display: block;
    width: 100%;
    height: 2px;
    background: linear-gradient(90deg, transparent, #10b981, transparent);
    margin-bottom: 8px;
  }
`;

export default LunchRoomScene; 