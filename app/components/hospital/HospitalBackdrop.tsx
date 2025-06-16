'use client';

import React, { useState } from 'react';
import styled from 'styled-components';
import { useSceneNavigation } from '@/app/components/scenes/GameContainer';
import HospitalRoomOverlay from './HospitalRoomOverlay';

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

const RoomArea = styled.div<{ x: number; y: number; width: number; height: number }>`
  position: absolute;
  left: ${({ x }) => x}%;
  top: ${({ y }) => y}%;
  width: ${({ width }) => width}%;
  height: ${({ height }) => height}%;
  border: 2px solid transparent;
  transition: all 0.6s ease;
  border-radius: 4px;
  
  &:hover {
    cursor: pointer;
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



// Room definitions with click areas
const ROOM_AREAS = [
  {
    id: 'physics-office',
    name: 'Physics Office',
    x: 20, y: 30, width: 15, height: 12,
    mentorId: 'garcia',
    mentorName: 'Dr. Garcia',
    activityType: 'narrative' as const
  },
  {
    id: 'linac-1',
    name: 'LINAC Room 1', 
    x: 45, y: 25, width: 18, height: 15,
    mentorId: 'quinn',
    mentorName: 'Dr. Quinn',
    activityType: 'challenge' as const
  },
  {
    id: 'linac-2',
    name: 'LINAC Room 2',
    x: 65, y: 25, width: 16, height: 14,
    mentorId: 'jesse',
    mentorName: 'Jesse',
    activityType: 'narrative' as const
  },
  {
    id: 'dosimetry-lab',
    name: 'Dosimetry Lab',
    x: 70, y: 35, width: 12, height: 10,
    mentorId: 'kapoor',
    mentorName: 'Dr. Kapoor',
    activityType: 'challenge' as const
  },
  {
    id: 'simulation-suite',
    name: 'Simulation Suite',
    x: 35, y: 55, width: 16, height: 12,
    mentorId: 'jesse',
    mentorName: 'Jesse',
    activityType: 'narrative' as const
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
  
  const handleRoomClick = (room: typeof ROOM_AREAS[0]) => {
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
              onClick={() => handleRoomClick(room)}
              onMouseEnter={(e: React.MouseEvent) => handleRoomHover(room, e)}
              onMouseLeave={handleRoomLeave}
            >
              {/* Removed visual indicators to keep click boxes clean */}
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
      
      {/* Quick access to constellation */}
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
    </HospitalContainer>
  );
} 