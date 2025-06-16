'use client';

import React, { useState, useEffect } from 'react';
import { useRelationshipStore } from '@/app/store/relationshipStore';
import { MentorId } from '@/app/types';
import { colors, typography, animation, components, mixins, borders, shadows, spacing } from '@/app/styles/pixelTheme';
import { getPortraitCoordinates, SPRITE_SHEETS } from '@/app/utils/spriteMap';
import SpriteImage from './SpriteImage';

interface MentorRelationshipIndicatorProps {
  mentorId: MentorId;
  showDetails?: boolean; // Whether to show detailed stats or just a simple indicator
  size?: 'sm' | 'md' | 'lg'; // Size of the indicator
}

// Helper function to get mentor character ID for sprite
const getMentorCharacterId = (mentorId: MentorId): string => {
  const mapping: Record<MentorId, string> = {
    Garcia: 'garcia',
    Kapoor: 'kapoor',
    Jesse: 'jesse',
    Quinn: 'quinn',
  };
  return mapping[mentorId] || 'unknown';
};

// Helper to get emoji for relationship level
const getRelationshipEmoji = (level: number): string => {
  switch(level) {
    case 0: return '❓'; // Unknown/Neutral
    case 1: return '👋'; // Acquaintance
    case 2: return '👍'; // Friendly
    case 3: return '🤝'; // Collaborative
    case 4: return '🌟'; // Respected
    case 5: return '⭐'; // Trusted Colleague
    default: return '❓';
  }
};

// Helper to get a descriptive label for relationship level
const getRelationshipLabel = (level: number): string => {
  switch(level) {
    case 0: return 'Unfamiliar';
    case 1: return 'Acquaintance';
    case 2: return 'Friendly';
    case 3: return 'Collaborative';
    case 4: return 'Respected';
    case 5: return 'Trusted Colleague';
    default: return 'Unknown';
  }
};

// Helper to get color for relationship level
const getRelationshipColor = (level: number): string => {
  switch(level) {
    case 0: return colors.inactive;
    case 1: return '#6c71c4'; // Light purple
    case 2: return '#268bd2'; // Blue
    case 3: return '#2aa198'; // Teal
    case 4: return '#859900'; // Green
    case 5: return '#b58900'; // Gold
    default: return colors.inactive;
  }
};

export function MentorRelationshipIndicator({ 
  mentorId, 
  showDetails = true, 
  size = 'md' 
}: MentorRelationshipIndicatorProps) {
  // Get relationship data from store
  const { getRelationshipLevel, getRelationshipPoints } = useRelationshipStore();
  
  // Local state for current values (helps with animations)
  const [level, setLevel] = useState(0);
  const [points, setPoints] = useState(0);
  const [isIncreasing, setIsIncreasing] = useState(false);

  // Constants for the 0-50 scale
  const MAX_POINTS = 50;
  const POINTS_PER_LEVEL = 10; // 10 points per level (5 levels total)
  
  // Update state when relationship changes
  useEffect(() => {
    const currentLevel = getRelationshipLevel(mentorId);
    const currentPoints = getRelationshipPoints(mentorId);
    
    // Check if relationship is increasing for animation
    if (currentPoints > points) {
      setIsIncreasing(true);
      // Reset the animation state after animation completes
      const timer = setTimeout(() => setIsIncreasing(false), 2000);
      return () => clearTimeout(timer);
    }
    
    setLevel(currentLevel);
    setPoints(currentPoints);
  }, [getRelationshipLevel, getRelationshipPoints, mentorId, points]);
  
  // Calculate points needed for next level (except at max level)
  const pointsForNextLevel = level < 5 ? (level + 1) * POINTS_PER_LEVEL : MAX_POINTS;
  const pointsInCurrentLevel = points - (level * POINTS_PER_LEVEL);
  const progressToNextLevel = level < 5 
    ? (pointsInCurrentLevel / POINTS_PER_LEVEL) * 100 
    : 100;
  
  // Determine sizes based on the size prop
  const indicatorSize = {
    sm: { width: '24px', height: '24px', fontSize: typography.fontSize.xs },
    md: { width: '32px', height: '32px', fontSize: typography.fontSize.sm },
    lg: { width: '48px', height: '48px', fontSize: typography.fontSize.md },
  }[size];
  
  const portraitSize = {
    sm: 2,
    md: 2.5,
    lg: 3.5,
  }[size];
  
  // Simple indicator for compact display
  if (!showDetails) {
    return (
      <div 
        title={`${mentorId}: ${getRelationshipLabel(level)} (${points}/${MAX_POINTS} points)`}
        style={{
          width: indicatorSize.width,
          height: indicatorSize.height,
          borderRadius: '50%',
          backgroundColor: getRelationshipColor(level),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: `0 0 5px ${getRelationshipColor(level)}`,
          fontSize: indicatorSize.fontSize,
          border: `1px solid ${colors.border}`,
          transition: `all ${animation.duration.normal} ${animation.easing.pixel}`,
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <span>{getRelationshipEmoji(level)}</span>
        {isIncreasing && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `radial-gradient(circle, transparent 30%, ${getRelationshipColor(level)} 70%)`,
            opacity: 0,
            animation: `pulse ${animation.duration.slow} ${animation.easing.pixel}`,
          }} />
        )}
      </div>
    );
  }
  
  // Detailed indicator with mentor portrait, level, and progress bar
  return (
    <div style={{
      borderRadius: spacing.sm,
      backgroundColor: colors.backgroundAlt,
      padding: spacing.sm,
      border: borders.thin,
      width: '100%',
      maxWidth: '300px',
      boxShadow: shadows.sm,
      transition: `all ${animation.duration.normal} ${animation.easing.pixel}`,
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Pulsing background animation for relationship increase */}
      {isIncreasing && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `radial-gradient(circle at center, ${getRelationshipColor(level)}20 0%, transparent 70%)`,
          animation: `pulse ${animation.duration.slow} ${animation.easing.pixel} 3`,
          zIndex: 0
        }} />
      )}
      
      {/* Mentor info row */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: spacing.sm,
        marginBottom: spacing.xs,
        position: 'relative',
        zIndex: 1
      }}>
        {/* Mentor portrait with level indicator */}
        <div style={{ 
          position: 'relative',
          width: '48px',
          height: '48px'
        }}>
          <div style={{
            borderRadius: '50%',
            overflow: 'hidden',
            border: `2px solid ${getRelationshipColor(level)}`,
            width: '48px',
            height: '48px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.backgroundAlt,
            boxShadow: shadows.sm
          }}>
            <SpriteImage
              src={SPRITE_SHEETS.chibiPortraits}
              coordinates={getPortraitCoordinates(getMentorCharacterId(mentorId) as any, 'chibi')}
              alt={mentorId}
              scale={2.5}
              pixelated={true}
            />
          </div>
          <div style={{
            position: 'absolute',
            bottom: -4,
            right: -4,
            backgroundColor: getRelationshipColor(level),
            color: colors.text,
            borderRadius: '50%',
            width: '22px',
            height: '22px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: typography.fontSize.xs,
            fontWeight: 'bold',
            border: `1px solid ${colors.border}`,
            boxShadow: shadows.sm
          }}>
            {level}
          </div>
        </div>
        
        {/* Mentor name and relationship status */}
        <div style={{ flex: 1 }}>
          <div style={{
            fontWeight: 'bold',
            fontSize: typography.fontSize.sm,
            color: colors.text
          }}>
            {mentorId}
          </div>
          <div style={{
            fontSize: typography.fontSize.xs,
            color: getRelationshipColor(level),
            display: 'flex',
            alignItems: 'center',
            gap: spacing.xxs
          }}>
            <span>{getRelationshipEmoji(level)}</span>
            <span>{getRelationshipLabel(level)}</span>
          </div>
        </div>
        
        {/* Points counter */}
        <div style={{
          fontSize: typography.fontSize.sm,
          fontWeight: 'bold',
          color: getRelationshipColor(level),
          backgroundColor: 'rgba(20, 30, 40, 0.5)',
          padding: `${spacing.xxs} ${spacing.xs}`,
          borderRadius: spacing.xs,
          border: `1px solid ${colors.border}`
        }}>
          {points}/{MAX_POINTS}
        </div>
      </div>
      
      {/* Progress bar */}
      <div style={{
        width: '100%',
        height: '8px',
        backgroundColor: 'rgba(20, 30, 40, 0.5)',
        borderRadius: '4px',
        overflow: 'hidden',
        position: 'relative',
        zIndex: 1
      }}>
        {/* Level markers */}
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div 
              key={i}
              style={{
                position: 'absolute',
                left: `${(i + 1) * 20}%`,
                top: 0,
                bottom: 0,
                width: '2px',
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                zIndex: 2
              }}
            />
          ))}
        </div>
        
        {/* Filled progress */}
        <div style={{
          width: `${(points / MAX_POINTS) * 100}%`,
          height: '100%',
          backgroundColor: getRelationshipColor(level),
          borderRadius: '4px',
          transition: `width ${animation.duration.normal} ${animation.easing.pixel}`,
          boxShadow: `0 0 5px ${getRelationshipColor(level)}`,
          position: 'relative',
          zIndex: 1
        }} />
        
        {/* Current level segment highlight */}
        <div style={{
          position: 'absolute',
          left: `${(level * POINTS_PER_LEVEL / MAX_POINTS) * 100}%`,
          width: `${POINTS_PER_LEVEL / MAX_POINTS * 100}%`,
          height: '100%',
          borderTop: `1px dashed ${colors.border}`,
          borderBottom: `1px dashed ${colors.border}`,
          boxSizing: 'border-box',
          zIndex: 0
        }} />
      </div>
      
      {/* Next level indicator (except at max level) */}
      {level < 5 && (
        <div style={{
          fontSize: typography.fontSize.xs,
          color: colors.inactive,
          marginTop: spacing.xs,
          textAlign: 'right',
          position: 'relative',
          zIndex: 1
        }}>
          {pointsInCurrentLevel}/{POINTS_PER_LEVEL} to {getRelationshipLabel(level + 1)}
        </div>
      )}
    </div>
  );
}

export default MentorRelationshipIndicator; 