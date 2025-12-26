import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { writeFile } from 'fs/promises';
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
ipcMain.handle('rates:getPlanRate', async (_, controlCode, age, gender, smokingStatus, paymentMethod) => {
    try {
        const results = ratesDatabase.getPlanRate(controlCode, age, gender, smokingStatus, paymentMethod);
        return { success: true, data: results };
    }
    catch (error) {
        console.error('Error getting plan rate:', error);
        return { success: false, error: String(error), data: [] };
    }
});
ipcMain.handle('rates:getBasicRateByPlanCode', async (_, planCode, age, gender, smokingStatus) => {
    try {
        const rate = ratesDatabase.getBasicRateByPlanCode(planCode, age, gender, smokingStatus);
        return { success: true, data: rate };
    }
    catch (error) {
        console.error('Error getting basic rate by plan code:', error);
        return { success: false, error: String(error), data: null };
    }
});
ipcMain.handle('rates:getBasicRateByPlanCodeAndAge', async (_, planCode, age) => {
    try {
        const rate = ratesDatabase.getBasicRateByPlanCodeAndAge(planCode, age);
        return { success: true, data: rate };
    }
    catch (error) {
        console.error('Error getting basic rate by plan code and age:', error);
        return { success: false, error: String(error), data: null };
    }
});
ipcMain.handle('rates:getBasicRateByControlCode', async (_, controlCode) => {
    try {
        const rate = ratesDatabase.getBasicRateByControlCode(controlCode);
        return { success: true, data: rate };
    }
    catch (error) {
        console.error('Error getting basic rate by control code:', error);
        return { success: false, error: String(error), data: null };
    }
});
ipcMain.handle('rates:getServiceFee', async (_, planCode, paymentMode, paymentMethod) => {
    try {
        const fee = ratesDatabase.getServiceFee(planCode, paymentMode, paymentMethod);
        return { success: true, data: fee };
    }
    catch (error) {
        console.error('Error getting service fee:', error);
        return { success: false, error: String(error), data: null };
    }
});
ipcMain.handle('rates:getModeFactor', async (_, planCode, paymentMode, paymentMethod) => {
    try {
        const factor = ratesDatabase.getModeFactor(planCode, paymentMode, paymentMethod);
        return { success: true, data: factor };
    }
    catch (error) {
        console.error('Error getting mode factor:', error);
        return { success: false, error: String(error), data: null };
    }
});
ipcMain.handle('rates:getPaidUpAdditionPremiumRates', async (_, planCode, sex, risk, minIssueAge, maxIssueAge) => {
    try {
        const rates = ratesDatabase.getPaidUpAdditionPremiumRates(planCode, sex, risk, minIssueAge, maxIssueAge);
        return { success: true, data: rates };
    }
    catch (error) {
        console.error('Error getting paid-up addition premium rates:', error);
        return { success: false, error: String(error), data: [] };
    }
});
ipcMain.handle('rates:getPaidUpAdditionDividendRates', async (_, planCode, sex, risk, minIssueAge, maxIssueAge) => {
    try {
        const rates = ratesDatabase.getPaidUpAdditionDividendRates(planCode, sex, risk, minIssueAge, maxIssueAge);
        return { success: true, data: rates };
    }
    catch (error) {
        console.error('Error getting paid-up addition dividend rates:', error);
        return { success: false, error: String(error), data: [] };
    }
});
ipcMain.handle('rates:getCashRates', async (_, planCode, sex, issueAge, risk) => {
    try {
        const rates = ratesDatabase.getCashRates(planCode, sex, issueAge, risk);
        return { success: true, data: rates };
    }
    catch (error) {
        console.error('Error getting cash rates:', error);
        return { success: false, error: String(error), data: [] };
    }
});
ipcMain.handle('rates:getNSPRate', async (_, planCode, sex, issueAge, risk) => {
    try {
        const rate = ratesDatabase.getNSPRate(planCode, sex, issueAge, risk);
        return { success: true, data: rate };
    }
    catch (error) {
        console.error('Error getting NSP rate:', error);
        return { success: false, error: String(error), data: null };
    }
});
ipcMain.handle('rates:getFaceAmountLimits', async (_, planCode) => {
    try {
        const limits = ratesDatabase.getFaceAmountLimits(planCode);
        return { success: true, data: limits };
    }
    catch (error) {
        console.error('Error getting face amount limits:', error);
        return { success: false, error: String(error), data: null };
    }
});
ipcMain.handle('rates:getTableNames', async () => {
    try {
        const tables = ratesDatabase.getTableNames();
        return { success: true, data: tables };
    }
    catch (error) {
        console.error('Error getting table names:', error);
        return { success: false, error: String(error), data: [] };
    }
});
ipcMain.handle('rates:tableExists', async (_, tableName) => {
    try {
        const exists = ratesDatabase.tableExists(tableName);
        return { success: true, data: exists };
    }
    catch (error) {
        console.error('Error checking table existence:', error);
        return { success: false, error: String(error), data: false };
    }
});
ipcMain.handle('rates:getTableRecordCount', async (_, tableName) => {
    try {
        const count = ratesDatabase.getTableRecordCount(tableName);
        return { success: true, data: count };
    }
    catch (error) {
        console.error('Error getting table record count:', error);
        return { success: false, error: String(error), data: 0 };
    }
});
// IPC handler for PDF generation
ipcMain.handle('pdf:generateFromHTML', async (_, htmlContent, options) => {
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
        const pdfOptions = {
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
        }
        else {
            pdfOptions.marginsType = 0; // No margins
        }
        const pdfBuffer = await pdfWindow.webContents.printToPDF(pdfOptions);
        // Close the window
        pdfWindow.close();
        return { success: true, data: pdfBuffer };
    }
    catch (error) {
        console.error('Error generating PDF:', error);
        return { success: false, error: String(error) };
    }
});
// IPC handler for saving PDF file
ipcMain.handle('pdf:saveFile', async (_, pdfBuffer, defaultFileName) => {
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
    }
    catch (error) {
        console.error('Error saving PDF file:', error);
        return { success: false, error: String(error) };
    }
});
// IPC handler for opening PDF file
ipcMain.handle('pdf:openFile', async (_, filePath) => {
    try {
        await shell.openPath(filePath);
        return { success: true };
    }
    catch (error) {
        console.error('Error opening PDF file:', error);
        return { success: false, error: String(error) };
    }
});
