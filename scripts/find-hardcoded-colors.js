#!/usr/bin/env node

/**
 * Color Migration Helper
 * 
 * This script helps find hardcoded color values in your codebase
 * and suggests replacements from the centralized color system.
 * 
 * Usage:
 *   node scripts/find-hardcoded-colors.js
 * 
 * Or add to package.json:
 *   "scripts": {
 *     "find-colors": "node scripts/find-hardcoded-colors.js"
 *   }
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Color mappings from hex/rgba to token names
const colorMappings = {
    // Brand colors
    '#24be85': 'colors.brandPrimary',
    '#f0fff6': 'colors.brandLight',
    '#48cc98': 'colors.brandVibrant',
    '#17996e': 'colors.brandDark',
    '#4e78ff': 'colors.brandAccent',
    '#1b1b1b': 'colors.brandBlack',
    '#0f0f0f': 'colors.brandBlackHighlight',

    // Action colors
    '#1890ff': 'colors.actionBlue',
    '#40a9ff': 'colors.actionBlueFade',
    '#ffbf00': 'colors.actionYellow',
    '#ffd129': 'colors.actionYellowFade',
    '#f64852': 'colors.actionRed',
    '#ff7375': 'colors.actionRedFade',

    // Neutral colors
    'rgba(0, 0, 0, 0.8)': 'colors.neutralTitle',
    'rgba(0, 0, 0, 0.7)': 'colors.neutralMainText',
    'rgba(0, 0, 0, 0.5)': 'colors.neutralSecondaryText',
    'rgba(0, 0, 0, 0.3)': 'colors.neutralDisable',
    'rgba(0, 0, 0, 0.2)': 'colors.neutralBorder',
    'rgba(0, 0, 0, 0.1)': 'colors.neutralDivider',
    'rgba(0, 0, 0, 0.05)': 'colors.neutralBackground',

    // Dark neutral colors
    'rgba(255, 255, 255, 1)': 'colors.neutralDarkTitle',
    'rgba(255, 255, 255, 0.9)': 'colors.neutralDarkMainText',
    'rgba(255, 255, 255, 0.7)': 'colors.neutralDarkSecondaryText',
    'rgba(255, 255, 255, 0.5)': 'colors.neutralDarkDisable',
    'rgba(255, 255, 255, 0.3)': 'colors.neutralDarkBorder',
    'rgba(255, 255, 255, 0.2)': 'colors.neutralDarkDivider',
    'rgba(255, 255, 255, 0.1)': 'colors.neutralDarkBackground',
};

// Patterns to search for
const hexColorPattern = /#[0-9a-fA-F]{6}\b/g;
const rgbaPattern = /rgba\([^)]+\)/g;

console.log('🔍 Searching for hardcoded colors in TypeScript/TSX files...\n');

// Search for each color
Object.keys(colorMappings).forEach(color => {
    const tokenName = colorMappings[color];
    const escapedColor = color.replace(/[(),.]/g, '\\$&').replace(/ /g, '\\s*');

    try {
        // Use ripgrep if available, otherwise use grep
        let command;
        try {
            execSync('which rg', { stdio: 'ignore' });
            command = `rg --type-add 'web:*.{ts,tsx}' -t web -i '${escapedColor}' src/`;
        } catch {
            command = `grep -r --include="*.tsx" --include="*.ts" -i '${color}' src/`;
        }

        const output = execSync(command, { encoding: 'utf8', stdio: 'pipe' });

        if (output.trim()) {
            console.log(`\n📍 Found: ${color}`);
            console.log(`   Suggest: ${tokenName}`);
            console.log('   Locations:');
            console.log(output.split('\n').slice(0, 5).map(line => `     ${line}`).join('\n'));

            if (output.split('\n').length > 6) {
                console.log(`     ... and ${output.split('\n').length - 6} more`);
            }
        }
    } catch (error) {
        // No matches found, or error - that's okay
    }
});

console.log('\n✅ Scan complete!\n');
console.log('To fix these issues:');
console.log('  1. Import colors: import { colors } from "@/theme/colors";');
console.log('  2. Replace hardcoded values with tokens');
console.log('  3. Example: "#24be85" → colors.brandPrimary\n');
