import type { AgentInfo } from "../types/agent";

// Check if running in Electron
const isElectron =
  typeof window !== "undefined" && window.electron !== undefined;

// IndexedDB wrapper for browser
class IndexedDBStorage {
  private dbName = "nfl-db";
  private storeName = "agents";
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
}

export const db = new Database();
