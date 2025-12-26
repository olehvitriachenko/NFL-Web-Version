import Database from 'better-sqlite3';
import path from 'path';
import { app } from 'electron';
/**
 * Класс для работы с SQLite базой данных
 */
export class SQLiteDatabase {
    constructor(dbPath) {
        this.db = null;
        this.dbPath = dbPath || path.join(app.getPath('userData'), 'nfl-database.db');
    }
    /**
     * Инициализация базы данных
     */
    init() {
        if (this.db) {
            return;
        }
        try {
            this.db = new Database(this.dbPath);
            this.db.pragma('journal_mode = WAL');
            this.createTables();
            console.log('Database initialized at:', this.dbPath);
        }
        catch (error) {
            console.error('Database initialization error:', error);
            throw error;
        }
    }
    /**
     * Создание таблиц
     */
    createTables() {
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
      )
    `);
    }
    /**
     * Получение экземпляра БД
     */
    getDb() {
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
    createAgent(agent) {
        const db = this.getDb();
        const stmt = db.prepare(`
      INSERT INTO agents (firstName, lastName, street, city, state, zipCode, phone, email, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
        const result = stmt.run(agent.firstName, agent.lastName, agent.street || null, agent.city || null, agent.state || null, agent.zipCode || null, agent.phone || null, agent.email, new Date().toISOString());
        return Number(result.lastInsertRowid);
    }
    /**
     * Получение всех агентов
     */
    getAllAgents() {
        const db = this.getDb();
        const stmt = db.prepare('SELECT * FROM agents ORDER BY createdAt DESC');
        return stmt.all();
    }
    /**
     * Получение агента по ID
     */
    getAgentById(id) {
        const db = this.getDb();
        const stmt = db.prepare('SELECT * FROM agents WHERE id = ?');
        const agent = stmt.get(id);
        return agent || null;
    }
    /**
     * Обновление агента
     */
    updateAgent(id, agent) {
        const db = this.getDb();
        const stmt = db.prepare(`
      UPDATE agents 
      SET firstName = ?, lastName = ?, street = ?, city = ?, state = ?, zipCode = ?, phone = ?, email = ?
      WHERE id = ?
    `);
        const result = stmt.run(agent.firstName, agent.lastName, agent.street || null, agent.city || null, agent.state || null, agent.zipCode || null, agent.phone || null, agent.email, id);
        return result.changes > 0;
    }
    /**
     * Удаление агента
     */
    deleteAgent(id) {
        const db = this.getDb();
        const stmt = db.prepare('DELETE FROM agents WHERE id = ?');
        const result = stmt.run(id);
        return result.changes > 0;
    }
    /**
     * Выполнение произвольного SQL запроса (SELECT)
     */
    query(sql, params = []) {
        const db = this.getDb();
        const stmt = db.prepare(sql);
        return stmt.all(...params);
    }
    /**
     * Выполнение произвольного SQL запроса (INSERT/UPDATE/DELETE)
     */
    execute(sql, params = []) {
        const db = this.getDb();
        const stmt = db.prepare(sql);
        const result = stmt.run(...params);
        return Number(result.lastInsertRowid);
    }
    /**
     * Закрытие соединения с БД
     */
    close() {
        if (this.db) {
            this.db.close();
            this.db = null;
        }
    }
    /**
     * Проверка соединения с БД
     */
    isConnected() {
        return this.db !== null;
    }
}
