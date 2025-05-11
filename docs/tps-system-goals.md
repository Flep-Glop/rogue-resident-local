# Simplified Treatment Planning System (TPS) Goals & Design Document

## Overview

This document outlines the goals, design principles, and educational objectives for the simplified Treatment Planning System (TPS) mini-game within Rogue Resident. The TPS serves as both an educational tool and an engaging gameplay mechanic that reinforces key medical physics concepts.

## Primary Goals

### 1. Educational Objectives
- **Conceptual Understanding**: Demonstrate fundamental treatment planning principles without overwhelming technical complexity
- **Visual Learning**: Provide intuitive visualization of dose distribution concepts
- **Interactive Exploration**: Allow hands-on experimentation with beam placement and parameters
- **Knowledge Application**: Connect theoretical knowledge to practical planning scenarios

### 2. Gameplay Integration
- **Challenge Mode**: Create planning puzzles with specific dose objectives
- **Skill Progression**: Tie planning proficiency to Knowledge Constellation development
- **Time Management**: Balance accuracy with efficiency in clinical scenarios
- **Decision Making**: Present trade-offs between competing planning goals

### 3. Technical Feasibility
- **Performance**: Maintain smooth gameplay with real-time dose calculations
- **Simplicity**: Use simplified physics models that capture essential behaviors
- **Modularity**: Design system to easily add features as needed
- **Accessibility**: Ensure intuitive controls and clear visual feedback

## Core System Components

### 1. CT Simulation Layer
**Goals:**
- Represent anatomical structures using grayscale pixel values
- Provide density information for dose calculation
- Support multiple preset patient scenarios

**Design Decisions:**
- Use 2D slices instead of full 3D volumes for simplicity
- Map pixel intensity (0-255) directly to relative density
- Pre-generate patient scenarios with clear anatomical features

### 2. Beam Placement System
**Goals:**
- Allow intuitive beam positioning and angling
- Support up to 3 beams per plan
- Provide immediate visual feedback on beam paths

**Design Decisions:**
- Click-and-drag interface for beam placement
- Rotation wheel or angle slider for beam orientation
- Visual beam path overlay showing entry/exit points
- Beam parameter adjustments (width, intensity)

### 3. Dose Calculation Engine
**Goals:**
- Calculate dose distribution in real-time
- Model basic tissue interactions and attenuation
- Demonstrate dose buildup and falloff concepts

**Design Decisions:**
- Ray-casting algorithm for computational efficiency
- Exponential attenuation model based on pixel density
- Simple scatter approximation for realism
- Grid-based dose accumulation

### 4. Visualization System
**Goals:**
- Display dose distribution clearly and intuitively
- Show isodose lines at clinically relevant levels
- Highlight hot spots and cold regions

**Design Decisions:**
- Color wash overlay (blue→green→yellow→red)
- Toggleable isodose lines (20%, 50%, 80%, 95%, 100%)
- Dose profile tools for analysis
- DVH display for plan evaluation

## Educational Content Integration

### 1. Concept Reinforcement
- **Inverse Square Law**: Demonstrate dose falloff with distance
- **Tissue Heterogeneity**: Show effects of different densities
- **Beam Overlap**: Illustrate dose summation principles
- **Critical Structures**: Highlight OAR sparing techniques

### 2. Knowledge Star Connections
The TPS system directly relates to several Knowledge Constellation stars:
- **tp-dose-calculation**: Core calculation algorithms
- **tp-optimization**: Plan quality improvement
- **tp-heterogeneity**: Tissue density effects
- **tp-target-volumes**: PTV/OAR delineation
- **rt-fractionation**: Dose prescription concepts

### 3. Clinical Application Ties
Activities in the TPS can unlock or enhance abilities:
- **Dose Calculation**: Improved calculation speed/accuracy
- **Optimization Algorithm**: Better automated planning
- **Target Volumes**: Enhanced contouring tools
- **Plan Evaluation**: Advanced analysis metrics

## Gameplay Scenarios

### 1. Tutorial Missions
- Basic beam placement
- Understanding dose distribution
- Achieving target coverage
- Avoiding critical structures

### 2. Clinical Challenges
- Prostate treatment planning
- Lung tumor with motion
- Brain lesion near critical structures
- Palliative spine treatment

### 3. Time-Pressure Scenarios
- Emergency planning situations
- Multiple patient queue management
- Balancing quality vs. efficiency

### 4. Optimization Puzzles
- Achieve specific dose constraints
- Minimize dose to specific OARs
- Maximize target conformity
- Meet multiple competing objectives

## Progression Framework

### 1. Difficulty Scaling
**Beginner:**
- Simple geometries
- Single target volumes
- Basic constraints
- Generous time limits

**Intermediate:**
- Complex anatomy
- Multiple targets
- Strict OAR limits
- Moderate time pressure

**Advanced:**
- Challenging cases
- Competing objectives
- Tight constraints
- Significant time pressure

### 2. Feature Unlocking
As players progress, they gain access to:
- Additional beam slots
- Advanced visualization tools
- Automated optimization hints
- Special beam modifiers

### 3. Scoring System
Plans are evaluated on:
- Target coverage (%)
- OAR sparing
- Conformity index
- Time efficiency
- Overall plan quality

## Technical Implementation Notes

### 1. Performance Considerations
- Use efficient ray-casting algorithms
- Implement level-of-detail for calculations
- Cache frequently used computations
- Optimize visualization rendering

### 2. User Interface Design
- Intuitive drag-and-drop beam placement
- Clear visual feedback for all actions
- Responsive controls for parameter adjustment
- Informative tooltips and help system

### 3. Data Structures
- Efficient grid representation for dose
- Optimized beam path calculations
- Fast lookup tables for attenuation
- Compressed storage for patient data

## Success Metrics

### 1. Educational Effectiveness
- Player understanding of dose distribution concepts
- Ability to create clinically reasonable plans
- Knowledge retention of planning principles
- Transfer of skills to real-world understanding

### 2. Gameplay Engagement
- Time spent in planning activities
- Completion rate of challenges
- Player satisfaction scores
- Replay value of scenarios

### 3. System Performance
- Calculation speed (< 100ms for updates)
- Visual refresh rate (60 FPS)
- Memory usage (< 100MB)
- Load times (< 2 seconds)

## Future Enhancement Possibilities

### 1. Advanced Features
- 3D visualization options
- IMRT/VMAT simulation
- Biological dose modeling
- Multi-criteria optimization

### 2. Extended Scenarios
- Adaptive planning challenges
- Special technique simulations
- Historical case studies
- Competitive planning modes

### 3. Integration Expansions
- Connection to QA mini-games
- Link to dosimetry calculations
- Treatment delivery simulation
- Plan verification activities

## Conclusion

The simplified TPS system aims to provide an engaging, educational experience that captures the essence of treatment planning while remaining accessible to learners. By balancing realism with playability, it serves as both a learning tool and an enjoyable game mechanic within Rogue Resident.
