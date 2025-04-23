'use client';
import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

interface GameTooltipProps {
  title?: string; // Title at the top
  text: React.ReactNode; // Main description text - allow ReactNode instead of just string
  requirementText?: string; // Text for requirements (e.g., "Requires 25 Insight")
  requirementMet?: boolean; // Whether the player meets the requirement
  className?: string;
  direction?: 'top' | 'bottom' | 'left' | 'right';
  style?: 'default' | 'insight' | 'momentum' | 'boast' | 'action' | 'tangent' | 'reframe' | 'peer_review';
  children: React.ReactNode;
  width?: 'auto' | 'sm' | 'md' | 'lg';
  delay?: number;
}

/**
 * A pixel-art styled tooltip component for game UI elements
 * Uses a globally positioned div to render tooltips without affecting layout
 */
export default function GameTooltip({
  title,
  text,
  requirementText,
  requirementMet = true,
  className = '',
  direction = 'top',
  style = 'default',
  children,
  width = 'auto',
  delay = 300
}: GameTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [tooltipContent, setTooltipContent] = useState<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Set up tooltip visibility with delay to prevent flashing on accidental hover
  useEffect(() => {
    if (isHovered) {
      timeoutRef.current = setTimeout(() => {
        setIsVisible(true);
      }, delay);
    } else {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      setIsVisible(false);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isHovered, delay]);

  // Get the background style for the tooltip
  const getTooltipStyles = () => {
    // Common styles for all tooltips
    const baseClasses = 'font-pixel text-xs pointer-events-none bg-black/95 border';
    const widthClasses = {
      auto: 'min-w-[150px] max-w-[250px]',
      sm: 'w-[180px]',
      md: 'w-[220px]',
      lg: 'w-[280px]'
    };

    // Get border color based on style
    let borderColor = 'border-gray-600';
    switch (style) {
      case 'insight':
      case 'tangent':
        borderColor = 'border-blue-600';
        break;
      case 'reframe':
        borderColor = 'border-purple-600';
        break;
      case 'peer_review':
        borderColor = 'border-green-600';
        break;
      case 'momentum':
        borderColor = 'border-orange-600';
        break;
      case 'boast':
        borderColor = 'border-amber-500';
        break;
      case 'action':
        borderColor = 'border-purple-600';
        break;
    }

    return `${baseClasses} ${widthClasses[width]} ${borderColor}`;
  };

  // Get the title color based on style
  const getTitleColor = () => {
    switch (style) {
      case 'insight':
      case 'tangent':
        return 'text-blue-400';
      case 'reframe':
        return 'text-purple-400';
      case 'peer_review':
        return 'text-green-400';
      case 'momentum':
        return 'text-orange-400';
      case 'boast':
        return 'text-amber-400';
      case 'action':
        return 'text-purple-400';
      default:
        return 'text-gray-300';
    }
  };

  // This component is rendered as an overlay on the container element
  const TooltipOverlay = () => {
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const tooltipRef = useRef<HTMLDivElement>(null);

    // Calculate and update tooltip position
    useEffect(() => {
      if (!containerRef.current || !tooltipRef.current) return;
      
      const updatePosition = () => {
        if (!containerRef.current || !tooltipRef.current) return;
        
        const containerRect = containerRef.current.getBoundingClientRect();
        const tooltipRect = tooltipRef.current.getBoundingClientRect();
        
        let top = 0;
        let left = 0;
        
        switch (direction) {
          case 'top':
            top = containerRect.top - tooltipRect.height - 8;
            left = containerRect.left + (containerRect.width / 2) - (tooltipRect.width / 2);
            break;
          case 'bottom':
            top = containerRect.bottom + 8;
            left = containerRect.left + (containerRect.width / 2) - (tooltipRect.width / 2);
            break;
          case 'left':
            top = containerRect.top + (containerRect.height / 2) - (tooltipRect.height / 2);
            left = containerRect.left - tooltipRect.width - 8;
            break;
          case 'right':
            top = containerRect.top + (containerRect.height / 2) - (tooltipRect.height / 2);
            left = containerRect.right + 8;
            break;
        }
        
        // Keep tooltip on screen
        const rightEdge = left + tooltipRect.width;
        const bottomEdge = top + tooltipRect.height;
        
        if (left < 8) left = 8;
        if (rightEdge > window.innerWidth - 8) {
          left = window.innerWidth - tooltipRect.width - 8;
        }
        
        if (top < 8) top = 8;
        if (bottomEdge > window.innerHeight - 8) {
          top = window.innerHeight - tooltipRect.height - 8;
        }
        
        setPosition({ top, left });
      };
      
      // Initial position update
      updatePosition();
      
      // Update position on scroll or resize
      window.addEventListener('scroll', updatePosition);
      window.addEventListener('resize', updatePosition);
      
      return () => {
        window.removeEventListener('scroll', updatePosition);
        window.removeEventListener('resize', updatePosition);
      };
    }, []);
    
    return (
      <div 
        ref={tooltipRef}
        className={`${getTooltipStyles()} absolute transform transition-opacity duration-200 opacity-100 pixel-borders-thin z-[9999]`}
        style={{
          position: 'fixed',
          top: `${position.top}px`,
          left: `${position.left}px`,
          pointerEvents: 'none',
          overflow: 'hidden'
        }}
        role="tooltip"
      >
        {/* Tooltip content with title and description */}
        <div className="flex flex-col">
          {/* Title section */}
          {title && (
            <div className={`px-3 py-1 font-bold ${getTitleColor()} border-b border-gray-700 text-center`}>
              {title}
            </div>
          )}
          
          {/* Description section */}
          <div className="p-3 text-white">
            {text}
            
            {/* Requirement text if provided */}
            {requirementText && (
              <div className={`mt-1 ${requirementMet ? 'text-green-400' : 'text-red-400'} text-xs`}>
                {requirementText}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Setup overlay container for the tooltip
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Create a div for the tooltip in the DOM
    if (!tooltipContent) {
      const div = document.createElement('div');
      div.style.position = 'fixed';
      div.style.top = '0';
      div.style.left = '0';
      div.style.width = '100%';
      div.style.height = '100%';
      div.style.pointerEvents = 'none';
      div.style.zIndex = '9999';
      div.setAttribute('id', 'tooltip-container');
      setTooltipContent(div);
      document.body.appendChild(div);
    }
    
    return () => {
      if (tooltipContent) {
        document.body.removeChild(tooltipContent);
      }
    };
  }, [tooltipContent]);

  return (
    <>
      <div
        ref={containerRef}
        className={`inline-flex ${className}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onFocus={() => setIsHovered(true)}
        onBlur={() => setIsHovered(false)}
      >
        {children}
      </div>
      
      {isVisible && tooltipContent && createPortal(
        <TooltipOverlay />,
        tooltipContent
      )}
    </>
  );
} 