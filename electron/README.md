# Electron Configuration

Ця папка містить конфігурацію Electron для додатку.

## Файли

- `electron.ts` - головний процес Electron
- `preload.ts` - preload скрипт для безпечної комунікації між процесами

## Компіляція

Файли компілюються в `dist-electron/electron/` за допомогою `tsconfig.electron.json`.

## Використання

Файли автоматично компілюються при запуску:
- `npm run electron:dev` - розробка
- `npm run electron:start` - production режим

## Структура після компіляції

```
dist-electron/
  electron/
    electron.js
    preload.js
```

