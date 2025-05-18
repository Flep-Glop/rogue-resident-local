# ROGUE RESIDENT: CARD & ETCHING SYSTEM

**Document Version:** 2.0  
**Status:** Design Specification  
**Last Updated:** May 15, 2025

## 1. SYSTEM OVERVIEW

### 1.1 Total System Components

- **Total Application Cards:** 26
- **Total Etchings:** 10
- **Card Distribution:**
  - **Direct Star Unlocks:** 21 cards (from non-core stars)
  - **Etching Pattern Unlocks:** 3 cards (cross-domain)
  - **Core Star Cards:** 0 (core stars don't grant cards)
  - **Missing/Incomplete:** 2 cards need passive effects, 4 need active effects

### 1.2 Journal Integration

The Applications and Etching systems are physically represented through the player's journal:

- **Journal Location:** Study desk in hill home
- **Journal Sections:**
  - **Applications Collection:** Pages storing collected cards
  - **Card Slots:** Three physical slots/pockets for equipped cards
  - **Etching Catalog:** Pages documenting found etchings
  - **Mastery Notes:** Progress tracking by domain
  - **Discovery Log:** Record of when/where items were found

### 1.3 Progressive System Introduction

To avoid overwhelming players, cards are introduced gradually:

- **Days 1-2:** Dr. Garcia & RT domain only
- **Days 3-4:** Dr. Quinn & TP domain added  
- **Days 5-6:** Technician Jesse & LA domain added
- **Days 7-8:** Dr. Kapoor & DOS domain added

This creates a natural tutorial flow with manageable card acquisition (1-2 per week).

## 2. APPLICATION CARDS

### 2.1 Card Properties

Each Application card has the following properties:

- **Identifier:** Unique ID for the card
- **Name:** Display name (evocative names rather than technical)
- **Associated Star:** Star that unlocks this card
- **Domain:** Associated domain (TP, RT, LA, DOS) or cross-domain
- **Description:** Brief card description
- **Passive Effect:** Always active while the card is equipped
- **Active Effect:** Triggered when the player spends Insight
- **Insight Cost:** Amount of Insight required to activate
- **Visual Design:** Card artwork, border style, and icon

### 2.2 Card Acquisition Flow

1. Player unlocks a star using SP
2. Card travels to hill home (animation)
3. Red exclamation point appears on desk
4. Player opens journal to discover new card
5. Card can be equipped in one of three slots

### 2.3 Card Usage

- **Selection:** Cards selected during Night Phase
- **Slot Limit:** Three cards maximum (tactical choice)
- **Passive Effects:** Always active while equipped
- **Active Effects:** Triggered by spending Insight
- **Visual Feedback:** Cards glow/pulse when conditions are met

## 3. TREATMENT PLANNING DOMAIN CARDS

### 3.1 Treatment Planning Cards

| Card Name | Associated Star | Passive Effect | Active Effect (Cost) | Design Description |
|-----------|----------------|----------------|---------------------|-------------------|
| Perfect Path | tp-optimization | Convert 5 Insight into 1 SP | Gain 1 level of Momentum (20) | **Visual:** A glowing optimal beam path threading through stylized anatomical structures, with constellation points marking critical waypoints. The path pulses with mathematical equations that transform into accelerating particles.<br>**Border:** Electric blue circuitry patterns with optimization nodes<br>**Icon:** An infinity symbol made of converging beam paths |
| Adaptive Flux | tp-heterogeneity | Maintain Momentum when lost | Questions harder but rewards increase (30) | **Visual:** A fluid, shapeshifting dose distribution that morphs to accommodate different tissue densities. Heterogeneous materials float like cosmic debris, each with their own gravitational pull on the dose cloud.<br>**Border:** Gradient waves representing changing densities<br>**Icon:** A dynamic flux symbol that shifts between states |
| Foresight | tp-target-volumes | See all questions, Momentum slower | Fit two 1-hour activities in one (50) | **Visual:** Multiple transparent timelines spiraling around a central eye made of stars. Future possibilities branch out like probability trees, with glimpses of activities visible in each branch.<br>**Border:** Temporal fractals with clock constellations<br>**Icon:** An eye with an hourglass pupil |
| Quantum Leap | tp-treatment-techniques | Access unique activity | 50/50 coin flip max/min rewards (35) | **Visual:** Schrödinger's cat silhouette made of particle trails, simultaneously existing and not existing. Dice made of pure energy float in quantum superposition.<br>**Border:** Probability wave functions<br>**Icon:** A quantum die showing all faces at once |
| Double Down | tp-plan-evaluation | Generate +5 Insight | Next challenge double or zero (30) | **Visual:** Twin mirror dose distributions facing each other, one solid and bright, the other hollow and dark. Between them, a balance scale tips dramatically one way or the other.<br>**Border:** Mirrored geometric patterns<br>**Icon:** Two overlapping circles, one filled, one empty |

## 4. RADIATION THERAPY DOMAIN CARDS

### 4.1 Radiation Therapy Cards

| Card Name | Associated Star | Passive Effect | Active Effect (Cost) | Design Description |
|-----------|----------------|----------------|---------------------|-------------------|
| Expert Hand | rt-delivery-techniques | [Needs passive] | Mentor completes perfectly, no mastery (40) | **Visual:** A ghostly mentor's hand overlaid on the player's, guiding treatment delivery with perfect precision. Green energy flows from fingertips like controlled radiation.<br>**Border:** Anatomical diagram overlays<br>**Icon:** Interlocked hands with energy transfer |
| Crystal Clear | rt-igrt | Reveal one wrong answer | All activities at location +3 Insight (25) | **Visual:** A treatment field becoming transparent like glass, revealing hidden tumor boundaries and critical structures beneath. Wrong pathways dissolve into mist.<br>**Border:** Crystalline lattice structures<br>**Icon:** A magnifying glass with revealing light |
| Under Pressure | rt-fractionation | [Needs passive] | 30s timer, double Insight rewards (35) | **Visual:** A stopwatch face where each second is a patient breathing cycle. Time pressure creates visible waves of green energy that intensify treatment effects.<br>**Border:** Ticking clock mechanisms with radiation symbols<br>**Icon:** A stopwatch emitting radiation beams |
| Moving Target | rt-motion-management | +2 Insight on moving questions | [Needs active] | **Visual:** A tumor in motion tracked by adaptive crosshairs. Breathing patterns create rhythmic waves that the treatment beam follows like a dance.<br>**Border:** Sinusoidal breathing curves<br>**Icon:** Crosshairs following a wave pattern |
| Safety Net | rt-radiation-protection | First wrong doesn't reset Momentum | [Needs active] | **Visual:** A protective energy barrier that catches falling momentum stars before they shatter. The net glows with reassuring green light.<br>**Border:** Interwoven safety chains<br>**Icon:** A shield with a cushioning aura |
| Overdrive | rt-adaptive-response | Momentum L3 in 4 hits not 5 | Break cap to L4 for triple, auto-reset (40) | **Visual:** Momentum lightning breaking through its normal constraints, crackling with unstable power. A fourth momentum star forms but glows dangerously bright.<br>**Border:** Overloaded circuit patterns<br>**Icon:** Four lightning bolts in critical state |

## 5. LINEAR ACCELERATOR DOMAIN CARDS

### 5.1 Linear Accelerator Cards

| Card Name | Associated Star | Passive Effect | Active Effect (Cost) | Design Description |
|-----------|----------------|----------------|---------------------|-------------------|
| Priority Access | la-beam-generation | [Needs passive] | Reserve high-value timeslot (30) | **Visual:** A golden key card inserting into a timeline, reserving a premium treatment slot. Calendar blocks rearrange themselves to accommodate.<br>**Border:** Scheduling grid with highlighted slots<br>**Icon:** A key overlaid on a calendar |
| Emergency Protocol | la-safety | [Needs passive] | End activity, keep rewards (35) | **Visual:** A red emergency stop button surrounded by amber warning lights. Particle beams freeze mid-flight as systems safely power down.<br>**Border:** Hazard stripes and safety warnings<br>**Icon:** An emergency stop symbol with particle trails |
| Fast Learner | la-beam-modification | Double mastery in lowest domain | [Needs active] | **Visual:** Knowledge flowing like liquid metal from strong domains into weaker ones. Neural pathways light up showing accelerated learning connections.<br>**Border:** Synaptic patterns and data streams<br>**Icon:** An upward arrow with branching paths |
| Second Chance | la-quality-assurance | 20% chance retry failed challenges | Reveal mastery gains before start (25) | **Visual:** A time loop effect where a failed attempt rewinds itself. Ghost images of previous tries fade as a new opportunity crystallizes.<br>**Border:** Recursive loop patterns<br>**Icon:** A refresh symbol with probability percentage |

## 6. DOSIMETRY DOMAIN CARDS

### 6.1 Dosimetry Cards

| Card Name | Associated Star | Passive Effect | Active Effect (Cost) | Design Description |
|-----------|----------------|----------------|---------------------|-------------------|
| Laser Focus | dos-small-field | +3 Insight solo activities | Reverse day schedule (50) | **Visual:** A lone figure surrounded by a perfect circle of concentration. All distractions fade to black while the central work area glows with intense pink focus.<br>**Border:** Focusing lens rings<br>**Icon:** A target with converging rays |
| Perfect Precision | dos-absolute-dosimetry | Percentage calcs round up | Set max Momentum, no increase (25) | **Visual:** Numbers and calculations floating in space, each decimal rounding upward like ascending stars. Mathematical perfection achieved through precise measurement.<br>**Border:** Calibration marks and measurement scales<br>**Icon:** An upward rounding arrow |
| Relative Measure | dos-relative-dosimetry | +2 Insight per challenge type | Convert absolute to relative (30) | **Visual:** Multiple measurement devices arranged in a comparison array. Values shift from absolute to relative as reference points align.<br>**Border:** Comparative scale gradients<br>**Icon:** Two balanced measurement symbols |
| Detector Array | dos-detector-response | Reveal challenge difficulties | +1 SP per 3 perfect in row (35) | **Visual:** A grid of sensors lighting up to reveal hidden challenge difficulties. Each detector glows with intensity matching the challenge level it's reading.<br>**Border:** Sensor grid patterns<br>**Icon:** Multiple detection points in formation |

## 7. CROSS-DOMAIN APPLICATION CARDS

### 7.1 Cross-Domain Cards (Unlocked via Etchings)

| Card Name | Etching Source | Passive Effect | Active Effect (Cost) | Design Description |
|-----------|----------------|----------------|---------------------|-------------------|
| Tomorrow's Promise | Temporal Mastery | Bank up to 20 Insight for tomorrow | Wager Insight, double or lose (varies) | **Visual:** An hourglass where the bottom chamber opens into tomorrow's timeline. Stored insight crystallizes like temporal sand, ready to flow forward.<br>**Border:** Time spiral with day/night cycles<br>**Icon:** An hourglass with a forward arrow |
| Network Effect | Treatment Team | Mentor L3+ grants +5% all rewards | [Needs active] | **Visual:** Mentor portraits connected by glowing relationship threads. As connections strengthen, energy multiplies exponentially across the network.<br>**Border:** Network nodes and connection paths<br>**Icon:** Interconnected figure symbols |
| Bedside Manner | Patient Care | Double relationship during patient activities | [Needs active] | **Visual:** A warm aura emanating from caring hands, creating a healing space around a patient. Relationship bonds visualized as gentle light streams.<br>**Border:** Soft, organic flowing patterns<br>**Icon:** A heart with radiating care lines |

## 8. ETCHING SYSTEM

### 8.1 Etchings Overview

Etchings are constellation pattern blueprints that players discover throughout the game:

- **Physical Form:** Hand-drawn star maps found in various locations
- **Collection:** Stored in the player's journal
- **Function:** Allow players to form specific star connections
- **Discovery:** Found in library books, mentor gifts, environmental locations
- **Usage:** Applied to form connections between stars during Night Phase

### 8.2 Etching Categories

**Domain Etchings (4)**
- One per domain, discovered early
- Create domain-specific patterns
- Simpler to complete
- Found through mentor relationships

**Cross-Domain Etchings (3)**
- Connect stars across multiple domains
- Unlock special Application cards
- More complex to complete
- Found through research and exploration

**Legendary Etchings (3)**
- Rare, powerful patterns
- Special narrative significance
- Complex requirements
- Hidden in special locations

### 8.3 Pattern-Forming Etchings

| Etching Name | Pattern Shape | Required Stars | Unlocked Card | Design Description |
|--------------|---------------|----------------|---------------|-------------------|
| Temporal Mastery | The Hourglass | rt-fractionation + tp-optimization + dos-calibration | Tomorrow's Promise | **Visual:** Ancient parchment with astronomical timeline markings. Hourglass constellation with temporal flow symbols.<br>**Origin:** Found in library astronomy section |
| The Treatment Team | The Compass Rose | rt-radiobiology + tp-plan-evaluation + la-components + dos-qa | Network Effect | **Visual:** Modern medical notebook with professional team structure. Connected mentors forming compass points.<br>**Origin:** Gift from all four mentors at relationship milestone |
| Patient-Centered Care | The Embrace | rt-delivery-techniques + tp-target-volumes + rt-motion-management | Bedside Manner | **Visual:** Yellowed medical sketch with humanistic care principles. Healing hands surrounding patient outline.<br>**Origin:** Dr. Garcia's personal notes |

### 8.4 Bonus Etchings

| Etching | Discovery Method | Season | Effects |
|---------|------------------|--------|---------|
| The Physician's Eye | Library event | Summer | +15% planning Insight |
| The Healer's Path | Dr. Garcia L2 | Spring | -20% patient activity time |
| The Engineer's Blueprint | Jesse L2 | Spring | +1 ability reroll technical |
| The Metrologist's Scale | Dr. Kapoor L3 | Fall | Favorable calculation rounding |
| The Calibration Singularity | Quinn's office (90% mastery) | Winter | +5 all aptitudes, secret dialogue |
| The Resident's Journey | First cross-domain connection | Any | "Journey's End" boss ability |
| The Old Ways | Library (10 research activities) | Fall | +5% all mastery gains |

### 8.5 Etching Discovery Design

Each etching has a unique visual design and discovery method:

**Library Etchings**
- Yellowed paper, precise astronomical style
- Tucked in medical physics textbooks
- Formal, academic appearance
- Historical references in margins

**Mentor Gifts**
- Dr. Garcia: Drawn on hospital letterhead with green pen
- Jesse: Sketched on equipment manual margins
- Dr. Kapoor: Perfectly drafted on graph paper
- Dr. Quinn: Abstract, almost incomprehensible

**Environmental Discoveries**
- Whiteboard remnants in conference rooms
- Previous resident's notes in desk drawers
- Scribbled on physics office corkboard
- Hidden in Linac service panels

## 9. JOURNAL INTEGRATION

### 9.1 Journal Design

The journal serves as the physical interface for both cards and etchings:

**Physical Characteristics:**
- Leather-bound medical journal aesthetic
- Mix of printed forms and handwritten notes
- Coffee stains, paperclips, post-its for authenticity
- Pages fill up as you progress

**Journal Sections:**
1. **Card Collection Pages:** Organized by domain
2. **Daily Card Selection:** Three slots/pockets
3. **Etching Catalog:** Discovered etching patterns
4. **Connection Notes:** Formed star connections
5. **Progress Tracking:** Discovery timeline
6. **Blank Pages:** Player can sketch suspected patterns

### 9.2 Card Selection Interface

**Card Slots Features:**
- Three distinct card pockets (limit of 3 cards)
- Visual distinction between domains
- Mentor-styled pockets:
  - Dr. Garcia: Soft leather pouches
  - Jesse: Technical clip holders
  - Dr. Kapoor: Precise plastic sleeves
  - Dr. Quinn: Chaotic but functional paper clips
- Cards slightly stick out for easy identification

**Night Phase Card Selection Flow:**
1. Open journal to card collection
2. Browse available cards by domain
3. Drag cards into the three pocket slots
4. Close journal to confirm selection

### 9.3 Etching Application Interface

**Etching Usage Flow:**
1. Open journal to etching catalog
2. Review available etchings
3. Select an etching to apply
4. View potential star connections in constellation
5. Confirm connections if stars meet requirements
6. Connection forms in constellation with visual feedback

## 10. IMPLEMENTATION NOTES

### 10.1 Missing Effects to Complete

**Passive Effects Needed:**
- **Expert Hand** (rt-delivery-techniques)
- **Under Pressure** (rt-fractionation)
- **Priority Access** (la-beam-generation)
- **Emergency Protocol** (la-safety)

**Active Effects Needed:**
- **Moving Target** (rt-motion-management)
- **Safety Net** (rt-radiation-protection)
- **Fast Learner** (la-beam-modification)
- **Network Effect** (Treatment Team)
- **Bedside Manner** (Patient Care)

### 10.2 Card Implementation Priority

1. **Core Gameplay Cards:** Perfect Path, Adaptive Flux, Overdrive
2. **Domain Introduction Cards:** One per domain for tutorial
3. **Balance-Critical Cards:** Tomorrow's Promise, Crystal Clear
4. **Complete Remaining Cards:** Fill in missing effects

### 10.3 Etching Implementation Priority

1. **Tutorial Etchings:** The Healer's Path, The Engineer's Blueprint
2. **Pattern-Forming Etchings:** Temporal Mastery, Treatment Team, Patient-Centered Care
3. **Progression Etchings:** The Physician's Eye, The Metrologist's Scale
4. **Legendary Etchings:** The Calibration Singularity, The Resident's Journey, The Old Ways

## 11. VISUAL DESIGN GUIDELINES

### 11.1 Card Visual Theme

**Card Frame Components:**
- Domain color coding in corner gems
- Mastery requirement indicators
- Passive/Active effect separators
- Insight cost display for active abilities
- Constellation connection points showing origin star
- Subtle medical physics equations as background texture

**Visual Style Guidelines:**
- Professional yet visually striking aesthetic
- Clear iconography for quick recognition
- Holographic/ethereal quality suggesting knowledge made manifest
- Domain-specific color schemes and motifs
- Animated effects when cards are activated

### 11.2 Etching Visual Theme

**Etching Appearance:**
- Hand-drawn constellation diagrams
- Materials vary by source (parchment, notebook paper, etc.)
- Authentication marks and signatures
- Age-appropriate wear and color
- Astronometrical notations and measurements

**Discovery Visualization:**
- Finding animation shows unfolding/unwrapping
- Journal placement shows etching being cataloged
- Etching glows when its pattern becomes completable
- Connection lines match etching pattern when formed
