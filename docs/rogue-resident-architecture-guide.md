# Rogue Resident: Architectural Lessons & Implementation Guide

## Executive Summary

After analyzing your Rogue Resident codebase, I've identified several architectural strengths that should be preserved as you rebuild for the time-based system described in your new GDD. This document highlights these strengths and provides concrete recommendations for implementing the new system while maintaining the technical excellence of your original design.

The primary strengths include:

1. **Robust Event-Driven Architecture** - Your central event bus provides excellent decoupling
2. **Well-Organized Store Pattern** - Domain-specific stores with clear responsibilities
3. **Chamber Pattern Optimizations** - Your rendering performance optimizations are top-tier
4. **Powerful State Machines** - Clean transitions between game states
5. **Rich Feedback Systems** - Excellent visual and auditory feedback

## Core Architectural Patterns to Preserve

### 1. Event-Driven Architecture

The `CentralEventBus.ts` implementation provides a robust foundation for cross-system communication. 

**Key strengths:**

```typescript
// Safe dispatch with source tracking
safeDispatch(
  GameEventType.KNOWLEDGE_DISCOVERED,
  { 
    conceptId, 
    source: 'knowledgeStore.discoverConcept' 
  },
  'knowledgeStore.discoverConcept'
);

// React hook for automatic subscription management
useEventSubscription<ResourceChangedPayload>(
  GameEventType.INSIGHT_GAINED,
  (event) => {
    if (!event.payload || event.payload.change <= 0) return;
    
    // Handle insight gained event
    setInsightEffect({
      active: true,
      amount: event.payload.change,
      source: event.payload.source || 'unknown'
    });
    
    // Additional handling...
  },
  []
);
```

**Implementation recommendations:**

- Define new event types for time-based activities (in GameEventType enum):
  ```typescript
  TIME_BLOCK_STARTED = 'time_block_started',
  ACTIVITY_SELECTED = 'activity_selected',
  ACTIVITY_COMPLETED = 'activity_completed',
  TIME_ADVANCED = 'time_advanced',
  DAY_SCHEDULE_UPDATED = 'day_schedule_updated',
  ```

- Maintain source tracking for better debugging
- Continue using the event system for cross-store communication

### 2. Store Pattern with Zustand

Your store implementation with Zustand provides clean separation of concerns.

**Key strengths:**

```typescript
// Clear action methods with event dispatching
export const useResourceStore = create<ResourceState>()((set, get) => ({
  // State
  insight: 0,
  momentum: 0,
  
  // Actions
  updateInsight: (amount: number, source?: string) => set((state) => {
    const currentValue = state.insight;
    const newValue = Math.max(0, Math.min(state.insightMax, currentValue + amount));
    const actualChange = newValue - currentValue;
    
    // Only update if there's an actual change
    if (actualChange === 0) return state;
    
    // Dispatch event to allow other systems to respond
    safeDispatch(GameEventType.INSIGHT_GAINED, {
      resourceType: 'insight',
      previousValue: currentValue,
      newValue,
      change: actualChange,
      source
    }, 'resourceStore');
    
    // State update
    state.insight = newValue;
    
    return state;
  }),
}));
```

**Implementation recommendations:**

- Create a new `timeStore.ts` for managing day/night cycle and time blocks
- Maintain the pattern of decoupled stores that communicate via events
- Use immer for simpler state updates
- Expose selectors directly from the store

Proposed `timeStore.ts` structure:

```typescript
export const useTimeStore = create<TimeState>()(
  immer((set, get) => ({
    // Core time state
    currentHour: 8,
    currentMinute: 0,
    dayPhase: 'day', // 'day' | 'night'
    currentDay: 1,
    
    // Schedule tracking
    currentActivity: null,
    scheduledActivities: [],
    completedActivities: [],
    availableActivities: [],
    
    // Actions
    advanceTime: (minutes: number, reason?: string) => {
      // Implementation to advance time
      set(state => {
        let newMinute = state.currentMinute + minutes;
        let newHour = state.currentHour;
        
        // Handle minute overflow
        if (newMinute >= 60) {
          newHour += Math.floor(newMinute / 60);
          newMinute = newMinute % 60;
        }
        
        // Handle hour constraints (8am to 5pm)
        if (newHour >= 17) {
          // End of day reached
          state.currentHour = 17;
          state.currentMinute = 0;
          
          // Dispatch end of day event
          safeDispatch(
            GameEventType.END_OF_DAY_REACHED,
            { day: state.currentDay },
            'timeStore.advanceTime'
          );
          
          return;
        }
        
        // Update time
        state.currentHour = newHour;
        state.currentMinute = newMinute;
        
        // Dispatch time changed event
        safeDispatch(
          GameEventType.TIME_ADVANCED,
          { 
            hour: newHour,
            minute: newMinute,
            reason: reason || 'normal_progression'
          },
          'timeStore.advanceTime'
        );
      });
    },
    
    // Additional time-related methods
    // ...
  }))
);
```

### 3. Chamber Pattern for Performance

Your implementation of the Chamber Pattern for optimizing rendering performance is excellent:

**Key strengths:**

```typescript
// Primitive value extraction
const playerInsight = usePrimitiveStoreValue(
  useResourceStore, 
  (state: any) => state.insight || 0, 
  0
);

// Stable selector creation
const { updateInsight, incrementMomentum } = useResourceStore(
  createStableSelector(['updateInsight', 'incrementMomentum'])
);

// Primitive values hook
const state = usePrimitiveValues(
  useGameStore,
  {
    phase: selectors.getGamePhase,
    currentNodeId: selectors.getCurrentNodeId,
    currentDay: selectors.getCurrentDay,
    isLoading: selectors.getIsLoading,
    gameState: selectors.getGameState,
    isTransitioning: selectors.getIsTransitioning,
    error: selectors.getErrorMessage,
    gameMode: selectors.getGameMode
  },
  // Default values
  { /* ... */ }
);
```

**Implementation recommendations:**

- Continue using the Chamber Pattern for all UI components
- Create primitive selectors for time-related values (current hour, minute, etc.)
- Keep using `usePrimitiveStoreValue` and `createStableSelector` for all components
- Add a `useTimeState` hook similar to your `useGameState`

```typescript
// Time-related selectors
export const timeSelectors = {
  getCurrentHour: (state: TimeState) => state.currentHour,
  getCurrentMinute: (state: TimeState) => state.currentMinute,
  getFormattedTime: (state: TimeState) => 
    `${state.currentHour}:${state.currentMinute.toString().padStart(2, '0')}`,
  getRemainingDayMinutes: (state: TimeState) => 
    (17 - state.currentHour) * 60 - state.currentMinute,
  getIsActivityInProgress: (state: TimeState) => 
    state.currentActivity !== null,
  // Additional selectors...
};

// Time state hook
export function useTimeState() {
  const timeState = usePrimitiveValues(
    useTimeStore,
    {
      hour: timeSelectors.getCurrentHour,
      minute: timeSelectors.getCurrentMinute,
      formattedTime: timeSelectors.getFormattedTime,
      remainingMinutes: timeSelectors.getRemainingDayMinutes,
      isActivityInProgress: timeSelectors.getIsActivityInProgress,
    },
    {
      hour: 8,
      minute: 0,
      formattedTime: '8:00',
      remainingMinutes: 540,
      isActivityInProgress: false,
    }
  );
  
  const actions = useStableStoreValue(
    useTimeStore,
    state => ({
      advanceTime: state.advanceTime,
      startActivity: state.startActivity,
      completeActivity: state.completeActivity,
    })
  );
  
  return {
    ...timeState,
    ...actions,
    isWorkHours: timeState.hour >= 8 && timeState.hour < 17,
    isLunchTime: timeState.hour === 12,
    isEndOfDay: timeState.hour >= 17,
  };
}
```

### 4. State Machine Implementation

Your game state machine provides clear transitions between game states:

**Key strengths:**

```typescript
// Explicit valid transitions
const VALID_PHASE_TRANSITIONS: Record<GamePhase, GamePhase[]> = {
  'day': ['transition_to_night'],
  'night': ['transition_to_day'],
  'transition_to_night': ['night'],
  'transition_to_day': ['day'],
};

// Phase transition with validation
transitionToPhase: (newPhase: GamePhase, reason?: string): boolean => {
  const currentPhase = get().gamePhase;
  if (currentPhase === newPhase) return true; // Already in this phase
  
  // Check if transition is valid
  const isValid = VALID_PHASE_TRANSITIONS[currentPhase]?.includes(newPhase);
  const isEmergency = reason?.includes('emergency') || 
                      reason?.includes('recovery') || 
                      reason?.includes('timeout');
  
  // Additional implementation...
}
```

**Implementation recommendations:**

- Adapt the state machine for time-based gameplay
- Create new phases for the time-based system:
  ```typescript
  export type GamePhase =
    | 'day_selecting'    // Player selecting activity
    | 'day_activity'     // Player in activity
    | 'day_completed'    // End of day
    | 'night_reflection' // Night phase - reviewing constellation
    | 'night_planning'   // Night phase - planning next day (when unlocked)
    | 'transition_to_day'
    | 'transition_to_night';
  ```
- Define valid transitions between these phases
- Keep the self-recovery and logging mechanisms

## Domain-Specific Implementations

### 1. Knowledge Constellation System

Your knowledge system represents expertise development as a growing constellation:

**Key strengths:**

```typescript
// Clear concept lifecycle with multiple states
unlockConcept: (conceptId: string): boolean => {
  let success = false;
  
  set(state => {
    const node = state.nodes.find(n => n.id === conceptId);
    
    if (!node) {
      console.warn(`Cannot unlock concept: Concept ${conceptId} not found`);
      return;
    }
    
    if (!node.discovered) {
      console.warn(`Cannot unlock concept: Concept ${conceptId} not yet discovered`);
      return;
    }
    
    if (node.unlocked) {
      console.warn(`Concept ${conceptId} is already unlocked`);
      success = true;
      return;
    }
    
    // Check if player has enough SP
    if (state.starPoints < node.spCost) {
      console.warn(`Not enough SP to unlock concept ${conceptId}`);
      return;
    }
    
    // Spend SP and unlock concept
    // Additional implementation...
  });
  
  return success;
}
```

**Implementation recommendations:**

- Keep the constellation system intact as it aligns perfectly with your GDD
- Create clear connections between time-based activities and knowledge gains:
  ```typescript
  // In activity definition
  {
    id: 'kapoor-qa-session',
    title: 'QA Protocol Review with Dr. Kapoor',
    location: 'Physics Office',
    duration: 60, // minutes
    mentor: 'kapoor',
    difficulty: 2,
    domain: 'dosimetry',
    knowledgeGains: [
      { conceptId: 'qa-protocols', amount: 15 },
      { conceptId: 'ion-chambers', amount: 10 }
    ],
    // Additional properties...
  }
  ```
- Enhance connection formation by tracking which concepts were used together in activities

### 2. Resource System

Your resource system with standardized tiers provides consistent outcomes:

**Key strengths:**

```typescript
// Standardized resource tier definitions
export const ResourceTiers = {
  MINOR: { insight: 5, momentumEffect: 'maintain' as const },
  STANDARD: { insight: 10, momentumEffect: 'increment' as const },
  MAJOR: { insight: 15, momentumEffect: 'increment' as const },
  CRITICAL: { insight: 25, momentumEffect: 'increment' as const },
  FAILURE: { insight: 0, momentumEffect: 'reset' as const }
}

// Standardized outcome application
applyStandardizedOutcome: (outcomeOrTier: StandardizedOutcome | ResourceTierName, source: string = 'standard_outcome') => {
  let outcome: StandardizedOutcome;

  // Determine outcome from tier or direct object
  if (typeof outcomeOrTier === 'string') {
    const tierName = outcomeOrTier as ResourceTierName;
    outcome = { ...ResourceTiers[tierName], tierName, source };
  } else {
    outcome = { ...outcomeOrTier, source: outcomeOrTier.source || source };
  }
  
  // Apply insight change
  if (outcome.insight !== undefined && outcome.insight !== 0) {
    get().updateInsight(outcome.insight, outcome.source);
  }

  // Apply momentum effect
  if (outcome.momentumEffect === 'increment') {
    get().incrementMomentum();
  } else if (outcome.momentumEffect === 'reset') {
    get().resetMomentum();
  }
  
  // Additional implementation...
}
```

**Implementation recommendations:**

- Keep the resource tier system and extend it for time-based activities
- Add time-related outcomes to the standard tiers:
  ```typescript
  export const TimeResourceTiers = {
    MINOR: { 
      insight: 5, 
      momentumEffect: 'maintain' as const,
      timeReduction: 0  // No time savings
    },
    STANDARD: { 
      insight: 10, 
      momentumEffect: 'increment' as const,
      timeReduction: 5  // Save 5 minutes
    },
    MAJOR: { 
      insight: 15, 
      momentumEffect: 'increment' as const,
      timeReduction: 10 // Save 10 minutes
    },
    CRITICAL: { 
      insight: 25, 
      momentumEffect: 'increment' as const,
      timeReduction: 15 // Save 15 minutes
    },
    FAILURE: { 
      insight: 0, 
      momentumEffect: 'reset' as const,
      timeReduction: -5 // Penalty: 5 extra minutes
    }
  }
  ```
- Apply these time reductions when activities complete based on performance

### 3. Dialogue System

Your dialogue system provides rich interactions with characters:

**Key strengths:**

```typescript
// Strategic dialogue options with rich feedback
handleBoastOption = useCallback(async (event: React.MouseEvent) => {
  // Validation...
  
  // Play suspense sound for boast activation
  playSound('/sounds/rogue.suspense.mp3');
  
  // Record activation of boast
  setBoastActivated(true);
  setBoastShakeActive(true);
  // Set a timeout to turn it off after the animation
  setTimeout(() => {
    setBoastShakeActive(false);
  }, 500); // 500ms matches the duration of the shake animation
  
  // Track position for animations
  const clickPosition = {
    x: event.clientX,
    y: event.clientY
  };
  
  // Get location of momentum counter for particles target
  let momentumCounterElement = document.querySelector('.mc-counter');
  let momentumPosition = momentumCounterElement 
    ? { 
        x: momentumCounterElement.getBoundingClientRect().left + 
           (momentumCounterElement.getBoundingClientRect().width / 2),
        y: momentumCounterElement.getBoundingClientRect().top + 
           (momentumCounterElement.getBoundingClientRect().height / 2)
      }
    : null;
  
  // Trigger visual effect for boast activation
  setParticleEffectTrigger({
    origin: clickPosition,
    target: momentumPosition,
    effect: 'maintain', // Use 'maintain' for boast as it doesn't consume momentum
    amount: 3, // Max momentum
    show: true
  });
  
  // Additional implementation...
}

// Dialogue container with rich visual styling
<DialogueContainer 
  mode={currentDialogueMode}
  title={getStageTitle(currentStage)}
  className={`w-full max-w-4xl ${boastActivated ? 'boast-mode-container' : ''}`}
>
  {/* Dialogue content */}
</DialogueContainer>
```

**Implementation recommendations:**

- Keep this system intact for activities involving dialogue
- Adapt it to work within the time-based framework:
  ```typescript
  // Activity component that wraps dialogue
  function ActivityComponent({
    activityId,
    activityData,
    onComplete
  }) {
    // Time tracking
    const startTime = useRef(Date.now());
    const { advanceTime } = useTimeStore();
    
    // Handle activity completion
    const handleDialogueComplete = (results) => {
      // Calculate actual time spent
      const timeSpent = activityData.fixedDuration || 
        Math.floor((Date.now() - startTime.current) / 1000 / 60);
      
      // Apply time reduction based on outcome
      const timeReduction = results.timeReduction || 0;
      const finalTimeSpent = Math.max(15, timeSpent - timeReduction);
      
      // Advance game time
      advanceTime(finalTimeSpent);
      
      // Call completion callback
      onComplete({
        activityId,
        timeSpent: finalTimeSpent,
        outcomes: results
      });
    };
    
    // Render appropriate activity format based on type
    return (
      <div className="activity-container">
        {activityData.type === 'dialogue' && (
          <ConversationFormat
            characterId={activityData.mentor}
            dialogueId={activityData.dialogueId}
            onComplete={handleDialogueComplete}
          />
        )}
        
        {activityData.type === 'qaprocedure' && (
          <QAProcedureFormat
            procedureId={activityData.procedureId}
            difficulty={activityData.difficulty}
            onComplete={handleDialogueComplete}
          />
        )}
        
        {/* Other activity formats */}
      </div>
    );
  }
  ```

### 4. Feedback System

Your feedback system provides clear visual indicators for player actions:

**Key strengths:**

```typescript
// Message queue handling
useEffect(() => {
  // If we have an active message, don't process the queue
  if (activeMessage) return;
  
  // If we have messages in the queue, show the next one
  if (messageQueue.length > 0) {
    // Get the first message and remove it from queue
    const nextMessage = messageQueue[0];
    
    // Update the state
    setActiveMessage(nextMessage);
    setMessageQueue(prev => prev.slice(1)); // Remove first message
    
    // Set up the timer to clear this message after its duration
    const duration = nextMessage.duration || 
      (nextMessage.type.includes('domain') ? 6000 : 5000);
    
    // Set a new timer
    messageTimerRef.current = setTimeout(() => {
      setActiveMessage(null);
      messageTimerRef.current = null;
    }, duration);
  }
}, [activeMessage, messageQueue]);

// Particle effects for resource changes
{insightParticlesComponent}
{momentumParticlesComponent}
```

**Implementation recommendations:**

- Keep the feedback system intact
- Add time-specific feedback:
  ```typescript
  // Additional event subscriptions in FeedbackSystem
  useEventSubscription<TimeChangedPayload>(
    GameEventType.TIME_ADVANCED,
    (event) => {
      if (!event.payload) return;
      
      // Only show feedback for significant time jumps
      if (event.payload.reason === 'activity_completed' || 
          event.payload.reason === 'time_skip') {
        
        addMessage({
          id: `time-${Date.now()}`,
          message: `Time advances to ${event.payload.hour}:${String(event.payload.minute).padStart(2, '0')}`,
          type: 'time',
          timestamp: Date.now(),
          duration: 3000
        });
      }
    },
    []
  );
  ```

- Create a time visualization component:
  ```typescript
  function TimeVisualizer() {
    const { hour, minute } = useTimeState();
    const dayProgress = ((hour - 8) * 60 + minute) / 540; // 9 hours = 540 minutes
    
    return (
      <div className="time-visualizer">
        <div className="time-display">
          {hour}:{String(minute).padStart(2, '0')}
        </div>
        <div className="progress-bar-container">
          <div 
            className="progress-bar" 
            style={{ width: `${dayProgress * 100}%` }}
          />
        </div>
      </div>
    );
  }
  ```

## Implementation Strategy for Time-Based System

Based on your existing architecture and the new GDD, here's a strategy for implementing the time-based system:

### 1. Create Core Time Components

```typescript
// TimeDisplay component for header
function TimeDisplay() {
  const { hour, minute, formattedTime } = useTimeState();
  
  return (
    <div className="time-display">
      <div className="time-icon">⏱️</div>
      <div className="time-text">{formattedTime}</div>
    </div>
  );
}

// Activity selection component
function ActivitySelection() {
  const { availableActivities } = useTimeStore(
    createStableSelector(['availableActivities'])
  );
  const { startActivity } = useTimeState();
  
  return (
    <div className="activity-selection">
      <h2>Available Activities</h2>
      <div className="activity-list">
        {availableActivities.map(activity => (
          <ActivityCard 
            key={activity.id}
            activity={activity}
            onSelect={() => startActivity(activity.id)}
          />
        ))}
      </div>
    </div>
  );
}

// Activity card component
function ActivityCard({ activity, onSelect }) {
  return (
    <div 
      className={`activity-card ${activity.domain}-domain`}
      onClick={onSelect}
    >
      <div className="activity-header">
        <h3>{activity.title}</h3>
        <div className="activity-location">{activity.location}</div>
      </div>
      <div className="activity-details">
        <div className="activity-mentor">
          With: {activity.mentor ? getMentorName(activity.mentor) : 'Self-study'}
        </div>
        <div className="activity-duration">
          Duration: {activity.duration} min
        </div>
        <div className="activity-difficulty">
          Difficulty: {'★'.repeat(activity.difficulty)}{'☆'.repeat(3 - activity.difficulty)}
        </div>
      </div>
    </div>
  );
}
```

### 2. Create Time-Based Day Container

```typescript
function DayContainer() {
  const { gamePhase } = useGameState();
  const { currentActivity, isActivityInProgress } = useTimeState();
  
  // Render different views based on game phase
  if (gamePhase !== 'day_selecting' && gamePhase !== 'day_activity') {
    return null;
  }
  
  return (
    <div className="day-container">
      <TimeDisplay />
      
      {isActivityInProgress ? (
        <ActivityContainer 
          activityId={currentActivity.id}
          activityData={currentActivity}
        />
      ) : (
        <ActivitySelection />
      )}
    </div>
  );
}

function ActivityContainer({ activityId, activityData }) {
  const { completeActivity } = useTimeState();
  
  // Handle activity completion
  const handleComplete = (results) => {
    completeActivity({
      activityId,
      timeSpent: results.timeSpent || activityData.duration,
      outcomes: results,
    });
  };
  
  // Render the appropriate activity component based on type
  return (
    <div className="activity-container">
      {activityData.type === 'dialogue' && (
        <ConversationFormat
          characterId={activityData.mentor}
          dialogueId={activityData.dialogueId}
          onComplete={handleComplete}
        />
      )}
      
      {/* Other activity types */}
    </div>
  );
}
```

### 3. Create Night Phase Components

```typescript
function NightContainer() {
  const { gamePhase } = useGameState();
  const { beginNightCompletion } = useGameState();
  const { unlockedAbilities } = useProgressionStore(
    createStableSelector(['unlockedAbilities'])
  );
  
  // Check if day planning is unlocked
  const canPlanNextDay = unlockedAbilities.includes('schedule_peek') ||
                        unlockedAbilities.includes('appointment_setting');
  
  // Current night phase view
  const [currentView, setCurrentView] = useState('constellation');
  
  if (gamePhase !== 'night_reflection' && gamePhase !== 'night_planning') {
    return null;
  }
  
  return (
    <div className="night-container">
      <div className="night-sidebar">
        <div 
          className={`sidebar-option ${currentView === 'constellation' ? 'active' : ''}`}
          onClick={() => setCurrentView('constellation')}
        >
          Knowledge Constellation
        </div>
        
        {canPlanNextDay && (
          <div 
            className={`sidebar-option ${currentView === 'planning' ? 'active' : ''}`}
            onClick={() => setCurrentView('planning')}
          >
            Plan Next Day
          </div>
        )}
        
        <button 
          className="end-night-button"
          onClick={beginNightCompletion}
        >
          Sleep & Start New Day
        </button>
      </div>
      
      <div className="night-content">
        {currentView === 'constellation' && (
          <ConstellationView />
        )}
        
        {currentView === 'planning' && (
          <DayPlanningView />
        )}
      </div>
    </div>
  );
}
```

### 4. Implement Progressive Control System

```typescript
// Function to check for new ability unlocks based on GDD progression
function checkProgressiveControlUnlocks() {
  const { totalMastery } = useKnowledgeStore.getState();
  const { mentorRelationships, unlockedAbilities, season } = useProgressionStore.getState();
  
  // Check for Quick Study ability
  if (totalMastery >= 25 && !unlockedAbilities.includes('quick_study')) {
    useProgressionStore.getState().unlockAbility('quick_study');
  }
  
  // Check for Schedule Peek
  if (season !== 'spring' &&
      Object.values(mentorRelationships).filter(r => r >= 3).length >= 2 && 
      !unlockedAbilities.includes('schedule_peek')) {
    useProgressionStore.getState().unlockAbility('schedule_peek');
  }
  
  // Check for Appointment Setting
  if (Object.values(mentorRelationships).some(r => r >= 4) && 
      !unlockedAbilities.includes('appointment_setting')) {
    useProgressionStore.getState().unlockAbility('appointment_setting');
  }
  
  // Check for Time Optimization
  if (season === 'fall' && totalMastery >= 65 && 
      !unlockedAbilities.includes('time_optimization')) {
    useProgressionStore.getState().unlockAbility('time_optimization');
  }
  
  // Additional ability checks...
}

// Effect of Quick Study ability on time cost
function calculateActivityTimeCost(activityData) {
  const { unlockedAbilities } = useProgressionStore.getState();
  const { nodes } = useKnowledgeStore.getState();
  
  // Base duration
  let duration = activityData.duration;
  
  // Quick Study effect - reduce simple activities time
  if (unlockedAbilities.includes('quick_study') && activityData.difficulty === 1) {
    // Find concept mastery for this activity's domain
    const domainConcepts = nodes.filter(
      n => n.domain === activityData.domain && n.unlocked
    );
    
    // Calculate average mastery
    const avgMastery = domainConcepts.reduce((sum, n) => sum + n.mastery, 0) / 
                      Math.max(1, domainConcepts.length);
    
    // Apply reduction based on mastery (up to 25% for 75+ mastery)
    if (avgMastery >= 75) {
      duration = Math.floor(duration * 0.75);
    } else if (avgMastery >= 50) {
      duration = Math.floor(duration * 0.85);
    } else if (avgMastery >= 25) {
      duration = Math.floor(duration * 0.95);
    }
  }
  
  // Time Optimization effect - reduce all activities in highly mastered domains
  if (unlockedAbilities.includes('time_optimization')) {
    // Similar implementation for all difficulty levels
    // ...
  }
  
  return duration;
}
```

## Code Organization & Naming Conventions

Your current codebase follows consistent patterns that should be maintained:

### File Structure

Keep the domain-specific organization:

```
app/
├── components/
│   ├── activities/        # New folder for activity components
│   │   ├── ActivityCard.tsx
│   │   ├── ActivityContainer.tsx
│   │   └── formats/       # Different activity format implementations
│   │       ├── DialogueActivity.tsx
│   │       ├── QAActivity.tsx
│   │       └── ...
│   ├── schedule/          # New folder for schedule components
│   │   ├── TimeDisplay.tsx
│   │   ├── ScheduleView.tsx
│   │   └── ...
│   ├── knowledge/         # Existing constellation components
│   ├── dialogue/          # Existing dialogue components
│   └── ...
├── core/
│   ├── events/            # Keep existing event system
│   ├── statemachine/      # Keep existing state machine
│   ├── time/              # New folder for time-related core logic
│   │   ├── TimeManager.ts
│   │   ├── ScheduleGenerator.ts
│   │   └── ...
│   └── ...
├── store/
│   ├── timeStore.ts       # New store for time management
│   ├── scheduleStore.ts   # New store for schedule management
│   ├── gameStore.ts       # Update existing store 
│   ├── knowledgeStore.ts  # Keep existing store
│   └── ...
└── ...
```

### Naming Conventions

Continue following these conventions:

1. **Components**: PascalCase for component names (e.g., `TimeDisplay`, `ActivityCard`)
2. **Stores**: camelCase for store names (e.g., `useTimeStore`, `useScheduleStore`)
3. **Actions**: camelCase verbs for actions (e.g., `advanceTime`, `startActivity`)
4. **Events**: UPPER_SNAKE_CASE for event types (e.g., `TIME_ADVANCED`, `ACTIVITY_COMPLETED`)
5. **State**: camelCase for state properties (e.g., `currentHour`, `isActivityInProgress`)

## Testing & Debugging Recommendations

Based on your existing codebase, here are recommendations for testing and debugging:

### 1. Event Debugging

```typescript
// Add a time-specific debug utility
// Global debug access (in timeStore.ts)
if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
  window.__TIME_STORE_DEBUG__ = {
    getState: () => useTimeStore.getState(),
    jumpToTime: (hour: number, minute: number = 0) => {
      const current = useTimeStore.getState();
      const minuteDiff = (hour * 60 + minute) - (current.currentHour * 60 + current.currentMinute);
      if (minuteDiff > 0) {
        useTimeStore.getState().advanceTime(minuteDiff, 'debug_jump');
      }
      return `Time set to ${hour}:${minute.toString().padStart(2, '0')}`;
    },
    completeCurrentActivity: () => {
      const { currentActivity } = useTimeStore.getState();
      if (currentActivity) {
        useTimeStore.getState().completeActivity({
          activityId: currentActivity.id,
          timeSpent: 5,
          outcomes: {
            insightGained: 15,
            momentumEffect: 'increment'
          }
        });
        return `Activity ${currentActivity.id} completed`;
      }
      return 'No activity in progress';
    },
    forceEndDay: () => {
      useTimeStore.getState().endDay();
      return 'Day ended';
    }
  };
}
```

### 2. Unit Tests for Time System

```typescript
// tests/testTimeSystem.js
function testTimeAdvancement() {
  // Set up initial state
  useTimeStore.setState({
    currentHour: 9,
    currentMinute: 30,
    dayPhase: 'day',
    currentDay: 1
  });
  
  // Record initial values
  const initialHour = useTimeStore.getState().currentHour;
  const initialMinute = useTimeStore.getState().currentMinute;
  
  // Act - advance time by 45 minutes
  useTimeStore.getState().advanceTime(45);
  
  // Assert
  const newHour = useTimeStore.getState().currentHour;
  const newMinute = useTimeStore.getState().currentMinute;
  
  console.assert(
    newHour === 10 && newMinute === 15,
    `Time should advance to 10:15, got ${newHour}:${newMinute}`
  );
  
  // Test day boundary
  useTimeStore.setState({ currentHour: 16, currentMinute: 50 });
  useTimeStore.getState().advanceTime(20);
  
  console.assert(
    useTimeStore.getState().currentHour === 17 && useTimeStore.getState().currentMinute === 0,
    'Time should stop at 17:00 (5 PM)'
  );
}
```

## Performance Considerations

Based on your Chamber Pattern implementation, here are recommendations for optimizing the time-based system:

### 1. Minimize Rerendering with Chamber Pattern

Continue using the Chamber Pattern for all new components:

```typescript
function ScheduleDisplay() {
  // Extract only primitive values needed for rendering
  const { hour, minute } = usePrimitiveValues(
    useTimeStore,
    {
      hour: state => state.currentHour,
      minute: state => state.currentMinute
    },
    { hour: 8, minute: 0 }
  );
  
  // Extract stable actions
  const { advanceTime } = useStableStoreValue(
    useTimeStore,
    state => ({ advanceTime: state.advanceTime })
  );
  
  // Implementation...
}
```

### 2. Batch Time Updates

```typescript
// In timeStore.ts
export const useTimeStore = create<TimeState>()(
  immer((set, get) => ({
    // State...
    
    // Batch multiple time updates
    batchTimeUpdates: (actions: Array<{type: 'advance' | 'set', amount?: number, hour?: number, minute?: number}>) => {
      // Calculate total time difference
      let totalMinuteDiff = 0;
      let finalHour = get().currentHour;
      let finalMinute = get().currentMinute;
      
      // Process all actions
      actions.forEach(action => {
        if (action.type === 'advance' && action.amount) {
          totalMinuteDiff += action.amount;
        } else if (action.type === 'set' && action.hour !== undefined) {
          const newMinutes = action.hour * 60 + (action.minute || 0);
          const currentMinutes = finalHour * 60 + finalMinute;
          totalMinuteDiff += newMinutes - currentMinutes;
        }
      });
      
      // Apply the total time change at once
      if (totalMinuteDiff > 0) {
        get().advanceTime(totalMinuteDiff, 'batched_update');
      }
    }
    
    // Other methods...
  }))
);
```

### 3. Optimize Activity Loading

```typescript
// Pre-load activities instead of loading on demand
function preloadActivitiesForDay() {
  const { currentDay, season } = useGameStore.getState();
  
  // Use the schedule generator to create activities
  const schedule = generateDailySchedule(currentDay, season);
  
  // Load all activities at once to avoid loading during gameplay
  useTimeStore.setState({
    scheduledActivities: schedule,
    availableActivities: filterAvailableActivities(schedule, 8, 0) // 8:00 AM
  });
  
  return schedule.length;
}
```

## Conclusion

Your existing codebase provides an excellent foundation for implementing the time-based system described in your new GDD. By preserving the core architectural patterns (event-driven architecture, store separation, Chamber Pattern, state machines) while extending them for time-based gameplay, you'll maintain technical excellence while creating a more intuitive, authentic experience.

Key recommendations:

1. **Create a dedicated time management system** with clear state transitions
2. **Keep the knowledge constellation as is** - it works perfectly with your vision
3. **Expand the resource system** to include time-related outcomes
4. **Maintain the Chamber Pattern** for optimal performance
5. **Use the event system** for cross-store communication

With these foundations in place, you'll be well-positioned to build a compelling, educational gameplay experience that fulfills the vision in your new GDD.
