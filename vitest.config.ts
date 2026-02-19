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
    setupFiles: './src/setupTests.js',
    css: true,
    pool: 'threads',
    poolOptions: {
      threads: {
        minThreads: 1,
        maxThreads: 1,
      },
    },
  },
});
