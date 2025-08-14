'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import styled, { css } from 'styled-components';
import { useSceneStore } from '@/app/store/sceneStore';
import { useTutorialStore } from '@/app/store/tutorialStore';
import { useTutorialOverlays } from '@/app/components/tutorial/TutorialOverlay';

import AbilityCardInterface from './AbilityCardInterface';
import ParallaxRenderer from './ParallaxRenderer';
import { ToastContainer, ExpandableQuestionContainer, ExpandableAnswerContainer } from '@/app/components/ui/PixelContainer';

// === JUMBO SCREEN SYSTEM ===
const HOME_INTERNAL_WIDTH = 640;
const HOME_INTERNAL_HEIGHT = 360;
const JUMBO_ASSET_HEIGHT = 585;

const DEBUG_CLICKBOXES = false;

// Canvas-appropriate typography scale for 640×360 coordinate system
const CanvasFonts = {
  xs: '8px',   // For small tooltips and labels
  sm: '10px',  // For secondary text and values
  md: '12px',  // For primary content text
  lg: '14px',  // For headings and important text
  xl: '16px'   // For major headings
};

// Typography override wrapper for PixelContainer compatibility with canvas scaling
const CanvasTypographyOverride = styled.div`
  font-size: ${CanvasFonts.xs} !important;
  line-height: 1.4 !important;
  
  * {
    font-size: inherit !important;
    line-height: inherit !important;
  }
`;

// Large text override for welcome panel (bypasses the xs font forcing)
const WelcomeTypographyOverride = styled.div`
  line-height: 1.4 !important;
  
  /* Allow explicit font sizes to work */
  * {
    line-height: inherit !important;
  }
`;

// Star notification wrapper (positioned within canvas coordinates)
const StarNotificationWrapper = styled.div<{ $visible: boolean; $type: 'discovery' | 'growth' | 'mastery' }>`
  position: absolute;
  top: 30px;  // Canvas coordinate positioning
  left: 50%;
  transform: translateX(-50%);
  z-index: 1500;
  
  opacity: ${props => props.$visible ? 1.0 : 0};
  transform: ${props => props.$visible 
    ? 'translateX(-50%) translateY(0px)' 
    : 'translateX(-50%) translateY(-20px)'
  };
  transition: opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1), transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  
  min-width: 160px;
  max-width: 200px;
`;

// Welcome toast wrapper (separate from star notifications for clarity)
const WelcomeToastWrapper = styled.div<{ $visible: boolean }>`
  position: absolute;
  top: 53px;  // Canvas coordinate positioning (consistent with toast templates)
  left: 50%;
  transform: translateX(-50%);
  z-index: 1600;

  opacity: ${props => props.$visible ? 1 : 0};
  transform: ${props => props.$visible
    ? 'translateX(-50%) translateY(0)'
    : 'translateX(-50%) translateY(-10px)'};
  transition: opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1), 
              transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
`;

// Star icon for notifications
const StarIcon = styled.div<{ $type: 'discovery' | 'growth' | 'mastery' }>`
  display: inline-block;
  margin-right: 6px;
  font-size: 12px;
  
  &::before {
    content: '${props => 
      props.$type === 'discovery' ? '⭐' :
      props.$type === 'growth' ? '🌟' :
      '✨'
    }';
  }
`;

// Welcome content wrapper for consistent layout
const WelcomeContent = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
`;

// 9-slice welcome panel wrapper positioned in canvas coordinates
const WelcomePanelWrapper = styled.div<{ $visible: boolean }>`
  position: absolute;
  top: 48px;
  left: 50%;
  transform: translateX(-50%);
  width: 380px;  /* Narrower width for natural wrapping */
  z-index: 1600;
  pointer-events: ${props => props.$visible ? 'all' : 'none'}; /* Don't block clicks when hidden */

  opacity: ${props => props.$visible ? 1 : 0};
  transform: ${props => props.$visible ? 'translateX(-50%) translateY(0)' : 'translateX(-50%) translateY(-10px)'};
  transition: opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1), 
              transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
`;

// Notification content styling
const NotificationContent = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
`;

// Viewport container - the 640x360 window
const JumboViewport = styled.div`
  width: ${HOME_INTERNAL_WIDTH}px;
  height: ${HOME_INTERNAL_HEIGHT}px;
  position: fixed;
  top: 50%;
  left: 50%;
  transform-origin: center;
  transform: translate(-50%, -50%) scale(var(--home-scale));
  overflow: hidden;
  image-rendering: pixelated;
`;

// Tutorial Star Component - Enhanced 10-frame animation system
const TutorialStar = styled.div<{ $frame: number; $isHovered: boolean }>`
  position: absolute;
  width: 12px;
  height: 12px;
  background-image: url('/images/home/tutorial-star.png');
  background-size: 120px 12px; /* 10 frames × 12px = 120px width */
  background-position: ${props => (props.$frame - 1) * -12}px 0px; /* Frame 1-10 navigation */
  image-rendering: pixelated;
  cursor: ${props => (props.$frame >= 1 && props.$frame <= 4) || props.$frame >= 8 ? 'pointer' : 'default'}; /* Clickable during ping pong (1-4) and unlocked states (8+) */
  z-index: 200; /* Above all parallax layers */
  transition: transform 0.3s ease, filter 0.3s ease;
  
  /* Enhanced glow effects for new frame system */
  filter: ${props => {
    if (props.$frame >= 1 && props.$frame <= 4) {
      // Ping pong frames: Progressive glow buildup (1=subtle, 4=bright)
      const intensity = (props.$frame - 1) / 3; // 0 to 1 for frames 1-4
      return `drop-shadow(0 0 ${3 + intensity * 5}px rgba(255, 255, 255, ${0.4 + intensity * 0.4})) 
              drop-shadow(0 0 ${6 + intensity * 6}px rgba(255, 255, 255, ${0.3 + intensity * 0.3}))`;
    } else if (props.$frame >= 5 && props.$frame <= 7) {
      // Reveal animation: Intense buildup to unlock
      const intensity = (props.$frame - 5) / 2; // 0 to 1 for frames 5-7
      return `drop-shadow(0 0 ${6 + intensity * 4}px rgba(255, 255, 255, ${0.7 + intensity * 0.3})) 
              drop-shadow(0 0 ${12 + intensity * 8}px rgba(255, 255, 255, ${0.5 + intensity * 0.4}))`;
    } else if (props.$frame === 8) {
      // Unlocked: Clear bright glow
      return `drop-shadow(0 0 6px rgba(255, 255, 255, 1.0)) 
              drop-shadow(0 0 12px rgba(255, 255, 255, 0.9))`;
    } else if (props.$frame === 9) {
      // Growth: Blue-white glow
      return `drop-shadow(0 0 8px rgba(200, 220, 255, 1.0)) 
              drop-shadow(0 0 16px rgba(200, 220, 255, 1.0))`;
    } else if (props.$frame === 10) {
      // Mastery: Golden glow
      return `drop-shadow(0 0 10px rgba(255, 215, 0, 1.0)) 
              drop-shadow(0 0 20px rgba(255, 215, 0, 0.9))`;
    }
    return 'none';
  }};
  
  /* Enhanced hover effect for clickable states */
  transform: ${props => props.$isHovered && ((props.$frame >= 1 && props.$frame <= 4) || props.$frame >= 8) ? 'scale(1.2)' : 'scale(1)'};
  
  ${props => props.$isHovered && ((props.$frame >= 1 && props.$frame <= 4) || props.$frame >= 8) && css`
    filter: ${
      props.$frame >= 1 && props.$frame <= 4 ?
      // Ping pong hover: Enhanced white glow
      `drop-shadow(0 0 8px rgba(255, 255, 255, 0.9)) 
       drop-shadow(0 0 16px rgba(255, 255, 255, 0.7))` :
      props.$frame === 8 ? 
      `drop-shadow(0 0 10px rgba(255, 255, 255, 1.0)) 
       drop-shadow(0 0 20px rgba(255, 255, 255, 1.0))` :
      props.$frame === 9 ?
      `drop-shadow(0 0 12px rgba(200, 220, 255, 1.0)) 
       drop-shadow(0 0 24px rgba(200, 220, 255, 1.0))` :
      `drop-shadow(0 0 15px rgba(255, 215, 0, 1.0)) 
       drop-shadow(0 0 30px rgba(255, 215, 0, 1.0))`
    };
  `}
  
  /* Enhanced animations for different star states */
  ${props => {
    if (props.$frame >= 1 && props.$frame <= 4) {
      // Ping pong frames: No CSS animations (handled by JavaScript ping pong)
      return css``;
    } else if (props.$frame >= 5 && props.$frame <= 7) {
      // Reveal animation: No additional animations to avoid conflicts
      return css``;
    } else if (props.$frame >= 8) {
      // Unlocked and beyond: Full twinkle effect
      return css`animation: starTwinkle 3s ease-in-out infinite, glowPulse 2s ease-in-out infinite alternate;`;
    }
    return css``;
  }}
`;

// Wrapper that follows the 'stars' parallax layer so the TutorialStar stays anchored relative to the sky
// Removed: StarAnchor to avoid transform-based drift

// Container for elements that scroll together (foreground + clickable areas)
const ScrollingContent = styled.div<{ $scrollPosition: number }>`
  position: relative;
  width: ${HOME_INTERNAL_WIDTH}px;
  height: ${JUMBO_ASSET_HEIGHT}px;
  transform: translateY(${props => props.$scrollPosition}px);
  transition: transform 0.8s cubic-bezier(0.4, 0, 0.2, 1);
  image-rendering: pixelated;
  z-index: 12; /* Ensure it's above the parallax renderer */
`;

// The static foreground part of the scene
const ForegroundLayer = styled.div`
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 11; /* Sits just behind clickable areas */
    background-image: url('/images/home/home-sky-combo.png');
    background-size: ${HOME_INTERNAL_WIDTH}px ${JUMBO_ASSET_HEIGHT}px;
    pointer-events: none; /* Allows clicks to pass through */
`;

const ClickableArea = styled.div<{ $isHovered: boolean; $debugColor?: string }>`
  position: absolute;
  cursor: pointer;
  z-index: 100; /* Above all background layers */
  background: ${({ $isHovered, $debugColor }) => {
    if (DEBUG_CLICKBOXES) {
      return $debugColor || 'rgba(255, 0, 0, 0.3)';
    }
    return $isHovered ? 'rgba(255, 255, 255, 0.2)' : 'transparent';
  }};
  border: ${({ $isHovered, $debugColor }) => {
    if (DEBUG_CLICKBOXES) {
      return `2px solid ${$debugColor?.replace('0.3', '0.8') || 'rgba(255, 0, 0, 0.8)'}`;
    }
    return $isHovered ? '2px solid rgba(255, 255, 255, 0.5)' : '2px solid transparent';
  }};
  transition: all 0.3s ease;
  
  &:hover {
    background: ${({ $debugColor }) => DEBUG_CLICKBOXES ? $debugColor?.replace('0.3', '0.5') : 'rgba(255, 255, 255, 0.2)'};
    border: ${({ $debugColor }) => DEBUG_CLICKBOXES ? `2px solid ${$debugColor?.replace('0.3', '1')}` : '2px solid rgba(255, 255, 255, 0.5)'};
  }
`;

const DebugLabel = styled.div`
  position: absolute;
  top: 2px;
  left: 2px;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 2px 6px;
  font-size: 12px;
  font-family: monospace;
  border-radius: 2px;
  pointer-events: none;
  z-index: 5;
`;

// Tutorial Star moved to ParallaxRenderer for consistent visibility during transitions

const Tooltip = styled.div<{ x: number; y: number; $visible: boolean }>`
  position: absolute;
  left: ${({ x }) => x}px;
  top: ${({ y }) => y - 40}px;
  background: rgba(15, 23, 42, 0.95);
  color: #E2E8F0;
  border: 2px solid rgba(124, 58, 237, 0.8);
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 14px;
  font-family: 'AsepriteFont', monospace;
  pointer-events: none;
  z-index: 200; /* Above clickable areas */
  transform: translateX(-50%);
  opacity: ${({ $visible }) => $visible ? 1 : 0};
  transition: opacity 0.3s ease;
  backdrop-filter: blur(10px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  max-width: 300px;
  text-align: center;
  
  &::after {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    margin-left: -5px;
    border-width: 5px;
    border-style: solid;
    border-color: rgba(124, 58, 237, 0.8) transparent transparent transparent;
  }
`;

interface HoveredArea {
  name: string;
  x: number;
  y: number;
}


export default function CombinedHomeScene() {
  const { transitionToScene } = useSceneStore();
  const [hoveredArea, setHoveredArea] = useState<HoveredArea | null>(null);
  const [showAbilityInterface, setShowAbilityInterface] = useState(false);
  
  // Jumbo screen scroll state
  const [scrollPosition, setScrollPosition] = useState(-(JUMBO_ASSET_HEIGHT - HOME_INTERNAL_HEIGHT)); // Start at bottom (home view)
  const [currentView, setCurrentView] = useState<'home' | 'sky'>('home');
  
  // Tutorial star state
  const [tutorialStarFrame, setTutorialStarFrame] = useState(1); // 1: hint, 2-3: ping pong, 4: unlocked (with growth/mastery progression)
  const [isRevealAnimating, setIsRevealAnimating] = useState(false);
  const [isPingPongActive, setIsPingPongActive] = useState(false);
  const [starHovered, setStarHovered] = useState(false);
  const [starUnlocked, setStarUnlocked] = useState(false); // Track if star has been unlocked (prevents loop restart)
  
  // Star notification state
  const [starNotification, setStarNotification] = useState<{
    type: 'discovery' | 'growth' | 'mastery';
    message: string;
    visible: boolean;
  } | null>(null);
  
  // Tutorial integration
  const currentStep = useTutorialStore(state => state.currentStep);
  const completeStep = useTutorialStore(state => state.completeStep);
  const { showSpotlight, dismissAllOverlays } = useTutorialOverlays();

  // Welcome panel state
  const [welcomeToastVisible, setWelcomeToastVisible] = useState(false);
  const [welcomeShown, setWelcomeShown] = useState(false);
  const [welcomeDismissed, setWelcomeDismissed] = useState(false);
  
  // === HOME SCALING SYSTEM ===
  // Calculate scale to fit 640x360 home into viewport while maintaining aspect ratio
  useEffect(() => {
    let resizeTimeout: NodeJS.Timeout;
    
    const updateHomeScale = () => {
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      const scaleX = viewportWidth / HOME_INTERNAL_WIDTH;
      const scaleY = viewportHeight / HOME_INTERNAL_HEIGHT;
      const homeScale = Math.min(scaleX, scaleY) * 1; // 90% to add margin
      
      // Set CSS custom property for home scaling
      document.documentElement.style.setProperty('--home-scale', homeScale.toString());
      
      console.log(`[CombinedHomeScene] Home scale: ${homeScale.toFixed(3)} (${viewportWidth}x${viewportHeight} → ${HOME_INTERNAL_WIDTH}x${HOME_INTERNAL_HEIGHT})`);
    };
    
    // Debounced resize handler to prevent rapid scale updates
    const debouncedResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(updateHomeScale, 100);
    };
    
    updateHomeScale(); // Initial calculation
    window.addEventListener('resize', debouncedResize);
    
    return () => {
      window.removeEventListener('resize', debouncedResize);
      clearTimeout(resizeTimeout);
    };
  }, []);

  const handleBedClick = () => {
    console.log('[CombinedHomeScene] Bed clicked - transitioning to hospital');
    transitionToScene('hospital');
  };

  const handleDeskClick = () => {
    console.log('[CombinedHomeScene] Desk clicked - opening journal/ability cards');
    setShowAbilityInterface(true);
  };

  const handleCloseAbilityInterface = () => {
    setShowAbilityInterface(false);
  };

  // Scroll functions for jumbo screen navigation
  const scrollToSky = () => {
    console.log('[CombinedHomeScene] Scrolling to sky view - parallax enabled');
    setScrollPosition(0); // Top of the asset (sky view)
    setCurrentView('sky');
  };

  const scrollToHome = () => {
    console.log('[CombinedHomeScene] Scrolling to home view - parallax enabled');
    setScrollPosition(-(JUMBO_ASSET_HEIGHT - HOME_INTERNAL_HEIGHT)); // Bottom of the asset (home view)
    setCurrentView('home');
  };

  const handleTelescopeClick = () => {
    if (currentView === 'home') {
      console.log('[CombinedHomeScene] Telescope clicked - scrolling to sky view');
      scrollToSky();
    } else {
      console.log('[CombinedHomeScene] Telescope clicked - opening constellation view');
      transitionToScene('constellation');
    }
  };

  // New handler for ladder (to scroll back to home from sky)
  const handleLadderClick = () => {
    console.log('[CombinedHomeScene] Ladder clicked - scrolling to home view');
    scrollToHome();
  };

  const handleAreaHover = (area: string, event: React.MouseEvent) => {
    if (area === 'Telescope') {
      console.log(`[CombinedHomeScene] 🔭 Telescope hover detected! Tutorial step: ${currentStep}, guided step: ${guidedTourStep}`);
    }
    const rect = event.currentTarget.getBoundingClientRect();
    setHoveredArea({
      name: area,
      x: rect.left + rect.width / 2,
      y: rect.top
    });
  };

  const handleAreaLeave = () => {
    if (hoveredArea?.name === 'Telescope') {
      console.log(`[CombinedHomeScene] 🔭 Left telescope area`);
    }
    setHoveredArea(null);
  };

  // Tutorial: First-time home visit guidance (prevent multiple executions)
  const hasProcessedRef = useRef(false);
  const hasShownWelcomeRef = useRef(false);
  const pingPongIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Tutorial star simple loop animation when Quinn tutorial is completed
  useEffect(() => {
    console.log('[CombinedHomeScene] 🌟 Star effect check - currentStep:', currentStep, 'isPingPongActive:', isPingPongActive);
    
    // TEMPORARY: Start loop immediately for testing (remove this line when tutorial flow is working)
    const testMode = true;
    
    if (testMode || currentStep === 'constellation_intro' || currentStep === 'constellation_available') {
      // User has completed Quinn tutorial - start simple loop (only if star hasn't been unlocked yet)
      if (!isPingPongActive && !isRevealAnimating && !starUnlocked) {
        console.log('[CombinedHomeScene] ⭐ Tutorial completed - starting frame loop 1-4!');
        setIsPingPongActive(true);
        
        // Simple loop: 1 → 2 → 3 → 4 → 1 → repeat
        let currentFrame = 1;
        
        console.log('[CombinedHomeScene] 🎬 Creating interval for star animation');
        pingPongIntervalRef.current = setInterval(() => {
          currentFrame++;
          if (currentFrame > 4) {
            currentFrame = 1; // Loop back to start
          }
          console.log('[CombinedHomeScene] 🌟 Loop frame:', currentFrame, 'Background position should be:', (currentFrame - 1) * -12, 'px');
          setTutorialStarFrame(currentFrame);
        }, 400); // 400ms per frame for clear progression
        
        console.log('[CombinedHomeScene] 🎬 Interval created with ID:', pingPongIntervalRef.current);
      }
    }
  }, [currentStep, isPingPongActive, isRevealAnimating, starUnlocked]); // Depend on starUnlocked instead of tutorialStarFrame
  
  // Cleanup interval on component unmount
  useEffect(() => {
    return () => {
      if (pingPongIntervalRef.current) {
        console.log('[CombinedHomeScene] 🧹 Cleaning up star animation interval');
        clearInterval(pingPongIntervalRef.current);
        pingPongIntervalRef.current = null;
      }
    };
  }, []);
  
  // Guided tour state
  const [guidedTourStep, setGuidedTourStep] = useState<'welcome' | 'desk' | 'telescope' | 'bed' | 'complete'>('welcome');
  const shownSpotlightsRef = useRef(new Set<string>());
  
  // Debug: Track tutorial step changes with deduplication
  const lastLoggedStep = useRef<string | null>(null);
  useEffect(() => {
    if (currentStep && currentStep !== lastLoggedStep.current) {
      console.log(`[CombinedHomeScene] 📚 Tutorial step changed to: ${currentStep}`);
      console.log(`[CombinedHomeScene] 📚 State: currentView=${currentView}, guidedTourStep=${guidedTourStep}, scrollPosition=${scrollPosition}`);
      lastLoggedStep.current = currentStep;
    }
  }, [currentStep, currentView, guidedTourStep, scrollPosition]);
  
  // Single-source tutorial progression - prevent multiple triggers
  const tutorialProcessingRef = useRef(false);
  useEffect(() => {
    if (currentStep === 'night_phase_intro' && !hasProcessedRef.current && !tutorialProcessingRef.current) {
      // First time arriving home - advance to home_intro step
      console.log('[CombinedHomeScene] 🎯 Processing night_phase_intro transition (single-source)');
      hasProcessedRef.current = true;
      tutorialProcessingRef.current = true;
      
      // Use requestAnimationFrame to ensure DOM is ready
      requestAnimationFrame(() => {
        setTimeout(() => {
          if (tutorialProcessingRef.current) { // Double-check we haven't been cancelled
            console.log('[CombinedHomeScene] 🎯 Completing night_phase_intro');
            completeStep('night_phase_intro');
            tutorialProcessingRef.current = false;
          }
        }, 100);
      });
    }
  }, [currentStep, completeStep]);

  // Show welcome panel when scene loads (only once) - with debouncing
  const welcomeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (currentStep === 'home_intro' && !hasShownWelcomeRef.current) {
      hasShownWelcomeRef.current = true;
      
      // Clear any existing timeout
      if (welcomeTimeoutRef.current) {
        clearTimeout(welcomeTimeoutRef.current);
      }
      
      // Debounce the welcome panel to prevent rapid firing
      welcomeTimeoutRef.current = setTimeout(() => {
        setWelcomeShown(true);
        setWelcomeDismissed(false);
        setWelcomeToastVisible(true);
      }, 200);
    }
    
    return () => {
      if (welcomeTimeoutRef.current) {
        clearTimeout(welcomeTimeoutRef.current);
      }
    };
  }, [currentStep]); // guidedTourStep intentionally excluded to prevent retriggering

  // After welcome is dismissed, show telescope spotlight (no auto timer)
  const spotlightTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (
      currentStep === 'home_intro' &&
      hasShownWelcomeRef.current &&
      guidedTourStep === 'welcome' &&
      welcomeShown &&
      welcomeDismissed
    ) {
      // Clear any existing timeout
      if (spotlightTimeoutRef.current) {
        clearTimeout(spotlightTimeoutRef.current);
      }
      
      spotlightTimeoutRef.current = setTimeout(() => {
        // First dismiss any existing overlays to ensure clean state
        dismissAllOverlays();
        setTimeout(() => {
          showSpotlight(
            'View the Stars',
            'Click the telescope to explore your constellation and see what you\'ve discovered today!',
            '[data-testid="home-telescope-area"]',
            { dismissable: false }
          );
          setGuidedTourStep('telescope');
        }, 300);
      }, 200);
      
      // Cleanup timeout if component unmounts or dependencies change
      return () => {
        if (spotlightTimeoutRef.current) {
          clearTimeout(spotlightTimeoutRef.current);
        }
      };
    }
  }, [currentStep, guidedTourStep, dismissAllOverlays, showSpotlight, welcomeShown, welcomeDismissed]);

  // Note: Simplified guided tour - we now go directly to telescope after welcome modal
  // The telescope spotlight is shown in the welcome modal timeout effect above
  // No need for complex multi-step guided tour sequence

  // Tutorial: Enhanced click handlers for guidance
  const handleDeskClickWithTutorial = () => {
    if (currentStep === 'home_intro' && guidedTourStep === 'desk') {
      // Guided tour: advance to telescope step
      dismissAllOverlays();
      setGuidedTourStep('telescope');
      handleDeskClick();
    } else if (currentStep === 'home_intro') {
      // Regular home intro click
      handleDeskClick();
    } else if (currentStep === 'abilities_desk_intro') {
      // Enhanced desk interaction
      handleDeskClick();
    } else {
      handleDeskClick();
    }
  };

  const handleTelescopeClickWithTutorial = () => {
    console.log(`[CombinedHomeScene] 🔭 Telescope clicked! currentStep=${currentStep}, guidedTourStep=${guidedTourStep}, currentView=${currentView}`);
    
    if (currentStep === 'home_intro' && guidedTourStep === 'telescope') {
      // Modified: First scroll to sky view for tutorial
      console.log('[CombinedHomeScene] Telescope clicked during home_intro - scrolling to sky view');
      dismissAllOverlays();
      
      // Scroll to sky view and advance tutorial
      handleTelescopeClick();
      
      // After scroll animation, advance tutorial
      setTimeout(() => {
        const { skipToStep } = useTutorialStore.getState();
        skipToStep('constellation_intro');
      }, 800); // Wait for scroll animation to complete
    } else if (currentStep === 'home_intro') {
      // Regular home intro click - scroll to sky view first
      console.log('[CombinedHomeScene] Telescope clicked during home_intro - scrolling to sky view');
      handleTelescopeClick();
      
      // After scroll animation, advance tutorial
      setTimeout(() => {
        const { skipToStep } = useTutorialStore.getState();
        skipToStep('constellation_intro');
      }, 800);
    } else if (currentStep === 'constellation_available') {
      // User is ready for constellation tutorial - advance step and use telescope behavior
      console.log('[CombinedHomeScene] Telescope clicked during constellation_available');
      completeStep('constellation_available');
      handleTelescopeClick();
    } else if (currentStep === 'constellation_intro') {
      // Already in constellation tutorial - use normal telescope behavior
      console.log('[CombinedHomeScene] Telescope clicked during constellation_intro');
      handleTelescopeClick();
    } else {
      // Default behavior for other states
      console.log(`[CombinedHomeScene] Telescope clicked - default behavior (step: ${currentStep})`);
      handleTelescopeClick();
    }
  };

  const handleBedClickWithTutorial = () => {
    if (currentStep === 'home_intro' && guidedTourStep === 'bed') {
      // Guided tour: complete home intro
      dismissAllOverlays();
      setGuidedTourStep('complete');
      completeStep('home_intro');
      handleBedClick();
    } else {
      handleBedClick();
    }
  };

  // Tutorial star interaction handlers
  const handleStarClick = () => {
    console.log('[CombinedHomeScene] ⭐ Star clicked! Current frame:', tutorialStarFrame, 'isPingPong:', isPingPongActive);
    
    // Don't allow clicks during reveal animation
    if (isRevealAnimating) {
      console.log('[CombinedHomeScene] ⭐ Star is animating - click ignored');
      return;
    }
    
    // If loop is active (frames 1-4), stop it and go directly to unlocked state
    if (isPingPongActive && tutorialStarFrame >= 1 && tutorialStarFrame <= 4) {
      console.log('[CombinedHomeScene] ⭐ Stopping loop, unlocking star!');
      
      // Stop loop animation
      if (pingPongIntervalRef.current) {
        console.log('[CombinedHomeScene] 🛑 Clearing interval with ID:', pingPongIntervalRef.current);
        clearInterval(pingPongIntervalRef.current);
        pingPongIntervalRef.current = null;
      }
      setIsPingPongActive(false);
      setStarUnlocked(true); // Mark star as unlocked to prevent loop restart
      
      // Go directly to unlocked state (frame 8)
      setTutorialStarFrame(8);
      console.log('[CombinedHomeScene] ⭐ Star unlocked!');
      
      // Show toast notification instead of modal
      setStarNotification({
        type: 'discovery',
        message: 'Polaris Discovered!',
        visible: true
      });
      setTimeout(() => setStarNotification(null), 3000);
      
      return;
    }
    
    if (tutorialStarFrame === 8) {
      // First click after unlock: unlocked -> growth
      setTutorialStarFrame(9);
      setStarNotification({
        type: 'growth',
        message: 'Star Growing!',
        visible: true
      });
      setTimeout(() => setStarNotification(null), 3000);
    } else if (tutorialStarFrame === 9) {
      // Second click: growth -> mastery
      setTutorialStarFrame(10);
      setStarNotification({
        type: 'mastery',
        message: 'Star Mastered!',
        visible: true
      });
      setTimeout(() => setStarNotification(null), 3000);
    } else if (tutorialStarFrame === 10) {
      // Already mastered - show info
      setStarNotification({
        type: 'mastery',
        message: 'Polaris - The North Star',
        visible: true
      });
      setTimeout(() => setStarNotification(null), 3000);
    }
  };

  const handleStarHover = () => {
    setStarHovered(true);
  };

  const handleStarLeave = () => {
    setStarHovered(false);
  };

  return (
    <>
      <JumboViewport>
        {/* The isolated parallax renderer sits here, behind the scrolling content */}
        <ParallaxRenderer scrollPosition={scrollPosition} />

        {/* The scrolling content contains the foreground and all interactive elements */}
        <ScrollingContent $scrollPosition={scrollPosition}>
          {/* Tutorial Star - anchor relative to the tall background image */}
          <TutorialStar
            $frame={tutorialStarFrame}
            $isHovered={starHovered}
            style={{ 
              left: '320px', 
              top: '80px'
            }}
            onClick={handleStarClick}
            onMouseEnter={handleStarHover}
            onMouseLeave={handleStarLeave}
          />
          <ForegroundLayer />
          
          {/* === HOME VIEW CLICKABLE AREAS === */}
          {currentView === 'home' && (
            <>
              {/* Bed area */}
              <ClickableArea
                data-testid="home-bed-area"
                $isHovered={hoveredArea?.name === 'Bed'}
                style={{ left: '460px', top: '525px', width: '160px', height: '54px' }}
                onClick={handleBedClickWithTutorial}
                onMouseEnter={(e) => handleAreaHover('Bed', e)}
                onMouseLeave={handleAreaLeave}
              />

              {/* Desk area */}
              <ClickableArea
                data-testid="home-desk-area"
                $isHovered={hoveredArea?.name === 'Desk'}
                style={{ left: '5px', top: '510px', width: '120px', height: '72px' }}
                onClick={handleDeskClickWithTutorial}
                onMouseEnter={(e) => handleAreaHover('Desk', e)}
                onMouseLeave={handleAreaLeave}
              />

              {/* Telescope area */}
              <ClickableArea
                data-testid="home-telescope-area"
                $isHovered={hoveredArea?.name === 'Telescope'}
                style={{ left: '195px', top: '279px', width: '70px', height: '120px' }}
                onClick={handleTelescopeClickWithTutorial}
                onMouseEnter={(e) => handleAreaHover('Telescope', e)}
                onMouseLeave={handleAreaLeave}
              />
            </>
          )}

          {/* === SKY VIEW CLICKABLE AREAS === */}
          {currentView === 'sky' && (
            <>
              {/* Ladder area - only way to navigate back from sky view */}
              <ClickableArea
                data-testid="sky-ladder-area"
                $isHovered={hoveredArea?.name === 'Ladder'}
                style={{ left: '290px', top: '280px', width: '60px', height: '80px' }}
                onClick={handleLadderClick}
                onMouseEnter={(e) => handleAreaHover('Ladder', e)}
                onMouseLeave={handleAreaLeave}
              />

              {/* Tutorial Star moved to ParallaxRenderer for consistent visibility */}
              {/* Telescope navigation removed - sky view is for stargazing only */}
            </>
          )}

          {/* Tooltip */}
          {hoveredArea && (
            <Tooltip
              x={hoveredArea.x}
              y={hoveredArea.y}
              $visible={!!hoveredArea}
            >
              {hoveredArea.name === 'Bed' && 'Click here to start a new day'}
              {hoveredArea.name === 'Desk' && 'Manage your abilities'}
              {hoveredArea.name === 'Telescope' && 'View the night sky'}
              {hoveredArea.name === 'Ladder' && 'Go back down'}
            </Tooltip>
          )}
        </ScrollingContent>
        
        {/* Star Notification - positioned within canvas coordinates */}
        {starNotification && (
          <StarNotificationWrapper 
            $visible={starNotification.visible} 
            $type={starNotification.type}
          >
            <ToastContainer domain="dosimetry" size="xs">
              <CanvasTypographyOverride>
                <NotificationContent>
                  <StarIcon $type={starNotification.type} />
                  {starNotification.message}
                </NotificationContent>
              </CanvasTypographyOverride>
            </ToastContainer>
          </StarNotificationWrapper>
        )}
        
        {/* Welcome Home 9-slice panel with nested CTA */}
        <WelcomePanelWrapper $visible={welcomeToastVisible}>
          <ExpandableQuestionContainer domain="planning">
            <WelcomeTypographyOverride>
              <div style={{ padding: '6px 8px' }}>
                <div style={{ fontSize: '20px', marginBottom: '8px', fontWeight: 'bold' }}>Welcome Home!</div>
                <div style={{ fontSize: '16px', marginBottom: '10px' }}>
                  Your day at the hospital is complete. Time to explore your personal space!
                </div>
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <ExpandableAnswerContainer 
                    domain="planning" 
                    size="md" 
                    onClick={() => { setWelcomeToastVisible(false); setWelcomeDismissed(true); }}
                  >
                    <WelcomeTypographyOverride>
                      <div style={{ fontSize: '14px', padding: '4px 10px', fontWeight: 'bold' }}>Click to Continue</div>
                    </WelcomeTypographyOverride>
                  </ExpandableAnswerContainer>
                </div>
              </div>
            </WelcomeTypographyOverride>
          </ExpandableQuestionContainer>
        </WelcomePanelWrapper>
      </JumboViewport>


      {/* Ability Interface Modal - Rendered outside scaled container using portal */}
      {showAbilityInterface && createPortal(
        <AbilityCardInterface
          onClose={handleCloseAbilityInterface}
        />,
        document.body
      )}
    </>
  );
}