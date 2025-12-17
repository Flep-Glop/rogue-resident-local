'use client';

/**
 * GlobalStyles.tsx
 * Global styling for the Rogue Resident application
 */

import React from 'react';
import { createGlobalStyle } from 'styled-components';
import pixelTheme from './pixelTheme';

const GlobalStyle = createGlobalStyle`
  /* Reset styles */
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

  /* Heading styles */
  h1, h2, h3, h4, h5, h6 {
    font-family: ${pixelTheme.typography.fontFamily.pixel};
    font-weight: normal;
    margin-bottom: ${pixelTheme.spacing.md};
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

  /* Utility classes */
  .pixel-perfect {
    ${pixelTheme.mixins.pixelPerfect}
  }
  
  .no-select {
    ${pixelTheme.mixins.noSelect}
  }
  
  /* Sync CSS variables with theme */
  :root {
    --background: ${pixelTheme.colors.background};
    --foreground: ${pixelTheme.colors.text};
    --font-pixel: ${pixelTheme.typography.fontFamily.pixel};
    --font-mono: ${pixelTheme.typography.fontFamily.mono};
  }
`;

const GlobalStyles: React.FC = () => {
  return <GlobalStyle />;
};

export default GlobalStyles;
