'use client';

import React, { useRef, useEffect, useState } from 'react';
import styled from 'styled-components';
import * as PIXI from 'pixi.js';
import { useSceneNavigation } from '@/app/components/scenes/GameContainer';
import { useTutorialStore } from '@/app/store/tutorialStore';
import { isRoomAvailableInTutorial, isRecommendedTutorialRoom, getTutorialDialogueForRoom } from '@/app/data/tutorialDialogues';
import { centralEventBus } from '@/app/core/events/CentralEventBus';
import { GameEventType } from '@/app/types';
import { useGameStore } from '@/app/store/gameStore';
import MentorClickOverlay from '@/app/components/hospital/MentorClickOverlay';
import { useSceneStore } from '@/app/store/sceneStore';
import { initializeMentorContentManager } from '@/app/core/mentors/mentorContentManager';
import { initializeTutorialTimeProgression, type TimeOfDay } from '@/app/core/time/TutorialTimeProgression';

// Using the user's fine-tuned coordinates for room placement.
interface RoomArea {
    id: string;
    name: string;
    icon: string;
    x: number;
    y: number;
    isoWidth: number;
    isoHeight: number;
    mentorId: string;
    activityType: 'narrative' | 'social-hub';
}

const ROOM_AREAS: RoomArea[] = [
    { id: 'physics-office', name: 'Physics Office', icon: '/images/temp/Notepad.png', x: 52, y: 91, isoWidth: 2, isoHeight: 2, mentorId: 'quinn', activityType: 'narrative' },
    { id: 'lunch-room', name: 'Hospital Cafeteria', icon: '/images/temp/Cardboard Box.png', x: 46, y: 39, isoWidth: 2, isoHeight: 4.5, mentorId: 'social', activityType: 'social-hub' },
    { id: 'linac-1', name: 'LINAC Room 1',  icon: '/images/temp/Warning Icon.png', x: 59.5, y: 34, isoWidth: 3, isoHeight: 3.8, mentorId: 'garcia', activityType: 'narrative' },
    { id: 'linac-2', name: 'LINAC Room 2', icon: '/images/temp/Red Warning icon.png', x: 62.5, y: 37, isoWidth: 3, isoHeight: 3.8, mentorId: 'jesse', activityType: 'narrative' },
    { id: 'dosimetry-lab', name: 'Dosimetry Lab', icon: '/images/temp/CD.png', x: 65.2, y: 44.5, isoWidth: 2.4, isoHeight: 2.4, mentorId: 'kapoor', activityType: 'narrative' },
    { id: 'simulation-suite', name: 'Simulation Suite', icon: '/images/temp/Modern TV Colors.png', x: 55, y: 32, isoWidth: 3.4, isoHeight: 3.4, mentorId: 'jesse', activityType: 'narrative' }
];



// === GAME WORLD CONFIGURATION ===
// Define fixed world dimensions for consistent scaling
const WORLD_WIDTH = 1920;
const WORLD_HEIGHT = 1080;

// Ambient creature definitions in world coordinates
const AMBIENT_CREATURES = [
    // Birds (world coordinates)
    { id: 'bird-1', spriteSheet: '/images/ambient/birds.png', frameCount: 4, pathDuration: 25, startX: -750, startY: -450, endX: 850, endY: -250, scale: 1.5, animationSpeed: 0.15, pathType: 'arc', delay: 0 },
    { id: 'bird-2', spriteSheet: '/images/ambient/birds-two.png', frameCount: 4, pathDuration: 30, startX: 850, startY: -550, endX: -750, endY: -300, scale: 1.4, animationSpeed: 0.12, pathType: 'arc', delay: 8000 },
    { id: 'bird-3', spriteSheet: '/images/ambient/birds-three.png', frameCount: 4, pathDuration: 35, startX: -850, startY: -650, endX: 950, endY: -350, scale: 1.6, animationSpeed: 0.1, pathType: 'arc', delay: 15000 },
    
    // People (world coordinates, positioned in hospital area)
    { id: 'quinn-walking', spriteSheet: '/images/ambient/quinn-walking.png', frameCount: 2, pathDuration: 55, startX: -350, startY: -150, endX: -350, endY: -150, scale: 1.5, animationSpeed: 0.1, delay: 0 },

    // Animals (world coordinates)
    { id: 'deer-1', spriteSheet: '/images/ambient/deer.png', frameCount: 4, pathDuration: 60, startX: -850, startY: -250, endX: -800, endY: -250, scale: 1.5, animationSpeed: 0.05, delay: 0 },
];

// Weather particle definitions in world coordinates (hidden by default)
const WEATHER_PARTICLES = [
    // Rain particles - diagonal falling pattern
    { id: 'rain-drop-1', spriteSheet: '/images/weather/rain-drop.png', frameCount: 3, pathDuration: 6, startX: -1000, startY: -600, endX: -700, endY: 600, scale: 1.0, animationSpeed: 0.3, pathType: 'rain', delay: 0, weatherType: 'rain' },
    { id: 'rain-drop-2', spriteSheet: '/images/weather/rain-drop.png', frameCount: 3, pathDuration: 7, startX: -800, startY: -600, endX: -500, endY: 600, scale: 0.8, animationSpeed: 0.25, pathType: 'rain', delay: 500, weatherType: 'rain' },
    { id: 'rain-drop-3', spriteSheet: '/images/weather/rain-drop.png', frameCount: 3, pathDuration: 5, startX: -600, startY: -600, endX: -300, endY: 600, scale: 1.2, animationSpeed: 0.35, pathType: 'rain', delay: 1000, weatherType: 'rain' },
    { id: 'rain-drop-4', spriteSheet: '/images/weather/rain-drop.png', frameCount: 3, pathDuration: 8, startX: -400, startY: -600, endX: -100, endY: 600, scale: 0.9, animationSpeed: 0.2, pathType: 'rain', delay: 1500, weatherType: 'rain' },
    { id: 'rain-drop-5', spriteSheet: '/images/weather/rain-drop.png', frameCount: 3, pathDuration: 6, startX: -200, startY: -600, endX: 100, endY: 600, scale: 1.1, animationSpeed: 0.3, pathType: 'rain', delay: 2000, weatherType: 'rain' },
    { id: 'rain-drop-6', spriteSheet: '/images/weather/rain-drop.png', frameCount: 3, pathDuration: 7, startX: 0, startY: -600, endX: 300, endY: 600, scale: 0.85, animationSpeed: 0.28, pathType: 'rain', delay: 2500, weatherType: 'rain' },
    { id: 'rain-drop-7', spriteSheet: '/images/weather/rain-drop.png', frameCount: 3, pathDuration: 5, startX: 200, startY: -600, endX: 500, endY: 600, scale: 1.0, animationSpeed: 0.32, pathType: 'rain', delay: 3000, weatherType: 'rain' },
    { id: 'rain-drop-8', spriteSheet: '/images/weather/rain-drop.png', frameCount: 3, pathDuration: 8, startX: 400, startY: -600, endX: 700, endY: 600, scale: 0.95, animationSpeed: 0.22, pathType: 'rain', delay: 3500, weatherType: 'rain' },
    { id: 'rain-drop-9', spriteSheet: '/images/weather/rain-drop.png', frameCount: 3, pathDuration: 6, startX: 600, startY: -600, endX: 900, endY: 600, scale: 1.15, animationSpeed: 0.3, pathType: 'rain', delay: 4000, weatherType: 'rain' },
    { id: 'rain-drop-10', spriteSheet: '/images/weather/rain-drop.png', frameCount: 3, pathDuration: 7, startX: 800, startY: -600, endX: 1100, endY: 600, scale: 0.9, animationSpeed: 0.25, pathType: 'rain', delay: 4500, weatherType: 'rain' },

    // Heavy rain variants for storm effects
    { id: 'rain-heavy-1', spriteSheet: '/images/weather/rain-heavy.png', frameCount: 4, pathDuration: 4, startX: -900, startY: -600, endX: -600, endY: 600, scale: 1.3, animationSpeed: 0.4, pathType: 'rain', delay: 0, weatherType: 'storm' },
    { id: 'rain-heavy-2', spriteSheet: '/images/weather/rain-heavy.png', frameCount: 4, pathDuration: 5, startX: -500, startY: -600, endX: -200, endY: 600, scale: 1.1, animationSpeed: 0.35, pathType: 'rain', delay: 800, weatherType: 'storm' },
    { id: 'rain-heavy-3', spriteSheet: '/images/weather/rain-heavy.png', frameCount: 4, pathDuration: 3, startX: -100, startY: -600, endX: 200, endY: 600, scale: 1.4, animationSpeed: 0.45, pathType: 'rain', delay: 1600, weatherType: 'storm' },
    { id: 'rain-heavy-4', spriteSheet: '/images/weather/rain-heavy.png', frameCount: 4, pathDuration: 4, startX: 300, startY: -600, endX: 600, endY: 600, scale: 1.2, animationSpeed: 0.38, pathType: 'rain', delay: 2400, weatherType: 'storm' },
    { id: 'rain-heavy-5', spriteSheet: '/images/weather/rain-heavy.png', frameCount: 4, pathDuration: 5, startX: 700, startY: -600, endX: 1000, endY: 600, scale: 1.0, animationSpeed: 0.33, pathType: 'rain', delay: 3200, weatherType: 'storm' },

    // Snow particles - gentle floating pattern
    { id: 'snowflake-small-1', spriteSheet: '/images/weather/snowflake-small.png', frameCount: 4, pathDuration: 15, startX: -800, startY: -600, endX: -700, endY: 600, scale: 1.0, animationSpeed: 0.1, pathType: 'snow', delay: 0, weatherType: 'snow' },
    { id: 'snowflake-small-2', spriteSheet: '/images/weather/snowflake-small.png', frameCount: 4, pathDuration: 18, startX: -400, startY: -600, endX: -250, endY: 600, scale: 0.8, animationSpeed: 0.08, pathType: 'snow', delay: 2000, weatherType: 'snow' },
    { id: 'snowflake-small-3', spriteSheet: '/images/weather/snowflake-small.png', frameCount: 4, pathDuration: 20, startX: 0, startY: -600, endX: 200, endY: 600, scale: 1.2, animationSpeed: 0.12, pathType: 'snow', delay: 4000, weatherType: 'snow' },
    { id: 'snowflake-small-4', spriteSheet: '/images/weather/snowflake-small.png', frameCount: 4, pathDuration: 16, startX: 400, startY: -600, endX: 550, endY: 600, scale: 0.9, animationSpeed: 0.09, pathType: 'snow', delay: 6000, weatherType: 'snow' },
    { id: 'snowflake-small-5', spriteSheet: '/images/weather/snowflake-small.png', frameCount: 4, pathDuration: 22, startX: 800, startY: -600, endX: 900, endY: 600, scale: 1.1, animationSpeed: 0.11, pathType: 'snow', delay: 8000, weatherType: 'snow' },

    { id: 'snowflake-large-1', spriteSheet: '/images/weather/snowflake-large.png', frameCount: 4, pathDuration: 25, startX: -600, startY: -600, endX: -450, endY: 600, scale: 1.5, animationSpeed: 0.06, pathType: 'snow', delay: 1000, weatherType: 'snow' },
    { id: 'snowflake-large-2', spriteSheet: '/images/weather/snowflake-large.png', frameCount: 4, pathDuration: 28, startX: -200, startY: -600, endX: 0, endY: 600, scale: 1.3, animationSpeed: 0.05, pathType: 'snow', delay: 5000, weatherType: 'snow' },
    { id: 'snowflake-large-3', spriteSheet: '/images/weather/snowflake-large.png', frameCount: 4, pathDuration: 30, startX: 200, startY: -600, endX: 400, endY: 600, scale: 1.6, animationSpeed: 0.04, pathType: 'snow', delay: 9000, weatherType: 'snow' },
    { id: 'snowflake-large-4', spriteSheet: '/images/weather/snowflake-large.png', frameCount: 4, pathDuration: 26, startX: 600, startY: -600, endX: 750, endY: 600, scale: 1.4, animationSpeed: 0.07, pathType: 'snow', delay: 13000, weatherType: 'snow' },

    // Atmospheric mist/fog effects - horizontal drift
    { id: 'mist-wisp-1', spriteSheet: '/images/weather/mist-wisp.png', frameCount: 2, pathDuration: 35, startX: -1000, startY: -200, endX: 1000, endY: -180, scale: 2.0, animationSpeed: 0.03, pathType: 'mist', delay: 0, weatherType: 'fog' },
    { id: 'mist-wisp-2', spriteSheet: '/images/weather/mist-wisp.png', frameCount: 2, pathDuration: 40, startX: -1000, startY: -100, endX: 1000, endY: -120, scale: 1.8, animationSpeed: 0.025, pathType: 'mist', delay: 8000, weatherType: 'fog' },
    { id: 'mist-wisp-3', spriteSheet: '/images/weather/mist-wisp.png', frameCount: 2, pathDuration: 38, startX: -1000, startY: 0, endX: 1000, endY: 20, scale: 2.2, animationSpeed: 0.028, pathType: 'mist', delay: 16000, weatherType: 'fog' },

    { id: 'fog-patch-1', spriteSheet: '/images/weather/fog-patch.png', frameCount: 3, pathDuration: 45, startX: -1000, startY: -300, endX: 1000, endY: -280, scale: 2.5, animationSpeed: 0.02, pathType: 'mist', delay: 5000, weatherType: 'fog' },
    { id: 'fog-patch-2', spriteSheet: '/images/weather/fog-patch.png', frameCount: 3, pathDuration: 50, startX: -1000, startY: -50, endX: 1000, endY: -30, scale: 2.3, animationSpeed: 0.018, pathType: 'mist', delay: 20000, weatherType: 'fog' },
    { id: 'fog-patch-3', spriteSheet: '/images/weather/fog-patch.png', frameCount: 3, pathDuration: 42, startX: -1000, startY: 100, endX: 1000, endY: 120, scale: 2.7, animationSpeed: 0.022, pathType: 'mist', delay: 30000, weatherType: 'fog' },
];

// Pond ripple system - spawned dynamically on pond surface
const POND_RIPPLES = [
    // Basic ambient ripples
    { id: 'ripple-small-1', spriteSheet: '/images/pond/ripple-small.png', frameCount: 4, duration: 2.0, scale: 1.0, animationSpeed: 0.5, rippleType: 'ambient' },
    { id: 'ripple-small-2', spriteSheet: '/images/pond/ripple-small.png', frameCount: 4, duration: 2.2, scale: 0.8, animationSpeed: 0.45, rippleType: 'ambient' },
    { id: 'ripple-medium-1', spriteSheet: '/images/pond/ripple-medium.png', frameCount: 4, duration: 3.0, scale: 1.2, animationSpeed: 0.35, rippleType: 'ambient' },
    { id: 'ripple-medium-2', spriteSheet: '/images/pond/ripple-medium.png', frameCount: 4, duration: 2.8, scale: 1.0, animationSpeed: 0.4, rippleType: 'ambient' },
    
    // Rain ripples
    { id: 'ripple-rain-1', spriteSheet: '/images/pond/ripple-rain.png', frameCount: 3, duration: 1.5, scale: 0.6, animationSpeed: 0.6, rippleType: 'rain' },
    { id: 'ripple-rain-2', spriteSheet: '/images/pond/ripple-rain.png', frameCount: 3, duration: 1.3, scale: 0.8, animationSpeed: 0.7, rippleType: 'rain' },
    { id: 'ripple-rain-3', spriteSheet: '/images/pond/ripple-rain.png', frameCount: 3, duration: 1.4, scale: 0.7, animationSpeed: 0.65, rippleType: 'rain' },
    
    // Storm ripples
    { id: 'ripple-storm-1', spriteSheet: '/images/pond/ripple-storm.png', frameCount: 5, duration: 4.0, scale: 1.5, animationSpeed: 0.4, rippleType: 'storm' },
    { id: 'ripple-storm-2', spriteSheet: '/images/pond/ripple-storm.png', frameCount: 5, duration: 3.8, scale: 1.3, animationSpeed: 0.45, rippleType: 'storm' },
    
    // Water sparkles for clear/sunny weather
    { id: 'water-sparkle-1', spriteSheet: '/images/pond/water-sparkle.png', frameCount: 3, duration: 1.8, scale: 0.5, animationSpeed: 0.3, rippleType: 'sparkle' },
    { id: 'water-sparkle-2', spriteSheet: '/images/pond/water-sparkle.png', frameCount: 3, duration: 2.0, scale: 0.6, animationSpeed: 0.25, rippleType: 'sparkle' },
];

// Static environment elements in world coordinates
const ENVIRONMENT_SPRITES = [
    // Trees positioned around the world
    { id: 'tree-1', sprite: '/images/ambient/tree-oak-medium.png', x: -650, y: -300, scale: 0.8 },
    { id: 'tree-2', sprite: '/images/ambient/tree-pine-large.png', x: -450, y: -360, scale: 0.9 },
    { id: 'tree-3', sprite: '/images/ambient/tree-oak-large.png', x: -250, y: -270, scale: 0.7 },
    { id: 'tree-4', sprite: '/images/ambient/tree-pine-medium.png', x: -700, y: -150, scale: 1.0 },
    { id: 'tree-5', sprite: '/images/ambient/tree-oak-medium.png', x: 750, y: -300, scale: 0.9 },
    { id: 'tree-6', sprite: '/images/ambient/tree-pine-large.png', x: 550, y: -250, scale: 0.8 },
    { id: 'tree-7', sprite: '/images/ambient/tree-oak-large.png', x: 800, y: -150, scale: 0.6 },
    { id: 'tree-8', sprite: '/images/ambient/tree-pine-medium.png', x: 500, y: -350, scale: 1.1 },
    
    // Additional northern forest density - creating a dense woodland
    { id: 'tree-9', sprite: '/images/ambient/tree-pine-medium.png', x: -800, y: -370, scale: 0.9 },
    { id: 'tree-10', sprite: '/images/ambient/tree-oak-large.png', x: -550, y: -400, scale: 0.8 },
    { id: 'tree-11', sprite: '/images/ambient/tree-pine-large.png', x: -300, y: -430, scale: 1.0 },
    { id: 'tree-12', sprite: '/images/ambient/tree-oak-medium.png', x: -50, y: -360, scale: 0.7 },
    { id: 'tree-13', sprite: '/images/ambient/tree-pine-medium.png', x: 250, y: -400, scale: 1.1 },
    { id: 'tree-14', sprite: '/images/ambient/tree-oak-large.png', x: 650, y: -370, scale: 0.9 },
    { id: 'tree-15', sprite: '/images/ambient/tree-pine-large.png', x: 900, y: -330, scale: 0.8 },
    { id: 'tree-16', sprite: '/images/ambient/tree-oak-medium.png', x: -400, y: -330, scale: 1.0 },
    
    // Even more forest density - filling in gaps
    { id: 'tree-17', sprite: '/images/ambient/tree-pine-medium.png', x: -700, y: -450, scale: 0.6 },
    { id: 'tree-18', sprite: '/images/ambient/tree-oak-medium.png', x: -200, y: -410, scale: 0.9 },
    { id: 'tree-19', sprite: '/images/ambient/tree-pine-large.png', x: 100, y: -430, scale: 0.8 },
    { id: 'tree-20', sprite: '/images/ambient/tree-oak-large.png', x: 450, y: -410, scale: 1.0 },
    { id: 'tree-21', sprite: '/images/ambient/tree-pine-medium.png', x: 800, y: -390, scale: 0.7 },
    { id: 'tree-22', sprite: '/images/ambient/tree-oak-medium.png', x: -900, y: -330, scale: 0.8 },
    { id: 'tree-23', sprite: '/images/ambient/tree-pine-large.png', x: 1000, y: -370, scale: 0.9 },
    { id: 'tree-24', sprite: '/images/ambient/tree-oak-large.png', x: -100, y: -470, scale: 0.6 },
    
    // New birch tree variety for visual diversity
    { id: 'tree-25', sprite: '/images/ambient/tree-birch-medium.png', x: -750, y: -400, scale: 0.9 },
    { id: 'tree-26', sprite: '/images/ambient/tree-birch-medium.png', x: -350, y: -430, scale: 1.1 },
    { id: 'tree-27', sprite: '/images/ambient/tree-birch-medium.png', x: 200, y: -370, scale: 0.8 },
    { id: 'tree-28', sprite: '/images/ambient/tree-birch-medium.png', x: 550, y: -430, scale: 1.0 },
    { id: 'tree-29', sprite: '/images/ambient/tree-birch-medium.png', x: 850, y: -410, scale: 0.7 },
    { id: 'tree-30', sprite: '/images/ambient/tree-birch-medium.png', x: -150, y: -450, scale: 1.2 },
    
    // Additional trees for the stepped green areas (smaller scale) - only trees here
    // Range 1: 600-900 (x), around -300 (y)
    { id: 'tree-31', sprite: '/images/ambient/tree-oak-large.png', x: 670, y: -285, scale: 0.6 },
    { id: 'tree-33', sprite: '/images/ambient/tree-birch-medium.png', x: 770, y: -255, scale: 0.5 },
    { id: 'tree-35', sprite: '/images/ambient/tree-pine-large.png', x: 880, y: -250, scale: 0.5 },
    
    // Range 2: 700-900 (x), around -200 (y)
    { id: 'tree-38', sprite: '/images/ambient/tree-pine-medium.png', x: 820, y: -140, scale: 0.7 },
    { id: 'tree-40', sprite: '/images/ambient/tree-pine-large.png', x: 920, y: -145, scale: 0.6 },
    
    // Range 3: 800-900 (x), around -100 (y)
    { id: 'tree-41', sprite: '/images/ambient/tree-birch-medium.png', x: 860, y: -60, scale: 0.6 },
    
    // Range 4: 800-900 (x), around 0 (y)
    { id: 'tree-44', sprite: '/images/ambient/tree-oak-medium.png', x: 870, y: 40, scale: 0.6 },
    { id: 'tree-46', sprite: '/images/ambient/tree-pine-large.png', x: 940, y: 45, scale: 0.7 },
    
    // Left area trees: -900 to -800 (x), -300 to -100 (y)
    { id: 'tree-47', sprite: '/images/ambient/tree-oak-medium.png', x: -830, y: -230, scale: 0.6 },
    { id: 'tree-50', sprite: '/images/ambient/tree-pine-medium.png', x: -770, y: -170, scale: 0.6 },
    { id: 'tree-52', sprite: '/images/ambient/tree-birch-medium.png', x: -780, y: -130, scale: 0.5 },
    { id: 'tree-55', sprite: '/images/ambient/tree-pine-large.png', x: -760, y: -70, scale: 0.6 },
    
    // Dense forest line at y=-500 (back row) - scattered naturally
    { id: 'tree-56', sprite: '/images/ambient/tree-pine-large.png', x: -800, y: -480, scale: 1.0 },
    { id: 'tree-57', sprite: '/images/ambient/tree-oak-medium.png', x: -700, y: -520, scale: 0.9 },
    { id: 'tree-58', sprite: '/images/ambient/tree-birch-medium.png', x: -600, y: -460, scale: 1.1 },
    { id: 'tree-59', sprite: '/images/ambient/tree-pine-medium.png', x: -500, y: -530, scale: 0.8 },
    { id: 'tree-60', sprite: '/images/ambient/tree-oak-large.png', x: -400, y: -470, scale: 1.0 },
    { id: 'tree-61', sprite: '/images/ambient/tree-pine-large.png', x: -300, y: -510, scale: 0.9 },
    { id: 'tree-62', sprite: '/images/ambient/tree-birch-medium.png', x: -200, y: -485, scale: 1.2 },
    { id: 'tree-63', sprite: '/images/ambient/tree-oak-medium.png', x: -100, y: -495, scale: 0.8 },
    { id: 'tree-64', sprite: '/images/ambient/tree-pine-medium.png', x: 0, y: -465, scale: 1.1 },
    { id: 'tree-65', sprite: '/images/ambient/tree-oak-large.png', x: 100, y: -515, scale: 0.9 },
    { id: 'tree-66', sprite: '/images/ambient/tree-birch-medium.png', x: 200, y: -490, scale: 1.0 },
    { id: 'tree-67', sprite: '/images/ambient/tree-pine-large.png', x: 300, y: -475, scale: 0.8 },
    { id: 'tree-68', sprite: '/images/ambient/tree-oak-medium.png', x: 400, y: -525, scale: 1.2 },
    { id: 'tree-69', sprite: '/images/ambient/tree-pine-medium.png', x: 500, y: -460, scale: 0.9 },
    { id: 'tree-70', sprite: '/images/ambient/tree-birch-medium.png', x: 600, y: -505, scale: 1.1 },
    { id: 'tree-71', sprite: '/images/ambient/tree-oak-large.png', x: 700, y: -485, scale: 0.8 },
    { id: 'tree-72', sprite: '/images/ambient/tree-pine-large.png', x: 800, y: -520, scale: 1.0 },
    
    // Extra corner density (left corner around x=-900) - scattered
    { id: 'tree-73', sprite: '/images/ambient/tree-oak-large.png', x: -920, y: -485, scale: 0.9 },
    { id: 'tree-74', sprite: '/images/ambient/tree-pine-medium.png', x: -880, y: -515, scale: 1.1 },
    { id: 'tree-75', sprite: '/images/ambient/tree-birch-medium.png', x: -850, y: -460, scale: 0.8 },
    { id: 'tree-76', sprite: '/images/ambient/tree-oak-medium.png', x: -900, y: -495, scale: 1.0 },
    
    // Extra corner density (right corner around x=900) - scattered
    { id: 'tree-77', sprite: '/images/ambient/tree-pine-large.png', x: 920, y: -475, scale: 0.9 },
    { id: 'tree-78', sprite: '/images/ambient/tree-oak-medium.png', x: 880, y: -520, scale: 1.1 },
    { id: 'tree-79', sprite: '/images/ambient/tree-birch-medium.png', x: 850, y: -465, scale: 0.8 },
    { id: 'tree-80', sprite: '/images/ambient/tree-pine-medium.png', x: 900, y: -500, scale: 1.0 },
    
    // Left edge trees (x=-900, y=-500 to 0) - new addition
    { id: 'tree-91', sprite: '/images/ambient/tree-oak-large.png', x: -960, y: -435, scale: 0.7 },
    { id: 'tree-92', sprite: '/images/ambient/tree-pine-medium.png', x: -910, y: -385, scale: 0.9 },
    { id: 'tree-93', sprite: '/images/ambient/tree-birch-medium.png', x: -870, y: -330, scale: 0.8 },
    { id: 'tree-94', sprite: '/images/ambient/tree-oak-medium.png', x: -980, y: -285, scale: 1.0 },
    { id: 'tree-96', sprite: '/images/ambient/tree-birch-medium.png', x: -880, y: -185, scale: 0.8 },
    { id: 'tree-97', sprite: '/images/ambient/tree-oak-medium.png', x: -910, y: -135, scale: 0.7 },
    { id: 'tree-99', sprite: '/images/ambient/tree-oak-large.png', x: -940, y: -35, scale: 0.6 },
    { id: 'tree-100', sprite: '/images/ambient/tree-birch-medium.png', x: -890, y: 15, scale: 0.8 },
    
    // Right edge trees (x=900, y=-500 to 0) - scattered
    { id: 'tree-81', sprite: '/images/ambient/tree-oak-large.png', x: 870, y: -440, scale: 0.7 },
    { id: 'tree-83', sprite: '/images/ambient/tree-birch-medium.png', x: 880, y: -335, scale: 0.8 },
    { id: 'tree-84', sprite: '/images/ambient/tree-oak-medium.png', x: 900, y: -290, scale: 1.0 },
    { id: 'tree-87', sprite: '/images/ambient/tree-oak-medium.png', x: 870, y: -145, scale: 0.7 },
    { id: 'tree-90', sprite: '/images/ambient/tree-birch-medium.png', x: 890, y: 5, scale: 0.8 },
];

// Bush system - flowering and berry bushes spread across entire landscape
const BUSH_SPRITES = [
    // Flowering bushes - colorful accents spread around
    { id: 'bush-1', sprite: '/images/ambient/bush-flowering.png', frameCount: 2, x: -670, y: -330, scale: 1.0, animationSpeed: 0.02 },
    { id: 'bush-2', sprite: '/images/ambient/bush-flowering.png', frameCount: 2, x: -270, y: -300, scale: 1.1, animationSpeed: 0.025 },
    { id: 'bush-3', sprite: '/images/ambient/bush-flowering.png', frameCount: 2, x: 570, y: -300, scale: 1.0, animationSpeed: 0.02 },
    { id: 'bush-4', sprite: '/images/ambient/bush-flowering.png', frameCount: 2, x: 770, y: -330, scale: 0.9, animationSpeed: 0.025 },
    { id: 'bush-5', sprite: '/images/ambient/bush-flowering.png', frameCount: 2, x: -800, y: -300, scale: 1.1, animationSpeed: 0.02 },
    
    // Additional flowering bushes for foliage areas (small scale)
    { id: 'bush-6', sprite: '/images/ambient/bush-flowering.png', frameCount: 2, x: 720, y: -240, scale: 0.7, animationSpeed: 0.02 },
    { id: 'bush-7', sprite: '/images/ambient/bush-flowering.png', frameCount: 2, x: 770, y: -160, scale: 0.6, animationSpeed: 0.025 },
    { id: 'bush-8', sprite: '/images/ambient/bush-flowering.png', frameCount: 2, x: 910, y: 60, scale: 0.5, animationSpeed: 0.03 },
    { id: 'bush-9', sprite: '/images/ambient/bush-flowering.png', frameCount: 2, x: -800, y: -210, scale: 0.7, animationSpeed: 0.02 },
    { id: 'bush-10', sprite: '/images/ambient/bush-flowering.png', frameCount: 2, x: -790, y: -90, scale: 0.5, animationSpeed: 0.025 },
    
    // Berry bushes - natural food sources spread wide
    { id: 'berry-2', sprite: '/images/ambient/bush-berry.png', frameCount: 2, x: -230, y: -280, scale: 0.8, animationSpeed: 0.025 },
    { id: 'berry-3', sprite: '/images/ambient/bush-berry.png', frameCount: 2, x: 500, y: -270, scale: 1.2, animationSpeed: 0.025 },
    { id: 'berry-4', sprite: '/images/ambient/bush-berry.png', frameCount: 2, x: 830, y: -270, scale: 0.8, animationSpeed: 0.025 },
    
    // Additional berry bushes for foliage areas (small scale)
    { id: 'berry-5', sprite: '/images/ambient/bush-berry.png', frameCount: 2, x: 930, y: -240, scale: 0.8, animationSpeed: 0.02 },
    { id: 'berry-6', sprite: '/images/ambient/bush-berry.png', frameCount: 2, x: 900, y: -40, scale: 0.7, animationSpeed: 0.025 },
    { id: 'berry-7', sprite: '/images/ambient/bush-berry.png', frameCount: 2, x: -810, y: -150, scale: 0.7, animationSpeed: 0.02 },
    
    // Dense bush line at y=-500 to complement trees
    { id: 'bush-11', sprite: '/images/ambient/bush-flowering.png', frameCount: 2, x: -750, y: -485, scale: 0.9, animationSpeed: 0.02 },
    { id: 'bush-12', sprite: '/images/ambient/bush-berry.png', frameCount: 2, x: -650, y: -515, scale: 0.8, animationSpeed: 0.025 },
    { id: 'bush-13', sprite: '/images/ambient/bush-flowering.png', frameCount: 2, x: -550, y: -475, scale: 1.0, animationSpeed: 0.02 },
    { id: 'bush-14', sprite: '/images/ambient/bush-berry.png', frameCount: 2, x: -450, y: -520, scale: 0.9, animationSpeed: 0.025 },
    { id: 'bush-15', sprite: '/images/ambient/bush-flowering.png', frameCount: 2, x: -350, y: -465, scale: 0.8, animationSpeed: 0.02 },
    { id: 'bush-16', sprite: '/images/ambient/bush-berry.png', frameCount: 2, x: -250, y: -510, scale: 1.1, animationSpeed: 0.025 },
    { id: 'bush-17', sprite: '/images/ambient/bush-flowering.png', frameCount: 2, x: -150, y: -480, scale: 0.9, animationSpeed: 0.02 },
    { id: 'bush-18', sprite: '/images/ambient/bush-berry.png', frameCount: 2, x: -50, y: -495, scale: 0.8, animationSpeed: 0.025 },
    { id: 'bush-19', sprite: '/images/ambient/bush-flowering.png', frameCount: 2, x: 50, y: -525, scale: 1.0, animationSpeed: 0.02 },
    { id: 'bush-20', sprite: '/images/ambient/bush-berry.png', frameCount: 2, x: 150, y: -470, scale: 0.9, animationSpeed: 0.025 },
    { id: 'bush-21', sprite: '/images/ambient/bush-flowering.png', frameCount: 2, x: 250, y: -505, scale: 0.8, animationSpeed: 0.02 },
    { id: 'bush-22', sprite: '/images/ambient/bush-berry.png', frameCount: 2, x: 350, y: -485, scale: 1.1, animationSpeed: 0.025 },
    { id: 'bush-23', sprite: '/images/ambient/bush-flowering.png', frameCount: 2, x: 450, y: -515, scale: 0.9, animationSpeed: 0.02 },
    { id: 'bush-24', sprite: '/images/ambient/bush-berry.png', frameCount: 2, x: 550, y: -475, scale: 0.8, animationSpeed: 0.025 },
    { id: 'bush-25', sprite: '/images/ambient/bush-flowering.png', frameCount: 2, x: 650, y: -490, scale: 1.0, animationSpeed: 0.02 },
    { id: 'bush-26', sprite: '/images/ambient/bush-berry.png', frameCount: 2, x: 750, y: -525, scale: 0.9, animationSpeed: 0.025 },
    
    // Corner density bushes - scattered
    { id: 'bush-27', sprite: '/images/ambient/bush-flowering.png', frameCount: 2, x: -900, y: -515, scale: 0.8, animationSpeed: 0.02 },
    { id: 'bush-28', sprite: '/images/ambient/bush-berry.png', frameCount: 2, x: -870, y: -465, scale: 0.9, animationSpeed: 0.025 },
    { id: 'bush-29', sprite: '/images/ambient/bush-flowering.png', frameCount: 2, x: 870, y: -475, scale: 0.8, animationSpeed: 0.02 },
    { id: 'bush-30', sprite: '/images/ambient/bush-berry.png', frameCount: 2, x: 900, y: -485, scale: 0.9, animationSpeed: 0.025 },
    
    // Left edge bushes (x=-900 area) - new addition
    { id: 'bush-39', sprite: '/images/ambient/bush-flowering.png', frameCount: 2, x: -880, y: -415, scale: 0.7, animationSpeed: 0.02 },
    { id: 'bush-40', sprite: '/images/ambient/bush-berry.png', frameCount: 2, x: -890, y: -355, scale: 0.8, animationSpeed: 0.025 },
    { id: 'bush-41', sprite: '/images/ambient/bush-flowering.png', frameCount: 2, x: -910, y: -295, scale: 0.7, animationSpeed: 0.02 },
    { id: 'bush-42', sprite: '/images/ambient/bush-berry.png', frameCount: 2, x: -900, y: -245, scale: 0.8, animationSpeed: 0.025 },
    { id: 'bush-43', sprite: '/images/ambient/bush-flowering.png', frameCount: 2, x: -870, y: -195, scale: 0.7, animationSpeed: 0.02 },
    { id: 'bush-44', sprite: '/images/ambient/bush-berry.png', frameCount: 2, x: -880, y: -145, scale: 0.8, animationSpeed: 0.025 },
    { id: 'bush-45', sprite: '/images/ambient/bush-flowering.png', frameCount: 2, x: -920, y: -95, scale: 0.7, animationSpeed: 0.02 },
    { id: 'bush-46', sprite: '/images/ambient/bush-berry.png', frameCount: 2, x: -800, y: -45, scale: 0.8, animationSpeed: 0.025 },
    
    // Right edge bushes (x=900 area) - scattered
    { id: 'bush-31', sprite: '/images/ambient/bush-flowering.png', frameCount: 2, x: 910, y: -420, scale: 0.7, animationSpeed: 0.02 },
    { id: 'bush-32', sprite: '/images/ambient/bush-berry.png', frameCount: 2, x: 880, y: -365, scale: 0.8, animationSpeed: 0.025 },
    { id: 'bush-33', sprite: '/images/ambient/bush-flowering.png', frameCount: 2, x: 880, y: -315, scale: 0.7, animationSpeed: 0.02 },
    { id: 'bush-34', sprite: '/images/ambient/bush-berry.png', frameCount: 2, x: 900, y: -225, scale: 0.8, animationSpeed: 0.025 },
    { id: 'bush-35', sprite: '/images/ambient/bush-flowering.png', frameCount: 2, x: 880, y: -175, scale: 0.7, animationSpeed: 0.02 },
    { id: 'bush-36', sprite: '/images/ambient/bush-berry.png', frameCount: 2, x: 860, y: -125, scale: 0.8, animationSpeed: 0.025 },
    { id: 'bush-37', sprite: '/images/ambient/bush-flowering.png', frameCount: 2, x: 920, y: -75, scale: 0.7, animationSpeed: 0.02 },
    { id: 'bush-38', sprite: '/images/ambient/bush-berry.png', frameCount: 2, x: 880, y: -25, scale: 0.8, animationSpeed: 0.025 },
];

// Forest floor elements - ferns and fallen logs for natural ground detail
const FOREST_FLOOR_SPRITES = [
    // Fern clusters spread across shaded areas throughout the landscape
    { id: 'fern-1', sprite: '/images/ambient/fern-cluster.png', frameCount: 2, x: -630, y: -310, scale: 1.0, animationSpeed: 0.01 },
    { id: 'fern-2', sprite: '/images/ambient/fern-cluster.png', frameCount: 2, x: -330, y: -320, scale: 1.1, animationSpeed: 0.01 },
    { id: 'fern-3', sprite: '/images/ambient/fern-cluster.png', frameCount: 2, x: 370, y: -310, scale: 1.0, animationSpeed: 0.02 },
    { id: 'fern-4', sprite: '/images/ambient/fern-cluster.png', frameCount: 2, x: 630, y: -330, scale: 0.9, animationSpeed: 0.015 },
    { id: 'fern-5', sprite: '/images/ambient/fern-cluster.png', frameCount: 2, x: -750, y: -290, scale: 0.8, animationSpeed: 0.02 },
    { id: 'fern-6', sprite: '/images/ambient/fern-cluster.png', frameCount: 2, x: 830, y: -300, scale: 1.1, animationSpeed: 0.01 },
    
    // Additional fern clusters for foliage areas (small scale)
    { id: 'fern-7', sprite: '/images/ambient/fern-cluster.png', frameCount: 2, x: 830, y: -245, scale: 0.6, animationSpeed: 0.015 },
    { id: 'fern-8', sprite: '/images/ambient/fern-cluster.png', frameCount: 2, x: 870, y: -155, scale: 0.5, animationSpeed: 0.02 },
    { id: 'fern-9', sprite: '/images/ambient/fern-cluster.png', frameCount: 2, x: 940, y: -55, scale: 0.5, animationSpeed: 0.015 },
    { id: 'fern-10', sprite: '/images/ambient/fern-cluster.png', frameCount: 2, x: -840, y: -190, scale: 0.5, animationSpeed: 0.02 },
    { id: 'fern-11', sprite: '/images/ambient/fern-cluster.png', frameCount: 2, x: -820, y: -110, scale: 0.6, animationSpeed: 0.015 },
    
    // Fallen logs - occasional natural decay elements (static, no animation)
    { id: 'log-1', sprite: '/images/ambient/fallen-log.png', x: -870, y: -250, scale: 1.0, rotation: -0.2 },
    { id: 'log-2', sprite: '/images/ambient/fallen-log.png', x: 650, y: -240, scale: 0.9, rotation: -0.2 },
    { id: 'log-3', sprite: '/images/ambient/fallen-log.png', x: 230, y: -430, scale: 0.8, rotation: -0.3 },
    
    // Dense fern line at y=-500 to complement trees and bushes - scattered naturally
    { id: 'fern-12', sprite: '/images/ambient/fern-cluster.png', frameCount: 2, x: -720, y: -475, scale: 0.9, animationSpeed: 0.015 },
    { id: 'fern-13', sprite: '/images/ambient/fern-cluster.png', frameCount: 2, x: -620, y: -520, scale: 0.8, animationSpeed: 0.02 },
    { id: 'fern-14', sprite: '/images/ambient/fern-cluster.png', frameCount: 2, x: -520, y: -465, scale: 1.0, animationSpeed: 0.015 },
    { id: 'fern-15', sprite: '/images/ambient/fern-cluster.png', frameCount: 2, x: -420, y: -515, scale: 0.9, animationSpeed: 0.02 },
    { id: 'fern-16', sprite: '/images/ambient/fern-cluster.png', frameCount: 2, x: -320, y: -485, scale: 0.8, animationSpeed: 0.015 },
    { id: 'fern-17', sprite: '/images/ambient/fern-cluster.png', frameCount: 2, x: -220, y: -525, scale: 1.1, animationSpeed: 0.02 },
    { id: 'fern-18', sprite: '/images/ambient/fern-cluster.png', frameCount: 2, x: -120, y: -470, scale: 0.9, animationSpeed: 0.015 },
    { id: 'fern-19', sprite: '/images/ambient/fern-cluster.png', frameCount: 2, x: -20, y: -505, scale: 0.8, animationSpeed: 0.02 },
    { id: 'fern-20', sprite: '/images/ambient/fern-cluster.png', frameCount: 2, x: 80, y: -480, scale: 1.0, animationSpeed: 0.015 },
    { id: 'fern-21', sprite: '/images/ambient/fern-cluster.png', frameCount: 2, x: 180, y: -520, scale: 0.9, animationSpeed: 0.02 },
    { id: 'fern-22', sprite: '/images/ambient/fern-cluster.png', frameCount: 2, x: 280, y: -460, scale: 0.8, animationSpeed: 0.015 },
    { id: 'fern-23', sprite: '/images/ambient/fern-cluster.png', frameCount: 2, x: 380, y: -510, scale: 1.1, animationSpeed: 0.02 },
    { id: 'fern-24', sprite: '/images/ambient/fern-cluster.png', frameCount: 2, x: 480, y: -485, scale: 0.9, animationSpeed: 0.015 },
    { id: 'fern-25', sprite: '/images/ambient/fern-cluster.png', frameCount: 2, x: 580, y: -495, scale: 0.8, animationSpeed: 0.02 },
    { id: 'fern-26', sprite: '/images/ambient/fern-cluster.png', frameCount: 2, x: 680, y: -475, scale: 1.0, animationSpeed: 0.015 },
    { id: 'fern-27', sprite: '/images/ambient/fern-cluster.png', frameCount: 2, x: 780, y: -530, scale: 0.9, animationSpeed: 0.02 },
    
    // Corner density ferns - scattered
    { id: 'fern-28', sprite: '/images/ambient/fern-cluster.png', frameCount: 2, x: -890, y: -485, scale: 0.8, animationSpeed: 0.015 },
    { id: 'fern-29', sprite: '/images/ambient/fern-cluster.png', frameCount: 2, x: -860, y: -465, scale: 0.9, animationSpeed: 0.02 },
    { id: 'fern-30', sprite: '/images/ambient/fern-cluster.png', frameCount: 2, x: 860, y: -495, scale: 0.8, animationSpeed: 0.015 },
    { id: 'fern-31', sprite: '/images/ambient/fern-cluster.png', frameCount: 2, x: 890, y: -515, scale: 0.9, animationSpeed: 0.02 },
    
    // Left edge ferns (x=-900 area) - new addition
    { id: 'fern-40', sprite: '/images/ambient/fern-cluster.png', frameCount: 2, x: -880, y: -405, scale: 0.7, animationSpeed: 0.015 },
    { id: 'fern-41', sprite: '/images/ambient/fern-cluster.png', frameCount: 2, x: -910, y: -345, scale: 0.8, animationSpeed: 0.02 },
    { id: 'fern-42', sprite: '/images/ambient/fern-cluster.png', frameCount: 2, x: -880, y: -275, scale: 0.7, animationSpeed: 0.015 },
    { id: 'fern-43', sprite: '/images/ambient/fern-cluster.png', frameCount: 2, x: -900, y: -215, scale: 0.8, animationSpeed: 0.02 },
    { id: 'fern-44', sprite: '/images/ambient/fern-cluster.png', frameCount: 2, x: -880, y: -155, scale: 0.7, animationSpeed: 0.015 },
    { id: 'fern-45', sprite: '/images/ambient/fern-cluster.png', frameCount: 2, x: -920, y: -105, scale: 0.8, animationSpeed: 0.02 },
    { id: 'fern-46', sprite: '/images/ambient/fern-cluster.png', frameCount: 2, x: -890, y: -55, scale: 0.7, animationSpeed: 0.015 },
    { id: 'fern-47', sprite: '/images/ambient/fern-cluster.png', frameCount: 2, x: -900, y: -5, scale: 0.8, animationSpeed: 0.02 },
    
    // Right edge ferns (x=900 area) - scattered
    { id: 'fern-32', sprite: '/images/ambient/fern-cluster.png', frameCount: 2, x: 860, y: -410, scale: 0.7, animationSpeed: 0.015 },
    { id: 'fern-33', sprite: '/images/ambient/fern-cluster.png', frameCount: 2, x: 900, y: -350, scale: 0.8, animationSpeed: 0.02 },
    { id: 'fern-34', sprite: '/images/ambient/fern-cluster.png', frameCount: 2, x: 870, y: -275, scale: 0.7, animationSpeed: 0.015 },
    { id: 'fern-35', sprite: '/images/ambient/fern-cluster.png', frameCount: 2, x: 900, y: -215, scale: 0.8, animationSpeed: 0.02 },
    { id: 'fern-36', sprite: '/images/ambient/fern-cluster.png', frameCount: 2, x: 920, y: -155, scale: 0.7, animationSpeed: 0.015 },
    { id: 'fern-37', sprite: '/images/ambient/fern-cluster.png', frameCount: 2, x: 880, y: -105, scale: 0.8, animationSpeed: 0.02 },
    { id: 'fern-38', sprite: '/images/ambient/fern-cluster.png', frameCount: 2, x: 910, y: -55, scale: 0.7, animationSpeed: 0.015 },
    { id: 'fern-39', sprite: '/images/ambient/fern-cluster.png', frameCount: 2, x: 880, y: -5, scale: 0.8, animationSpeed: 0.02 },
    
    // Additional fallen logs in dense areas - scattered naturally
    { id: 'log-4', sprite: '/images/ambient/fallen-log.png', x: -820, y: -485, scale: 0.9, rotation: 0.1 },
    { id: 'log-5', sprite: '/images/ambient/fallen-log.png', x: -280, y: -515, scale: 1.1, rotation: -0.3 },
    { id: 'log-6', sprite: '/images/ambient/fallen-log.png', x: 220, y: -475, scale: 0.8, rotation: 0.2 },
    { id: 'log-7', sprite: '/images/ambient/fallen-log.png', x: 720, y: -505, scale: 1.0, rotation: -0.1 },
    { id: 'log-8', sprite: '/images/ambient/fallen-log.png', x: 900, y: -280, scale: 0.7, rotation: 0.15 },
    { id: 'log-9', sprite: '/images/ambient/fallen-log.png', x: -900, y: -320, scale: 0.7, rotation: -0.2 },
];

// Lily pads system - distributed across pond area, biased toward visible top areas
const LILY_PADS = [
    { id: 'lily-pad-1', sprite: '/images/ambient/lily-pad-small.png', relativeX: -0.4, relativeY: -0.4, scale: 1.0, rotation: 0 },
    { id: 'lily-pad-2', sprite: '/images/ambient/lily-pad-medium.png', relativeX: 0.3, relativeY: -0.5, scale: 1.2, rotation: 0.1 },
    { id: 'lily-pad-3', sprite: '/images/ambient/lily-pad-large.png', relativeX: 0.6, relativeY: -0.2, scale: 0.9, rotation: -0.1 },
    { id: 'lily-pad-4', sprite: '/images/ambient/lily-pad-flower.png', relativeX: -0.1, relativeY: -0.3, scale: 1.1, rotation: 0.15 },
    { id: 'lily-pad-5', sprite: '/images/ambient/lily-pad-small.png', relativeX: 0.5, relativeY: 0.1, scale: 0.8, rotation: -0.12 },
    { id: 'lily-pad-6', sprite: '/images/ambient/lily-pad-medium.png', relativeX: -0.5, relativeY: -0.1, scale: 1.0, rotation: 0.08 },
    { id: 'lily-pad-7', sprite: '/images/ambient/lily-pad-small.png', relativeX: 0.1, relativeY: -0.6, scale: 0.9, rotation: -0.1 },
    { id: 'lily-pad-8', sprite: '/images/ambient/lily-pad-large.png', relativeX: -0.3, relativeY: 0.3, scale: 1.1, rotation: 0.12 },
];

// Bench system - positioned around hospital and pond areas (horizontal only for isometric view)
const BENCHES = [
    { id: 'bench-3', sprite: '/images/ambient/bench-horizontal.png', x: 400, y: 320, scale: 1.0, rotation: 0, type: 'horizontal' },
    // TODO: Removed leftmost benches for better view, can add more horizontal benches when needed
    // { id: 'bench-1', sprite: '/images/ambient/bench-horizontal.png', x: 180, y: 150, scale: 1.2, rotation: 0, type: 'horizontal' },
    // { id: 'bench-6', sprite: '/images/ambient/bench-horizontal.png', x: -100, y: 200, scale: 1.0, rotation: 0, type: 'horizontal' },
    // { id: 'bench-2', sprite: '/images/ambient/bench-vertical.png', x: -220, y: 80, scale: 1.1, rotation: 0, type: 'vertical' },
    // { id: 'bench-4', sprite: '/images/ambient/bench-corner.png', x: -180, y: -50, scale: 1.2, rotation: 0, type: 'corner' },
    // { id: 'bench-5', sprite: '/images/ambient/bench-vertical.png', x: 320, y: 100, scale: 1.1, rotation: -0.1, type: 'vertical' },
];

// Lamp post system - positioned around hospital area for atmospheric lighting
const LAMP_POSTS = [
    { id: 'lamp-1', sprite: '/images/ambient/lamp-post-classic.png', x: 360, y: 334, scale: 1.2, glowIntensity: 0.8, glowColor: 0xFFD700 },
    { id: 'lamp-2', sprite: '/images/ambient/lamp-post-classic.png', x: -560, y: 220, scale: 1.2, glowIntensity: 0.7, glowColor: 0xFFD700 },
    { id: 'lamp-3', sprite: '/images/ambient/lamp-post-classic.png', x: -460, y: 174, scale: 1.2, glowIntensity: 0.9, glowColor: 0xFFD700 },
    { id: 'lamp-5', sprite: '/images/ambient/lamp-post-classic.png', x: -660, y: 266, scale: 1.2, glowIntensity: 0.8, glowColor: 0xFFD700 },
    { id: 'lamp-6', sprite: '/images/ambient/lamp-post-classic.png', x: -90, y: 210, scale: 1.2, glowIntensity: 0.7, glowColor: 0xFFD700 },
];

// Window glow system - positioned with absolute world coordinates (like benches/lamps)
const WINDOW_GLOWS = [
    // Based on your tweaked positions - light blue hospital lighting
    { id: 'window-glow-1', x: 840, y: 145, width: 12, height: 8, glowIntensity: 0.3, glowColor: 0xE0FFFF, lightType: 'office' },
    { id: 'window-glow-2', x: 810, y: 130, width: 12, height: 8, glowIntensity: 0.3, glowColor: 0xE0FFFF, lightType: 'office' },
    
    // More variations based on your tweaked settings - standardized to match first two
    { id: 'window-glow-3', x: 780, y: 115, width: 12, height: 8, glowIntensity: 0.3, glowColor: 0xE0FFFF, lightType: 'office' },
    { id: 'window-glow-4', x: -450, y: -60, width: 8, height: 135, glowIntensity: 0.3, glowColor: 0xE0FFFF, lightType: 'office' },
    { id: 'window-glow-6', x: -350, y: -110, width: 8, height: 12, glowIntensity: 0.3, glowColor: 0xE0FFFF, lightType: 'office' },
    
    // Standardized to match first two window settings
    { id: 'window-glow-8', x: 690, y: 70, width: 12, height: 8, glowIntensity: 0.3, glowColor: 0xE0FFFF, lightType: 'office' },
    { id: 'window-glow-9', x: -320, y: -125, width: 8, height: 12, glowIntensity: 0.3, glowColor: 0xE0FFFF, lightType: 'office' },
    { id: 'window-glow-10', x: 660, y: 55, width: 12, height: 8, glowIntensity: 0.3, glowColor: 0xE0FFFF, lightType: 'office' },
    
    // Additional glows further down and to the left (based on 6 and 9)
    { id: 'window-glow-11', x: -770, y: 100, width: 8, height: 12, glowIntensity: 0.3, glowColor: 0xE0FFFF, lightType: 'office' },
    { id: 'window-glow-12', x: -740, y: 85, width: 8, height: 12, glowIntensity: 0.3, glowColor: 0xE0FFFF, lightType: 'office' },
];

// TODO: Sitting people system - positioned on benches (NEXT ROUND)
const SITTING_PEOPLE: Array<{
    id: string;
    spriteSheet: string;
    frameCount: number;
    benchId: string;
    offsetX: number;
    offsetY: number;
    scale: number;
    animationSpeed: number;
}> = [
    // { id: 'sitting-patient-1', spriteSheet: '/images/ambient/person-sitting-patient.png', frameCount: 2, benchId: 'bench-1', offsetX: -8, offsetY: -4, scale: 1.0, animationSpeed: 0.03 },
    // { id: 'sitting-visitor-1', spriteSheet: '/images/ambient/person-sitting-visitor.png', frameCount: 2, benchId: 'bench-3', offsetX: 8, offsetY: -4, scale: 1.1, animationSpeed: 0.04 },
    // { id: 'sitting-staff-1', spriteSheet: '/images/ambient/person-sitting-staff.png', frameCount: 2, benchId: 'bench-6', offsetX: 0, offsetY: -4, scale: 1.0, animationSpeed: 0.025 },
    // { id: 'sitting-patient-2', spriteSheet: '/images/ambient/person-sitting-patient.png', frameCount: 2, benchId: 'bench-2', offsetX: 0, offsetY: -4, scale: 0.9, animationSpeed: 0.035 },
];

// Fish system - swimming in pond with gameplay integration for fishing minigame
const POND_FISH = [
    // Common fish - frequent spawns, easy to catch
    { id: 'fish-goldfish-1', spriteSheet: '/images/ambient/fish-small-orange.png', frameCount: 3, pathDuration: 25, scale: 1.0, animationSpeed: 0.15, fishType: 'common', rarity: 'common', xpValue: 5, pathType: 'swim' },
    { id: 'fish-minnow-1', spriteSheet: '/images/ambient/fish-small-silver.png', frameCount: 3, pathDuration: 30, scale: 1.0, animationSpeed: 0.2, fishType: 'common', rarity: 'common', xpValue: 3, pathType: 'swim' },
    { id: 'fish-goldfish-2', spriteSheet: '/images/ambient/fish-small-orange.png', frameCount: 3, pathDuration: 22, scale: 1.0, animationSpeed: 0.18, fishType: 'common', rarity: 'common', xpValue: 5, pathType: 'swim' },
    { id: 'fish-minnow-2', spriteSheet: '/images/ambient/fish-small-silver.png', frameCount: 3, pathDuration: 35, scale: 1.0, animationSpeed: 0.25, fishType: 'common', rarity: 'common', xpValue: 3, pathType: 'swim' },
    
    // Uncommon fish - moderate spawns, medium catch difficulty
    { id: 'fish-koi-orange', spriteSheet: '/images/ambient/fish-koi-orange.png', frameCount: 4, pathDuration: 40, scale: 1.0, animationSpeed: 0.12, fishType: 'koi', rarity: 'uncommon', xpValue: 15, pathType: 'slow_swim' },
    { id: 'fish-koi-white', spriteSheet: '/images/ambient/fish-koi-white.png', frameCount: 4, pathDuration: 45, scale: 1.0, animationSpeed: 0.1, fishType: 'koi', rarity: 'uncommon', xpValue: 15, pathType: 'slow_swim' },
    { id: 'fish-bass-1', spriteSheet: '/images/ambient/fish-bass.png', frameCount: 3, pathDuration: 35, scale: 1.0, animationSpeed: 0.14, fishType: 'bass', rarity: 'uncommon', xpValue: 12, pathType: 'swim' },
    
    // Rare fish - infrequent spawns, high catch difficulty
    { id: 'fish-golden-koi', spriteSheet: '/images/ambient/fish-golden-koi.png', frameCount: 4, pathDuration: 60, scale: 1.0, animationSpeed: 0.08, fishType: 'legendary', rarity: 'rare', xpValue: 50, pathType: 'slow_swim' },
];

// Pond polygon boundaries (relative coordinates 0-1 based on pond bounds)
// Approximates the actual pond shape from the hospital backdrop
const POND_POLYGON = [
    { x: -0.1, y: 0.1 },   // Top-left curve
    { x: 0.1, y: -0.08 },  // Top-left (moved up and left)
    { x: 0.5, y: 0.12 },   // Top center (moved down)
    { x: 0.7, y: 0.12 },  // Top-right (moved right)
    { x: 0.95, y: 0.2 },   // Top-right curve
    { x: 1.1, y: 0.35 },   // Right center
    { x: 0.9, y: 0.35 },   // Bottom-right curve
    { x: 0.75, y: 0.35 },  // Bottom-right
    { x: 0.5, y: 0.35 },   // Bottom center
    { x: 0.25, y: 0.35 },  // Bottom-left
    { x: 0.1, y: 0.35 },   // Bottom-left curve
    { x: 0.00, y: 0.35 },   // Left center
];

// Utility function to check if a point is inside the pond polygon
const isPointInPond = (x: number, y: number, pondBounds: any): boolean => {
    // Convert world coordinates to relative coordinates (0-1)
    const relativeX = (x - pondBounds.x) / pondBounds.width + 0.5;
    const relativeY = (y - pondBounds.y) / pondBounds.height + 0.5;
    
    // Point-in-polygon test using ray casting algorithm
    let inside = false;
    for (let i = 0, j = POND_POLYGON.length - 1; i < POND_POLYGON.length; j = i++) {
        const xi = POND_POLYGON[i].x;
        const yi = POND_POLYGON[i].y;
        const xj = POND_POLYGON[j].x;
        const yj = POND_POLYGON[j].y;
        
        if (((yi > relativeY) !== (yj > relativeY)) &&
            (relativeX < (xj - xi) * (relativeY - yi) / (yj - yi) + xi)) {
            inside = !inside;
        }
    }
    return inside;
};

// Generate random point within pond polygon
const getRandomPondPoint = (pondBounds: any): { x: number, y: number } => {
    let attempts = 0;
    const maxAttempts = 50; // Prevent infinite loops
    
    while (attempts < maxAttempts) {
        // Generate random point within pond bounds
        const x = pondBounds.x + (Math.random() - 0.5) * pondBounds.width;
        const y = pondBounds.y + (Math.random() - 0.5) * pondBounds.height;
        
        if (isPointInPond(x, y, pondBounds)) {
            return { x, y };
        }
        attempts++;
    }
    
    // Fallback to pond center if we can't find a valid point
    return { 
        x: pondBounds.x, 
        y: pondBounds.y 
    };
};

// TODO: Fish interaction effects for fishing gameplay (NEXT ROUND)
const FISH_EFFECTS: Array<{
    id: string;
    spriteSheet: string;
    frameCount: number;
    duration: number;
    scale: number;
    animationSpeed: number;
    effectType: 'fishing_active' | 'fish_escape';
}> = [
    // { id: 'fishing-ripple-1', spriteSheet: '/images/ambient/fishing-ripple.png', frameCount: 3, duration: 2.0, scale: 1.0, animationSpeed: 0.4, effectType: 'fishing_active' },
    // { id: 'fish-jump-1', spriteSheet: '/images/ambient/fish-jump.png', frameCount: 4, duration: 1.5, scale: 1.2, animationSpeed: 0.6, effectType: 'fish_escape' },
];

// Grass sprites in world coordinates (positioned in top area)
const GRASS_SPRITES = [
    // Left area grass
    { id: 'grass-1', sprite: '/images/ambient/grass-tuft-small.png', x: -700, y: -400, scale: 1.0, opacity: 0.8 },
    { id: 'grass-2', sprite: '/images/ambient/grass-tuft-medium.png', x: -600, y: -370, scale: 0.9, opacity: 0.9 },
    { id: 'grass-3', sprite: '/images/ambient/grass-patch-wide.png', x: -650, y: -330, scale: 1.1, opacity: 0.7 },
    { id: 'grass-4', sprite: '/images/ambient/grass-flowers.png', x: -550, y: -410, scale: 0.8, opacity: 0.85 },
    { id: 'grass-5', sprite: '/images/ambient/grass-tuft-tall.png', x: -500, y: -380, scale: 1.0, opacity: 0.9 },
    { id: 'grass-6', sprite: '/images/ambient/grass-tuft-small.png', x: -570, y: -310, scale: 0.9, opacity: 0.75 },
    { id: 'grass-7', sprite: '/images/ambient/grass-tuft-medium.png', x: -670, y: -290, scale: 0.85, opacity: 0.8 },
    { id: 'grass-8', sprite: '/images/ambient/grass-patch-wide.png', x: -530, y: -340, scale: 1.05, opacity: 0.65 },
    { id: 'grass-9', sprite: '/images/ambient/grass-flowers.png', x: -610, y: -270, scale: 0.95, opacity: 0.9 },
    { id: 'grass-10', sprite: '/images/ambient/grass-tuft-tall.png', x: -430, y: -320, scale: 0.9, opacity: 0.7 },
    { id: 'grass-11', sprite: '/images/ambient/grass-tuft-small.png', x: -750, y: -370, scale: 1.1, opacity: 0.85 },
    { id: 'grass-12', sprite: '/images/ambient/grass-tuft-medium.png', x: -470, y: -250, scale: 0.8, opacity: 0.75 },
    
    // Right area grass
    { id: 'grass-13', sprite: '/images/ambient/grass-tuft-medium.png', x: 600, y: -390, scale: 1.1, opacity: 0.8 },
    { id: 'grass-14', sprite: '/images/ambient/grass-patch-wide.png', x: 700, y: -360, scale: 0.85, opacity: 0.9 },
    { id: 'grass-15', sprite: '/images/ambient/grass-flowers.png', x: 800, y: -430, scale: 1.0, opacity: 0.7 },
    { id: 'grass-16', sprite: '/images/ambient/grass-tuft-tall.png', x: 650, y: -310, scale: 0.95, opacity: 0.8 },
    { id: 'grass-17', sprite: '/images/ambient/grass-tuft-small.png', x: 730, y: -290, scale: 1.2, opacity: 0.85 },
    { id: 'grass-18', sprite: '/images/ambient/grass-tuft-medium.png', x: 830, y: -330, scale: 0.9, opacity: 0.9 },
    { id: 'grass-19', sprite: '/images/ambient/grass-patch-wide.png', x: 770, y: -270, scale: 0.8, opacity: 0.75 },
    { id: 'grass-20', sprite: '/images/ambient/grass-flowers.png', x: 630, y: -250, scale: 1.05, opacity: 0.8 },
    { id: 'grass-21', sprite: '/images/ambient/grass-tuft-tall.png', x: 850, y: -300, scale: 0.9, opacity: 0.7 },
    { id: 'grass-22', sprite: '/images/ambient/grass-tuft-small.png', x: 670, y: -280, scale: 1.0, opacity: 0.85 },
    { id: 'grass-23', sprite: '/images/ambient/grass-tuft-medium.png', x: 750, y: -230, scale: 0.85, opacity: 0.9 },
    { id: 'grass-24', sprite: '/images/ambient/grass-patch-wide.png', x: 870, y: -370, scale: 1.1, opacity: 0.65 },
    
    // Top center area grass
    { id: 'grass-25', sprite: '/images/ambient/grass-patch-wide.png', x: -150, y: -450, scale: 0.8, opacity: 0.7 },
    { id: 'grass-26', sprite: '/images/ambient/grass-flowers.png', x: 0, y: -470, scale: 1.0, opacity: 0.8 },
    { id: 'grass-27', sprite: '/images/ambient/grass-tuft-tall.png', x: 150, y: -430, scale: 0.9, opacity: 0.85 },
    { id: 'grass-28', sprite: '/images/ambient/grass-tuft-small.png', x: 300, y: -460, scale: 1.1, opacity: 0.75 },
    { id: 'grass-29', sprite: '/images/ambient/grass-tuft-medium.png', x: -100, y: -470, scale: 0.85, opacity: 0.8 },
    { id: 'grass-30', sprite: '/images/ambient/grass-patch-wide.png', x: 50, y: -460, scale: 1.05, opacity: 0.7 },
    { id: 'grass-31', sprite: '/images/ambient/grass-flowers.png', x: 200, y: -450, scale: 0.9, opacity: 0.85 },
    { id: 'grass-32', sprite: '/images/ambient/grass-tuft-tall.png', x: 350, y: -470, scale: 1.0, opacity: 0.75 },
    { id: 'grass-33', sprite: '/images/ambient/grass-tuft-small.png', x: -200, y: -430, scale: 0.95, opacity: 0.9 },
    { id: 'grass-34', sprite: '/images/ambient/grass-tuft-medium.png', x: 100, y: -410, scale: 1.15, opacity: 0.65 },
    { id: 'grass-35', sprite: '/images/ambient/grass-patch-wide.png', x: 250, y: -430, scale: 0.8, opacity: 0.8 },
    { id: 'grass-36', sprite: '/images/ambient/grass-flowers.png', x: 400, y: -440, scale: 1.05, opacity: 0.7 },
    
    // More scattered grass
    { id: 'grass-37', sprite: '/images/ambient/grass-tuft-medium.png', x: -350, y: -390, scale: 0.8, opacity: 0.6 },
    { id: 'grass-38', sprite: '/images/ambient/grass-patch-wide.png', x: 450, y: -380, scale: 1.0, opacity: 0.8 },
    { id: 'grass-39', sprite: '/images/ambient/grass-flowers.png', x: -250, y: -370, scale: 0.9, opacity: 0.7 },
    { id: 'grass-40', sprite: '/images/ambient/grass-tuft-tall.png', x: 350, y: -360, scale: 1.0, opacity: 0.9 },
    { id: 'grass-41', sprite: '/images/ambient/grass-tuft-small.png', x: -50, y: -350, scale: 0.85, opacity: 0.8 },
    { id: 'grass-42', sprite: '/images/ambient/grass-tuft-medium.png', x: 500, y: -330, scale: 1.1, opacity: 0.75 },
    { id: 'grass-43', sprite: '/images/ambient/grass-patch-wide.png', x: -400, y: -320, scale: 0.9, opacity: 0.85 },
    { id: 'grass-44', sprite: '/images/ambient/grass-flowers.png', x: 430, y: -310, scale: 0.95, opacity: 0.9 },
    { id: 'grass-45', sprite: '/images/ambient/grass-tuft-tall.png', x: -300, y: -300, scale: 1.05, opacity: 0.7 },
    { id: 'grass-46', sprite: '/images/ambient/grass-tuft-small.png', x: 50, y: -290, scale: 0.9, opacity: 0.8 },
    { id: 'grass-47', sprite: '/images/ambient/grass-tuft-medium.png', x: 300, y: -280, scale: 1.0, opacity: 0.75 },
    { id: 'grass-48', sprite: '/images/ambient/grass-patch-wide.png', x: 100, y: -270, scale: 0.85, opacity: 0.85 },
    
    // Extra dense areas
    { id: 'grass-49', sprite: '/images/ambient/grass-tuft-small.png', x: -700, y: -250, scale: 0.7, opacity: 0.6 },
    { id: 'grass-50', sprite: '/images/ambient/grass-tuft-medium.png', x: -550, y: -230, scale: 1.2, opacity: 0.8 },
    { id: 'grass-51', sprite: '/images/ambient/grass-patch-wide.png', x: -400, y: -220, scale: 0.9, opacity: 0.7 },
    { id: 'grass-52', sprite: '/images/ambient/grass-flowers.png', x: -250, y: -210, scale: 1.1, opacity: 0.9 },
    { id: 'grass-53', sprite: '/images/ambient/grass-tuft-tall.png', x: -100, y: -200, scale: 0.8, opacity: 0.75 },
    { id: 'grass-54', sprite: '/images/ambient/grass-tuft-small.png', x: 200, y: -190, scale: 1.0, opacity: 0.85 },
    { id: 'grass-55', sprite: '/images/ambient/grass-tuft-medium.png', x: 350, y: -200, scale: 0.9, opacity: 0.7 },
    { id: 'grass-56', sprite: '/images/ambient/grass-patch-wide.png', x: 530, y: -250, scale: 1.15, opacity: 0.8 },
    { id: 'grass-57', sprite: '/images/ambient/grass-flowers.png', x: 700, y: -230, scale: 0.85, opacity: 0.9 },
    { id: 'grass-58', sprite: '/images/ambient/grass-tuft-tall.png', x: 850, y: -220, scale: 1.05, opacity: 0.65 },
    { id: 'grass-59', sprite: '/images/ambient/grass-tuft-small.png', x: -750, y: -210, scale: 0.95, opacity: 0.8 },
    { id: 'grass-60', sprite: '/images/ambient/grass-tuft-medium.png', x: 0, y: -200, scale: 1.1, opacity: 0.75 },
    
    // Final section - edge areas
    { id: 'grass-61', sprite: '/images/ambient/grass-patch-wide.png', x: -650, y: -190, scale: 0.8, opacity: 0.7 },
    { id: 'grass-62', sprite: '/images/ambient/grass-flowers.png', x: -500, y: -180, scale: 1.0, opacity: 0.85 },
    { id: 'grass-63', sprite: '/images/ambient/grass-tuft-tall.png', x: -350, y: -190, scale: 0.9, opacity: 0.8 },
    { id: 'grass-64', sprite: '/images/ambient/grass-tuft-small.png', x: -200, y: -180, scale: 1.05, opacity: 0.9 },
    { id: 'grass-65', sprite: '/images/ambient/grass-tuft-medium.png', x: 50, y: -190, scale: 0.85, opacity: 0.75 },
    { id: 'grass-66', sprite: '/images/ambient/grass-patch-wide.png', x: 250, y: -180, scale: 1.1, opacity: 0.8 },
    { id: 'grass-67', sprite: '/images/ambient/grass-flowers.png', x: 450, y: -190, scale: 0.95, opacity: 0.85 },
    { id: 'grass-68', sprite: '/images/ambient/grass-tuft-tall.png', x: 650, y: -180, scale: 1.0, opacity: 0.7 },
    { id: 'grass-69', sprite: '/images/ambient/grass-tuft-small.png', x: 800, y: -190, scale: 0.9, opacity: 0.9 },
    { id: 'grass-70', sprite: '/images/ambient/grass-tuft-medium.png', x: 870, y: -180, scale: 1.15, opacity: 0.65 },
    { id: 'grass-71', sprite: '/images/ambient/grass-patch-wide.png', x: 700, y: -190, scale: 0.8, opacity: 0.8 },
    { id: 'grass-72', sprite: '/images/ambient/grass-flowers.png', x: 400, y: -180, scale: 1.05, opacity: 0.9 },
    
    // Grass sprinkled in right foliage area (600-900, -300 to 0)
    { id: 'grass-73', sprite: '/images/ambient/grass-tuft-small.png', x: 690, y: -230, scale: 0.6, opacity: 0.8 },
    { id: 'grass-74', sprite: '/images/ambient/grass-flowers.png', x: 740, y: -220, scale: 0.5, opacity: 0.9 },
    { id: 'grass-75', sprite: '/images/ambient/grass-tuft-medium.png', x: 790, y: -240, scale: 0.7, opacity: 0.7 },
    { id: 'grass-76', sprite: '/images/ambient/grass-patch-wide.png', x: 850, y: -230, scale: 0.6, opacity: 0.8 },
    { id: 'grass-77', sprite: '/images/ambient/grass-tuft-tall.png', x: 900, y: -220, scale: 0.5, opacity: 0.9 },
    { id: 'grass-78', sprite: '/images/ambient/grass-tuft-small.png', x: 790, y: -130, scale: 0.6, opacity: 0.8 },
    { id: 'grass-79', sprite: '/images/ambient/grass-flowers.png', x: 840, y: -120, scale: 0.7, opacity: 0.7 },
    { id: 'grass-80', sprite: '/images/ambient/grass-tuft-medium.png', x: 890, y: -140, scale: 0.5, opacity: 0.9 },
    { id: 'grass-81', sprite: '/images/ambient/grass-patch-wide.png', x: 930, y: -130, scale: 0.6, opacity: 0.8 },
    { id: 'grass-82', sprite: '/images/ambient/grass-tuft-small.png', x: 880, y: -30, scale: 0.5, opacity: 0.9 },
    { id: 'grass-83', sprite: '/images/ambient/grass-flowers.png', x: 920, y: -20, scale: 0.6, opacity: 0.8 },
    { id: 'grass-84', sprite: '/images/ambient/grass-tuft-tall.png', x: 890, y: 70, scale: 0.7, opacity: 0.7 },
    { id: 'grass-85', sprite: '/images/ambient/grass-tuft-medium.png', x: 930, y: 80, scale: 0.5, opacity: 0.9 },
    
    // Grass sprinkled in left foliage area (-900 to -800, -300 to -100)
    { id: 'grass-86', sprite: '/images/ambient/grass-tuft-small.png', x: -820, y: -220, scale: 0.6, opacity: 0.8 },
    { id: 'grass-87', sprite: '/images/ambient/grass-flowers.png', x: -790, y: -200, scale: 0.7, opacity: 0.9 },
    { id: 'grass-88', sprite: '/images/ambient/grass-tuft-medium.png', x: -830, y: -180, scale: 0.5, opacity: 0.8 },
    { id: 'grass-89', sprite: '/images/ambient/grass-patch-wide.png', x: -780, y: -160, scale: 0.6, opacity: 0.9 },
    { id: 'grass-90', sprite: '/images/ambient/grass-tuft-tall.png', x: -800, y: -140, scale: 0.7, opacity: 0.7 },
    { id: 'grass-91', sprite: '/images/ambient/grass-tuft-small.png', x: -770, y: -120, scale: 0.5, opacity: 0.9 },
    { id: 'grass-92', sprite: '/images/ambient/grass-flowers.png', x: -810, y: -100, scale: 0.6, opacity: 0.8 },
    { id: 'grass-93', sprite: '/images/ambient/grass-tuft-medium.png', x: -780, y: -80, scale: 0.7, opacity: 0.9 },
    { id: 'grass-94', sprite: '/images/ambient/grass-patch-wide.png', x: -750, y: -60, scale: 0.5, opacity: 0.8 },

    // Dense grass line at y=-500 to complement trees, bushes, and ferns - scattered naturally
    { id: 'grass-95', sprite: '/images/ambient/grass-tuft-small.png', x: -770, y: -485, scale: 0.8, opacity: 0.7 },
    { id: 'grass-96', sprite: '/images/ambient/grass-flowers.png', x: -670, y: -520, scale: 0.6, opacity: 0.9 },
    { id: 'grass-97', sprite: '/images/ambient/grass-tuft-medium.png', x: -570, y: -460, scale: 0.9, opacity: 0.8 },
    { id: 'grass-98', sprite: '/images/ambient/grass-patch-wide.png', x: -470, y: -525, scale: 0.7, opacity: 0.8 },
    { id: 'grass-99', sprite: '/images/ambient/grass-tuft-tall.png', x: -370, y: -475, scale: 0.8, opacity: 0.9 },
    { id: 'grass-100', sprite: '/images/ambient/grass-tuft-small.png', x: -270, y: -505, scale: 0.6, opacity: 0.7 },
    { id: 'grass-101', sprite: '/images/ambient/grass-flowers.png', x: -170, y: -490, scale: 0.9, opacity: 0.8 },
    { id: 'grass-102', sprite: '/images/ambient/grass-tuft-medium.png', x: -70, y: -470, scale: 0.7, opacity: 0.9 },
    { id: 'grass-103', sprite: '/images/ambient/grass-patch-wide.png', x: 30, y: -515, scale: 0.8, opacity: 0.8 },
    { id: 'grass-104', sprite: '/images/ambient/grass-tuft-tall.png', x: 130, y: -480, scale: 0.6, opacity: 0.9 },
    { id: 'grass-105', sprite: '/images/ambient/grass-tuft-small.png', x: 230, y: -495, scale: 0.9, opacity: 0.7 },
    { id: 'grass-106', sprite: '/images/ambient/grass-flowers.png', x: 330, y: -465, scale: 0.7, opacity: 0.8 },
    { id: 'grass-107', sprite: '/images/ambient/grass-tuft-medium.png', x: 430, y: -520, scale: 0.8, opacity: 0.9 },
    { id: 'grass-108', sprite: '/images/ambient/grass-patch-wide.png', x: 530, y: -485, scale: 0.6, opacity: 0.8 },
    { id: 'grass-109', sprite: '/images/ambient/grass-tuft-tall.png', x: 630, y: -510, scale: 0.9, opacity: 0.9 },
    { id: 'grass-110', sprite: '/images/ambient/grass-tuft-small.png', x: 730, y: -475, scale: 0.7, opacity: 0.7 },
    
    // Corner density grass - scattered
    { id: 'grass-111', sprite: '/images/ambient/grass-flowers.png', x: -920, y: -515, scale: 0.8, opacity: 0.8 },
    { id: 'grass-112', sprite: '/images/ambient/grass-tuft-medium.png', x: -880, y: -465, scale: 0.6, opacity: 0.9 },
    { id: 'grass-113', sprite: '/images/ambient/grass-patch-wide.png', x: -850, y: -495, scale: 0.7, opacity: 0.8 },
    { id: 'grass-114', sprite: '/images/ambient/grass-tuft-small.png', x: 850, y: -475, scale: 0.6, opacity: 0.9 },
    { id: 'grass-115', sprite: '/images/ambient/grass-flowers.png', x: 880, y: -505, scale: 0.8, opacity: 0.8 },
    { id: 'grass-116', sprite: '/images/ambient/grass-tuft-medium.png', x: 920, y: -485, scale: 0.7, opacity: 0.9 },
    
    // Left edge grass (x=-900 area) - new addition
    { id: 'grass-127', sprite: '/images/ambient/grass-tuft-small.png', x: -920, y: -455, scale: 0.5, opacity: 0.8 },
    { id: 'grass-128', sprite: '/images/ambient/grass-flowers.png', x: -870, y: -395, scale: 0.6, opacity: 0.9 },
    { id: 'grass-129', sprite: '/images/ambient/grass-tuft-medium.png', x: -880, y: -325, scale: 0.5, opacity: 0.8 },
    { id: 'grass-130', sprite: '/images/ambient/grass-patch-wide.png', x: -910, y: -265, scale: 0.6, opacity: 0.9 },
    { id: 'grass-131', sprite: '/images/ambient/grass-tuft-tall.png', x: -900, y: -205, scale: 0.5, opacity: 0.8 },
    { id: 'grass-132', sprite: '/images/ambient/grass-tuft-small.png', x: -860, y: -165, scale: 0.6, opacity: 0.9 },
    { id: 'grass-133', sprite: '/images/ambient/grass-flowers.png', x: -900, y: -125, scale: 0.5, opacity: 0.8 },
    { id: 'grass-134', sprite: '/images/ambient/grass-tuft-medium.png', x: -880, y: -75, scale: 0.6, opacity: 0.9 },
    { id: 'grass-135', sprite: '/images/ambient/grass-patch-wide.png', x: -900, y: -25, scale: 0.5, opacity: 0.8 },
    { id: 'grass-136', sprite: '/images/ambient/grass-tuft-tall.png', x: -890, y: 25, scale: 0.6, opacity: 0.9 },
];

// The main container for the scene. The background gradient provides a base layer.
const HospitalContainer = styled.div`
  width: 100vw;
  height: 100vh;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  position: relative;
  overflow: hidden;
`;

// A dedicated container for our PixiJS canvas that will fill the parent.
const PixiCanvasContainer = styled.div`
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
`;

const EndDayButton = styled.button`
  position: absolute;
  bottom: 40px;
  left: 50%;
  transform: translateX(-50%);
  padding: 1rem 2rem;
  background-color: #4f46e5; // indigo-600
  color: white;
  border: 2px solid #a5b4fc; // indigo-300
  border-radius: 0.5rem;
  font-family: inherit; // Use the pixel font from parent
  font-size: 1.25rem;
  font-weight: bold;
  cursor: pointer;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
  transition: all 0.2s ease-in-out;
  z-index: 100;

  &:hover {
    background-color: #6366f1; // indigo-500
    transform: translateX(-50%) translateY(-2px);
  }
`;

/**
 * Renders the hospital backdrop using PixiJS.
 * This component sets up a PixiJS application, loads the main hospital asset,
 * and handles responsive resizing. Focuses on self-contained visual effects.
 */
export default function HospitalBackdrop() {
  const pixiContainerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<PIXI.Application | null>(null);
  const { enterNarrative, enterChallenge } = useSceneNavigation();
  const daysPassed = useGameStore(state => state.daysPassed);
  
  // Get tutorial state
  const tutorialStore = useTutorialStore();
  const isTutorialActive = tutorialStore.mode === 'active_sequence';
  const currentTutorialStep = tutorialStore.currentStep;
  const showEndDayButton = tutorialStore.completedSteps.has('night_phase_transition');

        

  // Weather state management
  const [currentWeather, setCurrentWeather] = useState<'clear' | 'rain' | 'storm' | 'snow' | 'fog'>('clear');
  const weatherParticlesRef = useRef<PIXI.AnimatedSprite[]>([]);

  // Pond ripple state management
  const activeRipplesRef = useRef<PIXI.AnimatedSprite[]>([]);
  const pondPositionRef = useRef<{ x: number; y: number; width: number; height: number }>({ x: 0, y: 0, width: 0, height: 0 });
  const rippleSpawnerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Time of day state for visual effects
  const [currentTimeOfDay, setCurrentTimeOfDay] = useState<TimeOfDay>('dawn');
  
  // Initialize systems
  useEffect(() => {
    initializeMentorContentManager();
    initializeTutorialTimeProgression();
    
    // Listen for time progression updates
    const unsubscribeTime = centralEventBus.subscribe(GameEventType.TIME_ADVANCED, (event) => {
      const timeData = event.payload as { 
        timeOfDay: TimeOfDay; 
        hour: number; 
        visualSettings: any; 
        stageProgress: number; 
      };
      
      console.log(`[HospitalBackdrop] Time advanced to ${timeData.timeOfDay} (${timeData.hour}:00)`);
      setCurrentTimeOfDay(timeData.timeOfDay);
    });
    
    return () => {
      unsubscribeTime();
    };
  }, []);

  // Fish system state management
  const activeFishRef = useRef<PIXI.AnimatedSprite[]>([]);
  const fishSpawnerRef = useRef<NodeJS.Timeout | null>(null);

      // Debug grid state management
    const [showDebugGrid, setShowDebugGrid] = useState(false);
    const debugGridContainerRef = useRef<PIXI.Container | null>(null);
    
    // Pond polygon debug state management
    const [showPondPolygon, setShowPondPolygon] = useState(false);
    const pondPolygonContainerRef = useRef<PIXI.Container | null>(null);

  useEffect(() => {
    let isMounted = true;
    if (appRef.current || !pixiContainerRef.current) return;

    const parentElement = pixiContainerRef.current;
    const app = new PIXI.Application();


    
    app.init({
        width: parentElement.clientWidth,
        height: parentElement.clientHeight,
        backgroundAlpha: 0,
        antialias: true,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
    }).then(() => {
        if (!isMounted) return;
        appRef.current = app;
        parentElement.appendChild(app.canvas);

        // === WORLD-CENTERED COORDINATE SYSTEM ===
        // Calculate uniform scale factor to fit world in screen
        const scaleX = app.screen.width / WORLD_WIDTH;
        const scaleY = app.screen.height / WORLD_HEIGHT;
        const worldScale = Math.min(scaleX, scaleY) * 1;
        
        console.log(`[HospitalBackdrop] Scale: ${worldScale.toFixed(2)}`);

        // Define all assets that need to be loaded
        const allAssets = [
            { alias: 'hospital', src: '/images/hospital/hospital-isometric-base.png' },
            { alias: 'reaction-symbols', src: '/images/ui/reaction-symbols.png' },
            { alias: 'pond-base', src: '/images/ambient/pond-base.png' },
            ...AMBIENT_CREATURES.map(c => ({ alias: c.id, src: c.spriteSheet })),
            ...ENVIRONMENT_SPRITES.map(env => ({ alias: env.id, src: env.sprite })),
            ...GRASS_SPRITES.map(grass => ({ alias: grass.id, src: grass.sprite })),
            ...BUSH_SPRITES.map(bush => ({ alias: bush.id, src: bush.sprite })),
            ...FOREST_FLOOR_SPRITES.map(floor => ({ alias: floor.id, src: floor.sprite })),
            ...WEATHER_PARTICLES.map(weather => ({ alias: weather.id, src: weather.spriteSheet })),
            ...POND_RIPPLES.map(ripple => ({ alias: ripple.id, src: ripple.spriteSheet })),
            ...LILY_PADS.map(pad => ({ alias: pad.id, src: pad.sprite })),
            ...BENCHES.map(bench => ({ alias: bench.id, src: bench.sprite })),
            ...LAMP_POSTS.map(lamp => ({ alias: lamp.id, src: lamp.sprite })),
            ...SITTING_PEOPLE.map(person => ({ alias: person.id, src: person.spriteSheet })),
            ...POND_FISH.map(fish => ({ alias: fish.id, src: fish.spriteSheet })),
            ...FISH_EFFECTS.map(effect => ({ alias: effect.id, src: effect.spriteSheet })),
        ];

        // Filter out assets that are already cached to prevent warnings
        const uncachedAssets = allAssets.filter(asset => !PIXI.Assets.cache.has(asset.alias));
        
        // Load textures (either from cache or newly loaded)
        const loadTexturesPromise = uncachedAssets.length > 0 
            ? PIXI.Assets.load(uncachedAssets).then(newTextures => {
                // Combine cached textures with newly loaded ones
                const allTextures: Record<string, PIXI.Texture> = {};
                allAssets.forEach(asset => {
                    allTextures[asset.alias] = PIXI.Assets.cache.get(asset.alias) || newTextures[asset.alias];
                });
                return allTextures;
              })
            : Promise.resolve(
                // All assets are cached, just retrieve them
                allAssets.reduce((textures, asset) => {
                    textures[asset.alias] = PIXI.Assets.cache.get(asset.alias);
                    return textures;
                }, {} as Record<string, PIXI.Texture>)
              );

        loadTexturesPromise.then((textures) => {
            if (!isMounted || !appRef.current) return;

            // --- Set all pixel art textures to use nearest-neighbor scaling ---
            (Object.values(textures) as PIXI.Texture[]).forEach((texture) => {
                if (texture && texture.source) {
                    texture.source.scaleMode = 'nearest';
                }
            });

            // === HOSPITAL (CENTER OF WORLD) ===
            const hospitalTexture = textures.hospital as PIXI.Texture;
            const hospital = new PIXI.Sprite(hospitalTexture);
            // Position hospital at world center (0,0), scale uniformly
            hospital.anchor.set(0.5, 0.5);
            hospital.x = Math.floor(app.screen.width * 0.5);
            hospital.y = Math.floor(app.screen.height * 0.5);
            hospital.scale.set(worldScale * 3); // Scale up 640×360 hospital to match 1920×1080 world coordinates (3x compensation)
            app.stage.addChild(hospital);
            
            // Hospital positioned at world center

            // === POND (WORLD COORDINATES) ===
            const pondTexture = textures['pond-base'] as PIXI.Texture;
            let pondSprite: PIXI.Sprite | null = null;
            if (pondTexture) {
                const pond = new PIXI.Sprite(pondTexture);
                pond.anchor.set(0.5, 0.5);
                // Position pond in world coordinates with pixel snapping
                pond.x = Math.floor((app.screen.width * 0.5) + (300 * worldScale));  // Pixel-perfect positioning
                pond.y = Math.floor((app.screen.height * 0.9) + (250 * worldScale)); // Pixel-perfect positioning
                pond.scale.set(worldScale * 2.85); // Slightly smaller pond
                
                // Store pond position and dimensions for ripple spawning
                const pondScale = worldScale * 2.85;
                pondPositionRef.current = {
                    x: pond.x,
                    y: pond.y,
                    width: pondTexture.width * pondScale * 0.8, // Slightly smaller than actual pond for natural placement
                    height: pondTexture.height * pondScale * 0.8
                };
                
                // Pond positioned with ripple area calculated
                app.stage.addChild(pond);
                pondSprite = pond;
            }

            // === LILY PADS (POSITIONED ON POND SURFACE) ===
            if (pondSprite) {
                LILY_PADS.forEach(padData => {
                    const padTexture = textures[padData.id] as PIXI.Texture;
                    
                    if (!padTexture) {
                        console.warn(`[HospitalBackdrop] Failed to load lily pad texture: ${padData.id}`);
                        return;
                    }
                    
                    const pad = new PIXI.Sprite(padTexture);
                    pad.anchor.set(0.5, 0.5);
                    
                    // Position using predefined relative coordinates, validated against pond polygon
                    const pondBounds = pondPositionRef.current;
                    let targetX = Math.floor(pondBounds.x + (padData.relativeX * pondBounds.width * 0.7));
                    let targetY = Math.floor(pondBounds.y + (padData.relativeY * pondBounds.height * 0.7));
                    
                    // Check if position is within pond polygon, adjust if necessary
                    if (!isPointInPond(targetX, targetY, pondBounds)) {
                        const validPoint = getRandomPondPoint(pondBounds);
                        targetX = validPoint.x;
                        targetY = validPoint.y;
                        console.log(`[LilyPads] Moved ${padData.id} from outside pond to valid position`);
                    }
                    
                    pad.x = targetX;
                    pad.y = targetY;
                    pad.scale.set(padData.scale * worldScale * 2.0); // Keep 2.0 for visibility
                    pad.rotation = padData.rotation;
                    
                    // Add subtle floating animation
                    const baseY = pad.y;
                    const floatTicker = (ticker: PIXI.Ticker) => {
                        const animTime = Date.now();
                        const floatOffset = Math.sin(animTime * 0.001 + pad.x * 0.001) * 2; // Very subtle float
                        pad.y = baseY + floatOffset;
                    };
                    app.ticker.add(floatTicker);
                    
                    app.stage.addChild(pad);
                });
            }

            // === BENCHES (POSITIONED AROUND HOSPITAL AREA) ===
            const benchSprites = new Map<string, PIXI.Sprite>();
            BENCHES.forEach(benchData => {
                const benchTexture = textures[benchData.id] as PIXI.Texture;
                
                if (!benchTexture) {
                    console.warn(`[HospitalBackdrop] Failed to load bench texture: ${benchData.id}`);
                    return;
                }
                
                const bench = new PIXI.Sprite(benchTexture);
                bench.anchor.set(0.5, 0.5);
                
                // Position using world coordinates with pixel snapping
                bench.x = Math.floor((app.screen.width * 0.5) + (benchData.x * worldScale));
                bench.y = Math.floor((app.screen.height * 0.5) + (benchData.y * worldScale));
                bench.scale.set(benchData.scale * worldScale * 2.0);
                bench.rotation = benchData.rotation;
                
                benchSprites.set(benchData.id, bench);
                app.stage.addChild(bench);
            });

            // === LAMP POSTS (WITH WARM ORANGE-YELLOW ATMOSPHERIC LIGHTING EFFECTS) ===
            const lampGlowSprites: PIXI.Container[] = [];
            LAMP_POSTS.forEach(lampData => {
                const lampTexture = textures[lampData.id] as PIXI.Texture;
                
                if (!lampTexture) {
                    console.warn(`[HospitalBackdrop] Failed to load lamp post texture: ${lampData.id}`);
                    return;
                }
                
                const lamp = new PIXI.Sprite(lampTexture);
                lamp.anchor.set(0.5, 1.0); // Bottom center anchor for lamp posts
                
                // Position using world coordinates with pixel snapping
                lamp.x = Math.floor((app.screen.width * 0.5) + (lampData.x * worldScale));
                lamp.y = Math.floor((app.screen.height * 0.5) + (lampData.y * worldScale));
                lamp.scale.set(lampData.scale * worldScale * 2.2);
                
                // Create atmospheric glow effect with multiple layers and blur
                const glowContainer = new PIXI.Container();
                // Position glow to align with pixelated bulb (up and to the right)
                glowContainer.x = lamp.x + (11 * worldScale); // Shift right to align with bulb
                glowContainer.y = lamp.y - (lamp.height * 0.8); // Shift up to align with bulb
                
                // Warm orange-yellow glow color
                const warmGlowColor = 0xFFB347; // Warm orange-yellow (#FFB347)
                
                // Layer 1: Large soft outer glow (blur effect) - reduced intensity
                const outerGlow = new PIXI.Graphics();
                const outerRadius = 100 * worldScale * lampData.glowIntensity; // Reduced from 140
                outerGlow.circle(0, 0, outerRadius);
                outerGlow.fill({ color: warmGlowColor, alpha: 0.08 }); // Reduced from 0.15
                outerGlow.filters = [new PIXI.BlurFilter(20)]; // Reduced from 25
                outerGlow.blendMode = 'screen'; // Additive blending for realistic light
                glowContainer.addChild(outerGlow);
                
                // Layer 2: Medium glow (moderate blur) - reduced intensity
                const mediumGlow = new PIXI.Graphics();
                const mediumRadius = 60 * worldScale * lampData.glowIntensity; // Reduced from 80
                mediumGlow.circle(0, 0, mediumRadius);
                mediumGlow.fill({ color: warmGlowColor, alpha: 0.12 }); // Reduced from 0.25
                mediumGlow.filters = [new PIXI.BlurFilter(10)]; // Reduced from 12
                mediumGlow.blendMode = 'screen';
                glowContainer.addChild(mediumGlow);
                
                // Layer 3: Inner bright core (slight blur) - reduced intensity
                const innerGlow = new PIXI.Graphics();
                const innerRadius = 30 * worldScale * lampData.glowIntensity; // Reduced from 40
                innerGlow.circle(0, 0, innerRadius);
                innerGlow.fill({ color: warmGlowColor, alpha: 0.18 }); // Reduced from 0.4
                innerGlow.filters = [new PIXI.BlurFilter(4)]; // Reduced from 6
                innerGlow.blendMode = 'screen';
                glowContainer.addChild(innerGlow);
                
                // Layer 4: Very bright center (no blur) - reduced intensity
                const centerGlow = new PIXI.Graphics();
                const centerRadius = 12 * worldScale * lampData.glowIntensity; // Reduced from 15
                centerGlow.circle(0, 0, centerRadius);
                centerGlow.fill({ color: warmGlowColor, alpha: 0.25 }); // Reduced from 0.6
                centerGlow.blendMode = 'screen';
                glowContainer.addChild(centerGlow);
                
                glowContainer.alpha = 0; // Start hidden, will be controlled by time lighting
                
                // Store glow reference for time lighting control
                (glowContainer as any).baseIntensity = lampData.glowIntensity;
                (glowContainer as any).baseAlpha = 0.4; // Reduced from 0.7 for lower overall intensity
                
                // Add atmospheric pulsing and flickering animation
                const atmosphericTicker = (ticker: PIXI.Ticker) => {
                    const animTime = Date.now();
                    
                    // Main pulse (breathing effect)
                    const mainPulse = Math.sin(animTime * 0.001 + lamp.x * 0.001) * 0.1;
                    
                    // Subtle flicker (candle-like)
                    const flicker = Math.sin(animTime * 0.01) * 0.05 + Math.sin(animTime * 0.03) * 0.03;
                    
                    // Color temperature shift (warmer/cooler)
                    const colorShift = Math.sin(animTime * 0.0005) * 0.1;
                    
                    // Only animate if glow is active
                    if (glowContainer.alpha > 0) {
                        const baseAlpha = (glowContainer as any).baseAlpha || 0.4;
                        glowContainer.alpha = Math.max(0.1, baseAlpha + mainPulse + flicker);
                        
                        // Subtle scale breathing
                        const scaleOffset = 1.0 + mainPulse * 0.08; // Reduced from 0.1
                        glowContainer.scale.set(scaleOffset);
                        
                        // Very subtle rotation for organic feel
                        glowContainer.rotation += 0.0008; // Reduced from 0.001
                    }
                };
                app.ticker.add(atmosphericTicker);
                
                lampGlowSprites.push(glowContainer);
                app.stage.addChild(lamp);
                app.stage.addChild(glowContainer);
            });

            // === WINDOW GLOWS (INTERIOR LIGHTING EFFECTS) ===
            const windowGlowSprites: PIXI.Container[] = [];
            WINDOW_GLOWS.forEach(windowData => {
                // Position using world coordinates with pixel snapping
                const windowX = Math.floor((app.screen.width * 0.5) + (windowData.x * worldScale));
                const windowY = Math.floor((app.screen.height * 0.5) + (windowData.y * worldScale));

                // Create multi-layered window glow effect (same technique as lamp glow)
                const glowContainer = new PIXI.Container();
                glowContainer.x = windowX;
                glowContainer.y = windowY;
                
                // Room-specific glow color
                const glowColor = windowData.glowColor;
                
                // Helper function to create isometric diamond points (using same logic as room click areas)
                const createIsometricWindow = (width: number, height: number) => {
                    // Use exact same geometric logic as room diamond polygons
                    const isoWidth = width;
                    const isoHeight = height;
                    
                    return [
                        0, 0,                                                                    // Top point
                        isoWidth, isoWidth * 0.5,                                              // Right point
                        isoWidth - isoHeight, isoWidth * 0.5 + isoHeight * 0.5,               // Bottom point
                        -isoHeight, isoHeight * 0.5,                                           // Left point
                    ];
                };

                // Layer 1: Soft outer glow (isometric parallelogram) - BOOSTED FOR TESTING
                const outerGlow = new PIXI.Graphics();
                const outerWidth = windowData.width * worldScale * 6.0 * windowData.glowIntensity;
                const outerHeight = windowData.height * worldScale * 6.0 * windowData.glowIntensity;
                const outerPoints = createIsometricWindow(outerWidth, outerHeight);
                outerGlow.poly(outerPoints);
                outerGlow.fill({ color: glowColor, alpha: 0.25 });
                outerGlow.filters = [new PIXI.BlurFilter(25)];
                outerGlow.blendMode = 'screen';
                glowContainer.addChild(outerGlow);
                
                // Layer 2: Medium glow (isometric parallelogram) - BOOSTED FOR TESTING
                const mediumGlow = new PIXI.Graphics();
                const mediumWidth = windowData.width * worldScale * 4.0 * windowData.glowIntensity;
                const mediumHeight = windowData.height * worldScale * 4.0 * windowData.glowIntensity;
                const mediumPoints = createIsometricWindow(mediumWidth, mediumHeight);
                mediumGlow.poly(mediumPoints);
                mediumGlow.fill({ color: glowColor, alpha: 0.35 });
                mediumGlow.filters = [new PIXI.BlurFilter(15)];
                mediumGlow.blendMode = 'screen';
                glowContainer.addChild(mediumGlow);
                
                // Layer 3: Inner bright core (isometric parallelogram) - BOOSTED FOR TESTING
                const innerGlow = new PIXI.Graphics();
                const innerWidth = windowData.width * worldScale * 2.5 * windowData.glowIntensity;
                const innerHeight = windowData.height * worldScale * 2.5 * windowData.glowIntensity;
                const innerPoints = createIsometricWindow(innerWidth, innerHeight);
                innerGlow.poly(innerPoints);
                innerGlow.fill({ color: glowColor, alpha: 0.5 });
                innerGlow.filters = [new PIXI.BlurFilter(8)];
                innerGlow.blendMode = 'screen';
                glowContainer.addChild(innerGlow);
                
                // Layer 4: Window frame (sharp isometric parallelogram) - BOOSTED FOR TESTING
                const windowFrame = new PIXI.Graphics();
                const frameWidth = windowData.width * worldScale * 1.5;
                const frameHeight = windowData.height * worldScale * 1.5;
                const framePoints = createIsometricWindow(frameWidth, frameHeight);
                windowFrame.poly(framePoints);
                windowFrame.fill({ color: glowColor, alpha: 0.15 }); // Reduced opacity significantly for subtle white parallelogram
                windowFrame.blendMode = 'screen';
                glowContainer.addChild(windowFrame);
                
                glowContainer.alpha = 0; // Start hidden, controlled by time lighting
                
                // Store window metadata for time lighting control
                (glowContainer as any).windowData = windowData;
                (glowContainer as any).baseIntensity = windowData.glowIntensity;
                (glowContainer as any).baseAlpha = 1.0; // BOOSTED from 0.5 to 1.0 for testing
                
                // Add subtle flickering animation for realistic interior lighting
                const windowTicker = (ticker: PIXI.Ticker) => {
                    const animTime = Date.now();
                    
                    // Gentle office lighting variation
                    const baseFlicker = Math.sin(animTime * 0.002 + windowX * 0.001) * 0.05;
                    const microFlicker = Math.sin(animTime * 0.008) * 0.02;
                    
                    // Different animation patterns for different light types
                    let intensityVariation = 0;
                    switch (windowData.lightType) {
                        case 'office':
                            // Steady office lighting with minimal variation
                            intensityVariation = baseFlicker * 0.3;
                            break;
                        case 'social':
                            // Warmer, more variable lighting
                            intensityVariation = baseFlicker + microFlicker;
                            break;
                        case 'medical':
                            // Very steady medical lighting
                            intensityVariation = baseFlicker * 0.1;
                            break;
                        case 'technical':
                            // Slightly pulsing technical lighting
                            intensityVariation = Math.sin(animTime * 0.003) * 0.08;
                            break;
                        case 'laboratory':
                            // Bright, steady lab lighting
                            intensityVariation = baseFlicker * 0.05;
                            break;
                        case 'simulation':
                            // Slightly dynamic simulation room lighting
                            intensityVariation = Math.sin(animTime * 0.004) * 0.06 + microFlicker;
                            break;
                        default:
                            intensityVariation = baseFlicker;
                    }
                    
                    // Only animate if glow is active
                    if (glowContainer.alpha > 0) {
                        const baseAlpha = (glowContainer as any).baseAlpha || 1.0; // BOOSTED default
                        glowContainer.alpha = Math.max(0.1, baseAlpha + intensityVariation);
                    }
                };
                app.ticker.add(windowTicker);
                
                windowGlowSprites.push(glowContainer);
                app.stage.addChild(glowContainer);
            });

            // === SITTING PEOPLE (POSITIONED ON BENCHES) - TODO: NEXT ROUND ===
            // SITTING_PEOPLE.forEach(personData => {
            //     const personTexture = textures[personData.id] as PIXI.Texture;
            //     
            //     if (!personTexture) {
            //         console.warn(`[HospitalBackdrop] Failed to load sitting person texture: ${personData.id}`);
            //         return;
            //     }
            //     
            //     const bench = benchSprites.get(personData.benchId);
            //     if (!bench) {
            //         console.warn(`[HospitalBackdrop] Bench ${personData.benchId} not found for person ${personData.id}`);
            //         return;
            //     }
            //     
            //     // Create animated sprite from spritesheet
            //     const sheetSource = personTexture.source;
            //     const frames = [];
            //     const frameWidth = sheetSource.width / personData.frameCount;
            //     for (let i = 0; i < personData.frameCount; i++) {
            //         frames.push(new PIXI.Texture({
            //             source: sheetSource,
            //             frame: new PIXI.Rectangle(i * frameWidth, 0, frameWidth, sheetSource.height),
            //         }));
            //     }
            //     
            //     const person = new PIXI.AnimatedSprite(frames);
            //     person.anchor.set(0.5, 1.0); // Bottom center anchor for sitting on bench
            //     person.animationSpeed = personData.animationSpeed;
            //     person.scale.set(personData.scale * worldScale * 1.8);
            //     person.play();
            //     
            //     // Position relative to bench
            //     person.x = bench.x + (personData.offsetX * worldScale);
            //     person.y = bench.y + (personData.offsetY * worldScale);
            //     
            //     app.stage.addChild(person);
            //     console.log(`[HospitalBackdrop] Sitting person ${personData.id} positioned on bench ${personData.benchId}`);
            // });
            console.log('[HospitalBackdrop] Sitting people system ready for next round assets');

            // === FISH SYSTEM (SWIMMING IN POND WITH RARITY-BASED SPAWNING) ===
            
            const spawnFish = () => {
                // Guard check: Don't spawn if app is destroyed or pond not initialized
                if (!app || !app.stage || !app.ticker || !pondPositionRef.current.width || !pondPositionRef.current.height) return;
                
                // Rarity-based fish selection
                let selectedFish: any;
                const rarityRoll = Math.random();
                
                if (rarityRoll < 0.6) {
                    // 60% chance for common fish
                    const commonFish = POND_FISH.filter(f => f.rarity === 'common');
                    selectedFish = commonFish[Math.floor(Math.random() * commonFish.length)];
                } else if (rarityRoll < 0.85) {
                    // 25% chance for uncommon fish
                    const uncommonFish = POND_FISH.filter(f => f.rarity === 'uncommon');
                    selectedFish = uncommonFish[Math.floor(Math.random() * uncommonFish.length)];
                } else {
                    // 15% chance for rare fish
                    const rareFish = POND_FISH.filter(f => f.rarity === 'rare');
                    selectedFish = rareFish[Math.floor(Math.random() * rareFish.length)];
                }
                
                if (!selectedFish) return;
                
                const fishTexture = textures[selectedFish.id] as PIXI.Texture;
                if (!fishTexture) {
                    console.warn(`[HospitalBackdrop] Failed to load fish texture: ${selectedFish.id}`);
                    return;
                }
                
                // Create animated fish sprite
                const sheetSource = fishTexture.source;
                const frames = [];
                const frameWidth = sheetSource.width / selectedFish.frameCount;
                for (let i = 0; i < selectedFish.frameCount; i++) {
                    frames.push(new PIXI.Texture({
                        source: sheetSource,
                        frame: new PIXI.Rectangle(i * frameWidth, 0, frameWidth, sheetSource.height),
                    }));
                }
                
                const fish = new PIXI.AnimatedSprite(frames);
                fish.anchor.set(0.5, 0.5);
                fish.animationSpeed = selectedFish.animationSpeed;
                fish.scale.set(selectedFish.scale * worldScale * 3.0); // Increased from 1.0 to 3.0 for better visibility
                fish.alpha = 0.2; // Half opacity for subtle underwater effect
                fish.play();
                
                // Store fish metadata for fishing minigame
                (fish as any).fishData = selectedFish;
                (fish as any).isClickable = true;
                
                // Make fish clickable for fishing interaction
                fish.eventMode = 'static';
                fish.cursor = 'pointer';
                fish.on('click', () => {
                    console.log(`[FishingSystem] Clicked on ${selectedFish.fishType} (${selectedFish.rarity}) - Worth ${selectedFish.xpValue} XP`);
                    // TODO: Trigger fishing minigame here
                    // centralEventBus.dispatch(GameEventType.FISHING_STARTED, { fishData: selectedFish }, 'FishingSystem');
                });
                
                // Swimming path using polygon boundaries for realistic pond positioning
                const pondBounds = pondPositionRef.current;
                const pathRadius = Math.min(pondBounds.width, pondBounds.height) * 0.12; // Smaller areas within pond shape
                
                // Get random point within actual pond polygon
                const centerPoint = getRandomPondPoint(pondBounds);
                const centerX = centerPoint.x;
                const centerY = centerPoint.y;
                const pathAngle = Math.random() * Math.PI * 2;
                
                // Set initial position to valid pond location
                fish.x = centerX;
                fish.y = centerY;
                
                let startTime = Date.now();
                const pathTicker = (ticker: PIXI.Ticker) => {
                    // Guard check: stop if app is destroyed or fish is destroyed
                    if (!app || !app.stage || !app.ticker || !isMounted || fish.destroyed) {
                        if (app && app.ticker) app.ticker.remove(pathTicker);
                        return;
                    }
                    
                    const currentTime = Date.now();
                    const elapsedSinceStart = currentTime - startTime;
                    const progress = (elapsedSinceStart / (selectedFish.pathDuration * 1000)) % 1;
                    
                    // Swimming pattern based on fish type
                    let x: number, y: number;
                    
                    if (selectedFish.pathType === 'slow_swim') {
                        // Koi-style: Large, slow circles
                        x = centerX + Math.cos(pathAngle + progress * Math.PI * 2) * pathRadius;
                        y = centerY + Math.sin(pathAngle + progress * Math.PI * 2) * pathRadius * 0.7;
                    } else {
                        // Regular swim: Figure-8 pattern
                        x = centerX + Math.sin(progress * Math.PI * 4) * pathRadius * 0.8;
                        y = centerY + Math.sin(progress * Math.PI * 2) * pathRadius * 0.5;
                    }
                    
                    // Add subtle depth bobbing
                    y += Math.sin(progress * Math.PI * 6) * 5;
                    
                    // Face movement direction based on velocity
                    const deltaX = x - fish.x;
                    if (deltaX > 1) fish.scale.x = Math.abs(fish.scale.x); // Moving right
                    else if (deltaX < -1) fish.scale.x = -Math.abs(fish.scale.x); // Moving left
                    
                    fish.x = x;
                    fish.y = y;
                };
                
                // Store ticker function on sprite for cleanup
                (fish as any).pathTicker = pathTicker;
                
                // Additional guard check before adding to stage
                if (!app || !app.stage || !app.ticker || !isMounted) return;
                
                try {
                    app.ticker.add(pathTicker);
                    app.stage.addChild(fish);
                    activeFishRef.current.push(fish);
                } catch (e) {
                    console.warn('[HospitalBackdrop] Error adding fish to stage:', e);
                    // Clean up on error
                    if (fish && !fish.destroyed) {
                        fish.destroy();
                    }
                    return;
                }
                
                // Remove fish after lifespan
                setTimeout(() => {
                    // Guard check: Don't clean up if app is destroyed
                    if (fish && !fish.destroyed && app && app.ticker) {
                        app.ticker.remove(pathTicker);
                        fish.destroy();
                        const index = activeFishRef.current.indexOf(fish);
                        if (index > -1) activeFishRef.current.splice(index, 1);
                    }
                }, selectedFish.pathDuration * 1000 * 2); // Fish lives for 2 path cycles
            };
            
            // Start fish spawning system
            const startFishSpawning = () => {
                const spawnNextFish = () => {
                    // Guard check: Don't spawn if app is destroyed
                    if (!app || !app.stage || !app.ticker) return;
                    
                    spawnFish();
                    
                    // Schedule next fish spawn (1-3 seconds for better visibility during testing)
                    const nextSpawnDelay = 1000 + Math.random() * 2000; // Reduced from 3-8 seconds to 1-3 seconds
                    fishSpawnerRef.current = setTimeout(spawnNextFish, nextSpawnDelay);
                };
                
                // Initial spawn after short delay
                fishSpawnerRef.current = setTimeout(spawnNextFish, 500); // Reduced from 2000ms to 500ms
            };
            
            startFishSpawning();
            // Fish spawning system ready

            // === GRASS SPRITES (GROUND LEVEL WITH SUBTLE SWAY) - BACKGROUND LAYER ===
            const grassContainer = new PIXI.Container();
            app.stage.addChild(grassContainer);
            
            GRASS_SPRITES.forEach(grassData => {
                const grassTexture = textures[grassData.id] as PIXI.Texture;
                
                if (!grassTexture) {
                    console.warn(`[HospitalBackdrop] Failed to load grass texture: ${grassData.id}`);
                    return;
                }
                
                // Create and position the grass in world coordinates
                const grassSprite = new PIXI.Sprite(grassTexture);
                grassSprite.anchor.set(0.5, 1); // Bottom center anchor for grass
                grassSprite.alpha = grassData.opacity || 1.0; // Apply opacity for natural variation
                
                // Position using world coordinates with pixel snapping
                grassSprite.x = Math.floor((app.screen.width * 0.5) + (grassData.x * worldScale));  // Pixel-perfect positioning
                grassSprite.y = Math.floor((app.screen.height * 0.35) + (grassData.y * worldScale)); // Pixel-perfect positioning
                grassSprite.scale.set(grassData.scale * 1.3 * worldScale); // Slightly smaller grass for better proportion
                
                // Add subtle swaying animation (lighter than trees)
                const baseX = grassSprite.x;
                const grassSwayTicker = (ticker: PIXI.Ticker) => {
                    const animTime = Date.now();
                    // Much gentler sway for grass - slower, more synchronized
                    const primarySway = Math.sin(animTime * 0.002 + baseX * 0.008) * 0.04;
                    const microSway = Math.sin(animTime * 0.005 + baseX * 0.012) * 0.015;
                    grassSprite.rotation = primarySway + microSway;
                };
                app.ticker.add(grassSwayTicker);
                
                grassContainer.addChild(grassSprite);
            });

            // === FOREST FLOOR SPRITES (FERNS AND LOGS) - GROUND DETAIL LAYER ===
            const forestFloorContainer = new PIXI.Container();
            app.stage.addChild(forestFloorContainer);
            
            // Store forest floor sprites and shadows for proper layering
            const forestFloorShadows: PIXI.Graphics[] = [];
            const forestFloorSprites: (PIXI.Sprite | PIXI.AnimatedSprite)[] = [];
            
            FOREST_FLOOR_SPRITES.forEach(floorData => {
                const floorTexture = textures[floorData.id] as PIXI.Texture;
                
                if (!floorTexture) {
                    console.warn(`[HospitalBackdrop] Failed to load forest floor texture: ${floorData.id}`);
                    return;
                }
                
                // Create sprite (animated for ferns, static for logs)
                let floorSprite: PIXI.Sprite | PIXI.AnimatedSprite;
                let frameWidth = floorTexture.width; // Default for static sprites
                
                if (floorData.frameCount && floorData.frameCount > 1) {
                    // Create animated sprite for ferns
                    const sheetSource = floorTexture.source;
                    const frames = [];
                    frameWidth = sheetSource.width / floorData.frameCount;
                    for (let i = 0; i < floorData.frameCount; i++) {
                        frames.push(new PIXI.Texture({
                            source: sheetSource,
                            frame: new PIXI.Rectangle(i * frameWidth, 0, frameWidth, sheetSource.height),
                        }));
                    }
                    
                    floorSprite = new PIXI.AnimatedSprite(frames);
                    (floorSprite as PIXI.AnimatedSprite).animationSpeed = floorData.animationSpeed || 0.01;
                    (floorSprite as PIXI.AnimatedSprite).play();
                } else {
                    // Create static sprite for logs
                    floorSprite = new PIXI.Sprite(floorTexture);
                }
                
                floorSprite.anchor.set(0.5, 1); // Bottom center anchor
                
                // Position using world coordinates with pixel snapping
                floorSprite.x = Math.floor((app.screen.width * 0.5) + (floorData.x * worldScale));
                floorSprite.y = Math.floor((app.screen.height * 0.5) + (floorData.y * worldScale));
                floorSprite.scale.set(floorData.scale * worldScale * 2.2);
                if (floorData.rotation) floorSprite.rotation = floorData.rotation;
                
                // === CREATE SUBTLE ELLIPTICAL SHADOW UNDER FOREST FLOOR ELEMENTS ===
                // Only add shadows for ferns, not for fallen logs (logs are already on ground)
                let shadow: PIXI.Graphics | null = null;
                if (floorData.frameCount && floorData.frameCount > 1) { // Only for animated ferns
                    shadow = new PIXI.Graphics();
                    
                    // Shadow dimensions based on fern scale (smaller than bushes, reduced by 30%)
                    const shadowWidth = frameWidth * floorSprite.scale.x * 0.28; // 28% of fern width (was 40%, reduced by 30%)
                    const shadowHeight = shadowWidth * 0.2; // Very flat for ground-level ferns
                    
                    // Create soft gradient shadow using single layer for ferns
                    const shadowLayers = 1; // Single layer for subtle ferns
                    for (let i = 0; i < shadowLayers; i++) {
                        const layerAlpha = 0.04; // Very light for ferns
                        const layerScale = 1.0;
                        
                        shadow.ellipse(0, 0, shadowWidth * layerScale, shadowHeight * layerScale);
                        shadow.fill({ color: 0x000000, alpha: layerAlpha });
                    }
                    
                    // Position shadow under fern base
                    shadow.x = floorSprite.x;
                    shadow.y = floorSprite.y + (2 * worldScale); // Minimal offset for ground-level
                    
                    forestFloorShadows.push(shadow);
                }
                
                forestFloorSprites.push(floorSprite);
            });
            
            // Add all forest floor shadows first (bottom layer)
            forestFloorShadows.forEach(shadow => {
                forestFloorContainer.addChild(shadow);
            });
            
            // Then add all forest floor elements on top (top layer)
            forestFloorSprites.forEach(sprite => {
                forestFloorContainer.addChild(sprite);
            });

            // === BUSH SPRITES (FLOWERING AND BERRY BUSHES) - MID LAYER ===
            const bushContainer = new PIXI.Container();
            app.stage.addChild(bushContainer);
            
            // Store bush sprites and shadows for proper layering
            const bushShadows: PIXI.Graphics[] = [];
            const bushSprites: PIXI.AnimatedSprite[] = [];
            
            BUSH_SPRITES.forEach(bushData => {
                const bushTexture = textures[bushData.id] as PIXI.Texture;
                
                if (!bushTexture) {
                    console.warn(`[HospitalBackdrop] Failed to load bush texture: ${bushData.id}`);
                    return;
                }
                
                // Create animated bush sprite
                const sheetSource = bushTexture.source;
                const frames = [];
                const frameWidth = sheetSource.width / bushData.frameCount;
                for (let i = 0; i < bushData.frameCount; i++) {
                    frames.push(new PIXI.Texture({
                        source: sheetSource,
                        frame: new PIXI.Rectangle(i * frameWidth, 0, frameWidth, sheetSource.height),
                    }));
                }
                
                const bush = new PIXI.AnimatedSprite(frames);
                bush.anchor.set(0.5, 1); // Bottom center anchor
                bush.animationSpeed = bushData.animationSpeed;
                bush.scale.set(bushData.scale * worldScale * 2.8); // Scale for visibility
                bush.play();
                
                // Position using world coordinates with pixel snapping
                bush.x = Math.floor((app.screen.width * 0.5) + (bushData.x * worldScale));
                bush.y = Math.floor((app.screen.height * 0.5) + (bushData.y * worldScale));
                
                // === CREATE SUBTLE ELLIPTICAL SHADOW UNDER BUSH ===
                const shadow = new PIXI.Graphics();
                
                // Shadow dimensions based on bush scale (smaller than trees, reduced by 30%)
                const shadowWidth = frameWidth * bush.scale.x * 0.35; // 35% of bush width (was 50%, reduced by 30%)
                const shadowHeight = shadowWidth * 0.25; // Even flatter for bushes
                
                // Create soft gradient shadow using multiple ellipses for blur effect
                const shadowLayers = 2; // Fewer layers for bushes
                for (let i = 0; i < shadowLayers; i++) {
                    const layerAlpha = 0.06 - (i * 0.02); // Lower intensity for bushes
                    const layerScale = 1.0 + (i * 0.15); // Smaller spread
                    
                    shadow.ellipse(0, 0, shadowWidth * layerScale, shadowHeight * layerScale);
                    shadow.fill({ color: 0x000000, alpha: layerAlpha });
                }
                
                // Position shadow under bush base
                shadow.x = bush.x;
                shadow.y = bush.y + (3 * worldScale); // Slightly offset down from bush base
                
                // Add gentle swaying animation
                const baseX = bush.x;
                const bushSwayTicker = (ticker: PIXI.Ticker) => {
                    const animTime = Date.now();
                    // Ultra gentle sway for bushes - peaceful and immersive
                    const primarySway = Math.sin(animTime * 0.0018 + baseX * 0.006) * 0.03;
                    const microSway = Math.sin(animTime * 0.004 + baseX * 0.01) * 0.012;
                    bush.rotation = primarySway + microSway;
                    
                    // Very subtle shadow movement
                    shadow.rotation = (primarySway + microSway) * 0.05; // 5% of bush sway
                };
                app.ticker.add(bushSwayTicker);
                
                // Store for proper layering
                bushShadows.push(shadow);
                bushSprites.push(bush);
            });
            
            // Add all bush shadows first (bottom layer)
            bushShadows.forEach(shadow => {
                bushContainer.addChild(shadow);
            });
            
            // Then add all bushes on top (top layer)
            bushSprites.forEach(bush => {
                bushContainer.addChild(bush);
            });

            // === ENVIRONMENT SPRITES (TREES WITH SWAYING ANIMATION) - FOREGROUND LAYER ===
            const environmentContainer = new PIXI.Container();
            app.stage.addChild(environmentContainer);
            
            // Store tree sprites and shadows for proper layering with y-sorting
            const treeData: Array<{ sprite: PIXI.Sprite; shadow: PIXI.Graphics; y: number }> = [];
            
            ENVIRONMENT_SPRITES.forEach(envData => {
                const envTexture = textures[envData.id] as PIXI.Texture;
                
                if (!envTexture) {
                    console.warn(`[HospitalBackdrop] Failed to load environment texture: ${envData.id}`);
                    return;
                }
                
                // Create and position the tree in world coordinates
                const envSprite = new PIXI.Sprite(envTexture);
                envSprite.anchor.set(0.5, 1); // Bottom center anchor for trees
                
                // Position using world coordinates with pixel snapping
                envSprite.x = Math.floor((app.screen.width * 0.5) + (envData.x * worldScale));  // Pixel-perfect positioning
                envSprite.y = Math.floor((app.screen.height * 0.5) + (envData.y * worldScale)); // Pixel-perfect positioning
                envSprite.scale.set(envData.scale * 3.2 * worldScale); // Slightly smaller trees for better proportion
                
                // === CREATE SUBTLE ELLIPTICAL SHADOW UNDER TREE ===
                const shadow = new PIXI.Graphics();
                
                // Shadow dimensions based on tree scale and type (reduced by 30%)
                const shadowWidth = envTexture.width * envSprite.scale.x * 0.42; // 42% of tree width (was 60%, reduced by 30%)
                const shadowHeight = shadowWidth * 0.3; // Make it elliptical (30% height)
                
                // Create soft gradient shadow using multiple ellipses for blur effect
                const shadowLayers = 3;
                for (let i = 0; i < shadowLayers; i++) {
                    const layerAlpha = 0.08 - (i * 0.02); // Reduced intensity (was 0.15 - 0.04)
                    const layerScale = 1.0 + (i * 0.2); // Reduced spread (was 0.3)
                    
                    shadow.ellipse(0, 0, shadowWidth * layerScale, shadowHeight * layerScale);
                    shadow.fill({ color: 0x000000, alpha: layerAlpha });
                }
                
                // Position shadow under tree base
                shadow.x = envSprite.x;
                shadow.y = envSprite.y + (5 * worldScale); // Slightly offset down from tree base
                
                // Add subtle swaying animation using rotation (reduced intensity!)
                const baseX = envSprite.x;
                const swayTicker = (ticker: PIXI.Ticker) => {
                    const animTime = Date.now();
                    // Gentle, immersive tree sway - slow and peaceful
                    const primarySway = Math.sin(animTime * 0.0015 + baseX * 0.004) * 0.035; // Much slower and smaller
                    const microSway = Math.sin(animTime * 0.0035 + baseX * 0.008) * 0.012; // Reduced micro movement
                    envSprite.rotation = primarySway + microSway;
                    
                    // Very subtle shadow movement (much less than tree sway)
                    shadow.rotation = (primarySway + microSway) * 0.1; // 10% of tree sway
                };
                app.ticker.add(swayTicker);
                
                // Store tree data with y-coordinate for depth sorting
                treeData.push({
                    sprite: envSprite,
                    shadow: shadow,
                    y: envSprite.y
                });
            });
            
            // Sort trees by y-coordinate (lower y = further back, higher y = closer/in front)
            treeData.sort((a, b) => a.y - b.y);
            
            // Add shadows first (in depth order)
            treeData.forEach(tree => {
                environmentContainer.addChild(tree.shadow);
            });
            
            // Then add tree sprites on top (in depth order)
            treeData.forEach(tree => {
                environmentContainer.addChild(tree.sprite);
            });

            // === ROOM CLICK AREAS (ORIGINAL ISOMETRIC DIAMOND SHAPES) ===
            ROOM_AREAS.forEach(room => {
                const roomState = {
                    available: !isTutorialActive || isRoomAvailableInTutorial(room.id, currentTutorialStep),
                    recommended: isTutorialActive && isRecommendedTutorialRoom(room.id, currentTutorialStep),
                };

                // Calculate room position in world coordinates (relative to hospital)
                const hospitalScale = worldScale * 3.0; // Match the hospital's scale
                
                // Account for hospital's center anchor (0.5, 0.5) - need to offset from center to top-left
                const hospitalCenterOffsetX = -(hospitalTexture.width * hospitalScale) / 2 + 10;
                const hospitalCenterOffsetY = -(hospitalTexture.height * hospitalScale) / 2 - 10;
                
                // Convert original room coordinates to world coordinates
                const px = (room.x / 100 * hospitalTexture.width * hospitalScale) + hospitalCenterOffsetX;
                const py = (room.y / 100 * hospitalTexture.height * hospitalScale) + hospitalCenterOffsetY;
                const pIsoWidth = room.isoWidth / 100 * hospitalTexture.width * hospitalScale;
                const pIsoHeight = room.isoHeight / 100 * hospitalTexture.width * hospitalScale;

                // Create original diamond/isometric polygon shape
                const diamond = new PIXI.Polygon([
                    new PIXI.Point(px, py),
                    new PIXI.Point(px + pIsoWidth, py + pIsoWidth * 0.5),
                    new PIXI.Point(px + pIsoWidth - pIsoHeight, py + pIsoWidth * 0.5 + pIsoHeight * 0.5),
                    new PIXI.Point(px - pIsoHeight, py + pIsoHeight * 0.5),
                ]);

                const roomGraphic = new PIXI.Graphics();
                roomGraphic.hitArea = diamond;

                if (roomState.available) {
                    roomGraphic.eventMode = 'static';
                    roomGraphic.cursor = 'pointer';

                    roomGraphic.on('click', () => {
                        // Capture room reference to avoid TypeScript narrowing issues
                        const currentRoom = room;
                        
                        let dialogueId = `${currentRoom.id}-intro`;
                        if(isTutorialActive) {
                            dialogueId = getTutorialDialogueForRoom(currentRoom.id, currentTutorialStep) || dialogueId;
                        }

                        if (currentRoom.activityType === 'narrative') {
                            enterNarrative(currentRoom.mentorId, dialogueId, currentRoom.id);
                        } else if (currentRoom.activityType === 'social-hub') {
                            // Navigate directly to lunch room scene
                            const { setSceneDirectly } = useSceneStore.getState();
                            setSceneDirectly('lunch-room');
                        } else {
                            enterChallenge(`${currentRoom.id}-activity`, currentRoom.mentorId, currentRoom.id);
                        }
                    });
                } else {
                    // Unavailable rooms have no visual indicator (clean interface)
                }
                
                // Add room to hospital container for proper scaling
                hospital.addChild(roomGraphic);


            });

            // === AMBIENT CREATURES (SELF-CONTAINED ANIMATIONS) ===
            AMBIENT_CREATURES.forEach(creatureData => {
                const sheetTexture = textures[creatureData.id] as PIXI.Texture;
                
                if (!sheetTexture) {
                    console.warn(`Failed to load texture for creature: ${creatureData.id}`);
                    return;
                }
                const sheetSource = sheetTexture.source;
                const frames = [];
                const frameWidth = sheetSource.width / creatureData.frameCount;
                for (let i = 0; i < creatureData.frameCount; i++) {
                    frames.push(new PIXI.Texture({
                        source: sheetSource,
                        frame: new PIXI.Rectangle(i * frameWidth, 0, frameWidth, sheetSource.height),
                    }));
                }
                const creature = new PIXI.AnimatedSprite(frames);
                creature.animationSpeed = creatureData.animationSpeed;
                creature.scale.set(creatureData.scale * worldScale * 1.4); // Scale with world, slightly smaller for proportion
                creature.play();
                
                // === CREATE SUBTLE ELLIPTICAL SHADOW UNDER CREATURE ===
                // Only for ground-based creatures (not flying ones)
                let creatureShadow: PIXI.Graphics | null = null;
                if (!creatureData.pathType || creatureData.pathType !== 'arc') { // Include creatures with no pathType (people, animals) and skip only flying creatures
                    creatureShadow = new PIXI.Graphics();
                    
                    // Shadow dimensions based on creature scale (very small, reduced by 30%)
                    const shadowWidth = frameWidth * creature.scale.x * 0.21; // 21% of creature width (was 30%, reduced by 30%)
                    const shadowHeight = shadowWidth * 0.15; // Very flat for creature shadows
                    
                    // Create single layer subtle shadow for creatures
                    const layerAlpha = 0.05; // Slightly more visible for easier debugging
                    
                    creatureShadow.ellipse(0, 0, shadowWidth, shadowHeight);
                    creatureShadow.fill({ color: 0x000000, alpha: layerAlpha });
                    
                    creatureShadow.visible = false; // Start hidden like creature
                    app.stage.addChild(creatureShadow);
                }

                // === CREATURE INTERACTIVITY (FIRE-AND-FORGET PARTICLE EFFECTS) ===
                creature.eventMode = 'static';
                creature.cursor = 'pointer';
                creature.on('pointerover', () => creature.tint = 0xDDDDDD);
                creature.on('pointerout', () => creature.tint = 0xFFFFFF);
                creature.on('click', (event) => {
                    const reactionSheet = textures['reaction-symbols'] as PIXI.Texture;
                    const symbolWidth = 25;  // Correct symbol dimensions
                    const symbolHeight = 25;
                    const symbolIndex = Math.floor(Math.random() * 5);

                    const symbolTexture = new PIXI.Texture({
                        source: reactionSheet.source,
                        frame: new PIXI.Rectangle(symbolIndex * symbolWidth, 0, symbolWidth, symbolHeight),
                    });

                    const symbol = new PIXI.Sprite(symbolTexture);
                    symbol.anchor.set(0.5);
                    symbol.x = creature.x + creature.width / 2;
                    symbol.y = creature.y;
                    symbol.scale.set(1.5);
                    app.stage.addChild(symbol);

                    // Self-contained animation that cleans itself up
                    let elapsed = 0;
                    const duration = 1.0;
                    const floatHeight = 50;

                    const animationTicker = (time: PIXI.Ticker) => {
                        elapsed += time.deltaTime / 60;
                        const progress = Math.min(elapsed / duration, 1.0);
                        
                        symbol.y = (creature.y - (floatHeight * progress));
                        symbol.alpha = 1.0 - progress;

                        if (progress >= 1.0) {
                            app.ticker.remove(animationTicker);
                            symbol.destroy();
                        }
                    };
                    app.ticker.add(animationTicker);
                });
                
                app.stage.addChild(creature);

                // Self-contained path animation using FIXED world coordinates with pixel snapping
                // Calculate fixed path endpoints using world coordinates (same as static elements)
                const pathStartX = Math.floor((app.screen.width * 0.5) + (creatureData.startX * worldScale));
                const pathEndX = Math.floor((app.screen.width * 0.5) + (creatureData.endX * worldScale));
                const pathStartY = Math.floor((app.screen.height * 0.5) + (creatureData.startY * worldScale));  
                const pathEndY = Math.floor((app.screen.height * 0.5) + (creatureData.endY * worldScale));
                
                let startTime = Date.now() + creatureData.delay;
                app.ticker.add((time) => {
                    const currentTime = Date.now();
                    
                    if (currentTime < startTime) {
                        creature.visible = false;
                        if (creatureShadow) creatureShadow.visible = false;
                        return;
                    }
                    
                    creature.visible = true;
                    if (creatureShadow) creatureShadow.visible = true;
                    
                    // Calculate progress along path (0 to 1, repeating)
                    const elapsedSinceStart = currentTime - startTime;
                    const progress = (elapsedSinceStart / (creatureData.pathDuration * 1000)) % 1;
                    
                    // Linear interpolation using FIXED path coordinates
                    let x = pathStartX + (pathEndX - pathStartX) * progress;
                    let y = pathStartY + (pathEndY - pathStartY) * progress;
                    
                    // Add arc effect for flying creatures
                    if (creatureData.pathType === 'arc') {
                        y -= Math.sin(progress * Math.PI) * 50 * worldScale; 
                    }
                    
                    creature.x = x;
                    creature.y = y;
                    
                    // Update shadow position for ground creatures
                    if (creatureShadow && (!creatureData.pathType || creatureData.pathType !== 'arc')) {
                        creatureShadow.x = x;
                        creatureShadow.y = y + (3 * worldScale); // Slightly below creature
                    }
                });
            });

            // === WEATHER PARTICLES (SELF-CONTAINED ANIMATIONS) ===
            WEATHER_PARTICLES.forEach(weatherData => {
                const sheetTexture = textures[weatherData.id] as PIXI.Texture;
                
                if (!sheetTexture) {
                    console.warn(`Failed to load texture for weather: ${weatherData.id}`);
                    return;
                }
                const sheetSource = sheetTexture.source;
                const frames = [];
                const frameWidth = sheetSource.width / weatherData.frameCount;
                for (let i = 0; i < weatherData.frameCount; i++) {
                    frames.push(new PIXI.Texture({
                        source: sheetSource,
                        frame: new PIXI.Rectangle(i * frameWidth, 0, frameWidth, sheetSource.height),
                    }));
                }
                const weather = new PIXI.AnimatedSprite(frames);
                weather.animationSpeed = weatherData.animationSpeed;
                weather.scale.set(weatherData.scale * worldScale * 1.4); // Scale with world, slightly smaller for proportion
                weather.play();

                // Store weather type and initial visibility (hidden by default)
                (weather as any).weatherType = weatherData.weatherType;
                weather.visible = false; // Start hidden - controlled by weather state

                // === WEATHER INTERACTIVITY (FIRE-AND-FORGET PARTICLE EFFECTS) ===
                weather.eventMode = 'static';
                weather.cursor = 'pointer';
                weather.on('pointerover', () => weather.tint = 0xDDDDDD);
                weather.on('pointerout', () => weather.tint = 0xFFFFFF);
                weather.on('click', (event) => {
                    const reactionSheet = textures['reaction-symbols'] as PIXI.Texture;
                    const symbolWidth = 25;  // Correct symbol dimensions
                    const symbolHeight = 25;
                    const symbolIndex = Math.floor(Math.random() * 5);

                    const symbolTexture = new PIXI.Texture({
                        source: reactionSheet.source,
                        frame: new PIXI.Rectangle(symbolIndex * symbolWidth, 0, symbolWidth, symbolHeight),
                    });

                    const symbol = new PIXI.Sprite(symbolTexture);
                    symbol.anchor.set(0.5);
                    symbol.x = weather.x + weather.width / 2;
                    symbol.y = weather.y;
                    symbol.scale.set(1.5);
                    app.stage.addChild(symbol);

                    // Self-contained animation that cleans itself up
                    let elapsed = 0;
                    const duration = 1.0;
                    const floatHeight = 50;

                    const animationTicker = (time: PIXI.Ticker) => {
                        elapsed += time.deltaTime / 60;
                        const progress = Math.min(elapsed / duration, 1.0);
                        
                        symbol.y = (weather.y - (floatHeight * progress));
                        symbol.alpha = 1.0 - progress;

                        if (progress >= 1.0) {
                            app.ticker.remove(animationTicker);
                            symbol.destroy();
                        }
                    };
                    app.ticker.add(animationTicker);
                });
                
                app.stage.addChild(weather);
                weatherParticlesRef.current.push(weather); // Store reference for weather control

                // Self-contained path animation using FIXED world coordinates with pixel snapping
                // Calculate fixed path endpoints using world coordinates (same as static elements)
                const pathStartX = Math.floor((app.screen.width * 0.5) + (weatherData.startX * worldScale));
                const pathEndX = Math.floor((app.screen.width * 0.5) + (weatherData.endX * worldScale));
                const pathStartY = Math.floor((app.screen.height * 0.5) + (weatherData.startY * worldScale));  
                const pathEndY = Math.floor((app.screen.height * 0.5) + (weatherData.endY * worldScale));
                
                let startTime = Date.now() + weatherData.delay;
                const pathTicker = (time: PIXI.Ticker) => {
                    const currentTime = Date.now();
                    
                    // Only animate if weather is visible
                    if (!weather.visible || currentTime < startTime) {
                        return;
                    }
                    
                    // Calculate progress along path (0 to 1, repeating)
                    const elapsedSinceStart = currentTime - startTime;
                    const progress = (elapsedSinceStart / (weatherData.pathDuration * 1000)) % 1;
                    
                    // Linear interpolation using FIXED path coordinates
                    let x = pathStartX + (pathEndX - pathStartX) * progress;
                    let y = pathStartY + (pathEndY - pathStartY) * progress;
                    
                    // Add special movement patterns based on weather type
                    if (weatherData.pathType === 'snow') {
                        // Gentle floating motion for snow
                        x += Math.sin(progress * Math.PI * 4) * 30 * worldScale;
                        y += Math.sin(progress * Math.PI * 6) * 10 * worldScale;
                    } else if (weatherData.pathType === 'mist') {
                        // Gentle wave motion for mist/fog
                        y += Math.sin(progress * Math.PI * 2) * 20 * worldScale;
                    }
                    
                    weather.x = x;
                    weather.y = y;
                };
                app.ticker.add(pathTicker);
            });

            // === WEATHER CONTROL SYSTEM ===
            const updateWeatherVisibility = (weatherType: 'clear' | 'rain' | 'storm' | 'snow' | 'fog') => {
                console.log(`[HospitalBackdrop] Changing weather to: ${weatherType}`);
                
                weatherParticlesRef.current.forEach(weather => {
                    const particleWeatherType = (weather as any).weatherType;
                    
                    if (weatherType === 'clear') {
                        weather.visible = false;
                    } else if (weatherType === 'storm') {
                        // Storm shows both heavy rain AND regular rain for realistic effect
                        weather.visible = (particleWeatherType === 'storm' || particleWeatherType === 'rain');
                    } else if (weatherType === particleWeatherType) {
                        weather.visible = true;
                    } else {
                        weather.visible = false;
                    }
                });

                // === WEATHER-BASED COLOR EFFECTS ===
                // Apply weather atmosphere using color matrix filters (similar to time lighting)
                if (!app.stage) return;
                
                let weatherColorFilter = app.stage.filters?.find(f => f instanceof PIXI.ColorMatrixFilter && (f as any).isWeatherFilter) as PIXI.ColorMatrixFilter;
                
                if (!weatherColorFilter) {
                    weatherColorFilter = new PIXI.ColorMatrixFilter();
                    (weatherColorFilter as any).isWeatherFilter = true; // Mark as weather filter
                    app.stage.filters = app.stage.filters ? [...app.stage.filters, weatherColorFilter] : [weatherColorFilter];
                }
                
                // Apply weather-specific color effects
                if (weatherType === 'clear') {
                    // Clear weather - reset to neutral
                    weatherColorFilter.matrix = [
                        1.0, 0.0, 0.0, 0, 0,
                        0.0, 1.0, 0.0, 0, 0,
                        0.0, 0.0, 1.0, 0, 0,
                        0, 0, 0, 1, 0
                    ];
                    console.log('[HospitalBackdrop] Applied clear weather - neutral lighting');
                } else if (weatherType === 'rain') {
                    // Light rain - slightly darker and cooler
                    weatherColorFilter.matrix = [
                        0.85, 0.0, 0.05, 0, 0,   // Slightly less red, tiny blue shift
                        0.0, 0.9, 0.05, 0, 0,    // Slightly less green, tiny blue shift
                        0.05, 0.05, 1.1, 0, 0,   // Enhanced blue for cooler feel
                        0, 0, 0, 0.92, 0         // Slightly darker overall
                    ];
                    console.log('[HospitalBackdrop] Applied rain weather - cool and darker');
                } else if (weatherType === 'storm') {
                    // Storm - much darker and dramatic
                    weatherColorFilter.matrix = [
                        0.7, 0.0, 0.1, 0, 0,     // Reduced red, more blue shift
                        0.0, 0.75, 0.1, 0, 0,    // Reduced green, more blue shift
                        0.1, 0.1, 1.2, 0, 0,     // Strong blue enhancement
                        0, 0, 0, 0.8, 0          // Much darker overall
                    ];
                    console.log('[HospitalBackdrop] Applied storm weather - dark and dramatic');
                } else if (weatherType === 'snow') {
                    // Snow - brighter and cooler, more blue-white
                    weatherColorFilter.matrix = [
                        1.1, 0.05, 0.1, 0, 0,    // Slightly enhanced red, blue shift
                        0.05, 1.15, 0.1, 0, 0,   // Enhanced green, blue shift
                        0.15, 0.15, 1.3, 0, 0,   // Strong blue/white enhancement
                        0, 0, 0, 1.05, 0         // Slightly brighter overall
                    ];
                    console.log('[HospitalBackdrop] Applied snow weather - bright and cool');
                } else if (weatherType === 'fog') {
                    // Fog - desaturated and slightly darker
                    weatherColorFilter.matrix = [
                        0.8, 0.1, 0.1, 0, 0,     // Desaturated red
                        0.1, 0.8, 0.1, 0, 0,     // Desaturated green  
                        0.1, 0.1, 0.8, 0, 0,     // Desaturated blue
                        0, 0, 0, 0.9, 0          // Slightly darker and muted
                    ];
                    console.log('[HospitalBackdrop] Applied fog weather - desaturated and muted');
                }

                // Restart ripple spawner for new weather conditions
                if (rippleSpawnerRef.current) {
                    clearTimeout(rippleSpawnerRef.current);
                    rippleSpawnerRef.current = null;
                }
                
                // Start new ripple pattern for current weather
                setTimeout(() => {
                    if (app && app.stage) { // Ensure app is still valid
                        const spawnRipples = () => {
                            const weather = weatherType;
                            
                            if (weather === 'clear') {
                                // Ambient ripples + occasional sparkles
                                spawnRipple('ambient');
                                if (Math.random() < 0.3) spawnRipple('sparkle');
                                
                                // Next ripple in 3-8 seconds
                                rippleSpawnerRef.current = setTimeout(spawnRipples, 3000 + Math.random() * 5000);
                                
                            } else if (weather === 'rain') {
                                // More frequent rain ripples + some ambient
                                spawnRipple('rain');
                                if (Math.random() < 0.4) spawnRipple('ambient');
                                
                                // Next ripple in 0.5-2 seconds
                                rippleSpawnerRef.current = setTimeout(spawnRipples, 500 + Math.random() * 1500);
                                
                            } else if (weather === 'storm') {
                                // Frequent storm ripples + rain ripples
                                spawnRipple('storm');
                                if (Math.random() < 0.6) spawnRipple('rain');
                                
                                // Next ripple in 0.2-1 seconds (very frequent)
                                rippleSpawnerRef.current = setTimeout(spawnRipples, 200 + Math.random() * 800);
                                
                            } else if (weather === 'snow') {
                                // Slower ambient ripples (water partially frozen)
                                if (Math.random() < 0.7) spawnRipple('ambient');
                                
                                // Next ripple in 8-15 seconds (slow)
                                rippleSpawnerRef.current = setTimeout(spawnRipples, 8000 + Math.random() * 7000);
                                
                            } else if (weather === 'fog') {
                                // Very subtle ambient ripples
                                if (Math.random() < 0.5) spawnRipple('ambient');
                                
                                // Next ripple in 5-12 seconds
                                rippleSpawnerRef.current = setTimeout(spawnRipples, 5000 + Math.random() * 7000);
                            }
                        };
                        
                        spawnRipples();
                    }
                }, 100); // Small delay to ensure spawnRipple function is available
            };

            // Listen for weather change events
            const weatherEventUnsubscribe = centralEventBus.subscribe(
                GameEventType.WEATHER_CHANGED,
                (event: any) => {
                    if (event.payload && event.payload.weatherType) {
                        setCurrentWeather(event.payload.weatherType);
                        updateWeatherVisibility(event.payload.weatherType);
                    }
                }
            );

            // Add weather controls to dev console (F2)
            const addWeatherControls = () => {
                if (typeof window !== 'undefined') {
                    (window as any).setWeather = (weatherType: 'clear' | 'rain' | 'storm' | 'snow' | 'fog') => {
                        console.log(`[Dev Console] Setting weather to: ${weatherType}`);
                        setCurrentWeather(weatherType);
                        updateWeatherVisibility(weatherType);
                    };
                    
                    // Add pond ripple testing commands
                    (window as any).spawnRipple = (type?: 'ambient' | 'rain' | 'storm' | 'sparkle') => {
                        console.log(`[Dev Console] Spawning ${type || 'ambient'} ripple`);
                        spawnRipple(type);
                    };
                    
                    (window as any).clearRipples = () => {
                        console.log('[Dev Console] Clearing all active ripples');
                        activeRipplesRef.current.forEach(ripple => {
                            if (ripple && !ripple.destroyed) {
                                ripple.destroy();
                            }
                        });
                        activeRipplesRef.current = [];
                    };
                    
                    // Add fish testing commands
                    (window as any).spawnFish = () => {
                        console.log('[Dev Console] Spawning test fish');
                        spawnFish();
                    };
                    
                    (window as any).clearFish = () => {
                        console.log('[Dev Console] Clearing all active fish');
                        activeFishRef.current.forEach(fish => {
                            if (fish && !fish.destroyed) {
                                fish.destroy();
                            }
                        });
                        activeFishRef.current = [];
                    };
                    
                    // Dev console commands ready for debugging
                    
                    // Add 4-stage time progression test commands
                    (window as any).setDawn = () => {
                        console.log('[Dev Console] Setting dawn lighting - warm golden light');
                        applyTimeOfDayEffects('dawn', 6, {
                            lightingIntensity: 0.3,
                            windowGlowIntensity: 0.2,
                            ambientColor: '#FFB366'
                        });
                    };
                    
                    (window as any).setDay = () => {
                        console.log('[Dev Console] Setting day lighting - bright clear light');
                        applyTimeOfDayEffects('day', 10, {
                            lightingIntensity: 1.0,
                            windowGlowIntensity: 0.1,
                            ambientColor: '#87CEEB'
                        });
                    };
                    
                    (window as any).setEvening = () => {
                        console.log('[Dev Console] Setting evening lighting - warm sunset colors');
                        applyTimeOfDayEffects('evening', 16, {
                            lightingIntensity: 0.6,
                            windowGlowIntensity: 0.7,
                            ambientColor: '#FF7F50'
                        });
                    };
                    
                    (window as any).setNight = () => {
                        console.log('[Dev Console] Setting night lighting - deep blue with prominent windows');
                        applyTimeOfDayEffects('night', 20, {
                            lightingIntensity: 0.2,
                            windowGlowIntensity: 1.0,
                            ambientColor: '#191970'
                        });
                    };
                    
                    // Add debug grid commands
                    (window as any).showGrid = () => {
                        console.log('[Dev Console] Showing coordinate grid overlay');
                        setShowDebugGrid(true);
                    };
                    
                    (window as any).hideGrid = () => {
                        console.log('[Dev Console] Hiding coordinate grid overlay');
                        setShowDebugGrid(false);
                    };
                    
                    (window as any).toggleGrid = () => {
                        const newState = !showDebugGrid;
                        console.log(`[Dev Console] Toggling coordinate grid: ${newState ? 'ON' : 'OFF'}`);
                        setShowDebugGrid(newState);
                    };
                    
                    // Add pond polygon debug commands
                    (window as any).showPondPolygon = () => {
                        console.log('[Dev Console] Showing pond polygon debug overlay');
                        setShowPondPolygon(true);
                    };
                    
                    (window as any).hidePondPolygon = () => {
                        console.log('[Dev Console] Hiding pond polygon debug overlay');
                        setShowPondPolygon(false);
                    };
                    
                    (window as any).togglePondPolygon = () => {
                        const newState = !showPondPolygon;
                        console.log(`[Dev Console] Toggling pond polygon: ${newState ? 'ON' : 'OFF'}`);
                        setShowPondPolygon(newState);
                    };
                }
            };
            addWeatherControls();

            // === POND RIPPLE SYSTEM ===
            const spawnRipple = (rippleType?: 'ambient' | 'rain' | 'storm' | 'sparkle') => {
                // Guard check: Don't spawn if app is destroyed or pond not initialized
                if (!app || !app.stage || !app.ticker || !pondPositionRef.current.width || !pondPositionRef.current.height) return;
                
                // Filter ripples by type, default to ambient
                const availableRipples = POND_RIPPLES.filter(r => 
                    rippleType ? r.rippleType === rippleType : r.rippleType === 'ambient'
                );
                
                if (availableRipples.length === 0) return;
                
                const rippleData = availableRipples[Math.floor(Math.random() * availableRipples.length)];
                const rippleTexture = textures[rippleData.id] as PIXI.Texture;
                
                if (!rippleTexture) {
                    console.warn(`[HospitalBackdrop] Failed to load ripple texture: ${rippleData.id}`);
                    return;
                }
                
                // Create animated ripple sprite
                const sheetSource = rippleTexture.source;
                const frames = [];
                const frameWidth = sheetSource.width / rippleData.frameCount;
                for (let i = 0; i < rippleData.frameCount; i++) {
                    frames.push(new PIXI.Texture({
                        source: sheetSource,
                        frame: new PIXI.Rectangle(i * frameWidth, 0, frameWidth, sheetSource.height),
                    }));
                }
                
                const ripple = new PIXI.AnimatedSprite(frames);
                ripple.anchor.set(0.5, 0.5);
                ripple.animationSpeed = rippleData.animationSpeed;
                ripple.loop = false; // Play once then fade
                
                // Random position within actual pond polygon
                const pondBounds = pondPositionRef.current;
                const ripplePoint = getRandomPondPoint(pondBounds);
                ripple.x = ripplePoint.x;
                ripple.y = ripplePoint.y;
                ripple.scale.set(rippleData.scale * worldScale);
                
                // Additional guard check before adding to stage
                if (!app || !app.stage || !app.ticker || !isMounted) return;
                
                try {
                    // Start animation
                    ripple.play();
                    app.stage.addChild(ripple);
                    activeRipplesRef.current.push(ripple);
                } catch (e) {
                    console.warn('[HospitalBackdrop] Error adding ripple to stage:', e);
                    // Clean up on error
                    if (ripple && !ripple.destroyed) {
                        ripple.destroy();
                    }
                    return;
                }
                
                // Ripple spawned (logging removed for cleaner console)
                
                // Self-cleanup after duration
                setTimeout(() => {
                    // Guard check: Don't start fade if app is destroyed
                    if (!app || !app.ticker || ripple.destroyed) return;
                    
                    // Fade out effect
                    let fadeElapsed = 0;
                    const fadeDuration = 0.5;
                    
                    const fadeTicker = (ticker: PIXI.Ticker) => {
                        // Guard check: stop if app is destroyed or ripple is destroyed
                        if (!app || !app.stage || !app.ticker || !isMounted || ripple.destroyed) {
                            if (app && app.ticker) app.ticker.remove(fadeTicker);
                            return;
                        }
                        
                        fadeElapsed += ticker.deltaTime / 60;
                        const fadeProgress = Math.min(fadeElapsed / fadeDuration, 1.0);
                        
                        ripple.alpha = 1.0 - fadeProgress;
                        
                        if (fadeProgress >= 1.0) {
                            // Guard check before removing ticker
                            if (app && app.ticker) {
                                app.ticker.remove(fadeTicker);
                            }
                            if (!ripple.destroyed) {
                                ripple.destroy();
                            }
                            
                            // Remove from active ripples array
                            const index = activeRipplesRef.current.indexOf(ripple);
                            if (index > -1) {
                                activeRipplesRef.current.splice(index, 1);
                            }
                        }
                    };
                    
                    // Store ticker function on sprite for cleanup
                    (ripple as any).fadeTicker = fadeTicker;
                    
                    try {
                        app.ticker.add(fadeTicker);
                    } catch (e) {
                        console.warn('[HospitalBackdrop] Error adding fadeTicker:', e);
                    }
                }, rippleData.duration * 1000);
            };
            
            // Weather-reactive ripple spawning
            const startRippleSpawner = () => {
                const spawnRipples = () => {
                    // Guard check: Don't spawn if app is destroyed
                    if (!app || !app.stage || !app.ticker) return;
                    
                    const weather = currentWeather;
                    
                    if (weather === 'clear') {
                        // Ambient ripples + occasional sparkles
                        spawnRipple('ambient');
                        if (Math.random() < 0.3) spawnRipple('sparkle');
                        
                        // Next ripple in 3-8 seconds
                        rippleSpawnerRef.current = setTimeout(spawnRipples, 3000 + Math.random() * 5000);
                        
                    } else if (weather === 'rain') {
                        // More frequent rain ripples + some ambient
                        spawnRipple('rain');
                        if (Math.random() < 0.4) spawnRipple('ambient');
                        
                        // Next ripple in 0.5-2 seconds
                        rippleSpawnerRef.current = setTimeout(spawnRipples, 500 + Math.random() * 1500);
                        
                    } else if (weather === 'storm') {
                        // Frequent storm ripples + rain ripples
                        spawnRipple('storm');
                        if (Math.random() < 0.6) spawnRipple('rain');
                        
                        // Next ripple in 0.2-1 seconds (very frequent)
                        rippleSpawnerRef.current = setTimeout(spawnRipples, 200 + Math.random() * 800);
                        
                    } else if (weather === 'snow') {
                        // Slower ambient ripples (water partially frozen)
                        if (Math.random() < 0.7) spawnRipple('ambient');
                        
                        // Next ripple in 8-15 seconds (slow)
                        rippleSpawnerRef.current = setTimeout(spawnRipples, 8000 + Math.random() * 7000);
                        
                    } else if (weather === 'fog') {
                        // Very subtle ambient ripples
                        if (Math.random() < 0.5) spawnRipple('ambient');
                        
                        // Next ripple in 5-12 seconds
                        rippleSpawnerRef.current = setTimeout(spawnRipples, 5000 + Math.random() * 7000);
                    }
                };
                
                // Start spawning ripples
                spawnRipples();
            };
            
            // Start the ripple system
            startRippleSpawner();
            
            // Pond ripple system ready

            // --- Time-Based Lighting System (Event-Driven) ---
            // Function to apply lighting based on time of day
            const applyTimeLighting = (hour: number) => {
                if (!app.stage) return;
                
                console.log(`[HospitalBackdrop] Applying time lighting for hour: ${hour}`);
                
                // Control warm orange-yellow atmospheric lamp glow visibility based on time of day
                const shouldShowLampGlow = (hour >= 18 || hour < 6); // Evening and night
                console.log(`[HospitalBackdrop] Time check: hour=${hour}, shouldShowLampGlow=${shouldShowLampGlow}`);
                lampGlowSprites.forEach((glowContainer, index) => {
                    if (shouldShowLampGlow) {
                        const baseAlpha = (glowContainer as any).baseAlpha || 0.4;
                        (glowContainer as any).baseAlpha = baseAlpha; // Ensure it's stored
                        glowContainer.alpha = baseAlpha; // Activate warm orange-yellow atmospheric glow
                        console.log(`[HospitalBackdrop] Warm orange-yellow atmospheric lamp ${index + 1} glow activated: alpha=${glowContainer.alpha}`);
                    } else {
                        glowContainer.alpha = 0; // Hide glow during day
                        console.log(`[HospitalBackdrop] Warm orange-yellow atmospheric lamp ${index + 1} glow hidden`);
                    }
                });

                // Control window glow visibility based on time of day and room activity
                const shouldShowWindowGlow = (hour >= 16 || hour < 8); // Earlier start for interior lights
                console.log(`[HospitalBackdrop] Window glow check: hour=${hour}, shouldShowWindowGlow=${shouldShowWindowGlow}`);
                windowGlowSprites.forEach((glowContainer, index) => {
                    const windowData = (glowContainer as any).windowData;
                    if (!windowData) return;
                    
                    let shouldShow = false;
                    let intensityMultiplier = 1.0;
                    
                    if (shouldShowWindowGlow) {
                        // Different room types have different lighting schedules
                        switch (windowData.lightType) {
                            case 'office':
                                // Office hours: 7 AM - 8 PM, dimmer at night
                                shouldShow = (hour >= 7 && hour <= 20) || (hour >= 20 || hour < 7);
                                intensityMultiplier = (hour >= 20 || hour < 7) ? 0.4 : 1.0;
                                break;
                            case 'social':
                                // Cafeteria: longer hours, dimmer lighting late night
                                shouldShow = (hour >= 6 && hour <= 22) || (hour >= 22 || hour < 6);
                                intensityMultiplier = (hour >= 22 || hour < 6) ? 0.3 : 1.0;
                                break;
                            case 'medical':
                            case 'technical':
                                // Medical/technical rooms: 24/7 operation with varying intensity
                                shouldShow = true;
                                if (hour >= 22 || hour < 6) intensityMultiplier = 0.6; // Night shift
                                else if (hour >= 6 && hour < 8) intensityMultiplier = 0.8; // Early morning
                                else intensityMultiplier = 1.0; // Full operation
                                break;
                            case 'laboratory':
                                // Lab: similar to medical but brighter
                                shouldShow = true;
                                if (hour >= 23 || hour < 5) intensityMultiplier = 0.5; // Night
                                else if (hour >= 5 && hour < 7) intensityMultiplier = 0.7; // Early
                                else intensityMultiplier = 1.0; // Full operation
                                break;
                            case 'simulation':
                                // Simulation suite: scheduled sessions
                                shouldShow = (hour >= 8 && hour <= 18) || (hour >= 19 && hour <= 21);
                                intensityMultiplier = (hour >= 19 && hour <= 21) ? 0.7 : 1.0;
                                break;
                            default:
                                shouldShow = shouldShowWindowGlow;
                                intensityMultiplier = 1.0;
                        }
                    }
                    
                    if (shouldShow) {
                        const baseAlpha = (glowContainer as any).baseAlpha || 1.0; // BOOSTED default
                        const adjustedAlpha = baseAlpha * intensityMultiplier;
                        (glowContainer as any).baseAlpha = adjustedAlpha;
                        glowContainer.alpha = adjustedAlpha;
                        console.log(`[HospitalBackdrop] Window glow ${windowData.id} (${windowData.lightType}) activated: alpha=${glowContainer.alpha}`);
                    } else {
                        glowContainer.alpha = 0;
                        console.log(`[HospitalBackdrop] Window glow ${windowData.id} (${windowData.lightType}) hidden`);
                    }
                });
                
                // Create or update color matrix filter for the entire stage
                let colorFilter = app.stage.filters?.find(f => f instanceof PIXI.ColorMatrixFilter) as PIXI.ColorMatrixFilter;
                
                if (!colorFilter) {
                    colorFilter = new PIXI.ColorMatrixFilter();
                    app.stage.filters = app.stage.filters ? [...app.stage.filters, colorFilter] : [colorFilter];
                }
                
                // Reset filter to neutral
                colorFilter.reset();
                
                // Apply time-based tinting using proper PIXI.js API - very subtle effects
                if (hour >= 6 && hour < 8) {
                    // Dawn - barely perceptible warm light
                    colorFilter.matrix = [
                        1.03, 0.02, 0.0, 0, 0,  // Barely warmer
                        0.02, 1.01, 0.0, 0, 0,  // Minimal green enhancement
                        0.0, 0.0, 0.96, 0, 0,   // Barely reduced blue
                        0, 0, 0, 1, 0            // Alpha channel
                    ];
                    console.log('[HospitalBackdrop] Applied dawn lighting');
                } else if (hour >= 8 && hour < 17) {
                    // Daytime - neutral (reset to normal)
                    colorFilter.matrix = [
                        1.0, 0.0, 0.0, 0, 0,
                        0.0, 1.0, 0.0, 0, 0,
                        0.0, 0.0, 1.0, 0, 0,
                        0, 0, 0, 1, 0
                    ];
                    console.log('[HospitalBackdrop] Applied daytime lighting');
                } else if (hour >= 17 && hour < 19) {
                    // Evening - barely perceptible golden tint
                    colorFilter.matrix = [
                        1.05, 0.05, 0.0, 0, 0,  // Barely warmer
                        0.05, 1.03, 0.0, 0, 0,  // Minimal green enhancement  
                        0.0, 0.0, 0.92, 0, 0,   // Barely reduced blue
                        0, 0, 0, 0.99, 0         // Imperceptibly darker
                    ];
                    console.log('[HospitalBackdrop] Applied evening lighting');
                } else {
                    // Night - barely perceptible cool tint
                    colorFilter.matrix = [
                        0.9, 0.0, 0.03, 0, 0,   // Barely less red, tiny blue shift
                        0.0, 0.92, 0.03, 0, 0,  // Barely less green, tiny blue shift
                        0.03, 0.03, 1.05, 0, 0, // Barely enhanced blue
                        0, 0, 0, 0.94, 0         // Slightly darker
                    ];
                    console.log('[HospitalBackdrop] Applied night lighting');
                }
                
                console.log(`[HospitalBackdrop] Applied ultra-subtle time lighting for hour ${hour}, warm orange-yellow lamp glows: ${shouldShowLampGlow ? 'ON' : 'OFF'}`);
            };
            
            // Enhanced function to apply comprehensive time-based visual effects
            const applyTimeOfDayEffects = (timeOfDay: TimeOfDay, hour: number, visualSettings: any) => {
                if (!app.stage) return;
                
                // Apply time of day effects (logging removed for cleaner console)
                
                // === LAMP GLOW CONTROL (Atmospheric outdoor lighting) ===
                // Use time-specific settings for lamp glows
                const shouldShowLampGlow = visualSettings.windowGlowIntensity > 0.5; // Show when interior lighting is prominent
                
                lampGlowSprites.forEach((glowContainer, index) => {
                    if (shouldShowLampGlow) {
                        const baseAlpha = 0.4 * visualSettings.windowGlowIntensity; // Scale with time settings
                        glowContainer.alpha = baseAlpha;
                    } else {
                        glowContainer.alpha = 0;
                    }
                });
                
                // === WINDOW GLOW CONTROL (Interior room lighting) ===
                // Enhanced window glow control using time-specific intensity
                
                windowGlowSprites.forEach((glowContainer, index) => {
                    const windowData = (glowContainer as any).windowData;
                    if (!windowData) return;
                    
                    // Base intensity from time of day settings
                    let intensityMultiplier = visualSettings.windowGlowIntensity;
                    let shouldShow = intensityMultiplier > 0.1; // Show if there's any intensity
                    
                    // Room-specific adjustments based on mentor activity and time
                    if (shouldShow) {
                        switch (windowData.lightType) {
                            case 'office':
                                // Physics office - brighter when Garcia or Quinn are active
                                if (timeOfDay === 'dawn' || timeOfDay === 'night') {
                                    intensityMultiplier *= 1.2; // Active periods
                                } else {
                                    intensityMultiplier *= 0.8; // Less active
                                }
                                break;
                            case 'social':
                                // Cafeteria - brightest during day (lunch time)
                                if (timeOfDay === 'day') {
                                    intensityMultiplier *= 1.3; // Lunch activity
                                } else {
                                    intensityMultiplier *= 0.7; // Quieter times
                                }
                                break;
                            case 'medical':
                            case 'technical':
                                // LINAC rooms - active during evening (Jesse's time)
                                if (timeOfDay === 'evening') {
                                    intensityMultiplier *= 1.4; // Active treatment
                                } else {
                                    intensityMultiplier *= 0.9; // Standby
                                }
                                break;
                            case 'laboratory':
                                // Dosimetry lab - consistent activity
                                intensityMultiplier *= 1.0; // Steady work
                                break;
                            case 'simulation':
                                // Simulation suite - varies by time
                                if (timeOfDay === 'day' || timeOfDay === 'evening') {
                                    intensityMultiplier *= 1.1; // Training sessions
                                } else {
                                    intensityMultiplier *= 0.6; // Off hours
                                }
                                break;
                        }
                    }
                    
                    // Apply the calculated intensity
                    if (shouldShow && intensityMultiplier > 0.1) {
                        const finalAlpha = Math.min(intensityMultiplier, 1.0);
                        glowContainer.alpha = finalAlpha;
                    } else {
                        glowContainer.alpha = 0;
                    }
                });
                
                // === COLOR MATRIX FILTER (Atmospheric tinting) ===
                let colorFilter = app.stage.filters?.find(f => f instanceof PIXI.ColorMatrixFilter) as PIXI.ColorMatrixFilter;
                
                if (!colorFilter) {
                    colorFilter = new PIXI.ColorMatrixFilter();
                    app.stage.filters = app.stage.filters ? [...app.stage.filters, colorFilter] : [colorFilter];
                }
                
                // Apply time-specific color adjustments using visual settings
                colorFilter.reset();
                colorFilter.brightness(visualSettings.lightingIntensity, true);
                
                switch (timeOfDay) {
                    case 'dawn':
                        // Warm golden dawn light
                        colorFilter.sepia(true);
                        colorFilter.saturate(1.1, true);
                        // Subtle golden tint
                        colorFilter.matrix = [
                            1.0, 0.05, 0, 0, 0.02,
                            0.05, 0.95, 0, 0, 0.01,
                            0, 0, 0.9, 0, 0,
                            0, 0, 0, 1, 0
                        ] as any;
                        break;
                    case 'day':
                        // Bright, clear daylight - minimal filtering
                        colorFilter.contrast(1.05, true);
                        // Very subtle blue sky tint
                        colorFilter.matrix = [
                            0.98, 0, 0.02, 0, 0,
                            0, 0.98, 0.02, 0, 0,
                            0.02, 0.02, 1.0, 0, 0,
                            0, 0, 0, 1, 0
                        ] as any;
                        break;
                    case 'evening':
                        // Warm orange sunset
                        colorFilter.sepia(true);
                        colorFilter.saturate(1.15, true);
                        // Orange sunset tint
                        colorFilter.matrix = [
                            1.05, 0.08, 0, 0, 0.03,
                            0.03, 0.92, 0, 0, 0.01,
                            0, 0, 0.85, 0, 0,
                            0, 0, 0, 1, 0
                        ] as any;
                        break;
                    case 'night':
                        // Deep blue night with reduced brightness
                        colorFilter.saturate(0.85, true);
                        // Blue night tint
                        colorFilter.matrix = [
                            0.85, 0, 0.08, 0, 0,
                            0, 0.85, 0.08, 0, 0,
                            0.05, 0.05, 1.1, 0, 0.02,
                            0, 0, 0, 1, 0
                        ] as any;
                        break;
                }
                
                // Visual effects applied (logging removed for cleaner console)
            };
            
            // Listen for time changes (Event-driven - no continuous polling!)
            const timeEventUnsubscribe = centralEventBus.subscribe(
                GameEventType.TIME_ADVANCED,
                (event: any) => {
                    const payload = event.payload;
                    if (payload && payload.timeOfDay && payload.hour !== undefined && payload.visualSettings) {
                        applyTimeOfDayEffects(payload.timeOfDay, payload.hour, payload.visualSettings);
                    } else if (payload && typeof payload.hour === 'number') {
                        // Fallback for old-style time events
                        applyTimeLighting(payload.hour);
                    }
                }
            );
            
            // Apply initial time-based effects
            // Start with dawn setting - our 4-stage tutorial begins at dawn
            const initialTimeOfDay: TimeOfDay = 'dawn';
            const initialVisualSettings = {
                ambientColor: '#FFB366',
                lightingIntensity: 0.3,
                windowGlowIntensity: 0.2,
                shadowOpacity: 0.7,
                particleColor: '#FFD700'
            };
            applyTimeOfDayEffects(initialTimeOfDay, 6, initialVisualSettings);

                    // === POND POLYGON DEBUG SYSTEM ===
        const createPondPolygon = () => {
            if (pondPolygonContainerRef.current) {
                app.stage.removeChild(pondPolygonContainerRef.current);
                pondPolygonContainerRef.current.destroy();
                pondPolygonContainerRef.current = null;
            }
            
            const polygonContainer = new PIXI.Container();
            polygonContainer.name = 'PondPolygon';
            
            // Create polygon outline
            const graphics = new PIXI.Graphics();
            const pondBounds = pondPositionRef.current;
            
            // Convert polygon points to world coordinates
            const worldPoints: number[] = [];
            POND_POLYGON.forEach(point => {
                const worldX = pondBounds.x + (point.x - 0.5) * pondBounds.width;
                const worldY = pondBounds.y + (point.y - 0.5) * pondBounds.height;
                worldPoints.push(worldX, worldY);
            });
            
            // Draw polygon outline
            graphics.lineStyle(3, 0x00ff00, 0.8); // Bright green, semi-transparent
            graphics.drawPolygon(worldPoints);
            
            // Add polygon points as markers
            POND_POLYGON.forEach((point, index) => {
                const worldX = pondBounds.x + (point.x - 0.5) * pondBounds.width;
                const worldY = pondBounds.y + (point.y - 0.5) * pondBounds.height;
                
                // Draw point marker
                graphics.beginFill(0xff0000, 0.8); // Red markers
                graphics.drawCircle(worldX, worldY, 6);
                graphics.endFill();
                
                // Add point label
                const text = new PIXI.Text(`${index}`, {
                    fontFamily: 'Arial',
                    fontSize: 12,
                    fill: 0xffffff,
                    stroke: 0x000000,
                    strokeThickness: 2
                } as any);
                text.anchor.set(0.5);
                text.x = worldX;
                text.y = worldY - 15;
                polygonContainer.addChild(text);
            });
            
            polygonContainer.addChild(graphics);
            polygonContainer.visible = showPondPolygon;
            app.stage.addChild(polygonContainer);
            pondPolygonContainerRef.current = polygonContainer;
            
            console.log('[HospitalBackdrop] Pond polygon debug overlay created');
        };

        // === DEBUG GRID SYSTEM ===
        const createDebugGrid = () => {
                if (debugGridContainerRef.current) {
                    app.stage.removeChild(debugGridContainerRef.current);
                    debugGridContainerRef.current.destroy();
                }

                const gridContainer = new PIXI.Container();
                gridContainer.name = 'DebugGrid';
                
                // Grid parameters using world coordinates (2x resolution)
                const majorGridSize = 100; // Major grid lines every 100 world units
                const minorGridSize = 50; // Minor grid lines every 50 world units
                const worldBounds = {
                    left: -1200,
                    right: 1200,
                    top: -600,
                    bottom: 400
                };

                // Create grid graphics
                const gridGraphics = new PIXI.Graphics();
                
                // Draw minor grid lines (lighter)
                gridGraphics.setStrokeStyle({ color: 0x888888, alpha: 0.3, width: 1 * worldScale });
                for (let x = worldBounds.left; x <= worldBounds.right; x += minorGridSize) {
                    const screenX = (app.screen.width * 0.5) + (x * worldScale);
                    gridGraphics.moveTo(screenX, 0);
                    gridGraphics.lineTo(screenX, app.screen.height);
                }
                for (let y = worldBounds.top; y <= worldBounds.bottom; y += minorGridSize) {
                    const screenY = (app.screen.height * 0.5) + (y * worldScale);
                    gridGraphics.moveTo(0, screenY);
                    gridGraphics.lineTo(app.screen.width, screenY);
                }
                gridGraphics.stroke();

                // Draw major grid lines (darker)
                gridGraphics.setStrokeStyle({ color: 0x444444, alpha: 0.6, width: 2 * worldScale });
                for (let x = worldBounds.left; x <= worldBounds.right; x += majorGridSize) {
                    const screenX = (app.screen.width * 0.5) + (x * worldScale);
                    gridGraphics.moveTo(screenX, 0);
                    gridGraphics.lineTo(screenX, app.screen.height);
                }
                for (let y = worldBounds.top; y <= worldBounds.bottom; y += majorGridSize) {
                    const screenY = (app.screen.height * 0.5) + (y * worldScale);
                    gridGraphics.moveTo(0, screenY);
                    gridGraphics.lineTo(app.screen.width, screenY);
                }
                gridGraphics.stroke();

                // Draw world center axes (bright)
                gridGraphics.setStrokeStyle({ color: 0xFF0000, alpha: 0.8, width: 3 * worldScale });
                // X-axis (horizontal through world center)
                const centerY = app.screen.height * 0.5;
                gridGraphics.moveTo(0, centerY);
                gridGraphics.lineTo(app.screen.width, centerY);
                // Y-axis (vertical through world center)
                const centerX = app.screen.width * 0.5;
                gridGraphics.moveTo(centerX, 0);
                gridGraphics.lineTo(centerX, app.screen.height);
                gridGraphics.stroke();

                gridContainer.addChild(gridGraphics);

                // Add coordinate labels
                for (let x = worldBounds.left; x <= worldBounds.right; x += majorGridSize) {
                    for (let y = worldBounds.top; y <= worldBounds.bottom; y += majorGridSize) {
                        const screenX = (app.screen.width * 0.5) + (x * worldScale);
                        const screenY = (app.screen.height * 0.5) + (y * worldScale);
                        
                        // Only show labels for major intersections and skip center
                        if ((x % majorGridSize === 0 && y % majorGridSize === 0) && !(x === 0 && y === 0)) {
                            const label = new PIXI.Text(`${x},${y}`, {
                                fontFamily: 'monospace',
                                fontSize: Math.max(8, 10 * worldScale),
                                fill: 0xFFFFFF
                            });
                            label.anchor.set(0.5);
                            label.x = screenX;
                            label.y = screenY;
                            gridContainer.addChild(label);
                        }
                    }
                }

                // Add center origin label
                const originLabel = new PIXI.Text('(0,0)\nWorld Center', {
                    fontFamily: 'monospace',
                    fontSize: Math.max(10, 12 * worldScale),
                    fill: 0xFF0000,
                    align: 'center'
                });
                originLabel.anchor.set(0.5);
                originLabel.x = Math.floor(app.screen.width * 0.5);
                originLabel.y = Math.floor(app.screen.height * 0.5);
                gridContainer.addChild(originLabel);

                // Set grid visibility and add to stage
                gridContainer.visible = showDebugGrid;
                app.stage.addChild(gridContainer);
                debugGridContainerRef.current = gridContainer;
                
                console.log('[HospitalBackdrop] Debug grid created with world coordinate system');
            };

                    // Create initial debug grid
        createDebugGrid();
        
        // Create initial pond polygon debug overlay
        createPondPolygon();

            // Update grid visibility when state changes
            const updateGridVisibility = () => {
                if (debugGridContainerRef.current) {
                    debugGridContainerRef.current.visible = showDebugGrid;
                }
            };
            updateGridVisibility();
            
            // Clean up time event listener when component unmounts
            return () => {
                timeEventUnsubscribe();
                weatherEventUnsubscribe();
                
                // Clean up weather particles and filters
                weatherParticlesRef.current = [];
                
                // Remove weather color filter if it exists
                if (app.stage && app.stage.filters) {
                    app.stage.filters = app.stage.filters.filter(f => 
                        !(f instanceof PIXI.ColorMatrixFilter && (f as any).isWeatherFilter)
                    );
                }

                // Clean up pond ripple system
                if (rippleSpawnerRef.current) {
                    clearTimeout(rippleSpawnerRef.current);
                    rippleSpawnerRef.current = null;
                }
                
                // Clean up active ripples
                activeRipplesRef.current.forEach(ripple => {
                    if (ripple && !ripple.destroyed) {
                        ripple.destroy();
                    }
                });
                activeRipplesRef.current = [];
                
                // Clean up fish spawning system
                if (fishSpawnerRef.current) {
                    clearTimeout(fishSpawnerRef.current);
                    fishSpawnerRef.current = null;
                }
                
                // Clean up active fish
                activeFishRef.current.forEach(fish => {
                    if (fish && !fish.destroyed) {
                        fish.destroy();
                    }
                });
                activeFishRef.current = [];
                
                            // Clean up debug grid
            if (debugGridContainerRef.current) {
                debugGridContainerRef.current.destroy();
                debugGridContainerRef.current = null;
            }
            
            // Clean up pond polygon debug overlay
            if (pondPolygonContainerRef.current) {
                pondPolygonContainerRef.current.destroy();
                pondPolygonContainerRef.current = null;
            }
                
                console.log('[HospitalBackdrop] Pond ripple, fish systems, debug grid, and pond polygon cleaned up');
            };

        }).catch(console.error);

        // Handle responsive resizing with world coordinate system
        const handleResize = () => {
            if (appRef.current) {
                const container = pixiContainerRef.current;
                if (container) {
                    const oldWidth = appRef.current.screen.width;
                    const oldHeight = appRef.current.screen.height;
                    
                    // Resize the renderer
                    appRef.current.renderer.resize(container.clientWidth, container.clientHeight);
                    
                    const newWidth = appRef.current.screen.width;
                    const newHeight = appRef.current.screen.height;
                    
                    console.log(`[HospitalBackdrop] Resize: ${oldWidth}x${oldHeight} → ${newWidth}x${newHeight}`);
                    
                    // Recalculate world scale and reposition all elements
                    const newScaleX = newWidth / WORLD_WIDTH;
                    const newScaleY = newHeight / WORLD_HEIGHT;
                    const newWorldScale = Math.min(newScaleX, newScaleY);
                    
                    console.log(`[HospitalBackdrop] New world scale: ${newWorldScale}`);
                    
                    // Update all elements to use new world scale
                    // The world coordinate system automatically handles this - all elements
                    // are positioned relative to screen center and scaled uniformly
                    console.log(`[HospitalBackdrop] World coordinate system handles resize automatically!`);
                }
            }
        };

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }).catch(console.error);

    return () => {
        isMounted = false;
        
        // Clear spawner timers immediately to prevent new spawns
        if (fishSpawnerRef.current) {
            clearTimeout(fishSpawnerRef.current);
            fishSpawnerRef.current = null;
        }
        if (rippleSpawnerRef.current) {
            clearTimeout(rippleSpawnerRef.current);
            rippleSpawnerRef.current = null;
        }
        
        // Immediate cleanup of all active sprites before destroying app
        if (appRef.current && appRef.current.ticker) {
            // Stop ticker immediately to prevent further rendering
            appRef.current.ticker.stop();
            
            // Clean up active fish sprites and their tickers
            activeFishRef.current.forEach(fish => {
                try {
                    if (fish && !fish.destroyed) {
                        // Remove any ticker functions associated with this fish
                        if (appRef.current && appRef.current.ticker) {
                            appRef.current.ticker.remove((fish as any).pathTicker);
                        }
                        fish.destroy();
                    }
                } catch (e) {
                    console.warn('[HospitalBackdrop] Error cleaning up fish:', e);
                }
            });
            activeFishRef.current = [];
            
            // Clean up active ripple sprites and their tickers
            activeRipplesRef.current.forEach(ripple => {
                try {
                    if (ripple && !ripple.destroyed) {
                        // Remove any ticker functions associated with this ripple
                        if (appRef.current && appRef.current.ticker) {
                            appRef.current.ticker.remove((ripple as any).fadeTicker);
                        }
                        ripple.destroy();
                    }
                } catch (e) {
                    console.warn('[HospitalBackdrop] Error cleaning up ripple:', e);
                }
            });
            activeRipplesRef.current = [];
            
            // Clear the stage to remove any remaining sprites
            if (appRef.current.stage) {
                try {
                    appRef.current.stage.removeChildren();
                } catch (e) {
                    console.warn('[HospitalBackdrop] Error clearing stage:', e);
                }
            }
        }
        
        if (appRef.current) {
            try {
                appRef.current.destroy(true, true);
            } catch (e) {
                console.warn('[HospitalBackdrop] Error destroying PIXI app:', e);
            }
            appRef.current = null;
        }
    };
  }, []);

      // Update debug grid visibility when state changes
    useEffect(() => {
        if (debugGridContainerRef.current) {
            debugGridContainerRef.current.visible = showDebugGrid;
            console.log(`[HospitalBackdrop] Debug grid visibility updated: ${showDebugGrid ? 'VISIBLE' : 'HIDDEN'}`);
        }
    }, [showDebugGrid]);

    // Update pond polygon visibility when state changes
    useEffect(() => {
        if (pondPolygonContainerRef.current) {
            pondPolygonContainerRef.current.visible = showPondPolygon;
            console.log(`[HospitalBackdrop] Pond polygon visibility updated: ${showPondPolygon ? 'VISIBLE' : 'HIDDEN'}`);
        }
    }, [showPondPolygon]);

  const handleEndDayClick = () => {
    centralEventBus.dispatch(GameEventType.END_OF_DAY_REACHED, { day: daysPassed }, 'HospitalBackdrop.handleEndDayClick');
  };

  // Get hovered room data for tooltip


  // Handle mentor clicks (dual click system)
  const handleMentorClick = (mentorId: string, roomId: string) => {
    console.log(`[HospitalBackdrop] Mentor clicked: ${mentorId} in room: ${roomId}`);
    
    // Find the room data to determine activity type
    const roomData = ROOM_AREAS.find(room => room.id === roomId);
    if (!roomData) {
      console.warn(`[HospitalBackdrop] No room data found for: ${roomId}`);
      return;
    }

    // Priority 1: Tutorial dialogue (only for narrative rooms, let social-hubs handle their own tutorial integration)
    if (isTutorialActive && roomData.activityType === 'narrative') {
      const tutorialDialogueId = getTutorialDialogueForRoom(roomId, currentTutorialStep);
      if (tutorialDialogueId) {
        console.log(`[HospitalBackdrop] Starting tutorial dialogue: ${tutorialDialogueId}`);
        enterNarrative(mentorId, tutorialDialogueId, roomId);
        return;
      }
    }

    // Priority 2: Room's default activity type
    const defaultDialogueId = `${roomId}-intro`;
    if (roomData.activityType === 'narrative') {
      enterNarrative(mentorId, defaultDialogueId, roomId);
    } else if (roomData.activityType === 'social-hub') {
      // Navigate directly to lunch room scene
      const { setSceneDirectly } = useSceneStore.getState();
      setSceneDirectly('lunch-room');
    } else {
      enterChallenge(`${roomId}-activity`, mentorId, roomId);
    }
  };

  return (
    <HospitalContainer>
      <PixiCanvasContainer ref={pixiContainerRef} />
      
      {/* Mentor Click Overlay - positioned over PixiJS sprites */}
      <MentorClickOverlay onMentorClick={handleMentorClick} />
      
      {showEndDayButton && (
        <EndDayButton onClick={handleEndDayClick}>
          End Day {daysPassed + 1}
        </EndDayButton>
      )}

    </HospitalContainer>
  );
} 