/**
 * Rates Service
 * 
 * Service for managing rates database version checking and updates
 */

import httpInstance from '../auth/httpInstance';
import { getApiBaseUrl } from '../../config/api';
import { ratesDbStorage } from './ratesDbStorage';

export interface DatabaseVersionResponse {
  rateDbVersion: string;
}

/**
 * Rates Service
 */
class RatesService {
  /**
   * Get database version from backend
   */
  async getDatabaseVersion(): Promise<DatabaseVersionResponse | null> {
    try {
      console.log('[RatesService] Fetching database version from backend...');
      
      const response = await httpInstance.get<DatabaseVersionResponse>(
        '/api/version/rate/latest/'
      );
      
      if (response.data?.rateDbVersion) {
        console.log('[RatesService] Database version from backend:', response.data.rateDbVersion);
        return response.data;
      }
      
      return null;
    } catch (error: any) {
      console.error('[RatesService] Error fetching database version:', error);
      return null;
    }
  }

  /**
   * Get local database version
   */
  async getLocalDatabaseVersion(): Promise<string | null> {
    try {
      return await ratesDbStorage.getVersion();
    } catch (error) {
      console.error('[RatesService] Error getting local database version:', error);
      return null;
    }
  }

  /**
   * Check if database update is needed
   */
  async checkIfUpdateNeeded(): Promise<boolean> {
    try {
      console.log('[RatesService] ⚙️ Starting checkIfUpdateNeeded...');
      
      // Получаем локальную версию
      const localVersion = await ratesDbStorage.getVersion();
      console.log('[RatesService] 📦 Local database version:', localVersion);
      
      // Получаем версию с бекенда
      const backendVersionInfo = await this.getDatabaseVersion();
      console.log('[RatesService] 🌐 Backend version response:', backendVersionInfo);
      
      if (!backendVersionInfo?.rateDbVersion) {
        // If we can't get version from backend - assume no update needed
        console.log('[RatesService] ⚠️ Could not get backend version, assuming no update needed');
        return false;
      }

      const backendVersion = backendVersionInfo.rateDbVersion;
      console.log('[RatesService] 🔍 Comparing versions:', {
        local: localVersion,
        backend: backendVersion,
      });

      const needsUpdate = await ratesDbStorage.isUpdateNeeded(backendVersion);
      console.log('[RatesService] ✅ Update needed?', needsUpdate);
      
      return needsUpdate;
    } catch (error) {
      console.error('[RatesService] ❌ Error checking if update needed:', error);
      return false;
    }
  }

  /**
   * Get version information (local and backend)
   */
  async getVersionInfo(): Promise<{
    local: string | null;
    backend: string | null;
    lastUpdated: number | null;
    needsUpdate: boolean;
  }> {
    try {
      const localVersion = await this.getLocalDatabaseVersion();
      const backendVersionInfo = await this.getDatabaseVersion();
      const versionInfo = await ratesDbStorage.getVersionInfo();
      
      const backendVersion = backendVersionInfo?.rateDbVersion || null;
      const needsUpdate = backendVersion 
        ? await ratesDbStorage.isUpdateNeeded(backendVersion)
        : false;

      return {
        local: localVersion,
        backend: backendVersion,
        lastUpdated: versionInfo.lastUpdated,
        needsUpdate,
      };
    } catch (error) {
      console.error('[RatesService] Error getting version info:', error);
      return {
        local: null,
        backend: null,
        lastUpdated: null,
        needsUpdate: false,
      };
    }
  }

  /**
   * Request database update from Electron main process
   * This method will trigger IPC call to main process to download and replace database
   */
  async requestDatabaseUpdate(accessToken?: string): Promise<{ success: boolean; version?: string | null; error?: string }> {
    try {
      console.log('[RatesService] 🔄 Starting requestDatabaseUpdate...');
      console.log('[RatesService] 📝 Access token provided:', !!accessToken);
      
      // Check if we're in Electron environment
      const isElectronEnv = typeof window !== 'undefined' && (window as any).electron;
      console.log('[RatesService] 🖥️ Electron environment detected:', isElectronEnv);
      
      if (isElectronEnv && (window as any).electron?.rates?.updateDatabase) {
        console.log('[RatesService] ✅ updateDatabase method available, calling...');
        console.log('[RatesService] 📞 Invoking electron.rates.updateDatabase...');
        
        const result = await (window as any).electron.rates.updateDatabase(accessToken);
        
        console.log('[RatesService] 📥 Result from updateDatabase:', {
          success: result.success,
          version: result.version,
          error: result.error,
          message: result.message,
        });
        
        // Сохраняем версию после успешного обновления
        if (result.success && result.version) {
          console.log('[RatesService] 💾 Saving new version to storage:', result.version);
          await ratesDbStorage.saveVersion(result.version);
          console.log('[RatesService] ✅ Version saved successfully');
        } else if (result.error) {
          console.error('[RatesService] ❌ Update failed:', result.error);
        }
        
        return result;
      } else {
        const errorMsg = !isElectronEnv 
          ? 'Not in Electron environment' 
          : 'updateDatabase method not available';
        console.error('[RatesService] ❌', errorMsg);
        console.log('[RatesService] Debug info:', {
          windowExists: typeof window !== 'undefined',
          electronExists: !!(window as any)?.electron,
          ratesExists: !!(window as any)?.electron?.rates,
          updateDatabaseExists: !!(window as any)?.electron?.rates?.updateDatabase,
        });
        return {
          success: false,
          error: errorMsg,
        };
      }
    } catch (error: any) {
      console.error('[RatesService] ❌ Exception in requestDatabaseUpdate:', error);
      console.error('[RatesService] Error stack:', error?.stack);
      return {
        success: false,
        error: error?.message || 'Unknown error',
      };
    }
  }
}

export const ratesService = new RatesService();

