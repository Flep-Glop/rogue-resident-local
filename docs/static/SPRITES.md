# 🎨 ROGUE RESIDENT SPRITES
*Complete sprite specifications and locations organized by component*

## STANDARD PATTERNS

### Button Sprites
- **Standard size:** 178×18px (89×18 per frame, 2 frames)
- **Location:** `/public/images/ui/buttons/`

### UI Containers (9-Slice System)
- **Window:** 240×80px, slice: `20 40 20 40 fill` (20px vertical, 40px horizontal borders)
- **Answer Default:** 60×35px, slice: `10 10 10 10 fill`
- **Answer Hover:** 60×35px (separate file for 9-slice compatibility)
- **Answer Selected:** 60×35px (separate file for 9-slice compatibility)
- **Toast:** 60×24px
- **Card:** 120×60px
- **Location:** `/public/images/ui/containers/`

**Note:** Border-image 9-slice cannot slice sprite sheets - use separate files per state.

### Icons
- **Standard:** 22×22px
- **Location:** `/public/images/ui/icons/`

## COMPONENT SPRITES

### TitleScreen.tsx
**Backgrounds & Title**
- `title-screen-background.png`: 640×360px (consolidated background, replaces separate cloud layers)
- `title-screen-title.png`: Title sprite

**Interactive Buttons** (3-frame sprites: normal/highlighted/selected)
- `play-button.png`: 261×18px (87×18 per frame × 3 frames)
- `dev-mode-button.png`: 261×18px (87×18 per frame × 3 frames)
- `whats-new-button.png`: 261×18px (87×18 per frame × 3 frames)
- `test-button.png`: 261×18px (87×18 per frame × 3 frames)

**Debug Grid Icons**
- `debug-icons.png`: 672×53px (56×53 per frame × 12 frames)
  - Frames 0-2: "Before Desk" (normal/highlighted/selected)
  - Frames 3-5: "Before Cutscene" (normal/highlighted/selected)
  - Frames 6-8: "After Cutscene" (normal/highlighted/selected)
  - Frames 9-11: "Planetary Systems" (normal/highlighted/selected)

### CombinedHomeScene.tsx
**Scene Background**
- `home.png`: 285×160px
- `home-combo.png`: Combined home scene
- `home-sky-combo.png`: 640×585px (sky view background)
- `abyss.png`: 640×585px (atmospheric layer)
- `purple-abyss.png`: 640×585px (composite with abyss)

**Interactive Elements**
- `telescope-sheet.png`: 640×585px × 2 frames (1280×585 total)
- `star-sheet.png`: 14×14px × 40 frames (1-indexed, frames 1-40)
- `planetary-sheet.png`: 14×14px × 96 frames (0-indexed, organized as 8 sets × 3 types × 4 sections)

**Comp-Sheet Composite Layers** (all 300×180px per frame)
- `comp-monitor.png`: Monitor frame with black fill (300×180) - base layer
- `comp-screen-blue.png`: Screen color for home menu (300×180) - overlays monitor
- `comp-screen-dark.png`: Screen color for TBI activity (300×180) - overlays monitor
- `comp-activity.png`: Static content layer (300×180)
- `comp-activity-options-sheet.png`: 7 frames, 2100×180 (frame 1: none, 2-6: highlights, 7: pressed)
- `comp-activity-option1-sheet.png`: 5 frames, 1500×180 (autonomous thinking animation)
- `anthro-intro.png`: 4 frames, 1200×180 (dialogue sequence before TBI activity)
- `tbi-positioning.png`: 16 frames, 4800×180 (TBI patient positioning - left/right arrow navigation)
- `tbi-positioning-result.png`: 13 frames, 3900×180 (result animation - frames 0-10 auto-play at 500ms, frame 11 final)

**Character Sprites**
- `/images/characters/sprites/kapoor-home.png`: 38×102px × 38 frames (idle: 1-16, walk: 17-32, climb: 33-38)
- `/images/characters/sprites/pico.png`: ~21px tall × 60 frames (idle: 0-29, talking: 30-59)

**Speech Bubbles**
- `speech-bubble.png`: ~20×20px × 8 frames (1-4: normal, 5-8: highlighted)

**Key Indicators**
- `x-key.png`: 60×16px × 4 frames (1: default, 2: hover, 3: highlighted, 4: pressed)
- `c-key.png`: 60×16px × 4 frames (same pattern)
- `up-arrow-key.png`: 15×16px × 4 frames
- `down-arrow-key.png`: 15×16px × 4 frames
- `arrow-keys.png`: 48×32px × 8 frames (movement tutorial)

### Hospital Backgrounds
**Room Backgrounds** (640×360px)
- `physics-office-blur.png`: Physics office scene
- `linac-room.png`: Linac room scene
- `labratory-background.png`: Laboratory background
- `labratory-foreground.png`: Laboratory foreground layer
- `ct sim.png`: CT simulation room

## SPRITE CREATION GUIDELINES

### For New Sprites
When creating new sprites, provide these specifications to Aseprite:

**UI Elements:**
- Buttons: 178×18px, 2 frames horizontal
- Icons: 22×22px, single frame
- Upload to: `/public/images/ui/[type]/`

**Animations:**
- Ambient creatures: 2-5 frames, 16×16px to 96×24px
- Weather effects: 3-4 frames, varies by effect
- Upload to: `/public/images/[category]/`

**Progress Bars:**
- Height: 40-155px
- Frames: Based on progression (11 for basic, 81 for detailed)
- Upload to: `/public/images/ui/progress/`

## FILE ORGANIZATION

```
/public/images/
├── cards/                # Ability card images
├── characters/
│   └── sprites/          # Character sprite sheets
├── home/                 # Home scene assets
├── hospital/
│   └── backgrounds/      # Hospital room backgrounds
├── journal/              # Journal UI assets
├── title/                # Title screen assets
├── ui/
│   ├── buttons/
│   ├── containers/
│   └── icons/
├── ambient/              # Ambient effects
└── weather/              # Weather particles
```

## SPRITE SHEET ORGANIZATION

### Planetary Sheet (96 frames)
Organized as sections for easy frame calculation:
```
Section 0 (frames 0-23):  Default sprites
Section 1 (frames 24-47): Highlighted sprites (+24 offset)
Section 2 (frames 48-71): Modal crisp layer (+48 offset)
Section 3 (frames 72-95): Modal highlighted (+72 offset)

Within each section (24 frames):
- 8 sets × 3 types (planet, moon, small moon)
- Frame = (section × 24) + (setIndex × 3) + typeIndex
```

### Star Sheet (40 frames, 1-indexed)
```
Frames 1-4:   Base idle
Frames 5-10:  State variants
Frames 11-13: Highlighted sparkle (+9 from base)
Frames 14-19: State variants highlighted
```

## SPRITE SHEET RENDERING

### Aspect Ratio Container Pattern
For background sprite sheets, container aspect ratio **must** match individual frame dimensions:

```css
/* ❌ BAD: Using auto height causes truncation/squishing */
.sprite-container {
  width: 100%;
  height: 100%;
  background: url('debug-icons.png');
  background-size: 1200% 100%;  /* 12 frames */
}

/* ✅ GOOD: Aspect ratio preserves frame dimensions */
.sprite-container {
  width: 100%;
  aspect-ratio: 56 / 53;  /* Matches individual frame: 56px × 53px */
  background: url('debug-icons.png');
  background-size: 1200% 100%;  /* 12 frames */
  background-position: calc(-100% * frameIndex / 11) 0;  /* Divide by (frames - 1) */
}
```

**Why:** Using `height: 100%` or `auto` without matching aspect ratio causes the sprite to stretch or truncate, distorting the pixel art.

### Background Position Calculation
```typescript
// For N frames in a horizontal sprite sheet:
const backgroundSize = `${N * 100}% 100%`;
const backgroundPosition = `${frameIndex * -frameWidth}px 0`;

// OR using percentage (divide by N-1, not N):
const backgroundPosition = `calc(-100% * ${frameIndex} / ${N - 1}) 0`;
```

## CRITICAL REMINDERS

1. **Always use native dimensions** - no scaling in code
2. **Frames read left-to-right** in sprite sheets
3. **Use power-of-2 dimensions** when possible for GPU optimization
4. **Test sprites at 1x, 2x, and 3x scale** for different screen sizes
5. **Keep consistent padding** between frames (usually 0px for tight sheets)
6. **0-indexed vs 1-indexed** - check sheet convention before calculating positions
7. **9-slice requires separate files** - cannot slice subsections of sprite sheets
8. **Container aspect-ratio must match frame dimensions** - prevents truncation/squishing
