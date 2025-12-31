/**
 * PDF Queue Service
 * Service for managing PDF queue in Electron
 */

import type { PdfQueueItem, PdfQueueStatus } from './types';
import type { PdfGenerationOptions } from '../pdf/pdfService';
import { pdfService } from '../pdf/pdfService';

const isElectron = typeof window !== 'undefined' && window.electron !== undefined;

class PdfQueueService {
  /**
   * Add PDF to queue with generation
   */
  async addToQueue(options: PdfGenerationOptions): Promise<number> {
    if (!isElectron) {
      throw new Error('PDF queue is only available in Electron environment');
    }

    // Generate PDF first
    const pdfPath = await pdfService.generatePdf(options);
    if (!pdfPath) {
      throw new Error('Failed to generate PDF');
    }

    // Add to queue with generated path
    return this.addToQueueWithPath(options, pdfPath);
  }

  /**
   * Add PDF to queue with existing path
   */
  async addToQueueWithPath(
    options: PdfGenerationOptions,
    pdfPath: string
  ): Promise<number> {
    if (!isElectron) {
      throw new Error('PDF queue is only available in Electron environment');
    }

    // Get agent ID from database if agent email is provided
    let agentId: number | undefined = undefined;
    if (options.agent?.email && window.electron?.db) {
      try {
        const agentsResult = await window.electron.db.getAllAgents();
        if (agentsResult.success && agentsResult.data) {
          const agent = agentsResult.data.find((a: any) => a.email === options.agent?.email);
          if (agent && agent.id) {
            agentId = Number(agent.id);
          }
        }
      } catch (error) {
        console.warn('Failed to get agent ID:', error);
      }
    }

    // Use database adapter to add to queue
    const { databaseAdapter } = await import('../quotes/databaseAdapter');
    const now = Math.floor(Date.now() / 1000);
    
    const result = await databaseAdapter.execute(
      `INSERT INTO pdf_queue (quote_id, agent_id, pdf_path, recipient_email, recipient_name, recipient_first_name, recipient_last_name, death_benefit, monthly_payment, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)`,
      [
        options.quote.id ? Number(options.quote.id) : null,
        agentId || null,
        pdfPath,
        options.recipientEmail || '',
        options.insuredFirstName && options.insuredLastName
          ? `${options.insuredFirstName} ${options.insuredLastName}`
          : null,
        options.insuredFirstName || null,
        options.insuredLastName || null,
        options.quote.faceAmount || null,
        options.quote.premium || null,
        now,
        now,
      ]
    );

    if (!result.insertId) {
      throw new Error('Failed to add PDF to queue');
    }

    return result.insertId;
  }

  /**
   * Get all PDFs from queue
   */
  async getAllPdfs(): Promise<PdfQueueItem[]> {
    if (!isElectron) {
      return [];
    }

    const { databaseAdapter } = await import('../quotes/databaseAdapter');
    const result = await databaseAdapter.query(
      'SELECT * FROM pdf_queue ORDER BY created_at DESC'
    );
    return (result.rows || []) as PdfQueueItem[];
  }

  /**
   * Get pending PDFs
   */
  async getPendingPdfs(): Promise<PdfQueueItem[]> {
    if (!isElectron) {
      return [];
    }

    const { databaseAdapter } = await import('../quotes/databaseAdapter');
    const result = await databaseAdapter.query(
      'SELECT * FROM pdf_queue WHERE status = ? ORDER BY created_at DESC',
      ['pending']
    );
    return result.rows || [];
  }

  /**
   * Get failed PDFs
   */
  async getFailedPdfs(): Promise<PdfQueueItem[]> {
    if (!isElectron) {
      return [];
    }

    const { databaseAdapter } = await import('../quotes/databaseAdapter');
    const result = await databaseAdapter.query(
      'SELECT * FROM pdf_queue WHERE status = ? ORDER BY created_at DESC',
      ['failed']
    );
    return result.rows || [];
  }

  /**
   * Get PDF by quote ID
   */
  async getByQuoteId(quoteId: number): Promise<PdfQueueItem | null> {
    if (!isElectron) {
      return null;
    }

    const { databaseAdapter } = await import('../quotes/databaseAdapter');
    const result = await databaseAdapter.query(
      'SELECT * FROM pdf_queue WHERE quote_id = ? LIMIT 1',
      [quoteId]
    );
    return result.rows && result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * Update PDF status
   */
  async updateStatus(
    id: number,
    status: PdfQueueStatus,
    errorMessage?: string
  ): Promise<boolean> {
    if (!isElectron) {
      throw new Error('PDF queue is only available in Electron environment');
    }

    const { databaseAdapter } = await import('../quotes/databaseAdapter');
    const now = Math.floor(Date.now() / 1000);
    await databaseAdapter.execute(
      'UPDATE pdf_queue SET status = ?, error_message = ?, updated_at = ? WHERE id = ?',
      [status, errorMessage || null, now, id]
    );
    return true;
  }

  /**
   * Increment retry count
   */
  async incrementRetryCount(id: number): Promise<boolean> {
    if (!isElectron) {
      throw new Error('PDF queue is only available in Electron environment');
    }

    const { databaseAdapter } = await import('../quotes/databaseAdapter');
    await databaseAdapter.execute(
      'UPDATE pdf_queue SET retry_count = retry_count + 1, updated_at = ? WHERE id = ?',
      [Math.floor(Date.now() / 1000), id]
    );
    return true;
  }

  /**
   * Delete PDF from queue
   */
  async deleteItem(id: number): Promise<boolean> {
    if (!isElectron) {
      throw new Error('PDF queue is only available in Electron environment');
    }

    const { databaseAdapter } = await import('../quotes/databaseAdapter');
    await databaseAdapter.execute('DELETE FROM pdf_queue WHERE id = ?', [id]);
    return true;
  }

  /**
   * Delete PDFs by quote ID
   */
  async deleteByQuoteId(quoteId: number): Promise<boolean> {
    if (!isElectron) {
      throw new Error('PDF queue is only available in Electron environment');
    }

    const { databaseAdapter } = await import('../quotes/databaseAdapter');
    await databaseAdapter.execute('DELETE FROM pdf_queue WHERE quote_id = ?', [quoteId]);
    return true;
  }

  /**
   * Get all quote IDs from queue
   */
  async getAllQuoteIds(): Promise<number[]> {
    const pdfs = await this.getAllPdfs();
    const quoteIds = pdfs
      .map(pdf => pdf.quote_id)
      .filter((id): id is number => id !== undefined && id !== null);
    return [...new Set(quoteIds)];
  }
}

export const pdfQueueService = new PdfQueueService();


