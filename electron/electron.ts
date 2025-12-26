import { app, BrowserWindow } from 'electron';
import { join } from 'path';

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
    show: false, // Не показуємо вікно поки воно не готове
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: join(__dirname, 'preload.cjs'),
      webSecurity: true,
      allowRunningInsecureContent: false,
    },
    // icon: join(__dirname, 'public', 'vite.svg'), // Додайте іконку за потреби
  });

  // Показуємо вікно коли воно готове
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
    
    // Фокус на вікно (корисно на macOS)
    if (isDev) {
      mainWindow?.focus();
    }
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

  // Обробка помилок завантаження
  mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription) => {
    console.error('Failed to load:', errorCode, errorDescription);
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

// Запобігання нових вікон (наприклад, від target="_blank")
app.on('web-contents-created', (_event, contents) => {
  // Запобігаємо відкриттю нових вікон
  contents.setWindowOpenHandler(() => {
    return { action: 'deny' };
  });
  
  // Обробка навігації
  contents.on('will-navigate', (navigationEvent, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);
    
    if (isDev && parsedUrl.origin !== 'http://localhost:5173') {
      navigationEvent.preventDefault();
    } else if (!isDev && parsedUrl.origin !== 'file://') {
      navigationEvent.preventDefault();
    }
  });
});

