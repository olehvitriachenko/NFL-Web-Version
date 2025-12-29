/**
 * Quick Quote Queue Service
 * Service for managing Quick Quote queue in Electron
 */

import type { QuickQuoteQueueItem, QuickQuoteQueueStatus } from './types';

const isElectron = typeof window !== 'undefined' && window.electron !== undefined;

class QuickQuoteQueueService {
  /**
   * Add Quick Quote to queue
   */
  async addToQueue(
    requestData: any,
    pdfPath: string,
    quoteId?: number
  ): Promise<number> {
    if (!isElectron || !window.electron?.quickQuoteQueue) {
      throw new Error('Quick Quote queue is only available in Electron environment');
    }

    const result = await window.electron.quickQuoteQueue.add({
      quote_id: quoteId,
      request_data: requestData,
      pdf_path: pdfPath,
    });

    if (!result.success) {
      throw new Error(result.error || 'Failed to add Quick Quote to queue');
    }

    return result.id!;
  }

  /**
   * Get all Quick Quotes from queue
   */
  async getAllQuotes(): Promise<QuickQuoteQueueItem[]> {
    if (!isElectron || !window.electron?.quickQuoteQueue) {
      return [];
    }

    const result = await window.electron.quickQuoteQueue.getAll();
    if (!result.success) {
      throw new Error(result.error || 'Failed to get Quick Quotes from queue');
    }

    return result.data || [];
  }

  /**
   * Get pending Quick Quotes
   */
  async getPendingQuotes(): Promise<QuickQuoteQueueItem[]> {
    if (!isElectron || !window.electron?.quickQuoteQueue) {
      return [];
    }

    const result = await window.electron.quickQuoteQueue.getPending();
    if (!result.success) {
      throw new Error(result.error || 'Failed to get pending Quick Quotes');
    }

    return result.data || [];
  }

  /**
   * Get failed Quick Quotes
   */
  async getFailedQuotes(): Promise<QuickQuoteQueueItem[]> {
    if (!isElectron || !window.electron?.quickQuoteQueue) {
      return [];
    }

    const result = await window.electron.quickQuoteQueue.getFailed();
    if (!result.success) {
      throw new Error(result.error || 'Failed to get failed Quick Quotes');
    }

    return result.data || [];
  }

  /**
   * Get Quick Quotes with backend ID
   */
  async getQuotesWithBackendId(): Promise<QuickQuoteQueueItem[]> {
    if (!isElectron || !window.electron?.quickQuoteQueue) {
      return [];
    }

    const result = await window.electron.quickQuoteQueue.getWithBackendId();
    if (!result.success) {
      throw new Error(result.error || 'Failed to get Quick Quotes with backend ID');
    }

    return result.data || [];
  }

  /**
   * Get Quick Quotes without backend ID
   */
  async getQuotesWithoutBackendId(): Promise<QuickQuoteQueueItem[]> {
    if (!isElectron || !window.electron?.quickQuoteQueue) {
      return [];
    }

    const result = await window.electron.quickQuoteQueue.getWithoutBackendId();
    if (!result.success) {
      throw new Error(result.error || 'Failed to get Quick Quotes without backend ID');
    }

    return result.data || [];
  }

  /**
   * Get Quick Quote by quote ID
   */
  async getByQuoteId(quoteId: number): Promise<QuickQuoteQueueItem | null> {
    if (!isElectron || !window.electron?.quickQuoteQueue) {
      return null;
    }

    const result = await window.electron.quickQuoteQueue.getByQuoteId(quoteId);
    if (!result.success) {
      if (result.error === 'Quick Quote not found') {
        return null;
      }
      throw new Error(result.error || 'Failed to get Quick Quote by quote ID');
    }

    return result.data || null;
  }

  /**
   * Update Quick Quote status
   */
  async updateStatus(
    id: number,
    status: QuickQuoteQueueStatus,
    errorMessage?: string
  ): Promise<boolean> {
    if (!isElectron || !window.electron?.quickQuoteQueue) {
      throw new Error('Quick Quote queue is only available in Electron environment');
    }

    const result = await window.electron.quickQuoteQueue.updateStatus(id, status, errorMessage);
    if (!result.success) {
      throw new Error(result.error || 'Failed to update Quick Quote status');
    }

    return result.success;
  }

  /**
   * Increment retry count
   */
  async incrementRetryCount(id: number): Promise<boolean> {
    if (!isElectron || !window.electron?.quickQuoteQueue) {
      throw new Error('Quick Quote queue is only available in Electron environment');
    }

    const result = await window.electron.quickQuoteQueue.incrementRetryCount(id);
    if (!result.success) {
      throw new Error(result.error || 'Failed to increment retry count');
    }

    return result.success;
  }

  /**
   * Update backend ID
   */
  async updateBackendId(id: number, backendId: number): Promise<boolean> {
    if (!isElectron || !window.electron?.quickQuoteQueue) {
      throw new Error('Quick Quote queue is only available in Electron environment');
    }

    const result = await window.electron.quickQuoteQueue.updateBackendId(id, backendId);
    if (!result.success) {
      throw new Error(result.error || 'Failed to update backend ID');
    }

    return result.success;
  }

  /**
   * Delete Quick Quote from queue
   */
  async deleteItem(id: number): Promise<boolean> {
    if (!isElectron || !window.electron?.quickQuoteQueue) {
      throw new Error('Quick Quote queue is only available in Electron environment');
    }

    const result = await window.electron.quickQuoteQueue.delete(id);
    if (!result.success) {
      throw new Error(result.error || 'Failed to delete Quick Quote from queue');
    }

    return result.success;
  }

  /**
   * Delete Quick Quotes by quote ID
   */
  async deleteByQuoteId(quoteId: number): Promise<boolean> {
    if (!isElectron || !window.electron?.quickQuoteQueue) {
      throw new Error('Quick Quote queue is only available in Electron environment');
    }

    const result = await window.electron.quickQuoteQueue.deleteByQuoteId(quoteId);
    if (!result.success) {
      throw new Error(result.error || 'Failed to delete Quick Quotes by quote ID');
    }

    return result.success;
  }
}

export const quickQuoteQueueService = new QuickQuoteQueueService();

