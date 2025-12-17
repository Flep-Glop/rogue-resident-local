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
*Completed migrations from Entries #001-#135 (Dec 2024)*

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
- **NEW (#116-#135):**
  - Sprite system resize order
  - Feature replacement grep strategy
  - Horizontal-only vs 2D Euclidean distance
  - Hybrid mouse/keyboard input mode switching
  - State consolidation process (5 steps)
  - Hook extraction with actions pattern
  - Callback-based hooks for cross-cutting concerns

### Migrated to ARCHITECTURE.md ✅
- Parallax multi-container architecture
- Layer group system
- Dynamic z-index elevation
- Parent-child orbital architecture
- Composite layer systems
- Dual sprite sheet systems
- Camera translation pattern
- Component consistency for transitions
- **NEW (#116-#135):**
  - Phase-based state machines
  - Dynamic color overlay pattern
  - Bi-directional fade transitions with shared base layer
  - Transition chain timing patterns

### Migrated to SPRITES.md ✅
- Comp-sheet composite layers
- Planetary-sheet (96 frames) organization
- Character sprites (Kapoor, Pico)
- Speech bubble frames
- Key indicator sprites
- Debug icons (9 frames → 12 frames)
- 9-slice container specifications
- Star-sheet organization
- **NEW (#116-#135):**
  - Anthro-intro sprite (4 frames)
  - TBI positioning (16 frames)
  - TBI result animation (13 frames)
  - Title screen consolidated background
  - Aspect-ratio container pattern for sprite sheets
  - Background position calculation formulas

### Migrated to STACK.md ✅
- TranslateY scrollbar issues
- CSS stacking context isolation
- Border-image sprite sheet incompatibility
- Animation interval recreation
- Stale closures in useEffect
- Component type transition breaks
- Frame range overlap detection
- Highlighting wrong frames
- **NEW (#116-#135):** (No new stack issues - primarily patterns/architecture)

---

## WHEN TO WIPE THIS LOG
- After ~20-30 entries
- When file becomes unwieldy
- During major version transitions
- After migrating key insights to core docs

**Last major migration:** Dec 2024 (Entries #001-#135 → Core docs)

---

## WHAT GETS PRESERVED
- Architectural decisions → ARCHITECTURE.md
- Proven patterns → PATTERNS.md
- Sprite specifications → SPRITES.md
- Known bugs/issues → STACK.md
- Workflow improvements → HUB.md
