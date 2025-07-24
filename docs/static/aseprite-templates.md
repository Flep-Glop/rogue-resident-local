# Aseprite 9-Slice Asset Creation Guide 🎨

## 🎯 Current Focus: 2 Essential Assets Needed

**Status:** 1 of 3 core assets complete (`question-9slice.png` ✅)  
**Next:** Create `dialog-9slice.png` and `card-9slice.png`

---

## 🚀 Quick Start Template for 9-Slice Assets

### New File Settings (Aseprite):
```
File → New:
- Width: [200px for dialog, 120px for card]  
- Height: [100px for dialog, 60px for card]
- Color Mode: RGBA
- Background Color: Transparent
- Pixel Ratio: 1:1 (square pixels)
```

### Essential Color Palette:
```
Create custom palette with theme colors:

#0f172a  ■  Main Background
#1e293b  ■  Container Background  
#374151  ■  Card Background
#475569  ■  Primary Border
#64748b  ■  Accent Lines
#94a3b8  ■  Decorations
#f8fafc  ■  Light Elements

Domain Colors (automatic theming):
#10b981  ■  Physics (Green) 
#ec4899  ■  Dosimetry (Pink)
#f59e0b  ■  Linac (Amber)
#3b82f6  ■  Planning (Blue)
```

---

## 📐 9-Slice Template Layout

### Grid Setup (Essential):
```
View → Grid → Grid Settings:
- Width: 20px
- Height: 20px  
- Color: #ff0000 (red for visibility)
- Enabled: Yes

This creates the 9-slice zones visually.
```

### 9-Slice Zone Map:
```
┌─────┬─────────┬─────┐
│  A  │    B    │  C  │  ← Top row (20px height)
├─────┼─────────┼─────┤
│  D  │    E    │  F  │  ← Middle row (repeating)
├─────┼─────────┼─────┤
│  G  │    H    │  I  │  ← Bottom row (20px height)
└─────┴─────────┴─────┘
    ↑      ↑      ↑
  20px  repeating  20px

Critical Rules:
- Corners (A,C,G,I): Never repeat, fixed 20×20px
- Edges (B,H): Repeat horizontally 
- Edges (D,F): Repeat vertically
- Center (E): Repeats both directions
```

---

## 🎨 Asset Creation Templates

### Template 1: dialog-9slice.png (200×100px)

**Purpose:** Narrative dialogue, character conversations

**Layer Structure:**
```
1. "corners" - Corner decorations (A,C,G,I zones)
2. "edges" - Border lines (B,D,F,H zones)  
3. "center" - Background fill (E zone)
```

**Design Steps:**
```
1. Fill center (E) with #1e293b
2. Draw horizontal edges (B,H) with #475569 - 2px lines
3. Draw vertical edges (D,F) with #475569 - 2px lines  
4. Add corner brackets (A,C,G,I) with #94a3b8
5. Test: Each edge section should tile seamlessly
```

### Template 2: card-9slice.png (120×60px)

**Purpose:** Buttons, ability cards, small interactive elements

**Layer Structure:**
```
1. "corners" - Corner dots/accents (A,C,G,I zones)
2. "edges" - Clean button borders (B,D,F,H zones)
3. "center" - Button background (E zone)
```

**Design Steps:**
```
1. Fill center (E) with #374151
2. Draw button edges (B,H) with #64748b - 1px lines
3. Draw button sides (D,F) with #64748b - 1px lines
4. Add corner dots (A,C,G,I) with #94a3b8 - small accents
5. Test: Should feel clickable and clean
```

---

## 🔧 Aseprite Workflow Tips

### Essential Shortcuts:
```
B = Brush tool
E = Eraser  
G = Fill tool
X = Switch foreground/background colors
[ / ] = Decrease/increase brush size
Ctrl+Z = Undo
Ctrl+Shift+Z = Redo
```

### Grid Workflow:
```
1. Enable grid (View → Grid)
2. Use grid to align 20px zones perfectly
3. Snap to grid for pixel-perfect borders
4. Turn off grid for final export
```

### Layer Management:
```
- Name layers clearly: "corners", "edges", "center"
- Use separate layers for different elements
- Group related layers (Ctrl+G)
- Toggle visibility to test individual elements
```

---

## 🧪 Testing & Validation

### In-Aseprite Testing:
```
1. Create test content in center zone
2. Duplicate edge sections to simulate tiling
3. Verify seamless connections
4. Check corner alignment with edges
```

### Export Settings:
```
File → Export:
- Format: PNG
- Color Mode: RGBA  
- Scale: 1x (no upscaling)
- Background: Transparent
- Apply pixel ratio: Unchecked
```

### Integration Testing:
```
1. Save to: /public/images/ui/containers/
2. Visit: http://localhost:3000/pixel-container-demo
3. Test expandable behavior with TypewriterText
4. Verify 9-slice scaling works without distortion
```

---

## 🎯 Reference Style Guide

### Style Consistency:
- **Match `question-9slice.png`** - Use as visual reference
- **Clean pixel art** - No anti-aliasing or gradients
- **Subtle depth** - Light shadows/highlights acceptable
- **Academic feel** - Professional, medical/educational aesthetic

### Common Mistakes to Avoid:
```
❌ Corners that don't align with edges
❌ Edges that don't tile seamlessly  
❌ Center fill that creates visible seams
❌ Too busy - keep decorations subtle
❌ Wrong dimensions - must be exact
```

### Success Indicators:
```
✅ TypewriterText expands smoothly in demo
✅ No visual distortion when scaling
✅ Corners remain crisp at all sizes
✅ Edges tile without visible seams
✅ Matches existing question container style
```

---

## 🚀 Immediate Action Plan

**Session Goal:** Complete both remaining assets (1-2 hours total)

1. **Create `dialog-9slice.png`** (45 minutes)
   - Open Aseprite with 200×100px template
   - Follow dialogue design steps above
   - Export and test in demo page

2. **Create `card-9slice.png`** (45 minutes)  
   - Open Aseprite with 120×60px template
   - Follow button design steps above
   - Export and test in demo page

3. **System Validation** (15 minutes)
   - Test all 3 container types in demo
   - Verify TypewriterText compatibility
   - Confirm visual consistency

**Result:** Complete pixel container system ready for component migrations.

---

*This guide focuses on the essential 9-slice asset creation needed to complete the pixel container system integration.* 