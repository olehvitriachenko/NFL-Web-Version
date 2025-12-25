import { app, BrowserWindow } from 'electron';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Зберігаємо глобальну посилання на вікно, щоб воно не було знищене збирачем сміття
let mainWindow: BrowserWindow | null = null;

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

function createWindow() {
  // Створюємо вікно браузера
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: join(__dirname, 'preload.js'),
    },
    icon: join(__dirname, '..', 'public', 'vite.svg'),
  });

  // Завантажуємо додаток
  if (isDev) {
    // У режимі розробки підключаємося до Vite dev server
    mainWindow.loadURL('http://localhost:5173');
    // Відкриваємо DevTools у режимі розробки
    mainWindow.webContents.openDevTools();
  } else {
    // У production режимі завантажуємо збілджені файли
    mainWindow.loadFile(join(__dirname, '..', 'dist', 'index.html'));
  }

  // Емітується коли вікно закривається
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Цей метод буде викликаний коли Electron завершить ініціалізацію
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    // На macOS прийнято повторно створювати вікно, коли користувач клікає на іконку в dock
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Вихід коли всі вікна закриті, окрім macOS
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Обробка помилок
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

