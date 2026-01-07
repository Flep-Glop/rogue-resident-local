# The Observatory

**"The mind is not a vessel to be filled, but a constellation to be illuminated."**

An educational game that transforms medical physics concepts into an explorable knowledge constellation. Navigate a cozy pixel-art environment while building expertise visualized as interconnected stars.

## 🚀 Quick Start

```bash
# Clone and install
git clone <repository-url>
cd rogue-resident
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the game.

## 🎯 Core Features

- **Knowledge Constellation**: Visual expertise development through interconnected concept stars
- **Pixel-Art Home**: Explorable environment with parallax scrolling and interactive elements
- **Quiz Activities**: Medical physics questions that reward Star Points
- **Ability Cards**: Collectible modifiers that enhance gameplay
- **Companion Character**: Pico guides players through the experience

## 🧰 Tech Stack

- **Framework**: Next.js 15 with React 19 and TypeScript
- **Graphics**: PixiJS 8.x for sprite rendering and effects
- **State Management**: Zustand stores with event-driven architecture
- **Styling**: styled-components with custom pixel theme system
- **Performance**: Surgical hybrid architecture (PixiJS + CSS animations)

## 📁 Project Structure

```
app/
├── components/        # React components (UI, scenes, features)
├── core/             # Game logic (events, storage)
├── data/             # Game content (concepts)
├── store/            # Zustand state stores
├── styles/           # Global styles and theme system
└── types.ts          # TypeScript definitions

docs/
├── static/           # Architecture guides and technical specs
└── CLEANUP_PLAN.md   # Codebase maintenance tracking

public/
└── images/           # Sprite sheets, backgrounds, UI assets
```

## 🎮 Game Systems

- **Home Scene**: Ground-level exploration with character movement and interactions
- **Sky View**: Constellation interface for inspecting and unlocking knowledge stars
- **Desk Activity**: Quiz interface with multiple choice questions
- **Star Progression**: Earn points → unlock stars → build constellation

## 📚 Documentation

- **[HUB.md](docs/static/HUB.md)** - Development navigation and workflow
- **[ARCHITECTURE.md](docs/static/ARCHITECTURE.md)** - Technical patterns and decisions
- **[PATTERNS.md](docs/static/PATTERNS.md)** - Implementation guidelines
- **[SPRITES.md](docs/static/SPRITES.md)** - Asset specifications
- **[STACK.md](docs/static/STACK.md)** - Dependencies and known issues

---

*An innovative approach to professional education that visualizes expertise development through interactive constellation mechanics.*
