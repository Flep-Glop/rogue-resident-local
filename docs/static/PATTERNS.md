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
  border-image: url('/images/ui/containers/question-9slice.png') 20 fill;
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

## KEY PRINCIPLES

1. **Motion > brightness** for attention grabbing
2. **User-controlled > automatic** (manual dismissal feels intentional)
3. **Simplicity > complexity** (simpler solution usually right)
4. **Native dimensions > manual scaling**
5. **Event-driven > tight coupling**