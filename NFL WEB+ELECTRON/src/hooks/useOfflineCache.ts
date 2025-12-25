import { useState, useEffect, useCallback } from 'react';
import { isOnline, getCachedData, setCache, getCache, onNetworkStatusChange } from '../utils/cache';

/**
 * Хук для роботи з кешем та офлайн-режимом
 */
export const useOfflineCache = <T>(
  key: string,
  fetchFn: () => Promise<T>,
  cacheDuration?: number
) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isOffline, setIsOffline] = useState(!isOnline());

  // Завантаження даних
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await getCachedData(key, fetchFn, cacheDuration);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Помилка завантаження'));
      // Спробувати отримати старі дані з кешу
      const cached = getCache<T>(key);
      if (cached) {
        setData(cached);
      }
    } finally {
      setLoading(false);
    }
  }, [key, fetchFn, cacheDuration]);

  // Оновлення даних
  const refresh = useCallback(async () => {
    await loadData();
  }, [loadData]);

  // Збереження даних в кеш
  const updateCache = useCallback((newData: T) => {
    setCache(key, newData);
    setData(newData);
  }, [key]);

  // Відстеження змін мережевого стану
  useEffect(() => {
    const unsubscribe = onNetworkStatusChange((online) => {
      setIsOffline(!online);
      if (online) {
        // При відновленні з'єднання оновити дані
        loadData();
      }
    });

    return unsubscribe;
  }, [loadData]);

  // Завантажити дані при монтуванні
  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    data,
    loading,
    error,
    isOffline,
    refresh,
    updateCache,
  };
};

/**
 * Хук для відстеження мережевого стану
 */
export const useNetworkStatus = () => {
  const [isOnlineState, setIsOnlineState] = useState(isOnline());

  useEffect(() => {
    const unsubscribe = onNetworkStatusChange((online) => {
      setIsOnlineState(online);
    });

    return unsubscribe;
  }, []);

  return {
    isOnline: isOnlineState,
    isOffline: !isOnlineState,
  };
};

