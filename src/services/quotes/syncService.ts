/**
 * Sync Service
 * Service for synchronizing quotes with backend
 */

import { pdfQueueService } from '../queues/pdfQueueService';
import { quickQuoteQueueService } from './quickQuoteQueueService';
import type { QuickQuoteQueueItem } from '../queues/types';
import { quoteService } from './quoteService';
import QuotesHttpService from './httpService';
import { getApiBaseUrl } from '../../config/api';
import { authStorage } from '../auth/authStorage';
import type { QuickQuote, QuoteData, QuickQuoteRequest } from '../../types/quotes';
import { calculatePremium, PaymentMode, PaymentMethod, ProductType } from '../premiumCalculating';
import { getProductShortCode } from '../../utils/productCode';
import { shortSex } from '../../utils/shortSex';
import { shortSmokingStatus } from '../../utils/shortSmokingStatus';
import { pdfService } from '../pdf';
import { db } from '../../utils/database';

const MAX_RETRIES = 3;
const INITIAL_BACKOFF_MS = 1000;
const BACKEND_ENABLED = true;

class SyncService {
  private isSyncing = false;
  private isSyncingQuickQuotes = false;
  private isSyncingFromBackend = false;

  /**
   * Calculates exponential backoff delay
   */
  private getBackoffDelay(retryCount: number): number {
    return INITIAL_BACKOFF_MS * Math.pow(2, retryCount);
  }

  /**
   * Sends quick quote via backend API with PDF included in the request
   * @returns QuickQuote response with backend ID
   */
  private async sendQuickQuote(item: QuickQuoteQueueItem): Promise<any> {
    if (!BACKEND_ENABLED) {
      throw new Error('Backend API not configured');
    }

    try {
      if (!item.pdf_path) {
        throw new Error('PDF path is required');
      }

      // Clean and normalize PDF path
      let cleanPath = item.pdf_path.replace(/^file:\/\//, '');
      if (!cleanPath.startsWith('/')) {
        cleanPath = `/${cleanPath}`;
      }

      // Get access token for authorization
      const accessToken = localStorage.getItem('@auth_access_token');
      if (!accessToken) {
        throw new Error('Access token not found');
      }

      const baseURL = getApiBaseUrl();
      const fileName = item.pdf_path.split('/').pop() || 'quote.pdf';

      // For web version, we need to read the file and create FormData
      // Check if we're in Electron
      const isElectron = typeof window !== 'undefined' && window.electron !== undefined;
      
      if (isElectron && window.electron?.pdf?.readFile) {
        console.log(`[SyncService] Reading PDF file from: ${cleanPath}`);
        
        // Read PDF file from Electron
        const fileResult = await window.electron.pdf.readFile(cleanPath);
        if (!fileResult.success || !fileResult.data) {
          console.error(`[SyncService] Failed to read PDF file:`, fileResult.error);
          throw new Error(`PDF file not found at path: ${cleanPath}`);
        }

        console.log(`[SyncService] PDF file read successfully, size: ${fileResult.data.length} bytes`);

        // Convert number array to Uint8Array and then to Blob
        const uint8Array = new Uint8Array(fileResult.data);
        const pdfBlob = new Blob([uint8Array], { type: 'application/pdf' });

        console.log(`[SyncService] PDF Blob created, size: ${pdfBlob.size} bytes`);

        // Create FormData
        const formData = new FormData();
        
        // Append all quick quote fields
        let fieldCount = 0;
        Object.keys(item.request_data).forEach((key) => {
          const value = (item.request_data as any)[key];
          if (value !== null && value !== undefined) {
            // Convert value to string (handle number, boolean, string)
            const stringValue = typeof value === 'number' 
              ? String(value) 
              : (typeof value === 'boolean' 
                ? String(value) 
                : String(value));
            formData.append(key, stringValue);
            fieldCount++;
          }
        });

        console.log(`[SyncService] Added ${fieldCount} form fields to FormData`);

        // Append PDF file
        formData.append('pdf', pdfBlob, fileName);
        console.log(`[SyncService] Added PDF file to FormData: ${fileName}`);

        // Create quick quote on server with PDF included
        console.log(`[SyncService] Sending request to backend...`);
        const response = await QuotesHttpService.createQuickQuote(formData);
        console.log(`[SyncService] Backend response received:`, response);
        console.log(`[SyncService] Backend response ID:`, response?.id);
        console.log(`[SyncService] Backend response type:`, typeof response);
        console.log(`[SyncService] Backend response keys:`, response ? Object.keys(response) : 'null');
        return response;
      } else {
        // For browser, we need to use File API or fetch the file
        // This is a simplified version - in production you might need to handle file reading differently
        throw new Error('PDF file reading is only available in Electron environment');
      }
    } catch (error: any) {
      const errorMessage = error?.response?.data?.detail || error?.message || 'Unknown error';
      console.error(`[SyncService] Error sending quick quote:`, error);
      throw new Error(errorMessage);
    }
  }

  /**
   * Sends single quick quote with retry logic
   */
  private async sendQuickQuoteWithRetry(item: QuickQuoteQueueItem): Promise<boolean> {
    if (!BACKEND_ENABLED) {
      return false;
    }

    // Проверяем Electron и онлайн статус
    const isElectron = this.isElectronEnvironment();
    if (!isElectron || !navigator.onLine) {
      return false;
    }

    let retryCount = item.retry_count;

    while (retryCount < MAX_RETRIES) {
      try {
        // Update status to sending
        await quickQuoteQueueService.updateStatus(item.id, 'sending');

        // Attempt to send
        const response = await this.sendQuickQuote(item);
        console.log(`[SyncService] Response from backend:`, response);
        console.log(`[SyncService] Response ID:`, response?.id);

        // Success - update status and save backend_id
        await quickQuoteQueueService.updateStatus(item.id, 'sent');
        if (response?.id) {
          console.log(`[SyncService] Saving backend_id ${response.id} for queue item ${item.id}`);
          await quickQuoteQueueService.updateBackendId(item.id, response.id);
          console.log(`[SyncService] Backend_id saved successfully`);
        } else {
          console.warn(`[SyncService] Response does not contain id field:`, response);
        }
        
        // Update PDF queue status to 'sent' if quote_id exists
        if (item.quote_id) {
          try {
            const pdfQueueItem = await pdfQueueService.getByQuoteId(item.quote_id);
            if (pdfQueueItem && pdfQueueItem.status === 'pending') {
              await pdfQueueService.updateStatus(pdfQueueItem.id, 'sent');
              console.log(`[SyncService] Updated PDF queue status to 'sent' for quote ${item.quote_id}`);
            }
          } catch (error) {
            console.warn(`[SyncService] Failed to update PDF queue status for quote ${item.quote_id}:`, error);
          }
        }
        
        return true;
      } catch (error: any) {
        retryCount++;
        const errorMessage = error.message || 'Unknown error';

        if (retryCount >= MAX_RETRIES) {
          // Max retries reached - mark as failed
          await quickQuoteQueueService.updateStatus(item.id, 'failed', errorMessage);
          await quickQuoteQueueService.incrementRetryCount(item.id);
          
          // Notify user (in web version, we can use console or show a toast)
          console.error(
            `[SyncService] Quick Quote Send Failed: Failed to send quick quote after ${MAX_RETRIES} attempts. You can retry manually.`
          );
          return false;
        } else {
          // Increment retry count and wait before retry
          await quickQuoteQueueService.incrementRetryCount(item.id);
          const delay = this.getBackoffDelay(retryCount - 1);
          
          console.log(
            `[SyncService] Retry ${retryCount}/${MAX_RETRIES} for Quick Quote ${item.id} after ${delay}ms`
          );
          
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    return false;
  }

  /**
   * Syncs all pending quick quotes
   */
  async syncPendingQuickQuotes(): Promise<void> {
    if (!BACKEND_ENABLED) {
      return;
    }

    // В браузере не синхронизируем - только в Electron
    const isElectron = this.isElectronEnvironment();
    if (!isElectron) {
      return;
    }

    // Если офлайн - не делаем запросы
    if (!navigator.onLine) {
      return;
    }

    if (this.isSyncingQuickQuotes) {
      return;
    }

    this.isSyncingQuickQuotes = true;

    try {
      const pendingQuotes = await quickQuoteQueueService.getPendingQuotes();
      
      if (pendingQuotes.length === 0) {
        return;
      }

      console.log(`[SyncService] Syncing ${pendingQuotes.length} pending quick quote(s)`);

      // Process quotes sequentially to avoid overwhelming the API
      for (const item of pendingQuotes) {
        await this.sendQuickQuoteWithRetry(item);
      }
    } catch (error) {
      console.error('[SyncService] Error during quick quote sync:', error);
    } finally {
      this.isSyncingQuickQuotes = false;
    }
  }

  /**
   * Manually retry failed quick quote
   */
  async retryFailedQuickQuote(itemId: number): Promise<boolean> {
    if (!BACKEND_ENABLED) {
      console.log('[SyncService] Backend disabled - retry skipped');
      return false;
    }

    const failedQuotes = await quickQuoteQueueService.getFailedQuotes();
    const item = failedQuotes.find(q => q.id === itemId);

    if (!item) {
      console.error(`[SyncService] Quick Quote ${itemId} not found in failed queue`);
      return false;
    }

    // Reset status to pending
    await quickQuoteQueueService.updateStatus(item.id, 'pending');
    
    // Retry sending
    return await this.sendQuickQuoteWithRetry(item);
  }

  /**
   * Syncs deleted quick quotes (sends delete requests to backend)
   */
  async syncDeletedQuickQuotes(): Promise<void> {
    if (!BACKEND_ENABLED) {
      return;
    }

    // В браузере не синхронизируем - только в Electron
    const isElectron = this.isElectronEnvironment();
    if (!isElectron) {
      return;
    }

    // Если офлайн - не делаем запросы
    if (!navigator.onLine) {
      return;
    }

    try {
      const deletedQuotes = await quickQuoteQueueService.getDeletedQuotes();
      
      if (deletedQuotes.length === 0) {
        return;
      }

      console.log(`[SyncService] Syncing ${deletedQuotes.length} deleted quote(s)`);

      // Process deletions sequentially
      for (const item of deletedQuotes) {
        if (!item.backend_id) {
          // No backend_id means it was never synced, just remove from local DB
          await quickQuoteQueueService.deleteItem(item.id);
          if (item.quote_id) {
            await pdfQueueService.deleteByQuoteId(item.quote_id);
            await quoteService.deleteQuote(item.quote_id);
            // Delete illustration from illustration history
            try {
              await db.deleteIllustrationByQuoteId(item.quote_id);
              console.log(`[SyncService] Deleted illustration for quote ${item.quote_id}`);
            } catch (error) {
              console.warn(`[SyncService] Failed to delete illustration for quote ${item.quote_id}:`, error);
            }
          }
          continue;
        }

        try {
          // Send delete request to backend
          await QuotesHttpService.deleteQuickQuote(item.backend_id);
          
          // Successfully deleted from backend, remove from local DB
          await quickQuoteQueueService.deleteItem(item.id);
          if (item.quote_id) {
            await pdfQueueService.deleteByQuoteId(item.quote_id);
            await quoteService.deleteQuote(item.quote_id);
            // Delete illustration from illustration history
            try {
              await db.deleteIllustrationByQuoteId(item.quote_id);
              console.log(`[SyncService] Deleted illustration for quote ${item.quote_id}`);
            } catch (error) {
              console.warn(`[SyncService] Failed to delete illustration for quote ${item.quote_id}:`, error);
            }
          }
          
          console.log(`[SyncService] Successfully deleted quote ${item.backend_id} from backend`);
        } catch (error: any) {
          console.error(
            `[SyncService] Failed to delete quote ${item.backend_id} from backend:`,
            error
          );
          // Keep item marked as deleted for retry later
        }
      }
    } catch (error) {
      console.error('[SyncService] Error during deleted quotes sync:', error);
    }
  }

  /**
   * Deletes a quick quote (marks as deleted if offline, deletes immediately if online)
   */
  async deleteQuickQuote(queueItemId: number): Promise<boolean> {
    try {
      const item = await quickQuoteQueueService.getById(queueItemId);
      if (!item) {
        console.error(`[SyncService] Quote queue item ${queueItemId} not found`);
        return false;
      }

      // Check if online
      const isOnline = navigator.onLine;

      if (!isOnline) {
        // Offline: mark as deleted, will sync later
        console.log(`[SyncService] Offline - marking quote ${queueItemId} as deleted`);
        await quickQuoteQueueService.markAsDeleted(queueItemId);
        return true;
      }

      // Online: try to delete from backend immediately
      if (item.backend_id) {
        try {
          console.log(`[SyncService] Deleting quote ${item.backend_id} from backend...`);
          // Delete from backend
          await QuotesHttpService.deleteQuickQuote(item.backend_id);
          console.log(`[SyncService] Successfully deleted quote ${item.backend_id} from backend`);
        } catch (error: any) {
          // If backend delete fails, mark as deleted for retry
          console.error(`[SyncService] Failed to delete quote ${item.backend_id} from backend:`, error);
          console.error(`[SyncService] Error details:`, {
            message: error?.message,
            status: error?.response?.status,
            data: error?.response?.data,
          });
          await quickQuoteQueueService.markAsDeleted(queueItemId);
          return false;
        }
      } else {
        console.log(`[SyncService] Quote ${queueItemId} has no backend_id, will be deleted locally only`);
      }

      // Delete from local DB (both online and offline after marking)
      await quickQuoteQueueService.deleteItem(queueItemId);
      if (item.quote_id) {
        await pdfQueueService.deleteByQuoteId(item.quote_id);
        await quoteService.deleteQuote(item.quote_id);
        // Delete illustration from illustration history
        try {
          await db.deleteIllustrationByQuoteId(item.quote_id);
          console.log(`[SyncService] Deleted illustration for quote ${item.quote_id}`);
        } catch (error) {
          console.warn(`[SyncService] Failed to delete illustration for quote ${item.quote_id}:`, error);
        }
      }

      console.log(`[SyncService] Quote ${queueItemId} deleted successfully`);
      return true;
    } catch (error) {
      console.error(`[SyncService] Error deleting quote ${queueItemId}:`, error);
      return false;
    }
  }

  /**
   * Converts QuickQuote from backend to QuoteData format
   */
  private async convertQuickQuoteToQuoteData(quickQuote: QuickQuote): Promise<QuoteData> {
    // 1. Map gender -> sex
    const sex = quickQuote.gender?.toLowerCase() === 'female' ? 'Female' : 'Male';

    // 2. Map smoker -> smokingHabit
    const smokingHabit = quickQuote.smoker ? 'Smoker' : 'Non-smoker';

    // 3. Determine company
    const company = quickQuote.insuranceCompanyId === 1 ? 'CompanyA' : 'CompanyB';

    // 4. Parse decimal strings to numbers
    const basePlanAmount = quickQuote.basePlanAmount 
      ? parseFloat(quickQuote.basePlanAmount) 
      : undefined;

    // 5. Get payment mode
    const paymentMode = quickQuote.paymentMode || 'Monthly';

    // 6. Get product name
    const productName = quickQuote.product || '';

    // 7. Calculate premium
    let calculatedPremium: number | undefined;
    if (productName === 'Flexible Premium Annuity' || productName.includes('Annuity')) {
      // For Flexible Premium Annuity, premium = coverage amount
      calculatedPremium = quickQuote.coverageAmount || 0;
    } else {
      // For other products - calculate through premiumCalculating
      try {
        const productShortCode = getProductShortCode(productName);
        if (productShortCode && Object.values(ProductType).includes(productShortCode as ProductType)) {
          const premiumParams = {
            productType: productShortCode as ProductType,
            faceAmount: quickQuote.coverageAmount || 0,
            age: quickQuote.age,
            gender: shortSex(sex),
            smokingStatus: shortSmokingStatus(smokingHabit),
            paymentMode: paymentMode as PaymentMode,
            paymentMethod: (quickQuote.paymentMethod === 'Regular' || quickQuote.paymentMethod === 'R' 
              ? PaymentMethod.Regular 
              : PaymentMethod.EFT),
          };
          const premiumResult = await calculatePremium(premiumParams);
          calculatedPremium = premiumResult.modalPremium;
        } else {
          // Fallback: use coverage amount / 1000 as rough estimate
          calculatedPremium = (quickQuote.coverageAmount || 0) / 1000;
        }
      } catch (error) {
        console.warn('[SyncService] Error calculating premium, using fallback:', error);
        calculatedPremium = (quickQuote.coverageAmount || 0) / 1000;
      }
    }

    // 8. Form QuoteData
    return {
      company,
      insured: {
        age: quickQuote.age,
        sex: sex as 'Male' | 'Female',
        smokingHabit,
      },
      payorEnabled: !!(quickQuote.payorFirstName || quickQuote.payorLastName),
      payor: (quickQuote.payorFirstName || quickQuote.payorLastName) ? {
        age: quickQuote.age,        // Use insured age (payor age not available)
        sex: 'Male' as const,       // Default (payor gender not available)
        smokingHabit: 'Non-smoker', // Default (payor smoker status not available)
      } : undefined,
      product: quickQuote.product || undefined,
      paymentMethod: quickQuote.paymentMethod || undefined,
      paymentMode: paymentMode,
      configureProduct: quickQuote.product || undefined,
      basePlan: basePlanAmount || quickQuote.coverageAmount,
      waiverOfPremium: quickQuote.waiverOfPremium || false,
      waiverOfPremiumValue: quickQuote.waiverOfPremium ? null : null,
      accidentalDeath: !!(quickQuote.accidentalDeathAdd || quickQuote.accidentalDeathAdb),
      dependentChild: quickQuote.dependentChild || false,
      guaranteedInsurability: quickQuote.guaranteedInsurability || false,
      faceAmount: quickQuote.coverageAmount || 0,
      smokingHabit,
      premium: calculatedPremium,
      status: 'sent' as const,  // Marked as 'sent' since it's already on backend
    };
  }

  /**
   * Syncs quotes from backend (downloads new quotes, removes deleted ones)
   */
  async syncQuotesFromBackend(): Promise<void> {
    if (!BACKEND_ENABLED) {
      console.log('[SyncService] Backend disabled - sync from backend skipped');
      return;
    }

    if (!navigator.onLine) {
      console.log('[SyncService] Offline - sync from backend skipped');
      return;
    }

    // Check if we're in Electron environment (CORS issues in browser)
    const isElectron = this.isElectronEnvironment();
    
    if (!isElectron) {
      console.log('[SyncService] Skipping sync from backend - not in Electron environment (CORS restrictions in browser)');
      return;
    }

    // Prevent concurrent sync operations
    if (this.isSyncingFromBackend) {
      console.log('[SyncService] Sync from backend already in progress, skipping...');
      return;
    }

    this.isSyncingFromBackend = true;
    
    console.log('[SyncService] Electron environment detected, proceeding with backend sync');

    try {
      console.log('[SyncService] Starting sync from backend...');

      // 1. First, send pending quotes
      await this.syncPendingQuickQuotes();

      // 2. Get list of quotes from backend
      let backendQuotes: any[];
      try {
        backendQuotes = await QuotesHttpService.getQuickQuoteSync();
      } catch (error: any) {
        // Handle CORS errors gracefully
        const errorMessage = error?.message || '';
        const errorCode = error?.code || '';
        const isCorsError = 
          errorMessage === 'CORS_ERROR' ||
          errorMessage.includes('CORS') || 
          errorMessage.includes('Access-Control-Allow-Origin') ||
          errorMessage.includes('Failed to fetch') ||
          errorCode === 'ERR_NETWORK' ||
          error?.response === undefined; // Network errors without response are often CORS
        
        if (isCorsError) {
          // CORS errors are expected in browser mode
          // In Electron with webSecurity: false, CORS should not occur
          // If we're in Electron and still getting CORS, webSecurity might be enabled
          const isElectron = this.isElectronEnvironment();
          if (isElectron) {
            console.warn('[SyncService] CORS error detected in Electron environment. This may indicate webSecurity is enabled. Check electron/main.ts webSecurity settings.');
          }
          // Silently return - don't spam console in browser mode
          return;
        }
        throw error;
      }
      
      const backendIds = new Set(backendQuotes.map(q => q.id));
      console.log(`[SyncService] Found ${backendIds.size} quotes on backend`);

      // 3. Get local quotes with backend_id
      const localQuotesWithBackendId = await quickQuoteQueueService.getQuotesWithBackendId();
      const localBackendIds = new Set(
        localQuotesWithBackendId
          .map(q => q.backend_id)
          .filter((id): id is number => id !== undefined && id !== null)
      );
      console.log(`[SyncService] Found ${localBackendIds.size} local quotes with backend_id`);

      // 4. Delete local quotes that are not on backend
      const quotesToDelete = localQuotesWithBackendId.filter(
        quote => quote.backend_id && !backendIds.has(quote.backend_id)
      );

      if (quotesToDelete.length > 0) {
        console.log(`[SyncService] Deleting ${quotesToDelete.length} quotes not on backend`);
        for (const quote of quotesToDelete) {
          await quickQuoteQueueService.deleteItem(quote.id);
          if (quote.quote_id) {
            await pdfQueueService.deleteByQuoteId(quote.quote_id);
            await quoteService.deleteQuote(quote.quote_id);
            // Delete illustration from illustration history
            try {
              await db.deleteIllustrationByQuoteId(quote.quote_id);
              console.log(`[SyncService] Deleted illustration for quote ${quote.quote_id}`);
            } catch (error) {
              console.warn(`[SyncService] Failed to delete illustration for quote ${quote.quote_id}:`, error);
            }
          }
        }
      }

      // 5. Delete all unsent quotes (without backend_id)
      const unsentQuotes = await quickQuoteQueueService.getQuotesWithoutBackendId();
      if (unsentQuotes.length > 0) {
        console.log(`[SyncService] Deleting ${unsentQuotes.length} unsent quotes`);
        for (const quote of unsentQuotes) {
          await quickQuoteQueueService.deleteItem(quote.id);
          if (quote.quote_id) {
            await pdfQueueService.deleteByQuoteId(quote.quote_id);
            await quoteService.deleteQuote(quote.quote_id);
            // Delete illustration from illustration history
            try {
              await db.deleteIllustrationByQuoteId(quote.quote_id);
              console.log(`[SyncService] Deleted illustration for quote ${quote.quote_id}`);
            } catch (error) {
              console.warn(`[SyncService] Failed to delete illustration for quote ${quote.quote_id}:`, error);
            }
          }
        }
      }

      // 6. Find new quotes from backend
      const newBackendIds = Array.from(backendIds).filter(
        (id: number) => !localBackendIds.has(id)
      );

      if (newBackendIds.length === 0) {
        console.log('[SyncService] No new quotes from backend');
        return;
      }

      console.log(`[SyncService] Found ${newBackendIds.length} new quotes from backend, fetching and generating PDFs...`);

      // 7. Process each new quote
      for (const backendId of newBackendIds) {
        try {
          // 7.1. Get full quote data from backend
          const quickQuote = await QuotesHttpService.getQuickQuoteById(backendId);
          console.log(`[SyncService] Fetched quote ${backendId} from backend`);

          // 7.2. Convert to QuoteData
          const quoteData = await this.convertQuickQuoteToQuoteData(quickQuote);

          // 7.3. Save to local DB
          const localQuoteId = await quoteService.createQuote(quoteData);
          console.log(`[SyncService] Saved quote ${backendId} to local DB with ID ${localQuoteId}`);

          // 7.4. Get agent data
          let agent: any = null;
          try {
            await db.init();
            const allAgents = await db.getAllAgents();
            if (allAgents.length > 0) {
              // Get the most recent agent
              agent = allAgents.sort((a, b) => 
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
              )[0];
              console.log(`[SyncService] Using agent from local storage: ${agent?.firstName} ${agent?.lastName}`);
            }
          } catch (error) {
            console.warn('[SyncService] No agent data found in local storage:', error);
          }

          // 7.5. Generate PDF locally
          let pdfPath: string;
          try {
            // Get userData path for deterministic file path
            if (!window.electron || !window.electron.app) {
              throw new Error('Electron API not available');
            }

            const userDataResult = await window.electron.app.getUserDataPath();
            if (!userDataResult.success || !userDataResult.data) {
              throw new Error('Could not get userData path');
            }

            const pdfDirectory = userDataResult.data;
            const illustrationsDir = `${pdfDirectory}/illustrations`;
            const quoteId = String(localQuoteId);
            const deterministicFileName = `quote_${quoteId}.pdf`;
            const deterministicFilePath = `${illustrationsDir}/${deterministicFileName}`;

            // Determine company logo path based on company
            let companyLogoUri: string | undefined;
            if (quoteData.company === 'CompanyA') {
              // National Farm Life
              companyLogoUri = '/nfl_brand_logo.png';
            } else if (quoteData.company === 'CompanyB') {
              // American Farm Life
              companyLogoUri = '/aml_brand_logo.jpg';
            }

            const generatedPdfPath = await pdfService.generatePdf({
              quote: { 
                ...quoteData, 
                id: localQuoteId,
                faceAmount: quoteData.faceAmount || 0,
              },
              agent: agent || undefined,
              recipientEmail: quickQuote.insuredEmail ? quickQuote.insuredEmail : 'unknown@example.com',
              insuredFirstName: quickQuote.insuredFirstName || undefined,
              insuredLastName: quickQuote.insuredLastName || undefined,
              companyLogoUri: companyLogoUri,
              deterministicPath: deterministicFilePath,
            });
            
            if (!generatedPdfPath) {
              throw new Error('Failed to generate PDF');
            }
            
            pdfPath = generatedPdfPath;
            console.log(`[SyncService] Generated PDF for quote ${backendId}: ${pdfPath}`);
          } catch (error) {
            console.error(`[SyncService] Error generating PDF for quote ${backendId}:`, error);
            throw error;
          }

          // 7.6. Convert QuickQuote back to QuickQuoteRequest format
          const quickQuoteRequest: QuickQuoteRequest = {
            insuranceCompanyId: quickQuote.insuranceCompanyId,
            age: quickQuote.age,
            gender: quickQuote.gender,
            smoker: quickQuote.smoker,
            coverageAmount: quickQuote.coverageAmount,
            termLength: quickQuote.termLength,
            state: quickQuote.state,
            product: quickQuote.product,
            paymentMethod: quickQuote.paymentMethod,
            paymentMode: quickQuote.paymentMode,
            baseMethod: quickQuote.baseMethod,
            basePlanAmount: quickQuote.basePlanAmount,
            waiverOfPremium: quickQuote.waiverOfPremium,
            accidentalDeathAdd: quickQuote.accidentalDeathAdd,
            accidentalDeathAddValue: quickQuote.accidentalDeathAddValue,
            accidentalDeathAdb: quickQuote.accidentalDeathAdb,
            accidentalDeathAdbValue: quickQuote.accidentalDeathAdbValue,
            dependentChild: quickQuote.dependentChild,
            dependentChildAmount: quickQuote.dependentChildAmount,
            guaranteedInsurability: quickQuote.guaranteedInsurability,
            guaranteedAmount: quickQuote.guaranteedAmount,
            insuredFirstName: quickQuote.insuredFirstName,
            insuredLastName: quickQuote.insuredLastName,
            insuredEmail: quickQuote.insuredEmail,
            payorFirstName: quickQuote.payorFirstName,
            payorLastName: quickQuote.payorLastName,
            payorEmail: quickQuote.payorEmail,
          };

          // 7.7. Add to queue
          await quickQuoteQueueService.addToQueue(
            quickQuoteRequest,
            pdfPath,
            localQuoteId
          );

          // 7.8. Update backend_id and status
          const queueItem = await quickQuoteQueueService.getByQuoteId(localQuoteId);
          if (queueItem) {
            await quickQuoteQueueService.updateBackendId(queueItem.id, backendId);
            await quickQuoteQueueService.updateStatus(queueItem.id, 'sent');
            console.log(`[SyncService] Updated queue item ${queueItem.id} with backend_id ${backendId}`);
          }

          // 7.9. Add to PDF queue and mark as sent
          const pdfQueueId = await pdfQueueService.addToQueueWithPath(
            {
              quote: { 
                ...quoteData, 
                id: localQuoteId,
                faceAmount: quoteData.faceAmount || 0,
              },
              agent: agent || undefined,
              recipientEmail: quickQuote.insuredEmail ? quickQuote.insuredEmail : 'unknown@example.com',
              insuredFirstName: quickQuote.insuredFirstName || undefined,
              insuredLastName: quickQuote.insuredLastName || undefined,
            },
            pdfPath
          );

          if (pdfQueueId) {
            await pdfQueueService.updateStatus(pdfQueueId, 'sent');
            console.log(`[SyncService] Added PDF to queue and marked as sent for quote ${backendId}`);
          }

          // 7.10. Save illustration to database so it appears in Illustration History
          try {
            // Format date for illustration
            const formatDate = (date: Date): string => {
              const months = [
                'January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December'
              ];
              return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
            };

            // Calculate monthly payment from quoteData
            const monthlyPayment = quoteData.premium 
              ? (quoteData.paymentMode === 'Monthly' 
                  ? quoteData.premium 
                  : quoteData.paymentMode === 'Quarterly'
                    ? quoteData.premium / 3
                    : quoteData.paymentMode === 'Semi-Annual'
                      ? quoteData.premium / 6
                      : quoteData.premium / 12)
              : 0;

            // Build policy code from quote data (same format as EmailQuotePage)
            const buildPolicyCode = (quote: QuoteData): string => {
              const product = quote.product || quote.configureProduct || 'PWL';
              const productCode = product.split(' ')[0] || 'PWL'; // Extract product code (e.g., "PWL" from "PWL - 30")
              const age = quote.insured?.age || 30;
              const genderDisplay = quote.insured?.sex === 'Female' ? 'F' : 'M';
              const smokingDisplay = quote.insured?.smokingHabit === 'Non-smoker' ? 'N' : 'S';
              return `${productCode} - ${age} - ${genderDisplay} - ${smokingDisplay}`;
            };

            const illustration = {
              id: String(localQuoteId),
              firstName: quickQuote.insuredFirstName || '',
              lastName: quickQuote.insuredLastName || '',
              email: quickQuote.insuredEmail || 'unknown@example.com',
              policyCode: buildPolicyCode(quoteData),
              date: formatDate(new Date()),
              deathBenefit: quoteData.faceAmount || 0,
              monthlyPayment: monthlyPayment,
              pdfPath: pdfPath,
              product: quoteData.product || quoteData.configureProduct,
              company: quoteData.company,
              faceAmount: quoteData.faceAmount,
              paymentMode: quoteData.paymentMode,
              insured: {
                age: quoteData.insured?.age,
                sex: quoteData.insured?.sex,
                smokingHabit: quoteData.insured?.smokingHabit,
              },
              agentId: agent?.id ? parseInt(agent.id) : undefined,
              quoteId: String(localQuoteId),
            };

            await db.saveIllustration(illustration);
            console.log(`[SyncService] Saved illustration to database for quote ${backendId} (local ID: ${localQuoteId})`);
          } catch (error) {
            console.error(`[SyncService] Error saving illustration for quote ${backendId}:`, error);
            // Don't fail the whole sync if illustration save fails
          }

          console.log(`[SyncService] Successfully synced quote ${backendId} from backend`);
        } catch (error) {
          console.error(`[SyncService] Failed to sync quote ${backendId} from backend:`, error);
          // Continue with next quote
        }
      }

      console.log(`[SyncService] Sync from backend complete - processed ${newBackendIds.length} new quotes`);
    } catch (error) {
      console.error('[SyncService] Error during sync from backend:', error);
    } finally {
      this.isSyncingFromBackend = false;
    }
  }

  /**
   * Helper to check if running in Electron environment
   * In Electron with webSecurity: false, CORS is disabled
   */
  private isElectronEnvironment(): boolean {
    if (typeof window === 'undefined') {
      return false;
    }
    
    // Check if window.electron exists and has expected properties
    // In Electron, window.electron is exposed via contextBridge in preload
    try {
      const hasElectron = 
        'electron' in window &&
        window.electron !== undefined && 
        window.electron !== null &&
        typeof window.electron === 'object';
      
      if (!hasElectron) {
        return false;
      }
      
      // Additional check: in Electron, we should have at least one of these APIs
      const hasElectronAPI = (
        window.electron?.db !== undefined ||
        window.electron?.app !== undefined ||
        window.electron?.pdf !== undefined
      );
      
      return hasElectronAPI;
    } catch (e) {
      // If accessing window.electron throws an error, we're not in Electron
      return false;
    }
  }

  /**
   * Syncs both PDFs and Quick Quotes, including deleted items and backend sync
   * В браузере ничего не синхронизируем - только в Electron
   */
  async syncAll(): Promise<void> {
    // Проверяем Electron и онлайн статус
    const isElectron = this.isElectronEnvironment();
    
    if (!isElectron) {
      // В браузере вообще ничего не делаем - CORS блокирует все запросы
      return;
    }

    // Если офлайн - не делаем запросы
    if (!navigator.onLine) {
      return;
    }

    // В Electron синхронизируем все
    await Promise.all([
      this.syncPendingQuickQuotes(),
      this.syncDeletedQuickQuotes(),
      this.syncQuotesFromBackend(),
    ]);
  }

  /**
   * Checks if PDF synchronization is currently in progress
   */
  isSyncingPdfs(): boolean {
    return this.isSyncing;
  }

  /**
   * Checks if any synchronization is currently in progress
   */
  isSyncingAny(): boolean {
    return this.isSyncing || this.isSyncingQuickQuotes || this.isSyncingFromBackend;
  }
}

export const syncService = new SyncService();
export default syncService;

