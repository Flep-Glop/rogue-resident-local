# Rogue Resident: Vertical Slice Implementation Checklist

This document outlines the core components and systems required to implement a functional vertical slice of Rogue Resident according to the Unified GDD v5.0. The vertical slice should demonstrate the fundamental time-based gameplay loop, Knowledge Constellation system, and core progression mechanics.

## Implementation Priority Matrix

| System | Priority | Complexity | Dependency Level | Implementation % |
|--------|----------|------------|-----------------|------------------|
| Time-Based Core Loop | Critical (1) | High | Low | 95% |
| Knowledge Constellation | Critical (1) | High | Medium | 85% |
| Resource Systems | Critical (1) | Medium | Low | 100% |
| Basic UI Framework | Critical (1) | Medium | Low | 90% |
| Dialogue System | High (2) | Medium | Medium | 90% |
| Day/Night Transition | High (2) | Medium | High | 100% |
| Mentor Characters | High (2) | Medium | Medium | 80% |
| Journal System | Medium (3) | Low | High | 90% |
| Special Abilities | Medium (3) | Medium | High | 80% |
| Relationship System | Medium (3) | Medium | High | 70% |
| Progressive Control | Low (4) | High | High | 0% |
| Visual Polish | Low (4) | Medium | High | 30% |

## Core Systems Implementation Checklist

### 1. Time-Based Core Loop (Day Phase) - 95%

The foundation of the gameplay experience.

| Feature | Status | Completion % | Notes |
|---------|--------|--------------|-------|
| Time Manager Implementation | Completed | 100% | Core system for tracking and advancing time |
| Basic Activity Selection UI | Completed | 100% | Interface for selecting time block activities |
| Hospital Schedule System | Completed | 90% | Logic for generating daily activities |
| Activity Engagement Implementation | Completed | 100% | Framework for different activity types and challenges |
| Location System | Completed | 85% | System for different hospital areas |
| Time Block Choice Presentation | Completed | 100% | UI for presenting contextual choices |
| Day Phase State Management | Completed | 90% | State transitions within Day Phase |

### 2. Knowledge Constellation System (Night Phase) - 85%

The central progression and visualization system.

| Feature | Status | Completion % | Notes |
|---------|--------|--------------|-------|
| Basic Star/Concept Data Structure | Completed | 100% | Core data model for knowledge concepts |
| Star Visualization | Completed | 90% | Interactive visualization of the constellation |
| Concept Discovery Mechanism | Completed | 100% | System for discovering new concepts in Day Phase |
| Star Unlocking Mechanics | Completed | 100% | Ability to permanently unlock stars with SP |
| Connection Formation | Completed | 80% | Auto-connection between related concepts |
| Mastery Tracking | Completed | 70% | System for tracking concept mastery (0-100%) |
| Night Phase UI | Completed | 90% | Interface for the Night Phase interactions |

### 3. Dialogue System - 90%

Interactive conversations with mentor characters.

| Feature | Status | Completion % | Notes |
|---------|--------|--------------|-------|
| Basic Dialogue Data Structure | Completed | 100% | Core data model for dialogue and options |
| Dialogue Store | Completed | 100% | State management for dialogues |
| Dialogue UI | Completed | 100% | Interactive dialogue interface with typing effect |
| Dialogue Navigation | Completed | 100% | Moving between dialogue nodes based on choices |
| Resource Integration | Completed | 100% | Dialogue affects resources (Insight, Momentum) |
| Knowledge Integration | Completed | 100% | Dialogue discovers concepts and adds journal entries |
| Dialogue Activities | Completed | 90% | Integration with activity system |
| Branching Options | Completed | 90% | Conditional dialogue options |
| Special Ability Integration | In Progress | 40% | Using abilities in dialogue |

### 4. Mentor Characters - 80%

Character interactions that guide learning.

| Feature | Status | Completion % | Notes |
|---------|--------|--------------|-------|
| Mentor Data Structure | Completed | 100% | Core data model for mentors |
| Basic Mentor UI | Completed | 95% | Interface for showing mentor info |
| Relationship System | Completed | 90% | Tracking relationship levels |
| Mentor Gallery | Completed | 90% | Interface for viewing all mentors |
| Relationship Effects | Completed | 75% | Effects of relationship on gameplay |
| Mentor Specialization | Completed | 90% | Domain-specific expertise |
| Mentor Journal Entries | Completed | 80% | Recording mentor interactions |
| Mentor-specific Dialogues | Completed | 95% | Character-specific dialogue options |

### 5. Resource Systems - 100%

The core resources that drive gameplay decisions.

| Feature | Status | Completion % | Notes |
|---------|--------|--------------|-------|
| Momentum System | Completed | 100% | Activity-level tactical resource (0-3) |
| Insight System | Completed | 100% | Daily tactical resource (0-100) |
| Star Points (SP) System | Completed | 100% | Long-term progression resource |
| Resource Visualization | Completed | 100% | UI for displaying resource levels |
| Resource Gain/Loss Events | Completed | 100% | Event system for resource changes |
| End-of-Day Conversion | Completed | 100% | Converting Insight to SP at day end |

### 6. Core Technical Architecture - 95%

The foundational technical systems required.

| Feature | Status | Completion % | Notes |
|---------|--------|--------------|-------|
| Event-Driven Architecture | Completed | 100% | Central event bus implementation |
| Store Pattern Implementation | Completed | 100% | Zustand stores for game state |
| Chamber Pattern Optimization | Not Started | 0% | Performance optimizations for UI |
| State Machine Implementation | Completed | 100% | For game phase transitions |
| Basic Navigation | Completed | 100% | Navigation between Day/Night phases |
| Debug Tooling | Completed | 100% | Debug panel for testing game features |
| Error Handling | Completed | 90% | Handling of async operations and state errors |

### 7. Special Abilities - 80%

Special gameplay mechanics that enhance strategy.

| Feature | Status | Completion % | Notes |
|---------|--------|--------------|-------|
| Tangent Ability | Completed | 100% | Change current question for a cost |
| Boast Ability | Completed | 100% | Attempt harder questions for greater rewards |
| Consultation Ability | In Progress | 50% | Get alternative perspective on questions |
| Early Completion | Not Started | 0% | Complete activities more quickly |

### 8. Journal System - 90%

Documentation and reflection system.

| Feature | Status | Completion % | Notes |
|---------|--------|--------------|-------|
| Journal UI | Completed | 95% | Interface for viewing and editing entries |
| Concept Entries | Completed | 90% | Journal entries for discovered concepts |
| Mentor Entries | Completed | 90% | Journal entries from mentor interactions |
| Entry Organization | Completed | 90% | Categorization and filtering of entries |
| Custom Notes | Completed | 80% | Ability to add personal notes to entries |

## Minimal Vertical Slice Scope

For a minimal playable vertical slice, implement at least:

1. **One Day-Night Cycle**
   - ✅ Morning (8 AM) to Evening (5 PM) time-based activities
   - ✅ 2-3 activity options per time block
   - ✅ At least one activity from each domain
   - ✅ Night Phase with constellation interaction

2. **Core Mechanics**
   - ✅ Time-based navigation (hourly choices)
   - ✅ Basic resource systems (Momentum, Insight, SP)
   - ✅ Concept discovery and unlocking
   - ✅ Star activation/deactivation

3. **Basic Mentor Interactions**
   - ✅ Two mentors with basic dialogue
   - ✅ Simple relationship tracking

4. **Minimal Progression**
   - ✅ 5-8 concepts that can be discovered
   - ✅ At least 3 connections between concepts
   - ✅ One special ability (Tangent or Boast)

## Feature Dependency Graph

```
Time Manager → Activity Selection → Activity Engagement
    ↓
Resource Systems → Special Abilities
    ↓
Concept Discovery → Knowledge Constellation → Star Connections
    ↓                     ↑
Day/Night Transition    Star Activation/Deactivation
    ↓
Basic Mentor Interactions → Relationship System
    ↓
Progressive Control Features
```

## Development Milestones

| Milestone | Key Deliverables | Target Completion % | Current Status |
|-----------|------------------|---------------------|----------------|
| **Foundation** | Time Manager, Store Pattern, Event System | 15% | ✅ Completed (100%) |
| **Core Loop** | Activity Selection, Resource Systems, Day Advancement | 40% | ✅ Completed (100%) |
| **Knowledge Systems** | Constellation View, Concept Discovery, Star Unlocking | 65% | ✅ Completed (90%) |
| **Integration** | Day/Night Transition, Basic Abilities, Mentor Interactions | 85% | ✅ Completed (85%) |
| **Polishing** | UI Refinement, Balance Adjustments, Bug Fixes | 100% | 🔄 In Progress (50%) |

## Testing Focus Areas

| Area | Testing Priority | Key Metrics | Testing Tools |
|------|-----------------|-------------|--------------|
| Core Loop Flow | High | Time advancement accuracy, Activity completion | Debug Panel |
| State Transitions | High | Day/Night phase transitions, State persistence | Debug Panel |
| Performance | Medium | Frame rate during constellation view, Memory usage | React DevTools |
| Resource Balance | Medium | Resource gain rates, SP economy balance | Debug Panel |
| UI/UX | Medium | Time selection clarity, Feedback visibility | - |
| Error Handling | High | Proper handling of async operations | Console Monitoring |

## Vertical Slice Acceptance Criteria

- [x] Player can navigate through a complete Day-Night cycle
- [x] All core resources (Momentum, Insight, SP) function properly
- [x] Knowledge Constellation allows discovery, unlocking, and activation of concepts
- [x] At least one special ability is fully functional
- [x] Day Phase activities provide clear time-based choices
- [x] Night Phase allows meaningful constellation interaction
- [x] Resource and knowledge gains persist between cycles
- [x] Core UI elements provide clear feedback and visualization
- [x] Journal system records game progress and discoveries
- [x] No critical errors in the console during normal operation

## Next Steps After Vertical Slice

1. Expand content (more concepts, activities, dialogue)
2. Implement seasonal progression
3. Add Progressive Control features
4. Enhance feedback systems
5. Implement narrative elements (Ionix thread)
6. Add more special abilities and gameplay mechanics
7. Improve visual polish and animations
