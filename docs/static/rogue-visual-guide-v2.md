# Rogue Resident Visual Development Guide
## Surgical Hybrid Approach: PixiJS + React

*Last Updated: January 2025*
*Decision: Surgical Hybrid Architecture - Strategic PixiJS for Visual Magic, React/CSS for UI*
*Status: Core visual systems proven, architectural patterns established*

---

## 🎯 Executive Summary for AI Collaborators

**The Approach:** We use PixiJS strategically for self-contained visual effects and CSS/React for UI animations. This is a deliberate architectural decision based on extensive testing and real-world constraints.

**Why This Matters:** We're creating a game that competes on visual quality with entertainment products, not just educational tools. The extra visual polish from PixiJS creates genuine differentiation in the medical education market.

**Key Constraint:** React and PixiJS don't play well together when tightly coupled. We work WITH this constraint, not against it.

---

## 🚨 Critical Context: The Journey to This Architecture

### The Failed Attempts
1. **@pixi/react v7** - Incompatible with React 19's internal APIs
2. **@pixi/react v8** - Released March 2025 for React 19, but has critical PNG loading bugs (5+ hours attempting basic sprite loading failed)
3. **Complex state coupling** - Patient card animation attempt revealed fundamental React-PixiJS conflicts

### The Successes
1. **Constellation System** - Magical interactive starfield with 80+ effects
2. **Day-Night Transitions** - Smooth atmospheric changes
3. **Hospital Scene** - Complex isometric navigation

**The Pattern:** PixiJS succeeds when it's self-contained. It fails when tightly coupled to React state.

---

## 🎨 Our Creative Vision (Why CSS Alone Isn't Enough)

**Target Quality:** Dave the Diver level visual polish
- Not just functional, but genuinely beautiful
- Creates emotional connection with users
- Differentiates from typical educational software

**What PixiJS Enables:**
- Hundreds of simultaneous particles with physics
- GPU-accelerated effects
- Dynamic lighting and atmospheric effects
- Professional game-quality visuals

**The Trade-off:** More complex development for significantly better visual results. This is acceptable because all coding is done by AI assistants.

---

## 🔧 The Surgical Hybrid Architecture

### When to Use PixiJS (Visual Magic Layer)

**Use PixiJS when:**
- ✅ **Self-contained visual effects** (particles, backgrounds, transitions)
- ✅ **Hundreds of animated elements** (constellation stars, particle systems)
- ✅ **Fire-and-forget animations** (triggered by events, runs independently)
- ✅ **Atmospheric effects** (lighting, fog, visual ambiance)
- ✅ **Performance-critical graphics** (60fps smooth animations)

**Examples:**
- Background constellation visualization
- Particle explosions when cards appear
- Day/night atmospheric transitions
- Scene-to-scene transitions
- Visual celebration effects

### When to Use CSS/React (UI Interaction Layer)

**Use CSS when:**
- ✅ **UI element animations** (cards sliding, buttons hovering)
- ✅ **Tightly coupled to React state** (show/hide based on game state)
- ✅ **User input elements** (forms, clickable cards, menus)
- ✅ **Simple transitions** (fade in/out, slide, scale)
- ✅ **Frequent state updates** (health bars, progress indicators)

**Examples:**
- Card reveal animations
- Menu transitions
- Button interactions
- Form validations
- UI element positioning

---

## 🎯 The Decision Framework (Simple Version)

**Ask yourself:** *"Does this animation need to frequently read or update React state?"*

- **YES** → Use CSS/React
- **NO** → PixiJS could work

**Alternative question:** *"Does this feel like game graphics or website behavior?"*

- **Game graphics** → PixiJS
- **Website behavior** → CSS/React

---

## 💻 Implementation Patterns That Work

### Pattern 1: Event-Driven Effects
```typescript
// React fires simple event
eventBus.emit('card-appeared', { x: 100, y: 200 });

// PixiJS listens and creates effect
eventBus.on('card-appeared', (data) => {
  createParticleExplosion(data.x, data.y);
  // Effect runs independently, cleans itself up
});
```

### Pattern 2: Canvas Overlay Architecture
```typescript
// React handles all UI
<div className="game-ui">
  <Card onClick={handleClick} />
</div>

// PixiJS provides visual layer underneath or on top
<PixiCanvas className="visual-effects-layer" />
```

### Pattern 3: State Machine Handoffs
```typescript
// Good: Clear handoff points
React: "Start transition" → PixiJS: "Animate" → PixiJS: "Done" → React: "Update state"

// Bad: Continuous state syncing
React state changes → PixiJS updates → React state changes → PixiJS updates → 💥
```

---

## 🌟 Proven Implementations

### ✅ Constellation System (Pure PixiJS Magic)
- 80 dynamic stars with parallax
- Mouse-responsive interactions
- Multiple visual filters
- Particle trails and effects
- **Why it works:** Self-contained, event-driven, minimal React coupling

### ✅ Day-Night Transition (Clean Handoff)
- React triggers transition event
- PixiJS handles entire 3-second animation
- Single callback when complete
- **Why it works:** Fire-and-forget pattern, clear lifecycle

### ❌ Patient Card Animation (Failed Attempt)
- Multi-phase animation with React state dependencies
- Complex UI handoff from PixiJS to React
- Race conditions and state conflicts
- **Why it failed:** Too much state coupling, fighting both libraries' paradigms

---

## 🛠️ Technical Guidelines

### PixiJS v8 Specifics
```typescript
// Modern API (use this)
graphics.circle(0, 0, radius);
graphics.fill({ color: 0xffffff });

// Old API (avoid - causes warnings)
graphics.beginFill(0xffffff);
graphics.drawCircle(0, 0, radius);
```

### React Integration Template
```typescript
const PixiEffect: React.FC<{ onComplete?: () => void }> = ({ onComplete }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    let isMounted = true;
    const app = new PIXI.Application();
    
    app.init({ /* config */ }).then(() => {
      if (!isMounted) {
        app.destroy(true, true);
        return;
      }
      
      // Your effect here
      
      // Clean completion
      if (onComplete) {
        setTimeout(onComplete, 3000); // After animation
      }
    });
    
    return () => {
      isMounted = false;
      app.destroy(true, true);
    };
  }, []);
  
  return <div ref={containerRef} className="pixi-container" />;
};
```

---

## 🎮 Current Architecture Decisions

### What We're Building With PixiJS
1. **Knowledge Constellation** - Interactive star visualization
2. **Atmospheric Effects** - Weather, lighting, ambiance
3. **Scene Transitions** - Beautiful room-to-room movements
4. **Celebration Effects** - Particle systems for achievements
5. **Background Animations** - Living, breathing environments

### What We're Building With CSS/React
1. **Card Systems** - All UI cards and their animations
2. **Menus & Navigation** - All interactive UI elements
3. **Form Interactions** - Questions, inputs, selections
4. **Progress Indicators** - Health bars, timers, scores
5. **Dialogue Systems** - Character conversations and choices

---

## 💡 Lessons Learned

### What Causes Pain
- **Tight state coupling** between React and PixiJS
- **Multi-phase animations** requiring state coordination
- **Fast-refresh during development** (have restart patterns ready)
- **Complex handoffs** between PixiJS and React components

### What Creates Magic
- **Self-contained effects** that run independently
- **Event-driven communication** (fire and forget)
- **Clear separation of concerns** (PixiJS for graphics, React for UI)
- **Respecting each library's strengths** instead of fighting them

---

## 🚀 Future Considerations

### If @pixi/react Gets Fixed
We can gradually expand PixiJS usage, but the architectural patterns we've established (event-driven, self-contained effects) will remain valuable.

### Scaling the Approach
As we add more visual effects, maintain the discipline:
- Keep effects self-contained
- Use events, not state coupling
- When in doubt, prototype quickly to test the pattern

### Performance Monitoring
- PixiJS effects should enhance, not hinder performance
- Monitor memory usage with particle systems
- Clean up effects properly

---

## 📝 For AI Assistants Working on This Project

### Key Principles
1. **Don't suggest @pixi/react** - we know about v8, it has PNG loading bugs
2. **Respect the hybrid architecture** - it's a deliberate choice, not a compromise
3. **Visual quality matters** - this is creative expression, not just functionality
4. **Keep PixiJS uses surgical** - self-contained effects, not UI management
5. **Event-driven is the way** - avoid tight state coupling

### When Implementing New Features
1. **First ask:** Is this UI behavior or visual magic?
2. **If visual:** Can it be self-contained with simple event triggers?
3. **If UI:** Use React/CSS and consider PixiJS only for enhancement effects
4. **Test the coupling:** If you need lots of state syncing, reconsider the approach

### Common Pitfalls to Avoid
- Don't try to manage React component positions with PixiJS
- Don't create complex state machines between React and PixiJS
- Don't assume PixiJS can easily become React UI (the handoff is complex)
- Don't overestimate AI code generation for complex integration patterns

---

## 🎯 The Bottom Line

We use PixiJS where it creates genuine visual magic that CSS cannot achieve. We use React/CSS for everything else. This surgical approach gives us the best of both worlds: stunning visuals where they matter most, and reliable UI development everywhere else.

The constellation system stands as proof that this architecture works. When we respect the boundaries between these technologies, we can create truly magical experiences.

**Remember:** We're not building another forgettable educational game. We're creating an experience that happens to teach.

---

*"The wisdom lies in the choice, not just the implementation."*