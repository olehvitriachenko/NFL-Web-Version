import { contextBridge, ipcRenderer } from 'electron';
// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electron', {
    db: {
        saveAgent: (agent) => ipcRenderer.invoke('db:saveAgent', agent),
        getAllAgents: () => ipcRenderer.invoke('db:getAllAgents'),
        deleteAgent: (id) => ipcRenderer.invoke('db:deleteAgent', id),
        updateAgent: (id, agent) => ipcRenderer.invoke('db:updateAgent', id, agent),
    },
});
