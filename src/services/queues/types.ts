/**
 * Types for PDF and Quick Quote queues
 */

export type PdfQueueStatus = 'pending' | 'sending' | 'sent' | 'failed' | 'deleted';
export type QuickQuoteQueueStatus = 'pending' | 'sending' | 'sent' | 'failed' | 'deleted';

export interface PdfQueueItem {
  id: number;
  quote_id?: number;
  agent_id?: number;
  pdf_path?: string;
  recipient_email: string;
  recipient_name?: string;
  recipient_first_name?: string;
  recipient_last_name?: string;
  status: PdfQueueStatus;
  retry_count: number;
  error_message?: string;
  death_benefit?: number;
  monthly_payment?: number;
  created_at: number;
  updated_at: number;
}

export interface QuickQuoteQueueItem {
  id: number;
  quote_id?: number;
  request_data: any;
  pdf_path: string;
  status: QuickQuoteQueueStatus;
  retry_count: number;
  error_message?: string;
  backend_id?: number;
  created_at: number;
  updated_at: number;
}

