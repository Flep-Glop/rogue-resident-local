'use client';

import React, { useState } from 'react';
import styled from 'styled-components';
import { useSceneNavigation } from '@/app/components/scenes/GameContainer';
import HospitalRoomOverlay from './HospitalRoomOverlay';
import { useTutorialNavigation, useTutorialStore } from '@/app/store/tutorialStore';
import { getTutorialDialogueForRoom } from '@/app/data/tutorialDialogues';
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

// Enhanced isometric room area with visual affordances
const RoomArea = styled.div<{ 
  x: number; 
  y: number; 
  width: number; 
  height: number; 
  $roomId: string;
  $activityType: 'narrative' | 'challenge';
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
  
  /* Subtle interactive glow */
  background: ${({ $roomId }) => {
    switch($roomId) {
      case 'physics-office': return 'radial-gradient(ellipse at center, rgba(59, 130, 246, 0.15) 0%, rgba(59, 130, 246, 0.05) 60%, transparent 100%)';
      case 'treatment-room': return 'radial-gradient(ellipse at center, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.05) 60%, transparent 100%)';
      case 'linac-2': return 'radial-gradient(ellipse at center, rgba(245, 158, 11, 0.15) 0%, rgba(245, 158, 11, 0.05) 60%, transparent 100%)';
      case 'dosimetry-lab': return 'radial-gradient(ellipse at center, rgba(236, 72, 153, 0.15) 0%, rgba(236, 72, 153, 0.05) 60%, transparent 100%)';
      case 'simulation-suite': return 'radial-gradient(ellipse at center, rgba(245, 158, 11, 0.15) 0%, rgba(245, 158, 11, 0.05) 60%, transparent 100%)';
      default: return 'radial-gradient(ellipse at center, rgba(124, 58, 237, 0.15) 0%, rgba(124, 58, 237, 0.05) 60%, transparent 100%)';
    }
  }};
  
  border: 2px solid transparent;
  
  transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  cursor: pointer;
  
  /* Subtle pulsing animation */
  animation: roomPulse 3s ease-in-out infinite;
  
  &:hover {
    transform: scale(1.08);
    background: ${({ $roomId }) => {
      switch($roomId) {
        case 'physics-office': return 'radial-gradient(ellipse at center, rgba(59, 130, 246, 0.25) 0%, rgba(59, 130, 246, 0.12) 60%, transparent 100%)';
        case 'treatment-room': return 'radial-gradient(ellipse at center, rgba(16, 185, 129, 0.25) 0%, rgba(16, 185, 129, 0.12) 60%, transparent 100%)';
        case 'linac-2': return 'radial-gradient(ellipse at center, rgba(245, 158, 11, 0.25) 0%, rgba(245, 158, 11, 0.12) 60%, transparent 100%)';
        case 'dosimetry-lab': return 'radial-gradient(ellipse at center, rgba(236, 72, 153, 0.25) 0%, rgba(236, 72, 153, 0.12) 60%, transparent 100%)';
        case 'simulation-suite': return 'radial-gradient(ellipse at center, rgba(245, 158, 11, 0.25) 0%, rgba(245, 158, 11, 0.12) 60%, transparent 100%)';
        default: return 'radial-gradient(ellipse at center, rgba(124, 58, 237, 0.25) 0%, rgba(124, 58, 237, 0.12) 60%, transparent 100%)';
      }
    }};
    border-color: transparent;
    box-shadow: 0 0 20px ${({ $roomId }) => {
      switch($roomId) {
        case 'physics-office': return 'rgba(59, 130, 246, 0.3)';
        case 'treatment-room': return 'rgba(16, 185, 129, 0.3)';
        case 'linac-2': return 'rgba(245, 158, 11, 0.3)';
        case 'dosimetry-lab': return 'rgba(236, 72, 153, 0.3)';
        case 'simulation-suite': return 'rgba(245, 158, 11, 0.3)';
        default: return 'rgba(124, 58, 237, 0.3)';
      }
    }};
    animation: roomPulseHover 1.5s ease-in-out infinite;
  }
`;

// Interactive indicator for each room
const RoomIndicator = styled.div<{ $roomId: string }>`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 32px;
  height: 32px;
  background: ${({ $roomId }) => {
    switch($roomId) {
      case 'physics-office': return 'rgba(59, 130, 246, 0.9)';
      case 'treatment-room': return 'rgba(16, 185, 129, 0.9)';
      case 'linac-2': return 'rgba(245, 158, 11, 0.9)';
      case 'dosimetry-lab': return 'rgba(236, 72, 153, 0.9)';
      case 'simulation-suite': return 'rgba(245, 158, 11, 0.9)';
      default: return 'rgba(124, 58, 237, 0.9)';
    }
  }};
  border: 2px solid white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  color: white;
  font-weight: bold;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  animation: indicatorBob 2s ease-in-out infinite;
  pointer-events: none;
  z-index: 5;
  
  ${RoomArea}:hover & {
    animation: indicatorBobHover 1s ease-in-out infinite;
    transform: translate(-50%, -50%) scale(1.1);
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



export default function HospitalBackdrop() {
  const [hoveredRoom, setHoveredRoom] = useState<typeof ROOM_AREAS[0] | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [currentTime, setCurrentTime] = useState(new Date());
  const [debugFrameIndex, setDebugFrameIndex] = useState<number | null>(null);
  
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
  
  const handleRoomClick = (room: typeof ROOM_AREAS[0]) => {
    // Check if tutorial mode is active
    if (tutorialStore.isActive && tutorialStore.currentStep) {
      // Try to get tutorial-specific dialogue for this room
      const currentStep = tutorialStore.currentStep;
      const tutorialDialogueId = getTutorialDialogueForRoom(room.id, currentStep);
      
      if (tutorialDialogueId) {
        // Start tutorial dialogue
        dialogueStore.startDialogue(tutorialDialogueId);
        enterNarrative(room.mentorId, tutorialDialogueId, room.id);
        return;
      }
      
      // If no specific tutorial dialogue, check for special tutorial steps
      if (currentStep === 'lunch_dialogue') {
        // Any room can trigger lunch dialogue during this step
        dialogueStore.startDialogue('tutorial_lunch_dialogue');
        enterNarrative(room.mentorId, 'tutorial_lunch_dialogue', room.id);
        return;
      }
    }
    
    // Default behavior for non-tutorial mode
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
      
      {canGoBack && (
        <BackButton onClick={returnToPrevious}>
          ← Back
        </BackButton>
      )}
      
      <HospitalBuilding>
        {ROOM_AREAS.map(room => (
          <RoomArea
            key={room.id}
            x={room.x}
            y={room.y} 
            width={room.width}
            height={room.height}
            $roomId={room.id}
            $activityType={room.activityType}
            onClick={() => handleRoomClick(room)}
            onMouseEnter={(e: React.MouseEvent) => handleRoomHover(room, e)}
            onMouseLeave={handleRoomLeave}
          >
            <RoomIndicator $roomId={room.id}>
              {room.icon}
            </RoomIndicator>
          </RoomArea>
        ))}
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
      
      {/* CSS Animations for isometric interaction */}
      <style jsx global>{`
        @keyframes roomPulse {
          0%, 100% { opacity: 0.8; }
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