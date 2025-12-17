import { useEffect, MutableRefObject } from 'react';
import { SkyHighlightType } from './CombinedHomeScene.constants';
import { PRIMAREUS_POSITION } from './CombinedHomeScene.constants';

// Types for constellation star structure
interface ConstellationStar {
  id: string;
  x: number;
  y: number;
  frame: number;
  angle?: number;
  distance?: number;
  parentId?: string;
  scale?: number;
  opacity?: number;
  zIndex?: number;
}

// Interface for debug mode setters
export interface DebugModeSetters {
  setKapoorPosition: (pos: { x: number; y: number }) => void;
  setKapoorDirection: (dir: 'front' | 'back' | 'right' | 'left') => void;
  setKapoorIsWalking: (walking: boolean) => void;
  setDeskXKeyEnabled: (enabled: boolean) => void;
  setArrowKeysVisible: (visible: boolean) => void;
  setHasCompletedFirstActivity: (completed: boolean) => void;
  setHasSeenConstellationCutscene: (seen: boolean) => void;
  setShowFinalConstellation: (show: boolean) => void;
  setConstellationStars: (stars: ConstellationStar[]) => void;
  setSkyHighlight: (highlight: SkyHighlightType) => void;
  setXKeyTriggered: (triggered: boolean) => void;
  hasShownWelcomeRef: MutableRefObject<boolean>;
}

/**
 * Debug mode hooks for development testing
 * Reads localStorage flags and sets up specific game states for testing
 * 
 * Available debug modes (set via localStorage):
 * - debug_skip_to_desk: Position Kapoor near desk with interaction enabled
 * - debug_skip_to_cutscene: Pre-cutscene state (after first activity)
 * - debug_after_cutscene: Post-cutscene state (ready for second activity)
 * - debug_planetary_systems: Showcase mode with 7 planetary systems
 */
export function useDebugModes(setters: DebugModeSetters): void {
  const {
    setKapoorPosition,
    setKapoorDirection,
    setKapoorIsWalking,
    setDeskXKeyEnabled,
    setArrowKeysVisible,
    setHasCompletedFirstActivity,
    setHasSeenConstellationCutscene,
    setShowFinalConstellation,
    setConstellationStars,
    setSkyHighlight,
    setXKeyTriggered,
    hasShownWelcomeRef,
  } = setters;

  // === DEBUG MODE: Skip to desk interaction ===
  useEffect(() => {
    const debugFlag = localStorage.getItem('debug_skip_to_desk');
    if (debugFlag === 'true') {
      console.log('[useDebugModes] 🧪 Debug mode: Skipping to desk interaction!');
      
      // Clear the flag so it doesn't persist
      localStorage.removeItem('debug_skip_to_desk');
      
      // Skip welcome screen
      hasShownWelcomeRef.current = true;
      
      // Position Kapoor near desk (left side of first floor)
      setKapoorPosition({ x: 200, y: 467 });
      setKapoorDirection('right');
      setKapoorIsWalking(false);
      
      // Enable desk interaction immediately (simulate star having been viewed)
      setDeskXKeyEnabled(true);
      
      // Hide tutorial elements
      setArrowKeysVisible(false);
      
      console.log('[useDebugModes] 🧪 Debug setup complete - desk interaction is active!');
    }
  }, []); // Run once on mount
  
  // === DEBUG MODE: Skip to pre-cutscene (after desk activity) ===
  useEffect(() => {
    const debugFlag = localStorage.getItem('debug_skip_to_cutscene');
    if (debugFlag === 'true') {
      console.log('[useDebugModes] 🧪 Debug mode: Skipping to pre-cutscene state!');
      
      // Clear the flag so it doesn't persist
      localStorage.removeItem('debug_skip_to_cutscene');
      
      // Skip welcome screen
      hasShownWelcomeRef.current = true;
      
      // Position Kapoor near telescope (ground floor, near ladder)
      setKapoorPosition({ x: 480, y: 467 });
      setKapoorDirection('right');
      setKapoorIsWalking(false);
      
      // Mark first activity as completed (enables cutscene trigger)
      setHasCompletedFirstActivity(true);
      
      // Hide tutorial elements
      setArrowKeysVisible(false);
      
      console.log('[useDebugModes] 🧪 Debug setup complete - ready for constellation cutscene on X key press!');
    }
  }, []); // Run once on mount
  
  // === DEBUG MODE: Skip to post-cutscene (after constellation reveal, ready for second activity) ===
  useEffect(() => {
    const debugFlag = localStorage.getItem('debug_after_cutscene');
    if (debugFlag === 'true') {
      console.log('[useDebugModes] 🧪 Debug mode: Skipping to post-cutscene state!');
      
      // Clear the flag so it doesn't persist
      localStorage.removeItem('debug_after_cutscene');
      
      // Skip welcome screen
      hasShownWelcomeRef.current = true;
      
      // Position Kapoor near desk (close enough for X key to show - desk is at x:400, threshold is 60px)
      setKapoorPosition({ x: 360, y: 467 });
      setKapoorDirection('right');
      setKapoorIsWalking(false);
      
      // Mark first activity as completed AND cutscene as seen
      setHasCompletedFirstActivity(true);
      setHasSeenConstellationCutscene(true);
      
      // Show final constellation in sky
      setShowFinalConstellation(true);
      
      // Create constellation manually (skip animation, use final frames)
      // NOW USES PLANETARY-SHEET.PNG: planet frame 2, moons frame 0 (small moon)
      const createMoon = (id: string, offsetX: number, offsetY: number) => {
        const x = PRIMAREUS_POSITION.x + offsetX;
        const y = PRIMAREUS_POSITION.y + offsetY;
        const angle = Math.atan2(offsetY, offsetX);
        const distance = Math.sqrt(offsetX * offsetX + offsetY * offsetY);
        return { id, x, y, frame: 0, angle, distance, parentId: 'tbi' }; // Use planetary-sheet frame 0 (small moon), set parent
      };
      
      setConstellationStars([
        { id: 'tbi', x: PRIMAREUS_POSITION.x, y: PRIMAREUS_POSITION.y, frame: 2 }, // Center planet (TBI) uses planetary-sheet frame 2 (planet)
        createMoon('tbi_patient_setup', -20, 0), // Orbiting moon
      ]);
      
      // Enable desk X key system (planet has been "viewed")
      setDeskXKeyEnabled(true);
      // Note: deskXKeyVisible will be set by proximity check when Kapoor gets near desk
      
      // Set initial sky highlight to TBI planet (for second activity focus)
      setSkyHighlight('tbi');
      
      // Hide tutorial elements and ??? star
      setArrowKeysVisible(false);
      
      console.log('[useDebugModes] 🧪 Debug setup complete - constellation created, skyHighlight set to TBI, ready for second desk activity!');
    }
  }, []); // Run once on mount
  
  // === DEBUG MODE: Planetary Systems Showcase ===
  useEffect(() => {
    const debugFlag = localStorage.getItem('debug_planetary_systems');
    if (debugFlag === 'true') {
      console.log('[useDebugModes] 🧪 Debug mode: Creating planetary systems showcase!');
      
      // Clear the flag so it doesn't persist
      localStorage.removeItem('debug_planetary_systems');
      
      // Skip welcome screen
      hasShownWelcomeRef.current = true;
      
      // Position Kapoor on ground floor, far left (out of the way)
      setKapoorPosition({ x: 100, y: 467 });
      setKapoorDirection('right');
      setKapoorIsWalking(false);
      
      // Hide all tutorial/interaction elements
      setArrowKeysVisible(false);
      setDeskXKeyEnabled(false);
      
      // Set initial sky highlight to first planet for navigation
      setSkyHighlight('planet_1'); // Start with planet 1 highlighted
      
      // Create multiple localized planetary systems across the sky
      // Each system has a planet with 3 moons orbiting around IT (not a shared center)
      // NEW SPRITE SHEET: planetary-sheet.png (1344x14, 96 frames total)
      // Organization: 8 sets × 3 types (small moon, normal moon, planet) × 4 sections
      // Section 0 (frames 0-23): Default sprites
      // Section 1 (frames 24-47): Highlighted sprites
      // Section 2 (frames 48-71): Modal detail view
      // Section 3 (frames 72-95): Modal highlighted detail view
      // Frame calculation: frame = (section × 24) + (setIndex × 3) + typeIndex
      // Type 0 = small moon, Type 1 = normal moon, Type 2 = planet
      
      const planetarySystems: ConstellationStar[] = [];
      
      // Helper to create a moon orbiting a planet
      const createMoon = (moonId: string, planetId: string, planetX: number, planetY: number, frame: number, angle: number, distance: number) => {
        return {
          id: moonId,
          x: planetX + Math.cos(angle) * distance,
          y: planetY + Math.sin(angle) * distance,
          frame,
          angle,
          distance,
          parentId: planetId,
        };
      };
      
      // HEXAGONAL 2-3-2 ARRANGEMENT IN UPPER LEFT
      // Asymmetrical positioning with one system in the middle
      //      S1    S2
      //    S3   S4   S5
      //      S6    S7
      
      // Top row (2 systems)
      // System 1 (set 0) - Top left - planet=2, small moon=0
      const planet1 = { id: 'planet_1', x: 110, y: 65, frame: 2 };
      planetarySystems.push(planet1);
      planetarySystems.push(createMoon('moon_1a', 'planet_1', 110, 65, 0, Math.PI, 22));
      planetarySystems.push(createMoon('moon_1b', 'planet_1', 110, 65, 0, 0, 24));
      planetarySystems.push(createMoon('moon_1c', 'planet_1', 110, 65, 0, Math.PI / 2, 18));
      
      // System 2 (set 1) - Top right - planet=5, small moon=3
      const planet2 = { id: 'planet_2', x: 200, y: 70, frame: 5 };
      planetarySystems.push(planet2);
      planetarySystems.push(createMoon('moon_2a', 'planet_2', 200, 70, 3, -Math.PI / 3, 20));
      planetarySystems.push(createMoon('moon_2b', 'planet_2', 200, 70, 3, Math.PI / 2, 26));
      planetarySystems.push(createMoon('moon_2c', 'planet_2', 200, 70, 3, 2 * Math.PI / 3, 19));
      
      // Middle row (3 systems)
      // System 3 (set 2) - Middle left - planet=8, small moon=6
      const planet3 = { id: 'planet_3', x: 70, y: 130, frame: 8 };
      planetarySystems.push(planet3);
      planetarySystems.push(createMoon('moon_3a', 'planet_3', 70, 130, 6, -Math.PI / 2, 21));
      planetarySystems.push(createMoon('moon_3b', 'planet_3', 70, 130, 6, Math.PI, 28));
      planetarySystems.push(createMoon('moon_3c', 'planet_3', 70, 130, 6, Math.PI / 4, 23));
      
      // System 4 (set 3) - Middle center (featured) - planet=11, small moon=9
      const planet4 = { id: 'planet_4', x: 155, y: 135, frame: 11 };
      planetarySystems.push(planet4);
      planetarySystems.push(createMoon('moon_4a', 'planet_4', 155, 135, 9, 0, 30));
      planetarySystems.push(createMoon('moon_4b', 'planet_4', 155, 135, 9, 2 * Math.PI / 3, 32));
      planetarySystems.push(createMoon('moon_4c', 'planet_4', 155, 135, 9, -2 * Math.PI / 3, 30));
      
      // System 5 (set 4) - Middle right - planet=14, small moon=12
      const planet5 = { id: 'planet_5', x: 235, y: 138, frame: 14 };
      planetarySystems.push(planet5);
      planetarySystems.push(createMoon('moon_5a', 'planet_5', 235, 138, 12, 0, 24));
      planetarySystems.push(createMoon('moon_5b', 'planet_5', 235, 138, 12, Math.PI / 2, 27));
      planetarySystems.push(createMoon('moon_5c', 'planet_5', 235, 138, 12, Math.PI, 25));
      
      // Bottom row (2 systems)
      // System 6 (set 5) - Bottom left - planet=17, small moon=15
      const planet6 = { id: 'planet_6', x: 105, y: 195, frame: 17 };
      planetarySystems.push(planet6);
      planetarySystems.push(createMoon('moon_6a', 'planet_6', 105, 195, 15, Math.PI, 20));
      planetarySystems.push(createMoon('moon_6b', 'planet_6', 105, 195, 15, 0, 22));
      planetarySystems.push(createMoon('moon_6c', 'planet_6', 105, 195, 15, -Math.PI / 2, 18));
      
      // System 7 (set 6) - Bottom right - planet=20, small moon=18
      const planet7 = { id: 'planet_7', x: 190, y: 200, frame: 20 };
      planetarySystems.push(planet7);
      planetarySystems.push(createMoon('moon_7a', 'planet_7', 190, 200, 18, -2 * Math.PI / 3, 23));
      planetarySystems.push(createMoon('moon_7b', 'planet_7', 190, 200, 18, Math.PI / 3, 25));
      planetarySystems.push(createMoon('moon_7c', 'planet_7', 190, 200, 18, Math.PI, 21));
      
      setConstellationStars(planetarySystems);
      setShowFinalConstellation(true);
      
      // Mark cutscene as seen to enable orbital animation
      setHasSeenConstellationCutscene(true);
      
      // Mark first activity as complete so telescope is interactive
      setHasCompletedFirstActivity(true);
      
      // Enable telescope interaction for easy navigation to sky
      setXKeyTriggered(false); // Allow triggering
      
      console.log('[useDebugModes] 🧪 Planetary systems showcase created!');
      console.log('[useDebugModes] 🧪 7 systems (all in upper-left quadrant) with', planetarySystems.length, 'celestial bodies');
      console.log('[useDebugModes] 🧪 Every planet has 3-4 moons orbiting with full 3D effects!');
      console.log('[useDebugModes] 🧪 Press X near telescope to view the living sky!');
    }
  }, []); // Run once on mount
}

