'use client';

import React from 'react';
import styled from 'styled-components';

const RoomOverlay = styled.div<{ $visible: boolean; $roomType: string; $x?: number; $y?: number }>`
  position: fixed;
  top: ${({ $y }) => $y ? `${$y}px` : '50%'};
  left: ${({ $x }) => $x ? `${$x}px` : '50%'};
  transform: translate(-50%, -50%);
  background: ${({ $roomType }) => {
    switch ($roomType) {
      case 'simulation-suite':
        return 'linear-gradient(135deg, #F59E0B 0%, #FBBF24 50%, #1e1b4b 100%)';
      case 'dosimetry-lab':
        return 'linear-gradient(135deg, #EC4899 0%, #F472B6 50%, #1e1b4b 100%)';
      case 'treatment-room':
        return 'linear-gradient(135deg, #10B981 0%, #34D399 50%, #1e1b4b 100%)';
      case 'linac-2':
        return 'linear-gradient(135deg, #F59E0B 0%, #FBBF24 50%, #1e1b4b 100%)';
      case 'physics-office':
        return 'linear-gradient(135deg, #3B82F6 0%, #60A5FA 50%, #1e1b4b 100%)';
      default:
        return 'linear-gradient(135deg, #6B7280 0%, #9CA3AF 50%, #1e1b4b 100%)';
    }
  }};
  border: 3px solid rgba(255, 215, 0, 0.7);
  border-radius: 16px;
  padding: 20px 24px;
  color: white;
  font-size: 14px;
  width: auto;
  max-width: min(320px, 90vw);
  min-width: min(280px, 80vw);
  text-align: center;
  box-shadow: 0 15px 40px rgba(0, 0, 0, 0.6);
  opacity: ${({ $visible }) => $visible ? 1 : 0};
  transform: translate(-50%, -50%) ${({ $visible }) => $visible ? 'scale(1)' : 'scale(0.8)'};
  transition: all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  z-index: 1000;
  pointer-events: none;
  backdrop-filter: blur(20px);
  overflow: hidden;
  white-space: normal;
  word-wrap: break-word;
  
  /* Ensure no scrollbars */
  ::-webkit-scrollbar {
    display: none;
  }
  -ms-overflow-style: none;
  scrollbar-width: none;

  &::before {
    display: none; /* Remove the arrow since it's now centered */
  }
`;

const RoomTitle = styled.div`
  font-weight: bold;
  font-size: 16px;
  margin-bottom: 8px;
  color: #FFD700;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.6);
`;

const MentorInfo = styled.div`
  margin-bottom: 10px;
  opacity: 0.95;
  font-size: 14px;
  font-weight: 500;
`;

const ActivityType = styled.div<{ $type: 'narrative' | 'challenge' }>`
  font-size: 12px;
  padding: 6px 12px;
  border-radius: 8px;
  background: ${({ $type }) => 
    $type === 'narrative' 
      ? 'rgba(96, 165, 250, 0.4)' 
      : 'rgba(245, 158, 11, 0.4)'
  };
  color: ${({ $type }) => 
    $type === 'narrative' ? '#E0F2FE' : '#FEF3C7'
  };
  border: 2px solid ${({ $type }) => 
    $type === 'narrative' ? '#60A5FA' : '#F59E0B'
  };
  margin-top: 8px;
  font-weight: 600;
  letter-spacing: 0.5px;
  
  &::before {
    content: '${({ $type }) => $type === 'narrative' ? '📖' : '🧪'}';
    margin-right: 6px;
  }
`;

const SpecialtyText = styled.div`
  font-size: 11px;
  opacity: 0.8;
  margin-top: 6px;
  font-style: italic;
  line-height: 1.3;
`;

interface HospitalRoomOverlayProps {
  visible: boolean;
  roomId: string;
  roomName: string;
  mentorName: string;
  activityType: 'narrative' | 'challenge';
  x?: number;
  y?: number;
}

// Room-specific specialty descriptions
const roomSpecialties: Record<string, string> = {
  'simulation-suite': 'Equipment modeling & troubleshooting',
  'dosimetry-lab': 'Precision measurement & calibration',
  'treatment-room': 'Clinical workflow & patient safety',
  'linac-2': 'Linear accelerator technology & beam physics',
  'physics-office': 'Treatment planning & optimization'
};

const OverlayBackdrop = styled.div<{ $visible: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.4);
  opacity: ${({ $visible }) => $visible ? 1 : 0};
  transition: opacity 0.6s ease;
  z-index: 999;
  pointer-events: none;
  overflow: hidden;
  
  /* Ensure no scrollbars */
  ::-webkit-scrollbar {
    display: none;
  }
  -ms-overflow-style: none;
  scrollbar-width: none;
`;

export default function HospitalRoomOverlay({ 
  visible, 
  roomId, 
  roomName, 
  mentorName, 
  activityType,
  x,
  y
}: HospitalRoomOverlayProps) {
  
  return (
    <>
      <OverlayBackdrop $visible={visible} />
      <RoomOverlay $visible={visible} $roomType={roomId} $x={x} $y={y}>
        <RoomTitle>{roomName}</RoomTitle>
        <MentorInfo>👤 {mentorName}</MentorInfo>
        <ActivityType $type={activityType}>
          {activityType === 'narrative' ? 'Story Mode' : 'Challenge Mode'}
        </ActivityType>
        <SpecialtyText>
          {roomSpecialties[roomId] || 'General medical physics'}
        </SpecialtyText>
      </RoomOverlay>
    </>
  );
} 