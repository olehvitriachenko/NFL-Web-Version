/**
 * Navigation utilities that work in both web and Electron
 */
import { useRouter } from '@tanstack/react-router';

// Зберігаємо попередній шлях
let previousPath: string | null = null;
let currentPath: string | null = null;

/**
 * Нормалізувати шлях - видалити Windows шляхи типу /C:/home
 */
const normalizePath = (path: string): string => {
  // Перевіряємо, чи це Windows шлях (наприклад /C:/, /D:/)
  const windowsDrivePattern = /^\/[A-Za-z]:\//;
  if (windowsDrivePattern.test(path)) {
    // Якщо це Windows шлях, витягуємо частину після останнього слешу
    const parts = path.split('/').filter(p => p && !p.includes(':'));
    return '/' + parts.join('/') || '/';
  }
  return path;
};

/**
 * Зберегти поточний шлях перед навігацією
 */
export const saveCurrentPath = (path: string) => {
  const normalized = normalizePath(path);
  if (currentPath !== normalized) {
    previousPath = currentPath;
    currentPath = normalized;
  }
};

/**
 * Navigate back to previous page
 * Works in both web and Electron
 * Uses browser history API (like browser back button)
 */
export const navigateBack = (
  router: ReturnType<typeof useRouter>,
  fallbackNavigate: () => void
) => {
  // Спочатку пробуємо використати window.history.back() - це працює як браузерна кнопка "назад"
  // і використовує реальну історію навігації
  if (typeof window !== 'undefined' && window.history && window.history.length > 1) {
    window.history.back();
    return;
  }

  // Якщо історії немає, пробуємо використати збережений попередній шлях
  const currentRouterPath = normalizePath(router.state.location.pathname);
  if (previousPath && previousPath !== currentRouterPath) {
    try {
      router.navigate({ to: previousPath });
      return;
    } catch (error) {
      console.warn('Navigation to previous path failed:', error);
    }
  }

  // Якщо все не працює, використовуємо fallback
  fallbackNavigate();
};

