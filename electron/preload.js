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
    },
});
