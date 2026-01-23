// Version Management Utility

export interface VersionInfo {
  version: string;
  buildDate: string;
  environment: 'development' | 'staging' | 'production';
}

export interface ChangelogEntry {
  version: string;
  date: string;
  changes: string[];
  type: 'major' | 'minor' | 'patch';
}

// Current version info
export const CURRENT_VERSION: VersionInfo = {
  version: "1.3.0-dev",
  buildDate: "2026-01-22",
  environment: "development",
};

// Changelog - only recent entries
export const CHANGELOG_ENTRIES: ChangelogEntry[] = [
  {
    version: "v1.3.0-dev",
    date: "2026-01-22",
    type: "minor",
    changes: [
      "Character creator with modular sprite composition",
      "Book/journal popup with reward collection system",
      "Anthro 'SUPER SLAB MODE' transformation animation",
      "ESC key journal access from anywhere after collection",
      "Questrium splash animation during fade-in",
      "Dev mode preset character + debug shortcuts"
    ]
  },
  {
    version: "v1.2.0-dev",
    date: "2026-01-06",
    type: "minor",
    changes: [
      "Modular audio system with SFX and background music",
      "Title screen parallax clouds and shooting stars",
      "TBI result animation with pass/fail evaluation",
      "Keyboard-only comp activity navigation",
      "Anti-mashing input protection for TBI flow",
      "UX polish: petting, climbing zones, modal hints"
    ]
  },
  {
    version: "v1.1.0-dev",
    date: "2025-12-16",
    type: "minor",
    changes: [
      "TBI positioning activity with arrow key navigation",
      "Anthro intro dialogue sequence",
      "Computer screen fade transitions",
      "TBI result animation sequence",
      "Major codebase cleanup and simplification"
    ]
  },
  {
    version: "v1.0.0-dev",
    date: "2025-11-06",
    type: "major",
    changes: [
      "Complete rescope to night phase constellation learning"
    ]
  }
];

// Utility functions
export const getCurrentVersionString = (): string => {
  return `The Observatory ${CURRENT_VERSION.version}`;
};

export const getVersionWithBuild = (): string => {
  return `${CURRENT_VERSION.version} (${CURRENT_VERSION.buildDate})`;
};
