/**
 * Sync Service
 * Service for synchronizing queues with backend server
 */

import { pdfQueueService } from './pdfQueueService';
import { quickQuoteQueueService } from './quickQuoteQueueService';
import type { PdfQueueItem, QuickQuoteQueueItem } from './types';

const MAX_RETRIES = 3;
const INITIAL_BACKOFF_MS = 1000;
const BACKEND_ENABLED = true; // Set to false to disable backend sync

// TODO: Replace with actual backend API URL
const BACKEND_API_URL = import.meta.env.VITE_BACKEND_API_URL || 'https://api.example.com';

class SyncService {
  private isSyncingPdfs = false;
  private isSyncingQuickQuotes = false;

  /**
   * Check if online
   */
  private isOnline(): boolean {
    return typeof navigator !== 'undefined' && navigator.onLine;
  }

  /**
   * Sleep helper for exponential backoff
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Send PDF email via backend API
   */
  private async sendPdfEmail(item: PdfQueueItem): Promise<void> {
    if (!BACKEND_ENABLED) {
      throw new Error('Backend sync is disabled');
    }

    // TODO: Implement actual API call
    // Example:
    // const formData = new FormData();
    // if (item.pdf_path) {
    //   const file = await fetch(item.pdf_path).then(r => r.blob());
    //   formData.append('pdf', file);
    // }
    // formData.append('recipient_email', item.recipient_email);
    // formData.append('recipient_name', item.recipient_name || '');
    // 
    // const response = await fetch(`${BACKEND_API_URL}/api/send-pdf`, {
    //   method: 'POST',
    //   body: formData,
    // });
    // 
    // if (!response.ok) {
    //   throw new Error(`Failed to send PDF: ${response.statusText}`);
    // }

    // For now, simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    console.log('[SyncService] PDF email sent (simulated):', item.id);
  }

  /**
   * Send PDF with retry logic
   */
  private async sendPdfWithRetry(item: PdfQueueItem): Promise<boolean> {
    try {
      // Update status to sending
      await pdfQueueService.updateStatus(item.id, 'sending');

      let retryCount = item.retry_count;
      let success = false;

      while (retryCount < MAX_RETRIES && !success) {
        try {
          await this.sendPdfEmail(item);
          success = true;
        } catch (error) {
          retryCount++;
          await pdfQueueService.incrementRetryCount(item.id);

          if (retryCount < MAX_RETRIES) {
            // Exponential backoff
            const delay = INITIAL_BACKOFF_MS * Math.pow(2, retryCount - 1);
            console.log(`[SyncService] Retrying PDF ${item.id} in ${delay}ms (attempt ${retryCount + 1}/${MAX_RETRIES})`);
            await this.sleep(delay);
          } else {
            // Max retries reached
            const errorMessage = error instanceof Error ? error.message : String(error);
            await pdfQueueService.updateStatus(item.id, 'failed', errorMessage);
            console.error(`[SyncService] Failed to send PDF ${item.id} after ${MAX_RETRIES} attempts:`, errorMessage);
            return false;
          }
        }
      }

      if (success) {
        await pdfQueueService.updateStatus(item.id, 'sent');
        console.log(`[SyncService] PDF ${item.id} sent successfully`);
        return true;
      }

      return false;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      await pdfQueueService.updateStatus(item.id, 'failed', errorMessage);
      console.error(`[SyncService] Error sending PDF ${item.id}:`, errorMessage);
      return false;
    }
  }

  /**
   * Sync pending PDFs
   */
  async syncPendingPdfs(): Promise<void> {
    if (!this.isOnline()) {
      console.log('[SyncService] Offline, skipping PDF sync');
      return;
    }

    if (this.isSyncingPdfs) {
      console.log('[SyncService] PDF sync already in progress');
      return;
    }

    this.isSyncingPdfs = true;

    try {
      const pendingPdfs = await pdfQueueService.getPendingPdfs();
      console.log(`[SyncService] Syncing ${pendingPdfs.length} pending PDFs`);

      for (const pdf of pendingPdfs) {
        await this.sendPdfWithRetry(pdf);
      }

      console.log('[SyncService] PDF sync completed');
    } catch (error) {
      console.error('[SyncService] Error during PDF sync:', error);
    } finally {
      this.isSyncingPdfs = false;
    }
  }

  /**
   * Retry failed PDF
   */
  async retryFailedPdf(itemId: number): Promise<boolean> {
    const pdfs = await pdfQueueService.getFailedPdfs();
    const pdf = pdfs.find(p => p.id === itemId);

    if (!pdf) {
      throw new Error(`PDF with ID ${itemId} not found in failed queue`);
    }

    // Reset status to pending
    await pdfQueueService.updateStatus(itemId, 'pending');
    await pdfQueueService.updateStatus(itemId, 'pending', undefined); // Clear error message

    // Try to send again
    return await this.sendPdfWithRetry(pdf);
  }

  /**
   * Send Quick Quote via backend API
   */
  private async sendQuickQuote(item: QuickQuoteQueueItem): Promise<any> {
    if (!BACKEND_ENABLED) {
      throw new Error('Backend sync is disabled');
    }

    // TODO: Implement actual API call
    // Example:
    // const formData = new FormData();
    // if (item.pdf_path) {
    //   const file = await fetch(item.pdf_path).then(r => r.blob());
    //   formData.append('pdf', file);
    // }
    // formData.append('request_data', JSON.stringify(item.request_data));
    // 
    // const response = await fetch(`${BACKEND_API_URL}/api/quick-quotes`, {
    //   method: 'POST',
    //   body: formData,
    // });
    // 
    // if (!response.ok) {
    //   throw new Error(`Failed to send Quick Quote: ${response.statusText}`);
    // }
    // 
    // const data = await response.json();
    // return data;

    // For now, simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    const mockBackendId = Math.floor(Math.random() * 1000000);
    console.log('[SyncService] Quick Quote sent (simulated):', item.id, 'backend_id:', mockBackendId);
    return { id: mockBackendId };
  }

  /**
   * Send Quick Quote with retry logic
   */
  private async sendQuickQuoteWithRetry(item: QuickQuoteQueueItem): Promise<boolean> {
    try {
      // Update status to sending
      await quickQuoteQueueService.updateStatus(item.id, 'sending');

      let retryCount = item.retry_count;
      let success = false;
      let backendId: number | undefined;

      while (retryCount < MAX_RETRIES && !success) {
        try {
          const response = await this.sendQuickQuote(item);
          backendId = response.id;
          success = true;
        } catch (error) {
          retryCount++;
          await quickQuoteQueueService.incrementRetryCount(item.id);

          if (retryCount < MAX_RETRIES) {
            // Exponential backoff
            const delay = INITIAL_BACKOFF_MS * Math.pow(2, retryCount - 1);
            console.log(`[SyncService] Retrying Quick Quote ${item.id} in ${delay}ms (attempt ${retryCount + 1}/${MAX_RETRIES})`);
            await this.sleep(delay);
          } else {
            // Max retries reached
            const errorMessage = error instanceof Error ? error.message : String(error);
            await quickQuoteQueueService.updateStatus(item.id, 'failed', errorMessage);
            console.error(`[SyncService] Failed to send Quick Quote ${item.id} after ${MAX_RETRIES} attempts:`, errorMessage);
            return false;
          }
        }
      }

      if (success && backendId) {
        await quickQuoteQueueService.updateBackendId(item.id, backendId);
        await quickQuoteQueueService.updateStatus(item.id, 'sent');
        console.log(`[SyncService] Quick Quote ${item.id} sent successfully, backend_id: ${backendId}`);
        return true;
      }

      return false;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      await quickQuoteQueueService.updateStatus(item.id, 'failed', errorMessage);
      console.error(`[SyncService] Error sending Quick Quote ${item.id}:`, errorMessage);
      return false;
    }
  }

  /**
   * Sync pending Quick Quotes
   */
  async syncPendingQuickQuotes(): Promise<void> {
    if (!this.isOnline()) {
      console.log('[SyncService] Offline, skipping Quick Quote sync');
      return;
    }

    if (this.isSyncingQuickQuotes) {
      console.log('[SyncService] Quick Quote sync already in progress');
      return;
    }

    this.isSyncingQuickQuotes = true;

    try {
      const pendingQuotes = await quickQuoteQueueService.getPendingQuotes();
      console.log(`[SyncService] Syncing ${pendingQuotes.length} pending Quick Quotes`);

      for (const quote of pendingQuotes) {
        await this.sendQuickQuoteWithRetry(quote);
      }

      console.log('[SyncService] Quick Quote sync completed');
    } catch (error) {
      console.error('[SyncService] Error during Quick Quote sync:', error);
    } finally {
      this.isSyncingQuickQuotes = false;
    }
  }

  /**
   * Retry failed Quick Quote
   */
  async retryFailedQuickQuote(itemId: number): Promise<boolean> {
    const quotes = await quickQuoteQueueService.getFailedQuotes();
    const quote = quotes.find(q => q.id === itemId);

    if (!quote) {
      throw new Error(`Quick Quote with ID ${itemId} not found in failed queue`);
    }

    // Reset status to pending
    await quickQuoteQueueService.updateStatus(itemId, 'pending');
    await quickQuoteQueueService.updateStatus(itemId, 'pending', undefined); // Clear error message

    // Try to send again
    return await this.sendQuickQuoteWithRetry(quote);
  }

  /**
   * Sync deleted Quick Quotes
   */
  async syncDeletedQuickQuotes(): Promise<void> {
    if (!this.isOnline()) {
      console.log('[SyncService] Offline, skipping deleted Quick Quote sync');
      return;
    }

    try {
      const deletedQuotes = await quickQuoteQueueService.getAllQuotes();
      const toDelete = deletedQuotes.filter(q => q.status === 'deleted' && q.backend_id);

      console.log(`[SyncService] Syncing ${toDelete.length} deleted Quick Quotes`);

      for (const quote of toDelete) {
        try {
          // TODO: Implement actual DELETE API call
          // await fetch(`${BACKEND_API_URL}/api/quick-quotes/${quote.backend_id}`, {
          //   method: 'DELETE',
          // });

          // For now, simulate deletion
          await new Promise(resolve => setTimeout(resolve, 200));
          console.log(`[SyncService] Deleted Quick Quote ${quote.id} from backend (simulated)`);

          // Remove from local queue after successful deletion
          await quickQuoteQueueService.deleteItem(quote.id);
        } catch (error) {
          console.error(`[SyncService] Failed to delete Quick Quote ${quote.id} from backend:`, error);
        }
      }

      console.log('[SyncService] Deleted Quick Quote sync completed');
    } catch (error) {
      console.error('[SyncService] Error during deleted Quick Quote sync:', error);
    }
  }

  /**
   * Sync all queues
   */
  async syncAll(): Promise<void> {
    await Promise.all([
      this.syncPendingPdfs(),
      this.syncPendingQuickQuotes(),
      this.syncDeletedQuickQuotes(),
    ]);
  }

  /**
   * Check if syncing PDFs
   */
  isSyncingPdfsQueue(): boolean {
    return this.isSyncingPdfs;
  }

  /**
   * Check if syncing any queue
   */
  isSyncingAny(): boolean {
    return this.isSyncingPdfs || this.isSyncingQuickQuotes;
  }
}

export const syncService = new SyncService();

