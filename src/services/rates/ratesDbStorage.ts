/**
 * Rates Database Storage Service
 * 
 * Service for storing and retrieving rates database version information
 * Uses localStorage for persistent storage (web/Electron compatible)
 */

const STORAGE_KEYS = {
  RATES_DB_VERSION: '@rates_db_version',
  RATES_DB_LAST_UPDATED: '@rates_db_last_updated',
} as const;

/**
 * Rates Database Storage Service
 */
class RatesDbStorageService {
  /**
   * Save rates database version
   */
  async saveVersion(version: string): Promise<void> {
    try {
      console.log('[RatesDbStorage] Saving database version:', version);
      
      localStorage.setItem(STORAGE_KEYS.RATES_DB_VERSION, version);
      localStorage.setItem(
        STORAGE_KEYS.RATES_DB_LAST_UPDATED,
        Date.now().toString()
      );
      
      console.log('[RatesDbStorage] Version saved successfully');
    } catch (error) {
      console.error('[RatesDbStorage] Error saving version:', error);
      throw error;
    }
  }

  /**
   * Get current rates database version
   * Returns default version "0.0.0" if no version is stored
   */
  async getVersion(): Promise<string | null> {
    try {
      const version = localStorage.getItem(STORAGE_KEYS.RATES_DB_VERSION);
      if (version) {
        console.log('[RatesDbStorage] Current database version:', version);
        return version;
      } else {
        console.log('[RatesDbStorage] No database version found, using default: 0.0.0');
        // Set and return default version
        const defaultVersion = '0.0.0';
        await this.saveVersion(defaultVersion);
        return defaultVersion;
      }
    } catch (error) {
      console.error('[RatesDbStorage] Error getting version:', error);
      // Return default version even on error
      return '0.0.0';
    }
  }

  /**
   * Get last update timestamp
   */
  async getLastUpdated(): Promise<number | null> {
    try {
      const timestamp = localStorage.getItem(STORAGE_KEYS.RATES_DB_LAST_UPDATED);
      if (timestamp) {
        const timestampNum = parseInt(timestamp, 10);
        console.log('[RatesDbStorage] Last updated:', new Date(timestampNum).toISOString());
        return timestampNum;
      } else {
        console.log('[RatesDbStorage] No last updated timestamp found');
        return null;
      }
    } catch (error) {
      console.error('[RatesDbStorage] Error getting last updated:', error);
      return null;
    }
  }

  /**
   * Check if update is needed by comparing versions
   * @param backendVersion - Version from backend
   * @returns true if update is needed (versions differ or no local version)
   */
  async isUpdateNeeded(backendVersion: string): Promise<boolean> {
    try {
      console.log('[RatesDbStorage] 🔍 Checking if update needed...');
      const localVersion = await this.getVersion();
      console.log('[RatesDbStorage] 📦 Local version:', localVersion);
      console.log('[RatesDbStorage] 🌐 Backend version:', backendVersion);
      
      if (!localVersion || localVersion === '0.0.0') {
        console.log('[RatesDbStorage] ✅ No local version or default version found, update needed');
        return true;
      }

      const needsUpdate = localVersion !== backendVersion;
      console.log('[RatesDbStorage] 🔄 Version comparison result:', {
        local: localVersion,
        backend: backendVersion,
        areEqual: localVersion === backendVersion,
        needsUpdate,
      });
      
      if (needsUpdate) {
        console.log('[RatesDbStorage] ✅ Update is needed (versions differ)');
      } else {
        console.log('[RatesDbStorage] ⏭️ Update not needed (versions match)');
      }
      
      return needsUpdate;
    } catch (error) {
      console.error('[RatesDbStorage] ❌ Error checking if update needed:', error);
      // If error, assume update is needed to be safe
      return true;
    }
  }

  /**
   * Clear all rates database version information
   */
  async clearVersion(): Promise<void> {
    try {
      console.log('[RatesDbStorage] Clearing database version information...');
      
      localStorage.removeItem(STORAGE_KEYS.RATES_DB_VERSION);
      localStorage.removeItem(STORAGE_KEYS.RATES_DB_LAST_UPDATED);
      
      console.log('[RatesDbStorage] Version information cleared successfully');
    } catch (error) {
      console.error('[RatesDbStorage] Error clearing version:', error);
      throw error;
    }
  }

  /**
   * Get all version information
   */
  async getVersionInfo(): Promise<{
    version: string | null;
    lastUpdated: number | null;
  }> {
    try {
      const version = await this.getVersion();
      const lastUpdated = await this.getLastUpdated();
      
      return {
        version,
        lastUpdated,
      };
    } catch (error) {
      console.error('[RatesDbStorage] Error getting version info:', error);
      return {
        version: null,
        lastUpdated: null,
      };
    }
  }
}

export const ratesDbStorage = new RatesDbStorageService();

