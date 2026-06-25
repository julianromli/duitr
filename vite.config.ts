import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig(({ mode, command }) => {
  const enablePwa = command === 'build' && process.env.npm_lifecycle_event === 'build:pwa';

  return {
  server: {
    host: mode === 'development' ? 'localhost' : '0.0.0.0',
    port: mode === 'development' ? 8080 : 4173,
    hmr: {
      port: 8080
    }
  },
  preview: {
    host: '0.0.0.0',
    port: 4173
  },
  plugins: [
    tanstackStart(),
    react(),
    mode === 'development' &&
    componentTagger(),
    enablePwa && VitePWA({
      registerType: 'prompt',
      includeAssets: ['favicon.ico', 'robots.txt', 'pwa-icons/*.png'],
      manifest: false,
      strategies: 'generateSW',
      injectRegister: 'script',
      devOptions: {
        enabled: false,
        type: 'module',
        navigateFallback: '/',
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg,jpeg,gif,webp}'],
        navigateFallback: '/',
        navigateFallbackDenylist: [/^\/api\//],
        skipWaiting: true,
        clientsClaim: false,
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
                maxAgeSeconds: 60 * 60 * 24 * 365
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
                maxAgeSeconds: 60 * 60 * 24 * 365
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
                maxAgeSeconds: 60 * 60 * 24 * 30
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
                maxAgeSeconds: 60 * 60 * 24 * 7
              }
            }
          }
        ]
      }
    })
  ].filter(Boolean),
  resolve: {
    dedupe: ['react', 'react-dom', 'react/jsx-runtime', 'react/jsx-dev-runtime', 'react-i18next'],
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@icons/material/CheckIcon": path.resolve(__dirname, "./src/shims/react-color-check-icon.tsx"),
    },
  },
  envPrefix: "VITE_",
};
});
