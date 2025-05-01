'use client';

/**
 * GlobalStyles.tsx
 * Global styling for the Rogue Resident application
 * Applies pixel theme and animations consistently across the app
 */

import React from 'react';
import { createGlobalStyle } from 'styled-components';
import pixelTheme from './pixelTheme';
import pixelAnimations from './pixelAnimations';

const GlobalStyle = createGlobalStyle`
  /* Reset styles - these extend the basic reset in globals.css */
  *, *::before, *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  /* Apply pixel-rendering to the entire app */
  html, body {
    ${pixelTheme.mixins.pixelPerfect}
    font-family: ${pixelTheme.typography.fontFamily.pixel};
    background-color: ${pixelTheme.colors.background};
    color: ${pixelTheme.colors.text};
    font-size: ${pixelTheme.typography.fontSize.md};
    line-height: ${pixelTheme.typography.lineHeight.normal};
    overflow-x: hidden;
  }

  /* Make the app container fill the viewport */
  #__next, #root, main {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  /* Apply scrollbar styling */
  * {
    ${pixelTheme.mixins.scrollable}
  }

  /* Heading styles */
  h1, h2, h3, h4, h5, h6 {
    font-family: ${pixelTheme.typography.fontFamily.pixel};
    font-weight: normal;
    margin-bottom: ${pixelTheme.spacing.md};
    text-shadow: ${pixelTheme.typography.textShadow.pixel};
  }

  h1 {
    font-size: ${pixelTheme.typography.fontSize.xxl};
  }

  h2 {
    font-size: ${pixelTheme.typography.fontSize.xl};
  }

  h3 {
    font-size: ${pixelTheme.typography.fontSize.lg};
  }

  /* Button reset */
  button {
    font-family: ${pixelTheme.typography.fontFamily.pixel};
    cursor: pointer;
    background: none;
    border: none;
    color: inherit;
    font-size: inherit;
    ${pixelTheme.mixins.pixelPerfect}
    
    &:focus {
      outline: none;
    }
  }

  /* Link styles */
  a {
    color: ${pixelTheme.colors.highlight};
    text-decoration: none;
    
    &:hover {
      text-decoration: underline;
    }
  }

  /* Inject all keyframe animations */
  ${pixelAnimations.generateGlobalKeyframes()}

  /* Domain-specific color classes */
  .treatment-planning {
    color: ${pixelTheme.colors.treatmentPlanning};
  }
  
  .radiation-therapy {
    color: ${pixelTheme.colors.radiationTherapy};
  }
  
  .linac-anatomy {
    color: ${pixelTheme.colors.linacAnatomy};
  }
  
  .dosimetry {
    color: ${pixelTheme.colors.dosimetry};
  }

  /* Resource color classes */
  .momentum {
    color: ${pixelTheme.colors.momentum};
  }
  
  .insight {
    color: ${pixelTheme.colors.insight};
  }
  
  .star-points {
    color: ${pixelTheme.colors.starPoints};
  }

  /* Utility classes */
  .pixel-perfect {
    ${pixelTheme.mixins.pixelPerfect}
  }
  
  .no-select {
    ${pixelTheme.mixins.noSelect}
  }
  
  /* Sync CSS variables with theme values for non-styled-component usage */
  :root {
    --background: ${pixelTheme.colors.background};
    --foreground: ${pixelTheme.colors.text};
    --font-pixel: ${pixelTheme.typography.fontFamily.pixel};
    --font-mono: ${pixelTheme.typography.fontFamily.mono};
    
    /* Domain colors as CSS variables */
    --color-treatment-planning: ${pixelTheme.colors.treatmentPlanning};
    --color-radiation-therapy: ${pixelTheme.colors.radiationTherapy};
    --color-linac-anatomy: ${pixelTheme.colors.linacAnatomy};
    --color-dosimetry: ${pixelTheme.colors.dosimetry};
    
    /* Resource colors as CSS variables */
    --color-momentum: ${pixelTheme.colors.momentum};
    --color-insight: ${pixelTheme.colors.insight};
    --color-star-points: ${pixelTheme.colors.starPoints};
  }
`;

/**
 * GlobalStyles component that applies consistent styling across the app
 */
const GlobalStyles: React.FC = () => {
  return <GlobalStyle />;
};

export default GlobalStyles; 