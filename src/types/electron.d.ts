export interface ElectronAPI {
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
  };
}

declare global {
  interface Window {
    electron?: ElectronAPI;
  }
}

