import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.png', 'apple-touch-icon.png', 'push-sw.js'],
      manifest: {
        name: 'AulaMia',
        short_name: 'AulaMia',
        description: 'Agenda y planificador inteligente de clases de repaso',
        lang: 'es',
        dir: 'ltr',
        theme_color: '#0d7d8c',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
      workbox: {
        importScripts: ['push-sw.js'],
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
        navigateFallbackDenylist: [/^\/auth/],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/rest/v1'),
            handler: 'NetworkFirst',
            options: { cacheName: 'supabase-rest', networkTimeoutSeconds: 5 },
          },
          {
            urlPattern: ({ request }) => request.destination === 'font',
            handler: 'CacheFirst',
            options: {
              cacheName: 'fuentes',
              expiration: { maxEntries: 8, maxAgeSeconds: 60 * 60 * 24 * 90 },
            },
          },
        ],
      },
      devOptions: { enabled: false },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      // supabase-js instancia realtime y storage en su constructor, así que el
      // tree-shaking no los quita aunque AulaMia no los use. Los sustituimos por
      // stubs que avisan en alto si algún día se llaman de verdad.
      // Ver `build/supabase-sin-usar/`.
      '@supabase/realtime-js': fileURLToPath(
        new URL('./build/supabase-sin-usar/realtime.ts', import.meta.url),
      ),
      '@supabase/storage-js': fileURLToPath(
        new URL('./build/supabase-sin-usar/storage.ts', import.meta.url),
      ),
      '@supabase/functions-js': fileURLToPath(
        new URL('./build/supabase-sin-usar/functions.ts', import.meta.url),
      ),
    },
  },
  build: {
    rollupOptions: {
      output: {
        // Sin esto Rollup mezcla las dependencias con el código de la app en un
        // chunk que bautiza con el primer módulo que encuentra (salía `iconos`,
        // que en realidad era Supabase entero). Separarlas da nombres honestos y
        // evita que cada cambio de la app invalide la caché de las librerías.
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (id.includes('@supabase')) return 'supabase'
          if (id.includes('react-router')) return 'router'
          if (id.includes('@tanstack')) return 'consultas'
          if (id.includes('date-fns')) return 'fechas'
          if (id.includes('react-dom') || id.includes('scheduler')) return 'react'
        },
      },
    },
  },
  server: {
    // Coincide con la Site URL por defecto de Supabase para que los enlaces
    // mágicos funcionen en local sin configuración extra.
    port: 3000,
  },
})
