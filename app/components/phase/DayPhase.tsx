'use client';

import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useGameStore } from '@/app/store/gameStore';
import { useActivityStore } from '@/app/store/activityStore';
import { LocationId, ActivityOption, ActivityDifficulty, KnowledgeDomain, MentorId, DomainColors } from '@/app/types';
import { TimeManager } from '@/app/core/time/TimeManager';
import ActivityEngagement from '../ui/ActivityEngagement';
import { colors, typography, animation, borders, shadows, spacing, mixins } from '@/app/styles/pixelTheme';
import Image from 'next/image';

// Helper components
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

const DomainDot = styled.div<{ $color: string }>`
  height: ${spacing.xs};
  width: ${spacing.xs};
  border-radius: 50%;
  background-color: ${props => props.$color};
`;

const DomainIndicator = ({ domain }: { domain: KnowledgeDomain }) => {
  const color = DomainColors[domain] || '#888888';
  return (
    <DomainDot 
      $color={color}
      title={domain.replace('_', ' ')}
    />
  );
};

// Define simplified departments
const DEPARTMENTS = {
  TREATMENT: { name: 'Treatment Wing', color: 'rgba(79, 70, 229, 0.4)' },
  PHYSICS: { name: 'Physics Department', color: 'rgba(45, 212, 191, 0.4)' },
  ADMIN: { name: 'Administration', color: 'rgba(244, 114, 182, 0.4)' },
  PATIENT: { name: 'Patient Services', color: 'rgba(251, 146, 60, 0.4)' },
  RESEARCH: { name: 'Research Area', color: 'rgba(139, 92, 246, 0.4)' },
};

// Simplified location configuration with icons
const LOCATIONS = {
  // Treatment Wing (Top Row)
  [LocationId.TREATMENT_ROOM_1]: { 
    row: 0, 
    col: 0, 
    label: 'Treatment Room 1',
    department: DEPARTMENTS.TREATMENT,
    icon: 'Warning Icon.png'
  },
  [LocationId.TREATMENT_ROOM_2]: { 
    row: 0, 
    col: 1, 
    label: 'Treatment Room 2',
    department: DEPARTMENTS.TREATMENT,
    icon: 'Warning Icon.png'
  },
  [LocationId.TREATMENT_ROOM_3]: { 
    row: -1, 
    col: -1, 
    label: 'Treatment Room 3',
    department: DEPARTMENTS.TREATMENT,
    icon: 'Warning Icon.png'
  },
  [LocationId.WARD]: { 
    row: 0, 
    col: 2, 
    label: 'Ward',
    department: DEPARTMENTS.PATIENT,
    icon: 'Red Book (1).png'
  },
  
  // Additional Locations - Top Row
  [LocationId.CLINIC]: { 
    row: 0, 
    col: 3, 
    label: 'Clinic',
    department: DEPARTMENTS.PATIENT,
    icon: 'Note.png'
  },
  
  // Middle Row
  [LocationId.PLANNING_ROOM]: { 
    row: 1, 
    col: 0, 
    label: 'Planning Room',
    department: DEPARTMENTS.PHYSICS,
    icon: 'Notepad.png'
  },
  [LocationId.PHYSICS_LAB]: { 
    row: 1, 
    col: 1, 
    label: 'Physics Lab',
    department: DEPARTMENTS.PHYSICS,
    icon: 'CD.png'
  },
  [LocationId.PHYSICS_OFFICE]: { 
    row: 1, 
    col: 2, 
    label: 'Physics Office',
    department: DEPARTMENTS.PHYSICS,
    icon: 'Folder.png'
  },
  [LocationId.CAFETERIA]: { 
    row: 1, 
    col: 3, 
    label: 'Cafeteria',
    department: DEPARTMENTS.PATIENT,
    icon: 'Brown Suitcase.png'
  },
  
  // Bottom Row
  [LocationId.CONFERENCE_ROOM]: { 
    row: 2, 
    col: 0, 
    label: 'Conference Room',
    department: DEPARTMENTS.ADMIN,
    icon: 'Modern TV.png'
  },
  [LocationId.WORKSTATION]: { 
    row: 2, 
    col: 1, 
    label: 'Workstation',
    department: DEPARTMENTS.ADMIN,
    icon: 'Printer.png'
  },
  [LocationId.RESEARCH_LAB]: { 
    row: 2, 
    col: 2, 
    label: 'Research Lab',
    department: DEPARTMENTS.RESEARCH,
    icon: 'Screwdriver.png'
  },
  [LocationId.LIBRARY]: { 
    row: 2, 
    col: 3, 
    label: 'Library',
    department: DEPARTMENTS.RESEARCH,
    icon: 'Red Book (1).png'
  },
};

// Styled components
const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;
  width: 100%;
  min-height: 100vh;
  font-family: ${typography.fontFamily.pixel};
  color: ${colors.text};
  image-rendering: pixelated;
  background: linear-gradient(to bottom, #121620, #090b12);
  position: relative;
  padding: ${spacing.md} 0;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: 
      radial-gradient(circle at 20% 30%, rgba(76, 0, 255, 0.1) 0%, transparent 40%),
      radial-gradient(circle at 80% 70%, rgba(25, 0, 112, 0.15) 0%, transparent 40%);
    z-index: 0;
    pointer-events: none;
  }
`;

const CardContainer = styled.div`
  background-color: ${colors.background};
  color: ${colors.text};
  padding: ${spacing.md};
  border-radius: ${spacing.sm};
  max-width: 800px;
  width: 90%;
  font-family: ${typography.fontFamily.pixel};
  box-shadow: 0 4px 0 ${colors.border}, 0 0 0 4px ${colors.border}, 0 0 0 4px ${colors.border}, 4px 0 0 ${colors.border};
  image-rendering: pixelated;
  border: 2px solid ${colors.border};
  position: relative;
  z-index: 1;
`;

const MapContainer = styled.div`
  background-color: ${colors.backgroundAlt};
  position: relative;
  padding: ${spacing.md};
  height: auto;
  width: 100%;
  border-radius: ${spacing.sm};
  border: ${borders.medium};
`;

const FloorGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-template-rows: repeat(3, 1fr);
  gap: ${spacing.md};
  width: 100%;
  height: 540px;
  position: relative;
  z-index: 5;
  padding: ${spacing.xs};
`;

const LocationCard = styled.div<{ $isActive: boolean; $departmentColor: string }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  width: 100%;
  padding: ${spacing.sm};
  background-color: ${props => props.$isActive 
    ? `${props.$departmentColor.replace('0.4', '0.3')}` 
    : 'rgba(30, 41, 59, 0.7)'};
  color: ${props => props.$isActive ? colors.text : colors.inactive};
  border: ${props => props.$isActive ? '2px solid' : '1px solid'};
  border-color: ${props => props.$isActive 
    ? props.$departmentColor.replace('rgba', 'rgb').replace(', 0.4)', ')') 
    : colors.border};
  border-radius: ${spacing.sm};
  cursor: ${props => props.$isActive ? 'pointer' : 'default'};
  transition: all ${animation.duration.fast} ${animation.easing.pixel};
  position: relative;
  box-shadow: ${props => props.$isActive ? shadows.sm : 'none'};
  opacity: ${props => props.$isActive ? 1 : 0.7};
  
  &:hover {
    border-color: ${props => props.$isActive 
      ? props.$departmentColor.replace('rgba', 'rgb').replace(', 0.4)', ')') 
      : colors.border};
    transform: ${props => props.$isActive ? 'translateY(-2px)' : 'none'};
    box-shadow: ${props => props.$isActive ? shadows.md : 'none'};
    z-index: ${props => props.$isActive ? 10 : 1};
  }
`;

const LocationIconContainer = styled.div<{ $isActive?: boolean; $departmentColor?: string }>`
  position: relative;
  width: 48px;
  height: 48px;
  margin-bottom: ${spacing.xs};
  opacity: 0.8;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: ${props => props.$isActive ? 
    props.$departmentColor?.replace('0.4', '0.5') || 'rgba(0, 0, 0, 0.4)' : 
    'rgba(0, 0, 0, 0.4)'};
  border-radius: 4px;
  border: ${props => props.$isActive ? '1px solid' : '1px solid'};
  border-color: ${props => props.$isActive ? 
    props.$departmentColor?.replace('rgba', 'rgb').replace(', 0.4)', ')') || colors.border : 
    colors.border};
  /* Ensure the container doesn't interfere with pixel rendering */
  overflow: visible;
  transform: translate3d(0, 0, 0);
  backface-visibility: hidden;
  filter: ${props => props.$isActive ? 'none' : 'grayscale(100%)'};
  box-shadow: ${props => props.$isActive ? 
    `0 0 8px ${props.$departmentColor?.replace('0.4', '0.6')}` : 
    'none'};
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
  width: 90%;
  border: ${borders.medium};
  border-color: ${colors.highlight};
  box-shadow: 0 4px 0 ${colors.border}, 0 0 0 4px ${colors.border}, 0 0 0 4px ${colors.border}, 4px 0 0 ${colors.border};
  position: relative;
  
  /* Purple highlight border */
  &::before {
    content: '';
    position: absolute;
    top: -2px;
    left: -2px;
    right: -2px;
    bottom: -2px;
    border: 2px solid ${colors.highlight};
    pointer-events: none;
    z-index: -1;
  }
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
  cursor: pointer;
  
  &:hover {
    border-color: ${colors.highlight};
    transform: translateY(-1px);
  }
  
  &:active {
    transform: translateY(1px);
  }
`;

const CancelButton = styled.button`
  background-color: ${colors.backgroundAlt};
  color: ${colors.text};
  border: ${borders.medium};
  border-color: ${colors.border};
  padding: ${spacing.xs} ${spacing.md};
  font-family: ${typography.fontFamily.pixel};
  cursor: pointer;
  transition: all ${animation.duration.fast} ${animation.easing.pixel};
  
  &:hover {
    border-color: ${colors.highlight};
    transform: translateY(-1px);
  }
  
  &:active {
    transform: translateY(1px);
  }
`;

export const DayPhase: React.FC = () => {
  const currentTime = useGameStore(state => state.currentTime);
  const resources = useGameStore(state => state.resources);
  
  const availableActivities = useActivityStore(state => state.availableActivities);
  const currentActivity = useActivityStore(state => state.currentActivity);
  const generateAvailableActivities = useActivityStore(state => state.generateAvailableActivities);
  const selectActivity = useActivityStore(state => state.selectActivity);
  
  // State to track selected location for showing multiple activities
  const [selectedLocation, setSelectedLocation] = React.useState<LocationId | null>(null);
  
  // Generate available activities when time changes
  useEffect(() => {
    if (!currentActivity) {
      generateAvailableActivities();
    }
  }, [currentTime, currentActivity, generateAvailableActivities]);
  
  // Format current time
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
  
  // Handle location click to directly show activity options
  const handleLocationClick = (locationId: LocationId) => {
    const locationActivities = activitiesByLocation[locationId];
    if (locationActivities && locationActivities.length > 0) {
      // Always show the selection modal, even for single activities
      setSelectedLocation(locationId);
    }
  };
  
  // Select a specific activity from the list
  const handleActivitySelect = (activityId: string) => {
    selectActivity(activityId);
    setSelectedLocation(null);
  };
  
  // Close the activity selection modal
  const handleCloseModal = () => {
    setSelectedLocation(null);
  };
  
  // Get location display info - keeping this for potential visual indicators
  const getLocationDisplayInfo = (locationId: LocationId) => {
    const activities = activitiesByLocation[locationId] || [];
    if (activities.length === 0) return null;
    
    const primaryActivity = activities[0];
    
    return {
      mentor: primaryActivity.mentor,
      difficulty: primaryActivity.difficulty,
      domains: primaryActivity.domains,
      activityCount: activities.length
    };
  };
  
  // If there's a current activity, show the engagement component
  if (currentActivity) {
    return <ActivityEngagement />;
  }
  
  return (
    <PageContainer>
      <CardContainer>
        {/* Header with time and resources */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: spacing.md,
          paddingBottom: spacing.sm,
          borderBottom: `1px solid ${colors.border}`
        }}>
          <div>
            <h2 style={{ 
              fontSize: typography.fontSize.xl, 
              fontWeight: 'bold', 
              textShadow: typography.textShadow.pixel,
              margin: 0
            }}>{formattedTime}</h2>
            <p style={{ 
              color: colors.textDim,
              margin: `${spacing.xxs} 0 0 0` 
            }}>Spring - Day 1</p>
          </div>
          <div style={{ 
            display: 'flex', 
            gap: spacing.md,
            backgroundColor: colors.backgroundAlt,
            padding: `${spacing.xs} ${spacing.sm}`,
            borderRadius: spacing.xs,
            border: `1px solid ${colors.border}`
          }}>
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
        
        {/* Hospital map with locations */}
        <MapContainer>
          {/* Floor layout using CSS Grid */}
          <FloorGrid>
            {Object.entries(LOCATIONS).map(([id, location]) => {
              // Skip locations with negative row or column values
              if (location.row < 0 || location.col < 0) return null;
              
              const locationId = id as LocationId;
              const hasActivities = activitiesByLocation[locationId]?.length > 0;
              const displayInfo = getLocationDisplayInfo(locationId);
              
              return (
                <LocationCard 
                  key={id}
                  style={{ 
                    gridRow: location.row + 1, 
                    gridColumn: location.col + 1 
                  }}
                  $isActive={hasActivities}
                  $departmentColor={location.department.color}
                  onClick={hasActivities ? () => handleLocationClick(locationId) : undefined}
                  role="button"
                  tabIndex={hasActivities ? 0 : -1}
                  aria-label={`${location.label}${hasActivities ? " - Click to view activities" : ""}`}
                  className="location-card"
                >
                  {/* Location icon */}
                  <LocationIconContainer 
                    $isActive={hasActivities} 
                    $departmentColor={location.department.color}
                  >
                    <Image 
                      src={`/images/${location.icon}`}
                      alt={location.label}
                      width={48}
                      height={48}
                      style={{ 
                        objectFit: 'contain',
                        /* Pixel rendering with all necessary browser support */
                        imageRendering: 'pixelated',
                        /* Prevent transforms that might cause blurring */
                        transform: 'translateZ(0)',
                        backfaceVisibility: 'hidden',
                        /* Disable anti-aliasing */
                        WebkitFontSmoothing: 'none',
                        MozOsxFontSmoothing: 'none'
                      }}
                      unoptimized={true}
                      priority={true}
                      onError={(e) => {
                        console.warn(`Failed to load image: /images/${location.icon}`);
                        const target = e.target as HTMLImageElement;
                        target.onerror = null; // Prevent infinite fallback loop
                        target.src = '/images/Note.png'; // Fallback image
                      }}
                    />
                  </LocationIconContainer>
                  
                  {/* Location name */}
                  <p style={{ 
                    fontSize: typography.fontSize.sm, 
                    fontWeight: 'medium',
                    textAlign: 'center',
                    color: hasActivities ? colors.text : colors.inactive
                  }}>
                    {location.label}
                  </p>
                  
                  {/* Add activity count badge if there are multiple activities */}
                  {hasActivities && displayInfo && displayInfo.activityCount > 1 && (
                    <div style={{
                      position: 'absolute',
                      top: spacing.xs,
                      right: spacing.xs,
                      backgroundColor: colors.highlight,
                      color: colors.text,
                      borderRadius: '50%',
                      width: '20px',
                      height: '20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: typography.fontSize.xs,
                      fontWeight: 'bold'
                    }}>
                      {displayInfo.activityCount}
                    </div>
                  )}
                </LocationCard>
              );
            })}
          </FloorGrid>
        </MapContainer>
        
        {/* Activity selection modal - keep this but enhance it */}
        {selectedLocation && (
          <ModalOverlay>
            <ModalContent>
              <h3 style={{ 
                fontSize: typography.fontSize.xl, 
                fontWeight: 'bold', 
                marginBottom: spacing.md, 
                display: 'flex', 
                alignItems: 'center',
                textShadow: typography.textShadow.pixel,
                color: colors.text
              }}>
                <span style={{ color: colors.highlight, marginRight: spacing.xs }}>📍</span>
                {LOCATIONS[selectedLocation].label}
              </h3>
              
              <ActivityList>
                {activitiesByLocation[selectedLocation].map(activity => (
                  <ActivityButton
                    key={activity.id}
                    onClick={() => handleActivitySelect(activity.id)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: colors.text }}>
                      <h4 style={{ fontWeight: 'medium', margin: 0 }}>{activity.title}</h4>
                      <span style={{ 
                        color: colors.textDim, 
                        backgroundColor: colors.background, 
                        padding: `0 ${spacing.xs}`, 
                        borderRadius: '4px', 
                        fontSize: typography.fontSize.xs, 
                        display: 'flex', 
                        alignItems: 'center' 
                      }}>
                        {activity.durationMinutes} min
                      </span>
                    </div>
                    <p style={{ 
                      color: colors.textDim, 
                      fontSize: typography.fontSize.sm, 
                      marginTop: spacing.xs,
                      marginBottom: 0 
                    }}>
                      {activity.description}
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: spacing.xs }}>
                      <div>
                        {activity.mentor && (
                          <span style={{ 
                            color: colors.textDim, 
                            fontSize: typography.fontSize.sm, 
                            display: 'flex', 
                            alignItems: 'center' 
                          }}>
                            <span style={{ color: colors.highlight, marginRight: spacing.xs }}>👤</span>
                            {getMentorShortName(activity.mentor)}
                          </span>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs }}>
                        {activity.domains.length > 0 && (
                          <div style={{ display: 'flex', gap: spacing.xs }}>
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
                <CancelButton onClick={handleCloseModal}>
                  Cancel
                </CancelButton>
              </div>
            </ModalContent>
          </ModalOverlay>
        )}
      </CardContainer>
    </PageContainer>
  );
};