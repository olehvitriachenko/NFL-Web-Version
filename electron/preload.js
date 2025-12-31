import { contextBridge, ipcRenderer } from 'electron';
// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electron', {
    // OAuth callback listener
    onOAuthCallback: (callback) => {
        // Register listener
        const handler = (_event, data) => {
            callback(data);
        };
        ipcRenderer.on('oauth-callback', handler);
        // Request pending callback immediately after registration
        ipcRenderer.send('oauth-callback-ready');
        // Return cleanup function
        return () => {
            ipcRenderer.removeListener('oauth-callback', handler);
        };
    },
    db: {
        saveAgent: (agent) => ipcRenderer.invoke('db:saveAgent', agent),
        getAllAgents: () => ipcRenderer.invoke('db:getAllAgents'),
        getAgentById: (id) => ipcRenderer.invoke('db:getAgentById', id),
        deleteAgent: (id) => ipcRenderer.invoke('db:deleteAgent', id),
        updateAgent: (id, agent) => ipcRenderer.invoke('db:updateAgent', id, agent),
        saveIllustration: (illustration) => ipcRenderer.invoke('db:saveIllustration', illustration),
        getAllIllustrations: () => ipcRenderer.invoke('db:getAllIllustrations'),
        updateIllustrationPdfPath: (id, pdfPath) => ipcRenderer.invoke('db:updateIllustrationPdfPath', id, pdfPath),
        deleteIllustration: (id) => ipcRenderer.invoke('db:deleteIllustration', id),
        deleteIllustrationByQuoteId: (quoteId) => ipcRenderer.invoke('db:deleteIllustrationByQuoteId', quoteId),
        execute: (sql, params) => ipcRenderer.invoke('db:execute', sql, params),
        query: (sql, params) => ipcRenderer.invoke('db:query', sql, params),
        resetQuotesAndPDFs: () => ipcRenderer.invoke('db:resetQuotesAndPDFs'),
    },
    rates: {
        getRate: (params) => ipcRenderer.invoke('rates:getRate', params),
        getTermRate: (params) => ipcRenderer.invoke('rates:getTermRate', params),
        getAllTermRates: (controlCode, age, gender, smokingStatus, paymentMode, paymentMethod) => ipcRenderer.invoke('rates:getAllTermRates', controlCode, age, gender, smokingStatus, paymentMode, paymentMethod),
        getIllustrationFactor: (params) => ipcRenderer.invoke('rates:getIllustrationFactor', params),
        getAllIllustrationFactors: (planCode, kind, sex, issueAge, risk) => ipcRenderer.invoke('rates:getAllIllustrationFactors', planCode, kind, sex, issueAge, risk),
        getRiskRatingFactor: (params) => ipcRenderer.invoke('rates:getRiskRatingFactor', params),
        getAvailableAges: (controlCode) => ipcRenderer.invoke('rates:getAvailableAges', controlCode),
        checkRateExists: (params) => ipcRenderer.invoke('rates:checkRateExists', params),
        getRatesForAgeRange: (controlCode, minAge, maxAge, gender, smokingStatus, paymentMode, paymentMethod) => ipcRenderer.invoke('rates:getRatesForAgeRange', controlCode, minAge, maxAge, gender, smokingStatus, paymentMode, paymentMethod),
        query: (sql, params) => ipcRenderer.invoke('rates:query', sql, params),
        getPlanRate: (controlCode, age, gender, smokingStatus, paymentMethod) => ipcRenderer.invoke('rates:getPlanRate', controlCode, age, gender, smokingStatus, paymentMethod),
        getBasicRateByPlanCode: (planCode, age, gender, smokingStatus) => ipcRenderer.invoke('rates:getBasicRateByPlanCode', planCode, age, gender, smokingStatus),
        getBasicRateByPlanCodeAndAge: (planCode, age) => ipcRenderer.invoke('rates:getBasicRateByPlanCodeAndAge', planCode, age),
        getBasicRateByControlCode: (controlCode) => ipcRenderer.invoke('rates:getBasicRateByControlCode', controlCode),
        getServiceFee: (planCode, paymentMode, paymentMethod) => ipcRenderer.invoke('rates:getServiceFee', planCode, paymentMode, paymentMethod),
        getModeFactor: (planCode, paymentMode, paymentMethod) => ipcRenderer.invoke('rates:getModeFactor', planCode, paymentMode, paymentMethod),
        getPaidUpAdditionPremiumRates: (planCode, sex, risk, minIssueAge, maxIssueAge) => ipcRenderer.invoke('rates:getPaidUpAdditionPremiumRates', planCode, sex, risk, minIssueAge, maxIssueAge),
        getPaidUpAdditionDividendRates: (planCode, sex, risk, minIssueAge, maxIssueAge) => ipcRenderer.invoke('rates:getPaidUpAdditionDividendRates', planCode, sex, risk, minIssueAge, maxIssueAge),
        getCashRates: (planCode, sex, issueAge, risk) => ipcRenderer.invoke('rates:getCashRates', planCode, sex, issueAge, risk),
        getNSPRate: (planCode, sex, issueAge, risk) => ipcRenderer.invoke('rates:getNSPRate', planCode, sex, issueAge, risk),
        getFaceAmountLimits: (planCode) => ipcRenderer.invoke('rates:getFaceAmountLimits', planCode),
        getTableNames: () => ipcRenderer.invoke('rates:getTableNames'),
        tableExists: (tableName) => ipcRenderer.invoke('rates:tableExists', tableName),
        getTableRecordCount: (tableName) => ipcRenderer.invoke('rates:getTableRecordCount', tableName),
        getDatabaseVersion: (accessToken) => ipcRenderer.invoke('rates:getDatabaseVersion', accessToken),
        downloadDatabase: (accessToken) => ipcRenderer.invoke('rates:downloadDatabase', accessToken),
        updateDatabase: (accessToken) => ipcRenderer.invoke('rates:updateDatabase', accessToken),
    },
    pdf: {
        generateFromHTML: (htmlContent, options) => ipcRenderer.invoke('pdf:generateFromHTML', htmlContent, options),
        saveFile: (pdfBuffer, defaultFileName) => ipcRenderer.invoke('pdf:saveFile', pdfBuffer, defaultFileName),
        saveFileToPath: (pdfBuffer, filePath) => ipcRenderer.invoke('pdf:saveFileToPath', pdfBuffer, filePath),
        openFile: (filePath) => ipcRenderer.invoke('pdf:openFile', filePath),
        readFile: (filePath) => ipcRenderer.invoke('pdf:readFile', filePath),
        fileExists: (filePath) => ipcRenderer.invoke('pdf:fileExists', filePath),
        convertImageToBase64: (imagePath) => ipcRenderer.invoke('pdf:convertImageToBase64', imagePath),
    },
    app: {
        getUserDataPath: () => ipcRenderer.invoke('app:getUserDataPath'),
        getAppPath: () => ipcRenderer.invoke('app:getAppPath'),
        getPdfsPath: () => ipcRenderer.invoke('app:getPdfsPath'),
    },
});
