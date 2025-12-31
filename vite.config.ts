import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  base: "./", // Use relative paths for Electron
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@public": path.resolve(__dirname, "./public"),
      "@assets": path.resolve(__dirname, "./src/assets"),
    },
  },
  plugins: [
    TanStackRouterVite(),
    react(),
    // Полностью отключаем VitePWA для Electron build
    process.env.VITE_BUILD_TARGET !== 'electron' && VitePWA({
      registerType: "autoUpdate",
      injectRegister: "auto",
      includeAssets: ["favicon.ico", "vite.svg"],
      manifest: {
        name: "NationalFarmLife",
        short_name: "NFL",
        description: "National Farm Life Application",
        theme_color: "#ffffff",
        icons: [
          {
            src: "vite.svg",
            sizes: "any",
            type: "image/svg+xml",
          },
        ],
      },
      workbox: {
        // Агресивне кешування всіх статичних ресурсів
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2,woff,ttf,eot}"],
        // Стратегія CacheFirst - спочатку кеш, потім мережа
        runtimeCaching: [
          {
            // Зображення - CacheFirst
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/,
            handler: "CacheFirst",
            options: {
              cacheName: "images-cache",
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 рік
              },
            },
          },
          {
            // JSON дані (только статические файлы, не API) - CacheFirst
            urlPattern: /\.(?:json)$/,
            handler: "CacheFirst",
            options: {
              cacheName: "json-cache",
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 днів
              },
            },
          },
          // API запросы НЕ перехватываются Workbox - идут напрямую в сеть
          // Это предотвращает CORS ошибки в браузере
        ],
        // Кешування навігації (HTML сторінок)
        navigationPreload: false,
        skipWaiting: true,
        clientsClaim: true,
      },
      devOptions: {
        enabled: false, // Отключаем service worker в dev режиме - он вызывает CORS ошибки
        type: "module",
      },
    }),
  ].filter(Boolean), // Удаляем false значения
});
