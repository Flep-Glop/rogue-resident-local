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
  version: "1.1.0-dev",
  buildDate: "2025-12-16",
  environment: "development",
};

// Changelog - only recent entries
export const CHANGELOG_ENTRIES: ChangelogEntry[] = [
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
  return `Rogue Resident ${CURRENT_VERSION.version}`;
};

export const getVersionWithBuild = (): string => {
  return `${CURRENT_VERSION.version} (${CURRENT_VERSION.buildDate})`;
};
