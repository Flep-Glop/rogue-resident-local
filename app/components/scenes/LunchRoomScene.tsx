import React, { useState, useEffect, useRef, useCallback } from 'react';
import styled from 'styled-components';
import { useSceneStore } from '@/app/store/sceneStore';
import { colors, spacing, typography } from '@/app/styles/pixelTheme';

interface CharacterData {
  id: string;
  name: string;
  sprite: string;
  portrait: string;
  x: number; // Percentage position on lunch room background
  y: number;
  scale: number;
  actualWidth?: number;  // Measured from loaded sprite
  actualHeight?: number; // Measured from loaded sprite
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
    sprite: '/images/characters/portraits/lunch-room-garcia.png',
    portrait: '/images/characters/portraits/lunch-room-garcia-detailed.png',
    x: 78, // Far left to match reference image
    y: 100,
    scale: 12.0 // Increased from 3.0 to 8.0 for much better visibility
  },
  {
    id: 'jesse',
    name: 'Jesse',
    sprite: '/images/characters/portraits/lunch-room-jesse.png',
    portrait: '/images/characters/portraits/lunch-room-jesse-detailed.png',
    x: 71, // Center-left to match reference
    y: 91,
    scale: 12.0 // Increased from 3.0 to 8.0 for much better visibility
  },
  {
    id: 'kapoor',
    name: 'Dr. Kapoor',
    sprite: '/images/characters/portraits/lunch-room-kapoor.png',
    portrait: '/images/characters/portraits/lunch-room-kapoor-detailed.png',
    x: 16, // Center-right to match reference
    y: 101,
    scale: 12.0 // Increased from 3.0 to 8.0 for much better visibility
  },
  {
    id: 'quinn',
    name: 'Quinn',
    sprite: '/images/characters/portraits/lunch-room-quinn.png',
    portrait: '/images/characters/portraits/lunch-room-quinn-detailed.png',
    x: 29, // Far right to match reference
    y: 90,
    scale: 12.0 // Increased from 3.0 to 8.0 for much better visibility
  }
];

// Sample chat bubbles for testing
const SAMPLE_CHATS = [
  { characterId: 'garcia', text: "The new treatment protocols are showing great results!", duration: 3000 },
  { characterId: 'jesse', text: "Did you try the new coffee blend?", duration: 2500 },
  { characterId: 'kapoor', text: "That was an interesting case this morning.", duration: 3500 },
  { characterId: 'quinn', text: "The simulation results are in!", duration: 2000 }
];

const LunchRoomScene: React.FC = () => {
  const [characters, setCharacters] = useState<CharacterData[]>(LUNCH_ROOM_CHARACTERS);
  const [activeBubbles, setActiveBubbles] = useState<ChatBubble[]>([]);
  const [focusedCharacter, setFocusedCharacter] = useState<string | null>(null);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const bubbleIdCounter = useRef(0);

  // Dynamic image measurement system
  useEffect(() => {
    const measureImages = async () => {
      const updatedCharacters = await Promise.all(
        LUNCH_ROOM_CHARACTERS.map(async (char) => {
          return new Promise<CharacterData>((resolve) => {
            const img = new Image();
            img.onload = () => {
              resolve({
                ...char,
                actualWidth: img.width,
                actualHeight: img.height
              });
            };
            img.src = char.sprite;
          });
        })
      );
      
      setCharacters(updatedCharacters);
      setImagesLoaded(true);
      console.log('[LunchRoom] Character dimensions measured:', updatedCharacters.map(c => ({
        name: c.name,
        dimensions: `${c.actualWidth}x${c.actualHeight}px`
      })));
    };

    measureImages();
  }, []);

  // Chat bubble system
  const spawnChatBubble = useCallback((characterId: string, text: string, duration: number = 3000) => {
    const character = characters.find(c => c.id === characterId);
    if (!character) return;

    const bubble: ChatBubble = {
      id: `bubble-${bubbleIdCounter.current++}`,
      characterId,
      text,
      duration,
      phase: 'appearing',
      x: character.x,
      y: character.y - 20 // Position above character
    };

    setActiveBubbles(prev => [...prev, bubble]);
  }, [characters]);

  // Remove bubble when lifecycle completes
  const removeBubble = useCallback((bubbleId: string) => {
    setActiveBubbles(prev => prev.filter(b => b.id !== bubbleId));
  }, []);

  // Enhanced character focus system with smooth transitions
  const triggerCharacterFocus = useCallback((characterId: string) => {
    console.log('[LunchRoom] Triggering camera focus on:', characterId);
    
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
  }, []);

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

  // Navigation back to hospital
  const returnToHospital = useCallback(() => {
    const { setSceneDirectly } = useSceneStore.getState();
    setSceneDirectly('hospital');
  }, []);

  return (
    <LunchRoomContainer>
      {/* Background Layer with transition effects */}
      <LunchRoomBackground $isTransitioning={isTransitioning || !!focusedCharacter} />
      
      {/* Character Sprites */}
      {imagesLoaded && characters.map(character => (
        <CharacterSprite
          key={character.id}
          $x={character.x}
          $y={character.y}
          $scale={character.scale}
          $isTransitioning={isTransitioning}
          $isFocused={focusedCharacter === character.id}
          onClick={() => !focusedCharacter && !isTransitioning && triggerCharacterFocus(character.id)}
        >
          <CharacterImage 
            src={character.sprite} 
            alt={character.name}
            title={character.name}
          />
        </CharacterSprite>
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
      
      {/* Demo Controls */}
      {!focusedCharacter && (
        <DemoControls>
          <DemoButton onClick={spawnRandomChat}>
            💬 Random Chat
          </DemoButton>
          <DemoButton onClick={returnToHospital}>
            🏥 Back to Hospital
          </DemoButton>
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
      // Phase 1: Appear (0.4s)
      setPhase('appearing');
      await new Promise(resolve => setTimeout(resolve, 400));
      
      // Phase 2: Visible (bubble.duration)
      setPhase('visible');
      await new Promise(resolve => setTimeout(resolve, bubble.duration));
      
      // Phase 3: Disappear (0.4s)
      setPhase('disappearing');
      await new Promise(resolve => setTimeout(resolve, 400));
      
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

const CharacterSprite = styled.div<{ $x: number; $y: number; $scale: number; $isTransitioning: boolean; $isFocused: boolean }>`
  position: absolute;
  left: ${props => props.$x}%;
  top: ${props => props.$y}%;
  transform: translate(-50%, -100%) scale(${props => props.$scale});
  transform-origin: center bottom;
  cursor: pointer;
  transition: transform 0.2s ease, filter 0.5s ease-in-out, opacity 0.5s ease-in-out; /* Enhanced transitions */
  z-index: 1000;
  
  &:hover {
    transform: translate(-50%, -100%) scale(${props => props.$scale * 1.1});
    filter: brightness(1.2);
  }

  ${props => props.$isFocused && `
    transform: translate(-50%, -100%) scale(${props.$scale * 1.2}); /* Slightly more scale for focused character */
    filter: brightness(1.3) drop-shadow(0 0 15px rgba(255, 255, 255, 0.5)); /* Enhanced glow effect */
  `}

  ${props => props.$isTransitioning && `
    transition: all 0.5s ease-in-out; /* Match background timing */
    filter: blur(8px); /* Slightly less blur than background */
    opacity: 0.6; /* More transparent during transition */
  `}
`;

const CharacterImage = styled.img`
  width: auto;
  height: auto;
  image-rendering: pixelated;
  pointer-events: none;
`;

const BubbleContainer = styled.div<{ $x: number; $y: number; $phase: string }>`
  position: absolute;
  left: ${props => props.$x}%;
  top: ${props => props.$y}%;
  transform: translateX(-50%) translateY(-100%) ${props => 
    props.$phase === 'appearing' ? 'scale(0.3)' :
    props.$phase === 'disappearing' ? 'scale(0.3)' : 'scale(1)'
  };
  opacity: ${props => 
    props.$phase === 'appearing' || props.$phase === 'disappearing' ? 0 : 1
  };
  transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  z-index: 1010;
  
  background: rgba(0, 0, 0, 0.9);
  border: 2px solid ${colors.border};
  border-radius: 8px;
  padding: 8px 12px;
  color: white;
  font-family: ${typography.fontFamily.pixel};
  font-size: ${typography.fontSize.xs};
  max-width: 200px;
  line-height: 1.3;
  
  /* Chat bubble tail */
  &::after {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    border: 6px solid transparent;
    border-top-color: ${colors.border};
  }
  
  &::before {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    border: 4px solid transparent;
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

export default LunchRoomScene; 