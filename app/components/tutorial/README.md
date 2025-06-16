# Tutorial System Documentation

## Overview

The Tutorial System provides guided onboarding for new players, introducing them to the game's complex medical physics systems through narrative-driven discovery. The system features 4 comprehensive tutorial sequences with 26 steps total, seamlessly integrated with the hospital interface and dialogue system.

## 🎯 Current Status: Phase 2 Complete

**Phase 1**: ✅ Tutorial infrastructure, overlays, and debug controls  
**Phase 2**: ✅ Tutorial dialogue integration and progression system  
**Phase 3**: 🎯 Next - Night phase tutorials and constellation guidance

## Components

### Core System Files

- **`app/store/tutorialStore.ts`** - Zustand state management with tutorial sequences
- **`app/components/tutorial/TutorialOverlay.tsx`** - Overlay system (5 types with animations)
- **`app/components/tutorial/TutorialControls.tsx`** - Debug panel and controls
- **`app/data/tutorialDialogues.ts`** - Tutorial-specific dialogue sequences

### Integration Points

- **Hospital Backdrop**: Smart room routing for tutorial vs. normal mode
- **Dialogue Store**: Tutorial step completion hooks in dialogue options
- **Game Container**: Overlay rendering and tutorial state management

## Tutorial Sequences

### 🌅 First Day Tutorial (8 steps)
**Goals**: Hospital orientation, mentor introductions, learning system introduction

1. **Morning Arrival** (`morning_arrival`)
   - Hospital entrance welcome
   - Visual tutorial system introduction

2. **First Mentor Introduction** (`first_mentor_intro`)
   - Meet Dr. Garcia in Physics Office
   - Hospital tour explanation
   - Room navigation guidance

3. **Hospital Tour** (`hospital_tour`)
   - Interactive room exploration
   - Activity type explanation
   - Learning opportunity introduction

4. **First Educational Activity** (`first_educational_activity`)
   - Guided educational challenge
   - Question engagement tutorial
   - Progress tracking introduction

5. **Insight Mechanic Introduction** (`insight_mechanic_intro`)
   - Insight point system explanation
   - Learning currency concept
   - Constellation preview

6. **Second Mentor Introduction** (`second_mentor_intro`)
   - Meet Dr. Quinn (lunch dialogue)
   - Treatment planning introduction
   - Learning tracking discussion

7. **Constellation Preview** (`constellation_preview`)
   - Knowledge visualization concept
   - Star Points explanation
   - Tonight's activities preview

8. **First Ability Introduction** (`first_ability_intro`)
   - Receive "Conceptual Mapping" ability
   - Journal system introduction
   - Card organization explanation

### 🌙 Night Phase Tutorial (6 steps)
**Goals**: Constellation exploration, journal management, ability organization

9. **Night Phase Transition** (`night_phase_transition`)
10. **Observatory Introduction** (`observatory_introduction`)
11. **Constellation Interface** (`constellation_interface`)
12. **Star Unlock Tutorial** (`star_unlock_tutorial`)
13. **Journal Card Placement** (`journal_card_placement`)
14. **Sleep Transition** (`sleep_transition`)

### 👥 Mentor Relationships Tutorial (6 steps)
**Goals**: Relationship building, mentor-specific guidance, social navigation

15. **Relationship Basics** (`relationship_basics`)
16. **Mentor Personalities** (`mentor_personalities`)
17. **Building Rapport** (`building_rapport`)
18. **Mentor Guidance** (`mentor_guidance`)
19. **Collaboration Benefits** (`collaboration_benefits`)
20. **Social Navigation** (`social_navigation`)

### ⚡ Advanced Systems Tutorial (6 steps)
**Goals**: Complex mechanics, optimization strategies, mastery development

21. **Advanced Mechanics** (`advanced_mechanics`)
22. **Optimization Strategies** (`optimization_strategies`)
23. **Pattern Recognition** (`pattern_recognition`)
24. **Knowledge Integration** (`knowledge_integration`)
25. **Mastery Development** (`mastery_development`)
26. **Tutorial Completion** (`tutorial_completion`)

## Phase 2 Features: Tutorial Dialogue Integration

### Smart Room Routing
When tutorial mode is active, room clicks check for tutorial-specific dialogues:

```typescript
// Physics Office → tutorial_physics_office_intro (Dr. Garcia introduction)
// Dosimetry Lab → tutorial_dosimetry_lab_intro (Dr. Kapoor introduction)  
// Any Room → tutorial_lunch_dialogue (Dr. Quinn lunch break)
```

### Tutorial Dialogue Progression
Tutorial dialogues include step completion hooks:

```typescript
{
  id: 'option_example',
  text: 'I understand the hospital layout.',
  nextNodeId: 'next_dialogue',
  tutorialStepCompletion: 'hospital_tour', // Advances tutorial automatically
  insightChange: 3,
  relationshipChange: 2
}
```

### Mentor-Specific Content
Each mentor has unique tutorial dialogue:

- **Dr. Garcia**: Clinical focus, treatment planning introduction
- **Dr. Quinn**: Innovation focus, constellation preview, ability introduction
- **Dr. Kapoor**: Precision focus, measurement science philosophy

## Tutorial Overlays

### 5 Overlay Types with Animations

1. **Tooltip** - Contextual help with pointing arrows
2. **Spotlight** - Highlights specific UI elements with dark overlay
3. **Modal** - Center-screen important information
4. **Guided Interaction** - Step-by-step click guidance
5. **Progress Indicator** - Visual progress tracking

### Animation System
- **Fade transitions** (300ms)
- **Slide animations** for modals
- **Pulse effects** for interactive elements
- **Spotlight animations** with smooth focus

## Tutorial Controls (Debug Panel)

### Quick Access Features
- **Tutorial mode toggle** - Enable/disable tutorial system
- **Sequence quick start** - Jump to any tutorial sequence
- **Step navigation** - Previous/next step controls
- **Progress tracking** - Real-time completion status
- **Overlay testing** - Test all 5 overlay types instantly

### Testing Tools
```typescript
// Quick start any sequence
startSequence('first_day')
startSequence('night_phase')
startSequence('mentor_relationships')

// Test specific overlays
showTestOverlay('tooltip')
showTestOverlay('spotlight')
showTestOverlay('modal')
```

## Implementation Usage

### 1. Start Tutorial Mode
```typescript
import { useTutorialNavigation } from '@/app/store/tutorialStore';

const { startFirstDayTutorial } = useTutorialNavigation();

// Click "🎓 Start Tutorial" button in hospital
startFirstDayTutorial();
```

### 2. Tutorial State Access
```typescript
import { useTutorialStore } from '@/app/store/tutorialStore';

const tutorialStore = useTutorialStore();
console.log('Tutorial active:', tutorialStore.isActive);
console.log('Current step:', tutorialStore.currentStep);
console.log('Progress:', tutorialStore.getSequenceProgress('first_day'));
```

### 3. Custom Tutorial Integration
```typescript
// Add tutorial step completion to any dialogue option
{
  id: 'my_option',
  text: 'I understand this concept.',
  nextNodeId: 'next_node',
  tutorialStepCompletion: 'my_custom_step', // Automatically advances tutorial
  insightChange: 5
}
```

## Testing the Tutorial System

### 1. Launch Tutorial Mode
1. Navigate to hospital interface
2. Click **"🎓 Start Tutorial"** button (bottom right)
3. Verify tutorial mode activation modal appears

### 2. First Day Tutorial Test
1. **Physics Office**: Click to meet Dr. Garcia
   - Should show tutorial-specific dialogue
   - Choose dialogue options to advance tutorial steps
   - Notice step completion feedback

2. **Any Room**: During `lunch_dialogue` step
   - Any room click triggers Dr. Quinn lunch dialogue
   - Tutorial progresses through constellation preview
   - Receive first ability card

3. **Dosimetry Lab**: Click to meet Dr. Kapoor
   - Tutorial-specific precision-focused dialogue
   - Completes third mentor introduction

### 3. Debug Panel Testing
1. Open **tutorial controls** (bottom left expanding panel)
2. Test **overlay types**: tooltip, spotlight, modal, guided interaction, progress
3. Use **step navigation**: previous/next buttons
4. Try **sequence quick start**: jump to different tutorial phases

### 4. Tutorial Progression Verification
- **Visual feedback**: Step completion modals
- **Progress tracking**: Real-time completion percentages
- **Smart routing**: Tutorial dialogues vs. normal dialogues
- **State persistence**: Tutorial progress saved between sessions

## Troubleshooting

### Issue: No tutorial content visible
**Solution**: Ensure tutorial mode is active via debug panel toggle

### Issue: Wrong dialogue type showing
**Solution**: Check tutorial store state - `tutorialStore.isActive` must be `true`

### Issue: Step not advancing
**Solution**: Verify dialogue options include `tutorialStepCompletion` property

### Issue: Overlays not appearing
**Solution**: Check `GameContainer` includes `<TutorialOverlay />` component

## Phase 3 Preview: Night Phase Integration

**Coming Next**:
- Constellation interaction tutorials
- Journal card placement guidance  
- Mentor phone call system
- Star unlock progression tutorials
- Sleep transition tutorials

The tutorial system provides a comprehensive, narrative-driven introduction to Rogue Resident's complex medical physics learning environment, ensuring new players feel confident and engaged from their first moments in the game. 