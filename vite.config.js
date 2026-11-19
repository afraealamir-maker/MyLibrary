import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/icon.svg', 'icons/icon-192.png', 'icons/icon-512.png'],
      manifest: {
        id: '/',
        name: 'MyLibrary · The Reading Room',
        short_name: 'MyLibrary',
        description: 'Tu biblioteca personal, siempre contigo.',
        lang: 'es',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#210e12',
        theme_color: '#260d13',
        categories: ['books', 'education', 'lifestyle'],
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
          { src: '/icons/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }
        ]
      },
      workbox: {
        navigateFallback: '/index.html',
        globPatterns: ['**/*.{js,css,html,svg,webmanifest,png,woff2}'],
        cleanupOutdatedCaches: true
      },
      devOptions: { enabled: false }
    })
  ]
});
