# Resource Tier System Integration Guide

This guide explains how to safely integrate the resource tier system with your existing dialogue and extension components without breaking current functionality.

## What We've Added

1. **DialogueTierConnector** - A simple connector hook that safely integrates resource tiers with dialogue
2. **MomentumTester** - A testing component to visualize and debug momentum mechanics
3. **DialogueTierExample** - An example implementation of dialogue with tier-based resource outcomes

## How to Use the Resource Tier System

### 1. Basic Integration with Dialogue

```tsx
// Import the connector hook
import { useDialogueTierConnector } from '../components/DialogueTierConnector';

// In your component
function YourDialogueComponent() {
  // Get the tier processor
  const { processOptionOutcome } = useDialogueTierConnector();
  
  // In your option selection handler:
  function handleOptionSelect(option) {
    // Calculate a score for the option (0-100)
    // Higher is better, this represents how "correct" the answer is
    const score = calculateOptionScore(option);
    
    // Process the outcome - this handles insight and momentum changes
    const tier = processOptionOutcome(score);
    
    // Continue with your existing code...
  }
}
```

### 2. Calculating Option Scores

Option scores should be on a scale of 0-100, where:
- 0-20: FAILURE (resets momentum, no insight)
- 20-50: MINOR (maintains momentum, small insight gain)
- 50-75: STANDARD (increases momentum, medium insight gain)
- 75-90: MAJOR (increases momentum, large insight gain)
- 90-100: CRITICAL (increases momentum, largest insight gain)

Example scoring function:

```tsx
function calculateOptionScore(option) {
  // For pre-authored dialogue you can hardcode quality values
  if (option.quality === 'best') return 95;  // CRITICAL
  if (option.quality === 'good') return 80;  // MAJOR
  if (option.quality === 'average') return 60; // STANDARD
  if (option.quality === 'poor') return 30;  // MINOR
  return 10; // FAILURE
  
  // For dynamic systems, compute a score based on correctness, relevance, etc.
  // return someFormula(correctness, relevance, creativity) * 100;
}
```

### 3. Testing the Momentum System

To test the momentum system, add the MomentumTester component to any page:

```tsx
import MomentumTester from '../components/testing/MomentumTester';

export default function YourPage() {
  return (
    <div>
      {/* Your existing page content */}
      
      {/* Add this for testing, remove for production */}
      <MomentumTester />
    </div>
  );
}
```

This will add a floating panel that lets you test momentum mechanics and resource tiers.

## Behind the Scenes

The Resource Tier System is designed to have minimal impact on your existing code:

1. It uses the existing ResourceOutcomeService, which was already present but possibly not fully connected
2. It leverages your existing resource store (incrementMomentum, resetMomentum)
3. It routes everything through the centralized event system for feedback

## Extending to Other Systems

The same approach can be used for extensions and other interactive components:

```tsx
// In an extension result handler
function handleExtensionResult(result) {
  // Calculate a score based on performance (0-100)
  const successScore = (result.correctCount / result.totalCount) * 100;
  
  // Process the outcome
  const tier = processOptionOutcome(successScore);
  
  // Continue with your existing code...
}
```

## Advanced Usage

For more complex scenarios, you can use the direct ResourceOutcomeService:

```tsx
import { ResourceOutcomeService, createCustomOutcome } from '../core/resources/ResourceTierSystem';
import { useResourceStore } from '../store/resourceStore';

// Custom outcome with delayed effects and knowledge mastery
const outcome = createCustomOutcome(
  15, // insight amount
  'increment', // momentum effect
  'Excellent deduction!', // feedback message
  [{ conceptId: 'radiation-safety', amount: 5 }], // knowledge gain
  [{ 
    type: 'insight', 
    amount: 10, 
    delay: 5000 // delayed effect after 5 seconds
  }]
);

// Apply the custom outcome
ResourceOutcomeService.applyResourceOutcome(
  outcome, 
  useResourceStore.getState(), 
  'extension_completion'
);
```

## Troubleshooting

If you encounter issues:

1. Check the console for errors
2. Verify that ResourceOutcomeService is working by testing with MomentumTester
3. Ensure your resource store has the expected methods (incrementMomentum, resetMomentum)
4. Check that the event system is dispatching events correctly 