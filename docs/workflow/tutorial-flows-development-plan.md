# Tutorial Flow and Dialogue System - Development Plan

> **Focus**: Player onboarding and tutorial experience  
> **Philosophy**: Seamless introduction to complex systems through narrative integration  
> **Status**: Comprehensive tutorial sequences defined, integration with game systems needed


---

## 📍 SOURCE CONTEXT

**Source Repository**: rogue-resident-docs  
**Generated At**: 2025-06-16 14:01:37  
**Self-Contained**: Yes - all referenced files embedded below


---

## 🔥 IMMEDIATE ACTIONS (Triage-Style)



### 🚨 **BLOCKING ITEMS** (Resolve First)

🎉 **No blocking items!** All critical technical unknowns have been resolved.



### ⚡ **READY TO IMPLEMENT** (High Impact)

**First day tutorial**
- **WHY NOW**: Complete dialogue sequences defined, ready for implementation

- **PRIORITY**: HIGH


- **SPECIFIC NEEDS**:

  - Tutorial overlay UI components

  - Mentor introduction dialogue integration

  - Progress tracking visual feedback



- **TECHNICAL CONTEXT**: Hospital backdrop and dialogue systems ready for tutorial overlay


- **GO/NO-GO**: 🔥 HIGH PRIORITY - Ready to start


**Night phase tutorial**
- **WHY NOW**: Knowledge constellation system exists, needs tutorial guidance

- **PRIORITY**: HIGH


- **SPECIFIC NEEDS**:

  - Interactive tutorial overlays for star selection

  - Journal card placement tutorials

  - Phone call UI for mentor guidance



- **TECHNICAL CONTEXT**: Night phase systems implemented, need user guidance


- **GO/NO-GO**: 🔥 HIGH PRIORITY - Ready to start



---

## 🎨 ASSET PIPELINE (Asset-First Workflow)





### **Week 1 Priority**
Tutorial overlay UI elements and progress indicators

**Immediate Asset Needs:**

**Ui_elements:**

- Tutorial overlay designs with clear visual hierarchy

- Progress indicators showing tutorial completion

- Interactive hotspots for clickable tutorial elements

- Phone call UI for mentor guidance during night phase


**Visual_assets:**

- Hospital orientation tour backgrounds

- Mentor introduction portrait variations

- Knowledge constellation tutorial overlays

- Journal card placement visual guides


**Audio:**

- Tutorial progression success sounds

- Mentor guidance audio cues

- First day completion celebration audio





**⏭️ Future Weeks:**
- **Week 2**: First day hospital locations and mentor introduction visuals
- **Week 3**: Night phase tutorial elements (constellation, journal)
- **Week 4**: Polish, accessibility, and tutorial completion celebrations

---

## 🔧 COMPONENT IMPLEMENTATION GUIDE


### First Day Tutorial Sequence

**UX Role**: Initial game introduction and mentor meetings  
**Status**: clear_requirements  
**Priority**: 







**Implementation Requirements:**

- **Dialogue_system**: Mentor introduction sequences and choice handling

- **Tutorial_overlays**: Contextual help and progress indicators

- **Narrative_flow**: Seamless transitions between tutorial phases


**Asset Dependencies:**

*Visual:* tutorial_overlay_designs, progress_indicator_graphics, first_day_location_backgrounds


*Audio:* tutorial_guidance_sounds, progression_achievement_audio


**Integration Points:**

- **Receives data from**: Player starting new game


- **Sends data to**: Transition to main game loop


- **Dependencies**: Mentor data and initial activity content




---

### Night Phase Introduction

**UX Role**: Knowledge constellation and journal system introduction  
**Status**: clear_requirements  
**Priority**: 







**Implementation Requirements:**

- **Constellation_interface**: Star selection and unlock mechanics

- **Journal_system**: Card placement and ability management

- **Phone_call_system**: Mentor communication during night phase


**Asset Dependencies:**

*Visual:* constellation_tutorial_overlays, journal_interface_tutorials, phone_call_ui_elements


*Audio:* mentor_phone_call_audio, constellation_interaction_sounds


**Integration Points:**

- **Receives data from**: Day phase completion


- **Sends data to**: Sleep transition to next day


- **Dependencies**: Day's learning progress and mentor relationships




---



## 🎓 DETAILED TUTORIAL SEQUENCES


### 📅 First Day Tutorial Sequence


#### Morning arrival


**Location**: hospital_entrance  


**Time**: 08:00  


**Mentor**: dr_garcia  



**Objectives**:

- Establish Setting

- Introduce First Mentor

- Provide Initial Agency




**Dialogue Flow**:

- **Opening** (dr_garcia): "You must be our new resident! I'm Dr. Garcia, lead radiation oncologist. Welcome to Westview!"

  - Player Choices:

    - "Thank you, I'm excited to be here." → enthusiastic_response

    - "Nice to meet you. This place is impressive." → observational_response



- **Tour_offer** (dr_garcia): "We have orientation starting in a bit. I can show you around, or if you prefer, you can explore a little on your own first. What would you like to do?"

  - Player Choices:

    - "I'd love a tour." → guided_tour

    - "I'll explore a bit first." → lobby_exploration













---

#### First educational activity


**Location**: orientation_room  


**Time**: 10:30  


**Mentor**: dr_garcia  







**Tutorial Elements**:

- Introduce Insight Mechanic

- First Question Example

- Show Progress Feedback




**Activity Structure**:

- **Setup**: dr_garcia - "Let's cover some basics of radiation therapy. This will help you get your bearings in the department."

  - Tutorial: Your first educational activity! Answer questions to gain Insight and discover new knowledge.


- **Sample_question**:  - ""








---

#### Lunch break dialogue


**Location**: hospital_cafeteria  


**Time**: 12:15  


**Mentor**: dr_quinn  



**Objectives**:

- Introduce Second Mentor

- Foreshadow Constellation System

- Build Anticipation




**Dialogue Flow**:

- **Introduction** (dr_quinn): "Mind if I join? You must be the new resident! I'm Dr. Quinn, head of Treatment Planning."

  - Player Choices:

    - "Nice to meet you, Dr. Quinn." → polite_response

    - "I've heard about your work in planning optimization." → informed_response



- **Constellation_preview** (dr_quinn): "Garcia's probably shown you the clinical side this morning. Planning is where the physics really shines! Have you heard about our Knowledge Constellation approach?"

  - Player Choices:

    - "No, what's that?" → Continue

    - "Just briefly. I'd like to know more." → Continue













---

#### First ability introduction


**Location**: treatment_planning_lab  


**Time**: 14:30  


**Mentor**: dr_quinn  







**Tutorial Elements**:

- Introduce Ability System

- Show Card Mechanics

- Connect Day Night Phases








**Ability Introduction**:
- **Setup**: Before you go today, I want to give you something for your journal.
- **Explanation**: I've written down a technique called 'Conceptual Mapping' that might help you in your daily work. When you get home tonight, add it to your journal, and you can use it tomorrow.

- **Ability**: Conceptual Mapping
  - Domain: treatment_planning
  - Passive: Highlight connections between questions and concepts
  - Active: Spend 20 Insight to reveal a related concept during activities



---

#### Night phase transition


**Location**: hospital_exit  


**Time**: 17:15  


**Mentor**: dr_kapoor  



**Objectives**:

- Introduce Third Mentor

- Explain Night Phase Purpose

- Create Smooth Transition













---




### 🌙 Night Phase Tutorial Sequence


#### Observatory introduction


**Location**: hill_home_observatory  


**Time**: 19:30  


**Guide**: dr_quinn  


**Delivery**: Phone call  



**Sequence**:

- **Phone call opening**:

  - dr_quinn: "Hope I'm not calling too late! Just wanted to check how your first day went. Have you had a chance to look at the Knowledge Constellation yet?"




  - Player Choices:

    - "I was just about to." → 

    - "Not yet, could you remind me how it works?" → 



- **Constellation explanation**:

  - dr_quinn: "The constellation map should be right in front of you. Those glowing points? Each represents something you learned today."


  - Tutorial: This is your Knowledge Constellation. Stars represent medical physics concepts you've discovered.




- **First interaction**:

  - dr_quinn: "Try selecting one of those stars. That's knowledge you discovered today."


  - Tutorial: Use Star Points (SP) to unlock stars you've discovered. You earned 3 SP today.


  - Guided Action: Select Star Unlock





---

#### Journal system introduction


**Location**: hill_home_study  


**Time**: 20:15  


**Guide**: dr_garcia  


**Delivery**: Text message  



**Sequence**:

- **Text reminder**:

  - dr_garcia: "Don't forget to check your journal before tomorrow! The technique I mentioned should help with your morning activities."





- **Journal tutorial**:


  - Tutorial: This is your Journal. It holds the Abilities you can use during daily activities.


  - Guided Action: Drag Card To Slot



- **Card placement**:


  - Tutorial: This ability is now equipped for tomorrow. You can have up to 3 abilities equipped at once as you progress.






---

#### Sleep transition


**Location**: hill_home_bedroom  


**Time**: 21:30  





**Sequence**:

- **Reflection moment**:





- **Preparation summary**:





- **Final choices**:







---





## 🔗 INTEGRATION STRATEGY (Anti-Patchwork)

### **Data Flow Architecture**

game_start -> first_day_tutorial: new_player_state, initial_mentors

tutorial_completion -> main_game: unlocked_abilities, mentor_relationships

day_completion -> night_tutorial: learning_progress, available_stars

night_completion -> next_day: equipped_abilities, progression_state


### **Shared Dependencies** (Plan for these)

- Mentor character data and dialogue content

- Activity framework for tutorial questions

- Knowledge constellation for star unlock tutorials

- Journal system for ability management tutorials


### **💥 FAILURE MODES TO PREVENT**

- Tutorial sequences that overwhelm new players

- Incomplete tutorial state causing confusion

- Tutorial progression blocking main game access

- Inconsistent mentor personality in tutorial vs main game


### **�� Testing Strategy**


---

## 👥 LLM COLLABORATION PREP


**When ready for implementation, gather this context:**

**Core System Files:**


**Narrative Context:**



**Technical Dependencies:**


---

## 📊 DECISION CONTEXT

**Current Status**: Comprehensive tutorial sequences defined, integration with game systems needed  



**Immediate Blockers**: ✅ None! Clear to proceed with high-priority items






**Decision Points**: Tutorial pacing and narrative integration implementation  
**Inspiration**: Seamless learning through narrative-driven discovery  
**Constraints**: Must introduce complex systems without overwhelming new players  
**Success Metrics**: Players understand core mechanics within first 30 minutes of gameplay

---

## 🎯 USER EXPERIENCE FLOW


### Game Introduction
Player starts first day and meets mentors

**User Actions**: Listen to mentor introductions, Make dialogue choices, Observe hospital environment
**System Requirements**: Dialogue rendering, Choice tracking, Mentor personality display


### First Activities
Player participates in guided learning activities

**User Actions**: Answer tutorial questions, Gain insight points, Unlock first ability
**System Requirements**: Question system, Progress tracking, Ability card introduction


### Evening Reflection
Player explores constellation and journal systems

**User Actions**: Unlock first star, Place ability in journal, Prepare for next day
**System Requirements**: Constellation interface, Journal management, Save progression



---



*Generated from structured YAML data with all referenced content embedded inline*
*Self-contained development plan - no external dependencies required* 