# Mentor Relationship System - Design Discussion

> **What we're building**: Complete mentor character system with relationship progression, dialogue, and aptitude bonuses  
> **Core philosophy**: Authentic mentorship relationships that enhance learning through personal connection  
> **Why it matters**: Authentic mentorship relationships drive educational engagement


---

## 📍 SOURCE CONTEXT

**Source Repository**: rogue-resident-docs  
**Generated At**: 2025-06-16 14:01:31  
**Self-Contained**: Yes - all referenced content embedded below


---

## 🎮 The Player Experience

### What Players Will Do


**First Mentor Meeting**  
Player meets mentor in their domain context
- Player actions: Participate in mentor-guided activity, Engage in introductory dialogue, Observe mentor's teaching style


**Ongoing Mentor Interaction**  
Regular activity participation and dialogue
- Player actions: Choose activities with preferred mentors, Engage in relationship-building dialogue, Receive mentor-specific guidance


**Deep Mentor Relationships**  
High-level relationships unlock special content
- Player actions: Access mentor-specific advanced activities, Receive personalized career guidance, Prepare for boss encounters with mentor support



### Why This Flow Matters
The **Authentic mentorship relationships that enhance learning through personal connection** ensures players always understand what mode they're in - whether they're exploring, learning story context, or being challenged academically.

---

## 🎯 Design Goals & Current Status

**Where we are**: Comprehensive mentor definitions complete, integration with activity system needed  
**What we're deciding**: Relationship progression mechanics and dialogue system implementation  
**Success looks like**: Players form meaningful connections that enhance their learning experience

**Our constraint**: Four distinct mentor personalities with different teaching styles - and that's exactly why this modular approach works!

---

## 🏗️ The Four Key Components


### Mentor Character Definitions
*Individual mentor personalities and teaching styles*

**The experience**: Individual mentor personalities and teaching styles  
**Development status**: design_complete


**What makes it special**:

- **Personality_archetypes**: Four distinct teaching and communication styles

- **Domain_specialization**: Each mentor covers different knowledge domains

- **Relationship_progression**: Five-level advancement system with benefits





---

### Relationship Level Management
*Advancement through mentor relationships*

**The experience**: Advancement through mentor relationships  
**Development status**: clear_requirements


**What makes it special**:

- **Progressive_benefits**: Increasing bonuses as relationships deepen

- **Mentor_specific_bonuses**: Different aptitude improvements per mentor

- **Special_opportunities**: Advanced activities unlocked through relationships





---

### Mentor Dialogue and Voice
*Authentic mentor communication and guidance*

**The experience**: Authentic mentor communication and guidance  
**Development status**: clear_requirements


**What makes it special**:

- **Voice_system_templates**: Scalable mentor-specific language patterns

- **Relationship_gated_content**: Deeper conversations as relationships grow

- **Boss_encounter_support**: Mentor-specific preparation and guidance





---

### Mentor-Derived Learning Bonuses
*Relationship benefits that enhance gameplay*

**The experience**: Relationship benefits that enhance gameplay  
**Development status**: clear_requirements


**What makes it special**:

- **Mentor_specialization**: Bonuses aligned with mentor expertise

- **Stacking_benefits**: Multiple mentor bonuses can be active

- **Visual_progression**: Clear advancement feedback





---


## 🎨 The Asset Vision

**Week 1 Focus**: Core mentor portraits and relationship UI elements

**Key visuals we need**:

**Portraits**:

- Dr. Garcia warm, encouraging portrait set

- Dr. Quinn creative, analytical portrait set

- Jesse Martinez practical, hands-on portrait set

- Dr. Kapoor precise, methodical portrait set


**Ui_elements**:

- Relationship level progress bars

- Domain expertise indicators

- Aptitude bonus display components

- Mentor availability status indicators


**Audio**:

- Relationship advancement celebration sounds

- Mentor-specific notification audio



**The progression**: Each week builds on the last, so by week 4 we have "Polish, relationship celebration effects, and accessibility"

---

## 🔗 How It Connects to Everything Else


**This system works with** (see references/ folder for full details):


- **activity-framework** - provides the actual activities and rewards

- **visual-design** - defines the art style and feel

- **game-constants** - connects to overall game mechanics


**Integration philosophy**: Each component passes exactly what the next one needs, no more, no less. Clean handoffs = no confusion later.

---

## 💡 Key Design Decisions to Discuss


**Questions that need team input**:

- **Dialogue_interaction_system**: Requires integration with main dialogue framework



**Ready to move forward on**:

- **Mentor_character_system**: Complete character definitions available with full personality profiles

- **Relationship_progression_system**: Clear progression mechanics defined with level thresholds


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

- [`references/mentors/mentor-philosophies.md`](references/mentors/mentor-philosophies.md)


*Check the references/ folder for complete system details and supporting documentation.*



*This overview focuses on design and player experience with all referenced content embedded inline*  
*Self-contained - no external dependencies required* 