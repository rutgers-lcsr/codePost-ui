// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
/**
 * SINGLE SOURCE OF TRUTH FOR ALL COLORS
 *
 * This file defines all color tokens used throughout the application.
 * Colors are automatically synced to:
 * - SCSS files (via :export in _colors.scss)
 * - Ant Design theme configuration
 * - TypeScript/TSX components
 *
 * To change a color, update it here and it will propagate everywhere.
 */

// ============================================================================
// Brand Colors
// ============================================================================
export const brandColors = {
  primary: '#198665', // WCAG AA compliant with white text
  light: '#f0fff6',
  vibrant: '#48cc98',
  dark: '#17996e',
  accent: '#4e78ff',
  black: '#1b1b1b',
  blackHighlight: '#0f0f0f',
} as const;

// ============================================================================
// Action Colors (for buttons, states, etc.)
// ============================================================================
export const actionColors = {
  blue: '#1890ff',
  blueFade: '#40a9ff',
  green: '#198665', // WCAG AA compliant with white text
  greenFade: '#48cc98',
  yellow: '#ffbf00',
  yellowFade: '#ffd129',
  red: '#f64852',
  redFade: '#ff7375',
} as const;

// ============================================================================
// Green Palette
// ============================================================================
export const greenPalette = {
  green1: '#f0fff6',
  green2: '#caf2df',
  green3: '#9ce6c3',
  green4: '#71d9ac',
  green5: '#48cc98',
  green6: '#198665', // Brand primary (WCAG AA compliant)
  green7: '#17996e',
  green8: '#0d7354',
  green9: '#034d39',
  green10: '#02261e',
} as const;

// ============================================================================
// Neutral Colors - Light Background
// ============================================================================
export const neutralColors = {
  title: 'rgba(0, 0, 0, 0.8)',
  mainText: 'rgba(0, 0, 0, 0.7)',
  secondaryText: 'rgba(0, 0, 0, 0.6)',
  disable: 'rgba(0, 0, 0, 0.3)',
  border: 'rgba(0, 0, 0, 0.2)',
  divider: 'rgba(0, 0, 0, 0.1)',
  background: 'rgba(0, 0, 0, 0.05)',
} as const;

// ============================================================================
// Neutral Colors - Dark Background
// ============================================================================
export const neutralDarkColors = {
  title: 'rgba(255, 255, 255, 1)',
  mainText: 'rgba(255, 255, 255, 0.9)',
  secondaryText: 'rgba(255, 255, 255, 0.7)',
  disable: 'rgba(255, 255, 255, 0.5)',
  border: 'rgba(255, 255, 255, 0.3)',
  divider: 'rgba(255, 255, 255, 0.2)',
  background: 'rgba(255, 255, 255, 0.1)',
} as const;

// ============================================================================
// ALL COLORS - Flat export for easy access
// ============================================================================
export const colors = {
  // Brand
  brandPrimary: brandColors.primary,
  brandLight: brandColors.light,
  brandVibrant: brandColors.vibrant,
  brandDark: brandColors.dark,
  brandAccent: brandColors.accent,
  brandBlack: brandColors.black,
  brandBlackHighlight: brandColors.blackHighlight,

  // Actions
  actionBlue: actionColors.blue,
  actionBlueFade: actionColors.blueFade,
  actionGreen: actionColors.green,
  actionGreenFade: actionColors.greenFade,
  actionYellow: actionColors.yellow,
  actionYellowFade: actionColors.yellowFade,
  actionRed: actionColors.red,
  actionRedFade: actionColors.redFade,

  // Green Palette
  ...greenPalette,

  // Neutral Light
  neutralTitle: neutralColors.title,
  neutralMainText: neutralColors.mainText,
  neutralSecondaryText: neutralColors.secondaryText,
  neutralDisable: neutralColors.disable,
  neutralBorder: neutralColors.border,
  neutralDivider: neutralColors.divider,
  neutralBackground: neutralColors.background,

  // Neutral Dark
  neutralDarkTitle: neutralDarkColors.title,
  neutralDarkMainText: neutralDarkColors.mainText,
  neutralDarkSecondaryText: neutralDarkColors.secondaryText,
  neutralDarkDisable: neutralDarkColors.disable,
  neutralDarkBorder: neutralDarkColors.border,
  neutralDarkDivider: neutralDarkColors.divider,
  neutralDarkBackground: neutralDarkColors.background,
} as const;

// Type for color keys - useful for strict typing
export type ColorKey = keyof typeof colors;

// Default export for convenience
export default colors;
