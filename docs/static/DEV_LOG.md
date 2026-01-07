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

## Entry #136
**Focus:** Modular TBI result system with dynamic color bars
**Smooth:** Layer stack architecture worked perfectly - backdrop, data layer with bars, anthro base, animated mask. Lookup table pattern enables unlimited positioning combinations from minimal sprites (3-color bars + 11-frame mask). All sprites created at native dimensions (51×7/8px bars, 60×72px mask).
**Friction:** Position tuning required multiple iterations to align bars/mask with anthro body regions. Final positions: bars at x:104, y:48-119 (flush stacking, no gaps), mask at x:179, y:80.
**Insight:** Modular sprite composition scales better than pre-baked animations - 16 positioning states × 10 segments = 160 possible results from 6 small sprites. Position lookup tables separate game logic from rendering.

---

## Entry #137
**Focus:** Fixing TBI mask alignment and coordinate system consistency
**Smooth:** Identified root cause - mask and bars were on different coordinate grids (absolute vs container-relative). Red outline debug technique helped visualize positioning issues.
**Friction:** Sub-pixel rendering artifacts during opacity transitions caused by mismatched coordinate systems. Inline styles were overriding styled component props. Multiple attempts to fix positioning before discovering all layers needed unified grid.
**Insight:** One component, one coordinate system - critical for pixel-perfect alignment. Baked container offset (170, 90) into mask styled component so all TBI result layers share same coordinate space. Final positions: bars at x:100 (relative), mask at x:92 (relative), both offset by container.

---

## Entry #138
**Focus:** Adding position indicators (checkmark/tilde/X) to TBI result system
**Smooth:** position-indicators.png sprite sheet (3 frames, 5×3px each) integrated cleanly into existing modular layer architecture. Frame-to-frame mapping ensures indicators match bar colors exactly. Final positions at x:146 provide good spacing from bars. TbiResultDataLayer container made adding indicators straightforward.
**Friction:** Initial implementation used percentage thresholds instead of bar frame indices - caused all green checkmarks regardless of bar color. Had to realize TBI_POSITION_RESULTS stores frame indices (0=red, 1=yellow, 2=green), not percentages. Sprite sheet frames were also inverted (frame 0=X, not checkmark). Multiple position adjustments needed (153→144→146px).
**Insight:** When two visual elements represent the same data (bars + indicators), they must read from the same source data with direct mapping, not derived calculations. Frame indices are simpler than percentage conversions - one lookup table serves all visual representations. Mask sprite updated from 60×72px to 61×72px during positioning refinement.

---

## Entry #139
**Focus:** Adding pass/fail evaluation and sprite-based feedback to TBI positioning results
**Smooth:** Pass criteria (≥8 green segments) implemented as pure function evaluating TBI_POSITION_RESULTS lookup table. getTbiResultBackdropFrame() returns correct sprite frame (1=fail, 2=pass) based on evaluation. tbi-positioning-result.png expanded to 3-frame sprite sheet (900×180px): frame 0=base background, frame 1=fail message, frame 2=pass message. Backdrop layer already existed - just added $frame prop and sprite sheet positioning.
**Friction:** Initial implementation used coded text before switching to sprite-based approach. Required removing TbiFeedbackText styled component and getTbiFeedback() function in favor of simpler frame selection.
**Insight:** Sprite-based UI elements are more flexible than coded text - allows designer to control exact visual presentation (fonts, colors, layout, decorative elements) while keeping code simple. Frame selection logic (evaluateTbiPositioning + getTbiResultBackdropFrame) remains pure and testable. Modular layer system made swapping approaches trivial - backdrop frame changes, all other layers unchanged.

---

## Entry #140
**Focus:** Timing pass/fail reveal with mask animation and hiding irrelevant UI during TBI activity
**Smooth:** getTbiResultBackdropFrame() now accepts maskFrame parameter and returns frame 0 (base) until mask reaches final frame (10), then switches to pass/fail frame. DeskInteractionIndicator (X/C keys) hidden during TBI intro/positioning/result phases by checking visibility flags (anthroIntroVisible, tbiPositioningVisible, tbiResultVisible).
**Friction:** None - both features were straightforward conditional logic additions.
**Insight:** Animation sequencing improves educational pacing - showing base backdrop during mask reveal builds anticipation, then reveals result for maximum impact. UI affordance removal (hiding irrelevant keys) maintains focus during specific activities. Checking multiple visibility flags creates clean phase-based UI control without tight coupling to phase enum values.

---

## Entry #141
**Focus:** Adding reveal delay and retry logic for failed TBI attempts
**Smooth:** Added tbiResultRevealed state flag to track when pass/fail message should appear. Mask animation now triggers setTimeout after reaching final frame (10), then sets tbiResultRevealed: true. getTbiResultBackdropFrame() switched from maskFrame to resultRevealed parameter - cleaner separation of animation timing vs reveal logic. Retry logic checks evaluateTbiPositioning() in completeActivityFromResult() - if failed, calls new restartTbiPositioning() action that fades out result and resets to positioning screen (frame 0). Added restartTbiPositioning to KeyboardActions interface.
**Friction:** Initial restart implementation tried to set multiple visibility flags during fade transition, causing visual glitches. Fixed by using phase transitions (intro_fading_to_black → fading_from_black) and setting visibility/reset values in the setTimeout callback after fade completes.
**Insight:** Educational design principle: failed attempts should loop back to practice, not exit the module. Pause after mask reveal creates dramatic timing - player anticipates their result (timing adjusted to 350ms in Entry #143 for snappier feedback). State flag (tbiResultRevealed) decouples animation completion from message display timing, making it easy to adjust reveal delay independently. Retry flow maintains phase-based transitions for smooth visual continuity.

---

## Entry #142
**Focus:** Removing antiquated clickbox system from CombinedHomeScene
**Smooth:** Clean removal of all mouse-based interaction code (telescope, bed, desk clickable areas). Game now fully keyboard-controlled via proximity detection system established in earlier entries. Removed unused imports (ClickableArea, DebugLabel, DEBUG_CLICKBOXES) and associated state (upperBandHovered, skyBandHovered).
**Friction:** None - clickboxes were completely superseded by keyboard controls, no functionality loss.
**Insight:** When interaction paradigms shift (mouse → keyboard), proactively remove deprecated code paths to prevent confusion and reduce maintenance burden. Keyboard proximity detection provides superior UX for 2D side-scroller games - context-aware prompts are clearer than invisible clickboxes.

---

## Entry #143
**Focus:** Pico dialogue tone adjustment and non-blocking remote dialogue system
**Smooth:** Changed Pico dialogue from playful/mysterious to straightforward greeting ("Hey, welcome home!" → "Heading straight for the Telescope? I'll hold it down here." → "These stars don't find themselves, thanks Pico."). Both regular and blocking dialogue now use same lines. TBI result reveal timing reduced from 500ms to 350ms for snappier feedback. Remote dialogue system allows Pico to speak across the room when Kapoor climbs without talking first - triggers once, doesn't block movement.
**Friction:** Initial blocking system froze Kapoor on ladder via isFrozenOnLadder flag + early return. Removed blocking logic from useKapoorMovement - now just triggers callback if !picoInteracted && !hasShownFirstBlockingMessage. Simplified dismissPicoBlockingDialogue to not manipulate climbing state (was calling setKapoorIsClimbing(false)).
**Insight:** "Blocking" dialogue doesn't have to physically block the player - remote dialogue achieves same narrative goal (acknowledging skipped interaction) without frustrating movement restrictions. Single dialogue trigger check (hasShownFirstBlockingMessage) prevents spam. Dialogue tone matters - overly playful/mysterious can feel out of place in medical education context, straightforward greetings feel more grounded.

---

## Entry #144
**Focus:** Tuning parallax scroll timing for snappier feel at end of transition
**Smooth:** Easing curve adjustment required changing single value in three locations (ParallaxRenderer Layer component, CelestialLayer, ScrollingContent). All use same cubic-bezier for consistent feel. SLOW_SCROLL_DURATION centralized in constants file, easy one-line change.
**Friction:** None - timing adjustments are straightforward when easing curves and durations are properly parameterized. Initial 5.0s duration with cubic-bezier(0.4, 0, 0.2, 1) felt too sluggish at end.
**Insight:** Cubic-bezier third parameter (0.2 → 0.3) controls end deceleration strength - small adjustments (0.1) make significant perceptual difference. Combined timing adjustments (shorter duration + gentler easing) compound for better feel than either alone. Parallax scroll uses two-speed system: 4.0s for dramatic cutscenes, 0.8s for quick telescope interactions. User feedback on "feel" often maps to easing curve tail behavior, not just duration.

---

## Entry #145
**Focus:** Anti-mashing protection for TBI positioning activity flow
**Smooth:** Implemented three-layered defense: (1) 400ms cooldown timer between X key presses prevents rapid-fire through dialogue/animations, (2) phase-based input blocking during all transition phases (booting, fading_to_black, intro_fading_to_black, result_fading_to_black, fading_from_black, transitioning), (3) animation completion gate for TBI result - blocks X key until tbiResultRevealed flag is set (after mask animation + 350ms reveal delay). All protections centralized in useKeyboardControls hook.
**Friction:** None - existing phase-based state machine and tbiResultRevealed flag made implementation straightforward. Added tbiResultRevealed to KeyboardState interface and passed from CombinedHomeScene.
**Insight:** Layered input protection provides smooth UX - phase blocking prevents clicks during visual transitions (no jarring state jumps), cooldown timer enforces minimum viewing time per screen (educational pacing), animation gates ensure dramatic moments play out fully (mask reveal + result display). 400ms cooldown hits sweet spot between responsive feel and preventing accidental skipping. Console logging with cooldown/blocking reasons helps debug input issues without cluttering normal gameplay logs.

---

## Entry #146
**Focus:** TBI beam-on animation with two-phase playback (intro + loop)
**Smooth:** Implemented 11-frame sprite overlay (300×180px per frame, 3300×180px total) that plays frames 0-4 once, then loops frames 5-10 four times. Animation uses recursive setTimeout pattern for phase tracking - intro counter advances through frames 0-4, then loop counter tracks 4 iterations of frames 5-10. Beam layer renders at z-index 307 (above positioning layer 306, below result layers 308+) as full 300×180px overlay matching positioning screen dimensions.
**Friction:** Initial implementation used wrong dimensions (300×30px) causing squished frames - fixed to 300×180px to match TBI positioning screen size. Also forgot to reset beam state when restarting failed TBI attempts - fixed by adding beam resets to restartTbiPositioning and handleActivityComplete actions.
**Insight:** Sprite overlay dimensions must match base layer dimensions for proper alignment - beam overlay at 300×180px perfectly covers positioning screen at same size. Two-phase animation (intro → loop × N) requires separate frame and loop counters - can't use single frame counter because loop needs to restart at frame 5, not 0. Recursive setTimeout with phase checking works cleanly: if (frame < introEnd) advance frame, else if (loopCount < maxLoops) advance frame or restart loop, else complete. 100ms per frame (10fps) feels right for TBI beam - fast enough to feel dynamic, slow enough to see detail. Animation completion triggers phase transition (result_fading_to_black) just like manual X key would, maintaining consistent flow. Input blocking during tbiBeamAnimating flag prevents mashing past animation - adds to existing anti-mashing protection (cooldown + phase blocking + reveal gates).

---

## Entry #147
**Focus:** Project rebrand from "Rogue Resident" to "The Observatory" with Questrium attribution
**Smooth:** Complete grep-based search found all 14 references across documentation, application code, and project root files. Systematic updates organized by file type (docs → app code → title screen → root files). All changes applied cleanly with no linter errors. Version string function updated to return "The Observatory {version}", title screen updated to "THE OBSERVATORY" with "by Questrium" attribution displayed as "{version} - by Questrium" at bottom. Meta description updated to "knowledge constellation experience" terminology.
**Friction:** None - name was consistently used throughout codebase, making grep search comprehensive. No image assets or sprite sheets contained text requiring regeneration.
**Insight:** Consistent naming conventions make rebranding straightforward - all references found via single case-insensitive grep. Separating version display from creator attribution (via dash separator) provides clean visual hierarchy. Updating CLAUDE.md architecture overview ensures AI assistants understand project identity going forward. Script header comments matter - update-version.js now correctly identifies project in usage instructions.

---

## Entry #149
**Focus:** Adding flashing "Press X to Play" indicator and TBI positioning key instructions
**Smooth:** Implemented flashing pulse animation (1.5s cycle, 1.0 → 0.3 opacity) on title screen using same styling patterns as comp activity indicators (Aseprite font, white text, text shadow). TBI positioning instructions use new left-right-arrow-keys.png sprite (33×17px per frame, 6 frames) with real-time input response. Frame tracking via Set pattern handles simultaneous key presses cleanly. CSS transform scale(2) on title screen overlay fixes coordinate system mismatch (HTML overlay vs PIXI uniformScale).
**Friction:** Initial size mismatch on title screen - "Press X to Play" appeared tiny because HTML overlay used absolute 15×16px while PIXI content scaled by uniformScale to fit 640×360 coordinate system. Solution: added scale(2) transform to match typical uniformScale. Arrow key sprite frame mapping required correction - frames are 1=neither, 2=right, 3=left, 4=both (not 2=left, 3=right as initially documented).
**Insight:** Mixed rendering systems (HTML overlay + PIXI canvas) require explicit scaling coordination - HTML elements don't inherit PIXI's uniformScale transformation. When adding UI overlays to scaled coordinate systems, manually scale HTML elements to match or render everything through PIXI. Sprite sheet frame documentation matters - small indexing errors (frame 2 vs 3) cause confusing mirrored behavior. Always verify frame order visually when integrating new sprite sheets. Set-based key tracking pattern elegantly handles simultaneous key presses for multi-directional input indicators.

---
**Focus:** UX polish for Pico petting and popup positioning
**Smooth:** One-time interaction flag (hasPetted) prevents repeated petting popup spam. Pet description dimensions adjusted (140px width, increased line-height 1.4, padding 10px) for better readability. C key prompt now respects hasPetted flag - disappears after first interaction. Arrow keys tutorial duration halved (10s → 5s) for less intrusive onboarding.
**Friction:** Initially modified wrong popup (StarDetailModal constellation message) before identifying correct target (Kapoor monologue after ??? star inspection). Z-index for KapoorMonologue was too high (2100) causing it to render above Kapoor sprite - reduced to 55 to match PicoDialogueText stacking behavior.
**Insight:** Dialogue popup z-index consistency matters - all character dialogue should use same z-index (55) so they render behind sprites (z-index 60). One-time interactions need both state flag (hasPetted) and UI visibility logic (!pico.hasPetted in showCKey condition) to prevent re-triggering. Shorter tutorial affordance removal (5s vs 10s) respects player attention span while still providing adequate learning time. Manual coordinate tweaking by user (left: -95px, top: -62px) often yields better UX than programmatic positioning - positioning is subjective and context-dependent.

---

## Entry #150
**Focus:** Intelligent X key behavior on title screen and pass/fail key differentiation in TBI result
**Smooth:** Title screen now auto-selects Play button when X is pressed without keyboard navigation active (selectedButton < 0), while respecting explicit selections when arrow keys used. TBI result screen now requires different keys based on outcome: X key restarts failed attempts, C key completes successful attempts (≥8 green segments). Added tbiResultPassed boolean to CompActivityState, evaluated during result_fading_to_black phase transition. Both features feel natural - X defaults to primary action when uncertain, pass/fail keys match sprite messaging.
**Friction:** None - keyboard control architecture made both changes straightforward. Added INPUT_COOLDOWN check to C key handler for TBI result to match X key's existing protection.
**Insight:** Default action pattern improves accessibility - when player presses action key without explicit selection, assume most likely intent (Play button on title screen). Educational feedback should use different inputs for different outcomes - prevents accidental mashing through failed attempts while making success feel distinct. Key differentiation (X=retry, C=complete) reinforces that player's result matters, not just advancing past the screen. State flag (tbiResultPassed) evaluated once during transition prevents re-evaluation bugs and keeps logic clean.

---

## Entry #151
**Focus:** Adding exclamation indicator to telescope after completing first activity
**Smooth:** ExclamationIndicator component already existed in styles but unused. Added small exclamation (8×8px pulsing gold circle with black ! mark) positioned at telescope (+8px x, -25px y offset from TELESCOPE_POSITION). Visibility gated behind hasCompletedFirstActivity && currentView === 'home'. Follows same positioning pattern as speech bubbles - absolute positioning within ScrollingContent layer.
**Friction:** None - ExclamationIndicator styled component had all necessary props ($size, $visible) and animations (exclamationPulse 3s infinite) pre-built.
**Insight:** Visual affordances for returning to previously completed areas guide player progression - exclamation tells player "something new is available here". Reusing existing styled components with built-in animations maintains visual consistency. Position offsets (+8, -25) place indicator near but not overlapping telescope speech bubble, creating clear hierarchy. Small size ('small' = 8×8px) provides subtle guidance without overwhelming scene.

---

## Entry #152
**Focus:** Locking anthro positioning during TBI beam animation and integrating telescope exclamation into speech bubble system
**Smooth:** Added tbiBeamAnimating check in the TBI positioning useEffect's handleTbiPositioningKeyDown (this was the actual location handling arrow key movement during TBI activity, not useKeyboardControls). Telescope exclamation now uses same SpeechBubbleSprite with identical position (`TELESCOPE_POSITION.x - 16, y - 20`) as regular telescope bubble. Setting `$highlighted={true}` via state makes it show exclamation frames (4-7) instead of question frames (0-3). Regular telescope bubble hidden after completing first activity, replaced by exclamation bubble at same position.
**Friction:** Initial arrow key blocking was added to useKeyboardControls but TBI positioning has its own separate useEffect with event listeners that bypass that hook. Initial exclamation position was offset incorrectly. Fixed both by: (1) adding tbiBeamAnimating check in TBI positioning useEffect, (2) using exact same position as telescope bubble and always setting highlighted=true for exclamation variant.
**Insight:** When blocking input, must identify the actual event handler location - TBI positioning has dedicated useEffect with capture phase listeners that run before useKeyboardControls. Speech bubble sprite's `$highlighted` prop controls icon type (? vs !) not visual emphasis - frames 0-3 are ?, frames 4-7 are !. Replacing one bubble with another at same position maintains visual continuity while changing meaning (? → !).

---

## Entry #153
**Focus:** UI polish - removing 9-slice containers, fixing speech bubble behaviors, and z-index corrections
**Smooth:** Removed NineSliceContainer from StarDetailModal - constellation stars now show clean text without visual backdrop while ??? star keeps simple italicized styling. Telescope exclamation bubble now uses proximity detection matching first telescope interaction (unhighlighted until Kapoor approaches, highlighted when in range). Desk speech bubble moved from CelestialLayer to ScrollingContent layer so it renders behind Kapoor (z-index 46 < 65) like Pico's bubble.
**Friction:** Telescope exclamation was permanently highlighted instead of responding to proximity. Desk bubble was in wrong layer (CelestialLayer for sky elements vs ScrollingContent for ground elements) causing different stacking contexts.
**Insight:** UI consistency matters - related elements (speech bubbles) should use same interaction patterns (proximity highlighting) and render in same layer (ScrollingContent for ground-level UI). Z-index only works within same stacking context - moving element to correct parent layer fixes z-index issues better than increasing z-index values. Removing outdated UI chrome (9-slice borders) keeps focus on content.

---

## Entry #154
**Focus:** Converting comp activity to keyboard-only with module locking
**Smooth:** Removed all mouse handlers (onMouseEnter, onMouseLeave, onClick) from ActivityClickRegion components and cleaned up hoveredActivity state. ActivityClickRegion now has pointer-events: none. Only TBI module (activity index 0, frame 2) can be selected - locked modules (1-4) show "Module locked" message for 2 seconds. Created LockedMessageBox styled component with z-index 310 (above all comp layers 300-309), red text (#ff6b6b), and centered styling. Selection validation in selectCompActivity checks highlightedActivity === 0 before allowing transition.
**Friction:** Initial locked message used PetDescriptionBox (z-index 55) which rendered below comp activity layers (300-309), making it invisible. Fixed by creating dedicated LockedMessageBox component with proper z-index. Removed orphaned handleActivitySelect function that was only called by deleted onClick handlers.
**Insight:** Z-index hierarchy matters for layered systems - comp activity uses 300-309 range, so overlay messages need 310+. When removing interaction paradigm (mouse → keyboard), clean up entire state chain (hoveredActivity in interface, defaults, logic, and UI active states). Educational progression works better with validation messages than silent failures - "Module locked" tells player why X key didn't work. Keyboard-only navigation creates more deliberate, focused interactions than hybrid mouse/keyboard systems.

---

## Entry #155
**Focus:** Converting anthro intro from hard-coded sprite text to dynamic dialogue system with composite layering
**Smooth:** Modular 3-layer architecture worked perfectly - container backdrop (z:305), dialogue box (z:310), animated character sprite (z:311). Dialogue box sits between background and character creating depth effect. 8-frame idle animation (100ms per frame) cycles smoothly using setInterval with modulo operator `(frame + 1) % 8`. Speaker/text/continue-hint pattern from Pico/Kapoor dialogues reused cleanly. ANTHRO_INTRO_DIALOGUE array enables easy content editing without touching sprites.
**Friction:** Initial implementation tried single static sprite before realizing composite layers were needed. Line spacing and positioning required manual tuning (line-height: 1, top: 110px, padding-right: 40px for text breathing room). Animation frame count doubled mid-implementation (4→8 frames) but modular code made update trivial.
**Insight:** Composite sprite systems scale better than baked-in text - designer controls visual presentation while code stays simple. When UI elements need depth (sandwich effect), use z-index layers rather than single sprite. Dynamic dialogue systems are more maintainable than sprite sheet text - change content in constants file, not regenerate assets. Idle animations at ~10fps (100ms/frame) feel smooth without being distracting. User-adjusted values (positioning, padding, timing) often yield better UX than calculated values - positioning is subjective and context-dependent.

---

## Entry #156
**Focus:** Separating anthro from TBI positioning background - modular sprite system
**Smooth:** Converted 16-frame baked sprite sheet (4800×180px) to 2-layer system: static background (300×180px) + small animated anthro (248×90px, 8 frames at 31×90px each). New state model uses `tbiAnthroX` (pixel position) and `tbiAnthroFrame` (idle animation) instead of single `tbiPositioningFrame`. Arrow keys now move anthro by configurable step size within adjustable range. `getPositionIndexFromX()` function converts X position to 0-15 index for result lookup.
**Friction:** Initial implementation hit JavaScript hoisting issue - `TBI_ANTHRO_START_X` was referenced in `DEFAULT_COMP_ACTIVITY` before being defined. Fixed by moving TBI anthro constants to before the default states section. Also had duplicate CSS `transition` declarations (opacity was overwriting left) - fixed by combining into single declaration.
**Insight:** Modular sprite separation provides multiple benefits: (1) smaller total sprite size (300×180 + 248×90 vs 4800×180), (2) smoother per-pixel positioning instead of 16 discrete steps, (3) anthro sprite can have idle animation during positioning, (4) easier to adjust positioning range without regenerating sprites. Position-to-index conversion function cleanly separates visual positioning from game logic.

---

## Entry #157
**Focus:** Correcting TBI gantry positioning logic and outcome mapping
**Smooth:** Standardized all comments to reflect reality: gantry is on the RIGHT (higher X values). Arrow keys: left decreases X (away from gantry), right increases X (toward gantry). Added smooth CSS transition (`left 0.1s ease-out`) for anthro movement instead of instant teleport. Made step size, boundaries, and Y position all easily configurable constants.
**Friction:** Initial comments had gantry position backwards throughout codebase. Also, physics-based outcome mapping needed rethinking - when far from gantry (left side), anthro is still in field so all sectors remain covered. Only when too close to gantry (right side) does inverse square law cause undercoverage at extremities.
**Insight:** TBI positioning physics: positions 0-9 (far from gantry to optimal) maintain full coverage since anthro remains in beam field. Only positions 10-15 (too close to gantry) cause problems - inverse square law means extremities (head/feet) get underdosed while core stays covered. Asymmetric outcome mapping reflects real-world TBI physics better than symmetric "bad on both ends" approach.

---

## Entry #158
**Focus:** Phase-based animation for anthro intro with waving gesture and self-introduction dialogue
**Smooth:** Expanded anthro-intro.png sprite sheet from 8 to 16 frames: frames 0-7 (idle loop), 8-11 (hand raise one-time), 12-15 (wave loop). Added `anthroAnimPhase` state ('idle' | 'raising' | 'waving') to control animation flow. Animation starts at frame 8 with 'raising' phase, plays through hand raise once, transitions to 'waving' phase for looping frames 12-15. When dialogue advances past index 0, switches to 'idle' phase (frames 0-7 loop). Updated AnthroIntroLayer styled component to use 16-frame sprite width. New dialogue introduces Anthro as "friendly anthropomorphic phantom" and explains TBI positioning task.
**Friction:** None - phase-based state machine pattern from existing TBI beam animation transferred cleanly. Initial walking animation speed increase (WALK_SPRITE_FRAME_SPEED 2→1) felt too fast, user adjusted to 1.5 for optimal feel.
**Insight:** Phase-based animations with state transitions ('raising' → 'waving' → 'idle') create dynamic character behavior tied to dialogue progression. One-time animations (hand raise) followed by loops (waving) build personality without repetitive motion. Doubling sprite sheet frames (8→16) enables richer character expression while maintaining clean state model. Animation speed tuning is subjective - providing easily adjustable constants (WALK_SPRITE_FRAME_SPEED, CLIMB_SPRITE_FRAME_SPEED) enables quick iteration. User feedback on animation feel often requires fractional adjustments (1.5 instead of integer values).

---

## Entry #159
**Focus:** Modular audio system for sound effects and future music support
**Smooth:** Created 4-layer audio architecture following existing codebase patterns: (1) `audio.constants.ts` - typed SfxId/MusicId enums, SFX_CONFIG with paths/volumes/cooldowns/variations, (2) `AudioManager.ts` - singleton using Web Audio API for low-latency SFX playback with preloading, HTMLAudioElement for music with fade support, (3) `useAudio.ts` - React hooks (useAudioInit, useSound, useMusic, useFootstepSounds), (4) `audioStore.ts` - Zustand store with localStorage persistence for volume settings. Initial sounds: hover.wav, confirm.wav, decline.wav, denied.wav, footstep-a/b/c/d.ogg (4 variations with random selection).
**Friction:** None - existing patterns (constants files, hooks, Zustand stores) transferred directly to audio domain. Browser autoplay policies handled via useAudioInit hook that waits for first user interaction before initializing AudioContext.
**Insight:** Audio system mirrors sprite system architecture: constants define assets and config, manager handles playback mechanics, hooks provide React integration, store persists user preferences. Footstep variations (4 random .ogg files with 180ms cooldown) prevent repetitive sound. Sound triggers integrated directly into useKeyboardControls (ui_confirm/ui_decline/ui_hover/ui_denied) and useKapoorMovement (footsteps synced to animation frame advances). Web Audio API provides precise timing for SFX while HTMLAudioElement handles music streaming efficiently.

---

## Entry #160
**Focus:** UX polish - pet popup, climbing zone, and star modal X key instruction
**Smooth:** Three fixes implemented cleanly: (1) Pet popup changed from 3-second auto-dismiss to X-to-continue with new `dismissPetDescription` action and `showPetDescription` state in keyboard handler. Font increased from 10px to 12px. (2) Climbing prompt zone fixed by adding `SECOND_FLOOR_BOUNDS.right` constraint - prompt now only shows where climbing actually works (X range 535-545, not 535-555). (3) Star detail modal now shows X key sprite with "to close" hint at bottom.
**Friction:** Climbing zone mismatch was subtle - prompt used `CLIMB_X_TOLERANCE` (±10px from threshold 545) but action had additional `<= SECOND_FLOOR_BOUNDS.right` (545) constraint, creating dead zone at X 546-555 where prompt showed but action didn't work.
**Insight:** When showing interaction prompts, always match the exact conditions used by the actual action handler. Copy-paste validation logic rather than reimplementing to prevent drift. For modals/popups that need explicit dismissal, add new state+action pair and integrate into keyboard priority chain. Sprite-based key hints (x-key.png) provide consistent visual language across all UI elements.

---

## Entry #161
**Focus:** Background music integration with browser autoplay handling
**Smooth:** Added "The-Observatory.mp3" (74 BPM seamless loop) as main_theme in MUSIC_CONFIG. Simplified MusicId type to single 'main_theme' track. Music configured with 0.35 volume, 2s fade-in, 1.5s fade-out, loop enabled. Climbing zone widened via new `CLIMB_RIGHT_EXTENSION` constant (15px) applied to both prompt visibility and action checks in CombinedHomeScene.tsx and useKapoorMovement.ts.
**Friction:** Browser autoplay policies block music before user interaction. Initial useMusic hook approach didn't work because introComplete triggers from animation, not user gesture. Solution: attempt autoplay immediately when intro completes, catch the rejection, then retry on first click/keypress. Added console logging to debug autoplay success/failure paths. Filename with spaces caused issues - renamed to hyphenated format.
**Insight:** Browser autoplay is fundamentally blocked until user gesture - no workaround exists. Best pattern: attempt autoplay (succeeds if user has high Media Engagement Index with site), catch failure, fall back to first-interaction trigger. For guaranteed pre-interaction audio, only solution is "Click to Enter" gate screen (common in web games). Seamless loop at consistent BPM is standard practice for game background music - no special loop points needed if composition ends where it began.

---

## Entry #162
**Focus:** Title screen layered animation system with parallax clouds and triggered effects
**Smooth:** 11-layer composite architecture worked perfectly - background, 3 cloud layers, abyss, 4 shooting stars, title, shine. PIXI texture slicing via `createFrameTextures()` helper creates frame arrays from horizontal sprite sheets. Ping-pong animation logic (direction flag flips at frame 0 and 7) creates seamless back-and-forth cloud motion. Parallax speeds (600ms/450ms/300ms for clouds 1/2/3) add depth. Shooting stars use staggered initial countdowns (3s/7s/12s/18s) then random 8-15s cooldowns. Shine triggers at intro end AND sporadically after (12-20s cooldown).
**Friction:** Initial 2-frame cloud animation looked janky - jumping from frame 8 to frame 1. Fixed with ping-pong logic. Cloud layers needed desync - solved by starting cloud2 on frame 3 with reverse direction, cloud3 with offset timer.
**Insight:** Ping-pong animation (0→7→6→...→1→0→1→...) is essential for seamless looping sprite animations that don't have perfect wrap-around frames. Parallax depth requires faster movement for closer layers - 2:1.33:1 speed ratio (300:450:600ms) feels natural. Triggering a "celebration" animation (shine) at intro completion creates satisfying punctuation. Layered sprite composition scales well - 11 layers with independent animations from simple sprite sheets.

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
