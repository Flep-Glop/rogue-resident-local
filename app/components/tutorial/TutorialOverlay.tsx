'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import styled, { css, keyframes } from 'styled-components';
import { 
  useTutorialStore, 
  tutorialSelectors, 
  TutorialOverlay as TutorialOverlayData,
  TutorialOverlayType 
} from '@/app/store/tutorialStore';

// Animation keyframes for smooth tutorial overlays
const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const slideInFromRight = keyframes`
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
`;

const pulse = keyframes`
  0%, 100% {
    transform: scale(1);
    opacity: 0.8;
  }
  50% {
    transform: scale(1.05);
    opacity: 1;
  }
`;

const spotlight = keyframes`
  0% {
    box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.8);
  }
  70% {
    box-shadow: 0 0 0 20px rgba(59, 130, 246, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(59, 130, 246, 0);
  }
`;

// Main overlay container that covers the screen
const OverlayContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  pointer-events: none; /* Allow clicks through unless specifically needed */
  
  /* Subtle dark overlay for modals */
  &.modal-active {
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(2px);
    pointer-events: all;
  }
`;

// Individual overlay components with different styles based on type
const OverlayContent = styled.div<{ 
  $type: TutorialOverlayType; 
  $position?: { x: number; y: number };
  $targetElement?: string;
}>`
  position: absolute;
  pointer-events: all;
  animation: ${fadeIn} 0.3s ease-out;
  
  ${({ $type, $position }) => {
    switch ($type) {
      case 'tooltip':
        return css`
          left: ${$position?.x || 50}px;
          top: ${$position?.y || 50}px;
          background: rgba(15, 23, 42, 0.95);
          border: 2px solid rgba(59, 130, 246, 0.8);
          border-radius: 8px;
          padding: 12px 16px;
          max-width: 300px;
          backdrop-filter: blur(10px);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
        `;
        
      case 'spotlight':
        return css`
          left: ${$position?.x || 50}px;
          top: ${$position?.y || 50}px;
          background: rgba(15, 23, 42, 0.9);
          border: 2px solid rgba(255, 215, 0, 0.8);
          border-radius: 12px;
          padding: 16px 20px;
          max-width: 350px;
          animation: ${pulse} 2s ease-in-out infinite;
          box-shadow: 
            0 0 20px rgba(255, 215, 0, 0.3),
            0 8px 32px rgba(0, 0, 0, 0.5);
        `;
        
      case 'modal':
        return css`
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          background: rgba(15, 23, 42, 0.98);
          border: 3px solid rgba(124, 58, 237, 0.8);
          border-radius: 16px;
          padding: 24px 32px;
          max-width: 500px;
          width: 90%;
          backdrop-filter: blur(15px);
          box-shadow: 0 16px 64px rgba(0, 0, 0, 0.6);
        `;
        
      case 'guided_interaction':
        return css`
          left: ${$position?.x || 50}px;
          top: ${$position?.y || 50}px;
          background: rgba(16, 185, 129, 0.95);
          border: 2px solid rgba(255, 255, 255, 0.9);
          border-radius: 10px;
          padding: 16px 20px;
          max-width: 400px;
          animation: ${slideInFromRight} 0.4s ease-out;
          box-shadow: 0 12px 40px rgba(16, 185, 129, 0.3);
        `;
        
      case 'progress_indicator':
        return css`
          top: 20px;
          right: 20px;
          background: rgba(15, 23, 42, 0.9);
          border: 2px solid rgba(59, 130, 246, 0.6);
          border-radius: 12px;
          padding: 12px 16px;
          min-width: 200px;
          backdrop-filter: blur(8px);
        `;
        
      default:
        return css`
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          background: rgba(15, 23, 42, 0.9);
          border: 2px solid rgba(124, 58, 237, 0.6);
          border-radius: 8px;
          padding: 16px 20px;
        `;
    }
  }}
`;

const OverlayTitle = styled.h3<{ $type: TutorialOverlayType }>`
  margin: 0 0 8px 0;
  font-size: ${({ $type }) => $type === 'modal' ? '20px' : '16px'};
  font-weight: bold;
  color: ${({ $type }) => {
    switch ($type) {
      case 'spotlight': return '#FFD700';
      case 'guided_interaction': return '#FFFFFF';
      case 'modal': return '#A855F7';
      default: return '#3B82F6';
    }
  }};
  line-height: 1.2;
`;

// Styled component for highlighting system words
const SystemWord = styled.span<{ $type: TutorialOverlayType }>`
  color: ${({ $type }) => {
    switch ($type) {
      case 'spotlight': return '#FFA500'; // Orange for spotlight
      case 'guided_interaction': return '#90EE90'; // Light green for guided
      case 'modal': return '#FF69B4'; // Pink for modal
      default: return '#00FFFF'; // Cyan for tooltip/default
    }
  }};
  font-weight: bold;
  text-shadow: 0 0 2px currentColor;
`;

// System words to highlight
const SYSTEM_WORDS = [
  'activity', 'activities', 
  'ability', 'abilities',
  'card', 'cards',
  'star', 'stars',
  'constellation',
  'journal',
  'mentor', 'mentors',
  'room', 'rooms',
  'insight', 'insights',
  'points', 'SP', 'IP',
  'system',
  'interface',
  'overlay', 'overlays'
];

// Utility function to parse and highlight system words
function parseContentWithHighlights(content: string, overlayType: TutorialOverlayType): React.ReactNode {
  // Create regex pattern for system words (case insensitive, word boundaries)
  const pattern = new RegExp(`\\b(${SYSTEM_WORDS.join('|')})\\b`, 'gi');
  
  const parts = content.split(pattern);
  
  return parts.map((part, index) => {
    const isSystemWord = SYSTEM_WORDS.some(word => 
      word.toLowerCase() === part.toLowerCase()
    );
    
    if (isSystemWord) {
      return (
        <SystemWord key={index} $type={overlayType}>
          {part}
        </SystemWord>
      );
    }
    
    return part;
  });
}

const OverlayContent2 = styled.p<{ $type: TutorialOverlayType }>`
  margin: 0;
  font-size: ${({ $type }) => $type === 'modal' ? '16px' : '14px'};
  color: ${({ $type }) => $type === 'guided_interaction' ? '#FFFFFF' : '#E2E8F0'};
  line-height: 1.4;
`;

const DismissButton = styled.button<{ $type: TutorialOverlayType }>`
  margin-top: 12px;
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  background: ${({ $type }) => {
    switch ($type) {
      case 'spotlight': return '#FFD700';
      case 'guided_interaction': return '#FFFFFF';
      case 'modal': return '#A855F7';
      default: return '#3B82F6';
    }
  }};
  color: ${({ $type }) => $type === 'guided_interaction' ? '#047857' : '#FFFFFF'};
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }
  
  &:active {
    transform: translateY(0);
  }
`;

const ProgressBar = styled.div<{ $progress: number }>`
  width: 100%;
  height: 6px;
  background: rgba(59, 130, 246, 0.3);
  border-radius: 3px;
  margin-top: 8px;
  overflow: hidden;
  
  &::after {
    content: '';
    display: block;
    height: 100%;
    width: ${({ $progress }) => $progress}%;
    background: linear-gradient(90deg, #3B82F6, #8B5CF6);
    border-radius: 3px;
    transition: width 0.3s ease;
  }
`;

const ProgressText = styled.div`
  font-size: 12px;
  color: #94A3B8;
  margin-top: 4px;
  text-align: center;
`;

// Spotlight highlighting specific elements
const SpotlightHighlight = styled.div<{ $targetSelector: string }>`
  position: absolute;
  pointer-events: none;
  border: 3px solid #FFD700;
  border-radius: 8px;
  animation: ${spotlight} 2s ease-in-out infinite;
  z-index: 999;
`;

// Individual overlay component
interface TutorialOverlayProps {
  overlay: TutorialOverlayData;
  onDismiss: (id: string) => void;
}

const TutorialOverlayComponent: React.FC<TutorialOverlayProps> = ({ overlay, onDismiss }) => {
  const [autoAdvanceTimer, setAutoAdvanceTimer] = useState<NodeJS.Timeout | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Stabilize object dependencies to prevent unnecessary re-renders
  const stablePosition = useMemo(() => overlay.position, [overlay.position?.x, overlay.position?.y]);
  const stableActionRequired = useMemo(() => overlay.actionRequired, [overlay.actionRequired?.type, overlay.actionRequired?.target]);

  // Log when overlay component mounts - use stable dependencies
  useEffect(() => {
    console.log(`🚀 [TUTORIAL RENDER] Overlay component mounted: "${overlay.title}" (${overlay.type}) - ID: ${overlay.id}`);
    
    if (stablePosition) {
      console.log(`📍 [TUTORIAL RENDER] Overlay positioned at: x=${stablePosition.x}, y=${stablePosition.y}`);
    }
    
    if (overlay.targetElement) {
      console.log(`🎯 [TUTORIAL RENDER] Overlay targets: ${overlay.targetElement}`);
    }
    
    return () => {
      console.log(`🔚 [TUTORIAL RENDER] Overlay component unmounted: "${overlay.title}" (${overlay.type})`);
    };
  }, [overlay.id, overlay.title, overlay.type, stablePosition, overlay.targetElement]);

  // Handle auto-advance timer - use stable dependencies
  useEffect(() => {
    if (overlay.autoAdvance && overlay.autoAdvance > 0) {
      console.log(`⏰ [TUTORIAL RENDER] Starting auto-advance timer: ${overlay.autoAdvance}s for overlay "${overlay.title}"`);
      
      const timer = setTimeout(() => {
        console.log(`⏰ [TUTORIAL RENDER] Auto-advance timer fired for overlay "${overlay.title}"`);
        onDismiss(overlay.id);
      }, overlay.autoAdvance * 1000);
      
      setAutoAdvanceTimer(timer);
      
      return () => {
        console.log(`⏰ [TUTORIAL RENDER] Auto-advance timer cleared for overlay "${overlay.title}"`);
        clearTimeout(timer);
      };
    }
  }, [overlay.autoAdvance, overlay.id, onDismiss]);

  // Handle action required - use stable dependencies
  useEffect(() => {
    if (stableActionRequired) {
      const { type, target } = stableActionRequired;
      console.log(`🎮 [TUTORIAL RENDER] Setting up action listener: ${type} on ${target} for overlay "${overlay.title}"`);
      
      const handleAction = () => {
        console.log(`🎮 [TUTORIAL RENDER] Required action completed: ${type} on ${target} for overlay "${overlay.title}"`);
        onDismiss(overlay.id);
      };
      
      const targetElement = document.querySelector(target);
      if (targetElement) {
        console.log(`✅ [TUTORIAL RENDER] Target element found: ${target}`);
        switch (type) {
          case 'click':
            targetElement.addEventListener('click', handleAction);
            break;
          case 'hover':
            targetElement.addEventListener('mouseenter', handleAction);
            break;
          // 'input' would need more specific handling based on element type
        }
        
        return () => {
          console.log(`🧹 [TUTORIAL RENDER] Removing action listener: ${type} on ${target}`);
          targetElement.removeEventListener('click', handleAction);
          targetElement.removeEventListener('mouseenter', handleAction);
        };
      } else {
        console.log(`❌ [TUTORIAL RENDER] Target element not found: ${target}`);
      }
    }
  }, [stableActionRequired, overlay.id, onDismiss]);

  const handleDismiss = () => {
    if (overlay.dismissable) {
      console.log(`👆 [TUTORIAL RENDER] User dismissed overlay: "${overlay.title}" (${overlay.type})`);
      onDismiss(overlay.id);
    } else {
      console.log(`🚫 [TUTORIAL RENDER] User tried to dismiss non-dismissable overlay: "${overlay.title}"`);
    }
  };

  return (
    <>
      {/* Spotlight highlighting for targeted elements */}
      {overlay.type === 'spotlight' && overlay.targetElement && (
        <SpotlightTarget targetSelector={overlay.targetElement} />
      )}
      
      <OverlayContent
        ref={overlayRef}
        $type={overlay.type}
        $position={overlay.position}
        $targetElement={overlay.targetElement}
      >
        <OverlayTitle $type={overlay.type}>
          {overlay.title}
        </OverlayTitle>
        
        <OverlayContent2 $type={overlay.type}>
          {parseContentWithHighlights(overlay.content, overlay.type)}
        </OverlayContent2>
        
        {overlay.type === 'progress_indicator' && (
          <>
            <ProgressBar $progress={75} /> {/* This would be dynamic */}
            <ProgressText>Progress: 75%</ProgressText>
          </>
        )}
        
        {overlay.dismissable && (
          <DismissButton $type={overlay.type} onClick={handleDismiss}>
            {overlay.type === 'modal' ? 'Continue' : 'Got it!'}
          </DismissButton>
        )}
        
        {overlay.autoAdvance && overlay.autoAdvance > 0 && (
          <ProgressText style={{ marginTop: '8px', fontSize: '10px' }}>
            Auto: {overlay.autoAdvance}s
          </ProgressText>
        )}
      </OverlayContent>
    </>
  );
};

// Component to highlight target elements for spotlight overlays
const SpotlightTarget: React.FC<{ targetSelector: string }> = ({ targetSelector }) => {
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    console.log(`🔍 [TUTORIAL RENDER] Setting up spotlight target: ${targetSelector}`);
    
    const updatePosition = () => {
      const element = document.querySelector(targetSelector);
      if (element) {
        const rect = element.getBoundingClientRect();
        setTargetRect(rect);
        console.log(`🎯 [TUTORIAL RENDER] Spotlight target positioned: ${targetSelector} at (${rect.x}, ${rect.y})`);
      } else {
        console.log(`❌ [TUTORIAL RENDER] Spotlight target not found: ${targetSelector}`);
      }
    };

    updatePosition();
    
    // Update position on window resize or scroll
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition);
    
    return () => {
      console.log(`🧹 [TUTORIAL RENDER] Cleaning up spotlight target: ${targetSelector}`);
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition);
    };
  }, [targetSelector]);

  if (!targetRect) return null;

  return (
    <SpotlightHighlight
      $targetSelector={targetSelector}
      style={{
        left: targetRect.left - 5,
        top: targetRect.top - 5,
        width: targetRect.width + 10,
        height: targetRect.height + 10,
      }}
    />
  );
};

// Main tutorial overlay manager component
const TutorialOverlayManager: React.FC = () => {
  const activeOverlays = useTutorialStore(tutorialSelectors.getActiveOverlays);
  const tutorialMode = useTutorialStore(tutorialSelectors.getTutorialMode);
  const { dismissOverlay } = useTutorialStore();

  // Log overlay manager state changes
  useEffect(() => {
    if (activeOverlays.length > 0) {
      console.log(`📊 [TUTORIAL RENDER] Overlay manager rendering ${activeOverlays.length} overlay(s):`);
      activeOverlays.forEach((overlay, index) => {
        console.log(`  ${index + 1}. "${overlay.title}" (${overlay.type}) - ID: ${overlay.id}`);
      });
    } else {
      console.log(`📊 [TUTORIAL RENDER] Overlay manager: no active overlays to render`);
    }
  }, [activeOverlays]);

  // Log tutorial mode changes
  useEffect(() => {
    console.log(`🎭 [TUTORIAL RENDER] Tutorial mode changed: ${tutorialMode ? 'ENABLED' : 'DISABLED'}`);
  }, [tutorialMode]);

  // Don't render if tutorial mode is disabled
  if (!tutorialMode || activeOverlays.length === 0) {
    return null;
  }

  const hasModal = activeOverlays.some(overlay => overlay.type === 'modal');
  
  if (hasModal) {
    console.log(`🎭 [TUTORIAL RENDER] Modal detected - activating backdrop`);
  }

  return (
    <OverlayContainer className={hasModal ? 'modal-active' : ''}>
      {activeOverlays.map(overlay => (
        <TutorialOverlayComponent
          key={overlay.id}
          overlay={overlay}
          onDismiss={dismissOverlay}
        />
      ))}
    </OverlayContainer>
  );
};

// Tutorial overlay hook for easy integration with components
export function useTutorialOverlays() {
  const { showOverlay, dismissOverlay, dismissAllOverlays } = useTutorialStore();
  const activeOverlays = useTutorialStore(tutorialSelectors.getActiveOverlays);
  const tutorialMode = useTutorialStore(tutorialSelectors.getTutorialMode);

  // Convenience functions for common overlay types
  const showTooltip = (
    title: string, 
    content: string, 
    position: { x: number; y: number }, 
    options?: Partial<TutorialOverlayData>
  ) => {
    showOverlay({
      id: `tooltip_${Date.now()}`,
      type: 'tooltip',
      title,
      content,
      position,
      dismissable: true,
      ...options
    });
  };

  const showSpotlight = (
    title: string,
    content: string,
    targetElement: string,
    options?: Partial<TutorialOverlayData>
  ) => {
    showOverlay({
      id: `spotlight_${Date.now()}`,
      type: 'spotlight',
      title,
      content,
      targetElement,
      dismissable: true,
      ...options
    });
  };

  const showModal = (
    title: string,
    content: string,
    options?: Partial<TutorialOverlayData>
  ) => {
    showOverlay({
      id: `modal_${Date.now()}`,
      type: 'modal',
      title,
      content,
      dismissable: true,
      ...options
    });
  };

  const showGuidedInteraction = (
    title: string,
    content: string,
    targetElement: string,
    actionType: 'click' | 'hover' | 'input',
    options?: Partial<TutorialOverlayData>
  ) => {
    showOverlay({
      id: `guided_${Date.now()}`,
      type: 'guided_interaction',
      title,
      content,
      targetElement,
      dismissable: false, // Only dismiss when action is completed
      actionRequired: {
        type: actionType,
        target: targetElement
      },
      ...options
    });
  };

  const showProgressIndicator = (
    title: string,
    content: string,
    options?: Partial<TutorialOverlayData>
  ) => {
    showOverlay({
      id: 'progress_indicator',
      type: 'progress_indicator',
      title,
      content,
      dismissable: false, // Progress indicators stay until manually dismissed
      ...options
    });
  };

  return {
    // State
    activeOverlays,
    tutorialMode,
    hasActiveOverlays: activeOverlays.length > 0,

    // Actions
    showOverlay,
    dismissOverlay,
    dismissAllOverlays,

    // Convenience methods
    showTooltip,
    showSpotlight,
    showModal,
    showGuidedInteraction,
    showProgressIndicator
  };
}

export default TutorialOverlayManager; 