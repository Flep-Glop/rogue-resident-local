# Rogue Resident: Vertical Slice Development Guide (Updated)

## Overview & Progress Tracking

This document serves as the definitive reference for completing the vertical slice of Rogue Resident, tracking progress, priorities, and implementation details to ensure all systems work together coherently.

### Current Implementation Status

| Component | Status | Completion % | Priority | Notes |
|-----------|--------|--------------|----------|-------|
| **Core Systems** | | | | |
| Game State Machine | Implemented | 90% | High | Day/night transitions functioning |
| Event Bus | Implemented | 100% | High | Robust implementation complete |
| Knowledge System | Implemented | 80% | High | Concept/constellation structure ready |
| Resource Systems | Partial | 60% | High | UI implemented, needs tiered outcome integration |
| Dialogue System | Implemented | 90% | High | Core dialogue mechanics work |
| | | | | |
| **Gameplay Loop** | | | | |
| Map Navigation | Implemented | 95% | High | Enhanced row-based progression with visual feedback |
| Day Phase | Partial | 60% | High | First two nodes implemented |
| Night Phase | Partial | 40% | High | Visual implemented, two-phase flow needed |
| Third Node | Implemented | 80% | Critical | Equipment identification interface working |
| | | | | |
| **UI/UX** | | | | |
| Main UI Framework | Implemented | 90% | High | Core UI systems functioning |
| Journal System | Implemented | 80% | Medium | Basic functionality works |
| Constellation UI | Implemented | 70% | High | Visualization works, needs activation mechanics |
| Whisper-to-Shout | Partial | 50% | Medium | Pattern partially implemented |
| Feedback System | Not Started | 0% | High | Centralized resource feedback system needed |
| | | | | |
| **Content** | | | | |
| Dr. Kapoor Dialogue | Partial | 60% | High | Initial dialogues implemented |
| Knowledge Concepts | Implemented | 100% | High | All concepts defined |
| Extensions | Partial | 40% | High | Calculation implemented, Equipment refactoring needed |

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
| Implement Resource Tier System | None | Medium | Not Started | | Standardize resource outcomes for dialogue and extensions |
| Connect Resource System to Dialogue | Resource Tier System | Medium | Not Started | | Link momentum/insight to dialogue choices |
| Implement Two-Phase Knowledge Flow | None | Medium | Not Started | | Separate discovery (day) from activation (night) |
| Create Centralized Feedback System | None | Medium | Not Started | | Unified resource and knowledge feedback |
| Refactor Equipment Extension | None | Medium | Not Started | | Apply side-by-side architecture pattern |
| Implement SP Costs for Activation | Two-Phase Knowledge Flow | Easy | Not Started | | Create costs for star/connection activation |
| Implement Basic Connections UI | None | Medium | Not Started | | Allow creating connections between concepts |

### Secondary Items

Important but can be deferred if necessary:

| Task | Dependency | Difficulty | Status | Who | Notes |
|------|------------|------------|--------|-----|-------|
| Complete Tangent Ability Implementation | Resource System Integration | Medium | Not Started | | |
| Complete Boast Ability Implementation | Momentum System Integration | Medium | Not Started | | |
| Implement Delayed Resource Gains | Resource Tier System | Medium | Not Started | | Support for conditional future rewards |
| Improve Navigation Between Nodes | None | Easy | Completed | Luke | Implemented row-based progression with visual feedback |
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
| Pattern Recognition for Eureka Moments | Connection System | Hard | Not Started | | Advanced feature for later development |

## Detailed Implementation Guides

### 1. Resource System Standardization

#### Implementation Approach

Implement the tiered resource outcome system:

```typescript
// Standard tiers with default values
const ResourceTiers = {
  MINOR: { insight: 5, momentumEffect: 'maintain' },
  STANDARD: { insight: 10, momentumEffect: 'increment' },
  MAJOR: { insight: 15, momentumEffect: 'increment' },
  CRITICAL: { insight: 25, momentumEffect: 'increment' },
  FAILURE: { insight: 0, momentumEffect: 'reset' }
}

// ResourceOutcomeService to handle standardized resource changes
class ResourceOutcomeService {
  applyResourceOutcome(outcome, storeRef) {
    if (outcome.insight) {
      storeRef.adjustInsight(outcome.insight);
    }
    
    if (outcome.momentumEffect === 'increment') {
      storeRef.incrementMomentum();
    } else if (outcome.momentumEffect === 'reset') {
      storeRef.resetMomentum();
    }
    
    if (outcome.knowledgeGain) {
      outcome.knowledgeGain.forEach(gain => {
        knowledgeSystem.updateMastery(gain.conceptId, gain.amount);
      });
    }
    
    // Trigger unified feedback
    feedbackSystem.showResourceChanges(outcome);
  }
}
```

#### Connection Points

| System Point | Integration Method | Status |
|--------------|-------------------|--------|
| Option Selection | Apply resource tier in option handler | Not Started |
| Extension Completion | Apply resources through service | Not Started |
| Strategic Actions | Calculate cost/benefit through service | Not Started |
| Resource Feedback | Connect to centralized feedback system | Not Started |

#### Momentum & Insight Mechanics (Unchanged)

- **Momentum**:
  - Increment on: Correct answers, successful challenges
  - Reset on: Incorrect answers on critical questions
  - Benefits: Unlock Boast ability, multiplier for insight
  - UI Feedback: Visual pulse effect, counter animation

- **Insight**:
  - Gain from: Completing challenges, correct answers, discovering concepts
  - Spend on: Tangent (25◆), Reframe (50◆), Peer-Review (75◆)
  - Persistence: Maintains between conversations
  - UI Feedback: Meter fill animation, ability availability

### 2. Two-Phase Knowledge Flow

#### Implementation Approach

1. **Day Phase (Discovery)**
```typescript
function handleConceptDiscovery(conceptId: string) {
  knowledgeStore.markConceptAsDiscovered(conceptId);
  journalStore.addEntry({
    type: 'concept-discovered',
    conceptId,
    timestamp: gameTime.current(),
    details: `Learned about ${conceptStore.getName(conceptId)} from Dr. Kapoor.`
  });
  
  // Notify player but don't yet activate in constellation
  feedbackSystem.showConceptDiscovered(conceptId);
}
```

2. **Night Phase (Activation)**
```typescript
function handleConceptActivation(conceptId: string, spCost: number) {
  if (playerStore.getStarPoints() >= spCost && knowledgeStore.isConceptDiscovered(conceptId)) {
    playerStore.spendStarPoints(spCost);
    knowledgeStore.activateConcept(conceptId);
    
    // Visual feedback for activation
    constellationRenderer.activateStar(conceptId);
    feedbackSystem.showStarActivation(conceptId);
  }
}
```

#### Implementation Tasks

| Task | Details | Difficulty | Status |
|------|---------|------------|--------|
| Update Knowledge Model | Add discovered vs. activated states | Easy | Not Started |
| Create Discovery Events | Events for concept discovery | Easy | Not Started |
| Implement SP System | Star Point accumulation and spending | Medium | Not Started |
| Create Activation UI | Interface for spending SP on stars | Medium | Not Started |
| Implement Connection UI | Allow creating connections between stars | Hard | Not Started |

### 3. Extension Architecture Refactoring

#### Implementation Approach

1. **Create Shared Context**
```typescript
// Create a shared context for styling and feedback
const GameplayContext = createContext<GameplayContextType>({
  theme: 'day',
  feedbackSystem: null,
  resourceSystem: null,
});

// Provider component
function GameplayProvider({ children }) {
  const theme = useGameState(state => state.currentPhase);
  const feedbackSystem = useFeedbackSystem();
  const resourceSystem = useResourceSystem();
  
  return (
    <GameplayContext.Provider value={{ 
      theme, 
      feedbackSystem,
      resourceSystem 
    }}>
      {children}
    </GameplayContext.Provider>
  );
}
```

2. **Refactor Equipment Identification Extension**

Current Implementation:
```typescript
// Current nested approach
function ConversationWithExtension({ conversationId }) {
  return (
    <ConversationPanel conversationId={conversationId}>
      {(extensionProps) => (
        extensionProps.extensionType === 'equipment' && (
          <EquipmentIdentificationExtension {...extensionProps} />
        )
      )}
    </ConversationPanel>
  );
}
```

Refactored Implementation:
```typescript
// Refactored side-by-side approach
function ConversationWithExtension({ 
  conversationId, 
  extensionType, 
  extensionContentId 
}) {
  const { theme, feedbackSystem } = useContext(GameplayContext);
  const [extensionResult, setExtensionResult] = useState(null);
  const dialogueRef = useRef(null);
  
  // Shared controller
  const handleExtensionComplete = useStableCallback((result) => {
    setExtensionResult(result);
    feedbackSystem.showResourceChanges(result);
    
    if (dialogueRef.current) {
      dialogueRef.current.handleExtensionResult(result);
    }
  });
  
  return (
    <div className={`game-panel game-panel--${theme}`}>
      <ConversationPanel 
        ref={dialogueRef}
        conversationId={conversationId} 
        extensionResult={extensionResult}
      />
      
      {extensionType === 'equipment' && (
        <EquipmentIdentificationPanel
          contentId={extensionContentId}
          onComplete={handleExtensionComplete}
        />
      )}
    </div>
  );
}
```

#### Component Data Model (Unchanged)

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

### 4. Centralized Feedback System

```typescript
// Feedback system accessible through context
class FeedbackSystem {
  constructor(containerRef) {
    this.containerRef = containerRef;
  }
  
  showResourceChanges({ insightGained, momentumEffect, knowledgeGained }) {
    if (!this.containerRef.current) return;
    const container = this.containerRef.current;
    
    // Create and animate feedback elements
    if (insightGained > 0) {
      const insightElement = document.createElement('div');
      insightElement.className = 'resource-feedback insight-gain';
      insightElement.textContent = `+${insightGained}◆`;
      container.appendChild(insightElement);
      
      // Use direct DOM for critical animations
      gsap.fromTo(insightElement, 
        { opacity: 0, y: 20 }, 
        { opacity: 1, y: 0, duration: 0.5, onComplete: () => {
          setTimeout(() => {
            gsap.to(insightElement, { 
              opacity: 0, 
              y: -20, 
              duration: 0.5,
              onComplete: () => insightElement.remove()
            });
          }, 1500);
        }}
      );
    }
    
    // Similar implementations for momentum and knowledge feedback
  }
  
  showConceptDiscovered(conceptId) {
    // Visual feedback for concept discovery
  }
  
  showStarActivation(conceptId) {
    // Visual feedback for star activation
  }
  
  showConnectionFormed(sourceId, targetId) {
    // Visual feedback for connection creation
  }
}
```

### 5. Testing Plan

#### Core Mechanics Testing

| Test Case | Expected Result | Status |
|-----------|-----------------|--------|
| Complete dialogue with various options | Appropriate resource outcomes based on tiers | Not Tested |
| Complete equipment ID extension | Resources applied through feedback system | Not Tested |
| Discover concepts during day | Concepts marked as discovered, shown in journal | Not Tested |
| End day via UI button | Transition to night phase with discovered concepts | Not Tested |
| Activate stars with SP | Stars activate with visual feedback | Not Tested |
| Create constellation connection | Connection forms, costs SP | Not Tested |
| Begin new day | Return to map with activations preserved | Not Tested |

#### Resource System Testing

| Test Case | Expected Result | Status |
|-----------|-----------------|--------|
| Answer correctly multiple times | Momentum increases using tier system | Not Tested |
| Answer incorrectly | Momentum resets with appropriate feedback | Not Tested |
| Gain sufficient insight | Abilities become available with feedback | Not Tested |
| Use Tangent ability | Insight spent, context changes | Not Tested |
| Use Boast ability | Question difficulty increases with feedback | Not Tested |

## Asset Requirements

### UI Assets Needed

- End Day button
- Equipment identification reference image
- Connection drawing cursor for constellation
- Resource gain feedback animations
- Star point icon and counter
- Star activation effects
- Connection formation effects

### Content Needed

- Equipment identification dialogue
- Component descriptions from glossary
- Connection descriptions for related concepts
- Feedback text for successful/failed identification
- SP cost tooltips for activation

## Architecture Reference

### Event Flow Diagram

```
[Player Action] → [Component Handler] → [Resource Service] → [Feedback System] → [Store Update]
```

### System Integration Points

- `DialogueStateMachine` → `ResourceOutcomeService`: Apply standardized resource outcomes
- `ExtensionResult` → `ResourceOutcomeService`: Process extension results through service
- `GameStateMachine` → `KnowledgeStore`: Transfer discovered concepts during phase transitions
- `ConstellationView` → `KnowledgeStore`: Handle star activation and connection with SP costs

## Conclusion

This updated vertical slice development guide incorporates the standardized resource system, two-phase knowledge flow, and improved extension architecture. By implementing these refined systems, we'll create a more cohesive and maintainable game experience while still delivering on the core educational mechanics of Rogue Resident.

Remember that "game feel over features" and "speed over perfection" remain our guiding principles, but we're now applying these with a more systematic approach to our core systems. The vertical slice will demonstrate a complete day/night cycle with discovery, activation, and connection forming the educational backbone of the experience.
