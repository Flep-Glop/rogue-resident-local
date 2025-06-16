# Rogue Resident Pixel Theme System

This document outlines the pixel styling theme system used in Rogue Resident, how to use it, and the design decisions behind it.

## Overview

Rogue Resident uses a comprehensive styled-components based pixel theme system that provides:

- Consistent pixel-perfect styling across the application
- A component library with pre-built UI elements
- Animation utilities for pixel-style animations
- Domain-specific color schemes and styling

## Core Files

The theme system consists of these primary files:

- `app/styles/pixelTheme.ts` - The main theme object containing colors, spacing, typography, etc.
- `app/styles/pixelAnimations.ts` - Animation utilities and keyframes
- `app/styles/GlobalStyles.tsx` - Global styles applied application-wide
- `app/components/ui/PixelUI.tsx` - The component library with ready-to-use UI elements
- `app/providers/ThemeProvider.tsx` - Provider that makes the theme available app-wide

## Key Design Decisions

1. **styled-components over Tailwind**: The system uses styled-components for more precise control over pixel styling and animations.

2. **Separation of Concerns**:
   - Theme variables are defined in `pixelTheme.ts`
   - Component styling is defined in `PixelUI.tsx`
   - Animations are defined in `pixelAnimations.ts`

3. **CSS Variables Bridge**: Theme values are also exported as CSS variables, making them available to non-styled-component code if needed.

4. **Client Components in Next.js**: Since styled-components uses React context internally, any component using styled-components must be a client component. This is done by adding the `'use client'` directive at the top of the file.

## Using the Theme System

### 1. Basic Component Usage

```tsx
'use client';

import PixelUI from '@/app/components/ui/PixelUI';

function MyComponent() {
  return (
    <PixelUI.Box pixelBorder>
      <PixelUI.Heading>Example Heading</PixelUI.Heading>
      <PixelUI.Text>This is a pixel-styled component</PixelUI.Text>
      <PixelUI.Button primary>Click Me</PixelUI.Button>
    </PixelUI.Box>
  );
}
```

### 2. Domain-Specific Styling

```tsx
'use client';

import PixelUI from '@/app/components/ui/PixelUI';
import pixelTheme from '@/app/styles/pixelTheme';

function DomainComponent() {
  return (
    <PixelUI.Card domainColor={pixelTheme.colors.treatmentPlanning}>
      <PixelUI.Text domainColor={pixelTheme.colors.treatmentPlanning}>
        Treatment Planning Content
      </PixelUI.Text>
    </PixelUI.Card>
  );
}
```

### 3. Using Theme Values in Custom Components

```tsx
'use client';

import styled from 'styled-components';
import pixelTheme from '@/app/styles/pixelTheme';

const CustomComponent = styled.div`
  background-color: ${pixelTheme.colors.background};
  padding: ${pixelTheme.spacing.md};
  ${pixelTheme.mixins.pixelPerfect}
`;
```

### 4. Using Animations

```tsx
'use client';

import styled from 'styled-components';
import pixelAnimations from '@/app/styles/pixelAnimations';

const AnimatedStar = styled.div`
  /* Base star styling */
  ${pixelAnimations.animations.twinkle('2s', 'infinite')}
`;
```

## Component Library

The `PixelUI` component library includes:

- `PixelUI.Box` - Basic container
- `PixelUI.Button` - Interactive buttons
- `PixelUI.Text` - Text with variants
- `PixelUI.Heading` - Headings
- `PixelUI.Subheading` - Subheadings
- `PixelUI.Card` - Card containers
- `PixelUI.ProgressBar` - Progress indicators
- `PixelUI.Star` - Knowledge constellation stars
- `PixelUI.Dialog` - Dialog boxes
- `PixelUI.Tooltip` - Tooltips
- `PixelUI.MomentumDisplay` - Momentum resource display
- `PixelUI.InsightDisplay` - Insight resource display
- `PixelUI.StarPointsDisplay` - Star Points resource display

## Theme Demonstration

The `PixelThemeDemo` component provides a visual reference of all UI components and styling options.

## Color System

The theme includes specific color schemes for:

1. **Knowledge Domains**:
   - Treatment Planning: Blue
   - Radiation Therapy: Green
   - Linac Anatomy: Amber
   - Dosimetry: Pink

2. **Resources**:
   - Momentum: Orange
   - Insight: Cyan
   - Star Points: Yellow

3. **UI Colors**:
   - Background: Dark blue
   - Text: Light blue/gray
   - Highlight: Purple
   - Active: Green
   - Inactive: Slate
   - Error: Red

## Extending the Theme

To add new components to the theme system:

1. Define component styling in `pixelTheme.ts` under the components object
2. Create the component in `PixelUI.tsx` using styled-components
3. Export the component through the `PixelUI` object

## Best Practices

1. Always use the theme variables for colors, spacing, and typography
2. Prefer existing components over creating new ones
3. For domain-specific styling, use the `domainColor` prop
4. Apply the `pixelPerfect` mixin to ensure proper pixel rendering
5. Use animation utilities from `pixelAnimations.ts` for consistent animations
6. Always add the `'use client'` directive to any component that uses styled-components
7. Keep styled-components definitions outside of render functions to avoid re-creating them on every render 