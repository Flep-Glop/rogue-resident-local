// app/components/PixelThemeProvider.tsx
'use client';
import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { clsx } from 'clsx';

// Interface definitions remain the same...
interface PixelTextProps {
  children: React.ReactNode;
  className?: string;
  pixelated?: boolean;
}

interface PixelButtonProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'default' | 'primary' | 'clinical' | 'qa' | 'educational' | 'success' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
}

interface PixelBoxProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'dark' | 'light' | 'clinical' | 'qa' | 'educational';
  bordered?: boolean;
}

// New interface for transitions
interface PixelTransitionProps {
  children: React.ReactNode;
  isActive?: boolean;
  type?: 'fade' | 'blur' | 'fade-blur' | 'pixelate' | 'fade-black';
  duration?: number;
  className?: string;
  onAnimationComplete?: () => void;
}

/**
 * PixelText - Typography component with pixel-perfect rendering
 * (This is the definitive version to be imported by other components)
 */
export function PixelText({
  children,
  className = '',
  pixelated = false
}: PixelTextProps) {
  return (
    <div
      className={`font-pixel ${pixelated ? 'text-rendering-pixelated' : ''} ${className}`}
      style={pixelated ? { imageRendering: 'pixelated' } : undefined}
    >
      {children}
    </div>
  );
}

/**
 * PixelButton - Interactive component with consistent tactile feedback
 */
export function PixelButton({
  children,
  className = '',
  onClick,
  disabled = false,
  variant = 'default',
  size = 'md',
  icon
}: PixelButtonProps) {
  const variantClasses = {
    default: "bg-gray-800 border-gray-900 hover:bg-gray-700 text-white",
    primary: "bg-blue-700 border-blue-900 hover:bg-blue-600 text-white",
    clinical: "bg-clinical border-clinical-dark hover:bg-clinical-light text-white",
    qa: "bg-qa border-qa-dark hover:bg-qa-light text-white",
    educational: "bg-educational border-educational-dark hover:bg-educational-light text-white",
    success: "bg-green-700 border-green-900 hover:bg-green-600 text-white",
    danger: "bg-red-700 border-red-900 hover:bg-red-600 text-white"
  };

  const sizeClasses = {
    sm: "px-2 py-1 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base"
  };

  return (
    <motion.button
      className={`
        font-pixel border-2 pixel-borders
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
      onClick={onClick}
      disabled={disabled}
      whileHover={disabled ? {} : { y: -2 }}
      whileTap={disabled ? {} : { y: 1 }}
      style={{ boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.1)" }}
    >
      <div className="flex items-center justify-center">
        {icon && <span className="mr-2">{icon}</span>}
        {children}
      </div>
    </motion.button>
  );
}

/**
 * PixelBox - Container with pixel-perfect borders
 */
export function PixelBox({
  children,
  className = '',
  variant = 'default',
  bordered = true
}: PixelBoxProps) {
  const variantClasses = {
    default: "bg-black backdrop-blur-[2px]",
    dark: "bg-black backdrop-blur-[2px]",
    light: "bg-[#0f1216] backdrop-blur-[2px]",
    clinical: "bg-black backdrop-blur-[2px]",
    qa: "bg-black backdrop-blur-[2px]",
    educational: "bg-black backdrop-blur-[2px]"
  };

  return (
    <div
      className={`
        ${variantClasses[variant]}
        ${bordered ? 'pixel-borders' : ''}
        ${className}
      `}
      style={bordered ? { boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.02)" } : undefined}
    >
      {children}
    </div>
  );
}

/**
 * PixelTransition - Chamber Pattern compliant transition component
 * Uses direct DOM manipulation for optimal performance with animations
 */
export function PixelTransition({
  children,
  isActive = true,
  type = 'fade-blur',
  duration = 525,
  className = '',
  onAnimationComplete
}: PixelTransitionProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [styles, setStyles] = useState({
    backgroundColor: 'black',
    opacity: 0,
    transition: `opacity ${duration}ms ease-in-out`,
    pointerEvents: 'none' as 'none' | 'auto',
    zIndex: 20,
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  });
  const [showEffects, setShowEffects] = useState(false);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    let raf: number;
    
    if (isActive) {
      // Add active class to HTML element
      document.documentElement.classList.add('pixel-transition-active');

      // First set initial styles without transition to avoid initial animation
      setStyles({
        backgroundColor: 'black',
        opacity: 0,
        transition: 'none',
        pointerEvents: 'none',
        zIndex: 20,
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
      });
      
      // Show transition effects
      setShowEffects(true);

      // Use requestAnimationFrame to ensure styles are applied before adding transition
      raf = window.requestAnimationFrame(() => {
        timeoutId = setTimeout(() => {
          // Add transition and fade in
          setStyles({
            backgroundColor: 'black',
            opacity: 1,
            transition: `all ${duration}ms ease-in-out`,
            pointerEvents: 'auto',
            zIndex: 20,
            left: 0,
            right: 0,
            top: 0,
            bottom: 0,
          });
        }, 20); // Small delay to ensure initial styles are applied
      });
    } else {
      // Fade out
      setStyles({
        ...styles,
        backgroundColor: 'black',
        opacity: 0,
        pointerEvents: 'none',
        zIndex: 20,
      });
      
      // Hide effects and remove active class after transition
      timeoutId = setTimeout(() => {
        setShowEffects(false);
        document.documentElement.classList.remove('pixel-transition-active');
        if (onAnimationComplete) {
          onAnimationComplete();
        }
      }, duration);
    }

    return () => {
      clearTimeout(timeoutId);
      if (raf) window.cancelAnimationFrame(raf);
      document.documentElement.classList.remove('pixel-transition-active');
    };
  }, [isActive, duration, onAnimationComplete]);

  return (
    <div
      className={clsx(
        'fixed inset-0 flex items-center justify-center overflow-hidden',
        isActive && 'transition-active',
        className
      )}
      ref={containerRef}
      style={styles}
      onTransitionEnd={() => {
        if (isActive && onAnimationComplete) {
          onAnimationComplete();
        }
      }}
    >
      {showEffects && (
        <div className="absolute inset-0 overflow-hidden z-10 pointer-events-none">
          {/* Enhanced horizontal glow lines */}
          <div className="absolute top-1/4 w-full h-[3px] bg-gradient-to-r from-transparent via-cyan-300 to-transparent opacity-0 pointer-events-none"
            style={{ animation: `glowLine 1s ease-in-out forwards, pulse 1.5s ${duration * 0.3}ms infinite` }}
          />
          <div className="absolute top-1/2 w-full h-[3px] bg-gradient-to-r from-transparent via-purple-300 to-transparent opacity-0 pointer-events-none"
            style={{ animation: `glowLine 1s ease-in-out 0.2s forwards, pulse 1.5s ${duration * 0.4}ms infinite` }}
          />
          <div className="absolute top-3/4 w-full h-[3px] bg-gradient-to-r from-transparent via-cyan-300 to-transparent opacity-0 pointer-events-none"
            style={{ animation: `glowLine 1s ease-in-out 0.4s forwards, pulse 1.5s ${duration * 0.5}ms infinite` }}
          />
          
          {/* Enhanced diagonal glow lines */}
          <div className="absolute left-0 top-0 w-[300%] h-[3px] bg-gradient-to-r from-transparent via-fuchsia-300 to-transparent opacity-0 origin-top-left pointer-events-none"
            style={{ 
              transform: 'rotate(45deg) translateX(-50%)',
              animation: `glowLine 1.5s ease-in-out 0.3s forwards, pulse 2s ${duration * 0.2}ms infinite`
            }}
          />
          <div className="absolute right-0 top-0 w-[300%] h-[3px] bg-gradient-to-r from-transparent via-cyan-300 to-transparent opacity-0 origin-top-right pointer-events-none"
            style={{ 
              transform: 'rotate(-45deg) translateX(50%)',
              animation: `glowLine 1.5s ease-in-out 0.5s forwards, pulse 2s ${duration * 0.3}ms infinite`
            }}
          />
        </div>
      )}
      
      {/* Simple passthrough for children with no wrapping div */}
      {children}
    </div>
  );
}

// Add keyframes to CSS
const keyframes = `
@keyframes pulse {
  0% { opacity: 0.4; transform: scale(0.95); }
  50% { opacity: 0.8; transform: scale(1.05); }
  100% { opacity: 0.4; transform: scale(0.95); }
}

@keyframes slideInOut {
  0% { transform: translateX(-100%); opacity: 0; }
  30% { transform: translateX(0); opacity: 1; }
  70% { transform: translateX(0); opacity: 1; }
  100% { transform: translateX(100%); opacity: 0; }
}

@keyframes fadeInOut {
  0% { opacity: 0; }
  30% { opacity: 1; }
  70% { opacity: 1; }
  100% { opacity: 0; }
}

@keyframes glowLine {
  0% { opacity: 0; transform: scaleX(0.1) translateX(-50%); filter: blur(3px); }
  50% { opacity: 1; filter: blur(4px); }
  100% { opacity: 0.8; transform: scaleX(1) translateX(0); filter: blur(2px); }
}

@keyframes rotateFade {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
`;

// Insert the keyframes directly into the document
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = keyframes;
  style.setAttribute('id', 'pixel-transition-keyframes');
  
  // Avoid duplicating style elements
  if (!document.getElementById('pixel-transition-keyframes')) {
    document.head.appendChild(style);
  }
}

// Replace GlobalStyles with a React component that injects styles
const GlobalAnimationStyles = () => (
  <style jsx global>{`
    @keyframes pulse {
      0% { opacity: 0.6; }
      50% { opacity: 1; }
      100% { opacity: 0.6; }
    }
    
    @keyframes slideInOut {
      0% { transform: translateX(-200%); opacity: 0; }
      20% { opacity: 1; }
      80% { opacity: 1; }
      100% { transform: translateX(200%); opacity: 0; }
    }
    
    @keyframes fadeInOut {
      0% { opacity: 0; }
      25% { opacity: 1; }
      75% { opacity: 1; }
      100% { opacity: 0; }
    }
    
    @keyframes glowLine {
      0% { transform: translateX(-100%); width: 0; opacity: 0; }
      10% { opacity: 1; width: 100%; }
      90% { opacity: 1; width: 100%; }
      100% { transform: translateX(100%); opacity: 0; }
    }
    
    @keyframes rotateFade {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    .html.pixel-transition-active {
      cursor: wait;
    }
  `}</style>
);

/**
 * PixelThemeProvider - Context provider for consistent theming
 */
export default function PixelThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      <GlobalAnimationStyles />
      {children}

      {/* Global pixel styles */}
      <style jsx global>{`
        /* Pixel rendering quality */
        .text-rendering-pixelated {
          text-rendering: optimizeSpeed;
          -webkit-font-smoothing: none;
        }

        /* Custom pixel borders with inset highlight */
        .pixel-borders {
          position: relative;
          border: 2px solid #0f172a;
          box-shadow: 0 0 0 1px rgba(0,0,0,0.3);
        }

        .pixel-borders::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 1px;
          height: 1px;
          background-color: rgba(255,255,255,0.2);
        }

        .pixel-borders-thin {
          position: relative;
          border: 1px solid #0f172a;
        }

        /* Thicker borders for emphasis */
        .pixel-borders-lg {
          position: relative;
          border: 3px solid #0f172a;
          box-shadow: 0 0 0 1px rgba(0,0,0,0.4);
        }

        .pixel-borders-lg::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 2px;
          height: 2px;
          background-color: rgba(255,255,255,0.2);
        }

        /* Glow effects */
        .pixel-glow {
          text-shadow: 0 0 4px currentColor;
        }

        /* Font size for tiny text */
        .text-2xs {
          font-size: 0.625rem;
          line-height: 0.75rem;
        }

        /* Transition animations */
        .fade-in {
          animation: fadeIn 750ms ease-in-out forwards;
        }
        
        .fade-out {
          animation: fadeOut 750ms ease-in-out forwards;
        }
        
        .blur-in {
          animation: blurIn 750ms ease-in-out forwards;
        }
        
        .blur-out {
          animation: blurOut 750ms ease-in-out forwards;
        }
        
        .pixelate-in {
          animation: pixelateIn 750ms ease-in-out forwards;
          image-rendering: pixelated;
        }
        
        .pixelate-out {
          animation: pixelateOut 750ms ease-in-out forwards;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes fadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }
        
        @keyframes blurIn {
          from { filter: blur(8px); }
          to { filter: blur(0); }
        }
        
        @keyframes blurOut {
          from { filter: blur(0); }
          to { filter: blur(8px); }
        }
        
        @keyframes pixelateIn {
          from { filter: blur(5px) contrast(0.8) brightness(1.2); }
          to { filter: none; }
        }
        
        @keyframes pixelateOut {
          from { filter: none; }
          to { filter: blur(5px) contrast(0.8) brightness(1.2); }
        }
      `}</style>
    </>
  );
}