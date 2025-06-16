'use client';

import React, { useState } from 'react';
import { MentorRelationshipIndicator } from '@/app/components/ui/MentorRelationshipIndicator';
import { useRelationshipStore } from '@/app/store/relationshipStore';
import { MentorId } from '@/app/types';
import { colors, typography, spacing, borders, shadows } from '@/app/styles/pixelTheme';

export default function RelationshipDemo() {
  const { 
    updateRelationship,
    getRelationshipLevel, 
    getRelationshipPoints 
  } = useRelationshipStore();
  
  // State to force re-render when relationships change
  const [updateCounter, setUpdateCounter] = useState(0);
  
  // Helper to add a point to a mentor relationship
  const incrementRelationship = (mentorId: MentorId) => {
    updateRelationship(mentorId, 1, 'demo_increment');
    setUpdateCounter(prev => prev + 1);
  };
  
  // Helper to remove a point from a mentor relationship
  const decrementRelationship = (mentorId: MentorId) => {
    updateRelationship(mentorId, -1, 'demo_decrement');
    setUpdateCounter(prev => prev + 1);
  };
  
  // Helper to add 10 points at once for level up demonstration
  const addTenPoints = (mentorId: MentorId) => {
    updateRelationship(mentorId, 10, 'demo_level_up');
    setUpdateCounter(prev => prev + 1);
  };
  
  return (
    <div style={{
      maxWidth: '800px',
      margin: '0 auto',
      padding: spacing.lg,
      backgroundColor: colors.background,
      color: colors.text,
      fontFamily: typography.fontFamily.pixel,
      minHeight: '100vh'
    }}>
      <h1 style={{
        fontSize: typography.fontSize.xl,
        marginBottom: spacing.lg,
        textAlign: 'center',
        textShadow: typography.textShadow.pixel
      }}>
        Mentor Relationship System Demo
      </h1>
      
      <div style={{ 
        display: 'flex',
        flexDirection: 'column',
        gap: spacing.lg
      }}>
        {/* Display relationship indicators for each mentor */}
        {Object.values(MentorId).map(mentorId => (
          <div key={mentorId} style={{
            border: borders.thin,
            borderRadius: spacing.sm,
            padding: spacing.md,
            backgroundColor: colors.backgroundAlt,
            boxShadow: shadows.sm
          }}>
            <MentorRelationshipIndicator mentorId={mentorId} />
            
            <div style={{ 
              display: 'flex', 
              gap: spacing.sm,
              marginTop: spacing.md
            }}>
              <button 
                onClick={() => decrementRelationship(mentorId)}
                style={{
                  padding: `${spacing.xs} ${spacing.sm}`,
                  borderRadius: spacing.xs,
                  border: borders.thin,
                  backgroundColor: colors.error,
                  color: colors.text,
                  cursor: 'pointer',
                  flex: 1
                }}
              >
                -1 Point
              </button>
              
              <button 
                onClick={() => incrementRelationship(mentorId)}
                style={{
                  padding: `${spacing.xs} ${spacing.sm}`,
                  borderRadius: spacing.xs,
                  border: borders.thin,
                  backgroundColor: colors.active,
                  color: colors.text,
                  cursor: 'pointer',
                  flex: 1
                }}
              >
                +1 Point
              </button>
              
              <button 
                onClick={() => addTenPoints(mentorId)}
                style={{
                  padding: `${spacing.xs} ${spacing.sm}`,
                  borderRadius: spacing.xs,
                  border: borders.thin,
                  backgroundColor: colors.highlight,
                  color: colors.text,
                  cursor: 'pointer',
                  flex: 1
                }}
              >
                +10 Points (Level Up)
              </button>
            </div>
            
            <div style={{
              marginTop: spacing.xs,
              fontSize: typography.fontSize.xs,
              color: colors.inactive
            }}>
              Current: Level {getRelationshipLevel(mentorId)} ({getRelationshipPoints(mentorId)}/50 points)
            </div>
          </div>
        ))}
      </div>
      
      <div style={{
        marginTop: spacing.xl,
        padding: spacing.md,
        backgroundColor: 'rgba(20, 30, 40, 0.5)',
        borderRadius: spacing.sm,
        fontSize: typography.fontSize.sm,
        border: borders.thin
      }}>
        <h3 style={{ margin: 0, marginBottom: spacing.xs }}>Relationship Level Guide:</h3>
        <ul style={{ margin: 0, paddingLeft: spacing.lg }}>
          <li>Level 0 (0-9): Unfamiliar</li>
          <li>Level 1 (10-19): Acquaintance</li>
          <li>Level 2 (20-29): Friendly</li>
          <li>Level 3 (30-39): Collaborative</li>
          <li>Level 4 (40-49): Respected</li>
          <li>Level 5 (50): Trusted Colleague</li>
        </ul>
      </div>
    </div>
  );
} 