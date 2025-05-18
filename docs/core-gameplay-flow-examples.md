# ROGUE RESIDENT: CORE GAMEPLAY FLOW EXAMPLES

This document provides concrete examples of the improved gameplay flow to help visualize the implementation of the tutorial redesign and core loop improvements.

## 1. FIRST DAY TUTORIAL FLOW - CONCRETE EXAMPLES

### Morning Arrival Scene

```
[Hospital Entrance - 8:00 AM]

*You stand at the entrance of Westview Medical Center, your new home for the next year of residency. The modern glass building rises before you, sunlight glinting off its surface.*

Dr. Garcia: [approaches with a warm smile] "You must be our new resident! I'm Dr. Garcia, lead radiation oncologist. Welcome to Westview!"

[CHOICE 1] "Thank you, I'm excited to be here."
[CHOICE 2] "Nice to meet you. This place is impressive."

Dr. Garcia: "We have orientation starting in a bit. I can show you around, or if you prefer, you can explore a little on your own first. What would you like to do?"

[CHOICE 1] "I'd love a tour." [Follow Dr. Garcia]
[CHOICE 2] "I'll explore a bit first." [Explore Hospital Lobby]
```

*Note: This introduction establishes the setting and first mentor relationship without overwhelming with mechanics. The choices are simple but establish agency from the beginning.*

### First Educational Activity

```
[Orientation Room - 10:30 AM]

Dr. Garcia: "Let's cover some basics of radiation therapy. This will help you get your bearings in the department."

*Tutorial Popup: Your first educational activity! Answer questions to gain Insight and discover new knowledge.*

Dr. Garcia: "What's the primary purpose of a multileaf collimator in a linear accelerator?"

[CHOICE 1] "To shape the treatment beam"
[CHOICE 2] "To filter the beam energy"
[CHOICE 3] "To measure radiation output"

*Player selects correct answer*

Dr. Garcia: "Exactly right! The MLCs allow us to conform the radiation beam to the shape of the target volume."

*Tutorial Popup: You gained 15 Insight! [Icon shows Insight meter filling]*

Dr. Garcia: "You've just gained some Insight - think of it as your growing understanding that you can apply during your daily activities."
```

*Note: The first activity introduces a single mechanic (Insight) with explicit explanation tied to narrative. Momentum isn't introduced yet to avoid overwhelming the player.*

### Lunch Break Dialogue

```
[Hospital Cafeteria - 12:15 PM]

*You spot an open table and set your tray down. As you're about to take your first bite, someone sits across from you.*

Dr. Quinn: [energetically] "Mind if I join? You must be the new resident! I'm Dr. Quinn, head of Treatment Planning."

[CHOICE 1] "Nice to meet you, Dr. Quinn."
[CHOICE 2] "I've heard about your work in planning optimization."

Dr. Quinn: "Garcia's probably shown you the clinical side this morning. Planning is where the physics really shines! Have you heard about our Knowledge Constellation approach?"

[CHOICE 1] "No, what's that?"
[CHOICE 2] "Just briefly. I'd like to know more."

Dr. Quinn: "It's a way of visualizing how medical physics concepts connect. Rather than isolated facts, we see knowledge as stars forming constellations. You'll see what I mean tonight when you have time to reflect on what you've learned today."
```

*Note: This casual introduction to the Knowledge Constellation provides narrative context before the player encounters the actual mechanic, creating anticipation rather than confusion.*

### First Ability Introduction

```
[Treatment Planning Lab - 14:30 PM]

Dr. Quinn: "Before you go today, I want to give you something for your journal."

*Dr. Quinn hands you a page with detailed notes.*

Dr. Quinn: "I've written down a technique called 'Conceptual Mapping' that might help you in your daily work. When you get home tonight, add it to your journal, and you can use it tomorrow."

*Tutorial Popup: You received your first Ability Card! You'll be able to place this in your journal tonight.*

*[Card Display: "Conceptual Mapping" - Passive Effect: Highlight connections between questions and concepts. Active Effect: Spend 20 Insight to reveal a related concept during activities.]*

Dr. Quinn: "Tomorrow, when you're in an activity, you can activate this technique by spending some of your accumulated Insight. It's a way to apply what you've learned."
```

*Note: The first ability is introduced narratively with clear explanation of both when and how it will be used, connecting the day and night phases conceptually.*

### Night Phase Transition

```
[Hospital Exit - 17:15 PM]

*As you head toward the exit, Dr. Kapoor approaches, clipboard in hand.*

Dr. Kapoor: "First day complete! I'm Dr. Kapoor, head of Dosimetry. We'll be working together on measurements and quality assurance."

[Brief dialogue introducing their character]

Dr. Kapoor: "The most important part of learning is reflection. When you get home tonight, take some time to think about what you've discovered today. It helps solidify the concepts."

*Tutorial Popup: You're about to transition to your home at Hill House for the Night Phase, where you'll reflect on knowledge gained and prepare for tomorrow.*

[CONTINUE] "I'll do that. Goodnight, Dr. Kapoor."

*Scene transition to Hill Home*
```

*Note: The transition to Night Phase is handled through narrative rather than an abrupt game mode switch, creating continuity between the phases.*

## 2. REVISED CORE GAMEPLAY LOOP EXAMPLES

### Modified Day Structure Example

#### Morning Brief

```
[Your Office - 8:05 AM, Day 4]

*Your phone buzzes with a calendar notification*

[Phone Screen: "Linac QA session with Technician Jesse at 10:00. TPS review with Dr. Quinn at 14:00. Open slot remaining."]

*Dr. Garcia pokes her head in your door*

Dr. Garcia: "Morning! We've got a challenging case today - breast treatment with regional nodes. Perfect chance to use that dosimetric evaluation technique you've been studying."

*Ability Reminder: Your journal contains "Dose Distribution Analysis" which can help evaluate complex treatment plans.*

*Schedule Display: 3 activity blocks available today*
Block 1 (8:30-11:30): [Select Activity]
Block 2 (12:00-15:00): TPS Review with Dr. Quinn [Scheduled]
Block 3 (15:30-17:00): Linac QA with Technician Jesse [Scheduled]
```

*Note: This structure gives clear information about the day ahead while maintaining flexibility. The mentor interaction provides narrative context and reminds the player of their abilities.*

#### Activity Transition

```
[Treatment Planning Lab - 14:55 PM]

*You've completed the TPS Review activity with Dr. Quinn*

*Progress Summary:
- Gained 45 Insight
- Reached Momentum Level 3
- Discovered new concept: "Dose Volume Constraints"
- Improved relationship with Dr. Quinn (+1)*

Dr. Quinn: "Great work on optimizing that plan. Jesse mentioned needing your help with the monthly QA checks. You should head over to the Linac room."

*Time advances to 15:30*

[CHOICE 1] "Head to Linac Room now" [Begin next scheduled activity]
[CHOICE 2] "Take a short break first" [Short dialogue scene before next activity]
```

*Note: Activity transitions maintain narrative flow while clearly showing progress. Player agency is maintained while guiding toward the next scheduled activity.*

#### Day Conclusion

```
[Your Office - 17:10 PM]

*You've completed all scheduled activities for the day*

Dr. Kapoor: [stops by your office] "Heard you helped with the Linac QA. Finding your way around the equipment is crucial. How are you feeling about the dosimetry concepts so far?"

[CHOICE 1] "I'm starting to connect the principles to practical applications."
[CHOICE 2] "Still working on understanding some of the detector responses."
[CHOICE 3] "The calibration protocols make a lot of sense to me."

Dr. Kapoor: "That's normal at this stage. When you review tonight, pay attention to how the equipment QA connects to patient safety. It's all interrelated."

*Day Summary:
- Completed 3 activities
- Total Insight gained: 105
- New Knowledge: 2 concepts discovered
- SP earned: 4*

[CONTINUE] "Time to head home and reflect on today's learning."
```

*Note: The day conclusion provides a natural closure with mentor interaction and a clear summary of accomplishments, making the transition to night feel purposeful rather than mechanical.*

## 3. NIGHT PHASE REFINEMENTS

### Observatory Introduction (First Night)

```
[Hill Home Observatory - 19:30 PM, Day 1]

*You enter the small observatory room in your home. A large glass ceiling reveals the night sky, and a holographic display stands in the center of the room.*

*Your phone rings - it's Dr. Quinn*

Dr. Quinn: "Hope I'm not calling too late! Just wanted to check how your first day went. Have you had a chance to look at the Knowledge Constellation yet?"

[CHOICE 1] "I was just about to."
[CHOICE 2] "Not yet, could you remind me how it works?"

Dr. Quinn: "The constellation map should be right in front of you. Those glowing points? Each represents something you learned today."

*Tutorial Popup: This is your Knowledge Constellation. Stars represent medical physics concepts you've discovered.*

*[The display highlights three glowing points, color-coded to different domains]*

Dr. Quinn: "Try selecting one of those stars. That's knowledge you discovered today."

*[Player selects a star]*

Dr. Quinn: "That's a concept in the Radiation Therapy domain - you can tell by the green color. You've discovered it, but you haven't fully unlocked it yet."

*Tutorial Popup: Use Star Points (SP) to unlock stars you've discovered. You earned 3 SP today.*

Dr. Quinn: "Try using one of your Star Points to unlock it. Just focus on the star and commit the point."

*[Player unlocks star]*

*[Star animation: The star brightens and expands slightly]*

Dr. Quinn: "Perfect! As you learn more, you'll see how these concepts connect to form patterns. That's for another day though - don't want to overwhelm you on day one!"
```

*Note: The Observatory introduction is fully guided but tied to narrative, making the abstract Knowledge Constellation concept more approachable.*

### Journal System (First Night)

```
[Hill Home Study - 20:15 PM, Day 1]

*You enter your study, where a journal sits open on the desk.*

*Your phone buzzes with a text from Dr. Garcia: "Don't forget to check your journal before tomorrow! The technique I mentioned should help with your morning activities."*

*Tutorial Popup: This is your Journal. It holds the Abilities you can use during daily activities.*

*[Journal Display: Empty slots for cards, with one card available to place - "Conceptual Mapping"]*

*Tutorial Popup: Drag the Ability Card to an empty slot to equip it for tomorrow.*

*[Player places card in slot]*

*Tutorial Popup: This ability is now equipped for tomorrow. You can have up to 3 abilities equipped at once as you progress.*

*[Card Detail Display:
- "Conceptual Mapping"
- Passive Effect: Highlights connections between related questions
- Active Effect: Spend 20 Insight to reveal a related concept (once per day)
- Domain: Treatment Planning]*
```

*Note: The Journal introduction is simple and focused on a single card, making the mechanics clear while connecting back to the day's events.*

### Sleep Transition (Improved)

```
[Hill Home Bedroom - 21:30 PM, Day 1]

*You prepare for bed, feeling the weight of your first day as a resident.*

*Reflection Moment: "Your first day at Westview Medical has introduced you to the fundamentals of radiation therapy and treatment planning. Tomorrow will bring new challenges and opportunities to expand your knowledge."*

*Preparation Summary:
- Knowledge: 1 star unlocked (Radiation Beam Properties)
- Journal: 1 ability equipped (Conceptual Mapping)
- Tomorrow: Morning session with Dr. Kapoor scheduled*

[CHOICE 1] "Get some rest" [Advance to next day]
[CHOICE 2] "Review constellation one more time" [Return to Observatory]

*[After player chooses to sleep]*

*Save Prompt: Would you like to save your progress?*

*[Day transition animation: Stars slowly fade to morning light]*
```

*Note: The sleep transition provides a meaningful summary and clear context for the next day, while still giving players agency to review if desired.*

## 4. IMPLEMENTATION NOTES

These examples demonstrate several key improvements:

1. **Narrative Continuity** - All mechanics are introduced through character interactions
2. **Progressive Complexity** - Systems are introduced one at a time with clear tutorials
3. **Natural Transitions** - Day and night phases flow together through narrative bridges
4. **Contextual Learning** - Educational content is framed within a meaningful narrative
5. **Visual Feedback** - Clear UI elements show progress and accomplishments
6. **Flexible Structure** - Activity blocks provide structure while maintaining player agency

The redesigned flow preserves the educational depth and systems of Rogue Resident while making the experience more cohesive, approachable, and engaging.

For actual implementation, these examples would need to be integrated with:
- The existing question system
- The Knowledge Constellation visualization
- The time progression system
- The activity selection interface
- The night phase interaction systems 