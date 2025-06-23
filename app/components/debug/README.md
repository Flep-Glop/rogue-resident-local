# 🎮 Game Development Console

## Overview

The Game Development Console is your command center for testing all aspects of your medical physics game. It follows industry-standard practices used by professional game developers to efficiently test different scenarios without manually navigating through the entire game.

## Quick Start

1. **Open Console**: Press `F2` (or click the blue "Dev Console" button in top-right)
2. **Browse Scenarios**: Click any scenario card to instantly jump to that game state
3. **Use Quick Actions**: Use the control panel for common operations
4. **Close Console**: Press `ESC` or `F2` again

## Scenario Categories

### 🎓 Tutorial Testing
- **First Day Tutorial - Start**: Clean slate tutorial beginning
- **Tutorial - Lunch Scene**: Jump directly to Dr. Quinn lunch dialogue
- **Tutorial - Constellation Intro**: Night phase tutorial
- **Tutorial - Mid Sequence**: Test specific tutorial steps with prerequisites completed

### 🎮 Gameplay Testing
- **Hospital Free Roam**: Normal hospital experience, no tutorial interference
- **Dosimetry Challenge - Hard**: Jump to advanced physics questions
- **Max Resources**: Testing with unlimited insight/momentum/star points

### 💬 Dialogue Testing
- **Individual Mentor Dialogues**: Test specific mentor interactions
- **Mentor Gallery**: Overview of all mentor relationships
- **Dialogue Stress Test**: Rapidly cycle through dialogues for performance testing

### 🌌 Constellation Testing
- **Full Constellation**: All knowledge stars unlocked for testing connections
- **Night Phase Navigation**: Test observatory interface

### 🔥 Boss/Advanced Testing
- **Final Physics Exam**: End-game comprehensive challenge
- **Edge Case Testing**: Minimal state scenarios

### 🛠️ Custom Testing
- **State Manipulation**: Custom scenarios for specific testing needs
- **Performance Testing**: Stress test scenarios

## Quick Actions Panel

### 🏥 Scene Navigation
- **Jump to Hospital**: Return to main hospital interface
- **Jump to Night Phase**: Go directly to constellation view
- **Jump to Specific Rooms**: Test individual room experiences

### 🔓 Development Cheats
- **Unlock All Content**: Max out all resources for testing
- **Reset All Stores**: Clean slate for fresh testing
- **Complete Tutorial Steps**: Skip to specific tutorial points

### 💾 Save States (Coming Soon)
- **Quick Save/Load**: Bookmark specific game states
- **State Management**: Organize and name different test scenarios

## Advanced Usage

### Creating Custom Scenarios

Add new scenarios to the `GAME_SCENARIOS` array:

```typescript
{
  id: 'my_custom_test',
  name: 'Custom Test Scenario',
  description: 'Description of what this tests',
  category: 'custom',
  setup: () => {
    // Your custom setup code
    const tutorialStore = useTutorialStore.getState();
    const sceneStore = useSceneStore.getState();
    
    // Manipulate game state as needed
    tutorialStore.startTutorial('first_day', 'morning_arrival');
    sceneStore.setScene('hospital');
  },
  teardown: () => {
    // Optional cleanup code
  }
}
```

### Integration with Stores

The console directly accesses your Zustand stores:
- `useTutorialStore.getState()` - Tutorial progression
- `useSceneStore.getState()` - Scene navigation  
- `useDialogueStore.getState()` - Dialogue management
- `useGameStore.getState()` - Resources and game state

### Keyboard Shortcuts

- `F2` - Toggle console open/closed
- `ESC` - Close console
- Search functionality for finding specific scenarios

## Development Best Practices

### 🔄 Iterative Testing Workflow
1. **Identify Feature**: What specific part are you working on?
2. **Find Scenario**: Use the console to jump directly to that context
3. **Test Changes**: Make code changes and use console to quickly re-test
4. **Edge Case Testing**: Use custom scenarios to test boundary conditions

### 🚀 Performance Testing
- Use stress test scenarios to identify performance bottlenecks
- Test rapid state changes with dialogue cycling
- Monitor console logs for error patterns

### 🐛 Bug Reproduction
- Create custom scenarios that reproduce specific bugs
- Save problematic states for easier debugging
- Test fixes by jumping directly to bug scenarios

### 🎯 Feature Validation
- Test new features in isolation using targeted scenarios
- Validate tutorial changes without full tutorial playthrough
- Test dialogue systems with specific mentor combinations

## Industry Inspiration

This console follows patterns used by:
- **Unity Scene Manager** - Quick scene switching
- **Unreal Level Editor** - Runtime state manipulation  
- **Half-Life Developer Console** - Command-based testing
- **Professional Game Studios** - Scenario-based QA workflows

## Extending the Console

### Adding New Categories
1. Add category to the `GameScenario` type
2. Create scenarios in that category
3. Console will automatically group and display them

### Store Integration
The console can access any Zustand store in your app. Simply import the store and use `.getState()` to manipulate it in your scenarios.

### Custom UI Elements
Add new control panel sections by extending the console component with additional `ControlSection` components.

## Tips for Efficient Game Development

1. **Start Each Session**: Open console, jump to what you're working on
2. **Create Shortcuts**: Build custom scenarios for your specific use cases  
3. **Test Edge Cases**: Use the empty state and stress test scenarios regularly
4. **Share Scenarios**: Team members can add scenarios for their features
5. **Document Bugs**: Create scenarios that reproduce issues

---

*Press F2 and happy testing! 🎮* 