import { createRootRoute, Outlet, useRouter } from '@tanstack/react-router';
import { useEffect } from 'react';
import { saveCurrentPath } from '../utils/navigation';
import { authStorage } from '../services/auth/authStorage';
import { syncService } from '../services/quotes/syncService';
import { ratesService } from '../services/rates/ratesService';
import { isOnline } from '../utils/cache';
import { AnalyticsProvider } from '../components/AnalyticsProvider';

// Функція для нормалізації шляху - витягує правильний шлях з Windows шляху
const normalizeRouterPath = (path: string): string => {
  const windowsDrivePattern = /^\/[A-Za-z]:\//;
  
  // Якщо це Windows шлях типу /C:/home, витягуємо тільки /home
  if (windowsDrivePattern.test(path)) {
    // Видаляємо /C:/ або /D:/ і т.д.
    const match = path.match(/^\/[A-Za-z]:\/(.+)$/);
    if (match && match[1]) {
      return '/' + match[1];
    }
    return '/';
  }
  
  return path;
};

export const Route = createRootRoute({
  component: () => {
    const router = useRouter();
    const isElectron = typeof window !== "undefined" && window.location.protocol === "file:";

    // Log all path changes
    useEffect(() => {
      console.log('[Root] 📍 Path changed:', {
        pathname: router.state.location.pathname,
        search: router.state.location.search,
        hash: router.state.location.hash,
        href: router.state.location.href
      });
    }, [router.state.location.pathname, router.state.location.search, router.state.location.hash]);

    // Check authentication on path change
    useEffect(() => {
      const currentPath = router.state.location.pathname;
      const publicPaths = ['/', '/oauth-callback'];
      const hasValidToken = authStorage.hasValidRefreshToken();

      // If user is on login page and has valid token, redirect to home
      if (currentPath === '/' && hasValidToken) {
        console.log('[Root] 🔀 User has valid token, redirecting to home');
        router.navigate({ to: '/home' });
        return;
      }

      // Skip auth check for login and oauth-callback pages
      if (publicPaths.includes(currentPath)) {
        return;
      }

      // If user is on protected page and doesn't have valid token, redirect to login
      if (!hasValidToken) {
        console.log('[Root] 🔀 No valid refresh token, redirecting to login');
        router.navigate({ to: '/' });
      }
    }, [router.state.location.pathname, router]);

    // Unified sync function: rates database update + quotes sync
    useEffect(() => {
      const syncAllData = async () => {
        console.log('[Root] 🔄 Starting unified sync: rates database + quotes...');
        
        // Проверяем, что мы в Electron окружении (для обновления БД)
        const isElectronEnv = typeof window !== 'undefined' && 
          (window.location.protocol === 'file:' || (window as any).electron);
        
        // Проверяем сетевое подключение
        const online = isOnline();
        if (!online) {
          console.log('[Root] ⏭️ User is offline, skipping sync');
          return;
        }

        // Проверяем авторизацию
        const hasValidToken = authStorage.hasValidRefreshToken();
        if (!hasValidToken) {
          console.log('[Root] ⏭️ User not authenticated, skipping sync');
          return;
        }

        // Получаем access token
        const accessToken = await authStorage.getAccessToken();
        if (!accessToken) {
          console.log('[Root] ⏭️ No access token available, skipping sync');
          return;
        }

        try {
          // Задержка для инициализации UI
          await new Promise(resolve => setTimeout(resolve, 500));

          // Выполняем синхронизацию параллельно
          const syncPromises: Promise<any>[] = [];

          // 1. Проверка и обновление rates базы данных (только в Electron)
          if (isElectronEnv) {
            console.log('[Root] 📊 Checking rates database version...');
            const ratesDbPromise = (async () => {
              try {
                const needsUpdate = await ratesService.checkIfUpdateNeeded();
                console.log('[Root] 📊 Rates database update needed:', needsUpdate);
                
                if (needsUpdate) {
                  console.log('[Root] 🔄 Updating rates database...');
                  const result = await ratesService.requestDatabaseUpdate(accessToken);
                  
                  if (result.success) {
                    console.log('[Root] ✅ Rates database updated successfully, version:', result.version);
                  } else {
                    console.warn('[Root] ❌ Rates database update failed:', result.error);
                  }
                  
                  return { type: 'rates', success: result.success, error: result.error };
                } else {
                  console.log('[Root] ✅ Rates database is up to date');
                  return { type: 'rates', success: true, upToDate: true };
                }
              } catch (error) {
                console.error('[Root] ❌ Error updating rates database:', error);
                return { type: 'rates', success: false, error };
              }
            })();
            syncPromises.push(ratesDbPromise);
          } else {
            console.log('[Root] ⏭️ Skipping rates database check (not Electron environment)');
          }

          // 2. Синхронизация котировок
          console.log('[Root] 📝 Syncing quotes...');
          const quotesSyncPromise = (async () => {
            try {
              await syncService.syncAll();
              console.log('[Root] ✅ Quotes synced successfully');
              return { type: 'quotes', success: true };
            } catch (error) {
              console.error('[Root] ❌ Error syncing quotes:', error);
              return { type: 'quotes', success: false, error };
            }
          })();
          syncPromises.push(quotesSyncPromise);

          // Ждем завершения всех синхронизаций
          const results = await Promise.allSettled(syncPromises);
          
          console.log('[Root] 📊 Sync results:', results.map((r, i) => ({
            status: r.status,
            result: r.status === 'fulfilled' ? r.value : r.reason,
          })));

          const successful = results.filter(r => r.status === 'fulfilled' && 
            (r.value?.success !== false)).length;
          const failed = results.length - successful;

          if (failed === 0) {
            console.log('[Root] ✅ All sync operations completed successfully');
          } else {
            console.warn(`[Root] ⚠️ Sync completed with ${failed} failure(s) out of ${results.length} operation(s)`);
          }
        } catch (error) {
          console.error('[Root] ❌ Exception in syncAllData:', error);
          console.error('[Root] Error stack:', (error as Error)?.stack);
          // Не блокируем работу приложения при ошибке синхронизации
        }
      };

      // Запускаем синхронизацию через небольшую задержку
      console.log('[Root] ⏱️ Scheduling unified sync in 1000ms...');
      setTimeout(() => {
        syncAllData().catch(error => {
          console.error('[Root] ❌ Unhandled error in syncAllData:', error);
        });
      }, 1000);
    }, []);

    useEffect(() => {
      // Зберігаємо поточний шлях при зміні
      const path = router.state.location.pathname;
      const normalized = normalizeRouterPath(path);
      
      // Якщо шлях неправильний (Windows шлях), виправляємо його
      if (isElectron && path !== normalized) {
        router.navigate({ to: normalized, replace: true });
        return;
      }
      
      // Зберігаємо нормалізований шлях
      saveCurrentPath(normalized);
    }, [router.state.location.pathname, router, isElectron]);

    // Для Electron: виправляємо шлях при popstate
    useEffect(() => {
      if (!isElectron) return;
      
      const handlePopState = () => {
        setTimeout(() => {
          const currentPath = router.state.location.pathname;
          const normalized = normalizeRouterPath(currentPath);
          
          if (currentPath !== normalized) {
            router.navigate({ to: normalized, replace: true });
          }
        }, 0);
      };
      
      window.addEventListener('popstate', handlePopState);
      
      return () => {
        window.removeEventListener('popstate', handlePopState);
      };
    }, [router, isElectron]);

    // Для Electron: слушаем OAuth callback от main process и навигируем на callback страницу
    useEffect(() => {
      if (!isElectron) return;

      const electron = (window as any).electron;
      if (!electron || !electron.onOAuthCallback) return;

      const cleanup = electron.onOAuthCallback((data: { code?: string; state?: string; error?: string; errorDescription?: string }) => {
        console.log('[Root] 🔀 OAuth callback received via protocol, navigating to callback page...');
        console.log('[Root] OAuth data:', data);
        
        // Навигируем на callback страницу, если мы не на ней
        const currentPath = router.state.location.pathname;
        if (currentPath !== '/oauth-callback') {
          console.log('[Root] 🔀 Navigating from', currentPath, 'to /oauth-callback');
          router.navigate({ 
            to: '/oauth-callback',
            search: {} as any, // Search params are optional for this route
          });
        } else {
          console.log('[Root] Already on /oauth-callback, skipping navigation');
        }
      });

      return cleanup;
    }, [router, isElectron]);

    return (
      <AnalyticsProvider>
        <div>
          <Outlet />
        </div>
      </AnalyticsProvider>
    );
  },
});

