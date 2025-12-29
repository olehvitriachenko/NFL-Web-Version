/**
 * Navigation utilities that work in both web and Electron
 */
import { useRouter } from '@tanstack/react-router';

// Зберігаємо попередній шлях
let previousPath: string | null = null;
let currentPath: string | null = null;
// Стек навігації для відстеження історії
const navigationStack: string[] = [];
// Прапорець для відстеження навігації назад
let isNavigatingBack = false;

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
    // Додаємо попередній шлях до стеку, якщо він існує і відрізняється
    // Але не додаємо, якщо ми навігуємо назад (щоб уникнути циклів)
    if (currentPath && currentPath !== normalized && !isNavigatingBack) {
      // Перевіряємо, чи останній елемент стеку не є поточним шляхом
      if (navigationStack.length === 0 || navigationStack[navigationStack.length - 1] !== currentPath) {
        navigationStack.push(currentPath);
      }
    }
    previousPath = currentPath;
    currentPath = normalized;
    // Скидаємо прапорець після збереження
    isNavigatingBack = false;
    // Обмежуємо розмір стеку до 50 елементів
    if (navigationStack.length > 50) {
      navigationStack.shift();
    }
  }
};

/**
 * Navigate back to previous page
 * Works in both web and Electron
 * Uses navigation stack, router history, or saved previous path
 */
export const navigateBack = (
  router: ReturnType<typeof useRouter>,
  fallbackNavigate: () => void
) => {
  const currentRouterPath = normalizePath(router.state.location.pathname);
  
  // Встановлюємо прапорець, що ми навігуємо назад
  isNavigatingBack = true;
  
  // Спочатку пробуємо використати стек навігації
  // Видаляємо поточний шлях зі стеку, якщо він там є
  while (navigationStack.length > 0 && navigationStack[navigationStack.length - 1] === currentRouterPath) {
    navigationStack.pop();
  }
  
  // Беремо останній шлях зі стеку
  if (navigationStack.length > 0) {
    const lastPath = navigationStack.pop();
    if (lastPath && lastPath !== currentRouterPath) {
      try {
        router.navigate({ to: lastPath });
        return;
      } catch (error) {
        console.warn('Navigation to stack path failed:', error);
        isNavigatingBack = false;
      }
    }
  }
  
  // Якщо стек порожній, пробуємо використати збережений попередній шлях
  if (previousPath && previousPath !== currentRouterPath && previousPath !== '/') {
    try {
      router.navigate({ to: previousPath });
      return;
    } catch (error) {
      console.warn('Navigation to previous path failed:', error);
      isNavigatingBack = false;
    }
  }

  // Якщо немає збереженого шляху, пробуємо використати router history
  if (router.history && typeof router.history.go === 'function') {
    try {
      router.history.go(-1);
      return;
    } catch (error) {
      console.warn('Router history.go failed:', error);
    }
  }

  // Якщо router.history не працює, пробуємо window.history.back()
  if (typeof window !== 'undefined' && window.history && window.history.length > 1) {
    try {
    window.history.back();
    return;
    } catch (error) {
      console.warn('Window history.back failed:', error);
    }
  }

  // Скидаємо прапорець, якщо нічого не спрацювало
  isNavigatingBack = false;

  // Якщо все не працює, використовуємо fallback
  fallbackNavigate();
};

