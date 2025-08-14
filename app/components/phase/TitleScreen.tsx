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

        // Texture and sprite containers
        let backgroundSprite: PIXI.TilingSprite | null = null;
        let titleSprite: PIXI.Sprite | null = null;
        let playButtonSprite: PIXI.Sprite | null = null;
        let testButtonSprite: PIXI.Sprite | null = null;

        let scrollSpeed = 0.2; // Much slower scroll for smoother effect

        // Load textures and create sprites
        const loadAssets = async () => {
          try {
            // Load all textures
            const backgroundTexture = await PIXI.Assets.load('/images/title/title-background.png');
            const titleTexture = await PIXI.Assets.load('/images/title/title-sprite.png');
            const playButtonTexture = await PIXI.Assets.load('/images/title/play-button.png');
            const testButtonTexture = await PIXI.Assets.load('/images/title/test-button.png');


            // Set pixel-perfect rendering for all textures
            [backgroundTexture, titleTexture, playButtonTexture, testButtonTexture].forEach(texture => {
              texture.source.scaleMode = 'nearest'; // Pixel-perfect scaling
            });

            // Create scrolling background (3400x360, show 640x360 viewport)
            backgroundSprite = new PIXI.TilingSprite(backgroundTexture, app.screen.width, app.screen.height);
            backgroundSprite.tileScale.set(
              app.screen.width / 640,  // Scale to fit screen width
              app.screen.height / 360  // Scale to fit screen height
            );
            // Darken the background by 60%
            backgroundSprite.tint = 0x666666; // 40% brightness (60% darker)
            app.stage.addChild(backgroundSprite);

            // Create title sprite (246x90)
            titleSprite = new PIXI.Sprite(titleTexture);
            titleSprite.anchor.set(0.5);
            titleSprite.x = app.screen.width / 2;
            titleSprite.y = app.screen.height * 0.3; // Position in upper third
            
            // Scale title sprite appropriately for screen size
            const titleScale = Math.min(app.screen.width / 800, app.screen.height / 600) * 1.5;
            titleSprite.scale.set(titleScale);
            app.stage.addChild(titleSprite);

            // Helper function to create button sprite from sprite sheet (178x18, 2 frames)
            const createButtonSprite = (texture: PIXI.Texture, x: number, y: number, scaleMultiplier: number = 1) => {
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
              sprite.x = x;
              sprite.y = y;
              
              // Scale button appropriately
              const buttonScale = Math.min(app.screen.width / 1200, app.screen.height / 800) * scaleMultiplier;
              sprite.scale.set(buttonScale);
              sprite.interactive = true;
              sprite.cursor = 'pointer';
              
              // Store textures for state changes
              (sprite as any).normalTexture = normalTexture;
              (sprite as any).hoverTexture = hoverTexture;
              (sprite as any).baseScale = buttonScale;
              
              return sprite;
            };

            // Create play button sprite (178x18 sprite sheet)
            playButtonSprite = createButtonSprite(
              playButtonTexture, 
              app.screen.width / 2, 
              app.screen.height * 0.55,
              2.5 // Much larger than before
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

            // Create test button sprite (178x18 sprite sheet) - moved up
            testButtonSprite = createButtonSprite(
              testButtonTexture, 
              app.screen.width / 2, 
              app.screen.height * 0.62, // Moved up from 0.75 to 0.7
              2.0 // Much larger than before
            );
            
            // Add hover and click effects
            testButtonSprite.on('pointerover', () => {
              // Subtle hover effect - just slight scale increase
              testButtonSprite!.scale.set((testButtonSprite as any).baseScale * 1.05);
            });
            testButtonSprite.on('pointerout', () => {
              // Return to normal state
              testButtonSprite!.texture = (testButtonSprite as any).normalTexture;
              testButtonSprite!.scale.set((testButtonSprite as any).baseScale);
            });
            testButtonSprite.on('pointerdown', () => {
              // Button press animation: switch to frame 2 and scale down
              testButtonSprite!.texture = (testButtonSprite as any).hoverTexture;
              testButtonSprite!.scale.set((testButtonSprite as any).baseScale * 0.98);
            });
            testButtonSprite.on('pointerup', () => {
              // Animate back to normal after a short delay
              setTimeout(() => {
                testButtonSprite!.texture = (testButtonSprite as any).normalTexture;
                testButtonSprite!.scale.set((testButtonSprite as any).baseScale * 1.05); // Back to hover state
              }, 100);
              
              // Trigger action after animation
              setTimeout(() => {
                handleLoadDev();
              }, 150);
            });
            
            app.stage.addChild(testButtonSprite);



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

          // Fallback test button
          const testButton = new PIXI.Graphics();
          testButton.roundRect(-80, -20, 160, 40, 6);
          testButton.fill(0x4158D0);
          testButton.x = app.screen.width / 2;
          testButton.y = app.screen.height * 0.75;
          testButton.interactive = true;
          testButton.cursor = 'pointer';
          
          const testText = new PIXI.Text('Test Activity', {
            fontFamily: 'Arial',
            fontSize: 20,
            fill: '#FFFFFF',
            align: 'center',
          });
          testText.anchor.set(0.5);
          testButton.addChild(testText);
          
          testButton.on('pointerdown', handleLoadDev);
          app.stage.addChild(testButton);
        };

        // Animation loop for scrolling background
        const animationLoop = () => {
          if (backgroundSprite) {
            // Slowly scroll the background horizontally
            backgroundSprite.tilePosition.x -= scrollSpeed;
            
            // Reset position when we've scrolled through the entire background
            // Background is 3400px wide, viewport is 640px, so reset at -(3400-640) = -2760
            if (backgroundSprite.tilePosition.x <= -2760) {
              backgroundSprite.tilePosition.x = 0;
            }
          }
        };

        // Add to ticker for smooth animation
        app.ticker.add(animationLoop);

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
            if (testButtonSprite) {
              testButtonSprite.x = app.screen.width / 2;
              testButtonSprite.y = app.screen.height * 0.7; // Updated position
            }

            if (backgroundSprite) {
              backgroundSprite.width = app.screen.width;
              backgroundSprite.height = app.screen.height;
              backgroundSprite.tileScale.set(
                app.screen.width / 640,
                app.screen.height / 360
              );
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
            app.ticker.remove(animationLoop);
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

  const handleLoadDev = () => {
    if (startingGame || loadingDev) return;
    
    setLoadingDev(true);
    
    setTimeout(() => {
      // Initialize game state for dev mode
      const gameStore = useGameStore.getState();
      const newTime = gameStore.timeManager.resetToStartOfDay();
      useGameStore.setState({ 
        currentTime: newTime,
        daysPassed: 0
      });
      
      // Set up test activity environment
      setPlayerName("TEST_PLAYER");
      setDifficulty(Difficulty.STANDARD);
      
      // Set up test resources
      const resourceStore = useResourceStore.getState();
      useResourceStore.setState({
        insight: 75,
        momentum: 0,
        starPoints: 20
      });
      
      // Disable tutorial for test mode
      const tutorialStore = useTutorialStore.getState();
      tutorialStore.disableTutorialMode();
      
      console.log('🧪 Test Activity Environment Loaded:', {
        insight: 75,
        momentum: 0,
        starPoints: 20,
        playerName: 'TEST_PLAYER'
      });
      
      // Go to DAY phase and then to test activity
      setPhase(GamePhase.DAY);
      
      setTimeout(() => {
        const sceneStore = useSceneStore.getState();
        sceneStore.transitionToScene('test_activity', {
          mentorId: 'jesse',
          skipIntro: true  // Skip intro and go directly to questions
        });
      }, 100);
    }, 500);
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