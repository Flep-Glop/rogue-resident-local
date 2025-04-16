// app/core/themeConstants.ts

import { KnowledgeDomain } from '../store/knowledgeStore'; // Assuming KnowledgeDomain type is exported from here

// New theme colors including dialogue modes
export const THEME_COLORS = {
  // Dialogue mode colors
  narrative: {
    primary: 'rgba(37, 99, 235, 1)', // Primary blue
    bg: 'rgba(35, 15, 50, 0.95)', // Background
    bgLight: 'rgba(45, 20, 60, 0.98)', // Light background variant
    glow: 'rgba(37, 99, 235, 0.7)', // Glow effect
  },
  question: {
    primary: 'rgba(126, 34, 206, 1)', // Primary purple
    bg: 'rgba(35, 15, 50, 0.95)', // Dark purple background
    bgLight: 'rgba(45, 20, 60, 0.98)', // Light purple background variant
    glow: 'rgba(126, 34, 206, 0.7)', // Purple glow effect
  },
  challenge: {
    primary: 'rgba(217, 119, 6, 1)', // Primary amber
    bg: 'rgba(50, 35, 10, 0.95)', // Background 
    bgLight: 'rgba(60, 40, 15, 0.98)', // Light background variant
    glow: 'rgba(217, 119, 6, 0.7)', // Glow effect
  },
  instruction: {
    primary: 'rgba(5, 150, 105, 1)', // Primary green
    bg: 'rgba(15, 50, 30, 0.95)', // Background
    bgLight: 'rgba(20, 60, 35, 0.98)', // Light background variant
    glow: 'rgba(5, 150, 105, 0.7)', // Glow effect
  },
  reaction: {
    primary: 'rgba(219, 39, 119, 1)', // Primary pink
    bg: 'rgba(50, 15, 35, 0.95)', // Background 
    bgLight: 'rgba(60, 20, 40, 0.98)', // Light background variant
    glow: 'rgba(219, 39, 119, 0.7)', // Glow effect
  },
  critical: {
    primary: 'rgba(220, 38, 38, 1)', // Primary red
    bg: 'rgba(50, 15, 15, 0.95)', // Background
    bgLight: 'rgba(60, 20, 20, 0.98)', // Light background variant
    glow: 'rgba(220, 38, 38, 0.7)', // Glow effect
  }
};

// Domain color map for direct use - updated to match documentation
export const DOMAIN_COLORS: Record<KnowledgeDomain, string> = {
  'treatment-planning': '#3b82f6', // Blue
  'radiation-therapy': '#10b981', // Green
  'linac-anatomy': '#f59e0b', // Amber
  'dosimetry': '#ec4899', // Pink
  'general': '#6b7280', // Gray - keeping for backwards compatibility
  // Keep these for backward compatibility but they'll be phased out
  'radiation-physics': '#3b82f6', 
  'quality-assurance': '#10b981',
  'clinical-practice': '#ec4899',
  'radiation-protection': '#f59e0b',
  'technical': '#6366f1',
  'theoretical': '#8b5cf6'
};

// Light variant colors for highlights - updated to match documentation
export const DOMAIN_COLORS_LIGHT: Record<KnowledgeDomain, string> = {
  'treatment-planning': '#93c5fd', // Light blue
  'radiation-therapy': '#5eead4', // Light green
  'linac-anatomy': '#fcd34d', // Light amber
  'dosimetry': '#fbcfe8', // Light pink
  'general': '#9ca3af', // Light gray
  // Keep these for backward compatibility
  'radiation-physics': '#93c5fd',
  'quality-assurance': '#5eead4',
  'clinical-practice': '#fbcfe8',
  'radiation-protection': '#fcd34d',
  'technical': '#a5b4fc',
  'theoretical': '#c4b5fd'
};

// Panel background colors for darker theme
export const PANEL_COLORS = {
  primary: '#1a1e24',     // Darker than surface-dark
  secondary: '#242830',   // Same as surface
  tertiary: '#2c323c',    // Slightly lighter than surface
  overlay: 'rgba(15, 17, 21, 0.85)', // Dark with transparency for overlays
};

// Helper function to convert hex color to rgba (Can be placed here or in a utils file)
export const hexToRgba = (hex: string, alpha: number = 1): string => {
  // Remove # if present
  hex = hex.replace('#', '');
  // Parse the hex values
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  // Return rgba string
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

// Helper function to get domain color (used in Debug Panel)
export function getDomainColor(domain: string): string {
  return DOMAIN_COLORS[domain as KnowledgeDomain] || DOMAIN_COLORS.general;
}