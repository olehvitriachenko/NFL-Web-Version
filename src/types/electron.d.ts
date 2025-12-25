export interface ElectronAPI {
  db: {
    saveAgent: (agent: any) => Promise<{ success: boolean; id?: number; error?: string }>;
    getAllAgents: () => Promise<{ success: boolean; data: any[]; error?: string }>;
    deleteAgent: (id: number) => Promise<{ success: boolean; error?: string }>;
    updateAgent: (id: number, agent: any) => Promise<{ success: boolean; error?: string }>;
  };
}

declare global {
  interface Window {
    electron?: ElectronAPI;
  }
}

