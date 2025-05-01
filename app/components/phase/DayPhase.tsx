'use client';

import React, { useEffect } from 'react';
import styled from 'styled-components';
import { useGameStore } from '@/app/store/gameStore';
import { useActivityStore } from '@/app/store/activityStore';
import { LocationId, ActivityOption, ActivityDifficulty, KnowledgeDomain, MentorId, DomainColors } from '@/app/types';
import { TimeManager } from '@/app/core/time/TimeManager';
import ActivityEngagement from '../ui/ActivityEngagement';
import { colors, typography, animation, borders, shadows, spacing } from '@/app/styles/pixelTheme';

// Helper to render difficulty stars
const DifficultyStars = ({ difficulty }: { difficulty: ActivityDifficulty }) => {
  switch (difficulty) {
    case ActivityDifficulty.EASY:
      return <span style={{ color: colors.starGlow }}>★☆☆</span>;
    case ActivityDifficulty.MEDIUM:
      return <span style={{ color: colors.starGlow }}>★★☆</span>;
    case ActivityDifficulty.HARD:
      return <span style={{ color: colors.starGlow }}>★★★</span>;
    default:
      return <span style={{ color: colors.inactive }}>☆☆☆</span>;
  }
};

// Helper to get mentor's short name
const getMentorShortName = (mentorId: MentorId | undefined): string => {
  if (!mentorId) return '';
  
  switch (mentorId) {
    case MentorId.GARCIA: return 'Dr. Garcia';
    case MentorId.KAPOOR: return 'Dr. Kapoor';
    case MentorId.JESSE: return 'Jesse';
    case MentorId.QUINN: return 'Dr. Quinn';
    default: return '';
  }
};

// Helper to render domain indicators
const DomainIndicator = ({ domain }: { domain: KnowledgeDomain }) => {
  const color = DomainColors[domain] || '#888888';
  return (
    <DomainDot 
      $color={color}
      title={domain.replace('_', ' ')}
    />
  );
};

// Define hospital departments/zones
const DEPARTMENTS = {
  TREATMENT: { name: 'Treatment Wing', color: 'rgba(79, 70, 229, 0.2)' },
  PHYSICS: { name: 'Physics Department', color: 'rgba(45, 212, 191, 0.2)' },
  ADMIN: { name: 'Administration', color: 'rgba(244, 114, 182, 0.2)' },
  PATIENT: { name: 'Patient Services', color: 'rgba(251, 146, 60, 0.2)' },
  RESEARCH: { name: 'Research Area', color: 'rgba(139, 92, 246, 0.2)' },
};

// Define location positions for our enhanced map
const LOCATION_POSITIONS = {
  // Treatment Wing (Top Left)
  [LocationId.TREATMENT_ROOM_1]: { 
    top: '18%', 
    left: '15%', 
    label: 'Treatment Room 1',
    department: DEPARTMENTS.TREATMENT,
    size: 'md'
  },
  [LocationId.TREATMENT_ROOM_2]: { 
    top: '18%', 
    left: '30%', 
    label: 'Treatment Room 2',
    department: DEPARTMENTS.TREATMENT,
    size: 'md'
  },
  [LocationId.TREATMENT_ROOM_3]: { 
    top: '18%', 
    left: '45%', 
    label: 'Treatment Room 3',
    department: DEPARTMENTS.TREATMENT,
    size: 'md'
  },
  
  // Physics Department (Middle Left)
  [LocationId.PLANNING_ROOM]: { 
    top: '42%', 
    left: '15%', 
    label: 'Planning Room',
    department: DEPARTMENTS.PHYSICS,
    size: 'lg'
  },
  [LocationId.PHYSICS_LAB]: { 
    top: '42%', 
    left: '30%', 
    label: 'Physics Lab',
    department: DEPARTMENTS.PHYSICS,
    size: 'lg'
  },
  [LocationId.PHYSICS_OFFICE]: { 
    top: '42%', 
    left: '45%', 
    label: 'Physics Office',
    department: DEPARTMENTS.PHYSICS,
    size: 'md'
  },
  
  // Administration (Bottom Left)
  [LocationId.CONFERENCE_ROOM]: { 
    top: '74%', 
    left: '15%', 
    label: 'Conference Room',
    department: DEPARTMENTS.ADMIN,
    size: 'lg'
  },
  [LocationId.WORKSTATION]: { 
    top: '74%', 
    left: '30%', 
    label: 'Workstation',
    department: DEPARTMENTS.ADMIN,
    size: 'md'
  },
  
  // Patient Services (Right Side)
  [LocationId.WARD]: { 
    top: '18%', 
    left: '80%', 
    label: 'Ward',
    department: DEPARTMENTS.PATIENT,
    size: 'xl'
  },
  [LocationId.CLINIC]: { 
    top: '18%', 
    left: '65%', 
    label: 'Clinic',
    department: DEPARTMENTS.PATIENT,
    size: 'md'
  },
  [LocationId.CAFETERIA]: { 
    top: '42%', 
    left: '65%', 
    label: 'Cafeteria',
    department: DEPARTMENTS.PATIENT,
    size: 'lg'
  },
  
  // Research Area (Bottom Right)
  [LocationId.RESEARCH_LAB]: { 
    top: '74%', 
    left: '65%', 
    label: 'Research Lab',
    department: DEPARTMENTS.RESEARCH,
    size: 'md'
  },
  [LocationId.LIBRARY]: { 
    top: '74%', 
    left: '80%', 
    label: 'Library',
    department: DEPARTMENTS.RESEARCH,
    size: 'lg'
  },
};

// Define corridors to connect locations
const CORRIDORS = [
  // Main horizontal pathways
  { x1: '15%', y1: '18%', x2: '45%', y2: '18%', width: '2px' }, // Treatment rooms connection
  { x1: '65%', y1: '18%', x2: '80%', y2: '18%', width: '2px' }, // Patient area connection (Clinic to Ward)
  
  { x1: '15%', y1: '42%', x2: '45%', y2: '42%', width: '2px' }, // Physics area horizontal
  { x1: '45%', y1: '42%', x2: '65%', y2: '42%', width: '2px' }, // Connect Physics to Cafeteria
  
  { x1: '15%', y1: '74%', x2: '30%', y2: '74%', width: '2px' }, // Admin area (Conference to Workstation)
  { x1: '65%', y1: '74%', x2: '80%', y2: '74%', width: '2px' }, // Research area (Research Lab to Library)
  
  // Central horizontal connectors
  { x1: '45%', y1: '30%', x2: '65%', y2: '30%', width: '2px' }, // Connect to Clinic
  
  // Vertical pathways
  { x1: '15%', y1: '18%', x2: '15%', y2: '74%', width: '2px' }, // Left vertical
  { x1: '30%', y1: '18%', x2: '30%', y2: '74%', width: '2px' }, // Second vertical
  { x1: '45%', y1: '18%', x2: '45%', y2: '42%', width: '2px' }, // Third vertical (partial)
  { x1: '65%', y1: '18%', x2: '65%', y2: '74%', width: '2px' }, // Right vertical
  { x1: '80%', y1: '18%', x2: '80%', y2: '74%', width: '2px' }, // Far right vertical
];

// Styled components
const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  max-width: 5xl;
  margin: 0 auto;
  font-family: ${typography.fontFamily.pixel};
  color: ${colors.text};
  image-rendering: pixelated;
`;

const Header = styled.div`
  background-color: ${colors.background};
  margin-bottom: ${spacing.md};
  padding: ${spacing.md};
  border-radius: ${spacing.sm};
  box-shadow: 0 4px 0 ${colors.border}, 0 0 0 4px ${colors.border}, 0 0 0 4px ${colors.border}, 4px 0 0 ${colors.border};
`;

const MapContainer = styled.div`
  background-color: ${colors.background};
  position: relative;
  padding: ${spacing.md};
  flex-grow: 1;
  height: 640px;
  border-radius: ${spacing.sm};
  box-shadow: 0 4px 0 ${colors.border}, 0 0 0 4px ${colors.border}, 0 0 0 4px ${colors.border}, 4px 0 0 ${colors.border};
`;

const MapBackground = styled.div`
  position: absolute;
  inset: ${spacing.md};
  border: ${borders.medium};
  border-radius: ${spacing.sm};
  background-color: ${colors.backgroundAlt};
`;

const DepartmentZone = styled.div<{ $top: string; $left: string; $width: string; $height: string; $color: string }>`
  position: absolute;
  top: ${props => props.$top};
  left: ${props => props.$left};
  width: ${props => props.$width};
  height: ${props => props.$height};
  background-color: ${props => props.$color};
  border: 2px solid rgba(255,255,255,0.1);
  border-radius: 24px;
  opacity: 0.7;
  z-index: 1;
`;

const DepartmentLabel = styled.div`
  position: absolute;
  top: -16px;
  left: ${spacing.md};
  font-size: ${typography.fontSize.xs};
  font-weight: semibold;
  padding: ${spacing.xxs} ${spacing.xs};
  background-color: ${colors.background};
  color: ${colors.text};
  border-radius: 16px;
`;

const Corridor = styled.div<{ $x1: string; $y1: string; $x2: string; $y2: string; $width: string }>`
  position: absolute;
  left: ${props => props.$x1};
  top: ${props => props.$y1};
  width: ${props => props.$x1 === props.$x2 ? props.$width : `calc(${props.$x2} - ${props.$x1})`};
  height: ${props => props.$y1 === props.$y2 ? props.$width : `calc(${props.$y2} - ${props.$y1})`};
  z-index: 3;
  background-color: rgba(129, 140, 248, 0.3);
  box-shadow: 0 0 4px rgba(129, 140, 248, 0.3);
  border-radius: 1px;
`;

const PlayerIndicator = styled.div<{ $top: string; $left: string }>`
  position: absolute;
  top: ${props => props.$top};
  left: ${props => props.$left};
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: ${colors.highlight};
  border: 2px solid white;
  z-index: 30;
  transition: all ${animation.duration.normal} ${animation.easing.smooth};
  animation: pulse 1.5s infinite ${animation.easing.smooth};
  box-shadow: ${shadows.glow(colors.highlight)};
  transform: translate(-50%, -50%);
  display: flex;
  align-items: center;
  justify-content: center;
`;

const LocationButton = styled.button<{ 
  $top: string; 
  $left: string; 
  $width: string; 
  $height: string; 
  $isActive: boolean 
}>`
  position: absolute;
  top: ${props => props.$top};
  left: ${props => props.$left};
  transform: translate(-50%, -50%);
  border-radius: ${spacing.sm};
  padding: ${spacing.xs};
  transition: all ${animation.duration.fast} ${animation.easing.pixel};
  width: ${props => props.$width};
  height: ${props => props.$height};
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  text-align: center;
  background-color: ${props => props.$isActive ? colors.highlight : colors.backgroundAlt};
  color: ${props => props.$isActive ? colors.text : colors.inactive};
  opacity: ${props => props.$isActive ? 1 : 0.95};
  cursor: ${props => props.$isActive ? 'pointer' : 'default'};
  z-index: ${props => props.$isActive ? 15 : 5};
  box-shadow: ${props => props.$isActive 
    ? `0 4px 0 ${colors.border}, 0 0 0 4px ${colors.border}, 0 0 0 4px ${colors.border}, 4px 0 0 ${colors.border}`
    : 'none'};
  border: ${props => props.$isActive ? 'none' : borders.thin};
`;

const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 20;
  backdrop-filter: blur(4px);
`;

const ModalContent = styled.div`
  background-color: ${colors.background};
  padding: ${spacing.lg};
  max-width: 500px;
  width: 100%;
  border: ${borders.medium};
  border-color: ${colors.highlight};
  box-shadow: 0 4px 0 ${colors.border}, 0 0 0 4px ${colors.border}, 0 0 0 4px ${colors.border}, 4px 0 0 ${colors.border};
`;

const ActivityList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${spacing.sm};
  margin-bottom: ${spacing.md};
  max-height: 384px;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: ${colors.border} ${colors.backgroundAlt};
`;

const ActivityButton = styled.button`
  background-color: ${colors.backgroundAlt};
  padding: ${spacing.md};
  width: 100%;
  text-align: left;
  transition: all ${animation.duration.fast} ${animation.easing.pixel};
  border: ${borders.medium};
  border-color: ${colors.border};
`;

const DomainDot = styled.div<{ $color: string }>`
  height: ${spacing.xs};
  width: ${spacing.xs};
  border-radius: 50%;
  background-color: ${props => props.$color};
`;

export const DayPhase: React.FC = () => {
  const currentTime = useGameStore(state => state.currentTime);
  const resources = useGameStore(state => state.resources);
  
  const availableActivities = useActivityStore(state => state.availableActivities);
  const currentActivity = useActivityStore(state => state.currentActivity);
  const generateAvailableActivities = useActivityStore(state => state.generateAvailableActivities);
  const selectActivity = useActivityStore(state => state.selectActivity);
  
  // Generate available activities when time changes
  useEffect(() => {
    if (!currentActivity) {
      generateAvailableActivities();
    }
  }, [currentTime, currentActivity, generateAvailableActivities]);
  
  // Format the current time
  const formattedTime = TimeManager.formatTime(currentTime);
  
  // Create a map of location to available activities
  const activitiesByLocation: Record<LocationId, ActivityOption[]> = Object.values(LocationId).reduce((acc, location) => {
    acc[location] = [];
    return acc;
  }, {} as Record<LocationId, ActivityOption[]>);
  
  // Populate activities by location
  availableActivities.forEach(activity => {
    if (activitiesByLocation[activity.location]) {
      activitiesByLocation[activity.location].push(activity);
    }
  });
  
  // State to track player position for animation
  const [playerPosition, setPlayerPosition] = React.useState<{ top: string, left: string } | null>(null);
  
  // Handle location selection - if multiple activities are available, show them
  const handleLocationClick = (locationId: LocationId) => {
    const locationActivities = activitiesByLocation[locationId];
    if (locationActivities && locationActivities.length > 0) {
      // Set player position for animation
      const pos = LOCATION_POSITIONS[locationId];
      setPlayerPosition({ top: pos.top, left: pos.left });
      
      // If only one activity is available, start it immediately
      if (locationActivities.length === 1) {
        setTimeout(() => {
          selectActivity(locationActivities[0].id);
        }, 500); // Short delay for animation
      } else {
        // If multiple activities are available, set selected location to show options
        setSelectedLocation(locationId);
      }
    }
  };
  
  // State to track selected location for showing multiple activities
  const [selectedLocation, setSelectedLocation] = React.useState<LocationId | null>(null);
  
  // Function to select a specific activity from the dropdown
  const handleActivitySelect = (activityId: string) => {
    selectActivity(activityId);
    setSelectedLocation(null);
  };
  
  // Function to close the activity selection modal
  const handleCloseModal = () => {
    setSelectedLocation(null);
  };
  
  // Create a display info object for locations
  const getLocationDisplayInfo = (locationId: LocationId) => {
    const activities = activitiesByLocation[locationId] || [];
    if (activities.length === 0) return null;
    
    // Use first activity as primary info source
    const primaryActivity = activities[0];
    
    return {
      mentor: primaryActivity.mentor,
      difficulty: primaryActivity.difficulty,
      domains: primaryActivity.domains,
      activityCount: activities.length
    };
  };
  
  // Get size class based on location size
  const getSizeClass = (size: string) => {
    switch(size) {
      case 'sm': return { width: '80px', height: '64px' };
      case 'md': return { width: '112px', height: '80px' };
      case 'lg': return { width: '128px', height: '96px' };
      case 'xl': return { width: '160px', height: '112px' };
      default: return { width: '112px', height: '80px' };
    }
  };
  
  // If there's a current activity, show the engagement component
  if (currentActivity) {
    return <ActivityEngagement />;
  }
  
  return (
    <PageContainer>
      {/* Top header for time and resources */}
      <Header>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: typography.fontSize.xl, fontWeight: 'bold', textShadow: typography.textShadow.pixel }}>{formattedTime}</h2>
            <p style={{ color: colors.textDim }}>Spring - Day 1</p>
          </div>
          <div style={{ display: 'flex', gap: spacing.md }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span style={{ color: colors.momentum }}>⚡</span>
              <span>{resources.momentum} / 3</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span style={{ color: colors.insight }}>◆</span>
              <span>{resources.insight}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span style={{ color: colors.highlight }}>★</span>
              <span>{resources.starPoints}</span>
            </div>
          </div>
        </div>
      </Header>
      
      {/* Hospital map with locations */}
      <MapContainer>
        <h3 style={{ 
          fontSize: typography.fontSize.lg,
          fontWeight: 'semibold',
          marginBottom: spacing.sm,
          display: 'flex',
          alignItems: 'center',
          textShadow: typography.textShadow.pixel
        }}>
          <span style={{ marginRight: spacing.xs, color: colors.highlight }}>🏥</span>
          Hospital Map
        </h3>
        
        {/* Map legend */}
        <div style={{
          position: 'absolute',
          top: spacing.md,
          right: spacing.md,
          backgroundColor: colors.background,
          padding: spacing.xs,
          borderRadius: spacing.sm,
          fontSize: typography.fontSize.xs,
          zIndex: 20,
          border: borders.thin
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: spacing.xxs }}>
            <span style={{ color: colors.starGlow, marginRight: spacing.xs }}>★</span>
            <span style={{ color: colors.textDim }}>Easy</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: spacing.xxs }}>
            <span style={{ color: colors.starGlow, marginRight: spacing.xs }}>★★</span>
            <span style={{ color: colors.textDim }}>Medium</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ color: colors.starGlow, marginRight: spacing.xs }}>★★★</span>
            <span style={{ color: colors.textDim }}>Hard</span>
          </div>
        </div>
        
        {/* Map background */}
        <MapBackground />
        
        {/* Department zones */}
        {Object.values(DEPARTMENTS).map((dept, index) => {
          // Get locations in this department
          const deptLocations = Object.entries(LOCATION_POSITIONS).filter(
            ([_, pos]) => pos.department === dept
          );
          
          if (deptLocations.length === 0) return null;
          
          // Calculate average position for labeling
          const positions = deptLocations.map(([_, pos]) => ({
            top: parseFloat(pos.top), 
            left: parseFloat(pos.left)
          }));
          
          // Add some padding and ensure departments don't overlap
          let minTop = Math.min(...positions.map(p => p.top)) - 8;
          let maxTop = Math.max(...positions.map(p => p.top)) + 8;
          let minLeft = Math.min(...positions.map(p => p.left)) - 8;
          let maxLeft = Math.max(...positions.map(p => p.left)) + 8;
          
          // Ensure proper sizing for each department
          switch (dept) {
            case DEPARTMENTS.TREATMENT:
              minTop = 8;
              maxTop = 28;
              minLeft = 5;
              maxLeft = 53;
              break;
            case DEPARTMENTS.PHYSICS:
              minTop = 32;
              maxTop = 54;
              minLeft = 5;
              maxLeft = 53;
              break;
            case DEPARTMENTS.ADMIN:
              minTop = 58;
              maxTop = 90;
              minLeft = 5;
              maxLeft = 42;
              break;
            case DEPARTMENTS.PATIENT:
              minTop = 8;
              maxTop = 54;
              minLeft = 57;
              maxLeft = 92;
              break;
            case DEPARTMENTS.RESEARCH:
              minTop = 58;
              maxTop = 90;
              minLeft = 57;
              maxLeft = 92;
              break;
          }
          
          return (
            <DepartmentZone 
              key={`dept-${index}`}
              $top={`${minTop}%`}
              $left={`${minLeft}%`}
              $width={`${maxLeft - minLeft}%`}
              $height={`${maxTop - minTop}%`}
              $color={dept.color}
            >
              <DepartmentLabel>
                {dept.name}
              </DepartmentLabel>
            </DepartmentZone>
          );
        })}
        
        {/* Corridors */}
        {CORRIDORS.map((corridor, index) => (
          <Corridor 
            key={`corridor-${index}`}
            $x1={corridor.x1}
            $y1={corridor.y1}
            $x2={corridor.x2}
            $y2={corridor.y2}
            $width={corridor.width}
          />
        ))}
        
        {/* Player position indicator */}
        {playerPosition && (
          <PlayerIndicator $top={playerPosition.top} $left={playerPosition.left}>
            <span style={{ color: 'white', fontSize: typography.fontSize.xs, fontWeight: 'bold' }}>YOU</span>
          </PlayerIndicator>
        )}
        
        {/* Location buttons */}
        {Object.entries(LOCATION_POSITIONS).map(([locationId, position]) => {
          const location = locationId as LocationId;
          const hasAvailableActivities = activitiesByLocation[location]?.length > 0;
          const displayInfo = getLocationDisplayInfo(location);
          const sizeInfo = getSizeClass(position.size);
          
          return (
            <LocationButton
              key={locationId}
              $top={position.top}
              $left={position.left}
              $width={sizeInfo.width}
              $height={sizeInfo.height}
              $isActive={hasAvailableActivities}
              onClick={hasAvailableActivities ? () => handleLocationClick(location) : undefined}
            >
              <div style={{ width: '100%' }}>
                <p style={{ 
                  fontSize: typography.fontSize.sm, 
                  fontWeight: 'medium',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {position.label}
                </p>
              </div>
              
              {displayInfo && (
                <>
                  <div style={{ marginTop: spacing.xxs }}>
                    <DifficultyStars difficulty={displayInfo.difficulty} />
                  </div>
                  
                  {displayInfo.mentor && (
                    <div style={{ 
                      fontSize: typography.fontSize.xs, 
                      color: hasAvailableActivities ? colors.text : colors.textDim,
                      marginTop: spacing.xxs,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      width: '100%'
                    }}>
                      {getMentorShortName(displayInfo.mentor)}
                    </div>
                  )}
                  
                  {displayInfo.domains.length > 0 && (
                    <div style={{ 
                      display: 'flex', 
                      gap: spacing.xxs, 
                      marginTop: spacing.xxs, 
                      justifyContent: 'center' 
                    }}>
                      {displayInfo.domains.map((domain, idx) => (
                        <DomainIndicator key={`${location}-${domain}-${idx}`} domain={domain} />
                      ))}
                    </div>
                  )}
                  
                  {displayInfo.activityCount > 1 && (
                    <div style={{ 
                      fontSize: typography.fontSize.xs, 
                      color: hasAvailableActivities ? colors.text : colors.textDim,
                      marginTop: spacing.xxs
                    }}>
                      +{displayInfo.activityCount - 1} more
                    </div>
                  )}
                </>
              )}
            </LocationButton>
          );
        })}
        
        {/* Activity selection modal */}
        {selectedLocation && (
          <ModalOverlay>
            <ModalContent>
              <h3 style={{ 
                fontSize: typography.fontSize.xl, 
                fontWeight: 'bold', 
                marginBottom: spacing.md, 
                display: 'flex', 
                alignItems: 'center',
                textShadow: typography.textShadow.pixel
              }}>
                <span style={{ color: colors.highlight, marginRight: spacing.xs }}>📍</span>
                {LOCATION_POSITIONS[selectedLocation].label}
              </h3>
              
              <ActivityList>
                {activitiesByLocation[selectedLocation].map(activity => (
                  <ActivityButton
                    key={activity.id}
                    onClick={() => handleActivitySelect(activity.id)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: colors.text }}>
                      <h4 style={{ fontWeight: 'medium' }}>{activity.title}</h4>
                      <span style={{ 
                        color: colors.textDim, 
                        backgroundColor: colors.backgroundAlt, 
                        padding: `0 ${spacing.xs}`, 
                        borderRadius: '16px', 
                        fontSize: typography.fontSize.xs, 
                        display: 'flex', 
                        alignItems: 'center' 
                      }}>
                        {activity.durationMinutes} min
                      </span>
                    </div>
                    <p style={{ color: colors.textDim, fontSize: typography.fontSize.sm, marginTop: spacing.xxs }}>{activity.description}</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: spacing.xs }}>
                      <div>
                        {activity.mentor && (
                          <span style={{ 
                            color: colors.textDim, 
                            fontSize: typography.fontSize.sm, 
                            display: 'flex', 
                            alignItems: 'center' 
                          }}>
                            <span style={{ color: colors.highlight, marginRight: spacing.xxs }}>👤</span>
                            {getMentorShortName(activity.mentor)}
                          </span>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs }}>
                        {activity.domains.length > 0 && (
                          <div style={{ display: 'flex', gap: spacing.xxs }}>
                            {activity.domains.map((domain, idx) => (
                              <DomainIndicator key={`modal-${activity.id}-${domain}-${idx}`} domain={domain} />
                            ))}
                          </div>
                        )}
                        <DifficultyStars difficulty={activity.difficulty} />
                      </div>
                    </div>
                  </ActivityButton>
                ))}
              </ActivityList>
              
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button 
                  style={{
                    padding: `${spacing.xs} ${spacing.md}`,
                    backgroundColor: colors.backgroundAlt,
                    border: borders.medium,
                    borderColor: colors.border,
                    color: colors.text,
                    fontFamily: typography.fontFamily.pixel,
                    cursor: 'pointer'
                  }}
                  onClick={handleCloseModal}
                >
                  Cancel
                </button>
              </div>
            </ModalContent>
          </ModalOverlay>
        )}
      </MapContainer>

      {/* Add pulse animation */}
      <style jsx global>{`
        ${animation.keyframes.pulse}
      `}</style>
    </PageContainer>
  );
};