import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// `base` can be overridden for GitHub Pages project sites (e.g. VITE_BASE=/wr-counter/)
const base = process.env.VITE_BASE || '/';

export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/app-*.png'],
      manifest: {
        name: 'WR Counter — Wild Rift Lane Counter Guide',
        short_name: 'WR Counter',
        description:
          'Instant Wild Rift counter cards for all 142 champions: builds, runes, enemy-build adaptation, power spikes and wave management.',
        theme_color: '#0A1628',
        background_color: '#0A1628',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '.',
        scope: '.',
        icons: [
          { src: 'icons/app-icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/app-icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'icons/app-icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest,json,woff2}'],
        // Game icons + OG cards are cached at runtime (cache-first) instead of
        // precached — keeps the install payload small.
        globIgnores: ['og/**', 'icons/champions/**', 'icons/items/**', 'icons/abilities/**', 'icons/runes/**', 'icons/spells/**'],
        navigateFallback: 'index.html',
        runtimeCaching: [
          {
            // Champion / item / rune / spell icons (populated later) — cache-first, offline-friendly.
            urlPattern: /\/icons\/(champions|items|abilities|runes|spells)\/.*/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'game-icons',
              expiration: { maxEntries: 1200, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
        ],
      },
    }),
  ],
  server: {
    host: true,
    port: 5173,
    // Preview sandboxes proxy via arbitrary hostnames — accept them all.
    allowedHosts: true,
  },
  build: {
    target: 'es2020',
    cssCodesplit: true,
  },
});
