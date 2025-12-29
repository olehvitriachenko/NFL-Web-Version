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
    if (!isElectron || !window.electron?.pdfQueue) {
      throw new Error('PDF queue is only available in Electron environment');
    }

    const result = await window.electron.pdfQueue.add({
      quote_id: options.quote.id ? Number(options.quote.id) : undefined,
      agent_id: options.agent?.id ? Number(options.agent.id) : undefined,
      pdf_path: pdfPath,
      recipient_email: options.recipientEmail || '',
      recipient_name: options.insuredFirstName && options.insuredLastName
        ? `${options.insuredFirstName} ${options.insuredLastName}`
        : undefined,
      recipient_first_name: options.insuredFirstName,
      recipient_last_name: options.insuredLastName,
      death_benefit: options.quote.faceAmount,
      monthly_payment: options.quote.premium,
    });

    if (!result.success) {
      throw new Error(result.error || 'Failed to add PDF to queue');
    }

    return result.id!;
  }

  /**
   * Get all PDFs from queue
   */
  async getAllPdfs(): Promise<PdfQueueItem[]> {
    if (!isElectron || !window.electron?.pdfQueue) {
      return [];
    }

    const result = await window.electron.pdfQueue.getAll();
    if (!result.success) {
      throw new Error(result.error || 'Failed to get PDFs from queue');
    }

    return result.data || [];
  }

  /**
   * Get pending PDFs
   */
  async getPendingPdfs(): Promise<PdfQueueItem[]> {
    if (!isElectron || !window.electron?.pdfQueue) {
      return [];
    }

    const result = await window.electron.pdfQueue.getPending();
    if (!result.success) {
      throw new Error(result.error || 'Failed to get pending PDFs');
    }

    return result.data || [];
  }

  /**
   * Get failed PDFs
   */
  async getFailedPdfs(): Promise<PdfQueueItem[]> {
    if (!isElectron || !window.electron?.pdfQueue) {
      return [];
    }

    const result = await window.electron.pdfQueue.getFailed();
    if (!result.success) {
      throw new Error(result.error || 'Failed to get failed PDFs');
    }

    return result.data || [];
  }

  /**
   * Get PDF by quote ID
   */
  async getByQuoteId(quoteId: number): Promise<PdfQueueItem | null> {
    if (!isElectron || !window.electron?.pdfQueue) {
      return null;
    }

    const result = await window.electron.pdfQueue.getByQuoteId(quoteId);
    if (!result.success) {
      if (result.error === 'PDF not found') {
        return null;
      }
      throw new Error(result.error || 'Failed to get PDF by quote ID');
    }

    return result.data || null;
  }

  /**
   * Update PDF status
   */
  async updateStatus(
    id: number,
    status: PdfQueueStatus,
    errorMessage?: string
  ): Promise<boolean> {
    if (!isElectron || !window.electron?.pdfQueue) {
      throw new Error('PDF queue is only available in Electron environment');
    }

    const result = await window.electron.pdfQueue.updateStatus(id, status, errorMessage);
    if (!result.success) {
      throw new Error(result.error || 'Failed to update PDF status');
    }

    return result.success;
  }

  /**
   * Increment retry count
   */
  async incrementRetryCount(id: number): Promise<boolean> {
    if (!isElectron || !window.electron?.pdfQueue) {
      throw new Error('PDF queue is only available in Electron environment');
    }

    const result = await window.electron.pdfQueue.incrementRetryCount(id);
    if (!result.success) {
      throw new Error(result.error || 'Failed to increment retry count');
    }

    return result.success;
  }

  /**
   * Delete PDF from queue
   */
  async deleteItem(id: number): Promise<boolean> {
    if (!isElectron || !window.electron?.pdfQueue) {
      throw new Error('PDF queue is only available in Electron environment');
    }

    const result = await window.electron.pdfQueue.delete(id);
    if (!result.success) {
      throw new Error(result.error || 'Failed to delete PDF from queue');
    }

    return result.success;
  }

  /**
   * Delete PDFs by quote ID
   */
  async deleteByQuoteId(quoteId: number): Promise<boolean> {
    if (!isElectron || !window.electron?.pdfQueue) {
      throw new Error('PDF queue is only available in Electron environment');
    }

    const result = await window.electron.pdfQueue.deleteByQuoteId(quoteId);
    if (!result.success) {
      throw new Error(result.error || 'Failed to delete PDFs by quote ID');
    }

    return result.success;
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

