import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  base: './', // Важно для Electron - відносні шляхи
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'vite.svg'],
      manifest: {
        name: 'NFL Web App',
        short_name: 'NFL',
        description: 'NFL Web Application',
        theme_color: '#ffffff',
        icons: [
          {
            src: 'vite.svg',
            sizes: 'any',
            type: 'image/svg+xml'
          }
        ]
      },
      workbox: {
        // Агресивне кешування всіх статичних ресурсів
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,woff,ttf,eot}'],
        // Стратегія CacheFirst - спочатку кеш, потім мережа
        runtimeCaching: [
          {
            // Зображення - CacheFirst
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 рік
              }
            }
          },
          {
            // API запити - CacheFirst (offline-first)
            urlPattern: /\/api\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 7 // 7 днів
              },
              // Якщо кеш не знайдено, спробувати мережу
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            // Зовнішні API - CacheFirst з fallback
            urlPattern: /^https:\/\/.*\/api\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'external-api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 // 1 день
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            // JSON дані - CacheFirst
            urlPattern: /\.(?:json)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'json-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 днів
              }
            }
          }
        ],
        // Кешування навігації (HTML сторінок)
        navigationPreload: false,
        skipWaiting: true,
        clientsClaim: true
      },
      devOptions: {
        enabled: true,
        type: 'module'
      }
    })
  ],
})
