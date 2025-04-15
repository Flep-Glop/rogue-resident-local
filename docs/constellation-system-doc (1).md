# Medical Physics Knowledge Constellation: System Documentation

## Table of Contents
1. [System Overview](#system-overview)
2. [Star Data Structure](#star-data-structure)
3. [Connection Data Structure](#connection-data-structure)
4. [Pattern Data Structure](#pattern-data-structure)
5. [Domain Definitions](#domain-definitions)
6. [Layout System](#layout-system)
7. [Star Catalog](#star-catalog)
   - [Treatment Planning Domain](#treatment-planning-domain)
   - [Radiation Therapy Domain](#radiation-therapy-domain)
   - [Linac Anatomy Domain](#linac-anatomy-domain)
   - [Dosimetry Domain](#dosimetry-domain)
8. [Connection Catalog](#connection-catalog)
9. [Pattern Catalog](#pattern-catalog)
10. [Mastery Visualization System](#mastery-visualization-system)
11. [SP Economy](#sp-economy)
12. [Implementation Notes](#implementation-notes)

---

## System Overview

The Knowledge Constellation system is the central visualization mechanic for player progress in Rogue Resident. It represents medical physics concepts as stars in a night sky, with connections between related concepts and patterns forming constellations that unlock special insights.

**Core Principles:**
- Stars represent individual concepts, brightening as mastery increases
- Connections show relationships between concepts
- Patterns (constellations) form when specific sets of stars are connected
- Cross-domain connections represent interdisciplinary understanding
- Layout follows a hybrid orbital-quadrant model

## Star Data Structure

Each star in the constellation is defined by the following properties:

```typescript
interface ConceptStar {
  id: string;                          // Unique identifier
  name: string;                        // Display name
  description: string;                 // Short description of concept
  domain: KnowledgeDomain;             // Domain this concept belongs to
  orbit: 0 | 1 | 2 | 3;                // Specialization level (0=core, 3=specialized)
  spCost: number;                      // Star Points required to unlock
  position: {                          // Default position in constellation
    x: number;                         // X coordinate (0-1000)
    y: number;                         // Y coordinate (0-1000)
  };
  mastery: number;                     // Current mastery level (0-100)
  discovered: boolean;                 // Whether player has discovered this concept
  active: boolean;                     // Whether concept is currently "active" in mind
  maxConnections: number;              // Maximum number of connections allowed
  connections: string[];               // IDs of connected stars
  prerequisites: string[];             // Stars that must be unlocked first
  crossDomainPotential: 'Low' | 'Medium' | 'High'; // Likelihood of cross-domain connections
  lastPracticed?: number;              // Timestamp of last practice (for decay)
  journalEntryIds: string[];           // Associated journal entries
}
```

## Connection Data Structure

Connections between stars are defined by the following properties:

```typescript
interface ConceptConnection {
  id: string;                          // Unique identifier
  source: string;                      // Source star ID
  target: string;                      // Target star ID
  type: ConnectionType;                // Type of connection
  strength: number;                    // Connection strength (0-100)
  discovered: boolean;                 // Whether player has discovered this connection
  description?: string;                // Optional description of relationship
  patternIds: string[];                // Patterns this connection is part of
}

type ConnectionType = 
  | 'fundamental'                      // Basic relationship between concepts
  | 'application'                      // Applied relationship
  | 'theoretical'                      // Theoretical relationship
  | 'cross-domain';                    // Connects concepts from different domains
```

## Pattern Data Structure

Patterns (constellations) are defined by the following properties:

```typescript
interface ConstellationPattern {
  id: string;                          // Unique identifier
  name: string;                        // Display name
  description: string;                 // Description of the pattern meaning
  starIds: string[];                   // Stars that form this pattern
  connectionIds: string[];             // Specific connections required
  discovered: boolean;                 // Whether player has discovered this pattern
  formation: PatternFormation;         // Geometric shape of pattern
  reward: PatternReward;               // Reward for completing pattern
  hint?: string;                       // Optional hint for discovering pattern
}

type PatternFormation = 'circuit' | 'triangle' | 'chain' | 'star' | 'grid';

interface PatternReward {
  type: 'sp' | 'ability' | 'insight' | 'challenge_bonus';
  value: number | string;              // Amount of SP or name of ability/insight
  description: string;                 // Description of the reward
}
```

## Domain Definitions

The constellation is organized into four primary domains:

```typescript
type KnowledgeDomain = 
  | 'treatment-planning'               // Treatment planning concepts
  | 'radiation-therapy'                // Radiation therapy delivery concepts
  | 'linac-anatomy'                    // Linear accelerator components and function
  | 'dosimetry';                       // Measurement and calibration concepts
```

**Domain Colors:**
- Treatment Planning: `#3b82f6` (Blue)
- Radiation Therapy: `#10b981` (Green)
- Linac Anatomy: `#f59e0b` (Amber)
- Dosimetry: `#ec4899` (Pink)

## Layout System

The constellation uses a hybrid orbital-quadrant layout:

1. **Quadrants:** Each domain occupies a quadrant of the constellation space
2. **Orbits:** Stars are arranged in concentric orbits representing specialization level
   - Orbit 0: Core concepts (center)
   - Orbit 1: Intermediate concepts
   - Orbit 2: Advanced concepts
   - Orbit 3: Specialized concepts
3. **Clustering:** Related stars within the same orbit and domain cluster together

**Coordinate System:**
- Origin (0,0) at center of constellation
- X and Y range from -500 to 500
- Domain quadrant angles:
  - Treatment Planning: 45° (Northeast)
  - Radiation Therapy: 135° (Southeast)
  - Linac Anatomy: 225° (Southwest)
  - Dosimetry: 315° (Northwest)
- Orbit radii:
  - Orbit 0: 0-50 units
  - Orbit 1: 100-150 units
  - Orbit 2: 200-250 units
  - Orbit 3: 300-350 units

## Star Catalog

### Treatment Planning Domain

**Orbit 0 (Core)**

| ID | Name | Description | SP Cost | Max Conn. | Cross-Domain | Prerequisites |
|---|---|---|---|---|---|---|
| tp-core | Treatment Planning | Core process of creating radiation treatment plan | 10 | 6 | High | None |

**Orbit 1 (Intermediate)**

| ID | Name | Description | SP Cost | Max Conn. | Cross-Domain | Prerequisites |
|---|---|---|---|---|---|---|
| tp-target-volumes | Target Volumes | Definition and delineation of treatment targets | 15 | 5 | Medium | tp-core |
| tp-prescription | Prescription | Specification of treatment dose parameters | 15 | 5 | High | tp-core |
| tp-plan-eval | Plan Evaluation | Methods to assess plan quality | 15 | 5 | Medium | tp-core |

**Orbit 2 (Advanced)**

| ID | Name | Description | SP Cost | Max Conn. | Cross-Domain | Prerequisites |
|---|---|---|---|---|---|---|
| tp-contour-analysis | Contour Analysis | Assessment and refinement of structure outlining | 25 | 4 | Low | tp-target-volumes |
| tp-oars | Organs at Risk | Critical structures to be protected during treatment | 25 | 4 | Medium | tp-target-volumes |
| tp-dose-constraints | Dose Constraints | Limitations on radiation dose to structures | 25 | 4 | Medium | tp-oars |
| tp-fractionation | Fractionation | Division of total dose across multiple sessions | 25 | 4 | Medium | tp-prescription |
| tp-dvh | DVH Analysis | Dose-volume histogram interpretation | 25 | 4 | Medium | tp-plan-eval |
| tp-plan-qa | Plan QA | Quality assurance for treatment plans | 25 | 4 | High | tp-plan-eval |

**Orbit 3 (Specialized)**

| ID | Name | Description | SP Cost | Max Conn. | Cross-Domain | Prerequisites |
|---|---|---|---|---|---|---|
| tp-auto-segmentation | Auto-Segmentation | Automated contouring using algorithms | 40 | 3 | Low | tp-contour-analysis |
| tp-oar-prioritization | OAR Prioritization | Strategic ranking of organ sparing priority | 40 | 3 | Low | tp-oars |
| tp-bio-modeling | Biological Modeling | Incorporating biological response into planning | 40 | 3 | Medium | tp-dose-constraints |
| tp-adaptive-planning | Adaptive Planning | Modification of plans during treatment course | 40 | 3 | Medium | tp-fractionation |
| tp-mco | Multi-Criteria Optimization | Balancing competing objectives in planning | 45 | 3 | Low | tp-dvh |
| tp-robust-planning | Robust Planning | Planning accounting for uncertainties | 45 | 3 | Low | tp-plan-qa |

### Radiation Therapy Domain

**Orbit 0 (Core)**

| ID | Name | Description | SP Cost | Max Conn. | Cross-Domain | Prerequisites |
|---|---|---|---|---|---|---|
| rt-core | Radiation Therapy | Core principles of therapeutic radiation delivery | 10 | 6 | High | None |

**Orbit 1 (Intermediate)**

| ID | Name | Description | SP Cost | Max Conn. | Cross-Domain | Prerequisites |
|---|---|---|---|---|---|---|
| rt-delivery-tech | Delivery Techniques | Methods for delivering radiation treatment | 15 | 5 | High | rt-core |
| rt-patient-pos | Patient Positioning | Proper setup of patients for treatment | 15 | 5 | Medium | rt-core |
| rt-treat-protocol | Treatment Protocols | Standard procedures for treatment delivery | 15 | 5 | Medium | rt-core |

**Orbit 2 (Advanced)**

| ID | Name | Description | SP Cost | Max Conn. | Cross-Domain | Prerequisites |
|---|---|---|---|---|---|---|
| rt-imrt | IMRT Delivery | Intensity-modulated radiation therapy techniques | 25 | 4 | High | rt-delivery-tech |
| rt-vmat | VMAT Delivery | Volumetric modulated arc therapy techniques | 25 | 4 | High | rt-delivery-tech |
| rt-imaging-guidance | Imaging Guidance | Using imaging for precise positioning | 25 | 4 | Medium | rt-patient-pos |
| rt-site-specific | Site-Specific Protocols | Protocols tailored to treatment sites | 25 | 4 | Medium | rt-treat-protocol |

**Orbit 3 (Specialized)**

| ID | Name | Description | SP Cost | Max Conn. | Cross-Domain | Prerequisites |
|---|---|---|---|---|---|---|
| rt-single-fraction | Single Fraction RT | High-dose treatments in one session | 40 | 3 | Medium | rt-imrt |
| rt-motion-mgmt | Motion Management | Techniques to address patient motion | 40 | 3 | Medium | rt-vmat |
| rt-6dof | 6DOF Setup | Six-degree of freedom patient setup | 40 | 3 | Low | rt-imaging-guidance |
| rt-flash | FLASH RT | Ultra-high dose rate treatment | 45 | 3 | High | rt-site-specific |

### Linac Anatomy Domain

**Orbit 0 (Core)**

| ID | Name | Description | SP Cost | Max Conn. | Cross-Domain | Prerequisites |
|---|---|---|---|---|---|---|
| la-core | Linac Anatomy | Core components and function of linear accelerators | 10 | 6 | High | None |

**Orbit 1 (Intermediate)**

| ID | Name | Description | SP Cost | Max Conn. | Cross-Domain | Prerequisites |
|---|---|---|---|---|---|---|
| la-beam-gen | Beam Generation | How radiation beams are produced | 15 | 5 | Medium | la-core |
| la-beam-mod | Beam Modification | How radiation beams are shaped and modified | 15 | 5 | High | la-core |
| la-imaging-sys | Imaging Systems | Imaging components integrated into linacs | 15 | 5 | Medium | la-core |

**Orbit 2 (Advanced)**

| ID | Name | Description | SP Cost | Max Conn. | Cross-Domain | Prerequisites |
|---|---|---|---|---|---|---|
| la-target-foil | Target & Foil | Electron to photon conversion systems | 25 | 4 | Medium | la-beam-gen |
| la-mlc | Multi-Leaf Collimator | Beam-shaping device with movable leaves | 25 | 4 | High | la-beam-mod |
| la-kv-imaging | kV Imaging | Kilovoltage imaging systems | 25 | 4 | Medium | la-imaging-sys |

**Orbit 3 (Specialized)**

| ID | Name | Description | SP Cost | Max Conn. | Cross-Domain | Prerequisites |
|---|---|---|---|---|---|---|
| la-electron-scatter | Electron Scatter | Physics of electron beam scattering | 40 | 3 | Medium | la-target-foil |
| la-leaf-design | Leaf Design | MLC leaf design considerations | 40 | 3 | Low | la-mlc |
| la-cbct | Cone Beam CT | 3D imaging using cone beam geometry | 40 | 3 | Medium | la-kv-imaging |

### Dosimetry Domain

**Orbit 0 (Core)**

| ID | Name | Description | SP Cost | Max Conn. | Cross-Domain | Prerequisites |
|---|---|---|---|---|---|---|
| do-core | Dosimetry | Core principles of radiation measurement | 10 | 6 | High | None |

**Orbit 1 (Intermediate)**

| ID | Name | Description | SP Cost | Max Conn. | Cross-Domain | Prerequisites |
|---|---|---|---|---|---|---|
| do-output-cal | Output Calibration | Calibration of radiation output | 15 | 5 | High | do-core |
| do-relative-dos | Relative Dosimetry | Measurement of relative dose distributions | 15 | 5 | Medium | do-core |
| do-patient-qa | Patient-Specific QA | Quality assurance for individual treatments | 15 | 5 | High | do-core |

**Orbit 2 (Advanced)**

| ID | Name | Description | SP Cost | Max Conn. | Cross-Domain | Prerequisites |
|---|---|---|---|---|---|---|
| do-ion-chambers | Ionization Chambers | Gas-filled radiation detectors | 25 | 4 | Medium | do-output-cal |
| do-small-field | Small Field Dosimetry | Measuring dose in small radiation fields | 25 | 4 | Medium | do-relative-dos |
| do-gamma-analysis | Gamma Analysis | Statistical comparison of dose distributions | 25 | 4 | Medium | do-patient-qa |

**Orbit 3 (Specialized)**

| ID | Name | Description | SP Cost | Max Conn. | Cross-Domain | Prerequisites |
|---|---|---|---|---|---|---|
| do-pulse-depend | Pulse Dependence | Effect of pulse structure on measurements | 40 | 3 | Medium | do-ion-chambers |
| do-detector-effect | Detector Effects | Impacts of detector design on measurements | 40 | 3 | Medium | do-small-field |
| do-dose-reconstruction | Dose Reconstruction | Reconstructing 3D dose from measurements | 40 | 3 | Medium | do-gamma-analysis |

## Connection Catalog

### Core Domain Connections

| ID | Source | Target | Type | Description |
|---|---|---|---|---|
| conn-tp-rt | tp-core | rt-core | fundamental | Relationship between planning and delivery |
| conn-rt-la | rt-core | la-core | fundamental | Relationship between therapy and equipment |
| conn-la-do | la-core | do-core | fundamental | Relationship between equipment and measurement |
| conn-do-tp | do-core | tp-core | fundamental | Relationship between measurement and planning |

### Treatment Planning Domain Connections

| ID | Source | Target | Type | Description |
|---|---|---|---|---|
| conn-tp-core-targets | tp-core | tp-target-volumes | fundamental | Treatment planning requires target definition |
| conn-tp-core-prescription | tp-core | tp-prescription | fundamental | Planning requires dose prescription |
| conn-tp-core-eval | tp-core | tp-plan-eval | fundamental | Planning requires evaluation methods |
| conn-tp-target-contour | tp-target-volumes | tp-contour-analysis | application | Target volumes are defined through contour analysis |
| conn-tp-target-oars | tp-target-volumes | tp-oars | fundamental | Targets must be considered in relation to OARs |
| conn-tp-prescription-frac | tp-prescription | tp-fractionation | fundamental | Prescription includes fractionation scheme |
| conn-tp-plan-dvh | tp-plan-eval | tp-dvh | application | Plan evaluation uses DVH analysis |
| conn-tp-plan-qa | tp-plan-eval | tp-plan-qa | application | Plan evaluation involves quality assurance |
| conn-tp-oars-constraints | tp-oars | tp-dose-constraints | fundamental | OARs have dose constraints |
| conn-tp-contour-auto | tp-contour-analysis | tp-auto-segmentation | theoretical | Contour analysis can be automated |
| conn-tp-oars-priority | tp-oars | tp-oar-prioritization | application | OARs require prioritization for planning |
| conn-tp-constraints-bio | tp-dose-constraints | tp-bio-modeling | theoretical | Dose constraints have biological basis |
| conn-tp-frac-adaptive | tp-fractionation | tp-adaptive-planning | application | Fractionation enables adaptive planning |
| conn-tp-dvh-mco | tp-dvh | tp-mco | application | DVH analysis informs optimization |
| conn-tp-qa-robust | tp-plan-qa | tp-robust-planning | theoretical | QA informs robust planning approaches |

### Radiation Therapy Domain Connections

| ID | Source | Target | Type | Description |
|---|---|---|---|---|
| conn-rt-core-delivery | rt-core | rt-delivery-tech | fundamental | Radiation therapy uses delivery techniques |
| conn-rt-core-position | rt-core | rt-patient-pos | fundamental | Therapy requires patient positioning |
| conn-rt-core-protocol | rt-core | rt-treat-protocol | fundamental | Therapy follows treatment protocols |
| conn-rt-delivery-imrt | rt-delivery-tech | rt-imrt | application | IMRT is a delivery technique |
| conn-rt-delivery-vmat | rt-delivery-tech | rt-vmat | application | VMAT is a delivery technique |
| conn-rt-pos-imaging | rt-patient-pos | rt-imaging-guidance | application | Positioning uses imaging guidance |
| conn-rt-protocol-site | rt-treat-protocol | rt-site-specific | application | Protocols are site-specific |
| conn-rt-imrt-sf | rt-imrt | rt-single-fraction | application | IMRT enables single fraction treatments |
| conn-rt-vmat-motion | rt-vmat | rt-motion-mgmt | application | VMAT requires motion management |
| conn-rt-imaging-6dof | rt-imaging-guidance | rt-6dof | application | Imaging enables 6DOF setup |
| conn-rt-site-flash | rt-site-specific | rt-flash | theoretical | Site-specific protocols for FLASH RT |

### Linac Anatomy Domain Connections

| ID | Source | Target | Type | Description |
|---|---|---|---|---|
| conn-la-core-beamgen | la-core | la-beam-gen | fundamental | Linacs generate radiation beams |
| conn-la-core-beammod | la-core | la-beam-mod | fundamental | Linacs modify radiation beams |
| conn-la-core-imaging | la-core | la-imaging-sys | fundamental | Linacs include imaging systems |
| conn-la-beamgen-target | la-beam-gen | la-target-foil | fundamental | Beam generation uses targets and foils |
| conn-la-beammod-mlc | la-beam-mod | la-mlc | application | Beam modification uses MLCs |
| conn-la-imaging-kv | la-imaging-sys | la-kv-imaging | application | Imaging systems use kV X-rays |
| conn-la-target-scatter | la-target-foil | la-electron-scatter | theoretical | Target interaction causes electron scatter |
| conn-la-mlc-leaf | la-mlc | la-leaf-design | application | MLCs have specific leaf designs |
| conn-la-kv-cbct | la-kv-imaging | la-cbct | application | kV imaging enables CBCT |

### Dosimetry Domain Connections

| ID | Source | Target | Type | Description |
|---|---|---|---|---|
| conn-do-core-output | do-core | do-output-cal | fundamental | Dosimetry includes output calibration |
| conn-do-core-relative | do-core | do-relative-dos | fundamental | Dosimetry includes relative measurements |
| conn-do-core-patientqa | do-core | do-patient-qa | fundamental | Dosimetry enables patient-specific QA |
| conn-do-output-chambers | do-output-cal | do-ion-chambers | application | Output calibration uses ion chambers |
| conn-do-relative-small | do-relative-dos | do-small-field | application | Relative dosimetry includes small fields |
| conn-do-patientqa-gamma | do-patient-qa | do-gamma-analysis | application | Patient QA uses gamma analysis |
| conn-do-chambers-pulse | do-ion-chambers | do-pulse-depend | theoretical | Ion chambers have pulse dependence |
| conn-do-small-detector | do-small-field | do-detector-effect | theoretical | Small fields show detector effects |
| conn-do-gamma-reconstruction | do-gamma-analysis | do-dose-reconstruction | application | Gamma analysis informs dose reconstruction |

### Cross-Domain Connections

| ID | Source | Target | Type | Description |
|---|---|---|---|---|
| conn-cross-tp-rt-1 | tp-prescription | rt-treat-protocol | cross-domain | Prescriptions inform treatment protocols |
| conn-cross-tp-do-1 | tp-plan-qa | do-patient-qa | cross-domain | Plan QA requires dosimetric verification |
| conn-cross-tp-la-1 | tp-mco | la-mlc | cross-domain | Optimization considers MLC capabilities |
| conn-cross-rt-la-1 | rt-imrt | la-mlc | cross-domain | IMRT delivery requires MLC |
| conn-cross-rt-do-1 | rt-imaging-guidance | do-ion-chambers | cross-domain | Imaging affects chamber measurements |
| conn-cross-la-do-1 | la-electron-scatter | do-small-field | cross-domain | Electron scatter affects small field dosimetry |
| conn-cross-do-tp-1 | do-gamma-analysis | tp-dvh | cross-domain | Gamma analysis verifies DVH predictions |
| conn-cross-rt-tp-1 | rt-patient-pos | tp-target-volumes | cross-domain | Patient positioning affects target coverage |

## Pattern Catalog

### Quality Assurance Circuit

| Property | Value |
|---|---|
| ID | pattern-qa-circuit |
| Name | Quality Assurance Circuit |
| Description | Fundamental cycle of quality verification in radiation oncology |
| Stars | do-output-cal, do-patient-qa, tp-plan-qa, rt-imaging-guidance |
| Formation | circuit |
| Reward | +25 SP, Improved accuracy in QA challenges |

### ALARA Principle Triangle

| Property | Value |
|---|---|
| ID | pattern-alara |
| Name | ALARA Principle Triangle |
| Description | As Low As Reasonably Achievable radiation safety principle |
| Stars | do-core, tp-dose-constraints, rt-patient-pos |
| Formation | triangle |
| Reward | +15 SP, Reduced error rate in safety challenges |

### Treatment Planning Cascade

| Property | Value |
|---|---|
| ID | pattern-planning-cascade |
| Name | Treatment Planning Cascade |
| Description | Sequential flow of treatment planning process |
| Stars | tp-target-volumes, tp-prescription, tp-plan-eval, tp-dvh, tp-plan-qa |
| Formation | chain |
| Reward | +30 SP, Improved performance in planning challenges |

### Beam Delivery Precision Star

| Property | Value |
|---|---|
| ID | pattern-beam-precision |
| Name | Beam Delivery Precision Star |
| Description | Key components for precise beam delivery |
| Stars | rt-imrt, la-mlc, do-small-field, la-beam-mod, rt-imaging-guidance |
| Formation | star |
| Reward | +35 SP, Unlocks special beam configuration options |

### Plan Optimization Diamond

| Property | Value |
|---|---|
| ID | pattern-plan-optimization |
| Name | Plan Optimization Diamond |
| Description | Core concepts for optimizing treatment plans |
| Stars | tp-plan-eval, tp-dvh, tp-mco, tp-plan-qa |
| Formation | circuit |
| Reward | +20 SP, Improved performance in optimization challenges |

## Mastery Visualization System

The mastery level of concepts is visually represented through several mechanisms:

1. **Star Brightness:**
   - 0-25% Mastery: Dim, small star
   - 25-50% Mastery: Brighter, medium star
   - 50-75% Mastery: Bright star with corona
   - 75-100% Mastery: Pulsing brilliant star

2. **Connection Strength:**
   - Fundamental connections start stronger (50% opacity)
   - Application and theoretical connections start weaker (30% opacity)
   - Connection opacity increases with usage (up to 100%)
   - Connection thickness increases with mastery of connected stars

3. **Domain Mastery Visualization:**
   - Each domain's overall mastery is shown as a color gradient
   - Domain sections become more vibrant as mastery increases
   - Special effects (cosmic dust, subtle movement) increase with domain mastery

4. **Visual Effects by Mastery Level:**

| Mastery Level | Star Size | Star Brightness | Corona Effect | Pulse Effect |
|---|---|---|---|---|
| 0-25% | 75% | 40% opacity | None | None |
| 25-50% | 85% | 60% opacity | Faint | None |
| 50-75% | 100% | 80% opacity | Clear | None |
| 75-100% | 110% | 100% opacity | Bright | Slow pulse |
| 100% | 120% | 100% opacity | Vibrant | Distinct pulse |

## SP Economy

Star Points (SP) are the currency used to unlock new stars in the constellation.

**SP Sources:**
- Daily challenges: 5-15 SP per challenge
- Pattern completion: 15-35 SP per pattern
- Mentor relationship milestones: 10-25 SP per level
- Boss encounters: 30-50 SP per encounter

**SP Costs by Orbit:**
- Orbit 0 (Core): 10 SP
- Orbit 1 (Intermediate): 15 SP
- Orbit 2 (Advanced): 25 SP
- Orbit 3 (Specialized): 40-45 SP

**Balancing Considerations:**
- Initial player SP at start: 25 SP (enough for core + first intermediate)
- Average SP gain per day cycle: ~30-40 SP
- Average SP cost to unlock a significant branch: ~75-100 SP
- First completion of a pattern should provide ~50% of SP needed for a new star in that domain

## Implementation Notes

### Connection Formation Rules

1. Stars must have minimum 25% mastery to form connections
2. Stars can only form connections within their `maxConnections` limit
3. Cross-domain connections require at least 40% mastery in both stars
4. Connection strength starts at:
   - Fundamental connections: 50%
   - Application connections: 40%
   - Theoretical connections: 30%
   - Cross-domain connections: 25%
5. Connection strength increases by:
   - +5% each time related concepts are used together
   - +10% when a pattern involving the connection is completed
   - +1% per day when both stars are active

### Star Activation Rules

1. Players can manually activate/deactivate stars
2. Maximum active stars = 5 + (1 per 10 stars discovered)
3. Active stars:
   - Have higher visual prominence
   - Decay mastery more slowly
   - Are more likely to appear in challenges
   - Can form connections more easily

### Knowledge Decay System

1. Star mastery decays over time when not practiced
2. Decay rates:
   - Active stars: -0.5% per day
   - Inactive stars: -1% per day
   - 75%+ mastery stars: half the normal decay rate
   - Core concepts (Orbit 0): one-quarter the normal decay rate
3. Decay stops at 25% mastery (information is never completely forgotten)
4. Visual indicator shows time until decay will occur

### Shooting Star Events

1. Shooting stars represent special insight opportunities
2. Triggered by:
   - Completing a pattern (50% chance)
   - Reaching 75% domain mastery (100% chance)
   - Forming specific cross-domain connections (25% chance)
3. Shooting stars are temporary (disappear after ~2 days)
4. Interacting with a shooting star reveals a hidden star or special connection

### Phase 1 Implementation Priorities

1. Core stars for all domains (4 total)
2. Orbit 1 stars for all domains (12 total)
3. Fundamental connections between all implemented stars
4. Basic pattern detection for 3 patterns:
   - Quality Assurance Circuit
   - ALARA Principle Triangle
   - Treatment Planning Cascade
5. Simple mastery visualization system (brightness only)
6. Basic SP economy
