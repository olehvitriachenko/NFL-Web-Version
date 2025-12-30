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
    saveIllustration: (illustration: any) => ipcRenderer.invoke('db:saveIllustration', illustration),
    getAllIllustrations: () => ipcRenderer.invoke('db:getAllIllustrations'),
    updateIllustrationPdfPath: (id: string, pdfPath: string) => ipcRenderer.invoke('db:updateIllustrationPdfPath', id, pdfPath),
    deleteIllustration: (id: string) => ipcRenderer.invoke('db:deleteIllustration', id),
    deleteIllustrationByQuoteId: (quoteId: string | number) => ipcRenderer.invoke('db:deleteIllustrationByQuoteId', quoteId),
    execute: (sql: string, params?: any[]) => ipcRenderer.invoke('db:execute', sql, params),
    query: (sql: string, params?: any[]) => ipcRenderer.invoke('db:query', sql, params),
    resetQuotesAndPDFs: () => ipcRenderer.invoke('db:resetQuotesAndPDFs'),
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
    getPlanRate: (controlCode: string, age: number, gender: string, smokingStatus: string, paymentMethod?: string) => 
      ipcRenderer.invoke('rates:getPlanRate', controlCode, age, gender, smokingStatus, paymentMethod),
    getBasicRateByPlanCode: (planCode: string, age: number, gender: string, smokingStatus: string) => 
      ipcRenderer.invoke('rates:getBasicRateByPlanCode', planCode, age, gender, smokingStatus),
    getBasicRateByPlanCodeAndAge: (planCode: string, age: number) => 
      ipcRenderer.invoke('rates:getBasicRateByPlanCodeAndAge', planCode, age),
    getBasicRateByControlCode: (controlCode: string) => 
      ipcRenderer.invoke('rates:getBasicRateByControlCode', controlCode),
    getServiceFee: (planCode: string, paymentMode: string, paymentMethod?: string) => 
      ipcRenderer.invoke('rates:getServiceFee', planCode, paymentMode, paymentMethod),
    getModeFactor: (planCode: string, paymentMode: string, paymentMethod?: string) => 
      ipcRenderer.invoke('rates:getModeFactor', planCode, paymentMode, paymentMethod),
    getPaidUpAdditionPremiumRates: (planCode: string, sex: string, risk: string, minIssueAge: number, maxIssueAge: number) => 
      ipcRenderer.invoke('rates:getPaidUpAdditionPremiumRates', planCode, sex, risk, minIssueAge, maxIssueAge),
    getPaidUpAdditionDividendRates: (planCode: string, sex: string, risk: string | null, minIssueAge: number, maxIssueAge: number) => 
      ipcRenderer.invoke('rates:getPaidUpAdditionDividendRates', planCode, sex, risk, minIssueAge, maxIssueAge),
    getCashRates: (planCode: string, sex: string, issueAge: number, risk: string | null) => 
      ipcRenderer.invoke('rates:getCashRates', planCode, sex, issueAge, risk),
    getNSPRate: (planCode: string, sex: string, issueAge: number, risk: string) => 
      ipcRenderer.invoke('rates:getNSPRate', planCode, sex, issueAge, risk),
    getFaceAmountLimits: (planCode: string) => 
      ipcRenderer.invoke('rates:getFaceAmountLimits', planCode),
    getTableNames: () => ipcRenderer.invoke('rates:getTableNames'),
    tableExists: (tableName: string) => ipcRenderer.invoke('rates:tableExists', tableName),
    getTableRecordCount: (tableName: string) => ipcRenderer.invoke('rates:getTableRecordCount', tableName),
    getDatabaseVersion: (accessToken?: string) => ipcRenderer.invoke('rates:getDatabaseVersion', accessToken),
    downloadDatabase: (accessToken?: string) => ipcRenderer.invoke('rates:downloadDatabase', accessToken),
    updateDatabase: (accessToken?: string) => ipcRenderer.invoke('rates:updateDatabase', accessToken),
  },
  pdf: {
    generateFromHTML: (htmlContent: string, options?: {
      margins?: {
        top?: number;
        bottom?: number;
        left?: number;
        right?: number;
      };
      pageSize?: 'A4' | 'Letter' | 'Legal' | 'Tabloid' | 'Ledger' | 'A3' | 'A5' | 'A6';
      landscape?: boolean;
      printBackground?: boolean;
    }) => ipcRenderer.invoke('pdf:generateFromHTML', htmlContent, options),
    saveFile: (pdfBuffer: Buffer, defaultFileName?: string) => ipcRenderer.invoke('pdf:saveFile', pdfBuffer, defaultFileName),
    saveFileToPath: (pdfBuffer: Buffer, filePath: string) => ipcRenderer.invoke('pdf:saveFileToPath', pdfBuffer, filePath),
    openFile: (filePath: string) => ipcRenderer.invoke('pdf:openFile', filePath),
    readFile: (filePath: string) => ipcRenderer.invoke('pdf:readFile', filePath),
    fileExists: (filePath: string) => ipcRenderer.invoke('pdf:fileExists', filePath),
  },
  app: {
    getUserDataPath: () => ipcRenderer.invoke('app:getUserDataPath'),
    getAppPath: () => ipcRenderer.invoke('app:getAppPath'),
    getPdfsPath: () => ipcRenderer.invoke('app:getPdfsPath'),
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
        saveIllustration: (illustration: any) => Promise<{ success: boolean; error?: string }>;
        getAllIllustrations: () => Promise<{ success: boolean; data: any[]; error?: string }>;
        updateIllustrationPdfPath: (id: string, pdfPath: string) => Promise<{ success: boolean; error?: string }>;
        deleteIllustration: (id: string) => Promise<{ success: boolean; error?: string }>;
        deleteIllustrationByQuoteId: (quoteId: string | number) => Promise<{ success: boolean; deleted?: boolean; error?: string }>;
        execute: (sql: string, params?: any[]) => Promise<{ success: boolean; insertId?: number; rowsAffected?: number; error?: string }>;
        query: (sql: string, params?: any[]) => Promise<{ success: boolean; rows?: any[]; error?: string }>;
        resetQuotesAndPDFs: () => Promise<{ success: boolean; deletedCounts?: { quotes: number; illustrations: number; pdfQueue: number; quickQuoteQueue: number }; deletedFilesCount?: number; error?: string }>;
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
        getPlanRate: (controlCode: string, age: number, gender: string, smokingStatus: string, paymentMethod?: string) => 
          Promise<{ success: boolean; data?: any[]; error?: string }>;
        getBasicRateByPlanCode: (planCode: string, age: number, gender: string, smokingStatus: string) => 
          Promise<{ success: boolean; data?: number | null; error?: string }>;
        getBasicRateByPlanCodeAndAge: (planCode: string, age: number) => 
          Promise<{ success: boolean; data?: number | null; error?: string }>;
        getBasicRateByControlCode: (controlCode: string) => 
          Promise<{ success: boolean; data?: number | null; error?: string }>;
        getServiceFee: (planCode: string, paymentMode: string, paymentMethod?: string) => 
          Promise<{ success: boolean; data?: number | null; error?: string }>;
        getModeFactor: (planCode: string, paymentMode: string, paymentMethod?: string) => 
          Promise<{ success: boolean; data?: number | null; error?: string }>;
        getPaidUpAdditionPremiumRates: (planCode: string, sex: string, risk: string, minIssueAge: number, maxIssueAge: number) => 
          Promise<{ success: boolean; data?: Array<{ IssueAge: number; Factor: number }>; error?: string }>;
        getPaidUpAdditionDividendRates: (planCode: string, sex: string, risk: string | null, minIssueAge: number, maxIssueAge: number) => 
          Promise<{ success: boolean; data?: Array<{ IssueAge: number; Factor: number }>; error?: string }>;
        getCashRates: (planCode: string, sex: string, issueAge: number, risk: string | null) => 
          Promise<{ success: boolean; data?: Array<{ Duration: number; Factor: number }>; error?: string }>;
        getNSPRate: (planCode: string, sex: string, issueAge: number, risk: string) => 
          Promise<{ success: boolean; data?: number | null; error?: string }>;
        getFaceAmountLimits: (planCode: string) => 
          Promise<{ success: boolean; data?: { minFace: number; maxFace: number; minUnit: number; maxUnit: number } | null; error?: string }>;
        getTableNames: () => Promise<{ success: boolean; data?: string[]; error?: string }>;
        tableExists: (tableName: string) => Promise<{ success: boolean; data?: boolean; error?: string }>;
        getTableRecordCount: (tableName: string) => Promise<{ success: boolean; data?: number; error?: string }>;
        getDatabaseVersion: (accessToken?: string) => Promise<{ success: boolean; data?: { rateDbVersion: string } | null; error?: string }>;
        downloadDatabase: (accessToken?: string) => Promise<{ success: boolean; data?: string | null; error?: string }>;
        updateDatabase: (accessToken?: string) => Promise<{ success: boolean; version?: string | null; message?: string; error?: string; restored?: boolean }>;
      };
  pdf: {
    generateFromHTML: (htmlContent: string, options?: {
      margins?: {
        top?: number;
        bottom?: number;
        left?: number;
        right?: number;
      };
      pageSize?: 'A4' | 'Letter' | 'Legal' | 'Tabloid' | 'Ledger' | 'A3' | 'A5' | 'A6';
      landscape?: boolean;
      printBackground?: boolean;
    }) => Promise<{ success: boolean; data?: Buffer; error?: string }>;
    saveFile: (pdfBuffer: Buffer, defaultFileName?: string) => Promise<{ success: boolean; filePath?: string; error?: string }>;
    saveFileToPath: (pdfBuffer: Buffer, filePath: string) => Promise<{ success: boolean; filePath?: string; error?: string }>;
    openFile: (filePath: string) => Promise<{ success: boolean; error?: string }>;
    readFile: (filePath: string) => Promise<{ success: boolean; data?: number[]; error?: string }>;
    fileExists: (filePath: string) => Promise<{ success: boolean; data?: boolean; error?: string }>;
  };
  app: {
    getUserDataPath: () => Promise<{ success: boolean; data?: string; error?: string }>;
    getAppPath: () => Promise<{ success: boolean; data?: string; error?: string }>;
    getPdfsPath: () => Promise<{ success: boolean; data?: string; error?: string }>;
  };
    };
  }
}

