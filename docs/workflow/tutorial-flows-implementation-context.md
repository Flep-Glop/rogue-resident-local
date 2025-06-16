# Tutorial Flow and Dialogue System - Implementation Context

**System Type**: interface_system  
**Development Focus**: Player onboarding and tutorial experience  
**Generated for**: Focused implementation of Comprehensive tutorial sequences defined, integration with game systems needed


---

## 📍 REPOSITORY CONTEXT

**Source Repository**: rogue-resident-docs  
**Base Path**: /Users/lukelussier/Documents/GitHub/rogue-resident-docs  
**Generated At**: 2025-06-16 14:01:37  
**Self-Contained**: True

*This document contains all referenced content embedded inline - no external dependencies required.*


---

## 🎯 IMPLEMENTATION OVERVIEW

Structured tutorial sequences, dialogue examples, and narrative transitions

**User Experience Philosophy**: Seamless introduction to complex systems through narrative integration  
**Current Development Status**: Comprehensive tutorial sequences defined, integration with game systems needed  
**Key Decision Points**: Tutorial pacing and narrative integration implementation

---

## 🏗️ COMPONENT ARCHITECTURE


### First Day Tutorial Sequence

**Role in System**: Initial game introduction and mentor meetings  
**Implementation Priority**:   
**Current Status**: clear_requirements



**Technical Requirements:**

- **dialogue_system**: Mentor introduction sequences and choice handling

- **tutorial_overlays**: Contextual help and progress indicators

- **narrative_flow**: Seamless transitions between tutorial phases


**Data Flow:**

- **Input**: Player starting new game


- **Output**: Transition to main game loop


- **Dependencies**: Mentor data and initial activity content




---

### Night Phase Introduction

**Role in System**: Knowledge constellation and journal system introduction  
**Implementation Priority**:   
**Current Status**: clear_requirements



**Technical Requirements:**

- **constellation_interface**: Star selection and unlock mechanics

- **journal_system**: Card placement and ability management

- **phone_call_system**: Mentor communication during night phase


**Data Flow:**

- **Input**: Day phase completion


- **Output**: Sleep transition to next day


- **Dependencies**: Day's learning progress and mentor relationships




---



## 🎓 DETAILED TUTORIAL IMPLEMENTATION SPECIFICATIONS


### 📅 First Day Tutorial Implementation


#### Morning arrival Implementation

**Scene Configuration:**

- **Location**: `hospital_entrance` (existing hospital scene)


- **Time**: 08:00


- **Mentor**: dr_garcia (from mentor data)



**Tutorial Objectives** (for progress tracking):

- `establish_setting`: Boolean flag for completion tracking

- `introduce_first_mentor`: Boolean flag for completion tracking

- `provide_initial_agency`: Boolean flag for completion tracking




**Dialogue Implementation** (extends existing dialogue system):
```javascript
// Sample dialogue data structure for morning_arrival

"opening": {
  speaker: "dr_garcia",
  text: "You must be our new resident! I'm Dr. Garcia, lead radiation oncologist. Welcome to Westview!",

  choices: [

    {
      option: "Thank you, I'm excited to be here.",
      effect: "enthusiastic_response"
    },

    {
      option: "Nice to meet you. This place is impressive.",
      effect: "observational_response"
    }

  ]

},

"tour_offer": {
  speaker: "dr_garcia",
  text: "We have orientation starting in a bit. I can show you around, or if you prefer, you can explore a little on your own first. What would you like to do?",

  choices: [

    {
      option: "I'd love a tour.",
      effect: "guided_tour"
    },

    {
      option: "I'll explore a bit first.",
      effect: "lobby_exploration"
    }

  ]

}

```










---

#### First educational activity Implementation

**Scene Configuration:**

- **Location**: `orientation_room` (existing hospital scene)


- **Time**: 10:30


- **Mentor**: dr_garcia (from mentor data)







**UI Tutorial Elements** (overlay on existing scenes):

- `introduce_insight_mechanic`: Interactive overlay component

- `first_question_example`: Interactive overlay component

- `show_progress_feedback`: Interactive overlay component




**Activity Integration** (with existing activity framework):

- **Setup**: 
  - Speaker: dr_garcia
  - Text: "Let's cover some basics of radiation therapy. This will help you get your bearings in the department."

  - Tutorial Popup: "Your first educational activity! Answer questions to gain Insight and discover new knowledge."


- **Sample_question**: 
  - Speaker: 
  - Text: ""








---

#### Lunch break dialogue Implementation

**Scene Configuration:**

- **Location**: `hospital_cafeteria` (existing hospital scene)


- **Time**: 12:15


- **Mentor**: dr_quinn (from mentor data)



**Tutorial Objectives** (for progress tracking):

- `introduce_second_mentor`: Boolean flag for completion tracking

- `foreshadow_constellation_system`: Boolean flag for completion tracking

- `build_anticipation`: Boolean flag for completion tracking




**Dialogue Implementation** (extends existing dialogue system):
```javascript
// Sample dialogue data structure for lunch_break_dialogue

"introduction": {
  speaker: "dr_quinn",
  text: "Mind if I join? You must be the new resident! I'm Dr. Quinn, head of Treatment Planning.",

  choices: [

    {
      option: "Nice to meet you, Dr. Quinn.",
      effect: "polite_response"
    },

    {
      option: "I've heard about your work in planning optimization.",
      effect: "informed_response"
    }

  ]

},

"constellation_preview": {
  speaker: "dr_quinn",
  text: "Garcia's probably shown you the clinical side this morning. Planning is where the physics really shines! Have you heard about our Knowledge Constellation approach?",

  choices: [

    {
      option: "No, what's that?",
      effect: "continue"
    },

    {
      option: "Just briefly. I'd like to know more.",
      effect: "continue"
    }

  ]

}

```










---

#### First ability introduction Implementation

**Scene Configuration:**

- **Location**: `treatment_planning_lab` (existing hospital scene)


- **Time**: 14:30


- **Mentor**: dr_quinn (from mentor data)







**UI Tutorial Elements** (overlay on existing scenes):

- `introduce_ability_system`: Interactive overlay component

- `show_card_mechanics`: Interactive overlay component

- `connect_day_night_phases`: Interactive overlay component








**Ability System Integration**:
```javascript
// Ability card data structure
{
  name: "Conceptual Mapping",
  domain: "treatment_planning",
  passiveEffect: "Highlight connections between questions and concepts",
  activeEffect: "Spend 20 Insight to reveal a related concept during activities",
  usageExplanation: "Tomorrow, when you're in an activity, you can activate this technique by spending some of your accumulated Insight. It's a way to apply what you've learned."
}
```


---

#### Night phase transition Implementation

**Scene Configuration:**

- **Location**: `hospital_exit` (existing hospital scene)


- **Time**: 17:15


- **Mentor**: dr_kapoor (from mentor data)



**Tutorial Objectives** (for progress tracking):

- `introduce_third_mentor`: Boolean flag for completion tracking

- `explain_night_phase_purpose`: Boolean flag for completion tracking

- `create_smooth_transition`: Boolean flag for completion tracking













---




### 🌙 Night Phase Tutorial Implementation


#### Observatory introduction Implementation

**Scene Configuration:**

- **Location**: `hill_home_observatory` (Hill House scene)


- **Time**: 19:30


- **Guide**: dr_quinn (mentor reference)


- **Delivery Method**: `phone_call` UI component



**Implementation Sequence**:

```javascript
// Phone call opening implementation
{
  type: "phone_call_opening",

  speaker: "dr_quinn",
  text: "Hope I'm not calling too late! Just wanted to check how your first day went. Have you had a chance to look at the Knowledge Constellation yet?",




  choices: [

    { option: "I was just about to.", action: "" },

    { option: "Not yet, could you remind me how it works?", action: "" }

  ]

}
```

```javascript
// Constellation explanation implementation
{
  type: "constellation_explanation",

  speaker: "dr_quinn",
  text: "The constellation map should be right in front of you. Those glowing points? Each represents something you learned today.",


  tutorialPopup: "This is your Knowledge Constellation. Stars represent medical physics concepts you've discovered.",



}
```

```javascript
// First interaction implementation
{
  type: "first_interaction",

  speaker: "dr_quinn",
  text: "Try selecting one of those stars. That's knowledge you discovered today.",


  tutorialPopup: "Use Star Points (SP) to unlock stars you've discovered. You earned 3 SP today.",


  guidedAction: "select_star_unlock",


}
```



---

#### Journal system introduction Implementation

**Scene Configuration:**

- **Location**: `hill_home_study` (Hill House scene)


- **Time**: 20:15


- **Guide**: dr_garcia (mentor reference)


- **Delivery Method**: `text_message` UI component



**Implementation Sequence**:

```javascript
// Text reminder implementation
{
  type: "text_reminder",

  speaker: "dr_garcia",
  message: "Don't forget to check your journal before tomorrow! The technique I mentioned should help with your morning activities.",




}
```

```javascript
// Journal tutorial implementation
{
  type: "journal_tutorial",


  tutorialPopup: "This is your Journal. It holds the Abilities you can use during daily activities.",


  guidedAction: "drag_card_to_slot",


}
```

```javascript
// Card placement implementation
{
  type: "card_placement",


  tutorialPopup: "This ability is now equipped for tomorrow. You can have up to 3 abilities equipped at once as you progress.",



}
```



---

#### Sleep transition Implementation

**Scene Configuration:**

- **Location**: `hill_home_bedroom` (Hill House scene)


- **Time**: 21:30





**Implementation Sequence**:

```javascript
// Reflection moment implementation
{
  type: "reflection_moment",




}
```

```javascript
// Preparation summary implementation
{
  type: "preparation_summary",




}
```

```javascript
// Final choices implementation
{
  type: "final_choices",




}
```



---



**Integration Requirements:**
- Tutorial state management (persist progress across scenes)
- Overlay UI system for contextual help
- Progress indicators and completion tracking
- Skip/replay functionality for returning players



## 🔧 IMPLEMENTATION PATTERNS

### Data Flow Architecture

```
game_start -> first_day_tutorial: new_player_state, initial_mentors
```

```
tutorial_completion -> main_game: unlocked_abilities, mentor_relationships
```

```
day_completion -> night_tutorial: learning_progress, available_stars
```

```
night_completion -> next_day: equipped_abilities, progression_state
```


### Shared System Dependencies

- Mentor character data and dialogue content

- Activity framework for tutorial questions

- Knowledge constellation for star unlock tutorials

- Journal system for ability management tutorials


### Error Prevention Checklist

- [ ] Prevent: Tutorial sequences that overwhelm new players

- [ ] Prevent: Incomplete tutorial state causing confusion

- [ ] Prevent: Tutorial progression blocking main game access

- [ ] Prevent: Inconsistent mentor personality in tutorial vs main game


---

## 🎨 ASSET SPECIFICATIONS



### First Day Tutorial Sequence Assets


**Visual Assets Required:**

- `tutorial_overlay_designs`

- `progress_indicator_graphics`

- `first_day_location_backgrounds`




**Audio Assets Required:**

- `tutorial_guidance_sounds`

- `progression_achievement_audio`





### Night Phase Introduction Assets


**Visual Assets Required:**

- `constellation_tutorial_overlays`

- `journal_interface_tutorials`

- `phone_call_ui_elements`




**Audio Assets Required:**

- `mentor_phone_call_audio`

- `constellation_interaction_sounds`





**Asset Creation Priority**: Tutorial overlay UI elements and progress indicators

---

## 📋 TESTING REQUIREMENTS



---

## 🔗 REFERENCE DATA







### Engine Dependencies


---

## 💡 IMPLEMENTATION STRATEGY

**Development Approach**: Must introduce complex systems without overwhelming new players  
**Success Criteria**: Players understand core mechanics within first 30 minutes of gameplay  
**Core Inspiration**: Seamless learning through narrative-driven discovery

### Recommended Implementation Order

**1. First_day_tutorial**
- Rationale: Complete dialogue sequences defined, ready for implementation
- Asset Dependency: 

**2. Night_phase_tutorial**
- Rationale: Knowledge constellation system exists, needs tutorial guidance
- Asset Dependency: 


### Blocking Items to Resolve First


---

## 🎮 USER EXPERIENCE SPECIFICATION


### Game Introduction
Player starts first day and meets mentors

**User Actions:**

- Listen to mentor introductions

- Make dialogue choices

- Observe hospital environment


**System Requirements:**

- Dialogue rendering

- Choice tracking

- Mentor personality display


---

### First Activities
Player participates in guided learning activities

**User Actions:**

- Answer tutorial questions

- Gain insight points

- Unlock first ability


**System Requirements:**

- Question system

- Progress tracking

- Ability card introduction


---

### Evening Reflection
Player explores constellation and journal systems

**User Actions:**

- Unlock first star

- Place ability in journal

- Prepare for next day


**System Requirements:**

- Constellation interface

- Journal management

- Save progression


---


## 📋 IMPLEMENTATION CHECKLIST

**Before Starting:**
- [ ] All blocking technical unknowns resolved
- [ ] Required assets identified and prioritized
- [ ] Integration points clearly defined
- [ ] Testing strategy planned

**During Implementation:**
- [ ] Component isolation maintained
- [ ] Data flow documented and tested
- [ ] Error handling implemented
- [ ] Performance monitoring in place

**Before Integration:**
- [ ] Unit tests passing
- [ ] Integration points verified
- [ ] Error recovery tested
- [ ] Performance benchmarks met

---


---

*This implementation context is self-contained with all referenced content embedded inline.*  
*Generated from structured YAML data with full content integration.*  
*No external file dependencies required for implementation.*
 