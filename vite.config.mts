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
      // NOTE: never define process.env.NODE_ENV here — it breaks Vite's own NODE_ENV
      // constant-folding and made production builds bundle development React.
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
      // 'hidden': emit maps for debugging/CI but without sourceMappingURL comments —
      // browsers never fetch them, and the Dockerfile excludes them from the image.
      sourcemap: 'hidden',
      target: ['es2020', 'edge88', 'firefox78', 'chrome87', 'safari14'],
      rolldownOptions: {
        output: {
          // Rolldown-native chunking. The old manualChunks() function let rolldown
          // co-locate shared app modules inside these vendor chunks, which dragged
          // pdf/monaco into every page's modulepreload graph. Path-pure groups with
          // includeDependenciesRecursively: false keep membership exact.
          codeSplitting: {
            includeDependenciesRecursively: false,
            groups: [
              // Babel runtime helpers are imported by nearly every vendor package; left
              // unclaimed they get merged into app chunks, creating vendor→app import
              // cycles that crash at module init (undefined bindings mid-cycle).
              { name: 'vendor-helpers', test: /node_modules\/@babel\/runtime\// },
              { name: 'monaco-vendor', test: /node_modules\/(@monaco-editor|monaco-editor|state-local)\/[^?]*$/ },
              // [^?]*$ keeps ?url/?worker shim modules (e.g. the pdf.js worker URL) out of
              // the heavy chunk — an eager 1-line URL import must not preload 450KB of pdfjs.
              { name: 'pdf-vendor', test: /node_modules\/(react-pdf|pdfjs-dist)\/[^?]*$/ },
              // styles/ are tiny plain-object themes imported eagerly by the console theme
              // context — keep them out so the grammar payload stays lazy.
              {
                name: 'highlight-vendor',
                // Includes the lowlight/refractor micro-deps (fault, format, prismjs,
                // character/is-* helpers) — leaving them unclaimed strands them in the
                // app shim chunks and creates vendor↔shim import cycles.
                test: /node_modules\/(react-syntax-highlighter\/(?![^?]*\/styles\/)|refractor\/|highlight\.js\/|lowlight\/|prismjs\/|fault\/|format\/|character-entities-legacy\/|character-reference-invalid\/|parse-entities\/|is-decimal\/|is-hexadecimal\/|is-alphabetical\/|is-alphanumerical\/)[^?]*$/,
              },
              // One chunk for the whole antd ecosystem: antd, its @rc-component internals,
              // @ant-design (icons import cssinjs, antd imports icons — splitting them
              // creates a vendor↔vendor cycle), and cssinjs's own micro-deps. A stray
              // rc module in an app chunk crashed staging (PromptTemplatePicker cycle).
              {
                name: 'antd-vendor',
                test: /node_modules\/(antd|@rc-component|@ant-design|@emotion\/(hash|unitless)|react-is|is-mobile|stylis)\//,
              },
              { name: 'react-vendor', test: /node_modules\/(react|react-dom|scheduler|react-router)\// },
              { name: 'icons-vendor', test: /node_modules\/react-icons\// },
              { name: 'jszip-vendor', test: /node_modules\/jszip\// },
              { name: 'dayjs-vendor', test: /node_modules\/dayjs\// },
              { name: 'markdown-vendor', test: /node_modules\/(react-markdown|remark-gfm)\// },
            ],
          },
        },
      },
    },
    optimizeDeps: {
      include: ['react', 'react-dom', 'react-router', 'antd'],
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
        { find: /^@features\/(.*)$/, replacement: path.resolve(import.meta.dirname, 'src/features') + '/$1' },
        { find: /^@code-review\/(.*)$/, replacement: path.resolve(import.meta.dirname, 'src/features/code-review') + '/$1' },
        { find: '@features', replacement: path.resolve(import.meta.dirname, 'src/features') },
        { find: '@code-review', replacement: path.resolve(import.meta.dirname, 'src/features/code-review') },
        { find: '@test-utils', replacement: path.resolve(import.meta.dirname, 'src/test-utils') },
        { find: '@api-client', replacement: path.resolve(import.meta.dirname, 'src/api-client') },
      ],
    },
  };
  return configuration;
});
