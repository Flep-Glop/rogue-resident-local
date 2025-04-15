// app/core/themeConstants.ts

import { KnowledgeDomain } from '../store/knowledgeStore'; // Assuming KnowledgeDomain type is exported from here

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