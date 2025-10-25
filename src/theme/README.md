# Color & Theme Management Guide

This directory contains the centralized color and theme configuration for the codePost UI.

## Quick Start

### Changing a Color

1. **Edit the single source of truth**: `src/theme/colors.ts`
2. **Update SCSS variables**: `src/styles/abstracts/_colors.scss` (keep values in sync)
3. That's it! The color will automatically propagate to:
   - Ant Design components
   - TypeScript/TSX files
   - SCSS files

### Using Colors in Your Code

#### In TypeScript/TSX Components

```typescript
// Import the colors object
import { colors } from '@/theme/colors';

// Use in your component
const MyComponent = () => {
  return (
    <div style={{ color: colors.brandPrimary }}>
      Hello World
    </div>
  );
};

// Or import specific color groups
import { brandColors, actionColors } from '@/theme/colors';

const button = {
  backgroundColor: brandColors.primary,
  color: actionColors.blue,
};
```

#### In SCSS Files

```scss
// Colors are automatically available via @import
@import '~@/styles/abstracts/colors';

.my-class {
  color: $brandPrimary;
  background: $neutralBackground;
  border: 1px solid $neutralBorder;
}
```

## File Structure

```
src/theme/
├── colors.ts          ← SINGLE SOURCE OF TRUTH for all color values
├── index.ts           ← Ant Design theme configuration (imports colors.ts)
└── README.md          ← This file

src/styles/abstracts/
└── _colors.scss       ← SCSS variables (manually synced with colors.ts)
```

## Available Color Categories

### Brand Colors

- `brandPrimary` - Main brand color (#24be85)
- `brandLight` - Light brand color
- `brandVibrant` - Vibrant brand color
- `brandDark` - Dark brand color
- `brandAccent` - Accent color
- `brandBlack` - Brand black
- `brandBlackHighlight` - Highlighted black

### Action Colors

- `actionBlue` / `actionBlueFade`
- `actionGreen` / `actionGreenFade`
- `actionYellow` / `actionYellowFade`
- `actionRed` / `actionRedFade`

### Green Palette

- `green1` through `green10` - Full range of green shades

### Neutral Colors (Light Background)

- `neutralTitle`
- `neutralMainText`
- `neutralSecondaryText`
- `neutralDisable`
- `neutralBorder`
- `neutralDivider`
- `neutralBackground`

### Neutral Colors (Dark Background)

- `neutralDarkTitle`
- `neutralDarkMainText`
- `neutralDarkSecondaryText`
- `neutralDarkDisable`
- `neutralDarkBorder`
- `neutralDarkDivider`
- `neutralDarkBackground`

## How It Works

### 1. Color Definition (`colors.ts`)

All colors are defined in TypeScript with proper typing:

```typescript
export const brandColors = {
  primary: '#24be85',
  light: '#f0fff6',
  // ... more colors
} as const;
```

### 2. Ant Design Integration (`index.ts`)

The theme config imports and uses these colors:

```typescript
import { colors } from './colors';

const themeConfig: ThemeConfig = {
  token: {
    colorSuccess: colors.brandPrimary,
    colorError: colors.actionRed,
    // ...
  },
};
```

### 3. SCSS Integration (`_colors.scss`)

SCSS variables mirror the TypeScript definitions and use `:export` to make them available to TypeScript:

```scss
$brandPrimary: #24be85;

:export {
  brandPrimary: $brandPrimary;
}
```

## Migration Guide

### Before (Bad)

Colors scattered everywhere:

```typescript
// Component.tsx - hardcoded color ❌
<div style={{ color: '#24be85' }}>

// theme.js - duplicated ❌
const brandPrimary = '#24be85';

// _colors.scss - also duplicated ❌
$brandPrimary: #24be85;
```

### After (Good)

One source of truth:

```typescript
// colors.ts - define once ✅
export const colors = {
  brandPrimary: '#24be85',
} as const;

// Component.tsx - import and use ✅
import { colors } from '@/theme/colors';
<div style={{ color: colors.brandPrimary }}>

// SCSS - use variable ✅
.my-class { color: $brandPrimary; }
```

## Best Practices

1. **Never hardcode color values** in components
2. **Always use color tokens** from `colors.ts` or SCSS variables
3. **Update colors in one place** (`colors.ts`), then sync to SCSS
4. **Use semantic names** (e.g., `brandPrimary` not `green`)
5. **Keep SCSS in sync** - when updating `colors.ts`, update `_colors.scss` too

## Troubleshooting

### Color not updating in components?

- Make sure you're importing from `@/theme/colors` not hardcoding
- Check that the Ant Design theme config is using the color token
- Clear build cache and restart dev server

### Color not available in SCSS?

- Check that it's defined in `src/styles/abstracts/_colors.scss`
- Ensure the SCSS file is imported where needed
- Verify the variable name matches

### Inconsistent colors between SCSS and TSX?

- Colors are defined in two places by design (TS and SCSS)
- Make sure both files have matching values
- Consider this the "sync tax" for supporting both ecosystems

## Future Improvements

Potential enhancements:

- [ ] Build script to auto-generate SCSS from TypeScript
- [ ] VS Code extension for color previews
- [ ] Design tokens JSON export for design tools
- [ ] Dark mode theme variants
- [ ] Color accessibility checker

---

**Questions?** Check the main codePost-ui README or ask in #frontend-dev
