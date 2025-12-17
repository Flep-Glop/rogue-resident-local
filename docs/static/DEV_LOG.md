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
*Completed migrations from Entries #001-#115 (Dec 2024)*

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

### Migrated to ARCHITECTURE.md ✅
- Parallax multi-container architecture
- Layer group system
- Dynamic z-index elevation
- Parent-child orbital architecture
- Composite layer systems
- Dual sprite sheet systems
- Camera translation pattern
- Component consistency for transitions

### Migrated to SPRITES.md ✅
- Comp-sheet composite layers
- Planetary-sheet (96 frames) organization
- Character sprites (Kapoor, Pico)
- Speech bubble frames
- Key indicator sprites
- Debug icons (9 frames)
- 9-slice container specifications
- Star-sheet organization

### Migrated to STACK.md ✅
- TranslateY scrollbar issues
- CSS stacking context isolation
- Border-image sprite sheet incompatibility
- Animation interval recreation
- Stale closures in useEffect
- Component type transition breaks
- Frame range overlap detection
- Highlighting wrong frames

---

## WHEN TO WIPE THIS LOG
- After ~20-30 entries
- When file becomes unwieldy
- During major version transitions
- After migrating key insights to core docs

**Last major migration:** Dec 2024 (Entries #001-#115 → Core docs)

---

## Entry #116
**Focus:** Comp-sheet sprite system overhaul - resize from 600×360 to 300×180
**Smooth:** 
- Removed deprecated AbilityCardInterface.tsx and unused comp-sheet.png (was duplicate system)
- Proportional scaling of all dimensions, positions, and click regions worked cleanly
- Added CompSheetBackdrop with blur/darken effect to focus attention on computer screen
**Friction:** 
- Had two separate computer flows (click vs X-key) - consolidated to X-key only
- Click regions needed offset recalculation: scale by 0.5, then add new comp offset (170, 90)
**Insight:** When resizing sprite systems, update in order: styled components → JSX positioning → click regions → navigation positions → documentation

---

## Entry #117
**Focus:** Replace quiz system with TBI positioning sprite sheet viewer
**Smooth:** 
- Clean swap from quiz overlay to TbiPositioningLayer (simple sprite sheet navigation)
- Arrow keys navigate through 16 frames: Left = advance (patient moves left), Right = retreat (patient moves right)
- X key closes viewer and completes activity
**Friction:** 
- Had to remove many quiz-related states (showQuiz, showResults, quizQuestions, etc.)
- Multiple references to old states in debug logs and useEffect dependencies
- Flipped arrow directions to match visual motion (left arrow = patient moves left)
**Insight:** When replacing a complex feature with simpler one, grep for all state references - they hide in debug logs and dependency arrays

---

## Entry #118
**Focus:** Split comp-window.png into separate screen and monitor layers with dynamic colors + fade transitions
**Smooth:** 
- Clean separation: CompMonitorLayer (z:300) as base with black fill, CompScreenLayer (z:301) for color overlay
- Screen color switches based on phase: blue for menu, dark for TBI activity
- Boot-up transition: `booting` (300ms black) → `booting_fade_in` (350ms) → `waiting`
- Activity transition: `transitioning` (150ms press) → `fading_to_black` (350ms) → `fading_from_black` (350ms) → `activity`
- Monitor's black fill naturally serves as intermediate "fade to/from black" state for both transitions
**Friction:** 
- Initially had layer order reversed - monitor is actually the base layer with black fill
- Menu layers (activity, options, option1) needed visibility during `booting_fade_in` to fade in together with screen
**Insight:** Splitting static/dynamic layers enables elegant transitions in both directions - the same black monitor base works for boot-up fade-in and activity fade-out/fade-in

---

## Entry #119
**Focus:** Anthro intro dialogue sequence between menu and TBI positioning
**Smooth:** 
- AnthroIntroLayer (z:305): 4-frame sprite sheet at 300×180 per frame (anthro-intro.png)
- New phases: `intro` and `intro_fading_to_black` inserted between menu fade-out and TBI fade-in
- X key advances through dialogue frames (0→1→2→3), then triggers fade to TBI on last frame
- CompScreenLayer variant stays dark during intro (same as activity phases)
**Friction:** 
- Needed to block C key during intro (already blocked during TBI) to prevent accidental close
- Priority ordering in X key handler: intro check must come before TBI positioning check
**Insight:** Phase-based state machines scale well - adding intermediate phases (intro) just extends the existing transition chain without restructuring

---

## Entry #120
**Focus:** TBI result animation screen after positioning complete
**Smooth:** 
- TbiResultLayer (z:307): 13-frame sprite sheet at 300×180 per frame (tbi-positioning-result.png)
- New phases: `result_fading_to_black`, `result_fading_from_black`, `result`
- Auto-animation: frames 0→10 play at 500ms intervals (5.5s total), then lands on frame 11
- X on TBI positioning triggers fade to result; X on result completes activity
- Animation uses recursive setTimeout with ref cleanup on unmount/activity complete
**Friction:** 
- Need to clear tbiResultAnimationRef in both handleActivityComplete and component cleanup
- CompScreenLayer visibility logic grows with each new fade phase (5 phases now check for hidden state)
**Insight:** For auto-playing sprite animations, recursive setTimeout with frame counter is cleaner than setInterval - easier to control end condition and timing per frame

---

## Entry #121
**Focus:** v1.1.0-dev deployment and security patching
**Smooth:** 
- VERSION_MANAGEMENT.md workflow executed cleanly: updated versionManager.ts, package.json, committed with detailed message
- Merged rescoped-rogue → main without conflicts (version files resolved with --theirs)
- React2Shell CVE-2025-66478 patched: Next.js 15.3.1 → 15.3.6 (critical vulnerability eliminated)
- Removed deprecated "Welcome Home" popup from old hospital flow (82 lines deleted cleanly)
**Friction:** 
- Git push required `required_permissions: ["all"]` due to SSL certificate verification issue in sandbox
- GitHub vulnerabilities dropped 14 → 8 → 6 across patches (remaining are non-critical dependencies)
**Insight:** VERSION_MANAGEMENT.md pre-deployment checklist prevents missing files - always verify `git status` before version bumps to catch untracked assets

---

## WHAT GETS PRESERVED
- Architectural decisions → ARCHITECTURE.md
- Proven patterns → PATTERNS.md
- Sprite specifications → SPRITES.md
- Known bugs/issues → STACK.md
- Workflow improvements → HUB.md
