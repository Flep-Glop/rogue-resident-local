# 🏗️ ROGUE RESIDENT ARCHITECTURE
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

**Used by:** QuinnTutorialActivity, NarrativeDialogue, HomeScene, all UI screens

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
- Domain-specific stores (gameStore, knowledgeStore, timeStore)
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