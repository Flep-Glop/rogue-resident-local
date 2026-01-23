# 📝 DEVELOPMENT LOG
*Linear session tracking - wiped and integrated into core docs periodically*

---

<!-- 
TEMPLATE FOR NEW ENTRIES:

## Entry #[NUMBER]
**Focus:** [Primary goal or feature being built/fixed]
**Smooth:** [What worked well, successful patterns used]
**Friction:** [Challenges encountered and their solutions]
**Insight:** [Key learning to carry forward]

GUIDELINES:
- Keep entries concise and actionable
- Focus on patterns and solutions, not detailed implementation
- Note architectural decisions that might affect future work
- Flag any discoveries that should migrate to core docs
- No dates, no time estimates, no complexity assessments
- Number entries sequentially regardless of gaps between sessions
-->

## MIGRATION LOG
*Completed migrations from Entries #001-#193 (Jan 2025)*

### Migrated to PATTERNS.md ✅
- Priority-based X/C key handler chains
- Stale closure prevention (useEffect dependencies)
- Event capture phase for priority
- Single-zone vs two-zone interactions
- Ref-based state access for intervals
- Recursive setTimeout for variable timing
- Desynchronized multi-element animations
- Spatial navigation with dot product algorithm
- 3D orbital illusion techniques
- Player-following interaction prompts
- Speech bubble indicator patterns
- Progressive UI affordance removal
- One-way vs cyclical progression flags
- Progressive dialogue systems
- Tutorial gates
- Overflow hidden at every level
- CSS stacking context isolation
- Border-image 9-slice limitations
- Visual debugging patterns
- Sprite system resize order
- Feature replacement grep strategy
- Horizontal-only vs 2D Euclidean distance
- Hybrid mouse/keyboard input mode switching
- State consolidation process (5 steps)
- Hook extraction with actions pattern
- Callback-based hooks for cross-cutting concerns
- **NEW (#136-#193):**
  - Modular sprite composition > pre-baked animations
  - Direct data mapping for related visuals
  - Sprite-based UI > coded text
  - Educational UX: failed attempts loop back
  - Animation sequencing for educational pacing
  - Key differentiation for pass/fail outcomes
  - Visual affordances for returning to completed areas
  - Three-layered anti-mashing protection
  - Animation-locked input blocking
  - Default action pattern for accessibility
  - Remote/non-blocking dialogue pattern
  - Two-phase animation playback (intro + loop × N)
  - Ping-pong animation for seamless looping
  - Phase-based character animation tied to dialogue
  - CSS keyframes > sprite loops for simple effects
  - Canvas-based palette swapping for pixel art
  - Separate palettes for related-but-distinct features
  - Optional 4th ramp color with array length checking
  - Compound recoloring (multiple palette swaps)
  - Unified canvas size for layered characters
  - Data-driven variant counts
  - Body-linked parts for UX simplification
  - "Lock to none" pattern for randomization
  - Atomic render gating for palette swaps
  - Single representative color for ramp UI
  - Mixed rendering system scaling coordination
  - Asymmetric fade transitions
  - Global CSS for persistent browser behaviors
  - Declaration order in React (useCallback before useEffect)
  - Early return for blocking state changes

### Migrated to ARCHITECTURE.md ✅
- Parallax multi-container architecture
- Layer group system
- Dynamic z-index elevation
- Parent-child orbital architecture
- Composite layer systems
- Dual sprite sheet systems
- Camera translation pattern
- Component consistency for transitions
- Phase-based state machines
- Dynamic color overlay pattern
- Bi-directional fade transitions with shared base layer
- Transition chain timing patterns
- **NEW (#136-#193):**
  - Modular sprite composition with lookup tables
  - Title screen 11-layer composite system
  - Ping-pong animation pattern
  - Parallax depth ratios
  - Character creator unified canvas architecture
  - Direction-dependent z-index
  - Programmatic layer animation (breathing)
  - Sprite sheet compositor pipeline
  - Graceful fallback for missing sprites
  - Tab-based navigation system
  - Audio system 4-layer architecture
  - Browser autoplay handling pattern
  - Cinematic splash screen multi-phase system

### Migrated to SPRITES.md ✅
- Comp-sheet composite layers
- Planetary-sheet (96 frames) organization
- Character sprites (Player, Pico)
- Speech bubble frames
- Key indicator sprites
- Debug icons (9 frames → 12 frames)
- 9-slice container specifications
- Star-sheet organization
- Anthro-intro sprite (4 frames → 16 frames)
- TBI positioning (16 frames → modular system)
- TBI result animation (13 frames)
- Title screen consolidated background
- Aspect-ratio container pattern for sprite sheets
- Background position calculation formulas
- **NEW (#136-#193):**
  - TBI result modular sprites (bars, mask, indicators)
  - TBI beam overlay (11 frames)
  - Left-right arrow keys sprite (6 frames)
  - Title screen 11-layer system with clouds/shooting stars
  - Splash screen logos (Questrium animated, CAMP static)
  - Heart feedback sprite
  - Player character sprite system (38-frame format)
  - Character part sprites table (12 parts, directions, animations)
  - Aseprite export pipeline for character parts
  - Shop composite layers
  - Comp-tabs consolidated sprite (8 frames)

### Migrated to STACK.md ✅
- TranslateY scrollbar issues
- CSS stacking context isolation
- Border-image sprite sheet incompatibility
- Animation interval recreation
- Stale closures in useEffect
- Component type transition breaks
- Frame range overlap detection
- Highlighting wrong frames
- **NEW (#136-#193):**
  - useEffect/useCallback declaration order
  - React key includes animation frame (flickering)
  - Async state update + same-frame movement
  - JavaScript constant hoisting issues
  - Cursor: none resets on window re-entry
  - Browser autoplay policies
  - Aseprite saveCopyAs() ignores active frame
  - Aseprite hidden parent groups
  - Aseprite nested layer groups in scripts
  - Flip logic inconsistency across render paths
  - Flex container squishing fixed-size children
  - Duplicate CSS transition declarations

---

## Entry #194
**Focus:** Questrium splash animation during fade-in + dev mode preset character
**Smooth:** Animation now plays during fade-in by updating frames in the 'fading_in' phase. Dev mode debug states (Before Desk, Before Cutscene, After Cutscene) now use a preset character and skip directly to playing phase.
**Friction:** None - straightforward integration into existing phase-based animation system
**Insight:** Frame animation can overlap with alpha transitions for smoother visual flow; dev mode shortcuts should bypass all non-essential screens

## Entry #195
**Focus:** Book/journal popup system for TBI intro module
**Smooth:** Integrated book popup into existing anthro dialogue flow at index 2. Used CSS slide-up animation with shake keyframes for "no more pages" feedback. Followed existing patterns: keyboard priority chain (X opens, C closes, arrows shake), state flags in CompActivityState, styled-components with visibility props. Book hides anthro sprite/dialogue when visible to avoid visual clutter.
**Friction:** None - existing patterns for modal popups (LockedMessageBox), instruction bars (TbiPositioningIndicator), and keyboard handlers made integration straightforward.
**Insight:** Dialogue-gated content reveals (show book prompt at specific dialogue index) work well for educational pacing; CSS keyframe animations for simple effects like shake avoid sprite sheet overhead

## Entry #196
**Focus:** Reward items display, claim animation, persistent journal corner icon, and TBI mask speed
**Smooth:** Added funding (11x12) and page (16x16) sprites at pass dialogue index 2 with "8" coin count and X key "Claim" indicator. Reward items positioned at `left: 200px, top: 230px` (matching book prompt area), animate to top-right with `translate(400px, -218px)` + fade when claimed. Journal flies to corner when book first closed using same `top/right` positioning as corner icon to ensure exact alignment - holds for 3 seconds at final position before fading to permanent corner icon. ESC key opens/closes book from anywhere when journalCollected=true. Sped up TBI result mask reveal from 400ms to 150ms per frame.
**Friction:** Initial reward position was at bottom of screen (wrong viewport coords) - fixed by using same coordinate system as dialogue elements. Journal had visible "jump" between flying and corner icons - fixed by using identical top/right positioning with transform offset for starting position.
**Insight:** Flying-to-destination animations should position at destination and animate FROM offset rather than TO destination - ensures perfect alignment; hold time at final position (3s) makes collectible animations feel more intentional.

## Entry #197
**Focus:** ESC key journal access from anywhere, ??? star description removal, journal tip dialogue
**Smooth:** Moved book UI elements (BookPopupContainer, BookInstructionBar, NoMorePagesMessage) outside the `compActivity.visible` block to allow ESC key to open journal from home view after first collection. Updated C key handler to close book from anywhere (not just during anthro intro). Added new dialogue line at index 3 about journal/ESC key with voiceover placeholder. Removed ??? star description text leaving just the title. Added backdrop blur/darkening when book is open via ESC from home view (reusing CompSheetBackdrop with `|| compActivity.bookVisible`).
**Friction:** Journal tip dialogue should appear AFTER closing book (advance to index 3), not skip to index 4. Fixed by setting anthroDialogueIndex to 3 on first book close.
**Insight:** UI elements that need to be accessible from multiple contexts (computer view, home view) should be rendered outside context-specific blocks; use state flags for visibility instead of relying on parent visibility. Backdrop effects can be shared by OR-ing visibility conditions.

## Entry #198
**Focus:** Anthro "SUPER SLAB MODE" transformation + slab sprites for TBI activity
**Smooth:** Updated anthro-intro.png sprite sheet (43 frames at 39×82px: body idle 0-7, waving 8-15, transformation 16-37, slab idle 38-42). Added new dialogue line at index 5 triggering transformation animation. Updated anthro-tbi.png to 16 frames at 31×92px (body idle 0-7, slab idle 8-15). TBI positioning now uses slab idle frames. Replaced tbi-masks.png with tbi-masks-slab.png for result screen. Result screen anthro now uses animated slab idle from anthro-intro.png (frames 38-42). Created separate TBI_RESULT_SLAB_POSITION constant for independent slab positioning on result screen.
**Friction:** Sprite positioning needed manual adjustment after changing dimensions - TBI_ANTHRO_Y adjusted to 46 for positioning, TBI_RESULT_SLAB_POSITION set to {x: 234, y: 40} for result screen slab.
**Insight:** When changing sprite dimensions, always audit all position constants that reference that sprite; separate position constants for different sprite types (body vs slab) allow independent fine-tuning; animation phase state machines ('idle' → 'waving' → 'transforming' → 'slab_idle') cleanly handle multi-stage character animations.

## Entry #199
**Focus:** [Next entry]
**Smooth:** [What worked well]
**Friction:** [What had issues + solution]
**Insight:** [Key learning]

---

## WHEN TO WIPE THIS LOG
- After ~50-60 entries
- When file becomes unwieldy
- During major version transitions
- After migrating key insights to core docs

**Last major migration:** Jan 2025 (Entries #001-#193 → Core docs)

---

## WHAT GETS PRESERVED
- Architectural decisions → ARCHITECTURE.md
- Proven patterns → PATTERNS.md
- Sprite specifications → SPRITES.md
- Known bugs/issues → STACK.md
- Workflow improvements → HUB.md
