'use client';

/**
 * Theme utility functions for standardizing UI appearance across extension types
 */

/**
 * Maps extension types to consistent theme variants and colors
 */
export const extensionTypeToTheme = {
  'calculation': {
    variant: 'qa',
    color: 'text-amber-500',
    bgColor: 'bg-amber-900/20',
    borderColor: 'border-amber-900',
    accentColor: '#f59e0b', // Amber instead of Pink
    dialogueMode: 'challenge'  // Change from instruction to challenge
  },
  'anatomical-identification': {
    variant: 'educational',
    color: 'text-blue-500',
    bgColor: 'bg-blue-900/20',
    borderColor: 'border-blue-900',
    accentColor: '#3b82f6', // Blue
    dialogueMode: 'challenge'
  },
  'equipment-identification': {
    variant: 'qa',
    color: 'text-amber-500',
    bgColor: 'bg-amber-900/20',
    borderColor: 'border-amber-900',
    accentColor: '#f59e0b', // Amber
    dialogueMode: 'challenge'
  },
  'measurement-reading': {
    variant: 'clinical',
    color: 'text-pink-500',
    bgColor: 'bg-pink-900/20',
    borderColor: 'border-pink-900',
    accentColor: '#ec4899', // Pink
    dialogueMode: 'instruction'
  },
  'dosimetric-pattern': {
    variant: 'clinical',
    color: 'text-pink-500',
    bgColor: 'bg-pink-900/20',
    borderColor: 'border-pink-900',
    accentColor: '#ec4899', // Pink
    dialogueMode: 'instruction'
  },
  'treatment-plan': {
    variant: 'educational',
    color: 'text-blue-500',
    bgColor: 'bg-blue-900/20',
    borderColor: 'border-blue-900',
    accentColor: '#3b82f6', // Blue
    dialogueMode: 'challenge'
  },
  'error-identification': {
    variant: 'qa',
    color: 'text-green-500',
    bgColor: 'bg-green-900/20',
    borderColor: 'border-green-900',
    accentColor: '#10b981', // Green
    dialogueMode: 'challenge'
  }
};

/**
 * Gets the appropriate theme for a domain
 */
export function getDomainTheme(domain: string) {
  const domainThemes: Record<string, any> = {
    'treatment-planning': {
      variant: 'educational',
      color: 'text-blue-500',
      bgColor: 'bg-blue-900/20',
      borderColor: 'border-blue-900',
      accentColor: '#3b82f6' // Blue
    },
    'radiation-therapy': {
      variant: 'qa',
      color: 'text-green-500',
      bgColor: 'bg-green-900/20',
      borderColor: 'border-green-900',
      accentColor: '#10b981' // Green
    },
    'linac-anatomy': {
      variant: 'qa',
      color: 'text-amber-500',
      bgColor: 'bg-amber-900/20',
      borderColor: 'border-amber-900',
      accentColor: '#f59e0b' // Amber
    },
    'dosimetry': {
      variant: 'clinical',
      color: 'text-pink-500',
      bgColor: 'bg-pink-900/20',
      borderColor: 'border-pink-900',
      accentColor: '#ec4899' // Pink
    }
  };
  
  return domainThemes[domain] || domainThemes['treatment-planning'];
}

/**
 * Gets the Tailwind classes for a specified extension type
 */
export function getExtensionClasses(extensionType: string) {
  const theme = extensionTypeToTheme[extensionType as keyof typeof extensionTypeToTheme] || 
                extensionTypeToTheme['calculation'];
                
  return {
    container: `${theme.bgColor} border ${theme.borderColor}`,
    text: theme.color,
    accent: theme.accentColor,
    variant: theme.variant,
    dialogueMode: theme.dialogueMode,
    bgColor: theme.bgColor
  };
} 