/**
 * Quote Service
 * Service for working with quotes in the database
 */

import { databaseAdapter } from './databaseAdapter';
import type { QuoteData, QuotePersonData } from '../../types/quotes';

class QuoteService {
  /**
   * Creates new quote
   */
  async createQuote(data: Partial<QuoteData>): Promise<number> {
    // Get current timestamp
    const now = Math.floor(Date.now() / 1000);

    const result = await databaseAdapter.execute(
      `INSERT INTO quotes (
        company, insured_age, insured_sex, insured_smokingHabit,
        payor_enabled, payor_age, payor_sex, payor_smokingHabit,
        product, producti, paymentMethod, paymentMode, configureProduct,
        basePlan, waiverOfPremium, accidentalDeath, dependentChild,
        guaranteedInsurability, premiumChoice,
        faceAmount, smokingHabit, premium, paymentMethod_details, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.company || '',
        data.insured?.age || 0,
        data.insured?.sex || '',
        data.insured?.smokingHabit || '',
        data.payorEnabled ? 1 : 0,
        data.payor?.age || null,
        data.payor?.sex || null,
        data.payor?.smokingHabit || null,
        data.product || null,
        null,
        data.paymentMethod || null,
        data.paymentMode || null,
        data.configureProduct || null,
        data.basePlan || null,
        data.waiverOfPremium ? 1 : 0,
        data.accidentalDeath ? 1 : 0,
        data.dependentChild ? 1 : 0,
        data.guaranteedInsurability ? 1 : 0,
        data.premiumChoice || null,
        data.faceAmount || null,
        data.smokingHabit || null,
        data.premium || null,
        data.paymentMethod_details || null,
        data.status || 'draft',
        now,
        now,
      ]
    );

    const id = result.insertId;
    console.log('[QuoteService] Quote created:', id);
    return id;
  }

  /**
   * Updates existing quote
   */
  async updateQuote(id: number, data: Partial<QuoteData>): Promise<boolean> {
    const updates: string[] = [];
    const values: any[] = [];

    if (data.company !== undefined) {
      updates.push('company = ?');
      values.push(data.company);
    }
    if (data.insured) {
      updates.push('insured_age = ?', 'insured_sex = ?', 'insured_smokingHabit = ?');
      values.push(data.insured.age, data.insured.sex, data.insured.smokingHabit);
    }
    if (data.payorEnabled !== undefined) {
      updates.push('payor_enabled = ?');
      values.push(data.payorEnabled ? 1 : 0);
    }
    if (data.payor) {
      updates.push('payor_age = ?', 'payor_sex = ?', 'payor_smokingHabit = ?');
      values.push(data.payor.age, data.payor.sex, data.payor.smokingHabit);
    }
    if (data.product !== undefined) { updates.push('product = ?'); values.push(data.product); }
    if (data.paymentMethod !== undefined) { updates.push('paymentMethod = ?'); values.push(data.paymentMethod); }
    if (data.paymentMode !== undefined) { updates.push('paymentMode = ?'); values.push(data.paymentMode); }
    if (data.configureProduct !== undefined) { updates.push('configureProduct = ?'); values.push(data.configureProduct); }
    if (data.basePlan !== undefined) { updates.push('basePlan = ?'); values.push(data.basePlan); }
    if (data.waiverOfPremium !== undefined) { updates.push('waiverOfPremium = ?'); values.push(data.waiverOfPremium ? 1 : 0); }
    if (data.accidentalDeath !== undefined) { updates.push('accidentalDeath = ?'); values.push(data.accidentalDeath ? 1 : 0); }
    if (data.dependentChild !== undefined) { updates.push('dependentChild = ?'); values.push(data.dependentChild ? 1 : 0); }
    if (data.guaranteedInsurability !== undefined) { updates.push('guaranteedInsurability = ?'); values.push(data.guaranteedInsurability ? 1 : 0); }
    if (data.premiumChoice !== undefined) { updates.push('premiumChoice = ?'); values.push(data.premiumChoice); }
    if (data.faceAmount !== undefined) { updates.push('faceAmount = ?'); values.push(data.faceAmount); }
    if (data.smokingHabit !== undefined) { updates.push('smokingHabit = ?'); values.push(data.smokingHabit); }
    if (data.premium !== undefined) { updates.push('premium = ?'); values.push(data.premium); }
    if (data.paymentMethod_details !== undefined) { updates.push('paymentMethod_details = ?'); values.push(data.paymentMethod_details); }
    if (data.status !== undefined) { updates.push('status = ?'); values.push(data.status); }

    if (updates.length === 0) {
      return false;
    }

    const now = Math.floor(Date.now() / 1000);
    updates.push('updated_at = ?');
    values.push(now, id);

    const sql = `UPDATE quotes SET ${updates.join(', ')} WHERE id = ?`;
    const result = await databaseAdapter.execute(sql, values);

    console.log('[QuoteService] Quote updated:', id);
    return result.rowsAffected > 0;
  }

  /**
   * Gets quote by ID
   */
  async getQuoteById(id: number): Promise<QuoteData | null> {
    const result = await databaseAdapter.query('SELECT * FROM quotes WHERE id = ?', [id]);

    if (result.rows && result.rows.length > 0) {
      return this.mapRowToQuote(result.rows[0]);
    }

    return null;
  }

  /**
   * Gets all quotes
   */
  async getAllQuotes(status?: 'draft' | 'completed' | 'sent'): Promise<QuoteData[]> {
    let sql = 'SELECT * FROM quotes';
    const params: any[] = [];

    if (status) {
      sql += ' WHERE status = ?';
      params.push(status);
    }

    sql += ' ORDER BY created_at DESC';

    const result = await databaseAdapter.query(sql, params);

    const quotes: QuoteData[] = [];
    if (result.rows) {
      for (const row of result.rows) {
        quotes.push(this.mapRowToQuote(row));
      }
    }

    return quotes;
  }

  /**
   * Gets latest quote
   */
  async getLatestQuote(): Promise<QuoteData | null> {
    const result = await databaseAdapter.query(
      'SELECT * FROM quotes ORDER BY created_at DESC LIMIT 1'
    );

    if (result.rows && result.rows.length > 0) {
      return this.mapRowToQuote(result.rows[0]);
    }

    return null;
  }

  /**
   * Deletes quote by ID
   */
  async deleteQuote(id: number): Promise<boolean> {
    const result = await databaseAdapter.execute('DELETE FROM quotes WHERE id = ?', [id]);
    return result.rowsAffected > 0;
  }

  /**
   * Maps database row to QuoteData object
   */
  private mapRowToQuote(row: any): QuoteData {
    const quote: QuoteData = {
      id: row.id,
      company: row.company as 'CompanyA' | 'CompanyB',
      insured: {
        age: row.insured_age,
        sex: row.insured_sex as 'Male' | 'Female',
        smokingHabit: row.insured_smokingHabit,
      },
      payorEnabled: row.payor_enabled === 1,
      status: (row.status || 'draft') as 'draft' | 'completed' | 'sent',
      created_at: row.created_at,
      updated_at: row.updated_at,
    };

    if (row.payor_age !== null) {
      quote.payor = {
        age: row.payor_age,
        sex: row.payor_sex as 'Male' | 'Female',
        smokingHabit: row.payor_smokingHabit,
      };
    }

    if (row.product) quote.product = row.product;
    if (row.paymentMethod) quote.paymentMethod = row.paymentMethod;
    if (row.paymentMode) quote.paymentMode = row.paymentMode;
    if (row.configureProduct) quote.configureProduct = row.configureProduct;
    if (row.basePlan !== null) quote.basePlan = row.basePlan;
    quote.waiverOfPremium = row.waiverOfPremium === 1;
    quote.accidentalDeath = row.accidentalDeath === 1;
    quote.dependentChild = row.dependentChild === 1;
    quote.guaranteedInsurability = row.guaranteedInsurability === 1;
    if (row.premiumChoice) quote.premiumChoice = row.premiumChoice;
    if (row.faceAmount !== null) quote.faceAmount = row.faceAmount;
    if (row.smokingHabit) quote.smokingHabit = row.smokingHabit;
    if (row.premium !== null) quote.premium = row.premium;
    if (row.paymentMethod_details) quote.paymentMethod_details = row.paymentMethod_details;

    return quote;
  }
}

export const quoteService = new QuoteService();
export default quoteService;

