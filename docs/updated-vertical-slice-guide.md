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
| Resource Systems | Implemented | 95% | High | Resource tiers implemented, Momentum UI functioning, Insight spending via abilities working |
| Dialogue System | Implemented | 95% | High | Core dialogue mechanics with resource tier integration complete |
| | | | | |
| **Gameplay Loop** | | | | |
| Map Navigation | Implemented | 95% | High | Enhanced row-based progression with visual feedback |
| Day Phase | Implemented | 80% | High | First two nodes implemented with abilities functioning |
| Night Phase | Partial | 40% | High | Visual implemented, two-phase flow needed |
| Equipment Extension | Implemented | 80% | Critical | Equipment identification interface working |
| | | | | |
| **UI/UX** | | | | |
| Main UI Framework | Implemented | 90% | High | Core UI systems functioning |
| Journal System | Implemented | 80% | Medium | Basic functionality works |
| Constellation UI | Implemented | 70% | High | Visualization works, needs activation mechanics |
| Whisper-to-Shout | Partial | 50% | Medium | Pattern partially implemented |
| Feedback System | Partial | 65% | High | Resource feedback works; Momentum visual feedback added; Added improved dialogue response feedback |
| | | | | |
| **Content** | | | | |
| Dr. Kapoor Dialogue | Implemented | 90% | High | Initial dialogues implemented with tangent content |
| Knowledge Concepts | Implemented | 100% | High | All concepts defined |
| Extensions | Partial | 50% | High | Equipment and calculation interfaces implemented but need refactoring |

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

| Task                                    | Dependency                   | Difficulty | Status      | Who  | Notes                                                                     |
|-----------------------------------------|------------------------------|------------|-------------|------|---------------------------------------------------------------------------|
| Implement Resource Tier System          | None                         | Medium     | Completed   | Luke | Standardized resource outcomes for dialogue and extensions                 |
| Connect Resource System to Dialogue     | Resource Tier System         | Medium     | Completed   | Luke | Successfully linked momentum/insight to dialogue choices                  |
| Implement Two-Phase Knowledge Flow      | None                         | Medium     | In Progress | Luke | Separate discovery (day) from activation (night)                          |
| Implement SP Costs for Star Unlock      | Two-Phase Knowledge Flow     | Easy       | Not Started |      | Create one-time SP cost for unlocking discovered stars during night       |
| Complete Tangent Ability Implementation | Resource System Integration  | Medium     | Completed   | Luke | **CRITICAL:** Implemented, working during dialogue with proper resource costs |
| Create Centralized Feedback System      | Multiple                     | Medium     | Partial     | Luke | Improved dialogue response feedback, resource feedback working            |
| Implement Automatic Connection System   | Knowledge System             | Medium     | Not Started |      | Automatically create connections between unlocked stars                    |

### Secondary Items

Important but can be deferred if necessary:

| Task                                    | Dependency                   | Difficulty | Status      | Who  | Notes                                                                     |
|-----------------------------------------|------------------------------|------------|-------------|------|---------------------------------------------------------------------------|
| Refactor Equipment Extension            | None                         | Medium     | Not Started |      | Apply side-by-side architecture pattern (defer until core loop proven)    |
| Complete Boast Ability Implementation   | Momentum System Integration  | Medium     | Not Started |      | Requires Momentum integration                                             |
| Implement Delayed Resource Gains        | Resource Tier System         | Medium     | Not Started |      | Support for conditional future rewards                                    |
| Improve Navigation Between Nodes        | None                         | Easy       | Completed   | Luke | Implemented row-based progression with visual feedback                    |
| Add Journal Knowledge Updates           | Knowledge System             | Medium     | Not Started |      | Record knowledge in journal                                               |
| Extend Map with Additional Nodes        | None                         | Medium     | Not Started |      | More nodes for longer play experience                                     |
| Implement Connection Mastery System     | Automatic Connection System  | Medium     | Not Started |      | Track and visualize mastery levels for connections                        |

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
  applyResourceOutcome(outcomeOrTier, storeRef) {
    // Determine the outcome details (either from tier name or direct object)
    let outcome = typeof outcomeOrTier === 'string' 
      ? ResourceTiers[outcomeOrTier]
      : outcomeOrTier;
    
    // Apply insight
    if (outcome.insight !== 0) {
      storeRef.adjustInsight(outcome.insight);
    }
    
    // Apply momentum effect
    if (outcome.momentumEffect === 'increment') {
      storeRef.incrementMomentum();
    } else if (outcome.momentumEffect === 'reset') {
      storeRef.resetMomentum();
    }
    
    // Optional knowledge gain
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
| Option Selection | Apply resource tier in option handler | Completed |
| Extension Completion | Apply resources through service | Completed |
| Strategic Actions | Calculate cost/benefit through service | Completed |
| Resource Feedback | Connect to centralized feedback system | Completed |

#### Momentum & Insight Mechanics (**Implemented**)

- **Momentum**:
  - Increment on: Correct answers, successful challenges
  - Reset on: Incorrect answers on critical questions
  - Benefits: Unlock Boast ability, multiplier for insight
  - UI Feedback: Visual pulse effect, counter animation

- **Insight**:
  - Gain from: Completing challenges, correct answers, discovering concepts (primarily during Day phase)
  - Spend on: **Day Phase abilities only** - Tangent (25◆), Reframe (50◆), Peer-Review (75◆)
  - Persistence: Maintains between conversations and phases
  - UI Feedback: Meter fill animation, ability availability
  - **Note:** Insight cannot be spent during the Night phase (Constellation interactions use SP).

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
  
  // Notify player but don't yet unlock in constellation
  feedbackSystem.showConceptDiscovered(conceptId);
}
```

2. **Night Phase (Unlock & Activation)**
```typescript
// Handles the one-time SP cost to unlock a discovered star
function handleStarUnlock(conceptId: string, spCost: number) {
  if (playerStore.getStarPoints() >= spCost && 
      knowledgeStore.isConceptDiscovered(conceptId) && 
      !knowledgeStore.isConceptUnlocked(conceptId)) {
    
    playerStore.spendStarPoints(spCost);
    knowledgeStore.unlockConcept(conceptId); // Mark as permanently unlocked
    knowledgeStore.activateConcept(conceptId); // Set initial state to active
    
    // Visual feedback for the unlock
    constellationRenderer.unlockStar(conceptId);
    feedbackSystem.showStarUnlock(conceptId);
    
    // Check for and visualize new connections after unlock
    checkForNewConnections(conceptId);
  }
}

// Handles freely toggling activation state of *unlocked* stars
function handleConceptActivationToggle(conceptId: string) {
  if (knowledgeStore.isConceptUnlocked(conceptId)) {
    const currentActivation = knowledgeStore.isConceptActive(conceptId);
    knowledgeStore.setConceptActivation(conceptId, !currentActivation);
    
    // Visual feedback for toggle
    constellationRenderer.setStarActiveState(conceptId, !currentActivation);
    // Update connection emphasis based on activation changes
    updateConnectionEmphasis();
  }
}
```

#### Implementation Tasks (**Updated**)

| Task | Details | Difficulty | Status |
|------|---------|------------|--------|
| Update Knowledge Model | Add discovered vs. unlocked vs. activated states | Easy | In Progress |
| Create Discovery Events | Events for concept discovery | Easy | In Progress |
| Implement SP System | Star Point accumulation and spending for unlocks | Medium | Not Started |
| Create Star Unlock UI | Interface for spending SP on *discovered* stars during Night | Medium | Not Started |

### 3. Automatic Connection System

#### Implementation Approach

1. **Connection Data Model**
```typescript
// In knowledgeStore or a dedicated connectionStore

interface Connection {
  id: string;           // Unique ID (e.g., "banana-apple")
  sourceId: string;     // First concept ID
  targetId: string;     // Second concept ID
  mastery: number;      // Connection mastery (0-100%)
  discovered: boolean;  // Whether the player has encountered this connection
}

// Initialize with predefined connections
const predefinedConnections = [
  {
    id: "absorbed-dose-ionization-chamber",
    sourceId: "absorbed-dose",
    targetId: "ionization-chamber",
    description: "Ionization chambers are used to measure absorbed dose",
    mastery: 0
  },
  // Add ~30-40 connections for vertical slice
];

// Initialize connections with predefined data
function initializeConnections() {
  predefinedConnections.forEach(connData => {
    connections.set(connData.id, {
      ...connData,
      mastery: 0,
      discovered: false
    });
  });
}
```

2. **Connection Visibility Logic**
```typescript
// Check if a connection should be visible
function isConnectionVisible(connection: Connection): boolean {
  // Connection is visible if both concepts are unlocked
  const sourceUnlocked = isConceptUnlocked(connection.sourceId);
  const targetUnlocked = isConceptUnlocked(connection.targetId);
  
  return sourceUnlocked && targetUnlocked;
}

// Check if a connection should be emphasized
function isConnectionEmphasized(connection: Connection): boolean {
  // Connection is emphasized if both connected concepts are activated
  const sourceActive = isConceptActive(connection.sourceId);
  const targetActive = isConceptActive(connection.targetId);
  
  return sourceActive && targetActive && isConnectionVisible(connection);
}

// Check for new connections when a star is unlocked
function checkForNewConnections(conceptId: string) {
  connections.forEach(connection => {
    if (connection.sourceId === conceptId || connection.targetId === conceptId) {
      // Check if the other concept is also unlocked
      const otherId = connection.sourceId === conceptId ? connection.targetId : connection.sourceId;
      if (isConceptUnlocked(otherId)) {
        // Connection should now be visible
        connection.discovered = true;
        // Visual feedback
        constellationRenderer.showConnection(connection.id);
      }
    }
  });
}
```

3. **Connection Mastery System**
```typescript
// Update connection mastery when answering questions
function updateConnectionMasteryFromQuestion(conceptIds: string[], masteryAmount: number) {
  // Check for connections between these concepts
  if (conceptIds.length > 1) {
    // For each pair of concepts in the question
    for (let i = 0; i < conceptIds.length; i++) {
      for (let j = i + 1; j < conceptIds.length; j++) {
        const connection = getConnectionBetweenConcepts(conceptIds[i], conceptIds[j]);
        
        if (connection) {
          // Update connection mastery
          updateConnectionMastery(connection.id, masteryAmount * 1.2); // Bonus for connections
          
          // Log to journal
          journalStore.addEntry({
            type: 'connection-mastery',
            details: `+${masteryAmount * 1.2}% ${getConceptName(conceptIds[i])}/${getConceptName(conceptIds[j])} connection mastery`,
            timestamp: Date.now()
          });
        }
      }
    }
  }
}
```

4. **Connection Visualization**
```typescript
// Update connection visual appearance based on mastery and activation
function renderConnection(connection: Connection) {
  const isVisible = isConnectionVisible(connection);
  if (!isVisible) return null;
  
  const isEmphasized = isConnectionEmphasized(connection);
  const masteryLevel = connection.mastery;
  
  let lineStyle = "dotted"; // Default low mastery (0-30%)
  let lineWidth = 1;
  let lineClass = "connection-low";
  
  if (masteryLevel > 70) {
    // High mastery (70-100%)
    lineStyle = "solid";
    lineWidth = 3;
    lineClass = "connection-high";
    // Add wavy animation
  } else if (masteryLevel > 30) {
    // Medium mastery (30-70%)
    lineStyle = "solid";
    lineWidth = 1.5;
    lineClass = "connection-medium";
  }
  
  // Use additional emphasis for connections between activated stars
  if (isEmphasized) {
    lineClass += " connection-emphasized";
    // Could add glow effect
  }
  
  // Return appropriate line visualization
  return (
    <line 
      x1={source.x} 
      y1={source.y} 
      x2={target.x} 
      y2={target.y}
      className={lineClass}
      strokeDasharray={lineStyle === "dotted" ? "4,4" : "none"}
      strokeWidth={lineWidth}
    />
  );
}
```

#### Implementation Tasks

| Task | Details | Difficulty | Status |
|------|---------|------------|--------|
| Define Connection Data Model | Create Connection interface and storage | Easy | Not Started |
| Create Predefined Connections | Define ~30-40 connections between existing concepts | Medium | Not Started |
| Implement Connection Visibility Logic | Show connections between unlocked stars | Medium | Not Started |
| Implement Connection Emphasis | Enhanced visuals for connections between activated stars | Easy | Not Started |
| Implement Connection Mastery Updates | Increase mastery when answering multi-concept questions | Medium | Not Started |
| Create Connection Visualization States | Three visual states based on mastery level | Medium | Not Started |

### 4. Extension Architecture Refactoring

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

### 5. Tangent Ability Implementation (**Completed**)

#### Implementation Overview

The Tangent ability allows players to spend 25 Insight to explore alternative discussion topics during dialogue, potentially gaining greater insight rewards.

```typescript
// Handle ability activation in ConversationFormat.tsx
const handleAbilityActivate = useCallback((abilityType: StrategicActionType) => {
  // Skip if no current stage or not enough insight
  if (!currentStage || playerInsight < 25) return;
  
  // Only allow during question phase
  if (showResponse || !currentStage.options || currentStage.options.length === 0) {
    console.log(`[ConversationFormat] Abilities can only be used during questions`);
    return;
  }
  
  if (abilityType === 'tangent') {
    // Apply cost via standardized resource outcome
    applyStandardizedOutcome({
      insight: -25,
      momentumEffect: 'maintain'
    }, 'tangent_activation');
    
    // Change reaction of mentor character
    triggerMentorReaction('thinking', 1500);
    
    // Either navigate to specific tangent stage or modify current options
    if (currentStage.tangentStageId) {
      setCurrentStageId(currentStage.tangentStageId);
      onStageChange?.(currentStage.tangentStageId, currentStage.id);
    } else {
      // Fallback to modifying the current dialogue view
      // In a full implementation, all dialogue stages would have tangent alternates
    }
  }
}, [currentStage, playerInsight, showResponse, applyStandardizedOutcome]);
```

### 6. Journal Integration for Connection Mastery

```typescript
// Generate end-of-day run metrics summary
function generateDayRunMetrics() {
  // Get all mastery changes during this run
  const conceptGains = new Map<string, number>(); // Concept ID -> Total gain
  const connectionGains = new Map<string, number>(); // Connection ID -> Total gain
  
  // Collect from journal entries created during this run
  const dayEntries = journalStore.getEntriesForCurrentDay();
  
  dayEntries.forEach(entry => {
    if (entry.type === 'concept-mastery') {
      const { conceptId, amount } = entry.details;
      conceptGains.set(conceptId, (conceptGains.get(conceptId) || 0) + amount);
    } else if (entry.type === 'connection-mastery') {
      const { connectionId, amount } = entry.details;
      connectionGains.set(connectionId, (connectionGains.get(connectionId) || 0) + amount);
    }
  });
  
  // Format the summary
  let summary = "Day Run Metrics:\n";
  
  // Concept gains
  conceptGains.forEach((amount, conceptId) => {
    const conceptName = getConceptName(conceptId);
    summary += `+${amount.toFixed(1)}% ${conceptName}\n`;
  });
  
  // Connection gains
  connectionGains.forEach((amount, connectionId) => {
    const connection = getConnection(connectionId);
    const sourceName = getConceptName(connection.sourceId);
    const targetName = getConceptName(connection.targetId);
    summary += `+${amount.toFixed(1)}% ${sourceName}/${targetName} connection\n`;
  });
  
  // Add summary to journal
  journalStore.addEntry({
    type: 'day-summary',
    details: summary,
    timestamp: Date.now()
  });
  
  return summary;
}
```

### 7. Testing Plan

#### Core Mechanics Testing (**Updated**)

| Test Case | Expected Result | Status |
|-----------|-----------------|--------|
| Complete dialogue with various options | Appropriate resource outcomes based on tiers (Insight/Momentum gain/loss) | Tested |
| Complete equipment ID extension | Resources applied through feedback system | Tested |
| Activate Tangent ability during dialogue | 25 Insight spent, navigates to tangent content | Tested |
| Attempt Tangent with insufficient Insight | Button inactive, tooltip shows requirement | Tested |
| Attempt Tangent during response/continue | Button inactive, ability only works during questions | Tested |
| Complete tangent dialogue option | Higher Insight rewards for engaging with tangent | Tested |
| Discover concepts during day | Concepts marked as discovered, shown in journal, NOT unlocked | Not Tested |
| End day via UI button | Transition to night phase with discovered concepts available for unlock | Not Tested |
| Unlock stars with SP during Night | Stars unlock permanently with visual feedback, SP spent | Not Tested |
| Toggle unlocked star activation | Activation state changes visually (no SP cost) | Not Tested |
| Answer multi-concept question | Both concepts gain mastery and their connection gains mastery | Not Tested |
| Verify connection visibility | Connections appear automatically between unlocked stars | Not Tested |
| Verify connection emphasis | Connections between activated stars are more prominent | Not Tested |
| Begin new day | Return to map with unlocked/activated states preserved | Not Tested |

#### Resource System Testing (**Updated**)

| Test Case | Expected Result | Status |
|-----------|-----------------|--------|
| Answer correctly multiple times | Momentum increases using tier system | Tested |
| Answer incorrectly | Momentum resets with appropriate feedback | Tested |
| Gain sufficient insight during Day | Tangent ability becomes available with feedback | Tested |
| Use Tangent ability during Day | Insight spent, context changes, ability goes on cooldown | Tested |
| Attempt Tangent during Night | Ability is unavailable / cannot be used | Not Tested |
| Use Boast ability | Question difficulty increases with feedback (if Momentum high enough) | Not Tested |
| Gain SP (source TBD) | SP counter increases | Not Tested |
| Spend SP during Night to unlock star | SP counter decreases, star unlocks | Not Tested |
| Attempt to spend SP during Day | Action fails / SP cannot be spent | Not Tested |

## Connection System Implementation Priorities

For implementing the automatic connection system, focus on these tasks in order:

1. **Define Connection Model** (Day 1): Create data structures for connections
2. **Create Predefined Connections** (Day 1): Define 30-40 key connections for vertical slice
3. **Implement Basic Visibility** (Day 1-2): Make connections visible between unlocked stars
4. **Add Activation Effects** (Day 2): Enhance visuals for connections between activated stars
5. **Implement Mastery System** (Day 2-3): Add mastery tracking and visualization states
6. **Integrate with Journal** (Day 3): Add connection mastery gains to day run metrics

## Conclusion

The vertical slice development guide is now updated with the automatic connection system approach, which simplifies implementation while enhancing the knowledge constellation metaphor. Key progress has been made on the Resource System and Tangent ability, with focus now shifting to implementing the Two-Phase Knowledge Flow and automatic connections between stars.

The new connection system eliminates the need for manual connection UI, replacing it with an automatic system where connections appear between unlocked stars and become more prominent when both connected stars are activated. This matches the educational concept of knowledge connections forming naturally as related concepts are learned.

With the Resource System connected to Dialogue and the Tangent ability functioning properly, we've made significant progress toward the vertical slice goals. Implementing the automatic connection system will complete the core loop of the day/night cycle that is central to the game experience.
