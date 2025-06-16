'use client';

import React, { useState, useEffect } from 'react';
import { useResourceStore } from '@/app/store/resourceStore';
import { GameEventType } from '@/app/types';
import { centralEventBus, useEventSubscription } from '@/app/core/events/CentralEventBus';
import { colors, animation, mixins } from '@/app/styles/pixelTheme';

interface MomentumChangedPayload {
  previousValue: number;
  newValue: number;
  change: number;
  source?: string;
}

export function MomentumIndicator() {
  const { momentum, momentumMax, getInsightMultiplier, _getMomentumLevel } = useResourceStore();
  const [showAnimation, setShowAnimation] = useState(false);
  const [changeValue, setChangeValue] = useState(0);
  const [bonusText, setBonusText] = useState('');
  
  // Initialize bonus text based on current momentum
  useEffect(() => {
    updateBonusText();
  }, [momentum]);
  
  // Update bonus text when momentum changes
  const updateBonusText = () => {
    const multiplier = getInsightMultiplier();
    if (multiplier > 1) {
      const percentIncrease = Math.round((multiplier - 1) * 100);
      setBonusText(`+${percentIncrease}% Insight`);
    } else {
      setBonusText('');
    }
  };
  
  // Use the provided hook for event subscription
  const handleMomentumChange = (event: any) => {
    if (!event.payload) return;
    
    setChangeValue(event.payload.change);
    setShowAnimation(true);
    updateBonusText();
    
    // Reset animation state after completion
    setTimeout(() => {
      setShowAnimation(false);
    }, 1000);
  };
  
  // Use the useEventSubscription hook to subscribe to momentum events
  useEventSubscription(
    [GameEventType.MOMENTUM_GAINED, GameEventType.MOMENTUM_RESET, GameEventType.MOMENTUM_CHANGED], 
    handleMomentumChange
  );
  
  // Get current momentum level
  const momentumLevel = _getMomentumLevel();

  // Define level-specific colors
  const getLevelColors = (level: number, index: number, active: boolean) => {
    if (!active) {
      return {
        bg: 'rgba(107, 114, 128, 0.2)',
        color: 'rgba(107, 114, 128, 0.4)',
        shadow: 'none',
        border: 'none'
      };
    }
    
    switch(level) {
      case 1:
        return {
          bg: 'rgba(251, 191, 36, 0.3)',
          color: 'rgba(251, 191, 36, 1)',
          shadow: '0 0 5px rgba(251, 191, 36, 0.7)',
          border: 'none'
        };
      case 2:
        return {
          bg: 'rgba(217, 119, 6, 0.3)',
          color: 'rgba(217, 119, 6, 1)',
          shadow: '0 0 5px rgba(217, 119, 6, 0.7)',
          border: 'none'
        };
      case 3:
        return {
          bg: 'rgba(234, 88, 12, 0.3)',
          color: 'rgba(234, 88, 12, 1)',
          shadow: '0 0 6px rgba(234, 88, 12, 0.8)',
          border: '1px solid rgba(234, 88, 12, 0.7)'
        };
      default:
        return {
          bg: 'rgba(251, 191, 36, 0.3)',
          color: 'rgba(251, 191, 36, 1)',
          shadow: '0 0 5px rgba(251, 191, 36, 0.7)',
          border: 'none'
        };
    }
  };

  // Get emoji for each momentum level
  const getLevelEmoji = (level: number) => {
    switch(level) {
      case 1: return '⚡';
      case 2: return '🔥';
      case 3: return '⭐';
      default: return '⚡';
    }
  };
  
  return (
    <div className="momentum-container" style={{
      position: 'relative',
      padding: '8px',
      borderRadius: '4px',
      backgroundColor: colors.backgroundDark,
      border: `1px solid ${colors.borderMedium}`,
      ...mixins.pixelBorder
    }}>
      <div className="momentum-label" style={{
        fontSize: '10px',
        color: colors.textSecondary,
        marginBottom: '4px',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <span>Momentum</span>
        <span style={{
          fontSize: '9px',
          color: momentum >= 2 ? colors.highlight : colors.textTertiary,
          fontWeight: momentum >= 2 ? 700 : 400
        }}>
          {momentum >= 3 ? 'BOAST UNLOCKED!' : momentum >= 2 ? 'BONUS ACTIVE!' : ''}
        </span>
      </div>
      
      <div className="flex items-center space-x-1 momentum-indicator">
        {/* Render Momentum Pips */}
        {Array.from({ length: momentumMax }).map((_, index) => {
          const level = index + 1;
          const active = index < momentum;
          const colors = getLevelColors(level, index, active);
          const emoji = getLevelEmoji(level);
          
          return (
            <div 
              key={`momentum-${index}`}
              style={{
                width: '24px',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                transition: 'all 0.3s ease',
                backgroundColor: colors.bg,
                color: colors.color,
                textShadow: colors.shadow,
                border: colors.border,
                animation: showAnimation && index === momentum - 1 && changeValue > 0 
                  ? `${animation.pulse} 0.5s ease-out` 
                  : 'none',
                transform: active ? 'scale(1.1)' : 'scale(1)'
              }}
            >
              {emoji}
            </div>
          );
        })}
      </div>
      
      {/* Level indicator */}
      <div className="momentum-level" style={{
        fontSize: '12px',
        fontWeight: 500,
        marginTop: '4px',
        color: momentumLevel === 1 ? colors.textPrimary : 
               momentumLevel === 2 ? 'rgba(217, 119, 6, 1)' : 
               'rgba(234, 88, 12, 1)',
        textShadow: momentumLevel > 1 ? `0 0 3px rgba(234, 88, 12, 0.4)` : 'none'
      }}>
        Level {momentum} {momentumLevel === 3 ? '(MAX)' : ''}
      </div>
      
      {/* Bonus indicator */}
      {bonusText && (
        <div className="momentum-bonus" style={{
          fontSize: '10px',
          fontWeight: 500,
          color: momentumLevel === 2 ? 'rgba(217, 119, 6, 1)' : 
                 momentumLevel === 3 ? 'rgba(234, 88, 12, 1)' : 
                 colors.highlight,
          marginTop: '2px',
          display: 'flex',
          alignItems: 'center'
        }}>
          <span style={{marginRight: '2px'}}>
            {momentumLevel === 3 ? '🚀' : momentumLevel === 2 ? '💫' : ''}
          </span>
          {bonusText}
        </div>
      )}
      
      {/* Animation for gain/loss */}
      {showAnimation && (
        <div style={{
          position: 'absolute',
          top: 0,
          right: 0,
          fontSize: '12px',
          fontWeight: 700,
          color: changeValue > 0 ? colors.highlight : colors.error,
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

// Animation keyframes (fallback if pixelAnimations.ts is not imported)
const animationStyle = `
@keyframes momentum-pulse {
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.3); opacity: 0.8; }
  100% { transform: scale(1); opacity: 1; }
}

@keyframes float-up {
  0% { opacity: 1; transform: translateY(0); }
  100% { opacity: 0; transform: translateY(-20px); }
}

@keyframes float-down {
  0% { opacity: 1; transform: translateY(0); }
  100% { opacity: 0; transform: translateY(20px); }
}
`;

export default MomentumIndicator; 