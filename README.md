# NFL Web App

NFL Web Application built with React, TypeScript, Vite, and Electron.

## Tech Stack

- React 19
- TypeScript
- Vite
- Electron
- Tailwind CSS
- Zustand (State Management)
- TanStack Router
- React Hook Form + Yup
- Axios
- Better SQLite3
- CryptoJS
- React PDF

## Development

```bash
npm run dev
```

## Build

```bash
npm run build
```

## Electron

### Розробка
```bash
# Термінал 1: запуск Vite dev server
npm run dev

# Термінал 2: запуск Electron
npm run electron:dev
```

### Запуск зібраного додатку
```bash
npm run build
npm run electron:start
```

### Збірка exe файлу для Windows
```bash
npm run build:exe
```

Після збірки exe файл буде в папці `release/`:
- `NFL Web App-Setup-1.0.0.exe` - інсталятор для Windows

### Створення іконок

Для правильної збірки додайте іконки в папку `build/`:
- `icon.ico` - для Windows (256x256 або більше)
- `icon.icns` - для macOS
- `icon.png` - для Linux (512x512)

Якщо іконки відсутні, electron-builder створить дефолтні.
