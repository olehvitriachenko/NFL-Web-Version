/**
 * Auth Storage Service
 * 
 * Service for storing and retrieving authentication tokens
 * Uses localStorage for persistent storage (web/Electron compatible)
 */

export type Token = {
  token: string;
  expires_at: number; // Unix timestamp (seconds)
  user_id: number;
};

export type Tokens = {
  access?: Token | null;
  refresh?: Token | null;
};

const STORAGE_KEYS = {
  ACCESS_TOKEN: '@auth_access_token',
  REFRESH_TOKEN: '@auth_refresh_token',
  TOKEN_EXPIRES_AT: '@auth_token_expires_at',
  REFRESH_TOKEN_EXPIRES_AT: '@auth_refresh_token_expires_at',
  USER_ID: '@auth_user_id',
} as const;

/**
 * Auth Storage Service
 */
class AuthStorageService {
  /**
   * Save tokens to storage
   */
  async saveTokens(tokens: Tokens): Promise<void> {
    try {
      console.log('[AuthStorage] Saving tokens...');
      
      if (tokens.access) {
        const expiresAt = new Date(tokens.access.expires_at * 1000);
        console.log('[AuthStorage] Saving access token:', {
          userId: tokens.access.user_id,
          expiresAt: expiresAt.toISOString(),
          expiresIn: tokens.access.expires_at - Math.floor(Date.now() / 1000),
        });
        
        localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, tokens.access.token);
        localStorage.setItem(
          STORAGE_KEYS.TOKEN_EXPIRES_AT,
          tokens.access.expires_at.toString()
        );
        localStorage.setItem(
          STORAGE_KEYS.USER_ID,
          tokens.access.user_id.toString()
        );
      }

      if (tokens.refresh) {
        const expiresAt = new Date(tokens.refresh.expires_at * 1000);
        console.log('[AuthStorage] Saving refresh token:', {
          userId: tokens.refresh.user_id,
          expiresAt: expiresAt.toISOString(),
          expiresIn: tokens.refresh.expires_at - Math.floor(Date.now() / 1000),
        });
        
        localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, tokens.refresh.token);
        localStorage.setItem(
          STORAGE_KEYS.REFRESH_TOKEN_EXPIRES_AT,
          tokens.refresh.expires_at.toString()
        );
      }
      
      console.log('[AuthStorage] Tokens saved successfully');
    } catch (error) {
      console.error('[AuthStorage] Error saving tokens:', error);
      throw error;
    }
  }

  /**
   * Get refresh token
   */
  getRefreshToken(): string | null {
    try {
      return localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
    } catch (error) {
      console.error('[AuthStorage] Error getting refresh token:', error);
      return null;
    }
  }

  /**
   * Check if refresh token is expired
   */
  isRefreshTokenExpired(): boolean {
    try {
      const expiresAt = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN_EXPIRES_AT);
      if (!expiresAt) {
        console.log('[AuthStorage] Refresh token expiration not found - considering expired');
        return true;
      }

      const expiresAtTimestamp = parseInt(expiresAt, 10);
      const now = Math.floor(Date.now() / 1000); // Current time in seconds
      const isExpired = now >= expiresAtTimestamp;

      console.log('[AuthStorage] Refresh token expiration check:', {
        expiresAt: new Date(expiresAtTimestamp * 1000).toISOString(),
        now: new Date(now * 1000).toISOString(),
        isExpired,
      });

      return isExpired;
    } catch (error) {
      console.error('[AuthStorage] Error checking refresh token expiration:', error);
      return true;
    }
  }

  /**
   * Check if user has valid refresh token
   */
  hasValidRefreshToken(): boolean {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      return false;
    }
    
    return !this.isRefreshTokenExpired();
  }

  /**
   * Get access token
   */
  async getAccessToken(): Promise<string | null> {
    try {
      return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    } catch (error) {
      console.error('[AuthStorage] Error getting access token:', error);
      return null;
    }
  }

  /**
   * Clear all tokens
   */
  async clearTokens(): Promise<void> {
    try {
      console.log('[AuthStorage] Clearing all tokens...');
      
      localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.TOKEN_EXPIRES_AT);
      localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN_EXPIRES_AT);
      localStorage.removeItem(STORAGE_KEYS.USER_ID);
      
      console.log('[AuthStorage] All tokens cleared successfully');
    } catch (error) {
      console.error('[AuthStorage] Error clearing tokens:', error);
      throw error;
    }
  }
}

export const authStorage = new AuthStorageService();

