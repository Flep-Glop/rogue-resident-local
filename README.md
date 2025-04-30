# Rogue Resident

**Tagline:** "The mind is not a vessel to be filled, but a constellation to be illuminated."

## Overview

Rogue Resident is an educational roguelike game built with React (Next.js) and Zustand. It transforms medical physics education into an immersive hospital simulation where players navigate their residency through time-based decision making while developing expertise visualized as a growing constellation of interconnected knowledge.

The game features:
* **Time-Based Gameplay:** A Day Phase structured around authentic hospital rhythms with contextual decision-making within time blocks.
* **Knowledge Constellation:** A visual representation of the player's expertise, developed during the reflective Night Phase.
* **Progressive Control:** Player agency increases as their knowledge and relationships grow, mirroring the journey from novice to expert.
* **Seasonal Progression:** A narrative structure following the player through a year-long residency (Spring, Summer, Fall, Winter) and potentially into a faculty role.
* **Narrative Integration:** Deeply woven narrative context featuring mentor characters and the mysterious Ionix device.

## Current Status & Branching Strategy

**This project is currently undergoing a major refactor to align with the Unified Game Design Document v5.0.**

* **`main` / `develop` / `v5.0-time-based` Branch (Current Development):** This branch contains the active development effort focused on implementing the time-based simulation core loop and features outlined in GDD v5.0. The codebase here is being built fresh or by selectively porting *adapted* code from the previous implementation.
* **`v3.0-reference` Branch (Legacy):** This branch contains the previous implementation based on GDD v3.0, which used a node-based map navigation system for the Day Phase. **DO NOT DEVELOP ON THIS BRANCH.** It serves purely as a reference for potentially reusable logic, data structures, or UI components that need to be *consciously adapted* for the v5.0 architecture.

**Developers working on the current (`v5.0-time-based`) branch should consult the `v3.0-reference` branch only when looking for specific pieces of logic or assets to adapt, as outlined in the migration strategy.**

## Tech Stack

* **Framework:** Next.js
* **Language:** TypeScript
* **State Management:** Zustand
* **Styling:** Tailwind CSS
* **UI/Animation:** React, potentially D3.js for visualizations (Constellation), Framer Motion or CSS transitions.

## Project Structure Highlights

```
.
├── app/ # Next.js App Router directory
│ ├── components/ # Reusable React components (UI, gameplay, features)
│ ├── core/ # Core game logic (state machines, event bus, systems)
│ ├── data/ # Game data (concepts, characters, dialogues)
│ ├── hooks/ # Custom React hooks
│ ├── store/ # Zustand state stores (game, knowledge, resources, journal)
│ ├── styles/ # Global styles
│ ├── types/ # TypeScript type definitions
│ ├── utils/ # Utility functions
│ └── (pages/routes)... # Specific page/route components
├── docs/ # Design documents (GDDs, guides)
├── public/ # Static assets
├── tests/ # Test files (integration, unit)
├── ... # Config files (tsconfig, next.config, tailwind.config, etc.)
```

## Getting Started

1.  **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd rogue-resident
   ```
   *Ensure you are on the main development branch (`main`, `develop`, or `v5.0-time-based`).*

2.  **Install dependencies:**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3.  **Run the development server:**
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

4.  Open [http://localhost:3000](http://localhost:3000) (or your configured port) in your browser.

## Design Documents

The primary design document for the current implementation is:

* **Unified GDD v5.0:** Located at `docs/rogue-resident-unified-gdd.md`

The previous design document (for the `v3.0-reference` branch) is:

* **Consolidated GDD v3.0:** Located at `docs/Rogue Resident - Consolidated GDD (v3.0).txt`

## Development Notes

* Focus development efforts on implementing features according to **GDD v5.0**.
* When needing functionality that existed in the v3.0 implementation, consult the `v3.0-reference` branch. **Carefully adapt and integrate** the required logic or components into the v5.0 architecture; do not simply copy/paste or merge across branches.
* Utilize the Zustand stores for state management and the central event bus (`app/core/events/`) for cross-system communication where appropriate.
* Keep components modular and reusable.
* Write tests for core logic and components.

# Rogue Resident Refactoring Guide

## Analysis of Core Game Design Change

### GDD v3.0 Core: 
Node-based map navigation for the Day Phase. Player chooses paths and nodes representing activities.

### GDD v5.0 Core: 
Time-based simulation for the Day Phase. Player makes choices within fixed time blocks from contextually available activities. Introduces seasonal progression and a Progressive Control system where player agency increases over time.

### Fundamental Change: 
The way the player interacts with the hospital environment and progresses through the Day Phase is fundamentally different. This isn't just adding features; it's changing the core interaction model.

### Existing Codebase: 
A substantial React/Zustand application built around the v3.0 concepts (map components likely exist, state management reflects node progression, etc.).

## Evaluating the Approaches

### Gradual Migration (High Risk):
**Challenge:** Trying to refactor the existing node-based Day Phase logic into the new time-based system piece by piece is likely to be incredibly complex and error-prone. You'd be fighting the old architecture constantly. Core loop changes are notoriously difficult to migrate incrementally.

**Outcome:** High risk of ending up with a messy, fragile codebase that's hard to debug and maintain. Integrating the new Progressive Control system onto the old foundation would be particularly difficult. I strongly advise against this.

### Start Fresh (Clean but Potentially Wasteful):
**Challenge:** Discards all previous implementation effort, requiring rebuilding everything from the ground up according to GDD v5.0.

**Outcome:** Ensures a clean architecture perfectly aligned with the new design, but potentially time-consuming and demoralizing if significant work from v3.0 has to be completely abandoned.

### Stripped-Down / Targeted Rebuild (Recommended Hybrid):
**Concept:** Acknowledge that the core Day Phase loop needs to be rebuilt, but strategically reuse existing assets and systems that are not fundamentally tied to the old node-based navigation.

## Process:

1. **Isolate the Core Change:** Identify the systems directly implementing the v3.0 Day Phase node navigation. Plan to replace these entirely.

2. **Build the New Core First:** Start by implementing the new GDD v5.0 time-based Day Phase simulation (Time Manager, Schedule System, Activity Selection UI). Get this foundation working cleanly.

3. **Identify Reusable Assets:** Go through your existing codebase:
   - **Data:** app/data/ (concepts, characters) is likely reusable.
   - **State Management Structure:** The Zustand stores (app/store/) and event bus (app/core/events/) structure can likely be kept, though the content and logic within them will need significant updates.
   - **Knowledge Constellation:** The rendering (app/components/knowledge/ConstellationView.tsx?) and core data logic (app/store/knowledgeStore.ts) might be largely reusable, but its interaction with the Day Phase and the effects (Night->Day influence) need to be updated per GDD v5.0.
   - **UI Primitives/Components:** Generic UI (app/components/ui/), portraits (CharacterPortrait.tsx), Journal UI (app/components/journal/) might be reusable or require only minor adaptation.
   - **Backend/Utils:** Things like the pixelation API (app/api/pixelate/) or utility functions (app/core/utils/) are probably fine.

4. **Integrate & Adapt:** Connect the reusable systems to your new time-based Day Phase core. Adapt their logic where necessary to fit the GDD v5.0 mechanics (e.g., how activities grant resources or discover concepts, how relationships affect time costs).

5. **Implement New Systems:** Build the features unique to GDD v5.0, like the Progressive Control mechanics and the seasonal progression structure.

## Recommendation: Targeted Rebuild

The most pragmatic and efficient path forward is the Targeted Rebuild.

- Don't try to refactor the old Day Phase. Accept that this core part needs replacing.
- Start by building the new time-based Day Phase simulation as described in GDD v5.0. Focus on getting this core loop functional.
- Aggressively reuse components, data structures, and systems from your v3.0 implementation that are independent of the node-based navigation or can be adapted.
- Prioritize implementing the key GDD v5.0 features like the Progressive Control system and the detailed Night -> Day influences early in the rebuild process, as they are central to the new design.
- Work iteratively: Get the new core loop + essential reused systems working, then layer in the remaining features and polish according to the GDD v5.0 roadmap.

This approach respects the work already done by salvaging reusable parts while ensuring the new, fundamentally different core loop is built cleanly according to the updated design specification. It avoids the technical debt and fragility of trying to force a gradual migration on such a core change.