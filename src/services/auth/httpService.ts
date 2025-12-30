/**
 * HTTP Service - Authentication Methods
 */

import httpInstance from './httpInstance';
import { authStorage, type Tokens } from './authStorage';

export type AuthenticationResponse = {
  tokens?: Tokens;
  user?: any;
};

/**
 * HTTP Service for Authentication
 */
export class HttpService {
  /**
   * Login with NFLIC OAuth access token
   * @param accessTokenNfl - OAuth access token from NFLIC
   * @returns AuthenticationResponse with backend tokens and user data
   */
  static async loginNfl(accessTokenNfl: string): Promise<AuthenticationResponse> {
    try {
      console.log('[HttpService] Logging in with NFLIC OAuth token');
      
      const response = await httpInstance.post<AuthenticationResponse>('/api/nfl/sign-in/', {
        accessToken: accessTokenNfl,
      });

      if (response.data.tokens) {
        await authStorage.saveTokens(response.data.tokens);
        console.log('[HttpService] NFL login successful, tokens saved');
      }

      return response.data;
    } catch (error) {
      console.error('[HttpService] Login NFL error:', error);
      throw error;
    }
  }
}

export default HttpService;

