# Rogue Resident Question System

This document provides an overview of the Rogue Resident Question System - a comprehensive system for generating, managing, and evaluating educational questions that integrate with the knowledge mastery system.

## System Overview

The question system allows players to demonstrate their knowledge through various question types, with adaptive difficulty based on the player's mastery level. Questions are integrated with gameplay challenges and directly impact the player's knowledge mastery in the constellation system.

### Key Features

- **Multiple Question Types**: Support for multiple choice, matching, procedural, and calculation questions
- **Content Banks**: Reusable content for generating question variations
- **Adaptive Difficulty**: Questions adapt based on player mastery level
- **Knowledge Integration**: Questions directly affect knowledge mastery
- **Challenge System**: Questions are integrated into gameplay challenges
- **Mastery Tracking**: System tracks player progress and performance

## Architecture

The question system is organized into the following modules:

### Core Components

1. **Type Definitions** (`app/types/questions.ts`)
   - Base interfaces for all question types
   - Type definitions for content banks
   - Type definitions for metadata

2. **Question Loader** (`app/core/questions/questionLoader.ts`)
   - Loads question data from JSON files
   - Validates question data
   - Processes procedural questions with bank data

3. **Question Manager** (`app/core/questions/questionManager.ts`)
   - Selects questions based on domain, star, and mastery
   - Implements adaptive difficulty selection
   - Prevents repetition of recent questions

4. **Question Generator** (`app/core/questions/questionGenerator.ts`)
   - Generates variations of questions with dynamic content
   - Generates calculation questions with random variables
   - Creates matching question variants from content banks

5. **Question Evaluator** (`app/core/questions/questionEvaluator.ts`)
   - Evaluates player answers for all question types
   - Calculates mastery gain based on question difficulty and correctness

### Integration Components

1. **Challenge Manager** (`app/core/activities/challengeManager.ts`)
   - Creates challenges from question sets
   - Manages challenge flow and progression
   - Integrates with gameplay activities

2. **Knowledge Integration** (`app/core/knowledge/knowledgeIntegration.ts`)
   - Updates knowledge mastery based on question answers
   - Forms connections between knowledge stars
   - Detects patterns for potential star discovery

### State Management

1. **Question Store** (`app/store/questionStore.ts`)
   - Manages current question state
   - Tracks question history
   - Handles challenge state and progression

### UI Components

1. **Multiple Choice Question** (`app/components/questions/MultipleChoiceQuestion.tsx`)
2. **Matching Question** (`app/components/questions/MatchingQuestion.tsx`)
3. **Procedural Question** (`app/components/questions/ProceduralQuestion.tsx`)
4. **Calculation Question** (`app/components/questions/CalculationQuestion.tsx`)
5. **Boast Question** (`app/components/questions/BoastQuestion.tsx`)
6. **Question Feedback** (`app/components/questions/QuestionFeedback.tsx`)

## Data Structure

Questions are stored in JSON files organized by domain and difficulty:

```
/data/questions/
  ├── dosimetry/
  │   ├── beginner.json
  │   ├── intermediate.json
  │   ├── advanced.json
  │   └── banks.json
  ├── linac-anatomy/
  │   ├── beginner.json
  │   ├── intermediate.json
  │   ├── advanced.json
  │   └── banks.json
  ├── radiation-therapy/
  │   ├── beginner.json
  │   ├── intermediate.json
  │   ├── advanced.json
  │   └── banks.json
  └── treatment-planning/
      ├── beginner.json
      ├── intermediate.json
      ├── advanced.json
      └── banks.json
```

Each domain includes:
- Question files organized by difficulty level
- A banks file containing reusable content for question generation

## Question Types

### Multiple Choice

Presents a question with multiple options where one or more options are correct.

```typescript
interface MultipleChoiceQuestion extends Question {
  type: QuestionType.MULTIPLE_CHOICE;
  question: string;
  options: MultipleChoiceOption[];
  followUp?: {
    question: string;
    options: MultipleChoiceOption[];
  };
}
```

### Matching

Asks players to match items from one column with their corresponding matches in another column.

```typescript
interface MatchingQuestion extends Question {
  type: QuestionType.MATCHING;
  bankRef: string;  // Reference to a matching bank
  includeItems: MatchingPair[];  // Which items to include from the bank
  difficulty: "beginner" | "intermediate" | "advanced";
}
```

### Procedural

Requires players to arrange steps in the correct order to complete a procedure.

```typescript
interface ProceduralQuestion extends Question {
  type: QuestionType.PROCEDURAL;
  bankRef: string;  // Reference to a procedural bank
  includeSteps: number[];  // Which steps to include from the bank
  difficulty: "beginner" | "intermediate" | "advanced";
}
```

### Calculation

Presents a problem requiring mathematical calculation with variables.

```typescript
interface CalculationQuestion extends Question {
  type: QuestionType.CALCULATION;
  question: string;
  variables: CalculationVariable[];
  solution: SolutionStep[];
  answer: {
    formula: string;
    precision: number;
  };
}
```

### Boast

A special meta-type that allows players to challenge themselves with higher difficulty questions for greater rewards.

## Challenge System

Challenges incorporate questions into gameplay:

- **Standard Challenges**: Normal sequence of questions
- **Boss Encounters**: Special sequences with mixed question types
- **Boast Challenges**: Risk/reward challenges where players select their difficulty
- **Discovery Challenges**: Special challenges that can lead to discovering new knowledge stars

## Usage Examples

### Loading and Displaying a Question

```tsx
import useQuestionStore from '../store/questionStore';
import MultipleChoiceQuestion from '../components/questions/MultipleChoiceQuestion';
import { KnowledgeDomain, QuestionType } from '../types';

const QuestionComponent = ({ starId }) => {
  const { 
    currentQuestion, 
    isLoading, 
    loadQuestion, 
    answerQuestion,
    isCorrect,
    showFeedback
  } = useQuestionStore();
  
  useEffect(() => {
    // Load a question for a specific star
    loadQuestion(KnowledgeDomain.RADIATION_THERAPY, starId);
  }, [starId]);
  
  if (isLoading) return <div>Loading question...</div>;
  if (!currentQuestion) return <div>No question available</div>;
  
  const handleAnswer = (answer) => {
    answerQuestion(answer);
  };
  
  // Render the appropriate question component based on type
  switch (currentQuestion.type) {
    case QuestionType.MULTIPLE_CHOICE:
      return (
        <MultipleChoiceQuestion
          question={currentQuestion}
          onAnswer={handleAnswer}
          showFeedback={showFeedback}
          isCorrect={isCorrect}
        />
      );
    // Handle other question types...
    default:
      return <div>Unknown question type</div>;
  }
};
```

### Creating a Challenge

```tsx
import useQuestionStore from '../store/questionStore';
import { ChallengeType, ChallengeDifficulty } from '../core/activities/challengeManager';
import { KnowledgeDomain } from '../types';

const ChallengeComponent = ({ starId }) => {
  const { 
    startChallenge, 
    currentChallenge,
    currentQuestion,
    answerChallengeQuestion,
    completeChallenge
  } = useQuestionStore();
  
  const handleStartChallenge = () => {
    startChallenge(
      ChallengeType.STANDARD,
      ChallengeDifficulty.BALANCED,
      KnowledgeDomain.DOSIMETRY,
      starId,
      5  // 5 questions
    );
  };
  
  // Render challenge UI...
};
```

## Best Practices

1. **Question Authoring**
   - Ensure all questions have appropriate feedback for both correct and incorrect answers
   - Use clear, concise language
   - Provide comprehensive explanations in feedback

2. **Content Organization**
   - Organize questions by domain and difficulty
   - Use content banks for reusable content
   - Tag questions with appropriate metadata

3. **Difficulty Balancing**
   - Create a good distribution of difficulty levels
   - Ensure beginner questions focus on foundational concepts
   - Advanced questions should test deeper understanding

## Future Enhancements

1. **Question Authoring Tool**: Create a UI for authoring and previewing questions
2. **Content Analytics**: Track question performance statistics
3. **More Question Types**: Add support for additional question types
4. **Multiplayer Challenges**: Support for competitive question challenges
5. **Question Sequences**: Create sequences of related questions that build on each other

## Related Documentation

- [Question System Implementation Checklist](./question-system-implementation-checklist.md)
- [Knowledge System Documentation](./knowledge-system.md)
- [Activity System Documentation](./activity-system.md) 