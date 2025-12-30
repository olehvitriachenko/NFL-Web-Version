/**
 * Database Adapter for Quotes
 * Abstracts differences between Electron (SQLite via IPC) and Browser (IndexedDB)
 */

const isElectron = typeof window !== 'undefined' && window.electron !== undefined;

export interface DatabaseExecuteResult {
  insertId: number;
  rowsAffected: number;
}

export interface DatabaseQueryResult {
  rows: any[];
}

export interface DatabaseAdapter {
  execute(sql: string, params?: any[]): Promise<DatabaseExecuteResult>;
  query(sql: string, params?: any[]): Promise<DatabaseQueryResult>;
}

// Electron adapter (via IPC)
class ElectronDatabaseAdapter implements DatabaseAdapter {
  async execute(sql: string, params: any[] = []): Promise<DatabaseExecuteResult> {
    if (!window.electron?.db) {
      throw new Error('Electron IPC not available');
    }

    const result = await window.electron.db.execute(sql, params);
    if (!result.success) {
      throw new Error(result.error || 'Database execute failed');
    }

    return {
      insertId: result.insertId || 0,
      rowsAffected: result.rowsAffected || 0
    };
  }

  async query(sql: string, params: any[] = []): Promise<DatabaseQueryResult> {
    if (!window.electron?.db) {
      throw new Error('Electron IPC not available');
    }

    const result = await window.electron.db.query(sql, params);
    if (!result.success) {
      throw new Error(result.error || 'Database query failed');
    }

    return {
      rows: result.rows || []
    };
  }
}

// Browser adapter (IndexedDB)
// Note: IndexedDB doesn't support SQL, so we'll need to implement a different approach
// For now, we'll throw an error and implement IndexedDB support later if needed
class BrowserDatabaseAdapter implements DatabaseAdapter {
  async execute(sql: string, params: any[] = []): Promise<DatabaseExecuteResult> {
    throw new Error('IndexedDB adapter not yet implemented. Quotes sync requires Electron.');
  }

  async query(sql: string, params: any[] = []): Promise<DatabaseQueryResult> {
    throw new Error('IndexedDB adapter not yet implemented. Quotes sync requires Electron.');
  }
}

export const databaseAdapter: DatabaseAdapter = isElectron
  ? new ElectronDatabaseAdapter()
  : new BrowserDatabaseAdapter();

