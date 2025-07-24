/**
 * pixelTheme.ts
 * A comprehensive theme file providing pixel-styled UI components and styling
 * for consistent appearance across the Rogue Resident game.
 */

// Color palette based on knowledge domains from the GDD
export const colors = {
  // Domain colors
  treatmentPlanning: '#3b82f6', // Blue
  radiationTherapy: '#10b981',  // Green
  linacAnatomy: '#f59e0b',      // Amber
  dosimetry: '#ec4899',         // Pink
  
  // UI colors
  background: '#0f172a',        // Dark blue background
  backgroundAlt: '#1e293b',     // Slightly lighter background for cards
  text: '#f8fafc',              // Light text for dark backgrounds
  textDim: '#94a3b8',           // Dimmed text for secondary information
  border: '#475569',            // Border color
  highlight: '#7c3aed',         // Purple highlight for important elements
  
  // Effect colors
  starGlow: '#fcd34d',          // Yellow glow for stars
  active: '#22c55e',            // Green for active/success states
  inactive: '#64748b',          // Slate for inactive states
  error: '#ef4444',             // Red for errors
  
  // Resource colors
  momentum: '#f97316',          // Orange for Momentum
  insight: '#06b6d4',           // Cyan for Insight
  starPoints: '#eab308',        // Yellow for Star Points
};

// Spacing units to maintain consistent pixel-perfect sizing
export const spacing = {
  xxs: '4px',
  xs: '8px',
  sm: '12px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  xxl: '48px',
};

// Border styles
export const borders = {
  // Pixel-perfect border styles
  thin: `1px solid ${colors.border}`,
  medium: `2px solid ${colors.border}`,
  thick: `3px solid ${colors.border}`,
  
  // Pixelated border styles using box-shadow for that retro feel
  pixelBorder: {
    outer: `
      box-shadow:
        0 4px 0 ${colors.border},
        0 0 0 4px ${colors.border},
        0 0 0 4px ${colors.border},
        4px 0 0 ${colors.border};
    `,
    inner: `
      box-shadow:
        inset 0 2px 0 ${colors.border},
        inset 0 0 0 2px ${colors.border},
        inset 0 0 0 2px ${colors.border},
        inset 2px 0 0 ${colors.border};
    `,
    active: (domainColor: string) => `
      box-shadow:
        0 4px 0 ${domainColor},
        0 0 0 4px ${domainColor},
        0 0 0 4px ${domainColor},
        4px 0 0 ${domainColor};
    `,
  },
};

// Shadow effects
export const shadows = {
  sm: `0 2px 0 rgba(0, 0, 0, 0.25)`,
  md: `0 4px 0 rgba(0, 0, 0, 0.25)`,
  lg: `0 6px 0 rgba(0, 0, 0, 0.25)`,
  glow: (color: string) => `0 0 8px ${color}`,
  pixelDrop: `
    4px 4px 0 rgba(0, 0, 0, 0.5)
  `,
};

// Typography styles
export const typography = {
  // Font families
  fontFamily: {
    pixel: "'Aseprite', 'Press Start 2P', 'VT323', monospace", // Primary pixel font - now using Aseprite!
    mono: 'var(--font-roboto-mono), monospace',              // For code/technical text
    system: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' // Fallback
  },
  
  // Font sizes (pixel-perfect) - 2x scaled for optimal Aseprite font readability
  fontSize: {
    xs: '24px',   // 2x scale from original 12px
    sm: '32px',   // 2x scale from original 16px
    md: '40px',   // 2x scale from original 20px
    lg: '48px',   // 2x scale from original 24px
    xl: '56px',   // 2x scale from original 28px
    xxl: '72px',  // 2x scale from original 36px
  },
  
  // Line heights (optimized for Aseprite font readability)
  lineHeight: {
    tight: 1.1,    // Slightly more space for pixel fonts
    normal: 1.3,   // Better breathing room for Aseprite font
    relaxed: 1.6,  // Enhanced spacing for longer text passages
  },
  
  // Text shadow for that retro feel
  textShadow: {
    pixel: `2px 2px 0 rgba(0, 0, 0, 0.5)`,
    glow: (color: string) => `0 0 4px ${color}`,
  },
};

// Animation timings
export const animation = {
  // Duration values
  duration: {
    fast: '150ms',
    normal: '300ms',
    slow: '500ms',
  },
  
  // Easing functions
  easing: {
    // Sharp pixel-style animations (no easing, just steps)
    pixel: 'steps(5, end)',
    // For smoother animations when needed
    smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
  
  // Keyframes for common animations
  keyframes: {
    pulse: `
      @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.05); }
        100% { transform: scale(1); }
      }
    `,
    twinkle: `
      @keyframes twinkle {
        0% { opacity: 1; }
        50% { opacity: 0.5; }
        100% { opacity: 1; }
      }
    `,
    shake: `
      @keyframes shake {
        0% { transform: translateX(0); }
        25% { transform: translateX(-2px); }
        50% { transform: translateX(0); }
        75% { transform: translateX(2px); }
        100% { transform: translateX(0); }
      }
    `,
  },
};

// Common component styles
export const components = {
  // Box/container styles
  box: {
    base: `
      background-color: ${colors.backgroundAlt};
      border: ${borders.medium};
      padding: ${spacing.md};
      image-rendering: pixelated;
    `,
    pixel: `
      background-color: ${colors.backgroundAlt};
      ${borders.pixelBorder.outer}
      padding: ${spacing.md};
      image-rendering: pixelated;
    `,
    active: (domainColor: string) => `
      border-color: ${domainColor};
      box-shadow: 0 0 8px ${domainColor};
    `,
  },
  
  // Button styles
  button: {
    base: `
      background-color: ${colors.backgroundAlt};
      color: ${colors.text};
      border: none;
      padding: ${spacing.xs} ${spacing.md};
      font-family: ${typography.fontFamily.pixel};
      font-size: ${typography.fontSize.md};
      text-shadow: ${typography.textShadow.pixel};
      transform: translateY(0);
      transition: transform ${animation.duration.fast} ${animation.easing.pixel};
      cursor: pointer;
      image-rendering: pixelated;
      outline: none;
      
      &:hover {
        background-color: ${colors.highlight};
      }
      
      &:active {
        transform: translateY(4px);
      }
    `,
    
    primary: `
      background-color: ${colors.highlight};
    `,
    
    domain: (domainColor: string) => `
      background-color: ${domainColor};
    `,
    
    disabled: `
      background-color: ${colors.inactive};
      cursor: not-allowed;
      
      &:hover {
        background-color: ${colors.inactive};
      }
      
      &:active {
        transform: translateY(0);
      }
    `,
  },
  
  // Text styles
  text: {
    base: `
      font-family: ${typography.fontFamily.pixel};
      color: ${colors.text};
      image-rendering: pixelated;
    `,
    
    heading: `
      font-size: ${typography.fontSize.xl};
      text-shadow: ${typography.textShadow.pixel};
      margin-bottom: ${spacing.md};
    `,
    
    subheading: `
      font-size: ${typography.fontSize.lg};
      color: ${colors.textDim};
      margin-bottom: ${spacing.sm};
    `,
    
    body: `
      font-size: ${typography.fontSize.md};
      line-height: ${typography.lineHeight.relaxed};
    `,
    
    small: `
      font-size: ${typography.fontSize.sm};
      color: ${colors.textDim};
    `,
    
    domain: (domainColor: string) => `
      color: ${domainColor};
    `,
  },
  
  // Progress bar styles for resources
  progressBar: {
    container: `
      width: 100%;
      height: 16px;
      background: ${colors.backgroundAlt};
      ${borders.pixelBorder.outer}
      overflow: hidden;
    `,
    
    fill: (color: string, percent: number) => `
      width: ${percent}%;
      height: 100%;
      background: ${color};
      transition: width ${animation.duration.normal} ${animation.easing.pixel};
    `,
  },
  
  // Star styling for Knowledge Constellation
  star: {
    base: `
      position: relative;
      width: 16px;
      height: 16px;
      background-color: ${colors.starGlow};
      clip-path: polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%);
    `,
    
    inactive: `
      background-color: ${colors.inactive};
      opacity: 0.6;
    `,
    
    domain: (domainColor: string) => `
      background-color: ${domainColor};
    `,
    
    glow: `
      &::after {
        content: '';
        position: absolute;
        top: -4px;
        left: -4px;
        right: -4px;
        bottom: -4px;
        background: transparent;
        border-radius: 50%;
        box-shadow: ${shadows.glow(colors.starGlow)};
        opacity: 0.6;
        animation: twinkle 2s infinite ${animation.easing.smooth};
      }
    `,
  },
  
  // Card styles for activities, journal entries, etc.
  card: {
    base: `
      background-color: ${colors.backgroundAlt};
      ${borders.pixelBorder.outer}
      padding: ${spacing.md};
      margin-bottom: ${spacing.md};
      cursor: pointer;
      transition: transform ${animation.duration.fast} ${animation.easing.smooth};
      
      &:hover {
        transform: translateY(-2px);
        ${borders.pixelBorder.active(colors.highlight)}
      }
    `,
    
    selected: `
      ${borders.pixelBorder.active(colors.highlight)}
    `,
    
    domain: (domainColor: string) => `
      &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 4px;
        height: 100%;
        background-color: ${domainColor};
      }
    `,
  },
  
  // Dialog box styles
  dialog: {
    container: `
      background-color: ${colors.background};
      ${borders.pixelBorder.outer}
      padding: ${spacing.lg};
      max-width: 90%;
      margin: 0 auto;
      position: relative;
    `,
    
    header: `
      font-family: ${typography.fontFamily.pixel};
      font-size: ${typography.fontSize.lg};
      color: ${colors.text};
      margin-bottom: ${spacing.md};
      padding-bottom: ${spacing.xs};
      border-bottom: ${borders.thin};
    `,
    
    content: `
      font-family: ${typography.fontFamily.pixel};
      font-size: ${typography.fontSize.md};
      color: ${colors.text};
      line-height: ${typography.lineHeight.relaxed};
      margin-bottom: ${spacing.lg};
    `,
    
    options: `
      display: flex;
      flex-direction: column;
      gap: ${spacing.sm};
    `,
  },
  
  // Tooltip styles
  tooltip: {
    container: `
      position: absolute;
      background-color: ${colors.background};
      ${borders.pixelBorder.outer}
      padding: ${spacing.sm};
      max-width: 250px;
      z-index: 1000;
      
      &::before {
        content: '';
        position: absolute;
        width: 8px;
        height: 8px;
        background-color: ${colors.background};
        transform: rotate(45deg);
      }
    `,
    
    title: `
      font-family: ${typography.fontFamily.pixel};
      font-size: ${typography.fontSize.sm};
      color: ${colors.text};
      margin-bottom: ${spacing.xs};
    `,
    
    content: `
      font-family: ${typography.fontFamily.pixel};
      font-size: ${typography.fontSize.xs};
      color: ${colors.textDim};
    `,
  }
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
  
  noScrollbar: `
    ::-webkit-scrollbar {
      display: none;
    }
    -ms-overflow-style: none;
    scrollbar-width: none;
  `,
  
  scrollable: `
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: ${colors.border} ${colors.backgroundAlt};
    
    &::-webkit-scrollbar {
      width: 8px;
    }
    
    &::-webkit-scrollbar-track {
      background: ${colors.backgroundAlt};
    }
    
    &::-webkit-scrollbar-thumb {
      background-color: ${colors.border};
    }
  `,
};

// Export the entire theme as a default object
const pixelTheme = {
  colors,
  spacing,
  borders,
  shadows,
  typography,
  animation,
  components,
  mixins,
};

export default pixelTheme; 