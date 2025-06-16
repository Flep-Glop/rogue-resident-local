'use client';

import React, { useState, useEffect } from 'react';
import { useResourceStore } from '@/app/store/resourceStore';
import { GameEventType } from '@/app/types';
import { useEventSubscription } from '@/app/core/events/CentralEventBus';
import { colors, animation, mixins } from '@/app/styles/pixelTheme';

interface InsightChangedPayload {
  previousValue: number;
  newValue: number;
  baseAmount: number;
  multiplier: number;
  actualAmount: number;
  source?: string;
}

export function InsightIndicator() {
  const { insight, insightMax } = useResourceStore();
  const [showAnimation, setShowAnimation] = useState(false);
  const [changeValue, setChangeValue] = useState(0);
  
  // Use the provided hook for event subscription
  const handleInsightChange = (event: any) => {
    if (!event.payload) return;
    
    const actualChange = event.payload.newValue - event.payload.previousValue;
    setChangeValue(actualChange);
    setShowAnimation(true);
    
    // Reset animation state after completion
    setTimeout(() => {
      setShowAnimation(false);
    }, 1000);
  };
  
  // Use the useEventSubscription hook to subscribe to insight events
  useEventSubscription(
    [GameEventType.INSIGHT_GAINED], 
    handleInsightChange
  );
  
  // Calculate percentage for progress bar
  const insightPercentage = Math.min(100, Math.round((insight / insightMax) * 100));
  
  return (
    <div className="insight-container" style={{
      position: 'relative',
      padding: '8px',
      borderRadius: '4px',
      backgroundColor: colors.backgroundDark,
      border: `1px solid ${colors.borderMedium}`,
      ...mixins.pixelBorder
    }}>
      <div className="insight-label" style={{
        fontSize: '10px',
        color: colors.textSecondary,
        marginBottom: '4px',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        display: 'flex',
        justifyContent: 'space-between'
      }}>
        <span>Insight</span>
        <span>{insight}/{insightMax}</span>
      </div>
      
      {/* Progress bar */}
      <div className="insight-bar-background" style={{
        width: '100%',
        height: '12px',
        backgroundColor: 'rgba(107, 114, 128, 0.2)',
        borderRadius: '4px',
        overflow: 'hidden'
      }}>
        <div className="insight-bar-fill" style={{
          width: `${insightPercentage}%`,
          height: '100%',
          backgroundColor: colors.insight,
          borderRadius: '4px',
          transition: 'width 0.3s ease',
          boxShadow: insightPercentage > 75 ? `0 0 8px ${colors.insight}` : 'none'
        }} />
      </div>
      
      {/* Animation for gain/loss */}
      {showAnimation && (
        <div style={{
          position: 'absolute',
          top: 0,
          right: 0,
          fontSize: '12px',
          fontWeight: 700,
          color: changeValue > 0 ? colors.insight : colors.error,
          animation: changeValue > 0 
            ? `${animation.floatUp} 1s ease-out forwards` 
            : `${animation.floatDown} 1s ease-out forwards`
        }}>
          {changeValue > 0 ? '+' : ''}{changeValue}
        </div>
      )}
    </div>
  );
}

export default InsightIndicator; 