"use client";

import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import * as PIXI from 'pixi.js';
import { useGameStore } from '@/app/store/gameStore';
import { useTutorialStore } from '@/app/store/tutorialStore';
import { useResourceStore } from '@/app/store/resourceStore';
import { useKnowledgeStore } from '@/app/store/knowledgeStore';
import { useSceneStore } from '@/app/store/sceneStore';
import { GamePhase, Difficulty } from '@/app/types';
import { Day1SceneId } from '@/app/types/day1';
import { colors, typography } from '@/app/styles/pixelTheme';
import { ChangelogPopup } from '@/app/components/ui/ChangelogPopup';
import { getCurrentVersionString, hasRecentUpdates } from '@/app/utils/versionManager';
import GameDevConsole from '@/app/components/debug/GameDevConsole';

// Styled components for the container and UI elements
const FullScreenContainer = styled.div`
  width: 100vw;
  height: 100vh;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  margin: 0;
  padding: 0;
  overflow: hidden;
  background: #000;
  z-index: 1;
`;

const PixiContainer = styled.div`
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
`;

// Vignette overlay similar to telescope view in ConstellationView
const TitleVignette = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 100;
  background: radial-gradient(
    circle at center,
    transparent 0%,
    transparent 0%,
    rgba(0, 0, 0, 0.0) 45%,
    rgba(0, 0, 0, 0.1) 55%,
    rgba(0, 0, 0, 0.1) 65%,
    rgba(0, 0, 0, 0.2) 75%,
    rgba(0, 0, 0, 0.3) 85%,
    rgba(0, 0, 0, 0.4) 95%
  );
`;

const UIOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 10;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`;

// What's New button positioned above the vignette
const WhatsNewButton = styled.button`
  position: absolute;
  top: 60px;
  right: 140px;
  width: 178px; /* 89px sprite width * 2x scale */
  height: 36px; /* 18px sprite height * 2x scale */
  background-image: url('/images/title/whats-new-button.png');
  background-size: 356px 36px; /* Full sprite sheet size scaled by 2x (178*2, 18*2) */
  background-position: 0 0; /* Show first frame */
  background-repeat: no-repeat;
  border: none;
  cursor: pointer;
  pointer-events: auto;
  z-index: 101; /* Above vignette */
  image-rendering: pixelated;
  -webkit-image-rendering: pixelated;
  -moz-image-rendering: crisp-edges;
  transition: transform 0.1s ease;

  &:hover {
    transform: scale(1.05);
    background-position: -178px 0; /* Show second frame (-89px * 2x scale) */
  }

  &:active {
    transform: scale(0.98);
  }
`;

const GameVersion = styled.div`
  position: absolute;
  bottom: 24px;
  width: 100%;
  text-align: center;
  color: ${colors.textDim};
  font-size: ${typography.fontSize.sm};
  text-shadow: ${typography.textShadow.pixel};
  letter-spacing: 0.5px;
  opacity: 0.7;
  pointer-events: none;
  font-family: ${typography.fontFamily.pixel};
`;

export const TitleScreen: React.FC = () => {
  const pixiContainerRef = useRef<HTMLDivElement>(null);
  const pixiAppRef = useRef<PIXI.Application | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [showChangelog, setShowChangelog] = useState(false);
  const [startingGame, setStartingGame] = useState(false);
  const [loadingDev, setLoadingDev] = useState(false);
  
  const setPhase = useGameStore(state => state.setPhase);
  const setPlayerName = useGameStore(state => state.setPlayerName);
  const setDifficulty = useGameStore(state => state.setDifficulty);

  useEffect(() => {
    if (!pixiContainerRef.current) return;

    const containerElement = pixiContainerRef.current;

    // Create PIXI application using v8 API
    let app: PIXI.Application;
    
    const initializePixi = async () => {
      try {
        // Initialize PIXI application with v8 API
        app = new PIXI.Application();
        await app.init({
          width: window.innerWidth,
          height: window.innerHeight,
          backgroundAlpha: 0,
          resolution: window.devicePixelRatio || 1,
          autoDensity: true,
          antialias: false, // Pixel perfect rendering
        });

        pixiAppRef.current = app;
        containerElement.appendChild(app.canvas);

        // Sprite containers
        let backgroundSprite: PIXI.Sprite | null = null;
        let titleSprite: PIXI.Sprite | null = null;
        let playButtonSprite: PIXI.Sprite | null = null;
        let settingsButtonSprite: PIXI.Sprite | null = null;

        // Load textures and create sprites
        const loadAssets = async () => {
          try {
            // Load all textures - background + 4 cloud layers + UI elements
            const backgroundTexture = await PIXI.Assets.load('/images/title/title-screen-background.png');
            const cloudLayer1Texture = await PIXI.Assets.load('/images/title/title-screen-cloud-1.png');
            const cloudLayer2Texture = await PIXI.Assets.load('/images/title/title-screen-cloud-2.png');
            const cloudLayer3Texture = await PIXI.Assets.load('/images/title/title-screen-cloud-3.png');
            const cloudLayer4Texture = await PIXI.Assets.load('/images/title/title-screen-cloud-4.png');
            const titleTexture = await PIXI.Assets.load('/images/title/title-screen-title.png');
            const playButtonTexture = await PIXI.Assets.load('/images/title/play-button.png');
            const settingsButtonTexture = await PIXI.Assets.load('/images/title/test-button.png'); // Will be updated to settings sprite later

            // Set pixel-perfect rendering for all textures
            [backgroundTexture, cloudLayer1Texture, cloudLayer2Texture, cloudLayer3Texture, cloudLayer4Texture, titleTexture, playButtonTexture, settingsButtonTexture].forEach(texture => {
              texture.source.scaleMode = 'nearest'; // Pixel-perfect scaling
            });

            // Calculate scale factor to fit 640x360 coordinate system to screen
            const scaleX = app.screen.width / 640;
            const scaleY = app.screen.height / 360;
            const uniformScale = Math.min(scaleX, scaleY);

            // Create static background and cloud layers (all 640x360) with proper z-ordering
            // Z-order: background (back) → cloud-1 → cloud-2 → cloud-3 → cloud-4 (front) → UI
            
            backgroundSprite = new PIXI.Sprite(backgroundTexture);
            backgroundSprite.scale.set(uniformScale);
            backgroundSprite.x = (app.screen.width - 640 * uniformScale) / 2;
            backgroundSprite.y = (app.screen.height - 360 * uniformScale) / 2;
            app.stage.addChild(backgroundSprite);

            const cloudSprite1 = new PIXI.Sprite(cloudLayer1Texture);
            cloudSprite1.scale.set(uniformScale);
            cloudSprite1.x = (app.screen.width - 640 * uniformScale) / 2;
            cloudSprite1.y = (app.screen.height - 360 * uniformScale) / 2;
            app.stage.addChild(cloudSprite1);

            const cloudSprite2 = new PIXI.Sprite(cloudLayer2Texture);
            cloudSprite2.scale.set(uniformScale);
            cloudSprite2.x = (app.screen.width - 640 * uniformScale) / 2;
            cloudSprite2.y = (app.screen.height - 360 * uniformScale) / 2;
            app.stage.addChild(cloudSprite2);

            const cloudSprite3 = new PIXI.Sprite(cloudLayer3Texture);
            cloudSprite3.scale.set(uniformScale);
            cloudSprite3.x = (app.screen.width - 640 * uniformScale) / 2;
            cloudSprite3.y = (app.screen.height - 360 * uniformScale) / 2;
            app.stage.addChild(cloudSprite3);

            const cloudSprite4 = new PIXI.Sprite(cloudLayer4Texture);
            cloudSprite4.scale.set(uniformScale);
            cloudSprite4.x = (app.screen.width - 640 * uniformScale) / 2;
            cloudSprite4.y = (app.screen.height - 360 * uniformScale) / 2;
            app.stage.addChild(cloudSprite4);

            // Create title sprite (242x85) using 640x360 coordinate system
            titleSprite = new PIXI.Sprite(titleTexture);
            titleSprite.anchor.set(0.5);
            // Position using 640x360 coordinates, then scale to screen
            const titleWorldX = 320; // Center of 640px width
            const titleWorldY = 138; // Upper third of 360px height (30% of 360 = 108)
            titleSprite.x = (app.screen.width - 640 * uniformScale) / 2 + titleWorldX * uniformScale;
            titleSprite.y = (app.screen.height - 360 * uniformScale) / 2 + titleWorldY * uniformScale;
            titleSprite.scale.set(uniformScale);
            app.stage.addChild(titleSprite);

            // Helper function to create button sprite from sprite sheet (178x18, 2 frames) using 640x360 coordinates
            const createButtonSprite = (texture: PIXI.Texture, worldX: number, worldY: number, scaleMultiplier: number = 1) => {
              // Create texture for normal state (first frame: 0-88 pixels)
              const normalTexture = new PIXI.Texture({
                source: texture.source,
                frame: new PIXI.Rectangle(0, 0, 89, 18)
              });
              // Create texture for hover state (second frame: 89-177 pixels)  
              const hoverTexture = new PIXI.Texture({
                source: texture.source,
                frame: new PIXI.Rectangle(89, 0, 89, 18)
              });
              
              // Set pixel-perfect rendering for button textures
              normalTexture.source.scaleMode = 'nearest';
              hoverTexture.source.scaleMode = 'nearest';
              
              const sprite = new PIXI.Sprite(normalTexture);
              sprite.anchor.set(0.5);
              
              // Convert 640x360 world coordinates to screen coordinates
              sprite.x = (app.screen.width - 640 * uniformScale) / 2 + worldX * uniformScale;
              sprite.y = (app.screen.height - 360 * uniformScale) / 2 + worldY * uniformScale;
              
              // Use uniform scale with multiplier
              const buttonScale = uniformScale * scaleMultiplier;
              sprite.scale.set(buttonScale);
              sprite.interactive = true;
              sprite.cursor = 'pointer';
              
              // Store textures for state changes
              (sprite as any).normalTexture = normalTexture;
              (sprite as any).hoverTexture = hoverTexture;
              (sprite as any).baseScale = buttonScale;
              
              return sprite;
            };

            // Create play button sprite (178x18 sprite sheet) using 640x360 coordinates
            playButtonSprite = createButtonSprite(
              playButtonTexture, 
              320, // Center of 640px width
              198, // 55% of 360px height (0.55 * 360 = 198)
              1.0 // Normal scale - no extra multiplier needed
            );
            
            // Add hover and click effects
            playButtonSprite.on('pointerover', () => {
              // Subtle hover effect - just slight scale increase
              playButtonSprite!.scale.set((playButtonSprite as any).baseScale * 1.05);
            });
            playButtonSprite.on('pointerout', () => {
              // Return to normal state
              playButtonSprite!.texture = (playButtonSprite as any).normalTexture;
              playButtonSprite!.scale.set((playButtonSprite as any).baseScale);
            });
            playButtonSprite.on('pointerdown', () => {
              // Button press animation: switch to frame 2 and scale down
              playButtonSprite!.texture = (playButtonSprite as any).hoverTexture;
              playButtonSprite!.scale.set((playButtonSprite as any).baseScale * 0.98);
            });
            playButtonSprite.on('pointerup', () => {
              // Animate back to normal after a short delay
              setTimeout(() => {
                playButtonSprite!.texture = (playButtonSprite as any).normalTexture;
                playButtonSprite!.scale.set((playButtonSprite as any).baseScale * 1.05); // Back to hover state
              }, 100);
              
              // Trigger action after animation
              setTimeout(() => {
                handleStartGame();
              }, 150);
            });
            
            app.stage.addChild(playButtonSprite);

            // Create settings button sprite (178x18 sprite sheet) using 640x360 coordinates
            settingsButtonSprite = createButtonSprite(
              settingsButtonTexture, 
              320, // Center of 640px width
              223, // 62% of 360px height (0.62 * 360 = 223)
              1.0 // Normal scale - no extra multiplier needed
            );
            
            // Add hover and click effects
            settingsButtonSprite.on('pointerover', () => {
              // Subtle hover effect - just slight scale increase
              settingsButtonSprite!.scale.set((settingsButtonSprite as any).baseScale * 1.05);
            });
            settingsButtonSprite.on('pointerout', () => {
              // Return to normal state
              settingsButtonSprite!.texture = (settingsButtonSprite as any).normalTexture;
              settingsButtonSprite!.scale.set((settingsButtonSprite as any).baseScale);
            });
            settingsButtonSprite.on('pointerdown', () => {
              // Button press animation: switch to frame 2 and scale down
              settingsButtonSprite!.texture = (settingsButtonSprite as any).hoverTexture;
              settingsButtonSprite!.scale.set((settingsButtonSprite as any).baseScale * 0.98);
            });
            settingsButtonSprite.on('pointerup', () => {
              // Animate back to normal after a short delay
              setTimeout(() => {
                settingsButtonSprite!.texture = (settingsButtonSprite as any).normalTexture;
                settingsButtonSprite!.scale.set((settingsButtonSprite as any).baseScale * 1.05); // Back to hover state
              }, 100);
              
              // Trigger action after animation
              setTimeout(() => {
                handleOpenSettings();
              }, 150);
            });
            
            app.stage.addChild(settingsButtonSprite);



            setIsLoaded(true);
          } catch (error) {
            console.warn('Title screen sprites not found, using fallback display:', error);
            
            // Create fallback graphics if sprites aren't available
            createFallbackGraphics();
            setIsLoaded(true);
          }
        };

        // Fallback graphics if sprites aren't available
        const createFallbackGraphics = () => {
          // Fallback background
          const fallbackBg = new PIXI.Graphics();
          fallbackBg.rect(0, 0, app.screen.width, app.screen.height);
          fallbackBg.fill(0x1a1a2e);
          app.stage.addChild(fallbackBg);

          // Fallback title
          const titleText = new PIXI.Text('ROGUE RESIDENT', {
            fontFamily: 'Arial',
            fontSize: 64,
            fill: '#845AF5',
            align: 'center',
          });
          titleText.anchor.set(0.5);
          titleText.x = app.screen.width / 2;
          titleText.y = app.screen.height * 0.3;
          app.stage.addChild(titleText);

          // Fallback play button
          const playButton = new PIXI.Graphics();
          playButton.roundRect(-100, -25, 200, 50, 8);
          playButton.fill(0x845AF5);
          playButton.x = app.screen.width / 2;
          playButton.y = app.screen.height * 0.6;
          playButton.interactive = true;
          playButton.cursor = 'pointer';
          
          const playText = new PIXI.Text('Begin Residency', {
            fontFamily: 'Arial',
            fontSize: 24,
            fill: '#FFFFFF',
            align: 'center',
          });
          playText.anchor.set(0.5);
          playButton.addChild(playText);
          
          playButton.on('pointerdown', handleStartGame);
          app.stage.addChild(playButton);

          // Fallback settings button
          const settingsButton = new PIXI.Graphics();
          settingsButton.roundRect(-80, -20, 160, 40, 6);
          settingsButton.fill(0x4158D0);
          settingsButton.x = app.screen.width / 2;
          settingsButton.y = app.screen.height * 0.75;
          settingsButton.interactive = true;
          settingsButton.cursor = 'pointer';
          
          const settingsText = new PIXI.Text('Settings', {
            fontFamily: 'Arial',
            fontSize: 20,
            fill: '#FFFFFF',
            align: 'center',
          });
          settingsText.anchor.set(0.5);
          settingsButton.addChild(settingsText);
          
          settingsButton.on('pointerdown', handleOpenSettings);
          app.stage.addChild(settingsButton);
        };

        // No animation loop needed for static sky layers

        // Handle window resize
        const handleResize = () => {
          if (app && pixiContainerRef.current) {
            app.renderer.resize(window.innerWidth, window.innerHeight);
            
            // Reposition sprites on resize
            if (titleSprite) {
              titleSprite.x = app.screen.width / 2;
              titleSprite.y = app.screen.height * 0.3;
            }
            if (playButtonSprite) {
              playButtonSprite.x = app.screen.width / 2;
              playButtonSprite.y = app.screen.height * 0.6;
            }
            if (settingsButtonSprite) {
              settingsButtonSprite.x = app.screen.width / 2;
              settingsButtonSprite.y = app.screen.height * 0.7; // Updated position
            }

            if (backgroundSprite) {
              const scaleX = app.screen.width / 640;
              const scaleY = app.screen.height / 360;
              const uniformScale = Math.min(scaleX, scaleY);
              backgroundSprite.scale.set(uniformScale);
              backgroundSprite.x = (app.screen.width - 640 * uniformScale) / 2;
              backgroundSprite.y = (app.screen.height - 360 * uniformScale) / 2;
            }
          }
        };

        window.addEventListener('resize', handleResize);

        // Load assets
        await loadAssets();

        // Cleanup function
        return () => {
          window.removeEventListener('resize', handleResize);
          if (app) {
            if (pixiContainerRef.current && app.canvas) {
              pixiContainerRef.current.removeChild(app.canvas);
            }
            app.destroy(true);
          }
          pixiAppRef.current = null;
        };
      } catch (error) {
        console.error('Failed to initialize PIXI application:', error);
      }
    };

    // Initialize PIXI and store cleanup function
    let cleanup: (() => void) | undefined;
    initializePixi().then(cleanupFn => {
      cleanup = cleanupFn;
    });

    // Return cleanup function
    return () => {
      if (cleanup) {
        cleanup();
      }
    };
  }, []);

  const handleStartGame = () => {
    if (startingGame || loadingDev) return;
    
    setStartingGame(true);
    
    // Transition effect - fade out buttons, speed up scroll
    setTimeout(() => {
      // Initialize fresh game state
      const gameStore = useGameStore.getState();
      const newTime = gameStore.timeManager.resetToStartOfDay();
      useGameStore.setState({ 
        currentTime: newTime,
        daysPassed: 0
      });
      
      // Start tutorial immediately (silently, without welcome overlay)
      const tutorialStore = useTutorialStore.getState();
      tutorialStore.startTutorialSilently('micro_day', 'quinn_intro');
      
      setPhase(GamePhase.DAY);
    }, 800);
  };

  const handleOpenSettings = () => {
    // Settings functionality will be implemented later
    console.log('⚙️ Settings button clicked - functionality coming soon!');
  };

  return (
    <>
      <style jsx global>{`
        html, body {
          overflow: hidden;
          margin: 0;
          padding: 0;
          height: 100%;
          width: 100%;
        }
        
        * {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        
        *::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      
      <FullScreenContainer>
        {/* PIXI.js canvas container */}
        <PixiContainer ref={pixiContainerRef} />
        
        {/* UI overlay for non-sprite elements */}
        <UIOverlay>
          {/* Game version */}
          <GameVersion>
            {getCurrentVersionString()}
          </GameVersion>
        </UIOverlay>
        
        {/* What's New button positioned above vignette */}
        <WhatsNewButton onClick={() => setShowChangelog(true)} />
        
        {/* Vignette overlay - appears on top of everything except changelog */}
        <TitleVignette />
        
        {/* Changelog popup */}
        <ChangelogPopup 
          isOpen={showChangelog} 
          onClose={() => setShowChangelog(false)} 
        />
        
        {/* Debug Console - always available */}
        <GameDevConsole />
      </FullScreenContainer>
    </>
  );
}; 