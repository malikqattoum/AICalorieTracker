import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { visualizer } from "rollup-plugin-visualizer";

export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production';
  
  return {
    plugins: [
      react({
        // Enable fast refresh for development
        fastRefresh: !isProduction,
        // Enable automatic JSX runtime
        jsxRuntime: 'automatic',
        // Enable use client directive detection
        babel: {
          plugins: [
            // Remove console.log in production
            ...(isProduction ? [['transform-remove-console', { exclude: ['error', 'warn'] }]] : []),
          ]
        }
      }),
      // Bundle analyzer for production
      ...(isProduction ? [visualizer({
        filename: "bundle-stats.html",
        open: false,
        gzipSize: true,
        brotliSize: true,
      })] : []),
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"),
        "@shared": path.resolve(__dirname, "../shared"),
      },
      // Enable extensions for cleaner imports
      extensions: [".ts", ".tsx", ".js", ".jsx", ".json"],
    },
    css: {
      postcss: path.resolve(__dirname, "postcss.config.js"),
      // Enable CSS code splitting
      modules: {
        localsConvention: 'camelCase',
      },
      // Enable CSS optimization
      devSourcemap: !isProduction,
    },
    root: __dirname,
    build: {
      outDir: "../dist/public",
      emptyOutDir: true,
      // Enable minification
      minify: isProduction ? 'terser' : false,
      terserOptions: {
        compress: {
          // Remove console.log in production
          drop_console: isProduction,
          drop_debugger: isProduction,
          pure_funcs: isProduction ? ['console.log'] : [],
        },
        format: {
          comments: false,
        },
      },
      // Enable code splitting
      rollupOptions: {
        treeshake: isProduction,
        output: {
          // Optimize chunk sizes
          manualChunks: (id) => {
            // Split vendor libraries
            if (id.includes('node_modules')) {
              if (id.includes('react') || id.includes('solid') || id.includes('preact')) {
                return 'react-vendor';
              }
              if (id.includes('router')) {
                return 'router';
              }
              if (id.includes('@radix-ui')) {
                return 'ui';
              }
              if (id.includes('recharts')) {
                return 'charts';
              }
              if (id.includes('date-fns') || id.includes('clsx') || id.includes('tailwind')) {
                return 'utils';
              }
              if (id.includes('i18next') || id.includes('react-i18next')) {
                return 'i18n';
              }
              if (id.includes('@tanstack') || id.includes('react-query')) {
                return 'query';
              }
              // Group remaining node_modules into a single chunk
              return 'vendor';
            }
          },
          // Optimize chunk names
          chunkFileNames: (chunkInfo) => {
            const facadeModuleId = chunkInfo.facadeModuleId
              ? chunkInfo.facadeModuleId.split('/').pop()
              : 'chunk';
            return `assets/js/${facadeModuleId}-[hash].js`;
          },
          entryFileNames: 'assets/js/[name]-[hash].js',
          assetFileNames: (assetInfo) => {
            const info = assetInfo.name?.split('.') || [];
            let extType = info[info.length - 1];
            if (/\.(mp4|webm|ogg|mp3|wav|flac|aac)(\?.*)?$/i.test(assetInfo.name || '')) {
              extType = 'media';
            } else if (/\.(png|jpe?g|gif|svg|webp)(\?.*)?$/i.test(assetInfo.name || '')) {
              extType = 'img';
            } else if (/\.(woff2?|eot|ttf|otf)(\?.*)?$/i.test(assetInfo.name || '')) {
              extType = 'fonts';
            } else if (/\.(css)(\?.*)?$/i.test(assetInfo.name || '')) {
              extType = 'css';
            }
            return `assets/${extType}/[name]-[hash][extname]`;
          },
        },
      },
      // Enable source maps
      sourcemap: isProduction,
      // Enable chunk size warning limit
      chunkSizeWarningLimit: 1000,
      // Enable brotli compression
      brotliSize: isProduction,
      // Enable CSS code splitting
      cssCodeSplit: true,
    },
    // Optimize dependencies
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-router-dom',
        '@tanstack/react-query',
        'i18next',
        'react-i18next',
        'date-fns',
        'clsx',
        'tailwind-merge',
        'recharts',
      ],
      exclude: ['@babel/runtime'],
      force: true,
    },
    // Development server configuration
    server: {
      port: 3000,
      host: true,
      open: true,
      // Enable HMR
      hmr: {
        overlay: true,
      },
      // Proxy API requests
      proxy: {
        '/api': {
          target: 'http://localhost:3001',
          changeOrigin: true,
          secure: false,
        },
      },
    },
    // Preload optimization
    preview: {
      port: 4173,
      open: true,
    },
    // Define global constants
    define: {
      global: 'globalThis',
      'process.env.NODE_ENV': JSON.stringify(mode),
    },
  };
});
