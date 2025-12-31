import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { writeFile, readFile, rm } from 'fs/promises';
import { existsSync, readdirSync } from 'fs';
import axios from 'axios';
import { SQLiteDatabase } from './database.js';
import { RatesDatabase } from './rates-database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Database instances
const database = new SQLiteDatabase();
const ratesDatabase = new RatesDatabase();

// Store main window reference for OAuth callback
let mainWindow: BrowserWindow | null = null;

// Store pending OAuth callback data until page is ready
let pendingOAuthCallback: { code?: string; state?: string; error?: string; errorDescription?: string } | null = null;

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    title: 'NationalFarmLife',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      // Дозволяємо iframe завантажувати file:// URL для PDF
      webSecurity: false, // Вимкнути для доступу до локальних файлів
    },
  });

  // Store main window reference
  mainWindow = win;

  // Log all navigation events
  win.webContents.on('will-navigate', (_event, navigationUrl) => {
    console.log('[Main] 🔗 will-navigate:', navigationUrl);
  });

  win.webContents.on('did-navigate', (_event, url) => {
    console.log('[Main] ✅ did-navigate:', url);
  });

  win.webContents.on('did-navigate-in-page', (_event, url, isMainFrame) => {
    console.log('[Main] 🔄 did-navigate-in-page:', url, '(isMainFrame:', isMainFrame + ')');
  });

  win.webContents.on('did-start-navigation', (_event, url, isInPlace, isMainFrame) => {
    console.log('[Main] 🚀 did-start-navigation:', url, '(isInPlace:', isInPlace + ', isMainFrame:', isMainFrame + ')');
  });

  win.webContents.on('did-frame-navigate', (_event, url, httpResponseCode, httpStatusText, isMainFrame) => {
    console.log('[Main] 📍 did-frame-navigate:', url, '(code:', httpResponseCode + ', status:', httpStatusText + ', isMainFrame:', isMainFrame + ')');
  });

  // Log redirects
  win.webContents.on('did-redirect-navigation', (_event, url, isInPlace, isMainFrame) => {
    console.log('[Main] 🔀 did-redirect-navigation:', url, '(isInPlace:', isInPlace + ', isMainFrame:', isMainFrame + ')');
  });

  // Log loadURL calls
  const originalLoadURL = win.webContents.loadURL.bind(win.webContents);
  win.webContents.loadURL = function(url: string, options?: any) {
    console.log('[Main] 📥 loadURL called:', url, options ? '(options: ' + JSON.stringify(options) + ')' : '');
    return originalLoadURL(url, options);
  };

  // Log loadFile calls
  const originalLoadFile = win.loadFile.bind(win);
  win.loadFile = function(filePath: string, options?: any) {
    console.log('[Main] 📁 loadFile called:', filePath, options ? '(options: ' + JSON.stringify(options) + ')' : '');
    return originalLoadFile(filePath, options);
  };

  // Load the app
  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
  if (isDev) {
    console.log('[Main] 📥 Loading dev URL: http://localhost:5173');
    win.loadURL('http://localhost:5173');
    win.webContents.openDevTools();
  } else {
    const htmlPath = path.join(__dirname, '../dist/index.html');
    console.log('[Main] 📁 Loading production file:', htmlPath);
    win.loadFile(htmlPath);
  }

  return win;
}

// Register custom protocol for OAuth callback
const PROTOCOL_NAME = 'nfl-app';

// Register the protocol handler
function registerProtocol() {
  if (process.defaultApp) {
    if (process.argv.length >= 2) {
      app.setAsDefaultProtocolClient(PROTOCOL_NAME, process.execPath, [path.resolve(process.argv[1])]);
    }
  } else {
    app.setAsDefaultProtocolClient(PROTOCOL_NAME);
  }
}

// Handle protocol URL (OAuth callback)
function handleProtocolUrl(url: string) {
  console.log('[Main] Protocol URL received:', url);
  
  // Parse the URL to extract OAuth parameters
  try {
    const urlObj = new URL(url);
    const code = urlObj.searchParams.get('code');
    const state = urlObj.searchParams.get('state');
    const error = urlObj.searchParams.get('error');
    const errorDescription = urlObj.searchParams.get('error_description');

    if (!mainWindow || mainWindow.isDestroyed()) {
      console.warn('[Main] Main window not available, creating new window...');
      createWindow();
      // Wait a bit for window to be ready
      setTimeout(() => {
        handleProtocolUrl(url);
      }, 1000);
      return;
    }

    // Focus the window first
    if (mainWindow.isMinimized()) {
      mainWindow.restore();
    }
    mainWindow.focus();

    // Prepare OAuth callback data
    const callbackData: { code?: string; state?: string; error?: string; errorDescription?: string } = {};
    if (error) {
      console.error('[Main] OAuth error:', error, errorDescription);
      callbackData.error = error;
      callbackData.errorDescription = errorDescription || undefined;
    } else if (code && state) {
      console.log('[Main] OAuth callback received, code:', code.substring(0, 20) + '...');
      callbackData.code = code;
      callbackData.state = state;
    } else {
      console.warn('[Main] OAuth callback missing code or state');
      return;
    }

    // Store pending callback
    pendingOAuthCallback = callbackData;

    // Navigate to callback page with parameters in hash
    const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
    
    // Build query string from callback data
    const params = new URLSearchParams();
    if (callbackData.code) params.set('code', callbackData.code);
    if (callbackData.state) params.set('state', callbackData.state);
    if (callbackData.error) params.set('error', callbackData.error);
    if (callbackData.errorDescription) params.set('error_description', callbackData.errorDescription);
    
    const queryString = params.toString();
    const callbackUrl = isDev 
      ? `http://localhost:5173/oauth-callback?${queryString}`
      : `file://${path.join(__dirname, '../dist/index.html')}#/oauth-callback?${queryString}`;
    
    console.log('[Main] Loading callback page with params:', callbackUrl);
    console.log('[Main] Callback data:', { 
      code: callbackData.code ? callbackData.code.substring(0, 20) + '...' : undefined,
      state: callbackData.state,
      error: callbackData.error 
    });
    
    // Send data via IPC multiple times to ensure it's received
    const sendDataMultipleTimes = () => {
      if (!pendingOAuthCallback || !mainWindow || mainWindow.isDestroyed()) {
        return;
      }
      
      console.log('[Main] Page loaded, sending callback data via IPC (multiple attempts)...');
      // Send immediately
      mainWindow.webContents.send('oauth-callback', pendingOAuthCallback);
      console.log('[Main] ✅ First IPC send completed');
      
      // Send again after 500ms (in case listener wasn't ready)
      setTimeout(() => {
        if (pendingOAuthCallback && mainWindow && !mainWindow.isDestroyed()) {
          console.log('[Main] Sending callback data again (500ms delay)...');
          mainWindow.webContents.send('oauth-callback', pendingOAuthCallback);
          console.log('[Main] ✅ Second IPC send completed');
        }
      }, 500);
      
      // Send again after 1.5s (final attempt)
      setTimeout(() => {
        if (pendingOAuthCallback && mainWindow && !mainWindow.isDestroyed()) {
          console.log('[Main] Sending callback data again (1.5s delay)...');
          mainWindow.webContents.send('oauth-callback', pendingOAuthCallback);
          console.log('[Main] ✅ Third IPC send completed');
        }
      }, 1500);
    };
    
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.once('did-finish-load', sendDataMultipleTimes);
    }
    
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.loadURL(callbackUrl).catch((err) => {
        console.error('[Main] Error loading callback page:', err);
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.removeListener('did-finish-load', sendDataMultipleTimes);
        }
        // Fallback: send data via IPC immediately
        if (pendingOAuthCallback && mainWindow && !mainWindow.isDestroyed()) {
          console.log('[Main] Sending callback data via IPC as fallback...');
          mainWindow.webContents.send('oauth-callback', pendingOAuthCallback);
          pendingOAuthCallback = null;
        }
      });
    }
  } catch (error) {
    console.error('[Main] Error parsing protocol URL:', error);
  }
}

// App event handlers
app.whenReady().then(() => {
  // Register custom protocol
  registerProtocol();

  // Handle protocol URL on macOS (when app is already running)
  app.on('open-url', (event, url) => {
    event.preventDefault();
    handleProtocolUrl(url);
  });

  database.init();
  try {
    ratesDatabase.init();
  } catch (error) {
    console.warn('Rates database initialization failed:', error);
  }
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Handle protocol URL on Windows/Linux (when app is launched via protocol)
if (process.platform === 'win32' || process.platform === 'linux') {
  const gotTheLock = app.requestSingleInstanceLock();

  if (!gotTheLock) {
    app.quit();
  } else {
    app.on('second-instance', (_event, commandLine) => {
      // Someone tried to run a second instance, focus our window instead
      if (mainWindow) {
        if (mainWindow.isMinimized()) {
          mainWindow.restore();
        }
        mainWindow.focus();
      }

      // Check if protocol URL is in command line
      const protocolUrl = commandLine.find(arg => arg.startsWith(`${PROTOCOL_NAME}://`));
      if (protocolUrl) {
        handleProtocolUrl(protocolUrl);
      }
    });
  }
} else {
  // macOS: handle protocol URL when app is launched
  const protocolUrl = process.argv.find(arg => arg.startsWith(`${PROTOCOL_NAME}://`));
  if (protocolUrl) {
    // Delay to ensure app is ready
    setTimeout(() => {
      handleProtocolUrl(protocolUrl);
    }, 1000);
  }
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  database.close();
  ratesDatabase.close();
});

// IPC handlers for database operations
ipcMain.handle('db:saveAgent', async (_, agent) => {
  try {
    const id = database.createAgent(agent);
    return { success: true, id };
  } catch (error) {
    console.error('Error saving agent:', error);
    return { success: false, error: String(error) };
  }
});

ipcMain.handle('db:getAllAgents', async () => {
  try {
    const agents = database.getAllAgents();
    return { success: true, data: agents };
  } catch (error) {
    console.error('Error getting agents:', error);
    return { success: false, error: String(error), data: [] };
  }
});

ipcMain.handle('db:getAgentById', async (_, id) => {
  try {
    const agent = database.getAgentById(id);
    if (!agent) {
      return { success: false, error: 'Agent not found' };
    }
    return { success: true, data: agent };
  } catch (error) {
    console.error('Error getting agent:', error);
    return { success: false, error: String(error) };
  }
});

ipcMain.handle('db:deleteAgent', async (_, id) => {
  try {
    const deleted = database.deleteAgent(id);
    if (!deleted) {
      return { success: false, error: 'Agent not found' };
    }
    return { success: true };
  } catch (error) {
    console.error('Error deleting agent:', error);
    return { success: false, error: String(error) };
  }
});

ipcMain.handle('db:updateAgent', async (_, id, agent) => {
  try {
    const updated = database.updateAgent(id, agent);
    if (!updated) {
      return { success: false, error: 'Agent not found' };
    }
    return { success: true };
  } catch (error) {
    console.error('Error updating agent:', error);
    return { success: false, error: String(error) };
  }
});

// IPC handlers for illustrations
ipcMain.handle('db:saveIllustration', async (_, illustration) => {
  try {
    database.createIllustration(illustration);
    return { success: true };
  } catch (error) {
    console.error('Error saving illustration:', error);
    return { success: false, error: String(error) };
  }
});

ipcMain.handle('db:getAllIllustrations', async () => {
  try {
    const illustrations = database.getAllIllustrations();
    return { success: true, data: illustrations };
  } catch (error) {
    console.error('Error getting illustrations:', error);
    return { success: false, error: String(error), data: [] };
  }
});

ipcMain.handle('db:updateIllustrationPdfPath', async (_, id, pdfPath) => {
  try {
    const updated = database.updateIllustrationPdfPath(id, pdfPath);
    if (!updated) {
      return { success: false, error: 'Illustration not found' };
    }
    return { success: true };
  } catch (error) {
    console.error('Error updating illustration PDF path:', error);
    return { success: false, error: String(error) };
  }
});

ipcMain.handle('db:deleteIllustration', async (_, id) => {
  try {
    const deleted = database.deleteIllustration(id);
    if (!deleted) {
      return { success: false, error: 'Illustration not found' };
    }
    return { success: true };
  } catch (error) {
    console.error('Error deleting illustration:', error);
    return { success: false, error: String(error) };
  }
});

ipcMain.handle('db:deleteIllustrationByQuoteId', async (_, quoteId) => {
  try {
    const deleted = database.deleteIllustrationByQuoteId(quoteId);
    return { success: true, deleted: deleted };
  } catch (error) {
    console.error('Error deleting illustration by quoteId:', error);
    return { success: false, error: String(error) };
  }
});

// IPC handlers for generic database operations (for quotes)
ipcMain.handle('db:execute', async (_, sql: string, params: any[] = []) => {
  try {
    const result = database.execute(sql, params);
    return { 
      success: true, 
      insertId: result.insertId, 
      rowsAffected: result.rowsAffected 
    };
  } catch (error) {
    console.error('Error executing SQL:', error);
    return { success: false, error: String(error), insertId: 0, rowsAffected: 0 };
  }
});

ipcMain.handle('db:query', async (_, sql: string, params: any[] = []) => {
  try {
    const result = database.executeQuery(sql, params);
    return { success: true, rows: result.rows };
  } catch (error) {
    console.error('Error querying SQL:', error);
    return { success: false, error: String(error), rows: [] };
  }
});

// IPC handlers for rates database operations
ipcMain.handle('rates:getRate', async (_, params) => {
  try {
    const result = ratesDatabase.getRate(params);
    if (!result) {
      return { success: false, error: 'Rate not found' };
    }
    return { success: true, data: result };
  } catch (error) {
    console.error('Error getting rate:', error);
    return { success: false, error: String(error) };
  }
});

ipcMain.handle('rates:getTermRate', async (_, params) => {
  try {
    const result = ratesDatabase.getTermRate(params);
    if (!result) {
      return { success: false, error: 'Term rate not found' };
    }
    return { success: true, data: result };
  } catch (error) {
    console.error('Error getting term rate:', error);
    return { success: false, error: String(error) };
  }
});

ipcMain.handle('rates:getAllTermRates', async (_, controlCode, age, gender, smokingStatus, paymentMode, paymentMethod) => {
  try {
    const results = ratesDatabase.getAllTermRates(controlCode, age, gender, smokingStatus, paymentMode, paymentMethod);
    return { success: true, data: results };
  } catch (error) {
    console.error('Error getting all term rates:', error);
    return { success: false, error: String(error), data: [] };
  }
});

ipcMain.handle('rates:getIllustrationFactor', async (_, params) => {
  try {
    const factor = ratesDatabase.getIllustrationFactor(params);
    return { success: true, data: factor };
  } catch (error) {
    console.error('Error getting illustration factor:', error);
    return { success: false, error: String(error), data: 0 };
  }
});

ipcMain.handle('rates:getAllIllustrationFactors', async (_, planCode, kind, sex, issueAge, risk) => {
  try {
    const factors = ratesDatabase.getAllIllustrationFactors(planCode, kind, sex, issueAge, risk);
    return { success: true, data: factors };
  } catch (error) {
    console.error('Error getting all illustration factors:', error);
    return { success: false, error: String(error), data: [] };
  }
});

ipcMain.handle('rates:getRiskRatingFactor', async (_, params) => {
  try {
    const factor = ratesDatabase.getRiskRatingFactor(params);
    return { success: true, data: factor };
  } catch (error) {
    console.error('Error getting risk rating factor:', error);
    return { success: false, error: String(error), data: 0 };
  }
});

ipcMain.handle('rates:getAvailableAges', async (_, controlCode) => {
  try {
    const ages = ratesDatabase.getAvailableAges(controlCode);
    return { success: true, data: ages };
  } catch (error) {
    console.error('Error getting available ages:', error);
    return { success: false, error: String(error), data: [] };
  }
});

ipcMain.handle('rates:checkRateExists', async (_, params) => {
  try {
    const exists = ratesDatabase.checkRateExists(params);
    return { success: true, data: exists };
  } catch (error) {
    console.error('Error checking rate existence:', error);
    return { success: false, error: String(error), data: false };
  }
});

ipcMain.handle('rates:getRatesForAgeRange', async (_, controlCode, minAge, maxAge, gender, smokingStatus, paymentMode, paymentMethod) => {
  try {
    const rates = ratesDatabase.getRatesForAgeRange(controlCode, minAge, maxAge, gender, smokingStatus, paymentMode, paymentMethod);
    return { success: true, data: rates };
  } catch (error) {
    console.error('Error getting rates for age range:', error);
    return { success: false, error: String(error), data: [] };
  }
});

ipcMain.handle('rates:query', async (_, sql, params = []) => {
  try {
    const results = ratesDatabase.query(sql, params);
    return { success: true, data: results };
  } catch (error) {
    console.error('Error executing rates query:', error);
    return { success: false, error: String(error), data: [] };
  }
});

ipcMain.handle('rates:getPlanRate', async (_, controlCode, age, gender, smokingStatus, paymentMethod) => {
  try {
    const results = ratesDatabase.getPlanRate(controlCode, age, gender, smokingStatus, paymentMethod);
    return { success: true, data: results };
  } catch (error) {
    console.error('Error getting plan rate:', error);
    return { success: false, error: String(error), data: [] };
  }
});

ipcMain.handle('rates:getBasicRateByPlanCode', async (_, planCode, age, gender, smokingStatus) => {
  try {
    const rate = ratesDatabase.getBasicRateByPlanCode(planCode, age, gender, smokingStatus);
    return { success: true, data: rate };
  } catch (error) {
    console.error('Error getting basic rate by plan code:', error);
    return { success: false, error: String(error), data: null };
  }
});

ipcMain.handle('rates:getBasicRateByPlanCodeAndAge', async (_, planCode, age) => {
  try {
    const rate = ratesDatabase.getBasicRateByPlanCodeAndAge(planCode, age);
    return { success: true, data: rate };
  } catch (error) {
    console.error('Error getting basic rate by plan code and age:', error);
    return { success: false, error: String(error), data: null };
  }
});

ipcMain.handle('rates:getBasicRateByControlCode', async (_, controlCode) => {
  try {
    const rate = ratesDatabase.getBasicRateByControlCode(controlCode);
    return { success: true, data: rate };
  } catch (error) {
    console.error('Error getting basic rate by control code:', error);
    return { success: false, error: String(error), data: null };
  }
});

ipcMain.handle('rates:getServiceFee', async (_, planCode, paymentMode, paymentMethod) => {
  try {
    const fee = ratesDatabase.getServiceFee(planCode, paymentMode, paymentMethod);
    return { success: true, data: fee };
  } catch (error) {
    console.error('Error getting service fee:', error);
    return { success: false, error: String(error), data: null };
  }
});

ipcMain.handle('rates:getModeFactor', async (_, planCode, paymentMode, paymentMethod) => {
  try {
    const factor = ratesDatabase.getModeFactor(planCode, paymentMode, paymentMethod);
    return { success: true, data: factor };
  } catch (error) {
    console.error('Error getting mode factor:', error);
    return { success: false, error: String(error), data: null };
  }
});

ipcMain.handle('rates:getPaidUpAdditionPremiumRates', async (_, planCode, sex, risk, minIssueAge, maxIssueAge) => {
  try {
    const rates = ratesDatabase.getPaidUpAdditionPremiumRates(planCode, sex, risk, minIssueAge, maxIssueAge);
    return { success: true, data: rates };
  } catch (error) {
    console.error('Error getting paid-up addition premium rates:', error);
    return { success: false, error: String(error), data: [] };
  }
});

ipcMain.handle('rates:getPaidUpAdditionDividendRates', async (_, planCode, sex, risk, minIssueAge, maxIssueAge) => {
  try {
    const rates = ratesDatabase.getPaidUpAdditionDividendRates(planCode, sex, risk, minIssueAge, maxIssueAge);
    return { success: true, data: rates };
  } catch (error) {
    console.error('Error getting paid-up addition dividend rates:', error);
    return { success: false, error: String(error), data: [] };
  }
});

ipcMain.handle('rates:getCashRates', async (_, planCode, sex, issueAge, risk) => {
  try {
    const rates = ratesDatabase.getCashRates(planCode, sex, issueAge, risk);
    return { success: true, data: rates };
  } catch (error) {
    console.error('Error getting cash rates:', error);
    return { success: false, error: String(error), data: [] };
  }
});

ipcMain.handle('rates:getNSPRate', async (_, planCode, sex, issueAge, risk) => {
  try {
    const rate = ratesDatabase.getNSPRate(planCode, sex, issueAge, risk);
    return { success: true, data: rate };
  } catch (error) {
    console.error('Error getting NSP rate:', error);
    return { success: false, error: String(error), data: null };
  }
});

ipcMain.handle('rates:getFaceAmountLimits', async (_, planCode) => {
  try {
    const limits = ratesDatabase.getFaceAmountLimits(planCode);
    return { success: true, data: limits };
  } catch (error) {
    console.error('Error getting face amount limits:', error);
    return { success: false, error: String(error), data: null };
  }
});

ipcMain.handle('rates:getTableNames', async () => {
  try {
    const tables = ratesDatabase.getTableNames();
    return { success: true, data: tables };
  } catch (error) {
    console.error('Error getting table names:', error);
    return { success: false, error: String(error), data: [] };
  }
});

ipcMain.handle('rates:tableExists', async (_, tableName) => {
  try {
    const exists = ratesDatabase.tableExists(tableName);
    return { success: true, data: exists };
  } catch (error) {
    console.error('Error checking table existence:', error);
    return { success: false, error: String(error), data: false };
  }
});

ipcMain.handle('rates:getTableRecordCount', async (_, tableName) => {
  try {
    const count = ratesDatabase.getTableRecordCount(tableName);
    return { success: true, data: count };
  } catch (error) {
    console.error('Error getting table record count:', error);
    return { success: false, error: String(error), data: 0 };
  }
});

// IPC handler for PDF generation
ipcMain.handle('pdf:generateFromHTML', async (_, htmlContent: string, options?: {
  margins?: {
    top?: number;
    bottom?: number;
    left?: number;
    right?: number;
  };
  pageSize?: 'A4' | 'Letter' | 'Legal' | 'Tabloid' | 'Ledger' | 'A3' | 'A5' | 'A6';
  landscape?: boolean;
  printBackground?: boolean;
}) => {
  try {
    // Create a hidden window for rendering HTML
    const pdfWindow = new BrowserWindow({
      show: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
      },
    });

    // Load HTML content
    await pdfWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`);

    // Wait for content to load
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Generate PDF with options
    const pdfOptions: any = {
      pageSize: options?.pageSize || 'A4',
      printBackground: options?.printBackground !== false,
      landscape: options?.landscape || false,
    };

    // Handle margins
    if (options?.margins) {
      pdfOptions.marginsType = 2; // Custom margins
      pdfOptions.margins = {
        top: options.margins.top || 0,
        bottom: options.margins.bottom || 0,
        left: options.margins.left || 0,
        right: options.margins.right || 0,
      };
    } else {
      pdfOptions.marginsType = 0; // No margins
    }

    const pdfBuffer = await pdfWindow.webContents.printToPDF(pdfOptions);

    // Close the window
    pdfWindow.close();

    return { success: true, data: pdfBuffer };
  } catch (error) {
    console.error('Error generating PDF:', error);
    return { success: false, error: String(error) };
  }
});

// IPC handler for saving PDF file
ipcMain.handle('pdf:saveFile', async (_, pdfBuffer: Buffer, defaultFileName?: string) => {
  try {
    const { canceled, filePath } = await dialog.showSaveDialog({
      title: 'Save PDF',
      defaultPath: defaultFileName || 'document.pdf',
      filters: [
        { name: 'PDF Files', extensions: ['pdf'] },
        { name: 'All Files', extensions: ['*'] },
      ],
    });

    if (canceled || !filePath) {
      return { success: false, error: 'Save dialog canceled' };
    }

    await writeFile(filePath, pdfBuffer);
    return { success: true, filePath };
  } catch (error) {
    console.error('Error saving PDF file:', error);
    return { success: false, error: String(error) };
  }
});

// IPC handler for saving PDF file to a specific path without dialog
ipcMain.handle('pdf:saveFileToPath', async (_, pdfBuffer: Buffer, filePath: string) => {
  try {
    // Ensure directory exists
    const dir = path.dirname(filePath);
    const fs = await import('fs');
    if (!fs.existsSync(dir)) {
      await fs.promises.mkdir(dir, { recursive: true });
    }

    await writeFile(filePath, pdfBuffer);
    return { success: true, filePath };
  } catch (error) {
    console.error('Error saving PDF file to path:', error);
    return { success: false, error: String(error) };
  }
});

// IPC handler for opening PDF file
ipcMain.handle('pdf:openFile', async (_, filePath: string) => {
  try {
    await shell.openPath(filePath);
    return { success: true };
  } catch (error) {
    console.error('Error opening PDF file:', error);
    return { success: false, error: String(error) };
  }
});

// IPC handler for reading PDF file as ArrayBuffer
ipcMain.handle('pdf:readFile', async (_, filePath: string) => {
  try {
    const fileBuffer = await readFile(filePath);
    // Конвертуємо Buffer в ArrayBuffer для передачі через IPC
    const arrayBuffer = fileBuffer.buffer.slice(
      fileBuffer.byteOffset,
      fileBuffer.byteOffset + fileBuffer.byteLength
    );
    return { success: true, data: Array.from(new Uint8Array(arrayBuffer)) };
  } catch (error) {
    console.error('Error reading PDF file:', error);
    return { success: false, error: String(error) };
  }
});

// IPC handler for checking if file exists
ipcMain.handle('pdf:fileExists', async (_, filePath: string) => {
  try {
    const exists = existsSync(filePath);
    return { success: true, data: exists };
  } catch (error) {
    console.error('Error checking file existence:', error);
    return { success: false, error: String(error), data: false };
  }
});

// IPC handler for converting image to base64
ipcMain.handle('pdf:convertImageToBase64', async (_, imagePath: string) => {
  try {
    const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
    
    // Remove leading slash from imagePath
    const cleanImagePath = imagePath.startsWith('/') 
      ? imagePath.substring(1) 
      : imagePath;
    
    // In dev mode, files are in public folder, in production they're in dist folder
    const baseDir = isDev ? 'public' : 'dist';
    
    // Get app path and resolve to project root
    const appPath = app.getAppPath();
    // If we're in electron/ directory, go up one level to project root
    const projectRoot = appPath.endsWith('electron') 
      ? path.join(appPath, '..') 
      : appPath;
    
    const fullImagePath = path.join(projectRoot, baseDir, cleanImagePath);
    
    console.log(`[Main] Converting image to base64: ${fullImagePath}`);
    
    // Check if file exists
    if (!existsSync(fullImagePath)) {
      console.warn(`[Main] Image file not found: ${fullImagePath}`);
      return { success: false, error: 'File not found' };
    }
    
    // Read file
    const fileBuffer = await readFile(fullImagePath);
    
    // Convert to base64
    const base64 = fileBuffer.toString('base64');
    
    // Determine MIME type from file extension
    const extension = cleanImagePath.split('.').pop()?.toLowerCase();
    let mimeType = 'image/png'; // default
    if (extension === 'jpg' || extension === 'jpeg') {
      mimeType = 'image/jpeg';
    } else if (extension === 'png') {
      mimeType = 'image/png';
    } else if (extension === 'gif') {
      mimeType = 'image/gif';
    } else if (extension === 'webp') {
      mimeType = 'image/webp';
    }
    
    const dataUrl = `data:${mimeType};base64,${base64}`;
    
    return { success: true, data: dataUrl };
  } catch (error) {
    console.error('Error converting image to base64:', error);
    return { success: false, error: String(error) };
  }
});

// IPC handler for getting userData directory path
console.log('[Main] Registering app:getUserDataPath handler at module load time');
ipcMain.handle('app:getUserDataPath', async () => {
  console.log('[Main] app:getUserDataPath handler called');
  try {
    const userDataPath = app.getPath('userData');
    console.log('[Main] UserData path:', userDataPath);
    return { success: true, data: userDataPath };
  } catch (error) {
    console.error('[Main] Error getting userData path:', error);
    return { success: false, error: String(error) };
  }
});
console.log('[Main] app:getUserDataPath handler registered successfully');

// IPC handler for getting app directory path (where PDFs should be saved)
ipcMain.handle('app:getAppPath', async () => {
  console.log('[Main] app:getAppPath handler called');
  try {
    const appPath = app.getAppPath();
    console.log('[Main] App path:', appPath);
    return { success: true, data: appPath };
  } catch (error) {
    console.error('[Main] Error getting app path:', error);
    return { success: false, error: String(error) };
  }
});

// IPC handler for OAuth callback ready - send pending callback data
ipcMain.on('oauth-callback-ready', () => {
  console.log('[Main] ===== OAuth callback ready signal received =====');
  console.log('[Main] Pending callback data:', pendingOAuthCallback);
  console.log('[Main] Main window exists:', !!mainWindow);
  console.log('[Main] Main window destroyed:', mainWindow?.isDestroyed());
  
  if (pendingOAuthCallback && mainWindow && !mainWindow.isDestroyed()) {
    console.log('[Main] Sending pending OAuth callback data to renderer...');
    console.log('[Main] Data being sent:', {
      code: pendingOAuthCallback.code ? pendingOAuthCallback.code.substring(0, 20) + '...' : undefined,
      state: pendingOAuthCallback.state,
      error: pendingOAuthCallback.error
    });
    // Send immediately
    mainWindow.webContents.send('oauth-callback', pendingOAuthCallback);
    console.log('[Main] ✅ Callback data sent via IPC');
    pendingOAuthCallback = null; // Clear after sending
  } else {
    console.warn('[Main] ❌ Cannot send callback data:', {
      hasPendingData: !!pendingOAuthCallback,
      hasMainWindow: !!mainWindow,
      isDestroyed: mainWindow?.isDestroyed()
    });
  }
});

// IPC handler for getting PDFs directory path (inside app directory)
ipcMain.handle('app:getPdfsPath', async () => {
  console.log('[Main] app:getPdfsPath handler called');
  try {
    // Use userData for PDFs (standard location for app data)
    // This works in both development and production
    const userDataPath = app.getPath('userData');
    const pdfsPath = path.join(userDataPath, 'pdfs');
    
    // Ensure directory exists
    const fs = await import('fs');
    if (!fs.existsSync(pdfsPath)) {
      await fs.promises.mkdir(pdfsPath, { recursive: true });
      console.log('[Main] Created PDFs directory:', pdfsPath);
    }
    
    console.log('[Main] PDFs path:', pdfsPath);
    return { success: true, data: pdfsPath };
  } catch (error) {
    console.error('[Main] Error getting PDFs path:', error);
    return { success: false, error: String(error) };
  }
});

// IPC handler for resetting quotes and PDFs database (dev mode only)
ipcMain.handle('db:resetQuotesAndPDFs', async () => {
  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
  
  if (!isDev) {
    return { success: false, error: 'This operation is only available in development mode' };
  }

  try {
    // Reset database tables
    const result = database.resetQuotesAndPDFs();
    
    // Delete all PDF files from the PDFs directory
    const userDataPath = app.getPath('userData');
    const pdfsPath = path.join(userDataPath, 'pdfs');
    
    let deletedFilesCount = 0;
    if (existsSync(pdfsPath)) {
      try {
        const files = readdirSync(pdfsPath);
        for (const file of files) {
          if (file.endsWith('.pdf')) {
            const filePath = path.join(pdfsPath, file);
            await rm(filePath, { force: true });
            deletedFilesCount++;
          }
        }
      } catch (error) {
        console.warn('Error deleting PDF files:', error);
      }
    }
    
    return {
      success: true,
      deletedCounts: result.deletedCounts,
      deletedFilesCount,
    };
  } catch (error) {
    console.error('Error resetting quotes and PDFs:', error);
    return { success: false, error: String(error) };
  }
});

// IPC handlers for rates database version and updates
ipcMain.handle('rates:getDatabaseVersion', async (_, accessToken?: string) => {
  try {
    const BASE_URL = process.env.VITE_BACKEND_API_URL || 'https://nfl-api.test.emorydevelopment.com';
    const url = `${BASE_URL}/api/version/rate/latest/`;
    
    const headers: Record<string, string> = {};
    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }
    
    const response = await axios.get(url, { headers });
    return { success: true, data: response.data };
  } catch (error: any) {
    console.error('Error getting database version:', error);
    return { 
      success: false, 
      error: error?.response?.data?.message || error?.message || 'Unknown error',
      data: null 
    };
  }
});

ipcMain.handle('rates:downloadDatabase', async (_, accessToken?: string) => {
  try {
    const BASE_URL = process.env.VITE_BACKEND_API_URL || 'https://nfl-api.test.emorydevelopment.com';
    const url = `${BASE_URL}/api/version/rate/file/`;
    
    const headers: Record<string, string> = {};
    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }
    
    // Скачиваем файл как buffer
    const response = await axios.get(url, {
      headers,
      responseType: 'arraybuffer',
    });
    
    // Сохраняем во временный файл
    const userDataPath = app.getPath('userData');
    const tempPath = path.join(userDataPath, 'rates_temp.sqlite');
    
    await writeFile(tempPath, Buffer.from(response.data));
    
    // Проверяем размер файла
    const fsPromises = await import('fs/promises');
    const fileStats = await fsPromises.stat(tempPath);
    if (fileStats.size === 0) {
      await rm(tempPath, { force: true });
      throw new Error('Downloaded database file is empty');
    }
    
    return { success: true, data: tempPath };
  } catch (error: any) {
    console.error('Error downloading database:', error);
    return { 
      success: false, 
      error: error?.response?.data?.message || error?.message || 'Unknown error',
      data: null 
    };
  }
});

ipcMain.handle('rates:updateDatabase', async (_, accessToken?: string) => {
  try {
    console.log('[Main] 🔄 Starting rates database update...');
    console.log('[Main] 🎫 Access token provided:', !!accessToken);
    
    // 1. Скачиваем новую БД
    const BASE_URL = process.env.VITE_BACKEND_API_URL || 'https://nfl-api.test.emorydevelopment.com';
    const url = `${BASE_URL}/api/version/rate/file/`;
    console.log('[Main] 📥 Download URL:', url);
    
    const headers: Record<string, string> = {};
    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
      console.log('[Main] 🔐 Authorization header added');
    } else {
      console.warn('[Main] ⚠️ No access token provided');
    }
    
    console.log('[Main] 🌐 Downloading database file...');
    const response = await axios.get(url, {
      headers,
      responseType: 'arraybuffer',
      timeout: 300000, // 5 минут таймаут
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });
    console.log('[Main] ✅ Download completed, status:', response.status);
    console.log('[Main] 📊 Downloaded size:', response.data.byteLength, 'bytes');
    
    const userDataPath = app.getPath('userData');
    const tempPath = path.join(userDataPath, 'rates_temp.sqlite');
    console.log('[Main] 💾 Saving to temp path:', tempPath);
    
    await writeFile(tempPath, Buffer.from(response.data));
    console.log('[Main] ✅ File saved to temp path');
    
    // Проверяем размер файла
    const fsPromises = await import('fs/promises');
    const fileStats = await fsPromises.stat(tempPath);
    console.log('[Main] 📏 Temp file size:', fileStats.size, 'bytes');
    if (fileStats.size === 0) {
      console.error('[Main] ❌ Downloaded file is empty!');
      await rm(tempPath, { force: true });
      throw new Error('Downloaded database file is empty');
    }
    
    const downloadedPath = tempPath;
    console.log('[Main] ✅ File downloaded and validated');
    
    // 2. Закрываем базу данных перед заменой
    console.log('[Main] 🔒 Closing database before replacement...');
    try {
      ratesDatabase.close();
      console.log('[Main] ✅ Database closed');
    } catch (closeError) {
      console.warn('[Main] ⚠️ Error closing database (continuing anyway):', closeError);
    }
    
    // 3. Заменяем БД
    try {
      console.log('[Main] 🔄 Replacing database...');
      await ratesDatabase.replaceDatabase(downloadedPath);
      console.log('[Main] ✅ Database replaced successfully');
      
      // 4. Очищаем временный файл
      console.log('[Main] 🗑️ Cleaning up temp file...');
      await rm(downloadedPath, { force: true });
      console.log('[Main] ✅ Temp file removed');
      
      // 5. Очищаем старые backup'ы
      console.log('[Main] 🧹 Cleaning up old backups...');
      await ratesDatabase.cleanupOldBackups();
      console.log('[Main] ✅ Old backups cleaned');
      
      // 6. Получаем версию новой БД
      console.log('[Main] 📋 Getting new database version...');
      const versionUrl = `${BASE_URL}/api/version/rate/latest/`;
      const versionResponse = await axios.get(versionUrl, { headers });
      const newVersion = versionResponse.data?.rateDbVersion || null;
      console.log('[Main] 📦 New database version:', newVersion);
      
      console.log('[Main] ✅ Rates database updated successfully');
      return { 
        success: true, 
        version: newVersion,
        message: 'Database updated successfully'
      };
    } catch (error: any) {
      // Если замена не удалась, пробуем восстановить из backup
      console.error('[Main] ❌ Error replacing database:', error);
      console.error('[Main] Error details:', {
        message: error?.message,
        stack: error?.stack,
      });
      console.log('[Main] 🔄 Attempting restore from backup...');
      
      try {
        const restored = await ratesDatabase.restoreFromBackup();
        if (restored) {
          console.log('[Main] ✅ Database restored from backup');
          return { 
            success: false, 
            error: 'Failed to update database, restored from backup',
            restored: true 
          };
        } else {
          console.error('[Main] ❌ Failed to restore from backup');
        }
      } catch (restoreError: any) {
        console.error('[Main] ❌ Error restoring from backup:', restoreError);
        console.error('[Main] Restore error details:', {
          message: restoreError?.message,
          stack: restoreError?.stack,
        });
      }
      
      // Очищаем временный файл даже при ошибке
      try {
        console.log('[Main] 🗑️ Cleaning up temp file after error...');
        await rm(downloadedPath, { force: true });
        console.log('[Main] ✅ Temp file removed');
      } catch (rmError) {
        console.warn('[Main] ⚠️ Error removing temp file:', rmError);
        // Игнорируем ошибки удаления
      }
      
      throw error;
    }
  } catch (error: any) {
    console.error('[Main] ❌ Exception in updateDatabase handler:', error);
    console.error('[Main] Exception details:', {
      message: error?.message,
      stack: error?.stack,
      response: error?.response?.data,
      status: error?.response?.status,
    });
    return { 
      success: false, 
      error: error?.message || 'Unknown error',
      message: 'Failed to update database'
    };
  }
});

