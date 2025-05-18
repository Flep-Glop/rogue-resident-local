# ROGUE RESIDENT: MASTER GAME DESIGN DOCUMENT
**Document Version:** 3.0  
**Status:** Design Integration & Implementation  
**Last Updated:** May 15, 2025

## DOCUMENT PURPOSE

This document serves as the high-level overview and vision guide for Rogue Resident. This master GDD provides conceptual direction while specific implementation details can be found in the companion system design documents referenced throughout.

## EXECUTIVE SUMMARY

Rogue Resident is an educational roguelike game that transforms medical physics education into a narrative-driven experience where expertise development is visualized as a growing constellation of interconnected knowledge. The game features a fluid time-based system, a Knowledge Constellation visualizing expertise development, and a progressive control system that rewards learning with increased agency.

Core gameplay revolves around a day/night cycle where players complete educational activities during the Day Phase and develop their Knowledge Constellation while selecting Applications at night. The game culminates in challenging boss encounters that test technical knowledge across all domains.

## PART 1: GAME OVERVIEW & CORE MECHANICS

### 1.1 Game Concept

Rogue Resident is a narrative-driven educational roguelike where players build expertise in medical physics by developing a constellation of interconnected knowledge. The player assumes the role of a medical physics resident at a prestigious west coast teaching hospital, balancing daily activities, professional relationships, and knowledge development across a one-year residency.

The game consists of discrete days divided into a Day Phase (hospital activities) and a Night Phase (knowledge reflection and application selection). Four major boss encounters punctuate the experience, allowing players to test their knowledge against formidable challenges when they reach appropriate mastery levels.

### 1.2 Core Game Loop

**Day Loop:**
1. Wake up with visual day progression system
2. Choose where to go/what activity to engage in
3. Complete educational challenges to gain Insight/Knowledge
4. Apply selected applications (abilities) when appropriate
5. Advance time based on challenge completion
6. Return to step 2 until end of day

**Night Loop:**
1. Knowledge Constellation (Observatory)
   - View newly discovered stars
   - Spend SP to unlock discovered stars
   - Review etching collection
   - Form connections between stars using etchings
   - Review mastery development
2. Applications (Study Desk/Journal)
   - Select 3 cards to apply during the next day
   - Place cards in journal slots
   - Review domain development
3. Appearance (Wardrobe/Mirror)
   - Customize character appearance
   - Review unlocked customization options
4. Sleep to advance to next day

**Seasonal Loop:**
1. Build mastery through daily activities
2. Receive boss availability notification at sufficient mastery
3. Prepare for boss encounter
4. Face boss encounter when ready
5. Advance to next season upon success

### 1.3 Core Systems Overview

The game features several integrated core systems:

**1. Knowledge Constellation System**
- Visual representation of medical physics expertise
- Stars representing individual knowledge concepts
- Connections showing relationships between concepts
- Etchings that enable connection formation
- Mastery development displayed through visual enhancement
- Reference Document: Core Systems Document, Section 2

**2. Applications System**
- Daily application of knowledge in practice
- Journal-based card collection and selection
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
- Day Phase: Fluid time-based hospital simulation
- Night Phase: Knowledge development and application selection
- Progressive time control increasing over the residency
- Hill Home as the central hub for night activities
- Reference Document: Glossary & Constants, Section 1.1

**5. Progression Framework**
- Four-season structure with increasing complexity
- Mastery-based boss encounter availability
- Specialization through limited SP economy (33% gap)
- Reference Document: Core Systems Document, Section 4

### 1.4 Viable Build Paths

While formal build archetypes are no longer enforced, players can pursue several viable paths:

1. **Domain Specialization** - Deep mastery in one knowledge domain
2. **Cross-Domain Integration** - Balanced knowledge across all domains
3. **Technical Focus** - Emphasis on equipment and measurement domains
4. **Communication Focus** - Emphasis on patient care and treatment domains

Reference Document: Core Systems Document, Section 4.4

## PART 2: WORLD & NARRATIVE DESIGN

### 2.1 Setting Overview

A **prestigious teaching hospital** on the west coast, known for its advanced cancer treatment program. The hospital serves as the primary setting during the Day Phase, with different locations hosting various activities.

**Hill Home** is the player's residence overlooking the hospital, serving as the Night Phase setting with three distinct areas:
- **Observatory** - For viewing and developing the Knowledge Constellation
- **Study Desk** - For reviewing journal and selecting Applications
- **Wardrobe/Mirror** - For character customization

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

The Audit Team includes Dr. Kapoor's strict but fair former mentor, creating personal narrative connections.

Reference Document: Glossary & Constants, Section 4.1

## PART 3: KNOWLEDGE & ABILITY SYSTEMS

### 3.1 Knowledge Constellation

The Knowledge Constellation is the central visualization of the player's developing expertise:

**Key Features:**
- 25 stars across four color-coded domains
- Etchings that enable connection formation between stars
- Connections forming between related concepts
- Mastery development shown through visual enhancement
- Patterns of stars providing special benefits
- Journal-based etching collection system

Reference Document: Core Systems Document, Section 2

### 3.2 Applications System

Applications represent how the player applies their knowledge in daily practice:

**Key Features:**
- Journal-based physical card system
- 3 card slots available each day
- Each card has passive and active effects
- Passive effects always active while equipped
- Active effects triggered by spending Insight
- Cards unlocked by stars and etching patterns
- Progressive card introduction (1-2 per week)

Reference Document: Core Systems Document, Section 3; Card & Etching System Document

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
- Mastery-based availability rather than fixed timing
- Focus on technical knowledge application
- Multiple viable approaches based on build focus
- Preparation activities improving chances of success
- Significant rewards that advance progression

Reference Document: Content Design Document, Section 3.1-3.2

### 4.2 The Four Boss Encounters

**Boss 1: The Difficult Coworker ("The Entropic Colleague")**
- Technical application in workplace context
- Focus on Treatment Planning and Radiation Therapy domains
- Clinical communication and problem-solving
- Available at 40% mastery in primary domain
- Reference Document: Content Design Document, Section 3.3

**Boss 2: The Vendor Trio ("Triskelion Solutions")**
- Technology evaluation and analysis
- Focus on Linac Anatomy and equipment knowledge
- Technical specification assessment
- Available at 50% mastery in primary domain
- Reference Document: Content Design Document, Section 3.4

**Boss 3: The Audit Team ("Protocol Incarnate")**
- Quality assurance and procedural correctness
- Focus on Dosimetry and measurement precision
- Protocol adherence and technical verification
- Available at 60% mastery in primary domain
- Led by Dr. Kapoor's strict but fair former mentor
- Reference Document: Content Design Document, Section 3.5

**Boss 4: Ionix ("The Calibration Singularity")**
- Cross-domain knowledge integration
- Synthesis across all knowledge domains
- Comprehensive medical physics mastery
- Available at 75% mastery in primary domain
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
- Multiple Choice Questions (4-8 questions per challenge)
- Matching Questions
- Procedural Questions
- Calculation Questions
- Boast Questions (high-risk, high-reward)

Reference Document: Content Design Document, Section 1.2

### 5.3 Night Phase Flow

The Night Phase consists of three distinct activities in the hill home:

**Knowledge Constellation (Observatory):**
- Review new discoveries
- Unlock stars with SP
- Review and apply etchings to form connections
- Observe patterns and connections
- Review mastery development

**Applications (Study Desk/Journal):**
- Review newly acquired cards
- Select 3 cards for next day
- Place cards in journal slots
- Review domain development and progress

**Character Customization (Wardrobe/Mirror):**
- Customize character appearance
- Review unlocked customization options
- Apply cosmetic changes

Reference Document: Core Systems Document, Sections 2-3, 6

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

The Day Phase interface focuses on fluid time progression and activity engagement:

**Key Elements:**
- Visual time progression (sun/shadow movement)
- Location display showing current hospital area
- Activity options based on location
- Resource meters showing Momentum and Insight
- Application triggers showing when abilities can be activated
- Challenge interface for educational content

### 6.2 Night Phase Interface

The Night Phase interface is divided into three connected but distinct views:

**Knowledge Constellation Interface:**
- Cosmic visualization of knowledge domains
- Interactive star selection and information
- Etching application interface
- Connection visualization and pattern recognition
- Mastery progress representation
- Discovery queue for new stars

**Journal/Applications Interface:**
- Physical journal visualization with pages
- Card collection interface
- Three card slots for daily selection
- Visual connection to knowledge sources
- Card description and effect preview
- Domain-based categorization

**Wardrobe/Mirror Interface:**
- Character customization options
- Unlockable appearance items
- Visual preview of changes

### 6.3 Progression Feedback

The game provides clear feedback on player progression through various visual and interactive means:

**Progression Indicators:**
- Domain affinity meters showing specialization
- Relationship levels with mentors
- Star mastery visualization
- Pattern completion recognition
- Etching collection status
- Journal completion tracking
- Boss encounter preparation indicators

## PART 7: DEVELOPMENT ROADMAP

### 7.1 Implementation Priorities

#### Phase 1: Core System Foundation
- Fluid time-based Day Phase structure
- Basic Knowledge Constellation visualization
- Simple journal and card selection system
- Core challenge mechanics
- Day/Night transition

#### Phase 2: System Separation & Integration
- Complete Knowledge Constellation visualization
- Journal interface development
- Etching discovery and application
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
- Character customization system
- Title screen community features

### 7.2 Documentation Structure

The game's design is documented across five key documents:

**1. Master GDD (This Document)**
- High-level vision and overview
- Core gameplay concepts
- System integration philosophy
- Development roadmap

**2. Core Systems Document**
- Knowledge Constellation implementation
- Applications system
- Resource systems
- Progression framework
- Hill Home systems

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

**5. Card & Etching Document**
- Detailed Application card listings
- Etching discovery and effects
- Visual design specifications
- Card acquisition flow

## RELATED DOCUMENTATION

For detailed implementation specifications, please refer to these companion documents:

1. **Core Systems Document**: Comprehensive specifications for Knowledge Constellation, Applications, and resource systems
2. **Content Design Document**: Educational content, activity framework, and boss encounters
3. **Glossary & Constants**: Central reference for all key terms, mechanics, and numerical constants
4. **Card & Etching Document**: Detailed specifications for Application cards and the etching system
