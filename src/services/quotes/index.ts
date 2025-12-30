/**
 * Quotes Services
 * Export all quote-related services
 */

export { quoteService } from './quoteService';
export { quickQuoteQueueService } from './quickQuoteQueueService';
export { pdfQueueService } from './pdfQueueService';
export { syncService } from './syncService';
export { default as QuotesHttpService } from './httpService';
export { databaseAdapter } from './databaseAdapter';

export type {
  QuoteData,
  QuotePersonData,
  QuickQuoteRequest,
  QuickQuote,
  QuickQuoteSync,
  QuickQuoteQueueItem,
  QuickQuoteQueueStatus,
  PdfQueueItem,
  PdfQueueStatus,
} from '../../types/quotes';

