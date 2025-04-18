# Rogue Resident: Vertical Slice Development Guide

## Overview & Progress Tracking

This document serves as the definitive reference for completing the vertical slice of Rogue Resident, tracking progress, priorities, and implementation details to ensure all systems work together coherently.

### Current Implementation Status

| Component | Status | Completion % | Priority | Notes |
|-----------|--------|--------------|----------|-------|
| **Core Systems** | | | | |
| Game State Machine | Implemented | 90% | High | Day/night transitions functioning |
| Event Bus | Implemented | 100% | High | Robust implementation complete |
| Knowledge System | Implemented | 80% | High | Concept/constellation structure ready |
| Resource Systems | Partial | 60% | High | UI implemented, needs mechanical integration |
| Dialogue System | Implemented | 90% | High | Core dialogue mechanics work |
| | | | | |
| **Gameplay Loop** | | | | |
| Map Navigation | Implemented | 95% | High | Enhanced row-based progression with visual feedback |
| Day Phase | Partial | 60% | High | First two nodes implemented |
| Night Phase | Partial | 40% | High | Visual implemented, integration needed |
| Third Node | Implemented | 80% | Critical | Equipment identification interface working |
| | | | | |
| **UI/UX** | | | | |
| Main UI Framework | Implemented | 90% | High | Core UI systems functioning |
| Journal System | Implemented | 80% | Medium | Basic functionality works |
| Constellation UI | Implemented | 70% | High | Visualization works, needs integration |
| Whisper-to-Shout | Partial | 50% | Medium | Pattern partially implemented |
| | | | | |
| **Content** | | | | |
| Dr. Kapoor Dialogue | Partial | 60% | High | Initial dialogues implemented |
| Knowledge Concepts | Implemented | 100% | High | All concepts defined |
| Extensions | Partial | 40% | High | Calculation implemented, Equipment needed |

### Vertical Slice Success Criteria

According to the GDD, the vertical slice succeeds if:

1. Players can complete a full day/night cycle
2. Players understand the core knowledge acquisition mechanics
3. Players can form at least one connection in the constellation 
4. Players can use the Tangent and Boast abilities effectively
5. Players can complete the Ionix boss encounter

However, based on current scope, we're focusing on the first three criteria for the initial version, deferring the Ionix boss.

## Implementation Priorities

### Critical Path Items

These must be completed for a functional vertical slice:

| Task | Dependency | Difficulty | Status | Who | Notes |
|------|------------|------------|--------|-----|-------|
| Implement Equipment Identification Extension | None | Medium | Completed | | Third node content implemented with linac component identification |
| Connect Resource System to Dialogue Outcomes | None | Medium | Not Started | | Link momentum/insight to dialogue choices |
| Ensure Knowledge System Records Concepts | None | Medium | Completed | Luke | Knowledge event handler connects dialogue, extensions, and explicit events to the constellation |
| Create "End Day" UI Button | None | Easy | Completed | Luke | Implemented night mode transition button with visual feedback |
| Connect Day Activities to Night Constellation | None | Medium | Not Started | | Make day knowledge appear in night phase |
| Implement Basic Connections in Constellation | None | Medium | Not Started | | Allow creating connections between concepts |

### Secondary Items

Important but can be deferred if necessary:

| Task | Dependency | Difficulty | Status | Who | Notes |
|------|------------|------------|--------|-----|-------|
| Complete Tangent Ability Implementation | Resource System Integration | Medium | Not Started | | |
| Complete Boast Ability Implementation | Momentum System Integration | Medium | Not Started | | |
| Enhance Resource Gain Feedback | None | Easy | Completed | Luke | Implemented neon particle effects for insight gain with animation improvements |
| Improve Navigation Between Nodes | None | Easy | Completed | Luke | Implemented row-based progression with visual feedback for available nodes |
| Add Journal Knowledge Updates | Knowledge System | Medium | Not Started | | Record knowledge in journal |
| Extend Map with Additional Nodes | None | Medium | Not Started | | More nodes for longer play experience |

### Deferred Items

Not required for initial vertical slice:

| Task | Dependency | Difficulty | Status | Who | Notes |
|------|------------|------------|--------|-----|-------|
| Ionix Boss Implementation | Multiple | Hard | Not Started | | Deferring to future iteration |
| Reframe & Peer-Review Abilities | Multiple | Medium | Not Started | | Focus on Tangent & Boast first |
| Shooting Star System | None | Medium | Not Started | | Bonus feature for night phase |
| Multiple Mentor Implementation | None | Hard | Not Started | | Focus on Dr. Kapoor for now |
| Procedural Hospital Generation | None | Hard | Not Started | | Use fixed layout for vertical slice |

## Detailed Implementation Guides

### 1. Equipment Identification Extension

#### Implementation Status

- **Completion**: 80%
- **Features Implemented**:
  - Interactive component identification interface
  - Linear accelerator component visualization
  - Component selection and validation
  - Integration with the dialogue system
  - Node navigation and access from map

#### Remaining Work

- Connect component identification to knowledge system
- Enhance visual feedback for correct/incorrect selections
- Add more detailed component descriptions
- Link to resource system for rewards

#### Component Data Model

```typescript
{
  id: "linac_components_basic",
  title: "Linear Accelerator Components",
  description: "Identify the key components of a medical linear accelerator",
  imageUrl: "/items/linac.png",
  imageWidth: 512,
  imageHeight: 512,
  conceptId: "linac-anatomy",
  difficulty: "medium",
  domain: "radiation-therapy-equipment",
  components: [
    {
      id: "treatment_head",
      name: "Treatment Head",
      description: "The rotating arm that houses the radiation source and can rotate 360 degrees around the patient.",
      position: { x: 20, y: 20, width: 300, height: 160 },
      isCritical: true,
      order: 1
    },
    // Additional components...
  ]
}
```

### 2. Resource System Integration

#### Connection Points

| System Point | Integration Method | Status |
|--------------|-------------------|--------|
| Option Selection | Update insight/momentum in option handler | Not Started |
| Extension Completion | Apply resources in completion handler | Not Started |
| Strategic Actions | Implement cost/benefit in action handlers | Not Started |
| Constellation Feedback | Connect resource changes to visual feedback | Not Started |

#### Momentum Mechanics

- **Increment on**: Correct answers, successful challenges, critical path progress
- **Reset on**: Incorrect answers on critical questions
- **Benefits**: Unlock Boast ability, multiplier for insight
- **UI Feedback**: Visual pulse effect, counter animation, text indicator

#### Insight Mechanics

- **Gain from**: Completing challenges, correct answers, discovering concepts
- **Spend on**: Tangent (25◆), Reframe (50◆), Peer-Review (75◆)
- **Persistence**: Maintains between conversations
- **UI Feedback**: Meter fill animation, threshold indicators, ability availability

### 3. Knowledge System Integration

#### Day/Night Knowledge Flow

1. **During Day**:
   - Track concepts encountered in dialogue/challenges
   - Record mastery increases from correct answers
   - Store pending insights for night phase

2. **During Night**:
   - Transfer day knowledge to constellation
   - Reveal new stars for discovered concepts
   - Allow connection formation between related concepts

#### Implementation Tasks

| Task | Details | Difficulty |
|------|---------|------------|
| Create Knowledge Update Service | Bridge between day activities and knowledge store | Medium |
| Implement Concept Discovery Events | Dispatch events when concepts are discovered | Easy |
| Connect Challenge Outcomes | Link extension results to concept mastery | Medium |
| Enhance Star Visualization | Make newly discovered stars more prominent | Easy |
| Implement Connection UI | Allow drawing connections between stars | Medium |

### 4. Testing Plan

#### Core Mechanics Testing

| Test Case | Expected Result | Status |
|-----------|-----------------|--------|
| Complete start node | Receive journal, progress to next node | Not Tested |
| Complete calculation node | Gain resources, discover concepts | Not Tested |
| Complete equipment ID node | Gain resources, discover new concepts | Not Tested |
| End day via UI button | Transition to night phase | Not Tested |
| View constellation | See discovered concepts as stars | Not Tested |
| Create constellation connection | Connection forms, mastery increases | Not Tested |
| Begin new day | Return to map with progress saved | Not Tested |

#### Resource System Testing

| Test Case | Expected Result | Status |
|-----------|-----------------|--------|
| Answer correctly multiple times | Momentum increases to max | Not Tested |
| Answer incorrectly | Momentum resets | Not Tested |
| Gain sufficient insight | Abilities become available | Not Tested |
| Use Tangent ability | Context changes, insight spent | Not Tested |
| Use Boast ability | Question difficulty increases | Not Tested |

## Asset Requirements

### UI Assets Needed

- End Day button
- Equipment identification reference image
- Connection drawing cursor for constellation
- Resource gain feedback animations
- Ability activation effects

### Content Needed

- Equipment identification dialogue
- Component descriptions from glossary
- Connection descriptions for related concepts
- Feedback text for successful/failed identification

## Architecture Reference

### Event Flow Diagram

```
[Player Action] → [Component Handler] → [Event Dispatch] → [State Update] → [UI Update]
```

### System Integration Points

- `DialogueStateMachine` → `ResourceStore`: Update resources based on dialogue choices
- `ExtensionResult` → `KnowledgeStore`: Update concept mastery based on extension outcomes
- `GameStateMachine` → `KnowledgeStore`: Transfer pending insights during phase transitions
- `ConstellationView` → `KnowledgeStore`: Create connections between concepts

## Conclusion

This vertical slice focuses on delivering a complete, albeit limited, gameplay loop that demonstrates the core educational mechanics of Rogue Resident. By implementing the critical path items and ensuring proper integration between systems, we'll create a compelling prototype that validates our game design.

Remember that "game feel over features" and "speed over perfection" are our guiding principles for this phase. It's better to have a smaller, polished experience than a larger, incomplete one.