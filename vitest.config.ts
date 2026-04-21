import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';
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
    css: true,
    pool: 'threads',
    maxConcurrency: 10,
    isolate: false,
    maxWorkers: '75%',
    poolMatchGlobs: [['**/hooks/__tests__/useTaskPolling.test.ts', 'forks']],
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
