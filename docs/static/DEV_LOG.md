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

## Entry #122
**Focus:** Simplify title screen intro animation - consolidate cloud layers
**Smooth:** 
- Replaced 4 separate cloud layer assets (cloud-1, cloud-2, cloud-3, purple-abyss) with single title-screen-background.png
- Changed from sliding cloud animations to clean fade-from-black effect
- Removed ~70 lines of cloud sprite setup and animation code
- Adjusted timings: BG fade 1.2s, title starts at 1s, buttons at 1.8s (vs previous 2.2s)
- Shifted all buttons down 25px for better visual balance (Play: 200→225, Dev: 220→245, What's New: 240→265)
**Friction:** 
- None - clean removal of cloudSprite1-4 variables and animation logic
**Insight:** Single consolidated background assets simplify both code and art pipeline - no need to manage layered parallax when a static composition works

---

## Entry #123
**Focus:** Fix title screen dev mode animation direction and debug icon aspect ratio
**Smooth:** 
- Title now correctly moves UP when entering dev mode: changed debugY from `app.screen.height * 0.22` to `centerY - (80 * uniformScale)`
- Debug icons fixed through aspect ratio container: `aspect-ratio: 56 / 53` matches sprite frame dimensions
- Sprite sheet correctly configured for 12 frames (1200% background-size, position by dividing by 11)
**Friction:** 
- debugY calculation was using absolute screen position instead of relative offset from centerY, causing downward movement
- Initial fix attempt incorrectly assumed 9 frames instead of 12, had to reverse that change
- Icons were vertically truncated when using `height: 100%` - container aspect ratio didn't match sprite frames
**Insight:** For background sprite sheets, container aspect ratio must match individual frame dimensions - using `aspect-ratio` prevents truncation/squishing better than `auto` height calculations

---

## Entry #124
**Focus:** Standardize interaction zone ranges - align exclamation highlights with X key interaction
**Smooth:** 
- All three zones (telescope, desk, pico) now have exclamation highlight at same range as X key interaction
- Changed from `PROXIMITY_THRESHOLD` (60px) to `INTERACTION_RANGE` (30px) for telescope/desk highlighting
- Pico highlighting now uses directional `picoInteractionRange` (30-90px) matching X key handler
- Shifted desk zone 10px right for better spatial alignment
**Friction:** 
- Desk used 2D Euclidean distance but had 28px y-offset from Kapoor's ground floor position (y=495 vs y=467)
- This meant effective horizontal range was only ~10px instead of 30px (√(30²-28²) ≈ 10)
- Fixed by changing desk to horizontal-only distance like Pico
**Insight:** In side-view 2D games, use horizontal-only distance for same-floor interactions; 2D Euclidean only makes sense when y-offset is negligible (telescope: 3px) or for multi-floor gating

---

## Entry #125
**Focus:** Hybrid mouse/keyboard input system for title screen
**Smooth:** 
- Changed `selectedButton` and `selectedDebugOption` to start at -1 (no selection) instead of 0
- Arrow keys now activate keyboard mode: first press starts navigation, subsequent presses continue
- Mouse movement automatically exits keyboard mode (threshold of 5px to avoid jitter)
- PIXI button hover events work independently for mouse highlighting
- Debug grid boxes now have CSS hover states with scale animation
**Friction:** 
- PIXI button events are created inside async `initializePixi` and can't directly call React state setters
- Solution: global mouse move listener on window that checks threshold and exits keyboard mode
**Insight:** For hybrid input systems, use `selectedIndex = -1` to represent "mouse mode" vs >= 0 for "keyboard mode". Mouse movement listener with threshold prevents constant mode switching

---

## Entry #126
**Focus:** Major codebase cleanup - remove dead code from prototype transition
**Smooth:** 
- Deleted 17 unused files: UI components (AbilityCardFlip, PixelUI, ResourceDisplay, etc.), data files, storage system, knowledgeStore, broken PWA setup
- Simplified stores: gameStore (removed resource proxies, playerName, difficulty), sceneStore (removed 5 scene types, 6 context fields), abilityStore (266→82 lines, kept only 3 functions)
- Cleaned types.ts: removed Difficulty, KnowledgeDomain enums, KnowledgeConnection/KnowledgeStar interfaces, dead GameEventTypes
- Fixed broken code: GameDevConsole referenced dead `insight`, TransitionScreen referenced dead context fields
**Friction:** 
- Files with imports weren't obviously dead - had to trace actual usage vs just being imported
- abilityStore's `activateAbility` was both dead AND broken (referenced removed `insight` from resourceStore)
- PWA setup was half-built: service-worker.js cached icons that didn't exist, manifest had empty icons array
**Insight:** When cleaning between prototypes, grep for function CALLS not just imports - stores can have many exported functions that are never actually invoked

---

## Entry #127
**Focus:** Deep vertical slice cleanup - remove entire unused systems
**Smooth:** 
- Deleted 6 files: abilityStore.ts, resourceStore.ts, sceneStore.ts, CentralEventBus.ts, TransitionScreen.tsx, app/core/ directory
- Stores reduced from 4 to 1: only gameStore remains (gameStore, ~~resourceStore~~, ~~abilityStore~~, ~~sceneStore~~)
- Removed entire event bus system (GameEventType enum + CentralEventBus) - events were dispatched but never subscribed to
- Removed systems: ability cards (equip/unlock), star points (currency), days (daysPassed/incrementDay), scene transitions
- CombinedHomeScene.tsx cleaned of ~50 lines of dead system references
- Updated CLAUDE.md to reflect simplified architecture
**Friction:** 
- sceneStore was deeply integrated but ultimately unnecessary - everything is one screen with camera pan
- Had to trace transitionToScene('hospital') calls that were no-ops (already on 'home')
- StarDetailModal had star points unlock logic intertwined with display logic - separated cleanly
- Pre-existing TypeScript error in ChangelogPopup (shadows.deep) fixed while running tsc check
**Insight:** When consolidating to single-scene architecture, scene stores become overhead. Camera panning within one component (currentView state) is simpler than scene-switching infrastructure

---

## Entry #128
**Focus:** Aggressive vertical slice cleanup - remove antiquated systems and simplify constellation
**Smooth:** 
- Deleted GameDevConsole.tsx + debug/README.md (outdated debug system)
- Removed entire toast/notification system from CombinedHomeScene (~70 lines: StarNotificationWrapper, WelcomeToastWrapper, StarIcon, NotificationContent, starNotification state)
- Dramatically simplified PixelContainer.tsx: 666→120 lines, removed 10 unused variants (dialog, card, panel, tooltip, modal, resource, ability, answer, toast, window), kept only `question`
- Removed domain color system: deleted 4 colors from pixelTheme.ts (treatmentPlanning, radiationTherapy, linacAnatomy, dosimetry), removed CSS classes and variables from GlobalStyles.tsx
- Simplified TBI constellation from 3 moons to 1 moon ("TBI Patient Setup")
- Updated StarDetailModal: 5 star types → 3 (`star`, `tbi`, `tbi_patient_setup`)
**Friction:** 
- PixelContainer had deeply nested domain color logic ($domain props, DOMAIN_COLORS map, effect overlays) - required full rewrite
- ChangelogPopup used treatmentPlanning color - replaced with inline hex (#3b82f6)
- Had to trace all tbi_dosimetry/tbi_prescriptions/tbi_commissioning references across both CombinedHomeScene and StarDetailModal
**Insight:** When simplifying container systems, start fresh rather than surgically removing - a clean 120-line file is easier to maintain than a 666-line file with surgical deletions

---

## Entry #129
**Focus:** Deep codebase cleanup - remove antiquated phase system and unused styling infrastructure
**Smooth:** 
- Inlined NightPhase.tsx and GameContainer.tsx directly into page.tsx (deleted both files)
- Simplified GamePhase enum to `isPlaying` boolean in gameStore (`setPhase(GamePhase.NIGHT)` → `startGame()`)
- Deleted pixelAnimations.ts entirely (240 lines) - all components define their own keyframes inline
- Trimmed pixelTheme.ts from 473 → 74 lines: removed unused `borders`, `shadows`, `animation`, `components` sections
- Simplified GlobalStyles.tsx from 118 → 86 lines: removed keyframe injection and scrollbar mixin
- Simplified ChangelogPopup.tsx from 283 → 110 lines: removed version badges, highlights, footer, shows only latest 5 changes
- Trimmed versionManager.ts from 282 → 53 lines: removed 11 old changelog entries (v0.0.8-v0.8.0), removed unused utilities
- Deleted empty types.ts and app/favicon.ico
**Friction:** 
- TitleScreen.tsx had unused `hasRecentUpdates` import that broke build after versionManager cleanup
- Had to trace all `GamePhase` and `setPhase` references across page.tsx and TitleScreen.tsx
**Insight:** When cleaning styling infrastructure, grep for actual usage patterns (`from '@/app/styles/pixelTheme'`) to see which exports are imported, then grep for usage of those exports in the importing files - many are imported but never used

---

## Entry #130
**Focus:** Codebase restructuring - folder naming, asset audit, loading system simplification
**Smooth:** 
- Renamed folders to reflect function: `components/phase/` → `screens/`, `components/scenes/` → `game/`
- Renamed PixelContainer.tsx → NineSliceContainer.tsx (now general-purpose 9-slice, not question-specific)
- Deleted LoadingProvider + LoadingTransition (150+ lines) → replaced with minimal 40-line self-contained loading in page.tsx
- Asset audit: deleted 10 unused files (loading-Sheet.png, home-combo.png, home.png, observatory.png, tutorial-star.png, answer-*.png, toast-9slice.png, journal/ folder)
- Deleted `.claude/` folder (no longer using Claude Code)
**Friction:** 
- Linter showed false positives from stale TypeScript cache pointing to old folder paths
- Loading system was deeply integrated (provider in layout, hook in page, component in ui) - simplified to single-component pattern
**Insight:** Loading transitions don't need context/provider architecture - a simple useState + useEffect with fade overlay provides same UX with 1/4 the code

---

## Entry #131
**Focus:** CombinedHomeScene.tsx deep analysis and styled components extraction
**Smooth:** 
- Deleted duplicate `components/scenes/` folder (leftover from #130 folder rename, had outdated imports)
- Removed 4 dead state variables: `telescopeFrame`, `skyXKeyFrame`, `skyCKeyFrame`, `starNeverClicked` (declared but never read)
- Removed 2 unused styled components: `TinyStar`, `ConnectionLine` (~40 lines)
- Extracted all 49 styled components to `CombinedHomeScene.styles.ts` (811 lines)
- Main component reduced from 3,769 → 2,862 lines (24% reduction, 907 lines removed)
- TypeScript compiles clean with no errors after extraction
**Friction:** 
- Large styled component block (854 lines) couldn't use search_replace - used shell `head`/`tail` to surgically remove lines 70-931
- Had to trace all usages of removed state variables to replace with constant `1` values
**Insight:** When analyzing a large component for refactor, start by grepping for `const \[.*\] = useState` to find state declarations, then grep for actual usage - many state variables are declared but never read, just set

---

## Entry #132
**Focus:** Extract constants and types from CombinedHomeScene.tsx
**Smooth:** 
- Created `CombinedHomeScene.constants.ts` (122 lines) with:
  - Type definitions: `StarIdType`, `SkyHighlightType`, `InteractionType`
  - Position constants: `PICO_POSITION`, `TELESCOPE_POSITION`, `DESK_POSITION`, `PRIMAREUS_POSITION`, etc.
  - Threshold constants: `PROXIMITY_THRESHOLD`, `PICO_LEFT_EXTENSION`, `CLIMB_X_THRESHOLD`, etc.
  - Animation speeds: `WALK_SPEED`, `CLIMB_SPEED`, `FRAME_INTERVAL`, `BUBBLE_FRAME_SPEED`
  - Dialogue data: `MONOLOGUE_LINES`, `PICO_DIALOGUE_LINES`, `PICO_BLOCKING_DIALOGUE`
  - UI mapping: `STAR_NAMES`, `ACTIVITY_POSITIONS`
- Main component reduced from 2,862 → 2,805 lines (58 lines extracted)
- Inline constant declarations replaced with imports throughout component
**Friction:** 
- Replace-all on `picoBlockingDialogue` accidentally changed state variable `picoBlockingDialogueIndex` - had to fix the case mismatch
- Keyboard handler too tightly coupled to extract cleanly (~380 lines, 30+ state dependencies) - marked for future refactor
**Insight:** Constants extraction is a quick win for readability but has diminishing returns - complex hooks with deep state coupling need architectural changes (callback maps, context, or component splitting) not just extraction

---

## Entry #133
**Focus:** Extract keyboard handler using action-based pattern
**Smooth:** 
- Created `useKeyboardControls.ts` (285 lines) with clean separation:
  - `KeyboardState` interface: ~20 read-only flags for decision logic
  - `KeyboardActions` interface: ~20 callbacks for state mutations
  - `useKeyboardControls` hook: pure decision logic, no state mutations
  - `calculateActivityNavigation` helper: spatial navigation algorithm (reusable)
- Added `keyboardState` useMemo and `keyboardActions` useMemo in main component
- Main component reduced from 2,805 → 2,667 lines (138 lines removed)
- Total system: 285 (hook) + ~180 (state/actions block) = ~465 lines vs original ~380 lines
  - But: hook is now reusable, testable, and concerns are cleanly separated
**Friction:** 
- Actions that need current state values (like `anthroIntroFrame`) require those in useMemo dependencies
- Some actions need multiple state setters chained with setTimeout - kept as atomic callbacks
**Insight:** Action-based extraction increases total LOC but dramatically improves maintainability:
1. Hook contains pure decision logic (easy to test/understand)
2. Actions are atomic operations (easy to debug)
3. State interface is explicit (easy to see what keyboard handler can see)
4. Next step: component splitting will naturally reduce action callback count

---

## Entry #134
**Focus:** Continue CombinedHomeScene refactor - extract debug modes and Kapoor movement
**Smooth:** 
- Created `useDebugModes.ts` (265 lines): encapsulates 4 debug mode useEffects for testing (skip_to_desk, skip_to_cutscene, after_cutscene, planetary_systems)
- Created `useKapoorMovement.ts` (260 lines): encapsulates character movement, climbing, floor boundary detection, and animation loop
  - Uses callback pattern for Pico blocking: `onClimbBlocked` triggers dialogue in main component
  - Returns `state` (position, direction, frame, isWalking, isClimbing) and `setters` for external control
  - Hook manages its own animation interval cleanup
- Main component reduced from 2,668 → 2,237 lines (431 lines removed, ~16% reduction)
- DebugModeSetters interface provides clean contract for debug state manipulation
**Friction:** 
- Kapoor movement deeply coupled with Pico blocking dialogue - solved with callback pattern
- Had to destructure hook returns for compatibility with existing code (`kapoorPosition` vs `kapoorState.position`)
- Orphaned code after partial replacement required manual cleanup
**Insight:** Callback-based hooks work well when child behavior triggers parent state changes - the hook handles the condition detection, the callback handles the side effects. Keeps hook pure and testable while allowing complex cross-cutting concerns.

---

## WHAT GETS PRESERVED
- Architectural decisions → ARCHITECTURE.md
- Proven patterns → PATTERNS.md
- Sprite specifications → SPRITES.md
- Known bugs/issues → STACK.md
- Workflow improvements → HUB.md
