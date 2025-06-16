# Rogue Resident

**"The mind is not a vessel to be filled, but a constellation to be illuminated."**

An educational roguelike game that transforms medical physics education into an immersive hospital simulation. Players navigate their residency through time-based decision making while developing expertise visualized as a growing constellation of interconnected knowledge.

## 📚 Documentation & Design System

**All current documentation, design decisions, and implementation guidance is available in our [Documentation Hub](https://github.com/yourusername/rogue-resident-docs).**

The documentation hub provides:
- 🎭 **Three-Audience Workflow**: Context-appropriate content for design discussions, development planning, and technical implementation
- 📊 **System Status Dashboard**: Current implementation progress and priorities  
- 📚 **Content Library**: Browse all game systems, characters, educational content, and configurations
- 🔧 **Technical Specifications**: Architecture decisions, API references, and integration guides

## 🚀 Current Development Focus

**Priority**: Activity Interface System implementation with hospital backdrop and dialogue systems.

See [`docs/workflow/activity-interface-development-plan.md`](docs/workflow/activity-interface-development-plan.md) for:
- Current implementation roadmap
- Asset requirements and priorities
- Technical architecture decisions
- Integration strategy

## 🛠 Quick Start

```bash
# Clone and install
git clone <repository-url>
cd rogue-resident
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the game.

## 🎯 Core Game Features

- **Time-Based Gameplay**: Day/night cycle with authentic hospital rhythms
- **Knowledge Constellation**: Visual expertise development through interconnected concepts
- **Progressive Control**: Player agency increases as knowledge and relationships grow
- **Mentor Relationships**: Four distinct teaching approaches and character development
- **Seasonal Progression**: Year-long residency journey through Spring, Summer, Fall, Winter

## 🧰 Tech Stack

- **Framework**: Next.js with TypeScript
- **State Management**: Zustand stores with event-driven architecture
- **Styling**: styled-components with custom pixel theme system
- **UI Components**: Custom component library with domain-specific styling
- **Performance**: Chamber Pattern optimizations for smooth gameplay

## 📁 Project Structure

```
app/
├── components/        # React components (UI, gameplay, features)
├── core/             # Game logic (events, state machines, systems)
├── data/             # Game content (concepts, characters, dialogues)
├── store/            # Zustand state stores
├── styles/           # Global styles and theme system
└── types/            # TypeScript definitions

docs/
├── workflow/         # Current development plans and context
├── static/           # Architecture guides and technical specs
└── README.md         # Documentation system overview
```

## 🎮 Game Systems

- **Hospital Backdrop**: Isometric hospital exploration interface
- **Activity Interface**: Dual dialogue modes (narrative vs challenge)
- **Knowledge System**: 90+ interconnected medical physics concepts
- **Mentor System**: Four distinct teaching personalities and relationships
- **Resource Management**: Insight, momentum, and star points progression
- **Boss Encounters**: Comprehensive assessment scenarios

## 🔗 Key Links

- 📖 **[Documentation Hub](https://github.com/yourusername/rogue-resident-docs)** - Design documents, content library, system status
- 🎯 **[Current Development Plan](docs/workflow/activity-interface-development-plan.md)** - Implementation roadmap and priorities
- 🏗️ **[Architecture Guide](docs/static/rogue-resident-architecture-guide.md)** - Technical implementation patterns
- 🎨 **[Theme System](docs/static/THEME.md)** - Styling and UI component guide

## 🤝 Contributing

1. Review the current development plan in `docs/workflow/`
2. Check asset requirements and technical specifications
3. Follow the three-audience documentation workflow for design discussions
4. Implement using the established architectural patterns

---

*An innovative approach to professional education that visualizes expertise development and integrates authentic scenarios with educational content.*
