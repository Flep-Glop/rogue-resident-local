# 🏗️ THE OBSERVATORY ARCHITECTURE
*Core architectural decisions and patterns that define the project*

## SURGICAL HYBRID ARCHITECTURE

### The Decision
We use PixiJS strategically for self-contained visual effects and CSS/React for UI animations. This is deliberate based on extensive testing.

### When to Use PixiJS
✅ **Use for:**
- Self-contained visual effects (particles, backgrounds, transitions)
- Hundreds of animated elements (constellation stars, weather)
- Fire-and-forget animations (triggered by events, runs independently)
- Atmospheric effects (lighting, fog, visual ambiance)
- Performance-critical graphics (60fps smooth animations)

### When to Use CSS/React
✅ **Use for:**
- UI element animations (cards sliding, buttons hovering)
- Tightly coupled to React state (show/hide based on game state)
- User input elements (forms, clickable cards, menus)
- Simple transitions (fade in/out, slide, scale)
- Frequent state updates (health bars, progress indicators)

### The Key Question
**"Does this animation need to frequently read or update React state?"**
- YES → Use CSS/React
- NO → Consider PixiJS

## COORDINATE SYSTEMS

### 1. Hospital View: World Coordinates (PixiJS-based)
**Fixed world dimensions:** 1920×1080 pixels as the "game world"
```typescript
const WORLD_WIDTH = 1920;
const WORLD_HEIGHT = 1080;

// Calculate uniform scale factor
const scaleX = app.screen.width / WORLD_WIDTH;
const scaleY = app.screen.height / WORLD_HEIGHT;
const worldScale = Math.min(scaleX, scaleY);

// Position elements using world coordinates
hospital.x = Math.floor(app.screen.width * 0.5);
hospital.y = Math.floor(app.screen.height * 0.5);
```

**Characteristics:**
- Dynamic scaling to fit any viewport
- World-centered positioning (-960 to +960 on X, -540 to +540 on Y)
- Shared coordinate conversion utilities in `worldCoordinates.ts`
- Perfect alignment between PixiJS sprites and React overlays

### 2. UI Screens: Internal Canvas (React-based)
**Fixed internal resolution:** 640×360 pixels
```typescript
const DIALOGUE_INTERNAL_WIDTH = 640;
const DIALOGUE_INTERNAL_HEIGHT = 360;

// Container with scaling
const Container = styled.div`
  width: ${DIALOGUE_INTERNAL_WIDTH}px;
  height: ${DIALOGUE_INTERNAL_HEIGHT}px;
  transform: translate(-50%, -50%) scale(var(--dialogue-scale));
`;

// Calculate scale
const scaleX = viewportWidth / DIALOGUE_INTERNAL_WIDTH;
const scaleY = viewportHeight / DIALOGUE_INTERNAL_HEIGHT;
const scale = Math.min(scaleX, scaleY);
```

**Used by:** HomeScene, all UI screens

**Key Rule:** Never mix coordinate systems within a single component.

## EVENT-DRIVEN ARCHITECTURE

### Pattern
```typescript
// React fires simple event
window.dispatchEvent(new CustomEvent('visualEffect', { 
  detail: { type: 'explosion', x: 100, y: 200 } 
}));

// PixiJS listens and creates effect
window.addEventListener('visualEffect', (event) => {
  createParticleExplosion(event.detail.x, event.detail.y);
  // Effect runs independently, cleans itself up
});
```

### Benefits
- No tight coupling between React and PixiJS
- Clear lifecycle management
- Easy to debug and trace

## STATE MANAGEMENT

### Zustand Stores
- Domain-specific stores (gameStore, knowledgeStore, resourceStore, abilityStore, sceneStore)
- Event bus for cross-store communication
- Chamber pattern for performance optimization

### Central Event Bus
- All major state changes dispatch events
- Components subscribe to relevant events
- Source tracking for debugging

## FAILED APPROACHES (Don't Try These)

### ❌ @pixi/react Integration
- v7: Incompatible with React 19 internal APIs
- v8: Critical PNG loading bugs (5+ hours wasted)
- **Decision:** Use surgical hybrid instead

### ❌ Complex State Coupling
- Patient card animation with multi-phase React-PixiJS handoffs
- **Problem:** Race conditions and state conflicts
- **Solution:** Keep PixiJS effects self-contained

### ❌ Counter-transforming Positions
- **Problem:** Trying to fix position with counter-transforms
- **Solution:** Just co-locate elements in the right container

### ❌ Complex Layered Systems
- **Problem:** Over-engineering visual layers
- **Solution:** Direct mapping usually better

## PARALLAX MULTI-CONTAINER ARCHITECTURE

### The Problem
CSS stacking contexts isolate z-index values. Elements inside one container cannot render between layers of another container, regardless of z-index values.

### The Solution
Split parallax into multiple containers at different z-index levels:
```
Z-INDEX HIERARCHY:
├── BackgroundContainer (z: 2)    ← Sky, distant stars
├── CelestialContainer (z: 6)     ← Stars, planets (elevates to 15 when highlighted)
├── CloudContainer (z: 8)         ← Atmospheric clouds
├── AbyssContainer (z: 9)         ← Foreground atmosphere
├── TelescopeContainer (z: 14)    ← Interactive foreground elements
└── ScrollingContent (z: 12)      ← Character, UI overlays
```

### Layer Group System
```typescript
type LayerGroup = 'background' | 'clouds' | 'abyss' | 'telescope';

const layers = [
  { image: 'sky.png', group: 'background', parallaxFactor: 0.2 },
  { image: 'clouds.png', group: 'clouds', parallaxFactor: 0.5 },
  { image: 'telescope.png', group: 'telescope', parallaxFactor: 1.0 },
];

// Render separate containers per group
{['background', 'clouds', 'telescope'].map(group => (
  <ParallaxContainer key={group} $zIndex={zIndexMap[group]}>
    {layers.filter(l => l.group === group).map(renderLayer)}
  </ParallaxContainer>
))}
```

### Dynamic Z-Index Elevation
When highlighting celestial bodies, elevate entire container:
```typescript
const shouldElevate = skyHighlight === 'star' || skyHighlight.startsWith('planet_');
<CelestialContainer style={{ zIndex: shouldElevate ? 15 : 6 }} />
```

## PARENT-CHILD ORBITAL ARCHITECTURE

### Data Structure
```typescript
interface CelestialBody {
  id: string;
  parentId?: string;      // If set, this orbits that parent
  frame: number;
  angle?: number;         // Orbital position (radians)
  distance?: number;      // Orbital radius (pixels)
  x: number;
  y: number;
  scale: number;
  opacity: number;
  zIndex: number;
}
```

### Position Calculation
```typescript
// Build lookup for parent positions
const planetPositions = new Map<string, {x: number, y: number}>();
bodies.filter(b => !b.parentId).forEach(planet => {
  planetPositions.set(planet.id, { x: planet.x, y: planet.y });
});

// Calculate moon positions relative to parents
bodies.filter(b => b.parentId).forEach(moon => {
  const parent = planetPositions.get(moon.parentId);
  if (!parent) return;
  
  moon.x = parent.x + Math.cos(moon.angle) * moon.distance;
  moon.y = parent.y + Math.sin(moon.angle) * moon.distance * 0.5; // Elliptical
});
```

## COMPOSITE LAYER SYSTEMS

### Pattern: Aligned Sprite Layers
Instead of one monolithic sprite sheet, use multiple aligned layers:
```
comp-sheet system (300×180 per frame):
├── comp-monitor.png (300×180, z: 300) - Monitor frame with black fill (base layer)
├── comp-screen-blue.png / comp-screen-dark.png (300×180, z: 301) - Dynamic screen color overlay
├── comp-tabs.png (8 frames @ 2400×180, z: 302) - Tab states with highlight and shop lock
├── comp-activity-option-popups-sheet.png (7 frames @ 2100×180, z: 303) - Highlight popup states
├── comp-activity-options.png (static @ 300×180, z: 304) - Activity options content layer
├── ActivityClickRegion (z: 305) - Mouse interaction overlay
├── tbi-positioning.png (16 frames @ 4800×180, z: 306) - TBI activity content
├── anthro-intro.png (4 frames @ 1200×180, z: 305) - Dialogue overlay
└── tbi-positioning-result.png (13 frames @ 3900×180, z: 307) - Result animation
```

### Benefits
- Independent animation per layer
- Simpler frame calculations
- Easier to modify individual layers
- Phase-based visibility control
- Clean layer swapping for different activities

### Implementation
```typescript
// Layer visibility by phase
const showActivityLayers = compSheetPhase === 'waiting';
const screenVariant = compSheetPhase === 'activity' ? 'dark' : 'blue';

<CompMonitor $visible={compSheetVisible} /> {/* Base layer with black fill */}
<CompScreen $visible={compSheetVisible} $variant={screenVariant} />
<CompActivity $visible={compSheetVisible && showActivityLayers} />
<CompOptions $frame={optionsFrame} $visible={showActivityLayers} />
<CompOption1 $frame={option1Frame} $visible={showActivityLayers} />
<TbiPositioning $visible={compSheetPhase === 'activity'} />
<AnthroIntro $frame={introFrame} $visible={compSheetPhase === 'intro'} />
<TbiResult $frame={resultFrame} $visible={compSheetPhase === 'result'} />
```

### Dynamic Color Overlay Pattern
Split static structure from dynamic content for elegant transitions:

```typescript
// Base layer: monitor with black fill (always visible)
<CompMonitorLayer $visible={compSheetVisible} />

// Color overlay: changes based on phase
<CompScreenLayer 
  $visible={compSheetVisible} 
  $variant={compSheetPhase === 'waiting' ? 'blue' : 'dark'}
  $opacity={screenOpacity}
/>
```

**Key insight:** The black monitor base naturally serves as intermediate "fade to/from black" state, enabling bi-directional transitions without additional layers.

## DUAL SPRITE SHEET SYSTEMS

### When Needed
Different sprite sheets with different frame indexing (0-based vs 1-based) or dimensions.

### Implementation
```typescript
interface StarSpriteProps {
  $isPlanetarySystem: boolean;
  $frame: number;
}

const StarSprite = styled.div<StarSpriteProps>`
  background-image: url(${props => 
    props.$isPlanetarySystem 
      ? '/images/home/planetary-sheet.png'
      : '/images/home/star-sheet.png'
  });
  background-size: ${props => 
    props.$isPlanetarySystem ? '9600%' : '4000%'  // 96 vs 40 frames
  };
  background-position: ${props => {
    const frame = props.$isPlanetarySystem 
      ? props.$frame           // 0-indexed
      : props.$frame - 1;      // 1-indexed
    return `${frame * -14}px 0`;
  }};
`;
```

### Frame Offset Highlighting
```typescript
// Different sheets use different highlight offsets
const getHighlightedFrame = (frame: number, id: string) => {
  if (id.startsWith('planet_') || id.startsWith('tbi_')) {
    return frame + 24;  // Planetary sheet: section 0 → section 1
  }
  return frame + 9;     // Star sheet: different organization
};
```

## PHASE-BASED STATE MACHINES

### Pattern: Transition Chains
Use phase strings to manage complex multi-step transitions:

```typescript
type CompSheetPhase = 
  | 'booting'                    // Initial black screen (300ms)
  | 'booting_fade_in'            // Fade to menu (350ms)
  | 'waiting'                    // Menu idle state
  | 'transitioning'              // Button press (150ms)
  | 'fading_to_black'            // Fade out (350ms)
  | 'intro'                      // Dialogue sequence
  | 'intro_fading_to_black'      // Dialogue → activity (350ms)
  | 'fading_from_black'          // Activity fade in (350ms)
  | 'activity'                   // TBI positioning active
  | 'result_fading_to_black'     // Activity → result (350ms)
  | 'result_fading_from_black'   // Result fade in (350ms)
  | 'result';                    // Result animation

// Transition logic
const startActivity = () => {
  setPhase('transitioning');
  setTimeout(() => {
    setPhase('fading_to_black');
    setTimeout(() => {
      setPhase('intro');
    }, 350);
  }, 150);
};
```

### Benefits
- **Scalable:** Adding intermediate phases extends chain without restructuring
- **Debuggable:** Current phase is explicit in state
- **Flexible:** Easy to insert new transitions between existing phases
- **Clear:** Phase names document the flow

### Layer Visibility by Phase
```typescript
// Menu layers visible during boot and menu phases
const showMenuLayers = ['booting_fade_in', 'waiting', 'transitioning'].includes(phase);

// Screen color switches by phase group
const screenVariant = ['waiting', 'booting_fade_in', 'transitioning'].includes(phase) 
  ? 'blue' 
  : 'dark';

// Activity content only during activity phases
const showActivity = phase === 'activity';
const showIntro = phase === 'intro' || phase === 'intro_fading_to_black';
const showResult = ['result', 'result_fading_from_black', 'result_fading_to_black'].includes(phase);
```

### Transition Timing Patterns
```typescript
// Fast press feedback
const PRESS_DURATION = 150;

// Standard fade duration
const FADE_DURATION = 350;

// Hover highlight
const HOVER_DURATION = 50;

// Chain multiple transitions
setPhase('transitioning');
setTimeout(() => {
  setPhase('fading_to_black');
  setTimeout(() => {
    setPhase('next_phase');
  }, FADE_DURATION);
}, PRESS_DURATION);
```

## CAMERA TRANSLATION PATTERN

### For Modal Focus Navigation
Instead of repositioning elements, translate the "camera":
```typescript
// All bodies in absolute coordinate system
const bodies = [
  { id: 'planet', x: 0, y: 0 },        // Planet at origin
  { id: 'moon1', x: 30, y: 20 },       // Moons orbit around it
  { id: 'moon2', x: -25, y: -15 },
];

// Camera follows focused body
const focusedBody = bodies.find(b => b.id === focusedId);
const cameraX = focusedBody.x;
const cameraY = focusedBody.y;

// Render all bodies relative to camera
{bodies.map(body => (
  <Sprite style={{
    left: `calc(50% + ${body.x - cameraX}px)`,
    top: `calc(50% + ${body.y - cameraY}px)`,
  }} />
))}
```

### Component Consistency for Transitions
**Use same component type for all elements** to maintain CSS transition state:
```typescript
// ❌ Component type change breaks transitions
{focusedId === body.id ? <StarSprite /> : <MoonSprite />}

// ✅ Same component, different props
<MoonSprite $isFocused={focusedId === body.id} />
```

## MODULAR SPRITE COMPOSITION ARCHITECTURE

### Pattern: Lookup Table Driven Rendering
Instead of pre-baked sprite animations, use small modular sprites with lookup tables:

```typescript
// Position lookup table separates game logic from rendering
const TBI_POSITION_RESULTS = {
  0: [2, 2, 2, 2, 2, 2, 2, 2, 2, 2],  // Far from gantry: all green
  8: [2, 2, 2, 2, 2, 2, 2, 2, 2, 2],  // Optimal: all green
  15: [0, 1, 2, 2, 2, 2, 2, 2, 1, 0], // Too close: extremities underdosed
};

// Minimal sprites:
// - 3-color bars (51×7px each)
// - 11-frame mask (61×72px)
// - 3-frame backdrop (base/fail/pass)
```

### Benefits
- **Scalability:** 16 positions × 10 segments = 160 results from 6 sprites
- **Maintainability:** Change outcomes without regenerating assets
- **Testability:** Pure functions for position → result mapping

## TITLE SCREEN LAYERED ANIMATION SYSTEM

### 11-Layer Composite Architecture
```
Layer order (bottom to top):
├── Background (static)
├── Cloud Layer 1 (slow parallax, ping-pong 0-7)
├── Cloud Layer 2 (medium parallax, offset start)
├── Cloud Layer 3 (fast parallax, desync timer)
├── Abyss Layer (atmospheric depth)
├── Shooting Star 1-4 (staggered cooldowns)
├── Vignette (static darkening overlay)
├── Title Text (translates in dev mode)
└── Shine Effect (triggered at intro end + sporadic)
```

### Ping-Pong Animation Pattern
Essential for seamless looping without wrap-around frames:
```typescript
const updateFrame = () => {
  if (direction === 1 && frame >= 7) direction = -1;
  if (direction === -1 && frame <= 0) direction = 1;
  frame += direction;
};
// Result: 0→1→2→3→4→5→6→7→6→5→4→3→2→1→0→1→...
```

### Parallax Depth Ratios
Faster movement = closer layer:
- Cloud 1 (far): 600ms per frame
- Cloud 2 (mid): 450ms per frame  
- Cloud 3 (near): 300ms per frame
- Ratio: 2:1.33:1

## CHARACTER CREATOR SPRITE SYSTEM

### Unified Canvas Architecture
All character parts use same canvas dimensions for perfect layering:

```typescript
// 38×102px unified canvas (full body)
const CHARACTER_PARTS = [
  { id: 'legs', zIndex: 0 },
  { id: 'shoes', zIndex: 1 },
  { id: 'body', zIndex: 2 },
  { id: 'ears', zIndex: 3 },
  { id: 'face', zIndex: 4 },
  { id: 'nose', zIndex: 5 },
  { id: 'eyes', zIndex: 6 },
  { id: 'eyebrows', zIndex: 7 },
  { id: 'mouth', zIndex: 8 },
  { id: 'facial-hair', zIndex: 9 },
  { id: 'hair', zIndex: 10 },
  { id: 'extras', zIndex: 11 },
];
```

### Direction-Dependent Z-Index
Viewing angle changes layer semantics:
```typescript
const getPartZIndex = (partId: string, baseZ: number, direction: Direction) => {
  // Ears: behind face in front view, visible alongside in side view
  if (partId === 'ears' && (direction === 'left' || direction === 'right')) {
    return 9; // Move above facial features, below hair
  }
  return baseZ;
};
```

### Programmatic Layer Animation
Breathing animation without sprite sheet overhead:
```typescript
// 4-frame breathing cycle (600ms per frame)
const LAYER_GROUPS = {
  HEAD: ['ears', 'face', 'eyes', ...],   // Moves with breath
  TORSO: ['body'],                         // Follows head
  STATIC: ['legs', 'shoes'],               // Stays fixed
};

// Frame 0: neutral
// Frame 1: head down 1px
// Frame 2: torso follows
// Frame 3: return to neutral
```

## SPRITE SHEET COMPOSITOR ARCHITECTURE

### Dynamic Sprite Generation Pipeline
Generate game-compatible sprite sheets from modular character parts:

```typescript
// Output format: 38 frames matching CharacterSprite expectations
const FRAME_DEFINITIONS = [
  // Idle frames (4 per direction × 4 directions = 16)
  { dir: 'front', suffix: '', animFrame: 0-3 },
  { dir: 'back', suffix: '-back', animFrame: 0-3 },
  { dir: 'right', suffix: '-right', animFrame: 0-3 },
  { dir: 'left', suffix: '-left', animFrame: 0-3 },
  
  // Walk frames (8 per side direction × 2 = 16)
  { dir: 'right', suffix: '-right-w1' through '-w4', animFrame: 0-7 },
  { dir: 'left', suffix: '-left-w1' through '-w4', animFrame: 0-7 },
  
  // Climb frames (6 total)
  { dir: 'back', suffix: '-back-c1', flip: false/true, animFrame: 0-5 },
];

// Compositor loads parts → applies palettes → composites → exports data URL
```

### Graceful Fallback Pattern
Handle missing directional sprites without breaking:
```typescript
const getSpriteSrc = (part, direction, walkFrame?) => {
  const variants = direction === 'back' ? part.backVariants 
                 : direction === 'left' || direction === 'right' ? part.sideVariants 
                 : part.variants;
  
  // If variant doesn't exist for direction, fall back to base sprite
  if (!variants.includes(currentVariant)) {
    return null; // Silently skip rendering this part
  }
  return `/images/characters/${part.id}-${variant}${suffix}.png`;
};
```

## TAB-BASED NAVIGATION SYSTEM

### Pattern: Spatial Navigation Extension
Tabs are vertical lists that extend 2D content navigation:

```typescript
interface TabNavigationState {
  currentTab: 'activities' | 'shop';
  tabFocused: boolean;
  highlightedItem: number;
}

// Navigation flow:
// - Left from leftmost content → focus tabs
// - Up/Down on tabs → switch tabs
// - Right from tabs → enter content area
// - Content uses 2D spatial navigation
```

### Frame Calculation for Tab States
```typescript
const getCompTabsFrame = (
  currentTab: 'activities' | 'shop',
  tabFocused: boolean,
  shopUnlocked: boolean
): number => {
  if (!shopUnlocked) return tabFocused ? 2 : 1;  // Locked frames
  if (currentTab === 'activities') return tabFocused ? 4 : 3;
  return tabFocused ? 6 : 5;  // Shop tab frames
};
```

## AUDIO SYSTEM ARCHITECTURE

### 4-Layer Pattern
Mirrors sprite system organization:

```
audio.constants.ts    → Asset definitions, paths, volumes, cooldowns
AudioManager.ts       → Singleton with Web Audio API (SFX) + HTMLAudioElement (Music/VO)
useAudio.ts          → React hooks (useAudioInit, useSound, useMusic, useVoiceover)
audioStore.ts        → Zustand store with localStorage persistence
```

### Audio Category Characteristics
| Category | API | Preload | Loop | Fade |
|----------|-----|---------|------|------|
| SFX | Web Audio API | Yes | No | No |
| Music | HTMLAudioElement | No | Yes | Yes |
| Voiceover | HTMLAudioElement | No | No | No |

### Browser Autoplay Handling
```typescript
// Attempt autoplay immediately
const playResult = await audioManager.playMusic('main_theme');

if (!playResult) {
  // Blocked by browser policy - retry on first user interaction
  const handleInteraction = () => {
    audioManager.playMusic('main_theme');
    window.removeEventListener('click', handleInteraction);
    window.removeEventListener('keydown', handleInteraction);
  };
  window.addEventListener('click', handleInteraction, { once: true });
  window.addEventListener('keydown', handleInteraction, { once: true });
}
```

## CINEMATIC SPLASH SCREEN SYSTEM

### Multi-Phase Animation State Machine
```typescript
type SplashPhase = 
  | 'fading_to_black'      // 1.5s dramatic fade from title
  | 'fading_in'            // 1.2s logo 1 fade in
  | 'animating'            // 36-frame animation at 80ms/frame
  | 'holding'              // 1s hold on final frame
  | 'fading_out'           // 1s fade out
  | 'camp_fading_in'       // 1.2s logo 2 fade in
  | 'camp_holding'         // 2s hold
  | 'camp_fading_out';     // 1s fade out → transition

// Key insight: Separate background (Graphics) from content (Sprite)
// for independent alpha control during transitions
```

### Easing for Cinematic Feel
```typescript
const easeInOutCubic = (t: number): number => {
  return t < 0.5 
    ? 4 * t * t * t 
    : 1 - Math.pow(-2 * t + 2, 3) / 2;
};
// Apply to all fade transitions for smooth, professional feel