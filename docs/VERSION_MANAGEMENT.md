# Version Management System

This document describes the version management and changelog system for Rogue Resident.

## Overview

The version management system provides:
- Centralized version information
- Automated changelog updates
- Playtester-friendly update notifications
- Easy version bumping workflow

## Components

### 1. Version Manager (`app/utils/versionManager.ts`)
- Centralized version and changelog data
- Utility functions for version operations
- Type definitions for changelog entries

### 2. Changelog Popup (`app/components/ui/ChangelogPopup.tsx`)
- User-friendly changelog display
- Integrated into title screen
- Shows recent updates with visual categorization

### 3. Update Script (`scripts/update-version.js`)
- Automated version bumping
- Changelog entry creation
- Git integration for commit hashes

## Usage

### For Developers

#### Updating Versions
Use the provided npm scripts for version updates:

```bash
# Patch version (0.1.0 → 0.1.1) - Bug fixes
npm run version:patch "Fixed constellation display issue"

# Minor version (0.1.0 → 0.2.0) - New features
npm run version:minor "Added new tutorial system"

# Major version (0.1.0 → 1.0.0) - Breaking changes
npm run version:major "Complete gameplay overhaul"
```

#### Manual Updates
You can also run the script directly:

```bash
node scripts/update-version.js patch "Description of changes"
```

#### Adding Detailed Changelog Entries
For more complex updates, manually edit `app/utils/versionManager.ts`:

```typescript
{
  version: "v0.2.0-dev",
  date: "2024-12-19",
  type: "minor",
  highlights: [
    "New tutorial system",
    "Enhanced hospital environment",
    "Improved performance"
  ],
  changes: [
    "Added comprehensive tutorial system with interactive dialogue flows",
    "Implemented isometric hospital backdrop with room navigation",
    "Enhanced TPS visualization with dose calculations",
    "Optimized rendering performance for smooth gameplay",
    "Fixed various UI inconsistencies and bugs"
  ]
}
```

### For Playtesters

#### Viewing Updates
1. Launch the game
2. Click "What's New" button on title screen
3. Browse recent changes and improvements

#### Update Indicators
- "New" badge appears when recent updates are available
- Badge automatically disappears after a week
- Version information shown at bottom of title screen

## File Structure

```
app/
├── utils/
│   └── versionManager.ts          # Central version data
├── components/
│   └── ui/
│       └── ChangelogPopup.tsx     # Changelog UI component
docs/
└── VERSION_MANAGEMENT.md          # This documentation
scripts/
└── update-version.js              # Version update automation
```

## Changelog Entry Types

### Type Classification
- **Major**: Breaking changes, complete overhauls
- **Minor**: New features, significant improvements
- **Patch**: Bug fixes, small tweaks

### Visual Indicators
- Major: Purple badge with highlight color
- Minor: Treatment planning color badge
- Patch: Active color badge

## Best Practices

### Version Updates
1. Always include descriptive change messages
2. Use appropriate version bump types
3. Test changes before committing
4. Update highlights for major/minor releases

### Changelog Entries
1. Write user-friendly descriptions
2. Focus on player-visible changes
3. Group related changes together
4. Use present tense ("Added", "Fixed", "Improved")

### Playtester Communication
1. Keep entries concise but informative
2. Highlight key improvements first
3. Mention bug fixes that affect gameplay
4. Use emojis sparingly for visual appeal

## Integration Points

### Title Screen
- "What's New" button with conditional "New" badge
- Version string display at bottom
- Popup overlay for changelog viewing

### Version Detection
- `hasRecentUpdates()` checks for updates within 7 days
- Automatic badge display/hiding
- Build date and commit hash tracking

## Future Enhancements

### Planned Features
- [ ] Release notes export for documentation
- [ ] Automatic version tagging with git
- [ ] Integration with build pipeline
- [ ] Player feedback collection on updates
- [ ] Update notification persistence

### Considerations
- Version history archiving
- Localization support for changelog
- Integration with analytics for update engagement
- Automated testing of version update process

## Troubleshooting

### Common Issues
1. **Script fails to run**: Ensure Node.js is installed and script is executable
2. **Git hash not found**: Ensure you're in a git repository with commits
3. **Version format errors**: Check that package.json has valid semver format

### Manual Recovery
If automated updates fail, manually update:
1. `package.json` version field
2. `CURRENT_VERSION` in `versionManager.ts`
3. Add new entry to `CHANGELOG_ENTRIES` array

## Deployment Troubleshooting

### When Deployed Version Differs from Local Development

**Symptom**: Changelog shows correct version but deployed features don't match local development.

**Root Cause**: Critical files modified locally but never committed to git.

### Systematic Debugging Process

1. **Check Git Status First**
   ```bash
   git status
   ```
   Look for:
   - **Modified files**: Core system files that aren't committed
   - **Untracked files**: New assets, components, or features
   - **Deleted files**: Components that need to be removed from git

2. **Identify Critical Missing Files**
   Common categories that cause deployment issues:
   - **Core Components**: Main game containers, scene management
   - **Environmental Assets**: Images, sprites, audio files
   - **Store Updates**: State management changes
   - **Type Definitions**: TypeScript interfaces and enums
   - **Dependencies**: Updated package-lock.json

3. **Check for Import Errors**
   Build logs may show warnings like:
   ```
   Attempted import error: 'ComponentName' is not exported from 'path'
   ```
   These can cause runtime failures even if the build succeeds.

### Real-World Example (v0.5.0 Deployment Issue)

**Problem**: 
- Local dev showed complete v0.5.0 hospital environment features
- Deployment showed old version despite correct changelog

**Investigation**:
```bash
git status
# Revealed 50+ untracked files and 20+ modified files
```

**Solution Required 2 Commits**:

**First Commit** - Core environmental system:
```bash
git add app/components/hospital/HospitalBackdrop.tsx
git add public/images/ambient/ public/images/weather/ public/images/pond/
git add app/store/ app/utils/spriteMap.ts
git commit -m "Add missing v0.5.0 hospital environment files and assets"
```

**Second Commit** - Supporting systems:
```bash
git add app/components/scenes/ app/components/dialogue/
git add app/components/tutorial/ app/page.tsx
git add public/images/characters/portraits/ package-lock.json
git commit -m "Fix deployment inconsistencies - Add remaining core system files"
```

### Prevention Strategies

1. **Regular Git Status Checks**
   - Check `git status` before pushing version updates
   - Verify all modified files are intentionally excluded
   - Use descriptive commit messages for easier tracking

2. **Pre-Deployment Checklist**
   ```bash
   # 1. Check for untracked files
   git status
   
   # 2. Verify core systems are committed
   git log --oneline -5
   
   # 3. Test build locally
   npm run build
   
   # 4. Push to trigger deployment
   git push origin main
   ```

3. **Asset Management Best Practices**
   - Commit environmental assets (images, sprites) with feature code
   - Don't assume new files are automatically tracked
   - Include asset requirements in changelog entries

4. **Import Debugging**
   ```bash
   # Check for import issues in build logs
   npm run build 2>&1 | grep "import error"
   
   # Verify exports exist in target files
   grep -r "export.*ComponentName" app/
   ```

### Debugging Commands

```bash
# Check what files are different between local and last commit
git diff --name-only

# See all untracked files
git ls-files --others --exclude-standard

# Check if specific file is tracked
git ls-files app/components/hospital/HospitalBackdrop.tsx

# Verify what's been committed in recent commits
git log --stat -3
```

### Recovery from Deployment Issues

If deployment doesn't match local development:

1. **Immediate Assessment**
   ```bash
   git status > deployment-debug.txt
   git diff --name-only >> deployment-debug.txt
   ```

2. **Systematic File Addition**
   - Add core system files first
   - Add assets and dependencies second  
   - Test deployment after each major commit

3. **Verification**
   - Wait 2-3 minutes for deployment
   - Test specific features that were missing
   - Check browser console for runtime errors

### Lessons Learned

- **Never assume files are tracked**: Always verify with `git status`
- **Assets matter**: Untracked images/sprites break features silently
- **Import paths are critical**: Wrong paths cause runtime failures
- **Multiple commits are okay**: Better to deploy incrementally than miss files
- **Build warnings != runtime success**: Pay attention to import warnings

## Examples

### Quick Bug Fix
```bash
npm run version:patch "Fixed star positioning in constellation view"
```

### Feature Release
```bash
npm run version:minor "Added comprehensive question filtering system"
```

### Major Update
```bash
npm run version:major "Redesigned entire hospital navigation system"
``` 