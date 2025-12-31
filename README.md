# NationalFarmLife

National Farm Life Application built with React, TypeScript, Vite, and Electron.

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
- Firebase Analytics

## Development

### Web Version
```bash
npm run dev
```

### Electron Version
```bash
npm run electron:dev
```

This will:
1. Build the Electron preload scripts
2. Start the Vite dev server
3. Launch Electron when the server is ready

## Build

### Web Version
```bash
npm run build
```

### Electron Version
```bash
npm run electron:build
```

## Database

The application uses:
- **SQLite** (via better-sqlite3) when running in Electron
- **IndexedDB** when running in a web browser

Data is automatically saved to the appropriate database based on the environment.

## Firebase Analytics

The application uses Firebase Analytics for tracking user behavior and app usage.

### Quick Setup

1. **Create Firebase project** in [Firebase Console](https://console.firebase.google.com/)
2. **Register web app** in Firebase Console → Project Settings
3. **Create `.env` file** in project root with Firebase config:
   ```env
   VITE_FIREBASE_API_KEY=your-api-key
   VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
   VITE_FIREBASE_APP_ID=your-app-id
   ```
4. **Run setup and verify:**
   ```bash
   npm run firebase:setup
   npm run firebase:verify
   ```
5. **Test it:**
   ```bash
   npm run dev
   # Open http://localhost:5173/firebase-test
   ```

### Documentation

- **Quick Start:** [FIREBASE_QUICKSTART.md](./FIREBASE_QUICKSTART.md) - 5 минут настройки
- **Detailed Guide:** [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) - полная инструкция
- **Production Setup:** [FIREBASE_PROD_SETUP.md](./FIREBASE_PROD_SETUP.md) - настройка для PROD
- **Deployment:** [PRODUCTION_DEPLOYMENT.md](./PRODUCTION_DEPLOYMENT.md) - деплой в production
- **API Reference:** [FIREBASE.md](./FIREBASE.md) - документация по использованию

### Scripts

```bash
# Development
npm run firebase:verify          # Проверить DEV конфигурацию
npm run firebase:setup           # Настроить DEV окружение

# Production
npm run firebase:verify:prod     # Проверить PROD конфигурацию
npm run firebase:setup:prod      # Настроить PROD окружение
```

## Project Structure

```
├── electron/          # Electron main process files
│   ├── main.ts       # Main Electron process
│   └── preload.ts    # Preload script for IPC
├── src/              # React application
│   ├── components/   # React components
│   ├── pages/        # Page components
│   ├── utils/        # Utility functions (database, etc.)
│   └── types/        # TypeScript type definitions
└── public/           # Static assets
```
