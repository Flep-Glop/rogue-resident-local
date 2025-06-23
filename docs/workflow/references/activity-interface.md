# Activity Interface

**Source**: `data/interfaces/activity-interface.yaml`

system_info:
  name: "Activity Interface System"
  type: "interface_system"
  description: "Multi-component interface system for hospital exploration and activity interactions"
  development_focus: "Luke's current priority - hospital backdrop to dialogue systems"
  user_experience_philosophy: "Clear distinction between narrative vs challenge interactions"
  content_reference: "content/interfaces/activity-interface.md"
  related_systems: ["activity-framework", "visual-design", "mentors", "challenges"]

# User Experience Flow (Primary Organization)
user_experience_flow:
  step_1:
    name: "Hospital Exploration"
    description: "Player navigates isometric hospital view"
    user_actions: ["Navigate view", "observe available activities", "read room descriptions"]
    system_requirements: ["Isometric rendering", "clickable detection", "visual feedback"]
    
  step_2:
    name: "Room Selection"
    description: "Player clicks on available activity rooms"
    user_actions: ["Click room", "view activity preview", "confirm selection"]
    system_requirements: ["Click event handling", "preview generation", "confirmation UI"]
    
  step_3:
    name: "Activity Type Detection"
    description: "System determines narrative vs challenge content"
    user_actions: ["Wait for transition", "observe interface change"]
    system_requirements: ["Content type analysis", "interface mode switching"]
    
  step_4:
    name: "Activity Experience"
    description: "Player engages with appropriate dialogue system"
    user_actions: ["Read dialogue", "make choices", "respond to challenges"]
    system_requirements: ["Portrait display", "text rendering", "interaction handling"]

# Component Breakdown (Implementation Focused)
components:
  hospital_backdrop:
    name: "Hospital Backdrop System"
    user_experience_role: "Primary exploration interface"
    implementation_status: "implemented_and_working"
    development_priority: "complete"
    
    implementation_details:
      - "Interactive hospital map with clickable room areas (percentage-based coordinates)"
      - "Room-specific hover effects and contextual tooltips"
      - "Enhanced 300% zoom system for maximum detail visibility"
      - "Custom pixel art sprite integration (time-symbols.png)"
      - "Debug click-through system for testing all weather/time states"
      - "Clean gradient background replacing time-based color effects"
      - "Optimized positioning system with pixel-perfect control"
      - "Activity badges showing completion counts per room"
      - "Golden highlights for interactive areas with smooth hover transitions"
      
    technical_files:
      - "app/components/scenes/HospitalBackdrop.tsx"
      - "app/components/ui/SystemToggle.tsx (dual-system architecture)"
      - "app/components/ui/RoomUIOverlays.tsx (room specialization)"
    
    asset_requirements:
      visual_assets:
        - "isometric_hospital_building_exterior"
        - "interior_room_layouts_visible_through_windows"
        - "clickable_room_highlight_overlays"
        - "time_of_day_lighting_variations"
      audio_assets:
        - "ambient_hospital_sounds"
        - "room_click_feedback_sound"
      
    technical_requirements:
      rendering: "Isometric view with parallax scrolling"
      interaction: "Mouse click detection on room areas"
      visual_feedback: "Hover states and click confirmation"
      performance: "Smooth 60fps with multiple rooms visible"
      
    technical_unknowns: []
    
    integration_points:
      outgoing: "Passes room_id and activity_type to room_transition"
      data_dependencies: "Requires activity availability from activity-framework"
      
  room_transition:
    name: "Room Transition System"
    user_experience_role: "Seamless mode switching"
    implementation_status: "implemented_and_working"
    development_priority: "complete"
    
    implementation_details:
      - "Complete dual-system architecture with seamless toggle between classic and scene modes"
      - "Scene-based navigation with history stack (useSceneStore with Zustand + immer)"
      - "Smooth 300ms transitions with easing functions and progress tracking"
      - "Context preservation across navigation with proper state management"
      - "Bridge adapters connecting scene system to existing dialogue components"
      
    technical_files:
      - "app/components/ui/GameContainer.tsx (main orchestrator)"
      - "app/store/sceneStore.ts (centralized scene state management)"
      - "app/components/ui/TransitionScreen.tsx (animated transitions)"
      - "app/components/ui/SceneDialogueAdapters.tsx (bridge integration)"
      
    asset_requirements:
      visual_assets:
        - "transition_animation_assets"
        - "loading_indicator_designs"
      audio_assets:
        - "scene_transition_audio_cues"
        
    technical_requirements:
      scene_management: "Load/unload interface components"
      state_preservation: "Maintain game state during transitions"
      animation_system: "Smooth visual transitions"
      error_handling: "Graceful failure if content unavailable"
      
    technical_unknowns: []
      
    integration_points:
      incoming: "Receives room_id and activity_type from hospital_backdrop"
      outgoing: "Activates appropriate dialogue system"
      data_dependencies: "Interfaces with save/load system for state"
      
  narrative_dialogue:
    name: "Narrative Dialogue System"
    user_experience_role: "Story and character development"
    implementation_status: "implemented_and_working"
    development_priority: "content_expansion"
    
    asset_requirements:
      visual_assets:
        - "high_definition_npc_portraits" # Dr. Garcia, Dr. Quinn, Jesse, Dr. Kapoor
        - "room_backdrop_images" # Physics office, treatment rooms, etc.
        - "text_box_frame_designs"
        - "dialogue_choice_button_designs"
        - "text_layering_fade_animations"
      audio_assets:
        - "character_voice_samples_or_text_sounds"
        - "page_turn_sounds_for_text_progression"
        
    technical_requirements:
      portrait_system: "High-res character display with emotion states"
      text_rendering: "Rich text with formatting and animations"
      choice_handling: "Multiple choice selection with consequences"
      history_system: "Previous dialogue viewing (retroactive click)"
      layering_effect: "Text boxes translate up and fade for history"
      background_integration: "Room backgrounds display automatically based on roomId"
      
    technical_unknowns: []
    
    special_features:
      retroactive_viewing: "Click previous dialogue to view with fade effect"
      emotional_portraits: "Portrait changes based on conversation context"
      choice_consequences: "Dialogue choices affect mentor relationships"
      
    integration_points:
      incoming: "Activated by room_transition for narrative activities"
      outgoing: "Returns to hospital_backdrop or progresses to next scene"
      data_dependencies: "Mentor relationship data, dialogue content trees"
      
  room_background_system:
    name: "Room Background Integration System"
    user_experience_role: "Immersive environmental context for dialogue"
    implementation_status: "implemented_and_working"
    development_priority: "complete"
    
    implementation_details:
      - "Dynamic background/foreground layer system with depth effects"
      - "Room-specific atmosphere overlays and fallback gradients"
      - "Integration with dialogue scenes for immersive environments" 
      - "Physics office showcase implementation with full layering"
      - "Z-index architecture supporting layered depth rendering"
      
    technical_files:
      - "app/utils/roomBackgrounds.ts"
      - "app/components/dialogue/NarrativeDialogue.tsx (background integration)"
      - "app/components/dialogue/ChallengeDialogue.tsx (parallel integration)"
      
    asset_requirements:
      visual_assets:
        - "physics-office.png (completed by Luke)"
        - "physics-office-foreground.png (completed by Luke)"
        - "treatment-room.png (ready for creation)"
        - "dosimetry-lab.png (ready for creation)"
        - "simulation-suite.png (ready for creation)"
        
    technical_requirements:
      rendering: "Layered background/foreground with z-index management"
      fallback: "Room-specific gradient fallbacks for unreleased rooms"
      integration: "Seamless dialogue scene background loading"
      
    technical_unknowns: []
    
    integration_points:
      incoming: "Receives room_id from dialogue systems"
      outgoing: "Provides immersive visual context for conversations"
      
  reaction_animation_system:
    name: "Complete Reaction Animation System"
    user_experience_role: "Dynamic mentor reactions and feedback"
    implementation_status: "implemented_and_working"
    development_priority: "complete"
    
    implementation_details:
      - "Portrait animations with CSS keyframe definitions (shake, bounce, nod, pulse)"
      - "Floating reaction symbols with sprite-based rendering"
      - "Auto-triggering reactions based on dialogue choice effects"
      - "Conflict-free animation system preserving character positioning"
      - "Memory-efficient reaction symbol cleanup system"
      
    technical_files:
      - "app/components/ui/ReactionSystem.tsx"
      
    asset_requirements:
      visual_assets:
        - "reaction-symbols.png (completed sprite sheet by Luke)"
        
    technical_requirements:
      animation: "CSS keyframe animation system with transform separation"
      sprites: "Sprite sheet positioning for reaction symbols"
      triggers: "Automatic reaction spawning based on dialogue effects"
      cleanup: "Memory management for animation lifecycle"
      
    technical_unknowns: []
    
    special_features:
      auto_triggering: "Insight gains (+) → 💡 + bounce, losses (-) → ? + shake"
      symbol_types: "!, ?, ..., 💡, ⭐ with unique animations"
      animation_separation: "Positioning transforms separate from animation transforms"
      
    integration_points:
      incoming: "Triggered by dialogue choice effects"
      outgoing: "Visual feedback enhancing user experience"

  challenge_dialogue:
    name: "Challenge Dialogue System"  
    user_experience_role: "Educational activities with social context"
    implementation_status: "implemented_and_working"
    development_priority: "content_expansion"
    
    asset_requirements:
      visual_assets:
        - "smaller_npc_portrait_variants" # Efficient versions for reactions
        - "reaction_animation_sprites" # Happy, confused, encouraging, etc.
        - "challenge_progress_indicators"
        - "text_feed_display_components"
        - "challenge_result_celebration_effects"
      audio_assets:
        - "reaction_audio_cues" # Encouraging sounds, success chimes
        - "challenge_progression_audio"
        
    technical_requirements:
      compact_portraits: "Smaller, animated character displays"
      text_feed: "Twitter-like challenge progression display"
      reaction_system: "Real-time mentor reactions to player performance"
      progress_tracking: "Visual indication of challenge completion"
      result_integration: "Seamless flow to reward/progression systems"
      
    technical_unknowns: []
    
    special_features:
      mentor_reactions: "Different mentors react differently to player choices"
      dynamic_encouragement: "Adaptive support based on performance"
      clear_mode_distinction: "Visually distinct from narrative dialogue"
      
    integration_points:
      incoming: "Activated by room_transition for challenge activities"
      outgoing: "Returns results to activity-framework for rewards"
      data_dependencies: "Challenge content, mentor personalities, player stats"

# Development Strategy (Triage-Style)
development_priorities:
  completed_implementations:
    - component: "room_transition"
      status: "Implemented - dual-system architecture with scene management"
      achievement: "Scene-based navigation with smooth transitions and state preservation"
      technical_files: ["app/store/sceneStore.ts", "app/components/ui/GameContainer.tsx"]
      
    - component: "hospital_backdrop"
      status: "Implemented - enhanced interactive hospital map with pixel art integration"
      achievement: "Professional isometric hospital with 300% zoom and custom sprite integration"
      technical_files: ["app/components/scenes/HospitalBackdrop.tsx", "app/components/ui/RoomUIOverlays.tsx"]
      
    - component: "room_background_system"
      status: "Implemented - dynamic background/foreground layer system"
      achievement: "Immersive room environments with depth effects and physics office showcase"
      technical_files: ["app/utils/roomBackgrounds.ts", "app/components/dialogue/NarrativeDialogue.tsx"]
      
    - component: "reaction_animation_system" 
      status: "Implemented - complete mentor reaction framework"
      achievement: "Auto-triggered portrait animations and floating symbol system"
      technical_files: ["app/components/ui/ReactionSystem.tsx"]
      
    - component: "dialogue_systems"
      status: "Implemented - both narrative and challenge dialogue working"
      achievement: "Physics office with 15+ interactions, room-specific routing operational"
      technical_files: ["app/components/dialogue/NarrativeDialogue.tsx", "app/components/dialogue/ChallengeDialogue.tsx"]
      
    - component: "legacy_system_removal"
      status: "Implemented - complete dual system migration"
      achievement: "99% code reduction in DayPhase, single system architecture"
      technical_files: ["app/components/phase/DayPhase.tsx (simplified to 14 lines)"]
      
  ready_to_implement:
    - component: "additional_room_backgrounds"
      reason: "Room background system proven with physics office, ready for expansion"
      priority: "high"
      specific_needs:
        - "Treatment room background (linear accelerator, patient couch, control monitors)"
        - "Dosimetry lab background (measurement equipment, detection devices)"
        - "Simulation suite background (CT scanner, planning workstations)"
      technical_context: "app/utils/roomBackgrounds.ts ready for additional room definitions"
      
    - component: "dialogue_content_expansion"
      reason: "Physics office has 15+ interactions, other rooms ready for similar content"
      priority: "high"
      specific_needs:
        - "Treatment room mentor conversations (clinical procedures, safety protocols)"
        - "Dosimetry lab technical discussions (measurement theory, quality assurance)"
        - "Simulation suite planning dialogues (imaging, treatment optimization)"
      technical_context: "Dialogue routing system operational, content framework established"
      
    - component: "contextual_enhancements"
      reason: "Pokemon-style establishing animations framework ready for specific implementations"
      priority: "medium"
      specific_needs:
        - "Patient case animations (medical info card fades, photo/diagnosis reveals)"
        - "Equipment animations (LINAC schematic reveals, 3D model rotations)"
        - "Treatment planning animations (CT scan workspace setup)"
      technical_context: "TransitionScreen.tsx supports contextual messaging, needs animation assets"
      
    - component: "polish_and_refinement"
      reason: "Core systems working, ready for professional-grade polish and user experience improvements"
      priority: "medium"
      specific_needs:
        - "Enhanced mentor reaction system with more sophisticated animations"
        - "Advanced portrait emotion states based on conversation context"
        - "Audio integration for character voices and ambient hospital sounds"
        - "Accessibility features and mobile optimization"
      technical_context: "Professional foundation in place, ready for enhancement layers"
      
  future_enhancements:
    - "Real-time collaboration features for team development"
    - "Advanced transition animations with particle effects"
    - "Voice acting integration and audio mixing system"
    - "Analytics and learning progression tracking"

# Asset Pipeline (Asset-First Workflow)
asset_pipeline:
  technical_readiness:
    portraits: "PortraitImage.tsx component implemented with pixel-perfect rendering support"
    backgrounds: "Room backdrop system ready for image integration"
    ui_elements: "Text box and dialogue interfaces implemented, need design assets"
    animations: "TransitionScreen.tsx supports contextual animations, needs specific sequences"
    
  immediate_needs:
    portraits:
      - "Dr. Garcia high-def portrait (warm, encouraging expression)"
      - "Dr. Quinn high-def portrait (analytical, inspiring expression)"
      - "Jesse Martinez high-def portrait (practical, direct expression)"
      - "Dr. Kapoor high-def portrait (precise, methodical expression)"
    backgrounds:
      - "Physics office interior (whiteboard with equations)"
      - "Treatment room (with linear accelerator visible)"
      - "Dosimetry lab (measurement equipment)"
      - "Simulation suite (CT scanner, planning stations)"
    ui_elements:
      - "Text box frame (journal-style design)"
      - "Dialogue choice button designs"
      - "Challenge progress indicators"
      - "Mentor reaction animation sprites"
      
  current_status:
    implemented: 
      - "Hospital backdrop system with 300% zoom and pixel art integration"
      - "Room background system with physics office showcase complete"
      - "Complete reaction animation framework with auto-triggering"
      - "Character portrait rendering with layered depth effects"
      - "Scene transition system with contextual messaging"
      - "Dual dialogue modes with 15+ interaction conversations"
      - "Legacy system removal with single architecture"
    ready_for_expansion:
      - "Additional room backgrounds using proven integration system"
      - "Extended dialogue content for treatment room, dosimetry lab, simulation suite"
      - "Additional reaction symbols and animation effects"
      - "Tutorial system implementation using working dialogue foundation"
    content_pipeline:
      - "Physics office content complete with 15+ meaningful interactions"
      - "Room-specific dialogue routing operational"
      - "Mentor reaction system functional with sprite-based symbols"
      - "Background integration system ready for more environments"
      
  asset_creation_order:
    week_1: "High-def mentor portraits and basic text box design"
    week_2: "Room background images and contextual UI elements"
    week_3: "Animation assets and mentor reaction sprites"
    week_4: "Polish effects and accessibility elements"
    
  integration_ready:
    - "Portrait system: Drop images into /public/images/characters/portraits/"
    - "Backgrounds: Room backdrop system ready for image swapping"
    - "Content: JSON dialogue files ready for mentor and activity content"
    - "Animations: TransitionScreen component ready for context-specific sequences"

# Integration Prevention (Anti-Patchwork)
integration_points:
  data_flow:
    - "hospital_backdrop -> room_transition: room_id, activity_type, player_state"
    - "room_transition -> dialogue_systems: activity_content, mentor_context"
    - "dialogue_systems -> activity_framework: completion_data, choices_made"
    - "activity_framework -> game_state: rewards, relationship_changes, progress"
    
  shared_dependencies:
    - "Game state management (save/load)"
    - "Audio system (music, sound effects)"
    - "Input handling (mouse, keyboard)"
    - "Performance monitoring (FPS, memory)"
    
  failure_modes_to_prevent:
    - "Inconsistent state between components"
    - "Asset loading blocking user interaction"
    - "Memory leaks from frequent transitions"
    - "Broken integration when one component changes"
    
  testing_requirements:
    - "Component isolation testing"
    - "Integration flow testing"
    - "Performance testing with multiple transitions"
    - "Error recovery testing"

# Cross-System Relationships
cross_references:
  related_systems:
    - "activity-framework" # Provides activity content and reward logic
    - "visual-design" # Defines art direction and aesthetic guidelines
    - "mentors" # Provides character data and dialogue content
    - "game-constants" # Time system and interaction mechanics
    
  content_files:
    - "content/interfaces/activity-interface.md" # Narrative design philosophy
    - "content/visual-design-philosophy.md" # Art direction guidance
    - "content/mentors/mentor-philosophies.md" # Character personality details
    
  implementation_dependencies:
    - "Game engine scene management system"
    - "Asset loading and caching system"
    - "Input handling framework"
    - "UI rendering and animation system"

# Development Notes (Luke's Context)
development_context:
  current_status: "Single system architecture - HospitalBackdrop is primary system, legacy code removed"
  current_focus_areas:
    - "Content expansion - physics office showcase complete, other rooms ready for backgrounds"
    - "Animation polish - reaction system operational, ready for additional effects"
    - "Educational content - dialogue framework ready for tutorial implementation"
  decision_points: "Content expansion using working system foundation"
  immediate_blockers: []
  ready_to_work_on:
    - "Additional room backgrounds (treatment room, dosimetry lab, simulation suite)"
    - "Extended dialogue content for existing rooms"
    - "Tutorial system implementation using dialogue foundation"
    - "Additional reaction symbols and animation effects"
  inspiration: "Professional medical simulation through authentic workplace interfaces"
  constraints: "First-time game development, learning as we go"
  success_metrics: "Professional simulation quality, seamless transitions, production-ready polish"
  technical_achievements:
    - "Complete legacy system removal with 99% code reduction in DayPhase"
    - "Room background integration system with layered depth effects"
    - "Complete reaction animation framework with auto-triggering"
    - "Custom pixel art integration pipeline operational"
    - "Scene-based navigation with state preservation and smooth transitions"
    - "Interactive hospital backdrop with professional-grade visual polish"
    - "Bridge adapters connecting new and existing systems without breaking changes"
    - "Pixel-perfect character portrait rendering system ready for asset integration" 