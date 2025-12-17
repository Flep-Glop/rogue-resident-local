/**
 * pixelTheme.ts
 * Theme constants for the Rogue Resident game
 */

// Color palette
export const colors = {
  background: '#0f172a',
  backgroundAlt: '#1e293b',
  text: '#f8fafc',
  textDim: '#94a3b8',
  border: '#475569',
  highlight: '#7c3aed',
  starGlow: '#fcd34d',
  active: '#22c55e',
  inactive: '#64748b',
  error: '#ef4444',
};

// Spacing units
export const spacing = {
  xxs: '4px',
  xs: '8px',
  sm: '12px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  xxl: '48px',
};

// Typography
export const typography = {
  fontFamily: {
    pixel: "'Aseprite', 'Press Start 2P', 'VT323', monospace",
    mono: 'var(--font-roboto-mono), monospace',
  },
  fontSize: {
    xs: '24px',
    sm: '32px',
    md: '40px',
    lg: '48px',
    xl: '56px',
    xxl: '72px',
  },
  lineHeight: {
    tight: 1.1,
    normal: 1.3,
    relaxed: 1.6,
  },
  textShadow: {
    pixel: '2px 2px 0 rgba(0, 0, 0, 0.5)',
  },
};

// Helper mixins
export const mixins = {
  pixelPerfect: `
    image-rendering: -moz-crisp-edges;
    image-rendering: -webkit-crisp-edges;
    image-rendering: pixelated;
    image-rendering: crisp-edges;
    -ms-interpolation-mode: nearest-neighbor;
  `,
  noSelect: `
    user-select: none;
    -webkit-user-select: none;
  `,
};

// Export theme object for styled-components ThemeProvider
const pixelTheme = {
  colors,
  spacing,
  typography,
  mixins,
};

export default pixelTheme;
