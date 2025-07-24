// Version Management Utility
// This file centralizes version information and makes it easy to update versions

export interface VersionInfo {
  version: string;
  buildDate: string;
  environment: 'development' | 'staging' | 'production';
  commitHash?: string;
}

export interface ChangelogEntry {
  version: string;
  date: string;
  changes: string[];
  type: 'major' | 'minor' | 'patch';
  highlights?: string[]; // Key features to highlight
}

// Current version info - update this when releasing new versions
export const CURRENT_VERSION: VersionInfo = {
  version: "0.6.0-dev",
  buildDate: "2025-07-24",
  environment: "development",
  commitHash: "437db3b" // Latest commit from git log
};

// Changelog entries - add new entries at the top
export const CHANGELOG_ENTRIES: ChangelogEntry[] = [
  {
    version: "v0.6.0-dev",
    date: "2025-07-24",
    type: "minor",
    changes: [
      "Interface Revolution Complete - PNG-based strategic gameplay interface achieving Coworker Ready status"
    ]
  },
  {
    version: "v0.5.1-dev",
    date: "2025-07-15",
    type: "patch",
    changes: [
      "Enable dev console in production deployment"
    ]
  },
  {
    version: "v0.5.0-dev",
    date: "2025-07-05",
    type: "minor",
    changes: [
      "Complete hospital environment system with atmospheric lighting, weather particles, pond ripples, and enhanced visual polish"
    ]
  },
  {
    version: "v0.4.0-dev",
    date: "2025-06-25",
    type: "minor",
    changes: [
      "Enhanced hospital environment with interactive ambient creatures and tutorial integration"
    ]
  },
  {
    version: "v0.3.0-dev",
    date: "2025-06-25",
    type: "minor",
    highlights: [
      "Authentic character dialogue system",
      "Interactive hospital exploration",
      "Living environment with creature animations",
      "Full keyboard navigation support"
    ],
    changes: [
      "Implemented sophisticated character voice framework with authentic workplace dialogue",
      "Added multi-character lunch scene with branching narrative paths and colleague dynamics",
      "Created stage direction parsing system for enhanced dialogue presentation",
      "Added interactive hospital overlay that fades on hover to reveal interior rooms",
      "Implemented comprehensive ambient creature animation system (birds, people, deer, small animals)",
      "Added full keyboard navigation for dialogue with arrow keys and spacebar controls",
      "Enhanced tutorial flow with streamlined 'Begin Residency' entry and dev mode access",
      "Created cafeteria room for team gathering scenes with proper tutorial integration",
      "Fixed room tooltip behavior and hover state issues for improved user experience",
      "Established scalable sprite animation framework with proper scaling architecture"
    ]
  },
  {
    version: "v0.2.0-dev",
    date: "2025-06-23",
    type: "minor",
    changes: [
      "Added comprehensive version management system with changelog popup"
    ]
  },
  {
    version: "v0.1.0-dev",
    date: "2024-12-19",
    type: "minor",
    highlights: [
      "Tutorial system with interactive dialogue",
      "Isometric hospital environment",
      "Enhanced TPS visualization"
    ],
    changes: [
      "Added comprehensive tutorial system with interactive dialogue flows",
      "Implemented isometric hospital backdrop with room navigation",
      "Enhanced TPS (Treatment Planning System) visualization with dose calculations",
      "Added comprehensive question type system for medical physics education",
      "Improved constellation knowledge mapping with star connections and animations",
      "Added chibi character sprites and enhanced visual design system",
      "Implemented version changelog system for playtester feedback",
      "Enhanced debug console with game state management tools"
    ]
  },
  {
    version: "v0.0.9",
    date: "2024-11-15",
    type: "patch",
    changes: [
      "Fixed constellation star positioning and animation timing issues",
      "Enhanced pixel art theme consistency across all UI components",
      "Improved loading transitions between different game phases",
      "Added comprehensive debug console for development and testing",
      "Optimized performance for smooth gameplay experience"
    ]
  },
  {
    version: "v0.0.8",
    date: "2024-11-01",
    type: "minor",
    highlights: [
      "Hospital environment foundation",
      "Mentor relationship system",
      "Core dialogue architecture"
    ],
    changes: [
      "Initial hospital environment implementation with room system",
      "Basic mentor relationship system with personality profiles",
      "Foundation dialogue system architecture with branching conversations",
      "Core game state management implemented with Zustand",
      "Established pixel art visual design language and theme system"
    ]
  }
];

// Utility functions
export const getCurrentVersionString = (): string => {
  return `Rogue Resident ${CURRENT_VERSION.version} - Educational Medical Physics Game`;
};

export const getVersionWithBuild = (): string => {
  return `${CURRENT_VERSION.version} (${CURRENT_VERSION.buildDate})`;
};

export const getLatestChanges = (count: number = 3): ChangelogEntry[] => {
  return CHANGELOG_ENTRIES.slice(0, count);
};

export const hasRecentUpdates = (daysSince: number = 7): boolean => {
  const latest = CHANGELOG_ENTRIES[0];
  if (!latest) return false;
  
  const latestDate = new Date(latest.date);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - latestDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays <= daysSince;
};

// For development: helper to generate version bump
export const generateNextVersion = (currentVersion: string, type: 'major' | 'minor' | 'patch'): string => {
  const versionRegex = /^v?(\d+)\.(\d+)\.(\d+)(-.*)?$/;
  const match = currentVersion.match(versionRegex);
  
  if (!match) {
    throw new Error(`Invalid version format: ${currentVersion}`);
  }
  
  let [, major, minor, patch, suffix] = match;
  let newMajor = parseInt(major);
  let newMinor = parseInt(minor);
  let newPatch = parseInt(patch);
  
  switch (type) {
    case 'major':
      newMajor++;
      newMinor = 0;
      newPatch = 0;
      break;
    case 'minor':
      newMinor++;
      newPatch = 0;
      break;
    case 'patch':
      newPatch++;
      break;
  }
  
  return `v${newMajor}.${newMinor}.${newPatch}${suffix || ''}`;
};

// Development helper: log version info
export const logVersionInfo = (): void => {
  console.log('🎮 Rogue Resident Version Info:');
  console.log(`   Version: ${CURRENT_VERSION.version}`);
  console.log(`   Build Date: ${CURRENT_VERSION.buildDate}`);
  console.log(`   Environment: ${CURRENT_VERSION.environment}`);
  console.log(`   Commit: ${CURRENT_VERSION.commitHash || 'unknown'}`);
  console.log(`   Recent Updates: ${hasRecentUpdates() ? 'Yes' : 'No'}`);
}; 