'use client';

import React, { useRef, useEffect } from 'react';
import * as PIXI from 'pixi.js';

interface PixiDayNightAnimationProps {
  transitionTo: 'day' | 'night';
  onComplete: () => void;
}

const PixiDayNightAnimation: React.FC<PixiDayNightAnimationProps> = ({ transitionTo, onComplete }) => {
  const pixiContainerRef = useRef<HTMLDivElement>(null);
  const pixiApp = useRef<PIXI.Application | null>(null);

  console.log('[PixiDayNightAnimation] Component mounted with:', { transitionTo });

  useEffect(() => {
    let isMounted = true;
    const currentContainer = pixiContainerRef.current;

    console.log('[PixiDayNightAnimation] useEffect running, container:', currentContainer);

    if (!currentContainer || pixiApp.current) {
      console.log('[PixiDayNightAnimation] Early return - no container or app already exists');
      return;
    }

    const app = new PIXI.Application();
    
    console.log('[PixiDayNightAnimation] Starting PixiJS initialization');
    
    app.init({
        width: window.innerWidth,
        height: window.innerHeight,
        backgroundColor: 0x1a202c, // Dark blue, similar to your theme
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
    }).then(() => {
        if (!isMounted) {
            console.log('[PixiDayNightAnimation] Component unmounted during init, destroying app');
            app.destroy(true, true);
            return;
        }
        
        console.log('[PixiDayNightAnimation] PixiJS initialized successfully');
        pixiApp.current = app;
        currentContainer.appendChild(app.canvas);

        console.log('[PixiDayNightAnimation] Canvas appended, creating graphics');

        const sun = new PIXI.Graphics();
        sun.circle(0, 0, 50);
        sun.fill({ color: 0xFFFDD0 });

        const moon = new PIXI.Graphics();
        moon.circle(0, 0, 40);
        moon.fill({ color: 0xD3D3D3 });

        const stars: PIXI.Graphics[] = [];
        for (let i = 0; i < 200; i++) {
          const star = new PIXI.Graphics();
          star.circle(0, 0, Math.random() * 2);
          star.fill({ color: 0xFFFFFF, alpha: Math.random() });
          star.x = Math.random() * app.screen.width;
          star.y = Math.random() * app.screen.height;
          star.alpha = 0;
          stars.push(star);
          app.stage.addChild(star);
        }

        app.stage.addChild(sun);
        app.stage.addChild(moon);

        console.log('[PixiDayNightAnimation] Graphics created, starting animation for:', transitionTo);

        const animationDuration = 3000; // 3 seconds
        const startTime = Date.now();
        
        const baseColor = new PIXI.Color(0x1a202c);
        const baseR = baseColor.red;
        const baseG = baseColor.green;
        const baseB = baseColor.blue;

        const animate = () => {
          const elapsed = Date.now() - startTime;
          const progress = Math.min(elapsed / animationDuration, 1);

          if (transitionTo === 'night') {
            // Sun sets
            sun.y = (app.screen.height / 2) + (progress * app.screen.height);
            sun.x = app.screen.width / 2;
            
            // Moon rises
            moon.y = (app.screen.height * 1.5) - (progress * app.screen.height);
            moon.x = app.screen.width / 2;
            
            // Stars fade in
            stars.forEach(star => star.alpha = progress);

            // Background darkens
            const p = 1 - progress;
            app.renderer.background.color = new PIXI.Color([baseR * p, baseG * p, baseB * p]);

          } else {
            // Day transition
            sun.y = (app.screen.height * 1.5) - (progress * app.screen.height);
            sun.x = app.screen.width / 2;
            moon.y = (app.screen.height / 2) + (progress * app.screen.height);
            moon.x = app.screen.width / 2;
            stars.forEach(star => star.alpha = 1 - progress);
            
            const p = progress;
            app.renderer.background.color = new PIXI.Color([baseR * p, baseG * p, baseB * p]);
          }

          if (progress < 1) {
            requestAnimationFrame(animate);
          } else {
            console.log('[PixiDayNightAnimation] Animation completed');
            if (isMounted) onComplete();
          }
        };

        console.log('[PixiDayNightAnimation] Starting animation loop');
        requestAnimationFrame(animate);
    }).catch((error) => {
        console.error('[PixiDayNightAnimation] PixiJS initialization failed:', error);
    });

    const handleResize = () => {
        if (pixiApp.current) {
            pixiApp.current.renderer.resize(window.innerWidth, window.innerHeight);
            // TODO: Reposition elements on resize
        }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      isMounted = false;
      console.log('[PixiDayNightAnimation] Cleaning up');
      window.removeEventListener('resize', handleResize);
      if (pixiApp.current) {
        pixiApp.current.destroy(true, true);
        pixiApp.current = null;
      }
    };
  }, [onComplete, transitionTo]);

  return (
    <div
      ref={pixiContainerRef}
      style={{ 
        position: 'absolute', 
        inset: 0, 
        zIndex: 40 // In front of other content but behind summary card (z-50)
      }}
    />
  );
};

export default PixiDayNightAnimation; 