# ROGUE RESIDENT: CORE SYSTEMS DOCUMENT
**Document Version:** 2.0  
**Status:** Design Specification  
**Last Updated:** May 07, 2025

## DOCUMENT PURPOSE

This document provides comprehensive specifications for the core gameplay systems in Rogue Resident, including the Knowledge Constellation, Clinical Applications System, Resource Systems, and Progression Framework. This document is the primary reference for these systems, with other documents referring to these specifications rather than duplicating them.

## 1. RESOURCE SYSTEMS

### 1.1 Star Points (SP) Economy

#### Total SP Economy
- **Total SP available:** TOTAL_SP_AVAILABLE (300 SP)
- **Total SP needed for everything:** TOTAL_SP_REQUIRED (450 SP)
- **Economy Gap:** ECONOMY_GAP (150 SP - 33.3% specialization requirement)
- **Purpose:** Forces meaningful specialization choices while allowing for multiple viable builds

#### SP Distribution by Season
Each season provides a structured amount of SP to ensure consistent progression:

| Season | Available SP | Cumulative SP | Expected Unlocks |
|--------|--------------|---------------|------------------|
| Spring | 75 SP | 75 SP | 5-7 stars |
| Summer | 75 SP | 150 SP | 10-12 stars total |
| Fall | 75 SP | 225 SP | 15-17 stars total |
| Winter | 75 SP | 300 SP | 20-22 stars total |

#### SP Earning Mechanisms
- **Activity Completion:** 2-5 SP based on difficulty and performance
- **Boss Encounter Rewards:** 25-30 SP per boss (110 SP total)
- **Special Events:** 5-10 SP each (60 SP total)
- **Insight Conversion:** 5 Insight converts to 1 SP (max 4 SP per day)

#### SP Expenditure
- **Core Stars:** CORE_STAR_COST (10 SP each - one per domain)
- **Standard Stars:** STANDARD_STAR_BASE_COST (20 SP base cost)
- **Advanced Stars:** ADVANCED_STAR_BASE_COST (25-30 SP base cost)
- **Domain Discount:** DOMAIN_DISCOUNT (Each subsequent star in the same domain costs 5 SP less, minimum 10 SP)

### 1.2 Insight System

#### Daily Insight Management
- **Starting Insight:** 0 (resets each day)
- **Maximum Capacity:** MAX_INSIGHT (100 Insight)
- **Daily Activities:** ~4-5 activities per day
- **Insight per Activity:** 15-30 Insight based on difficulty and performance
- **Daily Active Star Bonus:** ACTIVE_STAR_INSIGHT_BONUS (+1 Insight per domain with 25% total mastery)
- **Daily Generation Target:** DAILY_INSIGHT_GENERATION (80-120 Insight per day)

#### Insight Generation Formula
```
Insight Gained = Base Value × Mastery Multiplier × Relationship Bonus × Ability Modifiers
```

Where:
- **Base Value:** Activity difficulty (Easy: 5, Medium: 7, Hard: 10)
- **Mastery Multiplier:** Based on star mastery (0.5× to 2.0×)
- **Relationship Bonus:** Based on mentor relationship level (1.05× to 1.25×)
- **Ability Modifiers:** Additional multipliers from active abilities

#### Insight Expenditure
- **Ability Activation:** 20-75 Insight based on ability power
- **Boast Action:** BOAST_COST (50 Insight)
- **SP Conversion:** INSIGHT_TO_SP_CONVERSION (5 Insight → 1 SP, max 20 Insight per day)

### 1.3 Momentum System

#### Momentum Mechanics
- **Visualization:** 0-3 levels indicated by pips (⚡)
- **Gain Rate:** +1 level per consecutive correct answer
- **Decay:** Reset on incorrect answers or activity completion
- **Level Benefits:**
  - **Level 1:** Base state (no special effects)
  - **Level 2:** Questions worth +25% Insight
  - **Level 3:** Unlocks Boast action, questions worth +50% Insight

#### Build-Specific Momentum Variations
Each build archetype has unique momentum characteristics:

| Build Type | Momentum Specialty |
|------------|-------------------|
| Specialist | Reaches level 3 in 3 answers instead of 5 |
| Technician | Momentum partially carries over between similar activities |
| Integrator | Decay is reduced (incorrect answers -1 level instead of reset) |
| Communicator | Special "momentum boost" options in dialogue |

### 1.4 Mastery Progression

#### Mastery Acquisition Methods
- **Challenge Completion:** 1-8% mastery gain per challenge based on difficulty
- **Activity Completion:** 5-10% for directly related activities
- **Connected Stars:** 0.5% passive gain per day per connection
- **Mentor Relationship:** +5% gain rate per relationship level

#### Mastery Gain Formula
```
MasteryGain = BaseGain × DifficultyModifier × RelationshipModifier × BuildModifier
```

Where:
- **BaseGain:** Challenge type base value
- **DifficultyModifier:** EASY_DIFFICULTY_MULTIPLIER, MEDIUM_DIFFICULTY_MULTIPLIER, HARD_DIFFICULTY_MULTIPLIER
- **RelationshipModifier:** Based on mentor relationship level
- **BuildModifier:** Build-specific bonuses

#### Mastery Tier Effects

##### Beginner Tier (0-25% Mastery)
- Basic understanding established
- Access to beginner-level questions
- Minimum connection formation prerequisite

##### Intermediate Tier (25-50% Mastery)
- Practical working knowledge
- Access to intermediate-level questions
- Standard connection formation threshold
- Contribute to domain affinity calculations
- Slight time reduction for related activities

##### Advanced Tier (50-75% Mastery)
- Comprehensive understanding
- Access to advanced-level questions
- Cross-domain connection formation threshold
- 25% time reduction for related activities
- Unlock related abilities

##### Expert Tier (75-100% Mastery)
- Full concept mastery
- Access to expert-level questions
- 50% time reduction for related activities
- Special dialogue options in discussions
- Maximum domain affinity contribution
- Pattern formation bonuses

#### Mastery Difficulty Scaling
Advancing mastery becomes progressively more challenging:

1. **0-25%:** Rapid gains from basic questions (5-10% per interaction)
2. **25-50%:** Moderate gains (3-6% per interaction)
3. **50-75%:** Slower gains requiring advanced challenges (2-4% per interaction)
4. **75-100%:** Slow gains requiring difficult challenges (1-3% per interaction)

### 1.5 Domain Affinity System

#### Domain Affinity Calculation
Domain Affinity is calculated based on:
- Active stars and their mastery percentage
- Mentor relationship level (divided by 10)
- Domain ability levels (multiplied by 5)

```
DomainAffinity = (ActiveStarMasterySum × 0.6) + (MentorLevel × 10) + (DomainAbilityLevel × 5)
```

#### Affinity Threshold Effects
- **25 Affinity:** Unlock domain-specific dialogue options
- **50 Affinity:** Reduce time for domain activities by 25%
- **75 Affinity:** Unlock "Expertise Mode" for related activities
- **100 Affinity:** Maximum domain bonuses and special patterns

#### Target Affinity by Season
Progressive affinity targets to guide player development:

| Season | Primary Domain | Secondary Domain | Tertiary Domain | Quaternary Domain |
|--------|---------------|------------------|-----------------|-------------------|
| Spring | 25-35 | 15-25 | 5-15 | 0-10 |
| Summer | 45-60 | 35-45 | 25-35 | 10-20 |
| Fall | 70-80 | 50-60 | 35-45 | 20-30 |
| Winter | 90-100 | 60-70 | 45-55 | 30-40 |

### 1.6 Professional Aptitude Stats

#### Star Contributions
Each star contributes to specific aptitude stats based on domain:

| Domain | Primary Stat | Secondary Stat |
|--------|--------------|----------------|
| Treatment Planning | Comprehension +1 | Innovation +0.5 |
| Radiation Therapy | Fluency +1 | Comprehension +0.5 |
| Linac Anatomy | Precision +1 | Innovation +0.5 |
| Dosimetry | Precision +1 | Fluency +0.5 |

#### Mentor Bonuses
Relationship levels with mentors provide aptitude bonuses:

| Mentor | Level 2 | Level 3 | Level 4 | Level 5 |
|--------|---------|---------|---------|---------|
| Dr. Quinn | +1 Comprehension | +1 Innovation | +2 Comprehension | +2 Innovation |
| Dr. Garcia | +1 Fluency | +1 Comprehension | +2 Fluency | +2 Comprehension |
| Technician Jesse | +1 Precision | +1 Innovation | +2 Precision | +2 Innovation |
| Dr. Kapoor | +1 Precision | +1 Fluency | +2 Precision | +2 Fluency |

#### Pattern Bonuses
Knowledge Constellation patterns provide additional aptitude bonuses:

| Pattern | Bonus |
|---------|-------|
| Domain Triangle | +1 to associated domain's primary stat |
| Cross-Domain Triangle | +1 Innovation |
| Domain Completion | +2 to associated domain's primary stat |
| Mentor Alignment | +1 to associated mentor's primary stat |

#### Target Aptitude Progression
Progressive targets for aptitude development:

| Season | Primary Stat | Secondary Stat | Tertiary Stat | Quaternary Stat |
|--------|-------------|----------------|---------------|-----------------|
| Spring | 4-5 | 3-4 | 2-3 | 2 |
| Summer | 6-7 | 5-6 | 4-5 | 3 |
| Fall | 8-9 | 7 | 5-6 | 4 |
| Winter | 10-12 | 8-9 | 6-7 | 5 |

## 2. KNOWLEDGE CONSTELLATION SYSTEM

### 2.1 Star Specifications

#### Star Properties
Each star in the constellation has the following properties:

- **Identifier**: Unique ID for the star
- **Name**: Display name
- **Domain**: TP (Treatment Planning), RT (Radiation Therapy), LA (Linac Anatomy), or DOS (Dosimetry)
- **Description**: Brief concept explanation
- **Type**: Core, Standard, or Advanced
- **Position**: Fixed position in the constellation visualization

**State properties:**
- **Glimpsed**: Initial exposure occurred
- **Glimpse Count**: Number of exposures (3-5 needed for discovery)
- **Discovered**: Available to be unlocked
- **Unlocked**: Purchased with SP
- **Mastery**: 0-100 progress percentage
- **Hidden**: Not yet visible in constellation

**Gameplay properties:**
- **Connectable To**: Stars that this star can connect with
- **SP Cost**: Star Points required to unlock
- **Unlock Requirements**: Prerequisite stars needed
- **Season Available**: First season this can be discovered

#### Star Types

**Core Stars** (One per domain)
- Core concept for each domain
- Available from Spring
- Lower SP cost (10 SP)
- No prerequisites
- Treatment Planning (Blue): tp-dose-calculation
- Radiation Therapy (Green): rt-radiobiology
- Linac Anatomy (Amber): la-components
- Dosimetry (Pink): dos-calibration

**Standard Stars**
- Fundamental concepts available early in the game
- Lower SP cost (15-20 SP)
- Fewer prerequisites

**Advanced Stars**
- Complex concepts available later in the game
- Higher SP cost (25-30 SP)
- More prerequisites

### 2.2 Connection Mechanics

#### Connection Properties
Each connection in the constellation has the following properties:

- **Identifier**: Unique ID for the connection
- **Source Star**: ID of the first connected star
- **Target Star**: ID of the second connected star
- **Strength**: 0-100 connection strength
- **Cross-Domain**: Whether the connection spans different domains
- **Discovered**: Has player discovered this connection?
- **Connected At**: When the connection was formed
- **Mastery**: 0-100 connection mastery (separate from stars)

#### Connection Formation Requirements
Connections can form between stars when:

1. **Both stars are unlocked**
2. **Minimum mastery threshold is met:**
   - Same domain: 40% minimum mastery in both stars
   - Cross-domain: 65% minimum mastery in both stars
   - Cross-domain with ability bonus: 50% minimum mastery

#### Connection Strength Development
Connection strength increases based on:

1. **Star Usage:** Using connected stars together in activities
2. **Related Challenges:** Completing challenges that reference both concepts
3. **Passive Growth:** Connected stars passively strengthen each other
4. **Abilities:** Certain abilities can strengthen connections

#### Connection Benefits

1. **Mastery Boost:** Connected stars gain passive mastery over time (PASSIVE_CONNECTION_MASTERY_GAIN)
2. **Insight Bonus:** Activities using connected stars generate more Insight
3. **Pattern Formation:** Multiple connections can form patterns with special effects
4. **Cross-Domain Synergy:** Cross-domain connections unlock unique abilities

### 2.3 Constellation Patterns

#### Pattern Types

**Triangle Patterns**
Three connected stars forming a triangle shape.

1. **Domain Triangle:** Three stars from the same domain
   - Effect: +10% Insight from activities related to that domain
   - Visual: Domain-colored glow connecting all three stars

2. **Cross-Domain Triangle:** Three stars from different domains
   - Effect: Unlock special "Domain Synthesis" ability
   - Visual: White/purple glow connecting all three stars

**Line Patterns**
Three stars connected in a line.

1. **Knowledge Path:** Three stars in sequence within a domain
   - Effect: +5% mastery gain rate for all three stars
   - Visual: Domain-colored pulsing connection

2. **Cross-Domain Bridge:** Three stars from different domains in a line
   - Effect: Reduces time for activities involving these domains
   - Visual: Multicolored pulsing connection

**Star Patterns**
Four or more stars in specific configurations.

1. **Domain Cluster:** Four stars from same domain connected to each other
   - Effect: Unlocks domain-specific special ability
   - Visual: Bright domain-colored aura surrounding cluster

2. **Knowledge Web:** Six or more interconnected stars
   - Effect: +10% SP from activities involving any of these stars
   - Visual: Web-like particles moving along connections

#### Pattern Discovery
Patterns are automatically detected when:

1. All required stars are unlocked
2. All required connections are formed
3. All stars meet minimum mastery requirements

#### Pattern Benefits

1. **Resource Bonuses:** Increased Insight or SP generation
2. **Mastery Bonuses:** Faster mastery development
3. **Time Benefits:** Reduced time for related activities
4. **Special Unlocks:** Unique abilities or dialogue options
5. **Boss Encounter Advantages:** Special options during boss fights

### 2.4 Knowledge Discovery System

#### Discovery Phases

**Phase 1: Initial Exposure (Glimpse)**
- Player encounters concept during activity
- Star appears as faint outline in constellation
- No interaction possible yet
- Discovery counter increments by 1

**Phase 2: Repeated Exposure**
- Multiple encounters needed (typically 3-5)
- Each exposure increments discovery counter
- Different context types required for full discovery:
  - Theoretical mention
  - Practical application
  - Clinical context
  - Mentor discussion

**Phase 3: Full Discovery**
- Star becomes visible in constellation
- Player notified of new discovery
- Star available for unlocking with SP
- Basic information revealed

#### Discovery Methods

1. **Activity Participation:**
   - Related activities have chance to expose concepts
   - Different activity types reveal different stars
   - Activity difficulty affects discovery chance

2. **Mentor Interactions:**
   - Dialogue with mentors reveals domain-specific stars
   - Relationship level affects discovery rate
   - Mentor affinity influences which stars are revealed

3. **Reading Materials:**
   - Journal articles and textbooks provide exposures
   - Library activities focus on discovery
   - Self-study options for targeted discovery

4. **Connected Concepts:**
   - Stars connected to unlocked stars are more likely to be discovered
   - Cross-domain connections can reveal stars in other domains
   - High mastery increases chance of discovering connected stars

#### Seasonal Knowledge Gating

| Season | Newly Available Stars |
|--------|----------------------|
| Spring | Core stars (all domains), 2 additional beginner stars per domain |
| Summer | 2 intermediate stars per domain, 1 advanced star per domain |
| Fall | 2 additional intermediate stars per domain, 1 advanced star per domain |
| Winter | Final advanced star per domain |

### 2.5 Visualization System

#### Constellation Layout

1. **Domain Regions:** Four distinct areas of the constellation view
   - Treatment Planning (Blue): Lower right quadrant
   - Radiation Therapy (Green): Upper right quadrant
   - Linac Anatomy (Amber): Upper left quadrant
   - Dosimetry (Pink): Lower left quadrant

2. **Star Positioning:**
   - Core stars centered in domain regions
   - Standard stars arranged around core stars
   - Advanced stars positioned at edges of domains
   - Cross-domain stars positioned at boundaries

3. **Zoom Levels:**
   - Overview: Entire constellation visible
   - Domain Focus: Single domain enlarged
   - Star Focus: Individual star and connections

#### Visual Elements

1. **Star Representation:**
   - Core stars: Larger with central glow
   - Standard stars: Medium size
   - Advanced stars: Slightly smaller with complex details
   - Size scales with mastery level

2. **Domain Visualization:**
   - Color-coding: TP (Blue), RT (Green), LA (Amber), DOS (Pink)
   - Background gradients defining domain regions
   - Domain boundaries with subtle transition effects

3. **Connection Visualization:**
   - Connection lines vary by type and strength
   - Particle effects along active connections
   - Pulse effects for newly formed connections

4. **Status Indicators:**
   - Undiscovered: Stars shown as faint outlines or hidden
   - Discovered but not unlocked: Dimmed/grayed out
   - Unlocked: Normal appearance
   - Mastery level: Visual enhancements based on mastery

## 3. CLINICAL APPLICATIONS SYSTEM

### 3.1 Ability Properties

Each ability in the game has the following properties:

- **Identifier**: Unique ID for the ability
- **Name**: Display name
- **Domain**: Associated domain (TP, RT, LA, DOS) or cross-domain
- **Description**: Brief ability description
- **Passive Effect**: Always active while the ability is equipped
- **Active Effect**: Triggered when the player spends Insight
- **Unlock Requirements**: Stars, mastery levels, or patterns needed to unlock
- **Visual Properties**: Icon, animation, and visual effects

### 3.2 Ability Slot System

Players can equip a limited number of abilities:

- **Total Slots:** ABILITY_SLOTS (3 ability slots)
- **Equipping:** Changed during Night Phase only
- **Duration:** Equipped for entire day once selected
- **Selection Interface:** Located at the resident's desk in the hill home

### 3.3 Ability Effects & Balance

#### Passive Effect Types
- **Resource Generation Effects**: Generate additional Insight, convert Insight to SP more efficiently
- **Momentum Mechanics**: Start with Momentum, build Momentum faster, maintain Momentum when normally lost
- **Activity Enhancement**: Unlock additional activities, provide special options
- **Knowledge Development**: Gain mastery during sleep, improve mastery gain rates

#### Active Effect Types
- **Resource Manipulation**: Momentum boosts, Insight generation, time manipulation
- **Challenge Assistance**: Reveal answers, simplify problems, retry opportunities
- **Special Actions**: Schedule modification, activating mentors for assistance
- **Unique Effects**: Special mechanics that fundamentally change gameplay (time compression, activity extension)

#### Effect Balancing Framework
- **Tier 1 (Minor Effect):** MINOR_ABILITY_COST (20-25 Insight)
- **Tier 2 (Standard Effect):** STANDARD_ABILITY_COST (25-35 Insight)
- **Tier 3 (Major Effect):** MAJOR_ABILITY_COST (35-50 Insight)
- **Tier 4 (Special Effect):** SPECIAL_ABILITY_COST (45-75 Insight)

### 3.4 Ability Categories

#### Treatment Planning Applications
- Focus on optimization, planning principles, and evaluation
- Examples: Dose Calculation, Optimization Algorithm, Heterogeneity
- Unlock by achieving specified mastery in Treatment Planning stars

#### Radiation Therapy Applications
- Focus on clinical delivery, protection, and adaptation
- Examples: Radiobiology, Delivery Techniques, IGRT
- Unlock by achieving specified mastery in Radiation Therapy stars

#### Linac Anatomy Applications
- Focus on equipment, components, and technical operation
- Examples: Components, Beam Generation, Safety
- Unlock by achieving specified mastery in Linac Anatomy stars

#### Dosimetry Applications
- Focus on measurements, calibration, and quality assurance
- Examples: Calibration, Small Field, Absolute Dosimetry
- Unlock by achieving specified mastery in Dosimetry stars

#### Cross-Domain Applications
- Require mastery across multiple domains
- Focus on synthesis and integration
- Examples: Domain Synthesis, Professional Intuition, Patient Care
- Unlock by achieving specified patterns or cross-domain connections

### 3.5 Ability Unlock Progression

This table shows when abilities typically become available:

| Season | Newly Available Abilities |
|--------|--------------------------|
| Spring | Core domain abilities (4-5 total) |
| Summer | Intermediate abilities (4-6 additional) |
| Fall | Advanced domain abilities (4-6 additional) |
| Winter | Cross-domain abilities (2-4 additional) |

### 3.6 Knowledge-Ability Integration

The Knowledge Constellation and Clinical Application systems are interconnected:

#### Unlock Mechanics
- **Domain Mastery Thresholds:** Total mastery within domains unlocks related abilities
- **Star Pattern Recognition:** Specific star patterns unlock specialized abilities
- **Knowledge Connections:** Strong connections between stars enhance related abilities
- **Mentor Relationship Influence:** High relationship levels with mentors enhance domain-related abilities

#### Interface Integration
- Clear visual links between knowledge areas and enabled abilities
- Dynamic ability unlocking as knowledge expands
- Tooltip system explaining which knowledge enables which abilities
- Ability selection interface separate from but related to constellation view

## 4. PROGRESSION FRAMEWORK

### 4.1 Seasonal Advancement Requirements

| Transition | Star Requirements | Mastery Requirements | Relationship Requirements | Additional Requirements |
|------------|------------------|----------------------|---------------------------|--------------------------|
| Spring → Summer | Unlock 8 total | 35% across two domains | Level 1 with two mentors | Create 2 star connections |
| Summer → Boss 1 | Unlock 10 total | 45% in primary domain | Level 2 with one mentor | Complete social challenges |
| Boss 1 → Fall | Automatic | Automatic | Automatic | Defeat Difficult Coworker |
| Fall → Boss 2 | Unlock 15 total | 60% in primary domain | Level 2 with two mentors | Complete vendor evaluation |
| Boss 2 → Winter | Automatic | Automatic | Automatic | Defeat Vendor Trio |
| Winter → Boss 3 | Unlock 20 total | 70% in primary domain | Level 3 with one mentor | Complete QA rotation |
| Boss 3 → Final Boss | Unlock 22 total | 90% in primary domain | Level 4 with one mentor | Create 12 star connections |

### 4.2 Relationship Development Timeline

Progressive relationship development targets:

| Season | Primary Mentor | Secondary Mentor | Other Mentors |
|--------|----------------|-----------------|---------------|
| Spring | Level 2 (20+) | Level 1 (10+) | Progress |
| Summer | Level 3 (30+) | Level 2 (20+) | Level 1 (10+) |
| Fall | Level 4 (40+) | Level 3 (30+) | Level 2 (20+) |
| Winter | Level 5 (50) | Level 4 (40+) | Level 2-3 (25+) |

### 4.3 Progressive Time Control

Player control over daily activities increases over time:

| Phase | Time Control Feature | Season |
|-------|----------------------|--------|
| Phase 1 | Fixed schedule with mandatory activities | Early Spring |
| Phase 2 | Choose 2 of 4 daily activities, 2 still fixed | Late Spring/Early Summer |
| Phase 3 | Choose 3 of 4 daily activities, 1 still fixed | Late Summer/Fall |
| Phase 4 | Full control over entire daily schedule | Winter |

### 4.4 Build Viability Requirements

Each build type must meet these minimum requirements to be viable against all boss encounters:

| Build Type | Primary Domain | Secondary Domain | Cross-Domain | Relationships |
|------------|---------------|------------------|--------------|---------------|
| Domain Specialist | 90%+ in one | 40%+ in one | 2 connections | Level 4 with one mentor |
| Cross-Domain Integrator | 70%+ in one | 50%+ in two others | 6 connections | Level 3 with two mentors |
| Technical Expert | 80%+ in LA/DOS | 60%+ in other tech | 3 connections | Level 3 with technical mentors |
| Communicator | 70%+ in RT/TP | 60%+ in other people | 3 connections | Level 4 with two mentors |

### 4.5 Time Economy

#### Activity Duration Base Values
- **Standard Activity:** 2 hours (1 block)
- **Extended Activity:** 4 hours (2 blocks)
- **Quick Activity:** 1 hour (half block)
- **Lunch Activities:** 1 hour (fixed)

#### Time Reduction Factors
Activity durations can be reduced by:

**Mastery-Based Time Modifiers**

| Domain Mastery Average | Time Modifier |
|------------------------|---------------|
| <30% | LOW_MASTERY_TIME_MODIFIER (1.25× - takes longer) |
| 30-70% | STANDARD_TIME_MODIFIER (1.0× - standard time) |
| 70-90% | HIGH_MASTERY_TIME_MODIFIER (0.75× - 25% faster) |
| >90% | EXPERT_MASTERY_TIME_MODIFIER (0.5× - 50% faster) |

| Relevant Star Mastery | Additional Modifier |
|-----------------------|---------------------|
| <50% | No additional effect |
| 50-75% | RELEVANT_STAR_TIME_MODIFIER_50 (0.9× - 10% faster) |
| 75-90% | RELEVANT_STAR_TIME_MODIFIER_75 (0.8× - 20% faster) |
| >90% | RELEVANT_STAR_TIME_MODIFIER_90 (0.7× - 30% faster) |

## 5. DATA STRUCTURE

Implementation uses these data structures:

```javascript
// Star data structure
Star = {
  id: String,
  name: String,
  domain: String,
  description: String,
  type: String,
  position: {x: Number, y: Number},
  state: {
    glimpsed: Boolean,
    glimpseCount: Number,
    discovered: Boolean,
    unlocked: Boolean,
    mastery: Number,
    hidden: Boolean
  },
  gameplay: {
    connectableTo: [String],
    spCost: Number,
    unlockRequirements: [String],
    seasonAvailable: String
  }
}

// Connection data structure
Connection = {
  id: String,
  source: String,
  target: String,
  strength: Number,
  crossDomain: Boolean,
  discovered: Boolean,
  connectedAt: Date,
  mastery: Number
}

// Pattern data structure
Pattern = {
  id: String,
  type: String,
  name: String,
  stars: [String],
  connections: [String],
  active: Boolean,
  discovered: Boolean,
  effect: {
    type: String,
    magnitude: Number,
    description: String
  }
}

// Ability data structure
Ability = {
  id: String,
  name: String,
  domain: String,
  description: String,
  passiveEffect: {
    type: String,
    magnitude: Number,
    description: String
  },
  activeEffect: {
    type: String,
    insightCost: Number,
    magnitude: Number,
    description: String
  },
  unlockRequirements: {
    stars: [{id: String, mastery: Number}],
    connections: [String],
    patterns: [String]
  },
  visual: {
    icon: String,
    color: String,
    animationEffect: String
  }
}
```

## APPENDIX: CLINICAL APPLICATIONS LIST

Each Clinical Application has both a passive effect (always active when equipped) and an active effect (triggered by spending Insight).

### Treatment Planning Applications:

1. **Dose Calculation**
   - **Passive Effect:** Expanded Mind - Maximum Insight increased by 10
   - **Active Effect:** Problem Decomposer - Break a single complex challenge into two separate challenges with individual rewards (25 Insight)

2. **Optimization Algorithm**
   - **Passive Effect:** Resource Converter - Convert 5 Insight into 1 SP
   - **Active Effect:** Momentum Boost - Gain 1 level of Momentum (20 Insight)

3. **Heterogeneity**
   - **Passive Effect:** Momentum Stability - Maintain Momentum level when normally lost
   - **Active Effect:** Conceptual Gravity - Questions get progressively harder but rewards increase exponentially (30 Insight)

4. **Target Volumes**
   - **Passive Effect:** Question Preview - See all questions in an activity before it begins, but Momentum builds 50% slower
   - **Active Effect:** Time Compression - Fit two 1-hour activities into a single timeslot once per day (50 Insight)

5. **Treatment Techniques**
   - **Passive Effect:** Special Access - Gain access to a unique activity not normally available
   - **Active Effect:** Quantum Question - Replace a challenge with a 50/50 coin flip that either gives maximum or minimum rewards (35 Insight)

6. **Plan Evaluation**
   - **Passive Effect:** Insight Generator - Generate +5 Insight
   - **Active Effect:** Double or Nothing - Next challenge either grants double rewards or zero rewards (30 Insight)

### Radiation Therapy Applications:

1. **Radiobiology**
   - **Passive Effect:** Morning Momentum - Begin day/activity with +1 Momentum
   - **Active Effect:** Mentor Call - During an activity, summon the associated mentor for one-time help (30 Insight)

2. **Delivery Techniques**
   - **Passive Effect:** None
   - **Active Effect:** Mentor Takeover - A mentor completes the current challenge perfectly, but you gain no mastery (40 Insight)

3. **IGRT**
   - **Passive Effect:** Image Clarity - Reveal one incorrect answer in multiple choice questions
   - **Active Effect:** Domain Resonance - All activities in a specific location grant +3 Insight for the day (25 Insight)

4. **Fractionation**
   - **Passive Effect:** None
   - **Active Effect:** Time Pressure - Activating adds a 30-second timer to all questions but doubles Insight rewards for correct answers (35 Insight)

5. **Motion Management**
   - **Passive Effect:** Adaptive Planning - Gain +2 Insight when answering questions about moving targets or changes
   - **Active Effect:** None

6. **Radiation Protection**
   - **Passive Effect:** Safety Buffer - First incorrect answer in any activity doesn't reset Momentum
   - **Active Effect:** None

7. **Adaptive Response**
   - **Passive Effect:** Momentum Efficiency - Reach Momentum level 3 with 4 successes instead of 5
   - **Active Effect:** Momentum Overdrive - Break the Momentum cap and reach level 4 (⚡⚡⚡⚡) for triple rewards but auto-resets after one challenge (40 Insight)

### Linear Accelerator Applications:

1. **Components**
   - **Passive Effect:** Night Owl - Unlock an after-hours activity slot (7-9pm) that grants +50% SP but -50% Insight
   - **Active Effect:** Extended Day - Unlock an additional activity timeslot once per day (45 Insight)

2. **Beam Generation**
   - **Passive Effect:** None
   - **Active Effect:** Priority Booking - Reserve a specific timeslot for a high-value activity in advance (30 Insight)

3. **Safety**
   - **Passive Effect:** None
   - **Active Effect:** Emergency Shutdown - Immediately end current activity but retain all rewards earned so far (35 Insight)

4. **Beam Modification**
   - **Passive Effect:** Adaptive Learning - Gain double mastery from challenges in your lowest-mastery domain
   - **Active Effect:** None

5. **Quality Assurance**
   - **Passive Effect:** Error Detection - 20% chance to get a second attempt at failed challenges
   - **Active Effect:** Comprehensive QA - Reveal the mastery gain amounts for all challenges in an activity before starting (25 Insight)

### Dosimetry Applications:

1. **Calibration**
   - **Passive Effect:** Dream Study - During sleep, gain 1% mastery in three random stars
   - **Active Effect:** Schedule Shifter - Move one scheduled activity to a different timeslot once per day (30 Insight)

2. **Small Field**
   - **Passive Effect:** Focus Intensity - Gain +3 Insight when doing solo activities without a mentor present
   - **Active Effect:** Reverse Day - All schedules run backward from evening to morning for one day (50 Insight)

3. **Absolute Dosimetry**
   - **Passive Effect:** Precision Measurement - All percentage-based calculations round up instead of down
   - **Active Effect:** Absolute Calibration - Set Momentum to maximum level instantly, but it will not increase further for the remainder of the activity (25 Insight)

### Cross-Domain Applications:

1. **Domain Synthesis**
   - **Passive Effect:** Insight Banking - Bank up to 20 Insight to be used on the following day
   - **Active Effect:** Insight Wager - Bet up to 10 Insight before an activity - double it if successful, lose it all if you fail (Special: varies)

2. **Professional Intuition**
   - **Passive Effect:** Career Network - Each mentor relationship level 3+ grants +5% to all rewards
   - **Active Effect:** None

3. **Patient Care**
   - **Passive Effect:** Bedside Manner - Gain double relationship points during clinical activities with patients
   - **Active Effect:** None
