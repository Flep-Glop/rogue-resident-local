'use client';

import React, { useState } from 'react';
import { colors, spacing, typography } from '@/app/styles/pixelTheme';
import { ActivityOption, MentorId, KnowledgeDomain, ActivityDifficulty, LocationId } from '@/app/types';
import EnhancedTwitterActivity from './EnhancedTwitterActivity';

const DEMO_ACTIVITIES: ActivityOption[] = [
  {
    id: 'patient_case_review',
    title: 'Patient Case Review - Hepatocellular Carcinoma',
    description: 'Review treatment plans for Maria Rodriguez with Dr. Garcia',
    location: LocationId.CONFERENCE_ROOM,
    duration: 60,
    mentor: MentorId.GARCIA,
    domains: [KnowledgeDomain.TREATMENT_PLANNING],
    difficulty: ActivityDifficulty.MEDIUM,
  },
  {
    id: 'morning_rounds',
    title: 'Morning Rounds - Prostate Case',
    description: 'Join Dr. Garcia for morning patient rounds with James Thompson',
    location: LocationId.WARD,
    duration: 60,
    mentor: MentorId.GARCIA,
    domains: [KnowledgeDomain.RADIATION_THERAPY],
    difficulty: ActivityDifficulty.EASY,
  },
  {
    id: 'qa_protocol_review',
    title: 'QA Protocol Review - Breast Cancer',
    description: 'Review quality assurance protocols for Sarah Chen with Dr. Kapoor',
    location: LocationId.PHYSICS_OFFICE,
    duration: 60,
    mentor: MentorId.KAPOOR,
    domains: [KnowledgeDomain.DOSIMETRY],
    difficulty: ActivityDifficulty.MEDIUM,
  },
  {
    id: 'treatment_planning_session',
    title: 'Treatment Planning - Lung Cancer',
    description: 'Work with Dr. Kapoor on Robert Davis treatment plan',
    location: LocationId.PHYSICS_OFFICE,
    duration: 60,
    mentor: MentorId.KAPOOR,
    domains: [KnowledgeDomain.TREATMENT_PLANNING, KnowledgeDomain.DOSIMETRY],
    difficulty: ActivityDifficulty.MEDIUM,
  }
];

export default function PatientTransitionDemo() {
  const [selectedActivity, setSelectedActivity] = useState<ActivityOption | null>(null);
  const [showDemo, setShowDemo] = useState(false);

  const handleActivitySelect = (activity: ActivityOption) => {
    setSelectedActivity(activity);
    setShowDemo(true);
  };

  const handleDemoComplete = () => {
    setShowDemo(false);
    setSelectedActivity(null);
  };

  if (showDemo && selectedActivity) {
    return (
      <EnhancedTwitterActivity
        currentActivity={selectedActivity}
        onComplete={handleDemoComplete}
      />
    );
  }

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: typography.fontFamily.pixel,
      color: colors.text,
      padding: spacing.xl
    }}>
      {/* Title */}
      <div style={{
        textAlign: 'center',
        marginBottom: spacing.xl
      }}>
        <h1 style={{
          fontSize: typography.fontSize.xxl,
          fontWeight: 'bold',
          margin: 0,
          marginBottom: spacing.md,
          color: colors.highlight,
          textShadow: '0 0 10px rgba(255, 215, 0, 0.3)'
        }}>
          🏥 Patient Case Transition Demo
        </h1>
        <p style={{
          fontSize: typography.fontSize.lg,
          color: colors.textDim,
          margin: 0,
          lineHeight: '1.4'
        }}>
          Experience the Pokemon-style educational transitions!<br/>
          Select a patient case activity to see the establishing animation.
        </p>
      </div>

      {/* Activity Selection Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
        gap: spacing.lg,
        maxWidth: '1200px',
        width: '100%'
      }}>
        {DEMO_ACTIVITIES.map((activity) => (
          <button
            key={activity.id}
            onClick={() => handleActivitySelect(activity)}
            style={{
              backgroundColor: colors.background,
              border: `3px solid ${colors.border}`,
              borderRadius: spacing.md,
              padding: spacing.lg,
              textAlign: 'left',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              fontFamily: typography.fontFamily.pixel,
              ':hover': {
                transform: 'translateY(-2px)',
                boxShadow: `0 6px 0 ${colors.border}, 0 8px 20px rgba(0,0,0,0.3)`
              }
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = `0 6px 0 ${colors.border}, 0 8px 20px rgba(0,0,0,0.3)`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = `0 4px 0 ${colors.border}`;
            }}
          >
            {/* Activity Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: spacing.md
            }}>
              <div style={{
                fontSize: typography.fontSize.sm,
                color: colors.highlight,
                fontWeight: 'bold'
              }}>
                {activity.mentor === MentorId.GARCIA ? 'Dr. Garcia' :
                 activity.mentor === MentorId.KAPOOR ? 'Dr. Kapoor' :
                 activity.mentor === MentorId.QUINN ? 'Dr. Quinn' : 'Jesse'}
              </div>
              <div style={{
                fontSize: typography.fontSize.xs,
                color: colors.textDim,
                backgroundColor: colors.backgroundAlt,
                padding: `${spacing.xs} ${spacing.sm}`,
                borderRadius: spacing.xs,
                border: `1px solid ${colors.border}`
              }}>
                {activity.difficulty === ActivityDifficulty.EASY ? '★☆☆' :
                 activity.difficulty === ActivityDifficulty.MEDIUM ? '★★☆' : '★★★'}
              </div>
            </div>

            {/* Activity Title */}
            <h3 style={{
              fontSize: typography.fontSize.lg,
              fontWeight: 'bold',
              margin: 0,
              marginBottom: spacing.sm,
              color: colors.text,
              lineHeight: '1.3'
            }}>
              {activity.title}
            </h3>

            {/* Activity Description */}
            <p style={{
              fontSize: typography.fontSize.sm,
              color: colors.textDim,
              margin: 0,
              marginBottom: spacing.md,
              lineHeight: '1.4'
            }}>
              {activity.description}
            </p>

            {/* Activity Domains */}
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: spacing.xs
            }}>
              {activity.domains.map((domain) => (
                <span
                  key={domain}
                  style={{
                    fontSize: typography.fontSize.xs,
                    backgroundColor: 'rgba(67, 215, 230, 0.2)',
                    color: colors.insight,
                    padding: `${spacing.xs} ${spacing.sm}`,
                    borderRadius: spacing.xs,
                    border: `1px solid ${colors.insight}`
                  }}
                >
                  {domain.replace(/_/g, ' ')}
                </span>
              ))}
            </div>

            {/* Call to Action */}
            <div style={{
              marginTop: spacing.md,
              fontSize: typography.fontSize.sm,
              color: colors.active,
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: spacing.xs
            }}>
              <span>▶</span>
              Start Patient Case Challenge
            </div>
          </button>
        ))}
      </div>

      {/* Info Box */}
      <div style={{
        marginTop: spacing.xl,
        backgroundColor: 'rgba(0,0,0,0.6)',
        border: `2px solid ${colors.border}`,
        borderRadius: spacing.md,
        padding: spacing.lg,
        maxWidth: '600px',
        textAlign: 'center'
      }}>
        <h4 style={{
          fontSize: typography.fontSize.lg,
          fontWeight: 'bold',
          margin: 0,
          marginBottom: spacing.sm,
          color: colors.highlight
        }}>
          🎮 What You'll Experience
        </h4>
        <ul style={{
          fontSize: typography.fontSize.sm,
          color: colors.textDim,
          margin: 0,
          paddingLeft: spacing.lg,
          textAlign: 'left',
          lineHeight: '1.6'
        }}>
          <li>Patient information card dramatically fades in center screen</li>
          <li>Medical details with color-coded sections for easy scanning</li>
          <li>Smooth slide animation to persistent side panel</li>
          <li>Mentor entry with contextual dialogue about the patient</li>
          <li>Seamless transition into Twitter-style educational interface</li>
        </ul>
      </div>
    </div>
  );
} 