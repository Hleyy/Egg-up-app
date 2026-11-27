import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vite'
import vercel from './vercel.json' with { type: 'json' }

const headers = Object.fromEntries(vercel.headers[0].headers.filter((h) => h.key !== 'Strict-Transport-Security').map((h) => [h.key, h.value]))

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['apple-touch-icon.png'],
      manifest: {
        name: 'Egg Up',
        short_name: 'Egg Up',
        description: 'Companion app for the Egg Up board game',
        lang: 'en',
        start_url: '/',
        display: 'standalone',
        orientation: 'any',
        background_color: '#F3E6CF',
        theme_color: '#F3E6CF',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,webp,woff2,otf,mp3}'],
        navigateFallback: '/index.html',
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.endsWith('.wasm'),
            handler: 'CacheFirst',
            options: { cacheName: 'wasm', expiration: { maxEntries: 4 } },
          },
          {
            urlPattern: ({ url }) => /\.(riv|glb)$/.test(url.pathname),
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'models', cacheableResponse: { statuses: [200] }, expiration: { maxEntries: 30 } },
          },
        ],
      },
    }),
  ],
  preview: {
    headers,
  },
  build: {
    chunkSizeWarningLimit: 1200,
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
} as never)
