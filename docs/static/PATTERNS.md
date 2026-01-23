# 🎯 THE OBSERVATORY PATTERNS
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
  left: playerPosition.x + 36,
  top: playerPosition.y - 5,
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

## DISTANCE CALCULATION PATTERNS

### Horizontal-Only vs 2D Euclidean Distance
Choose the right distance metric for your interaction:

```typescript
// ✅ Horizontal-only: Same-floor interactions
const distanceToDesk = Math.abs(playerPosition.x - DESK_POSITION.x);
if (distanceToDesk <= INTERACTION_RANGE) {
  // Trigger desk interaction
}

// ✅ 2D Euclidean: Multi-floor or negligible y-offset
const dx = telescope.x - player.x;
const dy = telescope.y - player.y;  // Only 3px offset
const distance = Math.sqrt(dx * dx + dy * dy);

// ❌ 2D Euclidean with significant y-offset
// If y-offset is 28px and range is 30px:
// Effective horizontal range = √(30²-28²) ≈ 10px (too small!)
```

**Rule:** Use horizontal-only for same-floor side-view interactions. Only use 2D when y-offset is negligible or you need multi-floor gating.

## HYBRID INPUT SYSTEMS

### Mouse/Keyboard Mode Switching
```typescript
// -1 means "mouse mode", >= 0 means "keyboard mode"
const [selectedButton, setSelectedButton] = useState(-1);

// Arrow key activates keyboard mode
const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
    if (selectedButton === -1) {
      setSelectedButton(0); // Start keyboard nav
    } else {
      // Continue keyboard nav
      setSelectedButton(prev => /* navigate */);
    }
  }
};

// Mouse movement exits keyboard mode (with threshold)
let lastMouseX = 0, lastMouseY = 0;
window.addEventListener('mousemove', (e) => {
  const dx = e.clientX - lastMouseX;
  const dy = e.clientY - lastMouseY;
  if (Math.sqrt(dx * dx + dy * dy) > 5) { // Threshold prevents jitter
    setSelectedButton(-1); // Exit keyboard mode
  }
  lastMouseX = e.clientX;
  lastMouseY = e.clientY;
});
```

**Benefits:** Clear separation between input modes, intuitive mode switching, no conflicts between mouse and keyboard highlighting.

## REFACTORING PATTERNS

### Sprite System Resize Order
When resizing sprite systems, follow this sequence:
1. **Styled components** - Update dimensions and background-size
2. **JSX positioning** - Update x/y coordinates
3. **Click regions** - Recalculate offsets (scale factor + new position)
4. **Navigation positions** - Update spatial navigation coordinates
5. **Documentation** - Update SPRITES.md with new dimensions

### Feature Replacement Grep Strategy
When replacing complex features with simpler ones:
```bash
# Don't just search for setState calls
grep -r "quizQuestions" .  # Search for ALL references

# State hides in:
# - Debug logs: console.log({ quizQuestions })
# - useEffect dependencies: [quizQuestions, showQuiz]
# - Conditional renders: {quizQuestions.length > 0 && ...}
# - Type definitions: interface State { quizQuestions: ... }
```

**Insight:** Complex features leave traces in debug logs, dependency arrays, and conditional logic - search comprehensively.

### State Consolidation Process
When component has 50+ useState hooks:

**Step 1:** Define typed interfaces
```typescript
interface SpeechBubblesState {
  star: { visible: boolean; highlighted: boolean; };
  desk: { visible: boolean; highlighted: boolean; };
  pico: { visible: boolean; highlighted: boolean; };
}
```

**Step 2:** Create default objects
```typescript
const DEFAULT_BUBBLES: SpeechBubblesState = {
  star: { visible: true, highlighted: false },
  desk: { visible: true, highlighted: false },
  pico: { visible: true, highlighted: false },
};
```

**Step 3:** Add update helper
```typescript
const [bubbles, setBubbles] = useState(DEFAULT_BUBBLES);
const updateBubble = (key: keyof SpeechBubblesState, update: Partial<SpeechBubblesState[typeof key]>) => {
  setBubbles(prev => ({ ...prev, [key]: { ...prev[key], ...update } }));
};
```

**Step 4:** Systematic replacement
```typescript
// Old: starBubbleHighlighted
// New: bubbles.star.highlighted
// Use TypeScript errors to guide replacement
```

**Step 5:** Test incrementally
- Fix TypeScript errors in batches
- Run build between major sections
- Update keyboard handlers and effects last

**Result:** 70 useState → 5 domain objects. Total LOC stays flat but cognitive load drops dramatically.

### Hook Extraction with Actions Pattern
For large coupled hooks (keyboard handlers, movement logic):

**Create clean interfaces:**
```typescript
interface KeyboardState {
  // Read-only flags for decisions
  canCloseModal: boolean;
  canAdvanceDialogue: boolean;
  activeInteraction: InteractionType | null;
}

interface KeyboardActions {
  // Mutation callbacks
  onCloseModal: () => void;
  onAdvanceDialogue: () => void;
  onNavigateActivity: (direction: 'up' | 'down') => void;
}
```

**Extract pure logic:**
```typescript
export const useKeyboardControls = (
  state: KeyboardState,
  actions: KeyboardActions
) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'x') {
        if (state.canCloseModal) actions.onCloseModal();
        else if (state.canAdvanceDialogue) actions.onAdvanceDialogue();
        // ... pure decision logic only
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state, actions]); // Hook knows what it depends on
};
```

**In component:**
```typescript
const keyboardState = useMemo(() => ({
  canCloseModal: showModal && !isTransitioning,
  canAdvanceDialogue: showDialogue && currentFrame < maxFrames,
  activeInteraction: /* ... */,
}), [showModal, isTransitioning, showDialogue, currentFrame]);

const keyboardActions = useMemo(() => ({
  onCloseModal: () => setShowModal(false),
  onAdvanceDialogue: () => setCurrentFrame(f => f + 1),
  onNavigateActivity: (dir) => { /* ... */ },
}), [/* deps */]);

useKeyboardControls(keyboardState, keyboardActions);
```

**Benefits:**
- Hook is testable (pure decision logic)
- State contract is explicit
- Actions are atomic operations
- Total LOC increases but maintainability improves dramatically

### Callback-Based Hooks Pattern
When child behavior triggers parent state changes:

```typescript
// Hook handles condition detection
export const useKapoorMovement = (
  picoInteracted: boolean,
  onClimbBlocked: () => void  // Callback for side effects
) => {
  useEffect(() => {
    // ... movement logic
    if (tryingToClimb && !picoInteracted) {
      onClimbBlocked(); // Let parent handle dialogue/UI
    }
  }, [tryingToClimb, picoInteracted, onClimbBlocked]);
  
  return { position, direction, isWalking };
};

// In component
const handlePicoBlockingDialogue = () => {
  setPicoDialogue('Come talk to me first!');
  setShowBlockingDialogue(true);
};

const playerState = usePlayerMovement(
  picoInteracted,
  handlePicoBlockingDialogue
);
```

**Benefits:** Hook stays pure and testable, parent controls side effects, clean separation of concerns.

## MODULAR SPRITE PATTERNS

### Modular Composition > Pre-Baked Animations
Small modular sprites with lookup tables scale better than pre-baked sprite sheets:
```typescript
// ✅ 6 small sprites + lookup table = 160 possible results
const result = TBI_POSITION_RESULTS[positionIndex]; // [2,2,1,0,...]
bars.forEach((bar, i) => setFrame(bar, result[i]));

// ❌ 160-frame sprite sheet = huge file, inflexible
```

### Direct Data Mapping for Related Visuals
When two visual elements represent the same data, they must read from the same source:
```typescript
// ❌ BAD: Derived calculations cause drift
const barFrame = positionPercentage > 80 ? 2 : positionPercentage > 40 ? 1 : 0;
const indicatorFrame = positionPercentage > 80 ? 0 : 2; // Checkmark logic different!

// ✅ GOOD: Single source, direct mapping
const result = TBI_POSITION_RESULTS[positionIndex]; // Frame indices
const barFrame = result[segmentIndex];
const indicatorFrame = result[segmentIndex]; // Same data, different sprite
```

### Sprite-Based UI > Coded Text
Designer controls visual presentation while code stays simple:
```typescript
// ✅ Frame selection based on game state
const backdropFrame = passed ? 2 : 1; // Frame 1=fail message, 2=pass message

// ❌ Dynamic text with styling complexity
<FeedbackText color={passed ? 'green' : 'red'}>{message}</FeedbackText>
```

## EDUCATIONAL UX PATTERNS

### Failed Attempts Loop Back
Educational activities should retry on failure, not exit:
```typescript
const handleComplete = () => {
  if (evaluateTbiPositioning() >= PASS_THRESHOLD) {
    completeActivity();
  } else {
    showFailFeedback();
    setTimeout(() => restartPositioning(), 2000);
  }
};
```

### Animation Sequencing for Pacing
Reveal results after animation completes for maximum impact:
```typescript
// Show base backdrop during mask animation
const backdropFrame = maskFrame < FINAL_MASK_FRAME ? 0 : passFailFrame;

// Pause after mask reveals before showing pass/fail message
if (maskFrame === FINAL_MASK_FRAME) {
  setTimeout(() => setResultRevealed(true), 350);
}
```

### Key Differentiation for Outcomes
Different results use different inputs to reinforce meaning:
```typescript
// X = retry failed attempt, C = complete successful attempt
if (key === 'x' && !tbiResultPassed) restartPositioning();
if (key === 'c' && tbiResultPassed) completeActivity();
```

### Visual Affordances for Progression
Guide players to completed areas with distinct indicators:
```typescript
// Exclamation bubble replaces question bubble after first completion
<SpeechBubble 
  $highlighted={hasCompletedFirstActivity}
  $visible={hasCompletedFirstActivity && currentView === 'home'}
/>
```

## INPUT PROTECTION PATTERNS

### Three-Layered Anti-Mashing Protection
Prevent rapid-fire through educational content:

```typescript
// Layer 1: Cooldown timer between key presses
const INPUT_COOLDOWN = 400;
if (Date.now() - lastKeyTime < INPUT_COOLDOWN) return;

// Layer 2: Phase-based blocking during transitions
const BLOCKED_PHASES = ['fading_to_black', 'transitioning', ...];
if (BLOCKED_PHASES.includes(currentPhase)) return;

// Layer 3: Animation completion gates
if (!tbiResultRevealed) return; // Wait for mask animation + reveal delay
```

### Animation-Locked Input
Block specific inputs during critical animations:
```typescript
// In TBI positioning useEffect (capture phase)
const handleKeyDown = (e: KeyboardEvent) => {
  if (tbiBeamAnimating) {
    e.preventDefault();
    return; // Block arrow keys during beam animation
  }
  // ... normal handling
};
```

### Default Action Pattern
When player presses action key without explicit selection, assume most likely intent:
```typescript
if (key === 'x' && selectedButton < 0) {
  setSelectedButton(0); // Auto-select Play button
  handleButtonPress(0);
}
```

## DIALOGUE PATTERNS

### Remote/Non-Blocking Dialogue
Acknowledge skipped interactions without freezing player:
```typescript
// Trigger once when climbing without talking first
if (tryingToClimb && !picoInteracted && !hasShownRemoteDialogue) {
  triggerRemoteDialogue("I'll hold it down here!");
  setHasShownRemoteDialogue(true);
  // Player continues climbing - not blocked
}
```

### Educational Dialogue Progression
Structure intro dialogues for clarity:
```
1. Character introduction ("Hello! I'm Anthro...")
2. Purpose explanation ("I'm here to help you learn...")
3. Reference handoff ("Here's some info..." + page visual)
4. Task explanation ("Your job is to position...")
5. Controls instruction ("Use arrow keys to move...")
```

### Multi-Line Result Dialogues
Separate state for result dialogue advancement:
```typescript
interface ResultState {
  tbiResultDialogueIndex: number;
  tbiResultPassed: boolean;
}

// X advances fail dialogue, then restarts
// C advances pass dialogue, then completes
```

## ANIMATION PATTERNS

### Two-Phase Playback (Intro + Loop × N)
Play intro once, then loop N times:
```typescript
const animate = () => {
  if (frame < INTRO_END) {
    setFrame(f => f + 1);
    setTimeout(animate, FRAME_MS);
  } else if (loopCount < MAX_LOOPS) {
    if (frame < LOOP_END) {
      setFrame(f => f + 1);
    } else {
      setFrame(LOOP_START);
      setLoopCount(c => c + 1);
    }
    setTimeout(animate, FRAME_MS);
  } else {
    onComplete();
  }
};
```

### Ping-Pong Animation
Seamless back-and-forth without wrap-around frames:
```typescript
let direction = 1;
const update = () => {
  if (frame >= 7) direction = -1;
  if (frame <= 0) direction = 1;
  frame += direction;
};
// 0→7→6→5→4→3→2→1→0→1→2→...
```

### Phase-Based Character Animation
Tie animation phases to dialogue progression:
```typescript
type AnimPhase = 'raising' | 'waving' | 'idle';

// Start with hand raise (frames 8-11)
// After first dialogue: switch to waving (frames 12-15 loop)
// After dialogue index 0: switch to idle (frames 0-7 loop)
```

### CSS Keyframes > Sprite Loops for Simple Effects
Single image with CSS is simpler than sprite sheet for pop/float/fade:
```typescript
// ✅ Single 16×16px image with CSS animation
const HeartFloat = styled.div`
  animation: heartPop 1.2s ease-out forwards;
  @keyframes heartPop {
    0% { transform: scale(0.5); opacity: 1; }
    20% { transform: scale(1); }
    100% { transform: translateY(-20px); opacity: 0; }
  }
`;

// ❌ 4-frame sprite sheet with setInterval
```

## PALETTE SWAPPING PATTERNS

### Canvas-Based Palette Swapping
Exact hex matching works for pixel art (no anti-aliasing):
```typescript
const recolorImage = (img, templatePalette, targetPalette) => {
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);
  const imageData = ctx.getImageData(0, 0, w, h);
  
  for (let i = 0; i < imageData.data.length; i += 4) {
    const hex = rgbToHex(data[i], data[i+1], data[i+2]);
    const templateIndex = templatePalette.indexOf(hex);
    if (templateIndex >= 0) {
      const [r, g, b] = hexToRgb(targetPalette[templateIndex]);
      data[i] = r; data[i+1] = g; data[i+2] = b;
    }
  }
  
  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL();
};
```

### Separate Palettes for Related Features
Hair and facial hair need different template colors:
```typescript
const BASE_PALETTES = {
  hair: ['#10141f', '#151d28', '#394a50', '#577277'], // 4 shades
  facialHair: ['#10141f', '#151d28', '#202e37', '#394a50'], // Darker swappables
};

// Facial hair maps one shade darker for visual realism
const mapFacialHair = (ramp) => [ramp[0], ramp[0], ramp[1]];
```

### Optional 4th Ramp Color
Handle ramps of different lengths:
```typescript
// 4-color: apply shadow to static shade
// 3-color: skip shadow mapping
if (rampColors.length === 4) {
  mappings.push([STATIC_SHADE, rampColors[0]]);
}
mappings.push([SWAPPABLE_1, rampColors.at(-3)]);
mappings.push([SWAPPABLE_2, rampColors.at(-2)]);
mappings.push([SWAPPABLE_3, rampColors.at(-1)]);
```

### Compound Recoloring
Apply multiple palette swaps to one sprite:
```typescript
// Body sprite has both skin regions AND shirt regions
const recolorBody = (img, skinRamp, shirtRamp) => {
  const mappings = [
    ...createSkinMappings(skinRamp),    // Arms, neck
    ...createShirtMappings(shirtRamp),  // Torso clothing
  ];
  return applyMappings(img, mappings);
};
```

## CHARACTER SYSTEM PATTERNS

### Unified Canvas Size
All parts stack at (0,0) with transparency handling overlap:
```typescript
// ✅ All parts: 38×102px canvas
// Parts positioned within canvas at their correct regions
// No per-part positioning needed in code

// ❌ Different sizes per part
// Requires positioning logic, causes alignment bugs
```

### Data-Driven Variant Counts
Update config, not code:
```typescript
const CHARACTER_PARTS = [
  { id: 'hair', variants: 7, backVariants: [1,2,3,4,5,6,7], sideVariants: [1,2,3,4,5,6,7] },
  { id: 'eyes', variants: 6, backVariants: [], sideVariants: [1,2,3,4,5,6] },
];

// Adding new variants: just update the numbers
```

### Body-Linked Parts
Reduce decision paralysis by auto-linking related parts:
```typescript
const cycleVariant = (partId) => {
  if (partId === 'body') {
    // Auto-match legs and shoes to body selection
    setVariant('legs', newVariant);
    setVariant('shoes', newVariant);
  }
  setVariant(partId, newVariant);
};
```

### "Lock to None" Pattern
Respect user preference during randomization:
```typescript
const [lockedToNone, setLockedToNone] = useState<Set<PartId>>(new Set());

const cycleVariant = (partId) => {
  const newVariant = /* ... */;
  if (newVariant === 0) {
    lockedToNone.add(partId); // User chose "None"
  } else {
    lockedToNone.delete(partId);
  }
};

const randomize = () => {
  parts.forEach(part => {
    if (lockedToNone.has(part.id)) return; // Respect lock
    setVariant(part.id, randomVariant());
  });
};
```

## RENDER OPTIMIZATION PATTERNS

### Atomic Render Gating
Prevent template flash during async recoloring:
```typescript
const [isRecoloring, setIsRecoloring] = useState(true);

useEffect(() => {
  setIsRecoloring(true);
  Promise.all(parts.map(recolorPart)).then(() => {
    setIsRecoloring(false);
  });
}, [palette]);

// Gate entire character render, not individual parts
{!isRecoloring && parts.map(renderPart)}
```

### Single Representative Color
Reduce visual overload in color picker:
```typescript
// ❌ Show all 4 ramp colors
{ramp.map(color => <Swatch color={color} />)}

// ✅ Show single representative color
<Swatch color={ramp[Math.floor(ramp.length / 2)]} />
```

## VIEWPORT SCALING PATTERNS

### Mixed Rendering System Coordination
HTML overlays don't inherit PIXI's uniformScale:
```typescript
// PIXI scales to fit 640×360 into viewport
const uniformScale = Math.min(windowWidth / 640, windowHeight / 360);

// HTML overlay must manually match
<HTMLOverlay style={{ transform: `scale(${uniformScale})` }} />
```

### Asymmetric Fade Transitions
Fast exit, slow reveal:
```typescript
// Quick fade to black (responsive exit)
fadeToBlack({ duration: 800 });

// Slow fade from black (builds anticipation)
fadeFromBlack({ duration: 1500 });
```

## BROWSER QUIRKS

### Global CSS for Persistent Behaviors
React-managed cursor: none fails on window re-entry:
```css
/* In globals.css - cannot be overridden by browser quirks */
* {
  cursor: none !important;
}
```

### Declaration Order in React
useEffects must come after useCallbacks they reference:
```typescript
// ❌ ReferenceError: Cannot access before initialization
useEffect(() => { cycleVariant(); }, []);
const cycleVariant = useCallback(() => {}, []);

// ✅ Correct order
const cycleVariant = useCallback(() => {}, []);
useEffect(() => { cycleVariant(); }, []);
```

### Early Return for Blocking State
Prevent movement in same frame as state change:
```typescript
if (tryingToClimb && !picoInteracted) {
  onClimbBlocked(); // Async state update
  return currentPos; // Block movement THIS frame, don't wait for re-render
}
```

## KEY PRINCIPLES

1. **Motion > brightness** for attention grabbing
2. **User-controlled > automatic** (manual dismissal feels intentional)
3. **Simplicity > complexity** (simpler solution usually right)
4. **Native dimensions > manual scaling**
5. **Event-driven > tight coupling**
6. **Single-zone interactions > two-zone proximity hints**
7. **One-way progression flags > cyclical state toggles**
8. **Refs for interval state access > deps that recreate intervals**
9. **Horizontal-only distance > 2D Euclidean for same-floor interactions**
10. **Single consolidated backgrounds > layered parallax when static works**
11. **Modular sprites + lookup tables > pre-baked animations**
12. **Same data source for related visuals > derived calculations**
13. **Sprite-based UI > coded text for designer control**
14. **Retry on failure > exit for educational activities**
15. **CSS keyframes > sprite loops for simple effects**
16. **Unified canvas size > per-part dimensions for layered characters**
17. **Atomic render gating > per-element loading for palette swaps**