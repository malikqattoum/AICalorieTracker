import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { visualizer } from "rollup-plugin-visualizer";
import http from "http";

export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production';
  
  return {
    plugins: [
      react({
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
      // Enable minification with esbuild (better for shared hosting)
      minify: isProduction ? 'esbuild' : false,
      // Enable code splitting (optimized for shared hosting)
      rollupOptions: {
        treeshake: isProduction,
        maxParallelFileOps: 2, // Limit parallel operations for shared hosting
        output: {
          // Optimize chunk sizes
          manualChunks: (id) => {
            // Split vendor libraries
            if (id.includes('node_modules')) {
              if (id.includes('react') || id.includes('solid') || id.includes('preact')) {
                return 'react-core';
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
              if (id.includes('axios')) {
                return 'http';
              }
              if (id.includes('framer-motion')) {
                return 'animation';
              }
              if (id.includes('use-sync-external-store')) {
                return 'sync';
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
      // Disable source maps in production for better performance
      sourcemap: false,
      // Enable chunk size warning limit
      chunkSizeWarningLimit: 1000,
      // Enable brotli compression
      brotliSize: isProduction,
      // Enable CSS code splitting
      cssCodeSplit: true,
    },
    // Optimize dependencies (reduced for shared hosting)
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
        'use-sync-external-store',
      ],
      exclude: ['@babel/runtime'],
      force: isProduction ? false : true, // Only force in development
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
          target: 'http://localhost:3002',
          changeOrigin: true,
          secure: false,
          // Handle connection issues
          agent: new http.Agent({
            keepAlive: true,
            maxSockets: 20,
            maxFreeSockets: 10,
            timeout: 120000, // 120s keep-alive timeout
          }),
          // Add error handling
          onError: (err, req, res) => {
            console.log('Proxy error:', err);
            if (!res.headersSent) {
              res.writeHead(504, {
                'Content-Type': 'application/json',
              });
              res.end(JSON.stringify({ error: 'Proxy error', message: err.message }));
            }
          },
          // Timeouts
          proxyTimeout: 120000, // 120s for outgoing proxy requests
          timeout: 120000,      // 120s for incoming requests
          // Retry/diagnostics hooks
          configure: (proxy, _options) => {
            proxy.on('error', (err, _req, _res) => {
              console.log('Proxy error:', err);
            });

            proxy.on('proxyReq', (proxyReq, req, _res) => {
              console.log('Sending Request to the Target:', req.method, req.url);
            });

            proxy.on('proxyRes', (proxyRes, req, _res) => {
              console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
            });
          },
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
