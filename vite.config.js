import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.png', 'vite.svg'],
      manifest: {
        name: 'Campaign Companion VTT',
        short_name: 'Campaign VTT',
        description: 'A lightweight, real-time Virtual Tabletop and Campaign Manager.',
        theme_color: '#0f172a',
        background_color: '#0f172a',
        display: 'standalone',
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
        globPatterns: ['**/*.{js,css,html,ico,png,jpg,svg,woff,woff2}'],
        navigateFallbackDenylist: [/^\/__/],
        
        // FIX 1: Bump the maximum file size limit from 2MB to 15MB
        maximumFileSizeToCacheInBytes: 15728640, 
        
        // FIX 2: Tell Vercel to skip hashing giant map files during deployment. 
        // (They will still cache in the player's browser when they open the map).
        globIgnores: [
          '**/*_enc.png', 
          '**/*_map.png',
          '**/tutorial_forest*.png'
        ]
      }
    })
  ],
});