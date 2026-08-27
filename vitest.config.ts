import react from '@vitejs/plugin-react';
import { configDefaults, defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      { find: /^@features\/(.*)$/, replacement: path.resolve(__dirname, 'src/features') + '/$1' },
      { find: /^@code-review\/(.*)$/, replacement: path.resolve(__dirname, 'src/features/code-review') + '/$1' },
      { find: '@features', replacement: path.resolve(__dirname, 'src/features') },
      { find: '@code-review', replacement: path.resolve(__dirname, 'src/features/code-review') },
      { find: '@test-utils', replacement: path.resolve(__dirname, 'src/test-utils') },
      { find: '@api-client', replacement: path.resolve(__dirname, 'src/api-client') },
    ],
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
    // e2e/ belongs to Playwright (playwright.config.ts testDir), but its *.spec.ts files
    // match vitest's default include glob. Collecting them here throws
    // "Playwright Test did not expect test.describe() to be called here". Run them with
    // `npm run test:e2e`.
    exclude: [...configDefaults.exclude, 'e2e/**'],
    css: true,
    pool: 'threads',
    maxConcurrency: 10,
    // Keep vitest's default per-file isolation. With `isolate: false`, test files in a
    // worker share one module registry and one jsdom document, so `vi.mock` factories and
    // module-level state (e.g. the Zustand permissions store, the global fetch mock) leak
    // between files — the suite failed ~40% of runs with 11-12 order-dependent failures.
    // Isolation costs roughly 8s (~22s -> ~30s), which is well worth a green, deterministic
    // suite. If you re-disable it for speed, expect to fix that cross-file state sharing.
    isolate: true,
    maxWorkers: '75%',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      exclude: [
        'src/api-client/**',
        'node_modules/**',
        'src/**/__tests__/**',
        'src/**/*.test.{ts,tsx}',
        'src/img/**',
        'src/docs/content/**',
        'src/components/utils/demo_subs/**',
      ],
      thresholds: {
        statements: 31,
        branches: 20,
        functions: 25,
        lines: 31,
      },
    },
  },
});
