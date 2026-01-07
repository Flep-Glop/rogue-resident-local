#!/usr/bin/env node

/**
 * Version Update Script for The Observatory
 * 
 * Usage:
 *   node scripts/update-version.js patch "Fixed bug with constellation display"
 *   node scripts/update-version.js minor "Added new tutorial system"
 *   node scripts/update-version.js major "Complete gameplay overhaul"
 * 
 * This script:
 * 1. Updates the version number in package.json
 * 2. Updates the version manager with new changelog entry
 * 3. Gets the latest git commit hash
 * 4. Updates build date
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PACKAGE_JSON_PATH = path.join(__dirname, '..', 'package.json');
const VERSION_MANAGER_PATH = path.join(__dirname, '..', 'app', 'utils', 'versionManager.ts');

function getCurrentGitCommit() {
  try {
    return execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
  } catch (error) {
    console.warn('Could not get git commit hash:', error.message);
    return 'unknown';
  }
}

function getCurrentDate() {
  return new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
}

function bumpVersion(currentVersion, type) {
  const versionRegex = /^(\d+)\.(\d+)\.(\d+)(-.*)?$/;
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
    default:
      throw new Error(`Invalid bump type: ${type}. Use 'major', 'minor', or 'patch'.`);
  }
  
  return `${newMajor}.${newMinor}.${newPatch}${suffix || ''}`;
}

function updatePackageJson(newVersion) {
  const packageJson = JSON.parse(fs.readFileSync(PACKAGE_JSON_PATH, 'utf8'));
  packageJson.version = newVersion;
  fs.writeFileSync(PACKAGE_JSON_PATH, JSON.stringify(packageJson, null, 2) + '\n');
  console.log(`✅ Updated package.json version to ${newVersion}`);
}

function updateVersionManager(newVersion, changeDescription, bumpType) {
  const content = fs.readFileSync(VERSION_MANAGER_PATH, 'utf8');
  const commitHash = getCurrentGitCommit();
  const currentDate = getCurrentDate();
  
  // Update CURRENT_VERSION
  const versionInfoRegex = /export const CURRENT_VERSION: VersionInfo = \{[\s\S]*?\};/;
  const newVersionInfo = `export const CURRENT_VERSION: VersionInfo = {
  version: "${newVersion}-dev",
  buildDate: "${currentDate}",
  environment: "development",
  commitHash: "${commitHash}" // Latest commit from git log
};`;
  
  let updatedContent = content.replace(versionInfoRegex, newVersionInfo);
  
  // Add new changelog entry at the top of CHANGELOG_ENTRIES
  const changelogRegex = /(export const CHANGELOG_ENTRIES: ChangelogEntry\[\] = \[)/;
  const newChangelogEntry = `  {
    version: "v${newVersion}-dev",
    date: "${currentDate}",
    type: "${bumpType}",
    changes: [
      "${changeDescription}"
    ]
  },`;
  
  updatedContent = updatedContent.replace(changelogRegex, `$1\n${newChangelogEntry}`);
  
  fs.writeFileSync(VERSION_MANAGER_PATH, updatedContent);
  console.log(`✅ Updated version manager with v${newVersion}-dev`);
  console.log(`📝 Added changelog entry: "${changeDescription}"`);
}

function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.error('❌ Usage: node scripts/update-version.js <major|minor|patch> "<description>"');
    console.error('   Example: node scripts/update-version.js patch "Fixed constellation display bug"');
    process.exit(1);
  }
  
  const [bumpType, changeDescription] = args;
  
  if (!['major', 'minor', 'patch'].includes(bumpType)) {
    console.error('❌ Bump type must be "major", "minor", or "patch"');
    process.exit(1);
  }
  
  if (!changeDescription || changeDescription.trim().length === 0) {
    console.error('❌ Change description is required');
    process.exit(1);
  }
  
  try {
    // Read current version from package.json
    const packageJson = JSON.parse(fs.readFileSync(PACKAGE_JSON_PATH, 'utf8'));
    const currentVersion = packageJson.version;
    const newVersion = bumpVersion(currentVersion, bumpType);
    
    console.log(`🚀 Updating version from ${currentVersion} to ${newVersion}`);
    console.log(`📋 Change type: ${bumpType}`);
    console.log(`📝 Description: ${changeDescription}`);
    console.log('');
    
    // Update files
    updatePackageJson(newVersion);
    updateVersionManager(newVersion, changeDescription, bumpType);
    
    console.log('');
    console.log('✨ Version update complete!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Review the changes in app/utils/versionManager.ts');
    console.log('2. Add any additional changelog entries if needed');
    console.log('3. Test the application');
    console.log('4. Commit your changes');
    
  } catch (error) {
    console.error('❌ Error updating version:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { bumpVersion, getCurrentGitCommit, getCurrentDate }; 