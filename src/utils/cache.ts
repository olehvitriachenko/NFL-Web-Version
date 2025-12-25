// Утиліти для роботи з кешем (offline-first)

/**
 * Перевірка чи є інтернет з'єднання
 */
export const isOnline = (): boolean => {
  return navigator.onLine;
};

/**
 * Отримання даних з кешу або API (offline-first)
 */
export const getCachedData = async <T>(
  key: string,
  fetchFn: () => Promise<T>,
  cacheDuration: number = 60 * 60 * 24 * 7 // 7 днів за замовчуванням
): Promise<T> => {
  const cacheKey = `cache_${key}`;
  const timestampKey = `cache_timestamp_${key}`;

  try {
    // Спробувати отримати з кешу
    const cachedData = localStorage.getItem(cacheKey);
    const cachedTimestamp = localStorage.getItem(timestampKey);

    if (cachedData && cachedTimestamp) {
      const age = Date.now() - parseInt(cachedTimestamp, 10);
      const maxAge = cacheDuration * 1000;

      // Якщо кеш актуальний, повернути його
      if (age < maxAge) {
        return JSON.parse(cachedData) as T;
      }
    }

    // Якщо кеш застарів або відсутній, спробувати отримати з API
    if (isOnline()) {
      try {
        const data = await fetchFn();
        // Зберегти в кеш
        localStorage.setItem(cacheKey, JSON.stringify(data));
        localStorage.setItem(timestampKey, Date.now().toString());
        return data;
      } catch (error) {
        // Якщо API не працює, повернути старий кеш якщо він є
        if (cachedData) {
          console.warn('API недоступний, використовую кешовані дані');
          return JSON.parse(cachedData) as T;
        }
        throw error;
      }
    } else {
      // Офлайн режим - повернути кеш якщо є
      if (cachedData) {
        console.warn('Офлайн режим, використовую кешовані дані');
        return JSON.parse(cachedData) as T;
      }
      throw new Error('Немає інтернету та кешованих даних');
    }
  } catch (error) {
    console.error('Помилка при отриманні даних:', error);
    throw error;
  }
};

/**
 * Очищення кешу
 */
export const clearCache = (key?: string): void => {
  if (key) {
    localStorage.removeItem(`cache_${key}`);
    localStorage.removeItem(`cache_timestamp_${key}`);
  } else {
    // Очистити весь кеш
    const keys = Object.keys(localStorage);
    keys.forEach((k) => {
      if (k.startsWith('cache_')) {
        localStorage.removeItem(k);
      }
    });
  }
};

/**
 * Збереження даних в кеш
 */
export const setCache = <T>(key: string, data: T): void => {
  const cacheKey = `cache_${key}`;
  const timestampKey = `cache_timestamp_${key}`;
  
  localStorage.setItem(cacheKey, JSON.stringify(data));
  localStorage.setItem(timestampKey, Date.now().toString());
};

/**
 * Отримання даних з кешу без оновлення
 */
export const getCache = <T>(key: string): T | null => {
  const cacheKey = `cache_${key}`;
  const cachedData = localStorage.getItem(cacheKey);
  
  if (cachedData) {
    return JSON.parse(cachedData) as T;
  }
  
  return null;
};

/**
 * Слухач змін мережевого стану
 */
export const onNetworkStatusChange = (callback: (isOnline: boolean) => void): (() => void) => {
  const handleOnline = () => callback(true);
  const handleOffline = () => callback(false);

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  // Повернути функцію для видалення слухачів
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
};

