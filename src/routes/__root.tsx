import { createRootRoute, Outlet, useRouter } from '@tanstack/react-router';
import { useEffect } from 'react';
import { saveCurrentPath } from '../utils/navigation';

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

    return (
      <div>
        <Outlet />
      </div>
    );
  },
});

