import Database from 'better-sqlite3';
import path from 'path';
import { app } from 'electron';
import fs from 'fs';

export type PaymentMode = 'Annual' | 'SemiAnnual' | 'Quarterly' | 'Monthly' | 'EveryFourWeeks' | 'SemiMonthly' | 'BiWeekly' | 'Weekly';
export type PaymentMethod = 'R' | 'E' | 'A';
export type Gender = 'M' | 'F' | 'U';
export type SmokingStatus = 'Y' | 'N';
export type IllustrationType = 'div' | 'cash_value' | 'pua_prem' | 'loan' | 'surrender';

export interface RateQueryParams {
  controlCode: string;
  age?: number;
  gender: Gender;
  smokingStatus: SmokingStatus;
  paymentMode: PaymentMode;
  paymentMethod: PaymentMethod;
}

export interface RateQueryResult {
  PlanCode: string;
  ControlCode: string;
  BasicRate: number;
  Unit: string;
  ModeFactor: number;
  AnnualFactor: number;
  ServiceFee: number;
  AnnualServiceFee: number;
  Age?: number;
}

export interface IllustrationQueryParams {
  planCode: string;
  kind: IllustrationType;
  sex: Gender;
  issueAge: number;
  duration: number | null;
  risk?: SmokingStatus;
}

export interface RiskRatingQueryParams {
  code: string;
  age: number;
  gender: Gender;
  tableNumber: number;
}

/**
 * Класс для работы с rates.sqlite базой данных
 */
export class RatesDatabase {
  private db: Database.Database | null = null;
  private dbPath: string;

  constructor(dbPath?: string) {
    // В development используем файл из корня проекта
    // В production - из ресурсов приложения
    if (dbPath) {
      this.dbPath = dbPath;
    } else if (app.isPackaged) {
      // В production ищем в ресурсах приложения
      this.dbPath = path.join(process.resourcesPath, 'rates.sqlite');
    } else {
      // В development используем файл из корня проекта
      this.dbPath = path.join(app.getAppPath(), 'rates.sqlite');
    }
  }

  /**
   * Инициализация базы данных
   */
  init(): void {
    if (this.db) {
      return;
    }

    try {
      // Проверяем существование файла
      if (!fs.existsSync(this.dbPath)) {
        throw new Error(`Rates database not found at: ${this.dbPath}`);
      }

      this.db = new Database(this.dbPath, { readonly: true });
      this.db.pragma('journal_mode = WAL');
      console.log('Rates database initialized at:', this.dbPath);
    } catch (error) {
      console.error('Rates database initialization error:', error);
      throw error;
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
      throw new Error('Rates database not available');
    }
    return this.db;
  }

  /**
   * Получение названия колонки для режима оплаты
   */
  private getPaymentModeColumn(mode: PaymentMode): string {
    return mode;
  }

  /**
   * Построение условия для возраста
   */
  private buildAgeCondition(age?: number): string {
    if (age === undefined || age === 999) {
      return '(Age = 999 OR Age IS NULL)';
    }
    return `Age = ${age}`;
  }

  /**
   * Получение ставки для расчета премии
   */
  getRate(params: RateQueryParams): RateQueryResult | null {
    const db = this.getDb();
    const modeColumn = this.getPaymentModeColumn(params.paymentMode);
    
    let query: string;
    let queryParams: any[];

    // Специальные запросы для dep_child и 9000
    if (params.controlCode === 'dep_child') {
      query = `
        SELECT 
          PR.PlanCode,
          PR.ControlCode,
          PR.BasicRate,
          PR.Unit,
          V.${modeColumn} as ModeFactor,
          V.Annual as AnnualFactor,
          SF.${modeColumn} as ServiceFee,
          SF.Annual as AnnualServiceFee
        FROM PlanRate PR
        INNER JOIN Versions V ON V.PlanCode = PR.PlanCode
        INNER JOIN ServiceFee SF ON SF.PlanCode = PR.PlanCode
        WHERE PR.ControlCode LIKE ?
          AND (V.Method = ? OR V.Method IS NULL)
          AND (SF.Method = ? OR SF.Method IS NULL)
        LIMIT 1;
      `.trim();
      queryParams = [params.controlCode, params.paymentMethod, params.paymentMethod];
    } else if (params.controlCode === '9000') {
      const ageCondition = this.buildAgeCondition(params.age);
      query = `
        SELECT 
          PR.PlanCode,
          PR.ControlCode,
          PR.BasicRate,
          PR.Unit,
          V.${modeColumn} as ModeFactor,
          V.Annual as AnnualFactor,
          SF.${modeColumn} as ServiceFee,
          SF.Annual as AnnualServiceFee
          ${params.age !== undefined ? ', PR.Age' : ''}
        FROM PlanRate PR
        INNER JOIN Versions V ON V.PlanCode = PR.PlanCode
        INNER JOIN ServiceFee SF ON SF.PlanCode = PR.PlanCode
        WHERE PR.ControlCode LIKE ?
          AND (V.Method = ? OR V.Method IS NULL)
          AND (SF.Method = ? OR SF.Method IS NULL)
          AND ${ageCondition}
        LIMIT 1;
      `.trim();
      queryParams = [params.controlCode, params.paymentMethod, params.paymentMethod];
    } else {
      const ageCondition = this.buildAgeCondition(params.age);
      query = `
        SELECT 
          PR.PlanCode,
          PR.ControlCode,
          PR.BasicRate,
          PR.Unit,
          V.${modeColumn} as ModeFactor,
          V.Annual as AnnualFactor,
          SF.${modeColumn} as ServiceFee,
          SF.Annual as AnnualServiceFee
          ${params.age !== undefined ? ', PR.Age' : ''}
        FROM PlanRate PR
        INNER JOIN Versions V ON V.PlanCode = PR.PlanCode
        INNER JOIN ServiceFee SF ON SF.PlanCode = PR.PlanCode
        WHERE PR.ControlCode LIKE ?
          AND (V.Method = ? OR V.Method IS NULL)
          AND (SF.Method = ? OR SF.Method IS NULL)
          AND ${ageCondition}
          AND PR.Gender = ?
          AND PR.Smoker = ?
        LIMIT 1;
      `.trim();
      queryParams = [
        params.controlCode,
        params.paymentMethod,
        params.paymentMethod,
        params.gender,
        params.smokingStatus
      ];
    }

    const stmt = db.prepare(query);
    const result = stmt.get(...queryParams) as RateQueryResult | undefined;

    return result || null;
  }

  /**
   * Получение ставки для Term продуктов с duration
   */
  getTermRate(params: RateQueryParams & { duration: number }): RateQueryResult | null {
    const controlCodeWithDuration = params.controlCode === '9000' 
      ? params.controlCode 
      : `${params.controlCode}_DUR_${params.duration}`;
    
    return this.getRate({
      ...params,
      controlCode: controlCodeWithDuration
    });
  }

  /**
   * Получение всех ставок для всех durations (для term продуктов)
   */
  getAllTermRates(
    controlCode: string,
    age: number,
    gender: Gender,
    smokingStatus: SmokingStatus,
    paymentMode: PaymentMode,
    paymentMethod: PaymentMethod
  ): RateQueryResult[] {
    const db = this.getDb();
    const modeColumn = this.getPaymentModeColumn(paymentMode);
    
    const query = `
      SELECT 
        PR.PlanCode,
        PR.ControlCode,
        PR.Age,
        PR.BasicRate,
        PR.Unit,
        V.${modeColumn} as ModeFactor,
        SF.${modeColumn} as ServiceFee
      FROM PlanRate PR
      INNER JOIN Versions V ON V.PlanCode = PR.PlanCode
      INNER JOIN ServiceFee SF ON SF.PlanCode = PR.PlanCode
      WHERE PR.ControlCode LIKE ?
        AND PR.Age = ?
        AND PR.Gender = ?
        AND PR.Smoker = ?
        AND V.Method = ?
        AND SF.Method = ?
      ORDER BY PR.ControlCode;
    `.trim();

    const stmt = db.prepare(query);
    return stmt.all(
      `${controlCode}_DUR_%`,
      age,
      gender,
      smokingStatus,
      paymentMethod,
      paymentMethod
    ) as RateQueryResult[];
  }

  /**
   * Получение фактора иллюстрации
   */
  getIllustrationFactor(params: IllustrationQueryParams): number {
    const db = this.getDb();
    
    const sexCondition = params.sex ? `Sex = ?` : 'Sex IS NULL';
    const riskCondition = params.risk ? `Risk = ?` : 'Risk IS NULL';
    const durationCondition = params.duration === null || params.duration === undefined 
      ? 'Duration = 0' 
      : 'Duration = ?';

    let query = `
      SELECT Factor
      FROM IllustrationTable
      WHERE Kind = ?
        AND PlanCode = ?
        AND ${sexCondition}
        AND IssueAge = ?
        AND ${durationCondition}
        AND ${riskCondition}
      LIMIT 1;
    `.trim();

    const stmt = db.prepare(query);
    const paramsArray: any[] = [
      params.kind,
      params.planCode,
      params.issueAge
    ];

    if (params.sex) {
      paramsArray.push(params.sex);
    }

    if (params.duration !== null && params.duration !== undefined) {
      paramsArray.push(params.duration);
    }

    if (params.risk) {
      paramsArray.push(params.risk);
    }

    const result = stmt.get(...paramsArray) as { Factor: number } | undefined;
    return result?.Factor || 0;
  }

  /**
   * Получение всех факторов иллюстрации для всех durations
   */
  getAllIllustrationFactors(
    planCode: string,
    kind: IllustrationType,
    sex: Gender,
    issueAge: number,
    risk?: SmokingStatus
  ): Array<{ Duration: number; Factor: number }> {
    const db = this.getDb();
    
    const sexCondition = sex ? `Sex = ?` : 'Sex IS NULL';
    const riskCondition = risk ? `Risk = ?` : 'Risk IS NULL';

    const query = `
      SELECT Duration, Factor
      FROM IllustrationTable
      WHERE Kind = ?
        AND PlanCode = ?
        AND ${sexCondition}
        AND IssueAge = ?
        AND ${riskCondition}
      ORDER BY Duration;
    `.trim();

    const stmt = db.prepare(query);
    const paramsArray: any[] = [kind, planCode, issueAge];
    
    if (sex) {
      paramsArray.push(sex);
    }
    
    if (risk) {
      paramsArray.push(risk);
    }

    return stmt.all(...paramsArray) as Array<{ Duration: number; Factor: number }>;
  }

  /**
   * Получение фактора рискового рейтинга
   */
  getRiskRatingFactor(params: RiskRatingQueryParams): number {
    const db = this.getDb();
    
    const query = `
      SELECT Factor
      FROM RatedTable
      WHERE (Age = ? OR Age = 999)
        AND Gender IN (?, 'U')
        AND Code = ?
        AND TableNumber = ?
      LIMIT 1;
    `.trim();

    const stmt = db.prepare(query);
    const result = stmt.get(
      params.age,
      params.gender,
      params.code,
      params.tableNumber
    ) as { Factor: number } | undefined;

    return result?.Factor || 0;
  }

  /**
   * Получение доступных возрастов для продукта
   */
  getAvailableAges(controlCode: string): number[] {
    const db = this.getDb();
    
    const query = `
      SELECT DISTINCT Age
      FROM PlanRate
      WHERE ControlCode LIKE ?
        AND Age IS NOT NULL
      ORDER BY Age;
    `.trim();

    const stmt = db.prepare(query);
    const results = stmt.all(`${controlCode}%`) as Array<{ Age: number }>;
    
    return results.map(r => r.Age);
  }

  /**
   * Проверка существования ставки
   */
  checkRateExists(params: RateQueryParams): boolean {
    const db = this.getDb();
    const ageCondition = this.buildAgeCondition(params.age);
    
    const query = `
      SELECT COUNT(*) as count
      FROM PlanRate
      WHERE ControlCode LIKE ?
        AND ${ageCondition}
        AND Gender = ?
        AND Smoker = ?
      LIMIT 1;
    `.trim();

    const stmt = db.prepare(query);
    const result = stmt.get(
      params.controlCode,
      params.gender,
      params.smokingStatus
    ) as { count: number } | undefined;

    return (result?.count || 0) > 0;
  }

  /**
   * Получение ставок для диапазона возрастов
   */
  getRatesForAgeRange(
    controlCode: string,
    minAge: number,
    maxAge: number,
    gender: Gender,
    smokingStatus: SmokingStatus,
    paymentMode: PaymentMode,
    paymentMethod: PaymentMethod
  ): RateQueryResult[] {
    const db = this.getDb();
    const modeColumn = this.getPaymentModeColumn(paymentMode);

    const query = `
      SELECT 
        PR.Age,
        PR.BasicRate,
        PR.Unit,
        V.${modeColumn} as ModeFactor,
        SF.${modeColumn} as ServiceFee
      FROM PlanRate PR
      INNER JOIN Versions V ON V.PlanCode = PR.PlanCode
      INNER JOIN ServiceFee SF ON SF.PlanCode = PR.PlanCode
      WHERE PR.ControlCode LIKE ?
        AND PR.Age BETWEEN ? AND ?
        AND PR.Gender = ?
        AND PR.Smoker = ?
        AND V.Method = ?
        AND SF.Method = ?
      ORDER BY PR.Age;
    `.trim();

    const stmt = db.prepare(query);
    return stmt.all(
      controlCode,
      minAge,
      maxAge,
      gender,
      smokingStatus,
      paymentMethod,
      paymentMethod
    ) as RateQueryResult[];
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
}

