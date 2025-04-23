'use client';
import React, { forwardRef, ButtonHTMLAttributes, RefObject } from 'react';
import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';
import { playSound } from '@/app/core/sound/SoundManager.js';

// Button variants defined using class-variance-authority
export const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-sm text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        
        // Game specific styles
        pixel: "font-pixelated border-2 border-white bg-black hover:bg-white hover:text-black transition-colors duration-150 uppercase tracking-wider text-xs md:text-sm",
        glitch: "font-glitch relative overflow-hidden bg-black border border-teal-500 hover:bg-teal-900/20 text-teal-400 hover:text-teal-200",
        terminal: "font-mono border border-green-500 bg-black hover:bg-green-900/20 text-green-400 hover:text-green-200",
        nodeAction: "font-mono text-xs rounded-full bg-black/80 border border-blue-500 hover:bg-blue-900/40 text-blue-400 hover:text-blue-200 py-1",
        mapNav: "font-mono text-xs rounded-sm bg-black/90 border border-amber-500 hover:bg-amber-900/30 text-amber-300 hover:text-amber-100 py-1",
        dialogue: "font-mono text-sm rounded-sm bg-black border border-purple-600 hover:bg-purple-900/30 text-purple-300 hover:text-purple-100",
        journalAction: "font-mono text-xs md:text-sm bg-black/90 border border-rose-500 hover:bg-rose-900/30 text-rose-400 hover:text-rose-100",
      },
      size: {
        default: "h-10 px-4 py-2",
        xs: "h-7 rounded-sm px-2 text-xs",
        sm: "h-9 rounded-sm px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

// Extended Button props including CVA variants
export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

// Button component with ref forwarding
const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    // Handle hover effect for sound
    const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
      // Play hover sound
      playSound('hover');
      
      // Call original onMouseEnter handler if it exists
      if (props.onMouseEnter) {
        props.onMouseEnter(e);
      }
    };
    
    // Handle click effect for sound
    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      // Play click sound
      playSound('click');
      
      // Call original onClick handler if it exists
      if (props.onClick) {
        props.onClick(e);
      }
    };
    
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
        onMouseEnter={handleMouseEnter}
        onClick={handleClick}
      />
    );
  }
);

Button.displayName = "Button";

export { Button }; 