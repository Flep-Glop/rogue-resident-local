import React, { useRef, useEffect } from 'react';
import * as PIXI from 'pixi.js';

interface TimeDilationEffectProps {
  onComplete?: () => void;
}

export const TimeDilationEffect: React.FC<TimeDilationEffectProps> = ({ onComplete }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<PIXI.Application | null>(null);

  useEffect(() => {
    let isMounted = true;
    let animationFrame: number | null = null;

    const createTimeDilationEffect = async () => {
      if (!containerRef.current || !isMounted) return;

      // Create PIXI application
      const app = new PIXI.Application();
      appRef.current = app;

      await app.init({
        width: window.innerWidth,
        height: window.innerHeight,
        backgroundColor: 0x000000,
        backgroundAlpha: 0,
        antialias: true,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
        resizeTo: undefined, // Disable auto-resize to avoid cleanup issues
      });

      if (!isMounted) {
        app.destroy(true, true);
        return;
      }

      containerRef.current.appendChild(app.canvas);

      // Create radial distortion effect
      const graphics = new PIXI.Graphics();
      app.stage.addChild(graphics);

      // Time dilation parameters
      let time = 0;
      const duration = 2000; // 2 seconds
      const centerX = app.screen.width / 2;
      const centerY = app.screen.height / 2;
      const maxRadius = Math.max(app.screen.width, app.screen.height) * 0.8;

      // Animation loop
      const animate = () => {
        if (!isMounted) return;

        time += 16; // ~60fps
        const progress = Math.min(time / duration, 1);
        
        // Easing function for smooth time dilation feel
        const ease = 1 - Math.pow(1 - progress, 3); // Ease-out cubic
        
        graphics.clear();
        
        // Create expanding rings with distortion effect
        const rings = 8;
        for (let i = 0; i < rings; i++) {
          const ringProgress = (ease + i * 0.1) % 1;
          const radius = ringProgress * maxRadius;
          const alpha = (1 - ringProgress) * 0.3;
          
          // Color shifts from purple to white as effect progresses
          const r = Math.floor(132 + (255 - 132) * ease);
          const g = Math.floor(90 + (255 - 90) * ease);
          const b = Math.floor(245);
          const color = (r << 16) | (g << 8) | b;
          
          if (radius > 0 && alpha > 0) {
            graphics.circle(centerX, centerY, radius);
            graphics.stroke({ 
              width: 2 + ease * 4, 
              color: color, 
              alpha: alpha 
            });
          }
        }

        // Create central burst effect
        if (ease > 0.3) {
          const burstIntensity = Math.sin((ease - 0.3) * Math.PI * 4) * 0.5 + 0.5;
          graphics.circle(centerX, centerY, 20 + burstIntensity * 40);
          graphics.fill({ 
            color: 0xffffff, 
            alpha: burstIntensity * 0.6 
          });
        }

        // Add radial lines for extra impact
        if (ease > 0.5) {
          const lines = 12;
          for (let i = 0; i < lines; i++) {
            const angle = (i / lines) * Math.PI * 2;
            const lineLength = (ease - 0.5) * maxRadius * 0.6;
            const startX = centerX + Math.cos(angle) * 50;
            const startY = centerY + Math.sin(angle) * 50;
            const endX = centerX + Math.cos(angle) * (50 + lineLength);
            const endY = centerY + Math.sin(angle) * (50 + lineLength);
            
            graphics.moveTo(startX, startY);
            graphics.lineTo(endX, endY);
            graphics.stroke({ 
              width: 3, 
              color: 0xffffff, 
              alpha: (1 - ease) * 0.8 
            });
          }
        }

        if (progress < 1) {
          animationFrame = requestAnimationFrame(animate);
        } else {
          // Effect complete
          setTimeout(() => {
            if (onComplete) onComplete();
          }, 200);
        }
      };

      animate();
    };

    createTimeDilationEffect();

    return () => {
      isMounted = false;
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
      if (appRef.current) {
        try {
          // Try to clean up gracefully
          appRef.current.stage.removeChildren();
          
          // Remove canvas from DOM before destroying
          if (appRef.current.canvas && appRef.current.canvas.parentNode) {
            appRef.current.canvas.parentNode.removeChild(appRef.current.canvas);
          }
          
          appRef.current.destroy(true, true);
        } catch (error) {
          // PIXI v8 ResizePlugin cleanup bug - ignore the error
          console.warn('PIXI cleanup warning (safe to ignore):', error);
          
          // Manual canvas cleanup if PIXI cleanup failed
          if (containerRef.current) {
            const canvas = containerRef.current.querySelector('canvas');
            if (canvas) {
              canvas.remove();
            }
          }
        } finally {
          appRef.current = null;
        }
      }
    };
  }, [onComplete]);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 2000,
        pointerEvents: 'none',
        mixBlendMode: 'screen', // Creates nice overlay effect
      }}
    />
  );
};

export default TimeDilationEffect; 