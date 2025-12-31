/**
 * AnalyticsProvider Component
 * Компонент-провайдер для инициализации и отслеживания аналитики
 * Используется внутри RouterProvider для отслеживания навигации
 */

import { useEffect, useRef } from 'react';
import { useRouter } from '@tanstack/react-router';
import { useAnalytics } from '../hooks/useAnalytics';

interface AnalyticsProviderProps {
  children: React.ReactNode;
}

/**
 * Компонент-провайдер для Firebase Analytics
 * Автоматически отслеживает навигацию и инициализирует аналитику
 * Должен использоваться ВНУТРИ RouterProvider
 */
export const AnalyticsProvider = ({ children }: AnalyticsProviderProps) => {
  const router = useRouter();
  const analytics = useAnalytics();
  const previousPathRef = useRef<string>('/');

  useEffect(() => {
    // Check if router is available
    if (!router) {
      console.warn('[Analytics] Router not available yet');
      return;
    }

    // Initialize previous path with current path on first load
    const initialPath = router.state.location.pathname || '/';
    previousPathRef.current = initialPath;

    // Track route changes
    try {
      const unsubscribe = router.subscribe('onLoad', ({ pathChanged }) => {
        if (pathChanged) {
          const currentPath = router.state.location.pathname || '/';
          
          // Log screen view (path will be normalized in firebaseService)
          analytics.trackScreenView(currentPath, 'page');
          
          // Log navigation (use saved previous path)
          const previousPath = previousPathRef.current;
          analytics.trackNavigation(previousPath, currentPath);
          
          // Update previous path for next navigation
          previousPathRef.current = currentPath;
        }
      });

      return () => {
        if (unsubscribe) {
          unsubscribe();
        }
      };
    } catch (error) {
      console.error('[Analytics] Error setting up router subscription:', error);
    }
  }, [router, analytics]);

  // Track initial screen
  useEffect(() => {
    if (router?.state?.location?.pathname) {
      const initialPath = router.state.location.pathname || '/';
      analytics.trackScreenView(initialPath, 'page');
    }
  }, [router, analytics]); // Dependencies added for correct operation

  return <>{children}</>;
};

