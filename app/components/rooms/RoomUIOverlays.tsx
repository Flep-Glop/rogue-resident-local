'use client';

import React from 'react';
import styled from 'styled-components';

// Reuse existing styled components but with room-specific data
const RoomOverlay = styled.div<{ $roomType: string }>`
  position: absolute;
  top: 20px;
  right: 20px;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.8);
  border-radius: 12px;
  color: white;
  font-family: 'Courier New', monospace;
  min-width: 200px;
  backdrop-filter: blur(10px);
`;

const StatusGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
  margin-top: 0.5rem;
`;

const StatusItem = styled.div<{ $color: string }>`
  display: flex;
  align-items: center;
  font-size: 0.9rem;
  
  &::before {
    content: '■';
    color: ${props => props.$color};
    margin-right: 0.5rem;
  }
`;

// Room-specific data configurations (no new assets needed!)
const roomConfigs = {
  'dosimetry-lab': {
    title: 'DOSIMETRY LAB',
    primaryMetric: 'Precision',
    secondaryMetric: 'Calibration',
    statusItems: [
      { label: 'Ion Chamber', value: '2.1% ±0.05', color: '#10B981' },
      { label: 'Electrometer', value: 'STABLE', color: '#10B981' },
      { label: 'Temperature', value: '22.1°C', color: '#F59E0B' },
      { label: 'Pressure', value: '101.3 kPa', color: '#10B981' }
    ],
    ambientParticles: 'precision', // Reuse existing particle system
    soundProfile: 'laboratory' // Just a string flag for future audio
  },
  
  'linac-1': {
    title: 'LINAC ROOM 1',
    primaryMetric: 'Safety',
    secondaryMetric: 'Positioning',
    statusItems: [
      { label: 'Beam Status', value: 'READY', color: '#10B981' },
      { label: 'Interlocks', value: 'SECURE', color: '#10B981' },
      { label: 'Patient Setup', value: '98.2%', color: '#10B981' },
      { label: 'Imaging', value: 'CBCT OK', color: '#F59E0B' }
    ],
    ambientParticles: 'energy',
    soundProfile: 'clinical'
  },

  'physics-office': {
    title: 'PHYSICS OFFICE',
    primaryMetric: 'Planning',
    secondaryMetric: 'Analysis',
    statusItems: [
      { label: 'TPS System', value: 'ONLINE', color: '#10B981' },
      { label: 'Dose Calc', value: 'RUNNING', color: '#F59E0B' },
      { label: 'QA Review', value: '3 PENDING', color: '#EF4444' },
      { label: 'Network', value: '99.9%', color: '#10B981' }
    ],
    ambientParticles: 'insight',
    soundProfile: 'office'
  },

  'simulation-suite': {
    title: 'SIMULATION SUITE',
    primaryMetric: 'Modeling',
    secondaryMetric: 'Validation',
    statusItems: [
      { label: 'Monte Carlo', value: 'CALC...', color: '#F59E0B' },
      { label: 'Phantoms', value: '4 LOADED', color: '#10B981' },
      { label: 'Scenarios', value: '12 READY', color: '#10B981' },
      { label: 'GPU Usage', value: '87%', color: '#EF4444' }
    ],
    ambientParticles: 'simulation',
    soundProfile: 'technical'
  }
};

interface RoomUIOverlayProps {
  roomId: string;
  currentProgress?: number;
  isActive?: boolean;
}

export default function RoomUIOverlay({ roomId, currentProgress = 0, isActive = true }: RoomUIOverlayProps) {
  const config = roomConfigs[roomId as keyof typeof roomConfigs];
  
  if (!config) return null;

  return (
    <RoomOverlay $roomType={roomId}>
      <div style={{ 
        fontWeight: 'bold', 
        fontSize: '1.1rem', 
        marginBottom: '0.5rem',
        borderBottom: '1px solid rgba(255,255,255,0.3)',
        paddingBottom: '0.5rem'
      }}>
        {config.title}
      </div>
      
      <StatusGrid>
        {config.statusItems.map((item, index) => (
          <StatusItem key={index} $color={item.color}>
            <span style={{ fontSize: '0.8rem' }}>
              {item.label}: {item.value}
            </span>
          </StatusItem>
        ))}
      </StatusGrid>
      
      {currentProgress > 0 && (
        <div style={{ 
          marginTop: '1rem', 
          padding: '0.5rem 0',
          borderTop: '1px solid rgba(255,255,255,0.3)' 
        }}>
          <div style={{ fontSize: '0.9rem', marginBottom: '0.25rem' }}>
            Session Progress: {Math.round(currentProgress)}%
          </div>
          <div style={{ 
            width: '100%', 
            height: '4px', 
            background: 'rgba(255,255,255,0.2)', 
            borderRadius: '2px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${currentProgress}%`,
              height: '100%',
              background: '#10B981',
              transition: 'width 0.3s ease'
            }} />
          </div>
        </div>
      )}
    </RoomOverlay>
  );
}

// Enhanced question overlay that changes per room
export const QuestionOverlay = styled.div<{ $roomType: string }>`
  ${props => {
    switch (props.$roomType) {
      case 'dosimetry-lab':
        return `
          background: linear-gradient(135deg, #EC4899 0%, #F472B6 50%, #1e1b4b 100%);
          border: 2px solid #EC4899;
        `;
      case 'linac-1':
        return `
          background: linear-gradient(135deg, #10B981 0%, #34D399 50%, #1e1b4b 100%);
          border: 2px solid #10B981;
        `;
      case 'linac-2':
        return `
          background: linear-gradient(135deg, #F59E0B 0%, #FBBF24 50%, #1e1b4b 100%);
          border: 2px solid #F59E0B;
        `;
      case 'physics-office':
        return `
          background: linear-gradient(135deg, #3B82F6 0%, #60A5FA 50%, #1e1b4b 100%);
          border: 2px solid #3B82F6;
        `;
      case 'simulation-suite':
        return `
          background: linear-gradient(135deg, #F59E0B 0%, #FBBF24 50%, #1e1b4b 100%);
          border: 2px solid #F59E0B;
        `;
      default:
        return `
          background: linear-gradient(135deg, #6B7280 0%, #9CA3AF 50%, #1e1b4b 100%);
          border: 2px solid #6B7280;
        `;
    }
  }}
  
  padding: 2rem;
  border-radius: 16px;
  color: white;
  backdrop-filter: blur(10px);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
`; 