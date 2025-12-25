/**
 * Приклад використання offline-first підходу
 * 
 * Цей файл демонструє, як використовувати useOfflineCache хук
 * для роботи з API в офлайн-режимі
 */

import { useOfflineCache } from '../hooks/useOfflineCache';
import axios from 'axios';

// Приклад: отримання даних з API
export const ExampleComponent = () => {
  const { data, loading, error, isOffline, refresh } = useOfflineCache(
    'example-data', // ключ кешу
    async () => {
      // Функція для отримання даних з API
      const response = await axios.get('/api/data');
      return response.data;
    },
    60 * 60 * 24 * 7 // кешувати на 7 днів
  );

  if (loading) {
    return <div>Завантаження...</div>;
  }

  if (error) {
    return <div>Помилка: {error.message}</div>;
  }

  return (
    <div>
      {isOffline && <p>⚠️ Офлайн режим - показую кешовані дані</p>}
      <button onClick={refresh}>Оновити дані</button>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
};

// Приклад: робота з SQLite через better-sqlite3 (для Electron)
// У Electron можна використовувати better-sqlite3 напряму
// Для веб-версії потрібно використовувати API або IndexedDB

