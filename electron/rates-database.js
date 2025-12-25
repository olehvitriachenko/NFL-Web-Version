import Database from 'better-sqlite3';
import path from 'path';
import { app } from 'electron';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
/**
 * Класс для работы с rates.sqlite базой данных
 */
export class RatesDatabase {
    constructor(dbPath) {
        this.db = null;
        // В development используем файл из корня проекта
        // В production - из ресурсов приложения
        if (dbPath) {
            this.dbPath = dbPath;
        }
        else if (app.isPackaged) {
            // В production ищем в ресурсах приложения
            this.dbPath = path.join(process.resourcesPath, 'rates.sqlite');
        }
        else {
            // В development используем файл из корня проекта
            // app.getAppPath() возвращает путь к electron/, поэтому поднимаемся на уровень выше
            const appPath = app.getAppPath();
            // Если мы в electron/, поднимаемся на уровень выше к корню проекта
            if (appPath.endsWith('electron')) {
                this.dbPath = path.join(appPath, '..', 'rates.sqlite');
            }
            else {
                // Иначе используем process.cwd() как fallback
                this.dbPath = path.join(process.cwd(), 'rates.sqlite');
            }
        }
    }
    /**
     * Инициализация базы данных
     */
    init() {
        if (this.db) {
            return;
        }
        try {
            // Проверяем существование файла
            if (!fs.existsSync(this.dbPath)) {
                // В development пробуем альтернативные пути
                if (!app.isPackaged) {
                    const alternativePaths = [
                        path.join(process.cwd(), 'rates.sqlite'),
                        path.join(app.getAppPath(), '..', 'rates.sqlite'),
                        path.resolve(__dirname, '..', 'rates.sqlite'),
                    ];
                    for (const altPath of alternativePaths) {
                        const normalizedPath = path.normalize(altPath);
                        if (fs.existsSync(normalizedPath)) {
                            this.dbPath = normalizedPath;
                            console.log('Found rates.sqlite at alternative path:', normalizedPath);
                            break;
                        }
                    }
                }
                if (!fs.existsSync(this.dbPath)) {
                    throw new Error(`Rates database not found at: ${this.dbPath}`);
                }
            }
            this.db = new Database(this.dbPath, { readonly: true });
            this.db.pragma('journal_mode = WAL');
            console.log('Rates database initialized at:', this.dbPath);
        }
        catch (error) {
            console.error('Rates database initialization error:', error);
            throw error;
        }
    }
    /**
     * Получение экземпляра БД
     */
    getDb() {
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
    getPaymentModeColumn(mode) {
        return mode;
    }
    /**
     * Построение условия для возраста
     */
    buildAgeCondition(age) {
        if (age === undefined || age === 999) {
            return '(Age = 999 OR Age IS NULL)';
        }
        return `Age = ${age}`;
    }
    /**
     * Получение ставки для расчета премии
     */
    getRate(params) {
        const db = this.getDb();
        const modeColumn = this.getPaymentModeColumn(params.paymentMode);
        let query;
        let queryParams;
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
        }
        else if (params.controlCode === '9000') {
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
        }
        else {
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
        const result = stmt.get(...queryParams);
        return result || null;
    }
    /**
     * Получение ставки для Term продуктов с duration
     */
    getTermRate(params) {
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
    getAllTermRates(controlCode, age, gender, smokingStatus, paymentMode, paymentMethod) {
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
        return stmt.all(`${controlCode}_DUR_%`, age, gender, smokingStatus, paymentMethod, paymentMethod);
    }
    /**
     * Получение фактора иллюстрации
     */
    getIllustrationFactor(params) {
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
        const paramsArray = [
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
        const result = stmt.get(...paramsArray);
        return result?.Factor || 0;
    }
    /**
     * Получение всех факторов иллюстрации для всех durations
     */
    getAllIllustrationFactors(planCode, kind, sex, issueAge, risk) {
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
        const paramsArray = [kind, planCode, issueAge];
        if (sex) {
            paramsArray.push(sex);
        }
        if (risk) {
            paramsArray.push(risk);
        }
        return stmt.all(...paramsArray);
    }
    /**
     * Получение фактора рискового рейтинга
     */
    getRiskRatingFactor(params) {
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
        const result = stmt.get(params.age, params.gender, params.code, params.tableNumber);
        return result?.Factor || 0;
    }
    /**
     * Получение доступных возрастов для продукта
     */
    getAvailableAges(controlCode) {
        const db = this.getDb();
        const query = `
      SELECT DISTINCT Age
      FROM PlanRate
      WHERE ControlCode LIKE ?
        AND Age IS NOT NULL
      ORDER BY Age;
    `.trim();
        const stmt = db.prepare(query);
        const results = stmt.all(`${controlCode}%`);
        return results.map(r => r.Age);
    }
    /**
     * Проверка существования ставки
     */
    checkRateExists(params) {
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
        const result = stmt.get(params.controlCode, params.gender, params.smokingStatus);
        return (result?.count || 0) > 0;
    }
    /**
     * Получение ставок для диапазона возрастов
     */
    getRatesForAgeRange(controlCode, minAge, maxAge, gender, smokingStatus, paymentMode, paymentMethod) {
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
        return stmt.all(controlCode, minAge, maxAge, gender, smokingStatus, paymentMethod, paymentMethod);
    }
    /**
     * Получение расширенной информации о Plan Rate
     */
    getPlanRate(controlCode, age, gender, smokingStatus, paymentMethod = 'R') {
        const db = this.getDb();
        const query = `
      SELECT 
        PR.PlanCode,
        PR.ControlCode,
        PR.Description,
        PR.Age,
        PR.Gender,
        PR.Smoker,
        PR.BasicRate,
        PR.Unit,
        PR.FaceMin,
        PR.FaceMax,
        V.Monthly as ModeFactor,
        V.Annual as AnnualFactor,
        SF.Monthly as ServiceFee,
        SF.Annual as AnnualServiceFee
      FROM PlanRate PR
      LEFT JOIN Versions V ON V.PlanCode = PR.PlanCode
        AND (V.Method = ? OR V.Method IS NULL)
      LEFT JOIN ServiceFee SF ON SF.PlanCode = PR.PlanCode
        AND (SF.Method = ? OR SF.Method IS NULL)
      WHERE PR.ControlCode LIKE ?
        AND (PR.Age = ? OR PR.Age = 999 OR PR.Age IS NULL)
        AND PR.Gender = ?
        AND PR.Smoker = ?;
    `.trim();
        const stmt = db.prepare(query);
        return stmt.all(paymentMethod, paymentMethod, controlCode, age, gender, smokingStatus);
    }
    /**
     * Получение BasicRate по PlanCode, Age, Gender, Smoker
     */
    getBasicRateByPlanCode(planCode, age, gender, smokingStatus) {
        const db = this.getDb();
        const query = `
      SELECT BasicRate
      FROM PlanRate
      WHERE PlanCode = ?
        AND (Age = ? OR Age = 999 OR Age IS NULL)
        AND Gender = ?
        AND Smoker = ?
      LIMIT 1;
    `.trim();
        const stmt = db.prepare(query);
        const result = stmt.get(planCode, age, gender, smokingStatus);
        return result?.BasicRate || null;
    }
    /**
     * Получение BasicRate по PlanCode и Age
     */
    getBasicRateByPlanCodeAndAge(planCode, age) {
        const db = this.getDb();
        const query = `
      SELECT BasicRate
      FROM PlanRate
      WHERE PlanCode = ?
        AND (Age = ? OR Age = 999 OR Age IS NULL)
      ORDER BY 
        CASE 
          WHEN Age = ? THEN 0
          WHEN Age = 999 THEN 1
          ELSE 2
        END
      LIMIT 1;
    `.trim();
        const stmt = db.prepare(query);
        const result = stmt.get(planCode, age, age);
        return result?.BasicRate || null;
    }
    /**
     * Получение BasicRate по ControlCode префиксу
     */
    getBasicRateByControlCode(controlCode) {
        const db = this.getDb();
        const query = `
      SELECT BasicRate
      FROM PlanRate
      WHERE ControlCode LIKE ?
      LIMIT 1;
    `.trim();
        const stmt = db.prepare(query);
        const result = stmt.get(controlCode);
        return result?.BasicRate || null;
    }
    /**
     * Получение ServiceFee
     */
    getServiceFee(planCode, paymentMode, paymentMethod = 'R') {
        const db = this.getDb();
        const modeColumn = this.getPaymentModeColumn(paymentMode);
        const query = `
      SELECT ${modeColumn} AS ServiceFee
      FROM ServiceFee
      WHERE PlanCode = ?
        AND (Method = ? OR Method IS NULL OR Method = '')
      LIMIT 1;
    `.trim();
        const stmt = db.prepare(query);
        const result = stmt.get(planCode, paymentMethod);
        return result?.ServiceFee || null;
    }
    /**
     * Получение Mode Factor
     */
    getModeFactor(planCode, paymentMode, paymentMethod = 'R') {
        const db = this.getDb();
        const modeColumn = this.getPaymentModeColumn(paymentMode);
        const query = `
      SELECT ${modeColumn} AS factor
      FROM Versions
      WHERE PlanCode = ?
        AND (Method = ? OR Method IS NULL)
      LIMIT 1;
    `.trim();
        const stmt = db.prepare(query);
        const result = stmt.get(planCode, paymentMethod);
        return result?.factor || null;
    }
    /**
     * Получение Paid-Up Addition Premium Rates
     */
    getPaidUpAdditionPremiumRates(planCode, sex, risk, minIssueAge, maxIssueAge) {
        const db = this.getDb();
        const query = `
      SELECT IssueAge, Factor
      FROM IllustrationTable
      WHERE 
        PlanCode = ? AND
        Kind = 'pua_prem' AND
        Sex = ? AND
        Risk = ? AND
        IssueAge >= ? AND
        IssueAge <= ?
      ORDER BY IssueAge ASC;
    `.trim();
        const stmt = db.prepare(query);
        return stmt.all(planCode, sex, risk, minIssueAge, maxIssueAge);
    }
    /**
     * Получение Paid-Up Addition Dividend Rates
     */
    getPaidUpAdditionDividendRates(planCode, sex, risk, minIssueAge, maxIssueAge) {
        const db = this.getDb();
        const riskCondition = risk ? `Risk = ?` : 'Risk IS NULL';
        const params = [planCode, sex, minIssueAge, maxIssueAge];
        if (risk) {
            params.splice(2, 0, risk);
        }
        const query = `
      SELECT IssueAge, Factor
      FROM IllustrationTable
      WHERE
        PlanCode = ? AND
        Kind = 'pua_div' AND
        Sex = ? AND
        ${riskCondition} AND
        Duration = 0 AND
        IssueAge > ? AND
        IssueAge <= ?
      ORDER BY IssueAge ASC;
    `.trim();
        const stmt = db.prepare(query);
        return stmt.all(...params);
    }
    /**
     * Получение Cash Rates
     */
    getCashRates(planCode, sex, issueAge, risk) {
        const db = this.getDb();
        const riskCondition = risk ? `Risk = ?` : 'Risk IS NULL';
        const params = [planCode, sex, issueAge];
        if (risk) {
            params.push(risk);
        }
        const query = `
      SELECT Duration, Factor
      FROM IllustrationTable
      WHERE 
        PlanCode = ? AND
        Kind = 'cash' AND
        Sex = ? AND
        IssueAge = ? AND
        ${riskCondition}
      ORDER BY Duration ASC;
    `.trim();
        const stmt = db.prepare(query);
        return stmt.all(...params);
    }
    /**
     * Получение NSP Rate
     */
    getNSPRate(planCode, sex, issueAge, risk) {
        const db = this.getDb();
        const query = `
      SELECT Factor
      FROM IllustrationTable
      WHERE 
        PlanCode = ? AND
        Kind = 'nsp' AND
        Sex = ? AND
        IssueAge = ? AND
        Duration IS NULL AND
        Risk = ?
      LIMIT 1;
    `.trim();
        const stmt = db.prepare(query);
        const result = stmt.get(planCode, sex, issueAge, risk);
        return result?.Factor || null;
    }
    /**
     * Получение лимитов Face Amount (FaceMin/FaceMax)
     */
    getFaceAmountLimits(planCode) {
        const db = this.getDb();
        const query = `
      SELECT 
        MIN(COALESCE(NULLIF(FaceMin, 0), Unit)) AS minFace,
        MAX(COALESCE(NULLIF(FaceMax, 0), Unit)) AS maxFace,
        MIN(Unit) AS minUnit,
        MAX(Unit) AS maxUnit
      FROM PlanRate
      WHERE PlanCode = ?;
    `.trim();
        const stmt = db.prepare(query);
        const result = stmt.get(planCode);
        return result || null;
    }
    /**
     * Получение списка таблиц в БД
     */
    getTableNames() {
        const db = this.getDb();
        const query = `
      SELECT name FROM sqlite_master WHERE type="table" ORDER BY name;
    `.trim();
        const stmt = db.prepare(query);
        const results = stmt.all();
        return results.map(r => r.name);
    }
    /**
     * Проверка существования таблицы
     */
    tableExists(tableName) {
        const db = this.getDb();
        const query = `
      SELECT name FROM sqlite_master WHERE type="table" AND name=? LIMIT 1;
    `.trim();
        const stmt = db.prepare(query);
        const result = stmt.get(tableName);
        return !!result;
    }
    /**
     * Подсчет количества записей в таблице
     */
    getTableRecordCount(tableName) {
        const db = this.getDb();
        const query = `SELECT COUNT(*) as count FROM ${tableName};`;
        const stmt = db.prepare(query);
        const result = stmt.get();
        return result?.count || 0;
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
