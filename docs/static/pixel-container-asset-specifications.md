# Pixel Container Asset Creation Specifications 🎨

## 🎯 PRIORITY PHASE 1: Essential Containers (Week 1)
**Create these 9 assets first for immediate 80% visual impact**

### 📁 Directory Structure
```
public/images/ui/containers/
├── question-bg.png          # 600×200px - Main question interface background
├── question-border.png      # 600×200px - Academic-style border overlay
├── question-corners.png     # 600×200px - Corner decorations
├── card-bg.png             # 200×120px - Button/option card background  
├── card-border.png         # 200×120px - Clean card border overlay
├── card-corners.png        # 200×120px - Subtle corner accents
├── dialog-bg.png           # 500×300px - Dialogue box background
├── dialog-border.png       # 500×300px - Speech bubble border
└── dialog-corners.png      # 500×300px - Conversation styling
```

## 🎨 DETAILED ASSET SPECIFICATIONS

### 1. QUESTION CONTAINER SET
**Purpose:** Main activity interface (TestActivity, MultipleChoice, etc.)

#### question-bg.png
- **Dimensions:** 600×200px
- **Style:** Academic/clinical background texture
- **Colors:** 
  - Base: `#1e293b` (backgroundAlt from theme)
  - Texture: Subtle paper/clipboard pattern
  - Opacity: 85-90% to allow content readability
- **Design Notes:**
  - Subtle grid pattern or parchment texture
  - Slight vignette darker at edges
  - Professional medical/academic feel

#### question-border.png  
- **Dimensions:** 600×200px
- **Style:** Prominent academic border
- **Colors:**
  - Border: `#475569` (theme border color)
  - Accent lines: `#64748b` 
- **Design Elements:**
  - 4-6px thick outer border
  - Inner accent lines 1-2px from edge
  - Corner emphasis (thicker at corners)
  - Clinical/professional styling

#### question-corners.png
- **Dimensions:** 600×200px  
- **Style:** Academic corner decorations
- **Colors:**
  - Decorations: `#94a3b8` (textDim)
  - Accent: Domain colors (will be tinted by CSS)
- **Design Elements:**
  - Bracket-style corner accents
  - Small dot/dash patterns
  - Medical cross symbols (subtle)
  - Only in corners, transparent center

### 2. CARD CONTAINER SET  
**Purpose:** Ability cards, option buttons, small UI elements

#### card-bg.png
- **Dimensions:** 200×120px
- **Style:** Clean button/card background
- **Colors:**
  - Base: `#374151` (slightly lighter than backgroundAlt)
  - Highlight: Subtle gradient to `#475569`
- **Design Notes:**
  - Slight 3D button depth feeling
  - Center slightly lighter than edges
  - Clean, clickable appearance

#### card-border.png
- **Dimensions:** 200×120px
- **Style:** Sharp, clean border suitable for buttons
- **Colors:**
  - Border: `#64748b`
  - Inner line: `#475569`
- **Design Elements:**
  - 2-3px outer border
  - 1px inner accent line
  - Sharp corners (not rounded)
  - Button/clickable emphasis

#### card-corners.png
- **Dimensions:** 200×120px
- **Style:** Minimal corner accents for cards
- **Colors:**
  - Accents: `#94a3b8`
  - Will be tinted by domain colors
- **Design Elements:**
  - Small corner dots or tiny brackets
  - Very subtle - shouldn't compete with content
  - Only small accents in each corner

### 3. DIALOG CONTAINER SET
**Purpose:** Dialogue boxes, conversation interfaces

#### dialog-bg.png
- **Dimensions:** 500×300px
- **Style:** Speech bubble/conversation background
- **Colors:**
  - Base: `#0f172a` (main background)
  - Texture: Very subtle paper/conversation texture
- **Design Notes:**
  - Conversation bubble feeling
  - Slightly darker than other containers
  - Warm, conversational atmosphere

#### dialog-border.png
- **Dimensions:** 500×300px
- **Style:** Speech bubble border with slight chat styling
- **Colors:**
  - Border: `#475569`
  - Accent: `#64748b`
- **Design Elements:**
  - 3-4px border
  - Slightly curved feeling (still pixel art)
  - Speech bubble character
  - Conversation emphasis

#### dialog-corners.png  
- **Dimensions:** 500×300px
- **Style:** Conversational corner decorations
- **Colors:**
  - Decorations: `#94a3b8`
  - Chat-themed accents
- **Design Elements:**
  - Quote mark stylized accents
  - Small speech bubble decorations
  - Conversational symbols

## 🎨 PHASE 2: Extended Containers (Week 2-3)

### 📁 Additional Assets
```
public/images/ui/containers/
├── panel-bg.png            # 200×400px - Side panel background
├── panel-border.png        # 200×400px - Vertical panel border  
├── panel-corners.png       # 200×400px - Panel corner treatments
├── tooltip-bg.png          # 240×80px - Small popup background
├── tooltip-border.png      # 240×80px - Tooltip border
├── tooltip-tail.png        # 24×12px - Pointer arrow
├── modal-bg.png            # 600×400px - Modal dialog background
├── modal-border.png        # 600×400px - Modal border overlay
├── modal-corners.png       # 600×400px - Modal corner decorations
├── resource-bg.png         # 180×40px - Resource meter background
├── resource-border.png     # 180×40px - Resource border
├── resource-frame.png      # 180×40px - Resource frame decoration
├── ability-bg.png          # 162×120px - Enhanced ability background
├── ability-border.png      # 162×120px - Ability border overlay
└── ability-glow.png        # 180×140px - Active glow effect (larger)
```

## 🔧 TECHNICAL CREATION GUIDELINES

### Color Palette Reference
```css
/* Use these exact colors from pixelTheme.ts */
background: #0f172a        /* Main dark background */
backgroundAlt: #1e293b     /* Container backgrounds */
border: #475569           /* Primary borders */
textDim: #94a3b8          /* Secondary decorations */
text: #f8fafc             /* Light elements */

/* Domain colors (for tinting) */
physics: #3b82f6          /* Blue */
dosimetry: #ec4899        /* Pink */  
linac: #f59e0b           /* Amber */
planning: #10b981        /* Green */
```

### Layer Structure Requirements

#### Background Layer (e.g., question-bg.png)
- **Purpose:** Base texture and color
- **Transparency:** 85-90% opacity recommended
- **Content:** Solid base color with subtle texture/pattern
- **No borders or decorations** - pure background only

#### Border Layer (e.g., question-border.png)  
- **Purpose:** Frame and outline elements
- **Transparency:** Fully opaque borders, transparent center
- **Content:** Outer borders, inner accent lines
- **No background fill** - borders only

#### Corner Layer (e.g., question-corners.png)
- **Purpose:** Decorative corner elements
- **Transparency:** Decorations opaque, everything else transparent
- **Content:** Only corner decorations, completely transparent center
- **Domain tintable:** Will be CSS-tinted with domain colors

#### Effect Layer (e.g., ability-glow.png)
- **Purpose:** Active state overlays
- **Transparency:** Glowing effect with transparency blending
- **Content:** Glow/pulse effects extending beyond base container
- **Animation ready:** Static frame, CSS handles animation

### Export Settings (Aseprite/GIMP/Photoshop)

#### Required Export Configuration
```
Format: PNG-24 with Alpha
Color Mode: RGBA (8-bit per channel)
Background: Transparent
Scaling: Export at 1x (actual pixel size)
Compression: Light (preserve crisp edges)
Color Profile: sRGB
Pixel Perfect: No anti-aliasing/smoothing
```

#### File Size Targets
- **Small containers** (cards, tooltips): < 2KB each
- **Medium containers** (questions, dialogs): < 5KB each  
- **Large containers** (modals): < 8KB each
- **Effect overlays** (glows): < 3KB each

### Pixel Art Guidelines

#### Pixel Density
- **1 CSS pixel = 1 actual pixel** at base size
- **Design for 2x scaling** - will be scaled via CSS transform
- **No sub-pixel positioning** - align to pixel grid
- **Sharp edges only** - no anti-aliasing

#### Pattern Consistency
- **Border thickness:** 2-4px for main borders, 1px for accents
- **Corner treatments:** Consistent style across all containers
- **Texture scale:** Subtle, 2-4px pattern repeats
- **Depth effects:** 1-2px shadow/highlight offsets

## 🎨 CREATION WORKFLOW

### Phase 1 Priority Order
1. **question-bg.png** (highest impact - main interface)
2. **card-bg.png** (ability cards and options)  
3. **question-border.png** (completes main interface)
4. **card-border.png** (completes ability system)
5. **dialog-bg.png** (conversation system)
6. **question-corners.png** (polish for main interface)
7. **card-corners.png** (polish for abilities)
8. **dialog-border.png** (completes conversation)
9. **dialog-corners.png** (conversation polish)

### Quality Checklist Per Asset
- [ ] Correct dimensions (exact pixels)
- [ ] Proper transparency (backgrounds vs borders vs decorations)
- [ ] Color accuracy (matches theme palette)
- [ ] Pixel-perfect edges (no smoothing)
- [ ] File size optimized (< target size)
- [ ] Scales cleanly at 2x (test in browser)
- [ ] Integrates with existing UI style
- [ ] Domain color compatibility (neutral base for tinting)

### Testing Workflow
1. **Create asset** in pixel art tool
2. **Export** with proper settings
3. **Place** in `/public/images/ui/containers/`
4. **Test** at `/pixel-container-demo` page
5. **Verify** scaling and domain color tinting
6. **Iterate** based on visual integration

## 🎯 SUCCESS METRICS

### Visual Integration
- **Style consistency** with existing ability icons and bars
- **Clean scaling** at 2x transform size
- **Domain color harmony** when CSS-tinted
- **Professional polish** matching roadmap quality standards

### Technical Performance  
- **Fast loading** - total Phase 1 assets under 40KB
- **Cache friendly** - no changes needed after creation
- **Cross-browser** compatibility with PNG transparency
- **Responsive** behavior at different screen sizes

## 🚀 QUICK START: First Asset

### Start with question-bg.png:
1. **Create new 600×200px canvas** in Aseprite
2. **Fill with base color** `#1e293b` 
3. **Add subtle texture** (2-3px grid pattern)
4. **Reduce opacity** to 90%
5. **Export PNG-24** with transparency
6. **Test** in demo page immediately

This gives you the foundation to build the complete system incrementally! 