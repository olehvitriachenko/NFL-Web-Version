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
  };
}

declare global {
  interface Window {
    electron?: ElectronAPI;
  }
}

