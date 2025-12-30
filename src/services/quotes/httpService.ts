/**
 * HTTP Service for Quick Quotes API
 */

import httpInstance from '../auth/httpInstance';
import type { QuickQuote, QuickQuoteRequest, QuickQuoteSync } from '../../types/quotes';

export class QuotesHttpService {
  /**
   * Create a new quick quote
   * @param params - Quick quote data (can be QuickQuoteRequest object or FormData with PDF)
   * @returns Created QuickQuote
   * @throws Error if creation fails
   */
  static async createQuickQuote(params: QuickQuoteRequest | FormData): Promise<QuickQuote> {
    try {
      // Check if access token exists
      const accessToken = localStorage.getItem('@auth_access_token');
      if (!accessToken) {
        throw new Error('Access token not found. Please login again.');
      }

      console.log('[QuotesHttpService] Sending request with token:', accessToken.substring(0, 20) + '...');
      
      // For FormData, don't set Content-Type header - browser will set it automatically with boundary
      // The interceptor will add Authorization header automatically
      const config = params instanceof FormData 
        ? {
            // Don't set Content-Type - browser will set it with boundary for multipart/form-data
            // Authorization will be added by interceptor
          }
        : {
            headers: {
              'Content-Type': 'application/json',
            }
          };
      
      const response = await httpInstance.post<QuickQuote>(
        '/api/quick-quote/',
        params,
        config
      );
      return response.data;
    } catch (error: any) {
      console.error('[QuotesHttpService] Create quick quote error:', error);
      console.error('[QuotesHttpService] Error details:', {
        status: error?.response?.status,
        statusText: error?.response?.statusText,
        data: error?.response?.data,
        message: error?.message,
        hasToken: !!localStorage.getItem('@auth_access_token'),
        url: error?.config?.url,
        method: error?.config?.method,
      });
      throw error;
    }
  }

  /**
   * Get quick quote sync data (IDs and CreatedAt timestamps)
   * Lightweight endpoint for synchronization
   * @returns Array of QuickQuoteSync objects
   * @throws Error if request fails
   */
  static async getQuickQuoteSync(): Promise<QuickQuoteSync[]> {
    try {
      const response = await httpInstance.get<QuickQuoteSync[]>(
        '/api/quick-quote/sync/'
      );
      return response.data;
    } catch (error: any) {
      // Check if this is a CORS error (expected in browser mode)
      const errorMessage = error?.message || '';
      const errorCode = error?.code || '';
      const isCorsError = 
        errorMessage.includes('CORS') || 
        errorMessage.includes('Access-Control-Allow-Origin') ||
        errorMessage.includes('Failed to fetch') ||
        errorCode === 'ERR_NETWORK' ||
        (error?.response === undefined && errorMessage.includes('Network Error'));
      
      if (isCorsError) {
        // CORS errors are expected in browser mode - don't log as error
        // The sync service will handle this gracefully
        throw new Error('CORS_ERROR');
      }
      
      console.error('[QuotesHttpService] Get quick quote sync error:', error);
      throw error;
    }
  }

  /**
   * Get quick quote by ID from backend
   * @param id - Backend quote ID
   * @returns QuickQuote
   * @throws Error if request fails
   */
  static async getQuickQuoteById(id: number): Promise<QuickQuote> {
    try {
      const response = await httpInstance.get<QuickQuote>(
        `/api/quick-quote/${id}/`
      );
      return response.data;
    } catch (error) {
      console.error('[QuotesHttpService] Get quick quote by ID error:', error);
      throw error;
    }
  }

  /**
   * Delete quick quote from backend
   * @param id - Backend quote ID
   * @throws Error if deletion fails
   */
  static async deleteQuickQuote(id: number): Promise<void> {
    try {
      await httpInstance.delete(`/api/quick-quote/${id}/`);
    } catch (error: any) {
      console.error('[QuotesHttpService] Delete quick quote error:', error);
      throw error;
    }
  }
}

export default QuotesHttpService;

