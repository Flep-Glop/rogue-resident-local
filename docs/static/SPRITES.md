# 🎨 THE OBSERVATORY SPRITES
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
**Backgrounds & Layers** (11-layer composite system)
- `title-screen-background.png`: 640×360px (consolidated static background)
- `title-screen-clouds-1.png`: 8 frames, horizontal (far layer, slowest parallax)
- `title-screen-clouds-2.png`: 8 frames, horizontal (mid layer, medium parallax)
- `title-screen-clouds-3.png`: 8 frames, horizontal (near layer, fastest parallax)
- `title-screen-abyss.png`: Atmospheric depth layer
- `title-screen-shooting-star.png`: Shooting star animation (4 instances with staggered timing)
- `title-screen-vignette.png`: Static darkening overlay (separated from title)
- `title-screen-title.png`: "THE OBSERVATORY" title text (translates in dev mode)
- `title-screen-shine.png`: Celebration effect (triggers at intro end + sporadic)

**Splash Screen Logos**
- `questrium.png`: 36 frames, 8640×120 (240×120 per frame, animated logo)
- `camp-logo.png`: Static, 244×73

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
  - Frames 9-11: "Character Creator" (normal/highlighted/selected)

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

**Comp-Sheet Composite Layers** (all 300×180px per frame unless noted)
- `comp-monitor.png`: Monitor frame with black fill (300×180) - base layer
- `comp-screen-blue.png`: Screen color for home menu (300×180) - overlays monitor
- `comp-screen-dark.png`: Screen color for TBI activity (300×180) - overlays monitor
- `comp-tabs.png`: 8 frames, 2400×180 (tab selection + highlight + shop lock states)
- `comp-activity-option-popups-sheet.png`: 7 frames, 2100×180 (frame 1: none, 2-6: highlights, 7: pressed)
- `comp-activity-options.png`: static, 300×180 (activity options content layer)
- `comp-shop.png`: Shop base layer (300×180)
- `comp-shop-options.png`: Shop items layer (300×180)
- `comp-shop-option-popups-sheet.png`: 4 frames, 1200×180 (frame 1: none, 2-4: item highlights)

**Anthro Intro System**
- `anthro-intro.png`: 16 frames, 4800×180 (frames 0-7: idle, 8-11: hand raise, 12-15: wave loop)

**TBI Positioning System** (modular sprites)
- `tbi-positioning-background.png`: Static background (300×180)
- `tbi-positioning-anthro.png`: 8 frames, 248×90 (31×90 per frame, idle animation during positioning)
- `tbi-beam-sheet.png`: 11 frames, 3300×180 (beam activation: frames 0-4 intro, 5-10 loop)
- `left-right-arrow-keys.png`: 6 frames, 198×17 (33×17 per frame, input indicators)

**TBI Result System** (modular sprite composition)
- `tbi-positioning-result-base.png`: Container frame (65×75) - z:311
- `tbi-positioning-result-anthro.png`: Anthro body (65×75) - z:313
- `tbi-bar-red.png` / `tbi-bar-yellow.png` / `tbi-bar-green.png`: Color bars (51×7-8px each)
- `position-indicators.png`: 3 frames, 15×3 (5×3 per frame: X, tilde, checkmark)
- `tbi-mask.png`: 11 frames, 671×72 (61×72 per frame, reveal animation)

**Character Sprites**
- `/images/characters/sprites/kapoor-home.png`: 38×102px × 38 frames (idle: 0-15, walk: 16-31, climb: 32-37) - Default player sprite when no custom character created
- `/images/characters/sprites/pico.png`: ~21px tall × 60 frames (idle: 0-29, talking: 30-59)

**Player Character Sprite System** (generated via compositor)
- Canvas: 38×102px per frame
- Total frames: 38
- Frame layout:
  - 0-3: Front idle (4 frames breathing)
  - 4-7: Back idle (4 frames breathing)
  - 8-11: Right idle (4 frames breathing)
  - 12-15: Left idle (4 frames breathing)
  - 16-23: Right walk (8 frames cycle)
  - 24-31: Left walk (8 frames cycle)
  - 32-37: Climb (6 frames alternating)

**Character Part Sprites** (38×102px unified canvas)
Location: `/public/images/characters/`
Naming convention: `{part}-{variant}[-{direction}][-{anim}].png`

| Part | Variants | Directions | Walk Frames | Climb Frames |
|------|----------|------------|-------------|--------------|
| body | 2 | front, back, left, right | - | c1, c2 |
| legs | 2 | front, back, left, right | w1-w4 | c1 |
| shoes | 2 | front, back, left, right | w1-w4 | c1 |
| ears | 3 | front, back, left, right | - | - |
| face | 2 | front, back, left, right | - | - |
| nose | 2 | front, left, right | - | - |
| eyes | 6 | front, left, right | - | - |
| eyebrows | 3 | front, left, right | - | - |
| mouth | 3 | front, left, right | - | - |
| facial-hair | 3 | front, left, right | - | - |
| hair | 7 | front, back, left, right | - | - |
| extras | 3 | front, back, left, right | - | - |

Example filenames:
- `body-1.png` (front)
- `body-1-back.png`
- `body-1-left.png` / `body-1-right.png`
- `body-1-back-c1.png` / `body-1-back-c2.png` (climb poses)
- `legs-1-left-w1.png` through `legs-1-left-w4.png` (walk frames)

**Speech Bubbles**
- `speech-bubble.png`: ~20×20px × 8 frames (1-4: normal, 5-8: highlighted)

**Key Indicators**
- `x-key.png`: 60×16px × 4 frames (1: default, 2: hover, 3: highlighted, 4: pressed)
- `c-key.png`: 60×16px × 4 frames (same pattern)
- `up-arrow-key.png`: 15×16px × 4 frames
- `down-arrow-key.png`: 15×16px × 4 frames
- `arrow-keys.png`: 48×32px × 8 frames (movement tutorial)
- `left-right-arrow-keys.png`: 198×17 (33×17 per frame × 6 frames, TBI positioning controls)

**Feedback Effects**
- `heart.png`: 16×16px (single frame, used with CSS keyframe animation for floating effect)

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
├── characters/           # Character creator part sprites
│   ├── body-*.png        # Body variants and directions
│   ├── legs-*.png        # Leg variants, directions, walk frames
│   ├── shoes-*.png       # Shoe variants, directions, walk frames
│   ├── hair-*.png        # Hair variants and directions
│   ├── face-*.png        # Face variants and directions
│   ├── eyes-*.png        # Eye variants (front/side only)
│   ├── ...               # Other facial features
│   └── sprites/          # Pre-built character sprite sheets
│       ├── kapoor-home.png
│       └── pico.png
├── home/                 # Home scene assets
│   ├── comp-*.png        # Computer interface layers
│   ├── tbi-*.png         # TBI activity sprites
│   └── anthro-*.png      # Anthro character sprites
├── hospital/
│   └── backgrounds/      # Hospital room backgrounds
├── journal/              # Journal UI assets
├── title/                # Title screen assets
│   ├── title-screen-*.png  # Background layers
│   ├── *-button.png      # Menu buttons
│   ├── questrium.png     # Animated logo
│   └── camp-logo.png     # Static logo
├── ui/
│   ├── buttons/
│   ├── containers/
│   └── icons/
├── ambient/              # Ambient effects
├── audio/                # Audio files
│   └── voiceover/        # Character voiceover files
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

## ASEPRITE EXPORT PIPELINE

### Character Sprite Export Script
Lua script for batch-exporting character parts with directional variants:

**Frame organization in Aseprite:**
- Frame 1: Front-facing
- Frame 2: Back-facing
- Frame 3: Right-facing (auto-mirrors to left)
- Frames 4-7: Walk cycle (right, auto-mirrors to left)
- Frames 8-9: Climb poses (back-facing)

**Output naming:**
```
{layername}.png           # Frame 1 (front)
{layername}-back.png      # Frame 2
{layername}-right.png     # Frame 3
{layername}-left.png      # Frame 3 horizontally flipped
{layername}-right-w1.png  # Frame 4 (walk)
{layername}-left-w1.png   # Frame 4 flipped
...
{layername}-back-c1.png   # Frame 8 (climb)
{layername}-back-c2.png   # Frame 9 (climb)
```

**Script location:** `File → Scripts → Open Scripts Folder`

### Key Insights
- Use `sprite:saveCopyAs()` carefully - may not respect `app.activeFrame`
- Safer approach: get cel directly, create temp sprite, export temp sprite
- Recursive `collectLayers()` function needed for nested layer groups

## CRITICAL REMINDERS

1. **Always use native dimensions** - no scaling in code
2. **Frames read left-to-right** in sprite sheets
3. **Use power-of-2 dimensions** when possible for GPU optimization
4. **Test sprites at 1x, 2x, and 3x scale** for different screen sizes
5. **Keep consistent padding** between frames (usually 0px for tight sheets)
6. **0-indexed vs 1-indexed** - check sheet convention before calculating positions
7. **9-slice requires separate files** - cannot slice subsections of sprite sheets
8. **Container aspect-ratio must match frame dimensions** - prevents truncation/squishing
9. **Unified canvas size** for layered character systems (38×102px for full body)
10. **Direction suffixes** follow pattern: none=front, -back, -left, -right, -w1 through -w4, -c1/-c2
