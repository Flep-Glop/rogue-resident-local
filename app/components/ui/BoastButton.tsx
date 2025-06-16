'use client';

import React, { useState, useEffect } from 'react';
import { useResourceStore } from '@/app/store/resourceStore';
import { GameEventType } from '@/app/types';
import { centralEventBus, useEventSubscription } from '@/app/core/events/CentralEventBus';
import { colors, animation, mixins } from '@/app/styles/pixelTheme';

interface BoastButtonProps {
  onActivate?: () => void; // Optional callback for when Boast is activated
}

export function BoastButton({ onActivate }: BoastButtonProps) {
  const { momentum, insight, canBoast, activateBoast } = useResourceStore();
  const [isAnimating, setIsAnimating] = useState(false);
  const [wasJustActivated, setWasJustActivated] = useState(false);
  
  // Use the canBoast method directly from ResourceStore instead of checking conditions here
  const isBoastAvailable = canBoast();
  
  // Reset animation state when boast is no longer available
  useEffect(() => {
    if (!isBoastAvailable) {
      setIsAnimating(false);
      setWasJustActivated(false);
    }
  }, [isBoastAvailable]);
  
  const handleBoastClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (!isBoastAvailable || wasJustActivated) return;
    
    console.log("Attempting to activate boast");
    
    // Start animation
    setIsAnimating(true);
    setWasJustActivated(true);
    
    // Activate boast
    const success = activateBoast('boast_button_click');
    
    // Create click position for particles effect
    const clickPosition = {
      x: event.clientX,
      y: event.clientY
    };
    
    // Dispatch event for particle system to handle
    if (success) {
      console.log("Boast activated successfully, dispatching particles event");
      
      // Particle effect event - use the correct dispatch format
      centralEventBus.dispatch(
        GameEventType.SPECIAL_EVENT_TRIGGERED, // Use a standard event type
        {
          effectType: 'PARTICLE_EFFECT',
          effectDetails: {
            type: 'boast',
            origin: clickPosition,
            color: '#f59e0b', // Amber color
            intensity: 3,
            duration: 1000
          }
        }, 
        'boast_button.handleBoastClick'
      );
      
      // Call the onActivate callback if provided
      if (onActivate) {
        console.log("Calling onActivate callback to trigger activity-specific boast effects");
        onActivate();
      }
    }
    
    // Reset animation state after completion
    setTimeout(() => {
      setIsAnimating(false);
      
      // Allow re-activation after a delay
      setTimeout(() => {
        setWasJustActivated(false);
      }, 1000);
    }, 500);
  };
  
  return (
    <button
      className="boast-button"
      onClick={handleBoastClick}
      disabled={!isBoastAvailable || wasJustActivated}
      style={{
        padding: '8px 16px',
        borderRadius: '4px',
        backgroundColor: isBoastAvailable 
          ? colors.accentPrimary
          : colors.backgroundMuted,
        color: isBoastAvailable
          ? colors.textLight
          : colors.textMuted,
        cursor: isBoastAvailable && !wasJustActivated
          ? 'pointer'
          : 'not-allowed',
        opacity: isBoastAvailable ? 1 : 0.5,
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.2s ease',
        animation: isAnimating ? 'boast-pulse 0.5s ease-out' : 'none',
        boxShadow: isAnimating 
          ? '0 0 20px rgba(251, 191, 36, 0.7)' 
          : 'none',
        ...mixins.pixelBorder
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ marginRight: '8px' }}>BOAST</span>
        <span style={{ 
          fontSize: '10px',
          padding: '2px 4px',
          borderRadius: '4px',
          backgroundColor: 'rgba(0,0,0,0.2)'
        }}>
          50 ◆
        </span>
      </div>
      
      <div style={{ 
        fontSize: '10px', 
        marginTop: '4px', 
        color: isBoastAvailable ? colors.textLight : colors.textMuted
      }}>
        {momentum < 3 
          ? 'Requires Level 3 Momentum' 
          : (insight < 50 
              ? 'Not enough Insight' 
              : 'Double rewards or nothing!')}
      </div>
      
      {/* CSS for animations */}
      <style jsx>{`
        @keyframes boast-pulse {
          0% { transform: scale(1); box-shadow: 0 0 0 rgba(251, 191, 36, 0); }
          50% { transform: scale(1.05); box-shadow: 0 0 20px rgba(251, 191, 36, 0.7); }
          100% { transform: scale(1); box-shadow: 0 0 0 rgba(251, 191, 36, 0); }
        }
      `}</style>
    </button>
  );
}

export default BoastButton; 