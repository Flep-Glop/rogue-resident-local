# Tutorial Flows

**Source**: `data/interfaces/tutorial-flows.yaml`

system_info:
  name: "Tutorial Flow and Dialogue System"
  description: "Structured tutorial sequences, dialogue examples, and narrative transitions"
  type: "interface_system"
  version: "3.0"
  development_focus: "Player onboarding and tutorial experience"
  user_experience_philosophy: "Seamless introduction to complex systems through narrative integration"
  content_reference: "content/tutorial-design.md"

development_context:
  current_status: "Tutorial system fully implemented with Phase 1 & 2 complete, validated through user testing as 'HUGE step forward'"
  decision_points: "Phase 2.1 refinements identified - popup timing optimization and show vs tell balance"
  inspiration: "Seamless learning through narrative-driven discovery"
  constraints: "Must introduce complex systems without overwhelming new players"
  success_metrics: "Players understand core mechanics within first 30 minutes of gameplay - ACHIEVED through testing"

# Component Structure
components:
  first_day_tutorial:
    name: "First Day Tutorial Sequence"
    user_experience_role: "Initial game introduction and mentor meetings"
    implementation_priority: "complete"
    implementation_status: "implemented_and_working"
    
    technical_requirements:
      dialogue_system: "Mentor introduction sequences and choice handling"
      tutorial_overlays: "Contextual help and progress indicators"
      narrative_flow: "Seamless transitions between tutorial phases"
      
    integration_points:
      incoming: "Player starting new game"
      outgoing: "Transition to main game loop"
      data_dependencies: "Mentor data and initial activity content"
      
    asset_requirements:
      visual_assets:
        - "tutorial_overlay_designs"
        - "progress_indicator_graphics"
        - "first_day_location_backgrounds"
      audio_assets:
        - "tutorial_guidance_sounds"
        - "progression_achievement_audio"

  night_phase_tutorial:
    name: "Night Phase Introduction"
    user_experience_role: "Knowledge constellation and journal system introduction"
    implementation_priority: "complete"
    implementation_status: "implemented_and_working"
    
    technical_requirements:
      constellation_interface: "Star selection and unlock mechanics"
      journal_system: "Card placement and ability management"
      phone_call_system: "Mentor communication during night phase"
      
    integration_points:
      incoming: "Day phase completion"
      outgoing: "Sleep transition to next day"
      data_dependencies: "Day's learning progress and mentor relationships"
      
    asset_requirements:
      visual_assets:
        - "constellation_tutorial_overlays"
        - "journal_interface_tutorials"
        - "phone_call_ui_elements"
      audio_assets:
        - "mentor_phone_call_audio"
        - "constellation_interaction_sounds"

# Tutorial Flow Framework
tutorial_framework:
  introduction_approach: "narrative_integration"
  complexity_progression: "single_concept_introduction"
  transition_style: "character_driven"
  feedback_integration: "immediate_contextual"
  
  core_principles:
    - "mechanics_through_narrative"
    - "progressive_complexity"
    - "natural_transitions"
    - "contextual_learning"
    - "clear_visual_feedback"

# First Day Tutorial Sequence
first_day_tutorial:
  morning_arrival:
    location: "hospital_entrance"
    time: "08:00"
    primary_mentor: "dr_garcia"
    objectives:
      - "establish_setting"
      - "introduce_first_mentor"
      - "provide_initial_agency"
    
    dialogue_flow:
      opening:
        speaker: "dr_garcia"
        text: "You must be our new resident! I'm Dr. Garcia, lead radiation oncologist. Welcome to Westview!"
        choices:
          - option: "Thank you, I'm excited to be here."
            effect: "enthusiastic_response"
          - option: "Nice to meet you. This place is impressive."
            effect: "observational_response"
      
      tour_offer:
        speaker: "dr_garcia"
        text: "We have orientation starting in a bit. I can show you around, or if you prefer, you can explore a little on your own first. What would you like to do?"
        choices:
          - option: "I'd love a tour."
            next_scene: "guided_tour"
          - option: "I'll explore a bit first."
            next_scene: "lobby_exploration"

  first_educational_activity:
    location: "orientation_room"
    time: "10:30"
    mentor: "dr_garcia"
    tutorial_elements:
      - "introduce_insight_mechanic"
      - "first_question_example"
      - "show_progress_feedback"
    
    activity_structure:
      setup:
        speaker: "dr_garcia"
        text: "Let's cover some basics of radiation therapy. This will help you get your bearings in the department."
        tutorial_popup: "Your first educational activity! Answer questions to gain Insight and discover new knowledge."
      
      sample_question:
        type: "multiple_choice"
        question: "What's the primary purpose of a multileaf collimator in a linear accelerator?"
        options:
          - text: "To shape the treatment beam"
            correct: true
          - text: "To filter the beam energy"
            correct: false
          - text: "To measure radiation output"
            correct: false
        
        correct_feedback:
          speaker: "dr_garcia"
          text: "Exactly right! The MLCs allow us to conform the radiation beam to the shape of the target volume."
          tutorial_popup: "You gained 15 Insight! [Icon shows Insight meter filling]"
          explanation: "You've just gained some Insight - think of it as your growing understanding that you can apply during your daily activities."

  lunch_break_dialogue:
    location: "hospital_cafeteria"
    time: "12:15"
    mentor: "dr_quinn"
    objectives:
      - "introduce_second_mentor"
      - "foreshadow_constellation_system"
      - "build_anticipation"
    
    dialogue_flow:
      introduction:
        speaker: "dr_quinn"
        text: "Mind if I join? You must be the new resident! I'm Dr. Quinn, head of Treatment Planning."
        energy: "enthusiastic"
        choices:
          - option: "Nice to meet you, Dr. Quinn."
            effect: "polite_response"
          - option: "I've heard about your work in planning optimization."
            effect: "informed_response"
      
      constellation_preview:
        speaker: "dr_quinn"
        text: "Garcia's probably shown you the clinical side this morning. Planning is where the physics really shines! Have you heard about our Knowledge Constellation approach?"
        choices:
          - option: "No, what's that?"
            response: "It's a way of visualizing how medical physics concepts connect. Rather than isolated facts, we see knowledge as stars forming constellations. You'll see what I mean tonight when you have time to reflect on what you've learned today."
          - option: "Just briefly. I'd like to know more."
            response: "Perfect! It's really about seeing the connections between concepts. Tonight when you get home, you'll have a chance to explore how today's learning fits into the bigger picture."

  first_ability_introduction:
    location: "treatment_planning_lab"
    time: "14:30"
    mentor: "dr_quinn"
    tutorial_elements:
      - "introduce_ability_system"
      - "show_card_mechanics"
      - "connect_day_night_phases"
    
    ability_grant:
      setup:
        speaker: "dr_quinn"
        text: "Before you go today, I want to give you something for your journal."
        action: "hands_over_notes"
        
      explanation:
        speaker: "dr_quinn"
        text: "I've written down a technique called 'Conceptual Mapping' that might help you in your daily work. When you get home tonight, add it to your journal, and you can use it tomorrow."
        tutorial_popup: "You received your first Ability Card! You'll be able to place this in your journal tonight."
        
      ability_details:
        name: "Conceptual Mapping"
        domain: "treatment_planning"
        passive_effect: "Highlight connections between questions and concepts"
        active_effect: "Spend 20 Insight to reveal a related concept during activities"
        usage_explanation: "Tomorrow, when you're in an activity, you can activate this technique by spending some of your accumulated Insight. It's a way to apply what you've learned."

  night_phase_transition:
    location: "hospital_exit"
    time: "17:15"
    mentor: "dr_kapoor"
    objectives:
      - "introduce_third_mentor"
      - "explain_night_phase_purpose"
      - "create_smooth_transition"
    
    transition_dialogue:
      introduction:
        speaker: "dr_kapoor"
        text: "First day complete! I'm Dr. Kapoor, head of Dosimetry. We'll be working together on measurements and quality assurance."
        
      reflection_emphasis:
        speaker: "dr_kapoor"
        text: "The most important part of learning is reflection. When you get home tonight, take some time to think about what you've discovered today. It helps solidify the concepts."
        tutorial_popup: "You're about to transition to your home at Hill House for the Night Phase, where you'll reflect on knowledge gained and prepare for tomorrow."

# Night Phase Tutorial Sequences
night_phase_tutorial:
  observatory_introduction:
    location: "hill_home_observatory"
    time: "19:30"
    day: 1
    guide: "dr_quinn"
    delivery_method: "phone_call"
    
    sequence:
      phone_call_opening:
        speaker: "dr_quinn"
        text: "Hope I'm not calling too late! Just wanted to check how your first day went. Have you had a chance to look at the Knowledge Constellation yet?"
        choices:
          - option: "I was just about to."
            response: "perfect_timing"
          - option: "Not yet, could you remind me how it works?"
            response: "explanation_needed"
      
      constellation_explanation:
        speaker: "dr_quinn"
        text: "The constellation map should be right in front of you. Those glowing points? Each represents something you learned today."
        tutorial_popup: "This is your Knowledge Constellation. Stars represent medical physics concepts you've discovered."
        visual_cue: "highlight_three_glowing_points"
        
      first_interaction:
        speaker: "dr_quinn"
        text: "Try selecting one of those stars. That's knowledge you discovered today."
        tutorial_popup: "Use Star Points (SP) to unlock stars you've discovered. You earned 3 SP today."
        guided_action: "select_star_unlock"

  journal_system_introduction:
    location: "hill_home_study"
    time: "20:15"
    day: 1
    guide: "dr_garcia"
    delivery_method: "text_message"
    
    sequence:
      text_reminder:
        speaker: "dr_garcia"
        message: "Don't forget to check your journal before tomorrow! The technique I mentioned should help with your morning activities."
        
      journal_tutorial:
        tutorial_popup: "This is your Journal. It holds the Abilities you can use during daily activities."
        visual_display: "empty_slots_with_available_card"
        guided_action: "drag_card_to_slot"
        
      card_placement:
        tutorial_popup: "This ability is now equipped for tomorrow. You can have up to 3 abilities equipped at once as you progress."
        card_details:
          name: "Conceptual Mapping"
          passive_effect: "Highlights connections between related questions"
          active_effect: "Spend 20 Insight to reveal a related concept (once per day)"
          domain: "treatment_planning"

  sleep_transition:
    location: "hill_home_bedroom"
    time: "21:30"
    day: 1
    
    sequence:
      reflection_moment:
        text: "Your first day at Westview Medical has introduced you to the fundamentals of radiation therapy and treatment planning. Tomorrow will bring new challenges and opportunities to expand your knowledge."
        
      preparation_summary:
        knowledge: "1 star unlocked (Radiation Beam Properties)"
        journal: "1 ability equipped (Conceptual Mapping)"
        tomorrow: "Morning session with Dr. Kapoor scheduled"
        
      final_choices:
        - option: "Get some rest"
          action: "advance_to_next_day"
        - option: "Review constellation one more time"
          action: "return_to_observatory"

# Day Structure Examples
day_structure_examples:
  modified_day_structure:
    morning_brief:
      location: "player_office"
      time: "08:05"
      day: 4
      
      sequence:
        calendar_notification:
          display: "Linac QA session with Technician Jesse at 10:00. TPS review with Dr. Quinn at 14:00. Open slot remaining."
          
        mentor_interaction:
          speaker: "dr_garcia"
          context: "pokes_head_in_door"
          text: "Morning! We've got a challenging case today - breast treatment with regional nodes. Perfect chance to use that dosimetric evaluation technique you've been studying."
          ability_reminder: "Your journal contains 'Dose Distribution Analysis' which can help evaluate complex treatment plans."
          
        schedule_display:
          block_1: 
            time: "8:30-11:30"
            status: "select_activity"
          block_2:
            time: "12:00-15:00"
            activity: "TPS Review with Dr. Quinn"
            status: "scheduled"
          block_3:
            time: "15:30-17:00"
            activity: "Linac QA with Technician Jesse"
            status: "scheduled"

    activity_transition:
      location: "treatment_planning_lab"
      time: "14:55"
      
      completion_summary:
        insight_gained: 45
        momentum_level: 3
        new_concepts: ["Dose Volume Constraints"]
        relationship_change: "Dr. Quinn (+1)"
        
      transition_dialogue:
        speaker: "dr_quinn"
        text: "Great work on optimizing that plan. Jesse mentioned needing your help with the monthly QA checks. You should head over to the Linac room."
        
      player_choices:
        - option: "Head to Linac Room now"
          action: "begin_next_scheduled_activity"
        - option: "Take a short break first"
          action: "short_dialogue_scene_before_next_activity"

    day_conclusion:
      location: "player_office"
      time: "17:10"
      
      mentor_debrief:
        speaker: "dr_kapoor"
        text: "Heard you helped with the Linac QA. Finding your way around the equipment is crucial. How are you feeling about the dosimetry concepts so far?"
        choices:
          - option: "I'm starting to connect the principles to practical applications."
            mentor_response: "guided_learning_response"
          - option: "Still working on understanding some of the detector responses."
            mentor_response: "supportive_encouragement"
          - option: "The calibration protocols make a lot of sense to me."
            mentor_response: "positive_reinforcement"
            
      day_summary:
        activities_completed: 3
        total_insight_gained: 105
        new_knowledge: "2 concepts discovered"
        sp_earned: 4

# Tutorial Design Principles
tutorial_design_principles:
  narrative_continuity:
    description: "All mechanics introduced through character interactions"
    implementation: "mentor_guided_discovery"
    
  progressive_complexity:
    description: "Systems introduced one at a time with clear tutorials"
    implementation: "single_concept_focus_per_interaction"
    
  natural_transitions:
    description: "Day and night phases flow together through narrative bridges"
    implementation: "character_driven_scene_transitions"
    
  contextual_learning:
    description: "Educational content framed within meaningful narrative"
    implementation: "mentor_expertise_alignment"
    
  visual_feedback:
    description: "Clear UI elements show progress and accomplishments"
    implementation: "immediate_progress_indicators"
    
  flexible_structure:
    description: "Activity blocks provide structure while maintaining player agency"
    implementation: "scheduled_and_flexible_activity_mix"

# User Experience Flow
user_experience_flow:
  tutorial_introduction:
    name: "Game Introduction"
    description: "Player starts first day and meets mentors"
    user_actions: ["Listen to mentor introductions", "Make dialogue choices", "Observe hospital environment"]
    system_requirements: ["Dialogue rendering", "Choice tracking", "Mentor personality display"]
    
  learning_activities:
    name: "First Activities"
    description: "Player participates in guided learning activities"
    user_actions: ["Answer tutorial questions", "Gain insight points", "Unlock first ability"]
    system_requirements: ["Question system", "Progress tracking", "Ability card introduction"]
    
  night_phase_transition:
    name: "Evening Reflection"
    description: "Player explores constellation and journal systems"
    user_actions: ["Unlock first star", "Place ability in journal", "Prepare for next day"]
    system_requirements: ["Constellation interface", "Journal management", "Save progression"]

# Development Priorities
development_priorities:
  completed_implementations:
    - component: "first_day_tutorial"
      status: "Implemented - Phase 1 & 2 tutorial system complete"
      achievement: "Seamless narrative-driven onboarding with mentor conversations and tutorial progression"
      technical_files: ["app/data/day1Dialogues.ts", "app/components/hospital/HospitalBackdrop.tsx", "tutorialDialogues.ts"]
      user_validation: "User testing confirmed 'HUGE step forward' in player onboarding experience"
      
    - component: "night_phase_tutorial"
      status: "Implemented - Constellation and journal tutorials operational"
      achievement: "Tutorial-specific dialogue system with smart room routing and step progression"
      technical_files: ["Tutorial infrastructure with overlays, state management, debug controls"]
      user_validation: "Console logs confirm all major systems working correctly"
      
  ready_to_implement:
    - component: "phase_2_1_refinements"
      reason: "User testing identified specific UX improvements for tutorial flow"
      priority: "medium"
      specific_needs:
        - "Popup timing optimization - better contextual timing"
        - "Show vs tell balance - reduce explicit instruction overlays"
        - "Pacing improvements - better spacing of tutorial guidance"
      technical_context: "Core tutorial system working, ready for polish and refinement"

# Integration Points
integration_points:
  data_flow:
    - "game_start -> first_day_tutorial: new_player_state, initial_mentors"
    - "tutorial_completion -> main_game: unlocked_abilities, mentor_relationships"
    - "day_completion -> night_tutorial: learning_progress, available_stars"
    - "night_completion -> next_day: equipped_abilities, progression_state"
    
  shared_dependencies:
    - "Mentor character data and dialogue content"
    - "Activity framework for tutorial questions"
    - "Knowledge constellation for star unlock tutorials"
    - "Journal system for ability management tutorials"
    
  failure_modes_to_prevent:
    - "Tutorial sequences that overwhelm new players"
    - "Incomplete tutorial state causing confusion"
    - "Tutorial progression blocking main game access"
    - "Inconsistent mentor personality in tutorial vs main game"

# Asset Pipeline
asset_pipeline:
  asset_creation_order:
    week_1: "Tutorial overlay UI elements and progress indicators"
    week_2: "First day hospital locations and mentor introduction visuals"
    week_3: "Night phase tutorial elements (constellation, journal)"
    week_4: "Polish, accessibility, and tutorial completion celebrations"
    
  immediate_needs:
    ui_elements:
      - "Tutorial overlay designs with clear visual hierarchy"
      - "Progress indicators showing tutorial completion"
      - "Interactive hotspots for clickable tutorial elements"
      - "Phone call UI for mentor guidance during night phase"
    
    visual_assets:
      - "Hospital orientation tour backgrounds"
      - "Mentor introduction portrait variations"
      - "Knowledge constellation tutorial overlays"
      - "Journal card placement visual guides"
    
    audio:
      - "Tutorial progression success sounds"
      - "Mentor guidance audio cues"
      - "First day completion celebration audio"

cross_references:
  related_documents:
    - "data/mentors/mentors.yaml"
    - "data/stars/stars-definitions.yaml"
    - "data/constants/game-constants.yaml"
  export_templates:
    - "claude-context"
    - "cursor-dev"
    - "tutorial-reference" 