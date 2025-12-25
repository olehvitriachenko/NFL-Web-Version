import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electron', {
  db: {
    saveAgent: (agent: any) => ipcRenderer.invoke('db:saveAgent', agent),
    getAllAgents: () => ipcRenderer.invoke('db:getAllAgents'),
    deleteAgent: (id: number) => ipcRenderer.invoke('db:deleteAgent', id),
    updateAgent: (id: number, agent: any) => ipcRenderer.invoke('db:updateAgent', id, agent),
  },
});

// Type declaration for TypeScript
declare global {
  interface Window {
    electron: {
      db: {
        saveAgent: (agent: any) => Promise<{ success: boolean; id?: number; error?: string }>;
        getAllAgents: () => Promise<{ success: boolean; data: any[]; error?: string }>;
        deleteAgent: (id: number) => Promise<{ success: boolean; error?: string }>;
        updateAgent: (id: number, agent: any) => Promise<{ success: boolean; error?: string }>;
      };
    };
  }
}

