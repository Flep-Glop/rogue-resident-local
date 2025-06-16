# Activity Interface System - Design Discussion

> **What we're building**: Multi-component interface system for hospital exploration and activity interactions  
> **Core philosophy**: Clear distinction between narrative vs challenge interactions  
> **Why it matters**: Professional medical simulation through authentic workplace interfaces


---

## 📍 SOURCE CONTEXT

**Source Repository**: rogue-resident-docs  
**Generated At**: 2025-06-16 14:01:35  
**Self-Contained**: Yes - all referenced content embedded below


---

## 🎮 The Player Experience

### What Players Will Do


**Hospital Exploration**  
Player navigates isometric hospital view
- Player actions: Navigate view, observe available activities, read room descriptions


**Room Selection**  
Player clicks on available activity rooms
- Player actions: Click room, view activity preview, confirm selection


**Activity Type Detection**  
System determines narrative vs challenge content
- Player actions: Wait for transition, observe interface change


**Activity Experience**  
Player engages with appropriate dialogue system
- Player actions: Read dialogue, make choices, respond to challenges



### Why This Flow Matters
The **Clear distinction between narrative vs challenge interactions** ensures players always understand what mode they're in - whether they're exploring, learning story context, or being challenged academically.

---

## 🎯 Design Goals & Current Status

**Where we are**: Single system architecture - HospitalBackdrop is primary system, legacy code removed  
**What we're deciding**: Content expansion using working system foundation  
**Success looks like**: Professional simulation quality, seamless transitions, production-ready polish

**Our constraint**: First-time game development, learning as we go - and that's exactly why this modular approach works!

---

## 🏗️ The Four Key Components


### Hospital Backdrop System
*Primary exploration interface*

**The experience**: Primary exploration interface  
**Development status**: implemented_and_working





---

### Room Transition System
*Seamless mode switching*

**The experience**: Seamless mode switching  
**Development status**: implemented_and_working





---

### Narrative Dialogue System
*Story and character development*

**The experience**: Story and character development  
**Development status**: implemented_and_working


**What makes it special**:

- **Retroactive_viewing**: Click previous dialogue to view with fade effect

- **Emotional_portraits**: Portrait changes based on conversation context

- **Choice_consequences**: Dialogue choices affect mentor relationships





---

### Room Background Integration System
*Immersive environmental context for dialogue*

**The experience**: Immersive environmental context for dialogue  
**Development status**: implemented_and_working





---

### Complete Reaction Animation System
*Dynamic mentor reactions and feedback*

**The experience**: Dynamic mentor reactions and feedback  
**Development status**: implemented_and_working


**What makes it special**:

- **Auto_triggering**: Insight gains (+) → 💡 + bounce, losses (-) → ? + shake

- **Symbol_types**: !, ?, ..., 💡, ⭐ with unique animations

- **Animation_separation**: Positioning transforms separate from animation transforms





---

### Challenge Dialogue System
*Educational activities with social context*

**The experience**: Educational activities with social context  
**Development status**: implemented_and_working


**What makes it special**:

- **Mentor_reactions**: Different mentors react differently to player choices

- **Dynamic_encouragement**: Adaptive support based on performance

- **Clear_mode_distinction**: Visually distinct from narrative dialogue





---


## 🎨 The Asset Vision

**Week 1 Focus**: High-def mentor portraits and basic text box design

**Key visuals we need**:

**Portraits**:

- Dr. Garcia high-def portrait (warm, encouraging expression)

- Dr. Quinn high-def portrait (analytical, inspiring expression)

- Jesse Martinez high-def portrait (practical, direct expression)

- Dr. Kapoor high-def portrait (precise, methodical expression)


**Backgrounds**:

- Physics office interior (whiteboard with equations)

- Treatment room (with linear accelerator visible)

- Dosimetry lab (measurement equipment)

- Simulation suite (CT scanner, planning stations)


**Ui_elements**:

- Text box frame (journal-style design)

- Dialogue choice button designs

- Challenge progress indicators

- Mentor reaction animation sprites



**The progression**: Each week builds on the last, so by week 4 we have "Polish effects and accessibility elements"

---

## 🔗 How It Connects to Everything Else


**This system works with** (see references/ folder for full details):


- **activity-framework** - provides the actual activities and rewards

- **visual-design** - defines the art style and feel

- **mentors** - gives us character personalities and dialogue

- **game-constants** - connects to overall game mechanics


**Integration philosophy**: Each component passes exactly what the next one needs, no more, no less. Clean handoffs = no confusion later.

---

## 💡 Key Design Decisions to Discuss



**Ready to move forward on**:

- **Additional_room_backgrounds**: Room background system proven with physics office, ready for expansion

- **Dialogue_content_expansion**: Physics office has 15+ interactions, other rooms ready for similar content

- **Contextual_enhancements**: Pokemon-style establishing animations framework ready for specific implementations

- **Polish_and_refinement**: Core systems working, ready for professional-grade polish and user experience improvements


---



## 🎭 Character Integration

**The mentors in this system**:
- **Dr. Garcia** - Warm, patient-focused dialogue 
- **Dr. Quinn** - Analytical, inspiring conversations
- **Jesse Martinez** - Direct, practical discussions
- **Dr. Kapoor** - Precise, methodical interactions

Each mentor's personality shines through both the narrative dialogue (story conversations) and challenge dialogue (learning reactions).

---

## 🌟 What Makes This Exciting

**The layered dialogue concept** - text boxes that fade and layer back, letting players review conversation history by clicking back

**Clear mode distinction** - players never wonder "am I in story mode or challenge mode?" 

**Asset-driven development** - we create the visual feel first, then build the tech to support it

**Integration without patchwork** - each component has clear inputs/outputs, preventing future headaches

---

## 🎯 Next Steps for Team Discussion

1. **Review the blocking items above** - what's our approach?
2. **Asset prioritization** - does the week-by-week plan feel right?
3. **Technical unknown resolution** - schedule collaborative sessions for complex decisions
4. **Character voice consistency** - how do mentors feel different in narrative vs challenge modes?

---


## 📚 REFERENCE FILES

**All referenced content available in local files:**

- [`references/activity-framework.md`](references/activity-framework.md)

- [`references/visual-design-philosophy.md`](references/visual-design-philosophy.md)

- [`references/mentors/mentor-philosophies.md`](references/mentors/mentor-philosophies.md)


*Check the references/ folder for complete system details and supporting documentation.*



*This overview focuses on design and player experience with all referenced content embedded inline*  
*Self-contained - no external dependencies required* 