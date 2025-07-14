'use client';

import React, { useRef, useEffect } from 'react';
import * as PIXI from 'pixi.js';

/**
 * Manually mixes two hex colors.
 */
function mixColors(color1: number, color2: number, weight: number): number {
    const w1 = weight;
    const w2 = 1 - w1;

    const r1 = (color1 >> 16) & 0xff;
    const g1 = (color1 >> 8) & 0xff;
    const b1 = color1 & 0xff;

    const r2 = (color2 >> 16) & 0xff;
    const g2 = (color2 >> 8) & 0xff;
    const b2 = color2 & 0xff;

    const r = Math.round(r1 * w1 + r2 * w2);
    const g = Math.round(g1 * w1 + g2 * w2);
    const b = Math.round(b1 * w1 + b2 * w2);

    return (r << 16) | (g << 8) | b;
}

const ConstellationFXTestPage: React.FC = () => {
  const pixiContainerRef = useRef<HTMLDivElement>(null);
  const pixiApp = useRef<PIXI.Application | null>(null);

  useEffect(() => {
    let isMounted = true;
    const currentContainer = pixiContainerRef.current;

    if (!currentContainer || pixiApp.current) {
      return;
    }

    const app = new PIXI.Application();
    
    app.init({
        width: window.innerWidth,
        height: window.innerHeight,
        backgroundColor: 0x02001a,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
    }).then(() => {
        if (!isMounted) {
            app.destroy(true, true);
            return;
        }
        pixiApp.current = app;
        currentContainer.appendChild(app.canvas);

        // --- SIMPLIFIED COSMIC PLAYGROUND ---

        // Time control
        let timeScale = 1.0;

        // Simple visual effects
        let currentFilterMode = 0;
        const filterModes = ['none', 'blur', 'rainbow'];
        const blurFilter = new PIXI.BlurFilter({ strength: 8, quality: 4 });
        const colorMatrixFilter = new PIXI.ColorMatrixFilter();
        
        // NEW MAGICAL EFFECTS
        let pulseMode = false;
        let trailMode = false;
        let starTrails: PIXI.Graphics[] = [];
        const gravityWaves: { x: number, y: number, radius: number, strength: number }[] = [];
        
        const updateFilters = () => {
            const mode = filterModes[currentFilterMode];
            let filters: PIXI.Filter[] = [];
            
            switch(mode) {
                case 'blur':
                    filters = [blurFilter];
                    break;
                case 'rainbow':
                    colorMatrixFilter.reset();
                    colorMatrixFilter.hue(Math.sin(Date.now() * 0.001) * 180, false);
                    filters = [colorMatrixFilter];
                    break;
                default:
                    filters = [];
            }
            
            app.stage.filters = filters;
        };

        // 1. Simple starfield
        const starContainer = new PIXI.Container();
        app.stage.addChild(starContainer);

        const stars = Array.from({ length: 80 }, () => {
            const graphics = new PIXI.Graphics();
            const depth = Math.random() * 0.8 + 0.2;
            const size = depth * 3 + 2;
            const color = [0xadd8e6, 0xffd700, 0xfff0f5, 0xffffff][Math.floor(Math.random() * 4)];
            
            graphics.circle(0, 0, size);
            graphics.fill({ color: color, alpha: 0.9 });

            const initialX = Math.random() * app.screen.width;
            const initialY = Math.random() * app.screen.height;
            graphics.x = initialX;
            graphics.y = initialY;

            starContainer.addChild(graphics);

            return {
                sprite: graphics,
                initialX,
                initialY,
                depth,
                color,
                vx: 0,
                vy: 0,
            };
        });

        // 2. Simple connections
        const connections = new PIXI.Graphics();
        app.stage.addChild(connections);
        
        // 3. Mouse tracking
        const mousePos = { x: app.screen.width / 2, y: app.screen.height / 2 };
        let isMouseDown = false;

        app.stage.interactive = true;
        app.stage.on('pointermove', (event) => {
            mousePos.x = event.global.x;
            mousePos.y = event.global.y;
        });

        app.stage.on('pointerdown', (event) => {
            isMouseDown = true;
            const clickPos = event.global;

            // Simple supernova effect
            stars.forEach(star => {
                const dx = star.sprite.x - clickPos.x;
                const dy = star.sprite.y - clickPos.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist > 0 && dist < 200) {
                    const angle = Math.atan2(dy, dx);
                    const force = (1 - dist / 200) * 3;
                    star.vx += Math.cos(angle) * force;
                    star.vy += Math.sin(angle) * force;
                }
            });
        });

        app.stage.on('pointerup', () => {
            isMouseDown = false;
        });

        // Keyboard controls
        const handleKeyPress = (event: KeyboardEvent) => {
            if (event.key === 'f' || event.key === 'F') {
                currentFilterMode = (currentFilterMode + 1) % filterModes.length;
                updateFilters();
            } else if (event.key === 'r' || event.key === 'R') {
                // Reset stars
                stars.forEach(star => {
                    star.vx = 0;
                    star.vy = 0;
                    star.initialX = Math.random() * app.screen.width;
                    star.initialY = Math.random() * app.screen.height;
                });
            } else if (event.key === 'p' || event.key === 'P') {
                // Toggle pulse mode
                pulseMode = !pulseMode;
            } else if (event.key === 't' || event.key === 'T') {
                // Toggle trail mode
                trailMode = !trailMode;
                if (!trailMode) {
                    // Clear existing trails
                    starTrails.forEach(trail => trail.destroy());
                    starTrails = [];
                }
            } else if (event.key === 'b' || event.key === 'B') {
                // Birth new star at mouse position
                const newStar = new PIXI.Graphics();
                const color = [0xadd8e6, 0xffd700, 0xfff0f5, 0xffffff, 0xff69b4, 0x00ff7f][Math.floor(Math.random() * 6)];
                newStar.circle(0, 0, 0); // Start tiny
                newStar.fill({ color: color, alpha: 0 });
                newStar.x = mousePos.x;
                newStar.y = mousePos.y;
                starContainer.addChild(newStar);
                
                // Birth animation
                let birthProgress = 0;
                const birthTicker = () => {
                    birthProgress += 0.05;
                    const size = Math.sin(birthProgress * Math.PI) * 6;
                    const alpha = Math.sin(birthProgress * Math.PI);
                    
                    newStar.clear();
                    newStar.circle(0, 0, size);
                    newStar.fill({ color: color, alpha: alpha });
                    
                    if (birthProgress >= 1) {
                        // Add to stars array
                        stars.push({
                            sprite: newStar,
                            initialX: mousePos.x,
                            initialY: mousePos.y,
                            depth: Math.random() * 0.8 + 0.2,
                            color,
                            vx: 0,
                            vy: 0,
                        });
                        app.ticker.remove(birthTicker);
                    }
                };
                app.ticker.add(birthTicker);
            } else if (event.key === 'g' || event.key === 'G') {
                // Create gravity wave at mouse position
                gravityWaves.push({
                    x: mousePos.x,
                    y: mousePos.y,
                    radius: 0,
                    strength: 1
                });
            }
        };

        document.addEventListener('keydown', handleKeyPress);
        updateFilters();

        // Scroll wheel for time control
        app.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            const delta = e.deltaY > 0 ? 0.9 : 1.1;
            timeScale = Math.max(0.1, Math.min(3.0, timeScale * delta));
        });

        // --- MAIN ANIMATION LOOP ---
        let frame = 0;
        app.ticker.add((ticker) => {
            frame++;
            const deltaTime = ticker.deltaTime * timeScale;

            // Animate stars
            stars.forEach(star => {
                // Apply velocity and damping
                star.initialX += star.vx * deltaTime;
                star.initialY += star.vy * deltaTime;
                star.vx *= Math.pow(0.98, deltaTime);
                star.vy *= Math.pow(0.98, deltaTime);

                // Parallax
                const targetX = star.initialX + (mousePos.x - app.screen.width / 2) * star.depth * 0.1;
                const targetY = star.initialY + (mousePos.y - app.screen.height / 2) * star.depth * 0.1;
                star.sprite.x += (targetX - star.sprite.x) * 0.05 * deltaTime;
                star.sprite.y += (targetY - star.sprite.y) * 0.05 * deltaTime;

                // Enhanced breathing with pulse mode
                const breath = frame * 0.01 + star.initialX;
                let breathScale = 1 + Math.sin(breath) * 0.1 * star.depth;
                
                // PULSE MODE - all stars pulse together!
                if (pulseMode) {
                    const globalPulse = Math.sin(frame * 0.05) * 0.3 + 1;
                    breathScale *= globalPulse;
                }
                
                // Mouse glow
                const mouseDist = Math.hypot(star.sprite.x - mousePos.x, star.sprite.y - mousePos.y);
                const glowScale = Math.max(0, (1 - mouseDist / 120)) * 0.5;
                
                star.sprite.scale.set(breathScale + glowScale);
                
                // TRAIL MODE - create glowing trails
                if (trailMode && frame % 3 === 0) { // Every 3 frames for performance
                    const trail = new PIXI.Graphics();
                    trail.circle(0, 0, 1);
                    trail.fill({ color: star.color, alpha: 0.3 });
                    trail.x = star.sprite.x;
                    trail.y = star.sprite.y;
                    app.stage.addChild(trail);
                    starTrails.push(trail);
                    
                    // Fade and remove trails
                    let trailLife = 60;
                    const trailTicker = () => {
                        trailLife--;
                        trail.alpha *= 0.95;
                        if (trailLife <= 0 || trail.alpha < 0.01) {
                            trail.destroy();
                            const index = starTrails.indexOf(trail);
                            if (index > -1) starTrails.splice(index, 1);
                            app.ticker.remove(trailTicker);
                        }
                    };
                    app.ticker.add(trailTicker);
                }
            });

            // Draw connections
            connections.clear();
            for (let i = 0; i < stars.length; i++) {
                for (let j = i + 1; j < stars.length; j++) {
                    const star1 = stars[i];
                    const star2 = stars[j];
                    const dist = Math.hypot(star1.sprite.x - star2.sprite.x, star1.sprite.y - star2.sprite.y);
                    
                    if (dist < 120) {
                        const alpha = (1 - dist / 120) * 0.2;
                        connections.stroke({ color: mixColors(star1.color, star2.color, 0.5), alpha, width: 1 });
                        connections.moveTo(star1.sprite.x, star1.sprite.y);
                        connections.lineTo(star2.sprite.x, star2.sprite.y);
                    }
                }
            }

            // Animate rainbow filter
            if (currentFilterMode === 2) {
                colorMatrixFilter.reset();
                colorMatrixFilter.hue(Math.sin(frame * 0.02 * timeScale) * 180, false);
            }

            // Animate gravity waves
            for (let i = gravityWaves.length - 1; i >= 0; i--) {
                const wave = gravityWaves[i];
                wave.radius += 3 * deltaTime * timeScale;
                wave.strength *= 0.98;
                
                // Apply wave force to stars
                stars.forEach(star => {
                    const dx = star.sprite.x - wave.x;
                    const dy = star.sprite.y - wave.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    
                    if (Math.abs(dist - wave.radius) < 30) {
                        const force = wave.strength * 0.2;
                        const angle = Math.atan2(dy, dx);
                        star.vx += Math.cos(angle) * force;
                        star.vy += Math.sin(angle) * force;
                    }
                });
                
                // Remove weak waves
                if (wave.strength < 0.1 || wave.radius > 400) {
                    gravityWaves.splice(i, 1);
                }
            }

            // Occasional shooting star
            if (Math.random() < 0.001 * timeScale) {
                const shootingStar = new PIXI.Graphics();
                const startX = Math.random() * app.screen.width;
                const startY = -50;
                const endX = startX + (Math.random() * 200 + 200);
                const endY = startY + (Math.random() * 200 + 200);

                shootingStar.stroke({ color: 0xffffff, alpha: 0.9, width: 2 });
                shootingStar.moveTo(0, 0);
                shootingStar.lineTo(-30, 0);
                shootingStar.x = startX;
                shootingStar.y = startY;
                shootingStar.rotation = Math.atan2(endY - startY, endX - startX);
                app.stage.addChild(shootingStar);

                let lifetime = 0;
                const totalLifetime = 60;
                
                const ssTicker = (delta: PIXI.Ticker) => {
                    lifetime += delta.deltaTime * timeScale;
                    shootingStar.x += (endX - startX) / totalLifetime * delta.deltaTime * timeScale;
                    shootingStar.y += (endY - startY) / totalLifetime * delta.deltaTime * timeScale;
                    shootingStar.alpha = 1 - (lifetime / totalLifetime);

                    if (lifetime >= totalLifetime) {
                        app.ticker.remove(ssTicker);
                        shootingStar.destroy();
                    }
                };
                app.ticker.add(ssTicker);
            }
        });

        // Simple instructions
        const instructions = document.createElement('div');
        instructions.innerHTML = `
            <div style="position: fixed; top: 10px; left: 10px; color: white; font-family: monospace; font-size: 12px; z-index: 1000; background: rgba(0,0,0,0.7); padding: 10px; border-radius: 5px;">
                🌌 CLEAN COSMIC PLAYGROUND 🌌<br/>
                • Click: Push stars away<br/>
                • Move mouse: Parallax & glow<br/>
                • Scroll: Control time (${timeScale.toFixed(1)}x)<br/>
                • F: Cycle filters (${filterModes[currentFilterMode]})<br/>
                • R: Reset stars<br/>
                <br/>
                ✨ MAGICAL EFFECTS ✨<br/>
                • P: Toggle pulse mode<br/>
                • T: Toggle star trails<br/>
                • B: Birth star at mouse<br/>
                • G: Gravity wave at mouse
            </div>
        `;
        document.body.appendChild(instructions);

        return () => {
            document.body.removeChild(instructions);
            document.removeEventListener('keydown', handleKeyPress);
        };
    });

    const handleResize = () => {
        if (pixiApp.current) {
            pixiApp.current.renderer.resize(window.innerWidth, window.innerHeight);
        }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      isMounted = false;
      window.removeEventListener('resize', handleResize);
      if (pixiApp.current) {
        pixiApp.current.destroy(true, true);
        pixiApp.current = null;
      } else {
        app.destroy(true, true);
      }
    };
  }, []);

  return (
    <div
      ref={pixiContainerRef}
      style={{ width: '100vw', height: '100vh', overflow: 'hidden', cursor: 'none' }}
    />
  );
};

export default ConstellationFXTestPage; 