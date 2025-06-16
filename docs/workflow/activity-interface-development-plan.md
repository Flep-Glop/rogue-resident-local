# Activity Interface System - Development Plan

> **Focus**: Luke's current priority - hospital backdrop to dialogue systems  
> **Philosophy**: Clear distinction between narrative vs challenge interactions  
> **Status**: Hospital backdrop and transitions implemented, focusing on content and polish


---

## 📍 SOURCE CONTEXT

**Source Repository**: rogue-resident-docs  
**Generated At**: 2025-06-14 16:03:51  
**Self-Contained**: Yes - all referenced files embedded below


---

## 🔥 IMMEDIATE ACTIONS (Triage-Style)


### ✅ **COMPLETED IMPLEMENTATIONS** (Foundation Complete)

**Room transition**
- **STATUS**: Implemented - dual-system architecture with scene management
- **ACHIEVEMENT**: Scene-based navigation with smooth transitions and state preservation

- **KEY FILES**: app/store/sceneStore.ts, app/components/ui/GameContainer.tsx



**Hospital backdrop**
- **STATUS**: Implemented - interactive hospital map with clickable rooms
- **ACHIEVEMENT**: Professional isometric hospital interface with contextual tooltips

- **KEY FILES**: app/components/scenes/HospitalBackdrop.tsx, app/components/ui/RoomUIOverlays.tsx





### 🚨 **BLOCKING ITEMS** (Resolve First)

🎉 **No blocking items!** All critical technical unknowns have been resolved.



### ⚡ **READY TO IMPLEMENT** (High Impact)

**Asset integration**
- **WHY NOW**: Dialogue systems exist but need portraits and backgrounds for full visual experience

- **PRIORITY**: HIGH


- **SPECIFIC NEEDS**:

  - Dr. Garcia, Dr. Quinn, Jesse, Dr. Kapoor high-def portraits (warm, analytical, practical, methodical expressions)

  - Room backdrop images (physics office, treatment room, dosimetry lab, simulation suite)

  - Text box frame designs and dialogue choice button designs



- **TECHNICAL CONTEXT**: PortraitImage.tsx component ready for pixel-perfect rendering


- **GO/NO-GO**: 🔥 HIGH PRIORITY - Ready to start


**Content pipeline**
- **WHY NOW**: Some dialogue IDs are placeholders, need actual dialogue content creation

- **PRIORITY**: HIGH


- **SPECIFIC NEEDS**:

  - Replace ${mentorId}_intro placeholder dialogues with actual mentor introductions

  - Replace ${activityId}_challenge placeholders with domain-specific educational content

  - Create mentor-specific reaction content for challenge dialogue system



- **TECHNICAL CONTEXT**: Bridge adapters ready, just need content data files


- **GO/NO-GO**: 🔥 HIGH PRIORITY - Ready to start


**Contextual enhancements**
- **WHY NOW**: Pokemon-style establishing animations framework ready for specific implementations

- **PRIORITY**: MEDIUM


- **SPECIFIC NEEDS**:

  - Patient case animations (medical info card fades, photo/diagnosis reveals)

  - Equipment animations (LINAC schematic reveals, 3D model rotations)

  - Treatment planning animations (CT scan workspace setup)



- **TECHNICAL CONTEXT**: TransitionScreen.tsx supports contextual messaging, needs animation assets


- **GO/NO-GO**: Ready when capacity available


**Polish and refinement**
- **WHY NOW**: Core systems working, ready for professional-grade polish and user experience improvements

- **PRIORITY**: MEDIUM


- **SPECIFIC NEEDS**:

  - Enhanced mentor reaction system with more sophisticated animations

  - Advanced portrait emotion states based on conversation context

  - Audio integration for character voices and ambient hospital sounds

  - Accessibility features and mobile optimization



- **TECHNICAL CONTEXT**: Professional foundation in place, ready for enhancement layers


- **GO/NO-GO**: Ready when capacity available



---

## 🎨 ASSET PIPELINE (Asset-First Workflow)


### **🔧 Technical Readiness Status**

- **Portraits**: PortraitImage.tsx component implemented with pixel-perfect rendering support

- **Backgrounds**: Room backdrop system ready for image integration

- **Ui_elements**: Text box and dialogue interfaces implemented, need design assets

- **Animations**: TransitionScreen.tsx supports contextual animations, needs specific sequences




### **📊 Current Asset Status**

**✅ Implemented & Ready:**

- Hospital backdrop system with interactive areas

- Character portrait rendering with 3x scaling

- Scene transition system with contextual messaging

- Dual dialogue modes (narrative and challenge)


**🎨 Needs Assets:**

- High-definition mentor portraits for enhanced dialogue

- Room-specific background images for immersive context

- UI design elements for professional polish

- Animation assets for Pokemon-style transitions


**📝 Content Pipeline:**

- Placeholder dialogue IDs need replacement with actual content

- Mentor-specific introduction dialogues needed

- Challenge-specific educational content needed

- Reaction content for mentor personality system



### **Week 1 Priority**
High-def mentor portraits and basic text box design

**Immediate Asset Needs:**

**Portraits:**

- Dr. Garcia high-def portrait (warm, encouraging expression)

- Dr. Quinn high-def portrait (analytical, inspiring expression)

- Jesse Martinez high-def portrait (practical, direct expression)

- Dr. Kapoor high-def portrait (precise, methodical expression)


**Backgrounds:**

- Physics office interior (whiteboard with equations)

- Treatment room (with linear accelerator visible)

- Dosimetry lab (measurement equipment)

- Simulation suite (CT scanner, planning stations)


**Ui_elements:**

- Text box frame (journal-style design)

- Dialogue choice button designs

- Challenge progress indicators

- Mentor reaction animation sprites




### **🔌 Integration Ready**

- Portrait system: Drop images into /public/images/characters/portraits/

- Backgrounds: Room backdrop system ready for image swapping

- Content: JSON dialogue files ready for mentor and activity content

- Animations: TransitionScreen component ready for context-specific sequences



**⏭️ Future Weeks:**
- **Week 2**: Room background images and contextual UI elements
- **Week 3**: Animation assets and mentor reaction sprites
- **Week 4**: Polish effects and accessibility elements

---

## 🔧 COMPONENT IMPLEMENTATION GUIDE


### Hospital Backdrop System

**UX Role**: Primary exploration interface  
**Status**: implemented_and_working  
**Priority**: complete


**✅ Implementation Details:**

- Interactive hospital map with clickable room areas (percentage-based coordinates)

- Room-specific hover effects and contextual tooltips

- Time-based atmospheric lighting that changes throughout the day

- Activity badges showing completion counts per room

- Golden highlights for interactive areas with smooth hover transitions




**📁 Technical Files:**

- `app/components/scenes/HospitalBackdrop.tsx`

- `app/components/ui/SystemToggle.tsx (dual-system architecture)`

- `app/components/ui/RoomUIOverlays.tsx (room specialization)`





**Implementation Requirements:**

- **Rendering**: Isometric view with parallax scrolling

- **Interaction**: Mouse click detection on room areas

- **Visual_feedback**: Hover states and click confirmation

- **Performance**: Smooth 60fps with multiple rooms visible


**Asset Dependencies:**

*Visual:* isometric_hospital_building_exterior, interior_room_layouts_visible_through_windows, clickable_room_highlight_overlays, time_of_day_lighting_variations


*Audio:* ambient_hospital_sounds, room_click_feedback_sound


**Integration Points:**


- **Sends data to**: Passes room_id and activity_type to room_transition


- **Dependencies**: Requires activity availability from activity-framework




---

### Room Transition System

**UX Role**: Seamless mode switching  
**Status**: implemented_and_working  
**Priority**: complete


**✅ Implementation Details:**

- Complete dual-system architecture with seamless toggle between classic and scene modes

- Scene-based navigation with history stack (useSceneStore with Zustand + immer)

- Smooth 300ms transitions with easing functions and progress tracking

- Context preservation across navigation with proper state management

- Bridge adapters connecting scene system to existing dialogue components




**📁 Technical Files:**

- `app/components/ui/GameContainer.tsx (main orchestrator)`

- `app/store/sceneStore.ts (centralized scene state management)`

- `app/components/ui/TransitionScreen.tsx (animated transitions)`

- `app/components/ui/SceneDialogueAdapters.tsx (bridge integration)`





**Implementation Requirements:**

- **Scene_management**: Load/unload interface components

- **State_preservation**: Maintain game state during transitions

- **Animation_system**: Smooth visual transitions

- **Error_handling**: Graceful failure if content unavailable


**Asset Dependencies:**

*Visual:* transition_animation_assets, loading_indicator_designs


*Audio:* scene_transition_audio_cues


**Integration Points:**

- **Receives data from**: Receives room_id and activity_type from hospital_backdrop


- **Sends data to**: Activates appropriate dialogue system


- **Dependencies**: Interfaces with save/load system for state




---

### Narrative Dialogue System

**UX Role**: Story and character development  
**Status**: clear_requirements  
**Priority**: high







**Implementation Requirements:**

- **Portrait_system**: High-res character display with emotion states

- **Text_rendering**: Rich text with formatting and animations

- **Choice_handling**: Multiple choice selection with consequences

- **History_system**: Previous dialogue viewing (retroactive click)

- **Layering_effect**: Text boxes translate up and fade for history


**Asset Dependencies:**

*Visual:* high_definition_npc_portraits, room_backdrop_images, text_box_frame_designs, dialogue_choice_button_designs, text_layering_fade_animations


*Audio:* character_voice_samples_or_text_sounds, page_turn_sounds_for_text_progression


**Integration Points:**

- **Receives data from**: Activated by room_transition for narrative activities


- **Sends data to**: Returns to hospital_backdrop or progresses to next scene


- **Dependencies**: Mentor relationship data, dialogue content trees



**🌟 Special Features:**

- **Retroactive_viewing**: Click previous dialogue to view with fade effect

- **Emotional_portraits**: Portrait changes based on conversation context

- **Choice_consequences**: Dialogue choices affect mentor relationships



---

### Challenge Dialogue System

**UX Role**: Educational activities with social context  
**Status**: clear_requirements  
**Priority**: high







**Implementation Requirements:**

- **Compact_portraits**: Smaller, animated character displays

- **Text_feed**: Twitter-like challenge progression display

- **Reaction_system**: Real-time mentor reactions to player performance

- **Progress_tracking**: Visual indication of challenge completion

- **Result_integration**: Seamless flow to reward/progression systems


**Asset Dependencies:**

*Visual:* smaller_npc_portrait_variants, reaction_animation_sprites, challenge_progress_indicators, text_feed_display_components, challenge_result_celebration_effects


*Audio:* reaction_audio_cues, challenge_progression_audio


**Integration Points:**

- **Receives data from**: Activated by room_transition for challenge activities


- **Sends data to**: Returns results to activity-framework for rewards


- **Dependencies**: Challenge content, mentor personalities, player stats



**🌟 Special Features:**

- **Mentor_reactions**: Different mentors react differently to player choices

- **Dynamic_encouragement**: Adaptive support based on performance

- **Clear_mode_distinction**: Visually distinct from narrative dialogue



---




## 🔗 INTEGRATION STRATEGY (Anti-Patchwork)

### **Data Flow Architecture**

hospital_backdrop -> room_transition: room_id, activity_type, player_state

room_transition -> dialogue_systems: activity_content, mentor_context

dialogue_systems -> activity_framework: completion_data, choices_made

activity_framework -> game_state: rewards, relationship_changes, progress


### **Shared Dependencies** (Plan for these)

- Game state management (save/load)

- Audio system (music, sound effects)

- Input handling (mouse, keyboard)

- Performance monitoring (FPS, memory)


### **💥 FAILURE MODES TO PREVENT**

- Inconsistent state between components

- Asset loading blocking user interaction

- Memory leaks from frequent transitions

- Broken integration when one component changes


### **�� Testing Strategy**

- Component isolation testing

- Integration flow testing

- Performance testing with multiple transitions

- Error recovery testing


---

## 👥 LLM COLLABORATION PREP


**All implementation context available in references/ folder:**


- [`references/activity-framework.md`](references/activity-framework.md)

- [`references/visual-design-philosophy.md`](references/visual-design-philosophy.md)

- [`references/mentors/mentor-philosophies.md`](references/mentors/mentor-philosophies.md)


*Everything you need is available locally - no external dependencies required.*



**Technical Dependencies:**

- Game engine scene management system

- Asset loading and caching system

- Input handling framework

- UI rendering and animation system


---

## 📊 DECISION CONTEXT

**Current Status**: Hospital backdrop and transitions implemented, focusing on content and polish  

**Current Focus Areas**:

- Asset integration - dialogue systems ready for portraits and backgrounds

- Content pipeline - replacing placeholder dialogue IDs with actual content

- Professional simulation polish - enhancing existing systems




**Immediate Blockers**: ✅ None! Clear to proceed with high-priority items



**Ready to Work On**:

- High-def mentor portraits for enhanced dialogue experience

- Room backdrop creation for immersive context

- Mentor introduction dialogue content creation

- Challenge-specific educational content development




**Technical Achievements**:

- Dual-system architecture allowing seamless mode switching

- Scene-based navigation with state preservation and smooth transitions

- Interactive hospital backdrop with professional-grade visual polish

- Bridge adapters connecting new and existing systems without breaking changes

- Pixel-perfect character portrait rendering system ready for asset integration



**Decision Points**: Enhancing asset pipeline and dialogue system refinements  
**Inspiration**: Professional medical simulation through authentic workplace interfaces  
**Constraints**: First-time game development, learning as we go  
**Success Metrics**: Professional simulation quality, seamless transitions, production-ready polish

---

## 🎯 USER EXPERIENCE FLOW


### Hospital Exploration
Player navigates isometric hospital view

**User Actions**: Navigate view, observe available activities, read room descriptions
**System Requirements**: Isometric rendering, clickable detection, visual feedback


### Room Selection
Player clicks on available activity rooms

**User Actions**: Click room, view activity preview, confirm selection
**System Requirements**: Click event handling, preview generation, confirmation UI


### Activity Type Detection
System determines narrative vs challenge content

**User Actions**: Wait for transition, observe interface change
**System Requirements**: Content type analysis, interface mode switching


### Activity Experience
Player engages with appropriate dialogue system

**User Actions**: Read dialogue, make choices, respond to challenges
**System Requirements**: Portrait display, text rendering, interaction handling



---


## 📚 REFERENCE FILES

**Referenced content exported to local files:**

- [`references/activity-framework.md`](references/activity-framework.md)

- [`references/visual-design-philosophy.md`](references/visual-design-philosophy.md)

- [`references/mentors/mentor-philosophies.md`](references/mentors/mentor-philosophies.md)


*All system data and narrative context available in the references/ directory.*



*Generated from structured YAML data with all referenced content embedded inline*
*Self-contained development plan - no external dependencies required* 