import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig(({ mode, command }) => ({
  server: {
    host: mode === 'development' ? '::' : '0.0.0.0',
    port: mode === 'development' ? 8080 : 4173,
  },
  preview: {
    host: '0.0.0.0',
    port: 4173
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) {
              return 'vendor';
            }
            if (id.includes('@radix-ui')) {
              return 'ui';
            }
            if (id.includes('framer-motion')) {
              return 'motion';
            }
            if (id.includes('lucide-react')) {
              return 'icons';
            }
            if (id.includes('i18next') || id.includes('react-i18next')) {
              return 'i18n';
            }
            // Removed chunks for dependencies that are no longer used
            // recharts, xlsx, react-icons have been removed
            return 'vendor';
          }
          if (id.includes('src/components/ui')) {
            return 'ui-components';
          }
          if (id.includes('src/components/magicui')) {
            return 'magic-ui';
          }
          if (id.includes('src/pages')) {
            return 'pages';
          }
        },
      },
    },
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: mode === 'production',
        drop_debugger: mode === 'production',
        pure_funcs: mode === 'production' ? ['console.log', 'console.info', 'console.debug'] : [],
        passes: 2,
      },
      mangle: {
        safari10: true,
      },
      format: {
        comments: false,
      },
    },
    chunkSizeWarningLimit: 1000,
    sourcemap: mode !== 'production',
    target: 'es2020',
    cssCodeSplit: true,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['favicon.ico', 'robots.txt', 'pwa-icons/*.png'],
      manifest: false,
      strategies: 'generateSW',
      injectRegister: 'script',
      devOptions: {
        enabled: true,
        type: 'module',
        navigateFallback: '/index.html',
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg,jpeg,gif,webp}'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//],
        skipWaiting: false,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
        sourcemap: true,
        swDest: mode === 'production' ? 'dist/sw.js' : undefined,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // <== 365 days
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // <== 365 days
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /\.(?:js|css|html|png|jpg|jpeg|svg|gif)$/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'static-assets',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              }
            }
          },
          {
            urlPattern: /^https?:\/\//,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'app-cache',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 7 // <== 7 days
              }
            }
          }
        ]
      }
    })
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  envPrefix: "VITE_",
  define: {
    'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(process.env.VITE_SUPABASE_URL),
    'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(process.env.VITE_SUPABASE_ANON_KEY),
  },
}));
