# ROGUE RESIDENT: TUTORIAL FLOW REDESIGN AND CORE GAMEPLAY LOOP IMPROVEMENTS

## DOCUMENT PURPOSE

This document outlines a redesigned first-day tutorial experience and improved gameplay flow for Rogue Resident, addressing the current choppy progression while preserving the educational and narrative depth of the game.

## CURRENT ISSUES

From reviewing the codebase and documentation, the current game flow suffers from:

1. **Information Overload** - Upfront dump of mechanics and information
2. **Uneven Pacing** - Trivia-based activity followed by an abrupt transition to Night Phase
3. **Disconnected Progression** - Choppy flow between game phases
4. **Limited Context** - Players lack narrative framing for mechanics
5. **Immediate Complexity** - All systems introduced at once rather than progressively

## HIGH-YIELD IMPROVEMENTS

### 1. PROGRESSIVE TUTORIAL DAY DESIGN

#### 1.1 First Day Structure: "Welcome to Westview Medical"

**Morning (8:00 - 10:00)**
- **Arrival Scene**: Meet Dr. Garcia in the lobby
  - Narrative introduction to the hospital and residency program
  - First choice: Accept Dr. Garcia's invitation to orientation or explore independently
  - Light dialogue with minimal mechanics explanation

**Morning Session (10:00 - 12:00)**
- **Orientation Room**: Introduction to core concepts with Dr. Garcia
  - First simple multiple-choice questions (no need to explain momentum yet)
  - Introduction to first domain (Radiation Therapy) with Dr. Garcia
  - Introduction to the hospital map through Dr. Garcia's tour
  - First acquisition of Insight (shown with UI highlight)

**Lunch Break (12:00 - 13:00)**
- **Cafeteria Scene**: Meet Dr. Quinn informally
  - Casual dialogue introducing character personality
  - First reference to Knowledge Constellation (Dr. Quinn's specialty)
  - Optional extra dialogue providing deeper narrative context

**Afternoon Session (13:00 - 15:00)**
- **Treatment Planning Lab**: Hands-on introduction with Dr. Quinn
  - Introduction to second domain (Treatment Planning)
  - First demonstration of momentum system (explicitly tutorialized)
  - Introduction to Ability selection through Dr. Quinn giving you your first notebook page
  - First use of a simple Ability (integrated into the tutorial dialogue)

**Late Afternoon (15:00 - 17:00)**
- **Linac Room**: Technical introduction with Technician Jesse
  - Introduction to third domain (Linac Anatomy)
  - First challenging question sequence (3+ questions with momentum building)
  - Introduction to equipment-related content
  - First significant Insight reward showing accumulation

**Evening Transition**
- **Hospital Exit Scene**: Conversation with Dr. Kapoor
  - Brief introduction to fourth domain (Dosimetry)
  - Dr. Kapoor mentions the importance of reflection at night
  - Natural narrative transition to Night Phase

#### 1.2 First Night Structure: "Your First Night at Hill Home"

**Observatory Introduction (Progressive)**
- Dr. Quinn calls to check in and guide you through the Observatory
- Step-by-step introduction to Knowledge Constellation:
  1. First, simply observe your first stars (already discovered from the day's activities)
  2. Learn to unlock a star with earned Star Points
  3. Introduction to domains and their color-coding
  4. Brief reference to connections (to be expanded on day 2)

**Journal Introduction (Progressive)**
- Dr. Garcia texts about checking your journal
- Simple introduction to the Applications system:
  1. View your first acquired ability card
  2. Place it in your journal slot
  3. Brief explanation of its effect for tomorrow

**Sleep Transition**
- Short reflection moment before sleeping
- Simple narrative text transitioning to day 2
- Optional save prompt

### 2. CORE GAMEPLAY LOOP IMPROVEMENTS

#### 2.1 Progressive Day Structure

Replace the current rigid structure with a more natural progression:

**Morning Brief (8:00)**
- Quick check-in with a mentor (rotates daily)
- Daily focus/theme introduced
- Review of journal abilities for the day (already selected the previous night)
- Introduction of any new mechanics for that day

**Flexible Activity Blocks (8:30 - 17:00)**
- Three major activity blocks rather than fixed hourly segments
- Each block represents a meaningful chunk of time (2-3 hours)
- Player chooses location/activity for each block
- Activities flow naturally with appropriate transitions
- Time advances based on activity completion, not fixed increments

**Day Conclusion (17:00)**
- Brief reflection dialogue with mentor or colleague
- Natural transition to returning home
- Summary of daily accomplishments

#### 2.2 Narrative Integration

Integrate narrative elements throughout gameplay rather than separating "story" and "mechanics":

- **Mentor Relationships**: Mentors should appear throughout the day, not just in fixed activities
- **Progressive Dialogue**: Conversations should reflect your growing expertise and previous choices
- **Environmental Storytelling**: Hospital location descriptions should change based on progress
- **Patient Stories**: Recurring patients with ongoing cases that span multiple days
- **Contextual Learning**: Educational content framed within practical scenarios

#### 2.3 Streamlined Night Phase

Reorganize the Night Phase to feel like a natural extension of the day:

**Knowledge Reflection (Observatory)**
- Visual indication of newly discovered stars
- Clear UI showing progression from the day
- Streamlined star unlocking process
- Progressive introduction of connection mechanics (initially simplified)

**Application Planning (Journal)**
- Highlight new cards acquired during the day
- Clearer relationship between stars and available cards
- Contextual recommendations based on upcoming schedule
- Preview of effects to expect the next day

**Transition to New Day**
- Brief narrative text or dream sequence
- Optional save prompt
- Smooth transition to morning brief

## 3. IMPLEMENTATION PRIORITIES

### 3.1 Immediate Technical Focus Areas

1. **Time System Refinement**
   - Revise day progression to support flexible activity blocks
   - Implement narrative-driven transitions between activities
   - Create smoother day-to-night transitions

2. **Tutorial Sequence Implementation**
   - Build specialized first-day content with progressive mechanics introduction
   - Create guided UI for first-time Observatory and Journal interactions
   - Implement mentor-guided tutorial dialogue

3. **UI Improvements**
   - Create clearer visual indicators for progression
   - Implement contextual help system for mechanics
   - Redesign activity selection interface for better flow

### 3.2 Content Development Priorities

1. **Tutorial Day Script**
   - Write dialogue for each mentor introduction
   - Create specialized first-day questions that introduce concepts gradually
   - Develop narrative transitions between locations

2. **Progressive Mechanics Introduction**
   - Design simplified versions of core systems for day 1
   - Create visual aids explaining each mechanic as it's introduced
   - Develop contextual help tooltips for new players

3. **Streamlined Night Interface**
   - Design first-night Observatory experience
   - Create guided Journal introduction
   - Develop narrative elements for day-to-night transition

## 4. LONG-TERM VISION

This redesign serves as the foundation for a more cohesive gameplay experience by:

1. **Building Player Confidence** - Gradually introducing complex systems
2. **Establishing Narrative Investment** - Creating compelling character relationships early
3. **Demonstrating Value** - Showing how game mechanics support learning
4. **Creating Flow** - Eliminating jarring transitions between phases
5. **Enabling Mastery** - Providing a clear path from beginner to expert

The tutorial day serves not just as an introduction to mechanics, but as a microcosm of the entire game experience, setting expectations and building excitement for the journey ahead.

## 5. NEXT STEPS

1. Review this proposal with the development team
2. Create a detailed implementation timeline
3. Develop prototype of the tutorial day flow
4. Test with new players for feedback
5. Iterate based on player experience
6. Expand improvements to the broader game structure 