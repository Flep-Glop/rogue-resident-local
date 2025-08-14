export interface RoomBackgroundConfig {
  backgroundImage?: string;
  foregroundImage?: string; // New: for depth layering
  fallbackGradient: string;
  atmosphere?: {
    overlay?: string;
    lighting?: string;
  };
}

// Room background configurations
export const ROOM_BACKGROUNDS: Record<string, RoomBackgroundConfig> = {
  'physics-office': {
    backgroundImage: '/images/hospital/backgrounds/physics-office-blur.png',
    // Removed foregroundImage reference - file doesn't exist
    fallbackGradient: 'linear-gradient(135deg, #3B82F6 0%, #60A5FA 50%, #1e1b4b 100%)',
    atmosphere: {
      overlay: 'radial-gradient(circle at 30% 40%, rgba(59, 130, 246, 0.1) 0%, transparent 60%)',
      lighting: 'warm academic'
    }
  },
  
  'linac-1': {
    backgroundImage: '/images/hospital/backgrounds/linac-room.png',
    // foregroundImage: '/images/hospital/backgrounds/linac-room-foreground.png', // Ready for future foreground layer!
    fallbackGradient: 'linear-gradient(135deg, #10B981 0%, #34D399 50%, #1e1b4b 100%)',
    atmosphere: {
      overlay: 'radial-gradient(circle at 50% 30%, rgba(16, 185, 129, 0.1) 0%, transparent 60%)',
      lighting: 'clean medical precision'
    }
  },
  
  'linac-2': {
    backgroundImage: '/images/hospital/backgrounds/linac-room.png',
    // foregroundImage: '/images/hospital/backgrounds/linac-room-foreground.png', // Ready for future foreground layer!
    fallbackGradient: 'linear-gradient(135deg, #F59E0B 0%, #FBBF24 50%, #1e1b4b 100%)',
    atmosphere: {
      overlay: 'radial-gradient(circle at 40% 35%, rgba(245, 158, 11, 0.12) 0%, transparent 65%)',
      lighting: 'technical precision'
    }
  },
  
  'dosimetry-lab': {
    backgroundImage: '/images/hospital/backgrounds/labratory-background.png',
    foregroundImage: '/images/hospital/backgrounds/labratory-foreground.png',
    fallbackGradient: 'linear-gradient(135deg, #EC4899 0%, #F472B6 50%, #1e1b4b 100%)',
    atmosphere: {
      overlay: 'radial-gradient(circle at 70% 40%, rgba(236, 72, 153, 0.1) 0%, transparent 60%)',
      lighting: 'laboratory blue-green'
    }
  },
  
  'simulation-suite': {
    backgroundImage: '/images/hospital/backgrounds/ct sim.png',
    foregroundImage: '/images/hospital/backgrounds/simulation-suite-foreground.png', // Ready for when you create it!
    fallbackGradient: 'linear-gradient(135deg, #F59E0B 0%, #FBBF24 50%, #1e1b4b 100%)',
    atmosphere: {
      overlay: 'radial-gradient(circle at 60% 50%, rgba(245, 158, 11, 0.1) 0%, transparent 60%)',
      lighting: 'modern tech'
    }
  }
};

// Default background for unknown rooms
export const DEFAULT_ROOM_BACKGROUND: RoomBackgroundConfig = {
  fallbackGradient: 'linear-gradient(to bottom, #1a1a2e, #16213e, #0f3460)',
  atmosphere: {
    overlay: 'radial-gradient(circle at 20% 30%, rgba(76, 0, 255, 0.1) 0%, transparent 40%)',
    lighting: 'default'
  }
};

// Helper function to get room background config
export function getRoomBackground(roomId: string | undefined): RoomBackgroundConfig {
  if (!roomId) return DEFAULT_ROOM_BACKGROUND;
  return ROOM_BACKGROUNDS[roomId] || DEFAULT_ROOM_BACKGROUND;
}

// Helper function to get CSS background styles  
export function getRoomBackgroundStyles(roomId: string | undefined): string {
  const config = getRoomBackground(roomId);
  
  // Use background image if available, fallback to gradient
  if (config.backgroundImage) {
    return `
      background-image: 
        ${config.atmosphere?.overlay || ''},
        url('${config.backgroundImage}');
      background-size: cover;
      background-position: center;
      background-repeat: no-repeat;
    `.trim();
  }
  
  return `
    background: ${config.fallbackGradient};
    ${config.atmosphere?.overlay ? `
      &::before {
        content: '';
        position: absolute;
        inset: 0;
        background: ${config.atmosphere.overlay};
        pointer-events: none;
        z-index: 1;
      }
    ` : ''}
  `.trim();
} 