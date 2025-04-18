# Resource Tier System

This system standardizes resource changes (insight and momentum) across different game actions like dialogue choices, extension completions, and strategic actions.

## Key Components

1. **Resource Tiers** - Standardized outcomes with preset values:
   - `MINOR` - Small insight gain, momentum maintained
   - `STANDARD` - Medium insight gain, momentum incremented
   - `MAJOR` - Large insight gain, momentum incremented
   - `CRITICAL` - Largest insight gain, momentum incremented
   - `FAILURE` - No insight gain, momentum reset

2. **ResourceOutcomeService** - Applies resource outcomes with standardized feedback

3. **Centralized Feedback System** - Visual and audio feedback for resource changes

## Usage Examples

### Example 1: Apply a standard tier outcome from dialogue

```typescript
import { ResourceOutcomeService, ResourceTier } from '@/app/core/resources/ResourceTierSystem';
import { useResourceStore } from '@/app/store/resourceStore';

// In a dialogue component:
function handleDialogueOption(optionScore: number) {
  const resourceStore = useResourceStore.getState();
  
  // Determine tier based on score
  let tier: ResourceTier;
  
  if (optionScore > 0.8) tier = 'CRITICAL';
  else if (optionScore > 0.6) tier = 'MAJOR';
  else if (optionScore > 0.4) tier = 'STANDARD';
  else if (optionScore > 0.2) tier = 'MINOR';
  else tier = 'FAILURE';
  
  // Apply the resource outcome
  ResourceOutcomeService.applyTierOutcome(
    tier, 
    resourceStore, 
    'dialogue_choice'
  );
}
```

### Example 2: Custom resource outcome from extension completion

```typescript
import { ResourceOutcomeService, createCustomOutcome } from '@/app/core/resources/ResourceTierSystem';
import { useResourceStore } from '@/app/store/resourceStore';

// In an extension component:
function handleExtensionCompletion(score: number, conceptId: string) {
  const resourceStore = useResourceStore.getState();
  
  // Create a custom outcome with knowledge gain
  const customOutcome = createCustomOutcome(
    Math.round(score * 20), // Dynamic insight based on score
    score > 0.5 ? 'increment' : 'maintain', // Momentum effect
    `You scored ${Math.round(score * 100)}%!`, // Feedback message
    [{ conceptId, amount: Math.round(score * 10) }] // Knowledge gain
  );
  
  // Apply the custom outcome
  ResourceOutcomeService.applyResourceOutcome(
    customOutcome,
    resourceStore,
    'extension_completion'
  );
}
```

### Example 3: Delayed effects from a strategic action

```typescript
import { ResourceOutcomeService, createCustomOutcome } from '@/app/core/resources/ResourceTierSystem';
import { useResourceStore } from '@/app/store/resourceStore';

// For a strategic action like "Tangent":
function activateTangent() {
  const resourceStore = useResourceStore.getState();
  
  // Create an outcome with delayed effects
  const outcome = createCustomOutcome(
    -25, // Immediate insight cost
    'maintain', // No momentum effect
    "You shifted the conversation...",
    [], // No immediate knowledge gain
    [
      { 
        type: 'insight', 
        amount: 40, 
        delay: 5000, // Delayed reward after 5 seconds
        conceptId: undefined
      }
    ]
  );
  
  // Apply the outcome with delayed effects
  ResourceOutcomeService.applyResourceOutcome(
    outcome,
    resourceStore,
    'strategic_action'
  );
}
```

## Integration with UI

The resource tier system automatically triggers events that the FeedbackSystem component listens for, providing:

1. Visual particles effects for insight gains and momentum changes
2. Popup messages for resource changes
3. Audio feedback for significant events

## Implementation Notes

- All resource changes should go through the ResourceOutcomeService to ensure consistent feedback
- Use predefined tiers when possible for standardized player experience
- Custom outcomes allow flexibility while maintaining consistent feedback patterns

## Debugging

You can debug resource outcomes by watching for these events in the browser console:

- `INSIGHT_GAINED`
- `MOMENTUM_EFFECT`
- `FEEDBACK_MESSAGE` 