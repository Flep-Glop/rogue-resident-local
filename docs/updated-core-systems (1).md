# ROGUE RESIDENT: CORE SYSTEMS DOCUMENT
**Document Version:** 3.0  
**Status:** Design Specification  
**Last Updated:** May 15, 2025

## DOCUMENT PURPOSE

This document provides comprehensive specifications for the core gameplay systems in Rogue Resident, including the Knowledge Constellation, Applications System, Resource Systems, and Progression Framework. This document is the primary reference for these systems, with other documents referring to these specifications rather than duplicating them.

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

### 1.2 Insight Generation Formula

Insight gained from activities is calculated based on multiple factors:

- Base value depends on activity difficulty (Easy: 5, Medium: 7, Hard: 10)
- Multipliers apply for mastery level, mentor relationships, and abilities
- Additional bonuses come from momentum levels and domain affinities

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
Different gameplay styles have unique momentum characteristics, though formal archetypes have been removed:

| Playstyle | Momentum Specialty |
|------------|-------------------|
| Deep Domain Focus | Reaches level 3 in 3 answers instead of 5 |
| Technical Expertise | Momentum partially carries over between similar activities |
| Cross-Domain Integration | Decay is reduced (incorrect answers -1 level instead of reset) |
| Relationship Focus | Special "momentum boost" options in dialogue |

### 1.4 Mastery Progression

#### Mastery Acquisition Methods
- **Challenge Completion:** 1-8% mastery gain per challenge based on difficulty
- **Activity Completion:** 5-10% for directly related activities
- **Connected Stars:** 0.5% passive gain per day per connection
- **Mentor Relationship:** +5% gain rate per relationship level

### 1.4 Mastery Gain Formula

Mastery increases are calculated based on several factors:

- Base gain varies by challenge type
- Multipliers apply for difficulty, relationships, and build choices
- Additional bonuses from connected stars and pattern effects

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

### 1.5 Domain Affinity Calculation

Domain Affinity is calculated based on several factors:
- Active stars and their mastery percentages (major contribution)
- Mentor relationship levels (divided by 10)
- Domain ability levels (multiplied by 5)

Higher affinity provides benefits at thresholds of 25, 50, 75, and 100 points.

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
- **Connectable To**: Stars that this star can connect with (via etchings)
- **SP Cost**: Star Points required to unlock
- **Unlock Requirements**: Prerequisite stars needed
- **Season Available**: First season this can be discovered
- **Application**: Associated Application card unlocked when star is purchased

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
- Note: Core stars do not provide Application cards

**Standard Stars**
- Fundamental concepts available early in the game
- Lower SP cost (15-20 SP)
- Fewer prerequisites
- Each unlocks an Application card

**Advanced Stars**
- Complex concepts available later in the game
- Higher SP cost (25-30 SP)
- More prerequisites
- Each unlocks a more powerful Application card

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
- **Etching Required**: Which etching blueprint is needed to form this connection

#### Connection Formation Requirements
Connections can form between stars when:

1. **Both stars are unlocked**
2. **Player has discovered the required etching**
3. **Minimum mastery threshold is met:**
   - Same domain: 40% minimum mastery in both stars
   - Cross-domain: 65% minimum mastery in both stars
   - Cross-domain with ability bonus: 50% minimum mastery

Connections are formed manually by players during the Night Phase in their journals.

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

### 2.3 Constellation Patterns & Etchings

#### Etching System
Etchings are constellation pattern blueprints that players discover throughout the game:

- **Physical Form**: Hand-drawn star maps found in various locations
- **Collection**: Stored in the player's journal
- **Function**: Allow players to form specific star connections
- **Discovery**: Found in library books, mentor gifts, environmental locations

#### Pattern Types

**Triangle Patterns**
Three connected stars forming a triangle shape.

1. **Domain Triangle:** Three stars from the same domain
   - Effect: +10% Insight from activities related to that domain
   - Visual: Domain-colored glow connecting all three stars
   - Etching: Domain-specific etchings (4 total, one per domain)

2. **Cross-Domain Triangle:** Three stars from different domains
   - Effect: Unlock special "Domain Synthesis" ability
   - Visual: White/purple glow connecting all three stars
   - Etching: Special cross-domain etchings (3 total)

**Line Patterns**
Three stars connected in a line.

1. **Knowledge Path:** Three stars in sequence within a domain
   - Effect: +5% mastery gain rate for all three stars
   - Visual: Domain-colored pulsing connection
   - Etching: Path-specific etchings (4 total, one per domain)

2. **Cross-Domain Bridge:** Three stars from different domains in a line
   - Effect: Reduces time for activities involving these domains
   - Visual: Multicolored pulsing connection
   - Etching: Bridge-specific etchings (2 total)

**Star Patterns**
Four or more stars in specific configurations.

1. **Domain Cluster:** Four stars from same domain connected to each other
   - Effect: Unlocks domain-specific special ability
   - Visual: Bright domain-colored aura surrounding cluster
   - Etching: Cluster-specific etchings (4 total, one per domain)

2. **Knowledge Web:** Six or more interconnected stars
   - Effect: +10% SP from activities involving any of these stars
   - Visual: Web-like particles moving along connections
   - Etching: Legendary etchings (1 total)

#### Etching Discovery
Etchings are discovered through various methods:

- **Library Activities**: Research in specific sections reveals old etchings
- **Mentor Relationships**: Reaching relationship milestones grants mentor etchings
- **Environmental Discovery**: Hidden in various hospital locations
- **Boss Rewards**: Defeating bosses grants special etchings
- **Progress Milestones**: Overall mastery unlocks legendary etchings

#### Pattern Benefits

1. **Resource Bonuses:** Increased Insight or SP generation
2. **Mastery Bonuses:** Faster mastery development
3. **Time Benefits:** Reduced time for related activities
4. **Special Unlocks:** Unique abilities or dialogue options
5. **Boss Encounter Advantages:** Special options during boss fights
6. **Cross-Domain Applications:** Certain patterns unlock special Application cards

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

## 3. APPLICATIONS SYSTEM

### 3.1 Application Cards

Each Application card in the game has the following properties:

- **Identifier**: Unique ID for the card
- **Name**: Display name (evocative names rather than technical)
- **Associated Star**: Star that unlocks this card
- **Domain**: Associated domain (TP, RT, LA, DOS) or cross-domain
- **Description**: Brief card description
- **Passive Effect**: Always active while the card is equipped
- **Active Effect**: Triggered when the player spends Insight
- **Visual Properties**: Icon, animation, and visual effects
- **Journal Location**: Which journal section contains this card

### 3.2 Card Acquisition

Cards are acquired through:

1. **Star Unlocks**: Each non-core star provides an Application card
2. **Etching Patterns**: Completing certain etching patterns unlocks special cross-domain cards
3. **Boss Rewards**: Defeating bosses may unlock unique cards
4. **Special Events**: Certain events may grant unique cards

When a star is unlocked, the associated card is delivered to the player's desk at the hill home with a visual notification.

### 3.3 Journal System

Applications are managed through the player's journal:

- **Journal Location**: Study desk in hill home
- **Card Storage**: Journal pages store collected cards
- **Card Slots**: Three card slots/pockets for equipped cards
- **Night Phase Selection**: Cards are equipped during Night Phase
- **Day Phase Usage**: Active effects can be triggered during Day Phase
- **Visual Interface**: Physical card placement in journal pages

### 3.4 Ability Effects & Balance

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

### 3.5 Card Categories

#### Treatment Planning Applications
- Focus on optimization, planning principles, and evaluation
- Examples: Perfect Path, Adaptive Flux, Foresight
- Unlock by unlocking Treatment Planning stars

#### Radiation Therapy Applications
- Focus on clinical delivery, protection, and adaptation
- Examples: Expert Hand, Crystal Clear, Overdrive
- Unlock by unlocking Radiation Therapy stars

#### Linear Accelerator Applications
- Focus on equipment, components, and technical operation
- Examples: Priority Access, Emergency Protocol, Fast Learner
- Unlock by unlocking Linac Anatomy stars

#### Dosimetry Applications
- Focus on measurements, calibration, and quality assurance
- Examples: Laser Focus, Perfect Precision, Detector Array
- Unlock by unlocking Dosimetry stars

#### Cross-Domain Applications
- Require completion of etching patterns across multiple domains
- Focus on synthesis and integration
- Examples: Tomorrow's Promise, Network Effect, Bedside Manner
- Unlock by completing etching patterns

### 3.6 Card Unlock Progression

This table shows when cards typically become available:

| Season | Newly Available Applications |
|--------|--------------------------|
| Spring | Basic domain applications (4-5 total) |
| Summer | Intermediate applications (4-6 additional) |
| Fall | Advanced domain applications (4-6 additional) |
| Winter | Cross-domain applications (2-4 additional) |

### 3.7 Progressive Introduction

To avoid overwhelming players, Application cards are introduced gradually:

- **Days 1-2**: Dr. Garcia & RT domain only
- **Days 3-4**: Dr. Quinn & TP domain added  
- **Days 5-6**: Technician Jesse & LA domain added
- **Days 7-8**: Dr. Kapoor & DOS domain added

This creates a natural tutorial flow with manageable card acquisition (1-2 per week).

## 4. PROGRESSION FRAMEWORK

### 4.1 Boss Encounter Unlocking

Boss encounters are unlocked based on mastery thresholds rather than fixed days:

| Boss | Mastery Threshold | Preparation Phase | Description |
|------|-------------------|-------------------|-------------|
| The Difficult Coworker | 40% in primary domain | Available at 35% | Treatment Planning & RT focus |
| The Vendor Trio | 50% in primary domain | Available at 45% | Linac Anatomy & Dosimetry focus |
| The Audit Team | 60% in primary domain | Available at 55% | Dosimetry & QA focus |
| Ionix | 75% in primary domain | Available at 70% | Cross-domain integration |

If the player fails a boss encounter, they can retry immediately or continue normal gameplay until ready.

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

| Phase | Time Control Feature | Typical Mastery Level |
|-------|----------------------|--------|
| Phase 1 | Fixed schedule with mandatory activities | 0-25% |
| Phase 2 | Choose 2 of 4 daily activities, 2 still fixed | 25-50% |
| Phase 3 | Choose 3 of 4 daily activities, 1 still fixed | 50-75% |
| Phase 4 | Full control over entire daily schedule | 75%+ |

### 4.4 Viable Build Paths

While formal archetypes have been removed, these paths remain viable for boss encounters:

| Focus Type | Primary Domain | Secondary Domain | Cross-Domain | Relationships |
|------------|---------------|------------------|--------------|---------------|
| Domain Specialist | 90%+ in one | 40%+ in one | 2 connections | Level 4 with one mentor |
| Cross-Domain Integrator | 70%+ in one | 50%+ in two others | 6 connections | Level 3 with two mentors |
| Technical Expert | 80%+ in LA/DOS | 60%+ in other tech | 3 connections | Level 3 with technical mentors |
| Communication Focus | 70%+ in RT/TP | 60%+ in other people | 3 connections | Level 4 with two mentors |

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

## 5. DATA STRUCTURE OVERVIEW

The game's core systems rely on several key data structures that define relationships between elements:

### Star Data
- Stores identifying information, domain, type, mastery progress
- Tracks discovery state, unlock status, and connection potential
- Links to associated Application card (if applicable)

### Connection Data
- Defines relationships between stars
- Tracks strength, cross-domain status, and mastery
- References required etching blueprint
- Records when connection was formed

### Pattern Data
- Defines special star arrangements with benefits
- Links component stars and connections
- Stores active status and discovery state
- Defines effects and magnitude

### Etching Data
- Stores discovery information and source
- Defines connection pattern blueprint
- Links to associated pattern
- Tracks visual style and availability

### Application Data
- Links to source star or etching pattern
- Defines passive and active effects
- Stores visual design elements
- Tracks journal organization

## 6. HILL HOME SYSTEM

### 6.1 Hill Home Areas

The hill home contains three main interactive areas:

1. **Observatory** (Constellation System)
   - View and interact with Knowledge Constellation
   - Review star mastery and connections
   - Observe pattern formation and effects

2. **Study Desk** (Applications System)
   - Journal for managing Application cards
   - Three card slots for selecting daily loadout
   - Etching collection and pattern tracking
   - Night-to-day transition point

3. **Wardrobe/Mirror** (Character Customization)
   - Appearance customization options
   - Unlockable clothing items
   - Customization progression

### 6.2 Journal System

The player's journal serves as the primary interface for the Applications system:

- **Physical Object:** Leather-bound medical journal
- **Sections:**
  - Application card collection
  - Etching catalog
  - Daily card selection (3 slots)
  - Progression notes
  - Discovery tracking

### 6.3 Day-Night Cycle

The hill home is the center of the day-night transition:

- **End of Day:** Return to hill home after hospital activities
- **Night Phase:** Interact with desk, observatory, wardrobe
- **Sleep:** Transition to next day after completing Night Phase
- **Morning:** Brief moment at hill home before departing for hospital

### 6.4. Progression Unlocks

Hill home elements unlock progressively:

- **Early Game:** Basic desk and observatory functions
- **Mid Game:** Full journal functionality, more etching slots
- **Late Game:** Wardrobe customization, advanced observatory features

## APPENDIX: APPLICATION CARDS SUMMARY

Application cards are detailed in the Card & Etching System Document. Each card has:
- A passive effect (always active when equipped)
- An active effect (triggered by spending Insight)
- Associated star that unlocks it

The system includes:
- 5 Treatment Planning cards
- 6 Radiation Therapy cards
- 4 Linear Accelerator cards
- 4 Dosimetry cards
- 3 Cross-domain cards (unlocked via etchings)

Notable examples include:
1. **Perfect Path** - Convert Insight to SP / Gain Momentum
2. **Overdrive** - Reach higher Momentum levels / Break Momentum cap
3. **Tomorrow's Promise** - Bank Insight for next day / Wager Insight
4. **Laser Focus** - Bonus for solo activities / Reverse day schedule

See the Card & Etching System Document for complete details.
