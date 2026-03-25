import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.png', 'vite.svg'], // Caches your core icons
      manifest: {
        name: 'Campaign Companion VTT',
        short_name: 'Campaign VTT',
        description: 'A lightweight, real-time Virtual Tabletop and Campaign Manager.',
        theme_color: '#0f172a', // Matches your slate-950 dark mode background
        background_color: '#0f172a',
        display: 'standalone', // Forces the app to hide the browser URL bar when installed
        orientation: 'portrait',
        icons: [
          {
            src: '/icon.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: '/icon.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        // Tells the service worker to cache all code and visual assets for offline use
        globPatterns: ['**/*.{js,css,html,ico,png,jpg,svg,woff,woff2}'],
        // Excludes Firebase API calls from being forcefully cached so real-time sync still works
        navigateFallbackDenylist: [/^\/__/],
      }
    })
  ],
});