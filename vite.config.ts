import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv, type UserConfig } from 'vite';
import path from 'path';
import svgr from 'vite-plugin-svgr';
import packageJson from './package.json' with { type: 'json' };

export default defineConfig(async (config) => {
  const { mode } = config;
  // Load env file based on `mode` in the current working directory.
  // Load all env variables (empty string prefix means load all)
  const env = loadEnv(mode, process.cwd(), '');

  console.log('Loaded env variables:', {
    REACT_APP_API_URL: env.REACT_APP_API_URL,
    mode,
  });

  const plugins = [
    svgr({
      // Enable named export for ReactComponent (CRA compatibility)
      svgrOptions: {
        exportType: 'named',
      },
      include: '**/*.svg',
    }),
    react({
      // Enable automatic JSX runtime
      jsxRuntime: 'automatic',
    }),
  ];

  if (mode === 'analyze') {
    try {
      const { visualizer } = await import('rollup-plugin-visualizer');
      plugins.push(
        visualizer({
          filename: 'build/bundle-report.html',
          open: true,
          gzipSize: true,
          brotliSize: true,
        }),
      );
    } catch (error) {
      console.warn('rollup-plugin-visualizer not installed; skipping bundle analysis.');
    }
  }

  const configuration: UserConfig = {
    plugins,
    // Expose REACT_APP_* variables as process.env for compatibility with CRA code
    define: {
      'process.env.REACT_APP_API_URL': JSON.stringify(env.REACT_APP_API_URL || 'http://localhost:8000'),
      'process.env.REACT_APP_VERSION': JSON.stringify(packageJson.version),
      'process.env.NODE_ENV': JSON.stringify(mode),
    },

    server: {
      port: 3000,
      open: true,
      host: true,
      proxy: {
        // Optional: if you need to proxy API requests during development
        // '/api': 'http://localhost:8000'
      },
    },
    preview: {
      port: 3000,
    },
    build: {
      outDir: 'build',
      sourcemap: true,
      target: ['es2020', 'edge88', 'firefox78', 'chrome87', 'safari14'],
      rolldownOptions: {
        output: {
          manualChunks(id) {
            const chunks: Record<string, string[]> = {
              'react-vendor': ['react', 'react-dom', 'react-router-dom'],
              'antd-vendor': ['antd', '@ant-design/icons'],
              'aws-vendor': ['aws-sdk'],
              'pdf-vendor': ['react-pdf'],
              'icons-vendor': ['react-icons'],
              'jszip-vendor': ['jszip'],
              'dayjs-vendor': ['dayjs'],
              'monaco-vendor': ['@monaco-editor/react', 'monaco-editor'],
              'markdown-vendor': ['react-markdown', 'remark-gfm'],
            };
            for (const [chunkName, deps] of Object.entries(chunks)) {
              if (deps.some((dep) => id.includes(`node_modules/${dep}/`) || id.includes(`node_modules/${dep}\0`))) {
                return chunkName;
              }
            }
          },
        },
      },
    },
    optimizeDeps: {
      include: ['react', 'react-dom', 'react-router-dom', 'antd'],
    },
    oxc: {
      target: 'es2020',
    },
    css: {
      preprocessorOptions: {
        scss: {
          // Variables are imported in main.scss
          silenceDeprecations: ['import', 'legacy-js-api'], // Silence known deprecations
        },
      },
    },
    resolve: {
      tsconfigPaths: true,
      alias: [
        { find: 'jszip', replacement: 'jszip/lib/index.js' },
        { find: /^@features\/(.*)$/, replacement: path.resolve(__dirname, 'src/features') + '/$1' },
        { find: /^@code-review\/(.*)$/, replacement: path.resolve(__dirname, 'src/features/code-review') + '/$1' },
        { find: '@features', replacement: path.resolve(__dirname, 'src/features') },
        { find: '@code-review', replacement: path.resolve(__dirname, 'src/features/code-review') },
        { find: '@test-utils', replacement: path.resolve(__dirname, 'src/test-utils') },
        { find: '@api-client', replacement: path.resolve(__dirname, 'src/api-client') },
      ],
    },
  };
  return configuration;
});
