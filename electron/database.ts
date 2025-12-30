import Database from 'better-sqlite3';
import path from 'path';
import { app } from 'electron';

export interface Agent {
  id?: number;
  firstName: string;
  lastName: string;
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  phone?: string;
  email: string;
  createdAt?: string;
}

/**
 * Класс для работы с SQLite базой данных
 */
export class SQLiteDatabase {
  private db: Database.Database | null = null;
  private dbPath: string;

  constructor(dbPath?: string) {
    this.dbPath = dbPath || path.join(app.getPath('userData'), 'nfl-database.db');
  }

  /**
   * Инициализация базы данных
   */
  init(): void {
    if (this.db) {
      return;
    }

    try {
      this.db = new Database(this.dbPath);
      this.db.pragma('journal_mode = WAL');
      this.createTables();
      console.log('Database initialized at:', this.dbPath);
    } catch (error) {
      console.error('Database initialization error:', error);
      throw error;
    }
  }

  /**
   * Создание таблиц
   */
  private createTables(): void {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS agents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        firstName TEXT NOT NULL,
        lastName TEXT NOT NULL,
        street TEXT,
        city TEXT,
        state TEXT,
        zipCode TEXT,
        phone TEXT,
        email TEXT NOT NULL,
        createdAt TEXT NOT NULL
      );
      
      CREATE TABLE IF NOT EXISTS illustrations (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        firstName TEXT,
        lastName TEXT,
        email TEXT NOT NULL,
        policyCode TEXT,
        date TEXT NOT NULL,
        deathBenefit REAL NOT NULL,
        monthlyPayment REAL NOT NULL,
        pdfPath TEXT,
        product TEXT,
        company TEXT,
        faceAmount REAL,
        paymentMode TEXT,
        insuredAge INTEGER,
        insuredSex TEXT,
        insuredSmokingHabit TEXT,
        agentId INTEGER,
        quoteId TEXT,
        createdAt TEXT NOT NULL
      );
      
      CREATE TABLE IF NOT EXISTS quotes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        company TEXT NOT NULL,
        insured_age INTEGER NOT NULL,
        insured_sex TEXT NOT NULL,
        insured_smokingHabit TEXT NOT NULL,
        payor_enabled INTEGER NOT NULL DEFAULT 0,
        payor_age INTEGER,
        payor_sex TEXT,
        payor_smokingHabit TEXT,
        product TEXT,
        producti TEXT,
        paymentMethod TEXT,
        paymentMode TEXT,
        configureProduct TEXT,
        basePlan REAL,
        waiverOfPremium INTEGER NOT NULL DEFAULT 0,
        accidentalDeath INTEGER NOT NULL DEFAULT 0,
        dependentChild INTEGER NOT NULL DEFAULT 0,
        guaranteedInsurability INTEGER NOT NULL DEFAULT 0,
        premiumChoice TEXT,
        faceAmount REAL,
        smokingHabit TEXT,
        premium REAL,
        paymentMethod_details TEXT,
        status TEXT NOT NULL DEFAULT 'draft',
        created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
        updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
      );
      
      CREATE TABLE IF NOT EXISTS quick_quote_queue (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        quote_id INTEGER,
        request_data TEXT NOT NULL,
        pdf_path TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        retry_count INTEGER NOT NULL DEFAULT 0,
        error_message TEXT,
        backend_id INTEGER,
        created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
        updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
        FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE CASCADE
      );
      
      CREATE INDEX IF NOT EXISTS idx_quick_quote_queue_status ON quick_quote_queue(status);
      CREATE INDEX IF NOT EXISTS idx_quick_quote_queue_backend_id ON quick_quote_queue(backend_id);
      
      CREATE TABLE IF NOT EXISTS pdf_queue (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        quote_id INTEGER NOT NULL,
        agent_id INTEGER,
        pdf_path TEXT,
        recipient_email TEXT NOT NULL,
        recipient_name TEXT,
        recipient_first_name TEXT,
        recipient_last_name TEXT,
        status TEXT NOT NULL DEFAULT 'pending',
        retry_count INTEGER NOT NULL DEFAULT 0,
        error_message TEXT,
        death_benefit REAL,
        monthly_payment REAL,
        created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
        updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
        FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE CASCADE,
        FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE SET NULL
      );
      
      CREATE INDEX IF NOT EXISTS idx_pdf_queue_status ON pdf_queue(status);
      CREATE INDEX IF NOT EXISTS idx_pdf_queue_quote_id ON pdf_queue(quote_id);
    `);
    
    // Migration: Add firstName and lastName columns if they don't exist
    try {
      const checkColumns = this.db.prepare(`
        PRAGMA table_info(illustrations)
      `);
      const columns = checkColumns.all() as Array<{ name: string; type: string }>;
      const columnNames = columns.map(col => col.name);
      
      if (!columnNames.includes('firstName')) {
        this.db.exec('ALTER TABLE illustrations ADD COLUMN firstName TEXT');
      }
      
      if (!columnNames.includes('lastName')) {
        this.db.exec('ALTER TABLE illustrations ADD COLUMN lastName TEXT');
      }
    } catch (error) {
      console.warn('Error during migration (columns may already exist):', error);
    }
  }

  /**
   * Получение экземпляра БД
   */
  private getDb(): Database.Database {
    if (!this.db) {
      this.init();
    }
    if (!this.db) {
      throw new Error('Database not available');
    }
    return this.db;
  }

  /**
   * Создание агента
   */
  createAgent(agent: Omit<Agent, 'id' | 'createdAt'>): number {
    const db = this.getDb();
    const stmt = db.prepare(`
      INSERT INTO agents (firstName, lastName, street, city, state, zipCode, phone, email, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      agent.firstName,
      agent.lastName,
      agent.street || null,
      agent.city || null,
      agent.state || null,
      agent.zipCode || null,
      agent.phone || null,
      agent.email,
      new Date().toISOString()
    );
    
    return Number(result.lastInsertRowid);
  }

  /**
   * Получение всех агентов
   */
  getAllAgents(): Agent[] {
    const db = this.getDb();
    const stmt = db.prepare('SELECT * FROM agents ORDER BY createdAt DESC');
    return stmt.all() as Agent[];
  }

  /**
   * Получение агента по ID
   */
  getAgentById(id: number): Agent | null {
    const db = this.getDb();
    const stmt = db.prepare('SELECT * FROM agents WHERE id = ?');
    const agent = stmt.get(id) as Agent | undefined;
    return agent || null;
  }

  /**
   * Обновление агента
   */
  updateAgent(id: number, agent: Omit<Agent, 'id' | 'createdAt'>): boolean {
    const db = this.getDb();
    const stmt = db.prepare(`
      UPDATE agents 
      SET firstName = ?, lastName = ?, street = ?, city = ?, state = ?, zipCode = ?, phone = ?, email = ?
      WHERE id = ?
    `);
    
    const result = stmt.run(
      agent.firstName,
      agent.lastName,
      agent.street || null,
      agent.city || null,
      agent.state || null,
      agent.zipCode || null,
      agent.phone || null,
      agent.email,
      id
    );
    
    return result.changes > 0;
  }

  /**
   * Удаление агента
   */
  deleteAgent(id: number): boolean {
    const db = this.getDb();
    const stmt = db.prepare('DELETE FROM agents WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  /**
   * Выполнение произвольного SQL запроса (SELECT)
   */
  query<T = any>(sql: string, params: any[] = []): T[] {
    const db = this.getDb();
    const stmt = db.prepare(sql);
    return stmt.all(...params) as T[];
  }

  /**
   * Выполнение произвольного SQL запроса (INSERT/UPDATE/DELETE)
   * Returns object with insertId and rowsAffected
   */
  execute(sql: string, params: any[] = []): { insertId: number; rowsAffected: number } {
    const db = this.getDb();
    const stmt = db.prepare(sql);
    const result = stmt.run(...params);
    return {
      insertId: Number(result.lastInsertRowid),
      rowsAffected: result.changes
    };
  }

  /**
   * Execute SQL query and return rows (for SELECT queries)
   */
  executeQuery(sql: string, params: any[] = []): { rows: any[] } {
    const db = this.getDb();
    const stmt = db.prepare(sql);
    const rows = stmt.all(...params);
    return { rows };
  }

  /**
   * Закрытие соединения с БД
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }

  /**
   * Проверка соединения с БД
   */
  isConnected(): boolean {
    return this.db !== null;
  }

  /**
   * Создание илюстрации
   */
  createIllustration(illustration: {
    id: string;
    name?: string;
    firstName?: string;
    lastName?: string;
    email: string;
    policyCode?: string;
    date: string;
    deathBenefit: number;
    monthlyPayment: number;
    pdfPath?: string | null;
    product?: string;
    company?: string;
    faceAmount?: number;
    paymentMode?: string;
    insuredAge?: number;
    insuredSex?: string;
    insuredSmokingHabit?: string;
    agentId?: number;
    quoteId?: string;
  }): void {
    const db = this.getDb();
    
    // Support both old format (name) and new format (firstName/lastName)
    const name = illustration.name || (illustration.firstName && illustration.lastName 
      ? `${illustration.firstName} ${illustration.lastName}`.trim() 
      : '');
    
    const stmt = db.prepare(`
      INSERT INTO illustrations (
        id, name, firstName, lastName, email, policyCode, date, deathBenefit, monthlyPayment,
        pdfPath, product, company, faceAmount, paymentMode,
        insuredAge, insuredSex, insuredSmokingHabit, agentId, quoteId, createdAt
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      illustration.id,
      name,
      illustration.firstName || null,
      illustration.lastName || null,
      illustration.email,
      illustration.policyCode || null,
      illustration.date,
      illustration.deathBenefit,
      illustration.monthlyPayment,
      illustration.pdfPath || null,
      illustration.product || null,
      illustration.company || null,
      illustration.faceAmount || null,
      illustration.paymentMode || null,
      illustration.insuredAge || null,
      illustration.insuredSex || null,
      illustration.insuredSmokingHabit || null,
      illustration.agentId || null,
      illustration.quoteId || null,
      new Date().toISOString()
    );
  }

  /**
   * Получение всех илюстраций
   */
  getAllIllustrations(): any[] {
    const db = this.getDb();
    const stmt = db.prepare('SELECT * FROM illustrations ORDER BY createdAt DESC');
    const results = stmt.all() as any[];
    
    // Transform database results to match Illustration interface
    return results.map(row => {
      // Support both old format (name) and new format (firstName/lastName)
      const name = row.firstName && row.lastName
        ? `${row.firstName} ${row.lastName}`.trim()
        : row.name || '';
      
      return {
        id: row.id,
        name: name,
        firstName: row.firstName || null,
        lastName: row.lastName || null,
        email: row.email,
        policyCode: row.policyCode,
        date: row.date,
        deathBenefit: row.deathBenefit,
        monthlyPayment: row.monthlyPayment,
        pdfPath: row.pdfPath,
        product: row.product,
        company: row.company,
        faceAmount: row.faceAmount,
        paymentMode: row.paymentMode,
        insured: {
          age: row.insuredAge,
          sex: row.insuredSex,
          smokingHabit: row.insuredSmokingHabit,
        },
        agentId: row.agentId,
      };
    });
  }

  /**
   * Обновление пути PDF для илюстрации
   */
  updateIllustrationPdfPath(id: string, pdfPath: string): boolean {
    const db = this.getDb();
    const stmt = db.prepare('UPDATE illustrations SET pdfPath = ? WHERE id = ?');
    const result = stmt.run(pdfPath, id);
    return result.changes > 0;
  }

  /**
   * Удаление иллюстрации
   */
  deleteIllustration(id: string): boolean {
    const db = this.getDb();
    const stmt = db.prepare('DELETE FROM illustrations WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  /**
   * Удаление иллюстрации по quoteId
   */
  deleteIllustrationByQuoteId(quoteId: string | number): boolean {
    const db = this.getDb();
    const stmt = db.prepare('DELETE FROM illustrations WHERE quoteId = ?');
    const result = stmt.run(String(quoteId));
    return result.changes > 0;
  }

  /**
   * Сброс базы данных: удаление всех котировок и PDF данных
   * Используется только в dev режиме
   */
  resetQuotesAndPDFs(): { success: boolean; deletedCounts: { quotes: number; illustrations: number; pdfQueue: number; quickQuoteQueue: number } } {
    const db = this.getDb();
    
    try {
      // Получаем количество записей перед удалением
      const quotesCount = db.prepare('SELECT COUNT(*) as count FROM quotes').get() as { count: number };
      const illustrationsCount = db.prepare('SELECT COUNT(*) as count FROM illustrations').get() as { count: number };
      const pdfQueueCount = db.prepare('SELECT COUNT(*) as count FROM pdf_queue').get() as { count: number };
      const quickQuoteQueueCount = db.prepare('SELECT COUNT(*) as count FROM quick_quote_queue').get() as { count: number };

      // Удаляем данные из таблиц
      const deleteQuotes = db.prepare('DELETE FROM quotes');
      const deleteIllustrations = db.prepare('DELETE FROM illustrations');
      const deletePdfQueue = db.prepare('DELETE FROM pdf_queue');
      const deleteQuickQuoteQueue = db.prepare('DELETE FROM quick_quote_queue');

      // Выполняем удаление в транзакции
      const transaction = db.transaction(() => {
        deleteQuotes.run();
        deleteIllustrations.run();
        deletePdfQueue.run();
        deleteQuickQuoteQueue.run();
      });

      transaction();

      return {
        success: true,
        deletedCounts: {
          quotes: quotesCount.count,
          illustrations: illustrationsCount.count,
          pdfQueue: pdfQueueCount.count,
          quickQuoteQueue: quickQuoteQueueCount.count,
        },
      };
    } catch (error) {
      console.error('Error resetting quotes and PDFs:', error);
      throw error;
    }
  }
}

