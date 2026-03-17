import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  resolve: {
    alias: [
      { find: /^@features\/(.*)$/, replacement: path.resolve(__dirname, 'src/features') + '/$1' },
      { find: /^@code-review\/(.*)$/, replacement: path.resolve(__dirname, 'src/features/code-review') + '/$1' },
      { find: '@features', replacement: path.resolve(__dirname, 'src/features') },
      { find: '@code-review', replacement: path.resolve(__dirname, 'src/features/code-review') },
    ],
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
    css: true,
    pool: 'threads',
    minThreads: 1,
    maxThreads: 4,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      exclude: ['src/api-client/**', 'node_modules/**', 'src/**/__tests__/**', 'src/**/*.test.{ts,tsx}'],
      thresholds: {
        statements: 50,
        branches: 50,
        functions: 50,
        lines: 50,
      },
    },
  },
});
