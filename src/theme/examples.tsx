/**
 * Color Usage Examples
 *
 * This file demonstrates best practices for using the centralized color system
 */

import React from 'react';
import { colors, brandColors, actionColors } from './colors';
import { Button } from 'antd';

// ============================================================================
// Example 1: Using colors in inline styles
// ============================================================================
export const InlineStyleExample = () => {
  return (
    <div
      style={{
        backgroundColor: colors.brandLight,
        color: colors.brandPrimary,
        border: `1px solid ${colors.neutralBorder}`,
        padding: '16px',
      }}
    >
      This uses centralized color tokens
    </div>
  );
};

// ============================================================================
// Example 2: Using color groups for related colors
// ============================================================================
export const ColorGroupExample = () => {
  return (
    <div>
      <div style={{ color: brandColors.primary }}>Primary Brand Color</div>
      <div style={{ color: brandColors.dark }}>Dark Brand Color</div>
      <div style={{ color: actionColors.blue }}>Action Blue</div>
    </div>
  );
};

// ============================================================================
// Example 3: Creating styled objects with colors
// ============================================================================
const buttonStyles = {
  primary: {
    backgroundColor: colors.brandPrimary,
    color: '#ffffff',
    border: `1px solid ${colors.brandDark}`,
  },
  secondary: {
    backgroundColor: 'transparent',
    color: colors.brandPrimary,
    border: `1px solid ${colors.brandPrimary}`,
  },
  danger: {
    backgroundColor: colors.actionRed,
    color: '#ffffff',
    border: `1px solid ${colors.actionRedFade}`,
  },
};

export const StyledObjectExample = () => {
  return (
    <div>
      <button style={buttonStyles.primary}>Primary</button>
      <button style={buttonStyles.secondary}>Secondary</button>
      <button style={buttonStyles.danger}>Danger</button>
    </div>
  );
};

// ============================================================================
// Example 4: Dynamic color selection
// ============================================================================
interface StatusBadgeProps {
  status: 'success' | 'warning' | 'error' | 'info';
  children: React.ReactNode;
}

const statusColors = {
  success: colors.actionGreen,
  warning: colors.actionYellow,
  error: colors.actionRed,
  info: colors.actionBlue,
} as const;

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, children }) => {
  return (
    <span
      style={{
        backgroundColor: statusColors[status],
        color: '#ffffff',
        padding: '4px 8px',
        borderRadius: '4px',
      }}
    >
      {children}
    </span>
  );
};

// ============================================================================
// Example 5: Using with Ant Design components (they use theme automatically)
// ============================================================================
export const AntdExample = () => {
  return (
    <div>
      {/* These automatically use the theme colors from src/theme/index.ts */}
      <Button type="primary">Uses theme colorPrimary</Button>
      <Button type="default">Uses theme defaults</Button>
      <Button danger>Uses theme colorError</Button>

      {/* But you can still override with color tokens */}
      <Button style={{ backgroundColor: colors.brandAccent }}>Custom Color</Button>
    </div>
  );
};

// ============================================================================
// Example 6: Type-safe color helper
// ============================================================================
type ColorName = keyof typeof colors;

export const getColor = (colorName: ColorName): string => {
  return colors[colorName];
};

// Usage:
// const myColor = getColor('brandPrimary'); // ✅ Type-safe
// const badColor = getColor('notAColor'); // ❌ TypeScript error

// ============================================================================
// Example 7: Creating theme variants
// ============================================================================
export const createButtonTheme = (baseColor: string, textColor: string = '#ffffff') => ({
  default: {
    backgroundColor: baseColor,
    color: textColor,
    border: `1px solid ${baseColor}`,
  },
  hover: {
    backgroundColor: baseColor,
    opacity: 0.8,
    color: textColor,
  },
  active: {
    backgroundColor: baseColor,
    opacity: 0.6,
    color: textColor,
  },
});

// Usage:
export const greenButtonTheme = createButtonTheme(colors.brandPrimary);
export const blueButtonTheme = createButtonTheme(colors.actionBlue);
export const redButtonTheme = createButtonTheme(colors.actionRed);

// ============================================================================
// ANTI-PATTERNS (Don't do this!)
// ============================================================================

// ❌ BAD: Hardcoded colors
const BadExample1 = () => <div style={{ color: '#24be85' }}>Don't hardcode colors!</div>;

// ❌ BAD: Magic color values
const BadExample2 = () => <div style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>Use neutralColors instead!</div>;

// ✅ GOOD: Use color tokens
const GoodExample = () => (
  <div
    style={{
      color: colors.brandPrimary,
      backgroundColor: colors.neutralSecondaryText,
    }}
  >
    Always use color tokens!
  </div>
);
