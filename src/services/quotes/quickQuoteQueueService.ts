/**
 * Quick Quote Queue Service
 * Service for managing quick quote queue
 */

import { databaseAdapter } from './databaseAdapter';
import type { QuickQuoteRequest, QuickQuoteQueueItem, QuickQuoteQueueStatus } from '../../types/quotes';

class QuickQuoteQueueService {
  /**
   * Adds quick quote request to queue
   */
  async addToQueue(
    request: QuickQuoteRequest,
    pdfPath: string,
    quoteId?: number
  ): Promise<number> {
    // Serialize request data to JSON
    const requestDataJson = JSON.stringify(request);

    // Get current timestamp
    const now = Math.floor(Date.now() / 1000);

    // Save to queue
    const result = await databaseAdapter.execute(
      `INSERT INTO quick_quote_queue (quote_id, request_data, pdf_path, status, created_at, updated_at)
       VALUES (?, ?, ?, 'pending', ?, ?)`,
      [quoteId || null, requestDataJson, pdfPath, now, now]
    );

    return result.insertId;
  }

  /**
   * Gets all pending quick quotes
   */
  async getPendingQuotes(): Promise<QuickQuoteQueueItem[]> {
    const result = await databaseAdapter.query(
      'SELECT * FROM quick_quote_queue WHERE status = ? ORDER BY created_at ASC',
      ['pending']
    );

    const items: QuickQuoteQueueItem[] = [];
    if (result.rows) {
      for (const row of result.rows) {
        items.push(this.mapRowToItem(row));
      }
    }

    return items;
  }

  /**
   * Gets all failed quick quotes
   */
  async getFailedQuotes(): Promise<QuickQuoteQueueItem[]> {
    const result = await databaseAdapter.query(
      'SELECT * FROM quick_quote_queue WHERE status = ? ORDER BY updated_at DESC',
      ['failed']
    );

    const items: QuickQuoteQueueItem[] = [];
    if (result.rows) {
      for (const row of result.rows) {
        items.push(this.mapRowToItem(row));
      }
    }

    return items;
  }

  /**
   * Returns all quick quotes from queue ordered by newest first (excluding deleted)
   */
  async getAllQuotes(): Promise<QuickQuoteQueueItem[]> {
    const result = await databaseAdapter.query(
      "SELECT * FROM quick_quote_queue WHERE status != 'deleted' ORDER BY created_at DESC"
    );

    const items: QuickQuoteQueueItem[] = [];
    if (result.rows) {
      for (const row of result.rows) {
        items.push(this.mapRowToItem(row));
      }
    }

    return items;
  }

  /**
   * Gets all deleted quick quotes that need to be synced
   */
  async getDeletedQuotes(): Promise<QuickQuoteQueueItem[]> {
    const result = await databaseAdapter.query(
      "SELECT * FROM quick_quote_queue WHERE status = 'deleted' ORDER BY updated_at ASC"
    );

    const items: QuickQuoteQueueItem[] = [];
    if (result.rows) {
      for (const row of result.rows) {
        items.push(this.mapRowToItem(row));
      }
    }

    return items;
  }

  /**
   * Returns all quick quotes that have backend_id (synced with backend)
   */
  async getQuotesWithBackendId(): Promise<QuickQuoteQueueItem[]> {
    const result = await databaseAdapter.query(
      'SELECT * FROM quick_quote_queue WHERE backend_id IS NOT NULL ORDER BY created_at DESC'
    );

    const items: QuickQuoteQueueItem[] = [];
    if (result.rows) {
      for (const row of result.rows) {
        items.push(this.mapRowToItem(row));
      }
    }

    return items;
  }

  /**
   * Returns all quick quotes that don't have backend_id (not synced with backend)
   */
  async getQuotesWithoutBackendId(): Promise<QuickQuoteQueueItem[]> {
    const result = await databaseAdapter.query(
      'SELECT * FROM quick_quote_queue WHERE backend_id IS NULL ORDER BY created_at DESC'
    );

    const items: QuickQuoteQueueItem[] = [];
    if (result.rows) {
      for (const row of result.rows) {
        items.push(this.mapRowToItem(row));
      }
    }

    return items;
  }

  /**
   * Updates quick quote queue item status
   */
  async updateStatus(
    id: number,
    status: QuickQuoteQueueStatus,
    errorMessage?: string
  ): Promise<boolean> {
    const now = Math.floor(Date.now() / 1000);
    const result = await databaseAdapter.execute(
      `UPDATE quick_quote_queue 
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
      `UPDATE quick_quote_queue 
       SET retry_count = retry_count + 1, updated_at = ?
       WHERE id = ?`,
      [now, id]
    );

    return result.rowsAffected > 0;
  }

  /**
   * Updates backend_id for quick quote queue item
   */
  async updateBackendId(id: number, backendId: number): Promise<boolean> {
    const now = Math.floor(Date.now() / 1000);
    const result = await databaseAdapter.execute(
      `UPDATE quick_quote_queue 
       SET backend_id = ?, updated_at = ?
       WHERE id = ?`,
      [backendId, now, id]
    );

    return result.rowsAffected > 0;
  }

  /**
   * Gets quick quote queue item by quote ID
   */
  async getByQuoteId(quoteId: number): Promise<QuickQuoteQueueItem | null> {
    const result = await databaseAdapter.query(
      'SELECT * FROM quick_quote_queue WHERE quote_id = ? ORDER BY created_at DESC LIMIT 1',
      [quoteId]
    );

    if (result.rows && result.rows.length > 0) {
      return this.mapRowToItem(result.rows[0]);
    }

    return null;
  }

  /**
   * Deletes quick quote queue item by ID
   */
  async deleteItem(id: number): Promise<boolean> {
    const result = await databaseAdapter.execute('DELETE FROM quick_quote_queue WHERE id = ?', [id]);
    return result.rowsAffected > 0;
  }

  /**
   * Deletes all quick quote queue items by quote ID
   */
  async deleteByQuoteId(quoteId: number): Promise<boolean> {
    const result = await databaseAdapter.execute('DELETE FROM quick_quote_queue WHERE quote_id = ?', [quoteId]);
    return result.rowsAffected > 0;
  }

  /**
   * Marks quick quote as deleted (soft delete)
   * Used when offline - will be synced with backend later
   */
  async markAsDeleted(queueItemId: number): Promise<boolean> {
    return await this.updateStatus(queueItemId, 'deleted');
  }

  /**
   * Gets quick quote queue item by queue ID
   */
  async getById(id: number): Promise<QuickQuoteQueueItem | null> {
    const result = await databaseAdapter.query(
      'SELECT * FROM quick_quote_queue WHERE id = ?',
      [id]
    );

    if (result.rows && result.rows.length > 0) {
      return this.mapRowToItem(result.rows[0]);
    }

    return null;
  }

  /**
   * Gets quick quote queue item by backend_id
   */
  async getByBackendId(backendId: number): Promise<QuickQuoteQueueItem | null> {
    const result = await databaseAdapter.query(
      'SELECT * FROM quick_quote_queue WHERE backend_id = ? ORDER BY created_at DESC LIMIT 1',
      [backendId]
    );

    if (result.rows && result.rows.length > 0) {
      return this.mapRowToItem(result.rows[0]);
    }

    return null;
  }

  /**
   * Maps database row to QuickQuoteQueueItem object
   */
  private mapRowToItem(row: any): QuickQuoteQueueItem {
    let requestData: QuickQuoteRequest;
    try {
      requestData = JSON.parse(row.request_data);
    } catch (error) {
      console.error('[QuickQuoteQueueService] Failed to parse request_data:', error);
      throw new Error('Invalid request_data format');
    }

    return {
      id: row.id,
      quote_id: row.quote_id || undefined,
      request_data: requestData,
      pdf_path: row.pdf_path,
      status: row.status as QuickQuoteQueueStatus,
      retry_count: row.retry_count || 0,
      error_message: row.error_message || undefined,
      backend_id: row.backend_id || undefined,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }
}

export const quickQuoteQueueService = new QuickQuoteQueueService();
export default quickQuoteQueueService;

