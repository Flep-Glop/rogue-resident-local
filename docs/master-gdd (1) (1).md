# ROGUE RESIDENT: MASTER GAME DESIGN DOCUMENT
**Document Version:** 2.0  
**Status:** Design Integration & Implementation  
**Last Updated:** May 07, 2025

## DOCUMENT PURPOSE

This document serves as the high-level overview and vision guide for Rogue Resident. This master GDD provides conceptual direction while specific implementation details can be found in the companion system design documents referenced throughout.

## EXECUTIVE SUMMARY

Rogue Resident is an educational roguelike game that transforms medical physics education into a narrative-driven experience where expertise development is visualized as a growing constellation of interconnected knowledge. The game features a time-based system with focused choices, a Knowledge Constellation visualizing expertise development, and a progressive control system that rewards learning with increased agency.

Core gameplay revolves around a day/night cycle where players complete educational activities during the Day Phase and develop their Knowledge Constellation while selecting Clinical Applications at night. The game culminates in challenging boss encounters that test technical knowledge across all domains.

## PART 1: GAME OVERVIEW & CORE MECHANICS

### 1.1 Game Concept

Rogue Resident is a narrative-driven educational roguelike where players build expertise in medical physics by developing a constellation of interconnected knowledge. The player assumes the role of a medical physics resident at Pacific Rim University Hospital, balancing daily activities, professional relationships, and knowledge development across a one-year residency.

The game consists of discrete days divided into a Day Phase (hospital activities) and a Night Phase (knowledge reflection and clinical application selection). Four major boss encounters punctuate the experience, appearing after each season, allowing players to test their knowledge against formidable challenges.

### 1.2 Core Game Loop

**Day Loop:**
1. Wake up at 8am with daily schedule
2. Choose where to go/what activity to engage in
3. Complete educational challenges to gain Insight/Knowledge
4. Apply selected clinical applications (abilities) when appropriate
5. Advance time based on activity duration
6. Return to step 2 until end of day (5pm)

**Night Loop:**
1. Knowledge Constellation (Observatory)
   - View newly discovered stars
   - Spend SP to unlock discovered stars
   - Observe connections forming between stars
   - Review mastery development
2. Clinical Applications (Study Desk)
   - Select 3 abilities to apply during the next day
   - Review domain development
3. Sleep to advance to next day

**Seasonal Loop:**
1. Complete 20-25 days of progression
2. Receive "Boss in 2 days" warning
3. Prepare for boss encounter
4. Face boss encounter
5. Advance to next season upon success

### 1.3 Core Systems Overview

The game features several integrated core systems:

**1. Knowledge Constellation System**
- Visual representation of medical physics expertise
- Stars representing individual knowledge concepts
- Connections showing relationships between concepts
- Mastery development displayed through visual enhancement
- Reference Document: Core Systems Document, Section 2

**2. Clinical Applications System**
- Daily application of knowledge in practice
- Passive effects (always active when equipped)
- Active effects (triggered by spending Insight)
- Unlocked based on constellation development
- Reference Document: Core Systems Document, Section 3

**3. Resource Systems**
- Momentum (short-term tactical resource within activities)
- Insight (daily tactical resource powering abilities)
- Star Points (long-term progression resource for unlocking stars)
- Reference Document: Core Systems Document, Section 1

**4. Day/Night Cycle**
- Day Phase: Time-based hospital simulation
- Night Phase: Knowledge development and ability selection
- Progressive time control increasing over the residency
- Reference Document: Glossary & Constants, Section 1.1

**5. Progression Framework**
- Four-season structure with increasing complexity
- Seasonal advancement requirements and milestones
- Build development pathways with viable specializations
- Reference Document: Core Systems Document, Section 4

### 1.4 Build Archetypes

Players can pursue four distinct build approaches, each with unique gameplay advantages:

1. **The Specialist** - Deep mastery in one knowledge domain
2. **The Integrator** - Balanced knowledge across all domains
3. **The Technician** - Focus on equipment and measurement domains
4. **The Communicator** - Focus on patient care and treatment domains

Reference Document: Glossary & Constants, Section 7

## PART 2: WORLD & NARRATIVE DESIGN

### 2.1 Setting Overview

**Pacific Rim University Hospital (PRUH)** is a prestigious academic medical center on the west coast, known for its advanced cancer treatment program. The hospital serves as the primary setting during the Day Phase, with different locations hosting various activities.

**Hill Home** is the player's residence overlooking the hospital, serving as the Night Phase setting with two distinct areas:
- **Observatory** - For viewing and developing the Knowledge Constellation
- **Study Desk** - For selecting Clinical Applications for the next day

The aesthetic combines clean clinical precision with the beauty of celestial constellations, creating a unique visual metaphor for knowledge development.

Reference Document: Glossary & Constants, Section 5

### 2.2 Narrative Structure

The game's progression is organized as a one-year residency divided into four seasons, providing narrative coherence while maintaining educational progression:

**Spring (Season 1): Fundamentals**
- Introduction to the hospital and mentors
- Focus on basic knowledge across all domains
- Culminates in the Difficult Coworker boss encounter

**Summer (Season 2): Clinical Introduction**
- Deeper exploration of patient care and treatment
- Beginning specialization in preferred domains
- Culminates in the Vendor Trio boss encounter

**Fall (Season 3): Integration & Specialization**
- Advanced knowledge in primary domain
- Cross-domain connections and synthesis
- Culminates in the Audit Team boss encounter

**Winter (Season 4): Professional Identity**
- Mastery across all domains
- Complete knowledge integration
- Culminates in the Ionix boss encounter

Reference Document: Content Design Document, Section 2.6

### 2.3 Character Development

The game features four primary mentors, each with a distinct personality, teaching style, and domain expertise:

**Dr. Garcia (Radiation Therapy Expert)** - Warm, patient-focused, provides initial guidance
**Dr. Kapoor (Dosimetry Expert)** - Precise, methodical, focuses on protocols and measurement
**Technician Jesse (Linac Anatomy Expert)** - Practical, hands-on, equipment-focused
**Dr. Quinn (Treatment Planning Expert)** - Creative, innovative, conceptual, creator of Ionix

Reference Document: Glossary & Constants, Section 4.1

## PART 3: KNOWLEDGE & ABILITY SYSTEMS

### 3.1 Knowledge Constellation

The Knowledge Constellation is the central visualization of the player's developing expertise:

**Key Features:**
- 25 stars across four color-coded domains
- Connections forming between related concepts
- Mastery development shown through visual enhancement
- Patterns of stars providing special benefits
- Pure representation of knowledge (not direct ability selection)

Reference Document: Core Systems Document, Section 2

### 3.2 Clinical Applications System

Clinical Applications represent how the player applies their knowledge in daily practice:

**Key Features:**
- 3 ability slots available each day
- Each ability has passive and active effects
- Passive effects always active while equipped
- Active effects triggered by spending Insight
- Unlocked based on Knowledge Constellation development

Reference Document: Core Systems Document, Section 3

### 3.3 Knowledge Domains

The game features four distinct knowledge domains, each with its own focus, challenges, and associated mentor:

**Treatment Planning (Blue)** - Algorithms, optimization, plan evaluation
**Radiation Therapy (Green)** - Clinical applications, radiobiology, treatment delivery
**Linac Anatomy (Amber)** - Equipment components, beam generation, safety systems
**Dosimetry (Pink)** - Calibration, measurement, quality assurance

Reference Document: Glossary & Constants, Section 3

## PART 4: BOSS ENCOUNTERS

### 4.1 Boss Encounter Overview

Boss encounters are major challenges that test the player's knowledge across multiple domains. Each boss provides a unique challenge themed around a professional scenario but requiring technical knowledge application.

**Key Features:**
- 5-phase structure common to all encounters
- Focus on technical knowledge application
- Multiple viable approaches based on build type
- Preparation activities improving chances of success
- Significant rewards that advance progression

Reference Document: Content Design Document, Section 3.1-3.2

### 4.2 The Four Boss Encounters

**Boss 1: The Difficult Coworker ("The Entropic Colleague")**
- Technical application in workplace context
- Focus on Treatment Planning and Radiation Therapy domains
- Clinical communication and problem-solving
- Reference Document: Content Design Document, Section 3.3

**Boss 2: The Vendor Trio ("Triskelion Solutions")**
- Technology evaluation and analysis
- Focus on Linac Anatomy and equipment knowledge
- Technical specification assessment
- Reference Document: Content Design Document, Section 3.4

**Boss 3: The Audit Team ("Protocol Incarnate")**
- Quality assurance and procedural correctness
- Focus on Dosimetry and measurement precision
- Protocol adherence and technical verification
- Reference Document: Content Design Document, Section 3.5

**Boss 4: Ionix ("The Calibration Singularity")**
- Cross-domain knowledge integration
- Synthesis across all knowledge domains
- Comprehensive medical physics mastery
- Reference Document: Content Design Document, Section 3.6

## PART 5: IMPLEMENTATION FRAMEWORK

### 5.1 Day Phase Activities

The Day Phase consists of various educational activities across different hospital locations:

**Activity Categories:**
- Clinical Activities (treatment-focused)
- Technical Activities (equipment-focused)
- Planning Activities (algorithm-focused)
- Didactic Activities (knowledge-focused)
- Research Activities (exploration-focused)
- Social Activities (relationship-focused)

Reference Document: Content Design Document, Section 2.2

### 5.2 Educational Content

Educational content is delivered through structured challenges during activities:

**Challenge Types:**
- Multiple Choice Questions
- Matching Questions
- Procedural Questions
- Calculation Questions
- Boast Questions (high-risk, high-reward)

Reference Document: Content Design Document, Section 1.2

### 5.3 Night Phase Flow

The Night Phase consists of two distinct activities in the hill home:

**Knowledge Constellation (Observatory):**
- Review new discoveries
- Unlock stars with SP
- Observe connections and patterns
- Review mastery development

**Clinical Applications (Study Desk):**
- Select 3 abilities for next day
- Based on constellation development
- Visual connection to knowledge sources

Reference Document: Core Systems Document, Sections 2-3

### 5.4 Progressive Control System

As players progress, they gain increasing control over various aspects of gameplay:

**Phase 1: Guided Learning (Early Spring)**
- Limited activity selection
- Fixed schedule with mandatory activities
- Limited knowledge and ability options

**Phase 2: Applied Learning (Late Spring/Early Summer)**
- More flexible scheduling
- Choose 2-3 of 4 daily activities
- Expanded knowledge and ability options

**Phase 3: Specialist Development (Late Summer/Fall)**
- Self-directed planning
- Choose 3-4 of 4 daily activities
- Advanced patterns and connections

**Phase 4: Professional Autonomy (Winter)**
- Complete freedom over daily activities
- Full control over schedule
- Complete knowledge and ability access

Reference Document: Glossary & Constants, Section 1.3

## PART 6: PLAYER EXPERIENCE & UI

### 6.1 Day Phase Interface

The Day Phase interface focuses on time management and activity engagement:

**Key Elements:**
- Time display showing current time
- Location display showing current hospital area
- Activity options based on location and time
- Resource meters showing Momentum and Insight
- Ability triggers showing when abilities can be activated
- Challenge interface for educational content

### 6.2 Night Phase Interface

The Night Phase interface is divided into two connected but distinct views:

**Knowledge Constellation Interface:**
- Cosmic visualization of knowledge domains
- Interactive star selection and information
- Connection visualization and pattern recognition
- Mastery progress representation
- Discovery queue for new stars

**Clinical Applications Interface:**
- Ability cards showing available applications
- Selection mechanism for daily abilities
- Visual connection to knowledge sources
- Ability description and effect preview
- Domain-based categorization

### 6.3 Progression Feedback

The game provides clear feedback on player progression through various visual and interactive means:

**Progression Indicators:**
- Domain affinity meters showing specialization
- Relationship levels with mentors
- Star mastery visualization
- Pattern completion recognition
- Seasonal milestone achievements
- Boss encounter preparation warnings

## PART 7: DEVELOPMENT ROADMAP

### 7.1 Implementation Priorities

#### Phase 1: Core System Foundation
- Time-based Day Phase structure
- Basic Knowledge Constellation visualization
- Simple ability selection system
- Core challenge mechanics
- Day/Night transition

#### Phase 2: System Separation & Integration
- Complete Knowledge Constellation visualization
- Clinical Application interface development
- Integration between knowledge and ability unlocking
- Improved feedback systems

#### Phase 3: Boss Implementation
- Knowledge-focused boss encounters
- Technical challenge variety
- Multi-domain problem solving
- Preparation activities

#### Phase 4: Polish & Expansion
- UI/UX improvements
- Content expansion
- Balance refinement
- Performance optimization

### 7.2 Documentation Structure

The game's design is documented across four key documents:

**1. Master GDD (This Document)**
- High-level vision and overview
- Core gameplay concepts
- System integration philosophy
- Development roadmap

**2. Core Systems Document**
- Knowledge Constellation implementation
- Clinical Applications system
- Resource systems
- Progression framework

**3. Content Design Document**
- Educational content framework
- Activity design specifications
- Boss encounter details
- Content creation guidelines

**4. Glossary & Constants**
- Terminology definitions
- Numerical constants
- System relationships
- Reference information

## RELATED DOCUMENTATION

For detailed implementation specifications, please refer to these companion documents:

1. **Core Systems Document**: Comprehensive specifications for Knowledge Constellation, Clinical Applications, and resource systems
2. **Content Design Document**: Educational content, activity framework, and boss encounters
3. **Glossary & Constants**: Central reference for all key terms, mechanics, and numerical constants
