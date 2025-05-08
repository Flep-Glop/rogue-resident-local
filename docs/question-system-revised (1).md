# ROGUE RESIDENT: QUESTION SYSTEM GUIDE

## 1. INTRODUCTION

This document provides a comprehensive overview of the Question System in Rogue Resident, which serves as the educational backbone of the game.

### 1.1 Purpose & Philosophy

- **Educational Integration**: Questions directly support the Knowledge Constellation system, reinforcing connections between concepts
- **Scalable Architecture**: System designed to grow from hundreds to thousands of questions
- **Procedural Generation**: Support for variable-based questions with multiple instances
- **Progressive Difficulty**: Clear difficulty progression aligned with player advancement
- **Efficient Content Creation**: Streamlined format for rapid question creation and management

## 2. QUESTION TYPES & FORMATS

### 2.1 Multiple Choice Questions

**Description**: Standard question format with several possible answers and one or more correct options.

**Key Components**:
- Question text with contextual framing
- 3-5 answer options
- Correct answer indication
- Educational feedback for both correct and incorrect responses
- Optional follow-up question for deeper exploration

**Example**:
> Dr. Quinn asks: "What defines a small field in radiation therapy dosimetry?"
> 
> Options:
> - Any field smaller than 10×10 cm²
> - A field where lateral charged particle equilibrium is compromised (correct)
> - Fields used only for SRS treatments
> 
> Feedback: "Yes! The physics—it's about charged particle equilibrium—fundamental to accurate dosimetry!"

### 2.2 Matching Questions

**Description**: Questions that require matching items from one category with their corresponding items from another category.

**Key Components**:
- Source set of items (concepts, components, etc.)
- Target set of items to match (definitions, functions, characteristics)
- Relationship mapping between items
- Educational feedback on connections

**Example**:
> Match each radiation detector with its primary characteristic:
> 
> **Items**:
> - Farmer-type ionization chamber
> - Diode detector
> - Radiochromic film
> - TLD/OSLD
> 
> **Matches**:
> - Standard detector for absolute dose measurements
> - Higher sensitivity but over-responds to low-energy photons
> - Excellent 2D spatial resolution
> - Small passive detectors for in-vivo measurements

### 2.3 Procedural Questions

**Description**: Questions that test understanding of sequential processes or workflows.

**Key Components**:
- Set of steps that must be ordered correctly
- Clear beginning and end points
- Educational explanations for each step
- Feedback on correct sequencing

**Example**:
> Arrange the following steps in the correct order for TG-51 photon beam calibration:
> 
> - Measure beam quality (PDD10/PDD20 or %dd(10)x)
> - Set up ionization chamber at reference depth
> - Take reference ionization reading
> - Apply temperature and pressure corrections
> - Apply beam quality conversion factor kQ
> - Calculate absorbed dose using chamber calibration factor

### 2.4 Calculation Questions

**Description**: Questions requiring mathematical calculations relevant to medical physics.

**Key Components**:
- Problem statement with context
- Variable values (either fixed or procedurally generated)
- Formula or approach to solution
- Step-by-step solution path
- Feedback explaining conceptual significance

**Example**:
> Dr. Kapoor presents a calculation: "Let's determine the temperature-pressure correction factor for an ionization chamber reading.
> 
> Given:
> - Temperature: 23°C
> - Pressure: 99.5 kPa
> - Reference temperature: 22°C
> - Reference pressure: 101.325 kPa
> 
> Calculate the temperature-pressure correction factor (PTP)."

### 2.5 Boast Questions (Advanced Challenge)

**Description**: High-risk, high-reward advanced challenges that replace standard questions when players choose to "boast" their knowledge.

**Key Components**:
- Advanced difficulty version of standard question
- More nuanced or complex scenario
- Higher educational reward for success
- Greater penalty for failure
- Mentor-voiced presentation

**Example**:
> Dr. Quinn's eyes light up with excitement: "Ah, confidence! Let's explore a more nuanced scenario. A patient has a tumor traversing the soft tissue-bone interface of the mandible with dental implants nearby. Describe the limitations of THREE different dose calculation algorithms for this case and rank them in order of accuracy."

## 3. CONTENT ORGANIZATION

### 3.1 Directory Structure

Questions are organized in a hierarchical structure:

```
/questions
  /domain-name
    /subtopic-name
      banks.json              # Banks specific to this subtopic
      beginner.json           # Beginner questions
      intermediate.json       # Intermediate questions  
      advanced.json           # Advanced questions
```

### 3.2 Content Banks

Banks are collections of reusable content that can be referenced by multiple questions:

**Matching Banks**: Collections of items and their corresponding matches
- Reusable across multiple matching questions
- Varied difficulty levels per match
- Domain-specific content

**Procedural Banks**: Collections of steps in processes or workflows
- Reusable across multiple procedural questions
- Step explanations included
- Can be sampled for different question difficulties

### 3.3 Domain-Specific Content

Each knowledge domain has specialized question content:

**Treatment Planning (Blue)**
- Focus: Algorithms, optimization, plan evaluation
- Primary Question Types: Calculation, Matching
- Clinical Context: Treatment planning scenarios

**Radiation Therapy (Green)**
- Focus: Clinical applications, radiobiology, fractionation
- Primary Question Types: Multiple Choice, Case Analysis
- Clinical Context: Patient treatment scenarios

**Linac Anatomy (Amber)**
- Focus: Equipment components, beam generation, safety systems
- Primary Question Types: Procedural, Matching
- Clinical Context: Machine operation scenarios

**Dosimetry (Pink)**
- Focus: Calibration, measurement, quality assurance
- Primary Question Types: Calculation, Procedural
- Clinical Context: Measurement and validation scenarios

## 4. DIFFICULTY PROGRESSION

### 4.1 Difficulty Levels

Questions are categorized into three difficulty levels:

**Beginner (Level 1)**
- Focus on definitions, basic concepts, and foundational knowledge
- Clear, straightforward questions with obvious correct answers
- Limited variables and simple calculations
- Direct matches between concepts

**Intermediate (Level 2)**
- Application of concepts in simple clinical contexts
- Questions requiring synthesis of multiple concepts
- Moderate calculations with multiple steps
- Less obvious connections between concepts

**Advanced (Level 3)**
- Complex clinical scenarios requiring integration of multiple domains
- Critical analysis and evaluation of approaches
- Sophisticated calculations with multiple variables
- Nuanced distinctions between similar concepts

### 4.2 Mastery-Based Challenge Selection

Question difficulty adapts to player mastery level:

| Mastery Range | Difficulty Distribution |
|---------------|-------------------------|
| 0-25% | 70% Beginner, 30% Intermediate, 0% Advanced |
| 25-50% | 30% Beginner, 50% Intermediate, 20% Advanced |
| 50-75% | 10% Beginner, 50% Intermediate, 40% Advanced |
| 75-100% | 0% Beginner, 30% Intermediate, 70% Advanced |

## 5. QUESTION CREATION GUIDELINES

### 5.1 General Principles

- **Clarity**: Questions should be concise and unambiguous
- **Educational Value**: Each question should reinforce a specific concept
- **Difficulty Progression**: Clear distinction between beginner, intermediate, and advanced
- **Mentor Voice**: Question text should reflect the personality of the assigned mentor
- **Knowledge Connection**: Questions should connect to specific constellation nodes

### 5.2 Writing Effective Distractors (Wrong Answers)

- Use common misconceptions as distractors
- Ensure distractors are plausible but clearly incorrect
- Maintain consistent length and style between correct and incorrect options
- Avoid obvious patterns that could give away the answer
- Use parallel grammatical structure for all options

### 5.3 Educational Feedback Design

- **Correct Answer Feedback**:
  - Reinforce why the answer is correct
  - Add contextual information for deeper understanding
  - Connect to related concepts when possible

- **Incorrect Answer Feedback**:
  - Address common misconceptions
  - Guide toward correct understanding
  - Avoid negative or discouraging language

### 5.4 Mentor Voice Integration

Questions are presented in the voice of domain-specific mentors:

- **Dr. Kapoor (Dosimetry)**: Precise, methodical language, emphasis on accuracy
- **Dr. Garcia (Radiation Therapy)**: Warm, patient-centered, clinically contextualized
- **Dr. Jesse (Linac Anatomy)**: Practical, hands-on language, equipment-focused
- **Dr. Quinn (Treatment Planning)**: Conceptual, explores unexpected connections

## 6. QUESTION INTEGRATION IN GAMEPLAY

### 6.1 Activity Challenges

- Format: Main gameplay loop during Day Phase
- Structure: 3-10 questions per activity
- Selection: Based on activity domain and player mastery
- Progression: Performance affects Momentum and Insight

### 6.2 Boss Encounter Challenges

- Format: Critical tests during boss phases
- Structure: Specialized challenge sequences
- Selection: Tailored to boss theme and mechanics
- Progression: Performance determines boss outcome

### 6.3 Boast Mechanic

- Format: High-risk, high-reward optional challenges
- Structure: Single difficult question replacing standard challenge
- Selection: Advanced version of current challenge
- Progression: Success/failure affects Momentum and relationships

### 6.4 Study Activities

- Format: Self-directed knowledge exploration
- Structure: Focused question sets on specific topics
- Selection: Player-chosen focus areas
- Progression: Direct mastery gain for related stars

## 7. MASTERY IMPACT

### 7.1 Star Mastery Gains

Questions directly impact the Knowledge Constellation:

- **Question Success**: Increases mastery of related stars (1-8% depending on difficulty)
- **Connected Stars**: Secondary mastery gains for connected stars
- **Question Difficulty**: Higher difficulty questions provide greater mastery gains
- **Build Variations**: Different builds can enhance mastery gains

### 7.2 Connection Formation

Questions help form connections between stars:

- **Connection Questions**: Special questions that strengthen connections
- **Cross-Domain Integration**: Questions that connect concepts across domains
- **Pattern Recognition**: Questions that help identify potential patterns
- **Discovery Mechanics**: Questions that can lead to new star glimpses

## 8. ACCESSIBILITY & PRESENTATION

### 8.1 Visual Presentation Standards

- Clear question text with appropriate emphasis
- Distinct visual styles for different question types
- Mentor portrait and voicing to establish context
- Progress indicators for multi-part questions
- Feedback visualization for correct/incorrect answers

### 8.2 Accessibility Features

- Text scaling for visual accessibility
- High contrast mode options
- Screen reader compatibility
- Alternative input methods
- Clear success/failure indicators
- Step reduction for complex questions

## 9. QUALITY ASSURANCE

### 9.1 Validation Checks

- Verify all question IDs are unique
- Ensure all referenced banks exist
- Check that all questions have required elements
- Validate variable ranges in calculation questions
- Verify that each question has both correct and incorrect feedback

### 9.2 Educational Review Process

- Content expert review for technical accuracy
- Educational design review for pedagogical effectiveness
- Playtest review for engagement and difficulty balance
- Iterate based on feedback from each review stage

### 9.3 Feedback Integration

- Implement telemetry to track question performance
- Collect player feedback on question quality
- Monitor success rates to identify too-easy or too-difficult questions
- Use data to refine questions and inform new content creation

## 10. CONTENT REQUIREMENTS

Each star in the Knowledge Constellation requires a minimum number of questions for adequate coverage:

### 10.1 Question Quantity Requirements per Star
| Star Type | Multiple Choice | Matching | Procedural | Calculation | Total |
|-----------|----------------|----------|------------|-------------|-------|
| Core | 30 | 20 | 15 | 10 | 75 |
| Standard | 20 | 15 | 10 | 10 | 55 |
| Advanced | 15 | 15 | 15 | 15 | 60 |

### 10.2 Difficulty Distribution Requirements
| Star Type | Beginner | Intermediate | Advanced | Total |
|-----------|----------|--------------|----------|-------|
| Core | 30 | 30 | 15 | 75 |
| Standard | 15 | 25 | 15 | 55 |
| Advanced | 10 | 20 | 30 | 60 |
