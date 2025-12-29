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
      )
    `);
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
   */
  execute(sql: string, params: any[] = []): number {
    const db = this.getDb();
    const stmt = db.prepare(sql);
    const result = stmt.run(...params);
    return Number(result.lastInsertRowid);
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
    name: string;
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
    const stmt = db.prepare(`
      INSERT INTO illustrations (
        id, name, email, policyCode, date, deathBenefit, monthlyPayment,
        pdfPath, product, company, faceAmount, paymentMode,
        insuredAge, insuredSex, insuredSmokingHabit, agentId, quoteId, createdAt
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      illustration.id,
      illustration.name,
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
    return results.map(row => ({
      id: row.id,
      name: row.name,
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
    }));
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
}

