'use client';

/**
 * ThemeProvider.tsx
 * Provides the styled-components theme context and global styles to the entire application
 */

import React, { ReactNode } from 'react';
import { ThemeProvider as StyledThemeProvider, StyleSheetManager } from 'styled-components';
import pixelTheme from '@/app/styles/pixelTheme';
import GlobalStyles from '@/app/styles/GlobalStyles';

interface PixelThemeProviderProps {
  children: ReactNode;
}

/**
 * Helper function to determine if a prop should be forwarded to the DOM
 * This filters out props starting with $ (transient props)
 */
const shouldForwardProp = (prop: string): boolean => {
  return !prop.startsWith('$');
};

/**
 * PixelThemeProvider component
 * Wraps the application with the styled-components ThemeProvider and global styles
 */
const PixelThemeProvider: React.FC<PixelThemeProviderProps> = ({ children }) => {
  return (
    <StyleSheetManager shouldForwardProp={shouldForwardProp}>
      <StyledThemeProvider theme={pixelTheme}>
        <GlobalStyles />
        {children}
      </StyledThemeProvider>
    </StyleSheetManager>
  );
};

export default PixelThemeProvider; 