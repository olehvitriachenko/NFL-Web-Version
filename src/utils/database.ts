import type { AgentInfo } from "../types/agent";

// Check if running in Electron
const isElectron =
  typeof window !== "undefined" && window.electron !== undefined;

// IndexedDB wrapper for browser
class IndexedDBStorage {
  private dbName = "nfl-db";
  private storeName = "agents";
  private illustrationsStoreName = "illustrations";
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          const objectStore = db.createObjectStore(this.storeName, {
            keyPath: "id",
            autoIncrement: true,
          });
          objectStore.createIndex("email", "email", { unique: false });
        }
        if (!db.objectStoreNames.contains(this.illustrationsStoreName)) {
          const illustrationsStore = db.createObjectStore(this.illustrationsStoreName, {
            keyPath: "id",
          });
          illustrationsStore.createIndex("email", "email", { unique: false });
          illustrationsStore.createIndex("date", "date", { unique: false });
        }
      };
    });
  }

  async saveAgent(agent: AgentInfo): Promise<number> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], "readwrite");
      const store = transaction.objectStore(this.storeName);
      const request = store.add({
        ...agent,
        createdAt: new Date().toISOString(),
      });

      request.onsuccess = () => resolve(request.result as number);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllAgents(): Promise<
    (AgentInfo & { id: number; createdAt: string })[]
  > {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], "readonly");
      const store = transaction.objectStore(this.storeName);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async deleteAgent(id: number): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], "readwrite");
      const store = transaction.objectStore(this.storeName);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async updateAgent(id: number, agent: AgentInfo): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], "readwrite");
      const store = transaction.objectStore(this.storeName);
      const request = store.put({
        ...agent,
        id,
        createdAt: new Date().toISOString(),
      });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async saveIllustration(illustration: any): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.illustrationsStoreName], "readwrite");
      const store = transaction.objectStore(this.illustrationsStoreName);
      const request = store.put({
        ...illustration,
        createdAt: new Date().toISOString(),
      });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getAllIllustrations(): Promise<any[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.illustrationsStoreName], "readonly");
      const store = transaction.objectStore(this.illustrationsStoreName);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async updateIllustrationPdfPath(id: string, pdfPath: string): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.illustrationsStoreName], "readwrite");
      const store = transaction.objectStore(this.illustrationsStoreName);
      const getRequest = store.get(id);

      getRequest.onsuccess = () => {
        const illustration = getRequest.result;
        if (!illustration) {
          reject(new Error('Illustration not found'));
          return;
        }

        illustration.pdfPath = pdfPath;
        const putRequest = store.put(illustration);
        putRequest.onsuccess = () => resolve();
        putRequest.onerror = () => reject(putRequest.error);
      };

      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  async deleteIllustration(id: string): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.illustrationsStoreName], "readwrite");
      const store = transaction.objectStore(this.illustrationsStoreName);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async deleteIllustrationByQuoteId(quoteId: string | number): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.illustrationsStoreName], "readwrite");
      const store = transaction.objectStore(this.illustrationsStoreName);
      const request = store.openCursor();

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor) {
          const illustration = cursor.value;
          if (illustration.quoteId === String(quoteId)) {
            cursor.delete();
          }
          cursor.continue();
        } else {
          resolve();
        }
      };

      request.onerror = () => reject(request.error);
    });
  }
}

// SQLite wrapper for Electron (via IPC)
class SQLiteStorage {
  async saveAgent(agent: AgentInfo): Promise<number> {
    if (!window.electron?.db) {
      throw new Error("Electron IPC not available");
    }

    const result = await window.electron.db.saveAgent(agent);
    if (!result.success) {
      throw new Error(result.error || "Failed to save agent");
    }
    return result.id as number;
  }

  async getAllAgents(): Promise<
    (AgentInfo & { id: number; createdAt: string })[]
  > {
    if (!window.electron?.db) {
      throw new Error("Electron IPC not available");
    }

    const result = await window.electron.db.getAllAgents();
    if (!result.success) {
      throw new Error(result.error || "Failed to get agents");
    }
    return result.data;
  }

  async deleteAgent(id: number): Promise<void> {
    if (!window.electron?.db) {
      throw new Error("Electron IPC not available");
    }

    const result = await window.electron.db.deleteAgent(id);
    if (!result.success) {
      throw new Error(result.error || "Failed to delete agent");
    }
  }

  async updateAgent(id: number, agent: AgentInfo): Promise<void> {
    if (!window.electron?.db) {
      throw new Error("Electron IPC not available");
    }

    const result = await window.electron.db.updateAgent(id, agent);
    if (!result.success) {
      throw new Error(result.error || "Failed to update agent");
    }
  }

  async getAgentById(id: number): Promise<(AgentInfo & { id: number; createdAt: string }) | null> {
    if (!window.electron?.db) {
      throw new Error('Electron IPC not available');
    }

    const result = await window.electron.db.getAgentById(id);
    if (!result.success) {
      if (result.error === 'Agent not found') {
        return null;
      }
      throw new Error(result.error || 'Failed to get agent');
    }
    return result.data || null;
  }

  async saveIllustration(illustration: any): Promise<void> {
    if (!window.electron?.db) {
      throw new Error("Electron IPC not available");
    }

    const result = await window.electron.db.saveIllustration(illustration);
    if (!result.success) {
      throw new Error(result.error || "Failed to save illustration");
    }
  }

  async getAllIllustrations(): Promise<any[]> {
    if (!window.electron?.db) {
      throw new Error("Electron IPC not available");
    }

    const result = await window.electron.db.getAllIllustrations();
    if (!result.success) {
      throw new Error(result.error || "Failed to get illustrations");
    }
    return result.data || [];
  }

  async updateIllustrationPdfPath(id: string, pdfPath: string): Promise<void> {
    if (!window.electron?.db) {
      throw new Error("Electron IPC not available");
    }

    const result = await window.electron.db.updateIllustrationPdfPath(id, pdfPath);
    if (!result.success) {
      throw new Error(result.error || "Failed to update illustration PDF path");
    }
  }

  async deleteIllustration(id: string): Promise<void> {
    if (!window.electron?.db) {
      throw new Error("Electron IPC not available");
    }

    const result = await window.electron.db.deleteIllustration(id);
    if (!result.success) {
      throw new Error(result.error || "Failed to delete illustration");
    }
  }

  async deleteIllustrationByQuoteId(quoteId: string | number): Promise<void> {
    if (!window.electron?.db) {
      throw new Error("Electron IPC not available");
    }

    const result = await window.electron.db.deleteIllustrationByQuoteId(quoteId);
    if (!result.success) {
      throw new Error(result.error || "Failed to delete illustration by quoteId");
    }
  }
}

// Database interface
class Database {
  private storage: IndexedDBStorage | SQLiteStorage;

  constructor() {
    this.storage = isElectron ? new SQLiteStorage() : new IndexedDBStorage();
  }

  async init(): Promise<void> {
    if (!isElectron) {
      await (this.storage as IndexedDBStorage).init();
    }
  }

  async saveAgent(agent: AgentInfo): Promise<number> {
    return this.storage.saveAgent(agent);
  }

  async getAllAgents(): Promise<
    (AgentInfo & { id: number; createdAt: string })[]
  > {
    return this.storage.getAllAgents();
  }

  async deleteAgent(id: number): Promise<void> {
    return this.storage.deleteAgent(id);
  }

  async updateAgent(id: number, agent: AgentInfo): Promise<void> {
    if (isElectron) {
      await (this.storage as SQLiteStorage).updateAgent(id, agent);
    } else {
      await (this.storage as IndexedDBStorage).updateAgent(id, agent);
    }
  }

  async getAgentById(id: number): Promise<(AgentInfo & { id: number; createdAt: string }) | null> {
    if (isElectron) {
      return await (this.storage as SQLiteStorage).getAgentById(id);
    } else {
      // Для IndexedDB ищем в массиве
      const agents = await this.getAllAgents();
      return agents.find(a => a.id === id) || null;
    }
  }

  async saveIllustration(illustration: any): Promise<void> {
    if (isElectron) {
      await (this.storage as SQLiteStorage).saveIllustration(illustration);
    } else {
      await (this.storage as IndexedDBStorage).saveIllustration(illustration);
    }
  }

  async getAllIllustrations(): Promise<any[]> {
    if (isElectron) {
      return await (this.storage as SQLiteStorage).getAllIllustrations();
    } else {
      return await (this.storage as IndexedDBStorage).getAllIllustrations();
    }
  }

  async updateIllustrationPdfPath(id: string, pdfPath: string): Promise<void> {
    if (isElectron) {
      await (this.storage as SQLiteStorage).updateIllustrationPdfPath(id, pdfPath);
    } else {
      await (this.storage as IndexedDBStorage).updateIllustrationPdfPath(id, pdfPath);
    }
  }

  async deleteIllustration(id: string): Promise<void> {
    if (isElectron) {
      await (this.storage as SQLiteStorage).deleteIllustration(id);
    } else {
      await (this.storage as IndexedDBStorage).deleteIllustration(id);
    }
  }

  async deleteIllustrationByQuoteId(quoteId: string | number): Promise<void> {
    if (isElectron) {
      await (this.storage as SQLiteStorage).deleteIllustrationByQuoteId(quoteId);
    } else {
      await (this.storage as IndexedDBStorage).deleteIllustrationByQuoteId(quoteId);
    }
  }
}

export const db = new Database();
