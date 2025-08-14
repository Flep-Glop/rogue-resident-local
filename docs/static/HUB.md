# 🎮 ROGUE RESIDENT DEVELOPMENT HUB

## FOR AI ASSISTANTS
You're developing an educational medical physics game using React + PixiJS.
Start here, then navigate to specific docs as needed.

## QUICK NAVIGATION
- **Building feature?** → PATTERNS.md
- **Visual/UI issue?** → ARCHITECTURE.md  
- **Need sprite?** → SPRITES.md
- **Known bug?** → STACK.md
- **Session done?** → DEV_LOG.md

## CURSOR-SPECIFIC WORKFLOW
- Use `codebase_search` before implementing anything
- Use edit tools directly (don't output code blocks)
- Check `/public/images/` paths exist before referencing
- Complex features: start with `todo_write` tool

## WHEN STUCK
1. Search codebase for similar pattern
2. Check PATTERNS.md for proven approaches
3. Simplify - complex solution usually means wrong approach

## SESSION LOGGING FORMAT
Log every session in DEV_LOG.md using this format:
```markdown
## Entry #[NUMBER]
**Focus:** [What we're building/fixing]
**Smooth:** [What worked well]
**Friction:** [What had issues + solution]
**Insight:** [Key learning to remember]
```

## CRITICAL REMINDERS
- **One component, one coordinate system** (never mix)
- **Native asset dimensions only** (220px asset = 220px display)
- **Aseprite-first for animations** (code only when necessary)
- **Event-driven communication** (no tight React-PixiJS coupling)

## DOCUMENTATION VERSIONS
- HUB: v1.0
- ARCHITECTURE: v1.0
- PATTERNS: v1.0
- SPRITES: v1.0
- STACK: v1.0
- DEV_LOG: Rolling (wiped periodically)