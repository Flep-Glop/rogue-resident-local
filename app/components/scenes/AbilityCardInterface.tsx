'use client';

import React, { useEffect, useState } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { ToastContainer } from '@/app/components/ui/PixelContainer';
import { colors } from '@/app/styles/pixelTheme';

// Sprite sheet configuration: 8 horizontal frames, 600x361 each
const FRAME_WIDTH = 600;
const FRAME_HEIGHT = 361;
const TOTAL_FRAMES = 8;
const SPRITE_SHEET_WIDTH = FRAME_WIDTH * TOTAL_FRAMES; // 4800px

// Card interface matches the frame dimensions exactly to prevent bleeding
const CARD_INTERFACE_INTERNAL_WIDTH = FRAME_WIDTH;  // 600px
const CARD_INTERFACE_INTERNAL_HEIGHT = FRAME_HEIGHT; // 361px

// Slide down animation for journal
const slideDown = keyframes`
  from {
    transform: scale(var(--interface-scale)) translateY(0);
  }
  to {
    transform: scale(var(--interface-scale)) translateY(120vh);
  }
`;

// Slide up animation for comp-sheet (translateY only, scale applied separately)
const slideUp = keyframes`
  from {
    transform: translateY(100vh);
  }
  to {
    transform: translateY(0);
  }
`;

// Slide down animation for comp-sheet exit
const slideDownCompSheet = keyframes`
  from {
    transform: translateY(0);
  }
  to {
    transform: translateY(100vh);
  }
`;

interface InterfaceOverlayProps {
  $isClosing: boolean;
}

const InterfaceOverlay = styled.div<InterfaceOverlayProps>`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(5px);
  opacity: ${props => props.$isClosing ? 0 : 1};
  transition: opacity 0.6s ease;
`;

// Backdrop for comp-sheet (same effect as journal)
interface CompSheetBackdropProps {
  $isVisible: boolean;
  $isExiting?: boolean;
}

const CompSheetBackdrop = styled.div<CompSheetBackdropProps>`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(5px);
  z-index: 998; /* Below comp-sheet (999) but above everything else */
  opacity: ${props => props.$isExiting ? 0 : (props.$isVisible ? 1 : 0)};
  transition: opacity 0.6s ease;
  pointer-events: ${props => props.$isVisible && !props.$isExiting ? 'all' : 'none'};
`;

interface CardInterfaceContainerProps {
  $frame: number;
  $isClosing: boolean;
}

const CardInterfaceContainer = styled.div<CardInterfaceContainerProps>`
  /* Modal scaling pattern - matches NarrativeDialogue architecture */
  width: ${CARD_INTERFACE_INTERNAL_WIDTH}px;
  height: ${CARD_INTERFACE_INTERNAL_HEIGHT}px;
  transform-origin: center center;
  transform: scale(var(--interface-scale));
  
  /* Sprite sheet styling */
  background-image: url('/images/journal/book-sheet.png');
  background-size: ${SPRITE_SHEET_WIDTH}px ${FRAME_HEIGHT}px;
  background-position: ${props => -props.$frame * FRAME_WIDTH}px 0px;
  background-repeat: no-repeat;
  image-rendering: pixelated;
  
  /* Layout */
  display: flex;
  position: relative;
  align-items: center;
  justify-content: center;
  z-index: 1001; /* Above comp-sheet */
  
  /* Visual effects */
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  overflow: hidden; /* Clip any sprite sheet bleeding */
  
  /* Closing animation */
  ${props => props.$isClosing && css`
    animation: ${slideDown} 0.8s cubic-bezier(0.4, 0, 0.6, 1) forwards;
  `}
`;

// Wrapper for comp-sheet scaling (matches journal scaling system)
interface CompSheetWrapperProps {
  $isVisible: boolean;
}

const CompSheetWrapper = styled.div<CompSheetWrapperProps>`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) scale(var(--interface-scale));
  transform-origin: center center;
  z-index: 999; /* Below journal initially, then becomes main focus */
  width: 600px;
  height: 360px;
  overflow: hidden; /* CRITICAL: Prevent scrollbars from appearing */
`;

// Comp-sheet container (slides up from bottom and stays visible)
interface CompSheetContainerProps extends CompSheetWrapperProps {
  $isExiting?: boolean;
}

const CompSheetContainer = styled.div<CompSheetContainerProps>`
  width: 600px;
  height: 360px;
  overflow: hidden; /* Prevent any sprite bleeding or scrollbars */
  
  background-image: url('/images/home/comp-sheet.png');
  background-size: 600px 360px;
  background-position: center;
  background-repeat: no-repeat;
  image-rendering: pixelated;
  
  /* Initial position - offscreen below */
  transform: translateY(100vh);
  
  /* Animate up when visible */
  ${props => props.$isVisible && !props.$isExiting && css`
    animation: ${slideUp} 0.8s cubic-bezier(0.4, 0, 0.6, 1) forwards;
  `}
  
  /* Animate down when exiting */
  ${props => props.$isExiting && css`
    animation: ${slideDownCompSheet} 0.8s cubic-bezier(0.4, 0, 0.6, 1) forwards;
  `}
`;

// Scale up animation for toast (0 to 4 seconds)
const scaleUpToast = keyframes`
  from {
    transform: translate(-50%, calc(-50% - 250px)) scale(0.3);
    opacity: 0.5;
  }
  to {
    transform: translate(-50%, calc(-50% - 250px)) scale(1);
    opacity: 1;
  }
`;

// Slide up animation for question toast
const slideUpQuestion = keyframes`
  from {
    transform: translate(-50%, calc(-50% + 100px)) translateY(100vh);
    opacity: 0;
  }
  to {
    transform: translate(-50%, calc(-50% + 100px)) translateY(0);
    opacity: 1;
  }
`;

// Toast message container (LARGE, centered above comp-sheet, persistent)
const ToastMessageWrapper = styled.div<{ $visible: boolean }>`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, calc(-50% - 250px)); /* Offset above comp-sheet */
  z-index: 1500;
  pointer-events: none; /* Allow interaction with comp-sheet below */
  
  /* Scale up animation for dramatic landing effect */
  transform-origin: center center;
  opacity: 0;
  
  ${props => props.$visible && css`
    animation: ${scaleUpToast} 4s cubic-bezier(0.4, 0, 0.2, 1) forwards;
  `}
`;

// Question toast container (slides up beneath main toast after TBI lands)
const QuestionToastWrapper = styled.div<{ $visible: boolean }>`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, calc(-50% + 100px)) translateY(100vh); /* Position below main toast, offscreen initially */
  z-index: 1499; /* Just below main toast */
  pointer-events: ${props => props.$visible ? 'all' : 'none'};
  
  transform-origin: center center;
  overflow: hidden; /* CRITICAL: Prevent scrollbars - pattern from Entry #030, #040, #043 */
  
  ${props => props.$visible && css`
    animation: ${slideUpQuestion} 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards;
  `}
`;

const ToastContent = styled.div`
  padding: 24px 48px;
  font-size: 32px; /* DRASTICALLY larger */
  color: ${colors.text};
  text-align: center;
  white-space: nowrap;
  font-weight: 600;
  letter-spacing: 0.5px;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
  
  strong {
    font-weight: 800;
    color: ${colors.starPoints};
    font-size: 36px; /* Even larger for cycling letters */
    text-shadow: 0 0 8px ${colors.starPoints}40;
  }
`;

const QuestionContent = styled.div`
  padding: 36px 52px;
  color: ${colors.text};
  text-align: center;
  overflow: hidden; /* Prevent scrollbars - critical fix from Entry #030 and #043 */
  min-width: 600px; /* Wider container for longer questions */
`;

const QuestionText = styled.div`
  font-size: 34px; /* Middle ground for readability */
  font-weight: 700;
  margin-bottom: 28px;
  color: ${colors.text};
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
  line-height: 1.3;
`;

const OptionsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  align-items: stretch;
  overflow: hidden; /* Prevent scrollbars from option hover effects */
`;

const ResultsNote = styled.div`
  font-size: 24px;
  font-weight: 500;
  margin-top: 28px;
  color: ${colors.starPoints};
  text-shadow: 0 0 8px ${colors.starPoints}40;
  font-style: italic;
  line-height: 1.4;
`;

// X key indicator for results screen (scaled up 3x for visibility)
const XKeyIndicator = styled.div<{ $frame: number; $visible: boolean }>`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, calc(-50% + 180px)) scale(3);
  width: 15px;
  height: 16px;
  background-image: url('/images/ui/x-key.png');
  background-size: ${15 * 4}px 16px; /* 4 frames × 15px = 60px width */
  background-position: ${props => (props.$frame - 1) * -15}px 0px;
  background-repeat: no-repeat;
  image-rendering: pixelated;
  z-index: 1501; /* Above everything */
  pointer-events: none;
  
  opacity: ${props => props.$visible ? 1 : 0};
  transform: ${props => props.$visible 
    ? 'translate(-50%, calc(-50% + 180px)) scale(3)' 
    : 'translate(-50%, calc(-50% + 180px)) scale(2.4)'};
  transition: opacity 0.3s ease, transform 0.3s ease;
`;

const OptionButton = styled.button<{ $isSelected: boolean }>`
  padding: 18px 36px;
  font-size: 26px; /* Middle ground for readability */
  font-weight: 600;
  color: ${props => props.$isSelected ? colors.background : colors.text};
  background: ${props => props.$isSelected ? colors.starPoints : 'rgba(0, 0, 0, 0.4)'};
  border: 3px solid ${props => props.$isSelected ? colors.starPoints : colors.border};
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.2s ease, border-color 0.2s ease;
  text-align: left;
  position: relative;
  overflow: hidden; /* Prevent scrollbars on individual buttons */
  line-height: 1.3;
  
  &:hover {
    background: ${props => props.$isSelected ? colors.starPoints : 'rgba(255, 215, 0, 0.2)'};
    border-color: ${colors.starPoints};
    /* Removed transform effects to prevent truncation */
  }
  
  &:active {
    /* Removed transform effects to prevent truncation */
  }
  
  /* Checkmark for selected option */
  ${props => props.$isSelected && css`
    &::after {
      content: '✓';
      position: absolute;
      right: 22px;
      top: 50%;
      transform: translateY(-50%);
      font-size: 32px; /* Proportional checkmark */
      font-weight: bold;
    }
  `}
`;

// Clickable button area (positioned where the button appears in the journal)
const ButtonArea = styled.div`
  position: absolute;
  bottom: 80px;
  right: 100px;
  width: 120px;
  height: 50px;
  cursor: pointer;
  /* Debug: uncomment to visualize button area */
  /* background: rgba(255, 0, 0, 0.3); */
`;

interface AbilityCardInterfaceProps {
  onClose: () => void;
}

export default function AbilityCardInterface({ onClose }: AbilityCardInterfaceProps) {
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isAnimating, setIsAnimating] = useState(true);
  const [buttonPressed, setButtonPressed] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [showCompSheet, setShowCompSheet] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [cyclingText, setCyclingText] = useState('---');
  const [showQuestion, setShowQuestion] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [userAnswers, setUserAnswers] = useState<number[]>([]);
  const [xKeyFrame, setXKeyFrame] = useState(1); // 1 = unpressed, 2 = pressed
  const [showXKey, setShowXKey] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  
  // Question data (with correct answer indices)
  const questions = [
    {
      question: "What is the primary purpose of Total Body Irradiation (TBI)?",
      options: [
        "Conditioning before bone marrow transplant",
        "Treating localized brain tumors",
        "Post-operative pain management"
      ],
      correctAnswer: 0
    },
    {
      question: "What is a major concern when delivering TBI?",
      options: [
        "Dose uniformity across entire body",
        "Patient claustrophobia",
        "Treatment time under 5 minutes"
      ],
      correctAnswer: 0
    }
  ];
  
  const currentQuestion = questions[currentQuestionIndex];

  // === SHOW X KEY ON RESULTS SCREEN ===
  useEffect(() => {
    if (showResults) {
      // Small delay before showing X key for smoother transition
      const timer = setTimeout(() => {
        setShowXKey(true);
        setXKeyFrame(1); // Reset to unpressed state
      }, 400);
      
      return () => clearTimeout(timer);
    }
  }, [showResults]);

  // === CYCLING LETTERS ANIMATION ===
  useEffect(() => {
    if (!showToast) return;

    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let cycleIndex = 0;
    let hasLanded = false;

    const cycleInterval = setInterval(() => {
      cycleIndex++;
      
      // After 4 seconds (4000ms / 120ms ≈ 33 cycles), land on "TBI"
      if (cycleIndex >= 33 && !hasLanded) {
        setCyclingText('TBI');
        hasLanded = true;
        clearInterval(cycleInterval);
        
        // Show question toast 500ms after TBI lands
        setTimeout(() => {
          setShowQuestion(true);
        }, 500);
        
        return;
      }
      
      // Generate 3 random letters
      const randomLetters = Array.from({ length: 3 }, () => 
        letters[Math.floor(Math.random() * letters.length)]
      ).join('');
      setCyclingText(randomLetters);
    }, 120); // Change letters every 120ms

    return () => clearInterval(cycleInterval);
  }, [showToast]);

  // === INTERFACE SCALING SYSTEM ===
  useEffect(() => {
    const updateScale = () => {
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      const scaleX = viewportWidth / CARD_INTERFACE_INTERNAL_WIDTH;
      const scaleY = viewportHeight / CARD_INTERFACE_INTERNAL_HEIGHT;
      
      const interfaceScale = Math.min(scaleX, scaleY) * 0.8;
      
      document.documentElement.style.setProperty('--interface-scale', interfaceScale.toString());
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  // === CLOSING ANIMATION SEQUENCE ===
  const triggerClose = () => {
    setButtonPressed(true);
    
    // Start closing animation sequence
    setTimeout(() => {
      setIsClosing(true);
      setShowCompSheet(true);
      
      // Show toast after comp-sheet starts sliding up
      setTimeout(() => {
        setShowToast(true);
      }, 400);
      
      // Don't call onClose - comp-sheet and toast stay visible for activity
      // The parent component will handle closing when activity is complete
    }, 150);
  };

  // === X KEY HANDLER ===
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Priority 1: Results screen exit
      if ((e.key === 'x' || e.key === 'X') && showResults && !isExiting) {
        setXKeyFrame(2); // Show pressed state
        
        setTimeout(() => {
          setIsExiting(true);
          setShowResults(false);
          setShowToast(false);
          setShowXKey(false);
          
          // Wait for exit animation to complete, then close
          setTimeout(() => {
            onClose();
          }, 800);
        }, 150);
        
        return;
      }
      
      // Priority 2: Journal close (original behavior)
      if ((e.key === 'x' || e.key === 'X') && !isAnimating && !isClosing && !showResults) {
        triggerClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAnimating, isClosing, showResults, isExiting, onClose]);

  // === OPENING ANIMATION ===
  useEffect(() => {
    let frameTimer: NodeJS.Timeout;
    
    const playOpeningAnimation = () => {
      let frame = 0;
      
      const advanceFrame = () => {
        if (frame < 4) {
          setCurrentFrame(frame);
          frame++;
          frameTimer = setTimeout(advanceFrame, 100); // 100ms per frame = smooth animation
        } else {
          // Animation complete - land on frame 4 (static journal)
          setCurrentFrame(4);
          setIsAnimating(false);
        }
      };
      
      advanceFrame();
    };

    playOpeningAnimation();

    return () => {
      if (frameTimer) clearTimeout(frameTimer);
    };
  }, []);

  // === BUTTON INTERACTION SYSTEM ===
  const getButtonFrame = () => {
    if (isAnimating) {
      console.log(`[Journal] Animation frame: ${currentFrame}`);
      return currentFrame; // During opening animation, use animation frames
    }
    
    // After animation, button is always highlighted (frame 6 by default, frame 7 when pressed)
    let frame = 6; // Default: highlighted button
    if (buttonPressed) frame = 7; // Highlighted + Depressed (X key or mouse click)
    
    console.log(`[Journal] Interactive frame: ${frame} (pressed: ${buttonPressed})`);
    return frame;
  };

  const handleButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering overlay close
    if (!isClosing) {
      triggerClose();
    }
  };

  return (
    <>
      {/* Overlay and journal only visible when not closing */}
      {!isClosing && (
        <InterfaceOverlay $isClosing={isClosing} onClick={!isClosing ? onClose : undefined}>
          <CardInterfaceContainer 
            $frame={getButtonFrame()}
            $isClosing={isClosing}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Interactive button area */}
            {!isAnimating && (
              <ButtonArea onClick={handleButtonClick} />
            )}
          </CardInterfaceContainer>
        </InterfaceOverlay>
      )}
      
      {/* Backdrop for comp-sheet (same blurred/darkened effect as journal) */}
      <CompSheetBackdrop $isVisible={showCompSheet} $isExiting={isExiting} />
      
      {/* Comp-sheet slides up from bottom and stays visible */}
      <CompSheetWrapper $isVisible={showCompSheet}>
        <CompSheetContainer $isVisible={showCompSheet} $isExiting={isExiting} />
      </CompSheetWrapper>
      
      {/* Toast message with cycling letters - scales up dramatically over 4 seconds */}
      <ToastMessageWrapper $visible={showToast}>
        <ToastContainer size="xl" expandable>
          <ToastContent>
            So you think you know <strong>{cyclingText}</strong>?
          </ToastContent>
        </ToastContainer>
      </ToastMessageWrapper>
      
      {/* Question toast with multiple choice options - slides up after TBI lands */}
      <QuestionToastWrapper $visible={showQuestion && !showResults}>
        <ToastContainer size="lg" expandable>
          <QuestionContent>
            <QuestionText>{currentQuestion.question}</QuestionText>
            <OptionsContainer>
              {currentQuestion.options.map((option, index) => (
                <OptionButton
                  key={index}
                  $isSelected={selectedOption === index}
                  onClick={() => {
                    setSelectedOption(index);
                    // Record the user's answer
                    setUserAnswers([...userAnswers, index]);
                    
                    // After selecting, wait 2 seconds then move to next question or show results
                    setTimeout(() => {
                      if (currentQuestionIndex < questions.length - 1) {
                        setCurrentQuestionIndex(currentQuestionIndex + 1);
                        setSelectedOption(null); // Reset selection for next question
                      } else {
                        // All questions answered - show results
                        setShowQuestion(false);
                        setTimeout(() => {
                          setShowResults(true);
                        }, 300);
                      }
                    }, 2000);
                  }}
                >
                  {option}
                </OptionButton>
              ))}
            </OptionsContainer>
          </QuestionContent>
        </ToastContainer>
      </QuestionToastWrapper>
      
      {/* Results screen - shows after completing all questions */}
      <QuestionToastWrapper $visible={showResults}>
        <ToastContainer size="lg" expandable>
          <QuestionContent>
            <QuestionText>
              You got {userAnswers.filter((answer, i) => answer === questions[i].correctAnswer).length} out of {questions.length} correct!
            </QuestionText>
            <ResultsNote>
              Check out your constellation to see your progress
            </ResultsNote>
          </QuestionContent>
        </ToastContainer>
      </QuestionToastWrapper>
      
      {/* X key indicator for closing results */}
      <XKeyIndicator $frame={xKeyFrame} $visible={showXKey} />
    </>
  );
} 