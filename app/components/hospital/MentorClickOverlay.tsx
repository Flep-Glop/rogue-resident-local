'use client';

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useWorldCoordinates } from '@/app/utils/worldCoordinates';
import { getCurrentMentorPositions, getMentorPosition, type MentorPosition } from '@/app/utils/mentorPositions';
import { getAllMentorContentAvailability, type MentorContentAvailability } from '@/app/core/mentors/mentorContentManager';
import { getCurrentTimeOfDay } from '@/app/core/time/TutorialTimeProgression';
import { centralEventBus } from '@/app/core/events/CentralEventBus';
import { GameEventType } from '@/app/types';

// Activity indicator types (for visual feedback)
export type ActivityIndicatorType = 'narrative' | 'challenge' | 'tutorial' | 'available' | null;

interface MentorClickAreaProps {
  mentorPosition: MentorPosition;
  activityType: ActivityIndicatorType;
  isHovered: boolean;
  onClick: () => void;
  onHover: (isHovered: boolean) => void;
}

interface MentorClickOverlayProps {
  onMentorClick: (mentorId: string, roomId: string) => void;
}

// Styled components for the click areas and indicators
const ClickArea = styled.div<{ $isHovered: boolean; $hasContent: boolean }>`
  position: absolute;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  cursor: ${props => props.$hasContent ? 'pointer' : 'default'};
  transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  z-index: 10;
  overflow: visible; /* Allow indicators to extend beyond bounds */
  
  /* Enhanced hover feedback */
  background: ${props => {
    if (!props.$hasContent) return 'transparent';
    return props.$isHovered 
      ? 'rgba(255, 255, 255, 0.15)' 
      : 'rgba(255, 255, 255, 0.05)';
  }};
  border: ${props => {
    if (!props.$hasContent) return '2px solid transparent';
    return props.$isHovered 
      ? '2px solid rgba(255, 255, 255, 0.4)' 
      : '2px solid transparent';
  }};
  
  /* Subtle glow effect on hover */
  box-shadow: ${props => props.$isHovered && props.$hasContent
    ? '0 0 20px rgba(255, 255, 255, 0.2)'
    : 'none'
  };
  
  /* Scale effect on hover */
  transform: ${props => props.$isHovered && props.$hasContent 
    ? 'scale(1.1)' 
    : 'scale(1)'
  };
`;

const ActivityIndicator = styled.div<{ $type: ActivityIndicatorType }>`
  position: absolute;
  top: -20px;
  right: -20px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: bold;
  border: 3px solid #ffffff;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
  z-index: 100; /* Ensure it appears above everything */
  transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  
  /* Enhanced animations based on content type */
  animation: ${props => {
    switch (props.$type) {
      case 'tutorial': return 'tutorialBounce 1.5s infinite';
      case 'narrative': return 'narrativeGlow 3s infinite';
      case 'challenge': return 'challengePulse 2s infinite';
      case 'available': return 'availableBreathe 4s infinite';
      default: return 'none';
    }
  }};
  
  background: ${props => {
    switch (props.$type) {
      case 'narrative': return 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)'; // Blue gradient
      case 'challenge': return 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)'; // Orange gradient
      case 'tutorial': return 'linear-gradient(135deg, #10b981 0%, #34d399 100%)'; // Green gradient
      case 'available': return 'linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%)'; // Purple gradient
      default: return 'transparent';
    }
  }};
  
  color: white;
  
  /* Tutorial content - attention-grabbing bounce */
  @keyframes tutorialBounce {
    0%, 100% { 
      transform: scale(1) translateY(0);
    }
    50% { 
      transform: scale(1.1) translateY(-2px);
    }
  }
  
  /* Narrative content - soft glow */
  @keyframes narrativeGlow {
    0%, 100% { 
      transform: scale(1);
      box-shadow: 0 4px 16px rgba(59, 130, 246, 0.4);
    }
    50% { 
      transform: scale(1.05);
      box-shadow: 0 6px 24px rgba(59, 130, 246, 0.6);
    }
  }
  
  /* Challenge content - energetic pulse */
  @keyframes challengePulse {
    0%, 100% { 
      transform: scale(1);
      opacity: 1;
    }
    50% { 
      transform: scale(1.15);
      opacity: 0.9;
    }
  }
  
  /* Available content - gentle breathing */
  @keyframes availableBreathe {
    0%, 100% { 
      transform: scale(1);
      opacity: 0.8;
    }
    50% { 
      transform: scale(1.05);
      opacity: 1;
    }
  }
`;

const MentorTooltip = styled.div<{ $visible: boolean }>`
  position: absolute;
  bottom: -90px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.9);
  color: white;
  padding: 20px 28px;
  border-radius: 12px;
  font-size: 24px;
  font-weight: bold;
  white-space: nowrap;
  pointer-events: none;
  opacity: ${props => props.$visible ? 1 : 0};
  transition: opacity 0.2s ease;
  z-index: 200; /* Above activity indicators */
  box-shadow: 0 3px 12px rgba(0, 0, 0, 0.3);
  
  &::before {
    content: '';
    position: absolute;
    top: -5px;
    left: 50%;
    transform: translateX(-50%);
    width: 0;
    height: 0;
    border-left: 5px solid transparent;
    border-right: 5px solid transparent;
    border-bottom: 5px solid rgba(0, 0, 0, 0.9);
  }
`;

function MentorClickArea({ 
  mentorPosition, 
  activityType, 
  isHovered, 
  onClick, 
  onHover 
}: MentorClickAreaProps) {
  const { worldToScreen } = useWorldCoordinates();
  
  // Convert world coordinates to screen coordinates
  const screenPosition = worldToScreen(mentorPosition.worldX, mentorPosition.worldY);
  
  // Get activity indicator icon
  const getIndicatorIcon = (type: ActivityIndicatorType): string => {
    switch (type) {
      case 'narrative': return '💬';
      case 'challenge': return '🎯';
      case 'tutorial': return '❓';
      case 'available': return '✨';
      default: return '';
    }
  };
  
  // Get content type label for tooltip
  const getContentTypeLabel = (type: ActivityIndicatorType): string => {
    switch (type) {
      case 'narrative': return '📖 Story Content';
      case 'challenge': return '🧪 Practice Challenge';
      case 'tutorial': return '🎓 Tutorial Guide';
      case 'available': return '💫 Available to Chat';
      default: return '';
    }
  };

  return (
    <ClickArea
      $isHovered={isHovered}
      $hasContent={activityType !== null}
      style={{
        left: screenPosition.x - 10, // Moved right by 10px (was -25, now -15)
        top: screenPosition.y - 3,  // Moved down by 10px (was -25, now -15)
      }}
      onClick={onClick}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
    >
      {/* Activity indicator */}
      {activityType && (
        <ActivityIndicator $type={activityType}>
          {getIndicatorIcon(activityType)}
        </ActivityIndicator>
      )}
      
      {/* Enhanced mentor tooltip */}
      <MentorTooltip $visible={isHovered}>
        <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>
          {mentorPosition.name}
        </div>
        {activityType && (
          <div style={{ fontSize: '18px', opacity: 0.9 }}>
            {getContentTypeLabel(activityType)}
          </div>
        )}
      </MentorTooltip>
    </ClickArea>
  );
}

export default function MentorClickOverlay({ onMentorClick }: MentorClickOverlayProps) {
  const [hoveredMentor, setHoveredMentor] = useState<string | null>(null);
  const [contentAvailability, setContentAvailability] = useState<Record<string, MentorContentAvailability>>({});
  
  // Initialize content availability and set up event listeners
  useEffect(() => {
    // Get initial content availability using current time of day
    const currentTimeOfDay = getCurrentTimeOfDay();
    const initialAvailability = getAllMentorContentAvailability(currentTimeOfDay);
    setContentAvailability(initialAvailability);
    
    // Listen for content availability updates
    const unsubscribe = centralEventBus.subscribe(
      GameEventType.MENTOR_CONTENT_UPDATED,
      (event) => {
        const eventData = event.payload as { contentAvailability: Record<string, MentorContentAvailability> };
        setContentAvailability(eventData.contentAvailability);
      }
    );
    
    return () => {
      unsubscribe();
    };
  }, []);
  
  // Get activity type from content availability data
  const getMentorActivityType = (mentorId: string): ActivityIndicatorType => {
    const mentorContent = contentAvailability[mentorId];
    return mentorContent?.isAvailable ? mentorContent.activityType : null;
  };
  
  const handleMentorClick = (mentorPosition: MentorPosition) => {
    console.log(`[MentorClickOverlay] Clicked mentor: ${mentorPosition.mentorId} in room: ${mentorPosition.currentRoom}`);
    onMentorClick(mentorPosition.mentorId, mentorPosition.currentRoom);
  };
  
  return (
    <div style={{ 
      position: 'absolute', 
      top: 0, 
      left: 0, 
      width: '100%', 
      height: '100%',
      pointerEvents: 'none', // Allow clicks to pass through except on click areas
      overflow: 'visible', // Allow indicators to extend beyond container bounds
      zIndex: 50 // Ensure overlay appears above PixiJS content
    }}>
      {Object.values(getCurrentMentorPositions()).map(mentorPosition => {
        const activityType = getMentorActivityType(mentorPosition.mentorId);
        const isHovered = hoveredMentor === mentorPosition.mentorId;
        
        return (
          <div 
            key={mentorPosition.mentorId} 
            style={{ 
              pointerEvents: 'auto',
              overflow: 'visible' // Allow child indicators to extend beyond bounds
            }}
          >
            <MentorClickArea
              mentorPosition={mentorPosition}
              activityType={activityType}
              isHovered={isHovered}
              onClick={() => handleMentorClick(mentorPosition)}
              onHover={(hovered) => setHoveredMentor(hovered ? mentorPosition.mentorId : null)}
            />
          </div>
        );
      })}
    </div>
  );
} 