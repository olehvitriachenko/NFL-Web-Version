/**
 * Firebase Configuration
 * Определение окружения и конфигурации Firebase для разных окружений
 */

// Определение окружения
export const isDev = import.meta.env.DEV || import.meta.env.MODE === 'development';

// Интерфейс для конфигурации Firebase
export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
}

/**
 * Получение конфигурации Firebase в зависимости от окружения
 */
export const getFirebaseConfig = (): FirebaseConfig | null => {
  // Попытка получить конфигурацию из переменных окружения
  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
  const authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN;
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
  const storageBucket = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET;
  const messagingSenderId = import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID;
  const appId = import.meta.env.VITE_FIREBASE_APP_ID;
  const measurementId = import.meta.env.VITE_FIREBASE_MEASUREMENT_ID;

  // Проверка наличия обязательных параметров
  if (!apiKey || !authDomain || !projectId || !storageBucket || !messagingSenderId || !appId) {
    console.warn('[Firebase] Конфигурация не найдена. Проверьте переменные окружения.');
    return null;
  }

  return {
    apiKey,
    authDomain,
    projectId,
    storageBucket,
    messagingSenderId,
    appId,
    measurementId,
  };
};

/**
 * Получение текущего окружения
 */
export const getEnvironment = (): 'dev' | 'prod' => {
  return isDev ? 'dev' : 'prod';
};

