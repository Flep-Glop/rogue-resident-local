'use client';

import { useState, useEffect } from 'react';
import { colors, typography } from '@/app/styles/pixelTheme';

interface TypewriterTextProps {
  text: string;
  speed?: number; // milliseconds per character
  onComplete?: () => void;
  onSkip?: () => void;
  onTypingStart?: () => void;
  onTypingComplete?: () => void;
  clickToSkip?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export default function TypewriterText({ 
  text, 
  speed = 30, 
  onComplete, 
  onSkip,
  onTypingStart,
  onTypingComplete,
  clickToSkip = true,
  className,
  style 
}: TypewriterTextProps) {
  const [isTyping, setIsTyping] = useState(false);
  const [typedText, setTypedText] = useState('');

  // Reset and start typing when text changes
  useEffect(() => {
    if (!text) {
      setTypedText('');
      setIsTyping(false);
      return;
    }
    
    setIsTyping(true);
    setTypedText('');
    
    // Call onTypingStart when typing begins
    if (onTypingStart) {
      onTypingStart();
    }
    
    let charIndex = 0;
    
    const intervalId = setInterval(() => {
      if (charIndex < text.length) {
        charIndex++;
        setTypedText(text.substring(0, charIndex));
      } else {
        setIsTyping(false);
        clearInterval(intervalId);
        if (onTypingComplete) {
          onTypingComplete();
        }
        if (onComplete) {
          onComplete();
        }
      }
    }, speed);
    
    return () => clearInterval(intervalId);
  }, [text, speed, onComplete, onTypingStart, onTypingComplete]);

  // Skip typing animation
  const handleSkipTyping = () => {
    if (isTyping && text) {
      setTypedText(text);
      setIsTyping(false);
      if (onTypingComplete) {
        onTypingComplete();
      }
      if (onSkip) {
        onSkip();
      }
      if (onComplete) {
        onComplete();
      }
    }
  };

  const defaultStyle: React.CSSProperties = {
    fontSize: typography.fontSize.md,
    lineHeight: '1.6',
    color: colors.text,
    cursor: clickToSkip && isTyping ? 'pointer' : 'default',
    position: 'relative',
    display: 'inline-block',
    width: '100%'
  };

  const mergedStyle = { ...defaultStyle, ...style };

  return (
    <div
      onClick={clickToSkip ? handleSkipTyping : undefined}
      className={className}
      style={mergedStyle}
    >
      {typedText}
      {isTyping && (
        <span
          style={{
            marginLeft: '4px',
            color: colors.highlight,
            animation: 'typewriter-blink 1s infinite'
          }}
        >
          ▋
        </span>
      )}
      <style jsx>{`
        @keyframes typewriter-blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
} 