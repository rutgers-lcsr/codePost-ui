import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv, type UserConfig } from 'vite';
import svgr from 'vite-plugin-svgr';
import tsconfigPaths from 'vite-tsconfig-paths';

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
    tsconfigPaths(),
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
      'process.env.REACT_APP_VERSION': JSON.stringify(env.REACT_APP_VERSION || ''),
      'process.env.REACT_APP_GA_ID': JSON.stringify(env.REACT_APP_GA_ID || ''),
      'process.env.REACT_APP_OPTIMIZE_ID': JSON.stringify(env.REACT_APP_OPTIMIZE_ID || ''),
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
      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            'antd-vendor': ['antd', '@ant-design/icons'],
            'codemirror-vendor': ['codemirror', 'react-codemirror2'],
          },
        },
      },
    },
    optimizeDeps: {
      include: ['react', 'react-dom', 'react-router-dom', 'antd'],
      esbuildOptions: {
        target: 'es2020',
        keepNames: true,
      },
    },
    esbuild: {
      target: 'es2020',
      keepNames: true,
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
      alias: {
        // Add any necessary aliases here
      },
    },
  };
  return configuration;
});
