# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

**Core Development:**
- `npm run dev` - Start development server with Turbopack (opens http://localhost:3000)
- `npm run build` - Build production version
- `npm run start` - Start production server
- `npm run lint` - Run ESLint checks

**Version Management:**
- `npm run version:patch` - Increment patch version using custom script
- `npm run version:minor` - Increment minor version using custom script
- `npm run version:major` - Increment major version using custom script

## Architecture Overview

**Rogue Resident** is an educational roguelike game built as a hospital simulation for medical physics training. The architecture follows a modular, event-driven design with clear separation of concerns.

### Core Architecture Patterns

**Game Phase Management:**
- Main game loop handled by phase-based state machine (`app/page.tsx`)
- Phases: `TITLE`, `NIGHT` with smooth transitions
- Loading screens manage phase transitions with async state updates

**State Management (Zustand-based):**
- **gameStore** - Core game state, phases, time, relationships, resource proxies
- **resourceStore** - Player resources (insight, momentum, star points)
- **knowledgeStore** - Medical physics concepts, mastery tracking, constellation data
- **activityStore** - Activity management, special events, unlocks
- **dialogueStore** - Conversation state, mentor interactions
- **sceneStore** - Scene navigation and UI state management
- Other specialized stores: relationshipStore, abilityStore, journalStore, questionStore, tutorialStore

**Event System:**
- Centralized event bus (`app/core/events/CentralEventBus.ts`)
- Event-driven communication between stores and systems
- Maintains loose coupling between game systems

**Time Management:**
- TimeManager handles game time progression and day/night cycles
- Time blocks and scheduling system for activities
- Automatic phase transitions based on time advancement

### Key Technical Patterns

**Component Organization:**
- `app/components/` - All React components organized by feature
- `app/core/` - Game logic, systems, and business rules
- `app/data/` - Game content (concepts, characters, dialogues)
- `app/store/` - Zustand state management
- `app/types/` - TypeScript type definitions

**Styling System:**
- styled-components with custom pixel theme system
- Component-level styling following existing visual patterns
- Consistent theming across all UI components

**Asset Management:**
- Images stored in `public/images/`
- PIXI.js integration for game graphics and animations
- Custom filters and particle effects using @pixi libraries

### Game-Specific Systems

**Knowledge Constellation:**
- Medical physics concepts represented as interconnected nodes
- Mastery tracking and star point progression system
- Visual constellation interface for knowledge exploration

**Mentor System:**
- Four distinct mentors with unique teaching approaches
- Relationship progression affects available control mechanics
- Dialogue system with dynamic content based on relationship levels

**Activity Interface:**
- Dual dialogue modes (narrative vs challenge)
- Hospital backdrop with isometric exploration
- Activity unlocks based on knowledge and relationship progression

**Resource Economy:**
- Insight → Star Points conversion system
- Momentum tracking for daily progression
- Resource constraints drive strategic decision-making

## Development Guidelines

**State Management Patterns:**
- Use appropriate store for the data type (don't put everything in gameStore)
- Resources should flow through resourceStore, not gameStore
- Use event bus for cross-system communication
- Maintain store separation for modularity

**Component Development:**
- Follow existing styled-components patterns
- Examine neighboring components for styling conventions
- Use proper TypeScript typing from `app/types/`
- Integrate with appropriate Zustand stores

**Game Logic:**
- Business rules belong in `app/core/` modules
- Use TimeManager for all time-related operations
- Events should be dispatched through centralEventBus
- Maintain phase-based organization for game flow

**Performance Considerations:**
- Game uses "Chamber Pattern" optimizations for smooth gameplay
- PIXI.js handles graphics rendering and animations
- Turbopack enabled for fast development builds

## Important Configuration

**TypeScript Setup:**
- Uses `@/*` path alias for project root
- Strict mode enabled with ES2017 target
- Next.js integration with custom TypeScript config

**Build Configuration:**
- styled-components compiler enabled
- ESLint and TypeScript errors ignored during builds (dev environment)
- Turbopack with custom loaders for .md, .txt, and .node files
- Raw loader support for markdown content

**Key Dependencies:**
- Next.js 15 with React 19
- PIXI.js 8.x for game graphics with specialized filters
- Zustand for state management
- styled-components for styling
- d3.js for data visualization components