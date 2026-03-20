// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.

// Type augmentation for vitest-axe with Vitest 4+.
// vitest-axe augments the legacy Vi namespace; this bridges to vitest's module namespace.
// Note: test files are excluded from tsconfig.json, so this .d.ts does not apply
// in the IDE. Tests use expect(results.violations).toHaveLength(0) instead.
import type { AxeMatchers } from 'vitest-axe/matchers';

declare module 'vitest' {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface Assertion<T = unknown> extends AxeMatchers {}
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface AsymmetricMatchersContaining extends AxeMatchers {}
}
