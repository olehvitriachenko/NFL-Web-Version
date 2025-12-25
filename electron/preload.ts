import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electron', {
  db: {
    saveAgent: (agent: any) => ipcRenderer.invoke('db:saveAgent', agent),
    getAllAgents: () => ipcRenderer.invoke('db:getAllAgents'),
    getAgentById: (id: number) => ipcRenderer.invoke('db:getAgentById', id),
    deleteAgent: (id: number) => ipcRenderer.invoke('db:deleteAgent', id),
    updateAgent: (id: number, agent: any) => ipcRenderer.invoke('db:updateAgent', id, agent),
  },
  rates: {
    getRate: (params: any) => ipcRenderer.invoke('rates:getRate', params),
    getTermRate: (params: any) => ipcRenderer.invoke('rates:getTermRate', params),
    getAllTermRates: (controlCode: string, age: number, gender: string, smokingStatus: string, paymentMode: string, paymentMethod: string) => 
      ipcRenderer.invoke('rates:getAllTermRates', controlCode, age, gender, smokingStatus, paymentMode, paymentMethod),
    getIllustrationFactor: (params: any) => ipcRenderer.invoke('rates:getIllustrationFactor', params),
    getAllIllustrationFactors: (planCode: string, kind: string, sex: string, issueAge: number, risk?: string) => 
      ipcRenderer.invoke('rates:getAllIllustrationFactors', planCode, kind, sex, issueAge, risk),
    getRiskRatingFactor: (params: any) => ipcRenderer.invoke('rates:getRiskRatingFactor', params),
    getAvailableAges: (controlCode: string) => ipcRenderer.invoke('rates:getAvailableAges', controlCode),
    checkRateExists: (params: any) => ipcRenderer.invoke('rates:checkRateExists', params),
    getRatesForAgeRange: (controlCode: string, minAge: number, maxAge: number, gender: string, smokingStatus: string, paymentMode: string, paymentMethod: string) => 
      ipcRenderer.invoke('rates:getRatesForAgeRange', controlCode, minAge, maxAge, gender, smokingStatus, paymentMode, paymentMethod),
    query: (sql: string, params?: any[]) => ipcRenderer.invoke('rates:query', sql, params),
  },
});

// Type declaration for TypeScript
declare global {
  interface Window {
    electron: {
      db: {
        saveAgent: (agent: any) => Promise<{ success: boolean; id?: number; error?: string }>;
        getAllAgents: () => Promise<{ success: boolean; data: any[]; error?: string }>;
        getAgentById: (id: number) => Promise<{ success: boolean; data?: any; error?: string }>;
        deleteAgent: (id: number) => Promise<{ success: boolean; error?: string }>;
        updateAgent: (id: number, agent: any) => Promise<{ success: boolean; error?: string }>;
      };
      rates: {
        getRate: (params: any) => Promise<{ success: boolean; data?: any; error?: string }>;
        getTermRate: (params: any) => Promise<{ success: boolean; data?: any; error?: string }>;
        getAllTermRates: (controlCode: string, age: number, gender: string, smokingStatus: string, paymentMode: string, paymentMethod: string) => 
          Promise<{ success: boolean; data?: any[]; error?: string }>;
        getIllustrationFactor: (params: any) => Promise<{ success: boolean; data?: number; error?: string }>;
        getAllIllustrationFactors: (planCode: string, kind: string, sex: string, issueAge: number, risk?: string) => 
          Promise<{ success: boolean; data?: Array<{ Duration: number; Factor: number }>; error?: string }>;
        getRiskRatingFactor: (params: any) => Promise<{ success: boolean; data?: number; error?: string }>;
        getAvailableAges: (controlCode: string) => Promise<{ success: boolean; data?: number[]; error?: string }>;
        checkRateExists: (params: any) => Promise<{ success: boolean; data?: boolean; error?: string }>;
        getRatesForAgeRange: (controlCode: string, minAge: number, maxAge: number, gender: string, smokingStatus: string, paymentMode: string, paymentMethod: string) => 
          Promise<{ success: boolean; data?: any[]; error?: string }>;
        query: (sql: string, params?: any[]) => Promise<{ success: boolean; data?: any[]; error?: string }>;
      };
    };
  }
}

