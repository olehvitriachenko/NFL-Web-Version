import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { SQLiteDatabase } from './database.js';
import { RatesDatabase } from './rates-database.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// Database instances
const database = new SQLiteDatabase();
const ratesDatabase = new RatesDatabase();
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
    database.init();
    try {
        ratesDatabase.init();
    }
    catch (error) {
        console.warn('Rates database initialization failed:', error);
    }
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
    database.close();
    ratesDatabase.close();
});
// IPC handlers for database operations
ipcMain.handle('db:saveAgent', async (_, agent) => {
    try {
        const id = database.createAgent(agent);
        return { success: true, id };
    }
    catch (error) {
        console.error('Error saving agent:', error);
        return { success: false, error: String(error) };
    }
});
ipcMain.handle('db:getAllAgents', async () => {
    try {
        const agents = database.getAllAgents();
        return { success: true, data: agents };
    }
    catch (error) {
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
    }
    catch (error) {
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
    }
    catch (error) {
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
    }
    catch (error) {
        console.error('Error updating agent:', error);
        return { success: false, error: String(error) };
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
    }
    catch (error) {
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
    }
    catch (error) {
        console.error('Error getting term rate:', error);
        return { success: false, error: String(error) };
    }
});
ipcMain.handle('rates:getAllTermRates', async (_, controlCode, age, gender, smokingStatus, paymentMode, paymentMethod) => {
    try {
        const results = ratesDatabase.getAllTermRates(controlCode, age, gender, smokingStatus, paymentMode, paymentMethod);
        return { success: true, data: results };
    }
    catch (error) {
        console.error('Error getting all term rates:', error);
        return { success: false, error: String(error), data: [] };
    }
});
ipcMain.handle('rates:getIllustrationFactor', async (_, params) => {
    try {
        const factor = ratesDatabase.getIllustrationFactor(params);
        return { success: true, data: factor };
    }
    catch (error) {
        console.error('Error getting illustration factor:', error);
        return { success: false, error: String(error), data: 0 };
    }
});
ipcMain.handle('rates:getAllIllustrationFactors', async (_, planCode, kind, sex, issueAge, risk) => {
    try {
        const factors = ratesDatabase.getAllIllustrationFactors(planCode, kind, sex, issueAge, risk);
        return { success: true, data: factors };
    }
    catch (error) {
        console.error('Error getting all illustration factors:', error);
        return { success: false, error: String(error), data: [] };
    }
});
ipcMain.handle('rates:getRiskRatingFactor', async (_, params) => {
    try {
        const factor = ratesDatabase.getRiskRatingFactor(params);
        return { success: true, data: factor };
    }
    catch (error) {
        console.error('Error getting risk rating factor:', error);
        return { success: false, error: String(error), data: 0 };
    }
});
ipcMain.handle('rates:getAvailableAges', async (_, controlCode) => {
    try {
        const ages = ratesDatabase.getAvailableAges(controlCode);
        return { success: true, data: ages };
    }
    catch (error) {
        console.error('Error getting available ages:', error);
        return { success: false, error: String(error), data: [] };
    }
});
ipcMain.handle('rates:checkRateExists', async (_, params) => {
    try {
        const exists = ratesDatabase.checkRateExists(params);
        return { success: true, data: exists };
    }
    catch (error) {
        console.error('Error checking rate existence:', error);
        return { success: false, error: String(error), data: false };
    }
});
ipcMain.handle('rates:getRatesForAgeRange', async (_, controlCode, minAge, maxAge, gender, smokingStatus, paymentMode, paymentMethod) => {
    try {
        const rates = ratesDatabase.getRatesForAgeRange(controlCode, minAge, maxAge, gender, smokingStatus, paymentMode, paymentMethod);
        return { success: true, data: rates };
    }
    catch (error) {
        console.error('Error getting rates for age range:', error);
        return { success: false, error: String(error), data: [] };
    }
});
ipcMain.handle('rates:query', async (_, sql, params = []) => {
    try {
        const results = ratesDatabase.query(sql, params);
        return { success: true, data: results };
    }
    catch (error) {
        console.error('Error executing rates query:', error);
        return { success: false, error: String(error), data: [] };
    }
});
