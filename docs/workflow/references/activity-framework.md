# Activity Framework

**Source**: `content/activity-framework.md`

# Activity Framework

The activity framework defines how educational content is structured into engaging, time-managed learning experiences. Activities serve as the bridge between individual educational challenges and meaningful skill development, creating a progression system that adapts to student growth while maintaining consistent engagement.

## Activity Design Philosophy

Activities in Rogue Resident are designed around **purposeful learning experiences** rather than arbitrary content delivery. Each activity has clear educational objectives, connects to the Knowledge Constellation, and provides meaningful progression toward professional competence.

The system emphasizes **contextual learning** - placing educational challenges within realistic professional scenarios that help students understand not just the "what" but the "why" and "when" of medical physics concepts.

## Dual Interface System for Professional Context

### Pokemon-Style Educational Transitions

The activity system now implements **Pokemon-style learning transitions** that transform educational content from "drive-by learning" into engaging medical simulations with clear mental preparation for learning:

1. **📖 Optional Narrative Setup** - Meet the "trainer" (mentor) if story context needed
2. **⚡ TRANSITION SCREEN** - Context-specific establishing animations with dramatic reveals
3. **🎯 Challenge Battle** - Focused 15-20 minute educational sequences
4. **🏆 Results & Integration** - Victory celebration and concept mastery

### Context-Specific Establishing Animations

**🏥 Patient Case Challenges:**
- **Visual**: Patient info card fades in center → slides to side panel (persistent context)
- **Context**: Photo, age, diagnosis, lesion details with dramatic zoom
- **Mentor Entry**: Brief contextual dialogue from attending physician
- **Challenge Feel**: Clinical simulation with persistent patient information

**⚙️ LINAC QA Challenges:**
- **Visual**: Equipment schematic fades in → 3D linac model rotation
- **Context**: Calibration status, error flags, daily QA readings
- **Mentor Entry**: Technical diagnostic scenarios
- **Challenge Feel**: Technical simulation with equipment context

**🧠 Treatment Planning Challenges:**
- **Visual**: CT scan slices fade in sequence → arrange in planning workspace
- **Context**: Anatomical overview, target volumes, dose distribution
- **Mentor Entry**: Planning optimization scenarios
- **Challenge Feel**: Strategic problem-solving simulation

### Dual Dialogue Modes

The system supports two distinct educational interfaces optimized for different content types:

#### **📝 Narrative Dialogue Mode**
- **Visual Novel Style**: Large character portrait (300px) on left, dialogue on right
- **Full-Screen Layout**: Immersive experience with gradient backgrounds
- **Character Integration**: High-res sprite integration with emotion states
- **Typewriter Effect**: Character-by-character text reveal with cursor animation
- **Use Case**: Story content, character development, plot progression

#### **💬 Challenge Dialogue Mode** 
- **Twitter-Style Feed**: Multi-panel message history with timestamps
- **Compact Portraits**: 64px character images for mentor messages
- **Real-Time Feedback**: Mentor reaction overlays (✓/✗/○) with bounce animations
- **Staggered Delivery**: Sequential question presentation for focused learning
- **Use Case**: Educational content with social mentor feedback

### Smart Routing System
- **Mode Detection**: Automatic routing based on content type
- **Backwards Compatibility**: Fallback to narrative mode for existing content
- **Story vs Educational**: Clear separation between narrative and learning content

## Isometric Hospital Exploration

### Hospital Backdrop System
The activity framework now integrates with a **beautiful isometric hospital** that serves as the primary navigation interface:

- **🏥 Immersive Scale**: Hospital takes up 80vh height and 98vw width for maximum impact
- **Room Detection**: Percentage-based coordinate system for precise room clicking
- **Hover Tooltips**: Room names and activity counts on mouse hover
- **Visual Feedback**: Golden highlights and borders for interactive areas
- **Activity Badges**: Count indicators for rooms with multiple activities

### Dual View System
- **🔄 Grid View**: Traditional activity grid for efficiency
- **🏥 Isometric View**: Beautiful hospital exploration for immersion
- **Smooth Transitions**: Animated switching between view modes
- **Context Appropriate**: Different container sizes for optimal viewing

## Activity Categories & Professional Development

### Clinical Activities
These activities focus on **patient-centered applications** of knowledge, emphasizing the practical application of physics concepts in treatment delivery. They help students understand how theoretical knowledge translates to patient care.

**Key Characteristic**: Integration of physics knowledge with clinical workflows and patient outcomes.
**Interface**: Patient case animations with persistent medical context panels

### Technical Activities  
Equipment-focused activities that develop **hands-on competence** with linear accelerators, dosimetry equipment, and quality assurance procedures. These activities bridge the gap between theoretical understanding and practical operation.

**Key Characteristic**: Emphasis on troubleshooting, precision, and understanding equipment behavior.
**Interface**: Equipment schematic reveals with 3D visualization

### Planning Activities
These activities develop **optimization thinking** and treatment design skills. Students learn to balance multiple competing factors while creating effective treatment plans.

**Key Characteristic**: Multi-constraint problem solving with clear clinical objectives.
**Interface**: CT scan workspace setup with planning tool simulation

### Didactic Activities
Foundation-building activities that focus on **conceptual development** through structured educational challenges. These activities ensure comprehensive coverage of theoretical knowledge.

**Key Characteristic**: Direct knowledge acquisition with immediate application opportunities.
**Interface**: Twitter-style educational messaging with mentor guidance

### Research Activities
**Discovery-oriented** activities that encourage exploration and connection-making. These activities help students develop the curiosity and investigation skills essential for professional growth.

**Key Characteristic**: Student-directed learning with emergent outcomes.
**Interface**: Literature access panels with reference material integration

### Social Activities
**Professional development** activities that build communication skills, teamwork abilities, and professional identity. These activities recognize that medical physics is fundamentally collaborative.

**Key Characteristic**: Interpersonal skill development within professional contexts.
**Interface**: Narrative dialogue mode for character development

## Professional Medical Simulation Design

### Hospital-Grade Visual Interface
The activity system now employs a **professional medical simulation** aesthetic that mirrors real medical software:

- **Medical Information Hierarchy**: Critical details prominently displayed
- **Color-Coded Sections**: Diagnosis, clinical notes, treatment context
- **Authentic Patient Profiles**: Real medical terminology and staging
- **Readable Typography**: Medical information clearly presented
- **Emotional Engagement**: Patient photos and human details create connection

### Seamless Educational Flow
The new flow transforms the educational experience:

**OLD**: Room Click → 2-3 questions → Complete (feels superficial)
**NEW**: Room Click → Context Animation → Substantial Challenge → Mastery

This creates the perfect "medical professional training" feeling - review patient/equipment info, brief context setup, then focused educational challenge.

## Progressive Autonomy System

The activity framework implements **progressive scheduling control** that gradually transitions students from guided learning to professional autonomy:

### Phase 1: Guided Learning
**Structured introduction** with clear expectations and limited choices. Students focus on fundamental concept acquisition while building confidence with the system.

### Phase 2: Applied Learning  
**Balanced guidance and choice** as students begin applying knowledge in more complex scenarios. The system provides more options while maintaining educational structure.

### Phase 3: Specialist Development
**Increased autonomy** with focus on domain specialization. Students have more control over their learning path while developing deeper expertise.

### Phase 4: Professional Autonomy
**Full scheduling control** that mirrors professional practice. Students manage their own learning priorities while maintaining educational progress.

## Adaptive Difficulty & Mastery Integration

Activities adapt to student mastery levels through **intelligent challenge scaling** (see mechanics in `activity-framework.yaml`). This ensures appropriate challenge without overwhelming students:

- **Low mastery**: Focus on knowledge acquisition with supportive hints
- **Moderate mastery**: Balanced application and synthesis challenges
- **High mastery**: Complex scenarios requiring deeper understanding  
- **Expert mastery**: Novel contexts testing knowledge transfer ability

## Seasonal Learning Themes

The framework implements **seasonal learning progression** that provides structure while allowing for individual pacing:

### Spring: Fundamentals
**Foundation building** across all domains with emphasis on basic concepts and mentor relationships. Progressive introduction of domains ensures manageable cognitive load.

### Summer: Clinical Introduction
**Patient-focused learning** that connects theoretical knowledge to clinical applications. Students begin understanding the practical implications of their knowledge.

### Fall: Integration & Specialization  
**Cross-domain connections** and **deep specialization** that prepare students for advanced practice. This season balances breadth and depth development.

### Winter: Professional Identity
**Synthesis and application** that mirrors professional practice. Students demonstrate comprehensive competence across integrated scenarios.

## Reward Philosophy

The reward system supports **intrinsic motivation** by connecting achievements to meaningful professional development:

- **Insight rewards** represent growing understanding and knowledge application ability
- **Star Point rewards** track concrete progress toward constellation mastery
- **Mastery rewards** provide immediate feedback on learning effectiveness
- **Discovery rewards** encourage exploration and connection-making
- **Relationship rewards** recognize the social nature of professional development

## Library Special System

The Library represents a unique space for **self-directed discovery** with special mechanics that encourage exploration:

**Discovery Mode** allows students to browse knowledge organically, finding connections they might not encounter in structured activities.

**Research Minigame** teaches literature review and cross-referencing skills essential for professional practice.

**Flexible Difficulty** respects student autonomy while providing appropriate challenge.

**Time Manipulation** recognizes that deep research often requires extended focus periods.

## Integration with Game Systems

Activities serve as the **primary interface** between students and other game systems:

- **Knowledge Constellation**: Activities directly contribute to star mastery and pattern formation
- **Mentor System**: Activities provide contexts for relationship development and guidance through dual dialogue modes
- **Application Cards**: Activity success influences card effectiveness and availability
- **Boss Encounters**: Activity-based mastery determines encounter readiness and options
- **Isometric Hospital**: Beautiful spatial navigation that makes the hospital feel like a real place
- **Professional Simulation**: Context-appropriate interfaces that prepare students for real practice

This integration ensures that daily learning activities contribute meaningfully to long-term educational goals while maintaining engaging moment-to-moment gameplay through beautiful, immersive interfaces that feel like professional medical software.

## Technical Implementation Excellence

### Single Component Architecture
- **Seamless Integration**: Animation logic integrated directly into educational interfaces
- **Zero Intermediate States**: No jarring component switching or loading screens
- **Pokemon Battle Experience**: True seamless transitions from context to challenge
- **Performance Optimized**: Smooth 7-second transition sequences with professional timing

### Future Expansion Framework
- **Context-Specific Templates**: Easy addition of new animation types for different domains
- **Modular Components**: Clean separation between animation, interface, and educational logic
- **Backwards Compatible**: Non-enhanced activities continue working normally
- **Scalable Design**: Framework supports complex multi-phase educational sequences 