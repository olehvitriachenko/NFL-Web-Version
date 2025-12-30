/**
 * PDF Queue Service
 * Service for managing PDF queue
 */

import { databaseAdapter } from './databaseAdapter';
import type { PdfQueueItem, PdfQueueStatus } from '../../types/quotes';

export interface PdfGenerationOptions {
  quote: any;
  agent?: any;
  recipientEmail: string;
  insuredFirstName?: string;
  insuredLastName?: string;
  illustrationData?: any;
  returnToHomeToken?: string;
}

class PdfQueueService {
  /**
   * Adds PDF to queue with already generated PDF path
   * Use this when PDF is already generated to avoid double generation
   */
  async addToQueueWithPath(
    options: PdfGenerationOptions,
    pdfPath: string
  ): Promise<number> {
    if (!options.quote.id) {
      throw new Error('Quote ID is required');
    }

    const firstName = options.insuredFirstName || null;
    const lastName = options.insuredLastName || null;
    const recipientName =
      [firstName, lastName]
        .filter(Boolean)
        .join(' ') || null;
    const deathBenefit =
      options.quote.faceAmount ?? options.quote.basePlan ?? null;
    const monthlyPayment = options.quote.premium ?? null;

    // Get current timestamp
    const now = Math.floor(Date.now() / 1000);

    // Save to queue
    const result = await databaseAdapter.execute(
      `INSERT INTO pdf_queue (quote_id, agent_id, pdf_path, recipient_email, recipient_name, recipient_first_name, recipient_last_name, status, death_benefit, monthly_payment, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?)`,
      [
        options.quote.id,
        options.agent?.id || null,
        pdfPath,
        options.recipientEmail,
        recipientName,
        firstName,
        lastName,
        deathBenefit,
        monthlyPayment,
        now,
        now,
      ]
    );

    return result.insertId;
  }

  /**
   * Gets all pending PDFs
   */
  async getPendingPdfs(): Promise<PdfQueueItem[]> {
    const result = await databaseAdapter.query(
      'SELECT * FROM pdf_queue WHERE status = ? ORDER BY created_at ASC',
      ['pending']
    );

    const items: PdfQueueItem[] = [];
    if (result.rows) {
      for (const row of result.rows) {
        items.push(this.mapRowToItem(row));
      }
    }

    return items;
  }

  /**
   * Gets all failed PDFs
   */
  async getFailedPdfs(): Promise<PdfQueueItem[]> {
    const result = await databaseAdapter.query(
      'SELECT * FROM pdf_queue WHERE status = ? ORDER BY updated_at DESC',
      ['failed']
    );

    const items: PdfQueueItem[] = [];
    if (result.rows) {
      for (const row of result.rows) {
        items.push(this.mapRowToItem(row));
      }
    }

    return items;
  }

  /**
   * Returns all PDFs from queue ordered by newest first (excluding deleted)
   */
  async getAllPdfs(): Promise<PdfQueueItem[]> {
    const result = await databaseAdapter.query(
      "SELECT * FROM pdf_queue WHERE status != 'deleted' ORDER BY created_at DESC"
    );

    const items: PdfQueueItem[] = [];
    if (result.rows) {
      for (const row of result.rows) {
        items.push(this.mapRowToItem(row));
      }
    }

    return items;
  }

  /**
   * Gets all deleted PDFs that need to be synced
   */
  async getDeletedPdfs(): Promise<PdfQueueItem[]> {
    const result = await databaseAdapter.query(
      "SELECT * FROM pdf_queue WHERE status = 'deleted' ORDER BY updated_at ASC"
    );

    const items: PdfQueueItem[] = [];
    if (result.rows) {
      for (const row of result.rows) {
        items.push(this.mapRowToItem(row));
      }
    }

    return items;
  }

  /**
   * Updates PDF queue item status
   */
  async updateStatus(
    id: number,
    status: PdfQueueStatus,
    errorMessage?: string
  ): Promise<boolean> {
    const now = Math.floor(Date.now() / 1000);
    const result = await databaseAdapter.execute(
      `UPDATE pdf_queue 
       SET status = ?, error_message = ?, updated_at = ?
       WHERE id = ?`,
      [status, errorMessage || null, now, id]
    );

    return result.rowsAffected > 0;
  }

  /**
   * Increments retry count
   */
  async incrementRetryCount(id: number): Promise<boolean> {
    const now = Math.floor(Date.now() / 1000);
    const result = await databaseAdapter.execute(
      `UPDATE pdf_queue 
       SET retry_count = retry_count + 1, updated_at = ?
       WHERE id = ?`,
      [now, id]
    );

    return result.rowsAffected > 0;
  }

  /**
   * Gets PDF queue item by quote ID
   */
  async getByQuoteId(quoteId: number): Promise<PdfQueueItem | null> {
    const result = await databaseAdapter.query(
      'SELECT * FROM pdf_queue WHERE quote_id = ? ORDER BY created_at DESC LIMIT 1',
      [quoteId]
    );

    if (result.rows && result.rows.length > 0) {
      return this.mapRowToItem(result.rows[0]);
    }

    return null;
  }

  /**
   * Deletes PDF queue item by ID
   */
  async deleteItem(id: number): Promise<boolean> {
    const result = await databaseAdapter.execute('DELETE FROM pdf_queue WHERE id = ?', [id]);
    return result.rowsAffected > 0;
  }

  /**
   * Deletes all PDF queue items by quote ID
   */
  async deleteByQuoteId(quoteId: number): Promise<boolean> {
    const result = await databaseAdapter.execute('DELETE FROM pdf_queue WHERE quote_id = ?', [quoteId]);
    return result.rowsAffected > 0;
  }

  /**
   * Maps database row to PdfQueueItem object
   */
  private mapRowToItem(row: any): PdfQueueItem {
    return {
      id: row.id,
      quote_id: row.quote_id,
      agent_id: row.agent_id || undefined,
      pdf_path: row.pdf_path || undefined,
      recipient_email: row.recipient_email,
      recipient_name: row.recipient_name || undefined,
      recipient_first_name: row.recipient_first_name || undefined,
      recipient_last_name: row.recipient_last_name || undefined,
      status: row.status as PdfQueueStatus,
      retry_count: row.retry_count || 0,
      error_message: row.error_message || undefined,
      death_benefit: row.death_benefit || undefined,
      monthly_payment: row.monthly_payment || undefined,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }
}

export const pdfQueueService = new PdfQueueService();
export default pdfQueueService;

