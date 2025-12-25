import { contextBridge, ipcRenderer } from 'electron';
// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electron', {
    db: {
        saveAgent: (agent) => ipcRenderer.invoke('db:saveAgent', agent),
        getAllAgents: () => ipcRenderer.invoke('db:getAllAgents'),
        getAgentById: (id) => ipcRenderer.invoke('db:getAgentById', id),
        deleteAgent: (id) => ipcRenderer.invoke('db:deleteAgent', id),
        updateAgent: (id, agent) => ipcRenderer.invoke('db:updateAgent', id, agent),
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
    },
    pdf: {
        generateFromHTML: (htmlContent, options) => ipcRenderer.invoke('pdf:generateFromHTML', htmlContent, options),
        saveFile: (pdfBuffer, defaultFileName) => ipcRenderer.invoke('pdf:saveFile', pdfBuffer, defaultFileName),
    },
});
