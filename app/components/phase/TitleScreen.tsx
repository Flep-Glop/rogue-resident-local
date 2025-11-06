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
const WhatsNewButton = styled.button<{ $visible: boolean; $debugMode: boolean }>`
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
  pointer-events: ${props => (props.$visible && !props.$debugMode) ? 'auto' : 'none'};
  z-index: 101; /* Above vignette */
  image-rendering: pixelated;
  -webkit-image-rendering: pixelated;
  -moz-image-rendering: crisp-edges;
  opacity: ${props => (props.$visible && !props.$debugMode) ? 1 : 0};
  transition: opacity 0.6s ease, transform 0.1s ease;

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

// Debug Grid Container
const DebugGridContainer = styled.div<{ $visible: boolean }>`
  position: absolute;
  left: 50%;
  top: 64%; /* Shifted down more - centered between title and bottom */
  transform: translate(-50%, -50%);
  display: ${props => props.$visible ? 'flex' : 'none'};
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 20px;
  z-index: 11;
  opacity: ${props => props.$visible ? 1 : 0};
  transition: opacity 0.6s ease;
  pointer-events: ${props => props.$visible ? 'auto' : 'none'};
`;

const DebugGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(3, 1fr);
  gap: 16px;
  max-width: 500px;
  width: 85vw;
  max-height: 500px;
  aspect-ratio: 1;
`;

const DebugBox = styled.div<{ $isEmpty?: boolean; $isSelected?: boolean }>`
  background: transparent;
  border: none;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  cursor: ${props => props.$isEmpty ? 'default' : 'pointer'};
  padding: 20px;
  position: relative;
  overflow: visible;
  pointer-events: ${props => props.$isEmpty ? 'none' : 'auto'};
`;

const DebugBoxImage = styled.div<{ $debugOption: number; $isSelected: boolean; $isPressed: boolean }>`
  width: 100%;
  height: 100%;
  background-image: url('/images/debug/debug-icons.png');
  /* Each frame is 56x53, sprite sheet has 12 frames horizontally (672x53 total) */
  /* 3 frames per debug option: normal, highlighted, selected */
  /* Scale so one frame (56px) fills 100% of width, meaning 12 frames = 1200% */
  background-size: 1200% 100%;
  /* Calculate frame: (debugOption * 3) + state (0=normal, 1=highlighted, 2=selected/pressed) */
  /* Then position: frame * (100 / 11) because 12 frames means 11 gaps between them */
  background-position: ${props => {
    const baseFrame = props.$debugOption * 3; // 0, 3, 6, or 9
    const stateOffset = props.$isPressed ? 2 : (props.$isSelected ? 1 : 0); // 0=normal, 1=highlighted, 2=pressed
    const frame = baseFrame + stateOffset;
    const position = (frame * 100) / 11; // 11 gaps between 12 frames
    return `${position}% 0%`;
  }};
  background-repeat: no-repeat;
  image-rendering: pixelated;
  -webkit-image-rendering: pixelated;
  -moz-image-rendering: crisp-edges;
  image-rendering: -moz-crisp-edges;
  image-rendering: crisp-edges;
`;

const DebugBoxLabel = styled.div`
  position: absolute;
  bottom: 8px;
  left: 50%;
  transform: translateX(-50%);
  color: ${colors.text};
  font-family: ${typography.fontFamily.pixel};
  font-size: ${typography.fontSize.xs};
  text-shadow: ${typography.textShadow.pixel};
  white-space: nowrap;
  background: rgba(0, 0, 0, 0.7);
  padding: 4px 8px;
  border-radius: 4px;
`;

export const TitleScreen: React.FC = () => {
  const pixiContainerRef = useRef<HTMLDivElement>(null);
  const pixiAppRef = useRef<PIXI.Application | null>(null);
  const pixiTitleRef = useRef<PIXI.Sprite | null>(null);
  const pixiPlayButtonRef = useRef<PIXI.Sprite | null>(null);
  const pixiDevModeButtonRef = useRef<PIXI.Sprite | null>(null);
  const pixiWhatsNewButtonRef = useRef<PIXI.Sprite | null>(null);
  const introCompleteRef = useRef(false);
  
  const [isLoaded, setIsLoaded] = useState(false);
  const [showChangelog, setShowChangelog] = useState(false);
  const [startingGame, setStartingGame] = useState(false);
  const [loadingDev, setLoadingDev] = useState(false);
  const [showWhatsNew, setShowWhatsNew] = useState(false);
  const [showDebugGrid, setShowDebugGrid] = useState(false);
  const [introComplete, setIntroComplete] = useState(false);
  const [selectedButton, setSelectedButton] = useState(0); // 0 = Play, 1 = Dev Mode, 2 = What's New
  const [selectedDebugOption, setSelectedDebugOption] = useState(0); // 0 = Before Desk, 1 = Before Cutscene, 2 = After Cutscene, 3 = Planetary Systems
  const [pressedDebugOption, setPressedDebugOption] = useState<number | null>(null); // Track which debug option is pressed (showing third frame)
  
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
        let cloudSprite1: PIXI.Sprite | null = null;
        let cloudSprite2: PIXI.Sprite | null = null;
        let cloudSprite3: PIXI.Sprite | null = null;
        let cloudSprite4: PIXI.Sprite | null = null;

        // Animation state tracking
        let animationStartTime = 0;
        const CLOUD_INTRO_DURATION = 1500; // 1.5 seconds for clouds to slide in
        const TITLE_INTRO_START = 1200; // Title starts zooming in after 1.2s
        const TITLE_INTRO_DURATION = 800; // 0.8 seconds for title zoom
        const BUTTON_INTRO_START = 2200; // Buttons appear after 2.2s
        const BUTTON_INTRO_DURATION = 600; // 0.6 seconds for button fade

        // Easing function for smooth animations
        const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
        const easeOutBack = (t: number) => {
          const c1 = 1.70158;
          const c3 = c1 + 1;
          return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
        };

        // Load textures and create sprites
        const loadAssets = async () => {
          try {
            // Load all textures - background + 3 cloud layers + purple abyss + UI elements
            const backgroundTexture = await PIXI.Assets.load('/images/title/title-screen-background.png');
            const cloudLayer1Texture = await PIXI.Assets.load('/images/title/title-screen-cloud-1.png');
            const cloudLayer2Texture = await PIXI.Assets.load('/images/title/title-screen-cloud-2.png');
            const cloudLayer3Texture = await PIXI.Assets.load('/images/title/title-screen-cloud-3.png');
            const cloudLayer4Texture = await PIXI.Assets.load('/images/title/title-screen-purple-abyss.png');
            const titleTexture = await PIXI.Assets.load('/images/title/title-screen-title.png');
            const playButtonTexture = await PIXI.Assets.load('/images/title/play-button.png');
            const devModeButtonTexture = await PIXI.Assets.load('/images/title/dev-mode-button.png');
            const whatsNewButtonTexture = await PIXI.Assets.load('/images/title/whats-new-button.png');

            // Set pixel-perfect rendering for all textures
            [backgroundTexture, cloudLayer1Texture, cloudLayer2Texture, cloudLayer3Texture, cloudLayer4Texture, titleTexture, playButtonTexture, devModeButtonTexture, whatsNewButtonTexture].forEach(texture => {
              texture.source.scaleMode = 'nearest'; // Pixel-perfect scaling
            });

            // Calculate scale factor to fit 640x360 coordinate system to screen
            const scaleX = app.screen.width / 640;
            const scaleY = app.screen.height / 360;
            const uniformScale = Math.min(scaleX, scaleY);

            // Create static background and cloud layers (all 640x360) with proper z-ordering
            // Z-order: background (back) → cloud-1 → cloud-2 → cloud-3 → purple-abyss (front) → UI
            
            backgroundSprite = new PIXI.Sprite(backgroundTexture);
            backgroundSprite.scale.set(uniformScale);
            backgroundSprite.x = (app.screen.width - 640 * uniformScale) / 2;
            backgroundSprite.y = (app.screen.height - 360 * uniformScale) / 2;
            app.stage.addChild(backgroundSprite);

            // Cloud sprites - start off-screen from different directions
            const centerX = (app.screen.width - 640 * uniformScale) / 2;
            const centerY = (app.screen.height - 360 * uniformScale) / 2;

            cloudSprite1 = new PIXI.Sprite(cloudLayer1Texture);
            cloudSprite1.scale.set(uniformScale);
            cloudSprite1.x = centerX - app.screen.width; // Start from left
            cloudSprite1.y = centerY;
            (cloudSprite1 as any).targetX = centerX;
            (cloudSprite1 as any).startX = centerX - app.screen.width;
            app.stage.addChild(cloudSprite1);

            cloudSprite2 = new PIXI.Sprite(cloudLayer2Texture);
            cloudSprite2.scale.set(uniformScale);
            cloudSprite2.x = centerX + app.screen.width; // Start from right
            cloudSprite2.y = centerY;
            (cloudSprite2 as any).targetX = centerX;
            (cloudSprite2 as any).startX = centerX + app.screen.width;
            app.stage.addChild(cloudSprite2);

            cloudSprite3 = new PIXI.Sprite(cloudLayer3Texture);
            cloudSprite3.scale.set(uniformScale);
            cloudSprite3.x = centerX;
            cloudSprite3.y = centerY - app.screen.height; // Start from top
            (cloudSprite3 as any).targetY = centerY;
            (cloudSprite3 as any).startY = centerY - app.screen.height;
            app.stage.addChild(cloudSprite3);

            cloudSprite4 = new PIXI.Sprite(cloudLayer4Texture);
            cloudSprite4.scale.set(uniformScale);
            cloudSprite4.x = centerX;
            cloudSprite4.y = centerY; // Static position - no animation
            app.stage.addChild(cloudSprite4);

            // Create title sprite (640x360) - same size as background for compositing
            titleSprite = new PIXI.Sprite(titleTexture);
            titleSprite.scale.set(uniformScale);
            titleSprite.x = centerX;
            titleSprite.y = centerY;
            titleSprite.alpha = 0; // Start invisible
            (titleSprite as any).normalY = titleSprite.y; // Store normal position
            (titleSprite as any).debugY = app.screen.height * 0.22; // Position when debug grid is shown (22% from top)
            app.stage.addChild(titleSprite);
            pixiTitleRef.current = titleSprite;

            // Helper function to create button sprite from sprite sheet (261x18, 3 frames) using 640x360 coordinates
            const createButtonSprite = (texture: PIXI.Texture, worldX: number, worldY: number, scaleMultiplier: number = 1) => {
              // Create texture for normal state (frame 1: 0-86 pixels)
              const normalTexture = new PIXI.Texture({
                source: texture.source,
                frame: new PIXI.Rectangle(0, 0, 87, 18)
              });
              // Create texture for highlighted state (frame 2: 87-173 pixels)  
              const highlightedTexture = new PIXI.Texture({
                source: texture.source,
                frame: new PIXI.Rectangle(87, 0, 87, 18)
              });
              // Create texture for selected state (frame 3: 174-260 pixels)
              const selectedTexture = new PIXI.Texture({
                source: texture.source,
                frame: new PIXI.Rectangle(174, 0, 87, 18)
              });
              
              // Set pixel-perfect rendering for button textures
              normalTexture.source.scaleMode = 'nearest';
              highlightedTexture.source.scaleMode = 'nearest';
              selectedTexture.source.scaleMode = 'nearest';
              
              const sprite = new PIXI.Sprite(normalTexture);
              sprite.anchor.set(0.5);
              
              // Convert 640x360 world coordinates to screen coordinates
              sprite.x = (app.screen.width - 640 * uniformScale) / 2 + worldX * uniformScale;
              sprite.y = (app.screen.height - 360 * uniformScale) / 2 + worldY * uniformScale;
              
              // Use uniform scale with multiplier
              const buttonScale = uniformScale * scaleMultiplier;
              sprite.scale.set(buttonScale);
              sprite.eventMode = 'static'; // PIXI v8 way to enable interaction
              sprite.cursor = 'pointer';
              
              // Store textures for state changes
              (sprite as any).normalTexture = normalTexture;
              (sprite as any).highlightedTexture = highlightedTexture;
              (sprite as any).selectedTexture = selectedTexture;
              (sprite as any).baseScale = buttonScale;
              
              return sprite;
            };

            // Create play button sprite (261x18 sprite sheet, 3 frames) using 640x360 coordinates
            playButtonSprite = createButtonSprite(
              playButtonTexture, 
              320, // Center of 640px width
              200, // 55% of 360px height (0.55 * 360 = 198)
              1.0 // Normal scale - no extra multiplier needed
            );
            
            // Start invisible
            playButtonSprite.alpha = 0;
            playButtonSprite.visible = false;
            
            // Add hover and click effects
            playButtonSprite.on('pointerover', () => {
              playButtonSprite!.texture = (playButtonSprite as any).highlightedTexture;
              playButtonSprite!.scale.set((playButtonSprite as any).baseScale * 1.05);
            });
            playButtonSprite.on('pointerout', () => {
              playButtonSprite!.texture = (playButtonSprite as any).normalTexture;
              playButtonSprite!.scale.set((playButtonSprite as any).baseScale);
            });
            playButtonSprite.on('pointerdown', () => {
              playButtonSprite!.texture = (playButtonSprite as any).selectedTexture;
              playButtonSprite!.scale.set((playButtonSprite as any).baseScale * 0.98);
            });
            playButtonSprite.on('pointerup', () => {
              setTimeout(() => {
                playButtonSprite!.texture = (playButtonSprite as any).highlightedTexture;
                playButtonSprite!.scale.set((playButtonSprite as any).baseScale * 1.05);
              }, 100);
              
              setTimeout(() => {
                handleStartGame();
              }, 150);
            });
            
            app.stage.addChild(playButtonSprite);
            pixiPlayButtonRef.current = playButtonSprite;

            // Create dev mode button sprite (261x18 sprite sheet, 3 frames) using 640x360 coordinates
            settingsButtonSprite = createButtonSprite(
              devModeButtonTexture, 
              320, // Center of 640px width
              220, // 66% of 360px height (shifted down from 223)
              1.0 // Normal scale - no extra multiplier needed
            );
            
            // Start invisible
            settingsButtonSprite.alpha = 0;
            settingsButtonSprite.visible = false;
            
            // Add hover and click effects
            settingsButtonSprite.on('pointerover', () => {
              settingsButtonSprite!.texture = (settingsButtonSprite as any).highlightedTexture;
              settingsButtonSprite!.scale.set((settingsButtonSprite as any).baseScale * 1.05);
            });
            settingsButtonSprite.on('pointerout', () => {
              settingsButtonSprite!.texture = (settingsButtonSprite as any).normalTexture;
              settingsButtonSprite!.scale.set((settingsButtonSprite as any).baseScale);
            });
            settingsButtonSprite.on('pointerdown', () => {
              settingsButtonSprite!.texture = (settingsButtonSprite as any).selectedTexture;
              settingsButtonSprite!.scale.set((settingsButtonSprite as any).baseScale * 0.98);
            });
            settingsButtonSprite.on('pointerup', () => {
              setTimeout(() => {
                if (settingsButtonSprite) {
                  settingsButtonSprite.texture = (settingsButtonSprite as any).highlightedTexture;
                  settingsButtonSprite.scale.set((settingsButtonSprite as any).baseScale * 1.05);
                }
              }, 100);
              
              setTimeout(() => {
                if (introCompleteRef.current) {
                  setShowDebugGrid(true);
                }
              }, 150);
            });
            
            app.stage.addChild(settingsButtonSprite);
            pixiDevModeButtonRef.current = settingsButtonSprite;

            // Create What's New button sprite (261x18 sprite sheet, 3 frames) using 640x360 coordinates
            const whatsNewButtonSprite = createButtonSprite(
              whatsNewButtonTexture, 
              320, // Center of 640px width
              240, // 73% of 360px height (shifted down from 248)
              1.0 // Normal scale - no extra multiplier needed
            );
            
            // Start invisible
            whatsNewButtonSprite.alpha = 0;
            whatsNewButtonSprite.visible = false;
            
            // Add hover and click effects
            whatsNewButtonSprite.on('pointerover', () => {
              whatsNewButtonSprite!.texture = (whatsNewButtonSprite as any).highlightedTexture;
              whatsNewButtonSprite!.scale.set((whatsNewButtonSprite as any).baseScale * 1.05);
            });
            whatsNewButtonSprite.on('pointerout', () => {
              whatsNewButtonSprite!.texture = (whatsNewButtonSprite as any).normalTexture;
              whatsNewButtonSprite!.scale.set((whatsNewButtonSprite as any).baseScale);
            });
            whatsNewButtonSprite.on('pointerdown', () => {
              whatsNewButtonSprite!.texture = (whatsNewButtonSprite as any).selectedTexture;
              whatsNewButtonSprite!.scale.set((whatsNewButtonSprite as any).baseScale * 0.98);
            });
            whatsNewButtonSprite.on('pointerup', () => {
              setTimeout(() => {
                whatsNewButtonSprite!.texture = (whatsNewButtonSprite as any).highlightedTexture;
                whatsNewButtonSprite!.scale.set((whatsNewButtonSprite as any).baseScale * 1.05);
              }, 100);
              
              setTimeout(() => {
                setShowChangelog(true);
              }, 150);
            });
            
            app.stage.addChild(whatsNewButtonSprite);
            pixiWhatsNewButtonRef.current = whatsNewButtonSprite;

            // Start the intro animation
            animationStartTime = Date.now();
            let introAnimationComplete = false;
            
            // Animation loop
            const introTicker = () => {
              const elapsed = Date.now() - animationStartTime;
              
              // Stop ticker if intro is complete
              if (introAnimationComplete) {
                return;
              }
              
              // What's New button is now a PIXI sprite, fades in with other buttons below
              
              // Animate clouds sliding in (0-1500ms)
              if (elapsed < CLOUD_INTRO_DURATION) {
                const cloudProgress = easeOutCubic(elapsed / CLOUD_INTRO_DURATION);
                
                // Cloud 1 - from left
                if (cloudSprite1 && (cloudSprite1 as any).startX !== undefined) {
                  cloudSprite1.x = (cloudSprite1 as any).startX + ((cloudSprite1 as any).targetX - (cloudSprite1 as any).startX) * cloudProgress;
                }
                
                // Cloud 2 - from right
                if (cloudSprite2 && (cloudSprite2 as any).startX !== undefined) {
                  cloudSprite2.x = (cloudSprite2 as any).startX + ((cloudSprite2 as any).targetX - (cloudSprite2 as any).startX) * cloudProgress;
                }
                
                // Cloud 3 - from top
                if (cloudSprite3 && (cloudSprite3 as any).startY !== undefined) {
                  cloudSprite3.y = (cloudSprite3 as any).startY + ((cloudSprite3 as any).targetY - (cloudSprite3 as any).startY) * cloudProgress;
                }
                
                // Purple abyss (cloud 4) - static, no animation
              }
              
              // Animate title fading in (1200-2000ms)
              if (elapsed >= TITLE_INTRO_START && elapsed < TITLE_INTRO_START + TITLE_INTRO_DURATION) {
                const titleElapsed = elapsed - TITLE_INTRO_START;
                const titleProgress = easeOutCubic(titleElapsed / TITLE_INTRO_DURATION);
                
                if (titleSprite) {
                  titleSprite.alpha = titleProgress;
                }
              } else if (elapsed >= TITLE_INTRO_START + TITLE_INTRO_DURATION && titleSprite && titleSprite.alpha !== 1) {
                // Ensure title is at full opacity
                titleSprite.alpha = 1;
              }
              
              // Animate buttons fading in (2200-2800ms)
              if (elapsed >= BUTTON_INTRO_START && elapsed < BUTTON_INTRO_START + BUTTON_INTRO_DURATION) {
                const buttonElapsed = elapsed - BUTTON_INTRO_START;
                const buttonProgress = easeOutCubic(buttonElapsed / BUTTON_INTRO_DURATION);
                
                if (playButtonSprite) {
                  playButtonSprite.visible = true;
                  playButtonSprite.alpha = buttonProgress;
                }
                
                if (settingsButtonSprite) {
                  settingsButtonSprite.visible = true;
                  settingsButtonSprite.alpha = buttonProgress;
                }
                
                if (whatsNewButtonSprite) {
                  whatsNewButtonSprite.visible = true;
                  whatsNewButtonSprite.alpha = buttonProgress;
                }
              } else if (elapsed >= BUTTON_INTRO_START + BUTTON_INTRO_DURATION) {
                // Ensure buttons are fully visible and mark intro as complete
                if (!introAnimationComplete) {
                  if (playButtonSprite) {
                    playButtonSprite.visible = true;
                    playButtonSprite.alpha = 1;
                  }
                  if (settingsButtonSprite) {
                    settingsButtonSprite.visible = true;
                    settingsButtonSprite.alpha = 1;
                  }
                  if (whatsNewButtonSprite) {
                    whatsNewButtonSprite.visible = true;
                    whatsNewButtonSprite.alpha = 1;
                  }
                  setIntroComplete(true);
                  introCompleteRef.current = true;
                  introAnimationComplete = true;
                }
              }
            };
            
            app.ticker.add(introTicker);

            setIsLoaded(true);
          } catch (error) {
            console.warn('Title screen sprites not found, using fallback display:', error);
            
            // Create fallback graphics if sprites aren't available
            createFallbackGraphics();
            setIsLoaded(true);
            setIntroComplete(true); // Skip intro wait for fallback
            introCompleteRef.current = true;
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

  // Sync introComplete state with ref so event handlers can access current value
  useEffect(() => {
    introCompleteRef.current = introComplete;
  }, [introComplete]);

  // Keyboard controls for navigation and activation
  useEffect(() => {
    if (!introComplete || showDebugGrid) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent default behavior for game controls
      if (['ArrowUp', 'ArrowDown', 'x', 'X'].includes(e.key)) {
        e.preventDefault();
      }

      // Arrow key navigation
      if (e.key === 'ArrowUp') {
        setSelectedButton(prev => Math.max(0, prev - 1));
      } else if (e.key === 'ArrowDown') {
        setSelectedButton(prev => Math.min(2, prev + 1));
      }
      // X key activation
      else if (e.key === 'x' || e.key === 'X') {
        const playButton = pixiPlayButtonRef.current;
        const devModeButton = pixiDevModeButtonRef.current;
        const whatsNewButton = pixiWhatsNewButtonRef.current;

        if (!playButton || !devModeButton || !whatsNewButton) return;

        // Show selected (third) frame with scale animation
        if (selectedButton === 0) {
          playButton.texture = (playButton as any).selectedTexture;
          playButton.scale.set((playButton as any).baseScale * 0.98);
          setTimeout(() => handleStartGame(), 150);
        } else if (selectedButton === 1) {
          devModeButton.texture = (devModeButton as any).selectedTexture;
          devModeButton.scale.set((devModeButton as any).baseScale * 0.98);
          setTimeout(() => handleOpenSettings(), 150);
        } else if (selectedButton === 2) {
          whatsNewButton.texture = (whatsNewButton as any).selectedTexture;
          whatsNewButton.scale.set((whatsNewButton as any).baseScale * 0.98);
          setTimeout(() => setShowChangelog(true), 150);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [introComplete, showDebugGrid, selectedButton]);

  // Apply visual highlighting to selected button
  useEffect(() => {
    if (!introComplete || showDebugGrid) return;

    const playButton = pixiPlayButtonRef.current;
    const devModeButton = pixiDevModeButtonRef.current;
    const whatsNewButton = pixiWhatsNewButtonRef.current;

    if (!playButton || !devModeButton || !whatsNewButton) return;

    // Reset all buttons to normal
    playButton.texture = (playButton as any).normalTexture;
    playButton.scale.set((playButton as any).baseScale);
    devModeButton.texture = (devModeButton as any).normalTexture;
    devModeButton.scale.set((devModeButton as any).baseScale);
    whatsNewButton.texture = (whatsNewButton as any).normalTexture;
    whatsNewButton.scale.set((whatsNewButton as any).baseScale);

    // Highlight selected button
    if (selectedButton === 0) {
      playButton.texture = (playButton as any).highlightedTexture;
      playButton.scale.set((playButton as any).baseScale * 1.05);
    } else if (selectedButton === 1) {
      devModeButton.texture = (devModeButton as any).highlightedTexture;
      devModeButton.scale.set((devModeButton as any).baseScale * 1.05);
    } else if (selectedButton === 2) {
      whatsNewButton.texture = (whatsNewButton as any).highlightedTexture;
      whatsNewButton.scale.set((whatsNewButton as any).baseScale * 1.05);
    }
  }, [selectedButton, introComplete, showDebugGrid]);

  // Keyboard controls for debug grid navigation
  useEffect(() => {
    if (!showDebugGrid) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent default behavior for game controls
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'x', 'X', 'Escape'].includes(e.key)) {
        e.preventDefault();
      }

      // Arrow key navigation (horizontal for top row of 3 options)
      if (e.key === 'ArrowLeft') {
        setSelectedDebugOption(prev => Math.max(0, prev - 1));
      } else if (e.key === 'ArrowRight') {
        setSelectedDebugOption(prev => Math.min(2, prev + 1));
      }
      // X key activation
      else if (e.key === 'x' || e.key === 'X') {
        const debugStates = ['before_desk', 'before_cutscene', 'after_cutscene'];
        
        // Show pressed (third) frame
        setPressedDebugOption(selectedDebugOption);
        
        // Trigger action after brief delay
        setTimeout(() => {
          handleDebugState(debugStates[selectedDebugOption]);
          setPressedDebugOption(null);
        }, 150);
      }
      // Escape to close debug grid
      else if (e.key === 'Escape') {
        setShowDebugGrid(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showDebugGrid, selectedDebugOption]);

  // Handle debug grid transitions
  useEffect(() => {
    // Don't run transitions until intro is complete
    if (!isLoaded || !introComplete) return;

    const titleSprite = pixiTitleRef.current;
    const playButton = pixiPlayButtonRef.current;
    const devModeButton = pixiDevModeButtonRef.current;
    const whatsNewButton = pixiWhatsNewButtonRef.current;

    if (!titleSprite || !playButton || !devModeButton || !whatsNewButton) return;
    
    // Animation duration
    const TRANSITION_DURATION = 600; // ms
    const startTime = Date.now();

    // Animate transition
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / TRANSITION_DURATION, 1);
      
      // Ease out cubic
      const easeProgress = 1 - Math.pow(1 - progress, 3);

      if (showDebugGrid) {
        // Moving to debug mode
        // Move title up
        const titleNormalY = (titleSprite as any).normalY;
        const titleDebugY = (titleSprite as any).debugY;
        titleSprite.y = titleNormalY + (titleDebugY - titleNormalY) * easeProgress;

        // Fade out all buttons
        playButton.alpha = 1 - easeProgress;
        devModeButton.alpha = 1 - easeProgress;
        whatsNewButton.alpha = 1 - easeProgress;

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          // Hide all buttons completely when animation is done
          playButton.visible = false;
          devModeButton.visible = false;
          whatsNewButton.visible = false;
          playButton.eventMode = 'none';
          devModeButton.eventMode = 'none';
          whatsNewButton.eventMode = 'none';
        }
      } else {
        // Returning to normal mode
        // Move title down
        const titleNormalY = (titleSprite as any).normalY;
        const titleDebugY = (titleSprite as any).debugY;
        titleSprite.y = titleDebugY + (titleNormalY - titleDebugY) * easeProgress;

        // Fade in all buttons
        playButton.visible = true;
        devModeButton.visible = true;
        whatsNewButton.visible = true;
        playButton.eventMode = 'static';
        devModeButton.eventMode = 'static';
        whatsNewButton.eventMode = 'static';
        playButton.alpha = easeProgress;
        devModeButton.alpha = easeProgress;
        whatsNewButton.alpha = easeProgress;

        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      }
    };

    animate();
  }, [showDebugGrid]);

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
      
      setPhase(GamePhase.NIGHT);
    }, 800);
  };

  const handleOpenSettings = () => {
    // Don't allow opening debug grid until intro is complete
    if (!introComplete) return;
    
    // Toggle the debug grid instead of navigating
    setShowDebugGrid(!showDebugGrid);
  };

  const handleDebugState = (stateId: string) => {
    if (loadingDev) return;
    
    setLoadingDev(true);
    console.log(`🧪 Debug state selected: ${stateId}`);
    
    // Set debug flag based on state
    if (stateId === 'before_desk') {
      localStorage.setItem('debug_skip_to_desk', 'true');
    } else if (stateId === 'before_cutscene') {
      localStorage.setItem('debug_skip_to_cutscene', 'true');
    } else if (stateId === 'after_cutscene') {
      localStorage.setItem('debug_after_cutscene', 'true');
    } else if (stateId === 'planetary_systems') {
      localStorage.setItem('debug_planetary_systems', 'true');
    }
    
    // Transition effect - fade out grid
    setTimeout(() => {
      // Initialize fresh game state
      const gameStore = useGameStore.getState();
      const newTime = gameStore.timeManager.resetToStartOfDay();
      useGameStore.setState({ 
        currentTime: newTime,
        daysPassed: 0
      });
      
      // Start tutorial silently
      const tutorialStore = useTutorialStore.getState();
      tutorialStore.startTutorialSilently('micro_day', 'quinn_intro');
      
      // Go directly to night phase (home scene)
      setPhase(GamePhase.NIGHT);
    }, 800);
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
        
        {/* What's New button is now a PIXI sprite - HTML button removed */}
        
        {/* Vignette overlay - appears on top of everything except changelog */}
        <TitleVignette />
        
        {/* Changelog popup */}
        <ChangelogPopup 
          isOpen={showChangelog} 
          onClose={() => setShowChangelog(false)} 
        />
        
        {/* Debug Console - always available */}
        <GameDevConsole />
        
        {/* Debug State Grid - shown when test button is clicked */}
        <DebugGridContainer $visible={showDebugGrid}>
          <DebugGrid>
            {/* Row 1 */}
            <DebugBox 
              onClick={() => {
                setPressedDebugOption(0);
                setTimeout(() => {
                  handleDebugState('before_desk');
                  setPressedDebugOption(null);
                }, 150);
              }}
              $isSelected={selectedDebugOption === 0}
            >
              <DebugBoxImage 
                $debugOption={0} 
                $isSelected={selectedDebugOption === 0}
                $isPressed={pressedDebugOption === 0}
              />
              <DebugBoxLabel>Before Desk</DebugBoxLabel>
            </DebugBox>
            <DebugBox 
              onClick={() => {
                setPressedDebugOption(1);
                setTimeout(() => {
                  handleDebugState('before_cutscene');
                  setPressedDebugOption(null);
                }, 150);
              }}
              $isSelected={selectedDebugOption === 1}
            >
              <DebugBoxImage 
                $debugOption={1} 
                $isSelected={selectedDebugOption === 1}
                $isPressed={pressedDebugOption === 1}
              />
              <DebugBoxLabel>Before Cutscene</DebugBoxLabel>
            </DebugBox>
            <DebugBox 
              onClick={() => {
                setPressedDebugOption(2);
                setTimeout(() => {
                  handleDebugState('after_cutscene');
                  setPressedDebugOption(null);
                }, 150);
              }}
              $isSelected={selectedDebugOption === 2}
            >
              <DebugBoxImage 
                $debugOption={2} 
                $isSelected={selectedDebugOption === 2}
                $isPressed={pressedDebugOption === 2}
              />
              <DebugBoxLabel>After Cutscene</DebugBoxLabel>
            </DebugBox>
            
            {/* Row 2 */}
            <DebugBox 
              onClick={() => {
                setPressedDebugOption(3);
                setTimeout(() => {
                  handleDebugState('planetary_systems');
                  setPressedDebugOption(null);
                }, 150);
              }}
              $isSelected={selectedDebugOption === 3}
            >
              <DebugBoxImage 
                $debugOption={3} 
                $isSelected={selectedDebugOption === 3}
                $isPressed={pressedDebugOption === 3}
              />
              <DebugBoxLabel>Planetary Systems</DebugBoxLabel>
            </DebugBox>
            <DebugBox $isEmpty onClick={() => setShowDebugGrid(false)} />
            <DebugBox $isEmpty onClick={() => setShowDebugGrid(false)} />
            <DebugBox $isEmpty onClick={() => setShowDebugGrid(false)} />
            
            {/* Row 3 */}
            <DebugBox $isEmpty onClick={() => setShowDebugGrid(false)} />
            <DebugBox $isEmpty onClick={() => setShowDebugGrid(false)} />
            <DebugBox $isEmpty onClick={() => setShowDebugGrid(false)} />
          </DebugGrid>
        </DebugGridContainer>
      </FullScreenContainer>
    </>
  );
}; 