import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// Database setup
const dbPath = path.join(app.getPath('userData'), 'nfl-database.db');
let db = null;
function initDatabase() {
    try {
        db = new Database(dbPath);
        // Create agents table if it doesn't exist
        db.exec(`
      CREATE TABLE IF NOT EXISTS agents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        firstName TEXT NOT NULL,
        lastName TEXT NOT NULL,
        street TEXT,
        city TEXT,
        state TEXT,
        zipCode TEXT,
        phone TEXT,
        email TEXT NOT NULL,
        createdAt TEXT NOT NULL
      )
    `);
        console.log('Database initialized at:', dbPath);
    }
    catch (error) {
        console.error('Database initialization error:', error);
    }
}
function createWindow() {
    const win = new BrowserWindow({
        width: 1200,
        height: 800,
        autoHideMenuBar: true,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: false,
        },
    });
    // Load the app
    const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
    if (isDev) {
        win.loadURL('http://localhost:5173');
        win.webContents.openDevTools();
    }
    else {
        win.loadFile(path.join(__dirname, '../dist/index.html'));
    }
}
// App event handlers
app.whenReady().then(() => {
    initDatabase();
    createWindow();
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
app.on('before-quit', () => {
    if (db) {
        db.close();
    }
});
// IPC handlers for database operations
ipcMain.handle('db:saveAgent', async (_, agent) => {
    try {
        if (!db) {
            initDatabase();
        }
        const stmt = db.prepare(`
      INSERT INTO agents (firstName, lastName, street, city, state, zipCode, phone, email, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
        const result = stmt.run(agent.firstName, agent.lastName, agent.street || '', agent.city || '', agent.state || '', agent.zipCode || '', agent.phone || '', agent.email, new Date().toISOString());
        return { success: true, id: result.lastInsertRowid };
    }
    catch (error) {
        console.error('Error saving agent:', error);
        return { success: false, error: String(error) };
    }
});
ipcMain.handle('db:getAllAgents', async () => {
    try {
        if (!db) {
            initDatabase();
        }
        const stmt = db.prepare('SELECT * FROM agents ORDER BY createdAt DESC');
        const agents = stmt.all();
        return { success: true, data: agents };
    }
    catch (error) {
        console.error('Error getting agents:', error);
        return { success: false, error: String(error), data: [] };
    }
});
ipcMain.handle('db:deleteAgent', async (_, id) => {
    try {
        if (!db) {
            initDatabase();
        }
        const stmt = db.prepare('DELETE FROM agents WHERE id = ?');
        stmt.run(id);
        return { success: true };
    }
    catch (error) {
        console.error('Error deleting agent:', error);
        return { success: false, error: String(error) };
    }
});
ipcMain.handle('db:updateAgent', async (_, id, agent) => {
    try {
        if (!db) {
            initDatabase();
        }
        const stmt = db.prepare(`
      UPDATE agents 
      SET firstName = ?, lastName = ?, street = ?, city = ?, state = ?, zipCode = ?, phone = ?, email = ?
      WHERE id = ?
    `);
        stmt.run(agent.firstName, agent.lastName, agent.street || '', agent.city || '', agent.state || '', agent.zipCode || '', agent.phone || '', agent.email, id);
        return { success: true };
    }
    catch (error) {
        console.error('Error updating agent:', error);
        return { success: false, error: String(error) };
    }
});
