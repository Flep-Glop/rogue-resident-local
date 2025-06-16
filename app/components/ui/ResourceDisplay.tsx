'use client';

import React from 'react';
import styled from 'styled-components';
import { useResourceStore } from '@/app/store/resourceStore';
import MomentumIndicator from './MomentumIndicator';
import InsightIndicator from './InsightIndicator';
import { colors, spacing, mixins } from '@/app/styles/pixelTheme';

const ResourceContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${spacing.sm};
  width: 100%;
  max-width: 240px;
`;

const StarPointsDisplay = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${spacing.xs} ${spacing.sm};
  background-color: ${colors.backgroundDark};
  border: 1px solid ${colors.borderMedium};
  border-radius: 4px;
  ${mixins.pixelBorder}
`;

const StarPointsLabel = styled.span`
  font-size: 10px;
  color: ${colors.textSecondary};
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const StarPointsValue = styled.span`
  font-size: 12px;
  font-weight: 500;
  color: ${colors.starPoints};
`;

export function ResourceDisplay() {
  const { starPoints } = useResourceStore();
  
  return (
    <ResourceContainer>
      <MomentumIndicator />
      <InsightIndicator />
      <StarPointsDisplay>
        <StarPointsLabel>Star Points</StarPointsLabel>
        <StarPointsValue>✨ {starPoints}</StarPointsValue>
      </StarPointsDisplay>
    </ResourceContainer>
  );
}

export default ResourceDisplay; 