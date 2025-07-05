'use client';

import React, { useState, useEffect } from 'react';
import { colors, spacing, typography, animation } from '@/app/styles/pixelTheme';
import { ActivityOption, MentorId } from '@/app/types';
import SpriteImage from './SpriteImage';
import { getPortraitCoordinates, getMediumPortraitSrc, getExpressionCoordinates, SPRITE_SHEETS, ExpressionType } from '@/app/utils/spriteMap';

interface PatientCaseTransitionProps {
  activity: ActivityOption;
  onTransitionComplete: () => void;
}

interface PatientInfo {
  name: string;
  age: number;
  gender: string;
  diagnosis: string;
  lesionDetails: string;
  additionalInfo: string[];
  photo?: string; // Could be added later for more realism
}

// Sample patient data - in real implementation, this would come from activity data
const SAMPLE_PATIENTS: Record<string, PatientInfo> = {
  'patient_case_review': {
    name: 'Maria Rodriguez',
    age: 67,
    gender: 'Female',
    diagnosis: 'Hepatocellular Carcinoma',
    lesionDetails: '4.2 cm lesion in right hepatic lobe, segment VI',
    additionalInfo: [
      'Recent weight loss: 8 lbs over 3 months',
      'Previous surgery: Cholecystectomy (2019)',
      'Comorbidities: Hypertension, Type 2 diabetes'
    ]
  },
  'morning_rounds': {
    name: 'James Thompson',
    age: 72,
    gender: 'Male',
    diagnosis: 'Prostate Adenocarcinoma (T2N0M0)',
    lesionDetails: 'Gleason 7 (3+4), PSA 12.4 ng/mL',
    additionalInfo: [
      'Stage II, intermediate risk',
      'Simulation completed yesterday',
      'Started hormone therapy 2 months ago'
    ]
  },
  'qa_protocol_review': {
    name: 'Sarah Chen',
    age: 54,
    gender: 'Female',
    diagnosis: 'Left Breast Cancer (T1N1M0)',
    lesionDetails: 'IDC, 2.1 cm with axillary lymph node involvement',
    additionalInfo: [
      'Post-lumpectomy radiation therapy',
      'ER+/PR+, HER2-',
      'Receiving concurrent chemotherapy'
    ]
  },
  'treatment_planning_session': {
    name: 'Robert Davis',
    age: 58,
    gender: 'Male',
    diagnosis: 'Lung Adenocarcinoma (T3N2M0)',
    lesionDetails: '5.8 cm RUL mass with mediastinal involvement',
    additionalInfo: [
      'Stage IIIA non-small cell lung cancer',
      'Concurrent chemoradiation planned',
      'Respiratory motion: 1.2 cm SI direction'
    ]
  }
};

const getMentorName = (mentorId?: MentorId): string => {
  switch (mentorId) {
    case MentorId.GARCIA: return 'Dr. Garcia';
    case MentorId.KAPOOR: return 'Dr. Kapoor';
    case MentorId.QUINN: return 'Dr. Quinn';
    case MentorId.JESSE: return 'Jesse';
    default: return 'Dr. Garcia';
  }
};

const getMentorSprite = (mentorId?: MentorId) => {
  const mentorToCharacterId: Record<MentorId, string> = {
    [MentorId.GARCIA]: 'garcia',
    [MentorId.KAPOOR]: 'kapoor',
    [MentorId.QUINN]: 'quinn',
    [MentorId.JESSE]: 'jesse',
  };
  
  if (!mentorId) return null;
  
  return {
    src: SPRITE_SHEETS.detailedPortraits,
    coordinates: getPortraitCoordinates(mentorToCharacterId[mentorId] as any, 'detailed')
  };
};

// Spinning Patient Icon Component
const SpinningPatientIcon: React.FC<{ size?: number }> = ({ size = 64 }) => {
  const [currentFrame, setCurrentFrame] = useState(0);
  const frameCount = 16;
  const frameSize = 16; // Each frame is 16x16 pixels
  const scaleFactor = size / frameSize;
  
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFrame(prev => (prev + 1) % frameCount);
    }, 150); // Slower animation - 150ms per frame for smoother rotation
    
    return () => clearInterval(interval);
  }, [frameCount]);
  
  return (
    <div style={{
      width: `${size}px`,
      height: `${size}px`,
      background: `url('/images/ui/patient-rotation.png') no-repeat`,
      backgroundPosition: `-${currentFrame * frameSize * scaleFactor}px 0px`,
      backgroundSize: `${frameCount * frameSize * scaleFactor}px ${size}px`,
      imageRendering: 'pixelated',
      border: `2px solid ${colors.border}`,
      borderRadius: spacing.xs,
      backgroundColor: colors.backgroundAlt
    }} />
  );
};

// Mentor Portrait Component with Expressions
const MentorPortrait: React.FC<{ 
  mentorId: MentorId, 
  expression?: ExpressionType,
  size?: number,
  useExpressions?: boolean
}> = ({ mentorId, expression = 'neutral', size = 80, useExpressions = false }) => {
  const mentorCharacterId = (() => {
    switch (mentorId) {
      case MentorId.GARCIA: return 'garcia';
      case MentorId.KAPOOR: return 'kapoor';
      case MentorId.QUINN: return 'quinn';
      case MentorId.JESSE: return 'jesse';
      default: return 'garcia';
    }
  })();

  // Use expression spritesheet for Garcia if available and requested
  const hasExpressionSheet = mentorCharacterId === 'garcia' && useExpressions;
  
  if (hasExpressionSheet) {
    const expressionCoords = getExpressionCoordinates(expression);
    const scale = size / 42; // Scale from 42px base size
    
    return (
      <div style={{
        width: `${size}px`,
        height: `${size}px`,
        border: `3px solid ${colors.border}`,
        borderRadius: spacing.sm,
        background: colors.backgroundAlt,
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: `0 4px 0 ${colors.border}, 0 6px 12px rgba(0,0,0,0.3)`,
        position: 'relative'
      }}>
        <div style={{
          width: '100%',
          height: '100%',
          backgroundImage: `url('/images/characters/portraits/garcia-animation.png')`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: `-${expressionCoords.x * scale}px 0px`,
          backgroundSize: `${15 * 42 * scale}px ${42 * scale}px`,
          imageRendering: 'pixelated'
        }} />
        {/* Expression indicator - more subtle for spritesheet version */}
        <div style={{
          position: 'absolute',
          top: '-2px',
          right: '-2px',
          width: '8px',
          height: '8px',
          backgroundColor: colors.highlight,
          borderRadius: '50%',
          border: `1px solid ${colors.border}`,
          opacity: 0.8
        }} />
      </div>
    );
  }

  // Fallback to static portrait for other mentors
  const portraitSrc = getMediumPortraitSrc(mentorCharacterId);
  
  return (
    <div style={{
      width: `${size}px`,
      height: `${size}px`,
      border: `3px solid ${colors.border}`,
      borderRadius: spacing.sm,
      background: colors.backgroundAlt,
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: `0 4px 0 ${colors.border}, 0 6px 12px rgba(0,0,0,0.3)`,
      position: 'relative'
    }}>
      <img 
        src={portraitSrc}
        alt={`${mentorCharacterId} portrait`}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          imageRendering: 'pixelated'
        }}
      />
      {/* Expression indicator */}
      <div style={{
        position: 'absolute',
        bottom: '-2px',
        right: '-2px',
        width: '12px',
        height: '12px',
        backgroundColor: expression === 'happy' ? '#22c55e' : 
                        expression === 'concerned' ? '#ef4444' :
                        expression === 'thinking' ? '#3b82f6' :
                        expression === 'encouraging' ? '#f59e0b' : colors.textDim,
        borderRadius: '50%',
        border: `1px solid ${colors.border}`
      }} />
    </div>
  );
};

export default function PatientCaseTransition({ activity, onTransitionComplete }: PatientCaseTransitionProps) {
  const [phase, setPhase] = useState<'intro' | 'patient-reveal' | 'slide-to-panel' | 'mentor-entry'>('intro');
  const [showMentorDialogue, setShowMentorDialogue] = useState(false);
  const [mentorExpression, setMentorExpression] = useState<ExpressionType>('neutral');
  
  // Get patient data (fallback to first patient if activity not found)
  const patientData = SAMPLE_PATIENTS[activity.id] || SAMPLE_PATIENTS['patient_case_review'];
  const mentorName = getMentorName(activity.mentor);
  const mentorSprite = getMentorSprite(activity.mentor);
  
  useEffect(() => {
    const sequence = async () => {
      // 1. Brief intro pause
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // 2. Patient card reveal (time to read patient info)
      setPhase('patient-reveal');
      setMentorExpression('focused');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // 3. Slide to side panel (smooth transition)
      setPhase('slide-to-panel');
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      // 4. Brief mentor context (just one bubble)
      setPhase('mentor-entry');
      setShowMentorDialogue(true);
      setMentorExpression('confident');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // 5. Complete transition - straight into challenge!
      onTransitionComplete();
    };
    
    sequence();
  }, [onTransitionComplete]);

  const getPatientCardStyle = () => {
    const baseStyle = {
      position: 'absolute' as const,
      backgroundColor: colors.background,
      border: `3px solid ${colors.border}`,
      borderRadius: spacing.md,
      padding: spacing.xl,
      boxShadow: `0 8px 0 ${colors.border}, 0 12px 20px rgba(0,0,0,0.5)`,
      fontFamily: typography.fontFamily.pixel,
      transition: `all 1.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)`,
      width: '480px',
      maxHeight: '600px',
      overflow: 'hidden'
    };

    switch (phase) {
      case 'intro':
        return {
          ...baseStyle,
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%) scale(0)',
          opacity: 0
        };
      case 'patient-reveal':
        return {
          ...baseStyle,
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%) scale(1)',
          opacity: 1,
          zIndex: 10
        };
      case 'slide-to-panel':
      case 'mentor-entry':
        return {
          ...baseStyle,
          top: '20px',
          right: '20px',
          transform: 'scale(0.85)',
          opacity: 0.95,
          zIndex: 5
        };
      default:
        return baseStyle;
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
      zIndex: 1000,
      overflow: 'hidden'
    }}>
      {/* Background medical overlay */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 
          'radial-gradient(circle at 30% 20%, rgba(59, 130, 246, 0.1) 0%, transparent 50%), ' +
          'radial-gradient(circle at 70% 80%, rgba(16, 185, 129, 0.08) 0%, transparent 50%)',
        opacity: phase === 'intro' ? 0 : 1,
        transition: 'opacity 1s ease-in-out'
      }} />

      {/* Title banner */}
      {phase !== 'intro' && (
        <div style={{
          position: 'absolute',
          top: '40px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: 'rgba(0,0,0,0.8)',
          border: `2px solid ${colors.border}`,
          borderRadius: spacing.sm,
          padding: `${spacing.sm} ${spacing.lg}`,
          fontFamily: typography.fontFamily.pixel,
          fontSize: typography.fontSize.xl,
          fontWeight: 'bold',
          color: colors.highlight,
          textAlign: 'center',
          animation: phase === 'patient-reveal' ? 'slideDown 0.8s ease-out' : 'none',
          zIndex: 8
        }}>
          🏥 PATIENT CASE CHALLENGE
        </div>
      )}

      {/* Patient Information Card */}
      <div style={getPatientCardStyle()}>
        {/* Patient Header with Mentor */}
        <div style={{
          borderBottom: `2px solid ${colors.border}`,
          paddingBottom: spacing.md,
          marginBottom: spacing.lg,
          display: 'flex',
          alignItems: 'center',
          gap: spacing.md
        }}>
          {/* Spinning Patient Icon */}
          <SpinningPatientIcon size={64} />
          
          {/* Patient Basic Info */}
          <div style={{ flex: 1 }}>
            <h2 style={{
              fontSize: typography.fontSize.xl,
              fontWeight: 'bold',
              margin: 0,
              color: colors.text,
              marginBottom: spacing.xs
            }}>
              {patientData.name}
            </h2>
            <div style={{
              fontSize: typography.fontSize.md,
              color: colors.textDim,
              display: 'flex',
              gap: spacing.md
            }}>
              <span>Age: {patientData.age}</span>
              <span>•</span>
              <span>{patientData.gender}</span>
            </div>
          </div>

          {/* Mentor Portrait */}
          {activity.mentor && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: spacing.xs
            }}>
              <MentorPortrait 
                mentorId={activity.mentor} 
                expression={mentorExpression}
                size={64}
                useExpressions={true}
              />
              <div style={{
                fontSize: typography.fontSize.xs,
                color: colors.textDim,
                fontWeight: 'bold'
              }}>
                {mentorName}
              </div>
            </div>
          )}
        </div>

        {/* Primary Case Info - Condensed */}
        <div style={{ marginBottom: spacing.lg }}>
          <h3 style={{
            fontSize: typography.fontSize.lg,
            fontWeight: 'bold',
            color: colors.highlight,
            margin: 0,
            marginBottom: spacing.sm,
            display: 'flex',
            alignItems: 'center',
            gap: spacing.xs
          }}>
            📋 Case Overview
          </h3>
          <div style={{
            backgroundColor: colors.backgroundAlt,
            border: `1px solid ${colors.border}`,
            borderRadius: spacing.xs,
            padding: spacing.md,
            fontSize: typography.fontSize.md,
            color: colors.text,
            lineHeight: '1.4'
          }}>
            <strong>{patientData.diagnosis}</strong>
            <br />
            <span style={{ color: colors.textDim, fontSize: typography.fontSize.sm }}>
              {patientData.lesionDetails}
            </span>
          </div>
        </div>

        {/* Key Notes - Simplified */}
        <div>
          <h3 style={{
            fontSize: typography.fontSize.lg,
            fontWeight: 'bold',
            color: colors.active,
            margin: 0,
            marginBottom: spacing.sm,
            display: 'flex',
            alignItems: 'center',
            gap: spacing.xs
          }}>
            💡 Key Notes
          </h3>
          <div style={{
            fontSize: typography.fontSize.sm,
            color: colors.textDim,
            lineHeight: '1.5'
          }}>
            {patientData.additionalInfo.slice(0, 2).map((info, index) => (
              <div key={index} style={{ 
                marginBottom: spacing.xs,
                padding: `${spacing.xs} ${spacing.sm}`,
                backgroundColor: 'rgba(67, 215, 230, 0.1)',
                border: `1px solid ${colors.insight}`,
                borderRadius: spacing.xs,
                fontSize: typography.fontSize.xs
              }}>
                • {info}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Brief Mentor Context - Twitter-style message preview */}
      {showMentorDialogue && (
        <div style={{
          position: 'absolute',
          bottom: '80px',
          left: '60px',
          right: phase === 'mentor-entry' ? '520px' : '60px', // Adjust for patient panel
          backgroundColor: '#3a3a4e',
          border: `2px solid ${colors.border}`,
          borderRadius: spacing.sm,
          padding: spacing.lg,
          display: 'flex',
          alignItems: 'center',
          gap: spacing.md,
          animation: 'slideUp 0.6s ease-out',
          zIndex: 9,
          boxShadow: `0 4px 0 ${colors.border}`,
          opacity: 0.95
        }}>
          {/* Small Mentor Portrait */}
          {mentorSprite && mentorSprite.src && mentorSprite.coordinates ? (
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: spacing.xs,
              overflow: 'hidden',
              background: colors.backgroundAlt,
              border: `1px solid ${colors.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <SpriteImage
                src={mentorSprite.src}
                coordinates={mentorSprite.coordinates}
                alt={mentorName}
                scale={2}
                pixelated={true}
              />
            </div>
          ) : (
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: spacing.xs,
              overflow: 'hidden',
              background: colors.backgroundAlt,
              border: `1px solid ${colors.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              fontSize: '24px'
            }}>
              👨‍⚕️
            </div>
          )}
          
          {/* Brief Context Message */}
          <div style={{ flex: 1 }}>
            <div style={{
              fontSize: typography.fontSize.xs,
              color: colors.textDim,
              marginBottom: spacing.xs,
              display: 'flex',
              alignItems: 'center',
              gap: spacing.xs
            }}>
              <span>{mentorName}</span>
              <span>•</span>
              <span>Now</span>
            </div>
            <div style={{
              fontSize: typography.fontSize.md,
              color: colors.text,
              lineHeight: '1.4'
            }}>
              Let's review {patientData.name}'s case. I'll guide you through the key clinical decisions...
            </div>
          </div>
        </div>
      )}

      {/* Transition Effect Overlay */}
      {phase === 'slide-to-panel' && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
          animation: 'pulse 1.2s ease-in-out',
          zIndex: 6
        }} />
      )}

      {/* Continue Prompt */}
      {phase === 'mentor-entry' && (
        <div style={{
          position: 'absolute',
          bottom: '20px',
          right: '20px',
          fontSize: typography.fontSize.sm,
          color: colors.active,
          animation: 'pulse 1.5s infinite',
          fontFamily: typography.fontFamily.pixel,
          fontWeight: 'bold'
        }}>
          ▶ Starting challenge...
        </div>
      )}

      <style jsx global>{`
        @keyframes slideDown {
          from { transform: translate(-50%, -100%); opacity: 0; }
          to { transform: translate(-50%, 0); opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0.3; }
        }
        @keyframes pulse {
          0% { opacity: 0; }
          50% { opacity: 1; }
          100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
} 