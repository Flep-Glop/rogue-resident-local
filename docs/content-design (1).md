# ROGUE RESIDENT: CONTENT DESIGN DOCUMENT
**Document Version:** 2.0  
**Status:** Design Specification  
**Last Updated:** May 07, 2025

## DOCUMENT PURPOSE

This document provides comprehensive specifications for the educational content, activity framework, and boss encounter designs in Rogue Resident. It serves as the primary reference for all content creation and implementation.

## 1. EDUCATIONAL CONTENT FRAMEWORK

### 1.1 Educational Goals

- **Conceptual Understanding**: Build deep comprehension rather than memorization
- **Knowledge Connections**: Emphasize relationships between different concepts
- **Practical Application**: Focus on clinically relevant scenarios
- **Skill Development**: Target specific professional skills defined in aptitude stats
- **Domain Mastery**: Support domain affinity progression

### 1.2 Question Types & Formats

#### Multiple Choice Questions

**Description**: Standard question format with several possible answers and one or more correct options.

**Key Components**:
- Question text with contextual framing
- 3-5 answer options
- Correct answer indication
- Educational feedback for both correct and incorrect responses
- Optional follow-up question for deeper exploration

**Example**:
> Dr. Quinn asks: "What defines a small field in radiation therapy dosimetry?"
> 
> Options:
> - Any field smaller than 10×10 cm²
> - A field where lateral charged particle equilibrium is compromised (correct)
> - Fields used only for SRS treatments
> 
> Feedback: "Yes! The physics—it's about charged particle equilibrium—fundamental to accurate dosimetry!"

**Mastery Gain**: MC_QUESTION_MASTERY_GAIN (1-4% based on difficulty)

#### Matching Questions

**Description**: Questions that require matching items from one category with their corresponding items from another category.

**Key Components**:
- Source set of items (concepts, components, etc.)
- Target set of items to match (definitions, functions, characteristics)
- Relationship mapping between items
- Educational feedback on connections

**Example**:
> Match each radiation detector with its primary characteristic:
> 
> **Items**:
> - Farmer-type ionization chamber
> - Diode detector
> - Radiochromic film
> - TLD/OSLD
> 
> **Matches**:
> - Standard detector for absolute dose measurements
> - Higher sensitivity but over-responds to low-energy photons
> - Excellent 2D spatial resolution
> - Small passive detectors for in-vivo measurements

**Mastery Gain**: MATCHING_QUESTION_MASTERY_GAIN (2-5% based on difficulty)

#### Procedural Questions

**Description**: Questions that test understanding of sequential processes or workflows.

**Key Components**:
- Set of steps that must be ordered correctly
- Clear beginning and end points
- Educational explanations for each step
- Feedback on correct sequencing

**Example**:
> Arrange the following steps in the correct order for TG-51 photon beam calibration:
> 
> - Measure beam quality (PDD10/PDD20 or %dd(10)x)
> - Set up ionization chamber at reference depth
> - Take reference ionization reading
> - Apply temperature and pressure corrections
> - Apply beam quality conversion factor kQ
> - Calculate absorbed dose using chamber calibration factor

**Mastery Gain**: PROCEDURAL_QUESTION_MASTERY_GAIN (3-6% based on difficulty)

#### Calculation Questions

**Description**: Questions requiring mathematical calculations relevant to medical physics.

**Key Components**:
- Problem statement with context
- Variable values (either fixed or procedurally generated)
- Formula or approach to solution
- Step-by-step solution path
- Feedback explaining conceptual significance

**Example**:
> Dr. Kapoor presents a calculation: "Let's determine the temperature-pressure correction factor for an ionization chamber reading.
> 
> Given:
> - Temperature: 23°C
> - Pressure: 99.5 kPa
> - Reference temperature: 22°C
> - Reference pressure: 101.325 kPa
> 
> Calculate the temperature-pressure correction factor (PTP)."

**Mastery Gain**: CALCULATION_QUESTION_MASTERY_GAIN (5-8% based on difficulty)

#### Boast Questions (Advanced Challenge)

**Description**: High-risk, high-reward advanced challenges that replace standard questions when players choose to "boast" their knowledge.

**Key Components**:
- Advanced difficulty version of standard question
- More nuanced or complex scenario
- Higher educational reward for success
- Greater penalty for failure
- Mentor-voiced presentation

**Example**:
> Dr. Quinn's eyes light up with excitement: "Ah, confidence! Let's explore a more nuanced scenario. A patient has a tumor traversing the soft tissue-bone interface of the mandible with dental implants nearby. Describe the limitations of THREE different dose calculation algorithms for this case and rank them in order of accuracy."

**Mastery Gain**: BOAST_DIFFICULTY_MULTIPLIER × standard gain (3.0× multiplier)

### 1.3 Difficulty Progression

Questions are categorized into three difficulty levels:

**Beginner (Level 1)**
- Focus on definitions, basic concepts, and foundational knowledge
- Clear, straightforward questions with obvious correct answers
- Limited variables and simple calculations
- Direct matches between concepts

**Intermediate (Level 2)**
- Application of concepts in simple clinical contexts
- Questions requiring synthesis of multiple concepts
- Moderate calculations with multiple steps
- Less obvious connections between concepts

**Advanced (Level 3)**
- Complex clinical scenarios requiring integration of multiple domains
- Critical analysis and evaluation of approaches
- Sophisticated calculations with multiple variables
- Nuanced distinctions between similar concepts

### 1.4 Mastery-Based Challenge Selection

Question difficulty adapts to player mastery level:

| Mastery Range | Difficulty Distribution |
|---------------|-------------------------|
| 0-25% | 70% Beginner, 30% Intermediate, 0% Advanced |
| 25-50% | 30% Beginner, 50% Intermediate, 20% Advanced |
| 50-75% | 10% Beginner, 50% Intermediate, 40% Advanced |
| 75-100% | 0% Beginner, 30% Intermediate, 70% Advanced |

### 1.5 Content Quantity Requirements

Each star in the Knowledge Constellation requires a minimum number of questions for adequate coverage:

#### Question Quantity Requirements per Star
| Star Type | Multiple Choice | Matching | Procedural | Calculation | Total |
|-----------|----------------|----------|------------|-------------|-------|
| Core | 30 | 20 | 15 | 10 | 75 |
| Standard | 20 | 15 | 10 | 10 | 55 |
| Advanced | 15 | 15 | 15 | 15 | 60 |

#### Difficulty Distribution Requirements
| Star Type | Beginner | Intermediate | Advanced | Total |
|-----------|----------|--------------|----------|-------|
| Core | 30 | 30 | 15 | 75 |
| Standard | 15 | 25 | 15 | 55 |
| Advanced | 10 | 20 | 30 | 60 |

#### Total Question Volume

Based on the total star count in the Knowledge Constellation:
- 4 core stars (1 per domain) at 75 questions each: 300 questions
- 16 standard stars at 55 questions each: 880 questions
- 5 advanced stars at 60 questions each: 300 questions
- **Total minimum question count**: 1,480 questions

## 2. ACTIVITY FRAMEWORK

### 2.1 Activity Properties

Each activity in the game has the following properties:

- **Identifier:** Unique ID for the activity
- **Title:** Display name shown to the player
- **Description:** Brief activity description
- **Location:** Where activity takes place
- **Mentor:** Associated mentor ID (if any)
- **Domain:** Primary knowledge domain
- **Secondary Domain:** Optional secondary domain
- **Difficulty:** Level 1, 2, or 3
  
- **Time Properties:**
  - **Duration:** Base duration in minutes
  - **Start Hour:** Earliest hour activity can start
  - **End Hour:** Latest hour activity can end
  - **Fixed Time:** Whether activity can be rescheduled
  
- **Reward Properties:**
  - **Insight Reward:** Base Insight reward
  - **SP Reward:** Base Star Points reward
  - **Mastery Rewards:** Star mastery gains
  
- **Knowledge Properties:**
  - **Related Stars:** Star IDs related to this activity
  - **Discovery Chance:** Chance to discover new stars
  
- **Challenge Properties:**
  - **Challenge Type:** Format of educational challenges
  - **Challenge Count:** Number of challenges in activity

### 2.2 Activity Categories

#### Clinical Activities
- **Focus:** Practical application of knowledge
- **Locations:** Treatment Rooms, Simulation Suite
- **Challenge Types:** Case studies, treatment delivery, patient setup
- **Primary Domains:** RT, TP

#### Technical Activities
- **Focus:** Equipment operation and quality assurance
- **Locations:** Treatment Rooms, Dosimetry Lab
- **Challenge Types:** Equipment operation, measurements, troubleshooting
- **Primary Domains:** LA, DOS

#### Planning Activities
- **Focus:** Treatment planning and optimization
- **Locations:** Simulation Suite, Physics Office
- **Challenge Types:** Plan creation, plan evaluation, optimization
- **Primary Domains:** TP, RT

#### Didactic Activities
- **Focus:** Theoretical knowledge acquisition
- **Locations:** Classroom, Library
- **Challenge Types:** Multiple choice, matching, calculation
- **Primary Domains:** All domains

#### Research Activities
- **Focus:** Exploration and discovery
- **Locations:** Library, Physics Office
- **Challenge Types:** Literature review, experiment design
- **Primary Domains:** All domains

#### Social Activities
- **Focus:** Relationship building and professional skills
- **Locations:** Cafeteria, Conference Room
- **Challenge Types:** Dialogue, presentations, team interactions
- **Primary Domains:** Related to mentor

### 2.3 Activity Difficulty Levels

Activities are classified into three difficulty levels that affect rewards, challenges, and accessibility:

#### Level 1: Basic
- **Availability:** Spring
- **Prerequisites:** None or minimal
- **Challenge Types:** Primarily multiple choice and matching
- **Insight Reward:** 10-15 base
- **SP Reward:** 2-3 base
- **Mastery Gain:** DIRECT_ACTIVITY_MASTERY_GAIN (5-10% for related stars)

#### Level 2: Intermediate
- **Availability:** Summer, Fall
- **Prerequisites:** Related star unlocks, some mastery
- **Challenge Types:** Matching, procedural, simple calculations
- **Insight Reward:** 15-25 base
- **SP Reward:** 3-4 base
- **Mastery Gain:** DIRECT_ACTIVITY_MASTERY_GAIN (10-15% for related stars)

#### Level 3: Advanced
- **Availability:** Fall, Winter
- **Prerequisites:** Significant mastery, mentor relationships
- **Challenge Types:** Complex calculations, case analyses, research
- **Insight Reward:** 25-35 base
- **SP Reward:** 4-5 base
- **Mastery Gain:** DIRECT_ACTIVITY_MASTERY_GAIN (15-20% for related stars)

### 2.4 Activity Selection & Scheduling

#### Activity Generation System

The daily available activities are procedurally generated based on several factors:

**Base Activities (4-6 per day)**
- One activity from each main category
- Balanced across domains
- Level-appropriate difficulty

**Specialization Activities (0-3 per day)**
- Based on player's domain affinity
- Higher chance for activities in primary domain
- Specialized activities require higher mastery

**Relationship Activities (0-4 per day)**
- Mentor-specific activities
- Unlocked based on relationship level
- Special events with higher rewards

**Integrated Activities (0-1 per day)**
- Cross-domain activities
- Require balanced development
- Higher difficulty but better rewards

#### Activity Availability Factors

The availability of specific activities depends on:

1. **Season:** Activities are gated by season
2. **Player Progress:** Domain affinity and mastery requirements
3. **Constellation State:** Unlocked and active stars
4. **Mentor Relationships:** Relationship levels unlock activities
5. **Previous Completions:** Some activities have cooldowns
6. **Story Events:** Special activities for narrative progression

#### Progressive Scheduling Control

The player's ability to select activities increases over time:

**Phase 1: Guided Learning (Early Spring)**
- 2-3 mandatory activities daily
- 1-2 optional activity slots
- Limited choices for optional slots (2-3 options)

**Phase 2: Applied Learning (Late Spring/Early Summer)**
- 1-2 mandatory activities daily
- 2-3 optional activity slots
- More choices for optional slots (3-4 options)

**Phase 3: Specialist Development (Late Summer/Fall)**
- 0-1 mandatory activities daily
- 3-4 optional activity slots
- Many choices for optional slots (4-5 options)

**Phase 4: Professional Autonomy (Winter)**
- Rare mandatory activities
- 4-5 optional activity slots
- Full catalog of possibilities (5+ options per slot)

### 2.5 Activity Rewards & Challenge Integration

#### Reward Types

Activities provide several types of rewards:

**Insight Rewards**
- **Base Range:** 10-35 points based on activity difficulty
- **Performance Modifier:** ×0.5 to ×2.0 based on challenge success
- **Momentum Bonus:** +25% at Level 2, +50% at Level 3
- **Relationship Bonus:** RELATIONSHIP_INSIGHT_BONUS_L1 to L5 (+5% to +25% per mentor relationship level)
- **Constellation Bonus:** Various bonuses from patterns and abilities

**Star Points (SP) Rewards**
- **Base Range:** 2-5 SP based on activity difficulty
- **Performance Modifier:** +/-1 SP based on overall success
- **Special Activities:** Bonus SP for narrative events, boss preparation
- **Domain Affinity Bonus:** +1 SP for high (70%+) domain affinity

**Mastery Rewards**
- **Direct Gain:** DIRECT_ACTIVITY_MASTERY_GAIN (5-20% mastery for directly related stars)
- **Secondary Gain:** INDIRECT_ACTIVITY_MASTERY_GAIN (1-5% mastery for indirectly related stars)
- **Connection Strengthening:** Increases connection strength between used stars
- **Pattern Bonus:** Additional mastery when completing pattern-related activities

**Knowledge Discovery**
- **Star Glimpses:** Chance to glimpse new stars related to activity
- **Connection Insights:** Discover potential connections between stars
- **Pattern Revelations:** Hints about valuable star patterns
- **Domain Affinity:** Increases domain affinity for the activity's domain

**Relationship Development**
- **Mentor Present:** STANDARD_INTERACTION_POINTS (+1 relationship point with activity mentor)
- **Successful Boast:** BOAST_SUCCESS_RELATIONSHIP (+1 additional relationship point)
- **Failed Boast:** BOAST_FAILURE_RELATIONSHIP (-1 relationship point)
- **Special Interaction:** SPECIAL_EVENT_POINTS (+2-3 points for special events)

#### Challenge Integration

Activities contain various educational challenges of different types:

**Standard Distribution**
- **Difficulty 1 Activity:** 3-5 challenges (mostly Multiple Choice)
- **Difficulty 2 Activity:** 5-7 challenges (Mixed types)
- **Difficulty 3 Activity:** 7-10 challenges (Complex types)

**Challenge-Mastery Relationship**
The mastery level of related stars affects challenge difficulty and rewards:

**Low Mastery (<25%)**
- Simpler versions of challenges presented
- More hints provided
- Lower mastery gain but easier to complete
- Focus on knowledge acquisition over testing

**Moderate Mastery (25-50%)**
- Standard challenge difficulty
- Some hints available
- Balanced mastery gain and difficulty
- Tests application of knowledge

**High Mastery (50-75%)**
- More difficult challenges
- Fewer hints available
- Higher mastery gain but harder to complete
- Tests deeper understanding and synthesis

**Expert Mastery (75-100%)**
- Expert-level challenges
- No hints provided
- Highest mastery gain but most difficult
- Tests ability to apply knowledge in novel contexts

### 2.6 Seasonal Activity Themes

Each season focuses on different activity types and domains:

#### Spring: Fundamentals
- **Focus:** Basic concepts across all domains
- **Activity Types:** Didactic, guided practice
- **Challenge Types:** Multiple choice, matching
- **Primary Domains:** Balanced across all

#### Summer: Clinical Introduction
- **Focus:** Patient care and treatment basics
- **Activity Types:** Clinical observation, basic planning
- **Challenge Types:** Case analysis, treatment setup
- **Primary Domains:** RT, TP

#### Fall: Integration & Specialization
- **Focus:** Connecting concepts across domains, deep knowledge in primary domain
- **Activity Types:** Multi-domain practice, advanced practice
- **Challenge Types:** Mixed types with integration, complex calculations
- **Primary Domains:** All domains with connections, player's specialization

#### Winter: Professional Identity
- **Focus:** Synthesis of complete skillset
- **Activity Types:** Independent practice, special challenges
- **Challenge Types:** Novel scenarios, comprehensive cases
- **Primary Domains:** Full integration across domains

### 2.7 Activity Challenge Quantity Balance

Activities contain an appropriate number of challenges based on duration and difficulty:

| Activity Duration | Difficulty 1 | Difficulty 2 | Difficulty 3 |
|------------------|--------------|--------------|--------------|
| 1 hour | 3-4 | 4-5 | 5-6 |
| 2 hours | 5-7 | 7-9 | 9-12 |
| 4 hours | 10-15 | 15-20 | 20-25 |

### 2.8 Time-Challenge Balance

Challenge quantities are balanced against time constraints:

#### Time per Challenge Type
- **Multiple Choice:** 30-60 seconds
- **Matching:** 60-120 seconds
- **Procedural:** 90-180 seconds
- **Calculation:** 120-300 seconds
- **Case Analysis:** 180-360 seconds
- **Special Types:** Varies by implementation

#### Total Challenge Time
Total time for challenges should be 60-80% of activity duration, leaving time for:
- Introduction and context
- Transitions between challenges
- Feedback and explanation
- Summary and conclusion

## 3. BOSS ENCOUNTER SYSTEM

### 3.1 Encounter Properties

Each boss encounter has the following properties:

- **Identifier:** Unique ID for the encounter
- **Name:** Display name
- **Subtitle:** Thematic subtitle
- **Season:** When encounter appears
- **Primary Domain:** Primary knowledge domain tested
- **Secondary Domain:** Secondary knowledge domain tested
  
- **Narrative properties:**
  - **Introduction:** Opening narrative text
  - **Context:** Contextual background
  - **Resolution:** Post-victory narrative
  - **Mentor Connection:** Associated mentor
  
- **Mechanics properties:**
  - **Phases:** Sequential encounter phases
  - **Special Mechanics:** Unique encounter mechanics
  - **Knowledge Focus:** Key knowledge areas tested
  
- **Preparation properties:**
  - **Preparation Activities:** Pre-boss preparation activities
  - **Recommended Loadout:** Suggested configuration
  
- **Reward properties:**
  - **SP:** BOSS_1_SP_REWARD to BOSS_4_SP_REWARD (25-30 SP reward)
  - **Insight:** Insight reward
  - **Mastery Boost:** BOSS_MASTERY_BOOST (+15% to stars used during encounter)
  - **Relationship:** BOSS_RELATIONSHIP_REWARD (+5 relationship points with primary mentor)
  - **Special Rewards:** Unique rewards

### 3.2 Common Encounter Structure

All boss encounters follow a consistent 5-phase structure:

#### Phase 1: Introduction
- **Narrative Framing:** Establishes context and stakes
- **Initial Assessment:** Boss evaluates player's current state
- **Mechanic Introduction:** Introduces primary mechanics
- **Preparation Check:** Validates player readiness

#### Phase 2: Challenge Escalation
- **First Challenge Set:** Initial domain-specific challenges
- **Difficulty Scaling:** Adaptive challenge selection
- **Feedback Integration:** Responses adjust based on performance
- **Resource Management:** Initial pressure on player resources

#### Phase 3: Critical Juncture
- **Special Mechanic Activation:** Boss's unique challenge mechanics
- **Key Decision Point:** Strategic player choices impact outcome
- **Maximum Pressure:** Highest challenge difficulty
- **Resource Crisis:** Maximum pressure on player resources

#### Phase 4: Resolution Mechanics
- **Final Challenge:** Culminating test of knowledge
- **Integration Requirement:** Combining multiple knowledge domains
- **Recovery Opportunity:** Chance to recover from earlier mistakes
- **Victory Conditions:** Multiple paths to success

#### Phase 5: Conclusion & Transition
- **Outcome Determination:** Success/failure resolution
- **Narrative Resolution:** Story development
- **Reward Distribution:** SP and other rewards
- **Season Transition:** Bridge to next game phase

### 3.3 Boss 1: The Difficult Coworker ("The Entropic Colleague")

#### Concept & Narrative
The Difficult Coworker represents interpersonal challenges in professional environments. They appear as a coworker who creates challenging scenarios requiring technical knowledge application.

- **Metaphorical Role:** Embodies workplace challenges requiring technical explanations
- **Narrative Placement:** Summer (end of spring season)
- **Educational Purpose:** Tests application of treatment planning and radiation therapy knowledge

#### Encounter Mechanics

**Phase 1: Initial Collaboration**
- **Format:** Technical dialogue-driven interaction
- **Primary Challenge:** Apply radiation biology principles to explain treatment rationale
- **Special Mechanic - Conceptual Clarification:** Explain complex concepts in technically precise ways
- **Secondary Challenge:** Identify the optimal treatment approach with supporting rationale

**Phase 2: Plan Comparison**
- **Format:** Technical evaluation scenario
- **Primary Challenge:** Compare treatment planning approaches using technical parameters
- **Special Mechanic - Evidence-Based Discussion:** Support arguments with quantitative data
- **Secondary Challenge:** Identify optimization techniques for complex treatment cases

**Phase 3: Clinical Challenge**
- **Format:** Case-based complex scenario
- **Primary Challenge:** Resolve a challenging clinical case with conflicting requirements
- **Special Mechanic - Multi-Parameter Optimization:** Balance multiple technical factors
- **Secondary Challenge:** Apply fractionation principles to optimize treatment delivery

**Phase 4: Technical Resolution**
- **Format:** Integration challenge
- **Primary Challenge:** Create a technical solution integrating planning and delivery concepts
- **Special Mechanic - Cross-Domain Application:** Apply knowledge from multiple domains
- **Secondary Challenge:** Provide technical assessment of outcome predictions

**Phase 5: Case Conclusion**
- **Format:** Comprehensive evaluation
- **Primary Challenge:** Present a complete technical justification for the approach
- **Special Mechanic - Technical Communication:** Effectively communicate complex physics concepts
- **Resolution Condition:** Case must be resolved using technically sound methodologies

#### Strategic Counter Knowledge

**Effective Stars**
1. **rt-radiobiology:** Critical for understanding treatment response principles
2. **rt-fractionation:** Key for optimizing treatment delivery
3. **tp-dose-calculation:** Essential for quantitative assessment
4. **tp-optimization:** Important for planning approach justification

**Effective Patterns**
1. **Treatment Planning Triangle:** Connection between TP stars
2. **Clinical Application Path:** Linear connection of RT-related stars
3. **Patient Care Cluster:** Integration of planning and delivery concepts

#### Player Preparation

**Preparation Activities**
1. **Treatment Planning Review with Dr. Quinn:** +20% effectiveness in planning challenges
2. **Clinical Case Workshop:** Improves ability to analyze patient scenarios
3. **Fractionation Study Session:** Enhanced understanding of delivery optimization
4. **Optimization Techniques Review:** Helps with complex planning problems

**Recommended Configuration**
- **Active Stars:** Treatment planning and radiation therapy stars
- **Abilities:** Clinical Translation, Target Contouring, Dose Distribution
- **Mentor Boon:** Dr. Garcia's Clinical Insight (reveals key clinical factors)

### 3.4 Boss 2: The Vendor Trio ("Triskelion Solutions")

#### Concept & Narrative
The Vendor Trio represents the challenge of evaluating commercial claims and technology. They appear as three synchronized sales representatives with uncanny coordination and polished presentations.

- **Metaphorical Role:** Embodies the critical evaluation of technology claims
- **Narrative Placement:** Fall (end of summer season)
- **Educational Purpose:** Tests ability to evaluate technology claims and specifications

#### Encounter Mechanics

**Phase 1: Presentation Analysis**
- **Format:** Technical specification review
- **Primary Challenge:** Identify key technical specifications and their implications
- **Special Mechanic - Critical Assessment:** Evaluate claims against technical knowledge
- **Secondary Challenge:** Formulate technically precise questions

**Phase 2: Equipment Evaluation**
- **Format:** Performance verification testing
- **Primary Challenge:** Design tests to verify vendor performance claims
- **Special Mechanic - Test Design:** Create technically sound verification protocols
- **Secondary Challenge:** Interpret measurement results accurately

**Phase 3: Specification Comparison**
- **Format:** Technical document analysis
- **Primary Challenge:** Compare competing technical specifications quantitatively
- **Special Mechanic - Technical Discrepancy:** Identify contradictions in specifications
- **Secondary Challenge:** Assess real-world implications of technical differences

**Phase 4: Technical Interrogation**
- **Format:** In-depth technical questioning
- **Primary Challenge:** Probe technical limitations using domain knowledge
- **Special Mechanic - Knowledge Application:** Apply specific technical concepts to reveal issues
- **Secondary Challenge:** Identify optimal configuration based on physics principles

**Phase 5: Final Recommendation**
- **Format:** Technical evaluation synthesis
- **Primary Challenge:** Produce evidence-based technical assessment
- **Special Mechanic - Physics-Based Evaluation:** Apply fundamental physics to evaluation
- **Resolution Condition:** Recommendation based on sound technical principles

#### Strategic Counter Knowledge

**Effective Stars**
1. **la-components:** Critical for understanding equipment fundamentals
2. **la-beam-generation:** Understanding core technology principles
3. **dos-qa:** Testing methodologies for verification
4. **la-beam-modification:** Knowledge of beam-shaping technologies

**Effective Patterns**
1. **Technical Assessment Triangle:** Connection between evaluation stars
2. **Machine Mastery Path:** Linear connection of equipment-related stars
3. **Verification Cluster:** QA and testing-related stars

#### Player Preparation

**Preparation Activities**
1. **Technology Evaluation Seminar with Technician Jesse:** +20% effectiveness in specification analysis
2. **Measurement Protocol Review:** Improves ability to design verification tests
3. **Technical Specification Workshop:** Better understanding of technical documentation
4. **Component Analysis Training:** Enhanced ability to evaluate technical claims

**Recommended Configuration**
- **Active Stars:** Linac anatomy and equipment-related stars
- **Abilities:** Component Analysis, Machine Quality Assurance, Beam Geometry
- **Mentor Boon:** Technician Jesse's Technical Insight (reveals hidden specifications)

### 3.5 Boss 3: The Audit Team ("Protocol Incarnate")

#### Concept & Narrative
The Audit Team represents the rigid structures of quality assurance and procedural correctness. They appear as a trio of clipboard-wielding figures who speak in regulations and checklists.

- **Metaphorical Role:** Embodies technical standards and quality assurance principles
- **Narrative Placement:** Winter (end of fall season)
- **Educational Purpose:** Tests mastery of quality assurance procedures and protocol knowledge

#### Encounter Mechanics

**Phase 1: Documentation Review**
- **Format:** Protocol analysis challenges
- **Primary Challenge:** Apply knowledge of calibration protocols and standards
- **Special Mechanic - Technical Verification:** Validate technical procedures against standards
- **Secondary Challenge:** Complete missing technical information in protocols

**Phase 2: Measurement Verification**
- **Format:** Dosimetric calculation verification
- **Primary Challenge:** Perform complex dosimetric calculations following protocols
- **Special Mechanic - Precision Requirement:** Calculations require high accuracy
- **Secondary Challenge:** Identify sources of measurement uncertainty

**Phase 3: Practical Demonstration**
- **Format:** QA procedure simulation
- **Primary Challenge:** Execute quality assurance procedures in correct technical sequence
- **Special Mechanic - Procedural Accuracy:** Technical steps must be performed correctly
- **Secondary Challenge:** Troubleshoot equipment issues using technical knowledge

**Phase 4: Technical Compliance**
- **Format:** Case-based technical challenges
- **Primary Challenge:** Apply technical regulations to complex scenarios
- **Special Mechanic - Standards Integration:** Reconcile multiple technical standards
- **Secondary Challenge:** Prioritize technical quality and safety considerations

**Phase 5: Quality System Evaluation**
- **Format:** Comprehensive quality assessment
- **Primary Challenge:** Create a technically sound quality management framework
- **Special Mechanic - Technical Integration:** Combine QA, measurement, and safety knowledge
- **Resolution Condition:** System must address all technical requirements while maintaining compliance

#### Strategic Counter Knowledge

**Effective Stars**
1. **dos-calibration:** Critical for understanding measurement protocols
2. **dos-qa:** Fundamental knowledge of QA procedures
3. **la-safety:** Understanding of safety systems and interlocks
4. **dos-small-field:** Knowledge of specialized measurement conditions

**Effective Patterns**
1. **Measurement Triangle:** Connection between dosimetry stars
2. **QA Path:** Linear connection of quality-related stars
3. **Safety Cluster:** Multiple safety and quality-related stars

#### Player Preparation

**Preparation Activities**
1. **QA Protocol Review with Dr. Kapoor:** +20% effectiveness in protocol challenges
2. **Calibration Workshop:** Improves ability to perform accurate calculations
3. **Mock Audit Run:** Practice for practical QA demonstration
4. **Regulatory Study Session:** Helps understand complex technical standards

**Recommended Configuration**
- **Active Stars:** Dosimetry and quality assurance-related stars
- **Abilities:** Precision Analysis, Calibration Expertise, Quality Assurance
- **Mentor Boon:** Dr. Kapoor's Precision Focus (reduces error margin requirements)

### 3.6 Boss 4: Ionix ("The Calibration Singularity")

#### Concept & Narrative
Ionix represents the ultimate integration of all medical physics knowledge domains. It appears as a fluid, glitching entity that sometimes speaks in the player's voice, challenging them with complex, multi-domain problems.

- **Metaphorical Role:** Embodies the need for knowledge synthesis and cross-domain mastery
- **Narrative Placement:** End of Winter (final challenge)
- **Educational Purpose:** Tests comprehensive understanding across all domains

#### Encounter Mechanics

**Phase 1: Domain Integration**
- **Format:** Multi-domain knowledge challenges
- **Primary Challenge:** Apply concepts across traditional domain boundaries
- **Special Mechanic - Concept Fusion:** Concepts from different domains combine in novel ways
- **Secondary Challenge:** Identify shared physics principles across domains

**Phase 2: Technical Adaptation**
- **Format:** Adaptive problem sequence
- **Primary Challenge:** Solve technical problems with shifting parameters
- **Special Mechanic - Dynamic Difficulty:** Challenge difficulty adjusts based on performance
- **Secondary Challenge:** Identify optimal technical solutions as conditions change

**Phase 3: Knowledge Synthesis**
- **Format:** Pattern-based challenges
- **Primary Challenge:** Apply knowledge patterns to complex technical problems
- **Special Mechanic - Pattern Recognition:** Identify and apply knowledge patterns
- **Secondary Challenge:** Create new connections between technical concepts

**Phase 4: System Cascade**
- **Format:** Chain reaction technical challenges
- **Primary Challenge:** Predict technical consequences in interconnected systems
- **Special Mechanic - Technical Propagation:** Changes affect multiple technical systems
- **Secondary Challenge:** Stabilize systems using fundamental physics principles

**Phase 5: Complete Integration**
- **Format:** Comprehensive technical synthesis
- **Primary Challenge:** Create integrated solution to multi-domain technical problem
- **Special Mechanic - Holistic Knowledge:** Solution must incorporate knowledge from all domains
- **Resolution Condition:** Demonstrate mastery of interconnected medical physics principles

#### Strategic Counter Knowledge

**Effective Stars**
1. **Stars with high mastery:** Any stars with 75%+ mastery
2. **Cross-domain connection stars:** Stars connected across multiple domains
3. **Pattern-forming stars:** Stars that create complete patterns
4. **Core stars:** The fundamental stars of each domain

**Effective Patterns**
1. **Cross-Domain Triangle:** Connection between stars from different domains
2. **Knowledge Web:** Complex interconnected pattern
3. **Domain Mastery Cluster:** Complete domain coverage

#### Player Preparation

**Preparation Activities**
1. **Cross-Domain Integration Workshop:** +20% effectiveness in concept fusion challenges
2. **Advanced Problem Solving Seminar:** Improves ability to handle dynamic challenges
3. **Comprehensive Review Session:** Refreshes knowledge across all domains
4. **Pattern Recognition Exercise:** Better understanding of knowledge patterns

**Recommended Configuration**
- **Active Stars:** Balanced selection across all domains with emphasis on connections
- **Abilities:** Domain Synthesis, Dose Distribution, Beam Geometry
- **Mentor Boon:** Combined Mentor Insight (provides hints during critical moments)

### 3.7 Boss Preparation System

#### Warning System

Two days before a boss encounter becomes available, players receive:

**Warning Notification**
- **Visual Alert:** "Boss Encounter Approaching" notification
- **Mentor Message:** Associated mentor provides context
- **Calendar Marking:** Boss day marked on schedule
- **Preparation Guide:** Overview of recommended preparations

**System Changes**
- **Activity Pool:** Special preparation activities appear
- **Constellation Access:** Extended Night Phase for optimization
- **Resource Boost:** Bonus Insight generation during preparation days
- **Mentor Availability:** Associated mentor always available for consultation

#### Preparation Activities

Special activities become available during the preparation period:

**Mentor-Guided Preparation**
- **Format:** One-on-one session with associated mentor
- **Benefit:** +20% effectiveness against specific boss phase
- **Duration:** 2 hours (1 time block)
- **Requirement:** Minimum relationship level with mentor

**Knowledge Review**
- **Format:** Focused study of relevant domain
- **Benefit:** Temporary mastery boost to related stars
- **Duration:** 4 hours (2 time blocks)
- **Requirement:** Stars must be unlocked but not fully mastered

**Practical Simulation**
- **Format:** Hands-on practice of relevant skills
- **Benefit:** Improved performance in practical challenge phases
- **Duration:** 2 hours (1 time block)
- **Requirement:** Completion of related basic activities

**Strategic Planning**
- **Format:** Analysis of boss encounter structure
- **Benefit:** Reveals boss phase sequence and key mechanics
- **Duration:** 2 hours (1 time block)
- **Requirement:** None (always available)

#### Mentor Boon System

Each mentor can provide a special boon for boss encounters based on relationship level:

**Boon Power by Relationship Tier**
- **Tier 1 (10+ relationship):** Minor assistance in specific situation
- **Tier 2 (20+ relationship):** Moderate help in broader situations
- **Tier 3 (30+ relationship):** Significant advantage in critical moments
- **Tier 4 (40+ relationship):** Major assistance throughout encounter
- **Tier 5 (50 relationship):** Powerful effect that can turn the tide

**Mentor-Specific Boons**

**Dr. Kapoor (Dosimetry Expert)**
- **Tier 1 - Precision Focus:** Reduces error margin requirements by 10%
- **Tier 3 - Protocol Insight:** Highlight critical protocol elements
- **Tier 5 - Perfect Precision:** Auto-succeed one precision-based challenge

**Dr. Garcia (Radiation Therapy Expert)**
- **Tier 1 - Clinical Insight:** Reveals key clinical factors in patient cases
- **Tier 3 - Treatment Optimization:** Provides guidance on optimal approach
- **Tier 5 - Clinical Mastery:** Automatically succeed one clinical challenge

**Technician Jesse (Linac Anatomy Expert)**
- **Tier 1 - Technical Insight:** Reveals one hidden specification
- **Tier 3 - Mechanical Mastery:** Provide technical solution to equipment challenge
- **Tier 5 - Engineering Excellence:** Auto-succeed one technical challenge

**Dr. Quinn (Treatment Planning Expert)**
- **Tier 1 - Conceptual Clarity:** Simplifies one complex concept
- **Tier 3 - Optimization Insight:** Shows optimal solution path
- **Tier 5 - Brilliant Intuition:** Auto-succeed one conceptual challenge

## 4. CONTENT CREATION GUIDELINES

### 4.1 Question Writing Principles

- **Clarity**: Questions should be concise and unambiguous
- **Educational Value**: Each question should reinforce a specific concept
- **Difficulty Progression**: Clear distinction between beginner, intermediate, and advanced
- **Mentor Voice**: Question text should reflect the personality of the assigned mentor
- **Knowledge Connection**: Questions should connect to specific constellation nodes

### 4.2 Writing Effective Distractors (Wrong Answers)

- Use common misconceptions as distractors
- Ensure distractors are plausible but clearly incorrect
- Maintain consistent length and style between correct and incorrect options
- Avoid obvious patterns that could give away the answer
- Use parallel grammatical structure for all options

### 4.3 Educational Feedback Design

**Correct Answer Feedback**:
- Reinforce why the answer is correct
- Add contextual information for deeper understanding
- Connect to related concepts when possible

**Incorrect Answer Feedback**:
- Address common misconceptions
- Guide toward correct understanding
- Avoid negative or discouraging language

### 4.4 Mentor Voice Integration

Questions are presented in the voice of domain-specific mentors:

**Dr. Kapoor (Dosimetry)**
- Precise, methodical language, emphasis on accuracy
- Clear expectations and standards
- Appreciation for precision and protocol adherence

**Dr. Garcia (Radiation Therapy)**
- Warm, patient-centered, clinically contextualized
- Emphasis on practical applications
- Connection to patient outcomes

**Technician Jesse (Linac Anatomy)**
- Practical, hands-on language, equipment-focused
- Technical clarity with accessible explanations
- Real-world troubleshooting scenarios

**Dr. Quinn (Treatment Planning)**
- Conceptual, explores unexpected connections
- Enthusiasm for theoretical abstractions
- Often relates concepts across domains

### 4.5 Activity Design Guidelines

- **Educational Flow**: Structure activities to build knowledge progressively
- **Time Management**: Balance challenge quantity with available time
- **Variety**: Mix challenge types within activities
- **Context**: Provide clear narrative framing for all activities
- **Reward Balance**: Ensure rewards match difficulty and time investment
- **Domain Integration**: Create clear connections to Knowledge Constellation
- **Mentor Personality**: Express mentor characteristics in activity design

### 4.6 Boss Design Guidelines

- **Educational Purpose**: Each boss should test specific knowledge domains
- **Narrative Integration**: Connect boss encounters to overall storyline
- **Balanced Difficulty**: Ensure all build types have viable paths to success
- **Recovery Mechanics**: Provide opportunities to recover from mistakes
- **Meaningful Choices**: Offer strategic decisions with clear consequences
- **Preparation Value**: Ensure preparation activities significantly impact success
- **Reward Significance**: Provide meaningful progression through rewards

## 5. QUALITY ASSURANCE & TESTING

### 5.1 Content Testing Metrics

Key metrics to monitor during testing:

**Question Metrics**
- Success rate by question type and difficulty
- Time required to answer different question types
- Feedback helpfulness ratings
- Star mastery impact assessment

**Activity Metrics**
- Completion time vs. expected duration
- Challenge quantity appropriateness
- Reward satisfaction ratings
- Educational value perception

**Boss Metrics**
- Success/failure rates by build type
- Phase-based success rates for each encounter
- Resource usage during encounters
- Preparation activity effectiveness
- Encounter duration and pacing

### 5.2 Content Balance Issues to Monitor

Common balance issues to watch for:

**Question Balance Issues**
- Difficulty inconsistency within levels
- Overly complex or confusing wording
- Too many or too few challenges per activity
- Unclear feedback or instructions

**Activity Balance Issues**
- Time allocation problems (too short/long)
- Reward distribution imbalance
- Domain representation gaps
- Challenge type distribution issues

**Boss Balance Issues**
- Difficulty spikes between phases
- Excessive requirements for success
- Build invalidation (certain builds unable to succeed)
- Preparation dependency (excessive reliance on specific preparations)

### 5.3 Content Adjustment Mechanisms

Tools for addressing balance issues:

**Question Adjustments**
- Revise question text for clarity
- Modify difficulty classification
- Refine distractors and answer options
- Enhance feedback content

**Activity Adjustments**
- Adjust challenge quantity
- Modify time requirements
- Rebalance reward structures
- Vary challenge type distribution

**Boss Adjustments**
- Tune phase difficulty
- Revise success requirements
- Add recovery options for struggling builds
- Create secondary success routes
