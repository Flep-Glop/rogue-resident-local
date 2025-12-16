# 🎯 ROGUE RESIDENT PATTERNS
*What works, what doesn't, and how to implement successfully*

## ANIMATION PATTERNS

### Aseprite-First Policy
```
Can this be animated in Aseprite? → YES → Do it there
├─ NO, needs dynamic data → Code it
├─ NO, needs physics → PixiJS
└─ NO, needs glow/effects → CSS/PixiJS hybrid
```

### CSS Animation Strategy
✅ **PREFERRED: CSS for UI animations**
```typescript
const AnimatedElement = styled.div`
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  animation: fadeIn 0.6s ease-out;
`;
```

✅ **PREFERRED: PixiJS for complex visual effects**
```typescript
const createParticleSystem = () => {
  // Complex particle physics, trails, atmospheric effects
};
```

❌ **AVOID: JavaScript animations for simple UI transitions**

### Animation Timing
- **User-triggered:** 450ms feels responsive
- **Automated sequences:** 900ms for smooth flow
- **Easing curves:**
  - Quick interactions: `ease` (0.3s)
  - Professional transitions: `cubic-bezier(0.25, 0.46, 0.45, 0.94)` (0.8s)
  - Dramatic effects: `cubic-bezier(0.4, 0.0, 0.2, 1.0)` (1.8s)

## ASSET PATTERNS

### Native Dimensions Rule
**CRITICAL:** Asset dimensions MUST be native
- 220px asset → display at 220px, NOT 110px
- Never scale down assets in CSS (breaks pixel-perfect rendering)
- Use IMG elements, not background-image

### 9-Slice Container System
```css
.pixel-container {
  border-image: url('/images/ui/containers/window-9slice.png') 20 fill;
  border-image-slice: 20;
  border-width: 20px;
  image-rendering: pixelated;
}
```
**Benefits:** Authentic pixel art feel, expandable containers, TypewriterText compatible

## MEMORY MANAGEMENT

### Critical PixiJS Cleanup
```typescript
useEffect(() => {
  let isMounted = true;
  
  return () => {
    isMounted = false;
    
    // 1. Clear timers immediately
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    
    // 2. Stop tickers before cleanup
    if (appRef.current?.ticker) {
      appRef.current.ticker.stop();
      sprites.forEach(sprite => {
        appRef.current.ticker.remove(sprite.tickerFunction);
        sprite.destroy();
      });
    }
    
    // 3. Clean arrays and references
    spritesRef.current = [];
  };
}, []);
```

## CSS POSITIONING QUIRKS

### Overflow Visible Pattern
```css
/* When child elements extend beyond container (tooltips, badges) */
.container {
  overflow: visible; /* Prevents clipping */
  position: relative;
}

.positioned-child {
  position: absolute;
  top: -4px; /* Safe positioning */
  right: -8px;
}
```

### Pointer Events Fix
```css
/* High z-index invisible elements block clicks */
.overlay {
  pointer-events: ${props => props.visible ? 'all' : 'none'};
  z-index: 1000;
}
```

### Tailwind Limitations
When Tailwind classes fail (z-index, custom values), use inline styles:
```typescript
style={{
  position: 'fixed',
  zIndex: 1010, // Guaranteed application
}}
```

## STATE MANAGEMENT PATTERNS

### Event-Driven Communication
```typescript
// Dispatch events for cross-component communication
centralEventBus.dispatch(GameEventType.ACTIVITY_COMPLETED, payload, 'source');

// Subscribe in components
useEffect(() => {
  const unsubscribe = centralEventBus.subscribe(
    GameEventType.ACTIVITY_COMPLETED,
    handleActivityComplete
  );
  return unsubscribe;
}, []);
```

### Chamber Pattern (Performance)
Use primitive values and stable selectors to prevent re-renders:
```typescript
// Extract only what's needed
const { hour, minute } = usePrimitiveValues(
  useTimeStore,
  {
    hour: state => state.currentHour,
    minute: state => state.currentMinute
  },
  { hour: 8, minute: 0 }
);
```

## REFACTORING CHECKLIST

When updating old components:
- [ ] Verify native dimensions (not scaled)
- [ ] Check coordinate system (world vs internal canvas)
- [ ] Confirm event listeners use current pattern
- [ ] Validate cleanup patterns in place

## DEBUGGING PATTERNS

### Visual Debugging
```typescript
// Red border debugging for positioning
style={{ border: DEBUG_MODE ? '1px solid red' : 'none' }}

// Debug grid overlay
const DEBUG_MODE = process.env.NODE_ENV === 'development';
```

### Common Symptoms → Solutions
- **Flickering/jumping** → Transform conflicts or state thrashing
- **Unclickable elements** → Check pointer-events and z-index
- **Blurry pixels** → Asset downscaling in CSS
- **Text too large/small** → Wrong typography context

## KEYBOARD INPUT PATTERNS

### Priority-Based X/C Key Handlers
Handle multiple overlapping interactions with explicit priority ordering:
```typescript
// X key handler with priorities (higher = checked first)
if (showMonologue) {
  // Priority 1a: Dismiss monologue
  handleDismissMonologue();
} else if (showStarDetail) {
  // Priority 1b: Close modal
  handleCloseModal();
} else if (compSheetVisible && !showResults) {
  // Priority 2: Activity interaction
  handleQuizSelect();
} else if (activeInteraction === 'desk') {
  // Priority 3: World interaction
  handleDeskInteraction();
}
```
**Principle:** Dismiss temporary UI → Close modals → Activity actions → World interactions

### Stale Closure Prevention (CRITICAL)
**ALWAYS** include state variables in useEffect dependency arrays:
```typescript
// ❌ BAD: Handler uses stale showMonologue value
useEffect(() => {
  const handleKey = () => {
    if (showMonologue) { /* stale! */ }
  };
  window.addEventListener('keydown', handleKey);
  return () => window.removeEventListener('keydown', handleKey);
}, []); // Missing showMonologue!

// ✅ GOOD: Handler recreates with current value
useEffect(() => {
  const handleKey = () => {
    if (showMonologue) { /* current */ }
  };
  window.addEventListener('keydown', handleKey);
  return () => window.removeEventListener('keydown', handleKey);
}, [showMonologue]); // Included in deps
```
**Symptom:** State changes but handler doesn't react. Works after unrelated state changes (which force recreation).

### Event Capture Phase for Priority
```typescript
// Capture phase runs BEFORE bubbling phase
window.addEventListener('keydown', handler, { capture: true });
```
Use when one handler must intercept before others.

### Single-Zone vs Two-Zone Interactions
```
❌ Two-zone (confusing):
   [proximity hint zone] → [actual interaction zone]
   Keys appear but don't work until closer

✅ Single-zone (clear):
   [interaction zone only]
   Keys appear = action available
```

## ANIMATION INTERVAL PATTERNS

### Ref-Based State Access
Prevent interval recreation when reading frequently-changing state:
```typescript
const stateRef = useRef(state);
useEffect(() => { stateRef.current = state; }, [state]);

useEffect(() => {
  const interval = setInterval(() => {
    // Read from ref, not state
    const current = stateRef.current;
    // ... animation logic
  }, 16);
  return () => clearInterval(interval);
}, []); // Empty deps - interval never recreates
```

### Recursive setTimeout for Variable Timing
```typescript
const animate = () => {
  const delay = frame === 0 ? 1000 : 150; // Linger on frame 0
  setTimeout(() => {
    setFrame(prev => (prev + 1) % frameCount);
    animate();
  }, delay);
};
```

### Desynchronized Multi-Element Animations
```typescript
// Each element gets random offsets
const stars = items.map(item => ({
  ...item,
  frameOffset: Math.random() * 3,
  opacityOffset: Math.random() * Math.PI * 2
}));

// In animation loop
stars.forEach(star => {
  const frame = (baseFrame + star.frameOffset) % frameCount;
  const opacity = 0.3 + 0.7 * Math.abs(Math.sin(phase + star.opacityOffset));
});
```

## SPATIAL NAVIGATION PATTERN

### Dot Product Alignment Algorithm
Navigate to nearest element in pressed direction:
```typescript
const navigate = (directionX: number, directionY: number) => {
  const currentPos = positions[currentHighlight];
  let bestTarget = null;
  let bestScore = Infinity;

  positions.forEach((pos, id) => {
    if (id === currentHighlight) return;
    
    const dx = pos.x - currentPos.x;
    const dy = pos.y - currentPos.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Dot product determines if target is "in the right direction"
    const alignment = (dx * directionX + dy * directionY) / distance;
    
    if (alignment > 0.3) { // Threshold allows slight off-axis
      // Square alignment to heavily favor direct targets
      const score = distance / (alignment * alignment);
      if (score < bestScore) {
        bestScore = score;
        bestTarget = id;
      }
    }
  });
  
  if (bestTarget) setHighlight(bestTarget);
};
```

## 3D ORBITAL ILLUSION

Create depth perception in 2D:
```typescript
const updateOrbit = () => {
  const angle = body.angle + 0.008; // Orbital speed
  
  // Elliptical path (compress Y for perspective)
  const x = center.x + Math.cos(angle) * radius;
  const y = center.y + Math.sin(angle) * radius * 0.5; // ELLIPSE_RATIO
  
  // Z-depth from angle: -1 (back) to +1 (front)
  const zDepth = Math.sin(angle);
  
  // Scale: closer = bigger (0.7 to 1.3)
  const scale = 0.7 + 0.3 * ((zDepth + 1) / 2);
  
  // Opacity: closer = more opaque (0.6 to 1.0)
  const opacity = 0.6 + 0.4 * ((zDepth + 1) / 2);
  
  // Z-index: behind (-1) vs in front (+1) of center
  const zIndex = zDepth < 0 ? 99 : 101; // Center at 100
};
```

## UI/UX PATTERNS

### Player-Following Interaction Prompts
```typescript
// Keys follow player position
<XKeySprite style={{
  left: kapoorPosition.x + 36,
  top: kapoorPosition.y - 5,
  transition: 'left 0.1s linear, top 0.1s linear'
}} />
```
**Better than:** Fixed position markers that confuse "where do I stand?"

### Speech Bubble Indicators
```
Visibility states:
- Always visible (permanent affordance)
- Proximity-highlighted (visual feedback when in range)
- Hidden after interaction (progressive removal)

Frame states:
- Frames 1-4: Normal animation
- Frames 5-8: Highlighted animation (selected/in-range)
```

### Progressive UI Affordance Removal
```
First playthrough: All indicators visible
After telescope used: Telescope bubble hidden
After star viewed: Star bubble hidden  
After activity done: Desk bubble hidden
Result: Clean UI as player learns mechanics
```

### One-Way vs Cyclical Flags
```typescript
// ❌ Cyclical flag (resets, causes bugs)
xKeyTriggered: false → true → false (on return)

// ✅ One-way progression flag (never resets)
deskXKeyEnabled: false → true (stays true)
```
Use one-way flags for visibility logic based on game progression.

### Progressive Dialogue Systems
```typescript
const stages = ['none', 'line1', 'line2', 'completed'];
const lines = {
  line1: "First inspection text...",
  line2: "Second inspection text...",
};

// Advance through stages on each inspection
const handleInspect = () => {
  setStage(prev => stages[stages.indexOf(prev) + 1]);
};
```

### Tutorial Gates
Physical blocking creates stronger motivation than optional hints:
```typescript
if (!picoInteracted && tryingToClimb) {
  showBlockingDialogue("Come talk to me first!");
  freezePlayer();
}
```

## CSS PATTERNS

### Overflow Hidden at EVERY Level
Scrollbars from nested content require overflow:hidden on ALL containers:
```css
.wrapper { overflow: hidden; }
.content { overflow: hidden; }
.options { overflow: hidden; }
.button { overflow: hidden; } /* Yes, even here */
```
Missing ONE level breaks the fix.

### CSS Stacking Context Isolation
Elements inside a container cannot render between layers of a sibling container:
```
❌ This doesn't work:
ParallaxContainer (z-index: 5)
  └── Star (z-index: 100) ← Still below clouds!
CloudContainer (z-index: 8)
  └── Cloud (z-index: 1)

✅ Split into separate containers:
BackgroundContainer (z-index: 2)
CelestialContainer (z-index: 6) ← Between!
CloudContainer (z-index: 8)
```

### Border-Image 9-Slice Limitations
**Border-image cannot slice sprite sheets** - always uses entire image:
```css
/* ❌ Shows ALL frames simultaneously */
border-image: url('button-sheet.png') 10 fill;

/* ✅ Separate files for each state */
border-image: url('button-default.png') 10 fill;
border-image: url('button-hover.png') 10 fill;
```

### 9-Slice Fill Keyword
Without `fill`, center area is transparent:
```css
/* ❌ Hollow container */
border-image-slice: 20;

/* ✅ Filled container */
border-image-slice: 20 fill;
```

## VISUAL DEBUGGING

### Color-Coded Boundary Debugging
```typescript
const DEBUG_BOUNDARIES = true;

{DEBUG_BOUNDARIES && (
  <>
    <BoundaryLine $x={58} $color="green" />
    <BoundaryLine $x={578} $color="green" />
    <PositionTracker style={{ left: pos.x, top: pos.y }}>
      {pos.x}, {pos.y}
    </PositionTracker>
  </>
)}
```

### Systematic Visual Investigation
When debugging layout issues:
1. Add colored outlines to suspected containers
2. Check what renders ABOVE/BELOW the problem (reveals z-index layer)
3. Log dimensions at each container level
4. Check if problem is overflow, stacking context, or positioning

## KEY PRINCIPLES

1. **Motion > brightness** for attention grabbing
2. **User-controlled > automatic** (manual dismissal feels intentional)
3. **Simplicity > complexity** (simpler solution usually right)
4. **Native dimensions > manual scaling**
5. **Event-driven > tight coupling**
6. **Single-zone interactions > two-zone proximity hints**
7. **One-way progression flags > cyclical state toggles**
8. **Refs for interval state access > deps that recreate intervals**