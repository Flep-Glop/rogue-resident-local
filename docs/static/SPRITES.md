# 🎨 ROGUE RESIDENT SPRITES
*Complete sprite specifications and locations organized by component*

## STANDARD PATTERNS

### Button Sprites
- **Standard size:** 178×18px (89×18 per frame, 2 frames)
- **Location:** `/public/images/ui/buttons/`

### Character Portraits
- **Detailed:** 113×161px
- **Emblems:** 64×64px
- **Location:** `/public/images/characters/`

### UI Containers (9-Slice System)
- **Question:** 240×80px
- **Answer:** 60×35px
- **Toast:** 60×24px
- **Card:** 120×60px
- **Location:** `/public/images/ui/containers/`

### Icons
- **Standard:** 22×22px
- **Location:** `/public/images/ui/icons/`

## COMPONENT SPRITES

### TitleScreen.tsx
**Backgrounds & Title**
- `title-background.png`: 3400×360px (scrolling, 640×360 viewport)
- `title-sprite.png`: 246×90px

**Interactive Buttons** (2-frame sprites)
- `play-button.png`: 178×18px (89×18 per frame)
- `test-button.png`: 178×18px
- `whats-new-button.png`: 178×18px

### HomeScene.tsx
**Scene Background**
- `home.png`: 285×160px

### NarrativeDialogue.tsx
**Character Portraits**
- `quinn-detailed.png`: 113×161px
- `quinn-title.png`: 147×26px

**UI Icons & Cards**
- `book-icon.png`: 22×22px
- `card-laser-focus.png`: Ability card front
- `card-back-orange.png`: Ability card back

**Backgrounds**
- `physics-office-blur.png`: 640×360px

### QuinnTutorialActivity.tsx
**Character Emblems**
- `quinn-medium-emblem.png`: 64×64px

**Progress Bars** (large sprite sheets)
- `star-bar.png`: 11826×40px (81 frames × 146px each)
- `momentum-combo.png`: 594×155px (11 frames × 54px each)
- `insight-combo.png`: 4374×155px (81 frames × 54px each)

**Container Elements**
- `ability-panel-container.png`: 90×240px
- `ability-slot.png`: 58×58px

### HospitalBackdrop.tsx (World Coordinates)
**Main Hospital**
- `hospital-isometric-base.png`: 640×360px (scaled 3x for world)

**Animated Creatures**
- **Birds:** 4 frames each
  - `birds.png`, `birds-two.png`, `birds-three.png`
- **Deer:** `deer.png` 96×24px, 4 frames
- **People:** `quinn-walking.png` 2 frames

**Weather Particles**
- **Rain:** `rain-drop.png` 3 frames
- **Storm:** `rain-heavy.png` 4 frames
- **Snow:** `snowflake-small.png`, `snowflake-large.png` 4 frames
- **Fog:** `mist-wisp.png` 2 frames, `fog-patch.png` 3 frames

**Pond Elements**
- **Ripples:**
  - `ripple-small.png`: 64×16px, 4 frames
  - `ripple-medium.png`: 96×24px, 4 frames
  - `ripple-storm.png`: 160×32px, 5 frames
- **Sparkles:** `water-sparkle.png` 24×8px, 3 frames

**Environment**
- **Trees:** 32×48px to 48×64px
- **Bushes:** 32×16px, 2 frames
- **Grass:** 14×18px average

**Fish**
- **Small:** 36×12px, 3 frames
- **Koi:** 64×16px, 4 frames

## SPRITE CREATION GUIDELINES

### For New Sprites
When creating new sprites, provide these specifications to Aseprite:

**Characters:**
- Portraits: 113×161px, single frame
- Emblems: 64×64px, single frame
- Upload to: `/public/images/characters/[name]/`

**UI Elements:**
- Buttons: 178×18px, 2 frames horizontal
- Icons: 22×22px, single frame
- Upload to: `/public/images/ui/[type]/`

**Animations:**
- Ambient creatures: 2-5 frames, 16×16px to 96×24px
- Weather effects: 3-4 frames, varies by effect
- Upload to: `/public/images/environment/[category]/`

**Progress Bars:**
- Height: 40-155px
- Frames: Based on progression (11 for basic, 81 for detailed)
- Upload to: `/public/images/ui/progress/`

## FILE ORGANIZATION

```
/public/images/
├── characters/
│   ├── quinn/
│   ├── kapoor/
│   └── jesse/
├── ui/
│   ├── buttons/
│   ├── containers/
│   ├── icons/
│   └── progress/
├── environment/
│   ├── weather/
│   ├── creatures/
│   └── vegetation/
├── backgrounds/
│   ├── scenes/
│   └── offices/
└── abilities/
    └── cards/
```

## CRITICAL REMINDERS

1. **Always use native dimensions** - no scaling in code
2. **Frames read left-to-right** in sprite sheets
3. **Use power-of-2 dimensions** when possible for GPU optimization
4. **Test sprites at 1x, 2x, and 3x scale** for different screen sizes
5. **Keep consistent padding** between frames (usually 0px for tight sheets)