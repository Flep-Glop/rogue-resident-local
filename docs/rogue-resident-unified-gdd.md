# ROGUE RESIDENT: UNIFIED GAME DESIGN DOCUMENT
**Document Version:** 5.0  
**Status:** Design Integration & Pre-Implementation  
**Last Updated:** April 29, 2025

## DOCUMENT PURPOSE

This document serves as the single source of truth for Rogue Resident's game design, consolidating the Consolidated GDD (v3.0) and Comprehensive Design (v4.2) into a unified vision that addresses vertical slice feedback while presenting a cohesive implementation plan.

## EXECUTIVE SUMMARY

Rogue Resident is an educational roguelike game that transforms medical physics education into a narrative-driven experience where expertise development is visualized as a growing constellation of interconnected knowledge. The game features a time-based system with focused choices, a Knowledge Constellation visualizing expertise development, and a progressive control system that rewards learning with increased agency.

Based on vertical slice feedback, the design has evolved from a node-based navigation system to a time-based hospital simulation that better reflects authentic medical education while maintaining the core Knowledge Constellation metaphor. This document outlines this refined vision and implementation plan.

## PART 1: GAME OVERVIEW & CORE MECHANICS

### 1.1 Game Concept

**Game Title:** Rogue Resident  
**Tagline:** "The mind is not a vessel to be filled, but a constellation to be illuminated."

**High Concept:**
Rogue Resident transforms medical physics education into an immersive hospital simulation where players navigate their residency through time-based decision making while developing expertise visualized as a growing constellation of interconnected knowledge. Players alternate between a Day Phase (hospital activities and challenges) and a Night Phase (reflection, knowledge synthesis, and constellation development), with a narrative that follows their journey through residency and into early faculty career.

**Target Audience:**
- **Primary:** Medical physics students and residents
- **Secondary:** Medical physics professionals seeking continued education
- **Tertiary:** Individuals interested in the field or similar technical domains

**Educational Philosophy:**
The game reframes learning from linear accumulation to interconnected synthesis. Knowledge isn't just facts to memorize, but concepts to be understood in context, practiced, connected, synthesized, and ultimately mastered intuitively. This is modeled through the core Day/Night loop and the Knowledge Constellation system.

**Core Design Pillars:**
- **Time-Based Gameplay:** Structured around authentic hospital rhythms with contextual decision-making
- **Progressive Disclosure:** Introduce mechanics and complexity gradually to avoid overwhelming the player
- **Clearer Feedback Loops:** Ensure players understand the impact of their choices on resources and game systems
- **Narrative Integration:** Deeply weave the narrative context into the gameplay mechanics and progression
- **Progressive Agency:** Transform player control from a fixed parameter into a dynamic reward that grows with expertise

### 1.2 Core Game Loop

The game revolves around a Day/Night cycle structure:

#### Day Phase (Hospital Activities - Active Learning)

Players progress through time blocks in a simulated hospital day, making choices from contextually appropriate options.

**Activities:**
1. **Start of Day:** Overview of scheduled events (where applicable)
2. **Hourly Choice:** 2-3 available options presented for current hour
   - **Location:** Specific room/area where activity occurs
   - **Duration:** Time cost of activity (primarily 1 hour, with variations)
   - **Mentor:** Character present (if applicable)
   - **Activity/Topic:** Clear description of learning focus
   - **Difficulty:** Simple indicator of challenge level (★☆☆ to ★★★)
3. **Activity Engagement:** Challenge/interaction based on selected option
   - **Clinical Activities:** Patient cases requiring treatment planning decisions
   - **QA Activities:** Equipment calibration and quality assurance challenges
   - **Educational Activities:** Concept explanations and knowledge synthesis
   - **Self-Study:** Independent review of concepts (library)
   - **Social Networking:** Cafeteria interactions to build mentor relationships
   - **Special Events:** Scheduled events at specific times (e.g., Tumor Board)
4. **Resource Gains:** Earn Momentum, Insight, SP, and discover concepts
5. **Time Progression:** Advance to next time block, repeat until day end (5 PM)
6. **Day Conclusion:** Transition to Night Phase with daily summary

**Example Time Block Choice:**
```
The following options are available (9:00 AM):

[Option 1] Treatment Planning Room (1 hr): Review Head & Neck Case with Dr. Garcia (★★☆)
[Option 2] Equipment Room (1 hr): Learn Linac Components with Jesse (★☆☆)
[Option 3] Self-Study (30 min): Review Dosimetry Concepts (☆☆☆)
```

#### Night Phase (Knowledge Constellation - Reflection & Synthesis)

Players return to their hill home overlooking the hospital to reflect, synthesize knowledge, and prepare for the next day.

**Activities:**
1. **Review Discoveries:** See concepts discovered during the Day Phase presented as potential new stars
2. **Unlock Stars:** Spend Star Points (SP) earned during the Day Phase to permanently unlock discovered concept stars
3. **Activate Stars:** Toggle unlocked stars between Active/Inactive states (influences next day)
4. **Observe Connections:** View automatically formed connections between unlocked stars
5. **Review Journal:** Access journal to review concept details, character notes
6. **Monitor Mastery:** Observe overall progress across knowledge domains
7. **Plan Next Day:** As control mechanics unlock, gain ability to influence coming activities

**Key Night → Day Influence Mechanisms:**
- **Active Stars:** Each provides +1 Insight at the start of the next day
- **Domain Expertise:** Highly mastered stars (75%+) reduce time cost of related activities 
- **Knowledge Connections:** Connected stars in same domain enable specialized dialogue options
- **Pattern Recognition:** Specific constellation patterns unlock special events or abilities

### 1.3 Resource Systems

#### Momentum (Activity-Level Tactical Resource)
- **Visualization:** ⚡ Pips (0-3 levels)
- **Scope:** Functions within a single activity (not persistent between activities)
- **Accumulation:** Build through consecutive correct answers within an activity
- **Decay:** Resets completely between activities, partial decay on incorrect answers
- **Benefit:** Enables the Boast ability when at max level (Level 3)
- **Feedback:** Clear visual/audio cues for gain/loss/max level

#### Insight (Daily Tactical Resource)
- **Visualization:** ◆ Meter (0-100 points)
- **Scope:** Persists between activities within a single day
- **Accumulation:** Gained through successful challenges throughout the day
- **Daily Bonus:** +1 Insight at day start per active star
- **Reset:** Zero at start of each new day
- **End-of-Day Conversion:** Convert remaining Insight to bonus SP at 5:1 ratio
- **Benefit:** Powers special abilities used during the Day Phase

#### Star Points (SP) (Long-term Progression Resource)
- **Visualization:** ★ Counter
- **Accumulation:** Earned during the Day Phase (activities, Boast successes, Insight conversion)
- **Benefit:** Sole use is to permanently unlock discovered concept stars in the Knowledge Constellation
- **Persistence:** Persists between days and seasons ("falling forward" progress)

### 1.4 Special Abilities (Day Phase Only)

Abilities provide strategic options during dialogue challenges.

#### Implemented Abilities:

1. **Tangent** (Cost: 25 Insight)
   - **Functionality:** Swaps the content of the current question/problem to a related but different concept within the same domain
   - **Strategic Purpose:** Allows the player to "dodge" a concept they are less comfortable with
   - **Trigger:** Available during question phase if player has sufficient Insight

2. **Boast** (Requires: Momentum Level 3)
   - **Functionality:** Replaces standard questions with high-difficulty alternatives
   - **Strategic Purpose:** High-risk, high-reward path for greater Insight gains
   - **Trigger:** Available alongside standard options when Momentum is maxed

3. **Consultation** (Cost: 25 Insight)
   - **Functionality:** Alternative perspective on current question
   - **Strategic Purpose:** Provides new angle when stuck on challenging content
   - **Trigger:** Available during question phase if player has sufficient Insight

4. **Early Completion** (Cost: 75 Insight)
   - **Functionality:** Complete current activity 15 minutes early
   - **Strategic Purpose:** Time optimization for schedule management
   - **Trigger:** Available during activities if player has sufficient Insight

#### Deferred Implementation Abilities:

5. **Reframe** (Cost: 50 Insight - Deferred)
   - **Functionality:** Changes the context or framing of the current problem
   - **Strategic Purpose:** Approaches problem from different perspective
   - **Trigger:** Available during question phase with sufficient Insight

6. **Peer-Review** (Cost: 75 Insight - Deferred)
   - **Functionality:** "Summons" a different mentor to provide a hint
   - **Strategic Purpose:** Leverages another expert's viewpoint
   - **Trigger:** Available during question phase with sufficient Insight

### 1.5 Knowledge Constellation System

The central metaphor and visualization of the player's developing expertise.

#### Components:

- **Stars (Concepts):** Individual knowledge concepts
  - **Properties:** ID, Name, Description, Domain (color-coded), Position, Mastery (0-100%), Connections, Prerequisites, Discovered (Yes/No), Unlocked (Yes/No), Active (Yes/No), SP Cost to Unlock
  - **States:**
    - **Undiscovered:** Not yet encountered
    - **Discovered:** Encountered in Day Phase, appears as potential star in Night Phase
    - **Unlocked:** SP spent in Night Phase, star permanently added to constellation
    - **Active/Inactive:** Player toggles state in Night Phase (influences next Day Phase)

- **Connections:** Represent relationships between concepts
  - **Properties:** ID, Source Star ID, Target Star ID, Strength/Mastery (0-100%), Discovered (Yes/No)
  - **Formation:** Automatically appear when both connected stars are unlocked
  - **Mastery:** Increases when related concepts are used together successfully
  - **Visualization:** Line thickness/brightness/style indicates mastery level

- **Knowledge Domains (Color-Coded):**
  - **Treatment Planning** (Blue: #3b82f6)
  - **Radiation Therapy** (Green: #10b981)
  - **Linac Anatomy** (Amber: #f59e0b)
  - **Dosimetry** (Pink: #ec4899)

#### Improved Effect Preview System:

Detailed tooltips showing precise effects of constellation decisions:

**Example Tooltip:**
```
DOSIMETRY FUNDAMENTALS (★★☆)
[Currently Inactive] → [If Activated]:

✅ Reduces QA activities time: 60min → 45min
✅ Unlocks "Technical Question" with Dr. Kapoor
✅ Provides +1 Insight at day start
❌ Requires 2 Star Points to activate
```

#### Constellation Effects:
- **Active Stars:** +1 Insight at day start per active star
- **Connected Stars:** 3+ connected stars in same domain reduce time cost for related activities
- **Mastery Thresholds:** Stars at 75%+ mastery unlock special dialogue options
- **Star Patterns:** Triangle patterns between stars create chance for "Eureka" moments
- **Domain Completion:** Fully connected stars within a domain boost mentor relationship gains

## PART 2: WORLD & NARRATIVE DESIGN

### 2.1 Setting Overview

- **Primary Location:** The Hospital (Time-based simulation during Day Phase)
  - **Metaphor:** Structured professional knowledge and experience
  - **Areas:** Treatment rooms, planning room, physics lab, conference room, etc.

- **Secondary Location:** Hill Home (Hub during Night Phase)
  - **Overlooks:** Hospital (provides perspective)
  - **Function:** Location for reflection and constellation viewing
  - **Metaphor:** Perspective and synthesis

- **Aesthetic:** Retro pixel art balancing clinical precision, celestial beauty, and subtle magical realism

### 2.2 Narrative Structure: Seasonal Progression

The game's progression is organized as a year-long residency divided into four seasons, providing narrative coherence while maintaining educational progression:

#### Arc 1: The Residency (Four Seasons)

- **Spring (Season 1):** Fundamentals/onboarding
  - **Goal:** Master foundational concepts across all domains
  - **Progression:** 5+ stars unlocked with 50% average mastery to advance

- **Summer (Season 2):** Developing specialization
  - **Goal:** Begin specializing in particular domains
  - **Progression:** 10+ stars with 60% mastery and stars from all domains

- **Fall (Season 3):** Advanced concepts
  - **Goal:** Synthesize knowledge across domains
  - **Progression:** 15+ stars with 70% mastery and specific pattern requirements

- **Winter (Season 4):** Culmination and Ionix challenge
  - **Goal:** Face the Ionix challenge requiring mastery across all domains
  - **Requirement:** 20+ stars with 80% average mastery

#### Arc 2: Faculty & The Ionix Mystery (Post-Game)

- **Goal:** As a new faculty member, continue research, deepening understanding of Ionix
- **Setting:** Ongoing winter season with expanded research opportunities
- **Gameplay:** Focuses on repeated encounters with Ionix, pushing mastery beyond conceptual limits
- **Progression Stages:** Stabilizing → Discovery → Understanding → Communication → Collaboration → Innovation
- **Bonus Ending:** Achieve peak mastery and face final challenge from Dr. Kapoor to become Chief Medical Physicist

#### The Ionix Narrative Thread:

- A mysterious, experimental ion chamber created by Dr. Quinn
- Exhibits unusual properties, hinting at deeper phenomena
- Serves as the capstone challenge of the residency (Arc 1)
- Central focus of post-game research (Arc 2)
- The player's relationship with Ionix evolves across both arcs

### 2.3 Character Development

#### Player Character:
- A medical physics resident (Arc 1) / junior faculty (Arc 2)
- Customizable pixel art appearance
- Professional identity evolves via journal entries and knowledge growth

#### Mentor Characters:

1. **Dr. Garcia** (Radiation Oncologist & Education Coordinator - Initial Guide)
   - **Personality:** Holistic, patient-focused, integrative, welcoming
   - **Role:** Provides initial onboarding, explains core systems contextually
   - **Teaching Style:** Values empathetic consideration, clear communication
   - **Domain Specialty:** Radiation Therapy (Green)

2. **Dr. Kapoor** (Chief Medical Physicist)
   - **Personality:** Methodical, protocol-driven, precise
   - **Teaching Style:** Responds well to careful analysis, procedural thinking
   - **Specialty:** Quality assurance, calibration protocols
   - **Domain Specialty:** Dosimetry (Pink)
   - **Role:** Represents established authority, key figure in Arc 2 ending

3. **Technician Jesse** (Equipment Specialist)
   - **Personality:** Hands-on, practical, experience-driven
   - **Teaching Style:** Values real-world solutions, pragmatic problem-solving
   - **Specialty:** Machine maintenance, troubleshooting
   - **Domain Specialty:** Linac Anatomy (Amber)

4. **Dr. Quinn** (Experimental Researcher)
   - **Personality:** Creative, innovative, conceptual, perhaps slightly eccentric
   - **Teaching Style:** Encourages questioning assumptions, exploring unconventional approaches
   - **Specialty:** Quantum physics, radiation biology
   - **Domain Specialty:** Treatment Planning (Blue)
   - **Role:** Creator of the Ionix device, central to Arc 2

### 2.4 Relationship System

#### Relationship Tracking:
- **Scale:** 0-5 for each mentor (0=Unfamiliar, 5=Trusted Colleague)
- **Display:** Subtle icon beside mentor portraits showing current level
- **Development:** Based on interaction choices and cafeteria conversations

#### Relationship Development Opportunities:

1. **Cafeteria Interactions (Primary)**
   - **Format:** Choose which mentor to sit with during lunch
   - **Frequency:** Daily opportunity
   - **Impact:** +1 relationship point with chosen mentor per interaction
   - **Content:** Casual conversations about work, backgrounds, interests

2. **Challenge Dialogues (Secondary)**
   - **Impact:** Dialogue choices during challenges influence relationships
   - **Style Alignment:** Each mentor has preferred approach to problems

#### Gameplay Effects of Relationships:

1. **Resource Efficiency**
   - **Time Savings:** Higher relationships reduce time cost of activities
   - **Insight Generation:** Higher relationships increase Insight gained

2. **Knowledge Benefits**
   - **Mastery Development:** Relationship level boosts mastery gains in mentor's domain
   - **Success Chances:** Slight difficulty adjustments based on relationship level

3. **Progressive Control Unlocks**
   - **Level 3 (All Mentors):** Unlock "Focused Question" ability
   - **Level 4 (Any Two Mentors):** Unlock "Schedule Peek" control mechanic
   - **Level 5 (Any Mentor):** Unlock "Appointment Setting" with that specific mentor

4. **Unique Mentor Benefits (Level 4+)**
   - **Dr. Garcia:** See one future dialogue option outcome
   - **Dr. Kapoor:** 15% chance to complete QA activities faster
   - **Jesse:** Reduced difficulty on equipment troubleshooting
   - **Dr. Quinn:** Occasionally form star connections without using both concepts

### 2.5 Daily Schedule System

The hospital operates on a standard daily schedule that provides the foundation for player activities.

#### Standard Daily Schedule (Excerpt):

| Time | Dr. Garcia (Rad Onc) | Dr. Kapoor (Chief Physicist) | Jesse (Equipment) | Dr. Quinn (Researcher) | Other Locations |
|------|---------------------|----------------------------|-------------------|----------------------|----------------|
| **8:00 AM** | Morning Rounds<br>*Location: Ward*<br>🟢 ★☆☆ | QA Protocol Review<br>*Location: Physics Office*<br>🔴 ★★☆ | Linac Morning Checkout<br>*Location: Treatment Room 1*<br>🟠 ★☆☆ | *Not Available* | Self-Study<br>*Location: Library*<br>Any Domain ☆☆☆ |
| **9:00 AM** | Patient Case Review<br>*Location: Conference Room*<br>🔵 ★★☆ | *Not Available<br>(Department Meeting)* | Basic Equipment Training<br>*Location: Treatment Room 2*<br>🟠 ★☆☆ | Patient Positioning QA<br>*Location: Treatment Room 3*<br>🟢🔴 ★★☆ | Chart Review<br>*Location: Workstation*<br>🔵 ★☆☆ |
| **12:00 PM** | *Lunch Break* | *Lunch Break* | *Lunch Break* | *Lunch Break* | Cafeteria<br>*Location: Cafeteria*<br>Social Networking |
| **4:00 PM** | End-of-Day Rounds<br>*Location: Ward*<br>🟢 ★☆☆ | *Not Available* | End-of-Day Equipment Check<br>*Location: Treatment Room 1*<br>🟠 ★☆☆ | *Not Available* | Self-Study<br>*Location: Library*<br>Any Domain ☆☆☆ |

#### Special Events:

Special events can replace standard activities when triggered by specific constellation patterns:

| Season | Special Event | Time | Location | Mentors | Requirements |
|--------|--------------|------|----------|---------|--------------|
| Spring | New Patient Orientation | 10:00 AM | Clinic | Dr. Garcia | 3+ Treatment Planning stars connected |
| Summer | Complex Case Review | 3:00 PM | Conference Room | Dr. Garcia, Dr. Quinn | 2 Treatment Planning stars at 60%+ mastery |
| Fall | Novel Technique Demo | 1:00 PM | Research Lab | Dr. Quinn | Stars from 3 different domains connected in a triangle |
| Winter | Ionix Calibration | 2:00 PM | Research Lab | Dr. Quinn, Dr. Kapoor | 75%+ mastery in required Dosimetry stars |

#### Engagement Activities:

1. **Cafeteria (Social Networking)**
   - **Format:** Mini-dialogue scenes with mentors
   - **Benefits:** Build relationship points, gain hints, occasional Insight boost
   - **Options:** Choose which mentor to sit with when multiple are present

2. **Self-Study (Library)**
   - **Format:** Select from available journals/books by domain
   - **Interaction:** Brief reading with comprehension question
   - **Benefits:** Guaranteed concept discovery, small SP gain (+1)

## PART 3: PROGRESSION SYSTEMS

### 3.1 Progressive Control System

The Progressive Control System transforms player agency from a fixed design parameter into a dynamic reward mechanism that evolves throughout the game.

#### Three Distinct Phases:

1. **Junior Resident (Spring)**
   - React to predetermined schedule with 2-3 curated options
   - Limited ability to influence outcomes
   - Focus on learning hospital systems and building basic knowledge

2. **Senior Resident (Summer/Fall)**
   - Unlock abilities to optimize time use
   - Modify schedule in limited ways
   - Strategic planning becomes more important

3. **Attending/Faculty (Winter)**
   - Actively shape schedule with planning tools
   - Create custom opportunities
   - Lead specialized sessions

#### Progressive Control Mechanics:

**Early Progression (Spring)**
- **Quick Study:** Reduce time cost of simple activities when related stars are highly mastered
- **Focused Question:** Additional dialogue option during mentor interactions
- **Schedule Peek:** View next day's major events during Night Phase

**Mid Progression (Summer/Fall)**
- **Appointment Setting:** Schedule one meeting per day with available mentor
- **Time Optimization:** Reduce time cost of all activities in highly mastered domains
- **Priority Access:** Join ongoing activities mid-session

**Advanced Progression (Winter)**
- **Schedule Mastery:** Arrange full day's schedule during Night Phase
- **Interdisciplinary Rounds:** Create multi-mentor sessions for cross-domain connections
- **Teaching Opportunity:** Lead sessions that boost mastery in chosen topic

### 3.2 Difficulty Selection System

Difficulty selection is presented through character dialogue during onboarding:

#### Implementation:
- During early onboarding, Dr. Garcia engages the player in a conversation about their background
- Player selects one of three background options that determine difficulty:
  - **"Fresh out of undergrad"** (Beginner Mode)
  - **"Finished doctorate"** (Standard Mode)
  - **"Practiced in another country"** (Expert Mode)
- Selection is framed as personal history rather than difficulty choice

#### Mode-Specific Adjustments:

**"Fresh out of undergrad" (Beginner)**
- More explanatory dialogue for technical concepts
- Slower seasonal mastery thresholds (40%/50%/60%/70%)
- Additional self-study options available each day
- More frequent hint opportunities in challenges

**"Finished doctorate" (Standard)**
- Standard experience as designed
- Normal mastery thresholds (50%/60%/70%/80%)
- Balanced dialogue between explanation and application

**"Practiced in another country" (Expert)**
- Higher starting conceptual familiarity
- Accelerated early game progression
- Advanced topics introduced earlier
- Higher seasonal mastery thresholds (60%/70%/80%/90%)

#### Dynamic Adjustment:
- Player can request adjustment by speaking with Dr. Garcia during monthly check-ins
- System monitors success/failure rates and may offer to adjust difficulty

### 3.3 Seasonal Requirements

- **Spring to Summer:** 5+ stars unlocked with at least 50% average mastery
- **Summer to Fall:** 10+ stars unlocked with at least 60% average mastery and at least 2 stars from each domain
- **Fall to Winter:** 15+ stars unlocked with at least 70% average mastery and specific pattern requirements
- **Winter Culmination (Ionix):** 20+ stars unlocked with at least 80% average mastery across all domains

### 3.4 Knowledge Acquisition & Mastery

- **Discovery (Day):** Encountering concepts marks them as "Discovered"
- **Unlocking (Night):** Spend SP to permanently unlock Discovered stars
- **Activation (Night):** Toggle Unlocked stars to "Active" state (required for benefits)
- **Mastery (Stars):** Increases through repeated successful application (0-100%)
- **Mastery (Connections):** Increases when connected concepts are used together
- **"Falling Forward":** Progress persists even after failed challenges

### 3.5 Journal Evolution

- **Function:** Knowledge tracker, narrative device, character development log
- **Content:** Concept entries, character notes, procedural guidelines, references
- **Evolution:** Starts basic, adds features as player progresses (filtering, annotation)
- **Integration:** Automatically logs discoveries and provides reference during challenges

## PART 4: IMPLEMENTATION & UI/UX

### 4.1 Enhanced Onboarding Experience

#### Structured Introduction with Dr. Garcia:
- **Welcome Orientation:** Interactive tour of hospital areas
- **System Introduction:** Contextual explanations of game systems
- **Guided First Day:** Structured initial experience demonstrating core mechanics
- **First Night Tutorial:** Clear guidance on constellation activation and effects
- **Feedback Checkpoint:** End of first day reflection with Garcia

#### Progressive UI Disclosure:
- **Staged Introduction:** Core UI elements introduced sequentially
- **Contextual Help:** Subtle guidance prompts during first interactions
- **Concept Glossary:** Optional in-game reference for terminology
- **Visualization Aids:** Interactive diagrams explaining complex concepts

### 4.2 Visual Design Philosophy

- **Aesthetic:** Retro Pixel Art + Clinical Precision + Celestial Beauty + Magical Realism
- **Color Palette:** Dark blues/blacks primary UI; bright accents for interaction; specific colors for knowledge domains
- **Typography:** Clear pixelated font for main text, monospace for technical data, stylized headers

### 4.3 Interface Structure

- **Global Elements:** Resource displays (Momentum, Insight, SP), Time indicator, Journal access
- **Day Phase:** Time block display, Activity selection interface, Dialogue interface, Journal 
- **Night Phase:** Hill Home Hub, Constellation View, Journal Interface, Next Day Planning (when unlocked)

### 4.4 Feedback Systems

- **Visual:** Star appearance/brightness, connection lines/pulses, resource meters, color-coded feedback
- **Audio:** Distinct sounds for discovery, connection, resource gain/loss, ability activation
- **Narrative:** Mentor reactions, journal entries, patient outcomes
- **Progression:** Clear seasonal growth indicators, mastery visualization

### 4.5 Technical Implementation Notes

- **Chamber Pattern Foundation:** Key architectural pattern for UI performance
- **State Management:** Reactive state management (e.g., Zustand) + Event-driven communication
- **Time Simulation:** Core backend system managing availability and activities
- **Knowledge Graph:** Data structure representing the constellation system
- **Progressive Disclosure:** System for introducing mechanics gradually

### 4.6 Accessibility Considerations

- **Colorblind-friendly design:** Use patterns/shapes in addition to color
- **Adjustable text size**
- **Clear audio cues**
- **Difficulty settings:** As implemented through background selection
- **Keyboard navigation support**

## PART 5: DEVELOPMENT ROADMAP

### 5.1 Implementation Priorities

#### Highest-Impact Adjustments:
1. **Time-Based Core Loop**
   - Time Manager implementation
   - Choice presentation layer
   - Standard hospital schedule system
   - Day/Night transition

2. **Knowledge Constellation Clarity**
   - Improved tooltips and effect preview
   - Clear visual feedback on mastery
   - Explicit Night → Day influence mechanisms

3. **Onboarding Experience**
   - Dr. Garcia introduction sequence
   - Progressive disclosure of systems
   - Narrative context for game mechanics

4. **Difficulty Balancing**
   - Background-based difficulty selection
   - Content appropriate for different experience levels
   - Clear progression expectations

### 5.2 High-Level Roadmap

#### Phase 1: Core Time-Based Foundation
- Time Manager implementation
- Basic choice presentation layer
- Simple challenge system with Momentum
- Day/Night transition
- Basic Knowledge Constellation integration
- Boast and Tangent mechanics

#### Phase 2: Resource & Relationship Systems
- Complete Insight system with abilities
- Implement basic social networking (cafeteria interactions)
- Basic constellation night effects on day content
- End-of-day Insight conversion

#### Phase 3: Progressive Control & Seasonal Structure
- Implement first control mechanics (Quick Study, Schedule Peek)
- Add seasonal progression thresholds
- Build out self-study mechanics
- Implement special events

#### Phase 4: Advanced Systems
- Remaining control mechanics
- Expanded social networking system
- Multi-mentor activities
- Ionix narrative development

#### Phase 5: Polish & Optimization
- Content expansion
- UI/UX improvements
- Performance optimization
- Balance testing

### 5.3 Technical Challenges & Opportunities

- **Challenges:** Balancing simulation complexity with performance, ensuring clear feedback loops, maintaining educational authenticity while keeping engagement
- **Opportunities:** Innovative educational gameplay via constellation metaphor, meaningful time-based decisions, strong narrative potential with Ionix, high-performance UI via Chamber Pattern

## PART 6: CONCLUSION

This unified GDD presents a refined vision for Rogue Resident that addresses vertical slice feedback through a fundamental shift to time-based gameplay while preserving the core Knowledge Constellation metaphor. The design creates a more intuitive, authentic experience that better aligns with educational goals while reducing cognitive load.

The integration of the Progressive Control System creates a compelling motivation loop where knowledge acquisition directly enables greater agency, mirroring the authentic journey from novice resident to expert faculty. With clear feedback systems, difficulty adaptation, and strong narrative integration, the game aims to serve diverse player types from medical physics experts to curious newcomers.

Moving forward, implementation will focus on establishing the time-based foundation, refining the Knowledge Constellation's clarity and impact, creating an effective onboarding experience, and building the seasonal progression structure that frames the educational journey.

---

**Appendices:**
- Detailed Star Listing (To Be Developed)
- Challenge Content Examples (To Be Developed)
- UI Wireframes (To Be Developed)
- Educational Content Map (To Be Developed)