"use client";

import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import * as PIXI from 'pixi.js';
import { useGameStore } from '@/app/store/gameStore';
import { useCharacterStore, DEFAULT_CHARACTER } from '@/app/store/characterStore';
import { colors, typography } from '@/app/styles/pixelTheme';
import { ChangelogPopup } from '@/app/components/ui/ChangelogPopup';
import { getCurrentVersionString } from '@/app/utils/versionManager';
import { useAudioInit, useSound } from '@/app/audio/useAudio';

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
const TitleVignette = styled.div<{ $visible?: boolean }>`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 100;
  opacity: ${props => props.$visible === false ? 0 : 1};
  transition: opacity 0.3s ease;
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

const GameVersion = styled.div<{ $visible?: boolean }>`
  position: absolute;
  bottom: 24px;
  width: 100%;
  text-align: center;
  color: ${colors.textDim};
  font-size: ${typography.fontSize.sm};
  text-shadow: ${typography.textShadow.pixel};
  letter-spacing: 0.5px;
  opacity: ${props => props.$visible === false ? 0 : 0.7};
  pointer-events: none;
  font-family: ${typography.fontFamily.pixel};
  transition: opacity 0.3s ease;
`;

// Flashing "Press X to Play" indicator
const PressXIndicator = styled.div<{ $visible: boolean }>`
  position: absolute;
  bottom: 100px;
  left: 50%;
  transform: translateX(-50%) scale(2); /* 2x scale to match title screen's scaled content */
  display: flex;
  align-items: center;
  gap: 8px;
  z-index: 11;
  pointer-events: none;
  
  opacity: ${props => props.$visible ? 1 : 0};
  transition: opacity 0.6s ease;
  
  @keyframes flashPulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.3;
    }
  }
  
  animation: ${props => props.$visible ? 'flashPulse 1.5s ease-in-out infinite' : 'none'};
`;

const XKeySprite = styled.div<{ $frame: number }>`
  width: 15px;
  height: 16px;
  background-image: url('/images/ui/x-key.png');
  background-size: ${15 * 4}px 16px;
  background-position: ${props => (props.$frame - 1) * -15}px 0px;
  background-repeat: no-repeat;
  image-rendering: pixelated;
`;

const PressXLabel = styled.div`
  font-family: 'Aseprite', monospace;
  font-size: 12px;
  color: #ffffff;
  white-space: nowrap;
  image-rendering: pixelated;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
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
  padding: 20px;
  position: relative;
  overflow: visible;
  pointer-events: none;
`;

const DebugBoxImage = styled.div<{ $debugOption: number; $isSelected: boolean; $isPressed: boolean }>`
  width: 100%;
  aspect-ratio: 56 / 53; /* Match sprite frame dimensions to prevent truncation */
  background-image: url('/images/debug/debug-icons.png');
  /* Sprite sheet has 12 frames horizontally (4 debug options × 3 states each) */
  /* 3 frames per debug option: normal, highlighted, selected */
  background-size: 1200% 100%;
  background-position: ${props => {
    const baseFrame = props.$debugOption * 3; // 0, 3, 6, or 9
    const stateOffset = props.$isPressed ? 2 : (props.$isSelected ? 1 : 0); // 0=normal, 1=highlighted, 2=pressed
    const frame = baseFrame + stateOffset;
    // Position calculation: frame / (totalFrames - 1) * 100 for percentage-based positioning
    const position = (frame * 100) / 11; // 11 gaps between 12 frames
    return `${position}% 0%`;
  }};
  background-repeat: no-repeat;
  image-rendering: pixelated;
  -webkit-image-rendering: pixelated;
  -moz-image-rendering: crisp-edges;
  image-rendering: -moz-crisp-edges;
  image-rendering: crisp-edges;
  transition: transform 0.1s ease;
  transform: ${props => props.$isSelected ? 'scale(1.05)' : 'none'};
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
  const pixiShineRef = useRef<PIXI.Sprite | null>(null);
  const pixiPlayButtonRef = useRef<PIXI.Sprite | null>(null);
  const pixiDevModeButtonRef = useRef<PIXI.Sprite | null>(null);
  const pixiWhatsNewButtonRef = useRef<PIXI.Sprite | null>(null);
  const introCompleteRef = useRef(false);
  const lastMousePositionRef = useRef<{ x: number; y: number } | null>(null);
  
  // Splash screen animation refs
  const splashContainerRef = useRef<PIXI.Container | null>(null);
  const splashBgRef = useRef<PIXI.Graphics | null>(null);
  const splashSpriteRef = useRef<PIXI.Sprite | null>(null);
  const splashTexturesRef = useRef<PIXI.Texture[]>([]);
  const campSpriteRef = useRef<PIXI.Sprite | null>(null);
  const splashAnimationRef = useRef<{ frame: number; timer: number; holdTimer: number; phase: 'fading_to_black' | 'fading_in' | 'animating' | 'holding' | 'fading_out' | 'camp_fading_in' | 'camp_holding' | 'camp_fading_out' } | null>(null);
  
  const [isLoaded, setIsLoaded] = useState(false);
  const [showChangelog, setShowChangelog] = useState(false);
  const [startingGame, setStartingGame] = useState(false);
  const [loadingDev, setLoadingDev] = useState(false);
  const [showWhatsNew, setShowWhatsNew] = useState(false);
  const [showDebugGrid, setShowDebugGrid] = useState(false);
  const [introComplete, setIntroComplete] = useState(false);
  const [selectedButton, setSelectedButton] = useState(-1); // -1 = no selection (mouse mode), 0 = Play, 1 = Dev Mode, 2 = What's New
  const [selectedDebugOption, setSelectedDebugOption] = useState(-1); // -1 = no selection (mouse mode), 0 = Before Desk, 1 = Before Cutscene, 2 = After Cutscene, 3 = Planetary Systems
  const [pressedDebugOption, setPressedDebugOption] = useState<number | null>(null); // Track which debug option is pressed (showing third frame)
  const [showSplash, setShowSplash] = useState(false); // Questrium splash screen animation
  
  const startGame = useGameStore(state => state.startGame);
  const startFromCharacterCreator = useGameStore(state => state.startFromCharacterCreator);
  const setCharacter = useCharacterStore(state => state.setCharacter);
  const setHasCreatedCharacter = useCharacterStore(state => state.setHasCreatedCharacter);
  
  // Initialize audio system on first user interaction
  useAudioInit();
  const { play: playSound } = useSound();
  
  // Attempt to autoplay music when intro completes
  // If browser blocks it (autoplay policy), will start on first user interaction
  const musicStartedRef = useRef(false);
  useEffect(() => {
    if (!introComplete || musicStartedRef.current) return;
    
    const attemptAutoplay = async () => {
      // Create audio element directly to attempt autoplay
      const audio = new Audio('/audio/The-Observatory.mp3');
      audio.loop = true;
      audio.volume = 0; // Start silent for fade-in
      
      try {
        await audio.play();
        // Autoplay succeeded! Fade in the volume
        console.log('[TitleScreen] Autoplay succeeded!');
        musicStartedRef.current = true;
        
        // Fade in over 2 seconds
        const targetVolume = 0.35 * 0.7 * 0.8; // config.volume * musicVolume * masterVolume
        const fadeIn = () => {
          if (audio.volume < targetVolume) {
            audio.volume = Math.min(audio.volume + 0.01, targetVolume);
            requestAnimationFrame(fadeIn);
          }
        };
        fadeIn();
        
        // Store reference so AudioManager knows music is playing
        const { audioManager } = await import('@/app/audio/AudioManager');
        // @ts-expect-error - accessing private property for sync
        audioManager.musicElements?.set('main_theme', audio);
        // @ts-expect-error - accessing private property for sync
        audioManager.currentMusic = 'main_theme';
        
      } catch (error) {
        // Autoplay blocked by browser - wait for user interaction
        console.log('[TitleScreen] Autoplay blocked, waiting for user interaction...');
        audio.remove();
        
        const startMusicOnInteraction = async () => {
          if (musicStartedRef.current) return;
          musicStartedRef.current = true;
          
          console.log('[TitleScreen] User interaction - starting music');
          const { audioManager } = await import('@/app/audio/AudioManager');
          await audioManager.init();
          audioManager.playMusic('main_theme');
          
          window.removeEventListener('click', startMusicOnInteraction);
          window.removeEventListener('keydown', startMusicOnInteraction);
        };
        
        window.addEventListener('click', startMusicOnInteraction);
        window.addEventListener('keydown', startMusicOnInteraction);
      }
    };
    
    attemptAutoplay();
  }, [introComplete]);

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

        // Layered background sprites
        let cloud1Sprite: PIXI.Sprite | null = null;
        let cloud2Sprite: PIXI.Sprite | null = null;
        let cloud3Sprite: PIXI.Sprite | null = null;
        let abyssSprite: PIXI.Sprite | null = null;
        let shootingStar1Sprite: PIXI.Sprite | null = null;
        let shootingStar2Sprite: PIXI.Sprite | null = null;
        let shootingStar3Sprite: PIXI.Sprite | null = null;
        let shootingStar4Sprite: PIXI.Sprite | null = null;
        let shineSprite: PIXI.Sprite | null = null;
        let vignetteSprite: PIXI.Sprite | null = null;
        
        // Texture arrays for animated sprites
        let cloud1Textures: PIXI.Texture[] = [];
        let cloud2Textures: PIXI.Texture[] = [];
        let cloud3Textures: PIXI.Texture[] = [];
        let shootingStar1Textures: PIXI.Texture[] = [];
        let shootingStar2Textures: PIXI.Texture[] = [];
        let shootingStar3Textures: PIXI.Texture[] = [];
        let shootingStar4Textures: PIXI.Texture[] = [];
        let shineTextures: PIXI.Texture[] = [];
        
        // Animation state
        let cloud1Frame = 0;
        let cloud2Frame = 0;
        let cloud3Frame = 0;
        
        // Ping-pong direction (1 = forward, -1 = backward)
        let cloud1Direction = 1;
        let cloud2Direction = 1;
        let cloud3Direction = 1;
        let shootingStar1Frame = -1; // -1 means not playing
        let shootingStar2Frame = -1;
        let shootingStar3Frame = -1;
        let shootingStar4Frame = -1;
        let shineFrame = -1;
        
        // Animation timers (ms since last frame change)
        let cloud1Timer = 0;
        let cloud2Timer = 0;
        let cloud3Timer = 0;
        let shootingStar1Timer = 0;
        let shootingStar2Timer = 0;
        let shootingStar3Timer = 0;
        let shootingStar4Timer = 0;
        let shineTimer = 0;
        
        // Shooting star trigger timers (countdown to next trigger)
        let shootingStar1Countdown = 3000; // Staggered starts
        let shootingStar2Countdown = 7000;
        let shootingStar3Countdown = 12000;
        let shootingStar4Countdown = 18000;
        let shineCountdown = 5000;
        
        // Animation speeds (ms per frame) - parallax: closer clouds move faster
        const CLOUD1_FRAME_DURATION = 600; // Slowest - furthest back
        const CLOUD2_FRAME_DURATION = 450; // Medium speed
        const CLOUD3_FRAME_DURATION = 300; // Fastest - closest/foreground
        const SHOOTING_STAR_FRAME_DURATION = 100; // 100ms per frame
        const SHINE_FRAME_DURATION = 120; // 120ms per frame
        
        // Cooldowns between shooting star/shine triggers
        const SHOOTING_STAR_COOLDOWN_MIN = 8000;
        const SHOOTING_STAR_COOLDOWN_MAX = 15000;
        const SHINE_COOLDOWN_MIN = 12000;
        const SHINE_COOLDOWN_MAX = 20000;

        // Animation state tracking
        let animationStartTime = 0;
        let lastTickTime = 0;
        const BG_FADE_DURATION = 1200; // 1.2 seconds for background to fade in from black
        const TITLE_INTRO_START = 1000; // Title starts fading in after 1s
        const TITLE_INTRO_DURATION = 800; // 0.8 seconds for title fade
        const BUTTON_INTRO_START = 1800; // Buttons appear after 1.8s
        const BUTTON_INTRO_DURATION = 600; // 0.6 seconds for button fade

        // Easing function for smooth animations
        const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

        // Helper to create texture frames from a horizontal sprite sheet
        const createFrameTextures = (baseTexture: PIXI.Texture, frameCount: number, frameWidth: number, frameHeight: number): PIXI.Texture[] => {
          const textures: PIXI.Texture[] = [];
          for (let i = 0; i < frameCount; i++) {
            const texture = new PIXI.Texture({
              source: baseTexture.source,
              frame: new PIXI.Rectangle(i * frameWidth, 0, frameWidth, frameHeight)
            });
            texture.source.scaleMode = 'nearest';
            textures.push(texture);
          }
          return textures;
        };

        // Load textures and create sprites
        const loadAssets = async () => {
          try {
            // Load all textures - layered background + UI elements
            const backgroundTexture = await PIXI.Assets.load('/images/title/title-screen-background.png');
            const cloud1Texture = await PIXI.Assets.load('/images/title/title-screen-cloud-1.png');
            const cloud2Texture = await PIXI.Assets.load('/images/title/title-screen-cloud-2.png');
            const cloud3Texture = await PIXI.Assets.load('/images/title/title-screen-cloud-3.png');
            const abyssTexture = await PIXI.Assets.load('/images/title/title-screen-abyss.png');
            const shootingStar1Texture = await PIXI.Assets.load('/images/title/title-screen-shooting-stars-1.png');
            const shootingStar2Texture = await PIXI.Assets.load('/images/title/title-screen-shooting-stars-2.png');
            const shootingStar3Texture = await PIXI.Assets.load('/images/title/title-screen-shooting-stars-3.png');
            const shootingStar4Texture = await PIXI.Assets.load('/images/title/title-screen-shooting-stars-4.png');
            const titleTexture = await PIXI.Assets.load('/images/title/title-screen-title.png');
            const shineTexture = await PIXI.Assets.load('/images/title/title-screen-shine.png');
            const vignetteTexture = await PIXI.Assets.load('/images/title/title-screen-vignette.png');
            const playButtonTexture = await PIXI.Assets.load('/images/title/play-button.png');
            const devModeButtonTexture = await PIXI.Assets.load('/images/title/dev-mode-button.png');
            const whatsNewButtonTexture = await PIXI.Assets.load('/images/title/whats-new-button.png');
            const questriumTexture = await PIXI.Assets.load('/images/title/questrium.png');
            const campTexture = await PIXI.Assets.load('/images/title/camp-logo.png');

            // Set pixel-perfect rendering for static textures
            [backgroundTexture, abyssTexture, titleTexture, vignetteTexture, playButtonTexture, devModeButtonTexture, whatsNewButtonTexture].forEach(texture => {
              texture.source.scaleMode = 'nearest';
            });
            
            // Create frame textures for animated sprite sheets
            cloud1Textures = createFrameTextures(cloud1Texture, 8, 640, 360);
            cloud2Textures = createFrameTextures(cloud2Texture, 8, 640, 360);
            cloud3Textures = createFrameTextures(cloud3Texture, 8, 640, 360);
            shootingStar1Textures = createFrameTextures(shootingStar1Texture, 7, 640, 360);
            shootingStar2Textures = createFrameTextures(shootingStar2Texture, 7, 640, 360);
            shootingStar3Textures = createFrameTextures(shootingStar3Texture, 7, 640, 360);
            shootingStar4Textures = createFrameTextures(shootingStar4Texture, 7, 640, 360);
            shineTextures = createFrameTextures(shineTexture, 7, 640, 360);

            // Calculate scale factor to fit 640x360 coordinate system to screen
            const scaleX = app.screen.width / 640;
            const scaleY = app.screen.height / 360;
            const uniformScale = Math.min(scaleX, scaleY);

            const centerX = (app.screen.width - 640 * uniformScale) / 2;
            const centerY = (app.screen.height - 360 * uniformScale) / 2;

            // === LAYER 1: Background (static) ===
            backgroundSprite = new PIXI.Sprite(backgroundTexture);
            backgroundSprite.scale.set(uniformScale);
            backgroundSprite.x = centerX;
            backgroundSprite.y = centerY;
            backgroundSprite.alpha = 0; // Start invisible for fade from black
            app.stage.addChild(backgroundSprite);

            // === LAYER 2: Cloud 1 (8 frames, smooth scroll) ===
            cloud1Sprite = new PIXI.Sprite(cloud1Textures[0]);
            cloud1Sprite.scale.set(uniformScale);
            cloud1Sprite.x = centerX;
            cloud1Sprite.y = centerY;
            cloud1Sprite.alpha = 0;
            app.stage.addChild(cloud1Sprite);

            // === LAYER 3: Cloud 2 (8 frames, smooth scroll, out of sync) ===
            cloud2Sprite = new PIXI.Sprite(cloud2Textures[3]); // Start on frame 3 for desync
            cloud2Frame = 3;
            cloud2Direction = -1; // Start moving backwards for additional desync
            cloud2Sprite.scale.set(uniformScale);
            cloud2Sprite.x = centerX;
            cloud2Sprite.y = centerY;
            cloud2Sprite.alpha = 0;
            app.stage.addChild(cloud2Sprite);

            // === LAYER 4: Cloud 3 (8 frames, smooth scroll, out of sync) ===
            cloud3Sprite = new PIXI.Sprite(cloud3Textures[0]);
            cloud3Timer = 2000; // Offset timer for desync
            cloud3Sprite.scale.set(uniformScale);
            cloud3Sprite.x = centerX;
            cloud3Sprite.y = centerY;
            cloud3Sprite.alpha = 0;
            app.stage.addChild(cloud3Sprite);

            // === LAYER 5: Abyss (static) ===
            abyssSprite = new PIXI.Sprite(abyssTexture);
            abyssSprite.scale.set(uniformScale);
            abyssSprite.x = centerX;
            abyssSprite.y = centerY;
            abyssSprite.alpha = 0;
            app.stage.addChild(abyssSprite);

            // === LAYER 6-9: Shooting Stars 1-4 (7 frames each, triggered) ===
            shootingStar1Sprite = new PIXI.Sprite(shootingStar1Textures[0]);
            shootingStar1Sprite.scale.set(uniformScale);
            shootingStar1Sprite.x = centerX;
            shootingStar1Sprite.y = centerY;
            shootingStar1Sprite.alpha = 0; // Hidden until triggered
            shootingStar1Sprite.visible = false;
            app.stage.addChild(shootingStar1Sprite);

            shootingStar2Sprite = new PIXI.Sprite(shootingStar2Textures[0]);
            shootingStar2Sprite.scale.set(uniformScale);
            shootingStar2Sprite.x = centerX;
            shootingStar2Sprite.y = centerY;
            shootingStar2Sprite.alpha = 0;
            shootingStar2Sprite.visible = false;
            app.stage.addChild(shootingStar2Sprite);

            shootingStar3Sprite = new PIXI.Sprite(shootingStar3Textures[0]);
            shootingStar3Sprite.scale.set(uniformScale);
            shootingStar3Sprite.x = centerX;
            shootingStar3Sprite.y = centerY;
            shootingStar3Sprite.alpha = 0;
            shootingStar3Sprite.visible = false;
            app.stage.addChild(shootingStar3Sprite);

            shootingStar4Sprite = new PIXI.Sprite(shootingStar4Textures[0]);
            shootingStar4Sprite.scale.set(uniformScale);
            shootingStar4Sprite.x = centerX;
            shootingStar4Sprite.y = centerY;
            shootingStar4Sprite.alpha = 0;
            shootingStar4Sprite.visible = false;
            app.stage.addChild(shootingStar4Sprite);

            // === LAYER 10: Vignette (static overlay, does NOT move with title) ===
            vignetteSprite = new PIXI.Sprite(vignetteTexture);
            vignetteSprite.scale.set(uniformScale);
            vignetteSprite.x = centerX;
            vignetteSprite.y = centerY;
            vignetteSprite.alpha = 0; // Start invisible for fade from black
            app.stage.addChild(vignetteSprite);

            // === LAYER 11: Title (static) ===
            titleSprite = new PIXI.Sprite(titleTexture);
            titleSprite.scale.set(uniformScale);
            titleSprite.x = centerX;
            titleSprite.y = centerY;
            titleSprite.alpha = 0; // Start invisible
            (titleSprite as any).normalY = titleSprite.y; // Store normal position
            (titleSprite as any).debugY = centerY - (80 * uniformScale); // Move up 80px in 640x360 coordinates when debug grid is shown
            app.stage.addChild(titleSprite);
            pixiTitleRef.current = titleSprite;

            // === LAYER 12: Shine (7 frames, triggered occasionally) ===
            // Shine moves with the title when debug grid is shown
            shineSprite = new PIXI.Sprite(shineTextures[0]);
            shineSprite.scale.set(uniformScale);
            shineSprite.x = centerX;
            shineSprite.y = centerY;
            shineSprite.alpha = 0;
            shineSprite.visible = false;
            (shineSprite as any).normalY = centerY; // Store normal position
            (shineSprite as any).debugY = centerY - (80 * uniformScale); // Move up with title when debug grid is shown
            app.stage.addChild(shineSprite);
            pixiShineRef.current = shineSprite;

            // === SPLASH SCREEN: Questrium logo animation (36 frames, 240x120 each) ===
            // Create frame textures for questrium sprite sheet
            questriumTexture.source.scaleMode = 'nearest';
            const questriumTextures = createFrameTextures(questriumTexture, 36, 240, 120);
            splashTexturesRef.current = questriumTextures;
            
            // Create splash container (black background + centered logos)
            const splashContainer = new PIXI.Container();
            splashContainer.visible = false;
            
            // Black background covering entire screen
            const splashBg = new PIXI.Graphics();
            splashBg.rect(0, 0, app.screen.width, app.screen.height);
            splashBg.fill(0x000000);
            splashBg.alpha = 0; // Start transparent for fade-in
            splashContainer.addChild(splashBg);
            
            // Questrium logo sprite - centered and scaled
            const splashSprite = new PIXI.Sprite(questriumTextures[0]);
            splashSprite.anchor.set(0.5);
            splashSprite.x = app.screen.width / 2;
            splashSprite.y = app.screen.height / 2;
            // Scale to be nicely visible - 1.5x the native size (since it's now 240x120)
            splashSprite.scale.set(uniformScale * 1.5);
            splashSprite.alpha = 0; // Start invisible for fade-in
            splashContainer.addChild(splashSprite);
            
            // CAMP logo sprite - centered and scaled (244x73, single frame)
            campTexture.source.scaleMode = 'nearest';
            const campSprite = new PIXI.Sprite(campTexture);
            campSprite.anchor.set(0.5);
            campSprite.x = app.screen.width / 2;
            campSprite.y = app.screen.height / 2;
            // Scale to match Questrium logo
            campSprite.scale.set(uniformScale * 1.5);
            campSprite.alpha = 0; // Start invisible
            splashContainer.addChild(campSprite);
            
            app.stage.addChild(splashContainer);
            splashContainerRef.current = splashContainer;
            splashBgRef.current = splashBg;
            splashSpriteRef.current = splashSprite;
            campSpriteRef.current = campSprite;

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
              sprite.eventMode = 'none'; // Keyboard only - no mouse interaction
              
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
              225, // Shifted down 25px from 200
              1.0 // Normal scale - no extra multiplier needed
            );
            
            // Start invisible, no mouse interaction (keyboard only)
            playButtonSprite.alpha = 0;
            playButtonSprite.visible = false;
            playButtonSprite.eventMode = 'none';
            
            app.stage.addChild(playButtonSprite);
            pixiPlayButtonRef.current = playButtonSprite;

            // Create dev mode button sprite (261x18 sprite sheet, 3 frames) using 640x360 coordinates
            settingsButtonSprite = createButtonSprite(
              devModeButtonTexture, 
              320, // Center of 640px width
              245, // Shifted down 25px from 220
              1.0 // Normal scale - no extra multiplier needed
            );
            
            // Start invisible, no mouse interaction (keyboard only)
            settingsButtonSprite.alpha = 0;
            settingsButtonSprite.visible = false;
            settingsButtonSprite.eventMode = 'none';
            
            app.stage.addChild(settingsButtonSprite);
            pixiDevModeButtonRef.current = settingsButtonSprite;

            // Create What's New button sprite (261x18 sprite sheet, 3 frames) using 640x360 coordinates
            const whatsNewButtonSprite = createButtonSprite(
              whatsNewButtonTexture, 
              320, // Center of 640px width
              265, // Shifted down 25px from 240
              1.0 // Normal scale - no extra multiplier needed
            );
            
            // Start invisible, no mouse interaction (keyboard only)
            whatsNewButtonSprite.alpha = 0;
            whatsNewButtonSprite.visible = false;
            whatsNewButtonSprite.eventMode = 'none';
            
            app.stage.addChild(whatsNewButtonSprite);
            pixiWhatsNewButtonRef.current = whatsNewButtonSprite;

            // Start the intro animation
            animationStartTime = Date.now();
            lastTickTime = Date.now();
            let introAnimationComplete = false;
            
            // Helper to get random cooldown
            const getRandomCooldown = (min: number, max: number) => 
              Math.floor(Math.random() * (max - min)) + min;
            
            // Animation loop - handles both intro and ongoing animations
            const animationTicker = () => {
              const now = Date.now();
              const elapsed = now - animationStartTime;
              const deltaTime = now - lastTickTime;
              lastTickTime = now;
              
              // === INTRO ANIMATIONS ===
              
              // Animate all background layers fading in from black (0-1200ms)
              if (elapsed < BG_FADE_DURATION) {
                const bgProgress = easeOutCubic(elapsed / BG_FADE_DURATION);
                if (backgroundSprite) backgroundSprite.alpha = bgProgress;
                if (cloud1Sprite) cloud1Sprite.alpha = bgProgress;
                if (cloud2Sprite) cloud2Sprite.alpha = bgProgress;
                if (cloud3Sprite) cloud3Sprite.alpha = bgProgress;
                if (abyssSprite) abyssSprite.alpha = bgProgress;
                if (vignetteSprite) vignetteSprite.alpha = bgProgress;
              } else {
                // Ensure all background layers are fully visible
                if (backgroundSprite && backgroundSprite.alpha !== 1) backgroundSprite.alpha = 1;
                if (cloud1Sprite && cloud1Sprite.alpha !== 1) cloud1Sprite.alpha = 1;
                if (cloud2Sprite && cloud2Sprite.alpha !== 1) cloud2Sprite.alpha = 1;
                if (cloud3Sprite && cloud3Sprite.alpha !== 1) cloud3Sprite.alpha = 1;
                if (abyssSprite && abyssSprite.alpha !== 1) abyssSprite.alpha = 1;
                if (vignetteSprite && vignetteSprite.alpha !== 1) vignetteSprite.alpha = 1;
              }
              
              // Animate title fading in (1000-1800ms)
              if (elapsed >= TITLE_INTRO_START && elapsed < TITLE_INTRO_START + TITLE_INTRO_DURATION) {
                const titleElapsed = elapsed - TITLE_INTRO_START;
                const titleProgress = easeOutCubic(titleElapsed / TITLE_INTRO_DURATION);
                if (titleSprite) titleSprite.alpha = titleProgress;
              } else if (elapsed >= TITLE_INTRO_START + TITLE_INTRO_DURATION && titleSprite && titleSprite.alpha !== 1) {
                titleSprite.alpha = 1;
              }
              
              // Animate buttons fading in (1800-2400ms)
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
              } else if (elapsed >= BUTTON_INTRO_START + BUTTON_INTRO_DURATION && !introAnimationComplete) {
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
                
                // Trigger shine animation at end of intro
                shineFrame = 0;
                shineTimer = 0;
                if (shineSprite && shineTextures.length > 0) {
                  shineSprite.texture = shineTextures[0];
                  shineSprite.visible = true;
                  shineSprite.alpha = 1;
                }
              }
              
              // === ONGOING CLOUD ANIMATIONS (slow alternation) ===
              
              // Cloud 1 animation (8 frames, ping-pong, slowest - parallax back layer)
              cloud1Timer += deltaTime;
              if (cloud1Timer >= CLOUD1_FRAME_DURATION) {
                cloud1Timer = 0;
                cloud1Frame += cloud1Direction;
                // Ping-pong: reverse direction at ends
                if (cloud1Frame >= 7) {
                  cloud1Frame = 7;
                  cloud1Direction = -1;
                } else if (cloud1Frame <= 0) {
                  cloud1Frame = 0;
                  cloud1Direction = 1;
                }
                if (cloud1Sprite && cloud1Textures.length > 0) {
                  cloud1Sprite.texture = cloud1Textures[cloud1Frame];
                }
              }
              
              // Cloud 2 animation (ping-pong, medium speed - parallax middle layer)
              cloud2Timer += deltaTime;
              if (cloud2Timer >= CLOUD2_FRAME_DURATION) {
                cloud2Timer = 0;
                cloud2Frame += cloud2Direction;
                if (cloud2Frame >= 7) {
                  cloud2Frame = 7;
                  cloud2Direction = -1;
                } else if (cloud2Frame <= 0) {
                  cloud2Frame = 0;
                  cloud2Direction = 1;
                }
                if (cloud2Sprite && cloud2Textures.length > 0) {
                  cloud2Sprite.texture = cloud2Textures[cloud2Frame];
                }
              }
              
              // Cloud 3 animation (ping-pong, fastest - parallax front layer)
              cloud3Timer += deltaTime;
              if (cloud3Timer >= CLOUD3_FRAME_DURATION) {
                cloud3Timer = 0;
                cloud3Frame += cloud3Direction;
                if (cloud3Frame >= 7) {
                  cloud3Frame = 7;
                  cloud3Direction = -1;
                } else if (cloud3Frame <= 0) {
                  cloud3Frame = 0;
                  cloud3Direction = 1;
                }
                if (cloud3Sprite && cloud3Textures.length > 0) {
                  cloud3Sprite.texture = cloud3Textures[cloud3Frame];
                }
              }
              
              // === SHOOTING STAR ANIMATIONS (triggered, staggered) ===
              
              // Shooting Star 1
              if (shootingStar1Frame >= 0) {
                // Currently playing
                shootingStar1Timer += deltaTime;
                if (shootingStar1Timer >= SHOOTING_STAR_FRAME_DURATION) {
                  shootingStar1Timer = 0;
                  shootingStar1Frame++;
                  if (shootingStar1Frame >= 7) {
                    // Animation complete
                    shootingStar1Frame = -1;
                    if (shootingStar1Sprite) {
                      shootingStar1Sprite.visible = false;
                      shootingStar1Sprite.alpha = 0;
                    }
                    shootingStar1Countdown = getRandomCooldown(SHOOTING_STAR_COOLDOWN_MIN, SHOOTING_STAR_COOLDOWN_MAX);
                  } else if (shootingStar1Sprite && shootingStar1Textures.length > shootingStar1Frame) {
                    shootingStar1Sprite.texture = shootingStar1Textures[shootingStar1Frame];
                  }
                }
              } else if (introAnimationComplete) {
                // Countdown to trigger
                shootingStar1Countdown -= deltaTime;
                if (shootingStar1Countdown <= 0) {
                  shootingStar1Frame = 0;
                  shootingStar1Timer = 0;
                  if (shootingStar1Sprite && shootingStar1Textures.length > 0) {
                    shootingStar1Sprite.texture = shootingStar1Textures[0];
                    shootingStar1Sprite.visible = true;
                    shootingStar1Sprite.alpha = 1;
                  }
                }
              }
              
              // Shooting Star 2
              if (shootingStar2Frame >= 0) {
                shootingStar2Timer += deltaTime;
                if (shootingStar2Timer >= SHOOTING_STAR_FRAME_DURATION) {
                  shootingStar2Timer = 0;
                  shootingStar2Frame++;
                  if (shootingStar2Frame >= 7) {
                    shootingStar2Frame = -1;
                    if (shootingStar2Sprite) {
                      shootingStar2Sprite.visible = false;
                      shootingStar2Sprite.alpha = 0;
                    }
                    shootingStar2Countdown = getRandomCooldown(SHOOTING_STAR_COOLDOWN_MIN, SHOOTING_STAR_COOLDOWN_MAX);
                  } else if (shootingStar2Sprite && shootingStar2Textures.length > shootingStar2Frame) {
                    shootingStar2Sprite.texture = shootingStar2Textures[shootingStar2Frame];
                  }
                }
              } else if (introAnimationComplete) {
                shootingStar2Countdown -= deltaTime;
                if (shootingStar2Countdown <= 0) {
                  shootingStar2Frame = 0;
                  shootingStar2Timer = 0;
                  if (shootingStar2Sprite && shootingStar2Textures.length > 0) {
                    shootingStar2Sprite.texture = shootingStar2Textures[0];
                    shootingStar2Sprite.visible = true;
                    shootingStar2Sprite.alpha = 1;
                  }
                }
              }
              
              // Shooting Star 3
              if (shootingStar3Frame >= 0) {
                shootingStar3Timer += deltaTime;
                if (shootingStar3Timer >= SHOOTING_STAR_FRAME_DURATION) {
                  shootingStar3Timer = 0;
                  shootingStar3Frame++;
                  if (shootingStar3Frame >= 7) {
                    shootingStar3Frame = -1;
                    if (shootingStar3Sprite) {
                      shootingStar3Sprite.visible = false;
                      shootingStar3Sprite.alpha = 0;
                    }
                    shootingStar3Countdown = getRandomCooldown(SHOOTING_STAR_COOLDOWN_MIN, SHOOTING_STAR_COOLDOWN_MAX);
                  } else if (shootingStar3Sprite && shootingStar3Textures.length > shootingStar3Frame) {
                    shootingStar3Sprite.texture = shootingStar3Textures[shootingStar3Frame];
                  }
                }
              } else if (introAnimationComplete) {
                shootingStar3Countdown -= deltaTime;
                if (shootingStar3Countdown <= 0) {
                  shootingStar3Frame = 0;
                  shootingStar3Timer = 0;
                  if (shootingStar3Sprite && shootingStar3Textures.length > 0) {
                    shootingStar3Sprite.texture = shootingStar3Textures[0];
                    shootingStar3Sprite.visible = true;
                    shootingStar3Sprite.alpha = 1;
                  }
                }
              }
              
              // Shooting Star 4
              if (shootingStar4Frame >= 0) {
                shootingStar4Timer += deltaTime;
                if (shootingStar4Timer >= SHOOTING_STAR_FRAME_DURATION) {
                  shootingStar4Timer = 0;
                  shootingStar4Frame++;
                  if (shootingStar4Frame >= 7) {
                    shootingStar4Frame = -1;
                    if (shootingStar4Sprite) {
                      shootingStar4Sprite.visible = false;
                      shootingStar4Sprite.alpha = 0;
                    }
                    shootingStar4Countdown = getRandomCooldown(SHOOTING_STAR_COOLDOWN_MIN, SHOOTING_STAR_COOLDOWN_MAX);
                  } else if (shootingStar4Sprite && shootingStar4Textures.length > shootingStar4Frame) {
                    shootingStar4Sprite.texture = shootingStar4Textures[shootingStar4Frame];
                  }
                }
              } else if (introAnimationComplete) {
                shootingStar4Countdown -= deltaTime;
                if (shootingStar4Countdown <= 0) {
                  shootingStar4Frame = 0;
                  shootingStar4Timer = 0;
                  if (shootingStar4Sprite && shootingStar4Textures.length > 0) {
                    shootingStar4Sprite.texture = shootingStar4Textures[0];
                    shootingStar4Sprite.visible = true;
                    shootingStar4Sprite.alpha = 1;
                  }
                }
              }
              
              // === SHINE ANIMATION (triggered occasionally) ===
              if (shineFrame >= 0) {
                shineTimer += deltaTime;
                if (shineTimer >= SHINE_FRAME_DURATION) {
                  shineTimer = 0;
                  shineFrame++;
                  if (shineFrame >= 7) {
                    shineFrame = -1;
                    if (shineSprite) {
                      shineSprite.visible = false;
                      shineSprite.alpha = 0;
                    }
                    shineCountdown = getRandomCooldown(SHINE_COOLDOWN_MIN, SHINE_COOLDOWN_MAX);
                  } else if (shineSprite && shineTextures.length > shineFrame) {
                    shineSprite.texture = shineTextures[shineFrame];
                  }
                }
              } else if (introAnimationComplete) {
                shineCountdown -= deltaTime;
                if (shineCountdown <= 0) {
                  shineFrame = 0;
                  shineTimer = 0;
                  if (shineSprite && shineTextures.length > 0) {
                    shineSprite.texture = shineTextures[0];
                    shineSprite.visible = true;
                    shineSprite.alpha = 1;
                  }
                }
              }
              
              // === SPLASH SCREEN ANIMATION (Questrium logo + CAMP logo) ===
              const splashAnim = splashAnimationRef.current;
              const splashSprite = splashSpriteRef.current;
              const campSprite = campSpriteRef.current;
              const splashBg = splashBgRef.current;
              const splashContainer = splashContainerRef.current;
              const splashTextures = splashTexturesRef.current;
              
              if (splashAnim && splashSprite && campSprite && splashBg && splashContainer && splashTextures.length > 0) {
                const FADE_TO_BLACK_DURATION = 1500; // 1.5 seconds dramatic fade to black
                const FADE_IN_DURATION = 1200; // 1.2 seconds fade in logo
                const SPLASH_FRAME_DURATION = 80; // ms per frame (~12.5fps)
                const SPLASH_HOLD_DURATION = 1000; // 1 second on last frame
                const FADE_OUT_DURATION = 1000; // 1 second fade out
                const CAMP_FADE_IN_DURATION = 1200; // 1.2 seconds fade in CAMP logo
                const CAMP_HOLD_DURATION = 2000; // 2 seconds hold on CAMP logo
                const CAMP_FADE_OUT_DURATION = 1000; // 1 second fade out CAMP logo
                
                // Easing function for smooth fades
                const easeInOutCubic = (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
                
                if (splashAnim.phase === 'fading_to_black') {
                  // Fade black overlay over the title screen
                  splashAnim.timer += deltaTime;
                  const fadeProgress = Math.min(splashAnim.timer / FADE_TO_BLACK_DURATION, 1);
                  splashBg.alpha = easeInOutCubic(fadeProgress);
                  
                  if (fadeProgress >= 1) {
                    // Fully black - now fade in the logo
                    splashAnim.phase = 'fading_in';
                    splashAnim.timer = 0;
                  }
                } else if (splashAnim.phase === 'fading_in') {
                  // Fade in the Questrium logo from black WHILE animating
                  splashAnim.timer += deltaTime;
                  const fadeProgress = Math.min(splashAnim.timer / FADE_IN_DURATION, 1);
                  splashSprite.alpha = easeInOutCubic(fadeProgress);
                  
                  // Animate frames during fade-in (slower rate during fade)
                  const FADE_IN_FRAME_DURATION = 100; // Slightly slower during fade
                  if (splashAnim.timer % FADE_IN_FRAME_DURATION < deltaTime && splashAnim.frame < 35) {
                    splashAnim.frame++;
                    splashSprite.texture = splashTextures[splashAnim.frame];
                  }
                  
                  if (fadeProgress >= 1) {
                    // Logo fully visible - continue animation if not done
                    if (splashAnim.frame >= 35) {
                      splashAnim.phase = 'holding';
                      splashAnim.holdTimer = 0;
                    } else {
                      splashAnim.phase = 'animating';
                      splashAnim.timer = 0;
                    }
                  }
                } else if (splashAnim.phase === 'animating') {
                  splashAnim.timer += deltaTime;
                  if (splashAnim.timer >= SPLASH_FRAME_DURATION) {
                    splashAnim.timer = 0;
                    splashAnim.frame++;
                    if (splashAnim.frame >= 35) {
                      // Reached last frame - switch to holding phase
                      splashAnim.frame = 35;
                      splashAnim.phase = 'holding';
                      splashAnim.holdTimer = 0;
                    }
                    splashSprite.texture = splashTextures[splashAnim.frame];
                  }
                } else if (splashAnim.phase === 'holding') {
                  splashAnim.holdTimer += deltaTime;
                  if (splashAnim.holdTimer >= SPLASH_HOLD_DURATION) {
                    // Fade out the Questrium logo
                    splashAnim.phase = 'fading_out';
                    splashAnim.timer = 0;
                  }
                } else if (splashAnim.phase === 'fading_out') {
                  splashAnim.timer += deltaTime;
                  const fadeProgress = Math.min(splashAnim.timer / FADE_OUT_DURATION, 1);
                  splashSprite.alpha = 1 - easeInOutCubic(fadeProgress);
                  
                  if (fadeProgress >= 1) {
                    // Questrium fade complete - now fade in CAMP logo
                    splashAnim.phase = 'camp_fading_in';
                    splashAnim.timer = 0;
                  }
                } else if (splashAnim.phase === 'camp_fading_in') {
                  // Fade in the CAMP logo
                  splashAnim.timer += deltaTime;
                  const fadeProgress = Math.min(splashAnim.timer / CAMP_FADE_IN_DURATION, 1);
                  campSprite.alpha = easeInOutCubic(fadeProgress);
                  
                  if (fadeProgress >= 1) {
                    // CAMP logo fully visible - hold
                    splashAnim.phase = 'camp_holding';
                    splashAnim.holdTimer = 0;
                  }
                } else if (splashAnim.phase === 'camp_holding') {
                  splashAnim.holdTimer += deltaTime;
                  if (splashAnim.holdTimer >= CAMP_HOLD_DURATION) {
                    // Fade out the CAMP logo
                    splashAnim.phase = 'camp_fading_out';
                    splashAnim.timer = 0;
                  }
                } else if (splashAnim.phase === 'camp_fading_out') {
                  splashAnim.timer += deltaTime;
                  const fadeProgress = Math.min(splashAnim.timer / CAMP_FADE_OUT_DURATION, 1);
                  campSprite.alpha = 1 - easeInOutCubic(fadeProgress);
                  
                  if (fadeProgress >= 1) {
                    // All splashes complete - start game (screen stays black)
                    splashAnimationRef.current = null;
                    startGame();
                  }
                }
              }
            };
            
            app.ticker.add(animationTicker);

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
          const titleText = new PIXI.Text('THE OBSERVATORY', {
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

  // Mouse movement exits keyboard mode - allows seamless switching between input methods
  useEffect(() => {
    if (!introComplete) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      // Only exit keyboard mode if mouse actually moved (not just a hover trigger)
      const last = lastMousePositionRef.current;
      if (last && (Math.abs(e.clientX - last.x) > 5 || Math.abs(e.clientY - last.y) > 5)) {
        // Mouse moved significantly - exit keyboard mode for whichever menu is active
        if (showDebugGrid) {
          setSelectedDebugOption(-1);
        } else {
          setSelectedButton(-1);
        }
      }
      lastMousePositionRef.current = { x: e.clientX, y: e.clientY };
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [introComplete, showDebugGrid]);

  // Keyboard controls for navigation and activation
  useEffect(() => {
    if (!introComplete || showDebugGrid || showSplash || startingGame) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent default behavior for game controls
      if (['ArrowUp', 'ArrowDown', 'x', 'X'].includes(e.key)) {
        e.preventDefault();
      }

      // Arrow key navigation - activates keyboard mode if not already active
      if (e.key === 'ArrowUp') {
        setSelectedButton(prev => {
          // If in mouse mode (no selection), start at Play button
          if (prev < 0) {
            playSound('ui_hover');
            return 0;
          }
          const next = Math.max(0, prev - 1);
          if (next !== prev) playSound('ui_hover');
          return next;
        });
      } else if (e.key === 'ArrowDown') {
        setSelectedButton(prev => {
          // If in mouse mode (no selection), start at Play button
          if (prev < 0) {
            playSound('ui_hover');
            return 0;
          }
          const next = Math.min(2, prev + 1);
          if (next !== prev) playSound('ui_hover');
          return next;
        });
      }
      // X key activation
      else if (e.key === 'x' || e.key === 'X') {
        const playButton = pixiPlayButtonRef.current;
        const devModeButton = pixiDevModeButtonRef.current;
        const whatsNewButton = pixiWhatsNewButtonRef.current;

        if (!playButton || !devModeButton || !whatsNewButton) return;

        // Play confirm sound for any selection
        playSound('ui_confirm');

        // If nothing is highlighted (mouse mode), automatically select Play button
        if (selectedButton < 0) {
          playButton.texture = (playButton as any).selectedTexture;
          playButton.scale.set((playButton as any).baseScale * 0.98);
          setTimeout(() => handleStartGame(), 150);
        }
        // Show selected (third) frame with scale animation for keyboard mode
        else if (selectedButton === 0) {
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
  }, [introComplete, showDebugGrid, selectedButton, showSplash, startingGame, playSound]);

  // Apply visual highlighting to selected button (keyboard mode only)
  useEffect(() => {
    if (!introComplete || showDebugGrid) return;

    const playButton = pixiPlayButtonRef.current;
    const devModeButton = pixiDevModeButtonRef.current;
    const whatsNewButton = pixiWhatsNewButtonRef.current;

    if (!playButton || !devModeButton || !whatsNewButton) return;

    // Reset all buttons to normal state
    playButton.texture = (playButton as any).normalTexture;
    playButton.scale.set((playButton as any).baseScale);
    devModeButton.texture = (devModeButton as any).normalTexture;
    devModeButton.scale.set((devModeButton as any).baseScale);
    whatsNewButton.texture = (whatsNewButton as any).normalTexture;
    whatsNewButton.scale.set((whatsNewButton as any).baseScale);

    // Only apply keyboard highlighting when in keyboard mode (selectedButton >= 0)
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
    // When selectedButton === -1 (mouse mode), all buttons stay in normal state
    // Mouse hover events handle their own highlighting independently
  }, [selectedButton, introComplete, showDebugGrid]);

  // Keyboard controls for debug grid navigation
  useEffect(() => {
    if (!showDebugGrid || showSplash || startingGame) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent default behavior for game controls
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'x', 'X', 'Escape'].includes(e.key)) {
        e.preventDefault();
      }

      // Arrow key navigation - activates keyboard mode if not already active
      if (e.key === 'ArrowLeft') {
        setSelectedDebugOption(prev => {
          if (prev < 0) {
            playSound('ui_hover');
            return 0; // Start at first option
          }
          const next = Math.max(0, prev - 1);
          if (next !== prev) playSound('ui_hover');
          return next;
        });
      } else if (e.key === 'ArrowRight') {
        setSelectedDebugOption(prev => {
          if (prev < 0) {
            playSound('ui_hover');
            return 0; // Start at first option
          }
          const next = Math.min(3, prev + 1); // Allow 4 options (0-3)
          if (next !== prev) playSound('ui_hover');
          return next;
        });
      }
      // X key activation - only works in keyboard mode
      else if ((e.key === 'x' || e.key === 'X') && selectedDebugOption >= 0) {
        const debugStates = ['before_desk', 'before_cutscene', 'after_cutscene', 'character_creator'];
        
        playSound('ui_confirm');
        
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
        playSound('ui_decline');
        setShowDebugGrid(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showDebugGrid, selectedDebugOption, showSplash, startingGame, playSound]);

  // Handle debug grid transitions
  useEffect(() => {
    // Don't run transitions until intro is complete
    if (!isLoaded || !introComplete) return;

    const titleSprite = pixiTitleRef.current;
    const shineSprite = pixiShineRef.current;
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
        
        // Move shine with title
        if (shineSprite) {
          const shineNormalY = (shineSprite as any).normalY;
          const shineDebugY = (shineSprite as any).debugY;
          shineSprite.y = shineNormalY + (shineDebugY - shineNormalY) * easeProgress;
        }

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
        
        // Move shine with title
        if (shineSprite) {
          const shineNormalY = (shineSprite as any).normalY;
          const shineDebugY = (shineSprite as any).debugY;
          shineSprite.y = shineDebugY + (shineNormalY - shineDebugY) * easeProgress;
        }

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
    if (startingGame || loadingDev || showSplash) return;
    
    setStartingGame(true);
    setShowSplash(true);
    
    // Hide PIXI buttons during splash
    const playButton = pixiPlayButtonRef.current;
    const devModeButton = pixiDevModeButtonRef.current;
    const whatsNewButton = pixiWhatsNewButtonRef.current;
    
    if (playButton) {
      playButton.visible = false;
      playButton.eventMode = 'none';
    }
    if (devModeButton) {
      devModeButton.visible = false;
      devModeButton.eventMode = 'none';
    }
    if (whatsNewButton) {
      whatsNewButton.visible = false;
      whatsNewButton.eventMode = 'none';
    }
    
    // Initialize splash animation
    const splashContainer = splashContainerRef.current;
    const splashBg = splashBgRef.current;
    const splashSprite = splashSpriteRef.current;
    const splashTextures = splashTexturesRef.current;
    
    if (splashContainer && splashBg && splashSprite && splashTextures.length > 0) {
      // Reset to first frame, start with everything transparent
      splashSprite.texture = splashTextures[0];
      splashSprite.alpha = 0;
      splashBg.alpha = 0;
      splashContainer.alpha = 1;
      splashContainer.visible = true;
      
      // Start animation state - begin with fade to black
      splashAnimationRef.current = {
        frame: 0,
        timer: 0,
        holdTimer: 0,
        phase: 'fading_to_black'
      };
    } else {
      // Fallback if splash assets not loaded
      setTimeout(() => {
        startGame();
      }, 800);
    }
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
    
    // Define a preset character for dev mode (skips character creation)
    const DEV_MODE_CHARACTER = {
      ...DEFAULT_CHARACTER,
      name: 'Dev',
      parts: {
        ...DEFAULT_CHARACTER.parts,
        'hair': 3,
        'eyes': 2,
        'body': 1,
      },
      skinRamp: 'tan1' as const,
      hairRamp: 'brown' as const,
      shirtRamp: 'purple' as const,
      pantsRamp: 'black' as const,
    };
    
    // Set debug flag based on state
    if (stateId === 'before_desk') {
      localStorage.setItem('debug_skip_to_desk', 'true');
    } else if (stateId === 'before_cutscene') {
      localStorage.setItem('debug_skip_to_cutscene', 'true');
    } else if (stateId === 'after_cutscene') {
      localStorage.setItem('debug_after_cutscene', 'true');
    } else if (stateId === 'character_creator') {
      // Go directly to character creator via game store
      setTimeout(() => {
        startGame(); // startGame goes to character_creator phase
      }, 400);
      return;
    }
    
    // For all non-character_creator debug modes, use preset character and skip to playing
    console.log('🧪 Using preset dev character to skip character creation');
    setCharacter(DEV_MODE_CHARACTER);
    setHasCreatedCharacter(true);
    
    // Transition effect - fade out grid
    setTimeout(() => {
      // Go directly to game (playing phase), skipping character creator
      startFromCharacterCreator();
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
          {/* Flashing "Press X to Play" indicator - shows after intro completes */}
          <PressXIndicator $visible={introComplete && !showDebugGrid && !startingGame && !showSplash}>
            <XKeySprite $frame={3} />
            <PressXLabel>to Play</PressXLabel>
          </PressXIndicator>
          
          {/* Game version */}
          <GameVersion $visible={!showSplash}>
            {getCurrentVersionString()} - by Questrium
          </GameVersion>
        </UIOverlay>
        
        {/* What's New button is now a PIXI sprite - HTML button removed */}
        
        {/* Vignette overlay - appears on top of everything except changelog */}
        <TitleVignette $visible={!showSplash} />
        
        {/* Changelog popup */}
        <ChangelogPopup 
          isOpen={showChangelog} 
          onClose={() => setShowChangelog(false)} 
        />
        
        {/* Debug State Grid - shown when test button is clicked */}
        <DebugGridContainer $visible={showDebugGrid}>
          <DebugGrid>
            {/* Row 1 */}
            <DebugBox $isSelected={selectedDebugOption === 0}>
              <DebugBoxImage 
                $debugOption={0} 
                $isSelected={selectedDebugOption === 0}
                $isPressed={pressedDebugOption === 0}
              />
              <DebugBoxLabel>Before Desk</DebugBoxLabel>
            </DebugBox>
            <DebugBox $isSelected={selectedDebugOption === 1}>
              <DebugBoxImage 
                $debugOption={1} 
                $isSelected={selectedDebugOption === 1}
                $isPressed={pressedDebugOption === 1}
              />
              <DebugBoxLabel>Before Cutscene</DebugBoxLabel>
            </DebugBox>
            <DebugBox $isSelected={selectedDebugOption === 2}>
              <DebugBoxImage 
                $debugOption={2} 
                $isSelected={selectedDebugOption === 2}
                $isPressed={pressedDebugOption === 2}
              />
              <DebugBoxLabel>After Cutscene</DebugBoxLabel>
            </DebugBox>
            
            {/* Row 2 */}
            <DebugBox $isSelected={selectedDebugOption === 3}>
              <DebugBoxImage 
                $debugOption={3} 
                $isSelected={selectedDebugOption === 3}
                $isPressed={pressedDebugOption === 3}
              />
              <DebugBoxLabel>Character Creator</DebugBoxLabel>
            </DebugBox>
            <DebugBox $isEmpty />
            <DebugBox $isEmpty />
            <DebugBox $isEmpty />
            
            {/* Row 3 */}
            <DebugBox $isEmpty />
            <DebugBox $isEmpty />
            <DebugBox $isEmpty />
          </DebugGrid>
        </DebugGridContainer>
      </FullScreenContainer>
    </>
  );
}; 