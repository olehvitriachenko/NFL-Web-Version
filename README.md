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
