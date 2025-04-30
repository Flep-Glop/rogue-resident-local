# Rogue Resident Development Prompt Templates

## 1. Feature Implementation Prompt

```
I need to implement [SPECIFIC FEATURE] for Rogue Resident.

Reference documentation:
- GDD section: [SECTION NUMBER/NAME, e.g., "1.2 Core Game Loop - Day Phase"]
- Architecture guide reference: [RELEVANT SECTION, e.g., "Domain-Specific Implementations"]

Current implementation status:
[BRIEFLY DESCRIBE WHAT'S ALREADY IMPLEMENTED OR ATTEMPTED]

Specific questions:
1. [YOUR QUESTION]
2. [YOUR QUESTION]

Would you please provide:
- A specific implementation approach
- Key considerations from the architecture guides
- Sample code for the core functionality
```

## 2. Architectural Decision Prompt

```
I need guidance on an architectural decision for [SPECIFIC SYSTEM] in Rogue Resident.

Options I'm considering:
1. [OPTION 1]
2. [OPTION 2]

Relevant documentation references:
- From architecture-patterns.md: [RELEVANT PATTERN, e.g., "Hybrid Rendering Architecture"]
- From architecture-guide.md: [RELEVANT SECTION, e.g., "Store Pattern with Zustand"]

Key constraints or requirements:
[LIST ANY CONSTRAINTS]

Please analyze the options considering the architectural patterns in our documentation and recommend the best approach with justification.
```

## 3. Code Implementation Prompt

```
I need to implement a [COMPONENT/SYSTEM] for Rogue Resident's [FEATURE].

Context:
- Purpose: [WHAT THIS CODE WILL DO]
- Related components: [OTHER COMPONENTS IT INTERACTS WITH]
- Store/state dependencies: [WHAT STATE IT NEEDS ACCESS TO]

Architecture patterns to follow:
[LIST SPECIFIC PATTERNS FROM DOCUMENTATION]

Please provide:
1. TypeScript code for the [COMPONENT/SYSTEM]
2. Brief explanation of how it implements the architectural patterns
3. Any recommendations for testing or edge cases to consider
```

## 4. Debugging Assistance Prompt

```
I'm debugging an issue with [COMPONENT/FEATURE] in Rogue Resident.

Symptoms:
[DESCRIBE WHAT'S HAPPENING]

Expected behavior:
[DESCRIBE WHAT SHOULD HAPPEN]

Code snippet with issue:
```typescript
[YOUR CODE HERE]
```

Relevant architectural context:
[REFERENCE TO RELEVANT SECTIONS IN DOCS]

Please help analyze what might be causing this issue and suggest fixes that align with our architectural patterns.
```

## 5. Game Design Clarification Prompt

```
I need to clarify or extend a game design aspect for Rogue Resident.

Feature in question: [FEATURE NAME]
GDD reference: [SECTION NUMBER/NAME]

Current understanding:
[DESCRIBE YOUR CURRENT UNDERSTANDING]

Questions or extensions needed:
1. [QUESTION/EXTENSION]
2. [QUESTION/EXTENSION]

Please provide clarification that maintains consistency with the overall design philosophy and progression systems outlined in the GDD.
```

## 6. Time System Implementation Prompt

```
I need help implementing an aspect of the Time-Based System for Rogue Resident.

Specific focus: [TIME FEATURE, e.g., "Activity scheduling", "Time advancement"]
GDD reference: Section 1.2 - Core Game Loop (Day Phase)

Architectural considerations:
- Need to follow the Chamber Pattern (architecture-patterns.md)
- Need to maintain the Event-Driven Architecture (architecture-guide.md)

Current implementation status:
[DESCRIBE CURRENT STATUS]

Please provide:
1. Implementation approach that aligns with our architecture
2. Sample TypeScript code for core functionality
3. Recommendations for integration with other systems
```

## 7. Knowledge Constellation Enhancement Prompt

```
I need help enhancing the Knowledge Constellation system for Rogue Resident.

Specific enhancement: [CONSTELLATION FEATURE]
GDD reference: Section 1.5 - Knowledge Constellation System

Technical approach from architecture documents:
[REFERENCE RELEVANT TECHNIQUES]

Questions:
1. [YOUR QUESTION]
2. [YOUR QUESTION]

Please provide guidance that maintains consistency with both the visual design and technical implementation patterns documented.
```

## 8. Store Implementation Prompt

```
I need help implementing or modifying a store for Rogue Resident.

Store: [STORE NAME, e.g., "timeStore", "activityStore"]
Purpose: [WHAT THIS STORE MANAGES]

Architecture references:
- From architecture-guide.md: Section 2 - "Store Pattern with Zustand"

Current implementation or requirements:
[DESCRIBE CURRENT STATUS OR REQUIREMENTS]

Please provide:
1. TypeScript code for the store implementation
2. Examples of key actions/methods
3. Integration with the event system
4. Recommended selectors and primitive value extraction
```

## 9. Integration Testing Prompt

```
I need to test the integration between [SYSTEM A] and [SYSTEM B] in Rogue Resident.

Systems involved:
- System A purpose: [DESCRIBE]
- System B purpose: [DESCRIBE]
- Communication mechanism: [EVENTS/DIRECT CALLS/STORE UPDATES]

Current testing approach:
[DESCRIBE CURRENT TESTING, IF ANY]

Please provide:
1. A testing strategy that focuses on integration points
2. Sample test cases with expected outcomes
3. Potential edge cases or failure scenarios to consider
```

## 10. Performance Optimization Prompt

```
I need to optimize the performance of [COMPONENT/SYSTEM] in Rogue Resident.

Current implementation:
```typescript
[CURRENT CODE OR DESCRIPTION]
```

Performance issues observed:
[DESCRIBE ISSUES]

Architecture reference:
- From architecture-patterns.md: Section 3 - "Chamber Pattern for Performance"

Please provide:
1. Analysis of potential performance bottlenecks
2. Optimization suggestions following our architecture patterns
3. Refactored code example with improvements
```

## Usage Guidelines

- Be specific about what you're working on to get targeted assistance
- Always reference relevant sections from the documentation
- Include your current implementation or understanding
- When asking for code, describe how it integrates with related systems
- For design questions, ensure they align with the core design pillars
