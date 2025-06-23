'use client';

import React, { useState } from 'react';
import styled from 'styled-components';
import { useSceneNavigation } from '@/app/components/scenes/GameContainer';
import HospitalRoomOverlay from './HospitalRoomOverlay';
import { useTutorialNavigation, useTutorialStore } from '@/app/store/tutorialStore';
import { 
  getTutorialDialogueForRoom, 
  isRoomAvailableInTutorial,
  isRecommendedTutorialRoom,
  getTutorialStepGuidance,
  TUTORIAL_STEP_ROOM_AVAILABILITY
} from '@/app/data/tutorialDialogues';
import { useDialogueStore } from '@/app/store/dialogueStore';

const HospitalContainer = styled.div`
  width: 100vw;
  height: 100vh;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  
  /* Ensure no scrollbars anywhere */
  ::-webkit-scrollbar {
    display: none;
  }
  -ms-overflow-style: none;
  scrollbar-width: none;
  
  /* Apply to all child elements */
  * {
    ::-webkit-scrollbar {
      display: none;
    }
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
`;

const HospitalBuilding = styled.div`
  width: 95vw;
  height: 95vh;
  background-image: url('/images/hospital/hospital-isometric-base.png');
  background-size: 300%;
  background-repeat: no-repeat;
  background-position: -1900px -600px;
  position: relative;
  cursor: pointer;
`;

// Enhanced isometric room area with tutorial-aware visual states
const RoomArea = styled.div<{ 
  x: number; 
  y: number; 
  width: number; 
  height: number; 
  $roomId: string;
  $activityType: 'narrative' | 'challenge';
  $tutorialState?: 'available' | 'recommended' | 'disabled';
}>`
  position: absolute;
  left: ${({ x }) => x}%;
  top: ${({ y }) => y}%;
  width: ${({ width }) => width}%;
  height: ${({ height }) => height}%;
  
  /* Isometric diamond shape using clip-path */
  clip-path: polygon(
    50% 0%,     /* top point */
    100% 30%,   /* top-right */
    100% 70%,   /* bottom-right */
    50% 100%,   /* bottom point */
    0% 70%,     /* bottom-left */
    0% 30%      /* top-left */
  );
  
  /* Tutorial-aware interactive glow */
  background: ${({ $roomId, $tutorialState }) => {
    const baseColors = {
      'physics-office': 'rgba(59, 130, 246, 0.15)',
      'treatment-room': 'rgba(16, 185, 129, 0.15)', 
      'linac-2': 'rgba(245, 158, 11, 0.15)',
      'dosimetry-lab': 'rgba(236, 72, 153, 0.15)',
      'simulation-suite': 'rgba(245, 158, 11, 0.15)',
      'default': 'rgba(124, 58, 237, 0.15)'
    };
    
    const roomColor = baseColors[$roomId as keyof typeof baseColors] || baseColors.default;
    
    // Tutorial state modifications
    if ($tutorialState === 'disabled') {
      return `radial-gradient(ellipse at center, rgba(100, 100, 100, 0.08) 0%, rgba(100, 100, 100, 0.03) 60%, transparent 100%)`;
    } else if ($tutorialState === 'recommended') {
      // Brighter, more prominent for recommended rooms
      const brightColor = roomColor.replace('0.15', '0.25');
      return `radial-gradient(ellipse at center, ${brightColor} 0%, ${roomColor.replace('0.15', '0.08')} 60%, transparent 100%)`;
    }
    
    // Default state
    return `radial-gradient(ellipse at center, ${roomColor} 0%, ${roomColor.replace('0.15', '0.05')} 60%, transparent 100%)`;
  }};
  
  border: 2px solid transparent;
  
  transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  cursor: ${({ $tutorialState }) => $tutorialState === 'disabled' ? 'not-allowed' : 'pointer'};
  
  /* Tutorial-aware animations */
  animation: ${({ $tutorialState }) => {
    if ($tutorialState === 'disabled') return 'none';
    if ($tutorialState === 'recommended') return 'roomPulseRecommended 2s ease-in-out infinite';
    return 'roomPulse 3s ease-in-out infinite';
  }};
  
  /* Tutorial-aware opacity */
  opacity: ${({ $tutorialState }) => $tutorialState === 'disabled' ? 0.3 : 1};
  
  &:hover {
    transform: ${({ $tutorialState }) => $tutorialState === 'disabled' ? 'none' : 'scale(1.08)'};
    background: ${({ $roomId, $tutorialState }) => {
      if ($tutorialState === 'disabled') return 'inherit';
      
      const hoverColors = {
        'physics-office': 'rgba(59, 130, 246, 0.25)',
        'treatment-room': 'rgba(16, 185, 129, 0.25)',
        'linac-2': 'rgba(245, 158, 11, 0.25)',
        'dosimetry-lab': 'rgba(236, 72, 153, 0.25)',
        'simulation-suite': 'rgba(245, 158, 11, 0.25)',
        'default': 'rgba(124, 58, 237, 0.25)'
      };
      
      const roomColor = hoverColors[$roomId as keyof typeof hoverColors] || hoverColors.default;
      return `radial-gradient(ellipse at center, ${roomColor} 0%, ${roomColor.replace('0.25', '0.12')} 60%, transparent 100%)`;
    }};
    border-color: transparent;
    box-shadow: ${({ $tutorialState, $roomId }) => {
      if ($tutorialState === 'disabled') return 'none';
      
      const shadowColors = {
        'physics-office': 'rgba(59, 130, 246, 0.3)',
        'treatment-room': 'rgba(16, 185, 129, 0.3)',
        'linac-2': 'rgba(245, 158, 11, 0.3)',
        'dosimetry-lab': 'rgba(236, 72, 153, 0.3)',
        'simulation-suite': 'rgba(245, 158, 11, 0.3)',
        'default': 'rgba(124, 58, 237, 0.3)'
      };
      
      const shadowColor = shadowColors[$roomId as keyof typeof shadowColors] || shadowColors.default;
      return `0 0 20px ${shadowColor}`;
    }};
    animation: ${({ $tutorialState }) => $tutorialState === 'disabled' ? 'none' : 'roomPulseHover 1.5s ease-in-out infinite'};
  }
`;

// Enhanced room indicator with tutorial state awareness
const RoomIndicator = styled.div<{ 
  $roomId: string; 
  $tutorialState?: 'available' | 'recommended' | 'disabled';
}>`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 32px;
  height: 32px;
  background: ${({ $roomId, $tutorialState }) => {
    if ($tutorialState === 'disabled') {
      return 'rgba(120, 120, 120, 0.4)';
    }
    
    const baseColors = {
      'physics-office': 'rgba(59, 130, 246, 0.9)',
      'treatment-room': 'rgba(16, 185, 129, 0.9)',
      'linac-2': 'rgba(245, 158, 11, 0.9)',
      'dosimetry-lab': 'rgba(236, 72, 153, 0.9)',
      'simulation-suite': 'rgba(245, 158, 11, 0.9)',
      'default': 'rgba(124, 58, 237, 0.9)'
    };
    
    return baseColors[$roomId as keyof typeof baseColors] || baseColors.default;
  }};
  border: 2px solid ${({ $tutorialState }) => $tutorialState === 'disabled' ? 'rgba(150, 150, 150, 0.5)' : 'white'};
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  color: ${({ $tutorialState }) => $tutorialState === 'disabled' ? 'rgba(200, 200, 200, 0.6)' : 'white'};
  font-weight: bold;
  box-shadow: ${({ $tutorialState }) => $tutorialState === 'disabled' ? 'none' : '0 4px 12px rgba(0, 0, 0, 0.3)'};
  animation: ${({ $tutorialState }) => {
    if ($tutorialState === 'disabled') return 'none';
    if ($tutorialState === 'recommended') return 'indicatorBobRecommended 1.5s ease-in-out infinite';
    return 'indicatorBob 2s ease-in-out infinite';
  }};
  pointer-events: none;
  z-index: 5;
  
  ${RoomArea}:hover & {
    animation: ${({ $tutorialState }) => {
      if ($tutorialState === 'disabled') return 'none';
      return 'indicatorBobHover 1s ease-in-out infinite';
    }};
    transform: ${({ $tutorialState }) => 
      $tutorialState === 'disabled' 
        ? 'translate(-50%, -50%)' 
        : 'translate(-50%, -50%) scale(1.1)'
    };
  }
`;

// Removed unused styled components for cleaner code

// Simplified - no longer need separate component

const BackButton = styled.button`
  position: absolute;
  top: 20px;
  left: 20px;
  background: rgba(0, 0, 0, 0.7);
  color: #fff;
  border: none;
  padding: 10px 15px;
  border-radius: 5px;
  cursor: pointer;
  font-size: 14px;
  
  &:hover {
    background: rgba(0, 0, 0, 0.9);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;



// Room definitions with isometric click areas and thematic icons
const ROOM_AREAS = [
  {
    id: 'physics-office',
    name: 'Physics Office',
    x: 25, y: 31, width: 10, height: 10,
    mentorId: 'garcia',
    mentorName: 'Dr. Garcia',
    activityType: 'narrative' as const,
    icon: '📊' // Analysis and planning
  },
  {
    id: 'cafeteria',
    name: 'Hospital Cafeteria',
    x: 18, y: 42, width: 12, height: 8,
    mentorId: 'quinn', // Quinn organizes the lunch scene
    mentorName: 'Team Lunch',
    activityType: 'narrative' as const,
    icon: '🍽️' // Dining and team gathering
  },
  {
    id: 'treatment-room',
    name: 'Treatment Room', 
    x: 55, y: 28, width: 13, height: 15,
    mentorId: 'garcia',
    mentorName: 'Dr. Garcia',
    activityType: 'narrative' as const,
    icon: '⚕️' // Medical care
  },
  {
    id: 'linac-2',
    name: 'LINAC Room 2',
    x: 64, y: 35, width: 13, height: 15,
    mentorId: 'jesse',
    mentorName: 'Jesse',
    activityType: 'narrative' as const,
    icon: '⚡' // High-energy equipment
  },
  {
    id: 'dosimetry-lab',
    name: 'Dosimetry Lab',
    x: 75.5, y: 53, width: 12, height: 10,
    mentorId: 'kapoor',
    mentorName: 'Dr. Kapoor',
    activityType: 'narrative' as const,
    icon: '🔬' // Precision measurement
  },
  {
    id: 'simulation-suite',
    name: 'Simulation Suite',
    x: 41, y: 20, width: 19, height: 15,
    mentorId: 'jesse',
    mentorName: 'Jesse',
    activityType: 'narrative' as const,
    icon: '🎯' // Targeting and simulation
  }
];



// Weather/Time Circular UI Window
const WeatherTimeWindow = styled.div`
  position: absolute;
  top: 30px;
  left: 30px;
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: rgba(15, 23, 42, 0.9);
  border: 2px solid rgba(124, 58, 237, 0.5);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 
    0 4px 20px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
  z-index: 10;
  cursor: pointer;
  
  &:hover {
    transform: scale(1.05);
    border-color: rgba(124, 58, 237, 0.8);
    box-shadow: 
      0 6px 25px rgba(0, 0, 0, 0.4),
      0 0 20px rgba(124, 58, 237, 0.3);
  }
`;

const WeatherIcon = styled.div`
  width: 48px;
  height: 48px;
  background-image: url('/images/hospital/time-symbols.png');
  background-size: 550px 50px; /* 275px * 2 for 2x scale, 25px * 2 for 2x scale */
  background-repeat: no-repeat;
  image-rendering: pixelated;
`;

// Tutorial guidance display
const TutorialGuidanceOverlay = styled.div<{ $visible: boolean }>`
  position: absolute;
  top: 20px;
  right: 20px;
  background: rgba(0, 0, 0, 0.85);
  color: white;
  padding: 12px 16px;
  border-radius: 8px;
  max-width: 300px;
  opacity: ${({ $visible }) => $visible ? 1 : 0};
  transform: translateY(${({ $visible }) => $visible ? '0' : '-10px'});
  transition: all 0.3s ease;
  pointer-events: ${({ $visible }) => $visible ? 'auto' : 'none'};
  z-index: 20;
  border-left: 4px solid #10B981;
  
  font-size: 14px;
  line-height: 1.4;
  
  &::before {
    content: '🎓 ';
    font-size: 16px;
    margin-right: 6px;
  }
`;

// Toast notification for user feedback
const ToastNotification = styled.div<{ $visible: boolean }>`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(220, 38, 38, 0.95);
  color: white;
  padding: 16px 24px;
  border-radius: 12px;
  max-width: 400px;
  text-align: center;
  opacity: ${({ $visible }) => $visible ? 1 : 0};
  transform: translate(-50%, -50%) scale(${({ $visible }) => $visible ? 1 : 0.9});
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  pointer-events: none;
  z-index: 30;
  border: 2px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  
  font-size: 16px;
  font-weight: 500;
  line-height: 1.4;
  
  &::before {
    content: '🚫 ';
    font-size: 20px;
    margin-right: 8px;
  }
`;

export default function HospitalBackdrop() {
  const [hoveredRoom, setHoveredRoom] = useState<typeof ROOM_AREAS[0] | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [currentTime, setCurrentTime] = useState(new Date());
  const [debugFrameIndex, setDebugFrameIndex] = useState<number | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  // Update time every minute for weather icon only
  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);
  
  // Get sprite frame position based on current hour (or debug override)
  const getWeatherIconPosition = () => {
    let frameIndex = 0;
    
    // Use debug frame if set, otherwise calculate from time
    if (debugFrameIndex !== null) {
      frameIndex = debugFrameIndex;
    } else {
      const hour = currentTime.getHours();
      
      if (hour >= 6 && hour < 18) {
        // Daytime - use sun frames (frames 1-5)
        // Map 6-17 hours to frames 1-5
        const dayProgress = (hour - 6) / 12; // 0 to 1
        frameIndex = Math.floor(dayProgress * 5) + 1; // frames 1-5
        frameIndex = Math.min(frameIndex, 5); // cap at frame 5
      } else {
        // Nighttime - use moon frames (frames 6-10)
        // Map 18-5 hours to frames 6-10
        let nightHour = hour >= 18 ? hour - 18 : hour + 6; // 0-11 night hours
        const nightProgress = nightHour / 12; // 0 to 1
        frameIndex = Math.floor(nightProgress * 5) + 6; // frames 6-10
        frameIndex = Math.min(frameIndex, 10); // cap at frame 10
      }
    }
    
    // Each frame is 25px wide, scaled to 50px (2x)
    const xPosition = -frameIndex * 50;
    return `${xPosition}px 0px`;
  };
  
  // Debug function to cycle through frames
  const handleTimeDisplayClick = () => {
    if (debugFrameIndex === null) {
      setDebugFrameIndex(0); // Start with frame 0
    } else if (debugFrameIndex >= 10) {
      setDebugFrameIndex(null); // Reset to automatic after frame 10
    } else {
      setDebugFrameIndex(debugFrameIndex + 1); // Next frame
    }
  };
  
  const { 
    enterNarrative, 
    enterChallenge, 
    returnToPrevious, 
    canGoBack,
    goToConstellation 
  } = useSceneNavigation();
  
  const { startFirstDayTutorial } = useTutorialNavigation();
  const tutorialStore = useTutorialStore();
  const dialogueStore = useDialogueStore();
  
  // Get tutorial state for room availability
  const currentTutorialStep = tutorialStore.currentStep;
  const tutorialMode = tutorialStore.mode;
  const isTutorialActive = tutorialMode === 'active_sequence';
  
  // Get tutorial guidance text
  const tutorialGuidance = isTutorialActive ? getTutorialStepGuidance(currentTutorialStep) : '';
  
  // Determine tutorial state for each room
  const getRoomTutorialState = (roomId: string): 'available' | 'recommended' | 'disabled' => {
    if (!isTutorialActive) return 'available';
    
    if (!isRoomAvailableInTutorial(roomId, currentTutorialStep)) {
      return 'disabled';
    }
    
    if (isRecommendedTutorialRoom(roomId, currentTutorialStep)) {
      return 'recommended';
    }
    
    return 'available';
  };
  
  const handleRoomClick = (room: typeof ROOM_AREAS[0]) => {
    // Check tutorial availability first
    if (isTutorialActive && !isRoomAvailableInTutorial(room.id, currentTutorialStep)) {
      // Show feedback for unavailable room click
      const stepConfig = currentTutorialStep ? TUTORIAL_STEP_ROOM_AVAILABILITY[currentTutorialStep] : null;
      const message = stepConfig?.description || `Room not available during this tutorial step`;
      
      setToastMessage(`${room.name} is not available right now. ${message}`);
      setTimeout(() => setToastMessage(null), 4000);
      return;
    }
    
    const tutorialMode = tutorialStore.mode;
    
    // Single decision tree based on tutorial mode
    switch (tutorialMode) {
      case 'active_sequence':
        // Try tutorial-specific dialogue first
        if (tutorialStore.currentStep) {
          const tutorialDialogueId = getTutorialDialogueForRoom(room.id, tutorialStore.currentStep);
          if (tutorialDialogueId) {
            dialogueStore.startDialogue(tutorialDialogueId);
            enterNarrative(room.mentorId, tutorialDialogueId, room.id);
            return;
          }
        }
        // Fall through to default if no tutorial dialogue
        break;
        
      case 'background_hints':
        // Show hints but use normal dialogues
        // TODO: Add subtle hint overlays here
        break;
        
      case 'disabled':
      case 'debug_mode':
      default:
        // Normal gameplay
        break;
    }
    
    // Default room behavior (used for all modes if no tutorial override)
    if (room.activityType === 'narrative') {
      enterNarrative(room.mentorId, `${room.id}-intro`, room.id);
    } else {
      enterChallenge(`${room.id}-activity`, room.mentorId, room.id);
    }
  };
  
  const handleRoomHover = (room: typeof ROOM_AREAS[0], event: React.MouseEvent) => {
    setHoveredRoom(room);
    
    // Calculate position relative to the room area center
    const rect = event.currentTarget.getBoundingClientRect();
    const centerX = rect.left + (rect.width / 2);
    const centerY = rect.top + (rect.height / 2) - 50; // Offset slightly above
    
    setTooltipPosition({ x: centerX, y: centerY });
  };
  
  const handleRoomLeave = () => {
    setHoveredRoom(null);
  };
  
  return (
    <HospitalContainer>
      {/* Weather/Time Circular UI Window */}
      <WeatherTimeWindow onClick={handleTimeDisplayClick}>
        <WeatherIcon style={{ backgroundPosition: getWeatherIconPosition() }} />
      </WeatherTimeWindow>
      
      {/* Tutorial Guidance Overlay */}
      <TutorialGuidanceOverlay $visible={isTutorialActive && !!tutorialGuidance}>
        {tutorialGuidance}
      </TutorialGuidanceOverlay>
      
      {/* Toast Notification for Tutorial Feedback */}
      <ToastNotification $visible={!!toastMessage}>
        {toastMessage}
      </ToastNotification>
      
      {canGoBack && (
        <BackButton onClick={returnToPrevious}>
          ← Back
        </BackButton>
      )}
      
      <HospitalBuilding>
        {ROOM_AREAS.map(room => {
          const tutorialState = getRoomTutorialState(room.id);
          
          return (
            <RoomArea
              key={room.id}
              x={room.x}
              y={room.y} 
              width={room.width}
              height={room.height}
              $roomId={room.id}
              $activityType={room.activityType}
              $tutorialState={tutorialState}
              onClick={() => handleRoomClick(room)}
              onMouseEnter={(e: React.MouseEvent) => handleRoomHover(room, e)}
              onMouseLeave={handleRoomLeave}
            >
              <RoomIndicator $roomId={room.id} $tutorialState={tutorialState}>
                {room.icon}
              </RoomIndicator>
            </RoomArea>
          );
        })}
      </HospitalBuilding>
      
      {/* Always render overlay to prevent strobing - control visibility with opacity */}
      <HospitalRoomOverlay
        visible={!!hoveredRoom}
        roomId={hoveredRoom?.id || ''}
        roomName={hoveredRoom?.name || ''}
        mentorName={hoveredRoom?.mentorName || ''}
        activityType={hoveredRoom?.activityType || 'narrative'}
        x={tooltipPosition.x}
        y={tooltipPosition.y}
      />
      
      {/* Quick access buttons */}
      <button
        style={{
          position: 'absolute',
          bottom: '20px',
          right: '20px',
          background: 'rgba(59, 130, 246, 0.8)',
          color: '#fff',
          border: 'none',
          padding: '12px 20px',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '14px'
        }}
        onClick={goToConstellation}
      >
        ⭐ Knowledge Constellation
      </button>
      
      {/* Tutorial test button */}
      <button
        style={{
          position: 'absolute',
          bottom: '80px',
          right: '20px',
          background: 'rgba(16, 185, 129, 0.8)',
          color: '#fff',
          border: 'none',
          padding: '12px 20px',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '14px'
        }}
        onClick={startFirstDayTutorial}
      >
        🎓 Start Tutorial
      </button>
      
      {/* Enhanced CSS Animations with tutorial states */}
      <style jsx global>{`
        @keyframes roomPulse {
          0%, 100% { opacity: 0.8; }
          50% { opacity: 1; }
        }
        
        @keyframes roomPulseRecommended {
          0%, 100% { opacity: 0.9; }
          50% { opacity: 1; }
        }
        
        @keyframes roomPulseHover {
          0%, 100% { opacity: 0.9; }
          50% { opacity: 1; }
        }
        
        @keyframes indicatorBob {
          0%, 100% { 
            transform: translate(-50%, -50%) translateY(0px);
          }
          50% { 
            transform: translate(-50%, -50%) translateY(-3px);
          }
        }
        
        @keyframes indicatorBobRecommended {
          0%, 100% { 
            transform: translate(-50%, -50%) translateY(0px) scale(1.05);
          }
          50% { 
            transform: translate(-50%, -50%) translateY(-5px) scale(1.05);
          }
        }
        
        @keyframes indicatorBobHover {
          0%, 100% { 
            transform: translate(-50%, -50%) scale(1.1) translateY(0px);
          }
          50% { 
            transform: translate(-50%, -50%) scale(1.1) translateY(-5px);
          }
        }
      `}</style>
    </HospitalContainer>
  );
} 