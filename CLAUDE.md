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

**The Observatory** is an educational game for medical physics training. Players explore a pixel-art home environment with a knowledge constellation system that visualizes learning progress.

### Core Architecture Patterns

**Game Phase Management:**
- Main game loop handled by phase-based state machine (`app/page.tsx`)
- Phases: `TITLE`, `NIGHT` with smooth transitions
- Single scene with camera panning (no scene switching)

**State Management (Zustand-based):**
- **gameStore** - Core game state, phases, cutscene tracking

### Key Technical Patterns

**Component Organization:**
- `app/components/` - All React components organized by feature
- `app/store/` - Zustand state management (gameStore only)

**Styling System:**
- styled-components with custom pixel theme system
- Component-level styling following existing visual patterns
- Consistent theming across all UI components

**Asset Management:**
- Images stored in `public/images/`
- PIXI.js integration for game graphics and animations
- Custom filters and particle effects using @pixi libraries

### Game-Specific Systems

**Home Scene (CombinedHomeScene.tsx):**
- Single large scene with vertical camera panning
- Interactive elements: telescope (sky view), desk (TBI activity), Pico (companion)
- Character-based navigation with Kapoor sprite

**Knowledge Constellation:**
- Medical physics concepts represented as planet and moon system
- TBI (Total Body Irradiation) as central planet with subtopics as moons
- Visual constellation in the sky view

**TBI Activity:**
- Accessed via desk interaction
- Multi-phase computer interface (boot, menu, intro, positioning, result)
- Sprite sheet-based animation system

## Development Guidelines

**Component Development:**
- Follow existing styled-components patterns
- Examine neighboring components for styling conventions
- All game content is in CombinedHomeScene.tsx

**Performance Considerations:**
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
